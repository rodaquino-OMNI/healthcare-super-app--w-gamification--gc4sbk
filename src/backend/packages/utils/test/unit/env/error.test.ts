/**
 * Unit tests for environment configuration error classes
 * 
 * These tests verify error instantiation, message formatting, error categorization,
 * and integration with the wider error handling system for environment-related errors.
 */

import {
  EnvironmentVariableError,
  MissingEnvironmentVariableError,
  InvalidEnvironmentVariableError,
  ValidationEnvironmentVariableError,
  TransformEnvironmentVariableError,
  BatchEnvironmentValidationError,
  formatErrorMessage,
  withEnvErrorFallback,
  validateEnvironmentBatch,
  createRequiredEnvValidator,
  categorizeEnvironmentError,
  EnvironmentErrorCategory
} from '../../../src/env/error';

describe('Environment Error Classes', () => {
  describe('EnvironmentVariableError', () => {
    it('should create an error with formatted message', () => {
      const error = new EnvironmentVariableError('TEST_VAR', 'Something went wrong');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('EnvironmentVariableError');
      expect(error.message).toBe('Environment variable TEST_VAR: Something went wrong');
      expect(error.variableName).toBe('TEST_VAR');
    });
    
    it('should capture stack trace', () => {
      const error = new EnvironmentVariableError('TEST_VAR', 'Something went wrong');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('EnvironmentVariableError');
    });
  });
  
  describe('MissingEnvironmentVariableError', () => {
    it('should create an error for missing environment variable', () => {
      const error = new MissingEnvironmentVariableError('API_KEY');
      
      expect(error).toBeInstanceOf(EnvironmentVariableError);
      expect(error.name).toBe('MissingEnvironmentVariableError');
      expect(error.message).toBe('Environment variable API_KEY: Required environment variable is missing.');
      expect(error.variableName).toBe('API_KEY');
    });
    
    it('should include additional context when provided', () => {
      const error = new MissingEnvironmentVariableError(
        'DATABASE_URL', 
        'Required for database connection'
      );
      
      expect(error.message).toBe(
        'Environment variable DATABASE_URL: Required environment variable is missing. ' +
        'Required for database connection'
      );
    });
  });
  
  describe('InvalidEnvironmentVariableError', () => {
    it('should create an error for invalid environment variable', () => {
      const error = new InvalidEnvironmentVariableError(
        'PORT', 
        'abc', 
        'a number between 1000 and 9999'
      );
      
      expect(error).toBeInstanceOf(EnvironmentVariableError);
      expect(error.name).toBe('InvalidEnvironmentVariableError');
      expect(error.message).toBe(
        'Environment variable PORT: Invalid value "abc". Expected a number between 1000 and 9999.'
      );
      expect(error.variableName).toBe('PORT');
      expect(error.providedValue).toBe('abc');
    });
    
    it('should handle undefined values', () => {
      const error = new InvalidEnvironmentVariableError(
        'DEBUG_MODE', 
        undefined, 
        'true or false'
      );
      
      expect(error.message).toBe(
        'Environment variable DEBUG_MODE: Invalid value undefined. Expected true or false.'
      );
      expect(error.providedValue).toBeUndefined();
    });
    
    it('should handle empty string values', () => {
      const error = new InvalidEnvironmentVariableError(
        'LOG_LEVEL', 
        '', 
        'one of: debug, info, warn, error'
      );
      
      expect(error.message).toBe(
        'Environment variable LOG_LEVEL: Invalid value empty string. Expected one of: debug, info, warn, error.'
      );
      expect(error.providedValue).toBe('');
    });
  });
  
  describe('ValidationEnvironmentVariableError', () => {
    it('should create an error with a single validation error', () => {
      const error = new ValidationEnvironmentVariableError(
        'EMAIL', 
        ['Invalid email format']
      );
      
      expect(error).toBeInstanceOf(EnvironmentVariableError);
      expect(error.name).toBe('ValidationEnvironmentVariableError');
      expect(error.message).toBe(
        'Environment variable EMAIL: Validation failed: Invalid email format'
      );
      expect(error.variableName).toBe('EMAIL');
      expect(error.validationErrors).toEqual(['Invalid email format']);
    });
    
    it('should create an error with multiple validation errors', () => {
      const error = new ValidationEnvironmentVariableError(
        'PASSWORD', 
        [
          'Must be at least 8 characters', 
          'Must contain a number', 
          'Must contain a special character'
        ]
      );
      
      expect(error.message).toBe(
        'Environment variable PASSWORD: Multiple validation errors: ' +
        'Must be at least 8 characters, Must contain a number, Must contain a special character'
      );
      expect(error.validationErrors).toHaveLength(3);
    });
  });
  
  describe('TransformEnvironmentVariableError', () => {
    it('should create an error for transformation failure', () => {
      const error = new TransformEnvironmentVariableError(
        'MAX_RETRIES', 
        'not-a-number', 
        'number'
      );
      
      expect(error).toBeInstanceOf(EnvironmentVariableError);
      expect(error.name).toBe('TransformEnvironmentVariableError');
      expect(error.message).toBe(
        'Environment variable MAX_RETRIES: Could not transform "not-a-number" to number'
      );
      expect(error.variableName).toBe('MAX_RETRIES');
      expect(error.providedValue).toBe('not-a-number');
      expect(error.targetType).toBe('number');
    });
    
    it('should include reason when provided', () => {
      const error = new TransformEnvironmentVariableError(
        'CONFIG_JSON', 
        '{invalid-json}', 
        'JSON object', 
        'Unexpected token i in JSON at position 1'
      );
      
      expect(error.message).toBe(
        'Environment variable CONFIG_JSON: Could not transform "{invalid-json}" to JSON object: ' +
        'Unexpected token i in JSON at position 1'
      );
    });
    
    it('should handle undefined values', () => {
      const error = new TransformEnvironmentVariableError(
        'TIMEOUT_MS', 
        undefined, 
        'number'
      );
      
      expect(error.message).toBe(
        'Environment variable TIMEOUT_MS: Could not transform undefined to number'
      );
      expect(error.providedValue).toBeUndefined();
    });
  });
  
  describe('BatchEnvironmentValidationError', () => {
    it('should create an error with multiple environment variable errors', () => {
      const errors = [
        new MissingEnvironmentVariableError('API_KEY'),
        new InvalidEnvironmentVariableError('PORT', 'abc', 'a number')
      ];
      
      const error = new BatchEnvironmentValidationError(errors);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('BatchEnvironmentValidationError');
      expect(error.message).toBe('2 environment variable validation errors occurred');
      expect(error.errors).toEqual(errors);
    });
    
    it('should include context message when provided', () => {
      const errors = [
        new MissingEnvironmentVariableError('DB_HOST'),
        new MissingEnvironmentVariableError('DB_PORT'),
        new MissingEnvironmentVariableError('DB_NAME')
      ];
      
      const error = new BatchEnvironmentValidationError(
        errors, 
        'Database configuration validation failed'
      );
      
      expect(error.message).toBe(
        'Database configuration validation failed: 3 environment variable validation errors occurred'
      );
    });
    
    it('should provide detailed error messages', () => {
      const errors = [
        new MissingEnvironmentVariableError('API_KEY'),
        new InvalidEnvironmentVariableError('PORT', 'abc', 'a number')
      ];
      
      const error = new BatchEnvironmentValidationError(errors);
      const detailedMessage = error.getDetailedMessage();
      
      expect(detailedMessage).toContain('1. Environment variable API_KEY: Required environment variable is missing.');
      expect(detailedMessage).toContain('2. Environment variable PORT: Invalid value "abc". Expected a number.');
    });
  });
});

describe('Environment Error Utilities', () => {
  describe('formatErrorMessage', () => {
    it('should format error message with variable name', () => {
      const message = formatErrorMessage('API_URL', 'Invalid URL format');
      
      expect(message).toBe('Environment variable API_URL: Invalid URL format');
    });
    
    it('should handle empty message', () => {
      const message = formatErrorMessage('DEBUG', '');
      
      expect(message).toBe('Environment variable DEBUG: ');
    });
  });
  
  describe('withEnvErrorFallback', () => {
    it('should return function result when no error occurs', () => {
      const result = withEnvErrorFallback(
        () => 'success',
        'fallback'
      );
      
      expect(result).toBe('success');
    });
    
    it('should return fallback value when error occurs', () => {
      const result = withEnvErrorFallback(
        () => { throw new Error('Something went wrong'); },
        'fallback'
      );
      
      expect(result).toBe('fallback');
    });
    
    it('should call error handler when provided', () => {
      const errorHandler = jest.fn();
      const error = new Error('Something went wrong');
      
      const result = withEnvErrorFallback(
        () => { throw error; },
        'fallback',
        errorHandler
      );
      
      expect(result).toBe('fallback');
      expect(errorHandler).toHaveBeenCalledWith(error);
    });
  });
  
  describe('validateEnvironmentBatch', () => {
    it('should not throw when all validations pass', () => {
      const validations = [
        () => { /* passes */ },
        () => { /* passes */ }
      ];
      
      expect(() => validateEnvironmentBatch(validations)).not.toThrow();
    });
    
    it('should throw BatchEnvironmentValidationError when validations fail', () => {
      const validations = [
        () => { /* passes */ },
        () => { throw new MissingEnvironmentVariableError('API_KEY'); },
        () => { throw new InvalidEnvironmentVariableError('PORT', 'abc', 'a number'); }
      ];
      
      expect(() => validateEnvironmentBatch(validations))
        .toThrow(BatchEnvironmentValidationError);
    });
    
    it('should include all validation errors in the batch error', () => {
      const validations = [
        () => { throw new MissingEnvironmentVariableError('API_KEY'); },
        () => { throw new InvalidEnvironmentVariableError('PORT', 'abc', 'a number'); }
      ];
      
      try {
        validateEnvironmentBatch(validations);
        fail('Expected validateEnvironmentBatch to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(BatchEnvironmentValidationError);
        const batchError = error as BatchEnvironmentValidationError;
        
        expect(batchError.errors).toHaveLength(2);
        expect(batchError.errors[0]).toBeInstanceOf(MissingEnvironmentVariableError);
        expect(batchError.errors[1]).toBeInstanceOf(InvalidEnvironmentVariableError);
      }
    });
    
    it('should include context message when provided', () => {
      const validations = [
        () => { throw new MissingEnvironmentVariableError('DB_HOST'); }
      ];
      
      try {
        validateEnvironmentBatch(validations, 'Database configuration');
        fail('Expected validateEnvironmentBatch to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(BatchEnvironmentValidationError);
        expect(error.message).toBe(
          'Database configuration: 1 environment variable validation errors occurred'
        );
      }
    });
    
    it('should wrap non-environment errors', () => {
      const validations = [
        () => { throw new Error('Generic error'); }
      ];
      
      try {
        validateEnvironmentBatch(validations);
        fail('Expected validateEnvironmentBatch to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(BatchEnvironmentValidationError);
        const batchError = error as BatchEnvironmentValidationError;
        
        expect(batchError.errors).toHaveLength(1);
        expect(batchError.errors[0]).toBeInstanceOf(EnvironmentVariableError);
        expect(batchError.errors[0].variableName).toBe('UNKNOWN');
        expect(batchError.errors[0].message).toContain('Generic error');
      }
    });
  });
  
  describe('createRequiredEnvValidator', () => {
    const originalEnv = process.env;
    
    beforeEach(() => {
      // Reset process.env before each test
      process.env = { ...originalEnv };
    });
    
    afterAll(() => {
      // Restore original process.env after all tests
      process.env = originalEnv;
    });
    
    it('should create a validator function that passes when variable exists', () => {
      process.env.API_KEY = 'test-key';
      const validator = createRequiredEnvValidator('API_KEY');
      
      expect(() => validator()).not.toThrow();
    });
    
    it('should create a validator function that throws when variable is missing', () => {
      delete process.env.API_KEY;
      const validator = createRequiredEnvValidator('API_KEY');
      
      expect(() => validator()).toThrow(MissingEnvironmentVariableError);
    });
    
    it('should create a validator function that throws when variable is empty', () => {
      process.env.API_KEY = '';
      const validator = createRequiredEnvValidator('API_KEY');
      
      expect(() => validator()).toThrow(MissingEnvironmentVariableError);
    });
    
    it('should include additional context in the error when provided', () => {
      delete process.env.DATABASE_URL;
      const validator = createRequiredEnvValidator(
        'DATABASE_URL', 
        'Required for database connection'
      );
      
      try {
        validator();
        fail('Expected validator to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingEnvironmentVariableError);
        expect(error.message).toContain('Required for database connection');
      }
    });
  });
  
  describe('categorizeEnvironmentError', () => {
    it('should categorize MissingEnvironmentVariableError', () => {
      const error = new MissingEnvironmentVariableError('API_KEY');
      const category = categorizeEnvironmentError(error);
      
      expect(category).toBe(EnvironmentErrorCategory.MISSING);
    });
    
    it('should categorize InvalidEnvironmentVariableError', () => {
      const error = new InvalidEnvironmentVariableError('PORT', 'abc', 'a number');
      const category = categorizeEnvironmentError(error);
      
      expect(category).toBe(EnvironmentErrorCategory.INVALID);
    });
    
    it('should categorize ValidationEnvironmentVariableError', () => {
      const error = new ValidationEnvironmentVariableError('EMAIL', ['Invalid format']);
      const category = categorizeEnvironmentError(error);
      
      expect(category).toBe(EnvironmentErrorCategory.VALIDATION);
    });
    
    it('should categorize TransformEnvironmentVariableError', () => {
      const error = new TransformEnvironmentVariableError('TIMEOUT', 'abc', 'number');
      const category = categorizeEnvironmentError(error);
      
      expect(category).toBe(EnvironmentErrorCategory.TRANSFORM);
    });
    
    it('should categorize BatchEnvironmentValidationError', () => {
      const error = new BatchEnvironmentValidationError([
        new MissingEnvironmentVariableError('API_KEY')
      ]);
      const category = categorizeEnvironmentError(error);
      
      expect(category).toBe(EnvironmentErrorCategory.BATCH);
    });
    
    it('should categorize other errors as OTHER', () => {
      const error = new Error('Generic error');
      const category = categorizeEnvironmentError(error);
      
      expect(category).toBe(EnvironmentErrorCategory.OTHER);
    });
  });
});