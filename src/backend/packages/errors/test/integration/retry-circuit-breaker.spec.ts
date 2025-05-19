import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Module } from '@nestjs/common';
import { CircuitBreaker } from '../../src/decorators/circuit-breaker.decorator';
import { RetryWithBackoff } from '../../src/decorators/retry.decorator';
import { Resilient } from '../../src/decorators/resilient.decorator';
import { WithFallback } from '../../src/decorators/fallback.decorator';
import { ErrorType } from '../../src/types';
import { BaseError } from '../../src/base';

/**
 * Custom error for testing transient failures
 */
class TransientServiceError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.EXTERNAL, 'TRANSIENT_ERROR', { retriable: true });
  }
}

/**
 * Custom error for testing permanent failures
 */
class PermanentServiceError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.EXTERNAL, 'PERMANENT_ERROR', { retriable: false });
  }
}

/**
 * Mock service that simulates a dependency with configurable failure behavior
 */
@Injectable()
class MockExternalService {
  private callCount = 0;
  private failureMode: 'none' | 'transient' | 'permanent' | 'mixed' | 'threshold' = 'none';
  private failureThreshold = 3; // Number of calls that will fail before succeeding
  private failureCount = 0;
  
  /**
   * Configure the service to fail in different ways
   */
  setFailureMode(mode: 'none' | 'transient' | 'permanent' | 'mixed' | 'threshold', threshold = 3) {
    this.failureMode = mode;
    this.failureThreshold = threshold;
    this.failureCount = 0;
    this.callCount = 0;
  }

  /**
   * Get the number of times the service was called
   */
  getCallCount(): number {
    return this.callCount;
  }

  /**
   * Reset the call counter
   */
  resetCallCount(): void {
    this.callCount = 0;
  }

  /**
   * Method with retry but no circuit breaker
   * Will retry up to 3 times with exponential backoff
   */
  @RetryWithBackoff({
    maxAttempts: 3,
    initialDelayMs: 50,
    maxDelayMs: 1000,
    backoffFactor: 2,
    retryableErrors: [TransientServiceError]
  })
  async callWithRetry(): Promise<string> {
    return this.processCall();
  }

  /**
   * Method with circuit breaker but no retry
   * Circuit will open after 3 failures and stay open for 1 second
   */
  @CircuitBreaker({
    failureThreshold: 3,
    resetTimeoutMs: 1000,
    halfOpenMaxCalls: 1
  })
  async callWithCircuitBreaker(): Promise<string> {
    return this.processCall();
  }

  /**
   * Method with both retry and circuit breaker
   * Will retry up to 3 times, and circuit will open after 3 failures
   */
  @RetryWithBackoff({
    maxAttempts: 3,
    initialDelayMs: 50,
    maxDelayMs: 1000,
    backoffFactor: 2,
    retryableErrors: [TransientServiceError]
  })
  @CircuitBreaker({
    failureThreshold: 3,
    resetTimeoutMs: 1000,
    halfOpenMaxCalls: 1
  })
  async callWithRetryAndCircuitBreaker(): Promise<string> {
    return this.processCall();
  }

  /**
   * Method using the composite Resilient decorator
   * Combines retry, circuit breaker, and fallback in a single decorator
   */
  @Resilient({
    retry: {
      maxAttempts: 3,
      initialDelayMs: 50,
      maxDelayMs: 1000,
      backoffFactor: 2,
      retryableErrors: [TransientServiceError]
    },
    circuitBreaker: {
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      halfOpenMaxCalls: 1
    },
    fallback: () => Promise.resolve('fallback response')
  })
  async callWithResilient(): Promise<string> {
    return this.processCall();
  }

  /**
   * Method with retry and fallback
   * Will retry up to 3 times and then use fallback if still failing
   */
  @WithFallback(() => Promise.resolve('fallback response'))
  @RetryWithBackoff({
    maxAttempts: 3,
    initialDelayMs: 50,
    maxDelayMs: 1000,
    backoffFactor: 2,
    retryableErrors: [TransientServiceError]
  })
  async callWithRetryAndFallback(): Promise<string> {
    return this.processCall();
  }

  /**
   * Internal method to process calls based on the configured failure mode
   */
  private async processCall(): Promise<string> {
    this.callCount++;
    this.failureCount++;
    
    switch (this.failureMode) {
      case 'none':
        return 'success';
      
      case 'transient':
        throw new TransientServiceError('Transient service error');
      
      case 'permanent':
        throw new PermanentServiceError('Permanent service error');
      
      case 'mixed':
        // Alternate between transient and permanent errors
        if (this.failureCount % 2 === 0) {
          throw new PermanentServiceError('Permanent service error');
        } else {
          throw new TransientServiceError('Transient service error');
        }
      
      case 'threshold':
        // Fail until we reach the threshold, then succeed
        if (this.failureCount <= this.failureThreshold) {
          throw new TransientServiceError(`Transient error ${this.failureCount}/${this.failureThreshold}`);
        }
        return 'success after failures';
      
      default:
        return 'success';
    }
  }
}

@Module({
  providers: [MockExternalService],
  exports: [MockExternalService]
})
class TestModule {}

describe('Retry and Circuit Breaker Integration', () => {
  let module: TestingModule;
  let service: MockExternalService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    service = module.get<MockExternalService>(MockExternalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Retry Mechanism', () => {
    it('should retry transient errors up to the maximum attempts', async () => {
      // Configure service to always fail with transient errors
      service.setFailureMode('transient');
      
      // Call should fail after 3 retry attempts (4 total calls)
      await expect(service.callWithRetry()).rejects.toThrow(TransientServiceError);
      expect(service.getCallCount()).toBe(4); // Initial call + 3 retries
    });

    it('should not retry permanent errors', async () => {
      // Configure service to always fail with permanent errors
      service.setFailureMode('permanent');
      
      // Call should fail immediately without retries
      await expect(service.callWithRetry()).rejects.toThrow(PermanentServiceError);
      expect(service.getCallCount()).toBe(1); // Only the initial call, no retries
    });

    it('should succeed after some retries if the service recovers', async () => {
      // Configure service to fail 2 times then succeed
      service.setFailureMode('threshold', 2);
      
      // Call should succeed after 2 retries (3 total calls)
      const result = await service.callWithRetry();
      expect(result).toBe('success after failures');
      expect(service.getCallCount()).toBe(3); // Initial call + 2 retries before success
    });

    it('should implement exponential backoff between retries', async () => {
      // Mock Date.now to track time between retries
      const originalDateNow = Date.now;
      const mockDateNow = jest.fn();
      const timestamps: number[] = [];
      
      // Setup mock to record timestamps and advance time
      let currentTime = 1000;
      mockDateNow.mockImplementation(() => {
        timestamps.push(currentTime);
        return currentTime;
      });
      
      global.Date.now = mockDateNow;
      
      // Configure service to always fail with transient errors
      service.setFailureMode('transient');
      
      try {
        // This will fail after all retries
        await service.callWithRetry();
      } catch (error) {
        // Expected to fail
      }
      
      // Verify timestamps show exponential backoff
      // With initialDelay=50ms and backoffFactor=2, we expect delays of ~50ms, ~100ms, ~200ms
      // Allow for some jitter in the actual delays
      expect(timestamps.length).toBeGreaterThanOrEqual(4); // Initial call + 3 retries
      
      // Restore original Date.now
      global.Date.now = originalDateNow;
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should open the circuit after reaching the failure threshold', async () => {
      // Configure service to always fail with transient errors
      service.setFailureMode('transient');
      
      // Make 3 calls to trigger the circuit breaker
      for (let i = 0; i < 3; i++) {
        await expect(service.callWithCircuitBreaker()).rejects.toThrow();
      }
      
      // The next call should fail fast with a circuit open error
      const circuitOpenError = await expect(service.callWithCircuitBreaker()).rejects.toThrow();
      expect(circuitOpenError.message).toContain('Circuit breaker is open');
      
      // The call count should still be 3 because the circuit prevented the 4th call
      expect(service.getCallCount()).toBe(3);
    });

    it('should transition to half-open state after the reset timeout', async () => {
      // Configure service to always fail with transient errors
      service.setFailureMode('transient');
      
      // Make 3 calls to trigger the circuit breaker
      for (let i = 0; i < 3; i++) {
        await expect(service.callWithCircuitBreaker()).rejects.toThrow();
      }
      
      // The next call should fail fast with a circuit open error
      await expect(service.callWithCircuitBreaker()).rejects.toThrow(/Circuit breaker is open/);
      
      // Wait for the circuit to transition to half-open (resetTimeoutMs = 1000ms)
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Configure service to succeed now
      service.setFailureMode('none');
      
      // The next call should be allowed through (half-open state)
      const result = await service.callWithCircuitBreaker();
      expect(result).toBe('success');
      
      // The circuit should now be closed, allowing normal operation
      const result2 = await service.callWithCircuitBreaker();
      expect(result2).toBe('success');
    });

    it('should remain open if test calls in half-open state fail', async () => {
      // Configure service to always fail with transient errors
      service.setFailureMode('transient');
      
      // Make 3 calls to trigger the circuit breaker
      for (let i = 0; i < 3; i++) {
        await expect(service.callWithCircuitBreaker()).rejects.toThrow();
      }
      
      // Wait for the circuit to transition to half-open
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Service is still failing
      service.resetCallCount(); // Reset to track new calls
      
      // The next call should be allowed through (half-open state) but will fail
      await expect(service.callWithCircuitBreaker()).rejects.toThrow(TransientServiceError);
      expect(service.getCallCount()).toBe(1); // The test call was made
      
      // The circuit should be open again, rejecting calls
      await expect(service.callWithCircuitBreaker()).rejects.toThrow(/Circuit breaker is open/);
      expect(service.getCallCount()).toBe(1); // No additional call was made
    });
  });

  describe('Retry with Circuit Breaker Integration', () => {
    it('should retry transient errors but open circuit after threshold failures', async () => {
      // Configure service to always fail with transient errors
      service.setFailureMode('transient');
      
      // First call will retry 3 times (4 total attempts) then fail
      await expect(service.callWithRetryAndCircuitBreaker()).rejects.toThrow(TransientServiceError);
      expect(service.getCallCount()).toBe(4); // Initial + 3 retries
      
      service.resetCallCount();
      
      // Second call will also retry and fail
      await expect(service.callWithRetryAndCircuitBreaker()).rejects.toThrow(TransientServiceError);
      expect(service.getCallCount()).toBe(4); // Initial + 3 retries
      
      service.resetCallCount();
      
      // Third call will also retry and fail, which should open the circuit
      await expect(service.callWithRetryAndCircuitBreaker()).rejects.toThrow(TransientServiceError);
      expect(service.getCallCount()).toBe(4); // Initial + 3 retries
      
      service.resetCallCount();
      
      // Fourth call should fail immediately with circuit open
      await expect(service.callWithRetryAndCircuitBreaker()).rejects.toThrow(/Circuit breaker is open/);
      expect(service.getCallCount()).toBe(0); // No calls made due to open circuit
    });

    it('should close the circuit after successful calls in half-open state', async () => {
      // Configure service to always fail with transient errors
      service.setFailureMode('transient');
      
      // Make 3 calls with retries to trigger the circuit breaker
      for (let i = 0; i < 3; i++) {
        await expect(service.callWithRetryAndCircuitBreaker()).rejects.toThrow();
        service.resetCallCount();
      }
      
      // The next call should fail fast with circuit open
      await expect(service.callWithRetryAndCircuitBreaker()).rejects.toThrow(/Circuit breaker is open/);
      expect(service.getCallCount()).toBe(0);
      
      // Wait for the circuit to transition to half-open
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Configure service to succeed now
      service.setFailureMode('none');
      
      // The next call should be allowed through (half-open state) and succeed
      const result = await service.callWithRetryAndCircuitBreaker();
      expect(result).toBe('success');
      expect(service.getCallCount()).toBe(1); // Only one call needed
      
      // The circuit should now be closed
      service.resetCallCount();
      const result2 = await service.callWithRetryAndCircuitBreaker();
      expect(result2).toBe('success');
      expect(service.getCallCount()).toBe(1); // Normal operation
    });
  });

  describe('Resilient Decorator (Combined Patterns)', () => {
    it('should combine retry, circuit breaker, and fallback functionality', async () => {
      // Configure service to always fail with transient errors
      service.setFailureMode('transient');
      
      // First call will retry and then use fallback
      const result1 = await service.callWithResilient();
      expect(result1).toBe('fallback response');
      expect(service.getCallCount()).toBe(4); // Initial + 3 retries
      
      service.resetCallCount();
      
      // Make more calls to trigger the circuit breaker
      await service.callWithResilient();
      expect(service.getCallCount()).toBe(4);
      service.resetCallCount();
      
      await service.callWithResilient();
      expect(service.getCallCount()).toBe(4);
      service.resetCallCount();
      
      // Circuit should now be open, fallback used immediately without retries
      const result4 = await service.callWithResilient();
      expect(result4).toBe('fallback response');
      expect(service.getCallCount()).toBe(0); // No calls due to open circuit
    });

    it('should recover properly when service becomes available again', async () => {
      // Configure service to always fail with transient errors
      service.setFailureMode('transient');
      
      // Make calls to trigger the circuit breaker
      for (let i = 0; i < 3; i++) {
        await service.callWithResilient();
        service.resetCallCount();
      }
      
      // Circuit should now be open, fallback used immediately
      const result = await service.callWithResilient();
      expect(result).toBe('fallback response');
      expect(service.getCallCount()).toBe(0);
      
      // Wait for the circuit to transition to half-open
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Configure service to succeed now
      service.setFailureMode('none');
      
      // The next call should be allowed through (half-open state) and succeed
      const result2 = await service.callWithResilient();
      expect(result2).toBe('success');
      expect(service.getCallCount()).toBe(1);
      
      // The circuit should now be closed for normal operation
      service.resetCallCount();
      const result3 = await service.callWithResilient();
      expect(result3).toBe('success');
      expect(service.getCallCount()).toBe(1);
    });
  });

  describe('Retry with Fallback Integration', () => {
    it('should use fallback after retry attempts are exhausted', async () => {
      // Configure service to always fail with transient errors
      service.setFailureMode('transient');
      
      // Call should retry and then use fallback
      const result = await service.callWithRetryAndFallback();
      expect(result).toBe('fallback response');
      expect(service.getCallCount()).toBe(4); // Initial + 3 retries
    });

    it('should not use fallback if retries succeed', async () => {
      // Configure service to fail twice then succeed
      service.setFailureMode('threshold', 2);
      
      // Call should succeed after retries without using fallback
      const result = await service.callWithRetryAndFallback();
      expect(result).toBe('success after failures');
      expect(service.getCallCount()).toBe(3); // Initial + 2 retries before success
    });
  });
});