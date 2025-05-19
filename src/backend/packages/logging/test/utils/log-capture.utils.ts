/**
 * Log Capture Utilities for Testing
 * 
 * This file provides utilities for capturing log output during tests through memory buffers,
 * stream interception, and transport hooks. These utilities enable verification of log content,
 * format, and structure without requiring actual log files or external services.
 */

import { EventEmitter } from 'events';
import { Writable, Readable } from 'stream';
import { LogEntry, LogLevel, JourneyType } from '../../src/interfaces/log-entry.interface';
import { LogLevelUtils } from '../../src/interfaces/log-level.enum';
import { MockWinstonTransport, MockWritableStream } from './mocks';

/**
 * Interface for log capture options
 */
export interface LogCaptureOptions {
  /** Whether to capture console output (stdout/stderr) */
  captureConsole?: boolean;
  /** Whether to capture logs at all levels or only at the specified minimum level */
  captureAllLevels?: boolean;
  /** The minimum log level to capture if captureAllLevels is false */
  minLevel?: LogLevel;
  /** Whether to parse logs as JSON */
  parseJson?: boolean;
  /** Whether to include timestamps in captured logs */
  includeTimestamps?: boolean;
  /** Journey type to filter logs by */
  journeyFilter?: JourneyType;
  /** Custom filter function for logs */
  customFilter?: (log: LogEntry) => boolean;
}

/**
 * Default options for log capture
 */
const DEFAULT_CAPTURE_OPTIONS: LogCaptureOptions = {
  captureConsole: true,
  captureAllLevels: true,
  minLevel: LogLevel.INFO,
  parseJson: true,
  includeTimestamps: true,
};

/**
 * In-memory log capture mechanism for tests
 * Captures logs emitted by the logger and provides methods to analyze them
 */
export class LogCapture extends EventEmitter {
  private logs: LogEntry[] = [];
  private originalStdout: NodeJS.WriteStream | null = null;
  private originalStderr: NodeJS.WriteStream | null = null;
  private mockStdout: MockWritableStream | null = null;
  private mockStderr: MockWritableStream | null = null;
  private transport: MockWinstonTransport | null = null;
  private options: LogCaptureOptions;
  private active: boolean = false;

  /**
   * Creates a new LogCapture instance
   * @param options Configuration options for log capture
   */
  constructor(options: LogCaptureOptions = {}) {
    super();
    this.options = { ...DEFAULT_CAPTURE_OPTIONS, ...options };
    this.transport = new MockWinstonTransport();
  }

  /**
   * Starts capturing logs
   * @returns The LogCapture instance for chaining
   */
  start(): LogCapture {
    if (this.active) {
      return this;
    }

    this.active = true;
    this.logs = [];

    // Set up transport capture
    this.transport = new MockWinstonTransport();
    this.transport.on('logged', (log: LogEntry) => this.processLog(log));

    // Set up console capture if enabled
    if (this.options.captureConsole) {
      this.startConsoleCapture();
    }

    this.emit('started');
    return this;
  }

  /**
   * Stops capturing logs and restores original streams
   * @returns The LogCapture instance for chaining
   */
  stop(): LogCapture {
    if (!this.active) {
      return this;
    }

    this.active = false;

    // Restore console streams if they were captured
    if (this.options.captureConsole) {
      this.stopConsoleCapture();
    }

    this.emit('stopped', this.logs);
    return this;
  }

  /**
   * Clears all captured logs
   * @returns The LogCapture instance for chaining
   */
  clear(): LogCapture {
    this.logs = [];
    if (this.transport) {
      this.transport.clear();
    }
    if (this.mockStdout) {
      this.mockStdout.clearContents();
    }
    if (this.mockStderr) {
      this.mockStderr.clearContents();
    }
    this.emit('cleared');
    return this;
  }

  /**
   * Gets all captured logs
   * @returns Array of captured log entries
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Gets the transport used for capturing logs
   * @returns The mock Winston transport
   */
  getTransport(): MockWinstonTransport | null {
    return this.transport;
  }

  /**
   * Gets logs filtered by level
   * @param level The log level to filter by
   * @returns Array of log entries with the specified level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Gets logs filtered by journey type
   * @param journeyType The journey type to filter by
   * @returns Array of log entries with the specified journey type
   */
  getLogsByJourney(journeyType: JourneyType): LogEntry[] {
    return this.logs.filter(log => log.journey === journeyType);
  }

  /**
   * Gets logs containing a specific message substring
   * @param substring The substring to search for in log messages
   * @returns Array of log entries containing the substring
   */
  getLogsByMessageSubstring(substring: string): LogEntry[] {
    return this.logs.filter(log => 
      log.message && log.message.includes(substring)
    );
  }

  /**
   * Gets logs with a specific context property value
   * @param key The context property key
   * @param value The context property value
   * @returns Array of log entries with the specified context property value
   */
  getLogsByContextProperty(key: string, value: any): LogEntry[] {
    return this.logs.filter(log => 
      log.context && 
      log.context[key] !== undefined && 
      log.context[key] === value
    );
  }

  /**
   * Gets logs with a specific request ID
   * @param requestId The request ID to filter by
   * @returns Array of log entries with the specified request ID
   */
  getLogsByRequestId(requestId: string): LogEntry[] {
    return this.logs.filter(log => log.requestId === requestId);
  }

  /**
   * Gets logs with a specific user ID
   * @param userId The user ID to filter by
   * @returns Array of log entries with the specified user ID
   */
  getLogsByUserId(userId: string): LogEntry[] {
    return this.logs.filter(log => log.userId === userId);
  }

  /**
   * Gets logs with a specific trace ID
   * @param traceId The trace ID to filter by
   * @returns Array of log entries with the specified trace ID
   */
  getLogsByTraceId(traceId: string): LogEntry[] {
    return this.logs.filter(log => log.traceId === traceId);
  }

  /**
   * Gets logs with a specific correlation ID
   * @param correlationId The correlation ID to filter by
   * @returns Array of log entries with the specified correlation ID
   */
  getLogsByCorrelationId(correlationId: string): LogEntry[] {
    return this.logs.filter(log => log.correlationId === correlationId);
  }

  /**
   * Gets logs with error information
   * @returns Array of log entries containing error information
   */
  getErrorLogs(): LogEntry[] {
    return this.logs.filter(log => log.error !== undefined && log.error !== null);
  }

  /**
   * Gets logs with a specific error name
   * @param errorName The error name to filter by
   * @returns Array of log entries with the specified error name
   */
  getLogsByErrorName(errorName: string): LogEntry[] {
    return this.logs.filter(log => 
      log.error && 
      log.error.name === errorName
    );
  }

  /**
   * Gets logs with a specific error code
   * @param errorCode The error code to filter by
   * @returns Array of log entries with the specified error code
   */
  getLogsByErrorCode(errorCode: string | number): LogEntry[] {
    return this.logs.filter(log => 
      log.error && 
      log.error.code === errorCode
    );
  }

  /**
   * Gets logs within a specific time range
   * @param startTime The start time of the range
   * @param endTime The end time of the range
   * @returns Array of log entries within the specified time range
   */
  getLogsByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
    return this.logs.filter(log => {
      const logTime = log.timestamp instanceof Date 
        ? log.timestamp 
        : new Date(log.timestamp);
      
      return logTime >= startTime && logTime <= endTime;
    });
  }

  /**
   * Gets logs matching a custom filter function
   * @param filterFn The filter function to apply
   * @returns Array of log entries matching the filter function
   */
  getLogsByCustomFilter(filterFn: (log: LogEntry) => boolean): LogEntry[] {
    return this.logs.filter(filterFn);
  }

  /**
   * Gets the count of logs by level
   * @returns Object with counts for each log level
   */
  getLogCountByLevel(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const log of this.logs) {
      const levelName = LogLevelUtils.toString(log.level);
      counts[levelName] = (counts[levelName] || 0) + 1;
    }
    
    return counts;
  }

  /**
   * Gets the count of logs by journey type
   * @returns Object with counts for each journey type
   */
  getLogCountByJourney(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const log of this.logs) {
      if (log.journey) {
        const journeyName = JourneyType[log.journey];
        counts[journeyName] = (counts[journeyName] || 0) + 1;
      }
    }
    
    return counts;
  }

  /**
   * Checks if any logs match a specific condition
   * @param condition The condition function to check
   * @returns True if any logs match the condition, false otherwise
   */
  hasLogsMatching(condition: (log: LogEntry) => boolean): boolean {
    return this.logs.some(condition);
  }

  /**
   * Checks if any logs contain a specific message substring
   * @param substring The substring to search for in log messages
   * @returns True if any logs contain the substring, false otherwise
   */
  hasLogsWithMessage(substring: string): boolean {
    return this.hasLogsMatching(log => 
      log.message && log.message.includes(substring)
    );
  }

  /**
   * Checks if any logs have a specific level
   * @param level The log level to check for
   * @returns True if any logs have the specified level, false otherwise
   */
  hasLogsWithLevel(level: LogLevel): boolean {
    return this.hasLogsMatching(log => log.level === level);
  }

  /**
   * Checks if any logs have a specific journey type
   * @param journeyType The journey type to check for
   * @returns True if any logs have the specified journey type, false otherwise
   */
  hasLogsWithJourney(journeyType: JourneyType): boolean {
    return this.hasLogsMatching(log => log.journey === journeyType);
  }

  /**
   * Checks if any logs have a specific error name
   * @param errorName The error name to check for
   * @returns True if any logs have the specified error name, false otherwise
   */
  hasLogsWithErrorName(errorName: string): boolean {
    return this.hasLogsMatching(log => 
      log.error && log.error.name === errorName
    );
  }

  /**
   * Processes a log entry and adds it to the captured logs if it passes filters
   * @param log The log entry to process
   * @private
   */
  private processLog(log: LogEntry): void {
    // Apply level filter if not capturing all levels
    if (!this.options.captureAllLevels && 
        this.options.minLevel !== undefined && 
        log.level < this.options.minLevel) {
      return;
    }

    // Apply journey filter if specified
    if (this.options.journeyFilter !== undefined && 
        log.journey !== this.options.journeyFilter) {
      return;
    }

    // Apply custom filter if specified
    if (this.options.customFilter && !this.options.customFilter(log)) {
      return;
    }

    // Add the log to the captured logs
    this.logs.push(log);
    this.emit('log', log);
  }

  /**
   * Starts capturing console output (stdout/stderr)
   * @private
   */
  private startConsoleCapture(): void {
    // Save original streams
    this.originalStdout = process.stdout;
    this.originalStderr = process.stderr;

    // Create mock streams
    this.mockStdout = new MockWritableStream();
    this.mockStderr = new MockWritableStream();

    // Replace stdout and stderr with mock streams
    // @ts-ignore - TypeScript doesn't like this reassignment, but it works for testing
    process.stdout = this.mockStdout;
    // @ts-ignore - TypeScript doesn't like this reassignment, but it works for testing
    process.stderr = this.mockStderr;
  }

  /**
   * Stops capturing console output and restores original streams
   * @private
   */
  private stopConsoleCapture(): void {
    if (this.originalStdout && this.originalStderr) {
      // Restore original streams
      // @ts-ignore - TypeScript doesn't like this reassignment, but it works for testing
      process.stdout = this.originalStdout;
      // @ts-ignore - TypeScript doesn't like this reassignment, but it works for testing
      process.stderr = this.originalStderr;

      // Clear references
      this.originalStdout = null;
      this.originalStderr = null;
    }
  }
}

/**
 * Creates a log capture instance with the specified options
 * @param options Configuration options for log capture
 * @returns A new LogCapture instance
 */
export function createLogCapture(options: LogCaptureOptions = {}): LogCapture {
  return new LogCapture(options);
}

/**
 * Captures logs during the execution of a function
 * @param fn The function to execute while capturing logs
 * @param options Configuration options for log capture
 * @returns Promise resolving to the captured logs
 */
export async function captureLogsAsync<T>(
  fn: () => Promise<T>,
  options: LogCaptureOptions = {}
): Promise<{ result: T; logs: LogEntry[] }> {
  const logCapture = createLogCapture(options).start();
  
  try {
    const result = await fn();
    return { result, logs: logCapture.getLogs() };
  } finally {
    logCapture.stop();
  }
}

/**
 * Captures logs during the synchronous execution of a function
 * @param fn The function to execute while capturing logs
 * @param options Configuration options for log capture
 * @returns Object containing the function result and captured logs
 */
export function captureLogs<T>(
  fn: () => T,
  options: LogCaptureOptions = {}
): { result: T; logs: LogEntry[] } {
  const logCapture = createLogCapture(options).start();
  
  try {
    const result = fn();
    return { result, logs: logCapture.getLogs() };
  } finally {
    logCapture.stop();
  }
}

/**
 * Parses a log string (e.g., from console output) into a structured log entry
 * @param logString The log string to parse
 * @returns The parsed log entry or null if parsing failed
 */
export function parseLogString(logString: string): LogEntry | null {
  if (!logString) {
    return null;
  }

  try {
    // Try parsing as JSON first
    return JSON.parse(logString) as LogEntry;
  } catch (e) {
    // If not JSON, try parsing as a formatted log string
    try {
      return parseFormattedLogString(logString);
    } catch (e) {
      return null;
    }
  }
}

/**
 * Parses a formatted log string (non-JSON) into a structured log entry
 * @param logString The formatted log string to parse
 * @returns The parsed log entry
 * @private
 */
function parseFormattedLogString(logString: string): LogEntry {
  // Example format: "2023-04-01T12:34:56.789Z [INFO] (requestId) - Message"
  const timestampRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/;
  const levelRegex = /\[(DEBUG|INFO|WARN|ERROR|FATAL)\]/;
  const requestIdRegex = /\(([a-f0-9-]+)\)/;
  
  // Extract timestamp
  const timestampMatch = logString.match(timestampRegex);
  const timestamp = timestampMatch ? new Date(timestampMatch[1]) : new Date();
  
  // Extract level
  const levelMatch = logString.match(levelRegex);
  const levelStr = levelMatch ? levelMatch[1] : 'INFO';
  const level = LogLevelUtils.fromString(levelStr);
  
  // Extract requestId
  const requestIdMatch = logString.match(requestIdRegex);
  const requestId = requestIdMatch ? requestIdMatch[1] : undefined;
  
  // Extract message (everything after the last dash and space)
  const messageParts = logString.split(' - ');
  const message = messageParts.length > 1 ? messageParts.slice(1).join(' - ') : logString;
  
  return {
    timestamp,
    level,
    message,
    requestId,
    service: 'unknown',
  };
}

/**
 * Intercepts stdout/stderr streams and captures output
 */
export class StreamInterceptor {
  private originalStdout: NodeJS.WriteStream;
  private originalStderr: NodeJS.WriteStream;
  private stdoutChunks: string[] = [];
  private stderrChunks: string[] = [];
  private active: boolean = false;

  /**
   * Starts intercepting stdout and stderr
   * @returns The StreamInterceptor instance for chaining
   */
  start(): StreamInterceptor {
    if (this.active) {
      return this;
    }

    this.active = true;
    this.stdoutChunks = [];
    this.stderrChunks = [];

    // Save original streams
    this.originalStdout = process.stdout;
    this.originalStderr = process.stderr;

    // Create write interceptors
    const self = this;
    
    // @ts-ignore - TypeScript doesn't like this reassignment, but it works for testing
    process.stdout = new Writable({
      write(chunk, encoding, callback) {
        self.stdoutChunks.push(chunk.toString());
        self.originalStdout.write(chunk, encoding, callback);
      }
    });
    
    // @ts-ignore - TypeScript doesn't like this reassignment, but it works for testing
    process.stderr = new Writable({
      write(chunk, encoding, callback) {
        self.stderrChunks.push(chunk.toString());
        self.originalStderr.write(chunk, encoding, callback);
      }
    });

    return this;
  }

  /**
   * Stops intercepting stdout and stderr and restores original streams
   * @returns The StreamInterceptor instance for chaining
   */
  stop(): StreamInterceptor {
    if (!this.active) {
      return this;
    }

    this.active = false;

    // Restore original streams
    // @ts-ignore - TypeScript doesn't like this reassignment, but it works for testing
    process.stdout = this.originalStdout;
    // @ts-ignore - TypeScript doesn't like this reassignment, but it works for testing
    process.stderr = this.originalStderr;

    return this;
  }

  /**
   * Gets all captured stdout output
   * @returns The captured stdout output as a string
   */
  getStdout(): string {
    return this.stdoutChunks.join('');
  }

  /**
   * Gets all captured stderr output
   * @returns The captured stderr output as a string
   */
  getStderr(): string {
    return this.stderrChunks.join('');
  }

  /**
   * Gets all captured output (stdout and stderr combined)
   * @returns The captured output as a string
   */
  getOutput(): string {
    return this.getStdout() + this.getStderr();
  }

  /**
   * Clears all captured output
   * @returns The StreamInterceptor instance for chaining
   */
  clear(): StreamInterceptor {
    this.stdoutChunks = [];
    this.stderrChunks = [];
    return this;
  }

  /**
   * Parses captured stdout as log entries
   * @returns Array of parsed log entries
   */
  parseStdoutLogs(): LogEntry[] {
    return this.parseLogLines(this.getStdout());
  }

  /**
   * Parses captured stderr as log entries
   * @returns Array of parsed log entries
   */
  parseStderrLogs(): LogEntry[] {
    return this.parseLogLines(this.getStderr());
  }

  /**
   * Parses all captured output as log entries
   * @returns Array of parsed log entries
   */
  parseAllLogs(): LogEntry[] {
    return this.parseLogLines(this.getOutput());
  }

  /**
   * Parses log lines into structured log entries
   * @param output The output string containing log lines
   * @returns Array of parsed log entries
   * @private
   */
  private parseLogLines(output: string): LogEntry[] {
    if (!output) {
      return [];
    }

    const lines = output.split('\n').filter(line => line.trim());
    const logs: LogEntry[] = [];

    for (const line of lines) {
      const log = parseLogString(line);
      if (log) {
        logs.push(log);
      }
    }

    return logs;
  }
}

/**
 * Creates a stream interceptor instance
 * @returns A new StreamInterceptor instance
 */
export function createStreamInterceptor(): StreamInterceptor {
  return new StreamInterceptor();
}

/**
 * Intercepts stdout/stderr during the execution of a function
 * @param fn The function to execute while intercepting streams
 * @returns Object containing the function result and captured output
 */
export function interceptStreams<T>(
  fn: () => T
): { result: T; stdout: string; stderr: string } {
  const interceptor = createStreamInterceptor().start();
  
  try {
    const result = fn();
    return {
      result,
      stdout: interceptor.getStdout(),
      stderr: interceptor.getStderr()
    };
  } finally {
    interceptor.stop();
  }
}

/**
 * Intercepts stdout/stderr during the asynchronous execution of a function
 * @param fn The function to execute while intercepting streams
 * @returns Promise resolving to the function result and captured output
 */
export async function interceptStreamsAsync<T>(
  fn: () => Promise<T>
): Promise<{ result: T; stdout: string; stderr: string }> {
  const interceptor = createStreamInterceptor().start();
  
  try {
    const result = await fn();
    return {
      result,
      stdout: interceptor.getStdout(),
      stderr: interceptor.getStderr()
    };
  } finally {
    interceptor.stop();
  }
}

/**
 * Analyzes a collection of log entries and provides statistics and insights
 */
export class LogAnalyzer {
  private logs: LogEntry[];

  /**
   * Creates a new LogAnalyzer instance
   * @param logs The log entries to analyze
   */
  constructor(logs: LogEntry[]) {
    this.logs = logs;
  }

  /**
   * Gets the count of logs by level
   * @returns Object with counts for each log level
   */
  getLogCountByLevel(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const log of this.logs) {
      const levelName = LogLevelUtils.toString(log.level);
      counts[levelName] = (counts[levelName] || 0) + 1;
    }
    
    return counts;
  }

  /**
   * Gets the count of logs by journey type
   * @returns Object with counts for each journey type
   */
  getLogCountByJourney(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const log of this.logs) {
      if (log.journey) {
        const journeyName = JourneyType[log.journey];
        counts[journeyName] = (counts[journeyName] || 0) + 1;
      }
    }
    
    return counts;
  }

  /**
   * Gets the count of logs by service
   * @returns Object with counts for each service
   */
  getLogCountByService(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const log of this.logs) {
      if (log.service) {
        counts[log.service] = (counts[log.service] || 0) + 1;
      }
    }
    
    return counts;
  }

  /**
   * Gets the count of logs by error name
   * @returns Object with counts for each error name
   */
  getLogCountByErrorName(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const log of this.logs) {
      if (log.error && log.error.name) {
        counts[log.error.name] = (counts[log.error.name] || 0) + 1;
      }
    }
    
    return counts;
  }

  /**
   * Gets the count of logs by error code
   * @returns Object with counts for each error code
   */
  getLogCountByErrorCode(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const log of this.logs) {
      if (log.error && log.error.code) {
        const code = String(log.error.code);
        counts[code] = (counts[code] || 0) + 1;
      }
    }
    
    return counts;
  }

  /**
   * Gets the count of logs by time period
   * @param periodMinutes The period in minutes (default: 1 minute)
   * @returns Object with counts for each time period
   */
  getLogCountByTimePeriod(periodMinutes: number = 1): Record<string, number> {
    const counts: Record<string, number> = {};
    const periodMs = periodMinutes * 60 * 1000;
    
    for (const log of this.logs) {
      const timestamp = log.timestamp instanceof Date 
        ? log.timestamp 
        : new Date(log.timestamp);
      
      // Round to the nearest period
      const periodTimestamp = new Date(
        Math.floor(timestamp.getTime() / periodMs) * periodMs
      );
      
      const key = periodTimestamp.toISOString();
      counts[key] = (counts[key] || 0) + 1;
    }
    
    return counts;
  }

  /**
   * Gets the most frequent log messages
   * @param limit The maximum number of messages to return (default: 10)
   * @returns Array of objects with message and count
   */
  getMostFrequentMessages(limit: number = 10): Array<{ message: string; count: number }> {
    const messageCounts: Record<string, number> = {};
    
    for (const log of this.logs) {
      if (log.message) {
        messageCounts[log.message] = (messageCounts[log.message] || 0) + 1;
      }
    }
    
    return Object.entries(messageCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Gets the most frequent error messages
   * @param limit The maximum number of errors to return (default: 10)
   * @returns Array of objects with error message and count
   */
  getMostFrequentErrors(limit: number = 10): Array<{ message: string; count: number }> {
    const errorCounts: Record<string, number> = {};
    
    for (const log of this.logs) {
      if (log.error && log.error.message) {
        errorCounts[log.error.message] = (errorCounts[log.error.message] || 0) + 1;
      }
    }
    
    return Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Gets the time range of the logs
   * @returns Object with start and end times
   */
  getTimeRange(): { start: Date; end: Date } {
    if (this.logs.length === 0) {
      return { start: new Date(), end: new Date() };
    }
    
    let start: Date = new Date();
    let end: Date = new Date(0); // January 1, 1970
    
    for (const log of this.logs) {
      const timestamp = log.timestamp instanceof Date 
        ? log.timestamp 
        : new Date(log.timestamp);
      
      if (timestamp < start) {
        start = timestamp;
      }
      
      if (timestamp > end) {
        end = timestamp;
      }
    }
    
    return { start, end };
  }

  /**
   * Gets the log rate (logs per second) over the time range
   * @returns The log rate in logs per second
   */
  getLogRate(): number {
    if (this.logs.length <= 1) {
      return 0;
    }
    
    const { start, end } = this.getTimeRange();
    const durationSeconds = (end.getTime() - start.getTime()) / 1000;
    
    if (durationSeconds <= 0) {
      return 0;
    }
    
    return this.logs.length / durationSeconds;
  }

  /**
   * Gets the error rate (percentage of logs that are errors)
   * @returns The error rate as a percentage
   */
  getErrorRate(): number {
    if (this.logs.length === 0) {
      return 0;
    }
    
    const errorCount = this.logs.filter(log => 
      log.level === LogLevel.ERROR || log.level === LogLevel.FATAL
    ).length;
    
    return (errorCount / this.logs.length) * 100;
  }

  /**
   * Gets the journey distribution (percentage of logs for each journey)
   * @returns Object with journey names and percentages
   */
  getJourneyDistribution(): Record<string, number> {
    if (this.logs.length === 0) {
      return {};
    }
    
    const journeyCounts = this.getLogCountByJourney();
    const distribution: Record<string, number> = {};
    
    for (const [journey, count] of Object.entries(journeyCounts)) {
      distribution[journey] = (count / this.logs.length) * 100;
    }
    
    return distribution;
  }

  /**
   * Gets the level distribution (percentage of logs for each level)
   * @returns Object with level names and percentages
   */
  getLevelDistribution(): Record<string, number> {
    if (this.logs.length === 0) {
      return {};
    }
    
    const levelCounts = this.getLogCountByLevel();
    const distribution: Record<string, number> = {};
    
    for (const [level, count] of Object.entries(levelCounts)) {
      distribution[level] = (count / this.logs.length) * 100;
    }
    
    return distribution;
  }

  /**
   * Gets a summary of the log analysis
   * @returns Object with summary statistics
   */
  getSummary(): Record<string, any> {
    const { start, end } = this.getTimeRange();
    
    return {
      totalLogs: this.logs.length,
      timeRange: { start, end },
      duration: (end.getTime() - start.getTime()) / 1000, // in seconds
      logRate: this.getLogRate(),
      errorRate: this.getErrorRate(),
      levelDistribution: this.getLevelDistribution(),
      journeyDistribution: this.getJourneyDistribution(),
      mostFrequentMessages: this.getMostFrequentMessages(5),
      mostFrequentErrors: this.getMostFrequentErrors(5),
    };
  }
}

/**
 * Creates a log analyzer for the specified logs
 * @param logs The log entries to analyze
 * @returns A new LogAnalyzer instance
 */
export function createLogAnalyzer(logs: LogEntry[]): LogAnalyzer {
  return new LogAnalyzer(logs);
}

/**
 * Analyzes logs captured during the execution of a function
 * @param fn The function to execute while capturing logs
 * @param options Configuration options for log capture
 * @returns Object containing the function result and log analysis
 */
export function analyzeLogsFromFunction<T>(
  fn: () => T,
  options: LogCaptureOptions = {}
): { result: T; analysis: Record<string, any> } {
  const { result, logs } = captureLogs(fn, options);
  const analyzer = createLogAnalyzer(logs);
  
  return {
    result,
    analysis: analyzer.getSummary()
  };
}

/**
 * Analyzes logs captured during the asynchronous execution of a function
 * @param fn The function to execute while capturing logs
 * @param options Configuration options for log capture
 * @returns Promise resolving to the function result and log analysis
 */
export async function analyzeLogsFromFunctionAsync<T>(
  fn: () => Promise<T>,
  options: LogCaptureOptions = {}
): Promise<{ result: T; analysis: Record<string, any> }> {
  const { result, logs } = await captureLogsAsync(fn, options);
  const analyzer = createLogAnalyzer(logs);
  
  return {
    result,
    analysis: analyzer.getSummary()
  };
}