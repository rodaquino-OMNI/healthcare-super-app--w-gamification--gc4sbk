import { LogEntry } from '../interfaces/log-entry.interface';
import { LogLevel } from '../interfaces/log-level.enum';
import { Formatter } from './formatter.interface';

/**
 * Text formatter that transforms log entries into human-readable text format.
 * This formatter is optimized for local development and debugging.
 */
export class TextFormatter implements Formatter {
  /**
   * Whether to use colors in the output
   */
  private readonly useColors: boolean;

  /**
   * Creates a new text formatter
   * @param useColors Whether to use colors in the output (defaults to true)
   */
  constructor(useColors = true) {
    this.useColors = useColors;
  }

  /**
   * Formats a log entry into a human-readable text string.
   * @param entry The log entry to format
   * @returns The formatted log entry as a string
   */
  format(entry: LogEntry): string {
    // Format timestamp
    const timestamp = this.formatTimestamp(entry.timestamp);
    
    // Format log level with color if enabled
    const level = this.formatLevel(entry.level);
    
    // Format context
    const context = this.formatContext(entry);
    
    // Format message
    const message = entry.message;
    
    // Format journey information if available
    const journey = this.formatJourney(entry);
    
    // Format error information if available
    const error = this.formatError(entry);
    
    // Combine all parts
    let formattedEntry = `${timestamp} ${level} ${context}${journey ? ` [${journey}]` : ''}: ${message}`;
    
    // Add error information if available
    if (error) {
      formattedEntry += `\n${error}`;
    }
    
    // Add metadata if available
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      formattedEntry += `\n${this.formatObject('Metadata', entry.metadata)}`;
    }
    
    return formattedEntry;
  }

  /**
   * Formats a timestamp into a human-readable string.
   * @param timestamp The timestamp to format
   * @returns The formatted timestamp
   */
  private formatTimestamp(timestamp: Date): string {
    return timestamp.toISOString();
  }

  /**
   * Formats a log level with color if enabled.
   * @param level The log level to format
   * @returns The formatted log level
   */
  private formatLevel(level: LogLevel): string {
    const levelStr = level.toString().toUpperCase().padEnd(5);
    
    if (!this.useColors) {
      return levelStr;
    }
    
    // Add color based on log level
    switch (level) {
      case LogLevel.DEBUG:
        return this.colorize(levelStr, '\x1b[34m'); // Blue
      case LogLevel.INFO:
        return this.colorize(levelStr, '\x1b[32m'); // Green
      case LogLevel.WARN:
        return this.colorize(levelStr, '\x1b[33m'); // Yellow
      case LogLevel.ERROR:
        return this.colorize(levelStr, '\x1b[31m'); // Red
      case LogLevel.FATAL:
        return this.colorize(levelStr, '\x1b[35m'); // Magenta
      default:
        return levelStr;
    }
  }

  /**
   * Formats the context information from a log entry.
   * @param entry The log entry to format context from
   * @returns The formatted context
   */
  private formatContext(entry: LogEntry): string {
    const parts: string[] = [];
    
    // Add service name if available
    if (entry.serviceName) {
      parts.push(entry.serviceName);
    }
    
    // Add context if available
    if (entry.context) {
      parts.push(entry.context);
    }
    
    // Add request ID if available
    if (entry.requestId) {
      parts.push(`req:${entry.requestId}`);
    }
    
    // Add user ID if available
    if (entry.userId) {
      parts.push(`user:${entry.userId}`);
    }
    
    // Add trace ID if available
    if (entry.traceId) {
      parts.push(`trace:${entry.traceId}`);
    }
    
    return parts.join(' ');
  }

  /**
   * Formats journey information from a log entry.
   * @param entry The log entry to format journey from
   * @returns The formatted journey information or undefined if not available
   */
  private formatJourney(entry: LogEntry): string | undefined {
    if (!entry.journey) {
      return undefined;
    }
    
    const parts: string[] = [entry.journey.type];
    
    // Add resource ID if available
    if (entry.journey.resourceId) {
      parts.push(`id:${entry.journey.resourceId}`);
    }
    
    // Add action if available
    if (entry.journey.action) {
      parts.push(`action:${entry.journey.action}`);
    }
    
    return parts.join(' ');
  }

  /**
   * Formats error information from a log entry.
   * @param entry The log entry to format error from
   * @returns The formatted error information or undefined if not available
   */
  private formatError(entry: LogEntry): string | undefined {
    if (!entry.error) {
      return undefined;
    }
    
    let errorStr = '';
    
    // Add error name and message
    const errorName = entry.error.name || 'Error';
    errorStr += this.useColors ? this.colorize(`${errorName}: ${entry.error.message}`, '\x1b[31m') : `${errorName}: ${entry.error.message}`;
    
    // Add error code if available
    if (entry.error.code) {
      errorStr += `\nCode: ${entry.error.code}`;
    }
    
    // Add stack trace if available
    if (entry.error.stack) {
      errorStr += `\n${entry.error.stack}`;
    }
    
    return errorStr;
  }

  /**
   * Formats an object for human-readable output.
   * @param label The label for the object
   * @param obj The object to format
   * @returns The formatted object
   */
  private formatObject(label: string, obj: Record<string, any>): string {
    try {
      return `${label}:\n${JSON.stringify(obj, null, 2)}`;
    } catch (error) {
      return `${label}: [Object cannot be stringified]`;
    }
  }

  /**
   * Adds color to a string if colors are enabled.
   * @param str The string to colorize
   * @param colorCode The ANSI color code to use
   * @returns The colorized string
   */
  private colorize(str: string, colorCode: string): string {
    return `${colorCode}${str}\x1b[0m`;
  }
}