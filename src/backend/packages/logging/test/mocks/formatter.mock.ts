import { Formatter, LogEntry, LogLevel } from '../../src/formatters/formatter.interface';

/**
 * Base mock formatter that implements the Formatter interface for testing.
 * Provides configurable behavior and tracking of format calls.
 */
export class MockFormatter implements Formatter {
  /**
   * Tracks all calls to the format method with their arguments
   */
  public formatCalls: { entry: LogEntry }[] = [];

  /**
   * The output to return from the format method
   */
  private output: string;

  /**
   * Whether to throw an error when format is called
   */
  private shouldThrowError: boolean;

  /**
   * The error to throw when format is called (if shouldThrowError is true)
   */
  private errorToThrow: Error;

  /**
   * Creates a new MockFormatter instance.
   * @param output The output to return from the format method
   * @param shouldThrowError Whether to throw an error when format is called
   * @param errorToThrow The error to throw when format is called
   */
  constructor(
    output = 'mock-formatted-output',
    shouldThrowError = false,
    errorToThrow = new Error('Mock formatter error')
  ) {
    this.output = output;
    this.shouldThrowError = shouldThrowError;
    this.errorToThrow = errorToThrow;
  }

  /**
   * Mocks the format method of the Formatter interface.
   * @param entry The log entry to format
   * @returns The configured output string
   * @throws Error if configured to throw an error
   */
  format(entry: LogEntry): string {
    // Track the call
    this.formatCalls.push({ entry });

    // Throw an error if configured to do so
    if (this.shouldThrowError) {
      throw this.errorToThrow;
    }

    // Return the configured output
    return this.output;
  }

  /**
   * Resets the tracking of format calls.
   */
  reset(): void {
    this.formatCalls = [];
  }

  /**
   * Configures the formatter to throw an error when format is called.
   * @param error The error to throw
   */
  setThrowError(error?: Error): void {
    this.shouldThrowError = true;
    if (error) {
      this.errorToThrow = error;
    }
  }

  /**
   * Configures the formatter to not throw an error when format is called.
   */
  setNoThrowError(): void {
    this.shouldThrowError = false;
  }

  /**
   * Sets the output to return from the format method.
   * @param output The output to return
   */
  setOutput(output: string): void {
    this.output = output;
  }
}

/**
 * Mock implementation of a text formatter for testing.
 * Extends the base MockFormatter with text-specific behavior.
 */
export class MockTextFormatter extends MockFormatter {
  /**
   * Creates a new MockTextFormatter instance.
   * @param output The output to return from the format method
   * @param shouldThrowError Whether to throw an error when format is called
   * @param errorToThrow The error to throw when format is called
   */
  constructor(
    output = '[INFO] mock-text-formatted-output',
    shouldThrowError = false,
    errorToThrow = new Error('Mock text formatter error')
  ) {
    super(output, shouldThrowError, errorToThrow);
  }

  /**
   * Creates a mock text output based on the log entry.
   * This is used for more realistic testing when needed.
   * @param entry The log entry to format
   * @returns A mock text representation of the log entry
   */
  createMockTextOutput(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toString();
    const service = entry.service || 'unknown-service';
    const requestId = entry.context?.requestId ? `[${entry.context.requestId}]` : '';
    const userId = entry.context?.userId ? `[User: ${entry.context.userId}]` : '';
    
    return `[${timestamp}] [${level}] [${service}] ${requestId} ${userId} ${entry.message}`;
  }
}

/**
 * Mock implementation of a JSON formatter for testing.
 * Extends the base MockFormatter with JSON-specific behavior.
 */
export class MockJsonFormatter extends MockFormatter {
  /**
   * Creates a new MockJsonFormatter instance.
   * @param output The output to return from the format method
   * @param shouldThrowError Whether to throw an error when format is called
   * @param errorToThrow The error to throw when format is called
   */
  constructor(
    output = '{"level":"INFO","message":"mock-json-formatted-output"}',
    shouldThrowError = false,
    errorToThrow = new Error('Mock JSON formatter error')
  ) {
    super(output, shouldThrowError, errorToThrow);
  }

  /**
   * Creates a mock JSON output based on the log entry.
   * This is used for more realistic testing when needed.
   * @param entry The log entry to format
   * @returns A mock JSON representation of the log entry
   */
  createMockJsonOutput(entry: LogEntry): string {
    const mockObject = {
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      service: entry.service || 'unknown-service',
    };

    // Add context if available
    if (entry.context && Object.keys(entry.context).length > 0) {
      mockObject['context'] = { ...entry.context };
    }

    // Add error if available
    if (entry.error) {
      mockObject['error'] = {
        message: entry.error.message,
        name: entry.error.name,
        stack: entry.error.stack,
      };
    }

    // Add trace if available
    if (entry.trace) {
      mockObject['trace'] = { ...entry.trace };
    }

    return JSON.stringify(mockObject);
  }
}

/**
 * Mock implementation of a CloudWatch formatter for testing.
 * Extends the MockJsonFormatter with CloudWatch-specific behavior.
 */
export class MockCloudWatchFormatter extends MockJsonFormatter {
  /**
   * Creates a new MockCloudWatchFormatter instance.
   * @param output The output to return from the format method
   * @param shouldThrowError Whether to throw an error when format is called
   * @param errorToThrow The error to throw when format is called
   */
  constructor(
    output = '{"level":"INFO","message":"mock-cloudwatch-formatted-output","aws":{"service":"austa-superapp"}}',
    shouldThrowError = false,
    errorToThrow = new Error('Mock CloudWatch formatter error')
  ) {
    super(output, shouldThrowError, errorToThrow);
  }

  /**
   * Creates a mock CloudWatch output based on the log entry.
   * This is used for more realistic testing when needed.
   * @param entry The log entry to format
   * @returns A mock CloudWatch JSON representation of the log entry
   */
  createMockCloudWatchOutput(entry: LogEntry): string {
    // Start with the base JSON output
    const baseOutput = JSON.parse(super.createMockJsonOutput(entry));
    
    // Add CloudWatch-specific fields
    baseOutput.aws = {
      service: 'austa-superapp',
      environment: entry.environment || 'development',
      region: 'us-east-1',
      requestId: entry.context?.requestId || 'unknown',
    };

    // Add journey information if available
    if (entry.context?.journey) {
      baseOutput.journey = entry.context.journey;
    }

    return JSON.stringify(baseOutput);
  }
}

/**
 * Creates a mock log entry for testing.
 * @param overrides Properties to override in the default log entry
 * @returns A mock log entry
 */
export function createMockLogEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    timestamp: new Date(),
    level: LogLevel.INFO,
    message: 'Mock log message',
    service: 'test-service',
    ...overrides,
  };
}