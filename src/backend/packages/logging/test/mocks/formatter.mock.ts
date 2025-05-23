/**
 * @file formatter.mock.ts
 * @description Mock implementations of formatter interfaces for testing logging components
 * that depend on formatters. Provides configurable formatters that track format calls and
 * return predetermined output.
 */

import { Formatter, LogEntry } from '../../src/formatters/formatter.interface';

/**
 * Mock implementation of the Formatter interface for testing.
 * Tracks format calls and returns configurable output.
 */
export class MockFormatter implements Formatter {
  /**
   * Tracks all calls to the format method with their arguments
   */
  public formatCalls: { entry: LogEntry }[] = [];

  /**
   * The output to return when format is called
   */
  private returnValue: string | Record<string, any>;

  /**
   * Whether to throw an error when format is called
   */
  private shouldThrowError: boolean = false;

  /**
   * The error to throw when format is called (if shouldThrowError is true)
   */
  private errorToThrow: Error = new Error('Mock formatter error');

  /**
   * Creates a new MockFormatter instance
   * 
   * @param returnValue The value to return when format is called
   */
  constructor(returnValue: string | Record<string, any> = 'mock formatted log') {
    this.returnValue = returnValue;
  }

  /**
   * Configures the formatter to throw an error when format is called
   * 
   * @param error The error to throw (defaults to a generic error)
   * @returns The MockFormatter instance for chaining
   */
  public throwError(error?: Error): MockFormatter {
    this.shouldThrowError = true;
    if (error) {
      this.errorToThrow = error;
    }
    return this;
  }

  /**
   * Configures the formatter to not throw an error when format is called
   * 
   * @returns The MockFormatter instance for chaining
   */
  public dontThrowError(): MockFormatter {
    this.shouldThrowError = false;
    return this;
  }

  /**
   * Sets the value to return when format is called
   * 
   * @param value The value to return
   * @returns The MockFormatter instance for chaining
   */
  public setReturnValue(value: string | Record<string, any>): MockFormatter {
    this.returnValue = value;
    return this;
  }

  /**
   * Clears the tracked format calls
   * 
   * @returns The MockFormatter instance for chaining
   */
  public clearCalls(): MockFormatter {
    this.formatCalls = [];
    return this;
  }

  /**
   * Returns the number of times format has been called
   * 
   * @returns The number of format calls
   */
  public getCallCount(): number {
    return this.formatCalls.length;
  }

  /**
   * Implements the Formatter interface's format method.
   * Tracks the call, throws an error if configured to do so, or returns the configured value.
   * 
   * @param entry The log entry to format
   * @returns The configured return value
   * @throws Error if configured to throw an error
   */
  public format(entry: LogEntry): string | Record<string, any> {
    this.formatCalls.push({ entry });
    
    if (this.shouldThrowError) {
      throw this.errorToThrow;
    }
    
    return this.returnValue;
  }
}

/**
 * Mock implementation of a text formatter for testing.
 * Extends the base MockFormatter with text-specific defaults.
 */
export class MockTextFormatter extends MockFormatter {
  /**
   * Creates a new MockTextFormatter instance
   * 
   * @param returnValue The value to return when format is called (defaults to a text representation)
   */
  constructor(returnValue: string = '[INFO] 2023-01-01T00:00:00.000Z - Mock log message') {
    super(returnValue);
  }
}

/**
 * Mock implementation of a JSON formatter for testing.
 * Extends the base MockFormatter with JSON-specific defaults.
 */
export class MockJsonFormatter extends MockFormatter {
  /**
   * Creates a new MockJsonFormatter instance
   * 
   * @param returnValue The value to return when format is called (defaults to a JSON object)
   */
  constructor(returnValue: Record<string, any> = {
    level: 'INFO',
    message: 'Mock log message',
    timestamp: '2023-01-01T00:00:00.000Z',
    context: { service: 'test-service' }
  }) {
    super(returnValue);
  }
}

/**
 * Mock implementation of a CloudWatch formatter for testing.
 * Extends the base MockFormatter with CloudWatch-specific defaults.
 */
export class MockCloudWatchFormatter extends MockFormatter {
  /**
   * Creates a new MockCloudWatchFormatter instance
   * 
   * @param returnValue The value to return when format is called (defaults to a CloudWatch-compatible object)
   */
  constructor(returnValue: Record<string, any> = {
    level: 'INFO',
    message: 'Mock log message',
    timestamp: '2023-01-01T00:00:00.000Z',
    context: { service: 'test-service' },
    aws: {
      logGroup: '/austa/test-service',
      logStream: 'test-instance',
      awsRegion: 'us-east-1'
    }
  }) {
    super(returnValue);
  }
}

/**
 * Factory function to create a mock formatter with default settings
 * 
 * @param type The type of formatter to create
 * @param returnValue Optional custom return value
 * @returns A configured mock formatter
 */
export function createMockFormatter(
  type: 'text' | 'json' | 'cloudwatch' | 'generic' = 'generic',
  returnValue?: string | Record<string, any>
): MockFormatter {
  switch (type) {
    case 'text':
      return returnValue ? new MockTextFormatter(returnValue as string) : new MockTextFormatter();
    case 'json':
      return returnValue ? new MockJsonFormatter(returnValue as Record<string, any>) : new MockJsonFormatter();
    case 'cloudwatch':
      return returnValue ? new MockCloudWatchFormatter(returnValue as Record<string, any>) : new MockCloudWatchFormatter();
    case 'generic':
    default:
      return returnValue ? new MockFormatter(returnValue) : new MockFormatter();
  }
}