/**
 * @file config.constants.spec.ts
 * @description Unit tests for configuration constants that verify the default values for
 * consumer groups, batch sizes, timeouts, retry settings, and concurrency limits. These tests
 * ensure that default configuration values are sensible and provide proper fallbacks when
 * environment-specific settings are not available.
 */

import {
  DEFAULT_CONSUMER_GROUPS,
  DEFAULT_BATCH_SIZES,
  DEFAULT_CONCURRENCY_LIMITS,
  DEFAULT_TIMEOUTS_MS,
  DEFAULT_RETRY_SETTINGS,
  DEFAULT_CIRCUIT_BREAKER,
  DEFAULT_TTL_SECONDS,
  DEFAULT_KAFKA_TOPICS,
  DEFAULT_RATE_LIMITS,
  DEFAULT_AUDIT_SETTINGS,
} from '../../../src/constants/config.constants';

describe('Configuration Constants', () => {
  describe('DEFAULT_CONSUMER_GROUPS', () => {
    it('should define consumer groups for all required services', () => {
      // Verify consumer groups for all services exist
      expect(DEFAULT_CONSUMER_GROUPS.API_GATEWAY).toBeDefined();
      expect(DEFAULT_CONSUMER_GROUPS.AUTH_SERVICE).toBeDefined();
      expect(DEFAULT_CONSUMER_GROUPS.HEALTH_SERVICE).toBeDefined();
      expect(DEFAULT_CONSUMER_GROUPS.CARE_SERVICE).toBeDefined();
      expect(DEFAULT_CONSUMER_GROUPS.PLAN_SERVICE).toBeDefined();
      expect(DEFAULT_CONSUMER_GROUPS.GAMIFICATION_ENGINE).toBeDefined();
      expect(DEFAULT_CONSUMER_GROUPS.NOTIFICATION_SERVICE).toBeDefined();
    });

    it('should follow the standardized consumer group naming pattern', () => {
      // All consumer groups should follow the pattern: {service}-consumer-group
      expect(DEFAULT_CONSUMER_GROUPS.API_GATEWAY).toBe('api-gateway-consumer-group');
      expect(DEFAULT_CONSUMER_GROUPS.AUTH_SERVICE).toBe('auth-service-consumer-group');
      expect(DEFAULT_CONSUMER_GROUPS.HEALTH_SERVICE).toBe('health-service-consumer-group');
      expect(DEFAULT_CONSUMER_GROUPS.CARE_SERVICE).toBe('care-service-consumer-group');
      expect(DEFAULT_CONSUMER_GROUPS.PLAN_SERVICE).toBe('plan-service-consumer-group');
      expect(DEFAULT_CONSUMER_GROUPS.GAMIFICATION_ENGINE).toBe('gamification-consumer-group');
      expect(DEFAULT_CONSUMER_GROUPS.NOTIFICATION_SERVICE).toBe('notification-service-consumer-group');
    });

    it('should have unique consumer group IDs for each service to prevent cross-consumption', () => {
      // Each service should have a unique consumer group ID
      const consumerGroupValues = Object.values(DEFAULT_CONSUMER_GROUPS);
      const uniqueValues = new Set(consumerGroupValues);
      expect(uniqueValues.size).toBe(consumerGroupValues.length);
    });
  });

  describe('DEFAULT_BATCH_SIZES', () => {
    it('should define batch sizes for different processing scenarios', () => {
      // Verify batch sizes for different scenarios exist
      expect(DEFAULT_BATCH_SIZES.STANDARD).toBeDefined();
      expect(DEFAULT_BATCH_SIZES.HIGH_VOLUME).toBeDefined();
      expect(DEFAULT_BATCH_SIZES.COMPLEX).toBeDefined();
      expect(DEFAULT_BATCH_SIZES.CRITICAL).toBeDefined();
    });

    it('should have appropriate batch sizes for optimal performance', () => {
      // Batch sizes should be appropriate for their intended use
      expect(DEFAULT_BATCH_SIZES.STANDARD).toBe(100);
      expect(DEFAULT_BATCH_SIZES.HIGH_VOLUME).toBe(250);
      expect(DEFAULT_BATCH_SIZES.COMPLEX).toBe(50);
      expect(DEFAULT_BATCH_SIZES.CRITICAL).toBe(10);
    });

    it('should have larger batch sizes for high-volume events than for complex events', () => {
      // High-volume events should have larger batch sizes than complex events
      expect(DEFAULT_BATCH_SIZES.HIGH_VOLUME).toBeGreaterThan(DEFAULT_BATCH_SIZES.STANDARD);
      expect(DEFAULT_BATCH_SIZES.STANDARD).toBeGreaterThan(DEFAULT_BATCH_SIZES.COMPLEX);
      expect(DEFAULT_BATCH_SIZES.COMPLEX).toBeGreaterThan(DEFAULT_BATCH_SIZES.CRITICAL);
    });

    it('should have batch sizes that are positive integers', () => {
      // All batch sizes should be positive integers
      Object.values(DEFAULT_BATCH_SIZES).forEach(size => {
        expect(Number.isInteger(size)).toBe(true);
        expect(size).toBeGreaterThan(0);
      });
    });
  });

  describe('DEFAULT_CONCURRENCY_LIMITS', () => {
    it('should define concurrency limits for different processing scenarios', () => {
      // Verify concurrency limits for different scenarios exist
      expect(DEFAULT_CONCURRENCY_LIMITS.STANDARD).toBeDefined();
      expect(DEFAULT_CONCURRENCY_LIMITS.HIGH).toBeDefined();
      expect(DEFAULT_CONCURRENCY_LIMITS.LOW).toBeDefined();
      expect(DEFAULT_CONCURRENCY_LIMITS.MINIMAL).toBeDefined();
    });

    it('should have appropriate concurrency limits for optimal performance', () => {
      // Concurrency limits should be appropriate for their intended use
      expect(DEFAULT_CONCURRENCY_LIMITS.STANDARD).toBe(10);
      expect(DEFAULT_CONCURRENCY_LIMITS.HIGH).toBe(20);
      expect(DEFAULT_CONCURRENCY_LIMITS.LOW).toBe(5);
      expect(DEFAULT_CONCURRENCY_LIMITS.MINIMAL).toBe(2);
    });

    it('should have higher concurrency for simple processing than for complex processing', () => {
      // Simple processing should have higher concurrency than complex processing
      expect(DEFAULT_CONCURRENCY_LIMITS.HIGH).toBeGreaterThan(DEFAULT_CONCURRENCY_LIMITS.STANDARD);
      expect(DEFAULT_CONCURRENCY_LIMITS.STANDARD).toBeGreaterThan(DEFAULT_CONCURRENCY_LIMITS.LOW);
      expect(DEFAULT_CONCURRENCY_LIMITS.LOW).toBeGreaterThan(DEFAULT_CONCURRENCY_LIMITS.MINIMAL);
    });

    it('should have concurrency limits that are positive integers', () => {
      // All concurrency limits should be positive integers
      Object.values(DEFAULT_CONCURRENCY_LIMITS).forEach(limit => {
        expect(Number.isInteger(limit)).toBe(true);
        expect(limit).toBeGreaterThan(0);
      });
    });
  });

  describe('DEFAULT_TIMEOUTS_MS', () => {
    it('should define timeout values for different operation types', () => {
      // Verify timeout values for different operation types exist
      expect(DEFAULT_TIMEOUTS_MS.STANDARD).toBeDefined();
      expect(DEFAULT_TIMEOUTS_MS.EXTENDED).toBeDefined();
      expect(DEFAULT_TIMEOUTS_MS.SHORT).toBeDefined();
      expect(DEFAULT_TIMEOUTS_MS.LONG).toBeDefined();
      expect(DEFAULT_TIMEOUTS_MS.CONNECTION).toBeDefined();
      expect(DEFAULT_TIMEOUTS_MS.IDLE).toBeDefined();
    });

    it('should have appropriate timeout values in milliseconds', () => {
      // Timeout values should be appropriate for their intended use
      expect(DEFAULT_TIMEOUTS_MS.STANDARD).toBe(5000); // 5 seconds
      expect(DEFAULT_TIMEOUTS_MS.EXTENDED).toBe(15000); // 15 seconds
      expect(DEFAULT_TIMEOUTS_MS.SHORT).toBe(2000); // 2 seconds
      expect(DEFAULT_TIMEOUTS_MS.LONG).toBe(30000); // 30 seconds
      expect(DEFAULT_TIMEOUTS_MS.CONNECTION).toBe(10000); // 10 seconds
      expect(DEFAULT_TIMEOUTS_MS.IDLE).toBe(60000); // 1 minute
    });

    it('should have longer timeouts for complex operations than for simple operations', () => {
      // Complex operations should have longer timeouts than simple operations
      expect(DEFAULT_TIMEOUTS_MS.LONG).toBeGreaterThan(DEFAULT_TIMEOUTS_MS.EXTENDED);
      expect(DEFAULT_TIMEOUTS_MS.EXTENDED).toBeGreaterThan(DEFAULT_TIMEOUTS_MS.STANDARD);
      expect(DEFAULT_TIMEOUTS_MS.STANDARD).toBeGreaterThan(DEFAULT_TIMEOUTS_MS.SHORT);
    });

    it('should have timeout values that are positive integers', () => {
      // All timeout values should be positive integers
      Object.values(DEFAULT_TIMEOUTS_MS).forEach(timeout => {
        expect(Number.isInteger(timeout)).toBe(true);
        expect(timeout).toBeGreaterThan(0);
      });
    });
  });

  describe('DEFAULT_RETRY_SETTINGS', () => {
    it('should define retry settings for exponential backoff', () => {
      // Verify retry settings for exponential backoff exist
      expect(DEFAULT_RETRY_SETTINGS.MAX_ATTEMPTS).toBeDefined();
      expect(DEFAULT_RETRY_SETTINGS.INITIAL_DELAY_MS).toBeDefined();
      expect(DEFAULT_RETRY_SETTINGS.MAX_DELAY_MS).toBeDefined();
      expect(DEFAULT_RETRY_SETTINGS.BACKOFF_FACTOR).toBeDefined();
      expect(DEFAULT_RETRY_SETTINGS.JITTER_FACTOR).toBeDefined();
    });

    it('should have appropriate retry settings for reliable processing', () => {
      // Retry settings should be appropriate for reliable processing
      expect(DEFAULT_RETRY_SETTINGS.MAX_ATTEMPTS).toBe(5);
      expect(DEFAULT_RETRY_SETTINGS.INITIAL_DELAY_MS).toBe(1000); // 1 second
      expect(DEFAULT_RETRY_SETTINGS.MAX_DELAY_MS).toBe(60000); // 1 minute
      expect(DEFAULT_RETRY_SETTINGS.BACKOFF_FACTOR).toBe(2);
      expect(DEFAULT_RETRY_SETTINGS.JITTER_FACTOR).toBe(0.1);
    });

    it('should have a maximum delay that is greater than the initial delay', () => {
      // Maximum delay should be greater than initial delay
      expect(DEFAULT_RETRY_SETTINGS.MAX_DELAY_MS).toBeGreaterThan(DEFAULT_RETRY_SETTINGS.INITIAL_DELAY_MS);
    });

    it('should have a backoff factor greater than 1 for exponential growth', () => {
      // Backoff factor should be greater than 1 for exponential growth
      expect(DEFAULT_RETRY_SETTINGS.BACKOFF_FACTOR).toBeGreaterThan(1);
    });

    it('should have a jitter factor between 0 and 1', () => {
      // Jitter factor should be between 0 and 1
      expect(DEFAULT_RETRY_SETTINGS.JITTER_FACTOR).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_RETRY_SETTINGS.JITTER_FACTOR).toBeLessThanOrEqual(1);
    });

    it('should have retry settings that allow for reasonable retry behavior', () => {
      // Calculate the maximum possible delay with the given settings
      const { INITIAL_DELAY_MS, BACKOFF_FACTOR, MAX_ATTEMPTS, MAX_DELAY_MS } = DEFAULT_RETRY_SETTINGS;
      
      // Calculate the delay for the final retry attempt (without jitter)
      let finalDelay = INITIAL_DELAY_MS;
      for (let i = 1; i < MAX_ATTEMPTS; i++) {
        finalDelay = Math.min(finalDelay * BACKOFF_FACTOR, MAX_DELAY_MS);
      }
      
      // The final delay should not exceed the maximum delay
      expect(finalDelay).toBeLessThanOrEqual(MAX_DELAY_MS);
      
      // The maximum delay should be reasonable (not too long)
      expect(MAX_DELAY_MS).toBeLessThanOrEqual(5 * 60 * 1000); // 5 minutes
    });
  });

  describe('DEFAULT_CIRCUIT_BREAKER', () => {
    it('should define circuit breaker thresholds', () => {
      // Verify circuit breaker thresholds exist
      expect(DEFAULT_CIRCUIT_BREAKER.FAILURE_THRESHOLD_PERCENTAGE).toBeDefined();
      expect(DEFAULT_CIRCUIT_BREAKER.REQUEST_VOLUME_THRESHOLD).toBeDefined();
      expect(DEFAULT_CIRCUIT_BREAKER.TRACKING_PERIOD_MS).toBeDefined();
      expect(DEFAULT_CIRCUIT_BREAKER.RESET_TIMEOUT_MS).toBeDefined();
    });

    it('should have appropriate circuit breaker thresholds for preventing cascading failures', () => {
      // Circuit breaker thresholds should be appropriate for preventing cascading failures
      expect(DEFAULT_CIRCUIT_BREAKER.FAILURE_THRESHOLD_PERCENTAGE).toBe(50);
      expect(DEFAULT_CIRCUIT_BREAKER.REQUEST_VOLUME_THRESHOLD).toBe(20);
      expect(DEFAULT_CIRCUIT_BREAKER.TRACKING_PERIOD_MS).toBe(30000); // 30 seconds
      expect(DEFAULT_CIRCUIT_BREAKER.RESET_TIMEOUT_MS).toBe(60000); // 1 minute
    });

    it('should have a failure threshold percentage between 0 and 100', () => {
      // Failure threshold percentage should be between 0 and 100
      expect(DEFAULT_CIRCUIT_BREAKER.FAILURE_THRESHOLD_PERCENTAGE).toBeGreaterThan(0);
      expect(DEFAULT_CIRCUIT_BREAKER.FAILURE_THRESHOLD_PERCENTAGE).toBeLessThanOrEqual(100);
    });

    it('should have a request volume threshold that is a positive integer', () => {
      // Request volume threshold should be a positive integer
      expect(Number.isInteger(DEFAULT_CIRCUIT_BREAKER.REQUEST_VOLUME_THRESHOLD)).toBe(true);
      expect(DEFAULT_CIRCUIT_BREAKER.REQUEST_VOLUME_THRESHOLD).toBeGreaterThan(0);
    });

    it('should have tracking period and reset timeout values that are positive integers', () => {
      // Tracking period and reset timeout should be positive integers
      expect(Number.isInteger(DEFAULT_CIRCUIT_BREAKER.TRACKING_PERIOD_MS)).toBe(true);
      expect(DEFAULT_CIRCUIT_BREAKER.TRACKING_PERIOD_MS).toBeGreaterThan(0);
      
      expect(Number.isInteger(DEFAULT_CIRCUIT_BREAKER.RESET_TIMEOUT_MS)).toBe(true);
      expect(DEFAULT_CIRCUIT_BREAKER.RESET_TIMEOUT_MS).toBeGreaterThan(0);
    });

    it('should have a reset timeout that is greater than the tracking period', () => {
      // Reset timeout should be greater than tracking period
      expect(DEFAULT_CIRCUIT_BREAKER.RESET_TIMEOUT_MS).toBeGreaterThan(DEFAULT_CIRCUIT_BREAKER.TRACKING_PERIOD_MS);
    });
  });

  describe('DEFAULT_TTL_SECONDS', () => {
    it('should define TTL values for different event types', () => {
      // Verify TTL values for different event types exist
      expect(DEFAULT_TTL_SECONDS.STANDARD_EVENT).toBeDefined();
      expect(DEFAULT_TTL_SECONDS.CRITICAL_EVENT).toBeDefined();
      expect(DEFAULT_TTL_SECONDS.TRANSIENT_EVENT).toBeDefined();
      expect(DEFAULT_TTL_SECONDS.CACHED_RESULT).toBeDefined();
      expect(DEFAULT_TTL_SECONDS.USER_EVENT).toBeDefined();
      expect(DEFAULT_TTL_SECONDS.JOURNEY_EVENT).toBeDefined();
      expect(DEFAULT_TTL_SECONDS.ACHIEVEMENT_EVENT).toBeDefined();
    });

    it('should have appropriate TTL values in seconds', () => {
      // TTL values should be appropriate for their intended use
      expect(DEFAULT_TTL_SECONDS.STANDARD_EVENT).toBe(86400); // 1 day
      expect(DEFAULT_TTL_SECONDS.CRITICAL_EVENT).toBe(604800); // 7 days
      expect(DEFAULT_TTL_SECONDS.TRANSIENT_EVENT).toBe(3600); // 1 hour
      expect(DEFAULT_TTL_SECONDS.CACHED_RESULT).toBe(300); // 5 minutes
      expect(DEFAULT_TTL_SECONDS.USER_EVENT).toBe(259200); // 3 days
      expect(DEFAULT_TTL_SECONDS.JOURNEY_EVENT).toBe(172800); // 2 days
      expect(DEFAULT_TTL_SECONDS.ACHIEVEMENT_EVENT).toBe(432000); // 5 days
    });

    it('should have longer TTL for critical events than for standard events', () => {
      // Critical events should have longer TTL than standard events
      expect(DEFAULT_TTL_SECONDS.CRITICAL_EVENT).toBeGreaterThan(DEFAULT_TTL_SECONDS.STANDARD_EVENT);
      expect(DEFAULT_TTL_SECONDS.STANDARD_EVENT).toBeGreaterThan(DEFAULT_TTL_SECONDS.TRANSIENT_EVENT);
    });

    it('should have TTL values that are positive integers', () => {
      // All TTL values should be positive integers
      Object.values(DEFAULT_TTL_SECONDS).forEach(ttl => {
        expect(Number.isInteger(ttl)).toBe(true);
        expect(ttl).toBeGreaterThan(0);
      });
    });

    it('should have appropriate TTL values based on event importance', () => {
      // Achievement events should have longer TTL than standard events
      expect(DEFAULT_TTL_SECONDS.ACHIEVEMENT_EVENT).toBeGreaterThan(DEFAULT_TTL_SECONDS.STANDARD_EVENT);
      
      // Cached results should have shorter TTL than transient events
      expect(DEFAULT_TTL_SECONDS.TRANSIENT_EVENT).toBeGreaterThan(DEFAULT_TTL_SECONDS.CACHED_RESULT);
      
      // User events should have appropriate TTL for user-related data
      expect(DEFAULT_TTL_SECONDS.USER_EVENT).toBeGreaterThanOrEqual(DEFAULT_TTL_SECONDS.JOURNEY_EVENT);
    });
  });

  describe('DEFAULT_KAFKA_TOPICS', () => {
    it('should define Kafka topics for different event types', () => {
      // Verify Kafka topics for different event types exist
      expect(DEFAULT_KAFKA_TOPICS.HEALTH_EVENTS).toBeDefined();
      expect(DEFAULT_KAFKA_TOPICS.CARE_EVENTS).toBeDefined();
      expect(DEFAULT_KAFKA_TOPICS.PLAN_EVENTS).toBeDefined();
      expect(DEFAULT_KAFKA_TOPICS.USER_EVENTS).toBeDefined();
      expect(DEFAULT_KAFKA_TOPICS.GAME_EVENTS).toBeDefined();
      expect(DEFAULT_KAFKA_TOPICS.NOTIFICATION_EVENTS).toBeDefined();
      expect(DEFAULT_KAFKA_TOPICS.DEAD_LETTER_QUEUE).toBeDefined();
    });

    it('should follow the standardized topic naming pattern', () => {
      // All topics should follow the pattern: {domain}.events
      expect(DEFAULT_KAFKA_TOPICS.HEALTH_EVENTS).toBe('health.events');
      expect(DEFAULT_KAFKA_TOPICS.CARE_EVENTS).toBe('care.events');
      expect(DEFAULT_KAFKA_TOPICS.PLAN_EVENTS).toBe('plan.events');
      expect(DEFAULT_KAFKA_TOPICS.USER_EVENTS).toBe('user.events');
      expect(DEFAULT_KAFKA_TOPICS.GAME_EVENTS).toBe('game.events');
      expect(DEFAULT_KAFKA_TOPICS.NOTIFICATION_EVENTS).toBe('notification.events');
      expect(DEFAULT_KAFKA_TOPICS.DEAD_LETTER_QUEUE).toBe('events.dlq');
    });

    it('should have unique topic names for each event type', () => {
      // Each event type should have a unique topic name
      const topicValues = Object.values(DEFAULT_KAFKA_TOPICS);
      const uniqueValues = new Set(topicValues);
      expect(uniqueValues.size).toBe(topicValues.length);
    });
  });

  describe('DEFAULT_RATE_LIMITS', () => {
    it('should define rate limits for event processing', () => {
      // Verify rate limits for event processing exist
      expect(DEFAULT_RATE_LIMITS.MAX_EVENTS_PER_USER_PER_MINUTE).toBeDefined();
      expect(DEFAULT_RATE_LIMITS.MAX_EVENTS_PER_SERVICE_PER_MINUTE).toBeDefined();
      expect(DEFAULT_RATE_LIMITS.MAX_EVENT_QUEUE_SIZE).toBeDefined();
      expect(DEFAULT_RATE_LIMITS.PROCESSING_RATE_MS).toBeDefined();
    });

    it('should have appropriate rate limits for preventing abuse', () => {
      // Rate limits should be appropriate for preventing abuse
      expect(DEFAULT_RATE_LIMITS.MAX_EVENTS_PER_USER_PER_MINUTE).toBe(100);
      expect(DEFAULT_RATE_LIMITS.MAX_EVENTS_PER_SERVICE_PER_MINUTE).toBe(1000);
      expect(DEFAULT_RATE_LIMITS.MAX_EVENT_QUEUE_SIZE).toBe(10000);
      expect(DEFAULT_RATE_LIMITS.PROCESSING_RATE_MS).toBe(1000); // 1 second
    });

    it('should have service-level rate limits higher than user-level rate limits', () => {
      // Service-level rate limits should be higher than user-level rate limits
      expect(DEFAULT_RATE_LIMITS.MAX_EVENTS_PER_SERVICE_PER_MINUTE).toBeGreaterThan(
        DEFAULT_RATE_LIMITS.MAX_EVENTS_PER_USER_PER_MINUTE
      );
    });

    it('should have rate limit values that are positive integers', () => {
      // All rate limit values should be positive integers
      Object.values(DEFAULT_RATE_LIMITS).forEach(limit => {
        expect(Number.isInteger(limit)).toBe(true);
        expect(limit).toBeGreaterThan(0);
      });
    });
  });

  describe('DEFAULT_AUDIT_SETTINGS', () => {
    it('should define audit settings for event logging', () => {
      // Verify audit settings for event logging exist
      expect(DEFAULT_AUDIT_SETTINGS.ENABLE_DETAILED_AUDITING).toBeDefined();
      expect(DEFAULT_AUDIT_SETTINGS.LOG_PROCESSING_METRICS).toBeDefined();
      expect(DEFAULT_AUDIT_SETTINGS.AUDIT_SAMPLING_RATE).toBeDefined();
      expect(DEFAULT_AUDIT_SETTINGS.MAX_AUDIT_ENTRY_SIZE_BYTES).toBeDefined();
    });

    it('should have appropriate audit settings for event logging', () => {
      // Audit settings should be appropriate for event logging
      expect(DEFAULT_AUDIT_SETTINGS.ENABLE_DETAILED_AUDITING).toBe(true);
      expect(DEFAULT_AUDIT_SETTINGS.LOG_PROCESSING_METRICS).toBe(true);
      expect(DEFAULT_AUDIT_SETTINGS.AUDIT_SAMPLING_RATE).toBe(0.1); // 10%
      expect(DEFAULT_AUDIT_SETTINGS.MAX_AUDIT_ENTRY_SIZE_BYTES).toBe(10240); // 10 KB
    });

    it('should have a sampling rate between 0 and 1', () => {
      // Sampling rate should be between 0 and 1
      expect(DEFAULT_AUDIT_SETTINGS.AUDIT_SAMPLING_RATE).toBeGreaterThan(0);
      expect(DEFAULT_AUDIT_SETTINGS.AUDIT_SAMPLING_RATE).toBeLessThanOrEqual(1);
    });

    it('should have a maximum audit entry size that is a positive integer', () => {
      // Maximum audit entry size should be a positive integer
      expect(Number.isInteger(DEFAULT_AUDIT_SETTINGS.MAX_AUDIT_ENTRY_SIZE_BYTES)).toBe(true);
      expect(DEFAULT_AUDIT_SETTINGS.MAX_AUDIT_ENTRY_SIZE_BYTES).toBeGreaterThan(0);
    });
  });
});