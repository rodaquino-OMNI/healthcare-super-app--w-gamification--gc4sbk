/**
 * Unit tests for Kafka constants
 * 
 * These tests verify the correctness, completeness, and consistency of all Kafka-related constants
 * used across the application, including default topics, consumer groups, error codes, and retry settings.
 */

import {
  TOPIC_PREFIXES,
  JOURNEY_EVENT_TOPICS,
  HEALTH_EVENT_TOPICS,
  CARE_EVENT_TOPICS,
  PLAN_EVENT_TOPICS,
  GAMIFICATION_TOPICS,
  ACHIEVEMENT_TOPICS,
  QUEST_TOPICS,
  REWARD_TOPICS,
  PROFILE_TOPICS,
  NOTIFICATION_TOPICS,
  DLQ_TOPICS,
  CONSUMER_GROUPS,
  KAFKA_CONFIG,
  RETRY_CONFIG,
  CIRCUIT_BREAKER_CONFIG,
  KAFKA_ERROR_CODES,
  KAFKA_HEADERS,
} from '../../../src/kafka/kafka.constants';

describe('Kafka Constants', () => {
  describe('TOPIC_PREFIXES', () => {
    it('should define all required topic prefixes', () => {
      expect(TOPIC_PREFIXES).toBeDefined();
      expect(TOPIC_PREFIXES.BASE).toBe('austa');
      expect(TOPIC_PREFIXES.HEALTH).toBe('austa.health');
      expect(TOPIC_PREFIXES.CARE).toBe('austa.care');
      expect(TOPIC_PREFIXES.PLAN).toBe('austa.plan');
      expect(TOPIC_PREFIXES.GAMIFICATION).toBe('austa.gamification');
      expect(TOPIC_PREFIXES.NOTIFICATION).toBe('austa.notification');
      expect(TOPIC_PREFIXES.USER).toBe('austa.user');
      expect(TOPIC_PREFIXES.DLQ).toBe('austa.dlq');
    });

    it('should follow the correct naming convention', () => {
      // All prefixes should start with the base prefix
      Object.values(TOPIC_PREFIXES).forEach(prefix => {
        if (prefix !== TOPIC_PREFIXES.BASE) {
          expect(prefix).toContain(`${TOPIC_PREFIXES.BASE}.`);
        }
      });
    });
  });

  describe('JOURNEY_EVENT_TOPICS', () => {
    it('should define all journey event topics', () => {
      expect(JOURNEY_EVENT_TOPICS).toBeDefined();
      expect(JOURNEY_EVENT_TOPICS.HEALTH).toBe(`${TOPIC_PREFIXES.HEALTH}.events`);
      expect(JOURNEY_EVENT_TOPICS.CARE).toBe(`${TOPIC_PREFIXES.CARE}.events`);
      expect(JOURNEY_EVENT_TOPICS.PLAN).toBe(`${TOPIC_PREFIXES.PLAN}.events`);
      expect(JOURNEY_EVENT_TOPICS.USER).toBe(`${TOPIC_PREFIXES.USER}.events`);
    });

    it('should follow the correct naming convention', () => {
      // All journey event topics should end with .events
      Object.values(JOURNEY_EVENT_TOPICS).forEach(topic => {
        expect(topic).toMatch(/\.events$/);
      });
    });
  });

  describe('Journey-specific event topics', () => {
    describe('HEALTH_EVENT_TOPICS', () => {
      it('should define all health journey event topics', () => {
        expect(HEALTH_EVENT_TOPICS).toBeDefined();
        expect(HEALTH_EVENT_TOPICS.METRICS).toBe(`${TOPIC_PREFIXES.HEALTH}.metrics`);
        expect(HEALTH_EVENT_TOPICS.GOALS).toBe(`${TOPIC_PREFIXES.HEALTH}.goals`);
        expect(HEALTH_EVENT_TOPICS.INSIGHTS).toBe(`${TOPIC_PREFIXES.HEALTH}.insights`);
        expect(HEALTH_EVENT_TOPICS.DEVICES).toBe(`${TOPIC_PREFIXES.HEALTH}.devices`);
      });

      it('should use the correct health journey prefix', () => {
        Object.values(HEALTH_EVENT_TOPICS).forEach(topic => {
          expect(topic).toContain(TOPIC_PREFIXES.HEALTH);
        });
      });
    });

    describe('CARE_EVENT_TOPICS', () => {
      it('should define all care journey event topics', () => {
        expect(CARE_EVENT_TOPICS).toBeDefined();
        expect(CARE_EVENT_TOPICS.APPOINTMENTS).toBe(`${TOPIC_PREFIXES.CARE}.appointments`);
        expect(CARE_EVENT_TOPICS.MEDICATIONS).toBe(`${TOPIC_PREFIXES.CARE}.medications`);
        expect(CARE_EVENT_TOPICS.TELEMEDICINE).toBe(`${TOPIC_PREFIXES.CARE}.telemedicine`);
        expect(CARE_EVENT_TOPICS.CARE_PLANS).toBe(`${TOPIC_PREFIXES.CARE}.care_plans`);
      });

      it('should use the correct care journey prefix', () => {
        Object.values(CARE_EVENT_TOPICS).forEach(topic => {
          expect(topic).toContain(TOPIC_PREFIXES.CARE);
        });
      });
    });

    describe('PLAN_EVENT_TOPICS', () => {
      it('should define all plan journey event topics', () => {
        expect(PLAN_EVENT_TOPICS).toBeDefined();
        expect(PLAN_EVENT_TOPICS.CLAIMS).toBe(`${TOPIC_PREFIXES.PLAN}.claims`);
        expect(PLAN_EVENT_TOPICS.BENEFITS).toBe(`${TOPIC_PREFIXES.PLAN}.benefits`);
        expect(PLAN_EVENT_TOPICS.PLANS).toBe(`${TOPIC_PREFIXES.PLAN}.plans`);
        expect(PLAN_EVENT_TOPICS.REWARDS).toBe(`${TOPIC_PREFIXES.PLAN}.rewards`);
      });

      it('should use the correct plan journey prefix', () => {
        Object.values(PLAN_EVENT_TOPICS).forEach(topic => {
          expect(topic).toContain(TOPIC_PREFIXES.PLAN);
        });
      });
    });
  });

  describe('Gamification event topics', () => {
    describe('GAMIFICATION_TOPICS', () => {
      it('should define all gamification engine event topics', () => {
        expect(GAMIFICATION_TOPICS).toBeDefined();
        expect(GAMIFICATION_TOPICS.ACHIEVEMENT).toBe(`${TOPIC_PREFIXES.GAMIFICATION}.achievement.events`);
        expect(GAMIFICATION_TOPICS.REWARD).toBe(`${TOPIC_PREFIXES.GAMIFICATION}.reward.events`);
        expect(GAMIFICATION_TOPICS.QUEST).toBe(`${TOPIC_PREFIXES.GAMIFICATION}.quest.events`);
        expect(GAMIFICATION_TOPICS.PROFILE).toBe(`${TOPIC_PREFIXES.GAMIFICATION}.profile.events`);
        expect(GAMIFICATION_TOPICS.LEADERBOARD).toBe(`${TOPIC_PREFIXES.GAMIFICATION}.leaderboard.events`);
        expect(GAMIFICATION_TOPICS.RULE).toBe(`${TOPIC_PREFIXES.GAMIFICATION}.rule.events`);
      });

      it('should use the correct gamification prefix', () => {
        Object.values(GAMIFICATION_TOPICS).forEach(topic => {
          expect(topic).toContain(TOPIC_PREFIXES.GAMIFICATION);
          expect(topic).toMatch(/\.events$/);
        });
      });
    });

    describe('ACHIEVEMENT_TOPICS', () => {
      it('should define all achievement-specific event topics', () => {
        expect(ACHIEVEMENT_TOPICS).toBeDefined();
        expect(ACHIEVEMENT_TOPICS.UNLOCKED).toBe(`${GAMIFICATION_TOPICS.ACHIEVEMENT}.unlocked`);
        expect(ACHIEVEMENT_TOPICS.PROGRESS).toBe(`${GAMIFICATION_TOPICS.ACHIEVEMENT}.progress`);
      });

      it('should use the correct achievement topic prefix', () => {
        Object.values(ACHIEVEMENT_TOPICS).forEach(topic => {
          expect(topic).toContain(GAMIFICATION_TOPICS.ACHIEVEMENT);
        });
      });
    });

    describe('QUEST_TOPICS', () => {
      it('should define all quest-specific event topics', () => {
        expect(QUEST_TOPICS).toBeDefined();
        expect(QUEST_TOPICS.STARTED).toBe(`${GAMIFICATION_TOPICS.QUEST}.started`);
        expect(QUEST_TOPICS.COMPLETED).toBe(`${GAMIFICATION_TOPICS.QUEST}.completed`);
        expect(QUEST_TOPICS.PROGRESS).toBe(`${GAMIFICATION_TOPICS.QUEST}.progress`);
      });

      it('should use the correct quest topic prefix', () => {
        Object.values(QUEST_TOPICS).forEach(topic => {
          expect(topic).toContain(GAMIFICATION_TOPICS.QUEST);
        });
      });
    });

    describe('REWARD_TOPICS', () => {
      it('should define all reward-specific event topics', () => {
        expect(REWARD_TOPICS).toBeDefined();
        expect(REWARD_TOPICS.GRANTED).toBe(`${GAMIFICATION_TOPICS.REWARD}.granted`);
        expect(REWARD_TOPICS.REDEEMED).toBe(`${GAMIFICATION_TOPICS.REWARD}.redeemed`);
      });

      it('should use the correct reward topic prefix', () => {
        Object.values(REWARD_TOPICS).forEach(topic => {
          expect(topic).toContain(GAMIFICATION_TOPICS.REWARD);
        });
      });
    });

    describe('PROFILE_TOPICS', () => {
      it('should define all profile-specific event topics', () => {
        expect(PROFILE_TOPICS).toBeDefined();
        expect(PROFILE_TOPICS.CREATED).toBe(`${GAMIFICATION_TOPICS.PROFILE}.created`);
        expect(PROFILE_TOPICS.UPDATED).toBe(`${GAMIFICATION_TOPICS.PROFILE}.updated`);
        expect(PROFILE_TOPICS.LEVEL_UP).toBe(`${GAMIFICATION_TOPICS.PROFILE}.level_up`);
      });

      it('should use the correct profile topic prefix', () => {
        Object.values(PROFILE_TOPICS).forEach(topic => {
          expect(topic).toContain(GAMIFICATION_TOPICS.PROFILE);
        });
      });
    });
  });

  describe('NOTIFICATION_TOPICS', () => {
    it('should define all notification service event topics', () => {
      expect(NOTIFICATION_TOPICS).toBeDefined();
      expect(NOTIFICATION_TOPICS.REQUEST).toBe(`${TOPIC_PREFIXES.NOTIFICATION}.request`);
      expect(NOTIFICATION_TOPICS.STATUS).toBe(`${TOPIC_PREFIXES.NOTIFICATION}.status`);
      expect(NOTIFICATION_TOPICS.PREFERENCES).toBe(`${TOPIC_PREFIXES.NOTIFICATION}.preferences`);
    });

    it('should use the correct notification prefix', () => {
      Object.values(NOTIFICATION_TOPICS).forEach(topic => {
        expect(topic).toContain(TOPIC_PREFIXES.NOTIFICATION);
      });
    });
  });

  describe('DLQ_TOPICS', () => {
    it('should define all dead-letter queue topics', () => {
      expect(DLQ_TOPICS).toBeDefined();
      expect(DLQ_TOPICS.HEALTH_EVENTS).toBe(`${TOPIC_PREFIXES.DLQ}.${JOURNEY_EVENT_TOPICS.HEALTH}`);
      expect(DLQ_TOPICS.CARE_EVENTS).toBe(`${TOPIC_PREFIXES.DLQ}.${JOURNEY_EVENT_TOPICS.CARE}`);
      expect(DLQ_TOPICS.PLAN_EVENTS).toBe(`${TOPIC_PREFIXES.DLQ}.${JOURNEY_EVENT_TOPICS.PLAN}`);
      expect(DLQ_TOPICS.USER_EVENTS).toBe(`${TOPIC_PREFIXES.DLQ}.${JOURNEY_EVENT_TOPICS.USER}`);
      expect(DLQ_TOPICS.ACHIEVEMENT).toBe(`${TOPIC_PREFIXES.DLQ}.achievement.events`);
      expect(DLQ_TOPICS.REWARD).toBe(`${TOPIC_PREFIXES.DLQ}.reward.events`);
      expect(DLQ_TOPICS.QUEST).toBe(`${TOPIC_PREFIXES.DLQ}.quest.events`);
      expect(DLQ_TOPICS.PROFILE).toBe(`${TOPIC_PREFIXES.DLQ}.profile.events`);
      expect(DLQ_TOPICS.NOTIFICATION).toBe(`${TOPIC_PREFIXES.DLQ}.notification.events`);
    });

    it('should use the correct DLQ prefix', () => {
      Object.values(DLQ_TOPICS).forEach(topic => {
        expect(topic).toContain(TOPIC_PREFIXES.DLQ);
      });
    });

    it('should have a corresponding DLQ topic for each journey event topic', () => {
      // Check that each journey event topic has a corresponding DLQ topic
      Object.keys(JOURNEY_EVENT_TOPICS).forEach(key => {
        const dlqKey = `${key}_EVENTS`;
        expect(DLQ_TOPICS[dlqKey]).toBeDefined();
      });
    });
  });

  describe('CONSUMER_GROUPS', () => {
    it('should define all required consumer groups', () => {
      expect(CONSUMER_GROUPS).toBeDefined();
      expect(CONSUMER_GROUPS.HEALTH_SERVICE).toBe('health-service-group');
      expect(CONSUMER_GROUPS.CARE_SERVICE).toBe('care-service-group');
      expect(CONSUMER_GROUPS.PLAN_SERVICE).toBe('plan-service-group');
      expect(CONSUMER_GROUPS.GAMIFICATION_ENGINE).toBe('gamification-engine-group');
      expect(CONSUMER_GROUPS.ACHIEVEMENT_PROCESSOR).toBe('achievement-processor-group');
      expect(CONSUMER_GROUPS.REWARD_PROCESSOR).toBe('reward-processor-group');
      expect(CONSUMER_GROUPS.QUEST_PROCESSOR).toBe('quest-processor-group');
      expect(CONSUMER_GROUPS.PROFILE_PROCESSOR).toBe('profile-processor-group');
      expect(CONSUMER_GROUPS.LEADERBOARD_PROCESSOR).toBe('leaderboard-processor-group');
      expect(CONSUMER_GROUPS.NOTIFICATION_SERVICE).toBe('notification-service-group');
      expect(CONSUMER_GROUPS.NOTIFICATION_PROCESSOR).toBe('notification-processor-group');
      expect(CONSUMER_GROUPS.DLQ_PROCESSOR).toBe('dlq-processor-group');
    });

    it('should follow the correct naming convention', () => {
      // All consumer groups should end with -group
      Object.values(CONSUMER_GROUPS).forEach(group => {
        expect(group).toMatch(/-group$/);
      });
    });

    it('should have unique consumer group names', () => {
      const groupValues = Object.values(CONSUMER_GROUPS);
      const uniqueValues = new Set(groupValues);
      expect(uniqueValues.size).toBe(groupValues.length);
    });
  });

  describe('KAFKA_CONFIG', () => {
    it('should define all required configuration constants', () => {
      expect(KAFKA_CONFIG).toBeDefined();
      expect(KAFKA_CONFIG.DEFAULT_PARTITIONS).toBe(3);
      expect(KAFKA_CONFIG.HIGH_THROUGHPUT_PARTITIONS).toBe(6);
      expect(KAFKA_CONFIG.DEFAULT_REPLICATION_FACTOR).toBe(3);
      expect(KAFKA_CONFIG.DEFAULT_RETENTION_MS).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
      expect(KAFKA_CONFIG.HIGH_PRIORITY_RETENTION_MS).toBe(14 * 24 * 60 * 60 * 1000); // 14 days
      expect(KAFKA_CONFIG.DLQ_RETENTION_MS).toBe(30 * 24 * 60 * 60 * 1000); // 30 days
      expect(KAFKA_CONFIG.DEFAULT_SESSION_TIMEOUT_MS).toBe(30000); // 30 seconds
      expect(KAFKA_CONFIG.DEFAULT_REQUEST_TIMEOUT_MS).toBe(30000); // 30 seconds
      expect(KAFKA_CONFIG.DEFAULT_CONNECTION_TIMEOUT_MS).toBe(10000); // 10 seconds
    });

    it('should have valid partition and replication values', () => {
      expect(KAFKA_CONFIG.DEFAULT_PARTITIONS).toBeGreaterThan(0);
      expect(KAFKA_CONFIG.HIGH_THROUGHPUT_PARTITIONS).toBeGreaterThan(KAFKA_CONFIG.DEFAULT_PARTITIONS);
      expect(KAFKA_CONFIG.DEFAULT_REPLICATION_FACTOR).toBeGreaterThanOrEqual(1);
    });

    it('should have valid timeout values', () => {
      expect(KAFKA_CONFIG.DEFAULT_SESSION_TIMEOUT_MS).toBeGreaterThan(0);
      expect(KAFKA_CONFIG.DEFAULT_REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
      expect(KAFKA_CONFIG.DEFAULT_CONNECTION_TIMEOUT_MS).toBeGreaterThan(0);
    });

    it('should have valid retention periods', () => {
      expect(KAFKA_CONFIG.DEFAULT_RETENTION_MS).toBeGreaterThan(0);
      expect(KAFKA_CONFIG.HIGH_PRIORITY_RETENTION_MS).toBeGreaterThan(KAFKA_CONFIG.DEFAULT_RETENTION_MS);
      expect(KAFKA_CONFIG.DLQ_RETENTION_MS).toBeGreaterThan(KAFKA_CONFIG.HIGH_PRIORITY_RETENTION_MS);
    });
  });

  describe('RETRY_CONFIG', () => {
    it('should define all required retry configuration constants', () => {
      expect(RETRY_CONFIG).toBeDefined();
      expect(RETRY_CONFIG.MAX_RETRIES).toBe(3);
      expect(RETRY_CONFIG.INITIAL_RETRY_DELAY_MS).toBe(1000); // 1 second
      expect(RETRY_CONFIG.MAX_RETRY_DELAY_MS).toBe(30000); // 30 seconds
      expect(RETRY_CONFIG.RETRY_FACTOR).toBe(2);
      expect(RETRY_CONFIG.JITTER_FACTOR).toBe(0.1);
    });

    it('should have valid retry values', () => {
      expect(RETRY_CONFIG.MAX_RETRIES).toBeGreaterThan(0);
      expect(RETRY_CONFIG.INITIAL_RETRY_DELAY_MS).toBeGreaterThan(0);
      expect(RETRY_CONFIG.MAX_RETRY_DELAY_MS).toBeGreaterThan(RETRY_CONFIG.INITIAL_RETRY_DELAY_MS);
      expect(RETRY_CONFIG.RETRY_FACTOR).toBeGreaterThan(1);
      expect(RETRY_CONFIG.JITTER_FACTOR).toBeGreaterThan(0);
      expect(RETRY_CONFIG.JITTER_FACTOR).toBeLessThan(1);
    });

    it('should have a maximum retry delay that can be reached with the given parameters', () => {
      // Calculate the maximum delay that can be reached with the given retry factor and initial delay
      let maxDelay = RETRY_CONFIG.INITIAL_RETRY_DELAY_MS;
      for (let i = 1; i < RETRY_CONFIG.MAX_RETRIES; i++) {
        maxDelay *= RETRY_CONFIG.RETRY_FACTOR;
      }

      // The maximum delay should be less than or equal to the configured maximum
      // This ensures that the exponential backoff can reach the maximum delay
      expect(maxDelay).toBeLessThanOrEqual(RETRY_CONFIG.MAX_RETRY_DELAY_MS);
    });
  });

  describe('CIRCUIT_BREAKER_CONFIG', () => {
    it('should define all required circuit breaker configuration constants', () => {
      expect(CIRCUIT_BREAKER_CONFIG).toBeDefined();
      expect(CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD).toBe(5);
      expect(CIRCUIT_BREAKER_CONFIG.SUCCESS_THRESHOLD).toBe(3);
      expect(CIRCUIT_BREAKER_CONFIG.RESET_TIMEOUT_MS).toBe(30000); // 30 seconds
    });

    it('should have valid threshold values', () => {
      expect(CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD).toBeGreaterThan(0);
      expect(CIRCUIT_BREAKER_CONFIG.SUCCESS_THRESHOLD).toBeGreaterThan(0);
      expect(CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD).toBeGreaterThan(CIRCUIT_BREAKER_CONFIG.SUCCESS_THRESHOLD);
    });

    it('should have a valid reset timeout', () => {
      expect(CIRCUIT_BREAKER_CONFIG.RESET_TIMEOUT_MS).toBeGreaterThan(0);
    });
  });

  describe('KAFKA_ERROR_CODES', () => {
    it('should define all required error codes', () => {
      expect(KAFKA_ERROR_CODES).toBeDefined();
      expect(KAFKA_ERROR_CODES.CONNECTION_ERROR).toBe('KAFKA_CONNECTION_ERROR');
      expect(KAFKA_ERROR_CODES.AUTHENTICATION_ERROR).toBe('KAFKA_AUTHENTICATION_ERROR');
      expect(KAFKA_ERROR_CODES.AUTHORIZATION_ERROR).toBe('KAFKA_AUTHORIZATION_ERROR');
      expect(KAFKA_ERROR_CODES.TOPIC_NOT_FOUND).toBe('KAFKA_TOPIC_NOT_FOUND');
      expect(KAFKA_ERROR_CODES.BROKER_NOT_AVAILABLE).toBe('KAFKA_BROKER_NOT_AVAILABLE');
      expect(KAFKA_ERROR_CODES.LEADER_NOT_AVAILABLE).toBe('KAFKA_LEADER_NOT_AVAILABLE');
      expect(KAFKA_ERROR_CODES.MESSAGE_TOO_LARGE).toBe('KAFKA_MESSAGE_TOO_LARGE');
      expect(KAFKA_ERROR_CODES.INVALID_MESSAGE).toBe('KAFKA_INVALID_MESSAGE');
      expect(KAFKA_ERROR_CODES.OFFSET_OUT_OF_RANGE).toBe('KAFKA_OFFSET_OUT_OF_RANGE');
      expect(KAFKA_ERROR_CODES.GROUP_REBALANCING).toBe('KAFKA_GROUP_REBALANCING');
      expect(KAFKA_ERROR_CODES.SERIALIZATION_ERROR).toBe('KAFKA_SERIALIZATION_ERROR');
      expect(KAFKA_ERROR_CODES.DESERIALIZATION_ERROR).toBe('KAFKA_DESERIALIZATION_ERROR');
      expect(KAFKA_ERROR_CODES.PRODUCER_ERROR).toBe('KAFKA_PRODUCER_ERROR');
      expect(KAFKA_ERROR_CODES.CONSUMER_ERROR).toBe('KAFKA_CONSUMER_ERROR');
      expect(KAFKA_ERROR_CODES.ADMIN_ERROR).toBe('KAFKA_ADMIN_ERROR');
      expect(KAFKA_ERROR_CODES.TIMEOUT_ERROR).toBe('KAFKA_TIMEOUT_ERROR');
      expect(KAFKA_ERROR_CODES.UNKNOWN_ERROR).toBe('KAFKA_UNKNOWN_ERROR');
    });

    it('should follow the correct naming convention', () => {
      // All error codes should start with KAFKA_
      Object.values(KAFKA_ERROR_CODES).forEach(code => {
        expect(code).toMatch(/^KAFKA_/);
      });
    });

    it('should have unique error codes', () => {
      const codeValues = Object.values(KAFKA_ERROR_CODES);
      const uniqueValues = new Set(codeValues);
      expect(uniqueValues.size).toBe(codeValues.length);
    });
  });

  describe('KAFKA_HEADERS', () => {
    it('should define all required header keys', () => {
      expect(KAFKA_HEADERS).toBeDefined();
      expect(KAFKA_HEADERS.CORRELATION_ID).toBe('X-Correlation-ID');
      expect(KAFKA_HEADERS.SOURCE_SERVICE).toBe('X-Source-Service');
      expect(KAFKA_HEADERS.EVENT_TYPE).toBe('X-Event-Type');
      expect(KAFKA_HEADERS.EVENT_VERSION).toBe('X-Event-Version');
      expect(KAFKA_HEADERS.USER_ID).toBe('X-User-ID');
      expect(KAFKA_HEADERS.JOURNEY).toBe('X-Journey');
      expect(KAFKA_HEADERS.TIMESTAMP).toBe('X-Timestamp');
      expect(KAFKA_HEADERS.RETRY_COUNT).toBe('X-Retry-Count');
      expect(KAFKA_HEADERS.ORIGINAL_TOPIC).toBe('X-Original-Topic');
      expect(KAFKA_HEADERS.ERROR_MESSAGE).toBe('X-Error-Message');
      expect(KAFKA_HEADERS.ERROR_CODE).toBe('X-Error-Code');
    });

    it('should follow the correct naming convention', () => {
      // All header keys should start with X-
      Object.values(KAFKA_HEADERS).forEach(header => {
        expect(header).toMatch(/^X-/);
      });
    });

    it('should have unique header keys', () => {
      const headerValues = Object.values(KAFKA_HEADERS);
      const uniqueValues = new Set(headerValues);
      expect(uniqueValues.size).toBe(headerValues.length);
    });
  });

  describe('Cross-service consistency', () => {
    it('should have consistent journey prefixes across all topic constants', () => {
      // Health journey
      expect(TOPIC_PREFIXES.HEALTH).toBe('austa.health');
      expect(JOURNEY_EVENT_TOPICS.HEALTH).toBe(`${TOPIC_PREFIXES.HEALTH}.events`);
      Object.values(HEALTH_EVENT_TOPICS).forEach(topic => {
        expect(topic).toContain(TOPIC_PREFIXES.HEALTH);
      });

      // Care journey
      expect(TOPIC_PREFIXES.CARE).toBe('austa.care');
      expect(JOURNEY_EVENT_TOPICS.CARE).toBe(`${TOPIC_PREFIXES.CARE}.events`);
      Object.values(CARE_EVENT_TOPICS).forEach(topic => {
        expect(topic).toContain(TOPIC_PREFIXES.CARE);
      });

      // Plan journey
      expect(TOPIC_PREFIXES.PLAN).toBe('austa.plan');
      expect(JOURNEY_EVENT_TOPICS.PLAN).toBe(`${TOPIC_PREFIXES.PLAN}.events`);
      Object.values(PLAN_EVENT_TOPICS).forEach(topic => {
        expect(topic).toContain(TOPIC_PREFIXES.PLAN);
      });
    });

    it('should have consistent gamification prefixes across all topic constants', () => {
      expect(TOPIC_PREFIXES.GAMIFICATION).toBe('austa.gamification');
      Object.values(GAMIFICATION_TOPICS).forEach(topic => {
        expect(topic).toContain(TOPIC_PREFIXES.GAMIFICATION);
      });

      // Check that sub-topics use the correct parent topic
      Object.values(ACHIEVEMENT_TOPICS).forEach(topic => {
        expect(topic).toContain(GAMIFICATION_TOPICS.ACHIEVEMENT);
      });

      Object.values(QUEST_TOPICS).forEach(topic => {
        expect(topic).toContain(GAMIFICATION_TOPICS.QUEST);
      });

      Object.values(REWARD_TOPICS).forEach(topic => {
        expect(topic).toContain(GAMIFICATION_TOPICS.REWARD);
      });

      Object.values(PROFILE_TOPICS).forEach(topic => {
        expect(topic).toContain(GAMIFICATION_TOPICS.PROFILE);
      });
    });

    it('should have consistent DLQ prefixes for all event topics', () => {
      expect(DLQ_TOPICS.HEALTH_EVENTS).toContain(TOPIC_PREFIXES.DLQ);
      expect(DLQ_TOPICS.CARE_EVENTS).toContain(TOPIC_PREFIXES.DLQ);
      expect(DLQ_TOPICS.PLAN_EVENTS).toContain(TOPIC_PREFIXES.DLQ);
      expect(DLQ_TOPICS.USER_EVENTS).toContain(TOPIC_PREFIXES.DLQ);
      expect(DLQ_TOPICS.ACHIEVEMENT).toContain(TOPIC_PREFIXES.DLQ);
      expect(DLQ_TOPICS.REWARD).toContain(TOPIC_PREFIXES.DLQ);
      expect(DLQ_TOPICS.QUEST).toContain(TOPIC_PREFIXES.DLQ);
      expect(DLQ_TOPICS.PROFILE).toContain(TOPIC_PREFIXES.DLQ);
      expect(DLQ_TOPICS.NOTIFICATION).toContain(TOPIC_PREFIXES.DLQ);
    });

    it('should have consumer groups for all services', () => {
      // Check that there's a consumer group for each journey service
      expect(CONSUMER_GROUPS.HEALTH_SERVICE).toBeDefined();
      expect(CONSUMER_GROUPS.CARE_SERVICE).toBeDefined();
      expect(CONSUMER_GROUPS.PLAN_SERVICE).toBeDefined();

      // Check that there's a consumer group for each gamification processor
      expect(CONSUMER_GROUPS.GAMIFICATION_ENGINE).toBeDefined();
      expect(CONSUMER_GROUPS.ACHIEVEMENT_PROCESSOR).toBeDefined();
      expect(CONSUMER_GROUPS.REWARD_PROCESSOR).toBeDefined();
      expect(CONSUMER_GROUPS.QUEST_PROCESSOR).toBeDefined();
      expect(CONSUMER_GROUPS.PROFILE_PROCESSOR).toBeDefined();
      expect(CONSUMER_GROUPS.LEADERBOARD_PROCESSOR).toBeDefined();

      // Check that there's a consumer group for notification service
      expect(CONSUMER_GROUPS.NOTIFICATION_SERVICE).toBeDefined();
      expect(CONSUMER_GROUPS.NOTIFICATION_PROCESSOR).toBeDefined();

      // Check that there's a consumer group for DLQ processor
      expect(CONSUMER_GROUPS.DLQ_PROCESSOR).toBeDefined();
    });
  });
});