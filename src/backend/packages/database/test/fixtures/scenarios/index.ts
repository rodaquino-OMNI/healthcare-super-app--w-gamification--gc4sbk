/**
 * @file Database Test Scenario Fixtures
 * @description Centralized export point for all database test scenario fixtures.
 * This barrel file provides easy access to specialized database test scenarios
 * related to transactions, error handling, connection pooling, journey contexts,
 * and data validation, promoting code reuse and standardized testing patterns
 * across the database package.
 */

// Import all scenario collections
import * as transactionScenarios from './transaction-scenarios';
import * as errorHandlingScenarios from './error-handling-scenarios';
import * as connectionPoolScenarios from './connection-pool-scenarios';
import * as journeyContextScenarios from './journey-context-scenarios';
import * as dataValidationScenarios from './data-validation-scenarios';

/**
 * Transaction management test scenarios
 * 
 * Provides fixtures for testing transaction commits, rollbacks, and nested
 * transactions across journey services. Includes scenarios for successful
 * completions, partial rollbacks, and complex nested transactions.
 */
export const transactions = transactionScenarios;

/**
 * Error handling test scenarios
 * 
 * Provides fixtures for testing database error handling, including connection
 * failures, constraint violations, timeout errors, and deadlocks. Simulates
 * various error conditions to ensure proper error detection and handling.
 */
export const errors = errorHandlingScenarios;

/**
 * Connection pool test scenarios
 * 
 * Provides fixtures for testing database connection pooling, including pool
 * initialization, connection reuse, timeout handling, and resource cleanup
 * across high-concurrency operations.
 */
export const connections = connectionPoolScenarios;

/**
 * Journey context test scenarios
 * 
 * Provides fixtures for testing journey-specific database contexts, enabling
 * isolated testing of Health, Care, and Plan journey database operations.
 * Validates proper context isolation and cross-journey data access patterns.
 */
export const journeys = journeyContextScenarios;

/**
 * Data validation test scenarios
 * 
 * Provides fixtures for testing data validation, focusing on Prisma schema
 * constraints, custom validators, and runtime type checking. Includes test
 * cases for both valid and invalid data patterns across all journey entities.
 */
export const validation = dataValidationScenarios;

/**
 * All database test scenarios grouped by category
 * 
 * Provides a structured collection of all database test scenarios, organized
 * by functional category for easy access in test files.
 */
export const scenarios = {
  transactions,
  errors,
  connections,
  journeys,
  validation
};

// Re-export all individual scenarios for direct access
export * from './transaction-scenarios';
export * from './error-handling-scenarios';
export * from './connection-pool-scenarios';
export * from './journey-context-scenarios';
export * from './data-validation-scenarios';

// Default export for convenient import
export default scenarios;