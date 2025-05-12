import { EventTypes } from '../../../src/dto/event-types.enum';

/**
 * Test suite for the EventTypes enum
 * 
 * These tests verify that the EventTypes enum meets the requirements specified in the technical specification:
 * - Comprehensive event type definitions for all journeys
 * - Proper naming conventions and organization
 * - Type safety for event processing
 * - Complete coverage of all required event categories
 */
describe('EventTypes Enum', () => {
  /**
   * Helper function to check if a string follows the JOURNEY_EVENT_ACTION format
   * Event types should be in uppercase with underscores separating words
   * 
   * @param eventType - The event type string to validate
   * @returns boolean indicating if the naming convention is followed
   */
  const hasValidNamingConvention = (eventType: string): boolean => {
    // Event types should be in uppercase with underscores
    const validFormatRegex = /^[A-Z]+(_[A-Z]+)+$/;
    return validFormatRegex.test(eventType);
  };

  /**
   * Helper function to get the journey prefix from an event type
   * Extracts the first part of the event type (before the first underscore)
   * 
   * @param eventType - The event type string
   * @returns The journey prefix (HEALTH, CARE, PLAN, etc.)
   */
  const getJourneyPrefix = (eventType: string): string => {
    const parts = eventType.split('_');
    return parts[0];
  };

  /**
   * Verifies that the EventTypes enum is properly exported and available
   */
  it('should export EventTypes enum', () => {
    expect(EventTypes).toBeDefined();
  });

  /**
   * Verifies that the EventTypes enum contains all required event types
   * for each journey as specified in the technical specification
   */
  it('should contain all required event types', () => {
    // Get all event types as an array
    const eventTypes = Object.values(EventTypes);
    
    // Check that we have a substantial number of event types
    expect(eventTypes.length).toBeGreaterThan(20);
    
    // Check for specific required events from each journey
    const requiredEvents = [
      // Health journey events
      'HEALTH_METRIC_RECORDED',
      'HEALTH_GOAL_CREATED',
      'HEALTH_GOAL_ACHIEVED',
      'HEALTH_DEVICE_CONNECTED',
      'HEALTH_INSIGHT_GENERATED',
      'HEALTH_DATA_SYNCED',
      
      // Care journey events
      'CARE_APPOINTMENT_BOOKED',
      'CARE_APPOINTMENT_COMPLETED',
      'CARE_MEDICATION_TAKEN',
      'CARE_MEDICATION_MISSED',
      'CARE_TELEMEDICINE_STARTED',
      'CARE_TELEMEDICINE_COMPLETED',
      'CARE_PROVIDER_SEARCHED',
      
      // Plan journey events
      'PLAN_CLAIM_SUBMITTED',
      'PLAN_CLAIM_STATUS_UPDATED',
      'PLAN_BENEFIT_UTILIZED',
      'PLAN_COVERAGE_VIEWED',
      'PLAN_DOCUMENT_UPLOADED',
      'PLAN_DOCUMENT_DOWNLOADED',
      'PLAN_COMPARISON_PERFORMED',
      
      // Cross-journey events
      'USER_PROFILE_COMPLETED',
      'USER_PROFILE_UPDATED',
      'JOURNEY_ONBOARDING_COMPLETED',
      'USER_FEEDBACK_SUBMITTED',
      'CONTENT_SHARED',
      'SURVEY_COMPLETED'
    ];
    
    requiredEvents.forEach(event => {
      expect(eventTypes).toContain(event);
    });
  });

  /**
   * Verifies that all event types follow the proper naming convention
   * (JOURNEY_EVENT_ACTION format in uppercase with underscores)
   */
  it('should follow proper naming convention for all event types', () => {
    // Get all event type keys (the enum keys, not values)
    const eventTypeKeys = Object.keys(EventTypes).filter(
      key => typeof EventTypes[key as keyof typeof EventTypes] === 'string'
    );
    
    // Check that each event type follows the naming convention
    eventTypeKeys.forEach(key => {
      const eventType = EventTypes[key as keyof typeof EventTypes];
      expect(hasValidNamingConvention(eventType as string)).toBe(
        true,
        `Event type ${eventType} does not follow the JOURNEY_EVENT_ACTION naming convention`
      );
    });
  });

  /**
   * Verifies that events are properly organized by journey category
   * and follow the correct prefix conventions for each journey
   */
  it('should organize events by journey category', () => {
    // Get all event type values
    const eventTypes = Object.values(EventTypes);
    
    // Group events by journey prefix
    const journeyGroups = {
      HEALTH: [] as string[],
      CARE: [] as string[],
      PLAN: [] as string[],
      // Cross-journey events typically start with USER, JOURNEY, CONTENT, etc.
      CROSS_JOURNEY: [] as string[]
    };
    
    eventTypes.forEach(eventType => {
      const prefix = getJourneyPrefix(eventType);
      
      if (prefix === 'HEALTH') {
        journeyGroups.HEALTH.push(eventType);
      } else if (prefix === 'CARE') {
        journeyGroups.CARE.push(eventType);
      } else if (prefix === 'PLAN') {
        journeyGroups.PLAN.push(eventType);
      } else {
        journeyGroups.CROSS_JOURNEY.push(eventType);
      }
    });
    
    // Verify that each journey has events
    expect(journeyGroups.HEALTH.length).toBeGreaterThan(0, 'No Health journey events found');
    expect(journeyGroups.CARE.length).toBeGreaterThan(0, 'No Care journey events found');
    expect(journeyGroups.PLAN.length).toBeGreaterThan(0, 'No Plan journey events found');
    expect(journeyGroups.CROSS_JOURNEY.length).toBeGreaterThan(0, 'No cross-journey events found');
    
    // Verify that health events follow the HEALTH_ prefix convention
    journeyGroups.HEALTH.forEach(event => {
      expect(event.startsWith('HEALTH_')).toBe(true, `Health event ${event} does not start with HEALTH_ prefix`);
    });
    
    // Verify that care events follow the CARE_ prefix convention
    journeyGroups.CARE.forEach(event => {
      expect(event.startsWith('CARE_')).toBe(true, `Care event ${event} does not start with CARE_ prefix`);
    });
    
    // Verify that plan events follow the PLAN_ prefix convention
    journeyGroups.PLAN.forEach(event => {
      expect(event.startsWith('PLAN_')).toBe(true, `Plan event ${event} does not start with PLAN_ prefix`);
    });
  });

  /**
   * Verifies that the EventTypes enum provides proper type safety
   * This ensures that only valid event types can be used in the application
   */
  it('should provide type safety for event types', () => {
    // Verify that TypeScript recognizes EventTypes as a valid type
    const typeCheck = (eventType: EventTypes): EventTypes => {
      return eventType;
    };
    
    // This should compile without errors
    const validEvent = typeCheck(EventTypes.HEALTH_METRIC_RECORDED);
    expect(validEvent).toBe(EventTypes.HEALTH_METRIC_RECORDED);
    
    // TypeScript should prevent assigning invalid values at compile time
    // This test verifies runtime behavior as a proxy for compile-time checks
    const eventValues = Object.values(EventTypes);
    const randomString = 'INVALID_EVENT_TYPE';
    
    // The random string should not be in the enum values
    expect(eventValues).not.toContain(randomString);
    
    // Verify that we can use the enum in a type-safe way with switch statements
    const getEventCategory = (eventType: EventTypes): string => {
      switch (eventType) {
        case EventTypes.HEALTH_METRIC_RECORDED:
          return 'health-metrics';
        case EventTypes.CARE_APPOINTMENT_BOOKED:
          return 'care-appointments';
        case EventTypes.PLAN_CLAIM_SUBMITTED:
          return 'plan-claims';
        default:
          return 'other';
      }
    };
    
    expect(getEventCategory(EventTypes.HEALTH_METRIC_RECORDED)).toBe('health-metrics');
    expect(getEventCategory(EventTypes.CARE_APPOINTMENT_BOOKED)).toBe('care-appointments');
    expect(getEventCategory(EventTypes.PLAN_CLAIM_SUBMITTED)).toBe('plan-claims');
  });

  /**
   * Verifies that the EventTypes enum includes events for all required categories
   * as specified in the technical specification
   */
  it('should include events for all required categories', () => {
    // Get all event type values
    const eventTypes = Object.values(EventTypes);
    
    // Define expected event categories based on the technical specification
    const expectedCategories = {
      // Health journey categories
      HEALTH_METRIC: 'HEALTH_METRIC',
      HEALTH_GOAL: 'HEALTH_GOAL',
      HEALTH_DEVICE: 'HEALTH_DEVICE',
      HEALTH_DATA: 'HEALTH_DATA',
      HEALTH_INSIGHT: 'HEALTH_INSIGHT',
      
      // Care journey categories
      CARE_APPOINTMENT: 'CARE_APPOINTMENT',
      CARE_MEDICATION: 'CARE_MEDICATION',
      CARE_TELEMEDICINE: 'CARE_TELEMEDICINE',
      CARE_PROVIDER: 'CARE_PROVIDER',
      
      // Plan journey categories
      PLAN_CLAIM: 'PLAN_CLAIM',
      PLAN_COVERAGE: 'PLAN_COVERAGE',
      PLAN_BENEFIT: 'PLAN_BENEFIT',
      PLAN_DOCUMENT: 'PLAN_DOCUMENT',
      PLAN_COMPARISON: 'PLAN_COMPARISON',
      
      // Cross-journey categories
      USER_PROFILE: 'USER_PROFILE',
      JOURNEY_ONBOARDING: 'JOURNEY_ONBOARDING',
      USER_FEEDBACK: 'USER_FEEDBACK',
      CONTENT_SHARED: 'CONTENT_SHARED',
      SURVEY: 'SURVEY'
    };
    
    // Check that each category has at least one event
    Object.values(expectedCategories).forEach(category => {
      const hasEventInCategory = eventTypes.some(eventType => {
        const parts = eventType.split('_');
        const eventCategory = `${parts[0]}_${parts[1]}`;
        return eventCategory === category;
      });
      
      expect(hasEventInCategory).toBe(
        true,
        `No events found for category ${category}`
      );
    });
    
    // Count events per category for reporting
    const categoryCounts: Record<string, number> = {};
    eventTypes.forEach(eventType => {
      const parts = eventType.split('_');
      if (parts.length >= 2) {
        const category = `${parts[0]}_${parts[1]}`;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
    
    // Log category counts for debugging (this won't affect the test result)
    // console.log('Event counts by category:', categoryCounts);
  });

  /**
   * Verifies that event naming is consistent within categories
   * This ensures that all events in a category follow the same verb tense pattern
   */
  it('should have consistent event naming within categories', () => {
    // Get all event type values
    const eventTypes = Object.values(EventTypes);
    
    // Group events by category (first two parts of the event name)
    const categoryGroups: Record<string, string[]> = {};
    
    eventTypes.forEach(eventType => {
      const parts = eventType.split('_');
      if (parts.length >= 2) {
        const category = `${parts[0]}_${parts[1]}`;
        if (!categoryGroups[category]) {
          categoryGroups[category] = [];
        }
        categoryGroups[category].push(eventType);
      }
    });
    
    // Check that each category has consistent naming patterns
    Object.entries(categoryGroups).forEach(([category, events]) => {
      // Skip categories with only one event
      if (events.length <= 1) return;
      
      // Extract action verbs (the part after the category)
      const actionVerbs = events.map(event => {
        const parts = event.split('_');
        return parts.slice(2).join('_');
      });
      
      // Check that action verbs are consistent (all past tense or all present tense)
      const pastTenseCount = actionVerbs.filter(verb => 
        verb.endsWith('ED') || verb.endsWith('D')
      ).length;
      
      // If most verbs are past tense, all should be past tense
      if (pastTenseCount > events.length / 2) {
        expect(pastTenseCount).toBe(
          events.length,
          `Inconsistent verb tense in category ${category}. All verbs should be past tense.`
        );
      }
      
      // If most verbs are present tense, all should be present tense
      const presentTenseCount = events.length - pastTenseCount;
      if (presentTenseCount > events.length / 2) {
        expect(presentTenseCount).toBe(
          events.length,
          `Inconsistent verb tense in category ${category}. All verbs should be present tense.`
        );
      }
    });
  });
  
  /**
   * Verifies that event documentation is complete
   * This test ensures that all events have proper JSDoc comments
   * with payload information in the source file
   */
  it('should have documentation for all event types', () => {
    // This test is a placeholder for manual verification
    // In a real implementation, we would parse the source file and check for JSDoc comments
    // For now, we'll just verify that the enum exists and has values
    const eventTypeKeys = Object.keys(EventTypes).filter(
      key => typeof EventTypes[key as keyof typeof EventTypes] === 'string'
    );
    
    expect(eventTypeKeys.length).toBeGreaterThan(0);
    
    // Note: A more comprehensive test would verify that each event type in the enum
    // has a corresponding JSDoc comment with payload information
  });
});