import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType, JourneyContext } from '../../../src/base';
import {
  TechnicalError,
  InternalServerError,
  DatabaseError,
  ConfigurationError,
  TimeoutError,
  DataProcessingError,
  ServiceUnavailableError
} from '../../../src/categories/technical.errors';

describe('Technical Errors', () => {
  describe('TechnicalError', () => {
    it('should extend BaseError', () => {
      const error = new TechnicalError('Test error', 'TEST_ERROR');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have ErrorType.TECHNICAL', () => {
      const error = new TechnicalError('Test error', 'TEST_ERROR');
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should set the correct error code', () => {
      const error = new TechnicalError('Test error', 'TEST_ERROR');
      expect(error.code).toBe('TEST_ERROR');
    });

    it('should set the correct error message', () => {
      const error = new TechnicalError('Test error', 'TEST_ERROR');
      expect(error.message).toBe('Test error');
    });

    it('should set the correct error name', () => {
      const error = new TechnicalError('Test error', 'TEST_ERROR');
      expect(error.name).toBe('TechnicalError');
    });

    it('should include details when provided', () => {
      const details = { key: 'value' };
      const error = new TechnicalError('Test error', 'TEST_ERROR', details);
      expect(error.details).toEqual(details);
    });

    it('should include context when provided', () => {
      const context = { journey: JourneyContext.HEALTH, userId: '123' };
      const error = new TechnicalError('Test error', 'TEST_ERROR', undefined, context);
      expect(error.context).toEqual(context);
    });

    it('should include suggestion when provided', () => {
      const suggestion = 'Try this instead';
      const error = new TechnicalError('Test error', 'TEST_ERROR', undefined, {}, suggestion);
      expect(error.suggestion).toBe(suggestion);
    });

    it('should include cause when provided', () => {
      const cause = new Error('Original error');
      const error = new TechnicalError('Test error', 'TEST_ERROR', undefined, {}, undefined, cause);
      expect(error.cause).toBe(cause);
    });

    it('should serialize to JSON correctly', () => {
      const error = new TechnicalError(
        'Test error',
        'TEST_ERROR',
        { key: 'value' },
        { journey: JourneyContext.HEALTH, requestId: '123' },
        'Try this instead'
      );
      
      const serialized = error.toJSON();
      expect(serialized).toEqual({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'TEST_ERROR',
          message: 'Test error',
          journey: JourneyContext.HEALTH,
          requestId: '123',
          timestamp: expect.any(String),
          details: { key: 'value' },
          suggestion: 'Try this instead'
        }
      });
    });

    it('should map to HTTP 500 status code', () => {
      const error = new TechnicalError('Test error', 'TEST_ERROR');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('InternalServerError', () => {
    it('should extend TechnicalError', () => {
      const error = new InternalServerError();
      expect(error).toBeInstanceOf(TechnicalError);
    });

    it('should have default message when not provided', () => {
      const error = new InternalServerError();
      expect(error.message).toBe('An internal server error occurred');
    });

    it('should use custom message when provided', () => {
      const error = new InternalServerError('Custom error message');
      expect(error.message).toBe('Custom error message');
    });

    it('should have correct error code', () => {
      const error = new InternalServerError();
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should include details when provided', () => {
      const details = { key: 'value' };
      const error = new InternalServerError('Custom message', details);
      expect(error.details).toEqual(details);
    });

    it('should include context when provided', () => {
      const context = { journey: JourneyContext.HEALTH };
      const error = new InternalServerError('Custom message', undefined, context);
      expect(error.context).toEqual(context);
    });

    it('should include cause when provided', () => {
      const cause = new Error('Original error');
      const error = new InternalServerError('Custom message', undefined, {}, cause);
      expect(error.cause).toBe(cause);
    });

    it('should include default suggestion', () => {
      const error = new InternalServerError();
      expect(error.suggestion).toBe('Please try again later or contact support if the problem persists');
    });

    it('should map to HTTP 500 status code', () => {
      const error = new InternalServerError();
      expect(error.getHttpStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('DatabaseError', () => {
    it('should extend TechnicalError', () => {
      const error = new DatabaseError('Database connection failed', 'connect');
      expect(error).toBeInstanceOf(TechnicalError);
    });

    it('should set the correct error message', () => {
      const error = new DatabaseError('Database connection failed', 'connect');
      expect(error.message).toBe('Database connection failed');
    });

    it('should have correct error code', () => {
      const error = new DatabaseError('Database connection failed', 'connect');
      expect(error.code).toBe('DATABASE_ERROR');
    });

    it('should include operation in details', () => {
      const error = new DatabaseError('Database connection failed', 'connect');
      expect(error.details).toHaveProperty('operation', 'connect');
    });

    it('should merge additional details with operation', () => {
      const details = { table: 'users', query: 'SELECT * FROM users' };
      const error = new DatabaseError('Database query failed', 'query', details);
      expect(error.details).toEqual({
        operation: 'query',
        table: 'users',
        query: 'SELECT * FROM users'
      });
    });

    it('should include context when provided', () => {
      const context = { journey: JourneyContext.HEALTH };
      const error = new DatabaseError('Database query failed', 'query', undefined, context);
      expect(error.context).toEqual(context);
    });

    it('should include cause when provided', () => {
      const cause = new Error('Original database error');
      const error = new DatabaseError('Database query failed', 'query', undefined, {}, cause);
      expect(error.cause).toBe(cause);
    });

    it('should include default suggestion', () => {
      const error = new DatabaseError('Database query failed', 'query');
      expect(error.suggestion).toBe('Please try again later or contact support if the problem persists');
    });

    it('should map to HTTP 500 status code', () => {
      const error = new DatabaseError('Database query failed', 'query');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should serialize to JSON with operation details', () => {
      const error = new DatabaseError(
        'Database query failed',
        'query',
        { table: 'users' },
        { journey: JourneyContext.HEALTH }
      );
      
      const serialized = error.toJSON();
      expect(serialized.error.details).toEqual({
        operation: 'query',
        table: 'users'
      });
    });
  });

  describe('ConfigurationError', () => {
    it('should extend TechnicalError', () => {
      const error = new ConfigurationError('Missing required config', 'DATABASE_URL');
      expect(error).toBeInstanceOf(TechnicalError);
    });

    it('should set the correct error message', () => {
      const error = new ConfigurationError('Missing required config', 'DATABASE_URL');
      expect(error.message).toBe('Missing required config');
    });

    it('should have correct error code', () => {
      const error = new ConfigurationError('Missing required config', 'DATABASE_URL');
      expect(error.code).toBe('CONFIGURATION_ERROR');
    });

    it('should include configKey in details', () => {
      const error = new ConfigurationError('Missing required config', 'DATABASE_URL');
      expect(error.details).toHaveProperty('configKey', 'DATABASE_URL');
    });

    it('should merge additional details with configKey', () => {
      const details = { source: '.env', required: true };
      const error = new ConfigurationError('Missing required config', 'DATABASE_URL', details);
      expect(error.details).toEqual({
        configKey: 'DATABASE_URL',
        source: '.env',
        required: true
      });
    });

    it('should include context when provided', () => {
      const context = { journey: JourneyContext.SYSTEM };
      const error = new ConfigurationError('Missing required config', 'DATABASE_URL', undefined, context);
      expect(error.context).toEqual(context);
    });

    it('should include default suggestion', () => {
      const error = new ConfigurationError('Missing required config', 'DATABASE_URL');
      expect(error.suggestion).toBe('Please check the application configuration');
    });

    it('should map to HTTP 500 status code', () => {
      const error = new ConfigurationError('Missing required config', 'DATABASE_URL');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should serialize to JSON with configKey details', () => {
      const error = new ConfigurationError(
        'Missing required config',
        'DATABASE_URL',
        { source: '.env' },
        { journey: JourneyContext.SYSTEM }
      );
      
      const serialized = error.toJSON();
      expect(serialized.error.details).toEqual({
        configKey: 'DATABASE_URL',
        source: '.env'
      });
    });
  });

  describe('TimeoutError', () => {
    it('should extend TechnicalError', () => {
      const error = new TimeoutError('database query', 5000);
      expect(error).toBeInstanceOf(TechnicalError);
    });

    it('should generate appropriate error message with operation and timeout', () => {
      const error = new TimeoutError('database query', 5000);
      expect(error.message).toBe("Operation 'database query' timed out after 5000ms");
    });

    it('should have correct error code', () => {
      const error = new TimeoutError('database query', 5000);
      expect(error.code).toBe('TIMEOUT');
    });

    it('should include operation and timeoutMs in details', () => {
      const error = new TimeoutError('database query', 5000);
      expect(error.details).toEqual({
        operation: 'database query',
        timeoutMs: 5000
      });
    });

    it('should include context when provided', () => {
      const context = { journey: JourneyContext.HEALTH };
      const error = new TimeoutError('database query', 5000, context);
      expect(error.context).toEqual(context);
    });

    it('should include default suggestion', () => {
      const error = new TimeoutError('database query', 5000);
      expect(error.suggestion).toBe('Please try again later or with a longer timeout');
    });

    it('should map to HTTP 500 status code', () => {
      const error = new TimeoutError('database query', 5000);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should serialize to JSON with timeout details', () => {
      const error = new TimeoutError(
        'database query',
        5000,
        { journey: JourneyContext.HEALTH }
      );
      
      const serialized = error.toJSON();
      expect(serialized.error.details).toEqual({
        operation: 'database query',
        timeoutMs: 5000
      });
    });
  });

  describe('DataProcessingError', () => {
    it('should extend TechnicalError', () => {
      const error = new DataProcessingError('Failed to process data');
      expect(error).toBeInstanceOf(TechnicalError);
    });

    it('should set the correct error message', () => {
      const error = new DataProcessingError('Failed to process data');
      expect(error.message).toBe('Failed to process data');
    });

    it('should have correct error code', () => {
      const error = new DataProcessingError('Failed to process data');
      expect(error.code).toBe('DATA_PROCESSING_ERROR');
    });

    it('should include details when provided', () => {
      const details = { format: 'JSON', size: '2MB' };
      const error = new DataProcessingError('Failed to process data', details);
      expect(error.details).toEqual(details);
    });

    it('should include context when provided', () => {
      const context = { journey: JourneyContext.HEALTH };
      const error = new DataProcessingError('Failed to process data', undefined, context);
      expect(error.context).toEqual(context);
    });

    it('should include cause when provided', () => {
      const cause = new Error('JSON parse error');
      const error = new DataProcessingError('Failed to process data', undefined, {}, cause);
      expect(error.cause).toBe(cause);
    });

    it('should include default suggestion', () => {
      const error = new DataProcessingError('Failed to process data');
      expect(error.suggestion).toBe('Please check the input data format and try again');
    });

    it('should map to HTTP 500 status code', () => {
      const error = new DataProcessingError('Failed to process data');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should extend TechnicalError', () => {
      const error = new ServiceUnavailableError('auth-service');
      expect(error).toBeInstanceOf(TechnicalError);
    });

    it('should generate appropriate error message with service name', () => {
      const error = new ServiceUnavailableError('auth-service');
      expect(error.message).toBe("Service 'auth-service' is currently unavailable");
    });

    it('should have correct error code', () => {
      const error = new ServiceUnavailableError('auth-service');
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('should include serviceName in details', () => {
      const error = new ServiceUnavailableError('auth-service');
      expect(error.details).toHaveProperty('serviceName', 'auth-service');
    });

    it('should merge additional details with serviceName', () => {
      const details = { reason: 'maintenance', estimatedResolution: '10 minutes' };
      const error = new ServiceUnavailableError('auth-service', details);
      expect(error.details).toEqual({
        serviceName: 'auth-service',
        reason: 'maintenance',
        estimatedResolution: '10 minutes'
      });
    });

    it('should include context when provided', () => {
      const context = { journey: JourneyContext.AUTH };
      const error = new ServiceUnavailableError('auth-service', undefined, context);
      expect(error.context).toEqual(context);
    });

    it('should include default suggestion', () => {
      const error = new ServiceUnavailableError('auth-service');
      expect(error.suggestion).toBe('Please try again later');
    });

    it('should map to HTTP 500 status code', () => {
      // ServiceUnavailableError extends TechnicalError which uses ErrorType.TECHNICAL
      // This maps to HttpStatus.INTERNAL_SERVER_ERROR (500) in the BaseError class
      const error = new ServiceUnavailableError('auth-service');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should serialize to JSON with service details', () => {
      const error = new ServiceUnavailableError(
        'auth-service',
        { reason: 'maintenance' },
        { journey: JourneyContext.AUTH }
      );
      
      const serialized = error.toJSON();
      expect(serialized.error.details).toEqual({
        serviceName: 'auth-service',
        reason: 'maintenance'
      });
    });
  });

  // Test stack trace capture in non-production environments
  describe('Stack trace capture', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    
    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });
    
    it('should capture stack trace in development environment', () => {
      process.env.NODE_ENV = 'development';
      const error = new TechnicalError('Test error', 'TEST_ERROR');
      expect(error.stack).toBeDefined();
      expect(error.stack?.includes('technical.errors.spec.ts')).toBeTruthy();
    });
    
    it('should capture stack trace in test environment', () => {
      process.env.NODE_ENV = 'test';
      const error = new TechnicalError('Test error', 'TEST_ERROR');
      expect(error.stack).toBeDefined();
      expect(error.stack?.includes('technical.errors.spec.ts')).toBeTruthy();
    });
    
    it('should include stack trace in log entry', () => {
      const error = new TechnicalError('Test error', 'TEST_ERROR');
      const logEntry = error.toLogEntry();
      expect(logEntry.error.stack).toBeDefined();
    });
  });
});