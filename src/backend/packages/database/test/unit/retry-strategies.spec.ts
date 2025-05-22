/**
 * @file retry-strategies.spec.ts
 * @description Unit tests for database retry strategies that provide resilience against transient errors.
 */

import { Test } from '@nestjs/testing';
import {
  RetryStrategy,
  RetryContext,
  DatabaseOperationType,
  JourneyContext,
  ExponentialBackoffStrategy,
  CircuitBreakerStrategy,
  CompositeRetryStrategy,
  RetryStrategyFactory,
  CircuitState,
} from '../../src/errors/retry-strategies';

describe('Database Retry Strategies', () => {
  // Mock error classes for testing
  class MockTransientError extends Error {
    constructor(message = 'Connection timeout') {
      super(message);
      this.name = 'MockTransientError';
    }
  }

  class MockPermanentError extends Error {
    constructor(message = 'Invalid query syntax') {
      super(message);
      this.name = 'MockPermanentError';
    }
  }

  class MockPrismaClientKnownRequestError extends Error {
    code: string;
    constructor(code = 'P1001', message = 'Prisma connection error') {
      super(message);
      this.name = 'PrismaClientKnownRequestError';
      this.code = code;
    }
  }

  // Helper function to create a retry context
  const createContext = (options: Partial<RetryContext> = {}): RetryContext => ({
    operationType: DatabaseOperationType.READ,
    journeyContext: JourneyContext.HEALTH,
    attemptsMade: 0,
    error: new MockTransientError(),
    firstAttemptTime: new Date(),
    metadata: {},
    ...options,
  });

  describe('ExponentialBackoffStrategy', () => {
    let strategy: ExponentialBackoffStrategy;

    beforeEach(() => {
      // Create strategy with default config
      strategy = new ExponentialBackoffStrategy();
    });

    it('should have the correct name', () => {
      expect(strategy.getName()).toBe('ExponentialBackoffStrategy');
    });

    it('should retry transient errors', () => {
      const context = createContext({
        error: new MockTransientError('connection timeout'),
        attemptsMade: 0,
      });

      expect(strategy.shouldRetry(context)).toBe(true);
    });

    it('should not retry permanent errors', () => {
      const context = createContext({
        error: new MockPermanentError(),
        attemptsMade: 0,
      });

      expect(strategy.shouldRetry(context)).toBe(false);
    });

    it('should retry Prisma connection errors', () => {
      const context = createContext({
        error: new MockPrismaClientKnownRequestError('P1001'),
        attemptsMade: 0,
      });

      expect(strategy.shouldRetry(context)).toBe(true);
    });

    it('should not retry after max attempts', () => {
      const context = createContext({
        error: new MockTransientError(),
        attemptsMade: 3, // Default max attempts is 3
      });

      expect(strategy.shouldRetry(context)).toBe(false);
    });

    it('should calculate exponential backoff correctly', () => {
      // Test with no jitter for deterministic results
      strategy = new ExponentialBackoffStrategy({
        baseDelayMs: 100,
        maxDelayMs: 10000,
        maxAttempts: 5,
        jitterFactor: 0, // No jitter
      });

      // First attempt: 100ms * 2^0 = 100ms
      expect(strategy.getNextRetryDelay(createContext({ attemptsMade: 0 }))).toBe(100);

      // Second attempt: 100ms * 2^1 = 200ms
      expect(strategy.getNextRetryDelay(createContext({ attemptsMade: 1 }))).toBe(200);

      // Third attempt: 100ms * 2^2 = 400ms
      expect(strategy.getNextRetryDelay(createContext({ attemptsMade: 2 }))).toBe(400);

      // Fourth attempt: 100ms * 2^3 = 800ms
      expect(strategy.getNextRetryDelay(createContext({ attemptsMade: 3 }))).toBe(800);

      // Fifth attempt: 100ms * 2^4 = 1600ms
      expect(strategy.getNextRetryDelay(createContext({ attemptsMade: 4 }))).toBe(1600);
    });

    it('should respect max delay', () => {
      strategy = new ExponentialBackoffStrategy({
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        maxAttempts: 10,
        jitterFactor: 0, // No jitter
      });

      // 1000ms * 2^3 = 8000ms, but should be capped at 5000ms
      expect(strategy.getNextRetryDelay(createContext({ attemptsMade: 3 }))).toBe(5000);
    });

    it('should apply jitter to the delay', () => {
      // Use a fixed jitter factor for testing
      strategy = new ExponentialBackoffStrategy({
        baseDelayMs: 100,
        maxDelayMs: 10000,
        maxAttempts: 5,
        jitterFactor: 0.5, // 50% jitter
      });

      // Mock Math.random to return a fixed value for testing
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.5); // Middle of the range

      try {
        // Base delay: 100ms * 2^0 = 100ms
        // Jitter range: 100ms * 0.5 = 50ms
        // Jitter: 0.5 * 50ms - 25ms = 0ms (middle of -25ms to +25ms)
        // Expected: 100ms + 0ms = 100ms
        expect(strategy.getNextRetryDelay(createContext({ attemptsMade: 0 }))).toBe(100);

        // Change random to return max jitter
        Math.random = jest.fn().mockReturnValue(1.0);
        // Base delay: 100ms * 2^0 = 100ms
        // Jitter range: 100ms * 0.5 = 50ms
        // Jitter: 1.0 * 50ms - 25ms = 25ms (max of -25ms to +25ms)
        // Expected: 100ms + 25ms = 125ms
        expect(strategy.getNextRetryDelay(createContext({ attemptsMade: 0 }))).toBe(125);

        // Change random to return min jitter
        Math.random = jest.fn().mockReturnValue(0.0);
        // Base delay: 100ms * 2^0 = 100ms
        // Jitter range: 100ms * 0.5 = 50ms
        // Jitter: 0.0 * 50ms - 25ms = -25ms (min of -25ms to +25ms)
        // Expected: 100ms - 25ms = 75ms
        expect(strategy.getNextRetryDelay(createContext({ attemptsMade: 0 }))).toBe(75);
      } finally {
        // Restore original Math.random
        Math.random = originalRandom;
      }
    });

    it('should apply operation-specific overrides', () => {
      strategy = new ExponentialBackoffStrategy({
        baseDelayMs: 100,
        maxDelayMs: 10000,
        maxAttempts: 3,
        jitterFactor: 0,
        operationTypeOverrides: {
          [DatabaseOperationType.WRITE]: {
            baseDelayMs: 200,
            maxAttempts: 5,
          },
        },
      });

      // For READ operations, use default config
      const readContext = createContext({
        operationType: DatabaseOperationType.READ,
        attemptsMade: 3, // Default max attempts is 3
      });
      expect(strategy.shouldRetry(readContext)).toBe(false); // Max attempts reached

      // For WRITE operations, use overridden config
      const writeContext = createContext({
        operationType: DatabaseOperationType.WRITE,
        attemptsMade: 3, // Overridden max attempts is 5
      });
      expect(strategy.shouldRetry(writeContext)).toBe(true); // Still under max attempts

      // Check base delay override
      expect(strategy.getNextRetryDelay(writeContext)).toBe(1600); // 200ms * 2^3 = 1600ms
    });

    it('should apply journey-specific overrides', () => {
      strategy = new ExponentialBackoffStrategy({
        baseDelayMs: 100,
        maxDelayMs: 10000,
        maxAttempts: 3,
        jitterFactor: 0,
        journeyContextOverrides: {
          [JourneyContext.HEALTH]: {
            maxAttempts: 2,
          },
          [JourneyContext.GAMIFICATION]: {
            baseDelayMs: 50,
            maxAttempts: 5,
          },
        },
      });

      // For HEALTH journey, max attempts is 2
      const healthContext = createContext({
        journeyContext: JourneyContext.HEALTH,
        attemptsMade: 2,
      });
      expect(strategy.shouldRetry(healthContext)).toBe(false); // Max attempts reached

      // For GAMIFICATION journey, max attempts is 5
      const gamificationContext = createContext({
        journeyContext: JourneyContext.GAMIFICATION,
        attemptsMade: 2,
      });
      expect(strategy.shouldRetry(gamificationContext)).toBe(true); // Still under max attempts

      // Check base delay override
      expect(strategy.getNextRetryDelay(gamificationContext)).toBe(200); // 50ms * 2^2 = 200ms
    });
  });

  describe('CircuitBreakerStrategy', () => {
    let strategy: CircuitBreakerStrategy;
    let clock: jest.SpyInstance;

    beforeEach(() => {
      // Create strategy with default config
      strategy = new CircuitBreakerStrategy({
        failureThreshold: 3,
        failureWindowMs: 10000,
        resetTimeoutMs: 5000,
        successThreshold: 2,
      });

      // Mock Date.now for deterministic testing
      clock = jest.spyOn(Date, 'now').mockReturnValue(0);
    });

    afterEach(() => {
      clock.mockRestore();
    });

    it('should have the correct name', () => {
      expect(strategy.getName()).toBe('CircuitBreakerStrategy');
    });

    it('should start in closed state and allow operations', () => {
      const context = createContext();
      expect(strategy.shouldRetry(context)).toBe(true);
    });

    it('should open circuit after threshold failures', () => {
      const context = createContext();

      // Record failures up to threshold
      for (let i = 0; i < 3; i++) {
        strategy.recordFailure(context);
      }

      // Circuit should be open now
      expect(strategy.shouldRetry(context)).toBe(false);
    });

    it('should transition to half-open after reset timeout', () => {
      const context = createContext();

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        strategy.recordFailure(context);
      }

      // Circuit is open, should not retry
      expect(strategy.shouldRetry(context)).toBe(false);

      // Advance time past reset timeout
      clock.mockReturnValue(6000); // 6 seconds later

      // Circuit should be half-open now and allow a retry
      expect(strategy.shouldRetry(context)).toBe(true);
    });

    it('should close circuit after success threshold in half-open state', () => {
      const context = createContext();

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        strategy.recordFailure(context);
      }

      // Advance time past reset timeout to half-open
      clock.mockReturnValue(6000);

      // First retry in half-open state
      expect(strategy.shouldRetry(context)).toBe(true);

      // Record success
      strategy.recordSuccess(context);

      // Should allow another retry for success threshold
      expect(strategy.shouldRetry(context)).toBe(true);

      // Record second success
      strategy.recordSuccess(context);

      // Circuit should be closed now
      // Test by recording a failure and checking it doesn't immediately open
      strategy.recordFailure(context);
      expect(strategy.shouldRetry(context)).toBe(true); // Still closed after 1 failure
    });

    it('should reopen circuit on failure in half-open state', () => {
      const context = createContext();

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        strategy.recordFailure(context);
      }

      // Advance time past reset timeout to half-open
      clock.mockReturnValue(6000);

      // First retry in half-open state
      expect(strategy.shouldRetry(context)).toBe(true);

      // Record failure in half-open state
      strategy.recordFailure(context);

      // Circuit should be open again
      expect(strategy.shouldRetry(context)).toBe(false);
    });

    it('should maintain separate circuit states for different operations', () => {
      const readContext = createContext({
        operationType: DatabaseOperationType.READ,
      });

      const writeContext = createContext({
        operationType: DatabaseOperationType.WRITE,
      });

      // Open circuit for READ operations
      for (let i = 0; i < 3; i++) {
        strategy.recordFailure(readContext);
      }

      // READ circuit should be open
      expect(strategy.shouldRetry(readContext)).toBe(false);

      // WRITE circuit should still be closed
      expect(strategy.shouldRetry(writeContext)).toBe(true);
    });

    it('should maintain separate circuit states for different journeys', () => {
      const healthContext = createContext({
        journeyContext: JourneyContext.HEALTH,
      });

      const careContext = createContext({
        journeyContext: JourneyContext.CARE,
      });

      // Open circuit for HEALTH journey
      for (let i = 0; i < 3; i++) {
        strategy.recordFailure(healthContext);
      }

      // HEALTH circuit should be open
      expect(strategy.shouldRetry(healthContext)).toBe(false);

      // CARE circuit should still be closed
      expect(strategy.shouldRetry(careContext)).toBe(true);
    });

    it('should apply operation-specific overrides', () => {
      strategy = new CircuitBreakerStrategy({
        failureThreshold: 3,
        failureWindowMs: 10000,
        resetTimeoutMs: 5000,
        successThreshold: 2,
        operationTypeOverrides: {
          [DatabaseOperationType.WRITE]: {
            failureThreshold: 5, // Higher threshold for writes
          },
        },
      });

      const readContext = createContext({
        operationType: DatabaseOperationType.READ,
      });

      const writeContext = createContext({
        operationType: DatabaseOperationType.WRITE,
      });

      // Open circuit for READ operations (threshold: 3)
      for (let i = 0; i < 3; i++) {
        strategy.recordFailure(readContext);
      }
      expect(strategy.shouldRetry(readContext)).toBe(false); // READ circuit open

      // WRITE circuit should still be closed after 3 failures (threshold: 5)
      for (let i = 0; i < 3; i++) {
        strategy.recordFailure(writeContext);
      }
      expect(strategy.shouldRetry(writeContext)).toBe(true); // WRITE circuit still closed

      // Add 2 more failures to reach WRITE threshold
      for (let i = 0; i < 2; i++) {
        strategy.recordFailure(writeContext);
      }
      expect(strategy.shouldRetry(writeContext)).toBe(false); // WRITE circuit now open
    });

    it('should apply journey-specific overrides', () => {
      strategy = new CircuitBreakerStrategy({
        failureThreshold: 3,
        failureWindowMs: 10000,
        resetTimeoutMs: 5000,
        successThreshold: 2,
        journeyContextOverrides: {
          [JourneyContext.GAMIFICATION]: {
            failureThreshold: 5, // Higher threshold for gamification
            resetTimeoutMs: 2000, // Faster reset for gamification
          },
        },
      });

      const healthContext = createContext({
        journeyContext: JourneyContext.HEALTH,
      });

      const gamificationContext = createContext({
        journeyContext: JourneyContext.GAMIFICATION,
      });

      // Open circuit for HEALTH journey (threshold: 3)
      for (let i = 0; i < 3; i++) {
        strategy.recordFailure(healthContext);
      }
      expect(strategy.shouldRetry(healthContext)).toBe(false); // HEALTH circuit open

      // GAMIFICATION circuit should still be closed after 3 failures (threshold: 5)
      for (let i = 0; i < 3; i++) {
        strategy.recordFailure(gamificationContext);
      }
      expect(strategy.shouldRetry(gamificationContext)).toBe(true); // GAMIFICATION circuit still closed

      // Add 2 more failures to reach GAMIFICATION threshold
      for (let i = 0; i < 2; i++) {
        strategy.recordFailure(gamificationContext);
      }
      expect(strategy.shouldRetry(gamificationContext)).toBe(false); // GAMIFICATION circuit now open

      // Test faster reset timeout for GAMIFICATION
      clock.mockReturnValue(3000); // 3 seconds later

      // HEALTH circuit should still be open (reset: 5000ms)
      expect(strategy.shouldRetry(healthContext)).toBe(false);

      // GAMIFICATION circuit should be half-open (reset: 2000ms)
      expect(strategy.shouldRetry(gamificationContext)).toBe(true);
    });
  });

  describe('CompositeRetryStrategy', () => {
    let exponentialStrategy: ExponentialBackoffStrategy;
    let circuitBreakerStrategy: CircuitBreakerStrategy;
    let compositeStrategy: CompositeRetryStrategy;

    beforeEach(() => {
      exponentialStrategy = new ExponentialBackoffStrategy({
        baseDelayMs: 100,
        maxDelayMs: 1000,
        maxAttempts: 3,
        jitterFactor: 0,
      });

      circuitBreakerStrategy = new CircuitBreakerStrategy({
        failureThreshold: 3,
        failureWindowMs: 10000,
        resetTimeoutMs: 5000,
        successThreshold: 2,
      });

      // Mock shouldRetry and getNextRetryDelay for deterministic testing
      jest.spyOn(exponentialStrategy, 'shouldRetry');
      jest.spyOn(exponentialStrategy, 'getNextRetryDelay');
      jest.spyOn(circuitBreakerStrategy, 'shouldRetry');
      jest.spyOn(circuitBreakerStrategy, 'getNextRetryDelay');
    });

    it('should have the correct name', () => {
      compositeStrategy = new CompositeRetryStrategy([exponentialStrategy, circuitBreakerStrategy]);
      expect(compositeStrategy.getName()).toBe('CompositeRetryStrategy(ExponentialBackoffStrategy, CircuitBreakerStrategy)');
    });

    it('should use OR logic by default (any strategy can trigger retry)', () => {
      compositeStrategy = new CompositeRetryStrategy([exponentialStrategy, circuitBreakerStrategy]);
      const context = createContext();

      // When both strategies allow retry
      jest.spyOn(exponentialStrategy, 'shouldRetry').mockReturnValue(true);
      jest.spyOn(circuitBreakerStrategy, 'shouldRetry').mockReturnValue(true);
      expect(compositeStrategy.shouldRetry(context)).toBe(true);

      // When only exponential strategy allows retry
      jest.spyOn(exponentialStrategy, 'shouldRetry').mockReturnValue(true);
      jest.spyOn(circuitBreakerStrategy, 'shouldRetry').mockReturnValue(false);
      expect(compositeStrategy.shouldRetry(context)).toBe(true);

      // When only circuit breaker strategy allows retry
      jest.spyOn(exponentialStrategy, 'shouldRetry').mockReturnValue(false);
      jest.spyOn(circuitBreakerStrategy, 'shouldRetry').mockReturnValue(true);
      expect(compositeStrategy.shouldRetry(context)).toBe(true);

      // When neither strategy allows retry
      jest.spyOn(exponentialStrategy, 'shouldRetry').mockReturnValue(false);
      jest.spyOn(circuitBreakerStrategy, 'shouldRetry').mockReturnValue(false);
      expect(compositeStrategy.shouldRetry(context)).toBe(false);
    });

    it('should use AND logic when requireAllStrategies is true', () => {
      compositeStrategy = new CompositeRetryStrategy([exponentialStrategy, circuitBreakerStrategy], true);
      const context = createContext();

      // When both strategies allow retry
      jest.spyOn(exponentialStrategy, 'shouldRetry').mockReturnValue(true);
      jest.spyOn(circuitBreakerStrategy, 'shouldRetry').mockReturnValue(true);
      expect(compositeStrategy.shouldRetry(context)).toBe(true);

      // When only exponential strategy allows retry
      jest.spyOn(exponentialStrategy, 'shouldRetry').mockReturnValue(true);
      jest.spyOn(circuitBreakerStrategy, 'shouldRetry').mockReturnValue(false);
      expect(compositeStrategy.shouldRetry(context)).toBe(false);

      // When only circuit breaker strategy allows retry
      jest.spyOn(exponentialStrategy, 'shouldRetry').mockReturnValue(false);
      jest.spyOn(circuitBreakerStrategy, 'shouldRetry').mockReturnValue(true);
      expect(compositeStrategy.shouldRetry(context)).toBe(false);

      // When neither strategy allows retry
      jest.spyOn(exponentialStrategy, 'shouldRetry').mockReturnValue(false);
      jest.spyOn(circuitBreakerStrategy, 'shouldRetry').mockReturnValue(false);
      expect(compositeStrategy.shouldRetry(context)).toBe(false);
    });

    it('should use the maximum delay from all strategies', () => {
      compositeStrategy = new CompositeRetryStrategy([exponentialStrategy, circuitBreakerStrategy]);
      const context = createContext();

      // Set different delays for each strategy
      jest.spyOn(exponentialStrategy, 'getNextRetryDelay').mockReturnValue(500);
      jest.spyOn(circuitBreakerStrategy, 'getNextRetryDelay').mockReturnValue(1000);

      // Should use the maximum delay (1000ms)
      expect(compositeStrategy.getNextRetryDelay(context)).toBe(1000);

      // Reverse the delays
      jest.spyOn(exponentialStrategy, 'getNextRetryDelay').mockReturnValue(1500);
      jest.spyOn(circuitBreakerStrategy, 'getNextRetryDelay').mockReturnValue(800);

      // Should use the maximum delay (1500ms)
      expect(compositeStrategy.getNextRetryDelay(context)).toBe(1500);
    });

    it('should handle empty strategy list', () => {
      compositeStrategy = new CompositeRetryStrategy([]);
      const context = createContext();

      // Should not retry with empty strategy list
      expect(compositeStrategy.shouldRetry(context)).toBe(false);

      // Should use default delay with empty strategy list
      expect(compositeStrategy.getNextRetryDelay(context)).toBe(1000);
    });
  });

  describe('RetryStrategyFactory', () => {
    let factory: RetryStrategyFactory;

    beforeEach(() => {
      factory = new RetryStrategyFactory();
    });

    it('should create appropriate strategy based on operation type', () => {
      // Test READ operation
      const readContext = createContext({
        operationType: DatabaseOperationType.READ,
      });
      const readStrategy = factory.createStrategy(readContext);
      expect(readStrategy).toBeInstanceOf(ExponentialBackoffStrategy);
      expect(readStrategy.getName()).toBe('ExponentialBackoffStrategy');

      // Test CONNECTION operation
      const connectionContext = createContext({
        operationType: DatabaseOperationType.CONNECTION,
      });
      const connectionStrategy = factory.createStrategy(connectionContext);
      expect(connectionStrategy).toBeInstanceOf(CompositeRetryStrategy);
      expect(connectionStrategy.getName()).toContain('CompositeRetryStrategy');
      expect(connectionStrategy.getName()).toContain('ExponentialBackoffStrategy');
      expect(connectionStrategy.getName()).toContain('CircuitBreakerStrategy');
    });

    it('should apply journey-specific strategy overrides', () => {
      // Test HEALTH journey READ operation
      const healthReadContext = createContext({
        operationType: DatabaseOperationType.READ,
        journeyContext: JourneyContext.HEALTH,
      });
      const healthReadStrategy = factory.createStrategy(healthReadContext);
      expect(healthReadStrategy).toBeInstanceOf(ExponentialBackoffStrategy);

      // Test CARE journey WRITE operation
      const careWriteContext = createContext({
        operationType: DatabaseOperationType.WRITE,
        journeyContext: JourneyContext.CARE,
      });
      const careWriteStrategy = factory.createStrategy(careWriteContext);
      expect(careWriteStrategy).toBeInstanceOf(ExponentialBackoffStrategy);

      // Test GAMIFICATION journey TRANSACTION operation
      const gamificationTxContext = createContext({
        operationType: DatabaseOperationType.TRANSACTION,
        journeyContext: JourneyContext.GAMIFICATION,
      });
      const gamificationTxStrategy = factory.createStrategy(gamificationTxContext);
      expect(gamificationTxStrategy).toBeInstanceOf(CompositeRetryStrategy);
    });

    it('should record success for circuit breaker strategies', () => {
      // Create a spy on CircuitBreakerStrategy.recordSuccess
      const recordSuccessSpy = jest.spyOn(CircuitBreakerStrategy.prototype, 'recordSuccess');

      // Test with CONNECTION operation that uses a composite strategy with circuit breaker
      const connectionContext = createContext({
        operationType: DatabaseOperationType.CONNECTION,
      });

      // Record success
      factory.recordSuccess(connectionContext);

      // Should call recordSuccess on the circuit breaker strategy
      expect(recordSuccessSpy).toHaveBeenCalledWith(connectionContext);

      // Clean up
      recordSuccessSpy.mockRestore();
    });

    it('should record failure for circuit breaker strategies', () => {
      // Create a spy on CircuitBreakerStrategy.recordFailure
      const recordFailureSpy = jest.spyOn(CircuitBreakerStrategy.prototype, 'recordFailure');

      // Test with CONNECTION operation that uses a composite strategy with circuit breaker
      const connectionContext = createContext({
        operationType: DatabaseOperationType.CONNECTION,
      });

      // Record failure
      factory.recordFailure(connectionContext);

      // Should call recordFailure on the circuit breaker strategy
      expect(recordFailureSpy).toHaveBeenCalledWith(connectionContext);

      // Clean up
      recordFailureSpy.mockRestore();
    });
  });
});