import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType, JourneyContext } from '../../../src/base';
import {
  ExternalError,
  ExternalApiError,
  IntegrationError,
  ExternalDependencyUnavailableError,
  ExternalAuthenticationError,
  ExternalResponseFormatError,
  ExternalRateLimitError
} from '../../../src/categories/external.errors';

describe('External Error Classes', () => {
  describe('ExternalError', () => {
    it('should extend BaseError with ErrorType.EXTERNAL', () => {
      // Arrange
      const message = 'External system error';
      const code = 'TEST_EXTERNAL_ERROR';
      const details = { test: 'details' };
      const context = { journey: JourneyContext.HEALTH };
      const suggestion = 'Try again later';
      const cause = new Error('Original error');

      // Act
      const error = new ExternalError(
        message,
        code,
        details,
        context,
        suggestion,
        cause
      );

      // Assert
      expect(error).toBeInstanceOf(BaseError);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.details).toEqual(details);
      expect(error.context).toEqual(context);
      expect(error.suggestion).toBe(suggestion);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ExternalError');
    });

    it('should map to HTTP 502 Bad Gateway status code', () => {
      // Arrange
      const error = new ExternalError('External error', 'TEST_CODE');

      // Act
      const statusCode = error.getHttpStatusCode();

      // Assert
      expect(statusCode).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should serialize to JSON with all fields', () => {
      // Arrange
      const message = 'External system error';
      const code = 'TEST_EXTERNAL_ERROR';
      const details = { test: 'details' };
      const context = { 
        journey: JourneyContext.HEALTH,
        requestId: 'test-request-id',
        timestamp: new Date('2023-01-01T00:00:00Z')
      };
      const suggestion = 'Try again later';

      // Act
      const error = new ExternalError(message, code, details, context, suggestion);
      const serialized = error.toJSON();

      // Assert
      expect(serialized).toEqual({
        error: {
          type: ErrorType.EXTERNAL,
          code,
          message,
          journey: JourneyContext.HEALTH,
          requestId: 'test-request-id',
          timestamp: '2023-01-01T00:00:00.000Z',
          details,
          suggestion
        }
      });
    });
  });

  describe('ExternalApiError', () => {
    it('should create error with service name and endpoint', () => {
      // Arrange
      const serviceName = 'TestAPI';
      const endpoint = '/api/test';
      const statusCode = 500;
      const responseBody = { error: 'Internal server error' };
      const context = { journey: JourneyContext.CARE };
      const cause = new Error('Network error');

      // Act
      const error = new ExternalApiError(
        serviceName,
        endpoint,
        statusCode,
        responseBody,
        context,
        cause
      );

      // Assert
      expect(error).toBeInstanceOf(ExternalError);
      expect(error.message).toBe(`External API ${serviceName} at ${endpoint} returned status ${statusCode}`);
      expect(error.code).toBe('EXTERNAL_API_ERROR');
      expect(error.details).toEqual({ serviceName, endpoint, statusCode, responseBody });
      expect(error.context).toEqual(context);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ExternalApiError');
    });

    it('should handle missing status code', () => {
      // Arrange
      const serviceName = 'TestAPI';
      const endpoint = '/api/test';

      // Act
      const error = new ExternalApiError(serviceName, endpoint);

      // Assert
      expect(error.message).toBe(`External API ${serviceName} at ${endpoint} failed`);
      expect(error.details.statusCode).toBeUndefined();
    });

    it('should include a helpful suggestion', () => {
      // Arrange & Act
      const error = new ExternalApiError('TestAPI', '/api/test');

      // Assert
      expect(error.suggestion).toBe('Please try again later or contact support if the problem persists');
    });
  });

  describe('IntegrationError', () => {
    it('should create error with integration name and custom message', () => {
      // Arrange
      const integrationName = 'FHIR';
      const message = 'Failed to synchronize patient data';
      const details = { patientId: '12345' };
      const context = { journey: JourneyContext.HEALTH };
      const cause = new Error('Integration error');

      // Act
      const error = new IntegrationError(
        integrationName,
        message,
        details,
        context,
        cause
      );

      // Assert
      expect(error).toBeInstanceOf(ExternalError);
      expect(error.message).toBe(message);
      expect(error.code).toBe('INTEGRATION_ERROR');
      expect(error.details).toEqual({ integrationName, patientId: '12345' });
      expect(error.context).toEqual(context);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('IntegrationError');
    });

    it('should include a helpful suggestion', () => {
      // Arrange & Act
      const error = new IntegrationError('FHIR', 'Integration failed');

      // Assert
      expect(error.suggestion).toBe('Please check the integration configuration and try again');
    });
  });

  describe('ExternalDependencyUnavailableError', () => {
    it('should create error with dependency name', () => {
      // Arrange
      const dependencyName = 'Payment Gateway';
      const details = { attemptCount: 3 };
      const context = { journey: JourneyContext.PLAN };

      // Act
      const error = new ExternalDependencyUnavailableError(
        dependencyName,
        details,
        context
      );

      // Assert
      expect(error).toBeInstanceOf(ExternalError);
      expect(error.message).toBe(`External dependency '${dependencyName}' is currently unavailable`);
      expect(error.code).toBe('EXTERNAL_DEPENDENCY_UNAVAILABLE');
      expect(error.details).toEqual({ dependencyName, attemptCount: 3 });
      expect(error.context).toEqual(context);
      expect(error.name).toBe('ExternalDependencyUnavailableError');
    });

    it('should include a helpful suggestion', () => {
      // Arrange & Act
      const error = new ExternalDependencyUnavailableError('Payment Gateway');

      // Assert
      expect(error.suggestion).toBe('Please try again later');
    });

    it('should map to HTTP 502 Bad Gateway status code', () => {
      // Arrange
      const error = new ExternalDependencyUnavailableError('Payment Gateway');

      // Act
      const statusCode = error.getHttpStatusCode();

      // Assert
      expect(statusCode).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('ExternalAuthenticationError', () => {
    it('should create error with service name', () => {
      // Arrange
      const serviceName = 'OAuth Provider';
      const details = { errorCode: 'invalid_token' };
      const context = { journey: JourneyContext.AUTH };

      // Act
      const error = new ExternalAuthenticationError(
        serviceName,
        details,
        context
      );

      // Assert
      expect(error).toBeInstanceOf(ExternalError);
      expect(error.message).toBe(`Authentication failed for external service '${serviceName}'`);
      expect(error.code).toBe('EXTERNAL_AUTHENTICATION_ERROR');
      expect(error.details).toEqual({ serviceName, errorCode: 'invalid_token' });
      expect(error.context).toEqual(context);
      expect(error.name).toBe('ExternalAuthenticationError');
    });

    it('should include a helpful suggestion', () => {
      // Arrange & Act
      const error = new ExternalAuthenticationError('OAuth Provider');

      // Assert
      expect(error.suggestion).toBe('Please check the authentication credentials for the external service');
    });
  });

  describe('ExternalResponseFormatError', () => {
    it('should create error with service name and format details', () => {
      // Arrange
      const serviceName = 'Weather API';
      const expectedFormat = 'JSON with temperature field';
      const actualResponse = { humidity: 80 };
      const context = { journey: JourneyContext.HEALTH };

      // Act
      const error = new ExternalResponseFormatError(
        serviceName,
        expectedFormat,
        actualResponse,
        context
      );

      // Assert
      expect(error).toBeInstanceOf(ExternalError);
      expect(error.message).toBe(`External service '${serviceName}' returned unexpected response format`);
      expect(error.code).toBe('EXTERNAL_RESPONSE_FORMAT_ERROR');
      expect(error.details).toEqual({ serviceName, expectedFormat, actualResponse });
      expect(error.context).toEqual(context);
      expect(error.name).toBe('ExternalResponseFormatError');
    });

    it('should include a helpful suggestion', () => {
      // Arrange & Act
      const error = new ExternalResponseFormatError('Weather API', 'JSON', {});

      // Assert
      expect(error.suggestion).toBe('Please check the integration with the external service');
    });
  });

  describe('ExternalRateLimitError', () => {
    it('should create error with service name and retry information', () => {
      // Arrange
      const serviceName = 'Search API';
      const retryAfterSeconds = 60;
      const context = { journey: JourneyContext.CARE };

      // Act
      const error = new ExternalRateLimitError(
        serviceName,
        retryAfterSeconds,
        context
      );

      // Assert
      expect(error).toBeInstanceOf(ExternalError);
      expect(error.message).toBe(`Rate limit exceeded for external service '${serviceName}'`);
      expect(error.code).toBe('EXTERNAL_RATE_LIMIT_ERROR');
      expect(error.details).toEqual({ serviceName, retryAfterSeconds });
      expect(error.context).toEqual(context);
      expect(error.name).toBe('ExternalRateLimitError');
    });

    it('should include retry-after information in suggestion when available', () => {
      // Arrange & Act
      const error = new ExternalRateLimitError('Search API', 30);

      // Assert
      expect(error.suggestion).toBe('Please retry after 30 seconds');
    });

    it('should provide generic retry suggestion when retry-after is not available', () => {
      // Arrange & Act
      const error = new ExternalRateLimitError('Search API');

      // Assert
      expect(error.suggestion).toBe('Please retry later');
    });

    it('should map to HTTP 502 Bad Gateway status code', () => {
      // Arrange
      const error = new ExternalRateLimitError('Search API');

      // Act
      const statusCode = error.getHttpStatusCode();

      // Assert
      expect(statusCode).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('Error serialization and HTTP status codes', () => {
    it('should convert all external errors to HTTP exceptions with correct status codes', () => {
      // Arrange
      const errors = [
        new ExternalError('Generic external error', 'TEST_CODE'),
        new ExternalApiError('TestAPI', '/api/test'),
        new IntegrationError('FHIR', 'Integration failed'),
        new ExternalDependencyUnavailableError('Payment Gateway'),
        new ExternalAuthenticationError('OAuth Provider'),
        new ExternalResponseFormatError('Weather API', 'JSON', {}),
        new ExternalRateLimitError('Search API')
      ];

      // Act & Assert
      errors.forEach(error => {
        const httpException = error.toHttpException();
        expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
        
        const response = httpException.getResponse() as Record<string, any>;
        expect(response).toHaveProperty('error');
        expect(response.error).toHaveProperty('type', ErrorType.EXTERNAL);
        expect(response.error).toHaveProperty('code');
        expect(response.error).toHaveProperty('message');
      });
    });

    it('should include journey context in serialized errors when provided', () => {
      // Arrange
      const context = { 
        journey: JourneyContext.HEALTH,
        userId: 'user-123',
        requestId: 'req-456',
        traceId: 'trace-789'
      };
      
      const error = new ExternalApiError(
        'HealthAPI',
        '/api/health',
        500,
        { error: 'Server error' },
        context
      );

      // Act
      const serialized = error.toJSON();

      // Assert
      expect(serialized.error).toHaveProperty('journey', JourneyContext.HEALTH);
      expect(serialized.error).toHaveProperty('requestId', 'req-456');
    });

    it('should generate appropriate log entries for external errors', () => {
      // Arrange
      const cause = new Error('Network error');
      const error = new ExternalApiError(
        'TestAPI',
        '/api/test',
        500,
        { error: 'Server error' },
        { journey: JourneyContext.CARE },
        cause
      );

      // Act
      const logEntry = error.toLogEntry();

      // Assert
      expect(logEntry).toHaveProperty('error');
      expect(logEntry.error).toHaveProperty('name', 'ExternalApiError');
      expect(logEntry.error).toHaveProperty('type', ErrorType.EXTERNAL);
      expect(logEntry.error).toHaveProperty('code', 'EXTERNAL_API_ERROR');
      expect(logEntry.error).toHaveProperty('stack');
      expect(logEntry.error).toHaveProperty('cause');
      expect(logEntry.error.cause).toHaveProperty('name', 'Error');
      expect(logEntry.error.cause).toHaveProperty('message', 'Network error');
      expect(logEntry).toHaveProperty('context');
      expect(logEntry.context).toHaveProperty('journey', JourneyContext.CARE);
      expect(logEntry).toHaveProperty('httpStatus', HttpStatus.BAD_GATEWAY);
    });
  });
});