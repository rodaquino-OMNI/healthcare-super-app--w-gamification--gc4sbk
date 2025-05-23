import * as chalk from 'chalk';
import { LogEntry } from '../interfaces/log-entry.interface';
import { LogLevel } from '../interfaces/log-level.enum';
import { Transport } from '../interfaces/transport.interface';

/**
 * Configuration options for the ConsoleTransport
 */
export interface ConsoleTransportOptions {
  /**
   * Whether to colorize the output based on log level
   * @default true
   */
  colorize?: boolean;

  /**
   * Whether to include timestamps in the output
   * @default true
   */
  timestamp?: boolean;

  /**
   * Format for timestamps
   * @default 'HH:mm:ss.SSS'
   */
  timestampFormat?: string;

  /**
   * Whether to include the log level in the output
   * @default true
   */
  showLevel?: boolean;

  /**
   * Whether to include the context in the output
   * @default true
   */
  showContext?: boolean;

  /**
   * Whether to pretty-print JSON objects in the output
   * @default true in development, false in production
   */
  prettyPrint?: boolean;

  /**
   * Number of spaces to use for indentation when pretty-printing
   * @default 2
   */
  prettyPrintIndent?: number;

  /**
   * Maximum batch size for console output
   * @default 100
   */
  batchSize?: number;

  /**
   * Maximum interval in milliseconds to wait before flushing the batch
   * @default 1000
   */
  batchInterval?: number;

  /**
   * Whether to use stderr for error and fatal logs
   * @default true
   */
  useStderr?: boolean;
}

/**
 * Implementation of the Transport interface for console-based logging.
 * Provides features like colorized output, configurable formatting,
 * and batching for improved performance.
 */
export class ConsoleTransport implements Transport {
  private options: ConsoleTransportOptions;
  private logBatch: LogEntry[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private initialized = false;
  private shuttingDown = false;

  // Color mapping for different log levels
  private readonly levelColors = {
    [LogLevel.DEBUG]: chalk.cyan,
    [LogLevel.INFO]: chalk.green,
    [LogLevel.WARN]: chalk.yellow,
    [LogLevel.ERROR]: chalk.red,
    [LogLevel.FATAL]: chalk.bgRed.white,
  };

  /**
   * Creates a new ConsoleTransport instance
   * @param options Configuration options for the console transport
   */
  constructor(options: ConsoleTransportOptions = {}) {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    this.options = {
      colorize: options.colorize !== undefined ? options.colorize : true,
      timestamp: options.timestamp !== undefined ? options.timestamp : true,
      timestampFormat: options.timestampFormat || 'HH:mm:ss.SSS',
      showLevel: options.showLevel !== undefined ? options.showLevel : true,
      showContext: options.showContext !== undefined ? options.showContext : true,
      prettyPrint: options.prettyPrint !== undefined ? options.prettyPrint : isDevelopment,
      prettyPrintIndent: options.prettyPrintIndent || 2,
      batchSize: options.batchSize || 100,
      batchInterval: options.batchInterval || 1000,
      useStderr: options.useStderr !== undefined ? options.useStderr : true,
    };
  }

  /**
   * Initializes the console transport
   */
  public async initialize(): Promise<void> {
    this.initialized = true;
  }

  /**
   * Writes a log entry to the console
   * @param entry The log entry to write
   */
  public async write(entry: LogEntry): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.shuttingDown) {
      throw new Error('Cannot write to transport during shutdown');
    }

    // Add the log entry to the batch
    this.logBatch.push(entry);

    // If we've reached the batch size, flush the batch immediately
    if (this.logBatch.length >= this.options.batchSize!) {
      await this.flushBatch();
      return;
    }

    // Otherwise, set a timer to flush the batch after the batch interval
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushBatch(), this.options.batchInterval!);
    }
  }

  /**
   * Flushes the current batch of log entries to the console
   */
  private async flushBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.logBatch.length === 0) {
      return;
    }

    const batch = [...this.logBatch];
    this.logBatch = [];

    try {
      for (const entry of batch) {
        this.writeToConsole(entry);
      }
    } catch (error) {
      console.error('Failed to write logs to console:', error);
      throw error;
    }
  }

  /**
   * Writes a single log entry to the console
   * @param entry The log entry to write
   */
  private writeToConsole(entry: LogEntry): void {
    try {
      const formattedEntry = this.formatEntry(entry);
      const isErrorOrFatal = entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL;
      
      // Use stderr for error and fatal logs if configured
      if (isErrorOrFatal && this.options.useStderr) {
        process.stderr.write(formattedEntry + '\n');
      } else {
        process.stdout.write(formattedEntry + '\n');
      }
    } catch (error) {
      // If formatting or writing fails, try a simpler approach
      console.error('Failed to format log entry:', error);
      console.error('Original log entry:', JSON.stringify(entry));
    }
  }

  /**
   * Formats a log entry for console output
   * @param entry The log entry to format
   */
  private formatEntry(entry: LogEntry): string {
    try {
      let result = '';

      // Add timestamp if enabled
      if (this.options.timestamp) {
        const timestamp = this.formatTimestamp(entry.timestamp);
        result += this.options.colorize ? chalk.gray(timestamp) : timestamp;
        result += ' ';
      }

      // Add log level if enabled
      if (this.options.showLevel) {
        const levelString = LogLevel[entry.level].padEnd(5);
        result += this.options.colorize 
          ? this.levelColors[entry.level](levelString)
          : levelString;
        result += ' ';
      }

      // Add context if enabled and available
      if (this.options.showContext && entry.context) {
        let contextStr = '';
        
        // Handle different context types
        if (typeof entry.context === 'string') {
          contextStr = `[${entry.context}]`;
        } else if (entry.context.service) {
          contextStr = `[${entry.context.service}]`;
          
          // Add journey context if available
          if (entry.context.journey) {
            contextStr += `[${entry.context.journey}]`;
          }
          
          // Add request ID if available
          if (entry.context.requestId) {
            contextStr += `[${entry.context.requestId.substring(0, 8)}]`;
          }
        }
        
        result += this.options.colorize ? chalk.blue(contextStr) : contextStr;
        result += ' ';
      }

      // Add the message
      result += entry.message;

      // Add metadata if available
      if (entry.metadata && Object.keys(entry.metadata).length > 0) {
        const metadataStr = this.options.prettyPrint
          ? JSON.stringify(entry.metadata, null, this.options.prettyPrintIndent)
          : JSON.stringify(entry.metadata);
        
        result += ' ' + metadataStr;
      }

      // Add error if available
      if (entry.error) {
        let errorStr = '';
        
        if (typeof entry.error === 'string') {
          errorStr = entry.error;
        } else if (entry.error instanceof Error) {
          errorStr = `${entry.error.name}: ${entry.error.message}`;
          if (entry.error.stack) {
            errorStr += '\n' + entry.error.stack;
          }
        } else {
          errorStr = JSON.stringify(entry.error, null, this.options.prettyPrintIndent);
        }
        
        result += '\n' + (this.options.colorize ? chalk.red(errorStr) : errorStr);
      }

      return result;
    } catch (error) {
      // If formatting fails, return a simple stringified version of the entry
      return `[FORMATTING ERROR] ${JSON.stringify(entry)}`;
    }
  }

  /**
   * Formats a timestamp according to the configured format
   * @param date The date to format
   */
  private formatTimestamp(date: Date): string {
    try {
      // Simple timestamp formatter that handles common formats
      const format = this.options.timestampFormat!;
      
      // Get components
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      // Replace format tokens
      return format
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
        .replace('SSS', milliseconds)
        .replace('DD', day)
        .replace('MM', month)
        .replace('YYYY', year.toString());
    } catch (error) {
      // If formatting fails, return ISO string
      return date.toISOString();
    }
  }

  /**
   * Closes the transport and flushes any pending logs
   */
  public async close(): Promise<void> {
    this.shuttingDown = true;

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.logBatch.length > 0) {
      await this.flushBatch();
    }
  }
}