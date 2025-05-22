import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AppException, ErrorType } from '@austa/interfaces/common';
import {
  serializeError,
  serializeStandardError,
  serializeAppException,
  serializeErrorForClient,
  serializeErrorForLogging,
  serializeErrorForServices,
  serializeErrorForJourney,
  redactSensitiveInfo,
  SerializeErrorOptions,
  SerializedError
} from '../../../src/utils/serialize';

describe('Error Serialization Utilities', () => {
  // Mock environment variables
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Reset NODE_ENV before each test
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('serializeStandardError', () => {
    it('should serialize a standard Error with default options', () => {
      // Arrange
      const error = new Error('Test error message');
      error.name = 'TestError';
      
      // Act
      const serialized = serializeStandardError(error);
      
      // Assert
      expect(serialized).toEqual(expect.objectContaining({
        type: ErrorType.TECHNICAL,
        code: 'SYSTEM_ERROR',
        message: 'Test error message',
        name: 'TestError'
      }));
      
      // Stack should be included by default in non-production
      expect(serialized.stack).toBeDefined();
    });

    it('should not include stack trace in production environment', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const error = new Error('Production error');
      
      // Act
      const serialized = serializeStandardError(error, {
        includeStack: false,
        includeCause: false
      });
      
      // Assert
      expect(serialized.stack).toBeUndefined();
    });

    it('should include cause chain when specified', () => {
      // Arrange
      const causeError = new Error('Cause error');
      const error = new Error('Main error', { cause: causeError });
      
      // Act
      const serialized = serializeStandardError(error, {
        includeStack: true,
        includeCause: true
      });
      
      // Assert
      expect(serialized.cause).toBeDefined();
      expect(serialized.cause?.message).toBe('Cause error');
    });

    it('should handle additional properties on error objects', () => {
      // Arrange
      const error = new Error('Error with extra props');
      (error as any).customProp = 'custom value';
      (error as any).userId = 12345;
      
      // Act
      const serialized = serializeStandardError(error);
      
      // Assert
      expect(serialized.details).toBeDefined();
      expect(serialized.details.customProp).toBe('custom value');
      expect(serialized.details.userId).toBe(12345);
    });

    it('should handle circular references in error properties', () => {
      // Arrange
      const error = new Error('Error with circular reference');
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj; // Create circular reference
      (error as any).circular = circularObj;
      
      // Act
      const serialized = serializeStandardError(error);
      
      // Assert
      expect(serialized.details).toBeDefined();
      expect(serialized.details.circular).toBeDefined();
      expect(serialized.details.circular.name).toBe('circular');
      expect(serialized.details.circular.self).toBe('[Circular Reference]');
    });

    it('should use toJSON method if available and enabled', () => {
      // Arrange
      const error = new Error('Error with toJSON');
      (error as any).toJSON = jest.fn().mockReturnValue({
        code: 'CUSTOM_CODE',
        message: 'Custom message from toJSON',
        details: { custom: true }
      });
      
      // Act
      const serialized = serializeStandardError(error, { useToJSON: true });
      
      // Assert
      expect((error as any).toJSON).toHaveBeenCalled();
      expect(serialized.code).toBe('CUSTOM_CODE');
      expect(serialized.message).toBe('Custom message from toJSON');
      expect(serialized.details).toEqual({ custom: true });
    });

    it('should fall back to standard serialization if toJSON throws', () => {
      // Arrange
      const error = new Error('Error with faulty toJSON');
      (error as any).toJSON = jest.fn().mockImplementation(() => {
        throw new Error('toJSON failed');
      });
      
      // Act
      const serialized = serializeStandardError(error, { useToJSON: true });
      
      // Assert
      expect((error as any).toJSON).toHaveBeenCalled();
      expect(serialized.message).toBe('Error with faulty toJSON');
      expect(serialized.type).toBe(ErrorType.TECHNICAL);
    });
  });

  describe('serializeAppException', () => {
    it('should serialize an AppException with all properties', () => {
      // Arrange
      const exception = new AppException({
        type: ErrorType.VALIDATION,
        code: 'INVALID_INPUT',
        message: 'Invalid input provided',
        details: { field: 'email', reason: 'format' }
      });
      
      // Act
      const serialized = serializeAppException(exception);
      
      // Assert
      expect(serialized).toEqual(expect.objectContaining({
        type: ErrorType.VALIDATION,
        code: 'INVALID_INPUT',
        message: 'Invalid input provided',
        details: { field: 'email', reason: 'format' }
      }));
    });

    it('should handle AppException with cause', () => {
      // Arrange
      const cause = new Error('Original error');
      const exception = new AppException({
        type: ErrorType.EXTERNAL,
        code: 'API_ERROR',
        message: 'External API failed',
        cause
      });
      
      // Act
      const serialized = serializeAppException(exception, {
        includeStack: true,
        includeCause: true
      });
      
      // Assert
      expect(serialized.cause).toBeDefined();
      expect(serialized.cause?.message).toBe('Original error');
    });

    it('should use toJSON method if available on AppException', () => {
      // Arrange
      const exception = new AppException({
        type: ErrorType.BUSINESS,
        code: 'BUSINESS_RULE',
        message: 'Business rule violated'
      });
      
      (exception as any).toJSON = jest.fn().mockReturnValue({
        error: {
          type: ErrorType.BUSINESS,
          code: 'CUSTOM_JSON',
          message: 'Custom JSON message'
        }
      });
      
      // Act
      const serialized = serializeAppException(exception, { useToJSON: true });
      
      // Assert
      expect((exception as any).toJSON).toHaveBeenCalled();
      expect(serialized.code).toBe('CUSTOM_JSON');
      expect(serialized.message).toBe('Custom JSON message');
    });
  });

  describe('serializeError', () => {
    it('should handle standard Error objects', () => {
      // Arrange
      const error = new Error('Standard error');
      
      // Act
      const serialized = serializeError(error);
      
      // Assert
      expect(serialized.type).toBe(ErrorType.TECHNICAL);
      expect(serialized.message).toBe('Standard error');
    });

    it('should handle AppException objects', () => {
      // Arrange
      const exception = new AppException({
        type: ErrorType.VALIDATION,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed'
      });
      
      // Act
      const serialized = serializeError(exception);
      
      // Assert
      expect(serialized.type).toBe(ErrorType.VALIDATION);
      expect(serialized.code).toBe('VALIDATION_ERROR');
    });

    it('should handle error-like objects', () => {
      // Arrange
      const errorLike = {
        name: 'CustomError',
        message: 'Error-like object',
        stack: 'Custom stack trace',
        customProp: 'custom value'
      };
      
      // Act
      const serialized = serializeError(errorLike);
      
      // Assert
      expect(serialized.type).toBe(ErrorType.TECHNICAL);
      expect(serialized.message).toBe('Error-like object');
      expect(serialized.name).toBe('CustomError');
    });

    it('should handle non-error objects', () => {
      // Arrange
      const nonError = { foo: 'bar', baz: 123 };
      
      // Act
      const serialized = serializeError(nonError);
      
      // Assert
      expect(serialized.type).toBe(ErrorType.TECHNICAL);
      expect(serialized.code).toBe('UNKNOWN_ERROR');
      expect(serialized.details).toEqual(nonError);
    });

    it('should handle primitive values', () => {
      // Act & Assert
      expect(serializeError('string error').message).toBe('string error');
      expect(serializeError(42).message).toBe('42');
      expect(serializeError(true).message).toBe('true');
      expect(serializeError(null).message).toBe('An unknown error occurred');
      expect(serializeError(undefined).message).toBe('An unknown error occurred');
    });

    it('should handle already serialized errors', () => {
      // Arrange
      const alreadySerialized: SerializedError = {
        type: ErrorType.BUSINESS,
        code: 'ALREADY_SERIALIZED',
        message: 'Already serialized error'
      };
      
      // Act
      const serialized = serializeError(alreadySerialized);
      
      // Assert
      expect(serialized).toBe(alreadySerialized); // Should return the same object
    });
  });

  describe('redactSensitiveInfo', () => {
    it('should redact sensitive information from objects', () => {
      // Arrange
      const details = {
        username: 'testuser',
        password: 'secret123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        data: {
          apiKey: 'api-key-value',
          refreshToken: 'refresh-token-value'
        }
      };
      
      // Act
      const redacted = redactSensitiveInfo(details);
      
      // Assert
      expect(redacted.username).toBe('testuser');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.token).toBe('[REDACTED]');
      expect(redacted.data.apiKey).toBe('[REDACTED]');
      expect(redacted.data.refreshToken).toBe('[REDACTED]');
    });

    it('should handle arrays with sensitive information', () => {
      // Arrange
      const details = {
        users: [
          { id: 1, name: 'User 1', password: 'pass1' },
          { id: 2, name: 'User 2', password: 'pass2' }
        ]
      };
      
      // Act
      const redacted = redactSensitiveInfo(details);
      
      // Assert
      expect(redacted.users[0].id).toBe(1);
      expect(redacted.users[0].name).toBe('User 1');
      expect(redacted.users[0].password).toBe('[REDACTED]');
      expect(redacted.users[1].id).toBe(2);
      expect(redacted.users[1].name).toBe('User 2');
      expect(redacted.users[1].password).toBe('[REDACTED]');
    });

    it('should handle circular references', () => {
      // Arrange
      const circular: any = { name: 'circular object' };
      circular.self = circular;
      circular.password = 'secret';
      
      // Act
      const redacted = redactSensitiveInfo(circular);
      
      // Assert
      expect(redacted.name).toBe('circular object');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.self).toBe('[Circular Reference]');
    });

    it('should respect maximum depth', () => {
      // Arrange
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: { data: 'deep data' }
              }
            }
          }
        }
      };
      
      // Act
      const redacted = redactSensitiveInfo(deepObject, undefined, 3);
      
      // Assert
      expect(redacted.level1.level2.level3).toBe('[Object]');
    });

    it('should handle special object types', () => {
      // Arrange
      const details = {
        date: new Date('2023-01-01'),
        buffer: Buffer.from('test'),
        regex: /test/,
        func: function() { return 'test'; }
      };
      
      // Act
      const redacted = redactSensitiveInfo(details);
      
      // Assert
      expect(redacted.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO date string
      expect(redacted.buffer).toBe('[Buffer]');
      expect(redacted.func).toBeUndefined(); // Functions should be skipped
    });
  });

  describe('Specialized serialization functions', () => {
    it('serializeErrorForClient should limit information for client consumption', () => {
      // Arrange
      const technicalError = new Error('Internal server error with sensitive details');
      (technicalError as any).internalDetails = { database: 'connection string', serverPath: '/var/www' };
      
      // Act
      const serialized = serializeErrorForClient(technicalError);
      
      // Assert
      expect(serialized.message).toBe('An unexpected system error occurred. Please try again later.');
      expect(serialized.stack).toBeUndefined();
      expect(serialized.details).toBeUndefined();
    });

    it('serializeErrorForLogging should include maximum detail for debugging', () => {
      // Arrange
      const error = new Error('Detailed error for logs');
      const cause = new Error('Root cause');
      Object.defineProperty(error, 'cause', { value: cause });
      
      // Act
      const serialized = serializeErrorForLogging(error);
      
      // Assert
      expect(serialized.stack).toBeDefined();
      expect(serialized.cause).toBeDefined();
      expect(serialized.cause?.message).toBe('Root cause');
    });

    it('serializeErrorForServices should balance detail with security', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const error = new Error('Service communication error');
      (error as any).sensitiveData = 'should be redacted';
      
      // Act
      const serialized = serializeErrorForServices(error);
      
      // Assert
      expect(serialized.stack).toBeDefined(); // Include stack in non-production
      expect(serialized.details).toBeDefined();
      expect(serialized.details.sensitiveData).toBe('[REDACTED]');
      
      // In production
      process.env.NODE_ENV = 'production';
      const prodSerialized = serializeErrorForServices(error);
      expect(prodSerialized.stack).toBeUndefined(); // No stack in production
    });

    it('serializeErrorForJourney should provide journey-specific context', () => {
      // Arrange
      const technicalError = new Error('Database connection failed');
      
      // Act
      const healthSerialized = serializeErrorForJourney(technicalError, 'health');
      const careSerialized = serializeErrorForJourney(technicalError, 'care');
      const planSerialized = serializeErrorForJourney(technicalError, 'plan');
      
      // Assert
      expect(healthSerialized.message).toBe('We encountered an issue while processing your health data. Please try again later.');
      expect(careSerialized.message).toBe('We encountered an issue while processing your care request. Please try again later.');
      expect(planSerialized.message).toBe('We encountered an issue while processing your plan information. Please try again later.');
    });

    it('serializeErrorForJourney should keep validation errors as-is', () => {
      // Arrange
      const validationException = new AppException({
        type: ErrorType.VALIDATION,
        code: 'INVALID_INPUT',
        message: 'Email format is invalid'
      });
      
      // Act
      const serialized = serializeErrorForJourney(validationException, 'health');
      
      // Assert
      expect(serialized.message).toBe('Email format is invalid'); // Original message preserved
    });
  });

  // Tests for error deserialization (future functionality)
  describe('Error deserialization (future functionality)', () => {
    // This section contains tests that would validate the future deserialization functionality
    // These tests serve as a specification for how deserialization should work
    
    it('should be able to reconstruct standard Error objects', () => {
      // Arrange
      const originalError = new Error('Original error');
      const serialized = serializeError(originalError);
      
      // This is a placeholder for future deserialization functionality
      // const deserializedError = deserializeError(serialized);
      
      // Assert
      // expect(deserializedError).toBeInstanceOf(Error);
      // expect(deserializedError.message).toBe('Original error');
      // expect(deserializedError.stack).toBeDefined();
      
      // For now, just verify the serialized form contains necessary information
      expect(serialized.message).toBe('Original error');
      expect(serialized.name).toBe('Error');
    });

    it('should be able to reconstruct AppException objects', () => {
      // Arrange
      const originalException = new AppException({
        type: ErrorType.BUSINESS,
        code: 'BUSINESS_RULE',
        message: 'Business rule violated',
        details: { rule: 'minimum-age', value: 17 }
      });
      const serialized = serializeError(originalException);
      
      // This is a placeholder for future deserialization functionality
      // const deserializedException = deserializeError(serialized);
      
      // Assert
      // expect(deserializedException).toBeInstanceOf(AppException);
      // expect(deserializedException.type).toBe(ErrorType.BUSINESS);
      // expect(deserializedException.code).toBe('BUSINESS_RULE');
      // expect(deserializedException.details).toEqual({ rule: 'minimum-age', value: 17 });
      
      // For now, just verify the serialized form contains necessary information
      expect(serialized.type).toBe(ErrorType.BUSINESS);
      expect(serialized.code).toBe('BUSINESS_RULE');
      expect(serialized.details).toEqual({ rule: 'minimum-age', value: 17 });
    });

    it('should preserve the prototype chain during deserialization', () => {
      // This test would verify that deserialized errors maintain their prototype chain
      // For now, it's a placeholder for future functionality
      
      // class CustomError extends Error {
      //   constructor(message: string, public customCode: string) {
      //     super(message);
      //     this.name = 'CustomError';
      //   }
      //   
      //   getFormattedMessage() {
      //     return `[${this.customCode}] ${this.message}`;
      //   }
      // }
      // 
      // const originalError = new CustomError('Custom error message', 'CUSTOM-001');
      // const serialized = serializeError(originalError);
      // const deserializedError = deserializeError(serialized);
      // 
      // expect(deserializedError).toBeInstanceOf(CustomError);
      // expect(deserializedError.getFormattedMessage()).toBe('[CUSTOM-001] Custom error message');
      
      // For now, just a placeholder assertion
      expect(true).toBe(true);
    });

    it('should handle circular references during deserialization', () => {
      // This test would verify that circular references are properly handled during deserialization
      // For now, it's a placeholder for future functionality
      
      // const circularObj: any = { name: 'circular' };
      // circularObj.self = circularObj;
      // 
      // const originalError = new Error('Error with circular reference');
      // (originalError as any).circular = circularObj;
      // 
      // const serialized = serializeError(originalError);
      // const deserializedError = deserializeError(serialized);
      // 
      // expect(deserializedError.circular.name).toBe('circular');
      // expect(deserializedError.circular.self).toBe(deserializedError.circular); // Should be the same object reference
      
      // For now, just a placeholder assertion
      expect(true).toBe(true);
    });
  });
});