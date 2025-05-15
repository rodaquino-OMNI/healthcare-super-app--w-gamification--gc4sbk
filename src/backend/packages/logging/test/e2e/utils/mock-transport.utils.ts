/**
 * Mock Transport Utilities
 * 
 * This file provides mock implementations of logging transports for testing purposes.
 * These mocks implement the Transport interface but store logs in memory for inspection
 * rather than writing to actual destinations.
 */

import { Transport } from '../../../src/interfaces/transport.interface';
import { LogEntry } from '../../../src/interfaces/log-entry.interface';
import { LogLevel } from '../../../src/interfaces/log-level.enum';

/**
 * Base mock transport that stores logs in memory for inspection
 */
export class BaseMockTransport implements Transport {
  public logs: LogEntry[] = [];
  public initialized = false;
  public closed = false;
  public failOnWrite = false;
  public failOnInit = false;
  public failOnClose = false;
  
  constructor(public readonly name: string = 'mock-transport') {}

  /**
   * Initialize the transport
   */
  async initialize(): Promise<void> {
    if (this.failOnInit) {
      throw new Error(`Failed to initialize ${this.name} transport`);
    }
    this.initialized = true;
  }

  /**
   * Write a log entry to the transport
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    if (this.failOnWrite) {
      throw new Error(`Failed to write to ${this.name} transport`);
    }
    this.logs.push({ ...entry });
  }

  /**
   * Write multiple log entries to the transport
   * @param entries The log entries to write
   */
  async writeBatch(entries: LogEntry[]): Promise<void> {
    if (this.failOnWrite) {
      throw new Error(`Failed to write batch to ${this.name} transport`);
    }
    entries.forEach(entry => this.logs.push({ ...entry }));
  }

  /**
   * Close the transport
   */
  async close(): Promise<void> {
    if (this.failOnClose) {
      throw new Error(`Failed to close ${this.name} transport`);
    }
    this.closed = true;
  }

  /**
   * Clear all stored logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Get logs filtered by level
   * @param level The log level to filter by
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs filtered by a custom predicate
   * @param predicate The filter function
   */
  getLogsByPredicate(predicate: (log: LogEntry) => boolean): LogEntry[] {
    return this.logs.filter(predicate);
  }

  /**
   * Get logs containing a specific message substring
   * @param messageSubstring The substring to search for
   */
  getLogsByMessageSubstring(messageSubstring: string): LogEntry[] {
    return this.logs.filter(log => 
      typeof log.message === 'string' && log.message.includes(messageSubstring)
    );
  }

  /**
   * Get logs with a specific context property value
   * @param key The context property key
   * @param value The context property value
   */
  getLogsByContextProperty(key: string, value: any): LogEntry[] {
    return this.logs.filter(log => 
      log.context && log.context[key] === value
    );
  }
}

/**
 * Mock console transport that simulates writing to the console
 */
export class MockConsoleTransport extends BaseMockTransport {
  public consoleOutput: string[] = [];
  
  constructor() {
    super('console');
  }

  /**
   * Override write to simulate console output
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    await super.write(entry);
    const formattedMessage = this.formatConsoleMessage(entry);
    this.consoleOutput.push(formattedMessage);
  }

  /**
   * Format a log entry for console output
   * @param entry The log entry to format
   */
  private formatConsoleMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toString();
    const context = entry.context ? ` [${JSON.stringify(entry.context)}]` : '';
    return `${timestamp} ${level}${context}: ${entry.message}`;
  }

  /**
   * Clear console output
   */
  clear(): void {
    super.clear();
    this.consoleOutput = [];
  }
}

/**
 * Mock file transport that simulates writing to a file
 */
export class MockFileTransport extends BaseMockTransport {
  public filePath: string;
  public fileContents: string[] = [];
  
  constructor(filePath: string = 'logs/app.log') {
    super('file');
    this.filePath = filePath;
  }

  /**
   * Override write to simulate file output
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    await super.write(entry);
    const formattedMessage = JSON.stringify(entry);
    this.fileContents.push(formattedMessage);
  }

  /**
   * Clear file contents
   */
  clear(): void {
    super.clear();
    this.fileContents = [];
  }
}

/**
 * Mock CloudWatch transport that simulates sending logs to AWS CloudWatch
 */
export class MockCloudWatchTransport extends BaseMockTransport {
  public logGroupName: string;
  public logStreamName: string;
  public batchedLogs: LogEntry[][] = [];
  public currentBatch: LogEntry[] = [];
  public batchSize: number;
  public sequenceToken: string = '49590302983';
  
  constructor({
    logGroupName = '/austa/superapp/logs',
    logStreamName = 'application',
    batchSize = 10
  } = {}) {
    super('cloudwatch');
    this.logGroupName = logGroupName;
    this.logStreamName = logStreamName;
    this.batchSize = batchSize;
  }

  /**
   * Override initialize to simulate CloudWatch setup
   */
  async initialize(): Promise<void> {
    await super.initialize();
    // Simulate creating log group and stream if they don't exist
    this.sequenceToken = '49590302983';
  }

  /**
   * Override write to simulate CloudWatch behavior
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    await super.write(entry);
    
    // Add to current batch
    this.currentBatch.push({ ...entry });
    
    // If batch is full, flush it
    if (this.currentBatch.length >= this.batchSize) {
      await this.flushBatch();
    }
  }

  /**
   * Override writeBatch to simulate CloudWatch batch behavior
   * @param entries The log entries to write
   */
  async writeBatch(entries: LogEntry[]): Promise<void> {
    await super.writeBatch(entries);
    
    // Add all entries to current batch
    this.currentBatch.push(...entries.map(entry => ({ ...entry })));
    
    // If batch is full, flush it
    if (this.currentBatch.length >= this.batchSize) {
      await this.flushBatch();
    }
  }

  /**
   * Simulate flushing a batch of logs to CloudWatch
   */
  async flushBatch(): Promise<void> {
    if (this.currentBatch.length === 0) {
      return;
    }
    
    if (this.failOnWrite) {
      throw new Error(`Failed to flush batch to CloudWatch`);
    }
    
    // Store the batch and update sequence token
    this.batchedLogs.push([...this.currentBatch]);
    this.sequenceToken = Math.random().toString(36).substring(2, 15);
    
    // Clear current batch
    this.currentBatch = [];
  }

  /**
   * Override close to flush any remaining logs
   */
  async close(): Promise<void> {
    // Flush any remaining logs
    await this.flushBatch();
    await super.close();
  }

  /**
   * Clear all logs and batches
   */
  clear(): void {
    super.clear();
    this.batchedLogs = [];
    this.currentBatch = [];
  }

  /**
   * Get all logs that have been flushed to CloudWatch
   */
  getFlushedLogs(): LogEntry[] {
    return this.batchedLogs.flat();
  }
}

/**
 * Utility functions for testing with mock transports
 */

/**
 * Create a set of mock transports for testing
 */
export function createMockTransports() {
  return {
    console: new MockConsoleTransport(),
    file: new MockFileTransport(),
    cloudwatch: new MockCloudWatchTransport()
  };
}

/**
 * Assert that a log with the given properties exists in the transport
 * @param transport The mock transport to check
 * @param level The expected log level
 * @param messageSubstring The expected message substring
 * @param context Optional context properties to match
 */
export function assertLogExists(
  transport: BaseMockTransport,
  level: LogLevel,
  messageSubstring: string,
  context?: Record<string, any>
): void {
  const levelLogs = transport.getLogsByLevel(level);
  const matchingLogs = levelLogs.filter(log => 
    typeof log.message === 'string' && log.message.includes(messageSubstring)
  );
  
  if (matchingLogs.length === 0) {
    throw new Error(
      `Expected to find log with level ${level} and message containing "${messageSubstring}", but none was found`
    );
  }
  
  if (context) {
    const contextMatches = matchingLogs.some(log => {
      if (!log.context) return false;
      
      return Object.entries(context).every(([key, value]) => 
        log.context[key] === value
      );
    });
    
    if (!contextMatches) {
      throw new Error(
        `Found log with level ${level} and message containing "${messageSubstring}", but context did not match expected properties`
      );
    }
  }
}

/**
 * Wait for a specific log to appear in the transport
 * @param transport The mock transport to check
 * @param level The expected log level
 * @param messageSubstring The expected message substring
 * @param timeout Maximum time to wait in milliseconds
 * @param interval Check interval in milliseconds
 */
export async function waitForLog(
  transport: BaseMockTransport,
  level: LogLevel,
  messageSubstring: string,
  timeout: number = 5000,
  interval: number = 100
): Promise<LogEntry | null> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const logs = transport.getLogsByLevel(level);
    const matchingLog = logs.find(log => 
      typeof log.message === 'string' && log.message.includes(messageSubstring)
    );
    
    if (matchingLog) {
      return matchingLog;
    }
    
    // Wait for the next interval
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return null;
}

/**
 * Count logs matching specific criteria
 * @param transport The mock transport to check
 * @param level Optional log level to filter by
 * @param messageSubstring Optional message substring to filter by
 * @param contextPredicate Optional function to filter by context
 */
export function countMatchingLogs(
  transport: BaseMockTransport,
  level?: LogLevel,
  messageSubstring?: string,
  contextPredicate?: (context: any) => boolean
): number {
  let logs = transport.logs;
  
  if (level !== undefined) {
    logs = logs.filter(log => log.level === level);
  }
  
  if (messageSubstring !== undefined) {
    logs = logs.filter(log => 
      typeof log.message === 'string' && log.message.includes(messageSubstring)
    );
  }
  
  if (contextPredicate !== undefined) {
    logs = logs.filter(log => 
      log.context && contextPredicate(log.context)
    );
  }
  
  return logs.length;
}