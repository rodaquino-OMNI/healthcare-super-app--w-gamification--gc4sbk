/**
 * @file index.ts
 * @description Barrel file that exports all test fixtures from the events package for convenient access.
 * This file consolidates exports from all other fixture files, enabling consumers to import test data
 * with a single import statement.
 */

// Re-export all base event fixtures and factory functions
export * from './base-events';

// Re-export journey-specific event fixtures
export * as HealthEvents from './health-events';
export * as CareEvents from './care-events';
export * as PlanEvents from './plan-events';

// Re-export validation event fixtures
export * as ValidationEvents from './validation-events';

// Re-export Kafka event fixtures
export * as KafkaEvents from './kafka-events';

// Re-export event versioning fixtures
export * as EventVersions from './event-versions';

/**
 * Consolidated fixtures organized by journey
 */
export const JourneyFixtures = {
  Health: HealthEvents,
  Care: CareEvents,
  Plan: PlanEvents,
};

/**
 * Consolidated fixtures organized by category
 */
export const CategoryFixtures = {
  Base: {
    // Re-export base event fixtures for easy access
    createBaseEvent,
    createBaseEventDto,
    createDeterministicEventId,
    createEventWithTimestamp,
    createMinimalEvent,
    createEventBatch,
    createJourneyEvent,
    createVersionedEvent,
  },
  Validation: ValidationEvents,
  Kafka: KafkaEvents,
  Versioning: EventVersions,
};

/**
 * Health journey fixtures organized by event type
 */
export const HealthFixtures = {
  Metrics: HealthEvents.metricEvents,
  Goals: HealthEvents.goalEvents,
  Insights: HealthEvents.insightEvents,
  Devices: HealthEvents.deviceEvents,
  // Factory functions
  createHealthMetricEvent: HealthEvents.createHealthMetricEvent,
  createGoalProgressEvent: HealthEvents.createGoalProgressEvent,
  createDeviceConnectionEvent: HealthEvents.createDeviceConnectionEvent,
  // Constants
  EventType: HealthEvents.HealthEventType,
  MetricType: HealthEvents.MetricType,
  DeviceType: HealthEvents.DeviceType,
  ConnectionStatus: HealthEvents.ConnectionStatus,
  GoalType: HealthEvents.GoalType,
  GoalStatus: HealthEvents.GoalStatus,
};

/**
 * Care journey fixtures organized by event type
 */
export const CareFixtures = {
  Appointments: {
    createAppointmentBookedEvent: CareEvents.createAppointmentBookedEvent,
    createAppointmentCheckedInEvent: CareEvents.createAppointmentCheckedInEvent,
    createAppointmentCompletedEvent: CareEvents.createAppointmentCompletedEvent,
    createAppointmentCanceledEvent: CareEvents.createAppointmentCanceledEvent,
    appointmentLifecycleEvents: CareEvents.appointmentLifecycleEvents,
  },
  Medications: {
    createMedicationAdherenceEvent: CareEvents.createMedicationAdherenceEvent,
    weeklyMedicationAdherenceEvents: CareEvents.weeklyMedicationAdherenceEvents,
  },
  Telemedicine: {
    createTelemedicineSessionStartedEvent: CareEvents.createTelemedicineSessionStartedEvent,
    createTelemedicineSessionEndedEvent: CareEvents.createTelemedicineSessionEndedEvent,
    telemedicineSessionEvents: CareEvents.telemedicineSessionEvents,
  },
  CarePlans: {
    createCarePlanProgressEvent: CareEvents.createCarePlanProgressEvent,
    carePlanProgressionEvents: CareEvents.carePlanProgressionEvents,
  },
};

/**
 * Plan journey fixtures organized by event type
 */
export const PlanFixtures = {
  Claims: PlanEvents.claimFixtures,
  Benefits: PlanEvents.benefitFixtures,
  Plans: PlanEvents.planFixtures,
  Rewards: PlanEvents.rewardFixtures,
  // Factory functions
  Factories: PlanEvents.planEventFactories,
};

/**
 * Validation fixtures organized by validation category
 */
export const ValidationFixtures = {
  Base: {
    Valid: ValidationEvents.validBaseEvents,
    Invalid: ValidationEvents.invalidBaseEvents,
  },
  Health: {
    Metrics: {
      Valid: ValidationEvents.HealthEvents.validHealthMetricEvents,
      Invalid: ValidationEvents.HealthEvents.invalidHealthMetricEvents,
    },
    Goals: {
      Valid: ValidationEvents.HealthEvents.validHealthGoalEvents,
      Invalid: ValidationEvents.HealthEvents.invalidHealthGoalEvents,
    },
    Devices: {
      Valid: ValidationEvents.HealthEvents.validDeviceEvents,
      Invalid: ValidationEvents.HealthEvents.invalidDeviceEvents,
    },
  },
  Care: {
    Appointments: {
      Valid: ValidationEvents.CareEvents.validAppointmentEvents,
      Invalid: ValidationEvents.CareEvents.invalidAppointmentEvents,
    },
    Medications: {
      Valid: ValidationEvents.CareEvents.validMedicationEvents,
      Invalid: ValidationEvents.CareEvents.invalidMedicationEvents,
    },
    Telemedicine: {
      Valid: ValidationEvents.CareEvents.validTelemedicineEvents,
      Invalid: ValidationEvents.CareEvents.invalidTelemedicineEvents,
    },
  },
  Plan: {
    Claims: {
      Valid: ValidationEvents.PlanEvents.validClaimEvents,
      Invalid: ValidationEvents.PlanEvents.invalidClaimEvents,
    },
    Benefits: {
      Valid: ValidationEvents.PlanEvents.validBenefitEvents,
      Invalid: ValidationEvents.PlanEvents.invalidBenefitEvents,
    },
    Plans: {
      Valid: ValidationEvents.PlanEvents.validPlanEvents,
      Invalid: ValidationEvents.PlanEvents.invalidPlanEvents,
    },
  },
  CrossJourney: {
    Valid: ValidationEvents.CrossJourneyEvents.validCrossJourneyEvents,
    Invalid: ValidationEvents.CrossJourneyEvents.invalidCrossJourneyEvents,
  },
  Categories: ValidationEvents.validationCategories,
  BoundaryTests: ValidationEvents.boundaryTestCases,
};

/**
 * Kafka event fixtures organized by category
 */
export const KafkaFixtures = {
  // Basic message envelopes
  Messages: {
    Basic: KafkaEvents.basicKafkaMessage,
    WithCustomHeaders: KafkaEvents.kafkaMessageWithCustomHeaders,
    WithRetryHeaders: KafkaEvents.kafkaMessageWithRetryHeaders,
    WithDLQHeaders: KafkaEvents.kafkaMessageWithDLQHeaders,
  },
  // Journey-specific Kafka events
  JourneyEvents: {
    Health: {
      MetricRecorded: KafkaEvents.healthMetricRecordedKafkaEvent,
      GoalAchieved: KafkaEvents.healthGoalAchievedKafkaEvent,
    },
    Care: {
      AppointmentBooked: KafkaEvents.careAppointmentBookedKafkaEvent,
      MedicationTaken: KafkaEvents.careMedicationTakenKafkaEvent,
    },
    Plan: {
      ClaimSubmitted: KafkaEvents.planClaimSubmittedKafkaEvent,
      BenefitUsed: KafkaEvents.planBenefitUsedKafkaEvent,
    },
  },
  // Consumer group and offset fixtures
  ConsumerGroups: {
    Config: KafkaEvents.consumerGroupConfig,
    MultiTopicConfig: KafkaEvents.multiTopicConsumerGroupConfig,
    Offset: KafkaEvents.consumerGroupOffset,
    MultiPartitionOffset: KafkaEvents.multiPartitionConsumerGroupOffset,
  },
  // Serialized message fixtures
  Serialized: {
    JsonString: KafkaEvents.serializedKafkaMessage,
    Binary: KafkaEvents.binarySerializedKafkaMessage,
    Malformed: KafkaEvents.malformedSerializedKafkaMessage,
  },
  // Dead letter queue and retry fixtures
  ErrorHandling: {
    DLQConfig: KafkaEvents.deadLetterQueueConfig,
    RetryConfig: KafkaEvents.retryConfig,
    RetryAttempt: KafkaEvents.retryAttempt,
    RetryAttemptsWithBackoff: KafkaEvents.retryAttemptsWithBackoff,
    FailedMessageForDLQ: KafkaEvents.failedMessageForDLQ,
  },
  // Circuit breaker fixtures
  CircuitBreaker: {
    Config: KafkaEvents.circuitBreakerConfig,
    StateTransitions: KafkaEvents.circuitBreakerStateTransitions,
  },
  // Batch processing fixtures
  BatchProcessing: {
    Config: KafkaEvents.batchProcessingConfig,
    MessageBatch: KafkaEvents.kafkaMessageBatch,
  },
  // Producer fixtures
  Producer: {
    Options: KafkaEvents.producerOptions,
    Message: KafkaEvents.producerMessage,
    BatchMessage: KafkaEvents.producerBatchMessage,
  },
  // Factory functions
  Factories: {
    createBaseEvent: KafkaEvents.createBaseEvent,
    createKafkaEvent: KafkaEvents.createKafkaEvent,
    createKafkaHeaders: KafkaEvents.createKafkaHeaders,
  },
};

/**
 * Event versioning fixtures organized by category
 */
export const VersioningFixtures = {
  // Version constants
  Versions: EventVersions.VERSIONS,
  CompatibilityResults: EventVersions.COMPATIBILITY_RESULTS,
  // Journey-specific versioned events
  JourneyEvents: {
    Health: EventVersions.healthJourneyEvents,
    Care: EventVersions.careJourneyEvents,
    Plan: EventVersions.planJourneyEvents,
  },
  // Migration test cases
  Migrations: EventVersions.migrationTestCases,
  // Schema change examples
  SchemaChanges: EventVersions.schemaChangeExamples,
};

/**
 * Default export with all fixtures organized by category
 */
export default {
  Base: CategoryFixtures.Base,
  Health: HealthFixtures,
  Care: CareFixtures,
  Plan: PlanFixtures,
  Validation: ValidationFixtures,
  Kafka: KafkaFixtures,
  Versioning: VersioningFixtures,
};