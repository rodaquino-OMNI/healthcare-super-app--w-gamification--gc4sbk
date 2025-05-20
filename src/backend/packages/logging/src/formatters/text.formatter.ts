import { Injectable } from '@nestjs/common';
import { Formatter, LogEntry } from './formatter.interface';
import { LogLevel } from '../interfaces/log-level.enum';

/**
 * TextFormatter implements the Formatter interface to transform log entries into human-readable text format.
 * 
 * This formatter is optimized for local development and debugging, presenting log entries with colors
 * (when supported), proper indentation, and clear visual separation of different components.
 */
@Injectable()
export class TextFormatter implements Formatter {
  // ANSI color codes for different log levels
  private readonly colors = {
    [LogLevel.DEBUG]: '\x1b[34m', // Blue
    [LogLevel.INFO]: '\x1b[32m',  // Green
    [LogLevel.WARN]: '\x1b[33m',  // Yellow
    [LogLevel.ERROR]: '\x1b[31m', // Red
    [LogLevel.FATAL]: '\x1b[35m', // Magenta
    reset: '\x1b[0m',
  };

  /**
   * Formats a log entry into a human-readable text string.
   * 
   * @param entry The log entry to format
   * @returns A formatted text string representation of the log entry
   */
  format(entry: LogEntry): string {
    const timestamp = this.formatTimestamp(entry.timestamp);
    const level = this.formatLevel(entry.level);
    const context = this.formatContext(entry.context);
    const message = entry.message;
    const error = this.formatError(entry.error);

    // Build the formatted log string
    let formattedLog = `${timestamp} ${level} ${context}${message}`;
    
    // Add error information if present
    if (error) {
      formattedLog += `\n${error}`;
    }

    return formattedLog;
  }

  /**
   * Formats the timestamp into a human-readable format.
   * 
   * @param timestamp The timestamp to format
   * @returns A formatted timestamp string
   */
  private formatTimestamp(timestamp: string | number | Date): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return `[${date.toISOString()}]`;
  }

  /**
   * Formats the log level with appropriate color.
   * 
   * @param level The log level to format
   * @returns A formatted log level string with color
   */
  private formatLevel(level: LogLevel): string {
    const levelString = LogLevel[level].padEnd(5);
    const color = this.colors[level] || this.colors.reset;
    return `${color}[${levelString}]${this.colors.reset}`;
  }

  /**
   * Formats the context information.
   * 
   * @param context The context object to format
   * @returns A formatted context string
   */
  private formatContext(context?: Record<string, any>): string {
    if (!context) {
      return '';
    }

    const contextParts = [];

    // Add service name if available
    if (context.service) {
      contextParts.push(context.service);
    }

    // Add journey if available
    if (context.journey) {
      contextParts.push(`journey:${context.journey}`);
    }

    // Add request information if available
    if (context.request?.id) {
      contextParts.push(`reqId:${context.request.id}`);
    }

    // Add user ID if available
    if (context.request?.userId) {
      contextParts.push(`userId:${context.request.userId}`);
    }

    // Add trace ID if available
    if (context.trace?.id) {
      contextParts.push(`traceId:${context.trace.id}`);
    }

    return contextParts.length > 0 ? `[${contextParts.join(', ')}] ` : '';
  }

  /**
   * Formats an error object for human-readable output.
   * 
   * @param error The error object to format
   * @returns A formatted error string
   */
  private formatError(error: any): string | null {
    if (!error) {
      return null;
    }

    // If it's already a string, return it
    if (typeof error === 'string') {
      return `Error: ${error}`;
    }

    // Format error with message and stack trace
    let formattedError = `Error: ${error.message || 'Unknown error'}`;
    
    // Add error name if available
    if (error.name && error.name !== 'Error') {
      formattedError = `${error.name}: ${error.message || 'Unknown error'}`;
    }

    // Add stack trace if available
    if (error.stack) {
      formattedError += `\n${error.stack}`;
    }

    // Add additional error details if available
    if (error.details) {
      formattedError += `\nDetails: ${this.formatObject(error.details)}`;
    }

    return formattedError;
  }

  /**
   * Formats an object for human-readable output.
   * 
   * @param obj The object to format
   * @returns A formatted object string
   */
  private formatObject(obj: any): string {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (error) {
      return '[Non-serializable object]';
    }
  }
}