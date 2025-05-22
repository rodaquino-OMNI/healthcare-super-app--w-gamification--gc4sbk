import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConnectionPool } from './connection-pool';
import { ConnectionHealth } from './connection-health';
import { ConnectionRetry } from './connection-retry';
import { 
  ConnectionConfig, 
  ConnectionOptions, 
  ConnectionType, 
  DatabaseClient,
  JourneyType,
  QueryPattern,
  ConnectionHealthCheckConfig
} from '../types/connection.types';
import { DatabaseException, ConnectionException } from '../errors/database-error.exception';
import { DatabaseErrorType, DatabaseErrorRecoverability } from '../errors/database-error.types';
import { DB_CONNECTION_ERROR_CODES } from '../errors/database-error.codes';
import { RetryStrategyFactory } from '../errors/retry-strategies';

/**
 * ConnectionManager is responsible for creating, tracking, and reusing database connections
 * across the application. It provides methods for obtaining optimized connections based on
 * query patterns, managing connection lifecycle, and applying appropriate retry strategies.
 */
@Injectable()
export class ConnectionManager implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectionManager.name);
  private readonly activeConnections = new Map<string, DatabaseClient>();
  private readonly connectionPools = new Map<ConnectionType, ConnectionPool>();
  private isShuttingDown = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly connectionHealth: ConnectionHealth,
    private readonly connectionRetry: ConnectionRetry,
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(RetryStrategyFactory) private readonly retryStrategyFactory: RetryStrategyFactory,
  ) {}

  /**
   * Initialize connection pools for different database types on module initialization
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing database connection manager');
    
    try {
      // Initialize connection pools for each database type
      await this.initializeConnectionPools();
      
      // Set up periodic health checks for connections
      this.setupConnectionHealthChecks();
      
      this.logger.log('Database connection pools initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database connection pools', error);
      throw new ConnectionException(
        'Failed to initialize database connection pools',
        { cause: error },
        DatabaseErrorType.CONNECTION,
        DB_CONNECTION_ERROR_CODES.POOL_INITIALIZATION_FAILED
      );
    }
  }

  /**
   * Clean up all active connections on module destruction
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down database connection manager');
    this.isShuttingDown = true;
    
    try {
      // Stop health check intervals
      this.stopConnectionHealthChecks();
      
      // Close all connections
      await this.closeAllConnections();
      this.logger.log('All database connections closed successfully');
    } catch (error) {
      this.logger.error('Error closing database connections during shutdown', error);
      // We don't throw here as we're already shutting down
    }
  }

  /**
   * Get a database connection optimized for the specified query pattern and journey
   * @param connectionType The type of database connection (PostgreSQL, TimescaleDB, Redis, S3)
   * @param options Connection options including journey context and query pattern
   * @returns A database client instance
   */
  async getConnection(
    connectionType: ConnectionType,
    options: ConnectionOptions = {}
  ): Promise<DatabaseClient> {
    if (this.isShuttingDown) {
      throw new ConnectionException(
        'Cannot get connection during application shutdown',
        {},
        DatabaseErrorType.CONNECTION,
        DB_CONNECTION_ERROR_CODES.SERVICE_SHUTTING_DOWN
      );
    }

    const connectionKey = this.generateConnectionKey(connectionType, options);
    
    // Check if we already have an active connection that can be reused
    if (this.activeConnections.has(connectionKey)) {
      const existingConnection = this.activeConnections.get(connectionKey);
      
      // Verify the connection is still healthy before reusing
      if (await this.connectionHealth.isConnectionHealthy(existingConnection)) {
        this.logger.debug(`Reusing existing connection: ${connectionKey}`);
        return existingConnection;
      } else {
        // Connection is unhealthy, remove it and create a new one
        this.logger.warn(`Existing connection unhealthy, creating new connection: ${connectionKey}`);
        await this.releaseConnection(connectionKey);
      }
    }

    // Get a connection from the appropriate pool
    try {
      const pool = this.getConnectionPool(connectionType);
      const connection = await this.connectionRetry.withRetry(
        () => pool.acquireConnection(options),
        {
          operation: 'acquireConnection',
          connectionType,
          journeyType: options.journeyType,
        }
      );

      // Track the new connection
      this.activeConnections.set(connectionKey, connection);
      this.logger.debug(`Created new connection: ${connectionKey}`);
      
      return connection;
    } catch (error) {
      this.logger.error(`Failed to get connection: ${connectionKey}`, error);
      throw new ConnectionException(
        `Failed to get ${connectionType} connection`,
        { cause: error, options },
        DatabaseErrorType.CONNECTION,
        DB_CONNECTION_ERROR_CODES.CONNECTION_ACQUISITION_FAILED
      );
    }
  }

  /**
   * Release a database connection back to the pool
   * @param connectionKey The unique key for the connection to release
   */
  async releaseConnection(connectionKey: string): Promise<void> {
    if (!this.activeConnections.has(connectionKey)) {
      this.logger.warn(`Attempted to release non-existent connection: ${connectionKey}`);
      return;
    }

    const connection = this.activeConnections.get(connectionKey);
    const connectionType = this.extractConnectionTypeFromKey(connectionKey);
    const pool = this.getConnectionPool(connectionType);

    try {
      await pool.releaseConnection(connection);
      this.activeConnections.delete(connectionKey);
      this.logger.debug(`Released connection: ${connectionKey}`);
    } catch (error) {
      this.logger.error(`Error releasing connection: ${connectionKey}`, error);
      // Still remove from active connections to prevent memory leaks
      this.activeConnections.delete(connectionKey);
      
      // Don't throw here as it could disrupt application flow
      // Just log the error and continue
    }
  }

  /**
   * Get a connection optimized for a specific journey type
   * @param connectionType The type of database connection
   * @param journeyType The journey type (Health, Care, Plan)
   * @param queryPattern Optional query pattern for further optimization
   * @returns A database client instance optimized for the journey
   */
  async getJourneyConnection(
    connectionType: ConnectionType,
    journeyType: JourneyType,
    queryPattern: QueryPattern = QueryPattern.BALANCED
  ): Promise<DatabaseClient> {
    return this.getConnection(connectionType, { journeyType, queryPattern });
  }

  /**
   * Get the total number of active connections
   * @returns The count of active connections
   */
  getActiveConnectionCount(): number {
    return this.activeConnections.size;
  }

  /**
   * Get connection statistics for monitoring and diagnostics
   * @returns An object containing connection statistics
   */
  getConnectionStats(): Record<ConnectionType, { active: number, available: number, total: number }> {
    const stats = {} as Record<ConnectionType, { active: number, available: number, total: number }>;
    
    for (const [type, pool] of this.connectionPools.entries()) {
      stats[type] = {
        active: pool.getActiveCount(),
        available: pool.getAvailableCount(),
        total: pool.getTotalCount()
      };
    }
    
    return stats;
  }
  
  /**
   * Get a connection optimized for a specific query pattern
   * @param connectionType The type of database connection
   * @param queryPattern The query pattern to optimize for
   * @returns A database client instance optimized for the query pattern
   */
  async getOptimizedConnection(
    connectionType: ConnectionType,
    queryPattern: QueryPattern
  ): Promise<DatabaseClient> {
    return this.getConnection(connectionType, { queryPattern });
  }
  
  /**
   * Validate all active connections and remove any unhealthy ones
   * @returns A promise that resolves when validation is complete
   */
  async validateConnections(): Promise<void> {
    this.logger.debug('Validating all active connections');
    const unhealthyKeys: string[] = [];
    
    // Check each active connection for health
    for (const [key, connection] of this.activeConnections.entries()) {
      try {
        const isHealthy = await this.connectionHealth.isConnectionHealthy(connection);
        if (!isHealthy) {
          unhealthyKeys.push(key);
        }
      } catch (error) {
        this.logger.warn(`Error validating connection ${key}`, error);
        unhealthyKeys.push(key);
      }
    }
    
    // Release unhealthy connections
    for (const key of unhealthyKeys) {
      this.logger.warn(`Releasing unhealthy connection: ${key}`);
      await this.releaseConnection(key);
    }
    
    if (unhealthyKeys.length > 0) {
      this.logger.log(`Released ${unhealthyKeys.length} unhealthy connections`);
    } else {
      this.logger.debug('All connections are healthy');
    }
  }
  
  /**
   * Handle a connection failure with appropriate recovery strategy
   * @param error The error that occurred
   * @param connectionType The type of database connection
   * @param options Connection options
   * @returns A new connection if recovery is possible
   */
  async handleConnectionFailure(
    error: Error,
    connectionType: ConnectionType,
    options: ConnectionOptions = {}
  ): Promise<DatabaseClient> {
    this.logger.error(`Connection failure for ${connectionType}`, error);
    
    // Determine if the error is recoverable
    const isRecoverable = this.isRecoverableError(error);
    
    if (!isRecoverable) {
      throw new ConnectionException(
        `Unrecoverable connection failure for ${connectionType}`,
        { cause: error, options },
        DatabaseErrorType.CONNECTION,
        DB_CONNECTION_ERROR_CODES.UNRECOVERABLE_CONNECTION_FAILURE
      );
    }
    
    // Get the appropriate retry strategy for this error and connection type
    const retryStrategy = this.retryStrategyFactory.createStrategy({
      errorType: DatabaseErrorType.CONNECTION,
      connectionType,
      journeyType: options.journeyType,
    });
    
    // Attempt to get a new connection with the retry strategy
    try {
      return await this.connectionRetry.withCustomStrategy(
        () => this.getConnection(connectionType, options),
        retryStrategy
      );
    } catch (retryError) {
      throw new ConnectionException(
        `Failed to recover connection for ${connectionType} after multiple attempts`,
        { cause: retryError, options },
        DatabaseErrorType.CONNECTION,
        DB_CONNECTION_ERROR_CODES.RECOVERY_FAILED
      );
    }
  }

  /**
   * Initialize connection pools for all supported database types
   * @private
   */
  private async initializeConnectionPools(): Promise<void> {
    const dbConfig = this.configService.get<ConnectionConfig>('database');
    
    if (!dbConfig) {
      throw new DatabaseException(
        'Database configuration not found',
        {},
        DatabaseErrorType.CONFIGURATION,
        DB_CONNECTION_ERROR_CODES.MISSING_CONFIGURATION
      );
    }

    // Initialize PostgreSQL connection pool
    if (dbConfig.postgres) {
      const postgresPool = new ConnectionPool(ConnectionType.POSTGRESQL, dbConfig.postgres);
      await postgresPool.initialize();
      this.connectionPools.set(ConnectionType.POSTGRESQL, postgresPool);
    }

    // Initialize TimescaleDB connection pool (if configured separately from PostgreSQL)
    if (dbConfig.timescaledb) {
      const timescalePool = new ConnectionPool(ConnectionType.TIMESCALEDB, dbConfig.timescaledb);
      await timescalePool.initialize();
      this.connectionPools.set(ConnectionType.TIMESCALEDB, timescalePool);
    }

    // Initialize Redis connection pool
    if (dbConfig.redis) {
      const redisPool = new ConnectionPool(ConnectionType.REDIS, dbConfig.redis);
      await redisPool.initialize();
      this.connectionPools.set(ConnectionType.REDIS, redisPool);
    }

    // Initialize S3 connection pool
    if (dbConfig.s3) {
      const s3Pool = new ConnectionPool(ConnectionType.S3, dbConfig.s3);
      await s3Pool.initialize();
      this.connectionPools.set(ConnectionType.S3, s3Pool);
    }
  }

  /**
   * Close all active connections during shutdown
   * @private
   */
  private async closeAllConnections(): Promise<void> {
    const closePromises: Promise<void>[] = [];
    
    // Close all active connections
    for (const connectionKey of this.activeConnections.keys()) {
      closePromises.push(this.releaseConnection(connectionKey));
    }
    
    // Wait for all connections to be released
    await Promise.allSettled(closePromises);
    
    // Shutdown all connection pools
    for (const pool of this.connectionPools.values()) {
      await pool.shutdown();
    }
    
    // Clear all maps
    this.activeConnections.clear();
    this.connectionPools.clear();
  }

  /**
   * Get the appropriate connection pool for the specified connection type
   * @param connectionType The type of database connection
   * @returns The connection pool for the specified type
   * @private
   */
  private getConnectionPool(connectionType: ConnectionType): ConnectionPool {
    const pool = this.connectionPools.get(connectionType);
    
    if (!pool) {
      throw new ConnectionException(
        `No connection pool available for ${connectionType}`,
        { connectionType },
        DatabaseErrorType.CONFIGURATION,
        DB_CONNECTION_ERROR_CODES.POOL_NOT_INITIALIZED
      );
    }
    
    return pool;
  }

  /**
   * Generate a unique key for a connection based on its type and options
   * @param connectionType The type of database connection
   * @param options Connection options
   * @returns A unique connection key
   * @private
   */
  private generateConnectionKey(connectionType: ConnectionType, options: ConnectionOptions): string {
    const { journeyType = 'shared', queryPattern = QueryPattern.BALANCED } = options;
    return `${connectionType}:${journeyType}:${queryPattern}`;
  }

  /**
   * Extract the connection type from a connection key
   * @param connectionKey The connection key
   * @returns The connection type
   * @private
   */
  private extractConnectionTypeFromKey(connectionKey: string): ConnectionType {
    const [typeStr] = connectionKey.split(':');
    return typeStr as ConnectionType;
  }
  
  /**
   * Set up periodic health checks for database connections
   * @private
   */
  private setupConnectionHealthChecks(): void {
    const healthCheckConfig = this.configService.get<ConnectionHealthCheckConfig>('database.healthCheck') || {
      enabled: true,
      intervalMs: 30000, // Default to 30 seconds
    };
    
    if (!healthCheckConfig.enabled) {
      this.logger.log('Connection health checks are disabled');
      return;
    }
    
    const interval = setInterval(
      () => this.validateConnections().catch(error => {
        this.logger.error('Error during connection health check', error);
      }),
      healthCheckConfig.intervalMs
    );
    
    this.schedulerRegistry.addInterval('connection-health-check', interval);
    this.logger.log(`Connection health checks scheduled every ${healthCheckConfig.intervalMs}ms`);
  }
  
  /**
   * Stop all connection health check intervals
   * @private
   */
  private stopConnectionHealthChecks(): void {
    try {
      this.schedulerRegistry.deleteInterval('connection-health-check');
      this.logger.log('Connection health checks stopped');
    } catch (error) {
      // Interval might not exist, which is fine
      this.logger.debug('No connection health check interval to stop');
    }
  }
  
  /**
   * Determine if an error is recoverable for connection operations
   * @param error The error to check
   * @returns True if the error is recoverable, false otherwise
   * @private
   */
  private isRecoverableError(error: Error): boolean {
    // If it's our own DatabaseException, check the recoverability property
    if (error instanceof DatabaseException && error.metadata?.recoverability) {
      return error.metadata.recoverability === DatabaseErrorRecoverability.TRANSIENT;
    }
    
    // For other errors, check common patterns that indicate transient issues
    const errorMessage = error.message.toLowerCase();
    const transientPatterns = [
      'connection reset',
      'connection timeout',
      'too many connections',
      'temporarily unavailable',
      'network error',
      'econnrefused',
      'econnreset',
      'etimedout',
    ];
    
    return transientPatterns.some(pattern => errorMessage.includes(pattern));
  }
}