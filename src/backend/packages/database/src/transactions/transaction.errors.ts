/**
 * Transaction Error Classes
 * 
 * This file defines a hierarchy of error classes specific to transaction management failures.
 * These specialized error classes extend the base TransactionException class and provide
 * detailed error information for different transaction failure scenarios.
 * 
 * The error classes are integrated with the application's error handling framework for
 * consistent error reporting and handling across the AUSTA SuperApp.
 */

import { 
  TransactionException, 
  DatabaseErrorSeverity, 
  DatabaseErrorRecoverability,
  JourneyContext,
  DatabaseOperationContext 
} from '../errors/database-error.exception';

import {
  DB_TRANS_PG_TIMEOUT,
  DB_TRANS_PG_DEADLOCK,
  DB_TRANS_PG_SERIALIZATION,
  DB_TRANS_PG_BEGIN_FAILED,
  DB_TRANS_PG_COMMIT_FAILED,
  DB_TRANS_PG_ROLLBACK_FAILED
} from '../errors/database-error.codes';

/**
 * Base class for all transaction-related errors in the AUSTA SuperApp.
 * Extends TransactionException to provide a common foundation for all transaction errors.
 */
export class TransactionError extends TransactionException {
  /**
   * Creates a new TransactionError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code from database-error.codes.ts
   * @param severity - Severity level of the error
   * @param recoverability - Whether the error is transient or permanent
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param recoverySuggestion - Suggestion for recovering from this error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    severity: DatabaseErrorSeverity = DatabaseErrorSeverity.MAJOR,
    recoverability: DatabaseErrorRecoverability = DatabaseErrorRecoverability.TRANSIENT,
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext,
    recoverySuggestion: string = 'Retry the transaction after a brief delay. If the issue persists, check for conflicting operations.',
    cause?: Error
  ) {
    super(
      message,
      code,
      severity,
      recoverability,
      journeyContext,
      operationContext,
      recoverySuggestion,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TransactionError.prototype);
  }

  /**
   * Returns a detailed transaction error message with context information.
   * 
   * @returns Detailed error message with transaction context
   */
  getTransactionErrorDetails(): string {
    let details = `Transaction Error [${this.code}]: ${this.message}`;
    
    if (this.operationContext?.operation) {
      details += `\nOperation: ${this.operationContext.operation}`;
    }
    
    if (this.operationContext?.entity) {
      details += `\nEntity: ${this.operationContext.entity}`;
    }
    
    if (this.journeyContext?.journey) {
      details += `\nJourney: ${this.journeyContext.journey}`;
      if (this.journeyContext.feature) {
        details += ` (${this.journeyContext.feature})`;
      }
    }
    
    details += `\nSeverity: ${this.severity}`;
    details += `\nRecoverability: ${this.recoverability}`;
    details += `\nRecovery Suggestion: ${this.recoverySuggestion}`;
    
    return details;
  }
}

/**
 * Error class for transaction timeout failures.
 * Used when a transaction exceeds its allowed execution time.
 */
export class TransactionTimeoutError extends TransactionError {
  /**
   * Creates a new TransactionTimeoutError instance.
   * 
   * @param message - Human-readable error message
   * @param timeoutMs - The timeout threshold in milliseconds
   * @param actualDurationMs - The actual duration that caused the timeout
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Transaction exceeded the maximum allowed execution time',
    public readonly timeoutMs: number,
    public readonly actualDurationMs: number,
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext,
    cause?: Error
  ) {
    const enhancedMessage = `${message} (Timeout: ${timeoutMs}ms, Actual: ${actualDurationMs}ms)`;
    const enhancedOperationContext: DatabaseOperationContext = {
      ...operationContext,
      timeoutMs,
      actualDurationMs
    };
    
    super(
      enhancedMessage,
      DB_TRANS_PG_TIMEOUT,
      DatabaseErrorSeverity.MAJOR,
      DatabaseErrorRecoverability.TRANSIENT,
      journeyContext,
      enhancedOperationContext,
      'Consider optimizing the transaction to reduce execution time, or adjust the timeout threshold if appropriate. Retry with a smaller batch size or simpler operation.',
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TransactionTimeoutError.prototype);
  }

  /**
   * Returns a detailed timeout error message with timing information.
   * 
   * @returns Detailed error message with timeout context
   */
  getTimeoutDetails(): string {
    return `Transaction timeout after ${this.actualDurationMs}ms (limit: ${this.timeoutMs}ms). ${this.recoverySuggestion}`;
  }
}

/**
 * Error class for deadlock situations in transactions.
 * Used when a transaction is selected as a deadlock victim and rolled back.
 */
export class DeadlockError extends TransactionError {
  /**
   * Creates a new DeadlockError instance.
   * 
   * @param message - Human-readable error message
   * @param waitForResourceId - The resource ID that the transaction was waiting for, if available
   * @param conflictingTransactionId - The ID of the conflicting transaction, if available
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Transaction was terminated due to a deadlock',
    public readonly waitForResourceId?: string,
    public readonly conflictingTransactionId?: string,
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext,
    cause?: Error
  ) {
    let enhancedMessage = message;
    if (waitForResourceId && conflictingTransactionId) {
      enhancedMessage += ` (Waiting for resource: ${waitForResourceId}, Conflicting transaction: ${conflictingTransactionId})`;
    }
    
    const enhancedOperationContext: DatabaseOperationContext = {
      ...operationContext,
      waitForResourceId,
      conflictingTransactionId
    };
    
    super(
      enhancedMessage,
      DB_TRANS_PG_DEADLOCK,
      DatabaseErrorSeverity.MAJOR,
      DatabaseErrorRecoverability.TRANSIENT,
      journeyContext,
      enhancedOperationContext,
      'Retry the transaction after a brief delay. Consider reordering operations to access resources in a consistent order to prevent deadlocks.',
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DeadlockError.prototype);
  }

  /**
   * Returns a detailed deadlock error message with resource information.
   * 
   * @returns Detailed error message with deadlock context
   */
  getDeadlockDetails(): string {
    let details = 'Deadlock detected';
    
    if (this.waitForResourceId) {
      details += `, waiting for resource: ${this.waitForResourceId}`;
    }
    
    if (this.conflictingTransactionId) {
      details += `, conflicting with transaction: ${this.conflictingTransactionId}`;
    }
    
    return `${details}. ${this.recoverySuggestion}`;
  }
}

/**
 * Error class for distributed transaction failures.
 * Used when a transaction spans multiple database systems and fails to coordinate properly.
 */
export class DistributedTransactionError extends TransactionError {
  /**
   * Creates a new DistributedTransactionError instance.
   * 
   * @param message - Human-readable error message
   * @param participantSystems - Array of systems participating in the distributed transaction
   * @param failedSystem - The system where the transaction failed
   * @param phase - The phase of the distributed transaction where the failure occurred (prepare, commit, etc.)
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Distributed transaction failed to complete successfully',
    public readonly participantSystems: string[],
    public readonly failedSystem?: string,
    public readonly phase?: 'prepare' | 'commit' | 'rollback',
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext,
    cause?: Error
  ) {
    let enhancedMessage = message;
    if (failedSystem && phase) {
      enhancedMessage += ` (Failed in ${phase} phase on system: ${failedSystem})`;
    }
    
    const enhancedOperationContext: DatabaseOperationContext = {
      ...operationContext,
      participantSystems,
      failedSystem,
      phase
    };
    
    super(
      enhancedMessage,
      DB_TRANS_PG_SERIALIZATION,
      DatabaseErrorSeverity.CRITICAL,
      DatabaseErrorRecoverability.TRANSIENT,
      journeyContext,
      enhancedOperationContext,
      'Check the status of all participating systems and ensure they are available. Consider implementing a compensation mechanism or using a saga pattern for complex distributed transactions.',
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DistributedTransactionError.prototype);
  }

  /**
   * Returns a detailed distributed transaction error message with system information.
   * 
   * @returns Detailed error message with distributed transaction context
   */
  getDistributedTransactionDetails(): string {
    let details = `Distributed transaction across ${this.participantSystems.length} systems failed`;
    
    if (this.failedSystem && this.phase) {
      details += ` during ${this.phase} phase on system ${this.failedSystem}`;
    }
    
    details += `\nParticipating systems: ${this.participantSystems.join(', ')}`;
    
    return `${details}. ${this.recoverySuggestion}`;
  }
}

/**
 * Error class for transaction aborted errors.
 * Used when a transaction is explicitly aborted or cannot proceed due to an error.
 */
export class TransactionAbortedError extends TransactionError {
  /**
   * Creates a new TransactionAbortedError instance.
   * 
   * @param message - Human-readable error message
   * @param abortReason - The reason why the transaction was aborted
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Transaction was aborted',
    public readonly abortReason?: string,
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext,
    cause?: Error
  ) {
    let enhancedMessage = message;
    if (abortReason) {
      enhancedMessage += ` (Reason: ${abortReason})`;
    }
    
    const enhancedOperationContext: DatabaseOperationContext = {
      ...operationContext,
      abortReason
    };
    
    super(
      enhancedMessage,
      DB_TRANS_PG_BEGIN_FAILED,
      DatabaseErrorSeverity.MAJOR,
      DatabaseErrorRecoverability.TRANSIENT,
      journeyContext,
      enhancedOperationContext,
      'Retry the transaction after addressing the abort reason. Check application logic for conditions that might trigger an abort.',
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TransactionAbortedError.prototype);
  }

  /**
   * Returns a detailed transaction aborted error message with reason information.
   * 
   * @returns Detailed error message with abort context
   */
  getAbortDetails(): string {
    let details = 'Transaction aborted';
    
    if (this.abortReason) {
      details += ` due to: ${this.abortReason}`;
    }
    
    return `${details}. ${this.recoverySuggestion}`;
  }
}

/**
 * Error class for transaction isolation level violations.
 * Used when a transaction encounters an issue related to its isolation level.
 */
export class TransactionIsolationError extends TransactionError {
  /**
   * Creates a new TransactionIsolationError instance.
   * 
   * @param message - Human-readable error message
   * @param isolationLevel - The isolation level that was in effect
   * @param requiredLevel - The isolation level that would be required to avoid the error
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Transaction isolation level violation',
    public readonly isolationLevel?: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable',
    public readonly requiredLevel?: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable',
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext,
    cause?: Error
  ) {
    let enhancedMessage = message;
    if (isolationLevel && requiredLevel) {
      enhancedMessage += ` (Current: ${isolationLevel}, Required: ${requiredLevel})`;
    }
    
    const enhancedOperationContext: DatabaseOperationContext = {
      ...operationContext,
      isolationLevel,
      requiredLevel
    };
    
    super(
      enhancedMessage,
      DB_TRANS_PG_SERIALIZATION,
      DatabaseErrorSeverity.MAJOR,
      DatabaseErrorRecoverability.TRANSIENT,
      journeyContext,
      enhancedOperationContext,
      requiredLevel ? `Retry the transaction with ${requiredLevel} isolation level.` : 'Retry the transaction with a higher isolation level.',
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TransactionIsolationError.prototype);
  }

  /**
   * Returns a detailed isolation error message with level information.
   * 
   * @returns Detailed error message with isolation level context
   */
  getIsolationDetails(): string {
    let details = 'Transaction isolation level violation';
    
    if (this.isolationLevel) {
      details += `, current level: ${this.isolationLevel}`;
    }
    
    if (this.requiredLevel) {
      details += `, required level: ${this.requiredLevel}`;
    }
    
    return `${details}. ${this.recoverySuggestion}`;
  }
}

/**
 * Error class for transaction rollback failures.
 * Used when a transaction fails to roll back properly.
 */
export class TransactionRollbackError extends TransactionError {
  /**
   * Creates a new TransactionRollbackError instance.
   * 
   * @param message - Human-readable error message
   * @param rollbackReason - The reason why the rollback was attempted
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Transaction rollback failed',
    public readonly rollbackReason?: string,
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext,
    cause?: Error
  ) {
    let enhancedMessage = message;
    if (rollbackReason) {
      enhancedMessage += ` (Rollback reason: ${rollbackReason})`;
    }
    
    const enhancedOperationContext: DatabaseOperationContext = {
      ...operationContext,
      rollbackReason
    };
    
    super(
      enhancedMessage,
      DB_TRANS_PG_ROLLBACK_FAILED,
      DatabaseErrorSeverity.CRITICAL,
      DatabaseErrorRecoverability.PERMANENT,
      journeyContext,
      enhancedOperationContext,
      'This is a critical error that may leave the database in an inconsistent state. Check database logs and consider manual intervention to resolve the transaction.',
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TransactionRollbackError.prototype);
  }

  /**
   * Returns a detailed rollback error message with reason information.
   * 
   * @returns Detailed error message with rollback context
   */
  getRollbackDetails(): string {
    let details = 'Transaction rollback failed';
    
    if (this.rollbackReason) {
      details += `, original reason for rollback: ${this.rollbackReason}`;
    }
    
    return `${details}. ${this.recoverySuggestion}`;
  }
}

/**
 * Error class for transaction commit failures.
 * Used when a transaction fails to commit properly.
 */
export class TransactionCommitError extends TransactionError {
  /**
   * Creates a new TransactionCommitError instance.
   * 
   * @param message - Human-readable error message
   * @param commitPhase - The phase of the commit process where the failure occurred
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Transaction commit failed',
    public readonly commitPhase?: 'prepare' | 'write' | 'flush' | 'sync',
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext,
    cause?: Error
  ) {
    let enhancedMessage = message;
    if (commitPhase) {
      enhancedMessage += ` during ${commitPhase} phase`;
    }
    
    const enhancedOperationContext: DatabaseOperationContext = {
      ...operationContext,
      commitPhase
    };
    
    super(
      enhancedMessage,
      DB_TRANS_PG_COMMIT_FAILED,
      DatabaseErrorSeverity.CRITICAL,
      DatabaseErrorRecoverability.TRANSIENT,
      journeyContext,
      enhancedOperationContext,
      'Verify the database state and retry the operation. If the issue persists, check database logs for underlying issues.',
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TransactionCommitError.prototype);
  }

  /**
   * Returns a detailed commit error message with phase information.
   * 
   * @returns Detailed error message with commit context
   */
  getCommitDetails(): string {
    let details = 'Transaction commit failed';
    
    if (this.commitPhase) {
      details += ` during ${this.commitPhase} phase`;
    }
    
    return `${details}. ${this.recoverySuggestion}`;
  }
}

/**
 * Error class for transaction concurrency control failures.
 * Used when a transaction encounters concurrency control issues like serialization failures.
 */
export class ConcurrencyControlError extends TransactionError {
  /**
   * Creates a new ConcurrencyControlError instance.
   * 
   * @param message - Human-readable error message
   * @param conflictType - The type of concurrency conflict encountered
   * @param affectedRows - Number of rows affected by the conflict, if available
   * @param journeyContext - Context information about the journey where the error occurred
   * @param operationContext - Context information about the database operation
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Transaction failed due to concurrency control violation',
    public readonly conflictType?: 'read-write' | 'write-write' | 'phantom-read' | 'non-repeatable-read',
    public readonly affectedRows?: number,
    journeyContext?: JourneyContext,
    operationContext?: DatabaseOperationContext,
    cause?: Error
  ) {
    let enhancedMessage = message;
    if (conflictType) {
      enhancedMessage += ` (Conflict type: ${conflictType})`;
      if (affectedRows !== undefined) {
        enhancedMessage += `, ${affectedRows} rows affected`;
      }
    }
    
    const enhancedOperationContext: DatabaseOperationContext = {
      ...operationContext,
      conflictType,
      affectedRows
    };
    
    super(
      enhancedMessage,
      DB_TRANS_PG_SERIALIZATION,
      DatabaseErrorSeverity.MAJOR,
      DatabaseErrorRecoverability.TRANSIENT,
      journeyContext,
      enhancedOperationContext,
      'Retry the transaction. Consider using optimistic concurrency control with version numbers or timestamps for frequently contested resources.',
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ConcurrencyControlError.prototype);
  }

  /**
   * Returns a detailed concurrency control error message with conflict information.
   * 
   * @returns Detailed error message with concurrency context
   */
  getConcurrencyDetails(): string {
    let details = 'Concurrency control violation';
    
    if (this.conflictType) {
      details += `, conflict type: ${this.conflictType}`;
    }
    
    if (this.affectedRows !== undefined) {
      details += `, ${this.affectedRows} rows affected`;
    }
    
    return `${details}. ${this.recoverySuggestion}`;
  }
}