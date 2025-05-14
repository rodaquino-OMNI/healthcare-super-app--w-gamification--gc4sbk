/**
 * @file Logging Test Utilities
 * 
 * This barrel file exports all logging test utilities, providing a centralized import point
 * for test files to access common testing functions. It simplifies imports across unit,
 * integration, and e2e tests by exposing a clean, organized API for all logging test utilities.
 * 
 * The utilities are organized into functional categories:
 * - Capture: Utilities for capturing log output during tests
 * - Mocks: Mock implementations of logging dependencies
 * - Assertions: Custom assertion utilities for verifying log content
 * - Context: Utilities for creating test contexts with journey information
 * - Module: Utilities for bootstrapping NestJS test modules
 * - Timing: Utilities for handling asynchronous logging operations
 */

// ===================================================================
// Capture Utilities
// ===================================================================

/**
 * Utilities for capturing log output during tests through memory buffers,
 * stream interception, and transport hooks. Enables verification of log content,
 * format, and structure without requiring actual log files or external services.
 */
export {
  LogCapture,
  LogCaptureOptions,
  createLogCapture,
  captureLogsAsync,
  captureLogs,
  parseLogString,
  StreamInterceptor,
  createStreamInterceptor,
  interceptStreams,
  interceptStreamsAsync,
  LogAnalyzer,
  createLogAnalyzer,
  analyzeLogsFromFunction,
  analyzeLogsFromFunctionAsync
} from './log-capture.utils';

// ===================================================================
// Mock Utilities
// ===================================================================

/**
 * Mock implementations of logging dependencies like transport mechanisms,
 * formatters, and external services. Includes mock implementations of Winston
 * transports, CloudWatch integration, and console output for isolated testing.
 */
export {
  MockWinstonTransport,
  MockCloudWatchTransport,
  MockConsoleTransport,
  MockStreamTransport,
  MockHttpTransport,
  MockFormatter,
  MockWritableStream,
  MockReadableStream,
  createMockLogEntry,
  createMockLoggerConfig,
  createMockTransports
} from './mocks';

/**
 * Mock implementations of LoggerService for isolated unit testing. Includes
 * a fully-featured mock logger that tracks calls, captures arguments, and
 * simulates the real LoggerService without external dependencies.
 */
export {
  MockLoggerService,
  MockLoggerOptions,
  LoggedMessage,
  createMockLogger,
  createJourneyMockLogger,
  createLoggerSpy
} from './mock-logger.utils';

// ===================================================================
// Assertion Utilities
// ===================================================================

/**
 * Custom assertion utilities for verifying log content, format, and structure
 * in tests. Includes functions to assert that logs contain expected fields,
 * follow the correct format, include proper context information, and maintain
 * correct log levels.
 */
export {
  assertLogContains,
  assertLogHasLevel,
  assertLogHasJourney,
  assertLogHasContext,
  assertLogHasRequestId,
  assertLogHasUserId,
  assertLogHasCorrelationId,
  assertLogHasError,
  assertLogHasErrorCode,
  assertLogHasErrorName,
  assertLogFormat,
  assertLogCount,
  assertNoErrorLogs,
  assertHasErrorLogs,
  assertLogLevelDistribution,
  assertJourneyDistribution,
  createLogAssertion
} from './assertion.utils';

// ===================================================================
// Context Utilities
// ===================================================================

/**
 * Utilities for creating and manipulating test contexts with journey-specific
 * information. Includes functions to generate Health, Care, and Plan journey
 * contexts with appropriate user information, request IDs, and correlation IDs.
 */
export {
  createTestContext,
  createHealthJourneyContext,
  createCareJourneyContext,
  createPlanJourneyContext,
  createUserContext,
  createRequestContext,
  createTraceContext,
  mergeContexts,
  TestContextOptions,
  JourneyContextOptions,
  UserContextOptions,
  RequestContextOptions,
  TraceContextOptions
} from './test-context.utils';

// ===================================================================
// Module Utilities
// ===================================================================

/**
 * Utilities for bootstrapping NestJS test modules with properly configured
 * logging. Includes functions to create test modules with real or mock
 * LoggerService, configure test-specific logging options, and integrate
 * with other services like tracing.
 */
export {
  createTestingModule,
  createLoggerTestingModule,
  createJourneyTestingModule,
  createHealthJourneyTestingModule,
  createCareJourneyTestingModule,
  createPlanJourneyTestingModule,
  TestModuleOptions,
  LoggerTestModuleOptions,
  JourneyTestModuleOptions
} from './test-module.utils';

// ===================================================================
// Timing Utilities
// ===================================================================

/**
 * Utilities for handling asynchronous logging operations and timing in tests.
 * Includes functions for waiting for logs to be written, testing log throttling
 * behavior, and simulating delayed log processing.
 */
export {
  waitForLogs,
  waitForLogCount,
  waitForLogWithMessage,
  waitForLogWithLevel,
  waitForLogWithJourney,
  waitForLogWithError,
  simulateDelay,
  simulateThrottling,
  advanceTime,
  retryOperation,
  WaitOptions,
  RetryOptions,
  DelayOptions
} from './timing.utils';