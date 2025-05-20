import { EventEmitter } from 'events';
import { Transport } from '../interfaces/transport.interface';
import { LogLevel } from '../interfaces/log-level.enum';
import { Formatter } from '../formatters/formatter.interface';

/**
 * ANSI color codes for console output
 */
enum ConsoleColors {
  Reset = '\x1b[0m',
  Bright = '\x1b[1m',
  Dim = '\x1b[2m',
  Underscore = '\x1b[4m',
  Blink = '\x1b[5m',
  Reverse = '\x1b[7m',
  Hidden = '\x1b[8m',

  FgBlack = '\x1b[30m',
  FgRed = '\x1b[31m',
  FgGreen = '\x1b[32m',
  FgYellow = '\x1b[33m',
  FgBlue = '\x1b[34m',
  FgMagenta = '\x1b[35m',
  FgCyan = '\x1b[36m',
  FgWhite = '\x1b[37m',
  FgGray = '\x1b[90m',

  BgBlack = '\x1b[40m',
  BgRed = '\x1b[41m',
  BgGreen = '\x1b[42m',
  BgYellow = '\x1b[43m',
  BgBlue = '\x1b[44m',
  BgMagenta = '\x1b[45m',
  BgCyan = '\x1b[46m',
  BgWhite = '\x1b[47m',
  BgGray = '\x1b[100m',
}

/**
 * Options for the ConsoleTransport
 */
export interface ConsoleTransportOptions {
  /** Formatter to use for log entries */
  formatter: Formatter;
  /** Minimum log level to write */
  minLevel?: LogLevel;
  /** Whether to use colors in the output */
  colorize?: boolean;
  /** Whether to include timestamps in the output */
  timestamp?: boolean;
  /** Whether to pretty-print objects */
  prettyPrint?: boolean;
  /** Buffer size for batched writes */
  bufferSize?: number;
  /** Flush interval in milliseconds */
  flushInterval?: number;
  /** Whether to use stderr for error and fatal logs */
  useStderr?: boolean;
  /** Whether to include the log level in the output */
  showLevel?: boolean;
  /** Whether to include the context in the output */
  showContext?: boolean;
  /** Whether to include metadata in the output */
  showMeta?: boolean;
}

/**
 * Default options for the ConsoleTransport
 */
const DEFAULT_OPTIONS: Partial<ConsoleTransportOptions> = {
  minLevel: LogLevel.DEBUG,
  colorize: true,
  timestamp: true,
  prettyPrint: true,
  bufferSize: 10, // Small buffer size for console output
  flushInterval: 100, // Flush frequently for console output
  useStderr: true,
  showLevel: true,
  showContext: true,
  showMeta: true,
};

/**
 * A transport that writes log entries to the console with support for
 * colorized output, pretty-printing, and batching.
 * 
 * This transport is primarily intended for development environments where
 * human-readable logs are more important than machine-parseable formats.
 * 
 * Features:
 * - Colorized output based on log levels
 * - Pretty-printing of objects and errors
 * - Configurable formatting options
 * - Batching support for improved performance
 * - Console-specific error handling
 * 
 * @example
 * ```typescript
 * const textFormatter = new TextFormatter();
 * const consoleTransport = new ConsoleTransport({
 *   formatter: textFormatter,
 *   colorize: true,
 *   prettyPrint: true,
 * });
 * 
 * const logger = new Logger({
 *   transports: [consoleTransport],
 *   level: LogLevel.DEBUG,
 * });
 * ```
 */
export class ConsoleTransport extends EventEmitter implements Transport {
  private options: ConsoleTransportOptions;
  private buffer: Array<{ level: LogLevel; message: string; meta?: Record<string, any> }> = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private writing = false;
  private closed = false;

  /**
   * Creates a new ConsoleTransport instance
   * @param options Options for the transport
   */
  constructor(options: ConsoleTransportOptions) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.startFlushTimer();
  }

  /**
   * Writes a log entry to the transport
   * @param level Log level
   * @param message Log message
   * @param meta Additional metadata
   */
  public async write(level: LogLevel, message: string, meta?: Record<string, any>): Promise<void> {
    if (this.closed) {
      throw new Error('Cannot write to closed transport');
    }

    if (level < (this.options.minLevel || LogLevel.DEBUG)) {
      return;
    }

    try {
      this.addToBuffer(level, message, meta);
    } catch (err) {
      this.emit('error', err);
    }
  }

  /**
   * Closes the transport and flushes any pending writes
   */
  public async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush any remaining logs
    await this.flush();
  }

  /**
   * Starts the flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        this.emit('error', err);
      });
    }, this.options.flushInterval);
  }

  /**
   * Adds a log entry to the buffer
   * @param level Log level
   * @param message Log message
   * @param meta Additional metadata
   */
  private addToBuffer(level: LogLevel, message: string, meta?: Record<string, any>): void {
    this.buffer.push({ level, message, meta });

    // Flush if buffer exceeds size threshold
    if (this.buffer.length >= (this.options.bufferSize || 10)) {
      this.flush().catch((err) => {
        this.emit('error', err);
      });
    }
  }

  /**
   * Flushes the buffer to the console
   */
  private async flush(): Promise<void> {
    if (this.writing || this.buffer.length === 0) {
      return;
    }

    this.writing = true;
    const bufferToWrite = [...this.buffer];
    this.buffer = [];

    try {
      for (const entry of bufferToWrite) {
        const formattedLog = this.options.formatter.format({
          level: entry.level,
          message: entry.message,
          timestamp: new Date(),
          meta: entry.meta || {},
        });

        this.writeToConsole(entry.level, formattedLog);
      }

      this.emit('flush', bufferToWrite.length);
    } catch (err) {
      // Put the logs back in the buffer to try again later
      this.buffer = [...bufferToWrite, ...this.buffer];
      this.emit('error', new Error(`Failed to flush logs: ${err.message}`));
    } finally {
      this.writing = false;
    }
  }

  /**
   * Writes a formatted log entry to the console with appropriate colors
   * @param level Log level
   * @param formattedLog Formatted log entry
   */
  private writeToConsole(level: LogLevel, formattedLog: string | object): void {
    // Convert object to string if necessary
    const logString = typeof formattedLog === 'string'
      ? formattedLog
      : this.options.prettyPrint
        ? JSON.stringify(formattedLog, null, 2)
        : JSON.stringify(formattedLog);

    // Apply colors based on log level if colorize is enabled
    const colorizedLog = this.options.colorize
      ? this.colorizeByLevel(level, logString)
      : logString;

    // Use stderr for ERROR and FATAL levels if useStderr is enabled
    if (this.options.useStderr && (level === LogLevel.ERROR || level === LogLevel.FATAL)) {
      console.error(colorizedLog);
    } else {
      console.log(colorizedLog);
    }
  }

  /**
   * Applies color to a log string based on its level
   * @param level Log level
   * @param logString Log string to colorize
   * @returns Colorized log string
   */
  private colorizeByLevel(level: LogLevel, logString: string): string {
    let color: string;

    switch (level) {
      case LogLevel.DEBUG:
        color = ConsoleColors.FgGray;
        break;
      case LogLevel.INFO:
        color = ConsoleColors.FgGreen;
        break;
      case LogLevel.WARN:
        color = ConsoleColors.FgYellow;
        break;
      case LogLevel.ERROR:
        color = ConsoleColors.FgRed;
        break;
      case LogLevel.FATAL:
        color = `${ConsoleColors.BgRed}${ConsoleColors.FgWhite}${ConsoleColors.Bright}`;
        break;
      default:
        color = ConsoleColors.Reset;
    }

    return `${color}${logString}${ConsoleColors.Reset}`;
  }
}