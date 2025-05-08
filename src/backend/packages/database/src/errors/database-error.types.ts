/**
 * Database Error Types
 * 
 * This file defines types and enums for categorizing database errors by source,
 * severity, and recoverability. These types are used throughout the application
 * to ensure consistent error handling and appropriate recovery strategies.
 */

/**
 * Enum representing different types of database errors.
 * Used to categorize database exceptions for consistent error handling.
 */
export enum DatabaseErrorType {
  /**
   * Connection errors - failures to establish or maintain database connections
   */
  CONNECTION = 'connection',
  
  /**
   * Query errors - failures during query execution
   */
  QUERY = 'query',
  
  /**
   * Transaction errors - failures during transaction operations
   */
  TRANSACTION = 'transaction',
  
  /**
   * Data integrity errors - constraint violations
   */
  INTEGRITY = 'integrity',
  
  /**
   * Configuration errors - invalid database configuration
   */
  CONFIGURATION = 'configuration'
}

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
 * Interface for database error metadata
 */
export interface DatabaseErrorMetadata {
  /**
   * The type of database error
   */
  type: DatabaseErrorType;
  
  /**
   * The severity of the error
   */
  severity: DatabaseErrorSeverity;
  
  /**
   * Whether the error is transient or permanent
   */
  recoverability: DatabaseErrorRecoverability;
  
  /**
   * Journey context information
   */
  journeyContext?: JourneyContext;
  
  /**
   * Database operation context
   */
  operationContext?: DatabaseOperationContext;
  
  /**
   * Suggestion for recovering from this error
   */
  recoverySuggestion?: string;
  
  /**
   * Original error that caused this exception, if any
   */
  cause?: Error;
}

/**
 * Type for mapping database error codes to error types
 */
export type DatabaseErrorCodeMapping = {
  [code: string]: {
    type: DatabaseErrorType;
    defaultSeverity: DatabaseErrorSeverity;
    defaultRecoverability: DatabaseErrorRecoverability;
    defaultMessage: string;
    defaultRecoverySuggestion: string;
  };
};

/**
 * Type for database error transformation options
 */
export interface ErrorTransformOptions {
  /**
   * Whether to include sensitive information in error details (default: false)
   */
  includeSensitiveInfo?: boolean;
  
  /**
   * Whether to include stack traces in error details (default: false)
   */
  includeStackTrace?: boolean;
  
  /**
   * Journey context to include with the error
   */
  journeyContext?: JourneyContext;
  
  /**
   * Operation context to include with the error
   */
  operationContext?: DatabaseOperationContext;
}

/**
 * Type for retry strategy configuration
 */
export interface RetryStrategyConfig {
  /**
   * Maximum number of retry attempts
   */
  maxAttempts: number;
  
  /**
   * Base delay between retry attempts (in milliseconds)
   */
  baseDelay: number;
  
  /**
   * Maximum delay between retry attempts (in milliseconds)
   */
  maxDelay: number;
  
  /**
   * Whether to apply jitter to retry delays
   */
  useJitter: boolean;
  
  /**
   * Function to determine if an error is retryable
   */
  isRetryable?: (error: Error) => boolean;
}