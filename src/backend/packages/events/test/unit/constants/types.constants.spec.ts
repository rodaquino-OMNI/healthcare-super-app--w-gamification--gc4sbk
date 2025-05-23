/**
 * @file Unit tests for event type identifier constants.
 * 
 * These tests verify that event type constants follow standardized naming patterns
 * across all journeys, ensuring consistent event handling and type safety.
 */

import {
  HealthEventTypes,
  CareEventTypes,
  PlanEventTypes,
  UserEventTypes,
  GamificationEventTypes,
  JourneyTypes,
  EventTypes,
  JOURNEY_EVENT_TYPES,
  ALL_EVENT_TYPES,
  isValidEventType,
  getJourneyForEventType
} from '../../../src/constants/types.constants';

describe('Event Type Constants', () => {
  describe('Event type naming patterns', () => {
    it('should define health event types with HEALTH_ prefix', () => {
      // Verify all health event types follow the naming pattern
      Object.values(HealthEventTypes).forEach(eventType => {
        expect(eventType).toMatch(/^HEALTH_|^DEVICE_|^MEDICAL_EVENT_/);
      });
    });

    it('should define care event types with consistent naming pattern', () => {
      // Verify all care event types follow the naming pattern
      Object.values(CareEventTypes).forEach(eventType => {
        expect(eventType).toMatch(/^APPOINTMENT_|^MEDICATION_|^TELEMEDICINE_|^TREATMENT_|^SYMPTOM_|^PROVIDER_/);
      });
    });

    it('should define plan event types with consistent naming pattern', () => {
      // Verify all plan event types follow the naming pattern
      Object.values(PlanEventTypes).forEach(eventType => {
        expect(eventType).toMatch(/^CLAIM_|^BENEFIT_|^PLAN_|^COVERAGE_|^REWARD_/);
      });
    });

    it('should define user event types with consistent naming pattern', () => {
      // Verify all user event types follow the naming pattern
      Object.values(UserEventTypes).forEach(eventType => {
        expect(eventType).toMatch(/^PROFILE_|^FEEDBACK_|^SURVEY_|^APP_|^DAILY_|^WEEKLY_|^MONTHLY_|^REFERRAL_/);
      });
    });

    it('should define gamification event types with consistent naming pattern', () => {
      // Verify all gamification event types follow the naming pattern
      Object.values(GamificationEventTypes).forEach(eventType => {
        expect(eventType).toMatch(/^ACHIEVEMENT_|^QUEST_|^LEVEL_|^XP_/);
      });
    });

    it('should have unique event type values across all journeys', () => {
      // Create a set of all event type values to check for duplicates
      const allEventTypeValues = [
        ...Object.values(HealthEventTypes),
        ...Object.values(CareEventTypes),
        ...Object.values(PlanEventTypes),
        ...Object.values(UserEventTypes),
        ...Object.values(GamificationEventTypes)
      ];
      
      // Set size should equal array length if all values are unique
      expect(new Set(allEventTypeValues).size).toBe(allEventTypeValues.length);
    });
  });

  describe('Journey type definitions', () => {
    it('should define all required journey types', () => {
      // Verify all expected journey types exist
      expect(JourneyTypes.HEALTH).toBe('health');
      expect(JourneyTypes.CARE).toBe('care');
      expect(JourneyTypes.PLAN).toBe('plan');
      expect(JourneyTypes.CROSS_JOURNEY).toBe('cross-journey');
    });

    it('should have unique journey type values', () => {
      // Create a set of all journey type values to check for duplicates
      const journeyTypeValues = Object.values(JourneyTypes);
      
      // Set size should equal array length if all values are unique
      expect(new Set(journeyTypeValues).size).toBe(journeyTypeValues.length);
    });
  });

  describe('Event type completeness', () => {
    it('should include health metrics events', () => {
      expect(HealthEventTypes.METRIC_RECORDED).toBeDefined();
    });

    it('should include health goal events', () => {
      expect(HealthEventTypes.GOAL_CREATED).toBeDefined();
      expect(HealthEventTypes.GOAL_UPDATED).toBeDefined();
      expect(HealthEventTypes.GOAL_ACHIEVED).toBeDefined();
      expect(HealthEventTypes.GOAL_STREAK_MAINTAINED).toBeDefined();
    });

    it('should include device connection events', () => {
      expect(HealthEventTypes.DEVICE_CONNECTED).toBeDefined();
      expect(HealthEventTypes.DEVICE_SYNCED).toBeDefined();
    });

    it('should include appointment management events', () => {
      expect(CareEventTypes.APPOINTMENT_BOOKED).toBeDefined();
      expect(CareEventTypes.APPOINTMENT_ATTENDED).toBeDefined();
      expect(CareEventTypes.APPOINTMENT_CANCELLED).toBeDefined();
    });

    it('should include medication tracking events', () => {
      expect(CareEventTypes.MEDICATION_ADDED).toBeDefined();
      expect(CareEventTypes.MEDICATION_TAKEN).toBeDefined();
      expect(CareEventTypes.MEDICATION_ADHERENCE_STREAK).toBeDefined();
    });

    it('should include telemedicine events', () => {
      expect(CareEventTypes.TELEMEDICINE_SESSION_STARTED).toBeDefined();
      expect(CareEventTypes.TELEMEDICINE_SESSION_COMPLETED).toBeDefined();
    });

    it('should include treatment plan events', () => {
      expect(CareEventTypes.TREATMENT_PLAN_CREATED).toBeDefined();
      expect(CareEventTypes.TREATMENT_PLAN_PROGRESS).toBeDefined();
      expect(CareEventTypes.TREATMENT_PLAN_COMPLETED).toBeDefined();
    });

    it('should include claim management events', () => {
      expect(PlanEventTypes.CLAIM_SUBMITTED).toBeDefined();
      expect(PlanEventTypes.CLAIM_APPROVED).toBeDefined();
      expect(PlanEventTypes.CLAIM_DOCUMENT_UPLOADED).toBeDefined();
    });

    it('should include plan selection events', () => {
      expect(PlanEventTypes.PLAN_SELECTED).toBeDefined();
      expect(PlanEventTypes.PLAN_COMPARED).toBeDefined();
      expect(PlanEventTypes.PLAN_RENEWED).toBeDefined();
    });

    it('should include user profile events', () => {
      expect(UserEventTypes.PROFILE_COMPLETED).toBeDefined();
      expect(UserEventTypes.PROFILE_UPDATED).toBeDefined();
    });

    it('should include user engagement events', () => {
      expect(UserEventTypes.DAILY_LOGIN).toBeDefined();
      expect(UserEventTypes.WEEKLY_ACTIVE).toBeDefined();
      expect(UserEventTypes.MONTHLY_ACTIVE).toBeDefined();
    });

    it('should include gamification achievement events', () => {
      expect(GamificationEventTypes.ACHIEVEMENT_UNLOCKED).toBeDefined();
      expect(GamificationEventTypes.QUEST_COMPLETED).toBeDefined();
      expect(GamificationEventTypes.LEVEL_UP).toBeDefined();
      expect(GamificationEventTypes.XP_EARNED).toBeDefined();
    });
  });

  describe('Event type grouping', () => {
    it('should map health journey to health event types', () => {
      expect(JOURNEY_EVENT_TYPES[JourneyTypes.HEALTH]).toBe(HealthEventTypes);
    });

    it('should map care journey to care event types', () => {
      expect(JOURNEY_EVENT_TYPES[JourneyTypes.CARE]).toBe(CareEventTypes);
    });

    it('should map plan journey to plan event types', () => {
      expect(JOURNEY_EVENT_TYPES[JourneyTypes.PLAN]).toBe(PlanEventTypes);
    });

    it('should map cross-journey to user and gamification event types', () => {
      // Cross-journey should include both user and gamification events
      const crossJourneyEvents = JOURNEY_EVENT_TYPES[JourneyTypes.CROSS_JOURNEY];
      
      // Check that cross-journey events include user events
      Object.values(UserEventTypes).forEach(eventType => {
        expect(crossJourneyEvents).toHaveProperty(eventType);
      });
      
      // Check that cross-journey events include gamification events
      Object.values(GamificationEventTypes).forEach(eventType => {
        expect(crossJourneyEvents).toHaveProperty(eventType);
      });
    });
  });

  describe('ALL_EVENT_TYPES aggregation', () => {
    it('should include all health event types', () => {
      Object.values(HealthEventTypes).forEach(eventType => {
        expect(ALL_EVENT_TYPES).toHaveProperty(eventType);
      });
    });

    it('should include all care event types', () => {
      Object.values(CareEventTypes).forEach(eventType => {
        expect(ALL_EVENT_TYPES).toHaveProperty(eventType);
      });
    });

    it('should include all plan event types', () => {
      Object.values(PlanEventTypes).forEach(eventType => {
        expect(ALL_EVENT_TYPES).toHaveProperty(eventType);
      });
    });

    it('should include all user event types', () => {
      Object.values(UserEventTypes).forEach(eventType => {
        expect(ALL_EVENT_TYPES).toHaveProperty(eventType);
      });
    });

    it('should include all gamification event types', () => {
      Object.values(GamificationEventTypes).forEach(eventType => {
        expect(ALL_EVENT_TYPES).toHaveProperty(eventType);
      });
    });

    it('should have the same number of entries as all individual event types combined', () => {
      // Calculate the expected number of event types
      const expectedCount = 
        Object.values(HealthEventTypes).length +
        Object.values(CareEventTypes).length +
        Object.values(PlanEventTypes).length +
        Object.values(UserEventTypes).length +
        Object.values(GamificationEventTypes).length;
      
      expect(Object.keys(ALL_EVENT_TYPES).length).toBe(expectedCount);
    });
  });

  describe('Utility functions', () => {
    describe('isValidEventType', () => {
      it('should return true for valid health event types', () => {
        Object.values(HealthEventTypes).forEach(eventType => {
          expect(isValidEventType(eventType)).toBe(true);
        });
      });

      it('should return true for valid care event types', () => {
        Object.values(CareEventTypes).forEach(eventType => {
          expect(isValidEventType(eventType)).toBe(true);
        });
      });

      it('should return true for valid plan event types', () => {
        Object.values(PlanEventTypes).forEach(eventType => {
          expect(isValidEventType(eventType)).toBe(true);
        });
      });

      it('should return true for valid user event types', () => {
        Object.values(UserEventTypes).forEach(eventType => {
          expect(isValidEventType(eventType)).toBe(true);
        });
      });

      it('should return true for valid gamification event types', () => {
        Object.values(GamificationEventTypes).forEach(eventType => {
          expect(isValidEventType(eventType)).toBe(true);
        });
      });

      it('should return false for invalid event types', () => {
        expect(isValidEventType('INVALID_EVENT_TYPE')).toBe(false);
        expect(isValidEventType('')).toBe(false);
        expect(isValidEventType('HEALTH_INVALID')).toBe(false);
      });
    });

    describe('getJourneyForEventType', () => {
      it('should return HEALTH journey for health event types', () => {
        Object.values(HealthEventTypes).forEach(eventType => {
          expect(getJourneyForEventType(eventType)).toBe(JourneyTypes.HEALTH);
        });
      });

      it('should return CARE journey for care event types', () => {
        Object.values(CareEventTypes).forEach(eventType => {
          expect(getJourneyForEventType(eventType)).toBe(JourneyTypes.CARE);
        });
      });

      it('should return PLAN journey for plan event types', () => {
        Object.values(PlanEventTypes).forEach(eventType => {
          expect(getJourneyForEventType(eventType)).toBe(JourneyTypes.PLAN);
        });
      });

      it('should return CROSS_JOURNEY for user event types', () => {
        Object.values(UserEventTypes).forEach(eventType => {
          expect(getJourneyForEventType(eventType)).toBe(JourneyTypes.CROSS_JOURNEY);
        });
      });

      it('should return CROSS_JOURNEY for gamification event types', () => {
        Object.values(GamificationEventTypes).forEach(eventType => {
          expect(getJourneyForEventType(eventType)).toBe(JourneyTypes.CROSS_JOURNEY);
        });
      });

      it('should return CROSS_JOURNEY for unknown event types', () => {
        expect(getJourneyForEventType('UNKNOWN_EVENT_TYPE')).toBe(JourneyTypes.CROSS_JOURNEY);
      });
    });
  });

  describe('Type safety', () => {
    it('should define EventTypes as a union of all event type enums', () => {
      // This is a type-level test that ensures EventTypes is defined correctly
      // We can verify this by checking that variables of each enum type can be assigned to EventTypes
      
      // These type assertions verify at compile time that the types are compatible
      const healthEvent: EventTypes = HealthEventTypes.METRIC_RECORDED;
      const careEvent: EventTypes = CareEventTypes.APPOINTMENT_BOOKED;
      const planEvent: EventTypes = PlanEventTypes.CLAIM_SUBMITTED;
      const userEvent: EventTypes = UserEventTypes.PROFILE_UPDATED;
      const gameEvent: EventTypes = GamificationEventTypes.ACHIEVEMENT_UNLOCKED;
      
      // Runtime assertions to prevent the variables from being optimized away
      expect(healthEvent).toBeDefined();
      expect(careEvent).toBeDefined();
      expect(planEvent).toBeDefined();
      expect(userEvent).toBeDefined();
      expect(gameEvent).toBeDefined();
    });
  });
});