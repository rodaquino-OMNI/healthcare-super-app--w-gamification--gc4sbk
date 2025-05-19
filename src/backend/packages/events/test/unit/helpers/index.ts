/**
 * @file index.ts
 * @description Barrel file that exports all test helper utilities for event testing.
 * This file centralizes access to all testing utilities, factories, and setup functions,
 * enabling more readable test files and enforcing consistent testing patterns across
 * the events package.
 */

// ===================================================================
// Kafka Testing Utilities
// ===================================================================

export {
  // Mock Kafka implementations
  MockKafkaProducer,
  MockKafkaConsumer,
  MockKafkaService,
  MockDLQService,
  
  // Kafka test environment setup
  createTestKafkaEnvironment,
  createTestEvent,
  TestRetryPolicy,
  processWithRetries,
  
  // Event pipeline simulation
  simulateEventPipeline,
  createMockEventHandler,
  createMockEventProcessor
} from './kafka-setup.helper';

// ===================================================================
// Validation Testing Utilities
// ===================================================================

export {
  // Enums and types
  JourneyType,
  TestEventOptions,
  ValidationTestOptions,
  SchemaEvolutionTestOptions,
  
  // Test data generation
  generateTestEvent,
  
  // Validation testing
  testEventValidation,
  testZodValidation,
  testJourneyValidation,
  testValidatorDecorator,
  testValidatorConstraint,
  testSchemaEvolution,
  
  // Error handling testing
  testValidationErrorHandling,
  testValidationErrorPropagation
} from './validation.helper';

// ===================================================================
// Event Factory Utilities
// ===================================================================

export {
  // Factory options
  EventFactoryOptions,
  HealthEventFactoryOptions,
  CareEventFactoryOptions,
  PlanEventFactoryOptions,
  
  // Base event factories
  createBaseEvent,
  createInvalidBaseEvent,
  createVersionedEvent,
  
  // Health journey event factories
  createHealthMetricEvent,
  createInvalidHealthMetricEvent,
  createHealthGoalEvent,
  createInvalidHealthGoalEvent,
  createDeviceConnectionEvent,
  createInvalidDeviceConnectionEvent,
  
  // Care journey event factories
  createAppointmentEvent,
  createInvalidAppointmentEvent,
  createMedicationEvent,
  createInvalidMedicationEvent,
  createTelemedicineEvent,
  createInvalidTelemedicineEvent,
  
  // Plan journey event factories
  createClaimEvent,
  createInvalidClaimEvent,
  createBenefitEvent,
  createInvalidBenefitEvent,
  createPlanSelectionEvent,
  createInvalidPlanSelectionEvent,
  
  // Bulk event creation
  createAllJourneyEvents,
  createAllInvalidEvents
} from './event-factory.helper';

// ===================================================================
// Database Testing Utilities
// ===================================================================

export {
  // Mock database implementations
  MockPrismaClient,
  TestDatabaseHelper,
  
  // Database testing options
  InitializeDatabaseOptions,
  CreateTestEventOptions,
  CreateTestAchievementOptions,
  CreateTestProfileOptions,
  VerifyEventOptions,
  VerifyAchievementOptions,
  VerifyProfileOptions
} from './test-database.helper';