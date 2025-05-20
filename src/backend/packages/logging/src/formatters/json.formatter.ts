import { Formatter, LogEntry } from './formatter.interface';
import { LogLevel, LogLevelUtils } from '../interfaces/log-level.enum';
import {
  formatError,
  formatTimestamp,
  formatValue,
  redactSensitiveInfo,
  safeStringify,
} from '../utils/format.utils';

/**
 * JSON log formatter that transforms log entries into structured JSON format.
 * This formatter is suitable for CloudWatch and other log aggregation systems,
 * ensuring that logs are machine-readable and include all necessary context,
 * metadata, and correlation IDs for proper observability.
 */
export class JsonFormatter implements Formatter {
  /**
   * Sensitive keys that should be redacted from logs
   */
  private readonly sensitiveKeys: string[] = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'apiKey',
    'credential',
    'jwt',
  ];

  /**
   * Creates a new instance of JsonFormatter
   * @param options Configuration options for the formatter
   */
  constructor(
    private readonly options: {
      /**
       * Whether to pretty-print the JSON output (default: false)
       */
      pretty?: boolean;
      
      /**
       * Additional keys to redact from logs
       */
      additionalSensitiveKeys?: string[];
      
      /**
       * Whether to include the full stack trace for errors (default: true)
       */
      includeStackTrace?: boolean;
    } = {}
  ) {
    // Add any additional sensitive keys to the default list
    if (options.additionalSensitiveKeys?.length) {
      this.sensitiveKeys = [
        ...this.sensitiveKeys,
        ...options.additionalSensitiveKeys,
      ];
    }
  }

  /**
   * Formats a log entry into a JSON string representation.
   * 
   * @param entry The log entry to format
   * @returns A JSON string representation of the log entry
   */
  format(entry: LogEntry): string {
    // Create the base log object
    const logObject: Record<string, any> = {
      // Standard fields
      timestamp: formatTimestamp(entry.timestamp),
      level: LogLevelUtils.toString(entry.level),
      levelValue: entry.level,
      message: entry.message,
    };

    // Add service and journey information if available
    if (entry.context?.service) {
      logObject.service = entry.context.service;
    }

    if (entry.context?.journey) {
      logObject.journey = entry.context.journey;
    }

    // Add request context if available
    if (entry.context?.request) {
      logObject.request = this.formatRequestContext(entry.context.request);
    }

    // Add trace context if available
    if (entry.context?.trace) {
      logObject.trace = this.formatTraceContext(entry.context.trace);
    }

    // Handle error objects
    if (entry.error) {
      logObject.error = this.formatErrorObject(entry.error);
    }

    // Add any additional context fields, excluding already processed ones
    if (entry.context) {
      const { service, journey, request, trace, ...restContext } = entry.context;
      
      // Add remaining context fields
      Object.entries(restContext).forEach(([key, value]) => {
        // Don't overwrite existing fields
        if (!(key in logObject)) {
          logObject[key] = formatValue(value);
        }
      });
    }

    // Add any additional entry fields, excluding already processed ones
    const { message, level, timestamp, error, context, ...rest } = entry;
    
    // Add remaining entry fields
    Object.entries(rest).forEach(([key, value]) => {
      // Don't overwrite existing fields
      if (!(key in logObject)) {
        logObject[key] = formatValue(value);
      }
    });

    // Redact sensitive information
    const redactedLogObject = redactSensitiveInfo(logObject, this.sensitiveKeys);

    // Convert to JSON string
    return this.options.pretty
      ? JSON.stringify(redactedLogObject, null, 2)
      : safeStringify(redactedLogObject);
  }

  /**
   * Formats the request context for logging
   * @param requestContext The request context object
   * @returns Formatted request context
   */
  private formatRequestContext(requestContext: Record<string, any>): Record<string, any> {
    const formatted: Record<string, any> = {};

    // Add standard request fields
    if (requestContext.id) {
      formatted.id = requestContext.id;
    }

    if (requestContext.method) {
      formatted.method = requestContext.method;
    }

    if (requestContext.path) {
      formatted.path = requestContext.path;
    }

    if (requestContext.userId) {
      formatted.userId = requestContext.userId;
    }

    if (requestContext.duration !== undefined) {
      formatted.duration = requestContext.duration;
    }

    // Add any additional request fields
    const { id, method, path, userId, duration, ...rest } = requestContext;
    
    // Add remaining request fields
    Object.entries(rest).forEach(([key, value]) => {
      // Don't overwrite existing fields
      if (!(key in formatted)) {
        formatted[key] = formatValue(value);
      }
    });

    return formatted;
  }

  /**
   * Formats the trace context for logging
   * @param traceContext The trace context object
   * @returns Formatted trace context
   */
  private formatTraceContext(traceContext: Record<string, any>): Record<string, any> {
    const formatted: Record<string, any> = {};

    // Add standard trace fields
    if (traceContext.id) {
      formatted.id = traceContext.id;
    }

    if (traceContext.spanId) {
      formatted.spanId = traceContext.spanId;
    }

    if (traceContext.parentSpanId) {
      formatted.parentSpanId = traceContext.parentSpanId;
    }

    // Add any additional trace fields
    const { id, spanId, parentSpanId, ...rest } = traceContext;
    
    // Add remaining trace fields
    Object.entries(rest).forEach(([key, value]) => {
      // Don't overwrite existing fields
      if (!(key in formatted)) {
        formatted[key] = formatValue(value);
      }
    });

    return formatted;
  }

  /**
   * Formats an error object for logging
   * @param error The error object to format
   * @returns Formatted error object
   */
  private formatErrorObject(error: any): Record<string, any> {
    // If it's already an Error object, format it
    if (error instanceof Error) {
      const formatted = formatError(error);
      
      // Remove stack trace if not needed
      if (this.options.includeStackTrace === false && formatted.stack) {
        delete formatted.stack;
      }
      
      return formatted;
    }
    
    // If it's a string, create a simple error object
    if (typeof error === 'string') {
      return {
        message: error,
      };
    }
    
    // If it's an object but not an Error, format it as a generic object
    if (typeof error === 'object' && error !== null) {
      const formatted: Record<string, any> = {};
      
      // Add message if available
      if (error.message) {
        formatted.message = error.message;
      }
      
      // Add name if available
      if (error.name) {
        formatted.name = error.name;
      }
      
      // Add stack if available and needed
      if (error.stack && this.options.includeStackTrace !== false) {
        formatted.stack = typeof error.stack === 'string'
          ? error.stack.split('\n').map((line: string) => line.trim()).filter(Boolean)
          : error.stack;
      }
      
      // Add any additional fields
      Object.entries(error).forEach(([key, value]) => {
        if (key !== 'message' && key !== 'name' && key !== 'stack') {
          formatted[key] = formatValue(value);
        }
      });
      
      return formatted;
    }
    
    // For any other type, convert to string
    return {
      message: String(error),
    };
  }
}