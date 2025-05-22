/**
 * @file Database Test Scenario Fixtures
 * 
 * This barrel file exports all database test scenario fixtures for easy importing in test files.
 * It provides a centralized entry point for accessing specialized database test scenarios related to
 * transactions, error handling, connection pooling, journey contexts, and data validation.
 * 
 * These fixtures promote code reuse and standardized testing patterns across the database package.
 * 
 * @module database/test/fixtures/scenarios
 */

// Transaction Management Scenarios
import * as transactionScenarios from './transaction-scenarios';

// Error Handling Scenarios
import * as errorHandlingScenarios from './error-handling-scenarios';

// Connection Pool Scenarios
import * as connectionPoolScenarios from './connection-pool-scenarios';

// Journey Context Scenarios
import * as journeyContextScenarios from './journey-context-scenarios';

// Data Validation Scenarios
import * as dataValidationScenarios from './data-validation-scenarios';

/**
 * Database transaction test scenarios for testing transaction commits, rollbacks,
 * and nested transactions across journey services.
 */
export const transactions = transactionScenarios;

/**
 * Database error handling test scenarios for testing connection failures,
 * constraint violations, timeout errors, and deadlocks.
 */
export const errorHandling = errorHandlingScenarios;

/**
 * Database connection pool test scenarios for testing connection management,
 * pool initialization, connection reuse, and resource cleanup.
 */
export const connectionPool = connectionPoolScenarios;

/**
 * Journey-specific database context test scenarios for testing isolated
 * database operations across Health, Care, and Plan journeys.
 */
export const journeyContexts = journeyContextScenarios;

/**
 * Data validation test scenarios for testing Prisma schema constraints,
 * custom validators, and runtime type checking.
 */
export const dataValidation = dataValidationScenarios;

/**
 * Comprehensive collection of all database test scenarios organized by category.
 * 
 * This object provides a structured way to access all test scenarios by their category,
 * making it easier to import specific scenario groups in test files.
 */
export const scenarios = {
  /**
   * Transaction management test scenarios
   */
  transactions,
  
  /**
   * Error handling test scenarios
   */
  errorHandling,
  
  /**
   * Connection pool test scenarios
   */
  connectionPool,
  
  /**
   * Journey context test scenarios
   */
  journeyContexts,
  
  /**
   * Data validation test scenarios
   */
  dataValidation,
};

// Default export for convenient importing
export default scenarios;