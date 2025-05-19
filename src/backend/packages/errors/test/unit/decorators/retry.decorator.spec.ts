import { Test } from '@nestjs/testing';
import { jest } from '@jest/globals';

// Import the decorators to test
import { Retry, RetryWithBackoff } from '../../../src/decorators/retry.decorator';
import { AppException, ErrorType } from '../../../src/categories/app.exception';

/**
 * Mock service with methods that can be decorated with retry logic
 */
class MockService {
  // Track method calls for verification
  public callCount = 0;
  public callTimestamps: number[] = [];

  // Reset tracking data
  public reset(): void {
    this.callCount = 0;
    this.callTimestamps = [];
  }

  /**
   * Method that fails a specific number of times before succeeding
   * @param failCount Number of times to fail before succeeding
   * @param errorType Type of error to throw (for filtering tests)
   */
  @Retry({ attempts: 5 })
  public async retryableMethodWithFixedAttempts(failCount: number, errorType: ErrorType = ErrorType.TECHNICAL): Promise<string> {
    this.callCount++;
    this.callTimestamps.push(Date.now());

    if (this.callCount <= failCount) {
      throw new AppException(
        `Simulated failure ${this.callCount}/${failCount}`,
        errorType,
        'TEST_ERROR',
        { attempt: this.callCount }
      );
    }

    return 'success';
  }

  /**
   * Method that uses RetryWithBackoff for exponential backoff
   */
  @RetryWithBackoff({
    attempts: 5,
    baseDelay: 50,
    maxDelay: 1000,
    jitter: true,
    errorFilter: (error) => error instanceof AppException && error.type === ErrorType.EXTERNAL
  })
  public async retryableMethodWithBackoff(failCount: number, errorType: ErrorType = ErrorType.EXTERNAL): Promise<string> {
    this.callCount++;
    this.callTimestamps.push(Date.now());

    if (this.callCount <= failCount) {
      throw new AppException(
        `Simulated failure ${this.callCount}/${failCount}`,
        errorType,
        'TEST_ERROR',
        { attempt: this.callCount }
      );
    }

    return 'success';
  }

  /**
   * Method that always fails to test maximum retry attempts
   */
  @Retry({ attempts: 3 })
  public async alwaysFailingMethod(): Promise<string> {
    this.callCount++;
    this.callTimestamps.push(Date.now());

    throw new AppException(
      `Simulated failure ${this.callCount}`,
      ErrorType.TECHNICAL,
      'TEST_ERROR',
      { attempt: this.callCount }
    );
  }

  /**
   * Method with error filtering to only retry on specific error types
   */
  @Retry({
    attempts: 3,
    errorFilter: (error) => error instanceof AppException && error.type === ErrorType.EXTERNAL
  })
  public async methodWithErrorFilter(errorType: ErrorType): Promise<string> {
    this.callCount++;
    this.callTimestamps.push(Date.now());

    throw new AppException(
      `Simulated failure with type ${errorType}`,
      errorType,
      'TEST_ERROR',
      { attempt: this.callCount }
    );
  }
}

describe('Retry Decorators', () => {
  let mockService: MockService;

  beforeEach(async () => {
    // Create a NestJS testing module with our mock service
    const moduleRef = await Test.createTestingModule({
      providers: [MockService],
    }).compile();

    mockService = moduleRef.get<MockService>(MockService);
    mockService.reset();

    // Mock Date.now to control timing in tests
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Retry Decorator', () => {
    it('should retry until success and return the successful result', async () => {
      // Method will fail twice, then succeed on the third attempt
      const result = await mockService.retryableMethodWithFixedAttempts(2);

      expect(result).toBe('success');
      expect(mockService.callCount).toBe(3); // Initial attempt + 2 retries
    });

    it('should stop retrying after reaching maximum attempts', async () => {
      // Method will always fail, should retry 3 times total (initial + 2 retries)
      await expect(mockService.alwaysFailingMethod()).rejects.toThrow('Simulated failure 3');
      expect(mockService.callCount).toBe(3); // Initial attempt + 2 retries
    });

    it('should only retry on errors that match the filter', async () => {
      // Should retry because EXTERNAL errors match the filter
      await expect(mockService.methodWithErrorFilter(ErrorType.EXTERNAL)).rejects.toThrow();
      expect(mockService.callCount).toBe(3); // Initial attempt + 2 retries

      // Reset for next test
      mockService.reset();

      // Should not retry because VALIDATION errors don't match the filter
      await expect(mockService.methodWithErrorFilter(ErrorType.VALIDATION)).rejects.toThrow();
      expect(mockService.callCount).toBe(1); // Only the initial attempt, no retries
    });
  });

  describe('RetryWithBackoff Decorator', () => {
    it('should retry with exponential backoff until success', async () => {
      // Mock Date.now to return incremental values for timestamp tracking
      let currentTime = 1000;
      jest.spyOn(Date, 'now').mockImplementation(() => {
        const time = currentTime;
        currentTime += 100; // Increment by 100ms each call
        return time;
      });

      // Method will fail twice, then succeed on the third attempt
      const result = await mockService.retryableMethodWithBackoff(2);

      expect(result).toBe('success');
      expect(mockService.callCount).toBe(3); // Initial attempt + 2 retries

      // Verify timestamps show increasing delays between retries
      const intervals = [];
      for (let i = 1; i < mockService.callTimestamps.length; i++) {
        intervals.push(mockService.callTimestamps[i] - mockService.callTimestamps[i - 1]);
      }

      // First interval should be around baseDelay (50ms)
      // Second interval should be around 2*baseDelay (100ms)
      // With jitter, there will be some variation
      expect(intervals[0]).toBeGreaterThan(0);
      expect(intervals[1]).toBeGreaterThan(intervals[0]); // Second delay should be longer than first
    });

    it('should only retry on errors that match the filter', async () => {
      // Should retry because EXTERNAL errors match the filter
      await expect(mockService.retryableMethodWithBackoff(5, ErrorType.EXTERNAL)).rejects.toThrow();
      expect(mockService.callCount).toBe(5); // Initial attempt + 4 retries

      // Reset for next test
      mockService.reset();

      // Should not retry because VALIDATION errors don't match the filter
      await expect(mockService.retryableMethodWithBackoff(5, ErrorType.VALIDATION)).rejects.toThrow();
      expect(mockService.callCount).toBe(1); // Only the initial attempt, no retries
    });

    it('should respect maxDelay configuration', async () => {
      // Create a custom mock service with a very high baseDelay
      class CustomMockService {
        public callCount = 0;
        public callTimestamps: number[] = [];

        @RetryWithBackoff({
          attempts: 5,
          baseDelay: 2000, // High base delay
          maxDelay: 3000,  // But max delay caps it
          jitter: false    // No jitter for predictable testing
        })
        public async highDelayMethod(): Promise<string> {
          this.callCount++;
          this.callTimestamps.push(Date.now());

          if (this.callCount <= 3) {
            throw new AppException(
              `Simulated failure ${this.callCount}`,
              ErrorType.EXTERNAL,
              'TEST_ERROR'
            );
          }

          return 'success';
        }
      }

      const customService = new CustomMockService();

      // Mock Date.now for timestamp tracking
      let currentTime = 1000;
      jest.spyOn(Date, 'now').mockImplementation(() => {
        const time = currentTime;
        currentTime += 1000; // Increment by 1 second each call
        return time;
      });

      // Execute the method
      await customService.highDelayMethod();

      // Calculate intervals between calls
      const intervals = [];
      for (let i = 1; i < customService.callTimestamps.length; i++) {
        intervals.push(customService.callTimestamps[i] - customService.callTimestamps[i - 1]);
      }

      // The third interval should be capped at maxDelay
      // First retry: baseDelay = 2000ms
      // Second retry: 2*baseDelay = 4000ms, but capped at maxDelay = 3000ms
      expect(intervals[2]).toBeLessThanOrEqual(3000);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should propagate non-retryable errors immediately', async () => {
      // Create a custom mock service with a specific error filter
      class CustomMockService {
        public callCount = 0;

        @Retry({
          attempts: 5,
          errorFilter: (error) => error instanceof AppException && error.type === ErrorType.EXTERNAL
        })
        public async methodWithSpecificErrorFilter(): Promise<string> {
          this.callCount++;

          // Throw a non-retryable error
          throw new AppException(
            'Non-retryable error',
            ErrorType.VALIDATION, // This doesn't match the filter
            'TEST_ERROR'
          );
        }
      }

      const customService = new CustomMockService();

      // Should immediately propagate the error without retrying
      await expect(customService.methodWithSpecificErrorFilter()).rejects.toThrow('Non-retryable error');
      expect(customService.callCount).toBe(1); // Only the initial attempt, no retries
    });

    it('should handle non-AppException errors based on filter', async () => {
      // Create a custom mock service that throws standard Error
      class CustomMockService {
        public callCount = 0;

        @Retry({
          attempts: 3,
          // This filter accepts any error
          errorFilter: () => true
        })
        public async methodWithStandardError(): Promise<string> {
          this.callCount++;
          throw new Error('Standard error');
        }

        @Retry({
          attempts: 3,
          // This filter only accepts AppException
          errorFilter: (error) => error instanceof AppException
        })
        public async methodWithFilteredStandardError(): Promise<string> {
          this.callCount++;
          throw new Error('Standard error that should not be retried');
        }
      }

      const customService = new CustomMockService();

      // Should retry standard errors if the filter allows it
      await expect(customService.methodWithStandardError()).rejects.toThrow('Standard error');
      expect(customService.callCount).toBe(3); // Initial attempt + 2 retries

      // Reset call count
      customService.callCount = 0;

      // Should not retry standard errors if the filter doesn't allow it
      await expect(customService.methodWithFilteredStandardError()).rejects.toThrow(
        'Standard error that should not be retried'
      );
      expect(customService.callCount).toBe(1); // Only the initial attempt, no retries
    });
  });
});