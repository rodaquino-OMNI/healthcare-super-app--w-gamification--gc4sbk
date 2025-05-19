/**
 * Mocks for testing the logging package
 * 
 * This file provides mock implementations of various logging components
 * for use in unit and integration tests. These mocks allow testing of
 * logging functionality without requiring actual external services or
 * infrastructure.
 */

import { EventEmitter } from 'events';
import { Writable, Readable } from 'stream';

// Mock interfaces to match the real implementations
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LogEntry } from '../../src/interfaces/log-entry.interface';
import { Transport } from '../../src/interfaces/transport.interface';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';

/**
 * Mock implementation of a Winston Transport
 * Tracks all logs sent to it and emits events for testing
 */
export class MockWinstonTransport extends EventEmitter implements Transport {
  public logs: LogEntry[] = [];
  public errorOnNextWrite = false;
  public name = 'mock-winston';
  
  constructor(private readonly options: any = {}) {
    super();
  }

  /**
   * Initializes the transport
   */
  async initialize(): Promise<void> {
    this.emit('initialized', this.options);
    return Promise.resolve();
  }

  /**
   * Writes a log entry to this transport
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    if (this.errorOnNextWrite) {
      this.errorOnNextWrite = false;
      this.emit('error', new Error('Simulated transport error'));
      return Promise.reject(new Error('Simulated transport error'));
    }
    
    this.logs.push(entry);
    this.emit('logged', entry);
    return Promise.resolve();
  }

  /**
   * Closes the transport and cleans up resources
   */
  async close(): Promise<void> {
    this.emit('closed');
    return Promise.resolve();
  }

  /**
   * Clears all logged entries
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Simulates a transport error on the next write
   */
  simulateError(): void {
    this.errorOnNextWrite = true;
  }

  /**
   * Gets logs filtered by level
   * @param level The log level to filter by
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Gets logs filtered by journey
   * @param journey The journey to filter by (health, care, plan)
   */
  getLogsByJourney(journey: string): LogEntry[] {
    return this.logs.filter(log => {
      return log.context && 
             typeof log.context === 'object' && 
             'journey' in log.context && 
             log.context.journey === journey;
    });
  }

  /**
   * Gets logs containing a specific message substring
   * @param substring The substring to search for
   */
  getLogsByMessageSubstring(substring: string): LogEntry[] {
    return this.logs.filter(log => 
      log.message && log.message.includes(substring)
    );
  }
}

/**
 * Mock implementation of a CloudWatch Transport
 * Simulates AWS CloudWatch Logs integration
 */
export class MockCloudWatchTransport extends MockWinstonTransport {
  public logGroups: Map<string, any[]> = new Map();
  public logStreams: Map<string, any[]> = new Map();
  public name = 'mock-cloudwatch';
  
  constructor(options: any = {}) {
    super(options);
    this.logGroups.set(options.logGroupName || 'default', []);
    this.logStreams.set(options.logStreamName || 'default', []);
  }

  /**
   * Writes a log entry to this transport and simulates CloudWatch behavior
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    await super.write(entry);
    
    // Simulate CloudWatch specific behavior
    const logGroupName = this.options.logGroupName || 'default';
    const logStreamName = this.options.logStreamName || 'default';
    
    if (!this.logGroups.has(logGroupName)) {
      this.logGroups.set(logGroupName, []);
    }
    
    if (!this.logStreams.has(logStreamName)) {
      this.logStreams.set(logStreamName, []);
    }
    
    const logGroup = this.logGroups.get(logGroupName);
    const logStream = this.logStreams.get(logStreamName);
    
    // Add the entry to both the group and stream
    logGroup.push(entry);
    logStream.push(entry);
    
    return Promise.resolve();
  }

  /**
   * Gets logs for a specific log group
   * @param logGroupName The log group name
   */
  getLogsByGroup(logGroupName: string): LogEntry[] {
    return this.logGroups.get(logGroupName) || [];
  }

  /**
   * Gets logs for a specific log stream
   * @param logStreamName The log stream name
   */
  getLogsByStream(logStreamName: string): LogEntry[] {
    return this.logStreams.get(logStreamName) || [];
  }

  /**
   * Simulates CloudWatch throttling error
   */
  simulateThrottling(): void {
    this.errorOnNextWrite = true;
    this.once('error', (error) => {
      error.code = 'ThrottlingException';
      error.message = 'Rate exceeded for CloudWatch Logs API';
    });
  }
}

/**
 * Mock implementation of a Console Transport
 * Captures console output for testing
 */
export class MockConsoleTransport extends MockWinstonTransport {
  public consoleOutput: string[] = [];
  public name = 'mock-console';
  
  constructor(options: any = {}) {
    super(options);
  }

  /**
   * Writes a log entry to this transport and captures console output
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    await super.write(entry);
    
    // Simulate console output
    const output = `[${entry.level}] ${entry.timestamp} - ${entry.message}`;
    this.consoleOutput.push(output);
    
    return Promise.resolve();
  }

  /**
   * Gets all captured console output
   */
  getConsoleOutput(): string[] {
    return this.consoleOutput;
  }

  /**
   * Clears all captured console output
   */
  clearConsoleOutput(): void {
    this.consoleOutput = [];
  }
}

/**
 * Mock implementation of a Stream Transport
 * Useful for testing stream-based logging
 */
export class MockStreamTransport extends MockWinstonTransport {
  public stream: MockWritableStream;
  public name = 'mock-stream';
  
  constructor(options: any = {}) {
    super(options);
    this.stream = new MockWritableStream();
  }

  /**
   * Writes a log entry to this transport and the stream
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    await super.write(entry);
    
    // Write to the stream
    const output = JSON.stringify(entry) + '\n';
    this.stream.write(output);
    
    return Promise.resolve();
  }

  /**
   * Gets all data written to the stream
   */
  getStreamData(): string {
    return this.stream.getContents();
  }

  /**
   * Clears all data written to the stream
   */
  clearStreamData(): void {
    this.stream.clearContents();
  }
}

/**
 * Mock implementation of a HTTP Transport
 * Simulates sending logs to an HTTP endpoint
 */
export class MockHttpTransport extends MockWinstonTransport {
  public requests: Array<{url: string, method: string, body: any}> = [];
  public name = 'mock-http';
  
  constructor(private readonly httpOptions: any = {}) {
    super(httpOptions);
  }

  /**
   * Writes a log entry to this transport and simulates an HTTP request
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    await super.write(entry);
    
    // Simulate HTTP request
    const url = this.httpOptions.url || 'https://example.com/logs';
    const method = this.httpOptions.method || 'POST';
    
    this.requests.push({
      url,
      method,
      body: entry
    });
    
    return Promise.resolve();
  }

  /**
   * Gets all simulated HTTP requests
   */
  getRequests(): Array<{url: string, method: string, body: any}> {
    return this.requests;
  }

  /**
   * Clears all simulated HTTP requests
   */
  clearRequests(): void {
    this.requests = [];
  }

  /**
   * Simulates an HTTP error response
   * @param statusCode The HTTP status code to simulate
   */
  simulateHttpError(statusCode: number): void {
    this.errorOnNextWrite = true;
    this.once('error', (error) => {
      error.statusCode = statusCode;
      error.message = `HTTP Error: ${statusCode}`;
    });
  }
}

/**
 * Mock implementation of a Formatter
 * Used to test log formatting logic
 */
export class MockFormatter {
  public formattedLogs: Array<{input: LogEntry, output: string}> = [];
  
  constructor(private readonly options: any = {}) {}

  /**
   * Formats a log entry
   * @param entry The log entry to format
   */
  format(entry: LogEntry): string {
    let output: string;
    
    if (this.options.format === 'json') {
      output = JSON.stringify(entry);
    } else if (this.options.format === 'text') {
      output = `[${entry.level}] ${entry.timestamp} - ${entry.message}`;
    } else {
      // Default format
      output = `${entry.timestamp} [${entry.level}] ${entry.message}`;
    }
    
    this.formattedLogs.push({input: entry, output});
    return output;
  }

  /**
   * Gets all formatted logs
   */
  getFormattedLogs(): Array<{input: LogEntry, output: string}> {
    return this.formattedLogs;
  }

  /**
   * Clears all formatted logs
   */
  clearFormattedLogs(): void {
    this.formattedLogs = [];
  }
}

/**
 * Mock implementation of a Writable stream
 * Used for testing stream-based logging
 */
export class MockWritableStream extends Writable {
  private contents: string = '';
  
  constructor(options: any = {}) {
    super(options);
  }

  /**
   * Implementation of the _write method required by Writable
   */
  _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
    this.contents += chunk.toString();
    callback();
  }

  /**
   * Gets all content written to the stream
   */
  getContents(): string {
    return this.contents;
  }

  /**
   * Clears all content written to the stream
   */
  clearContents(): void {
    this.contents = '';
  }
}

/**
 * Mock implementation of a Readable stream
 * Used for testing stream-based logging input
 */
export class MockReadableStream extends Readable {
  private data: string[];
  private currentIndex: number = 0;
  
  constructor(data: string[] = [], options: any = {}) {
    super(options);
    this.data = data;
  }

  /**
   * Implementation of the _read method required by Readable
   */
  _read(size: number): void {
    if (this.currentIndex < this.data.length) {
      this.push(this.data[this.currentIndex]);
      this.currentIndex++;
    } else {
      this.push(null); // End of stream
    }
  }

  /**
   * Sets the data to be read from the stream
   * @param data The data to set
   */
  setData(data: string[]): void {
    this.data = data;
    this.currentIndex = 0;
  }

  /**
   * Adds data to the stream
   * @param chunk The data chunk to add
   */
  addData(chunk: string): void {
    this.data.push(chunk);
  }
}

/**
 * Creates a mock log entry for testing
 * @param level The log level
 * @param message The log message
 * @param context Optional context object
 */
export function createMockLogEntry(
  level: LogLevel = LogLevel.INFO,
  message: string = 'Test log message',
  context: Record<string, any> = {}
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    correlationId: context.correlationId || 'test-correlation-id',
    requestId: context.requestId || 'test-request-id',
    userId: context.userId || 'test-user-id',
    journey: context.journey || null,
    service: context.service || 'test-service',
    error: context.error || null
  };
}

/**
 * Creates a mock logger configuration for testing
 * @param options Configuration options to override defaults
 */
export function createMockLoggerConfig(options: Partial<LoggerConfig> = {}): LoggerConfig {
  return {
    level: options.level || LogLevel.INFO,
    service: options.service || 'test-service',
    transports: options.transports || ['console'],
    format: options.format || 'json',
    context: options.context || {},
    ...options
  } as LoggerConfig;
}

/**
 * Creates a collection of mock transports for testing
 * @param options Configuration options
 */
export function createMockTransports(options: any = {}) {
  return {
    console: new MockConsoleTransport(options.console || {}),
    cloudwatch: new MockCloudWatchTransport(options.cloudwatch || {}),
    http: new MockHttpTransport(options.http || {}),
    stream: new MockStreamTransport(options.stream || {})
  };
}