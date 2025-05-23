/**
 * @file Logging Test Utilities
 * @description Barrel file that exports all logging test utilities, providing a centralized import point
 * for test files to access common testing functions. This file simplifies imports across unit, integration,
 * and e2e tests by exposing a clean, organized API for all logging test utilities.
 */

/**
 * Capture Utilities
 * 
 * Utilities for capturing log output during tests through memory buffers, stream interception,
 * and transport hooks. Enables verification of log content, format, and structure without
 * requiring actual log files or external services.
 */
export {
  // Interfaces
  CapturedLog,
  LogCaptureOptions as LogCaptureEnvironmentOptions,
  // Classes
  InMemoryTransport,
  StreamCapture,
  ConsoleCapture,
  LogAnalyzer,
  LogCaptureEnvironment,
  // Functions
  createLogCapture,
  createJourneyLogCapture,
  createUserLogCapture,
  createRequestLogCapture
} from './log-capture.utils';

/**
 * Mock Utilities
 * 
 * Mock implementations of logging dependencies like transport mechanisms, formatters,
 * and external services. Includes mock implementations of Winston transports, CloudWatch
 * integration, and console output for isolated testing.
 */
export {
  // Classes
  MockTransport,
  MockCloudWatchTransport,
  MockConsoleTransport,
  MockWritableStream,
  MockHttpTransport,
  MockFormatter,
  // Functions
  createMockLoggerConfig,
  createMockLogEntry,
  createJourneyMockLogEntries,
  createMockTransportFactory
} from './mocks';

/**
 * Mock Logger Utilities
 * 
 * Mock implementations of LoggerService for isolated unit testing. Includes a fully-featured
 * mock logger that tracks calls, captures arguments, and simulates the real LoggerService
 * without external dependencies.
 */
export {
  // Interfaces
  LoggerMethodCall,
  MockLoggerOptions,
  // Classes
  MockLogger,
  SimpleLoggerMock
} from './mock-logger.utils';

/**
 * Assertion Utilities
 * 
 * Custom assertion utilities for verifying log content, format, and structure in tests.
 * Includes functions to assert that logs contain expected fields, follow the correct format,
 * include proper context information, and maintain correct log levels.
 */
export {
  // Assertion Functions
  assertLogHasRequiredFields,
  assertLogHasValidLevel,
  assertLogHasLevel,
  assertLogHasValidTimestamp,
  assertLogHasMessage,
  assertLogHasContext,
  assertLogHasRequestId,
  assertLogHasUserId,
  assertLogHasValidJourneyContext,
  assertLogHasJourneyType,
  assertLogHasJourneyResourceId,
  assertLogHasJourneyAction,
  assertLogHasValidErrorInfo,
  assertLogHasErrorMessage,
  assertLogHasErrorName,
  assertLogHasErrorCode,
  assertLogMatchesSchema,
  assertLogIsValidJson,
  assertConsoleLoggedWithLevel,
  // Factory Functions
  createMockLogEntry as createAssertionMockLogEntry,
  createMockErrorInfo,
  createMockJourneyContext
} from './assertion.utils';

/**
 * Context Utilities
 * 
 * Utilities for creating and manipulating test contexts with journey-specific information.
 * Includes functions to generate Health, Care, and Plan journey contexts with appropriate
 * user information, request IDs, and correlation IDs.
 */
export {
  // Context Creation Functions
  createBaseContext,
  createHealthJourneyContext,
  createCareJourneyContext,
  createPlanJourneyContext,
  createCrossJourneyContext,
  createUserContext,
  createRequestContext,
  createCombinedContext,
  createTraceContext,
  propagateContext,
  createErrorContext
} from './test-context.utils';

/**
 * Module Utilities
 * 
 * Utilities for bootstrapping NestJS test modules with properly configured logging.
 * Includes functions to create test modules with real or mock LoggerService, configure
 * test-specific logging options, and integrate with other services like tracing.
 */
export {
  // Interfaces
  CreateTestModuleOptions,
  // Classes
  MockLoggerService,
  MockTracingService,
  // Module Creation Functions
  createTestModule,
  createTestModuleWithMockLogger,
  createTestModuleWithRealLogger,
  createJourneyTestModule,
  createHealthJourneyTestModule,
  createCareJourneyTestModule,
  createPlanJourneyTestModule,
  // Helper Functions
  getTestLogger,
  resetTestLogger,
  createTestLoggerConfig
} from './test-module.utils';

/**
 * Timing Utilities
 * 
 * Utilities for handling asynchronous logging operations and timing in tests.
 * Includes functions for waiting for logs to be written, testing log throttling behavior,
 * and simulating delayed log processing.
 */
export {
  // Interfaces
  RetryOptions,
  LogCaptureOptions,
  // Timing Functions
  wait,
  waitForLogsToProcess,
  waitForLogCount,
  retryOperation,
  simulateThrottledLogging,
  simulateBurstLogging,
  withControlledClock,
  advanceTime,
  withLogCapture,
  createMockLogger
} from './timing.utils';