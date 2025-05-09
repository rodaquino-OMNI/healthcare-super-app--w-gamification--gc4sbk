/**
 * @file Database Mock Exports
 * 
 * This barrel file exports all database mock implementations for easy consumption in tests
 * across the monorepo. It provides a clean, organized API for importing mock implementations
 * of PrismaClient, PrismaService, transaction management utilities, and journey-specific
 * database contexts.
 *
 * @module database/test/mocks
 */

// Client Mocks
export * from './prisma-client.mock';

// Service Mocks
export * from './prisma-service.mock';

// Transaction Mocks
export * from './transaction.mock';

// Context Mocks
export * from './journey-context.mock';
export * from './health-context.mock';
export * from './care-context.mock';
export * from './plan-context.mock';

/**
 * Utility Functions
 */

/**
 * Creates a clean database test environment with mocked database components.
 * Use this at the beginning of your test suite to ensure a consistent starting point.
 *
 * @example
 * beforeAll(async () => {
 *   await setupDatabaseTestEnvironment();
 * });
 */
export const setupDatabaseTestEnvironment = async (): Promise<void> => {
  // Reset all mocks to their initial state
  jest.resetAllMocks();
  
  // Additional setup logic can be added here as needed
};

/**
 * Cleans up the database test environment after tests.
 * Use this at the end of your test suite to ensure proper cleanup.
 *
 * @example
 * afterAll(async () => {
 *   await cleanupDatabaseTestEnvironment();
 * });
 */
export const cleanupDatabaseTestEnvironment = async (): Promise<void> => {
  // Additional cleanup logic can be added here as needed
};

/**
 * Creates a mock database transaction for testing transaction-dependent code.
 * Returns a mock transaction object that can be used in place of a real transaction.
 *
 * @example
 * const mockTx = createMockTransaction();
 * await service.someMethodThatUsesTransactions(mockTx);
 */
export const createMockTransaction = () => {
  // Import from transaction mock to avoid circular dependencies
  const { createMockTransactionClient } = require('./transaction.mock');
  return createMockTransactionClient();
};

/**
 * Type Exports
 */

// Re-export types from the mocks for easier consumption
export type { MockPrismaClient } from './prisma-client.mock';
export type { MockPrismaService } from './prisma-service.mock';
export type { MockTransactionService, MockTransactionClient } from './transaction.mock';
export type { MockJourneyContext } from './journey-context.mock';
export type { MockHealthContext } from './health-context.mock';
export type { MockCareContext } from './care-context.mock';
export type { MockPlanContext } from './plan-context.mock';

/**
 * Factory Functions
 */

/**
 * Creates a fully configured mock PrismaService instance with customizable behavior.
 * 
 * @param options Configuration options for the mock PrismaService
 * @returns A configured mock PrismaService instance
 * 
 * @example
 * const mockPrismaService = createMockPrismaService({
 *   shouldFailOnConnect: false,
 *   mockData: {
 *     user: [{ id: '1', name: 'Test User' }]
 *   }
 * });
 */
export const createMockPrismaService = (options = {}) => {
  // Import from service mock to avoid circular dependencies
  const { createMockPrismaService: createService } = require('./prisma-service.mock');
  return createService(options);
};

/**
 * Creates mock journey contexts for testing journey-specific functionality.
 * 
 * @param options Configuration options for the mock journey contexts
 * @returns An object containing mock contexts for all journeys
 * 
 * @example
 * const { healthContext, careContext, planContext } = createMockJourneyContexts({
 *   health: { mockHealthMetrics: true },
 *   care: { mockAppointments: true },
 *   plan: { mockClaims: true }
 * });
 */
export const createMockJourneyContexts = (options = {}) => {
  // Import from context mocks to avoid circular dependencies
  const { createMockHealthContext } = require('./health-context.mock');
  const { createMockCareContext } = require('./care-context.mock');
  const { createMockPlanContext } = require('./plan-context.mock');
  
  return {
    healthContext: createMockHealthContext(options.health),
    careContext: createMockCareContext(options.care),
    planContext: createMockPlanContext(options.plan),
  };
};