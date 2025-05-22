import { jest } from '@jest/globals';
import { ErrorType } from '../../../src/categories/error-types';
import {
  calculateBackoffDelay,
  defaultRetryCondition,
  defaultSuccessCondition,
  retry,
  retryForErrorTypes,
  withRetry,
  circuitBreakerWithRetry,
  RetryOptions,
  RetryResult
} from '../../../src/utils/retry';

// Mock OpenTelemetry API
jest.mock('@opentelemetry/api', () => {
  return {
    trace: {
      getTracer: jest.fn(() => ({
        startSpan: jest.fn(() => mockSpan)
      })),
      getSpan: jest.fn(),
      setSpan: jest.fn((context, span) => context)
    },
    context: {
      active: jest.fn(() => ({}))
    },
    SpanStatusCode: {
      OK: 'OK',
      ERROR: 'ERROR'
    }
  };
});

// Mock span for OpenTelemetry
const mockSpan = {
  setAttribute: jest.fn(),
  setStatus: jest.fn(),
  end: jest.fn(),
  recordException: jest.fn()
};

// Mock console for logging tests
const originalConsole = { ...console };
let consoleLogSpy: jest.SpyInstance;
let consoleWarnSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

// Mock setTimeout to avoid actual delays in tests
jest.useFakeTimers();

// Custom error class with type property for testing
class AppError extends Error {
  type: ErrorType;
  code?: string;

  constructor(message: string, type: ErrorType, code?: string) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
  }
}

describe('Retry Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.useRealTimers();
  });

  afterAll(() => {
    // Restore original console
    Object.keys(originalConsole).forEach(key => {
      console[key] = originalConsole[key];
    });
  });

  describe('calculateBackoffDelay', () => {
    it('should calculate correct delay with default options', () => {
      // First retry (attempt 1) should use baseDelay (100ms)
      const delay1 = calculateBackoffDelay(1, {});
      expect(delay1).toBeGreaterThanOrEqual(80); // Allow for jitter
      expect(delay1).toBeLessThanOrEqual(120); // Allow for jitter

      // Second retry (attempt 2) should use baseDelay * 2^1 (200ms)
      const delay2 = calculateBackoffDelay(2, {});
      expect(delay2).toBeGreaterThanOrEqual(160); // Allow for jitter
      expect(delay2).toBeLessThanOrEqual(240); // Allow for jitter

      // Third retry (attempt 3) should use baseDelay * 2^2 (400ms)
      const delay3 = calculateBackoffDelay(3, {});
      expect(delay3).toBeGreaterThanOrEqual(320); // Allow for jitter
      expect(delay3).toBeLessThanOrEqual(480); // Allow for jitter
    });

    it('should respect maxDelay parameter', () => {
      // Set maxDelay to 150ms
      const options: RetryOptions = { maxDelay: 150 };

      // First retry (attempt 1) should use baseDelay (100ms)
      const delay1 = calculateBackoffDelay(1, options);
      expect(delay1).toBeGreaterThanOrEqual(80); // Allow for jitter
      expect(delay1).toBeLessThanOrEqual(120); // Allow for jitter

      // Second retry (attempt 2) would normally be 200ms, but maxDelay caps it at 150ms
      const delay2 = calculateBackoffDelay(2, options);
      expect(delay2).toBeGreaterThanOrEqual(120); // Allow for jitter
      expect(delay2).toBeLessThanOrEqual(150); // Capped by maxDelay

      // Third retry (attempt 3) would normally be 400ms, but maxDelay caps it at 150ms
      const delay3 = calculateBackoffDelay(3, options);
      expect(delay3).toBeGreaterThanOrEqual(120); // Allow for jitter
      expect(delay3).toBeLessThanOrEqual(150); // Capped by maxDelay
    });

    it('should apply jitter within expected range', () => {
      // Set jitter to 0.5 (50%)
      const options: RetryOptions = { jitter: 0.5 };

      // First retry (attempt 1) should use baseDelay (100ms) with 50% jitter
      const delay = calculateBackoffDelay(1, options);
      expect(delay).toBeGreaterThanOrEqual(50); // baseDelay * (1 - jitter)
      expect(delay).toBeLessThanOrEqual(150); // baseDelay * (1 + jitter)
    });

    it('should handle custom baseDelay', () => {
      // Set baseDelay to 200ms
      const options: RetryOptions = { baseDelay: 200 };

      // First retry (attempt 1) should use baseDelay (200ms)
      const delay1 = calculateBackoffDelay(1, options);
      expect(delay1).toBeGreaterThanOrEqual(160); // Allow for jitter
      expect(delay1).toBeLessThanOrEqual(240); // Allow for jitter

      // Second retry (attempt 2) should use baseDelay * 2^1 (400ms)
      const delay2 = calculateBackoffDelay(2, options);
      expect(delay2).toBeGreaterThanOrEqual(320); // Allow for jitter
      expect(delay2).toBeLessThanOrEqual(480); // Allow for jitter
    });

    it('should handle edge cases', () => {
      // Very large attempt number should still respect maxDelay
      const delay = calculateBackoffDelay(20, { maxDelay: 5000 });
      expect(delay).toBeLessThanOrEqual(5000);
      expect(delay).toBeGreaterThanOrEqual(4000); // Allow for jitter
    });
  });

  describe('defaultRetryCondition', () => {
    it('should return true for EXTERNAL error types', () => {
      const error = new AppError('External service unavailable', ErrorType.EXTERNAL);
      expect(defaultRetryCondition(error)).toBe(true);
    });

    it('should return true for TECHNICAL error types', () => {
      const error = new AppError('Database connection error', ErrorType.TECHNICAL);
      expect(defaultRetryCondition(error)).toBe(true);
    });

    it('should return false for other error types', () => {
      const error = new AppError('Invalid input', ErrorType.VALIDATION);
      expect(defaultRetryCondition(error)).toBe(false);

      const error2 = new AppError('Not found', ErrorType.NOT_FOUND);
      expect(defaultRetryCondition(error2)).toBe(false);

      const error3 = new AppError('Unauthorized', ErrorType.UNAUTHORIZED);
      expect(defaultRetryCondition(error3)).toBe(false);
    });

    it('should return true for common network errors', () => {
      const timeoutError = new Error('Request timeout');
      expect(defaultRetryCondition(timeoutError)).toBe(true);

      const connectionRefusedError = new Error('ECONNREFUSED');
      expect(defaultRetryCondition(connectionRefusedError)).toBe(true);

      const connectionResetError = new Error('ECONNRESET');
      expect(defaultRetryCondition(connectionResetError)).toBe(true);

      const socketHangUpError = new Error('socket hang up');
      expect(defaultRetryCondition(socketHangUpError)).toBe(true);

      const networkError = new Error('network error');
      expect(defaultRetryCondition(networkError)).toBe(true);

      const abortError = new Error('Operation aborted');
      abortError.name = 'AbortError';
      expect(defaultRetryCondition(abortError)).toBe(true);

      const timeoutError2 = new Error('Operation timed out');
      timeoutError2.name = 'TimeoutError';
      expect(defaultRetryCondition(timeoutError2)).toBe(true);
    });

    it('should return false for other standard errors', () => {
      const syntaxError = new SyntaxError('Invalid syntax');
      expect(defaultRetryCondition(syntaxError)).toBe(false);

      const rangeError = new RangeError('Value out of range');
      expect(defaultRetryCondition(rangeError)).toBe(false);

      const genericError = new Error('Generic error');
      expect(defaultRetryCondition(genericError)).toBe(false);
    });
  });

  describe('defaultSuccessCondition', () => {
    it('should return true for non-null, non-undefined values', () => {
      expect(defaultSuccessCondition('result')).toBe(true);
      expect(defaultSuccessCondition(0)).toBe(true);
      expect(defaultSuccessCondition(false)).toBe(true);
      expect(defaultSuccessCondition({})).toBe(true);
      expect(defaultSuccessCondition([])).toBe(true);
    });

    it('should return false for null or undefined values', () => {
      expect(defaultSuccessCondition(null)).toBe(false);
      expect(defaultSuccessCondition(undefined)).toBe(false);
    });
  });

  describe('retry function', () => {
    it('should succeed on first attempt if operation succeeds', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retry(operation);
      
      expect(operation).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(result.error).toBeUndefined();
    });

    it('should retry until success (within max attempts)', async () => {
      // Fail twice, then succeed
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce('success');
      
      const result = await retry(operation, { maxAttempts: 3 });
      
      expect(operation).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(3);
      expect(result.error).toBeUndefined();
      
      // Verify delays were applied
      expect(setTimeout).toHaveBeenCalledTimes(2);
    });

    it('should respect maximum retry attempts', async () => {
      // Always fail
      const error = new Error('Operation failed');
      const operation = jest.fn().mockRejectedValue(error);
      
      const result = await retry(operation, { maxAttempts: 3 });
      
      expect(operation).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(false);
      expect(result.result).toBeUndefined();
      expect(result.attempts).toBe(3);
      expect(result.error).toBe(error);
      
      // Verify delays were applied
      expect(setTimeout).toHaveBeenCalledTimes(2);
      
      // Explicitly advance timers to simulate time passing
      jest.advanceTimersByTime(100); // First retry delay
      jest.advanceTimersByTime(200); // Second retry delay
    });

    it('should apply exponential backoff between retries', async () => {
      // Always fail
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      
      // Use specific options to make delay calculations predictable
      const options: RetryOptions = {
        maxAttempts: 3,
        baseDelay: 100,
        jitter: 0 // Disable jitter for predictable delays
      };
      
      await retry(operation, options);
      
      // First retry should have delay of baseDelay (100ms)
      expect(setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
      
      // Second retry should have delay of baseDelay * 2^1 (200ms)
      expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    });

    it('should use custom retry condition when provided', async () => {
      // Create a custom retry condition that only retries for errors with code 'RETRY_ME'
      const retryCondition = jest.fn((error) => {
        return error.code === 'RETRY_ME';
      });
      
      // Create an operation that fails with different error codes
      const operation = jest.fn()
        .mockRejectedValueOnce({ message: 'Error 1', code: 'RETRY_ME' })
        .mockRejectedValueOnce({ message: 'Error 2', code: 'DONT_RETRY' })
        .mockResolvedValueOnce('success');
      
      const result = await retry(operation, { 
        maxAttempts: 3,
        retryCondition
      });
      
      // Should only retry once (after first error), then stop because second error doesn't match condition
      expect(operation).toHaveBeenCalledTimes(2);
      expect(retryCondition).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(2);
    });

    it('should use custom success condition when provided', async () => {
      // Create a custom success condition that only considers arrays with length > 0 as success
      const successCondition = jest.fn((result) => {
        return Array.isArray(result) && result.length > 0;
      });
      
      // Create an operation that returns different values
      const operation = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([1, 2, 3]);
      
      const result = await retry(operation, { 
        maxAttempts: 3,
        successCondition
      });
      
      // Should retry after first result (empty array), then succeed with second result
      expect(operation).toHaveBeenCalledTimes(2);
      expect(successCondition).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.result).toEqual([1, 2, 3]);
      expect(result.attempts).toBe(2);
    });

    it('should handle timeout option', async () => {
      // Create a mock for global.Promise.race to simulate timeout
      const originalRace = Promise.race;
      Promise.race = jest.fn().mockImplementation(async (promises) => {
        // Simulate timeout by rejecting with timeout error
        throw new Error('Operation timed out after 1000ms');
      });
      
      try {
        const operation = jest.fn().mockImplementation(() => {
          return new Promise(resolve => {
            // This would normally take longer than the timeout
            setTimeout(() => resolve('success'), 2000);
          });
        });
        
        const result = await retry(operation, { 
          maxAttempts: 2,
          timeout: 1000
        });
        
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('timed out');
      } finally {
        // Restore original Promise.race
        Promise.race = originalRace;
      }
    });

    it('should track and return attempt count and timing information', async () => {
      // Mock Date.now to return predictable values
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => {
        callCount++;
        // First call: start time, second call: end time (500ms later)
        return callCount === 1 ? 1000 : 1500;
      });
      
      try {
        const operation = jest.fn().mockResolvedValue('success');
        
        const result = await retry(operation);
        
        expect(result.attempts).toBe(1);
        expect(result.totalTimeMs).toBe(500);
      } finally {
        // Restore original Date.now
        Date.now = originalDateNow;
      }
    });

    it('should log retry attempts', async () => {
      // Always fail
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      
      await retry(operation, { 
        maxAttempts: 3,
        operationName: 'test-operation'
      });
      
      // Should log warnings for first and second attempts
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenNthCalledWith(
        1,
        'Operation failed, retrying (1/3)',
        expect.objectContaining({
          operation: 'test-operation',
          attempt: 1,
          maxAttempts: 3
        })
      );
      
      // Should log error for final failed attempt
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Retry failed after 3 attempts',
        expect.objectContaining({
          operation: 'test-operation',
          attempt: 3,
          maxAttempts: 3
        })
      );
    });

    it('should use custom logger when provided', async () => {
      // Create mock logger
      const mockLogger = {
        warn: jest.fn(),
        error: jest.fn()
      };
      
      // Always fail
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      
      await retry(operation, { 
        maxAttempts: 2,
        logger: mockLogger
      });
      
      // Should use custom logger
      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      
      // Should not use console
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should include journey and user IDs in logs when provided', async () => {
      // Always fail
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      
      await retry(operation, { 
        maxAttempts: 2,
        journeyId: 'journey-123',
        userId: 'user-456'
      });
      
      // Should include journey and user IDs in logs
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          journeyId: 'journey-123',
          userId: 'user-456'
        })
      );
    });
  });

  describe('retryForErrorTypes', () => {
    it('should only retry for specified error types', async () => {
      // Create an operation that fails with different error types
      const operation = jest.fn()
        .mockRejectedValueOnce(new AppError('External error', ErrorType.EXTERNAL))
        .mockRejectedValueOnce(new AppError('Technical error', ErrorType.TECHNICAL))
        .mockResolvedValueOnce('success');
      
      const result = await retryForErrorTypes(
        operation,
        [ErrorType.EXTERNAL, ErrorType.TECHNICAL],
        { maxAttempts: 3 }
      );
      
      // Should retry for both error types and succeed on third attempt
      expect(operation).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
    });

    it('should not retry for non-specified error types', async () => {
      // Create an operation that fails with different error types
      const operation = jest.fn()
        .mockRejectedValueOnce(new AppError('Validation error', ErrorType.VALIDATION))
        .mockResolvedValueOnce('success');
      
      const result = await retryForErrorTypes(
        operation,
        [ErrorType.EXTERNAL], // Only retry for EXTERNAL errors
        { maxAttempts: 3 }
      );
      
      // Should not retry for VALIDATION error
      expect(operation).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
    });
  });

  describe('withRetry', () => {
    it('should create a function that automatically retries', async () => {
      // Create a function that fails twice, then succeeds
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce('success');
      
      // Wrap with retry
      const wrappedFn = withRetry(fn, { maxAttempts: 3 });
      
      // Call wrapped function
      const result = await wrappedFn('arg1', 'arg2');
      
      // Should retry and eventually succeed
      expect(fn).toHaveBeenCalledTimes(3);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('success');
    });

    it('should throw error after max retries', async () => {
      // Create a function that always fails
      const error = new Error('Operation failed');
      const fn = jest.fn().mockRejectedValue(error);
      
      // Wrap with retry
      const wrappedFn = withRetry(fn, { maxAttempts: 2 });
      
      // Call wrapped function
      await expect(wrappedFn()).rejects.toThrow('Operation failed');
      
      // Should have attempted maxAttempts times
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('circuitBreakerWithRetry', () => {
    it('should retry operations within circuit breaker', async () => {
      // Create a function that fails once, then succeeds
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockResolvedValueOnce('success');
      
      const result = await circuitBreakerWithRetry(operation, {
        maxAttempts: 2,
        failureThreshold: 3
      });
      
      // Should retry and succeed
      expect(operation).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');
    });

    it('should open circuit after failure threshold', async () => {
      // Create a function that always fails
      const error = new Error('Operation failed');
      const operation = jest.fn().mockRejectedValue(error);
      
      // Mock Date.now to return consistent values for testing
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(1000);
      
      try {
        // First call - should fail but not open circuit yet
        await expect(circuitBreakerWithRetry(operation, {
          maxAttempts: 1,
          failureThreshold: 2
        })).rejects.toThrow('Operation failed');
        
        // Second call - should fail and open circuit
        await expect(circuitBreakerWithRetry(operation, {
          maxAttempts: 1,
          failureThreshold: 2
        })).rejects.toThrow('Operation failed');
        
        // Third call - circuit should be open
        await expect(circuitBreakerWithRetry(operation, {
          maxAttempts: 1,
          failureThreshold: 2,
          resetTimeout: 30000
        })).rejects.toThrow('Circuit breaker is open');
        
        // Operation should only have been called twice (not on third call)
        expect(operation).toHaveBeenCalledTimes(2);
      } finally {
        // Restore original Date.now
        Date.now = originalDateNow;
      }
    });

    it('should reset circuit after timeout', async () => {
      // Create a function that always fails
      const error = new Error('Operation failed');
      const operation = jest.fn().mockRejectedValue(error);
      
      // Mock Date.now to simulate time passing
      const originalDateNow = Date.now;
      let currentTime = 1000;
      Date.now = jest.fn(() => currentTime);
      
      try {
        // First two calls - fail and open circuit
        await expect(circuitBreakerWithRetry(operation, {
          maxAttempts: 1,
          failureThreshold: 2,
          resetTimeout: 5000
        })).rejects.toThrow();
        
        await expect(circuitBreakerWithRetry(operation, {
          maxAttempts: 1,
          failureThreshold: 2,
          resetTimeout: 5000
        })).rejects.toThrow();
        
        // Third call - circuit should be open
        await expect(circuitBreakerWithRetry(operation, {
          maxAttempts: 1,
          failureThreshold: 2,
          resetTimeout: 5000
        })).rejects.toThrow('Circuit breaker is open');
        
        // Simulate time passing beyond reset timeout
        currentTime += 6000; // 6 seconds later
        
        // Fourth call - circuit should be half-open and allow the call
        await expect(circuitBreakerWithRetry(operation, {
          maxAttempts: 1,
          failureThreshold: 2,
          resetTimeout: 5000
        })).rejects.toThrow('Operation failed');
        
        // Operation should have been called 3 times (not on third call when circuit was open)
        expect(operation).toHaveBeenCalledTimes(3);
      } finally {
        // Restore original Date.now
        Date.now = originalDateNow;
      }
    });
  });
});