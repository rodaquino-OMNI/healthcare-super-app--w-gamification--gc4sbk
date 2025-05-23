/**
 * @file Barrel file that exports all utility functions from the e2e/utils directory
 * @description Provides a clean and organized way to import logging test utilities throughout the test suite.
 * Ensures consistent import patterns and reduces import statements in test files.
 * Essential for maintaining a well-structured module system within the logging package tests.
 */

/**
 * Environment utilities for manipulating environment settings during tests.
 * Includes functions to set environment variables, simulate different deployment environments
 * (development, staging, production), and restore original settings after tests.
 * @module environmentUtils
 */
export * from './environment.utils';

/**
 * Journey context utilities for creating and manipulating journey-specific contexts in tests.
 * Includes functions to generate Health, Care, and Plan journey contexts with appropriate
 * metadata and user information.
 * @module journeyContextUtils
 */
export * from './journey-context.utils';

/**
 * Trace context utilities for creating and manipulating trace contexts in tests.
 * Includes functions to generate trace IDs, create span contexts, and simulate
 * distributed tracing environments.
 * @module traceContextUtils
 */
export * from './trace-context.utils';

/**
 * Log parser utilities for parsing and analyzing log output in structured formats.
 * Includes functions to parse JSON logs, extract fields, validate format compliance,
 * and analyze log structure.
 * @module logParserUtils
 */
export * from './log-parser.utils';

/**
 * Test application utilities for bootstrapping test applications with configured logging for e2e tests.
 * Contains functions to create and configure NestJS test modules with the LoggerModule,
 * TracingModule, and other required dependencies.
 * @module testAppUtils
 */
export * from './test-app.utils';

/**
 * Mock transport utilities that provide mock implementations of logging transports for testing purposes.
 * Includes in-memory, console, and mock CloudWatch transports that mimic the behavior
 * of real log transports but allow for inspection and verification in tests.
 * @module mockTransportUtils
 */
export * from './mock-transport.utils';

/**
 * Log capture utilities for capturing, storing, and retrieving log output during e2e tests.
 * Implements in-memory and file-based log capture mechanisms that intercept the standard
 * logging output, allowing tests to verify that logs contain expected content, format, and levels.
 * @module logCaptureUtils
 */
export * from './log-capture.utils';