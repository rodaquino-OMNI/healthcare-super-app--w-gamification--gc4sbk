import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { AllExceptionsFilter } from '../../src/nest';
import { 
  ValidationError, 
  BusinessError, 
  TechnicalError, 
  ExternalError,
  ResourceNotFoundError,
  InvalidParameterError,
  DatabaseError,
  ExternalApiError
} from '../../src/categories';
import { BaseError } from '../../src/base';
import { ErrorType } from '../../src/types';
import { LoggerMock, TracingMock, createMockArgumentsHost } from '../mocks';

describe('Error Logging Integration', () => {
  let module: TestingModule;
  let exceptionFilter: AllExceptionsFilter;
  let loggerMock: LoggerMock;
  let tracingMock: TracingMock;
  let originalNodeEnv: string | undefined;

  beforeAll(() => {
    // Store original NODE_ENV to restore after tests
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  beforeEach(async () => {
    // Reset mocks before each test
    loggerMock = new LoggerMock();
    tracingMock = new TracingMock();

    module = await Test.createTestingModule({
      providers: [
        {
          provide: LoggerService,
          useValue: loggerMock
        },
        {
          provide: TracingService,
          useValue: tracingMock
        },
        AllExceptionsFilter
      ],
    }).compile();

    exceptionFilter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  describe('Error Severity Levels', () => {
    it('should log validation errors at DEBUG level', () => {
      // Arrange
      const error = new InvalidParameterError('userId', 'Invalid user ID format');
      const host = createMockArgumentsHost();

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(loggerMock.debug).toHaveBeenCalled();
      expect(loggerMock.debug.mock.calls[0][0]).toContain('Validation error');
      expect(loggerMock.debug.mock.calls[0][0]).toContain('Invalid user ID format');
    });

    it('should log business errors at WARN level', () => {
      // Arrange
      const error = new ResourceNotFoundError('User', '123');
      const host = createMockArgumentsHost();

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(loggerMock.warn).toHaveBeenCalled();
      expect(loggerMock.warn.mock.calls[0][0]).toContain('Business error');
      expect(loggerMock.warn.mock.calls[0][0]).toContain('User with ID 123 not found');
    });

    it('should log technical errors at ERROR level with stack trace', () => {
      // Arrange
      const error = new DatabaseError('Failed to connect to database', {
        operation: 'connect',
        database: 'users'
      });
      const host = createMockArgumentsHost();

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(loggerMock.error).toHaveBeenCalled();
      expect(loggerMock.error.mock.calls[0][0]).toContain('Technical error');
      expect(loggerMock.error.mock.calls[0][0]).toContain('Failed to connect to database');
      expect(loggerMock.error.mock.calls[0][1]).toBeDefined(); // Stack trace
    });

    it('should log external errors at ERROR level with stack trace', () => {
      // Arrange
      const error = new ExternalApiError(
        'Failed to fetch data from external API',
        'https://api.external-service.com/users',
        HttpStatus.SERVICE_UNAVAILABLE
      );
      const host = createMockArgumentsHost();

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(loggerMock.error).toHaveBeenCalled();
      expect(loggerMock.error.mock.calls[0][0]).toContain('External system error');
      expect(loggerMock.error.mock.calls[0][0]).toContain('Failed to fetch data from external API');
      expect(loggerMock.error.mock.calls[0][1]).toBeDefined(); // Stack trace
    });
  });

  describe('Context Propagation', () => {
    it('should include request information in error logs', () => {
      // Arrange
      const error = new TechnicalError('System error occurred');
      const requestInfo = {
        method: 'GET',
        url: '/api/users/123',
        headers: {}
      };
      const host = createMockArgumentsHost({
        request: requestInfo
      });

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(loggerMock.error).toHaveBeenCalled();
      const logContext = loggerMock.getLogEntries()[0].context;
      expect(logContext).toMatchObject({
        request: {
          method: 'GET',
          url: '/api/users/123'
        }
      });
    });

    it('should include user information in error logs when available', () => {
      // Arrange
      const error = new BusinessError('Operation not allowed');
      const requestInfo = {
        method: 'POST',
        url: '/api/resources',
        user: {
          id: 'user-123',
          roles: ['user']
        },
        headers: {}
      };
      const host = createMockArgumentsHost({
        request: requestInfo
      });

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(loggerMock.warn).toHaveBeenCalled();
      const logContext = loggerMock.getLogEntries()[0].context;
      expect(logContext).toMatchObject({
        user: {
          id: 'user-123',
          roles: ['user']
        }
      });
    });

    it('should include journey context in error logs when available', () => {
      // Arrange
      const error = new ValidationError('Invalid input');
      const requestInfo = {
        method: 'POST',
        url: '/api/health/metrics',
        headers: {
          'x-journey-id': 'health',
          'x-correlation-id': 'corr-123'
        }
      };
      const host = createMockArgumentsHost({
        request: requestInfo
      });

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(loggerMock.debug).toHaveBeenCalled();
      const logContext = loggerMock.getLogEntries()[0].context;
      expect(logContext).toMatchObject({
        journey: 'health',
        correlationId: 'corr-123'
      });
    });

    it('should propagate error context to tracing spans', () => {
      // Arrange
      const error = new DatabaseError('Query execution failed', {
        operation: 'findOne',
        table: 'users',
        query: 'SELECT * FROM users WHERE id = ?'
      });
      const host = createMockArgumentsHost();

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(tracingMock.recordException).toHaveBeenCalled();
      const [recordedError, errorContext] = tracingMock.recordException.mock.calls[0];
      expect(recordedError).toBe(error);
      expect(errorContext).toMatchObject({
        errorType: ErrorType.TECHNICAL,
        errorCode: expect.any(String),
        operation: 'findOne',
        table: 'users'
      });
      // Sensitive data should be sanitized
      expect(errorContext).not.toHaveProperty('query');
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should include detailed error information in development environment', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const error = new Error('Unexpected error');
      const host = createMockArgumentsHost();

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(loggerMock.error).toHaveBeenCalled();
      const response = host.switchToHttp().getResponse();
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details: expect.objectContaining({
              name: 'Error',
              message: 'Unexpected error'
            })
          })
        })
      );
    });

    it('should exclude detailed error information in production environment', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const error = new Error('Unexpected error with sensitive details');
      const host = createMockArgumentsHost();

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(loggerMock.error).toHaveBeenCalled();
      const response = host.switchToHttp().getResponse();
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            type: ErrorType.TECHNICAL,
            message: 'An unexpected error occurred'
          })
        })
      );
      // Should not contain detailed error information
      expect(response.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details: expect.anything()
          })
        })
      );
    });
  });

  describe('Sensitive Data Handling', () => {
    it('should sanitize sensitive data in error logs', () => {
      // Arrange
      const sensitiveData = {
        password: 'secret123',
        creditCard: '4111-1111-1111-1111',
        ssn: '123-45-6789'
      };
      const error = new ValidationError('Invalid input', sensitiveData);
      const host = createMockArgumentsHost();

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(loggerMock.debug).toHaveBeenCalled();
      const logEntries = loggerMock.getLogEntries();
      
      // Check that sensitive data is not present in any log entry
      logEntries.forEach(entry => {
        const logString = JSON.stringify(entry);
        expect(logString).not.toContain('secret123');
        expect(logString).not.toContain('4111-1111-1111-1111');
        expect(logString).not.toContain('123-45-6789');
      });
    });

    it('should preserve error codes and types while sanitizing details', () => {
      // Arrange
      const error = new ExternalApiError(
        'Authentication failed with external service',
        'https://api.payment-processor.com/authorize',
        HttpStatus.UNAUTHORIZED,
        {
          apiKey: 'sk_test_123456789',
          requestId: 'req_123456789'
        }
      );
      const host = createMockArgumentsHost();

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(loggerMock.error).toHaveBeenCalled();
      const logEntries = loggerMock.getLogEntries();
      
      // Error code and type should be preserved
      const logEntry = logEntries[0];
      expect(logEntry.message).toContain('Authentication failed');
      expect(logEntry.context).toHaveProperty('errorType', ErrorType.EXTERNAL);
      expect(logEntry.context).toHaveProperty('errorCode');
      expect(logEntry.context).toHaveProperty('requestId', 'req_123456789');
      
      // Sensitive API key should be sanitized
      expect(JSON.stringify(logEntry)).not.toContain('sk_test_123456789');
    });

    it('should sanitize sensitive data in error responses', () => {
      // Arrange
      const sensitiveData = {
        password: 'secret123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      };
      const error = new BusinessError(
        'Account validation failed',
        'ACCOUNT_VALIDATION_FAILED',
        sensitiveData
      );
      const host = createMockArgumentsHost();

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      const response = host.switchToHttp().getResponse();
      const responseJson = response.json.mock.calls[0][0];
      
      // Response should not contain sensitive data
      const responseStr = JSON.stringify(responseJson);
      expect(responseStr).not.toContain('secret123');
      expect(responseStr).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      
      // But should still contain error type and code
      expect(responseJson.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(responseJson.error).toHaveProperty('code', 'ACCOUNT_VALIDATION_FAILED');
    });
  });

  describe('Cross-Journey Error Logging', () => {
    it('should log health journey-specific errors with proper context', () => {
      // Arrange
      const error = new BusinessError(
        'Health metric threshold exceeded',
        'HEALTH_METRIC_THRESHOLD_EXCEEDED',
        { metricType: 'heartRate', value: 180, threshold: 160 }
      );
      const requestInfo = {
        method: 'POST',
        url: '/api/health/metrics',
        headers: {
          'x-journey-id': 'health',
          'x-correlation-id': 'health-corr-123'
        }
      };
      const host = createMockArgumentsHost({
        request: requestInfo
      });

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(loggerMock.warn).toHaveBeenCalled();
      const logContext = loggerMock.getLogEntries()[0].context;
      expect(logContext).toMatchObject({
        journey: 'health',
        correlationId: 'health-corr-123',
        errorCode: 'HEALTH_METRIC_THRESHOLD_EXCEEDED',
        metricType: 'heartRate',
        value: 180,
        threshold: 160
      });
    });

    it('should log care journey-specific errors with proper context', () => {
      // Arrange
      const error = new BusinessError(
        'Appointment slot unavailable',
        'CARE_APPOINTMENT_UNAVAILABLE',
        { providerId: 'provider-123', requestedTime: '2023-05-15T10:00:00Z' }
      );
      const requestInfo = {
        method: 'POST',
        url: '/api/care/appointments',
        headers: {
          'x-journey-id': 'care',
          'x-correlation-id': 'care-corr-123'
        }
      };
      const host = createMockArgumentsHost({
        request: requestInfo
      });

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(loggerMock.warn).toHaveBeenCalled();
      const logContext = loggerMock.getLogEntries()[0].context;
      expect(logContext).toMatchObject({
        journey: 'care',
        correlationId: 'care-corr-123',
        errorCode: 'CARE_APPOINTMENT_UNAVAILABLE',
        providerId: 'provider-123',
        requestedTime: '2023-05-15T10:00:00Z'
      });
    });

    it('should log plan journey-specific errors with proper context', () => {
      // Arrange
      const error = new BusinessError(
        'Benefit not covered by plan',
        'PLAN_BENEFIT_NOT_COVERED',
        { planId: 'plan-123', benefitCode: 'DENTAL_CLEANING' }
      );
      const requestInfo = {
        method: 'GET',
        url: '/api/plan/benefits/DENTAL_CLEANING',
        headers: {
          'x-journey-id': 'plan',
          'x-correlation-id': 'plan-corr-123'
        }
      };
      const host = createMockArgumentsHost({
        request: requestInfo
      });

      // Act
      exceptionFilter.catch(error, host);

      // Assert
      expect(loggerMock.warn).toHaveBeenCalled();
      const logContext = loggerMock.getLogEntries()[0].context;
      expect(logContext).toMatchObject({
        journey: 'plan',
        correlationId: 'plan-corr-123',
        errorCode: 'PLAN_BENEFIT_NOT_COVERED',
        planId: 'plan-123',
        benefitCode: 'DENTAL_CLEANING'
      });
    });
  });
});