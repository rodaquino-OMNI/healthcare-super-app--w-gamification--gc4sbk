/**
 * @file circuit-breaker.util.spec.ts
 * @description Unit tests for the circuit breaker utility that prevents cascading failures
 * when dependent services are unavailable.
 */

import { jest } from '@jest/globals';
import {
  CircuitBreaker,
  CircuitState,
  CircuitOpenError,
  createCircuitBreaker,
  createCriticalCircuitBreaker,
  createNonCriticalCircuitBreaker,
  cachedDataFallback,
  defaultValueFallback,
  emptyResultFallback,
  rethrowWithContextFallback,
  CircuitBreakerOptions,
  CircuitMetrics,
} from '../../../src/utils/circuit-breaker';
import { CIRCUIT_BREAKER_CONFIG } from '../../../src/constants';

describe('CircuitBreaker', () => {
  // Mock timers for testing time-dependent behavior
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create a circuit breaker with default options', () => {
      const circuitBreaker = new CircuitBreaker();
      
      expect(circuitBreaker.currentState).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.metrics.successCount).toBe(0);
      expect(circuitBreaker.metrics.failureCount).toBe(0);
      expect(circuitBreaker.metrics.rejectCount).toBe(0);
      expect(circuitBreaker.metrics.totalCount).toBe(0);
      expect(circuitBreaker.metrics.failureRate).toBe(0);
    });

    it('should create a circuit breaker with custom options', () => {
      const options: CircuitBreakerOptions = {
        failureThresholdPercentage: 25,
        requestVolumeThreshold: 10,
        rollingWindowMs: 5000,
        resetTimeoutMs: 15000,
        name: 'test-circuit',
      };

      const circuitBreaker = new CircuitBreaker(options);
      expect(circuitBreaker.currentState).toBe(CircuitState.CLOSED);
    });
  });

  describe('execute method', () => {
    it('should execute an operation successfully when circuit is closed', async () => {
      const circuitBreaker = new CircuitBreaker();
      const operation = jest.fn().mockResolvedValue('success');

      const result = await circuitBreaker.execute(operation, 'test-operation');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
      expect(circuitBreaker.metrics.successCount).toBe(1);
      expect(circuitBreaker.metrics.failureCount).toBe(0);
      expect(circuitBreaker.currentState).toBe(CircuitState.CLOSED);
    });

    it('should record a failure when operation throws an error', async () => {
      const circuitBreaker = new CircuitBreaker();
      const error = new Error('test error');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(circuitBreaker.execute(operation, 'test-operation')).rejects.toThrow('test error');

      expect(operation).toHaveBeenCalled();
      expect(circuitBreaker.metrics.successCount).toBe(0);
      expect(circuitBreaker.metrics.failureCount).toBe(1);
      expect(circuitBreaker.currentState).toBe(CircuitState.CLOSED);
    });

    it('should reject operations when circuit is open', async () => {
      const circuitBreaker = new CircuitBreaker();
      const operation = jest.fn().mockResolvedValue('success');

      // Manually open the circuit
      circuitBreaker.open();

      await expect(circuitBreaker.execute(operation, 'test-operation')).rejects.toThrow(CircuitOpenError);

      expect(operation).not.toHaveBeenCalled();
      expect(circuitBreaker.metrics.rejectCount).toBe(1);
      expect(circuitBreaker.currentState).toBe(CircuitState.OPEN);
    });

    it('should allow a single operation when in half-open state', async () => {
      const circuitBreaker = new CircuitBreaker();
      const operation = jest.fn().mockResolvedValue('success');

      // Manually open the circuit then set to half-open
      circuitBreaker.open();
      // @ts-ignore - Accessing private method for testing
      circuitBreaker.changeState(CircuitState.HALF_OPEN);

      const result = await circuitBreaker.execute(operation, 'test-operation');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
      expect(circuitBreaker.metrics.successCount).toBe(1);
      expect(circuitBreaker.currentState).toBe(CircuitState.CLOSED);
    });

    it('should transition from half-open to open on failure', async () => {
      const circuitBreaker = new CircuitBreaker();
      const error = new Error('test error');
      const operation = jest.fn().mockRejectedValue(error);

      // Manually open the circuit then set to half-open
      circuitBreaker.open();
      // @ts-ignore - Accessing private method for testing
      circuitBreaker.changeState(CircuitState.HALF_OPEN);

      await expect(circuitBreaker.execute(operation, 'test-operation')).rejects.toThrow('test error');

      expect(operation).toHaveBeenCalled();
      expect(circuitBreaker.metrics.failureCount).toBe(1);
      expect(circuitBreaker.currentState).toBe(CircuitState.OPEN);
    });
  });

  describe('executeWithFallback method', () => {
    it('should execute the operation when circuit is closed', async () => {
      const circuitBreaker = new CircuitBreaker();
      const operation = jest.fn().mockResolvedValue('success');
      const fallback = jest.fn().mockReturnValue('fallback');

      const result = await circuitBreaker.executeWithFallback(operation, fallback, 'test-operation');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
      expect(fallback).not.toHaveBeenCalled();
    });

    it('should execute the fallback when operation fails', async () => {
      const circuitBreaker = new CircuitBreaker();
      const error = new Error('test error');
      const operation = jest.fn().mockRejectedValue(error);
      const fallback = jest.fn().mockReturnValue('fallback');

      const result = await circuitBreaker.executeWithFallback(operation, fallback, 'test-operation');

      expect(result).toBe('fallback');
      expect(operation).toHaveBeenCalled();
      expect(fallback).toHaveBeenCalledWith(error);
    });

    it('should execute the fallback when circuit is open', async () => {
      const circuitBreaker = new CircuitBreaker();
      const operation = jest.fn().mockResolvedValue('success');
      const fallback = jest.fn().mockReturnValue('fallback');

      // Manually open the circuit
      circuitBreaker.open();

      const result = await circuitBreaker.executeWithFallback(operation, fallback, 'test-operation');

      expect(result).toBe('fallback');
      expect(operation).not.toHaveBeenCalled();
      expect(fallback).toHaveBeenCalled();
      expect(fallback.mock.calls[0][0]).toBeInstanceOf(CircuitOpenError);
    });
  });

  describe('decorate and decorateWithFallback methods', () => {
    it('should decorate a function with circuit breaker functionality', async () => {
      const circuitBreaker = new CircuitBreaker();
      const operation = jest.fn().mockResolvedValue('success');
      const decorated = circuitBreaker.decorate(operation, 'test-operation');

      const result = await decorated('arg1', 'arg2');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledWith('arg1', 'arg2');
      expect(circuitBreaker.metrics.successCount).toBe(1);
    });

    it('should decorate a function with circuit breaker and fallback functionality', async () => {
      const circuitBreaker = new CircuitBreaker();
      const error = new Error('test error');
      const operation = jest.fn().mockRejectedValue(error);
      const fallback = jest.fn().mockReturnValue('fallback');
      const decorated = circuitBreaker.decorateWithFallback(operation, fallback, 'test-operation');

      const result = await decorated('arg1', 'arg2');

      expect(result).toBe('fallback');
      expect(operation).toHaveBeenCalledWith('arg1', 'arg2');
      expect(fallback).toHaveBeenCalledWith(error, 'arg1', 'arg2');
      expect(circuitBreaker.metrics.failureCount).toBe(1);
    });
  });

  describe('state transitions', () => {
    it('should trip the circuit when failure threshold is exceeded', async () => {
      // Create a circuit breaker with a low threshold for testing
      const circuitBreaker = new CircuitBreaker({
        failureThresholdPercentage: 50,
        requestVolumeThreshold: 4, // Trip after 2 failures in 4 requests
      });

      const successOperation = jest.fn().mockResolvedValue('success');
      const failOperation = jest.fn().mockRejectedValue(new Error('test error'));

      // Execute 2 successful operations
      await circuitBreaker.execute(successOperation, 'success-1');
      await circuitBreaker.execute(successOperation, 'success-2');
      expect(circuitBreaker.currentState).toBe(CircuitState.CLOSED);

      // Execute 2 failing operations, which should trip the circuit
      await expect(circuitBreaker.execute(failOperation, 'fail-1')).rejects.toThrow();
      await expect(circuitBreaker.execute(failOperation, 'fail-2')).rejects.toThrow();

      // Circuit should now be open
      expect(circuitBreaker.currentState).toBe(CircuitState.OPEN);
      expect(circuitBreaker.metrics.failureRate).toBe(50);
    });

    it('should not trip the circuit when below the request volume threshold', async () => {
      // Create a circuit breaker with specific thresholds
      const circuitBreaker = new CircuitBreaker({
        failureThresholdPercentage: 50,
        requestVolumeThreshold: 10, // Need at least 10 requests
      });

      const failOperation = jest.fn().mockRejectedValue(new Error('test error'));

      // Execute 5 failing operations (below the request volume threshold)
      for (let i = 0; i < 5; i++) {
        await expect(circuitBreaker.execute(failOperation, `fail-${i}`)).rejects.toThrow();
      }

      // Circuit should still be closed despite 100% failure rate
      expect(circuitBreaker.currentState).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.metrics.failureRate).toBe(100);
    });

    it('should transition from open to half-open after reset timeout', async () => {
      const resetTimeoutMs = 1000;
      const circuitBreaker = new CircuitBreaker({
        resetTimeoutMs,
      });

      // Manually open the circuit
      circuitBreaker.open();
      expect(circuitBreaker.currentState).toBe(CircuitState.OPEN);

      // Advance time past the reset timeout
      jest.advanceTimersByTime(resetTimeoutMs + 100);

      // Circuit should now be half-open
      expect(circuitBreaker.currentState).toBe(CircuitState.HALF_OPEN);
    });

    it('should transition from half-open to closed on successful execution', async () => {
      const circuitBreaker = new CircuitBreaker();
      const operation = jest.fn().mockResolvedValue('success');

      // Manually set to half-open state
      circuitBreaker.open();
      // @ts-ignore - Accessing private method for testing
      circuitBreaker.changeState(CircuitState.HALF_OPEN);

      // Execute a successful operation
      await circuitBreaker.execute(operation, 'test-operation');

      // Circuit should now be closed
      expect(circuitBreaker.currentState).toBe(CircuitState.CLOSED);
    });

    it('should remove stale results outside the rolling window', async () => {
      const rollingWindowMs = 1000;
      const circuitBreaker = new CircuitBreaker({
        rollingWindowMs,
      });

      const successOperation = jest.fn().mockResolvedValue('success');
      const failOperation = jest.fn().mockRejectedValue(new Error('test error'));

      // Execute operations
      await circuitBreaker.execute(successOperation, 'success-1');
      await expect(circuitBreaker.execute(failOperation, 'fail-1')).rejects.toThrow();

      expect(circuitBreaker.metrics.successCount).toBe(1);
      expect(circuitBreaker.metrics.failureCount).toBe(1);

      // Advance time past the rolling window
      jest.advanceTimersByTime(rollingWindowMs + 100);

      // Metrics should be reset
      expect(circuitBreaker.metrics.successCount).toBe(0);
      expect(circuitBreaker.metrics.failureCount).toBe(0);
    });
  });

  describe('callbacks', () => {
    it('should call onStateChange when circuit state changes', () => {
      const onStateChange = jest.fn();
      const circuitBreaker = new CircuitBreaker({
        onStateChange,
      });

      // Change state to open
      circuitBreaker.open();

      expect(onStateChange).toHaveBeenCalledWith(
        CircuitState.CLOSED,
        CircuitState.OPEN,
        expect.any(Object)
      );
    });

    it('should call onSuccess when operation succeeds', async () => {
      const onSuccess = jest.fn();
      const circuitBreaker = new CircuitBreaker({
        onSuccess,
      });

      const operation = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(operation, 'test-operation');

      expect(onSuccess).toHaveBeenCalledWith('test-operation');
    });

    it('should call onFailure when operation fails', async () => {
      const onFailure = jest.fn();
      const circuitBreaker = new CircuitBreaker({
        onFailure,
      });

      const error = new Error('test error');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(circuitBreaker.execute(operation, 'test-operation')).rejects.toThrow();

      expect(onFailure).toHaveBeenCalledWith(error, 'test-operation');
    });
  });

  describe('reset, open, and close methods', () => {
    it('should reset circuit breaker metrics', () => {
      const circuitBreaker = new CircuitBreaker();
      const operation = jest.fn().mockResolvedValue('success');
      const failOperation = jest.fn().mockRejectedValue(new Error('test error'));

      // Execute operations to record metrics
      circuitBreaker.execute(operation, 'success-1');
      circuitBreaker.executeWithFallback(failOperation, () => 'fallback', 'fail-1');

      // Reset the circuit breaker
      circuitBreaker.reset();

      // Metrics should be reset
      expect(circuitBreaker.metrics.successCount).toBe(0);
      expect(circuitBreaker.metrics.failureCount).toBe(0);
      expect(circuitBreaker.metrics.rejectCount).toBe(0);
      expect(circuitBreaker.currentState).toBe(CircuitState.CLOSED);
    });

    it('should manually open the circuit', () => {
      const circuitBreaker = new CircuitBreaker();

      // Manually open the circuit
      circuitBreaker.open();

      expect(circuitBreaker.currentState).toBe(CircuitState.OPEN);
    });

    it('should manually close the circuit', () => {
      const circuitBreaker = new CircuitBreaker();

      // Manually open then close the circuit
      circuitBreaker.open();
      circuitBreaker.close();

      expect(circuitBreaker.currentState).toBe(CircuitState.CLOSED);
    });
  });

  describe('CircuitOpenError', () => {
    it('should include circuit metrics in the error', () => {
      const circuitBreaker = new CircuitBreaker();

      // Manually open the circuit
      circuitBreaker.open();

      // Try to execute an operation
      const operation = jest.fn().mockResolvedValue('success');
      return circuitBreaker.execute(operation).catch((error) => {
        expect(error).toBeInstanceOf(CircuitOpenError);
        expect(error.metrics).toBeDefined();
        expect(error.metrics.currentState).toBe(CircuitState.OPEN);
        expect(error.name).toBe('CircuitOpenError');
      });
    });
  });
});

describe('Factory functions', () => {
  it('should create a circuit breaker with default configuration', () => {
    const circuitBreaker = createCircuitBreaker();
    expect(circuitBreaker).toBeInstanceOf(CircuitBreaker);
    expect(circuitBreaker.currentState).toBe(CircuitState.CLOSED);
  });

  it('should create a circuit breaker with critical service configuration', () => {
    const circuitBreaker = createCriticalCircuitBreaker();
    expect(circuitBreaker).toBeInstanceOf(CircuitBreaker);
    
    // Check that critical config was applied
    const criticalConfig = CIRCUIT_BREAKER_CONFIG.CRITICAL;
    // @ts-ignore - Accessing private properties for testing
    expect(circuitBreaker.failureThresholdPercentage).toBe(criticalConfig.FAILURE_THRESHOLD_PERCENTAGE);
    // @ts-ignore - Accessing private properties for testing
    expect(circuitBreaker.requestVolumeThreshold).toBe(criticalConfig.REQUEST_VOLUME_THRESHOLD);
  });

  it('should create a circuit breaker with non-critical service configuration', () => {
    const circuitBreaker = createNonCriticalCircuitBreaker();
    expect(circuitBreaker).toBeInstanceOf(CircuitBreaker);
    
    // Check that non-critical config was applied
    const nonCriticalConfig = CIRCUIT_BREAKER_CONFIG.NON_CRITICAL;
    // @ts-ignore - Accessing private properties for testing
    expect(circuitBreaker.failureThresholdPercentage).toBe(nonCriticalConfig.FAILURE_THRESHOLD_PERCENTAGE);
    // @ts-ignore - Accessing private properties for testing
    expect(circuitBreaker.requestVolumeThreshold).toBe(nonCriticalConfig.REQUEST_VOLUME_THRESHOLD);
  });

  it('should allow overriding factory defaults with custom options', () => {
    const customOptions = {
      name: 'custom-circuit',
      failureThresholdPercentage: 42,
    };
    
    const circuitBreaker = createCircuitBreaker(customOptions);
    
    // @ts-ignore - Accessing private properties for testing
    expect(circuitBreaker.name).toBe('custom-circuit');
    // @ts-ignore - Accessing private properties for testing
    expect(circuitBreaker.failureThresholdPercentage).toBe(42);
  });
});

describe('Fallback functions', () => {
  describe('cachedDataFallback', () => {
    it('should return cached data from an object', () => {
      const cache = { key1: 'value1', key2: 'value2' };
      const fallback = cachedDataFallback(cache, 'key1');
      
      const result = fallback(new Error('test error'));
      expect(result).toBe('value1');
    });

    it('should return cached data from a function', () => {
      const cacheFunction = (key: string) => {
        const cache = { key1: 'value1', key2: 'value2' };
        return cache[key];
      };
      
      const fallback = cachedDataFallback(cacheFunction, 'key2');
      
      const result = fallback(new Error('test error'));
      expect(result).toBe('value2');
    });

    it('should throw an error when cached data is not available', () => {
      const cache = { key1: 'value1' };
      const fallback = cachedDataFallback(cache, 'nonexistent');
      
      expect(() => fallback(new Error('test error'))).toThrow('No cached data available');
    });
  });

  describe('defaultValueFallback', () => {
    it('should return the default value', () => {
      const defaultValue = { name: 'default' };
      const fallback = defaultValueFallback(defaultValue);
      
      const result = fallback(new Error('test error'));
      expect(result).toEqual(defaultValue);
    });
  });

  describe('emptyResultFallback', () => {
    it('should return an empty array for array-like return types', () => {
      const fallback = emptyResultFallback<any[]>();
      
      const result = fallback(new Error('test error'));
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should return an empty object for object return types', () => {
      const fallback = emptyResultFallback<object>();
      
      const result = fallback(new Error('test error'));
      expect(result).toEqual({});
    });
  });

  describe('rethrowWithContextFallback', () => {
    it('should rethrow the error with additional context', () => {
      const context = { userId: '123', operation: 'getData' };
      const fallback = rethrowWithContextFallback(context);
      const originalError = new Error('Original error');
      
      expect(() => fallback(originalError)).toThrow(/Original error.*Context.*userId.*operation/);
    });

    it('should preserve the original error name and stack', () => {
      const context = { userId: '123' };
      const fallback = rethrowWithContextFallback(context);
      
      const originalError = new Error('Original error');
      originalError.name = 'CustomError';
      const originalStack = originalError.stack;
      
      try {
        fallback(originalError);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.name).toBe('CustomError');
        expect(error.stack).toBe(originalStack);
      }
    });
  });
});