import { Test } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from '../../../src/nest/filters';
import { LoggingService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { FallbackStrategyExecutor } from '../../../src/recovery/fallback-strategy.executor';
import { BaseError, ErrorType } from '../../../src/categories/base.error';
import { TechnicalError } from '../../../src/categories/technical.errors';
import { ExternalError } from '../../../src/categories/external.errors';
import { isRecoverableError } from '../../../src/utils/error-classification.util';

// Mock the dependencies
jest.mock('@austa/logging');
jest.mock('@austa/tracing');
jest.mock('../../../src/recovery/fallback-strategy.executor');
jest.mock('../../../src/utils/error-classification.util');

// Mock implementation of BaseError for testing
class MockBaseError extends Error implements BaseError {
  constructor(
    public readonly message: string,
    public readonly type: ErrorType,
    public readonly code: string,
    public readonly details?: Record<string, any>,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      error: {
        type: this.type,
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        ...(this.context && { context: this.context }),
      },
    };
  }
}

// Mock implementation of TechnicalError for testing
class MockTechnicalError extends MockBaseError {
  constructor(
    message: string,
    code: string = 'TECHNICAL_ERROR',
    details?: Record<string, any>,
    context?: Record<string, any>,
  ) {
    super(message, ErrorType.TECHNICAL, code, details, context);
  }
}

// Mock implementation of ExternalError for testing
class MockExternalError extends MockBaseError {
  constructor(
    message: string,
    code: string = 'EXTERNAL_ERROR',
    details?: Record<string, any>,
    context?: Record<string, any>,
  ) {
    super(message, ErrorType.EXTERNAL, code, details, context);
  }
}

// Mock implementation of ValidationError for testing
class MockValidationError extends MockBaseError {
  constructor(
    message: string,
    code: string = 'VALIDATION_ERROR',
    details?: Record<string, any>,
    context?: Record<string, any>,
  ) {
    super(message, ErrorType.VALIDATION, code, details, context);
  }
}

// Mock implementation of BusinessError for testing
class MockBusinessError extends MockBaseError {
  constructor(
    message: string,
    code: string = 'BUSINESS_ERROR',
    details?: Record<string, any>,
    context?: Record<string, any>,
  ) {
    super(message, ErrorType.BUSINESS, code, details, context);
  }
}

// Mock implementation of JourneyError for testing
class MockHealthJourneyError extends MockBaseError {
  constructor(
    message: string,
    code: string = 'HEALTH_JOURNEY_ERROR',
    details?: Record<string, any>,
    context?: Record<string, any>,
  ) {
    super(message, ErrorType.HEALTH_JOURNEY, code, details, context);
  }
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let loggingService: jest.Mocked<LoggingService>;
  let tracingService: jest.Mocked<TracingService>;
  let fallbackStrategyExecutor: jest.Mocked<FallbackStrategyExecutor>;
  let host: ArgumentsHost;

  // Mock HTTP context
  const mockHttpContext = {
    getResponse: jest.fn().mockReturnValue({
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }),
    getRequest: jest.fn().mockReturnValue({
      method: 'GET',
      url: '/test',
      path: '/test',
      params: {},
      query: {},
      headers: {
        'x-request-id': 'test-request-id',
        'x-correlation-id': 'test-correlation-id',
        'x-journey-id': 'test-journey-id',
        'x-journey-step': 'test-step',
        'user-agent': 'test-user-agent',
      },
      user: { id: 'test-user-id' },
    }),
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock the ArgumentsHost
    host = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpContext),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
    };

    // Create mocked services
    const moduleRef = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        {
          provide: LoggingService,
          useValue: {
            info: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: TracingService,
          useValue: {
            setErrorInCurrentSpan: jest.fn(),
            getCurrentTraceId: jest.fn().mockReturnValue('test-trace-id'),
          },
        },
        {
          provide: FallbackStrategyExecutor,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    filter = moduleRef.get<GlobalExceptionFilter>(GlobalExceptionFilter);
    loggingService = moduleRef.get(LoggingService) as jest.Mocked<LoggingService>;
    tracingService = moduleRef.get(TracingService) as jest.Mocked<TracingService>;
    fallbackStrategyExecutor = moduleRef.get(FallbackStrategyExecutor) as jest.Mocked<FallbackStrategyExecutor>;

    // Mock isRecoverableError by default to return false
    (isRecoverableError as jest.Mock).mockReturnValue(false);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('Error handling and response formatting', () => {
    it('should handle BaseError and return the correct status code', () => {
      // Arrange
      const error = new MockBusinessError('Business rule violated', 'BUSINESS_RULE_VIOLATION');
      
      // Act
      filter.catch(error, host);
      
      // Assert
      const response = mockHttpContext.getResponse();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.json).toHaveBeenCalledWith(error.toJSON());
      expect(loggingService.warn).toHaveBeenCalled();
      expect(tracingService.setErrorInCurrentSpan).toHaveBeenCalledWith(error);
    });

    it('should handle HttpException and return the correct status code', () => {
      // Arrange
      const error = new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      
      // Act
      filter.catch(error, host);
      
      // Assert
      const response = mockHttpContext.getResponse();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(response.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.VALIDATION,
          message: 'Bad request',
        },
      });
      expect(loggingService.debug).toHaveBeenCalled();
    });

    it('should handle HttpException with object response', () => {
      // Arrange
      const errorResponse = {
        message: 'Validation failed',
        errors: [{ field: 'email', message: 'Invalid email format' }],
      };
      const error = new HttpException(errorResponse, HttpStatus.BAD_REQUEST);
      
      // Act
      filter.catch(error, host);
      
      // Assert
      const response = mockHttpContext.getResponse();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(response.json).toHaveBeenCalledWith({
        error: {
          ...errorResponse,
          type: ErrorType.VALIDATION,
        },
      });
    });

    it('should handle unknown errors and return 500 status code', () => {
      // Arrange
      const error = new Error('Unknown error');
      
      // Act
      filter.catch(error, host);
      
      // Assert
      const response = mockHttpContext.getResponse();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: {
            name: 'Error',
            message: 'Unknown error',
          },
          traceId: 'test-trace-id',
        },
      });
      expect(loggingService.error).toHaveBeenCalled();
    });

    it('should handle TechnicalError and log with error level', () => {
      // Arrange
      const error = new MockTechnicalError('Database connection failed', 'DB_CONNECTION_ERROR');
      
      // Act
      filter.catch(error, host);
      
      // Assert
      expect(loggingService.error).toHaveBeenCalled();
      const response = mockHttpContext.getResponse();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should handle ExternalError and log with error level', () => {
      // Arrange
      const error = new MockExternalError('External API unavailable', 'EXTERNAL_API_ERROR');
      
      // Act
      filter.catch(error, host);
      
      // Assert
      expect(loggingService.error).toHaveBeenCalled();
      const response = mockHttpContext.getResponse();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
    });

    it('should handle ValidationError and log with debug level', () => {
      // Arrange
      const error = new MockValidationError('Invalid input', 'INVALID_INPUT');
      
      // Act
      filter.catch(error, host);
      
      // Assert
      expect(loggingService.debug).toHaveBeenCalled();
      const response = mockHttpContext.getResponse();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    it('should handle BusinessError and log with warn level', () => {
      // Arrange
      const error = new MockBusinessError('Resource not found', 'RESOURCE_NOT_FOUND');
      
      // Act
      filter.catch(error, host);
      
      // Assert
      expect(loggingService.warn).toHaveBeenCalled();
      const response = mockHttpContext.getResponse();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should handle journey-specific errors with appropriate status codes', () => {
      // Arrange
      const error = new MockHealthJourneyError('Health goal not achievable', 'HEALTH_GOAL_ERROR');
      
      // Act
      filter.catch(error, host);
      
      // Assert
      const response = mockHttpContext.getResponse();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(loggingService.warn).toHaveBeenCalled();
    });
  });

  describe('Error context and journey information', () => {
    it('should include journey context in error response when available', () => {
      // Arrange
      const error = new MockBusinessError(
        'Business rule violated',
        'BUSINESS_RULE_VIOLATION',
        { rule: 'appointment-scheduling' },
        { journeyContext: 'care' }
      );
      
      // Act
      filter.catch(error, host);
      
      // Assert
      const response = mockHttpContext.getResponse();
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          journeyContext: expect.objectContaining({
            journeyId: 'test-journey-id',
            journeyStep: 'test-step'
          })
        })
      }));
    });

    it('should include trace ID in error response for unknown errors', () => {
      // Arrange
      const error = new Error('Unknown error');
      
      // Act
      filter.catch(error, host);
      
      // Assert
      const response = mockHttpContext.getResponse();
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          traceId: 'test-trace-id'
        })
      }));
    });

    it('should extract and use request information for logging context', () => {
      // Arrange
      const error = new MockTechnicalError('System error');
      
      // Act
      filter.catch(error, host);
      
      // Assert
      expect(loggingService.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          requestInfo: expect.objectContaining({
            method: 'GET',
            url: '/test',
            userId: 'test-user-id',
            journeyId: 'test-journey-id'
          })
        })
      );
    });
  });

  describe('Fallback strategy execution', () => {
    it('should attempt recovery for recoverable errors', () => {
      // Arrange
      const error = new MockExternalError('External API timeout', 'EXTERNAL_TIMEOUT');
      (isRecoverableError as jest.Mock).mockReturnValue(true);
      
      // Act
      filter.catch(error, host);
      
      // Assert
      expect(fallbackStrategyExecutor.execute).toHaveBeenCalledWith(
        error,
        expect.any(Object)
      );
    });

    it('should return fallback result when recovery is successful', () => {
      // Arrange
      const error = new MockExternalError('External API timeout', 'EXTERNAL_TIMEOUT');
      const fallbackResult = {
        recovered: true,
        strategyName: 'cached-data',
        statusCode: HttpStatus.OK,
        data: { result: 'fallback-data' }
      };
      
      (isRecoverableError as jest.Mock).mockReturnValue(true);
      fallbackStrategyExecutor.execute.mockReturnValue(fallbackResult);
      
      // Act
      filter.catch(error, host);
      
      // Assert
      const response = mockHttpContext.getResponse();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.json).toHaveBeenCalledWith({ result: 'fallback-data' });
      expect(loggingService.info).toHaveBeenCalled();
    });

    it('should proceed with normal error handling when recovery fails', () => {
      // Arrange
      const error = new MockExternalError('External API error', 'EXTERNAL_API_ERROR');
      const fallbackResult = {
        recovered: false,
        strategyName: 'cached-data'
      };
      
      (isRecoverableError as jest.Mock).mockReturnValue(true);
      fallbackStrategyExecutor.execute.mockReturnValue(fallbackResult);
      
      // Act
      filter.catch(error, host);
      
      // Assert
      const response = mockHttpContext.getResponse();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
      expect(loggingService.error).toHaveBeenCalled();
    });

    it('should handle errors during fallback strategy execution', () => {
      // Arrange
      const error = new MockExternalError('External API error', 'EXTERNAL_API_ERROR');
      const recoveryError = new Error('Fallback strategy failed');
      
      (isRecoverableError as jest.Mock).mockReturnValue(true);
      fallbackStrategyExecutor.execute.mockImplementation(() => {
        throw recoveryError;
      });
      
      // Act
      filter.catch(error, host);
      
      // Assert
      const response = mockHttpContext.getResponse();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
      expect(loggingService.error).toHaveBeenCalledWith(
        'Error occurred during fallback strategy execution',
        expect.objectContaining({
          originalException: error,
          recoveryError
        })
      );
    });
  });

  describe('Integration with distributed tracing', () => {
    it('should set error in current span', () => {
      // Arrange
      const error = new MockTechnicalError('System error');
      
      // Act
      filter.catch(error, host);
      
      // Assert
      expect(tracingService.setErrorInCurrentSpan).toHaveBeenCalledWith(error);
    });

    it('should include trace ID in error response when available', () => {
      // Arrange
      const error = new Error('Unknown error');
      tracingService.getCurrentTraceId.mockReturnValue('specific-trace-id');
      
      // Act
      filter.catch(error, host);
      
      // Assert
      const response = mockHttpContext.getResponse();
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          traceId: 'specific-trace-id'
        })
      }));
    });

    it('should include trace ID in logging context', () => {
      // Arrange
      const error = new MockTechnicalError('System error');
      tracingService.getCurrentTraceId.mockReturnValue('specific-trace-id');
      
      // Act
      filter.catch(error, host);
      
      // Assert
      expect(loggingService.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          traceId: 'specific-trace-id'
        })
      );
    });
  });
});