import { BaseError } from '../../../src/base';
import { ErrorType } from '../../../src/types';

// Import all error classes directly from their source files for comparison
import * as ValidationErrors from '../../../src/categories/validation.errors';
import * as BusinessErrors from '../../../src/categories/business.errors';
import * as TechnicalErrors from '../../../src/categories/technical.errors';
import * as ExternalErrors from '../../../src/categories/external.errors';

// Import the barrel index to test
import * as ErrorCategories from '../../../src/categories';

describe('Error Categories Barrel Index', () => {
  describe('Validation Errors', () => {
    it('should export all validation error classes', () => {
      // Get all exported classes from validation.errors.ts
      const validationErrorClasses = Object.keys(ValidationErrors).filter(
        (key) => typeof ValidationErrors[key] === 'function'
      );

      // Ensure each validation error class is exported through the barrel
      validationErrorClasses.forEach((errorClassName) => {
        expect(ErrorCategories).toHaveProperty(errorClassName);
        expect(ErrorCategories[errorClassName]).toBe(ValidationErrors[errorClassName]);
      });

      // Verify we have the expected validation error classes
      expect(validationErrorClasses).toContain('MissingParameterError');
      expect(validationErrorClasses).toContain('InvalidParameterError');
      expect(validationErrorClasses).toContain('MalformedRequestError');
      expect(validationErrorClasses).toContain('InvalidCredentialsError');
      expect(validationErrorClasses).toContain('SchemaValidationError');
    });

    it('should maintain proper inheritance and type for validation errors', () => {
      // Test a sample validation error class
      const error = new ErrorCategories.InvalidParameterError('test_param', 'Invalid value');
      
      // Verify inheritance
      expect(error).toBeInstanceOf(BaseError);
      
      // Verify error type
      expect(error.type).toBe(ErrorType.VALIDATION);
      
      // Verify error has the correct structure
      expect(error.message).toContain('Invalid value');
      expect(error.context).toHaveProperty('paramName', 'test_param');
    });
  });

  describe('Business Errors', () => {
    it('should export all business error classes', () => {
      // Get all exported classes from business.errors.ts
      const businessErrorClasses = Object.keys(BusinessErrors).filter(
        (key) => typeof BusinessErrors[key] === 'function'
      );

      // Ensure each business error class is exported through the barrel
      businessErrorClasses.forEach((errorClassName) => {
        expect(ErrorCategories).toHaveProperty(errorClassName);
        expect(ErrorCategories[errorClassName]).toBe(BusinessErrors[errorClassName]);
      });

      // Verify we have the expected business error classes
      expect(businessErrorClasses).toContain('ResourceNotFoundError');
      expect(businessErrorClasses).toContain('ResourceExistsError');
      expect(businessErrorClasses).toContain('BusinessRuleViolationError');
      expect(businessErrorClasses).toContain('ConflictError');
      expect(businessErrorClasses).toContain('InsufficientPermissionsError');
      expect(businessErrorClasses).toContain('InvalidStateError');
    });

    it('should maintain proper inheritance and type for business errors', () => {
      // Test a sample business error class
      const error = new ErrorCategories.ResourceNotFoundError('user', '123');
      
      // Verify inheritance
      expect(error).toBeInstanceOf(BaseError);
      
      // Verify error type
      expect(error.type).toBe(ErrorType.BUSINESS);
      
      // Verify error has the correct structure
      expect(error.message).toContain('user');
      expect(error.message).toContain('123');
      expect(error.context).toHaveProperty('resourceType', 'user');
      expect(error.context).toHaveProperty('resourceId', '123');
    });
  });

  describe('Technical Errors', () => {
    it('should export all technical error classes', () => {
      // Get all exported classes from technical.errors.ts
      const technicalErrorClasses = Object.keys(TechnicalErrors).filter(
        (key) => typeof TechnicalErrors[key] === 'function'
      );

      // Ensure each technical error class is exported through the barrel
      technicalErrorClasses.forEach((errorClassName) => {
        expect(ErrorCategories).toHaveProperty(errorClassName);
        expect(ErrorCategories[errorClassName]).toBe(TechnicalErrors[errorClassName]);
      });

      // Verify we have the expected technical error classes
      expect(technicalErrorClasses).toContain('InternalServerError');
      expect(technicalErrorClasses).toContain('DatabaseError');
      expect(technicalErrorClasses).toContain('ConfigurationError');
      expect(technicalErrorClasses).toContain('TimeoutError');
      expect(technicalErrorClasses).toContain('DataProcessingError');
      expect(technicalErrorClasses).toContain('ServiceUnavailableError');
    });

    it('should maintain proper inheritance and type for technical errors', () => {
      // Test a sample technical error class
      const error = new ErrorCategories.DatabaseError('Failed to execute query', {
        operation: 'findUnique',
        entity: 'User'
      });
      
      // Verify inheritance
      expect(error).toBeInstanceOf(BaseError);
      
      // Verify error type
      expect(error.type).toBe(ErrorType.TECHNICAL);
      
      // Verify error has the correct structure
      expect(error.message).toContain('Failed to execute query');
      expect(error.context).toHaveProperty('operation', 'findUnique');
      expect(error.context).toHaveProperty('entity', 'User');
    });
  });

  describe('External Errors', () => {
    it('should export all external error classes', () => {
      // Get all exported classes from external.errors.ts
      const externalErrorClasses = Object.keys(ExternalErrors).filter(
        (key) => typeof ExternalErrors[key] === 'function'
      );

      // Ensure each external error class is exported through the barrel
      externalErrorClasses.forEach((errorClassName) => {
        expect(ErrorCategories).toHaveProperty(errorClassName);
        expect(ErrorCategories[errorClassName]).toBe(ExternalErrors[errorClassName]);
      });

      // Verify we have the expected external error classes
      expect(externalErrorClasses).toContain('ExternalApiError');
      expect(externalErrorClasses).toContain('IntegrationError');
      expect(externalErrorClasses).toContain('ExternalDependencyUnavailableError');
      expect(externalErrorClasses).toContain('ExternalAuthenticationError');
      expect(externalErrorClasses).toContain('ExternalResponseFormatError');
      expect(externalErrorClasses).toContain('ExternalRateLimitError');
    });

    it('should maintain proper inheritance and type for external errors', () => {
      // Test a sample external error class
      const error = new ErrorCategories.ExternalApiError(
        'Failed to call external API',
        'payment-service',
        { statusCode: 500 }
      );
      
      // Verify inheritance
      expect(error).toBeInstanceOf(BaseError);
      
      // Verify error type
      expect(error.type).toBe(ErrorType.EXTERNAL);
      
      // Verify error has the correct structure
      expect(error.message).toContain('Failed to call external API');
      expect(error.context).toHaveProperty('service', 'payment-service');
      expect(error.context).toHaveProperty('statusCode', 500);
    });
  });

  describe('Error Category Structure', () => {
    it('should maintain the error category organization', () => {
      // Verify that all error classes are directly exported (not nested)
      const allErrorClasses = [
        ...Object.keys(ValidationErrors),
        ...Object.keys(BusinessErrors),
        ...Object.keys(TechnicalErrors),
        ...Object.keys(ExternalErrors)
      ].filter(key => 
        typeof ValidationErrors[key] === 'function' ||
        typeof BusinessErrors[key] === 'function' ||
        typeof TechnicalErrors[key] === 'function' ||
        typeof ExternalErrors[key] === 'function'
      );

      // Check that all error classes are exported at the top level
      allErrorClasses.forEach(errorClassName => {
        expect(ErrorCategories).toHaveProperty(errorClassName);
      });

      // Ensure no unexpected nesting or organization changes
      expect(Object.keys(ErrorCategories).length).toBeGreaterThanOrEqual(allErrorClasses.length);
    });

    it('should support tree-shaking by using named exports', () => {
      // This test verifies that the barrel uses named exports rather than default exports
      // which is important for tree-shaking to work properly
      
      // Check that ErrorCategories is not a default export (would be a function or class)
      expect(typeof ErrorCategories).toBe('object');
      
      // Verify that we can destructure individual error classes
      const { 
        InvalidParameterError, 
        ResourceNotFoundError,
        DatabaseError,
        ExternalApiError 
      } = ErrorCategories;
      
      expect(InvalidParameterError).toBeDefined();
      expect(ResourceNotFoundError).toBeDefined();
      expect(DatabaseError).toBeDefined();
      expect(ExternalApiError).toBeDefined();
      
      // Create instances to verify they work correctly when destructured
      const validationError = new InvalidParameterError('test', 'Invalid value');
      const businessError = new ResourceNotFoundError('user', '123');
      const technicalError = new DatabaseError('Query failed');
      const externalError = new ExternalApiError('API call failed', 'test-service');
      
      expect(validationError.type).toBe(ErrorType.VALIDATION);
      expect(businessError.type).toBe(ErrorType.BUSINESS);
      expect(technicalError.type).toBe(ErrorType.TECHNICAL);
      expect(externalError.type).toBe(ErrorType.EXTERNAL);
    });
  });
});