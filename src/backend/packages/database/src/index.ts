/**
 * @austa/database
 * 
 * This package provides a comprehensive database access layer for the AUSTA SuperApp,
 * with journey-specific optimizations, connection pooling, error handling, and transaction management.
 * It serves as the foundation for all database operations across the application's microservices.
 */

// Core exports
export { PrismaService } from './prisma.service';
export { DatabaseModule } from './database.module';

// Connection management
export {
  ConnectionManager,
  ConnectionPool,
  ConnectionHealth,
  ConnectionRetry,
  ConnectionConfig,
  // Types
  ConnectionOptions,
  ConnectionStatus,
  ConnectionMetrics,
  ConnectionPoolOptions,
  ConnectionRetryOptions,
  ConnectionHealthOptions,
} from './connection';

// Journey-specific database contexts
export {
  BaseJourneyContext,
  HealthContext,
  CareContext,
  PlanContext,
  // Types
  JourneyContextOptions,
  ContextFactory,
} from './contexts';

// Error handling
export {
  // Exceptions
  DatabaseException,
  ConnectionException,
  QueryException,
  TransactionException,
  IntegrityException,
  ConfigurationException,
  // Error transformers
  ErrorTransformer,
  // Retry strategies
  RetryStrategy,
  ExponentialBackoffStrategy,
  CircuitBreakerStrategy,
  RetryStrategyFactory,
  // Error codes and types
  DatabaseErrorCodes,
  DatabaseErrorType,
  DatabaseErrorSeverity,
  DatabaseErrorRecoverability,
} from './errors';

// Middleware
export {
  // Interfaces
  DatabaseMiddleware,
  MiddlewareContext,
  LoggingMiddleware,
  PerformanceMiddleware,
  TransformationMiddleware,
  CircuitBreakerMiddleware as CircuitBreakerMiddlewareInterface,
  TransformationRule,
  // Implementations
  CircuitBreakerMiddleware,
  TransformationMiddleware as TransformationMiddlewareImpl,
  PerformanceMiddleware as PerformanceMiddlewareImpl,
  LoggingMiddleware as LoggingMiddlewareImpl,
  // Registry and factory
  MiddlewareRegistry,
  MiddlewareFactory,
  // Types
  MiddlewareOptions,
  MiddlewareType,
} from './middleware';

// Transaction management
export {
  // Service
  TransactionService,
  // Decorators
  Transactional,
  ReadOnly,
  ReadWrite,
  WriteOnly,
  CriticalWrite,
  RequiresNewTransaction,
  // Utility functions
  isInTransaction,
  getCurrentTransactionClient,
  getCurrentTransactionMetadata,
  executeWithTransaction,
  // Transaction execution utilities
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
  // Types
  TransactionalOptions,
  TransactionOptions,
  TransactionIsolationLevel,
  TransactionState,
  TransactionType,
  TransactionCallback,
  TransactionMetadata,
  TransactionTimeoutOptions,
  TransactionRetryOptions,
  TransactionLoggingOptions,
  SavepointOptions,
  DistributedTransactionOptions,
  Transaction,
  TransactionManager,
  TransactionPerformanceMetrics,
  TransactionDebugInfo,
  OperationType,
  // Errors
  TransactionError,
  TransactionTimeoutError,
  DeadlockError,
  DistributedTransactionError,
  TransactionAbortedError,
  TransactionIsolationError,
  TransactionRollbackError,
  TransactionCommitError,
  ConcurrencyControlError,
  // Constants
  DEFAULT_TRANSACTION_OPTIONS,
  PRISMA_ISOLATION_LEVEL_MAP,
  // Utility functions
  getIsolationLevelForOperation,
  isTransientDatabaseError,
  shouldRetryTransaction,
  calculateRetryDelay,
} from './transactions';

// Types
export {
  // Journey types
  JourneyType,
  JourneyId,
  JourneyMetadata,
  // Context types
  DatabaseContext,
  ContextOptions,
  // Transaction types
  TransactionConfig,
  TransactionStatus,
  // Query types
  QueryOptions,
  FilterOptions,
  SortOptions,
  PaginationOptions,
  // Connection types
  DatabaseConnectionConfig,
  SSLConfig,
  PoolConfig,
  // Circuit breaker types
  CircuitState,
  OperationType,
  CircuitBreakerOptions,
  CircuitBreakerStats,
  JourneyThresholds,
} from './types';

// Utilities
export {
  // Entity mappers
  createEntityMapper,
  createModelMapper,
  mapEntities,
  createSelectiveMapper,
  getMapperForEntityType,
  // Journey-specific entity mappers
  mapHealthMetricEntity,
  mapHealthGoalEntity,
  mapMedicalEventEntity,
  mapDeviceConnectionEntity,
  mapAppointmentEntity,
  mapProviderEntity,
  mapMedicationEntity,
  mapTelemedicineSessionEntity,
  mapTreatmentPlanEntity,
  mapPlanEntity,
  mapBenefitEntity,
  mapCoverageEntity,
  mapClaimEntity,
  mapDocumentEntity,
  // Entity mapper types
  EntityMapper,
  ModelMapper,
  SelectiveMapOptions,
  ComputedPropertyFn,
  ComputedProperty,
  EntityMapOptions,
  BatchMapOptions,
  // Validation
  validateInput,
  validateOutput,
  createValidationSchema,
  // Batch operations
  batchCreate,
  batchUpdate,
  batchDelete,
  batchUpsert,
  // Query building
  createQueryBuilder,
  buildWhereClause,
  buildOrderByClause,
  // Sorting
  createSortOptions,
  applySorting,
  // Filtering
  createFilterOptions,
  applyFilters,
  // Pagination
  createPaginationOptions,
  applyPagination,
  createPaginationResponse,
} from './utils';