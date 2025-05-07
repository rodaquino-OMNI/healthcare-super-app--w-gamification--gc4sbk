/**
 * Jest setup file for the AUSTA SuperApp shared module
 * This file configures the test environment before tests are run
 */

// Set up environment variables for testing
process.env.NODE_ENV = 'test';

// Increase timeout for async operations in tests
jest.setTimeout(30000);

// Add global test utilities and mocks
global.testUtils = {
  // Add utility functions that can be used across tests
  createMockLogger: () => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  }),
  
  // Mock database client for testing without actual database connections
  createMockPrismaClient: () => ({
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn((callback) => callback()),
    $on: jest.fn(),
  }),
};

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});