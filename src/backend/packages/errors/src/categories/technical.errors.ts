import { BaseError, ErrorType, JourneyContext } from '../base';

/**
 * Base class for all technical/system errors.
 * Used for errors related to system failures and unexpected conditions.
 */
export class TechnicalError extends BaseError {
  /**
   * Creates a new TechnicalError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param details - Additional details about the technical error
   * @param context - Additional context information about the error
   * @param suggestion - Suggested action to resolve the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {},
    suggestion?: string,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      code,
      context,
      details,
      suggestion,
      cause
    );
    this.name = 'TechnicalError';
    Object.setPrototypeOf(this, TechnicalError.prototype);
  }
}

/**
 * Error thrown when an internal server error occurs.
 */
export class InternalServerError extends TechnicalError {
  /**
   * Creates a new InternalServerError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Additional details about the error
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'An internal server error occurred',
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {},
    cause?: Error
  ) {
    super(
      message,
      'INTERNAL_SERVER_ERROR',
      details,
      context,
      'Please try again later or contact support if the problem persists',
      cause
    );
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Error thrown when a database operation fails.
 */
export class DatabaseError extends TechnicalError {
  /**
   * Creates a new DatabaseError instance.
   * 
   * @param message - Human-readable error message
   * @param operation - Database operation that failed
   * @param details - Additional details about the error
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    operation: string,
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {},
    cause?: Error
  ) {
    super(
      message,
      'DATABASE_ERROR',
      { operation, ...details },
      context,
      'Please try again later or contact support if the problem persists',
      cause
    );
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Error thrown when a configuration error occurs.
 */
export class ConfigurationError extends TechnicalError {
  /**
   * Creates a new ConfigurationError instance.
   * 
   * @param message - Human-readable error message
   * @param configKey - Configuration key that has an issue
   * @param details - Additional details about the error
   * @param context - Additional context information about the error
   */
  constructor(
    message: string,
    configKey: string,
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      message,
      'CONFIGURATION_ERROR',
      { configKey, ...details },
      context,
      'Please check the application configuration'
    );
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Error thrown when an operation times out.
 */
export class TimeoutError extends TechnicalError {
  /**
   * Creates a new TimeoutError instance.
   * 
   * @param operation - Operation that timed out
   * @param timeoutMs - Timeout in milliseconds
   * @param context - Additional context information about the error
   */
  constructor(
    operation: string,
    timeoutMs: number,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      'TIMEOUT',
      { operation, timeoutMs },
      context,
      'Please try again later or with a longer timeout'
    );
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error thrown when data processing fails.
 */
export class DataProcessingError extends TechnicalError {
  /**
   * Creates a new DataProcessingError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Additional details about the error
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {},
    cause?: Error
  ) {
    super(
      message,
      'DATA_PROCESSING_ERROR',
      details,
      context,
      'Please check the input data format and try again',
      cause
    );
    this.name = 'DataProcessingError';
    Object.setPrototypeOf(this, DataProcessingError.prototype);
  }
}

/**
 * Error thrown when a service is unavailable.
 */
export class ServiceUnavailableError extends TechnicalError {
  /**
   * Creates a new ServiceUnavailableError instance.
   * 
   * @param serviceName - Name of the unavailable service
   * @param details - Additional details about the error
   * @param context - Additional context information about the error
   */
  constructor(
    serviceName: string,
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      `Service '${serviceName}' is currently unavailable`,
      'SERVICE_UNAVAILABLE',
      { serviceName, ...details },
      context,
      'Please try again later'
    );
    this.name = 'ServiceUnavailableError';
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}