import { HttpStatus } from '@nestjs/common';
import {
  ErrorCategory,
  ErrorType,
  HealthErrorType,
  CareErrorType,
  PlanErrorType,
  ErrorSeverity,
  ErrorCategoryToHttpStatus,
  ErrorTypeToCategory,
  ErrorMetadata,
  UserErrorContext,
  RequestErrorContext,
  JourneyErrorContext,
  ErrorContext,
  ClientErrorMessage,
  SerializedError,
  ErrorHandler,
  ErrorTransformer,
  ErrorSerializer,
  ErrorLogger,
  ErrorFilter
} from '../../src/types';

describe('Error Types', () => {
  describe('ErrorCategory enum', () => {
    it('should define all required error categories', () => {
      // Verify all expected categories are defined
      expect(ErrorCategory.VALIDATION).toBe('validation');
      expect(ErrorCategory.BUSINESS).toBe('business');
      expect(ErrorCategory.TECHNICAL).toBe('technical');
      expect(ErrorCategory.EXTERNAL).toBe('external');
      expect(ErrorCategory.AUTHENTICATION).toBe('authentication');
      expect(ErrorCategory.AUTHORIZATION).toBe('authorization');
      expect(ErrorCategory.NOT_FOUND).toBe('not_found');
      expect(ErrorCategory.CONFLICT).toBe('conflict');
      expect(ErrorCategory.RATE_LIMIT).toBe('rate_limit');
      expect(ErrorCategory.TIMEOUT).toBe('timeout');
    });

    it('should have the correct number of categories', () => {
      // Count the number of enum values
      const categoryCount = Object.keys(ErrorCategory).length / 2; // Divide by 2 because TypeScript enums have both name->value and value->name mappings
      expect(categoryCount).toBe(10); // Update this if categories are added or removed
    });
  });

  describe('ErrorType enum', () => {
    it('should define validation error types', () => {
      expect(ErrorType.INVALID_INPUT).toBe('invalid_input');
      expect(ErrorType.MISSING_REQUIRED_FIELD).toBe('missing_required_field');
      expect(ErrorType.INVALID_FORMAT).toBe('invalid_format');
      expect(ErrorType.INVALID_ENUM_VALUE).toBe('invalid_enum_value');
      expect(ErrorType.INVALID_DATE).toBe('invalid_date');
      expect(ErrorType.INVALID_NUMERIC_VALUE).toBe('invalid_numeric_value');
    });

    it('should define business error types', () => {
      expect(ErrorType.BUSINESS_RULE_VIOLATION).toBe('business_rule_violation');
      expect(ErrorType.DUPLICATE_ENTITY).toBe('duplicate_entity');
      expect(ErrorType.ENTITY_NOT_FOUND).toBe('entity_not_found');
      expect(ErrorType.INSUFFICIENT_FUNDS).toBe('insufficient_funds');
      expect(ErrorType.OPERATION_NOT_ALLOWED).toBe('operation_not_allowed');
      expect(ErrorType.LIMIT_EXCEEDED).toBe('limit_exceeded');
      expect(ErrorType.INVALID_STATE_TRANSITION).toBe('invalid_state_transition');
    });

    it('should define technical error types', () => {
      expect(ErrorType.DATABASE_ERROR).toBe('database_error');
      expect(ErrorType.INTERNAL_SERVER_ERROR).toBe('internal_server_error');
      expect(ErrorType.UNEXPECTED_ERROR).toBe('unexpected_error');
      expect(ErrorType.CONFIGURATION_ERROR).toBe('configuration_error');
      expect(ErrorType.DATA_INTEGRITY_ERROR).toBe('data_integrity_error');
    });

    it('should define external error types', () => {
      expect(ErrorType.EXTERNAL_SERVICE_UNAVAILABLE).toBe('external_service_unavailable');
      expect(ErrorType.EXTERNAL_SERVICE_ERROR).toBe('external_service_error');
      expect(ErrorType.EXTERNAL_SERVICE_TIMEOUT).toBe('external_service_timeout');
      expect(ErrorType.EXTERNAL_SERVICE_INVALID_RESPONSE).toBe('external_service_invalid_response');
    });

    it('should define authentication error types', () => {
      expect(ErrorType.INVALID_CREDENTIALS).toBe('invalid_credentials');
      expect(ErrorType.TOKEN_EXPIRED).toBe('token_expired');
      expect(ErrorType.TOKEN_INVALID).toBe('token_invalid');
      expect(ErrorType.ACCOUNT_LOCKED).toBe('account_locked');
      expect(ErrorType.ACCOUNT_DISABLED).toBe('account_disabled');
      expect(ErrorType.MFA_REQUIRED).toBe('mfa_required');
    });

    it('should define authorization error types', () => {
      expect(ErrorType.INSUFFICIENT_PERMISSIONS).toBe('insufficient_permissions');
      expect(ErrorType.RESOURCE_ACCESS_DENIED).toBe('resource_access_denied');
      expect(ErrorType.INVALID_ROLE).toBe('invalid_role');
    });

    it('should define not found error types', () => {
      expect(ErrorType.RESOURCE_NOT_FOUND).toBe('resource_not_found');
      expect(ErrorType.ENDPOINT_NOT_FOUND).toBe('endpoint_not_found');
    });

    it('should define conflict error types', () => {
      expect(ErrorType.RESOURCE_CONFLICT).toBe('resource_conflict');
      expect(ErrorType.CONCURRENT_MODIFICATION).toBe('concurrent_modification');
      expect(ErrorType.VERSION_CONFLICT).toBe('version_conflict');
    });

    it('should define rate limit error types', () => {
      expect(ErrorType.TOO_MANY_REQUESTS).toBe('too_many_requests');
      expect(ErrorType.QUOTA_EXCEEDED).toBe('quota_exceeded');
    });

    it('should define timeout error types', () => {
      expect(ErrorType.REQUEST_TIMEOUT).toBe('request_timeout');
      expect(ErrorType.OPERATION_TIMEOUT).toBe('operation_timeout');
    });
  });

  describe('Journey-specific error types', () => {
    describe('HealthErrorType enum', () => {
      it('should define health metrics error types', () => {
        expect(HealthErrorType.INVALID_HEALTH_METRIC).toBe('invalid_health_metric');
        expect(HealthErrorType.METRIC_THRESHOLD_EXCEEDED).toBe('metric_threshold_exceeded');
        expect(HealthErrorType.METRIC_RECORDING_FAILED).toBe('metric_recording_failed');
      });

      it('should define health goals error types', () => {
        expect(HealthErrorType.GOAL_CREATION_FAILED).toBe('goal_creation_failed');
        expect(HealthErrorType.GOAL_UPDATE_FAILED).toBe('goal_update_failed');
        expect(HealthErrorType.GOAL_NOT_FOUND).toBe('goal_not_found');
        expect(HealthErrorType.INVALID_GOAL_PARAMETERS).toBe('invalid_goal_parameters');
      });

      it('should define device connection error types', () => {
        expect(HealthErrorType.DEVICE_CONNECTION_FAILED).toBe('device_connection_failed');
        expect(HealthErrorType.DEVICE_SYNC_FAILED).toBe('device_sync_failed');
        expect(HealthErrorType.DEVICE_NOT_SUPPORTED).toBe('device_not_supported');
        expect(HealthErrorType.DEVICE_AUTHORIZATION_FAILED).toBe('device_authorization_failed');
      });

      it('should define FHIR integration error types', () => {
        expect(HealthErrorType.FHIR_INTEGRATION_ERROR).toBe('fhir_integration_error');
        expect(HealthErrorType.FHIR_RESOURCE_NOT_FOUND).toBe('fhir_resource_not_found');
        expect(HealthErrorType.FHIR_INVALID_RESOURCE).toBe('fhir_invalid_resource');
      });

      it('should define health insights error types', () => {
        expect(HealthErrorType.INSIGHT_GENERATION_FAILED).toBe('insight_generation_failed');
        expect(HealthErrorType.INSUFFICIENT_DATA_FOR_INSIGHT).toBe('insufficient_data_for_insight');
      });
    });

    describe('CareErrorType enum', () => {
      it('should define appointment error types', () => {
        expect(CareErrorType.APPOINTMENT_SCHEDULING_FAILED).toBe('appointment_scheduling_failed');
        expect(CareErrorType.APPOINTMENT_CANCELLATION_FAILED).toBe('appointment_cancellation_failed');
        expect(CareErrorType.APPOINTMENT_RESCHEDULING_FAILED).toBe('appointment_rescheduling_failed');
        expect(CareErrorType.APPOINTMENT_NOT_FOUND).toBe('appointment_not_found');
        expect(CareErrorType.NO_AVAILABLE_SLOTS).toBe('no_available_slots');
      });

      it('should define provider error types', () => {
        expect(CareErrorType.PROVIDER_NOT_FOUND).toBe('provider_not_found');
        expect(CareErrorType.PROVIDER_UNAVAILABLE).toBe('provider_unavailable');
        expect(CareErrorType.INVALID_PROVIDER_SPECIALTY).toBe('invalid_provider_specialty');
      });

      it('should define telemedicine error types', () => {
        expect(CareErrorType.TELEMEDICINE_SESSION_FAILED).toBe('telemedicine_session_failed');
        expect(CareErrorType.TELEMEDICINE_CONNECTION_ERROR).toBe('telemedicine_connection_error');
        expect(CareErrorType.TELEMEDICINE_MEDIA_ERROR).toBe('telemedicine_media_error');
      });

      it('should define medication error types', () => {
        expect(CareErrorType.MEDICATION_NOT_FOUND).toBe('medication_not_found');
        expect(CareErrorType.MEDICATION_INTERACTION_DETECTED).toBe('medication_interaction_detected');
        expect(CareErrorType.INVALID_MEDICATION_DOSAGE).toBe('invalid_medication_dosage');
        expect(CareErrorType.PRESCRIPTION_ERROR).toBe('prescription_error');
      });

      it('should define symptom checker error types', () => {
        expect(CareErrorType.SYMPTOM_ANALYSIS_FAILED).toBe('symptom_analysis_failed');
        expect(CareErrorType.INSUFFICIENT_SYMPTOMS).toBe('insufficient_symptoms');
        expect(CareErrorType.INVALID_SYMPTOM_DATA).toBe('invalid_symptom_data');
      });

      it('should define treatment error types', () => {
        expect(CareErrorType.TREATMENT_PLAN_CREATION_FAILED).toBe('treatment_plan_creation_failed');
        expect(CareErrorType.TREATMENT_PLAN_UPDATE_FAILED).toBe('treatment_plan_update_failed');
        expect(CareErrorType.TREATMENT_PLAN_NOT_FOUND).toBe('treatment_plan_not_found');
      });
    });

    describe('PlanErrorType enum', () => {
      it('should define plan error types', () => {
        expect(PlanErrorType.PLAN_NOT_FOUND).toBe('plan_not_found');
        expect(PlanErrorType.PLAN_ENROLLMENT_FAILED).toBe('plan_enrollment_failed');
        expect(PlanErrorType.PLAN_TERMINATION_FAILED).toBe('plan_termination_failed');
        expect(PlanErrorType.INVALID_PLAN_PARAMETERS).toBe('invalid_plan_parameters');
      });

      it('should define benefit error types', () => {
        expect(PlanErrorType.BENEFIT_NOT_FOUND).toBe('benefit_not_found');
        expect(PlanErrorType.BENEFIT_NOT_COVERED).toBe('benefit_not_covered');
        expect(PlanErrorType.BENEFIT_LIMIT_REACHED).toBe('benefit_limit_reached');
        expect(PlanErrorType.BENEFIT_ELIGIBILITY_ERROR).toBe('benefit_eligibility_error');
      });

      it('should define coverage error types', () => {
        expect(PlanErrorType.COVERAGE_VERIFICATION_FAILED).toBe('coverage_verification_failed');
        expect(PlanErrorType.SERVICE_NOT_COVERED).toBe('service_not_covered');
        expect(PlanErrorType.COVERAGE_EXPIRED).toBe('coverage_expired');
        expect(PlanErrorType.PREAUTHORIZATION_REQUIRED).toBe('preauthorization_required');
      });

      it('should define claim error types', () => {
        expect(PlanErrorType.CLAIM_SUBMISSION_FAILED).toBe('claim_submission_failed');
        expect(PlanErrorType.CLAIM_PROCESSING_ERROR).toBe('claim_processing_error');
        expect(PlanErrorType.CLAIM_NOT_FOUND).toBe('claim_not_found');
        expect(PlanErrorType.INVALID_CLAIM_DATA).toBe('invalid_claim_data');
        expect(PlanErrorType.DUPLICATE_CLAIM).toBe('duplicate_claim');
      });

      it('should define document error types', () => {
        expect(PlanErrorType.DOCUMENT_UPLOAD_FAILED).toBe('document_upload_failed');
        expect(PlanErrorType.DOCUMENT_NOT_FOUND).toBe('document_not_found');
        expect(PlanErrorType.INVALID_DOCUMENT_TYPE).toBe('invalid_document_type');
        expect(PlanErrorType.DOCUMENT_PROCESSING_ERROR).toBe('document_processing_error');
      });
    });
  });

  describe('ErrorSeverity enum', () => {
    it('should define all severity levels', () => {
      expect(ErrorSeverity.DEBUG).toBe('debug');
      expect(ErrorSeverity.INFO).toBe('info');
      expect(ErrorSeverity.WARNING).toBe('warning');
      expect(ErrorSeverity.ERROR).toBe('error');
      expect(ErrorSeverity.CRITICAL).toBe('critical');
      expect(ErrorSeverity.FATAL).toBe('fatal');
    });

    it('should have the correct number of severity levels', () => {
      const severityCount = Object.keys(ErrorSeverity).length / 2;
      expect(severityCount).toBe(6);
    });
  });
});

describe('Error Mappings', () => {
  describe('ErrorCategoryToHttpStatus', () => {
    it('should map all error categories to appropriate HTTP status codes', () => {
      expect(ErrorCategoryToHttpStatus[ErrorCategory.VALIDATION]).toBe(HttpStatus.BAD_REQUEST);
      expect(ErrorCategoryToHttpStatus[ErrorCategory.BUSINESS]).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(ErrorCategoryToHttpStatus[ErrorCategory.TECHNICAL]).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(ErrorCategoryToHttpStatus[ErrorCategory.EXTERNAL]).toBe(HttpStatus.BAD_GATEWAY);
      expect(ErrorCategoryToHttpStatus[ErrorCategory.AUTHENTICATION]).toBe(HttpStatus.UNAUTHORIZED);
      expect(ErrorCategoryToHttpStatus[ErrorCategory.AUTHORIZATION]).toBe(HttpStatus.FORBIDDEN);
      expect(ErrorCategoryToHttpStatus[ErrorCategory.NOT_FOUND]).toBe(HttpStatus.NOT_FOUND);
      expect(ErrorCategoryToHttpStatus[ErrorCategory.CONFLICT]).toBe(HttpStatus.CONFLICT);
      expect(ErrorCategoryToHttpStatus[ErrorCategory.RATE_LIMIT]).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(ErrorCategoryToHttpStatus[ErrorCategory.TIMEOUT]).toBe(HttpStatus.GATEWAY_TIMEOUT);
    });

    it('should have mappings for all error categories', () => {
      // Get all error categories
      const categories = Object.values(ErrorCategory).filter(value => typeof value === 'string');
      
      // Check that each category has a mapping
      categories.forEach(category => {
        expect(ErrorCategoryToHttpStatus[category as ErrorCategory]).toBeDefined();
      });
    });
  });

  describe('ErrorTypeToCategory', () => {
    it('should map validation error types to VALIDATION category', () => {
      expect(ErrorTypeToCategory[ErrorType.INVALID_INPUT]).toBe(ErrorCategory.VALIDATION);
      expect(ErrorTypeToCategory[ErrorType.MISSING_REQUIRED_FIELD]).toBe(ErrorCategory.VALIDATION);
      expect(ErrorTypeToCategory[ErrorType.INVALID_FORMAT]).toBe(ErrorCategory.VALIDATION);
      expect(ErrorTypeToCategory[ErrorType.INVALID_ENUM_VALUE]).toBe(ErrorCategory.VALIDATION);
      expect(ErrorTypeToCategory[ErrorType.INVALID_DATE]).toBe(ErrorCategory.VALIDATION);
      expect(ErrorTypeToCategory[ErrorType.INVALID_NUMERIC_VALUE]).toBe(ErrorCategory.VALIDATION);
    });

    it('should map business error types to BUSINESS category', () => {
      expect(ErrorTypeToCategory[ErrorType.BUSINESS_RULE_VIOLATION]).toBe(ErrorCategory.BUSINESS);
      expect(ErrorTypeToCategory[ErrorType.DUPLICATE_ENTITY]).toBe(ErrorCategory.BUSINESS);
      expect(ErrorTypeToCategory[ErrorType.ENTITY_NOT_FOUND]).toBe(ErrorCategory.BUSINESS);
      expect(ErrorTypeToCategory[ErrorType.INSUFFICIENT_FUNDS]).toBe(ErrorCategory.BUSINESS);
      expect(ErrorTypeToCategory[ErrorType.OPERATION_NOT_ALLOWED]).toBe(ErrorCategory.BUSINESS);
      expect(ErrorTypeToCategory[ErrorType.LIMIT_EXCEEDED]).toBe(ErrorCategory.BUSINESS);
      expect(ErrorTypeToCategory[ErrorType.INVALID_STATE_TRANSITION]).toBe(ErrorCategory.BUSINESS);
    });

    it('should map technical error types to TECHNICAL category', () => {
      expect(ErrorTypeToCategory[ErrorType.DATABASE_ERROR]).toBe(ErrorCategory.TECHNICAL);
      expect(ErrorTypeToCategory[ErrorType.INTERNAL_SERVER_ERROR]).toBe(ErrorCategory.TECHNICAL);
      expect(ErrorTypeToCategory[ErrorType.UNEXPECTED_ERROR]).toBe(ErrorCategory.TECHNICAL);
      expect(ErrorTypeToCategory[ErrorType.CONFIGURATION_ERROR]).toBe(ErrorCategory.TECHNICAL);
      expect(ErrorTypeToCategory[ErrorType.DATA_INTEGRITY_ERROR]).toBe(ErrorCategory.TECHNICAL);
    });

    it('should map external error types to EXTERNAL category', () => {
      expect(ErrorTypeToCategory[ErrorType.EXTERNAL_SERVICE_UNAVAILABLE]).toBe(ErrorCategory.EXTERNAL);
      expect(ErrorTypeToCategory[ErrorType.EXTERNAL_SERVICE_ERROR]).toBe(ErrorCategory.EXTERNAL);
      expect(ErrorTypeToCategory[ErrorType.EXTERNAL_SERVICE_TIMEOUT]).toBe(ErrorCategory.EXTERNAL);
      expect(ErrorTypeToCategory[ErrorType.EXTERNAL_SERVICE_INVALID_RESPONSE]).toBe(ErrorCategory.EXTERNAL);
    });

    it('should map authentication error types to AUTHENTICATION category', () => {
      expect(ErrorTypeToCategory[ErrorType.INVALID_CREDENTIALS]).toBe(ErrorCategory.AUTHENTICATION);
      expect(ErrorTypeToCategory[ErrorType.TOKEN_EXPIRED]).toBe(ErrorCategory.AUTHENTICATION);
      expect(ErrorTypeToCategory[ErrorType.TOKEN_INVALID]).toBe(ErrorCategory.AUTHENTICATION);
      expect(ErrorTypeToCategory[ErrorType.ACCOUNT_LOCKED]).toBe(ErrorCategory.AUTHENTICATION);
      expect(ErrorTypeToCategory[ErrorType.ACCOUNT_DISABLED]).toBe(ErrorCategory.AUTHENTICATION);
      expect(ErrorTypeToCategory[ErrorType.MFA_REQUIRED]).toBe(ErrorCategory.AUTHENTICATION);
    });

    it('should map authorization error types to AUTHORIZATION category', () => {
      expect(ErrorTypeToCategory[ErrorType.INSUFFICIENT_PERMISSIONS]).toBe(ErrorCategory.AUTHORIZATION);
      expect(ErrorTypeToCategory[ErrorType.RESOURCE_ACCESS_DENIED]).toBe(ErrorCategory.AUTHORIZATION);
      expect(ErrorTypeToCategory[ErrorType.INVALID_ROLE]).toBe(ErrorCategory.AUTHORIZATION);
    });

    it('should map not found error types to NOT_FOUND category', () => {
      expect(ErrorTypeToCategory[ErrorType.RESOURCE_NOT_FOUND]).toBe(ErrorCategory.NOT_FOUND);
      expect(ErrorTypeToCategory[ErrorType.ENDPOINT_NOT_FOUND]).toBe(ErrorCategory.NOT_FOUND);
    });

    it('should map conflict error types to CONFLICT category', () => {
      expect(ErrorTypeToCategory[ErrorType.RESOURCE_CONFLICT]).toBe(ErrorCategory.CONFLICT);
      expect(ErrorTypeToCategory[ErrorType.CONCURRENT_MODIFICATION]).toBe(ErrorCategory.CONFLICT);
      expect(ErrorTypeToCategory[ErrorType.VERSION_CONFLICT]).toBe(ErrorCategory.CONFLICT);
    });

    it('should map rate limit error types to RATE_LIMIT category', () => {
      expect(ErrorTypeToCategory[ErrorType.TOO_MANY_REQUESTS]).toBe(ErrorCategory.RATE_LIMIT);
      expect(ErrorTypeToCategory[ErrorType.QUOTA_EXCEEDED]).toBe(ErrorCategory.RATE_LIMIT);
    });

    it('should map timeout error types to TIMEOUT category', () => {
      expect(ErrorTypeToCategory[ErrorType.REQUEST_TIMEOUT]).toBe(ErrorCategory.TIMEOUT);
      expect(ErrorTypeToCategory[ErrorType.OPERATION_TIMEOUT]).toBe(ErrorCategory.TIMEOUT);
    });

    it('should have mappings for all error types', () => {
      // Get all error types
      const types = Object.values(ErrorType).filter(value => typeof value === 'string');
      
      // Check that each type has a mapping
      types.forEach(type => {
        expect(ErrorTypeToCategory[type as ErrorType]).toBeDefined();
      });
    });
  });
});

describe('Error Interfaces', () => {
  describe('ErrorMetadata interface', () => {
    it('should validate a complete error metadata object', () => {
      const metadata: ErrorMetadata = {
        errorId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        category: ErrorCategory.VALIDATION,
        type: ErrorType.INVALID_INPUT,
        code: 'VALIDATION_001',
        severity: ErrorSeverity.ERROR,
        source: 'validation-service',
        stack: 'Error: Invalid input\n    at validateInput (/app/src/validation.ts:42:11)',
        field: 'email',
        validationErrors: [
          { field: 'email', message: 'Invalid email format' }
        ]
      };

      // Type checking is done at compile time, so this test just verifies the object can be created
      expect(metadata).toBeDefined();
      expect(metadata.errorId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(metadata.category).toBe(ErrorCategory.VALIDATION);
      expect(metadata.type).toBe(ErrorType.INVALID_INPUT);
      expect(metadata.code).toBe('VALIDATION_001');
      expect(metadata.severity).toBe(ErrorSeverity.ERROR);
    });

    it('should validate error metadata with journey-specific error types', () => {
      // Health journey error metadata
      const healthMetadata: ErrorMetadata = {
        timestamp: new Date().toISOString(),
        category: ErrorCategory.BUSINESS,
        type: HealthErrorType.GOAL_NOT_FOUND,
        code: 'HEALTH_001',
        severity: ErrorSeverity.ERROR
      };

      // Care journey error metadata
      const careMetadata: ErrorMetadata = {
        timestamp: new Date().toISOString(),
        category: ErrorCategory.BUSINESS,
        type: CareErrorType.APPOINTMENT_NOT_FOUND,
        code: 'CARE_001',
        severity: ErrorSeverity.ERROR
      };

      // Plan journey error metadata
      const planMetadata: ErrorMetadata = {
        timestamp: new Date().toISOString(),
        category: ErrorCategory.BUSINESS,
        type: PlanErrorType.PLAN_NOT_FOUND,
        code: 'PLAN_001',
        severity: ErrorSeverity.ERROR
      };

      expect(healthMetadata.type).toBe(HealthErrorType.GOAL_NOT_FOUND);
      expect(careMetadata.type).toBe(CareErrorType.APPOINTMENT_NOT_FOUND);
      expect(planMetadata.type).toBe(PlanErrorType.PLAN_NOT_FOUND);
    });
  });

  describe('ErrorContext interface', () => {
    it('should validate a complete error context object', () => {
      const context: ErrorContext = {
        user: {
          userId: 'user123',
          roles: ['user', 'admin'],
          sessionId: 'session456',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        request: {
          method: 'POST',
          url: '/api/users',
          headers: { 'content-type': 'application/json' },
          params: { id: '123' },
          body: { name: 'John Doe' },
          correlationId: 'corr789'
        },
        journey: {
          journeyType: 'health',
          journeyContext: { goalId: '123' },
          journeyStep: 'create-goal',
          previousStep: 'goal-selection'
        },
        additionalInfo: 'Some additional context'
      };

      expect(context).toBeDefined();
      expect(context.user?.userId).toBe('user123');
      expect(context.request?.method).toBe('POST');
      expect(context.journey?.journeyType).toBe('health');
      expect(context.additionalInfo).toBe('Some additional context');
    });

    it('should validate user context', () => {
      const userContext: UserErrorContext = {
        userId: 'user123',
        roles: ['user', 'admin'],
        sessionId: 'session456',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      expect(userContext).toBeDefined();
      expect(userContext.userId).toBe('user123');
      expect(userContext.roles).toContain('admin');
    });

    it('should validate request context', () => {
      const requestContext: RequestErrorContext = {
        method: 'GET',
        url: '/api/health/metrics',
        headers: { 'authorization': 'Bearer token' },
        params: { userId: '123' },
        correlationId: 'corr123'
      };

      expect(requestContext).toBeDefined();
      expect(requestContext.method).toBe('GET');
      expect(requestContext.url).toBe('/api/health/metrics');
    });

    it('should validate journey context', () => {
      const journeyContext: JourneyErrorContext = {
        journeyType: 'care',
        journeyContext: { appointmentId: '123' },
        journeyStep: 'schedule-appointment',
        previousStep: 'provider-selection'
      };

      expect(journeyContext).toBeDefined();
      expect(journeyContext.journeyType).toBe('care');
      expect(journeyContext.journeyStep).toBe('schedule-appointment');
    });
  });

  describe('SerializedError interface', () => {
    it('should validate a complete serialized error object', () => {
      const serializedError: SerializedError = {
        error: {
          code: 'VALIDATION_001',
          category: ErrorCategory.VALIDATION,
          type: ErrorType.INVALID_INPUT,
          message: 'Invalid input provided',
          detail: 'The email field must be a valid email address',
          action: 'Please correct the email and try again',
          helpLink: 'https://docs.example.com/validation-errors',
          field: 'email',
          details: { invalidFields: ['email'] },
          timestamp: new Date().toISOString(),
          correlationId: 'corr123'
        }
      };

      expect(serializedError).toBeDefined();
      expect(serializedError.error.code).toBe('VALIDATION_001');
      expect(serializedError.error.category).toBe(ErrorCategory.VALIDATION);
      expect(serializedError.error.type).toBe(ErrorType.INVALID_INPUT);
      expect(serializedError.error.message).toBe('Invalid input provided');
      expect(serializedError.error.detail).toBe('The email field must be a valid email address');
    });

    it('should validate a minimal serialized error object', () => {
      const minimalError: SerializedError = {
        error: {
          code: 'TECHNICAL_001',
          category: ErrorCategory.TECHNICAL,
          type: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString()
        }
      };

      expect(minimalError).toBeDefined();
      expect(minimalError.error.code).toBe('TECHNICAL_001');
      expect(minimalError.error.message).toBe('An unexpected error occurred');
    });
  });

  describe('ClientErrorMessage interface', () => {
    it('should validate a complete client error message', () => {
      const clientMessage: ClientErrorMessage = {
        message: 'Invalid input provided',
        detail: 'The email field must be a valid email address',
        action: 'Please correct the email and try again',
        helpLink: 'https://docs.example.com/validation-errors',
        field: 'email'
      };

      expect(clientMessage).toBeDefined();
      expect(clientMessage.message).toBe('Invalid input provided');
      expect(clientMessage.detail).toBe('The email field must be a valid email address');
      expect(clientMessage.action).toBe('Please correct the email and try again');
    });

    it('should validate a minimal client error message', () => {
      const minimalMessage: ClientErrorMessage = {
        message: 'An error occurred'
      };

      expect(minimalMessage).toBeDefined();
      expect(minimalMessage.message).toBe('An error occurred');
      expect(minimalMessage.detail).toBeUndefined();
    });
  });
});

describe('Error Function Types', () => {
  describe('ErrorHandler type', () => {
    it('should validate an error handler function', () => {
      const handler: ErrorHandler<string> = (error: Error, context?: ErrorContext) => {
        return `Error: ${error.message}`;
      };

      const result = handler(new Error('Test error'));
      expect(result).toBe('Error: Test error');
    });
  });

  describe('ErrorTransformer type', () => {
    it('should validate an error transformer function', () => {
      const transformer: ErrorTransformer = (error: Error, context?: ErrorContext) => {
        return new Error(`Transformed: ${error.message}`);
      };

      const result = transformer(new Error('Test error'));
      expect(result.message).toBe('Transformed: Test error');
    });
  });

  describe('ErrorSerializer type', () => {
    it('should validate an error serializer function', () => {
      const serializer: ErrorSerializer = (error: Error, context?: ErrorContext) => {
        return {
          error: {
            code: 'TEST_001',
            category: ErrorCategory.TECHNICAL,
            type: ErrorType.UNEXPECTED_ERROR,
            message: error.message,
            timestamp: new Date().toISOString()
          }
        };
      };

      const result = serializer(new Error('Test error'));
      expect(result.error.code).toBe('TEST_001');
      expect(result.error.message).toBe('Test error');
    });
  });

  describe('ErrorLogger type', () => {
    it('should validate an error logger function', () => {
      // Create a mock console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const logger: ErrorLogger = (error: Error, context?: ErrorContext) => {
        console.error(`Logged error: ${error.message}`, context);
      };

      logger(new Error('Test error'));
      expect(console.error).toHaveBeenCalled();

      // Restore original console.error
      console.error = originalConsoleError;
    });
  });

  describe('ErrorFilter type', () => {
    it('should validate an error filter function', () => {
      const filter: ErrorFilter = (error: Error, context?: ErrorContext) => {
        return error.message.includes('filter');
      };

      expect(filter(new Error('should filter this'))).toBe(true);
      expect(filter(new Error('ignore this'))).toBe(false);
    });
  });
});