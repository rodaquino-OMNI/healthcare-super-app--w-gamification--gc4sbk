/**
 * @file mock-transport.utils.ts
 * @description Provides mock implementations of logging transports for testing purposes.
 * These mocks mimic the behavior of real log transports but allow for inspection and
 * verification in tests.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  LogEntry,
  LogBatch,
  Transport,
  TransportConfig,
  TransportType,
  LogLevel,
  FormatterType,
} from '../../../src/interfaces';

/**
 * Interface for mock transport configuration
 */
export interface MockTransportOptions {
  /**
   * Minimum log level for the transport
   * @default LogLevel.DEBUG
   */
  level?: LogLevel;
  
  /**
   * Whether the transport should fail during initialization
   * @default false
   */
  failInitialize?: boolean;
  
  /**
   * Whether the transport should fail during write operations
   * @default false
   */
  failWrite?: boolean;
  
  /**
   * Whether the transport should fail during close operations
   * @default false
   */
  failClose?: boolean;
  
  /**
   * Delay in milliseconds for write operations to simulate network latency
   * @default 0
   */
  writeDelay?: number;
}

/**
 * Base class for all mock transports that implements the Transport interface
 * and provides common functionality for testing.
 */
export abstract class BaseMockTransport implements Transport {
  public readonly id: string;
  public readonly type: string;
  public readonly level: LogLevel;
  public active: boolean = false;
  
  // Store logs in memory for inspection during tests
  protected logs: LogEntry[] = [];
  
  // Track initialization and close states
  protected initialized: boolean = false;
  protected closed: boolean = false;
  
  // Track errors that occurred during transport operations
  protected errors: Error[] = [];
  
  // Configuration options
  protected config: TransportConfig;
  
  // Behavior flags for testing
  protected shouldFailInitialize: boolean = false;
  protected shouldFailWrite: boolean = false;
  protected shouldFailClose: boolean = false;
  protected writeDelay: number = 0;
  
  constructor(type: string, options: MockTransportOptions = {}) {
    this.id = uuidv4();
    this.type = type;
    this.level = options.level ?? LogLevel.DEBUG;
    
    // Initialize behavior flags
    this.shouldFailInitialize = options.failInitialize ?? false;
    this.shouldFailWrite = options.failWrite ?? false;
    this.shouldFailClose = options.failClose ?? false;
    this.writeDelay = options.writeDelay ?? 0;
  }
  
  /**
   * Initializes the transport with the provided configuration
   */
  public async initialize(config: TransportConfig): Promise<void> {
    if (this.shouldFailInitialize) {
      const error = new Error(`Mock transport initialization failure: ${this.type}`);
      this.errors.push(error);
      throw error;
    }
    
    this.config = config;
    this.initialized = true;
    this.active = true;
  }
  
  /**
   * Writes a single log entry to the transport
   */
  public async write(entry: LogEntry): Promise<void> {
    this.ensureInitialized();
    
    if (this.shouldFailWrite) {
      const error = new Error(`Mock transport write failure: ${this.type}`);
      this.errors.push(error);
      throw error;
    }
    
    if (this.writeDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.writeDelay));
    }
    
    if (this.shouldProcess(entry)) {
      this.logs.push({ ...entry });
    }
  }
  
  /**
   * Writes a batch of log entries to the transport
   */
  public async writeBatch(batch: LogBatch): Promise<void> {
    this.ensureInitialized();
    
    if (this.shouldFailWrite) {
      const error = new Error(`Mock transport batch write failure: ${this.type}`);
      this.errors.push(error);
      if (batch.callback) {
        batch.callback(error);
      }
      throw error;
    }
    
    if (this.writeDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.writeDelay));
    }
    
    for (const entry of batch.entries) {
      if (this.shouldProcess(entry)) {
        this.logs.push({ ...entry });
      }
    }
    
    if (batch.callback) {
      batch.callback();
    }
  }
  
  /**
   * Flushes any buffered log entries
   */
  public async flush(): Promise<void> {
    this.ensureInitialized();
    // No-op for mock transports as we don't buffer
  }
  
  /**
   * Closes the transport and releases any resources
   */
  public async close(): Promise<void> {
    if (this.shouldFailClose) {
      const error = new Error(`Mock transport close failure: ${this.type}`);
      this.errors.push(error);
      throw error;
    }
    
    this.active = false;
    this.closed = true;
  }
  
  /**
   * Checks if a log entry should be processed by this transport
   */
  public shouldProcess(entry: LogEntry): boolean {
    return entry.level >= this.level;
  }
  
  /**
   * Handles transport-specific errors
   */
  public async handleError(error: Error, context?: Record<string, any>): Promise<void> {
    this.errors.push(error);
  }
  
  /**
   * Gets all logs that have been written to this transport
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }
  
  /**
   * Gets logs filtered by level
   */
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }
  
  /**
   * Gets logs filtered by a custom predicate function
   */
  public getLogsByFilter(predicate: (log: LogEntry) => boolean): LogEntry[] {
    return this.logs.filter(predicate);
  }
  
  /**
   * Gets all errors that occurred during transport operations
   */
  public getErrors(): Error[] {
    return [...this.errors];
  }
  
  /**
   * Clears all logs from the transport
   */
  public clearLogs(): void {
    this.logs = [];
  }
  
  /**
   * Clears all errors from the transport
   */
  public clearErrors(): void {
    this.errors = [];
  }
  
  /**
   * Configures the transport to fail during initialization
   */
  public setFailInitialize(shouldFail: boolean): void {
    this.shouldFailInitialize = shouldFail;
  }
  
  /**
   * Configures the transport to fail during write operations
   */
  public setFailWrite(shouldFail: boolean): void {
    this.shouldFailWrite = shouldFail;
  }
  
  /**
   * Configures the transport to fail during close operations
   */
  public setFailClose(shouldFail: boolean): void {
    this.shouldFailClose = shouldFail;
  }
  
  /**
   * Sets a delay for write operations to simulate network latency
   */
  public setWriteDelay(delayMs: number): void {
    this.writeDelay = delayMs;
  }
  
  /**
   * Checks if the transport has been initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Checks if the transport has been closed
   */
  public isClosed(): boolean {
    return this.closed;
  }
  
  /**
   * Ensures the transport has been initialized before operations
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`Transport ${this.type} has not been initialized`);
    }
    
    if (this.closed) {
      throw new Error(`Transport ${this.type} has been closed`);
    }
  }
}

/**
 * Mock implementation of a console transport for testing purposes.
 * Simulates writing logs to the console but stores them in memory for inspection.
 */
export class MockConsoleTransport extends BaseMockTransport {
  private colorize: boolean = true;
  private prettyPrint: boolean = true;
  
  constructor(options: MockTransportOptions = {}) {
    super(TransportType.CONSOLE, options);
  }
  
  /**
   * Initializes the console transport with the provided configuration
   */
  public async initialize(config: TransportConfig): Promise<void> {
    await super.initialize(config);
    
    if (config.console) {
      this.colorize = config.console.colorize ?? true;
      this.prettyPrint = config.console.prettyPrint ?? true;
    }
  }
  
  /**
   * Gets whether colorization is enabled for this transport
   */
  public isColorized(): boolean {
    return this.colorize;
  }
  
  /**
   * Gets whether pretty printing is enabled for this transport
   */
  public isPrettyPrinted(): boolean {
    return this.prettyPrint;
  }
}

/**
 * Mock implementation of a file transport for testing purposes.
 * Simulates writing logs to a file but stores them in memory for inspection.
 */
export class MockFileTransport extends BaseMockTransport {
  private filename: string = '';
  private maxSize: number = 10485760; // 10MB
  private maxFiles: number = 5;
  private compress: boolean = true;
  
  constructor(options: MockTransportOptions = {}) {
    super(TransportType.FILE, options);
  }
  
  /**
   * Initializes the file transport with the provided configuration
   */
  public async initialize(config: TransportConfig): Promise<void> {
    if (!config.file?.filename) {
      throw new Error('File transport requires a filename');
    }
    
    await super.initialize(config);
    
    if (config.file) {
      this.filename = config.file.filename;
      this.maxSize = config.file.maxSize ?? 10485760;
      this.maxFiles = config.file.maxFiles ?? 5;
      this.compress = config.file.compress ?? true;
    }
  }
  
  /**
   * Gets the configured filename for this transport
   */
  public getFilename(): string {
    return this.filename;
  }
  
  /**
   * Gets the configured maximum file size for this transport
   */
  public getMaxSize(): number {
    return this.maxSize;
  }
  
  /**
   * Gets the configured maximum number of files for this transport
   */
  public getMaxFiles(): number {
    return this.maxFiles;
  }
  
  /**
   * Gets whether compression is enabled for this transport
   */
  public isCompressed(): boolean {
    return this.compress;
  }
}

/**
 * Mock implementation of a CloudWatch transport for testing purposes.
 * Simulates sending logs to AWS CloudWatch but stores them in memory for inspection.
 */
export class MockCloudWatchTransport extends BaseMockTransport {
  private region: string = '';
  private logGroupName: string = '';
  private logStreamName: string = '';
  private retries: number = 3;
  private batchSize: number = 10000;
  private flushInterval: number = 1000;
  private pendingBatch: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  
  constructor(options: MockTransportOptions = {}) {
    super(TransportType.CLOUDWATCH, options);
  }
  
  /**
   * Initializes the CloudWatch transport with the provided configuration
   */
  public async initialize(config: TransportConfig): Promise<void> {
    if (!config.cloudWatch?.region || !config.cloudWatch?.logGroupName) {
      throw new Error('CloudWatch transport requires region and logGroupName');
    }
    
    await super.initialize(config);
    
    if (config.cloudWatch) {
      this.region = config.cloudWatch.region;
      this.logGroupName = config.cloudWatch.logGroupName;
      this.logStreamName = config.cloudWatch.logStreamName ?? `log-stream-${this.id}`;
      this.retries = config.cloudWatch.retries ?? 3;
      this.batchSize = config.cloudWatch.batchSize ?? 10000;
      this.flushInterval = config.cloudWatch.flushInterval ?? 1000;
      
      // Set up automatic flushing
      this.setupFlushTimer();
    }
  }
  
  /**
   * Writes a single log entry to the transport
   * For CloudWatch, we batch logs and flush periodically
   */
  public async write(entry: LogEntry): Promise<void> {
    this.ensureInitialized();
    
    if (this.shouldFailWrite) {
      const error = new Error(`Mock transport write failure: ${this.type}`);
      this.errors.push(error);
      throw error;
    }
    
    if (this.shouldProcess(entry)) {
      this.pendingBatch.push({ ...entry });
      
      // If we've reached the batch size, flush immediately
      if (this.pendingBatch.length >= this.batchSize) {
        await this.flushPendingBatch();
      }
    }
  }
  
  /**
   * Flushes any buffered log entries to CloudWatch
   */
  public async flush(): Promise<void> {
    this.ensureInitialized();
    await this.flushPendingBatch();
  }
  
  /**
   * Closes the transport and releases any resources
   */
  public async close(): Promise<void> {
    // Flush any pending logs before closing
    await this.flush();
    
    // Clear the flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    await super.close();
  }
  
  /**
   * Gets the configured AWS region for this transport
   */
  public getRegion(): string {
    return this.region;
  }
  
  /**
   * Gets the configured log group name for this transport
   */
  public getLogGroupName(): string {
    return this.logGroupName;
  }
  
  /**
   * Gets the configured log stream name for this transport
   */
  public getLogStreamName(): string {
    return this.logStreamName;
  }
  
  /**
   * Gets the number of logs currently in the pending batch
   */
  public getPendingBatchSize(): number {
    return this.pendingBatch.length;
  }
  
  /**
   * Gets the configured number of retries for this transport
   */
  public getRetries(): number {
    return this.retries;
  }
  
  /**
   * Sets up the automatic flush timer
   */
  private setupFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(async () => {
      try {
        await this.flushPendingBatch();
      } catch (error) {
        // In a real implementation, we would handle this error
        // For the mock, we just store it
        this.errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }, this.flushInterval);
  }
  
  /**
   * Flushes the pending batch of logs to CloudWatch
   */
  private async flushPendingBatch(): Promise<void> {
    if (this.pendingBatch.length === 0) {
      return;
    }
    
    if (this.writeDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.writeDelay));
    }
    
    // In a real implementation, this would send logs to CloudWatch
    // For the mock, we just move them to the logs array
    this.logs.push(...this.pendingBatch);
    
    // Clear the pending batch
    this.pendingBatch = [];
  }
}

/**
 * Creates a mock transport based on the specified type
 */
export function createMockTransport(type: TransportType, options: MockTransportOptions = {}): Transport {
  switch (type) {
    case TransportType.CONSOLE:
      return new MockConsoleTransport(options);
    case TransportType.FILE:
      return new MockFileTransport(options);
    case TransportType.CLOUDWATCH:
      return new MockCloudWatchTransport(options);
    default:
      throw new Error(`Unsupported transport type: ${type}`);
  }
}

/**
 * Utility functions for working with mock transports in tests
 */
export const MockTransportUtils = {
  /**
   * Creates a mock console transport
   */
  createConsoleTransport(options: MockTransportOptions = {}): MockConsoleTransport {
    return new MockConsoleTransport(options);
  },
  
  /**
   * Creates a mock file transport
   */
  createFileTransport(options: MockTransportOptions = {}): MockFileTransport {
    return new MockFileTransport(options);
  },
  
  /**
   * Creates a mock CloudWatch transport
   */
  createCloudWatchTransport(options: MockTransportOptions = {}): MockCloudWatchTransport {
    return new MockCloudWatchTransport(options);
  },
  
  /**
   * Creates a set of mock transports for common testing scenarios
   */
  createDefaultMockTransports(): Transport[] {
    return [
      new MockConsoleTransport(),
      new MockCloudWatchTransport({
        level: LogLevel.INFO
      })
    ];
  },
  
  /**
   * Creates a mock transport configuration for testing
   */
  createMockTransportConfig(type: TransportType, level: LogLevel = LogLevel.DEBUG): TransportConfig {
    const config: TransportConfig = {
      type,
      level,
      formatter: FormatterType.JSON
    };
    
    switch (type) {
      case TransportType.CONSOLE:
        config.console = {
          colorize: true,
          prettyPrint: true,
          timestamp: true
        };
        break;
      case TransportType.FILE:
        config.file = {
          filename: `/tmp/test-logs-${Date.now()}.log`,
          maxSize: 1024 * 1024, // 1MB
          maxFiles: 3,
          compress: false
        };
        break;
      case TransportType.CLOUDWATCH:
        config.cloudWatch = {
          region: 'us-east-1',
          logGroupName: 'test-log-group',
          logStreamName: `test-log-stream-${Date.now()}`,
          retries: 1,
          batchSize: 10,
          flushInterval: 100
        };
        break;
    }
    
    return config;
  },
  
  /**
   * Creates a sample log entry for testing
   */
  createSampleLogEntry(level: LogLevel = LogLevel.INFO, message: string = 'Test log message'): LogEntry {
    return {
      level,
      timestamp: new Date(),
      message,
      context: {
        service: 'test-service',
        journey: 'health'
      },
      traceId: uuidv4(),
      service: 'test-service',
      journey: 'health',
      meta: {
        test: true,
        requestId: uuidv4()
      }
    };
  },
  
  /**
   * Creates a batch of sample log entries for testing
   */
  createSampleLogBatch(count: number = 5, level: LogLevel = LogLevel.INFO): LogBatch {
    const entries: LogEntry[] = [];
    
    for (let i = 0; i < count; i++) {
      entries.push(this.createSampleLogEntry(level, `Test log message ${i + 1}`));
    }
    
    return {
      entries,
      callback: () => {}
    };
  },
  
  /**
   * Asserts that a log entry contains the expected properties
   */
  assertLogEntry(log: LogEntry, expected: Partial<LogEntry>): void {
    for (const [key, value] of Object.entries(expected)) {
      if (typeof value === 'object' && value !== null) {
        // For objects, check that all expected properties exist
        const logValue = log[key as keyof LogEntry] as Record<string, any>;
        for (const [subKey, subValue] of Object.entries(value)) {
          if (logValue[subKey] !== subValue) {
            throw new Error(`Expected log.${key}.${subKey} to be ${subValue} but got ${logValue[subKey]}`);
          }
        }
      } else if (log[key as keyof LogEntry] !== value) {
        throw new Error(`Expected log.${key} to be ${value} but got ${log[key as keyof LogEntry]}`);
      }
    }
  },
  
  /**
   * Asserts that a transport contains a log with the expected properties
   */
  assertTransportHasLog(transport: BaseMockTransport, expected: Partial<LogEntry>): void {
    const logs = transport.getLogs();
    const found = logs.some(log => {
      try {
        this.assertLogEntry(log, expected);
        return true;
      } catch {
        return false;
      }
    });
    
    if (!found) {
      throw new Error(`Expected transport to have a log matching ${JSON.stringify(expected)} but none was found`);
    }
  },
  
  /**
   * Asserts that a transport contains exactly the expected number of logs
   */
  assertTransportLogCount(transport: BaseMockTransport, expectedCount: number): void {
    const logs = transport.getLogs();
    if (logs.length !== expectedCount) {
      throw new Error(`Expected transport to have ${expectedCount} logs but found ${logs.length}`);
    }
  },
  
  /**
   * Asserts that a transport contains exactly the expected number of logs at a specific level
   */
  assertTransportLogLevelCount(transport: BaseMockTransport, level: LogLevel, expectedCount: number): void {
    const logs = transport.getLogsByLevel(level);
    if (logs.length !== expectedCount) {
      throw new Error(`Expected transport to have ${expectedCount} logs at level ${LogLevel[level]} but found ${logs.length}`);
    }
  }
};