/**
 * Database Testing Utilities
 * 
 * This module exports all database testing utilities for easy consumption within test suites
 * across the monorepo. It centralizes exports for database setup/teardown functions, data factory
 * utilities, assertion helpers, query utilities, and transaction testing helpers to provide a
 * clean, organized API for database testing.
 */

// ========================================================================
// Core Database Testing Utilities
// ========================================================================

export {
  // Types
  TestDatabaseConfig,
  TestDatabase,
  
  // Environment Configuration
  loadTestEnvironment,
  generateDatabaseUrl,
  generateSchemaId,
  
  // Database Connection Management
  createPrismaClient,
  
  // Database Setup and Migration
  applyMigrations,
  seedTestDatabase,
  
  // Database Cleanup
  dropTestSchema,
  cleanupTestDatabase,
  
  // Main Test Database Setup
  createTestDatabase,
  createJourneyTestDatabase,
  
  // Jest Lifecycle Hooks
  setupTestDatabaseBeforeAll,
  setupTestDatabaseBeforeEach,
} from './database-test.utils';

// ========================================================================
// Data Factory Utilities
// ========================================================================

export {
  // Helper Functions
  randomDate,
  createBulkFactory,
  
  // Auth Entities
  UserFactoryData,
  createUser,
  createUsers,
  PermissionFactoryData,
  createPermission,
  createPermissions,
  RoleFactoryData,
  createRole,
  createRoles,
  
  // Health Journey Entities
  HealthMetricTypeFactoryData,
  createHealthMetricType,
  createHealthMetricTypes,
  DeviceTypeFactoryData,
  createDeviceType,
  createDeviceTypes,
  HealthMetricFactoryData,
  createHealthMetric,
  createHealthMetrics,
  HealthGoalFactoryData,
  createHealthGoal,
  createHealthGoals,
  DeviceConnectionFactoryData,
  createDeviceConnection,
  createDeviceConnections,
  
  // Care Journey Entities
  ProviderSpecialtyFactoryData,
  createProviderSpecialty,
  createProviderSpecialties,
  ProviderFactoryData,
  createProvider,
  createProviders,
  AppointmentFactoryData,
  createAppointment,
  createAppointments,
  MedicationFactoryData,
  createMedication,
  createMedications,
  TreatmentFactoryData,
  createTreatment,
  createTreatments,
  
  // Plan Journey Entities
  InsurancePlanTypeFactoryData,
  createInsurancePlanType,
  createInsurancePlanTypes,
  ClaimTypeFactoryData,
  createClaimType,
  createClaimTypes,
  InsurancePlanFactoryData,
  createInsurancePlan,
  createInsurancePlans,
  ClaimFactoryData,
  createClaim,
  createClaims,
  BenefitFactoryData,
  createBenefit,
  createBenefits,
  
  // Gamification Entities
  AchievementTypeFactoryData,
  createAchievementType,
  createAchievementTypes,
  AchievementFactoryData,
  createAchievement,
  createAchievements,
  RewardFactoryData,
  createReward,
  createRewards,
  GamificationProfileFactoryData,
  createGamificationProfile,
  createGamificationProfiles,
  RewardRedemptionFactoryData,
  createRewardRedemption,
  createRewardRedemptions,
  EventFactoryData,
  createEvent,
  createEvents,
} from './factory.utils';

// ========================================================================
// Assertion Utilities
// ========================================================================

export {
  // Types
  AssertionOptions,
  AssertionResult,
  EntityComparisonOptions,
  RelationshipAssertionOptions,
  SchemaValidationOptions,
  
  // Assertion Utilities Class
  AssertionTestUtils,
  createAssertionTestUtils,
  
  // Schema Utilities
  createEntitySchema,
  createPartialEntitySchema,
} from './assertion.utils';

// ========================================================================
// Query Utilities
// ========================================================================

export {
  // Types
  PaginationParams,
  SortingParams,
  FilteringParams,
  QueryOptions,
  PaginatedResult,
  
  // Query Utilities Class
  QueryTestUtils,
  createQueryTestUtils,
  
  // Query Helper Functions
  buildWhereClause,
  buildSearchCondition,
  buildPaginationParams,
  buildSortingParams,
} from './query.utils';

// ========================================================================
// Transaction Testing Utilities
// ========================================================================

export {
  // Types
  TransactionTestOptions,
  TransactionTestResult,
  
  // Transaction Test Functions
  testTransaction,
  testTransactionRollback,
  simulateTransactionConflict,
  simulateDeadlock,
  testTransactionRetry,
  verifyTransactionIsolation,
  measureTransactionPerformance,
  testOptimisticLocking,
  
  // Test Table Management
  ensureTestIsolationTable,
  dropTestIsolationTable,
} from './transaction.utils';

// ========================================================================
// Convenience Re-exports
// ========================================================================

/**
 * Creates a complete test database setup with all necessary utilities
 * 
 * @param config - Test database configuration
 * @returns Object containing all database test utilities
 */
export function createDatabaseTestSuite(config: import('./database-test.utils').TestDatabaseConfig) {
  return {
    // Create the test database
    createTestDb: () => import('./database-test.utils').createTestDatabase(config),
    
    // Create journey-specific test database
    createJourneyTestDb: (journey: 'health' | 'care' | 'plan' | 'gamification') => 
      import('./database-test.utils').createJourneyTestDatabase(journey, config),
    
    // Create utility instances
    createAssertionUtils: (prisma: import('@prisma/client').PrismaClient) => 
      import('./assertion.utils').createAssertionTestUtils(prisma),
    
    createQueryUtils: (prisma: import('@prisma/client').PrismaClient) => 
      import('./query.utils').createQueryTestUtils(prisma),
    
    // Jest lifecycle hooks
    setupBeforeAll: () => import('./database-test.utils').setupTestDatabaseBeforeAll(config),
    setupBeforeEach: () => import('./database-test.utils').setupTestDatabaseBeforeEach(config),
    
    // Re-export all utility functions
    ...{
      // Factory utilities
      factory: require('./factory.utils'),
      
      // Assertion utilities
      assertion: require('./assertion.utils'),
      
      // Query utilities
      query: require('./query.utils'),
      
      // Transaction utilities
      transaction: require('./transaction.utils'),
    },
  };
}

/**
 * Creates a minimal set of database test utilities for simple test cases
 * 
 * @param prisma - PrismaClient instance
 * @returns Object containing essential database test utilities
 */
export function createSimpleDatabaseTestUtils(prisma: import('@prisma/client').PrismaClient) {
  return {
    assertion: import('./assertion.utils').createAssertionTestUtils(prisma),
    query: import('./query.utils').createQueryTestUtils(prisma),
    factory: require('./factory.utils'),
  };
}