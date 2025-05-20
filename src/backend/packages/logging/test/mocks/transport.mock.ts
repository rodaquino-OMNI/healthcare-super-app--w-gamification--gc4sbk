/**
 * @file transport.mock.ts
 * @description Mock implementations of transport interfaces for testing logging components
 * that depend on transports. Provides configurable transports that track write calls and
 * can simulate success or failure.
 */

import { 
  LogEntry, 
  LogBatch, 
  Transport, 
  TransportConfig,
  TransportType,
  ConsoleTransportConfig,
  FileTransportConfig,
  CloudWatchTransportConfig
} from '../../src/interfaces';
import { LogLevel } from '../../src/interfaces/log-level.enum';

/**
 * Configuration options for the mock transport
 */
export interface MockTransportOptions {
  /**
   * Whether the transport should simulate failures
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
   * @default new Error('Mock transport failure')
   */
  error?: Error;

  /**
   * Initial active state of the transport
   * @default true
   */
  active?: boolean;

  /**
   * Minimum log level for the transport
   * @default LogLevel.DEBUG
   */
  level?: LogLevel;
}

/**
 * Base mock implementation of the Transport interface for testing
 */
export class MockTransport implements Transport {
  public readonly id: string;
  public readonly type: string;
  public readonly level: LogLevel;
  public active: boolean;

  /**
   * Tracks calls to the initialize method
   */
  public initializeCalls: { config: TransportConfig }[] = [];

  /**
   * Tracks calls to the write method
   */
  public writeCalls: { entry: LogEntry }[] = [];

  /**
   * Tracks calls to the writeBatch method
   */
  public writeBatchCalls: { batch: LogBatch }[] = [];

  /**
   * Tracks calls to the flush method
   */
  public flushCalls: number = 0;

  /**
   * Tracks calls to the close method
   */
  public closeCalls: number = 0;

  /**
   * Tracks calls to the handleError method
   */
  public handleErrorCalls: { error: Error; context?: Record<string, any> }[] = [];

  /**
   * Options for controlling the mock behavior
   */
  private options: Required<MockTransportOptions>;

  /**
   * Creates a new MockTransport instance
   * 
   * @param id Unique identifier for the transport
   * @param type Transport type identifier
   * @param options Options for controlling the mock behavior
   */
  constructor(id: string, type: string, options: MockTransportOptions = {}) {
    this.id = id;
    this.type = type;
    this.options = {
      shouldFail: options.shouldFail ?? false,
      delay: options.delay ?? 0,
      error: options.error ?? new Error('Mock transport failure'),
      active: options.active ?? true,
      level: options.level ?? LogLevel.DEBUG
    };
    this.active = this.options.active;
    this.level = this.options.level;
  }

  /**
   * Updates the mock options
   * 
   * @param options New options to apply
   */
  public updateOptions(options: Partial<MockTransportOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
    
    // Update active state if provided
    if (options.active !== undefined) {
      this.active = options.active;
    }
  }

  /**
   * Resets all call tracking
   */
  public reset(): void {
    this.initializeCalls = [];
    this.writeCalls = [];
    this.writeBatchCalls = [];
    this.flushCalls = 0;
    this.closeCalls = 0;
    this.handleErrorCalls = [];
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
   * Initializes the transport with the provided configuration
   * 
   * @param config Transport configuration
   * @returns Promise that resolves when initialization is complete
   * @throws Error if initialization fails and shouldFail is true
   */
  public async initialize(config: TransportConfig): Promise<void> {
    this.initializeCalls.push({ config });
    return this.simulateOperation(() => {
      // Implementation would normally set up the transport based on config
      return undefined;
    });
  }

  /**
   * Writes a single log entry to the transport destination
   * 
   * @param entry Log entry to write
   * @returns Promise that resolves when the write is complete
   * @throws Error if the write operation fails and shouldFail is true
   */
  public async write(entry: LogEntry): Promise<void> {
    this.writeCalls.push({ entry });
    return this.simulateOperation(() => {
      // Implementation would normally write the entry to the destination
      return undefined;
    });
  }

  /**
   * Writes a batch of log entries to the transport destination
   * 
   * @param batch Batch of log entries to write
   * @returns Promise that resolves when all entries in the batch are written
   * @throws Error if the batch write operation fails and shouldFail is true
   */
  public async writeBatch(batch: LogBatch): Promise<void> {
    this.writeBatchCalls.push({ batch });
    return this.simulateOperation(() => {
      // Implementation would normally write all entries in the batch
      // Call the callback if provided
      if (batch.callback) {
        if (this.options.shouldFail) {
          batch.callback(this.options.error);
        } else {
          batch.callback();
        }
      }
      return undefined;
    });
  }

  /**
   * Flushes any buffered log entries to ensure they are written
   * 
   * @returns Promise that resolves when all buffered entries are written
   * @throws Error if the flush operation fails and shouldFail is true
   */
  public async flush(): Promise<void> {
    this.flushCalls++;
    return this.simulateOperation(() => {
      // Implementation would normally flush any buffered entries
      return undefined;
    });
  }

  /**
   * Closes the transport and releases any resources
   * 
   * @returns Promise that resolves when the transport is closed
   * @throws Error if the close operation fails and shouldFail is true
   */
  public async close(): Promise<void> {
    this.closeCalls++;
    return this.simulateOperation(() => {
      this.active = false;
      return undefined;
    });
  }

  /**
   * Checks if a log entry should be processed by this transport
   * based on its level and other criteria
   * 
   * @param entry Log entry to check
   * @returns True if the entry should be processed, false otherwise
   */
  public shouldProcess(entry: LogEntry): boolean {
    return this.active && entry.level >= this.level;
  }

  /**
   * Handles transport-specific errors
   * 
   * @param error Error that occurred during transport operations
   * @param context Additional context about the operation that failed
   * @returns Promise that resolves when error handling is complete
   * @throws Error if the error handling fails and shouldFail is true
   */
  public async handleError(error: Error, context?: Record<string, any>): Promise<void> {
    this.handleErrorCalls.push({ error, context });
    return this.simulateOperation(() => {
      // Implementation would normally handle the error appropriately
      return undefined;
    });
  }
}

/**
 * Mock implementation of the console transport for testing
 */
export class MockConsoleTransport extends MockTransport {
  /**
   * Console-specific configuration
   */
  public consoleConfig: ConsoleTransportConfig | undefined;

  /**
   * Creates a new MockConsoleTransport instance
   * 
   * @param id Unique identifier for the transport
   * @param options Options for controlling the mock behavior
   */
  constructor(id: string = 'mock-console', options: MockTransportOptions = {}) {
    super(id, TransportType.CONSOLE, options);
  }

  /**
   * Initializes the console transport with the provided configuration
   * 
   * @param config Transport configuration
   * @returns Promise that resolves when initialization is complete
   * @throws Error if initialization fails and shouldFail is true
   */
  public async initialize(config: TransportConfig): Promise<void> {
    this.consoleConfig = config.console;
    return super.initialize(config);
  }
}

/**
 * Mock implementation of the file transport for testing
 */
export class MockFileTransport extends MockTransport {
  /**
   * File-specific configuration
   */
  public fileConfig: FileTransportConfig | undefined;

  /**
   * Creates a new MockFileTransport instance
   * 
   * @param id Unique identifier for the transport
   * @param options Options for controlling the mock behavior
   */
  constructor(id: string = 'mock-file', options: MockTransportOptions = {}) {
    super(id, TransportType.FILE, options);
  }

  /**
   * Initializes the file transport with the provided configuration
   * 
   * @param config Transport configuration
   * @returns Promise that resolves when initialization is complete
   * @throws Error if initialization fails and shouldFail is true
   */
  public async initialize(config: TransportConfig): Promise<void> {
    this.fileConfig = config.file;
    return super.initialize(config);
  }
}

/**
 * Mock implementation of the CloudWatch transport for testing
 */
export class MockCloudWatchTransport extends MockTransport {
  /**
   * CloudWatch-specific configuration
   */
  public cloudWatchConfig: CloudWatchTransportConfig | undefined;

  /**
   * Creates a new MockCloudWatchTransport instance
   * 
   * @param id Unique identifier for the transport
   * @param options Options for controlling the mock behavior
   */
  constructor(id: string = 'mock-cloudwatch', options: MockTransportOptions = {}) {
    super(id, TransportType.CLOUDWATCH, options);
  }

  /**
   * Initializes the CloudWatch transport with the provided configuration
   * 
   * @param config Transport configuration
   * @returns Promise that resolves when initialization is complete
   * @throws Error if initialization fails and shouldFail is true
   */
  public async initialize(config: TransportConfig): Promise<void> {
    this.cloudWatchConfig = config.cloudWatch;
    return super.initialize(config);
  }

  /**
   * Writes a batch of log entries to CloudWatch
   * Overrides the base implementation to handle CloudWatch-specific behavior
   * 
   * @param batch Batch of log entries to write
   * @returns Promise that resolves when all entries in the batch are written
   * @throws Error if the batch write operation fails and shouldFail is true
   */
  public async writeBatch(batch: LogBatch): Promise<void> {
    // CloudWatch has specific batch size limits, so we would normally
    // handle that here in a real implementation
    return super.writeBatch(batch);
  }
}

/**
 * Creates a mock transport factory for testing
 * 
 * @param type Transport type to create
 * @param options Options for controlling the mock behavior
 * @returns A new mock transport instance of the specified type
 */
export function createMockTransport(
  type: TransportType,
  options: MockTransportOptions = {}
): MockTransport {
  switch (type) {
    case TransportType.CONSOLE:
      return new MockConsoleTransport(`mock-console-${Date.now()}`, options);
    case TransportType.FILE:
      return new MockFileTransport(`mock-file-${Date.now()}`, options);
    case TransportType.CLOUDWATCH:
      return new MockCloudWatchTransport(`mock-cloudwatch-${Date.now()}`, options);
    default:
      return new MockTransport(`mock-${type}-${Date.now()}`, type, options);
  }
}