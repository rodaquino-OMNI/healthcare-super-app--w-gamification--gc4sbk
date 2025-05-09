import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Retry, RetryWithBackoff, RetryDatabase, RetryExternalApi, RetryHealthIntegration } from '../../../src/decorators/retry.decorator';
import { BackoffStrategy } from '../../../src/decorators/types';
import { BaseError, ErrorType } from '../../../src/base';

// Mock the Logger to avoid console output during tests
jest.mock('@nestjs/common', () => {
  const original = jest.requireActual('@nestjs/common');
  return {
    ...original,
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn()
    }))
  };
});

/**
 * Custom error class for testing error type filtering
 */
class TestTransientError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.TECHNICAL, 'TEST_001', {});
  }
}

/**
 * Custom error class for testing error type filtering
 */
class TestPermanentError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.BUSINESS, 'TEST_002', {});
  }

  // Override isRetryable to always return false
  isRetryable(): boolean {
    return false;
  }
}

/**
 * Mock service with retryable methods for testing the retry decorators
 */
class MockService {
  public attemptCount = 0;
  public onRetryCallCount = 0;
  public lastError: Error | null = null;
  public lastDelay = 0;
  public delayTimestamps: number[] = [];

  /**
   * Resets the service state for a new test
   */
  reset() {
    this.attemptCount = 0;
    this.onRetryCallCount = 0;
    this.lastError = null;
    this.lastDelay = 0;
    this.delayTimestamps = [];
  }

  /**
   * Method that fails a specified number of times before succeeding
   * @param failCount - Number of times to fail before succeeding
   * @param errorType - Type of error to throw (transient or permanent)
   * @returns A success message
   */
  @Retry({ maxAttempts: 5, baseDelay: 100 })
  async failThenSucceed(failCount: number, errorType: 'transient' | 'permanent' = 'transient'): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      if (errorType === 'transient') {
        throw new TestTransientError(`Attempt ${this.attemptCount} failed`);
      } else {
        throw new TestPermanentError(`Attempt ${this.attemptCount} failed`);
      }
    }
    
    return 'Success';
  }

  /**
   * Method that always fails with a transient error
   * @returns Never resolves
   */
  @Retry({ maxAttempts: 3, baseDelay: 100 })
  async alwaysFail(): Promise<string> {
    this.attemptCount++;
    throw new TestTransientError(`Attempt ${this.attemptCount} failed`);
  }

  /**
   * Method that fails with a permanent error (non-retryable)
   * @returns Never resolves
   */
  @Retry({ maxAttempts: 3, baseDelay: 100 })
  async failWithPermanentError(): Promise<string> {
    this.attemptCount++;
    throw new TestPermanentError('Permanent error');
  }

  /**
   * Method that uses RetryWithBackoff for exponential backoff
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message
   */
  @RetryWithBackoff({ 
    maxAttempts: 5, 
    baseDelay: 100,
    onRetry: function(this: MockService, error: Error, attempt: number, delay: number) {
      this.delayTimestamps.push(delay);
    }
  })
  async failWithBackoff(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Attempt ${this.attemptCount} failed`);
    }
    
    return 'Success';
  }

  /**
   * Method that uses RetryWithBackoff with custom jitter
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message
   */
  @RetryWithBackoff({ 
    maxAttempts: 5, 
    baseDelay: 100, 
    jitter: 0.5,
    onRetry: function(this: MockService, error: Error, attempt: number, delay: number) {
      this.delayTimestamps.push(delay);
    }
  })
  async failWithJitter(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Attempt ${this.attemptCount} failed`);
    }
    
    return 'Success';
  }

  /**
   * Method that uses Retry with a custom onRetry callback
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message
   */
  @Retry({
    maxAttempts: 5,
    baseDelay: 100,
    onRetry: function(this: MockService, error: Error, attempt: number, delay: number) {
      this.onRetryCallCount++;
      this.lastError = error;
      this.lastDelay = delay;
    }
  })
  async failWithCallback(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Attempt ${this.attemptCount} failed`);
    }
    
    return 'Success';
  }

  /**
   * Method that uses Retry with specific error type filtering
   * @param failCount - Number of times to fail before succeeding
   * @param errorType - Type of error to throw
   * @returns A success message
   */
  @Retry({
    maxAttempts: 5,
    baseDelay: 100,
    retryableErrors: [ErrorType.TECHNICAL]
  })
  async failWithErrorFiltering(failCount: number, errorType: 'transient' | 'permanent'): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      if (errorType === 'transient') {
        throw new TestTransientError(`Attempt ${this.attemptCount} failed`);
      } else {
        throw new TestPermanentError(`Attempt ${this.attemptCount} failed`);
      }
    }
    
    return 'Success';
  }

  /**
   * Method that uses Retry with a custom shouldRetry function
   * @param failCount - Number of times to fail before succeeding
   * @param errorType - Type of error to throw
   * @returns A success message
   */
  @Retry({
    maxAttempts: 5,
    baseDelay: 100,
    shouldRetry: (error: Error) => error instanceof TestTransientError
  })
  async failWithCustomRetryCheck(failCount: number, errorType: 'transient' | 'permanent'): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      if (errorType === 'transient') {
        throw new TestTransientError(`Attempt ${this.attemptCount} failed`);
      } else {
        throw new TestPermanentError(`Attempt ${this.attemptCount} failed`);
      }
    }
    
    return 'Success';
  }

  /**
   * Method that uses RetryDatabase specialized decorator
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message
   */
  @RetryDatabase({
    onRetry: function(this: MockService, error: Error, attempt: number, delay: number) {
      this.delayTimestamps.push(delay);
    }
  })
  async failWithDatabaseRetry(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Database error on attempt ${this.attemptCount}`);
    }
    
    return 'Success';
  }

  /**
   * Method that uses RetryExternalApi specialized decorator
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message
   */
  @RetryExternalApi({
    onRetry: function(this: MockService, error: Error, attempt: number, delay: number) {
      this.delayTimestamps.push(delay);
    }
  })
  async failWithExternalApiRetry(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`API error on attempt ${this.attemptCount}`);
    }
    
    return 'Success';
  }
}

describe('Retry Decorators', () => {
  let mockService: MockService;

  beforeEach(() => {
    // Reset the mock timer before each test
    jest.useFakeTimers();
    
    // Create a new instance of the service
    mockService = new MockService();
    
    // Bind the service instance to the onRetry callback
    const originalFailWithCallback = mockService.failWithCallback;
    mockService.failWithCallback = function(this: MockService, ...args: any[]) {
      return originalFailWithCallback.apply(this, args);
    };
  });

  afterEach(() => {
    // Restore the real timer after each test
    jest.useRealTimers();
  });

  describe('Retry Decorator', () => {
    it('should retry until success and return the result', async () => {
      // Arrange
      const failCount = 2;
      
      // Act
      const promise = mockService.failThenSucceed(failCount);
      
      // Advance timers to handle all retries
      for (let i = 0; i < failCount; i++) {
        await jest.advanceTimersByTimeAsync(100);
      }
      
      const result = await promise;
      
      // Assert
      expect(result).toBe('Success');
      expect(mockService.attemptCount).toBe(failCount + 1); // Initial attempt + retries
    });

    it('should stop retrying after maxAttempts and throw the last error', async () => {
      // Arrange
      const maxAttempts = 3;
      
      // Act & Assert
      const promise = mockService.alwaysFail();
      
      // Advance timers to handle all retries
      for (let i = 0; i < maxAttempts - 1; i++) {
        await jest.advanceTimersByTimeAsync(100);
      }
      
      await expect(promise).rejects.toThrow('Attempt 3 failed');
      expect(mockService.attemptCount).toBe(maxAttempts);
    });

    it('should not retry on non-retryable errors', async () => {
      // Act & Assert
      await expect(mockService.failWithPermanentError()).rejects.toThrow('Permanent error');
      expect(mockService.attemptCount).toBe(1); // Only the initial attempt, no retries
    });

    it('should only retry on specified error types', async () => {
      // Arrange
      const failCount = 2;
      
      // Act & Assert - Should retry on transient errors
      mockService.reset();
      const promise1 = mockService.failWithErrorFiltering(failCount, 'transient');
      
      // Advance timers to handle all retries
      for (let i = 0; i < failCount; i++) {
        await jest.advanceTimersByTimeAsync(100);
      }
      
      const result1 = await promise1;
      expect(result1).toBe('Success');
      expect(mockService.attemptCount).toBe(failCount + 1);
      
      // Act & Assert - Should not retry on permanent errors
      mockService.reset();
      await expect(mockService.failWithErrorFiltering(failCount, 'permanent')).rejects.toThrow();
      expect(mockService.attemptCount).toBe(1); // Only the initial attempt, no retries
    });

    it('should use custom shouldRetry function when provided', async () => {
      // Arrange
      const failCount = 2;
      
      // Act & Assert - Should retry on transient errors
      mockService.reset();
      const promise1 = mockService.failWithCustomRetryCheck(failCount, 'transient');
      
      // Advance timers to handle all retries
      for (let i = 0; i < failCount; i++) {
        await jest.advanceTimersByTimeAsync(100);
      }
      
      const result1 = await promise1;
      expect(result1).toBe('Success');
      expect(mockService.attemptCount).toBe(failCount + 1);
      
      // Act & Assert - Should not retry on permanent errors
      mockService.reset();
      await expect(mockService.failWithCustomRetryCheck(failCount, 'permanent')).rejects.toThrow();
      expect(mockService.attemptCount).toBe(1); // Only the initial attempt, no retries
    });

    it('should call onRetry callback with error, attempt, and delay information', async () => {
      // Arrange
      const failCount = 2;
      
      // Act
      const promise = mockService.failWithCallback(failCount);
      
      // Advance timers to handle all retries
      for (let i = 0; i < failCount; i++) {
        await jest.advanceTimersByTimeAsync(100);
      }
      
      await promise;
      
      // Assert
      expect(mockService.onRetryCallCount).toBe(failCount);
      expect(mockService.lastError).toBeInstanceOf(TestTransientError);
      expect(mockService.lastDelay).toBe(100); // Fixed delay for Retry
    });
  });

  describe('Specialized Retry Decorators', () => {
    it('should use database-specific retry configuration', async () => {
      // Arrange
      const failCount = 2;
      
      // Act
      const promise = mockService.failWithDatabaseRetry(failCount);
      
      // Advance timers to handle all retries
      // Database retry uses exponential backoff by default
      for (let i = 0; i < failCount; i++) {
        // Use a large enough time to cover any backoff
        await jest.advanceTimersByTimeAsync(1000);
      }
      
      const result = await promise;
      
      // Assert
      expect(result).toBe('Success');
      expect(mockService.attemptCount).toBe(failCount + 1);
      expect(mockService.delayTimestamps.length).toBe(failCount);
    });
    
    it('should use external API-specific retry configuration', async () => {
      // Arrange
      const failCount = 2;
      
      // Act
      const promise = mockService.failWithExternalApiRetry(failCount);
      
      // Advance timers to handle all retries
      // External API retry uses exponential backoff by default
      for (let i = 0; i < failCount; i++) {
        // Use a large enough time to cover any backoff
        await jest.advanceTimersByTimeAsync(3000);
      }
      
      const result = await promise;
      
      // Assert
      expect(result).toBe('Success');
      expect(mockService.attemptCount).toBe(failCount + 1);
      expect(mockService.delayTimestamps.length).toBe(failCount);
    });
  });

  describe('RetryWithBackoff Decorator', () => {
    it('should retry with exponential backoff until success', async () => {
      // Arrange
      const failCount = 3;
      
      // Act
      const promise = mockService.failWithBackoff(failCount);
      
      // Advance timers to handle all retries with exponential backoff
      // First retry: 100ms
      // Second retry: 200ms (100ms * 2^1)
      // Third retry: 400ms (100ms * 2^2)
      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(200);
      await jest.advanceTimersByTimeAsync(400);
      
      const result = await promise;
      
      // Assert
      expect(result).toBe('Success');
      expect(mockService.attemptCount).toBe(failCount + 1);
      
      // Verify exponential backoff delays
      expect(mockService.delayTimestamps.length).toBe(failCount);
      expect(mockService.delayTimestamps[0]).toBeCloseTo(100, -1); // First retry ~100ms
      expect(mockService.delayTimestamps[1]).toBeCloseTo(200, -1); // Second retry ~200ms
      expect(mockService.delayTimestamps[2]).toBeCloseTo(400, -1); // Third retry ~400ms
    });

    it('should apply jitter to retry delays when configured', async () => {
      // This test is more about verifying the implementation than exact timing
      // since jitter adds randomness
      
      // Arrange
      const failCount = 2;
      
      // Act
      const promise = mockService.failWithJitter(failCount);
      
      // Advance timers with a buffer to account for jitter
      // With 50% jitter on 100ms, the delay could be between 75-125ms
      await jest.advanceTimersByTimeAsync(150);
      await jest.advanceTimersByTimeAsync(300); // Buffer for second retry with jitter
      
      const result = await promise;
      
      // Assert
      expect(result).toBe('Success');
      expect(mockService.attemptCount).toBe(failCount + 1);
      
      // Verify jitter was applied
      expect(mockService.delayTimestamps.length).toBe(failCount);
      
      // With 50% jitter on 100ms, the delay should be between 75-125ms
      const firstDelay = mockService.delayTimestamps[0];
      expect(firstDelay).toBeGreaterThanOrEqual(50); // 100ms - 50%
      expect(firstDelay).toBeLessThanOrEqual(150); // 100ms + 50%
      
      // With 50% jitter on 200ms (second retry), the delay should be between 150-250ms
      const secondDelay = mockService.delayTimestamps[1];
      expect(secondDelay).toBeGreaterThanOrEqual(100); // 200ms - 50%
      expect(secondDelay).toBeLessThanOrEqual(300); // 200ms + 50%
    });

    it('should stop retrying after maxAttempts with exponential backoff', async () => {
      // Arrange
      mockService.reset();
      const maxAttempts = 3;
      
      // Act & Assert
      const promise = mockService.failWithBackoff(maxAttempts + 1); // Ensure it always fails
      
      // Advance timers to handle all retries with exponential backoff
      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(200);
      
      await expect(promise).rejects.toThrow('Attempt 3 failed');
      expect(mockService.attemptCount).toBe(maxAttempts);
    });
  });
});