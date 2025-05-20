import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';

describe('Event Type Constants', () => {
  describe('Naming Pattern Validation', () => {
    it('should follow the JOURNEY_ACTION_VERB naming pattern for all event types', () => {
      // Get all event type values
      const eventTypeValues = Object.values(EventType);
      
      // Check each event type follows the pattern
      eventTypeValues.forEach(eventType => {
        // Skip if not a string (in case there are numeric enum values)
        if (typeof eventType !== 'string') return;
        
        // Check pattern: JOURNEY_ACTION_VERB
        const pattern = /^[A-Z]+_[A-Z_]+$/;
        expect(eventType).toMatch(pattern);
        
        // Check that it has at least one underscore
        expect(eventType.includes('_')).toBe(true);
        
        // Check that journey prefix is one of the expected values
        const journeyPrefix = eventType.split('_')[0];
        expect(['HEALTH', 'CARE', 'PLAN', 'GAMIFICATION', 'USER']).toContain(journeyPrefix);
      });
    });
    
    it('should have consistent naming patterns within each journey', () => {
      // Health journey events should start with HEALTH_
      Object.values(JourneyEvents.Health).forEach(eventType => {
        expect(String(eventType)).toMatch(/^HEALTH_/);
      });
      
      // Care journey events should start with CARE_
      Object.values(JourneyEvents.Care).forEach(eventType => {
        expect(String(eventType)).toMatch(/^CARE_/);
      });
      
      // Plan journey events should start with PLAN_
      Object.values(JourneyEvents.Plan).forEach(eventType => {
        expect(String(eventType)).toMatch(/^PLAN_/);
      });
      
      // Gamification events should start with GAMIFICATION_
      Object.values(JourneyEvents.Gamification).forEach(eventType => {
        expect(String(eventType)).toMatch(/^GAMIFICATION_/);
      });
      
      // User events should start with USER_
      Object.values(JourneyEvents.User).forEach(eventType => {
        expect(String(eventType)).toMatch(/^USER_/);
      });
    });
  });
  
  describe('Journey Grouping Validation', () => {
    it('should correctly group health journey events', () => {
      // All health events from the main enum should be included in the Health namespace
      const healthEventsFromEnum = Object.values(EventType)
        .filter(type => typeof type === 'string' && type.startsWith('HEALTH_'));
      
      const healthEventsFromNamespace = Object.values(JourneyEvents.Health);
      
      expect(healthEventsFromEnum.length).toBe(healthEventsFromNamespace.length);
      
      // Each health event in the main enum should be in the namespace
      healthEventsFromEnum.forEach(event => {
        expect(healthEventsFromNamespace).toContain(event);
      });
    });
    
    it('should correctly group care journey events', () => {
      // All care events from the main enum should be included in the Care namespace
      const careEventsFromEnum = Object.values(EventType)
        .filter(type => typeof type === 'string' && type.startsWith('CARE_'));
      
      const careEventsFromNamespace = Object.values(JourneyEvents.Care);
      
      expect(careEventsFromEnum.length).toBe(careEventsFromNamespace.length);
      
      // Each care event in the main enum should be in the namespace
      careEventsFromEnum.forEach(event => {
        expect(careEventsFromNamespace).toContain(event);
      });
    });
    
    it('should correctly group plan journey events', () => {
      // All plan events from the main enum should be included in the Plan namespace
      const planEventsFromEnum = Object.values(EventType)
        .filter(type => typeof type === 'string' && type.startsWith('PLAN_'));
      
      const planEventsFromNamespace = Object.values(JourneyEvents.Plan);
      
      expect(planEventsFromEnum.length).toBe(planEventsFromNamespace.length);
      
      // Each plan event in the main enum should be in the namespace
      planEventsFromEnum.forEach(event => {
        expect(planEventsFromNamespace).toContain(event);
      });
    });
    
    it('should correctly group gamification events', () => {
      // All gamification events from the main enum should be included in the Gamification namespace
      const gamificationEventsFromEnum = Object.values(EventType)
        .filter(type => typeof type === 'string' && type.startsWith('GAMIFICATION_'));
      
      const gamificationEventsFromNamespace = Object.values(JourneyEvents.Gamification);
      
      expect(gamificationEventsFromEnum.length).toBe(gamificationEventsFromNamespace.length);
      
      // Each gamification event in the main enum should be in the namespace
      gamificationEventsFromEnum.forEach(event => {
        expect(gamificationEventsFromNamespace).toContain(event);
      });
    });
    
    it('should correctly group user events', () => {
      // All user events from the main enum should be included in the User namespace
      const userEventsFromEnum = Object.values(EventType)
        .filter(type => typeof type === 'string' && type.startsWith('USER_'));
      
      const userEventsFromNamespace = Object.values(JourneyEvents.User);
      
      expect(userEventsFromEnum.length).toBe(userEventsFromNamespace.length);
      
      // Each user event in the main enum should be in the namespace
      userEventsFromEnum.forEach(event => {
        expect(userEventsFromNamespace).toContain(event);
      });
    });
  });
  
  describe('Event Type Coverage', () => {
    it('should have complete coverage of health journey events', () => {
      // Check that all expected health event types are defined
      const expectedHealthEvents = [
        'HEALTH_METRIC_RECORDED',
        'HEALTH_GOAL_ACHIEVED',
        'HEALTH_GOAL_CREATED',
        'HEALTH_DEVICE_CONNECTED',
        'HEALTH_INSIGHT_GENERATED',
        'HEALTH_ASSESSMENT_COMPLETED'
      ];
      
      expectedHealthEvents.forEach(eventType => {
        expect(EventType[eventType]).toBeDefined();
        expect(EventType[eventType]).toBe(eventType);
      });
      
      // Check that the Health namespace has all these events
      const healthNamespaceKeys = Object.keys(JourneyEvents.Health);
      expect(healthNamespaceKeys.length).toBe(expectedHealthEvents.length);
    });
    
    it('should have complete coverage of care journey events', () => {
      // Check that all expected care event types are defined
      const expectedCareEvents = [
        'CARE_APPOINTMENT_BOOKED',
        'CARE_APPOINTMENT_COMPLETED',
        'CARE_MEDICATION_TAKEN',
        'CARE_TELEMEDICINE_STARTED',
        'CARE_TELEMEDICINE_COMPLETED',
        'CARE_PLAN_CREATED',
        'CARE_PLAN_TASK_COMPLETED'
      ];
      
      expectedCareEvents.forEach(eventType => {
        expect(EventType[eventType]).toBeDefined();
        expect(EventType[eventType]).toBe(eventType);
      });
      
      // Check that the Care namespace has all these events
      const careNamespaceKeys = Object.keys(JourneyEvents.Care);
      expect(careNamespaceKeys.length).toBe(expectedCareEvents.length);
    });
    
    it('should have complete coverage of plan journey events', () => {
      // Check that all expected plan event types are defined
      const expectedPlanEvents = [
        'PLAN_CLAIM_SUBMITTED',
        'PLAN_CLAIM_PROCESSED',
        'PLAN_SELECTED',
        'PLAN_BENEFIT_UTILIZED',
        'PLAN_REWARD_REDEEMED',
        'PLAN_DOCUMENT_COMPLETED'
      ];
      
      expectedPlanEvents.forEach(eventType => {
        expect(EventType[eventType]).toBeDefined();
        expect(EventType[eventType]).toBe(eventType);
      });
      
      // Check that the Plan namespace has all these events
      const planNamespaceKeys = Object.keys(JourneyEvents.Plan);
      expect(planNamespaceKeys.length).toBe(expectedPlanEvents.length);
    });
    
    it('should have complete coverage of gamification events', () => {
      // Check that all expected gamification event types are defined
      const expectedGamificationEvents = [
        'GAMIFICATION_POINTS_EARNED',
        'GAMIFICATION_ACHIEVEMENT_UNLOCKED',
        'GAMIFICATION_LEVEL_UP',
        'GAMIFICATION_QUEST_COMPLETED'
      ];
      
      expectedGamificationEvents.forEach(eventType => {
        expect(EventType[eventType]).toBeDefined();
        expect(EventType[eventType]).toBe(eventType);
      });
      
      // Check that the Gamification namespace has all these events
      const gamificationNamespaceKeys = Object.keys(JourneyEvents.Gamification);
      expect(gamificationNamespaceKeys.length).toBe(expectedGamificationEvents.length);
    });
    
    it('should have complete coverage of user events', () => {
      // Check that all expected user event types are defined
      const expectedUserEvents = [
        'USER_PROFILE_COMPLETED',
        'USER_LOGIN',
        'USER_ONBOARDING_COMPLETED',
        'USER_FEEDBACK_SUBMITTED'
      ];
      
      expectedUserEvents.forEach(eventType => {
        expect(EventType[eventType]).toBeDefined();
        expect(EventType[eventType]).toBe(eventType);
      });
      
      // Check that the User namespace has all these events
      const userNamespaceKeys = Object.keys(JourneyEvents.User);
      expect(userNamespaceKeys.length).toBe(expectedUserEvents.length);
    });
  });
  
  describe('Type Safety Validation', () => {
    it('should provide type-safe access to event types', () => {
      // Verify that we can access event types in a type-safe manner
      const healthEvent: EventType = EventType.HEALTH_METRIC_RECORDED;
      expect(healthEvent).toBe('HEALTH_METRIC_RECORDED');
      
      const careEvent: EventType = EventType.CARE_APPOINTMENT_BOOKED;
      expect(careEvent).toBe('CARE_APPOINTMENT_BOOKED');
      
      const planEvent: EventType = EventType.PLAN_CLAIM_SUBMITTED;
      expect(planEvent).toBe('PLAN_CLAIM_SUBMITTED');
      
      const gamificationEvent: EventType = EventType.GAMIFICATION_POINTS_EARNED;
      expect(gamificationEvent).toBe('GAMIFICATION_POINTS_EARNED');
      
      const userEvent: EventType = EventType.USER_LOGIN;
      expect(userEvent).toBe('USER_LOGIN');
    });
    
    it('should provide type-safe access to journey-specific event types', () => {
      // Verify that we can access journey-specific event types in a type-safe manner
      const healthEvent: JourneyEvents.Health = JourneyEvents.Health.METRIC_RECORDED;
      expect(healthEvent).toBe(EventType.HEALTH_METRIC_RECORDED);
      
      const careEvent: JourneyEvents.Care = JourneyEvents.Care.APPOINTMENT_BOOKED;
      expect(careEvent).toBe(EventType.CARE_APPOINTMENT_BOOKED);
      
      const planEvent: JourneyEvents.Plan = JourneyEvents.Plan.CLAIM_SUBMITTED;
      expect(planEvent).toBe(EventType.PLAN_CLAIM_SUBMITTED);
      
      const gamificationEvent: JourneyEvents.Gamification = JourneyEvents.Gamification.POINTS_EARNED;
      expect(gamificationEvent).toBe(EventType.GAMIFICATION_POINTS_EARNED);
      
      const userEvent: JourneyEvents.User = JourneyEvents.User.LOGIN;
      expect(userEvent).toBe(EventType.USER_LOGIN);
    });
  });
  
  describe('Event Type Consistency', () => {
    it('should have consistent event type values between enum and namespace', () => {
      // Health journey
      expect(JourneyEvents.Health.METRIC_RECORDED).toBe(EventType.HEALTH_METRIC_RECORDED);
      expect(JourneyEvents.Health.GOAL_ACHIEVED).toBe(EventType.HEALTH_GOAL_ACHIEVED);
      expect(JourneyEvents.Health.GOAL_CREATED).toBe(EventType.HEALTH_GOAL_CREATED);
      expect(JourneyEvents.Health.DEVICE_CONNECTED).toBe(EventType.HEALTH_DEVICE_CONNECTED);
      expect(JourneyEvents.Health.INSIGHT_GENERATED).toBe(EventType.HEALTH_INSIGHT_GENERATED);
      expect(JourneyEvents.Health.ASSESSMENT_COMPLETED).toBe(EventType.HEALTH_ASSESSMENT_COMPLETED);
      
      // Care journey
      expect(JourneyEvents.Care.APPOINTMENT_BOOKED).toBe(EventType.CARE_APPOINTMENT_BOOKED);
      expect(JourneyEvents.Care.APPOINTMENT_COMPLETED).toBe(EventType.CARE_APPOINTMENT_COMPLETED);
      expect(JourneyEvents.Care.MEDICATION_TAKEN).toBe(EventType.CARE_MEDICATION_TAKEN);
      expect(JourneyEvents.Care.TELEMEDICINE_STARTED).toBe(EventType.CARE_TELEMEDICINE_STARTED);
      expect(JourneyEvents.Care.TELEMEDICINE_COMPLETED).toBe(EventType.CARE_TELEMEDICINE_COMPLETED);
      expect(JourneyEvents.Care.PLAN_CREATED).toBe(EventType.CARE_PLAN_CREATED);
      expect(JourneyEvents.Care.PLAN_TASK_COMPLETED).toBe(EventType.CARE_PLAN_TASK_COMPLETED);
      
      // Plan journey
      expect(JourneyEvents.Plan.CLAIM_SUBMITTED).toBe(EventType.PLAN_CLAIM_SUBMITTED);
      expect(JourneyEvents.Plan.CLAIM_PROCESSED).toBe(EventType.PLAN_CLAIM_PROCESSED);
      expect(JourneyEvents.Plan.PLAN_SELECTED).toBe(EventType.PLAN_SELECTED);
      expect(JourneyEvents.Plan.BENEFIT_UTILIZED).toBe(EventType.PLAN_BENEFIT_UTILIZED);
      expect(JourneyEvents.Plan.REWARD_REDEEMED).toBe(EventType.PLAN_REWARD_REDEEMED);
      expect(JourneyEvents.Plan.DOCUMENT_COMPLETED).toBe(EventType.PLAN_DOCUMENT_COMPLETED);
      
      // Gamification
      expect(JourneyEvents.Gamification.POINTS_EARNED).toBe(EventType.GAMIFICATION_POINTS_EARNED);
      expect(JourneyEvents.Gamification.ACHIEVEMENT_UNLOCKED).toBe(EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED);
      expect(JourneyEvents.Gamification.LEVEL_UP).toBe(EventType.GAMIFICATION_LEVEL_UP);
      expect(JourneyEvents.Gamification.QUEST_COMPLETED).toBe(EventType.GAMIFICATION_QUEST_COMPLETED);
      
      // User
      expect(JourneyEvents.User.PROFILE_COMPLETED).toBe(EventType.USER_PROFILE_COMPLETED);
      expect(JourneyEvents.User.LOGIN).toBe(EventType.USER_LOGIN);
      expect(JourneyEvents.User.ONBOARDING_COMPLETED).toBe(EventType.USER_ONBOARDING_COMPLETED);
      expect(JourneyEvents.User.FEEDBACK_SUBMITTED).toBe(EventType.USER_FEEDBACK_SUBMITTED);
    });
  });
});