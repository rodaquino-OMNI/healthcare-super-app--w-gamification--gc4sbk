/**
 * Utility functions for formatting various data types for structured logging.
 * These utilities ensure consistent and readable log output across all services.
 */

/**
 * Maximum depth for object serialization to prevent excessive nesting
 */
const MAX_DEPTH = 10;

/**
 * Symbol used to mark objects that have been visited during circular reference detection
 */
const VISITED = Symbol('visited');

/**
 * Formats an error object for logging, including stack trace if available
 * @param error The error object to format
 * @returns A structured object representation of the error
 */
export function formatError(error: Error | unknown): Record<string, any> {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  const formattedError: Record<string, any> = {
    name: error.name,
    message: error.message,
  };

  if (error.stack) {
    formattedError.stack = parseStackTrace(error.stack);
  }

  // Add additional properties from the error object
  Object.getOwnPropertyNames(error).forEach((key) => {
    if (key !== 'name' && key !== 'message' && key !== 'stack') {
      const value = (error as any)[key];
      formattedError[key] = value;
    }
  });

  return formattedError;
}

/**
 * Parses a stack trace string into an array of stack frames
 * @param stack The stack trace string
 * @returns An array of parsed stack frames
 */
function parseStackTrace(stack: string): Array<Record<string, string>> {
  const lines = stack.split('\n').slice(1); // Skip the first line which is the error message
  
  return lines.map((line) => {
    const trimmed = line.trim();
    // Match common stack trace patterns
    const match = trimmed.match(/at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/);
    
    if (!match) {
      return { raw: trimmed };
    }
    
    const [, fnName, fileName, lineNumber, colNumber, alternative] = match;
    
    return {
      function: fnName || 'anonymous',
      file: fileName || alternative || 'unknown',
      line: lineNumber || 'unknown',
      column: colNumber || 'unknown',
    };
  });
}

/**
 * Formats a timestamp to ISO string with millisecond precision
 * @param date The date to format (defaults to current time)
 * @returns ISO formatted timestamp string
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Safely serializes an object for logging, handling circular references
 * @param obj The object to serialize
 * @param depth Current recursion depth (used internally)
 * @returns A safe-to-log object with circular references resolved
 */
export function safeSerialize(obj: any, depth: number = 0): any {
  // Handle primitive types directly
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitive types and functions
  const type = typeof obj;
  if (type !== 'object' && type !== 'function') {
    return obj;
  }

  // Handle functions
  if (type === 'function') {
    return '[Function]';
  }

  // Prevent circular references and excessive depth
  if (depth > MAX_DEPTH) {
    return '[Object: Nested too deep]';
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return formatTimestamp(obj);
  }

  // Handle Error objects
  if (obj instanceof Error) {
    return formatError(obj);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => safeSerialize(item, depth + 1));
  }

  // Check for circular references
  if ((obj as any)[VISITED]) {
    return '[Circular Reference]';
  }

  try {
    // Mark object as visited for circular reference detection
    Object.defineProperty(obj, VISITED, { value: true, enumerable: false });

    // Process regular objects
    const result: Record<string, any> = {};
    
    // Get all enumerable properties
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        try {
          const value = obj[key];
          result[key] = safeSerialize(value, depth + 1);
        } catch (err) {
          result[key] = '[Serialization Error]';
        }
      }
    }
    
    return result;
  } finally {
    // Clean up the visited marker
    if (obj && typeof obj === 'object') {
      delete (obj as any)[VISITED];
    }
  }
}

/**
 * Formats an object for structured logging
 * @param obj The object to format
 * @returns A formatted object safe for logging
 */
export function formatObject(obj: any): Record<string, any> {
  return safeSerialize(obj);
}

/**
 * Formats context information for logging
 * @param context The context object containing metadata
 * @returns A formatted context object
 */
export function formatContext(context: Record<string, any>): Record<string, any> {
  const formattedContext: Record<string, any> = {};
  
  // Process standard context fields
  if (context.requestId) {
    formattedContext.requestId = context.requestId;
  }
  
  if (context.userId) {
    formattedContext.userId = context.userId;
  }
  
  if (context.journey) {
    formattedContext.journey = context.journey;
  }
  
  if (context.traceId) {
    formattedContext.traceId = context.traceId;
  }
  
  if (context.spanId) {
    formattedContext.spanId = context.spanId;
  }
  
  // Add any additional context fields
  Object.keys(context).forEach(key => {
    if (!['requestId', 'userId', 'journey', 'traceId', 'spanId'].includes(key)) {
      formattedContext[key] = safeSerialize(context[key]);
    }
  });
  
  return formattedContext;
}

/**
 * Formats journey-specific data for logging
 * @param journeyType The type of journey (health, care, plan)
 * @param data The journey-specific data to format
 * @returns Formatted journey data
 */
export function formatJourneyData(
  journeyType: 'health' | 'care' | 'plan', 
  data: Record<string, any>
): Record<string, any> {
  const formattedData = safeSerialize(data);
  
  // Add journey-specific formatting logic
  switch (journeyType) {
    case 'health':
      // Format health journey specific data
      if (formattedData.metrics) {
        // Summarize metrics for logging if there are too many
        if (Array.isArray(formattedData.metrics) && formattedData.metrics.length > 10) {
          formattedData.metrics = {
            count: formattedData.metrics.length,
            sample: formattedData.metrics.slice(0, 3),
            message: 'Array truncated for logging',
          };
        }
      }
      break;
      
    case 'care':
      // Format care journey specific data
      if (formattedData.appointments) {
        // Summarize appointments for logging
        if (Array.isArray(formattedData.appointments) && formattedData.appointments.length > 5) {
          formattedData.appointments = {
            count: formattedData.appointments.length,
            sample: formattedData.appointments.slice(0, 2),
            message: 'Array truncated for logging',
          };
        }
      }
      break;
      
    case 'plan':
      // Format plan journey specific data
      if (formattedData.claims) {
        // Summarize claims for logging
        if (Array.isArray(formattedData.claims) && formattedData.claims.length > 5) {
          formattedData.claims = {
            count: formattedData.claims.length,
            sample: formattedData.claims.slice(0, 2),
            message: 'Array truncated for logging',
          };
        }
      }
      break;
  }
  
  return formattedData;
}

/**
 * Creates a structured log entry with standardized format
 * @param level The log level
 * @param message The log message
 * @param context Additional context information
 * @param error Optional error object
 * @returns A structured log entry object
 */
export function createLogEntry(
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal',
  message: string,
  context?: Record<string, any>,
  error?: Error | unknown
): Record<string, any> {
  const logEntry: Record<string, any> = {
    timestamp: formatTimestamp(),
    level,
    message,
  };
  
  // Add formatted context if provided
  if (context) {
    logEntry.context = formatContext(context);
  }
  
  // Add formatted error if provided
  if (error) {
    logEntry.error = formatError(error);
  }
  
  return logEntry;
}