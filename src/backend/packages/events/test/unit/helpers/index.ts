/**
 * @file index.ts
 * @description Barrel file that exports all test helper utilities for event testing.
 * This file centralizes access to all testing utilities, factories, and setup functions,
 * enabling more readable test files and enforcing consistent testing patterns across the events package.
 *
 * @module events/test/unit/helpers
 */

/**
 * Kafka Testing Utilities
 * 
 * These utilities help with setting up mock Kafka environments for testing event processing,
 * message routing, error handling, and retry mechanisms without requiring a real Kafka cluster.
 * 
 * @example
 * // Create a test Kafka environment
 * const kafkaEnv = await setupKafkaTestEnvironment();
 * 
 * // Send a test event
 * await kafkaEnv.producer.send(TOPICS.HEALTH.EVENTS, createHealthEvent());
 * 
 * // Clean up resources
 * await kafkaEnv.cleanup();
 */
export {
  // Core Kafka test environment setup
  createKafkaTestEnvironment,
  setupKafkaTestEnvironment,
  configureConsumerHandlers,
  
  // Mock Kafka components
  createMockProducer,
  createMockConsumer,
  createMockAdmin,
  
  // Testing utilities for Kafka
  testProducerRetryMechanism,
  testConsumerRetryMechanism,
  testDeadLetterQueue,
  testEventRouting,
  getKafkaMetrics,
  
  // Event creation utilities
  createTestEvent as createKafkaTestEvent,
  createTestEventBatch,
  getTopicForEventType,
  
  // Types
  KafkaTestOptions,
  MockKafkaProducer,
  MockKafkaConsumer,
  MockKafkaAdmin,
  MessageHandler,
  KafkaTestEnvironment,
  KafkaEventMetrics,
} from './kafka-setup.helper';

/**
 * Event Validation Testing Utilities
 * 
 * These utilities help with testing validation rules for event DTOs, including
 * schema compliance, error handling, and validation decorators.
 * 
 * @example
 * // Create test cases for an event DTO
 * const testCases = createEventValidationTestCases(EventType.HEALTH_METRIC_RECORDED, HealthMetricDto);
 * 
 * // Run validation tests
 * const results = await runValidationTestCases(testCases, HealthMetricDto);
 * 
 * // Assert validation results
 * expect(results.every(r => r.passed)).toBe(true);
 */
export {
  // Core validation utilities
  validateDto,
  runValidationTestCases,
  createTestEventMetadata,
  createTestEvent as createValidationTestEvent,
  createVersionedTestEvent,
  
  // Journey-specific test data creation
  createHealthEventTestData,
  createCareEventTestData,
  createPlanEventTestData,
  createGamificationEventTestData,
  createUserEventTestData,
  createEventTestData,
  
  // Validation test utilities
  createInvalidEventTestData,
  testCustomValidator,
  testVersionCompatibility,
  testVersionComparison,
  createEventValidationTestCases,
  
  // Database utilities
  loadTestDataFromDb,
  
  // Validation error utilities
  createValidationError,
  assertValidationErrorsForProperties,
  assertValidationErrorCodes,
  
  // Decorator testing utilities
  generateDecoratorTestCases,
  generateConditionalValidationTestCases,
  generateJourneyTestData,
  
  // Types
  ValidationTestCase,
  ValidationTestResult,
} from './validation.helper';

/**
 * Event Factory Utilities
 * 
 * These utilities help with creating test event objects that comply with the standardized
 * event schema for all journeys (Health, Care, Plan) with appropriate data structures.
 * 
 * @example
 * // Create a health metric event
 * const event = createEvent(EventType.HEALTH_METRIC_RECORDED);
 * 
 * // Create a versioned event
 * const versionedEvent = createVersionedEvent(EventType.CARE_APPOINTMENT_BOOKED, { version: '2.0.0' });
 * 
 * // Create an invalid event for testing error handling
 * const invalidEvent = createInvalidEvent(EventType.PLAN_CLAIM_SUBMITTED, ['amount', 'claimType']);
 */
export {
  // Core event factory utilities
  createTestMetadata,
  createTestEvent as createFactoryTestEvent,
  createVersionedTestEvent as createFactoryVersionedTestEvent,
  
  // Health journey event factories
  createHealthMetricData,
  createHealthGoalData,
  createDeviceConnectionData,
  createHealthInsightData,
  
  // Care journey event factories
  createAppointmentBookingData,
  createAppointmentCompletionData,
  createMedicationTakenData,
  createTelemedicineSessionData,
  
  // Plan journey event factories
  createClaimSubmissionData,
  createClaimProcessingData,
  createPlanSelectionData,
  createBenefitUtilizationData,
  
  // Gamification event factories
  createPointsEarnedData,
  createAchievementUnlockedData,
  createLevelUpData,
  createQuestCompletionData,
  
  // User event factories
  createProfileCompletionData,
  createLoginData,
  createOnboardingCompletionData,
  createFeedbackSubmissionData,
  
  // Journey-specific event factories
  createHealthEventData,
  createCareEventData,
  createPlanEventData,
  createGamificationEventData,
  createUserEventData,
  createEventData,
  
  // Complete event creation utilities
  createEvent,
  createVersionedEvent,
  createInvalidEvent,
  createEventBatch,
  createJourneyEvents,
  createVersionedEventSet,
  createCorrelatedEvents,
  createEventChain,
  
  // Types
  EventFactoryOptions,
} from './event-factory.helper';

/**
 * Test Database Utilities
 * 
 * These utilities help with setting up and tearing down test databases for event-related tests,
 * including creating isolated database environments with predefined test data.
 * 
 * @example
 * // Create a test database
 * const prisma = await createTestDatabase({ seedTestData: true });
 * 
 * // Run tests with the database
 * const events = await prisma.event.findMany();
 * 
 * // Clean up the database
 * await cleanupTestDatabase(prisma);
 */
export {
  // Core database utilities
  createTestDatabase,
  cleanupTestDatabase,
  cleanDatabase,
  resetInMemoryDatabase,
  
  // Mock database utilities
  createMockPrismaClient,
  getInMemoryDatabase,
  setInMemoryDatabase,
  
  // Test data seeding
  seedTestEventData,
  
  // Test data creation
  createTestEvent as createDatabaseTestEvent,
  createTestAchievement,
  
  // Types
  TestDatabaseOptions,
  EventRecord,
  AchievementRecord,
  MockDatabase,
  MockPrismaClient,
} from './test-database.helper';

/**
 * Convenience exports for common testing patterns
 * 
 * These exports provide simplified access to the most commonly used testing utilities
 * without requiring knowledge of which specific helper file they come from.
 */

/**
 * Creates a test event with the specified type and data.
 * This is a convenience function that uses the event factory under the hood.
 * 
 * @param eventType The type of event to create
 * @param data Optional custom data for the event
 * @param options Optional configuration options
 * @returns A test event object
 * 
 * @example
 * // Create a health metric event
 * const event = createTestEvent(EventType.HEALTH_METRIC_RECORDED);
 * 
 * // Create a care appointment event with custom data
 * const appointmentEvent = createTestEvent(EventType.CARE_APPOINTMENT_BOOKED, {
 *   providerId: 'custom-provider-id',
 *   scheduledAt: new Date().toISOString()
 * });
 */
export { createEvent as createTestEvent } from './event-factory.helper';

/**
 * Sets up a complete test environment with Kafka and database for integration testing.
 * 
 * @param options Configuration options for the test environment
 * @returns A configured test environment with Kafka and database
 * 
 * @example
 * // Set up a complete test environment
 * const testEnv = await setupTestEnvironment();
 * 
 * // Use the environment for testing
 * await testEnv.kafka.producer.send(TOPICS.HEALTH.EVENTS, createTestEvent(EventType.HEALTH_METRIC_RECORDED));
 * const events = await testEnv.database.event.findMany();
 * 
 * // Clean up resources
 * await testEnv.cleanup();
 */
export async function setupTestEnvironment(options: {
  kafkaOptions?: import('./kafka-setup.helper').KafkaTestOptions;
  databaseOptions?: import('./test-database.helper').TestDatabaseOptions;
} = {}) {
  const kafka = await setupKafkaTestEnvironment(options.kafkaOptions);
  const database = await createTestDatabase(options.databaseOptions);
  
  return {
    kafka,
    database,
    cleanup: async () => {
      await kafka.cleanup();
      await cleanupTestDatabase(database);
    }
  };
}