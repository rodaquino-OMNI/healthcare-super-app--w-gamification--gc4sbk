import { BaseError } from '../base';
import { ErrorType, ErrorCategory, JourneyType } from '../types';

/**
 * Base class for all technical errors in the system.
 * Provides a foundation for errors related to system failures and technical issues.
 */
export class TechnicalError extends BaseError {
  /**
   * Creates a new TechnicalError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    code: string,
    details?: any,
    context?: any,
    cause?: Error
  ) {
    super(message, ErrorType.TECHNICAL, code, context, details, cause);
  }
}

/**
 * Error thrown when an unexpected internal server error occurs.
 * Used for general system failures that don't fit into more specific categories.
 */
export class InternalServerError extends TechnicalError {
  /**
   * Creates a new InternalServerError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message = 'An unexpected internal server error occurred',
    code = 'INTERNAL_SERVER_ERROR',
    details?: any,
    context?: any,
    cause?: Error
  ) {
    super(message, code, details, {
      ...context,
      component: context?.component || 'server',
      severity: 'critical'
    }, cause);
  }

  /**
   * Creates an InternalServerError with journey context.
   * 
   * @param journey - The journey where the error occurred
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new InternalServerError instance with journey context
   */
  static forJourney(
    journey: JourneyType,
    message = 'An unexpected internal server error occurred',
    code = `${journey.toUpperCase()}_INTERNAL_SERVER_ERROR`,
    details?: any,
    context?: any,
    cause?: Error
  ): InternalServerError {
    return new InternalServerError(message, code, details, {
      ...context,
      journey
    }, cause);
  }

  /**
   * Creates an InternalServerError from an unknown error.
   * 
   * @param error - The unknown error to wrap
   * @param context - Additional context information about the error (optional)
   * @returns A new InternalServerError instance
   */
  static from(error: unknown, context?: any): InternalServerError {
    if (error instanceof InternalServerError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'An unexpected internal server error occurred';
    return new InternalServerError(message, 'INTERNAL_SERVER_ERROR', undefined, context, error instanceof Error ? error : undefined);
  }
}

/**
 * Error thrown when a database operation fails.
 * Provides context about the specific database operation that failed.
 */
export class DatabaseError extends TechnicalError {
  /**
   * Creates a new DatabaseError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param operation - The database operation that failed (e.g., 'query', 'insert', 'update')
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message = 'A database operation failed',
    code = 'DATABASE_ERROR',
    operation?: string,
    details?: any,
    context?: any,
    cause?: Error
  ) {
    super(message, code, details, {
      ...context,
      component: 'database',
      operation,
      severity: 'critical'
    }, cause);
  }

  /**
   * Creates a DatabaseError for a specific operation.
   * 
   * @param operation - The database operation that failed
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new DatabaseError instance
   */
  static forOperation(
    operation: string,
    message = `Database operation '${operation}' failed`,
    code = 'DATABASE_OPERATION_ERROR',
    details?: any,
    context?: any,
    cause?: Error
  ): DatabaseError {
    return new DatabaseError(message, code, operation, details, context, cause);
  }

  /**
   * Creates a DatabaseError for a connection failure.
   * 
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new DatabaseError instance
   */
  static connectionError(
    message = 'Failed to connect to the database',
    details?: any,
    context?: any,
    cause?: Error
  ): DatabaseError {
    return new DatabaseError(message, 'DATABASE_CONNECTION_ERROR', 'connect', details, {
      ...context,
      isTransient: true,
      retryStrategy: {
        maxAttempts: 5,
        baseDelayMs: 1000,
        useExponentialBackoff: true
      }
    }, cause);
  }

  /**
   * Creates a DatabaseError for a transaction failure.
   * 
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new DatabaseError instance
   */
  static transactionError(
    message = 'Database transaction failed',
    details?: any,
    context?: any,
    cause?: Error
  ): DatabaseError {
    return new DatabaseError(message, 'DATABASE_TRANSACTION_ERROR', 'transaction', details, context, cause);
  }

  /**
   * Creates a DatabaseError for a query failure.
   * 
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new DatabaseError instance
   */
  static queryError(
    message = 'Database query failed',
    details?: any,
    context?: any,
    cause?: Error
  ): DatabaseError {
    return new DatabaseError(message, 'DATABASE_QUERY_ERROR', 'query', details, context, cause);
  }
}

/**
 * Error thrown when there is an issue with the application configuration.
 * Used for missing or invalid configuration settings.
 */
export class ConfigurationError extends TechnicalError {
  /**
   * Creates a new ConfigurationError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param configKey - The configuration key that has an issue
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message = 'Invalid or missing configuration',
    code = 'CONFIGURATION_ERROR',
    configKey?: string,
    details?: any,
    context?: any,
    cause?: Error
  ) {
    super(message, code, details, {
      ...context,
      component: 'configuration',
      configKey,
      severity: 'critical'
    }, cause);
  }

  /**
   * Creates a ConfigurationError for a missing configuration value.
   * 
   * @param configKey - The missing configuration key
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new ConfigurationError instance
   */
  static missingConfig(
    configKey: string,
    message = `Missing required configuration: ${configKey}`,
    details?: any,
    context?: any
  ): ConfigurationError {
    return new ConfigurationError(message, 'MISSING_CONFIGURATION', configKey, details, context);
  }

  /**
   * Creates a ConfigurationError for an invalid configuration value.
   * 
   * @param configKey - The invalid configuration key
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new ConfigurationError instance
   */
  static invalidConfig(
    configKey: string,
    message = `Invalid configuration value for: ${configKey}`,
    details?: any,
    context?: any
  ): ConfigurationError {
    return new ConfigurationError(message, 'INVALID_CONFIGURATION', configKey, details, context);
  }

  /**
   * Creates a ConfigurationError for an environment-specific configuration issue.
   * 
   * @param environment - The environment with the configuration issue
   * @param configKey - The configuration key with the issue
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new ConfigurationError instance
   */
  static environmentConfig(
    environment: string,
    configKey: string,
    message = `Configuration issue in ${environment} environment for: ${configKey}`,
    details?: any,
    context?: any
  ): ConfigurationError {
    return new ConfigurationError(message, `${environment.toUpperCase()}_CONFIGURATION_ERROR`, configKey, details, {
      ...context,
      environment
    });
  }
}

/**
 * Error thrown when an operation times out.
 * Provides context about the operation duration and timeout threshold.
 */
export class TimeoutError extends TechnicalError {
  /**
   * Creates a new TimeoutError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param operation - The operation that timed out
   * @param durationMs - The duration in milliseconds before timeout
   * @param timeoutThresholdMs - The timeout threshold in milliseconds
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message = 'Operation timed out',
    code = 'TIMEOUT_ERROR',
    operation?: string,
    durationMs?: number,
    timeoutThresholdMs?: number,
    details?: any,
    context?: any,
    cause?: Error
  ) {
    super(message, code, details, {
      ...context,
      operation,
      durationMs,
      timeoutThresholdMs,
      severity: 'error',
      isTransient: true,
      retryStrategy: {
        maxAttempts: 3,
        baseDelayMs: 1000,
        useExponentialBackoff: true
      }
    }, cause);
  }

  /**
   * Creates a TimeoutError for a specific operation.
   * 
   * @param operation - The operation that timed out
   * @param durationMs - The duration in milliseconds before timeout
   * @param timeoutThresholdMs - The timeout threshold in milliseconds
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new TimeoutError instance
   */
  static forOperation(
    operation: string,
    durationMs: number,
    timeoutThresholdMs: number,
    message = `Operation '${operation}' timed out after ${durationMs}ms (threshold: ${timeoutThresholdMs}ms)`,
    details?: any,
    context?: any,
    cause?: Error
  ): TimeoutError {
    return new TimeoutError(message, 'OPERATION_TIMEOUT', operation, durationMs, timeoutThresholdMs, details, context, cause);
  }

  /**
   * Creates a TimeoutError for a database query.
   * 
   * @param durationMs - The duration in milliseconds before timeout
   * @param timeoutThresholdMs - The timeout threshold in milliseconds
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new TimeoutError instance
   */
  static databaseTimeout(
    durationMs: number,
    timeoutThresholdMs: number,
    message = `Database query timed out after ${durationMs}ms (threshold: ${timeoutThresholdMs}ms)`,
    details?: any,
    context?: any,
    cause?: Error
  ): TimeoutError {
    return new TimeoutError(message, 'DATABASE_TIMEOUT', 'database_query', durationMs, timeoutThresholdMs, details, {
      ...context,
      component: 'database'
    }, cause);
  }

  /**
   * Creates a TimeoutError for an API request.
   * 
   * @param durationMs - The duration in milliseconds before timeout
   * @param timeoutThresholdMs - The timeout threshold in milliseconds
   * @param endpoint - The API endpoint that timed out
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new TimeoutError instance
   */
  static apiTimeout(
    durationMs: number,
    timeoutThresholdMs: number,
    endpoint: string,
    message = `API request to ${endpoint} timed out after ${durationMs}ms (threshold: ${timeoutThresholdMs}ms)`,
    details?: any,
    context?: any,
    cause?: Error
  ): TimeoutError {
    return new TimeoutError(message, 'API_TIMEOUT', `api_request_${endpoint}`, durationMs, timeoutThresholdMs, details, {
      ...context,
      component: 'api',
      endpoint
    }, cause);
  }
}

/**
 * Error thrown when data processing fails.
 * Used for errors in data transformation, validation, or processing.
 */
export class DataProcessingError extends TechnicalError {
  /**
   * Creates a new DataProcessingError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param operation - The data processing operation that failed
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message = 'Data processing failed',
    code = 'DATA_PROCESSING_ERROR',
    operation?: string,
    details?: any,
    context?: any,
    cause?: Error
  ) {
    super(message, code, details, {
      ...context,
      operation,
      severity: 'error'
    }, cause);
  }

  /**
   * Creates a DataProcessingError for data transformation.
   * 
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new DataProcessingError instance
   */
  static transformationError(
    message = 'Data transformation failed',
    details?: any,
    context?: any,
    cause?: Error
  ): DataProcessingError {
    return new DataProcessingError(message, 'DATA_TRANSFORMATION_ERROR', 'transformation', details, context, cause);
  }

  /**
   * Creates a DataProcessingError for data parsing.
   * 
   * @param format - The format being parsed (e.g., 'JSON', 'XML')
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new DataProcessingError instance
   */
  static parsingError(
    format: string,
    message = `Failed to parse ${format} data`,
    details?: any,
    context?: any,
    cause?: Error
  ): DataProcessingError {
    return new DataProcessingError(message, `${format.toUpperCase()}_PARSING_ERROR`, 'parsing', details, {
      ...context,
      format
    }, cause);
  }

  /**
   * Creates a DataProcessingError for data serialization.
   * 
   * @param format - The format being serialized to (e.g., 'JSON', 'XML')
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new DataProcessingError instance
   */
  static serializationError(
    format: string,
    message = `Failed to serialize data to ${format}`,
    details?: any,
    context?: any,
    cause?: Error
  ): DataProcessingError {
    return new DataProcessingError(message, `${format.toUpperCase()}_SERIALIZATION_ERROR`, 'serialization', details, {
      ...context,
      format
    }, cause);
  }

  /**
   * Creates a DataProcessingError for data integrity issues.
   * 
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new DataProcessingError instance
   */
  static integrityError(
    message = 'Data integrity check failed',
    details?: any,
    context?: any,
    cause?: Error
  ): DataProcessingError {
    return new DataProcessingError(message, 'DATA_INTEGRITY_ERROR', 'integrity_check', details, {
      ...context,
      severity: 'critical'
    }, cause);
  }
}

/**
 * Error thrown when a service is unavailable.
 * Used for errors related to service health and availability.
 */
export class ServiceUnavailableError extends TechnicalError {
  /**
   * Creates a new ServiceUnavailableError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param serviceName - The name of the unavailable service
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message = 'Service is unavailable',
    code = 'SERVICE_UNAVAILABLE',
    serviceName?: string,
    details?: any,
    context?: any,
    cause?: Error
  ) {
    super(message, code, details, {
      ...context,
      serviceName,
      severity: 'critical',
      isTransient: true,
      retryStrategy: {
        maxAttempts: 3,
        baseDelayMs: 2000,
        useExponentialBackoff: true
      }
    }, cause);
  }

  /**
   * Creates a ServiceUnavailableError for a specific service.
   * 
   * @param serviceName - The name of the unavailable service
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new ServiceUnavailableError instance
   */
  static forService(
    serviceName: string,
    message = `Service '${serviceName}' is currently unavailable`,
    details?: any,
    context?: any,
    cause?: Error
  ): ServiceUnavailableError {
    return new ServiceUnavailableError(message, 'SERVICE_UNAVAILABLE', serviceName, details, context, cause);
  }

  /**
   * Creates a ServiceUnavailableError for maintenance.
   * 
   * @param serviceName - The name of the service in maintenance
   * @param estimatedResumptionTime - Estimated time when the service will be available again
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new ServiceUnavailableError instance
   */
  static maintenanceMode(
    serviceName: string,
    estimatedResumptionTime?: Date,
    message = `Service '${serviceName}' is currently in maintenance mode`,
    details?: any,
    context?: any
  ): ServiceUnavailableError {
    const resumptionTimeStr = estimatedResumptionTime ? 
      ` (estimated resumption: ${estimatedResumptionTime.toISOString()})` : '';
    
    return new ServiceUnavailableError(
      `${message}${resumptionTimeStr}`,
      'SERVICE_MAINTENANCE',
      serviceName,
      details,
      {
        ...context,
        estimatedResumptionTime: estimatedResumptionTime?.toISOString(),
        isTransient: true,
        retryStrategy: {
          maxAttempts: 1,
          baseDelayMs: estimatedResumptionTime ? 
            Math.max(1000, estimatedResumptionTime.getTime() - Date.now()) : 
            60000, // Default to 1 minute if no time provided
          useExponentialBackoff: false
        }
      }
    );
  }

  /**
   * Creates a ServiceUnavailableError for capacity issues.
   * 
   * @param serviceName - The name of the service at capacity
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new ServiceUnavailableError instance
   */
  static capacityExceeded(
    serviceName: string,
    message = `Service '${serviceName}' is currently at maximum capacity`,
    details?: any,
    context?: any
  ): ServiceUnavailableError {
    return new ServiceUnavailableError(message, 'SERVICE_CAPACITY_EXCEEDED', serviceName, details, {
      ...context,
      isTransient: true,
      retryStrategy: {
        maxAttempts: 5,
        baseDelayMs: 5000, // Longer delay for capacity issues
        useExponentialBackoff: true
      }
    });
  }
}

/**
 * Error thrown when a dependency initialization fails.
 * Used for errors during service startup and dependency bootstrapping.
 */
export class InitializationError extends TechnicalError {
  /**
   * Creates a new InitializationError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param component - The component that failed to initialize
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message = 'Initialization failed',
    code = 'INITIALIZATION_ERROR',
    component?: string,
    details?: any,
    context?: any,
    cause?: Error
  ) {
    super(message, code, details, {
      ...context,
      component,
      severity: 'critical'
    }, cause);
  }

  /**
   * Creates an InitializationError for a specific component.
   * 
   * @param component - The component that failed to initialize
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new InitializationError instance
   */
  static forComponent(
    component: string,
    message = `Failed to initialize component: ${component}`,
    details?: any,
    context?: any,
    cause?: Error
  ): InitializationError {
    return new InitializationError(message, 'COMPONENT_INITIALIZATION_ERROR', component, details, context, cause);
  }

  /**
   * Creates an InitializationError for a dependency.
   * 
   * @param dependency - The dependency that failed to initialize
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new InitializationError instance
   */
  static dependencyError(
    dependency: string,
    message = `Failed to initialize dependency: ${dependency}`,
    details?: any,
    context?: any,
    cause?: Error
  ): InitializationError {
    return new InitializationError(message, 'DEPENDENCY_INITIALIZATION_ERROR', dependency, details, context, cause);
  }

  /**
   * Creates an InitializationError for a service.
   * 
   * @param service - The service that failed to initialize
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new InitializationError instance
   */
  static serviceError(
    service: string,
    message = `Failed to initialize service: ${service}`,
    details?: any,
    context?: any,
    cause?: Error
  ): InitializationError {
    return new InitializationError(message, 'SERVICE_INITIALIZATION_ERROR', service, details, context, cause);
  }
}