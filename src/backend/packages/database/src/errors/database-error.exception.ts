import { AppException, ErrorType } from '@austa/errors';

/**
 * Enum representing the severity of database errors
 */
export enum DatabaseErrorSeverity {
  /**
   * Critical errors that require immediate attention and likely system intervention
   */
  CRITICAL = 'critical',
  
  /**
   * Major errors that significantly impact functionality but may not require immediate intervention
   */
  MAJOR = 'major',
  
  /**
   * Minor errors that have limited impact on functionality
   */
  MINOR = 'minor'
}

/**
 * Enum representing the recoverability of database errors
 */
export enum DatabaseErrorRecoverability {
  /**
   * Transient errors that may resolve on retry
   */
  TRANSIENT = 'transient',
  
  /**
   * Permanent errors that will not resolve without intervention
   */
  PERMANENT = 'permanent'
}

/**
 * Interface for journey context information to be included with database errors
 */
export interface JourneyContext {
  /**
   * The journey where the error occurred (health, care, plan, etc.)
   */
  journey?: string;
  
  /**
   * The specific feature or module within the journey
   */
  feature?: string;
  
  /**
   * The user ID associated with the operation, if applicable
   */
  userId?: string;
  
  /**
   * Any additional context-specific information
   */
  [key: string]: any;
}

/**
 * Interface for database operation context
 */
export interface DatabaseOperationContext {
  /**
   * The type of operation being performed (select, insert, update, delete, etc.)
   */
  operation?: string;
  
  /**
   * The target entity or table name
   */
  entity?: string;
  
  /**
   * The query or command being executed, if applicable
   */
  query?: string;
  
  /**
   * Parameters used in the query, if applicable
   */
  params?: Record<string, any>;
  
  /**
   * Any additional operation-specific information
   */
  [key: string]: any;
}

/**
 * Base class for all database-related exceptions in the AUSTA SuperApp.
 * Extends AppException to provide standardized error handling for database operations.
 */
export class DatabaseException extends AppException {
  /**
   * Creates a new DatabaseException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code from database-error.codes.ts
   * @param severity - Severity level of the error
   * @param recoverability - Whether the error is transient or permanent
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param recoverySuggestion - Suggestion for recovering from this error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    public readonly severity: DatabaseErrorSeverity = DatabaseErrorSeverity.MAJOR,
    public readonly recoverability: DatabaseErrorRecoverability = DatabaseErrorRecoverability.PERMANENT,
    public readonly journeyContext?: JourneyContext,
    public readonly operationContext?: DatabaseOperationContext,
    public readonly recoverySuggestion?: string,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL, // Database errors are technical by default
      code,
      {
        severity,
        recoverability,
        journeyContext,
        operationContext,
        recoverySuggestion
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DatabaseException.prototype);
  }

  /**
   * Returns a JSON representation of the database exception with additional context.
   * Extends the base AppException toJSON method.
   * 
   * @returns JSON object with standardized error structure and database-specific context
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        severity: this.severity,
        recoverability: this.recoverability,
        journeyContext: this.journeyContext,
        operationContext: this.operationContext,
        recoverySuggestion: this.recoverySuggestion
      }
    };
  }

  /**
   * Creates a formatted error message with context information.
   * Useful for logging and debugging.
   * 
   * @returns Detailed error message with context
   */
  getDetailedMessage(): string {
    let detailedMessage = `[${this.code}] ${this.message}`;
    
    if (this.journeyContext?.journey) {
      detailedMessage += ` | Journey: ${this.journeyContext.journey}`;
    }
    
    if (this.operationContext?.operation) {
      detailedMessage += ` | Operation: ${this.operationContext.operation}`;
    }
    
    if (this.operationContext?.entity) {
      detailedMessage += ` | Entity: ${this.operationContext.entity}`;
    }
    
    return detailedMessage;
  }
}

/**
 * Exception for database connection errors.
 * Used when the application fails to establish or maintain a connection to the database.
 */
export class ConnectionException extends DatabaseException {
  /**
   * Creates a new ConnectionException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code from database-error.codes.ts (DB_CONN_* codes)
   * @param severity - Severity level of the error
   * @param recoverability - Whether the error is transient or permanent
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param recoverySuggestion - Suggestion for recovering from this error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    severity: DatabaseErrorSeverity = DatabaseErrorSeverity.CRITICAL,
    recoverability: DatabaseErrorRecoverability = DatabaseErrorRecoverability.TRANSIENT,
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext,
    recoverySuggestion: string = 'Check database availability, credentials, and network connectivity. Retry the operation after a brief delay.',
    cause?: Error
  ) {
    super(
      message,
      code,
      severity,
      recoverability,
      journeyContext,
      operationContext,
      recoverySuggestion,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ConnectionException.prototype);
  }
}

/**
 * Exception for database query execution errors.
 * Used when a query fails to execute properly.
 */
export class QueryException extends DatabaseException {
  /**
   * Creates a new QueryException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code from database-error.codes.ts (DB_QUERY_* codes)
   * @param severity - Severity level of the error
   * @param recoverability - Whether the error is transient or permanent
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param recoverySuggestion - Suggestion for recovering from this error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    severity: DatabaseErrorSeverity = DatabaseErrorSeverity.MAJOR,
    recoverability: DatabaseErrorRecoverability = DatabaseErrorRecoverability.PERMANENT,
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext,
    recoverySuggestion: string = 'Check query syntax, parameters, and permissions. Ensure the operation is valid for the target entity.',
    cause?: Error
  ) {
    super(
      message,
      code,
      severity,
      recoverability,
      journeyContext,
      operationContext,
      recoverySuggestion,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, QueryException.prototype);
  }
}

/**
 * Exception for database transaction errors.
 * Used when transaction operations (begin, commit, rollback) fail.
 */
export class TransactionException extends DatabaseException {
  /**
   * Creates a new TransactionException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code from database-error.codes.ts (DB_TRANS_* codes)
   * @param severity - Severity level of the error
   * @param recoverability - Whether the error is transient or permanent
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param recoverySuggestion - Suggestion for recovering from this error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    severity: DatabaseErrorSeverity = DatabaseErrorSeverity.MAJOR,
    recoverability: DatabaseErrorRecoverability = DatabaseErrorRecoverability.TRANSIENT,
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext,
    recoverySuggestion: string = 'Retry the transaction after a brief delay. If the issue persists, check for deadlocks or conflicting operations.',
    cause?: Error
  ) {
    super(
      message,
      code,
      severity,
      recoverability,
      journeyContext,
      operationContext,
      recoverySuggestion,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TransactionException.prototype);
  }
}

/**
 * Exception for data integrity errors.
 * Used when database constraints are violated (unique, foreign key, check, etc.).
 */
export class IntegrityException extends DatabaseException {
  /**
   * Creates a new IntegrityException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code from database-error.codes.ts (DB_INTEG_* codes)
   * @param severity - Severity level of the error
   * @param recoverability - Whether the error is transient or permanent
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param recoverySuggestion - Suggestion for recovering from this error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    severity: DatabaseErrorSeverity = DatabaseErrorSeverity.MAJOR,
    recoverability: DatabaseErrorRecoverability = DatabaseErrorRecoverability.PERMANENT,
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext,
    recoverySuggestion: string = 'Check the data for constraint violations. Ensure referential integrity and unique constraints are satisfied.',
    cause?: Error
  ) {
    super(
      message,
      code,
      severity,
      recoverability,
      journeyContext,
      operationContext,
      recoverySuggestion,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, IntegrityException.prototype);
  }
}

/**
 * Exception for database configuration errors.
 * Used when database configuration is invalid or incompatible.
 */
export class ConfigurationException extends DatabaseException {
  /**
   * Creates a new ConfigurationException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code from database-error.codes.ts (DB_CONFIG_* codes)
   * @param severity - Severity level of the error
   * @param recoverability - Whether the error is transient or permanent
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param recoverySuggestion - Suggestion for recovering from this error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    severity: DatabaseErrorSeverity = DatabaseErrorSeverity.CRITICAL,
    recoverability: DatabaseErrorRecoverability = DatabaseErrorRecoverability.PERMANENT,
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext,
    recoverySuggestion: string = 'Check database configuration settings, connection strings, and environment variables. Ensure proper setup for the current environment.',
    cause?: Error
  ) {
    super(
      message,
      code,
      severity,
      recoverability,
      journeyContext,
      operationContext,
      recoverySuggestion,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ConfigurationException.prototype);
  }
}

/**
 * Exception for journey-specific database errors.
 * Used to provide context-rich errors for specific journeys (health, care, plan).
 */
export class JourneyDatabaseException extends DatabaseException {
  /**
   * Creates a new JourneyDatabaseException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code from database-error.codes.ts (DB_HEALTH_*, DB_CARE_*, DB_PLAN_*, DB_GAME_* codes)
   * @param journey - The journey where the error occurred (health, care, plan, gamification)
   * @param feature - The specific feature or module within the journey
   * @param severity - Severity level of the error
   * @param recoverability - Whether the error is transient or permanent
   * @param operationContext - Context information about the database operation
   * @param recoverySuggestion - Suggestion for recovering from this error
   * @param additionalContext - Any additional journey-specific context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    journey: string,
    feature: string,
    severity: DatabaseErrorSeverity = DatabaseErrorSeverity.MAJOR,
    recoverability: DatabaseErrorRecoverability = DatabaseErrorRecoverability.PERMANENT,
    operationContext?: DatabaseOperationContext,
    recoverySuggestion?: string,
    additionalContext: Record<string, any> = {},
    cause?: Error
  ) {
    const journeyContext: JourneyContext = {
      journey,
      feature,
      ...additionalContext
    };
    
    super(
      message,
      code,
      severity,
      recoverability,
      journeyContext,
      operationContext,
      recoverySuggestion || `Check ${journey} journey specific requirements and constraints for the ${feature} feature.`,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, JourneyDatabaseException.prototype);
  }

  /**
   * Returns a journey-specific error message with context.
   * 
   * @returns Detailed error message with journey context
   */
  getJourneyContextMessage(): string {
    const { journey, feature } = this.journeyContext || {};
    return `[${journey?.toUpperCase() || 'UNKNOWN'}:${feature || 'general'}] ${this.message} (${this.code})`;
  }
}