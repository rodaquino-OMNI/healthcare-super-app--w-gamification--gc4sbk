import { Injectable } from '@nestjs/common';
import { LogEntry, ErrorObject } from '../interfaces/log-entry.interface';
import { Formatter } from './formatter.interface';

/**
 * Implements the JSON log formatter that transforms log entries into structured JSON format
 * suitable for CloudWatch and other log aggregation systems.
 * 
 * This formatter ensures that logs are machine-readable and include all necessary context,
 * metadata, and correlation IDs for proper observability.
 */
@Injectable()
export class JsonFormatter implements Formatter {
  /**
   * Formats a log entry into a JSON string representation.
   * @param entry The log entry to format
   * @returns The formatted log entry as a JSON string
   */
  format(entry: LogEntry): string {
    const formattedEntry = {
      // Basic log information
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      service: entry.service,
      
      // Context information
      context: entry.context || {},
      
      // Correlation IDs for distributed tracing
      requestId: entry.requestId,
      userId: entry.userId,
      traceId: entry.traceId,
      spanId: entry.spanId,
      parentSpanId: entry.parentSpanId,
      
      // Journey information
      journey: entry.journey,
      journeyContext: entry.journeyContext,
      
      // Error information (if present)
      error: this.formatError(entry.error),
    };
    
    return JSON.stringify(formattedEntry);
  }
  
  /**
   * Formats an error object for inclusion in the log entry.
   * Protected to allow access from subclasses.
   * @param error The error object to format
   * @returns The formatted error object or undefined if no error
   */
  protected formatError(error?: ErrorObject): Record<string, any> | undefined {
    if (!error) {
      return undefined;
    }
    
    const formattedError: Record<string, any> = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      details: error.details,
    };
    
    // Format nested cause if present
    if (error.cause) {
      formattedError.cause = this.formatError(error.cause);
    }
    
    return formattedError;
  }
}