/**
 * Unit tests for retry utilities in the event processing system.
 * 
 * Tests the implementation of exponential backoff algorithms, retry policy configurations,
 * maximum retry limits, and timeout handling used across the event processing system.
 */

import { Logger } from '@nestjs/common';
import { Span } from '@austa/tracing';
import { KafkaProducer } from '../../../src/kafka/kafka.producer';
import {
  RetryStrategy,
  JourneyType,
  RetryPolicyConfig,
  RetryContext,
  RetryResult,
  DEFAULT_RETRY_POLICIES,
  createRetryContext,
  getRetryPolicy,
  calculateRetryDelay,
  isRetryableError,
  isCircuitBreakerOpen,
  recordCircuitBreakerFailure,
  recordCircuitBreakerSuccess,
  sendToDeadLetterQueue,
  executeWithRetry,
  retryEventProcessing,
  withRetry
} from '../../../src/utils/retry-utils';
import { BaseEvent } from '../../../src/interfaces/base-event.interface';

// Mock dependencies
jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn()
  }))
}));

jest.mock('@austa/tracing', () => ({
  Span: jest.fn().mockImplementation(() => ({
    end: jest.fn(),
    setStatus: jest.fn()
  }))
}));

jest.mock('../../../src/kafka/kafka.producer');

describe('Retry Utilities', () => {
  let mockLogger: jest.Mocked<Logger>;
  let mockKafkaProducer: jest.Mocked<KafkaProducer>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = new Logger() as jest.Mocked<Logger>;
    mockKafkaProducer = new KafkaProducer() as jest.Mocked<KafkaProducer>;
    mockKafkaProducer.produce = jest.fn().mockResolvedValue(undefined);
  });
  
  describe('createRetryContext', () => {
    it('should create a new retry context with default values', () => {
      const policy: RetryPolicyConfig = {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF
      };
      
      const context = createRetryContext(policy, JourneyType.HEALTH);
      
      expect(context).toMatchObject({
        attempt: 0,
        errors: [],
        policy,
        journeyType: JourneyType.HEALTH,
        circuitBreakerOpen: false
      });
      expect(context.firstAttemptTimestamp).toBeDefined();
      expect(context.lastAttemptTimestamp).toBeDefined();
      expect(context.traceContext).toEqual({});
    });
  });
  
  describe('getRetryPolicy', () => {
    it('should return the default policy for a journey type', () => {
      const policy = getRetryPolicy(JourneyType.HEALTH);
      
      expect(policy).toEqual(DEFAULT_RETRY_POLICIES[JourneyType.HEALTH]);
    });
    
    it('should merge custom policy with default policy', () => {
      const customPolicy: Partial<RetryPolicyConfig> = {
        maxRetries: 10,
        initialDelayMs: 200
      };
      
      const policy = getRetryPolicy(JourneyType.HEALTH, customPolicy);
      
      expect(policy.maxRetries).toBe(10);
      expect(policy.initialDelayMs).toBe(200);
      expect(policy.strategy).toBe(DEFAULT_RETRY_POLICIES[JourneyType.HEALTH].strategy);
    });
    
    it('should default to gamification policy if no journey type specified', () => {
      const policy = getRetryPolicy();
      
      expect(policy).toEqual(DEFAULT_RETRY_POLICIES[JourneyType.GAMIFICATION]);
    });
  });
  
  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff delay correctly', () => {
      const policy: RetryPolicyConfig = {
        maxRetries: 5,
        initialDelayMs: 100,
        maxDelayMs: 10000,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        backoffFactor: 2,
        jitterMs: 0 // Disable jitter for predictable tests
      };
      
      const context: RetryContext = {
        attempt: 0,
        firstAttemptTimestamp: Date.now(),
        lastAttemptTimestamp: Date.now(),
        errors: [],
        policy,
        traceContext: {}
      };
      
      // First retry (attempt 0)
      expect(calculateRetryDelay(context)).toBe(100);
      
      // Second retry (attempt 1)
      context.attempt = 1;
      expect(calculateRetryDelay(context)).toBe(200);
      
      // Third retry (attempt 2)
      context.attempt = 2;
      expect(calculateRetryDelay(context)).toBe(400);
      
      // Fourth retry (attempt 3)
      context.attempt = 3;
      expect(calculateRetryDelay(context)).toBe(800);
      
      // Fifth retry (attempt 4)
      context.attempt = 4;
      expect(calculateRetryDelay(context)).toBe(1600);
    });
    
    it('should calculate linear backoff delay correctly', () => {
      const policy: RetryPolicyConfig = {
        maxRetries: 5,
        initialDelayMs: 100,
        maxDelayMs: 10000,
        strategy: RetryStrategy.LINEAR_BACKOFF,
        backoffFactor: 2,
        jitterMs: 0 // Disable jitter for predictable tests
      };
      
      const context: RetryContext = {
        attempt: 0,
        firstAttemptTimestamp: Date.now(),
        lastAttemptTimestamp: Date.now(),
        errors: [],
        policy,
        traceContext: {}
      };
      
      // First retry (attempt 0)
      expect(calculateRetryDelay(context)).toBe(100);
      
      // Second retry (attempt 1)
      context.attempt = 1;
      expect(calculateRetryDelay(context)).toBe(300); // 100 + (100 * 2 * 1)
      
      // Third retry (attempt 2)
      context.attempt = 2;
      expect(calculateRetryDelay(context)).toBe(500); // 100 + (100 * 2 * 2)
      
      // Fourth retry (attempt 3)
      context.attempt = 3;
      expect(calculateRetryDelay(context)).toBe(700); // 100 + (100 * 2 * 3)
    });
    
    it('should calculate fixed interval delay correctly', () => {
      const policy: RetryPolicyConfig = {
        maxRetries: 5,
        initialDelayMs: 100,
        maxDelayMs: 10000,
        strategy: RetryStrategy.FIXED_INTERVAL,
        jitterMs: 0 // Disable jitter for predictable tests
      };
      
      const context: RetryContext = {
        attempt: 0,
        firstAttemptTimestamp: Date.now(),
        lastAttemptTimestamp: Date.now(),
        errors: [],
        policy,
        traceContext: {}
      };
      
      // All retries should have the same delay
      expect(calculateRetryDelay(context)).toBe(100);
      
      context.attempt = 1;
      expect(calculateRetryDelay(context)).toBe(100);
      
      context.attempt = 2;
      expect(calculateRetryDelay(context)).toBe(100);
    });
    
    it('should respect maximum delay cap', () => {
      const policy: RetryPolicyConfig = {
        maxRetries: 10,
        initialDelayMs: 100,
        maxDelayMs: 1000, // Cap at 1000ms
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        backoffFactor: 2,
        jitterMs: 0
      };
      
      const context: RetryContext = {
        attempt: 5, // This would normally be 3200ms with exponential backoff
        firstAttemptTimestamp: Date.now(),
        lastAttemptTimestamp: Date.now(),
        errors: [],
        policy,
        traceContext: {}
      };
      
      expect(calculateRetryDelay(context)).toBe(1000); // Capped at maxDelayMs
    });
    
    it('should add jitter to the delay when specified', () => {
      // Mock Math.random to return a predictable value
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.5);
      
      try {
        const policy: RetryPolicyConfig = {
          maxRetries: 5,
          initialDelayMs: 100,
          maxDelayMs: 10000,
          strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
          backoffFactor: 2,
          jitterMs: 100 // Add up to 100ms of jitter
        };
        
        const context: RetryContext = {
          attempt: 0,
          firstAttemptTimestamp: Date.now(),
          lastAttemptTimestamp: Date.now(),
          errors: [],
          policy,
          traceContext: {}
        };
        
        // With Math.random() = 0.5, we should get 50ms of jitter
        expect(calculateRetryDelay(context)).toBe(150); // 100ms base + 50ms jitter
      } finally {
        // Restore original Math.random
        Math.random = originalRandom;
      }
    });
  });
  
  describe('isRetryableError', () => {
    it('should consider all errors retryable by default', () => {
      const policy: RetryPolicyConfig = {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF
      };
      
      const error = new Error('Test error');
      
      expect(isRetryableError(error, policy)).toBe(true);
    });
    
    it('should only retry specified error types if retryableErrors is provided', () => {
      const policy: RetryPolicyConfig = {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        retryableErrors: ['NetworkError', 'TimeoutError']
      };
      
      // Define custom error classes
      class NetworkError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'NetworkError';
        }
      }
      
      class TimeoutError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'TimeoutError';
        }
      }
      
      class ValidationError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'ValidationError';
        }
      }
      
      // NetworkError should be retryable
      expect(isRetryableError(new NetworkError('Network error'), policy)).toBe(true);
      
      // TimeoutError should be retryable
      expect(isRetryableError(new TimeoutError('Timeout error'), policy)).toBe(true);
      
      // ValidationError should not be retryable
      expect(isRetryableError(new ValidationError('Validation error'), policy)).toBe(false);
      
      // Standard Error should not be retryable
      expect(isRetryableError(new Error('Standard error'), policy)).toBe(false);
    });
    
    it('should not retry specified error types if nonRetryableErrors is provided', () => {
      const policy: RetryPolicyConfig = {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        nonRetryableErrors: ['ValidationError', 'AuthorizationError']
      };
      
      // Define custom error classes
      class NetworkError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'NetworkError';
        }
      }
      
      class ValidationError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'ValidationError';
        }
      }
      
      class AuthorizationError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'AuthorizationError';
        }
      }
      
      // NetworkError should be retryable
      expect(isRetryableError(new NetworkError('Network error'), policy)).toBe(true);
      
      // ValidationError should not be retryable
      expect(isRetryableError(new ValidationError('Validation error'), policy)).toBe(false);
      
      // AuthorizationError should not be retryable
      expect(isRetryableError(new AuthorizationError('Authorization error'), policy)).toBe(false);
      
      // Standard Error should be retryable
      expect(isRetryableError(new Error('Standard error'), policy)).toBe(true);
    });
  });
  
  describe('Circuit Breaker Functions', () => {
    beforeEach(() => {
      // Reset circuit breaker state between tests
      // This is a bit of a hack since we're accessing private state
      // @ts-ignore - Accessing private property for testing
      if (global.circuitBreakerState) {
        // @ts-ignore
        global.circuitBreakerState = {};
      }
    });
    
    it('should report circuit breaker as closed by default', () => {
      expect(isCircuitBreakerOpen('test-service')).toBe(false);
    });
    
    it('should open circuit breaker after threshold failures', () => {
      const options = {
        failureThreshold: 3,
        resetTimeout: 30000,
        rollingCountWindow: 60000
      };
      
      // First failure
      expect(recordCircuitBreakerFailure('test-service', options)).toBe(false);
      expect(isCircuitBreakerOpen('test-service')).toBe(false);
      
      // Second failure
      expect(recordCircuitBreakerFailure('test-service', options)).toBe(false);
      expect(isCircuitBreakerOpen('test-service')).toBe(false);
      
      // Third failure - should open the circuit
      expect(recordCircuitBreakerFailure('test-service', options)).toBe(true);
      expect(isCircuitBreakerOpen('test-service')).toBe(true);
    });
    
    it('should close circuit breaker after success', () => {
      const options = {
        failureThreshold: 3,
        resetTimeout: 30000,
        rollingCountWindow: 60000
      };
      
      // Open the circuit
      recordCircuitBreakerFailure('test-service', options);
      recordCircuitBreakerFailure('test-service', options);
      recordCircuitBreakerFailure('test-service', options);
      expect(isCircuitBreakerOpen('test-service')).toBe(true);
      
      // Record success
      recordCircuitBreakerSuccess('test-service');
      
      // Circuit should be closed
      expect(isCircuitBreakerOpen('test-service')).toBe(false);
    });
    
    it('should reset failure count after rolling window', () => {
      jest.useFakeTimers();
      
      const options = {
        failureThreshold: 3,
        resetTimeout: 30000,
        rollingCountWindow: 1000 // 1 second for testing
      };
      
      // First failure
      recordCircuitBreakerFailure('test-service', options);
      
      // Advance time beyond rolling window
      jest.advanceTimersByTime(1500); // 1.5 seconds
      
      // Second failure - should reset count to 1
      expect(recordCircuitBreakerFailure('test-service', options)).toBe(false);
      
      // Third failure - should still be at count 2
      expect(recordCircuitBreakerFailure('test-service', options)).toBe(false);
      
      // Fourth failure - should open the circuit
      expect(recordCircuitBreakerFailure('test-service', options)).toBe(true);
      
      jest.useRealTimers();
    });
    
    it('should auto-reset circuit breaker after reset timeout', () => {
      jest.useFakeTimers();
      
      const options = {
        failureThreshold: 3,
        resetTimeout: 1000, // 1 second for testing
        rollingCountWindow: 60000
      };
      
      // Open the circuit
      recordCircuitBreakerFailure('test-service', options);
      recordCircuitBreakerFailure('test-service', options);
      recordCircuitBreakerFailure('test-service', options);
      expect(isCircuitBreakerOpen('test-service')).toBe(true);
      
      // Advance time beyond reset timeout
      jest.advanceTimersByTime(1500); // 1.5 seconds
      
      // Circuit should be closed
      expect(isCircuitBreakerOpen('test-service')).toBe(false);
      
      jest.useRealTimers();
    });
  });
  
  describe('sendToDeadLetterQueue', () => {
    it('should send failed event to DLQ', async () => {
      const event: BaseEvent = {
        eventId: 'test-event-id',
        type: 'TEST_EVENT'
      };
      
      const error = new Error('Test error');
      
      const retryContext: RetryContext = {
        attempt: 3,
        firstAttemptTimestamp: Date.now() - 1000,
        lastAttemptTimestamp: Date.now(),
        errors: [error, error, error],
        policy: {
          maxRetries: 3,
          initialDelayMs: 100,
          maxDelayMs: 1000,
          strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
          deadLetterQueueTopic: 'test-dlq'
        },
        journeyType: JourneyType.HEALTH
      };
      
      const result = await sendToDeadLetterQueue(
        event,
        error,
        retryContext,
        mockKafkaProducer,
        mockLogger
      );
      
      expect(result).toBe(true);
      expect(mockKafkaProducer.produce).toHaveBeenCalledTimes(1);
      expect(mockKafkaProducer.produce).toHaveBeenCalledWith({
        topic: 'test-dlq',
        messages: expect.arrayContaining([
          expect.objectContaining({
            key: 'test-event-id',
            headers: expect.objectContaining({
              'x-retry-count': '3',
              'x-original-event-type': 'TEST_EVENT',
              'x-failure-reason': 'Test error',
              'x-journey-type': 'health'
            })
          })
        ])
      });
    });
    
    it('should handle missing DLQ topic', async () => {
      const event: BaseEvent = {
        eventId: 'test-event-id',
        type: 'TEST_EVENT'
      };
      
      const error = new Error('Test error');
      
      const retryContext: RetryContext = {
        attempt: 3,
        firstAttemptTimestamp: Date.now() - 1000,
        lastAttemptTimestamp: Date.now(),
        errors: [error, error, error],
        policy: {
          maxRetries: 3,
          initialDelayMs: 100,
          maxDelayMs: 1000,
          strategy: RetryStrategy.EXPONENTIAL_BACKOFF
          // No deadLetterQueueTopic
        },
        journeyType: JourneyType.HEALTH
      };
      
      const result = await sendToDeadLetterQueue(
        event,
        error,
        retryContext,
        mockKafkaProducer,
        mockLogger
      );
      
      expect(result).toBe(false);
      expect(mockKafkaProducer.produce).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });
    
    it('should handle DLQ send failure', async () => {
      const event: BaseEvent = {
        eventId: 'test-event-id',
        type: 'TEST_EVENT'
      };
      
      const error = new Error('Test error');
      
      const retryContext: RetryContext = {
        attempt: 3,
        firstAttemptTimestamp: Date.now() - 1000,
        lastAttemptTimestamp: Date.now(),
        errors: [error, error, error],
        policy: {
          maxRetries: 3,
          initialDelayMs: 100,
          maxDelayMs: 1000,
          strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
          deadLetterQueueTopic: 'test-dlq'
        },
        journeyType: JourneyType.HEALTH
      };
      
      // Mock Kafka producer to throw an error
      mockKafkaProducer.produce.mockRejectedValueOnce(new Error('Kafka error'));
      
      const result = await sendToDeadLetterQueue(
        event,
        error,
        retryContext,
        mockKafkaProducer,
        mockLogger
      );
      
      expect(result).toBe(false);
      expect(mockKafkaProducer.produce).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
  
  describe('executeWithRetry', () => {
    it('should execute operation successfully without retries', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const policy: RetryPolicyConfig = {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF
      };
      
      const retryContext = createRetryContext(policy);
      
      const result = await executeWithRetry(operation, retryContext, mockLogger);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.retryContext.attempt).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });
    
    it('should retry operation on failure', async () => {
      // Operation fails twice, then succeeds
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockResolvedValueOnce('success');
      
      const policy: RetryPolicyConfig = {
        maxRetries: 3,
        initialDelayMs: 10, // Small delay for faster tests
        maxDelayMs: 100,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF
      };
      
      const retryContext = createRetryContext(policy);
      
      const result = await executeWithRetry(operation, retryContext, mockLogger);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.retryContext.attempt).toBe(3); // Initial attempt + 2 retries
      expect(operation).toHaveBeenCalledTimes(3);
    });
    
    it('should abort after max retries', async () => {
      // Operation always fails
      const error = new Error('Persistent failure');
      const operation = jest.fn().mockRejectedValue(error);
      
      const policy: RetryPolicyConfig = {
        maxRetries: 2,
        initialDelayMs: 10, // Small delay for faster tests
        maxDelayMs: 100,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF
      };
      
      const retryContext = createRetryContext(policy);
      
      const result = await executeWithRetry(operation, retryContext, mockLogger);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.retryContext.attempt).toBe(3); // Initial attempt + 2 retries
      expect(operation).toHaveBeenCalledTimes(3);
    });
    
    it('should not retry non-retryable errors', async () => {
      class ValidationError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'ValidationError';
        }
      }
      
      const error = new ValidationError('Invalid data');
      const operation = jest.fn().mockRejectedValue(error);
      
      const policy: RetryPolicyConfig = {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        nonRetryableErrors: ['ValidationError']
      };
      
      const retryContext = createRetryContext(policy);
      
      const result = await executeWithRetry(operation, retryContext, mockLogger);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.retryContext.attempt).toBe(1); // Only the initial attempt
      expect(operation).toHaveBeenCalledTimes(1);
    });
    
    it('should send to DLQ after max retries if configured', async () => {
      // Operation always fails
      const error = new Error('Persistent failure');
      const operation = jest.fn().mockRejectedValue(error);
      
      const policy: RetryPolicyConfig = {
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 100,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        deadLetterQueueTopic: 'test-dlq'
      };
      
      const retryContext = createRetryContext(policy, JourneyType.HEALTH);
      
      // Mock sendToDeadLetterQueue
      const mockSendToDLQ = jest.spyOn(require('../../../src/utils/retry-utils'), 'sendToDeadLetterQueue')
        .mockResolvedValue(true);
      
      const result = await executeWithRetry(
        operation,
        retryContext,
        mockLogger,
        mockKafkaProducer
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.sentToDLQ).toBe(true);
      expect(mockSendToDLQ).toHaveBeenCalledTimes(1);
      
      // Restore original implementation
      mockSendToDLQ.mockRestore();
    });
    
    it('should respect circuit breaker if enabled', async () => {
      // Mock circuit breaker as open
      jest.spyOn(require('../../../src/utils/retry-utils'), 'isCircuitBreakerOpen')
        .mockReturnValue(true);
      
      const operation = jest.fn().mockResolvedValue('success');
      
      const policy: RetryPolicyConfig = {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        enableCircuitBreaker: true,
        circuitBreakerOptions: {
          failureThreshold: 3,
          resetTimeout: 30000,
          rollingCountWindow: 60000
        }
      };
      
      const retryContext = createRetryContext(policy, JourneyType.HEALTH);
      
      const result = await executeWithRetry(operation, retryContext, mockLogger);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Circuit breaker open');
      expect(result.retryContext.circuitBreakerOpen).toBe(true);
      expect(operation).not.toHaveBeenCalled();
      
      // Restore original implementation
      jest.restoreAllMocks();
    });
    
    it('should preserve trace context between retries', async () => {
      // Operation fails once, then succeeds
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('success');
      
      const policy: RetryPolicyConfig = {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF
      };
      
      const retryContext = createRetryContext(policy);
      retryContext.traceContext = { correlationId: 'test-correlation-id' };
      
      const result = await executeWithRetry(operation, retryContext, mockLogger);
      
      expect(result.success).toBe(true);
      expect(result.retryContext.traceContext).toEqual({ correlationId: 'test-correlation-id' });
    });
  });
  
  describe('retryEventProcessing', () => {
    it('should process event with retry on failure', async () => {
      const event: BaseEvent = {
        eventId: 'test-event-id',
        type: 'TEST_EVENT'
      };
      
      // Processor fails once, then succeeds
      const processor = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('processed');
      
      const result = await retryEventProcessing(
        event,
        processor,
        JourneyType.HEALTH,
        { maxRetries: 3, initialDelayMs: 10, maxDelayMs: 100, strategy: RetryStrategy.EXPONENTIAL_BACKOFF },
        mockLogger
      );
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('processed');
      expect(processor).toHaveBeenCalledTimes(2);
      expect(processor).toHaveBeenCalledWith(event);
    });
    
    it('should use journey-specific retry policy', async () => {
      const event: BaseEvent = {
        eventId: 'test-event-id',
        type: 'TEST_EVENT'
      };
      
      const processor = jest.fn().mockResolvedValue('processed');
      
      // Spy on getRetryPolicy
      const getRetrySpy = jest.spyOn(require('../../../src/utils/retry-utils'), 'getRetryPolicy');
      
      await retryEventProcessing(
        event,
        processor,
        JourneyType.HEALTH,
        undefined,
        mockLogger
      );
      
      expect(getRetrySpy).toHaveBeenCalledWith(JourneyType.HEALTH, undefined);
      
      // Restore original implementation
      getRetrySpy.mockRestore();
    });
    
    it('should create appropriate span for tracing', async () => {
      const event: BaseEvent = {
        eventId: 'test-event-id',
        type: 'TEST_EVENT'
      };
      
      const processor = jest.fn().mockResolvedValue('processed');
      
      await retryEventProcessing(
        event,
        processor,
        JourneyType.HEALTH,
        undefined,
        mockLogger,
        undefined,
        { name: 'custom-span', attributes: { custom: 'attribute' } }
      );
      
      expect(Span).toHaveBeenCalledWith(expect.objectContaining({
        name: 'custom-span',
        attributes: expect.objectContaining({
          custom: 'attribute',
          'event.id': 'test-event-id',
          'event.type': 'TEST_EVENT',
          'journey.type': 'health'
        })
      }));
    });
  });
  
  describe('withRetry', () => {
    it('should create a retry wrapper for any function', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      
      const wrappedFn = withRetry(JourneyType.HEALTH)(fn);
      
      const result = await wrappedFn('arg1', 'arg2');
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('result');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
    
    it('should retry wrapped function on failure', async () => {
      // Function fails once, then succeeds
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('result');
      
      const wrappedFn = withRetry(
        JourneyType.HEALTH,
        { maxRetries: 3, initialDelayMs: 10, maxDelayMs: 100, strategy: RetryStrategy.EXPONENTIAL_BACKOFF }
      )(fn);
      
      const result = await wrappedFn('arg1', 'arg2');
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('result');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
    
    it('should handle failure after max retries', async () => {
      // Function always fails
      const error = new Error('Persistent failure');
      const fn = jest.fn().mockRejectedValue(error);
      
      const wrappedFn = withRetry(
        JourneyType.HEALTH,
        { maxRetries: 2, initialDelayMs: 10, maxDelayMs: 100, strategy: RetryStrategy.EXPONENTIAL_BACKOFF }
      )(fn);
      
      const result = await wrappedFn('arg1', 'arg2');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
  
  describe('Journey-specific retry policies', () => {
    it('should have appropriate retry policies for each journey', () => {
      // Health journey should have moderate retry settings
      const healthPolicy = DEFAULT_RETRY_POLICIES[JourneyType.HEALTH];
      expect(healthPolicy.maxRetries).toBe(5);
      expect(healthPolicy.strategy).toBe(RetryStrategy.EXPONENTIAL_BACKOFF);
      expect(healthPolicy.deadLetterQueueTopic).toBe('health-events-dlq');
      
      // Care journey should have fewer retries (more time-sensitive)
      const carePolicy = DEFAULT_RETRY_POLICIES[JourneyType.CARE];
      expect(carePolicy.maxRetries).toBe(3);
      expect(carePolicy.strategy).toBe(RetryStrategy.EXPONENTIAL_BACKOFF);
      expect(carePolicy.deadLetterQueueTopic).toBe('care-events-dlq');
      
      // Plan journey should have more retries (less time-sensitive)
      const planPolicy = DEFAULT_RETRY_POLICIES[JourneyType.PLAN];
      expect(planPolicy.maxRetries).toBe(7);
      expect(planPolicy.strategy).toBe(RetryStrategy.EXPONENTIAL_BACKOFF);
      expect(planPolicy.deadLetterQueueTopic).toBe('plan-events-dlq');
      
      // Gamification should have many retries (not critical path)
      const gamificationPolicy = DEFAULT_RETRY_POLICIES[JourneyType.GAMIFICATION];
      expect(gamificationPolicy.maxRetries).toBe(10);
      expect(gamificationPolicy.strategy).toBe(RetryStrategy.EXPONENTIAL_BACKOFF);
      expect(gamificationPolicy.deadLetterQueueTopic).toBe('gamification-events-dlq');
      
      // Notification should have the most retries (must be delivered)
      const notificationPolicy = DEFAULT_RETRY_POLICIES[JourneyType.NOTIFICATION];
      expect(notificationPolicy.maxRetries).toBe(15);
      expect(notificationPolicy.strategy).toBe(RetryStrategy.EXPONENTIAL_BACKOFF);
      expect(notificationPolicy.deadLetterQueueTopic).toBe('notification-events-dlq');
    });
    
    it('should use appropriate circuit breaker settings for each journey', () => {
      // Health journey should have circuit breaker enabled
      const healthPolicy = DEFAULT_RETRY_POLICIES[JourneyType.HEALTH];
      expect(healthPolicy.enableCircuitBreaker).toBe(true);
      expect(healthPolicy.circuitBreakerOptions?.failureThreshold).toBe(5);
      
      // Care journey should have circuit breaker with lower threshold
      const carePolicy = DEFAULT_RETRY_POLICIES[JourneyType.CARE];
      expect(carePolicy.enableCircuitBreaker).toBe(true);
      expect(carePolicy.circuitBreakerOptions?.failureThreshold).toBe(3);
      
      // Gamification should not have circuit breaker (not critical path)
      const gamificationPolicy = DEFAULT_RETRY_POLICIES[JourneyType.GAMIFICATION];
      expect(gamificationPolicy.enableCircuitBreaker).toBe(false);
    });
  });
});