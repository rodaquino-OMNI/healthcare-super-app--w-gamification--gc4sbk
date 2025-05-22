/**
 * @file Integration tests for retry and circuit breaker patterns
 * 
 * This file contains integration tests that validate the interaction between
 * retry mechanisms and circuit breaker patterns for handling transient errors.
 * It tests various failure scenarios to ensure proper backoff strategies,
 * retry attempts, and circuit state transitions.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { CircuitBreaker, CircuitState, RetryWithBackoff } from '../../src/decorators';
import { ErrorType } from '../../src/categories/error-types';
import { BaseError } from '../../src/base';
import { getCircuitBreakerState, resetCircuitBreaker } from '../../src/decorators/circuit-breaker.decorator';

/**
 * Custom error for testing transient failures
 */
class TransientError extends BaseError {
  constructor(message: string) {
    super(
      message,
      ErrorType.EXTERNAL,
      'TEST_TRANSIENT_ERROR',
      { isTransient: true }
    );
  }
}

/**
 * Custom error for testing permanent failures
 */
class PermanentError extends BaseError {
  constructor(message: string) {
    super(
      message,
      ErrorType.EXTERNAL,
      'TEST_PERMANENT_ERROR',
      { isTransient: false }
    );
  }
}

/**
 * Test service that combines retry and circuit breaker patterns
 */
@Injectable()
class TestService {
  // Track call counts for testing
  public callCounts: Record<string, number> = {};
  // Track timing for testing backoff
  public callTimes: Record<string, number[]> = {};
  // Control failure behavior
  public shouldFail = true;
  // Control failure type
  public failWithTransient = true;
  // Control number of consecutive failures
  public failureCount = 10;
  // Current failure counter
  private currentFailures = 0;

  /**
   * Reset all tracking data
   */
  resetTracking() {
    this.callCounts = {};
    this.callTimes = {};
    this.shouldFail = true;
    this.failWithTransient = true;
    this.failureCount = 10;
    this.currentFailures = 0;
  }

  /**
   * Method with retry but no circuit breaker
   * Used to test retry behavior in isolation
   */
  @RetryWithBackoff({
    maxAttempts: 3,
    delay: 50,
    backoffFactor: 2,
    maxDelay: 1000,
    errorType: ErrorType.EXTERNAL,
    errorCode: 'TEST_RETRY_EXHAUSTED',
  })
  async retryOnlyMethod(id: string): Promise<string> {
    this.trackMethodCall('retryOnlyMethod');
    
    if (this.shouldFail && this.currentFailures < this.failureCount) {
      this.currentFailures++;
      if (this.failWithTransient) {
        throw new TransientError('Transient error in retryOnlyMethod');
      } else {
        throw new PermanentError('Permanent error in retryOnlyMethod');
      }
    }
    
    this.currentFailures = 0;
    return `Success: ${id}`;
  }

  /**
   * Method with circuit breaker but no retry
   * Used to test circuit breaker behavior in isolation
   */
  @CircuitBreaker({
    failureThreshold: 3,
    failureWindow: 1000,
    resetTimeout: 500,
    successThreshold: 2,
    errorType: ErrorType.EXTERNAL,
    errorCode: 'TEST_CIRCUIT_OPEN',
  })
  async circuitOnlyMethod(id: string): Promise<string> {
    this.trackMethodCall('circuitOnlyMethod');
    
    if (this.shouldFail && this.currentFailures < this.failureCount) {
      this.currentFailures++;
      if (this.failWithTransient) {
        throw new TransientError('Transient error in circuitOnlyMethod');
      } else {
        throw new PermanentError('Permanent error in circuitOnlyMethod');
      }
    }
    
    this.currentFailures = 0;
    return `Success: ${id}`;
  }

  /**
   * Method with both retry and circuit breaker
   * Used to test the interaction between the two patterns
   */
  @RetryWithBackoff({
    maxAttempts: 3,
    delay: 50,
    backoffFactor: 2,
    maxDelay: 1000,
    errorType: ErrorType.EXTERNAL,
    errorCode: 'TEST_RETRY_EXHAUSTED',
  })
  @CircuitBreaker({
    failureThreshold: 3,
    failureWindow: 1000,
    resetTimeout: 500,
    successThreshold: 2,
    errorType: ErrorType.EXTERNAL,
    errorCode: 'TEST_CIRCUIT_OPEN',
  })
  async combinedMethod(id: string): Promise<string> {
    this.trackMethodCall('combinedMethod');
    
    if (this.shouldFail && this.currentFailures < this.failureCount) {
      this.currentFailures++;
      if (this.failWithTransient) {
        throw new TransientError('Transient error in combinedMethod');
      } else {
        throw new PermanentError('Permanent error in combinedMethod');
      }
    }
    
    this.currentFailures = 0;
    return `Success: ${id}`;
  }

  /**
   * Method with circuit breaker that has a fallback
   * Used to test fallback behavior when circuit is open
   */
  @CircuitBreaker({
    failureThreshold: 3,
    failureWindow: 1000,
    resetTimeout: 500,
    successThreshold: 2,
    errorType: ErrorType.EXTERNAL,
    errorCode: 'TEST_CIRCUIT_OPEN',
    fallback: (error) => `Fallback response due to: ${error.message}`,
  })
  async circuitWithFallbackMethod(id: string): Promise<string> {
    this.trackMethodCall('circuitWithFallbackMethod');
    
    if (this.shouldFail && this.currentFailures < this.failureCount) {
      this.currentFailures++;
      if (this.failWithTransient) {
        throw new TransientError('Transient error in circuitWithFallbackMethod');
      } else {
        throw new PermanentError('Permanent error in circuitWithFallbackMethod');
      }
    }
    
    this.currentFailures = 0;
    return `Success: ${id}`;
  }

  /**
   * Method with both retry and circuit breaker with fallbacks
   * Used to test the interaction with fallbacks
   */
  @RetryWithBackoff({
    maxAttempts: 3,
    delay: 50,
    backoffFactor: 2,
    maxDelay: 1000,
    errorType: ErrorType.EXTERNAL,
    errorCode: 'TEST_RETRY_EXHAUSTED',
    fallback: (error) => `Retry fallback: ${error.message}`,
  })
  @CircuitBreaker({
    failureThreshold: 3,
    failureWindow: 1000,
    resetTimeout: 500,
    successThreshold: 2,
    errorType: ErrorType.EXTERNAL,
    errorCode: 'TEST_CIRCUIT_OPEN',
    fallback: (error) => `Circuit fallback: ${error.message}`,
  })
  async combinedWithFallbackMethod(id: string): Promise<string> {
    this.trackMethodCall('combinedWithFallbackMethod');
    
    if (this.shouldFail && this.currentFailures < this.failureCount) {
      this.currentFailures++;
      if (this.failWithTransient) {
        throw new TransientError('Transient error in combinedWithFallbackMethod');
      } else {
        throw new PermanentError('Permanent error in combinedWithFallbackMethod');
      }
    }
    
    this.currentFailures = 0;
    return `Success: ${id}`;
  }

  /**
   * Helper method to track method calls for testing
   */
  private trackMethodCall(methodName: string): void {
    // Initialize tracking if not exists
    if (!this.callCounts[methodName]) {
      this.callCounts[methodName] = 0;
      this.callTimes[methodName] = [];
    }
    
    // Increment call count
    this.callCounts[methodName]++;
    
    // Record timestamp
    this.callTimes[methodName].push(Date.now());
  }
}

describe('Retry and Circuit Breaker Integration', () => {
  let testService: TestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestService],
    }).compile();

    testService = module.get<TestService>(TestService);
    testService.resetTracking();
    
    // Reset all circuit breakers
    resetCircuitBreaker(TestService.prototype, 'circuitOnlyMethod');
    resetCircuitBreaker(TestService.prototype, 'combinedMethod');
    resetCircuitBreaker(TestService.prototype, 'circuitWithFallbackMethod');
    resetCircuitBreaker(TestService.prototype, 'combinedWithFallbackMethod');
  });

  describe('Retry Mechanism', () => {
    it('should retry the specified number of times before failing', async () => {
      // Arrange
      testService.failureCount = 10; // Ensure it will always fail
      
      // Act & Assert
      await expect(testService.retryOnlyMethod('test')).rejects.toThrow('Maximum retry attempts reached');
      
      // Verify retry count (1 original + 3 retries = 4 total calls)
      expect(testService.callCounts['retryOnlyMethod']).toBe(4);
    });

    it('should implement exponential backoff between retries', async () => {
      // Arrange
      testService.failureCount = 10; // Ensure it will always fail
      
      // Act
      await expect(testService.retryOnlyMethod('test')).rejects.toThrow();
      
      // Assert
      const callTimes = testService.callTimes['retryOnlyMethod'];
      
      // Check that delays between calls follow exponential pattern
      // First delay should be around 50ms
      expect(callTimes[1] - callTimes[0]).toBeGreaterThanOrEqual(40);
      expect(callTimes[1] - callTimes[0]).toBeLessThan(100); // Allow for some jitter
      
      // Second delay should be around 100ms (50ms * 2)
      expect(callTimes[2] - callTimes[1]).toBeGreaterThanOrEqual(80);
      expect(callTimes[2] - callTimes[1]).toBeLessThan(150); // Allow for some jitter
      
      // Third delay should be around 200ms (50ms * 2^2)
      expect(callTimes[3] - callTimes[2]).toBeGreaterThanOrEqual(160);
      expect(callTimes[3] - callTimes[2]).toBeLessThan(250); // Allow for some jitter
    });

    it('should succeed if an attempt succeeds before max retries', async () => {
      // Arrange
      testService.failureCount = 2; // Fail twice, then succeed
      
      // Act
      const result = await testService.retryOnlyMethod('test');
      
      // Assert
      expect(result).toBe('Success: test');
      expect(testService.callCounts['retryOnlyMethod']).toBe(3); // 2 failures + 1 success
    });
  });

  describe('Circuit Breaker Mechanism', () => {
    it('should open the circuit after reaching the failure threshold', async () => {
      // Arrange
      testService.failureCount = 10; // Ensure it will always fail
      
      // Act - Call enough times to open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(testService.circuitOnlyMethod('test')).rejects.toThrow();
      }
      
      // Assert - Next call should fail fast with circuit open error
      const startTime = Date.now();
      await expect(testService.circuitOnlyMethod('test')).rejects.toThrow('Circuit breaker is open');
      const endTime = Date.now();
      
      // Verify it failed fast (circuit open) without executing the method
      expect(endTime - startTime).toBeLessThan(50); // Should be almost immediate
      expect(testService.callCounts['circuitOnlyMethod']).toBe(3); // Only 3 actual executions
      
      // Verify circuit state
      const circuitState = getCircuitBreakerState(TestService.prototype, 'circuitOnlyMethod');
      expect(circuitState?.state).toBe(CircuitState.OPEN);
    });

    it('should transition to half-open state after reset timeout', async () => {
      // Arrange
      testService.failureCount = 10; // Ensure it will always fail
      
      // Act - Call enough times to open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(testService.circuitOnlyMethod('test')).rejects.toThrow();
      }
      
      // Verify circuit is open
      let circuitState = getCircuitBreakerState(TestService.prototype, 'circuitOnlyMethod');
      expect(circuitState?.state).toBe(CircuitState.OPEN);
      
      // Wait for reset timeout to elapse
      await new Promise(resolve => setTimeout(resolve, 600)); // 600ms > 500ms reset timeout
      
      // The next call should execute (half-open state)
      testService.shouldFail = true; // Ensure it will still fail
      await expect(testService.circuitOnlyMethod('test')).rejects.toThrow('Transient error');
      
      // Verify circuit went to half-open and then back to open
      circuitState = getCircuitBreakerState(TestService.prototype, 'circuitOnlyMethod');
      expect(circuitState?.state).toBe(CircuitState.OPEN);
      expect(testService.callCounts['circuitOnlyMethod']).toBe(4); // 3 initial + 1 half-open test
    });

    it('should close the circuit after success threshold in half-open state', async () => {
      // Arrange
      testService.failureCount = 3; // Fail 3 times to open circuit
      
      // Act - Call enough times to open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(testService.circuitOnlyMethod('test')).rejects.toThrow();
      }
      
      // Verify circuit is open
      let circuitState = getCircuitBreakerState(TestService.prototype, 'circuitOnlyMethod');
      expect(circuitState?.state).toBe(CircuitState.OPEN);
      
      // Wait for reset timeout to elapse
      await new Promise(resolve => setTimeout(resolve, 600)); // 600ms > 500ms reset timeout
      
      // Set up for success
      testService.shouldFail = false;
      
      // First success in half-open state
      await expect(testService.circuitOnlyMethod('test')).resolves.toBe('Success: test');
      
      // Circuit should still be in half-open state
      circuitState = getCircuitBreakerState(TestService.prototype, 'circuitOnlyMethod');
      expect(circuitState?.state).toBe(CircuitState.HALF_OPEN);
      
      // Second success should close the circuit
      await expect(testService.circuitOnlyMethod('test')).resolves.toBe('Success: test');
      
      // Verify circuit is closed
      circuitState = getCircuitBreakerState(TestService.prototype, 'circuitOnlyMethod');
      expect(circuitState?.state).toBe(CircuitState.CLOSED);
    });

    it('should use fallback when circuit is open', async () => {
      // Arrange
      testService.failureCount = 10; // Ensure it will always fail
      
      // Act - Call enough times to open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(testService.circuitWithFallbackMethod('test')).rejects.toThrow();
      }
      
      // Verify circuit is open
      const circuitState = getCircuitBreakerState(TestService.prototype, 'circuitWithFallbackMethod');
      expect(circuitState?.state).toBe(CircuitState.OPEN);
      
      // Next call should use fallback
      const result = await testService.circuitWithFallbackMethod('test');
      expect(result).toContain('Fallback response due to:');
      expect(result).toContain('Circuit breaker is open');
      
      // Verify the method wasn't actually called
      expect(testService.callCounts['circuitWithFallbackMethod']).toBe(3); // Only the initial 3 calls
    });
  });

  describe('Combined Retry and Circuit Breaker', () => {
    it('should retry before contributing to circuit breaker failure count', async () => {
      // Arrange
      testService.failureCount = 10; // Ensure it will always fail
      
      // Act - First call with retries
      await expect(testService.combinedMethod('test')).rejects.toThrow('Maximum retry attempts reached');
      
      // Assert - Verify retry happened
      expect(testService.callCounts['combinedMethod']).toBe(4); // 1 original + 3 retries
      
      // Verify circuit is still closed after first set of retries (only counts as 1 failure)
      let circuitState = getCircuitBreakerState(TestService.prototype, 'combinedMethod');
      expect(circuitState?.state).toBe(CircuitState.CLOSED);
      
      // Two more calls with retries should open the circuit (3 total failures)
      await expect(testService.combinedMethod('test')).rejects.toThrow();
      await expect(testService.combinedMethod('test')).rejects.toThrow();
      
      // Verify circuit is now open
      circuitState = getCircuitBreakerState(TestService.prototype, 'combinedMethod');
      expect(circuitState?.state).toBe(CircuitState.OPEN);
      
      // Total call count should be 12 (3 sets of 4 calls each with retries)
      expect(testService.callCounts['combinedMethod']).toBe(12);
    });

    it('should not retry when circuit is open', async () => {
      // Arrange
      testService.failureCount = 10; // Ensure it will always fail
      
      // Act - Call enough times to open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(testService.combinedMethod('test')).rejects.toThrow();
      }
      
      // Verify circuit is open
      const circuitState = getCircuitBreakerState(TestService.prototype, 'combinedMethod');
      expect(circuitState?.state).toBe(CircuitState.OPEN);
      
      // Reset call tracking to clearly see next behavior
      const previousCallCount = testService.callCounts['combinedMethod'];
      testService.resetTracking();
      
      // Next call should fail fast with circuit open, without retrying
      await expect(testService.combinedMethod('test')).rejects.toThrow('Circuit breaker is open');
      
      // Verify no actual method execution or retries occurred
      expect(testService.callCounts['combinedMethod']).toBe(0);
    });

    it('should use circuit breaker fallback before retry fallback when circuit is open', async () => {
      // Arrange
      testService.failureCount = 10; // Ensure it will always fail
      
      // Act - Call enough times to open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(testService.combinedWithFallbackMethod('test')).rejects.toThrow();
      }
      
      // Verify circuit is open
      const circuitState = getCircuitBreakerState(TestService.prototype, 'combinedWithFallbackMethod');
      expect(circuitState?.state).toBe(CircuitState.OPEN);
      
      // Next call should use circuit breaker fallback
      const result = await testService.combinedWithFallbackMethod('test');
      expect(result).toContain('Circuit fallback:');
      expect(result).not.toContain('Retry fallback:');
    });

    it('should use retry fallback when retries are exhausted but circuit is still closed', async () => {
      // Arrange
      testService.failureCount = 10; // Ensure it will always fail
      
      // Act - First call with retries (not enough to open circuit)
      const result = await testService.combinedWithFallbackMethod('test');
      
      // Assert - Should use retry fallback
      expect(result).toContain('Retry fallback:');
      expect(result).not.toContain('Circuit fallback:');
      
      // Verify circuit is still closed
      const circuitState = getCircuitBreakerState(TestService.prototype, 'combinedWithFallbackMethod');
      expect(circuitState?.state).toBe(CircuitState.CLOSED);
    });
  });
});