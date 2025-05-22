/**
 * @file Unit tests for error categories barrel index
 * @description Tests to verify that all error classes are correctly exported and accessible
 * through the index, maintaining proper namespacing and type definitions.
 */

import { BaseError, ErrorType, JourneyType } from '../../../src/base';
import * as ErrorCategories from '../../../src/categories';

// Import individual category modules to compare exports
import * as ValidationErrors from '../../../src/categories/validation.errors';
import * as BusinessErrors from '../../../src/categories/business.errors';
import * as TechnicalErrors from '../../../src/categories/technical.errors';
import * as ExternalErrors from '../../../src/categories/external.errors';

describe('Error Categories Index', () => {
  describe('Validation Errors', () => {
    it('should export all validation error classes', () => {
      // Get all exported validation error classes
      const validationErrorClasses = Object.keys(ValidationErrors)
        .filter(key => {
          const exportedItem = ValidationErrors[key as keyof typeof ValidationErrors];
          return typeof exportedItem === 'function' && 
                 /Error$/.test(key) && 
                 key !== 'BaseError';
        });

      // Verify each validation error class is exported through the index
      validationErrorClasses.forEach(errorClassName => {
        expect(ErrorCategories).toHaveProperty(errorClassName);
        expect(ErrorCategories[errorClassName as keyof typeof ErrorCategories]).toBe(
          ValidationErrors[errorClassName as keyof typeof ValidationErrors]
        );
      });

      // Verify specific validation error classes that must be present
      const requiredValidationErrors = [
        'MissingParameterError',
        'InvalidParameterError',
        'MalformedRequestError',
        'InvalidCredentialsError',
        'SchemaValidationError',
        'InvalidDateError',
        'InvalidNumericValueError',
        'InvalidEnumValueError',
        'InvalidFormatError'
      ];

      requiredValidationErrors.forEach(errorClassName => {
        expect(ErrorCategories).toHaveProperty(errorClassName);
      });
    });

    it('should maintain correct inheritance for validation errors', () => {
      // Test a few key validation errors for proper inheritance
      const testInstance = new ErrorCategories.MissingParameterError('testParam');
      expect(testInstance).toBeInstanceOf(BaseError);
      expect(testInstance.type).toBe(ErrorType.VALIDATION);

      const schemaInstance = new ErrorCategories.SchemaValidationError([
        { field: 'test', message: 'Test error' }
      ]);
      expect(schemaInstance).toBeInstanceOf(BaseError);
      expect(schemaInstance.type).toBe(ErrorType.VALIDATION);

      // Test specialized validation errors
      const dateError = new ErrorCategories.InvalidDateError('birthDate');
      expect(dateError).toBeInstanceOf(ErrorCategories.InvalidParameterError);
      expect(dateError).toBeInstanceOf(BaseError);
      expect(dateError.type).toBe(ErrorType.VALIDATION);
    });
  });

  describe('Business Errors', () => {
    it('should export all business error classes', () => {
      // Get all exported business error classes
      const businessErrorClasses = Object.keys(BusinessErrors)
        .filter(key => {
          const exportedItem = BusinessErrors[key as keyof typeof BusinessErrors];
          return typeof exportedItem === 'function' && 
                 /Error$/.test(key) && 
                 key !== 'BaseError';
        });

      // Verify each business error class is exported through the index
      businessErrorClasses.forEach(errorClassName => {
        expect(ErrorCategories).toHaveProperty(errorClassName);
        expect(ErrorCategories[errorClassName as keyof typeof ErrorCategories]).toBe(
          BusinessErrors[errorClassName as keyof typeof BusinessErrors]
        );
      });

      // Verify specific business error classes that must be present
      const requiredBusinessErrors = [
        'ResourceNotFoundError',
        'ResourceExistsError',
        'BusinessRuleViolationError',
        'ConflictError',
        'InsufficientPermissionsError',
        'InvalidStateError'
      ];

      requiredBusinessErrors.forEach(errorClassName => {
        expect(ErrorCategories).toHaveProperty(errorClassName);
      });
    });

    it('should maintain correct inheritance for business errors', () => {
      // Test a few key business errors for proper inheritance
      const notFoundInstance = new ErrorCategories.ResourceNotFoundError('User', '123');
      expect(notFoundInstance).toBeInstanceOf(BaseError);
      expect(notFoundInstance.type).toBe(ErrorType.BUSINESS);

      const ruleViolationInstance = new ErrorCategories.BusinessRuleViolationError(
        'Cannot schedule appointment outside business hours',
        'BUSINESS_HOURS_RULE'
      );
      expect(ruleViolationInstance).toBeInstanceOf(BaseError);
      expect(ruleViolationInstance.type).toBe(ErrorType.BUSINESS);
    });
  });

  describe('Technical Errors', () => {
    it('should export all technical error classes', () => {
      // Get all exported technical error classes
      const technicalErrorClasses = Object.keys(TechnicalErrors)
        .filter(key => {
          const exportedItem = TechnicalErrors[key as keyof typeof TechnicalErrors];
          return typeof exportedItem === 'function' && 
                 /Error$/.test(key) && 
                 key !== 'BaseError';
        });

      // Verify each technical error class is exported through the index
      technicalErrorClasses.forEach(errorClassName => {
        expect(ErrorCategories).toHaveProperty(errorClassName);
        expect(ErrorCategories[errorClassName as keyof typeof ErrorCategories]).toBe(
          TechnicalErrors[errorClassName as keyof typeof TechnicalErrors]
        );
      });

      // Verify specific technical error classes that must be present
      const requiredTechnicalErrors = [
        'InternalServerError',
        'DatabaseError',
        'ConfigurationError',
        'TimeoutError',
        'DataProcessingError',
        'ServiceUnavailableError'
      ];

      requiredTechnicalErrors.forEach(errorClassName => {
        expect(ErrorCategories).toHaveProperty(errorClassName);
      });
    });

    it('should maintain correct inheritance for technical errors', () => {
      // Test a few key technical errors for proper inheritance
      const serverErrorInstance = new ErrorCategories.InternalServerError('Unexpected server error');
      expect(serverErrorInstance).toBeInstanceOf(BaseError);
      expect(serverErrorInstance.type).toBe(ErrorType.TECHNICAL);

      const dbErrorInstance = new ErrorCategories.DatabaseError(
        'Failed to execute query',
        'SELECT_OPERATION'
      );
      expect(dbErrorInstance).toBeInstanceOf(BaseError);
      expect(dbErrorInstance.type).toBe(ErrorType.TECHNICAL);
    });
  });

  describe('External Errors', () => {
    it('should export all external error classes', () => {
      // Get all exported external error classes
      const externalErrorClasses = Object.keys(ExternalErrors)
        .filter(key => {
          const exportedItem = ExternalErrors[key as keyof typeof ExternalErrors];
          return typeof exportedItem === 'function' && 
                 /Error$/.test(key) && 
                 key !== 'BaseError';
        });

      // Verify each external error class is exported through the index
      externalErrorClasses.forEach(errorClassName => {
        expect(ErrorCategories).toHaveProperty(errorClassName);
        expect(ErrorCategories[errorClassName as keyof typeof ErrorCategories]).toBe(
          ExternalErrors[errorClassName as keyof typeof ExternalErrors]
        );
      });

      // Verify specific external error classes that must be present
      const requiredExternalErrors = [
        'ExternalApiError',
        'IntegrationError',
        'ExternalDependencyUnavailableError',
        'ExternalAuthenticationError',
        'ExternalResponseFormatError',
        'ExternalRateLimitError'
      ];

      requiredExternalErrors.forEach(errorClassName => {
        expect(ErrorCategories).toHaveProperty(errorClassName);
      });
    });

    it('should maintain correct inheritance for external errors', () => {
      // Test a few key external errors for proper inheritance
      const apiErrorInstance = new ErrorCategories.ExternalApiError(
        'Failed to fetch data from external API',
        'https://api.example.com/data',
        500
      );
      expect(apiErrorInstance).toBeInstanceOf(BaseError);
      expect(apiErrorInstance.type).toBe(ErrorType.EXTERNAL);

      const rateLimitInstance = new ErrorCategories.ExternalRateLimitError(
        'Rate limit exceeded for external API',
        'https://api.example.com/data',
        60 // retry after 60 seconds
      );
      expect(rateLimitInstance).toBeInstanceOf(BaseError);
      expect(rateLimitInstance.type).toBe(ErrorType.EXTERNAL);
    });
  });

  describe('Error instantiation and properties', () => {
    it('should allow setting journey context on errors', () => {
      // Test that journey context can be set on different error types
      const validationError = new ErrorCategories.InvalidParameterError(
        'userId',
        'Must be a valid UUID',
        JourneyType.HEALTH
      );
      expect(validationError.context.journey).toBe(JourneyType.HEALTH);

      const businessError = new ErrorCategories.ResourceNotFoundError(
        'HealthMetric',
        '123',
        JourneyType.HEALTH
      );
      expect(businessError.context.journey).toBe(JourneyType.HEALTH);

      const technicalError = new ErrorCategories.DatabaseError(
        'Failed to query health metrics',
        'QUERY_OPERATION',
        JourneyType.HEALTH
      );
      expect(technicalError.context.journey).toBe(JourneyType.HEALTH);
    });

    it('should include error details in serialized output', () => {
      // Test that error details are properly included in serialized output
      const details = { userId: '123', attemptedAction: 'update_profile' };
      const error = new ErrorCategories.InvalidParameterError(
        'email',
        'Invalid email format',
        JourneyType.AUTH,
        details
      );

      const serialized = error.toJSON();
      expect(serialized.error.details).toEqual(details);
      expect(serialized.error.journey).toBe(JourneyType.AUTH);
      expect(serialized.error.message).toContain('Invalid email format');
    });
  });

  describe('Error category structure', () => {
    it('should maintain distinct error categories', () => {
      // Verify that error categories remain distinct and don't overlap
      const validationError = new ErrorCategories.InvalidParameterError('email');
      const businessError = new ErrorCategories.ResourceNotFoundError('User', '123');
      const technicalError = new ErrorCategories.DatabaseError('Query failed');
      const externalError = new ErrorCategories.ExternalApiError('API call failed', 'https://api.example.com');

      expect(validationError.type).toBe(ErrorType.VALIDATION);
      expect(businessError.type).toBe(ErrorType.BUSINESS);
      expect(technicalError.type).toBe(ErrorType.TECHNICAL);
      expect(externalError.type).toBe(ErrorType.EXTERNAL);

      // Verify that error types are correctly mapped to HTTP status codes
      expect(validationError.toHttpException().getStatus()).toBe(400); // Bad Request
      expect(businessError.toHttpException().getStatus()).toBe(422); // Unprocessable Entity
      expect(technicalError.toHttpException().getStatus()).toBe(500); // Internal Server Error
      expect(externalError.toHttpException().getStatus()).toBe(502); // Bad Gateway
    });

    it('should not have circular dependencies between error categories', () => {
      // This test verifies that there are no circular dependencies by ensuring
      // that each error category can be instantiated independently
      
      // If circular dependencies exist, this test would fail during the import phase
      // or when trying to instantiate the error classes
      
      expect(() => {
        const validationError = new ErrorCategories.MissingParameterError('userId');
        const businessError = new ErrorCategories.ResourceExistsError('User', 'email@example.com');
        const technicalError = new ErrorCategories.ConfigurationError('Missing required environment variable');
        const externalError = new ErrorCategories.IntegrationError('Failed to integrate with external system');
        
        return {
          validationError,
          businessError,
          technicalError,
          externalError
        };
      }).not.toThrow();
    });
  });
});