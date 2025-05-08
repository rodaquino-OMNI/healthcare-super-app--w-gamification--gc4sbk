/**
 * @file index.ts
 * @description Barrel file that exports all transaction-related components from the transactions module.
 * It provides a clean, organized API for other services to import transaction management utilities
 * without needing to know the internal file structure.
 */

/**
 * Core interfaces and types for transaction management
 */
export {
  // Transaction interfaces
  TransactionClient,
  TransactionClientFactory,
  TransactionExecutor,
  TransactionContext,
  DistributedTransactionParticipant,
  DistributedTransactionCoordinator,
  RetryStrategy,
  RetryStrategyFactory,
  RetryableErrorDetector,
  
  // Transaction types
  TransactionIsolationLevel,
  TransactionOptions,
  TransactionCallback,
  Transaction,
  TransactionState,
  TransactionType,
  TransactionMetadata,
  TransactionManager
} from './transaction.interface';

/**
 * Transaction service implementation
 */
export { TransactionService } from './transaction.service';

/**
 * Decorators for declarative transaction management
 */
export {
  // Main transaction decorators
  Transactional,
  ReadOnly,
  ReadWrite,
  WriteOnly,
  CriticalWrite,
  RequiresNewTransaction,
  
  // Transaction decorator options
  TransactionalOptions,
  
  // Utility functions
  isInTransaction,
  getCurrentTransactionClient,
  getCurrentTransactionMetadata,
  executeWithTransaction
} from './transaction.decorators';

/**
 * Utility functions for transaction management
 */
export {
  // Enums
  OperationType,
  
  // Interfaces
  TransactionPerformanceMetrics,
  TransactionDebugInfo,
  
  // Core transaction execution functions
  executeInTransaction,
  executeReadOperation,
  executeWriteOperation,
  executeReadWriteOperation,
  executeCriticalWriteOperation,
  executeBatchOperations,
  executeWithTransactionRetry,
  
  // Helper functions
  getIsolationLevelForOperation,
  logTransactionPerformance,
  createTransactionDebugInfo,
  transformTransactionError,
  isTransientDatabaseError,
  shouldRetryTransaction,
  calculateRetryDelay,
  executeTransactionWithRetry,
  executeWithTimeout,
  executeWithPerformanceTracking,
  executeDatabaseOperation
} from './transaction.utils';

/**
 * Error classes for transaction failures
 */
export {
  // Base transaction error
  TransactionError,
  
  // Specific transaction error types
  TransactionTimeoutError,
  DeadlockError,
  DistributedTransactionError,
  TransactionAbortedError,
  TransactionIsolationError,
  TransactionRollbackError,
  TransactionCommitError,
  ConcurrencyControlError
} from './transaction.errors';