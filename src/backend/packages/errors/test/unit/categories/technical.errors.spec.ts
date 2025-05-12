import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';

// Import the BaseError class and related types
import { BaseError, ErrorType } from '../../../src/base';
import { HTTP_STATUS_MAPPINGS } from '../../../src/constants';

// Import the technical error classes
import {
  InternalServerError,
  DatabaseError,
  ConfigurationError,
  TimeoutError,
  DataProcessingError,
  ServiceUnavailableError
} from '../../../src/categories/technical.errors';

/**
 * Test suite for technical error classes
 * Verifies that all technical error classes correctly extend BaseError,
 * provide appropriate error messages, HTTP status codes, and context details
 */
describe('Technical Error Classes', () => {
  // Mock environment for testing
  const originalNodeEnv = process.env.NODE_ENV;
  
  beforeEach(() => {
    // Reset NODE_ENV before each test
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('InternalServerError', () => {
    it('should create an InternalServerError with default values', () => {
      const error = new InternalServerError();

      // Verify basic properties
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(error.message).toBe('An unexpected internal server error occurred');
    });

    it('should create an InternalServerError with custom message and code', () => {
      const customMessage = 'Custom internal error message';
      const customCode = 'CUSTOM_INTERNAL_ERROR';
      const error = new InternalServerError(customMessage, customCode);

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe(customCode);
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should convert to HttpException with 500 status code', () => {
      const error = new InternalServerError();
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });

    it('should include stack trace in non-production environments', () => {
      // Set NODE_ENV to development
      process.env.NODE_ENV = 'development';
      
      const error = new InternalServerError();
      const json = error.toJSON({ includeStack: true });

      expect(json.error.stack).toBeDefined();
      expect(typeof json.error.stack).toBe('string');
    });

    it('should not include stack trace in production environment', () => {
      // Set NODE_ENV to production
      process.env.NODE_ENV = 'production';
      
      const error = new InternalServerError();
      const json = error.toJSON({ includeStack: true });

      // Even with includeStack true, production should not include stack
      expect(json.error.stack).toBeUndefined();
    });
  });

  describe('DatabaseError', () => {
    it('should create a DatabaseError with default values', () => {
      const error = new DatabaseError();

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.message).toBe('A database operation failed');
    });

    it('should create a DatabaseError with custom message, code and operation details', () => {
      const customMessage = 'Failed to query user data';
      const customCode = 'USER_DB_ERROR';
      const operation = 'SELECT * FROM users WHERE id = ?';
      const error = new DatabaseError(customMessage, customCode, { operation });

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe(customCode);
      expect(error.details).toEqual({ operation });
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should include database context in serialized output', () => {
      const dbContext = {
        operation: 'INSERT INTO health_metrics',
        table: 'health_metrics',
        errorCode: 'ER_DUP_ENTRY'
      };
      
      const error = new DatabaseError('Database error occurred', 'DB_ERROR', dbContext);
      const json = error.toJSON();

      expect(json.error.details).toEqual(dbContext);
    });

    it('should convert to HttpException with 500 status code', () => {
      const error = new DatabaseError();
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('ConfigurationError', () => {
    it('should create a ConfigurationError with default values', () => {
      const error = new ConfigurationError();

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.message).toBe('Application configuration error');
    });

    it('should create a ConfigurationError with custom message, code and configuration details', () => {
      const customMessage = 'Missing required configuration';
      const customCode = 'MISSING_CONFIG';
      const configDetails = { 
        missingKey: 'DATABASE_URL',
        component: 'PrismaService'
      };
      
      const error = new ConfigurationError(customMessage, customCode, configDetails);

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe(customCode);
      expect(error.details).toEqual(configDetails);
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should include configuration context in serialized output', () => {
      const configContext = {
        missingKey: 'API_KEY',
        component: 'ExternalApiService',
        environment: 'development'
      };
      
      const error = new ConfigurationError(
        'Missing required API configuration', 
        'API_CONFIG_ERROR', 
        configContext
      );
      
      const json = error.toJSON();

      expect(json.error.details).toEqual(configContext);
    });

    it('should convert to HttpException with 500 status code', () => {
      const error = new ConfigurationError();
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('TimeoutError', () => {
    it('should create a TimeoutError with default values', () => {
      const error = new TimeoutError();

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.message).toBe('Operation timed out');
    });

    it('should create a TimeoutError with custom message, code and timeout details', () => {
      const customMessage = 'Database query timed out';
      const customCode = 'DB_TIMEOUT';
      const timeoutDetails = { 
        operationName: 'getUserProfile',
        durationMs: 5000,
        threshold: 3000
      };
      
      const error = new TimeoutError(customMessage, customCode, timeoutDetails);

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe(customCode);
      expect(error.details).toEqual(timeoutDetails);
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should include timeout duration information in serialized output', () => {
      const timeoutContext = {
        operationName: 'fetchHealthMetrics',
        durationMs: 10000,
        threshold: 5000,
        resource: 'health-service'
      };
      
      const error = new TimeoutError(
        'Health metrics query timed out', 
        'HEALTH_TIMEOUT', 
        timeoutContext
      );
      
      const json = error.toJSON();

      expect(json.error.details).toEqual(timeoutContext);
      expect(json.error.details.durationMs).toBe(10000);
      expect(json.error.details.threshold).toBe(5000);
    });

    it('should convert to HttpException with 500 status code', () => {
      const error = new TimeoutError();
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('DataProcessingError', () => {
    it('should create a DataProcessingError with default values', () => {
      const error = new DataProcessingError();

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(DataProcessingError);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('DATA_PROCESSING_ERROR');
      expect(error.message).toBe('Error processing data');
    });

    it('should create a DataProcessingError with custom message, code and processing details', () => {
      const customMessage = 'Failed to process health metrics';
      const customCode = 'HEALTH_PROCESSING_ERROR';
      const processingDetails = { 
        dataType: 'healthMetrics',
        operation: 'aggregation',
        recordCount: 1500
      };
      
      const error = new DataProcessingError(customMessage, customCode, processingDetails);

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe(customCode);
      expect(error.details).toEqual(processingDetails);
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should include processing context in serialized output', () => {
      const processingContext = {
        dataType: 'claims',
        operation: 'validation',
        recordCount: 250,
        failedRecords: 15
      };
      
      const error = new DataProcessingError(
        'Failed to process insurance claims', 
        'CLAIMS_PROCESSING_ERROR', 
        processingContext
      );
      
      const json = error.toJSON();

      expect(json.error.details).toEqual(processingContext);
      expect(json.error.details.recordCount).toBe(250);
      expect(json.error.details.failedRecords).toBe(15);
    });

    it('should convert to HttpException with 500 status code', () => {
      const error = new DataProcessingError();
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create a ServiceUnavailableError with default values', () => {
      const error = new ServiceUnavailableError();

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ServiceUnavailableError);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.message).toBe('Service is currently unavailable');
    });

    it('should create a ServiceUnavailableError with custom message, code and service details', () => {
      const customMessage = 'Health service is temporarily unavailable';
      const customCode = 'HEALTH_SERVICE_UNAVAILABLE';
      const serviceDetails = { 
        serviceName: 'health-service',
        reason: 'maintenance',
        estimatedResolutionTime: '2023-05-01T15:00:00Z'
      };
      
      const error = new ServiceUnavailableError(customMessage, customCode, serviceDetails);

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe(customCode);
      expect(error.details).toEqual(serviceDetails);
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should include service unavailability context in serialized output', () => {
      const unavailabilityContext = {
        serviceName: 'care-service',
        reason: 'overloaded',
        retryAfterSeconds: 30,
        currentLoad: 95
      };
      
      const error = new ServiceUnavailableError(
        'Care service is temporarily overloaded', 
        'CARE_SERVICE_OVERLOADED', 
        unavailabilityContext
      );
      
      const json = error.toJSON();

      expect(json.error.details).toEqual(unavailabilityContext);
      expect(json.error.details.retryAfterSeconds).toBe(30);
    });

    it('should convert to HttpException with 503 status code', () => {
      const error = new ServiceUnavailableError();
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it('should include retry-after header when retryAfterSeconds is provided', () => {
      const unavailabilityContext = {
        serviceName: 'care-service',
        reason: 'overloaded',
        retryAfterSeconds: 60
      };
      
      const error = new ServiceUnavailableError(
        'Service temporarily unavailable', 
        'SERVICE_OVERLOADED', 
        unavailabilityContext
      );
      
      // Custom status code with retry-after header
      const httpException = error.toHttpException(HttpStatus.SERVICE_UNAVAILABLE, {
        'Retry-After': String(unavailabilityContext.retryAfterSeconds)
      });
      
      expect(httpException.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      
      // Get the response object and check for headers
      const response = httpException.getResponse() as any;
      expect(response).toBeDefined();
    });
  });

  describe('Error Inheritance and Polymorphism', () => {
    it('should allow treating all technical errors as BaseError', () => {
      const errors: BaseError[] = [
        new InternalServerError(),
        new DatabaseError(),
        new ConfigurationError(),
        new TimeoutError(),
        new DataProcessingError(),
        new ServiceUnavailableError()
      ];

      // All errors should be instances of BaseError
      errors.forEach(error => {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.toJSON()).toHaveProperty('error');
      });
    });

    it('should maintain specific error types when used polymorphically', () => {
      const errors: BaseError[] = [
        new InternalServerError('Internal error'),
        new DatabaseError('Database error'),
        new ConfigurationError('Config error'),
        new TimeoutError('Timeout error'),
        new DataProcessingError('Processing error'),
        new ServiceUnavailableError('Unavailable error')
      ];

      // Each error should maintain its specific type
      expect(errors[0]).toBeInstanceOf(InternalServerError);
      expect(errors[1]).toBeInstanceOf(DatabaseError);
      expect(errors[2]).toBeInstanceOf(ConfigurationError);
      expect(errors[3]).toBeInstanceOf(TimeoutError);
      expect(errors[4]).toBeInstanceOf(DataProcessingError);
      expect(errors[5]).toBeInstanceOf(ServiceUnavailableError);

      // Messages should be preserved
      expect(errors[0].message).toBe('Internal error');
      expect(errors[1].message).toBe('Database error');
      expect(errors[2].message).toBe('Config error');
      expect(errors[3].message).toBe('Timeout error');
      expect(errors[4].message).toBe('Processing error');
      expect(errors[5].message).toBe('Unavailable error');
    });
  });

  describe('Error Context Propagation', () => {
    it('should propagate context from cause error', () => {
      // Create a cause error with context
      const causeError = new DatabaseError(
        'Database connection failed',
        'DB_CONNECTION_ERROR',
        { database: 'health_metrics', operation: 'connect' }
      );

      // Create a higher-level error with the cause
      const error = new InternalServerError(
        'Failed to retrieve health data',
        'HEALTH_DATA_ERROR',
        undefined,  // No details
        causeError  // Cause error
      );

      // Context should be propagated from cause
      expect(error.cause).toBe(causeError);
      
      // Root cause should be accessible
      const rootCause = error.getRootCause();
      expect(rootCause).toBe(causeError);
      
      // Error chain should be formattable
      const errorChain = error.formatErrorChain();
      expect(errorChain).toContain('Failed to retrieve health data');
      expect(errorChain).toContain('Database connection failed');
    });

    it('should create nested error chains with multiple technical errors', () => {
      // Create a chain of technical errors
      const level3Error = new TimeoutError(
        'Database query timed out',
        'DB_QUERY_TIMEOUT',
        { operationName: 'getUserHealth', durationMs: 5000 }
      );
      
      const level2Error = new DatabaseError(
        'Failed to execute database query',
        'DB_QUERY_ERROR',
        { operation: 'SELECT * FROM health_metrics' },
        level3Error // Cause
      );
      
      const level1Error = new DataProcessingError(
        'Failed to process health data',
        'HEALTH_PROCESSING_ERROR',
        { dataType: 'healthMetrics', userId: 'user123' },
        level2Error // Cause
      );

      // Verify the error chain
      expect(level1Error.cause).toBe(level2Error);
      expect(level2Error.cause).toBe(level3Error);
      
      // Root cause should be the timeout error
      const rootCause = level1Error.getRootCause();
      expect(rootCause).toBe(level3Error);
      expect(rootCause).toBeInstanceOf(TimeoutError);
      
      // Error chain should contain all messages
      const errorChain = level1Error.formatErrorChain();
      expect(errorChain).toContain('Failed to process health data');
      expect(errorChain).toContain('Failed to execute database query');
      expect(errorChain).toContain('Database query timed out');
    });
  });
});