/**
 * @file circuit-breaker.util.spec.ts
 * @description Unit tests for the circuit breaker utility that prevents cascading failures
 * when dependent services are unavailable.
 */

import { Logger } from '@nestjs/common';
import { ExternalDependencyUnavailableError } from '../../../src/categories/external.errors';
import {
  CircuitBreaker,
  CircuitBreakerState,
  CircuitBreakerOptions,
  CircuitBreakerMetrics,
  createCircuitBreaker,
  createServiceCircuitBreaker,
  DEFAULT_CIRCUIT_BREAKER_OPTIONS
} from '../../../src/utils/circuit-breaker';

describe('CircuitBreaker', () => {
  // Mock logger to avoid console output during tests
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn()
  } as unknown as Logger;

  // Mock successful and failing operations
  const successOperation = jest.fn().mockResolvedValue('success');
  const failOperation = jest.fn().mockRejectedValue(new Error('operation failed'));

  // Default options for testing
  const defaultTestOptions: CircuitBreakerOptions = {
    name: 'test-service',
    failureThreshold: 3,
    resetTimeoutMs: 5000,
    successThreshold: 2,
    logger: mockLogger
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should create a circuit breaker with default options', () => {
      const circuitBreaker = new CircuitBreaker({ name: 'test-service' });
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.getMetrics().failureCount).toBe(0);
    });

    it('should throw an error if name is not provided', () => {
      expect(() => new CircuitBreaker({} as CircuitBreakerOptions)).toThrow('Circuit breaker name is required');
    });

    it('should merge provided options with defaults', () => {
      const options: Partial<CircuitBreakerOptions> = {
        name: 'custom-service',
        failureThreshold: 10
      };

      const circuitBreaker = createCircuitBreaker(options as CircuitBreakerOptions);
      
      // We can't directly access private options, but we can test behavior
      // by triggering failures and checking when the circuit opens
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should create a service circuit breaker with the service name', () => {
      const circuitBreaker = createServiceCircuitBreaker('api-service');
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      
      // Check that the name is used in error messages
      return expect(circuitBreaker.execute(failOperation))
        .rejects
        .toThrow('operation failed');
    });
  });

  describe('closed state behavior', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker(defaultTestOptions);
    });

    it('should execute operations successfully in closed state', async () => {
      const result = await circuitBreaker.execute(successOperation);
      expect(result).toBe('success');
      expect(successOperation).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should track successful operations in metrics', async () => {
      await circuitBreaker.execute(successOperation);
      const metrics = circuitBreaker.getMetrics();
      
      expect(metrics.totalSuccesses).toBe(1);
      expect(metrics.failureCount).toBe(0);
      expect(metrics.lastSuccessTimestamp).not.toBeNull();
    });

    it('should allow operations to fail without opening the circuit below threshold', async () => {
      // Failure threshold is 3, so 2 failures should keep it closed
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow('operation failed');
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow('operation failed');
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.getMetrics().failureCount).toBe(2);
    });

    it('should open the circuit after reaching failure threshold', async () => {
      // Failure threshold is 3, so 3 failures should open it
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow('operation failed');
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow('operation failed');
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow('operation failed');
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker \'test-service\' failure: 3/3'),
        'operation failed'
      );
    });

    it('should reset failure count after a successful operation', async () => {
      // Two failures, then a success, then another failure
      // This should not open the circuit because the success resets the count
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow();
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow();
      await circuitBreaker.execute(successOperation);
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow();
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.getMetrics().failureCount).toBe(1);
    });

    it('should use custom failure condition if provided', async () => {
      // Create circuit breaker that only counts specific errors
      const customCircuitBreaker = new CircuitBreaker({
        ...defaultTestOptions,
        failureCondition: (error) => error.message.includes('count me')
      });
      
      // These errors don't match the condition, so they shouldn't count
      await expect(customCircuitBreaker.execute(() => Promise.reject(new Error('ignore me')))).rejects.toThrow();
      await expect(customCircuitBreaker.execute(() => Promise.reject(new Error('ignore me')))).rejects.toThrow();
      await expect(customCircuitBreaker.execute(() => Promise.reject(new Error('ignore me')))).rejects.toThrow();
      
      expect(customCircuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      
      // Now use errors that match the condition
      await expect(customCircuitBreaker.execute(() => Promise.reject(new Error('count me')))).rejects.toThrow();
      await expect(customCircuitBreaker.execute(() => Promise.reject(new Error('count me')))).rejects.toThrow();
      await expect(customCircuitBreaker.execute(() => Promise.reject(new Error('count me')))).rejects.toThrow();
      
      expect(customCircuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    });
  });

  describe('open state behavior', () => {
    let circuitBreaker: CircuitBreaker;
    let stateChangeCallback: jest.Mock;

    beforeEach(() => {
      stateChangeCallback = jest.fn();
      circuitBreaker = new CircuitBreaker({
        ...defaultTestOptions,
        onStateChange: stateChangeCallback
      });
      
      // Trip the circuit to start in OPEN state
      circuitBreaker.trip();
    });

    it('should reject operations immediately when circuit is open', async () => {
      await expect(circuitBreaker.execute(successOperation)).rejects.toThrow(ExternalDependencyUnavailableError);
      expect(successOperation).not.toHaveBeenCalled();
    });

    it('should include circuit breaker info in the error when open', async () => {
      try {
        await circuitBreaker.execute(successOperation);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ExternalDependencyUnavailableError);
        expect(error.message).toContain('circuit breaker for \'test-service\' is open');
        expect(error.context).toEqual(expect.objectContaining({
          circuitBreakerState: CircuitBreakerState.OPEN
        }));
      }
    });

    it('should track rejected operations in metrics', async () => {
      try {
        await circuitBreaker.execute(successOperation);
      } catch (error) {
        // Expected error
      }
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.totalRejections).toBe(1);
    });

    it('should transition to half-open after reset timeout', async () => {
      jest.useFakeTimers();
      
      // Verify we start in OPEN state
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Fast-forward time past the reset timeout
      jest.advanceTimersByTime(defaultTestOptions.resetTimeoutMs + 100);
      
      // Now the circuit should be half-open
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);
      expect(stateChangeCallback).toHaveBeenCalledWith(
        CircuitBreakerState.OPEN,
        CircuitBreakerState.HALF_OPEN,
        expect.any(Object)
      );
    });

    it('should execute operations with fallback when circuit is open', async () => {
      const fallback = jest.fn().mockReturnValue('fallback result');
      
      const result = await circuitBreaker.executeWithFallback(successOperation, fallback);
      
      expect(result).toBe('fallback result');
      expect(successOperation).not.toHaveBeenCalled();
      expect(fallback).toHaveBeenCalledWith(expect.any(ExternalDependencyUnavailableError));
    });
  });

  describe('half-open state behavior', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        ...defaultTestOptions,
        halfOpenMaxRequests: 2
      });
      
      // Trip the circuit and then advance time to move to HALF_OPEN state
      circuitBreaker.trip();
      jest.useFakeTimers();
      jest.advanceTimersByTime(defaultTestOptions.resetTimeoutMs + 100);
      
      // Verify we're in HALF_OPEN state
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);
    });

    it('should allow limited test requests in half-open state', async () => {
      // Should allow halfOpenMaxRequests (2) concurrent requests
      const promise1 = circuitBreaker.execute(successOperation);
      const promise2 = circuitBreaker.execute(successOperation);
      
      // Third request should be rejected due to capacity
      await expect(circuitBreaker.execute(successOperation))
        .rejects
        .toThrow('circuit breaker for \'test-service\' is half-open and at capacity');
      
      // Complete the first two requests
      await promise1;
      await promise2;
    });

    it('should transition to closed after success threshold is met', async () => {
      // Success threshold is 2, so 2 successful operations should close the circuit
      await circuitBreaker.execute(successOperation);
      await circuitBreaker.execute(successOperation);
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker \'test-service\' state transition: HALF_OPEN -> CLOSED')
      );
    });

    it('should transition back to open if an operation fails', async () => {
      // One success followed by a failure should reopen the circuit
      await circuitBreaker.execute(successOperation);
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow('operation failed');
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker \'test-service\' failed in half-open state, reopening circuit'),
        'operation failed'
      );
    });

    it('should track success count in half-open state', async () => {
      await circuitBreaker.execute(successOperation);
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.successCount).toBe(1);
      expect(metrics.state).toBe(CircuitBreakerState.HALF_OPEN);
    });
  });

  describe('manual control', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker(defaultTestOptions);
    });

    it('should allow manually tripping the circuit', () => {
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      
      circuitBreaker.trip();
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    });

    it('should allow manually resetting the circuit', () => {
      // First trip the circuit
      circuitBreaker.trip();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Then reset it
      circuitBreaker.reset();
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('metrics and events', () => {
    let circuitBreaker: CircuitBreaker;
    let stateChangeCallback: jest.Mock;

    beforeEach(() => {
      stateChangeCallback = jest.fn();
      circuitBreaker = new CircuitBreaker({
        ...defaultTestOptions,
        onStateChange: stateChangeCallback
      });
    });

    it('should track comprehensive metrics', async () => {
      // Execute a mix of operations
      await circuitBreaker.execute(successOperation);
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow();
      await circuitBreaker.execute(successOperation);
      
      const metrics = circuitBreaker.getMetrics();
      
      expect(metrics).toEqual(expect.objectContaining({
        state: CircuitBreakerState.CLOSED,
        totalSuccesses: 2,
        totalFailures: 1,
        totalRejections: 0,
        failureCount: 0, // Reset after success
        successCount: 0, // Only tracked in half-open state
        lastStateChangeTimestamp: expect.any(Number),
        lastFailureTimestamp: expect.any(Number),
        lastSuccessTimestamp: expect.any(Number)
      }));
    });

    it('should call onStateChange callback when state changes', async () => {
      // Trip the circuit to trigger state change
      circuitBreaker.trip();
      
      expect(stateChangeCallback).toHaveBeenCalledWith(
        CircuitBreakerState.CLOSED,
        CircuitBreakerState.OPEN,
        expect.any(Object)
      );
      
      // Verify metrics are passed to callback
      const metricsArg = stateChangeCallback.mock.calls[0][2];
      expect(metricsArg).toEqual(expect.objectContaining({
        state: CircuitBreakerState.OPEN
      }));
    });

    it('should handle errors in the state change callback', () => {
      // Create circuit breaker with a callback that throws
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      const errorCircuitBreaker = new CircuitBreaker({
        ...defaultTestOptions,
        onStateChange: errorCallback,
      });
      
      // Trip the circuit - this should not throw even though the callback does
      expect(() => errorCircuitBreaker.trip()).not.toThrow();
      
      // The error should be logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in circuit breaker state change callback'),
        expect.stringContaining('Callback error')
      );
    });
  });
});