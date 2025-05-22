/**
 * @file index.ts
 * @description Barrel file that exports all database type definitions in a structured and organized way.
 * This central export point simplifies imports across the application by allowing consumers to import
 * any database type from a single location without needing to know the internal folder structure or
 * file organization.
 */

// -----------------------------------------------------------------------------
// Connection Types
// -----------------------------------------------------------------------------

export {
  // Core connection types
  RetryPolicy,
  DEFAULT_RETRY_POLICY,
  SSLConfiguration,
  DEFAULT_SSL_CONFIGURATION,
  ConnectionPoolConfig,
  DEFAULT_CONNECTION_POOL_CONFIG,
  PostgresConnectionConfig,
  RedisConnectionConfig,
  S3ConnectionConfig,
  DatabaseConnectionConfig,
  DatabaseConnectionType,
  isPostgresConnectionConfig,
  isRedisConnectionConfig,
  isS3ConnectionConfig,
  
  // Connection status and monitoring
  ConnectionStatus,
  ConnectionErrorCategory,
  ConnectionError,
  ConnectionMetrics,
  JourneyDatabaseOptions,
  
  // Transaction isolation levels
  TransactionIsolationLevel,
  TransactionOptions,
  DEFAULT_TRANSACTION_OPTIONS,
  
  // Health check configuration
  ConnectionHealthCheckConfig,
  DEFAULT_CONNECTION_HEALTH_CHECK_CONFIG,
  
  // Migration configuration
  MigrationConfig,
  DEFAULT_MIGRATION_CONFIG,
  
  // Connection factory options
  ConnectionFactoryOptions,
  
  // Connection events
  ConnectionEventType,
  ConnectionEvent,
  ConnectionEventListener,
  ConnectionEventEmitter,
  
  // Database query interfaces
  DatabaseQuery,
  DatabaseQueryResult,
  
  // Connection validation
  ConnectionConfigValidator,
  ConnectionStringParser,
  
  // Connection configuration builders
  ConnectionConfigBuilder,
  PostgresConnectionConfigBuilder,
  RedisConnectionConfigBuilder,
  S3ConnectionConfigBuilder,
  
  // Database connection interfaces
  DatabaseConnection,
  DatabaseTransaction,
  ConnectionFactory,
  ConnectionManager
} from './connection.types';

// -----------------------------------------------------------------------------
// Query Types
// -----------------------------------------------------------------------------

export {
  // Base query types
  BaseQueryParams,
  
  // Filtering types
  ComparisonOperator,
  LogicalOperator,
  FilterCondition,
  BetweenFilterCondition,
  InFilterCondition,
  NullFilterCondition,
  RegexFilterCondition,
  JsonPathFilterCondition,
  AnyFilterCondition,
  FilterGroup,
  FilterParams,
  TypedFilterCondition,
  TypedFilterGroup,
  TypedFilterParams,
  
  // Sorting types
  SortDirection,
  SortCriterion,
  SortParams,
  TypedSortParams,
  
  // Pagination types
  BasePaginationParams,
  OffsetPaginationParams,
  CursorPaginationParams,
  PaginationParams,
  PaginationMeta,
  
  // Projection types
  ProjectionMode,
  ProjectionParams,
  TypedProjectionParams,
  
  // Composite query types
  TypedQueryParams,
  QueryResult,
  QueryBuilder,
  QueryExecutor
} from './query.types';

// -----------------------------------------------------------------------------
// Transaction Types
// -----------------------------------------------------------------------------

export {
  // Transaction isolation levels
  TransactionIsolationLevel as TxIsolationLevel,
  
  // Transaction retry strategy
  TransactionRetryStrategy,
  
  // Transaction options
  TransactionOptions as TxOptions,
  
  // Transaction client
  TransactionClient,
  TransactionCallback,
  
  // Nested transactions
  NestedTransaction,
  
  // Transaction results
  TransactionResult,
  
  // Transaction management
  TransactionManager,
  TransactionFactory,
  
  // Distributed transactions
  DistributedTransactionOptions,
  DistributedTransactionCoordinator
} from './transaction.types';

// -----------------------------------------------------------------------------
// Context Types
// -----------------------------------------------------------------------------

export {
  // Base context types
  DatabaseContext,
  DatabaseHealthStatus,
  DatabaseContextOptions,
  
  // Prisma context
  PrismaDatabaseContext,
  PrismaTransactionOptions,
  
  // Redis context
  RedisDatabaseContext,
  
  // TimescaleDB context
  TimescaleDBContext,
  TimeBucketQueryParams,
  
  // S3 context
  S3DatabaseContext,
  S3UploadParams,
  S3UploadResult,
  S3DownloadParams,
  S3DownloadResult,
  S3DeleteParams,
  S3ListParams,
  S3ListResult,
  S3PresignedUrlParams,
  
  // Context factory and registry
  DatabaseContextFactory,
  DatabaseContextRegistry
} from './context.types';

// -----------------------------------------------------------------------------
// Journey Types
// -----------------------------------------------------------------------------

export {
  // Journey identifiers
  JourneyId,
  JourneyMetadata,
  JourneyContextConfig,
  
  // Journey database operations
  JourneyDatabaseOperations,
  CrossJourneyRelationship,
  
  // Journey query parameters
  JourneyQueryParams,
  HealthJourneyQueryParams,
  CareJourneyQueryParams,
  PlanJourneyQueryParams,
  
  // Journey-specific operations
  HealthJourneyDatabaseOperations,
  CareJourneyDatabaseOperations,
  PlanJourneyDatabaseOperations,
  
  // Gamification integration
  JourneyGamificationEvent,
  
  // Journey context factory
  JourneyContextFactory,
  JourneyDatabaseOperationsMap,
  JourneyOperationsForId
} from './journey.types';

// -----------------------------------------------------------------------------
// Re-export types from other modules for convenience
// -----------------------------------------------------------------------------

// Re-export database error types for convenience
export { DatabaseErrorType } from '../errors/database-error.types';

// Re-export middleware context types for convenience
export { MiddlewareContext, JourneyContext } from '../middleware/middleware.interface';