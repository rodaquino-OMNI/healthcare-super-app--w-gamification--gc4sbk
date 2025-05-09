/**
 * @file connection-retry.spec.ts
 * @description Unit tests for the ConnectionRetry class that provides retry strategies
 * and policies for database connection failures.
 */

import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ErrorType, TechnicalError } from '@austa/errors';
import * as utils from '@austa/utils';

import { ConnectionRetry, RetryOperationType, IRetryResult } from '../../src/connection/connection-retry';
import { DatabaseTechnology } from '../../src/types/connection.types';
import { DatabaseError, DatabaseErrorRecoverability, DatabaseErrorType } from '../../src/errors/database-error.types';

// Mock the sleep function to avoid actual waiting in tests
jest.mock('@austa/utils', () => ({
  ...jest.requireActual('@austa/utils'),
  sleep: jest.fn().mockResolvedValue(undefined),
  generateRandomId: jest.fn().mockReturnValue('test-id-123'),
}));

describe('ConnectionRetry', () => {
  // Default connection config for testing
  const defaultConnectionConfig = {
    technology: DatabaseTechnology.POSTGRESQL,
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password',
    debug: true,
    journeyId: 'test-journey',
    retry: {
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 5000,
      backoffFactor: 2,
      useJitter: true,
      retryableErrors: [ErrorType.TRANSIENT, ErrorType.CONNECTION, ErrorType.TIMEOUT],
    },
  };

  // Create a new ConnectionRetry instance before each test
  let connectionRetry: ConnectionRetry;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new ConnectionRetry instance
    connectionRetry = new ConnectionRetry(defaultConnectionConfig);
  });

  describe('Exponential Backoff Algorithm', () => {
    it('should apply exponential backoff for retry delays', async () => {
      // Create a function that fails the first 3 times and succeeds on the 4th attempt
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockRejectedValueOnce(new Error('Failure 3'))
        .mockResolvedValueOnce('Success');

      // Execute the operation with retry
      await connectionRetry.executeWithRetry(RetryOperationType.CONNECT, mockOperation);

      // Verify the sleep function was called with exponentially increasing delays
      expect(utils.sleep).toHaveBeenCalledTimes(3);
      
      // Get the actual delay values passed to sleep
      const sleepCalls = (utils.sleep as jest.Mock).mock.calls;
      const firstDelay = sleepCalls[0][0];
      const secondDelay = sleepCalls[1][0];
      const thirdDelay = sleepCalls[2][0];

      // With jitter enabled, we can't check exact values, but we can verify the trend
      // The delays should generally increase (though jitter might occasionally cause a decrease)
      expect(secondDelay).toBeGreaterThanOrEqual(firstDelay * 0.75); // Allow for jitter
      expect(thirdDelay).toBeGreaterThanOrEqual(secondDelay * 0.75); // Allow for jitter
    });

    it('should respect maxDelayMs limit for retry delays', async () => {
      // Create a connection retry with a small maxDelayMs
      const configWithSmallMaxDelay = {
        ...defaultConnectionConfig,
        retry: {
          ...defaultConnectionConfig.retry,
          initialDelayMs: 1000,
          maxDelayMs: 2000,
          backoffFactor: 10, // This would cause delays to exceed maxDelayMs quickly
        },
      };
      const retryWithSmallMaxDelay = new ConnectionRetry(configWithSmallMaxDelay);

      // Create a function that fails multiple times
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockRejectedValueOnce(new Error('Failure 3'))
        .mockResolvedValueOnce('Success');

      // Execute the operation with retry
      await retryWithSmallMaxDelay.executeWithRetry(RetryOperationType.CONNECT, mockOperation);

      // Verify the sleep function was called with delays that respect maxDelayMs
      expect(utils.sleep).toHaveBeenCalledTimes(3);
      
      // Get the actual delay values passed to sleep
      const sleepCalls = (utils.sleep as jest.Mock).mock.calls;
      const delays = sleepCalls.map(call => call[0]);

      // All delays should be less than or equal to maxDelayMs
      delays.forEach(delay => {
        expect(delay).toBeLessThanOrEqual(configWithSmallMaxDelay.retry.maxDelayMs);
      });
    });

    it('should use different backoff factors as configured', async () => {
      // Create a connection retry with a larger backoff factor
      const configWithLargeBackoff = {
        ...defaultConnectionConfig,
        retry: {
          ...defaultConnectionConfig.retry,
          initialDelayMs: 100,
          backoffFactor: 4, // Larger backoff factor
          useJitter: false, // Disable jitter for predictable delays
        },
      };
      const retryWithLargeBackoff = new ConnectionRetry(configWithLargeBackoff);

      // Create a function that fails multiple times
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockResolvedValueOnce('Success');

      // Execute the operation with retry
      await retryWithLargeBackoff.executeWithRetry(RetryOperationType.CONNECT, mockOperation);

      // Verify the sleep function was called with the expected delays
      expect(utils.sleep).toHaveBeenCalledTimes(2);
      
      // Get the actual delay values passed to sleep
      const sleepCalls = (utils.sleep as jest.Mock).mock.calls;
      
      // With jitter disabled, we can check exact values
      // First retry: initialDelayMs = 100
      expect(sleepCalls[0][0]).toBe(100);
      
      // Second retry: initialDelayMs * (backoffFactor ^ attempt) = 100 * (4 ^ 1) = 400
      expect(sleepCalls[1][0]).toBe(400);
    });
  });

  describe('Jitter Implementation', () => {
    it('should add jitter to retry delays when enabled', async () => {
      // Create a connection retry with jitter enabled
      const configWithJitter = {
        ...defaultConnectionConfig,
        retry: {
          ...defaultConnectionConfig.retry,
          initialDelayMs: 1000,
          backoffFactor: 2,
          useJitter: true,
        },
      };
      const retryWithJitter = new ConnectionRetry(configWithJitter);

      // Create multiple mock operations that all fail once
      const mockOperations = Array(10).fill(null).map(() => 
        jest.fn()
          .mockRejectedValueOnce(new Error('Failure'))
          .mockResolvedValueOnce('Success')
      );

      // Execute all operations with retry
      await Promise.all(mockOperations.map(op => 
        retryWithJitter.executeWithRetry(RetryOperationType.CONNECT, op)
      ));

      // Verify the sleep function was called multiple times
      expect(utils.sleep).toHaveBeenCalledTimes(10);
      
      // Get the actual delay values passed to sleep
      const sleepCalls = (utils.sleep as jest.Mock).mock.calls;
      const delays = sleepCalls.map(call => call[0]);

      // With jitter enabled, we should see variation in the delays
      // Calculate standard deviation to verify variation
      const mean = delays.reduce((sum, delay) => sum + delay, 0) / delays.length;
      const variance = delays.reduce((sum, delay) => sum + Math.pow(delay - mean, 2), 0) / delays.length;
      const stdDev = Math.sqrt(variance);

      // If jitter is working, we should see some variation in the delays
      expect(stdDev).toBeGreaterThan(0);

      // Check that we have at least some different delay values
      const uniqueDelays = new Set(delays).size;
      expect(uniqueDelays).toBeGreaterThan(1);
    });

    it('should not add jitter to retry delays when disabled', async () => {
      // Create a connection retry with jitter disabled
      const configWithoutJitter = {
        ...defaultConnectionConfig,
        retry: {
          ...defaultConnectionConfig.retry,
          initialDelayMs: 1000,
          backoffFactor: 2,
          useJitter: false,
        },
      };
      const retryWithoutJitter = new ConnectionRetry(configWithoutJitter);

      // Create multiple mock operations that all fail once at the same attempt
      const mockOperations = Array(5).fill(null).map(() => 
        jest.fn()
          .mockRejectedValueOnce(new Error('Failure'))
          .mockResolvedValueOnce('Success')
      );

      // Execute all operations with retry
      await Promise.all(mockOperations.map(op => 
        retryWithoutJitter.executeWithRetry(RetryOperationType.CONNECT, op)
      ));

      // Verify the sleep function was called multiple times
      expect(utils.sleep).toHaveBeenCalledTimes(5);
      
      // Get the actual delay values passed to sleep
      const sleepCalls = (utils.sleep as jest.Mock).mock.calls;
      const delays = sleepCalls.map(call => call[0]);

      // With jitter disabled, all delays for the same attempt should be identical
      // Since all operations failed at the first attempt, all delays should be the same
      const uniqueDelays = new Set(delays).size;
      expect(uniqueDelays).toBe(1);
      expect(delays[0]).toBe(1000); // initialDelayMs
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should open circuit after consecutive failures', async () => {
      // Create a connection retry with a low failure threshold
      const configWithLowThreshold = {
        ...defaultConnectionConfig,
        retry: {
          ...defaultConnectionConfig.retry,
          maxRetries: 0, // No retries to simplify testing
        },
      };
      const retryWithLowThreshold = new ConnectionRetry(configWithLowThreshold);

      // Get the circuit breaker and modify its threshold for testing
      const circuitBreaker = retryWithLowThreshold.getCircuitBreakerState(RetryOperationType.CONNECT);
      circuitBreaker.failureThreshold = 3; // Open after 3 failures

      // Create a function that always fails
      const mockOperation = jest.fn().mockRejectedValue(new Error('Always fails'));

      // Execute the operation multiple times to trigger circuit breaker
      for (let i = 0; i < circuitBreaker.failureThreshold; i++) {
        await retryWithLowThreshold.executeWithRetry(RetryOperationType.CONNECT, mockOperation);
      }

      // Circuit should now be open
      const updatedCircuitState = retryWithLowThreshold.getCircuitBreakerState(RetryOperationType.CONNECT);
      expect(updatedCircuitState.isOpen).toBe(true);
      expect(updatedCircuitState.failureCount).toBe(circuitBreaker.failureThreshold);
      expect(updatedCircuitState.openedAt).toBeDefined();
      expect(updatedCircuitState.resetAt).toBeDefined();

      // Execute one more operation - it should fail immediately due to open circuit
      const result = await retryWithLowThreshold.executeWithRetry(RetryOperationType.CONNECT, mockOperation);
      
      // Verify the operation was not executed due to open circuit
      expect(mockOperation).toHaveBeenCalledTimes(circuitBreaker.failureThreshold);
      expect(result.success).toBe(false);
      expect(result.circuitBroken).toBe(true);
      expect(result.attempts).toBe(0);
    });

    it('should transition circuit to half-open state after timeout', async () => {
      // Create a connection retry with a low failure threshold and short reset timeout
      const configWithShortTimeout = {
        ...defaultConnectionConfig,
        retry: {
          ...defaultConnectionConfig.retry,
          maxRetries: 0, // No retries to simplify testing
        },
      };
      const retryWithShortTimeout = new ConnectionRetry(configWithShortTimeout);

      // Get the circuit breaker and modify its settings for testing
      const circuitBreaker = retryWithShortTimeout.getCircuitBreakerState(RetryOperationType.CONNECT);
      circuitBreaker.failureThreshold = 2; // Open after 2 failures
      circuitBreaker.resetTimeoutMs = 100; // Short timeout for testing

      // Create a function that fails initially
      const mockOperation = jest.fn().mockRejectedValue(new Error('Initial failure'));

      // Execute the operation to trigger circuit breaker
      for (let i = 0; i < circuitBreaker.failureThreshold; i++) {
        await retryWithShortTimeout.executeWithRetry(RetryOperationType.CONNECT, mockOperation);
      }

      // Circuit should now be open
      let updatedCircuitState = retryWithShortTimeout.getCircuitBreakerState(RetryOperationType.CONNECT);
      expect(updatedCircuitState.isOpen).toBe(true);

      // Simulate time passing - manually set resetAt to a past time
      updatedCircuitState.resetAt = new Date(Date.now() - 1000); // 1 second in the past

      // Change the mock to succeed for the test operation
      mockOperation.mockResolvedValueOnce('Success');

      // Execute operation again - it should be allowed through in half-open state
      const result = await retryWithShortTimeout.executeWithRetry(RetryOperationType.CONNECT, mockOperation);
      
      // Verify the operation was executed and succeeded
      expect(mockOperation).toHaveBeenCalledTimes(circuitBreaker.failureThreshold + 1);
      expect(result.success).toBe(true);
      expect(result.circuitBroken).toBe(false);

      // Circuit should still be open but with increased success count
      updatedCircuitState = retryWithShortTimeout.getCircuitBreakerState(RetryOperationType.CONNECT);
      expect(updatedCircuitState.isOpen).toBe(true);
      expect(updatedCircuitState.successCount).toBe(1);
    });

    it('should close circuit after successful operations in half-open state', async () => {
      // Create a connection retry
      const retryWithCircuitBreaker = new ConnectionRetry(defaultConnectionConfig);

      // Get the circuit breaker and modify its settings for testing
      const circuitBreaker = retryWithCircuitBreaker.getCircuitBreakerState(RetryOperationType.CONNECT);
      circuitBreaker.failureThreshold = 2; // Open after 2 failures
      circuitBreaker.successThreshold = 2; // Close after 2 successes
      circuitBreaker.resetTimeoutMs = 100; // Short timeout for testing

      // Create a function that fails initially
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockResolvedValueOnce('Success 1') // First success in half-open state
        .mockResolvedValueOnce('Success 2'); // Second success to close the circuit

      // Execute the operation to trigger circuit breaker
      for (let i = 0; i < circuitBreaker.failureThreshold; i++) {
        await retryWithCircuitBreaker.executeWithRetry(RetryOperationType.CONNECT, mockOperation);
      }

      // Circuit should now be open
      let updatedCircuitState = retryWithCircuitBreaker.getCircuitBreakerState(RetryOperationType.CONNECT);
      expect(updatedCircuitState.isOpen).toBe(true);

      // Simulate time passing - manually set resetAt to a past time
      updatedCircuitState.resetAt = new Date(Date.now() - 1000); // 1 second in the past

      // Execute operation for the first success in half-open state
      await retryWithCircuitBreaker.executeWithRetry(RetryOperationType.CONNECT, mockOperation);
      
      // Circuit should still be open but with increased success count
      updatedCircuitState = retryWithCircuitBreaker.getCircuitBreakerState(RetryOperationType.CONNECT);
      expect(updatedCircuitState.isOpen).toBe(true);
      expect(updatedCircuitState.successCount).toBe(1);

      // Execute operation for the second success to close the circuit
      await retryWithCircuitBreaker.executeWithRetry(RetryOperationType.CONNECT, mockOperation);

      // Circuit should now be closed
      updatedCircuitState = retryWithCircuitBreaker.getCircuitBreakerState(RetryOperationType.CONNECT);
      expect(updatedCircuitState.isOpen).toBe(false);
      expect(updatedCircuitState.failureCount).toBe(0);
      expect(updatedCircuitState.successCount).toBe(0);
      expect(updatedCircuitState.openedAt).toBeUndefined();
      expect(updatedCircuitState.resetAt).toBeUndefined();
    });
  });

  describe('Context-Aware Retry Policies', () => {
    it('should use different retry behaviors for different operation types', async () => {
      // Create a connection retry
      const retry = new ConnectionRetry(defaultConnectionConfig);

      // Create mock operations for different operation types
      const connectOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Connect failure'))
        .mockResolvedValueOnce('Connect success');

      const queryOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Query failure'))
        .mockResolvedValueOnce('Query success');

      // Execute operations with different operation types
      await retry.executeConnect(connectOperation);
      await retry.executeQuery(queryOperation);

      // Verify that each operation was executed with the correct operation type
      expect(connectOperation).toHaveBeenCalledTimes(2); // Initial failure + success
      expect(queryOperation).toHaveBeenCalledTimes(2); // Initial failure + success

      // Verify that the circuit breakers are separate for each operation type
      const connectCircuit = retry.getCircuitBreakerState(RetryOperationType.CONNECT);
      const queryCircuit = retry.getCircuitBreakerState(RetryOperationType.QUERY);

      // Each circuit should have recorded one failure
      expect(connectCircuit.failureCount).toBe(0); // Reset after success
      expect(queryCircuit.failureCount).toBe(0); // Reset after success
    });

    it('should handle journey-specific retry policies', async () => {
      // Create connection retries for different journeys
      const healthJourneyConfig = {
        ...defaultConnectionConfig,
        journeyId: 'health',
      };
      const healthRetry = new ConnectionRetry(healthJourneyConfig);

      const careJourneyConfig = {
        ...defaultConnectionConfig,
        journeyId: 'care',
      };
      const careRetry = new ConnectionRetry(careJourneyConfig);

      // Create mock operations that fail once for each journey
      const healthOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Health journey failure'))
        .mockResolvedValueOnce('Health journey success');

      const careOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Care journey failure'))
        .mockResolvedValueOnce('Care journey success');

      // Execute operations for different journeys
      await healthRetry.executeQuery(healthOperation);
      await careRetry.executeQuery(careOperation);

      // Verify that each operation was executed with the correct journey context
      expect(healthOperation).toHaveBeenCalledTimes(2); // Initial failure + success
      expect(careOperation).toHaveBeenCalledTimes(2); // Initial failure + success

      // Verify that the circuit breakers are separate for each journey
      const healthCircuit = healthRetry.getCircuitBreakerState(RetryOperationType.QUERY);
      const careCircuit = careRetry.getCircuitBreakerState(RetryOperationType.QUERY);

      // Each circuit should be independent
      expect(healthCircuit.failureCount).toBe(0); // Reset after success
      expect(careCircuit.failureCount).toBe(0); // Reset after success
    });
  });

  describe('Retry Limits', () => {
    it('should stop retrying after maxRetries is reached', async () => {
      // Create a connection retry with specific maxRetries
      const configWithMaxRetries = {
        ...defaultConnectionConfig,
        retry: {
          ...defaultConnectionConfig.retry,
          maxRetries: 2, // Allow 2 retries (3 attempts total)
        },
      };
      const retryWithLimit = new ConnectionRetry(configWithMaxRetries);

      // Create a function that always fails
      const mockOperation = jest.fn().mockRejectedValue(new Error('Always fails'));

      // Execute the operation with retry
      const result = await retryWithLimit.executeWithRetry(RetryOperationType.CONNECT, mockOperation);

      // Verify the operation was called the expected number of times
      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial attempt + 2 retries
      
      // Verify the sleep function was called for each retry
      expect(utils.sleep).toHaveBeenCalledTimes(2);

      // Verify the result indicates failure after all retries
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
      expect(result.error).toBeDefined();
    });

    it('should handle non-retryable errors without retrying', async () => {
      // Create a connection retry
      const retry = new ConnectionRetry(defaultConnectionConfig);

      // Create a function that fails with a non-retryable error
      const nonRetryableError = new DatabaseError(
        'Non-retryable integrity error',
        'DB_INTEG_001',
        DatabaseErrorType.INTEGRITY,
        { recoverability: DatabaseErrorRecoverability.PERMANENT }
      );
      const mockOperation = jest.fn().mockRejectedValue(nonRetryableError);

      // Execute the operation with retry
      const result = await retry.executeWithRetry(RetryOperationType.QUERY, mockOperation);

      // Verify the operation was called only once (no retries)
      expect(mockOperation).toHaveBeenCalledTimes(1);
      
      // Verify the sleep function was not called
      expect(utils.sleep).not.toHaveBeenCalled();

      // Verify the result indicates failure without retries
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(result.error).toBe(nonRetryableError);
    });

    it('should retry on retryable errors', async () => {
      // Create a connection retry
      const retry = new ConnectionRetry(defaultConnectionConfig);

      // Create a function that fails with a retryable error
      const retryableError = new DatabaseError(
        'Retryable connection error',
        'DB_CONN_001',
        DatabaseErrorType.CONNECTION,
        { recoverability: DatabaseErrorRecoverability.TRANSIENT }
      );
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce('Success after retry');

      // Execute the operation with retry
      const result = await retry.executeWithRetry(RetryOperationType.CONNECT, mockOperation);

      // Verify the operation was called twice (initial + 1 retry)
      expect(mockOperation).toHaveBeenCalledTimes(2);
      
      // Verify the sleep function was called once
      expect(utils.sleep).toHaveBeenCalledTimes(1);

      // Verify the result indicates success after retry
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(result.result).toBe('Success after retry');
    });
  });

  describe('Configuration and Utilities', () => {
    it('should allow updating retry configuration', () => {
      // Create a connection retry
      const retry = new ConnectionRetry(defaultConnectionConfig);

      // Get the initial configuration
      const initialConfig = retry.getRetryConfig();
      expect(initialConfig.maxRetries).toBe(3);

      // Update the configuration
      retry.updateRetryConfig({
        maxRetries: 5,
        initialDelayMs: 200,
        useJitter: false,
      });

      // Verify the configuration was updated
      const updatedConfig = retry.getRetryConfig();
      expect(updatedConfig.maxRetries).toBe(5);
      expect(updatedConfig.initialDelayMs).toBe(200);
      expect(updatedConfig.useJitter).toBe(false);
      
      // Verify that unspecified values remain unchanged
      expect(updatedConfig.maxDelayMs).toBe(initialConfig.maxDelayMs);
      expect(updatedConfig.backoffFactor).toBe(initialConfig.backoffFactor);
    });

    it('should reset circuit breakers', () => {
      // Create a connection retry
      const retry = new ConnectionRetry(defaultConnectionConfig);

      // Get the initial circuit breaker state
      const initialState = retry.getCircuitBreakerState(RetryOperationType.CONNECT);
      expect(initialState.isOpen).toBe(false);
      expect(initialState.failureCount).toBe(0);

      // Manually modify the circuit breaker state
      initialState.isOpen = true;
      initialState.failureCount = 5;
      initialState.openedAt = new Date();
      initialState.resetAt = new Date(Date.now() + 30000);

      // Reset the circuit breaker
      retry.resetCircuitBreaker(RetryOperationType.CONNECT);

      // Verify the circuit breaker was reset
      const resetState = retry.getCircuitBreakerState(RetryOperationType.CONNECT);
      expect(resetState.isOpen).toBe(false);
      expect(resetState.failureCount).toBe(0);
      expect(resetState.openedAt).toBeUndefined();
      expect(resetState.resetAt).toBeUndefined();
    });

    it('should reset all circuit breakers', () => {
      // Create a connection retry
      const retry = new ConnectionRetry(defaultConnectionConfig);

      // Get the initial circuit breaker states
      const initialConnectState = retry.getCircuitBreakerState(RetryOperationType.CONNECT);
      const initialQueryState = retry.getCircuitBreakerState(RetryOperationType.QUERY);

      // Manually modify the circuit breaker states
      initialConnectState.isOpen = true;
      initialConnectState.failureCount = 5;
      initialQueryState.isOpen = true;
      initialQueryState.failureCount = 3;

      // Reset all circuit breakers
      retry.resetAllCircuitBreakers();

      // Verify all circuit breakers were reset
      const allStates = retry.getAllCircuitBreakerStates();
      Object.values(allStates).forEach(state => {
        expect(state.isOpen).toBe(false);
        expect(state.failureCount).toBe(0);
      });
    });
  });
});