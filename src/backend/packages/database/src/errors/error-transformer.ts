import { ErrorType } from '@app/shared/exceptions/exceptions.types';
import { z } from 'zod';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

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
}

/**
 * Base class for database exceptions.
 * Extends AppException to provide standardized error handling for database errors.
 */
export class DatabaseException extends Error {
  /**
   * Creates a new DatabaseException instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of database error
   * @param code - Error code for more specific categorization
   * @param severity - Severity of the error
   * @param recoverability - Whether the error is recoverable
   * @param context - Additional context about the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    public readonly message: string,
    public readonly type: DatabaseErrorType,
    public readonly code: string,
    public readonly severity: DatabaseErrorSeverity,
    public readonly recoverability: DatabaseErrorRecoverability,
    public readonly context?: DatabaseErrorContext,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DatabaseException.prototype);
  }

  /**
   * Maps the database error type to the application error type.
   * Used for consistent error handling across the application.
   * 
   * @returns The corresponding application ErrorType
   */
  toErrorType(): ErrorType {
    switch (this.type) {
      case DatabaseErrorType.INTEGRITY:
        return ErrorType.VALIDATION;
      case DatabaseErrorType.QUERY:
        return ErrorType.BUSINESS;
      case DatabaseErrorType.CONNECTION:
      case DatabaseErrorType.TRANSACTION:
      case DatabaseErrorType.CONFIGURATION:
      default:
        return ErrorType.TECHNICAL;
    }
  }

  /**
   * Returns a JSON representation of the exception.
   * Used for consistent error responses across the application.
   * 
   * @returns JSON object with standardized error structure
   */
  toJSON(): Record<string, any> {
    return {
      error: {
        type: this.type,
        code: this.code,
        message: this.message,
        severity: this.severity,
        recoverability: this.recoverability,
        details: this.context
      }
    };
  }
}

/**
 * Database error codes organized by error type.
 * Provides standardized error codes for database exceptions.
 */
export const DATABASE_ERROR_CODES = {
  // Connection errors
  CONNECTION_FAILED: 'DB_CONN_001',
  CONNECTION_TIMEOUT: 'DB_CONN_002',
  CONNECTION_LIMIT_REACHED: 'DB_CONN_003',
  CONNECTION_AUTHENTICATION_FAILED: 'DB_CONN_004',
  
  // Query errors
  QUERY_SYNTAX_ERROR: 'DB_QUERY_001',
  QUERY_TIMEOUT: 'DB_QUERY_002',
  QUERY_EXECUTION_FAILED: 'DB_QUERY_003',
  QUERY_INVALID_PARAMS: 'DB_QUERY_004',
  
  // Transaction errors
  TRANSACTION_FAILED: 'DB_TRANS_001',
  TRANSACTION_TIMEOUT: 'DB_TRANS_002',
  TRANSACTION_DEADLOCK: 'DB_TRANS_003',
  TRANSACTION_SERIALIZATION_FAILED: 'DB_TRANS_004',
  
  // Data integrity errors
  INTEGRITY_UNIQUE_CONSTRAINT: 'DB_INTEG_001',
  INTEGRITY_FOREIGN_KEY: 'DB_INTEG_002',
  INTEGRITY_CHECK_CONSTRAINT: 'DB_INTEG_003',
  INTEGRITY_NOT_NULL: 'DB_INTEG_004',
  
  // Configuration errors
  CONFIG_INVALID_SETTINGS: 'DB_CONFIG_001',
  CONFIG_MISSING_SCHEMA: 'DB_CONFIG_002',
  CONFIG_INCOMPATIBLE_VERSION: 'DB_CONFIG_003',
  CONFIG_RESOURCE_LIMIT: 'DB_CONFIG_004',
  
  // Journey-specific error codes
  HEALTH_METRICS_STORAGE_FAILED: 'DB_HEALTH_001',
  HEALTH_DEVICE_DATA_INTEGRITY: 'DB_HEALTH_002',
  CARE_APPOINTMENT_CONFLICT: 'DB_CARE_001',
  CARE_PROVIDER_DATA_INTEGRITY: 'DB_CARE_002',
  PLAN_CLAIM_DATA_INTEGRITY: 'DB_PLAN_001',
  PLAN_BENEFIT_CONFLICT: 'DB_PLAN_002',
  GAME_EVENT_STORAGE_FAILED: 'DB_GAME_001',
  GAME_ACHIEVEMENT_CONFLICT: 'DB_GAME_002'
};

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
}

/**
 * Abstract base class for database error transformers.
 * Provides common functionality for transforming database errors.
 */
export abstract class ErrorTransformer {
  /**
   * Creates a new ErrorTransformer instance.
   * 
   * @param options - Configuration options for error transformation
   */
  constructor(protected readonly options: ErrorTransformerOptions = {}) {}

  /**
   * Transforms a database error into a standardized DatabaseException.
   * 
   * @param error - The original database error
   * @param context - Additional context about the error
   * @returns A standardized DatabaseException
   */
  abstract transform(error: Error, context?: DatabaseErrorContext): DatabaseException;

  /**
   * Classifies a database error based on its properties.
   * 
   * @param error - The original database error
   * @param context - Additional context about the error
   * @returns A classification result with type, severity, and recoverability
   */
  protected abstract classify(error: Error, context?: DatabaseErrorContext): DatabaseErrorClassification;

  /**
   * Enriches error context with additional information.
   * 
   * @param context - The original error context
   * @param error - The original database error
   * @returns Enriched error context
   */
  protected enrichContext(context: DatabaseErrorContext = {}, error: Error): DatabaseErrorContext {
    const enriched: DatabaseErrorContext = { ...context };
    
    // Filter sensitive data if configured
    if (!this.options.includeSensitiveData && enriched.params) {
      enriched.params = this.filterSensitiveData(enriched.params);
    }
    
    // Add stack trace if configured
    if (this.options.includeStackTrace) {
      enriched.metadata = {
        ...enriched.metadata,
        stackTrace: error.stack
      };
    }
    
    return enriched;
  }

  /**
   * Filters sensitive data from error context.
   * 
   * @param data - The data to filter
   * @returns Filtered data with sensitive information removed
   */
  protected filterSensitiveData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    const filtered = { ...data };
    
    for (const key of Object.keys(filtered)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        filtered[key] = '[REDACTED]';
      } else if (typeof filtered[key] === 'object' && filtered[key] !== null) {
        filtered[key] = this.filterSensitiveData(filtered[key]);
      }
    }
    
    return filtered;
  }

  /**
   * Validates data against a schema using Zod.
   * 
   * @param data - The data to validate
   * @param schema - The Zod schema to validate against
   * @returns Validation result with errors if any
   */
  protected validateWithZod<T>(data: any, schema: z.ZodType<T>): { success: boolean; data?: T; errors?: z.ZodError } {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error };
      }
      throw error;
    }
  }

  /**
   * Validates data against a class using class-validator.
   * 
   * @param data - The data to validate
   * @param cls - The class to validate against
   * @returns Validation result with errors if any
   */
  protected async validateWithClassValidator<T extends object>(data: any, cls: new () => T): Promise<{ success: boolean; data?: T; errors?: any[] }> {
    const instance = plainToClass(cls, data);
    const errors = await validate(instance);
    
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    return { success: true, data: instance };
  }
}

/**
 * Transformer for Prisma database errors.
 * Specializes in transforming Prisma-specific errors into standardized DatabaseExceptions.
 */
export class PrismaErrorTransformer extends ErrorTransformer {
  /**
   * Transforms a Prisma error into a standardized DatabaseException.
   * 
   * @param error - The original Prisma error
   * @param context - Additional context about the error
   * @returns A standardized DatabaseException
   */
  transform(error: Error, context?: DatabaseErrorContext): DatabaseException {
    const enrichedContext = this.enrichContext(context, error);
    const classification = this.classify(error, enrichedContext);
    
    return new DatabaseException(
      classification.message,
      classification.type,
      classification.code,
      classification.severity,
      classification.recoverability,
      enrichedContext,
      error
    );
  }

  /**
   * Classifies a Prisma error based on its properties.
   * 
   * @param error - The original Prisma error
   * @param context - Additional context about the error
   * @returns A classification result with type, severity, and recoverability
   */
  protected classify(error: Error, context?: DatabaseErrorContext): DatabaseErrorClassification {
    // Handle known Prisma request errors (P1XXX, P2XXX, P3XXX)
    if (error instanceof PrismaClientKnownRequestError) {
      return this.classifyKnownRequestError(error, context);
    }
    
    // Handle Prisma validation errors
    if (error instanceof PrismaClientValidationError) {
      return this.classifyValidationError(error, context);
    }
    
    // Handle unknown Prisma request errors
    if (error instanceof PrismaClientUnknownRequestError) {
      return this.classifyUnknownRequestError(error, context);
    }
    
    // Default classification for other errors
    return {
      type: DatabaseErrorType.QUERY,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
      message: `Database operation failed: ${error.message}`,
      details: { originalError: error.message }
    };
  }

  /**
   * Classifies a known Prisma request error.
   * 
   * @param error - The Prisma known request error
   * @param context - Additional context about the error
   * @returns A classification result
   */
  private classifyKnownRequestError(
    error: PrismaClientKnownRequestError,
    context?: DatabaseErrorContext
  ): DatabaseErrorClassification {
    const { code, meta, message } = error;
    
    // P1: Query engine errors
    if (code.startsWith('P1')) {
      return this.classifyQueryEngineError(code, message, meta, context);
    }
    
    // P2: Database errors
    if (code.startsWith('P2')) {
      return this.classifyDatabaseError(code, message, meta, context);
    }
    
    // P3: Prisma client errors
    if (code.startsWith('P3')) {
      return this.classifyClientError(code, message, meta, context);
    }
    
    // Default classification
    return {
      type: DatabaseErrorType.QUERY,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
      message: `Database operation failed with code ${code}: ${message}`,
      details: { prismaCode: code, meta }
    };
  }

  /**
   * Classifies a Prisma query engine error (P1XXX).
   * 
   * @param code - The Prisma error code
   * @param message - The error message
   * @param meta - Additional metadata about the error
   * @param context - Additional context about the error
   * @returns A classification result
   */
  private classifyQueryEngineError(
    code: string,
    message: string,
    meta: any,
    context?: DatabaseErrorContext
  ): DatabaseErrorClassification {
    switch (code) {
      case 'P1000':
        return {
          type: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
          message: 'Failed to connect to the database server',
          details: { prismaCode: code, meta }
        };
      case 'P1001':
        return {
          type: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
          message: 'Database server is unreachable',
          details: { prismaCode: code, meta }
        };
      case 'P1002':
        return {
          type: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: DATABASE_ERROR_CODES.CONNECTION_TIMEOUT,
          message: 'Database connection timed out',
          details: { prismaCode: code, meta }
        };
      case 'P1003':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_MISSING_SCHEMA,
          message: 'Database schema does not exist',
          details: { prismaCode: code, meta }
        };
      case 'P1008':
        return {
          type: DatabaseErrorType.TRANSACTION,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: DATABASE_ERROR_CODES.TRANSACTION_TIMEOUT,
          message: 'Database operation timed out',
          details: { prismaCode: code, meta }
        };
      case 'P1009':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Database schema is invalid',
          details: { prismaCode: code, meta }
        };
      case 'P1010':
        return {
          type: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONNECTION_AUTHENTICATION_FAILED,
          message: 'Database authentication failed',
          details: { prismaCode: code, meta }
        };
      case 'P1011':
        return {
          type: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
          message: 'Error opening a TLS connection',
          details: { prismaCode: code, meta }
        };
      case 'P1012':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Prisma schema validation error',
          details: { prismaCode: code, meta }
        };
      case 'P1013':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_INVALID_PARAMS,
          message: 'The provided database string is invalid',
          details: { prismaCode: code, meta }
        };
      case 'P1014':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Underlying model does not exist',
          details: { prismaCode: code, meta }
        };
      case 'P1015':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Prisma schema is invalid',
          details: { prismaCode: code, meta }
        };
      default:
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
          message: `Query engine error: ${message}`,
          details: { prismaCode: code, meta }
        };
    }
  }

  /**
   * Classifies a Prisma database error (P2XXX).
   * 
   * @param code - The Prisma error code
   * @param message - The error message
   * @param meta - Additional metadata about the error
   * @param context - Additional context about the error
   * @returns A classification result
   */
  private classifyDatabaseError(
    code: string,
    message: string,
    meta: any,
    context?: DatabaseErrorContext
  ): DatabaseErrorClassification {
    switch (code) {
      case 'P2000':
        return {
          type: DatabaseErrorType.INTEGRITY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.INTEGRITY_CHECK_CONSTRAINT,
          message: 'The provided value is too long for the field',
          details: { prismaCode: code, meta }
        };
      case 'P2001':
        return {
          type: DatabaseErrorType.INTEGRITY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.INTEGRITY_FOREIGN_KEY,
          message: 'The record does not exist',
          details: { prismaCode: code, meta }
        };
      case 'P2002':
        return {
          type: DatabaseErrorType.INTEGRITY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.INTEGRITY_UNIQUE_CONSTRAINT,
          message: 'Unique constraint violation',
          details: { prismaCode: code, meta }
        };
      case 'P2003':
        return {
          type: DatabaseErrorType.INTEGRITY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.INTEGRITY_FOREIGN_KEY,
          message: 'Foreign key constraint violation',
          details: { prismaCode: code, meta }
        };
      case 'P2004':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_MISSING_SCHEMA,
          message: 'A constraint failed on the database',
          details: { prismaCode: code, meta }
        };
      case 'P2005':
        return {
          type: DatabaseErrorType.INTEGRITY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.INTEGRITY_CHECK_CONSTRAINT,
          message: 'The value is invalid for the field type',
          details: { prismaCode: code, meta }
        };
      case 'P2006':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_INVALID_PARAMS,
          message: 'The provided value is not valid',
          details: { prismaCode: code, meta }
        };
      case 'P2007':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_INVALID_PARAMS,
          message: 'Data validation error',
          details: { prismaCode: code, meta }
        };
      case 'P2008':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
          message: 'Failed to parse the query',
          details: { prismaCode: code, meta }
        };
      case 'P2009':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_INVALID_PARAMS,
          message: 'Failed to validate the query',
          details: { prismaCode: code, meta }
        };
      case 'P2010':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
          message: 'Raw query failed',
          details: { prismaCode: code, meta }
        };
      case 'P2011':
        return {
          type: DatabaseErrorType.INTEGRITY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.INTEGRITY_NOT_NULL,
          message: 'Null constraint violation',
          details: { prismaCode: code, meta }
        };
      case 'P2012':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_INVALID_PARAMS,
          message: 'Missing required field',
          details: { prismaCode: code, meta }
        };
      case 'P2013':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_INVALID_PARAMS,
          message: 'Missing required argument',
          details: { prismaCode: code, meta }
        };
      case 'P2014':
        return {
          type: DatabaseErrorType.INTEGRITY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.INTEGRITY_FOREIGN_KEY,
          message: 'The change would violate a relation constraint',
          details: { prismaCode: code, meta }
        };
      case 'P2015':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
          message: 'A related record could not be found',
          details: { prismaCode: code, meta }
        };
      case 'P2016':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_INVALID_PARAMS,
          message: 'Query interpretation error',
          details: { prismaCode: code, meta }
        };
      case 'P2017':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_INVALID_PARAMS,
          message: 'The records for the relation are not connected',
          details: { prismaCode: code, meta }
        };
      case 'P2018':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
          message: 'The required connected records were not found',
          details: { prismaCode: code, meta }
        };
      case 'P2019':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_INVALID_PARAMS,
          message: 'Input error',
          details: { prismaCode: code, meta }
        };
      case 'P2020':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_INVALID_PARAMS,
          message: 'Value out of range for the type',
          details: { prismaCode: code, meta }
        };
      case 'P2021':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_MISSING_SCHEMA,
          message: 'The table does not exist in the database',
          details: { prismaCode: code, meta }
        };
      case 'P2022':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_MISSING_SCHEMA,
          message: 'The column does not exist in the database',
          details: { prismaCode: code, meta }
        };
      case 'P2023':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_INVALID_PARAMS,
          message: 'Inconsistent column data',
          details: { prismaCode: code, meta }
        };
      case 'P2024':
        return {
          type: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: DATABASE_ERROR_CODES.CONNECTION_TIMEOUT,
          message: 'Timed out fetching a connection from the connection pool',
          details: { prismaCode: code, meta }
        };
      case 'P2025':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
          message: 'An operation failed because it depends on one or more records that were not found',
          details: { prismaCode: code, meta }
        };
      case 'P2026':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'The current database provider doesn\'t support a feature that the query used',
          details: { prismaCode: code, meta }
        };
      case 'P2027':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
          message: 'Multiple errors occurred during the operation',
          details: { prismaCode: code, meta }
        };
      case 'P2028':
        return {
          type: DatabaseErrorType.TRANSACTION,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: DATABASE_ERROR_CODES.TRANSACTION_FAILED,
          message: 'Transaction API error',
          details: { prismaCode: code, meta }
        };
      case 'P2030':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
          message: 'Cannot find a fulltext index to use for the search',
          details: { prismaCode: code, meta }
        };
      case 'P2033':
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_INVALID_PARAMS,
          message: 'Number of parameters exceeded the number of placeholders in the query',
          details: { prismaCode: code, meta }
        };
      case 'P2034':
        return {
          type: DatabaseErrorType.TRANSACTION,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: DATABASE_ERROR_CODES.TRANSACTION_FAILED,
          message: 'Transaction failed due to a write conflict or a deadlock',
          details: { prismaCode: code, meta }
        };
      default:
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
          message: `Database error: ${message}`,
          details: { prismaCode: code, meta }
        };
    }
  }

  /**
   * Classifies a Prisma client error (P3XXX).
   * 
   * @param code - The Prisma error code
   * @param message - The error message
   * @param meta - Additional metadata about the error
   * @param context - Additional context about the error
   * @returns A classification result
   */
  private classifyClientError(
    code: string,
    message: string,
    meta: any,
    context?: DatabaseErrorContext
  ): DatabaseErrorClassification {
    switch (code) {
      case 'P3000':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Failed to create database',
          details: { prismaCode: code, meta }
        };
      case 'P3001':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_MISSING_SCHEMA,
          message: 'Migration possible with destructive changes and data loss',
          details: { prismaCode: code, meta }
        };
      case 'P3002':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'The attempted migration was rolled back',
          details: { prismaCode: code, meta }
        };
      case 'P3003':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'The format of migrations changed, please upgrade your client',
          details: { prismaCode: code, meta }
        };
      case 'P3004':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'The migration directory is corrupt',
          details: { prismaCode: code, meta }
        };
      case 'P3005':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'The database schema is not empty',
          details: { prismaCode: code, meta }
        };
      case 'P3006':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Migration cannot be applied',
          details: { prismaCode: code, meta }
        };
      case 'P3007':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Some migrations have failed',
          details: { prismaCode: code, meta }
        };
      case 'P3008':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Migration cannot be rolled back',
          details: { prismaCode: code, meta }
        };
      case 'P3009':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Failed to get migration lock',
          details: { prismaCode: code, meta }
        };
      case 'P3010':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Migration name is too long',
          details: { prismaCode: code, meta }
        };
      case 'P3011':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Migration cannot be found',
          details: { prismaCode: code, meta }
        };
      case 'P3012':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Prisma schema loaded multiple times',
          details: { prismaCode: code, meta }
        };
      case 'P3013':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Datasource provider arrays not supported',
          details: { prismaCode: code, meta }
        };
      case 'P3014':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Prisma schema validation error',
          details: { prismaCode: code, meta }
        };
      case 'P3015':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Could not find the migration directory',
          details: { prismaCode: code, meta }
        };
      case 'P3016':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'The migration directory is required',
          details: { prismaCode: code, meta }
        };
      case 'P3017':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'The migration directory path is invalid',
          details: { prismaCode: code, meta }
        };
      case 'P3018':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Could not create the migration directory',
          details: { prismaCode: code, meta }
        };
      case 'P3019':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Datasource URL environment variable not found',
          details: { prismaCode: code, meta }
        };
      case 'P3020':
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: 'Datasource URL environment variable empty',
          details: { prismaCode: code, meta }
        };
      default:
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
          message: `Prisma client error: ${message}`,
          details: { prismaCode: code, meta }
        };
    }
  }

  /**
   * Classifies a Prisma validation error.
   * 
   * @param error - The Prisma validation error
   * @param context - Additional context about the error
   * @returns A classification result
   */
  private classifyValidationError(
    error: PrismaClientValidationError,
    context?: DatabaseErrorContext
  ): DatabaseErrorClassification {
    return {
      type: DatabaseErrorType.QUERY,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: DATABASE_ERROR_CODES.QUERY_INVALID_PARAMS,
      message: 'Invalid query arguments',
      details: { originalError: error.message }
    };
  }

  /**
   * Classifies an unknown Prisma request error.
   * 
   * @param error - The unknown Prisma request error
   * @param context - Additional context about the error
   * @returns A classification result
   */
  private classifyUnknownRequestError(
    error: PrismaClientUnknownRequestError,
    context?: DatabaseErrorContext
  ): DatabaseErrorClassification {
    return {
      type: DatabaseErrorType.QUERY,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
      message: 'Unknown database error',
      details: { originalError: error.message }
    };
  }
}

/**
 * Transformer for Redis database errors.
 * Specializes in transforming Redis-specific errors into standardized DatabaseExceptions.
 */
export class RedisErrorTransformer extends ErrorTransformer {
  /**
   * Transforms a Redis error into a standardized DatabaseException.
   * 
   * @param error - The original Redis error
   * @param context - Additional context about the error
   * @returns A standardized DatabaseException
   */
  transform(error: Error, context?: DatabaseErrorContext): DatabaseException {
    const enrichedContext = this.enrichContext(context, error);
    const classification = this.classify(error, enrichedContext);
    
    return new DatabaseException(
      classification.message,
      classification.type,
      classification.code,
      classification.severity,
      classification.recoverability,
      enrichedContext,
      error
    );
  }

  /**
   * Classifies a Redis error based on its properties.
   * 
   * @param error - The original Redis error
   * @param context - Additional context about the error
   * @returns A classification result with type, severity, and recoverability
   */
  protected classify(error: Error, context?: DatabaseErrorContext): DatabaseErrorClassification {
    const errorMessage = error.message.toLowerCase();
    
    // Connection errors
    if (
      errorMessage.includes('connection') ||
      errorMessage.includes('connect') ||
      errorMessage.includes('network') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('econnreset')
    ) {
      return {
        type: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
        message: 'Failed to connect to Redis server',
        details: { originalError: error.message }
      };
    }
    
    // Authentication errors
    if (
      errorMessage.includes('auth') ||
      errorMessage.includes('password') ||
      errorMessage.includes('acl') ||
      errorMessage.includes('permission')
    ) {
      return {
        type: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: DATABASE_ERROR_CODES.CONNECTION_AUTHENTICATION_FAILED,
        message: 'Redis authentication failed',
        details: { originalError: error.message }
      };
    }
    
    // Timeout errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('timed out')
    ) {
      return {
        type: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: DATABASE_ERROR_CODES.CONNECTION_TIMEOUT,
        message: 'Redis operation timed out',
        details: { originalError: error.message }
      };
    }
    
    // Command errors
    if (
      errorMessage.includes('command') ||
      errorMessage.includes('syntax') ||
      errorMessage.includes('invalid')
    ) {
      return {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: DATABASE_ERROR_CODES.QUERY_SYNTAX_ERROR,
        message: 'Invalid Redis command',
        details: { originalError: error.message }
      };
    }
    
    // Memory errors
    if (
      errorMessage.includes('memory') ||
      errorMessage.includes('oom') ||
      errorMessage.includes('out of memory')
    ) {
      return {
        type: DatabaseErrorType.CONFIGURATION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: DATABASE_ERROR_CODES.CONFIG_RESOURCE_LIMIT,
        message: 'Redis server out of memory',
        details: { originalError: error.message }
      };
    }
    
    // Cluster errors
    if (
      errorMessage.includes('cluster') ||
      errorMessage.includes('moved') ||
      errorMessage.includes('ask') ||
      errorMessage.includes('clusterdown')
    ) {
      return {
        type: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
        message: 'Redis cluster error',
        details: { originalError: error.message }
      };
    }
    
    // Default classification
    return {
      type: DatabaseErrorType.QUERY,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
      message: `Redis operation failed: ${error.message}`,
      details: { originalError: error.message }
    };
  }
}

/**
 * Transformer for TypeORM database errors.
 * Specializes in transforming TypeORM-specific errors into standardized DatabaseExceptions.
 */
export class TypeORMErrorTransformer extends ErrorTransformer {
  /**
   * Transforms a TypeORM error into a standardized DatabaseException.
   * 
   * @param error - The original TypeORM error
   * @param context - Additional context about the error
   * @returns A standardized DatabaseException
   */
  transform(error: Error, context?: DatabaseErrorContext): DatabaseException {
    const enrichedContext = this.enrichContext(context, error);
    const classification = this.classify(error, enrichedContext);
    
    return new DatabaseException(
      classification.message,
      classification.type,
      classification.code,
      classification.severity,
      classification.recoverability,
      enrichedContext,
      error
    );
  }

  /**
   * Classifies a TypeORM error based on its properties.
   * 
   * @param error - The original TypeORM error
   * @param context - Additional context about the error
   * @returns A classification result with type, severity, and recoverability
   */
  protected classify(error: Error, context?: DatabaseErrorContext): DatabaseErrorClassification {
    const errorName = error.name;
    const errorMessage = error.message.toLowerCase();
    
    // Connection errors
    if (
      errorName === 'ConnectionError' ||
      errorMessage.includes('connection') ||
      errorMessage.includes('connect')
    ) {
      return {
        type: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
        message: 'Failed to connect to database',
        details: { originalError: error.message }
      };
    }
    
    // Query errors
    if (
      errorName === 'QueryFailedError' ||
      errorMessage.includes('query') ||
      errorMessage.includes('sql')
    ) {
      // Check for specific PostgreSQL error codes in the message
      if (errorMessage.includes('23505')) {
        return {
          type: DatabaseErrorType.INTEGRITY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.INTEGRITY_UNIQUE_CONSTRAINT,
          message: 'Unique constraint violation',
          details: { originalError: error.message }
        };
      }
      
      if (errorMessage.includes('23503')) {
        return {
          type: DatabaseErrorType.INTEGRITY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.INTEGRITY_FOREIGN_KEY,
          message: 'Foreign key constraint violation',
          details: { originalError: error.message }
        };
      }
      
      if (errorMessage.includes('23502')) {
        return {
          type: DatabaseErrorType.INTEGRITY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.INTEGRITY_NOT_NULL,
          message: 'Not null constraint violation',
          details: { originalError: error.message }
        };
      }
      
      if (errorMessage.includes('23514')) {
        return {
          type: DatabaseErrorType.INTEGRITY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.INTEGRITY_CHECK_CONSTRAINT,
          message: 'Check constraint violation',
          details: { originalError: error.message }
        };
      }
      
      if (errorMessage.includes('42p01')) {
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_MISSING_SCHEMA,
          message: 'Table does not exist',
          details: { originalError: error.message }
        };
      }
      
      if (errorMessage.includes('42703')) {
        return {
          type: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.CONFIG_MISSING_SCHEMA,
          message: 'Column does not exist',
          details: { originalError: error.message }
        };
      }
      
      if (errorMessage.includes('42601')) {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          code: DATABASE_ERROR_CODES.QUERY_SYNTAX_ERROR,
          message: 'SQL syntax error',
          details: { originalError: error.message }
        };
      }
      
      if (errorMessage.includes('57014')) {
        return {
          type: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
          code: DATABASE_ERROR_CODES.QUERY_TIMEOUT,
          message: 'Query canceled due to timeout',
          details: { originalError: error.message }
        };
      }
      
      // Default query error
      return {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
        message: 'Query execution failed',
        details: { originalError: error.message }
      };
    }
    
    // Entity errors
    if (
      errorName === 'EntityNotFoundError' ||
      errorMessage.includes('entity') ||
      errorMessage.includes('not found')
    ) {
      return {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
        message: 'Entity not found',
        details: { originalError: error.message }
      };
    }
    
    // Transaction errors
    if (
      errorName === 'TransactionNotStartedError' ||
      errorMessage.includes('transaction')
    ) {
      return {
        type: DatabaseErrorType.TRANSACTION,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: DATABASE_ERROR_CODES.TRANSACTION_FAILED,
        message: 'Transaction error',
        details: { originalError: error.message }
      };
    }
    
    // Default classification
    return {
      type: DatabaseErrorType.QUERY,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
      message: `Database operation failed: ${error.message}`,
      details: { originalError: error.message }
    };
  }
}

/**
 * Factory for creating appropriate error transformers based on error type.
 * Provides a convenient way to get the right transformer for a given error.
 */
export class ErrorTransformerFactory {
  /**
   * Creates an appropriate error transformer for the given error.
   * 
   * @param error - The error to transform
   * @param options - Configuration options for the transformer
   * @returns An appropriate error transformer for the error
   */
  static createTransformer(error: Error, options?: ErrorTransformerOptions): ErrorTransformer {
    if (
      error instanceof PrismaClientKnownRequestError ||
      error instanceof PrismaClientUnknownRequestError ||
      error instanceof PrismaClientValidationError ||
      (error.name && error.name.includes('Prisma'))
    ) {
      return new PrismaErrorTransformer(options);
    }
    
    // Check for Redis errors
    if (
      error.name === 'RedisError' ||
      error.name === 'ReplyError' ||
      (error.message && (
        error.message.includes('Redis') ||
        error.message.includes('ECONNREFUSED') && error.message.includes('6379')
      ))
    ) {
      return new RedisErrorTransformer(options);
    }
    
    // Check for TypeORM errors
    if (
      error.name === 'QueryFailedError' ||
      error.name === 'EntityNotFoundError' ||
      error.name === 'TransactionNotStartedError' ||
      error.name === 'ConnectionError' ||
      (error.message && error.message.includes('TypeORM'))
    ) {
      return new TypeORMErrorTransformer(options);
    }
    
    // Default to Prisma transformer as fallback
    return new PrismaErrorTransformer(options);
  }

  /**
   * Transforms an error using the appropriate transformer.
   * 
   * @param error - The error to transform
   * @param context - Additional context about the error
   * @param options - Configuration options for the transformer
   * @returns A standardized DatabaseException
   */
  static transform(error: Error, context?: DatabaseErrorContext, options?: ErrorTransformerOptions): DatabaseException {
    const transformer = this.createTransformer(error, options);
    return transformer.transform(error, context);
  }
}

/**
 * Utility functions for transforming database errors.
 * Provides a convenient API for error transformation.
 */
export const ErrorTransformer = {
  /**
   * Transforms a database error into a standardized DatabaseException.
   * 
   * @param error - The original database error
   * @param context - Additional context about the error
   * @param options - Configuration options for the transformer
   * @returns A standardized DatabaseException
   */
  transform(error: Error, context?: DatabaseErrorContext, options?: ErrorTransformerOptions): DatabaseException {
    return ErrorTransformerFactory.transform(error, context, options);
  },
  
  /**
   * Transforms a Prisma error into a standardized DatabaseException.
   * 
   * @param error - The original Prisma error
   * @param context - Additional context about the error
   * @param options - Configuration options for the transformer
   * @returns A standardized DatabaseException
   */
  transformPrismaError(error: Error, context?: DatabaseErrorContext, options?: ErrorTransformerOptions): DatabaseException {
    const transformer = new PrismaErrorTransformer(options);
    return transformer.transform(error, context);
  },
  
  /**
   * Transforms a Redis error into a standardized DatabaseException.
   * 
   * @param error - The original Redis error
   * @param context - Additional context about the error
   * @param options - Configuration options for the transformer
   * @returns A standardized DatabaseException
   */
  transformRedisError(error: Error, context?: DatabaseErrorContext, options?: ErrorTransformerOptions): DatabaseException {
    const transformer = new RedisErrorTransformer(options);
    return transformer.transform(error, context);
  },
  
  /**
   * Transforms a TypeORM error into a standardized DatabaseException.
   * 
   * @param error - The original TypeORM error
   * @param context - Additional context about the error
   * @param options - Configuration options for the transformer
   * @returns A standardized DatabaseException
   */
  transformTypeORMError(error: Error, context?: DatabaseErrorContext, options?: ErrorTransformerOptions): DatabaseException {
    const transformer = new TypeORMErrorTransformer(options);
    return transformer.transform(error, context);
  },
  
  /**
   * Validates data against a schema using Zod.
   * 
   * @param data - The data to validate
   * @param schema - The Zod schema to validate against
   * @returns Validation result with errors if any
   */
  validateWithZod<T>(data: any, schema: z.ZodType<T>): { success: boolean; data?: T; errors?: z.ZodError } {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error };
      }
      throw error;
    }
  },
  
  /**
   * Validates data against a class using class-validator.
   * 
   * @param data - The data to validate
   * @param cls - The class to validate against
   * @returns Validation result with errors if any
   */
  async validateWithClassValidator<T extends object>(data: any, cls: new () => T): Promise<{ success: boolean; data?: T; errors?: any[] }> {
    const instance = plainToClass(cls, data);
    const errors = await validate(instance);
    
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    return { success: true, data: instance };
  }
};