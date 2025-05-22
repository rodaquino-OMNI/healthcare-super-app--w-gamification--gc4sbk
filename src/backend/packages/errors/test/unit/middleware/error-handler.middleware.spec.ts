import { Test } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { ErrorHandlerMiddleware } from '../../../src/middleware/error-handler.middleware';
import { BaseError, ErrorType } from '../../../src/base';

// Mock LoggerService
class MockLoggerService {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
}

// Mock TracingService
class MockTracingService {
  getCurrentTraceId = jest.fn().mockReturnValue('mock-trace-id');
  recordError = jest.fn();
}

describe('ErrorHandlerMiddleware', () => {
  let middleware: ErrorHandlerMiddleware;
  let loggerService: MockLoggerService;
  let tracingService: MockTracingService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;
  let setHeaderSpy: jest.Mock;

  beforeEach(async () => {
    // Create mocks
    loggerService = new MockLoggerService();
    tracingService = new MockTracingService();
    
    // Create middleware instance
    middleware = new ErrorHandlerMiddleware(
      loggerService as unknown as LoggerService,
      tracingService as unknown as TracingService
    );

    // Set up request mock
    mockRequest = {
      method: 'GET',
      url: '/test',
      headers: {
        'x-journey-id': 'health',
        'x-request-id': 'test-request-id'
      },
      user: { id: 'test-user-id' }
    };

    // Set up response mock with spies
    jsonSpy = jest.fn().mockReturnValue({});
    statusSpy = jest.fn().mockReturnThis();
    setHeaderSpy = jest.fn();
    
    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
      setHeader: setHeaderSpy
    };

    // Set up next function mock
    mockNext = jest.fn();

    // Reset environment variables
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should log initialization message', () => {
    expect(loggerService.log).toHaveBeenCalledWith(
      'ErrorHandlerMiddleware initialized',
      'ErrorHandlerMiddleware'
    );
  });

  describe('handle method', () => {
    it('should handle BaseError correctly', () => {
      // Create a BaseError
      const error = new BaseError(
        'Test business error',
        ErrorType.BUSINESS,
        'TEST_001',
        { component: 'test-component' },
        { field: 'testField' }
      );

      // Call the middleware
      middleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify response
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(jsonSpy).toHaveBeenCalledWith(error.toJSON());
      expect(setHeaderSpy).toHaveBeenCalledWith('x-trace-id', 'mock-trace-id');

      // Verify logging
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Business error'),
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          userId: 'test-user-id',
          journeyId: 'health',
          errorCode: 'TEST_001',
          errorType: ErrorType.BUSINESS
        }),
        'ErrorHandlerMiddleware'
      );

      // Verify tracing
      expect(tracingService.recordError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          component: 'express',
          method: 'GET',
          url: '/test'
        })
      );
    });

    it('should handle HttpException correctly', () => {
      // Create an HttpException
      const error = new HttpException('Test HTTP exception', HttpStatus.BAD_REQUEST);

      // Call the middleware
      middleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify response
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: {
          type: ErrorType.VALIDATION,
          message: 'Test HTTP exception'
        }
      });

      // Verify logging
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('HTTP 400 exception'),
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          errorType: ErrorType.VALIDATION
        }),
        'ErrorHandlerMiddleware'
      );
    });

    it('should handle HttpException with object response correctly', () => {
      // Create an HttpException with object response
      const errorResponse = {
        message: 'Validation failed',
        errors: ['Field is required']
      };
      const error = new HttpException(errorResponse, HttpStatus.BAD_REQUEST);

      // Call the middleware
      middleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify response
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: {
          ...errorResponse,
          type: ErrorType.VALIDATION
        }
      });
    });

    it('should handle generic Error correctly in production environment', () => {
      // Set production environment
      process.env.NODE_ENV = 'production';

      // Create a generic Error
      const error = new Error('Test generic error');

      // Call the middleware
      middleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify response
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
          // No details in production
        }
      });

      // Verify logging
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled exception'),
        expect.any(String), // stack trace
        expect.objectContaining({
          errorName: 'Error',
          errorType: ErrorType.TECHNICAL
        }),
        'ErrorHandlerMiddleware'
      );
    });

    it('should include error details for generic Error in non-production environment', () => {
      // Set non-production environment
      process.env.NODE_ENV = 'development';

      // Create a generic Error
      const error = new Error('Test generic error');

      // Call the middleware
      middleware.handle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify response includes details
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: {
            name: 'Error',
            message: 'Test generic error'
          }
        }
      });
    });

    it('should map different error types to correct HTTP status codes', () => {
      // Test different error types and their status code mappings
      const errorTypesToStatusCodes = [
        { type: ErrorType.VALIDATION, code: HttpStatus.BAD_REQUEST },
        { type: ErrorType.BUSINESS, code: HttpStatus.UNPROCESSABLE_ENTITY },
        { type: ErrorType.EXTERNAL, code: HttpStatus.BAD_GATEWAY },
        { type: ErrorType.TECHNICAL, code: HttpStatus.INTERNAL_SERVER_ERROR },
        { type: ErrorType.AUTHENTICATION, code: HttpStatus.UNAUTHORIZED },
        { type: ErrorType.AUTHORIZATION, code: HttpStatus.FORBIDDEN },
        { type: ErrorType.NOT_FOUND, code: HttpStatus.NOT_FOUND },
        { type: ErrorType.CONFLICT, code: HttpStatus.CONFLICT },
        { type: ErrorType.RATE_LIMIT, code: HttpStatus.TOO_MANY_REQUESTS },
        { type: ErrorType.TIMEOUT, code: HttpStatus.GATEWAY_TIMEOUT }
      ];

      for (const { type, code } of errorTypesToStatusCodes) {
        // Reset mocks
        jest.clearAllMocks();

        // Create error with specific type
        const error = new BaseError(
          `Test ${type} error`,
          type,
          'TEST_002',
          { component: 'test-component' }
        );

        // Call the middleware
        middleware.handle(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        // Verify correct status code
        expect(statusSpy).toHaveBeenCalledWith(code);
      }
    });

    it('should map HTTP status codes to correct error types for HttpExceptions', () => {
      // Test different HTTP status codes and their error type mappings
      const statusCodesToErrorTypes = [
        { code: HttpStatus.BAD_REQUEST, type: ErrorType.VALIDATION },
        { code: HttpStatus.UNPROCESSABLE_ENTITY, type: ErrorType.BUSINESS },
        { code: HttpStatus.BAD_GATEWAY, type: ErrorType.EXTERNAL },
        { code: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorType.TECHNICAL },
        { code: HttpStatus.SERVICE_UNAVAILABLE, type: ErrorType.EXTERNAL },
        { code: HttpStatus.GATEWAY_TIMEOUT, type: ErrorType.EXTERNAL }
      ];

      for (const { code, type } of statusCodesToErrorTypes) {
        // Reset mocks
        jest.clearAllMocks();

        // Create HttpException with specific status code
        const error = new HttpException('Test HTTP exception', code);

        // Call the middleware
        middleware.handle(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        // Verify correct error type in response
        expect(jsonSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              type
            })
          })
        );
      }
    });

    it('should log different error types with appropriate severity', () => {
      // Test different error types and their logging methods
      const errorTypesToLogMethods = [
        { type: ErrorType.VALIDATION, logMethod: 'debug' },
        { type: ErrorType.BUSINESS, logMethod: 'warn' },
        { type: ErrorType.EXTERNAL, logMethod: 'error' },
        { type: ErrorType.TECHNICAL, logMethod: 'error' }
      ];

      for (const { type, logMethod } of errorTypesToLogMethods) {
        // Reset mocks
        jest.clearAllMocks();

        // Create error with specific type
        const error = new BaseError(
          `Test ${type} error`,
          type,
          'TEST_003',
          { component: 'test-component' }
        );

        // Call the middleware
        middleware.handle(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        // Verify correct logging method was used
        expect(loggerService[logMethod]).toHaveBeenCalled();
      }
    });

    it('should use the static create method to instantiate middleware', () => {
      // Use the static create method
      const middlewareFunction = ErrorHandlerMiddleware.create(
        loggerService as unknown as LoggerService,
        tracingService as unknown as TracingService
      );

      // Create a BaseError
      const error = new BaseError(
        'Test error',
        ErrorType.BUSINESS,
        'TEST_004'
      );

      // Call the middleware function
      middlewareFunction(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify response
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(jsonSpy).toHaveBeenCalledWith(error.toJSON());
    });
  });
});