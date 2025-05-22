/**
 * @file context.types.ts
 * @description Provides TypeScript interfaces and types for database contexts, which encapsulate
 * database operations for specific domains or features. These contexts act as facades over the raw
 * database client, providing strongly-typed methods tailored to specific business requirements
 * while enforcing consistent access patterns and error handling.
 */

import { PrismaClient } from '@prisma/client';
import { JourneyId, JourneyContextConfig, JourneyDatabaseOperations } from './journey.types';
import { DatabaseErrorType } from '../errors/database-error.types';
import { DatabaseMiddleware, MiddlewareContext, JourneyContext } from '../middleware/middleware.interface';

/**
 * Base interface for all database contexts
 * Provides common functionality that all database contexts must implement
 */
export interface DatabaseContext {
  /**
   * Initializes the database context
   * @returns A promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;
  
  /**
   * Disposes of the database context, releasing any resources
   * @returns A promise that resolves when disposal is complete
   */
  dispose(): Promise<void>;
  
  /**
   * Checks the health of the database connection
   * @returns A promise that resolves to a health status object
   */
  checkHealth(): Promise<DatabaseHealthStatus>;
  
  /**
   * Gets the database client used by this context
   * @returns The database client instance
   */
  getClient(): unknown;
  
  /**
   * Executes a raw query against the database
   * @param query The raw query to execute
   * @param params The parameters for the query
   * @returns A promise that resolves to the query result
   */
  executeRaw<T = any>(query: string, params?: any[]): Promise<T>;
  
  /**
   * Executes a database operation with middleware processing
   * @param operationName A descriptive name for the operation
   * @param operation The operation function to execute
   * @param context Additional context for middleware processing
   * @returns A promise that resolves to the operation result
   */
  executeWithMiddleware<T = any>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Partial<MiddlewareContext>
  ): Promise<T>;
}

/**
 * Health status of a database connection
 */
export interface DatabaseHealthStatus {
  /**
   * Whether the database is available
   */
  isAvailable: boolean;
  
  /**
   * The status of the database connection
   */
  status: 'up' | 'down' | 'degraded';
  
  /**
   * The response time of the last health check in milliseconds
   */
  responseTimeMs?: number;
  
  /**
   * The timestamp of the last successful connection
   */
  lastSuccessfulConnection?: Date;
  
  /**
   * Details about the connection pool
   */
  connectionPool?: {
    /**
     * The number of active connections
     */
    active: number;
    
    /**
     * The number of idle connections
     */
    idle: number;
    
    /**
     * The total number of connections
     */
    total: number;
    
    /**
     * The maximum number of connections allowed
     */
    max: number;
  };
  
  /**
   * Error details if the health check failed
   */
  error?: {
    /**
     * The error message
     */
    message: string;
    
    /**
     * The error code
     */
    code?: string;
    
    /**
     * The error type
     */
    type?: DatabaseErrorType;
  };
  
  /**
   * Additional metadata about the health check
   */
  metadata?: Record<string, any>;
}

/**
 * Configuration options for database contexts
 */
export interface DatabaseContextOptions {
  /**
   * The name of the context for logging and monitoring
   */
  name: string;
  
  /**
   * The journey context this database context belongs to
   */
  journeyContext?: JourneyContext;
  
  /**
   * The journey ID this database context is associated with
   */
  journeyId?: JourneyId;
  
  /**
   * Whether to enable query logging
   * @default false in production, true in development
   */
  enableLogging?: boolean;
  
  /**
   * Whether to enable performance tracking
   * @default true
   */
  enablePerformanceTracking?: boolean;
  
  /**
   * Whether to enable the circuit breaker pattern
   * @default true in production, false in development
   */
  enableCircuitBreaker?: boolean;
  
  /**
   * Whether to enable query transformation
   * @default true
   */
  enableTransformation?: boolean;
  
  /**
   * Maximum number of retry attempts for retryable errors
   * @default 3
   */
  maxRetryAttempts?: number;
  
  /**
   * Error types that should be automatically retried
   * @default [DatabaseErrorType.CONNECTION, DatabaseErrorType.TRANSACTION]
   */
  retryableErrorTypes?: DatabaseErrorType[];
  
  /**
   * Base delay in milliseconds for retry attempts
   * @default 100
   */
  retryBaseDelayMs?: number;
  
  /**
   * Maximum delay in milliseconds for retry attempts
   * @default 5000
   */
  retryMaxDelayMs?: number;
  
  /**
   * Jitter factor for retry delays (0-1)
   * @default 0.1
   */
  retryJitterFactor?: number;
  
  /**
   * Transaction timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  transactionTimeoutMs?: number;
  
  /**
   * Query timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  queryTimeoutMs?: number;
  
  /**
   * Connection timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  connectionTimeoutMs?: number;
  
  /**
   * Maximum number of connections in the pool
   * @default 10
   */
  maxConnections?: number;
  
  /**
   * Minimum number of connections in the pool
   * @default 2
   */
  minConnections?: number;
  
  /**
   * Idle timeout for connections in milliseconds
   * @default 10000 (10 seconds)
   */
  idleTimeoutMs?: number;
  
  /**
   * Custom middleware to apply to this context
   */
  middleware?: DatabaseMiddleware[];
  
  /**
   * Additional options specific to the database technology
   */
  [key: string]: any;
}

/**
 * Interface for Prisma-specific database context
 * Extends the base DatabaseContext with Prisma-specific functionality
 */
export interface PrismaDatabaseContext extends DatabaseContext {
  /**
   * Gets the Prisma client instance
   * @returns The Prisma client instance
   */
  getClient(): PrismaClient;
  
  /**
   * Executes a Prisma transaction with automatic retry on transient errors
   * @param fn The transaction function
   * @param options Transaction options
   * @returns A promise that resolves to the transaction result
   */
  transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>,
    options?: PrismaTransactionOptions
  ): Promise<T>;
  
  /**
   * Executes a raw SQL query against the database
   * @param sql The SQL query to execute
   * @param params The parameters for the query
   * @returns A promise that resolves to the query result
   */
  executeRawSQL<T = any>(sql: string, params?: any[]): Promise<T>;
}

/**
 * Options for Prisma transactions
 */
export interface PrismaTransactionOptions {
  /**
   * Maximum number of retry attempts for the transaction
   * @default 3
   */
  maxRetryAttempts?: number;
  
  /**
   * Transaction timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeoutMs?: number;
  
  /**
   * Transaction isolation level
   * @default 'ReadCommitted'
   */
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
  
  /**
   * Whether to use a nested transaction if already in a transaction
   * @default true
   */
  useNestedTransactions?: boolean;
}

/**
 * Interface for Redis-specific database context
 * Extends the base DatabaseContext with Redis-specific functionality
 */
export interface RedisDatabaseContext extends DatabaseContext {
  /**
   * Gets the Redis client instance
   * @returns The Redis client instance
   */
  getClient(): any; // Redis client type
  
  /**
   * Sets a key-value pair in Redis with optional expiration
   * @param key The key to set
   * @param value The value to set
   * @param expireSeconds Optional expiration time in seconds
   * @returns A promise that resolves when the operation is complete
   */
  set(key: string, value: string, expireSeconds?: number): Promise<void>;
  
  /**
   * Gets a value from Redis by key
   * @param key The key to get
   * @returns A promise that resolves to the value or null if not found
   */
  get(key: string): Promise<string | null>;
  
  /**
   * Deletes a key from Redis
   * @param key The key to delete
   * @returns A promise that resolves to true if the key was deleted, false otherwise
   */
  delete(key: string): Promise<boolean>;
  
  /**
   * Executes a Redis transaction (multi/exec)
   * @param fn The transaction function
   * @returns A promise that resolves to the transaction result
   */
  transaction<T>(fn: (redis: any) => Promise<T>): Promise<T>;
}

/**
 * Interface for TimescaleDB-specific database context
 * Extends the PrismaDatabaseContext with TimescaleDB-specific functionality
 */
export interface TimescaleDBContext extends PrismaDatabaseContext {
  /**
   * Creates a hypertable for time-series data
   * @param tableName The name of the table to convert to a hypertable
   * @param timeColumn The name of the time column
   * @param chunkTimeInterval The time interval for chunks
   * @returns A promise that resolves when the operation is complete
   */
  createHypertable(
    tableName: string,
    timeColumn: string,
    chunkTimeInterval?: string
  ): Promise<void>;
  
  /**
   * Executes a time-bucket query for time-series aggregation
   * @param query The time-bucket query parameters
   * @returns A promise that resolves to the query result
   */
  executeTimeBucketQuery<T = any>(query: TimeBucketQueryParams): Promise<T[]>;
  
  /**
   * Adds a compression policy to a hypertable
   * @param tableName The name of the hypertable
   * @param compressAfter The time interval after which to compress data
   * @returns A promise that resolves when the operation is complete
   */
  addCompressionPolicy(tableName: string, compressAfter: string): Promise<void>;
}

/**
 * Parameters for TimescaleDB time-bucket queries
 */
export interface TimeBucketQueryParams {
  /**
   * The time bucket interval (e.g., '1 hour', '1 day')
   */
  bucketInterval: string;
  
  /**
   * The time column to bucket by
   */
  timeColumn: string;
  
  /**
   * The table to query
   */
  tableName: string;
  
  /**
   * The columns to select
   */
  selectColumns: string[];
  
  /**
   * The aggregation functions to apply
   */
  aggregations: {
    /**
     * The function to apply (e.g., 'avg', 'sum', 'min', 'max')
     */
    function: string;
    
    /**
     * The column to aggregate
     */
    column: string;
    
    /**
     * The alias for the aggregation result
     */
    alias: string;
  }[];
  
  /**
   * The WHERE conditions for the query
   */
  where?: Record<string, any>;
  
  /**
   * The start time for the query
   */
  startTime?: Date;
  
  /**
   * The end time for the query
   */
  endTime?: Date;
  
  /**
   * The maximum number of results to return
   */
  limit?: number;
  
  /**
   * The number of results to skip
   */
  offset?: number;
  
  /**
   * The columns to order by
   */
  orderBy?: {
    /**
     * The column to order by
     */
    column: string;
    
    /**
     * The direction to order by
     */
    direction: 'asc' | 'desc';
  }[];
}

/**
 * Interface for S3-specific database context
 * Extends the base DatabaseContext with S3-specific functionality
 */
export interface S3DatabaseContext extends DatabaseContext {
  /**
   * Gets the S3 client instance
   * @returns The S3 client instance
   */
  getClient(): any; // S3 client type
  
  /**
   * Uploads an object to S3
   * @param params Upload parameters
   * @returns A promise that resolves to the upload result
   */
  uploadObject(params: S3UploadParams): Promise<S3UploadResult>;
  
  /**
   * Downloads an object from S3
   * @param params Download parameters
   * @returns A promise that resolves to the download result
   */
  downloadObject(params: S3DownloadParams): Promise<S3DownloadResult>;
  
  /**
   * Deletes an object from S3
   * @param params Delete parameters
   * @returns A promise that resolves when the operation is complete
   */
  deleteObject(params: S3DeleteParams): Promise<void>;
  
  /**
   * Lists objects in an S3 bucket
   * @param params List parameters
   * @returns A promise that resolves to the list result
   */
  listObjects(params: S3ListParams): Promise<S3ListResult>;
  
  /**
   * Generates a pre-signed URL for an S3 object
   * @param params Pre-signed URL parameters
   * @returns A promise that resolves to the pre-signed URL
   */
  getPresignedUrl(params: S3PresignedUrlParams): Promise<string>;
}

/**
 * Parameters for S3 object upload
 */
export interface S3UploadParams {
  /**
   * The bucket to upload to
   */
  bucket: string;
  
  /**
   * The key (path) for the object
   */
  key: string;
  
  /**
   * The object data to upload
   */
  body: Buffer | Uint8Array | Blob | string | ReadableStream;
  
  /**
   * The content type of the object
   */
  contentType?: string;
  
  /**
   * Metadata for the object
   */
  metadata?: Record<string, string>;
  
  /**
   * Tags for the object
   */
  tags?: Record<string, string>;
  
  /**
   * The storage class for the object
   */
  storageClass?: string;
  
  /**
   * The encryption settings for the object
   */
  encryption?: {
    /**
     * The encryption algorithm to use
     */
    algorithm: string;
    
    /**
     * The KMS key ID to use
     */
    kmsKeyId?: string;
  };
}

/**
 * Result of an S3 object upload
 */
export interface S3UploadResult {
  /**
   * The bucket the object was uploaded to
   */
  bucket: string;
  
  /**
   * The key (path) of the uploaded object
   */
  key: string;
  
  /**
   * The ETag of the uploaded object
   */
  etag?: string;
  
  /**
   * The version ID of the uploaded object
   */
  versionId?: string;
  
  /**
   * The URL of the uploaded object
   */
  url?: string;
}

/**
 * Parameters for S3 object download
 */
export interface S3DownloadParams {
  /**
   * The bucket to download from
   */
  bucket: string;
  
  /**
   * The key (path) of the object to download
   */
  key: string;
  
  /**
   * The version ID of the object to download
   */
  versionId?: string;
}

/**
 * Result of an S3 object download
 */
export interface S3DownloadResult {
  /**
   * The bucket the object was downloaded from
   */
  bucket: string;
  
  /**
   * The key (path) of the downloaded object
   */
  key: string;
  
  /**
   * The body of the downloaded object
   */
  body: Buffer;
  
  /**
   * The content type of the downloaded object
   */
  contentType?: string;
  
  /**
   * The metadata of the downloaded object
   */
  metadata?: Record<string, string>;
  
  /**
   * The ETag of the downloaded object
   */
  etag?: string;
  
  /**
   * The version ID of the downloaded object
   */
  versionId?: string;
}

/**
 * Parameters for S3 object deletion
 */
export interface S3DeleteParams {
  /**
   * The bucket to delete from
   */
  bucket: string;
  
  /**
   * The key (path) of the object to delete
   */
  key: string;
  
  /**
   * The version ID of the object to delete
   */
  versionId?: string;
}

/**
 * Parameters for S3 object listing
 */
export interface S3ListParams {
  /**
   * The bucket to list objects from
   */
  bucket: string;
  
  /**
   * The prefix to filter objects by
   */
  prefix?: string;
  
  /**
   * The maximum number of objects to return
   */
  maxKeys?: number;
  
  /**
   * The marker to start listing from
   */
  marker?: string;
  
  /**
   * The delimiter to use for grouping objects
   */
  delimiter?: string;
}

/**
 * Result of an S3 object listing
 */
export interface S3ListResult {
  /**
   * The bucket the objects were listed from
   */
  bucket: string;
  
  /**
   * The objects found in the bucket
   */
  objects: {
    /**
     * The key (path) of the object
     */
    key: string;
    
    /**
     * The size of the object in bytes
     */
    size: number;
    
    /**
     * The last modified date of the object
     */
    lastModified: Date;
    
    /**
     * The ETag of the object
     */
    etag?: string;
  }[];
  
  /**
   * The common prefixes found in the bucket
   */
  commonPrefixes?: string[];
  
  /**
   * Whether there are more objects to list
   */
  isTruncated: boolean;
  
  /**
   * The marker to use for the next listing
   */
  nextMarker?: string;
}

/**
 * Parameters for S3 pre-signed URL generation
 */
export interface S3PresignedUrlParams {
  /**
   * The bucket for the pre-signed URL
   */
  bucket: string;
  
  /**
   * The key (path) for the pre-signed URL
   */
  key: string;
  
  /**
   * The operation to generate a pre-signed URL for
   */
  operation: 'getObject' | 'putObject' | 'deleteObject';
  
  /**
   * The expiration time for the pre-signed URL in seconds
   * @default 900 (15 minutes)
   */
  expiresIn?: number;
  
  /**
   * The content type for putObject operations
   */
  contentType?: string;
  
  /**
   * The version ID for the object
   */
  versionId?: string;
}

/**
 * Factory interface for creating database contexts
 */
export interface DatabaseContextFactory {
  /**
   * Creates a new database context
   * @param options Configuration options for the context
   * @returns A promise that resolves to the created context
   */
  createContext(options: DatabaseContextOptions): Promise<DatabaseContext>;
  
  /**
   * Creates a new Prisma database context
   * @param options Configuration options for the context
   * @returns A promise that resolves to the created Prisma context
   */
  createPrismaContext(options: DatabaseContextOptions): Promise<PrismaDatabaseContext>;
  
  /**
   * Creates a new Redis database context
   * @param options Configuration options for the context
   * @returns A promise that resolves to the created Redis context
   */
  createRedisContext(options: DatabaseContextOptions): Promise<RedisDatabaseContext>;
  
  /**
   * Creates a new TimescaleDB database context
   * @param options Configuration options for the context
   * @returns A promise that resolves to the created TimescaleDB context
   */
  createTimescaleDBContext(options: DatabaseContextOptions): Promise<TimescaleDBContext>;
  
  /**
   * Creates a new S3 database context
   * @param options Configuration options for the context
   * @returns A promise that resolves to the created S3 context
   */
  createS3Context(options: DatabaseContextOptions): Promise<S3DatabaseContext>;
  
  /**
   * Creates a new journey-specific database context
   * @param journeyId The journey ID for the context
   * @param config Additional configuration for the journey context
   * @returns A promise that resolves to the created journey context
   */
  createJourneyContext<T extends JourneyDatabaseOperations>(
    journeyId: JourneyId,
    config?: Partial<JourneyContextConfig>
  ): Promise<T>;
}

/**
 * Registry for managing database contexts
 */
export interface DatabaseContextRegistry {
  /**
   * Registers a database context
   * @param name The name of the context
   * @param context The context to register
   */
  registerContext(name: string, context: DatabaseContext): void;
  
  /**
   * Gets a registered database context by name
   * @param name The name of the context to get
   * @returns The registered context or undefined if not found
   */
  getContext(name: string): DatabaseContext | undefined;
  
  /**
   * Gets a registered journey context by journey ID
   * @param journeyId The journey ID to get the context for
   * @returns The registered journey context or undefined if not found
   */
  getJourneyContext<T extends JourneyDatabaseOperations>(journeyId: JourneyId): T | undefined;
  
  /**
   * Checks if a context is registered
   * @param name The name of the context to check
   * @returns True if the context is registered, false otherwise
   */
  hasContext(name: string): boolean;
  
  /**
   * Removes a registered context
   * @param name The name of the context to remove
   * @returns True if the context was removed, false if it wasn't registered
   */
  removeContext(name: string): boolean;
  
  /**
   * Gets all registered contexts
   * @returns A record of all registered contexts by name
   */
  getAllContexts(): Record<string, DatabaseContext>;
  
  /**
   * Gets all registered journey contexts
   * @returns A record of all registered journey contexts by journey ID
   */
  getAllJourneyContexts(): Record<JourneyId, JourneyDatabaseOperations>;
  
  /**
   * Disposes of all registered contexts
   * @returns A promise that resolves when all contexts are disposed
   */
  disposeAll(): Promise<void>;
}