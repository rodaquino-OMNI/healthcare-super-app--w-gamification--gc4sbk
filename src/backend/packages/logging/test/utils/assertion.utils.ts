/**
 * @file assertion.utils.ts
 * @description Provides custom assertion utilities for verifying log content, format, and structure in tests.
 * These utilities help ensure that logs adhere to the standardized format and contain all required information.
 */

import { LogLevel, JourneyType } from '../../src/interfaces/formatter.interface';

/**
 * Interface representing a parsed log entry for testing purposes.
 * This is used to validate the structure and content of log entries.
 */
export interface ParsedLogEntry {
  timestamp: string | Date;
  level: string;
  message: string;
  context?: string;
  error?: any;
  metadata?: Record<string, any>;
  traceId?: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  journey?: string;
  service?: string;
  environment?: string;
  [key: string]: any; // Allow additional fields for extensibility
}

/**
 * Options for log assertion functions.
 */
export interface LogAssertionOptions {
  /**
   * Whether to perform strict validation of all required fields.
   * @default true
   */
  strict?: boolean;
  
  /**
   * Custom error message to display when assertion fails.
   */
  message?: string;
}

/**
 * Asserts that a string is valid JSON and can be parsed.
 * 
 * @param logString The log string to validate
 * @param options Assertion options
 * @throws Error if the string is not valid JSON
 * @returns The parsed JSON object
 */
export function assertValidJson(logString: string, options: LogAssertionOptions = {}): any {
  try {
    return JSON.parse(logString);
  } catch (error) {
    const message = options.message || `Log is not valid JSON: ${logString}`;
    throw new Error(message);
  }
}

/**
 * Asserts that a log entry contains all required fields.
 * 
 * @param logEntry The log entry to validate
 * @param options Assertion options
 * @throws Error if any required field is missing
 */
export function assertRequiredFields(logEntry: any, options: LogAssertionOptions = {}): void {
  const strict = options.strict !== false;
  const requiredFields = ['timestamp', 'level', 'message'];
  
  for (const field of requiredFields) {
    if (logEntry[field] === undefined) {
      const message = options.message || `Log entry is missing required field: ${field}`;
      throw new Error(message);
    }
  }
  
  // In strict mode, validate timestamp format
  if (strict && logEntry.timestamp) {
    const timestamp = new Date(logEntry.timestamp);
    if (isNaN(timestamp.getTime())) {
      const message = options.message || `Log entry has invalid timestamp format: ${logEntry.timestamp}`;
      throw new Error(message);
    }
  }
}

/**
 * Asserts that a log entry has the expected log level.
 * 
 * @param logEntry The log entry to validate
 * @param expectedLevel The expected log level
 * @param options Assertion options
 * @throws Error if the log level doesn't match the expected level
 */
export function assertLogLevel(logEntry: any, expectedLevel: LogLevel | string, options: LogAssertionOptions = {}): void {
  const logLevel = typeof logEntry.level === 'string' ? logEntry.level.toUpperCase() : logEntry.level;
  const expected = typeof expectedLevel === 'string' ? expectedLevel.toUpperCase() : expectedLevel;
  
  if (logLevel !== expected) {
    const message = options.message || `Expected log level ${expected}, but got ${logLevel}`;
    throw new Error(message);
  }
}

/**
 * Asserts that a log entry contains the expected message.
 * 
 * @param logEntry The log entry to validate
 * @param expectedMessage The expected message or a regular expression to match against the message
 * @param options Assertion options
 * @throws Error if the message doesn't match the expected message
 */
export function assertLogMessage(logEntry: any, expectedMessage: string | RegExp, options: LogAssertionOptions = {}): void {
  if (typeof expectedMessage === 'string') {
    if (logEntry.message !== expectedMessage) {
      const message = options.message || `Expected log message "${expectedMessage}", but got "${logEntry.message}"`;
      throw new Error(message);
    }
  } else if (expectedMessage instanceof RegExp) {
    if (!expectedMessage.test(logEntry.message)) {
      const message = options.message || `Expected log message to match ${expectedMessage}, but got "${logEntry.message}"`;
      throw new Error(message);
    }
  }
}

/**
 * Asserts that a log entry contains the expected context information.
 * 
 * @param logEntry The log entry to validate
 * @param expectedContext The expected context string or a regular expression to match against the context
 * @param options Assertion options
 * @throws Error if the context doesn't match the expected context
 */
export function assertLogContext(logEntry: any, expectedContext: string | RegExp, options: LogAssertionOptions = {}): void {
  if (!logEntry.context) {
    const message = options.message || 'Log entry is missing context field';
    throw new Error(message);
  }
  
  if (typeof expectedContext === 'string') {
    if (logEntry.context !== expectedContext) {
      const message = options.message || `Expected log context "${expectedContext}", but got "${logEntry.context}"`;
      throw new Error(message);
    }
  } else if (expectedContext instanceof RegExp) {
    if (!expectedContext.test(logEntry.context)) {
      const message = options.message || `Expected log context to match ${expectedContext}, but got "${logEntry.context}"`;
      throw new Error(message);
    }
  }
}

/**
 * Asserts that a log entry contains the expected metadata.
 * 
 * @param logEntry The log entry to validate
 * @param expectedMetadata The expected metadata object or a function that validates the metadata
 * @param options Assertion options
 * @throws Error if the metadata doesn't match the expected metadata
 */
export function assertLogMetadata(logEntry: any, expectedMetadata: Record<string, any> | ((metadata: any) => boolean), options: LogAssertionOptions = {}): void {
  if (!logEntry.metadata) {
    const message = options.message || 'Log entry is missing metadata field';
    throw new Error(message);
  }
  
  if (typeof expectedMetadata === 'function') {
    if (!expectedMetadata(logEntry.metadata)) {
      const message = options.message || 'Log metadata failed validation function';
      throw new Error(message);
    }
  } else {
    for (const [key, value] of Object.entries(expectedMetadata)) {
      if (logEntry.metadata[key] === undefined) {
        const message = options.message || `Log metadata is missing expected key: ${key}`;
        throw new Error(message);
      }
      
      if (typeof value === 'object' && value !== null) {
        // Deep comparison for objects
        if (JSON.stringify(logEntry.metadata[key]) !== JSON.stringify(value)) {
          const message = options.message || `Expected metadata[${key}] to equal ${JSON.stringify(value)}, but got ${JSON.stringify(logEntry.metadata[key])}`;
          throw new Error(message);
        }
      } else if (logEntry.metadata[key] !== value) {
        const message = options.message || `Expected metadata[${key}] to equal ${value}, but got ${logEntry.metadata[key]}`;
        throw new Error(message);
      }
    }
  }
}

/**
 * Asserts that a log entry contains the expected error information.
 * 
 * @param logEntry The log entry to validate
 * @param expectedError The expected error object, message string, or a function that validates the error
 * @param options Assertion options
 * @throws Error if the error doesn't match the expected error
 */
export function assertLogError(logEntry: any, expectedError: Error | string | RegExp | ((error: any) => boolean), options: LogAssertionOptions = {}): void {
  if (!logEntry.error) {
    const message = options.message || 'Log entry is missing error field';
    throw new Error(message);
  }
  
  if (typeof expectedError === 'function') {
    if (!expectedError(logEntry.error)) {
      const message = options.message || 'Log error failed validation function';
      throw new Error(message);
    }
  } else if (expectedError instanceof Error) {
    // Check error message
    const errorMessage = typeof logEntry.error === 'string' ? logEntry.error : logEntry.error.message;
    if (errorMessage !== expectedError.message) {
      const message = options.message || `Expected error message "${expectedError.message}", but got "${errorMessage}"`;
      throw new Error(message);
    }
    
    // Check error name if available
    if (typeof logEntry.error === 'object' && logEntry.error.name && expectedError.name !== logEntry.error.name) {
      const message = options.message || `Expected error name "${expectedError.name}", but got "${logEntry.error.name}"`;
      throw new Error(message);
    }
  } else if (typeof expectedError === 'string') {
    const errorMessage = typeof logEntry.error === 'string' ? logEntry.error : logEntry.error.message;
    if (errorMessage !== expectedError) {
      const message = options.message || `Expected error message "${expectedError}", but got "${errorMessage}"`;
      throw new Error(message);
    }
  } else if (expectedError instanceof RegExp) {
    const errorMessage = typeof logEntry.error === 'string' ? logEntry.error : logEntry.error.message;
    if (!expectedError.test(errorMessage)) {
      const message = options.message || `Expected error message to match ${expectedError}, but got "${errorMessage}"`;
      throw new Error(message);
    }
  }
}

/**
 * Asserts that a log entry contains the expected trace ID.
 * 
 * @param logEntry The log entry to validate
 * @param expectedTraceId The expected trace ID or a regular expression to match against the trace ID
 * @param options Assertion options
 * @throws Error if the trace ID doesn't match the expected trace ID
 */
export function assertTraceId(logEntry: any, expectedTraceId: string | RegExp, options: LogAssertionOptions = {}): void {
  if (!logEntry.traceId) {
    const message = options.message || 'Log entry is missing traceId field';
    throw new Error(message);
  }
  
  if (typeof expectedTraceId === 'string') {
    if (logEntry.traceId !== expectedTraceId) {
      const message = options.message || `Expected traceId "${expectedTraceId}", but got "${logEntry.traceId}"`;
      throw new Error(message);
    }
  } else if (expectedTraceId instanceof RegExp) {
    if (!expectedTraceId.test(logEntry.traceId)) {
      const message = options.message || `Expected traceId to match ${expectedTraceId}, but got "${logEntry.traceId}"`;
      throw new Error(message);
    }
  }
}

/**
 * Asserts that a log entry contains the expected user ID.
 * 
 * @param logEntry The log entry to validate
 * @param expectedUserId The expected user ID or a regular expression to match against the user ID
 * @param options Assertion options
 * @throws Error if the user ID doesn't match the expected user ID
 */
export function assertUserId(logEntry: any, expectedUserId: string | RegExp, options: LogAssertionOptions = {}): void {
  if (!logEntry.userId) {
    const message = options.message || 'Log entry is missing userId field';
    throw new Error(message);
  }
  
  if (typeof expectedUserId === 'string') {
    if (logEntry.userId !== expectedUserId) {
      const message = options.message || `Expected userId "${expectedUserId}", but got "${logEntry.userId}"`;
      throw new Error(message);
    }
  } else if (expectedUserId instanceof RegExp) {
    if (!expectedUserId.test(logEntry.userId)) {
      const message = options.message || `Expected userId to match ${expectedUserId}, but got "${logEntry.userId}"`;
      throw new Error(message);
    }
  }
}

/**
 * Asserts that a log entry contains the expected request ID.
 * 
 * @param logEntry The log entry to validate
 * @param expectedRequestId The expected request ID or a regular expression to match against the request ID
 * @param options Assertion options
 * @throws Error if the request ID doesn't match the expected request ID
 */
export function assertRequestId(logEntry: any, expectedRequestId: string | RegExp, options: LogAssertionOptions = {}): void {
  if (!logEntry.requestId) {
    const message = options.message || 'Log entry is missing requestId field';
    throw new Error(message);
  }
  
  if (typeof expectedRequestId === 'string') {
    if (logEntry.requestId !== expectedRequestId) {
      const message = options.message || `Expected requestId "${expectedRequestId}", but got "${logEntry.requestId}"`;
      throw new Error(message);
    }
  } else if (expectedRequestId instanceof RegExp) {
    if (!expectedRequestId.test(logEntry.requestId)) {
      const message = options.message || `Expected requestId to match ${expectedRequestId}, but got "${logEntry.requestId}"`;
      throw new Error(message);
    }
  }
}

/**
 * Asserts that a log entry contains the expected journey information.
 * 
 * @param logEntry The log entry to validate
 * @param expectedJourney The expected journey type
 * @param options Assertion options
 * @throws Error if the journey doesn't match the expected journey
 */
export function assertJourney(logEntry: any, expectedJourney: JourneyType | string, options: LogAssertionOptions = {}): void {
  if (!logEntry.journey) {
    const message = options.message || 'Log entry is missing journey field';
    throw new Error(message);
  }
  
  const journeyValue = typeof logEntry.journey === 'string' ? logEntry.journey.toLowerCase() : logEntry.journey;
  const expectedValue = typeof expectedJourney === 'string' ? expectedJourney.toLowerCase() : expectedJourney;
  
  if (journeyValue !== expectedValue) {
    const message = options.message || `Expected journey "${expectedValue}", but got "${journeyValue}"`;
    throw new Error(message);
  }
}

/**
 * Asserts that a log entry contains the expected service information.
 * 
 * @param logEntry The log entry to validate
 * @param expectedService The expected service name or a regular expression to match against the service name
 * @param options Assertion options
 * @throws Error if the service doesn't match the expected service
 */
export function assertService(logEntry: any, expectedService: string | RegExp, options: LogAssertionOptions = {}): void {
  if (!logEntry.service) {
    const message = options.message || 'Log entry is missing service field';
    throw new Error(message);
  }
  
  if (typeof expectedService === 'string') {
    if (logEntry.service !== expectedService) {
      const message = options.message || `Expected service "${expectedService}", but got "${logEntry.service}"`;
      throw new Error(message);
    }
  } else if (expectedService instanceof RegExp) {
    if (!expectedService.test(logEntry.service)) {
      const message = options.message || `Expected service to match ${expectedService}, but got "${logEntry.service}"`;
      throw new Error(message);
    }
  }
}

/**
 * Asserts that a log entry contains the expected environment information.
 * 
 * @param logEntry The log entry to validate
 * @param expectedEnvironment The expected environment name or a regular expression to match against the environment name
 * @param options Assertion options
 * @throws Error if the environment doesn't match the expected environment
 */
export function assertEnvironment(logEntry: any, expectedEnvironment: string | RegExp, options: LogAssertionOptions = {}): void {
  if (!logEntry.environment) {
    const message = options.message || 'Log entry is missing environment field';
    throw new Error(message);
  }
  
  if (typeof expectedEnvironment === 'string') {
    if (logEntry.environment !== expectedEnvironment) {
      const message = options.message || `Expected environment "${expectedEnvironment}", but got "${logEntry.environment}"`;
      throw new Error(message);
    }
  } else if (expectedEnvironment instanceof RegExp) {
    if (!expectedEnvironment.test(logEntry.environment)) {
      const message = options.message || `Expected environment to match ${expectedEnvironment}, but got "${logEntry.environment}"`;
      throw new Error(message);
    }
  }
}

/**
 * Validates a complete log entry against an expected structure.
 * This is a comprehensive validation that checks all specified fields.
 * 
 * @param logEntry The log entry to validate
 * @param expected The expected log entry structure
 * @param options Assertion options
 * @throws Error if any field doesn't match the expected value
 */
export function assertLogEntry(logEntry: any, expected: Partial<ParsedLogEntry>, options: LogAssertionOptions = {}): void {
  // Always validate required fields
  assertRequiredFields(logEntry, options);
  
  // Validate specific fields if provided in the expected object
  if (expected.level) {
    assertLogLevel(logEntry, expected.level, options);
  }
  
  if (expected.message) {
    assertLogMessage(logEntry, expected.message, options);
  }
  
  if (expected.context) {
    assertLogContext(logEntry, expected.context, options);
  }
  
  if (expected.metadata) {
    assertLogMetadata(logEntry, expected.metadata, options);
  }
  
  if (expected.error) {
    assertLogError(logEntry, expected.error, options);
  }
  
  if (expected.traceId) {
    assertTraceId(logEntry, expected.traceId, options);
  }
  
  if (expected.userId) {
    assertUserId(logEntry, expected.userId, options);
  }
  
  if (expected.requestId) {
    assertRequestId(logEntry, expected.requestId, options);
  }
  
  if (expected.journey) {
    assertJourney(logEntry, expected.journey, options);
  }
  
  if (expected.service) {
    assertService(logEntry, expected.service, options);
  }
  
  if (expected.environment) {
    assertEnvironment(logEntry, expected.environment, options);
  }
  
  // Check any additional fields specified in the expected object
  const standardFields = [
    'timestamp', 'level', 'message', 'context', 'error', 'metadata',
    'traceId', 'spanId', 'userId', 'requestId', 'journey', 'service', 'environment'
  ];
  
  for (const [key, value] of Object.entries(expected)) {
    if (!standardFields.includes(key) && value !== undefined) {
      if (logEntry[key] === undefined) {
        const message = options.message || `Log entry is missing expected field: ${key}`;
        throw new Error(message);
      }
      
      if (typeof value === 'object' && value !== null) {
        // Deep comparison for objects
        if (JSON.stringify(logEntry[key]) !== JSON.stringify(value)) {
          const message = options.message || `Expected ${key} to equal ${JSON.stringify(value)}, but got ${JSON.stringify(logEntry[key])}`;
          throw new Error(message);
        }
      } else if (logEntry[key] !== value) {
        const message = options.message || `Expected ${key} to equal ${value}, but got ${logEntry[key]}`;
        throw new Error(message);
      }
    }
  }
}

/**
 * Parses a log string and validates it against an expected structure.
 * This is a convenience function that combines parsing and validation.
 * 
 * @param logString The log string to parse and validate
 * @param expected The expected log entry structure
 * @param options Assertion options
 * @throws Error if the log string is not valid JSON or if any field doesn't match the expected value
 * @returns The parsed log entry
 */
export function assertLogString(logString: string, expected: Partial<ParsedLogEntry>, options: LogAssertionOptions = {}): any {
  const logEntry = assertValidJson(logString, options);
  assertLogEntry(logEntry, expected, options);
  return logEntry;
}

/**
 * Validates that a log entry follows the CloudWatch format requirements.
 * 
 * @param logEntry The log entry to validate
 * @param options Assertion options
 * @throws Error if the log entry doesn't follow the CloudWatch format
 */
export function assertCloudWatchFormat(logEntry: any, options: LogAssertionOptions = {}): void {
  // CloudWatch requires a timestamp field in a specific format
  if (!logEntry.timestamp) {
    const message = options.message || 'CloudWatch log entry is missing timestamp field';
    throw new Error(message);
  }
  
  // Validate timestamp format (ISO string)
  try {
    const timestamp = new Date(logEntry.timestamp);
    if (isNaN(timestamp.getTime())) {
      const message = options.message || `CloudWatch log entry has invalid timestamp format: ${logEntry.timestamp}`;
      throw new Error(message);
    }
  } catch (error) {
    const message = options.message || `CloudWatch log entry has invalid timestamp format: ${logEntry.timestamp}`;
    throw new Error(message);
  }
  
  // CloudWatch expects certain fields for proper indexing
  const recommendedFields = ['level', 'message', 'service', 'environment'];
  for (const field of recommendedFields) {
    if (logEntry[field] === undefined) {
      const message = options.message || `CloudWatch log entry is missing recommended field: ${field}`;
      throw new Error(message);
    }
  }
}

/**
 * Validates that a batch of log entries all follow the expected format and structure.
 * 
 * @param logEntries Array of log entries to validate
 * @param validator Validation function to apply to each log entry
 * @param options Assertion options
 * @throws Error if any log entry fails validation
 */
export function assertLogBatch(logEntries: any[], validator: (entry: any, options: LogAssertionOptions) => void, options: LogAssertionOptions = {}): void {
  if (!Array.isArray(logEntries)) {
    const message = options.message || 'Expected an array of log entries';
    throw new Error(message);
  }
  
  for (let i = 0; i < logEntries.length; i++) {
    try {
      validator(logEntries[i], options);
    } catch (error) {
      const message = options.message || `Log entry at index ${i} failed validation: ${error.message}`;
      throw new Error(message);
    }
  }
}

/**
 * Validates that a log entry contains all required journey-specific fields.
 * 
 * @param logEntry The log entry to validate
 * @param journey The journey type to validate against
 * @param options Assertion options
 * @throws Error if the log entry is missing any required journey-specific fields
 */
export function assertJourneySpecificFields(logEntry: any, journey: JourneyType | string, options: LogAssertionOptions = {}): void {
  // First, assert that the journey field is correct
  assertJourney(logEntry, journey, options);
  
  // Define required fields for each journey type
  const journeyFields: Record<string, string[]> = {
    [JourneyType.HEALTH]: ['userId', 'requestId', 'metadata'],
    [JourneyType.CARE]: ['userId', 'requestId', 'metadata'],
    [JourneyType.PLAN]: ['userId', 'requestId', 'metadata']
  };
  
  // Get the journey value in the correct format
  const journeyValue = typeof journey === 'string' ? journey.toLowerCase() : journey;
  
  // Check that all required fields for this journey are present
  const requiredFields = journeyFields[journeyValue] || [];
  for (const field of requiredFields) {
    if (logEntry[field] === undefined) {
      const message = options.message || `Log entry for journey "${journeyValue}" is missing required field: ${field}`;
      throw new Error(message);
    }
  }
  
  // Journey-specific metadata validation
  if (journeyValue === JourneyType.HEALTH && logEntry.metadata) {
    // Health journey should have health-specific metadata
    if (!logEntry.metadata.healthMetric && !logEntry.metadata.healthGoal && !logEntry.metadata.healthDevice) {
      const message = options.message || 'Health journey log entry is missing health-specific metadata';
      throw new Error(message);
    }
  } else if (journeyValue === JourneyType.CARE && logEntry.metadata) {
    // Care journey should have care-specific metadata
    if (!logEntry.metadata.careProvider && !logEntry.metadata.careAppointment && !logEntry.metadata.careMedication) {
      const message = options.message || 'Care journey log entry is missing care-specific metadata';
      throw new Error(message);
    }
  } else if (journeyValue === JourneyType.PLAN && logEntry.metadata) {
    // Plan journey should have plan-specific metadata
    if (!logEntry.metadata.planCoverage && !logEntry.metadata.planClaim && !logEntry.metadata.planBenefit) {
      const message = options.message || 'Plan journey log entry is missing plan-specific metadata';
      throw new Error(message);
    }
  }
}

/**
 * Validates that a log entry contains the expected schema structure using Zod.
 * This function requires Zod to be installed as a dependency.
 * 
 * @param logEntry The log entry to validate
 * @param schema The Zod schema to validate against
 * @param options Assertion options
 * @throws Error if the log entry doesn't match the schema
 */
export function assertLogSchema<T>(logEntry: any, schema: any, options: LogAssertionOptions = {}): T {
  try {
    // Attempt to parse and validate the log entry against the schema
    return schema.parse(logEntry);
  } catch (error) {
    // Format the validation error message
    let errorMessage = 'Log entry failed schema validation';
    if (error.errors && Array.isArray(error.errors)) {
      errorMessage += ': ' + error.errors.map((err: any) => {
        return `${err.path.join('.')} - ${err.message}`;
      }).join('; ');
    }
    
    const message = options.message || errorMessage;
    throw new Error(message);
  }
}