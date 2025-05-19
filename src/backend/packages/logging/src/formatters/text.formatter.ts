import { Injectable } from '@nestjs/common';
import { LogEntry, LogLevel, JourneyType, ErrorObject } from '../interfaces/log-entry.interface';
import { Formatter } from './formatter.interface';
import * as util from 'util';

/**
 * Implements a human-readable text formatter for logs that's optimized for local development and debugging.
 * 
 * This formatter presents log entries with colors (when supported), proper indentation, and clear visual
 * separation of different components to enhance readability during development.
 */
@Injectable()
export class TextFormatter implements Formatter {
  // ANSI color codes for different log levels
  private readonly colors = {
    [LogLevel.DEBUG]: '\x1b[36m', // Cyan
    [LogLevel.INFO]: '\x1b[32m',  // Green
    [LogLevel.WARN]: '\x1b[33m',  // Yellow
    [LogLevel.ERROR]: '\x1b[31m', // Red
    [LogLevel.FATAL]: '\x1b[35m', // Magenta
    reset: '\x1b[0m',             // Reset
    bold: '\x1b[1m',              // Bold
    dim: '\x1b[2m',               // Dim
    journeyHealth: '\x1b[32m',    // Green for Health journey
    journeyCare: '\x1b[36m',      // Cyan for Care journey
    journeyPlan: '\x1b[34m',      // Blue for Plan journey
    journeyCross: '\x1b[35m',     // Magenta for Cross-journey
  };

  // Journey emoji indicators for visual distinction
  private readonly journeyEmoji = {
    [JourneyType.HEALTH]: '💚',   // Green heart for Health journey
    [JourneyType.CARE]: '🩺',     // Stethoscope for Care journey
    [JourneyType.PLAN]: '📋',     // Clipboard for Plan journey
    [JourneyType.CROSS_JOURNEY]: '🔄', // Arrows for Cross-journey
  };

  /**
   * Formats a log entry into a human-readable text representation with colors and proper formatting.
   * @param entry The log entry to format
   * @returns The formatted log entry as a string
   */
  format(entry: LogEntry): string {
    // Format the timestamp in a human-readable format
    const timestamp = this.formatTimestamp(entry.timestamp);
    
    // Format the log level with color
    const level = this.formatLevel(entry.level);
    
    // Format the service name
    const service = this.formatService(entry.service);
    
    // Format the journey information if present
    const journey = this.formatJourney(entry.journey);
    
    // Format the context information
    const context = this.formatContext(entry);
    
    // Format the message
    const message = this.formatMessage(entry.message);
    
    // Format the error if present
    const error = this.formatError(entry.error);
    
    // Combine all parts into a single formatted log entry
    let formattedEntry = `${timestamp} ${level} ${service}`;
    
    if (journey) {
      formattedEntry += ` ${journey}`;
    }
    
    formattedEntry += ` ${message}`;
    
    if (context) {
      formattedEntry += `\n${context}`;
    }
    
    if (error) {
      formattedEntry += `\n${error}`;
    }
    
    return formattedEntry;
  }
  
  /**
   * Formats the timestamp in a human-readable format.
   * @param timestamp The timestamp to format
   * @returns The formatted timestamp
   */
  private formatTimestamp(timestamp: Date): string {
    const formattedTime = timestamp.toISOString().replace('T', ' ').replace('Z', '');
    return `${this.colors.dim}[${formattedTime}]${this.colors.reset}`;
  }
  
  /**
   * Formats the log level with appropriate color.
   * @param level The log level to format
   * @returns The formatted log level
   */
  private formatLevel(level: LogLevel): string {
    const color = this.colors[level] || this.colors.reset;
    const paddedLevel = level.toUpperCase().padEnd(5, ' ');
    return `${color}${this.colors.bold}[${paddedLevel}]${this.colors.reset}`;
  }
  
  /**
   * Formats the service name.
   * @param service The service name to format
   * @returns The formatted service name
   */
  private formatService(service: string): string {
    return `${this.colors.bold}[${service}]${this.colors.reset}`;
  }
  
  /**
   * Formats the journey information if present.
   * @param journey The journey type
   * @returns The formatted journey information or empty string if not present
   */
  private formatJourney(journey?: JourneyType): string {
    if (!journey) {
      return '';
    }
    
    const emoji = this.journeyEmoji[journey] || '';
    let color;
    
    switch (journey) {
      case JourneyType.HEALTH:
        color = this.colors.journeyHealth;
        break;
      case JourneyType.CARE:
        color = this.colors.journeyCare;
        break;
      case JourneyType.PLAN:
        color = this.colors.journeyPlan;
        break;
      case JourneyType.CROSS_JOURNEY:
        color = this.colors.journeyCross;
        break;
      default:
        color = this.colors.reset;
    }
    
    return `${color}[${emoji} ${journey}]${this.colors.reset}`;
  }
  
  /**
   * Formats the context information.
   * @param entry The log entry containing context information
   * @returns The formatted context information or empty string if not present
   */
  private formatContext(entry: LogEntry): string {
    const contextParts: string[] = [];
    
    // Add request ID if present
    if (entry.requestId) {
      contextParts.push(`${this.colors.dim}requestId: ${entry.requestId}${this.colors.reset}`);
    }
    
    // Add user ID if present
    if (entry.userId) {
      contextParts.push(`${this.colors.dim}userId: ${entry.userId}${this.colors.reset}`);
    }
    
    // Add trace information if present
    if (entry.traceId) {
      contextParts.push(`${this.colors.dim}traceId: ${entry.traceId}${this.colors.reset}`);
      
      if (entry.spanId) {
        contextParts.push(`${this.colors.dim}spanId: ${entry.spanId}${this.colors.reset}`);
      }
      
      if (entry.parentSpanId) {
        contextParts.push(`${this.colors.dim}parentSpanId: ${entry.parentSpanId}${this.colors.reset}`);
      }
    }
    
    // Add journey context if present
    if (entry.journeyContext) {
      const journeyContextStr = this.prettyPrint(entry.journeyContext, 2);
      contextParts.push(`${this.colors.dim}journeyContext: ${journeyContextStr}${this.colors.reset}`);
    }
    
    // Add additional context if present
    if (entry.context && Object.keys(entry.context).length > 0) {
      const contextStr = this.prettyPrint(entry.context, 2);
      contextParts.push(`${this.colors.dim}context: ${contextStr}${this.colors.reset}`);
    }
    
    if (contextParts.length === 0) {
      return '';
    }
    
    return `  ${contextParts.join('\n  ')}`;
  }
  
  /**
   * Formats the message.
   * @param message The message to format
   * @returns The formatted message
   */
  private formatMessage(message: string): string {
    return message;
  }
  
  /**
   * Formats an error object for inclusion in the log entry.
   * @param error The error object to format
   * @returns The formatted error or empty string if not present
   */
  private formatError(error?: ErrorObject): string {
    if (!error) {
      return '';
    }
    
    const parts: string[] = [];
    
    // Add error name and message
    parts.push(`${this.colors.error}${this.colors.bold}ERROR: ${error.name}: ${error.message}${this.colors.reset}`);
    
    // Add error code and status code if present
    if (error.code || error.statusCode) {
      const codes: string[] = [];
      
      if (error.code) {
        codes.push(`code: ${error.code}`);
      }
      
      if (error.statusCode) {
        codes.push(`statusCode: ${error.statusCode}`);
      }
      
      parts.push(`  ${this.colors.dim}${codes.join(', ')}${this.colors.reset}`);
    }
    
    // Add error details if present
    if (error.details && Object.keys(error.details).length > 0) {
      const detailsStr = this.prettyPrint(error.details, 2);
      parts.push(`  ${this.colors.dim}details: ${detailsStr}${this.colors.reset}`);
    }
    
    // Add error stack if present
    if (error.stack) {
      // Extract the stack trace without the first line (which is the error message)
      const stackLines = error.stack.split('\n').slice(1);
      const formattedStack = stackLines.map(line => `  ${this.colors.dim}${line.trim()}${this.colors.reset}`).join('\n');
      parts.push(formattedStack);
    }
    
    // Add cause if present
    if (error.cause) {
      parts.push(`  ${this.colors.dim}Caused by:${this.colors.reset}`);
      parts.push(`  ${this.formatError(error.cause).replace(/^/gm, '  ')}`);
    }
    
    return parts.join('\n');
  }
  
  /**
   * Pretty-prints a complex object with proper indentation.
   * @param obj The object to pretty-print
   * @param depth The maximum depth to inspect
   * @returns The pretty-printed object as a string
   */
  private prettyPrint(obj: any, depth: number = 4): string {
    return util.inspect(obj, {
      colors: true,
      depth,
      compact: false,
      breakLength: 80,
    });
  }
}