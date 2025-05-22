import { AppException, ErrorType } from '@austa/shared/exceptions';

/**
 * Enum representing the severity levels of database errors.
 * Used to indicate the impact and urgency of database-related issues.
 */
export enum DatabaseErrorSeverity {
  /**
   * Low severity - minor issue that doesn't significantly impact functionality
   */
  LOW = 'low',
  
  /**
   * Medium severity - issue that affects some functionality but system can continue
   */
  MEDIUM = 'medium',
  
  /**
   * High severity - critical issue that severely impacts system functionality
   */
  HIGH = 'high',
  
  /**
   * Critical severity - catastrophic issue that prevents system operation
   */
  CRITICAL = 'critical'
}

/**
 * Interface defining the structure of database error context.
 * Provides additional information about the database error for better debugging and logging.
 */
export interface DatabaseErrorContext {
  /**
   * The journey context in which the error occurred (health, care, plan)
   */
  journey?: 'health' | 'care' | 'plan' | 'gamification' | 'common';
  
  /**
   * The severity level of the error
   */
  severity: DatabaseErrorSeverity;
  
  /**
   * Whether the error is potentially recoverable
   */
  recoverable: boolean;
  
  /**
   * Suggestions for recovering from the error
   */
  recoverySuggestions?: string[];
  
  /**
   * The database operation that was being performed when the error occurred
   */
  operation?: string;
  
  /**
   * The database entity or table involved in the error
   */
  entity?: string;
  
  /**
   * Additional technical details about the error
   */
  technicalDetails?: Record<string, any>;
}

/**
 * Base class for all database-related exceptions in the AUSTA SuperApp.
 * Extends AppException to provide consistent error handling for database errors.
 */
export class DatabaseException extends AppException {
  /**
   * The context of the database error, providing additional information
   */
  public readonly context: DatabaseErrorContext;
  
  /**
   * Creates a new DatabaseException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization (e.g., "DB_001")
   * @param context - Additional context about the database error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    context: Partial<DatabaseErrorContext>,
    cause?: Error
  ) {
    // Database errors are typically technical errors
    super(message, ErrorType.TECHNICAL, code, undefined, cause);
    
    // Set default context values if not provided
    this.context = {
      severity: context.severity || DatabaseErrorSeverity.MEDIUM,
      recoverable: context.recoverable !== undefined ? context.recoverable : true,
      recoverySuggestions: context.recoverySuggestions || [],
      journey: context.journey || 'common',
      operation: context.operation,
      entity: context.entity,
      technicalDetails: context.technicalDetails || {}
    };
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DatabaseException.prototype);
  }
  
  /**
   * Returns a JSON representation of the exception including database-specific context.
   * Extends the base AppException toJSON method.
   * 
   * @returns JSON object with standardized error structure and database context
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        context: {
          journey: this.context.journey,
          severity: this.context.severity,
          recoverable: this.context.recoverable,
          recoverySuggestions: this.context.recoverySuggestions
        }
      }
    };
  }
}

/**
 * Exception for database connection issues.
 * Thrown when the application cannot establish or maintain a connection to the database.
 */
export class ConnectionException extends DatabaseException {
  /**
   * Creates a new ConnectionException instance.
   * 
   * @param message - Human-readable error message
   * @param context - Additional context about the connection error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: Partial<DatabaseErrorContext> = {},
    cause?: Error
  ) {
    super(
      message,
      'DB_CONNECTION_ERROR',
      {
        ...context,
        severity: context.severity || DatabaseErrorSeverity.HIGH,
        recoverable: context.recoverable !== undefined ? context.recoverable : true,
        recoverySuggestions: context.recoverySuggestions || [
          'Check database server status and network connectivity',
          'Verify database connection configuration (host, port, credentials)',
          'Ensure database service is running and accessible',
          'Check for firewall or security group restrictions',
          'Verify connection pool settings and limits'
        ]
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ConnectionException.prototype);
  }
}

/**
 * Exception for database query execution issues.
 * Thrown when a database query fails to execute properly.
 */
export class QueryException extends DatabaseException {
  /**
   * Creates a new QueryException instance.
   * 
   * @param message - Human-readable error message
   * @param context - Additional context about the query error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: Partial<DatabaseErrorContext> = {},
    cause?: Error
  ) {
    super(
      message,
      'DB_QUERY_ERROR',
      {
        ...context,
        severity: context.severity || DatabaseErrorSeverity.MEDIUM,
        recoverable: context.recoverable !== undefined ? context.recoverable : true,
        recoverySuggestions: context.recoverySuggestions || [
          'Check query syntax for errors',
          'Verify that referenced tables and columns exist',
          'Ensure proper data types are being used',
          'Check for query timeout or resource limitations',
          'Verify database permissions for the operation'
        ]
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, QueryException.prototype);
  }
}

/**
 * Exception for database transaction issues.
 * Thrown when a database transaction fails to commit or rollback properly.
 */
export class TransactionException extends DatabaseException {
  /**
   * Creates a new TransactionException instance.
   * 
   * @param message - Human-readable error message
   * @param context - Additional context about the transaction error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: Partial<DatabaseErrorContext> = {},
    cause?: Error
  ) {
    super(
      message,
      'DB_TRANSACTION_ERROR',
      {
        ...context,
        severity: context.severity || DatabaseErrorSeverity.HIGH,
        recoverable: context.recoverable !== undefined ? context.recoverable : false,
        recoverySuggestions: context.recoverySuggestions || [
          'Check for deadlocks or lock timeouts',
          'Verify transaction isolation level is appropriate',
          'Ensure proper error handling within transactions',
          'Consider breaking large transactions into smaller ones',
          'Check for connection issues during transaction execution'
        ]
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TransactionException.prototype);
  }
}

/**
 * Exception for database integrity constraint violations.
 * Thrown when a database operation violates integrity constraints like unique keys or foreign keys.
 */
export class IntegrityException extends DatabaseException {
  /**
   * Creates a new IntegrityException instance.
   * 
   * @param message - Human-readable error message
   * @param context - Additional context about the integrity error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: Partial<DatabaseErrorContext> = {},
    cause?: Error
  ) {
    super(
      message,
      'DB_INTEGRITY_ERROR',
      {
        ...context,
        severity: context.severity || DatabaseErrorSeverity.MEDIUM,
        recoverable: context.recoverable !== undefined ? context.recoverable : false,
        recoverySuggestions: context.recoverySuggestions || [
          'Check for duplicate key violations',
          'Verify foreign key references exist',
          'Ensure data meets all constraint requirements',
          'Verify cascading operations are configured correctly',
          'Check for concurrent modifications to the same data'
        ]
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, IntegrityException.prototype);
  }
}

/**
 * Exception for database configuration issues.
 * Thrown when there are problems with database configuration settings.
 */
export class ConfigurationException extends DatabaseException {
  /**
   * Creates a new ConfigurationException instance.
   * 
   * @param message - Human-readable error message
   * @param context - Additional context about the configuration error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: Partial<DatabaseErrorContext> = {},
    cause?: Error
  ) {
    super(
      message,
      'DB_CONFIG_ERROR',
      {
        ...context,
        severity: context.severity || DatabaseErrorSeverity.HIGH,
        recoverable: context.recoverable !== undefined ? context.recoverable : true,
        recoverySuggestions: context.recoverySuggestions || [
          'Verify database configuration settings',
          'Check environment variables for database configuration',
          'Ensure database schema matches expected configuration',
          'Verify Prisma schema and connection settings',
          'Check for missing or incorrect configuration files'
        ]
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ConfigurationException.prototype);
  }
}