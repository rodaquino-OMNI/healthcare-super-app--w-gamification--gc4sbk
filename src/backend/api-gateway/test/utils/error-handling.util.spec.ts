import { HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { BaseError, ErrorType } from '@austa/errors';
import {
  categorizeError,
  determineJourneyType,
  createJourneyError,
  enrichErrorWithContext,
  formatErrorForResponse,
  isRetryableError,
  JourneyType,
} from '../../src/utils/error-handling.util';

describe('Error Handling Utilities', () => {
  describe('categorizeError', () => {
    it('should return the error type for BaseError instances', () => {
      const baseError = new BaseError('Test error', ErrorType.CLIENT);
      expect(categorizeError(baseError)).toBe(ErrorType.CLIENT);
    });

    it('should categorize client errors based on status code', () => {
      const clientError = { status: HttpStatus.BAD_REQUEST, message: 'Bad request' };
      expect(categorizeError(clientError)).toBe(ErrorType.CLIENT);
    });

    it('should categorize system errors based on status code', () => {
      const systemError = { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Server error' };
      expect(categorizeError(systemError)).toBe(ErrorType.SYSTEM);
    });

    it('should categorize transient errors based on error code', () => {
      const transientError = { code: 'ECONNRESET', message: 'Connection reset' };
      expect(categorizeError(transientError)).toBe(ErrorType.TRANSIENT);
    });

    it('should categorize external dependency errors based on message', () => {
      const externalError = { message: 'External dependency failed' };
      expect(categorizeError(externalError)).toBe(ErrorType.EXTERNAL_DEPENDENCY);
    });

    it('should default to system error for unrecognized errors', () => {
      const unknownError = { message: 'Unknown error' };
      expect(categorizeError(unknownError)).toBe(ErrorType.SYSTEM);
    });
  });

  describe('determineJourneyType', () => {
    it('should return journey from error if available', () => {
      const error = { journey: JourneyType.HEALTH };
      expect(determineJourneyType(error)).toBe(JourneyType.HEALTH);
    });

    it('should return journey from BaseError context if available', () => {
      const error = new BaseError('Test error', ErrorType.CLIENT, undefined, { journey: JourneyType.CARE });
      expect(determineJourneyType(error)).toBe(JourneyType.CARE);
    });

    it('should determine journey from request path', () => {
      const request = { path: '/api/health/metrics' } as Request;
      expect(determineJourneyType({}, request)).toBe(JourneyType.HEALTH);

      const careRequest = { path: '/api/care/appointments' } as Request;
      expect(determineJourneyType({}, careRequest)).toBe(JourneyType.CARE);

      const planRequest = { path: '/api/plan/benefits' } as Request;
      expect(determineJourneyType({}, planRequest)).toBe(JourneyType.PLAN);
    });

    it('should return undefined if journey cannot be determined', () => {
      const request = { path: '/api/unknown' } as Request;
      expect(determineJourneyType({}, request)).toBeUndefined();
    });
  });

  describe('createJourneyError', () => {
    it('should return the original error if it is a BaseError', () => {
      const baseError = new BaseError('Test error', ErrorType.CLIENT);
      const result = createJourneyError(baseError);
      expect(result).toBe(baseError);
    });

    it('should enrich BaseError with additional context', () => {
      const baseError = new BaseError('Test error', ErrorType.CLIENT);
      const context = { userId: '123' };
      const result = createJourneyError(baseError, undefined, context);
      expect(result.context).toEqual(expect.objectContaining(context));
    });

    it('should create a health journey error', () => {
      const error = new Error('Test error');
      const result = createJourneyError(error, JourneyType.HEALTH);
      expect(result).toBeInstanceOf(BaseError);
      expect(result.context?.journey).toBe(JourneyType.HEALTH);
    });

    it('should create a care journey error', () => {
      const error = new Error('Test error');
      const result = createJourneyError(error, JourneyType.CARE);
      expect(result).toBeInstanceOf(BaseError);
      expect(result.context?.journey).toBe(JourneyType.CARE);
    });

    it('should create a plan journey error', () => {
      const error = new Error('Test error');
      const result = createJourneyError(error, JourneyType.PLAN);
      expect(result).toBeInstanceOf(BaseError);
      expect(result.context?.journey).toBe(JourneyType.PLAN);
    });

    it('should create a generic error when journey is not specified', () => {
      const error = new Error('Test error');
      const result = createJourneyError(error);
      expect(result).toBeInstanceOf(BaseError);
      expect(result.context?.journey).toBeUndefined();
    });
  });

  describe('enrichErrorWithContext', () => {
    it('should add request information to error context', () => {
      const error = new Error('Test error');
      const request = {
        headers: { 'x-request-id': '123', 'user-agent': 'test-agent' },
        path: '/api/health/metrics',
        method: 'GET',
        query: {},
        body: {},
      } as unknown as Request;

      const result = enrichErrorWithContext(error, request);
      expect(result).toBeInstanceOf(BaseError);
      expect(result.context).toEqual(expect.objectContaining({
        requestId: '123',
        path: '/api/health/metrics',
        method: 'GET',
        userAgent: 'test-agent',
        query: {},
        body: {},
      }));
    });

    it('should redact sensitive information', () => {
      const error = new Error('Test error');
      const request = {
        headers: { 'x-request-id': '123' },
        path: '/api/auth/login',
        method: 'POST',
        query: { token: 'secret-token' },
        body: { username: 'user', password: 'secret' },
      } as unknown as Request;

      const result = enrichErrorWithContext(error, request);
      expect(result.context?.query).toEqual(expect.objectContaining({ token: 'secret-token' }));
      expect(result.context?.body).toEqual(expect.objectContaining({
        username: 'user',
        password: '[REDACTED]',
      }));
    });

    it('should add user information if available', () => {
      const error = new Error('Test error');
      const request = {
        headers: {},
        path: '/api/health/metrics',
        method: 'GET',
        user: { id: '123', role: 'user' },
      } as unknown as Request;

      const result = enrichErrorWithContext(error, request);
      expect(result.context).toEqual(expect.objectContaining({
        userId: '123',
        userRole: 'user',
      }));
    });
  });

  describe('formatErrorForResponse', () => {
    it('should format BaseError for response', () => {
      const baseError = new BaseError(
        'Test error',
        ErrorType.CLIENT,
        undefined,
        { journey: JourneyType.HEALTH, correlationId: '123' },
        { statusCode: HttpStatus.BAD_REQUEST }
      );

      const result = formatErrorForResponse(baseError);
      expect(result).toEqual(expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        journey: JourneyType.HEALTH,
        correlationId: '123',
      }));
    });

    it('should include context when specified', () => {
      const baseError = new BaseError(
        'Test error',
        ErrorType.CLIENT,
        undefined,
        { journey: JourneyType.HEALTH, userId: '123', requestId: 'req-123' },
        { statusCode: HttpStatus.BAD_REQUEST }
      );

      const result = formatErrorForResponse(baseError, true);
      expect(result.context).toEqual(expect.objectContaining({
        journey: JourneyType.HEALTH,
        userId: '123',
        requestId: 'req-123',
      }));
    });

    it('should format non-BaseError for response', () => {
      const error = {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        path: '/api/auth/login',
        journey: JourneyType.HEALTH,
      };

      const result = formatErrorForResponse(error);
      expect(result).toEqual(expect.objectContaining({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        path: '/api/auth/login',
        journey: JourneyType.HEALTH,
      }));
    });
  });

  describe('isRetryableError', () => {
    it('should identify transient errors as retryable', () => {
      const transientError = { code: 'ECONNRESET', message: 'Connection reset' };
      expect(isRetryableError(transientError)).toBe(true);
    });

    it('should identify 5xx errors as retryable', () => {
      const serverError = { status: HttpStatus.INTERNAL_SERVER_ERROR };
      expect(isRetryableError(serverError)).toBe(true);
    });

    it('should identify 429 Too Many Requests as retryable', () => {
      const rateLimitError = { status: HttpStatus.TOO_MANY_REQUESTS };
      expect(isRetryableError(rateLimitError)).toBe(true);
    });

    it('should not identify 4xx client errors as retryable', () => {
      const clientError = { status: HttpStatus.BAD_REQUEST };
      expect(isRetryableError(clientError)).toBe(false);
    });

    it('should not identify 501 Not Implemented as retryable', () => {
      const notImplementedError = { status: HttpStatus.NOT_IMPLEMENTED };
      expect(isRetryableError(notImplementedError)).toBe(false);
    });
  });
});