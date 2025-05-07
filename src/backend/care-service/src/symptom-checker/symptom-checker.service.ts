import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CheckSymptomsDto } from './dto/check-symptoms.dto';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { CARE_PROVIDER_UNAVAILABLE } from '@app/shared/constants/error-codes.constants';
import { CircuitBreaker } from '@app/shared/utils/circuit-breaker';
import { retry } from '@app/shared/utils/retry';
import { timeout } from '@app/shared/utils/timeout';
import {
  SymptomCheckerResponse,
  SymptomSeverity,
  PossibleCondition,
  CareOptions
} from '@austa/interfaces/care/symptom-checker';

/**
 * Service that provides symptom checking functionality.
 * Part of the Care Now journey (F-111), allowing users to input symptoms
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
      fallback: this.getFallbackResponse.bind(this)
    });
  }

  /**
   * Checks the provided symptoms and returns preliminary guidance.
   * Implements F-111 Symptom Checker feature for the Care Now journey.
   * 
   * @param checkSymptomsDto DTO containing the symptoms to check
   * @returns Promise resolving to preliminary guidance based on the symptoms
   */
  async checkSymptoms(checkSymptomsDto: CheckSymptomsDto): Promise<SymptomCheckerResponse> {
    return this.tracingService.createSpan('care-journey.symptom-checker.check-symptoms', async (span) => {
      span.setTag('symptoms.count', checkSymptomsDto.symptoms.length);
      span.setTag('symptoms.list', checkSymptomsDto.symptoms.join(','));
      
      this.logger.log(`Checking symptoms: ${JSON.stringify(checkSymptomsDto.symptoms)}`, 'SymptomCheckerService');
      
      try {
        // Get configuration for symptom checker
        const symptomsCheckerConfig = this.configService.get('care.symptomsChecker');
        
        // Check if the symptom checker is enabled
        if (!symptomsCheckerConfig.enabled) {
          throw new AppException(
            'Symptom checker is currently disabled',
            ErrorType.BUSINESS,
            CARE_PROVIDER_UNAVAILABLE
          );
        }
        
        // Check if any emergency symptoms are present
        const emergencySymptoms = symptomsCheckerConfig.emergencySymptoms.split(',');
        const hasEmergencySymptoms = checkSymptomsDto.symptoms.some(
          symptom => emergencySymptoms.includes(symptom)
        );
        
        span.setTag('emergency_symptoms_detected', hasEmergencySymptoms);
        
        if (hasEmergencySymptoms) {
          // Return emergency guidance
          const emergencyConfig = this.configService.get('care.integrations.emergencyServices');
          
          return {
            severity: SymptomSeverity.HIGH,
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
          span.setTag('provider', 'internal');
          // Use internal rule-based symptom analysis
          return this.analyzeSymptoms(checkSymptomsDto.symptoms);
        } else {
          span.setTag('provider', 'external');
          // Call external symptom checking API with circuit breaker and retry
          return this.externalApiCircuitBreaker.execute(() => 
            this.callExternalSymptomAPI(checkSymptomsDto.symptoms, symptomsCheckerConfig.externalApi)
          );
        }
      } catch (error) {
        this.logger.error(`Error checking symptoms: ${error.message}`, error.stack, 'SymptomCheckerService');
        span.setTag('error', true);
        span.setTag('error.message', error.message);
        span.setTag('error.type', error instanceof AppException ? error.type : ErrorType.TECHNICAL);
        
        if (error instanceof AppException) {
          throw error;
        }
        
        throw new AppException(
          'Failed to analyze symptoms',
          ErrorType.TECHNICAL,
          CARE_PROVIDER_UNAVAILABLE,
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
  private analyzeSymptoms(symptoms: string[]): SymptomCheckerResponse {
    return this.tracingService.createSpan('care-journey.symptom-checker.analyze-symptoms', span => {
      span.setTag('symptoms.count', symptoms.length);
      
      // Basic severity determination based on symptom count and combinations
      let severity: SymptomSeverity = SymptomSeverity.LOW;
      let guidance = '';
      let appointmentRecommended = false;
      let telemedicineRecommended = false;
      
      // Simple severity determination based on number of symptoms
      if (symptoms.length >= 5) {
        severity = SymptomSeverity.MEDIUM;
        appointmentRecommended = true;
      } else if (symptoms.length >= 3) {
        severity = SymptomSeverity.MEDIUM;
        telemedicineRecommended = true;
      }
      
      // Look for specific combinations that might indicate common conditions
      if (symptoms.includes('fever') && symptoms.includes('cough')) {
        if (symptoms.includes('shortness_of_breath')) {
          severity = SymptomSeverity.MEDIUM;
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
        case SymptomSeverity.LOW:
          guidance = 'Your symptoms suggest a minor condition. Rest, stay hydrated, and monitor your symptoms.';
          break;
        case SymptomSeverity.MEDIUM:
          guidance = 'Your symptoms may require medical attention. Consider scheduling a telemedicine consultation or in-person appointment.';
          break;
        case SymptomSeverity.HIGH:
          guidance = 'Based on the information provided, we recommend consulting with a healthcare professional immediately.';
          break;
        default:
          guidance = 'Based on the information provided, we recommend consulting with a healthcare professional.';
      }
      
      span.setTag('severity', severity);
      span.setTag('appointment_recommended', appointmentRecommended);
      span.setTag('telemedicine_recommended', telemedicineRecommended);
      
      return {
        severity,
        guidance,
        careOptions: {
          emergency: false,
          appointmentRecommended,
          telemedicineRecommended
        },
        possibleConditions: this.determinePossibleConditions(symptoms)
      };
    });
  }
  
  /**
   * Determines possible conditions based on symptoms.
   * This is a simplified implementation for demonstration purposes.
   * 
   * @param symptoms Array of symptom identifiers
   * @returns Array of possible conditions with confidence levels
   * @private
   */
  private determinePossibleConditions(symptoms: string[]): PossibleCondition[] {
    return this.tracingService.createSpan('care-journey.symptom-checker.determine-conditions', span => {
      const conditions: PossibleCondition[] = [];
      
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
      
      span.setTag('conditions.count', conditions.length);
      span.setTag('conditions.names', conditions.map(c => c.name).join(','));
      
      return conditions;
    });
  }
  
  /**
   * Calls an external API for symptom analysis with retry and circuit breaker patterns.
   * Implements proper timeout handling and exponential backoff for retries.
   * 
   * @param symptoms Array of symptom identifiers
   * @param apiConfig Configuration for the external API
   * @returns Promise resolving to the API response
   * @private
   */
  private async callExternalSymptomAPI(symptoms: string[], apiConfig: any): Promise<SymptomCheckerResponse> {
    return this.tracingService.createSpan('care-journey.symptom-checker.external-api', async span => {
      span.setTag('api.url', apiConfig.url);
      span.setTag('symptoms.count', symptoms.length);
      
      this.logger.log(`Calling external symptom API: ${apiConfig.url}`, 'SymptomCheckerService');
      
      try {
        // Implement retry with exponential backoff
        return await retry(
          async () => {
            // Add timeout to prevent long-running requests
            return await timeout(
              this.makeExternalApiRequest(symptoms, apiConfig),
              apiConfig.timeout || 5000 // Default timeout of 5 seconds
            );
          },
          {
            retries: 3,
            minTimeout: 1000, // Start with 1 second
            maxTimeout: 5000, // Max 5 seconds
            factor: 2, // Exponential factor
            onRetry: (error, attempt) => {
              this.logger.warn(
                `Retry attempt ${attempt} for external symptom API: ${error.message}`,
                'SymptomCheckerService'
              );
              span.setTag('retry.attempt', attempt);
              span.setTag('retry.error', error.message);
            }
          }
        );
      } catch (error) {
        this.logger.error(`Error calling external symptom API: ${error.message}`, error.stack, 'SymptomCheckerService');
        span.setTag('error', true);
        span.setTag('error.message', error.message);
        
        throw new AppException(
          'Failed to connect to symptom analysis service',
          ErrorType.EXTERNAL,
          CARE_PROVIDER_UNAVAILABLE,
          { symptoms },
          error
        );
      }
    });
  }

  /**
   * Makes the actual request to the external API.
   * In a real implementation, this would use HTTP client to call the external API.
   * 
   * @param symptoms Array of symptom identifiers
   * @param apiConfig Configuration for the external API
   * @returns Promise resolving to the API response
   * @private
   */
  private async makeExternalApiRequest(symptoms: string[], apiConfig: any): Promise<SymptomCheckerResponse> {
    // In a real implementation, this would make an HTTP request to the external API
    // For demonstration purposes, we'll return a mock response
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simulate random failures for testing retry mechanism
    if (Math.random() < 0.2) { // 20% chance of failure
      throw new Error('External API temporary failure');
    }
    
    return {
      severity: symptoms.length > 4 ? SymptomSeverity.MEDIUM : SymptomSeverity.LOW,
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
   * Provides a fallback response when the circuit breaker is open.
   * This ensures the system can still provide guidance even when the external API is unavailable.
   * 
   * @param symptoms Array of symptom identifiers
   * @returns Fallback symptom checker response
   * @private
   */
  private getFallbackResponse(symptoms: string[]): SymptomCheckerResponse {
    this.logger.warn(
      'Using fallback response for symptom checker due to external API unavailability',
      'SymptomCheckerService'
    );
    
    // Fall back to internal analysis when external API is unavailable
    return this.analyzeSymptoms(symptoms);
  }
}