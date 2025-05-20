import * as constants from '../../../src/constants';
import * as configConstants from '../../../src/constants/config.constants';
import * as errorConstants from '../../../src/constants/errors.constants';
import * as topicConstants from '../../../src/constants/topics.constants';

describe('Constants Barrel Exports', () => {
  describe('Config Constants', () => {
    it('should export all config constants', () => {
      // Check that all config constants are exported from the barrel
      Object.keys(configConstants).forEach(key => {
        expect(constants).toHaveProperty(key);
        expect(constants[key]).toBe(configConstants[key]);
      });
    });

    it('should export CONSUMER_GROUP_PREFIX', () => {
      expect(constants.CONSUMER_GROUP_PREFIX).toBeDefined();
      expect(typeof constants.CONSUMER_GROUP_PREFIX).toBe('string');
      expect(constants.CONSUMER_GROUP_PREFIX).toBe('austa-');
    });

    it('should export CONSUMER_GROUPS with all service groups', () => {
      expect(constants.CONSUMER_GROUPS).toBeDefined();
      expect(constants.CONSUMER_GROUPS.HEALTH_SERVICE).toBe('austa-health-service');
      expect(constants.CONSUMER_GROUPS.CARE_SERVICE).toBe('austa-care-service');
      expect(constants.CONSUMER_GROUPS.PLAN_SERVICE).toBe('austa-plan-service');
      expect(constants.CONSUMER_GROUPS.GAMIFICATION_ENGINE).toBe('austa-gamification-engine');
      expect(constants.CONSUMER_GROUPS.NOTIFICATION_SERVICE).toBe('austa-notification-service');
    });

    it('should export batch size constants', () => {
      expect(constants.DEFAULT_BATCH_SIZE).toBeDefined();
      expect(constants.DEFAULT_MIN_BATCH_SIZE).toBeDefined();
      expect(constants.DEFAULT_MAX_BATCH_SIZE).toBeDefined();
      expect(constants.DEFAULT_BATCH_SIZE).toBe(500);
      expect(constants.DEFAULT_MIN_BATCH_SIZE).toBe(10);
      expect(constants.DEFAULT_MAX_BATCH_SIZE).toBe(5000);
    });

    it('should export retry-related constants', () => {
      expect(constants.DEFAULT_RETRY_ATTEMPTS).toBeDefined();
      expect(constants.DEFAULT_RETRY_DELAY).toBeDefined();
      expect(constants.DEFAULT_MAX_RETRY_DELAY).toBeDefined();
      expect(constants.DEFAULT_RETRY_JITTER).toBeDefined();
      expect(constants.DEFAULT_RETRY_ATTEMPTS).toBe(5);
      expect(constants.DEFAULT_RETRY_DELAY).toBe(1000);
      expect(constants.DEFAULT_MAX_RETRY_DELAY).toBe(30000);
      expect(constants.DEFAULT_RETRY_JITTER).toBe(0.2);
    });

    it('should export circuit breaker constants', () => {
      expect(constants.DEFAULT_CIRCUIT_BREAKER_THRESHOLD).toBeDefined();
      expect(constants.DEFAULT_CIRCUIT_BREAKER_RESET_TIMEOUT).toBeDefined();
      expect(constants.DEFAULT_CIRCUIT_BREAKER_THRESHOLD).toBe(5);
      expect(constants.DEFAULT_CIRCUIT_BREAKER_RESET_TIMEOUT).toBe(30000);
    });

    it('should export TTL constants for different priority levels', () => {
      expect(constants.DEFAULT_TTL_HIGH_PRIORITY).toBeDefined();
      expect(constants.DEFAULT_TTL_MEDIUM_PRIORITY).toBeDefined();
      expect(constants.DEFAULT_TTL_LOW_PRIORITY).toBeDefined();
      expect(constants.DEFAULT_TTL_HIGH_PRIORITY).toBe(180000);
      expect(constants.DEFAULT_TTL_MEDIUM_PRIORITY).toBe(1800000);
      expect(constants.DEFAULT_TTL_LOW_PRIORITY).toBe(43200000);
    });
  });

  describe('Error Constants', () => {
    it('should export all error constants', () => {
      // Check that all error constants are exported from the barrel
      Object.keys(errorConstants).forEach(key => {
        expect(constants).toHaveProperty(key);
        expect(constants[key]).toBe(errorConstants[key]);
      });
    });

    it('should export ERROR_CODES with all error categories', () => {
      expect(constants.ERROR_CODES).toBeDefined();
      
      // Initialization errors
      expect(constants.ERROR_CODES.INITIALIZATION_FAILED).toBe('KAFKA_001');
      
      // Producer errors
      expect(constants.ERROR_CODES.PRODUCER_CONNECTION_FAILED).toBe('KAFKA_101');
      expect(constants.ERROR_CODES.PRODUCER_SEND_FAILED).toBe('KAFKA_102');
      expect(constants.ERROR_CODES.PRODUCER_BATCH_FAILED).toBe('KAFKA_103');
      expect(constants.ERROR_CODES.PRODUCER_TRANSACTION_FAILED).toBe('KAFKA_104');
      
      // Consumer errors
      expect(constants.ERROR_CODES.CONSUMER_CONNECTION_FAILED).toBe('KAFKA_201');
      expect(constants.ERROR_CODES.CONSUMER_SUBSCRIPTION_FAILED).toBe('KAFKA_202');
      expect(constants.ERROR_CODES.CONSUMER_GROUP_ERROR).toBe('KAFKA_203');
      expect(constants.ERROR_CODES.CONSUMER_PROCESSING_FAILED).toBe('KAFKA_204');
      
      // Message errors
      expect(constants.ERROR_CODES.MESSAGE_SERIALIZATION_FAILED).toBe('KAFKA_301');
      expect(constants.ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED).toBe('KAFKA_302');
      
      // Schema errors
      expect(constants.ERROR_CODES.SCHEMA_VALIDATION_FAILED).toBe('KAFKA_401');
      expect(constants.ERROR_CODES.SCHEMA_VALIDATION_ERROR).toBe('KAFKA_402');
      expect(constants.ERROR_CODES.SCHEMA_NOT_FOUND).toBe('KAFKA_403');
      
      // Dead-letter queue errors
      expect(constants.ERROR_CODES.DLQ_SEND_FAILED).toBe('KAFKA_501');
      
      // Retry errors
      expect(constants.ERROR_CODES.RETRY_EXHAUSTED).toBe('KAFKA_601');
      expect(constants.ERROR_CODES.RETRY_FAILED).toBe('KAFKA_602');
    });

    it('should export ERROR_MESSAGES with corresponding messages for all error codes', () => {
      expect(constants.ERROR_MESSAGES).toBeDefined();
      
      // Check that all error codes have corresponding messages
      Object.keys(constants.ERROR_CODES).forEach(codeKey => {
        const code = constants.ERROR_CODES[codeKey];
        expect(constants.ERROR_MESSAGES[code]).toBeDefined();
        expect(typeof constants.ERROR_MESSAGES[code]).toBe('string');
      });
    });

    it('should export ERROR_SEVERITY with severity levels for all error codes', () => {
      expect(constants.ERROR_SEVERITY).toBeDefined();
      
      // Check that all error codes have corresponding severity levels
      Object.keys(constants.ERROR_CODES).forEach(codeKey => {
        const code = constants.ERROR_CODES[codeKey];
        expect(constants.ERROR_SEVERITY[code]).toBeDefined();
        expect(['CRITICAL', 'ERROR', 'WARNING', 'INFO']).toContain(constants.ERROR_SEVERITY[code]);
      });
    });

    it('should export HTTP_STATUS_CODES with status codes for all error codes', () => {
      expect(constants.HTTP_STATUS_CODES).toBeDefined();
      
      // Check that all error codes have corresponding HTTP status codes
      Object.keys(constants.ERROR_CODES).forEach(codeKey => {
        const code = constants.ERROR_CODES[codeKey];
        expect(constants.HTTP_STATUS_CODES[code]).toBeDefined();
        expect(typeof constants.HTTP_STATUS_CODES[code]).toBe('number');
        expect(constants.HTTP_STATUS_CODES[code]).toBeGreaterThanOrEqual(400);
        expect(constants.HTTP_STATUS_CODES[code]).toBeLessThanOrEqual(599);
      });
    });
  });

  describe('Topic Constants', () => {
    it('should export all topic constants', () => {
      // Check that all topic constants are exported from the barrel
      Object.keys(topicConstants).forEach(key => {
        expect(constants).toHaveProperty(key);
        expect(constants[key]).toBe(topicConstants[key]);
      });
    });

    it('should export TOPICS with all journey namespaces', () => {
      expect(constants.TOPICS).toBeDefined();
      expect(constants.TOPICS.HEALTH).toBeDefined();
      expect(constants.TOPICS.CARE).toBeDefined();
      expect(constants.TOPICS.PLAN).toBeDefined();
      expect(constants.TOPICS.USER).toBeDefined();
      expect(constants.TOPICS.GAMIFICATION).toBeDefined();
      expect(constants.TOPICS.NOTIFICATIONS).toBeDefined();
      expect(constants.TOPICS.DEAD_LETTER).toBeDefined();
    });

    it('should export health journey topics', () => {
      expect(constants.TOPICS.HEALTH.EVENTS).toBe('health.events');
      expect(constants.TOPICS.HEALTH.METRICS).toBe('health.metrics');
      expect(constants.TOPICS.HEALTH.GOALS).toBe('health.goals');
      expect(constants.TOPICS.HEALTH.DEVICES).toBe('health.devices');
    });

    it('should export care journey topics', () => {
      expect(constants.TOPICS.CARE.EVENTS).toBe('care.events');
      expect(constants.TOPICS.CARE.APPOINTMENTS).toBe('care.appointments');
      expect(constants.TOPICS.CARE.MEDICATIONS).toBe('care.medications');
      expect(constants.TOPICS.CARE.TELEMEDICINE).toBe('care.telemedicine');
    });

    it('should export plan journey topics', () => {
      expect(constants.TOPICS.PLAN.EVENTS).toBe('plan.events');
      expect(constants.TOPICS.PLAN.CLAIMS).toBe('plan.claims');
      expect(constants.TOPICS.PLAN.BENEFITS).toBe('plan.benefits');
      expect(constants.TOPICS.PLAN.SELECTION).toBe('plan.selection');
    });

    it('should export user topics', () => {
      expect(constants.TOPICS.USER.EVENTS).toBe('user.events');
      expect(constants.TOPICS.USER.PROFILE).toBe('user.profile');
      expect(constants.TOPICS.USER.PREFERENCES).toBe('user.preferences');
    });

    it('should export gamification topics', () => {
      expect(constants.TOPICS.GAMIFICATION.EVENTS).toBe('game.events');
      expect(constants.TOPICS.GAMIFICATION.ACHIEVEMENTS).toBe('game.achievements');
      expect(constants.TOPICS.GAMIFICATION.REWARDS).toBe('game.rewards');
      expect(constants.TOPICS.GAMIFICATION.LEADERBOARD).toBe('game.leaderboard');
    });

    it('should export notification topics', () => {
      expect(constants.TOPICS.NOTIFICATIONS.EVENTS).toBe('notification.events');
      expect(constants.TOPICS.NOTIFICATIONS.PUSH).toBe('notification.push');
      expect(constants.TOPICS.NOTIFICATIONS.EMAIL).toBe('notification.email');
      expect(constants.TOPICS.NOTIFICATIONS.SMS).toBe('notification.sms');
    });

    it('should export dead letter queue topic', () => {
      expect(constants.TOPICS.DEAD_LETTER).toBe('dead-letter');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility for critical constants', () => {
      // Config constants
      expect(constants.CONSUMER_GROUP_PREFIX).toBeDefined();
      expect(constants.CONSUMER_GROUPS).toBeDefined();
      expect(constants.DEFAULT_RETRY_ATTEMPTS).toBeDefined();
      
      // Error constants
      expect(constants.ERROR_CODES).toBeDefined();
      expect(constants.ERROR_MESSAGES).toBeDefined();
      
      // Topic constants
      expect(constants.TOPICS).toBeDefined();
      expect(constants.TOPICS.HEALTH).toBeDefined();
      expect(constants.TOPICS.CARE).toBeDefined();
      expect(constants.TOPICS.PLAN).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should maintain correct types for all constants', () => {
      // Config constants types
      expect(typeof constants.CONSUMER_GROUP_PREFIX).toBe('string');
      expect(typeof constants.CONSUMER_GROUPS).toBe('object');
      expect(typeof constants.DEFAULT_BATCH_SIZE).toBe('number');
      expect(typeof constants.DEFAULT_RETRY_ATTEMPTS).toBe('number');
      
      // Error constants types
      expect(typeof constants.ERROR_CODES).toBe('object');
      expect(typeof constants.ERROR_MESSAGES).toBe('object');
      expect(typeof constants.ERROR_SEVERITY).toBe('object');
      expect(typeof constants.HTTP_STATUS_CODES).toBe('object');
      
      // Topic constants types
      expect(typeof constants.TOPICS).toBe('object');
      expect(typeof constants.TOPICS.HEALTH).toBe('object');
      expect(typeof constants.TOPICS.HEALTH.EVENTS).toBe('string');
    });
  });

  describe('Negative Tests', () => {
    it('should not expose non-existent constants', () => {
      expect(constants['NON_EXISTENT_CONSTANT']).toBeUndefined();
    });

    it('should not have naming collisions between different constant modules', () => {
      // Create sets of keys from each constants module
      const configKeys = new Set(Object.keys(configConstants));
      const errorKeys = new Set(Object.keys(errorConstants));
      const topicKeys = new Set(Object.keys(topicConstants));
      
      // Check for intersections between sets
      const configErrorIntersection = [...configKeys].filter(key => errorKeys.has(key));
      const configTopicIntersection = [...configKeys].filter(key => topicKeys.has(key));
      const errorTopicIntersection = [...errorKeys].filter(key => topicKeys.has(key));
      
      expect(configErrorIntersection).toHaveLength(0);
      expect(configTopicIntersection).toHaveLength(0);
      expect(errorTopicIntersection).toHaveLength(0);
    });
  });
});