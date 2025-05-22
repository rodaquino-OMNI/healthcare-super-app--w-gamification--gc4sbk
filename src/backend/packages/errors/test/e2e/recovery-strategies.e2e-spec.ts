/**
 * End-to-end tests for error recovery strategies
 * 
 * This file contains tests for the error recovery strategies implemented in the AUSTA SuperApp:
 * - Retry with exponential backoff for transient errors
 * - Circuit breaker pattern for failing dependencies
 * - Fallback mechanisms for graceful degradation
 * 
 * These tests verify that the decorators and their corresponding interceptors behave correctly
 * in a real application context, ensuring that the error recovery strategies work as expected.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Injectable, Module } from '@nestjs/common';
import { Retry, RetryWithBackoff } from '../../src/decorators/retry.decorator';
import { CircuitBreaker, CircuitState, getCircuitBreakerState, resetCircuitBreaker } from '../../src/decorators/circuit-breaker.decorator';
import { WithFallback, CachedFallback, DefaultFallback } from '../../src/decorators/fallback.decorator';
import { ErrorType } from '../../src/categories/error-types';
import { BaseError } from '../../src/base';

/**
 * Custom error class for transient errors
 */
class TransientError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.EXTERNAL, 'TRANSIENT_ERROR', { isTransient: true });
  }
}

/**
 * Custom error class for persistent errors
 */
class PersistentError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.EXTERNAL, 'PERSISTENT_ERROR', { isTransient: false });
  }
}

/**
 * Mock service for testing retry strategies
 */
@Injectable()
class RetryTestService {
  // Track number of calls to each method
  public callCounts: Record<string, number> = {
    transientFailure: 0,
    persistentFailure: 0,
    exponentialBackoff: 0,
    conditionalRetry: 0
  };

  // Track timestamps of calls for backoff validation
  public callTimestamps: Record<string, number[]> = {
    exponentialBackoff: []
  };

  // Reset call tracking
  public reset(): void {
    this.callCounts = {
      transientFailure: 0,
      persistentFailure: 0,
      exponentialBackoff: 0,
      conditionalRetry: 0
    };
    this.callTimestamps = {
      exponentialBackoff: []
    };
  }

  /**
   * Method that fails the first 2 times, then succeeds
   * Tests basic retry functionality
   */
  @Retry({ maxAttempts: 3, delay: 100 })
  async transientFailure(): Promise<string> {
    this.callCounts.transientFailure++;
    
    if (this.callCounts.transientFailure <= 2) {
      throw new TransientError('Transient failure');
    }
    
    return 'Success after retry';
  }

  /**
   * Method that always fails
   * Tests that retry gives up after max attempts
   */
  @Retry({ maxAttempts: 3, delay: 100 })
  async persistentFailure(): Promise<string> {
    this.callCounts.persistentFailure++;
    throw new PersistentError('Persistent failure');
  }

  /**
   * Method that fails the first 3 times, then succeeds
   * Tests exponential backoff timing
   */
  @RetryWithBackoff({
    maxAttempts: 5,
    delay: 100,
    backoffFactor: 2,
    maxDelay: 1000
  })
  async exponentialBackoff(): Promise<string> {
    this.callCounts.exponentialBackoff++;
    this.callTimestamps.exponentialBackoff.push(Date.now());
    
    if (this.callCounts.exponentialBackoff <= 3) {
      throw new TransientError('Transient failure for backoff');
    }
    
    return 'Success after exponential backoff';
  }

  /**
   * Method that only retries on TransientError
   * Tests conditional retry based on error type
   */
  @Retry({
    maxAttempts: 3,
    delay: 100,
    retryCondition: (error) => error instanceof TransientError
  })
  async conditionalRetry(shouldBeTransient: boolean): Promise<string> {
    this.callCounts.conditionalRetry++;
    
    if (shouldBeTransient) {
      throw new TransientError('Transient error that should be retried');
    } else {
      throw new PersistentError('Persistent error that should not be retried');
    }
  }
}

/**
 * Mock service for testing circuit breaker strategies
 */
@Injectable()
class CircuitBreakerTestService {
  // Track number of calls to each method
  public callCounts: Record<string, number> = {
    basicCircuitBreaker: 0,
    circuitBreakerWithFallback: 0,
    halfOpenRecovery: 0
  };

  // Reset call tracking
  public reset(): void {
    this.callCounts = {
      basicCircuitBreaker: 0,
      circuitBreakerWithFallback: 0,
      halfOpenRecovery: 0
    };
  }

  /**
   * Method with basic circuit breaker
   * Tests that circuit opens after threshold failures
   */
  @CircuitBreaker({
    failureThreshold: 3,
    failureWindow: 10000,
    resetTimeout: 500
  })
  async basicCircuitBreaker(): Promise<string> {
    this.callCounts.basicCircuitBreaker++;
    throw new PersistentError('Service unavailable');
  }

  /**
   * Method with circuit breaker and fallback
   * Tests that fallback is used when circuit is open
   */
  @CircuitBreaker({
    failureThreshold: 3,
    failureWindow: 10000,
    resetTimeout: 500,
    fallback: (error) => 'Fallback response when circuit is open'
  })
  async circuitBreakerWithFallback(): Promise<string> {
    this.callCounts.circuitBreakerWithFallback++;
    throw new PersistentError('Service unavailable');
  }

  /**
   * Method that recovers in half-open state
   * Tests transition from open to half-open to closed
   */
  @CircuitBreaker({
    failureThreshold: 3,
    failureWindow: 10000,
    resetTimeout: 500,
    successThreshold: 2
  })
  async halfOpenRecovery(shouldSucceed: boolean): Promise<string> {
    this.callCounts.halfOpenRecovery++;
    
    if (!shouldSucceed) {
      throw new PersistentError('Service unavailable');
    }
    
    return 'Service recovered';
  }
}

/**
 * Mock service for testing fallback strategies
 */
@Injectable()
class FallbackTestService {
  // Track number of calls to each method
  public callCounts: Record<string, number> = {
    withFallback: 0,
    cachedFallback: 0,
    defaultFallback: 0
  };

  // Track fallback executions
  public fallbackExecutions: Record<string, number> = {
    withFallback: 0,
    cachedFallback: 0
  };

  // Cache for testing cached fallback
  private cache: Map<string, any> = new Map();

  // Reset call tracking
  public reset(): void {
    this.callCounts = {
      withFallback: 0,
      cachedFallback: 0,
      defaultFallback: 0
    };
    this.fallbackExecutions = {
      withFallback: 0,
      cachedFallback: 0
    };
    this.cache.clear();
  }

  /**
   * Method with custom fallback handler
   * Tests that fallback is executed when method fails
   */
  @WithFallback({
    handler: (error, id) => {
      // Increment fallback execution counter
      (this as FallbackTestService).fallbackExecutions.withFallback++;
      return { id, name: 'Fallback User', isDefault: true };
    }
  })
  async withFallback(id: string): Promise<{ id: string; name: string; isDefault?: boolean }> {
    this.callCounts.withFallback++;
    throw new PersistentError('Failed to fetch user');
  }

  /**
   * Method with cached fallback
   * Tests that cached results are returned when available
   */
  @CachedFallback({
    ttl: 60000,
    defaultValue: { data: [], isDefault: true }
  })
  async cachedFallback(shouldCache: boolean): Promise<{ data: any[]; isDefault?: boolean }> {
    this.callCounts.cachedFallback++;
    
    if (shouldCache) {
      const result = { data: ['cached', 'data'], timestamp: Date.now() };
      // Store in our test cache to verify later
      this.cache.set('cachedFallback', result);
      return result;
    }
    
    throw new PersistentError('Failed to fetch data');
  }

  /**
   * Method with default fallback value
   * Tests that default value is returned when method fails
   */
  @DefaultFallback({
    defaultValue: { status: 'offline', message: 'Using default status' }
  })
  async defaultFallback(): Promise<{ status: string; message: string }> {
    this.callCounts.defaultFallback++;
    throw new PersistentError('Failed to get status');
  }

  /**
   * Get the cached value for verification
   */
  getCachedValue(key: string): any {
    return this.cache.get(key);
  }
}

/**
 * Test module that provides all the test services
 */
@Module({
  providers: [RetryTestService, CircuitBreakerTestService, FallbackTestService],
  exports: [RetryTestService, CircuitBreakerTestService, FallbackTestService]
})
class TestModule {}

describe('Recovery Strategies (e2e)', () => {
  let app: INestApplication;
  let retryService: RetryTestService;
  let circuitBreakerService: CircuitBreakerTestService;
  let fallbackService: FallbackTestService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    retryService = moduleFixture.get<RetryTestService>(RetryTestService);
    circuitBreakerService = moduleFixture.get<CircuitBreakerTestService>(CircuitBreakerTestService);
    fallbackService = moduleFixture.get<FallbackTestService>(FallbackTestService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset call counters before each test
    retryService.reset();
    circuitBreakerService.reset();
    fallbackService.reset();

    // Reset circuit breaker states
    resetCircuitBreaker(CircuitBreakerTestService.prototype, 'basicCircuitBreaker');
    resetCircuitBreaker(CircuitBreakerTestService.prototype, 'circuitBreakerWithFallback');
    resetCircuitBreaker(CircuitBreakerTestService.prototype, 'halfOpenRecovery');
  });

  describe('Retry Decorator', () => {
    it('should retry transient failures and eventually succeed', async () => {
      // Execute method that fails twice then succeeds
      const result = await retryService.transientFailure();

      // Verify method was called 3 times (2 failures + 1 success)
      expect(retryService.callCounts.transientFailure).toBe(3);
      expect(result).toBe('Success after retry');
    });

    it('should stop retrying after max attempts and throw error', async () => {
      // Execute method that always fails
      try {
        await retryService.persistentFailure();
        fail('Should have thrown an error');
      } catch (error) {
        // Verify method was called maxAttempts times
        expect(retryService.callCounts.persistentFailure).toBe(3);
        expect(error).toBeInstanceOf(BaseError);
        expect(error.code).toBe('RETRY_EXHAUSTED');
      }
    });

    it('should implement exponential backoff between retries', async () => {
      // Execute method with exponential backoff
      const result = await retryService.exponentialBackoff();

      // Verify method was called 4 times (3 failures + 1 success)
      expect(retryService.callCounts.exponentialBackoff).toBe(4);
      expect(result).toBe('Success after exponential backoff');

      // Verify backoff timing
      const timestamps = retryService.callTimestamps.exponentialBackoff;
      const delays = [];
      
      // Calculate actual delays between calls
      for (let i = 1; i < timestamps.length; i++) {
        delays.push(timestamps[i] - timestamps[i-1]);
      }

      // First delay should be around 100ms
      expect(delays[0]).toBeGreaterThanOrEqual(90);
      expect(delays[0]).toBeLessThan(200);

      // Second delay should be around 200ms (100ms * 2^1)
      expect(delays[1]).toBeGreaterThanOrEqual(180);
      expect(delays[1]).toBeLessThan(300);

      // Third delay should be around 400ms (100ms * 2^2)
      expect(delays[2]).toBeGreaterThanOrEqual(380);
      expect(delays[2]).toBeLessThan(500);
    });

    it('should only retry when condition is met', async () => {
      // Test with transient error (should retry)
      try {
        await retryService.conditionalRetry(true);
        fail('Should have thrown an error');
      } catch (error) {
        // Verify method was retried maxAttempts times
        expect(retryService.callCounts.conditionalRetry).toBe(3);
      }

      // Reset counter
      retryService.callCounts.conditionalRetry = 0;

      // Test with persistent error (should not retry)
      try {
        await retryService.conditionalRetry(false);
        fail('Should have thrown an error');
      } catch (error) {
        // Verify method was called only once
        expect(retryService.callCounts.conditionalRetry).toBe(1);
        expect(error).toBeInstanceOf(PersistentError);
      }
    });
  });

  describe('Circuit Breaker Decorator', () => {
    it('should open circuit after threshold failures', async () => {
      // Call method until circuit opens
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreakerService.basicCircuitBreaker();
          fail('Should have thrown an error');
        } catch (error) {
          // Expected error
        }
      }

      // Verify circuit is now open
      const circuitState = getCircuitBreakerState(
        CircuitBreakerTestService.prototype,
        'basicCircuitBreaker'
      );
      expect(circuitState?.state).toBe(CircuitState.OPEN);

      // Call again - should fail fast without executing method
      const startCallCount = circuitBreakerService.callCounts.basicCircuitBreaker;
      try {
        await circuitBreakerService.basicCircuitBreaker();
        fail('Should have thrown an error');
      } catch (error) {
        // Verify method was not called
        expect(circuitBreakerService.callCounts.basicCircuitBreaker).toBe(startCallCount);
        expect(error).toBeInstanceOf(BaseError);
        expect(error.code).toBe('CIRCUIT_BREAKER_OPEN');
      }
    });

    it('should use fallback when circuit is open', async () => {
      // Call method until circuit opens
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreakerService.circuitBreakerWithFallback();
          fail('Should have thrown an error');
        } catch (error) {
          // Expected error
        }
      }

      // Verify circuit is now open
      const circuitState = getCircuitBreakerState(
        CircuitBreakerTestService.prototype,
        'circuitBreakerWithFallback'
      );
      expect(circuitState?.state).toBe(CircuitState.OPEN);

      // Call again - should return fallback without executing method
      const startCallCount = circuitBreakerService.callCounts.circuitBreakerWithFallback;
      const result = await circuitBreakerService.circuitBreakerWithFallback();

      // Verify method was not called and fallback was returned
      expect(circuitBreakerService.callCounts.circuitBreakerWithFallback).toBe(startCallCount);
      expect(result).toBe('Fallback response when circuit is open');
    });

    it('should transition from open to half-open to closed', async () => {
      // Call method until circuit opens
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreakerService.halfOpenRecovery(false);
          fail('Should have thrown an error');
        } catch (error) {
          // Expected error
        }
      }

      // Verify circuit is now open
      let circuitState = getCircuitBreakerState(
        CircuitBreakerTestService.prototype,
        'halfOpenRecovery'
      );
      expect(circuitState?.state).toBe(CircuitState.OPEN);

      // Wait for reset timeout to elapse
      await new Promise(resolve => setTimeout(resolve, 600));

      // Circuit should now be half-open
      // First call should be allowed through
      const result1 = await circuitBreakerService.halfOpenRecovery(true);
      expect(result1).toBe('Service recovered');

      // Verify circuit is now in half-open state
      circuitState = getCircuitBreakerState(
        CircuitBreakerTestService.prototype,
        'halfOpenRecovery'
      );
      expect(circuitState?.state).toBe(CircuitState.HALF_OPEN);

      // Second successful call should close the circuit
      const result2 = await circuitBreakerService.halfOpenRecovery(true);
      expect(result2).toBe('Service recovered');

      // Verify circuit is now closed
      circuitState = getCircuitBreakerState(
        CircuitBreakerTestService.prototype,
        'halfOpenRecovery'
      );
      expect(circuitState?.state).toBe(CircuitState.CLOSED);
    });

    it('should reopen circuit on failure in half-open state', async () => {
      // Call method until circuit opens
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreakerService.halfOpenRecovery(false);
          fail('Should have thrown an error');
        } catch (error) {
          // Expected error
        }
      }

      // Wait for reset timeout to elapse
      await new Promise(resolve => setTimeout(resolve, 600));

      // Circuit should now be half-open
      // Call with failure should reopen the circuit
      try {
        await circuitBreakerService.halfOpenRecovery(false);
        fail('Should have thrown an error');
      } catch (error) {
        // Expected error
      }

      // Verify circuit is open again
      const circuitState = getCircuitBreakerState(
        CircuitBreakerTestService.prototype,
        'halfOpenRecovery'
      );
      expect(circuitState?.state).toBe(CircuitState.OPEN);
    });
  });

  describe('Fallback Decorator', () => {
    it('should execute fallback handler when method fails', async () => {
      // Call method that will fail and use fallback
      const result = await fallbackService.withFallback('123');

      // Verify method was called and fallback was executed
      expect(fallbackService.callCounts.withFallback).toBe(1);
      expect(fallbackService.fallbackExecutions.withFallback).toBe(1);
      expect(result).toEqual({ id: '123', name: 'Fallback User', isDefault: true });
    });

    it('should cache successful results and return them on failure', async () => {
      // First call succeeds and caches result
      const successResult = await fallbackService.cachedFallback(true);
      expect(successResult).toEqual({ data: ['cached', 'data'], timestamp: expect.any(Number) });
      expect(fallbackService.callCounts.cachedFallback).toBe(1);

      // Verify result was cached
      const cachedValue = fallbackService.getCachedValue('cachedFallback');
      expect(cachedValue).toEqual(successResult);

      // Second call fails but returns cached result
      const fallbackResult = await fallbackService.cachedFallback(false);
      expect(fallbackResult).toEqual(successResult);
      expect(fallbackService.callCounts.cachedFallback).toBe(2);
    });

    it('should return default value when no cache is available', async () => {
      // Call fails with no cache available
      const result = await fallbackService.defaultFallback();

      // Verify default value was returned
      expect(fallbackService.callCounts.defaultFallback).toBe(1);
      expect(result).toEqual({ status: 'offline', message: 'Using default status' });
    });
  });
});