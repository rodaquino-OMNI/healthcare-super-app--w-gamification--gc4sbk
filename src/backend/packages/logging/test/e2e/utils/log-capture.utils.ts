import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { LogEntry } from '../../../src/interfaces/log-entry.interface';
import * as fs from 'fs';
import * as path from 'path';
import { Transport } from '../../../src/interfaces/transport.interface';

/**
 * Interface for log capture options
 */
export interface LogCaptureOptions {
  /** Whether to capture logs in memory */
  inMemory?: boolean;
  /** Whether to capture logs to a file */
  toFile?: boolean;
  /** Path to the file where logs should be stored (if toFile is true) */
  filePath?: string;
  /** Minimum log level to capture */
  minLevel?: LogLevel;
  /** Maximum number of logs to keep in memory */
  maxLogs?: number;
  /** Whether to capture logs across service boundaries */
  crossService?: boolean;
}

/**
 * Default options for log capture
 */
const DEFAULT_OPTIONS: LogCaptureOptions = {
  inMemory: true,
  toFile: false,
  filePath: './test-logs.json',
  minLevel: LogLevel.DEBUG,
  maxLogs: 1000,
  crossService: false,
};

/**
 * Interface for log filtering options
 */
export interface LogFilterOptions {
  /** Filter logs by level */
  level?: LogLevel;
  /** Filter logs by message content (substring match) */
  message?: string;
  /** Filter logs by context properties */
  context?: Record<string, any>;
  /** Filter logs by journey */
  journey?: string;
  /** Filter logs by trace ID */
  traceId?: string;
  /** Filter logs by user ID */
  userId?: string;
  /** Filter logs by request ID */
  requestId?: string;
  /** Filter logs by service name */
  service?: string;
  /** Filter logs by timestamp range */
  timeRange?: {
    start?: Date;
    end?: Date;
  };
}

/**
 * A transport implementation that captures logs for testing purposes
 */
export class LogCaptureTransport implements Transport {
  private logs: LogEntry[] = [];
  private options: LogCaptureOptions;
  private fileStream: fs.WriteStream | null = null;

  /**
   * Creates a new LogCaptureTransport
   * @param options Options for log capture
   */
  constructor(options: LogCaptureOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    if (this.options.toFile && this.options.filePath) {
      const dir = path.dirname(this.options.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.fileStream = fs.createWriteStream(this.options.filePath, { flags: 'w' });
      this.fileStream.write('[\n');
    }
  }

  /**
   * Writes a log entry to the capture storage
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    // Skip logs below the minimum level
    if (entry.level < this.options.minLevel!) {
      return;
    }

    // Store in memory if enabled
    if (this.options.inMemory) {
      this.logs.push(entry);
      
      // Trim logs if we exceed the maximum
      if (this.logs.length > this.options.maxLogs!) {
        this.logs = this.logs.slice(this.logs.length - this.options.maxLogs!);
      }
    }

    // Write to file if enabled
    if (this.options.toFile && this.fileStream) {
      const needsComma = this.logs.length > 1;
      this.fileStream.write(`${needsComma ? ',' : ''}\n${JSON.stringify(entry, null, 2)}`);
    }
  }

  /**
   * Closes the transport and cleans up resources
   */
  async close(): Promise<void> {
    if (this.fileStream) {
      this.fileStream.write('\n]');
      this.fileStream.end();
      this.fileStream = null;
    }
  }

  /**
   * Gets all captured logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clears all captured logs
   */
  clearLogs(): void {
    this.logs = [];
    
    // Reset file if enabled
    if (this.options.toFile && this.options.filePath) {
      if (this.fileStream) {
        this.fileStream.end();
      }
      this.fileStream = fs.createWriteStream(this.options.filePath, { flags: 'w' });
      this.fileStream.write('[\n');
    }
  }

  /**
   * Filters logs based on the provided options
   * @param options Filter options
   */
  filterLogs(options: LogFilterOptions): LogEntry[] {
    return this.logs.filter(log => {
      // Filter by level
      if (options.level !== undefined && log.level !== options.level) {
        return false;
      }

      // Filter by message
      if (options.message && !log.message.includes(options.message)) {
        return false;
      }

      // Filter by context properties
      if (options.context) {
        for (const [key, value] of Object.entries(options.context)) {
          if (!log.context || log.context[key] !== value) {
            return false;
          }
        }
      }

      // Filter by journey
      if (options.journey && (!log.context || log.context.journey !== options.journey)) {
        return false;
      }

      // Filter by trace ID
      if (options.traceId && (!log.context || log.context.traceId !== options.traceId)) {
        return false;
      }

      // Filter by user ID
      if (options.userId && (!log.context || log.context.userId !== options.userId)) {
        return false;
      }

      // Filter by request ID
      if (options.requestId && (!log.context || log.context.requestId !== options.requestId)) {
        return false;
      }

      // Filter by service name
      if (options.service && (!log.context || log.context.service !== options.service)) {
        return false;
      }

      // Filter by time range
      if (options.timeRange) {
        const logTime = new Date(log.timestamp);
        if (options.timeRange.start && logTime < options.timeRange.start) {
          return false;
        }
        if (options.timeRange.end && logTime > options.timeRange.end) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Checks if any log matches the provided filter options
   * @param options Filter options
   */
  hasLog(options: LogFilterOptions): boolean {
    return this.filterLogs(options).length > 0;
  }

  /**
   * Gets the count of logs matching the provided filter options
   * @param options Filter options
   */
  getLogCount(options: LogFilterOptions): number {
    return this.filterLogs(options).length;
  }

  /**
   * Gets the first log matching the provided filter options
   * @param options Filter options
   */
  getFirstLog(options: LogFilterOptions): LogEntry | undefined {
    const filtered = this.filterLogs(options);
    return filtered.length > 0 ? filtered[0] : undefined;
  }

  /**
   * Gets the last log matching the provided filter options
   * @param options Filter options
   */
  getLastLog(options: LogFilterOptions): LogEntry | undefined {
    const filtered = this.filterLogs(options);
    return filtered.length > 0 ? filtered[filtered.length - 1] : undefined;
  }
}

/**
 * Singleton instance of the LogCaptureTransport for global access
 */
let globalLogCapture: LogCaptureTransport | null = null;

/**
 * Creates and initializes a global log capture transport
 * @param options Options for log capture
 */
export function initializeLogCapture(options: LogCaptureOptions = {}): LogCaptureTransport {
  if (globalLogCapture) {
    globalLogCapture.clearLogs();
  } else {
    globalLogCapture = new LogCaptureTransport(options);
  }
  return globalLogCapture;
}

/**
 * Gets the global log capture transport instance
 * If not initialized, it will be created with default options
 */
export function getLogCapture(): LogCaptureTransport {
  if (!globalLogCapture) {
    globalLogCapture = new LogCaptureTransport();
  }
  return globalLogCapture;
}

/**
 * Clears all captured logs from the global log capture transport
 */
export function clearCapturedLogs(): void {
  if (globalLogCapture) {
    globalLogCapture.clearLogs();
  }
}

/**
 * Closes the global log capture transport and cleans up resources
 */
export function closeLogCapture(): Promise<void> {
  if (globalLogCapture) {
    const promise = globalLogCapture.close();
    globalLogCapture = null;
    return promise;
  }
  return Promise.resolve();
}

/**
 * Utility for validating structured log content
 */
export class LogValidator {
  private logs: LogEntry[];

  /**
   * Creates a new LogValidator
   * @param logs Logs to validate
   */
  constructor(logs: LogEntry[]) {
    this.logs = logs;
  }

  /**
   * Checks if all logs have the required fields
   */
  hasRequiredFields(): boolean {
    return this.logs.every(log => {
      return (
        typeof log.message === 'string' &&
        typeof log.level === 'number' &&
        typeof log.timestamp === 'string' &&
        log.context !== undefined
      );
    });
  }

  /**
   * Checks if all logs have the specified journey context
   * @param journey Journey name to check for
   */
  hasJourneyContext(journey: string): boolean {
    return this.logs.every(log => {
      return log.context && log.context.journey === journey;
    });
  }

  /**
   * Checks if all logs have trace correlation IDs
   */
  hasTraceCorrelation(): boolean {
    return this.logs.every(log => {
      return log.context && typeof log.context.traceId === 'string';
    });
  }

  /**
   * Checks if all logs have the specified level or higher
   * @param level Minimum log level
   */
  hasMinimumLevel(level: LogLevel): boolean {
    return this.logs.every(log => log.level >= level);
  }

  /**
   * Checks if any log contains an error with a stack trace
   */
  hasErrorWithStackTrace(): boolean {
    return this.logs.some(log => {
      return (
        log.level === LogLevel.ERROR &&
        log.error &&
        typeof log.error.stack === 'string'
      );
    });
  }

  /**
   * Checks if logs contain a specific sequence of messages in order
   * @param messages Array of messages to check for in sequence
   */
  containsSequence(messages: string[]): boolean {
    if (messages.length === 0 || this.logs.length < messages.length) {
      return false;
    }

    // Try to find the sequence starting at each possible position
    for (let i = 0; i <= this.logs.length - messages.length; i++) {
      let found = true;
      for (let j = 0; j < messages.length; j++) {
        if (!this.logs[i + j].message.includes(messages[j])) {
          found = false;
          break;
        }
      }
      if (found) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if logs contain specific context properties across service boundaries
   * @param contextKey Context property key to check for
   * @param contextValue Context property value to check for
   */
  maintainsContextAcrossServices(contextKey: string, contextValue: any): boolean {
    // Group logs by service
    const serviceGroups: Record<string, LogEntry[]> = {};
    
    for (const log of this.logs) {
      if (log.context && log.context.service) {
        const service = log.context.service;
        if (!serviceGroups[service]) {
          serviceGroups[service] = [];
        }
        serviceGroups[service].push(log);
      }
    }

    // Check if each service group has the context property
    return Object.values(serviceGroups).every(serviceLogs => {
      return serviceLogs.some(log => {
        return log.context && log.context[contextKey] === contextValue;
      });
    });
  }
}

/**
 * Creates a LogValidator for the logs in the global log capture
 */
export function validateCapturedLogs(): LogValidator {
  const capture = getLogCapture();
  return new LogValidator(capture.getLogs());
}

/**
 * Creates a LogValidator for logs matching the filter options
 * @param options Filter options
 */
export function validateFilteredLogs(options: LogFilterOptions): LogValidator {
  const capture = getLogCapture();
  return new LogValidator(capture.filterLogs(options));
}

/**
 * Utility for capturing logs from a specific function execution
 * @param fn Function to execute and capture logs from
 * @param options Log capture options
 */
export async function captureLogsFromFunction<T>(
  fn: () => Promise<T> | T,
  options: LogCaptureOptions = {}
): Promise<{ result: T; logs: LogEntry[] }> {
  const capture = initializeLogCapture(options);
  capture.clearLogs();
  
  try {
    const result = await fn();
    return { result, logs: capture.getLogs() };
  } finally {
    // Don't clear logs here to allow for inspection after the function completes
  }
}

/**
 * Utility for capturing logs from a specific test case
 * Designed to be used in beforeEach/afterEach hooks
 */
export class TestLogCapture {
  private capture: LogCaptureTransport;
  private testName: string = '';
  
  /**
   * Creates a new TestLogCapture
   * @param options Log capture options
   */
  constructor(options: LogCaptureOptions = {}) {
    // If file capture is enabled but no path is specified, use a default path based on the test name
    if (options.toFile && !options.filePath) {
      options.filePath = `./test-logs/${this.testName || 'unknown-test'}.json`;
    }
    
    this.capture = new LogCaptureTransport(options);
  }

  /**
   * Sets up log capture for a test case
   * @param testName Name of the test case
   */
  setup(testName: string): void {
    this.testName = testName;
    this.capture.clearLogs();
  }

  /**
   * Tears down log capture after a test case
   */
  async teardown(): Promise<void> {
    await this.capture.close();
  }

  /**
   * Gets all captured logs
   */
  getLogs(): LogEntry[] {
    return this.capture.getLogs();
  }

  /**
   * Filters logs based on the provided options
   * @param options Filter options
   */
  filterLogs(options: LogFilterOptions): LogEntry[] {
    return this.capture.filterLogs(options);
  }

  /**
   * Creates a LogValidator for the captured logs
   */
  validate(): LogValidator {
    return new LogValidator(this.capture.getLogs());
  }

  /**
   * Creates a LogValidator for logs matching the filter options
   * @param options Filter options
   */
  validateFiltered(options: LogFilterOptions): LogValidator {
    return new LogValidator(this.capture.filterLogs(options));
  }
}