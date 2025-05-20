import { Formatter, LogEntry } from './formatter.interface';
import { LogLevel } from '../interfaces/log-level.enum';
import { formatError, formatTimestamp, formatValue } from '../utils/format.utils';

/**
 * ANSI color codes for terminal output
 */
enum Colors {
  RESET = '\x1b[0m',
  BRIGHT = '\x1b[1m',
  DIM = '\x1b[2m',
  UNDERSCORE = '\x1b[4m',
  BLINK = '\x1b[5m',
  REVERSE = '\x1b[7m',
  HIDDEN = '\x1b[8m',
  
  // Foreground colors
  FG_BLACK = '\x1b[30m',
  FG_RED = '\x1b[31m',
  FG_GREEN = '\x1b[32m',
  FG_YELLOW = '\x1b[33m',
  FG_BLUE = '\x1b[34m',
  FG_MAGENTA = '\x1b[35m',
  FG_CYAN = '\x1b[36m',
  FG_WHITE = '\x1b[37m',
  FG_GRAY = '\x1b[90m',
  
  // Background colors
  BG_BLACK = '\x1b[40m',
  BG_RED = '\x1b[41m',
  BG_GREEN = '\x1b[42m',
  BG_YELLOW = '\x1b[43m',
  BG_BLUE = '\x1b[44m',
  BG_MAGENTA = '\x1b[45m',
  BG_CYAN = '\x1b[46m',
  BG_WHITE = '\x1b[47m',
}

/**
 * Configuration options for the TextFormatter
 */
export interface TextFormatterOptions {
  /**
   * Whether to use colors in the output
   * @default true
   */
  colors?: boolean;
  
  /**
   * Whether to include timestamps in the output
   * @default true
   */
  timestamps?: boolean;
  
  /**
   * Whether to pretty-print objects and errors
   * @default true
   */
  prettyPrint?: boolean;
  
  /**
   * Maximum depth for object serialization
   * @default 3
   */
  maxDepth?: number;
  
  /**
   * Whether to include context information in the output
   * @default true
   */
  includeContext?: boolean;
}

/**
 * A human-readable text formatter for logs that's optimized for local development and debugging.
 * This formatter presents log entries with colors (when supported), proper indentation,
 * and clear visual separation of different components.
 */
export class TextFormatter implements Formatter {
  private readonly options: Required<TextFormatterOptions>;
  
  /**
   * Creates a new TextFormatter with the specified options
   * @param options Configuration options for the formatter
   */
  constructor(options: TextFormatterOptions = {}) {
    this.options = {
      colors: options.colors ?? true,
      timestamps: options.timestamps ?? true,
      prettyPrint: options.prettyPrint ?? true,
      maxDepth: options.maxDepth ?? 3,
      includeContext: options.includeContext ?? true,
    };
  }
  
  /**
   * Formats a log entry into a human-readable string representation
   * @param entry The log entry to format
   * @returns A formatted string representation of the log entry
   */
  format(entry: LogEntry): string {
    const { level, message, timestamp, error, context, ...rest } = entry;
    
    // Format the timestamp
    const formattedTimestamp = this.options.timestamps
      ? this.formatTimestamp(timestamp)
      : '';
    
    // Format the log level
    const formattedLevel = this.formatLevel(level);
    
    // Format the context
    const formattedContext = this.options.includeContext && context
      ? this.formatContext(context)
      : '';
    
    // Format the message
    const formattedMessage = this.colorize(message, this.getLevelColor(level));
    
    // Format any error
    const formattedError = error
      ? '\n' + this.formatError(error)
      : '';
    
    // Format additional properties
    const formattedProps = Object.keys(rest).length > 0
      ? '\n' + this.formatAdditionalProps(rest)
      : '';
    
    // Combine all parts
    return [
      formattedTimestamp,
      formattedLevel,
      formattedContext,
      formattedMessage,
      formattedError,
      formattedProps
    ].filter(Boolean).join(' ');
  }
  
  /**
   * Formats a timestamp for display
   * @param timestamp The timestamp to format
   * @returns Formatted timestamp string
   */
  private formatTimestamp(timestamp: string | number | Date): string {
    const date = new Date(timestamp);
    const isoString = formatTimestamp(date);
    
    // Format: [YYYY-MM-DD HH:MM:SS.mmm]
    const formatted = `[${isoString.replace('T', ' ').replace('Z', '')}]`;
    
    return this.colorize(formatted, Colors.FG_GRAY);
  }
  
  /**
   * Formats a log level for display
   * @param level The log level to format
   * @returns Formatted log level string
   */
  private formatLevel(level: LogLevel): string {
    const levelName = LogLevel[level];
    const paddedLevel = levelName.padEnd(5, ' ');
    const formatted = `[${paddedLevel}]`;
    
    return this.colorize(formatted, this.getLevelColor(level), true);
  }
  
  /**
   * Gets the color for a specific log level
   * @param level The log level
   * @returns The color code for the level
   */
  private getLevelColor(level: LogLevel): Colors {
    switch (level) {
      case LogLevel.DEBUG:
        return Colors.FG_CYAN;
      case LogLevel.INFO:
        return Colors.FG_GREEN;
      case LogLevel.WARN:
        return Colors.FG_YELLOW;
      case LogLevel.ERROR:
        return Colors.FG_RED;
      case LogLevel.FATAL:
        return Colors.BG_RED + Colors.FG_WHITE;
      default:
        return Colors.RESET;
    }
  }
  
  /**
   * Formats context information for display
   * @param context The context object
   * @returns Formatted context string
   */
  private formatContext(context: Record<string, any>): string {
    const parts: string[] = [];
    
    // Add service name if available
    if (context.service) {
      parts.push(this.colorize(`[${context.service}]`, Colors.FG_MAGENTA));
    }
    
    // Add journey if available
    if (context.journey) {
      parts.push(this.colorize(`[${context.journey}]`, Colors.FG_BLUE));
    }
    
    // Add request information if available
    if (context.request) {
      const req = context.request;
      
      if (req.id) {
        parts.push(this.colorize(`[req:${req.id}]`, Colors.FG_GRAY));
      }
      
      if (req.method && req.path) {
        parts.push(this.colorize(`[${req.method} ${req.path}]`, Colors.FG_GRAY));
      }
      
      if (req.userId) {
        parts.push(this.colorize(`[user:${req.userId}]`, Colors.FG_BLUE));
      }
      
      if (req.duration !== undefined) {
        parts.push(this.colorize(`[${req.duration}ms]`, Colors.FG_GRAY));
      }
    }
    
    // Add trace information if available
    if (context.trace?.id) {
      parts.push(this.colorize(`[trace:${context.trace.id}]`, Colors.FG_GRAY));
    }
    
    return parts.join(' ');
  }
  
  /**
   * Formats an error for display
   * @param error The error to format
   * @returns Formatted error string
   */
  private formatError(error: any): string {
    if (!error) {
      return '';
    }
    
    // If it's already a string, just return it
    if (typeof error === 'string') {
      return this.colorize(`Error: ${error}`, Colors.FG_RED);
    }
    
    // Format the error object
    const formattedError = formatError(error);
    
    // Create a readable representation
    let result = this.colorize(`Error: ${formattedError.name}: ${formattedError.message}`, Colors.FG_RED + Colors.BRIGHT);
    
    // Add stack trace if available
    if (formattedError.stack && Array.isArray(formattedError.stack)) {
      result += '\n' + this.colorize(formattedError.stack.map((line: string) => `  ${line}`).join('\n'), Colors.FG_GRAY);
    }
    
    // Add additional error properties
    const additionalProps = { ...formattedError };
    delete additionalProps.name;
    delete additionalProps.message;
    delete additionalProps.stack;
    
    if (Object.keys(additionalProps).length > 0) {
      result += '\n' + this.colorize('Additional error details:', Colors.FG_YELLOW);
      result += '\n' + this.formatObject(additionalProps, 1);
    }
    
    return result;
  }
  
  /**
   * Formats additional properties for display
   * @param props Additional properties to format
   * @returns Formatted properties string
   */
  private formatAdditionalProps(props: Record<string, any>): string {
    if (!props || Object.keys(props).length === 0) {
      return '';
    }
    
    return this.colorize('Additional properties:', Colors.FG_GRAY) + '\n' + this.formatObject(props, 1);
  }
  
  /**
   * Formats an object for display
   * @param obj The object to format
   * @param depth Current depth in the object tree
   * @returns Formatted object string
   */
  private formatObject(obj: Record<string, any>, depth = 0): string {
    if (!obj || typeof obj !== 'object') {
      return String(obj);
    }
    
    // Prevent excessive recursion
    if (depth > this.options.maxDepth) {
      return this.colorize('[Max Depth Exceeded]', Colors.FG_GRAY);
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return this.colorize('[]', Colors.FG_GRAY);
      }
      
      const indent = '  '.repeat(depth);
      const items = obj.map(item => {
        const formatted = typeof item === 'object' && item !== null
          ? this.formatObject(item, depth + 1)
          : this.formatValue(item);
        return `${indent}  ${formatted}`;
      }).join('\n');
      
      return `[\n${items}\n${indent}]`;
    }
    
    // Handle regular objects
    const indent = '  '.repeat(depth);
    const entries = Object.entries(obj).map(([key, value]) => {
      const formattedKey = this.colorize(key, Colors.FG_CYAN);
      const formattedValue = typeof value === 'object' && value !== null
        ? this.formatObject(value, depth + 1)
        : this.formatValue(value);
      return `${indent}  ${formattedKey}: ${formattedValue}`;
    }).join('\n');
    
    if (entries.length === 0) {
      return this.colorize('{}', Colors.FG_GRAY);
    }
    
    return `{\n${entries}\n${indent}}`;
  }
  
  /**
   * Formats a primitive value for display
   * @param value The value to format
   * @returns Formatted value string
   */
  private formatValue(value: any): string {
    if (value === undefined) {
      return this.colorize('undefined', Colors.FG_GRAY);
    }
    
    if (value === null) {
      return this.colorize('null', Colors.FG_GRAY);
    }
    
    if (typeof value === 'string') {
      return this.colorize(`"${value}"`, Colors.FG_GREEN);
    }
    
    if (typeof value === 'number') {
      return this.colorize(String(value), Colors.FG_YELLOW);
    }
    
    if (typeof value === 'boolean') {
      return this.colorize(String(value), Colors.FG_YELLOW);
    }
    
    if (typeof value === 'function') {
      return this.colorize(`[Function: ${value.name || 'anonymous'}]`, Colors.FG_GRAY);
    }
    
    if (value instanceof Date) {
      return this.colorize(value.toISOString(), Colors.FG_BLUE);
    }
    
    // Use formatValue from utils for other types
    return String(formatValue(value));
  }
  
  /**
   * Applies color to a string if colors are enabled
   * @param text The text to colorize
   * @param color The color to apply
   * @param bright Whether to make the text bright
   * @returns Colorized string
   */
  private colorize(text: string, color: Colors, bright = false): string {
    if (!this.options.colors) {
      return text;
    }
    
    const brightCode = bright ? Colors.BRIGHT : '';
    return `${color}${brightCode}${text}${Colors.RESET}`;
  }
}