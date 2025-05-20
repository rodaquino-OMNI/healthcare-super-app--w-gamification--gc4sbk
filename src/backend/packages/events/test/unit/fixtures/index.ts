/**
 * @file index.ts
 * @description Central barrel file that exports all event test fixtures for unit testing.
 * This file provides a single import point for accessing mock events, validation test cases,
 * Kafka message fixtures, and versioning test data. It simplifies test setup by organizing
 * fixtures into logical categories and ensuring consistent test data across the events package.
 *
 * @module events/test/unit/fixtures
 */

// Import all fixtures from individual files
import * as baseEventFixtures from './base-events.fixtures';
import * as healthEventFixtures from './health-events.fixtures';
import * as careEventFixtures from './care-events.fixtures';
import * as planEventFixtures from './plan-events.fixtures';
import * as kafkaEventFixtures from './kafka-events.fixtures';
import * as validationFixtures from './validation.fixtures';
import * as versionFixtures from './version.fixtures';

// Re-export individual fixture files for direct imports
export { baseEventFixtures };
export { healthEventFixtures };
export { careEventFixtures };
export { planEventFixtures };
export { kafkaEventFixtures };
export { validationFixtures };
export { versionFixtures };

// Export individual fixtures and utilities from base-events.fixtures
export const {
  generateTestUUID,
  baseEventFixture,
  baseEventWithMetadataFixture,
  malformedEventFixture,
  invalidUserIdEventFixture,
  invalidEventTypeFixture,
  mismatchedJourneyEventFixture,
  complexMetadataEventFixture,
  healthMetricRecordedEventFixture,
  healthGoalAchievedEventFixture,
  healthDeviceConnectedEventFixture,
  careAppointmentBookedEventFixture,
  careMedicationTakenEventFixture,
  planClaimSubmittedEventFixture,
  planBenefitUtilizedEventFixture,
  gamificationPointsEarnedEventFixture,
  gamificationAchievementUnlockedEventFixture,
  createTestEvent,
  createHealthMetricEvent,
  addMetadataToEvent,
  createEventBatch,
  createJourneyEvent,
} = baseEventFixtures;

// Export health event fixtures
export const {
  healthMetricRecordedFixtures,
  healthGoalAchievedFixtures,
  healthInsightGeneratedFixtures,
  deviceSynchronizedFixtures,
} = healthEventFixtures.healthEventFixtures;

// Export care event fixtures
export const {
  appointmentBooked: careAppointmentBookedEvents,
  appointmentCompleted: careAppointmentCompletedEvents,
  medicationTaken: careMedicationTakenEvents,
  telemedicineStarted: careTelemedicineStartedEvents,
  telemedicineCompleted: careTelemedicineCompletedEvents,
  carePlanCreated: careCarePlanCreatedEvents,
  carePlanTaskCompleted: careCarePlanTaskCompletedEvents,
  createAppointmentBookedEvent,
  createMedicationTakenEvent,
  createTelemedicineStartedEvent,
  createCarePlanCreatedEvent,
  createCarePlanTaskCompletedEvent,
} = careEventFixtures;

// Export plan event fixtures
export const {
  claimSubmission: planClaimSubmissionEvents,
  claimProcessed: planClaimProcessedEvents,
  planSelection: planPlanSelectionEvents,
  benefitUtilization: planBenefitUtilizationEvents,
  rewardRedemption: planRewardRedemptionEvents,
  documentCompletion: planDocumentCompletionEvents,
  createClaimSubmissionEvent,
  createPlanSelectionEvent,
  createBenefitUtilizationEvent,
  createRewardRedemptionEvent,
} = planEventFixtures;

// Export Kafka event fixtures
export const {
  healthConsumerRecords,
  careConsumerRecords,
  planConsumerRecords,
  healthProducerPayloads,
  careProducerPayloads,
  planProducerPayloads,
  malformedMessages,
  serializationFailures,
  retryMechanismFixtures,
  deadLetterQueueFixtures,
  auditAndLoggingFixtures,
  createConsumerRecord,
  createProducerPayload,
  createMalformedMessage,
} = kafkaEventFixtures;

// Export validation fixtures
export const {
  validEventFixtures: validationValidEventFixtures,
  invalidEventFixtures: validationInvalidEventFixtures,
  healthValidationFixtures,
  careValidationFixtures,
  planValidationFixtures,
  gamificationValidationFixtures,
  userValidationFixtures,
  crossFieldValidationFixtures,
  metadataValidationFixtures,
} = validationFixtures;

// Export version fixtures
export const {
  versionObjects,
  versionStrings,
  versionComparisonTestCases,
  versionCompatibilityTestCases,
  migrationPathTestCases,
  circularMigrationTestCases,
  migrationChainTestCases,
  genericEvents,
  createGenericEvent,
  genericEventV1_0_0_to_V1_1_0,
  genericEventV1_1_0_to_V2_0_0,
  genericEventV2_0_0_to_V3_0_0,
  versionEdgeCases,
  registerGenericEventMigrations,
  registerCircularMigrations,
  registerMigrationChains,
} = versionFixtures;

/**
 * Comprehensive collection of all event fixtures organized by category.
 * This object provides a structured way to access all test fixtures.
 */
export const eventFixtures = {
  /**
   * Base event fixtures for general testing
   */
  base: baseEventFixtures,

  /**
   * Journey-specific event fixtures
   */
  journeys: {
    /**
     * Health journey event fixtures
     */
    health: healthEventFixtures.healthEventFixtures,

    /**
     * Care journey event fixtures
     */
    care: careEventFixtures.careEventFixtures,

    /**
     * Plan journey event fixtures
     */
    plan: planEventFixtures.planEventFixtures,
  },

  /**
   * Kafka integration fixtures
   */
  kafka: {
    /**
     * Consumer record fixtures
     */
    consumers: {
      health: kafkaEventFixtures.healthConsumerRecords,
      care: kafkaEventFixtures.careConsumerRecords,
      plan: kafkaEventFixtures.planConsumerRecords,
    },

    /**
     * Producer payload fixtures
     */
    producers: {
      health: kafkaEventFixtures.healthProducerPayloads,
      care: kafkaEventFixtures.careProducerPayloads,
      plan: kafkaEventFixtures.planProducerPayloads,
    },

    /**
     * Error handling fixtures
     */
    errors: {
      malformedMessages: kafkaEventFixtures.malformedMessages,
      serializationFailures: kafkaEventFixtures.serializationFailures,
    },

    /**
     * Retry mechanism fixtures
     */
    retry: kafkaEventFixtures.retryMechanismFixtures,

    /**
     * Dead letter queue fixtures
     */
    dlq: kafkaEventFixtures.deadLetterQueueFixtures,

    /**
     * Audit and logging fixtures
     */
    audit: kafkaEventFixtures.auditAndLoggingFixtures,
  },

  /**
   * Validation fixtures
   */
  validation: validationFixtures,

  /**
   * Version fixtures
   */
  versioning: versionFixtures,

  /**
   * Factory functions for creating test events
   */
  factories: {
    createTestEvent,
    createHealthMetricEvent,
    addMetadataToEvent,
    createEventBatch,
    createJourneyEvent,
    createAppointmentBookedEvent,
    createMedicationTakenEvent,
    createTelemedicineStartedEvent,
    createCarePlanCreatedEvent,
    createCarePlanTaskCompletedEvent,
    createClaimSubmissionEvent,
    createPlanSelectionEvent,
    createBenefitUtilizationEvent,
    createRewardRedemptionEvent,
    createConsumerRecord,
    createProducerPayload,
    createMalformedMessage,
    createGenericEvent,
  },
};

// Default export for convenience
export default eventFixtures;