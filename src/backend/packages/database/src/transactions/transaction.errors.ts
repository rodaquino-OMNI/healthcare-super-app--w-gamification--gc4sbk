/**
 * @file transaction.errors.ts
 * @description Defines specialized error classes for transaction-related failures.
 * These errors provide detailed context information and integrate with the application's
 * error handling framework for consistent error reporting and handling.
 */

import { ErrorType } from '@austa/errors/types';
import { BaseError } from '@austa/errors/base';
import { DatabaseErrorType, DatabaseErrorSeverity, DatabaseErrorRecoverability } from '../errors/database-error.types';

/**
 * Base class for all transaction-related errors.
 * Extends the BaseError class from the central error handling framework.
 */
export class TransactionError extends BaseError {
  /**
   * @param message - Detailed error message
   * @param cause - Original error that caused this transaction error
   * @param context - Additional context information for debugging
   */
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly context: Record<string, any> = {}
  ) {
    super(message, {
      type: ErrorType.TECHNICAL,
      code: 'DB_TRANSACTION_ERROR',
      cause,
      context: {
        errorType: DatabaseErrorType.TRANSACTION,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE,
        ...context,
      },
    });
    
    // Ensure the name is set correctly for better error identification
    this.name = 'TransactionError';
  }

  /**
   * Provides a recommendation for handling this error type
   */
  getRetryRecommendation(): string {
    return 'Consider retrying the transaction with exponential backoff.';
  }
}

/**
 * Error thrown when a transaction exceeds its configured timeout period.
 * This can happen with lock_timeout or statement_timeout settings in PostgreSQL.
 */
export class TransactionTimeoutError extends TransactionError {
  /**
   * @param message - Detailed error message
   * @param timeoutMs - The timeout duration in milliseconds
   * @param operationType - The type of operation that timed out (e.g., 'query', 'lock acquisition')
   * @param cause - Original error that caused this timeout
   * @param context - Additional context information for debugging
   */
  constructor(
    message: string,
    public readonly timeoutMs: number,
    public readonly operationType: string,
    cause?: Error,
    context: Record<string, any> = {}
  ) {
    super(message, cause, {
      timeoutMs,
      operationType,
      errorType: DatabaseErrorType.TRANSACTION,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE,
      sqlState: '57014', // SQL_STATEMENT_TIMEOUT
      ...context,
    });
    
    this.name = 'TransactionTimeoutError';
  }

  /**
   * Provides a recommendation for handling this timeout error
   */
  getRetryRecommendation(): string {
    return `Consider retrying the transaction with a longer timeout or optimizing the operation to complete within ${this.timeoutMs}ms.`;
  }
}

/**
 * Error thrown when a deadlock is detected between two or more transactions.
 * PostgreSQL automatically detects deadlocks and terminates one of the transactions.
 */
export class DeadlockError extends TransactionError {
  /**
   * @param message - Detailed error message
   * @param waitingFor - Resources the transaction was waiting for
   * @param blockedBy - Process IDs that were blocking this transaction
   * @param cause - Original error that caused this deadlock
   * @param context - Additional context information for debugging
   */
  constructor(
    message: string,
    public readonly waitingFor?: string,
    public readonly blockedBy?: string[],
    cause?: Error,
    context: Record<string, any> = {}
  ) {
    super(message, cause, {
      waitingFor,
      blockedBy,
      errorType: DatabaseErrorType.TRANSACTION,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.RECOVERABLE,
      sqlState: '40P01', // DEADLOCK_DETECTED
      ...context,
    });
    
    this.name = 'DeadlockError';
  }

  /**
   * Provides a recommendation for handling deadlock errors
   */
  getRetryRecommendation(): string {
    return 'Retry the transaction with exponential backoff. Consider reordering operations to acquire locks in a consistent order to prevent future deadlocks.';
  }
}

/**
 * Error thrown when a serialization failure occurs in SERIALIZABLE isolation level.
 * This happens when PostgreSQL cannot guarantee that concurrent execution is equivalent to some serial execution.
 */
export class SerializationError extends TransactionError {
  /**
   * @param message - Detailed error message
   * @param conflictingTransactions - IDs of transactions that conflicted with this one
   * @param cause - Original error that caused this serialization failure
   * @param context - Additional context information for debugging
   */
  constructor(
    message: string,
    public readonly conflictingTransactions?: string[],
    cause?: Error,
    context: Record<string, any> = {}
  ) {
    super(message, cause, {
      conflictingTransactions,
      errorType: DatabaseErrorType.TRANSACTION,
      severity: DatabaseErrorSeverity.MAJOR,
      recoverability: DatabaseErrorRecoverability.RECOVERABLE,
      sqlState: '40001', // SERIALIZATION_FAILURE
      ...context,
    });
    
    this.name = 'SerializationError';
  }

  /**
   * Provides a recommendation for handling serialization errors
   */
  getRetryRecommendation(): string {
    return 'Retry the entire transaction. Serialization failures are expected with SERIALIZABLE isolation level and require application-level retry logic.';
  }
}

/**
 * Error thrown when a distributed transaction fails to complete successfully across all database instances.
 */
export class DistributedTransactionError extends TransactionError {
  /**
   * @param message - Detailed error message
   * @param failedNodes - Database nodes where the transaction failed
   * @param phase - Phase of the two-phase commit where the failure occurred
   * @param cause - Original error that caused this distributed transaction failure
   * @param context - Additional context information for debugging
   */
  constructor(
    message: string,
    public readonly failedNodes: string[],
    public readonly phase: 'prepare' | 'commit' | 'rollback',
    cause?: Error,
    context: Record<string, any> = {}
  ) {
    super(message, cause, {
      failedNodes,
      phase,
      errorType: DatabaseErrorType.TRANSACTION,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.MANUAL_INTERVENTION_REQUIRED,
      ...context,
    });
    
    this.name = 'DistributedTransactionError';
  }

  /**
   * Provides a recommendation for handling distributed transaction errors
   */
  getRetryRecommendation(): string {
    if (this.phase === 'prepare') {
      return 'The transaction can be safely retried as it failed during the prepare phase.';
    } else {
      return 'Manual intervention may be required to resolve the inconsistent state across database nodes.';
    }
  }
}

/**
 * Error thrown when a transaction is explicitly aborted or rolled back.
 */
export class TransactionAbortedError extends TransactionError {
  /**
   * @param message - Detailed error message
   * @param reason - Reason for the transaction abort
   * @param cause - Original error that caused this abort
   * @param context - Additional context information for debugging
   */
  constructor(
    message: string,
    public readonly reason: string,
    cause?: Error,
    context: Record<string, any> = {}
  ) {
    super(message, cause, {
      reason,
      errorType: DatabaseErrorType.TRANSACTION,
      severity: DatabaseErrorSeverity.MINOR,
      recoverability: DatabaseErrorRecoverability.RECOVERABLE,
      ...context,
    });
    
    this.name = 'TransactionAbortedError';
  }

  /**
   * Provides a recommendation for handling transaction abort errors
   */
  getRetryRecommendation(): string {
    return 'The transaction was explicitly aborted. Review the reason and retry if appropriate.';
  }
}

/**
 * Error thrown when the database connection is lost during a transaction.
 */
export class ConnectionLostError extends TransactionError {
  /**
   * @param message - Detailed error message
   * @param transactionPhase - Phase of the transaction when the connection was lost
   * @param cause - Original error that caused this connection loss
   * @param context - Additional context information for debugging
   */
  constructor(
    message: string,
    public readonly transactionPhase: 'begin' | 'execute' | 'commit' | 'rollback',
    cause?: Error,
    context: Record<string, any> = {}
  ) {
    super(message, cause, {
      transactionPhase,
      errorType: DatabaseErrorType.CONNECTION,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: 
        transactionPhase === 'commit' 
          ? DatabaseErrorRecoverability.MANUAL_INTERVENTION_REQUIRED 
          : DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE,
      ...context,
    });
    
    this.name = 'ConnectionLostError';
  }

  /**
   * Provides a recommendation for handling connection lost errors
   */
  getRetryRecommendation(): string {
    if (this.transactionPhase === 'commit') {
      return 'Connection was lost during commit. Manual verification is required to determine if the transaction was committed.';
    } else {
      return 'Connection was lost. The transaction was likely rolled back and can be retried after establishing a new connection.';
    }
  }
}