/**
 * @file Database Mock Exports
 * 
 * This barrel file exports all database mock implementations for easy consumption in tests
 * across the monorepo. It provides a clean, organized API for importing mock implementations
 * of PrismaClient, PrismaService, transaction management utilities, and journey-specific
 * database contexts.
 * 
 * @module @austa/database/test/mocks
 */

// Client Mocks
export * from './prisma-client.mock';

// Service Mocks
export * from './prisma-service.mock';

// Transaction Mocks
export * from './transaction.mock';

// Journey Context Mocks
export * from './journey-context.mock';
export * from './health-context.mock';
export * from './care-context.mock';
export * from './plan-context.mock';

/**
 * Re-export types from the actual implementations to ensure type compatibility
 * between mocks and real implementations.
 */
export type {
  // PrismaClient types
  PrismaClient,
  Prisma,
  PrismaPromise,
  
  // Transaction types
  TransactionOptions,
  IsolationLevel,
  TransactionClient,
  
  // Context types
  JourneyContext,
  HealthContext,
  CareContext,
  PlanContext,
} from '@prisma/client';

// Export utility functions for test setup and teardown

/**
 * Creates a mock PrismaClient instance with pre-configured test data.
 * 
 * @param options - Configuration options for the mock client
 * @returns A mock PrismaClient instance
 */
export function createMockPrismaClient(options?: {
  seedTestData?: boolean;
  mockResponses?: Record<string, unknown>;
}) {
  // This function will be implemented in prisma-client.mock.ts
  // We're just re-exporting it here for convenience
  const { mockPrismaClient } = require('./prisma-client.mock');
  return mockPrismaClient(options);
}

/**
 * Creates a mock PrismaService instance with pre-configured test data.
 * 
 * @param options - Configuration options for the mock service
 * @returns A mock PrismaService instance
 */
export function createMockPrismaService(options?: {
  seedTestData?: boolean;
  mockResponses?: Record<string, unknown>;
  simulateErrors?: boolean;
}) {
  // This function will be implemented in prisma-service.mock.ts
  // We're just re-exporting it here for convenience
  const { mockPrismaService } = require('./prisma-service.mock');
  return mockPrismaService(options);
}

/**
 * Creates a mock transaction manager for testing transaction-dependent code.
 * 
 * @param options - Configuration options for the mock transaction
 * @returns A mock transaction manager
 */
export function createMockTransaction(options?: {
  shouldFail?: boolean;
  simulateDeadlock?: boolean;
  simulateTimeout?: boolean;
}) {
  // This function will be implemented in transaction.mock.ts
  // We're just re-exporting it here for convenience
  const { mockTransaction } = require('./transaction.mock');
  return mockTransaction(options);
}

/**
 * Creates a mock journey context for testing journey-specific database operations.
 * 
 * @param journeyType - The type of journey context to create
 * @param options - Configuration options for the mock context
 * @returns A mock journey context
 */
export function createMockJourneyContext(journeyType: 'health' | 'care' | 'plan', options?: {
  seedTestData?: boolean;
  mockResponses?: Record<string, unknown>;
  simulateErrors?: boolean;
}) {
  // This function will dispatch to the appropriate journey context mock
  // based on the journeyType parameter
  switch (journeyType) {
    case 'health':
      const { mockHealthContext } = require('./health-context.mock');
      return mockHealthContext(options);
    case 'care':
      const { mockCareContext } = require('./care-context.mock');
      return mockCareContext(options);
    case 'plan':
      const { mockPlanContext } = require('./plan-context.mock');
      return mockPlanContext(options);
    default:
      const { mockBaseJourneyContext } = require('./journey-context.mock');
      return mockBaseJourneyContext(options);
  }
}

/**
 * Utility function to clean up all mock database resources after tests.
 * 
 * @param mocks - Array of mock instances to clean up
 */
export function cleanupMocks(mocks: Array<{ $disconnect?: () => Promise<void> }>) {
  return Promise.all(mocks.map(mock => mock.$disconnect?.() || Promise.resolve()));
}

/**
 * Utility function to reset all mock implementations to their default state.
 * Useful between test runs to ensure clean test state.
 * 
 * @param options - Configuration options for reset behavior
 */
export function resetAllMocks(options?: {
  clearAllMockImplementations?: boolean;
  resetMockResponses?: boolean;
}) {
  // This will reset all Jest mock implementations
  jest.resetAllMocks();
  
  // Additional reset logic can be implemented here or in the individual mock files
  // and called from here for convenience
}