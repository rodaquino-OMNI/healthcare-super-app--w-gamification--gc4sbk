/**
 * @austa/database
 * 
 * This package provides a comprehensive database access layer for the AUSTA SuperApp,
 * with journey-specific optimizations, connection pooling, error handling, and transaction
 * management across all microservices.
 *
 * The package is organized into several modules:
 * - Core: PrismaService and DatabaseModule for NestJS integration
 * - Connection: Connection management, pooling, and health monitoring
 * - Contexts: Journey-specific database contexts for Health, Care, and Plan journeys
 * - Errors: Error handling, transformation, and retry strategies
 * - Middleware: Database operation interceptors for logging, performance, etc.
 * - Transactions: Transaction management with isolation level support
 * - Types: TypeScript interfaces and types for database operations
 * - Utils: Utility functions for common database operations
 */

// Core exports
export { PrismaService } from './prisma.service';
export { DatabaseModule } from './database.module';

// Connection management exports
export {
  ConnectionManager,
  ConnectionPool,
  ConnectionHealth,
  ConnectionRetry,
  ConnectionConfig,
  type ConnectionOptions,
  type ConnectionPoolOptions,
  type ConnectionRetryOptions,
  type ConnectionHealthOptions
} from './connection';

// Journey-specific database contexts
export {
  BaseJourneyContext,
  HealthContext,
  CareContext,
  PlanContext,
  type JourneyContextOptions
} from './contexts';

// Error handling exports
export {
  DatabaseException,
  ConnectionException,
  QueryException,
  TransactionException,
  IntegrityException,
  ConfigurationException,
  ErrorTransformer,
  RetryStrategy,
  ExponentialBackoffStrategy,
  CircuitBreakerStrategy,
  RetryStrategyFactory,
  DATABASE_ERROR_CODES,
  type DatabaseErrorType,
  type DatabaseErrorSeverity,
  type DatabaseErrorRecoverability,
  type DatabaseErrorMetadata
} from './errors';

// Middleware exports
export {
  type DatabaseMiddleware,
  type MiddlewareContext,
  CircuitBreakerMiddleware,
  TransformationMiddleware,
  PerformanceMiddleware,
  LoggingMiddleware,
  MiddlewareRegistry,
  MiddlewareFactory
} from './middleware';

// Transaction management exports
export {
  TransactionService,
  Transactional,
  executeInTransaction,
  selectIsolationLevel,
  type TransactionClient,
  type TransactionOptions,
  TransactionIsolationLevel,
  TransactionError,
  TransactionTimeoutError,
  DeadlockError,
  DistributedTransactionError
} from './transactions';

// Type exports
export {
  // Journey types
  type JourneyType,
  type JourneyId,
  type JourneyMetadata,
  type CrossJourneyRelation,
  
  // Context types
  type DatabaseContext,
  type DatabaseContextOptions,
  type ContextFactory,
  
  // Transaction types
  type TransactionCallback,
  type NestedTransaction,
  type TransactionManager,
  
  // Query types
  type QueryFilter,
  type QuerySort,
  type QueryPagination,
  type QueryProjection,
  
  // Connection types
  type DatabaseConnectionConfig,
  type PostgresConnectionConfig,
  type RedisConnectionConfig,
  type TimescaleConnectionConfig,
  type S3ConnectionConfig
} from './types';

// Utility exports
export {
  // Entity mapping utilities
  mapEntityToDomain,
  mapDomainToEntity,
  mapPartialEntity,
  batchMapEntities,
  
  // Validation utilities
  validateDatabaseInput,
  createValidationSchema,
  formatValidationErrors,
  
  // Batch operation utilities
  batchCreate,
  batchUpdate,
  batchDelete,
  batchUpsert,
  executeInBatches,
  
  // Query building utilities
  createQueryBuilder,
  analyzeQueryPlan,
  optimizeQuery,
  
  // Sorting utilities
  createSortCriteria,
  applySorting,
  
  // Filtering utilities
  createFilter,
  combineFilters,
  
  // Pagination utilities
  createPagination,
  createCursorPagination,
  createOffsetPagination,
  createPaginationResponse
} from './utils';