/**
 * @file connection.types.ts
 * @description TypeScript interfaces and types for database connection configurations
 * across all supported database technologies (PostgreSQL, TimescaleDB, Redis, and S3).
 * Provides strongly-typed configuration options for connection pooling, SSL settings,
 * authentication, and retry policies.
 */

import { ErrorType } from '@austa/errors';

/**
 * Enum representing the supported database technologies in the AUSTA SuperApp
 */
export enum DatabaseTechnology {
  POSTGRESQL = 'postgresql',
  TIMESCALEDB = 'timescaledb',
  REDIS = 'redis',
  S3 = 's3',
}

/**
 * Enum representing the possible states of a database connection
 */
export enum ConnectionStatus {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

/**
 * Enum representing SSL modes for database connections
 */
export enum SSLMode {
  DISABLE = 'disable',
  PREFER = 'prefer',
  REQUIRE = 'require',
  VERIFY_CA = 'verify-ca',
  VERIFY_FULL = 'verify-full',
}

/**
 * Interface for SSL configuration options
 */
export interface ISSLConfiguration {
  /**
   * SSL mode to use for the connection
   * @default SSLMode.PREFER
   */
  mode: SSLMode;
  
  /**
   * Path to the CA certificate file
   * Only used when mode is VERIFY_CA or VERIFY_FULL
   */
  ca?: string;
  
  /**
   * Path to the client certificate file
   * Only used when mode is VERIFY_CA or VERIFY_FULL
   */
  cert?: string;
  
  /**
   * Path to the client key file
   * Only used when mode is VERIFY_CA or VERIFY_FULL
   */
  key?: string;
  
  /**
   * Password for the client key file if it's encrypted
   * Only used when mode is VERIFY_CA or VERIFY_FULL and key is provided
   */
  passphrase?: string;
  
  /**
   * Whether to reject unauthorized connections
   * @default true
   */
  rejectUnauthorized?: boolean;
}

/**
 * Interface for connection pooling configuration
 */
export interface IConnectionPoolConfig {
  /**
   * Minimum number of connections to keep in the pool
   * @default 2
   */
  min: number;
  
  /**
   * Maximum number of connections that can be created in the pool
   * @default 10
   */
  max: number;
  
  /**
   * Maximum time (in milliseconds) that a connection can be idle before being removed
   * @default 30000 (30 seconds)
   */
  idleTimeoutMillis?: number;
  
  /**
   * Maximum time (in milliseconds) to wait for a connection from the pool
   * @default 10000 (10 seconds)
   */
  connectionTimeoutMillis?: number;
  
  /**
   * Time (in milliseconds) to wait before retrying to create a connection
   * @default 1000 (1 second)
   */
  retryIntervalMillis?: number;
  
  /**
   * Whether to validate connections before use
   * @default true
   */
  validateOnBorrow?: boolean;
  
  /**
   * Whether to validate idle connections in the pool
   * @default true
   */
  validateOnIdle?: boolean;
}

/**
 * Interface for database connection retry configuration
 */
export interface IConnectionRetryConfig {
  /**
   * Maximum number of retry attempts
   * @default 5
   */
  maxRetries: number;
  
  /**
   * Initial delay in milliseconds before the first retry
   * @default 100
   */
  initialDelayMs: number;
  
  /**
   * Maximum delay in milliseconds between retries
   * @default 10000 (10 seconds)
   */
  maxDelayMs: number;
  
  /**
   * Factor by which the delay increases with each retry (for exponential backoff)
   * @default 2
   */
  backoffFactor: number;
  
  /**
   * Whether to add jitter to the delay to prevent thundering herd problem
   * @default true
   */
  useJitter: boolean;
  
  /**
   * Types of errors that should trigger a retry
   * @default [ErrorType.TRANSIENT, ErrorType.CONNECTION, ErrorType.TIMEOUT]
   */
  retryableErrors: ErrorType[];
}

/**
 * Base interface for all database connection configurations
 */
export interface IBaseConnectionConfig {
  /**
   * The technology used for this database connection
   */
  technology: DatabaseTechnology;
  
  /**
   * Host name or IP address of the database server
   */
  host: string;
  
  /**
   * Port number for the database connection
   */
  port: number;
  
  /**
   * Connection timeout in milliseconds
   * @default 5000 (5 seconds)
   */
  connectionTimeout?: number;
  
  /**
   * Whether to enable debug logging for this connection
   * @default false
   */
  debug?: boolean;
  
  /**
   * SSL configuration for the connection
   */
  ssl?: ISSLConfiguration;
  
  /**
   * Retry configuration for connection attempts
   */
  retry?: IConnectionRetryConfig;
  
  /**
   * Journey ID associated with this connection (for journey-specific databases)
   */
  journeyId?: string;
}

/**
 * Interface for PostgreSQL connection configuration
 */
export interface IPostgresConnectionConfig extends IBaseConnectionConfig {
  technology: DatabaseTechnology.POSTGRESQL;
  
  /**
   * Database name to connect to
   */
  database: string;
  
  /**
   * Username for authentication
   */
  username: string;
  
  /**
   * Password for authentication
   */
  password: string;
  
  /**
   * Schema to use for this connection
   * @default 'public'
   */
  schema?: string;
  
  /**
   * Connection pool configuration
   */
  pool?: IConnectionPoolConfig;
  
  /**
   * Statement timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  statementTimeout?: number;
  
  /**
   * Whether to use prepared statements
   * @default true
   */
  usePreparedStatements?: boolean;
}

/**
 * Interface for TimescaleDB connection configuration
 * TimescaleDB is an extension of PostgreSQL, so it shares most configuration options
 */
export interface ITimescaleConnectionConfig extends IPostgresConnectionConfig {
  technology: DatabaseTechnology.TIMESCALEDB;
  
  /**
   * Chunk time interval for TimescaleDB hypertables (in milliseconds)
   * @default 86400000 (1 day)
   */
  chunkTimeInterval?: number;
  
  /**
   * Whether to use compression for TimescaleDB hypertables
   * @default true
   */
  useCompression?: boolean;
  
  /**
   * Compression interval for TimescaleDB hypertables (in milliseconds)
   * @default 604800000 (7 days)
   */
  compressionInterval?: number;
}

/**
 * Interface for Redis connection configuration
 */
export interface IRedisConnectionConfig extends IBaseConnectionConfig {
  technology: DatabaseTechnology.REDIS;
  
  /**
   * Password for authentication
   */
  password?: string;
  
  /**
   * Database index to use
   * @default 0
   */
  db?: number;
  
  /**
   * Connection pool configuration
   */
  pool?: IConnectionPoolConfig;
  
  /**
   * Command timeout in milliseconds
   * @default 5000 (5 seconds)
   */
  commandTimeout?: number;
  
  /**
   * Whether to enable key prefix for this connection
   * @default false
   */
  enableKeyPrefix?: boolean;
  
  /**
   * Prefix to use for all keys if enableKeyPrefix is true
   */
  keyPrefix?: string;
  
  /**
   * Whether to enable TLS for this connection
   * @default false
   */
  tls?: boolean;
  
  /**
   * Whether to enable cluster mode
   * @default false
   */
  cluster?: boolean;
  
  /**
   * List of cluster nodes (only used when cluster is true)
   */
  clusterNodes?: Array<{ host: string; port: number }>;
}

/**
 * Interface for S3 connection configuration
 */
export interface IS3ConnectionConfig extends IBaseConnectionConfig {
  technology: DatabaseTechnology.S3;
  
  /**
   * AWS region for the S3 bucket
   */
  region: string;
  
  /**
   * Access key ID for authentication
   */
  accessKeyId: string;
  
  /**
   * Secret access key for authentication
   */
  secretAccessKey: string;
  
  /**
   * Default bucket to use for operations
   */
  bucket: string;
  
  /**
   * Whether to use path style addressing
   * @default false
   */
  forcePathStyle?: boolean;
  
  /**
   * Whether to use accelerated endpoint
   * @default false
   */
  useAccelerateEndpoint?: boolean;
  
  /**
   * Custom endpoint URL (for non-AWS S3-compatible services)
   */
  endpoint?: string;
  
  /**
   * Default ACL for uploaded objects
   * @default 'private'
   */
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
  
  /**
   * Whether to use SSL for the connection
   * @default true
   */
  sslEnabled?: boolean;
}

/**
 * Union type for all database connection configurations
 */
export type ConnectionConfig = 
  | IPostgresConnectionConfig
  | ITimescaleConnectionConfig
  | IRedisConnectionConfig
  | IS3ConnectionConfig;

/**
 * Interface for connection factory options
 */
export interface IConnectionFactoryOptions {
  /**
   * Default retry configuration to use when not specified in the connection config
   */
  defaultRetryConfig?: IConnectionRetryConfig;
  
  /**
   * Default pool configuration to use when not specified in the connection config
   */
  defaultPoolConfig?: IConnectionPoolConfig;
  
  /**
   * Whether to validate connection configurations before creating connections
   * @default true
   */
  validateConfig?: boolean;
  
  /**
   * Whether to automatically reconnect on connection loss
   * @default true
   */
  autoReconnect?: boolean;
  
  /**
   * Logger instance to use for connection-related logging
   */
  logger?: any;
}

/**
 * Interface for connection events
 */
export interface IConnectionEvent {
  /**
   * Type of the connection event
   */
  type: 'connect' | 'disconnect' | 'reconnect' | 'error';
  
  /**
   * Timestamp when the event occurred
   */
  timestamp: Date;
  
  /**
   * Connection configuration associated with this event
   */
  config: ConnectionConfig;
  
  /**
   * Error object if the event type is 'error'
   */
  error?: Error;
  
  /**
   * Additional metadata for the event
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for connection metrics
 */
export interface IConnectionMetrics {
  /**
   * Current status of the connection
   */
  status: ConnectionStatus;
  
  /**
   * Timestamp when the connection was established
   */
  connectedAt?: Date;
  
  /**
   * Timestamp when the connection was last used
   */
  lastUsedAt?: Date;
  
  /**
   * Number of active queries/operations on this connection
   */
  activeOperations: number;
  
  /**
   * Total number of operations performed on this connection
   */
  totalOperations: number;
  
  /**
   * Total number of errors encountered on this connection
   */
  errorCount: number;
  
  /**
   * Total number of reconnection attempts
   */
  reconnectAttempts: number;
  
  /**
   * Average operation duration in milliseconds
   */
  averageOperationDurationMs?: number;
  
  /**
   * Connection configuration
   */
  config: ConnectionConfig;
}

/**
 * Type for connection validation result
 */
export type ConnectionValidationResult = {
  /**
   * Whether the connection is valid
   */
  valid: boolean;
  
  /**
   * Error message if the connection is invalid
   */
  error?: string;
  
  /**
   * Additional details about the validation result
   */
  details?: Record<string, any>;
};