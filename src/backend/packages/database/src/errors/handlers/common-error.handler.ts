/**
 * Common Database Error Handler
 * 
 * This file provides a fallback error handler for generic database errors not covered by
 * technology-specific handlers. It implements a base classification system that identifies
 * common patterns like timeouts, authentication failures, and resource exhaustion across
 * different database systems.
 * 
 * The CommonErrorHandler processes standard SQL errors, connection issues, and general
 * database exceptions across all storage technologies, ensuring consistent error handling
 * even for unrecognized database errors.
 */

import {
  ConnectionException,
  ConfigurationException,
  DatabaseException,
  IntegrityException,
  QueryException,
  TransactionException,
  DatabaseErrorSeverity,
  DatabaseErrorRecoverability,
  JourneyContext,
  DatabaseOperationContext
} from '../database-error.exception';
import {
  DB_CONN_PG_FAILED,
  DB_CONN_PG_TIMEOUT,
  DB_CONN_PG_REJECTED,
  DB_QUERY_PG_SYNTAX,
  DB_QUERY_PG_TIMEOUT,
  DB_QUERY_PG_RESOURCE_LIMIT,
  DB_TRANS_PG_DEADLOCK,
  DB_INTEG_PG_UNIQUE,
  DB_INTEG_PG_FOREIGN_KEY,
  DB_INTEG_PG_NOT_NULL,
  DB_CONFIG_PG_INVALID_URL
} from '../database-error.codes';
import { Logger } from '@austa/logging';
import { DatabaseErrorClassification, DatabaseErrorContext } from '../database-error.types';
import { IDatabaseErrorHandler } from './index';

/**
 * Interface for SQL error state mappings
 * Maps SQL state codes to error types and codes
 */
interface SqlStateMapping {
  errorType: 'connection' | 'query' | 'transaction' | 'integrity' | 'configuration';
  errorCode: string;
  severity: DatabaseErrorSeverity;
  recoverability: DatabaseErrorRecoverability;
  message: string;
}

/**
 * Class that handles generic database errors not covered by technology-specific handlers.
 * Provides fallback error handling for unrecognized database errors.
 */
export class CommonErrorHandler implements IDatabaseErrorHandler {
  private readonly logger = new Logger(CommonErrorHandler.name);

  // Standard SQL state code mappings based on ANSI SQL and PostgreSQL error codes
  private readonly sqlStateMappings: Record<string, SqlStateMapping> = {
    // Connection errors (Class 08)
    '08000': {
      errorType: 'connection',
      errorCode: DB_CONN_PG_FAILED,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Connection exception'
    },
    '08001': {
      errorType: 'connection',
      errorCode: DB_CONN_PG_FAILED,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'SQL client unable to establish SQL connection'
    },
    '08003': {
      errorType: 'connection',
      errorCode: DB_CONN_PG_FAILED,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Connection does not exist'
    },
    '08004': {
      errorType: 'connection',
      errorCode: DB_CONN_PG_REJECTED,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'SQL server rejected establishment of SQL connection'
    },
    '08006': {
      errorType: 'connection',
      errorCode: DB_CONN_PG_FAILED,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Connection failure'
    },
    '08007': {
      errorType: 'transaction',
      errorCode: DB_TRANS_PG_DEADLOCK,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Transaction resolution unknown'
    },
    '08P01': {
      errorType: 'connection',
      errorCode: DB_CONN_PG_FAILED,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Protocol violation'
    },
    
    // Triggered action exceptions (Class 09)
    '09000': {
      errorType: 'query',
      errorCode: DB_QUERY_PG_SYNTAX,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'Triggered action exception'
    },
    
    // Feature not supported (Class 0A)
    '0A000': {
      errorType: 'configuration',
      errorCode: DB_CONFIG_PG_INVALID_URL,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'Feature not supported'
    },
    
    // Invalid transaction initiation (Class 0B)
    '0B000': {
      errorType: 'transaction',
      errorCode: DB_TRANS_PG_DEADLOCK,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Invalid transaction initiation'
    },
    
    // Syntax error or access rule violation (Class 42)
    '42000': {
      errorType: 'query',
      errorCode: DB_QUERY_PG_SYNTAX,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'Syntax error or access rule violation'
    },
    '42601': {
      errorType: 'query',
      errorCode: DB_QUERY_PG_SYNTAX,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'Syntax error'
    },
    '42P01': {
      errorType: 'query',
      errorCode: DB_QUERY_PG_SYNTAX,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'Undefined table'
    },
    '42P02': {
      errorType: 'query',
      errorCode: DB_QUERY_PG_SYNTAX,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'Undefined parameter'
    },
    '42703': {
      errorType: 'query',
      errorCode: DB_QUERY_PG_SYNTAX,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'Undefined column'
    },
    
    // Integrity constraint violation (Class 23)
    '23000': {
      errorType: 'integrity',
      errorCode: DB_INTEG_PG_UNIQUE,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'Integrity constraint violation'
    },
    '23001': {
      errorType: 'integrity',
      errorCode: DB_INTEG_PG_UNIQUE,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'Restrict violation'
    },
    '23502': {
      errorType: 'integrity',
      errorCode: DB_INTEG_PG_NOT_NULL,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'Not null violation'
    },
    '23503': {
      errorType: 'integrity',
      errorCode: DB_INTEG_PG_FOREIGN_KEY,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'Foreign key violation'
    },
    '23505': {
      errorType: 'integrity',
      errorCode: DB_INTEG_PG_UNIQUE,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'Unique violation'
    },
    '23514': {
      errorType: 'integrity',
      errorCode: DB_INTEG_PG_UNIQUE,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'Check violation'
    },
    
    // Transaction rollback (Class 40)
    '40000': {
      errorType: 'transaction',
      errorCode: DB_TRANS_PG_DEADLOCK,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Transaction rollback'
    },
    '40001': {
      errorType: 'transaction',
      errorCode: DB_TRANS_PG_DEADLOCK,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Serialization failure'
    },
    '40002': {
      errorType: 'transaction',
      errorCode: DB_TRANS_PG_DEADLOCK,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Transaction integrity constraint violation'
    },
    '40003': {
      errorType: 'transaction',
      errorCode: DB_TRANS_PG_DEADLOCK,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Statement completion unknown'
    },
    '40P01': {
      errorType: 'transaction',
      errorCode: DB_TRANS_PG_DEADLOCK,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Deadlock detected'
    },
    
    // System error (Class 58)
    '58000': {
      errorType: 'configuration',
      errorCode: DB_CONFIG_PG_INVALID_URL,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'System error'
    },
    '58030': {
      errorType: 'configuration',
      errorCode: DB_CONFIG_PG_INVALID_URL,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      message: 'IO error'
    },
    
    // Query canceled (Class 57)
    '57000': {
      errorType: 'query',
      errorCode: DB_QUERY_PG_TIMEOUT,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Operator intervention'
    },
    '57014': {
      errorType: 'query',
      errorCode: DB_QUERY_PG_TIMEOUT,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Query canceled'
    },
    '57P01': {
      errorType: 'connection',
      errorCode: DB_CONN_PG_FAILED,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Admin shutdown'
    },
    '57P02': {
      errorType: 'connection',
      errorCode: DB_CONN_PG_FAILED,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Crash shutdown'
    },
    '57P03': {
      errorType: 'connection',
      errorCode: DB_CONN_PG_FAILED,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Cannot connect now'
    },
    '57P04': {
      errorType: 'connection',
      errorCode: DB_CONN_PG_FAILED,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Database dropped'
    },
    
    // Insufficient resources (Class 53)
    '53000': {
      errorType: 'configuration',
      errorCode: DB_QUERY_PG_RESOURCE_LIMIT,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Insufficient resources'
    },
    '53100': {
      errorType: 'configuration',
      errorCode: DB_QUERY_PG_RESOURCE_LIMIT,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Disk full'
    },
    '53200': {
      errorType: 'configuration',
      errorCode: DB_QUERY_PG_RESOURCE_LIMIT,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Out of memory'
    },
    '53300': {
      errorType: 'configuration',
      errorCode: DB_QUERY_PG_RESOURCE_LIMIT,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Too many connections'
    },
    '53400': {
      errorType: 'configuration',
      errorCode: DB_QUERY_PG_RESOURCE_LIMIT,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      message: 'Configuration limit exceeded'
    }
  };

  /**
   * Handles a database error by classifying it and converting it to an appropriate exception type.
   * 
   * @param error - The original database error
   * @param context - Optional database error context
   * @returns A specialized database exception
   */
  public handleError(error: Error, context?: DatabaseErrorContext): DatabaseErrorClassification {
    const journeyContext = context?.journey && context?.feature ? 
      { journey: context.journey, feature: context.feature, userId: context.userId } : 
      undefined;
    
    const operationContext = context?.operation && context?.entity ? 
      { operation: context.operation, entity: context.entity, query: context.query, params: context.params } : 
      undefined;
    
    this.logger.debug(`Handling generic database error: ${error.message}`);
    
    // Extract SQL state code if present in the error message
    const sqlState = this.extractSqlStateCode(error.message);
    
    if (sqlState && this.sqlStateMappings[sqlState]) {
      const exception = this.handleSqlStateError(error, sqlState, journeyContext, operationContext);
      return {
        type: this.getErrorTypeFromException(exception),
        severity: exception.severity,
        recoverability: exception.recoverability,
        code: exception.code,
        message: exception.message,
        details: {
          journeyContext: exception.journeyContext,
          operationContext: exception.operationContext,
          originalError: error.message
        }
      };
    }
    
    // If no SQL state code found, try to classify based on error message patterns
    const exception = this.classifyByErrorMessage(error, journeyContext, operationContext);
    return {
      type: this.getErrorTypeFromException(exception),
      severity: exception.severity,
      recoverability: exception.recoverability,
      code: exception.code,
      message: exception.message,
      details: {
        journeyContext: exception.journeyContext,
        operationContext: exception.operationContext,
        originalError: error.message
      }
    };
  }
  
  /**
   * Determines if this handler can process the given error.
   * The common error handler can handle any database error as a fallback.
   * 
   * @param error - The error to check
   * @returns True, as this handler can process any error as a fallback
   */
  public canHandle(error: Error): boolean {
    // The common error handler can handle any error as a fallback
    return true;
  }
  
  /**
   * Enriches an error with additional context information.
   * 
   * @param error - The error to enrich
   * @param context - Context information to add to the error
   * @returns The enriched error
   */
  public enrichError(error: Error, context: DatabaseErrorContext): Error {
    if (context.journey && context.feature) {
      this.enrichWithJourneyContext(
        error,
        context.journey,
        context.feature,
        context.userId
      );
    }
    
    if (context.operation && context.entity) {
      this.enrichWithOperationContext(
        error,
        context.operation,
        context.entity,
        context.query,
        context.params
      );
    }
    
    return error;
  }
  
  /**
   * Gets the error type from a database exception.
   * 
   * @param exception - The database exception
   * @returns The corresponding error type
   */
  private getErrorTypeFromException(exception: DatabaseException): 'connection' | 'query' | 'transaction' | 'integrity' | 'configuration' {
    if (exception instanceof ConnectionException) return 'connection';
    if (exception instanceof QueryException) return 'query';
    if (exception instanceof TransactionException) return 'transaction';
    if (exception instanceof IntegrityException) return 'integrity';
    if (exception instanceof ConfigurationException) return 'configuration';
    return 'query'; // Default to query for generic DatabaseException
  }
  
  /**
   * Handles a database error by classifying it and converting it to an appropriate exception type.
   * Legacy method for backward compatibility.
   * 
   * @param error - The original database error
   * @param journeyContext - Optional journey context information
   * @param operationContext - Optional database operation context
   * @returns A specialized database exception
   */
  public handleErrorWithContext(error: Error, journeyContext?: JourneyContext, operationContext?: DatabaseOperationContext): DatabaseException {
    this.logger.debug(`Handling generic database error: ${error.message}`);
    
    // Extract SQL state code if present in the error message
    const sqlState = this.extractSqlStateCode(error.message);
    
    if (sqlState && this.sqlStateMappings[sqlState]) {
      return this.handleSqlStateError(error, sqlState, journeyContext, operationContext);
    }
    
    // If no SQL state code found, try to classify based on error message patterns
    return this.classifyByErrorMessage(error, journeyContext, operationContext);
  }

  /**
   * Extracts SQL state code from an error message if present.
   * 
   * @param errorMessage - The error message to parse
   * @returns The SQL state code if found, otherwise undefined
   */
    this.logger.debug(`Handling generic database error with context: ${error.message}`);
    
    // Extract SQL state code if present in the error message
    const sqlState = this.extractSqlStateCode(error.message);
    
    if (sqlState && this.sqlStateMappings[sqlState]) {
      return this.handleSqlStateError(error, sqlState, journeyContext, operationContext);
    }
    
    // If no SQL state code found, try to classify based on error message patterns
    return this.classifyByErrorMessage(error, journeyContext, operationContext);
  }

  /**
   * Extracts SQL state code from an error message if present.
   * 
   * @param errorMessage - The error message to parse
   * @returns The SQL state code if found, otherwise undefined
   */
  private extractSqlStateCode(errorMessage: string): string | undefined {
    // Common SQL state code patterns in error messages
    const patterns = [
      /\bSQL state\s*[=:]\s*([0-9A-Z]{5})\b/i,
      /\bSQLSTATE\s*[=:]\s*([0-9A-Z]{5})\b/i,
      /\berror\s*code\s*[=:]\s*([0-9A-Z]{5})\b/i,
      /\bstate\s*[=:]\s*([0-9A-Z]{5})\b/i,
      /\b([0-9A-Z]{5})\b(?=:)/i
    ];
    
    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
    
    return undefined;
  }

  /**
   * Handles an error with a known SQL state code.
   * 
   * @param error - The original database error
   * @param sqlState - The SQL state code
   * @param journeyContext - Optional journey context information
   * @param operationContext - Optional database operation context
   * @returns A specialized database exception
   */
  private handleSqlStateError(
    error: Error,
    sqlState: string,
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext
  ): DatabaseException {
    const mapping = this.sqlStateMappings[sqlState];
    const message = `${mapping.message} (SQL state: ${sqlState}): ${error.message}`;
    
    switch (mapping.errorType) {
      case 'connection':
        return new ConnectionException(
          message,
          mapping.errorCode,
          mapping.severity,
          mapping.recoverability,
          journeyContext,
          operationContext,
          'Check database availability, credentials, and network connectivity. Retry the operation after a brief delay.',
          error
        );
      
      case 'query':
        return new QueryException(
          message,
          mapping.errorCode,
          mapping.severity,
          mapping.recoverability,
          journeyContext,
          operationContext,
          'Check query syntax, parameters, and permissions. Ensure the operation is valid for the target entity.',
          error
        );
      
      case 'transaction':
        return new TransactionException(
          message,
          mapping.errorCode,
          mapping.severity,
          mapping.recoverability,
          journeyContext,
          operationContext,
          'Retry the transaction after a brief delay. If the issue persists, check for deadlocks or conflicting operations.',
          error
        );
      
      case 'integrity':
        return new IntegrityException(
          message,
          mapping.errorCode,
          mapping.severity,
          mapping.recoverability,
          journeyContext,
          operationContext,
          'Check the data for constraint violations. Ensure referential integrity and unique constraints are satisfied.',
          error
        );
      
      case 'configuration':
        return new ConfigurationException(
          message,
          mapping.errorCode,
          mapping.severity,
          mapping.recoverability,
          journeyContext,
          operationContext,
          'Check database configuration settings, connection strings, and environment variables. Ensure proper setup for the current environment.',
          error
        );
      
      default:
        return new DatabaseException(
          message,
          mapping.errorCode,
          mapping.severity,
          mapping.recoverability,
          journeyContext,
          operationContext,
          'Check the database operation and parameters. Consult the database logs for more details.',
          error
        );
    }
  }

  /**
   * Classifies an error based on patterns in the error message.
   * 
   * @param error - The original database error
   * @param journeyContext - Optional journey context information
   * @param operationContext - Optional database operation context
   * @returns A specialized database exception
   */
  private classifyByErrorMessage(
    error: Error,
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext
  ): DatabaseException {
    const errorMessage = error.message.toLowerCase();
    
    // Connection errors
    if (
      errorMessage.includes('connection') ||
      errorMessage.includes('connect') ||
      errorMessage.includes('socket') ||
      errorMessage.includes('network') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('econnreset') ||
      errorMessage.includes('etimedout') ||
      errorMessage.includes('protocol') ||
      errorMessage.includes('handshake')
    ) {
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return new ConnectionException(
          `Connection timeout: ${error.message}`,
          DB_CONN_PG_TIMEOUT,
          DatabaseErrorSeverity.CRITICAL,
          DatabaseErrorRecoverability.TRANSIENT,
          journeyContext,
          operationContext,
          'Check network connectivity and database server load. Retry the operation after a brief delay.',
          error
        );
      }
      
      if (
        errorMessage.includes('authentication') ||
        errorMessage.includes('auth') ||
        errorMessage.includes('password') ||
        errorMessage.includes('credential') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('access denied')
      ) {
        return new ConnectionException(
          `Authentication failed: ${error.message}`,
          DB_CONN_PG_REJECTED,
          DatabaseErrorSeverity.CRITICAL,
          DatabaseErrorRecoverability.PERMANENT,
          journeyContext,
          operationContext,
          'Check database credentials and permissions. Ensure the user has appropriate access rights.',
          error
        );
      }
      
      return new ConnectionException(
        `Connection failed: ${error.message}`,
        DB_CONN_PG_FAILED,
        DatabaseErrorSeverity.CRITICAL,
        DatabaseErrorRecoverability.TRANSIENT,
        journeyContext,
        operationContext,
        'Check database availability and network connectivity. Retry the operation after a brief delay.',
        error
      );
    }
    
    // Query errors
    if (
      errorMessage.includes('query') ||
      errorMessage.includes('sql') ||
      errorMessage.includes('syntax') ||
      errorMessage.includes('statement') ||
      errorMessage.includes('command') ||
      errorMessage.includes('invalid')
    ) {
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out') || errorMessage.includes('canceled')) {
        return new QueryException(
          `Query timeout: ${error.message}`,
          DB_QUERY_PG_TIMEOUT,
          DatabaseErrorSeverity.MAJOR,
          DatabaseErrorRecoverability.TRANSIENT,
          journeyContext,
          operationContext,
          'Optimize the query or increase the timeout setting. Consider adding appropriate indexes.',
          error
        );
      }
      
      return new QueryException(
        `Query error: ${error.message}`,
        DB_QUERY_PG_SYNTAX,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        journeyContext,
        operationContext,
        'Check query syntax and parameters. Ensure the operation is valid for the target entity.',
        error
      );
    }
    
    // Transaction errors
    if (
      errorMessage.includes('transaction') ||
      errorMessage.includes('deadlock') ||
      errorMessage.includes('serialization') ||
      errorMessage.includes('lock') ||
      errorMessage.includes('rollback')
    ) {
      return new TransactionException(
        `Transaction error: ${error.message}`,
        DB_TRANS_PG_DEADLOCK,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.TRANSIENT,
        journeyContext,
        operationContext,
        'Retry the transaction after a brief delay. If the issue persists, check for deadlocks or conflicting operations.',
        error
      );
    }
    
    // Integrity errors
    if (
      errorMessage.includes('constraint') ||
      errorMessage.includes('violation') ||
      errorMessage.includes('integrity') ||
      errorMessage.includes('duplicate') ||
      errorMessage.includes('unique') ||
      errorMessage.includes('foreign key') ||
      errorMessage.includes('not null') ||
      errorMessage.includes('check constraint')
    ) {
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
        return new IntegrityException(
          `Unique constraint violation: ${error.message}`,
          DB_INTEG_PG_UNIQUE,
          DatabaseErrorSeverity.MAJOR,
          DatabaseErrorRecoverability.PERMANENT,
          journeyContext,
          operationContext,
          'Check for duplicate values in unique fields. Ensure the operation does not create duplicate entries.',
          error
        );
      }
      
      if (errorMessage.includes('foreign key')) {
        return new IntegrityException(
          `Foreign key constraint violation: ${error.message}`,
          DB_INTEG_PG_FOREIGN_KEY,
          DatabaseErrorSeverity.MAJOR,
          DatabaseErrorRecoverability.PERMANENT,
          journeyContext,
          operationContext,
          'Ensure referenced records exist before creating or updating records with foreign key constraints.',
          error
        );
      }
      
      if (errorMessage.includes('not null')) {
        return new IntegrityException(
          `Not null constraint violation: ${error.message}`,
          DB_INTEG_PG_NOT_NULL,
          DatabaseErrorSeverity.MAJOR,
          DatabaseErrorRecoverability.PERMANENT,
          journeyContext,
          operationContext,
          'Ensure all required fields have values. Check for null values in non-nullable fields.',
          error
        );
      }
      
      return new IntegrityException(
        `Integrity constraint violation: ${error.message}`,
        DB_INTEG_PG_UNIQUE,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        journeyContext,
        operationContext,
        'Check the data for constraint violations. Ensure all database constraints are satisfied.',
        error
      );
    }
    
    // Configuration errors
    if (
      errorMessage.includes('configuration') ||
      errorMessage.includes('config') ||
      errorMessage.includes('setting') ||
      errorMessage.includes('environment') ||
      errorMessage.includes('setup') ||
      errorMessage.includes('invalid url') ||
      errorMessage.includes('invalid connection')
    ) {
      return new ConfigurationException(
        `Configuration error: ${error.message}`,
        DB_CONFIG_PG_INVALID_URL,
        DatabaseErrorSeverity.CRITICAL,
        DatabaseErrorRecoverability.PERMANENT,
        journeyContext,
        operationContext,
        'Check database configuration settings, connection strings, and environment variables. Ensure proper setup for the current environment.',
        error
      );
    }
    
    // Resource errors
    if (
      errorMessage.includes('resource') ||
      errorMessage.includes('memory') ||
      errorMessage.includes('disk') ||
      errorMessage.includes('space') ||
      errorMessage.includes('capacity') ||
      errorMessage.includes('limit') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('exceeded')
    ) {
      return new ConfigurationException(
        `Resource limit exceeded: ${error.message}`,
        DB_QUERY_PG_RESOURCE_LIMIT,
        DatabaseErrorSeverity.CRITICAL,
        DatabaseErrorRecoverability.TRANSIENT,
        journeyContext,
        operationContext,
        'Check system resources and database limits. Consider optimizing queries or increasing resource allocation.',
        error
      );
    }
    
    // Default fallback for unrecognized errors
    return new DatabaseException(
      `Database error: ${error.message}`,
      DB_QUERY_PG_SYNTAX, // Default to query error code
      DatabaseErrorSeverity.MAJOR,
      DatabaseErrorRecoverability.PERMANENT,
      journeyContext,
      operationContext,
      'Check the database operation and parameters. Consult the database logs for more details.',
      error
    );
  }

  /**
   * Determines if an error is likely to be transient and can be retried.
   * 
   * @param error - The error to check
   * @returns True if the error is likely transient and can be retried
   */
  public isTransientError(error: Error): boolean {
    // Extract SQL state code if present
    const sqlState = this.extractSqlStateCode(error.message);
    
    if (sqlState && this.sqlStateMappings[sqlState]) {
      return this.sqlStateMappings[sqlState].recoverability === DatabaseErrorRecoverability.TRANSIENT;
    }
    
    // Check error message patterns for transient errors
    const errorMessage = error.message.toLowerCase();
    
    return (
      // Connection issues
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('timed out') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('econnreset') ||
      errorMessage.includes('etimedout') ||
      
      // Transaction issues
      errorMessage.includes('deadlock') ||
      errorMessage.includes('serialization') ||
      errorMessage.includes('lock timeout') ||
      errorMessage.includes('rollback') ||
      
      // Resource issues
      errorMessage.includes('resource') ||
      errorMessage.includes('memory') ||
      errorMessage.includes('disk') ||
      errorMessage.includes('capacity') ||
      errorMessage.includes('limit exceeded') ||
      
      // Server issues
      errorMessage.includes('server') ||
      errorMessage.includes('shutdown') ||
      errorMessage.includes('restart') ||
      errorMessage.includes('maintenance')
    );
  }

  /**
   * Gets the recommended retry delay for a transient error.
   * 
   * @param error - The error to check
   * @param attempt - The current retry attempt (1-based)
   * @returns The recommended delay in milliseconds before retrying
   */
  public getRetryDelayMs(error: Error, attempt: number): number {
    // Base delay of 100ms
    const baseDelay = 100;
    
    // Maximum delay of 30 seconds
    const maxDelay = 30000;
    
    // Calculate exponential backoff with jitter
    const exponentialDelay = Math.min(
      maxDelay,
      baseDelay * Math.pow(2, attempt - 1)
    );
    
    // Add jitter (±20%)
    const jitter = 0.2;
    const randomFactor = 1 - jitter + (Math.random() * jitter * 2);
    
    return Math.floor(exponentialDelay * randomFactor);
  }

  /**
   * Gets the maximum number of retry attempts for a transient error.
   * 
   * @param error - The error to check
   * @returns The maximum number of retry attempts
   */
  public getMaxRetryAttempts(error: Error): number {
    const errorMessage = error.message.toLowerCase();
    
    // Connection issues get more retries
    if (
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('timed out') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('econnreset') ||
      errorMessage.includes('etimedout')
    ) {
      return 5;
    }
    
    // Transaction issues get moderate retries
    if (
      errorMessage.includes('deadlock') ||
      errorMessage.includes('serialization') ||
      errorMessage.includes('lock timeout') ||
      errorMessage.includes('rollback')
    ) {
      return 3;
    }
    
    // Resource issues get fewer retries
    if (
      errorMessage.includes('resource') ||
      errorMessage.includes('memory') ||
      errorMessage.includes('disk') ||
      errorMessage.includes('capacity') ||
      errorMessage.includes('limit exceeded')
    ) {
      return 2;
    }
    
    // Default to 3 retries for other transient errors
    return 3;
  }

  /**
   * Enriches an error with journey-specific context.
   * 
   * @param error - The error to enrich
   * @param journey - The journey where the error occurred
   * @param feature - The specific feature within the journey
   * @param userId - Optional user ID associated with the operation
   * @param additionalContext - Additional context information
   * @returns The error with enriched context
   */
  public enrichWithJourneyContext(
    error: Error,
    journey: 'health' | 'care' | 'plan' | 'gamification' | 'notification' | 'auth',
    feature: string,
    userId?: string,
    additionalContext: Record<string, any> = {}
  ): Error {
    const journeyContext: JourneyContext = {
      journey,
      feature,
      userId,
      ...additionalContext
    };
    
    (error as any).journeyContext = journeyContext;
    return error;
  }

  /**
   * Enriches an error with database operation context.
   * 
   * @param error - The error to enrich
   * @param operation - The type of operation being performed
   * @param entity - The target entity or table name
   * @param query - The query or command being executed
   * @param params - Parameters used in the query
   * @returns The error with enriched context
   */
  public enrichWithOperationContext(
    error: Error,
    operation: string,
    entity: string,
    query?: string,
    params?: Record<string, any>
  ): Error {
    const operationContext: DatabaseOperationContext = {
      operation,
      entity,
      query,
      params
    };
    
    (error as any).operationContext = operationContext;
    return error;
  }
}