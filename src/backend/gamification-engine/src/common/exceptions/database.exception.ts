import { HttpStatus } from '@nestjs/common';
import { SystemException } from './system.exception';
import { ErrorType } from './error-types.enum';

/**
 * Enum representing different types of database errors.
 * Used to categorize database exceptions for appropriate handling and recovery strategies.
 */
export enum DatabaseErrorType {
  /** Connection-related errors (connection refused, timeout, pool exhaustion) */
  CONNECTION = 'connection',
  
  /** Query-related errors (syntax errors, constraint violations, timeout) */
  QUERY = 'query',
  
  /** Transaction-related errors (deadlocks, serialization failures, rollback failures) */
  TRANSACTION = 'transaction',
  
  /** Data integrity errors (constraint violations, invalid references) */
  INTEGRITY = 'integrity',
  
  /** Configuration errors (invalid connection string, missing schema) */
  CONFIGURATION = 'configuration'
}

/**
 * Enum representing the severity of database errors.
 */
export enum DatabaseErrorSeverity {
  /** Critical errors that require immediate attention and likely system intervention */
  CRITICAL = 'critical',
  
  /** Major errors that significantly impact functionality but may not require immediate intervention */
  MAJOR = 'major',
  
  /** Minor errors that have limited impact and can often be handled automatically */
  MINOR = 'minor'
}

/**
 * Enum representing whether a database error is recoverable.
 */
export enum DatabaseErrorRecoverability {
  /** Transient errors that may succeed if the operation is retried */
  TRANSIENT = 'transient',
  
  /** Permanent errors that will not succeed even if retried */
  PERMANENT = 'permanent'
}

/**
 * Interface for database error metadata.
 */
export interface DatabaseErrorMetadata {
  /** The specific type of database error */
  dbErrorType: DatabaseErrorType;
  
  /** The severity of the error */
  severity: DatabaseErrorSeverity;
  
  /** Whether the error is recoverable */
  recoverability: DatabaseErrorRecoverability;
  
  /** The original SQL error code, if available */
  sqlErrorCode?: string;
  
  /** The database operation that was being performed */
  operation?: string;
  
  /** The entity or table involved in the operation */
  entity?: string;
  
  /** The journey context in which the error occurred */
  journeyContext?: string;
  
  /** Transaction ID if the error occurred within a transaction */
  transactionId?: string;
  
  /** Connection pool information if relevant */
  connectionPool?: {
    /** Total connections in the pool */
    total: number;
    
    /** Currently active connections */
    active: number;
    
    /** Idle connections */
    idle: number;
    
    /** Waiting requests */
    waiting: number;
  };
  
  /** Retry information if applicable */
  retry?: {
    /** Number of retry attempts made */
    attempts: number;
    
    /** Maximum number of retry attempts allowed */
    maxAttempts: number;
    
    /** Delay between retry attempts in milliseconds */
    delayMs: number;
  };
}

/**
 * Base class for all database-related exceptions in the gamification engine.
 * Extends SystemException to provide specialized handling for database errors.
 */
export class DatabaseException extends SystemException {
  /**
   * Creates a new DatabaseException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization (e.g., "DB_CONN_001")
   * @param metadata - Additional database-specific error metadata
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    public readonly metadata: DatabaseErrorMetadata,
    cause?: Error
  ) {
    super(
      message,
      code,
      { databaseError: metadata },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DatabaseException.prototype);
    this.name = this.constructor.name;
  }

  /**
   * Determines if the error is transient and can be retried.
   * 
   * @returns True if the error is transient and can be retried
   */
  isTransient(): boolean {
    return this.metadata.recoverability === DatabaseErrorRecoverability.TRANSIENT;
  }

  /**
   * Determines if the error is related to connection issues.
   * 
   * @returns True if the error is connection-related
   */
  isConnectionError(): boolean {
    return this.metadata.dbErrorType === DatabaseErrorType.CONNECTION;
  }

  /**
   * Determines if the error is related to transaction issues.
   * 
   * @returns True if the error is transaction-related
   */
  isTransactionError(): boolean {
    return this.metadata.dbErrorType === DatabaseErrorType.TRANSACTION;
  }

  /**
   * Determines if the error is critical and requires immediate attention.
   * 
   * @returns True if the error is critical
   */
  isCritical(): boolean {
    return this.metadata.severity === DatabaseErrorSeverity.CRITICAL;
  }

  /**
   * Gets retry information if available.
   * 
   * @returns Retry metadata or undefined if not applicable
   */
  getRetryInfo(): DatabaseErrorMetadata['retry'] | undefined {
    return this.metadata.retry;
  }

  /**
   * Gets connection pool information if available.
   * 
   * @returns Connection pool metadata or undefined if not applicable
   */
  getConnectionPoolInfo(): DatabaseErrorMetadata['connectionPool'] | undefined {
    return this.metadata.connectionPool;
  }

  /**
   * Creates a new instance with updated retry information.
   * Used when implementing retry logic for transient errors.
   * 
   * @param attempts - Current number of retry attempts
   * @param maxAttempts - Maximum number of retry attempts allowed
   * @param delayMs - Delay between retry attempts in milliseconds
   * @returns A new DatabaseException instance with updated retry information
   */
  withRetryAttempt(attempts: number, maxAttempts: number, delayMs: number): DatabaseException {
    const updatedMetadata = {
      ...this.metadata,
      retry: {
        attempts,
        maxAttempts,
        delayMs
      }
    };
    
    return new DatabaseException(
      this.message,
      this.code,
      updatedMetadata,
      this.cause
    );
  }
}

/**
 * Specialized exception for database connection errors.
 */
export class ConnectionException extends DatabaseException {
  /**
   * Creates a new ConnectionException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code (defaults to DB_CONN_001)
   * @param metadata - Additional error metadata
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    code: string = 'DB_CONN_001',
    metadata: Partial<DatabaseErrorMetadata> = {},
    cause?: Error
  ) {
    super(
      message,
      code,
      {
        dbErrorType: DatabaseErrorType.CONNECTION,
        severity: metadata.severity || DatabaseErrorSeverity.MAJOR,
        recoverability: metadata.recoverability || DatabaseErrorRecoverability.TRANSIENT,
        ...metadata
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ConnectionException.prototype);
    this.name = this.constructor.name;
  }
}

/**
 * Specialized exception for database query errors.
 */
export class QueryException extends DatabaseException {
  /**
   * Creates a new QueryException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code (defaults to DB_QUERY_001)
   * @param metadata - Additional error metadata
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    code: string = 'DB_QUERY_001',
    metadata: Partial<DatabaseErrorMetadata> = {},
    cause?: Error
  ) {
    super(
      message,
      code,
      {
        dbErrorType: DatabaseErrorType.QUERY,
        severity: metadata.severity || DatabaseErrorSeverity.MINOR,
        recoverability: metadata.recoverability || DatabaseErrorRecoverability.PERMANENT,
        ...metadata
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, QueryException.prototype);
    this.name = this.constructor.name;
  }
}

/**
 * Specialized exception for database transaction errors.
 */
export class TransactionException extends DatabaseException {
  /**
   * Creates a new TransactionException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code (defaults to DB_TRANS_001)
   * @param metadata - Additional error metadata
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    code: string = 'DB_TRANS_001',
    metadata: Partial<DatabaseErrorMetadata> = {},
    cause?: Error
  ) {
    super(
      message,
      code,
      {
        dbErrorType: DatabaseErrorType.TRANSACTION,
        severity: metadata.severity || DatabaseErrorSeverity.MAJOR,
        recoverability: metadata.recoverability || DatabaseErrorRecoverability.TRANSIENT,
        ...metadata
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TransactionException.prototype);
    this.name = this.constructor.name;
  }

  /**
   * Indicates whether the transaction can be safely retried.
   * 
   * @returns True if the transaction can be retried
   */
  canRetryTransaction(): boolean {
    // Deadlocks and serialization failures are typically retryable
    return this.isTransient() && !!this.metadata.sqlErrorCode && [
      '40001', // Serialization failure
      '40P01', // Deadlock detected
      '23000'  // Integrity constraint violation (in some cases)
    ].includes(this.metadata.sqlErrorCode);
  }
}

/**
 * Specialized exception for data integrity errors.
 */
export class IntegrityException extends DatabaseException {
  /**
   * Creates a new IntegrityException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code (defaults to DB_INTEG_001)
   * @param metadata - Additional error metadata
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    code: string = 'DB_INTEG_001',
    metadata: Partial<DatabaseErrorMetadata> = {},
    cause?: Error
  ) {
    super(
      message,
      code,
      {
        dbErrorType: DatabaseErrorType.INTEGRITY,
        severity: metadata.severity || DatabaseErrorSeverity.MAJOR,
        recoverability: metadata.recoverability || DatabaseErrorRecoverability.PERMANENT,
        ...metadata
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, IntegrityException.prototype);
    this.name = this.constructor.name;
  }
}

/**
 * Specialized exception for database configuration errors.
 */
export class ConfigurationException extends DatabaseException {
  /**
   * Creates a new ConfigurationException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code (defaults to DB_CONFIG_001)
   * @param metadata - Additional error metadata
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    code: string = 'DB_CONFIG_001',
    metadata: Partial<DatabaseErrorMetadata> = {},
    cause?: Error
  ) {
    super(
      message,
      code,
      {
        dbErrorType: DatabaseErrorType.CONFIGURATION,
        severity: metadata.severity || DatabaseErrorSeverity.CRITICAL,
        recoverability: metadata.recoverability || DatabaseErrorRecoverability.PERMANENT,
        ...metadata
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ConfigurationException.prototype);
    this.name = this.constructor.name;
  }
}

/**
 * Utility functions for mapping SQL error codes to appropriate exception types.
 */
export class DatabaseErrorMapper {
  /**
   * Maps a Prisma error to the appropriate database exception.
   * 
   * @param error - The original Prisma error
   * @param operation - The database operation being performed
   * @param entity - The entity or table involved
   * @param journeyContext - The journey context
   * @returns An appropriate database exception
   */
  static mapPrismaError(
    error: any,
    operation?: string,
    entity?: string,
    journeyContext?: string
  ): DatabaseException {
    // Extract metadata from the Prisma error
    const metadata: Partial<DatabaseErrorMetadata> = {
      operation,
      entity,
      journeyContext,
      sqlErrorCode: error.code
    };

    // Connection errors
    if (
      error.code === 'P1001' || // Authentication failed
      error.code === 'P1002' || // Connection timed out
      error.code === 'P1003' || // Database does not exist
      error.code === 'P1008' || // Operations timed out
      error.code === 'P1017'    // Server closed the connection
    ) {
      return new ConnectionException(
        `Database connection error: ${error.message}`,
        `DB_CONN_${error.code}`,
        metadata,
        error
      );
    }

    // Transaction errors
    if (
      error.code === 'P2034' || // Transaction failed
      error.code === 'P2037'    // Transaction validation error
    ) {
      return new TransactionException(
        `Database transaction error: ${error.message}`,
        `DB_TRANS_${error.code}`,
        metadata,
        error
      );
    }

    // Integrity errors
    if (
      error.code === 'P2002' || // Unique constraint failed
      error.code === 'P2003' || // Foreign key constraint failed
      error.code === 'P2004' || // Constraint failed
      error.code === 'P2014'    // Relation violation
    ) {
      return new IntegrityException(
        `Data integrity error: ${error.message}`,
        `DB_INTEG_${error.code}`,
        metadata,
        error
      );
    }

    // Configuration errors
    if (
      error.code === 'P1010' || // Schema parsing error
      error.code === 'P1011' || // Invalid database URL
      error.code === 'P1012'    // Missing required argument
    ) {
      return new ConfigurationException(
        `Database configuration error: ${error.message}`,
        `DB_CONFIG_${error.code}`,
        metadata,
        error
      );
    }

    // Default to query error for any other error codes
    return new QueryException(
      `Database query error: ${error.message}`,
      `DB_QUERY_${error.code || 'UNKNOWN'}`,
      metadata,
      error
    );
  }

  /**
   * Maps a raw SQL error to the appropriate database exception.
   * 
   * @param error - The original SQL error
   * @param operation - The database operation being performed
   * @param entity - The entity or table involved
   * @param journeyContext - The journey context
   * @returns An appropriate database exception
   */
  static mapSqlError(
    error: any,
    operation?: string,
    entity?: string,
    journeyContext?: string
  ): DatabaseException {
    // Extract metadata from the SQL error
    const metadata: Partial<DatabaseErrorMetadata> = {
      operation,
      entity,
      journeyContext,
      sqlErrorCode: error.code || error.sqlState || error.errno?.toString()
    };

    // Connection errors (common SQL state codes)
    if (
      metadata.sqlErrorCode === '08001' || // Unable to connect
      metadata.sqlErrorCode === '08006' || // Connection failure
      metadata.sqlErrorCode === '08004' || // Rejected connection
      metadata.sqlErrorCode === '08007' || // Transaction resolution unknown
      metadata.sqlErrorCode === '57P01' || // Admin shutdown
      metadata.sqlErrorCode === '57P02' || // Crash shutdown
      metadata.sqlErrorCode === '57P03'    // Cannot connect now
    ) {
      return new ConnectionException(
        `Database connection error: ${error.message}`,
        `DB_CONN_SQL_${metadata.sqlErrorCode}`,
        metadata,
        error
      );
    }

    // Transaction errors
    if (
      metadata.sqlErrorCode === '40001' || // Serialization failure
      metadata.sqlErrorCode === '40002' || // Transaction integrity constraint violation
      metadata.sqlErrorCode === '40003' || // Statement completion unknown
      metadata.sqlErrorCode === '40P01'    // Deadlock detected
    ) {
      return new TransactionException(
        `Database transaction error: ${error.message}`,
        `DB_TRANS_SQL_${metadata.sqlErrorCode}`,
        metadata,
        error
      );
    }

    // Integrity errors
    if (
      metadata.sqlErrorCode === '23000' || // Integrity constraint violation
      metadata.sqlErrorCode === '23001' || // Restrict violation
      metadata.sqlErrorCode === '23502' || // Not null violation
      metadata.sqlErrorCode === '23503' || // Foreign key violation
      metadata.sqlErrorCode === '23505' || // Unique violation
      metadata.sqlErrorCode === '23514'    // Check violation
    ) {
      return new IntegrityException(
        `Data integrity error: ${error.message}`,
        `DB_INTEG_SQL_${metadata.sqlErrorCode}`,
        metadata,
        error
      );
    }

    // Configuration errors
    if (
      metadata.sqlErrorCode === '3D000' || // Invalid catalog name
      metadata.sqlErrorCode === '3F000' || // Invalid schema name
      metadata.sqlErrorCode === '42P01' || // Undefined table
      metadata.sqlErrorCode === '42P02'    // Undefined parameter
    ) {
      return new ConfigurationException(
        `Database configuration error: ${error.message}`,
        `DB_CONFIG_SQL_${metadata.sqlErrorCode}`,
        metadata,
        error
      );
    }

    // Default to query error for any other error codes
    return new QueryException(
      `Database query error: ${error.message}`,
      `DB_QUERY_SQL_${metadata.sqlErrorCode || 'UNKNOWN'}`,
      metadata,
      error
    );
  }

  /**
   * Creates a connection pool exception with detailed pool statistics.
   * 
   * @param message - Error message
   * @param poolStats - Connection pool statistics
   * @param journeyContext - The journey context
   * @returns A connection exception with pool information
   */
  static createConnectionPoolException(
    message: string,
    poolStats: {
      total: number;
      active: number;
      idle: number;
      waiting: number;
    },
    journeyContext?: string
  ): ConnectionException {
    return new ConnectionException(
      message,
      'DB_CONN_POOL_EXHAUSTED',
      {
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        journeyContext,
        connectionPool: poolStats,
        operation: 'connection_acquisition'
      }
    );
  }
}