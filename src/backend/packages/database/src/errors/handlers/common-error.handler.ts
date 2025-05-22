/**
 * @file common-error.handler.ts
 * @description Provides a fallback error handler for generic database errors not covered by
 * technology-specific handlers. This common handler processes standard SQL errors, connection
 * issues, and general database exceptions across all storage technologies.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  DatabaseException,
  ConnectionException,
  QueryException,
  TransactionException,
  IntegrityException,
  ConfigurationException,
  DatabaseErrorContext,
  DatabaseErrorSeverity
} from '../database-error.exception';

import {
  DatabaseErrorType,
  DatabaseErrorSeverity as ErrorSeverity,
  DatabaseErrorRecoverability,
  ClassifiedDatabaseError,
  JourneyContext,
  DatabaseErrorMetadata
} from '../database-error.types';

import * as ErrorCodes from '../database-error.codes';
import { DatabaseErrorHandler } from './index';

/**
 * Options for configuring the CommonErrorHandler behavior
 */
export interface CommonErrorHandlerOptions {
  /** Whether to enable detailed error logging */
  enableDetailedLogging?: boolean;
  
  /** Journey context for error categorization */
  journeyContext?: JourneyContext;
  
  /** Custom error transformation options */
  transformOptions?: Record<string, unknown>;
}

/**
 * Provides a fallback error handler for generic database errors not covered by
 * technology-specific handlers. This common handler processes standard SQL errors,
 * connection issues, and general database exceptions across all storage technologies.
 */
@Injectable()
export class CommonErrorHandler implements DatabaseErrorHandler {
  private readonly logger = new Logger(CommonErrorHandler.name);
  private readonly options: CommonErrorHandlerOptions;

  /**
   * Creates a new instance of the CommonErrorHandler
   * 
   * @param options Configuration options for the handler
   */
  constructor(options?: CommonErrorHandlerOptions) {
    this.options = {
      enableDetailedLogging: true,
      journeyContext: JourneyContext.NONE,
      ...options
    };
    
    this.logger.log('CommonErrorHandler initialized');
  }

  /**
   * Handles a database error, transforming it into a standardized DatabaseException.
   * This method serves as a fallback for errors not handled by technology-specific handlers.
   * 
   * @param error The error to handle
   * @param context Optional operation context for error enrichment
   * @returns A standardized DatabaseException
   */
  public handleError(error: unknown, context?: Record<string, unknown>): DatabaseException {
    if (this.options.enableDetailedLogging) {
      this.logger.debug(
        `Handling error with CommonErrorHandler: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error, context }
      );
    }

    // Classify the error to determine its type, severity, and recoverability
    const classifiedError = this.classifyError(error, context);
    
    // Transform the classified error into the appropriate DatabaseException type
    return this.transformError(classifiedError);
  }

  /**
   * Determines if this handler can process a given error.
   * The CommonErrorHandler can handle any error as a fallback.
   * 
   * @param error The error to check
   * @returns True if this handler can process the error
   */
  public canHandle(error: unknown): boolean {
    // CommonErrorHandler is a fallback handler that can handle any error
    return true;
  }

  /**
   * Classifies a database error to determine its type, severity, and recoverability.
   * 
   * @param error The error to classify
   * @param context Optional operation context for error enrichment
   * @returns A classified database error
   */
  private classifyError(error: unknown, context?: Record<string, unknown>): ClassifiedDatabaseError {
    // Default classification for unknown errors
    const defaultClassification: ClassifiedDatabaseError = {
      type: DatabaseErrorType.UNKNOWN,
      severity: ErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.UNKNOWN,
      message: 'An unknown database error occurred',
      journeyContext: {
        journey: this.options.journeyContext || JourneyContext.NONE,
        userVisible: false
      },
      metadata: {
        originalError: error instanceof Error ? error : new Error('Unknown error'),
        timestamp: new Date()
      }
    };

    // If not an Error object, return default classification
    if (!(error instanceof Error)) {
      return defaultClassification;
    }

    // Extract error message and stack for analysis
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';
    
    // Create metadata from context and error
    const metadata: DatabaseErrorMetadata = {
      originalError: error,
      timestamp: new Date(),
      operation: context?.operation as string,
      entity: context?.entity as string,
      additionalData: { ...context }
    };

    // Classify based on error message patterns
    
    // Connection-related errors
    if (
      errorMessage.includes('connection') ||
      errorMessage.includes('connect') ||
      errorMessage.includes('network') ||
      errorMessage.includes('socket')
    ) {
      if (errorMessage.includes('timeout')) {
        return {
          type: DatabaseErrorType.CONNECTION_TIMEOUT,
          severity: ErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          message: 'Database connection timeout',
          code: ErrorCodes.DB_CONN_TIMEOUT,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: false
          },
          metadata
        };
      }
      
      if (errorMessage.includes('refused') || errorMessage.includes('closed') || errorMessage.includes('reset')) {
        return {
          type: DatabaseErrorType.CONNECTION_FAILED,
          severity: ErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          message: 'Database connection failed',
          code: ErrorCodes.DB_CONN_FAILED,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: false
          },
          metadata
        };
      }
      
      if (errorMessage.includes('limit') || errorMessage.includes('too many')) {
        return {
          type: DatabaseErrorType.CONNECTION_LIMIT_REACHED,
          severity: ErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          message: 'Database connection limit reached',
          code: ErrorCodes.DB_CONN_POOL_EXHAUSTED,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: false
          },
          metadata
        };
      }
      
      if (errorMessage.includes('authentication') || errorMessage.includes('auth') || errorMessage.includes('password')) {
        return {
          type: DatabaseErrorType.CONNECTION_FAILED,
          severity: ErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          message: 'Database authentication failed',
          code: ErrorCodes.DB_CONN_AUTH_FAILED,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: false
          },
          metadata
        };
      }
      
      // Generic connection error
      return {
        type: DatabaseErrorType.CONNECTION_FAILED,
        severity: ErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        message: 'Database connection error',
        code: ErrorCodes.DB_CONN_FAILED,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: false
        },
        metadata
      };
    }
    
    // Query-related errors
    if (
      errorMessage.includes('query') ||
      errorMessage.includes('sql') ||
      errorMessage.includes('syntax') ||
      errorMessage.includes('statement')
    ) {
      if (errorMessage.includes('timeout')) {
        return {
          type: DatabaseErrorType.QUERY_TIMEOUT,
          severity: ErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          message: 'Database query timeout',
          code: ErrorCodes.DB_QUERY_TIMEOUT,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: false
          },
          metadata
        };
      }
      
      if (errorMessage.includes('syntax') || errorMessage.includes('invalid')) {
        return {
          type: DatabaseErrorType.QUERY_SYNTAX,
          severity: ErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          message: 'Database query syntax error',
          code: ErrorCodes.DB_QUERY_SYNTAX_ERROR,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: false
          },
          metadata
        };
      }
      
      // Generic query error
      return {
        type: DatabaseErrorType.QUERY_EXECUTION_FAILED,
        severity: ErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.UNKNOWN,
        message: 'Database query execution failed',
        code: ErrorCodes.DB_QUERY_EXECUTION_FAILED,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: false
        },
        metadata
      };
    }
    
    // Transaction-related errors
    if (
      errorMessage.includes('transaction') ||
      errorMessage.includes('commit') ||
      errorMessage.includes('rollback') ||
      errorMessage.includes('deadlock') ||
      errorMessage.includes('serialization')
    ) {
      if (errorMessage.includes('deadlock')) {
        return {
          type: DatabaseErrorType.TRANSACTION_DEADLOCK,
          severity: ErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          message: 'Database transaction deadlock detected',
          code: ErrorCodes.DB_TRANS_DEADLOCK,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: false
          },
          metadata
        };
      }
      
      if (errorMessage.includes('timeout')) {
        return {
          type: DatabaseErrorType.TRANSACTION_TIMEOUT,
          severity: ErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          message: 'Database transaction timeout',
          code: ErrorCodes.DB_TRANS_TIMEOUT,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: false
          },
          metadata
        };
      }
      
      if (errorMessage.includes('commit')) {
        return {
          type: DatabaseErrorType.TRANSACTION_COMMIT_FAILED,
          severity: ErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.UNKNOWN,
          message: 'Database transaction commit failed',
          code: ErrorCodes.DB_TRANS_COMMIT_FAILED,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: false
          },
          metadata
        };
      }
      
      if (errorMessage.includes('rollback')) {
        return {
          type: DatabaseErrorType.TRANSACTION_ROLLBACK_FAILED,
          severity: ErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.UNKNOWN,
          message: 'Database transaction rollback failed',
          code: ErrorCodes.DB_TRANS_ROLLBACK_FAILED,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: false
          },
          metadata
        };
      }
      
      // Generic transaction error
      return {
        type: DatabaseErrorType.TRANSACTION_BEGIN_FAILED,
        severity: ErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.UNKNOWN,
        message: 'Database transaction error',
        code: ErrorCodes.DB_TRANS_BEGIN_FAILED,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: false
        },
        metadata
      };
    }
    
    // Data integrity errors
    if (
      errorMessage.includes('constraint') ||
      errorMessage.includes('unique') ||
      errorMessage.includes('foreign key') ||
      errorMessage.includes('not null') ||
      errorMessage.includes('duplicate') ||
      errorMessage.includes('violates')
    ) {
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
        return {
          type: DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION,
          severity: ErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          message: 'Unique constraint violation',
          code: ErrorCodes.DB_INTEGRITY_UNIQUE_VIOLATION,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: true,
            userMessage: 'This record already exists.'
          },
          metadata
        };
      }
      
      if (errorMessage.includes('foreign key')) {
        return {
          type: DatabaseErrorType.FOREIGN_KEY_CONSTRAINT_VIOLATION,
          severity: ErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          message: 'Foreign key constraint violation',
          code: ErrorCodes.DB_INTEGRITY_FOREIGN_KEY_VIOLATION,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: true,
            userMessage: 'This operation references a record that does not exist.'
          },
          metadata
        };
      }
      
      if (errorMessage.includes('not null')) {
        return {
          type: DatabaseErrorType.NOT_NULL_CONSTRAINT_VIOLATION,
          severity: ErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          message: 'Not null constraint violation',
          code: ErrorCodes.DB_INTEGRITY_NOT_NULL_VIOLATION,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: true,
            userMessage: 'Required information is missing.'
          },
          metadata
        };
      }
      
      if (errorMessage.includes('check')) {
        return {
          type: DatabaseErrorType.CHECK_CONSTRAINT_VIOLATION,
          severity: ErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          message: 'Check constraint violation',
          code: ErrorCodes.DB_INTEGRITY_CHECK_VIOLATION,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: true,
            userMessage: 'The provided data does not meet validation requirements.'
          },
          metadata
        };
      }
      
      // Generic integrity error
      return {
        type: DatabaseErrorType.DATA_VALIDATION_FAILED,
        severity: ErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        message: 'Data integrity constraint violation',
        code: ErrorCodes.DB_INTEGRITY_CONSTRAINT,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: true,
          userMessage: 'The operation could not be completed due to data validation issues.'
        },
        metadata
      };
    }
    
    // Configuration errors
    if (
      errorMessage.includes('config') ||
      errorMessage.includes('configuration') ||
      errorMessage.includes('schema') ||
      errorMessage.includes('migration') ||
      errorMessage.includes('environment')
    ) {
      if (errorMessage.includes('schema')) {
        return {
          type: DatabaseErrorType.SCHEMA_MISMATCH,
          severity: ErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          message: 'Database schema mismatch',
          code: ErrorCodes.DB_INTEGRITY_SCHEMA_MISMATCH,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: false
          },
          metadata
        };
      }
      
      if (errorMessage.includes('migration')) {
        return {
          type: DatabaseErrorType.MIGRATION_FAILED,
          severity: ErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          message: 'Database migration failed',
          code: ErrorCodes.DB_CONFIG_MIGRATION_FAILED,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: false
          },
          metadata
        };
      }
      
      // Generic configuration error
      return {
        type: DatabaseErrorType.INVALID_CONFIGURATION,
        severity: ErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        message: 'Database configuration error',
        code: ErrorCodes.DB_CONFIG_INVALID,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: false
        },
        metadata
      };
    }
    
    // Check for common SQL error codes
    if (this.hasSqlErrorCode(error)) {
      const sqlErrorCode = this.extractSqlErrorCode(error);
      return this.classifyBySqlErrorCode(sqlErrorCode, error, metadata);
    }

    // If we couldn't classify the error more specifically, return a generic database error
    return {
      type: DatabaseErrorType.UNKNOWN,
      severity: ErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.UNKNOWN,
      message: error.message,
      journeyContext: {
        journey: this.options.journeyContext || JourneyContext.NONE,
        userVisible: false
      },
      metadata
    };
  }

  /**
   * Transforms a classified database error into the appropriate DatabaseException type.
   * 
   * @param classifiedError The classified database error
   * @returns The appropriate DatabaseException subclass
   */
  private transformError(classifiedError: ClassifiedDatabaseError): DatabaseException {
    // Create the appropriate context for the DatabaseException
    const context: Partial<DatabaseErrorContext> = {
      severity: this.mapSeverity(classifiedError.severity),
      recoverable: classifiedError.recoverability === DatabaseErrorRecoverability.TRANSIENT,
      journey: classifiedError.journeyContext.journey.toLowerCase() as any,
      operation: classifiedError.metadata?.operation,
      entity: classifiedError.metadata?.entity,
      technicalDetails: {
        errorType: classifiedError.type,
        recoverability: classifiedError.recoverability,
        ...classifiedError.metadata?.additionalData
      }
    };

    // Add recovery suggestions based on error type
    context.recoverySuggestions = this.getRecoverySuggestions(classifiedError);

    // Create the appropriate exception type based on the error type
    const code = classifiedError.code || 'DB_ERROR';
    const message = classifiedError.message;
    const cause = classifiedError.metadata?.originalError as Error;

    switch (this.getErrorCategory(classifiedError.type)) {
      case 'connection':
        return new ConnectionException(message, code, context, cause);
      
      case 'query':
        return new QueryException(message, code, context, cause);
      
      case 'transaction':
        return new TransactionException(message, code, context, cause);
      
      case 'integrity':
        return new IntegrityException(message, code, context, cause);
      
      case 'configuration':
        return new ConfigurationException(message, code, context, cause);
      
      default:
        return new DatabaseException(message, code, context, cause);
    }
  }

  /**
   * Maps the DatabaseErrorSeverity enum to the DatabaseErrorSeverity enum used in exceptions.
   * 
   * @param severity The severity from the DatabaseErrorSeverity enum
   * @returns The corresponding severity from the DatabaseErrorSeverity enum used in exceptions
   */
  private mapSeverity(severity: ErrorSeverity): DatabaseErrorSeverity {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return DatabaseErrorSeverity.CRITICAL;
      case ErrorSeverity.MAJOR:
        return DatabaseErrorSeverity.HIGH;
      case ErrorSeverity.MINOR:
        return DatabaseErrorSeverity.MEDIUM;
      default:
        return DatabaseErrorSeverity.MEDIUM;
    }
  }

  /**
   * Gets the error category based on the error type.
   * 
   * @param errorType The database error type
   * @returns The error category (connection, query, transaction, integrity, configuration)
   */
  private getErrorCategory(errorType: DatabaseErrorType): string {
    if (errorType.toString().startsWith('CONNECTION')) {
      return 'connection';
    }
    
    if (errorType.toString().startsWith('QUERY')) {
      return 'query';
    }
    
    if (errorType.toString().startsWith('TRANSACTION')) {
      return 'transaction';
    }
    
    if (
      errorType === DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION ||
      errorType === DatabaseErrorType.FOREIGN_KEY_CONSTRAINT_VIOLATION ||
      errorType === DatabaseErrorType.CHECK_CONSTRAINT_VIOLATION ||
      errorType === DatabaseErrorType.NOT_NULL_CONSTRAINT_VIOLATION ||
      errorType === DatabaseErrorType.DATA_VALIDATION_FAILED
    ) {
      return 'integrity';
    }
    
    if (
      errorType === DatabaseErrorType.INVALID_CONFIGURATION ||
      errorType === DatabaseErrorType.MISSING_CONFIGURATION ||
      errorType === DatabaseErrorType.SCHEMA_MISMATCH ||
      errorType === DatabaseErrorType.MIGRATION_FAILED
    ) {
      return 'configuration';
    }
    
    return 'unknown';
  }

  /**
   * Gets recovery suggestions based on the classified error.
   * 
   * @param classifiedError The classified database error
   * @returns An array of recovery suggestions
   */
  private getRecoverySuggestions(classifiedError: ClassifiedDatabaseError): string[] {
    const suggestions: string[] = [];
    
    // Add general suggestion based on recoverability
    if (classifiedError.recoverability === DatabaseErrorRecoverability.TRANSIENT) {
      suggestions.push('Retry the operation after a short delay');
    }
    
    // Add specific suggestions based on error type
    switch (classifiedError.type) {
      case DatabaseErrorType.CONNECTION_FAILED:
      case DatabaseErrorType.CONNECTION_TIMEOUT:
      case DatabaseErrorType.CONNECTION_CLOSED:
        suggestions.push('Check database server status and network connectivity');
        suggestions.push('Verify database connection configuration (host, port, credentials)');
        suggestions.push('Ensure database service is running and accessible');
        break;
      
      case DatabaseErrorType.CONNECTION_LIMIT_REACHED:
        suggestions.push('Check connection pool configuration and limits');
        suggestions.push('Consider increasing the maximum number of connections');
        suggestions.push('Optimize queries to reduce connection usage');
        break;
      
      case DatabaseErrorType.QUERY_SYNTAX:
        suggestions.push('Check query syntax for errors');
        suggestions.push('Verify that referenced tables and columns exist');
        suggestions.push('Ensure proper data types are being used');
        break;
      
      case DatabaseErrorType.QUERY_TIMEOUT:
        suggestions.push('Optimize the query for better performance');
        suggestions.push('Consider adding appropriate indices');
        suggestions.push('Check for long-running transactions or locks');
        break;
      
      case DatabaseErrorType.TRANSACTION_DEADLOCK:
        suggestions.push('Retry the transaction after a short delay');
        suggestions.push('Consider reordering operations to avoid deadlocks');
        suggestions.push('Reduce transaction scope or duration');
        break;
      
      case DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION:
        suggestions.push('Check for duplicate values in unique columns');
        suggestions.push('Verify that the data being inserted or updated is unique');
        break;
      
      case DatabaseErrorType.FOREIGN_KEY_CONSTRAINT_VIOLATION:
        suggestions.push('Ensure referenced records exist before creating dependent records');
        suggestions.push('Check for cascading deletes that might affect related records');
        break;
      
      case DatabaseErrorType.SCHEMA_MISMATCH:
      case DatabaseErrorType.MIGRATION_FAILED:
        suggestions.push('Verify database schema version matches application version');
        suggestions.push('Check migration logs for specific errors');
        suggestions.push('Ensure database user has sufficient privileges for schema changes');
        break;
      
      default:
        suggestions.push('Check application logs for more details');
        suggestions.push('Verify database server logs for specific error information');
    }
    
    return suggestions;
  }

  /**
   * Checks if an error has a SQL error code.
   * 
   * @param error The error to check
   * @returns True if the error has a SQL error code
   */
  private hasSqlErrorCode(error: Error): boolean {
    return (
      // Check for common SQL error code properties
      ('code' in error && typeof (error as any).code === 'string') ||
      ('sqlState' in error && typeof (error as any).sqlState === 'string') ||
      ('errno' in error && typeof (error as any).errno === 'number') ||
      // Check for error message containing SQL state code pattern
      (error.message.match(/\b[0-9A-Z]{5}\b/) !== null)
    );
  }

  /**
   * Extracts the SQL error code from an error.
   * 
   * @param error The error to extract the code from
   * @returns The SQL error code or null if not found
   */
  private extractSqlErrorCode(error: Error): string | null {
    // Check for explicit code property
    if ('code' in error && typeof (error as any).code === 'string') {
      return (error as any).code;
    }
    
    // Check for sqlState property
    if ('sqlState' in error && typeof (error as any).sqlState === 'string') {
      return (error as any).sqlState;
    }
    
    // Check for errno property
    if ('errno' in error && typeof (error as any).errno === 'number') {
      return (error as any).errno.toString();
    }
    
    // Try to extract SQL state code from error message (format: XXXXX)
    const stateMatch = error.message.match(/\b([0-9A-Z]{5})\b/);
    if (stateMatch) {
      return stateMatch[1];
    }
    
    return null;
  }

  /**
   * Classifies an error based on its SQL error code.
   * 
   * @param sqlErrorCode The SQL error code
   * @param error The original error
   * @param metadata Additional error metadata
   * @returns A classified database error
   */
  private classifyBySqlErrorCode(sqlErrorCode: string | null, error: Error, metadata: DatabaseErrorMetadata): ClassifiedDatabaseError {
    if (!sqlErrorCode) {
      return {
        type: DatabaseErrorType.UNKNOWN,
        severity: ErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.UNKNOWN,
        message: error.message,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: false
        },
        metadata
      };
    }
    
    // PostgreSQL error codes
    if (sqlErrorCode.startsWith('08')) {
      // Class 08 — Connection Exception
      return {
        type: DatabaseErrorType.CONNECTION_FAILED,
        severity: ErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        message: 'Database connection error',
        code: ErrorCodes.DB_CONN_FAILED,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: false
        },
        metadata
      };
    }
    
    if (sqlErrorCode.startsWith('23')) {
      // Class 23 — Integrity Constraint Violation
      if (sqlErrorCode === '23505') {
        // Unique violation
        return {
          type: DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION,
          severity: ErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          message: 'Unique constraint violation',
          code: ErrorCodes.DB_INTEGRITY_UNIQUE_VIOLATION,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: true,
            userMessage: 'This record already exists.'
          },
          metadata
        };
      }
      
      if (sqlErrorCode === '23503') {
        // Foreign key violation
        return {
          type: DatabaseErrorType.FOREIGN_KEY_CONSTRAINT_VIOLATION,
          severity: ErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          message: 'Foreign key constraint violation',
          code: ErrorCodes.DB_INTEGRITY_FOREIGN_KEY_VIOLATION,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: true,
            userMessage: 'This operation references a record that does not exist.'
          },
          metadata
        };
      }
      
      if (sqlErrorCode === '23502') {
        // Not null violation
        return {
          type: DatabaseErrorType.NOT_NULL_CONSTRAINT_VIOLATION,
          severity: ErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          message: 'Not null constraint violation',
          code: ErrorCodes.DB_INTEGRITY_NOT_NULL_VIOLATION,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: true,
            userMessage: 'Required information is missing.'
          },
          metadata
        };
      }
      
      if (sqlErrorCode === '23514') {
        // Check constraint violation
        return {
          type: DatabaseErrorType.CHECK_CONSTRAINT_VIOLATION,
          severity: ErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          message: 'Check constraint violation',
          code: ErrorCodes.DB_INTEGRITY_CHECK_VIOLATION,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: true,
            userMessage: 'The provided data does not meet validation requirements.'
          },
          metadata
        };
      }
      
      // Generic integrity error
      return {
        type: DatabaseErrorType.DATA_VALIDATION_FAILED,
        severity: ErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        message: 'Data integrity constraint violation',
        code: ErrorCodes.DB_INTEGRITY_CONSTRAINT,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: true,
          userMessage: 'The operation could not be completed due to data validation issues.'
        },
        metadata
      };
    }
    
    if (sqlErrorCode.startsWith('42')) {
      // Class 42 — Syntax Error or Access Rule Violation
      return {
        type: DatabaseErrorType.QUERY_SYNTAX,
        severity: ErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        message: 'Database query syntax error',
        code: ErrorCodes.DB_QUERY_SYNTAX_ERROR,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: false
        },
        metadata
      };
    }
    
    if (sqlErrorCode.startsWith('40')) {
      // Class 40 — Transaction Rollback
      if (sqlErrorCode === '40001' || sqlErrorCode === '40P01') {
        // Serialization failure or deadlock detected
        return {
          type: DatabaseErrorType.TRANSACTION_DEADLOCK,
          severity: ErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          message: 'Database transaction deadlock detected',
          code: ErrorCodes.DB_TRANS_DEADLOCK,
          journeyContext: {
            journey: this.options.journeyContext || JourneyContext.NONE,
            userVisible: false
          },
          metadata
        };
      }
      
      // Generic transaction error
      return {
        type: DatabaseErrorType.TRANSACTION_ROLLBACK_FAILED,
        severity: ErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        message: 'Database transaction rollback',
        code: ErrorCodes.DB_TRANS_ROLLBACK_FAILED,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: false
        },
        metadata
      };
    }
    
    if (sqlErrorCode.startsWith('57') || sqlErrorCode.startsWith('58')) {
      // Class 57 — Operator Intervention
      // Class 58 — System Error
      return {
        type: DatabaseErrorType.CONNECTION_FAILED,
        severity: ErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        message: 'Database server error',
        code: ErrorCodes.DB_CONN_FAILED,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: false
        },
        metadata
      };
    }
    
    if (sqlErrorCode.startsWith('53')) {
      // Class 53 — Insufficient Resources
      return {
        type: DatabaseErrorType.CONNECTION_LIMIT_REACHED,
        severity: ErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        message: 'Database resource limit reached',
        code: ErrorCodes.DB_CONN_POOL_EXHAUSTED,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: false
        },
        metadata
      };
    }
    
    if (sqlErrorCode.startsWith('22')) {
      // Class 22 — Data Exception
      return {
        type: DatabaseErrorType.DATA_VALIDATION_FAILED,
        severity: ErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        message: 'Data validation error',
        code: ErrorCodes.DB_INTEGRITY_INVALID_DATA_TYPE,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: true,
          userMessage: 'The provided data is invalid.'
        },
        metadata
      };
    }
    
    // MySQL error codes
    if (sqlErrorCode === '1040' || sqlErrorCode === '1203') {
      // Too many connections
      return {
        type: DatabaseErrorType.CONNECTION_LIMIT_REACHED,
        severity: ErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        message: 'Database connection limit reached',
        code: ErrorCodes.DB_CONN_POOL_EXHAUSTED,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: false
        },
        metadata
      };
    }
    
    if (sqlErrorCode === '1213') {
      // Deadlock found
      return {
        type: DatabaseErrorType.TRANSACTION_DEADLOCK,
        severity: ErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        message: 'Database transaction deadlock detected',
        code: ErrorCodes.DB_TRANS_DEADLOCK,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: false
        },
        metadata
      };
    }
    
    if (sqlErrorCode === '1205') {
      // Lock wait timeout exceeded
      return {
        type: DatabaseErrorType.TRANSACTION_TIMEOUT,
        severity: ErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        message: 'Database transaction lock timeout',
        code: ErrorCodes.DB_TRANS_TIMEOUT,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: false
        },
        metadata
      };
    }
    
    if (sqlErrorCode === '1062') {
      // Duplicate entry
      return {
        type: DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION,
        severity: ErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        message: 'Unique constraint violation',
        code: ErrorCodes.DB_INTEGRITY_UNIQUE_VIOLATION,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: true,
          userMessage: 'This record already exists.'
        },
        metadata
      };
    }
    
    if (sqlErrorCode === '1452') {
      // Foreign key constraint fails
      return {
        type: DatabaseErrorType.FOREIGN_KEY_CONSTRAINT_VIOLATION,
        severity: ErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        message: 'Foreign key constraint violation',
        code: ErrorCodes.DB_INTEGRITY_FOREIGN_KEY_VIOLATION,
        journeyContext: {
          journey: this.options.journeyContext || JourneyContext.NONE,
          userVisible: true,
          userMessage: 'This operation references a record that does not exist.'
        },
        metadata
      };
    }
    
    // For any other SQL error code, return a generic database error
    return {
      type: DatabaseErrorType.UNKNOWN,
      severity: ErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.UNKNOWN,
      message: `Database error with code ${sqlErrorCode}: ${error.message}`,
      code: sqlErrorCode,
      journeyContext: {
        journey: this.options.journeyContext || JourneyContext.NONE,
        userVisible: false
      },
      metadata
    };
  }
}