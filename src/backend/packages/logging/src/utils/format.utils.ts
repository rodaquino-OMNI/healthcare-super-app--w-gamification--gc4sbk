/**
 * Utilities for formatting various data types for structured logging.
 * Provides functions for handling errors, circular references, timestamps,
 * and complex objects to ensure consistent and readable log output.
 */

import { LogLevel } from '../interfaces/log-level.enum';

/**
 * Maximum depth for object serialization to prevent excessive nesting
 */
const MAX_OBJECT_DEPTH = 10;

/**
 * Maximum array length to serialize to prevent excessive log size
 */
const MAX_ARRAY_LENGTH = 50;

/**
 * Symbol used to mark objects that have been visited during circular reference detection
 */
const VISITED_MARKER = Symbol('visited');

/**
 * Interface for error objects with optional stack traces and cause chains
 */
interface ErrorWithStack extends Error {
  stack?: string;
  cause?: Error | unknown;
  code?: string | number;
  statusCode?: number;
  status?: number;
  response?: unknown;
  config?: unknown;
  request?: unknown;
  details?: unknown;
  [key: string]: unknown;
}

/**
 * Formats an error object for logging, including stack trace and cause chain
 * @param error The error object to format
 * @param includeStack Whether to include the stack trace (default: true)
 * @returns A formatted error object suitable for logging
 */
export function formatError(error: unknown, includeStack = true): Record<string, unknown> {
  if (!error) {
    return { message: 'Unknown error (null or undefined)' };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  // Handle non-Error objects
  if (!(error instanceof Error)) {
    try {
      return { 
        message: 'Non-Error object thrown', 
        value: JSON.stringify(error),
        rawValue: error
      };
    } catch (e) {
      return { 
        message: 'Non-Error object thrown (non-serializable)',
        type: typeof error
      };
    }
  }

  const errorObj = error as ErrorWithStack;
  const formattedError: Record<string, unknown> = {
    message: errorObj.message || 'Unknown error',
    name: errorObj.name,
  };

  // Add error code if available
  if (errorObj.code !== undefined) {
    formattedError.code = errorObj.code;
  }

  // Add HTTP status code if available
  if (errorObj.statusCode !== undefined) {
    formattedError.statusCode = errorObj.statusCode;
  } else if (errorObj.status !== undefined) {
    formattedError.statusCode = errorObj.status;
  }

  // Add stack trace if available and requested
  if (includeStack && errorObj.stack) {
    formattedError.stack = parseStackTrace(errorObj.stack);
  }

  // Add additional error properties
  for (const key of Object.getOwnPropertyNames(errorObj)) {
    if (!['name', 'message', 'stack'].includes(key) && key !== VISITED_MARKER) {
      const value = errorObj[key];
      if (value !== undefined && typeof value !== 'function') {
        formattedError[key] = safeSerialize(value, 1);
      }
    }
  }

  // Handle error cause chain
  if (errorObj.cause) {
    formattedError.cause = formatError(errorObj.cause, includeStack);
  }

  return formattedError;
}

/**
 * Parses a stack trace string into an array of stack frames
 * @param stack The stack trace string
 * @returns An array of parsed stack frames
 */
function parseStackTrace(stack: string): string[] {
  if (!stack) return [];
  
  // Split the stack trace into lines and remove the first line (error message)
  const lines = stack.split('\n').slice(1);
  
  // Clean up each line
  return lines.map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 20); // Limit to 20 frames to prevent excessive log size
}

/**
 * Safely serializes an object for logging, handling circular references and limiting depth
 * @param obj The object to serialize
 * @param depth Current depth in the object tree
 * @param visited Set of visited objects for circular reference detection
 * @returns A serializable version of the object
 */
export function safeSerialize(
  obj: unknown, 
  depth = 0, 
  visited = new WeakMap<object, boolean>()
): unknown {
  // Handle primitive types
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (
    typeof obj === 'string' ||
    typeof obj === 'number' ||
    typeof obj === 'boolean'
  ) {
    return obj;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return formatTimestamp(obj);
  }

  // Handle Error objects
  if (obj instanceof Error) {
    return formatError(obj);
  }

  // Handle RegExp objects
  if (obj instanceof RegExp) {
    return obj.toString();
  }

  // Handle functions
  if (typeof obj === 'function') {
    return `[Function: ${obj.name || 'anonymous'}]`;
  }

  // Handle objects and arrays
  if (typeof obj === 'object') {
    // Prevent circular references and excessive depth
    if (depth >= MAX_OBJECT_DEPTH) {
      return '[Object: Depth limit exceeded]';
    }

    // Check for circular references
    if (visited.has(obj as object)) {
      return '[Object: Circular reference]';
    }

    // Mark object as visited
    visited.set(obj as object, true);

    // Handle arrays
    if (Array.isArray(obj)) {
      const length = obj.length;
      const serialized = obj
        .slice(0, MAX_ARRAY_LENGTH)
        .map(item => safeSerialize(item, depth + 1, visited));
      
      if (length > MAX_ARRAY_LENGTH) {
        serialized.push(`... ${length - MAX_ARRAY_LENGTH} more items`);
      }
      
      return serialized;
    }

    // Handle objects
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      try {
        const value = (obj as Record<string, unknown>)[key];
        if (typeof value !== 'function') {
          result[key] = safeSerialize(value, depth + 1, visited);
        }
      } catch (error) {
        result[key] = '[Serialization error]';
      }
    }
    return result;
  }

  // Handle any other types
  return `[${typeof obj}]`;
}

/**
 * Formats a timestamp in ISO format with millisecond precision
 * @param date The date to format (defaults to current time)
 * @returns ISO formatted timestamp string
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Formats a log level as a string
 * @param level The log level to format
 * @returns The log level as a string
 */
export function formatLogLevel(level: LogLevel): string {
  return LogLevel[level];
}

/**
 * Formats a message with interpolated values
 * @param message The message template with {placeholders}
 * @param params The values to interpolate
 * @returns The formatted message
 */
export function formatMessage(message: string, params?: Record<string, unknown>): string {
  if (!params) return message;
  
  return message.replace(/\{([^{}]+)\}/g, (match, key) => {
    const value = params[key];
    if (value === undefined) return match;
    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return '[Object]';
      }
    }
    return String(value);
  });
}

/**
 * Formats journey-specific context data for logging
 * @param journeyType The type of journey (health, care, plan)
 * @param context The journey-specific context data
 * @returns Formatted journey context
 */
export function formatJourneyContext(
  journeyType: 'health' | 'care' | 'plan', 
  context: Record<string, unknown>
): Record<string, unknown> {
  const formatted: Record<string, unknown> = {
    journeyType,
  };

  // Add journey-specific context data
  for (const [key, value] of Object.entries(context)) {
    formatted[key] = safeSerialize(value, 1);
  }

  return formatted;
}

/**
 * Truncates a string to a maximum length, adding an ellipsis if truncated
 * @param str The string to truncate
 * @param maxLength Maximum length (default: 1000)
 * @returns The truncated string
 */
export function truncateString(str: string, maxLength = 1000): string {
  if (!str || str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}

/**
 * Formats an object for CloudWatch Logs Insights compatibility
 * @param obj The object to format
 * @returns CloudWatch-compatible object
 */
export function formatForCloudWatch(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  // Flatten nested objects for better CloudWatch Logs Insights queries
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      continue;
    }
    
    if (typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
      // For nested objects, flatten one level with dot notation
      const nested = value as Record<string, unknown>;
      for (const [nestedKey, nestedValue] of Object.entries(nested)) {
        result[`${key}.${nestedKey}`] = safeSerialize(nestedValue, 1);
      }
    } else {
      result[key] = safeSerialize(value, 1);
    }
  }
  
  return result;
}