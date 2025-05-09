/**
 * @file retry.util.spec.ts
 * @description Unit tests for the retry utility that implements exponential backoff retry logic for transient errors.
 */

import { trace, SpanStatusCode, context, SpanKind } from '@opentelemetry/api';
import {
  retryWithBackoff,
  calculateBackoff,
  isRetryableError,
  delay,
  RetryConfig,
  RetryConfigs,
  createRetryableFunction,
  retryWithBackoffSync,
  createRetryableFunctionSync,
  retryDatabaseOperation,
  retryExternalApiCall,
  retryKafkaOperation,
  retryHealthIntegration,
  retryDeviceSync,
  retryNotificationDelivery
} from '../../../src/utils/retry';
import {
  createBaseError,
  createExternalError,
  createTechnicalError,
  createBusinessError,
  createValidationError,
  createTimeoutError,
  createExternalApiError,
  createExternalRateLimitError,
  ErrorType
} from '../../helpers/error-factory';
import {
  RetryTestingUtility,
  NetworkErrorSimulator,
  NetworkErrorType,
  createFlakyApiSimulator
} from '../../helpers/network-error-simulator';

// Mock OpenTelemetry
jest.mock('@opentelemetry/api', () => {
  const mockSpan = {
    setAttribute: jest.fn(),
    setStatus: jest.fn(),
    recordException: jest.fn(),
    addEvent: jest.fn(),
    end: jest.fn()
  };
  
  const mockTracer = {
    startActiveSpan: jest.fn((name, options, callback) => {
      return callback(mockSpan);
    })
  };
  
  return {
    trace: {
      getTracer: jest.fn(() => mockTracer)
    },
    SpanStatusCode: {
      OK: 'ok',
      ERROR: 'error'
    },
    SpanKind: {
      INTERNAL: 'internal'
    },
    context: {
      active: jest.fn()
    }
  };
});

describe('Retry Utility', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('calculateBackoff', () => {
    it('should calculate exponential backoff without jitter', () => {
      const config: RetryConfig = {
        maxAttempts: 5,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2
      };
      
      // First attempt (attempt #1)
      expect(calculateBackoff(1, config)).toBe(100);
      
      // Second attempt (attempt #2)
      expect(calculateBackoff(2, config)).toBe(200);
      
      // Third attempt (attempt #3)
      expect(calculateBackoff(3, config)).toBe(400);
      
      // Fourth attempt (attempt #4)
      expect(calculateBackoff(4, config)).toBe(800);
      
      // Fifth attempt (attempt #5)
      expect(calculateBackoff(5, config)).toBe(1600);
    });
    
    it('should respect maxDelayMs', () => {
      const config: RetryConfig = {
        maxAttempts: 10,
        initialDelayMs: 100,
        backoffFactor: 3,
        maxDelayMs: 1000,
        useJitter: false,
        jitterFactor: 0.2
      };
      
      // First attempt (attempt #1)
      expect(calculateBackoff(1, config)).toBe(100);
      
      // Second attempt (attempt #2)
      expect(calculateBackoff(2, config)).toBe(300);
      
      // Third attempt (attempt #3)
      expect(calculateBackoff(3, config)).toBe(900);
      
      // Fourth attempt (attempt #4) - should be capped at maxDelayMs
      expect(calculateBackoff(4, config)).toBe(1000);
      
      // Fifth attempt (attempt #5) - should be capped at maxDelayMs
      expect(calculateBackoff(5, config)).toBe(1000);
    });
    
    it('should apply jitter when enabled', () => {
      // Mock Math.random to return a predictable value
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.5);
      
      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: true,
        jitterFactor: 0.2
      };
      
      // With jitter factor of 0.2 and Math.random() = 0.5, we expect a 10% reduction
      // First attempt (attempt #1)
      expect(calculateBackoff(1, config)).toBe(90); // 100 * (1 - 0.2 * 0.5) = 90
      
      // Second attempt (attempt #2)
      expect(calculateBackoff(2, config)).toBe(180); // 200 * (1 - 0.2 * 0.5) = 180
      
      // Third attempt (attempt #3)
      expect(calculateBackoff(3, config)).toBe(360); // 400 * (1 - 0.2 * 0.5) = 360
      
      // Restore original Math.random
      Math.random = originalRandom;
    });
  });
  
  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const networkError = new Error('network error');
      expect(isRetryableError(networkError)).toBe(true);
      
      const connectionError = new Error('connection refused');
      expect(isRetryableError(connectionError)).toBe(true);
      
      const socketError = new Error('socket hang up');
      expect(isRetryableError(socketError)).toBe(true);
    });
    
    it('should identify timeout errors as retryable', () => {
      const timeoutError = new Error('timeout');
      expect(isRetryableError(timeoutError)).toBe(true);
      
      const timedOutError = new Error('operation timed out');
      expect(isRetryableError(timedOutError)).toBe(true);
    });
    
    it('should identify rate limit errors as retryable', () => {
      const rateLimitError = new Error('rate limit exceeded');
      expect(isRetryableError(rateLimitError)).toBe(true);
      
      const tooManyRequestsError = new Error('too many requests');
      expect(isRetryableError(tooManyRequestsError)).toBe(true);
      
      const error429 = new Error('429 Too Many Requests');
      expect(isRetryableError(error429)).toBe(true);
    });
    
    it('should identify server errors as retryable', () => {
      const serverError = new Error('server error');
      expect(isRetryableError(serverError)).toBe(true);
      
      const error500 = new Error('500 Internal Server Error');
      expect(isRetryableError(error500)).toBe(true);
      
      const error503 = new Error('503 Service Unavailable');
      expect(isRetryableError(error503)).toBe(true);
    });
    
    it('should use isRetryable method for BaseError instances', () => {
      // Create a retryable error
      const retryableError = createExternalError({
        message: 'External API temporarily unavailable'
      });
      // Mock the isRetryable method
      retryableError.isRetryable = jest.fn().mockReturnValue(true);
      
      expect(isRetryableError(retryableError)).toBe(true);
      expect(retryableError.isRetryable).toHaveBeenCalled();
      
      // Create a non-retryable error
      const nonRetryableError = createBusinessError({
        message: 'Business rule violation'
      });
      // Mock the isRetryable method
      nonRetryableError.isRetryable = jest.fn().mockReturnValue(false);
      
      expect(isRetryableError(nonRetryableError)).toBe(false);
      expect(nonRetryableError.isRetryable).toHaveBeenCalled();
    });
    
    it('should not retry non-retryable errors', () => {
      const validationError = new Error('validation error');
      expect(isRetryableError(validationError)).toBe(false);
      
      const notFoundError = new Error('not found');
      expect(isRetryableError(notFoundError)).toBe(false);
      
      const syntaxError = new SyntaxError('unexpected token');
      expect(isRetryableError(syntaxError)).toBe(false);
    });
  });
  
  describe('delay', () => {
    it('should resolve after the specified delay', async () => {
      const delayPromise = delay(1000);
      
      // Fast-forward time
      jest.advanceTimersByTime(999);
      expect(await Promise.race([delayPromise, 'not-resolved'])).toBe('not-resolved');
      
      jest.advanceTimersByTime(1);
      expect(await Promise.race([delayPromise, 'not-resolved'])).toBeUndefined();
    });
  });
  
  describe('retryWithBackoff', () => {
    it('should retry a failing function until success', async () => {
      // Create a function that fails twice and then succeeds
      let attempts = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts <= 2) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return 'success';
      });
      
      const result = await retryWithBackoff(fn, {
        maxAttempts: 5,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2
      });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      
      // Verify that delays were applied
      expect(setTimeout).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
      expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    });
    
    it('should stop retrying after maxAttempts and throw the last error', async () => {
      // Create a function that always fails
      const fn = jest.fn().mockImplementation(async () => {
        throw new Error('Always fails');
      });
      
      await expect(retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2
      })).rejects.toThrow('Always fails');
      
      expect(fn).toHaveBeenCalledTimes(3);
      
      // Verify that delays were applied
      expect(setTimeout).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
      expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    });
    
    it('should not retry if the error is not retryable', async () => {
      // Create a function that throws a non-retryable error
      const fn = jest.fn().mockImplementation(async () => {
        const error = new Error('Validation error');
        // Ensure it's not identified as retryable
        error.name = 'ValidationError';
        throw error;
      });
      
      await expect(retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2,
        isRetryable: () => false // Force non-retryable
      })).rejects.toThrow('Validation error');
      
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Verify that no delays were applied
      expect(setTimeout).not.toHaveBeenCalled();
    });
    
    it('should use custom isRetryable function when provided', async () => {
      // Create a function that throws different errors
      let attempts = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('First error'); // Will be retried
        } else if (attempts === 2) {
          throw new Error('Second error'); // Will not be retried
        }
        return 'success';
      });
      
      // Custom isRetryable function that only retries the first error
      const isRetryable = jest.fn().mockImplementation((error: Error) => {
        return error.message === 'First error';
      });
      
      await expect(retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2,
        isRetryable
      })).rejects.toThrow('Second error');
      
      expect(fn).toHaveBeenCalledTimes(2);
      expect(isRetryable).toHaveBeenCalledTimes(2);
      
      // Verify that only one delay was applied
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
    });
    
    it('should call onRetry callback for each retry attempt', async () => {
      // Create a function that fails twice and then succeeds
      let attempts = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts <= 2) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return 'success';
      });
      
      const onRetry = jest.fn();
      
      const result = await retryWithBackoff(fn, {
        maxAttempts: 5,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2,
        onRetry
      });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);
      
      // First retry callback
      expect(onRetry).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ message: 'Attempt 1 failed' }),
        1,
        100
      );
      
      // Second retry callback
      expect(onRetry).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ message: 'Attempt 2 failed' }),
        2,
        200
      );
    });
    
    it('should call onExhausted callback when max attempts are reached', async () => {
      // Create a function that always fails
      const fn = jest.fn().mockImplementation(async () => {
        throw new Error('Always fails');
      });
      
      const onExhausted = jest.fn();
      
      await expect(retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2,
        onExhausted
      })).rejects.toThrow('Always fails');
      
      expect(fn).toHaveBeenCalledTimes(3);
      expect(onExhausted).toHaveBeenCalledTimes(1);
      expect(onExhausted).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Always fails' }),
        3
      );
    });
    
    it('should call onSuccess callback when operation succeeds after retries', async () => {
      // Create a function that fails once and then succeeds
      let attempts = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('First attempt failed');
        }
        return 'success';
      });
      
      const onSuccess = jest.fn();
      
      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2,
        onSuccess
      });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith('success', 2);
    });
    
    it('should not call onSuccess callback when operation succeeds on first attempt', async () => {
      // Create a function that succeeds immediately
      const fn = jest.fn().mockImplementation(async () => {
        return 'success';
      });
      
      const onSuccess = jest.fn();
      
      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2,
        onSuccess
      });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(onSuccess).not.toHaveBeenCalled();
    });
    
    it('should use isSuccess function to determine if operation was successful', async () => {
      // Create a function that returns a result that doesn't meet success criteria at first
      let attempts = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempts++;
        return { success: attempts > 1, data: `attempt ${attempts}` };
      });
      
      // Custom isSuccess function that checks the success property
      const isSuccess = jest.fn().mockImplementation((result: any) => {
        return result.success === true;
      });
      
      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2,
        isSuccess
      });
      
      expect(result).toEqual({ success: true, data: 'attempt 2' });
      expect(fn).toHaveBeenCalledTimes(2);
      expect(isSuccess).toHaveBeenCalledTimes(2);
      
      // Verify that a delay was applied
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
    });
    
    it('should add journey context to span attributes when provided', async () => {
      // Create a function that succeeds immediately
      const fn = jest.fn().mockImplementation(async () => {
        return 'success';
      });
      
      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2,
        context: {
          journey: 'health',
          operation: 'fetch-metrics'
        }
      });
      
      expect(result).toBe('success');
      
      // Verify that the tracer was called with the correct operation name
      expect(trace.getTracer).toHaveBeenCalledWith('austa-errors');
      expect(trace.getTracer().startActiveSpan).toHaveBeenCalledWith(
        'fetch-metrics with retry',
        { kind: 'internal' },
        expect.any(Function)
      );
      
      // Get the mock span
      const mockSpan = trace.getTracer().startActiveSpan.mock.calls[0][2].mock.calls[0][0];
      
      // Verify that journey context was added to span attributes
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('journey', 'health');
    });
  });
  
  describe('createRetryableFunction', () => {
    it('should create a retryable version of an async function', async () => {
      // Create a function that fails twice and then succeeds
      let attempts = 0;
      const originalFn = jest.fn().mockImplementation(async (arg1: string, arg2: number) => {
        attempts++;
        if (attempts <= 2) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return `${arg1}-${arg2}-success`;
      });
      
      const retryableFn = createRetryableFunction(originalFn, {
        maxAttempts: 5,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2
      });
      
      const result = await retryableFn('test', 123);
      
      expect(result).toBe('test-123-success');
      expect(originalFn).toHaveBeenCalledTimes(3);
      expect(originalFn).toHaveBeenCalledWith('test', 123);
      
      // Verify that delays were applied
      expect(setTimeout).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
      expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    });
  });
  
  describe('retryWithBackoffSync', () => {
    it('should retry a failing synchronous function until success', () => {
      // Create a function that fails twice and then succeeds
      let attempts = 0;
      const fn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts <= 2) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return 'success';
      });
      
      // Mock Date.now to simulate time passing
      const originalDateNow = Date.now;
      let currentTime = 1000;
      Date.now = jest.fn().mockImplementation(() => {
        // Increment time by 10ms on each call to simulate time passing during busy wait
        const result = currentTime;
        currentTime += 10;
        return result;
      });
      
      const result = retryWithBackoffSync(fn, {
        maxAttempts: 5,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2
      });
      
      // Restore Date.now
      Date.now = originalDateNow;
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });
    
    it('should stop retrying after maxAttempts and throw the last error', () => {
      // Create a function that always fails
      const fn = jest.fn().mockImplementation(() => {
        throw new Error('Always fails');
      });
      
      // Mock Date.now to simulate time passing
      const originalDateNow = Date.now;
      let currentTime = 1000;
      Date.now = jest.fn().mockImplementation(() => {
        // Increment time by 10ms on each call to simulate time passing during busy wait
        const result = currentTime;
        currentTime += 10;
        return result;
      });
      
      expect(() => retryWithBackoffSync(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2
      })).toThrow('Always fails');
      
      // Restore Date.now
      Date.now = originalDateNow;
      
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('createRetryableFunctionSync', () => {
    it('should create a retryable version of a synchronous function', () => {
      // Create a function that fails twice and then succeeds
      let attempts = 0;
      const originalFn = jest.fn().mockImplementation((arg1: string, arg2: number) => {
        attempts++;
        if (attempts <= 2) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return `${arg1}-${arg2}-success`;
      });
      
      // Mock Date.now to simulate time passing
      const originalDateNow = Date.now;
      let currentTime = 1000;
      Date.now = jest.fn().mockImplementation(() => {
        // Increment time by 10ms on each call to simulate time passing during busy wait
        const result = currentTime;
        currentTime += 10;
        return result;
      });
      
      const retryableFn = createRetryableFunctionSync(originalFn, {
        maxAttempts: 5,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2
      });
      
      const result = retryableFn('test', 123);
      
      // Restore Date.now
      Date.now = originalDateNow;
      
      expect(result).toBe('test-123-success');
      expect(originalFn).toHaveBeenCalledTimes(3);
      expect(originalFn).toHaveBeenCalledWith('test', 123);
    });
  });
  
  describe('Specialized retry functions', () => {
    it('should use DATABASE config for retryDatabaseOperation', async () => {
      // Create a spy on retryWithBackoff
      const retryWithBackoffSpy = jest.spyOn(require('../../../src/utils/retry'), 'retryWithBackoff');
      
      // Create a function that succeeds immediately
      const fn = jest.fn().mockImplementation(async () => {
        return 'database result';
      });
      
      const result = await retryDatabaseOperation(fn, { context: { operation: 'query' } });
      
      expect(result).toBe('database result');
      expect(retryWithBackoffSpy).toHaveBeenCalledWith(fn, {
        ...RetryConfigs.DATABASE,
        context: { operation: 'query' }
      });
    });
    
    it('should use EXTERNAL_API config for retryExternalApiCall', async () => {
      // Create a spy on retryWithBackoff
      const retryWithBackoffSpy = jest.spyOn(require('../../../src/utils/retry'), 'retryWithBackoff');
      
      // Create a function that succeeds immediately
      const fn = jest.fn().mockImplementation(async () => {
        return 'api result';
      });
      
      const result = await retryExternalApiCall(fn, { context: { operation: 'fetch' } });
      
      expect(result).toBe('api result');
      expect(retryWithBackoffSpy).toHaveBeenCalledWith(fn, {
        ...RetryConfigs.EXTERNAL_API,
        context: { operation: 'fetch' }
      });
    });
    
    it('should use KAFKA config for retryKafkaOperation', async () => {
      // Create a spy on retryWithBackoff
      const retryWithBackoffSpy = jest.spyOn(require('../../../src/utils/retry'), 'retryWithBackoff');
      
      // Create a function that succeeds immediately
      const fn = jest.fn().mockImplementation(async () => {
        return 'kafka result';
      });
      
      const result = await retryKafkaOperation(fn, { context: { operation: 'produce' } });
      
      expect(result).toBe('kafka result');
      expect(retryWithBackoffSpy).toHaveBeenCalledWith(fn, {
        ...RetryConfigs.KAFKA,
        context: { operation: 'produce' }
      });
    });
    
    it('should use HEALTH_INTEGRATION config for retryHealthIntegration', async () => {
      // Create a spy on retryWithBackoff
      const retryWithBackoffSpy = jest.spyOn(require('../../../src/utils/retry'), 'retryWithBackoff');
      
      // Create a function that succeeds immediately
      const fn = jest.fn().mockImplementation(async () => {
        return 'health integration result';
      });
      
      const result = await retryHealthIntegration(fn, { context: { operation: 'sync' } });
      
      expect(result).toBe('health integration result');
      expect(retryWithBackoffSpy).toHaveBeenCalledWith(fn, {
        ...RetryConfigs.HEALTH_INTEGRATION,
        context: { operation: 'sync' }
      });
    });
    
    it('should use DEVICE_SYNC config for retryDeviceSync', async () => {
      // Create a spy on retryWithBackoff
      const retryWithBackoffSpy = jest.spyOn(require('../../../src/utils/retry'), 'retryWithBackoff');
      
      // Create a function that succeeds immediately
      const fn = jest.fn().mockImplementation(async () => {
        return 'device sync result';
      });
      
      const result = await retryDeviceSync(fn, { context: { operation: 'sync' } });
      
      expect(result).toBe('device sync result');
      expect(retryWithBackoffSpy).toHaveBeenCalledWith(fn, {
        ...RetryConfigs.DEVICE_SYNC,
        context: { operation: 'sync' }
      });
    });
    
    it('should use NOTIFICATION config for retryNotificationDelivery', async () => {
      // Create a spy on retryWithBackoff
      const retryWithBackoffSpy = jest.spyOn(require('../../../src/utils/retry'), 'retryWithBackoff');
      
      // Create a function that succeeds immediately
      const fn = jest.fn().mockImplementation(async () => {
        return 'notification result';
      });
      
      const result = await retryNotificationDelivery(fn, { context: { operation: 'send' } });
      
      expect(result).toBe('notification result');
      expect(retryWithBackoffSpy).toHaveBeenCalledWith(fn, {
        ...RetryConfigs.NOTIFICATION,
        context: { operation: 'send' }
      });
    });
  });
  
  describe('Integration with RetryTestingUtility', () => {
    it('should retry with exponential backoff using RetryTestingUtility', async () => {
      // Create a RetryTestingUtility instance
      const retryTester = new RetryTestingUtility({
        serviceName: 'test-service',
        errorTypes: [NetworkErrorType.SERVER_ERROR]
      });
      
      // Create a function that fails 3 times and then succeeds
      let attempts = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts <= 3) {
          throw retryTester.simulateRequest(undefined, -1);
        }
        return 'success';
      });
      
      // Use real timers for this test
      jest.useRealTimers();
      
      const result = await retryWithBackoff(fn, {
        maxAttempts: 5,
        initialDelayMs: 10, // Use small delays for faster tests
        backoffFactor: 2,
        maxDelayMs: 100,
        useJitter: false,
        jitterFactor: 0
      });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(4);
      expect(retryTester.getErrors().length).toBe(3);
      
      // Verify that delays follow exponential backoff pattern
      const delays = retryTester.getRetryDelays();
      expect(delays.length).toBe(3);
      
      // Check if delays are approximately following exponential backoff
      // We can't check exact values due to real timers, but we can check the pattern
      expect(delays[1] / delays[0]).toBeGreaterThanOrEqual(1.5); // Should be close to 2
      expect(delays[2] / delays[1]).toBeGreaterThanOrEqual(1.5); // Should be close to 2
    });
    
    it('should handle flaky API with createFlakyApiSimulator', async () => {
      // Create a flaky API simulator with 30% success rate
      const flakyApi = createFlakyApiSimulator(0.3, [NetworkErrorType.SERVER_ERROR]);
      
      // Wrap the flaky API with retry
      const retryableFlakyApi = () => retryWithBackoff(flakyApi, {
        maxAttempts: 10,
        initialDelayMs: 10, // Use small delays for faster tests
        backoffFactor: 1.5,
        maxDelayMs: 100,
        useJitter: false,
        jitterFactor: 0
      });
      
      // Use real timers for this test
      jest.useRealTimers();
      
      // With a 30% success rate and 10 max attempts, we should eventually succeed
      const result = await retryableFlakyApi();
      expect(result).toBeDefined();
    });
  });
  
  describe('Error handling with different error types', () => {
    it('should retry external errors', async () => {
      // Create a function that throws an external error and then succeeds
      let attempts = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw createExternalApiError({
            service: 'test-api',
            endpoint: '/api/test',
            statusCode: 503
          });
        }
        return 'success';
      });
      
      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2
      });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
    
    it('should retry timeout errors', async () => {
      // Create a function that throws a timeout error and then succeeds
      let attempts = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw createTimeoutError({
            operation: 'api-call',
            duration: 30000
          });
        }
        return 'success';
      });
      
      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2
      });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
    
    it('should retry rate limit errors', async () => {
      // Create a function that throws a rate limit error and then succeeds
      let attempts = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw createExternalRateLimitError({
            service: 'test-api',
            retryAfter: 60
          });
        }
        return 'success';
      });
      
      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2
      });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
    
    it('should not retry business errors', async () => {
      // Create a function that throws a business error
      const fn = jest.fn().mockImplementation(async () => {
        throw createBusinessError({
          message: 'Business rule violation',
          code: 'BUSINESS_RULE_001'
        });
      });
      
      await expect(retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2
      })).rejects.toThrow('Business rule violation');
      
      expect(fn).toHaveBeenCalledTimes(1);
    });
    
    it('should not retry validation errors', async () => {
      // Create a function that throws a validation error
      const fn = jest.fn().mockImplementation(async () => {
        throw createValidationError({
          message: 'Invalid input',
          code: 'VALIDATION_001'
        });
      });
      
      await expect(retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 10000,
        useJitter: false,
        jitterFactor: 0.2
      })).rejects.toThrow('Invalid input');
      
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});