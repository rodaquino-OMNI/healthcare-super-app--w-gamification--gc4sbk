/**
 * @file Barrel file that exports all utility functions from the e2e/utils directory
 * @module logging/test/e2e/utils
 * @description 
 * This barrel file provides a clean and organized way to import logging test utilities
 * throughout the test suite. It ensures consistent import patterns and reduces import
 * statements in test files, maintaining a well-structured module system within the
 * logging package tests.
 */

/**
 * Utilities for manipulating environment settings during tests.
 * Includes functions to set environment variables, simulate different deployment environments
 * (development, staging, production), and restore original settings after tests.
 * 
 * @example
 * import { setTestEnvironment, restoreEnvironment } from '@austa/logging/test/e2e/utils';
 * 
 * beforeEach(() => {
 *   setTestEnvironment('production');
 * });
 * 
 * afterEach(() => {
 *   restoreEnvironment();
 * });
 */
export * from './environment.utils';

/**
 * Utilities for creating and manipulating journey-specific contexts in tests.
 * Includes functions to generate Health, Care, and Plan journey contexts with
 * appropriate metadata and user information.
 * 
 * @example
 * import { createHealthJourneyContext } from '@austa/logging/test/e2e/utils';
 * 
 * const context = createHealthJourneyContext({ userId: '123', requestId: 'req-456' });
 */
export * from './journey-context.utils';

/**
 * Utilities for creating and manipulating trace contexts in tests.
 * Includes functions to generate trace IDs, create span contexts, and
 * simulate distributed tracing environments.
 * 
 * @example
 * import { createTraceContext, withTraceId } from '@austa/logging/test/e2e/utils';
 * 
 * const traceContext = createTraceContext();
 * const logEntry = withTraceId(logData, traceContext.traceId);
 */
export * from './trace-context.utils';

/**
 * Utilities for parsing and analyzing log output in structured formats.
 * Includes functions to parse JSON logs, extract fields, validate format compliance,
 * and analyze log structure.
 * 
 * @example
 * import { parseJsonLog, validateLogFormat } from '@austa/logging/test/e2e/utils';
 * 
 * const parsedLog = parseJsonLog(logOutput);
 * expect(validateLogFormat(parsedLog)).toBe(true);
 */
export * from './log-parser.utils';

/**
 * Utilities for bootstrapping test applications with configured logging for e2e tests.
 * Contains functions to create and configure NestJS test modules with the LoggerModule,
 * TracingModule, and other required dependencies.
 * 
 * @example
 * import { createTestingApp } from '@austa/logging/test/e2e/utils';
 * 
 * const app = await createTestingApp({
 *   imports: [YourModule],
 *   logLevel: 'debug'
 * });
 */
export * from './test-app.utils';

/**
 * Mock implementations of logging transports for testing purposes.
 * Includes in-memory, console, and mock CloudWatch transports that mimic
 * the behavior of real log transports but allow for inspection and verification in tests.
 * 
 * @example
 * import { createMockCloudWatchTransport } from '@austa/logging/test/e2e/utils';
 * 
 * const mockTransport = createMockCloudWatchTransport();
 * const logs = mockTransport.getLogs();
 */
export * from './mock-transport.utils';

/**
 * Utilities for capturing, storing, and retrieving log output during e2e tests.
 * Implements in-memory and file-based log capture mechanisms that intercept
 * the standard logging output.
 * 
 * @example
 * import { captureLogOutput, getLogEntries } from '@austa/logging/test/e2e/utils';
 * 
 * beforeEach(() => {
 *   captureLogOutput();
 * });
 * 
 * it('should log error messages', () => {
 *   logger.error('Test error');
 *   const logs = getLogEntries();
 *   expect(logs).toContainEqual(expect.objectContaining({ level: 'error', message: 'Test error' }));
 * });
 */
export * from './log-capture.utils';