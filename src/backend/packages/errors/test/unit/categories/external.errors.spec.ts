/**
 * @file external.errors.spec.ts
 * @description Unit tests for external system integration error classes
 */

import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType, JourneyType } from '../../../src/base';
import {
  ExternalError,
  ExternalApiError,
  IntegrationError,
  ExternalDependencyUnavailableError,
  ExternalAuthenticationError,
  ExternalResponseFormatError,
  ExternalRateLimitError,
  ExternalTimeoutError
} from '../../../src/categories/external.errors';
import { COMMON_ERROR_CODES, RETRY_CONFIG } from '../../../src/constants';

describe('External Error Classes', () => {
  describe('ExternalApiError', () => {
    it('should create an instance with default values', () => {
      const message = 'External API error';
      const error = new ExternalApiError(message);

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ExternalError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(COMMON_ERROR_CODES.EXTERNAL_SERVICE_ERROR);
      expect(error.statusCode).toBeUndefined();
    });

    it('should create an instance with custom values', () => {
      const message = 'External API error';
      const code = 'CUSTOM_ERROR_CODE';
      const context = { operation: 'fetchData' };
      const details = { requestId: '123' };
      const cause = new Error('Original error');
      const statusCode = 503;

      const error = new ExternalApiError(
        message,
        code,
        context,
        details,
        cause,
        statusCode
      );

      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.context).toMatchObject(context);
      expect(error.details).toMatchObject({ ...details, statusCode });
      expect(error.cause).toBe(cause);
      expect(error.statusCode).toBe(statusCode);
    });

    it('should create an instance from HTTP response', () => {
      const response = {
        status: 429,
        statusText: 'Too Many Requests',
        data: { error: 'Rate limit exceeded' }
      };

      const error = ExternalApiError.fromResponse(response);

      expect(error).toBeInstanceOf(ExternalApiError);
      expect(error.message).toContain('429');
      expect(error.message).toContain('Too Many Requests');
      expect(error.statusCode).toBe(429);
      expect(error.details).toMatchObject({ response: response.data });
    });

    it('should create an instance from status code only', () => {
      const statusCode = 500;
      const error = ExternalApiError.fromResponse(statusCode);

      expect(error).toBeInstanceOf(ExternalApiError);
      expect(error.message).toContain('500');
      expect(error.statusCode).toBe(500);
    });

    it('should correctly identify server errors', () => {
      const error500 = ExternalApiError.fromResponse(500);
      const error400 = ExternalApiError.fromResponse(400);
      const errorNoStatus = new ExternalApiError('No status');

      expect(error500.isServerError()).toBe(true);
      expect(error400.isServerError()).toBe(false);
      expect(errorNoStatus.isServerError()).toBe(false);
    });

    it('should correctly identify client errors', () => {
      const error400 = ExternalApiError.fromResponse(400);
      const error500 = ExternalApiError.fromResponse(500);
      const errorNoStatus = new ExternalApiError('No status');

      expect(error400.isClientError()).toBe(true);
      expect(error500.isClientError()).toBe(false);
      expect(errorNoStatus.isClientError()).toBe(false);
    });

    it('should correctly identify retryable errors', () => {
      const error500 = ExternalApiError.fromResponse(500);
      const error429 = ExternalApiError.fromResponse(429);
      const error408 = ExternalApiError.fromResponse(408);
      const error400 = ExternalApiError.fromResponse(400);
      const errorNoStatus = new ExternalApiError('No status');

      expect(error500.isRetryable()).toBe(true);
      expect(error429.isRetryable()).toBe(true);
      expect(error408.isRetryable()).toBe(true);
      expect(error400.isRetryable()).toBe(false);
      expect(errorNoStatus.isRetryable()).toBe(true);
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new ExternalApiError('External API error');
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('IntegrationError', () => {
    it('should create an instance with default values', () => {
      const message = 'Integration error';
      const error = new IntegrationError(message);

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ExternalError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(COMMON_ERROR_CODES.EXTERNAL_SERVICE_ERROR);
    });

    it('should create an instance with integration name', () => {
      const message = 'Integration error';
      const integrationName = 'FHIR API';
      const error = new IntegrationError(message, undefined, integrationName);

      expect(error.message).toBe(message);
      expect(error.details).toMatchObject({ integrationName });
    });

    it('should create an instance for a specific journey', () => {
      const message = 'Integration error';
      const code = 'CUSTOM_ERROR_CODE';
      const integrationName = 'FHIR API';
      const journeyType = JourneyType.HEALTH;

      const error = IntegrationError.forJourney(
        message,
        code,
        integrationName,
        journeyType
      );

      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.details).toMatchObject({ integrationName });
      expect(error.context).toMatchObject({ journey: journeyType });
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new IntegrationError('Integration error');
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('ExternalDependencyUnavailableError', () => {
    it('should create an instance with default values', () => {
      const dependencyName = 'Payment Gateway';
      const error = new ExternalDependencyUnavailableError(dependencyName);

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ExternalError);
      expect(error.message).toContain(dependencyName);
      expect(error.message).toContain('unavailable');
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(COMMON_ERROR_CODES.EXTERNAL_SERVICE_ERROR);
      expect(error.details).toMatchObject({ dependencyName });
    });

    it('should create an instance with custom message', () => {
      const dependencyName = 'Payment Gateway';
      const message = 'Custom unavailable message';
      const error = new ExternalDependencyUnavailableError(dependencyName, message);

      expect(error.message).toBe(message);
      expect(error.details).toMatchObject({ dependencyName });
    });

    it('should include retry strategy in context', () => {
      const dependencyName = 'Payment Gateway';
      const error = new ExternalDependencyUnavailableError(dependencyName);

      expect(error.context.isTransient).toBe(true);
      expect(error.context.retryStrategy).toMatchObject({
        maxAttempts: RETRY_CONFIG.EXTERNAL_API.MAX_ATTEMPTS,
        baseDelayMs: RETRY_CONFIG.EXTERNAL_API.INITIAL_DELAY_MS,
        useExponentialBackoff: true
      });
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new ExternalDependencyUnavailableError('Payment Gateway');
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('ExternalAuthenticationError', () => {
    it('should create an instance with default values', () => {
      const serviceName = 'OAuth Provider';
      const error = new ExternalAuthenticationError(serviceName);

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ExternalError);
      expect(error.message).toContain(serviceName);
      expect(error.message).toContain('Authentication failed');
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(COMMON_ERROR_CODES.UNAUTHORIZED);
      expect(error.details).toMatchObject({ serviceName });
    });

    it('should create an instance with custom message', () => {
      const serviceName = 'OAuth Provider';
      const message = 'Custom authentication error';
      const error = new ExternalAuthenticationError(serviceName, message);

      expect(error.message).toBe(message);
      expect(error.details).toMatchObject({ serviceName });
    });

    it('should correctly identify expired credentials', () => {
      const serviceName = 'OAuth Provider';
      const error = new ExternalAuthenticationError(serviceName);

      expect(error.isCredentialExpired('token expired')).toBe(true);
      expect(error.isCredentialExpired('invalid token')).toBe(true);
      expect(error.isCredentialExpired('credential expired')).toBe(true);
      expect(error.isCredentialExpired('refresh required')).toBe(true);
      expect(error.isCredentialExpired('authentication failed')).toBe(false);
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new ExternalAuthenticationError('OAuth Provider');
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('ExternalResponseFormatError', () => {
    it('should create an instance with default values', () => {
      const message = 'Invalid response format';
      const response = { data: 'invalid' };
      const error = new ExternalResponseFormatError(message, response);

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ExternalError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(COMMON_ERROR_CODES.EXTERNAL_SERVICE_ERROR);
      expect(error.details.response).toBe(JSON.stringify(response));
    });

    it('should create an instance with expected format', () => {
      const message = 'Invalid response format';
      const response = { data: 'invalid' };
      const expectedFormat = 'JSON with id field';
      const error = new ExternalResponseFormatError(message, response, expectedFormat);

      expect(error.message).toBe(message);
      expect(error.details.response).toBe(JSON.stringify(response));
      expect(error.details.expectedFormat).toBe(expectedFormat);
    });

    it('should create an instance for missing required field', () => {
      const fieldName = 'id';
      const response = { name: 'test' };
      const error = ExternalResponseFormatError.missingRequiredField(fieldName, response);

      expect(error).toBeInstanceOf(ExternalResponseFormatError);
      expect(error.message).toContain(fieldName);
      expect(error.message).toContain('missing required field');
      expect(error.details.expectedFormat).toContain(fieldName);
      expect(error.details.response).toBe(JSON.stringify(response));
    });

    it('should create an instance for invalid field value', () => {
      const fieldName = 'age';
      const value = 'not-a-number';
      const expectedType = 'number';
      const error = ExternalResponseFormatError.invalidFieldValue(fieldName, value, expectedType);

      expect(error).toBeInstanceOf(ExternalResponseFormatError);
      expect(error.message).toContain(fieldName);
      expect(error.message).toContain('invalid value');
      expect(error.details.expectedFormat).toContain(expectedType);
      expect(error.details.response).toBe(JSON.stringify({ [fieldName]: value }));
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new ExternalResponseFormatError('Invalid format', {});
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('ExternalRateLimitError', () => {
    it('should create an instance with default values', () => {
      const message = 'Rate limit exceeded';
      const retryAfterMs = 5000;
      const error = new ExternalRateLimitError(message, retryAfterMs);

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ExternalError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(COMMON_ERROR_CODES.RATE_LIMIT_EXCEEDED);
      expect(error.retryAfterMs).toBe(retryAfterMs);
      expect(error.details).toMatchObject({ retryAfterMs });
    });

    it('should include retry strategy in context with provided retry time', () => {
      const message = 'Rate limit exceeded';
      const retryAfterMs = 5000;
      const error = new ExternalRateLimitError(message, retryAfterMs);

      expect(error.context.isTransient).toBe(true);
      expect(error.context.retryStrategy).toMatchObject({
        maxAttempts: RETRY_CONFIG.EXTERNAL_API.MAX_ATTEMPTS,
        baseDelayMs: retryAfterMs,
        useExponentialBackoff: false
      });
    });

    it('should create an instance from HTTP response with Retry-After in seconds', () => {
      const response = {
        headers: {
          'Retry-After': '30'
        }
      };

      const error = ExternalRateLimitError.fromResponse(response);

      expect(error).toBeInstanceOf(ExternalRateLimitError);
      expect(error.retryAfterMs).toBe(30000); // 30 seconds in milliseconds
      expect(error.getRetryAfterSeconds()).toBe(30);
    });

    it('should create an instance from HTTP response with Retry-After as date', () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute in the future
      const response = {
        headers: {
          'Retry-After': futureDate.toUTCString()
        }
      };

      const error = ExternalRateLimitError.fromResponse(response);

      expect(error).toBeInstanceOf(ExternalRateLimitError);
      // Should be approximately 60 seconds, but allow some tolerance for test execution time
      expect(error.getRetryAfterSeconds()).toBeGreaterThanOrEqual(55);
      expect(error.getRetryAfterSeconds()).toBeLessThanOrEqual(65);
    });

    it('should create an instance from HTTP response with headers.get method', () => {
      const response = {
        headers: {
          get: (name: string) => name === 'Retry-After' ? '30' : null
        }
      };

      const error = ExternalRateLimitError.fromResponse(response);

      expect(error).toBeInstanceOf(ExternalRateLimitError);
      expect(error.retryAfterMs).toBe(30000); // 30 seconds in milliseconds
    });

    it('should use default retry time when Retry-After header is missing', () => {
      const response = { headers: {} };
      const defaultRetryMs = 10000;

      const error = ExternalRateLimitError.fromResponse(response, defaultRetryMs);

      expect(error).toBeInstanceOf(ExternalRateLimitError);
      expect(error.retryAfterMs).toBe(defaultRetryMs);
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new ExternalRateLimitError('Rate limit exceeded', 5000);
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('ExternalTimeoutError', () => {
    it('should create an instance with default values', () => {
      const message = 'Operation timed out';
      const error = new ExternalTimeoutError(message);

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ExternalError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(COMMON_ERROR_CODES.TIMEOUT);
    });

    it('should create an instance with timeout details', () => {
      const message = 'Operation timed out';
      const timeoutMs = 30000;
      const operationName = 'fetchData';
      const error = new ExternalTimeoutError(message, timeoutMs, operationName);

      expect(error.message).toBe(message);
      expect(error.details).toMatchObject({
        timeoutMs,
        operationName
      });
    });

    it('should include retry strategy in context', () => {
      const message = 'Operation timed out';
      const error = new ExternalTimeoutError(message);

      expect(error.context.isTransient).toBe(true);
      expect(error.context.retryStrategy).toMatchObject({
        maxAttempts: RETRY_CONFIG.EXTERNAL_API.MAX_ATTEMPTS,
        baseDelayMs: RETRY_CONFIG.EXTERNAL_API.INITIAL_DELAY_MS,
        useExponentialBackoff: true
      });
    });

    it('should create an instance from operation', () => {
      const operationName = 'fetchData';
      const timeoutMs = 30000;
      const error = ExternalTimeoutError.fromOperation(operationName, timeoutMs);

      expect(error).toBeInstanceOf(ExternalTimeoutError);
      expect(error.message).toContain(operationName);
      expect(error.message).toContain(timeoutMs.toString());
      expect(error.details).toMatchObject({
        timeoutMs,
        operationName
      });
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new ExternalTimeoutError('Operation timed out');
      const httpException = error.toHttpException();

      // External timeout errors should map to 502 Bad Gateway, not 504 Gateway Timeout
      // because they're still in the EXTERNAL error type category
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('ExternalError static methods', () => {
    it('should create an error with retry information', () => {
      const message = 'Transient external error';
      const code = 'CUSTOM_ERROR_CODE';
      const error = ExternalError.withRetry(message, code);

      expect(error).toBeInstanceOf(ExternalApiError);
      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.context.isTransient).toBe(true);
      expect(error.context.retryStrategy).toMatchObject({
        maxAttempts: RETRY_CONFIG.EXTERNAL_API.MAX_ATTEMPTS,
        baseDelayMs: RETRY_CONFIG.EXTERNAL_API.INITIAL_DELAY_MS,
        useExponentialBackoff: true
      });
    });

    it('should create a non-transient error when specified', () => {
      const message = 'Non-transient external error';
      const code = 'CUSTOM_ERROR_CODE';
      const error = ExternalError.withRetry(message, code, false);

      expect(error).toBeInstanceOf(ExternalApiError);
      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.context.isTransient).toBe(false);
      expect(error.context.retryStrategy).toBeUndefined();
    });
  });
});