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
  // Implementations
  CircuitBreakerMiddleware,
  TransformationMiddleware,
  PerformanceMiddleware,
  LoggingMiddleware,
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
  // Utilities
  executeInTransaction,
  withTransaction,
  // Types
  TransactionClient,
  TransactionOptions,
  TransactionIsolationLevel,
  TransactionCallback,
  // Errors
  TransactionError,
  TransactionTimeoutError,
  DeadlockError,
  DistributedTransactionError,
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
} from './types';

// Utilities
export {
  // Entity mappers
  mapToEntity,
  mapFromEntity,
  mapEntities,
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