import { Test } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from '../../../src/nest/filters';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { BaseError, ErrorType, JourneyContext } from '../../../src/base';
import { ErrorRecoveryStrategy } from '../../../src/types';
import { ERROR_MESSAGES } from '../../../src/constants';

// Mock implementations
class MockLoggerService {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
  verbose = jest.fn();
}

class MockTracingService {
  startSpan = jest.fn().mockReturnValue({
    setAttributes: jest.fn(),
    recordException: jest.fn(),
    end: jest.fn(),
    setStatus: jest.fn()
  });
}

class MockBaseError extends BaseError {
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    context: any = {},
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    super(message, type, code, context, details, suggestion, cause);
  }
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let loggerService: MockLoggerService;
  let tracingService: MockTracingService;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(async () => {
    // Reset environment variables
    process.env.NODE_ENV = 'development';

    // Create mocks
    loggerService = new MockLoggerService();
    tracingService = new MockTracingService();

    // Create mock response with status and json methods
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Create mock request with common properties
    mockRequest = {
      method: 'GET',
      url: '/api/test',
      path: '/api/test',
      headers: {
        'x-request-id': 'test-request-id',
        'x-journey-id': 'health',
        'host': 'localhost:3000',
        'user-agent': 'test-user-agent'
      },
      user: { id: 'test-user-id' },
      ip: '127.0.0.1'
    };

    // Create mock arguments host
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest)
      }),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn()
    };

    // Create filter instance
    filter = new GlobalExceptionFilter(
      loggerService as unknown as LoggerService,
      tracingService as unknown as TracingService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      expect(loggerService.log).toHaveBeenCalledWith(
        'GlobalExceptionFilter initialized',
        'GlobalExceptionFilter'
      );
    });

    it('should force secure options in production environment', () => {
      // Set production environment
      process.env.NODE_ENV = 'production';

      // Create new filter instance
      const productionFilter = new GlobalExceptionFilter(
        loggerService as unknown as LoggerService,
        tracingService as unknown as TracingService
      );

      // Call catch to test production behavior
      const error = new Error('Test error');
      productionFilter.catch(error, mockArgumentsHost);

      // Verify response doesn't include stack traces
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.not.objectContaining({
            stack: expect.anything()
          })
        })
      );
    });
  });

  describe('error handling', () => {
    describe('BaseError handling', () => {
      it('should handle validation errors correctly', () => {
        // Create a validation error
        const validationError = new MockBaseError(
          'Invalid input',
          ErrorType.VALIDATION,
          'VALIDATION_001',
          { journey: JourneyContext.HEALTH },
          { field: 'email', constraint: 'isEmail' }
        );

        // Call the filter
        filter.catch(validationError, mockArgumentsHost);

        // Verify response
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: expect.objectContaining({
            type: ErrorType.VALIDATION,
            code: 'VALIDATION_001',
            message: 'Invalid input',
            journey: JourneyContext.HEALTH,
            details: { field: 'email', constraint: 'isEmail' }
          })
        });

        // Verify logging
        expect(loggerService.debug).toHaveBeenCalled();
      });

      it('should handle business errors correctly', () => {
        // Create a business error
        const businessError = new MockBaseError(
          'Business rule violation',
          ErrorType.BUSINESS,
          'BUSINESS_001',
          { journey: JourneyContext.CARE },
          { rule: 'appointment must be in the future' }
        );

        // Call the filter
        filter.catch(businessError, mockArgumentsHost);

        // Verify response
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: expect.objectContaining({
            type: ErrorType.BUSINESS,
            code: 'BUSINESS_001',
            message: 'Business rule violation',
            journey: JourneyContext.CARE
          })
        });

        // Verify logging
        expect(loggerService.warn).toHaveBeenCalled();
      });

      it('should handle technical errors correctly', () => {
        // Create a technical error
        const technicalError = new MockBaseError(
          'Database connection failed',
          ErrorType.TECHNICAL,
          'TECHNICAL_001',
          { journey: JourneyContext.PLAN },
          { database: 'postgres' }
        );

        // Call the filter
        filter.catch(technicalError, mockArgumentsHost);

        // Verify response
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: expect.objectContaining({
            type: ErrorType.TECHNICAL,
            code: 'TECHNICAL_001',
            message: 'Database connection failed',
            journey: JourneyContext.PLAN
          })
        });

        // Verify logging
        expect(loggerService.error).toHaveBeenCalled();
      });

      it('should handle external errors correctly', () => {
        // Create an external error
        const externalError = new MockBaseError(
          'External API failed',
          ErrorType.EXTERNAL,
          'EXTERNAL_001',
          { journey: JourneyContext.HEALTH },
          { service: 'fhir-api' }
        );

        // Call the filter
        filter.catch(externalError, mockArgumentsHost);

        // Verify response
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: expect.objectContaining({
            type: ErrorType.EXTERNAL,
            code: 'EXTERNAL_001',
            message: 'External API failed',
            journey: JourneyContext.HEALTH
          })
        });

        // Verify logging
        expect(loggerService.error).toHaveBeenCalled();
      });
    });

    describe('HttpException handling', () => {
      it('should handle NestJS HttpException correctly', () => {
        // Create an HttpException
        const httpException = new HttpException(
          'Bad request',
          HttpStatus.BAD_REQUEST
        );

        // Call the filter
        filter.catch(httpException, mockArgumentsHost);

        // Verify response
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: expect.objectContaining({
            type: ErrorType.VALIDATION,
            code: `HTTP_${HttpStatus.BAD_REQUEST}`,
            message: 'Bad request'
          })
        });

        // Verify logging
        expect(loggerService.warn).toHaveBeenCalled();
      });

      it('should handle HttpException with object response correctly', () => {
        // Create an HttpException with object response
        const httpException = new HttpException(
          {
            message: 'Validation failed',
            errors: [
              { field: 'email', message: 'Invalid email format' }
            ]
          },
          HttpStatus.BAD_REQUEST
        );

        // Call the filter
        filter.catch(httpException, mockArgumentsHost);

        // Verify response
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: expect.objectContaining({
            type: ErrorType.VALIDATION,
            code: `HTTP_${HttpStatus.BAD_REQUEST}`,
            message: 'Validation failed',
            details: expect.objectContaining({
              message: 'Validation failed',
              errors: expect.arrayContaining([
                expect.objectContaining({
                  field: 'email',
                  message: 'Invalid email format'
                })
              ])
            })
          })
        });
      });

      it('should map HTTP status codes to appropriate error types', () => {
        // Test various status codes
        const statusCodesToTest = [
          { status: HttpStatus.UNAUTHORIZED, expectedType: ErrorType.AUTHENTICATION },
          { status: HttpStatus.FORBIDDEN, expectedType: ErrorType.AUTHORIZATION },
          { status: HttpStatus.NOT_FOUND, expectedType: ErrorType.NOT_FOUND },
          { status: HttpStatus.CONFLICT, expectedType: ErrorType.CONFLICT },
          { status: HttpStatus.UNPROCESSABLE_ENTITY, expectedType: ErrorType.BUSINESS },
          { status: HttpStatus.TOO_MANY_REQUESTS, expectedType: ErrorType.RATE_LIMIT },
          { status: HttpStatus.BAD_GATEWAY, expectedType: ErrorType.EXTERNAL },
          { status: HttpStatus.SERVICE_UNAVAILABLE, expectedType: ErrorType.UNAVAILABLE },
          { status: HttpStatus.GATEWAY_TIMEOUT, expectedType: ErrorType.TIMEOUT },
          { status: HttpStatus.BAD_REQUEST, expectedType: ErrorType.VALIDATION },
          { status: HttpStatus.INTERNAL_SERVER_ERROR, expectedType: ErrorType.TECHNICAL }
        ];

        for (const { status, expectedType } of statusCodesToTest) {
          // Reset mocks
          jest.clearAllMocks();

          // Create HttpException with the status
          const httpException = new HttpException(
            `Error with status ${status}`,
            status
          );

          // Call the filter
          filter.catch(httpException, mockArgumentsHost);

          // Verify response has correct error type
          expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
              error: expect.objectContaining({
                type: expectedType
              })
            })
          );
        }
      });
    });

    describe('Unknown error handling', () => {
      it('should handle standard Error objects correctly', () => {
        // Create a standard Error
        const error = new Error('Something went wrong');

        // Call the filter
        filter.catch(error, mockArgumentsHost);

        // Verify response
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: expect.objectContaining({
            type: ErrorType.TECHNICAL,
            code: 'INTERNAL_ERROR',
            message: ERROR_MESSAGES.TECHNICAL.INTERNAL_ERROR
          })
        });

        // Verify logging
        expect(loggerService.error).toHaveBeenCalled();
      });

      it('should handle non-Error objects correctly', () => {
        // Create a non-Error object
        const nonError = { message: 'Not an error' };

        // Call the filter
        filter.catch(nonError, mockArgumentsHost);

        // Verify response
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: expect.objectContaining({
            type: ErrorType.TECHNICAL,
            code: 'INTERNAL_ERROR',
            message: ERROR_MESSAGES.TECHNICAL.INTERNAL_ERROR
          })
        });
      });

      it('should include error details in non-production environments', () => {
        // Ensure we're in development mode
        process.env.NODE_ENV = 'development';

        // Create an Error with a specific message
        const error = new Error('Specific error message');

        // Call the filter
        filter.catch(error, mockArgumentsHost);

        // Verify response includes error details
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              details: expect.objectContaining({
                name: 'Error',
                message: 'Specific error message'
              })
            })
          })
        );
      });

      it('should not include error details in production environment', () => {
        // Set production environment
        process.env.NODE_ENV = 'production';

        // Create a new filter instance for production
        const productionFilter = new GlobalExceptionFilter(
          loggerService as unknown as LoggerService,
          tracingService as unknown as TracingService
        );

        // Create an Error
        const error = new Error('Sensitive error message');

        // Call the filter
        productionFilter.catch(error, mockArgumentsHost);

        // Verify response does not include error details
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.not.objectContaining({
              details: expect.anything()
            })
          })
        );
      });
    });
  });

  describe('request context handling', () => {
    it('should include request ID in error response', () => {
      // Create an error
      const error = new Error('Test error');

      // Call the filter
      filter.catch(error, mockArgumentsHost);

      // Verify response includes request ID
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            requestId: 'test-request-id'
          })
        })
      );
    });

    it('should include request path in error response', () => {
      // Create an error
      const error = new Error('Test error');

      // Call the filter
      filter.catch(error, mockArgumentsHost);

      // Verify response includes path
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            path: '/api/test'
          })
        })
      );
    });

    it('should include journey context from headers in error response', () => {
      // Create an error
      const error = new Error('Test error');

      // Call the filter
      filter.catch(error, mockArgumentsHost);

      // Verify response includes journey context
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            journey: 'health'
          })
        })
      );
    });

    it('should handle missing request properties gracefully', () => {
      // Create a request with minimal properties
      const minimalRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {}
      };

      // Update mock arguments host
      const minimalArgumentsHost = {
        ...mockArgumentsHost,
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(minimalRequest)
        })
      };

      // Create an error
      const error = new Error('Test error');

      // Call the filter
      filter.catch(error, minimalArgumentsHost);

      // Verify filter doesn't crash and returns a response
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('tracing integration', () => {
    it('should create a span for error handling', () => {
      // Create an error
      const error = new Error('Test error');

      // Call the filter
      filter.catch(error, mockArgumentsHost);

      // Verify span creation
      expect(tracingService.startSpan).toHaveBeenCalledWith('error.handling');
    });

    it('should set error attributes on the span', () => {
      // Create a BaseError
      const baseError = new MockBaseError(
        'Test error',
        ErrorType.TECHNICAL,
        'TECH_001',
        { journey: JourneyContext.HEALTH }
      );

      // Get mock span
      const mockSpan = tracingService.startSpan();

      // Call the filter
      filter.catch(baseError, mockArgumentsHost);

      // Verify span attributes
      expect(mockSpan.setAttributes).toHaveBeenCalledWith(
        expect.objectContaining({
          'error.type': ErrorType.TECHNICAL,
          'error.handled': true,
          'http.method': 'GET',
          'http.url': '/api/test'
        })
      );

      // Verify error details are added to span
      expect(mockSpan.setAttributes).toHaveBeenCalledWith(
        expect.objectContaining({
          'error.type': ErrorType.TECHNICAL,
          'error.code': 'TECH_001',
          'error.message': 'Test error',
          'error.status_code': HttpStatus.INTERNAL_SERVER_ERROR,
          'journey.context': JourneyContext.HEALTH
        })
      );
    });

    it('should record exception in the span for Error objects', () => {
      // Create an Error
      const error = new Error('Test error');

      // Get mock span
      const mockSpan = tracingService.startSpan();

      // Call the filter
      filter.catch(error, mockArgumentsHost);

      // Verify exception is recorded
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
    });

    it('should handle tracing errors gracefully', () => {
      // Mock span to throw an error when setAttributes is called
      const errorSpan = {
        setAttributes: jest.fn().mockImplementation(() => {
          throw new Error('Tracing error');
        }),
        recordException: jest.fn(),
        end: jest.fn(),
        setStatus: jest.fn()
      };

      tracingService.startSpan = jest.fn().mockReturnValue(errorSpan);

      // Create an error
      const error = new Error('Test error');

      // Call the filter - should not throw
      expect(() => filter.catch(error, mockArgumentsHost)).not.toThrow();

      // Verify response is still sent
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalled();

      // Verify warning is logged
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to enhance span with error details'),
        'GlobalExceptionFilter'
      );
    });
  });

  describe('fallback strategy execution', () => {
    it('should attempt fallback for retryable errors', () => {
      // Create a retryable error
      const retryableError = new MockBaseError(
        'Service unavailable',
        ErrorType.UNAVAILABLE,
        'SERVICE_UNAVAILABLE',
        {
          journey: JourneyContext.HEALTH,
          recoveryStrategy: ErrorRecoveryStrategy.CACHED_DATA
        }
      );

      // Spy on private methods
      const executeFallbackSpy = jest.spyOn(
        filter as any,
        'executeFallbackStrategy'
      );

      // Call the filter
      filter.catch(retryableError, mockArgumentsHost);

      // Verify fallback execution was attempted
      expect(executeFallbackSpy).toHaveBeenCalled();
    });

    it('should not attempt fallback for non-retryable errors', () => {
      // Create a non-retryable error
      const nonRetryableError = new MockBaseError(
        'Validation error',
        ErrorType.VALIDATION,
        'VALIDATION_ERROR',
        { journey: JourneyContext.HEALTH }
      );

      // Spy on private methods
      const executeFallbackSpy = jest.spyOn(
        filter as any,
        'executeFallbackStrategy'
      );

      // Call the filter
      filter.catch(nonRetryableError, mockArgumentsHost);

      // Verify fallback execution was not attempted
      expect(executeFallbackSpy).not.toHaveBeenCalled();
    });

    it('should handle fallback execution errors gracefully', () => {
      // Create a retryable error
      const retryableError = new MockBaseError(
        'Service unavailable',
        ErrorType.UNAVAILABLE,
        'SERVICE_UNAVAILABLE',
        {
          journey: JourneyContext.HEALTH,
          recoveryStrategy: ErrorRecoveryStrategy.CACHED_DATA
        }
      );

      // Make executeFallbackStrategy throw an error
      jest.spyOn(filter as any, 'executeFallbackStrategy')
        .mockImplementation(() => {
          throw new Error('Fallback error');
        });

      // Call the filter - should not throw
      expect(() => filter.catch(retryableError, mockArgumentsHost)).not.toThrow();

      // Verify response is still sent
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      expect(mockResponse.json).toHaveBeenCalled();

      // Verify warning is logged
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to execute fallback strategy'),
        'GlobalExceptionFilter'
      );
    });

    it('should return fallback result when available', () => {
      // Create a retryable error
      const retryableError = new MockBaseError(
        'Service unavailable',
        ErrorType.UNAVAILABLE,
        'SERVICE_UNAVAILABLE',
        {
          journey: JourneyContext.HEALTH,
          recoveryStrategy: ErrorRecoveryStrategy.CACHED_DATA
        }
      );

      // Mock fallback result
      const fallbackResult = { data: 'cached data' };
      jest.spyOn(filter as any, 'executeFallbackStrategy')
        .mockReturnValue(fallbackResult);

      // Call the filter
      const result = filter.catch(retryableError, mockArgumentsHost);

      // Verify fallback result is returned
      expect(result).toBe(fallbackResult);

      // Verify response is not sent
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('filter options', () => {
    it('should respect includeStackTraces option', () => {
      // Create filter with includeStackTraces: false
      const noStackFilter = new GlobalExceptionFilter(
        loggerService as unknown as LoggerService,
        tracingService as unknown as TracingService,
        { includeStackTraces: false }
      );

      // Create an error
      const error = new Error('Test error');

      // Call the filter
      noStackFilter.catch(error, mockArgumentsHost);

      // Verify response does not include stack trace
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.not.objectContaining({
            stack: expect.anything()
          })
        })
      );
    });

    it('should respect executeFallbackStrategies option', () => {
      // Create filter with executeFallbackStrategies: false
      const noFallbackFilter = new GlobalExceptionFilter(
        loggerService as unknown as LoggerService,
        tracingService as unknown as TracingService,
        { executeFallbackStrategies: false }
      );

      // Create a retryable error
      const retryableError = new MockBaseError(
        'Service unavailable',
        ErrorType.UNAVAILABLE,
        'SERVICE_UNAVAILABLE',
        {
          journey: JourneyContext.HEALTH,
          recoveryStrategy: ErrorRecoveryStrategy.CACHED_DATA
        }
      );

      // Spy on private methods
      const executeFallbackSpy = jest.spyOn(
        noFallbackFilter as any,
        'executeFallbackStrategy'
      );

      // Call the filter
      noFallbackFilter.catch(retryableError, mockArgumentsHost);

      // Verify fallback execution was not attempted
      expect(executeFallbackSpy).not.toHaveBeenCalled();
    });

    it('should respect includeJourneyContext option', () => {
      // Create filter with includeJourneyContext: false
      const noJourneyContextFilter = new GlobalExceptionFilter(
        loggerService as unknown as LoggerService,
        tracingService as unknown as TracingService,
        { includeJourneyContext: false }
      );

      // Create a BaseError with journey context
      const baseError = new MockBaseError(
        'Test error',
        ErrorType.TECHNICAL,
        'TECH_001',
        { journey: JourneyContext.HEALTH }
      );

      // Spy on private methods
      const logBaseErrorSpy = jest.spyOn(
        noJourneyContextFilter as any,
        'logBaseError'
      );

      // Call the filter
      noJourneyContextFilter.catch(baseError, mockArgumentsHost);

      // Verify journey context is not included in log data
      expect(logBaseErrorSpy).toHaveBeenCalledWith(
        baseError,
        expect.not.objectContaining({
          journeyContext: JourneyContext.HEALTH
        }),
        'GlobalExceptionFilter'
      );
    });
  });

  describe('error in exception filter', () => {
    it('should handle errors in the exception filter itself', () => {
      // Make processException throw an error
      jest.spyOn(filter as any, 'processException')
        .mockImplementation(() => {
          throw new Error('Filter error');
        });

      // Create an error
      const error = new Error('Test error');

      // Call the filter - should not throw
      expect(() => filter.catch(error, mockArgumentsHost)).not.toThrow();

      // Verify generic error response is sent
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.objectContaining({
          type: ErrorType.TECHNICAL,
          code: 'EXCEPTION_FILTER_ERROR',
          message: 'An unexpected error occurred while processing the request'
        })
      });

      // Verify error is logged
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in exception filter'),
        expect.anything()
      );
    });
  });
});