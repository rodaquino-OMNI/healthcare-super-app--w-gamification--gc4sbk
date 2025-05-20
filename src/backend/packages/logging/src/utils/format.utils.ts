/**
 * Utilities for formatting various data types for structured logging.
 * These utilities ensure consistent and readable log output across all services.
 */

import { LogLevel } from '../interfaces/log-level.enum';

/**
 * Maximum depth for object serialization to prevent excessive nesting
 */
const MAX_DEPTH = 10;

/**
 * Maximum length for string values to prevent excessively large logs
 */
const MAX_STRING_LENGTH = 10000;

/**
 * Symbol used to mark objects that have been visited during circular reference detection
 */
const VISITED = Symbol('visited');

/**
 * Formats an Error object for logging, including stack trace if available
 * @param error The error object to format
 * @returns A formatted object representation of the error
 */
export function formatError(error: Error): Record<string, any> {
  if (!error) {
    return { message: 'Unknown error' };
  }

  const formatted: Record<string, any> = {
    message: error.message || 'Unknown error',
    name: error.name || 'Error',
  };

  // Add stack trace if available
  if (error.stack) {
    formatted.stack = error.stack
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  // Add additional properties from the error object
  Object.getOwnPropertyNames(error).forEach((key) => {
    if (key !== 'message' && key !== 'name' && key !== 'stack') {
      formatted[key] = formatValue((error as any)[key], 1);
    }
  });

  // Handle specific error types with additional properties
  if ('code' in error) {
    formatted.code = (error as any).code;
  }

  if ('statusCode' in error) {
    formatted.statusCode = (error as any).statusCode;
  }

  if ('response' in error) {
    formatted.response = formatValue((error as any).response, 1);
  }

  if ('request' in error) {
    // Only include essential request information to avoid large logs
    const request = (error as any).request;
    if (request) {
      formatted.request = {
        method: request.method,
        url: request.url,
        headers: formatValue(request.headers, 1),
      };
    }
  }

  return formatted;
}

/**
 * Formats a timestamp to ISO string format for consistent logging
 * @param timestamp The timestamp to format (Date object or number)
 * @returns Formatted ISO string timestamp
 */
export function formatTimestamp(timestamp?: Date | number): string {
  if (!timestamp) {
    return new Date().toISOString();
  }

  if (typeof timestamp === 'number') {
    return new Date(timestamp).toISOString();
  }

  return timestamp.toISOString();
}

/**
 * Detects circular references in objects
 * @param obj The object to check for circular references
 * @param seen Set of already seen objects
 * @returns True if the object contains circular references
 */
export function detectCircular(obj: any, seen = new Set()): boolean {
  // Handle non-objects
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  // Check if we've seen this object before
  if (seen.has(obj)) {
    return true;
  }

  // Add this object to the seen set
  seen.add(obj);

  // Check all properties recursively
  for (const key of Object.keys(obj)) {
    if (detectCircular(obj[key], seen)) {
      return true;
    }
  }

  // Remove this object from the seen set before returning
  seen.delete(obj);
  return false;
}

/**
 * Safely stringifies an object, handling circular references
 * @param obj The object to stringify
 * @returns A JSON string representation of the object
 */
export function safeStringify(obj: any): string {
  // Check for circular references
  const hasCircular = detectCircular(obj);

  if (hasCircular) {
    // Use a replacer function to handle circular references
    const seen = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    });
  }

  // No circular references, use standard stringify
  return JSON.stringify(obj);
}

/**
 * Formats an object for logging, handling circular references and limiting depth
 * @param obj The object to format
 * @param depth Current depth in the object tree
 * @returns A formatted object safe for logging
 */
export function formatObject(obj: Record<string, any>, depth = 0): Record<string, any> {
  // Prevent excessive recursion
  if (depth >= MAX_DEPTH) {
    return { value: '[Max Depth Exceeded]' };
  }

  // Handle null
  if (obj === null) {
    return null;
  }

  // Check if this object has already been visited (circular reference)
  if ((obj as any)[VISITED]) {
    return { value: '[Circular Reference]' };
  }

  // Mark this object as visited
  try {
    Object.defineProperty(obj, VISITED, { value: true, enumerable: false });
  } catch (e) {
    // Object might be frozen or non-extensible, in which case we can't add the VISITED symbol
    // Just continue without marking
  }

  const result: Record<string, any> = {};

  // Process each property
  for (const key of Object.keys(obj)) {
    result[key] = formatValue(obj[key], depth + 1);
  }

  // Remove the visited mark
  try {
    delete (obj as any)[VISITED];
  } catch (e) {
    // Ignore errors when removing the property
  }

  return result;
}

/**
 * Formats any value for logging, handling different types appropriately
 * @param value The value to format
 * @param depth Current depth in the object tree
 * @returns A formatted value safe for logging
 */
export function formatValue(value: any, depth = 0): any {
  // Handle null and undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle different types
  switch (typeof value) {
    case 'string':
      // Truncate long strings
      if (value.length > MAX_STRING_LENGTH) {
        return `${value.substring(0, MAX_STRING_LENGTH)}... [truncated, ${value.length} chars total]`;
      }
      return value;

    case 'number':
    case 'boolean':
      return value;

    case 'function':
      return `[Function: ${value.name || 'anonymous'}]`;

    case 'symbol':
      return value.toString();

    case 'bigint':
      return value.toString();

    case 'object':
      // Handle special object types
      if (value instanceof Date) {
        return formatTimestamp(value);
      }

      if (value instanceof Error) {
        return formatError(value);
      }

      if (Array.isArray(value)) {
        // Prevent excessive recursion
        if (depth >= MAX_DEPTH) {
          return `[Array(${value.length})]`;
        }

        // Format each array element
        return value.map((item) => formatValue(item, depth + 1));
      }

      // Regular object
      return formatObject(value, depth);

    default:
      return `[Unhandled type: ${typeof value}]`;
  }
}

/**
 * Formats journey-specific context data for logging
 * @param journeyContext The journey context object
 * @param journeyType The type of journey (health, care, plan)
 * @returns Formatted journey context data
 */
export function formatJourneyContext(
  journeyContext: Record<string, any>,
  journeyType?: 'health' | 'care' | 'plan'
): Record<string, any> {
  if (!journeyContext) {
    return {};
  }

  const formatted: Record<string, any> = {
    journeyType: journeyType || journeyContext.journeyType || 'unknown',
  };

  // Add common journey properties
  if (journeyContext.journeyId) {
    formatted.journeyId = journeyContext.journeyId;
  }

  if (journeyContext.step) {
    formatted.journeyStep = journeyContext.step;
  }

  // Add journey-specific properties based on journey type
  switch (formatted.journeyType) {
    case 'health':
      if (journeyContext.metricType) {
        formatted.healthMetricType = journeyContext.metricType;
      }
      if (journeyContext.deviceId) {
        formatted.healthDeviceId = journeyContext.deviceId;
      }
      break;

    case 'care':
      if (journeyContext.appointmentId) {
        formatted.careAppointmentId = journeyContext.appointmentId;
      }
      if (journeyContext.providerId) {
        formatted.careProviderId = journeyContext.providerId;
      }
      break;

    case 'plan':
      if (journeyContext.planId) {
        formatted.planId = journeyContext.planId;
      }
      if (journeyContext.claimId) {
        formatted.planClaimId = journeyContext.claimId;
      }
      break;
  }

  return formatted;
}

/**
 * Formats a log level for display
 * @param level The log level to format
 * @returns Formatted log level string
 */
export function formatLogLevel(level: LogLevel | string): string {
  if (typeof level === 'string') {
    return level.toUpperCase();
  }
  
  switch (level) {
    case LogLevel.DEBUG:
      return 'DEBUG';
    case LogLevel.INFO:
      return 'INFO';
    case LogLevel.WARN:
      return 'WARN';
    case LogLevel.ERROR:
      return 'ERROR';
    case LogLevel.FATAL:
      return 'FATAL';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Redacts sensitive information from objects before logging
 * @param obj The object to redact
 * @param sensitiveKeys Array of keys to redact
 * @returns Redacted object
 */
export function redactSensitiveInfo(
  obj: Record<string, any>,
  sensitiveKeys: string[] = ['password', 'token', 'secret', 'key', 'authorization', 'apiKey']
): Record<string, any> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if this key should be redacted
    const shouldRedact = sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );

    if (shouldRedact) {
      // Redact the value but preserve type information
      if (typeof value === 'string') {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'number') {
        result[key] = 0;
      } else if (Array.isArray(value)) {
        result[key] = ['[REDACTED]'];
      } else if (value === null) {
        result[key] = null;
      } else if (typeof value === 'object') {
        result[key] = { redacted: true };
      } else {
        result[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively process nested objects
      if (Array.isArray(value)) {
        result[key] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? redactSensitiveInfo(item, sensitiveKeys) 
            : item
        );
      } else {
        result[key] = redactSensitiveInfo(value, sensitiveKeys);
      }
    } else {
      // Pass through non-sensitive values
      result[key] = value;
    }
  }

  return result;
}