import { LogEntry } from '../interfaces/log-entry.interface';
import { Formatter } from './formatter.interface';

/**
 * JSON formatter that transforms log entries into structured JSON format.
 * This formatter is suitable for machine processing and log aggregation systems.
 */
export class JsonFormatter implements Formatter {
  /**
   * Formats a log entry into a JSON string.
   * @param entry The log entry to format
   * @returns The formatted log entry as a JSON string
   */
  format(entry: LogEntry): string {
    const formattedEntry = this.prepareEntry(entry);
    return JSON.stringify(formattedEntry);
  }

  /**
   * Prepares the log entry for JSON serialization by handling special cases.
   * @param entry The log entry to prepare
   * @returns A plain object ready for JSON serialization
   */
  protected prepareEntry(entry: LogEntry): Record<string, any> {
    const formattedEntry: Record<string, any> = {
      message: entry.message,
      level: entry.level.toString(),
      timestamp: entry.timestamp.toISOString(),
    };

    // Add service name if available
    if (entry.serviceName) {
      formattedEntry.service = entry.serviceName;
    }

    // Add context if available
    if (entry.context) {
      formattedEntry.context = entry.context;
    }

    // Add context data if available
    if (entry.contextData && Object.keys(entry.contextData).length > 0) {
      formattedEntry.contextData = this.sanitizeObject(entry.contextData);
    }

    // Add request information if available
    if (entry.requestId || entry.userId || entry.sessionId || entry.clientIp || entry.userAgent) {
      formattedEntry.request = {};
      
      if (entry.requestId) {
        formattedEntry.request.id = entry.requestId;
      }
      
      if (entry.userId) {
        formattedEntry.request.userId = entry.userId;
      }
      
      if (entry.sessionId) {
        formattedEntry.request.sessionId = entry.sessionId;
      }
      
      if (entry.clientIp) {
        formattedEntry.request.clientIp = entry.clientIp;
      }
      
      if (entry.userAgent) {
        formattedEntry.request.userAgent = entry.userAgent;
      }
    }

    // Add trace information if available
    if (entry.traceId || entry.spanId || entry.parentSpanId) {
      formattedEntry.trace = {};
      
      if (entry.traceId) {
        formattedEntry.trace.traceId = entry.traceId;
      }
      
      if (entry.spanId) {
        formattedEntry.trace.spanId = entry.spanId;
      }
      
      if (entry.parentSpanId) {
        formattedEntry.trace.parentSpanId = entry.parentSpanId;
      }
    }

    // Add journey information if available
    if (entry.journey) {
      formattedEntry.journey = {
        type: entry.journey.type,
      };

      if (entry.journey.resourceId) {
        formattedEntry.journey.resourceId = entry.journey.resourceId;
      }

      if (entry.journey.action) {
        formattedEntry.journey.action = entry.journey.action;
      }

      if (entry.journey.data) {
        formattedEntry.journey.data = this.sanitizeObject(entry.journey.data);
      }
    }

    // Add error information if available
    if (entry.error) {
      formattedEntry.error = {
        message: entry.error.message,
      };

      if (entry.error.name) {
        formattedEntry.error.name = entry.error.name;
      }

      if (entry.error.code) {
        formattedEntry.error.code = entry.error.code;
      }

      if (entry.error.stack) {
        formattedEntry.error.stack = entry.error.stack;
      }

      if (entry.error.isTransient !== undefined) {
        formattedEntry.error.isTransient = entry.error.isTransient;
      }

      if (entry.error.isClientError !== undefined) {
        formattedEntry.error.isClientError = entry.error.isClientError;
      }

      if (entry.error.isExternalError !== undefined) {
        formattedEntry.error.isExternalError = entry.error.isExternalError;
      }
    }

    // Add metadata if available
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      formattedEntry.metadata = this.sanitizeObject(entry.metadata);
    }

    return formattedEntry;
  }

  /**
   * Sanitizes an object for JSON serialization by handling circular references and special types.
   * @param obj The object to sanitize
   * @returns A sanitized version of the object
   */
  protected sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(obj, (key, value) => {
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
    }));
  }
}