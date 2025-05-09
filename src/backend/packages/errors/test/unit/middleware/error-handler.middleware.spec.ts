import { Request, Response, NextFunction } from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType, JourneyContext } from '../../../src/base';
import { Logger } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { createErrorHandlerMiddleware, registerErrorHandler } from '../../../src/middleware/error-handler.middleware';
import { isRetryableError } from '../../../src/utils/retry';

// Mock dependencies
jest.mock('@austa/logging');
jest.mock('@austa/tracing');
jest.mock('../../../src/utils/retry');
jest.mock('../../../src/utils/context', () => ({
  getJourneyContext: jest.fn().mockImplementation((req) => ({
    journey: req.headers['x-journey-id'] as string,
    section: req.headers['x-journey-section'] as string
  }))
}));

describe('Error Handler Middleware', () => {
  // Mock objects
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let mockLogger: jest.Mocked<Logger>;
  let mockTracingService: jest.Mocked<TracingService>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let setHeaderMock: jest.Mock;
  
  // Save original environment
  const originalNodeEnv = process.env.NODE_ENV;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup response mocks with chaining
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    setHeaderMock = jest.fn();
    
    // Create mock request and response
    mockRequest = {
      method: 'GET',
      url: '/test',
      originalUrl: '/test',
      headers: {
        'x-request-id': 'test-request-id',
        'user-agent': 'test-user-agent'
      },
      user: { id: 'test-user-id' }
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
      setHeader: setHeaderMock,
      headersSent: false
    };
    
    mockNext = jest.fn();
    
    // Setup logger mock
    mockLogger = new Logger('TestLogger') as jest.Mocked<Logger>;
    mockLogger.error = jest.fn();
    mockLogger.warn = jest.fn();
    mockLogger.debug = jest.fn();
    mockLogger.log = jest.fn();
    mockLogger.fatal = jest.fn();
    
    // Setup tracing service mock
    mockTracingService = {
      getTraceContext: jest.fn().mockReturnValue({
        traceId: 'test-trace-id',
        spanId: 'test-span-id'
      }),
      recordError: jest.fn()
    } as unknown as jest.Mocked<TracingService>;
    
    // Mock isRetryableError
    (isRetryableError as jest.Mock).mockImplementation((error) => {
      return error.retryable === true;
    });
  });
  
  afterEach(() => {
    // Restore environment
    process.env.NODE_ENV = originalNodeEnv;
  });
  
  describe('BaseError handling', () => {
    it('should handle BaseError with correct status code and format', () => {
      // Create a BaseError
      const error = new BaseError(
        'Test business error',
        ErrorType.BUSINESS,
        'TEST_001',
        { requestId: 'test-request-id' }
      );
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({ logger: mockLogger });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify status code
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      
      // Verify response format
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          type: ErrorType.BUSINESS,
          code: 'TEST_001',
          message: 'Test business error',
          journey: undefined,
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
      
      // Verify logger was called
      expect(mockLogger.warn).toHaveBeenCalled();
    });
    
    it('should handle validation errors with BAD_REQUEST status', () => {
      // Create a validation error
      const error = new BaseError(
        'Invalid input',
        ErrorType.VALIDATION,
        'VALIDATION_001',
        { requestId: 'test-request-id' }
      );
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({ logger: mockLogger });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify status code
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      
      // Verify logger was called with debug level for validation errors
      expect(mockLogger.debug).toHaveBeenCalled();
    });
    
    it('should handle technical errors with INTERNAL_SERVER_ERROR status', () => {
      // Create a technical error
      const error = new BaseError(
        'System error',
        ErrorType.TECHNICAL,
        'TECH_001',
        { requestId: 'test-request-id' }
      );
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({ logger: mockLogger });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify status code
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      
      // Verify logger was called with error level
      expect(mockLogger.error).toHaveBeenCalled();
    });
    
    it('should handle external errors with BAD_GATEWAY status', () => {
      // Create an external error
      const error = new BaseError(
        'External API error',
        ErrorType.EXTERNAL,
        'EXT_001',
        { requestId: 'test-request-id' }
      );
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({ logger: mockLogger });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify status code
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
      
      // Verify logger was called with error level
      expect(mockLogger.error).toHaveBeenCalled();
    });
    
    it('should include journey context in error response when available', () => {
      // Add journey headers
      mockRequest.headers['x-journey-id'] = 'health';
      mockRequest.headers['x-journey-section'] = 'metrics';
      
      // Create a business error
      const error = new BaseError(
        'Business rule violation',
        ErrorType.BUSINESS,
        'BIZ_001',
        { requestId: 'test-request-id' }
      );
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({ logger: mockLogger });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response includes journey context
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          context: expect.objectContaining({
            journey: 'health',
            section: 'metrics',
            requestId: 'test-request-id'
          })
        })
      }));
    });
  });
  
  describe('HttpException handling', () => {
    it('should handle NestJS HttpException with correct status code', () => {
      // Create an HttpException
      const error = new HttpException('Not Found', HttpStatus.NOT_FOUND);
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({ logger: mockLogger });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify status code
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      
      // Verify response format
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          type: 'validation', // Mapped from 404 status
          message: 'Not Found'
        }
      });
      
      // Verify logger was called
      expect(mockLogger.warn).toHaveBeenCalled();
    });
    
    it('should handle HttpException with object response', () => {
      // Create an HttpException with object response
      const error = new HttpException(
        { message: 'Validation failed', errors: ['Field is required'] },
        HttpStatus.BAD_REQUEST
      );
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({ logger: mockLogger });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response format includes the object
      expect(jsonMock).toHaveBeenCalledWith({
        error: expect.objectContaining({
          type: 'validation',
          message: 'Validation failed',
          errors: ['Field is required']
        })
      });
    });
    
    it('should map 500 status to technical error type', () => {
      // Create a 500 HttpException
      const error = new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({ logger: mockLogger });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify error type mapping
      expect(jsonMock).toHaveBeenCalledWith({
        error: expect.objectContaining({
          type: 'technical',
          message: 'Server Error'
        })
      });
      
      // Verify logger was called with error level
      expect(mockLogger.error).toHaveBeenCalled();
    });
    
    it('should map 502 status to external error type', () => {
      // Create a 502 HttpException
      const error = new HttpException('Bad Gateway', HttpStatus.BAD_GATEWAY);
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({ logger: mockLogger });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify error type mapping
      expect(jsonMock).toHaveBeenCalledWith({
        error: expect.objectContaining({
          type: 'external',
          message: 'Bad Gateway'
        })
      });
    });
  });
  
  describe('Generic Error handling', () => {
    it('should handle generic Error with INTERNAL_SERVER_ERROR status', () => {
      // Create a generic Error
      const error = new Error('Something went wrong');
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({ logger: mockLogger });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify status code
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      
      // Verify response format
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          type: 'technical',
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      });
      
      // Verify logger was called
      expect(mockLogger.error).toHaveBeenCalled();
    });
    
    it('should include error details in non-production environment', () => {
      // Set environment to development
      process.env.NODE_ENV = 'development';
      
      // Create a generic Error
      const error = new Error('Something went wrong');
      
      // Create middleware with includeDetails explicitly set to true
      const middleware = createErrorHandlerMiddleware({
        logger: mockLogger,
        includeDetails: true
      });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response includes error details
      expect(jsonMock).toHaveBeenCalledWith({
        error: expect.objectContaining({
          details: expect.objectContaining({
            name: 'Error',
            message: 'Something went wrong',
            stackPreview: expect.any(String)
          })
        })
      });
    });
    
    it('should not include error details in production environment', () => {
      // Set environment to production
      process.env.NODE_ENV = 'production';
      
      // Create a generic Error
      const error = new Error('Something went wrong');
      
      // Create middleware with default options
      const middleware = createErrorHandlerMiddleware({ logger: mockLogger });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response does not include error details
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          type: 'technical',
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    });
    
    it('should detect and log critical errors', () => {
      // Create a critical error (memory-related)
      const error = new Error('JavaScript heap out of memory');
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({ logger: mockLogger });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify fatal logger was called for critical errors
      expect(mockLogger.fatal).toHaveBeenCalled();
    });
  });
  
  describe('Retryable error handling', () => {
    it('should add retry headers for retryable errors', () => {
      // Create a retryable error
      const error = new Error('Connection timeout');
      error.retryable = true;
      error.retryAfter = 5;
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({
        logger: mockLogger,
        enableRetries: true
      });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify Retry-After header was set
      expect(setHeaderMock).toHaveBeenCalledWith('Retry-After', '5');
    });
    
    it('should add rate limit headers for rate limit errors', () => {
      // Create a rate limit error
      const error = new Error('Rate limit exceeded');
      error.retryable = true;
      error.code = 'RATE_LIMIT_EXCEEDED';
      error.details = { limit: 100 };
      error.retryAfter = 60;
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({
        logger: mockLogger,
        enableRetries: true
      });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify rate limit headers were set
      expect(setHeaderMock).toHaveBeenCalledWith('Retry-After', '60');
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });
    
    it('should not add retry headers when retries are disabled', () => {
      // Create a retryable error
      const error = new Error('Connection timeout');
      error.retryable = true;
      
      // Create middleware with retries disabled
      const middleware = createErrorHandlerMiddleware({
        logger: mockLogger,
        enableRetries: false
      });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify no retry headers were set
      expect(setHeaderMock).not.toHaveBeenCalled();
    });
  });
  
  describe('Journey-specific error handling', () => {
    it('should use journey-specific handler when available', () => {
      // Add health journey header
      mockRequest.headers['x-journey-id'] = 'health';
      
      // Create a health-specific error
      const error = new Error('Health metric validation failed');
      
      // Create a mock journey handler
      const healthHandler = jest.fn().mockImplementation((err, req, res) => {
        res.status(400).json({
          error: {
            type: 'validation',
            code: 'HEALTH_METRIC_INVALID',
            message: 'The health metric value is outside the acceptable range',
            context: { journey: 'health' }
          }
        });
        return true; // Indicate that we've handled this error
      });
      
      // Create middleware with journey handlers
      const middleware = createErrorHandlerMiddleware({
        logger: mockLogger,
        journeyHandlers: {
          health: healthHandler
        }
      });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify journey handler was called
      expect(healthHandler).toHaveBeenCalled();
      
      // Verify standard error handling was not used (no error logging)
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
    
    it('should fall back to standard handling if journey handler returns false', () => {
      // Add care journey header
      mockRequest.headers['x-journey-id'] = 'care';
      
      // Create an error
      const error = new Error('Appointment booking failed');
      
      // Create a mock journey handler that doesn't handle the error
      const careHandler = jest.fn().mockReturnValue(false);
      
      // Create middleware with journey handlers
      const middleware = createErrorHandlerMiddleware({
        logger: mockLogger,
        journeyHandlers: {
          care: careHandler
        }
      });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify journey handler was called
      expect(careHandler).toHaveBeenCalled();
      
      // Verify standard error handling was used
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
  
  describe('Tracing integration', () => {
    it('should record error in tracing service when available', () => {
      // Create an error
      const error = new Error('Something went wrong');
      
      // Create middleware with tracing service
      const middleware = createErrorHandlerMiddleware({
        logger: mockLogger,
        tracingService: mockTracingService
      });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify error was recorded in tracing service
      expect(mockTracingService.recordError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          errorType: 'technical',
          errorCode: 'INTERNAL_ERROR',
          traceId: 'test-trace-id',
          spanId: 'test-span-id'
        })
      );
    });
    
    it('should add trace context to request info when available', () => {
      // Create an error
      const error = new BaseError(
        'Test error',
        ErrorType.BUSINESS,
        'TEST_001',
        { requestId: 'test-request-id' }
      );
      
      // Create middleware with tracing service
      const middleware = createErrorHandlerMiddleware({
        logger: mockLogger,
        tracingService: mockTracingService
      });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify logger was called with trace context
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          error: expect.any(Object),
          request: expect.objectContaining({
            traceId: 'test-trace-id',
            spanId: 'test-span-id'
          })
        }),
        expect.any(String)
      );
    });
  });
  
  describe('Edge cases', () => {
    it('should use next() if headers already sent', () => {
      // Set headersSent to true
      mockResponse.headersSent = true;
      
      // Create an error
      const error = new Error('Too late');
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({ logger: mockLogger });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify next was called with the error
      expect(mockNext).toHaveBeenCalledWith(error);
      
      // Verify response methods were not called
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });
    
    it('should handle errors without stack traces', () => {
      // Create an error without a stack trace
      const error = new Error('No stack');
      delete error.stack;
      
      // Create middleware
      const middleware = createErrorHandlerMiddleware({ logger: mockLogger });
      
      // Execute middleware
      middleware(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify it doesn't crash
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
  
  describe('registerErrorHandler function', () => {
    it('should register the middleware with an Express app', () => {
      // Create a mock Express app
      const mockApp = {
        use: jest.fn()
      };
      
      // Register the error handler
      registerErrorHandler(mockApp, { logger: mockLogger });
      
      // Verify app.use was called with a function
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
      
      // Verify logger was called
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Error handler middleware registered',
        'ErrorHandlerMiddleware'
      );
    });
    
    it('should throw an error if invalid app is provided', () => {
      // Attempt to register with invalid app
      expect(() => {
        registerErrorHandler(null);
      }).toThrow('Invalid Express application instance');
    });
  });
});