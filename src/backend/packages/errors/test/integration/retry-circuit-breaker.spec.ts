import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { CircuitBreaker } from '../../src/decorators/circuit-breaker.decorator';
import { Retry, RetryWithBackoff } from '../../src/decorators/retry.decorator';
import { Resilient } from '../../src/decorators/resilient.decorator';
import { ErrorType } from '../../src/types';
import { BaseError } from '../../src/base';
import { 
  NetworkErrorSimulator, 
  ErrorFactory,
  MockErrorHandler
} from '../helpers';
import { retryScenarios } from '../fixtures/retry-scenarios';

/**
 * Test service that simulates a service with external dependencies
 * Used to test retry and circuit breaker patterns
 */
@Injectable()
class TestExternalService {
  public callCount = 0;
  public failureCount = 0;
  public successCount = 0;
  public lastCallTime = 0;
  public callTimes: number[] = [];

  // Reset all counters and state
  reset() {
    this.callCount = 0;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastCallTime = 0;
    this.callTimes = [];
  }

  // Method that always fails with a specific error
  async failingMethod(error: Error): Promise<string> {
    this.recordCall();
    this.failureCount++;
    throw error;
  }

  // Method that fails a specific number of times then succeeds
  async temporarilyFailingMethod(failCount: number, error: Error): Promise<string> {
    this.recordCall();
    
    if (this.failureCount < failCount) {
      this.failureCount++;
      throw error;
    }
    
    this.successCount++;
    return 'success';
  }

  // Method that alternates between success and failure
  async unstableMethod(error: Error): Promise<string> {
    this.recordCall();
    
    if (this.callCount % 2 === 0) {
      this.failureCount++;
      throw error;
    }
    
    this.successCount++;
    return 'success';
  }

  // Helper to record call timing for backoff verification
  private recordCall() {
    this.callCount++;
    const now = Date.now();
    if (this.lastCallTime > 0) {
      this.callTimes.push(now - this.lastCallTime);
    }
    this.lastCallTime = now;
  }
}

/**
 * Test service with resilience patterns applied
 * Used to test the interaction between retry and circuit breaker
 */
@Injectable()
class ResilientTestService {
  constructor(private readonly externalService: TestExternalService) {}

  // Simple retry with fixed delay
  @Retry({
    maxAttempts: 3,
    delay: 100,
    errorTypes: [ErrorType.EXTERNAL]
  })
  async withSimpleRetry(shouldFail: boolean, failCount?: number): Promise<string> {
    const error = ErrorFactory.createExternalError('EXTERNAL_SERVICE_ERROR', 'External service unavailable');
    
    if (shouldFail) {
      return this.externalService.failingMethod(error);
    } else if (failCount) {
      return this.externalService.temporarilyFailingMethod(failCount, error);
    }
    
    return 'success';
  }

  // Retry with exponential backoff
  @RetryWithBackoff({
    maxAttempts: 5,
    initialDelay: 50,
    maxDelay: 500,
    backoffFactor: 2,
    errorTypes: [ErrorType.EXTERNAL]
  })
  async withExponentialBackoff(shouldFail: boolean, failCount?: number): Promise<string> {
    const error = ErrorFactory.createExternalError('EXTERNAL_SERVICE_ERROR', 'External service unavailable');
    
    if (shouldFail) {
      return this.externalService.failingMethod(error);
    } else if (failCount) {
      return this.externalService.temporarilyFailingMethod(failCount, error);
    }
    
    return 'success';
  }

  // Circuit breaker pattern
  @CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 1000,
    fallbackValue: 'circuit open'
  })
  async withCircuitBreaker(shouldFail: boolean): Promise<string> {
    const error = ErrorFactory.createExternalError('EXTERNAL_SERVICE_ERROR', 'External service unavailable');
    
    if (shouldFail) {
      return this.externalService.failingMethod(error);
    }
    
    return 'success';
  }

  // Combined retry and circuit breaker
  @Resilient({
    retry: {
      maxAttempts: 3,
      delay: 100,
      errorTypes: [ErrorType.EXTERNAL]
    },
    circuitBreaker: {
      failureThreshold: 3,
      resetTimeout: 1000,
      fallbackValue: 'circuit open'
    }
  })
  async withRetryAndCircuitBreaker(shouldFail: boolean, failCount?: number): Promise<string> {
    const error = ErrorFactory.createExternalError('EXTERNAL_SERVICE_ERROR', 'External service unavailable');
    
    if (shouldFail) {
      return this.externalService.failingMethod(error);
    } else if (failCount) {
      return this.externalService.temporarilyFailingMethod(failCount, error);
    }
    
    return 'success';
  }

  // Method for testing unstable service with circuit breaker
  @CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 500,
    fallbackValue: 'circuit open',
    halfOpenSuccessThreshold: 2
  })
  async withUnstableService(): Promise<string> {
    const error = ErrorFactory.createExternalError('EXTERNAL_SERVICE_ERROR', 'External service unstable');
    return this.externalService.unstableMethod(error);
  }
}

describe('Retry and Circuit Breaker Integration', () => {
  let module: TestingModule;
  let resilientService: ResilientTestService;
  let externalService: TestExternalService;
  let networkErrorSimulator: NetworkErrorSimulator;

  beforeEach(async () => {
    // Create test module with our test services
    module = await Test.createTestingModule({
      providers: [
        TestExternalService,
        ResilientTestService,
        NetworkErrorSimulator,
        MockErrorHandler
      ],
    }).compile();

    resilientService = module.get<ResilientTestService>(ResilientTestService);
    externalService = module.get<TestExternalService>(TestExternalService);
    networkErrorSimulator = module.get<NetworkErrorSimulator>(NetworkErrorSimulator);

    // Reset the external service state before each test
    externalService.reset();

    // Use fake timers for predictable testing
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Simple Retry Pattern', () => {
    it('should retry failed calls up to maxAttempts', async () => {
      // Arrange
      const promise = resilientService.withSimpleRetry(true);
      
      // Act & Assert
      await expect(promise).rejects.toThrow();
      expect(externalService.callCount).toBe(3); // Initial + 2 retries
      expect(externalService.failureCount).toBe(3);
    });

    it('should succeed after temporary failures', async () => {
      // Arrange
      const failCount = 2; // Fail twice, then succeed
      
      // Act
      const result = await resilientService.withSimpleRetry(false, failCount);
      
      // Assert
      expect(result).toBe('success');
      expect(externalService.callCount).toBe(3); // Initial + 2 retries
      expect(externalService.failureCount).toBe(2);
      expect(externalService.successCount).toBe(1);
    });

    it('should respect fixed delay between retries', async () => {
      // Arrange
      const promise = resilientService.withSimpleRetry(true);
      
      // Act
      jest.advanceTimersByTime(50);
      
      // Assert - first call made, but no retries yet
      expect(externalService.callCount).toBe(1);
      
      // Act - advance past first retry
      jest.advanceTimersByTime(100);
      
      // Assert - first retry made
      expect(externalService.callCount).toBe(2);
      
      // Act - advance past second retry
      jest.advanceTimersByTime(100);
      
      // Assert - second retry made
      expect(externalService.callCount).toBe(3);
      
      // Resolve the promise
      await expect(promise).rejects.toThrow();
    });
  });

  describe('Exponential Backoff Retry Pattern', () => {
    it('should retry with increasing delays', async () => {
      // Arrange
      const promise = resilientService.withExponentialBackoff(true);
      
      // Act & Assert - initial call
      expect(externalService.callCount).toBe(1);
      
      // First retry - after 50ms
      jest.advanceTimersByTime(50);
      expect(externalService.callCount).toBe(2);
      
      // Second retry - after 100ms (50ms * 2)
      jest.advanceTimersByTime(100);
      expect(externalService.callCount).toBe(3);
      
      // Third retry - after 200ms (50ms * 2^2)
      jest.advanceTimersByTime(200);
      expect(externalService.callCount).toBe(4);
      
      // Fourth retry - after 400ms (50ms * 2^3)
      jest.advanceTimersByTime(400);
      expect(externalService.callCount).toBe(5);
      
      // No more retries
      jest.advanceTimersByTime(1000);
      expect(externalService.callCount).toBe(5);
      
      // Resolve the promise
      await expect(promise).rejects.toThrow();
    });

    it('should respect maxDelay configuration', async () => {
      // The configuration sets maxDelay to 500ms, so the fourth retry
      // should be capped at 500ms instead of 800ms (50ms * 2^4)
      
      // Arrange
      const promise = resilientService.withExponentialBackoff(true);
      
      // Act & Assert - initial call
      expect(externalService.callCount).toBe(1);
      
      // Advance through all retries
      jest.advanceTimersByTime(50 + 100 + 200 + 500); // Last delay capped at 500ms
      
      // Assert
      expect(externalService.callCount).toBe(5); // Initial + 4 retries
      
      // Resolve the promise
      await expect(promise).rejects.toThrow();
    });

    it('should succeed after temporary failures with backoff', async () => {
      // Arrange
      const failCount = 3; // Fail three times, then succeed
      
      // Act
      const promise = resilientService.withExponentialBackoff(false, failCount);
      
      // Advance through the retries
      jest.advanceTimersByTime(50 + 100 + 200);
      
      // Resolve the promise
      const result = await promise;
      
      // Assert
      expect(result).toBe('success');
      expect(externalService.callCount).toBe(4); // Initial + 3 retries
      expect(externalService.failureCount).toBe(3);
      expect(externalService.successCount).toBe(1);
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should open circuit after failure threshold is reached', async () => {
      // Arrange & Act - Call the failing method multiple times
      for (let i = 0; i < 3; i++) {
        await expect(resilientService.withCircuitBreaker(true)).rejects.toThrow();
      }
      
      // Assert - Circuit should be open now
      const result = await resilientService.withCircuitBreaker(true);
      expect(result).toBe('circuit open');
      
      // The external service should only have been called 3 times (threshold)
      // The 4th call should return the fallback value without calling the service
      expect(externalService.callCount).toBe(3);
    });

    it('should transition to half-open state after reset timeout', async () => {
      // Arrange - Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(resilientService.withCircuitBreaker(true)).rejects.toThrow();
      }
      
      // Assert - Circuit is open
      expect(await resilientService.withCircuitBreaker(true)).toBe('circuit open');
      expect(externalService.callCount).toBe(3);
      
      // Act - Wait for reset timeout
      jest.advanceTimersByTime(1000);
      
      // The next call should go through (half-open state)
      await expect(resilientService.withCircuitBreaker(true)).rejects.toThrow();
      expect(externalService.callCount).toBe(4);
      
      // Circuit should open again after a failure in half-open state
      expect(await resilientService.withCircuitBreaker(true)).toBe('circuit open');
      expect(externalService.callCount).toBe(4); // No additional call
    });

    it('should close circuit after successful call in half-open state', async () => {
      // Arrange - Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(resilientService.withCircuitBreaker(true)).rejects.toThrow();
      }
      
      // Assert - Circuit is open
      expect(await resilientService.withCircuitBreaker(true)).toBe('circuit open');
      
      // Act - Wait for reset timeout
      jest.advanceTimersByTime(1000);
      
      // Make a successful call in half-open state
      externalService.reset(); // Reset to make next call successful
      const result = await resilientService.withCircuitBreaker(false);
      expect(result).toBe('success');
      
      // Circuit should be closed now, subsequent calls should go through
      const result2 = await resilientService.withCircuitBreaker(false);
      expect(result2).toBe('success');
      expect(externalService.callCount).toBe(2); // Both calls went through
    });
  });

  describe('Combined Retry and Circuit Breaker', () => {
    it('should retry until success without opening circuit', async () => {
      // Arrange
      const failCount = 2; // Fail twice, then succeed
      
      // Act
      const result = await resilientService.withRetryAndCircuitBreaker(false, failCount);
      
      // Assert
      expect(result).toBe('success');
      expect(externalService.callCount).toBe(3); // Initial + 2 retries
      expect(externalService.failureCount).toBe(2);
      expect(externalService.successCount).toBe(1);
    });

    it('should open circuit after multiple failed retry sequences', async () => {
      // Arrange & Act
      // First sequence - 3 calls (initial + 2 retries)
      await expect(resilientService.withRetryAndCircuitBreaker(true)).rejects.toThrow();
      expect(externalService.callCount).toBe(3);
      
      // Second sequence - 3 more calls
      await expect(resilientService.withRetryAndCircuitBreaker(true)).rejects.toThrow();
      expect(externalService.callCount).toBe(6);
      
      // Third sequence - 3 more calls, this should trigger the circuit breaker
      await expect(resilientService.withRetryAndCircuitBreaker(true)).rejects.toThrow();
      expect(externalService.callCount).toBe(9);
      
      // Circuit should be open now
      const result = await resilientService.withRetryAndCircuitBreaker(true);
      expect(result).toBe('circuit open');
      expect(externalService.callCount).toBe(9); // No additional calls
    });

    it('should count each failed retry attempt toward circuit breaker threshold', async () => {
      // This test verifies that each retry attempt counts toward the circuit breaker threshold,
      // not just each retry sequence
      
      // Configure a service with 3 retries and circuit breaker threshold of 3
      // A single failed call with retries should open the circuit
      
      // Create a custom resilient service for this test
      const customService = {
        @Resilient({
          retry: {
            maxAttempts: 3, // Initial + 2 retries
            delay: 100,
            errorTypes: [ErrorType.EXTERNAL]
          },
          circuitBreaker: {
            failureThreshold: 3, // Open after 3 failures
            resetTimeout: 1000,
            fallbackValue: 'circuit open'
          }
        })
        async callExternalService(externalService: TestExternalService): Promise<string> {
          const error = ErrorFactory.createExternalError('EXTERNAL_SERVICE_ERROR', 'External service unavailable');
          return externalService.failingMethod(error);
        }
      };
      
      // First call with retries should open the circuit
      await expect(customService.callExternalService(externalService)).rejects.toThrow();
      expect(externalService.callCount).toBe(3); // Initial + 2 retries
      
      // Reset the external service for the next call
      externalService.reset();
      
      // Circuit should be open now
      const result = await customService.callExternalService(externalService);
      expect(result).toBe('circuit open');
      expect(externalService.callCount).toBe(0); // No calls made
    });
  });

  describe('Circuit Half-Open State', () => {
    it('should require multiple successes to close circuit with halfOpenSuccessThreshold', async () => {
      // Open the circuit with the unstable service
      for (let i = 0; i < 3; i++) {
        try {
          await resilientService.withUnstableService();
        } catch (error) {
          // Ignore errors
        }
      }
      
      // Circuit should be open
      expect(await resilientService.withUnstableService()).toBe('circuit open');
      
      // Wait for reset timeout
      jest.advanceTimersByTime(500);
      
      // First success in half-open state
      externalService.reset(); // Reset to make next call return success (odd call number)
      const result1 = await resilientService.withUnstableService();
      expect(result1).toBe('success');
      
      // Circuit should still be half-open, requiring another success
      // Next call will fail (even call number)
      const result2 = await resilientService.withUnstableService();
      expect(result2).toBe('circuit open'); // Circuit opens again after failure
      
      // Wait for reset timeout again
      jest.advanceTimersByTime(500);
      
      // Two consecutive successes should close the circuit
      externalService.reset();
      // First success (odd call number)
      const result3 = await resilientService.withUnstableService();
      expect(result3).toBe('success');
      
      // Force next call to succeed for testing
      externalService.reset();
      externalService.callCount = 1; // Make next call odd (success)
      
      // Second success
      const result4 = await resilientService.withUnstableService();
      expect(result4).toBe('success');
      
      // Circuit should be closed now
      // Next call should go through even if it fails
      const promise = resilientService.withUnstableService();
      await expect(promise).rejects.toThrow();
    });
  });
});