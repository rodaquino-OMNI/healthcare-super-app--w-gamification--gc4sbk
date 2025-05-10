/**
 * Error categories for event-related errors.
 */
export enum ErrorCategory {
  /**
   * Errors related to connection issues.
   */
  CONNECTION = 'CONNECTION',
  
  /**
   * Errors related to message production.
   */
  PRODUCER = 'PRODUCER',
  
  /**
   * Errors related to message consumption.
   */
  CONSUMER = 'CONSUMER',
  
  /**
   * Errors related to message serialization.
   */
  SERIALIZATION = 'SERIALIZATION',
  
  /**
   * Errors related to message deserialization.
   */
  DESERIALIZATION = 'DESERIALIZATION',
  
  /**
   * Errors related to schema validation.
   */
  VALIDATION = 'VALIDATION',
  
  /**
   * Errors related to configuration issues.
   */
  CONFIGURATION = 'CONFIGURATION',
  
  /**
   * Errors related to timeout issues.
   */
  TIMEOUT = 'TIMEOUT',
  
  /**
   * Errors related to authentication issues.
   */
  AUTHENTICATION = 'AUTHENTICATION',
  
  /**
   * Errors related to authorization issues.
   */
  AUTHORIZATION = 'AUTHORIZATION',
  
  /**
   * Errors related to resource issues.
   */
  RESOURCE = 'RESOURCE',
  
  /**
   * Errors related to unknown issues.
   */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Base error class for event-related errors.
 */
export class EventError extends Error {
  /**
   * Error category.
   */
  readonly category: ErrorCategory;
  
  /**
   * Error code for identification.
   */
  readonly code: string;
  
  /**
   * Additional context for the error.
   */
  readonly context: Record<string, any>;
  
  /**
   * Original error that caused this error, if any.
   */
  readonly originalError?: Error;
  
  /**
   * Creates a new EventError instance.
   * 
   * @param message - Error message
   * @param category - Error category
   * @param code - Error code
   * @param context - Additional context
   * @param originalError - Original error that caused this error
   */
  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    code: string = 'UNKNOWN',
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message);
    this.name = 'EventError';
    this.category = category;
    this.code = code;
    this.context = context;
    this.originalError = originalError;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EventError);
    }
  }
  
  /**
   * Returns a string representation of the error.
   */
  toString(): string {
    return `[${this.category}:${this.code}] ${this.message}`;
  }
  
  /**
   * Converts the error to a plain object for logging.
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      code: this.code,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined
    };
  }
}

/**
 * Error class for connection-related errors.
 */
export class ConnectionError extends EventError {
  constructor(
    message: string,
    code: string = 'CONNECTION_001',
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, ErrorCategory.CONNECTION, code, context, originalError);
    this.name = 'ConnectionError';
  }
}

/**
 * Error class for producer-related errors.
 */
export class ProducerError extends EventError {
  constructor(
    message: string,
    code: string = 'PRODUCER_001',
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, ErrorCategory.PRODUCER, code, context, originalError);
    this.name = 'ProducerError';
  }
}

/**
 * Error class for consumer-related errors.
 */
export class ConsumerError extends EventError {
  constructor(
    message: string,
    code: string = 'CONSUMER_001',
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, ErrorCategory.CONSUMER, code, context, originalError);
    this.name = 'ConsumerError';
  }
}

/**
 * Error class for serialization-related errors.
 */
export class SerializationError extends EventError {
  constructor(
    message: string,
    code: string = 'SERIALIZATION_001',
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, ErrorCategory.SERIALIZATION, code, context, originalError);
    this.name = 'SerializationError';
  }
}

/**
 * Error class for deserialization-related errors.
 */
export class DeserializationError extends EventError {
  constructor(
    message: string,
    code: string = 'DESERIALIZATION_001',
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, ErrorCategory.DESERIALIZATION, code, context, originalError);
    this.name = 'DeserializationError';
  }
}

/**
 * Error class for validation-related errors.
 */
export class ValidationError extends EventError {
  constructor(
    message: string,
    code: string = 'VALIDATION_001',
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, ErrorCategory.VALIDATION, code, context, originalError);
    this.name = 'ValidationError';
  }
}

/**
 * Error class for configuration-related errors.
 */
export class ConfigurationError extends EventError {
  constructor(
    message: string,
    code: string = 'CONFIGURATION_001',
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, ErrorCategory.CONFIGURATION, code, context, originalError);
    this.name = 'ConfigurationError';
  }
}

/**
 * Error class for timeout-related errors.
 */
export class TimeoutError extends EventError {
  constructor(
    message: string,
    code: string = 'TIMEOUT_001',
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message, ErrorCategory.TIMEOUT, code, context, originalError);
    this.name = 'TimeoutError';
  }
}

/**
 * Utility function to determine if an error is retryable.
 * 
 * @param error - The error to check
 */
export function isRetryableError(error: Error): boolean {
  // If it's our custom error type, check the category
  if (error instanceof EventError) {
    return [
      ErrorCategory.CONNECTION,
      ErrorCategory.TIMEOUT,
      ErrorCategory.RESOURCE
    ].includes(error.category);
  }
  
  // For other errors, check the error message for common retryable patterns
  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('network') ||
    errorMessage.includes('unavailable') ||
    errorMessage.includes('temporary') ||
    errorMessage.includes('overloaded') ||
    errorMessage.includes('too many requests')
  );
}

/**
 * Utility function to determine if an error should be sent to the DLQ.
 * 
 * @param error - The error to check
 */
export function shouldSendToDLQ(error: Error): boolean {
  // If it's our custom error type, check the category
  if (error instanceof EventError) {
    return [
      ErrorCategory.DESERIALIZATION,
      ErrorCategory.VALIDATION,
      ErrorCategory.AUTHORIZATION
    ].includes(error.category);
  }
  
  // For other errors, assume we should send to DLQ
  return true;
}