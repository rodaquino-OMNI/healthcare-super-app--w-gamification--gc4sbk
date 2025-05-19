import { LogEntry, LogLevel, JourneyType, JourneyContext, ErrorObject } from '../../src/interfaces/log-entry.interface';
import { LogLevelUtils } from '../../src/interfaces/log-level.enum';

/**
 * Utility functions for asserting log content, format, and structure in tests.
 * These utilities help verify that logs contain expected fields, follow the correct format,
 * include proper context information, and maintain correct log levels.
 */
export class LogAssertions {
  /**
   * Asserts that a log entry contains all required base fields.
   * @param log The log entry to check
   * @param message Optional expected message to verify
   * @throws Error if any required field is missing or invalid
   */
  static assertBaseFields(log: LogEntry, message?: string): void {
    if (!log) {
      throw new Error('Log entry is null or undefined');
    }

    // Check required fields
    if (!log.message) {
      throw new Error('Log entry is missing required message field');
    }

    if (log.level === undefined || log.level === null) {
      throw new Error('Log entry is missing required level field');
    }

    if (!log.timestamp) {
      throw new Error('Log entry is missing required timestamp field');
    }

    if (!log.service) {
      throw new Error('Log entry is missing required service field');
    }

    // Validate timestamp is a valid Date
    if (!(log.timestamp instanceof Date) && !(typeof log.timestamp === 'string')) {
      throw new Error('Log timestamp must be a Date object or ISO string');
    }

    // Check message content if provided
    if (message !== undefined && log.message !== message) {
      throw new Error(`Log message does not match expected. Got: "${log.message}", Expected: "${message}"`);
    }
  }

  /**
   * Asserts that a log entry has the expected log level.
   * @param log The log entry to check
   * @param expectedLevel The expected log level
   * @throws Error if the log level doesn't match the expected level
   */
  static assertLogLevel(log: LogEntry, expectedLevel: LogLevel): void {
    if (!log) {
      throw new Error('Log entry is null or undefined');
    }

    if (log.level !== expectedLevel) {
      throw new Error(
        `Log level does not match expected. Got: ${LogLevelUtils.toString(log.level)}, Expected: ${LogLevelUtils.toString(expectedLevel)}`
      );
    }
  }

  /**
   * Asserts that a log entry contains the expected context information.
   * @param log The log entry to check
   * @param context The expected context object or key-value pairs
   * @throws Error if any context field doesn't match the expected value
   */
  static assertContext(log: LogEntry, context: Record<string, any>): void {
    if (!log) {
      throw new Error('Log entry is null or undefined');
    }

    if (!log.context) {
      throw new Error('Log entry is missing context object');
    }

    for (const [key, value] of Object.entries(context)) {
      if (log.context[key] === undefined) {
        throw new Error(`Log context is missing expected key: ${key}`);
      }

      if (typeof value === 'object' && value !== null) {
        // For objects, check deep equality
        try {
          // Use JSON.stringify for deep comparison
          if (JSON.stringify(log.context[key]) !== JSON.stringify(value)) {
            throw new Error(`Log context value for key ${key} does not match expected object`);
          }
        } catch (error) {
          throw new Error(`Error comparing context objects for key ${key}: ${error.message}`);
        }
      } else if (log.context[key] !== value) {
        throw new Error(
          `Log context value for key ${key} does not match expected. Got: ${log.context[key]}, Expected: ${value}`
        );
      }
    }
  }

  /**
   * Asserts that a log entry contains the expected request ID.
   * @param log The log entry to check
   * @param requestId The expected request ID
   * @throws Error if the request ID doesn't match the expected value
   */
  static assertRequestId(log: LogEntry, requestId: string): void {
    if (!log) {
      throw new Error('Log entry is null or undefined');
    }

    if (!log.requestId) {
      throw new Error('Log entry is missing requestId field');
    }

    if (log.requestId !== requestId) {
      throw new Error(`Log requestId does not match expected. Got: ${log.requestId}, Expected: ${requestId}`);
    }
  }

  /**
   * Asserts that a log entry contains the expected user ID.
   * @param log The log entry to check
   * @param userId The expected user ID
   * @throws Error if the user ID doesn't match the expected value
   */
  static assertUserId(log: LogEntry, userId: string): void {
    if (!log) {
      throw new Error('Log entry is null or undefined');
    }

    if (!log.userId) {
      throw new Error('Log entry is missing userId field');
    }

    if (log.userId !== userId) {
      throw new Error(`Log userId does not match expected. Got: ${log.userId}, Expected: ${userId}`);
    }
  }

  /**
   * Asserts that a log entry contains the expected trace correlation IDs.
   * @param log The log entry to check
   * @param traceId The expected trace ID
   * @param spanId Optional expected span ID
   * @param parentSpanId Optional expected parent span ID
   * @throws Error if any trace ID doesn't match the expected value
   */
  static assertTraceIds(log: LogEntry, traceId: string, spanId?: string, parentSpanId?: string): void {
    if (!log) {
      throw new Error('Log entry is null or undefined');
    }

    if (!log.traceId) {
      throw new Error('Log entry is missing traceId field');
    }

    if (log.traceId !== traceId) {
      throw new Error(`Log traceId does not match expected. Got: ${log.traceId}, Expected: ${traceId}`);
    }

    if (spanId !== undefined) {
      if (!log.spanId) {
        throw new Error('Log entry is missing spanId field');
      }

      if (log.spanId !== spanId) {
        throw new Error(`Log spanId does not match expected. Got: ${log.spanId}, Expected: ${spanId}`);
      }
    }

    if (parentSpanId !== undefined) {
      if (!log.parentSpanId) {
        throw new Error('Log entry is missing parentSpanId field');
      }

      if (log.parentSpanId !== parentSpanId) {
        throw new Error(
          `Log parentSpanId does not match expected. Got: ${log.parentSpanId}, Expected: ${parentSpanId}`
        );
      }
    }
  }

  /**
   * Asserts that a log entry is associated with the expected journey.
   * @param log The log entry to check
   * @param journeyType The expected journey type
   * @throws Error if the journey doesn't match the expected value
   */
  static assertJourney(log: LogEntry, journeyType: JourneyType): void {
    if (!log) {
      throw new Error('Log entry is null or undefined');
    }

    if (!log.journey) {
      throw new Error('Log entry is missing journey field');
    }

    if (log.journey !== journeyType) {
      throw new Error(`Log journey does not match expected. Got: ${log.journey}, Expected: ${journeyType}`);
    }
  }

  /**
   * Asserts that a log entry contains the expected journey context information.
   * @param log The log entry to check
   * @param journeyContext The expected journey context object or key-value pairs
   * @throws Error if any journey context field doesn't match the expected value
   */
  static assertJourneyContext(log: LogEntry, journeyContext: Partial<JourneyContext>): void {
    if (!log) {
      throw new Error('Log entry is null or undefined');
    }

    if (!log.journeyContext) {
      throw new Error('Log entry is missing journeyContext object');
    }

    // Check journeyId if provided
    if (journeyContext.journeyId !== undefined) {
      if (log.journeyContext.journeyId !== journeyContext.journeyId) {
        throw new Error(
          `Log journeyContext.journeyId does not match expected. Got: ${log.journeyContext.journeyId}, Expected: ${journeyContext.journeyId}`
        );
      }
    }

    // Check step if provided
    if (journeyContext.step !== undefined) {
      if (log.journeyContext.step !== journeyContext.step) {
        throw new Error(
          `Log journeyContext.step does not match expected. Got: ${log.journeyContext.step}, Expected: ${journeyContext.step}`
        );
      }
    }

    // Check health journey context if provided
    if (journeyContext.health) {
      if (!log.journeyContext.health) {
        throw new Error('Log entry is missing health journey context');
      }

      this.assertObjectProperties(log.journeyContext.health, journeyContext.health, 'health journey context');
    }

    // Check care journey context if provided
    if (journeyContext.care) {
      if (!log.journeyContext.care) {
        throw new Error('Log entry is missing care journey context');
      }

      this.assertObjectProperties(log.journeyContext.care, journeyContext.care, 'care journey context');
    }

    // Check plan journey context if provided
    if (journeyContext.plan) {
      if (!log.journeyContext.plan) {
        throw new Error('Log entry is missing plan journey context');
      }

      this.assertObjectProperties(log.journeyContext.plan, journeyContext.plan, 'plan journey context');
    }
  }

  /**
   * Asserts that a log entry contains the expected error information.
   * @param log The log entry to check
   * @param error The expected error object or properties
   * @throws Error if any error field doesn't match the expected value
   */
  static assertError(log: LogEntry, error: Partial<ErrorObject>): void {
    if (!log) {
      throw new Error('Log entry is null or undefined');
    }

    if (!log.error) {
      throw new Error('Log entry is missing error object');
    }

    // Check required error fields
    if (!log.error.message) {
      throw new Error('Log error is missing required message field');
    }

    if (!log.error.name) {
      throw new Error('Log error is missing required name field');
    }

    // Check error message if provided
    if (error.message !== undefined) {
      if (log.error.message !== error.message) {
        throw new Error(
          `Log error.message does not match expected. Got: ${log.error.message}, Expected: ${error.message}`
        );
      }
    }

    // Check error name if provided
    if (error.name !== undefined) {
      if (log.error.name !== error.name) {
        throw new Error(`Log error.name does not match expected. Got: ${log.error.name}, Expected: ${error.name}`);
      }
    }

    // Check other error properties
    if (error.code !== undefined) {
      if (log.error.code !== error.code) {
        throw new Error(`Log error.code does not match expected. Got: ${log.error.code}, Expected: ${error.code}`);
      }
    }

    if (error.statusCode !== undefined) {
      if (log.error.statusCode !== error.statusCode) {
        throw new Error(
          `Log error.statusCode does not match expected. Got: ${log.error.statusCode}, Expected: ${error.statusCode}`
        );
      }
    }

    if (error.isOperational !== undefined) {
      if (log.error.isOperational !== error.isOperational) {
        throw new Error(
          `Log error.isOperational does not match expected. Got: ${log.error.isOperational}, Expected: ${error.isOperational}`
        );
      }
    }

    // Check error details if provided
    if (error.details) {
      if (!log.error.details) {
        throw new Error('Log error is missing details object');
      }

      this.assertObjectProperties(log.error.details, error.details, 'error details');
    }
  }

  /**
   * Asserts that a log entry can be properly serialized to JSON.
   * @param log The log entry to check
   * @throws Error if the log entry cannot be serialized to JSON
   * @returns The serialized JSON string
   */
  static assertJsonSerializable(log: LogEntry): string {
    if (!log) {
      throw new Error('Log entry is null or undefined');
    }

    try {
      const jsonString = JSON.stringify(log);
      if (!jsonString) {
        throw new Error('JSON serialization resulted in empty string');
      }
      return jsonString;
    } catch (error) {
      throw new Error(`Log entry is not JSON serializable: ${error.message}`);
    }
  }

  /**
   * Asserts that a serialized log entry contains all required fields in JSON format.
   * @param jsonString The serialized JSON string to check
   * @throws Error if the JSON string is missing required fields or has invalid format
   * @returns The parsed log entry object
   */
  static assertValidLogJson(jsonString: string): LogEntry {
    if (!jsonString) {
      throw new Error('JSON string is null, undefined, or empty');
    }

    let parsedLog: LogEntry;
    try {
      parsedLog = JSON.parse(jsonString) as LogEntry;
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Check required fields
    if (!parsedLog.message) {
      throw new Error('JSON log is missing required message field');
    }

    if (parsedLog.level === undefined || parsedLog.level === null) {
      throw new Error('JSON log is missing required level field');
    }

    if (!parsedLog.timestamp) {
      throw new Error('JSON log is missing required timestamp field');
    }

    if (!parsedLog.service) {
      throw new Error('JSON log is missing required service field');
    }

    return parsedLog;
  }

  /**
   * Asserts that a log entry matches a schema defined by a validation function.
   * @param log The log entry to check
   * @param validator A function that validates the log entry against a schema
   * @param schemaName Optional name of the schema for error messages
   * @throws Error if the log entry doesn't match the schema
   */
  static assertSchema(log: LogEntry, validator: (log: LogEntry) => boolean, schemaName = 'schema'): void {
    if (!log) {
      throw new Error('Log entry is null or undefined');
    }

    try {
      const isValid = validator(log);
      if (!isValid) {
        throw new Error(`Log entry does not match ${schemaName}`);
      }
    } catch (error) {
      throw new Error(`Error validating log entry against ${schemaName}: ${error.message}`);
    }
  }

  /**
   * Helper method to assert that an object contains all expected properties with matching values.
   * @param actual The actual object to check
   * @param expected The expected properties and values
   * @param objectName The name of the object for error messages
   * @throws Error if any property doesn't match the expected value
   */
  private static assertObjectProperties(
    actual: Record<string, any>,
    expected: Record<string, any>,
    objectName: string
  ): void {
    for (const [key, value] of Object.entries(expected)) {
      if (actual[key] === undefined) {
        throw new Error(`${objectName} is missing expected key: ${key}`);
      }

      if (typeof value === 'object' && value !== null) {
        // For objects, check deep equality
        try {
          // Use JSON.stringify for deep comparison
          if (JSON.stringify(actual[key]) !== JSON.stringify(value)) {
            throw new Error(`${objectName} value for key ${key} does not match expected object`);
          }
        } catch (error) {
          throw new Error(`Error comparing ${objectName} objects for key ${key}: ${error.message}`);
        }
      } else if (actual[key] !== value) {
        throw new Error(
          `${objectName} value for key ${key} does not match expected. Got: ${actual[key]}, Expected: ${value}`
        );
      }
    }
  }
}

/**
 * Utility functions for creating test log entries with default values.
 * These utilities help create consistent log entries for testing.
 */
export class LogFactory {
  /**
   * Creates a basic log entry with default values.
   * @param overrides Optional properties to override default values
   * @returns A log entry with default values
   */
  static createLogEntry(overrides: Partial<LogEntry> = {}): LogEntry {
    return {
      message: 'Test log message',
      level: LogLevel.INFO,
      timestamp: new Date(),
      service: 'test-service',
      ...overrides,
    };
  }

  /**
   * Creates a log entry with journey context.
   * @param journeyType The journey type
   * @param journeyContext Optional journey context properties
   * @param overrides Optional additional properties to override default values
   * @returns A log entry with journey context
   */
  static createJourneyLogEntry(
    journeyType: JourneyType,
    journeyContext: Partial<JourneyContext> = {},
    overrides: Partial<LogEntry> = {}
  ): LogEntry {
    return this.createLogEntry({
      journey: journeyType,
      journeyContext: {
        journeyId: 'test-journey-id',
        step: 'test-step',
        ...journeyContext,
      },
      ...overrides,
    });
  }

  /**
   * Creates a log entry with error information.
   * @param error The error object or properties
   * @param overrides Optional additional properties to override default values
   * @returns A log entry with error information
   */
  static createErrorLogEntry(error: Partial<ErrorObject>, overrides: Partial<LogEntry> = {}): LogEntry {
    return this.createLogEntry({
      level: LogLevel.ERROR,
      error: {
        message: 'Test error message',
        name: 'TestError',
        stack: 'Test stack trace',
        ...error,
      },
      ...overrides,
    });
  }

  /**
   * Creates a log entry with trace correlation IDs.
   * @param traceId The trace ID
   * @param spanId Optional span ID
   * @param parentSpanId Optional parent span ID
   * @param overrides Optional additional properties to override default values
   * @returns A log entry with trace correlation IDs
   */
  static createTraceLogEntry(
    traceId: string,
    spanId?: string,
    parentSpanId?: string,
    overrides: Partial<LogEntry> = {}
  ): LogEntry {
    return this.createLogEntry({
      traceId,
      spanId,
      parentSpanId,
      ...overrides,
    });
  }

  /**
   * Creates a health journey log entry with health-specific context.
   * @param healthContext The health journey context properties
   * @param overrides Optional additional properties to override default values
   * @returns A log entry with health journey context
   */
  static createHealthJourneyLogEntry(
    healthContext: Partial<JourneyContext['health']> = {},
    overrides: Partial<LogEntry> = {}
  ): LogEntry {
    return this.createJourneyLogEntry(
      JourneyType.HEALTH,
      {
        health: {
          metricType: 'heart-rate',
          deviceId: 'test-device-id',
          goalId: 'test-goal-id',
          ...healthContext,
        },
      },
      overrides
    );
  }

  /**
   * Creates a care journey log entry with care-specific context.
   * @param careContext The care journey context properties
   * @param overrides Optional additional properties to override default values
   * @returns A log entry with care journey context
   */
  static createCareJourneyLogEntry(
    careContext: Partial<JourneyContext['care']> = {},
    overrides: Partial<LogEntry> = {}
  ): LogEntry {
    return this.createJourneyLogEntry(
      JourneyType.CARE,
      {
        care: {
          appointmentId: 'test-appointment-id',
          providerId: 'test-provider-id',
          sessionId: 'test-session-id',
          medicationId: 'test-medication-id',
          ...careContext,
        },
      },
      overrides
    );
  }

  /**
   * Creates a plan journey log entry with plan-specific context.
   * @param planContext The plan journey context properties
   * @param overrides Optional additional properties to override default values
   * @returns A log entry with plan journey context
   */
  static createPlanJourneyLogEntry(
    planContext: Partial<JourneyContext['plan']> = {},
    overrides: Partial<LogEntry> = {}
  ): LogEntry {
    return this.createJourneyLogEntry(
      JourneyType.PLAN,
      {
        plan: {
          planId: 'test-plan-id',
          claimId: 'test-claim-id',
          benefitId: 'test-benefit-id',
          ...planContext,
        },
      },
      overrides
    );
  }
}