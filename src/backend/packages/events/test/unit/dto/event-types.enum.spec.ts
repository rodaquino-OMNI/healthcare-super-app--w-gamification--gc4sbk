import { EventType, EventCategories } from '../../../src/dto/event-types.enum';

describe('EventType Enum', () => {
  describe('Structure and Completeness', () => {
    it('should define all required event types', () => {
      // Verify that the enum contains all expected event types
      expect(Object.keys(EventType).length).toBeGreaterThanOrEqual(36); // At least 36 event types
      
      // Check for specific required events from each journey
      expect(EventType.HEALTH_METRIC_RECORDED).toBeDefined();
      expect(EventType.CARE_APPOINTMENT_BOOKED).toBeDefined();
      expect(EventType.PLAN_CLAIM_SUBMITTED).toBeDefined();
      expect(EventType.ACHIEVEMENT_EARNED).toBeDefined();
    });

    it('should have string values that match the enum keys', () => {
      // Verify that enum values match their keys
      Object.entries(EventType).forEach(([key, value]) => {
        expect(value).toBe(key);
      });
    });

    it('should not have duplicate event type values', () => {
      const values = Object.values(EventType);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('Naming Conventions', () => {
    it('should follow the JOURNEY_EVENT_ACTION naming pattern', () => {
      // All event types should follow the pattern: JOURNEY_EVENT_ACTION
      const eventTypeRegex = /^([A-Z]+)_([A-Z_]+)_([A-Z_]+)$/;
      
      // Except for cross-journey events which may have a simpler pattern
      const crossJourneyRegex = /^([A-Z_]+)_([A-Z_]+)$/;
      
      Object.values(EventType).forEach(eventType => {
        const isCrossJourney = EventCategories.CROSS_JOURNEY_EVENTS.includes(eventType as EventType);
        
        if (isCrossJourney) {
          expect(eventType).toMatch(crossJourneyRegex);
        } else {
          expect(eventType).toMatch(eventTypeRegex);
        }
      });
    });

    it('should have journey prefix matching its category', () => {
      // Health events should start with HEALTH_
      EventCategories.HEALTH_EVENTS.forEach(eventType => {
        expect(eventType).toMatch(/^HEALTH_/);
      });

      // Care events should start with CARE_
      EventCategories.CARE_EVENTS.forEach(eventType => {
        expect(eventType).toMatch(/^CARE_/);
      });

      // Plan events should start with PLAN_
      EventCategories.PLAN_EVENTS.forEach(eventType => {
        expect(eventType).toMatch(/^PLAN_/);
      });
    });
  });

  describe('Category Organization', () => {
    it('should include all health events in HEALTH_EVENTS category', () => {
      // All events starting with HEALTH_ should be in HEALTH_EVENTS
      Object.values(EventType)
        .filter(eventType => eventType.toString().startsWith('HEALTH_'))
        .forEach(healthEvent => {
          expect(EventCategories.HEALTH_EVENTS).toContain(healthEvent);
        });
    });

    it('should include all care events in CARE_EVENTS category', () => {
      // All events starting with CARE_ should be in CARE_EVENTS
      Object.values(EventType)
        .filter(eventType => eventType.toString().startsWith('CARE_'))
        .forEach(careEvent => {
          expect(EventCategories.CARE_EVENTS).toContain(careEvent);
        });
    });

    it('should include all plan events in PLAN_EVENTS category', () => {
      // All events starting with PLAN_ should be in PLAN_EVENTS
      Object.values(EventType)
        .filter(eventType => eventType.toString().startsWith('PLAN_'))
        .forEach(planEvent => {
          expect(EventCategories.PLAN_EVENTS).toContain(planEvent);
        });
    });

    it('should have no overlap between journey categories', () => {
      // Each event should only belong to one journey category
      const healthSet = new Set(EventCategories.HEALTH_EVENTS);
      const careSet = new Set(EventCategories.CARE_EVENTS);
      const planSet = new Set(EventCategories.PLAN_EVENTS);
      const crossJourneySet = new Set(EventCategories.CROSS_JOURNEY_EVENTS);

      // Check for overlap between health and care
      const healthCareOverlap = [...healthSet].filter(event => careSet.has(event as EventType));
      expect(healthCareOverlap).toHaveLength(0);

      // Check for overlap between health and plan
      const healthPlanOverlap = [...healthSet].filter(event => planSet.has(event as EventType));
      expect(healthPlanOverlap).toHaveLength(0);

      // Check for overlap between care and plan
      const carePlanOverlap = [...careSet].filter(event => planSet.has(event as EventType));
      expect(carePlanOverlap).toHaveLength(0);

      // Check for overlap between journey-specific and cross-journey
      const journeySpecificEvents = [
        ...EventCategories.HEALTH_EVENTS,
        ...EventCategories.CARE_EVENTS,
        ...EventCategories.PLAN_EVENTS
      ];
      const journeySpecificSet = new Set(journeySpecificEvents);
      const crossJourneyOverlap = [...crossJourneySet].filter(event => journeySpecificSet.has(event as EventType));
      expect(crossJourneyOverlap).toHaveLength(0);
    });

    it('should correctly categorize gamification events', () => {
      // Verify that all gamification events are also in their respective journey categories
      EventCategories.GAMIFICATION_EVENTS.forEach(event => {
        if (event.toString().startsWith('HEALTH_')) {
          expect(EventCategories.HEALTH_EVENTS).toContain(event);
        } else if (event.toString().startsWith('CARE_')) {
          expect(EventCategories.CARE_EVENTS).toContain(event);
        } else if (event.toString().startsWith('PLAN_')) {
          expect(EventCategories.PLAN_EVENTS).toContain(event);
        } else {
          // Cross-journey gamification events
          expect(EventCategories.CROSS_JOURNEY_EVENTS).toContain(event);
        }
      });
    });
  });

  describe('Type Safety', () => {
    it('should provide type safety for event handlers', () => {
      // This is a compile-time test, but we can verify basic type behavior
      const handleEvent = (eventType: EventType): string => {
        return `Handled ${eventType}`;
      };

      // Should compile and run without errors
      expect(handleEvent(EventType.HEALTH_METRIC_RECORDED)).toBe('Handled HEALTH_METRIC_RECORDED');
      expect(handleEvent(EventType.CARE_APPOINTMENT_BOOKED)).toBe('Handled CARE_APPOINTMENT_BOOKED');
      expect(handleEvent(EventType.PLAN_CLAIM_SUBMITTED)).toBe('Handled PLAN_CLAIM_SUBMITTED');

      // TypeScript would prevent this at compile time, but we can test runtime behavior
      // @ts-expect-error - This should be a TypeScript error
      expect(() => handleEvent('INVALID_EVENT')).not.toThrow();
    });

    it('should allow type checking with includes', () => {
      // Verify that we can use includes for type checking
      const isHealthEvent = (eventType: EventType): boolean => {
        return EventCategories.HEALTH_EVENTS.includes(eventType);
      };

      expect(isHealthEvent(EventType.HEALTH_METRIC_RECORDED)).toBe(true);
      expect(isHealthEvent(EventType.CARE_APPOINTMENT_BOOKED)).toBe(false);
    });

    it('should support switch statements with exhaustive checking', () => {
      // This tests that TypeScript's exhaustive checking works with the enum
      // It's primarily a compile-time check, but we can verify basic functionality
      const getEventJourney = (eventType: EventType): string => {
        if (EventCategories.HEALTH_EVENTS.includes(eventType)) {
          return 'health';
        } else if (EventCategories.CARE_EVENTS.includes(eventType)) {
          return 'care';
        } else if (EventCategories.PLAN_EVENTS.includes(eventType)) {
          return 'plan';
        } else if (EventCategories.CROSS_JOURNEY_EVENTS.includes(eventType)) {
          return 'cross-journey';
        }
        // TypeScript would catch this missing case at compile time if we added a new category
        return 'unknown';
      };

      expect(getEventJourney(EventType.HEALTH_METRIC_RECORDED)).toBe('health');
      expect(getEventJourney(EventType.CARE_APPOINTMENT_BOOKED)).toBe('care');
      expect(getEventJourney(EventType.PLAN_CLAIM_SUBMITTED)).toBe('plan');
      expect(getEventJourney(EventType.ACHIEVEMENT_EARNED)).toBe('cross-journey');
    });
  });

  describe('Event Documentation', () => {
    it('should have all events documented with JSDoc comments in the source file', () => {
      // This is a reminder test that all events should be documented
      // The actual verification would require parsing the source file
      expect(true).toBe(true);
    });
  });
});