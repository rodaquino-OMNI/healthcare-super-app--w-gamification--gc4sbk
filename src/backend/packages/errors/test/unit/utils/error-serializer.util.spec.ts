import { BaseError, ErrorType, JourneyContext } from '../../../src/base';
import {
  serializeErrorForTransport,
  deserializeErrorFromTransport,
  registerErrorType,
  cloneError,
} from '../../../src/utils/error-serializer.util';
import { ValidationError } from '../../../src/categories/validation.errors';
import { BusinessError } from '../../../src/categories/business.errors';
import { TechnicalError } from '../../../src/categories/technical.errors';
import { ExternalError } from '../../../src/categories/external.errors';

describe('Error Serializer Utility', () => {
  describe('serializeErrorForTransport', () => {
    it('should serialize a standard Error object', () => {
      // Arrange
      const error = new Error('Test error message');
      
      // Act
      const serialized = serializeErrorForTransport(error);
      
      // Assert
      expect(serialized).toBeDefined();
      expect(serialized.message).toBe('Test error message');
      expect(serialized.name).toBe('Error');
      expect(serialized.type).toBe(ErrorType.TECHNICAL); // Default type for standard errors
    });
    
    it('should serialize a BaseError object with all properties', () => {
      // Arrange
      const context = { 
        journey: JourneyContext.HEALTH,
        userId: 'user123',
        requestId: 'req456',
      };
      const details = { field: 'username', constraint: 'required' };
      const error = new BaseError(
        'Invalid input data',
        ErrorType.VALIDATION,
        'VALIDATION_ERROR',
        context,
        details,
        'Please provide all required fields',
      );
      
      // Act
      const serialized = serializeErrorForTransport(error);
      
      // Assert
      expect(serialized).toBeDefined();
      expect(serialized.message).toBe('Invalid input data');
      expect(serialized.name).toBe('BaseError');
      expect(serialized.type).toBe(ErrorType.VALIDATION);
      expect(serialized.code).toBe('VALIDATION_ERROR');
      expect(serialized.details).toEqual(details);
      expect(serialized.originalError).toBeDefined();
      expect(serialized.originalError.context).toEqual(context);
      expect(serialized.originalError.suggestion).toBe('Please provide all required fields');
    });
    
    it('should serialize nested errors with cause chain', () => {
      // Arrange
      const rootCause = new Error('Database connection failed');
      const midLevel = new BaseError(
        'Failed to fetch user data',
        ErrorType.TECHNICAL,
        'DB_ERROR',
        { journey: JourneyContext.SYSTEM },
        undefined,
        undefined,
        rootCause
      );
      const topLevel = new BaseError(
        'Cannot process user request',
        ErrorType.BUSINESS,
        'PROCESS_ERROR',
        { journey: JourneyContext.HEALTH },
        { userId: 'user123' },
        'Try again later',
        midLevel
      );
      
      // Act
      const serialized = serializeErrorForTransport(topLevel, { maxCauseDepth: 5 });
      
      // Assert
      expect(serialized).toBeDefined();
      expect(serialized.message).toBe('Cannot process user request');
      expect(serialized.type).toBe(ErrorType.BUSINESS);
      expect(serialized.cause).toBeDefined();
      expect(serialized.cause.message).toBe('Failed to fetch user data');
      expect(serialized.cause.type).toBe(ErrorType.TECHNICAL);
      expect(serialized.cause.cause).toBeDefined();
      expect(serialized.cause.cause.message).toBe('Database connection failed');
    });
    
    it('should handle non-Error objects', () => {
      // Arrange
      const nonError = { foo: 'bar' };
      
      // Act
      const serialized = serializeErrorForTransport(nonError);
      
      // Assert
      expect(serialized).toBeDefined();
      expect(serialized.message).toBe('[object Object]');
      expect(serialized.name).toBe('UnknownError');
      expect(serialized.type).toBe(ErrorType.TECHNICAL);
      expect(serialized.details).toEqual(nonError);
    });
    
    it('should redact sensitive information when specified', () => {
      // Arrange
      const error = new BaseError(
        'Authentication failed',
        ErrorType.AUTHENTICATION,
        'AUTH_ERROR',
        { journey: JourneyContext.AUTH },
        { 
          username: 'testuser',
          password: 'secret123', // Should be redacted
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // Should be redacted
          creditCard: '4111-1111-1111-1111', // Should be redacted
        }
      );
      
      // Act
      const serialized = serializeErrorForTransport(error, { redactSensitive: true });
      
      // Assert
      expect(serialized).toBeDefined();
      expect(serialized.details).toBeDefined();
      expect(serialized.details.username).toBe('testuser'); // Not redacted
      expect(serialized.details.password).toBe('[REDACTED]'); // Redacted
      expect(serialized.details.token).toBe('[REDACTED]'); // Redacted
      expect(serialized.details.creditCard).toBe('[REDACTED]'); // Redacted
    });
    
    it('should handle circular references in error objects', () => {
      // Arrange
      const circular: any = { name: 'circular' };
      circular.self = circular; // Create circular reference
      
      const error = new BaseError(
        'Error with circular reference',
        ErrorType.TECHNICAL,
        'CIRCULAR_ERROR',
        { journey: JourneyContext.SYSTEM },
        circular
      );
      
      // Act & Assert
      expect(() => {
        serializeErrorForTransport(error);
      }).not.toThrow(); // Should not throw due to circular reference
    });
  });
  
  describe('deserializeErrorFromTransport', () => {
    it('should deserialize a standard Error object', () => {
      // Arrange
      const original = new Error('Test error message');
      const serialized = serializeErrorForTransport(original);
      
      // Act
      const deserialized = deserializeErrorFromTransport(serialized);
      
      // Assert
      expect(deserialized).toBeInstanceOf(Error);
      expect(deserialized.message).toBe('Test error message');
      expect(deserialized.name).toBe('Error');
    });
    
    it('should deserialize a BaseError object with all properties', () => {
      // Arrange
      const context = { 
        journey: JourneyContext.HEALTH,
        userId: 'user123',
        requestId: 'req456',
      };
      const details = { field: 'username', constraint: 'required' };
      const original = new BaseError(
        'Invalid input data',
        ErrorType.VALIDATION,
        'VALIDATION_ERROR',
        context,
        details,
        'Please provide all required fields'
      );
      const serialized = serializeErrorForTransport(original);
      
      // Act
      const deserialized = deserializeErrorFromTransport(serialized);
      
      // Assert
      expect(deserialized).toBeInstanceOf(BaseError);
      expect(deserialized.message).toBe('Invalid input data');
      expect(deserialized.name).toBe('BaseError');
      expect((deserialized as BaseError).type).toBe(ErrorType.VALIDATION);
      expect((deserialized as BaseError).code).toBe('VALIDATION_ERROR');
      expect((deserialized as BaseError).details).toEqual(details);
      expect((deserialized as BaseError).context).toEqual(context);
      expect((deserialized as BaseError).suggestion).toBe('Please provide all required fields');
    });
    
    it('should deserialize nested errors with cause chain', () => {
      // Arrange
      const rootCause = new Error('Database connection failed');
      const midLevel = new BaseError(
        'Failed to fetch user data',
        ErrorType.TECHNICAL,
        'DB_ERROR',
        { journey: JourneyContext.SYSTEM },
        undefined,
        undefined,
        rootCause
      );
      const original = new BaseError(
        'Cannot process user request',
        ErrorType.BUSINESS,
        'PROCESS_ERROR',
        { journey: JourneyContext.HEALTH },
        { userId: 'user123' },
        'Try again later',
        midLevel
      );
      const serialized = serializeErrorForTransport(original, { maxCauseDepth: 5 });
      
      // Act
      const deserialized = deserializeErrorFromTransport(serialized);
      
      // Assert
      expect(deserialized).toBeInstanceOf(BaseError);
      expect(deserialized.message).toBe('Cannot process user request');
      expect((deserialized as BaseError).type).toBe(ErrorType.BUSINESS);
      expect(deserialized.cause).toBeDefined();
      expect(deserialized.cause.message).toBe('Failed to fetch user data');
      expect((deserialized.cause as BaseError).type).toBe(ErrorType.TECHNICAL);
      expect(deserialized.cause.cause).toBeDefined();
      expect(deserialized.cause.cause.message).toBe('Database connection failed');
    });
    
    it('should preserve stack traces when specified', () => {
      // Arrange
      const original = new Error('Test error with stack');
      const serialized = serializeErrorForTransport(original, { includeStack: true });
      
      // Act
      const deserialized = deserializeErrorFromTransport(serialized, { includeStack: true });
      
      // Assert
      expect(deserialized.stack).toBeDefined();
      expect(deserialized.stack).toBe(original.stack);
    });
    
    it('should handle invalid serialized error format', () => {
      // Arrange
      const invalidSerialized = { foo: 'bar' } as any;
      
      // Act
      const deserialized = deserializeErrorFromTransport(invalidSerialized);
      
      // Assert
      expect(deserialized).toBeInstanceOf(Error);
      expect(deserialized.message).toBe('Invalid serialized error format');
    });
  });
  
  describe('registerErrorType', () => {
    class CustomError extends BaseError {
      constructor(message: string, details?: any) {
        super(
          message,
          ErrorType.BUSINESS,
          'CUSTOM_ERROR',
          { journey: JourneyContext.SYSTEM },
          details
        );
        this.name = 'CustomError';
        Object.setPrototypeOf(this, CustomError.prototype);
      }
      
      getCustomProperty() {
        return 'custom value';
      }
    }
    
    beforeAll(() => {
      // Register the custom error type
      registerErrorType('CustomError', CustomError);
    });
    
    it('should reconstruct registered error types with proper prototype chain', () => {
      // Arrange
      const original = new CustomError('Custom error message', { foo: 'bar' });
      const serialized = serializeErrorForTransport(original);
      
      // Act
      const deserialized = deserializeErrorFromTransport(serialized);
      
      // Assert
      expect(deserialized).toBeInstanceOf(CustomError);
      expect(deserialized.message).toBe('Custom error message');
      expect((deserialized as CustomError).getCustomProperty()).toBe('custom value');
      expect((deserialized as BaseError).details).toEqual({ foo: 'bar' });
    });
    
    it('should fall back to BaseError for unregistered error types', () => {
      // Arrange
      class UnregisteredError extends BaseError {
        constructor(message: string) {
          super(
            message,
            ErrorType.TECHNICAL,
            'UNREGISTERED_ERROR',
            { journey: JourneyContext.SYSTEM }
          );
          this.name = 'UnregisteredError';
          Object.setPrototypeOf(this, UnregisteredError.prototype);
        }
      }
      
      const original = new UnregisteredError('Unregistered error message');
      const serialized = serializeErrorForTransport(original);
      
      // Act
      const deserialized = deserializeErrorFromTransport(serialized);
      
      // Assert
      expect(deserialized).toBeInstanceOf(BaseError);
      expect(deserialized).not.toBeInstanceOf(UnregisteredError);
      expect(deserialized.message).toBe('Unregistered error message');
      expect(deserialized.name).toBe('UnregisteredError'); // Name is preserved
      expect((deserialized as BaseError).type).toBe(ErrorType.TECHNICAL);
      expect((deserialized as BaseError).code).toBe('UNREGISTERED_ERROR');
    });
  });
  
  describe('cloneError', () => {
    it('should create a deep clone of an error object', () => {
      // Arrange
      const original = new BaseError(
        'Original error',
        ErrorType.BUSINESS,
        'ORIGINAL_ERROR',
        { journey: JourneyContext.HEALTH, userId: 'user123' },
        { data: { nested: { value: 42 } } }
      );
      
      // Act
      const clone = cloneError(original) as BaseError;
      
      // Assert
      expect(clone).not.toBe(original); // Different object reference
      expect(clone).toBeInstanceOf(BaseError);
      expect(clone.message).toBe('Original error');
      expect(clone.type).toBe(ErrorType.BUSINESS);
      expect(clone.code).toBe('ORIGINAL_ERROR');
      expect(clone.context).toEqual({ journey: JourneyContext.HEALTH, userId: 'user123' });
      expect(clone.details).toEqual({ data: { nested: { value: 42 } } });
      
      // Verify deep clone by modifying the clone
      clone.details.data.nested.value = 99;
      expect(original.details.data.nested.value).toBe(42); // Original unchanged
    });
    
    it('should preserve the prototype chain in cloned errors', () => {
      // Arrange
      const original = new ValidationError('Validation failed', 'FIELD_REQUIRED', { field: 'username' });
      
      // Act
      const clone = cloneError(original);
      
      // Assert
      expect(clone).toBeInstanceOf(ValidationError);
      expect(clone).toBeInstanceOf(BaseError);
      expect(clone.message).toBe('Validation failed');
      expect((clone as ValidationError).code).toBe('FIELD_REQUIRED');
    });
  });
  
  describe('Integration with error categories', () => {
    beforeAll(() => {
      // Register error types from categories
      registerErrorType('ValidationError', ValidationError);
      registerErrorType('BusinessError', BusinessError);
      registerErrorType('TechnicalError', TechnicalError);
      registerErrorType('ExternalError', ExternalError);
    });
    
    it('should properly serialize and deserialize ValidationError', () => {
      // Arrange
      const original = new ValidationError(
        'Invalid email format',
        'INVALID_EMAIL',
        { field: 'email', value: 'not-an-email' }
      );
      
      // Act
      const serialized = serializeErrorForTransport(original);
      const deserialized = deserializeErrorFromTransport(serialized);
      
      // Assert
      expect(deserialized).toBeInstanceOf(ValidationError);
      expect(deserialized.message).toBe('Invalid email format');
      expect((deserialized as ValidationError).code).toBe('INVALID_EMAIL');
      expect((deserialized as ValidationError).details).toEqual({ field: 'email', value: 'not-an-email' });
    });
    
    it('should properly serialize and deserialize BusinessError', () => {
      // Arrange
      const original = new BusinessError(
        'Insufficient funds',
        'INSUFFICIENT_FUNDS',
        { available: 100, required: 150 }
      );
      
      // Act
      const serialized = serializeErrorForTransport(original);
      const deserialized = deserializeErrorFromTransport(serialized);
      
      // Assert
      expect(deserialized).toBeInstanceOf(BusinessError);
      expect(deserialized.message).toBe('Insufficient funds');
      expect((deserialized as BusinessError).code).toBe('INSUFFICIENT_FUNDS');
      expect((deserialized as BusinessError).details).toEqual({ available: 100, required: 150 });
    });
    
    it('should properly serialize and deserialize TechnicalError', () => {
      // Arrange
      const original = new TechnicalError(
        'Database connection failed',
        'DB_CONNECTION_ERROR',
        { host: 'db.example.com', port: 5432 }
      );
      
      // Act
      const serialized = serializeErrorForTransport(original);
      const deserialized = deserializeErrorFromTransport(serialized);
      
      // Assert
      expect(deserialized).toBeInstanceOf(TechnicalError);
      expect(deserialized.message).toBe('Database connection failed');
      expect((deserialized as TechnicalError).code).toBe('DB_CONNECTION_ERROR');
      expect((deserialized as TechnicalError).details).toEqual({ host: 'db.example.com', port: 5432 });
    });
    
    it('should properly serialize and deserialize ExternalError', () => {
      // Arrange
      const original = new ExternalError(
        'External API unavailable',
        'API_UNAVAILABLE',
        { service: 'payment-gateway', statusCode: 503 }
      );
      
      // Act
      const serialized = serializeErrorForTransport(original);
      const deserialized = deserializeErrorFromTransport(serialized);
      
      // Assert
      expect(deserialized).toBeInstanceOf(ExternalError);
      expect(deserialized.message).toBe('External API unavailable');
      expect((deserialized as ExternalError).code).toBe('API_UNAVAILABLE');
      expect((deserialized as ExternalError).details).toEqual({ service: 'payment-gateway', statusCode: 503 });
    });
  });
});