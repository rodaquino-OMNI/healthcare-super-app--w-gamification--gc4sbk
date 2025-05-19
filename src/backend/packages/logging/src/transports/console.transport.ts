import { Transport } from '../interfaces/transport.interface';
import { LogEntry } from '../interfaces/log-entry.interface';
import { LogLevel } from '../interfaces/log-level.enum';
import * as util from 'util';

/**
 * Configuration options for the ConsoleTransport
 */
export interface ConsoleTransportOptions {
  /** Minimum log level to write to this transport */
  level?: LogLevel;
  /** Whether to use colors in the console output */
  colorize?: boolean;
  /** Whether to include timestamps in the output */
  timestamp?: boolean;
  /** Whether to batch log entries for better performance */
  batching?: boolean;
  /** Maximum number of log entries to batch before writing */
  batchSize?: number;
  /** Maximum time in milliseconds to wait before flushing the batch */
  batchTimeout?: number;
  /** Whether to include the log level in the output */
  showLevel?: boolean;
  /** Whether to include the context in the output */
  showContext?: boolean;
  /** Whether to pretty-print objects and errors */
  prettyPrint?: boolean;
  /** Whether to use stderr for error and fatal logs */
  stderrLevels?: LogLevel[];
  /** Whether to align log level labels for better readability */
  alignLevel?: boolean;
  /** Whether to include journey information in the output */
  showJourney?: boolean;
  /** Whether to include trace IDs in the output */
  showTraceId?: boolean;
}

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
  
  Black = '\x1b[30m',
  Red = '\x1b[31m',
  Green = '\x1b[32m',
  Yellow = '\x1b[33m',
  Blue = '\x1b[34m',
  Magenta = '\x1b[35m',
  Cyan = '\x1b[36m',
  White = '\x1b[37m',
  
  BgBlack = '\x1b[40m',
  BgRed = '\x1b[41m',
  BgGreen = '\x1b[42m',
  BgYellow = '\x1b[43m',
  BgBlue = '\x1b[44m',
  BgMagenta = '\x1b[45m',
  BgCyan = '\x1b[46m',
  BgWhite = '\x1b[47m'
}

/**
 * ConsoleTransport implementation that writes log entries to the console with
 * support for colorized output, batching, and configurable formatting.
 * 
 * This transport is primarily used in development environments to provide
 * human-readable, colorized logs for debugging and local development.
 * 
 * Features:
 * - Colorized output based on log levels
 * - Configurable formatting options
 * - Support for batching to improve performance
 * - Journey-specific context display
 * - Integration with distributed tracing
 * - Pretty-printing of objects and errors
 */
export class ConsoleTransport implements Transport {
  private options: Required<ConsoleTransportOptions>;
  private batchedLogs: LogEntry[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private initialized: boolean = false;
  private shuttingDown: boolean = false;

  /**
   * Creates a new ConsoleTransport instance
   * @param options Configuration options for the console transport
   */
  constructor(options?: ConsoleTransportOptions) {
    this.options = {
      level: (options?.level !== undefined) ? options.level : LogLevel.DEBUG,
      colorize: options?.colorize !== false,
      timestamp: options?.timestamp !== false,
      batching: options?.batching || false,
      batchSize: options?.batchSize || 10,
      batchTimeout: options?.batchTimeout || 1000,
      showLevel: options?.showLevel !== false,
      showContext: options?.showContext !== false,
      prettyPrint: options?.prettyPrint !== false,
      stderrLevels: options?.stderrLevels || [LogLevel.ERROR, LogLevel.FATAL],
      alignLevel: options?.alignLevel !== false,
      showJourney: options?.showJourney !== false,
      showTraceId: options?.showTraceId !== false
    };

    // Register process exit handlers to ensure proper cleanup
    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  /**
   * Initializes the transport
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // No special initialization needed for console transport
    this.initialized = true;
  }

  /**
   * Writes a log entry to the console
   * @param entry The log entry to write
   */
  public async write(entry: LogEntry): Promise<void> {
    // Skip if log level is below the configured level
    if (entry.level < this.options.level) {
      return;
    }

    // Ensure transport is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      if (this.options.batching) {
        // Add to batch and schedule flush if needed
        this.batchedLogs.push(entry);
        
        if (this.batchedLogs.length >= this.options.batchSize) {
          this.flushBatch();
        } else if (!this.batchTimer) {
          // Start a timer to flush the batch after the timeout
          this.batchTimer = setTimeout(() => this.flushBatch(), this.options.batchTimeout);
        }
      } else {
        // Write immediately
        this.writeToConsole(entry);
      }
    } catch (error) {
      // Handle errors but don't throw to avoid crashing the application
      console.error(`Error writing to console: ${error.message}`);
    }
  }

  /**
   * Cleans up resources used by the transport
   */
  public async cleanup(): Promise<void> {
    if (this.shuttingDown) {
      return;
    }

    this.shuttingDown = true;

    // Flush any remaining logs
    if (this.batchedLogs.length > 0) {
      this.flushBatch();
    }

    // Clear any timers
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    this.initialized = false;
    this.shuttingDown = false;
  }

  /**
   * Flushes the batch of log entries to the console
   */
  private flushBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Write all batched logs
    for (const entry of this.batchedLogs) {
      this.writeToConsole(entry);
    }

    // Clear the batch
    this.batchedLogs = [];
  }

  /**
   * Writes a single log entry to the console
   * @param entry The log entry to write
   */
  private writeToConsole(entry: LogEntry): void {
    // Determine whether to use stdout or stderr
    const useStderr = this.options.stderrLevels.includes(entry.level);
    const logMethod = useStderr ? console.error : console.log;

    // Use the formatted message directly if available
    if (entry.formattedMessage) {
      if (this.options.colorize) {
        const colorizedMessage = this.colorizeByLevel(entry.level, entry.formattedMessage);
        logMethod(colorizedMessage);
      } else {
        logMethod(entry.formattedMessage);
      }
      return;
    }

    // Otherwise, format the message ourselves
    let output = '';

    // Add timestamp if configured
    if (this.options.timestamp) {
      const timestamp = new Date().toISOString();
      output += `[${timestamp}] `;
    }

    // Add log level if configured
    if (this.options.showLevel) {
      const levelStr = LogLevel[entry.level];
      if (this.options.alignLevel) {
        // Pad the level string to ensure consistent width
        const paddedLevel = levelStr.padEnd(5, ' ');
        output += `[${paddedLevel}] `;
      } else {
        output += `[${levelStr}] `;
      }
    }

    // Add the message
    output += entry.message;
    
    // Add journey information if available and configured
    if (this.options.showJourney && entry.journey) {
      output += ` [Journey: ${entry.journey}]`;
    }
    
    // Add trace ID if available and configured
    if (this.options.showTraceId && entry.traceId) {
      output += ` [TraceID: ${entry.traceId}]`;
    }

    // Add context if available and configured
    if (entry.context && this.options.showContext) {
      let contextStr;
      if (this.options.prettyPrint) {
        // Use util.inspect for better object formatting
        contextStr = util.inspect(entry.context, {
          colors: this.options.colorize,
          depth: 4,
          compact: false
        });
      } else {
        contextStr = JSON.stringify(entry.context);
      }
      output += ` ${contextStr}`;
    }

    // Add metadata if available
    if (entry.metadata) {
      let metadataStr;
      if (this.options.prettyPrint) {
        metadataStr = util.inspect(entry.metadata, {
          colors: this.options.colorize,
          depth: 4,
          compact: false
        });
      } else {
        metadataStr = JSON.stringify(entry.metadata);
      }
      output += ` ${metadataStr}`;
    }

    // Add error if available
    if (entry.error) {
      if (this.options.prettyPrint) {
        output += '\n' + this.formatError(entry.error);
      } else {
        output += `\n${entry.error.stack || entry.error.message}`;
      }
    }

    // Colorize if configured
    if (this.options.colorize) {
      output = this.colorizeByLevel(entry.level, output);
    }

    // Write to console
    logMethod(output);
  }
  
  /**
   * Formats an error object for better readability
   * @param error The error to format
   * @returns Formatted error string
   */
  private formatError(error: Error): string {
    if (!error) {
      return '';
    }
    
    let result = error.stack || error.toString();
    
    // Add cause if available (Node.js 16.9.0+)
    if ('cause' in error && error.cause instanceof Error) {
      result += '\nCaused by: ' + this.formatError(error.cause);
    }
    
    return result;
  }

  /**
   * Colorizes a message based on the log level
   * @param level The log level
   * @param message The message to colorize
   * @returns The colorized message
   */
  private colorizeByLevel(level: LogLevel, message: string): string {
    let color: ConsoleColors;
    let levelColor: ConsoleColors;

    // Set colors based on log level
    switch (level) {
      case LogLevel.DEBUG:
        color = ConsoleColors.Cyan;
        levelColor = ConsoleColors.Bright + ConsoleColors.Cyan;
        break;
      case LogLevel.INFO:
        color = ConsoleColors.Green;
        levelColor = ConsoleColors.Bright + ConsoleColors.Green;
        break;
      case LogLevel.WARN:
        color = ConsoleColors.Yellow;
        levelColor = ConsoleColors.Bright + ConsoleColors.Yellow;
        break;
      case LogLevel.ERROR:
        color = ConsoleColors.Red;
        levelColor = ConsoleColors.Bright + ConsoleColors.Red;
        break;
      case LogLevel.FATAL:
        color = ConsoleColors.Bright + ConsoleColors.Red;
        levelColor = ConsoleColors.Bright + ConsoleColors.BgRed + ConsoleColors.White;
        break;
      default:
        color = ConsoleColors.White;
        levelColor = ConsoleColors.White;
    }

    // Highlight level labels with a brighter color
    const levelRegex = /\[(DEBUG|INFO|WARN|ERROR|FATAL)\]/g;
    const highlightedMessage = message.replace(levelRegex, (match) => {
      return `${levelColor}${match}${ConsoleColors.Reset}${color}`;
    });

    // Highlight journey and trace information
    const journeyRegex = /\[Journey: ([^\]]*)\]/g;
    const traceRegex = /\[TraceID: ([^\]]*)\]/g;
    
    const journeyHighlighted = highlightedMessage.replace(journeyRegex, (match, journey) => {
      return `${ConsoleColors.Bright + ConsoleColors.Magenta}[Journey: ${journey}]${ConsoleColors.Reset}${color}`;
    });
    
    const traceHighlighted = journeyHighlighted.replace(traceRegex, (match, traceId) => {
      return `${ConsoleColors.Bright + ConsoleColors.Blue}[TraceID: ${traceId}]${ConsoleColors.Reset}${color}`;
    });

    return `${color}${traceHighlighted}${ConsoleColors.Reset}`;
  }
}