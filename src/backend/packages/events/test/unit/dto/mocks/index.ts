/**
 * @file Barrel file that exports all event mock data and utilities from the mock files.
 * 
 * This file provides a centralized access point for test fixtures, making tests more
 * readable and maintainable while ensuring consistent mock usage across the test suite.
 */

// Export all factory functions for generating custom mock data
export * from './event-factory';

// Export all valid events for positive test scenarios
export * from './valid-events.mock';

// Export all invalid events for testing error handling
export * from './invalid-events.mock';

// Export journey-specific events
export * from './health-events.mock';
export * from './care-events.mock';
export * from './plan-events.mock';

// Export common events that apply across multiple journeys
export * from './common-events.mock';

// Re-export categorized events for cleaner imports

// By validation status
export { 
  validEvents,
  validHealthEvents,
  validCareEvents,
  validPlanEvents,
  validCommonEvents,
} from './valid-events.mock';

export {
  invalidEvents,
  invalidHealthEvents,
  invalidCareEvents,
  invalidPlanEvents,
  eventsWithMissingFields,
  eventsWithInvalidTypes,
} from './invalid-events.mock';

// By journey
export {
  healthMetricRecordedEvents,
  goalAchievedEvents,
  deviceSyncedEvents,
} from './health-events.mock';

export {
  appointmentBookedEvents,
  medicationTakenEvents,
  telemedicineSessionEvents,
  carePlanProgressEvents,
} from './care-events.mock';

export {
  claimSubmittedEvents,
  benefitUsedEvents,
  planSelectedEvents,
  rewardRedeemedEvents,
} from './plan-events.mock';

export {
  userProfileEvents,
  achievementEvents,
  systemNotificationEvents,
  rewardEvents,
} from './common-events.mock';

// Factory function exports for generating custom mock data
export {
  createMockEvent,
  createValidEvent,
  createInvalidEvent,
  createHealthEvent,
  createCareEvent,
  createPlanEvent,
  createCommonEvent,
} from './event-factory';