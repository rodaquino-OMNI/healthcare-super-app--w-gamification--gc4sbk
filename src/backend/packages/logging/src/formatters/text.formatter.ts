import { Injectable } from '@nestjs/common';
import { LogEntry, LogLevel } from '../interfaces/log-entry.interface';
import { Formatter } from './formatter.interface';

/**
 * Implements a human-readable text formatter for logs that's optimized for
 * local development and debugging.
 * 
 * This formatter presents log entries with colors (when supported), proper indentation,
 * and clear visual separation of different components.
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
   * Formats a log entry into a human-readable text representation.
   * @param entry The log entry to format
   * @returns The formatted log entry as a colored text string
   */
  format(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase();
    const color = this.colors[entry.level] || this.colors.reset;
    
    // Format the basic log line
    let formattedEntry = `${timestamp} ${color}[${level}]${this.colors.reset} [${entry.service}] ${entry.message}`;
    
    // Add request ID if available
    if (entry.requestId) {
      formattedEntry += ` (requestId: ${entry.requestId})`;
    }
    
    // Add user ID if available
    if (entry.userId) {
      formattedEntry += ` (userId: ${entry.userId})`;
    }
    
    // Add journey information if available
    if (entry.journey) {
      formattedEntry += ` (journey: ${entry.journey})`;
    }
    
    // Add trace ID if available
    if (entry.traceId) {
      formattedEntry += `\n  traceId: ${entry.traceId}`;
      
      if (entry.spanId) {
        formattedEntry += `, spanId: ${entry.spanId}`;
      }
    }
    
    // Add context if available
    if (entry.context && Object.keys(entry.context).length > 0) {
      formattedEntry += `\n  context: ${this.formatObject(entry.context, 2)}`;
    }
    
    // Add journey context if available
    if (entry.journeyContext && Object.keys(entry.journeyContext).length > 0) {
      formattedEntry += `\n  journeyContext: ${this.formatObject(entry.journeyContext, 2)}`;
    }
    
    // Add error information if available
    if (entry.error) {
      formattedEntry += `\n  error: ${entry.error.name}: ${entry.error.message}`;
      
      if (entry.error.stack) {
        formattedEntry += `\n  stack: ${entry.error.stack.split('\n').join('\n    ')}`;
      }
      
      if (entry.error.details) {
        formattedEntry += `\n  details: ${this.formatObject(entry.error.details, 2)}`;
      }
    }
    
    return formattedEntry;
  }
  
  /**
   * Formats an object for human-readable output with indentation.
   * @param obj The object to format
   * @param indent The indentation level
   * @returns A formatted string representation of the object
   */
  private formatObject(obj: Record<string, any>, indent: number = 0): string {
    try {
      return JSON.stringify(obj, null, indent)
        .replace(/\n/g, '\n  ')
        .replace(/\\n/g, '\n');
    } catch (error) {
      return '[Object cannot be stringified]';
    }
  }
}