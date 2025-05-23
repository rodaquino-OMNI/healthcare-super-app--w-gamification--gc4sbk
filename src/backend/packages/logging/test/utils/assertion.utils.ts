import { LogEntry, JourneyContext, JourneyType, ErrorInfo } from '../../src/interfaces/log-entry.interface';
import { LogLevel, LogLevelString, LogLevelUtils } from '../../src/interfaces/log-level.enum';

/**
 * Custom assertion utilities for verifying log content, format, and structure in tests.
 * Provides functions to assert that logs contain expected fields, follow the correct format,
 * include proper context information, and maintain correct log levels.
 */

/**
 * Asserts that a log entry has the required base fields.
 * @param logEntry The log entry to validate
 * @param message Optional custom error message
 */
export function assertLogHasRequiredFields(logEntry: any, message?: string): void {
  const requiredFields = ['message', 'level', 'timestamp'];
  const missingFields = requiredFields.filter(field => !(field in logEntry));
  
  if (missingFields.length > 0) {
    throw new Error(
      message || 
      `Log entry is missing required fields: ${missingFields.join(', ')}. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry has a valid log level.
 * @param logEntry The log entry to validate
 * @param message Optional custom error message
 */
export function assertLogHasValidLevel(logEntry: any, message?: string): void {
  if (!('level' in logEntry)) {
    throw new Error(
      message || 
      `Log entry is missing 'level' field. Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  try {
    // If level is a number, check if it's a valid LogLevel enum value
    if (typeof logEntry.level === 'number') {
      const validLevels = LogLevelUtils.getAllLevels();
      if (!validLevels.includes(logEntry.level)) {
        throw new Error(
          message || 
          `Log entry has invalid numeric level: ${logEntry.level}. ` +
          `Valid levels are: ${validLevels.join(', ')}. ` +
          `Log entry: ${JSON.stringify(logEntry)}`
        );
      }
    } 
    // If level is a string, check if it's a valid log level string
    else if (typeof logEntry.level === 'string') {
      LogLevelUtils.fromString(logEntry.level);
    } 
    // Otherwise, it's an invalid level type
    else {
      throw new Error(
        message || 
        `Log entry has invalid level type: ${typeof logEntry.level}. ` +
        `Expected 'number' or 'string'. Log entry: ${JSON.stringify(logEntry)}`
      );
    }
  } catch (error) {
    throw new Error(
      message || 
      `Log entry has invalid level: ${logEntry.level}. ` +
      `Error: ${error.message}. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry has the specified log level.
 * @param logEntry The log entry to validate
 * @param expectedLevel The expected log level (as LogLevel enum or string)
 * @param message Optional custom error message
 */
export function assertLogHasLevel(
  logEntry: any, 
  expectedLevel: LogLevel | LogLevelString, 
  message?: string
): void {
  assertLogHasValidLevel(logEntry);
  
  let expectedLevelValue: LogLevel;
  let expectedLevelString: LogLevelString;
  
  // Convert expected level to both numeric and string form for comparison
  if (typeof expectedLevel === 'number') {
    expectedLevelValue = expectedLevel;
    expectedLevelString = LogLevelUtils.toString(expectedLevel);
  } else {
    expectedLevelValue = LogLevelUtils.fromString(expectedLevel);
    expectedLevelString = expectedLevel;
  }
  
  // Compare based on the type of the actual level
  if (typeof logEntry.level === 'number') {
    if (logEntry.level !== expectedLevelValue) {
      throw new Error(
        message || 
        `Log entry has incorrect level: ${logEntry.level} (${LogLevelUtils.toString(logEntry.level)}). ` +
        `Expected: ${expectedLevelValue} (${expectedLevelString}). ` +
        `Log entry: ${JSON.stringify(logEntry)}`
      );
    }
  } else if (typeof logEntry.level === 'string') {
    const normalizedLevel = logEntry.level.toLowerCase();
    if (normalizedLevel !== expectedLevelString) {
      throw new Error(
        message || 
        `Log entry has incorrect level: '${logEntry.level}'. ` +
        `Expected: '${expectedLevelString}'. ` +
        `Log entry: ${JSON.stringify(logEntry)}`
      );
    }
  }
}

/**
 * Asserts that a log entry has a timestamp that is a valid Date.
 * @param logEntry The log entry to validate
 * @param message Optional custom error message
 */
export function assertLogHasValidTimestamp(logEntry: any, message?: string): void {
  if (!('timestamp' in logEntry)) {
    throw new Error(
      message || 
      `Log entry is missing 'timestamp' field. Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  const timestamp = logEntry.timestamp;
  const isValidDate = timestamp instanceof Date || 
    (typeof timestamp === 'string' && !isNaN(Date.parse(timestamp)));
  
  if (!isValidDate) {
    throw new Error(
      message || 
      `Log entry has invalid timestamp: ${timestamp}. ` +
      `Expected a valid Date or date string. Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry has the specified message.
 * @param logEntry The log entry to validate
 * @param expectedMessage The expected message
 * @param exactMatch Whether to require an exact match (true) or a substring match (false)
 * @param message Optional custom error message
 */
export function assertLogHasMessage(
  logEntry: any, 
  expectedMessage: string, 
  exactMatch: boolean = true, 
  message?: string
): void {
  if (!('message' in logEntry)) {
    throw new Error(
      message || 
      `Log entry is missing 'message' field. Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  if (exactMatch && logEntry.message !== expectedMessage) {
    throw new Error(
      message || 
      `Log entry has incorrect message: '${logEntry.message}'. ` +
      `Expected: '${expectedMessage}'. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  } else if (!exactMatch && !logEntry.message.includes(expectedMessage)) {
    throw new Error(
      message || 
      `Log entry message does not contain expected substring: '${expectedMessage}'. ` +
      `Actual message: '${logEntry.message}'. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry has the specified context information.
 * @param logEntry The log entry to validate
 * @param context The expected context string
 * @param message Optional custom error message
 */
export function assertLogHasContext(logEntry: any, context: string, message?: string): void {
  if (!('context' in logEntry)) {
    throw new Error(
      message || 
      `Log entry is missing 'context' field. Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  if (logEntry.context !== context) {
    throw new Error(
      message || 
      `Log entry has incorrect context: '${logEntry.context}'. ` +
      `Expected: '${context}'. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry has the specified request ID.
 * @param logEntry The log entry to validate
 * @param requestId The expected request ID
 * @param message Optional custom error message
 */
export function assertLogHasRequestId(logEntry: any, requestId: string, message?: string): void {
  if (!('requestId' in logEntry)) {
    throw new Error(
      message || 
      `Log entry is missing 'requestId' field. Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  if (logEntry.requestId !== requestId) {
    throw new Error(
      message || 
      `Log entry has incorrect requestId: '${logEntry.requestId}'. ` +
      `Expected: '${requestId}'. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry has the specified user ID.
 * @param logEntry The log entry to validate
 * @param userId The expected user ID
 * @param message Optional custom error message
 */
export function assertLogHasUserId(logEntry: any, userId: string, message?: string): void {
  if (!('userId' in logEntry)) {
    throw new Error(
      message || 
      `Log entry is missing 'userId' field. Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  if (logEntry.userId !== userId) {
    throw new Error(
      message || 
      `Log entry has incorrect userId: '${logEntry.userId}'. ` +
      `Expected: '${userId}'. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry has a valid journey context.
 * @param logEntry The log entry to validate
 * @param message Optional custom error message
 */
export function assertLogHasValidJourneyContext(logEntry: any, message?: string): void {
  if (!('journey' in logEntry)) {
    throw new Error(
      message || 
      `Log entry is missing 'journey' field. Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  const journey = logEntry.journey;
  
  if (!journey || typeof journey !== 'object') {
    throw new Error(
      message || 
      `Log entry has invalid journey context: ${JSON.stringify(journey)}. ` +
      `Expected an object. Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  if (!('type' in journey)) {
    throw new Error(
      message || 
      `Journey context is missing 'type' field. Journey: ${JSON.stringify(journey)}. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  // Validate journey type
  const validJourneyTypes = Object.values(JourneyType);
  if (!validJourneyTypes.includes(journey.type as JourneyType)) {
    throw new Error(
      message || 
      `Journey context has invalid type: '${journey.type}'. ` +
      `Valid types are: ${validJourneyTypes.join(', ')}. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry has the specified journey type.
 * @param logEntry The log entry to validate
 * @param journeyType The expected journey type
 * @param message Optional custom error message
 */
export function assertLogHasJourneyType(
  logEntry: any, 
  journeyType: JourneyType, 
  message?: string
): void {
  assertLogHasValidJourneyContext(logEntry);
  
  if (logEntry.journey.type !== journeyType) {
    throw new Error(
      message || 
      `Log entry has incorrect journey type: '${logEntry.journey.type}'. ` +
      `Expected: '${journeyType}'. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry has the specified journey resource ID.
 * @param logEntry The log entry to validate
 * @param resourceId The expected resource ID
 * @param message Optional custom error message
 */
export function assertLogHasJourneyResourceId(
  logEntry: any, 
  resourceId: string, 
  message?: string
): void {
  assertLogHasValidJourneyContext(logEntry);
  
  if (!('resourceId' in logEntry.journey)) {
    throw new Error(
      message || 
      `Journey context is missing 'resourceId' field. Journey: ${JSON.stringify(logEntry.journey)}. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  if (logEntry.journey.resourceId !== resourceId) {
    throw new Error(
      message || 
      `Log entry has incorrect journey resourceId: '${logEntry.journey.resourceId}'. ` +
      `Expected: '${resourceId}'. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry has the specified journey action.
 * @param logEntry The log entry to validate
 * @param action The expected action
 * @param message Optional custom error message
 */
export function assertLogHasJourneyAction(
  logEntry: any, 
  action: string, 
  message?: string
): void {
  assertLogHasValidJourneyContext(logEntry);
  
  if (!('action' in logEntry.journey)) {
    throw new Error(
      message || 
      `Journey context is missing 'action' field. Journey: ${JSON.stringify(logEntry.journey)}. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  if (logEntry.journey.action !== action) {
    throw new Error(
      message || 
      `Log entry has incorrect journey action: '${logEntry.journey.action}'. ` +
      `Expected: '${action}'. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry has a valid error information.
 * @param logEntry The log entry to validate
 * @param message Optional custom error message
 */
export function assertLogHasValidErrorInfo(logEntry: any, message?: string): void {
  if (!('error' in logEntry)) {
    throw new Error(
      message || 
      `Log entry is missing 'error' field. Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  const error = logEntry.error;
  
  if (!error || typeof error !== 'object') {
    throw new Error(
      message || 
      `Log entry has invalid error info: ${JSON.stringify(error)}. ` +
      `Expected an object. Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  if (!('message' in error)) {
    throw new Error(
      message || 
      `Error info is missing 'message' field. Error: ${JSON.stringify(error)}. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry has an error with the specified message.
 * @param logEntry The log entry to validate
 * @param errorMessage The expected error message
 * @param exactMatch Whether to require an exact match (true) or a substring match (false)
 * @param message Optional custom error message
 */
export function assertLogHasErrorMessage(
  logEntry: any, 
  errorMessage: string, 
  exactMatch: boolean = true, 
  message?: string
): void {
  assertLogHasValidErrorInfo(logEntry);
  
  if (exactMatch && logEntry.error.message !== errorMessage) {
    throw new Error(
      message || 
      `Log entry has incorrect error message: '${logEntry.error.message}'. ` +
      `Expected: '${errorMessage}'. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  } else if (!exactMatch && !logEntry.error.message.includes(errorMessage)) {
    throw new Error(
      message || 
      `Log entry error message does not contain expected substring: '${errorMessage}'. ` +
      `Actual error message: '${logEntry.error.message}'. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry has an error with the specified name.
 * @param logEntry The log entry to validate
 * @param errorName The expected error name
 * @param message Optional custom error message
 */
export function assertLogHasErrorName(
  logEntry: any, 
  errorName: string, 
  message?: string
): void {
  assertLogHasValidErrorInfo(logEntry);
  
  if (!('name' in logEntry.error)) {
    throw new Error(
      message || 
      `Error info is missing 'name' field. Error: ${JSON.stringify(logEntry.error)}. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  if (logEntry.error.name !== errorName) {
    throw new Error(
      message || 
      `Log entry has incorrect error name: '${logEntry.error.name}'. ` +
      `Expected: '${errorName}'. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry has an error with the specified code.
 * @param logEntry The log entry to validate
 * @param errorCode The expected error code
 * @param message Optional custom error message
 */
export function assertLogHasErrorCode(
  logEntry: any, 
  errorCode: string | number, 
  message?: string
): void {
  assertLogHasValidErrorInfo(logEntry);
  
  if (!('code' in logEntry.error)) {
    throw new Error(
      message || 
      `Error info is missing 'code' field. Error: ${JSON.stringify(logEntry.error)}. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
  
  if (logEntry.error.code !== errorCode) {
    throw new Error(
      message || 
      `Log entry has incorrect error code: '${logEntry.error.code}'. ` +
      `Expected: '${errorCode}'. ` +
      `Log entry: ${JSON.stringify(logEntry)}`
    );
  }
}

/**
 * Asserts that a log entry matches the expected schema.
 * @param logEntry The log entry to validate
 * @param expectedSchema Partial log entry schema to match against
 * @param message Optional custom error message
 */
export function assertLogMatchesSchema(
  logEntry: any, 
  expectedSchema: Partial<LogEntry>, 
  message?: string
): void {
  // Check each field in the expected schema
  for (const [key, value] of Object.entries(expectedSchema)) {
    if (!(key in logEntry)) {
      throw new Error(
        message || 
        `Log entry is missing expected field: '${key}'. ` +
        `Log entry: ${JSON.stringify(logEntry)}`
      );
    }
    
    // For objects, do a deep comparison
    if (value !== null && typeof value === 'object') {
      assertLogMatchesSchema(logEntry[key], value as any, 
        message || `Mismatch in nested field '${key}'`
      );
    } 
    // For primitive values, do a direct comparison
    else if (logEntry[key] !== value) {
      throw new Error(
        message || 
        `Log entry field '${key}' has incorrect value: ${JSON.stringify(logEntry[key])}. ` +
        `Expected: ${JSON.stringify(value)}. ` +
        `Log entry: ${JSON.stringify(logEntry)}`
      );
    }
  }
}

/**
 * Asserts that a log entry is in valid JSON format.
 * @param logString The log string to validate
 * @param message Optional custom error message
 * @returns The parsed log entry
 */
export function assertLogIsValidJson(logString: string, message?: string): any {
  try {
    return JSON.parse(logString);
  } catch (error) {
    throw new Error(
      message || 
      `Log string is not valid JSON: '${logString}'. ` +
      `Error: ${error.message}`
    );
  }
}

/**
 * Asserts that a console.log was called with a specific log level and message.
 * @param consoleSpy The Jest spy on console methods
 * @param level The expected log level
 * @param message The expected message (or substring)
 * @param exactMatch Whether to require an exact match (true) or a substring match (false)
 */
export function assertConsoleLoggedWithLevel(
  consoleSpy: jest.SpyInstance, 
  level: LogLevelString, 
  message: string, 
  exactMatch: boolean = false
): void {
  expect(consoleSpy).toHaveBeenCalled();
  
  const calls = consoleSpy.mock.calls;
  const matchingCalls = calls.filter(call => {
    // Check if the first argument is a string that can be parsed as JSON
    if (typeof call[0] !== 'string') return false;
    
    try {
      const logEntry = JSON.parse(call[0]);
      
      // Check if the log entry has the expected level
      if (typeof logEntry.level !== 'string' || logEntry.level.toLowerCase() !== level) {
        return false;
      }
      
      // Check if the log entry has the expected message
      if (exactMatch) {
        return logEntry.message === message;
      } else {
        return logEntry.message.includes(message);
      }
    } catch (error) {
      return false;
    }
  });
  
  if (matchingCalls.length === 0) {
    throw new Error(
      `Expected console.log to be called with level '${level}' and message '${message}', ` +
      `but no matching calls were found. All calls: ${JSON.stringify(calls)}`
    );
  }
}

/**
 * Creates a mock log entry for testing.
 * @param overrides Properties to override in the default log entry
 * @returns A mock log entry
 */
export function createMockLogEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  const defaultLogEntry: LogEntry = {
    message: 'Test log message',
    level: LogLevel.INFO,
    timestamp: new Date(),
    serviceName: 'test-service',
    context: 'TestContext',
    requestId: '12345-abcde-67890',
    userId: 'user-123',
    journey: {
      type: JourneyType.HEALTH,
      resourceId: 'health-record-123',
      action: 'view'
    }
  };
  
  return { ...defaultLogEntry, ...overrides };
}

/**
 * Creates a mock error info object for testing.
 * @param overrides Properties to override in the default error info
 * @returns A mock error info object
 */
export function createMockErrorInfo(overrides: Partial<ErrorInfo> = {}): ErrorInfo {
  const defaultErrorInfo: ErrorInfo = {
    message: 'Test error message',
    name: 'TestError',
    code: 'TEST_ERROR_CODE',
    stack: 'Error: Test error message\n    at TestFunction (test.ts:123:45)',
    isTransient: false,
    isClientError: true,
    isExternalError: false
  };
  
  return { ...defaultErrorInfo, ...overrides };
}

/**
 * Creates a mock journey context for testing.
 * @param journeyType The journey type
 * @param overrides Properties to override in the default journey context
 * @returns A mock journey context
 */
export function createMockJourneyContext(
  journeyType: JourneyType = JourneyType.HEALTH,
  overrides: Partial<JourneyContext> = {}
): JourneyContext {
  let defaultResourceId: string;
  let defaultAction: string;
  
  // Set default values based on journey type
  switch (journeyType) {
    case JourneyType.HEALTH:
      defaultResourceId = 'health-record-123';
      defaultAction = 'view-metrics';
      break;
    case JourneyType.CARE:
      defaultResourceId = 'appointment-123';
      defaultAction = 'schedule';
      break;
    case JourneyType.PLAN:
      defaultResourceId = 'claim-123';
      defaultAction = 'submit';
      break;
    default:
      defaultResourceId = 'resource-123';
      defaultAction = 'view';
  }
  
  const defaultJourneyContext: JourneyContext = {
    type: journeyType,
    resourceId: defaultResourceId,
    action: defaultAction,
    data: {}
  };
  
  return { ...defaultJourneyContext, ...overrides };
}