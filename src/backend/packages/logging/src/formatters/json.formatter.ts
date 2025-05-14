import { Injectable } from '@nestjs/common';
import { LogEntry, LogLevel, ErrorObject } from '../interfaces/log-entry.interface';
import { Formatter } from './formatter.interface';

/**
 * Implements a JSON formatter for logs that transforms log entries into structured JSON format
 * suitable for CloudWatch and other log aggregation systems.
 * 
 * This formatter ensures that logs are machine-readable and include all necessary context,
 * metadata, and correlation IDs for proper observability and analysis.
 */
@Injectable()
export class JsonFormatter implements Formatter {
  /**
   * Formats a log entry into a structured JSON string.
   * @param entry The log entry to format
   * @returns The formatted log entry as a JSON string
   */
  format(entry: LogEntry): string {
    // Create the base log object
    const logObject: Record<string, any> = {
      // Required fields
      timestamp: this.formatTimestamp(entry.timestamp),
      level: entry.level,
      message: entry.message,
      service: entry.service,
    };

    // Add optional fields if they exist
    this.addOptionalField(logObject, 'requestId', entry.requestId);
    this.addOptionalField(logObject, 'userId', entry.userId);
    this.addOptionalField(logObject, 'journey', entry.journey);

    // Add tracing information if available
    if (entry.traceId) {
      logObject.trace = {
        traceId: entry.traceId,
      };

      this.addOptionalField(logObject.trace, 'spanId', entry.spanId);
      this.addOptionalField(logObject.trace, 'parentSpanId', entry.parentSpanId);
    }

    // Add journey context if available
    if (entry.journeyContext) {
      logObject.journeyContext = this.sanitizeObject(entry.journeyContext);
    }

    // Add additional context if available
    if (entry.context && Object.keys(entry.context).length > 0) {
      logObject.context = this.sanitizeObject(entry.context);
    }

    // Add error information if available
    if (entry.error) {
      logObject.error = this.formatError(entry.error);
    }

    // Convert to JSON string
    return JSON.stringify(logObject);
  }

  /**
   * Formats a timestamp in ISO format for CloudWatch compatibility.
   * @param timestamp The timestamp to format
   * @returns The formatted timestamp string
   */
  private formatTimestamp(timestamp: Date): string {
    return timestamp.toISOString();
  }

  /**
   * Adds an optional field to the log object if it exists.
   * @param obj The object to add the field to
   * @param key The key of the field
   * @param value The value of the field
   */
  private addOptionalField(obj: Record<string, any>, key: string, value: any): void {
    if (value !== undefined && value !== null) {
      obj[key] = value;
    }
  }

  /**
   * Formats an error object for inclusion in the log entry.
   * @param error The error object to format
   * @returns The formatted error object
   */
  private formatError(error: ErrorObject): Record<string, any> {
    const formattedError: Record<string, any> = {
      message: error.message,
      name: error.name,
    };

    // Add optional error fields
    this.addOptionalField(formattedError, 'stack', error.stack);
    this.addOptionalField(formattedError, 'code', error.code);
    this.addOptionalField(formattedError, 'statusCode', error.statusCode);
    this.addOptionalField(formattedError, 'isOperational', error.isOperational);

    // Add error details if available
    if (error.details && Object.keys(error.details).length > 0) {
      formattedError.details = this.sanitizeObject(error.details);
    }

    // Add cause if available (recursive)
    if (error.cause) {
      formattedError.cause = this.formatError(error.cause);
    }

    return formattedError;
  }

  /**
   * Sanitizes an object for JSON serialization, handling circular references and special objects.
   * @param obj The object to sanitize
   * @returns The sanitized object
   */
  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    // Create a new object to avoid modifying the original
    const sanitized: Record<string, any> = {};
    
    // Track processed objects to handle circular references
    const seen = new WeakSet();
    
    // Helper function for deep sanitization
    const sanitizeValue = (value: any): any => {
      // Handle null and undefined
      if (value === null || value === undefined) {
        return null;
      }
      
      // Handle primitive types
      if (typeof value !== 'object') {
        return value;
      }
      
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }
      
      // Handle Error objects
      if (value instanceof Error) {
        return {
          message: value.message,
          name: value.name,
          stack: value.stack,
        };
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        return value.map(item => sanitizeValue(item));
      }
      
      // Handle circular references
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      
      // Add object to seen set
      seen.add(value);
      
      // Handle regular objects
      const result: Record<string, any> = {};
      
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          result[key] = sanitizeValue(value[key]);
        }
      }
      
      return result;
    };
    
    // Process each property in the object
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeValue(obj[key]);
      }
    }
    
    return sanitized;
  }
}