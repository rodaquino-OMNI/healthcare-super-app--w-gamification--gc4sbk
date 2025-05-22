/**
 * @file index.ts
 * @description Central barrel export file for database error handlers.
 * 
 * This file provides a unified entry point for accessing all specialized error handlers
 * for different database technologies used in the AUSTA SuperApp. It re-exports the
 * PrismaErrorHandler, TimescaleErrorHandler, RedisErrorHandler, and CommonErrorHandler classes,
 * enabling consistent imports across the application.
 * 
 * It also exports utility functions for handler selection based on database technology
 * and error type, simplifying error handling in database operations.
 */

// ===================================================================
// Error Handler Classes
// ===================================================================

/**
 * Re-export PrismaErrorHandler from prisma-error.handler.ts
 * Handles Prisma ORM exceptions in PostgreSQL database operations.
 */
export { PrismaErrorHandler } from './prisma-error.handler';

/**
 * Re-export TimescaleErrorHandler from timescale-error.handler.ts
 * Handles TimescaleDB-specific errors for health metrics and time-series data storage.
 */
export { TimescaleErrorHandler, default as timescaleErrorHandler } from './timescale-error.handler';

/**
 * Re-export RedisErrorHandler from redis-error.handler.ts
 * Handles Redis-specific errors for cache and session storage operations.
 */
export { RedisErrorHandler } from './redis-error.handler';

/**
 * Re-export CommonErrorHandler from common-error.handler.ts
 * Provides fallback error handling for generic database errors.
 */
export { CommonErrorHandler } from './common-error.handler';

// ===================================================================
// Handler Selection Utilities
// ===================================================================

/**
 * Database technology types supported by the error handlers.
 * Used for selecting the appropriate handler for a given database operation.
 */
export enum DatabaseTechnology {
  PRISMA = 'prisma',
  TIMESCALE = 'timescale',
  REDIS = 'redis',
  GENERIC = 'generic'
}

/**
 * Interface for database error handler factory options.
 * Allows customization of handler behavior during creation.
 */
export interface ErrorHandlerOptions {
  /**
   * Whether to enable detailed error logging
   */
  enableDetailedLogging?: boolean;
  
  /**
   * Journey context for error categorization
   */
  journeyContext?: string;
  
  /**
   * Custom error transformation options
   */
  transformOptions?: Record<string, unknown>;
}

/**
 * Factory function to create an appropriate error handler based on database technology.
 * 
 * @param technology The database technology to create a handler for
 * @param options Optional configuration for the handler
 * @returns An instance of the appropriate error handler
 */
export function createErrorHandler(
  technology: DatabaseTechnology,
  options?: ErrorHandlerOptions
) {
  switch (technology) {
    case DatabaseTechnology.PRISMA:
      return new PrismaErrorHandler(options);
    case DatabaseTechnology.TIMESCALE:
      return new TimescaleErrorHandler();
    case DatabaseTechnology.REDIS:
      return new RedisErrorHandler(options);
    case DatabaseTechnology.GENERIC:
    default:
      return new CommonErrorHandler(options);
  }
}

/**
 * Detects the appropriate database technology from an error.
 * Useful for automatically selecting the right handler for an unknown error.
 * 
 * @param error The error to analyze
 * @returns The detected database technology or GENERIC if unknown
 */
export function detectDatabaseTechnology(error: unknown): DatabaseTechnology {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';
    
    // Check for Prisma-specific error patterns
    if (
      errorMessage.includes('prisma') ||
      errorStack.includes('prisma') ||
      'code' in error && typeof error.code === 'string' && error.code.startsWith('P')
    ) {
      return DatabaseTechnology.PRISMA;
    }
    
    // Check for TimescaleDB-specific error patterns
    if (
      errorMessage.includes('timescale') ||
      errorMessage.includes('hypertable') ||
      errorMessage.includes('chunk') ||
      errorStack.includes('timescale')
    ) {
      return DatabaseTechnology.TIMESCALE;
    }
    
    // Check for Redis-specific error patterns
    if (
      errorMessage.includes('redis') ||
      errorMessage.includes('cache') ||
      errorStack.includes('redis') ||
      errorStack.includes('ioredis')
    ) {
      return DatabaseTechnology.REDIS;
    }
  }
  
  // Default to generic handler if no specific technology is detected
  return DatabaseTechnology.GENERIC;
}

/**
 * Gets the appropriate error handler for a given error.
 * Automatically detects the database technology and creates the right handler.
 * 
 * @param error The error to get a handler for
 * @param options Optional configuration for the handler
 * @returns An instance of the appropriate error handler
 */
export function getErrorHandlerForError(
  error: unknown,
  options?: ErrorHandlerOptions
) {
  const technology = detectDatabaseTechnology(error);
  return createErrorHandler(technology, options);
}

/**
 * Type guard to check if an object is a valid error handler.
 * 
 * @param handler The object to check
 * @returns True if the object is a valid error handler
 */
export function isErrorHandler(handler: unknown): boolean {
  return (
    handler instanceof PrismaErrorHandler ||
    handler instanceof TimescaleErrorHandler ||
    handler instanceof RedisErrorHandler ||
    handler instanceof CommonErrorHandler
  );
}

/**
 * Base interface for all database error handlers.
 * Defines the common methods that all handlers must implement.
 */
export interface DatabaseErrorHandler {
  /**
   * Handles a database error, transforming it into a standardized DatabaseException.
   * 
   * @param error The error to handle
   * @param context Optional operation context for error enrichment
   * @returns A standardized DatabaseException
   */
  handleError(error: unknown, context?: Record<string, unknown>): Error;
  
  /**
   * Determines if this handler can process a given error.
   * 
   * @param error The error to check
   * @returns True if this handler can process the error
   */
  canHandle(error: unknown): boolean;
}