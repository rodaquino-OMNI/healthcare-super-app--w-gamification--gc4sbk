/**
 * @file index.ts
 * @description Barrel file that exports all logging test utilities.
 * This file provides a centralized import point for test files to access common testing functions.
 * It simplifies imports across unit, integration, and e2e tests by exposing a clean, organized API.
 */

/**
 * Mock implementations of logging dependencies for testing purposes.
 * These mocks allow for isolated testing of logging functionality without requiring
 * actual external logging services or infrastructure.
 */
export * from './mocks';

/**
 * Assertion utilities for verifying log content, format, and structure in tests.
 * These utilities help ensure that logs adhere to the standardized format and contain all required information.
 */
export * from './assertion.utils';

/**
 * Utilities for creating and manipulating test contexts with journey-specific information.
 * These utilities are essential for testing that logging properly incorporates journey context into log entries.
 */
export * from './test-context.utils';

/**
 * Utilities for capturing log output during tests through memory buffers, stream interception, and transport hooks.
 * Enables verification of log content, format, and structure without requiring actual log files or external services.
 */
export * from './log-capture.utils';