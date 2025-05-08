/**
 * Database Error Types
 * 
 * This file defines the core type system for database errors in the AUSTA SuperApp.
 * It provides enums and interfaces for classifying database errors by source,
 * severity, and recoverability, enabling consistent error handling and appropriate
 * recovery strategies across the application.
 * 
 * The type system supports journey-specific error classification, allowing for
 * contextual error handling based on the journey (health, care, plan) where the
 * error occurred. This enables more precise error reporting and recovery strategies
 * tailored to each journey's specific requirements.
 */

import { ErrorType } from '@austa/errors';

/**
 * Enum representing different types of database errors.
 * Used for categorizing database exceptions for consistent error handling.
 */
export enum DatabaseErrorType {
  /**
   * Connection errors - failures to establish or maintain database connections
   */
  CONNECTION = 'connection',
  
  /**
   * Query errors - syntax errors, invalid operations, or execution failures
   */
  QUERY = 'query',
  
  /**
   * Transaction errors - failures in transaction management
   */
  TRANSACTION = 'transaction',
  
  /**
   * Data integrity errors - constraint violations, foreign key conflicts
   */
  INTEGRITY = 'integrity',
  
  /**
   * Configuration errors - invalid database settings or environment issues
   */
  CONFIGURATION = 'configuration'
}

/**
 * Enum representing the severity of database errors.
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
 * Enum representing whether a database error is recoverable.
 */
export enum DatabaseErrorRecoverability {
  /**
   * Transient errors that may resolve with retries
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
 * Interface for database error context information.
 * Provides additional context for error classification and handling.
 */
export interface DatabaseErrorContext {
  /**
   * The database operation being performed (e.g., 'findUnique', 'create', 'update')
   */
  operation?: string;
  
  /**
   * The entity or model being operated on
   */
  entity?: string;
  
  /**
   * The journey context (health, care, plan) if applicable
   */
  journey?: 'health' | 'care' | 'plan' | 'gamification' | 'notification' | 'auth';
  
  /**
   * The specific feature within the journey
   */
  feature?: string;
  
  /**
   * The query or command being executed
   */
  query?: string;
  
  /**
   * Parameters or data involved in the operation
   */
  params?: Record<string, any>;
  
  /**
   * Additional metadata relevant to the error
   */
  metadata?: Record<string, any>;
  
  /**
   * User ID associated with the operation, if applicable
   */
  userId?: string;
}

/**
 * Interface for database error classification result.
 * Used to standardize error classification across different database technologies.
 */
export interface DatabaseErrorClassification {
  /**
   * The type of database error
   */
  type: DatabaseErrorType;
  
  /**
   * The severity of the error
   */
  severity: DatabaseErrorSeverity;
  
  /**
   * Whether the error is recoverable
   */
  recoverability: DatabaseErrorRecoverability;
  
  /**
   * Standardized error code
   */
  code: string;
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * Additional details about the error
   */
  details?: Record<string, any>;
  
  /**
   * Journey-specific context, if applicable
   */
  journeyContext?: JourneyContext;
}

/**
 * Interface for error transformer options.
 * Provides configuration options for error transformation.
 */
export interface ErrorTransformerOptions {
  /**
   * Whether to include stack traces in error details
   */
  includeStackTrace?: boolean;
  
  /**
   * Whether to include query parameters in error details
   */
  includeQueryParams?: boolean;
  
  /**
   * Whether to include sensitive data in error details
   */
  includeSensitiveData?: boolean;
  
  /**
   * Custom error message templates
   */
  messageTemplates?: Record<string, string>;
  
  /**
   * Journey-specific error handling options
   */
  journeyOptions?: {
    /**
     * The journey to use for error context
     */
    journey?: 'health' | 'care' | 'plan' | 'gamification' | 'notification' | 'auth';
    
    /**
     * Whether to include journey-specific error codes
     */
    useJourneyErrorCodes?: boolean;
  };
}

/**
 * Type for mapping database error types to application error types.
 * Used for consistent error handling across the application.
 */
export type DatabaseErrorTypeMapping = {
  [key in DatabaseErrorType]: ErrorType;
};

/**
 * Default mapping of database error types to application error types.
 */
export const DEFAULT_ERROR_TYPE_MAPPING: DatabaseErrorTypeMapping = {
  [DatabaseErrorType.INTEGRITY]: ErrorType.VALIDATION,
  [DatabaseErrorType.QUERY]: ErrorType.BUSINESS,
  [DatabaseErrorType.CONNECTION]: ErrorType.TECHNICAL,
  [DatabaseErrorType.TRANSACTION]: ErrorType.TECHNICAL,
  [DatabaseErrorType.CONFIGURATION]: ErrorType.TECHNICAL
};

/**
 * Journey-specific database error prefixes.
 * Used to create standardized error codes for each journey.
 */
export const JOURNEY_ERROR_PREFIXES = {
  HEALTH: 'DB_HEALTH_',
  CARE: 'DB_CARE_',
  PLAN: 'DB_PLAN_',
  GAMIFICATION: 'DB_GAME_',
  NOTIFICATION: 'DB_NOTIF_',
  AUTH: 'DB_AUTH_'
};

/**
 * Database operation type prefixes.
 * Used to create standardized error codes for each operation type.
 */
export const OPERATION_ERROR_PREFIXES = {
  CONNECTION: 'DB_CONN_',
  QUERY: 'DB_QUERY_',
  TRANSACTION: 'DB_TRANS_',
  INTEGRITY: 'DB_INTEG_',
  CONFIGURATION: 'DB_CONFIG_'
};

/**
 * Type for database error recovery strategies.
 * Defines how different error types should be handled for recovery.
 */
export interface DatabaseErrorRecoveryStrategy {
  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;
  
  /**
   * Base delay between retry attempts in milliseconds
   */
  baseDelayMs: number;
  
  /**
   * Maximum delay between retry attempts in milliseconds
   */
  maxDelayMs: number;
  
  /**
   * Whether to use exponential backoff for retries
   */
  useExponentialBackoff: boolean;
  
  /**
   * Whether to add jitter to retry delays
   */
  useJitter: boolean;
  
  /**
   * Custom condition to determine if an error should be retried
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Default recovery strategies for different database error types.
 */
export const DEFAULT_RECOVERY_STRATEGIES: Record<DatabaseErrorType, DatabaseErrorRecoveryStrategy> = {
  [DatabaseErrorType.CONNECTION]: {
    maxRetries: 5,
    baseDelayMs: 100,
    maxDelayMs: 5000,
    useExponentialBackoff: true,
    useJitter: true
  },
  [DatabaseErrorType.QUERY]: {
    maxRetries: 3,
    baseDelayMs: 50,
    maxDelayMs: 2000,
    useExponentialBackoff: true,
    useJitter: true
  },
  [DatabaseErrorType.TRANSACTION]: {
    maxRetries: 3,
    baseDelayMs: 100,
    maxDelayMs: 3000,
    useExponentialBackoff: true,
    useJitter: true
  },
  [DatabaseErrorType.INTEGRITY]: {
    maxRetries: 0, // Integrity errors typically can't be resolved by retrying
    baseDelayMs: 0,
    maxDelayMs: 0,
    useExponentialBackoff: false,
    useJitter: false
  },
  [DatabaseErrorType.CONFIGURATION]: {
    maxRetries: 0, // Configuration errors typically can't be resolved by retrying
    baseDelayMs: 0,
    maxDelayMs: 0,
    useExponentialBackoff: false,
    useJitter: false
  }
};

/**
 * Type for journey-specific database error context.
 * Provides specialized context for different journeys.
 */
export type JourneyDatabaseErrorContext = {
  [key in 'health' | 'care' | 'plan' | 'gamification' | 'notification' | 'auth']: {
    /**
     * Journey-specific error codes
     */
    errorCodes: Record<string, string>;
    
    /**
     * Journey-specific error messages
     */
    errorMessages: Record<string, string>;
    
    /**
     * Journey-specific recovery suggestions
     */
    recoverySuggestions: Record<string, string>;
  };
};

/**
 * Type for database error handler function.
 * Defines the signature for error handler functions.
 */
export type DatabaseErrorHandler = (
  error: Error,
  context?: DatabaseErrorContext
) => void;

/**
 * Type for database error transformer function.
 * Defines the signature for error transformer functions.
 */
export type DatabaseErrorTransformer = (
  error: Error,
  context?: DatabaseErrorContext
) => DatabaseErrorClassification;

/**
 * Type for database error recovery function.
 * Defines the signature for error recovery functions.
 */
export type DatabaseErrorRecoveryFunction = (
  error: Error,
  context?: DatabaseErrorContext,
  attempt?: number
) => Promise<void>;

/**
 * Type for database error retry condition function.
 * Defines the signature for functions that determine if an error should be retried.
 */
export type DatabaseErrorRetryCondition = (
  error: Error,
  context?: DatabaseErrorContext,
  attempt?: number
) => boolean;

/**
 * Type for journey-specific database error handler registry.
 * Maps journey and error types to specific handler functions.
 */
export type JourneyErrorHandlerRegistry = {
  [journey in 'health' | 'care' | 'plan' | 'gamification' | 'notification' | 'auth']?: {
    [errorType in DatabaseErrorType]?: DatabaseErrorHandler;
  };
};

/**
 * Type for database error metadata.
 * Provides additional information about database errors.
 */
export interface DatabaseErrorMetadata {
  /**
   * The original error that caused this exception
   */
  originalError?: Error;
  
  /**
   * The stack trace of the error
   */
  stackTrace?: string;
  
  /**
   * The time when the error occurred
   */
  timestamp: Date;
  
  /**
   * The database technology where the error occurred (PostgreSQL, Redis, etc.)
   */
  technology?: string;
  
  /**
   * The database version
   */
  databaseVersion?: string;
  
  /**
   * The client library version (Prisma, TypeORM, etc.)
   */
  clientVersion?: string;
  
  /**
   * Any additional metadata
   */
  [key: string]: any;
}

/**
 * Type for database error response.
 * Defines the structure of error responses sent to clients.
 */
export interface DatabaseErrorResponse {
  /**
   * The error code
   */
  code: string;
  
  /**
   * The error message
   */
  message: string;
  
  /**
   * The type of error
   */
  type: string;
  
  /**
   * The severity of the error
   */
  severity: string;
  
  /**
   * Additional details about the error
   */
  details?: Record<string, any>;
  
  /**
   * Suggestion for recovering from the error
   */
  recoverySuggestion?: string;
  
  /**
   * Journey context, if applicable
   */
  journeyContext?: {
    journey?: string;
    feature?: string;
  };
}

/**
 * Type guard to check if an error is a specific database error type
 * @param error The error to check
 * @param type The database error type to check against
 * @returns True if the error is of the specified type
 */
export function isDatabaseErrorType(error: any, type: DatabaseErrorType): boolean {
  return error && 
         error.type === type && 
         Object.values(DatabaseErrorType).includes(error.type);
}

/**
 * Type guard to check if an error is transient
 * @param error The error to check
 * @returns True if the error is transient
 */
export function isTransientError(error: any): boolean {
  return error && 
         error.recoverability === DatabaseErrorRecoverability.TRANSIENT;
}

/**
 * Type guard to check if an error is from a specific journey
 * @param error The error to check
 * @param journey The journey to check against
 * @returns True if the error is from the specified journey
 */
export function isJourneyError(error: any, journey: string): boolean {
  return error && 
         error.journeyContext && 
         error.journeyContext.journey === journey;
}

/**
 * Utility to create a journey-specific error context
 * @param journey The journey where the error occurred
 * @param feature The specific feature within the journey
 * @param userId Optional user ID associated with the operation
 * @param additionalContext Additional context information
 * @returns A journey context object
 */
export function createJourneyContext(
  journey: 'health' | 'care' | 'plan' | 'gamification' | 'notification' | 'auth',
  feature: string,
  userId?: string,
  additionalContext: Record<string, any> = {}
): JourneyContext {
  return {
    journey,
    feature,
    userId,
    ...additionalContext
  };
}

/**
 * Utility to create a database operation context
 * @param operation The type of operation being performed
 * @param entity The target entity or table name
 * @param query The query or command being executed
 * @param params Parameters used in the query
 * @returns A database operation context object
 */
export function createOperationContext(
  operation: string,
  entity: string,
  query?: string,
  params?: Record<string, any>
): DatabaseOperationContext {
  return {
    operation,
    entity,
    query,
    params
  };
}