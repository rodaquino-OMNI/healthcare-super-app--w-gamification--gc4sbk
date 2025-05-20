/**
 * @file formatter.mock.ts
 * @description Mock implementations of formatter interfaces for testing logging components
 * that depend on formatters. Provides configurable formatters that track format calls and
 * return predetermined output.
 */

import { 
  Formatter, 
  LogEntry, 
  LogLevel,
  JourneyType
} from '../../src/interfaces/formatter.interface';

/**
 * Configuration options for the mock formatter
 */
export interface MockFormatterOptions {
  /**
   * Whether the formatter should simulate failures
   * @default false
   */
  shouldFail?: boolean;

  /**
   * Delay in milliseconds before resolving/rejecting operations
   * @default 0
   */
  delay?: number;

  /**
   * Error to throw when shouldFail is true
   * @default new Error('Mock formatter failure')
   */
  error?: Error;

  /**
   * Predefined output to return from format method
   * If not provided, a default formatted string will be returned
   */
  output?: string | Record<string, any>;
}

/**
 * Base mock implementation of the Formatter interface for testing
 */
export class MockFormatter implements Formatter {
  /**
   * Tracks calls to the format method
   */
  public formatCalls: { entry: LogEntry }[] = [];

  /**
   * Options for controlling the mock behavior
   */
  private options: Required<MockFormatterOptions>;

  /**
   * Creates a new MockFormatter instance
   * 
   * @param options Options for controlling the mock behavior
   */
  constructor(options: MockFormatterOptions = {}) {
    this.options = {
      shouldFail: options.shouldFail ?? false,
      delay: options.delay ?? 0,
      error: options.error ?? new Error('Mock formatter failure'),
      output: options.output ?? 'Mock formatted log'
    };
  }

  /**
   * Updates the mock options
   * 
   * @param options New options to apply
   */
  public updateOptions(options: Partial<MockFormatterOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
  }

  /**
   * Resets all call tracking
   */
  public reset(): void {
    this.formatCalls = [];
  }

  /**
   * Simulates an asynchronous operation with configurable delay and failure
   * 
   * @param callback Function to execute after delay
   * @returns Promise that resolves or rejects based on shouldFail option
   */
  private async simulateOperation<T>(callback: () => T): Promise<T> {
    if (this.options.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.options.delay));
    }

    if (this.options.shouldFail) {
      throw this.options.error;
    }

    return callback();
  }

  /**
   * Formats a log entry into the desired output format.
   * 
   * @param entry The log entry to format
   * @returns The formatted log entry as a string or object, depending on the formatter implementation
   * @throws Error if formatting fails and shouldFail is true
   */
  public format(entry: LogEntry): string | Record<string, any> {
    this.formatCalls.push({ entry });
    
    // If delay is set, we need to handle this synchronously even though
    // we're using the async helper method internally
    if (this.options.delay > 0 || this.options.shouldFail) {
      try {
        // We need to execute this synchronously, so we create a promise and resolve it immediately
        this.simulateOperation(() => this.options.output);
      } catch (error) {
        throw this.options.error;
      }
    }
    
    return this.options.output;
  }

  /**
   * Gets the number of times the format method has been called
   * 
   * @returns The number of format calls
   */
  public getFormatCallCount(): number {
    return this.formatCalls.length;
  }

  /**
   * Gets the log entries that have been passed to the format method
   * 
   * @returns Array of log entries
   */
  public getFormattedEntries(): LogEntry[] {
    return this.formatCalls.map(call => call.entry);
  }

  /**
   * Checks if a specific log entry has been formatted
   * 
   * @param predicate Function that tests each log entry
   * @returns True if any log entry matches the predicate, false otherwise
   */
  public hasFormatted(predicate: (entry: LogEntry) => boolean): boolean {
    return this.formatCalls.some(call => predicate(call.entry));
  }
}

/**
 * Mock implementation of the text formatter for testing
 */
export class MockTextFormatter extends MockFormatter {
  /**
   * Creates a new MockTextFormatter instance
   * 
   * @param options Options for controlling the mock behavior
   */
  constructor(options: MockFormatterOptions = {}) {
    super({
      ...options,
      output: options.output ?? 'Mock text formatted log'
    });
  }

  /**
   * Formats a log entry into a text string.
   * Overrides the base implementation to provide text-specific formatting.
   * 
   * @param entry The log entry to format
   * @returns The formatted log entry as a string
   * @throws Error if formatting fails and shouldFail is true
   */
  public format(entry: LogEntry): string {
    const result = super.format(entry);
    return typeof result === 'string' ? result : JSON.stringify(result);
  }
}

/**
 * Mock implementation of the JSON formatter for testing
 */
export class MockJsonFormatter extends MockFormatter {
  /**
   * Creates a new MockJsonFormatter instance
   * 
   * @param options Options for controlling the mock behavior
   */
  constructor(options: MockFormatterOptions = {}) {
    super({
      ...options,
      output: options.output ?? {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Mock JSON formatted log',
        context: 'test'
      }
    });
  }

  /**
   * Formats a log entry into a JSON object.
   * Overrides the base implementation to provide JSON-specific formatting.
   * 
   * @param entry The log entry to format
   * @returns The formatted log entry as a Record<string, any>
   * @throws Error if formatting fails and shouldFail is true
   */
  public format(entry: LogEntry): Record<string, any> {
    const result = super.format(entry);
    return typeof result === 'string' ? JSON.parse(result) : result;
  }
}

/**
 * Mock implementation of the CloudWatch formatter for testing
 */
export class MockCloudWatchFormatter extends MockJsonFormatter {
  /**
   * Creates a new MockCloudWatchFormatter instance
   * 
   * @param options Options for controlling the mock behavior
   */
  constructor(options: MockFormatterOptions = {}) {
    super({
      ...options,
      output: options.output ?? {
        timestamp: new Date().getTime(),
        level: 'INFO',
        message: 'Mock CloudWatch formatted log',
        context: 'test',
        service: 'test-service',
        environment: 'test',
        aws: {
          region: 'us-east-1',
          accountId: '123456789012'
        }
      }
    });
  }

  /**
   * Formats a log entry into a CloudWatch-compatible JSON object.
   * Overrides the base implementation to provide CloudWatch-specific formatting.
   * 
   * @param entry The log entry to format
   * @returns The formatted log entry as a Record<string, any>
   * @throws Error if formatting fails and shouldFail is true
   */
  public format(entry: LogEntry): Record<string, any> {
    const result = super.format(entry) as Record<string, any>;
    
    // Ensure timestamp is in milliseconds for CloudWatch
    if (typeof result.timestamp === 'string') {
      result.timestamp = new Date(result.timestamp).getTime();
    }
    
    return result;
  }
}

/**
 * Creates a mock formatter factory for testing
 * 
 * @param type Formatter type to create ('text', 'json', or 'cloudwatch')
 * @param options Options for controlling the mock behavior
 * @returns A new mock formatter instance of the specified type
 */
export function createMockFormatter(
  type: 'text' | 'json' | 'cloudwatch',
  options: MockFormatterOptions = {}
): MockFormatter {
  switch (type) {
    case 'text':
      return new MockTextFormatter(options);
    case 'json':
      return new MockJsonFormatter(options);
    case 'cloudwatch':
      return new MockCloudWatchFormatter(options);
    default:
      return new MockFormatter(options);
  }
}

/**
 * Creates a sample log entry for testing
 * 
 * @param overrides Properties to override in the default log entry
 * @returns A sample log entry
 */
export function createSampleLogEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    timestamp: new Date(),
    level: LogLevel.INFO,
    message: 'Test log message',
    context: 'test',
    ...overrides
  };
}

/**
 * Creates a sample error log entry for testing
 * 
 * @param error Error object or message
 * @param overrides Additional properties to override
 * @returns A sample error log entry
 */
export function createSampleErrorLogEntry(
  error: Error | string = new Error('Test error'),
  overrides: Partial<LogEntry> = {}
): LogEntry {
  return createSampleLogEntry({
    level: LogLevel.ERROR,
    message: typeof error === 'string' ? error : error.message,
    error: error,
    ...overrides
  });
}

/**
 * Creates a sample journey log entry for testing
 * 
 * @param journey Journey type
 * @param overrides Additional properties to override
 * @returns A sample journey log entry
 */
export function createSampleJourneyLogEntry(
  journey: JourneyType,
  overrides: Partial<LogEntry> = {}
): LogEntry {
  return createSampleLogEntry({
    journey,
    ...overrides
  });
}