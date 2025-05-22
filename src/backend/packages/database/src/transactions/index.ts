/**
 * @file index.ts
 * @description Barrel file that exports all transaction-related components from the transactions module.
 * Provides a clean, organized API for other services to import transaction management utilities
 * without needing to know the internal file structure.
 */

/**
 * Core interfaces and types for transaction management
 */
export {
  // Transaction isolation levels
  TransactionIsolationLevel,
  
  // Transaction configuration interfaces
  TransactionOptions,
  TransactionRetryStrategy,
  DistributedTransactionOptions,
  
  // Transaction client types
  TransactionClient,
  TransactionCallback,
  TransactionResult,
  
  // Transaction manager interfaces
  TransactionManager,
  DistributedTransactionCoordinator,
} from './transaction.interface';

/**
 * Transaction service implementation
 */
export {
  TransactionService,
} from './transaction.service';

/**
 * Decorators for declarative transaction management
 */
export {
  // Decorators
  Transactional,
  ReadOnly,
  Serializable,
  
  // Decorator options
  TransactionalOptions,
} from './transaction.decorators';

/**
 * Utility functions for transaction management
 */
export {
  // Core transaction utilities
  executeInTransaction,
  executeWithRetry,
  calculateBackoffDelay,
  isRetryableError,
  sleep,
  
  // Transaction context utilities
  generateTransactionId,
  recommendIsolationLevel,
  createTransactionContext,
  
  // Transaction monitoring utilities
  getTransactionMetrics,
  clearTransactionMetrics,
  calculateTransactionStats,
  debugTransaction,
  
  // Constants and interfaces
  DEFAULT_TRANSACTION_OPTIONS,
  TransactionMetrics,
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
  SerializationError,
  DistributedTransactionError,
  TransactionAbortedError,
  ConnectionLostError,
} from './transaction.errors';