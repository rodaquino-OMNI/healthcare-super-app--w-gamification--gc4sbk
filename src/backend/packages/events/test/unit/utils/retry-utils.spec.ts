/**
 * @file retry-utils.spec.ts
 * @description Unit tests for retry utilities in the event processing system.
 * Tests exponential backoff, retry policies, circuit breakers, and DLQ integration.
 */

import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import * as opentelemetry from '@opentelemetry/api';

// Import the utilities to test
import {
  calculateBackoffDelay,
  isRetryableError,
  createRetryPolicy,
  withRetry,
  processEventWithRetry,
  CircuitBreaker,
  RetryPolicyOptions,
  DEFAULT_RETRY_POLICY,
  JOURNEY_RETRY_POLICIES,
  RetryState,
  createRetryState,
  getCircuitBreaker,
} from '../../../src/utils/retry-utils';

// Import related interfaces and types
import { EventErrorType } from '../../../src/errors/event-errors';
import { addEventToDeadLetterQueue } from '../../../src/errors/dlq';
import { EventResponse, EventResponseStatus, createFailureResponse } from '../../../src/interfaces/event-response.interface';
import { IBaseEvent } from '../../../src/interfaces/base-event.interface';
import { IJourneyEvent, JourneyType } from '../../../src/interfaces/journey-events.interface';

// Mock dependencies
jest.mock('../../../src/errors/dlq', () => ({
  addEventToDeadLetterQueue: jest.fn().mockResolvedValue(true),
}));

// Mock OpenTelemetry
const mockSpan = {
  setAttribute: jest.fn(),
  addEvent: jest.fn(),
  recordException: jest.fn(),
  end: jest.fn(),
};

const mockTracer = {
  startActiveSpan: jest.fn((name, callback) => {
    return callback(mockSpan);
  }),
  startSpan: jest.fn(() => mockSpan),
};

jest.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: jest.fn(() => mockTracer),
    SpanStatusCode: {
      ERROR: 'ERROR',
      OK: 'OK',
    },
  },
}));

// Sample event for testing
const sampleEvent: IBaseEvent = {
  eventId: 'test-event-123',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  source: 'test-service',
  type: 'test.event',
  payload: { data: 'test-data' },
};

// Sample journey event for testing
const sampleJourneyEvent: IJourneyEvent = {
  eventId: 'journey-event-123',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  source: 'health-service',
  type: 'health.metric.recorded',
  payload: { data: 'health-data' },
  journeyType: JourneyType.HEALTH,
  userId: 'user-123',
};

describe('Retry Utilities', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff correctly without jitter', () => {
      const options: RetryPolicyOptions = {
        ...DEFAULT_RETRY_POLICY,
        initialDelayMs: 100,
        backoffFactor: 2,
        useJitter: false,
      };

      // First attempt (0-based index)
      expect(calculateBackoffDelay(0, options)).toBe(100);
      // Second attempt
      expect(calculateBackoffDelay(1, options)).toBe(200);
      // Third attempt
      expect(calculateBackoffDelay(2, options)).toBe(400);
      // Fourth attempt
      expect(calculateBackoffDelay(3, options)).toBe(800);
    });

    it('should respect maximum delay cap', () => {
      const options: RetryPolicyOptions = {
        ...DEFAULT_RETRY_POLICY,
        initialDelayMs: 1000,
        backoffFactor: 3,
        maxDelayMs: 5000,
        useJitter: false,
      };

      // First attempt (0-based index)
      expect(calculateBackoffDelay(0, options)).toBe(1000);
      // Second attempt
      expect(calculateBackoffDelay(1, options)).toBe(3000);
      // Third attempt - would be 9000 but capped at 5000
      expect(calculateBackoffDelay(2, options)).toBe(5000);
    });

    it('should apply jitter when enabled', () => {
      const options: RetryPolicyOptions = {
        ...DEFAULT_RETRY_POLICY,
        initialDelayMs: 1000,
        backoffFactor: 2,
        useJitter: true,
      };

      // Mock Math.random to return a fixed value for predictable testing
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.5); // 50% jitter

      try {
        // With 50% jitter on a 1000ms delay, should be exactly 1000ms (no change at 50%)
        expect(calculateBackoffDelay(0, options)).toBe(1000);

        // Change random to return 0 (minimum jitter)
        (Math.random as jest.Mock).mockReturnValue(0);
        // With 0% jitter, should be 1000ms - 20% = 800ms
        expect(calculateBackoffDelay(0, options)).toBe(800);

        // Change random to return 1 (maximum jitter)
        (Math.random as jest.Mock).mockReturnValue(1);
        // With 100% jitter, should be 1000ms + 20% = 1200ms
        expect(calculateBackoffDelay(0, options)).toBe(1200);
      } finally {
        // Restore original Math.random
        Math.random = originalRandom;
      }
    });

    it('should never return a negative delay', () => {
      const options: RetryPolicyOptions = {
        ...DEFAULT_RETRY_POLICY,
        initialDelayMs: 10,
        backoffFactor: 2,
        useJitter: true,
      };

      // Mock Math.random to return a value that would cause negative delay
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0); // Maximum negative jitter

      try {
        // Even with maximum negative jitter, delay should be at least 0
        expect(calculateBackoffDelay(0, options)).toBeGreaterThanOrEqual(0);
      } finally {
        // Restore original Math.random
        Math.random = originalRandom;
      }
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const networkErrors = [
        new Error('ECONNREFUSED: Connection refused'),
        new Error('ETIMEDOUT: Connection timed out'),
        new Error('ECONNRESET: Connection reset by peer'),
        new Error('ENOTFOUND: DNS lookup failed'),
      ];

      networkErrors.forEach(error => {
        expect(isRetryableError(error, DEFAULT_RETRY_POLICY)).toBe(true);
      });
    });

    it('should identify transient errors as retryable', () => {
      const transientErrors = [
        new Error('Request timeout'),
        new Error('Service temporarily unavailable'),
        new Error('Too many requests, please try again later'),
        new Error('Rate limit exceeded'),
        new Error('System overloaded, try again later'),
      ];

      transientErrors.forEach(error => {
        expect(isRetryableError(error, DEFAULT_RETRY_POLICY)).toBe(true);
      });
    });

    it('should identify non-retryable errors based on error type', () => {
      const validationError = new Error('Invalid data format');
      (validationError as any).type = EventErrorType.VALIDATION_ERROR;

      const schemaError = new Error('Schema validation failed');
      (schemaError as any).type = EventErrorType.SCHEMA_ERROR;

      const authError = new Error('Unauthorized access');
      (authError as any).type = EventErrorType.AUTHORIZATION_ERROR;

      expect(isRetryableError(validationError, DEFAULT_RETRY_POLICY)).toBe(false);
      expect(isRetryableError(schemaError, DEFAULT_RETRY_POLICY)).toBe(false);
      expect(isRetryableError(authError, DEFAULT_RETRY_POLICY)).toBe(false);
    });

    it('should use custom isRetryableError function when provided', () => {
      const customOptions: RetryPolicyOptions = {
        ...DEFAULT_RETRY_POLICY,
        isRetryableError: (error: Error) => error.message.includes('CUSTOM_RETRY'),
      };

      const retryableError = new Error('CUSTOM_RETRY: This should be retried');
      const nonRetryableError = new Error('This should not be retried');

      expect(isRetryableError(retryableError, customOptions)).toBe(true);
      expect(isRetryableError(nonRetryableError, customOptions)).toBe(false);
    });
  });

  describe('createRetryPolicy', () => {
    it('should create a policy with default options when no journey or custom options provided', () => {
      const policy = createRetryPolicy();
      expect(policy).toEqual(DEFAULT_RETRY_POLICY);
    });

    it('should apply journey-specific options when journey is provided', () => {
      const healthPolicy = createRetryPolicy('health');
      expect(healthPolicy.maxRetries).toBe(JOURNEY_RETRY_POLICIES.health.maxRetries);
      expect(healthPolicy.initialDelayMs).toBe(JOURNEY_RETRY_POLICIES.health.initialDelayMs);
      expect(healthPolicy.maxDelayMs).toBe(JOURNEY_RETRY_POLICIES.health.maxDelayMs);

      const carePolicy = createRetryPolicy('care');
      expect(carePolicy.maxRetries).toBe(JOURNEY_RETRY_POLICIES.care.maxRetries);
      expect(carePolicy.initialDelayMs).toBe(JOURNEY_RETRY_POLICIES.care.initialDelayMs);
      expect(carePolicy.maxDelayMs).toBe(JOURNEY_RETRY_POLICIES.care.maxDelayMs);
    });

    it('should override journey-specific options with custom options', () => {
      const customOptions: Partial<RetryPolicyOptions> = {
        maxRetries: 10,
        initialDelayMs: 50,
      };

      const policy = createRetryPolicy('health', customOptions);
      expect(policy.maxRetries).toBe(customOptions.maxRetries);
      expect(policy.initialDelayMs).toBe(customOptions.initialDelayMs);
      // Should still have health journey's maxDelayMs
      expect(policy.maxDelayMs).toBe(JOURNEY_RETRY_POLICIES.health.maxDelayMs);
    });

    it('should handle unknown journey types gracefully', () => {
      const policy = createRetryPolicy('unknown-journey');
      // Should fall back to default options
      expect(policy).toEqual(DEFAULT_RETRY_POLICY);
    });
  });

  describe('withRetry', () => {
    it('should resolve immediately on successful execution', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('retry.attempts', 0);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('retry.success', true);
    });

    it('should retry on retryable errors and eventually succeed', async () => {
      // Fail twice, then succeed
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED: Connection refused'))
        .mockRejectedValueOnce(new Error('ETIMEDOUT: Connection timed out'))
        .mockResolvedValueOnce('success after retry');

      const options: RetryPolicyOptions = {
        ...DEFAULT_RETRY_POLICY,
        initialDelayMs: 10, // Small delay for faster tests
        backoffFactor: 1, // No exponential increase for predictable testing
      };

      const result = await withRetry(fn, options);

      expect(result).toBe('success after retry');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('retry.attempts', 2);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('retry.success', true);
    });

    it('should abort after maximum retries and throw the last error', async () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      const fn = jest.fn().mockRejectedValue(error);

      const options: RetryPolicyOptions = {
        ...DEFAULT_RETRY_POLICY,
        maxRetries: 3,
        initialDelayMs: 10, // Small delay for faster tests
        backoffFactor: 1, // No exponential increase for predictable testing
      };

      await expect(withRetry(fn, options)).rejects.toThrow(error);
      expect(fn).toHaveBeenCalledTimes(options.maxRetries + 1); // Initial attempt + retries
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('retry.exhausted', true);
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
    });

    it('should not retry non-retryable errors', async () => {
      const error = new Error('Validation failed');
      (error as any).type = EventErrorType.VALIDATION_ERROR;
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(fn)).rejects.toThrow(error);
      expect(fn).toHaveBeenCalledTimes(1); // No retries
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('retry.non_retryable', true);
    });

    it('should preserve retry state context between attempts', async () => {
      // Capture the state object passed to the function
      let capturedStates: RetryState[] = [];

      const fn = jest.fn((state: RetryState) => {
        // Store a copy of the state to verify later
        capturedStates.push({...state});
        
        // Add some context data
        state.context.testKey = 'testValue';
        state.context.counter = (state.context.counter || 0) + 1;
        
        // Fail on first two attempts
        if (state.attempt < 2) {
          return Promise.reject(new Error('ECONNREFUSED: Connection refused'));
        }
        
        // Succeed on third attempt
        return Promise.resolve('success');
      });

      const options: RetryPolicyOptions = {
        ...DEFAULT_RETRY_POLICY,
        initialDelayMs: 10,
        backoffFactor: 1,
      };

      const result = await withRetry(fn, options);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      
      // Verify state was preserved between attempts
      expect(capturedStates.length).toBe(3);
      expect(capturedStates[0].attempt).toBe(0);
      expect(capturedStates[1].attempt).toBe(1);
      expect(capturedStates[2].attempt).toBe(2);
      
      // Verify context was preserved and updated
      expect(capturedStates[1].context.testKey).toBe('testValue');
      expect(capturedStates[2].context.testKey).toBe('testValue');
      expect(capturedStates[2].context.counter).toBe(3); // Incremented on each attempt
    });

    it('should send failed events to DLQ after max retries when enabled', async () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      const fn = jest.fn().mockRejectedValue(error);

      const options: RetryPolicyOptions = {
        ...DEFAULT_RETRY_POLICY,
        maxRetries: 2,
        initialDelayMs: 10,
        backoffFactor: 1,
        useDLQ: true,
      };

      // Set up the retry state with an event
      const mockFn = jest.fn((state: RetryState) => {
        state.context.event = sampleEvent;
        return fn();
      });

      await expect(withRetry(mockFn, options)).rejects.toThrow(error);
      expect(mockFn).toHaveBeenCalledTimes(options.maxRetries + 1);
      
      // Verify event was sent to DLQ
      expect(addEventToDeadLetterQueue).toHaveBeenCalledWith(
        sampleEvent,
        error,
        expect.objectContaining({
          retryCount: options.maxRetries,
          errors: expect.arrayContaining([error.message]),
        })
      );
    });

    it('should not send to DLQ when useDLQ is disabled', async () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      const fn = jest.fn().mockRejectedValue(error);

      const options: RetryPolicyOptions = {
        ...DEFAULT_RETRY_POLICY,
        maxRetries: 2,
        initialDelayMs: 10,
        backoffFactor: 1,
        useDLQ: false,
      };

      // Set up the retry state with an event
      const mockFn = jest.fn((state: RetryState) => {
        state.context.event = sampleEvent;
        return fn();
      });

      await expect(withRetry(mockFn, options)).rejects.toThrow(error);
      expect(mockFn).toHaveBeenCalledTimes(options.maxRetries + 1);
      
      // Verify event was NOT sent to DLQ
      expect(addEventToDeadLetterQueue).not.toHaveBeenCalled();
    });
  });

  describe('processEventWithRetry', () => {
    it('should process events with journey-specific retry policies', async () => {
      const processor = jest.fn().mockResolvedValue({
        success: true,
        status: EventResponseStatus.SUCCESS,
        eventId: sampleJourneyEvent.eventId,
        eventType: sampleJourneyEvent.type,
        metadata: { timestamp: new Date().toISOString() },
      });

      const result = await processEventWithRetry(sampleJourneyEvent, processor);

      expect(result.success).toBe(true);
      expect(processor).toHaveBeenCalledWith(sampleJourneyEvent);
      // Should use health journey retry policy
      expect(mockTracer.startActiveSpan).toHaveBeenCalled();
    });

    it('should retry failed event processing with appropriate policy', async () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      const processor = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          success: true,
          status: EventResponseStatus.SUCCESS,
          eventId: sampleJourneyEvent.eventId,
          eventType: sampleJourneyEvent.type,
          metadata: { timestamp: new Date().toISOString() },
        });

      const customOptions: Partial<RetryPolicyOptions> = {
        maxRetries: 3,
        initialDelayMs: 10,
        backoffFactor: 1,
      };

      const result = await processEventWithRetry(sampleJourneyEvent, processor, customOptions);

      expect(result.success).toBe(true);
      expect(processor).toHaveBeenCalledTimes(2); // Initial failure + successful retry
    });

    it('should handle non-journey events with default retry policy', async () => {
      const processor = jest.fn().mockResolvedValue({
        success: true,
        status: EventResponseStatus.SUCCESS,
        eventId: sampleEvent.eventId,
        eventType: sampleEvent.type,
        metadata: { timestamp: new Date().toISOString() },
      });

      const result = await processEventWithRetry(sampleEvent, processor);

      expect(result.success).toBe(true);
      expect(processor).toHaveBeenCalledWith(sampleEvent);
    });

    it('should send failed events to DLQ after max retries', async () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      const processor = jest.fn().mockRejectedValue(error);

      const customOptions: Partial<RetryPolicyOptions> = {
        maxRetries: 2,
        initialDelayMs: 10,
        backoffFactor: 1,
        useDLQ: true,
      };

      await expect(processEventWithRetry(sampleEvent, processor, customOptions))
        .rejects.toThrow(error);

      expect(processor).toHaveBeenCalledTimes(customOptions.maxRetries + 1);
      expect(addEventToDeadLetterQueue).toHaveBeenCalledWith(
        sampleEvent,
        error,
        expect.any(Object)
      );
    });
  });

  describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker(3, 100, new Logger('TestCircuitBreaker'));
    });

    it('should start in closed state', () => {
      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.isAllowed()).toBe(true);
    });

    it('should open after threshold failures', () => {
      // Record failures up to threshold
      circuitBreaker.failure();
      circuitBreaker.failure();
      expect(circuitBreaker.getState()).toBe('CLOSED');
      
      // One more failure should open the circuit
      circuitBreaker.failure();
      expect(circuitBreaker.getState()).toBe('OPEN');
      expect(circuitBreaker.isAllowed()).toBe(false);
    });

    it('should transition to half-open state after reset timeout', async () => {
      // Open the circuit
      circuitBreaker.failure();
      circuitBreaker.failure();
      circuitBreaker.failure();
      expect(circuitBreaker.getState()).toBe('OPEN');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be in half-open state
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
      expect(circuitBreaker.isAllowed()).toBe(true);
    });

    it('should close after successful operation in half-open state', async () => {
      // Open the circuit
      circuitBreaker.failure();
      circuitBreaker.failure();
      circuitBreaker.failure();
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
      
      // Record a success
      circuitBreaker.success();
      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.isAllowed()).toBe(true);
    });

    it('should reset failure count after success in closed state', () => {
      // Record some failures, but not enough to open
      circuitBreaker.failure();
      circuitBreaker.failure();
      
      // Record a success
      circuitBreaker.success();
      
      // Should still be closed
      expect(circuitBreaker.getState()).toBe('CLOSED');
      
      // Record failures again - should need threshold failures to open
      circuitBreaker.failure();
      circuitBreaker.failure();
      expect(circuitBreaker.getState()).toBe('CLOSED');
      
      // One more failure should open
      circuitBreaker.failure();
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('should emit events on state transitions', () => {
      const openHandler = jest.fn();
      const halfOpenHandler = jest.fn();
      const closeHandler = jest.fn();
      
      circuitBreaker.on('open', openHandler);
      circuitBreaker.on('half-open', halfOpenHandler);
      circuitBreaker.on('close', closeHandler);
      
      // Open the circuit
      circuitBreaker.failure();
      circuitBreaker.failure();
      circuitBreaker.failure();
      expect(openHandler).toHaveBeenCalledTimes(1);
      
      // Reset to closed state
      circuitBreaker.reset();
      expect(closeHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCircuitBreaker', () => {
    it('should create and cache circuit breakers by journey', () => {
      const healthBreaker = getCircuitBreaker('health');
      const careBreaker = getCircuitBreaker('care');
      
      expect(healthBreaker).toBeInstanceOf(CircuitBreaker);
      expect(careBreaker).toBeInstanceOf(CircuitBreaker);
      expect(healthBreaker).not.toBe(careBreaker);
      
      // Getting the same journey again should return the same instance
      const healthBreaker2 = getCircuitBreaker('health');
      expect(healthBreaker2).toBe(healthBreaker);
    });

    it('should apply custom options when provided', () => {
      const customOptions = {
        circuitBreakerThreshold: 5,
        circuitBreakerResetTimeoutMs: 1000,
        logger: new Logger('CustomLogger'),
      };
      
      // We can't directly test the constructor parameters, but we can test behavior
      const breaker = getCircuitBreaker('test', customOptions);
      
      // Should be in closed state initially
      expect(breaker.getState()).toBe('CLOSED');
      
      // Should require threshold failures to open
      for (let i = 0; i < customOptions.circuitBreakerThreshold - 1; i++) {
        breaker.failure();
        expect(breaker.getState()).toBe('CLOSED');
      }
      
      // One more failure should open
      breaker.failure();
      expect(breaker.getState()).toBe('OPEN');
    });
  });

  describe('createRetryState', () => {
    it('should create a new retry state with default values', () => {
      const state = createRetryState();
      
      expect(state.attempt).toBe(0);
      expect(state.errors).toEqual([]);
      expect(state.circuitOpen).toBe(false);
      expect(state.context).toEqual({});
      expect(state.firstAttemptTime).toBeGreaterThan(0);
      expect(state.lastAttemptTime).toBeGreaterThan(0);
      expect(state.nextDelayMs).toBe(0);
    });
  });
});