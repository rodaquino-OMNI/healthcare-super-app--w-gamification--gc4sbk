import { Writable, Readable } from 'stream';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { Transport } from '../../src/interfaces/transport.interface';
import { Formatter } from '../../src/formatters/formatter.interface';
import { LogEntry } from '../../src/formatters/formatter.interface';

/**
 * Interface for a captured log entry with additional metadata
 */
export interface CapturedLogEntry extends LogEntry {
  /** Timestamp when the log was captured */
  capturedAt: Date;
  /** Original formatted string if available */
  formatted?: string;
  /** Raw log entry before processing */
  raw?: any;
}

/**
 * Options for configuring the log capture behavior
 */
export interface LogCaptureOptions {
  /** Whether to capture stdout logs */
  captureStdout?: boolean;
  /** Whether to capture stderr logs */
  captureStderr?: boolean;
  /** Whether to capture logs from transports */
  captureTransports?: boolean;
  /** Minimum log level to capture */
  minLevel?: LogLevel;
  /** Maximum number of logs to keep in memory */
  maxLogs?: number;
  /** Whether to parse JSON logs */
  parseJson?: boolean;
  /** Journey types to filter by */
  journeyTypes?: string[];
  /** Whether to restore original streams on cleanup */
  restoreStreams?: boolean;
}

/**
 * Default options for log capture
 */
const DEFAULT_OPTIONS: LogCaptureOptions = {
  captureStdout: true,
  captureStderr: true,
  captureTransports: true,
  minLevel: LogLevel.DEBUG,
  maxLogs: 1000,
  parseJson: true,
  restoreStreams: true,
};

/**
 * In-memory transport that captures logs for testing
 */
export class MemoryTransport implements Transport {
  private logs: CapturedLogEntry[] = [];
  private options: LogCaptureOptions;
  private formatter?: Formatter;

  constructor(options: LogCaptureOptions = DEFAULT_OPTIONS) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Sets the formatter to use for this transport
   */
  setFormatter(formatter: Formatter): void {
    this.formatter = formatter;
  }

  /**
   * Writes a log entry to memory
   */
  write(entry: LogEntry): void {
    if (entry.level < this.options.minLevel) {
      return;
    }

    // Filter by journey type if specified
    if (this.options.journeyTypes?.length > 0) {
      const journeyContext = entry.context as JourneyContext;
      if (!journeyContext?.journeyType || 
          !this.options.journeyTypes.includes(journeyContext.journeyType)) {
        return;
      }
    }

    const formatted = this.formatter ? this.formatter.format(entry) : undefined;

    const capturedEntry: CapturedLogEntry = {
      ...entry,
      capturedAt: new Date(),
      formatted,
      raw: { ...entry },
    };

    this.logs.push(capturedEntry);

    // Respect max logs limit
    if (this.logs.length > this.options.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Gets all captured logs
   */
  getLogs(): CapturedLogEntry[] {
    return [...this.logs];
  }

  /**
   * Clears all captured logs
   */
  clear(): void {
    this.logs = [];
  }
}

/**
 * Stream that captures writes for testing
 */
export class CaptureStream extends Writable {
  private chunks: Buffer[] = [];
  private originalStream?: NodeJS.WriteStream;
  private options: LogCaptureOptions;
  private logEntries: CapturedLogEntry[] = [];

  constructor(originalStream?: NodeJS.WriteStream, options: LogCaptureOptions = DEFAULT_OPTIONS) {
    super();
    this.originalStream = originalStream;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Implementation of the _write method for the Writable stream
   */
  _write(chunk: Buffer, encoding: string, callback: (error?: Error | null) => void): void {
    this.chunks.push(chunk);
    
    // Parse the chunk if needed
    if (this.options.parseJson) {
      try {
        const str = chunk.toString();
        const lines = str.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            // Try to parse as JSON
            const parsed = JSON.parse(line);
            if (this.isLogEntry(parsed)) {
              const capturedEntry: CapturedLogEntry = {
                ...parsed,
                capturedAt: new Date(),
                formatted: line,
                raw: parsed,
              };
              
              // Apply filtering
              if (this.shouldCaptureLog(capturedEntry)) {
                this.logEntries.push(capturedEntry);
              }
            }
          } catch (e) {
            // Not JSON or not a valid log entry, store as raw text
            const capturedEntry: CapturedLogEntry = {
              message: line,
              level: LogLevel.INFO, // Default level
              timestamp: new Date(),
              context: {},
              capturedAt: new Date(),
              formatted: line,
              raw: line,
            };
            
            this.logEntries.push(capturedEntry);
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Pass through to original stream if it exists
    if (this.originalStream && !this.originalStream.destroyed) {
      this.originalStream.write(chunk);
    }
    
    callback();
  }

  /**
   * Checks if an object is a valid log entry
   */
  private isLogEntry(obj: any): obj is LogEntry {
    return obj && 
           typeof obj.message === 'string' && 
           typeof obj.level === 'number' &&
           obj.timestamp !== undefined;
  }

  /**
   * Determines if a log entry should be captured based on filtering options
   */
  private shouldCaptureLog(entry: CapturedLogEntry): boolean {
    // Filter by log level
    if (entry.level < this.options.minLevel) {
      return false;
    }

    // Filter by journey type if specified
    if (this.options.journeyTypes?.length > 0) {
      const journeyContext = entry.context as JourneyContext;
      if (!journeyContext?.journeyType || 
          !this.options.journeyTypes.includes(journeyContext.journeyType)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets the raw captured output as a string
   */
  getOutput(): string {
    return Buffer.concat(this.chunks).toString();
  }

  /**
   * Gets all captured log entries
   */
  getLogs(): CapturedLogEntry[] {
    return [...this.logEntries];
  }

  /**
   * Clears all captured logs
   */
  clear(): void {
    this.chunks = [];
    this.logEntries = [];
  }
}

/**
 * Main class for capturing logs during tests
 */
export class LogCapture {
  private options: LogCaptureOptions;
  private memoryTransport: MemoryTransport;
  private stdoutCapture?: CaptureStream;
  private stderrCapture?: CaptureStream;
  private originalStdout?: NodeJS.WriteStream;
  private originalStderr?: NodeJS.WriteStream;
  private transportHooks: Array<{ transport: Transport, originalWrite: Function }> = [];

  constructor(options: LogCaptureOptions = DEFAULT_OPTIONS) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.memoryTransport = new MemoryTransport(this.options);
  }

  /**
   * Starts capturing logs
   */
  start(): void {
    // Capture stdout if enabled
    if (this.options.captureStdout) {
      this.originalStdout = process.stdout;
      this.stdoutCapture = new CaptureStream(process.stdout, this.options);
      // @ts-ignore - TypeScript doesn't like us replacing stdout
      process.stdout = this.stdoutCapture;
    }

    // Capture stderr if enabled
    if (this.options.captureStderr) {
      this.originalStderr = process.stderr;
      this.stderrCapture = new CaptureStream(process.stderr, this.options);
      // @ts-ignore - TypeScript doesn't like us replacing stderr
      process.stderr = this.stderrCapture;
    }

    // Hook into transports if enabled
    if (this.options.captureTransports) {
      // This would be implemented by hooking into the transport factory
      // or by providing this transport to the logger during tests
    }
  }

  /**
   * Stops capturing logs and restores original streams
   */
  stop(): void {
    // Restore stdout if it was captured
    if (this.stdoutCapture && this.originalStdout && this.options.restoreStreams) {
      // @ts-ignore
      process.stdout = this.originalStdout;
      this.stdoutCapture = undefined;
    }

    // Restore stderr if it was captured
    if (this.stderrCapture && this.originalStderr && this.options.restoreStreams) {
      // @ts-ignore
      process.stderr = this.originalStderr;
      this.stderrCapture = undefined;
    }

    // Unhook transports
    this.transportHooks.forEach(({ transport, originalWrite }) => {
      transport.write = originalWrite;
    });
    this.transportHooks = [];
  }

  /**
   * Gets all captured logs from all sources
   */
  getLogs(): CapturedLogEntry[] {
    const logs: CapturedLogEntry[] = [
      ...this.memoryTransport.getLogs(),
    ];

    if (this.stdoutCapture) {
      logs.push(...this.stdoutCapture.getLogs());
    }

    if (this.stderrCapture) {
      logs.push(...this.stderrCapture.getLogs());
    }

    // Sort by timestamp
    return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Gets the memory transport for direct use
   */
  getMemoryTransport(): MemoryTransport {
    return this.memoryTransport;
  }

  /**
   * Clears all captured logs
   */
  clear(): void {
    this.memoryTransport.clear();
    
    if (this.stdoutCapture) {
      this.stdoutCapture.clear();
    }
    
    if (this.stderrCapture) {
      this.stderrCapture.clear();
    }
  }

  /**
   * Hooks into an existing transport to capture its logs
   */
  hookTransport(transport: Transport): void {
    const originalWrite = transport.write.bind(transport);
    this.transportHooks.push({ transport, originalWrite });
    
    transport.write = (entry: LogEntry) => {
      // Capture the log
      this.memoryTransport.write(entry);
      // Call the original method
      originalWrite(entry);
    };
  }
}

/**
 * Utility class for filtering and analyzing captured logs
 */
export class LogAnalyzer {
  private logs: CapturedLogEntry[];

  constructor(logs: CapturedLogEntry[]) {
    this.logs = logs;
  }

  /**
   * Filters logs by log level
   */
  byLevel(level: LogLevel): LogAnalyzer {
    return new LogAnalyzer(this.logs.filter(log => log.level === level));
  }

  /**
   * Filters logs by minimum log level
   */
  byMinLevel(level: LogLevel): LogAnalyzer {
    return new LogAnalyzer(this.logs.filter(log => log.level >= level));
  }

  /**
   * Filters logs by message content
   */
  byMessage(substring: string): LogAnalyzer {
    return new LogAnalyzer(
      this.logs.filter(log => log.message.includes(substring))
    );
  }

  /**
   * Filters logs by regex pattern in message
   */
  byMessagePattern(pattern: RegExp): LogAnalyzer {
    return new LogAnalyzer(
      this.logs.filter(log => pattern.test(log.message))
    );
  }

  /**
   * Filters logs by journey type
   */
  byJourneyType(journeyType: string): LogAnalyzer {
    return new LogAnalyzer(
      this.logs.filter(log => {
        const context = log.context as JourneyContext;
        return context?.journeyType === journeyType;
      })
    );
  }

  /**
   * Filters logs by user ID
   */
  byUserId(userId: string): LogAnalyzer {
    return new LogAnalyzer(
      this.logs.filter(log => {
        const context = log.context as UserContext;
        return context?.userId === userId;
      })
    );
  }

  /**
   * Filters logs by request ID
   */
  byRequestId(requestId: string): LogAnalyzer {
    return new LogAnalyzer(
      this.logs.filter(log => {
        const context = log.context as RequestContext;
        return context?.requestId === requestId;
      })
    );
  }

  /**
   * Filters logs by correlation ID
   */
  byCorrelationId(correlationId: string): LogAnalyzer {
    return new LogAnalyzer(
      this.logs.filter(log => {
        return log.context?.correlationId === correlationId;
      })
    );
  }

  /**
   * Filters logs by time range
   */
  byTimeRange(start: Date, end: Date): LogAnalyzer {
    return new LogAnalyzer(
      this.logs.filter(log => {
        const timestamp = log.timestamp;
        return timestamp >= start && timestamp <= end;
      })
    );
  }

  /**
   * Filters logs by custom predicate function
   */
  filter(predicate: (log: CapturedLogEntry) => boolean): LogAnalyzer {
    return new LogAnalyzer(this.logs.filter(predicate));
  }

  /**
   * Gets all logs that match the current filters
   */
  getLogs(): CapturedLogEntry[] {
    return [...this.logs];
  }

  /**
   * Gets the count of logs that match the current filters
   */
  count(): number {
    return this.logs.length;
  }

  /**
   * Checks if any logs match the current filters
   */
  hasLogs(): boolean {
    return this.logs.length > 0;
  }

  /**
   * Gets the first log that matches the current filters
   */
  first(): CapturedLogEntry | undefined {
    return this.logs[0];
  }

  /**
   * Gets the last log that matches the current filters
   */
  last(): CapturedLogEntry | undefined {
    return this.logs[this.logs.length - 1];
  }

  /**
   * Extracts all unique values for a specific field from the logs
   */
  extractField<T>(fieldPath: string): T[] {
    const result = new Set<T>();
    
    for (const log of this.logs) {
      const value = this.getNestedProperty(log, fieldPath) as T;
      if (value !== undefined) {
        result.add(value);
      }
    }
    
    return Array.from(result);
  }

  /**
   * Gets a nested property from an object using dot notation
   */
  private getNestedProperty(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }
}

/**
 * Creates a new LogCapture instance with the specified options
 */
export function createLogCapture(options?: LogCaptureOptions): LogCapture {
  return new LogCapture(options);
}

/**
 * Creates a new LogAnalyzer for the provided logs
 */
export function analyzeLogEntries(logs: CapturedLogEntry[]): LogAnalyzer {
  return new LogAnalyzer(logs);
}

/**
 * Utility function to capture logs during the execution of a function
 */
export async function captureLogsAsync<T>(
  fn: () => Promise<T>,
  options?: LogCaptureOptions
): Promise<{ result: T; logs: CapturedLogEntry[] }> {
  const capture = createLogCapture(options);
  capture.start();
  
  try {
    const result = await fn();
    return { result, logs: capture.getLogs() };
  } finally {
    capture.stop();
  }
}

/**
 * Utility function to capture logs during the synchronous execution of a function
 */
export function captureLogs<T>(
  fn: () => T,
  options?: LogCaptureOptions
): { result: T; logs: CapturedLogEntry[] } {
  const capture = createLogCapture(options);
  capture.start();
  
  try {
    const result = fn();
    return { result, logs: capture.getLogs() };
  } finally {
    capture.stop();
  }
}

/**
 * Creates a Jest test wrapper that provides log capture capabilities
 */
export function withLogCapture(
  testFn: (capture: LogCapture) => void | Promise<void>,
  options?: LogCaptureOptions
): () => Promise<void> {
  return async () => {
    const capture = createLogCapture(options);
    capture.start();
    
    try {
      await testFn(capture);
    } finally {
      capture.stop();
    }
  };
}