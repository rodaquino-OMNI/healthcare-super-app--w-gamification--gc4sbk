import { Test } from '@nestjs/testing';
import { TOPICS } from '../../../src/constants/topics.constants';
import { ERROR_CODES, ERROR_MESSAGES, ERROR_SEVERITY, HTTP_STATUS_CODES } from '../../../src/constants/errors.constants';

describe('Kafka Constants', () => {
  describe('Topic Constants', () => {
    it('should define all required journey topics', () => {
      // Verify all journey namespaces exist
      expect(TOPICS.HEALTH).toBeDefined();
      expect(TOPICS.CARE).toBeDefined();
      expect(TOPICS.PLAN).toBeDefined();
      expect(TOPICS.USER).toBeDefined();
      expect(TOPICS.GAMIFICATION).toBeDefined();
      expect(TOPICS.NOTIFICATIONS).toBeDefined();
    });

    it('should define main events topic for each journey', () => {
      // Verify each journey has a main events topic
      expect(TOPICS.HEALTH.EVENTS).toBeDefined();
      expect(TOPICS.CARE.EVENTS).toBeDefined();
      expect(TOPICS.PLAN.EVENTS).toBeDefined();
      expect(TOPICS.USER.EVENTS).toBeDefined();
      expect(TOPICS.GAMIFICATION.EVENTS).toBeDefined();
      expect(TOPICS.NOTIFICATIONS.EVENTS).toBeDefined();
    });

    it('should follow consistent naming convention for topics', () => {
      // All topics should follow the pattern: journey.resource
      const topicPattern = /^[a-z]+\.[a-z]+$/;
      
      // Check health journey topics
      Object.values(TOPICS.HEALTH).forEach(topic => {
        expect(typeof topic).toBe('string');
        expect(topic).toMatch(topicPattern);
        expect(topic.startsWith('health.')).toBe(true);
      });

      // Check care journey topics
      Object.values(TOPICS.CARE).forEach(topic => {
        expect(typeof topic).toBe('string');
        expect(topic).toMatch(topicPattern);
        expect(topic.startsWith('care.')).toBe(true);
      });

      // Check plan journey topics
      Object.values(TOPICS.PLAN).forEach(topic => {
        expect(typeof topic).toBe('string');
        expect(topic).toMatch(topicPattern);
        expect(topic.startsWith('plan.')).toBe(true);
      });

      // Check user topics
      Object.values(TOPICS.USER).forEach(topic => {
        expect(typeof topic).toBe('string');
        expect(topic).toMatch(topicPattern);
        expect(topic.startsWith('user.')).toBe(true);
      });

      // Check gamification topics
      Object.values(TOPICS.GAMIFICATION).forEach(topic => {
        expect(typeof topic).toBe('string');
        expect(topic).toMatch(topicPattern);
        expect(topic.startsWith('game.')).toBe(true);
      });

      // Check notification topics
      Object.values(TOPICS.NOTIFICATIONS).forEach(topic => {
        expect(typeof topic).toBe('string');
        expect(topic).toMatch(topicPattern);
        expect(topic.startsWith('notification.')).toBe(true);
      });
    });

    it('should define specific topics for health journey', () => {
      expect(TOPICS.HEALTH.METRICS).toBeDefined();
      expect(TOPICS.HEALTH.GOALS).toBeDefined();
      expect(TOPICS.HEALTH.DEVICES).toBeDefined();
    });

    it('should define specific topics for care journey', () => {
      expect(TOPICS.CARE.APPOINTMENTS).toBeDefined();
      expect(TOPICS.CARE.MEDICATIONS).toBeDefined();
      expect(TOPICS.CARE.TELEMEDICINE).toBeDefined();
    });

    it('should define specific topics for plan journey', () => {
      expect(TOPICS.PLAN.CLAIMS).toBeDefined();
      expect(TOPICS.PLAN.BENEFITS).toBeDefined();
      expect(TOPICS.PLAN.SELECTION).toBeDefined();
    });

    it('should define specific topics for gamification', () => {
      expect(TOPICS.GAMIFICATION.ACHIEVEMENTS).toBeDefined();
      expect(TOPICS.GAMIFICATION.REWARDS).toBeDefined();
      expect(TOPICS.GAMIFICATION.LEADERBOARD).toBeDefined();
    });

    it('should define dead letter queue topic', () => {
      expect(TOPICS.DEAD_LETTER).toBeDefined();
      expect(typeof TOPICS.DEAD_LETTER).toBe('string');
      expect(TOPICS.DEAD_LETTER).toBe('dead-letter');
    });
  });

  describe('Error Constants', () => {
    it('should define all required error code categories', () => {
      // Check for initialization errors
      expect(ERROR_CODES.INITIALIZATION_FAILED).toBeDefined();
      
      // Check for producer errors
      expect(ERROR_CODES.PRODUCER_CONNECTION_FAILED).toBeDefined();
      expect(ERROR_CODES.PRODUCER_SEND_FAILED).toBeDefined();
      expect(ERROR_CODES.PRODUCER_BATCH_FAILED).toBeDefined();
      expect(ERROR_CODES.PRODUCER_TRANSACTION_FAILED).toBeDefined();
      
      // Check for consumer errors
      expect(ERROR_CODES.CONSUMER_CONNECTION_FAILED).toBeDefined();
      expect(ERROR_CODES.CONSUMER_SUBSCRIPTION_FAILED).toBeDefined();
      expect(ERROR_CODES.CONSUMER_GROUP_ERROR).toBeDefined();
      expect(ERROR_CODES.CONSUMER_PROCESSING_FAILED).toBeDefined();
      
      // Check for message errors
      expect(ERROR_CODES.MESSAGE_SERIALIZATION_FAILED).toBeDefined();
      expect(ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED).toBeDefined();
      
      // Check for schema errors
      expect(ERROR_CODES.SCHEMA_VALIDATION_FAILED).toBeDefined();
      expect(ERROR_CODES.SCHEMA_VALIDATION_ERROR).toBeDefined();
      expect(ERROR_CODES.SCHEMA_NOT_FOUND).toBeDefined();
      
      // Check for dead-letter queue errors
      expect(ERROR_CODES.DLQ_SEND_FAILED).toBeDefined();
      
      // Check for retry errors
      expect(ERROR_CODES.RETRY_EXHAUSTED).toBeDefined();
      expect(ERROR_CODES.RETRY_FAILED).toBeDefined();
    });

    it('should follow consistent naming convention for error codes', () => {
      // All error codes should follow the pattern: KAFKA_XXX
      const errorCodePattern = /^KAFKA_\d{3}$/;
      
      Object.values(ERROR_CODES).forEach(code => {
        expect(typeof code).toBe('string');
        expect(code).toMatch(errorCodePattern);
      });
    });

    it('should have error messages for all error codes', () => {
      // Each error code should have a corresponding error message
      Object.values(ERROR_CODES).forEach(code => {
        expect(ERROR_MESSAGES[code]).toBeDefined();
        expect(typeof ERROR_MESSAGES[code]).toBe('string');
        expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
      });
    });

    it('should have severity levels for all error codes', () => {
      // Each error code should have a corresponding severity level
      const validSeverityLevels = ['CRITICAL', 'ERROR', 'WARNING', 'INFO'];
      
      Object.values(ERROR_CODES).forEach(code => {
        expect(ERROR_SEVERITY[code]).toBeDefined();
        expect(typeof ERROR_SEVERITY[code]).toBe('string');
        expect(validSeverityLevels).toContain(ERROR_SEVERITY[code]);
      });
    });

    it('should have HTTP status codes for all error codes', () => {
      // Each error code should have a corresponding HTTP status code
      const validStatusCodes = [400, 401, 403, 404, 409, 422, 500, 503];
      
      Object.values(ERROR_CODES).forEach(code => {
        expect(HTTP_STATUS_CODES[code]).toBeDefined();
        expect(typeof HTTP_STATUS_CODES[code]).toBe('number');
        expect(validStatusCodes).toContain(HTTP_STATUS_CODES[code]);
      });
    });

    it('should use appropriate severity levels for different error types', () => {
      // Initialization and connection errors should be CRITICAL
      expect(ERROR_SEVERITY[ERROR_CODES.INITIALIZATION_FAILED]).toBe('CRITICAL');
      expect(ERROR_SEVERITY[ERROR_CODES.PRODUCER_CONNECTION_FAILED]).toBe('CRITICAL');
      expect(ERROR_SEVERITY[ERROR_CODES.CONSUMER_CONNECTION_FAILED]).toBe('CRITICAL');
      
      // Processing errors should be ERROR
      expect(ERROR_SEVERITY[ERROR_CODES.PRODUCER_SEND_FAILED]).toBe('ERROR');
      expect(ERROR_SEVERITY[ERROR_CODES.CONSUMER_PROCESSING_FAILED]).toBe('ERROR');
      expect(ERROR_SEVERITY[ERROR_CODES.MESSAGE_SERIALIZATION_FAILED]).toBe('ERROR');
      expect(ERROR_SEVERITY[ERROR_CODES.SCHEMA_VALIDATION_FAILED]).toBe('ERROR');
      
      // Retry and DLQ errors should be WARNING or ERROR
      expect(['WARNING', 'ERROR']).toContain(ERROR_SEVERITY[ERROR_CODES.RETRY_EXHAUSTED]);
      expect(['WARNING', 'ERROR']).toContain(ERROR_SEVERITY[ERROR_CODES.DLQ_SEND_FAILED]);
    });

    it('should use appropriate HTTP status codes for different error types', () => {
      // Connection errors should be 503 Service Unavailable
      expect(HTTP_STATUS_CODES[ERROR_CODES.PRODUCER_CONNECTION_FAILED]).toBe(503);
      expect(HTTP_STATUS_CODES[ERROR_CODES.CONSUMER_CONNECTION_FAILED]).toBe(503);
      
      // Validation errors should be 400 Bad Request
      expect(HTTP_STATUS_CODES[ERROR_CODES.SCHEMA_VALIDATION_FAILED]).toBe(400);
      expect(HTTP_STATUS_CODES[ERROR_CODES.MESSAGE_SERIALIZATION_FAILED]).toBe(400);
      expect(HTTP_STATUS_CODES[ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED]).toBe(400);
      
      // Internal errors should be 500 Internal Server Error
      expect(HTTP_STATUS_CODES[ERROR_CODES.INITIALIZATION_FAILED]).toBe(500);
      expect(HTTP_STATUS_CODES[ERROR_CODES.PRODUCER_SEND_FAILED]).toBe(500);
      expect(HTTP_STATUS_CODES[ERROR_CODES.CONSUMER_PROCESSING_FAILED]).toBe(500);
    });
  });

  describe('Cross-Journey Integration', () => {
    it('should have consistent topic naming across all journeys', () => {
      // All journeys should have an EVENTS topic
      expect(TOPICS.HEALTH.EVENTS).toBe('health.events');
      expect(TOPICS.CARE.EVENTS).toBe('care.events');
      expect(TOPICS.PLAN.EVENTS).toBe('plan.events');
      expect(TOPICS.USER.EVENTS).toBe('user.events');
      expect(TOPICS.GAMIFICATION.EVENTS).toBe('game.events');
      expect(TOPICS.NOTIFICATIONS.EVENTS).toBe('notification.events');
    });

    it('should support gamification integration with all journeys', () => {
      // Verify that gamification has specific topics for achievements and rewards
      expect(TOPICS.GAMIFICATION.ACHIEVEMENTS).toBe('game.achievements');
      expect(TOPICS.GAMIFICATION.REWARDS).toBe('game.rewards');
      expect(TOPICS.GAMIFICATION.LEADERBOARD).toBe('game.leaderboard');
    });

    it('should support notification integration with all journeys', () => {
      // Verify that notifications has specific topics for different channels
      expect(TOPICS.NOTIFICATIONS.PUSH).toBe('notification.push');
      expect(TOPICS.NOTIFICATIONS.EMAIL).toBe('notification.email');
      expect(TOPICS.NOTIFICATIONS.SMS).toBe('notification.sms');
    });
  });

  describe('Error Handling Integration', () => {
    it('should have error codes for all critical operations', () => {
      // Producer operations
      expect(ERROR_CODES.PRODUCER_CONNECTION_FAILED).toBeDefined();
      expect(ERROR_CODES.PRODUCER_SEND_FAILED).toBeDefined();
      expect(ERROR_CODES.PRODUCER_BATCH_FAILED).toBeDefined();
      expect(ERROR_CODES.PRODUCER_TRANSACTION_FAILED).toBeDefined();
      
      // Consumer operations
      expect(ERROR_CODES.CONSUMER_CONNECTION_FAILED).toBeDefined();
      expect(ERROR_CODES.CONSUMER_SUBSCRIPTION_FAILED).toBeDefined();
      expect(ERROR_CODES.CONSUMER_GROUP_ERROR).toBeDefined();
      expect(ERROR_CODES.CONSUMER_PROCESSING_FAILED).toBeDefined();
      
      // Message operations
      expect(ERROR_CODES.MESSAGE_SERIALIZATION_FAILED).toBeDefined();
      expect(ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED).toBeDefined();
      
      // Schema operations
      expect(ERROR_CODES.SCHEMA_VALIDATION_FAILED).toBeDefined();
      expect(ERROR_CODES.SCHEMA_VALIDATION_ERROR).toBeDefined();
      expect(ERROR_CODES.SCHEMA_NOT_FOUND).toBeDefined();
      
      // Retry operations
      expect(ERROR_CODES.RETRY_EXHAUSTED).toBeDefined();
      expect(ERROR_CODES.RETRY_FAILED).toBeDefined();
    });

    it('should support dead letter queue for failed messages', () => {
      // Verify that dead letter queue topic is defined
      expect(TOPICS.DEAD_LETTER).toBeDefined();
      expect(ERROR_CODES.DLQ_SEND_FAILED).toBeDefined();
    });
  });
});