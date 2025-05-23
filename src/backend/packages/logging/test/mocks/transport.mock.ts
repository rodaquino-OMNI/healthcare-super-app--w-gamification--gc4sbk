/**
 * @file Transport Mock
 * @description Mock implementations of transport interfaces for testing logging components
 * that depend on transports. Provides configurable transports that track write calls and
 * can simulate success or failure.
 *
 * @module @austa/logging/test/mocks
 */

import { LogEntry, Transport, TransportConfig, WriteResult } from '../../src/interfaces';

/**
 * Configuration options for mock transports.
 * Extends the standard TransportConfig with additional options for testing.
 */
export interface MockTransportConfig extends TransportConfig {
  /**
   * Whether the transport should simulate a failure during write operations.
   * @default false
   */
  simulateWriteFailure?: boolean;

  /**
   * Whether the transport should simulate a failure during initialization.
   * @default false
   */
  simulateInitFailure?: boolean;

  /**
   * Whether the transport should simulate a failure during close.
   * @default false
   */
  simulateCloseFailure?: boolean;

  /**
   * Whether the transport should simulate a failure during flush.
   * @default false
   */
  simulateFlushFailure?: boolean;

  /**
   * Whether the transport should simulate an unhealthy state.
   * @default false
   */
  simulateUnhealthy?: boolean;

  /**
   * Delay in milliseconds to simulate for async operations.
   * @default 0
   */
  simulatedDelay?: number;
}

/**
 * Base mock transport implementation for testing.
 * Tracks calls to all methods and allows configuring success/failure scenarios.
 */
export class MockTransport implements Transport {
  /**
   * The name of the transport.
   */
  readonly name: string;

  /**
   * The configuration of the transport.
   */
  readonly config: MockTransportConfig;

  /**
   * Tracks calls to the initialize method.
   */
  initializeCalls: number = 0;

  /**
   * Tracks calls to the write method.
   */
  writeCalls: number = 0;

  /**
   * Tracks calls to the writeBatch method.
   */
  writeBatchCalls: number = 0;

  /**
   * Tracks calls to the flush method.
   */
  flushCalls: number = 0;

  /**
   * Tracks calls to the close method.
   */
  closeCalls: number = 0;

  /**
   * Tracks calls to the isHealthy method.
   */
  isHealthyCalls: number = 0;

  /**
   * Stores all log entries written to this transport.
   */
  writtenEntries: LogEntry[] = [];

  /**
   * Stores all batches of log entries written to this transport.
   */
  writtenBatches: LogEntry[][] = [];

  /**
   * Whether the transport has been initialized.
   */
  private _initialized: boolean = false;

  /**
   * Whether the transport has been closed.
   */
  private _closed: boolean = false;

  /**
   * Creates a new MockTransport instance.
   * 
   * @param config The configuration for the transport.
   */
  constructor(config: MockTransportConfig) {
    this.name = config.name;
    this.config = {
      ...config,
      simulateWriteFailure: config.simulateWriteFailure ?? false,
      simulateInitFailure: config.simulateInitFailure ?? false,
      simulateCloseFailure: config.simulateCloseFailure ?? false,
      simulateFlushFailure: config.simulateFlushFailure ?? false,
      simulateUnhealthy: config.simulateUnhealthy ?? false,
      simulatedDelay: config.simulatedDelay ?? 0
    };
  }

  /**
   * Initializes the transport.
   * Tracks calls and can simulate failures based on configuration.
   * 
   * @returns A promise that resolves when initialization is complete.
   * @throws If initialization fails or is configured to simulate failure.
   */
  async initialize(): Promise<void> {
    this.initializeCalls++;

    if (this.config.simulatedDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.simulatedDelay));
    }

    if (this.config.simulateInitFailure) {
      throw new Error(`Simulated initialization failure for transport: ${this.name}`);
    }

    this._initialized = true;
  }

  /**
   * Writes a single log entry to the transport.
   * Tracks calls and entries, and can simulate failures based on configuration.
   * 
   * @param entry The log entry to write.
   * @returns A promise that resolves with the result of the write operation.
   */
  async write(entry: LogEntry): Promise<WriteResult> {
    this.writeCalls++;
    this.writtenEntries.push({ ...entry });

    if (this.config.simulatedDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.simulatedDelay));
    }

    if (this.config.simulateWriteFailure) {
      const error = new Error(`Simulated write failure for transport: ${this.name}`);
      return {
        success: false,
        entriesWritten: 0,
        error
      };
    }

    return {
      success: true,
      entriesWritten: 1,
      metadata: { transportName: this.name }
    };
  }

  /**
   * Writes multiple log entries to the transport in a batch.
   * Tracks calls and entries, and can simulate failures based on configuration.
   * 
   * @param entries The log entries to write.
   * @returns A promise that resolves with the result of the batch write operation.
   */
  async writeBatch(entries: LogEntry[]): Promise<WriteResult> {
    this.writeBatchCalls++;
    this.writtenBatches.push([...entries]);
    entries.forEach(entry => this.writtenEntries.push({ ...entry }));

    if (this.config.simulatedDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.simulatedDelay));
    }

    if (this.config.simulateWriteFailure) {
      const error = new Error(`Simulated batch write failure for transport: ${this.name}`);
      return {
        success: false,
        entriesWritten: 0,
        error
      };
    }

    return {
      success: true,
      entriesWritten: entries.length,
      metadata: { transportName: this.name, batchSize: entries.length }
    };
  }

  /**
   * Flushes any buffered log entries to the transport destination.
   * Tracks calls and can simulate failures based on configuration.
   * 
   * @returns A promise that resolves when all buffered entries have been written.
   * @throws If flush fails or is configured to simulate failure.
   */
  async flush(): Promise<void> {
    this.flushCalls++;

    if (this.config.simulatedDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.simulatedDelay));
    }

    if (this.config.simulateFlushFailure) {
      throw new Error(`Simulated flush failure for transport: ${this.name}`);
    }
  }

  /**
   * Closes the transport, releasing any resources it holds.
   * Tracks calls and can simulate failures based on configuration.
   * 
   * @returns A promise that resolves when the transport has been closed.
   * @throws If close fails or is configured to simulate failure.
   */
  async close(): Promise<void> {
    this.closeCalls++;

    if (this.config.simulatedDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.simulatedDelay));
    }

    if (this.config.simulateCloseFailure) {
      throw new Error(`Simulated close failure for transport: ${this.name}`);
    }

    this._closed = true;
  }

  /**
   * Checks if the transport is healthy and able to write log entries.
   * Tracks calls and can simulate unhealthy state based on configuration.
   * 
   * @returns A promise that resolves with true if the transport is healthy, false otherwise.
   */
  async isHealthy(): Promise<boolean> {
    this.isHealthyCalls++;

    if (this.config.simulatedDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.simulatedDelay));
    }

    return !this.config.simulateUnhealthy && this._initialized && !this._closed;
  }

  /**
   * Resets all tracking counters and stored entries.
   * Useful for clearing state between tests.
   */
  reset(): void {
    this.initializeCalls = 0;
    this.writeCalls = 0;
    this.writeBatchCalls = 0;
    this.flushCalls = 0;
    this.closeCalls = 0;
    this.isHealthyCalls = 0;
    this.writtenEntries = [];
    this.writtenBatches = [];
    this._initialized = false;
    this._closed = false;
  }
}

/**
 * Mock implementation of a console transport for testing.
 * Extends the base MockTransport with console-specific behavior.
 */
export class MockConsoleTransport extends MockTransport {
  /**
   * Creates a new MockConsoleTransport instance.
   * 
   * @param config The configuration for the transport.
   */
  constructor(config: MockTransportConfig = { name: 'mock-console' }) {
    super({
      ...config,
      name: config.name || 'mock-console'
    });
  }
}

/**
 * Mock implementation of a file transport for testing.
 * Extends the base MockTransport with file-specific behavior.
 */
export class MockFileTransport extends MockTransport {
  /**
   * The simulated file path where logs would be written.
   */
  readonly filePath: string;

  /**
   * Creates a new MockFileTransport instance.
   * 
   * @param config The configuration for the transport.
   * @param filePath The simulated file path where logs would be written.
   */
  constructor(
    config: MockTransportConfig = { name: 'mock-file' },
    filePath: string = '/var/log/austa/mock.log'
  ) {
    super({
      ...config,
      name: config.name || 'mock-file'
    });
    this.filePath = filePath;
  }
}

/**
 * Mock implementation of a CloudWatch transport for testing.
 * Extends the base MockTransport with CloudWatch-specific behavior.
 */
export class MockCloudWatchTransport extends MockTransport {
  /**
   * The simulated CloudWatch log group.
   */
  readonly logGroup: string;

  /**
   * The simulated CloudWatch log stream.
   */
  readonly logStream: string;

  /**
   * Creates a new MockCloudWatchTransport instance.
   * 
   * @param config The configuration for the transport.
   * @param logGroup The simulated CloudWatch log group.
   * @param logStream The simulated CloudWatch log stream.
   */
  constructor(
    config: MockTransportConfig = { name: 'mock-cloudwatch' },
    logGroup: string = '/aws/austa/mock',
    logStream: string = 'mock-stream'
  ) {
    super({
      ...config,
      name: config.name || 'mock-cloudwatch'
    });
    this.logGroup = logGroup;
    this.logStream = logStream;
  }
}