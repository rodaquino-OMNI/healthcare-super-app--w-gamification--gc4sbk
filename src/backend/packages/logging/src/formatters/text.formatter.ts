import { LogEntry, JourneyType } from '../interfaces/log-entry.interface';
import { LogLevel, LogLevelUtils } from '../interfaces/log-level.enum';
import { Formatter } from './formatter.interface';

/**
 * Text formatter that transforms log entries into human-readable text format.
 * This formatter is optimized for local development and debugging, with color coding
 * and pretty-printing of complex objects.
 */
export class TextFormatter implements Formatter {
  /**
   * ANSI color codes for different log levels
   */
  private readonly colors = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    bright: '\x1b[1m',
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
    fatal: '\x1b[35m', // Magenta
    timestamp: '\x1b[90m', // Gray
    context: '\x1b[1;34m', // Bright Blue
    journey: {
      [JourneyType.HEALTH]: '\x1b[1;32m', // Bright Green
      [JourneyType.CARE]: '\x1b[1;36m',  // Bright Cyan
      [JourneyType.PLAN]: '\x1b[1;33m',  // Bright Yellow
    },
  };

  /**
   * Whether to use colors in the output
   */
  private readonly useColors: boolean;

  /**
   * Creates a new TextFormatter instance.
   * @param options Configuration options for the formatter
   */
  constructor(options: { useColors?: boolean } = {}) {
    this.useColors = options.useColors ?? process.stdout.isTTY;
  }

  /**
   * Formats a log entry into a human-readable text string.
   * @param entry The log entry to format
   * @returns The formatted log entry as a string
   */
  format(entry: LogEntry): string {
    const { message, level, timestamp, context, journey } = entry;
    const levelString = LogLevelUtils.toString(level).toUpperCase();
    
    // Format the timestamp
    const formattedTimestamp = this.formatTimestamp(timestamp);
    
    // Format the level with appropriate color
    const formattedLevel = this.colorize(
      this.padRight(levelString, 5),
      this.getLevelColor(level)
    );
    
    // Format the context
    const formattedContext = context 
      ? this.colorize(`[${context}]`, this.colors.context) 
      : '';
    
    // Format the journey if available
    const formattedJourney = journey 
      ? this.colorize(`[${journey.type.toUpperCase()}]`, this.getJourneyColor(journey.type)) 
      : '';
    
    // Build the log header
    const header = [
      this.colorize(formattedTimestamp, this.colors.timestamp),
      formattedLevel,
      formattedContext,
      formattedJourney,
    ].filter(Boolean).join(' ');
    
    // Format the message
    let formattedMessage = message;
    
    // Format additional context data if available
    const details: string[] = [];
    
    // Add request information if available
    if (entry.requestId || entry.userId || entry.sessionId) {
      const requestInfo: string[] = [];
      if (entry.requestId) requestInfo.push(`Request ID: ${entry.requestId}`);
      if (entry.userId) requestInfo.push(`User ID: ${entry.userId}`);
      if (entry.sessionId) requestInfo.push(`Session ID: ${entry.sessionId}`);
      
      details.push(requestInfo.join(' | '));
    }
    
    // Add trace information if available
    if (entry.traceId) {
      details.push(`Trace ID: ${entry.traceId}`);
    }
    
    // Add journey details if available
    if (journey?.resourceId || journey?.action) {
      const journeyDetails: string[] = [];
      if (journey.resourceId) journeyDetails.push(`Resource: ${journey.resourceId}`);
      if (journey.action) journeyDetails.push(`Action: ${journey.action}`);
      
      details.push(journeyDetails.join(' | '));
    }
    
    // Format context data if available
    if (entry.contextData && Object.keys(entry.contextData).length > 0) {
      details.push(this.formatObject('Context Data', entry.contextData));
    }
    
    // Format journey data if available
    if (journey?.data && Object.keys(journey.data).length > 0) {
      details.push(this.formatObject('Journey Data', journey.data));
    }
    
    // Format error if available
    if (entry.error) {
      details.push(this.formatError(entry.error));
    }
    
    // Format metadata if available
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      details.push(this.formatObject('Metadata', entry.metadata));
    }
    
    // Combine all parts
    let result = `${header} ${formattedMessage}`;
    
    // Add details with proper indentation
    if (details.length > 0) {
      const indent = ' '.repeat(formattedTimestamp.length + 7); // Timestamp + level + space
      result += '\n' + details.map(detail => `${indent}${detail}`).join('\n');
    }
    
    return result;
  }
  
  /**
   * Formats a timestamp into a human-readable string.
   * @param timestamp The timestamp to format
   * @returns The formatted timestamp
   */
  private formatTimestamp(timestamp: Date): string {
    const year = timestamp.getFullYear();
    const month = this.padLeft(timestamp.getMonth() + 1, 2, '0');
    const day = this.padLeft(timestamp.getDate(), 2, '0');
    const hours = this.padLeft(timestamp.getHours(), 2, '0');
    const minutes = this.padLeft(timestamp.getMinutes(), 2, '0');
    const seconds = this.padLeft(timestamp.getSeconds(), 2, '0');
    const milliseconds = this.padLeft(timestamp.getMilliseconds(), 3, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }
  
  /**
   * Formats an object for display in the log.
   * @param label The label for the object
   * @param obj The object to format
   * @returns The formatted object as a string
   */
  private formatObject(label: string, obj: Record<string, any>): string {
    try {
      // Create a WeakSet to track circular references
      const seen = new WeakSet();
      const formatted = JSON.stringify(obj, (key, value) => this.jsonReplacer(key, value, seen), 2);
      return `${label}:\n${this.indentLines(formatted, 2)}`;
    } catch (error) {
      return `${label}: [Error formatting object: ${(error as Error).message}]`;
    }
  }
  
  /**
   * Formats an error object for display in the log.
   * @param error The error to format
   * @returns The formatted error as a string
   */
  private formatError(error: LogEntry['error']): string {
    if (!error) return '';
    
    const parts: string[] = [];
    
    // Add error name and message
    const errorName = error.name || 'Error';
    parts.push(this.colorize(`${errorName}: ${error.message}`, this.colors.error));
    
    // Add error code if available
    if (error.code) {
      parts.push(`Code: ${error.code}`);
    }
    
    // Add error flags if available
    const flags: string[] = [];
    if (error.isTransient) flags.push('Transient');
    if (error.isClientError) flags.push('Client Error');
    if (error.isExternalError) flags.push('External Error');
    
    if (flags.length > 0) {
      parts.push(`Flags: ${flags.join(', ')}`);
    }
    
    // Add stack trace if available
    if (error.stack) {
      parts.push(`Stack Trace:\n${this.indentLines(error.stack, 2)}`);
    }
    
    return parts.join('\n');
  }
  
  /**
   * Indents each line of a multi-line string.
   * @param text The text to indent
   * @param spaces The number of spaces to indent by
   * @returns The indented text
   */
  private indentLines(text: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return text
      .split('\n')
      .map(line => `${indent}${line}`)
      .join('\n');
  }
  
  /**
   * Pads a string on the left with a specified character.
   * @param value The value to pad
   * @param length The desired length
   * @param char The character to pad with
   * @returns The padded string
   */
  private padLeft(value: number | string, length: number, char: string = ' '): string {
    return String(value).padStart(length, char);
  }
  
  /**
   * Pads a string on the right with a specified character.
   * @param value The value to pad
   * @param length The desired length
   * @param char The character to pad with
   * @returns The padded string
   */
  private padRight(value: string, length: number, char: string = ' '): string {
    return value.padEnd(length, char);
  }
  
  /**
   * Applies ANSI color codes to a string if colors are enabled.
   * @param text The text to colorize
   * @param color The ANSI color code to apply
   * @returns The colorized string
   */
  private colorize(text: string, color: string): string {
    if (!this.useColors) return text;
    return `${color}${text}${this.colors.reset}`;
  }
  
  /**
   * Gets the color for a log level.
   * @param level The log level
   * @returns The ANSI color code for the level
   */
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return this.colors.debug;
      case LogLevel.INFO: return this.colors.info;
      case LogLevel.WARN: return this.colors.warn;
      case LogLevel.ERROR: return this.colors.error;
      case LogLevel.FATAL: return this.colors.fatal;
      default: return this.colors.reset;
    }
  }
  
  /**
   * Gets the color for a journey type.
   * @param journeyType The journey type
   * @returns The ANSI color code for the journey type
   */
  private getJourneyColor(journeyType: JourneyType): string {
    return this.colors.journey[journeyType] || this.colors.reset;
  }
  
  /**
   * Custom replacer function for JSON.stringify to handle special cases.
   * @param key The current key being processed
   * @param value The current value being processed
   * @param seen WeakSet to track circular references
   * @returns The processed value
   */
  private jsonReplacer(key: string, value: any, seen: WeakSet<any>): any {
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    
    // Handle Error objects
    if (value instanceof Error) {
      return {
        message: value.message,
        name: value.name,
        stack: value.stack,
      };
    }
    
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Handle functions
    if (typeof value === 'function') {
      return '[Function]';
    }
    
    // Handle symbols
    if (typeof value === 'symbol') {
      return value.toString();
    }
    
    // Handle BigInt
    if (typeof value === 'bigint') {
      return value.toString();
    }
    
    return value;
  }
}