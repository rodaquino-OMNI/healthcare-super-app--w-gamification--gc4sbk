/**
 * @file Database Error Handling Module
 * @description Centralized exports for database error handling functionality.
 * This module provides a comprehensive set of tools for handling database errors
 * across different technologies (Prisma, Redis, TimescaleDB) with journey-specific
 * context and standardized error classification.
 *
 * The error handling system is organized into several components:
 * - Error Types: Enums and interfaces for error classification
 * - Error Codes: Standardized codes for consistent error reporting
 * - Exceptions: Specialized exception classes for different error categories
 * - Transformers: Utilities to convert low-level errors to domain exceptions
 * - Retry Strategies: Configurable policies for handling transient errors
 * - Handlers: Technology-specific error processors
 *
 * @example
 * // Import specific components
 * import { DatabaseErrorType, DatabaseException, transformPrismaError } from '@austa/database/errors';
 *
 * // Or import technology-specific handlers
 * import { PrismaErrorHandler } from '@austa/database/errors';
 */

// ===================================================================
// Type System - Foundation for error classification and metadata
// ===================================================================

/**
 * Error Types and Enums
 * @description Type definitions for database error classification and metadata
 * Includes:
 * - DatabaseErrorType: Categorizes errors (connection, query, transaction, etc.)
 * - DatabaseErrorSeverity: Classifies impact (critical, major, minor)
 * - DatabaseErrorRecoverability: Indicates if errors are transient or permanent
 * - DatabaseErrorContext: Structured metadata for error context
 */
export * from './database-error.types';

// ===================================================================
// Error Codes - Standardized identifiers for error reporting
// ===================================================================

/**
 * Error Codes
 * @description Standardized error codes for database operations
 * Organized by:
 * - Operation type (connection, query, transaction, integrity, configuration)
 * - Technology (PostgreSQL, Redis, TimescaleDB, S3)
 * - Journey context (health, care, plan, gamification)
 */
export * from './database-error.codes';

// ===================================================================
// Exception Classes - Domain-specific error representations
// ===================================================================

/**
 * Database Exceptions
 * @description Specialized exception classes for different database error categories
 * Includes:
 * - DatabaseException: Base class for all database errors
 * - ConnectionException: Database connection issues
 * - QueryException: Query syntax or execution problems
 * - TransactionException: Transaction management failures
 * - IntegrityException: Data integrity violations
 * - ConfigurationException: Database configuration errors
 */
export * from './database-error.exception';

// ===================================================================
// Transformation Utilities - Convert raw errors to domain exceptions
// ===================================================================

/**
 * Error Transformation Utilities
 * @description Utilities to transform low-level database errors into standardized exceptions
 * Includes transformers for:
 * - Prisma ORM errors
 * - Redis errors
 * - TypeORM errors
 * - Raw database errors
 * 
 * Each transformer enriches errors with context and classifies them appropriately.
 */
export * from './error-transformer';

// ===================================================================
// Retry Strategies - Policies for handling transient errors
// ===================================================================

/**
 * Retry Strategies
 * @description Configurable retry strategies for transient database errors
 * Includes:
 * - RetryStrategy interface
 * - ExponentialBackoffStrategy
 * - CircuitBreakerStrategy
 * - RetryStrategyFactory
 * 
 * These strategies ensure resilient database operations with appropriate
 * retry policies based on error type and operation context.
 */
export * from './retry-strategies';

// ===================================================================
// Error Handlers - Technology-specific error processors
// ===================================================================

/**
 * Error Handlers
 * @description Specialized handlers for different database technologies
 * Includes:
 * - PrismaErrorHandler: For PostgreSQL via Prisma ORM
 * - RedisErrorHandler: For Redis cache and session storage
 * - TimescaleErrorHandler: For TimescaleDB time-series data
 * - CommonErrorHandler: Fallback for generic database errors
 * 
 * These handlers identify, classify, and process technology-specific errors
 * into standardized DatabaseException instances with appropriate context.
 */
export * from './handlers';