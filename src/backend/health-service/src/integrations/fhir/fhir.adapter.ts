import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import FhirClient from 'fhir-kit-client';
import axios from 'axios';

// Import from @austa/interfaces for type-safe FHIR resources and data models
import { IMedicalEvent } from '@austa/interfaces/journey/health';
import { IPatientRecord } from '@austa/interfaces/journey/health/fhir';
import { FhirResource, FhirPatient, FhirCondition, FhirObservation } from '@austa/interfaces/journey/health/fhir';

// Use TypeScript path aliases for consistent code organization
import { health } from '@app/health/config/configuration';
import { MedicalEvent } from '@app/health/health/entities/medical-event.entity';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { formatDate } from '@app/shared/utils/date.util';
import { truncate } from '@app/shared/utils/string.util';

/**
 * Circuit breaker states for managing external API failures
 */
enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation, requests pass through
  OPEN = 'OPEN',           // Failure threshold exceeded, requests fail fast
  HALF_OPEN = 'HALF_OPEN'  // Testing if service has recovered
}

/**
 * Configuration for the retry mechanism
 */
interface RetryConfig {
  maxRetries: number;        // Maximum number of retry attempts
  initialDelayMs: number;    // Initial delay before first retry
  maxDelayMs: number;        // Maximum delay between retries
  backoffFactor: number;     // Exponential backoff multiplier
  jitterFactor: number;      // Random jitter factor to avoid thundering herd
}

/**
 * Configuration for the circuit breaker
 */
interface CircuitBreakerConfig {
  failureThreshold: number;   // Number of failures before opening circuit
  resetTimeoutMs: number;     // Time in OPEN state before transitioning to HALF_OPEN
  successThreshold: number;   // Number of successes in HALF_OPEN before closing circuit
}

/**
 * Event types emitted by the FHIRAdapter
 */
enum FhirAdapterEvent {
  REQUEST_SUCCESS = 'fhir.request.success',
  REQUEST_FAILURE = 'fhir.request.failure',
  CIRCUIT_OPEN = 'fhir.circuit.open',
  CIRCUIT_CLOSE = 'fhir.circuit.close',
  CIRCUIT_HALF_OPEN = 'fhir.circuit.half-open',
  RETRY_ATTEMPT = 'fhir.retry.attempt'
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
export class FHIRAdapter {
  private fhirClient: FhirClient;
  private config: Record<string, any>;
  
  // Circuit breaker state management
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  
  // Default circuit breaker configuration
  private circuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeoutMs: 30000, // 30 seconds
    successThreshold: 2
  };
  
  // Default retry configuration
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 10000,    // 10 seconds
    backoffFactor: 2,
    jitterFactor: 0.2
  };

  /**
   * Initializes the FHIRAdapter.
   * 
   * @param logger - Logger service for consistent logging
   * @param tracingService - Tracing service for distributed tracing
   * @param eventEmitter - Event emitter for publishing adapter events
   */
  constructor(
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.initialize();
  }

  /**
   * Initializes the adapter with configuration and FHIR client setup
   */
  private initialize(): void {
    try {
      // Load configuration
      this.config = health();
      
      // Check if FHIR API is enabled
      if (!this.config.fhirApiEnabled) {
        this.logger.warn('FHIR API is disabled in configuration', 'FHIRAdapter');
        return;
      }

      // Load circuit breaker configuration if provided
      if (this.config.fhirCircuitBreaker) {
        this.circuitBreakerConfig = {
          ...this.circuitBreakerConfig,
          ...this.config.fhirCircuitBreaker
        };
      }
      
      // Load retry configuration if provided
      if (this.config.fhirRetry) {
        this.retryConfig = {
          ...this.retryConfig,
          ...this.config.fhirRetry
        };
      }

      // Initialize FHIR client
      this.fhirClient = new FhirClient({
        baseUrl: this.config.fhirApiUrl,
        customHeaders: this.getAuthHeaders()
      });

      this.logger.log('FHIR adapter initialized successfully', 'FHIRAdapter');
    } catch (error) {
      this.logger.error('Failed to initialize FHIR adapter', error.stack, 'FHIRAdapter');
      throw new AppException(
        'Failed to initialize FHIR adapter',
        ErrorType.TECHNICAL,
        'HEALTH_002',
        undefined,
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
   * Determines if an error is retryable based on HTTP status code
   * 
   * @param error - The error to check
   * @returns True if the error is retryable, false otherwise
   */
  private isRetryable(error: any): boolean {
    // Consider server errors (5xx) and rate limiting (429) as retryable
    const status = error.response?.status;
    return status >= 500 || status === 429;
  }

  /**
   * Implements retry logic with exponential backoff for transient errors
   * 
   * @param fn - The function to retry
   * @param operationName - Name of the operation for logging and tracing
   * @returns The result of the function call
   */
  private async retryWithBackoff<T>(fn: () => Promise<T>, operationName: string): Promise<T> {
    // Check circuit breaker state before attempting operation
    this.checkCircuitState();
    
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // First attempt (attempt = 0) or retry attempts
        if (attempt > 0) {
          // Calculate delay with exponential backoff and jitter
          const baseDelay = Math.min(
            this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffFactor, attempt - 1),
            this.retryConfig.maxDelayMs
          );
          
          // Add jitter to avoid thundering herd problem
          const jitter = baseDelay * this.retryConfig.jitterFactor * (Math.random() * 2 - 1);
          const delay = Math.max(0, Math.floor(baseDelay + jitter));
          
          this.logger.warn(
            `Retrying FHIR API call (${operationName}) after ${delay}ms, attempt ${attempt} of ${this.retryConfig.maxRetries}`,
            'FHIRAdapter'
          );
          
          // Emit retry attempt event
          this.eventEmitter.emit(FhirAdapterEvent.RETRY_ATTEMPT, {
            operationName,
            attempt,
            maxRetries: this.retryConfig.maxRetries,
            delay,
            timestamp: new Date()
          });
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Attempt the operation
        const result = await fn();
        
        // Operation succeeded, update circuit breaker state
        this.recordSuccess();
        
        // Emit success event
        this.eventEmitter.emit(FhirAdapterEvent.REQUEST_SUCCESS, {
          operationName,
          timestamp: new Date()
        });
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Record failure for circuit breaker
        this.recordFailure();
        
        // Emit failure event
        this.eventEmitter.emit(FhirAdapterEvent.REQUEST_FAILURE, {
          operationName,
          error: error.message,
          status: error.response?.status,
          timestamp: new Date()
        });
        
        // If we've exhausted retries or the error is not retryable, throw
        if (attempt >= this.retryConfig.maxRetries || !this.isRetryable(error)) {
          throw error;
        }
      }
    }
    
    // This should never be reached due to the throw in the catch block,
    // but TypeScript requires a return statement
    throw lastError;
  }
  
  /**
   * Checks the current circuit breaker state and throws an exception if the circuit is open
   */
  private checkCircuitState(): void {
    const now = Date.now();
    
    switch (this.circuitState) {
      case CircuitState.OPEN:
        // Check if it's time to transition to HALF_OPEN
        if (now - this.lastFailureTime >= this.circuitBreakerConfig.resetTimeoutMs) {
          this.circuitState = CircuitState.HALF_OPEN;
          this.successCount = 0;
          
          this.logger.log(
            `Circuit breaker transitioning from OPEN to HALF_OPEN after ${this.circuitBreakerConfig.resetTimeoutMs}ms`,
            'FHIRAdapter'
          );
          
          // Emit circuit half-open event
          this.eventEmitter.emit(FhirAdapterEvent.CIRCUIT_HALF_OPEN, {
            timestamp: new Date(),
            previousState: CircuitState.OPEN,
            resetTimeoutMs: this.circuitBreakerConfig.resetTimeoutMs
          });
        } else {
          // Circuit is still OPEN, fail fast
          throw new AppException(
            'Circuit breaker is open, request rejected',
            ErrorType.EXTERNAL,
            'HEALTH_008',
            {
              remainingTimeMs: this.circuitBreakerConfig.resetTimeoutMs - (now - this.lastFailureTime)
            }
          );
        }
        break;
        
      case CircuitState.HALF_OPEN:
      case CircuitState.CLOSED:
        // Allow the request to proceed
        break;
    }
  }
  
  /**
   * Records a successful operation for circuit breaker state management
   */
  private recordSuccess(): void {
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      // Check if we've reached the success threshold to close the circuit
      if (this.successCount >= this.circuitBreakerConfig.successThreshold) {
        this.circuitState = CircuitState.CLOSED;
        this.failureCount = 0;
        
        this.logger.log(
          `Circuit breaker transitioning from HALF_OPEN to CLOSED after ${this.successCount} successful operations`,
          'FHIRAdapter'
        );
        
        // Emit circuit closed event
        this.eventEmitter.emit(FhirAdapterEvent.CIRCUIT_CLOSE, {
          timestamp: new Date(),
          previousState: CircuitState.HALF_OPEN,
          successCount: this.successCount
        });
      }
    } else if (this.circuitState === CircuitState.CLOSED) {
      // Reset failure count on success in CLOSED state
      this.failureCount = 0;
    }
  }
  
  /**
   * Records a failed operation for circuit breaker state management
   */
  private recordFailure(): void {
    this.lastFailureTime = Date.now();
    
    if (this.circuitState === CircuitState.CLOSED) {
      this.failureCount++;
      
      // Check if we've reached the failure threshold to open the circuit
      if (this.failureCount >= this.circuitBreakerConfig.failureThreshold) {
        this.circuitState = CircuitState.OPEN;
        
        this.logger.warn(
          `Circuit breaker transitioning from CLOSED to OPEN after ${this.failureCount} failures`,
          'FHIRAdapter'
        );
        
        // Emit circuit open event
        this.eventEmitter.emit(FhirAdapterEvent.CIRCUIT_OPEN, {
          timestamp: new Date(),
          previousState: CircuitState.CLOSED,
          failureCount: this.failureCount,
          resetTimeoutMs: this.circuitBreakerConfig.resetTimeoutMs
        });
      }
    } else if (this.circuitState === CircuitState.HALF_OPEN) {
      // Any failure in HALF_OPEN state opens the circuit again
      this.circuitState = CircuitState.OPEN;
      this.successCount = 0;
      
      this.logger.warn(
        'Circuit breaker transitioning from HALF_OPEN to OPEN after a failure',
        'FHIRAdapter'
      );
      
      // Emit circuit open event
      this.eventEmitter.emit(FhirAdapterEvent.CIRCUIT_OPEN, {
        timestamp: new Date(),
        previousState: CircuitState.HALF_OPEN,
        failureCount: 1,
        resetTimeoutMs: this.circuitBreakerConfig.resetTimeoutMs
      });
    }
  }

  /**
   * Retrieves a patient record from a FHIR-compliant system.
   * 
   * @param patientId - The unique identifier of the patient
   * @returns A promise that resolves to the patient record
   */
  public async getPatientRecord(patientId: string): Promise<IPatientRecord> {
    try {
      // Check if FHIR API is enabled
      if (!this.config.fhirApiEnabled) {
        throw new AppException(
          'FHIR API is disabled',
          ErrorType.BUSINESS,
          'HEALTH_001',
          { patientId }
        );
      }

      // Use the tracing service to create a span for this operation
      return await this.tracingService.createSpan('fhir.getPatientRecord', async () => {
        this.logger.log(`Fetching patient record for patient ID: ${patientId}`, 'FHIRAdapter');
        
        try {
          // Use the FHIR client to fetch the patient record with retry and circuit breaker
          const response = await this.retryWithBackoff<FhirPatient>(
            () => this.fhirClient.read({
              resourceType: 'Patient',
              id: patientId
            }),
            'getPatientRecord'
          );
          
          // Transform FHIR patient to our internal format
          const patientRecord = this.mapToPatientRecord(response);
          
          this.logger.log(`Successfully fetched patient record for patient ID: ${patientId}`, 'FHIRAdapter');
          return patientRecord;
        } catch (error) {
          this.logger.error(
            `Failed to fetch patient record for patient ID: ${patientId}`,
            error.stack,
            'FHIRAdapter'
          );
          
          throw new AppException(
            'Failed to fetch patient record',
            ErrorType.EXTERNAL,
            'HEALTH_004',
            { patientId },
            error
          );
        }
      });
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      
      throw new AppException(
        'Error in patient record retrieval',
        ErrorType.TECHNICAL,
        'HEALTH_004',
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
        throw new AppException(
          'FHIR API is disabled',
          ErrorType.BUSINESS,
          'HEALTH_001',
          { patientId }
        );
      }

      // Use the tracing service to create a span for this operation
      return await this.tracingService.createSpan('fhir.getMedicalHistory', async () => {
        this.logger.log(`Fetching medical history for patient ID: ${patientId}`, 'FHIRAdapter');
        
        try {
          // Use the FHIR client to search for conditions related to the patient with retry and circuit breaker
          const response = await this.retryWithBackoff<{ entry: Array<{ resource: FhirCondition }> }>(
            () => this.fhirClient.search({
              resourceType: 'Condition',
              searchParams: {
                patient: patientId,
                _sort: '-date', // Sort by date in descending order
                _count: this.config.medicalHistoryMaxEvents || 1000 // Limit the number of records
              }
            }),
            'getMedicalHistory'
          );
          
          // Transform FHIR conditions to our internal format
          const medicalEvents = this.mapToMedicalEvents(response);
          
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
          
          throw new AppException(
            'Failed to fetch medical history',
            ErrorType.EXTERNAL,
            'HEALTH_005',
            { patientId },
            error
          );
        }
      });
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      
      throw new AppException(
        'Error in medical history retrieval',
        ErrorType.TECHNICAL,
        'HEALTH_005',
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
  private mapToPatientRecord(fhirPatient: FhirPatient): IPatientRecord {
    try {
      // Validate FHIR patient resource
      if (!fhirPatient || !fhirPatient.resourceType || fhirPatient.resourceType !== 'Patient') {
        throw new Error('Invalid FHIR Patient resource');
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
      throw new AppException(
        'Failed to process patient data',
        ErrorType.TECHNICAL,
        'HEALTH_006',
        undefined,
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
  private mapToMedicalEvents(fhirResponse: { entry: Array<{ resource: FhirCondition }> }): IMedicalEvent[] {
    try {
      // Validate FHIR response
      if (!fhirResponse || !fhirResponse.entry || !Array.isArray(fhirResponse.entry)) {
        return [];
      }

      // Map each condition to a medical event
      return fhirResponse.entry
        .filter(entry => entry.resource && entry.resource.resourceType === 'Condition')
        .map(entry => {
          const condition = entry.resource;
          
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
          
          // Create a new MedicalEvent entity
          const medicalEvent: IMedicalEvent = {
            id: condition.id,
            recordId: condition.subject?.reference?.split('/').pop() || '',
            type: 'condition',
            description: truncate(description, 255),
            date: recordedDate,
            provider: truncate(provider, 255),
            documents: condition.supportingInfo?.map(info => info.reference) || [],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          return medicalEvent;
        });
    } catch (error) {
      this.logger.error('Failed to map FHIR conditions to medical events', error.stack, 'FHIRAdapter');
      throw new AppException(
        'Failed to process medical history data',
        ErrorType.TECHNICAL,
        'HEALTH_007',
        undefined,
        error
      );
    }
  }
  
  /**
   * Retrieves health metrics from FHIR Observation resources
   * 
   * @param patientId - The unique identifier of the patient
   * @param metricType - The type of health metric to retrieve
   * @param dateRange - Optional date range to filter metrics
   * @returns A promise that resolves to an array of health metrics
   */
  public async getHealthMetrics(
    patientId: string,
    metricType: string,
    dateRange?: { start?: string; end?: string }
  ): Promise<any[]> {
    try {
      // Check if FHIR API is enabled
      if (!this.config.fhirApiEnabled) {
        throw new AppException(
          'FHIR API is disabled',
          ErrorType.BUSINESS,
          'HEALTH_001',
          { patientId }
        );
      }

      // Use the tracing service to create a span for this operation
      return await this.tracingService.createSpan('fhir.getHealthMetrics', async () => {
        this.logger.log(
          `Fetching health metrics of type ${metricType} for patient ID: ${patientId}`,
          'FHIRAdapter'
        );
        
        try {
          // Map internal metric type to FHIR code
          const fhirCode = this.mapMetricTypeToFhirCode(metricType);
          
          // Prepare search parameters
          const searchParams: Record<string, any> = {
            patient: patientId,
            code: fhirCode,
            _sort: '-date'
          };
          
          // Add date range if provided
          if (dateRange) {
            const dateParam = [];
            if (dateRange.start) dateParam.push(`ge${dateRange.start}`);
            if (dateRange.end) dateParam.push(`le${dateRange.end}`);
            if (dateParam.length > 0) {
              searchParams.date = dateParam.join(',');
            }
          }
          
          // Use the FHIR client to search for observations with retry and circuit breaker
          const response = await this.retryWithBackoff<{ entry: Array<{ resource: FhirObservation }> }>(
            () => this.fhirClient.search({
              resourceType: 'Observation',
              searchParams
            }),
            'getHealthMetrics'
          );
          
          // Transform FHIR observations to our internal format
          const metrics = this.mapToHealthMetrics(response, patientId, metricType);
          
          this.logger.log(
            `Successfully fetched ${metrics.length} health metrics of type ${metricType} for patient ID: ${patientId}`,
            'FHIRAdapter'
          );
          return metrics;
        } catch (error) {
          this.logger.error(
            `Failed to fetch health metrics of type ${metricType} for patient ID: ${patientId}`,
            error.stack,
            'FHIRAdapter'
          );
          
          throw new AppException(
            'Failed to fetch health metrics',
            ErrorType.EXTERNAL,
            'HEALTH_009',
            { patientId, metricType },
            error
          );
        }
      });
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      
      throw new AppException(
        'Error in health metrics retrieval',
        ErrorType.TECHNICAL,
        'HEALTH_009',
        { patientId, metricType },
        error
      );
    }
  }
  
  /**
   * Maps an internal metric type to a FHIR code
   * 
   * @param metricType - The internal metric type
   * @returns The corresponding FHIR code
   */
  private mapMetricTypeToFhirCode(metricType: string): string {
    // This is a simplified mapping, a real implementation would be more comprehensive
    const codeMap: Record<string, string> = {
      'HEART_RATE': '8867-4',     // LOINC code for heart rate
      'BLOOD_PRESSURE': '85354-9', // LOINC code for blood pressure panel
      'BLOOD_GLUCOSE': '2339-0',   // LOINC code for glucose
      'WEIGHT': '29463-7',         // LOINC code for body weight
      'HEIGHT': '8302-2',          // LOINC code for body height
      'STEPS': '41950-7',          // LOINC code for number of steps in 24 hour measured
      'TEMPERATURE': '8310-5'       // LOINC code for body temperature
    };
    
    return codeMap[metricType] || metricType;
  }
  
  /**
   * Maps FHIR Observation resources to our internal health metrics format
   * 
   * @param fhirResponse - The FHIR response containing Observation resources
   * @param patientId - The patient identifier
   * @param metricType - The metric type
   * @returns Array of health metrics
   */
  private mapToHealthMetrics(
    fhirResponse: { entry: Array<{ resource: FhirObservation }> },
    patientId: string,
    metricType: string
  ): any[] {
    try {
      // Validate FHIR response
      if (!fhirResponse || !fhirResponse.entry || !Array.isArray(fhirResponse.entry)) {
        return [];
      }

      // Map each observation to a health metric
      return fhirResponse.entry
        .filter(entry => entry.resource && entry.resource.resourceType === 'Observation')
        .map(entry => {
          const observation = entry.resource;
          
          // Extract value and unit
          let value = 0;
          let unit = '';
          
          if (observation.valueQuantity) {
            value = observation.valueQuantity.value || 0;
            unit = observation.valueQuantity.unit || observation.valueQuantity.code || '';
          } else if (observation.component && observation.component.length > 0) {
            // Handle component-based observations like blood pressure
            // For simplicity, we'll just use the first component
            const component = observation.component[0];
            if (component.valueQuantity) {
              value = component.valueQuantity.value || 0;
              unit = component.valueQuantity.unit || component.valueQuantity.code || '';
            }
          }
          
          // Extract timestamp
          let timestamp = new Date();
          if (observation.effectiveDateTime) {
            timestamp = new Date(observation.effectiveDateTime);
          } else if (observation.effectivePeriod?.start) {
            timestamp = new Date(observation.effectivePeriod.start);
          }
          
          // Extract notes
          const notes = observation.note?.map(n => n.text).join('\n') || null;
          
          // Create a health metric
          return {
            id: observation.id,
            userId: patientId,
            type: metricType,
            value,
            unit,
            timestamp,
            source: 'FHIR',
            notes,
            trend: null, // Calculated later when comparing to previous measurements
            isAbnormal: observation.interpretation?.some(i => 
              i.coding?.some(c => c.code !== 'N' && c.code !== 'normal')
            ) || false
          };
        });
    } catch (error) {
      this.logger.error('Failed to map FHIR observations to health metrics', error.stack, 'FHIRAdapter');
      throw new AppException(
        'Failed to process health metrics data',
        ErrorType.TECHNICAL,
        'HEALTH_010',
        undefined,
        error
      );
    }
  }
}