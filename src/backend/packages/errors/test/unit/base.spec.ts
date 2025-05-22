import { HttpStatus } from '@nestjs/common';
import { context, trace, SpanStatusCode } from '@opentelemetry/api';
import { BaseError, ErrorType, JourneyType, ErrorContext } from '../../src/base';

// Mock OpenTelemetry
jest.mock('@opentelemetry/api', () => {
  const mockSetStatus = jest.fn();
  const mockRecordException = jest.fn();
  const mockSetAttribute = jest.fn();
  const mockSpanContext = jest.fn().mockReturnValue({
    traceId: 'test-trace-id',
    spanId: 'test-span-id'
  });
  
  const mockSpan = {
    setStatus: mockSetStatus,
    recordException: mockRecordException,
    setAttribute: mockSetAttribute,
    spanContext: mockSpanContext
  };
  
  const mockGetSpan = jest.fn().mockReturnValue(mockSpan);
  
  return {
    context: {
      active: jest.fn().mockReturnValue({})
    },
    trace: {
      getSpan: mockGetSpan
    },
    SpanStatusCode: {
      ERROR: 'ERROR'
    },
    mockSpan,
    mockGetSpan,
    mockSetStatus,
    mockRecordException,
    mockSetAttribute
  };
});

describe('BaseError', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and basic properties', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Test error message';
      const type = ErrorType.TECHNICAL;
      const code = 'TEST_ERROR_001';
      const details = { foo: 'bar' };
      
      const error = new BaseError(message, type, code, undefined, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(type);
      expect(error.code).toBe(code);
      expect(error.details).toEqual(details);
      expect(error.name).toBe('BaseError');
    });

    it('should capture stack trace', () => {
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TEST_001');
      
      expect(error.stack).toBeDefined();
      expect(error.context.stack).toBe(error.stack);
    });

    it('should initialize context with defaults', () => {
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TEST_001');
      
      expect(error.context).toBeDefined();
      expect(error.context.timestamp).toBeInstanceOf(Date);
      expect(error.context.stack).toBeDefined();
    });

    it('should merge provided context with defaults', () => {
      const customContext: Partial<ErrorContext> = {
        userId: 'user-123',
        operation: 'test-operation',
        component: 'test-component',
        metadata: { test: 'data' }
      };
      
      const error = new BaseError(
        'Test error', 
        ErrorType.TECHNICAL, 
        'TEST_001', 
        customContext
      );
      
      expect(error.context.userId).toBe(customContext.userId);
      expect(error.context.operation).toBe(customContext.operation);
      expect(error.context.component).toBe(customContext.component);
      expect(error.context.metadata).toEqual(customContext.metadata);
      expect(error.context.timestamp).toBeInstanceOf(Date);
    });

    it('should support error cause chains', () => {
      const cause = new Error('Original error');
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TEST_001', undefined, undefined, cause);
      
      expect(error.cause).toBe(cause);
    });
  });

  describe('Error classification', () => {
    it('should support validation errors', () => {
      const error = new BaseError('Invalid input', ErrorType.VALIDATION, 'VALIDATION_001');
      
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error).toBeErrorType(ErrorType.VALIDATION);
    });

    it('should support business errors', () => {
      const error = new BaseError('Business rule violation', ErrorType.BUSINESS, 'BUSINESS_001');
      
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error).toBeErrorType(ErrorType.BUSINESS);
    });

    it('should support technical errors', () => {
      const error = new BaseError('System failure', ErrorType.TECHNICAL, 'TECHNICAL_001');
      
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error).toBeErrorType(ErrorType.TECHNICAL);
    });

    it('should support external errors', () => {
      const error = new BaseError('External API failure', ErrorType.EXTERNAL, 'EXTERNAL_001');
      
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error).toBeErrorType(ErrorType.EXTERNAL);
    });

    it('should support authentication errors', () => {
      const error = new BaseError('Authentication failed', ErrorType.AUTHENTICATION, 'AUTH_001');
      
      expect(error.type).toBe(ErrorType.AUTHENTICATION);
      expect(error).toBeErrorType(ErrorType.AUTHENTICATION);
    });

    it('should support authorization errors', () => {
      const error = new BaseError('Not authorized', ErrorType.AUTHORIZATION, 'AUTH_002');
      
      expect(error.type).toBe(ErrorType.AUTHORIZATION);
      expect(error).toBeErrorType(ErrorType.AUTHORIZATION);
    });

    it('should support not found errors', () => {
      const error = new BaseError('Resource not found', ErrorType.NOT_FOUND, 'NOT_FOUND_001');
      
      expect(error.type).toBe(ErrorType.NOT_FOUND);
      expect(error).toBeErrorType(ErrorType.NOT_FOUND);
    });

    it('should support conflict errors', () => {
      const error = new BaseError('Resource conflict', ErrorType.CONFLICT, 'CONFLICT_001');
      
      expect(error.type).toBe(ErrorType.CONFLICT);
      expect(error).toBeErrorType(ErrorType.CONFLICT);
    });

    it('should support rate limit errors', () => {
      const error = new BaseError('Rate limit exceeded', ErrorType.RATE_LIMIT, 'RATE_LIMIT_001');
      
      expect(error.type).toBe(ErrorType.RATE_LIMIT);
      expect(error).toBeErrorType(ErrorType.RATE_LIMIT);
    });

    it('should support timeout errors', () => {
      const error = new BaseError('Operation timed out', ErrorType.TIMEOUT, 'TIMEOUT_001');
      
      expect(error.type).toBe(ErrorType.TIMEOUT);
      expect(error).toBeErrorType(ErrorType.TIMEOUT);
    });
  });

  describe('HTTP status code mapping', () => {
    it('should map validation errors to 400 Bad Request', () => {
      const error = new BaseError('Invalid input', ErrorType.VALIDATION, 'VALIDATION_001');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should map business errors to 422 Unprocessable Entity', () => {
      const error = new BaseError('Business rule violation', ErrorType.BUSINESS, 'BUSINESS_001');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should map technical errors to 500 Internal Server Error', () => {
      const error = new BaseError('System failure', ErrorType.TECHNICAL, 'TECHNICAL_001');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should map external errors to 502 Bad Gateway', () => {
      const error = new BaseError('External API failure', ErrorType.EXTERNAL, 'EXTERNAL_001');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should map authentication errors to 401 Unauthorized', () => {
      const error = new BaseError('Authentication failed', ErrorType.AUTHENTICATION, 'AUTH_001');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should map authorization errors to 403 Forbidden', () => {
      const error = new BaseError('Not authorized', ErrorType.AUTHORIZATION, 'AUTH_002');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });

    it('should map not found errors to 404 Not Found', () => {
      const error = new BaseError('Resource not found', ErrorType.NOT_FOUND, 'NOT_FOUND_001');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should map conflict errors to 409 Conflict', () => {
      const error = new BaseError('Resource conflict', ErrorType.CONFLICT, 'CONFLICT_001');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.CONFLICT);
    });

    it('should map rate limit errors to 429 Too Many Requests', () => {
      const error = new BaseError('Rate limit exceeded', ErrorType.RATE_LIMIT, 'RATE_LIMIT_001');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('should map timeout errors to 504 Gateway Timeout', () => {
      const error = new BaseError('Operation timed out', ErrorType.TIMEOUT, 'TIMEOUT_001');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.GATEWAY_TIMEOUT);
    });

    it('should default to 500 Internal Server Error for unknown error types', () => {
      // @ts-ignore - Testing with invalid error type
      const error = new BaseError('Unknown error', 'UNKNOWN_TYPE', 'UNKNOWN_001');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('Error serialization', () => {
    it('should serialize to JSON with correct structure for client responses', () => {
      const message = 'Test error message';
      const type = ErrorType.TECHNICAL;
      const code = 'TEST_ERROR_001';
      const details = { foo: 'bar' };
      const context: Partial<ErrorContext> = {
        journey: JourneyType.HEALTH,
        requestId: 'req-123'
      };
      
      const error = new BaseError(message, type, code, context, details);
      const jsonResult = error.toJSON();
      
      expect(jsonResult).toHaveProperty('error');
      expect(jsonResult.error).toHaveProperty('type', type);
      expect(jsonResult.error).toHaveProperty('code', code);
      expect(jsonResult.error).toHaveProperty('message', message);
      expect(jsonResult.error).toHaveProperty('details', details);
      expect(jsonResult.error).toHaveProperty('journey', context.journey);
      expect(jsonResult.error).toHaveProperty('requestId', context.requestId);
      expect(jsonResult.error).toHaveProperty('timestamp');
      expect(typeof jsonResult.error.timestamp).toBe('string');
    });

    it('should provide detailed JSON for logging and debugging', () => {
      const message = 'Test error message';
      const type = ErrorType.TECHNICAL;
      const code = 'TEST_ERROR_001';
      const details = { foo: 'bar' };
      const cause = new Error('Original error');
      const context: Partial<ErrorContext> = {
        journey: JourneyType.HEALTH,
        requestId: 'req-123',
        userId: 'user-123',
        operation: 'test-operation'
      };
      
      const error = new BaseError(message, type, code, context, details, cause);
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('name', 'BaseError');
      expect(detailedJson).toHaveProperty('message', message);
      expect(detailedJson).toHaveProperty('type', type);
      expect(detailedJson).toHaveProperty('code', code);
      expect(detailedJson).toHaveProperty('details', details);
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('journey', context.journey);
      expect(detailedJson.context).toHaveProperty('requestId', context.requestId);
      expect(detailedJson.context).toHaveProperty('userId', context.userId);
      expect(detailedJson.context).toHaveProperty('operation', context.operation);
      expect(detailedJson.context).toHaveProperty('timestamp');
      expect(detailedJson.context).toHaveProperty('stack');
      expect(detailedJson).toHaveProperty('cause');
      expect(detailedJson.cause).toHaveProperty('name', 'Error');
      expect(detailedJson.cause).toHaveProperty('message', 'Original error');
      expect(detailedJson.cause).toHaveProperty('stack');
    });

    it('should handle missing cause in detailed JSON', () => {
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TEST_001');
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson.cause).toBeUndefined();
    });
  });

  describe('OpenTelemetry integration', () => {
    it('should capture trace context if available', () => {
      // Setup mock to return a span
      (trace.getSpan as jest.Mock).mockReturnValueOnce({
        spanContext: () => ({
          traceId: 'test-trace-id',
          spanId: 'test-span-id'
        }),
        setStatus: jest.fn(),
        recordException: jest.fn(),
        setAttribute: jest.fn()
      });
      
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TEST_001');
      
      expect(error.context.traceId).toBe('test-trace-id');
      expect(error.context.spanId).toBe('test-span-id');
    });

    it('should record error in current span if available', () => {
      const mockSpan = {
        spanContext: () => ({
          traceId: 'test-trace-id',
          spanId: 'test-span-id'
        }),
        setStatus: jest.fn(),
        recordException: jest.fn(),
        setAttribute: jest.fn()
      };
      
      (trace.getSpan as jest.Mock).mockReturnValueOnce(mockSpan);
      
      const message = 'Test error message';
      const type = ErrorType.TECHNICAL;
      const code = 'TEST_ERROR_001';
      const context: Partial<ErrorContext> = {
        journey: JourneyType.HEALTH,
        component: 'test-component',
        operation: 'test-operation',
        isTransient: true
      };
      
      new BaseError(message, type, code, context);
      
      // Verify span interactions
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message
      });
      
      expect(mockSpan.recordException).toHaveBeenCalledWith(expect.objectContaining({
        name: 'BaseError',
        message,
        code,
        type
      }));
      
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.type', type);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.code', code);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.journey', context.journey);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.component', context.component);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.operation', context.operation);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.transient', true);
    });
  });

  describe('Static factory methods', () => {
    describe('from()', () => {
      it('should create BaseError from standard Error', () => {
        const originalError = new Error('Original error');
        const error = BaseError.from(originalError);
        
        expect(error).toBeInstanceOf(BaseError);
        expect(error.message).toBe('Original error');
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe('UNKNOWN_ERROR');
        expect(error.cause).toBe(originalError);
      });

      it('should return existing BaseError unchanged', () => {
        const originalError = new BaseError('Original error', ErrorType.VALIDATION, 'VALIDATION_001');
        const error = BaseError.from(originalError);
        
        expect(error).toBe(originalError);
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.code).toBe('VALIDATION_001');
      });

      it('should add context to existing BaseError if provided', () => {
        const originalError = new BaseError('Original error', ErrorType.VALIDATION, 'VALIDATION_001');
        const newContext: Partial<ErrorContext> = { userId: 'user-123' };
        
        const error = BaseError.from(originalError, undefined, undefined, undefined, newContext);
        
        expect(error).toBe(originalError);
        expect(error.context.userId).toBe('user-123');
      });

      it('should handle non-Error objects', () => {
        const error = BaseError.from({ message: 'Not an error' });
        
        expect(error).toBeInstanceOf(BaseError);
        expect(error.message).toBe('An unexpected error occurred');
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe('UNKNOWN_ERROR');
      });

      it('should use custom defaults if provided', () => {
        const error = BaseError.from(
          new Error('Original error'),
          'Custom default message',
          ErrorType.BUSINESS,
          'CUSTOM_CODE'
        );
        
        expect(error.message).toBe('Original error'); // Original message is preserved
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('CUSTOM_CODE');
      });

      it('should convert primitive values to strings', () => {
        const numberError = BaseError.from(42);
        expect(numberError.message).toBe('42');
        
        const booleanError = BaseError.from(true);
        expect(booleanError.message).toBe('true');
      });

      it('should handle null and undefined', () => {
        const nullError = BaseError.from(null);
        expect(nullError.message).toBe('An unexpected error occurred');
        
        const undefinedError = BaseError.from(undefined);
        expect(undefinedError.message).toBe('An unexpected error occurred');
      });
    });

    describe('transient()', () => {
      it('should create a transient error with retry strategy', () => {
        const retryStrategy = {
          maxAttempts: 3,
          baseDelayMs: 1000,
          useExponentialBackoff: true
        };
        
        const error = BaseError.transient(
          'Transient error',
          'TRANSIENT_001',
          retryStrategy
        );
        
        expect(error).toBeInstanceOf(BaseError);
        expect(error.message).toBe('Transient error');
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe('TRANSIENT_001');
        expect(error.context.isTransient).toBe(true);
        expect(error.context.retryStrategy).toEqual(retryStrategy);
      });

      it('should include additional context if provided', () => {
        const retryStrategy = {
          maxAttempts: 3,
          baseDelayMs: 1000,
          useExponentialBackoff: true
        };
        
        const additionalContext: Partial<ErrorContext> = {
          journey: JourneyType.HEALTH,
          operation: 'health-sync'
        };
        
        const error = BaseError.transient(
          'Transient error',
          'TRANSIENT_001',
          retryStrategy,
          additionalContext
        );
        
        expect(error.context.isTransient).toBe(true);
        expect(error.context.retryStrategy).toEqual(retryStrategy);
        expect(error.context.journey).toBe(JourneyType.HEALTH);
        expect(error.context.operation).toBe('health-sync');
      });

      it('should include details and cause if provided', () => {
        const retryStrategy = {
          maxAttempts: 3,
          baseDelayMs: 1000,
          useExponentialBackoff: true
        };
        
        const details = { attempt: 1 };
        const cause = new Error('Original error');
        
        const error = BaseError.transient(
          'Transient error',
          'TRANSIENT_001',
          retryStrategy,
          undefined,
          details,
          cause
        );
        
        expect(error.details).toEqual(details);
        expect(error.cause).toBe(cause);
      });
    });

    describe('journeyError()', () => {
      it('should create a journey-specific error', () => {
        const error = BaseError.journeyError(
          'Health journey error',
          ErrorType.BUSINESS,
          'HEALTH_001',
          JourneyType.HEALTH
        );
        
        expect(error).toBeInstanceOf(BaseError);
        expect(error.message).toBe('Health journey error');
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('HEALTH_001');
        expect(error.context.journey).toBe(JourneyType.HEALTH);
      });

      it('should include additional context if provided', () => {
        const additionalContext: Partial<ErrorContext> = {
          userId: 'user-123',
          operation: 'update-health-metrics'
        };
        
        const error = BaseError.journeyError(
          'Health journey error',
          ErrorType.BUSINESS,
          'HEALTH_001',
          JourneyType.HEALTH,
          additionalContext
        );
        
        expect(error.context.journey).toBe(JourneyType.HEALTH);
        expect(error.context.userId).toBe('user-123');
        expect(error.context.operation).toBe('update-health-metrics');
      });

      it('should include details and cause if provided', () => {
        const details = { metricId: '123' };
        const cause = new Error('Original error');
        
        const error = BaseError.journeyError(
          'Health journey error',
          ErrorType.BUSINESS,
          'HEALTH_001',
          JourneyType.HEALTH,
          undefined,
          details,
          cause
        );
        
        expect(error.details).toEqual(details);
        expect(error.cause).toBe(cause);
      });
    });

    describe('validation()', () => {
      it('should create a validation error', () => {
        const error = BaseError.validation(
          'Invalid input',
          'VALIDATION_001'
        );
        
        expect(error).toBeInstanceOf(BaseError);
        expect(error.message).toBe('Invalid input');
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.code).toBe('VALIDATION_001');
      });

      it('should include details if provided', () => {
        const details = { field: 'email', reason: 'invalid format' };
        
        const error = BaseError.validation(
          'Invalid input',
          'VALIDATION_001',
          details
        );
        
        expect(error.details).toEqual(details);
      });

      it('should include context and cause if provided', () => {
        const context: Partial<ErrorContext> = { journey: JourneyType.AUTH };
        const cause = new Error('Original error');
        
        const error = BaseError.validation(
          'Invalid input',
          'VALIDATION_001',
          undefined,
          context,
          cause
        );
        
        expect(error.context.journey).toBe(JourneyType.AUTH);
        expect(error.cause).toBe(cause);
      });
    });

    describe('business()', () => {
      it('should create a business error', () => {
        const error = BaseError.business(
          'Business rule violation',
          'BUSINESS_001'
        );
        
        expect(error).toBeInstanceOf(BaseError);
        expect(error.message).toBe('Business rule violation');
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.code).toBe('BUSINESS_001');
      });

      it('should include details if provided', () => {
        const details = { rule: 'appointment-overlap', appointmentId: '123' };
        
        const error = BaseError.business(
          'Business rule violation',
          'BUSINESS_001',
          details
        );
        
        expect(error.details).toEqual(details);
      });

      it('should include context and cause if provided', () => {
        const context: Partial<ErrorContext> = { journey: JourneyType.CARE };
        const cause = new Error('Original error');
        
        const error = BaseError.business(
          'Business rule violation',
          'BUSINESS_001',
          undefined,
          context,
          cause
        );
        
        expect(error.context.journey).toBe(JourneyType.CARE);
        expect(error.cause).toBe(cause);
      });
    });

    describe('external()', () => {
      it('should create an external error', () => {
        const error = BaseError.external(
          'External API failure',
          'EXTERNAL_001'
        );
        
        expect(error).toBeInstanceOf(BaseError);
        expect(error.message).toBe('External API failure');
        expect(error.type).toBe(ErrorType.EXTERNAL);
        expect(error.code).toBe('EXTERNAL_001');
      });

      it('should include details if provided', () => {
        const details = { service: 'payment-gateway', statusCode: 500 };
        
        const error = BaseError.external(
          'External API failure',
          'EXTERNAL_001',
          details
        );
        
        expect(error.details).toEqual(details);
      });

      it('should include context and cause if provided', () => {
        const context: Partial<ErrorContext> = { journey: JourneyType.PLAN };
        const cause = new Error('Original error');
        
        const error = BaseError.external(
          'External API failure',
          'EXTERNAL_001',
          undefined,
          context,
          cause
        );
        
        expect(error.context.journey).toBe(JourneyType.PLAN);
        expect(error.cause).toBe(cause);
      });
    });

    describe('notFound()', () => {
      it('should create a not found error', () => {
        const error = BaseError.notFound(
          'Resource not found',
          'NOT_FOUND_001'
        );
        
        expect(error).toBeInstanceOf(BaseError);
        expect(error.message).toBe('Resource not found');
        expect(error.type).toBe(ErrorType.NOT_FOUND);
        expect(error.code).toBe('NOT_FOUND_001');
      });

      it('should include details if provided', () => {
        const details = { resourceType: 'User', resourceId: '123' };
        
        const error = BaseError.notFound(
          'Resource not found',
          'NOT_FOUND_001',
          details
        );
        
        expect(error.details).toEqual(details);
      });

      it('should include context and cause if provided', () => {
        const context: Partial<ErrorContext> = { journey: JourneyType.AUTH };
        const cause = new Error('Original error');
        
        const error = BaseError.notFound(
          'Resource not found',
          'NOT_FOUND_001',
          undefined,
          context,
          cause
        );
        
        expect(error.context.journey).toBe(JourneyType.AUTH);
        expect(error.cause).toBe(cause);
      });
    });
  });
});