import { Formatter } from './formatter.interface';
import { LogEntry, ErrorInfo, JourneyContext } from '../interfaces/log-entry.interface';
import { LogLevel, LogLevelUtils } from '../interfaces/log-level.enum';

/**
 * JSON formatter for log entries.
 * Transforms log entries into structured JSON format suitable for CloudWatch and other log aggregation systems.
 * Ensures logs are machine-readable and include all necessary context, metadata, and correlation IDs.
 */
export class JSONFormatter implements Formatter {
  /**
   * Formats a log entry into a JSON string.
   * @param entry The log entry to format
   * @returns The formatted log entry as a JSON string
   */
  format(entry: LogEntry): string {
    const formattedEntry = this.createFormattedEntry(entry);
    return JSON.stringify(formattedEntry);
  }

  /**
   * Creates a formatted entry object from a log entry.
   * @param entry The log entry to format
   * @returns A formatted object ready for JSON serialization
   */
  private createFormattedEntry(entry: LogEntry): Record<string, any> {
    const formattedEntry: Record<string, any> = {
      // Basic log information
      message: entry.message,
      level: LogLevelUtils.toString(entry.level),
      levelCode: entry.level,
      timestamp: this.formatTimestamp(entry.timestamp),
      
      // Service and context information
      service: entry.serviceName || 'unknown',
      context: entry.context || 'global',
    };

    // Add request context if available
    if (entry.requestId) {
      formattedEntry.request = {
        id: entry.requestId,
        clientIp: entry.clientIp,
        userAgent: entry.userAgent
      };
    }

    // Add user context if available
    if (entry.userId || entry.sessionId) {
      formattedEntry.user = {
        id: entry.userId,
        sessionId: entry.sessionId
      };
    }

    // Add tracing information if available
    if (entry.traceId || entry.spanId) {
      formattedEntry.trace = {
        traceId: entry.traceId,
        spanId: entry.spanId,
        parentSpanId: entry.parentSpanId
      };
    }

    // Add journey context if available
    if (entry.journey) {
      formattedEntry.journey = this.formatJourneyContext(entry.journey);
    }

    // Add error information if available
    if (entry.error) {
      formattedEntry.error = this.formatError(entry.error);
    }

    // Add additional context data if available
    if (entry.contextData && Object.keys(entry.contextData).length > 0) {
      formattedEntry.contextData = this.sanitizeObject(entry.contextData);
    }

    // Add metadata if available
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      formattedEntry.metadata = this.sanitizeObject(entry.metadata);
    }

    return formattedEntry;
  }

  /**
   * Formats a timestamp for CloudWatch compatibility.
   * @param timestamp The timestamp to format
   * @returns The formatted timestamp string in ISO format
   */
  private formatTimestamp(timestamp: Date): string {
    return timestamp.toISOString();
  }

  /**
   * Formats journey context information.
   * @param journey The journey context to format
   * @returns The formatted journey context
   */
  private formatJourneyContext(journey: JourneyContext): Record<string, any> {
    const formattedJourney: Record<string, any> = {
      type: journey.type,
    };

    if (journey.resourceId) {
      formattedJourney.resourceId = journey.resourceId;
    }

    if (journey.action) {
      formattedJourney.action = journey.action;
    }

    if (journey.data && Object.keys(journey.data).length > 0) {
      formattedJourney.data = this.sanitizeObject(journey.data);
    }

    return formattedJourney;
  }

  /**
   * Formats error information.
   * @param error The error information to format
   * @returns The formatted error information
   */
  private formatError(error: ErrorInfo): Record<string, any> {
    const formattedError: Record<string, any> = {
      message: error.message,
      name: error.name || 'Error',
    };

    if (error.code !== undefined) {
      formattedError.code = error.code;
    }

    if (error.stack) {
      formattedError.stack = error.stack;
    }

    if (error.isTransient !== undefined) {
      formattedError.isTransient = error.isTransient;
    }

    if (error.isClientError !== undefined) {
      formattedError.isClientError = error.isClientError;
    }

    if (error.isExternalError !== undefined) {
      formattedError.isExternalError = error.isExternalError;
    }

    // If there's an original error, extract additional properties
    if (error.originalError) {
      formattedError.originalError = this.extractErrorProperties(error.originalError);
    }

    return formattedError;
  }

  /**
   * Extracts properties from an error object.
   * @param err The error object to extract properties from
   * @returns An object containing the extracted properties
   */
  private extractErrorProperties(err: any): Record<string, any> {
    if (!err) {
      return {};
    }

    // If it's not an object, return it as is
    if (typeof err !== 'object') {
      return { value: err };
    }

    // Handle Error objects specially
    if (err instanceof Error) {
      const errorProps: Record<string, any> = {
        message: err.message,
        name: err.name,
      };

      if (err.stack) {
        errorProps.stack = err.stack;
      }

      // Extract any additional properties from the error
      for (const key in err) {
        if (Object.prototype.hasOwnProperty.call(err, key) && 
            !['message', 'name', 'stack'].includes(key)) {
          try {
            errorProps[key] = this.sanitizeObject(err[key]);
          } catch (e) {
            errorProps[key] = '[Circular or Unserializable]';
          }
        }
      }

      return errorProps;
    }

    // For other objects, sanitize them
    return this.sanitizeObject(err);
  }

  /**
   * Sanitizes an object for JSON serialization, handling circular references and special objects.
   * @param obj The object to sanitize
   * @returns A sanitized version of the object safe for JSON serialization
   */
  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle primitive types
    if (typeof obj !== 'object') {
      return obj;
    }

    // Handle Date objects
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    // Handle Error objects
    if (obj instanceof Error) {
      return this.extractErrorProperties(obj);
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    // Handle regular objects
    const sanitized: Record<string, any> = {};
    
    // Use a try-catch to handle potential circular references
    try {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          try {
            sanitized[key] = this.sanitizeObject(obj[key]);
          } catch (e) {
            sanitized[key] = '[Circular or Unserializable]';
          }
        }
      }
    } catch (e) {
      return '[Circular or Unserializable Object]';
    }

    return sanitized;
  }
}