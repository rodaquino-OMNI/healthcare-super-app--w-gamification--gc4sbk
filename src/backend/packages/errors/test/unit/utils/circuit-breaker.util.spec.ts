import { CircuitBreaker, CircuitBreakerState, CircuitBreakerOptions } from '../../../src/utils/circuit-breaker';

describe('CircuitBreaker', () => {
  // Mock the Date.now function to control time
  let now = 0;
  const realDateNow = Date.now;
  
  beforeEach(() => {
    now = 0;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper function to advance time
  const advanceTime = (ms: number) => {
    now += ms;
  };

  describe('Initial State', () => {
    it('should start in closed state', () => {
      const circuitBreaker = new CircuitBreaker();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should use default options when none provided', () => {
      const circuitBreaker = new CircuitBreaker();
      expect(circuitBreaker.getOptions()).toEqual(expect.objectContaining({
        failureThreshold: 5,
        resetTimeout: 30000, // 30 seconds
        monitorInterval: 5000, // 5 seconds
      }));
    });

    it('should accept custom options', () => {
      const options: CircuitBreakerOptions = {
        failureThreshold: 3,
        resetTimeout: 10000,
        monitorInterval: 2000,
      };
      const circuitBreaker = new CircuitBreaker(options);
      expect(circuitBreaker.getOptions()).toEqual(expect.objectContaining(options));
    });
  });

  describe('Closed State', () => {
    it('should execute operations normally when closed', async () => {
      const circuitBreaker = new CircuitBreaker();
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should track failures but remain closed when below threshold', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3
      });
      
      const operation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Execute operation twice (below threshold of 3)
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.getFailureCount()).toBe(2);
    });

    it('should trip open when failures reach threshold', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3
      });
      
      const operation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Execute operation three times (reaching threshold)
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      expect(circuitBreaker.getFailureCount()).toBe(3);
    });

    it('should reset failure count after successful execution', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3
      });
      
      const failOperation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      const successOperation = jest.fn().mockResolvedValue('success');
      
      // Execute failing operation twice
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow('Service unavailable');
      
      expect(circuitBreaker.getFailureCount()).toBe(2);
      
      // Execute successful operation
      await circuitBreaker.execute(successOperation);
      
      expect(circuitBreaker.getFailureCount()).toBe(0);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('Open State', () => {
    it('should reject operations immediately when open', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 10000
      });
      
      const operation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Trip the circuit breaker
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Reset the mock to track new calls
      operation.mockClear();
      
      // Try to execute operation when circuit is open
      await expect(circuitBreaker.execute(operation))
        .rejects.toThrow('Circuit breaker is open');
      
      // Operation should not be called when circuit is open
      expect(operation).not.toHaveBeenCalled();
    });

    it('should use fallback function when provided and circuit is open', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 10000
      });
      
      const operation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      const fallback = jest.fn().mockResolvedValue('fallback result');
      
      // Trip the circuit breaker
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Execute with fallback when circuit is open
      const result = await circuitBreaker.execute(operation, fallback);
      
      expect(result).toBe('fallback result');
      expect(operation).not.toHaveBeenCalledTimes(3); // Should not call the main operation
      expect(fallback).toHaveBeenCalledTimes(1);
    });

    it('should transition to half-open after reset timeout', async () => {
      const resetTimeout = 10000; // 10 seconds
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout
      });
      
      const operation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Trip the circuit breaker
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Advance time to just before the reset timeout
      advanceTime(resetTimeout - 1);
      
      // Circuit should still be open
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Advance time to after the reset timeout
      advanceTime(2);
      
      // Circuit should now be half-open
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);
    });
  });

  describe('Half-Open State', () => {
    it('should allow a single test request when half-open', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 10000
      });
      
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockResolvedValueOnce('success');
      
      // Trip the circuit breaker
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Advance time to after the reset timeout
      advanceTime(10001);
      
      // Circuit should now be half-open
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);
      
      // Execute operation in half-open state
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      
      // Circuit should be closed after successful test request
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should reopen the circuit if the test request fails', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 10000
      });
      
      // Create an operation that will fail even after the circuit is half-open
      const operation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Trip the circuit breaker
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Advance time to after the reset timeout
      advanceTime(10001);
      
      // Circuit should now be half-open
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);
      
      // Execute operation in half-open state (will fail)
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      
      // Circuit should be open again after failed test request
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    });

    it('should reset the failure count when transitioning to closed state', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 10000
      });
      
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockResolvedValueOnce('success');
      
      // Trip the circuit breaker
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      
      expect(circuitBreaker.getFailureCount()).toBe(2);
      
      // Advance time to after the reset timeout
      advanceTime(10001);
      
      // Execute successful operation in half-open state
      await circuitBreaker.execute(operation);
      
      // Failure count should be reset
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });

  describe('Event Callbacks', () => {
    it('should trigger onStateChange callback when state changes', async () => {
      const onStateChange = jest.fn();
      
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 10000,
        onStateChange
      });
      
      const operation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Trip the circuit breaker
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      
      // Should trigger onStateChange when transitioning from CLOSED to OPEN
      expect(onStateChange).toHaveBeenCalledWith(
        CircuitBreakerState.CLOSED,
        CircuitBreakerState.OPEN
      );
      
      // Reset mock to track new calls
      onStateChange.mockClear();
      
      // Advance time to after the reset timeout
      advanceTime(10001);
      
      // Should trigger onStateChange when transitioning from OPEN to HALF_OPEN
      expect(onStateChange).toHaveBeenCalledWith(
        CircuitBreakerState.OPEN,
        CircuitBreakerState.HALF_OPEN
      );
    });

    it('should trigger onSuccess callback on successful execution', async () => {
      const onSuccess = jest.fn();
      
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        onSuccess
      });
      
      const operation = jest.fn().mockResolvedValue('success');
      
      // Execute successful operation
      await circuitBreaker.execute(operation);
      
      expect(onSuccess).toHaveBeenCalledWith('success');
    });

    it('should trigger onError callback on failed execution', async () => {
      const onError = jest.fn();
      const error = new Error('Service unavailable');
      
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        onError
      });
      
      const operation = jest.fn().mockRejectedValue(error);
      
      // Execute failing operation
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('Advanced Configuration', () => {
    it('should support custom error detection', async () => {
      // Only count network errors towards the failure threshold
      const isFailure = (error: Error) => error.message.includes('network');
      
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        isFailure
      });
      
      const networkError = new Error('network error');
      const validationError = new Error('validation error');
      
      const operation1 = jest.fn().mockRejectedValue(networkError);
      const operation2 = jest.fn().mockRejectedValue(validationError);
      
      // Network error should count towards failure threshold
      await expect(circuitBreaker.execute(operation1)).rejects.toThrow('network error');
      await expect(circuitBreaker.execute(operation1)).rejects.toThrow('network error');
      
      // Circuit should be open after two network errors
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Reset circuit breaker for next test
      circuitBreaker.reset();
      
      // Validation errors should not count towards failure threshold
      await expect(circuitBreaker.execute(operation2)).rejects.toThrow('validation error');
      await expect(circuitBreaker.execute(operation2)).rejects.toThrow('validation error');
      
      // Circuit should still be closed after validation errors
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should support custom health check function', async () => {
      const healthCheck = jest.fn().mockResolvedValue(true);
      
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 10000,
        healthCheck
      });
      
      const operation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Trip the circuit breaker
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Manually check health
      await circuitBreaker.checkHealth();
      
      // Health check should be called
      expect(healthCheck).toHaveBeenCalled();
      
      // Circuit should be half-open after successful health check
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);
    });

    it('should support custom monitoring interval', async () => {
      const healthCheck = jest.fn().mockResolvedValue(true);
      
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 10000,
        monitorInterval: 5000, // 5 seconds
        healthCheck
      });
      
      const operation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Trip the circuit breaker
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Advance time to just before the monitor interval
      advanceTime(4999);
      
      // Health check should not be called yet
      expect(healthCheck).not.toHaveBeenCalled();
      
      // Advance time to after the monitor interval
      advanceTime(2);
      
      // Health check should be called after monitor interval
      expect(healthCheck).toHaveBeenCalled();
    });
  });

  describe('Reset and Manual Control', () => {
    it('should allow manual reset of the circuit breaker', () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2
      });
      
      // Manually set state and failure count
      circuitBreaker['state'] = CircuitBreakerState.OPEN;
      circuitBreaker['failureCount'] = 5;
      
      // Reset the circuit breaker
      circuitBreaker.reset();
      
      // Should be back to initial state
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });

    it('should allow manual trip of the circuit breaker', () => {
      const circuitBreaker = new CircuitBreaker();
      
      // Manually trip the circuit breaker
      circuitBreaker.trip();
      
      // Should be in open state
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    });

    it('should allow forcing the circuit closed', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2
      });
      
      const operation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Trip the circuit breaker
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Service unavailable');
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Force the circuit closed
      circuitBreaker.forceClosed();
      
      // Should be in closed state with reset failure count
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });
});