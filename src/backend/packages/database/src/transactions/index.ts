/**
 * @file index.ts
 * @description Barrel file that exports all transaction-related components from the transactions module.
 * It provides a clean, organized API for other services to import transaction management utilities
 * without needing to know the internal file structure.
 */

// Export transaction decorators
export {
  Transactional,
  ReadOnly,
  ReadWrite,
  WriteOnly,
  CriticalWrite,
  RequiresNewTransaction,
  TransactionalOptions,
  isInTransaction,
  getCurrentTransactionClient,
  getCurrentTransactionMetadata,
  executeWithTransaction
} from './transaction.decorators';

// Export transaction utilities
export {
  executeInTransaction,
  executeReadOperation,
  executeWriteOperation,
  executeReadWriteOperation,
  executeCriticalWriteOperation,
  executeBatchOperations,
  executeWithTransactionRetry,
  executeWithTimeout,
  executeWithPerformanceTracking,
  executeDatabaseOperation,
  OperationType,
  getIsolationLevelForOperation,
  isTransientDatabaseError,
  shouldRetryTransaction,
  calculateRetryDelay,
  TransactionPerformanceMetrics,
  TransactionDebugInfo
} from './transaction.utils';

// Export transaction errors
export {
  TransactionError,
  TransactionTimeoutError,
  DeadlockError,
  DistributedTransactionError,
  TransactionAbortedError,
  TransactionIsolationError,
  TransactionRollbackError,
  TransactionCommitError,
  ConcurrencyControlError
} from './transaction.errors';

// Re-export transaction types from types directory
export {
  TransactionIsolationLevel,
  TransactionState,
  TransactionType,
  TransactionOptions,
  TransactionTimeoutOptions,
  TransactionRetryOptions,
  TransactionLoggingOptions,
  SavepointOptions,
  DistributedTransactionOptions,
  TransactionMetadata,
  TransactionCallback,
  Transaction,
  TransactionManager,
  DEFAULT_TRANSACTION_OPTIONS,
  PRISMA_ISOLATION_LEVEL_MAP
} from '../types/transaction.types';

// Export transaction service
export { TransactionService } from './transaction.service';