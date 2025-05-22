/**
 * @file connection.types.ts
 * @description TypeScript interfaces and types for database connection configurations
 * across all supported database technologies (PostgreSQL, TimescaleDB, Redis, and S3).
 * Provides strongly-typed configuration options for connection pooling, SSL settings,
 * authentication, and retry policies.
 */

/**
 * Common retry policy configuration for all database connections
 */
export interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds before the first retry */
  initialDelayMs: number;
  /** Maximum delay in milliseconds between retries */
  maxDelayMs: number;
  /** Multiplier for exponential backoff strategy */
  backoffMultiplier: number;
  /** Whether to use jitter to randomize delay times */
  useJitter: boolean;
  /** Specific error codes that should trigger a retry */
  retryableErrorCodes?: string[] | number[];
  /** Timeout in milliseconds for each connection attempt */
  connectionTimeoutMs: number;
}

/**
 * Default retry policy settings
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 5,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  useJitter: true,
  connectionTimeoutMs: 10000,
};

/**
 * SSL configuration options for database connections
 */
export interface SSLConfiguration {
  /** Whether to enable SSL for the connection */
  enabled: boolean;
  /** Whether to reject unauthorized SSL certificates */
  rejectUnauthorized?: boolean;
  /** Path to the CA certificate file */
  ca?: string;
  /** Path to the client certificate file */
  cert?: string;
  /** Path to the client key file */
  key?: string;
  /** SSL mode (disable, prefer, require, verify-ca, verify-full) */
  mode?: 'disable' | 'prefer' | 'require' | 'verify-ca' | 'verify-full';
}

/**
 * Default SSL configuration
 */
export const DEFAULT_SSL_CONFIGURATION: SSLConfiguration = {
  enabled: true,
  rejectUnauthorized: true,
  mode: 'verify-full',
};

/**
 * Connection pooling configuration for database connections
 */
export interface ConnectionPoolConfig {
  /** Minimum number of connections in the pool */
  min: number;
  /** Maximum number of connections in the pool */
  max: number;
  /** Maximum time (in milliseconds) that a connection can be idle before being removed */
  idleTimeoutMs: number;
  /** Maximum lifetime (in milliseconds) of a connection before it is closed and replaced */
  maxLifetimeMs: number;
  /** Time (in milliseconds) to wait for a connection from the pool before timing out */
  connectionTimeoutMs: number;
  /** Whether to test connections before they are used from the pool */
  testOnBorrow: boolean;
  /** Query to use for testing connections */
  testQuery?: string;
}

/**
 * Default connection pool configuration
 */
export const DEFAULT_CONNECTION_POOL_CONFIG: ConnectionPoolConfig = {
  min: 2,
  max: 10,
  idleTimeoutMs: 30000,
  maxLifetimeMs: 3600000,
  connectionTimeoutMs: 5000,
  testOnBorrow: true,
};

/**
 * PostgreSQL specific connection configuration
 */
export interface PostgresConnectionConfig {
  /** Database host */
  host: string;
  /** Database port */
  port: number;
  /** Database name */
  database: string;
  /** Database schema */
  schema?: string;
  /** Database user */
  user: string;
  /** Database password */
  password: string;
  /** Connection pooling configuration */
  pool?: ConnectionPoolConfig;
  /** SSL configuration */
  ssl?: SSLConfiguration;
  /** Retry policy */
  retry?: RetryPolicy;
  /** Application name for identification in database logs */
  applicationName?: string;
  /** Statement timeout in milliseconds */
  statementTimeoutMs?: number;
  /** Query timeout in milliseconds */
  queryTimeoutMs?: number;
  /** Whether to use prepared statements */
  usePreparedStatements?: boolean;
  /** Whether this is a TimescaleDB connection */
  isTimescaleDB?: boolean;
}

/**
 * Redis specific connection configuration
 */
export interface RedisConnectionConfig {
  /** Redis host */
  host: string;
  /** Redis port */
  port: number;
  /** Redis database number */
  db?: number;
  /** Redis password */
  password?: string;
  /** Redis username (for Redis 6+ ACL) */
  username?: string;
  /** Connection pooling configuration */
  pool?: ConnectionPoolConfig;
  /** SSL configuration */
  ssl?: SSLConfiguration;
  /** Retry policy */
  retry?: RetryPolicy;
  /** Whether to enable TLS */
  tls?: boolean;
  /** Command timeout in milliseconds */
  commandTimeoutMs?: number;
  /** Whether to enable automatic reconnection */
  enableAutoPipelining?: boolean;
  /** Maximum number of reconnection attempts */
  maxReconnectAttempts?: number;
  /** Whether to enable cluster mode */
  enableClusterMode?: boolean;
  /** Cluster nodes (required if enableClusterMode is true) */
  clusterNodes?: Array<{ host: string; port: number }>;
  /** Key prefix for all keys */
  keyPrefix?: string;
}

/**
 * S3 specific connection configuration
 */
export interface S3ConnectionConfig {
  /** AWS region */
  region: string;
  /** S3 bucket name */
  bucket: string;
  /** AWS access key ID */
  accessKeyId?: string;
  /** AWS secret access key */
  secretAccessKey?: string;
  /** Whether to use path style addressing */
  forcePathStyle?: boolean;
  /** Custom endpoint URL (for non-AWS S3-compatible services) */
  endpoint?: string;
  /** Retry policy */
  retry?: RetryPolicy;
  /** Maximum number of concurrent requests */
  maxConcurrentRequests?: number;
  /** Whether to use accelerated endpoint */
  useAccelerateEndpoint?: boolean;
  /** Whether to use dual-stack endpoint */
  useDualstackEndpoint?: boolean;
  /** Default ACL for uploaded objects */
  defaultACL?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read' | 'aws-exec-read' | 'bucket-owner-read' | 'bucket-owner-full-control';
  /** Default storage class for uploaded objects */
  defaultStorageClass?: 'STANDARD' | 'REDUCED_REDUNDANCY' | 'STANDARD_IA' | 'ONEZONE_IA' | 'INTELLIGENT_TIERING' | 'GLACIER' | 'DEEP_ARCHIVE' | 'OUTPOSTS';
}

/**
 * Union type for all database connection configurations
 */
export type DatabaseConnectionConfig = PostgresConnectionConfig | RedisConnectionConfig | S3ConnectionConfig;

/**
 * Database connection type enum
 */
export enum DatabaseConnectionType {
  POSTGRES = 'postgres',
  TIMESCALE = 'timescale',
  REDIS = 'redis',
  S3 = 's3',
}

/**
 * Type guard for PostgreSQL connection configuration
 */
export function isPostgresConnectionConfig(config: DatabaseConnectionConfig): config is PostgresConnectionConfig {
  return 'database' in config && 'user' in config;
}

/**
 * Type guard for Redis connection configuration
 */
export function isRedisConnectionConfig(config: DatabaseConnectionConfig): config is RedisConnectionConfig {
  return 'db' in config || ('host' in config && !('database' in config));
}

/**
 * Type guard for S3 connection configuration
 */
export function isS3ConnectionConfig(config: DatabaseConnectionConfig): config is S3ConnectionConfig {
  return 'bucket' in config && 'region' in config;
}

/**
 * Connection status enum
 */
export enum ConnectionStatus {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

/**
 * Connection error categories
 */
export enum ConnectionErrorCategory {
  AUTHENTICATION = 'authentication',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  RESOURCE_LIMIT = 'resource_limit',
  CONFIGURATION = 'configuration',
  UNKNOWN = 'unknown',
}

/**
 * Connection error interface
 */
export interface ConnectionError {
  /** Error category */
  category: ConnectionErrorCategory;
  /** Original error object */
  originalError: Error;
  /** Error message */
  message: string;
  /** Error code */
  code?: string | number;
  /** Whether the error is retryable */
  isRetryable: boolean;
  /** Connection attempt number when the error occurred */
  attemptNumber?: number;
  /** Timestamp when the error occurred */
  timestamp: Date;
}

/**
 * Connection metrics interface for monitoring
 */
export interface ConnectionMetrics {
  /** Current number of active connections */
  activeConnections: number;
  /** Current number of idle connections */
  idleConnections: number;
  /** Total number of connection attempts */
  connectionAttempts: number;
  /** Total number of successful connections */
  successfulConnections: number;
  /** Total number of failed connections */
  failedConnections: number;
  /** Average connection time in milliseconds */
  averageConnectionTimeMs: number;
  /** Maximum connection time in milliseconds */
  maxConnectionTimeMs: number;
  /** Total number of queries executed */
  totalQueries?: number;
  /** Average query execution time in milliseconds */
  averageQueryTimeMs?: number;
  /** Maximum query execution time in milliseconds */
  maxQueryTimeMs?: number;
  /** Connection pool utilization percentage */
  poolUtilizationPercentage: number;
  /** Timestamp of the last successful connection */
  lastSuccessfulConnection?: Date;
  /** Timestamp of the last failed connection */
  lastFailedConnection?: Date;
  /** Connection errors by category */
  errorsByCategory: Record<ConnectionErrorCategory, number>;
}

/**
 * Database-specific connection options for journey services
 */
export interface JourneyDatabaseOptions {
  /** Journey identifier */
  journeyId: 'health' | 'care' | 'plan' | 'gamification' | 'auth' | 'notification';
  /** Whether to enable query logging */
  enableQueryLogging?: boolean;
  /** Whether to enable performance metrics collection */
  enablePerformanceMetrics?: boolean;
  /** Custom connection name for logging and metrics */
  connectionName?: string;
  /** Custom schema name */
  schemaName?: string;
  /** Whether to enable transaction tracing */
  enableTransactionTracing?: boolean;
  /** Maximum transaction duration in milliseconds before logging a warning */
  maxTransactionDurationMs?: number;
}

/**
 * Transaction isolation levels
 */
export enum TransactionIsolationLevel {
  READ_UNCOMMITTED = 'READ UNCOMMITTED',
  READ_COMMITTED = 'READ COMMITTED',
  REPEATABLE_READ = 'REPEATABLE READ',
  SERIALIZABLE = 'SERIALIZABLE',
}

/**
 * Transaction options interface
 */
export interface TransactionOptions {
  /** Transaction isolation level */
  isolationLevel?: TransactionIsolationLevel;
  /** Maximum transaction timeout in milliseconds */
  timeoutMs?: number;
  /** Whether to use a read-only transaction */
  readOnly?: boolean;
  /** Whether to automatically retry the transaction on specific errors */
  autoRetry?: boolean;
  /** Maximum number of retry attempts for the transaction */
  maxRetries?: number;
  /** Custom transaction name for logging and metrics */
  transactionName?: string;
  /** Whether to enable detailed transaction logging */
  enableDetailedLogging?: boolean;
  /** Whether to use a nested transaction if already in a transaction */
  useNestedTransactions?: boolean;
}

/**
 * Default transaction options
 */
export const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
  isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
  timeoutMs: 30000,
  readOnly: false,
  autoRetry: true,
  maxRetries: 3,
  enableDetailedLogging: false,
  useNestedTransactions: false,
};

/**
 * Connection health check configuration
 */
export interface ConnectionHealthCheckConfig {
  /** Whether to enable health checks */
  enabled: boolean;
  /** Interval in milliseconds between health checks */
  intervalMs: number;
  /** Timeout in milliseconds for health check queries */
  timeoutMs: number;
  /** Custom health check query */
  query?: string;
  /** Maximum number of consecutive failures before marking connection as unhealthy */
  maxConsecutiveFailures: number;
  /** Whether to automatically reconnect when connection is unhealthy */
  autoReconnect: boolean;
  /** Whether to log health check results */
  logResults: boolean;
}

/**
 * Default connection health check configuration
 */
export const DEFAULT_CONNECTION_HEALTH_CHECK_CONFIG: ConnectionHealthCheckConfig = {
  enabled: true,
  intervalMs: 60000,
  timeoutMs: 5000,
  maxConsecutiveFailures: 3,
  autoReconnect: true,
  logResults: false,
};

/**
 * Database migration configuration
 */
export interface MigrationConfig {
  /** Whether to automatically run migrations on startup */
  autoMigrate: boolean;
  /** Path to migration files */
  migrationsPath: string;
  /** Whether to validate the database schema against the expected schema */
  validateSchema: boolean;
  /** Custom migration table name */
  migrationTableName?: string;
  /** Whether to lock migrations to prevent concurrent migrations */
  lockMigrations: boolean;
  /** Timeout in milliseconds for acquiring migration lock */
  lockTimeoutMs: number;
  /** Whether to allow schema drift (differences between actual and expected schema) */
  allowSchemaDrift: boolean;
}

/**
 * Default migration configuration
 */
export const DEFAULT_MIGRATION_CONFIG: MigrationConfig = {
  autoMigrate: true,
  migrationsPath: './prisma/migrations',
  validateSchema: true,
  lockMigrations: true,
  lockTimeoutMs: 10000,
  allowSchemaDrift: false,
};

/**
 * Database connection factory options
 */
export interface ConnectionFactoryOptions {
  /** Connection type */
  type: DatabaseConnectionType;
  /** Connection configuration */
  config: DatabaseConnectionConfig;
  /** Journey-specific options */
  journeyOptions?: JourneyDatabaseOptions;
  /** Health check configuration */
  healthCheck?: ConnectionHealthCheckConfig;
  /** Migration configuration (for SQL databases) */
  migration?: MigrationConfig;
  /** Default transaction options */
  defaultTransactionOptions?: TransactionOptions;
  /** Whether to enable connection metrics collection */
  enableMetrics?: boolean;
  /** Whether to enable connection event logging */
  enableEventLogging?: boolean;
  /** Whether to enable automatic reconnection */
  enableAutoReconnect?: boolean;
  /** Whether to validate the connection configuration */
  validateConfig?: boolean;
}

/**
 * Connection event types
 */
export enum ConnectionEventType {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  RECONNECTED = 'reconnected',
  ERROR = 'error',
  HEALTH_CHECK_SUCCESS = 'health_check_success',
  HEALTH_CHECK_FAILURE = 'health_check_failure',
  POOL_CREATED = 'pool_created',
  POOL_DESTROYED = 'pool_destroyed',
  TRANSACTION_STARTED = 'transaction_started',
  TRANSACTION_COMMITTED = 'transaction_committed',
  TRANSACTION_ROLLED_BACK = 'transaction_rolled_back',
  QUERY_EXECUTED = 'query_executed',
}

/**
 * Connection event interface
 */
export interface ConnectionEvent {
  /** Event type */
  type: ConnectionEventType;
  /** Connection identifier */
  connectionId: string;
  /** Journey identifier */
  journeyId?: string;
  /** Timestamp when the event occurred */
  timestamp: Date;
  /** Additional event data */
  data?: Record<string, any>;
  /** Duration in milliseconds (for timed events) */
  durationMs?: number;
  /** Error information (for error events) */
  error?: ConnectionError;
}

/**
 * Connection event listener function type
 */
export type ConnectionEventListener = (event: ConnectionEvent) => void;

/**
 * Connection event emitter interface
 */
export interface ConnectionEventEmitter {
  /** Add an event listener */
  on(eventType: ConnectionEventType | '*', listener: ConnectionEventListener): void;
  /** Remove an event listener */
  off(eventType: ConnectionEventType | '*', listener: ConnectionEventListener): void;
  /** Emit an event */
  emit(event: ConnectionEvent): void;
}

/**
 * Database query interface
 */
export interface DatabaseQuery {
  /** Query text or identifier */
  text: string;
  /** Query parameters */
  params?: any[];
  /** Query name (for prepared statements) */
  name?: string;
  /** Query timeout in milliseconds */
  timeoutMs?: number;
  /** Whether this is a read-only query */
  readOnly?: boolean;
  /** Transaction context */
  transactionId?: string;
  /** Journey context */
  journeyContext?: string;
}

/**
 * Database query result interface
 */
export interface DatabaseQueryResult<T = any> {
  /** Result data */
  data: T;
  /** Number of rows affected (for write operations) */
  rowCount?: number;
  /** Query execution time in milliseconds */
  executionTimeMs: number;
  /** Whether the query was executed from cache */
  fromCache?: boolean;
  /** Original query */
  query: DatabaseQuery;
  /** Timestamp when the query was executed */
  timestamp: Date;
}

/**
 * Connection configuration validator interface
 */
export interface ConnectionConfigValidator {
  /** Validate PostgreSQL connection configuration */
  validatePostgresConfig(config: PostgresConnectionConfig): string[];
  /** Validate Redis connection configuration */
  validateRedisConfig(config: RedisConnectionConfig): string[];
  /** Validate S3 connection configuration */
  validateS3Config(config: S3ConnectionConfig): string[];
  /** Validate any database connection configuration */
  validateConfig(config: DatabaseConnectionConfig): string[];
}

/**
 * Connection string parser interface
 */
export interface ConnectionStringParser {
  /** Parse PostgreSQL connection string */
  parsePostgresConnectionString(connectionString: string): PostgresConnectionConfig;
  /** Parse Redis connection string */
  parseRedisConnectionString(connectionString: string): RedisConnectionConfig;
  /** Parse S3 connection string */
  parseS3ConnectionString(connectionString: string): S3ConnectionConfig;
  /** Parse any database connection string */
  parseConnectionString(connectionString: string, type: DatabaseConnectionType): DatabaseConnectionConfig;
}

/**
 * Connection configuration builder interface for fluent API
 */
export interface ConnectionConfigBuilder<T extends DatabaseConnectionConfig> {
  /** Build the final configuration */
  build(): T;
}

/**
 * PostgreSQL connection configuration builder
 */
export interface PostgresConnectionConfigBuilder extends ConnectionConfigBuilder<PostgresConnectionConfig> {
  /** Set host */
  withHost(host: string): PostgresConnectionConfigBuilder;
  /** Set port */
  withPort(port: number): PostgresConnectionConfigBuilder;
  /** Set database name */
  withDatabase(database: string): PostgresConnectionConfigBuilder;
  /** Set schema */
  withSchema(schema: string): PostgresConnectionConfigBuilder;
  /** Set credentials */
  withCredentials(user: string, password: string): PostgresConnectionConfigBuilder;
  /** Set connection pool configuration */
  withPool(pool: Partial<ConnectionPoolConfig>): PostgresConnectionConfigBuilder;
  /** Set SSL configuration */
  withSSL(ssl: Partial<SSLConfiguration>): PostgresConnectionConfigBuilder;
  /** Set retry policy */
  withRetryPolicy(retry: Partial<RetryPolicy>): PostgresConnectionConfigBuilder;
  /** Set application name */
  withApplicationName(name: string): PostgresConnectionConfigBuilder;
  /** Set as TimescaleDB */
  asTimescaleDB(): PostgresConnectionConfigBuilder;
}

/**
 * Redis connection configuration builder
 */
export interface RedisConnectionConfigBuilder extends ConnectionConfigBuilder<RedisConnectionConfig> {
  /** Set host */
  withHost(host: string): RedisConnectionConfigBuilder;
  /** Set port */
  withPort(port: number): RedisConnectionConfigBuilder;
  /** Set database number */
  withDatabase(db: number): RedisConnectionConfigBuilder;
  /** Set credentials */
  withCredentials(username: string, password: string): RedisConnectionConfigBuilder;
  /** Set connection pool configuration */
  withPool(pool: Partial<ConnectionPoolConfig>): RedisConnectionConfigBuilder;
  /** Set SSL configuration */
  withSSL(ssl: Partial<SSLConfiguration>): RedisConnectionConfigBuilder;
  /** Set retry policy */
  withRetryPolicy(retry: Partial<RetryPolicy>): RedisConnectionConfigBuilder;
  /** Enable cluster mode */
  withClusterMode(nodes: Array<{ host: string; port: number }>): RedisConnectionConfigBuilder;
  /** Set key prefix */
  withKeyPrefix(prefix: string): RedisConnectionConfigBuilder;
}

/**
 * S3 connection configuration builder
 */
export interface S3ConnectionConfigBuilder extends ConnectionConfigBuilder<S3ConnectionConfig> {
  /** Set region */
  withRegion(region: string): S3ConnectionConfigBuilder;
  /** Set bucket */
  withBucket(bucket: string): S3ConnectionConfigBuilder;
  /** Set credentials */
  withCredentials(accessKeyId: string, secretAccessKey: string): S3ConnectionConfigBuilder;
  /** Set custom endpoint */
  withEndpoint(endpoint: string): S3ConnectionConfigBuilder;
  /** Set retry policy */
  withRetryPolicy(retry: Partial<RetryPolicy>): S3ConnectionConfigBuilder;
  /** Set default ACL */
  withDefaultACL(acl: S3ConnectionConfig['defaultACL']): S3ConnectionConfigBuilder;
  /** Set default storage class */
  withDefaultStorageClass(storageClass: S3ConnectionConfig['defaultStorageClass']): S3ConnectionConfigBuilder;
}

/**
 * Database connection interface
 */
export interface DatabaseConnection<T = any> {
  /** Connection identifier */
  readonly id: string;
  /** Connection type */
  readonly type: DatabaseConnectionType;
  /** Connection configuration */
  readonly config: DatabaseConnectionConfig;
  /** Current connection status */
  readonly status: ConnectionStatus;
  /** Journey context */
  readonly journeyContext?: JourneyDatabaseOptions;
  /** Connection metrics */
  readonly metrics: ConnectionMetrics;
  /** Connection event emitter */
  readonly events: ConnectionEventEmitter;
  
  /** Connect to the database */
  connect(): Promise<void>;
  /** Disconnect from the database */
  disconnect(): Promise<void>;
  /** Check if the connection is healthy */
  isHealthy(): Promise<boolean>;
  /** Execute a query */
  query<R = any>(query: DatabaseQuery): Promise<DatabaseQueryResult<R>>;
  /** Start a transaction */
  beginTransaction(options?: TransactionOptions): Promise<DatabaseTransaction>;
  /** Get the underlying database client */
  getClient(): T;
  /** Reset the connection */
  reset(): Promise<void>;
}

/**
 * Database transaction interface
 */
export interface DatabaseTransaction {
  /** Transaction identifier */
  readonly id: string;
  /** Transaction isolation level */
  readonly isolationLevel: TransactionIsolationLevel;
  /** Whether the transaction is active */
  readonly isActive: boolean;
  /** Transaction start timestamp */
  readonly startTime: Date;
  /** Transaction options */
  readonly options: TransactionOptions;
  
  /** Execute a query within the transaction */
  query<R = any>(query: DatabaseQuery): Promise<DatabaseQueryResult<R>>;
  /** Commit the transaction */
  commit(): Promise<void>;
  /** Rollback the transaction */
  rollback(): Promise<void>;
  /** Create a savepoint */
  savepoint(name: string): Promise<void>;
  /** Rollback to a savepoint */
  rollbackToSavepoint(name: string): Promise<void>;
  /** Release a savepoint */
  releaseSavepoint(name: string): Promise<void>;
}

/**
 * Connection factory interface
 */
export interface ConnectionFactory {
  /** Create a PostgreSQL connection */
  createPostgresConnection(config: PostgresConnectionConfig, options?: Partial<ConnectionFactoryOptions>): DatabaseConnection;
  /** Create a Redis connection */
  createRedisConnection(config: RedisConnectionConfig, options?: Partial<ConnectionFactoryOptions>): DatabaseConnection;
  /** Create an S3 connection */
  createS3Connection(config: S3ConnectionConfig, options?: Partial<ConnectionFactoryOptions>): DatabaseConnection;
  /** Create a connection based on type */
  createConnection(type: DatabaseConnectionType, config: DatabaseConnectionConfig, options?: Partial<ConnectionFactoryOptions>): DatabaseConnection;
  /** Create a connection from environment variables */
  createConnectionFromEnv(type: DatabaseConnectionType, envPrefix?: string): DatabaseConnection;
  /** Create a connection from a connection string */
  createConnectionFromString(connectionString: string, type: DatabaseConnectionType): DatabaseConnection;
}

/**
 * Connection manager interface for managing multiple connections
 */
export interface ConnectionManager {
  /** Get a connection by name */
  getConnection(name: string): DatabaseConnection | undefined;
  /** Register a connection */
  registerConnection(name: string, connection: DatabaseConnection): void;
  /** Remove a connection */
  removeConnection(name: string): boolean;
  /** Get all connection names */
  getConnectionNames(): string[];
  /** Get all connections */
  getAllConnections(): Map<string, DatabaseConnection>;
  /** Check if a connection exists */
  hasConnection(name: string): boolean;
  /** Get the default connection */
  getDefaultConnection(): DatabaseConnection | undefined;
  /** Set the default connection */
  setDefaultConnection(name: string): void;
  /** Close all connections */
  closeAllConnections(): Promise<void>;
  /** Get connection health status for all connections */
  getHealthStatus(): Promise<Record<string, boolean>>;
}

/**
 * Journey-specific database context interface
 */
export interface JourneyDatabaseContext {
  /** Journey identifier */
  readonly journeyId: JourneyDatabaseOptions['journeyId'];
  /** Primary database connection */
  readonly connection: DatabaseConnection;
  /** Redis connection (if available) */
  readonly redis?: DatabaseConnection;
  /** S3 connection (if available) */
  readonly storage?: DatabaseConnection;
  /** Begin a transaction */
  transaction<T>(callback: (tx: DatabaseTransaction) => Promise<T>, options?: TransactionOptions): Promise<T>;
  /** Execute a query */
  query<R = any>(query: DatabaseQuery): Promise<DatabaseQueryResult<R>>;
  /** Get connection metrics */
  getMetrics(): ConnectionMetrics;
  /** Check if the database context is healthy */
  isHealthy(): Promise<boolean>;
  /** Close all connections */
  close(): Promise<void>;
}