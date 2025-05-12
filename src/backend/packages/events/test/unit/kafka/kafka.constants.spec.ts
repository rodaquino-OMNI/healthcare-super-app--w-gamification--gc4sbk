/**
 * @file kafka.constants.spec.ts
 * @description Unit tests for Kafka constants used across the application, including default topics,
 * consumer groups, error codes, and retry settings. These tests verify the correctness, completeness,
 * and consistency of all Kafka-related constants.
 */

import {
  KafkaErrorCode,
  KafkaDefaultTopics,
  KafkaDefaultConsumerGroups,
  KafkaHeaderNames,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_DLQ_CONFIG,
  DEFAULT_CONSUMER_CONFIG,
  DEFAULT_PRODUCER_CONFIG
} from '../../../src/kafka/kafka.constants';
import { EventJourney } from '../../../src/kafka/kafka.types';

describe('Kafka Constants', () => {
  describe('KafkaErrorCode', () => {
    it('should define all required error codes', () => {
      // Connection errors
      expect(KafkaErrorCode.CONNECTION_ERROR).toBeDefined();
      expect(KafkaErrorCode.PRODUCER_CONNECTION_ERROR).toBeDefined();
      expect(KafkaErrorCode.CONSUMER_CONNECTION_ERROR).toBeDefined();
      expect(KafkaErrorCode.INITIALIZATION_ERROR).toBeDefined();
      
      // Producer errors
      expect(KafkaErrorCode.PRODUCER_ERROR).toBeDefined();
      expect(KafkaErrorCode.TOPIC_CREATION_ERROR).toBeDefined();
      expect(KafkaErrorCode.MESSAGE_DELIVERY_ERROR).toBeDefined();
      expect(KafkaErrorCode.BATCH_OPERATION_ERROR).toBeDefined();
      
      // Consumer errors
      expect(KafkaErrorCode.CONSUMER_ERROR).toBeDefined();
      expect(KafkaErrorCode.SUBSCRIPTION_ERROR).toBeDefined();
      expect(KafkaErrorCode.OFFSET_COMMIT_ERROR).toBeDefined();
      expect(KafkaErrorCode.GROUP_JOIN_ERROR).toBeDefined();
      
      // Serialization errors
      expect(KafkaErrorCode.SERIALIZATION_ERROR).toBeDefined();
      expect(KafkaErrorCode.DESERIALIZATION_ERROR).toBeDefined();
      
      // Validation errors
      expect(KafkaErrorCode.VALIDATION_ERROR).toBeDefined();
      expect(KafkaErrorCode.SCHEMA_VALIDATION_ERROR).toBeDefined();
      
      // Dead letter queue errors
      expect(KafkaErrorCode.DLQ_ERROR).toBeDefined();
      expect(KafkaErrorCode.RETRY_ERROR).toBeDefined();
      
      // Other errors
      expect(KafkaErrorCode.UNKNOWN_ERROR).toBeDefined();
    });

    it('should follow the correct error code format', () => {
      // All error codes should follow the format KAFKA_XXX where XXX is a numeric code
      const errorCodeRegex = /^KAFKA_\d{3}$/;
      
      Object.values(KafkaErrorCode).forEach(code => {
        expect(code).toMatch(errorCodeRegex);
      });
    });

    it('should have unique error codes', () => {
      const errorCodes = Object.values(KafkaErrorCode);
      const uniqueErrorCodes = new Set(errorCodes);
      
      expect(errorCodes.length).toBe(uniqueErrorCodes.size);
    });

    it('should group error codes by category', () => {
      // Connection errors should start with 0
      expect(KafkaErrorCode.CONNECTION_ERROR).toMatch(/^KAFKA_0/);
      expect(KafkaErrorCode.PRODUCER_CONNECTION_ERROR).toMatch(/^KAFKA_0/);
      expect(KafkaErrorCode.CONSUMER_CONNECTION_ERROR).toMatch(/^KAFKA_0/);
      
      // Producer errors should start with 1
      expect(KafkaErrorCode.PRODUCER_ERROR).toMatch(/^KAFKA_1/);
      expect(KafkaErrorCode.MESSAGE_DELIVERY_ERROR).toMatch(/^KAFKA_1/);
      
      // Consumer errors should start with 2
      expect(KafkaErrorCode.CONSUMER_ERROR).toMatch(/^KAFKA_2/);
      expect(KafkaErrorCode.SUBSCRIPTION_ERROR).toMatch(/^KAFKA_2/);
      
      // Serialization errors should start with 3
      expect(KafkaErrorCode.SERIALIZATION_ERROR).toMatch(/^KAFKA_3/);
      expect(KafkaErrorCode.DESERIALIZATION_ERROR).toMatch(/^KAFKA_3/);
      
      // Validation errors should start with 4
      expect(KafkaErrorCode.VALIDATION_ERROR).toMatch(/^KAFKA_4/);
      expect(KafkaErrorCode.SCHEMA_VALIDATION_ERROR).toMatch(/^KAFKA_4/);
      
      // DLQ errors should start with 5
      expect(KafkaErrorCode.DLQ_ERROR).toMatch(/^KAFKA_5/);
      expect(KafkaErrorCode.RETRY_ERROR).toMatch(/^KAFKA_5/);
      
      // Unknown errors should start with 9
      expect(KafkaErrorCode.UNKNOWN_ERROR).toMatch(/^KAFKA_9/);
    });
  });

  describe('KafkaDefaultTopics', () => {
    it('should define all required topic suffixes', () => {
      expect(KafkaDefaultTopics.DEAD_LETTER_QUEUE_SUFFIX).toBeDefined();
      expect(KafkaDefaultTopics.RETRY_TOPIC_SUFFIX).toBeDefined();
      expect(KafkaDefaultTopics.ERROR_TOPIC_SUFFIX).toBeDefined();
    });

    it('should have the correct suffix format', () => {
      // All suffixes should start with a dot
      expect(KafkaDefaultTopics.DEAD_LETTER_QUEUE_SUFFIX).toMatch(/^\./); 
      expect(KafkaDefaultTopics.RETRY_TOPIC_SUFFIX).toMatch(/^\./); 
      expect(KafkaDefaultTopics.ERROR_TOPIC_SUFFIX).toMatch(/^\./); 
    });

    it('should have unique suffixes', () => {
      const suffixes = Object.values(KafkaDefaultTopics);
      const uniqueSuffixes = new Set(suffixes);
      
      expect(suffixes.length).toBe(uniqueSuffixes.size);
    });

    it('should generate valid topic names when combined with journey topics', () => {
      // Test with each journey type
      const journeys = Object.values(EventJourney);
      
      journeys.forEach(journey => {
        const baseTopic = `${journey.toLowerCase()}.events`;
        
        // DLQ topic
        const dlqTopic = `${baseTopic}${KafkaDefaultTopics.DEAD_LETTER_QUEUE_SUFFIX}`;
        expect(dlqTopic).toMatch(/^[a-z]+\.events\.dlq$/);
        
        // Retry topic
        const retryTopic = `${baseTopic}${KafkaDefaultTopics.RETRY_TOPIC_SUFFIX}`;
        expect(retryTopic).toMatch(/^[a-z]+\.events\.retry$/);
        
        // Error topic
        const errorTopic = `${baseTopic}${KafkaDefaultTopics.ERROR_TOPIC_SUFFIX}`;
        expect(errorTopic).toMatch(/^[a-z]+\.events\.error$/);
      });
    });
  });

  describe('KafkaDefaultConsumerGroups', () => {
    it('should define all required consumer group suffixes', () => {
      expect(KafkaDefaultConsumerGroups.RETRY_SUFFIX).toBeDefined();
      expect(KafkaDefaultConsumerGroups.DLQ_SUFFIX).toBeDefined();
      expect(KafkaDefaultConsumerGroups.ERROR_SUFFIX).toBeDefined();
    });

    it('should have the correct suffix format', () => {
      // All suffixes should start with a hyphen
      expect(KafkaDefaultConsumerGroups.RETRY_SUFFIX).toMatch(/^-/); 
      expect(KafkaDefaultConsumerGroups.DLQ_SUFFIX).toMatch(/^-/); 
      expect(KafkaDefaultConsumerGroups.ERROR_SUFFIX).toMatch(/^-/); 
    });

    it('should have unique suffixes', () => {
      const suffixes = Object.values(KafkaDefaultConsumerGroups);
      const uniqueSuffixes = new Set(suffixes);
      
      expect(suffixes.length).toBe(uniqueSuffixes.size);
    });

    it('should generate valid consumer group names when combined with journey consumer groups', () => {
      // Test with each journey type
      const journeys = Object.values(EventJourney);
      
      journeys.forEach(journey => {
        const baseGroup = `${journey.toLowerCase()}-consumer`;
        
        // Retry consumer group
        const retryGroup = `${baseGroup}${KafkaDefaultConsumerGroups.RETRY_SUFFIX}`;
        expect(retryGroup).toMatch(/^[a-z]+-consumer-retry$/);
        
        // DLQ consumer group
        const dlqGroup = `${baseGroup}${KafkaDefaultConsumerGroups.DLQ_SUFFIX}`;
        expect(dlqGroup).toMatch(/^[a-z]+-consumer-dlq$/);
        
        // Error consumer group
        const errorGroup = `${baseGroup}${KafkaDefaultConsumerGroups.ERROR_SUFFIX}`;
        expect(errorGroup).toMatch(/^[a-z]+-consumer-error$/);
      });
    });
  });

  describe('KafkaHeaderNames', () => {
    it('should define all required header names', () => {
      expect(KafkaHeaderNames.RETRY_COUNT).toBeDefined();
      expect(KafkaHeaderNames.ORIGINAL_TOPIC).toBeDefined();
      expect(KafkaHeaderNames.ERROR_TYPE).toBeDefined();
      expect(KafkaHeaderNames.TIMESTAMP).toBeDefined();
      expect(KafkaHeaderNames.SERVICE_NAME).toBeDefined();
      expect(KafkaHeaderNames.CORRELATION_ID).toBeDefined();
      expect(KafkaHeaderNames.TRACE_ID).toBeDefined();
      expect(KafkaHeaderNames.SPAN_ID).toBeDefined();
    });

    it('should follow the correct header name format', () => {
      // All header names should follow the format x-name-name
      const headerNameRegex = /^x-[a-z-]+$/;
      
      Object.values(KafkaHeaderNames).forEach(name => {
        expect(name).toMatch(headerNameRegex);
      });
    });

    it('should have unique header names', () => {
      const headerNames = Object.values(KafkaHeaderNames);
      const uniqueHeaderNames = new Set(headerNames);
      
      expect(headerNames.length).toBe(uniqueHeaderNames.size);
    });

    it('should include all required tracing headers', () => {
      // Verify that all required tracing headers are present
      expect(KafkaHeaderNames.CORRELATION_ID).toBeDefined();
      expect(KafkaHeaderNames.TRACE_ID).toBeDefined();
      expect(KafkaHeaderNames.SPAN_ID).toBeDefined();
    });
  });

  describe('DEFAULT_RETRY_CONFIG', () => {
    it('should define all required retry configuration properties', () => {
      expect(DEFAULT_RETRY_CONFIG.initialRetryTime).toBeDefined();
      expect(DEFAULT_RETRY_CONFIG.retries).toBeDefined();
      expect(DEFAULT_RETRY_CONFIG.factor).toBeDefined();
      expect(DEFAULT_RETRY_CONFIG.maxRetryTime).toBeDefined();
      expect(DEFAULT_RETRY_CONFIG.multiplier).toBeDefined();
    });

    it('should have valid retry configuration values', () => {
      // Initial retry time should be positive
      expect(DEFAULT_RETRY_CONFIG.initialRetryTime).toBeGreaterThan(0);
      
      // Number of retries should be positive
      expect(DEFAULT_RETRY_CONFIG.retries).toBeGreaterThan(0);
      
      // Factor should be greater than 1 for exponential backoff
      expect(DEFAULT_RETRY_CONFIG.factor).toBeGreaterThanOrEqual(1);
      
      // Max retry time should be greater than initial retry time
      expect(DEFAULT_RETRY_CONFIG.maxRetryTime).toBeGreaterThan(DEFAULT_RETRY_CONFIG.initialRetryTime);
      
      // Multiplier should be positive
      expect(DEFAULT_RETRY_CONFIG.multiplier).toBeGreaterThan(0);
    });

    it('should have reasonable retry limits', () => {
      // Initial retry time should not be too small (avoid immediate retries)
      expect(DEFAULT_RETRY_CONFIG.initialRetryTime).toBeGreaterThanOrEqual(100);
      
      // Number of retries should not be excessive
      expect(DEFAULT_RETRY_CONFIG.retries).toBeLessThanOrEqual(20);
      
      // Max retry time should not be excessive (avoid very long delays)
      expect(DEFAULT_RETRY_CONFIG.maxRetryTime).toBeLessThanOrEqual(60000); // 1 minute
    });

    it('should calculate reasonable backoff times', () => {
      // Calculate the backoff time for each retry
      const backoffTimes: number[] = [];
      let currentBackoff = DEFAULT_RETRY_CONFIG.initialRetryTime;
      
      for (let i = 0; i < DEFAULT_RETRY_CONFIG.retries; i++) {
        backoffTimes.push(currentBackoff);
        currentBackoff = Math.min(
          currentBackoff * DEFAULT_RETRY_CONFIG.factor * DEFAULT_RETRY_CONFIG.multiplier,
          DEFAULT_RETRY_CONFIG.maxRetryTime
        );
      }
      
      // First retry should be the initial retry time
      expect(backoffTimes[0]).toBe(DEFAULT_RETRY_CONFIG.initialRetryTime);
      
      // Last retry should not exceed max retry time
      expect(backoffTimes[backoffTimes.length - 1]).toBeLessThanOrEqual(DEFAULT_RETRY_CONFIG.maxRetryTime);
      
      // Backoff times should increase
      for (let i = 1; i < backoffTimes.length; i++) {
        expect(backoffTimes[i]).toBeGreaterThan(backoffTimes[i - 1]);
      }
    });
  });

  describe('DEFAULT_DLQ_CONFIG', () => {
    it('should define all required DLQ configuration properties', () => {
      expect(DEFAULT_DLQ_CONFIG.enabled).toBeDefined();
      expect(DEFAULT_DLQ_CONFIG.retryEnabled).toBeDefined();
      expect(DEFAULT_DLQ_CONFIG.maxRetries).toBeDefined();
      expect(DEFAULT_DLQ_CONFIG.baseBackoffMs).toBeDefined();
      expect(DEFAULT_DLQ_CONFIG.maxBackoffMs).toBeDefined();
    });

    it('should have valid DLQ configuration values', () => {
      // DLQ should be enabled by default
      expect(DEFAULT_DLQ_CONFIG.enabled).toBe(true);
      
      // Retry should be enabled by default
      expect(DEFAULT_DLQ_CONFIG.retryEnabled).toBe(true);
      
      // Max retries should be positive
      expect(DEFAULT_DLQ_CONFIG.maxRetries).toBeGreaterThan(0);
      
      // Base backoff should be positive
      expect(DEFAULT_DLQ_CONFIG.baseBackoffMs).toBeGreaterThan(0);
      
      // Max backoff should be greater than base backoff
      expect(DEFAULT_DLQ_CONFIG.maxBackoffMs).toBeGreaterThan(DEFAULT_DLQ_CONFIG.baseBackoffMs);
    });

    it('should have reasonable DLQ retry limits', () => {
      // Max retries should not be excessive
      expect(DEFAULT_DLQ_CONFIG.maxRetries).toBeLessThanOrEqual(10);
      
      // Base backoff should not be too small
      expect(DEFAULT_DLQ_CONFIG.baseBackoffMs).toBeGreaterThanOrEqual(500);
      
      // Max backoff should not be excessive
      expect(DEFAULT_DLQ_CONFIG.maxBackoffMs).toBeLessThanOrEqual(60000); // 1 minute
    });
  });

  describe('DEFAULT_CONSUMER_CONFIG', () => {
    it('should define all required consumer configuration properties', () => {
      expect(DEFAULT_CONSUMER_CONFIG.sessionTimeout).toBeDefined();
      expect(DEFAULT_CONSUMER_CONFIG.heartbeatInterval).toBeDefined();
      expect(DEFAULT_CONSUMER_CONFIG.maxWaitTimeInMs).toBeDefined();
      expect(DEFAULT_CONSUMER_CONFIG.maxBytes).toBeDefined();
      expect(DEFAULT_CONSUMER_CONFIG.fromBeginning).toBeDefined();
    });

    it('should have valid consumer configuration values', () => {
      // Session timeout should be positive
      expect(DEFAULT_CONSUMER_CONFIG.sessionTimeout).toBeGreaterThan(0);
      
      // Heartbeat interval should be positive
      expect(DEFAULT_CONSUMER_CONFIG.heartbeatInterval).toBeGreaterThan(0);
      
      // Max wait time should be positive
      expect(DEFAULT_CONSUMER_CONFIG.maxWaitTimeInMs).toBeGreaterThan(0);
      
      // Max bytes should be positive
      expect(DEFAULT_CONSUMER_CONFIG.maxBytes).toBeGreaterThan(0);
      
      // From beginning should be a boolean
      expect(typeof DEFAULT_CONSUMER_CONFIG.fromBeginning).toBe('boolean');
    });

    it('should have reasonable consumer configuration values', () => {
      // Session timeout should be greater than heartbeat interval
      expect(DEFAULT_CONSUMER_CONFIG.sessionTimeout).toBeGreaterThan(DEFAULT_CONSUMER_CONFIG.heartbeatInterval);
      
      // Heartbeat interval should be at least 1/3 of session timeout
      expect(DEFAULT_CONSUMER_CONFIG.heartbeatInterval).toBeGreaterThanOrEqual(
        DEFAULT_CONSUMER_CONFIG.sessionTimeout / 3
      );
      
      // Max wait time should not be too large
      expect(DEFAULT_CONSUMER_CONFIG.maxWaitTimeInMs).toBeLessThanOrEqual(5000); // 5 seconds
      
      // Max bytes should not be too small
      expect(DEFAULT_CONSUMER_CONFIG.maxBytes).toBeGreaterThanOrEqual(1024); // 1KB
    });
  });

  describe('DEFAULT_PRODUCER_CONFIG', () => {
    it('should define all required producer configuration properties', () => {
      expect(DEFAULT_PRODUCER_CONFIG.allowAutoTopicCreation).toBeDefined();
      expect(DEFAULT_PRODUCER_CONFIG.idempotent).toBeDefined();
      expect(DEFAULT_PRODUCER_CONFIG.maxInFlightRequests).toBeDefined();
      expect(DEFAULT_PRODUCER_CONFIG.acks).toBeDefined();
    });

    it('should have valid producer configuration values', () => {
      // Allow auto topic creation should be a boolean
      expect(typeof DEFAULT_PRODUCER_CONFIG.allowAutoTopicCreation).toBe('boolean');
      
      // Idempotent should be a boolean
      expect(typeof DEFAULT_PRODUCER_CONFIG.idempotent).toBe('boolean');
      
      // Max in flight requests should be positive
      expect(DEFAULT_PRODUCER_CONFIG.maxInFlightRequests).toBeGreaterThan(0);
      
      // Acks should be -1, 0, or 1
      expect([-1, 0, 1]).toContain(DEFAULT_PRODUCER_CONFIG.acks);
    });

    it('should have reasonable producer configuration values', () => {
      // Idempotent should be enabled for reliable delivery
      expect(DEFAULT_PRODUCER_CONFIG.idempotent).toBe(true);
      
      // Acks should be -1 for maximum reliability
      expect(DEFAULT_PRODUCER_CONFIG.acks).toBe(-1);
      
      // Max in flight requests should not be too large
      expect(DEFAULT_PRODUCER_CONFIG.maxInFlightRequests).toBeLessThanOrEqual(10);
    });
  });

  describe('Journey-Specific Constants Validation', () => {
    it('should support all journey types in EventJourney enum', () => {
      // Verify that all required journey types are defined
      expect(EventJourney.HEALTH).toBeDefined();
      expect(EventJourney.CARE).toBeDefined();
      expect(EventJourney.PLAN).toBeDefined();
      expect(EventJourney.GAMIFICATION).toBeDefined();
      expect(EventJourney.SYSTEM).toBeDefined();
    });

    it('should generate valid topic names for all journey types', () => {
      const journeys = Object.values(EventJourney);
      
      journeys.forEach(journey => {
        const baseTopic = `${journey.toLowerCase()}.events`;
        
        // Topic name should be lowercase and contain the journey name
        expect(baseTopic).toMatch(/^[a-z]+\.events$/);
        
        // DLQ topic
        const dlqTopic = `${baseTopic}${KafkaDefaultTopics.DEAD_LETTER_QUEUE_SUFFIX}`;
        expect(dlqTopic).toMatch(/^[a-z]+\.events\.dlq$/);
      });
    });

    it('should generate valid consumer group names for all journey types', () => {
      const journeys = Object.values(EventJourney);
      
      journeys.forEach(journey => {
        const baseGroup = `${journey.toLowerCase()}-consumer`;
        
        // Consumer group name should be lowercase and contain the journey name
        expect(baseGroup).toMatch(/^[a-z]+-consumer$/);
        
        // Retry consumer group
        const retryGroup = `${baseGroup}${KafkaDefaultConsumerGroups.RETRY_SUFFIX}`;
        expect(retryGroup).toMatch(/^[a-z]+-consumer-retry$/);
      });
    });
  });

  describe('Cross-Service Constant Consistency', () => {
    it('should have consistent error code prefixes', () => {
      // All error codes should start with KAFKA_
      Object.values(KafkaErrorCode).forEach(code => {
        expect(code).toMatch(/^KAFKA_/);
      });
    });

    it('should have consistent topic suffix format', () => {
      // All topic suffixes should start with a dot
      Object.values(KafkaDefaultTopics).forEach(suffix => {
        expect(suffix).toMatch(/^\./); 
      });
    });

    it('should have consistent consumer group suffix format', () => {
      // All consumer group suffixes should start with a hyphen
      Object.values(KafkaDefaultConsumerGroups).forEach(suffix => {
        expect(suffix).toMatch(/^-/); 
      });
    });

    it('should have consistent header name format', () => {
      // All header names should start with x-
      Object.values(KafkaHeaderNames).forEach(name => {
        expect(name).toMatch(/^x-/); 
      });
    });

    it('should have compatible retry and DLQ configurations', () => {
      // DLQ max retries should not exceed retry config retries
      expect(DEFAULT_DLQ_CONFIG.maxRetries).toBeLessThanOrEqual(DEFAULT_RETRY_CONFIG.retries);
      
      // DLQ base backoff should be compatible with retry initial time
      expect(DEFAULT_DLQ_CONFIG.baseBackoffMs).toBeGreaterThanOrEqual(DEFAULT_RETRY_CONFIG.initialRetryTime);
      
      // DLQ max backoff should be compatible with retry max time
      expect(DEFAULT_DLQ_CONFIG.maxBackoffMs).toBeLessThanOrEqual(DEFAULT_RETRY_CONFIG.maxRetryTime * 2);
    });
  });
});