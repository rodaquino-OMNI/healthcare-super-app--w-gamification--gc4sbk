import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';

// Import the BaseError class and related types
import { BaseError, ErrorType, ErrorContext } from '../../src/base';
import { HTTP_STATUS_MAPPINGS } from '../../src/constants';

/**
 * Test suite for the BaseError class
 * Verifies error classification, serialization, HTTP status code mapping, and context propagation
 */
describe('BaseError', () => {
  // Sample error data for testing
  const errorMessage = 'Test error message';
  const errorType = ErrorType.VALIDATION;
  const errorCode = 'TEST_001';
  const errorDetails = { field: 'email', issue: 'format' };
  const originalError = new Error('Original error');
  
  // Sample context data for testing
  const errorContext: ErrorContext = {
    requestId: 'req-123',
    userId: 'user-456',
    journeyContext: 'health',
    timestamp: new Date('2023-01-01T12:00:00Z')
  };

  describe('Basic Error Creation', () => {
    it('should create a BaseError with all required properties', () => {
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode,
        details: errorDetails,
        cause: originalError,
        context: errorContext
      });

      // Verify all properties are set correctly
      expect(error.message).toBe(errorMessage);
      expect(error.type).toBe(errorType);
      expect(error.code).toBe(errorCode);
      expect(error.details).toEqual(errorDetails);
      expect(error.cause).toBe(originalError);
      expect(error.context).toEqual(errorContext);
      expect(error.name).toBe('BaseError');
    });

    it('should create a BaseError with minimal required properties', () => {
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode
      });

      // Verify required properties are set correctly
      expect(error.message).toBe(errorMessage);
      expect(error.type).toBe(errorType);
      expect(error.code).toBe(errorCode);
      expect(error.details).toBeUndefined();
      expect(error.cause).toBeUndefined();
      
      // Context should be initialized with defaults
      expect(error.context).toBeDefined();
      expect(error.context.timestamp).toBeInstanceOf(Date);
    });

    it('should properly extend Error class', () => {
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode
      });

      expect(error instanceof Error).toBe(true);
      expect(error instanceof BaseError).toBe(true);
    });

    it('should capture stack trace', () => {
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode
      });

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack.includes('BaseError')).toBe(true);
    });
  });

  describe('Context Capture and Propagation', () => {
    it('should capture provided context', () => {
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode,
        context: errorContext
      });

      expect(error.context).toEqual(errorContext);
    });

    it('should generate default context when not provided', () => {
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode
      });

      expect(error.context).toBeDefined();
      expect(error.context.timestamp).toBeInstanceOf(Date);
      expect(error.context.requestId).toBeUndefined();
      expect(error.context.userId).toBeUndefined();
      expect(error.context.journeyContext).toBeUndefined();
    });

    it('should merge provided context with defaults', () => {
      const partialContext = {
        requestId: 'req-123',
        userId: 'user-456'
      };

      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode,
        context: partialContext
      });

      expect(error.context.requestId).toBe(partialContext.requestId);
      expect(error.context.userId).toBe(partialContext.userId);
      expect(error.context.timestamp).toBeInstanceOf(Date);
      expect(error.context.journeyContext).toBeUndefined();
    });

    it('should propagate context from cause error if available', () => {
      // Create a cause error with context
      const causeError = new BaseError({
        message: 'Cause error',
        type: ErrorType.TECHNICAL,
        code: 'CAUSE_001',
        context: {
          requestId: 'req-original',
          journeyContext: 'care'
        }
      });

      // Create a new error with the cause but without explicit context
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode,
        cause: causeError
      });

      // Context should be propagated from cause
      expect(error.context.requestId).toBe('req-original');
      expect(error.context.journeyContext).toBe('care');
      expect(error.context.timestamp).toBeInstanceOf(Date);
    });

    it('should override propagated context with explicitly provided context', () => {
      // Create a cause error with context
      const causeError = new BaseError({
        message: 'Cause error',
        type: ErrorType.TECHNICAL,
        code: 'CAUSE_001',
        context: {
          requestId: 'req-original',
          journeyContext: 'care',
          userId: 'user-original'
        }
      });

      // Create a new error with both cause and explicit context
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode,
        cause: causeError,
        context: {
          requestId: 'req-override',
          userId: 'user-override'
        }
      });

      // Explicitly provided context should override propagated context
      expect(error.context.requestId).toBe('req-override');
      expect(error.context.userId).toBe('user-override');
      // Non-overridden fields should be propagated
      expect(error.context.journeyContext).toBe('care');
    });
  });

  describe('Serialization', () => {
    it('should properly serialize to JSON with all properties', () => {
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode,
        details: errorDetails,
        context: errorContext
      });

      const json = error.toJSON();

      // Verify JSON structure
      expect(json).toEqual({
        error: {
          type: errorType,
          code: errorCode,
          message: errorMessage,
          details: errorDetails,
          context: {
            requestId: errorContext.requestId,
            userId: errorContext.userId,
            journeyContext: errorContext.journeyContext,
            timestamp: errorContext.timestamp.toISOString()
          }
        }
      });
    });

    it('should properly serialize to JSON with minimal properties', () => {
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode
      });

      const json = error.toJSON();

      // Verify JSON structure with minimal properties
      expect(json.error.type).toBe(errorType);
      expect(json.error.code).toBe(errorCode);
      expect(json.error.message).toBe(errorMessage);
      expect(json.error.details).toBeUndefined();
      expect(json.error.context).toBeDefined();
      expect(json.error.context.timestamp).toBeDefined();
      expect(typeof json.error.context.timestamp).toBe('string');
    });

    it('should include cause error in serialization when includeStack option is true', () => {
      const causeError = new Error('Cause error');
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode,
        cause: causeError
      });

      const json = error.toJSON({ includeStack: true });

      // Verify cause and stack are included
      expect(json.error.stack).toBeDefined();
      expect(json.error.cause).toBeDefined();
      expect(json.error.cause.message).toBe('Cause error');
      expect(json.error.cause.stack).toBeDefined();
    });

    it('should not include cause error in serialization by default', () => {
      const causeError = new Error('Cause error');
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode,
        cause: causeError
      });

      const json = error.toJSON();

      // Verify cause and stack are not included
      expect(json.error.stack).toBeUndefined();
      expect(json.error.cause).toBeUndefined();
    });
  });

  describe('HTTP Status Code Mapping', () => {
    it('should convert to HttpException with correct status code for VALIDATION errors', () => {
      const error = new BaseError({
        message: 'Validation error',
        type: ErrorType.VALIDATION,
        code: 'TEST_VALIDATION_001'
      });

      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.VALIDATION);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });

    it('should convert to HttpException with correct status code for BUSINESS errors', () => {
      const error = new BaseError({
        message: 'Business error',
        type: ErrorType.BUSINESS,
        code: 'TEST_BUSINESS_001'
      });

      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });

    it('should convert to HttpException with correct status code for TECHNICAL errors', () => {
      const error = new BaseError({
        message: 'Technical error',
        type: ErrorType.TECHNICAL,
        code: 'TEST_TECHNICAL_001'
      });

      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.TECHNICAL);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });

    it('should convert to HttpException with correct status code for EXTERNAL errors', () => {
      const error = new BaseError({
        message: 'External error',
        type: ErrorType.EXTERNAL,
        code: 'TEST_EXTERNAL_001'
      });

      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.EXTERNAL);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });

    it('should allow overriding the HTTP status code', () => {
      const error = new BaseError({
        message: 'Custom status error',
        type: ErrorType.VALIDATION,
        code: 'TEST_CUSTOM_001'
      });

      const customStatus = HttpStatus.NOT_ACCEPTABLE; // 406
      const httpException = error.toHttpException(customStatus);
      
      expect(httpException.getStatus()).toBe(customStatus);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });
  });

  describe('Error Cause Chain', () => {
    it('should properly handle nested cause errors', () => {
      // Create a chain of errors
      const level3Error = new Error('Level 3 error');
      
      const level2Error = new BaseError({
        message: 'Level 2 error',
        type: ErrorType.TECHNICAL,
        code: 'LEVEL2_001',
        cause: level3Error
      });
      
      const level1Error = new BaseError({
        message: 'Level 1 error',
        type: ErrorType.BUSINESS,
        code: 'LEVEL1_001',
        cause: level2Error
      });

      // Verify the error chain
      expect(level1Error.cause).toBe(level2Error);
      expect(level2Error.cause).toBe(level3Error);
    });

    it('should extract root cause from error chain', () => {
      // Create a chain of errors
      const rootCause = new Error('Root cause error');
      
      const middleError = new BaseError({
        message: 'Middle error',
        type: ErrorType.TECHNICAL,
        code: 'MIDDLE_001',
        cause: rootCause
      });
      
      const topError = new BaseError({
        message: 'Top error',
        type: ErrorType.BUSINESS,
        code: 'TOP_001',
        cause: middleError
      });

      // Extract root cause
      const extractedRootCause = topError.getRootCause();
      
      expect(extractedRootCause).toBe(rootCause);
    });

    it('should return self as root cause when no cause is present', () => {
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode
      });

      const rootCause = error.getRootCause();
      
      expect(rootCause).toBe(error);
    });

    it('should format error chain as string', () => {
      // Create a chain of errors
      const level3Error = new Error('Level 3 error');
      
      const level2Error = new BaseError({
        message: 'Level 2 error',
        type: ErrorType.TECHNICAL,
        code: 'LEVEL2_001',
        cause: level3Error
      });
      
      const level1Error = new BaseError({
        message: 'Level 1 error',
        type: ErrorType.BUSINESS,
        code: 'LEVEL1_001',
        cause: level2Error
      });

      const chainString = level1Error.formatErrorChain();
      
      // Verify the chain string contains all error messages
      expect(chainString).toContain('Level 1 error');
      expect(chainString).toContain('Level 2 error');
      expect(chainString).toContain('Level 3 error');
      expect(chainString).toContain('LEVEL1_001');
      expect(chainString).toContain('LEVEL2_001');
    });
  });

  describe('Observability Integration', () => {
    // Mock logger and tracer for testing
    let mockLogger;
    let mockTracer;

    beforeEach(() => {
      // Setup mock logger
      mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
      };

      // Setup mock tracer
      mockTracer = {
        setSpanError: jest.fn(),
        addEvent: jest.fn()
      };

      // Set the mocks on the BaseError class
      BaseError.setLogger(mockLogger);
      BaseError.setTracer(mockTracer);
    });

    it('should log error with appropriate level based on error type', () => {
      // Create different types of errors
      const validationError = new BaseError({
        message: 'Validation error',
        type: ErrorType.VALIDATION,
        code: 'TEST_VALIDATION_001'
      });

      const businessError = new BaseError({
        message: 'Business error',
        type: ErrorType.BUSINESS,
        code: 'TEST_BUSINESS_001'
      });

      const technicalError = new BaseError({
        message: 'Technical error',
        type: ErrorType.TECHNICAL,
        code: 'TEST_TECHNICAL_001'
      });

      const externalError = new BaseError({
        message: 'External error',
        type: ErrorType.EXTERNAL,
        code: 'TEST_EXTERNAL_001'
      });

      // Log each error
      validationError.log();
      businessError.log();
      technicalError.log();
      externalError.log();

      // Verify appropriate log levels were used
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: 'TEST_VALIDATION_001' }) })
      );
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: 'TEST_BUSINESS_001' }) })
      );
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: 'TEST_TECHNICAL_001' }) })
      );
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: 'TEST_EXTERNAL_001' }) })
      );
    });

    it('should record error in active span when tracing is enabled', () => {
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode,
        details: errorDetails,
        context: errorContext
      });

      // Record error in tracer
      error.recordInSpan();

      // Verify tracer was called with error details
      expect(mockTracer.setSpanError).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'BaseError',
          message: errorMessage,
          code: errorCode,
          type: errorType
        }),
        expect.objectContaining({
          'error.type': errorType,
          'error.code': errorCode,
          'error.details': JSON.stringify(errorDetails),
          'error.context.requestId': errorContext.requestId,
          'error.context.userId': errorContext.userId,
          'error.context.journeyContext': errorContext.journeyContext
        })
      );
    });

    it('should both log and record in span with a single method call', () => {
      const error = new BaseError({
        message: errorMessage,
        type: errorType,
        code: errorCode
      });

      // Log and record in one call
      error.logAndRecord();

      // Verify both logger and tracer were called
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockTracer.setSpanError).toHaveBeenCalled();
    });
  });
});