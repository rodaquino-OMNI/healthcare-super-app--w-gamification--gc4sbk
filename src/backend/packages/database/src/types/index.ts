/**
 * @file index.ts
 * @description Central export point for all database type definitions in the AUSTA SuperApp.
 * This barrel file provides a structured and organized way to export all database types,
 * ensuring consistent usage across the application and preventing circular dependencies.
 * 
 * The types are organized into categories:
 * - Connection: Types for database connection configuration and management
 * - Context: Types for database contexts and operations
 * - Journey: Types specific to the journey-centered architecture
 * - Query: Types for database query operations (filtering, sorting, pagination)
 * - Transaction: Types for database transaction management
 */

// ===================================================================
// Connection Types
// ===================================================================

/**
 * Database technology and connection configuration types
 * @module ConnectionTypes
 */
export {
  // Database technology enums
  DatabaseTechnology,
  ConnectionStatus,
  SSLMode,
  
  // Connection configuration interfaces
  type ISSLConfiguration,
  type IConnectionPoolConfig,
  type IConnectionRetryConfig,
  type IBaseConnectionConfig,
  type IPostgresConnectionConfig,
  type ITimescaleConnectionConfig,
  type IRedisConnectionConfig,
  type IS3ConnectionConfig,
  type ConnectionConfig,
  
  // Connection factory and management
  type IConnectionFactoryOptions,
  type IConnectionEvent,
  type IConnectionMetrics,
  type ConnectionValidationResult,
} from './connection.types';

// ===================================================================
// Context Types
// ===================================================================

/**
 * Database context and operation types
 * @module ContextTypes
 */
export {
  // Base database context interfaces
  type DatabaseContext,
  DatabaseType,
  type DatabaseContextConfig,
  type DatabaseContextHealthMetrics,
  type DatabaseContextFactory,
  
  // Journey-specific database contexts
  type JourneyDatabaseContext,
  type PrismaDatabaseContext,
  type RedisDatabaseContext,
  type HealthDatabaseContext,
  type CareDatabaseContext,
  type PlanDatabaseContext,
  
  // Default configurations
  DEFAULT_DATABASE_CONTEXT_CONFIG,
  DEFAULT_HEALTH_CONTEXT_CONFIG,
  DEFAULT_CARE_CONTEXT_CONFIG,
  DEFAULT_PLAN_CONTEXT_CONFIG,
  
  // Context creation and operation options
  type ContextCreationOptions,
  type DatabaseOperationOptions,
  
  // Database event types
  DatabaseEventType,
} from './context.types';

// ===================================================================
// Journey Types
// ===================================================================

/**
 * Journey-specific database types for the AUSTA SuperApp's journey-centered architecture
 * @module JourneyTypes
 */
export {
  // Journey ID and metadata
  type JourneyId,
  type JourneyMetadata,
  isValidJourneyId,
  
  // Journey database options
  type JourneyDatabaseOptions,
  DEFAULT_JOURNEY_DATABASE_OPTIONS,
  
  // Cross-journey relationships
  type CrossJourneyRelationship,
  
  // Journey-specific query parameters
  type BaseJourneyQueryParams,
  type HealthJourneyQueryParams,
  type CareJourneyQueryParams,
  type PlanJourneyQueryParams,
  type JourneyQueryParams,
  
  // Journey database results
  type JourneyDatabaseResult,
  
  // Journey context factory
  type JourneyContextFactoryOptions,
  DEFAULT_JOURNEY_CONTEXT_FACTORY_OPTIONS,
  
  // Journey error handling
  type JourneyErrorCode,
  type JourneyDatabaseError,
} from './journey.types';

// ===================================================================
// Query Types
// ===================================================================

/**
 * Database query operation types for filtering, sorting, pagination, and projection
 * @module QueryTypes
 */
export {
  // Journey context
  type JourneyContext,
  journeyContextSchema,
  
  // Sorting
  SortDirection,
  NullsPosition,
  type SortSpec,
  type SortOptions,
  sortDirectionSchema,
  nullsPositionSchema,
  sortSpecSchema,
  sortOptionsSchema,
  
  // Filtering
  ComparisonOperator,
  LogicalOperator,
  type FilterCondition,
  type FilterGroup,
  type FilterOptions,
  comparisonOperatorSchema,
  logicalOperatorSchema,
  filterConditionSchema,
  filterGroupSchema,
  filterOptionsSchema,
  
  // Pagination
  PaginationType,
  type BasePaginationOptions,
  type OffsetPaginationOptions,
  type CursorPaginationOptions,
  type PaginationOptions,
  type PaginationMeta,
  type PaginatedResult,
  paginationTypeSchema,
  offsetPaginationOptionsSchema,
  cursorPaginationOptionsSchema,
  paginationOptionsSchema,
  paginationMetaSchema,
  createPaginatedResultSchema,
  
  // Selection
  type SelectOptions,
  selectOptionsSchema,
  
  // Complete query options
  type QueryOptions,
  queryOptionsSchema,
  
  // Prisma-specific types
  type PrismaWhereInput,
  type PrismaOrderByInput,
  type PrismaSelectInput,
  type PrismaIncludeInput,
  type ModelType,
  type WhereInputType,
  type OrderByInputType,
  type SelectInputType,
  type IncludeInputType,
  
  // Query builder types
  type FilterToPrismaWhere,
  type SortToPrismaOrderBy,
  type SelectToPrismaSelect,
  type PaginationToPrismaPagination,
  type QueryToPrismaParams,
  type QueryBuilder,
  
  // Time-series specific types
  type TimeSeriesQueryOptions,
  type TimeSeriesQueryBuilder,
  timeRangeSchema,
  timeBucketSchema,
  aggregationSchema,
  timeSeriesQueryOptionsSchema,
  
  // Query utilities
  QueryUtils,
  
  // Journey-specific query options
  type HealthQueryOptions,
  type CareQueryOptions,
  type PlanQueryOptions,
  healthQueryOptionsSchema,
  careQueryOptionsSchema,
  planQueryOptionsSchema,
} from './query.types';

// ===================================================================
// Transaction Types
// ===================================================================

/**
 * Database transaction management types
 * @module TransactionTypes
 */
export {
  // Transaction isolation levels
  TransactionIsolationLevel,
  PRISMA_ISOLATION_LEVEL_MAP,
  
  // Transaction states and types
  TransactionState,
  TransactionType,
  
  // Transaction configuration
  type TransactionTimeoutOptions,
  type TransactionRetryOptions,
  type TransactionLoggingOptions,
  type SavepointOptions,
  type DistributedTransactionOptions,
  type TransactionOptions,
  DEFAULT_TRANSACTION_OPTIONS,
  
  // Transaction metadata and execution
  type TransactionMetadata,
  type TransactionCallback,
  type Transaction,
  type TransactionManager,
} from './transaction.types';

// ===================================================================
// Re-export JourneyType enum from context.types.ts
// This is needed because it's referenced in multiple type files
// ===================================================================
export { JourneyType } from './context.types';