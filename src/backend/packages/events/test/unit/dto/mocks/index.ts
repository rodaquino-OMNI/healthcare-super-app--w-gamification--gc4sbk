/**
 * @file index.ts
 * @description Centralized export point for all event mock data and utilities.
 * This barrel file provides a clean API to access all available mock data through
 * a single import statement, making tests more readable and maintainable while
 * ensuring consistent mock usage across the test suite.
 */

// Export factory functions for generating custom mock data
export * from './event-factory';

// Export all valid event mocks
export * as validEvents from './valid-events.mock';

// Export all invalid event mocks
export * as invalidEvents from './invalid-events.mock';

// Export journey-specific event mocks
export * as healthEvents from './health-events.mock';
export * as careEvents from './care-events.mock';
export * as planEvents from './plan-events.mock';

// Export common cross-journey event mocks
export * as commonEvents from './common-events.mock';

// Re-export specific named events for cleaner imports

// Health journey named exports
export {
  validHealthMetricEvent,
  validGoalAchievedEvent,
  validDeviceSyncedEvent,
  healthMetricFactory,
  healthGoalFactory,
} from './health-events.mock';

// Care journey named exports
export {
  validAppointmentBookedEvent,
  validMedicationTakenEvent,
  validTelemedicineSessionEvent,
  appointmentFactory,
  medicationFactory,
} from './care-events.mock';

// Plan journey named exports
export {
  validClaimSubmittedEvent,
  validBenefitUsedEvent,
  validPlanSelectedEvent,
  claimFactory,
  benefitFactory,
} from './plan-events.mock';

// Common events named exports
export {
  validUserProfileEvent,
  validAchievementUnlockedEvent,
  validSystemNotificationEvent,
  validRewardRedeemedEvent,
  profileFactory,
  achievementFactory,
} from './common-events.mock';

// Invalid events named exports
export {
  invalidEventNoType,
  invalidEventNoUserId,
  invalidEventNoJourney,
  invalidEventMalformedData,
  invalidEventWrongJourney,
} from './invalid-events.mock';

// Categorized exports by journey
export const journeyEvents = {
  health: healthEvents,
  care: careEvents,
  plan: planEvents,
  common: commonEvents,
};

// Categorized exports by validation status
export const eventsByValidation = {
  valid: validEvents,
  invalid: invalidEvents,
};

// Factory function exports
export const factories = {
  // Health journey factories
  healthMetric: healthEvents.healthMetricFactory,
  healthGoal: healthEvents.healthGoalFactory,
  deviceSync: healthEvents.deviceSyncFactory,
  
  // Care journey factories
  appointment: careEvents.appointmentFactory,
  medication: careEvents.medicationFactory,
  telemedicine: careEvents.telemedicineFactory,
  
  // Plan journey factories
  claim: planEvents.claimFactory,
  benefit: planEvents.benefitFactory,
  plan: planEvents.planFactory,
  
  // Common factories
  profile: commonEvents.profileFactory,
  achievement: commonEvents.achievementFactory,
  notification: commonEvents.notificationFactory,
  reward: commonEvents.rewardFactory,
};