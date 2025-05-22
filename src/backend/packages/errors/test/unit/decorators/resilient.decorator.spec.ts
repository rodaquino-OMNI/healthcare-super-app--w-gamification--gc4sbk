import { jest } from '@jest/globals';
import { Resilient, ResilientConfig } from '../../../src/decorators/resilient.decorator';
import { ErrorType } from '../../../src/categories/error-types';
import { CircuitState } from '../../../src/decorators/types';
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
 * Mock service with resilient-decorated methods for testing
 */
class MockService {
  public attempts = 0;
  public fallbackCalls = 0;
  public lastError: Error | null = null;
  public circuitState: CircuitState = CircuitState.CLOSED;
  
  /**
   * Basic resilient method with default settings
   */
  @Resilient()
  async basicOperation(failCount: number): Promise<string> {
    this.attempts++;
    
    if (this.attempts <= failCount) {
      const error = new Error(`Attempt ${this.attempts} failed`);
      this.lastError = error;
      throw error;
    }
    
    return 'success';
  }
  
  /**
   * Method with retry configuration using fluent API
   */
  @Resilient()
    .withRetry({ maxAttempts: 3, delay: 100 })
  async retryOperation(failCount: number): Promise<string> {
    this.attempts++;
    
    if (this.attempts <= failCount) {
      const error = new Error(`Attempt ${this.attempts} failed`);
      this.lastError = error;
      throw error;
    }
    
    return 'success';
  }
  
  /**
   * Method with circuit breaker configuration using fluent API
   */
  @Resilient()
    .withCircuitBreaker({
      failureThreshold: 2,
      resetTimeout: 1000,
      onStateChange: (oldState, newState) => {
        mockService.circuitState = newState;
      }
    })
  async circuitBreakerOperation(shouldFail: boolean): Promise<string> {
    this.attempts++;
    
    if (shouldFail) {
      const error = new Error(`Circuit breaker test failure`);
      this.lastError = error;
      throw error;
    }
    
    return 'success';
  }
  
  /**
   * Method with fallback configuration using fluent API
   */
  @Resilient()
    .withFallback((error, shouldFail: boolean) => {
      mockService.fallbackCalls++;
      return `fallback-${shouldFail}`;
    })
  async fallbackOperation(shouldFail: boolean): Promise<string> {
    this.attempts++;
    
    if (shouldFail) {
      const error = new Error(`Fallback test failure`);
      this.lastError = error;
      throw error;
    }
    
    return 'success';
  }
  
  /**
   * Method with combined retry and fallback
   */
  @Resilient()
    .withRetry({ maxAttempts: 3, delay: 100 })
    .withFallback((error, failCount: number) => {
      mockService.fallbackCalls++;
      return `retry-fallback-${failCount}`;
    })
  async retryWithFallbackOperation(failCount: number): Promise<string> {
    this.attempts++;
    
    if (this.attempts <= failCount) {
      const error = new Error(`Attempt ${this.attempts} failed`);
      this.lastError = error;
      throw error;
    }
    
    return 'success';
  }
  
  /**
   * Method with combined retry and circuit breaker
   */
  @Resilient()
    .withRetry({
      maxAttempts: 3,
      delay: 100,
      retryCondition: (error) => error instanceof TransientError
    })
    .withCircuitBreaker({
      failureThreshold: 2,
      resetTimeout: 1000,
      onStateChange: (oldState, newState) => {
        mockService.circuitState = newState;
      }
    })
  async retryWithCircuitBreakerOperation(errorType: 'transient' | 'permanent' | 'none'): Promise<string> {
    this.attempts++;
    
    if (errorType === 'transient') {
      throw new TransientError(`Transient error on attempt ${this.attempts}`);
    } else if (errorType === 'permanent') {
      throw new PermanentError(`Permanent error on attempt ${this.attempts}`);
    }
    
    return 'success';
  }
  
  /**
   * Method with all resilience patterns combined
   */
  @Resilient()
    .withRetry({
      maxAttempts: 3,
      delay: 100,
      retryCondition: (error) => error instanceof TransientError
    })
    .withCircuitBreaker({
      failureThreshold: 2,
      resetTimeout: 1000,
      onStateChange: (oldState, newState) => {
        mockService.circuitState = newState;
      }
    })
    .withFallback((error, errorType: 'transient' | 'permanent' | 'none') => {
      mockService.fallbackCalls++;
      return `complete-fallback-${errorType}`;
    })
  async completeResilientOperation(errorType: 'transient' | 'permanent' | 'none'): Promise<string> {
    this.attempts++;
    
    if (errorType === 'transient') {
      throw new TransientError(`Transient error on attempt ${this.attempts}`);
    } else if (errorType === 'permanent') {
      throw new PermanentError(`Permanent error on attempt ${this.attempts}`);
    }
    
    return 'success';
  }
  
  /**
   * Method with custom error type and code
   */
  @Resilient({
    errorType: ErrorType.EXTERNAL,
    errorCode: 'TEST_001',
    message: 'Custom error message'
  })
    .withRetry({ maxAttempts: 3, delay: 100 })
  async customErrorOperation(): Promise<string> {
    this.attempts++;
    throw new Error(`Always failing`);
  }
  
  /**
   * Reset the service state for the next test
   */
  reset(): void {
    this.attempts = 0;
    this.fallbackCalls = 0;
    this.lastError = null;
    this.circuitState = CircuitState.CLOSED;
  }
}

// Create a mock service instance for testing
const mockService = new MockService();

describe('Resilient Decorator', () => {
  // Mock timers for testing delays without waiting
  beforeEach(() => {
    jest.useFakeTimers();
    mockService.reset();
    
    // Reset circuit breaker state between tests
    // This is a bit of a hack to access the private static property
    // @ts-ignore - Accessing private property for testing
    ResilientConfig.circuitStates = new Map();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('Basic Functionality', () => {
    it('should work with default settings', async () => {
      // Operation will fail once, then succeed
      const promise = mockService.basicOperation(1);
      
      // Fast-forward through any delays
      jest.runAllTimers();
      
      // Verify the result
      const result = await promise;
      expect(result).toBe('success');
      expect(mockService.attempts).toBe(2);
    });
    
    it('should throw an exception when operation keeps failing', async () => {
      // Operation will always fail
      const promise = mockService.basicOperation(10);
      
      // Fast-forward through any delays
      jest.runAllTimers();
      
      // Verify the error
      await expect(promise).rejects.toThrow();
    });
  });
  
  describe('Retry Configuration', () => {
    it('should retry failed operations up to maxAttempts', async () => {
      // Operation will fail 3 times, which is exactly maxAttempts
      const promise = mockService.retryOperation(3);
      
      // Fast-forward through the retry delays
      jest.runAllTimers();
      
      // Verify the error
      await expect(promise).rejects.toThrow();
      expect(mockService.attempts).toBe(3); // Should stop at maxAttempts
    });
    
    it('should succeed after retries if operation eventually succeeds', async () => {
      // Operation will fail twice, then succeed on the third attempt
      const promise = mockService.retryOperation(2);
      
      // Fast-forward through the retry delays
      jest.runAllTimers();
      
      // Verify the result
      const result = await promise;
      expect(result).toBe('success');
      expect(mockService.attempts).toBe(3);
    });
  });
  
  describe('Circuit Breaker Configuration', () => {
    it('should open circuit after failureThreshold is reached', async () => {
      // First call - first failure
      const promise1 = mockService.circuitBreakerOperation(true);
      await expect(promise1).rejects.toThrow();
      expect(mockService.circuitState).toBe(CircuitState.CLOSED);
      
      // Second call - second failure, should open circuit
      const promise2 = mockService.circuitBreakerOperation(true);
      await expect(promise2).rejects.toThrow();
      expect(mockService.circuitState).toBe(CircuitState.OPEN);
      
      // Third call - circuit is open, should fail fast
      mockService.reset(); // Reset attempts counter but keep circuit state
      const promise3 = mockService.circuitBreakerOperation(false);
      await expect(promise3).rejects.toThrow('Circuit is OPEN');
      expect(mockService.attempts).toBe(0); // Should not even attempt the operation
    });
    
    it('should transition to half-open after resetTimeout', async () => {
      // First call - first failure
      const promise1 = mockService.circuitBreakerOperation(true);
      await expect(promise1).rejects.toThrow();
      
      // Second call - second failure, should open circuit
      const promise2 = mockService.circuitBreakerOperation(true);
      await expect(promise2).rejects.toThrow();
      expect(mockService.circuitState).toBe(CircuitState.OPEN);
      
      // Advance time past resetTimeout
      jest.advanceTimersByTime(1100); // resetTimeout is 1000ms
      
      // Next call should transition to half-open and attempt the operation
      mockService.reset(); // Reset attempts counter but keep circuit state
      const promise3 = mockService.circuitBreakerOperation(false); // This one will succeed
      
      // Verify the result
      const result = await promise3;
      expect(result).toBe('success');
      expect(mockService.circuitState).toBe(CircuitState.HALF_OPEN);
      expect(mockService.attempts).toBe(1);
    });
    
    it('should close circuit after success in half-open state', async () => {
      // First call - first failure
      const promise1 = mockService.circuitBreakerOperation(true);
      await expect(promise1).rejects.toThrow();
      
      // Second call - second failure, should open circuit
      const promise2 = mockService.circuitBreakerOperation(true);
      await expect(promise2).rejects.toThrow();
      expect(mockService.circuitState).toBe(CircuitState.OPEN);
      
      // Advance time past resetTimeout
      jest.advanceTimersByTime(1100); // resetTimeout is 1000ms
      
      // First success in half-open state
      mockService.reset();
      const promise3 = mockService.circuitBreakerOperation(false);
      const result1 = await promise3;
      expect(result1).toBe('success');
      expect(mockService.circuitState).toBe(CircuitState.HALF_OPEN);
      
      // Second success in half-open state should close the circuit
      // (successThreshold default is 2)
      mockService.reset();
      const promise4 = mockService.circuitBreakerOperation(false);
      const result2 = await promise4;
      expect(result2).toBe('success');
      expect(mockService.circuitState).toBe(CircuitState.CLOSED);
    });
    
    it('should reopen circuit on failure in half-open state', async () => {
      // First call - first failure
      const promise1 = mockService.circuitBreakerOperation(true);
      await expect(promise1).rejects.toThrow();
      
      // Second call - second failure, should open circuit
      const promise2 = mockService.circuitBreakerOperation(true);
      await expect(promise2).rejects.toThrow();
      expect(mockService.circuitState).toBe(CircuitState.OPEN);
      
      // Advance time past resetTimeout
      jest.advanceTimersByTime(1100); // resetTimeout is 1000ms
      
      // Failure in half-open state should reopen the circuit
      mockService.reset();
      const promise3 = mockService.circuitBreakerOperation(true);
      await expect(promise3).rejects.toThrow();
      expect(mockService.circuitState).toBe(CircuitState.OPEN);
    });
  });
  
  describe('Fallback Configuration', () => {
    it('should use fallback when operation fails', async () => {
      // Operation will fail
      const promise = mockService.fallbackOperation(true);
      
      // Verify fallback is used
      const result = await promise;
      expect(result).toBe('fallback-true');
      expect(mockService.fallbackCalls).toBe(1);
    });
    
    it('should not use fallback when operation succeeds', async () => {
      // Operation will succeed
      const promise = mockService.fallbackOperation(false);
      
      // Verify normal result
      const result = await promise;
      expect(result).toBe('success');
      expect(mockService.fallbackCalls).toBe(0);
    });
  });
  
  describe('Combined Patterns', () => {
    it('should use fallback after retry exhaustion', async () => {
      // Operation will fail more times than maxAttempts
      const promise = mockService.retryWithFallbackOperation(5);
      
      // Fast-forward through the retry delays
      jest.runAllTimers();
      
      // Verify fallback is used after retries
      const result = await promise;
      expect(result).toBe('retry-fallback-5');
      expect(mockService.attempts).toBe(3); // Should stop at maxAttempts
      expect(mockService.fallbackCalls).toBe(1);
    });
    
    it('should not retry permanent errors but still open circuit', async () => {
      // First call with permanent error - should not retry but count as failure
      const promise1 = mockService.retryWithCircuitBreakerOperation('permanent');
      await expect(promise1).rejects.toThrow();
      expect(mockService.attempts).toBe(1); // No retries for permanent errors
      expect(mockService.circuitState).toBe(CircuitState.CLOSED); // First failure
      
      // Second call with permanent error - should open circuit
      mockService.reset();
      const promise2 = mockService.retryWithCircuitBreakerOperation('permanent');
      await expect(promise2).rejects.toThrow();
      expect(mockService.attempts).toBe(1); // No retries
      expect(mockService.circuitState).toBe(CircuitState.OPEN); // Circuit opens
      
      // Third call - circuit is open, should fail fast
      mockService.reset();
      const promise3 = mockService.retryWithCircuitBreakerOperation('none');
      await expect(promise3).rejects.toThrow('Circuit is OPEN');
      expect(mockService.attempts).toBe(0); // Should not even attempt the operation
    });
    
    it('should retry transient errors and count failures for circuit breaker', async () => {
      // First call with transient error - should retry 3 times
      const promise1 = mockService.retryWithCircuitBreakerOperation('transient');
      jest.runAllTimers();
      await expect(promise1).rejects.toThrow();
      expect(mockService.attempts).toBe(3); // Full retry attempts
      expect(mockService.circuitState).toBe(CircuitState.CLOSED); // First failure
      
      // Second call with transient error - should retry and then open circuit
      mockService.reset();
      const promise2 = mockService.retryWithCircuitBreakerOperation('transient');
      jest.runAllTimers();
      await expect(promise2).rejects.toThrow();
      expect(mockService.attempts).toBe(3); // Full retry attempts
      expect(mockService.circuitState).toBe(CircuitState.OPEN); // Circuit opens
    });
    
    it('should use fallback when circuit is open', async () => {
      // First two calls to open the circuit
      await expect(mockService.completeResilientOperation('permanent')).rejects.toThrow();
      mockService.reset();
      await expect(mockService.completeResilientOperation('permanent')).rejects.toThrow();
      expect(mockService.circuitState).toBe(CircuitState.OPEN);
      
      // Third call - circuit is open, should use fallback
      mockService.reset();
      const result = await mockService.completeResilientOperation('none');
      expect(result).toBe('complete-fallback-none');
      expect(mockService.attempts).toBe(0); // Should not attempt the operation
      expect(mockService.fallbackCalls).toBe(1);
    });
    
    it('should use fallback after retry exhaustion with transient errors', async () => {
      // Operation will fail with transient errors (retryable)
      const promise = mockService.completeResilientOperation('transient');
      
      // Fast-forward through the retry delays
      jest.runAllTimers();
      
      // Verify fallback is used after retries
      const result = await promise;
      expect(result).toBe('complete-fallback-transient');
      expect(mockService.attempts).toBe(3); // Should stop at maxAttempts
      expect(mockService.fallbackCalls).toBe(1);
    });
    
    it('should use fallback immediately with permanent errors', async () => {
      // Operation will fail with permanent error (not retryable)
      const promise = mockService.completeResilientOperation('permanent');
      
      // Verify fallback is used immediately
      const result = await promise;
      expect(result).toBe('complete-fallback-permanent');
      expect(mockService.attempts).toBe(1); // Only one attempt
      expect(mockService.fallbackCalls).toBe(1);
    });
  });
  
  describe('Error Handling', () => {
    it('should throw AppException with custom error type and code', async () => {
      // Operation will always fail
      const promise = mockService.customErrorOperation();
      
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
      }
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle immediate success without resilience mechanisms', async () => {
      // Operation will succeed on first attempt
      const promise = mockService.completeResilientOperation('none');
      
      // Verify the result
      const result = await promise;
      expect(result).toBe('success');
      expect(mockService.attempts).toBe(1); // Only one attempt
      expect(mockService.fallbackCalls).toBe(0); // No fallback used
    });
    
    it('should handle non-Error exceptions', async () => {
      class StringExceptionService {
        @Resilient()
          .withRetry({ maxAttempts: 3 })
          .withFallback(() => 'fallback')
        async operation(): Promise<string> {
          // Throw a string instead of an Error
          throw 'String exception';
        }
      }
      
      const service = new StringExceptionService();
      const promise = service.operation();
      
      jest.runAllTimers();
      
      // Should handle non-Error exceptions and use fallback
      const result = await promise;
      expect(result).toBe('fallback');
    });
  });
});