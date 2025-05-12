import {
  HealthEventTypes,
  CareEventTypes,
  PlanEventTypes,
  UserEventTypes,
  GamificationEventTypes,
  JourneyEventTypes,
  isJourneyEvent,
  getJourneyEventTypes,
  EventType
} from '../../../src/constants/types.constants';

describe('Event Type Constants', () => {
  describe('Journey-specific event types', () => {
    it('should define health journey event types with correct naming pattern', () => {
      // All health event types should start with HEALTH_
      Object.values(HealthEventTypes).forEach(eventType => {
        expect(typeof eventType).toBe('string');
        expect(eventType).toMatch(/^HEALTH_[A-Z_]+$/);
      });

      // Check specific health events exist
      expect(HealthEventTypes.METRIC_RECORDED).toBe('HEALTH_METRIC_RECORDED');
      expect(HealthEventTypes.GOAL_ACHIEVED).toBe('HEALTH_GOAL_ACHIEVED');
      expect(HealthEventTypes.DEVICE_CONNECTED).toBe('HEALTH_DEVICE_CONNECTED');
    });

    it('should define care journey event types with correct naming pattern', () => {
      // All care event types should start with CARE_
      Object.values(CareEventTypes).forEach(eventType => {
        expect(typeof eventType).toBe('string');
        expect(eventType).toMatch(/^CARE_[A-Z_]+$/);
      });

      // Check specific care events exist
      expect(CareEventTypes.APPOINTMENT_BOOKED).toBe('CARE_APPOINTMENT_BOOKED');
      expect(CareEventTypes.MEDICATION_TAKEN).toBe('CARE_MEDICATION_TAKEN');
      expect(CareEventTypes.TELEMEDICINE_COMPLETED).toBe('CARE_TELEMEDICINE_COMPLETED');
    });

    it('should define plan journey event types with correct naming pattern', () => {
      // All plan event types should start with PLAN_
      Object.values(PlanEventTypes).forEach(eventType => {
        expect(typeof eventType).toBe('string');
        expect(eventType).toMatch(/^PLAN_[A-Z_]+$/);
      });

      // Check specific plan events exist
      expect(PlanEventTypes.CLAIM_SUBMITTED).toBe('PLAN_CLAIM_SUBMITTED');
      expect(PlanEventTypes.BENEFIT_UTILIZED).toBe('PLAN_BENEFIT_UTILIZED');
      expect(PlanEventTypes.PLAN_SELECTED).toBe('PLAN_PLAN_SELECTED');
    });

    it('should define user event types with correct naming pattern', () => {
      // All user event types should start with USER_
      Object.values(UserEventTypes).forEach(eventType => {
        expect(typeof eventType).toBe('string');
        expect(eventType).toMatch(/^USER_[A-Z_]+$/);
      });

      // Check specific user events exist
      expect(UserEventTypes.PROFILE_COMPLETED).toBe('USER_PROFILE_COMPLETED');
      expect(UserEventTypes.LOGGED_IN).toBe('USER_LOGGED_IN');
      expect(UserEventTypes.ONBOARDING_COMPLETED).toBe('USER_ONBOARDING_COMPLETED');
    });

    it('should define gamification event types with correct naming pattern', () => {
      // All gamification event types should start with GAMIFICATION_
      Object.values(GamificationEventTypes).forEach(eventType => {
        expect(typeof eventType).toBe('string');
        expect(eventType).toMatch(/^GAMIFICATION_[A-Z_]+$/);
      });

      // Check specific gamification events exist
      expect(GamificationEventTypes.ACHIEVEMENT_UNLOCKED).toBe('GAMIFICATION_ACHIEVEMENT_UNLOCKED');
      expect(GamificationEventTypes.XP_EARNED).toBe('GAMIFICATION_XP_EARNED');
      expect(GamificationEventTypes.QUEST_COMPLETED).toBe('GAMIFICATION_QUEST_COMPLETED');
    });
  });

  describe('Event type completeness', () => {
    it('should have a complete set of health journey events', () => {
      // Verify minimum number of health events
      expect(Object.keys(HealthEventTypes).length).toBeGreaterThanOrEqual(8);
      
      // Verify all expected health event categories are covered
      const healthEventValues = Object.values(HealthEventTypes);
      expect(healthEventValues).toContain('HEALTH_METRIC_RECORDED');
      expect(healthEventValues).toContain('HEALTH_GOAL_ACHIEVED');
      expect(healthEventValues).toContain('HEALTH_GOAL_CREATED');
      expect(healthEventValues).toContain('HEALTH_GOAL_PROGRESS');
      expect(healthEventValues).toContain('HEALTH_INSIGHT_GENERATED');
      expect(healthEventValues).toContain('HEALTH_DEVICE_CONNECTED');
      expect(healthEventValues).toContain('HEALTH_DEVICE_SYNCED');
      expect(healthEventValues).toContain('HEALTH_ASSESSMENT_COMPLETED');
    });

    it('should have a complete set of care journey events', () => {
      // Verify minimum number of care events
      expect(Object.keys(CareEventTypes).length).toBeGreaterThanOrEqual(11);
      
      // Verify all expected care event categories are covered
      const careEventValues = Object.values(CareEventTypes);
      expect(careEventValues).toContain('CARE_APPOINTMENT_BOOKED');
      expect(careEventValues).toContain('CARE_APPOINTMENT_CHECKED_IN');
      expect(careEventValues).toContain('CARE_APPOINTMENT_COMPLETED');
      expect(careEventValues).toContain('CARE_APPOINTMENT_CANCELLED');
      expect(careEventValues).toContain('CARE_MEDICATION_TAKEN');
      expect(careEventValues).toContain('CARE_MEDICATION_SKIPPED');
      expect(careEventValues).toContain('CARE_MEDICATION_ADDED');
      expect(careEventValues).toContain('CARE_TELEMEDICINE_JOINED');
      expect(careEventValues).toContain('CARE_TELEMEDICINE_COMPLETED');
      expect(careEventValues).toContain('CARE_PLAN_UPDATED');
      expect(careEventValues).toContain('CARE_PLAN_PROGRESS');
    });

    it('should have a complete set of plan journey events', () => {
      // Verify minimum number of plan events
      expect(Object.keys(PlanEventTypes).length).toBeGreaterThanOrEqual(8);
      
      // Verify all expected plan event categories are covered
      const planEventValues = Object.values(PlanEventTypes);
      expect(planEventValues).toContain('PLAN_CLAIM_SUBMITTED');
      expect(planEventValues).toContain('PLAN_CLAIM_STATUS_CHANGED');
      expect(planEventValues).toContain('PLAN_CLAIM_DOCUMENTS_UPLOADED');
      expect(planEventValues).toContain('PLAN_BENEFIT_UTILIZED');
      expect(planEventValues).toContain('PLAN_COVERAGE_VIEWED');
      expect(planEventValues).toContain('PLAN_PLANS_COMPARED');
      expect(planEventValues).toContain('PLAN_PLAN_SELECTED');
      expect(planEventValues).toContain('PLAN_REWARD_REDEEMED');
    });

    it('should have a complete set of user events', () => {
      // Verify minimum number of user events
      expect(Object.keys(UserEventTypes).length).toBeGreaterThanOrEqual(8);
      
      // Verify all expected user event categories are covered
      const userEventValues = Object.values(UserEventTypes);
      expect(userEventValues).toContain('USER_PROFILE_COMPLETED');
      expect(userEventValues).toContain('USER_PROFILE_UPDATED');
      expect(userEventValues).toContain('USER_LOGGED_IN');
      expect(userEventValues).toContain('USER_ONBOARDING_COMPLETED');
      expect(userEventValues).toContain('USER_NOTIFICATION_PREFERENCES_UPDATED');
      expect(userEventValues).toContain('USER_SOCIAL_ACCOUNT_CONNECTED');
      expect(userEventValues).toContain('USER_INVITATION_SENT');
      expect(userEventValues).toContain('USER_INVITATION_ACCEPTED');
    });

    it('should have a complete set of gamification events', () => {
      // Verify minimum number of gamification events
      expect(Object.keys(GamificationEventTypes).length).toBeGreaterThanOrEqual(8);
      
      // Verify all expected gamification event categories are covered
      const gamificationEventValues = Object.values(GamificationEventTypes);
      expect(gamificationEventValues).toContain('GAMIFICATION_XP_EARNED');
      expect(gamificationEventValues).toContain('GAMIFICATION_LEVEL_UP');
      expect(gamificationEventValues).toContain('GAMIFICATION_ACHIEVEMENT_UNLOCKED');
      expect(gamificationEventValues).toContain('GAMIFICATION_ACHIEVEMENT_PROGRESS');
      expect(gamificationEventValues).toContain('GAMIFICATION_QUEST_COMPLETED');
      expect(gamificationEventValues).toContain('GAMIFICATION_LEADERBOARD_POSITION_CHANGED');
      expect(gamificationEventValues).toContain('GAMIFICATION_REWARD_EARNED');
      expect(gamificationEventValues).toContain('GAMIFICATION_STREAK_UPDATED');
    });
  });

  describe('Event type grouping and utility functions', () => {
    it('should correctly group event types by journey', () => {
      // Verify JourneyEventTypes contains all journey types
      expect(JourneyEventTypes).toHaveProperty('health');
      expect(JourneyEventTypes).toHaveProperty('care');
      expect(JourneyEventTypes).toHaveProperty('plan');
      expect(JourneyEventTypes).toHaveProperty('user');
      expect(JourneyEventTypes).toHaveProperty('gamification');

      // Verify each journey maps to the correct enum
      expect(JourneyEventTypes.health).toBe(HealthEventTypes);
      expect(JourneyEventTypes.care).toBe(CareEventTypes);
      expect(JourneyEventTypes.plan).toBe(PlanEventTypes);
      expect(JourneyEventTypes.user).toBe(UserEventTypes);
      expect(JourneyEventTypes.gamification).toBe(GamificationEventTypes);
    });

    it('should correctly identify events belonging to a journey', () => {
      // Test health journey events
      expect(isJourneyEvent(HealthEventTypes.METRIC_RECORDED, 'health')).toBe(true);
      expect(isJourneyEvent(HealthEventTypes.GOAL_ACHIEVED, 'care')).toBe(false);

      // Test care journey events
      expect(isJourneyEvent(CareEventTypes.APPOINTMENT_BOOKED, 'care')).toBe(true);
      expect(isJourneyEvent(CareEventTypes.MEDICATION_TAKEN, 'health')).toBe(false);

      // Test plan journey events
      expect(isJourneyEvent(PlanEventTypes.CLAIM_SUBMITTED, 'plan')).toBe(true);
      expect(isJourneyEvent(PlanEventTypes.BENEFIT_UTILIZED, 'care')).toBe(false);

      // Test user events
      expect(isJourneyEvent(UserEventTypes.PROFILE_COMPLETED, 'user')).toBe(true);
      expect(isJourneyEvent(UserEventTypes.LOGGED_IN, 'plan')).toBe(false);

      // Test gamification events
      expect(isJourneyEvent(GamificationEventTypes.ACHIEVEMENT_UNLOCKED, 'gamification')).toBe(true);
      expect(isJourneyEvent(GamificationEventTypes.XP_EARNED, 'health')).toBe(false);
    });

    it('should retrieve all event types for a journey', () => {
      // Test getting health journey events
      const healthEvents = getJourneyEventTypes('health');
      expect(healthEvents).toContain(HealthEventTypes.METRIC_RECORDED);
      expect(healthEvents).toContain(HealthEventTypes.GOAL_ACHIEVED);
      expect(healthEvents.length).toBe(Object.keys(HealthEventTypes).length);

      // Test getting care journey events
      const careEvents = getJourneyEventTypes('care');
      expect(careEvents).toContain(CareEventTypes.APPOINTMENT_BOOKED);
      expect(careEvents).toContain(CareEventTypes.MEDICATION_TAKEN);
      expect(careEvents.length).toBe(Object.keys(CareEventTypes).length);

      // Test getting plan journey events
      const planEvents = getJourneyEventTypes('plan');
      expect(planEvents).toContain(PlanEventTypes.CLAIM_SUBMITTED);
      expect(planEvents).toContain(PlanEventTypes.BENEFIT_UTILIZED);
      expect(planEvents.length).toBe(Object.keys(PlanEventTypes).length);
    });
  });

  describe('Type safety and union types', () => {
    it('should allow EventType to be used for type-safe event handling', () => {
      // Create a function that accepts EventType
      const processEvent = (eventType: EventType): string => {
        // This switch should be exhaustive due to EventType union
        switch (eventType) {
          case HealthEventTypes.METRIC_RECORDED:
            return 'health metric';
          case CareEventTypes.APPOINTMENT_BOOKED:
            return 'care appointment';
          case PlanEventTypes.CLAIM_SUBMITTED:
            return 'plan claim';
          case UserEventTypes.PROFILE_COMPLETED:
            return 'user profile';
          case GamificationEventTypes.ACHIEVEMENT_UNLOCKED:
            return 'gamification achievement';
          default:
            // This should handle all other event types
            return 'other event';
        }
      };

      // Test with different event types
      expect(processEvent(HealthEventTypes.METRIC_RECORDED)).toBe('health metric');
      expect(processEvent(CareEventTypes.APPOINTMENT_BOOKED)).toBe('care appointment');
      expect(processEvent(PlanEventTypes.CLAIM_SUBMITTED)).toBe('plan claim');
      expect(processEvent(UserEventTypes.PROFILE_COMPLETED)).toBe('user profile');
      expect(processEvent(GamificationEventTypes.ACHIEVEMENT_UNLOCKED)).toBe('gamification achievement');
      expect(processEvent(HealthEventTypes.GOAL_ACHIEVED)).toBe('other event');
    });

    it('should ensure all event types follow the journey prefix pattern', () => {
      // Create a map of journey prefixes
      const journeyPrefixes = {
        health: 'HEALTH_',
        care: 'CARE_',
        plan: 'PLAN_',
        user: 'USER_',
        gamification: 'GAMIFICATION_'
      };

      // Check that all event types follow their journey prefix pattern
      Object.entries(JourneyEventTypes).forEach(([journey, eventEnum]) => {
        const prefix = journeyPrefixes[journey as keyof typeof journeyPrefixes];
        Object.values(eventEnum).forEach(eventType => {
          expect(eventType).toMatch(new RegExp(`^${prefix}[A-Z_]+$`));
        });
      });
    });
  });
});