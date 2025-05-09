/**
 * @file retry-strategies.spec.ts
 * @description Unit tests for database retry strategies that provide resilience against transient errors.
 * Tests verify exponential backoff, jitter implementation, circuit breaker functionality, and strategy selection logic.
 */

import { jest } from '@jest/globals';
import {
  RetryStrategy,
  ExponentialBackoffStrategy,
  CircuitBreakerStrategy,
  FixedIntervalStrategy,
  NoRetryStrategy,
  RetryStrategyFactory,
  OperationContext,
  RetryDecision,
  createRetryContext,
  executeWithRetry,
  CircuitState
} from '../../src/errors/retry-strategies';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import { ErrorType } from '@austa/errors';
import { IConnectionRetryConfig } from '../../src/types/connection.types';
import { TransactionRetryOptions } from '../../src/types/transaction.types';

// Mock the ErrorType from @austa/errors
jest.mock('@austa/errors', () => ({
  ErrorType: {
    TRANSIENT: 'transient',
    VALIDATION: 'validation',
    BUSINESS: 'business',
    TECHNICAL: 'technical',
    EXTERNAL: 'external',
    SECURITY: 'security',
    UNKNOWN: 'unknown'
  }
}));

describe('Database Retry Strategies', () => {
  // Helper function to create a test error with a specific type
  const createTestError = (type: DatabaseErrorType): Error => {
    const error = new Error('Test error');
    (error as any).type = type;
    return error;
  };

  // Helper function to create a test operation context
  const createTestContext = (options: Partial<OperationContext> = {}): OperationContext => {
    return {
      operationType: 'query',
      operationName: 'testOperation',
      attemptCount: 0,
      firstAttemptTimestamp: Date.now() - 1000,
      lastAttemptTimestamp: Date.now(),
      error: new Error('Test error'),
      ...options
    };
  };

  describe('ExponentialBackoffStrategy', () => {
    let strategy: ExponentialBackoffStrategy;

    beforeEach(() => {
      strategy = new ExponentialBackoffStrategy();
      // Mock Math.random to return a consistent value for jitter testing
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should correctly calculate exponential backoff delays', () => {
      const context1 = createTestContext({
        attemptCount: 0,
        error: createTestError(DatabaseErrorType.CONNECTION)
      });
      const context2 = createTestContext({
        attemptCount: 1,
        error: createTestError(DatabaseErrorType.CONNECTION)
      });
      const context3 = createTestContext({
        attemptCount: 2,
        error: createTestError(DatabaseErrorType.CONNECTION)
      });

      const decision1 = strategy.shouldRetry(context1);
      const decision2 = strategy.shouldRetry(context2);
      const decision3 = strategy.shouldRetry(context3);

      // Initial delay is 100ms
      // With jitter at 0.5, it should be exactly the base delay
      expect(decision1.shouldRetry).toBe(true);
      expect(decision1.delayMs).toBe(100);

      // Second attempt: 100ms * 2^1 = 200ms
      expect(decision2.shouldRetry).toBe(true);
      expect(decision2.delayMs).toBe(200);

      // Third attempt: 100ms * 2^2 = 400ms
      expect(decision3.shouldRetry).toBe(true);
      expect(decision3.delayMs).toBe(400);
    });

    it('should add jitter to delay times', () => {
      // Reset the Math.random mock to return different values
      (Math.random as jest.Mock).mockReturnValueOnce(0.75); // +25% jitter
      (Math.random as jest.Mock).mockReturnValueOnce(0.25); // -25% jitter

      const context1 = createTestContext({
        attemptCount: 0,
        error: createTestError(DatabaseErrorType.CONNECTION)
      });
      const context2 = createTestContext({
        attemptCount: 0,
        error: createTestError(DatabaseErrorType.CONNECTION)
      });

      const decision1 = strategy.shouldRetry(context1);
      const decision2 = strategy.shouldRetry(context2);

      // With 75% random, jitter should be +25% (100ms * 1.25 = 125ms)
      expect(decision1.delayMs).toBe(125);

      // With 25% random, jitter should be -25% (100ms * 0.75 = 75ms)
      expect(decision2.delayMs).toBe(75);
    });

    it('should respect maximum retry attempts', () => {
      const context = createTestContext({
        attemptCount: 3, // Default max retries is 3
        error: createTestError(DatabaseErrorType.CONNECTION)
      });

      const decision = strategy.shouldRetry(context);

      expect(decision.shouldRetry).toBe(false);
      expect(decision.reason).toContain('Maximum retry attempts');
    });

    it('should correctly identify retryable errors', () => {
      const retryableContext = createTestContext({
        error: createTestError(DatabaseErrorType.CONNECTION)
      });
      const nonRetryableContext = createTestContext({
        error: createTestError(DatabaseErrorType.INTEGRITY)
      });

      const retryableDecision = strategy.shouldRetry(retryableContext);
      const nonRetryableDecision = strategy.shouldRetry(nonRetryableContext);

      expect(retryableDecision.shouldRetry).toBe(true);
      expect(nonRetryableDecision.shouldRetry).toBe(false);
      expect(nonRetryableDecision.reason).toBe('Error is not retryable');
    });

    it('should use journey-specific configurations', () => {
      // Create a strategy with journey-specific config
      const journeyStrategy = new ExponentialBackoffStrategy({
        journeyConfigs: {
          'health': {
            maxRetries: 5,
            initialDelayMs: 200
          }
        }
      });

      const defaultContext = createTestContext({
        error: createTestError(DatabaseErrorType.CONNECTION)
      });
      const healthContext = createTestContext({
        journeyContext: 'health',
        error: createTestError(DatabaseErrorType.CONNECTION)
      });

      const defaultDecision = journeyStrategy.shouldRetry(defaultContext);
      const healthDecision = journeyStrategy.shouldRetry(healthContext);

      // Default config: initialDelayMs = 100
      expect(defaultDecision.delayMs).toBe(100);

      // Health journey config: initialDelayMs = 200
      expect(healthDecision.delayMs).toBe(200);
    });

    it('should respect maximum delay', () => {
      // Create a strategy with a low maxDelayMs
      const strategy = new ExponentialBackoffStrategy({
        maxDelayMs: 300
      });

      const context = createTestContext({
        attemptCount: 5, // This would normally result in a very large delay
        error: createTestError(DatabaseErrorType.CONNECTION)
      });

      const decision = strategy.shouldRetry(context);

      // Delay should be capped at maxDelayMs
      expect(decision.delayMs).toBe(300);
    });
  });

  describe('CircuitBreakerStrategy', () => {
    let strategy: CircuitBreakerStrategy;
    let clock: jest.SpyInstance;

    beforeEach(() => {
      strategy = new CircuitBreakerStrategy({
        failureThreshold: 3,
        resetTimeoutMs: 1000
      });
      // Mock Date.now for testing time-based behavior
      clock = jest.spyOn(Date, 'now');
      clock.mockReturnValue(1000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should start in CLOSED state', () => {
      expect(strategy.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition to OPEN state after failure threshold is reached', () => {
      // Record failures up to the threshold
      strategy.recordFailure();
      strategy.recordFailure();
      expect(strategy.getState()).toBe(CircuitState.CLOSED);

      // One more failure should open the circuit
      strategy.recordFailure();
      expect(strategy.getState()).toBe(CircuitState.OPEN);
    });

    it('should reject operations when circuit is OPEN', () => {
      // Open the circuit
      strategy.recordFailure();
      strategy.recordFailure();
      strategy.recordFailure();

      const context = createTestContext({
        error: createTestError(DatabaseErrorType.CONNECTION)
      });

      const decision = strategy.shouldRetry(context);

      expect(decision.shouldRetry).toBe(false);
      expect(decision.reason).toContain('Circuit is open');
    });

    it('should transition to HALF_OPEN state after reset timeout', () => {
      // Open the circuit
      strategy.recordFailure();
      strategy.recordFailure();
      strategy.recordFailure();
      expect(strategy.getState()).toBe(CircuitState.OPEN);

      // Advance time past the reset timeout
      clock.mockReturnValue(2500); // 1000 (initial) + 1500 (more than resetTimeout)

      // Circuit should now be half-open
      expect(strategy.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should allow test requests in HALF_OPEN state', () => {
      // Open the circuit
      strategy.recordFailure();
      strategy.recordFailure();
      strategy.recordFailure();

      // Advance time past the reset timeout
      clock.mockReturnValue(2500);

      const context = createTestContext({
        attemptCount: 0, // New request, not a retry
        error: createTestError(DatabaseErrorType.CONNECTION)
      });

      const decision = strategy.shouldRetry(context);

      expect(decision.shouldRetry).toBe(true);
      expect(decision.reason).toContain('Test request in half-open state');
      expect(decision.metadata.isTestRequest).toBe(true);
    });

    it('should transition back to OPEN if test request fails', () => {
      // Open the circuit
      strategy.recordFailure();
      strategy.recordFailure();
      strategy.recordFailure();

      // Advance time past the reset timeout
      clock.mockReturnValue(2500);
      expect(strategy.getState()).toBe(CircuitState.HALF_OPEN);

      // Simulate a failed test request
      const context = createTestContext({
        attemptCount: 1, // This is a retry of a failed request
        error: createTestError(DatabaseErrorType.CONNECTION)
      });

      strategy.shouldRetry(context);

      // Circuit should be open again
      expect(strategy.getState()).toBe(CircuitState.OPEN);
    });

    it('should transition to CLOSED after successful test requests', () => {
      // Open the circuit
      strategy.recordFailure();
      strategy.recordFailure();
      strategy.recordFailure();

      // Advance time past the reset timeout
      clock.mockReturnValue(2500);
      expect(strategy.getState()).toBe(CircuitState.HALF_OPEN);

      // Record successful test requests
      strategy.recordSuccess();
      expect(strategy.getState()).toBe(CircuitState.HALF_OPEN);

      // Default successThreshold is 2
      strategy.recordSuccess();
      expect(strategy.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reset failure count when circuit is closed', () => {
      // Record one failure
      strategy.recordFailure();

      // Record a success
      strategy.recordSuccess();

      // Open the circuit (should take 3 consecutive failures)
      strategy.recordFailure();
      strategy.recordFailure();
      expect(strategy.getState()).toBe(CircuitState.CLOSED);

      // One more failure should open the circuit
      strategy.recordFailure();
      expect(strategy.getState()).toBe(CircuitState.OPEN);
    });

    it('should implement exponential backoff for recovery attempts', () => {
      // Open the circuit
      strategy.recordFailure();
      strategy.recordFailure();
      strategy.recordFailure();

      // First recovery attempt
      clock.mockReturnValue(2500); // 1000 (initial) + 1500 (more than resetTimeout)
      expect(strategy.getState()).toBe(CircuitState.HALF_OPEN);

      // Fail the first recovery attempt
      const context1 = createTestContext({
        attemptCount: 1,
        error: createTestError(DatabaseErrorType.CONNECTION)
      });
      strategy.shouldRetry(context1);
      expect(strategy.getState()).toBe(CircuitState.OPEN);

      // Second recovery attempt should require 2x the timeout
      clock.mockReturnValue(4500); // 2500 + 2000 (2 * resetTimeout)
      expect(strategy.getState()).toBe(CircuitState.HALF_OPEN);

      // Fail the second recovery attempt
      const context2 = createTestContext({
        attemptCount: 1,
        error: createTestError(DatabaseErrorType.CONNECTION)
      });
      strategy.shouldRetry(context2);
      expect(strategy.getState()).toBe(CircuitState.OPEN);

      // Third recovery attempt should require 4x the timeout
      clock.mockReturnValue(8500); // 4500 + 4000 (4 * resetTimeout)
      expect(strategy.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should be manually resettable', () => {
      // Open the circuit
      strategy.recordFailure();
      strategy.recordFailure();
      strategy.recordFailure();
      expect(strategy.getState()).toBe(CircuitState.OPEN);

      // Reset the circuit
      strategy.reset();
      expect(strategy.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('RetryStrategyFactory', () => {
    let factory: RetryStrategyFactory;

    beforeEach(() => {
      factory = new RetryStrategyFactory();
    });

    it('should register and retrieve strategies by name', () => {
      const customStrategy = new FixedIntervalStrategy();
      factory.registerStrategy('custom', customStrategy);

      const retrievedStrategy = factory.getStrategy('custom');
      expect(retrievedStrategy).toBe(customStrategy);
    });

    it('should return default strategy when name not found', () => {
      const defaultStrategy = factory.getStrategy('default');
      const nonExistentStrategy = factory.getStrategy('nonexistent');

      expect(nonExistentStrategy).toBe(defaultStrategy);
    });

    it('should create strategy from connection config', () => {
      const connectionConfig: IConnectionRetryConfig = {
        maxRetries: 5,
        initialDelayMs: 200,
        maxDelayMs: 5000,
        backoffFactor: 2,
        useJitter: true,
        retryableErrors: [ErrorType.TRANSIENT, ErrorType.TECHNICAL]
      };

      const strategy = factory.createFromConnectionConfig(connectionConfig);
      const config = strategy.getConfig();

      expect(strategy).toBeInstanceOf(ExponentialBackoffStrategy);
      expect(config.maxRetries).toBe(5);
      expect(config.initialDelayMs).toBe(200);
      expect(config.maxDelayMs).toBe(5000);
    });

    it('should create strategy from transaction config', () => {
      const transactionConfig: TransactionRetryOptions = {
        maxRetries: 4,
        baseDelayMs: 150,
        maxDelayMs: 3000,
        useJitter: true,
        retryableErrors: [DatabaseErrorType.CONNECTION, DatabaseErrorType.TRANSACTION]
      };

      const strategy = factory.createFromTransactionConfig(transactionConfig);
      const config = strategy.getConfig();

      expect(strategy).toBeInstanceOf(ExponentialBackoffStrategy);
      expect(config.maxRetries).toBe(4);
      expect(config.initialDelayMs).toBe(150);
      expect(config.maxDelayMs).toBe(3000);
    });

    it('should select appropriate strategy based on operation context', () => {
      const connectionContext = createTestContext({ operationType: 'connection' });
      const transactionContext = createTestContext({ operationType: 'transaction' });
      const queryContext = createTestContext({ operationType: 'query' });
      const mutationContext = createTestContext({ operationType: 'mutation' });

      const connectionStrategy = factory.getStrategyForContext(connectionContext);
      const transactionStrategy = factory.getStrategyForContext(transactionContext);
      const queryStrategy = factory.getStrategyForContext(queryContext);
      const mutationStrategy = factory.getStrategyForContext(mutationContext);

      expect(connectionStrategy).toBeInstanceOf(CircuitBreakerStrategy);
      expect(transactionStrategy).toBeInstanceOf(ExponentialBackoffStrategy);
      expect(queryStrategy).toBeInstanceOf(FixedIntervalStrategy);
      expect(mutationStrategy).toBeInstanceOf(ExponentialBackoffStrategy);
    });

    it('should list all registered strategy names', () => {
      const names = factory.getStrategyNames();
      expect(names).toContain('default');
      expect(names).toContain('exponential');
      expect(names).toContain('circuitbreaker');
      expect(names).toContain('fixedinterval');
      expect(names).toContain('noretry');
    });
  });

  describe('Utility Functions', () => {
    describe('createRetryContext', () => {
      it('should create a valid retry context', () => {
        const error = new Error('Test error');
        const context = createRetryContext(
          error,
          'query',
          'findUser',
          'health',
          2,
          { userId: '123' }
        );

        expect(context.operationType).toBe('query');
        expect(context.operationName).toBe('findUser');
        expect(context.journeyContext).toBe('health');
        expect(context.attemptCount).toBe(2);
        expect(context.error).toBe(error);
        expect(context.metadata).toEqual({ userId: '123' });
        expect(context.firstAttemptTimestamp).toBeLessThan(context.lastAttemptTimestamp);
      });

      it('should use default values when not provided', () => {
        const error = new Error('Test error');
        const context = createRetryContext(error, 'query', 'findUser');

        expect(context.journeyContext).toBeUndefined();
        expect(context.attemptCount).toBe(0);
        expect(context.metadata).toBeUndefined();
      });
    });

    describe('executeWithRetry', () => {
      let strategy: RetryStrategy;
      let successFn: jest.Mock;
      let failingFn: jest.Mock;
      let eventualSuccessFn: jest.Mock;

      beforeEach(() => {
        strategy = new ExponentialBackoffStrategy({
          maxRetries: 3,
          initialDelayMs: 10 // Small delay for faster tests
        });
        successFn = jest.fn().mockResolvedValue('success');
        failingFn = jest.fn().mockRejectedValue(new Error('Always fails'));
        eventualSuccessFn = jest.fn()
          .mockRejectedValueOnce(createTestError(DatabaseErrorType.CONNECTION))
          .mockRejectedValueOnce(createTestError(DatabaseErrorType.CONNECTION))
          .mockResolvedValueOnce('eventual success');

        // Mock setTimeout to execute immediately
        jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
          (fn as Function)();
          return 0 as any;
        });
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should return result immediately for successful function', async () => {
        const result = await executeWithRetry(
          successFn,
          strategy,
          'query',
          'findUser'
        );

        expect(result).toBe('success');
        expect(successFn).toHaveBeenCalledTimes(1);
      });

      it('should retry until success', async () => {
        const result = await executeWithRetry(
          eventualSuccessFn,
          strategy,
          'query',
          'findUser'
        );

        expect(result).toBe('eventual success');
        expect(eventualSuccessFn).toHaveBeenCalledTimes(3);
      });

      it('should throw after max retries', async () => {
        await expect(executeWithRetry(
          failingFn,
          strategy,
          'query',
          'findUser'
        )).rejects.toThrow('Always fails');

        expect(failingFn).toHaveBeenCalledTimes(4); // Initial + 3 retries
      });

      it('should handle circuit breaker strategy', async () => {
        const circuitStrategy = new CircuitBreakerStrategy({
          failureThreshold: 2,
          resetTimeoutMs: 1000
        });

        // Mock getState to simulate an open circuit
        jest.spyOn(circuitStrategy, 'getState').mockReturnValue(CircuitState.OPEN);

        await expect(executeWithRetry(
          successFn,
          circuitStrategy,
          'query',
          'findUser'
        )).rejects.toThrow('Circuit breaker is open');

        expect(successFn).not.toHaveBeenCalled();
      });

      it('should record success with circuit breaker strategy', async () => {
        const circuitStrategy = new CircuitBreakerStrategy();
        const recordSuccessSpy = jest.spyOn(circuitStrategy, 'recordSuccess');

        await executeWithRetry(
          successFn,
          circuitStrategy,
          'query',
          'findUser'
        );

        expect(recordSuccessSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});