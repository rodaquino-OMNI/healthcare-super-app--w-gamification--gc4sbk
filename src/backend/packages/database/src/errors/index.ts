/**
 * Database Error Handling Module
 * 
 * This module provides a comprehensive set of error handling utilities for database operations
 * in the AUSTA SuperApp. It includes specialized exception classes, error transformation utilities,
 * retry strategies, and standardized error codes.
 * 
 * @module @austa/database/errors
 */

// Export all exception classes
export {
  DatabaseException,
  ConnectionException,
  QueryException,
  TransactionException,
  IntegrityException,
  ConfigurationException,
  JourneyDatabaseException,
  DatabaseErrorSeverity,
  DatabaseErrorRecoverability,
  JourneyContext,
  DatabaseOperationContext
} from './database-error.exception';

// Export all error types
export {
  DatabaseErrorType,
  DatabaseErrorMetadata,
  DatabaseErrorCodeMapping,
  ErrorTransformOptions,
  RetryStrategyConfig
} from './database-error.types';

// Export all error codes
export * from './database-error.codes';

// Export error transformer utilities
export * from './error-transformer';

// Export retry strategies
export * from './retry-strategies';