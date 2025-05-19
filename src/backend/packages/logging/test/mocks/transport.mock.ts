import { LogEntry, LogLevel } from '../../src/interfaces/log-entry.interface';
import {
  BatchWriteOptions,
  Transport,
  TransportStatus,
  TransportWriteResult,
} from '../../src/interfaces/transport.interface';

/**
 * Configuration options for the MockTransport
 */
export interface MockTransportConfig {
  /**
   * Name of the transport
   * @default 'mock-transport'
   */
  name?: string;

  /**
   * Minimum log level this transport will process
   * @default LogLevel.DEBUG
   */
  level?: LogLevel;

  /**
   * Whether the transport should simulate an error during initialization
   * @default false
   */
  failInitialization?: boolean;

  /**
   * Whether the transport should simulate an error during write operations
   * @default false
   */
  failWrite?: boolean;

  /**
   * Whether the transport should simulate an error during close operations
   * @default false
   */
  failClose?: boolean;

  /**
   * Whether the transport should simulate a retryable error during write operations
   * @default false
   */
  simulateRetryableError?: boolean;

  /**
   * Delay in milliseconds to simulate async operations
   * @default 0
   */
  operationDelay?: number;
}

/**
 * Mock implementation of the Transport interface for testing purposes.
 * Provides configurable behavior and tracking of method calls.
 */
export class MockTransport implements Transport {
  /**
   * Name of the transport for identification
   */
  readonly name: string;

  /**
   * Current status of the transport
   */
  private _isInitialized = false;

  /**
   * Minimum log level this transport will process
   */
  readonly level: LogLevel;

  /**
   * Configuration options for this mock transport
   */
  private readonly config: MockTransportConfig;

  /**
   * Tracks all log entries written to this transport
   */
  public readonly writtenEntries: LogEntry[] = [];

  /**
   * Tracks all batch write operations
   */
  public readonly batchWrites: { entries: LogEntry[]; options?: BatchWriteOptions }[] = [];

  /**
   * Tracks all method calls for testing purposes
   */
  public readonly calls = {
    initialize: 0,
    write: 0,
    writeBatch: 0,
    isLevelEnabled: 0,
    flush: 0,
    close: 0,
  };

  /**
   * Creates a new MockTransport instance
   * @param config Configuration options for the mock transport
   */
  constructor(config: MockTransportConfig = {}) {
    this.config = {
      name: 'mock-transport',
      level: LogLevel.DEBUG,
      failInitialization: false,
      failWrite: false,
      failClose: false,
      simulateRetryableError: false,
      operationDelay: 0,
      ...config,
    };

    this.name = this.config.name!;
    this.level = this.config.level!;
  }

  /**
   * Gets the initialization status of the transport
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Resets all tracking data for this mock transport
   */
  public reset(): void {
    this.writtenEntries.length = 0;
    this.batchWrites.length = 0;
    this.calls.initialize = 0;
    this.calls.write = 0;
    this.calls.writeBatch = 0;
    this.calls.isLevelEnabled = 0;
    this.calls.flush = 0;
    this.calls.close = 0;
    this._isInitialized = false;
  }

  /**
   * Initialize the transport with any necessary setup
   * @returns Promise that resolves when initialization is complete
   * @throws Error if initialization fails
   */
  async initialize(): Promise<void> {
    this.calls.initialize++;

    if (this.config.operationDelay) {
      await new Promise((resolve) => setTimeout(resolve, this.config.operationDelay));
    }

    if (this.config.failInitialization) {
      throw new Error(`Failed to initialize ${this.name} transport`);
    }

    this._isInitialized = true;
  }

  /**
   * Write a single log entry to the transport destination
   * @param entry The log entry to write
   * @returns Promise that resolves with the result of the write operation
   */
  async write(entry: LogEntry): Promise<TransportWriteResult> {
    this.calls.write++;

    if (!this._isInitialized) {
      return {
        status: TransportStatus.PERMANENT_ERROR,
        error: new Error(`Transport ${this.name} is not initialized`),
      };
    }

    if (this.config.operationDelay) {
      await new Promise((resolve) => setTimeout(resolve, this.config.operationDelay));
    }

    if (this.config.failWrite) {
      return {
        status: TransportStatus.PERMANENT_ERROR,
        error: new Error(`Failed to write to ${this.name} transport`),
      };
    }

    if (this.config.simulateRetryableError) {
      return {
        status: TransportStatus.RETRYABLE_ERROR,
        error: new Error(`Retryable error in ${this.name} transport`),
      };
    }

    this.writtenEntries.push(entry);

    return {
      status: TransportStatus.SUCCESS,
      entriesWritten: 1,
      metadata: { transportName: this.name },
    };
  }

  /**
   * Write multiple log entries in a batch for better performance
   * @param entries Array of log entries to write
   * @param options Optional configuration for batch writing
   * @returns Promise that resolves with the result of the batch write operation
   */
  async writeBatch(entries: LogEntry[], options?: BatchWriteOptions): Promise<TransportWriteResult> {
    this.calls.writeBatch++;
    this.batchWrites.push({ entries, options });

    if (!this._isInitialized) {
      return {
        status: TransportStatus.PERMANENT_ERROR,
        error: new Error(`Transport ${this.name} is not initialized`),
      };
    }

    if (this.config.operationDelay) {
      await new Promise((resolve) => setTimeout(resolve, this.config.operationDelay));
    }

    if (this.config.failWrite) {
      return {
        status: TransportStatus.PERMANENT_ERROR,
        error: new Error(`Failed to batch write to ${this.name} transport`),
      };
    }

    if (this.config.simulateRetryableError) {
      return {
        status: TransportStatus.RETRYABLE_ERROR,
        error: new Error(`Retryable error in ${this.name} transport batch write`),
      };
    }

    // Add all entries to the written entries array
    this.writtenEntries.push(...entries);

    return {
      status: TransportStatus.SUCCESS,
      entriesWritten: entries.length,
      metadata: { transportName: this.name, batchSize: entries.length },
    };
  }

  /**
   * Check if this transport will accept a log entry based on its level
   * @param level The log level to check
   * @returns True if the transport will accept entries at this level
   */
  isLevelEnabled(level: LogLevel): boolean {
    this.calls.isLevelEnabled++;
    return level >= this.level;
  }

  /**
   * Flush any buffered log entries to ensure they are written
   * @returns Promise that resolves when all buffered entries are written
   */
  async flush(): Promise<void> {
    this.calls.flush++;

    if (this.config.operationDelay) {
      await new Promise((resolve) => setTimeout(resolve, this.config.operationDelay));
    }

    // No actual implementation needed for mock
  }

  /**
   * Close the transport and release any resources
   * @returns Promise that resolves when the transport is closed
   */
  async close(): Promise<void> {
    this.calls.close++;

    if (this.config.operationDelay) {
      await new Promise((resolve) => setTimeout(resolve, this.config.operationDelay));
    }

    if (this.config.failClose) {
      throw new Error(`Failed to close ${this.name} transport`);
    }

    this._isInitialized = false;
  }
}

/**
 * Mock implementation of a console transport for testing purposes
 */
export class MockConsoleTransport extends MockTransport {
  constructor(config: MockTransportConfig = {}) {
    super({
      name: 'mock-console-transport',
      ...config,
    });
  }
}

/**
 * Mock implementation of a file transport for testing purposes
 */
export class MockFileTransport extends MockTransport {
  /**
   * The file path this transport writes to
   */
  readonly filePath: string;

  constructor(filePath: string, config: MockTransportConfig = {}) {
    super({
      name: 'mock-file-transport',
      ...config,
    });
    this.filePath = filePath;
  }
}

/**
 * Mock implementation of a CloudWatch transport for testing purposes
 */
export class MockCloudWatchTransport extends MockTransport {
  /**
   * The log group this transport writes to
   */
  readonly logGroup: string;

  /**
   * The log stream this transport writes to
   */
  readonly logStream: string;

  constructor(logGroup: string, logStream: string, config: MockTransportConfig = {}) {
    super({
      name: 'mock-cloudwatch-transport',
      ...config,
    });
    this.logGroup = logGroup;
    this.logStream = logStream;
  }
}

/**
 * Creates a mock transport factory for testing purposes
 * @param defaultConfig Default configuration for created transports
 * @returns A factory function that creates mock transports
 */
export function createMockTransportFactory(defaultConfig: MockTransportConfig = {}) {
  return (config: MockTransportConfig = {}): MockTransport => {
    return new MockTransport({
      ...defaultConfig,
      ...config,
    });
  };
}