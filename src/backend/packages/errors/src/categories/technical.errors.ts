/**
 * @file technical.errors.ts
 * @description Defines specialized error classes for technical/system errors.
 * These errors represent unexpected system failures and internal errors that
 * are not directly related to user input or business logic.
 */

import { ErrorType, JourneyContext } from '../base';
import { BaseError } from '../base';
import { ERROR_CODE_PREFIXES } from '../constants';

/**
 * Base class for all technical errors in the system.
 * Extends BaseError with ErrorType.TECHNICAL.
 */
export class TechnicalError extends BaseError {
  /**
   * Creates a new TechnicalError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param context - Additional context information about the error
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    code: string,
    context: Record<string, any> = {},
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      code,
      { journey: JourneyContext.SYSTEM, ...context },
      details,
      suggestion,
      cause
    );
  }
}

/**
 * Represents a general internal server error.
 * Use this for unexpected errors that don't fit into more specific categories.
 */
export class InternalServerError extends TechnicalError {
  /**
   * Creates a new InternalServerError instance.
   * 
   * @param message - Human-readable error message (defaults to "An unexpected error occurred")
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string = 'An unexpected error occurred',
    details?: any,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(
      message,
      `${ERROR_CODE_PREFIXES.GENERAL}_INTERNAL_ERROR`,
      context,
      details,
      'Please contact support if this issue persists',
      cause
    );
  }
}

/**
 * Represents a database-related error.
 * Use this for errors that occur during database operations.
 */
export class DatabaseError extends TechnicalError {
  /**
   * Creates a new DatabaseError instance.
   * 
   * @param message - Human-readable error message
   * @param operation - The database operation that failed (e.g., "query", "insert", "update")
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string = 'A database error occurred',
    operation: string,
    details?: any,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(
      message,
      `${ERROR_CODE_PREFIXES.GENERAL}_DATABASE_ERROR`,
      { ...context, operation },
      details,
      'The system encountered an issue with the database. Please try again later.',
      cause
    );
  }

  /**
   * Creates a DatabaseError for a failed transaction.
   * 
   * @param cause - Original error that caused the transaction to fail (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new DatabaseError instance for a transaction failure
   */
  static transactionFailed(cause?: Error, context: Record<string, any> = {}): DatabaseError {
    return new DatabaseError(
      'The database transaction failed',
      'transaction',
      undefined,
      context,
      cause
    );
  }

  /**
   * Creates a DatabaseError for a connection failure.
   * 
   * @param cause - Original error that caused the connection failure (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new DatabaseError instance for a connection failure
   */
  static connectionFailed(cause?: Error, context: Record<string, any> = {}): DatabaseError {
    return new DatabaseError(
      'Failed to connect to the database',
      'connection',
      undefined,
      context,
      cause
    );
  }

  /**
   * Creates a DatabaseError for a query failure.
   * 
   * @param queryType - Type of query that failed (e.g., "SELECT", "INSERT", "UPDATE")
   * @param cause - Original error that caused the query failure (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new DatabaseError instance for a query failure
   */
  static queryFailed(queryType: string, cause?: Error, context: Record<string, any> = {}): DatabaseError {
    return new DatabaseError(
      `Database ${queryType} operation failed`,
      queryType.toLowerCase(),
      undefined,
      context,
      cause
    );
  }
}

/**
 * Represents a configuration-related error.
 * Use this for errors that occur due to invalid or missing configuration.
 */
export class ConfigurationError extends TechnicalError {
  /**
   * Creates a new ConfigurationError instance.
   * 
   * @param message - Human-readable error message
   * @param configKey - The configuration key that is invalid or missing
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string = 'Invalid configuration',
    configKey: string,
    details?: any,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(
      message,
      `${ERROR_CODE_PREFIXES.GENERAL}_CONFIGURATION_ERROR`,
      { ...context, configKey },
      details,
      'Please check the application configuration',
      cause
    );
  }

  /**
   * Creates a ConfigurationError for a missing environment variable.
   * 
   * @param envVar - The name of the missing environment variable
   * @param context - Additional context information about the error (optional)
   * @returns A new ConfigurationError instance for a missing environment variable
   */
  static missingEnvVar(envVar: string, context: Record<string, any> = {}): ConfigurationError {
    return new ConfigurationError(
      `Missing required environment variable: ${envVar}`,
      envVar,
      { type: 'environment_variable' },
      context
    );
  }

  /**
   * Creates a ConfigurationError for an invalid configuration value.
   * 
   * @param configKey - The configuration key with the invalid value
   * @param value - The invalid value
   * @param expectedType - The expected type or format of the value
   * @param context - Additional context information about the error (optional)
   * @returns A new ConfigurationError instance for an invalid configuration value
   */
  static invalidValue(configKey: string, value: any, expectedType: string, context: Record<string, any> = {}): ConfigurationError {
    return new ConfigurationError(
      `Invalid configuration value for ${configKey}: expected ${expectedType}`,
      configKey,
      { value, expectedType },
      context
    );
  }
}

/**
 * Represents a timeout error.
 * Use this for errors that occur when an operation takes too long to complete.
 */
export class TimeoutError extends TechnicalError {
  /**
   * Creates a new TimeoutError instance.
   * 
   * @param message - Human-readable error message
   * @param operation - The operation that timed out
   * @param durationMs - The duration in milliseconds after which the operation timed out
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string = 'The operation timed out',
    operation: string,
    durationMs: number,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(
      message,
      `${ERROR_CODE_PREFIXES.GENERAL}_TIMEOUT_ERROR`,
      { ...context, operation, durationMs },
      { timeoutMs: durationMs },
      'Please try again later or with a longer timeout value',
      cause
    );
  }

  /**
   * Creates a TimeoutError for a database operation timeout.
   * 
   * @param operation - The database operation that timed out
   * @param durationMs - The duration in milliseconds after which the operation timed out
   * @param context - Additional context information about the error (optional)
   * @returns A new TimeoutError instance for a database operation timeout
   */
  static databaseTimeout(operation: string, durationMs: number, context: Record<string, any> = {}): TimeoutError {
    return new TimeoutError(
      `Database operation '${operation}' timed out after ${durationMs}ms`,
      operation,
      durationMs,
      { ...context, type: 'database' }
    );
  }

  /**
   * Creates a TimeoutError for an external API call timeout.
   * 
   * @param service - The external service that timed out
   * @param endpoint - The endpoint that was called
   * @param durationMs - The duration in milliseconds after which the call timed out
   * @param context - Additional context information about the error (optional)
   * @returns A new TimeoutError instance for an external API call timeout
   */
  static apiTimeout(service: string, endpoint: string, durationMs: number, context: Record<string, any> = {}): TimeoutError {
    return new TimeoutError(
      `API call to ${service} (${endpoint}) timed out after ${durationMs}ms`,
      'api_call',
      durationMs,
      { ...context, service, endpoint, type: 'api' }
    );
  }
}

/**
 * Represents a data processing error.
 * Use this for errors that occur during data transformation, parsing, or processing.
 */
export class DataProcessingError extends TechnicalError {
  /**
   * Creates a new DataProcessingError instance.
   * 
   * @param message - Human-readable error message
   * @param operation - The data processing operation that failed
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string = 'Data processing failed',
    operation: string,
    details?: any,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(
      message,
      `${ERROR_CODE_PREFIXES.GENERAL}_DATA_PROCESSING_ERROR`,
      { ...context, operation },
      details,
      'Please check the input data format and try again',
      cause
    );
  }

  /**
   * Creates a DataProcessingError for a serialization failure.
   * 
   * @param dataType - The type of data that failed to serialize
   * @param cause - Original error that caused the serialization failure (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new DataProcessingError instance for a serialization failure
   */
  static serializationFailed(dataType: string, cause?: Error, context: Record<string, any> = {}): DataProcessingError {
    return new DataProcessingError(
      `Failed to serialize ${dataType} data`,
      'serialization',
      undefined,
      context,
      cause
    );
  }

  /**
   * Creates a DataProcessingError for a deserialization failure.
   * 
   * @param dataType - The type of data that failed to deserialize
   * @param cause - Original error that caused the deserialization failure (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new DataProcessingError instance for a deserialization failure
   */
  static deserializationFailed(dataType: string, cause?: Error, context: Record<string, any> = {}): DataProcessingError {
    return new DataProcessingError(
      `Failed to deserialize ${dataType} data`,
      'deserialization',
      undefined,
      context,
      cause
    );
  }

  /**
   * Creates a DataProcessingError for a data validation failure.
   * 
   * @param dataType - The type of data that failed validation
   * @param validationErrors - The validation errors
   * @param context - Additional context information about the error (optional)
   * @returns A new DataProcessingError instance for a data validation failure
   */
  static validationFailed(dataType: string, validationErrors: any[], context: Record<string, any> = {}): DataProcessingError {
    return new DataProcessingError(
      `${dataType} data validation failed`,
      'validation',
      { validationErrors },
      context
    );
  }
}

/**
 * Represents a service unavailable error.
 * Use this for errors that occur when a required service is unavailable.
 */
export class ServiceUnavailableError extends TechnicalError {
  /**
   * Creates a new ServiceUnavailableError instance.
   * 
   * @param message - Human-readable error message
   * @param serviceName - The name of the unavailable service
   * @param reason - The reason the service is unavailable (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string = 'Service is unavailable',
    serviceName: string,
    reason?: string,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(
      message,
      `${ERROR_CODE_PREFIXES.GENERAL}_SERVICE_UNAVAILABLE`,
      { ...context, serviceName, reason },
      { reason },
      'Please try again later',
      cause
    );
  }

  /**
   * Creates a ServiceUnavailableError for a service in maintenance mode.
   * 
   * @param serviceName - The name of the service in maintenance
   * @param estimatedEndTime - The estimated end time of the maintenance (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new ServiceUnavailableError instance for a service in maintenance
   */
  static maintenanceMode(serviceName: string, estimatedEndTime?: Date, context: Record<string, any> = {}): ServiceUnavailableError {
    const reason = estimatedEndTime 
      ? `Maintenance scheduled to end at ${estimatedEndTime.toISOString()}`
      : 'Scheduled maintenance';
    
    return new ServiceUnavailableError(
      `${serviceName} is currently in maintenance mode`,
      serviceName,
      reason,
      { ...context, estimatedEndTime: estimatedEndTime?.toISOString() }
    );
  }

  /**
   * Creates a ServiceUnavailableError for a service that is overloaded.
   * 
   * @param serviceName - The name of the overloaded service
   * @param metrics - Performance metrics indicating the overload (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new ServiceUnavailableError instance for an overloaded service
   */
  static overloaded(serviceName: string, metrics?: Record<string, any>, context: Record<string, any> = {}): ServiceUnavailableError {
    return new ServiceUnavailableError(
      `${serviceName} is currently overloaded`,
      serviceName,
      'High load',
      { ...context, metrics }
    );
  }

  /**
   * Creates a ServiceUnavailableError for a dependency failure.
   * 
   * @param serviceName - The name of the service that depends on the failed dependency
   * @param dependencyName - The name of the failed dependency
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused the dependency failure (optional)
   * @returns A new ServiceUnavailableError instance for a dependency failure
   */
  static dependencyFailure(serviceName: string, dependencyName: string, context: Record<string, any> = {}, cause?: Error): ServiceUnavailableError {
    return new ServiceUnavailableError(
      `${serviceName} is unavailable due to a dependency failure: ${dependencyName}`,
      serviceName,
      `Dependency failure: ${dependencyName}`,
      { ...context, dependencyName },
      cause
    );
  }
}

/**
 * Represents a memory error.
 * Use this for errors that occur when the system runs out of memory or memory allocation fails.
 */
export class MemoryError extends TechnicalError {
  /**
   * Creates a new MemoryError instance.
   * 
   * @param message - Human-readable error message
   * @param operation - The operation that failed due to memory issues
   * @param memoryStats - Memory statistics at the time of the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string = 'Insufficient memory',
    operation: string,
    memoryStats?: Record<string, any>,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(
      message,
      `${ERROR_CODE_PREFIXES.GENERAL}_MEMORY_ERROR`,
      { ...context, operation },
      { memoryStats },
      'The system is experiencing high memory usage. Please try again later with a smaller request or contact support.',
      cause
    );
  }
}

/**
 * Represents a file system error.
 * Use this for errors that occur during file system operations.
 */
export class FileSystemError extends TechnicalError {
  /**
   * Creates a new FileSystemError instance.
   * 
   * @param message - Human-readable error message
   * @param operation - The file system operation that failed
   * @param path - The file or directory path involved in the operation
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string = 'File system operation failed',
    operation: string,
    path: string,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(
      message,
      `${ERROR_CODE_PREFIXES.GENERAL}_FILE_SYSTEM_ERROR`,
      { ...context, operation, path },
      { path },
      'Please check file permissions and available disk space',
      cause
    );
  }

  /**
   * Creates a FileSystemError for a file not found error.
   * 
   * @param path - The path of the file that was not found
   * @param context - Additional context information about the error (optional)
   * @returns A new FileSystemError instance for a file not found error
   */
  static fileNotFound(path: string, context: Record<string, any> = {}): FileSystemError {
    return new FileSystemError(
      `File not found: ${path}`,
      'read',
      path,
      context
    );
  }

  /**
   * Creates a FileSystemError for a permission denied error.
   * 
   * @param path - The path of the file or directory for which permission was denied
   * @param operation - The operation that was attempted (e.g., "read", "write")
   * @param context - Additional context information about the error (optional)
   * @returns A new FileSystemError instance for a permission denied error
   */
  static permissionDenied(path: string, operation: string, context: Record<string, any> = {}): FileSystemError {
    return new FileSystemError(
      `Permission denied for ${operation} operation on ${path}`,
      operation,
      path,
      context
    );
  }

  /**
   * Creates a FileSystemError for a disk full error.
   * 
   * @param path - The path where the write operation failed
   * @param context - Additional context information about the error (optional)
   * @returns A new FileSystemError instance for a disk full error
   */
  static diskFull(path: string, context: Record<string, any> = {}): FileSystemError {
    return new FileSystemError(
      `Disk full: cannot write to ${path}`,
      'write',
      path,
      context
    );
  }
}