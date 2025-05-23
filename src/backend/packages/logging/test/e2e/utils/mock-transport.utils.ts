/**
 * @file Mock Transport Utilities
 * @description Provides mock implementations of logging transports for testing purposes.
 * Includes in-memory, console, and mock CloudWatch transports that mimic the behavior of
 * real log transports but allow for inspection and verification in tests.
 *
 * @module @austa/logging/test/e2e/utils
 */

import { LogEntry, Transport, TransportConfig, WriteResult } from '../../../src/interfaces';

/**
 * Extended configuration for mock transports with testing-specific options.
 */
export interface MockTransportConfig extends TransportConfig {
  /**
   * Whether to simulate failures during write operations.
   * @default false
   */
  simulateFailures?: boolean;

  /**
   * Failure rate as a decimal between 0 and 1.
   * Only applicable if simulateFailures is true.
   * @default 0.1
   */
  failureRate?: number;

  /**
   * Delay in milliseconds to simulate transport latency.
   * @default 0
   */
  simulatedLatency?: number;

  /**
   * Whether to log entries to the actual console when using MockConsoleTransport.
   * @default false
   */
  logToConsole?: boolean;
}

/**
 * Base class for all mock transports that implements common functionality.
 */
export abstract class BaseMockTransport implements Transport {
  readonly name: string;
  readonly config: MockTransportConfig;
  protected initialized: boolean = false;
  protected closed: boolean = false;
  protected healthy: boolean = true;

  constructor(config: MockTransportConfig) {
    this.name = config.name;
    this.config = {
      ...config,
      simulateFailures: config.simulateFailures ?? false,
      failureRate: config.failureRate ?? 0.1,
      simulatedLatency: config.simulatedLatency ?? 0,
      logToConsole: config.logToConsole ?? false,
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    await this.simulateLatency();
    this.initialized = true;
    this.healthy = true;
  }

  abstract write(entry: LogEntry): Promise<WriteResult>;

  async writeBatch(entries: LogEntry[]): Promise<WriteResult> {
    await this.simulateLatency();
    
    if (!this.initialized) {
      throw new Error(`Transport ${this.name} is not initialized`);
    }
    
    if (this.closed) {
      throw new Error(`Transport ${this.name} is closed`);
    }

    if (this.shouldSimulateFailure()) {
      return {
        success: false,
        entriesWritten: 0,
        error: new Error(`Simulated batch write failure in ${this.name}`),
      };
    }

    let entriesWritten = 0;
    let lastError: Error | undefined;

    for (const entry of entries) {
      try {
        const result = await this.write(entry);
        if (result.success) {
          entriesWritten++;
        } else if (result.error) {
          lastError = result.error;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    return {
      success: entriesWritten === entries.length,
      entriesWritten,
      error: lastError,
    };
  }

  async flush(): Promise<void> {
    await this.simulateLatency();
    
    if (!this.initialized) {
      throw new Error(`Transport ${this.name} is not initialized`);
    }
    
    if (this.closed) {
      throw new Error(`Transport ${this.name} is closed`);
    }

    // Base implementation does nothing
  }

  async close(): Promise<void> {
    await this.simulateLatency();
    
    if (!this.initialized) {
      throw new Error(`Transport ${this.name} is not initialized`);
    }
    
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.healthy = false;
  }

  async isHealthy(): Promise<boolean> {
    await this.simulateLatency();
    return this.initialized && !this.closed && this.healthy;
  }

  /**
   * Sets the health status of the transport.
   * This is useful for simulating transport failures in tests.
   * 
   * @param healthy Whether the transport is healthy
   */
  setHealthy(healthy: boolean): void {
    this.healthy = healthy;
  }

  /**
   * Simulates a delay based on the configured latency.
   */
  protected async simulateLatency(): Promise<void> {
    if (this.config.simulatedLatency && this.config.simulatedLatency > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.simulatedLatency));
    }
  }

  /**
   * Determines whether a failure should be simulated based on configuration.
   */
  protected shouldSimulateFailure(): boolean {
    if (!this.config.simulateFailures) {
      return false;
    }

    return Math.random() < (this.config.failureRate ?? 0.1);
  }
}

/**
 * Mock in-memory transport that stores logs in memory for inspection.
 */
export class MockInMemoryTransport extends BaseMockTransport {
  private entries: LogEntry[] = [];

  constructor(config: MockTransportConfig) {
    super({
      name: config.name || 'mock-memory',
      ...config,
    });
  }

  async write(entry: LogEntry): Promise<WriteResult> {
    await this.simulateLatency();
    
    if (!this.initialized) {
      throw new Error(`Transport ${this.name} is not initialized`);
    }
    
    if (this.closed) {
      throw new Error(`Transport ${this.name} is closed`);
    }

    if (this.shouldSimulateFailure()) {
      return {
        success: false,
        entriesWritten: 0,
        error: new Error(`Simulated write failure in ${this.name}`),
      };
    }

    this.entries.push({ ...entry });

    return {
      success: true,
      entriesWritten: 1,
    };
  }

  /**
   * Gets all log entries stored in memory.
   */
  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Clears all stored log entries.
   */
  clearEntries(): void {
    this.entries = [];
  }

  /**
   * Gets log entries filtered by level.
   * 
   * @param level The log level to filter by
   */
  getEntriesByLevel(level: LogEntry['level']): LogEntry[] {
    return this.entries.filter(entry => entry.level === level);
  }

  /**
   * Gets log entries filtered by a custom predicate function.
   * 
   * @param predicate The filter function
   */
  getEntriesBy(predicate: (entry: LogEntry) => boolean): LogEntry[] {
    return this.entries.filter(predicate);
  }

  /**
   * Gets the count of log entries.
   */
  getEntryCount(): number {
    return this.entries.length;
  }

  /**
   * Gets the count of log entries filtered by level.
   * 
   * @param level The log level to filter by
   */
  getEntryCountByLevel(level: LogEntry['level']): number {
    return this.getEntriesByLevel(level).length;
  }
}

/**
 * Mock console transport that captures console output for verification.
 */
export class MockConsoleTransport extends BaseMockTransport {
  private outputs: Array<{ level: string; message: string; data?: any }> = [];
  private originalConsole: Record<string, any> = {};
  private isIntercepting: boolean = false;

  constructor(config: MockTransportConfig) {
    super({
      name: config.name || 'mock-console',
      ...config,
    });
  }

  async initialize(): Promise<void> {
    await super.initialize();
    
    if (this.isIntercepting) {
      return;
    }

    // Save original console methods
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    // Replace console methods with interceptors
    if (!this.config.logToConsole) {
      this.interceptConsoleMethods();
    }

    this.isIntercepting = true;
  }

  async write(entry: LogEntry): Promise<WriteResult> {
    await this.simulateLatency();
    
    if (!this.initialized) {
      throw new Error(`Transport ${this.name} is not initialized`);
    }
    
    if (this.closed) {
      throw new Error(`Transport ${this.name} is closed`);
    }

    if (this.shouldSimulateFailure()) {
      return {
        success: false,
        entriesWritten: 0,
        error: new Error(`Simulated write failure in ${this.name}`),
      };
    }

    const levelString = entry.level.toString().toLowerCase();
    const message = entry.message;
    const data = { ...entry };
    delete data.message;

    // Store the output
    this.outputs.push({ level: levelString, message, data });

    // Log to actual console if configured
    if (this.config.logToConsole) {
      const consoleMethod = this.getConsoleMethod(levelString);
      consoleMethod(message, data);
    }

    return {
      success: true,
      entriesWritten: 1,
    };
  }

  async close(): Promise<void> {
    await super.close();
    
    // Restore original console methods
    if (this.isIntercepting) {
      this.restoreConsoleMethods();
      this.isIntercepting = false;
    }
  }

  /**
   * Gets all captured console outputs.
   */
  getOutputs(): Array<{ level: string; message: string; data?: any }> {
    return [...this.outputs];
  }

  /**
   * Clears all captured console outputs.
   */
  clearOutputs(): void {
    this.outputs = [];
  }

  /**
   * Gets console outputs filtered by level.
   * 
   * @param level The log level to filter by
   */
  getOutputsByLevel(level: string): Array<{ level: string; message: string; data?: any }> {
    return this.outputs.filter(output => output.level === level.toLowerCase());
  }

  /**
   * Gets the count of console outputs.
   */
  getOutputCount(): number {
    return this.outputs.length;
  }

  /**
   * Intercepts console methods to capture output.
   */
  private interceptConsoleMethods(): void {
    console.log = (message: any, ...args: any[]) => {
      this.outputs.push({ level: 'log', message: String(message), data: args.length > 0 ? args : undefined });
    };

    console.info = (message: any, ...args: any[]) => {
      this.outputs.push({ level: 'info', message: String(message), data: args.length > 0 ? args : undefined });
    };

    console.warn = (message: any, ...args: any[]) => {
      this.outputs.push({ level: 'warn', message: String(message), data: args.length > 0 ? args : undefined });
    };

    console.error = (message: any, ...args: any[]) => {
      this.outputs.push({ level: 'error', message: String(message), data: args.length > 0 ? args : undefined });
    };

    console.debug = (message: any, ...args: any[]) => {
      this.outputs.push({ level: 'debug', message: String(message), data: args.length > 0 ? args : undefined });
    };
  }

  /**
   * Restores original console methods.
   */
  private restoreConsoleMethods(): void {
    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;
  }

  /**
   * Gets the appropriate console method for a log level.
   * 
   * @param level The log level
   */
  private getConsoleMethod(level: string): (...args: any[]) => void {
    switch (level.toLowerCase()) {
      case 'debug': return this.originalConsole.debug;
      case 'info': return this.originalConsole.info;
      case 'warn': return this.originalConsole.warn;
      case 'error': case 'fatal': return this.originalConsole.error;
      default: return this.originalConsole.log;
    }
  }
}

/**
 * Mock CloudWatch transport that simulates AWS CloudWatch Logs transport.
 */
export class MockCloudWatchTransport extends BaseMockTransport {
  private logGroups: Map<string, Array<{ timestamp: Date; message: string; data: any }>> = new Map();
  private defaultLogGroup: string;
  private defaultLogStream: string;

  constructor(config: MockTransportConfig & {
    defaultLogGroup?: string;
    defaultLogStream?: string;
  }) {
    super({
      name: config.name || 'mock-cloudwatch',
      ...config,
    });

    this.defaultLogGroup = config.defaultLogGroup || '/austa/logs';
    this.defaultLogStream = config.defaultLogStream || 'application';
    
    // Initialize the default log group and stream
    this.logGroups.set(this.getLogStreamKey(this.defaultLogGroup, this.defaultLogStream), []);
  }

  async write(entry: LogEntry): Promise<WriteResult> {
    await this.simulateLatency();
    
    if (!this.initialized) {
      throw new Error(`Transport ${this.name} is not initialized`);
    }
    
    if (this.closed) {
      throw new Error(`Transport ${this.name} is closed`);
    }

    if (this.shouldSimulateFailure()) {
      return {
        success: false,
        entriesWritten: 0,
        error: new Error(`Simulated write failure in ${this.name}`),
      };
    }

    // Determine log group and stream based on entry
    const logGroup = this.getLogGroupForEntry(entry);
    const logStream = this.getLogStreamForEntry(entry);
    const logStreamKey = this.getLogStreamKey(logGroup, logStream);

    // Ensure log stream exists
    if (!this.logGroups.has(logStreamKey)) {
      this.logGroups.set(logStreamKey, []);
    }

    // Format the log entry as CloudWatch would
    const formattedEntry = {
      timestamp: entry.timestamp,
      message: entry.message,
      data: { ...entry },
    };

    // Store the log entry
    this.logGroups.get(logStreamKey)!.push(formattedEntry);

    return {
      success: true,
      entriesWritten: 1,
      metadata: {
        logGroup,
        logStream,
      },
    };
  }

  /**
   * Gets all log entries from a specific log group and stream.
   * 
   * @param logGroup The log group name
   * @param logStream The log stream name
   */
  getLogEntries(logGroup: string = this.defaultLogGroup, logStream: string = this.defaultLogStream): Array<{ timestamp: Date; message: string; data: any }> {
    const logStreamKey = this.getLogStreamKey(logGroup, logStream);
    return this.logGroups.has(logStreamKey) ? [...this.logGroups.get(logStreamKey)!] : [];
  }

  /**
   * Gets all log groups.
   */
  getLogGroups(): string[] {
    const groups = new Set<string>();
    for (const key of this.logGroups.keys()) {
      groups.add(key.split(':')[0]);
    }
    return Array.from(groups);
  }

  /**
   * Gets all log streams for a specific log group.
   * 
   * @param logGroup The log group name
   */
  getLogStreams(logGroup: string = this.defaultLogGroup): string[] {
    const streams = new Set<string>();
    for (const key of this.logGroups.keys()) {
      const [group, stream] = key.split(':');
      if (group === logGroup) {
        streams.add(stream);
      }
    }
    return Array.from(streams);
  }

  /**
   * Clears all log entries from a specific log group and stream.
   * 
   * @param logGroup The log group name
   * @param logStream The log stream name
   */
  clearLogEntries(logGroup: string = this.defaultLogGroup, logStream: string = this.defaultLogStream): void {
    const logStreamKey = this.getLogStreamKey(logGroup, logStream);
    if (this.logGroups.has(logStreamKey)) {
      this.logGroups.set(logStreamKey, []);
    }
  }

  /**
   * Clears all log entries from all log groups and streams.
   */
  clearAllLogEntries(): void {
    for (const key of this.logGroups.keys()) {
      this.logGroups.set(key, []);
    }
  }

  /**
   * Gets the count of log entries in a specific log group and stream.
   * 
   * @param logGroup The log group name
   * @param logStream The log stream name
   */
  getLogEntryCount(logGroup: string = this.defaultLogGroup, logStream: string = this.defaultLogStream): number {
    const logStreamKey = this.getLogStreamKey(logGroup, logStream);
    return this.logGroups.has(logStreamKey) ? this.logGroups.get(logStreamKey)!.length : 0;
  }

  /**
   * Gets the total count of log entries across all log groups and streams.
   */
  getTotalLogEntryCount(): number {
    let count = 0;
    for (const entries of this.logGroups.values()) {
      count += entries.length;
    }
    return count;
  }

  /**
   * Creates a key for identifying a log stream within a log group.
   * 
   * @param logGroup The log group name
   * @param logStream The log stream name
   */
  private getLogStreamKey(logGroup: string, logStream: string): string {
    return `${logGroup}:${logStream}`;
  }

  /**
   * Determines the appropriate log group for a log entry based on its content.
   * 
   * @param entry The log entry
   */
  private getLogGroupForEntry(entry: LogEntry): string {
    // Use journey-specific log groups if available
    if (entry.journey?.type) {
      return `/austa/${entry.journey.type}`;
    }

    // Use service-specific log group if available
    if (entry.serviceName) {
      return `/austa/${entry.serviceName}`;
    }

    return this.defaultLogGroup;
  }

  /**
   * Determines the appropriate log stream for a log entry based on its content.
   * 
   * @param entry The log entry
   */
  private getLogStreamForEntry(entry: LogEntry): string {
    // Use error logs for error and fatal levels
    if (entry.level >= 3) { // ERROR or FATAL
      return 'errors';
    }

    // Use request ID as log stream if available
    if (entry.requestId) {
      return `request-${entry.requestId}`;
    }

    // Use user ID as log stream if available
    if (entry.userId) {
      return `user-${entry.userId}`;
    }

    return this.defaultLogStream;
  }
}

/**
 * Utility functions for testing with mock transports.
 */
export const MockTransportUtils = {
  /**
   * Creates a mock in-memory transport with default configuration.
   * 
   * @param name Optional name for the transport
   */
  createInMemoryTransport(name: string = 'test-memory'): MockInMemoryTransport {
    return new MockInMemoryTransport({ name });
  },

  /**
   * Creates a mock console transport with default configuration.
   * 
   * @param name Optional name for the transport
   * @param logToConsole Whether to log to the actual console
   */
  createConsoleTransport(name: string = 'test-console', logToConsole: boolean = false): MockConsoleTransport {
    return new MockConsoleTransport({ name, logToConsole });
  },

  /**
   * Creates a mock CloudWatch transport with default configuration.
   * 
   * @param name Optional name for the transport
   * @param defaultLogGroup Optional default log group
   * @param defaultLogStream Optional default log stream
   */
  createCloudWatchTransport(
    name: string = 'test-cloudwatch',
    defaultLogGroup: string = '/austa/test',
    defaultLogStream: string = 'test'
  ): MockCloudWatchTransport {
    return new MockCloudWatchTransport({ name, defaultLogGroup, defaultLogStream });
  },

  /**
   * Creates a transport that will simulate failures.
   * 
   * @param baseTransport The base transport to wrap
   * @param failureRate The rate of failures (0-1)
   */
  createFailingTransport<T extends BaseMockTransport>(baseTransport: T, failureRate: number = 0.5): T {
    baseTransport.config.simulateFailures = true;
    baseTransport.config.failureRate = failureRate;
    return baseTransport;
  },

  /**
   * Creates a transport with simulated latency.
   * 
   * @param baseTransport The base transport to wrap
   * @param latencyMs The latency in milliseconds
   */
  createSlowTransport<T extends BaseMockTransport>(baseTransport: T, latencyMs: number = 100): T {
    baseTransport.config.simulatedLatency = latencyMs;
    return baseTransport;
  },

  /**
   * Asserts that a transport has received a specific number of log entries.
   * 
   * @param transport The transport to check
   * @param count The expected number of entries
   * @param message Optional assertion message
   */
  assertEntryCount(transport: MockInMemoryTransport, count: number, message?: string): void {
    const actualCount = transport.getEntryCount();
    if (actualCount !== count) {
      throw new Error(message || `Expected ${count} log entries, but got ${actualCount}`);
    }
  },

  /**
   * Asserts that a transport has received a specific number of log entries at a specific level.
   * 
   * @param transport The transport to check
   * @param level The log level
   * @param count The expected number of entries
   * @param message Optional assertion message
   */
  assertEntryCountByLevel(transport: MockInMemoryTransport, level: LogEntry['level'], count: number, message?: string): void {
    const actualCount = transport.getEntryCountByLevel(level);
    if (actualCount !== count) {
      throw new Error(message || `Expected ${count} log entries at level ${level}, but got ${actualCount}`);
    }
  },

  /**
   * Asserts that a transport has received a log entry matching a predicate.
   * 
   * @param transport The transport to check
   * @param predicate The predicate function
   * @param message Optional assertion message
   */
  assertEntryExists(transport: MockInMemoryTransport, predicate: (entry: LogEntry) => boolean, message?: string): void {
    const entries = transport.getEntriesBy(predicate);
    if (entries.length === 0) {
      throw new Error(message || 'Expected to find a matching log entry, but none was found');
    }
  },

  /**
   * Asserts that a transport has not received any log entry matching a predicate.
   * 
   * @param transport The transport to check
   * @param predicate The predicate function
   * @param message Optional assertion message
   */
  assertEntryNotExists(transport: MockInMemoryTransport, predicate: (entry: LogEntry) => boolean, message?: string): void {
    const entries = transport.getEntriesBy(predicate);
    if (entries.length > 0) {
      throw new Error(message || `Expected not to find a matching log entry, but found ${entries.length}`);
    }
  },

  /**
   * Asserts that a CloudWatch transport has received logs in a specific log group.
   * 
   * @param transport The transport to check
   * @param logGroup The log group name
   * @param message Optional assertion message
   */
  assertLogGroupExists(transport: MockCloudWatchTransport, logGroup: string, message?: string): void {
    const groups = transport.getLogGroups();
    if (!groups.includes(logGroup)) {
      throw new Error(message || `Expected log group ${logGroup} to exist, but it was not found`);
    }
  },

  /**
   * Asserts that a CloudWatch transport has received a specific number of log entries in a log group and stream.
   * 
   * @param transport The transport to check
   * @param logGroup The log group name
   * @param logStream The log stream name
   * @param count The expected number of entries
   * @param message Optional assertion message
   */
  assertCloudWatchEntryCount(
    transport: MockCloudWatchTransport,
    logGroup: string,
    logStream: string,
    count: number,
    message?: string
  ): void {
    const actualCount = transport.getLogEntryCount(logGroup, logStream);
    if (actualCount !== count) {
      throw new Error(
        message || `Expected ${count} log entries in ${logGroup}:${logStream}, but got ${actualCount}`
      );
    }
  },
};