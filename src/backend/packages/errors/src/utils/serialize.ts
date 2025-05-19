import { AppException, ErrorType } from '@austa/interfaces/common';

/**
 * Interface for serialized error objects.
 * Provides a standardized structure for error reporting across service boundaries.
 */
export interface SerializedError {
  /** Error message */
  message: string;
  /** Error name or class */
  name: string;
  /** Error type category */
  type: string;
  /** Error code for more specific categorization */
  code?: string;
  /** Additional error details */
  details?: any;
  /** Stack trace (included based on environment) */
  stack?: string;
  /** Serialized cause of this error, if any */
  cause?: SerializedError;
  /** Original error properties not covered by standard fields */
  originalError?: Record<string, any>;
}

/**
 * Configuration options for error serialization.
 */
export interface SerializeOptions {
  /** Whether to include stack traces */
  includeStack?: boolean;
  /** Whether to include the original error properties */
  includeOriginalError?: boolean;
  /** Whether to redact sensitive information */
  redactSensitive?: boolean;
  /** Maximum depth for cause chain serialization */
  maxCauseDepth?: number;
}

/**
 * Default serialization options based on environment.
 */
const getDefaultOptions = (): SerializeOptions => {
  const isDev = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  return {
    includeStack: isDev || isTest,
    includeOriginalError: isDev || isTest,
    redactSensitive: true,
    maxCauseDepth: 5,
  };
};

/**
 * Patterns for identifying sensitive information that should be redacted.
 */
const SENSITIVE_PATTERNS = [
  // Password fields
  /password/i,
  /passwd/i,
  /secret/i,
  // Authentication tokens
  /token/i,
  /auth/i,
  /jwt/i,
  /bearer/i,
  // Personal identifiable information
  /ssn/i,
  /social.*security/i,
  /credit.*card/i,
  /card.*number/i,
  /cvv/i,
];

/**
 * Redacts sensitive information from error details.
 * 
 * @param value - The value to check and potentially redact
 * @param key - The key associated with the value
 * @returns The original value or a redacted version
 */
export const redactSensitiveInfo = (value: any, key?: string): any => {
  // If no key is provided or value is not a string, recursively process objects
  if (value === null || value === undefined) {
    return value;
  }
  
  // Handle objects recursively
  if (typeof value === 'object' && !Array.isArray(value)) {
    const redactedObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      redactedObj[k] = redactSensitiveInfo(v, k);
    }
    return redactedObj;
  }
  
  // Handle arrays recursively
  if (Array.isArray(value)) {
    return value.map(item => redactSensitiveInfo(item));
  }
  
  // Check if the key matches any sensitive patterns
  if (key && typeof value === 'string') {
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(key)) {
        return '[REDACTED]';
      }
    }
  }
  
  return value;
};

/**
 * Serializes a standard Error object.
 * 
 * @param error - The Error object to serialize
 * @param options - Serialization options
 * @returns A serialized representation of the error
 */
export const serializeStandardError = (
  error: Error,
  options: SerializeOptions = getDefaultOptions(),
): SerializedError => {
  const serialized: SerializedError = {
    message: error.message || 'Unknown error',
    name: error.name || 'Error',
    type: ErrorType.TECHNICAL, // Default type for standard errors
  };
  
  // Include stack trace if specified
  if (options.includeStack && error.stack) {
    serialized.stack = error.stack;
  }
  
  // Process cause chain if present and within depth limit
  if (error.cause && options.maxCauseDepth && options.maxCauseDepth > 0) {
    const causeOptions = {
      ...options,
      maxCauseDepth: options.maxCauseDepth - 1,
    };
    serialized.cause = serializeError(error.cause, causeOptions);
  }
  
  // Include additional properties from the original error
  if (options.includeOriginalError) {
    const originalError: Record<string, any> = {};
    const errorKeys = Object.getOwnPropertyNames(error);
    
    for (const key of errorKeys) {
      // Skip properties already included in the serialized error
      if (!['message', 'name', 'stack', 'cause'].includes(key)) {
        const value = (error as any)[key];
        originalError[key] = options.redactSensitive 
          ? redactSensitiveInfo(value, key)
          : value;
      }
    }
    
    if (Object.keys(originalError).length > 0) {
      serialized.originalError = originalError;
    }
  }
  
  return serialized;
};

/**
 * Serializes an AppException object.
 * 
 * @param error - The AppException to serialize
 * @param options - Serialization options
 * @returns A serialized representation of the AppException
 */
export const serializeAppException = (
  error: AppException,
  options: SerializeOptions = getDefaultOptions(),
): SerializedError => {
  const serialized: SerializedError = {
    message: error.message,
    name: error.name || error.constructor.name,
    type: error.type,
    code: error.code,
  };
  
  // Include stack trace if specified
  if (options.includeStack && error.stack) {
    serialized.stack = error.stack;
  }
  
  // Include details if present, with sensitive information redacted if specified
  if (error.details) {
    serialized.details = options.redactSensitive 
      ? redactSensitiveInfo(error.details)
      : error.details;
  }
  
  // Process cause chain if present and within depth limit
  if (error.cause && options.maxCauseDepth && options.maxCauseDepth > 0) {
    const causeOptions = {
      ...options,
      maxCauseDepth: options.maxCauseDepth - 1,
    };
    serialized.cause = serializeError(error.cause, causeOptions);
  }
  
  return serialized;
};

/**
 * Main function to serialize any error object to a standardized format.
 * Handles both standard Error objects and AppException instances.
 * 
 * @param error - The error to serialize
 * @param options - Serialization options
 * @returns A serialized representation of the error
 */
export const serializeError = (
  error: unknown,
  options: SerializeOptions = getDefaultOptions(),
): SerializedError => {
  // Handle case where error is already a SerializedError
  if (typeof error === 'object' && error !== null && 'message' in error && 'name' in error) {
    const serializedError = error as Partial<SerializedError>;
    if (serializedError.type) {
      return serializedError as SerializedError;
    }
  }
  
  // Handle non-Error objects
  if (!(error instanceof Error)) {
    return {
      message: String(error),
      name: 'UnknownError',
      type: ErrorType.TECHNICAL,
      details: typeof error === 'object' ? (options.redactSensitive ? redactSensitiveInfo(error) : error) : undefined,
    };
  }
  
  // Handle AppException instances
  if (error instanceof AppException) {
    return serializeAppException(error, options);
  }
  
  // Handle standard Error objects
  return serializeStandardError(error, options);
};

/**
 * Creates a serialized error response suitable for HTTP responses.
 * 
 * @param error - The error to serialize
 * @param options - Serialization options
 * @returns A structured error response object
 */
export const createErrorResponse = (
  error: unknown,
  options: SerializeOptions = getDefaultOptions(),
): { error: SerializedError } => {
  return { error: serializeError(error, options) };
};

/**
 * Serializes an error with production-safe settings.
 * Limits details to what's appropriate for production environments.
 * 
 * @param error - The error to serialize
 * @returns A production-safe serialized error
 */
export const serializeErrorForProduction = (error: unknown): SerializedError => {
  return serializeError(error, {
    includeStack: false,
    includeOriginalError: false,
    redactSensitive: true,
    maxCauseDepth: 3,
  });
};

/**
 * Serializes an error with full details for development and debugging.
 * Includes all available information about the error.
 * 
 * @param error - The error to serialize
 * @returns A detailed serialized error for development
 */
export const serializeErrorForDevelopment = (error: unknown): SerializedError => {
  return serializeError(error, {
    includeStack: true,
    includeOriginalError: true,
    redactSensitive: false,
    maxCauseDepth: 10,
  });
};

/**
 * Serializes an error based on the current environment.
 * Uses production settings in production, and development settings otherwise.
 * 
 * @param error - The error to serialize
 * @returns An environment-appropriate serialized error
 */
export const serializeErrorForEnvironment = (error: unknown): SerializedError => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction 
    ? serializeErrorForProduction(error)
    : serializeErrorForDevelopment(error);
};