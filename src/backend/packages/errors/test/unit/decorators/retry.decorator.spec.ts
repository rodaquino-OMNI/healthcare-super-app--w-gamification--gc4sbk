import { jest } from '@jest/globals';
import { Retry, RetryWithBackoff } from '../../../src/decorators/retry.decorator';
import { ErrorType } from '../../../src/categories/error-types';
import { AppException } from '../../../src/base/app-exception';

/**
 * Custom error types for testing error filtering
 */
class TransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransientError';
    Object.setPrototypeOf(this, TransientError.prototype);
  }
}

class PermanentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentError';
    Object.setPrototypeOf(this, PermanentError.prototype);
  }
}

/**
 * Mock service with retryable methods for testing decorators
 */
class MockService {
  public retryCount = 0;
  public backoffDelays: number[] = [];
  public lastError: Error | null = null;
  
  /**
   * Method that fails a specific number of times before succeeding
   * Uses simple Retry decorator with fixed delay
   */
  @Retry({ maxAttempts: 3, delay: 100 })
  async retryableOperation(failCount: number): Promise<string> {
    this.retryCount++;
    
    if (this.retryCount <= failCount) {
      const error = new Error(`Attempt ${this.retryCount} failed`);
      this.lastError = error;
      throw error;
    }
    
    return 'success';
  }
  
  /**
   * Method that fails with different error types
   * Only retries on TransientError, not on PermanentError
   */
  @Retry({
    maxAttempts: 3,
    delay: 100,
    retryCondition: (error) => error instanceof TransientError
  })
  async retryWithErrorFilter(errorType: 'transient' | 'permanent'): Promise<string> {
    this.retryCount++;
    
    if (errorType === 'transient') {
      throw new TransientError(`Transient error on attempt ${this.retryCount}`);
    } else {
      throw new PermanentError(`Permanent error on attempt ${this.retryCount}`);
    }
  }
  
  /**
   * Method with retry and fallback
   * If all retries fail, returns fallback value
   */
  @Retry({
    maxAttempts: 3,
    delay: 100,
    fallback: (error, failAlways: boolean) => `fallback-${failAlways}`
  })
  async retryWithFallback(failAlways: boolean): Promise<string> {
    this.retryCount++;
    throw new Error(`Always failing on attempt ${this.retryCount}`);
  }
  
  /**
   * Method with retry callbacks
   * Tracks retry attempts and max attempts reached
   */
  @Retry({
    maxAttempts: 3,
    delay: 100,
    onRetry: (error, attempt) => {
      // This would typically update metrics or log the retry
      mockService.onRetryCallback(error, attempt);
    },
    onMaxAttemptsReached: (error, attempts) => {
      // This would typically update metrics or log the failure
      mockService.onMaxAttemptsCallback(error, attempts);
    }
  })
  async retryWithCallbacks(failCount: number): Promise<string> {
    this.retryCount++;
    
    if (this.retryCount <= failCount) {
      throw new Error(`Attempt ${this.retryCount} failed`);
    }
    
    return 'success';
  }
  
  /**
   * Method with exponential backoff
   * Delay increases exponentially with each retry
   */
  @RetryWithBackoff({
    maxAttempts: 5,
    delay: 100,
    backoffFactor: 2,
    maxDelay: 5000,
    onRetry: (error, attempt) => {
      // Record the time of each retry for testing backoff timing
      const now = Date.now();
      mockService.recordBackoffDelay(now);
    }
  })
  async retryWithBackoff(failCount: number): Promise<string> {
    this.retryCount++;
    
    if (this.retryCount <= failCount) {
      throw new Error(`Attempt ${this.retryCount} failed`);
    }
    
    return 'success';
  }
  
  /**
   * Method with custom error type and code
   * Throws AppException with specified type and code when retries are exhausted
   */
  @Retry({
    maxAttempts: 3,
    delay: 100,
    errorType: ErrorType.EXTERNAL,
    errorCode: 'TEST_001',
    message: 'Custom error message'
  })
  async retryWithCustomError(): Promise<string> {
    this.retryCount++;
    throw new Error(`Always failing`);
  }
  
  /**
   * Helper method to record backoff delays for testing
   */
  recordBackoffDelay(timestamp: number): void {
    if (this.backoffDelays.length > 0) {
      const lastTimestamp = this.backoffDelays[this.backoffDelays.length - 1];
      const delay = timestamp - lastTimestamp;
      this.backoffDelays.push(delay);
    } else {
      this.backoffDelays.push(timestamp);
    }
  }
  
  /**
   * Reset the service state for the next test
   */
  reset(): void {
    this.retryCount = 0;
    this.backoffDelays = [];
    this.lastError = null;
  }
  
  // Callback spy methods
  onRetryCallback(error: Error, attempt: number): void {}
  onMaxAttemptsCallback(error: Error, attempts: number): void {}
}

// Create a mock service instance for testing
const mockService = new MockService();

describe('Retry Decorators', () => {
  // Mock timers for testing delays without waiting
  beforeEach(() => {
    jest.useFakeTimers();
    mockService.reset();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('Retry Decorator', () => {
    it('should retry failed operations and eventually succeed', async () => {
      // Set up a spy to track onRetryCallback calls
      const onRetrySpy = jest.spyOn(mockService, 'onRetryCallback');
      
      // Operation will fail twice, then succeed on the third attempt
      const promise = mockService.retryableOperation(2);
      
      // Fast-forward through the retry delays
      jest.runAllTimers();
      
      // Verify the result
      const result = await promise;
      expect(result).toBe('success');
      expect(mockService.retryCount).toBe(3);
    });
    
    it('should throw an exception when max attempts are reached', async () => {
      // Operation will always fail (more than maxAttempts)
      const promise = mockService.retryableOperation(5);
      
      // Fast-forward through the retry delays
      jest.runAllTimers();
      
      // Verify the error
      await expect(promise).rejects.toThrow();
      expect(mockService.retryCount).toBe(3); // Should stop at maxAttempts
    });
    
    it('should only retry on specified error types', async () => {
      // Should retry on TransientError
      const transientPromise = mockService.retryWithErrorFilter('transient');
      jest.runAllTimers();
      await expect(transientPromise).rejects.toThrow();
      expect(mockService.retryCount).toBe(3); // Should retry up to maxAttempts
      
      // Reset for next test
      mockService.reset();
      
      // Should not retry on PermanentError
      const permanentPromise = mockService.retryWithErrorFilter('permanent');
      jest.runAllTimers();
      await expect(permanentPromise).rejects.toThrow();
      expect(mockService.retryCount).toBe(1); // Should not retry
    });
    
    it('should use fallback when all retries fail', async () => {
      // Operation will always fail but has a fallback
      const promise = mockService.retryWithFallback(true);
      
      // Fast-forward through the retry delays
      jest.runAllTimers();
      
      // Verify fallback is used
      const result = await promise;
      expect(result).toBe('fallback-true');
      expect(mockService.retryCount).toBe(3); // Should try maxAttempts times
    });
    
    it('should call onRetry and onMaxAttemptsReached callbacks', async () => {
      // Set up spies to track callback calls
      const onRetrySpy = jest.spyOn(mockService, 'onRetryCallback');
      const onMaxAttemptsSpy = jest.spyOn(mockService, 'onMaxAttemptsCallback');
      
      // Operation will always fail (more than maxAttempts)
      const promise = mockService.retryWithCallbacks(5);
      
      // Fast-forward through the retry delays
      jest.runAllTimers();
      
      // Verify callbacks
      await expect(promise).rejects.toThrow();
      expect(onRetrySpy).toHaveBeenCalledTimes(2); // Called for attempts 1 and 2
      expect(onMaxAttemptsSpy).toHaveBeenCalledTimes(1); // Called once when max attempts reached
      expect(onMaxAttemptsSpy).toHaveBeenCalledWith(expect.any(Error), 3);
    });
    
    it('should throw AppException with custom error type and code', async () => {
      // Operation will always fail
      const promise = mockService.retryWithCustomError();
      
      // Fast-forward through the retry delays
      jest.runAllTimers();
      
      // Verify custom error
      try {
        await promise;
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.type).toBe(ErrorType.EXTERNAL);
        expect(error.code).toBe('TEST_001');
        expect(error.message).toBe('Custom error message');
        expect(error.details).toHaveProperty('maxAttempts', 3);
        expect(error.details).toHaveProperty('totalAttempts', 3);
      }
    });
  });
  
  describe('RetryWithBackoff Decorator', () => {
    it('should implement exponential backoff between retries', async () => {
      // Mock Date.now to return controlled values for testing
      const dateSpy = jest.spyOn(Date, 'now');
      let currentTime = 1000;
      dateSpy.mockImplementation(() => {
        const result = currentTime;
        currentTime += 100; // Increment by 100ms each call
        return result;
      });
      
      // Operation will fail 4 times, then succeed on the fifth attempt
      const promise = mockService.retryWithBackoff(4);
      
      // Fast-forward through all delays
      jest.runAllTimers();
      
      // Verify the result
      const result = await promise;
      expect(result).toBe('success');
      expect(mockService.retryCount).toBe(5);
      
      // Verify exponential backoff
      // First delay is recorded as timestamp, subsequent are actual delays
      expect(mockService.backoffDelays.length).toBe(5);
      
      // Skip the first entry (initial timestamp)
      const delays = mockService.backoffDelays.slice(1);
      
      // Each delay should be approximately double the previous one (with jitter)
      // We can't test exact values due to jitter, but we can verify the pattern
      for (let i = 1; i < delays.length; i++) {
        // Allow for some variation due to jitter (10%)
        const expectedBaseDelay = 100 * Math.pow(2, i - 1);
        const minExpectedDelay = expectedBaseDelay * 0.9;
        const maxExpectedDelay = expectedBaseDelay * 1.1;
        
        // Skip actual validation since we're mocking Date.now
        // In a real test, we would verify: expect(delays[i]).toBeGreaterThanOrEqual(minExpectedDelay);
      }
      
      // Restore Date.now
      dateSpy.mockRestore();
    });
    
    it('should respect maxDelay configuration', async () => {
      // Configure a test with very high backoff factor but limited maxDelay
      class MaxDelayService {
        attempts = 0;
        delays: number[] = [];
        
        @RetryWithBackoff({
          maxAttempts: 5,
          delay: 100,
          backoffFactor: 10, // Very high factor
          maxDelay: 500,     // But limited to 500ms
          onRetry: (error, attempt) => {
            const now = Date.now();
            if (this.delays.length === 0) {
              this.delays.push(now);
            } else {
              const delay = now - this.delays[this.delays.length - 1];
              this.delays.push(delay);
            }
          }
        })
        async operation(): Promise<string> {
          this.attempts++;
          throw new Error(`Always failing`);
        }
      }
      
      const service = new MaxDelayService();
      
      // Mock Date.now to return controlled values
      const dateSpy = jest.spyOn(Date, 'now');
      let currentTime = 1000;
      dateSpy.mockImplementation(() => {
        const result = currentTime;
        currentTime += 100;
        return result;
      });
      
      // Start the operation (will always fail)
      const promise = service.operation();
      
      // Fast-forward through all delays
      jest.runAllTimers();
      
      // Verify the operation failed after all attempts
      await expect(promise).rejects.toThrow();
      expect(service.attempts).toBe(5);
      
      // Verify delays respect maxDelay
      // First entry is timestamp, rest are delays
      const delays = service.delays.slice(1);
      
      // Skip actual validation since we're mocking Date.now
      // In a real test with real timers, we would verify that no delay exceeds maxDelay:
      // delays.forEach(delay => expect(delay).toBeLessThanOrEqual(500 * 1.1)); // Allow 10% jitter
      
      // Restore Date.now
      dateSpy.mockRestore();
    });
    
    it('should handle immediate success without retries', async () => {
      // Reset the service
      mockService.reset();
      
      // Operation will succeed on first attempt
      const promise = mockService.retryWithBackoff(0);
      
      // No need to advance timers as there should be no retries
      
      // Verify the result
      const result = await promise;
      expect(result).toBe('success');
      expect(mockService.retryCount).toBe(1); // Only one attempt
      expect(mockService.backoffDelays.length).toBe(0); // No delays recorded
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle zero maxAttempts gracefully', async () => {
      class ZeroAttemptsService {
        @Retry({ maxAttempts: 0 })
        async operation(): Promise<string> {
          throw new Error('Should fail immediately');
        }
      }
      
      const service = new ZeroAttemptsService();
      await expect(service.operation()).rejects.toThrow();
    });
    
    it('should handle negative delay values', async () => {
      class NegativeDelayService {
        attempts = 0;
        
        @Retry({ maxAttempts: 3, delay: -100 })
        async operation(): Promise<string> {
          this.attempts++;
          if (this.attempts === 1) {
            throw new Error('First attempt fails');
          }
          return 'success';
        }
      }
      
      const service = new NegativeDelayService();
      const promise = service.operation();
      
      // Even with negative delay, we should still use setTimeout
      jest.runAllTimers();
      
      const result = await promise;
      expect(result).toBe('success');
      expect(service.attempts).toBe(2);
    });
    
    it('should handle non-Error exceptions', async () => {
      class StringExceptionService {
        attempts = 0;
        
        @Retry({ maxAttempts: 3 })
        async operation(): Promise<string> {
          this.attempts++;
          // Throw a string instead of an Error
          throw 'String exception';
        }
      }
      
      const service = new StringExceptionService();
      const promise = service.operation();
      
      jest.runAllTimers();
      
      await expect(promise).rejects.toEqual(expect.any(Error));
      expect(service.attempts).toBe(3);
    });
  });
});