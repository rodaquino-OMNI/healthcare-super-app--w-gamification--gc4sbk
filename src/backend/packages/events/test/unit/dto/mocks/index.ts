/**
 * @file Event Mock Data Barrel File
 * 
 * This file exports all event mock data and utilities from the mock files,
 * providing a centralized access point for test fixtures. It simplifies imports
 * in test files by exposing a clean API to access all available mock data through
 * a single import statement, making tests more readable and maintainable while
 * ensuring consistent mock usage across the test suite.
 */

// Export all factory functions for generating custom mock data
export * from './event-factory';

// Export journey-specific event mocks
export * as healthEvents from './health-events.mock';
export * as careEvents from './care-events.mock';
export * as planEvents from './plan-events.mock';
export * as commonEvents from './common-events.mock';

// Export validation-specific event mocks
export * as validEvents from './valid-events.mock';
export * as invalidEvents from './invalid-events.mock';

// Re-export specific named events for cleaner imports

// Health Journey Events
export {
  healthMetricRecordedEvent,
  goalAchievedEvent,
  deviceSyncedEvent,
} from './health-events.mock';

// Care Journey Events
export {
  appointmentBookedEvent,
  medicationTakenEvent,
  telemedicineSessionCompletedEvent,
} from './care-events.mock';

// Plan Journey Events
export {
  claimSubmittedEvent,
  benefitUsedEvent,
  planSelectedEvent,
  rewardRedeemedEvent,
} from './plan-events.mock';

// Common Events
export {
  userProfileUpdatedEvent,
  achievementUnlockedEvent,
  systemNotificationEvent,
} from './common-events.mock';

// Categorized exports by journey and validation status
export const events = {
  // By journey
  health: healthEvents,
  care: careEvents,
  plan: planEvents,
  common: commonEvents,
  
  // By validation status
  valid: validEvents,
  invalid: invalidEvents,
  
  // Factory functions
  factory: require('./event-factory'),
};

// Default export for backward compatibility
export default events;