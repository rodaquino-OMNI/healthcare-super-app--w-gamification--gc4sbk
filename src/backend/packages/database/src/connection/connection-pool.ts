/**
 * @file connection-pool.ts
 * @description Implements ConnectionPool class that manages a pool of database connections
 * with configurable minimum, maximum, and idle connection limits. It handles connection
 * acquisition, release, and idle connection cleanup to optimize resource usage.
 */

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { DatabaseException } from '../errors/database-error.exception';
import { DatabaseErrorType } from '../errors/database-error.types';
import { ConnectionHealth, ConnectionStatus } from './connection-health';
import { IConnectionPoolConfig, ConnectionConfig, ConnectionStatus as ConnStatus } from '../types/connection.types';

/**
 * Interface for a pooled database connection
 */
export interface PooledConnection<T = any> {
  /** The actual connection object */
  connection: T;
  /** Unique identifier for this connection */
  id: string;
  /** When the connection was created */
  createdAt: Date;
  /** When the connection was last used */
  lastUsedAt: Date;
  /** Whether the connection is currently in use */
  inUse: boolean;
  /** Number of times this connection has been used */
  useCount: number;
  /** Health monitor for this connection */
  health: ConnectionHealth;
  /** Whether the connection is valid and usable */
  isValid: boolean;
}

/**
 * Interface for connection acquisition options
 */
export interface ConnectionAcquisitionOptions {
  /** Maximum time to wait for a connection (in ms) */
  timeout?: number;
  /** Whether to prioritize idle connections */
  preferIdle?: boolean;
  /** Whether to validate the connection before returning it */
  validate?: boolean;
  /** Custom validation function */
  validationFn?: (connection: any) => Promise<boolean>;
  /** Whether to force creation of a new connection */
  forceNew?: boolean;
  /** Priority level for this request (higher gets served first) */
  priority?: number;
}

/**
 * Default connection acquisition options
 */
export const DEFAULT_ACQUISITION_OPTIONS: ConnectionAcquisitionOptions = {
  timeout: 5000, // 5 seconds
  preferIdle: true,
  validate: true,
  forceNew: false,
  priority: 0,
};

/**
 * Interface for connection pool statistics
 */
export interface ConnectionPoolStats {
  /** Total number of connections in the pool */
  totalConnections: number;
  /** Number of active connections */
  activeConnections: number;
  /** Number of idle connections */
  idleConnections: number;
  /** Number of pending connection requests */
  pendingRequests: number;
  /** Maximum number of connections allowed */
  maxConnections: number;
  /** Minimum number of connections to maintain */
  minConnections: number;
  /** Pool utilization percentage */
  utilizationPercentage: number;
  /** Average connection acquisition time (ms) */
  avgAcquisitionTime: number;
  /** Average connection lifetime (ms) */
  avgConnectionLifetime: number;
  /** Number of connection timeouts */
  connectionTimeouts: number;
  /** Number of failed validations */
  failedValidations: number;
}

/**
 * Interface for a pending connection request
 */
interface PendingRequest {
  /** Resolver function for the pending request */
  resolve: (connection: any) => void;
  /** Rejector function for the pending request */
  reject: (error: Error) => void;
  /** When the request was created */
  createdAt: Date;
  /** Options for this request */
  options: ConnectionAcquisitionOptions;
  /** Timeout ID if applicable */
  timeoutId?: NodeJS.Timeout;
}

/**
 * Class that manages a pool of database connections with configurable minimum,
 * maximum, and idle connection limits. It handles connection acquisition, release,
 * and idle connection cleanup to optimize resource usage.
 */
@Injectable()
export class ConnectionPool<T = any> implements OnModuleInit, OnModuleDestroy {
  /** Pool of available connections */
  private pool: Map<string, PooledConnection<T>> = new Map();
  /** Queue of pending connection requests */
  private pendingRequests: PendingRequest[] = [];
  /** Configuration for this connection pool */
  private config: IConnectionPoolConfig;
  /** Timer for idle connection cleanup */
  private idleCleanupTimer: NodeJS.Timeout | null = null;
  /** Timer for connection health checks */
  private healthCheckTimer: NodeJS.Timeout | null = null;
  /** Factory function to create new connections */
  private connectionFactory: () => Promise<T>;
  /** Function to close a connection */
  private connectionClose: (connection: T) => Promise<void>;
  /** Function to validate a connection */
  private connectionValidate: (connection: T) => Promise<boolean>;
  /** Statistics for this connection pool */
  private stats: ConnectionPoolStats;
  /** Whether the pool is being shut down */
  private isShuttingDown: boolean = false;
  /** Connection acquisition times for calculating average */
  private acquisitionTimes: number[] = [];
  /** Whether the pool has been initialized */
  private initialized: boolean = false;
  /** Last time the pool was scaled */
  private lastScaledAt: Date = new Date();
  /** Current load factor (0-1) */
  private loadFactor: number = 0;

  /**
   * Creates a new ConnectionPool instance
   * 
   * @param logger - Logger service for structured logging
   * @param tracingService - Tracing service for distributed tracing
   * @param connectionConfig - Database connection configuration
   * @param factory - Factory function to create new connections
   * @param close - Function to close a connection
   * @param validate - Function to validate a connection
   */
  constructor(
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly connectionConfig: ConnectionConfig,
    factory: () => Promise<T>,
    close: (connection: T) => Promise<void>,
    validate: (connection: T) => Promise<boolean>
  ) {
    this.connectionFactory = factory;
    this.connectionClose = close;
    this.connectionValidate = validate;
    
    // Get pool configuration from connection config
    this.config = this.connectionConfig.pool || {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      retryIntervalMillis: 1000,
      validateOnBorrow: true,
      validateOnIdle: true,
    };
    
    // Initialize statistics
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      pendingRequests: 0,
      maxConnections: this.config.max,
      minConnections: this.config.min,
      utilizationPercentage: 0,
      avgAcquisitionTime: 0,
      avgConnectionLifetime: 0,
      connectionTimeouts: 0,
      failedValidations: 0,
    };
    
    this.logger.log('ConnectionPool created', {
      config: this.config,
      context: 'ConnectionPool',
    });
  }

  /**
   * Initialize the connection pool when the module is initialized
   */
  async onModuleInit(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    const span = this.tracingService.startSpan('database.connectionPool.initialize');
    
    try {
      // Create minimum number of connections
      await this.ensureMinConnections();
      
      // Start idle connection cleanup timer
      if (this.config.idleTimeoutMillis && this.config.idleTimeoutMillis > 0) {
        this.startIdleConnectionCleanup();
      }
      
      // Start health check timer
      this.startHealthChecks();
      
      this.initialized = true;
      
      span.setAttributes({
        'database.connectionPool.initialized': true,
        'database.connectionPool.minConnections': this.config.min,
        'database.connectionPool.maxConnections': this.config.max,
      });
      
      this.logger.log('ConnectionPool initialized', {
        minConnections: this.config.min,
        maxConnections: this.config.max,
        idleTimeout: this.config.idleTimeoutMillis,
        context: 'ConnectionPool',
      });
    } catch (error) {
      span.setAttributes({
        'database.connectionPool.initialized': false,
        'error.type': error.name,
        'error.message': error.message,
      });
      span.recordException(error);
      
      this.logger.error('Failed to initialize connection pool', {
        error: error.message,
        stack: error.stack,
        context: 'ConnectionPool',
      });
      
      throw new DatabaseException(
        `Failed to initialize connection pool: ${error.message}`,
        'DB_POOL_INIT_FAILED',
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    } finally {
      span.end();
    }
  }

  /**
   * Clean up resources when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    await this.shutdown();
  }

  /**
   * Shut down the connection pool
   * 
   * @param force - Whether to force immediate shutdown without waiting for active connections
   * @returns Promise that resolves when shutdown is complete
   */
  async shutdown(force: boolean = false): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    
    const span = this.tracingService.startSpan('database.connectionPool.shutdown');
    
    try {
      this.isShuttingDown = true;
      
      // Stop timers
      if (this.idleCleanupTimer) {
        clearInterval(this.idleCleanupTimer);
        this.idleCleanupTimer = null;
      }
      
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = null;
      }
      
      // Reject all pending requests
      this.rejectAllPendingRequests(
        new DatabaseException(
          'Connection pool is shutting down',
          'DB_POOL_SHUTDOWN',
          DatabaseErrorType.CONNECTION
        )
      );
      
      // Close all connections
      const closePromises: Promise<void>[] = [];
      
      for (const [id, pooledConn] of this.pool.entries()) {
        if (!force && pooledConn.inUse) {
          this.logger.warn('Connection still in use during shutdown', {
            connectionId: id,
            createdAt: pooledConn.createdAt,
            useCount: pooledConn.useCount,
            context: 'ConnectionPool',
          });
          continue;
        }
        
        closePromises.push(this.closeConnection(id));
      }
      
      await Promise.all(closePromises);
      
      span.setAttributes({
        'database.connectionPool.shutdown': true,
        'database.connectionPool.force': force,
        'database.connectionPool.closedConnections': closePromises.length,
      });
      
      this.logger.log('ConnectionPool shutdown complete', {
        closedConnections: closePromises.length,
        force,
        context: 'ConnectionPool',
      });
    } catch (error) {
      span.setAttributes({
        'database.connectionPool.shutdown': false,
        'error.type': error.name,
        'error.message': error.message,
      });
      span.recordException(error);
      
      this.logger.error('Error during connection pool shutdown', {
        error: error.message,
        stack: error.stack,
        context: 'ConnectionPool',
      });
      
      throw new DatabaseException(
        `Error during connection pool shutdown: ${error.message}`,
        'DB_POOL_SHUTDOWN_FAILED',
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    } finally {
      span.end();
    }
  }

  /**
   * Acquire a connection from the pool
   * 
   * @param options - Connection acquisition options
   * @returns Promise that resolves to a connection
   */
  async acquire(options: ConnectionAcquisitionOptions = {}): Promise<T> {
    if (this.isShuttingDown) {
      throw new DatabaseException(
        'Cannot acquire connection: pool is shutting down',
        'DB_POOL_SHUTDOWN',
        DatabaseErrorType.CONNECTION
      );
    }
    
    const span = this.tracingService.startSpan('database.connectionPool.acquire');
    const startTime = Date.now();
    
    // Merge with default options
    const acquireOptions: ConnectionAcquisitionOptions = {
      ...DEFAULT_ACQUISITION_OPTIONS,
      ...options,
    };
    
    span.setAttributes({
      'database.connectionPool.acquire.timeout': acquireOptions.timeout,
      'database.connectionPool.acquire.preferIdle': acquireOptions.preferIdle,
      'database.connectionPool.acquire.validate': acquireOptions.validate,
      'database.connectionPool.acquire.forceNew': acquireOptions.forceNew,
    });
    
    try {
      // Try to get an existing connection if not forcing new
      if (!acquireOptions.forceNew) {
        const connection = this.getIdleConnection(acquireOptions.validate);
        
        if (connection) {
          const acquisitionTime = Date.now() - startTime;
          this.recordAcquisitionTime(acquisitionTime);
          
          span.setAttributes({
            'database.connectionPool.acquire.success': true,
            'database.connectionPool.acquire.new': false,
            'database.connectionPool.acquire.time': acquisitionTime,
          });
          
          return connection;
        }
      }
      
      // Try to create a new connection if below max
      if (this.pool.size < this.config.max) {
        const connection = await this.createConnection();
        
        const acquisitionTime = Date.now() - startTime;
        this.recordAcquisitionTime(acquisitionTime);
        
        span.setAttributes({
          'database.connectionPool.acquire.success': true,
          'database.connectionPool.acquire.new': true,
          'database.connectionPool.acquire.time': acquisitionTime,
        });
        
        return connection;
      }
      
      // Queue the request if we can't immediately fulfill it
      return await this.enqueueConnectionRequest(acquireOptions);
    } catch (error) {
      span.setAttributes({
        'database.connectionPool.acquire.success': false,
        'error.type': error.name,
        'error.message': error.message,
      });
      span.recordException(error);
      
      this.logger.error('Failed to acquire connection from pool', {
        error: error.message,
        stack: error.stack,
        options: acquireOptions,
        context: 'ConnectionPool',
      });
      
      throw new DatabaseException(
        `Failed to acquire connection from pool: ${error.message}`,
        'DB_POOL_ACQUIRE_FAILED',
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    } finally {
      span.end();
    }
  }

  /**
   * Release a connection back to the pool
   * 
   * @param connection - The connection to release
   * @param forceClose - Whether to force close the connection instead of returning it to the pool
   */
  async release(connection: T, forceClose: boolean = false): Promise<void> {
    const span = this.tracingService.startSpan('database.connectionPool.release');
    
    try {
      // Find the connection in the pool
      let connectionId: string | null = null;
      let pooledConnection: PooledConnection<T> | null = null;
      
      for (const [id, pooledConn] of this.pool.entries()) {
        if (pooledConn.connection === connection) {
          connectionId = id;
          pooledConnection = pooledConn;
          break;
        }
      }
      
      // If connection not found, log and return
      if (!connectionId || !pooledConnection) {
        this.logger.warn('Attempted to release unknown connection', {
          context: 'ConnectionPool',
        });
        return;
      }
      
      span.setAttributes({
        'database.connectionPool.release.connectionId': connectionId,
        'database.connectionPool.release.forceClose': forceClose,
      });
      
      // If force close or connection is invalid, close it
      if (forceClose || !pooledConnection.isValid) {
        await this.closeConnection(connectionId);
        
        // Create a new connection if we're below minimum and not shutting down
        if (!this.isShuttingDown && this.pool.size < this.config.min) {
          this.createConnection().catch((error) => {
            this.logger.error('Failed to create replacement connection', {
              error: error.message,
              stack: error.stack,
              context: 'ConnectionPool',
            });
          });
        }
        
        span.setAttributes({
          'database.connectionPool.release.closed': true,
        });
        
        return;
      }
      
      // Mark connection as not in use
      pooledConnection.inUse = false;
      pooledConnection.lastUsedAt = new Date();
      
      // Update stats
      this.stats.activeConnections--;
      this.stats.idleConnections++;
      this.updateUtilizationStats();
      
      // Check if there are pending requests that can use this connection
      if (this.pendingRequests.length > 0) {
        const request = this.pendingRequests.shift();
        
        if (request) {
          // Clear timeout if it exists
          if (request.timeoutId) {
            clearTimeout(request.timeoutId);
          }
          
          // Validate connection if required
          if (request.options.validate) {
            const isValid = await this.validateConnection(pooledConnection);
            
            if (!isValid) {
              // Connection is invalid, close it and create a new one for the request
              await this.closeConnection(connectionId);
              
              try {
                const newConnection = await this.createConnection();
                request.resolve(newConnection);
              } catch (error) {
                request.reject(
                  new DatabaseException(
                    `Failed to create new connection after validation failure: ${error.message}`,
                    'DB_POOL_VALIDATION_FAILED',
                    DatabaseErrorType.CONNECTION,
                    { cause: error }
                  )
                );
              }
              
              return;
            }
          }
          
          // Mark connection as in use again
          pooledConnection.inUse = true;
          pooledConnection.lastUsedAt = new Date();
          pooledConnection.useCount++;
          
          // Update stats
          this.stats.activeConnections++;
          this.stats.idleConnections--;
          this.stats.pendingRequests--;
          this.updateUtilizationStats();
          
          // Resolve the pending request
          request.resolve(pooledConnection.connection);
          
          span.setAttributes({
            'database.connectionPool.release.reused': true,
          });
        }
      }
      
      // Check if we need to scale down the pool
      this.checkPoolScaling();
    } catch (error) {
      span.setAttributes({
        'database.connectionPool.release.success': false,
        'error.type': error.name,
        'error.message': error.message,
      });
      span.recordException(error);
      
      this.logger.error('Error releasing connection to pool', {
        error: error.message,
        stack: error.stack,
        context: 'ConnectionPool',
      });
    } finally {
      span.end();
    }
  }

  /**
   * Get current statistics for the connection pool
   * 
   * @returns Current connection pool statistics
   */
  getStats(): ConnectionPoolStats {
    return { ...this.stats };
  }

  /**
   * Refresh all connections in the pool
   * 
   * @returns Promise that resolves when all connections have been refreshed
   */
  async refreshConnections(): Promise<void> {
    const span = this.tracingService.startSpan('database.connectionPool.refreshConnections');
    
    try {
      const idleConnectionIds: string[] = [];
      
      // Collect idle connection IDs
      for (const [id, pooledConn] of this.pool.entries()) {
        if (!pooledConn.inUse) {
          idleConnectionIds.push(id);
        }
      }
      
      span.setAttributes({
        'database.connectionPool.refresh.idleConnections': idleConnectionIds.length,
        'database.connectionPool.refresh.totalConnections': this.pool.size,
      });
      
      // Close idle connections and create replacements
      const refreshPromises = idleConnectionIds.map(async (id) => {
        await this.closeConnection(id);
        return this.createConnection();
      });
      
      await Promise.all(refreshPromises);
      
      this.logger.log('Refreshed idle connections in pool', {
        refreshedConnections: idleConnectionIds.length,
        totalConnections: this.pool.size,
        context: 'ConnectionPool',
      });
    } catch (error) {
      span.setAttributes({
        'database.connectionPool.refresh.success': false,
        'error.type': error.name,
        'error.message': error.message,
      });
      span.recordException(error);
      
      this.logger.error('Failed to refresh connections', {
        error: error.message,
        stack: error.stack,
        context: 'ConnectionPool',
      });
      
      throw new DatabaseException(
        `Failed to refresh connections: ${error.message}`,
        'DB_POOL_REFRESH_FAILED',
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    } finally {
      span.end();
    }
  }

  /**
   * Ensure the pool has at least the minimum number of connections
   * 
   * @returns Promise that resolves when minimum connections are established
   */
  private async ensureMinConnections(): Promise<void> {
    const span = this.tracingService.startSpan('database.connectionPool.ensureMinConnections');
    
    try {
      const connectionsToCreate = Math.max(0, this.config.min - this.pool.size);
      
      if (connectionsToCreate <= 0) {
        return;
      }
      
      span.setAttributes({
        'database.connectionPool.ensureMin.toCreate': connectionsToCreate,
        'database.connectionPool.ensureMin.currentSize': this.pool.size,
        'database.connectionPool.ensureMin.minSize': this.config.min,
      });
      
      this.logger.log('Creating minimum connections for pool', {
        connectionsToCreate,
        currentSize: this.pool.size,
        minSize: this.config.min,
        context: 'ConnectionPool',
      });
      
      const createPromises: Promise<T>[] = [];
      
      for (let i = 0; i < connectionsToCreate; i++) {
        createPromises.push(this.createConnection());
      }
      
      await Promise.all(createPromises);
    } catch (error) {
      span.setAttributes({
        'database.connectionPool.ensureMin.success': false,
        'error.type': error.name,
        'error.message': error.message,
      });
      span.recordException(error);
      
      this.logger.error('Failed to create minimum connections', {
        error: error.message,
        stack: error.stack,
        minConnections: this.config.min,
        currentConnections: this.pool.size,
        context: 'ConnectionPool',
      });
      
      throw new DatabaseException(
        `Failed to create minimum connections: ${error.message}`,
        'DB_POOL_MIN_CONN_FAILED',
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    } finally {
      span.end();
    }
  }

  /**
   * Create a new connection and add it to the pool
   * 
   * @returns Promise that resolves to the connection
   */
  private async createConnection(): Promise<T> {
    if (this.isShuttingDown) {
      throw new DatabaseException(
        'Cannot create connection: pool is shutting down',
        'DB_POOL_SHUTDOWN',
        DatabaseErrorType.CONNECTION
      );
    }
    
    if (this.pool.size >= this.config.max) {
      throw new DatabaseException(
        'Cannot create connection: maximum pool size reached',
        'DB_POOL_MAX_SIZE',
        DatabaseErrorType.CONNECTION
      );
    }
    
    const span = this.tracingService.startSpan('database.connectionPool.createConnection');
    
    try {
      // Generate a unique ID for this connection
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Create the connection
      const connection = await this.connectionFactory();
      
      // Create health monitor for this connection
      const health = new ConnectionHealth(
        this.logger,
        this.tracingService,
        this.connectionConfig
      );
      
      // Create pooled connection object
      const pooledConnection: PooledConnection<T> = {
        connection,
        id: connectionId,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        inUse: true,
        useCount: 1,
        health,
        isValid: true,
      };
      
      // Add to pool
      this.pool.set(connectionId, pooledConnection);
      
      // Update stats
      this.stats.totalConnections = this.pool.size;
      this.stats.activeConnections++;
      this.updateUtilizationStats();
      
      span.setAttributes({
        'database.connectionPool.create.success': true,
        'database.connectionPool.create.id': connectionId,
        'database.connectionPool.create.poolSize': this.pool.size,
      });
      
      this.logger.debug('Created new database connection', {
        connectionId,
        poolSize: this.pool.size,
        context: 'ConnectionPool',
      });
      
      return connection;
    } catch (error) {
      span.setAttributes({
        'database.connectionPool.create.success': false,
        'error.type': error.name,
        'error.message': error.message,
      });
      span.recordException(error);
      
      this.logger.error('Failed to create database connection', {
        error: error.message,
        stack: error.stack,
        context: 'ConnectionPool',
      });
      
      throw new DatabaseException(
        `Failed to create database connection: ${error.message}`,
        'DB_POOL_CREATE_FAILED',
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    } finally {
      span.end();
    }
  }

  /**
   * Close a connection and remove it from the pool
   * 
   * @param connectionId - ID of the connection to close
   */
  private async closeConnection(connectionId: string): Promise<void> {
    const span = this.tracingService.startSpan('database.connectionPool.closeConnection');
    
    try {
      const pooledConnection = this.pool.get(connectionId);
      
      if (!pooledConnection) {
        this.logger.warn('Attempted to close unknown connection', {
          connectionId,
          context: 'ConnectionPool',
        });
        return;
      }
      
      span.setAttributes({
        'database.connectionPool.close.id': connectionId,
        'database.connectionPool.close.useCount': pooledConnection.useCount,
        'database.connectionPool.close.age': Date.now() - pooledConnection.createdAt.getTime(),
      });
      
      // Stop health monitoring
      if (pooledConnection.health) {
        pooledConnection.health.stopMonitoring();
      }
      
      // Close the connection
      try {
        await this.connectionClose(pooledConnection.connection);
      } catch (closeError) {
        this.logger.warn('Error closing database connection', {
          error: closeError.message,
          connectionId,
          context: 'ConnectionPool',
        });
      }
      
      // Remove from pool
      this.pool.delete(connectionId);
      
      // Update stats
      this.stats.totalConnections = this.pool.size;
      if (pooledConnection.inUse) {
        this.stats.activeConnections--;
      } else {
        this.stats.idleConnections--;
      }
      this.updateUtilizationStats();
      
      this.logger.debug('Closed database connection', {
        connectionId,
        poolSize: this.pool.size,
        context: 'ConnectionPool',
      });
    } catch (error) {
      span.setAttributes({
        'database.connectionPool.close.success': false,
        'error.type': error.name,
        'error.message': error.message,
      });
      span.recordException(error);
      
      this.logger.error('Error closing database connection', {
        error: error.message,
        stack: error.stack,
        connectionId,
        context: 'ConnectionPool',
      });
    } finally {
      span.end();
    }
  }

  /**
   * Get an idle connection from the pool
   * 
   * @param validate - Whether to validate the connection before returning it
   * @returns Connection if available, null otherwise
   */
  private getIdleConnection(validate: boolean = true): T | null {
    // Find an idle connection
    let selectedId: string | null = null;
    let selectedConnection: PooledConnection<T> | null = null;
    
    for (const [id, pooledConn] of this.pool.entries()) {
      if (!pooledConn.inUse) {
        // If we need to validate, only select valid connections
        if (validate && !pooledConn.isValid) {
          continue;
        }
        
        // Select this connection if it's the first one or has been idle longer
        if (
          !selectedConnection ||
          pooledConn.lastUsedAt < selectedConnection.lastUsedAt
        ) {
          selectedId = id;
          selectedConnection = pooledConn;
        }
      }
    }
    
    // If no idle connection found, return null
    if (!selectedId || !selectedConnection) {
      return null;
    }
    
    // If validation is required, validate the connection
    if (validate && this.config.validateOnBorrow) {
      // We'll do the validation asynchronously after returning the connection
      // If it fails, the connection will be marked as invalid and closed on release
      this.validateConnection(selectedConnection).catch((error) => {
        this.logger.warn('Connection validation failed after borrowing', {
          error: error.message,
          connectionId: selectedId,
          context: 'ConnectionPool',
        });
      });
    }
    
    // Mark connection as in use
    selectedConnection.inUse = true;
    selectedConnection.lastUsedAt = new Date();
    selectedConnection.useCount++;
    
    // Update stats
    this.stats.activeConnections++;
    this.stats.idleConnections--;
    this.updateUtilizationStats();
    
    return selectedConnection.connection;
  }

  /**
   * Validate a connection to ensure it's still usable
   * 
   * @param pooledConnection - The connection to validate
   * @returns Promise that resolves to true if valid, false otherwise
   */
  private async validateConnection(pooledConnection: PooledConnection<T>): Promise<boolean> {
    const span = this.tracingService.startSpan('database.connectionPool.validateConnection');
    
    try {
      span.setAttributes({
        'database.connectionPool.validate.id': pooledConnection.id,
        'database.connectionPool.validate.useCount': pooledConnection.useCount,
      });
      
      // Check if connection health is unhealthy
      if (pooledConnection.health && pooledConnection.health.isUnhealthy()) {
        this.logger.warn('Connection marked as unhealthy by health monitor', {
          connectionId: pooledConnection.id,
          context: 'ConnectionPool',
        });
        
        pooledConnection.isValid = false;
        this.stats.failedValidations++;
        
        span.setAttributes({
          'database.connectionPool.validate.valid': false,
          'database.connectionPool.validate.reason': 'unhealthy',
        });
        
        return false;
      }
      
      // Perform validation
      const isValid = await this.connectionValidate(pooledConnection.connection);
      
      if (!isValid) {
        this.logger.warn('Connection validation failed', {
          connectionId: pooledConnection.id,
          context: 'ConnectionPool',
        });
        
        pooledConnection.isValid = false;
        this.stats.failedValidations++;
        
        span.setAttributes({
          'database.connectionPool.validate.valid': false,
          'database.connectionPool.validate.reason': 'validation',
        });
        
        return false;
      }
      
      // Connection is valid
      pooledConnection.isValid = true;
      
      span.setAttributes({
        'database.connectionPool.validate.valid': true,
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error validating connection', {
        error: error.message,
        stack: error.stack,
        connectionId: pooledConnection.id,
        context: 'ConnectionPool',
      });
      
      pooledConnection.isValid = false;
      this.stats.failedValidations++;
      
      span.setAttributes({
        'database.connectionPool.validate.valid': false,
        'database.connectionPool.validate.reason': 'error',
        'error.type': error.name,
        'error.message': error.message,
      });
      span.recordException(error);
      
      return false;
    } finally {
      span.end();
    }
  }

  /**
   * Enqueue a connection request to be fulfilled when a connection becomes available
   * 
   * @param options - Connection acquisition options
   * @returns Promise that resolves to a connection when available
   */
  private enqueueConnectionRequest(options: ConnectionAcquisitionOptions): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: PendingRequest = {
        resolve,
        reject,
        createdAt: new Date(),
        options,
      };
      
      // Set up timeout if specified
      if (options.timeout && options.timeout > 0) {
        request.timeoutId = setTimeout(() => {
          // Remove request from queue
          const index = this.pendingRequests.indexOf(request);
          if (index !== -1) {
            this.pendingRequests.splice(index, 1);
          }
          
          // Update stats
          this.stats.pendingRequests = this.pendingRequests.length;
          this.stats.connectionTimeouts++;
          
          // Reject with timeout error
          reject(
            new DatabaseException(
              `Connection acquisition timed out after ${options.timeout}ms`,
              'DB_POOL_ACQUIRE_TIMEOUT',
              DatabaseErrorType.TIMEOUT
            )
          );
          
          this.logger.warn('Connection acquisition timed out', {
            timeout: options.timeout,
            queueLength: this.pendingRequests.length,
            context: 'ConnectionPool',
          });
        }, options.timeout);
      }
      
      // Add to queue based on priority
      if (options.priority && options.priority > 0) {
        // Find position based on priority (higher priority first)
        let insertIndex = this.pendingRequests.length;
        for (let i = 0; i < this.pendingRequests.length; i++) {
          const queuedPriority = this.pendingRequests[i].options.priority || 0;
          if (options.priority > queuedPriority) {
            insertIndex = i;
            break;
          }
        }
        
        this.pendingRequests.splice(insertIndex, 0, request);
      } else {
        // Add to end of queue
        this.pendingRequests.push(request);
      }
      
      // Update stats
      this.stats.pendingRequests = this.pendingRequests.length;
      
      this.logger.debug('Connection request enqueued', {
        queueLength: this.pendingRequests.length,
        timeout: options.timeout,
        priority: options.priority,
        context: 'ConnectionPool',
      });
    });
  }

  /**
   * Start the idle connection cleanup timer
   */
  private startIdleConnectionCleanup(): void {
    if (this.idleCleanupTimer) {
      clearInterval(this.idleCleanupTimer);
    }
    
    // Run cleanup at half the idle timeout interval
    const cleanupInterval = Math.max(
      1000, // Minimum 1 second
      Math.floor((this.config.idleTimeoutMillis || 30000) / 2)
    );
    
    this.idleCleanupTimer = setInterval(
      () => this.cleanupIdleConnections(),
      cleanupInterval
    );
    
    this.logger.log('Idle connection cleanup timer started', {
      interval: cleanupInterval,
      idleTimeout: this.config.idleTimeoutMillis,
      context: 'ConnectionPool',
    });
  }

  /**
   * Start the connection health check timer
   */
  private startHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    // Run health checks every minute
    const healthCheckInterval = 60000; // 1 minute
    
    this.healthCheckTimer = setInterval(
      () => this.checkConnectionHealth(),
      healthCheckInterval
    );
    
    this.logger.log('Connection health check timer started', {
      interval: healthCheckInterval,
      context: 'ConnectionPool',
    });
  }

  /**
   * Clean up idle connections that have exceeded the idle timeout
   */
  private async cleanupIdleConnections(): Promise<void> {
    if (this.isShuttingDown || !this.config.idleTimeoutMillis) {
      return;
    }
    
    const span = this.tracingService.startSpan('database.connectionPool.cleanupIdleConnections');
    
    try {
      const now = Date.now();
      const idleTimeout = this.config.idleTimeoutMillis;
      const idleConnectionIds: string[] = [];
      
      // Find idle connections that have exceeded the timeout
      for (const [id, pooledConn] of this.pool.entries()) {
        if (
          !pooledConn.inUse &&
          now - pooledConn.lastUsedAt.getTime() > idleTimeout
        ) {
          // Don't close connections if we're at or below minimum
          if (this.pool.size <= this.config.min) {
            break;
          }
          
          idleConnectionIds.push(id);
        }
      }
      
      span.setAttributes({
        'database.connectionPool.cleanup.idleConnections': idleConnectionIds.length,
        'database.connectionPool.cleanup.totalConnections': this.pool.size,
        'database.connectionPool.cleanup.idleTimeout': idleTimeout,
      });
      
      // Close idle connections
      if (idleConnectionIds.length > 0) {
        const closePromises = idleConnectionIds.map((id) => this.closeConnection(id));
        await Promise.all(closePromises);
        
        this.logger.log('Closed idle connections', {
          closedConnections: idleConnectionIds.length,
          remainingConnections: this.pool.size,
          context: 'ConnectionPool',
        });
      }
    } catch (error) {
      span.setAttributes({
        'database.connectionPool.cleanup.success': false,
        'error.type': error.name,
        'error.message': error.message,
      });
      span.recordException(error);
      
      this.logger.error('Error cleaning up idle connections', {
        error: error.message,
        stack: error.stack,
        context: 'ConnectionPool',
      });
    } finally {
      span.end();
    }
  }

  /**
   * Check the health of all connections in the pool
   */
  private async checkConnectionHealth(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    
    const span = this.tracingService.startSpan('database.connectionPool.checkConnectionHealth');
    
    try {
      const unhealthyConnectionIds: string[] = [];
      
      // Check each connection's health
      for (const [id, pooledConn] of this.pool.entries()) {
        // Skip connections in use
        if (pooledConn.inUse) {
          continue;
        }
        
        // Check if connection is unhealthy
        if (pooledConn.health && pooledConn.health.isUnhealthy()) {
          unhealthyConnectionIds.push(id);
        } else if (this.config.validateOnIdle) {
          // Validate idle connections if configured
          const isValid = await this.validateConnection(pooledConn);
          
          if (!isValid) {
            unhealthyConnectionIds.push(id);
          }
        }
      }
      
      span.setAttributes({
        'database.connectionPool.healthCheck.unhealthyConnections': unhealthyConnectionIds.length,
        'database.connectionPool.healthCheck.totalConnections': this.pool.size,
      });
      
      // Close unhealthy connections
      if (unhealthyConnectionIds.length > 0) {
        const closePromises = unhealthyConnectionIds.map((id) => this.closeConnection(id));
        await Promise.all(closePromises);
        
        // Create replacements if needed
        if (this.pool.size < this.config.min) {
          const connectionsToCreate = Math.min(
            this.config.min - this.pool.size,
            unhealthyConnectionIds.length
          );
          
          const createPromises: Promise<T>[] = [];
          for (let i = 0; i < connectionsToCreate; i++) {
            createPromises.push(this.createConnection());
          }
          
          await Promise.all(createPromises);
        }
        
        this.logger.log('Closed unhealthy connections', {
          closedConnections: unhealthyConnectionIds.length,
          replacedConnections: Math.min(
            this.config.min - (this.pool.size - unhealthyConnectionIds.length),
            unhealthyConnectionIds.length
          ),
          context: 'ConnectionPool',
        });
      }
    } catch (error) {
      span.setAttributes({
        'database.connectionPool.healthCheck.success': false,
        'error.type': error.name,
        'error.message': error.message,
      });
      span.recordException(error);
      
      this.logger.error('Error checking connection health', {
        error: error.message,
        stack: error.stack,
        context: 'ConnectionPool',
      });
    } finally {
      span.end();
    }
  }

  /**
   * Reject all pending connection requests
   * 
   * @param error - Error to reject with
   */
  private rejectAllPendingRequests(error: Error): void {
    const pendingCount = this.pendingRequests.length;
    
    if (pendingCount === 0) {
      return;
    }
    
    this.logger.warn('Rejecting all pending connection requests', {
      count: pendingCount,
      reason: error.message,
      context: 'ConnectionPool',
    });
    
    // Clear all timeouts and reject all requests
    for (const request of this.pendingRequests) {
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
      }
      
      request.reject(error);
    }
    
    // Clear the queue
    this.pendingRequests = [];
    this.stats.pendingRequests = 0;
  }

  /**
   * Update utilization statistics for the pool
   */
  private updateUtilizationStats(): void {
    this.stats.utilizationPercentage = this.pool.size > 0
      ? (this.stats.activeConnections / this.pool.size) * 100
      : 0;
    
    // Calculate load factor (0-1)
    this.loadFactor = this.config.max > 0
      ? this.stats.activeConnections / this.config.max
      : 0;
    
    // Calculate average connection lifetime
    let totalLifetime = 0;
    let connectionCount = 0;
    
    for (const pooledConn of this.pool.values()) {
      totalLifetime += Date.now() - pooledConn.createdAt.getTime();
      connectionCount++;
    }
    
    this.stats.avgConnectionLifetime = connectionCount > 0
      ? totalLifetime / connectionCount
      : 0;
  }

  /**
   * Record connection acquisition time for statistics
   * 
   * @param acquisitionTime - Time taken to acquire a connection (in ms)
   */
  private recordAcquisitionTime(acquisitionTime: number): void {
    this.acquisitionTimes.push(acquisitionTime);
    
    // Keep only the last 100 acquisition times
    if (this.acquisitionTimes.length > 100) {
      this.acquisitionTimes.shift();
    }
    
    // Calculate average
    const total = this.acquisitionTimes.reduce((sum, time) => sum + time, 0);
    this.stats.avgAcquisitionTime = this.acquisitionTimes.length > 0
      ? total / this.acquisitionTimes.length
      : 0;
  }

  /**
   * Check if the pool needs to be scaled based on current load
   */
  private checkPoolScaling(): void {
    // Only scale at most once per minute
    const now = new Date();
    if (now.getTime() - this.lastScaledAt.getTime() < 60000) {
      return;
    }
    
    // Scale down if we have too many idle connections
    const idleConnectionCount = this.stats.idleConnections;
    const totalConnectionCount = this.pool.size;
    
    // If we have more than 25% idle connections and we're above minimum size
    if (
      idleConnectionCount > 0 &&
      totalConnectionCount > this.config.min &&
      (idleConnectionCount / totalConnectionCount) > 0.25
    ) {
      // Calculate how many connections to remove (up to half of idle, but stay above min)
      const connectionsToRemove = Math.min(
        Math.floor(idleConnectionCount / 2),
        totalConnectionCount - this.config.min
      );
      
      if (connectionsToRemove > 0) {
        this.logger.log('Scaling down connection pool', {
          connectionsToRemove,
          currentSize: totalConnectionCount,
          idleConnections: idleConnectionCount,
          minSize: this.config.min,
          context: 'ConnectionPool',
        });
        
        // Find idle connections to remove
        const connectionsToClose: string[] = [];
        let found = 0;
        
        for (const [id, pooledConn] of this.pool.entries()) {
          if (!pooledConn.inUse && found < connectionsToRemove) {
            connectionsToClose.push(id);
            found++;
          }
          
          if (found >= connectionsToRemove) {
            break;
          }
        }
        
        // Close the selected connections
        for (const id of connectionsToClose) {
          this.closeConnection(id).catch((error) => {
            this.logger.error('Error closing connection during scale down', {
              error: error.message,
              connectionId: id,
              context: 'ConnectionPool',
            });
          });
        }
        
        this.lastScaledAt = now;
      }
    }
  }
}