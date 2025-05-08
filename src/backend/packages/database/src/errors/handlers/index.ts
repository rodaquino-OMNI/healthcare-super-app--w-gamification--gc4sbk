/**
 * Database Error Handlers Module
 * 
 * @file Centralized exports for database error handlers across different technologies.
 * @description This module provides specialized error handlers for different database
 * technologies used in the AUSTA SuperApp, including Prisma ORM (PostgreSQL),
 * TimescaleDB, Redis, and a common handler for generic database errors.
 * 
 * Each handler implements technology-specific error detection, classification,
 * and transformation into standardized DatabaseException instances with appropriate
 * context and recovery suggestions.
 * 
 * The module also provides utility functions for selecting the appropriate handler
 * based on error signature or database technology.
 * 
 * @example
 * // Import specific handlers
 * import { PrismaErrorHandler, RedisErrorHandler } from '@austa/database/errors/handlers';
 * 
 * // Or use the handler selection utility
 * import { getErrorHandlerForTechnology } from '@austa/database/errors/handlers';
 * 
 * const handler = getErrorHandlerForTechnology('prisma');
 * try {
 *   // Database operation
 * } catch (error) {
 *   handler.handleError(error, { journey: 'health', feature: 'metrics' });
 * }
 */

// Import types from the database error types module
import { 
  DatabaseErrorContext,
  DatabaseErrorClassification,
  JourneyContext,
  DatabaseOperationContext
} from '../database-error.types';

// ===================================================================
// Handler Interfaces - Common contract for all database error handlers
// ===================================================================

/**
 * Interface for database error handlers.
 * Defines the common contract that all database error handlers must implement.
 */
export interface IDatabaseErrorHandler {
  /**
   * Handles a database error by classifying it and transforming it into a standardized exception.
   * 
   * @param error - The original error to handle
   * @param context - Optional context information about the operation that caused the error
   * @returns A standardized error classification result
   */
  handleError(error: Error, context?: DatabaseErrorContext): DatabaseErrorClassification;
  
  /**
   * Determines if this handler can process the given error.
   * 
   * @param error - The error to check
   * @returns True if this handler can process the error, false otherwise
   */
  canHandle(error: Error): boolean;
  
  /**
   * Enriches an error with additional context information.
   * 
   * @param error - The error to enrich
   * @param context - Context information to add to the error
   * @returns The enriched error
   */
  enrichError(error: Error, context: DatabaseErrorContext): Error;
}

// ===================================================================
// Error Handlers - Technology-specific implementations
// ===================================================================

/**
 * Prisma Error Handler
 * @description Specialized handler for Prisma ORM exceptions in PostgreSQL database operations.
 * 
 * This handler analyzes Prisma-specific error codes and properties to accurately classify
 * errors into connection, query, transaction, or data integrity categories and transforms
 * them into standardized DatabaseException types with appropriate error codes and recovery
 * strategies.
 * 
 * It includes specialized handling for unique constraint violations, foreign key conflicts,
 * and connection timeouts, enriching errors with operation context for better debugging.
 */
export { default as PrismaErrorHandler } from './prisma-error.handler';

/**
 * TimescaleDB Error Handler
 * @description Specialized handler for TimescaleDB operations used in health metrics and time-series data storage.
 * 
 * This handler identifies TimescaleDB-specific error patterns and codes, classifying them into
 * appropriate categories with emphasis on time-series specific issues like chunk insertion errors,
 * retention policy conflicts, and hypertable configuration problems.
 * 
 * It enriches errors with temporal context including time range, aggregation level, and
 * partitioning information for effective troubleshooting.
 */
export { default as TimescaleErrorHandler } from './timescale-error.handler';

/**
 * Redis Error Handler
 * @description Specialized handler for Redis cache and session storage operations.
 * 
 * This handler identifies and classifies Redis-specific errors like connection issues,
 * command errors, and cluster failures, converting them to standardized DatabaseException
 * types with appropriate error codes.
 * 
 * It implements specialized retry logic for transient Redis errors with configurable
 * backoff strategies and handles Redis Cluster-specific scenarios.
 */
export { default as RedisErrorHandler } from './redis-error.handler';

/**
 * Common Error Handler
 * @description Fallback handler for generic database errors not covered by technology-specific handlers.
 * 
 * This common handler processes standard SQL errors, connection issues, and general database
 * exceptions across all storage technologies. It implements a base classification system that
 * identifies common patterns like timeouts, authentication failures, and resource exhaustion
 * across different database systems.
 */
export { default as CommonErrorHandler } from './common-error.handler';

// ===================================================================
// Utility Functions - Helper functions for handler selection and usage
// ===================================================================

/**
 * Database technologies supported by the error handlers.
 */
export type SupportedDatabaseTechnology = 'prisma' | 'timescale' | 'redis' | 'common';

/**
 * Gets the appropriate error handler for the specified database technology.
 * 
 * @param technology - The database technology to get a handler for
 * @returns The appropriate error handler for the specified technology
 * @throws Error if an unsupported technology is specified
 */
export function getErrorHandlerForTechnology(technology: SupportedDatabaseTechnology): IDatabaseErrorHandler {
  switch (technology.toLowerCase()) {
    case 'prisma':
      return new (require('./prisma-error.handler').default)();
    case 'timescale':
      return new (require('./timescale-error.handler').default)();
    case 'redis':
      return new (require('./redis-error.handler').default)();
    case 'common':
      return new (require('./common-error.handler').default)();
    default:
      throw new Error(`Unsupported database technology: ${technology}`);
  }
}

/**
 * Gets the appropriate error handler for the given error based on its signature.
 * Automatically detects the error type and returns the appropriate handler.
 * 
 * @param error - The error to get a handler for
 * @returns The appropriate error handler for the error
 */
export function getErrorHandlerForError(error: Error): IDatabaseErrorHandler {
  // Try each handler in order of specificity
  const prismaHandler = new (require('./prisma-error.handler').default)();
  if (prismaHandler.canHandle(error)) {
    return prismaHandler;
  }
  
  const redisHandler = new (require('./redis-error.handler').default)();
  if (redisHandler.canHandle(error)) {
    return redisHandler;
  }
  
  const timescaleHandler = new (require('./timescale-error.handler').default)();
  if (timescaleHandler.canHandle(error)) {
    return timescaleHandler;
  }
  
  // Fall back to the common handler if no specific handler can handle the error
  return new (require('./common-error.handler').default)();
}

/**
 * Creates a journey-specific error context object for use with error handlers.
 * 
 * @param journey - The journey where the error occurred
 * @param feature - The specific feature within the journey
 * @param userId - Optional user ID associated with the operation
 * @param additionalContext - Any additional context information
 * @returns A journey context object
 */
export function createJourneyErrorContext(
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
 * Creates a database operation context object for use with error handlers.
 * 
 * @param operation - The type of operation being performed
 * @param entity - The target entity or table name
 * @param query - The query or command being executed
 * @param params - Parameters used in the query
 * @returns A database operation context object
 */
export function createOperationErrorContext(
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

/**
 * Creates a complete database error context by combining journey and operation contexts.
 * 
 * @param journeyContext - Journey-specific context information
 * @param operationContext - Database operation context information
 * @returns A complete database error context object
 */
export function createDatabaseErrorContext(
  journeyContext: JourneyContext,
  operationContext: DatabaseOperationContext
): DatabaseErrorContext {
  return {
    journey: journeyContext.journey as any,
    feature: journeyContext.feature,
    userId: journeyContext.userId,
    operation: operationContext.operation,
    entity: operationContext.entity,
    query: operationContext.query,
    params: operationContext.params,
    metadata: { ...journeyContext, ...operationContext }
  };
}

/**
 * Handles a database error using the appropriate handler based on the error signature.
 * 
 * @param error - The error to handle
 * @param context - Optional context information about the operation that caused the error
 * @returns A standardized error classification result
 */
export function handleDatabaseError(
  error: Error,
  context?: DatabaseErrorContext
): DatabaseErrorClassification {
  const handler = getErrorHandlerForError(error);
  return handler.handleError(error, context);
}

/**
 * Determines if an error is a database-specific error that can be handled by one of the handlers.
 * 
 * @param error - The error to check
 * @returns True if the error is a database-specific error, false otherwise
 */
export function isDatabaseError(error: Error): boolean {
  return [
    new (require('./prisma-error.handler').default)(),
    new (require('./redis-error.handler').default)(),
    new (require('./timescale-error.handler').default)(),
    new (require('./common-error.handler').default)()
  ].some(handler => handler.canHandle(error));
}