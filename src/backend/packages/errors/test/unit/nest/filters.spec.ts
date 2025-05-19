import { HttpException, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GlobalExceptionFilter } from '../../../src/nest/filters';
import { BaseError, ErrorType, JourneyErrorType } from '../../../src/types';
import { LoggerMock } from '../../mocks/logger.mock';
import { ArgumentsHostMock, createMockArgumentsHost } from '../../mocks/nest-components.mock';
import { TracingMock } from '../../mocks/tracing.mock';
import { RETRY_CONFIG } from '../../../src/constants';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let loggerMock: LoggerMock;
  let tracingMock: TracingMock;
  let hostMock: ArgumentsHostMock;
  let responseMock: any;
  let requestMock: any;

  beforeEach(async () => {
    loggerMock = new LoggerMock();
    tracingMock = new TracingMock();
    
    const moduleRef = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        { provide: 'LoggerService', useValue: loggerMock },
        { provide: 'TracingService', useValue: tracingMock }
      ],
    }).compile();

    filter = moduleRef.get<GlobalExceptionFilter>(GlobalExceptionFilter);
    
    responseMock = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    requestMock = {
      method: 'GET',
      url: '/test',
      headers: {
        'x-journey-id': 'health',
        'x-request-id': '123456',
        'x-correlation-id': 'abcdef'
      },
      user: { id: 'user123' }
    };
    
    hostMock = createMockArgumentsHost(requestMock, responseMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerMock.clearLogs();
    tracingMock.clearSpans();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('BaseError handling', () => {
    it('should handle validation errors with 400 status code', () => {
      // Arrange
      const validationError = new BaseError({
        message: 'Invalid input data',
        type: ErrorType.VALIDATION,
        code: 'VALIDATION_ERROR',
        details: { field: 'email', issue: 'format' }
      });

      // Act
      filter.catch(validationError, hostMock);

      // Assert
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(responseMock.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.VALIDATION,
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: { field: 'email', issue: 'format' }
        }
      });
      expect(loggerMock.getLogEntries('debug')).toHaveLength(1);
      expect(tracingMock.recordErrorCalls).toHaveLength(1);
    });

    it('should handle business errors with 422 status code', () => {
      // Arrange
      const businessError = new BaseError({
        message: 'Cannot schedule appointment in the past',
        type: ErrorType.BUSINESS,
        code: 'INVALID_APPOINTMENT_DATE',
        details: { date: '2023-01-01' }
      });

      // Act
      filter.catch(businessError, hostMock);

      // Assert
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(responseMock.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.BUSINESS,
          code: 'INVALID_APPOINTMENT_DATE',
          message: 'Cannot schedule appointment in the past',
          details: { date: '2023-01-01' }
        }
      });
      expect(loggerMock.getLogEntries('warn')).toHaveLength(1);
      expect(tracingMock.recordErrorCalls).toHaveLength(1);
    });

    it('should handle technical errors with 500 status code', () => {
      // Arrange
      const technicalError = new BaseError({
        message: 'Database connection failed',
        type: ErrorType.TECHNICAL,
        code: 'DB_CONNECTION_ERROR',
        details: { service: 'postgres' }
      });

      // Act
      filter.catch(technicalError, hostMock);

      // Assert
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(responseMock.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'DB_CONNECTION_ERROR',
          message: 'Database connection failed',
          details: { service: 'postgres' }
        }
      });
      expect(loggerMock.getLogEntries('error')).toHaveLength(1);
      expect(tracingMock.recordErrorCalls).toHaveLength(1);
    });

    it('should handle external errors with 502 status code', () => {
      // Arrange
      const externalError = new BaseError({
        message: 'External API unavailable',
        type: ErrorType.EXTERNAL,
        code: 'EXTERNAL_API_ERROR',
        details: { service: 'payment-gateway' }
      });

      // Act
      filter.catch(externalError, hostMock);

      // Assert
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
      expect(responseMock.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.EXTERNAL,
          code: 'EXTERNAL_API_ERROR',
          message: 'External API unavailable',
          details: { service: 'payment-gateway' }
        }
      });
      expect(loggerMock.getLogEntries('error')).toHaveLength(1);
      expect(tracingMock.recordErrorCalls).toHaveLength(1);
    });

    it('should handle journey-specific errors with appropriate status code', () => {
      // Arrange
      const journeyError = new BaseError({
        message: 'Health metric not found',
        type: ErrorType.BUSINESS,
        code: 'HEALTH_001',
        journeyType: JourneyErrorType.HEALTH,
        details: { metricId: '123' }
      });

      // Act
      filter.catch(journeyError, hostMock);

      // Assert
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(responseMock.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.BUSINESS,
          code: 'HEALTH_001',
          message: 'Health metric not found',
          journeyType: JourneyErrorType.HEALTH,
          details: { metricId: '123' }
        }
      });
      expect(loggerMock.getLogEntries('warn')).toHaveLength(1);
      expect(loggerMock.getLogEntries('warn')[0].context).toContain('HEALTH');
      expect(tracingMock.recordErrorCalls).toHaveLength(1);
      expect(tracingMock.recordErrorCalls[0].tags).toHaveProperty('journeyType', JourneyErrorType.HEALTH);
    });
  });

  describe('HttpException handling', () => {
    it('should handle NestJS HttpException with appropriate status code', () => {
      // Arrange
      const httpException = new HttpException('Forbidden resource', HttpStatus.FORBIDDEN);

      // Act
      filter.catch(httpException, hostMock);

      // Assert
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(responseMock.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.VALIDATION, // 4xx maps to VALIDATION
          message: 'Forbidden resource'
        }
      });
      expect(loggerMock.getLogEntries('warn')).toHaveLength(1);
      expect(tracingMock.recordErrorCalls).toHaveLength(1);
    });

    it('should handle HttpException with object response', () => {
      // Arrange
      const httpException = new HttpException(
        { message: 'Validation failed', errors: ['Field is required'] },
        HttpStatus.BAD_REQUEST
      );

      // Act
      filter.catch(httpException, hostMock);

      // Assert
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(responseMock.json).toHaveBeenCalledWith({
        error: {
          message: 'Validation failed',
          errors: ['Field is required'],
          type: ErrorType.VALIDATION
        }
      });
      expect(loggerMock.getLogEntries('warn')).toHaveLength(1);
      expect(tracingMock.recordErrorCalls).toHaveLength(1);
    });

    it('should map 5xx HttpExceptions to TECHNICAL error type', () => {
      // Arrange
      const httpException = new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);

      // Act
      filter.catch(httpException, hostMock);

      // Assert
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(responseMock.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.TECHNICAL,
          message: 'Internal server error'
        }
      });
      expect(loggerMock.getLogEntries('error')).toHaveLength(1);
      expect(tracingMock.recordErrorCalls).toHaveLength(1);
    });

    it('should map specific 5xx HttpExceptions to EXTERNAL error type', () => {
      // Arrange
      const httpException = new HttpException('Bad gateway', HttpStatus.BAD_GATEWAY);

      // Act
      filter.catch(httpException, hostMock);

      // Assert
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
      expect(responseMock.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.EXTERNAL,
          message: 'Bad gateway'
        }
      });
      expect(loggerMock.getLogEntries('error')).toHaveLength(1);
      expect(tracingMock.recordErrorCalls).toHaveLength(1);
    });
  });

  describe('Unknown error handling', () => {
    it('should handle unknown errors with 500 status code', () => {
      // Arrange
      const unknownError = new Error('Something went wrong');

      // Act
      filter.catch(unknownError, hostMock);

      // Assert
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(responseMock.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: {
            name: 'Error',
            message: 'Something went wrong'
          }
        }
      });
      expect(loggerMock.getLogEntries('error')).toHaveLength(1);
      expect(tracingMock.recordErrorCalls).toHaveLength(1);
    });

    it('should not include error details in production environment', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const unknownError = new Error('Something went wrong');

      // Act
      filter.catch(unknownError, hostMock);

      // Assert
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(responseMock.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
          // No details in production
        }
      });
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Request context handling', () => {
    it('should include request context in logs', () => {
      // Arrange
      const error = new Error('Test error');

      // Act
      filter.catch(error, hostMock);

      // Assert
      const logEntry = loggerMock.getLogEntries('error')[0];
      expect(logEntry.meta).toMatchObject({
        requestInfo: {
          method: 'GET',
          url: '/test',
          userId: 'user123',
          journeyId: 'health'
        }
      });
    });

    it('should include request headers in tracing spans', () => {
      // Arrange
      const error = new Error('Test error');

      // Act
      filter.catch(error, hostMock);

      // Assert
      expect(tracingMock.recordErrorCalls[0].tags).toMatchObject({
        'http.method': 'GET',
        'http.url': '/test',
        'request.id': '123456',
        'correlation.id': 'abcdef'
      });
    });
  });

  describe('Fallback strategy execution', () => {
    it('should attempt fallback for recoverable errors', () => {
      // Arrange
      const recoverableError = new BaseError({
        message: 'Temporary database unavailable',
        type: ErrorType.TECHNICAL,
        code: 'DB_TEMPORARY_ERROR',
        isRecoverable: true
      });
      
      // Mock the fallback strategy method
      const fallbackSpy = jest.spyOn(filter as any, 'executeFallbackStrategy').mockResolvedValue({
        success: true,
        data: { fallback: 'data' }
      });

      // Act
      filter.catch(recoverableError, hostMock);

      // Assert
      expect(fallbackSpy).toHaveBeenCalled();
      expect(loggerMock.getLogEntries('info')).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Fallback strategy executed')
        })
      );
    });

    it('should not attempt fallback for non-recoverable errors', () => {
      // Arrange
      const nonRecoverableError = new BaseError({
        message: 'Critical database error',
        type: ErrorType.TECHNICAL,
        code: 'DB_CRITICAL_ERROR',
        isRecoverable: false
      });
      
      // Mock the fallback strategy method
      const fallbackSpy = jest.spyOn(filter as any, 'executeFallbackStrategy');

      // Act
      filter.catch(nonRecoverableError, hostMock);

      // Assert
      expect(fallbackSpy).not.toHaveBeenCalled();
    });
  });

  describe('Retry mechanism', () => {
    it('should attempt retry for transient errors', async () => {
      // Arrange
      const transientError = new BaseError({
        message: 'Network temporarily unavailable',
        type: ErrorType.EXTERNAL,
        code: 'NETWORK_ERROR',
        isTransient: true
      });
      
      // Mock the retry method
      const retrySpy = jest.spyOn(filter as any, 'executeWithRetry').mockResolvedValue({
        success: false,
        error: transientError
      });

      // Act
      await filter.catch(transientError, hostMock);

      // Assert
      expect(retrySpy).toHaveBeenCalled();
      expect(retrySpy).toHaveBeenCalledWith(
        expect.any(Function),
        RETRY_CONFIG.EXTERNAL_API,
        expect.any(Object)
      );
    });

    it('should not attempt retry for non-transient errors', async () => {
      // Arrange
      const nonTransientError = new BaseError({
        message: 'Validation failed',
        type: ErrorType.VALIDATION,
        code: 'VALIDATION_ERROR',
        isTransient: false
      });
      
      // Mock the retry method
      const retrySpy = jest.spyOn(filter as any, 'executeWithRetry');

      // Act
      await filter.catch(nonTransientError, hostMock);

      // Assert
      expect(retrySpy).not.toHaveBeenCalled();
    });
  });

  describe('Integration with distributed tracing', () => {
    it('should record error in active span', () => {
      // Arrange
      const error = new Error('Test error');

      // Act
      filter.catch(error, hostMock);

      // Assert
      expect(tracingMock.recordErrorCalls).toHaveLength(1);
      expect(tracingMock.recordErrorCalls[0].error).toBe(error);
    });

    it('should include error metadata in span', () => {
      // Arrange
      const businessError = new BaseError({
        message: 'Business rule violation',
        type: ErrorType.BUSINESS,
        code: 'BUSINESS_RULE_ERROR',
        details: { rule: 'appointment-scheduling' }
      });

      // Act
      filter.catch(businessError, hostMock);

      // Assert
      expect(tracingMock.recordErrorCalls[0].tags).toMatchObject({
        'error.type': ErrorType.BUSINESS,
        'error.code': 'BUSINESS_RULE_ERROR'
      });
    });

    it('should create error span with correct name', () => {
      // Arrange
      const error = new Error('Test error');

      // Act
      filter.catch(error, hostMock);

      // Assert
      expect(tracingMock.createSpanCalls).toHaveLength(1);
      expect(tracingMock.createSpanCalls[0].name).toContain('error.handler');
    });
  });
});