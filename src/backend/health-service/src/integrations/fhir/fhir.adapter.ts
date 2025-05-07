import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import FhirClient from 'fhir-kit-client';
import axios from 'axios';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Import from @austa/interfaces for type safety
import { IMedicalEvent, IHealthMetric } from '@austa/interfaces/journey/health';
import { FHIRPatientResource, FHIRConditionResource, FHIRSearchResponse } from '@austa/interfaces/journey/health/fhir';

// Import from @app path aliases for consistent code organization
import { ConfigService } from '@app/config';
import { LoggerService } from '@app/shared/logging';
import { TracingService } from '@app/shared/tracing';
import { truncate } from '@app/shared/utils/string';

// Import from error handling framework
import { 
  ExternalApiError, 
  ExternalDependencyUnavailableError,
  ExternalRateLimitError,
  ExternalResponseFormatError
} from '@austa/errors/categories';
import { CircuitBreaker } from '@austa/errors/utils';

/**
 * Configuration interface for the FHIR adapter
 */
interface FHIRAdapterConfig {
  fhirApiEnabled: boolean;
  fhirApiUrl: string;
  fhirApiAuthType: 'oauth2' | 'basic' | 'none';
  fhirApiUsername?: string;
  fhirApiPassword?: string;
  fhirApiAccessToken?: string;
  medicalHistoryMaxEvents: number;
  retryAttempts: number;
  retryDelayMs: number;
  circuitBreakerFailureThreshold: number;
  circuitBreakerResetTimeoutMs: number;
}

/**
 * Event payload for FHIR data retrieval events
 */
interface FHIRDataRetrievedEvent {
  patientId: string;
  resourceType: string;
  count: number;
  timestamp: Date;
  source: string;
}

/**
 * Adapts communication with FHIR-compliant systems to retrieve medical records and history.
 * This adapter handles authentication, data transformation, and error handling specific to FHIR APIs,
 * providing a consistent interface for the Health Service.
 * 
 * Addresses requirements:
 * - F-101: Integrates with external health record systems
 * - F-101-RQ-002: Retrieves chronological medical events with contextual information
 * - F-103-RQ-001: Display Medical History View requires retrieval of medical events from FHIR API
 */
@Injectable()
export class FHIRAdapter implements OnModuleInit {
  private fhirClient: FhirClient;
  private config: FHIRAdapterConfig;
  private circuitBreaker: CircuitBreaker;

  /**
   * Initializes the FHIRAdapter.
   * 
   * @param configService - Configuration service for environment-specific settings
   * @param logger - Logger service for consistent logging
   * @param tracingService - Tracing service for distributed tracing
   * @param eventEmitter - Event emitter for publishing events
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Initialize the adapter when the module is initialized
   */
  onModuleInit(): void {
    this.initialize();
  }

  /**
   * Initializes the adapter with configuration and FHIR client setup
   */
  private initialize(): void {
    try {
      // Load configuration
      this.config = this.configService.get<FHIRAdapterConfig>('health.fhir');
      
      // Set up circuit breaker for external API calls
      this.circuitBreaker = new CircuitBreaker({
        failureThreshold: this.config.circuitBreakerFailureThreshold || 5,
        resetTimeout: this.config.circuitBreakerResetTimeoutMs || 30000,
        onOpen: () => this.logger.warn('FHIR API circuit breaker opened', 'FHIRAdapter'),
        onClose: () => this.logger.log('FHIR API circuit breaker closed', 'FHIRAdapter'),
        onHalfOpen: () => this.logger.log('FHIR API circuit breaker half-open', 'FHIRAdapter')
      });
      
      // Check if FHIR API is enabled
      if (!this.config.fhirApiEnabled) {
        this.logger.warn('FHIR API is disabled in configuration', 'FHIRAdapter');
        return;
      }

      // Initialize FHIR client
      this.fhirClient = new FhirClient({
        baseUrl: this.config.fhirApiUrl,
        customHeaders: this.getAuthHeaders()
      });

      this.logger.log('FHIR adapter initialized successfully', 'FHIRAdapter');
    } catch (error) {
      this.logger.error('Failed to initialize FHIR adapter', error.stack, 'FHIRAdapter');
      throw new ExternalApiError(
        'Failed to initialize FHIR adapter',
        'HEALTH_002',
        { error: error.message },
        error
      );
    }
  }

  /**
   * Creates authorization headers based on configured authentication type
   * 
   * @returns Authentication headers for FHIR API
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/fhir+json'
    };

    if (!this.config.fhirApiEnabled) {
      return headers;
    }

    switch (this.config.fhirApiAuthType) {
      case 'oauth2':
        // In a real implementation, this would fetch and manage OAuth tokens
        // For now, we'll assume the token is pre-configured or obtained elsewhere
        headers['Authorization'] = `Bearer ${this.config.fhirApiAccessToken}`;
        break;
      case 'basic':
        const credentials = Buffer.from(
          `${this.config.fhirApiUsername}:${this.config.fhirApiPassword}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
        break;
      case 'none':
      default:
        // No authentication
        break;
    }

    return headers;
  }

  /**
   * Determines if an error is retryable based on HTTP status code and error type
   * 
   * @param error - The error to check
   * @returns True if the error is retryable, false otherwise
   */
  private isRetryable(error: any): boolean {
    // Consider server errors (5xx) and rate limiting (429) as retryable
    const status = error.response?.status;
    
    // Network errors are also retryable
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    return status >= 500 || status === 429;
  }

  /**
   * Implements retry logic with exponential backoff for transient errors
   * 
   * @param fn - The function to retry
   * @param options - Retry options including max attempts and initial delay
   * @returns The result of the function call
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>, 
    options: { maxAttempts?: number; initialDelayMs?: number; operationName?: string } = {}
  ): Promise<T> {
    const maxAttempts = options.maxAttempts || this.config.retryAttempts || 3;
    const initialDelay = options.initialDelayMs || this.config.retryDelayMs || 1000;
    const operationName = options.operationName || 'FHIR operation';
    
    let attempt = 0;
    
    const execute = async (): Promise<T> => {
      attempt++;
      try {
        // Use circuit breaker to prevent repeated calls to failing external service
        return await this.circuitBreaker.execute(fn);
      } catch (error) {
        // Handle rate limiting explicitly
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : initialDelay * Math.pow(2, attempt - 1);
          
          if (attempt >= maxAttempts) {
            throw new ExternalRateLimitError(
              `Rate limit exceeded for FHIR API after ${attempt} attempts`,
              'HEALTH_003',
              { retryAfter, attempts: attempt },
              error
            );
          }
          
          this.logger.warn(
            `Rate limit hit for ${operationName}, retrying after ${delayMs}ms (attempt ${attempt}/${maxAttempts})`,
            'FHIRAdapter'
          );
          
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return execute();
        }
        
        // For other retryable errors
        if (this.isRetryable(error) && attempt < maxAttempts) {
          const delayMs = initialDelay * Math.pow(2, attempt - 1);
          
          this.logger.warn(
            `Retrying ${operationName} after ${delayMs}ms (attempt ${attempt}/${maxAttempts})`,
            'FHIRAdapter'
          );
          
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return execute();
        }
        
        // Transform error to appropriate external error type
        if (error.response?.status >= 500) {
          throw new ExternalDependencyUnavailableError(
            `FHIR API server error: ${error.message}`,
            'HEALTH_004',
            { statusCode: error.response?.status, attempts: attempt },
            error
          );
        }
        
        // Rethrow circuit breaker errors
        if (error.name === 'CircuitBreakerError') {
          throw new ExternalDependencyUnavailableError(
            'FHIR API circuit is open due to multiple failures',
            'HEALTH_005',
            { circuitState: 'open' },
            error
          );
        }
        
        // For non-retryable errors or max attempts reached
        throw new ExternalApiError(
          `FHIR API error: ${error.message}`,
          'HEALTH_006',
          { statusCode: error.response?.status, attempts: attempt },
          error
        );
      }
    };
    
    return execute();
  }

  /**
   * Retrieves a patient record from a FHIR-compliant system.
   * 
   * @param patientId - The unique identifier of the patient
   * @returns A promise that resolves to the patient record
   */
  public async getPatientRecord(patientId: string): Promise<any> {
    try {
      // Check if FHIR API is enabled
      if (!this.config.fhirApiEnabled) {
        throw new ExternalDependencyUnavailableError(
          'FHIR API is disabled',
          'HEALTH_001',
          { patientId }
        );
      }

      // Use the tracing service to create a span for this operation
      return await this.tracingService.createSpan('fhir.getPatientRecord', async () => {
        this.logger.log(`Fetching patient record for patient ID: ${patientId}`, 'FHIRAdapter');
        
        try {
          // Use the FHIR client to fetch the patient record
          const response = await this.retryWithBackoff<FHIRPatientResource>(
            () => this.fhirClient.read({
              resourceType: 'Patient',
              id: patientId
            }),
            { operationName: 'getPatientRecord' }
          );
          
          // Transform FHIR patient to our internal format
          const patientRecord = this.mapToPatientRecord(response);
          
          // Emit event for successful data retrieval
          this.eventEmitter.emit('fhir.data.retrieved', {
            patientId,
            resourceType: 'Patient',
            count: 1,
            timestamp: new Date(),
            source: 'FHIR'
          } as FHIRDataRetrievedEvent);
          
          this.logger.log(`Successfully fetched patient record for patient ID: ${patientId}`, 'FHIRAdapter');
          return patientRecord;
        } catch (error) {
          this.logger.error(
            `Failed to fetch patient record for patient ID: ${patientId}`,
            error.stack,
            'FHIRAdapter'
          );
          
          // Rethrow the error if it's already an ExternalApiError
          if (error instanceof ExternalApiError) {
            throw error;
          }
          
          throw new ExternalApiError(
            'Failed to fetch patient record',
            'HEALTH_007',
            { patientId },
            error
          );
        }
      });
    } catch (error) {
      // Rethrow the error if it's already an ExternalApiError
      if (error instanceof ExternalApiError) {
        throw error;
      }
      
      throw new ExternalApiError(
        'Error in patient record retrieval',
        'HEALTH_008',
        { patientId },
        error
      );
    }
  }

  /**
   * Retrieves a patient's medical history from a FHIR-compliant system.
   * 
   * @param patientId - The unique identifier of the patient
   * @returns A promise that resolves to an array of medical events
   */
  public async getMedicalHistory(patientId: string): Promise<IMedicalEvent[]> {
    try {
      // Check if FHIR API is enabled
      if (!this.config.fhirApiEnabled) {
        throw new ExternalDependencyUnavailableError(
          'FHIR API is disabled',
          'HEALTH_001',
          { patientId }
        );
      }

      // Use the tracing service to create a span for this operation
      return await this.tracingService.createSpan('fhir.getMedicalHistory', async () => {
        this.logger.log(`Fetching medical history for patient ID: ${patientId}`, 'FHIRAdapter');
        
        try {
          // Use the FHIR client to search for conditions related to the patient
          const response = await this.retryWithBackoff<FHIRSearchResponse>(
            () => this.fhirClient.search({
              resourceType: 'Condition',
              searchParams: {
                patient: patientId,
                _sort: '-date', // Sort by date in descending order
                _count: this.config.medicalHistoryMaxEvents || 1000 // Limit the number of records
              }
            }),
            { operationName: 'getMedicalHistory' }
          );
          
          // Transform FHIR conditions to our internal format
          const medicalEvents = this.mapToMedicalEvents(response);
          
          // Emit event for successful data retrieval
          this.eventEmitter.emit('fhir.data.retrieved', {
            patientId,
            resourceType: 'Condition',
            count: medicalEvents.length,
            timestamp: new Date(),
            source: 'FHIR'
          } as FHIRDataRetrievedEvent);
          
          this.logger.log(
            `Successfully fetched ${medicalEvents.length} medical events for patient ID: ${patientId}`,
            'FHIRAdapter'
          );
          return medicalEvents;
        } catch (error) {
          this.logger.error(
            `Failed to fetch medical history for patient ID: ${patientId}`,
            error.stack,
            'FHIRAdapter'
          );
          
          // Rethrow the error if it's already an ExternalApiError
          if (error instanceof ExternalApiError) {
            throw error;
          }
          
          throw new ExternalApiError(
            'Failed to fetch medical history',
            'HEALTH_009',
            { patientId },
            error
          );
        }
      });
    } catch (error) {
      // Rethrow the error if it's already an ExternalApiError
      if (error instanceof ExternalApiError) {
        throw error;
      }
      
      throw new ExternalApiError(
        'Error in medical history retrieval',
        'HEALTH_010',
        { patientId },
        error
      );
    }
  }

  /**
   * Maps a FHIR Patient resource to our internal patient record format
   * 
   * @param fhirPatient - The FHIR Patient resource
   * @returns Standardized patient record
   */
  private mapToPatientRecord(fhirPatient: FHIRPatientResource): any {
    try {
      // Validate FHIR patient resource
      if (!fhirPatient || !fhirPatient.resourceType || fhirPatient.resourceType !== 'Patient') {
        throw new ExternalResponseFormatError(
          'Invalid FHIR Patient resource',
          'HEALTH_011',
          { received: fhirPatient?.resourceType || 'undefined' }
        );
      }

      // Extract name information
      const name = fhirPatient.name && fhirPatient.name.length > 0 ? fhirPatient.name[0] : null;
      const firstName = name && name.given && name.given.length > 0 ? name.given[0] : '';
      const lastName = name && name.family ? name.family : '';
      
      // Extract contact information
      const telecom = fhirPatient.telecom || [];
      const phone = telecom.find(t => t.system === 'phone')?.value || '';
      const email = telecom.find(t => t.system === 'email')?.value || '';
      
      // Extract address information
      const address = fhirPatient.address && fhirPatient.address.length > 0 ? fhirPatient.address[0] : null;
      const addressLine = address && address.line ? address.line.join(', ') : '';
      const city = address ? address.city || '' : '';
      const state = address ? address.state || '' : '';
      const postalCode = address ? address.postalCode || '' : '';
      
      // Extract identifiers (like CPF in Brazil)
      const identifiers = fhirPatient.identifier?.map(id => ({
        system: id.system,
        value: id.value
      })) || [];
      
      // Map to our internal patient record format
      return {
        id: fhirPatient.id,
        resourceType: 'PatientRecord',
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        gender: fhirPatient.gender || '',
        birthDate: fhirPatient.birthDate || null,
        contact: {
          phone,
          email
        },
        address: {
          line: addressLine,
          city,
          state,
          postalCode
        },
        maritalStatus: fhirPatient.maritalStatus?.text || '',
        identifiers,
        communication: fhirPatient.communication?.map(comm => ({
          language: comm.language?.text || ''
        })) || [],
        source: 'FHIR',
        meta: {
          version: fhirPatient.meta?.versionId || '1',
          lastUpdated: fhirPatient.meta?.lastUpdated || new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to map FHIR patient to internal format', error.stack, 'FHIRAdapter');
      
      // Rethrow the error if it's already an ExternalApiError
      if (error instanceof ExternalApiError) {
        throw error;
      }
      
      throw new ExternalResponseFormatError(
        'Failed to process patient data',
        'HEALTH_012',
        { error: error.message },
        error
      );
    }
  }

  /**
   * Maps FHIR Condition resources to our internal MedicalEvent entities
   * 
   * @param fhirResponse - The FHIR response containing Condition resources
   * @returns Array of MedicalEvent entities
   */
  private mapToMedicalEvents(fhirResponse: FHIRSearchResponse): IMedicalEvent[] {
    try {
      // Validate FHIR response
      if (!fhirResponse || !fhirResponse.entry || !Array.isArray(fhirResponse.entry)) {
        return [];
      }

      // Map each condition to a medical event
      return fhirResponse.entry
        .filter(entry => entry.resource && entry.resource.resourceType === 'Condition')
        .map(entry => {
          const condition = entry.resource as FHIRConditionResource;
          
          // Extract clinical status
          const clinicalStatus = condition.clinicalStatus?.coding?.[0]?.display || 
                                condition.clinicalStatus?.coding?.[0]?.code || '';
          
          // Extract condition code and description
          const code = condition.code?.coding?.[0]?.display || 
                      condition.code?.coding?.[0]?.code || '';
          const description = condition.code?.text || code || 'Unknown condition';
          
          // Extract recorded date
          let recordedDate = null;
          if (condition.recordedDate) {
            recordedDate = new Date(condition.recordedDate);
          } else if (condition.onsetDateTime) {
            recordedDate = new Date(condition.onsetDateTime);
          } else {
            recordedDate = new Date(); // Fallback to current date
          }
          
          // Extract provider information
          const provider = condition.asserter?.display || '';
          
          // Extract notes
          const notes = condition.note?.map(n => n.text).join('\n') || '';
          
          // Create a new MedicalEvent entity using the interface
          const medicalEvent: IMedicalEvent = {
            id: condition.id,
            type: 'condition',
            description: truncate(description, 255),
            date: recordedDate,
            provider: truncate(provider, 255),
            documents: condition.supportingInfo?.map(info => info.reference) || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            status: clinicalStatus,
            notes: notes ? truncate(notes, 1000) : undefined
          };
          
          return medicalEvent;
        });
    } catch (error) {
      this.logger.error('Failed to map FHIR conditions to medical events', error.stack, 'FHIRAdapter');
      
      // Rethrow the error if it's already an ExternalApiError
      if (error instanceof ExternalApiError) {
        throw error;
      }
      
      throw new ExternalResponseFormatError(
        'Failed to process medical history data',
        'HEALTH_013',
        { error: error.message },
        error
      );
    }
  }
}