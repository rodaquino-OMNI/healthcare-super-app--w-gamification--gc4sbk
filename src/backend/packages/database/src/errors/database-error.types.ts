/**
 * Database Error Types
 * 
 * This module defines a comprehensive type system for database errors that categorizes them
 * by source, severity, and recoverability. It provides enums and interfaces for classifying
 * database errors into connection, query, transaction, data integrity, and configuration categories.
 * 
 * These types are used throughout the application to ensure consistent error handling and
 * appropriate recovery strategies across all journey services.
 */

/**
 * Enum representing the type of database error that occurred.
 */
export enum DatabaseErrorType {
  // Connection-related errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_LIMIT_REACHED = 'CONNECTION_LIMIT_REACHED',
  CONNECTION_CLOSED = 'CONNECTION_CLOSED',
  
  // Query-related errors
  QUERY_SYNTAX = 'QUERY_SYNTAX',
  QUERY_TIMEOUT = 'QUERY_TIMEOUT',
  QUERY_EXECUTION_FAILED = 'QUERY_EXECUTION_FAILED',
  QUERY_RESULT_ERROR = 'QUERY_RESULT_ERROR',
  
  // Transaction-related errors
  TRANSACTION_BEGIN_FAILED = 'TRANSACTION_BEGIN_FAILED',
  TRANSACTION_COMMIT_FAILED = 'TRANSACTION_COMMIT_FAILED',
  TRANSACTION_ROLLBACK_FAILED = 'TRANSACTION_ROLLBACK_FAILED',
  TRANSACTION_TIMEOUT = 'TRANSACTION_TIMEOUT',
  TRANSACTION_DEADLOCK = 'TRANSACTION_DEADLOCK',
  
  // Data integrity errors
  UNIQUE_CONSTRAINT_VIOLATION = 'UNIQUE_CONSTRAINT_VIOLATION',
  FOREIGN_KEY_CONSTRAINT_VIOLATION = 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
  CHECK_CONSTRAINT_VIOLATION = 'CHECK_CONSTRAINT_VIOLATION',
  NOT_NULL_CONSTRAINT_VIOLATION = 'NOT_NULL_CONSTRAINT_VIOLATION',
  DATA_VALIDATION_FAILED = 'DATA_VALIDATION_FAILED',
  
  // Configuration errors
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  MISSING_CONFIGURATION = 'MISSING_CONFIGURATION',
  SCHEMA_MISMATCH = 'SCHEMA_MISMATCH',
  MIGRATION_FAILED = 'MIGRATION_FAILED',
  
  // Generic/unknown errors
  UNKNOWN = 'UNKNOWN'
}

/**
 * Enum representing the severity level of a database error.
 */
export enum DatabaseErrorSeverity {
  // Critical errors that require immediate attention and likely cause service outage
  CRITICAL = 'CRITICAL',
  
  // Major errors that significantly impact functionality but may not cause complete outage
  MAJOR = 'MAJOR',
  
  // Minor errors that have limited impact on functionality
  MINOR = 'MINOR'
}

/**
 * Enum representing whether a database error is recoverable or not.
 */
export enum DatabaseErrorRecoverability {
  // Error is transient and may resolve with retries
  TRANSIENT = 'TRANSIENT',
  
  // Error is permanent and will not resolve with retries
  PERMANENT = 'PERMANENT',
  
  // Error recoverability is unknown
  UNKNOWN = 'UNKNOWN'
}

/**
 * Enum representing the journey context in which the database error occurred.
 */
export enum JourneyContext {
  // Health journey ("Minha Saúde")
  HEALTH = 'HEALTH',
  
  // Care journey ("Cuidar-me Agora")
  CARE = 'CARE',
  
  // Plan journey ("Meu Plano & Benefícios")
  PLAN = 'PLAN',
  
  // Gamification (cross-journey)
  GAMIFICATION = 'GAMIFICATION',
  
  // Authentication and user management
  AUTH = 'AUTH',
  
  // Notification service
  NOTIFICATION = 'NOTIFICATION',
  
  // No specific journey context
  NONE = 'NONE'
}

/**
 * Interface for database error metadata.
 */
export interface DatabaseErrorMetadata {
  // The original error object or message
  originalError?: Error | string;
  
  // The database operation that was being performed
  operation?: string;
  
  // The database entity/table involved
  entity?: string;
  
  // Additional context-specific data
  additionalData?: Record<string, unknown>;
  
  // Timestamp when the error occurred
  timestamp?: Date;
}

/**
 * Interface for journey-specific database error context.
 */
export interface JourneyErrorContext {
  // The journey in which the error occurred
  journey: JourneyContext;
  
  // The specific feature or module within the journey
  feature?: string;
  
  // The user ID associated with the error, if applicable
  userId?: string;
  
  // The request ID associated with the error, if applicable
  requestId?: string;
  
  // Whether the error is visible to the end user
  userVisible?: boolean;
  
  // User-friendly error message (for user-visible errors)
  userMessage?: string;
}

/**
 * Interface for a classified database error with complete context.
 */
export interface ClassifiedDatabaseError {
  // The type of database error
  type: DatabaseErrorType;
  
  // The severity of the error
  severity: DatabaseErrorSeverity;
  
  // Whether the error is recoverable
  recoverability: DatabaseErrorRecoverability;
  
  // Error message
  message: string;
  
  // Error code (if available)
  code?: string | number;
  
  // Journey context
  journeyContext: JourneyErrorContext;
  
  // Additional metadata
  metadata?: DatabaseErrorMetadata;
}

/**
 * Type for database error classification function.
 */
export type DatabaseErrorClassifier = (
  error: Error | unknown,
  journeyContext?: Partial<JourneyErrorContext>,
  metadata?: Partial<DatabaseErrorMetadata>
) => ClassifiedDatabaseError;

/**
 * Type for database error transformation function.
 */
export type DatabaseErrorTransformer = (
  classifiedError: ClassifiedDatabaseError
) => Error;

/**
 * Type for database error recovery strategy.
 */
export type DatabaseErrorRecoveryStrategy = (
  classifiedError: ClassifiedDatabaseError
) => Promise<void>;

/**
 * Interface for database error handling options.
 */
export interface DatabaseErrorHandlingOptions {
  // Maximum number of retry attempts
  maxRetries?: number;
  
  // Base delay for exponential backoff (in ms)
  baseRetryDelay?: number;
  
  // Maximum delay for exponential backoff (in ms)
  maxRetryDelay?: number;
  
  // Whether to use jitter in retry delays
  useJitter?: boolean;
  
  // Custom recovery strategy
  recoveryStrategy?: DatabaseErrorRecoveryStrategy;
  
  // Whether to log the error
  logError?: boolean;
  
  // Whether to report the error to monitoring
  reportError?: boolean;
  
  // Custom error transformer
  errorTransformer?: DatabaseErrorTransformer;
}

/**
 * Type guard to check if an error is a ClassifiedDatabaseError.
 */
export function isClassifiedDatabaseError(error: unknown): error is ClassifiedDatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'severity' in error &&
    'recoverability' in error &&
    'journeyContext' in error &&
    'message' in error
  );
}