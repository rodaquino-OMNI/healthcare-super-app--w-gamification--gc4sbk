/**
 * @file connection-pool.ts
 * @description Implements ConnectionPool class that manages a pool of database connections
 * with configurable minimum, maximum, and idle connection limits. It handles connection
 * acquisition, release, and idle connection cleanup to optimize resource usage.
 */

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConnectionConfig, ConnectionPoolConfig } from './connection-config';
import { ConnectionHealth, HealthStatus } from './connection-health';
import { ConnectionRetry, RetryContext } from './connection-retry';
import {
  ConnectionError,
  ConnectionErrorCategory,
  ConnectionEventEmitter,
  ConnectionEventType,
  ConnectionStatus,
  DatabaseConnectionType,
} from '../types/connection.types';

/**
 * Interface for a pooled database connection
 */
export interface PooledConnection {
  /** Unique identifier for the connection */
  id: string;
  /** The actual connection object */
  connection: any;
  /** Whether the connection is currently in use */
  inUse: boolean;
  /** Timestamp when the connection was created */
  createdAt: Date;
  /** Timestamp when the connection was last used */
  lastUsedAt: Date;
  /** Number of times this connection has been used */
  useCount: number;
  /** Current status of the connection */
  status: ConnectionStatus;
  /** Type of database this connection is for */
  type: DatabaseConnectionType;
  /** Journey ID associated with this connection, if any */
  journeyId?: string;
  /** Additional metadata for the connection */
  metadata?: Record<string, any>;
}

/**
 * Connection pool statistics
 */
export interface ConnectionStats {
  /** Total number of connections in the pool */
  totalConnections: number;
  /** Number of active connections */
  activeConnections: number;
  /** Number of idle connections */
  idleConnections: number;
  /** Number of connections waiting to be created */
  pendingConnections: number;
  /** Number of clients waiting for a connection */
  waitingClients: number;
  /** Maximum number of connections reached */
  maxConnectionsReached: boolean;
  /** Average connection acquisition time in milliseconds */
  avgAcquisitionTimeMs: number;
  /** Average connection lifetime in milliseconds */
  avgConnectionLifetimeMs: number;
  /** Average connection usage count */
  avgConnectionUseCount: number;
  /** Pool utilization percentage (0-100) */
  utilizationPercentage: number;
  /** Timestamp when the stats were collected */
  timestamp: Date;
}

/**
 * Options for acquiring a connection from the pool
 */
export interface ConnectionAcquisitionOptions {
  /** Maximum time to wait for a connection in milliseconds */
  timeoutMs?: number;
  /** Whether to prioritize this request over others */
  priority?: 'low' | 'normal' | 'high';
  /** Journey ID to associate with this connection */
  journeyId?: string;
  /** Whether to validate the connection before returning it */
  validateConnection?: boolean;
  /** Custom validation function */
  validationFn?: (connection: any) => Promise<boolean>;
  /** Additional metadata to associate with the connection */
  metadata?: Record<string, any>;
}

/**
 * Default connection acquisition options
 */
const DEFAULT_ACQUISITION_OPTIONS: ConnectionAcquisitionOptions = {
  priority: 'normal',
  validateConnection: true,
};

/**
 * Connection acquisition request
 */
interface ConnectionRequest {
  /** Unique identifier for the request */
  id: string;
  /** Resolve function for the promise */
  resolve: (connection: PooledConnection) => void;
  /** Reject function for the promise */
  reject: (error: Error) => void;
  /** Timestamp when the request was created */
  createdAt: Date;
  /** Options for the request */
  options: ConnectionAcquisitionOptions;
  /** Timeout handle for the request */
  timeoutHandle?: NodeJS.Timeout;
}

/**
 * Manages a pool of database connections with configurable minimum, maximum, and idle
 * connection limits. Handles connection acquisition, release, and idle connection cleanup
 * to optimize resource usage.
 */
@Injectable()
export class ConnectionPool implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectionPool.name);
  private readonly connections: Map<string, PooledConnection> = new Map();
  private readonly pendingRequests: ConnectionRequest[] = [];
  private readonly pendingConnections: Set<string> = new Set();
  private idleCleanupInterval?: NodeJS.Timeout;
  private isShuttingDown = false;
  private stats: ConnectionStats;
  private connectionIdCounter = 0;
  private requestIdCounter = 0;
  private lastScalingDecision = Date.now();
  private acquisitionTimes: number[] = [];

  /**
   * Creates a new ConnectionPool instance
   * @param config Database connection configuration
   * @param connectionFactory Factory function to create new connections
   * @param connectionHealth Optional connection health monitoring service
   * @param connectionRetry Optional connection retry service
   * @param eventEmitter Optional event emitter for publishing pool events
   */
  constructor(
    private readonly config: ConnectionConfig,
    private readonly connectionFactory: (journeyId?: string) => Promise<any>,
    private readonly connectionHealth?: ConnectionHealth,
    private readonly connectionRetry?: ConnectionRetry,
    private readonly eventEmitter?: ConnectionEventEmitter,
  ) {
    // Initialize pool statistics
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      pendingConnections: 0,
      waitingClients: 0,
      maxConnectionsReached: false,
      avgAcquisitionTimeMs: 0,
      avgConnectionLifetimeMs: 0,
      avgConnectionUseCount: 0,
      utilizationPercentage: 0,
      timestamp: new Date(),
    };
  }

  /**
   * Initializes the connection pool when the module is created
   */
  async onModuleInit(): Promise<void> {
    const poolConfig = this.config.connectionPool;
    if (!poolConfig) {
      throw new Error('Connection pool configuration is missing');
    }

    this.logger.log(
      `Initializing connection pool (min: ${poolConfig.poolMin}, max: ${poolConfig.poolMax}, ` +
      `idle timeout: ${poolConfig.poolIdle}ms)`
    );

    // Start idle connection cleanup interval
    this.startIdleConnectionCleanup();

    // Create initial connections if not using lazy connect
    if (!poolConfig.lazyConnect) {
      await this.createInitialConnections();
    }
  }

  /**
   * Cleans up resources when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;

    // Stop idle connection cleanup
    if (this.idleCleanupInterval) {
      clearInterval(this.idleCleanupInterval);
      this.idleCleanupInterval = undefined;
    }

    // Reject all pending requests
    this.rejectAllPendingRequests(new Error('Connection pool is shutting down'));

    // Close all connections
    await this.closeAllConnections();

    this.logger.log('Connection pool has been shut down');
  }

  /**
   * Creates the initial minimum number of connections
   */
  private async createInitialConnections(): Promise<void> {
    const poolConfig = this.config.connectionPool;
    if (!poolConfig) {
      return;
    }

    const minConnections = poolConfig.poolMin;
    this.logger.log(`Creating ${minConnections} initial connections`);

    const connectionPromises: Promise<void>[] = [];
    for (let i = 0; i < minConnections; i++) {
      connectionPromises.push(this.createConnection());
    }

    try {
      await Promise.all(connectionPromises);
      this.logger.log(`Created ${minConnections} initial connections successfully`);
    } catch (error) {
      this.logger.error('Failed to create all initial connections', error);
      // Continue with the connections that were successfully created
    }
  }

  /**
   * Starts the idle connection cleanup interval
   */
  private startIdleConnectionCleanup(): void {
    const poolConfig = this.config.connectionPool;
    if (!poolConfig) {
      return;
    }

    // Clear any existing interval
    if (this.idleCleanupInterval) {
      clearInterval(this.idleCleanupInterval);
    }

    // Set up new interval for idle connection cleanup
    this.idleCleanupInterval = setInterval(
      () => this.cleanupIdleConnections(),
      Math.max(poolConfig.poolIdle / 2, 1000) // Run at half the idle timeout or at least every second
    );

    this.logger.debug(
      `Started idle connection cleanup (interval: ${Math.max(poolConfig.poolIdle / 2, 1000)}ms)`
    );
  }

  /**
   * Removes idle connections that have exceeded the idle timeout
   */
  private async cleanupIdleConnections(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    const poolConfig = this.config.connectionPool;
    if (!poolConfig) {
      return;
    }

    const now = Date.now();
    const idleTimeoutMs = poolConfig.poolIdle;
    const minConnections = poolConfig.poolMin;
    let closedCount = 0;

    // Get all idle connections
    const idleConnections = Array.from(this.connections.values())
      .filter(conn => !conn.inUse)
      .sort((a, b) => a.lastUsedAt.getTime() - b.lastUsedAt.getTime()); // Close oldest first

    // Keep at least minConnections connections in the pool
    if (this.connections.size - closedCount <= minConnections) {
      return;
    }

    // Close idle connections that have exceeded the timeout
    for (const conn of idleConnections) {
      // Skip if we've reached the minimum connection limit
      if (this.connections.size - closedCount <= minConnections) {
        break;
      }

      const idleTimeMs = now - conn.lastUsedAt.getTime();
      if (idleTimeMs >= idleTimeoutMs) {
        try {
          await this.closeConnection(conn.id);
          closedCount++;
        } catch (error) {
          this.logger.warn(`Failed to close idle connection ${conn.id}`, error);
        }
      }
    }

    if (closedCount > 0) {
      this.logger.debug(`Closed ${closedCount} idle connections`);
    }

    // Update pool statistics
    this.updatePoolStats();
  }

  /**
   * Creates a new database connection
   * @param journeyId Optional journey ID to associate with the connection
   * @returns Promise that resolves when the connection is created
   */
  private async createConnection(journeyId?: string): Promise<void> {
    const connectionId = `conn_${++this.connectionIdCounter}`;
    this.pendingConnections.add(connectionId);
    this.updatePoolStats();

    try {
      // Create the connection using the factory function
      const connection = await this.connectionFactory(journeyId);

      // Create a pooled connection object
      const pooledConnection: PooledConnection = {
        id: connectionId,
        connection,
        inUse: false,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        useCount: 0,
        status: ConnectionStatus.CONNECTED,
        type: DatabaseConnectionType.POSTGRES, // Assuming PostgreSQL for now
        journeyId,
      };

      // Add to the pool
      this.connections.set(connectionId, pooledConnection);

      // Register with health monitoring if available
      if (this.connectionHealth) {
        this.connectionHealth.registerConnection(
          connectionId,
          DatabaseConnectionType.POSTGRES,
          journeyId
        );
      }

      // Initialize retry state if available
      if (this.connectionRetry) {
        this.connectionRetry.initializeRetryState(connectionId);
      }

      // Emit connection created event
      this.emitPoolEvent(ConnectionEventType.CONNECTED, connectionId, {
        journeyId,
        isNewConnection: true,
      });

      this.logger.debug(`Created new connection: ${connectionId}${journeyId ? ` (journey: ${journeyId})` : ''}`);
    } catch (error) {
      this.logger.error(`Failed to create connection${journeyId ? ` for journey ${journeyId}` : ''}`, error);

      // Emit connection error event
      this.emitPoolEvent(
        ConnectionEventType.ERROR,
        connectionId,
        { journeyId },
        this.createConnectionError(error)
      );

      // Rethrow the error
      throw error;
    } finally {
      this.pendingConnections.delete(connectionId);
      this.updatePoolStats();
    }
  }

  /**
   * Closes a database connection
   * @param connectionId ID of the connection to close
   */
  private async closeConnection(connectionId: string): Promise<void> {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return;
    }

    try {
      // Remove from the pool first to prevent it from being used
      this.connections.delete(connectionId);

      // Unregister from health monitoring if available
      if (this.connectionHealth) {
        this.connectionHealth.unregisterConnection(connectionId);
      }

      // Close the actual connection
      // This will depend on the type of connection, but typically involves calling a close() method
      if (conn.connection && typeof conn.connection.disconnect === 'function') {
        await conn.connection.disconnect();
      } else if (conn.connection && typeof conn.connection.$disconnect === 'function') {
        // For Prisma connections
        await conn.connection.$disconnect();
      } else if (conn.connection && typeof conn.connection.end === 'function') {
        // For some other connection types
        await conn.connection.end();
      } else if (conn.connection && typeof conn.connection.close === 'function') {
        // Generic close method
        await conn.connection.close();
      }

      // Emit connection closed event
      this.emitPoolEvent(ConnectionEventType.DISCONNECTED, connectionId, {
        journeyId: conn.journeyId,
        useCount: conn.useCount,
        lifetime: Date.now() - conn.createdAt.getTime(),
      });

      this.logger.debug(`Closed connection: ${connectionId}`);
    } catch (error) {
      this.logger.warn(`Error closing connection ${connectionId}`, error);

      // Emit connection error event
      this.emitPoolEvent(
        ConnectionEventType.ERROR,
        connectionId,
        { journeyId: conn.journeyId },
        this.createConnectionError(error)
      );
    } finally {
      this.updatePoolStats();
    }
  }

  /**
   * Closes all connections in the pool
   */
  private async closeAllConnections(): Promise<void> {
    this.logger.log(`Closing all connections (${this.connections.size} total)`);

    const connectionIds = Array.from(this.connections.keys());
    const closePromises = connectionIds.map(id => this.closeConnection(id));

    try {
      await Promise.all(closePromises);
      this.logger.log('All connections closed successfully');
    } catch (error) {
      this.logger.error('Error closing all connections', error);
    } finally {
      // Clear the connections map just in case
      this.connections.clear();
      this.updatePoolStats();
    }
  }

  /**
   * Acquires a connection from the pool
   * @param options Options for acquiring the connection
   * @returns Promise that resolves to a pooled connection
   */
  public async acquire(options: ConnectionAcquisitionOptions = {}): Promise<PooledConnection> {
    if (this.isShuttingDown) {
      throw new Error('Cannot acquire connection: pool is shutting down');
    }

    const startTime = Date.now();
    const mergedOptions = { ...DEFAULT_ACQUISITION_OPTIONS, ...options };
    const requestId = `req_${++this.requestIdCounter}`;

    // Check if there's an available connection
    const connection = this.getAvailableConnection(mergedOptions);
    if (connection) {
      // Mark the connection as in use
      connection.inUse = true;
      connection.lastUsedAt = new Date();
      connection.useCount++;

      // Update journey ID if provided
      if (mergedOptions.journeyId && !connection.journeyId) {
        connection.journeyId = mergedOptions.journeyId;
      }

      // Update metadata if provided
      if (mergedOptions.metadata) {
        connection.metadata = { ...connection.metadata, ...mergedOptions.metadata };
      }

      // Validate the connection if required
      if (mergedOptions.validateConnection) {
        try {
          const isValid = await this.validateConnection(connection, mergedOptions.validationFn);
          if (!isValid) {
            // Connection is invalid, remove it and try again
            this.logger.warn(`Connection ${connection.id} failed validation, removing from pool`);
            await this.closeConnection(connection.id);
            return this.acquire(options); // Recursive call to try again
          }
        } catch (error) {
          // Validation error, remove the connection and try again
          this.logger.warn(`Error validating connection ${connection.id}`, error);
          await this.closeConnection(connection.id);
          return this.acquire(options); // Recursive call to try again
        }
      }

      // Update health monitoring if available
      if (this.connectionHealth) {
        this.connectionHealth.markConnectionUsed(connection.id);
      }

      // Reset retry state if available
      if (this.connectionRetry) {
        this.connectionRetry.resetRetryState(connection.id);
      }

      // Record acquisition time for statistics
      const acquisitionTime = Date.now() - startTime;
      this.recordAcquisitionTime(acquisitionTime);

      // Emit connection acquired event
      this.emitPoolEvent(ConnectionEventType.CONNECTED, connection.id, {
        journeyId: connection.journeyId,
        acquisitionTimeMs: acquisitionTime,
        isNewConnection: false,
        useCount: connection.useCount,
      });

      this.logger.debug(
        `Acquired existing connection ${connection.id} ` +
        `(took ${acquisitionTime}ms, use count: ${connection.useCount})`
      );

      this.updatePoolStats();
      return connection;
    }

    // No available connection, check if we can create a new one
    if (this.canCreateNewConnection()) {
      try {
        await this.createConnection(mergedOptions.journeyId);
        // Try to acquire again now that we've created a new connection
        return this.acquire(options);
      } catch (error) {
        this.logger.error('Failed to create new connection for acquisition', error);
        // Continue to queue the request if we couldn't create a new connection
      }
    }

    // Queue the request if we can't immediately satisfy it
    return new Promise<PooledConnection>((resolve, reject) => {
      const request: ConnectionRequest = {
        id: requestId,
        resolve,
        reject,
        createdAt: new Date(),
        options: mergedOptions,
      };

      // Set up timeout if specified
      if (mergedOptions.timeoutMs) {
        request.timeoutHandle = setTimeout(() => {
          // Remove the request from the queue
          const index = this.pendingRequests.findIndex(req => req.id === requestId);
          if (index !== -1) {
            this.pendingRequests.splice(index, 1);
          }

          // Reject the promise with a timeout error
          const timeoutError = new Error(
            `Connection acquisition timed out after ${mergedOptions.timeoutMs}ms`
          );
          reject(timeoutError);

          // Emit timeout event
          this.emitPoolEvent(
            ConnectionEventType.ERROR,
            'timeout',
            {
              requestId,
              journeyId: mergedOptions.journeyId,
              timeoutMs: mergedOptions.timeoutMs,
            },
            this.createConnectionError(timeoutError, ConnectionErrorCategory.TIMEOUT)
          );

          this.updatePoolStats();
        }, mergedOptions.timeoutMs);
      }

      // Add to the queue based on priority
      if (mergedOptions.priority === 'high') {
        // High priority goes to the front of the queue
        this.pendingRequests.unshift(request);
      } else if (mergedOptions.priority === 'low') {
        // Low priority goes to the back of the queue
        this.pendingRequests.push(request);
      } else {
        // Normal priority goes after other high priority requests
        const lastHighPriorityIndex = this.pendingRequests.findIndex(
          req => req.options.priority !== 'high'
        );

        if (lastHighPriorityIndex === -1) {
          // No high priority requests, add to the front
          this.pendingRequests.unshift(request);
        } else {
          // Insert after the last high priority request
          this.pendingRequests.splice(lastHighPriorityIndex, 0, request);
        }
      }

      this.logger.debug(
        `Queued connection request ${requestId} ` +
        `(priority: ${mergedOptions.priority}, ` +
        `timeout: ${mergedOptions.timeoutMs || 'none'}, ` +
        `journey: ${mergedOptions.journeyId || 'none'})`
      );

      this.updatePoolStats();
    });
  }

  /**
   * Releases a connection back to the pool
   * @param connection Connection to release
   */
  public release(connection: PooledConnection): void {
    const conn = this.connections.get(connection.id);
    if (!conn) {
      this.logger.warn(`Attempted to release unknown connection: ${connection.id}`);
      return;
    }

    // Mark the connection as not in use
    conn.inUse = false;
    conn.lastUsedAt = new Date();

    this.logger.debug(
      `Released connection ${conn.id} back to pool ` +
      `(use count: ${conn.useCount}${conn.journeyId ? `, journey: ${conn.journeyId}` : ''})`
    );

    // Check if there are any pending requests that can use this connection
    this.processPendingRequests();

    // Update pool statistics
    this.updatePoolStats();

    // Emit connection released event
    this.emitPoolEvent(ConnectionEventType.CONNECTED, conn.id, {
      journeyId: conn.journeyId,
      isReleased: true,
      useCount: conn.useCount,
    });
  }

  /**
   * Processes any pending connection requests
   */
  private processPendingRequests(): void {
    if (this.pendingRequests.length === 0) {
      return;
    }

    // Process requests in order (respecting priority)
    while (this.pendingRequests.length > 0) {
      const request = this.pendingRequests[0];
      const connection = this.getAvailableConnection(request.options);

      if (!connection) {
        // No available connection, can't process more requests
        break;
      }

      // Remove the request from the queue
      this.pendingRequests.shift();

      // Clear the timeout if set
      if (request.timeoutHandle) {
        clearTimeout(request.timeoutHandle);
      }

      // Mark the connection as in use
      connection.inUse = true;
      connection.lastUsedAt = new Date();
      connection.useCount++;

      // Update journey ID if provided
      if (request.options.journeyId && !connection.journeyId) {
        connection.journeyId = request.options.journeyId;
      }

      // Update metadata if provided
      if (request.options.metadata) {
        connection.metadata = { ...connection.metadata, ...request.options.metadata };
      }

      // Calculate acquisition time
      const acquisitionTime = Date.now() - request.createdAt.getTime();
      this.recordAcquisitionTime(acquisitionTime);

      // Update health monitoring if available
      if (this.connectionHealth) {
        this.connectionHealth.markConnectionUsed(connection.id);
      }

      this.logger.debug(
        `Fulfilled queued request for connection ` +
        `(request waited ${acquisitionTime}ms, connection: ${connection.id})`
      );

      // Resolve the request with the connection
      request.resolve(connection);

      // Emit connection acquired event
      this.emitPoolEvent(ConnectionEventType.CONNECTED, connection.id, {
        journeyId: connection.journeyId,
        acquisitionTimeMs: acquisitionTime,
        isNewConnection: false,
        useCount: connection.useCount,
        wasQueued: true,
        queueTimeMs: acquisitionTime,
      });
    }

    this.updatePoolStats();
  }

  /**
   * Gets an available connection from the pool
   * @param options Options for acquiring the connection
   * @returns An available connection or undefined if none is available
   */
  private getAvailableConnection(options: ConnectionAcquisitionOptions): PooledConnection | undefined {
    // Find all idle connections
    const idleConnections = Array.from(this.connections.values()).filter(conn => !conn.inUse);
    if (idleConnections.length === 0) {
      return undefined;
    }

    // If a journey ID is specified, prefer connections with that journey ID
    if (options.journeyId) {
      const journeyConnection = idleConnections.find(conn => conn.journeyId === options.journeyId);
      if (journeyConnection) {
        return journeyConnection;
      }
    }

    // If connection validation is required, prefer connections that are known to be healthy
    if (options.validateConnection && this.connectionHealth) {
      const healthyConnections = idleConnections.filter(conn => {
        const status = this.connectionHealth?.getConnectionStatus(conn.id);
        return status === HealthStatus.HEALTHY;
      });

      if (healthyConnections.length > 0) {
        // Use the least recently used healthy connection
        return healthyConnections.sort(
          (a, b) => a.lastUsedAt.getTime() - b.lastUsedAt.getTime()
        )[0];
      }
    }

    // Use the least recently used connection
    return idleConnections.sort(
      (a, b) => a.lastUsedAt.getTime() - b.lastUsedAt.getTime()
    )[0];
  }

  /**
   * Validates a connection to ensure it's still usable
   * @param connection Connection to validate
   * @param validationFn Optional custom validation function
   * @returns Whether the connection is valid
   */
  private async validateConnection(
    connection: PooledConnection,
    validationFn?: (connection: any) => Promise<boolean>,
  ): Promise<boolean> {
    try {
      // If a custom validation function is provided, use it
      if (validationFn) {
        return await validationFn(connection.connection);
      }

      // If health monitoring is available, use it
      if (this.connectionHealth) {
        const status = this.connectionHealth.getConnectionStatus(connection.id);
        if (status === HealthStatus.UNHEALTHY) {
          return false;
        }

        // Perform a health check if the status is unknown or degraded
        if (status === HealthStatus.UNKNOWN || status === HealthStatus.DEGRADED) {
          const result = await this.connectionHealth.checkConnectionHealth(connection.id);
          return result.status !== HealthStatus.UNHEALTHY;
        }

        return true;
      }

      // Default validation: check if the connection has a ping or similar method
      if (typeof connection.connection.ping === 'function') {
        await connection.connection.ping();
        return true;
      }

      // For Prisma connections, try a simple query
      if (typeof connection.connection.$queryRaw === 'function') {
        await connection.connection.$queryRaw`SELECT 1`;
        return true;
      }

      // If we can't validate, assume it's valid
      return true;
    } catch (error) {
      this.logger.warn(`Connection validation failed for ${connection.id}`, error);
      return false;
    }
  }

  /**
   * Checks if a new connection can be created
   * @returns Whether a new connection can be created
   */
  private canCreateNewConnection(): boolean {
    const poolConfig = this.config.connectionPool;
    if (!poolConfig) {
      return false;
    }

    // Check if we've reached the maximum number of connections
    const currentConnections = this.connections.size + this.pendingConnections.size;
    if (currentConnections >= poolConfig.poolMax) {
      return false;
    }

    return true;
  }

  /**
   * Rejects all pending connection requests with an error
   * @param error Error to reject with
   */
  private rejectAllPendingRequests(error: Error): void {
    if (this.pendingRequests.length === 0) {
      return;
    }

    this.logger.warn(`Rejecting ${this.pendingRequests.length} pending connection requests: ${error.message}`);

    // Copy the requests to avoid issues with modifying the array while iterating
    const requests = [...this.pendingRequests];
    this.pendingRequests.length = 0; // Clear the array

    // Reject each request
    for (const request of requests) {
      if (request.timeoutHandle) {
        clearTimeout(request.timeoutHandle);
      }
      request.reject(error);
    }

    this.updatePoolStats();
  }

  /**
   * Records a connection acquisition time for statistics
   * @param timeMs Acquisition time in milliseconds
   */
  private recordAcquisitionTime(timeMs: number): void {
    // Keep a rolling window of the last 100 acquisition times
    this.acquisitionTimes.push(timeMs);
    if (this.acquisitionTimes.length > 100) {
      this.acquisitionTimes.shift();
    }

    // Update the average acquisition time
    if (this.acquisitionTimes.length > 0) {
      const sum = this.acquisitionTimes.reduce((acc, time) => acc + time, 0);
      this.stats.avgAcquisitionTimeMs = sum / this.acquisitionTimes.length;
    }
  }

  /**
   * Updates the pool statistics
   */
  private updatePoolStats(): void {
    // Count active and idle connections
    let activeCount = 0;
    let idleCount = 0;
    let totalUseCount = 0;
    let totalLifetimeMs = 0;

    for (const conn of this.connections.values()) {
      if (conn.inUse) {
        activeCount++;
      } else {
        idleCount++;
      }
      totalUseCount += conn.useCount;
      totalLifetimeMs += Date.now() - conn.createdAt.getTime();
    }

    // Update the stats object
    this.stats = {
      totalConnections: this.connections.size,
      activeConnections: activeCount,
      idleConnections: idleCount,
      pendingConnections: this.pendingConnections.size,
      waitingClients: this.pendingRequests.length,
      maxConnectionsReached: this.connections.size >= (this.config.connectionPool?.poolMax || 10),
      avgAcquisitionTimeMs: this.stats.avgAcquisitionTimeMs,
      avgConnectionLifetimeMs: this.connections.size > 0 ? totalLifetimeMs / this.connections.size : 0,
      avgConnectionUseCount: this.connections.size > 0 ? totalUseCount / this.connections.size : 0,
      utilizationPercentage: this.connections.size > 0 ? (activeCount / this.connections.size) * 100 : 0,
      timestamp: new Date(),
    };

    // Check if we need to scale the pool
    this.checkPoolScaling();
  }

  /**
   * Checks if the pool needs to be scaled up or down based on current usage
   */
  private checkPoolScaling(): void {
    const poolConfig = this.config.connectionPool;
    if (!poolConfig) {
      return;
    }

    // Only check scaling every 5 seconds to avoid thrashing
    const now = Date.now();
    if (now - this.lastScalingDecision < 5000) {
      return;
    }
    this.lastScalingDecision = now;

    // If there are waiting clients and we can create more connections, do so
    if (this.pendingRequests.length > 0 && this.canCreateNewConnection()) {
      this.logger.debug(
        `Scaling up pool: ${this.pendingRequests.length} waiting clients, ` +
        `${this.connections.size}/${poolConfig.poolMax} connections`
      );

      // Create a new connection
      this.createConnection().catch(error => {
        this.logger.error('Failed to scale up connection pool', error);
      });
    }

    // If utilization is low and we have more than the minimum connections, consider scaling down
    // This is handled by the idle connection cleanup process
  }

  /**
   * Gets the current pool statistics
   * @returns Current pool statistics
   */
  public getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * Gets the number of active connections
   * @returns Number of active connections
   */
  public getActiveConnectionCount(): number {
    return this.stats.activeConnections;
  }

  /**
   * Gets the number of idle connections
   * @returns Number of idle connections
   */
  public getIdleConnectionCount(): number {
    return this.stats.idleConnections;
  }

  /**
   * Gets the total number of connections
   * @returns Total number of connections
   */
  public getTotalConnectionCount(): number {
    return this.stats.totalConnections;
  }

  /**
   * Gets the number of waiting clients
   * @returns Number of waiting clients
   */
  public getWaitingClientCount(): number {
    return this.stats.waitingClients;
  }

  /**
   * Gets the pool utilization percentage
   * @returns Pool utilization percentage (0-100)
   */
  public getUtilizationPercentage(): number {
    return this.stats.utilizationPercentage;
  }

  /**
   * Creates a connection error object
   * @param error Original error
   * @param category Optional error category
   * @returns Connection error object
   */
  private createConnectionError(error: any, category?: ConnectionErrorCategory): ConnectionError {
    // Determine the error category if not provided
    if (!category) {
      category = ConnectionErrorCategory.UNKNOWN;

      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        category = ConnectionErrorCategory.TIMEOUT;
      } else if (
        errorMessage.includes('connection') ||
        errorMessage.includes('network') ||
        errorMessage.includes('socket')
      ) {
        category = ConnectionErrorCategory.NETWORK;
      } else if (
        errorMessage.includes('authentication') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('access denied')
      ) {
        category = ConnectionErrorCategory.AUTHENTICATION;
      } else if (
        errorMessage.includes('limit') ||
        errorMessage.includes('capacity') ||
        errorMessage.includes('too many')
      ) {
        category = ConnectionErrorCategory.RESOURCE_LIMIT;
      } else if (
        errorMessage.includes('configuration') ||
        errorMessage.includes('config') ||
        errorMessage.includes('setting')
      ) {
        category = ConnectionErrorCategory.CONFIGURATION;
      }
    }

    return {
      category,
      originalError: error instanceof Error ? error : new Error(String(error)),
      message: error instanceof Error ? error.message : String(error),
      isRetryable:
        category === ConnectionErrorCategory.NETWORK ||
        category === ConnectionErrorCategory.TIMEOUT ||
        category === ConnectionErrorCategory.RESOURCE_LIMIT,
      timestamp: new Date(),
      connectionType: DatabaseConnectionType.POSTGRES, // Assuming PostgreSQL for now
    };
  }

  /**
   * Emits a pool event if an event emitter is available
   * @param type Event type
   * @param connectionId Connection ID
   * @param data Additional event data
   * @param error Optional error information
   */
  private emitPoolEvent(
    type: ConnectionEventType,
    connectionId: string,
    data?: Record<string, any>,
    error?: ConnectionError,
  ): void {
    if (!this.eventEmitter) {
      return;
    }

    this.eventEmitter.emit({
      type,
      connectionId,
      timestamp: new Date(),
      data: {
        ...data,
        poolSize: this.connections.size,
        activeConnections: this.stats.activeConnections,
        idleConnections: this.stats.idleConnections,
        waitingClients: this.stats.waitingClients,
      },
      error,
    });
  }
}