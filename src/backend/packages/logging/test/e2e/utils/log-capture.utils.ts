import { LogLevel } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface representing a structured log entry
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  requestId?: string;
  userId?: string;
  journey?: string;
  service?: string;
  [key: string]: any; // Additional fields
}

/**
 * Options for configuring the log capture
 */
export interface LogCaptureOptions {
  /** Whether to capture logs to a file */
  captureToFile?: boolean;
  /** Directory to store log files */
  logDirectory?: string;
  /** Filename for the log file */
  logFilename?: string;
  /** Whether to parse logs as JSON */
  parseJson?: boolean;
  /** Whether to capture console output */
  captureConsole?: boolean;
  /** Whether to also output captured logs to the original console */
  passThrough?: boolean;
}

/**
 * Filter options for retrieving logs
 */
export interface LogFilterOptions {
  level?: LogLevel | LogLevel[];
  context?: string | RegExp;
  message?: string | RegExp;
  requestId?: string;
  userId?: string;
  journey?: string;
  service?: string;
  fromTimestamp?: Date;
  toTimestamp?: Date;
  limit?: number;
}

/**
 * Utility class for capturing logs during e2e tests
 */
export class LogCapture {
  private logs: LogEntry[] = [];
  private options: LogCaptureOptions;
  private originalConsoleLog: typeof console.log;
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;
  private originalConsoleDebug: typeof console.debug;
  private originalConsoleInfo: typeof console.info;
  private logFile: string | null = null;

  /**
   * Creates a new LogCapture instance
   * @param options Configuration options for log capture
   */
  constructor(options: LogCaptureOptions = {}) {
    this.options = {
      captureToFile: false,
      logDirectory: './logs',
      logFilename: `test-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.log`,
      parseJson: true,
      captureConsole: true,
      passThrough: false,
      ...options,
    };

    // Store original console methods
    this.originalConsoleLog = console.log;
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    this.originalConsoleDebug = console.debug;
    this.originalConsoleInfo = console.info;

    if (this.options.captureToFile) {
      this.setupLogFile();
    }
  }

  /**
   * Sets up the log file for file-based capture
   */
  private setupLogFile(): void {
    if (!this.options.logDirectory || !this.options.logFilename) {
      return;
    }

    try {
      if (!fs.existsSync(this.options.logDirectory)) {
        fs.mkdirSync(this.options.logDirectory, { recursive: true });
      }

      this.logFile = path.join(this.options.logDirectory, this.options.logFilename);
      
      // Create or clear the log file
      fs.writeFileSync(this.logFile, '');
    } catch (error) {
      this.originalConsoleError('Error setting up log file:', error);
      this.logFile = null;
    }
  }

  /**
   * Starts capturing logs
   */
  start(): void {
    if (this.options.captureConsole) {
      this.interceptConsoleMethods();
    }
  }

  /**
   * Stops capturing logs and restores original console methods
   */
  stop(): void {
    if (this.options.captureConsole) {
      this.restoreConsoleMethods();
    }
  }

  /**
   * Intercepts console methods to capture logs
   */
  private interceptConsoleMethods(): void {
    console.log = (...args: any[]) => this.captureLog('log', args);
    console.error = (...args: any[]) => this.captureLog('error', args);
    console.warn = (...args: any[]) => this.captureLog('warn', args);
    console.debug = (...args: any[]) => this.captureLog('debug', args);
    console.info = (...args: any[]) => this.captureLog('info', args);
  }

  /**
   * Restores original console methods
   */
  private restoreConsoleMethods(): void {
    console.log = this.originalConsoleLog;
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    console.debug = this.originalConsoleDebug;
    console.info = this.originalConsoleInfo;
  }

  /**
   * Captures a log entry from console methods
   * @param level The log level
   * @param args The arguments passed to the console method
   */
  private captureLog(level: string, args: any[]): void {
    // Pass through to original console if enabled
    if (this.options.passThrough) {
      switch (level) {
        case 'log':
          this.originalConsoleLog(...args);
          break;
        case 'error':
          this.originalConsoleError(...args);
          break;
        case 'warn':
          this.originalConsoleWarn(...args);
          break;
        case 'debug':
          this.originalConsoleDebug(...args);
          break;
        case 'info':
          this.originalConsoleInfo(...args);
          break;
      }
    }

    // Process the log entry
    const logEntry = this.processLogEntry(level as LogLevel, args);
    this.logs.push(logEntry);

    // Write to file if enabled
    if (this.options.captureToFile && this.logFile) {
      try {
        fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
      } catch (error) {
        this.originalConsoleError('Error writing to log file:', error);
      }
    }
  }

  /**
   * Processes console arguments into a structured log entry
   * @param level The log level
   * @param args The arguments passed to the console method
   * @returns A structured log entry
   */
  private processLogEntry(level: LogLevel, args: any[]): LogEntry {
    const timestamp = new Date().toISOString();
    let message = '';
    let context = undefined;
    let parsedData: Record<string, any> = {};

    // Try to parse JSON logs if enabled
    if (this.options.parseJson && args.length > 0 && typeof args[0] === 'string') {
      try {
        // Check if the first argument is a JSON string
        parsedData = JSON.parse(args[0]);
        
        // Extract common fields from parsed JSON
        message = parsedData.message || '';
        context = parsedData.context;
        
        // Return the structured log entry with all fields from the JSON
        return {
          timestamp,
          level,
          message,
          context,
          ...parsedData
        };
      } catch (e) {
        // Not a JSON string, continue with normal processing
      }
    }

    // Handle non-JSON logs
    if (args.length > 0) {
      if (typeof args[0] === 'string') {
        message = args[0];
      } else {
        message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
      }
    }

    // Check for context in NestJS format (second argument)
    if (args.length > 1 && typeof args[1] === 'string') {
      context = args[1];
    }

    return {
      timestamp,
      level,
      message,
      context
    };
  }

  /**
   * Manually adds a log entry
   * @param entry The log entry to add
   */
  addLogEntry(entry: Partial<LogEntry>): void {
    const fullEntry: LogEntry = {
      timestamp: entry.timestamp || new Date().toISOString(),
      level: entry.level || 'log' as LogLevel,
      message: entry.message || '',
      ...entry
    };

    this.logs.push(fullEntry);

    // Write to file if enabled
    if (this.options.captureToFile && this.logFile) {
      try {
        fs.appendFileSync(this.logFile, JSON.stringify(fullEntry) + '\n');
      } catch (error) {
        this.originalConsoleError('Error writing to log file:', error);
      }
    }
  }

  /**
   * Clears all captured logs
   */
  clear(): void {
    this.logs = [];
    
    // Clear log file if it exists
    if (this.options.captureToFile && this.logFile) {
      try {
        fs.writeFileSync(this.logFile, '');
      } catch (error) {
        this.originalConsoleError('Error clearing log file:', error);
      }
    }
  }

  /**
   * Gets all captured logs, optionally filtered
   * @param filter Optional filter criteria
   * @returns Filtered log entries
   */
  getLogs(filter?: LogFilterOptions): LogEntry[] {
    if (!filter) {
      return [...this.logs];
    }

    return this.logs.filter(log => {
      // Filter by log level
      if (filter.level) {
        if (Array.isArray(filter.level)) {
          if (!filter.level.includes(log.level)) {
            return false;
          }
        } else if (log.level !== filter.level) {
          return false;
        }
      }

      // Filter by context
      if (filter.context) {
        if (filter.context instanceof RegExp) {
          if (!log.context || !filter.context.test(log.context)) {
            return false;
          }
        } else if (log.context !== filter.context) {
          return false;
        }
      }

      // Filter by message
      if (filter.message) {
        if (filter.message instanceof RegExp) {
          if (!filter.message.test(log.message)) {
            return false;
          }
        } else if (log.message !== filter.message) {
          return false;
        }
      }

      // Filter by requestId
      if (filter.requestId && log.requestId !== filter.requestId) {
        return false;
      }

      // Filter by userId
      if (filter.userId && log.userId !== filter.userId) {
        return false;
      }

      // Filter by journey
      if (filter.journey && log.journey !== filter.journey) {
        return false;
      }

      // Filter by service
      if (filter.service && log.service !== filter.service) {
        return false;
      }

      // Filter by timestamp range
      if (filter.fromTimestamp) {
        const logTime = new Date(log.timestamp).getTime();
        if (logTime < filter.fromTimestamp.getTime()) {
          return false;
        }
      }

      if (filter.toTimestamp) {
        const logTime = new Date(log.timestamp).getTime();
        if (logTime > filter.toTimestamp.getTime()) {
          return false;
        }
      }

      return true;
    }).slice(0, filter.limit || this.logs.length);
  }

  /**
   * Gets logs from a specific journey
   * @param journey The journey name
   * @param additionalFilters Additional filter criteria
   * @returns Filtered log entries
   */
  getJourneyLogs(journey: string, additionalFilters?: Omit<LogFilterOptions, 'journey'>): LogEntry[] {
    return this.getLogs({
      journey,
      ...additionalFilters
    });
  }

  /**
   * Gets logs for a specific request
   * @param requestId The request ID
   * @param additionalFilters Additional filter criteria
   * @returns Filtered log entries
   */
  getRequestLogs(requestId: string, additionalFilters?: Omit<LogFilterOptions, 'requestId'>): LogEntry[] {
    return this.getLogs({
      requestId,
      ...additionalFilters
    });
  }

  /**
   * Gets logs for a specific user
   * @param userId The user ID
   * @param additionalFilters Additional filter criteria
   * @returns Filtered log entries
   */
  getUserLogs(userId: string, additionalFilters?: Omit<LogFilterOptions, 'userId'>): LogEntry[] {
    return this.getLogs({
      userId,
      ...additionalFilters
    });
  }

  /**
   * Gets logs from a specific service
   * @param service The service name
   * @param additionalFilters Additional filter criteria
   * @returns Filtered log entries
   */
  getServiceLogs(service: string, additionalFilters?: Omit<LogFilterOptions, 'service'>): LogEntry[] {
    return this.getLogs({
      service,
      ...additionalFilters
    });
  }

  /**
   * Gets logs of a specific level
   * @param level The log level or levels
   * @param additionalFilters Additional filter criteria
   * @returns Filtered log entries
   */
  getLevelLogs(level: LogLevel | LogLevel[], additionalFilters?: Omit<LogFilterOptions, 'level'>): LogEntry[] {
    return this.getLogs({
      level,
      ...additionalFilters
    });
  }

  /**
   * Checks if logs contain entries matching the given filter
   * @param filter Filter criteria
   * @returns True if matching logs exist
   */
  hasLogs(filter: LogFilterOptions): boolean {
    return this.getLogs(filter).length > 0;
  }

  /**
   * Asserts that logs contain entries matching the given filter
   * @param filter Filter criteria
   * @param message Optional assertion message
   * @throws Error if no matching logs are found
   */
  assertHasLogs(filter: LogFilterOptions, message?: string): void {
    const logs = this.getLogs(filter);
    if (logs.length === 0) {
      throw new Error(message || `Expected logs matching filter ${JSON.stringify(filter)} but none were found`);
    }
  }

  /**
   * Asserts that logs do not contain entries matching the given filter
   * @param filter Filter criteria
   * @param message Optional assertion message
   * @throws Error if matching logs are found
   */
  assertNoLogs(filter: LogFilterOptions, message?: string): void {
    const logs = this.getLogs(filter);
    if (logs.length > 0) {
      throw new Error(
        message || 
        `Expected no logs matching filter ${JSON.stringify(filter)} but found ${logs.length}: ${JSON.stringify(logs)}`
      );
    }
  }

  /**
   * Asserts that logs contain a specific number of entries matching the given filter
   * @param filter Filter criteria
   * @param count Expected count
   * @param message Optional assertion message
   * @throws Error if the count doesn't match
   */
  assertLogCount(filter: LogFilterOptions, count: number, message?: string): void {
    const logs = this.getLogs(filter);
    if (logs.length !== count) {
      throw new Error(
        message || 
        `Expected ${count} logs matching filter ${JSON.stringify(filter)} but found ${logs.length}`
      );
    }
  }

  /**
   * Creates a log validator for more fluent assertions
   * @param filter Initial filter criteria
   * @returns A LogValidator instance
   */
  validate(filter?: LogFilterOptions): LogValidator {
    return new LogValidator(this, filter || {});
  }
}

/**
 * Fluent interface for validating logs
 */
export class LogValidator {
  private logCapture: LogCapture;
  private filter: LogFilterOptions;

  /**
   * Creates a new LogValidator
   * @param logCapture The LogCapture instance
   * @param filter Initial filter criteria
   */
  constructor(logCapture: LogCapture, filter: LogFilterOptions) {
    this.logCapture = logCapture;
    this.filter = { ...filter };
  }

  /**
   * Filters logs by level
   * @param level The log level or levels
   * @returns This LogValidator instance for chaining
   */
  withLevel(level: LogLevel | LogLevel[]): LogValidator {
    this.filter.level = level;
    return this;
  }

  /**
   * Filters logs by context
   * @param context The context string or pattern
   * @returns This LogValidator instance for chaining
   */
  withContext(context: string | RegExp): LogValidator {
    this.filter.context = context;
    return this;
  }

  /**
   * Filters logs by message
   * @param message The message string or pattern
   * @returns This LogValidator instance for chaining
   */
  withMessage(message: string | RegExp): LogValidator {
    this.filter.message = message;
    return this;
  }

  /**
   * Filters logs by request ID
   * @param requestId The request ID
   * @returns This LogValidator instance for chaining
   */
  withRequestId(requestId: string): LogValidator {
    this.filter.requestId = requestId;
    return this;
  }

  /**
   * Filters logs by user ID
   * @param userId The user ID
   * @returns This LogValidator instance for chaining
   */
  withUserId(userId: string): LogValidator {
    this.filter.userId = userId;
    return this;
  }

  /**
   * Filters logs by journey
   * @param journey The journey name
   * @returns This LogValidator instance for chaining
   */
  withJourney(journey: string): LogValidator {
    this.filter.journey = journey;
    return this;
  }

  /**
   * Filters logs by service
   * @param service The service name
   * @returns This LogValidator instance for chaining
   */
  withService(service: string): LogValidator {
    this.filter.service = service;
    return this;
  }

  /**
   * Filters logs by timestamp range
   * @param from The start timestamp
   * @param to The end timestamp
   * @returns This LogValidator instance for chaining
   */
  withTimeRange(from: Date, to: Date): LogValidator {
    this.filter.fromTimestamp = from;
    this.filter.toTimestamp = to;
    return this;
  }

  /**
   * Limits the number of logs returned
   * @param limit The maximum number of logs to return
   * @returns This LogValidator instance for chaining
   */
  limit(limit: number): LogValidator {
    this.filter.limit = limit;
    return this;
  }

  /**
   * Gets the filtered logs
   * @returns Filtered log entries
   */
  getLogs(): LogEntry[] {
    return this.logCapture.getLogs(this.filter);
  }

  /**
   * Checks if logs exist matching the current filter
   * @returns True if matching logs exist
   */
  exists(): boolean {
    return this.logCapture.hasLogs(this.filter);
  }

  /**
   * Asserts that logs exist matching the current filter
   * @param message Optional assertion message
   * @throws Error if no matching logs are found
   */
  assertExists(message?: string): void {
    this.logCapture.assertHasLogs(this.filter, message);
  }

  /**
   * Asserts that no logs exist matching the current filter
   * @param message Optional assertion message
   * @throws Error if matching logs are found
   */
  assertNotExists(message?: string): void {
    this.logCapture.assertNoLogs(this.filter, message);
  }

  /**
   * Asserts that a specific number of logs exist matching the current filter
   * @param count Expected count
   * @param message Optional assertion message
   * @throws Error if the count doesn't match
   */
  assertCount(count: number, message?: string): void {
    this.logCapture.assertLogCount(this.filter, count, message);
  }

  /**
   * Gets the first log matching the current filter
   * @returns The first matching log entry or undefined if none found
   */
  first(): LogEntry | undefined {
    const logs = this.logCapture.getLogs({ ...this.filter, limit: 1 });
    return logs.length > 0 ? logs[0] : undefined;
  }

  /**
   * Gets the last log matching the current filter
   * @returns The last matching log entry or undefined if none found
   */
  last(): LogEntry | undefined {
    const logs = this.logCapture.getLogs(this.filter);
    return logs.length > 0 ? logs[logs.length - 1] : undefined;
  }
}

/**
 * Creates a new LogCapture instance with default options
 * @param options Configuration options for log capture
 * @returns A new LogCapture instance
 */
export function createLogCapture(options?: LogCaptureOptions): LogCapture {
  return new LogCapture(options);
}

/**
 * Creates an in-memory log capture for testing
 * @returns A new LogCapture instance configured for in-memory capture
 */
export function createInMemoryLogCapture(): LogCapture {
  return new LogCapture({
    captureToFile: false,
    captureConsole: true,
    parseJson: true,
    passThrough: false
  });
}

/**
 * Creates a file-based log capture for testing
 * @param directory Directory to store log files
 * @param filename Optional filename for the log file
 * @returns A new LogCapture instance configured for file-based capture
 */
export function createFileLogCapture(directory: string, filename?: string): LogCapture {
  return new LogCapture({
    captureToFile: true,
    logDirectory: directory,
    logFilename: filename || `test-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.log`,
    captureConsole: true,
    parseJson: true,
    passThrough: false
  });
}