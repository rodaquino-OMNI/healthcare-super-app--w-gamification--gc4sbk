/**
 * @file handlers/index.ts
 * @description Central barrel export file for database error handlers.
 * 
 * This file provides a unified entry point for accessing all specialized error handlers
 * for different database technologies used in the AUSTA SuperApp. It re-exports the
 * PrismaErrorHandler, TimescaleErrorHandler, RedisErrorHandler, and CommonErrorHandler classes,
 * enabling consistent imports across the application.
 */

// Export all error handlers
export { PrismaErrorHandler } from './prisma-error.handler';
export { TimescaleErrorHandler } from './timescale-error.handler';
export { RedisErrorHandler } from './redis-error.handler';
export { CommonErrorHandler } from './common-error.handler';

/**
 * Type for database error handler factory function.
 * Used to select the appropriate handler based on error type.
 */
export type ErrorHandlerFactory = (error: unknown) => ErrorHandler;

/**
 * Interface for database error handlers.
 * All specialized error handlers implement this interface.
 */
export interface ErrorHandler {
  /**
   * Handles a database error by transforming it into a standardized DatabaseException.
   * 
   * @param error The original error thrown by the database operation
   * @param context Additional context about the operation that caused the error
   * @returns A standardized DatabaseException with enriched context
   */
  handleError(error: unknown, context: Record<string, any>): Error;
  
  /**
   * Determines if this handler can process the given error.
   * 
   * @param error The error to check
   * @returns True if this handler can process the error
   */
  canHandle(error: unknown): boolean;
}

/**
 * Factory function to get the appropriate error handler for a given error.
 * 
 * @param error The error to handle
 * @param prismaHandler The Prisma error handler instance
 * @param redisHandler The Redis error handler instance
 * @param timescaleHandler The TimescaleDB error handler instance
 * @param commonHandler The common error handler instance
 * @returns The appropriate error handler for the given error
 */
export function getErrorHandler(
  error: unknown,
  prismaHandler: PrismaErrorHandler,
  redisHandler: RedisErrorHandler,
  timescaleHandler: TimescaleErrorHandler,
  commonHandler: CommonErrorHandler
): ErrorHandler {
  if (prismaHandler.canHandle(error)) {
    return prismaHandler;
  }
  
  if (redisHandler.canHandle(error)) {
    return redisHandler;
  }
  
  if (timescaleHandler.canHandle(error)) {
    return timescaleHandler;
  }
  
  // Default to common handler for all other errors
  return commonHandler;
}

/**
 * Utility function to determine if an error is from Prisma ORM.
 * 
 * @param error The error to check
 * @returns True if the error is from Prisma
 */
export function isPrismaError(error: unknown): boolean {
  return (
    // Check for Prisma error classes
    (typeof error === 'object' &&
     error !== null &&
     error.constructor?.name?.includes('Prisma')) ||
    // Check for Prisma error code pattern
    (typeof error === 'object' &&
     error !== null &&
     'code' in error &&
     typeof (error as any).code === 'string' &&
     /^P\d{4}$/.test((error as any).code))
  );
}

/**
 * Utility function to determine if an error is from Redis.
 * 
 * @param error The error to check
 * @returns True if the error is from Redis
 */
export function isRedisError(error: unknown): boolean {
  return (
    // Check for Redis error classes
    (typeof error === 'object' &&
     error !== null &&
     (error.constructor?.name?.includes('Redis') ||
      (error as any)?.name?.includes('Redis'))) ||
    // Check for Redis error message patterns
    (error instanceof Error &&
     (error.message.includes('ECONNREFUSED') ||
      error.message.includes('Redis connection') ||
      error.message.includes('Redis command')))
  );
}

/**
 * Utility function to determine if an error is from TimescaleDB.
 * 
 * @param error The error to check
 * @returns True if the error is from TimescaleDB
 */
export function isTimescaleError(error: unknown): boolean {
  return (
    // Check for TimescaleDB error message patterns
    (error instanceof Error &&
     (error.message.includes('timescale') ||
      error.message.includes('hypertable') ||
      error.message.includes('chunk'))) ||
    // Check for TimescaleDB error code pattern
    (typeof error === 'object' &&
     error !== null &&
     'code' in error &&
     typeof (error as any).code === 'string' &&
     /^TS\d{3}$/.test((error as any).code))
  );
}