/**
 * @file Barrel file that exports all mock implementations for the logging package.
 * This file provides a centralized point to access all mock classes, interfaces, and utilities,
 * ensuring consistent usage patterns across test files.
 */

/**
 * Mock implementation of the LoggerService for testing components that depend on logging functionality.
 * Provides a simplified logger with tracking of logged messages at different levels and configurable behavior.
 */
export * from './logger.service.mock';

/**
 * Mock implementation of the context management system for testing components that depend on logging contexts.
 * Provides a simplified context manager that can be preset with contexts for different scopes and tracks context operations.
 */
export * from './context-manager.mock';

/**
 * Mock implementations of transport interfaces for testing logging components that depend on transports.
 * Provides configurable transports that track write calls and can simulate success or failure.
 */
export * from './transport.mock';

/**
 * Mock implementations of formatter interfaces for testing logging components that depend on formatters.
 * Provides configurable formatters that track format calls and return predetermined output.
 */
export * from './formatter.mock';

/**
 * Mock implementation of NestJS Logger and LoggerService for testing components that depend on the NestJS logging system.
 * Provides a simplified Logger with tracking of logged messages and configurable behavior.
 */
export * from './nest-logger.mock';

/**
 * Mock implementation of AWS SDK CloudWatch Logs client for testing the CloudWatch transport without making real AWS API calls.
 * Provides a simulated CloudWatch Logs client that records operations and can be configured to return success or failure responses.
 */
export * from './aws-sdk.mock';

/**
 * Mock implementation of NestJS ConfigService for testing logging components that depend on configuration values.
 * Provides a configurable key-value store that can be preset with test values and allows configuration changes during tests.
 */
export * from './config.service.mock';

/**
 * Mock implementation of the TracingService for testing logging components that depend on distributed tracing.
 * Provides simplified span creation with controllable behavior, allowing tests to verify trace correlation and error handling.
 */
export * from './tracing.service.mock';

/**
 * Utility functions for setting up and cleaning up test environments for logging components.
 * Includes helpers for creating mock contexts, configuring test logging environments, and resetting state between tests.
 */
export * from './test-utils';