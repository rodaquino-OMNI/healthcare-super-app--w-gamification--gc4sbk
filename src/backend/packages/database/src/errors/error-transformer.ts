/**
 * @file error-transformer.ts
 * @description Provides utilities to transform low-level database errors from various technologies 
 * into standardized DatabaseException instances. Includes transformer functions for Prisma, Redis, 
 * TypeORM, and raw database errors, ensuring consistent error handling across the application.
 */

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RedisError } from 'redis';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

import { 
  DatabaseErrorType, 
  DatabaseErrorSeverity, 
  DatabaseErrorRecoverability,
  DatabaseErrorContext,
  JourneyType
} from './database-error.types';

import {
  DatabaseException,
  ConnectionException,
  QueryException,
  TransactionException,
  IntegrityException,
  ConfigurationException
} from './database-error.exception';

import { 
  DB_CONN_FAILED,
  DB_CONN_TIMEOUT,
  DB_QUERY_FAILED,
  DB_QUERY_TIMEOUT,
  DB_TRANSACTION_FAILED,
  DB_INTEGRITY_CONSTRAINT,
  DB_INTEGRITY_FOREIGN_KEY,
  DB_INTEGRITY_UNIQUE,
  DB_CONFIG_INVALID
} from './database-error.codes';

import { PrismaErrorHandler } from './handlers/prisma-error.handler';
import { RedisErrorHandler } from './handlers/redis-error.handler';
import { TimescaleErrorHandler } from './handlers/timescale-error.handler';
import { CommonErrorHandler } from './handlers/common-error.handler';

/**
 * Interface for database operation context that provides additional information about the operation
 * that caused the error. This context is used to enrich the error with details for better debugging.
 */
export interface DatabaseOperationContext {
  /** The name of the operation being performed (e.g., 'findUser', 'createAppointment') */
  operation: string;
  
  /** The entity or model being operated on (e.g., 'User', 'Appointment') */
  entity?: string;
  
  /** The query or command being executed when the error occurred */
  query?: string;
  
  /** Parameters passed to the query or command */
  params?: Record<string, any>;
  
  /** The journey context in which the operation was performed */
  journey?: JourneyType;
  
  /** Additional metadata relevant to the operation */
  metadata?: Record<string, any>;
}

/**
 * Service responsible for transforming low-level database errors from various technologies
 * into standardized DatabaseException instances. This ensures consistent error handling,
 * appropriate recovery strategies, and clear error messages across the application.
 */
@Injectable()
export class ErrorTransformer {
  constructor(
    private readonly prismaErrorHandler: PrismaErrorHandler,
    private readonly redisErrorHandler: RedisErrorHandler,
    private readonly timescaleErrorHandler: TimescaleErrorHandler,
    private readonly commonErrorHandler: CommonErrorHandler
  ) {}

  /**
   * Transforms any database error into a standardized DatabaseException.
   * This method detects the error type and delegates to the appropriate specialized transformer.
   * 
   * @param error The original error thrown by the database operation
   * @param context Additional context about the operation that caused the error
   * @returns A standardized DatabaseException with enriched context
   */
  public transform(error: unknown, context: DatabaseOperationContext): DatabaseException {
    // Validate input to ensure we have a proper error object
    if (!error) {
      return new DatabaseException(
        'Unknown database error occurred',
        DB_QUERY_FAILED,
        { 
          errorType: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.UNKNOWN,
          originalError: new Error('No error provided'),
          context: this.createErrorContext(context)
        }
      );
    }

    // Transform based on error type
    if (this.isPrismaError(error)) {
      return this.transformPrismaError(error, context);
    } else if (this.isRedisError(error)) {
      return this.transformRedisError(error, context);
    } else if (this.isTypeOrmError(error)) {
      return this.transformTypeOrmError(error, context);
    } else if (this.isTimescaleError(error)) {
      return this.transformTimescaleError(error, context);
    } else {
      // For unknown database errors, use the common handler
      return this.transformGenericError(error, context);
    }
  }

  /**
   * Transforms Prisma ORM errors into standardized DatabaseException instances.
   * 
   * @param error The Prisma error thrown by the database operation
   * @param context Additional context about the operation that caused the error
   * @returns A standardized DatabaseException with enriched context
   */
  public transformPrismaError(error: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientUnknownRequestError | Prisma.PrismaClientRustPanicError | Prisma.PrismaClientInitializationError | Prisma.PrismaClientValidationError, context: DatabaseOperationContext): DatabaseException {
    return this.prismaErrorHandler.handleError(error, this.createErrorContext(context));
  }

  /**
   * Transforms Redis errors into standardized DatabaseException instances.
   * 
   * @param error The Redis error thrown by the cache operation
   * @param context Additional context about the operation that caused the error
   * @returns A standardized DatabaseException with enriched context
   */
  public transformRedisError(error: RedisError, context: DatabaseOperationContext): DatabaseException {
    return this.redisErrorHandler.handleError(error, this.createErrorContext(context));
  }

  /**
   * Transforms TypeORM errors into standardized DatabaseException instances.
   * 
   * @param error The TypeORM error thrown by the database operation
   * @param context Additional context about the operation that caused the error
   * @returns A standardized DatabaseException with enriched context
   */
  public transformTypeOrmError(error: QueryFailedError | EntityNotFoundError, context: DatabaseOperationContext): DatabaseException {
    // TypeORM errors are handled by the common handler as they follow standard SQL error patterns
    return this.commonErrorHandler.handleError(error, this.createErrorContext(context));
  }

  /**
   * Transforms TimescaleDB-specific errors into standardized DatabaseException instances.
   * 
   * @param error The TimescaleDB error thrown by the time-series operation
   * @param context Additional context about the operation that caused the error
   * @returns A standardized DatabaseException with enriched context
   */
  public transformTimescaleError(error: Error, context: DatabaseOperationContext): DatabaseException {
    return this.timescaleErrorHandler.handleError(error, this.createErrorContext(context));
  }

  /**
   * Transforms generic database errors into standardized DatabaseException instances.
   * 
   * @param error The generic error thrown by the database operation
   * @param context Additional context about the operation that caused the error
   * @returns A standardized DatabaseException with enriched context
   */
  public transformGenericError(error: unknown, context: DatabaseOperationContext): DatabaseException {
    return this.commonErrorHandler.handleError(error, this.createErrorContext(context));
  }

  /**
   * Creates a standardized error context object from the operation context.
   * 
   * @param context The operation context provided by the caller
   * @returns A standardized DatabaseErrorContext object
   */
  private createErrorContext(context: DatabaseOperationContext): DatabaseErrorContext {
    return {
      operation: context.operation,
      entity: context.entity || 'unknown',
      query: context.query,
      params: context.params,
      journey: context.journey,
      timestamp: new Date(),
      metadata: context.metadata || {}
    };
  }

  /**
   * Type guard to check if an error is a Prisma error.
   */
  private isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError | 
    Prisma.PrismaClientUnknownRequestError | 
    Prisma.PrismaClientRustPanicError | 
    Prisma.PrismaClientInitializationError | 
    Prisma.PrismaClientValidationError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientUnknownRequestError ||
      error instanceof Prisma.PrismaClientRustPanicError ||
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientValidationError ||
      // Also check for error code pattern as Prisma errors might be serialized/deserialized
      (typeof error === 'object' && 
       error !== null && 
       'code' in error && 
       typeof error.code === 'string' && 
       /^P\d{4}$/.test(error.code))
    );
  }

  /**
   * Type guard to check if an error is a Redis error.
   */
  private isRedisError(error: unknown): error is RedisError {
    return (
      error instanceof RedisError ||
      // Also check for error name pattern as Redis errors might be serialized/deserialized
      (typeof error === 'object' && 
       error !== null && 
       'name' in error && 
       typeof error.name === 'string' && 
       error.name.includes('Redis'))
    );
  }

  /**
   * Type guard to check if an error is a TypeORM error.
   */
  private isTypeOrmError(error: unknown): error is QueryFailedError | EntityNotFoundError {
    return (
      error instanceof QueryFailedError ||
      error instanceof EntityNotFoundError ||
      // Also check for error properties that are specific to TypeORM
      (typeof error === 'object' && 
       error !== null && 
       (('driverError' in error && 'query' in error) || // QueryFailedError
        ('entityName' in error && 'message' in error && typeof error.message === 'string' && 
         error.message.includes('could not find'))) // EntityNotFoundError
      )
    );
  }

  /**
   * Type guard to check if an error is a TimescaleDB-specific error.
   */
  private isTimescaleError(error: unknown): error is Error {
    // TimescaleDB errors often have specific error codes or messages
    return (
      typeof error === 'object' && 
      error !== null && 
      'message' in error && 
      typeof error.message === 'string' && 
      (error.message.includes('timescale') || 
       error.message.includes('hypertable') || 
       error.message.includes('chunk') ||
       // Check for specific error code pattern used by TimescaleDB
       ('code' in error && 
        typeof error.code === 'string' && 
        /^TS\d{3}$/.test(error.code)))
    );
  }

  /**
   * Creates a validation error for database operations with invalid input.
   * 
   * @param message The error message describing the validation failure
   * @param context The operation context
   * @param validationErrors Optional detailed validation errors
   * @returns A QueryException with validation context
   */
  public createValidationError(
    message: string, 
    context: DatabaseOperationContext, 
    validationErrors?: Record<string, string[]>
  ): QueryException {
    return new QueryException(
      message,
      DB_QUERY_FAILED,
      {
        errorType: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.RECOVERABLE,
        originalError: new Error(message),
        context: this.createErrorContext({
          ...context,
          metadata: {
            ...context.metadata,
            validationErrors
          }
        })
      }
    );
  }

  /**
   * Creates a data integrity error for database operations that violate integrity constraints.
   * 
   * @param message The error message describing the integrity violation
   * @param context The operation context
   * @param constraintName Optional name of the violated constraint
   * @returns An IntegrityException with constraint context
   */
  public createIntegrityError(
    message: string, 
    context: DatabaseOperationContext, 
    constraintName?: string
  ): IntegrityException {
    return new IntegrityException(
      message,
      DB_INTEGRITY_CONSTRAINT,
      {
        errorType: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.RECOVERABLE,
        originalError: new Error(message),
        context: this.createErrorContext({
          ...context,
          metadata: {
            ...context.metadata,
            constraintName
          }
        })
      }
    );
  }

  /**
   * Creates a connection error for database operations that fail due to connection issues.
   * 
   * @param message The error message describing the connection issue
   * @param context The operation context
   * @returns A ConnectionException with connection context
   */
  public createConnectionError(
    message: string, 
    context: DatabaseOperationContext
  ): ConnectionException {
    return new ConnectionException(
      message,
      DB_CONN_FAILED,
      {
        errorType: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE,
        originalError: new Error(message),
        context: this.createErrorContext(context)
      }
    );
  }

  /**
   * Creates a transaction error for database operations that fail within a transaction.
   * 
   * @param message The error message describing the transaction issue
   * @param context The operation context
   * @returns A TransactionException with transaction context
   */
  public createTransactionError(
    message: string, 
    context: DatabaseOperationContext
  ): TransactionException {
    return new TransactionException(
      message,
      DB_TRANSACTION_FAILED,
      {
        errorType: DatabaseErrorType.TRANSACTION,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE,
        originalError: new Error(message),
        context: this.createErrorContext(context)
      }
    );
  }

  /**
   * Creates a configuration error for database operations that fail due to configuration issues.
   * 
   * @param message The error message describing the configuration issue
   * @param context The operation context
   * @returns A ConfigurationException with configuration context
   */
  public createConfigurationError(
    message: string, 
    context: DatabaseOperationContext
  ): ConfigurationException {
    return new ConfigurationException(
      message,
      DB_CONFIG_INVALID,
      {
        errorType: DatabaseErrorType.CONFIGURATION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.NON_RECOVERABLE,
        originalError: new Error(message),
        context: this.createErrorContext(context)
      }
    );
  }

  /**
   * Enriches an existing database exception with additional context.
   * 
   * @param error The existing database exception
   * @param additionalContext Additional context to merge with the existing context
   * @returns The enriched database exception
   */
  public enrichError(
    error: DatabaseException, 
    additionalContext: Partial<DatabaseOperationContext>
  ): DatabaseException {
    // Create a new context by merging the existing context with the additional context
    const existingContext = error.getContext();
    const mergedContext: DatabaseErrorContext = {
      ...existingContext,
      metadata: {
        ...existingContext.metadata,
        ...additionalContext.metadata
      },
      // Override other properties if provided
      operation: additionalContext.operation || existingContext.operation,
      entity: additionalContext.entity || existingContext.entity,
      query: additionalContext.query || existingContext.query,
      params: additionalContext.params || existingContext.params,
      journey: additionalContext.journey || existingContext.journey,
      timestamp: existingContext.timestamp
    };

    // Create a new error with the merged context
    const enrichedError = new DatabaseException(
      error.message,
      error.getCode(),
      {
        errorType: error.getErrorType(),
        severity: error.getSeverity(),
        recoverability: error.getRecoverability(),
        originalError: error.getOriginalError(),
        context: mergedContext
      }
    );

    return enrichedError;
  }

  /**
   * Determines if an error is likely to be transient and could be resolved by retrying.
   * 
   * @param error The database exception to check
   * @returns True if the error is potentially recoverable through retry
   */
  public isTransientError(error: DatabaseException): boolean {
    // Check if the error is explicitly marked as recoverable or potentially recoverable
    const recoverability = error.getRecoverability();
    if (
      recoverability === DatabaseErrorRecoverability.RECOVERABLE ||
      recoverability === DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE
    ) {
      // Check specific error types that are typically transient
      const errorType = error.getErrorType();
      const errorCode = error.getCode();
      
      // Connection timeouts, deadlocks, and temporary resource constraints are typically transient
      return (
        errorType === DatabaseErrorType.CONNECTION ||
        errorCode === DB_CONN_TIMEOUT ||
        errorCode === DB_QUERY_TIMEOUT ||
        // Check error message for common transient error patterns
        error.message.includes('timeout') ||
        error.message.includes('deadlock') ||
        error.message.includes('too many connections') ||
        error.message.includes('connection reset') ||
        error.message.includes('temporarily unavailable')
      );
    }
    
    return false;
  }

  /**
   * Determines if an error is related to data integrity and could be resolved by fixing the input data.
   * 
   * @param error The database exception to check
   * @returns True if the error is related to data integrity
   */
  public isIntegrityError(error: DatabaseException): boolean {
    return (
      error.getErrorType() === DatabaseErrorType.INTEGRITY ||
      error.getCode() === DB_INTEGRITY_CONSTRAINT ||
      error.getCode() === DB_INTEGRITY_FOREIGN_KEY ||
      error.getCode() === DB_INTEGRITY_UNIQUE
    );
  }

  /**
   * Determines if an error is critical and requires immediate attention.
   * 
   * @param error The database exception to check
   * @returns True if the error is critical
   */
  public isCriticalError(error: DatabaseException): boolean {
    return (
      error.getSeverity() === DatabaseErrorSeverity.CRITICAL ||
      error.getRecoverability() === DatabaseErrorRecoverability.NON_RECOVERABLE ||
      error.getErrorType() === DatabaseErrorType.CONFIGURATION
    );
  }
}