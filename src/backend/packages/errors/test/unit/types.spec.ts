import { ErrorType, AppException } from '@backend/shared/src/exceptions/exceptions.types';
import { HttpStatus } from '@nestjs/common';

/**
 * Test suite for the error handling framework's type system
 * Validates TypeScript interfaces, type definitions, and type guards
 */
describe('Error Types and Interfaces', () => {
  describe('Base Error Types', () => {
    it('should define all required error types in the ErrorType enum', () => {
      // Verify all required error types are defined
      expect(ErrorType.VALIDATION).toBe('validation');
      expect(ErrorType.BUSINESS).toBe('business');
      expect(ErrorType.TECHNICAL).toBe('technical');
      expect(ErrorType.EXTERNAL).toBe('external');
      
      // Verify the enum has exactly the expected number of values
      const errorTypeValues = Object.values(ErrorType);
      expect(errorTypeValues.length).toBe(4);
    });

    it('should allow type checking with ErrorType enum', () => {
      // Type checking function
      const isValidErrorType = (type: string): type is ErrorType => {
        return Object.values(ErrorType).includes(type as ErrorType);
      };

      // Test valid error types
      expect(isValidErrorType('validation')).toBe(true);
      expect(isValidErrorType('business')).toBe(true);
      expect(isValidErrorType('technical')).toBe(true);
      expect(isValidErrorType('external')).toBe(true);
      
      // Test invalid error types
      expect(isValidErrorType('unknown')).toBe(false);
      expect(isValidErrorType('')).toBe(false);
    });
  });

  describe('AppException Base Class', () => {
    it('should create an AppException with all required properties', () => {
      const message = 'Test error message';
      const type = ErrorType.VALIDATION;
      const code = 'TEST_001';
      const details = { field: 'username', issue: 'required' };
      const cause = new Error('Original error');

      const exception = new AppException(message, type, code, details, cause);

      // Verify all properties are set correctly
      expect(exception.message).toBe(message);
      expect(exception.type).toBe(type);
      expect(exception.code).toBe(code);
      expect(exception.details).toEqual(details);
      expect(exception.cause).toBe(cause);
      expect(exception.name).toBe('AppException');
    });

    it('should create an AppException with minimal required properties', () => {
      const message = 'Test error message';
      const type = ErrorType.BUSINESS;
      const code = 'TEST_002';

      const exception = new AppException(message, type, code);

      // Verify required properties are set correctly
      expect(exception.message).toBe(message);
      expect(exception.type).toBe(type);
      expect(exception.code).toBe(code);
      expect(exception.details).toBeUndefined();
      expect(exception.cause).toBeUndefined();
    });

    it('should properly serialize to JSON with all properties', () => {
      const message = 'Test error message';
      const type = ErrorType.VALIDATION;
      const code = 'TEST_003';
      const details = { field: 'email', issue: 'format' };

      const exception = new AppException(message, type, code, details);
      const json = exception.toJSON();

      // Verify JSON structure
      expect(json).toEqual({
        error: {
          type,
          code,
          message,
          details
        }
      });
    });

    it('should properly serialize to JSON with minimal properties', () => {
      const message = 'Test error message';
      const type = ErrorType.TECHNICAL;
      const code = 'TEST_004';

      const exception = new AppException(message, type, code);
      const json = exception.toJSON();

      // Verify JSON structure with undefined details
      expect(json).toEqual({
        error: {
          type,
          code,
          message,
          details: undefined
        }
      });
    });

    it('should convert to HttpException with correct status code for VALIDATION errors', () => {
      const exception = new AppException('Validation error', ErrorType.VALIDATION, 'TEST_005');
      const httpException = exception.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(httpException.getResponse()).toEqual(exception.toJSON());
    });

    it('should convert to HttpException with correct status code for BUSINESS errors', () => {
      const exception = new AppException('Business error', ErrorType.BUSINESS, 'TEST_006');
      const httpException = exception.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(httpException.getResponse()).toEqual(exception.toJSON());
    });

    it('should convert to HttpException with correct status code for TECHNICAL errors', () => {
      const exception = new AppException('Technical error', ErrorType.TECHNICAL, 'TEST_007');
      const httpException = exception.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(httpException.getResponse()).toEqual(exception.toJSON());
    });

    it('should convert to HttpException with correct status code for EXTERNAL errors', () => {
      const exception = new AppException('External error', ErrorType.EXTERNAL, 'TEST_008');
      const httpException = exception.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
      expect(httpException.getResponse()).toEqual(exception.toJSON());
    });
  });

  describe('Error Code Format Validation', () => {
    it('should validate error codes follow the required format', () => {
      // Error code format validation function
      const isValidErrorCode = (code: string): boolean => {
        // Format: SERVICE_CATEGORY_NUMBER (e.g., HEALTH_METRICS_001)
        const regex = /^[A-Z]+_[A-Z]+(_[A-Z]+)*_\d{3}$/;
        return regex.test(code);
      };

      // Test valid error codes
      expect(isValidErrorCode('TEST_001')).toBe(true);
      expect(isValidErrorCode('HEALTH_METRICS_001')).toBe(true);
      expect(isValidErrorCode('CARE_APPOINTMENTS_002')).toBe(true);
      expect(isValidErrorCode('PLAN_BENEFITS_003')).toBe(true);
      expect(isValidErrorCode('AUTH_LOGIN_004')).toBe(true);
      
      // Test invalid error codes
      expect(isValidErrorCode('TEST')).toBe(false);
      expect(isValidErrorCode('test_001')).toBe(false);
      expect(isValidErrorCode('TEST_1')).toBe(false);
      expect(isValidErrorCode('TEST-001')).toBe(false);
    });
  });

  describe('Journey-Specific Error Type Mapping', () => {
    // Mock journey-specific error types for testing
    enum HealthErrorType {
      METRICS_VALIDATION = 'metrics_validation',
      GOALS_BUSINESS = 'goals_business',
      INSIGHTS_TECHNICAL = 'insights_technical',
      DEVICES_EXTERNAL = 'devices_external',
      FHIR_EXTERNAL = 'fhir_external'
    }

    enum CareErrorType {
      APPOINTMENTS_VALIDATION = 'appointments_validation',
      MEDICATIONS_BUSINESS = 'medications_business',
      TELEMEDICINE_TECHNICAL = 'telemedicine_technical',
      PROVIDERS_EXTERNAL = 'providers_external'
    }

    enum PlanErrorType {
      BENEFITS_VALIDATION = 'benefits_validation',
      CLAIMS_BUSINESS = 'claims_business',
      COVERAGE_TECHNICAL = 'coverage_technical',
      DOCUMENTS_EXTERNAL = 'documents_external'
    }

    it('should map journey-specific error types to base error types', () => {
      // Mapping function for Health journey errors
      const mapHealthErrorTypeToBase = (type: HealthErrorType): ErrorType => {
        if (type.endsWith('_validation')) return ErrorType.VALIDATION;
        if (type.endsWith('_business')) return ErrorType.BUSINESS;
        if (type.endsWith('_technical')) return ErrorType.TECHNICAL;
        if (type.endsWith('_external')) return ErrorType.EXTERNAL;
        return ErrorType.TECHNICAL; // Default fallback
      };

      // Test Health journey error type mapping
      expect(mapHealthErrorTypeToBase(HealthErrorType.METRICS_VALIDATION)).toBe(ErrorType.VALIDATION);
      expect(mapHealthErrorTypeToBase(HealthErrorType.GOALS_BUSINESS)).toBe(ErrorType.BUSINESS);
      expect(mapHealthErrorTypeToBase(HealthErrorType.INSIGHTS_TECHNICAL)).toBe(ErrorType.TECHNICAL);
      expect(mapHealthErrorTypeToBase(HealthErrorType.DEVICES_EXTERNAL)).toBe(ErrorType.EXTERNAL);
      expect(mapHealthErrorTypeToBase(HealthErrorType.FHIR_EXTERNAL)).toBe(ErrorType.EXTERNAL);
    });

    it('should create journey-specific error classes that extend AppException', () => {
      // Mock journey-specific error class
      class HealthMetricsError extends AppException {
        constructor(
          message: string,
          code: string,
          public readonly metricType: string,
          public readonly metricValue: number,
          details?: any,
          cause?: Error
        ) {
          super(message, ErrorType.VALIDATION, code, details, cause);
          this.name = 'HealthMetricsError';
        }

        // Override toJSON to include journey-specific properties
        toJSON(): Record<string, any> {
          const baseJson = super.toJSON();
          return {
            ...baseJson,
            error: {
              ...baseJson.error,
              metricType: this.metricType,
              metricValue: this.metricValue
            }
          };
        }
      }

      // Create and test a journey-specific error
      const error = new HealthMetricsError(
        'Invalid heart rate value',
        'HEALTH_METRICS_001',
        'heart_rate',
        250,
        { maxValue: 220 }
      );

      // Verify error properties
      expect(error.message).toBe('Invalid heart rate value');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('HEALTH_METRICS_001');
      expect(error.metricType).toBe('heart_rate');
      expect(error.metricValue).toBe(250);
      expect(error.details).toEqual({ maxValue: 220 });

      // Verify JSON serialization includes journey-specific properties
      const json = error.toJSON();
      expect(json.error.metricType).toBe('heart_rate');
      expect(json.error.metricValue).toBe(250);

      // Verify it's an instance of both the specific error and AppException
      expect(error instanceof HealthMetricsError).toBe(true);
      expect(error instanceof AppException).toBe(true);
    });
  });

  describe('Error Metadata Interface Completeness', () => {
    it('should validate error metadata contains all required fields', () => {
      // Define the expected structure of error metadata
      interface ErrorMetadata {
        type: ErrorType;
        code: string;
        message: string;
        details?: any;
        timestamp?: Date;
        requestId?: string;
        userId?: string;
        journeyContext?: string;
      }

      // Create a function to validate metadata completeness
      const validateErrorMetadata = (metadata: any): metadata is ErrorMetadata => {
        return (
          typeof metadata === 'object' &&
          metadata !== null &&
          typeof metadata.type === 'string' &&
          typeof metadata.code === 'string' &&
          typeof metadata.message === 'string' &&
          (metadata.details === undefined || typeof metadata.details === 'object') &&
          (metadata.timestamp === undefined || metadata.timestamp instanceof Date) &&
          (metadata.requestId === undefined || typeof metadata.requestId === 'string') &&
          (metadata.userId === undefined || typeof metadata.userId === 'string') &&
          (metadata.journeyContext === undefined || typeof metadata.journeyContext === 'string')
        );
      };

      // Test valid metadata
      const validMetadata = {
        type: ErrorType.VALIDATION,
        code: 'TEST_001',
        message: 'Test error',
        details: { field: 'email' },
        timestamp: new Date(),
        requestId: '123456',
        userId: 'user-123',
        journeyContext: 'health'
      };
      expect(validateErrorMetadata(validMetadata)).toBe(true);

      // Test metadata missing required fields
      const missingType = { ...validMetadata };
      delete missingType.type;
      expect(validateErrorMetadata(missingType)).toBe(false);

      const missingCode = { ...validMetadata };
      delete missingCode.code;
      expect(validateErrorMetadata(missingCode)).toBe(false);

      const missingMessage = { ...validMetadata };
      delete missingMessage.message;
      expect(validateErrorMetadata(missingMessage)).toBe(false);

      // Test metadata with invalid field types
      const invalidTypeField = { ...validMetadata, type: 123 };
      expect(validateErrorMetadata(invalidTypeField)).toBe(false);

      const invalidCodeField = { ...validMetadata, code: 123 };
      expect(validateErrorMetadata(invalidCodeField)).toBe(false);

      const invalidMessageField = { ...validMetadata, message: 123 };
      expect(validateErrorMetadata(invalidMessageField)).toBe(false);

      const invalidDetailsField = { ...validMetadata, details: 'string instead of object' };
      expect(validateErrorMetadata(invalidDetailsField)).toBe(false);
    });
  });

  describe('Error Serialization Format Consistency', () => {
    it('should ensure consistent error serialization format across different error types', () => {
      // Create different types of errors
      const validationError = new AppException(
        'Validation error',
        ErrorType.VALIDATION,
        'TEST_VALIDATION_001',
        { field: 'email' }
      );

      const businessError = new AppException(
        'Business error',
        ErrorType.BUSINESS,
        'TEST_BUSINESS_001',
        { reason: 'conflict' }
      );

      const technicalError = new AppException(
        'Technical error',
        ErrorType.TECHNICAL,
        'TEST_TECHNICAL_001',
        { component: 'database' }
      );

      const externalError = new AppException(
        'External error',
        ErrorType.EXTERNAL,
        'TEST_EXTERNAL_001',
        { service: 'payment-gateway' }
      );

      // Serialize all errors
      const validationJson = validationError.toJSON();
      const businessJson = businessError.toJSON();
      const technicalJson = technicalError.toJSON();
      const externalJson = externalError.toJSON();

      // Verify consistent structure across all error types
      const errorObjects = [validationJson, businessJson, technicalJson, externalJson];
      
      errorObjects.forEach(errorObj => {
        expect(errorObj).toHaveProperty('error');
        expect(errorObj.error).toHaveProperty('type');
        expect(errorObj.error).toHaveProperty('code');
        expect(errorObj.error).toHaveProperty('message');
        expect(errorObj.error).toHaveProperty('details');
      });

      // Verify type-specific fields are preserved
      expect(validationJson.error.type).toBe(ErrorType.VALIDATION);
      expect(businessJson.error.type).toBe(ErrorType.BUSINESS);
      expect(technicalJson.error.type).toBe(ErrorType.TECHNICAL);
      expect(externalJson.error.type).toBe(ErrorType.EXTERNAL);

      // Verify details are preserved
      expect(validationJson.error.details).toEqual({ field: 'email' });
      expect(businessJson.error.details).toEqual({ reason: 'conflict' });
      expect(technicalJson.error.details).toEqual({ component: 'database' });
      expect(externalJson.error.details).toEqual({ service: 'payment-gateway' });
    });
  });
});