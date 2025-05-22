import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { LoggerMock } from '../mocks/logger.mock';
import { AllExceptionsFilter } from '../../../../shared/src/exceptions/exceptions.filter';
import { AppException, ErrorType } from '../../../../shared/src/exceptions/exceptions.types';
import { createMockArgumentsHost } from '../mocks/nest-components.mock';
import { createBusinessError, createTechnicalError, createValidationError, createExternalError } from '../helpers/error-factory';

describe('Error Logging Integration', () => {
  let app: INestApplication;
  let loggerMock: LoggerMock;
  let exceptionFilter: AllExceptionsFilter;

  beforeEach(async () => {
    // Create a fresh logger mock for each test
    loggerMock = new LoggerMock();

    // Create the exception filter with the mock logger
    exceptionFilter = new AllExceptionsFilter(loggerMock as any);

    // Create a test module with the exception filter
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'LoggerService',
          useValue: loggerMock,
        },
        AllExceptionsFilter,
      ],
    }).compile();

    // Create the NestJS application
    app = moduleFixture.createNestApplication();
    
    // Use the global exception filter
    app.useGlobalFilters(exceptionFilter);
    
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Error Severity Levels', () => {
    it('should log validation errors at debug level', () => {
      // Arrange
      const validationError = createValidationError('Invalid input', 'INVALID_INPUT', {
        field: 'email',
        constraint: 'isEmail',
      });
      const mockHost = createMockArgumentsHost({
        method: 'POST',
        url: '/api/users',
        body: { email: 'invalid-email' },
      });

      // Act
      exceptionFilter.catch(validationError, mockHost);

      // Assert
      const debugLogs = loggerMock.getLogEntries('debug');
      expect(debugLogs.length).toBeGreaterThan(0);
      expect(debugLogs[0].message).toContain('Validation error');
      expect(debugLogs[0].message).toContain('INVALID_INPUT');
      expect(debugLogs[0].context).toBe('ExceptionsFilter');
    });

    it('should log business errors at warn level', () => {
      // Arrange
      const businessError = createBusinessError('Resource already exists', 'RESOURCE_EXISTS', {
        resourceType: 'user',
        identifier: 'test@example.com',
      });
      const mockHost = createMockArgumentsHost({
        method: 'POST',
        url: '/api/users',
        body: { email: 'test@example.com' },
      });

      // Act
      exceptionFilter.catch(businessError, mockHost);

      // Assert
      const warnLogs = loggerMock.getLogEntries('warn');
      expect(warnLogs.length).toBeGreaterThan(0);
      expect(warnLogs[0].message).toContain('Business error');
      expect(warnLogs[0].message).toContain('RESOURCE_EXISTS');
      expect(warnLogs[0].context).toBe('ExceptionsFilter');
    });

    it('should log technical errors at error level with stack trace', () => {
      // Arrange
      const technicalError = createTechnicalError('Database connection failed', 'DB_CONNECTION_ERROR', {
        database: 'users',
        operation: 'connect',
      });
      const mockHost = createMockArgumentsHost({
        method: 'GET',
        url: '/api/users',
      });

      // Act
      exceptionFilter.catch(technicalError, mockHost);

      // Assert
      const errorLogs = loggerMock.getLogEntries('error');
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].message).toContain('Technical error');
      expect(errorLogs[0].message).toContain('DB_CONNECTION_ERROR');
      expect(errorLogs[0].trace).toBeDefined();
      expect(errorLogs[0].context).toBe('ExceptionsFilter');
    });

    it('should log external system errors at error level with stack trace', () => {
      // Arrange
      const externalError = createExternalError('Payment gateway timeout', 'PAYMENT_GATEWAY_TIMEOUT', {
        gateway: 'stripe',
        operation: 'createCharge',
      });
      const mockHost = createMockArgumentsHost({
        method: 'POST',
        url: '/api/payments',
        body: { amount: 100 },
      });

      // Act
      exceptionFilter.catch(externalError, mockHost);

      // Assert
      const errorLogs = loggerMock.getLogEntries('error');
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].message).toContain('External system error');
      expect(errorLogs[0].message).toContain('PAYMENT_GATEWAY_TIMEOUT');
      expect(errorLogs[0].trace).toBeDefined();
      expect(errorLogs[0].context).toBe('ExceptionsFilter');
    });
  });

  describe('Context Propagation', () => {
    it('should include request details in error logs', () => {
      // Arrange
      const validationError = createValidationError('Invalid input', 'INVALID_INPUT', {
        field: 'email',
        constraint: 'isEmail',
      });
      const mockHost = createMockArgumentsHost({
        method: 'POST',
        url: '/api/users',
        body: { email: 'invalid-email' },
        headers: {
          'x-request-id': '123456',
          'user-agent': 'test-agent',
        },
      });

      // Act
      exceptionFilter.catch(validationError, mockHost);

      // Assert
      const logs = loggerMock.getAllLogEntries();
      expect(logs.length).toBeGreaterThan(0);
      
      // The request info should be captured in the log metadata
      const logEntry = logs[0];
      expect(logEntry.metadata).toBeDefined();
      expect(logEntry.metadata.requestInfo).toBeDefined();
      expect(logEntry.metadata.requestInfo.method).toBe('POST');
      expect(logEntry.metadata.requestInfo.url).toBe('/api/users');
    });

    it('should include user information in error logs when available', () => {
      // Arrange
      const businessError = createBusinessError('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS', {
        requiredRole: 'admin',
        userRole: 'user',
      });
      const mockHost = createMockArgumentsHost({
        method: 'POST',
        url: '/api/admin/settings',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          roles: ['user'],
        },
      });

      // Act
      exceptionFilter.catch(businessError, mockHost);

      // Assert
      const logs = loggerMock.getAllLogEntries();
      expect(logs.length).toBeGreaterThan(0);
      
      // The user info should be captured in the log metadata
      const logEntry = logs[0];
      expect(logEntry.metadata).toBeDefined();
      expect(logEntry.metadata.requestInfo).toBeDefined();
      expect(logEntry.metadata.requestInfo.userId).toBe('user-123');
    });

    it('should include journey context in error logs when available', () => {
      // Arrange
      const businessError = createBusinessError('Resource not found', 'RESOURCE_NOT_FOUND', {
        resourceType: 'healthMetric',
        identifier: 'metric-123',
      });
      const mockHost = createMockArgumentsHost({
        method: 'GET',
        url: '/api/health/metrics/metric-123',
        headers: {
          'x-journey-id': 'health',
          'x-correlation-id': 'corr-123',
        },
      });

      // Act
      exceptionFilter.catch(businessError, mockHost);

      // Assert
      const logs = loggerMock.getAllLogEntries();
      expect(logs.length).toBeGreaterThan(0);
      
      // The journey context should be captured in the log metadata
      const logEntry = logs[0];
      expect(logEntry.metadata).toBeDefined();
      expect(logEntry.metadata.requestInfo).toBeDefined();
      expect(logEntry.metadata.requestInfo.journeyId).toBe('health');
    });
  });

  describe('Error Serialization', () => {
    it('should preserve important diagnostic information in logs', () => {
      // Arrange
      const technicalError = createTechnicalError('Database query failed', 'DB_QUERY_ERROR', {
        table: 'users',
        operation: 'findOne',
        query: 'SELECT * FROM users WHERE id = ?',
        parameters: ['user-123'],
        errorCode: 'ER_NO_SUCH_TABLE',
      });
      const mockHost = createMockArgumentsHost({
        method: 'GET',
        url: '/api/users/user-123',
      });

      // Act
      exceptionFilter.catch(technicalError, mockHost);

      // Assert
      const errorLogs = loggerMock.getLogEntries('error');
      expect(errorLogs.length).toBeGreaterThan(0);
      
      // Check that important diagnostic info is preserved
      const logEntry = errorLogs[0];
      expect(logEntry.metadata).toBeDefined();
      expect(logEntry.metadata.error).toBeDefined();
      expect(logEntry.metadata.error.code).toBe('DB_QUERY_ERROR');
      expect(logEntry.metadata.error.details).toBeDefined();
      expect(logEntry.metadata.error.details.table).toBe('users');
      expect(logEntry.metadata.error.details.operation).toBe('findOne');
      expect(logEntry.metadata.error.details.errorCode).toBe('ER_NO_SUCH_TABLE');
    });

    it('should sanitize sensitive data in error logs', () => {
      // Arrange
      const validationError = createValidationError('Invalid input', 'INVALID_INPUT', {
        field: 'password',
        constraint: 'minLength',
        actualValue: 'secret123', // This should be sanitized
        minLength: 8,
      });
      const mockHost = createMockArgumentsHost({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          email: 'user@example.com',
          password: 'secret123', // This should be sanitized
          name: 'Test User',
        },
      });

      // Act
      exceptionFilter.catch(validationError, mockHost);

      // Assert
      const logs = loggerMock.getAllLogEntries();
      expect(logs.length).toBeGreaterThan(0);
      
      // Check that sensitive data is sanitized
      const logEntry = logs[0];
      expect(logEntry.metadata).toBeDefined();
      expect(logEntry.metadata.error).toBeDefined();
      expect(logEntry.metadata.error.details).toBeDefined();
      
      // The actual password value should be sanitized
      expect(logEntry.metadata.error.details.actualValue).not.toBe('secret123');
      
      // The request body should have the password sanitized
      if (logEntry.metadata.requestInfo && logEntry.metadata.requestInfo.body) {
        expect(logEntry.metadata.requestInfo.body.password).not.toBe('secret123');
      }
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should include stack traces in development environment', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const technicalError = createTechnicalError('Unexpected error', 'UNEXPECTED_ERROR');
      const mockHost = createMockArgumentsHost({
        method: 'GET',
        url: '/api/users',
      });

      // Act
      exceptionFilter.catch(technicalError, mockHost);

      // Assert
      const errorLogs = loggerMock.getLogEntries('error');
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].trace).toBeDefined();
      
      // Restore the original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should exclude detailed error information in production environment', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const unknownError = new Error('Some internal implementation detail that should not be exposed');
      const mockHost = createMockArgumentsHost({
        method: 'GET',
        url: '/api/users',
      });

      // Act
      const response = exceptionFilter.catch(unknownError, mockHost);

      // Assert
      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.json().error.message).toBe('An unexpected error occurred');
      expect(response.json().error.details).toBeUndefined();
      
      // Restore the original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should include detailed error information in non-production environments', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const unknownError = new Error('Some internal implementation detail');
      const mockHost = createMockArgumentsHost({
        method: 'GET',
        url: '/api/users',
      });

      // Act
      const response = exceptionFilter.catch(unknownError, mockHost);

      // Assert
      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.json().error.details).toBeDefined();
      expect(response.json().error.details.message).toBe('Some internal implementation detail');
      
      // Restore the original environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('End-to-End Error Logging', () => {
    it('should log errors properly when thrown from an API endpoint', async () => {
      // This test requires a controller that throws errors
      // For simplicity, we'll mock the behavior using supertest
      
      // Clear any existing logs
      loggerMock.clearLogs();
      
      // Make a request that will trigger an error
      await request(app.getHttpServer())
        .get('/api/error-test')
        .expect(500);
      
      // Check that the error was logged
      const errorLogs = loggerMock.getLogEntries('error');
      expect(errorLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Service Error Tracking', () => {
    it('should preserve correlation IDs for cross-service error tracking', () => {
      // Arrange
      const externalError = createExternalError('External service error', 'EXTERNAL_SERVICE_ERROR');
      const mockHost = createMockArgumentsHost({
        method: 'GET',
        url: '/api/external-data',
        headers: {
          'x-correlation-id': 'correlation-123',
          'x-request-id': 'request-123',
          'x-journey-id': 'health',
        },
      });

      // Act
      exceptionFilter.catch(externalError, mockHost);

      // Assert
      const logs = loggerMock.getAllLogEntries();
      expect(logs.length).toBeGreaterThan(0);
      
      // The correlation IDs should be preserved in the logs
      const logEntry = logs[0];
      expect(logEntry.metadata).toBeDefined();
      expect(logEntry.metadata.correlationId).toBe('correlation-123');
      expect(logEntry.metadata.requestId).toBe('request-123');
      expect(logEntry.metadata.requestInfo.journeyId).toBe('health');
    });
  });
});