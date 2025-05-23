/**
 * @file Unit tests for Kafka topic name constants.
 * 
 * These tests verify that topic constants follow standardized naming patterns
 * across the healthcare super app, ensuring consistency between producers and consumers.
 */

import {
  HEALTH_EVENTS,
  CARE_EVENTS,
  PLAN_EVENTS,
  USER_EVENTS,
  GAMIFICATION_EVENTS,
  VERSIONED_TOPICS,
  Topics,
  JOURNEY_TOPICS,
  ALL_TOPICS,
  isValidTopic,
  getTopicForJourney,
  getVersionedTopic
} from '../../../src/constants/topics.constants';
import { JourneyTypes } from '../../../src/constants/types.constants';

describe('Topic Constants', () => {
  describe('Base topic naming patterns', () => {
    it('should define journey-specific topics with consistent naming pattern', () => {
      // Verify journey-specific topics follow the pattern: journeyName.events
      expect(HEALTH_EVENTS).toBe('health.events');
      expect(CARE_EVENTS).toBe('care.events');
      expect(PLAN_EVENTS).toBe('plan.events');
    });

    it('should define cross-journey topics with consistent naming pattern', () => {
      // Verify cross-journey topics follow the same pattern
      expect(USER_EVENTS).toBe('user.events');
      expect(GAMIFICATION_EVENTS).toBe('game.events');
    });

    it('should have unique topic names for each journey', () => {
      // Create a set of all topic names to check for duplicates
      const baseTopics = [
        HEALTH_EVENTS,
        CARE_EVENTS,
        PLAN_EVENTS,
        USER_EVENTS,
        GAMIFICATION_EVENTS
      ];
      
      // Set size should equal array length if all values are unique
      expect(new Set(baseTopics).size).toBe(baseTopics.length);
    });
  });

  describe('Versioned topic patterns', () => {
    it('should define versioned topics for health journey', () => {
      expect(VERSIONED_TOPICS.HEALTH.V1).toBe(`${HEALTH_EVENTS}.v1`);
      expect(VERSIONED_TOPICS.HEALTH.V2).toBe(`${HEALTH_EVENTS}.v2`);
    });

    it('should define versioned topics for care journey', () => {
      expect(VERSIONED_TOPICS.CARE.V1).toBe(`${CARE_EVENTS}.v1`);
      expect(VERSIONED_TOPICS.CARE.V2).toBe(`${CARE_EVENTS}.v2`);
    });

    it('should define versioned topics for plan journey', () => {
      expect(VERSIONED_TOPICS.PLAN.V1).toBe(`${PLAN_EVENTS}.v1`);
      expect(VERSIONED_TOPICS.PLAN.V2).toBe(`${PLAN_EVENTS}.v2`);
    });

    it('should define versioned topics for user events', () => {
      expect(VERSIONED_TOPICS.USER.V1).toBe(`${USER_EVENTS}.v1`);
      expect(VERSIONED_TOPICS.USER.V2).toBe(`${USER_EVENTS}.v2`);
    });

    it('should define versioned topics for gamification events', () => {
      expect(VERSIONED_TOPICS.GAMIFICATION.V1).toBe(`${GAMIFICATION_EVENTS}.v1`);
      expect(VERSIONED_TOPICS.GAMIFICATION.V2).toBe(`${GAMIFICATION_EVENTS}.v2`);
    });

    it('should have unique versioned topic names', () => {
      // Collect all versioned topics
      const versionedTopics = [
        ...Object.values(VERSIONED_TOPICS.HEALTH),
        ...Object.values(VERSIONED_TOPICS.CARE),
        ...Object.values(VERSIONED_TOPICS.PLAN),
        ...Object.values(VERSIONED_TOPICS.USER),
        ...Object.values(VERSIONED_TOPICS.GAMIFICATION)
      ];
      
      // Set size should equal array length if all values are unique
      expect(new Set(versionedTopics).size).toBe(versionedTopics.length);
    });
  });

  describe('Namespace organization', () => {
    it('should define all journey namespaces', () => {
      // Verify all expected namespaces exist
      expect(Topics.Health).toBeDefined();
      expect(Topics.Care).toBeDefined();
      expect(Topics.Plan).toBeDefined();
      expect(Topics.User).toBeDefined();
      expect(Topics.Gamification).toBeDefined();
    });

    it('should provide consistent access to base topics through namespaces', () => {
      // Verify base topics are accessible through namespaces
      expect(Topics.Health.EVENTS).toBe(HEALTH_EVENTS);
      expect(Topics.Care.EVENTS).toBe(CARE_EVENTS);
      expect(Topics.Plan.EVENTS).toBe(PLAN_EVENTS);
      expect(Topics.User.EVENTS).toBe(USER_EVENTS);
      expect(Topics.Gamification.EVENTS).toBe(GAMIFICATION_EVENTS);
    });

    it('should provide consistent access to versioned topics through namespaces', () => {
      // Verify versioned topics are accessible through namespaces
      expect(Topics.Health.VERSIONED).toBe(VERSIONED_TOPICS.HEALTH);
      expect(Topics.Care.VERSIONED).toBe(VERSIONED_TOPICS.CARE);
      expect(Topics.Plan.VERSIONED).toBe(VERSIONED_TOPICS.PLAN);
      expect(Topics.User.VERSIONED).toBe(VERSIONED_TOPICS.USER);
      expect(Topics.Gamification.VERSIONED).toBe(VERSIONED_TOPICS.GAMIFICATION);
    });
  });

  describe('Topic coverage completeness', () => {
    it('should include all base topics in ALL_TOPICS', () => {
      // Verify ALL_TOPICS includes all base topics
      expect(ALL_TOPICS).toContain(HEALTH_EVENTS);
      expect(ALL_TOPICS).toContain(CARE_EVENTS);
      expect(ALL_TOPICS).toContain(PLAN_EVENTS);
      expect(ALL_TOPICS).toContain(USER_EVENTS);
      expect(ALL_TOPICS).toContain(GAMIFICATION_EVENTS);
    });

    it('should include all versioned topics in ALL_TOPICS', () => {
      // Verify ALL_TOPICS includes all versioned topics
      expect(ALL_TOPICS).toContain(VERSIONED_TOPICS.HEALTH.V1);
      expect(ALL_TOPICS).toContain(VERSIONED_TOPICS.HEALTH.V2);
      expect(ALL_TOPICS).toContain(VERSIONED_TOPICS.CARE.V1);
      expect(ALL_TOPICS).toContain(VERSIONED_TOPICS.CARE.V2);
      expect(ALL_TOPICS).toContain(VERSIONED_TOPICS.PLAN.V1);
      expect(ALL_TOPICS).toContain(VERSIONED_TOPICS.PLAN.V2);
      expect(ALL_TOPICS).toContain(VERSIONED_TOPICS.USER.V1);
      expect(ALL_TOPICS).toContain(VERSIONED_TOPICS.USER.V2);
      expect(ALL_TOPICS).toContain(VERSIONED_TOPICS.GAMIFICATION.V1);
      expect(ALL_TOPICS).toContain(VERSIONED_TOPICS.GAMIFICATION.V2);
    });

    it('should map all journey types to their corresponding topics', () => {
      // Verify JOURNEY_TOPICS maps all journey types
      expect(JOURNEY_TOPICS[JourneyTypes.HEALTH]).toBe(HEALTH_EVENTS);
      expect(JOURNEY_TOPICS[JourneyTypes.CARE]).toBe(CARE_EVENTS);
      expect(JOURNEY_TOPICS[JourneyTypes.PLAN]).toBe(PLAN_EVENTS);
      expect(JOURNEY_TOPICS[JourneyTypes.CROSS_JOURNEY]).toBe(USER_EVENTS);
    });

    it('should have the same number of entries in ALL_TOPICS as defined topics', () => {
      // Calculate the expected number of topics
      const expectedCount = 5 + // Base topics (health, care, plan, user, gamification)
                           10; // Versioned topics (5 base topics × 2 versions)
      
      expect(ALL_TOPICS.length).toBe(expectedCount);
    });
  });

  describe('Utility functions', () => {
    describe('isValidTopic', () => {
      it('should return true for valid base topics', () => {
        expect(isValidTopic(HEALTH_EVENTS)).toBe(true);
        expect(isValidTopic(CARE_EVENTS)).toBe(true);
        expect(isValidTopic(PLAN_EVENTS)).toBe(true);
        expect(isValidTopic(USER_EVENTS)).toBe(true);
        expect(isValidTopic(GAMIFICATION_EVENTS)).toBe(true);
      });

      it('should return true for valid versioned topics', () => {
        expect(isValidTopic(VERSIONED_TOPICS.HEALTH.V1)).toBe(true);
        expect(isValidTopic(VERSIONED_TOPICS.CARE.V2)).toBe(true);
      });

      it('should return false for invalid topics', () => {
        expect(isValidTopic('invalid.topic')).toBe(false);
        expect(isValidTopic('')).toBe(false);
        expect(isValidTopic('health.events.invalid')).toBe(false);
      });
    });

    describe('getTopicForJourney', () => {
      it('should return the correct topic for each journey type', () => {
        expect(getTopicForJourney(JourneyTypes.HEALTH)).toBe(HEALTH_EVENTS);
        expect(getTopicForJourney(JourneyTypes.CARE)).toBe(CARE_EVENTS);
        expect(getTopicForJourney(JourneyTypes.PLAN)).toBe(PLAN_EVENTS);
        expect(getTopicForJourney(JourneyTypes.CROSS_JOURNEY)).toBe(USER_EVENTS);
      });

      it('should return USER_EVENTS for unknown journey types', () => {
        // @ts-ignore - Testing with invalid input
        expect(getTopicForJourney('unknown')).toBe(USER_EVENTS);
      });
    });

    describe('getVersionedTopic', () => {
      it('should return the correct v1 topic for each journey type', () => {
        expect(getVersionedTopic(JourneyTypes.HEALTH, 1)).toBe(VERSIONED_TOPICS.HEALTH.V1);
        expect(getVersionedTopic(JourneyTypes.CARE, 1)).toBe(VERSIONED_TOPICS.CARE.V1);
        expect(getVersionedTopic(JourneyTypes.PLAN, 1)).toBe(VERSIONED_TOPICS.PLAN.V1);
        expect(getVersionedTopic(JourneyTypes.CROSS_JOURNEY, 1)).toBe(VERSIONED_TOPICS.USER.V1);
      });

      it('should return the correct v2 topic for each journey type', () => {
        expect(getVersionedTopic(JourneyTypes.HEALTH, 2)).toBe(VERSIONED_TOPICS.HEALTH.V2);
        expect(getVersionedTopic(JourneyTypes.CARE, 2)).toBe(VERSIONED_TOPICS.CARE.V2);
        expect(getVersionedTopic(JourneyTypes.PLAN, 2)).toBe(VERSIONED_TOPICS.PLAN.V2);
        expect(getVersionedTopic(JourneyTypes.CROSS_JOURNEY, 2)).toBe(VERSIONED_TOPICS.USER.V2);
      });

      it('should return the default topic for unknown journey types', () => {
        // @ts-ignore - Testing with invalid input
        expect(getVersionedTopic('unknown', 1)).toBe(USER_EVENTS);
      });
    });
  });
});