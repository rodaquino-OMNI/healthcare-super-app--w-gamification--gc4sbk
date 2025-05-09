import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorContext, ErrorType, JourneyContext, SerializedError } from '../../src/base';

describe('BaseError', () => {
  // Test basic instantiation and properties
  describe('constructor', () => {
    it('should create a BaseError with required properties', () => {
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TEST_001');
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('TEST_001');
      expect(error.context).toEqual(expect.objectContaining({
        timestamp: expect.any(Date)
      }));
    });

    it('should create a BaseError with all properties', () => {
      const context: ErrorContext = {
        journey: JourneyContext.HEALTH,
        userId: 'user123',
        requestId: 'req456',
        traceId: 'trace789',
        timestamp: new Date('2023-01-01T00:00:00Z')
      };
      
      const details = { field: 'name', constraint: 'required' };
      const suggestion = 'Please provide a name';
      const cause = new Error('Original error');
      
      const error = new BaseError(
        'Test error',
        ErrorType.VALIDATION,
        'VALIDATION_001',
        context,
        details,
        suggestion,
        cause
      );
      
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('VALIDATION_001');
      expect(error.context).toEqual(context);
      expect(error.details).toEqual(details);
      expect(error.suggestion).toBe(suggestion);
      expect(error.cause).toBe(cause);
    });

    it('should set default timestamp if not provided', () => {
      const beforeTest = new Date();
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TEST_001');
      const afterTest = new Date();
      
      expect(error.context.timestamp).toBeInstanceOf(Date);
      expect(error.context.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
      expect(error.context.timestamp.getTime()).toBeLessThanOrEqual(afterTest.getTime());
    });

    it('should maintain proper prototype chain for instanceof checks', () => {
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TEST_001');
      
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  // Test HTTP status code mapping
  describe('getHttpStatusCode', () => {
    it('should map VALIDATION to BAD_REQUEST (400)', () => {
      const error = new BaseError('Validation error', ErrorType.VALIDATION, 'VAL_001');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should map AUTHENTICATION to UNAUTHORIZED (401)', () => {
      const error = new BaseError('Auth error', ErrorType.AUTHENTICATION, 'AUTH_001');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should map AUTHORIZATION to FORBIDDEN (403)', () => {
      const error = new BaseError('Permission error', ErrorType.AUTHORIZATION, 'PERM_001');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.FORBIDDEN);
    });

    it('should map NOT_FOUND to NOT_FOUND (404)', () => {
      const error = new BaseError('Not found error', ErrorType.NOT_FOUND, 'NF_001');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should map CONFLICT to CONFLICT (409)', () => {
      const error = new BaseError('Conflict error', ErrorType.CONFLICT, 'CONF_001');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.CONFLICT);
    });

    it('should map BUSINESS to UNPROCESSABLE_ENTITY (422)', () => {
      const error = new BaseError('Business error', ErrorType.BUSINESS, 'BUS_001');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should map RATE_LIMIT to TOO_MANY_REQUESTS (429)', () => {
      const error = new BaseError('Rate limit error', ErrorType.RATE_LIMIT, 'RATE_001');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('should map TECHNICAL to INTERNAL_SERVER_ERROR (500)', () => {
      const error = new BaseError('Technical error', ErrorType.TECHNICAL, 'TECH_001');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should map EXTERNAL to BAD_GATEWAY (502)', () => {
      const error = new BaseError('External error', ErrorType.EXTERNAL, 'EXT_001');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should map UNAVAILABLE to SERVICE_UNAVAILABLE (503)', () => {
      const error = new BaseError('Unavailable error', ErrorType.UNAVAILABLE, 'UNAVAIL_001');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it('should map TIMEOUT to GATEWAY_TIMEOUT (504)', () => {
      const error = new BaseError('Timeout error', ErrorType.TIMEOUT, 'TIMEOUT_001');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.GATEWAY_TIMEOUT);
    });

    it('should default to INTERNAL_SERVER_ERROR for unknown types', () => {
      // @ts-ignore - Testing with invalid type
      const error = new BaseError('Unknown error', 'UNKNOWN', 'UNK_001');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  // Test context handling and enrichment methods
  describe('context handling', () => {
    it('should add additional context with withContext', () => {
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TEST_001', {
        journey: JourneyContext.HEALTH
      });
      
      const enrichedError = error.withContext({
        userId: 'user123',
        requestId: 'req456'
      });
      
      expect(enrichedError).toBeInstanceOf(BaseError);
      expect(enrichedError).not.toBe(error); // Should be a new instance
      expect(enrichedError.context).toEqual(expect.objectContaining({
        journey: JourneyContext.HEALTH,
        userId: 'user123',
        requestId: 'req456'
      }));
      
      // Original error should be unchanged
      expect(error.context).toEqual(expect.objectContaining({
        journey: JourneyContext.HEALTH
      }));
      expect(error.context.userId).toBeUndefined();
    });

    it('should add additional details with withDetails', () => {
      const error = new BaseError(
        'Test error',
        ErrorType.TECHNICAL,
        'TEST_001',
        {},
        { originalDetail: 'value' }
      );
      
      const enrichedError = error.withDetails({
        additionalDetail: 'new value'
      });
      
      expect(enrichedError).toBeInstanceOf(BaseError);
      expect(enrichedError).not.toBe(error); // Should be a new instance
      expect(enrichedError.details).toEqual({
        originalDetail: 'value',
        additionalDetail: 'new value'
      });
      
      // Original error should be unchanged
      expect(error.details).toEqual({ originalDetail: 'value' });
    });

    it('should add suggestion with withSuggestion', () => {
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TEST_001');
      const enrichedError = error.withSuggestion('Try this solution');
      
      expect(enrichedError).toBeInstanceOf(BaseError);
      expect(enrichedError).not.toBe(error); // Should be a new instance
      expect(enrichedError.suggestion).toBe('Try this solution');
      
      // Original error should be unchanged
      expect(error.suggestion).toBeUndefined();
    });

    it('should add cause with withCause', () => {
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TEST_001');
      const cause = new Error('Original error');
      const enrichedError = error.withCause(cause);
      
      expect(enrichedError).toBeInstanceOf(BaseError);
      expect(enrichedError).not.toBe(error); // Should be a new instance
      expect(enrichedError.cause).toBe(cause);
      
      // Original error should be unchanged
      expect(error.cause).toBeUndefined();
    });
  });

  // Test serialization
  describe('toJSON', () => {
    it('should serialize the error to a standardized format', () => {
      const timestamp = new Date('2023-01-01T00:00:00Z');
      const error = new BaseError(
        'Test error',
        ErrorType.VALIDATION,
        'VAL_001',
        {
          journey: JourneyContext.HEALTH,
          userId: 'user123',
          requestId: 'req456',
          timestamp
        },
        { field: 'name' },
        'Please provide a name'
      );
      
      const serialized = error.toJSON();
      const expected: SerializedError = {
        error: {
          type: ErrorType.VALIDATION,
          code: 'VAL_001',
          message: 'Test error',
          journey: JourneyContext.HEALTH,
          requestId: 'req456',
          timestamp: timestamp.toISOString(),
          details: { field: 'name' },
          suggestion: 'Please provide a name'
        }
      };
      
      expect(serialized).toEqual(expected);
    });

    it('should handle missing optional properties in serialization', () => {
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TECH_001');
      
      const serialized = error.toJSON();
      
      expect(serialized).toEqual({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'TECH_001',
          message: 'Test error',
          timestamp: expect.any(String)
        }
      });
    });
  });

  // Test HTTP exception conversion
  describe('toHttpException', () => {
    it('should convert to HttpException with correct status code', () => {
      const error = new BaseError('Test error', ErrorType.VALIDATION, 'VAL_001');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });
  });

  // Test error classification
  describe('error classification', () => {
    it('should correctly identify client errors', () => {
      const clientErrors = [
        new BaseError('Validation', ErrorType.VALIDATION, 'VAL_001'),
        new BaseError('Authentication', ErrorType.AUTHENTICATION, 'AUTH_001'),
        new BaseError('Authorization', ErrorType.AUTHORIZATION, 'PERM_001'),
        new BaseError('Not Found', ErrorType.NOT_FOUND, 'NF_001'),
        new BaseError('Conflict', ErrorType.CONFLICT, 'CONF_001'),
        new BaseError('Business', ErrorType.BUSINESS, 'BUS_001'),
        new BaseError('Rate Limit', ErrorType.RATE_LIMIT, 'RATE_001')
      ];
      
      clientErrors.forEach(error => {
        expect(error.isClientError()).toBe(true);
        expect(error.isServerError()).toBe(false);
      });
    });

    it('should correctly identify server errors', () => {
      const serverErrors = [
        new BaseError('Technical', ErrorType.TECHNICAL, 'TECH_001'),
        new BaseError('External', ErrorType.EXTERNAL, 'EXT_001'),
        new BaseError('Unavailable', ErrorType.UNAVAILABLE, 'UNAVAIL_001'),
        new BaseError('Timeout', ErrorType.TIMEOUT, 'TIMEOUT_001')
      ];
      
      serverErrors.forEach(error => {
        expect(error.isServerError()).toBe(true);
        expect(error.isClientError()).toBe(false);
      });
    });

    it('should correctly identify retryable errors', () => {
      const retryableErrors = [
        new BaseError('Technical', ErrorType.TECHNICAL, 'TECH_001'),
        new BaseError('External', ErrorType.EXTERNAL, 'EXT_001'),
        new BaseError('Unavailable', ErrorType.UNAVAILABLE, 'UNAVAIL_001'),
        new BaseError('Timeout', ErrorType.TIMEOUT, 'TIMEOUT_001'),
        new BaseError('Rate Limit', ErrorType.RATE_LIMIT, 'RATE_001')
      ];
      
      retryableErrors.forEach(error => {
        expect(error.isRetryable()).toBe(true);
      });
      
      const nonRetryableErrors = [
        new BaseError('Validation', ErrorType.VALIDATION, 'VAL_001'),
        new BaseError('Authentication', ErrorType.AUTHENTICATION, 'AUTH_001'),
        new BaseError('Authorization', ErrorType.AUTHORIZATION, 'PERM_001'),
        new BaseError('Not Found', ErrorType.NOT_FOUND, 'NF_001'),
        new BaseError('Conflict', ErrorType.CONFLICT, 'CONF_001'),
        new BaseError('Business', ErrorType.BUSINESS, 'BUS_001')
      ];
      
      nonRetryableErrors.forEach(error => {
        expect(error.isRetryable()).toBe(false);
      });
    });
  });

  // Test logging integration
  describe('toLogEntry', () => {
    it('should create a standardized log entry with all properties', () => {
      const timestamp = new Date('2023-01-01T00:00:00Z');
      const cause = new Error('Original error');
      cause.stack = 'Error: Original error\n    at Test.stack';
      
      const error = new BaseError(
        'Test error',
        ErrorType.VALIDATION,
        'VAL_001',
        {
          journey: JourneyContext.HEALTH,
          userId: 'user123',
          requestId: 'req456',
          timestamp
        },
        { field: 'name' },
        'Please provide a name',
        cause
      );
      
      // Mock the stack trace for consistent testing
      error.stack = 'Error: Test error\n    at Test.stack';
      
      const logEntry = error.toLogEntry();
      
      expect(logEntry).toEqual({
        error: {
          name: 'BaseError',
          type: ErrorType.VALIDATION,
          code: 'VAL_001',
          message: 'Test error',
          stack: 'Error: Test error\n    at Test.stack',
          cause: {
            name: 'Error',
            message: 'Original error',
            stack: 'Error: Original error\n    at Test.stack'
          },
          details: { field: 'name' }
        },
        context: {
          journey: JourneyContext.HEALTH,
          userId: 'user123',
          requestId: 'req456',
          timestamp
        },
        timestamp: timestamp.toISOString(),
        httpStatus: HttpStatus.BAD_REQUEST
      });
    });

    it('should handle missing optional properties in log entry', () => {
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TECH_001');
      // Mock the stack trace for consistent testing
      error.stack = 'Error: Test error\n    at Test.stack';
      
      const logEntry = error.toLogEntry();
      
      expect(logEntry).toEqual({
        error: {
          name: 'BaseError',
          type: ErrorType.TECHNICAL,
          code: 'TECH_001',
          message: 'Test error',
          stack: 'Error: Test error\n    at Test.stack',
          details: undefined
        },
        context: {
          timestamp: expect.any(Date)
        },
        timestamp: expect.any(String),
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR
      });
    });
  });

  // Test static factory method
  describe('from', () => {
    it('should convert a standard Error to BaseError', () => {
      const originalError = new Error('Original error');
      const baseError = BaseError.from(originalError);
      
      expect(baseError).toBeInstanceOf(BaseError);
      expect(baseError.message).toBe('Original error');
      expect(baseError.type).toBe(ErrorType.TECHNICAL);
      expect(baseError.code).toBe('UNKNOWN_ERROR');
      expect(baseError.cause).toBe(originalError);
    });

    it('should return the original BaseError with added context', () => {
      const originalError = new BaseError(
        'Original error',
        ErrorType.VALIDATION,
        'VAL_001',
        { journey: JourneyContext.HEALTH }
      );
      
      const context = { userId: 'user123' };
      const resultError = BaseError.from(originalError, ErrorType.TECHNICAL, 'TECH_001', context);
      
      expect(resultError).toBeInstanceOf(BaseError);
      expect(resultError).not.toBe(originalError); // Should be a new instance
      expect(resultError.message).toBe('Original error');
      expect(resultError.type).toBe(ErrorType.VALIDATION); // Should keep original type
      expect(resultError.code).toBe('VAL_001'); // Should keep original code
      expect(resultError.context).toEqual(expect.objectContaining({
        journey: JourneyContext.HEALTH,
        userId: 'user123'
      }));
    });

    it('should convert a string to BaseError', () => {
      const baseError = BaseError.from('String error');
      
      expect(baseError).toBeInstanceOf(BaseError);
      expect(baseError.message).toBe('String error');
      expect(baseError.type).toBe(ErrorType.TECHNICAL);
      expect(baseError.code).toBe('UNKNOWN_ERROR');
    });

    it('should convert an unknown object to BaseError', () => {
      const obj = { foo: 'bar' };
      const baseError = BaseError.from(obj);
      
      expect(baseError).toBeInstanceOf(BaseError);
      expect(baseError.message).toBe('Unknown error: {"foo":"bar"}');
      expect(baseError.type).toBe(ErrorType.TECHNICAL);
      expect(baseError.code).toBe('UNKNOWN_ERROR');
    });

    it('should use provided default type and code', () => {
      const baseError = BaseError.from(
        'Custom error',
        ErrorType.BUSINESS,
        'CUSTOM_ERROR'
      );
      
      expect(baseError).toBeInstanceOf(BaseError);
      expect(baseError.message).toBe('Custom error');
      expect(baseError.type).toBe(ErrorType.BUSINESS);
      expect(baseError.code).toBe('CUSTOM_ERROR');
    });

    it('should use provided context', () => {
      const context = {
        journey: JourneyContext.CARE,
        userId: 'user123',
        requestId: 'req456'
      };
      
      const baseError = BaseError.from('Context error', ErrorType.TECHNICAL, 'CONTEXT_ERROR', context);
      
      expect(baseError).toBeInstanceOf(BaseError);
      expect(baseError.context).toEqual(expect.objectContaining(context));
    });
  });
});