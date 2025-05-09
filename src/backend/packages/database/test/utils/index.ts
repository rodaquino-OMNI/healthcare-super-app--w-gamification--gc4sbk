/**
 * @file index.ts
 * @description Centralized exports for all database testing utilities.
 * 
 * This barrel file exports all database testing utilities for easy consumption within test suites
 * across the monorepo. It provides a clean, organized API for database testing, including utilities for
 * database setup/teardown, data factory functions, assertion helpers, query utilities, and transaction
 * testing helpers.
 */

// ===== DATABASE TEST UTILITIES =====

/**
 * Core database testing utilities for setting up, managing, and tearing down test databases.
 * 
 * These utilities provide functions for creating isolated test databases, applying migrations,
 * managing database connections during tests, and cleaning up after tests to prevent data leakage.
 */
export {
  // Test database management
  createTestDatabase,
  destroyTestDatabase,
  destroyAllTestDatabases,
  resetTestDatabase,
  getTestDatabase,
  getAllTestDatabases,
  
  // Environment configuration
  setupTestEnvironment,
  restoreEnvironment,
  
  // Transaction test helpers
  withTestDatabase,
  registerTestDatabaseCleanup,
  
  // Types
  TestDatabaseOptions,
  TestDatabaseInfo
} from './database-test.utils';

// ===== FACTORY UTILITIES =====

/**
 * Factory utilities for generating test data for all database entities across all journeys.
 * 
 * These utilities provide factory functions for creating test data with customizable properties,
 * supporting both single entity creation and bulk generation for high-volume testing scenarios.
 */
export {
  // Core entity factories (Auth)
  createPermissionFactory,
  createRoleFactory,
  createUserFactory,
  generateUsers,
  
  // Health journey factories
  createHealthMetricFactory,
  createDeviceConnectionFactory,
  createHealthGoalFactory,
  createHealthMetricTypeFactory,
  createDeviceTypeFactory,
  generateHealthMetrics,
  
  // Care journey factories
  createAppointmentFactory,
  createProviderFactory,
  createMedicationFactory,
  createProviderSpecialtyFactory,
  generateAppointments,
  
  // Plan journey factories
  createInsurancePlanFactory,
  createClaimFactory,
  createBenefitFactory,
  createInsurancePlanTypeFactory,
  createClaimTypeFactory,
  generateClaims,
  
  // Gamification factories
  createAchievementFactory,
  createRewardFactory,
  createAchievementTypeFactory,
  generateAchievements,
  
  // Utility functions
  randomDate,
  randomBoolean,
  randomItem,
  randomSubset
} from './factory.utils';

// ===== ASSERTION UTILITIES =====

/**
 * Database testing assertion utilities for verifying database state, comparing entity properties,
 * validating relationships between entities, and checking transaction results across different journeys.
 */
export {
  // Core assertion utilities
  assertEntityMatches,
  assertEntityExists,
  assertEntityNotExists,
  assertRelationshipExists,
  assertZodValidation,
  assertClassValidation,
  assertDatabaseState,
  assertTransactionResult,
  
  // Health journey assertions
  createHealthMetricSchema,
  assertHealthMetricValid,
  createHealthGoalSchema,
  assertHealthGoalValid,
  assertHealthMetricsInRange,
  createDeviceConnectionSchema,
  assertDeviceConnectionValid,
  assertHealthMetricUnitsConsistent,
  assertHealthGoalTargetsAppropriate,
  
  // Care journey assertions
  createAppointmentSchema,
  assertAppointmentValid,
  assertNoAppointmentOverlaps,
  createMedicationSchema,
  assertMedicationValid,
  createProviderSchema,
  assertProviderValid,
  createTelemedicineSessionSchema,
  assertTelemedicineSessionValid,
  assertTelemedicineSessionDurationValid,
  createTreatmentPlanSchema,
  assertTreatmentPlanValid,
  
  // Plan journey assertions
  createClaimSchema,
  assertClaimValid,
  assertClaimHasRequiredDocuments,
  createPlanSchema,
  assertPlanValid,
  createBenefitSchema,
  assertBenefitValid,
  createCoverageSchema,
  assertCoverageValid,
  createDocumentSchema,
  assertDocumentValid,
  assertPlanHasRequiredCoverages,
  assertPlanHasRequiredBenefits,
  
  // Cross-journey assertions
  assertCrossJourneyConsistency,
  assertGamificationEventsGenerated,
  assertDataTransformationValid,
  assertDataIntegrityAcrossEntities,
  assertDatabaseConstraintsEnforced,
  assertMigrationResultsValid,
  
  // Transaction assertions
  assertTransactionRollback,
  assertNestedTransactions,
  assertTransactionIsolation,
  
  // Types
  CompareEntityOptions
} from './assertion.utils';

// ===== QUERY UTILITIES =====

/**
 * Database query testing utilities for retrieving, comparing, and manipulating database records
 * in a testing context, with support for complex filtering, sorting, and pagination operations
 * across all journeys.
 */
export {
  // Core query utilities
  executeQueryWithPotentialFailure,
  getRecords,
  getRecordById,
  countRecords,
  createTestRecord,
  updateTestRecord,
  deleteTestRecord,
  executeRawQuery,
  
  // Transaction utilities
  executeTransaction,
  executeInteractiveTransaction,
  
  // Pagination utilities
  getPaginatedRecords,
  createPaginatedResults,
  
  // Health journey queries
  getHealthMetrics,
  getHealthMetricsByType,
  getHealthMetricsInDateRange,
  
  // Care journey queries
  getAppointments,
  getUpcomingAppointments,
  
  // Plan journey queries
  getClaims,
  getClaimsByStatus,
  
  // Gamification journey queries
  getAchievements,
  getAchievementsByJourney,
  
  // Error simulation utilities
  simulateDatabaseConnectionFailure,
  simulateDatabaseQueryTimeout,
  simulateDatabaseConstraintViolation,
  simulateDatabaseForeignKeyViolation,
  simulateDatabaseRecordNotFound,
  simulateDatabaseTransactionFailure,
  simulateDatabaseConnectionPoolExhaustion,
  
  // Types
  QueryExecutionOptions,
  RecordRetrievalOptions,
  PaginatedResults,
  Journey,
  DatabaseErrorCategory
} from './query.utils';

// ===== TRANSACTION UTILITIES =====

/**
 * Transaction testing utilities for verifying transaction behavior, rollback scenarios, and error conditions.
 * Provides helpers for testing transaction isolation levels, concurrency conflicts, and automatic rollbacks
 * upon error conditions.
 */
export {
  // Transaction test context
  createTransactionTestContext,
  executeTransactionTest,
  
  // Transaction simulation
  simulateTransactionRollback,
  verifyTransactionRollback,
  simulateNestedTransaction,
  
  // Conflict and deadlock simulation
  simulateTransactionConflict,
  simulateDeadlock,
  simulateTransactionTimeout,
  
  // Isolation level testing
  testIsolationLevel,
  shouldIsolationLevelPreventAnomaly,
  
  // Retry and backoff testing
  testTransactionRetry,
  createErrorSimulator,
  simulateBackoffDelays,
  
  // Performance testing
  testTransactionPerformance,
  measureTransactionOverhead,
  
  // Assertion helpers
  assertTransactionResult,
  assertTransactionRollback,
  assertIsolationLevelBehavior,
  assertTransactionPerformance,
  assertRetryBehavior,
  
  // Types
  TransactionTestContext,
  ConflictSimulationOptions,
  DeadlockSimulationOptions,
  IsolationLevelTestOptions,
  RetryTestOptions,
  PerformanceTestOptions,
  TransactionAssertionOptions
} from './transaction.utils';