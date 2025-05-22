/**
 * @file index.ts
 * @description Main barrel export file for the database error handling module.
 * 
 * This file provides a centralized entry point for accessing all error types, exceptions,
 * transformers, and handlers related to database operations in the AUSTA SuperApp.
 * It simplifies imports across the application by re-exporting all database error
 * handling functionality from a single location.
 * 
 * The exports are organized by functionality type:
 * - Types and Interfaces: Basic type definitions for database errors
 * - Exceptions: Specialized exception classes for different error categories
 * - Error Codes: Standardized error codes for consistent error identification
 * - Transformers: Utilities to convert low-level errors to domain exceptions
 * - Retry Strategies: Mechanisms for handling transient database errors
 * - Handlers: Specialized handlers for different database technologies
 */

// ===================================================================
// Types and Interfaces
// ===================================================================

/**
 * Re-export all types and interfaces from database-error.types.ts
 */
export {
  // Core error type enums
  DatabaseErrorType,
  DatabaseErrorSeverity,
  DatabaseErrorRecoverability,
  JourneyContext,
  
  // Error metadata interfaces
  DatabaseErrorMetadata,
  JourneyErrorContext,
  ClassifiedDatabaseError,
  
  // Function types
  DatabaseErrorClassifier,
  DatabaseErrorTransformer,
  DatabaseErrorRecoveryStrategy,
  DatabaseErrorHandlingOptions,
  
  // Type guards
  isClassifiedDatabaseError
} from './database-error.types';

// ===================================================================
// Exceptions
// ===================================================================

/**
 * Re-export all exception classes from database-error.exception.ts
 */
export {
  // Error severity enum
  DatabaseErrorSeverity as DatabaseExceptionSeverity,
  
  // Error context interface
  DatabaseErrorContext,
  
  // Exception classes
  DatabaseException,
  ConnectionException,
  QueryException,
  TransactionException,
  IntegrityException,
  ConfigurationException
} from './database-error.exception';

// ===================================================================
// Error Codes
// ===================================================================

/**
 * Re-export all error codes from database-error.codes.ts
 */
export * from './database-error.codes';

// ===================================================================
// Error Transformers
// ===================================================================

/**
 * Re-export ErrorTransformer and related interfaces from error-transformer.ts
 */
export {
  // Context interface
  DatabaseOperationContext,
  
  // Main transformer service
  ErrorTransformer
} from './error-transformer';

// ===================================================================
// Retry Strategies
// ===================================================================

/**
 * Re-export retry strategies and related types from retry-strategies.ts
 */
export {
  // Enums
  DatabaseOperationType,
  JourneyContext as RetryJourneyContext,
  
  // Interfaces
  RetryContext,
  RetryStrategy,
  ExponentialBackoffConfig,
  CircuitBreakerConfig,
  CompositeRetryConfig,
  
  // Strategy implementations
  ExponentialBackoffStrategy,
  CircuitBreakerStrategy,
  CompositeRetryStrategy,
  
  // Factory
  RetryStrategyFactory
} from './retry-strategies';

// ===================================================================
// Error Handlers
// ===================================================================

/**
 * Re-export all error handlers from handlers/index.ts
 */
export * from './handlers';

// ===================================================================
// Convenience Functions
// ===================================================================

/**
 * Determines if an error is a database-related error.
 * 
 * @param error The error to check
 * @returns True if the error is a database-related error
 */
export function isDatabaseError(error: unknown): boolean {
  return (
    error instanceof DatabaseException ||
    // Check for common database error patterns in generic errors
    (error instanceof Error && (
      error.message.toLowerCase().includes('database') ||
      error.message.toLowerCase().includes('db') ||
      error.message.toLowerCase().includes('sql') ||
      error.message.toLowerCase().includes('query') ||
      error.message.toLowerCase().includes('connection') ||
      error.message.toLowerCase().includes('prisma') ||
      error.message.toLowerCase().includes('redis') ||
      error.message.toLowerCase().includes('timescale')
    ))
  );
}

/**
 * Determines if a database error is likely transient and can be retried.
 * 
 * @param error The error to check
 * @returns True if the error is likely transient
 */
export function isTransientDatabaseError(error: unknown): boolean {
  if (error instanceof DatabaseException) {
    // Use the built-in recoverability information
    return error.context.recoverable;
  }
  
  // For other errors, check common transient error patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('deadlock') ||
      message.includes('connection') ||
      message.includes('temporarily unavailable') ||
      message.includes('too many connections') ||
      message.includes('rate limit') ||
      message.includes('overloaded')
    );
  }
  
  return false;
}

/**
 * Creates a standardized database error message with context.
 * 
 * @param operation The database operation that failed
 * @param entity The entity or table involved
 * @param errorMessage The specific error message
 * @param journey Optional journey context
 * @returns A formatted error message
 */
export function formatDatabaseErrorMessage(
  operation: string,
  entity: string,
  errorMessage: string,
  journey?: string
): string {
  const journeyPrefix = journey ? `[${journey}] ` : '';
  return `${journeyPrefix}Database error during ${operation} operation on ${entity}: ${errorMessage}`;
}

/**
 * Wraps a database operation with standardized error handling.
 * 
 * @param operation The database operation to execute
 * @param context The operation context for error handling
 * @param transformer The error transformer to use
 * @returns The result of the operation
 * @throws DatabaseException if the operation fails
 */
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  context: DatabaseOperationContext,
  transformer: ErrorTransformer
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw transformer.transform(error, context);
  }
}