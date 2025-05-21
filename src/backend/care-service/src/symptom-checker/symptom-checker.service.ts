import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CheckSymptomsDto } from './dto/check-symptoms.dto';
import { LoggerService } from '@app/shared/logging';
import { TracingService } from '@app/shared/tracing';
import { CARE_PROVIDER_UNAVAILABLE } from '@app/shared/constants';
import { BaseError, ErrorType } from '@austa/errors';
import { SymptomEngineFunctionError, MedicalKnowledgeBaseError } from '@austa/errors/journey/care';
import { ISymptomCheckerResponse, ICareOption, IPossibleCondition } from '@austa/interfaces/journey/care/symptom-checker';
import { CircuitBreaker } from '@austa/errors/utils';
import { timeout, retry } from 'rxjs/operators';
import { from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Service that provides symptom checking functionality.
 * Part of the Care Now journey, allowing users to input symptoms
 * and receive preliminary guidance.
 */
@Injectable()
export class SymptomCheckerService {
  private externalApiCircuitBreaker: CircuitBreaker;

  /**
   * Initializes the SymptomCheckerService.
   * 
   * @param configService Configuration service for accessing application settings
   * @param logger Logger service for consistent logging
   * @param tracingService Tracing service for distributed tracing
   */
  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
    private tracingService: TracingService
  ) {
    // Initialize circuit breaker for external API calls
    this.externalApiCircuitBreaker = new CircuitBreaker({
      name: 'symptom-checker-external-api',
      failureThreshold: 3,
      resetTimeout: 30000, // 30 seconds
      fallback: this.getFallbackSymptomResponse.bind(this)
    });
  }

  /**
   * Checks the provided symptoms and returns preliminary guidance.
   * 
   * @param checkSymptomsDto DTO containing the symptoms to check
   * @returns Promise resolving to preliminary guidance based on the symptoms
   */
  async checkSymptoms(checkSymptomsDto: CheckSymptomsDto): Promise<ISymptomCheckerResponse> {
    return this.tracingService.createSpan('care-journey.symptom-checker.check-symptoms', async (span) => {
      // Add symptoms to span for better tracing context
      span.setAttribute('symptoms.count', checkSymptomsDto.symptoms.length);
      span.setAttribute('symptoms.list', JSON.stringify(checkSymptomsDto.symptoms));
      
      this.logger.log(`Checking symptoms: ${JSON.stringify(checkSymptomsDto.symptoms)}`, 'SymptomCheckerService');
      
      try {
        // Get configuration for symptom checker
        const symptomsCheckerConfig = this.configService.get('care.symptomsChecker');
        
        // Check if the symptom checker is enabled
        if (!symptomsCheckerConfig.enabled) {
          throw new BaseError(
            'Symptom checker is currently disabled',
            ErrorType.BUSINESS,
            CARE_PROVIDER_UNAVAILABLE,
            { symptoms: checkSymptomsDto.symptoms }
          );
        }
        
        // Check if any emergency symptoms are present
        const emergencySymptoms = symptomsCheckerConfig.emergencySymptoms.split(',');
        const hasEmergencySymptoms = checkSymptomsDto.symptoms.some(
          symptom => emergencySymptoms.includes(symptom)
        );
        
        span.setAttribute('symptoms.emergency', hasEmergencySymptoms);
        
        if (hasEmergencySymptoms) {
          // Return emergency guidance
          const emergencyConfig = this.configService.get('care.integrations.emergencyServices');
          
          return {
            severity: 'high',
            guidance: 'Seek immediate medical attention or call emergency services.',
            emergencyNumber: emergencyConfig?.emergencyNumber || '192',
            careOptions: {
              emergency: true,
              appointmentRecommended: false,
              telemedicineRecommended: false
            }
          };
        }
        
        // Determine if we should use internal or external symptom checking
        if (symptomsCheckerConfig.provider === 'internal') {
          // Create a child span for internal analysis
          return this.tracingService.createSpan('care-journey.symptom-checker.internal-analysis', async () => {
            // Use internal rule-based symptom analysis
            return this.analyzeSymptoms(checkSymptomsDto.symptoms);
          });
        } else {
          // Create a child span for external API call
          return this.tracingService.createSpan('care-journey.symptom-checker.external-api', async (childSpan) => {
            childSpan.setAttribute('external.api.url', symptomsCheckerConfig.externalApi.url);
            childSpan.setAttribute('external.api.provider', symptomsCheckerConfig.externalApi.provider || 'unknown');
            
            // Call external symptom checking API with circuit breaker and retries
            return this.callExternalSymptomAPI(checkSymptomsDto.symptoms, symptomsCheckerConfig.externalApi);
          });
        }
      } catch (error) {
        this.logger.error(
          `Error checking symptoms: ${error.message}`, 
          error.stack, 
          'SymptomCheckerService',
          { symptoms: checkSymptomsDto.symptoms, errorType: error.errorType, errorCode: error.errorCode }
        );
        
        // Record error in span
        span.recordException({
          name: error.name || 'Error',
          message: error.message,
          code: error.errorCode || 'UNKNOWN_ERROR'
        });
        
        if (error instanceof BaseError) {
          throw error;
        }
        
        throw new SymptomEngineFunctionError(
          'Failed to analyze symptoms',
          { symptoms: checkSymptomsDto.symptoms },
          error
        );
      }
    });
  }
  
  /**
   * Analyzes symptoms using internal rule-based logic.
   * This is a simplified implementation for demonstration purposes.
   * In a production environment, this would use a more sophisticated symptom analysis algorithm.
   * 
   * @param symptoms Array of symptom identifiers
   * @returns Preliminary guidance based on symptoms
   * @private
   */
  private analyzeSymptoms(symptoms: string[]): ISymptomCheckerResponse {
    // Basic severity determination based on symptom count and combinations
    let severity = 'low';
    let guidance = '';
    let appointmentRecommended = false;
    let telemedicineRecommended = false;
    
    // Simple severity determination based on number of symptoms
    if (symptoms.length >= 5) {
      severity = 'medium';
      appointmentRecommended = true;
    } else if (symptoms.length >= 3) {
      severity = 'medium';
      telemedicineRecommended = true;
    }
    
    // Look for specific combinations that might indicate common conditions
    if (symptoms.includes('fever') && symptoms.includes('cough')) {
      if (symptoms.includes('shortness_of_breath')) {
        severity = 'medium';
        appointmentRecommended = true;
      } else {
        telemedicineRecommended = true;
      }
    }
    
    if (symptoms.includes('headache') && symptoms.includes('fatigue')) {
      telemedicineRecommended = true;
    }
    
    // Provide guidance based on severity
    switch (severity) {
      case 'low':
        guidance = 'Your symptoms suggest a minor condition. Rest, stay hydrated, and monitor your symptoms.';
        break;
      case 'medium':
        guidance = 'Your symptoms may require medical attention. Consider scheduling a telemedicine consultation or in-person appointment.';
        break;
      default:
        guidance = 'Based on the information provided, we recommend consulting with a healthcare professional.';
    }
    
    const careOptions: ICareOption = {
      emergency: false,
      appointmentRecommended,
      telemedicineRecommended
    };
    
    return {
      severity,
      guidance,
      careOptions,
      possibleConditions: this.determinePossibleConditions(symptoms)
    };
  }
  
  /**
   * Determines possible conditions based on symptoms.
   * This is a simplified implementation for demonstration purposes.
   * 
   * @param symptoms Array of symptom identifiers
   * @returns Array of possible conditions with confidence levels
   * @private
   */
  private determinePossibleConditions(symptoms: string[]): IPossibleCondition[] {
    const conditions: IPossibleCondition[] = [];
    
    // Simple pattern matching for common conditions
    if (symptoms.includes('fever') && symptoms.includes('cough')) {
      conditions.push({
        name: 'Common Cold',
        confidence: 0.7,
        description: 'A viral infection of the upper respiratory tract.'
      });
      
      if (symptoms.includes('body_aches') || symptoms.includes('fatigue')) {
        conditions.push({
          name: 'Influenza',
          confidence: 0.6,
          description: 'A viral infection that attacks your respiratory system.'
        });
      }
    }
    
    if (symptoms.includes('headache') && symptoms.includes('sensitivity_to_light')) {
      conditions.push({
        name: 'Migraine',
        confidence: 0.65,
        description: 'A headache of varying intensity, often accompanied by nausea and sensitivity to light and sound.'
      });
    }
    
    // Add a generic condition if none were identified
    if (conditions.length === 0) {
      conditions.push({
        name: 'Unspecified Condition',
        confidence: 0.3,
        description: 'Based on the provided symptoms, a specific condition could not be identified.'
      });
    }
    
    return conditions;
  }
  
  /**
   * Calls an external API for symptom analysis with circuit breaker pattern and retry mechanism.
   * 
   * @param symptoms Array of symptom identifiers
   * @param apiConfig Configuration for the external API
   * @returns Promise resolving to the API response
   * @private
   */
  private async callExternalSymptomAPI(symptoms: string[], apiConfig: any): Promise<ISymptomCheckerResponse> {
    this.logger.log(`Calling external symptom API: ${apiConfig.url}`, 'SymptomCheckerService');
    
    // Use circuit breaker pattern to handle external API failures
    return this.externalApiCircuitBreaker.execute(async () => {
      // Use RxJS to implement timeout and retry with exponential backoff
      return from(this.makeExternalApiRequest(symptoms, apiConfig)).pipe(
        // Set timeout for the API call (5 seconds)
        timeout(5000),
        // Implement retry with exponential backoff
        retry({
          count: 3,
          delay: (error, retryCount) => {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
            this.logger.warn(
              `Retrying external symptom API call (attempt ${retryCount}). Retrying in ${delay}ms`,
              'SymptomCheckerService',
              { symptoms, error: error.message }
            );
            return throwError(() => error).pipe(delay);
          }
        }),
        // Handle errors
        catchError((error) => {
          this.logger.error(
            `Error calling external symptom API: ${error.message}`,
            error.stack,
            'SymptomCheckerService',
            { symptoms }
          );
          
          throw new MedicalKnowledgeBaseError(
            'Failed to connect to symptom analysis service',
            { symptoms },
            error
          );
        })
      ).toPromise();
    });
  }
  
  /**
   * Makes the actual HTTP request to the external API.
   * In a real implementation, this would use an HTTP client like Axios or Fetch.
   * 
   * @param symptoms Array of symptom identifiers
   * @param apiConfig Configuration for the external API
   * @returns Promise resolving to the API response
   * @private
   */
  private async makeExternalApiRequest(symptoms: string[], apiConfig: any): Promise<ISymptomCheckerResponse> {
    // In a real implementation, this would make an HTTP request to the external API
    // For demonstration purposes, we'll return a mock response
    return {
      severity: symptoms.length > 4 ? 'medium' : 'low',
      guidance: 'Analysis provided by external symptom checking service. Please consult with a healthcare professional for accurate diagnosis.',
      careOptions: {
        emergency: false,
        appointmentRecommended: symptoms.length > 3,
        telemedicineRecommended: true
      },
      externalProviderName: 'External Symptom Service'
    };
  }
  
  /**
   * Provides a fallback response when the external API is unavailable.
   * Used by the circuit breaker when the external API fails repeatedly.
   * 
   * @param symptoms Array of symptom identifiers
   * @returns Fallback symptom checker response
   * @private
   */
  private getFallbackSymptomResponse(symptoms: string[]): ISymptomCheckerResponse {
    this.logger.warn(
      'Using fallback symptom analysis due to external API unavailability',
      'SymptomCheckerService',
      { symptoms }
    );
    
    // Fall back to internal analysis when external API is unavailable
    return this.analyzeSymptoms(symptoms);
  }
}