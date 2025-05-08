import { HttpStatus } from '@nestjs/common';
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientRustPanicError, PrismaClientInitializationError } from '@prisma/client/runtime/library';
import { SystemException } from './system.exception';
import { ErrorType } from './error-types.enum';

/**
 * Error codes for Prisma database errors
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes
 */
enum PrismaErrorCode {
  // Query engine errors
  UNKNOWN_REQUEST_ERROR = 'P1000',
  AUTHENTICATION_FAILED = 'P1001',
  CONNECTION_FAILED = 'P1002',
  TIMEOUT_ERROR = 'P1003',
  DATABASE_NOT_FOUND = 'P1004',
  DATABASE_ALREADY_EXISTS = 'P1005',
  ACCESS_DENIED = 'P1006',
  SCHEMA_PARSE_ERROR = 'P1007',
  MIGRATION_ERROR = 'P1008',
  INTROSPECTION_ERROR = 'P1009',
  SERVER_STARTUP_ERROR = 'P1010',
  CONNECTION_CLOSED = 'P1011',
  ENGINE_VERSION_MISMATCH = 'P1012',
  DATABASE_ALREADY_CONNECTED = 'P1013',
  TRANSACTION_ERROR = 'P1014',
  RUST_PANIC_ERROR = 'P1015',
  
  // Query errors
  RECORD_NOT_FOUND = 'P2001',
  UNIQUE_CONSTRAINT_VIOLATION = 'P2002',
  FOREIGN_KEY_CONSTRAINT_VIOLATION = 'P2003',
  CONSTRAINT_VIOLATION = 'P2004',
  INVALID_DATA_TYPE = 'P2005',
  NULL_CONSTRAINT_VIOLATION = 'P2006',
  VALIDATION_ERROR = 'P2007',
  QUERY_PARSE_ERROR = 'P2008',
  QUERY_VALIDATION_ERROR = 'P2009',
  RAW_QUERY_ERROR = 'P2010',
  NULL_IN_WHERE_CONDITION = 'P2011',
  MISSING_REQUIRED_VALUE = 'P2012',
  MISSING_REQUIRED_ARGUMENT = 'P2013',
  INVALID_ARGUMENT = 'P2014',
  FIELD_NOT_FOUND = 'P2015',
  REQUIRED_FIELD_NOT_FOUND = 'P2016',
  RELATION_NOT_FOUND = 'P2017',
  REQUIRED_RELATION_NOT_FOUND = 'P2018',
  INPUT_ERROR = 'P2019',
  VALUE_OUT_OF_RANGE = 'P2020',
  TABLE_NOT_FOUND = 'P2021',
  COLUMN_NOT_FOUND = 'P2022',
  INCONSISTENT_COLUMN_DATA = 'P2023',
  TIMEOUT_ON_TRANSACTION = 'P2024',
  QUERY_BATCH_ERROR = 'P2025',
  READ_ONLY_TRANSACTION = 'P2026',
  MULTIPLE_ERRORS = 'P2027',
  TRANSACTION_API_ERROR = 'P2028',
}

/**
 * Database error severity levels
 */
enum DatabaseErrorSeverity {
  CRITICAL = 'CRITICAL', // Requires immediate attention, system cannot function
  HIGH = 'HIGH',         // Serious issue affecting functionality but system can continue
  MEDIUM = 'MEDIUM',     // Moderate issue with limited impact
  LOW = 'LOW',           // Minor issue with minimal impact
}

/**
 * Database error categories
 */
enum DatabaseErrorCategory {
  CONNECTION = 'CONNECTION',       // Connection establishment issues
  AUTHENTICATION = 'AUTHENTICATION', // Authentication/authorization issues
  QUERY = 'QUERY',                 // Query execution issues
  TRANSACTION = 'TRANSACTION',     // Transaction management issues
  CONSTRAINT = 'CONSTRAINT',       // Data constraint violations
  SCHEMA = 'SCHEMA',               // Schema-related issues
  RESOURCE = 'RESOURCE',           // Resource availability issues
  UNKNOWN = 'UNKNOWN',             // Unclassified issues
}

/**
 * Interface for database error context
 */
interface DatabaseErrorContext {
  operation?: string;              // The database operation being performed
  model?: string;                 // The Prisma model involved
  field?: string;                 // The specific field involved
  query?: string;                 // The query being executed
  parameters?: Record<string, any>; // Query parameters
  transaction?: string;           // Transaction ID if applicable
  connectionId?: string;          // Connection ID if applicable
  poolSize?: number;              // Connection pool size if applicable
  activeConnections?: number;     // Number of active connections if applicable
  retryAttempt?: number;          // Current retry attempt if applicable
  maxRetries?: number;            // Maximum retry attempts if applicable
  errorCode?: string;             // Original error code
  errorMessage?: string;          // Original error message
  stack?: string;                 // Original error stack trace
}

/**
 * Base class for all database-related exceptions in the gamification engine.
 * Extends SystemException to provide specialized handling for database errors.
 */
export class DatabaseException extends SystemException {
  public readonly category: DatabaseErrorCategory;
  public readonly severity: DatabaseErrorSeverity;
  public readonly context: DatabaseErrorContext;
  public readonly isTransient: boolean;
  public readonly isRecoverable: boolean;
  
  /**
   * Creates a new DatabaseException instance
   * 
   * @param message Human-readable error message
   * @param errorType Error type classification
   * @param category Database error category
   * @param severity Error severity level
   * @param context Additional error context
   * @param cause Original error that caused this exception
   * @param isTransient Whether this error is likely temporary and can be retried
   * @param isRecoverable Whether recovery actions can be taken for this error
   */
  constructor(
    message: string,
    errorType: ErrorType = ErrorType.DATABASE_ERROR,
    category: DatabaseErrorCategory = DatabaseErrorCategory.UNKNOWN,
    severity: DatabaseErrorSeverity = DatabaseErrorSeverity.MEDIUM,
    context: DatabaseErrorContext = {},
    cause?: Error,
    isTransient: boolean = false,
    isRecoverable: boolean = false,
  ) {
    super(message, errorType, HttpStatus.INTERNAL_SERVER_ERROR, cause);
    this.category = category;
    this.severity = severity;
    this.context = context;
    this.isTransient = isTransient;
    this.isRecoverable = isRecoverable;
    
    // Add additional metadata for monitoring and debugging
    this.addMetadata('databaseErrorCategory', category);
    this.addMetadata('databaseErrorSeverity', severity);
    this.addMetadata('isTransient', isTransient);
    this.addMetadata('isRecoverable', isRecoverable);
    
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        if (value !== undefined) {
          this.addMetadata(`context.${key}`, value);
        }
      });
    }
  }
  
  /**
   * Factory method to create a DatabaseException from a Prisma error
   * 
   * @param error Original Prisma error
   * @param operation Description of the operation being performed
   * @param parameters Query parameters (sanitized for logging)
   * @returns Appropriate DatabaseException instance
   */
  static fromPrismaError(
    error: Error,
    operation?: string,
    parameters?: Record<string, any>,
  ): DatabaseException {
    // Create base context with operation and parameters
    const baseContext: DatabaseErrorContext = {
      operation,
      parameters: parameters ? this.sanitizeParameters(parameters) : undefined,
      errorMessage: error.message,
      stack: error.stack,
    };
    
    // Handle known Prisma error types
    if (error instanceof PrismaClientKnownRequestError) {
      return this.handleKnownRequestError(error, baseContext);
    } else if (error instanceof PrismaClientUnknownRequestError) {
      return this.handleUnknownRequestError(error, baseContext);
    } else if (error instanceof PrismaClientRustPanicError) {
      return this.handleRustPanicError(error, baseContext);
    } else if (error instanceof PrismaClientInitializationError) {
      return this.handleInitializationError(error, baseContext);
    }
    
    // Handle generic database errors
    return new DatabaseException(
      `Database operation failed: ${error.message}`,
      ErrorType.DATABASE_ERROR,
      DatabaseErrorCategory.UNKNOWN,
      DatabaseErrorSeverity.MEDIUM,
      baseContext,
      error,
      false,
      false,
    );
  }
  
  /**
   * Handles Prisma known request errors with specific error codes
   */
  private static handleKnownRequestError(
    error: PrismaClientKnownRequestError,
    baseContext: DatabaseErrorContext,
  ): DatabaseException {
    const context: DatabaseErrorContext = {
      ...baseContext,
      errorCode: error.code,
      model: error.meta?.model as string,
      field: error.meta?.field_name as string,
      // Include target if available (for constraint violations)
      ...(error.meta?.target ? { target: error.meta.target } : {}),
    };
    
    // Map Prisma error codes to our error categories and determine severity/transience
    switch (error.code) {
      // Connection errors
      case PrismaErrorCode.CONNECTION_FAILED:
      case PrismaErrorCode.CONNECTION_CLOSED:
        return new ConnectionException(
          `Database connection failed: ${error.message}`,
          context,
          error,
          true, // Transient
          true, // Recoverable
        );
      
      // Authentication errors
      case PrismaErrorCode.AUTHENTICATION_FAILED:
      case PrismaErrorCode.ACCESS_DENIED:
        return new AuthenticationException(
          `Database authentication failed: ${error.message}`,
          context,
          error,
          false, // Not transient
          false, // Not recoverable without config changes
        );
      
      // Transaction errors
      case PrismaErrorCode.TRANSACTION_ERROR:
      case PrismaErrorCode.TIMEOUT_ON_TRANSACTION:
      case PrismaErrorCode.READ_ONLY_TRANSACTION:
      case PrismaErrorCode.TRANSACTION_API_ERROR:
        return new TransactionException(
          `Database transaction failed: ${error.message}`,
          context,
          error,
          true, // Transient
          true, // Recoverable
        );
      
      // Constraint violations
      case PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION:
      case PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_VIOLATION:
      case PrismaErrorCode.CONSTRAINT_VIOLATION:
      case PrismaErrorCode.NULL_CONSTRAINT_VIOLATION:
        return new ConstraintViolationException(
          `Database constraint violation: ${error.message}`,
          context,
          error,
          false, // Not transient
          false, // Not recoverable without data changes
        );
      
      // Query errors
      case PrismaErrorCode.QUERY_PARSE_ERROR:
      case PrismaErrorCode.QUERY_VALIDATION_ERROR:
      case PrismaErrorCode.RAW_QUERY_ERROR:
      case PrismaErrorCode.QUERY_BATCH_ERROR:
        return new QueryException(
          `Database query error: ${error.message}`,
          context,
          error,
          false, // Not transient
          false, // Not recoverable without query changes
        );
      
      // Resource not found errors
      case PrismaErrorCode.RECORD_NOT_FOUND:
      case PrismaErrorCode.TABLE_NOT_FOUND:
      case PrismaErrorCode.COLUMN_NOT_FOUND:
      case PrismaErrorCode.FIELD_NOT_FOUND:
      case PrismaErrorCode.RELATION_NOT_FOUND:
        return new ResourceNotFoundException(
          `Database resource not found: ${error.message}`,
          context,
          error,
          false, // Not transient
          false, // Not recoverable without data/schema changes
        );
      
      // Schema errors
      case PrismaErrorCode.SCHEMA_PARSE_ERROR:
      case PrismaErrorCode.MIGRATION_ERROR:
      case PrismaErrorCode.INTROSPECTION_ERROR:
        return new SchemaException(
          `Database schema error: ${error.message}`,
          context,
          error,
          false, // Not transient
          false, // Not recoverable without schema changes
        );
      
      // Default case for other known errors
      default:
        return new DatabaseException(
          `Database operation failed: ${error.message}`,
          ErrorType.DATABASE_ERROR,
          DatabaseErrorCategory.UNKNOWN,
          DatabaseErrorSeverity.MEDIUM,
          context,
          error,
          false,
          false,
        );
    }
  }
  
  /**
   * Handles Prisma unknown request errors
   */
  private static handleUnknownRequestError(
    error: PrismaClientUnknownRequestError,
    baseContext: DatabaseErrorContext,
  ): DatabaseException {
    // Check for common error patterns in the message to try to categorize
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('connection') && 
        (errorMessage.includes('failed') || errorMessage.includes('closed') || errorMessage.includes('timeout'))) {
      return new ConnectionException(
        `Database connection failed: ${error.message}`,
        baseContext,
        error,
        true, // Transient
        true, // Recoverable
      );
    }
    
    if (errorMessage.includes('transaction')) {
      return new TransactionException(
        `Database transaction failed: ${error.message}`,
        baseContext,
        error,
        true, // Transient
        true, // Recoverable
      );
    }
    
    // Default to unknown category
    return new DatabaseException(
      `Database operation failed: ${error.message}`,
      ErrorType.DATABASE_ERROR,
      DatabaseErrorCategory.UNKNOWN,
      DatabaseErrorSeverity.MEDIUM,
      baseContext,
      error,
      true, // Assume transient for unknown errors
      true, // Assume recoverable for unknown errors
    );
  }
  
  /**
   * Handles Prisma Rust panic errors (critical internal errors)
   */
  private static handleRustPanicError(
    error: PrismaClientRustPanicError,
    baseContext: DatabaseErrorContext,
  ): DatabaseException {
    return new DatabaseException(
      `Critical database engine error: ${error.message}`,
      ErrorType.CRITICAL_ERROR,
      DatabaseErrorCategory.UNKNOWN,
      DatabaseErrorSeverity.CRITICAL,
      baseContext,
      error,
      false, // Not transient
      false, // Not recoverable without intervention
    );
  }
  
  /**
   * Handles Prisma initialization errors
   */
  private static handleInitializationError(
    error: PrismaClientInitializationError,
    baseContext: DatabaseErrorContext,
  ): DatabaseException {
    // Check error message for specific initialization issues
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('connection') || errorMessage.includes('connect')) {
      return new ConnectionException(
        `Database connection initialization failed: ${error.message}`,
        baseContext,
        error,
        true, // Transient
        true, // Recoverable
      );
    }
    
    if (errorMessage.includes('schema') || errorMessage.includes('migration')) {
      return new SchemaException(
        `Database schema initialization failed: ${error.message}`,
        baseContext,
        error,
        false, // Not transient
        false, // Not recoverable without schema changes
      );
    }
    
    // Default initialization error
    return new DatabaseException(
      `Database initialization failed: ${error.message}`,
      ErrorType.INITIALIZATION_ERROR,
      DatabaseErrorCategory.UNKNOWN,
      DatabaseErrorSeverity.CRITICAL,
      baseContext,
      error,
      false, // Not transient
      false, // Not recoverable without intervention
    );
  }
  
  /**
   * Sanitizes query parameters to remove sensitive information before logging
   */
  private static sanitizeParameters(parameters: Record<string, any>): Record<string, any> {
    const sanitized = { ...parameters };
    
    // List of sensitive parameter names to redact
    const sensitiveParams = [
      'password', 'token', 'secret', 'key', 'credential', 'auth',
      'apiKey', 'api_key', 'accessToken', 'access_token', 'refreshToken', 'refresh_token',
    ];
    
    // Redact sensitive parameters
    Object.keys(sanitized).forEach(key => {
      if (sensitiveParams.some(param => key.toLowerCase().includes(param.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
  
  /**
   * Determines if this error should trigger a connection pool reset
   */
  public shouldResetConnectionPool(): boolean {
    return (
      this.category === DatabaseErrorCategory.CONNECTION ||
      this.severity === DatabaseErrorSeverity.CRITICAL ||
      (this.isTransient && this.context.retryAttempt && this.context.retryAttempt > 3)
    );
  }
  
  /**
   * Determines if this error should trigger a transaction rollback
   */
  public shouldRollbackTransaction(): boolean {
    return (
      this.category === DatabaseErrorCategory.TRANSACTION ||
      this.category === DatabaseErrorCategory.CONSTRAINT ||
      this.severity === DatabaseErrorSeverity.CRITICAL ||
      this.severity === DatabaseErrorSeverity.HIGH
    );
  }
  
  /**
   * Determines if this error should be retried
   */
  public shouldRetry(): boolean {
    return this.isTransient && this.isRecoverable;
  }
  
  /**
   * Gets recommended retry delay in milliseconds based on attempt number
   */
  public getRetryDelay(): number {
    if (!this.shouldRetry()) {
      return 0;
    }
    
    const attempt = this.context.retryAttempt || 1;
    // Exponential backoff with jitter: base * (2^attempt) * (0.5-1.5 random factor)
    const baseDelay = 100; // 100ms base delay
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = 0.5 + Math.random(); // Random factor between 0.5 and 1.5
    
    return Math.min(exponentialDelay * jitter, 30000); // Cap at 30 seconds
  }
}

/**
 * Exception for database connection issues
 */
export class ConnectionException extends DatabaseException {
  constructor(
    message: string,
    context: DatabaseErrorContext = {},
    cause?: Error,
    isTransient: boolean = true,
    isRecoverable: boolean = true,
  ) {
    super(
      message,
      ErrorType.CONNECTION_ERROR,
      DatabaseErrorCategory.CONNECTION,
      DatabaseErrorSeverity.HIGH,
      context,
      cause,
      isTransient,
      isRecoverable,
    );
  }
}

/**
 * Exception for database authentication issues
 */
export class AuthenticationException extends DatabaseException {
  constructor(
    message: string,
    context: DatabaseErrorContext = {},
    cause?: Error,
    isTransient: boolean = false,
    isRecoverable: boolean = false,
  ) {
    super(
      message,
      ErrorType.AUTHENTICATION_ERROR,
      DatabaseErrorCategory.AUTHENTICATION,
      DatabaseErrorSeverity.CRITICAL,
      context,
      cause,
      isTransient,
      isRecoverable,
    );
  }
}

/**
 * Exception for database transaction issues
 */
export class TransactionException extends DatabaseException {
  constructor(
    message: string,
    context: DatabaseErrorContext = {},
    cause?: Error,
    isTransient: boolean = true,
    isRecoverable: boolean = true,
  ) {
    super(
      message,
      ErrorType.TRANSACTION_ERROR,
      DatabaseErrorCategory.TRANSACTION,
      DatabaseErrorSeverity.HIGH,
      context,
      cause,
      isTransient,
      isRecoverable,
    );
  }
}

/**
 * Exception for database constraint violations
 */
export class ConstraintViolationException extends DatabaseException {
  constructor(
    message: string,
    context: DatabaseErrorContext = {},
    cause?: Error,
    isTransient: boolean = false,
    isRecoverable: boolean = false,
  ) {
    super(
      message,
      ErrorType.CONSTRAINT_VIOLATION,
      DatabaseErrorCategory.CONSTRAINT,
      DatabaseErrorSeverity.MEDIUM,
      context,
      cause,
      isTransient,
      isRecoverable,
    );
  }
}

/**
 * Exception for database query issues
 */
export class QueryException extends DatabaseException {
  constructor(
    message: string,
    context: DatabaseErrorContext = {},
    cause?: Error,
    isTransient: boolean = false,
    isRecoverable: boolean = false,
  ) {
    super(
      message,
      ErrorType.QUERY_ERROR,
      DatabaseErrorCategory.QUERY,
      DatabaseErrorSeverity.MEDIUM,
      context,
      cause,
      isTransient,
      isRecoverable,
    );
  }
}

/**
 * Exception for database resource not found issues
 */
export class ResourceNotFoundException extends DatabaseException {
  constructor(
    message: string,
    context: DatabaseErrorContext = {},
    cause?: Error,
    isTransient: boolean = false,
    isRecoverable: boolean = false,
  ) {
    super(
      message,
      ErrorType.RESOURCE_NOT_FOUND,
      DatabaseErrorCategory.RESOURCE,
      DatabaseErrorSeverity.LOW,
      context,
      cause,
      isTransient,
      isRecoverable,
    );
  }
}

/**
 * Exception for database schema issues
 */
export class SchemaException extends DatabaseException {
  constructor(
    message: string,
    context: DatabaseErrorContext = {},
    cause?: Error,
    isTransient: boolean = false,
    isRecoverable: boolean = false,
  ) {
    super(
      message,
      ErrorType.SCHEMA_ERROR,
      DatabaseErrorCategory.SCHEMA,
      DatabaseErrorSeverity.HIGH,
      context,
      cause,
      isTransient,
      isRecoverable,
    );
  }
}