import { Test } from '@nestjs/testing';
import { createMockKafkaError, createMockRetryExhaustedError } from './mocks';
import { 
  firstAttemptRetryState, 
  midAttemptRetryState, 
  finalAttemptRetryState,
  customRetryState,
  createRetryState,
  healthMetricRecordedEvent,
  careAppointmentBookedEvent,
  planClaimSubmittedEvent,
  schemaValidationErrorContext,
  consumerProcessingErrorContext,
  deserializationErrorContext
} from './fixtures';
import { ERROR_CODES } from '../../../src/constants/errors.constants';

// Import the retry policies to test
import { 
  ExponentialBackoffRetryPolicy,
  ConstantIntervalRetryPolicy,
  JourneySpecificRetryPolicy,
  RetryPolicy,
  RetryPolicyFactory,
  NoRetryPolicy
} from '../../../src/errors/retry-policies';

describe('Retry Policies', () => {
  
  describe('ExponentialBackoffRetryPolicy', () => {
    let retryPolicy: ExponentialBackoffRetryPolicy;
    
    beforeEach(() => {
      // Create a new instance with default settings for each test
      retryPolicy = new ExponentialBackoffRetryPolicy({
        maxRetries: 5,
        initialDelayMs: 100,
        maxDelayMs: 30000,
        backoffFactor: 2,
        jitterFactor: 0.1
      });
    });
    
    it('should correctly determine if retry is allowed based on attempt count', async () => {
      // First attempt (should allow retry)
      const shouldRetry1 = await retryPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: healthMetricRecordedEvent,
        retryState: firstAttemptRetryState
      });
      expect(shouldRetry1).toBe(true);
      
      // Mid attempt (should allow retry)
      const shouldRetry2 = await retryPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: healthMetricRecordedEvent,
        retryState: midAttemptRetryState
      });
      expect(shouldRetry2).toBe(true);
      
      // Final attempt (should not allow retry)
      const shouldRetry3 = await retryPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: healthMetricRecordedEvent,
        retryState: finalAttemptRetryState
      });
      expect(shouldRetry3).toBe(false);
    });
    
    it('should calculate correct delay with exponential backoff', () => {
      // First attempt: initialDelay = 100ms
      const delay1 = retryPolicy.getRetryDelay({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: healthMetricRecordedEvent,
        retryState: firstAttemptRetryState
      });
      // Allow for jitter (±10%)
      expect(delay1).toBeGreaterThanOrEqual(90);
      expect(delay1).toBeLessThanOrEqual(110);
      
      // Third attempt: initialDelay * (backoffFactor^2) = 100 * (2^2) = 400ms
      const delay3 = retryPolicy.getRetryDelay({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: healthMetricRecordedEvent,
        retryState: midAttemptRetryState
      });
      // Allow for jitter (±10%)
      expect(delay3).toBeGreaterThanOrEqual(360); // 400 - 10%
      expect(delay3).toBeLessThanOrEqual(440); // 400 + 10%
    });
    
    it('should respect maximum delay limit', () => {
      // Create a retry state with a high attempt count
      const highAttemptState = createRetryState(10, 15, {
        initialDelay: 100,
        maxDelay: 5000,
        backoffFactor: 2
      });
      
      const delay = retryPolicy.getRetryDelay({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: healthMetricRecordedEvent,
        retryState: highAttemptState
      });
      
      // The calculated delay would be 100 * 2^9 = 51200ms, but should be capped at maxDelay
      // Allow for jitter (±10%)
      expect(delay).toBeGreaterThanOrEqual(4500); // 5000 - 10%
      expect(delay).toBeLessThanOrEqual(5500); // 5000 + 10%
    });
    
    it('should apply jitter to prevent thundering herd problem', () => {
      // Run multiple calculations and ensure they're not all identical
      const delays: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        delays.push(retryPolicy.getRetryDelay({
          error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
          event: healthMetricRecordedEvent,
          retryState: firstAttemptRetryState
        }));
      }
      
      // Check that we have at least some variation in the delays
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
    
    it('should handle custom configuration', () => {
      // Create a policy with custom settings
      const customPolicy = new ExponentialBackoffRetryPolicy({
        maxRetries: 10,
        initialDelayMs: 50,
        maxDelayMs: 10000,
        backoffFactor: 3,
        jitterFactor: 0.2
      });
      
      // Test with second attempt
      const delay = customPolicy.getRetryDelay({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: healthMetricRecordedEvent,
        retryState: customRetryState
      });
      
      // Expected delay: 50 * 3^1 = 150ms (for attempt 2)
      // With jitter of ±20%, range is 120-180ms
      expect(delay).toBeGreaterThanOrEqual(120);
      expect(delay).toBeLessThanOrEqual(180);
    });
  });
  
  describe('ConstantIntervalRetryPolicy', () => {
    let retryPolicy: ConstantIntervalRetryPolicy;
    
    beforeEach(() => {
      // Create a new instance with default settings for each test
      retryPolicy = new ConstantIntervalRetryPolicy({
        maxRetries: 5,
        delayMs: 1000,
        jitterFactor: 0.1
      });
    });
    
    it('should correctly determine if retry is allowed based on attempt count', async () => {
      // First attempt (should allow retry)
      const shouldRetry1 = await retryPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: careAppointmentBookedEvent,
        retryState: firstAttemptRetryState
      });
      expect(shouldRetry1).toBe(true);
      
      // Final attempt (should not allow retry)
      const shouldRetry3 = await retryPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: careAppointmentBookedEvent,
        retryState: finalAttemptRetryState
      });
      expect(shouldRetry3).toBe(false);
    });
    
    it('should use constant delay for all attempts', () => {
      // First attempt
      const delay1 = retryPolicy.getRetryDelay({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: careAppointmentBookedEvent,
        retryState: firstAttemptRetryState
      });
      
      // Third attempt
      const delay3 = retryPolicy.getRetryDelay({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: careAppointmentBookedEvent,
        retryState: midAttemptRetryState
      });
      
      // Both should be around 1000ms (±10% for jitter)
      expect(delay1).toBeGreaterThanOrEqual(900);
      expect(delay1).toBeLessThanOrEqual(1100);
      expect(delay3).toBeGreaterThanOrEqual(900);
      expect(delay3).toBeLessThanOrEqual(1100);
    });
    
    it('should apply jitter to prevent thundering herd problem', () => {
      // Run multiple calculations and ensure they're not all identical
      const delays: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        delays.push(retryPolicy.getRetryDelay({
          error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
          event: careAppointmentBookedEvent,
          retryState: firstAttemptRetryState
        }));
      }
      
      // Check that we have at least some variation in the delays
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
    
    it('should handle custom configuration', () => {
      // Create a policy with custom settings
      const customPolicy = new ConstantIntervalRetryPolicy({
        maxRetries: 8,
        delayMs: 500,
        jitterFactor: 0.05
      });
      
      // Test with any attempt
      const delay = customPolicy.getRetryDelay({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: careAppointmentBookedEvent,
        retryState: midAttemptRetryState
      });
      
      // Expected delay: 500ms
      // With jitter of ±5%, range is 475-525ms
      expect(delay).toBeGreaterThanOrEqual(475);
      expect(delay).toBeLessThanOrEqual(525);
    });
  });
  
  describe('NoRetryPolicy', () => {
    let retryPolicy: NoRetryPolicy;
    
    beforeEach(() => {
      retryPolicy = new NoRetryPolicy();
    });
    
    it('should never allow retries', async () => {
      // Should not retry regardless of attempt count or error type
      const shouldRetry = await retryPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: planClaimSubmittedEvent,
        retryState: firstAttemptRetryState
      });
      
      expect(shouldRetry).toBe(false);
    });
    
    it('should return zero delay', () => {
      // Should always return 0 delay
      const delay = retryPolicy.getRetryDelay({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: planClaimSubmittedEvent,
        retryState: firstAttemptRetryState
      });
      
      expect(delay).toBe(0);
    });
  });
  
  describe('JourneySpecificRetryPolicy', () => {
    let retryPolicy: JourneySpecificRetryPolicy;
    
    beforeEach(() => {
      // Create a policy with journey-specific configurations
      retryPolicy = new JourneySpecificRetryPolicy({
        defaultPolicy: {
          type: 'exponential',
          maxRetries: 3,
          initialDelayMs: 200,
          maxDelayMs: 5000,
          backoffFactor: 2,
          jitterFactor: 0.1
        },
        journeyPolicies: {
          health: {
            type: 'exponential',
            maxRetries: 5,
            initialDelayMs: 100,
            maxDelayMs: 10000,
            backoffFactor: 2,
            jitterFactor: 0.1
          },
          care: {
            type: 'constant',
            maxRetries: 4,
            delayMs: 1000,
            jitterFactor: 0.1
          },
          plan: {
            type: 'exponential',
            maxRetries: 2,
            initialDelayMs: 500,
            maxDelayMs: 2000,
            backoffFactor: 1.5,
            jitterFactor: 0.05
          }
        },
        errorPolicies: {
          [ERROR_CODES.SCHEMA_VALIDATION_FAILED]: {
            type: 'no-retry'
          },
          [ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED]: {
            type: 'constant',
            maxRetries: 1,
            delayMs: 100,
            jitterFactor: 0
          }
        }
      });
    });
    
    it('should use journey-specific policy for health events', async () => {
      // Health event should use health journey policy (5 retries)
      const shouldRetry = await retryPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: healthMetricRecordedEvent,
        retryState: createRetryState(5, 5)
      });
      
      // 5th attempt is the last one allowed for health journey
      expect(shouldRetry).toBe(false);
      
      // Check that it would allow retry on 4th attempt
      const shouldRetryEarlier = await retryPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: healthMetricRecordedEvent,
        retryState: createRetryState(4, 5)
      });
      
      expect(shouldRetryEarlier).toBe(true);
    });
    
    it('should use journey-specific policy for care events', async () => {
      // Care event should use care journey policy (constant delay)
      const delay = retryPolicy.getRetryDelay({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: careAppointmentBookedEvent,
        retryState: midAttemptRetryState
      });
      
      // Should be around 1000ms (±10% for jitter)
      expect(delay).toBeGreaterThanOrEqual(900);
      expect(delay).toBeLessThanOrEqual(1100);
    });
    
    it('should use journey-specific policy for plan events', async () => {
      // Plan event should use plan journey policy (2 retries)
      const shouldRetry = await retryPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: planClaimSubmittedEvent,
        retryState: createRetryState(2, 2)
      });
      
      // 2nd attempt is the last one allowed for plan journey
      expect(shouldRetry).toBe(false);
      
      // Check that it would allow retry on 1st attempt
      const shouldRetryEarlier = await retryPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: planClaimSubmittedEvent,
        retryState: createRetryState(1, 2)
      });
      
      expect(shouldRetryEarlier).toBe(true);
    });
    
    it('should use error-specific policy for schema validation errors', async () => {
      // Schema validation errors should use no-retry policy
      const shouldRetry = await retryPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.SCHEMA_VALIDATION_FAILED),
        event: healthMetricRecordedEvent,
        retryState: firstAttemptRetryState
      });
      
      // Should not retry schema validation errors
      expect(shouldRetry).toBe(false);
    });
    
    it('should use error-specific policy for deserialization errors', async () => {
      // Deserialization errors should use constant policy with 1 retry
      const shouldRetry1 = await retryPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED),
        event: careAppointmentBookedEvent,
        retryState: createRetryState(1, 1)
      });
      
      // 1st attempt is the only one allowed for deserialization errors
      expect(shouldRetry1).toBe(false);
      
      // Check delay is 100ms with no jitter
      const delay = retryPolicy.getRetryDelay({
        error: createMockKafkaError(ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED),
        event: careAppointmentBookedEvent,
        retryState: firstAttemptRetryState
      });
      
      expect(delay).toBe(100);
    });
    
    it('should use default policy when no specific policy matches', async () => {
      // Create an event with unknown journey
      const customEvent = { ...healthMetricRecordedEvent, metadata: { ...healthMetricRecordedEvent.metadata, source: 'unknown-service' } };
      
      // Should use default policy (3 retries)
      const shouldRetry = await retryPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: customEvent,
        retryState: createRetryState(3, 3)
      });
      
      // 3rd attempt is the last one allowed for default policy
      expect(shouldRetry).toBe(false);
      
      // Check that it would allow retry on 2nd attempt
      const shouldRetryEarlier = await retryPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_PROCESSING_FAILED),
        event: customEvent,
        retryState: createRetryState(2, 3)
      });
      
      expect(shouldRetryEarlier).toBe(true);
    });
  });
  
  describe('RetryPolicyFactory', () => {
    let factory: RetryPolicyFactory;
    
    beforeEach(() => {
      factory = new RetryPolicyFactory();
    });
    
    it('should create exponential backoff policy', () => {
      const policy = factory.createPolicy({
        type: 'exponential',
        maxRetries: 5,
        initialDelayMs: 100,
        maxDelayMs: 5000,
        backoffFactor: 2,
        jitterFactor: 0.1
      });
      
      expect(policy).toBeInstanceOf(ExponentialBackoffRetryPolicy);
    });
    
    it('should create constant interval policy', () => {
      const policy = factory.createPolicy({
        type: 'constant',
        maxRetries: 3,
        delayMs: 1000,
        jitterFactor: 0.1
      });
      
      expect(policy).toBeInstanceOf(ConstantIntervalRetryPolicy);
    });
    
    it('should create no-retry policy', () => {
      const policy = factory.createPolicy({
        type: 'no-retry'
      });
      
      expect(policy).toBeInstanceOf(NoRetryPolicy);
    });
    
    it('should create journey-specific policy', () => {
      const policy = factory.createPolicy({
        type: 'journey-specific',
        defaultPolicy: {
          type: 'exponential',
          maxRetries: 3,
          initialDelayMs: 200,
          maxDelayMs: 5000,
          backoffFactor: 2,
          jitterFactor: 0.1
        },
        journeyPolicies: {
          health: {
            type: 'exponential',
            maxRetries: 5,
            initialDelayMs: 100,
            maxDelayMs: 10000,
            backoffFactor: 2,
            jitterFactor: 0.1
          }
        },
        errorPolicies: {
          [ERROR_CODES.SCHEMA_VALIDATION_FAILED]: {
            type: 'no-retry'
          }
        }
      });
      
      expect(policy).toBeInstanceOf(JourneySpecificRetryPolicy);
    });
    
    it('should throw error for unknown policy type', () => {
      expect(() => {
        factory.createPolicy({
          // @ts-ignore - Testing invalid type
          type: 'unknown'
        });
      }).toThrow('Unknown retry policy type: unknown');
    });
  });
  
  describe('Error Classification for Retry Decisions', () => {
    let exponentialPolicy: ExponentialBackoffRetryPolicy;
    
    beforeEach(() => {
      exponentialPolicy = new ExponentialBackoffRetryPolicy({
        maxRetries: 5,
        initialDelayMs: 100,
        maxDelayMs: 30000,
        backoffFactor: 2,
        jitterFactor: 0.1
      });
    });
    
    it('should retry transient errors', async () => {
      // Transient errors like connection issues should be retried
      const shouldRetry = await exponentialPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.CONSUMER_CONNECTION_FAILED),
        event: healthMetricRecordedEvent,
        retryState: firstAttemptRetryState
      });
      
      expect(shouldRetry).toBe(true);
    });
    
    it('should not retry permanent errors', async () => {
      // Permanent errors like schema validation should not be retried
      const shouldRetry = await exponentialPolicy.shouldRetry({
        error: createMockKafkaError(ERROR_CODES.SCHEMA_VALIDATION_FAILED),
        event: healthMetricRecordedEvent,
        retryState: firstAttemptRetryState
      });
      
      expect(shouldRetry).toBe(false);
    });
    
    it('should not retry when retry is exhausted', async () => {
      // Retry exhausted errors should not be retried
      const shouldRetry = await exponentialPolicy.shouldRetry({
        error: createMockRetryExhaustedError('test-topic', 5, 5),
        event: healthMetricRecordedEvent,
        retryState: finalAttemptRetryState
      });
      
      expect(shouldRetry).toBe(false);
    });
  });
});