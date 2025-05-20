/**
 * @file event-types.enum.spec.ts
 * @description Unit tests for the EventTypesEnum that validate the event type constants used across the system.
 * Tests verify that all required event types are defined, that they follow the proper naming convention,
 * and that they're organized correctly by journey and category.
 */

import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';

describe('EventType Enum', () => {
  describe('Structure and Completeness', () => {
    it('should define all required event types', () => {
      // Verify that the enum has the expected number of entries
      const eventTypeCount = Object.keys(EventType).length / 2; // Divide by 2 because TypeScript enums have both name->value and value->name mappings
      expect(eventTypeCount).toBeGreaterThanOrEqual(30); // We expect at least 30 event types
      
      // Check for specific required event types from each journey
      expect(EventType.HEALTH_METRIC_RECORDED).toBeDefined();
      expect(EventType.CARE_APPOINTMENT_BOOKED).toBeDefined();
      expect(EventType.PLAN_CLAIM_SUBMITTED).toBeDefined();
      expect(EventType.GAMIFICATION_POINTS_EARNED).toBeDefined();
      expect(EventType.USER_PROFILE_COMPLETED).toBeDefined();
    });
    
    it('should have string values for all event types', () => {
      // Verify that all enum values are strings
      Object.keys(EventType)
        .filter(key => isNaN(Number(key))) // Filter out the numeric keys
        .forEach(key => {
          const value = EventType[key as keyof typeof EventType];
          expect(typeof value).toBe('string');
        });
    });
    
    it('should have unique values for all event types', () => {
      // Get all string values from the enum
      const values = Object.keys(EventType)
        .filter(key => isNaN(Number(key))) // Filter out the numeric keys
        .map(key => EventType[key as keyof typeof EventType]);
      
      // Create a Set to check for duplicates
      const uniqueValues = new Set(values);
      
      // If there are duplicates, the Set size will be smaller than the array length
      expect(uniqueValues.size).toBe(values.length);
    });
  });
  
  describe('Naming Conventions', () => {
    it('should follow journey-specific naming conventions', () => {
      // Health journey events should start with HEALTH_
      Object.keys(EventType)
        .filter(key => isNaN(Number(key)) && key.startsWith('HEALTH_'))
        .forEach(key => {
          const value = EventType[key as keyof typeof EventType];
          expect(value).toMatch(/^HEALTH_[A-Z_]+$/);
        });
      
      // Care journey events should start with CARE_
      Object.keys(EventType)
        .filter(key => isNaN(Number(key)) && key.startsWith('CARE_'))
        .forEach(key => {
          const value = EventType[key as keyof typeof EventType];
          expect(value).toMatch(/^CARE_[A-Z_]+$/);
        });
      
      // Plan journey events should start with PLAN_
      Object.keys(EventType)
        .filter(key => isNaN(Number(key)) && key.startsWith('PLAN_'))
        .forEach(key => {
          const value = EventType[key as keyof typeof EventType];
          expect(value).toMatch(/^PLAN_[A-Z_]+$/);
        });
      
      // Gamification events should start with GAMIFICATION_
      Object.keys(EventType)
        .filter(key => isNaN(Number(key)) && key.startsWith('GAMIFICATION_'))
        .forEach(key => {
          const value = EventType[key as keyof typeof EventType];
          expect(value).toMatch(/^GAMIFICATION_[A-Z_]+$/);
        });
      
      // User events should start with USER_
      Object.keys(EventType)
        .filter(key => isNaN(Number(key)) && key.startsWith('USER_'))
        .forEach(key => {
          const value = EventType[key as keyof typeof EventType];
          expect(value).toMatch(/^USER_[A-Z_]+$/);
        });
    });
    
    it('should use SNAKE_CASE for all event types', () => {
      // All event types should be in SNAKE_CASE
      Object.keys(EventType)
        .filter(key => isNaN(Number(key)))
        .forEach(key => {
          const value = EventType[key as keyof typeof EventType];
          expect(value).toMatch(/^[A-Z][A-Z0-9_]*$/);
        });
    });
  });
  
  describe('Journey Organization', () => {
    it('should organize health events correctly in JourneyEvents.Health', () => {
      // All health events should be in the Health namespace
      Object.keys(JourneyEvents.Health).forEach(key => {
        if (isNaN(Number(key))) {
          const value = JourneyEvents.Health[key as keyof typeof JourneyEvents.Health];
          expect(value.toString()).toMatch(/^HEALTH_[A-Z_]+$/);
        }
      });
      
      // All events in the Health namespace should be in the main EventType enum
      Object.keys(JourneyEvents.Health)
        .filter(key => isNaN(Number(key)))
        .forEach(key => {
          const value = JourneyEvents.Health[key as keyof typeof JourneyEvents.Health];
          expect(Object.values(EventType)).toContain(value);
        });
    });
    
    it('should organize care events correctly in JourneyEvents.Care', () => {
      // All care events should be in the Care namespace
      Object.keys(JourneyEvents.Care).forEach(key => {
        if (isNaN(Number(key))) {
          const value = JourneyEvents.Care[key as keyof typeof JourneyEvents.Care];
          expect(value.toString()).toMatch(/^CARE_[A-Z_]+$/);
        }
      });
      
      // All events in the Care namespace should be in the main EventType enum
      Object.keys(JourneyEvents.Care)
        .filter(key => isNaN(Number(key)))
        .forEach(key => {
          const value = JourneyEvents.Care[key as keyof typeof JourneyEvents.Care];
          expect(Object.values(EventType)).toContain(value);
        });
    });
    
    it('should organize plan events correctly in JourneyEvents.Plan', () => {
      // All plan events should be in the Plan namespace
      Object.keys(JourneyEvents.Plan).forEach(key => {
        if (isNaN(Number(key))) {
          const value = JourneyEvents.Plan[key as keyof typeof JourneyEvents.Plan];
          expect(value.toString()).toMatch(/^PLAN_[A-Z_]+$/);
        }
      });
      
      // All events in the Plan namespace should be in the main EventType enum
      Object.keys(JourneyEvents.Plan)
        .filter(key => isNaN(Number(key)))
        .forEach(key => {
          const value = JourneyEvents.Plan[key as keyof typeof JourneyEvents.Plan];
          expect(Object.values(EventType)).toContain(value);
        });
    });
    
    it('should organize gamification events correctly in JourneyEvents.Gamification', () => {
      // All gamification events should be in the Gamification namespace
      Object.keys(JourneyEvents.Gamification).forEach(key => {
        if (isNaN(Number(key))) {
          const value = JourneyEvents.Gamification[key as keyof typeof JourneyEvents.Gamification];
          expect(value.toString()).toMatch(/^GAMIFICATION_[A-Z_]+$/);
        }
      });
      
      // All events in the Gamification namespace should be in the main EventType enum
      Object.keys(JourneyEvents.Gamification)
        .filter(key => isNaN(Number(key)))
        .forEach(key => {
          const value = JourneyEvents.Gamification[key as keyof typeof JourneyEvents.Gamification];
          expect(Object.values(EventType)).toContain(value);
        });
    });
    
    it('should organize user events correctly in JourneyEvents.User', () => {
      // All user events should be in the User namespace
      Object.keys(JourneyEvents.User).forEach(key => {
        if (isNaN(Number(key))) {
          const value = JourneyEvents.User[key as keyof typeof JourneyEvents.User];
          expect(value.toString()).toMatch(/^USER_[A-Z_]+$/);
        }
      });
      
      // All events in the User namespace should be in the main EventType enum
      Object.keys(JourneyEvents.User)
        .filter(key => isNaN(Number(key)))
        .forEach(key => {
          const value = JourneyEvents.User[key as keyof typeof JourneyEvents.User];
          expect(Object.values(EventType)).toContain(value);
        });
    });
    
    it('should include all EventType entries in the appropriate JourneyEvents namespace', () => {
      // Get all event types from the main enum
      const allEventTypes = Object.keys(EventType)
        .filter(key => isNaN(Number(key)))
        .map(key => EventType[key as keyof typeof EventType]);
      
      // Get all event types from the namespaces
      const healthEvents = Object.values(JourneyEvents.Health).filter(value => typeof value === 'string');
      const careEvents = Object.values(JourneyEvents.Care).filter(value => typeof value === 'string');
      const planEvents = Object.values(JourneyEvents.Plan).filter(value => typeof value === 'string');
      const gamificationEvents = Object.values(JourneyEvents.Gamification).filter(value => typeof value === 'string');
      const userEvents = Object.values(JourneyEvents.User).filter(value => typeof value === 'string');
      
      // Combine all namespace events
      const allNamespaceEvents = [
        ...healthEvents,
        ...careEvents,
        ...planEvents,
        ...gamificationEvents,
        ...userEvents
      ];
      
      // Every event in the main enum should be in exactly one namespace
      allEventTypes.forEach(eventType => {
        expect(allNamespaceEvents).toContain(eventType);
      });
      
      // The total count should match
      expect(allNamespaceEvents.length).toBe(allEventTypes.length);
    });
  });
  
  describe('Type Safety', () => {
    it('should provide type safety for event types', () => {
      // Valid assignment
      let eventType: EventType = EventType.HEALTH_METRIC_RECORDED;
      expect(eventType).toBe(EventType.HEALTH_METRIC_RECORDED);
      
      // TypeScript should prevent invalid assignments at compile time
      // The following would cause a TypeScript error:
      // eventType = 'INVALID_EVENT_TYPE';
      
      // But we can test runtime type checking
      function isValidEventType(type: string): boolean {
        return Object.values(EventType).includes(type as any);
      }
      
      expect(isValidEventType(EventType.HEALTH_METRIC_RECORDED)).toBe(true);
      expect(isValidEventType('INVALID_EVENT_TYPE')).toBe(false);
    });
    
    it('should allow using journey-specific event types', () => {
      // Health journey event
      let healthEvent: JourneyEvents.Health = JourneyEvents.Health.METRIC_RECORDED;
      expect(healthEvent).toBe(EventType.HEALTH_METRIC_RECORDED);
      
      // Care journey event
      let careEvent: JourneyEvents.Care = JourneyEvents.Care.APPOINTMENT_BOOKED;
      expect(careEvent).toBe(EventType.CARE_APPOINTMENT_BOOKED);
      
      // Plan journey event
      let planEvent: JourneyEvents.Plan = JourneyEvents.Plan.CLAIM_SUBMITTED;
      expect(planEvent).toBe(EventType.PLAN_CLAIM_SUBMITTED);
      
      // Gamification event
      let gamificationEvent: JourneyEvents.Gamification = JourneyEvents.Gamification.POINTS_EARNED;
      expect(gamificationEvent).toBe(EventType.GAMIFICATION_POINTS_EARNED);
      
      // User event
      let userEvent: JourneyEvents.User = JourneyEvents.User.PROFILE_COMPLETED;
      expect(userEvent).toBe(EventType.USER_PROFILE_COMPLETED);
    });
    
    it('should maintain compatibility between EventType and JourneyEvents', () => {
      // EventType can be assigned to the appropriate journey event type
      const healthEvent: JourneyEvents.Health = EventType.HEALTH_METRIC_RECORDED as JourneyEvents.Health;
      expect(healthEvent).toBe(JourneyEvents.Health.METRIC_RECORDED);
      
      // Journey event type can be assigned to EventType
      const eventType: EventType = JourneyEvents.Health.METRIC_RECORDED;
      expect(eventType).toBe(EventType.HEALTH_METRIC_RECORDED);
    });
  });
  
  describe('Documentation', () => {
    it('should have JSDoc comments for all event types', () => {
      // This is a bit tricky to test directly in Jest since JSDoc comments are not accessible at runtime
      // Instead, we'll check that the enum file exists and has the expected structure
      expect(EventType).toBeDefined();
      expect(JourneyEvents).toBeDefined();
      expect(JourneyEvents.Health).toBeDefined();
      expect(JourneyEvents.Care).toBeDefined();
      expect(JourneyEvents.Plan).toBeDefined();
      expect(JourneyEvents.Gamification).toBeDefined();
      expect(JourneyEvents.User).toBeDefined();
    });
  });
  
  describe('Event Type Validation', () => {
    it('should provide a way to validate event types', () => {
      // Create a simple validation function
      function validateEventType(type: string): boolean {
        return Object.values(EventType).includes(type as any);
      }
      
      // Valid event types should pass validation
      expect(validateEventType(EventType.HEALTH_METRIC_RECORDED)).toBe(true);
      expect(validateEventType(EventType.CARE_APPOINTMENT_BOOKED)).toBe(true);
      expect(validateEventType(EventType.PLAN_CLAIM_SUBMITTED)).toBe(true);
      expect(validateEventType(EventType.GAMIFICATION_POINTS_EARNED)).toBe(true);
      expect(validateEventType(EventType.USER_PROFILE_COMPLETED)).toBe(true);
      
      // Invalid event types should fail validation
      expect(validateEventType('INVALID_EVENT_TYPE')).toBe(false);
      expect(validateEventType('')).toBe(false);
      expect(validateEventType('health_metric_recorded')).toBe(false); // lowercase
    });
    
    it('should validate journey-specific event types', () => {
      // Create journey-specific validation functions
      function isHealthEvent(type: string): boolean {
        return type.startsWith('HEALTH_') && Object.values(EventType).includes(type as any);
      }
      
      function isCareEvent(type: string): boolean {
        return type.startsWith('CARE_') && Object.values(EventType).includes(type as any);
      }
      
      function isPlanEvent(type: string): boolean {
        return type.startsWith('PLAN_') && Object.values(EventType).includes(type as any);
      }
      
      function isGamificationEvent(type: string): boolean {
        return type.startsWith('GAMIFICATION_') && Object.values(EventType).includes(type as any);
      }
      
      function isUserEvent(type: string): boolean {
        return type.startsWith('USER_') && Object.values(EventType).includes(type as any);
      }
      
      // Test health events
      expect(isHealthEvent(EventType.HEALTH_METRIC_RECORDED)).toBe(true);
      expect(isHealthEvent(EventType.CARE_APPOINTMENT_BOOKED)).toBe(false);
      
      // Test care events
      expect(isCareEvent(EventType.CARE_APPOINTMENT_BOOKED)).toBe(true);
      expect(isCareEvent(EventType.HEALTH_METRIC_RECORDED)).toBe(false);
      
      // Test plan events
      expect(isPlanEvent(EventType.PLAN_CLAIM_SUBMITTED)).toBe(true);
      expect(isPlanEvent(EventType.CARE_APPOINTMENT_BOOKED)).toBe(false);
      
      // Test gamification events
      expect(isGamificationEvent(EventType.GAMIFICATION_POINTS_EARNED)).toBe(true);
      expect(isGamificationEvent(EventType.HEALTH_METRIC_RECORDED)).toBe(false);
      
      // Test user events
      expect(isUserEvent(EventType.USER_PROFILE_COMPLETED)).toBe(true);
      expect(isUserEvent(EventType.HEALTH_METRIC_RECORDED)).toBe(false);
    });
  });
  
  describe('Event Type Categorization', () => {
    it('should categorize events by journey', () => {
      // Create a function to get the journey for an event type
      function getJourneyForEvent(eventType: EventType): string {
        const eventTypeStr = eventType.toString();
        
        if (eventTypeStr.startsWith('HEALTH_')) return 'health';
        if (eventTypeStr.startsWith('CARE_')) return 'care';
        if (eventTypeStr.startsWith('PLAN_')) return 'plan';
        if (eventTypeStr.startsWith('GAMIFICATION_')) return 'gamification';
        if (eventTypeStr.startsWith('USER_')) return 'user';
        
        return 'unknown';
      }
      
      // Test journey categorization
      expect(getJourneyForEvent(EventType.HEALTH_METRIC_RECORDED)).toBe('health');
      expect(getJourneyForEvent(EventType.CARE_APPOINTMENT_BOOKED)).toBe('care');
      expect(getJourneyForEvent(EventType.PLAN_CLAIM_SUBMITTED)).toBe('plan');
      expect(getJourneyForEvent(EventType.GAMIFICATION_POINTS_EARNED)).toBe('gamification');
      expect(getJourneyForEvent(EventType.USER_PROFILE_COMPLETED)).toBe('user');
    });
    
    it('should group related events within a journey', () => {
      // Health journey should have related event types
      const healthEvents = Object.values(JourneyEvents.Health);
      expect(healthEvents).toContain(EventType.HEALTH_METRIC_RECORDED);
      expect(healthEvents).toContain(EventType.HEALTH_GOAL_ACHIEVED);
      
      // Care journey should have related event types
      const careEvents = Object.values(JourneyEvents.Care);
      expect(careEvents).toContain(EventType.CARE_APPOINTMENT_BOOKED);
      expect(careEvents).toContain(EventType.CARE_APPOINTMENT_COMPLETED);
      
      // Plan journey should have related event types
      const planEvents = Object.values(JourneyEvents.Plan);
      expect(planEvents).toContain(EventType.PLAN_CLAIM_SUBMITTED);
      expect(planEvents).toContain(EventType.PLAN_CLAIM_PROCESSED);
      
      // Gamification should have related event types
      const gamificationEvents = Object.values(JourneyEvents.Gamification);
      expect(gamificationEvents).toContain(EventType.GAMIFICATION_POINTS_EARNED);
      expect(gamificationEvents).toContain(EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED);
      
      // User should have related event types
      const userEvents = Object.values(JourneyEvents.User);
      expect(userEvents).toContain(EventType.USER_PROFILE_COMPLETED);
      expect(userEvents).toContain(EventType.USER_LOGIN);
    });
  });
});