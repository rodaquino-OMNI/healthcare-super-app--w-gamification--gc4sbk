import { Writable } from 'stream';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LogEntry } from '../../src/interfaces/log-entry.interface';
import { Transport } from '../../src/interfaces/transport.interface';
import { Formatter } from '../../src/formatters/formatter.interface';

/**
 * Interface for a captured log entry with additional metadata
 */
export interface CapturedLog extends LogEntry {
  /** Raw string representation of the log */
  raw?: string;
  /** Timestamp when the log was captured */
  capturedAt: Date;
  /** Format of the captured log (json, text, etc.) */
  format?: string;
  /** Transport that was used to capture the log */
  transportType?: string;
}

/**
 * Options for configuring the log capture behavior
 */
export interface LogCaptureOptions {
  /** Whether to capture console.log, console.error, etc. */
  captureConsole?: boolean;
  /** Whether to capture process.stdout and process.stderr */
  captureStdio?: boolean;
  /** Whether to capture logs from the logger service */
  captureLoggerService?: boolean;
  /** Minimum log level to capture */
  minLevel?: LogLevel;
  /** Maximum number of logs to keep in memory */
  maxLogs?: number;
  /** Journey context to filter logs by */
  journeyContext?: string;
  /** User ID to filter logs by */
  userId?: string;
  /** Request ID to filter logs by */
  requestId?: string;
}

/**
 * Default options for log capture
 */
const DEFAULT_CAPTURE_OPTIONS: LogCaptureOptions = {
  captureConsole: true,
  captureStdio: true,
  captureLoggerService: true,
  minLevel: LogLevel.DEBUG,
  maxLogs: 1000,
};

/**
 * In-memory transport for capturing logs during tests
 */
export class InMemoryTransport implements Transport {
  private logs: CapturedLog[] = [];
  private options: LogCaptureOptions;
  private formatter?: Formatter;

  constructor(options: LogCaptureOptions = DEFAULT_CAPTURE_OPTIONS, formatter?: Formatter) {
    this.options = { ...DEFAULT_CAPTURE_OPTIONS, ...options };
    this.formatter = formatter;
  }

  /**
   * Writes a log entry to the in-memory store
   */
  write(entry: LogEntry): void {
    // Skip logs below the minimum level
    if (entry.level < this.options.minLevel) {
      return;
    }

    // Skip logs that don't match journey context filter if specified
    if (this.options.journeyContext && 
        entry.context?.journey !== this.options.journeyContext) {
      return;
    }

    // Skip logs that don't match user ID filter if specified
    if (this.options.userId && 
        entry.context?.userId !== this.options.userId) {
      return;
    }

    // Skip logs that don't match request ID filter if specified
    if (this.options.requestId && 
        entry.context?.requestId !== this.options.requestId) {
      return;
    }

    const capturedLog: CapturedLog = {
      ...entry,
      capturedAt: new Date(),
      transportType: 'memory'
    };

    // Format the log if a formatter is provided
    if (this.formatter) {
      capturedLog.raw = this.formatter.format(entry);
      capturedLog.format = this.formatter.constructor.name.replace('Formatter', '').toLowerCase();
    }

    this.logs.push(capturedLog);

    // Trim logs if we exceed the maximum
    if (this.logs.length > this.options.maxLogs) {
      this.logs = this.logs.slice(this.logs.length - this.options.maxLogs);
    }
  }

  /**
   * Returns all captured logs
   */
  getLogs(): CapturedLog[] {
    return [...this.logs];
  }

  /**
   * Clears all captured logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Filters logs by various criteria
   */
  filter(criteria: Partial<LogEntry>): CapturedLog[] {
    return this.logs.filter(log => {
      for (const [key, value] of Object.entries(criteria)) {
        // Handle nested properties like context.userId
        if (key.includes('.')) {
          const [parent, child] = key.split('.');
          if (log[parent]?.[child] !== value) {
            return false;
          }
        } else if (log[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Searches logs for a specific string or regular expression
   */
  search(term: string | RegExp): CapturedLog[] {
    const regex = typeof term === 'string' ? new RegExp(term, 'i') : term;
    
    return this.logs.filter(log => {
      // Search in the raw log if available
      if (log.raw && regex.test(log.raw)) {
        return true;
      }
      
      // Search in the message
      if (regex.test(log.message)) {
        return true;
      }
      
      // Search in stringified context
      if (log.context && regex.test(JSON.stringify(log.context))) {
        return true;
      }
      
      // Search in error message and stack if available
      if (log.error) {
        if (typeof log.error === 'string' && regex.test(log.error)) {
          return true;
        } else if (log.error instanceof Error) {
          return regex.test(log.error.message) || 
                 (log.error.stack ? regex.test(log.error.stack) : false);
        } else if (typeof log.error === 'object') {
          return regex.test(JSON.stringify(log.error));
        }
      }
      
      return false;
    });
  }
}

/**
 * Stream capture for intercepting stdout/stderr
 */
export class StreamCapture extends Writable {
  private originalWrite: Function;
  private stream: NodeJS.WriteStream;
  private buffer: string[] = [];
  private callback?: (data: string) => void;
  private paused: boolean = false;

  /**
   * Creates a new stream capture for the specified stream
   * @param stream The stream to capture (process.stdout or process.stderr)
   * @param callback Optional callback to execute for each write
   */
  constructor(stream: NodeJS.WriteStream, callback?: (data: string) => void) {
    super();
    this.stream = stream;
    this.originalWrite = stream.write;
    this.callback = callback;
  }

  /**
   * Starts capturing the stream
   */
  startCapture(): void {
    if (this.paused) {
      return;
    }

    // Override the write method to capture output
    this.stream.write = (chunk: any, encoding?: any, callback?: any): boolean => {
      const data = typeof chunk === 'string' ? chunk : chunk.toString();
      this.buffer.push(data);
      
      if (this.callback) {
        this.callback(data);
      }
      
      // Call the original write to maintain normal output
      return this.originalWrite.apply(this.stream, [chunk, encoding, callback]);
    };
  }

  /**
   * Stops capturing the stream and restores the original write method
   */
  stopCapture(): void {
    this.stream.write = this.originalWrite;
  }

  /**
   * Pauses capturing without restoring the original write method
   */
  pauseCapture(): void {
    this.paused = true;
  }

  /**
   * Resumes capturing after a pause
   */
  resumeCapture(): void {
    this.paused = false;
  }

  /**
   * Gets all captured output as a string
   */
  getOutput(): string {
    return this.buffer.join('');
  }

  /**
   * Gets captured output as an array of lines
   */
  getLines(): string[] {
    return this.getOutput().split('\n').filter(line => line.trim() !== '');
  }

  /**
   * Clears the captured output
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Implementation of the write method for the Writable interface
   */
  _write(chunk: any, encoding: string, callback: (error?: Error) => void): void {
    const data = typeof chunk === 'string' ? chunk : chunk.toString();
    this.buffer.push(data);
    
    if (this.callback) {
      this.callback(data);
    }
    
    callback();
  }
}

/**
 * Console capture for intercepting console.log, console.error, etc.
 */
export class ConsoleCapture {
  private originalMethods: Record<string, Function> = {};
  private captures: Record<string, string[]> = {
    log: [],
    error: [],
    warn: [],
    info: [],
    debug: []
  };
  private callback?: (method: string, args: any[]) => void;
  private paused: boolean = false;

  /**
   * Creates a new console capture
   * @param callback Optional callback to execute for each console method call
   */
  constructor(callback?: (method: string, args: any[]) => void) {
    this.callback = callback;
  }

  /**
   * Starts capturing console methods
   * @param methods Optional array of methods to capture (defaults to all)
   */
  startCapture(methods: string[] = ['log', 'error', 'warn', 'info', 'debug']): void {
    methods.forEach(method => {
      if (typeof console[method] === 'function') {
        this.originalMethods[method] = console[method];
        console[method] = (...args: any[]) => {
          if (!this.paused) {
            this.captures[method].push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' '));
            
            if (this.callback) {
              this.callback(method, args);
            }
          }
          
          // Call the original method to maintain normal console output
          this.originalMethods[method].apply(console, args);
        };
      }
    });
  }

  /**
   * Stops capturing and restores original console methods
   */
  stopCapture(): void {
    Object.keys(this.originalMethods).forEach(method => {
      console[method] = this.originalMethods[method];
    });
    this.originalMethods = {};
  }

  /**
   * Pauses capturing without restoring original methods
   */
  pauseCapture(): void {
    this.paused = true;
  }

  /**
   * Resumes capturing after a pause
   */
  resumeCapture(): void {
    this.paused = false;
  }

  /**
   * Gets captured output for a specific console method
   */
  getCapture(method: string): string[] {
    return [...(this.captures[method] || [])];
  }

  /**
   * Gets all captured output
   */
  getAllCaptures(): Record<string, string[]> {
    return Object.keys(this.captures).reduce((result, method) => {
      result[method] = [...this.captures[method]];
      return result;
    }, {});
  }

  /**
   * Clears captured output for a specific method or all methods
   */
  clear(method?: string): void {
    if (method) {
      this.captures[method] = [];
    } else {
      Object.keys(this.captures).forEach(m => {
        this.captures[m] = [];
      });
    }
  }
}

/**
 * Log analyzer for parsing and validating structured logs
 */
export class LogAnalyzer {
  /**
   * Parses a JSON log string into a structured object
   */
  static parseJsonLog(logString: string): any {
    try {
      return JSON.parse(logString);
    } catch (error) {
      throw new Error(`Failed to parse JSON log: ${error.message}`);
    }
  }

  /**
   * Validates that a log object contains all required fields
   */
  static validateLogStructure(log: any, requiredFields: string[] = ['timestamp', 'level', 'message']): boolean {
    return requiredFields.every(field => {
      const fieldPath = field.split('.');
      let current = log;
      
      for (const part of fieldPath) {
        if (current === undefined || current === null) {
          return false;
        }
        current = current[part];
      }
      
      return current !== undefined && current !== null;
    });
  }

  /**
   * Extracts context information from a log object
   */
  static extractContext(log: any): Record<string, any> {
    return log.context || {};
  }

  /**
   * Extracts trace information from a log object
   */
  static extractTraceInfo(log: any): { traceId?: string, spanId?: string } {
    const context = log.context || {};
    return {
      traceId: context.traceId || log.traceId,
      spanId: context.spanId || log.spanId
    };
  }

  /**
   * Extracts journey information from a log object
   */
  static extractJourneyInfo(log: any): { journey?: string, journeyContext?: any } {
    const context = log.context || {};
    return {
      journey: context.journey,
      journeyContext: context.journeyContext
    };
  }

  /**
   * Groups logs by a specific field
   */
  static groupBy(logs: any[], field: string): Record<string, any[]> {
    return logs.reduce((groups, log) => {
      const fieldPath = field.split('.');
      let value = log;
      
      for (const part of fieldPath) {
        if (value === undefined || value === null) {
          value = 'undefined';
          break;
        }
        value = value[part];
      }
      
      const key = value === undefined || value === null ? 'undefined' : String(value);
      groups[key] = groups[key] || [];
      groups[key].push(log);
      
      return groups;
    }, {});
  }
}

/**
 * Creates a complete log capture environment for testing
 */
export class LogCaptureEnvironment {
  private inMemoryTransport: InMemoryTransport;
  private stdoutCapture: StreamCapture;
  private stderrCapture: StreamCapture;
  private consoleCapture: ConsoleCapture;
  private options: LogCaptureOptions;
  private active: boolean = false;

  /**
   * Creates a new log capture environment
   */
  constructor(options: LogCaptureOptions = DEFAULT_CAPTURE_OPTIONS) {
    this.options = { ...DEFAULT_CAPTURE_OPTIONS, ...options };
    this.inMemoryTransport = new InMemoryTransport(this.options);
    this.stdoutCapture = new StreamCapture(process.stdout);
    this.stderrCapture = new StreamCapture(process.stderr);
    this.consoleCapture = new ConsoleCapture();
  }

  /**
   * Starts capturing logs
   */
  start(): void {
    if (this.active) {
      return;
    }

    if (this.options.captureStdio) {
      this.stdoutCapture.startCapture();
      this.stderrCapture.startCapture();
    }

    if (this.options.captureConsole) {
      this.consoleCapture.startCapture();
    }

    this.active = true;
  }

  /**
   * Stops capturing logs and restores original behavior
   */
  stop(): void {
    if (!this.active) {
      return;
    }

    if (this.options.captureStdio) {
      this.stdoutCapture.stopCapture();
      this.stderrCapture.stopCapture();
    }

    if (this.options.captureConsole) {
      this.consoleCapture.stopCapture();
    }

    this.active = false;
  }

  /**
   * Clears all captured logs
   */
  clear(): void {
    this.inMemoryTransport.clear();
    this.stdoutCapture.clear();
    this.stderrCapture.clear();
    this.consoleCapture.clear();
  }

  /**
   * Gets the in-memory transport for direct access to captured logs
   */
  getInMemoryTransport(): InMemoryTransport {
    return this.inMemoryTransport;
  }

  /**
   * Gets all captured logs from the in-memory transport
   */
  getLogs(): CapturedLog[] {
    return this.inMemoryTransport.getLogs();
  }

  /**
   * Gets captured stdout as a string
   */
  getStdout(): string {
    return this.stdoutCapture.getOutput();
  }

  /**
   * Gets captured stderr as a string
   */
  getStderr(): string {
    return this.stderrCapture.getOutput();
  }

  /**
   * Gets captured console output
   */
  getConsoleOutput(): Record<string, string[]> {
    return this.consoleCapture.getAllCaptures();
  }

  /**
   * Filters logs by various criteria
   */
  filterLogs(criteria: Partial<LogEntry>): CapturedLog[] {
    return this.inMemoryTransport.filter(criteria);
  }

  /**
   * Searches logs for a specific string or regular expression
   */
  searchLogs(term: string | RegExp): CapturedLog[] {
    return this.inMemoryTransport.search(term);
  }

  /**
   * Creates a snapshot of the current log state for comparison
   */
  createSnapshot(): {
    logs: CapturedLog[],
    stdout: string,
    stderr: string,
    console: Record<string, string[]>
  } {
    return {
      logs: this.getLogs(),
      stdout: this.getStdout(),
      stderr: this.getStderr(),
      console: this.getConsoleOutput()
    };
  }
}

/**
 * Creates a log capture environment for a specific test
 * @param options Options for configuring the log capture
 */
export function createLogCapture(options?: LogCaptureOptions): LogCaptureEnvironment {
  const capture = new LogCaptureEnvironment(options);
  capture.start();
  return capture;
}

/**
 * Creates a journey-specific log capture environment
 * @param journey The journey to capture logs for (health, care, plan)
 * @param options Additional options for configuring the log capture
 */
export function createJourneyLogCapture(
  journey: 'health' | 'care' | 'plan',
  options?: LogCaptureOptions
): LogCaptureEnvironment {
  return createLogCapture({
    ...options,
    journeyContext: journey
  });
}

/**
 * Creates a user-specific log capture environment
 * @param userId The user ID to capture logs for
 * @param options Additional options for configuring the log capture
 */
export function createUserLogCapture(
  userId: string,
  options?: LogCaptureOptions
): LogCaptureEnvironment {
  return createLogCapture({
    ...options,
    userId
  });
}

/**
 * Creates a request-specific log capture environment
 * @param requestId The request ID to capture logs for
 * @param options Additional options for configuring the log capture
 */
export function createRequestLogCapture(
  requestId: string,
  options?: LogCaptureOptions
): LogCaptureEnvironment {
  return createLogCapture({
    ...options,
    requestId
  });
}