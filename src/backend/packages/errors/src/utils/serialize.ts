import { AppException, ErrorType } from '@austa/interfaces/common';

/**
 * Configuration options for error serialization
 */
export interface SerializeErrorOptions {
  /**
   * Include stack trace in serialized error
   * @default false in production, true otherwise
   */
  includeStack?: boolean;
  
  /**
   * Include cause chain in serialized error
   * @default false in production, true otherwise
   */
  includeCause?: boolean;
  
  /**
   * Maximum depth to traverse when serializing cause chain
   * @default 3
   */
  maxCauseDepth?: number;
  
  /**
   * List of property names to redact from error details
   * @default ['password', 'token', 'secret', 'key', 'authorization']
   */
  redactProperties?: string[];

  /**
   * Maximum depth to traverse when serializing nested objects
   * @default 10
   */
  maxObjectDepth?: number;

  /**
   * Whether to use toJSON method if available on the error object
   * @default true
   */
  useToJSON?: boolean;
}

/**
 * Standard serialized error structure
 */
export interface SerializedError {
  /**
   * Error type (validation, business, technical, external)
   */
  type: string;
  
  /**
   * Error code for more specific categorization
   */
  code: string;
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * Additional details about the error
   */
  details?: any;
  
  /**
   * Stack trace (included based on options)
   */
  stack?: string;
  
  /**
   * Original error that caused this exception (included based on options)
   */
  cause?: SerializedError;

  /**
   * Name of the error constructor
   */
  name?: string;
}

// Default sensitive properties that should be redacted
const DEFAULT_REDACT_PROPERTIES = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'auth',
  'credential',
  'apiKey',
  'accessToken',
  'refreshToken',
  'jwt'
];

/**
 * Default serialization options based on environment
 */
const getDefaultOptions = (): SerializeErrorOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    includeStack: !isProduction,
    includeCause: !isProduction,
    maxCauseDepth: 3,
    maxObjectDepth: 10,
    useToJSON: true,
    redactProperties: DEFAULT_REDACT_PROPERTIES
  };
};

/**
 * Checks if an object is a plain object (not an array, function, etc.)
 * 
 * @param obj - Object to check
 * @returns True if the object is a plain object
 */
const isPlainObject = (obj: any): boolean => {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const proto = Object.getPrototypeOf(obj);
  return proto === Object.prototype || proto === null;
};

/**
 * Checks if an object looks like an error (has name, message, and stack properties)
 * 
 * @param obj - Object to check
 * @returns True if the object looks like an error
 */
const isErrorLike = (obj: any): boolean => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.message === 'string' &&
    (typeof obj.name === 'string' || typeof obj.stack === 'string')
  );
};

/**
 * Set to track objects during serialization to prevent circular references
 */
type SeenObjects = Set<any>;

/**
 * Redacts sensitive information from error details
 * 
 * @param details - Error details object to redact
 * @param redactProperties - List of property names to redact
 * @param maxDepth - Maximum depth to traverse
 * @param currentDepth - Current depth in the traversal
 * @param seen - Set of already seen objects to prevent circular references
 * @returns Redacted copy of details object
 */
export const redactSensitiveInfo = (
  details: any,
  redactProperties: string[] = DEFAULT_REDACT_PROPERTIES,
  maxDepth: number = 10,
  currentDepth: number = 0,
  seen: SeenObjects = new Set()
): any => {
  // Handle primitive values
  if (details === null || typeof details !== 'object') {
    return details;
  }

  // Handle circular references
  if (seen.has(details)) {
    return '[Circular Reference]';
  }

  // Stop at maximum depth
  if (currentDepth >= maxDepth) {
    return Array.isArray(details) ? '[Array]' : '[Object]';
  }

  // Add current object to seen set
  seen.add(details);
  
  // Handle arrays
  if (Array.isArray(details)) {
    const result = details.map(item => 
      redactSensitiveInfo(item, redactProperties, maxDepth, currentDepth + 1, seen)
    );
    seen.delete(details);
    return result;
  }

  // Handle Buffer objects
  if (Buffer.isBuffer(details)) {
    return '[Buffer]';
  }

  // Handle Date objects
  if (details instanceof Date) {
    return details.toISOString();
  }
  
  // Create a deep copy for plain objects
  const redacted: Record<string, any> = {};
  
  // Get all properties, including non-enumerable ones for error objects
  const keys = isErrorLike(details) 
    ? Object.getOwnPropertyNames(details) 
    : Object.keys(details);
  
  // Process each property
  for (const key of keys) {
    // Skip functions and internal properties
    if (typeof details[key] === 'function' || key === '__proto__') {
      continue;
    }

    const lowerKey = key.toLowerCase();
    
    // Check if this property should be redacted
    const shouldRedact = redactProperties.some(prop => 
      lowerKey === prop.toLowerCase() || lowerKey.includes(prop.toLowerCase())
    );
    
    if (shouldRedact) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactSensitiveInfo(
        details[key], 
        redactProperties, 
        maxDepth, 
        currentDepth + 1, 
        seen
      );
    }
  }
  
  // Remove current object from seen set before returning
  seen.delete(details);
  return redacted;
};

/**
 * Serializes a standard Error object to a structured format
 * 
 * @param error - Standard Error object to serialize
 * @param options - Serialization options
 * @param seen - Set of already seen objects to prevent circular references
 * @returns Serialized error object
 */
export const serializeStandardError = (
  error: Error,
  options: SerializeErrorOptions = getDefaultOptions(),
  seen: SeenObjects = new Set()
): SerializedError => {
  const { 
    includeStack, 
    includeCause, 
    maxCauseDepth = 3, 
    maxObjectDepth = 10,
    useToJSON = true,
    redactProperties 
  } = options;

  // Handle circular references
  if (seen.has(error)) {
    return {
      type: ErrorType.TECHNICAL,
      code: 'CIRCULAR_ERROR',
      message: 'Circular reference in error object'
    };
  }

  // Add current error to seen set
  seen.add(error);
  
  // Use toJSON if available and enabled
  if (useToJSON && typeof error.toJSON === 'function') {
    try {
      const jsonResult = error.toJSON();
      // Ensure the result has the minimum required properties
      if (jsonResult && typeof jsonResult === 'object') {
        const result: SerializedError = {
          type: ErrorType.TECHNICAL,
          code: jsonResult.code || 'SYSTEM_ERROR',
          message: jsonResult.message || error.message || 'An unexpected error occurred',
          name: jsonResult.name || error.name
        };

        // Include additional properties from toJSON result
        if (jsonResult.details) {
          result.details = redactSensitiveInfo(
            jsonResult.details, 
            redactProperties, 
            maxObjectDepth
          );
        }

        if (includeStack && (jsonResult.stack || error.stack)) {
          result.stack = jsonResult.stack || error.stack;
        }

        // Remove from seen set before returning
        seen.delete(error);
        return result;
      }
    } catch (e) {
      // If toJSON throws, fall back to standard serialization
    }
  }

  // Standard serialization
  const serialized: SerializedError = {
    type: ErrorType.TECHNICAL,
    code: 'SYSTEM_ERROR',
    message: error.message || 'An unexpected error occurred',
    name: error.name
  };
  
  // Include stack trace if enabled
  if (includeStack && error.stack) {
    serialized.stack = error.stack;
  }
  
  // Include cause chain if enabled and available
  if (includeCause && maxCauseDepth > 0 && 'cause' in error && error.cause) {
    serialized.cause = serializeError(
      error.cause,
      {
        ...options,
        maxCauseDepth: maxCauseDepth - 1
      },
      seen
    );
  }

  // Include any additional properties from the error
  const errorProps = Object.getOwnPropertyNames(error).filter(prop => 
    !['name', 'message', 'stack', 'cause'].includes(prop) && 
    typeof error[prop as keyof Error] !== 'function'
  );

  if (errorProps.length > 0) {
    serialized.details = serialized.details || {};
    
    for (const prop of errorProps) {
      serialized.details[prop] = redactSensitiveInfo(
        (error as any)[prop], 
        redactProperties, 
        maxObjectDepth
      );
    }
  }
  
  // Remove from seen set before returning
  seen.delete(error);
  return serialized;
};

/**
 * Serializes an AppException to a structured format
 * 
 * @param exception - AppException to serialize
 * @param options - Serialization options
 * @param seen - Set of already seen objects to prevent circular references
 * @returns Serialized error object
 */
export const serializeAppException = (
  exception: AppException,
  options: SerializeErrorOptions = getDefaultOptions(),
  seen: SeenObjects = new Set()
): SerializedError => {
  const { 
    includeStack, 
    includeCause, 
    maxCauseDepth = 3, 
    maxObjectDepth = 10,
    useToJSON = true,
    redactProperties 
  } = options;

  // Handle circular references
  if (seen.has(exception)) {
    return {
      type: ErrorType.TECHNICAL,
      code: 'CIRCULAR_ERROR',
      message: 'Circular reference in error object'
    };
  }

  // Add current exception to seen set
  seen.add(exception);
  
  // Use toJSON if available and enabled
  if (useToJSON && typeof exception.toJSON === 'function') {
    try {
      const jsonResult = exception.toJSON();
      // Remove from seen set before returning
      seen.delete(exception);
      return jsonResult.error || jsonResult;
    } catch (e) {
      // If toJSON throws, fall back to standard serialization
    }
  }
  
  const serialized: SerializedError = {
    type: exception.type,
    code: exception.code,
    message: exception.message,
    name: exception.name
  };
  
  // Include details if available, with sensitive information redacted
  if (exception.details) {
    serialized.details = redactSensitiveInfo(
      exception.details, 
      redactProperties, 
      maxObjectDepth,
      0,
      seen
    );
  }
  
  // Include stack trace if enabled
  if (includeStack && exception.stack) {
    serialized.stack = exception.stack;
  }
  
  // Include cause chain if enabled and available
  if (includeCause && maxCauseDepth > 0 && exception.cause) {
    serialized.cause = serializeError(
      exception.cause,
      {
        ...options,
        maxCauseDepth: maxCauseDepth - 1
      },
      seen
    );
  }
  
  // Remove from seen set before returning
  seen.delete(exception);
  return serialized;
};

/**
 * Serializes any error object to a structured format
 * 
 * @param error - Error object to serialize
 * @param options - Serialization options
 * @param seen - Set of already seen objects to prevent circular references
 * @returns Serialized error object
 */
export const serializeError = (
  error: unknown,
  options: SerializeErrorOptions = getDefaultOptions(),
  seen: SeenObjects = new Set()
): SerializedError => {
  // Handle case when error is already a serialized error
  if (error && typeof error === 'object' && 'type' in error && 'code' in error && 'message' in error) {
    return error as SerializedError;
  }
  
  // Handle AppException
  if (error instanceof AppException) {
    return serializeAppException(error, options, seen);
  }
  
  // Handle standard Error
  if (error instanceof Error) {
    return serializeStandardError(error, options, seen);
  }

  // Handle error-like objects (with name, message, stack)
  if (error && typeof error === 'object' && isErrorLike(error)) {
    // Create a synthetic Error to use with serializeStandardError
    const syntheticError = new Error((error as any).message);
    syntheticError.name = (error as any).name || 'Error';
    if ((error as any).stack) {
      syntheticError.stack = (error as any).stack;
    }
    
    // Copy all other properties
    for (const key of Object.getOwnPropertyNames(error)) {
      if (!['name', 'message', 'stack'].includes(key)) {
        (syntheticError as any)[key] = (error as any)[key];
      }
    }
    
    return serializeStandardError(syntheticError, options, seen);
  }
  
  // Handle non-Error objects
  if (error && typeof error === 'object') {
    return {
      type: ErrorType.TECHNICAL,
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: redactSensitiveInfo(
        error, 
        options.redactProperties, 
        options.maxObjectDepth || 10,
        0,
        seen
      )
    };
  }
  
  // Handle primitive values
  return {
    type: ErrorType.TECHNICAL,
    code: 'UNKNOWN_ERROR',
    message: error ? String(error) : 'An unknown error occurred'
  };
};

/**
 * Serializes an error for client-side consumption
 * Limits information to what's appropriate for end users
 * 
 * @param error - Error to serialize for client
 * @returns Client-safe serialized error
 */
export const serializeErrorForClient = (error: unknown): SerializedError => {
  const serialized = serializeError(error, {
    includeStack: false,
    includeCause: false,
    maxObjectDepth: 5,
    useToJSON: true,
    redactProperties: DEFAULT_REDACT_PROPERTIES
  });
  
  // For technical errors, provide a generic message to avoid exposing system details
  if (serialized.type === ErrorType.TECHNICAL) {
    serialized.message = 'An unexpected system error occurred. Please try again later.';
    delete serialized.details;
    delete serialized.stack;
    delete serialized.cause;
  }
  
  // For external errors, provide a generic message
  if (serialized.type === ErrorType.EXTERNAL) {
    serialized.message = 'The system is currently unable to complete your request due to an external service issue. Please try again later.';
    delete serialized.details;
    delete serialized.stack;
    delete serialized.cause;
  }
  
  return serialized;
};

/**
 * Serializes an error for logging purposes
 * Includes maximum detail for debugging
 * 
 * @param error - Error to serialize for logging
 * @returns Detailed serialized error for logs
 */
export const serializeErrorForLogging = (error: unknown): SerializedError => {
  return serializeError(error, {
    includeStack: true,
    includeCause: true,
    maxCauseDepth: 10,
    maxObjectDepth: 15,
    useToJSON: true,
    redactProperties: DEFAULT_REDACT_PROPERTIES
  });
};

/**
 * Serializes an error for transmission between services
 * Balances detail with security considerations
 * 
 * @param error - Error to serialize for service communication
 * @returns Serialized error suitable for inter-service communication
 */
export const serializeErrorForServices = (error: unknown): SerializedError => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return serializeError(error, {
    includeStack: !isProduction,
    includeCause: true,
    maxCauseDepth: 5,
    maxObjectDepth: 8,
    useToJSON: true,
    redactProperties: DEFAULT_REDACT_PROPERTIES
  });
};

/**
 * Serializes an error for journey-specific context
 * Includes journey-relevant details while maintaining security
 * 
 * @param error - Error to serialize with journey context
 * @param journeyType - Type of journey (health, care, plan)
 * @returns Journey-contextualized serialized error
 */
export const serializeErrorForJourney = (
  error: unknown, 
  journeyType: 'health' | 'care' | 'plan'
): SerializedError => {
  const serialized = serializeErrorForClient(error);
  
  // Add journey-specific context to the error message
  if (serialized.type === ErrorType.VALIDATION) {
    // Keep validation errors as-is, they're usually helpful to users
    return serialized;
  }
  
  // Customize messages based on journey type
  switch (journeyType) {
    case 'health':
      if (serialized.type === ErrorType.TECHNICAL) {
        serialized.message = 'We encountered an issue while processing your health data. Please try again later.';
      } else if (serialized.type === ErrorType.EXTERNAL) {
        serialized.message = 'We are currently unable to connect to your health devices. Please try again later.';
      }
      break;
      
    case 'care':
      if (serialized.type === ErrorType.TECHNICAL) {
        serialized.message = 'We encountered an issue while processing your care request. Please try again later.';
      } else if (serialized.type === ErrorType.EXTERNAL) {
        serialized.message = 'We are currently unable to connect to the care provider system. Please try again later.';
      }
      break;
      
    case 'plan':
      if (serialized.type === ErrorType.TECHNICAL) {
        serialized.message = 'We encountered an issue while processing your plan information. Please try again later.';
      } else if (serialized.type === ErrorType.EXTERNAL) {
        serialized.message = 'We are currently unable to connect to the insurance system. Please try again later.';
      }
      break;
  }
  
  return serialized;
};