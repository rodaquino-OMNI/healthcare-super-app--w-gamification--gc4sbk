/**
 * @file prisma-error.handler.ts
 * @description Specialized error handler for Prisma ORM exceptions in PostgreSQL database operations.
 * Analyzes Prisma-specific error codes and properties to classify errors and transform them into
 * standardized DatabaseException types with appropriate error codes and recovery strategies.
 */

import { Injectable, Logger } from '@nestjs/common';
import { 
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError
} from '@prisma/client/runtime/library';

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
  DatabaseErrorRecoverability,
  JourneyContext,
  ClassifiedDatabaseError,
  DatabaseErrorMetadata
} from '../database-error.types';

import * as ErrorCodes from '../database-error.codes';
import { RetryContext, DatabaseOperationType, RetryStrategyFactory } from '../retry-strategies';

/**
 * Interface for Prisma error context information
 * Provides additional details about the Prisma error for better classification and handling
 */
interface PrismaErrorContext {
  /** The Prisma error code (e.g., P1000, P2002) */
  code?: string;
  
  /** The client version that generated the error */
  clientVersion?: string;
  
  /** Additional metadata from the Prisma error */
  meta?: Record<string, any>;
  
  /** The original error message */
  message: string;
  
  /** The original error object */
  originalError: Error;
  
  /** The database operation being performed when the error occurred */
  operation?: string;
  
  /** The database entity involved in the error */
  entity?: string;
  
  /** The journey context in which the error occurred */
  journey?: JourneyContext;
}

/**
 * Specialized error handler for Prisma ORM exceptions in PostgreSQL database operations.
 * Analyzes Prisma-specific error codes and properties to classify errors and transform them
 * into standardized DatabaseException types with appropriate error codes and recovery strategies.
 */
@Injectable()
export class PrismaErrorHandler {
  private readonly logger = new Logger(PrismaErrorHandler.name);
  
  constructor(private readonly retryStrategyFactory: RetryStrategyFactory) {}

  /**
   * Handles a Prisma error by classifying it and transforming it into a standardized DatabaseException
   * 
   * @param error The Prisma error to handle
   * @param context Additional context about the error
   * @returns A standardized DatabaseException
   */
  public handleError(error: Error, context?: Partial<PrismaErrorContext>): DatabaseException {
    // Combine provided context with extracted context from the error
    const errorContext = this.extractErrorContext(error, context);
    
    // Classify the error based on its code and properties
    const classifiedError = this.classifyError(errorContext);
    
    // Transform the classified error into a standardized DatabaseException
    return this.transformError(classifiedError, errorContext);
  }

  /**
   * Extracts context information from a Prisma error
   * 
   * @param error The Prisma error
   * @param additionalContext Additional context provided by the caller
   * @returns Combined error context
   */
  private extractErrorContext(error: Error, additionalContext?: Partial<PrismaErrorContext>): PrismaErrorContext {
    let errorContext: PrismaErrorContext = {
      message: error.message,
      originalError: error,
      ...additionalContext
    };

    // Extract information from PrismaClientKnownRequestError
    if (error instanceof PrismaClientKnownRequestError) {
      errorContext = {
        ...errorContext,
        code: error.code,
        clientVersion: error.clientVersion,
        meta: error.meta
      };
    }
    // Extract information from PrismaClientUnknownRequestError
    else if (error instanceof PrismaClientUnknownRequestError) {
      errorContext = {
        ...errorContext,
        clientVersion: error.clientVersion
      };
    }
    // Extract information from PrismaClientRustPanicError
    else if (error instanceof PrismaClientRustPanicError) {
      errorContext = {
        ...errorContext,
        clientVersion: error.clientVersion
      };
    }
    // Extract information from PrismaClientInitializationError
    else if (error instanceof PrismaClientInitializationError) {
      errorContext = {
        ...errorContext,
        clientVersion: error.clientVersion
      };
    }
    // Extract information from PrismaClientValidationError
    else if (error instanceof PrismaClientValidationError) {
      // Validation errors don't have additional properties to extract
    }

    return errorContext;
  }

  /**
   * Classifies a Prisma error based on its code and properties
   * 
   * @param errorContext The Prisma error context
   * @returns Classified database error
   */
  private classifyError(errorContext: PrismaErrorContext): ClassifiedDatabaseError {
    const { code, message, meta, journey } = errorContext;
    
    // Default classification
    let classification: ClassifiedDatabaseError = {
      type: DatabaseErrorType.UNKNOWN,
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverability: DatabaseErrorRecoverability.UNKNOWN,
      message: message,
      code: code,
      journeyContext: {
        journey: journey || JourneyContext.NONE,
        feature: errorContext.entity,
        userVisible: false
      },
      metadata: {
        originalError: errorContext.originalError,
        operation: errorContext.operation,
        entity: errorContext.entity,
        additionalData: meta,
        timestamp: new Date()
      }
    };

    // Classify based on error code
    if (code) {
      // P1xxx: Query Engine errors (connection, initialization)
      if (code.startsWith('P1')) {
        classification = this.classifyQueryEngineError(code, classification, errorContext);
      }
      // P2xxx: Prisma Client errors (constraints, query execution)
      else if (code.startsWith('P2')) {
        classification = this.classifyClientError(code, classification, errorContext);
      }
      // P3xxx: Schema/Migration errors
      else if (code.startsWith('P3')) {
        classification = this.classifySchemaError(code, classification, errorContext);
      }
    } 
    // Classify based on error message for errors without codes
    else {
      classification = this.classifyByErrorMessage(message, classification, errorContext);
    }

    return classification;
  }

  /**
   * Classifies Query Engine errors (P1xxx)
   * 
   * @param code The error code
   * @param classification The current classification
   * @param errorContext The error context
   * @returns Updated classification
   */
  private classifyQueryEngineError(
    code: string, 
    classification: ClassifiedDatabaseError,
    errorContext: PrismaErrorContext
  ): ClassifiedDatabaseError {
    switch (code) {
      // Authentication errors
      case 'P1000': // Authentication failed
      case 'P1001': // Can't reach database server
      case 'P1002': // Database server connection timed out
        return {
          ...classification,
          type: DatabaseErrorType.CONNECTION_FAILED,
          severity: DatabaseErrorSeverity.HIGH,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_CONN_AUTH_FAILED
        };
      
      // Connection errors
      case 'P1003': // Database does not exist
      case 'P1010': // Database connection error
        return {
          ...classification,
          type: DatabaseErrorType.CONNECTION_FAILED,
          severity: DatabaseErrorSeverity.HIGH,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_CONN_FAILED
        };
      
      // Timeout errors
      case 'P1008': // Operations timed out
      case 'P1012': // Connection timed out
        return {
          ...classification,
          type: DatabaseErrorType.CONNECTION_TIMEOUT,
          severity: DatabaseErrorSeverity.MEDIUM,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_CONN_TIMEOUT
        };
      
      // Schema errors
      case 'P1009': // Database already exists
      case 'P1011': // Error in schema definition
        return {
          ...classification,
          type: DatabaseErrorType.SCHEMA_MISMATCH,
          severity: DatabaseErrorSeverity.HIGH,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: ErrorCodes.DB_CONFIG_INVALID_SCHEMA
        };
      
      // Default for other P1xxx errors
      default:
        return {
          ...classification,
          type: DatabaseErrorType.CONNECTION_FAILED,
          severity: DatabaseErrorSeverity.MEDIUM,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_CONN_FAILED
        };
    }
  }

  /**
   * Classifies Prisma Client errors (P2xxx)
   * 
   * @param code The error code
   * @param classification The current classification
   * @param errorContext The error context
   * @returns Updated classification
   */
  private classifyClientError(
    code: string, 
    classification: ClassifiedDatabaseError,
    errorContext: PrismaErrorContext
  ): ClassifiedDatabaseError {
    switch (code) {
      // Data validation errors
      case 'P2000': // Value too long for column type
      case 'P2005': // Value invalid for column type
      case 'P2006': // Invalid value provided
      case 'P2007': // Data validation error
      case 'P2011': // Null constraint violation
      case 'P2012': // Missing required value
        return {
          ...classification,
          type: DatabaseErrorType.DATA_VALIDATION_FAILED,
          severity: DatabaseErrorSeverity.MEDIUM,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: ErrorCodes.DB_INTEGRITY_INVALID_DATA_TYPE
        };
      
      // Constraint violations
      case 'P2002': // Unique constraint violation
        return {
          ...classification,
          type: DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION,
          severity: DatabaseErrorSeverity.MEDIUM,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: ErrorCodes.DB_INTEGRITY_UNIQUE_VIOLATION
        };
      
      case 'P2003': // Foreign key constraint violation
        return {
          ...classification,
          type: DatabaseErrorType.FOREIGN_KEY_CONSTRAINT_VIOLATION,
          severity: DatabaseErrorSeverity.MEDIUM,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: ErrorCodes.DB_INTEGRITY_FOREIGN_KEY_VIOLATION
        };
      
      case 'P2004': // Constraint violation
        return {
          ...classification,
          type: DatabaseErrorType.CHECK_CONSTRAINT_VIOLATION,
          severity: DatabaseErrorSeverity.MEDIUM,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: ErrorCodes.DB_INTEGRITY_CHECK_VIOLATION
        };
      
      // Record not found
      case 'P2001': // Record not found
      case 'P2018': // Record required but not found
      case 'P2025': // Record not found
        return {
          ...classification,
          type: DatabaseErrorType.QUERY_RESULT_ERROR,
          severity: DatabaseErrorSeverity.LOW,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: ErrorCodes.DB_QUERY_RESOURCE_NOT_FOUND
        };
      
      // Query syntax errors
      case 'P2009': // Query validation failed
      case 'P2010': // Raw query failed
      case 'P2014': // Invalid query
      case 'P2015': // Group by required
      case 'P2016': // Query interpretation error
      case 'P2017': // Relation does not exist
        return {
          ...classification,
          type: DatabaseErrorType.QUERY_SYNTAX,
          severity: DatabaseErrorSeverity.MEDIUM,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: ErrorCodes.DB_QUERY_SYNTAX_ERROR
        };
      
      // Transaction errors
      case 'P2028': // Transaction API error
      case 'P2029': // Transaction failed
      case 'P2034': // Transaction already in progress
        return {
          ...classification,
          type: DatabaseErrorType.TRANSACTION_COMMIT_FAILED,
          severity: DatabaseErrorSeverity.HIGH,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: ErrorCodes.DB_TRANS_COMMIT_FAILED
        };
      
      // Default for other P2xxx errors
      default:
        return {
          ...classification,
          type: DatabaseErrorType.QUERY_EXECUTION_FAILED,
          severity: DatabaseErrorSeverity.MEDIUM,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: ErrorCodes.DB_QUERY_EXECUTION_FAILED
        };
    }
  }

  /**
   * Classifies Schema/Migration errors (P3xxx)
   * 
   * @param code The error code
   * @param classification The current classification
   * @param errorContext The error context
   * @returns Updated classification
   */
  private classifySchemaError(
    code: string, 
    classification: ClassifiedDatabaseError,
    errorContext: PrismaErrorContext
  ): ClassifiedDatabaseError {
    switch (code) {
      // Migration errors
      case 'P3000': // Failed to create database
      case 'P3001': // Migration possible with destructive changes
      case 'P3002': // Migration failed
      case 'P3003': // Migration format error
      case 'P3004': // Migration not found
      case 'P3005': // Migration applied failed
        return {
          ...classification,
          type: DatabaseErrorType.MIGRATION_FAILED,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: ErrorCodes.DB_CONFIG_MIGRATION_FAILED
        };
      
      // Schema errors
      case 'P3006': // Migration provider error
      case 'P3007': // Preview feature error
      case 'P3008': // Schema parse error
      case 'P3009': // Schema validation error
      case 'P3010': // Schema not empty
      case 'P3011': // Schema missing
      case 'P3012': // Schema empty
      case 'P3013': // Schema drift detected
      case 'P3014': // Prisma schema validation error
      case 'P3015': // Schema not found
        return {
          ...classification,
          type: DatabaseErrorType.SCHEMA_MISMATCH,
          severity: DatabaseErrorSeverity.HIGH,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: ErrorCodes.DB_CONFIG_INVALID_SCHEMA
        };
      
      // Default for other P3xxx errors
      default:
        return {
          ...classification,
          type: DatabaseErrorType.INVALID_CONFIGURATION,
          severity: DatabaseErrorSeverity.HIGH,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: ErrorCodes.DB_CONFIG_INVALID_SCHEMA
        };
    }
  }

  /**
   * Classifies errors based on error message for errors without codes
   * 
   * @param message The error message
   * @param classification The current classification
   * @param errorContext The error context
   * @returns Updated classification
   */
  private classifyByErrorMessage(
    message: string, 
    classification: ClassifiedDatabaseError,
    errorContext: PrismaErrorContext
  ): ClassifiedDatabaseError {
    const lowerMessage = message.toLowerCase();
    
    // Connection errors
    if (
      lowerMessage.includes('connection') && 
      (lowerMessage.includes('refused') || 
       lowerMessage.includes('closed') || 
       lowerMessage.includes('terminated') || 
       lowerMessage.includes('lost'))
    ) {
      return {
        ...classification,
        type: DatabaseErrorType.CONNECTION_FAILED,
        severity: DatabaseErrorSeverity.HIGH,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_CONN_FAILED
      };
    }
    
    // Timeout errors
    if (
      lowerMessage.includes('timeout') || 
      lowerMessage.includes('timed out')
    ) {
      return {
        ...classification,
        type: DatabaseErrorType.CONNECTION_TIMEOUT,
        severity: DatabaseErrorSeverity.MEDIUM,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_CONN_TIMEOUT
      };
    }
    
    // Authentication errors
    if (
      lowerMessage.includes('authentication') || 
      lowerMessage.includes('password') || 
      lowerMessage.includes('permission') || 
      lowerMessage.includes('access denied')
    ) {
      return {
        ...classification,
        type: DatabaseErrorType.CONNECTION_FAILED,
        severity: DatabaseErrorSeverity.HIGH,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_CONN_AUTH_FAILED
      };
    }
    
    // Transaction errors
    if (
      lowerMessage.includes('transaction') || 
      lowerMessage.includes('deadlock') || 
      lowerMessage.includes('serialization')
    ) {
      return {
        ...classification,
        type: DatabaseErrorType.TRANSACTION_DEADLOCK,
        severity: DatabaseErrorSeverity.HIGH,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_TRANS_DEADLOCK
      };
    }
    
    // Constraint errors
    if (
      lowerMessage.includes('constraint') || 
      lowerMessage.includes('unique') || 
      lowerMessage.includes('duplicate') || 
      lowerMessage.includes('foreign key')
    ) {
      return {
        ...classification,
        type: DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION,
        severity: DatabaseErrorSeverity.MEDIUM,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_INTEGRITY_UNIQUE_VIOLATION
      };
    }
    
    // Query errors
    if (
      lowerMessage.includes('query') || 
      lowerMessage.includes('syntax') || 
      lowerMessage.includes('invalid')
    ) {
      return {
        ...classification,
        type: DatabaseErrorType.QUERY_SYNTAX,
        severity: DatabaseErrorSeverity.MEDIUM,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_QUERY_SYNTAX_ERROR
      };
    }
    
    // Default classification for unknown errors
    return classification;
  }

  /**
   * Transforms a classified error into a standardized DatabaseException
   * 
   * @param classifiedError The classified error
   * @param errorContext The error context
   * @returns A standardized DatabaseException
   */
  private transformError(
    classifiedError: ClassifiedDatabaseError,
    errorContext: PrismaErrorContext
  ): DatabaseException {
    const { type, severity, recoverability, message, code, journeyContext, metadata } = classifiedError;
    
    // Create base context for the exception
    const exceptionContext: Partial<DatabaseErrorContext> = {
      severity: this.mapSeverity(severity),
      recoverable: recoverability === DatabaseErrorRecoverability.TRANSIENT,
      journey: this.mapJourneyContext(journeyContext.journey),
      operation: metadata?.operation,
      entity: metadata?.entity,
      technicalDetails: {
        originalError: errorContext.originalError.message,
        errorType: errorContext.originalError.constructor.name,
        prismaCode: errorContext.code,
        prismaClientVersion: errorContext.clientVersion,
        prismaMeta: errorContext.meta,
        timestamp: new Date().toISOString()
      }
    };
    
    // Add recovery suggestions based on error type
    exceptionContext.recoverySuggestions = this.getRecoverySuggestions(type, errorContext);
    
    // Create the appropriate exception type based on the error type
    switch (type) {
      case DatabaseErrorType.CONNECTION_FAILED:
      case DatabaseErrorType.CONNECTION_TIMEOUT:
      case DatabaseErrorType.CONNECTION_LIMIT_REACHED:
      case DatabaseErrorType.CONNECTION_CLOSED:
        return new ConnectionException(message, exceptionContext, errorContext.originalError);
      
      case DatabaseErrorType.QUERY_SYNTAX:
      case DatabaseErrorType.QUERY_TIMEOUT:
      case DatabaseErrorType.QUERY_EXECUTION_FAILED:
      case DatabaseErrorType.QUERY_RESULT_ERROR:
        return new QueryException(message, exceptionContext, errorContext.originalError);
      
      case DatabaseErrorType.TRANSACTION_BEGIN_FAILED:
      case DatabaseErrorType.TRANSACTION_COMMIT_FAILED:
      case DatabaseErrorType.TRANSACTION_ROLLBACK_FAILED:
      case DatabaseErrorType.TRANSACTION_TIMEOUT:
      case DatabaseErrorType.TRANSACTION_DEADLOCK:
        return new TransactionException(message, exceptionContext, errorContext.originalError);
      
      case DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION:
      case DatabaseErrorType.FOREIGN_KEY_CONSTRAINT_VIOLATION:
      case DatabaseErrorType.CHECK_CONSTRAINT_VIOLATION:
      case DatabaseErrorType.NOT_NULL_CONSTRAINT_VIOLATION:
      case DatabaseErrorType.DATA_VALIDATION_FAILED:
        return new IntegrityException(message, exceptionContext, errorContext.originalError);
      
      case DatabaseErrorType.INVALID_CONFIGURATION:
      case DatabaseErrorType.MISSING_CONFIGURATION:
      case DatabaseErrorType.SCHEMA_MISMATCH:
      case DatabaseErrorType.MIGRATION_FAILED:
        return new ConfigurationException(message, exceptionContext, errorContext.originalError);
      
      default:
        return new DatabaseException(message, code || 'DB_UNKNOWN_ERROR', exceptionContext, errorContext.originalError);
    }
  }

  /**
   * Maps severity from ClassifiedDatabaseError to DatabaseErrorSeverity
   * 
   * @param severity The severity from ClassifiedDatabaseError
   * @returns The corresponding DatabaseErrorSeverity
   */
  private mapSeverity(severity: DatabaseErrorSeverity): DatabaseErrorSeverity {
    switch (severity) {
      case DatabaseErrorSeverity.CRITICAL:
        return DatabaseErrorSeverity.CRITICAL;
      case DatabaseErrorSeverity.HIGH:
        return DatabaseErrorSeverity.HIGH;
      case DatabaseErrorSeverity.MEDIUM:
        return DatabaseErrorSeverity.MEDIUM;
      case DatabaseErrorSeverity.LOW:
        return DatabaseErrorSeverity.LOW;
      default:
        return DatabaseErrorSeverity.MEDIUM;
    }
  }

  /**
   * Maps JourneyContext to journey string for DatabaseErrorContext
   * 
   * @param journeyContext The JourneyContext
   * @returns The corresponding journey string
   */
  private mapJourneyContext(journeyContext: JourneyContext): 'health' | 'care' | 'plan' | 'gamification' | 'common' {
    switch (journeyContext) {
      case JourneyContext.HEALTH:
        return 'health';
      case JourneyContext.CARE:
        return 'care';
      case JourneyContext.PLAN:
        return 'plan';
      case JourneyContext.GAMIFICATION:
        return 'gamification';
      case JourneyContext.AUTH:
      case JourneyContext.NOTIFICATION:
      case JourneyContext.NONE:
      default:
        return 'common';
    }
  }

  /**
   * Gets recovery suggestions based on error type and context
   * 
   * @param errorType The type of error
   * @param errorContext The error context
   * @returns Array of recovery suggestions
   */
  private getRecoverySuggestions(errorType: DatabaseErrorType, errorContext: PrismaErrorContext): string[] {
    switch (errorType) {
      case DatabaseErrorType.CONNECTION_FAILED:
      case DatabaseErrorType.CONNECTION_TIMEOUT:
      case DatabaseErrorType.CONNECTION_LIMIT_REACHED:
      case DatabaseErrorType.CONNECTION_CLOSED:
        return [
          'Check database server status and network connectivity',
          'Verify database connection configuration (host, port, credentials)',
          'Ensure database service is running and accessible',
          'Check for firewall or security group restrictions',
          'Verify connection pool settings and limits'
        ];
      
      case DatabaseErrorType.QUERY_SYNTAX:
      case DatabaseErrorType.QUERY_EXECUTION_FAILED:
        return [
          'Check query syntax for errors',
          'Verify that referenced tables and columns exist',
          'Ensure proper data types are being used',
          'Check for query timeout or resource limitations',
          'Verify database permissions for the operation'
        ];
      
      case DatabaseErrorType.TRANSACTION_DEADLOCK:
      case DatabaseErrorType.TRANSACTION_TIMEOUT:
        return [
          'Check for deadlocks or lock timeouts',
          'Verify transaction isolation level is appropriate',
          'Ensure proper error handling within transactions',
          'Consider breaking large transactions into smaller ones',
          'Check for connection issues during transaction execution'
        ];
      
      case DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION:
        return [
          'Check for duplicate key violations',
          'Verify that the data being inserted or updated is unique',
          'Consider using upsert operations instead of insert/update',
          'Implement application-level validation before database operations',
          `Check if the constraint is on columns: ${this.extractConstraintColumns(errorContext)}`
        ];
      
      case DatabaseErrorType.FOREIGN_KEY_CONSTRAINT_VIOLATION:
        return [
          'Verify foreign key references exist',
          'Ensure the referenced record exists before creating the dependent record',
          'Check for cascading operations that might affect references',
          'Verify the order of operations when creating related records',
          `Check if the constraint is on columns: ${this.extractConstraintColumns(errorContext)}`
        ];
      
      case DatabaseErrorType.SCHEMA_MISMATCH:
      case DatabaseErrorType.MIGRATION_FAILED:
        return [
          'Verify database schema matches expected configuration',
          'Check Prisma schema and connection settings',
          'Ensure migrations have been applied correctly',
          'Check for schema drift between environments',
          'Verify that the database user has permissions to modify the schema'
        ];
      
      default:
        return [
          'Check database logs for more detailed error information',
          'Verify application configuration for database access',
          'Ensure proper error handling in application code',
          'Check for recent changes that might have affected database operations',
          'Consider retrying the operation with exponential backoff'
        ];
    }
  }

  /**
   * Extracts constraint columns from error context for better error messages
   * 
   * @param errorContext The error context
   * @returns String representation of constraint columns
   */
  private extractConstraintColumns(errorContext: PrismaErrorContext): string {
    if (!errorContext.meta) {
      return 'unknown';
    }

    // Extract constraint information from meta
    const { target, constraint, field_name, column_name } = errorContext.meta;
    
    if (Array.isArray(target) && target.length > 0) {
      return target.join(', ');
    }
    
    if (constraint) {
      return String(constraint);
    }
    
    if (field_name) {
      return String(field_name);
    }
    
    if (column_name) {
      return String(column_name);
    }
    
    return 'unknown';
  }

  /**
   * Determines if an error is retryable based on its classification
   * 
   * @param error The error to check
   * @param context Additional context about the error
   * @returns True if the error is retryable, false otherwise
   */
  public isRetryableError(error: Error, context?: Partial<PrismaErrorContext>): boolean {
    const errorContext = this.extractErrorContext(error, context);
    const classifiedError = this.classifyError(errorContext);
    
    return classifiedError.recoverability === DatabaseErrorRecoverability.TRANSIENT;
  }

  /**
   * Creates a retry context for the error
   * 
   * @param error The error that occurred
   * @param attemptsMade The number of retry attempts made so far
   * @param firstAttemptTime The time of the first attempt
   * @param context Additional context about the error
   * @returns A retry context for the error
   */
  public createRetryContext(
    error: Error, 
    attemptsMade: number, 
    firstAttemptTime: Date,
    context?: Partial<PrismaErrorContext>
  ): RetryContext {
    const errorContext = this.extractErrorContext(error, context);
    const classifiedError = this.classifyError(errorContext);
    
    // Determine operation type based on error type
    let operationType: DatabaseOperationType;
    switch (classifiedError.type) {
      case DatabaseErrorType.CONNECTION_FAILED:
      case DatabaseErrorType.CONNECTION_TIMEOUT:
      case DatabaseErrorType.CONNECTION_LIMIT_REACHED:
      case DatabaseErrorType.CONNECTION_CLOSED:
        operationType = DatabaseOperationType.CONNECTION;
        break;
      
      case DatabaseErrorType.TRANSACTION_BEGIN_FAILED:
      case DatabaseErrorType.TRANSACTION_COMMIT_FAILED:
      case DatabaseErrorType.TRANSACTION_ROLLBACK_FAILED:
      case DatabaseErrorType.TRANSACTION_TIMEOUT:
      case DatabaseErrorType.TRANSACTION_DEADLOCK:
        operationType = DatabaseOperationType.TRANSACTION;
        break;
      
      case DatabaseErrorType.SCHEMA_MISMATCH:
      case DatabaseErrorType.MIGRATION_FAILED:
        operationType = DatabaseOperationType.MIGRATION;
        break;
      
      default:
        // Determine if it's a read or write operation based on context
        operationType = this.isReadOperation(errorContext) ? 
          DatabaseOperationType.READ : 
          DatabaseOperationType.WRITE;
    }
    
    return {
      operationType,
      journeyContext: this.getJourneyContextEnum(errorContext.journey),
      attemptsMade,
      error,
      firstAttemptTime,
      metadata: {
        prismaCode: errorContext.code,
        prismaClientVersion: errorContext.clientVersion,
        entity: errorContext.entity,
        operation: errorContext.operation
      }
    };
  }

  /**
   * Determines if an operation is a read operation based on context
   * 
   * @param errorContext The error context
   * @returns True if it's a read operation, false otherwise
   */
  private isReadOperation(errorContext: PrismaErrorContext): boolean {
    if (!errorContext.operation) {
      return false;
    }
    
    const operation = errorContext.operation.toLowerCase();
    return (
      operation.includes('find') || 
      operation.includes('get') || 
      operation.includes('query') || 
      operation.includes('select') || 
      operation.includes('count')
    );
  }

  /**
   * Gets the JourneyContext enum value from the journey string
   * 
   * @param journey The journey string
   * @returns The corresponding JourneyContext enum value
   */
  private getJourneyContextEnum(journey?: JourneyContext): JourneyContext {
    if (journey) {
      return journey;
    }
    
    return JourneyContext.NONE;
  }

  /**
   * Enriches an error with additional context information
   * 
   * @param error The error to enrich
   * @param context Additional context to add
   * @returns The enriched error
   */
  public enrichError(error: Error, context: Partial<PrismaErrorContext>): Error {
    if (error instanceof DatabaseException) {
      // If it's already a DatabaseException, update its context
      const updatedContext: Partial<DatabaseErrorContext> = {
        ...error.context,
        operation: context.operation || error.context.operation,
        entity: context.entity || error.context.entity,
        journey: this.mapJourneyContext(context.journey as JourneyContext) || error.context.journey,
        technicalDetails: {
          ...error.context.technicalDetails,
          ...context.meta
        }
      };
      
      // Create a new exception of the same type with updated context
      if (error instanceof ConnectionException) {
        return new ConnectionException(error.message, updatedContext, error.cause as Error);
      } else if (error instanceof QueryException) {
        return new QueryException(error.message, updatedContext, error.cause as Error);
      } else if (error instanceof TransactionException) {
        return new TransactionException(error.message, updatedContext, error.cause as Error);
      } else if (error instanceof IntegrityException) {
        return new IntegrityException(error.message, updatedContext, error.cause as Error);
      } else if (error instanceof ConfigurationException) {
        return new ConfigurationException(error.message, updatedContext, error.cause as Error);
      } else {
        return new DatabaseException(error.message, error.code, updatedContext, error.cause as Error);
      }
    } else {
      // If it's not a DatabaseException, handle it as a new error
      return this.handleError(error, context);
    }
  }

  /**
   * Gets the appropriate retry strategy for an error
   * 
   * @param error The error to get a retry strategy for
   * @param context Additional context about the error
   * @returns The retry strategy to use
   */
  public getRetryStrategy(error: Error, context?: Partial<PrismaErrorContext>): RetryContext {
    const retryContext = this.createRetryContext(error, 0, new Date(), context);
    return retryContext;
  }

  /**
   * Handles a Prisma error with retry logic
   * 
   * @param error The Prisma error to handle
   * @param context Additional context about the error
   * @param maxRetries Maximum number of retry attempts
   * @returns A promise that resolves when the error is handled or all retries are exhausted
   */
  public async handleErrorWithRetry<T>(
    error: Error, 
    operation: () => Promise<T>,
    context?: Partial<PrismaErrorContext>,
    maxRetries: number = 3
  ): Promise<T> {
    let attemptsMade = 0;
    const firstAttemptTime = new Date();
    let lastError = error;
    
    while (attemptsMade < maxRetries) {
      try {
        // Create retry context
        const retryContext = this.createRetryContext(
          lastError, 
          attemptsMade, 
          firstAttemptTime, 
          context
        );
        
        // Get retry strategy
        const retryStrategy = this.retryStrategyFactory.createStrategy(retryContext);
        
        // Check if we should retry
        if (!retryStrategy.shouldRetry(retryContext)) {
          this.logger.debug(
            `Not retrying operation: retry strategy ${retryStrategy.getName()} declined`,
            { context: retryContext }
          );
          break;
        }
        
        // Get delay before next retry
        const delay = retryStrategy.getNextRetryDelay(retryContext);
        
        this.logger.debug(
          `Retrying operation after ${delay}ms (attempt ${attemptsMade + 1}/${maxRetries})`,
          { context: retryContext }
        );
        
        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the operation
        const result = await operation();
        
        // Record success
        this.retryStrategyFactory.recordSuccess(retryContext);
        
        return result;
      } catch (retryError) {
        // Update last error and attempt count
        lastError = retryError as Error;
        attemptsMade++;
        
        // Record failure
        const retryContext = this.createRetryContext(
          lastError, 
          attemptsMade, 
          firstAttemptTime, 
          context
        );
        this.retryStrategyFactory.recordFailure(retryContext);
        
        // If we've reached max retries, give up
        if (attemptsMade >= maxRetries) {
          this.logger.warn(
            `Max retries (${maxRetries}) reached, giving up`,
            { error: lastError.message, attempts: attemptsMade }
          );
          break;
        }
      }
    }
    
    // If we get here, all retries failed or we decided not to retry
    // Transform the error into a standardized DatabaseException
    throw this.handleError(lastError, context);
  }
}