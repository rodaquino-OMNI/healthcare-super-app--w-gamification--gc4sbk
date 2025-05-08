/**
 * Prisma Error Handler
 * 
 * @file Specialized error handler for Prisma ORM exceptions in PostgreSQL database operations.
 * @description This handler analyzes Prisma-specific error codes and properties to accurately
 * classify errors into connection, query, transaction, or data integrity categories and transforms
 * them into standardized DatabaseException types with appropriate error codes and recovery strategies.
 * 
 * It includes specialized handling for unique constraint violations, foreign key conflicts,
 * and connection timeouts, enriching errors with operation context for better debugging.
 */

import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
  PrismaClientInitializationError,
  PrismaClientRustPanicError
} from '@prisma/client/runtime/library';

import {
  DatabaseErrorType,
  DatabaseErrorSeverity,
  DatabaseErrorRecoverability,
  DatabaseErrorContext,
  DatabaseErrorClassification,
  DEFAULT_RECOVERY_STRATEGIES,
  JOURNEY_ERROR_PREFIXES,
  OPERATION_ERROR_PREFIXES
} from '../database-error.types';

import {
  ConnectionException,
  QueryException,
  TransactionException,
  IntegrityException,
  ConfigurationException,
  JourneyDatabaseException,
  DatabaseErrorSeverity as ExceptionSeverity,
  DatabaseErrorRecoverability as ExceptionRecoverability
} from '../database-error.exception';

import * as ErrorCodes from '../database-error.codes';
import { IDatabaseErrorHandler } from './index';

/**
 * Interface for Prisma error metadata.
 * Provides additional context for Prisma-specific errors.
 */
interface PrismaErrorMetadata {
  /**
   * The Prisma error code (P1XXX, P2XXX, P3XXX)
   */
  code?: string;
  
  /**
   * The target model or table name
   */
  target?: string | string[];
  
  /**
   * The affected fields
   */
  field_name?: string | string[];
  
  /**
   * The constraint name for integrity errors
   */
  constraint?: string;
  
  /**
   * Any additional metadata from Prisma
   */
  [key: string]: any;
}

/**
 * Maps Prisma error codes to database error types.
 * Used for consistent error classification.
 */
const PRISMA_ERROR_TYPE_MAP: Record<string, DatabaseErrorType> = {
  // P1XXX - Query engine errors (connection, initialization)
  'P1000': DatabaseErrorType.CONNECTION,     // Authentication failed
  'P1001': DatabaseErrorType.CONNECTION,     // Cannot reach database server
  'P1002': DatabaseErrorType.CONNECTION,     // Connection timed out
  'P1003': DatabaseErrorType.CONFIGURATION,  // Database does not exist
  'P1008': DatabaseErrorType.TRANSACTION,    // Operations timed out
  'P1009': DatabaseErrorType.CONFIGURATION,  // Database already exists
  'P1010': DatabaseErrorType.CONNECTION,     // User was denied access
  'P1011': DatabaseErrorType.CONNECTION,     // Error opening a TLS connection
  'P1012': DatabaseErrorType.CONFIGURATION,  // Schema validation error
  'P1013': DatabaseErrorType.QUERY,          // Invalid database string
  'P1014': DatabaseErrorType.CONFIGURATION,  // Underlying model does not exist
  'P1015': DatabaseErrorType.CONFIGURATION,  // Prisma schema is invalid
  'P1016': DatabaseErrorType.CONFIGURATION,  // Raw query error
  'P1017': DatabaseErrorType.CONNECTION,     // Server closed the connection
  
  // P2XXX - Database errors (query, integrity)
  'P2000': DatabaseErrorType.INTEGRITY,      // Value too long for column
  'P2001': DatabaseErrorType.QUERY,          // Record not found
  'P2002': DatabaseErrorType.INTEGRITY,      // Unique constraint violation
  'P2003': DatabaseErrorType.INTEGRITY,      // Foreign key constraint violation
  'P2004': DatabaseErrorType.INTEGRITY,      // Constraint violation
  'P2005': DatabaseErrorType.INTEGRITY,      // Invalid value for field type
  'P2006': DatabaseErrorType.QUERY,          // Invalid value provided
  'P2007': DatabaseErrorType.QUERY,          // Data validation error
  'P2008': DatabaseErrorType.QUERY,          // Failed to parse query
  'P2009': DatabaseErrorType.QUERY,          // Failed to validate query
  'P2010': DatabaseErrorType.QUERY,          // Raw query failed
  'P2011': DatabaseErrorType.INTEGRITY,      // Null constraint violation
  'P2012': DatabaseErrorType.QUERY,          // Missing required field
  'P2013': DatabaseErrorType.QUERY,          // Missing required argument
  'P2014': DatabaseErrorType.INTEGRITY,      // Relation constraint violation
  'P2015': DatabaseErrorType.QUERY,          // Related record not found
  'P2016': DatabaseErrorType.QUERY,          // Query interpretation error
  'P2017': DatabaseErrorType.QUERY,          // Records not connected
  'P2018': DatabaseErrorType.QUERY,          // Required connected records not found
  'P2019': DatabaseErrorType.QUERY,          // Input error
  'P2020': DatabaseErrorType.QUERY,          // Value out of range
  'P2021': DatabaseErrorType.CONFIGURATION,  // Table does not exist
  'P2022': DatabaseErrorType.CONFIGURATION,  // Column does not exist
  'P2023': DatabaseErrorType.QUERY,          // Inconsistent column data
  'P2024': DatabaseErrorType.CONNECTION,     // Connection pool timeout
  'P2025': DatabaseErrorType.QUERY,          // Record not found for operation
  'P2026': DatabaseErrorType.CONFIGURATION,  // Unsupported feature
  'P2027': DatabaseErrorType.QUERY,          // Multiple errors occurred
  'P2028': DatabaseErrorType.TRANSACTION,    // Transaction API error
  'P2030': DatabaseErrorType.QUERY,          // Fulltext index not found
  'P2033': DatabaseErrorType.QUERY,          // Number of parameters exceeded
  'P2034': DatabaseErrorType.TRANSACTION,    // Transaction failed (deadlock)
  
  // P3XXX - Prisma client errors (migration, configuration)
  'P3000': DatabaseErrorType.CONFIGURATION,  // Failed to create database
  'P3001': DatabaseErrorType.CONFIGURATION,  // Migration possible with data loss
  'P3002': DatabaseErrorType.CONFIGURATION,  // Migration rolled back
  'P3003': DatabaseErrorType.CONFIGURATION,  // Migration format changed
  'P3004': DatabaseErrorType.CONFIGURATION,  // Migration directory corrupt
  'P3005': DatabaseErrorType.CONFIGURATION,  // Database schema not empty
  'P3006': DatabaseErrorType.CONFIGURATION,  // Migration cannot be applied
  'P3007': DatabaseErrorType.CONFIGURATION,  // Some migrations failed
  'P3008': DatabaseErrorType.CONFIGURATION,  // Migration cannot be rolled back
  'P3009': DatabaseErrorType.CONFIGURATION,  // Failed to get migration lock
  'P3010': DatabaseErrorType.CONFIGURATION,  // Migration name too long
  'P3011': DatabaseErrorType.CONFIGURATION,  // Migration not found
  'P3012': DatabaseErrorType.CONFIGURATION,  // Schema loaded multiple times
  'P3013': DatabaseErrorType.CONFIGURATION,  // Datasource provider arrays not supported
  'P3014': DatabaseErrorType.CONFIGURATION,  // Prisma schema validation error
  'P3015': DatabaseErrorType.CONFIGURATION,  // Migration directory not found
  'P3016': DatabaseErrorType.CONFIGURATION,  // Migration directory required
  'P3017': DatabaseErrorType.CONFIGURATION,  // Migration directory path invalid
  'P3018': DatabaseErrorType.CONFIGURATION,  // Could not create migration directory
  'P3019': DatabaseErrorType.CONFIGURATION,  // Datasource URL env var not found
  'P3020': DatabaseErrorType.CONFIGURATION,  // Datasource URL env var empty
  'P3021': DatabaseErrorType.CONFIGURATION,  // Foreign key constraint failed
  'P3022': DatabaseErrorType.CONFIGURATION   // Direct execution of migrations failed
};

/**
 * Maps Prisma error codes to database error severity.
 * Used for consistent error classification.
 */
const PRISMA_ERROR_SEVERITY_MAP: Record<string, DatabaseErrorSeverity> = {
  // Connection errors - typically critical
  'P1000': DatabaseErrorSeverity.CRITICAL,
  'P1001': DatabaseErrorSeverity.CRITICAL,
  'P1002': DatabaseErrorSeverity.CRITICAL,
  'P1010': DatabaseErrorSeverity.CRITICAL,
  'P1011': DatabaseErrorSeverity.CRITICAL,
  'P1017': DatabaseErrorSeverity.CRITICAL,
  'P2024': DatabaseErrorSeverity.CRITICAL,
  
  // Configuration errors - typically critical
  'P1003': DatabaseErrorSeverity.CRITICAL,
  'P1009': DatabaseErrorSeverity.CRITICAL,
  'P1012': DatabaseErrorSeverity.CRITICAL,
  'P1014': DatabaseErrorSeverity.CRITICAL,
  'P1015': DatabaseErrorSeverity.CRITICAL,
  'P2021': DatabaseErrorSeverity.CRITICAL,
  'P2022': DatabaseErrorSeverity.CRITICAL,
  'P2026': DatabaseErrorSeverity.CRITICAL,
  'P3000': DatabaseErrorSeverity.CRITICAL,
  'P3004': DatabaseErrorSeverity.CRITICAL,
  'P3019': DatabaseErrorSeverity.CRITICAL,
  'P3020': DatabaseErrorSeverity.CRITICAL,
  
  // Transaction errors - typically major
  'P1008': DatabaseErrorSeverity.MAJOR,
  'P2028': DatabaseErrorSeverity.MAJOR,
  'P2034': DatabaseErrorSeverity.MAJOR,
  
  // Integrity errors - typically major
  'P2000': DatabaseErrorSeverity.MAJOR,
  'P2002': DatabaseErrorSeverity.MAJOR,
  'P2003': DatabaseErrorSeverity.MAJOR,
  'P2004': DatabaseErrorSeverity.MAJOR,
  'P2005': DatabaseErrorSeverity.MAJOR,
  'P2011': DatabaseErrorSeverity.MAJOR,
  'P2014': DatabaseErrorSeverity.MAJOR,
  
  // Query errors - typically major or minor
  'P2001': DatabaseErrorSeverity.MINOR,  // Record not found is often expected
  'P2006': DatabaseErrorSeverity.MAJOR,
  'P2007': DatabaseErrorSeverity.MAJOR,
  'P2008': DatabaseErrorSeverity.MAJOR,
  'P2009': DatabaseErrorSeverity.MAJOR,
  'P2010': DatabaseErrorSeverity.MAJOR,
  'P2012': DatabaseErrorSeverity.MAJOR,
  'P2013': DatabaseErrorSeverity.MAJOR,
  'P2015': DatabaseErrorSeverity.MINOR,  // Related record not found is often expected
  'P2016': DatabaseErrorSeverity.MAJOR,
  'P2017': DatabaseErrorSeverity.MAJOR,
  'P2018': DatabaseErrorSeverity.MAJOR,
  'P2019': DatabaseErrorSeverity.MAJOR,
  'P2020': DatabaseErrorSeverity.MAJOR,
  'P2023': DatabaseErrorSeverity.MAJOR,
  'P2025': DatabaseErrorSeverity.MINOR,  // Record not found for operation is often expected
  'P2027': DatabaseErrorSeverity.MAJOR,
  'P2030': DatabaseErrorSeverity.MAJOR,
  'P2033': DatabaseErrorSeverity.MAJOR
};

/**
 * Maps Prisma error codes to recoverability.
 * Used to determine if an error is transient and can be retried.
 */
const PRISMA_ERROR_RECOVERABILITY_MAP: Record<string, DatabaseErrorRecoverability> = {
  // Transient errors that can be retried
  'P1001': DatabaseErrorRecoverability.TRANSIENT,  // Cannot reach database server
  'P1002': DatabaseErrorRecoverability.TRANSIENT,  // Connection timed out
  'P1008': DatabaseErrorRecoverability.TRANSIENT,  // Operations timed out
  'P1017': DatabaseErrorRecoverability.TRANSIENT,  // Server closed the connection
  'P2024': DatabaseErrorRecoverability.TRANSIENT,  // Connection pool timeout
  'P2034': DatabaseErrorRecoverability.TRANSIENT,  // Transaction failed (deadlock)
  
  // All other errors are permanent by default
};

/**
 * Maps Prisma error codes to database error codes.
 * Used for standardized error reporting.
 */
const PRISMA_TO_DB_ERROR_CODE_MAP: Record<string, string> = {
  // Connection errors
  'P1000': ErrorCodes.DB_CONN_PG_REJECTED,
  'P1001': ErrorCodes.DB_CONN_PG_FAILED,
  'P1002': ErrorCodes.DB_CONN_PG_TIMEOUT,
  'P1010': ErrorCodes.DB_CONN_PG_REJECTED,
  'P1011': ErrorCodes.DB_CONN_PG_FAILED,
  'P1017': ErrorCodes.DB_CONN_PG_CLOSED,
  'P2024': ErrorCodes.DB_CONN_PG_POOL_EXHAUSTED,
  
  // Query errors
  'P2001': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2006': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2007': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2008': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2009': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2010': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2012': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2013': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2015': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2016': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2017': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2018': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2019': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2020': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2023': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2025': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2027': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2030': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P2033': ErrorCodes.DB_QUERY_PG_SYNTAX,
  'P1008': ErrorCodes.DB_QUERY_PG_TIMEOUT,
  
  // Transaction errors
  'P2028': ErrorCodes.DB_TRANS_PG_BEGIN_FAILED,
  'P2034': ErrorCodes.DB_TRANS_PG_DEADLOCK,
  
  // Integrity errors
  'P2000': ErrorCodes.DB_INTEG_PG_CHECK,
  'P2002': ErrorCodes.DB_INTEG_PG_UNIQUE,
  'P2003': ErrorCodes.DB_INTEG_PG_FOREIGN_KEY,
  'P2004': ErrorCodes.DB_INTEG_PG_CHECK,
  'P2005': ErrorCodes.DB_INTEG_PG_CHECK,
  'P2011': ErrorCodes.DB_INTEG_PG_NOT_NULL,
  'P2014': ErrorCodes.DB_INTEG_PG_FOREIGN_KEY,
  
  // Configuration errors
  'P1003': ErrorCodes.DB_CONFIG_PG_INVALID_SCHEMA,
  'P1009': ErrorCodes.DB_CONFIG_PG_INVALID_SCHEMA,
  'P1012': ErrorCodes.DB_CONFIG_PG_INVALID_SCHEMA,
  'P1013': ErrorCodes.DB_CONFIG_PG_INVALID_URL,
  'P1014': ErrorCodes.DB_CONFIG_PG_INVALID_SCHEMA,
  'P1015': ErrorCodes.DB_CONFIG_PG_INVALID_SCHEMA,
  'P2021': ErrorCodes.DB_CONFIG_PG_INVALID_SCHEMA,
  'P2022': ErrorCodes.DB_CONFIG_PG_INVALID_SCHEMA,
  'P2026': ErrorCodes.DB_CONFIG_PG_INVALID_SCHEMA,
  'P3000': ErrorCodes.DB_CONFIG_PG_INVALID_SCHEMA,
  'P3019': ErrorCodes.DB_CONFIG_PG_INVALID_URL,
  'P3020': ErrorCodes.DB_CONFIG_PG_INVALID_URL
};

/**
 * Maps Prisma error codes to user-friendly error messages.
 * Used for consistent error reporting.
 */
const PRISMA_ERROR_MESSAGES: Record<string, string> = {
  // Connection errors
  'P1000': 'Authentication failed when connecting to the database',
  'P1001': 'Cannot reach database server at the specified host and port',
  'P1002': 'Database connection timed out',
  'P1010': 'User was denied access to the database',
  'P1011': 'Error opening a TLS connection to the database',
  'P1017': 'Server closed the connection unexpectedly',
  'P2024': 'Timed out fetching a connection from the connection pool',
  
  // Query errors
  'P2001': 'The requested record was not found',
  'P2006': 'The provided value is invalid',
  'P2007': 'Data validation error',
  'P2008': 'Failed to parse the query',
  'P2009': 'Failed to validate the query',
  'P2010': 'Raw query execution failed',
  'P2012': 'Missing required field in the query',
  'P2013': 'Missing required argument in the query',
  'P2015': 'A related record could not be found',
  'P2016': 'Query interpretation error',
  'P2017': 'The records for the relation are not connected',
  'P2018': 'The required connected records were not found',
  'P2019': 'Input error in the query',
  'P2020': 'Value out of range for the type',
  'P2023': 'Inconsistent column data',
  'P2025': 'An operation failed because it depends on records that were not found',
  'P2027': 'Multiple errors occurred during the database operation',
  'P2030': 'Cannot find a fulltext index to use for the search',
  'P2033': 'Number of parameters exceeded the number of placeholders in the query',
  'P1008': 'Database operations timed out',
  
  // Transaction errors
  'P2028': 'Transaction API error',
  'P2034': 'Transaction failed due to a write conflict or a deadlock',
  
  // Integrity errors
  'P2000': 'The provided value is too long for the field',
  'P2002': 'Unique constraint violation',
  'P2003': 'Foreign key constraint violation',
  'P2004': 'A constraint failed on the database',
  'P2005': 'The value is invalid for the field type',
  'P2011': 'Null constraint violation',
  'P2014': 'The change would violate a relation constraint',
  
  // Configuration errors
  'P1003': 'Database does not exist at the specified path',
  'P1009': 'Database already exists at the specified path',
  'P1012': 'Prisma schema validation error',
  'P1013': 'The provided database string is invalid',
  'P1014': 'The underlying model does not exist',
  'P1015': 'Your Prisma schema is invalid',
  'P2021': 'The table does not exist in the database',
  'P2022': 'The column does not exist in the database',
  'P2026': 'The current database provider doesn\'t support a feature that the query used',
  'P3000': 'Failed to create database',
  'P3019': 'Database URL environment variable not found',
  'P3020': 'Database URL environment variable is empty'
};

/**
 * Maps Prisma error codes to recovery suggestions.
 * Used to provide helpful guidance for resolving errors.
 */
const PRISMA_ERROR_RECOVERY_SUGGESTIONS: Record<string, string> = {
  // Connection errors
  'P1000': 'Check your database credentials and ensure the user has proper permissions.',
  'P1001': 'Verify that the database server is running and accessible from your application.',
  'P1002': 'Check network connectivity and database server load. Consider increasing connection timeout.',
  'P1010': 'Verify that the database user has the necessary permissions for the requested operation.',
  'P1011': 'Check TLS configuration and certificate validity.',
  'P1017': 'Check database server logs for potential issues and ensure the server is stable.',
  'P2024': 'Consider increasing the connection pool size or optimizing database queries to release connections faster.',
  
  // Query errors
  'P2001': 'Verify that the record exists before attempting to access it.',
  'P2006': 'Check the data type and format of the provided value.',
  'P2007': 'Validate input data before sending it to the database.',
  'P2008': 'Check the syntax of your query for errors.',
  'P2009': 'Ensure your query follows the Prisma query structure and uses valid fields.',
  'P2010': 'Check the syntax of your raw SQL query.',
  'P2012': 'Ensure all required fields are provided in your query.',
  'P2013': 'Ensure all required arguments are provided in your query.',
  'P2015': 'Verify that related records exist before attempting to connect them.',
  'P2016': 'Check your query structure and ensure it follows Prisma conventions.',
  'P2017': 'Ensure the records are properly connected in the database.',
  'P2018': 'Verify that all required related records exist before performing the operation.',
  'P2019': 'Check the input data for errors and ensure it matches the expected format.',
  'P2020': 'Ensure the value is within the acceptable range for the field type.',
  'P2023': 'Check for data consistency issues in your database.',
  'P2025': 'Verify that all required records exist before performing the operation.',
  'P2027': 'Check the error details for multiple issues that need to be addressed.',
  'P2030': 'Ensure a fulltext index is defined for the field you are searching.',
  'P2033': 'Check that the number of parameters matches the number of placeholders in your query.',
  'P1008': 'Optimize your query to execute faster or increase the timeout setting.',
  
  // Transaction errors
  'P2028': 'Check your transaction logic and ensure proper usage of Prisma\'s transaction API.',
  'P2034': 'Retry the transaction after a brief delay. Consider implementing exponential backoff for retries.',
  
  // Integrity errors
  'P2000': 'Reduce the length of the input value to fit within the field\'s maximum length.',
  'P2002': 'Ensure the value is unique or handle the conflict appropriately in your application logic.',
  'P2003': 'Verify that the referenced record exists before attempting to create a relation.',
  'P2004': 'Check the constraints defined in your database and ensure your data complies with them.',
  'P2005': 'Ensure the value matches the expected type for the field.',
  'P2011': 'Provide a non-null value for the field or make the field optional in your schema.',
  'P2014': 'Check the relation constraints in your schema and ensure your operation complies with them.',
  
  // Configuration errors
  'P1003': 'Create the database or update your connection string to point to an existing database.',
  'P1009': 'Use a different database name or drop the existing database if appropriate.',
  'P1012': 'Check your Prisma schema for validation errors and fix them.',
  'P1013': 'Verify the format of your database connection string.',
  'P1014': 'Ensure the model exists in your Prisma schema.',
  'P1015': 'Fix the validation errors in your Prisma schema.',
  'P2021': 'Run prisma migrate dev to create the missing table or update your schema to match the database.',
  'P2022': 'Run prisma migrate dev to add the missing column or update your schema to match the database.',
  'P2026': 'Check if your database provider supports the feature or use an alternative approach.',
  'P3000': 'Check database server permissions and available disk space.',
  'P3019': 'Set the required environment variable for the database URL.',
  'P3020': 'Provide a valid value for the database URL environment variable.'
};

/**
 * Specialized error handler for Prisma ORM exceptions in PostgreSQL database operations.
 * 
 * This handler analyzes Prisma-specific error codes and properties to accurately classify
 * errors into connection, query, transaction, or data integrity categories and transforms
 * them into standardized DatabaseException types with appropriate error codes and recovery strategies.
 */
export default class PrismaErrorHandler implements IDatabaseErrorHandler {
  /**
   * Determines if this handler can process the given error.
   * 
   * @param error - The error to check
   * @returns True if this handler can process the error, false otherwise
   */
  canHandle(error: Error): boolean {
    return (
      error instanceof PrismaClientKnownRequestError ||
      error instanceof PrismaClientUnknownRequestError ||
      error instanceof PrismaClientValidationError ||
      error instanceof PrismaClientInitializationError ||
      error instanceof PrismaClientRustPanicError ||
      (error.name && error.name.includes('Prisma')) ||
      (error.message && error.message.includes('Prisma'))
    );
  }

  /**
   * Handles a Prisma error by classifying it and transforming it into a standardized exception.
   * 
   * @param error - The original Prisma error to handle
   * @param context - Optional context information about the operation that caused the error
   * @returns A standardized error classification result
   */
  handleError(error: Error, context?: DatabaseErrorContext): DatabaseErrorClassification {
    // Enrich the error with additional context
    const enrichedError = this.enrichError(error, context || {});
    
    // Classify the error based on its properties
    const classification = this.classifyError(enrichedError, context);
    
    // Create the appropriate exception based on the classification
    const exception = this.createException(classification, enrichedError, context);
    
    // Return the classification result
    return {
      type: classification.type,
      severity: classification.severity,
      recoverability: classification.recoverability,
      code: classification.code,
      message: classification.message,
      details: {
        ...classification.details,
        exception
      }
    };
  }

  /**
   * Enriches an error with additional context information.
   * 
   * @param error - The error to enrich
   * @param context - Context information to add to the error
   * @returns The enriched error
   */
  enrichError(error: Error, context: DatabaseErrorContext): Error {
    // Create a copy of the error to avoid modifying the original
    const enrichedError = Object.create(Object.getPrototypeOf(error), Object.getOwnPropertyDescriptors(error));
    
    // Add context information to the error
    (enrichedError as any).context = context;
    
    // Extract Prisma-specific metadata
    const metadata = this.extractPrismaMetadata(error);
    if (metadata) {
      (enrichedError as any).metadata = metadata;
    }
    
    // Add operation information if available
    if (context.operation && !enrichedError.operation) {
      (enrichedError as any).operation = context.operation;
    }
    
    // Add entity information if available
    if (context.entity && !enrichedError.entity) {
      (enrichedError as any).entity = context.entity;
    }
    
    // Add journey information if available
    if (context.journey && !enrichedError.journey) {
      (enrichedError as any).journey = context.journey;
    }
    
    return enrichedError;
  }

  /**
   * Extracts Prisma-specific metadata from an error.
   * 
   * @param error - The Prisma error to extract metadata from
   * @returns Prisma error metadata if available, undefined otherwise
   */
  private extractPrismaMetadata(error: Error): PrismaErrorMetadata | undefined {
    if (error instanceof PrismaClientKnownRequestError) {
      return {
        code: error.code,
        meta: error.meta,
        target: error.meta?.target as string[] | undefined,
        field_name: error.meta?.field_name as string | undefined,
        constraint: error.meta?.constraint as string | undefined
      };
    }
    
    if (error instanceof PrismaClientValidationError) {
      // Extract field information from validation error message
      const fieldMatch = error.message.match(/Invalid value for argument `([^`]+)`/);
      const field = fieldMatch ? fieldMatch[1] : undefined;
      
      return {
        field_name: field
      };
    }
    
    if (error instanceof PrismaClientInitializationError) {
      return {
        code: error.errorCode
      };
    }
    
    return undefined;
  }

  /**
   * Classifies a Prisma error based on its properties.
   * 
   * @param error - The enriched Prisma error to classify
   * @param context - Additional context about the error
   * @returns A classification result with type, severity, and recoverability
   */
  private classifyError(error: Error, context?: DatabaseErrorContext): DatabaseErrorClassification {
    // Extract Prisma error code if available
    let prismaCode: string | undefined;
    let meta: any;
    
    if (error instanceof PrismaClientKnownRequestError) {
      prismaCode = error.code;
      meta = error.meta;
    } else if ((error as any).metadata?.code) {
      prismaCode = (error as any).metadata.code;
      meta = (error as any).metadata.meta;
    } else if ((error as any).errorCode) {
      prismaCode = (error as any).errorCode;
    }
    
    // Determine error type based on Prisma code or error message
    const errorType = this.determineErrorType(prismaCode, error.message);
    
    // Determine error severity based on Prisma code or error type
    const severity = this.determineErrorSeverity(prismaCode, errorType);
    
    // Determine error recoverability based on Prisma code or error type
    const recoverability = this.determineErrorRecoverability(prismaCode, errorType);
    
    // Determine error code based on Prisma code or error type
    const code = this.determineErrorCode(prismaCode, errorType, context);
    
    // Determine error message based on Prisma code or error message
    const message = this.determineErrorMessage(prismaCode, error.message, meta);
    
    // Create details object with relevant information
    const details: Record<string, any> = {
      originalError: error.message,
      stack: error.stack
    };
    
    // Add Prisma-specific details if available
    if (prismaCode) {
      details.prismaCode = prismaCode;
    }
    
    if (meta) {
      details.meta = meta;
    }
    
    // Add context information if available
    if (context) {
      details.context = context;
    }
    
    // Add recovery suggestion if available
    const recoverySuggestion = this.determineRecoverySuggestion(prismaCode, errorType);
    if (recoverySuggestion) {
      details.recoverySuggestion = recoverySuggestion;
    }
    
    return {
      type: errorType,
      severity,
      recoverability,
      code,
      message,
      details
    };
  }

  /**
   * Determines the error type based on Prisma code or error message.
   * 
   * @param prismaCode - The Prisma error code if available
   * @param errorMessage - The error message
   * @returns The determined database error type
   */
  private determineErrorType(prismaCode?: string, errorMessage?: string): DatabaseErrorType {
    // If Prisma code is available, use the predefined mapping
    if (prismaCode && PRISMA_ERROR_TYPE_MAP[prismaCode]) {
      return PRISMA_ERROR_TYPE_MAP[prismaCode];
    }
    
    // Otherwise, try to determine the type from the error message
    const message = errorMessage?.toLowerCase() || '';
    
    if (
      message.includes('connect') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('authentication') ||
      message.includes('access denied')
    ) {
      return DatabaseErrorType.CONNECTION;
    }
    
    if (
      message.includes('constraint') ||
      message.includes('unique') ||
      message.includes('foreign key') ||
      message.includes('not null') ||
      message.includes('check constraint')
    ) {
      return DatabaseErrorType.INTEGRITY;
    }
    
    if (
      message.includes('transaction') ||
      message.includes('deadlock') ||
      message.includes('serialization')
    ) {
      return DatabaseErrorType.TRANSACTION;
    }
    
    if (
      message.includes('schema') ||
      message.includes('migration') ||
      message.includes('database does not exist') ||
      message.includes('table does not exist') ||
      message.includes('column does not exist')
    ) {
      return DatabaseErrorType.CONFIGURATION;
    }
    
    // Default to query error if no specific type can be determined
    return DatabaseErrorType.QUERY;
  }

  /**
   * Determines the error severity based on Prisma code or error type.
   * 
   * @param prismaCode - The Prisma error code if available
   * @param errorType - The determined database error type
   * @returns The determined database error severity
   */
  private determineErrorSeverity(prismaCode?: string, errorType?: DatabaseErrorType): DatabaseErrorSeverity {
    // If Prisma code is available, use the predefined mapping
    if (prismaCode && PRISMA_ERROR_SEVERITY_MAP[prismaCode]) {
      return PRISMA_ERROR_SEVERITY_MAP[prismaCode];
    }
    
    // Otherwise, determine severity based on error type
    switch (errorType) {
      case DatabaseErrorType.CONNECTION:
      case DatabaseErrorType.CONFIGURATION:
        return DatabaseErrorSeverity.CRITICAL;
      
      case DatabaseErrorType.TRANSACTION:
      case DatabaseErrorType.INTEGRITY:
        return DatabaseErrorSeverity.MAJOR;
      
      case DatabaseErrorType.QUERY:
        return DatabaseErrorSeverity.MAJOR;
      
      default:
        return DatabaseErrorSeverity.MAJOR;
    }
  }

  /**
   * Determines the error recoverability based on Prisma code or error type.
   * 
   * @param prismaCode - The Prisma error code if available
   * @param errorType - The determined database error type
   * @returns The determined database error recoverability
   */
  private determineErrorRecoverability(prismaCode?: string, errorType?: DatabaseErrorType): DatabaseErrorRecoverability {
    // If Prisma code is available, use the predefined mapping
    if (prismaCode && PRISMA_ERROR_RECOVERABILITY_MAP[prismaCode]) {
      return PRISMA_ERROR_RECOVERABILITY_MAP[prismaCode];
    }
    
    // Otherwise, determine recoverability based on error type
    switch (errorType) {
      case DatabaseErrorType.CONNECTION:
      case DatabaseErrorType.TRANSACTION:
        return DatabaseErrorRecoverability.TRANSIENT;
      
      case DatabaseErrorType.INTEGRITY:
      case DatabaseErrorType.CONFIGURATION:
      case DatabaseErrorType.QUERY:
        return DatabaseErrorRecoverability.PERMANENT;
      
      default:
        return DatabaseErrorRecoverability.PERMANENT;
    }
  }

  /**
   * Determines the error code based on Prisma code, error type, and context.
   * 
   * @param prismaCode - The Prisma error code if available
   * @param errorType - The determined database error type
   * @param context - Additional context about the error
   * @returns The determined database error code
   */
  private determineErrorCode(prismaCode?: string, errorType?: DatabaseErrorType, context?: DatabaseErrorContext): string {
    // If Prisma code is available, use the predefined mapping
    if (prismaCode && PRISMA_TO_DB_ERROR_CODE_MAP[prismaCode]) {
      return PRISMA_TO_DB_ERROR_CODE_MAP[prismaCode];
    }
    
    // If journey context is available, use journey-specific error code
    if (context?.journey) {
      const journeyPrefix = JOURNEY_ERROR_PREFIXES[context.journey.toUpperCase() as keyof typeof JOURNEY_ERROR_PREFIXES];
      if (journeyPrefix) {
        switch (errorType) {
          case DatabaseErrorType.CONNECTION:
            return `${journeyPrefix}CONN_001`;
          case DatabaseErrorType.QUERY:
            return `${journeyPrefix}QUERY_001`;
          case DatabaseErrorType.TRANSACTION:
            return `${journeyPrefix}TRANS_001`;
          case DatabaseErrorType.INTEGRITY:
            return `${journeyPrefix}INTEG_001`;
          case DatabaseErrorType.CONFIGURATION:
            return `${journeyPrefix}CONFIG_001`;
        }
      }
    }
    
    // Otherwise, use generic error code based on error type
    switch (errorType) {
      case DatabaseErrorType.CONNECTION:
        return ErrorCodes.DB_CONN_PG_FAILED;
      case DatabaseErrorType.QUERY:
        return ErrorCodes.DB_QUERY_PG_SYNTAX;
      case DatabaseErrorType.TRANSACTION:
        return ErrorCodes.DB_TRANS_PG_BEGIN_FAILED;
      case DatabaseErrorType.INTEGRITY:
        return ErrorCodes.DB_INTEG_PG_CHECK;
      case DatabaseErrorType.CONFIGURATION:
        return ErrorCodes.DB_CONFIG_PG_INVALID_SCHEMA;
      default:
        return ErrorCodes.DB_QUERY_PG_SYNTAX;
    }
  }

  /**
   * Determines the error message based on Prisma code or error message.
   * 
   * @param prismaCode - The Prisma error code if available
   * @param errorMessage - The error message
   * @param meta - Additional metadata about the error
   * @returns The determined error message
   */
  private determineErrorMessage(prismaCode?: string, errorMessage?: string, meta?: any): string {
    // If Prisma code is available, use the predefined message
    if (prismaCode && PRISMA_ERROR_MESSAGES[prismaCode]) {
      let message = PRISMA_ERROR_MESSAGES[prismaCode];
      
      // Enhance message with metadata if available
      if (meta) {
        if (prismaCode === 'P2002' && meta.target) {
          // Unique constraint violation
          const fields = Array.isArray(meta.target) ? meta.target.join(', ') : meta.target;
          message = `${message} on field(s): ${fields}`;
        } else if (prismaCode === 'P2003' && meta.field_name) {
          // Foreign key constraint violation
          message = `${message} on field: ${meta.field_name}`;
        } else if (prismaCode === 'P2011' && meta.field_name) {
          // Null constraint violation
          message = `${message} on field: ${meta.field_name}`;
        }
      }
      
      return message;
    }
    
    // Otherwise, use the original error message
    return errorMessage || 'An unknown database error occurred';
  }

  /**
   * Determines the recovery suggestion based on Prisma code or error type.
   * 
   * @param prismaCode - The Prisma error code if available
   * @param errorType - The determined database error type
   * @returns The determined recovery suggestion
   */
  private determineRecoverySuggestion(prismaCode?: string, errorType?: DatabaseErrorType): string | undefined {
    // If Prisma code is available, use the predefined suggestion
    if (prismaCode && PRISMA_ERROR_RECOVERY_SUGGESTIONS[prismaCode]) {
      return PRISMA_ERROR_RECOVERY_SUGGESTIONS[prismaCode];
    }
    
    // Otherwise, use generic suggestion based on error type
    switch (errorType) {
      case DatabaseErrorType.CONNECTION:
        return 'Check database connectivity, credentials, and ensure the database server is running.';
      case DatabaseErrorType.QUERY:
        return 'Verify query syntax, parameters, and ensure the operation is valid for the target entity.';
      case DatabaseErrorType.TRANSACTION:
        return 'Retry the transaction after a brief delay. If the issue persists, check for deadlocks or conflicting operations.';
      case DatabaseErrorType.INTEGRITY:
        return 'Check the data for constraint violations. Ensure referential integrity and unique constraints are satisfied.';
      case DatabaseErrorType.CONFIGURATION:
        return 'Check database configuration settings, connection strings, and environment variables.';
      default:
        return 'Verify the operation and check database logs for more information.';
    }
  }

  /**
   * Creates the appropriate exception based on the error classification.
   * 
   * @param classification - The error classification result
   * @param error - The original error
   * @param context - Additional context about the error
   * @returns The appropriate database exception
   */
  private createException(
    classification: DatabaseErrorClassification,
    error: Error,
    context?: DatabaseErrorContext
  ): Error {
    // Convert severity and recoverability to exception types
    const severity = this.mapSeverityToExceptionSeverity(classification.severity);
    const recoverability = this.mapRecoverabilityToExceptionRecoverability(classification.recoverability);
    
    // Create journey context if available
    const journeyContext = context?.journey ? {
      journey: context.journey,
      feature: context.feature,
      userId: context.userId
    } : undefined;
    
    // Create operation context if available
    const operationContext = {
      operation: context?.operation,
      entity: context?.entity,
      query: context?.query,
      params: context?.params
    };
    
    // Create the appropriate exception based on error type
    switch (classification.type) {
      case DatabaseErrorType.CONNECTION:
        return new ConnectionException(
          classification.message,
          classification.code,
          severity,
          recoverability,
          journeyContext,
          operationContext,
          classification.details?.recoverySuggestion,
          error
        );
      
      case DatabaseErrorType.QUERY:
        return new QueryException(
          classification.message,
          classification.code,
          severity,
          recoverability,
          journeyContext,
          operationContext,
          classification.details?.recoverySuggestion,
          error
        );
      
      case DatabaseErrorType.TRANSACTION:
        return new TransactionException(
          classification.message,
          classification.code,
          severity,
          recoverability,
          journeyContext,
          operationContext,
          classification.details?.recoverySuggestion,
          error
        );
      
      case DatabaseErrorType.INTEGRITY:
        return new IntegrityException(
          classification.message,
          classification.code,
          severity,
          recoverability,
          journeyContext,
          operationContext,
          classification.details?.recoverySuggestion,
          error
        );
      
      case DatabaseErrorType.CONFIGURATION:
        return new ConfigurationException(
          classification.message,
          classification.code,
          severity,
          recoverability,
          journeyContext,
          operationContext,
          classification.details?.recoverySuggestion,
          error
        );
      
      default:
        // If journey context is available, create a journey-specific exception
        if (journeyContext?.journey) {
          return new JourneyDatabaseException(
            classification.message,
            classification.code,
            journeyContext.journey,
            journeyContext.feature || 'unknown',
            severity,
            recoverability,
            operationContext,
            classification.details?.recoverySuggestion,
            {},
            error
          );
        }
        
        // Otherwise, create a generic database exception
        return new QueryException(
          classification.message,
          classification.code,
          severity,
          recoverability,
          journeyContext,
          operationContext,
          classification.details?.recoverySuggestion,
          error
        );
    }
  }

  /**
   * Maps database error severity to exception severity.
   * 
   * @param severity - The database error severity
   * @returns The corresponding exception severity
   */
  private mapSeverityToExceptionSeverity(severity: DatabaseErrorSeverity): ExceptionSeverity {
    switch (severity) {
      case DatabaseErrorSeverity.CRITICAL:
        return ExceptionSeverity.CRITICAL;
      case DatabaseErrorSeverity.MAJOR:
        return ExceptionSeverity.MAJOR;
      case DatabaseErrorSeverity.MINOR:
        return ExceptionSeverity.MINOR;
      default:
        return ExceptionSeverity.MAJOR;
    }
  }

  /**
   * Maps database error recoverability to exception recoverability.
   * 
   * @param recoverability - The database error recoverability
   * @returns The corresponding exception recoverability
   */
  private mapRecoverabilityToExceptionRecoverability(recoverability: DatabaseErrorRecoverability): ExceptionRecoverability {
    switch (recoverability) {
      case DatabaseErrorRecoverability.TRANSIENT:
        return ExceptionRecoverability.TRANSIENT;
      case DatabaseErrorRecoverability.PERMANENT:
        return ExceptionRecoverability.PERMANENT;
      default:
        return ExceptionRecoverability.PERMANENT;
    }
  }

  /**
   * Gets the appropriate retry strategy for the given error classification.
   * 
   * @param classification - The error classification result
   * @returns The appropriate retry strategy configuration
   */
  getRetryStrategy(classification: DatabaseErrorClassification): any {
    // Only provide retry strategies for transient errors
    if (classification.recoverability !== DatabaseErrorRecoverability.TRANSIENT) {
      return null;
    }
    
    // Use the default retry strategy for the error type
    return DEFAULT_RECOVERY_STRATEGIES[classification.type];
  }

  /**
   * Determines if an error should be retried based on its classification.
   * 
   * @param classification - The error classification result
   * @param attempt - The current retry attempt number
   * @returns True if the error should be retried, false otherwise
   */
  shouldRetry(classification: DatabaseErrorClassification, attempt: number): boolean {
    // Only retry transient errors
    if (classification.recoverability !== DatabaseErrorRecoverability.TRANSIENT) {
      return false;
    }
    
    // Get the retry strategy for the error type
    const strategy = DEFAULT_RECOVERY_STRATEGIES[classification.type];
    
    // Check if maximum retry attempts have been reached
    if (attempt >= strategy.maxRetries) {
      return false;
    }
    
    // Check if the error is a connection error (always retry)
    if (classification.type === DatabaseErrorType.CONNECTION) {
      return true;
    }
    
    // Check if the error is a transaction error (retry deadlocks and serialization failures)
    if (classification.type === DatabaseErrorType.TRANSACTION) {
      return true;
    }
    
    // Don't retry other error types
    return false;
  }

  /**
   * Calculates the delay before the next retry attempt.
   * 
   * @param classification - The error classification result
   * @param attempt - The current retry attempt number
   * @returns The delay in milliseconds before the next retry attempt
   */
  calculateRetryDelay(classification: DatabaseErrorClassification, attempt: number): number {
    // Get the retry strategy for the error type
    const strategy = DEFAULT_RECOVERY_STRATEGIES[classification.type];
    
    // Calculate base delay
    let delay = strategy.baseDelayMs;
    
    // Apply exponential backoff if configured
    if (strategy.useExponentialBackoff) {
      delay = delay * Math.pow(2, attempt);
    }
    
    // Apply maximum delay limit
    delay = Math.min(delay, strategy.maxDelayMs);
    
    // Apply jitter if configured
    if (strategy.useJitter) {
      // Add random jitter of up to 25% of the delay
      const jitter = Math.random() * 0.25 * delay;
      delay = delay + jitter;
    }
    
    return delay;
  }
}