/**
 * @file mocks.ts
 * @description Provides mock implementations of logging dependencies for testing purposes.
 * These mocks allow for isolated testing of logging functionality without requiring
 * actual external logging services or infrastructure.
 */

import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';
import {
  LogLevel,
  LogLevelString,
  LogLevelUtils,
} from '../../src/interfaces/log-level.enum';
import { Transport, LogEntry, LogBatch } from '../../src/interfaces/transport.interface';
import { TransportConfig, TransportType } from '../../src/interfaces/log-config.interface';
import { Formatter } from '../../src/formatters/formatter.interface';

/**
 * Mock implementation of a log entry for testing
 */
export const createMockLogEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  level: LogLevel.INFO,
  timestamp: new Date(),
  message: 'Test log message',
  service: 'test-service',
  ...overrides,
});

/**
 * Interface for tracking transport method calls
 */
export interface TransportMethodCalls {
  initialize: { config: TransportConfig }[];
  write: { entry: LogEntry }[];
  writeBatch: { batch: LogBatch }[];
  flush: any[];
  close: any[];
  handleError: { error: Error; context?: Record<string, any> }[];
}

/**
 * Base mock transport implementation that tracks method calls
 * and provides configurable behavior for testing
 */
export class MockTransport implements Transport {
  public readonly id: string;
  public readonly type: string;
  public readonly level: LogLevel;
  public active: boolean = true;
  public methodCalls: TransportMethodCalls = {
    initialize: [],
    write: [],
    writeBatch: [],
    flush: [],
    close: [],
    handleError: [],
  };
  public entries: LogEntry[] = [];
  public shouldFail: Record<string, boolean> = {};
  public errorMessage: Record<string, string> = {};

  constructor(id: string = 'mock-transport', type: string = 'mock', level: LogLevel = LogLevel.DEBUG) {
    this.id = id;
    this.type = type;
    this.level = level;
  }

  /**
   * Configures a method to fail when called
   */
  public setMethodToFail(method: keyof TransportMethodCalls, message: string = 'Mock error'): void {
    this.shouldFail[method] = true;
    this.errorMessage[method] = message;
  }

  /**
   * Configures a method to succeed when called
   */
  public setMethodToSucceed(method: keyof TransportMethodCalls): void {
    this.shouldFail[method] = false;
  }

  /**
   * Resets all tracked calls and entries
   */
  public reset(): void {
    this.methodCalls = {
      initialize: [],
      write: [],
      writeBatch: [],
      flush: [],
      close: [],
      handleError: [],
    };
    this.entries = [];
    this.shouldFail = {};
    this.errorMessage = {};
  }

  /**
   * Checks if a method should fail and throws an error if configured to do so
   */
  private checkForFailure(method: keyof TransportMethodCalls): void {
    if (this.shouldFail[method]) {
      throw new Error(this.errorMessage[method] || `Mock ${method} error`);
    }
  }

  /**
   * Mock implementation of initialize method
   */
  public async initialize(config: TransportConfig): Promise<void> {
    this.methodCalls.initialize.push({ config });
    this.checkForFailure('initialize');
  }

  /**
   * Mock implementation of write method
   */
  public async write(entry: LogEntry): Promise<void> {
    this.methodCalls.write.push({ entry });
    this.entries.push(entry);
    this.checkForFailure('write');
  }

  /**
   * Mock implementation of writeBatch method
   */
  public async writeBatch(batch: LogBatch): Promise<void> {
    this.methodCalls.writeBatch.push({ batch });
    this.entries.push(...batch.entries);
    this.checkForFailure('writeBatch');
    batch.callback?.();
  }

  /**
   * Mock implementation of flush method
   */
  public async flush(): Promise<void> {
    this.methodCalls.flush.push({});
    this.checkForFailure('flush');
  }

  /**
   * Mock implementation of close method
   */
  public async close(): Promise<void> {
    this.methodCalls.close.push({});
    this.checkForFailure('close');
  }

  /**
   * Mock implementation of handleError method
   */
  public async handleError(error: Error, context?: Record<string, any>): Promise<void> {
    this.methodCalls.handleError.push({ error, context });
    this.checkForFailure('handleError');
  }

  /**
   * Mock implementation of shouldProcess method
   */
  public shouldProcess(entry: LogEntry): boolean {
    return LogLevelUtils.isLevelEnabled(entry.level, this.level);
  }
}

/**
 * Mock implementation of console transport for testing
 */
export class MockConsoleTransport extends MockTransport {
  public readonly console: {
    log: jest.Mock;
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
  };

  constructor(id: string = 'mock-console', level: LogLevel = LogLevel.DEBUG) {
    super(id, TransportType.CONSOLE, level);
    this.console = {
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
  }

  /**
   * Override write method to call appropriate console method based on log level
   */
  public async write(entry: LogEntry): Promise<void> {
    await super.write(entry);
    
    if (!this.shouldFail.write) {
      const levelString = LogLevelUtils.toString(entry.level).toLowerCase();
      switch (levelString) {
        case 'debug':
          this.console.debug(entry.message, entry);
          break;
        case 'info':
          this.console.info(entry.message, entry);
          break;
        case 'warn':
          this.console.warn(entry.message, entry);
          break;
        case 'error':
        case 'fatal':
          this.console.error(entry.message, entry);
          break;
        default:
          this.console.log(entry.message, entry);
      }
    }
  }
}

/**
 * Mock implementation of file transport for testing
 */
export class MockFileTransport extends MockTransport {
  public readonly filename: string;
  public readonly stream: Writable;
  public readonly fileContents: string[] = [];

  constructor(id: string = 'mock-file', filename: string = 'mock-log.log', level: LogLevel = LogLevel.DEBUG) {
    super(id, TransportType.FILE, level);
    this.filename = filename;
    this.stream = new Writable({
      write: (chunk, encoding, callback) => {
        this.fileContents.push(chunk.toString());
        callback();
      },
    });
  }

  /**
   * Override write method to write to the mock stream
   */
  public async write(entry: LogEntry): Promise<void> {
    await super.write(entry);
    
    if (!this.shouldFail.write) {
      const logString = JSON.stringify(entry) + '\n';
      this.stream.write(logString);
    }
  }

  /**
   * Override close method to end the stream
   */
  public async close(): Promise<void> {
    await super.close();
    
    if (!this.shouldFail.close) {
      this.stream.end();
    }
  }
}

/**
 * Mock implementation of CloudWatch transport for testing
 */
export class MockCloudWatchTransport extends MockTransport {
  public readonly logGroupName: string;
  public readonly logStreamName: string;
  public readonly region: string;
  public readonly cloudWatchLogs: {
    createLogGroup: jest.Mock;
    createLogStream: jest.Mock;
    putLogEvents: jest.Mock;
    describeLogStreams: jest.Mock;
  };
  public readonly batchSize: number;
  public readonly flushInterval: number;
  public readonly buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    id: string = 'mock-cloudwatch',
    logGroupName: string = 'mock-log-group',
    logStreamName: string = 'mock-log-stream',
    region: string = 'us-east-1',
    level: LogLevel = LogLevel.INFO,
    batchSize: number = 10,
    flushInterval: number = 1000
  ) {
    super(id, TransportType.CLOUDWATCH, level);
    this.logGroupName = logGroupName;
    this.logStreamName = logStreamName;
    this.region = region;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    
    this.cloudWatchLogs = {
      createLogGroup: jest.fn().mockResolvedValue({}),
      createLogStream: jest.fn().mockResolvedValue({}),
      putLogEvents: jest.fn().mockResolvedValue({ nextSequenceToken: 'mock-sequence-token' }),
      describeLogStreams: jest.fn().mockResolvedValue({
        logStreams: [{ logStreamName, uploadSequenceToken: 'mock-sequence-token' }],
      }),
    };
  }

  /**
   * Override initialize method to set up CloudWatch-specific initialization
   */
  public async initialize(config: TransportConfig): Promise<void> {
    await super.initialize(config);
    
    if (!this.shouldFail.initialize) {
      await this.cloudWatchLogs.createLogGroup({ logGroupName: this.logGroupName });
      await this.cloudWatchLogs.createLogStream({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
      });
      
      // Start flush timer
      this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
    }
  }

  /**
   * Override write method to buffer logs for CloudWatch
   */
  public async write(entry: LogEntry): Promise<void> {
    await super.write(entry);
    
    if (!this.shouldFail.write) {
      this.buffer.push(entry);
      
      // Flush if buffer reaches batch size
      if (this.buffer.length >= this.batchSize) {
        await this.flush();
      }
    }
  }

  /**
   * Override flush method to send buffered logs to CloudWatch
   */
  public async flush(): Promise<void> {
    await super.flush();
    
    if (!this.shouldFail.flush && this.buffer.length > 0) {
      const logEvents = this.buffer.map(entry => ({
        timestamp: entry.timestamp.getTime(),
        message: JSON.stringify(entry),
      }));
      
      await this.cloudWatchLogs.putLogEvents({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents,
      });
      
      // Clear buffer after successful flush
      this.buffer.length = 0;
    }
  }

  /**
   * Override close method to clean up resources
   */
  public async close(): Promise<void> {
    await super.close();
    
    if (!this.shouldFail.close) {
      // Clear flush timer
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }
      
      // Flush any remaining logs
      await this.flush();
    }
  }
}

/**
 * Mock implementation of HTTP transport for testing
 */
export class MockHttpTransport extends MockTransport {
  public readonly endpoint: string;
  public readonly httpClient: {
    post: jest.Mock;
  };
  public readonly headers: Record<string, string>;

  constructor(
    id: string = 'mock-http',
    endpoint: string = 'https://logs.example.com/ingest',
    level: LogLevel = LogLevel.INFO,
    headers: Record<string, string> = { 'Content-Type': 'application/json' }
  ) {
    super(id, 'http', level);
    this.endpoint = endpoint;
    this.headers = headers;
    this.httpClient = {
      post: jest.fn().mockResolvedValue({ status: 200, data: { success: true } }),
    };
  }

  /**
   * Override write method to send logs via HTTP
   */
  public async write(entry: LogEntry): Promise<void> {
    await super.write(entry);
    
    if (!this.shouldFail.write) {
      await this.httpClient.post(this.endpoint, entry, { headers: this.headers });
    }
  }

  /**
   * Override writeBatch method to send logs in batch via HTTP
   */
  public async writeBatch(batch: LogBatch): Promise<void> {
    await super.writeBatch(batch);
    
    if (!this.shouldFail.writeBatch) {
      await this.httpClient.post(this.endpoint, { logs: batch.entries }, { headers: this.headers });
    }
  }
}

/**
 * Interface for tracking formatter method calls
 */
export interface FormatterMethodCalls {
  format: { entry: LogEntry }[];
}

/**
 * Mock implementation of a formatter for testing
 */
export class MockFormatter implements Formatter {
  public readonly name: string;
  public methodCalls: FormatterMethodCalls = {
    format: [],
  };
  public shouldFail: boolean = false;
  public errorMessage: string = 'Mock formatter error';
  public formatResult: string | Record<string, any> = '{"mock":"formatted log"}';

  constructor(name: string = 'mock-formatter') {
    this.name = name;
  }

  /**
   * Configures the formatter to fail when called
   */
  public setToFail(message: string = 'Mock formatter error'): void {
    this.shouldFail = true;
    this.errorMessage = message;
  }

  /**
   * Configures the formatter to succeed when called
   */
  public setToSucceed(result: string | Record<string, any> = '{"mock":"formatted log"}'): void {
    this.shouldFail = false;
    this.formatResult = result;
  }

  /**
   * Resets all tracked calls
   */
  public reset(): void {
    this.methodCalls = {
      format: [],
    };
  }

  /**
   * Mock implementation of format method
   */
  public format(entry: LogEntry): string | Record<string, any> {
    this.methodCalls.format.push({ entry });
    
    if (this.shouldFail) {
      throw new Error(this.errorMessage);
    }
    
    return this.formatResult;
  }
}

/**
 * Mock implementation of JSON formatter for testing
 */
export class MockJsonFormatter extends MockFormatter {
  constructor(name: string = 'mock-json-formatter') {
    super(name);
    this.formatResult = JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Mock formatted message',
      context: {},
    });
  }

  /**
   * Override format method to return JSON string
   */
  public format(entry: LogEntry): string {
    this.methodCalls.format.push({ entry });
    
    if (this.shouldFail) {
      throw new Error(this.errorMessage);
    }
    
    return typeof this.formatResult === 'string'
      ? this.formatResult
      : JSON.stringify(this.formatResult);
  }
}

/**
 * Mock implementation of text formatter for testing
 */
export class MockTextFormatter extends MockFormatter {
  constructor(name: string = 'mock-text-formatter') {
    super(name);
    this.formatResult = '[INFO] 2023-01-01T00:00:00.000Z - Mock formatted message';
  }

  /**
   * Override format method to return text string
   */
  public format(entry: LogEntry): string {
    this.methodCalls.format.push({ entry });
    
    if (this.shouldFail) {
      throw new Error(this.errorMessage);
    }
    
    return typeof this.formatResult === 'string'
      ? this.formatResult
      : `[${entry.level}] ${entry.timestamp.toISOString()} - ${entry.message}`;
  }
}

/**
 * Mock implementation of CloudWatch formatter for testing
 */
export class MockCloudWatchFormatter extends MockFormatter {
  constructor(name: string = 'mock-cloudwatch-formatter') {
    super(name);
    this.formatResult = JSON.stringify({
      timestamp: new Date().getTime(),
      level: 'INFO',
      message: 'Mock formatted message',
      service: 'test-service',
      environment: 'test',
      awsRegion: 'us-east-1',
    });
  }

  /**
   * Override format method to return CloudWatch-compatible JSON
   */
  public format(entry: LogEntry): string {
    this.methodCalls.format.push({ entry });
    
    if (this.shouldFail) {
      throw new Error(this.errorMessage);
    }
    
    return typeof this.formatResult === 'string'
      ? this.formatResult
      : JSON.stringify({
          ...this.formatResult,
          timestamp: entry.timestamp.getTime(),
          level: entry.level,
          message: entry.message,
        });
  }
}

/**
 * Mock implementation of a readable log stream for testing
 */
export class MockLogStream extends Readable {
  private logs: string[];
  private currentIndex: number = 0;

  constructor(logs: string[] = []) {
    super();
    this.logs = logs;
  }

  /**
   * Add a log entry to the stream
   */
  public addLog(log: string): void {
    this.logs.push(log);
    this.push(log + '\n');
  }

  /**
   * Add multiple log entries to the stream
   */
  public addLogs(logs: string[]): void {
    for (const log of logs) {
      this.addLog(log);
    }
  }

  /**
   * Clear all logs from the stream
   */
  public clearLogs(): void {
    this.logs = [];
    this.currentIndex = 0;
  }

  /**
   * Implementation of _read method required by Readable
   */
  _read(size: number): void {
    if (this.currentIndex >= this.logs.length) {
      // No more logs to read
      this.push(null);
      return;
    }

    const end = Math.min(this.currentIndex + size, this.logs.length);
    for (let i = this.currentIndex; i < end; i++) {
      this.push(this.logs[i] + '\n');
    }
    this.currentIndex = end;
  }
}

/**
 * Creates a mock event emitter that can be used to simulate events
 * for testing event-based logging functionality
 */
export class MockLogEventEmitter extends EventEmitter {
  public readonly events: Record<string, any[]> = {};

  /**
   * Override emit to track emitted events
   */
  public emit(event: string | symbol, ...args: any[]): boolean {
    const eventName = event.toString();
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(args);
    return super.emit(event, ...args);
  }

  /**
   * Get all events of a specific type
   */
  public getEvents(event: string): any[] {
    return this.events[event] || [];
  }

  /**
   * Clear all tracked events
   */
  public clearEvents(): void {
    for (const key in this.events) {
      delete this.events[key];
    }
  }
}