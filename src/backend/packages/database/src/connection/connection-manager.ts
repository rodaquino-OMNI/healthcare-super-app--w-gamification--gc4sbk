/**
 * @file connection-manager.ts
 * @description Implements ConnectionManager class, a central module responsible for creating,
 * tracking, and reusing database connections across the application. It provides methods for
 * obtaining optimized connections based on query patterns, managing connection lifecycle,
 * and applying appropriate retry strategies for different types of database operations.
 */

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { ConnectionPool, ConnectionAcquisitionOptions } from './connection-pool';
import { ConnectionHealth, ConnectionStatus } from './connection-health';
import { ConnectionRetry, RetryOperationType } from './connection-retry';
import { DatabaseException } from '../errors/database-error.exception';
import { DatabaseErrorType } from '../errors/database-error.types';
import { JourneyType } from '../types/journey.types';
import { 
  ConnectionConfig, 
  IConnectionPoolConfig, 
  IConnectionRetryConfig, 
  DatabaseTechnology 
} from '../types/connection.types';
import { 
  createConnectionConfig, 
  getEnvironmentConfig, 
  getJourneyDatabaseConfig, 
  validateConnectionConfig 
} from './connection-config';

/**
 * Interface for ConnectionManager configuration
 */
export interface ConnectionManagerConfig {
  /**
   * Configuration for the connection pool
   */
  poolConfig?: IConnectionPoolConfig;

  /**
   * Configuration for retry strategies
   */
  retryConfig?: IConnectionRetryConfig;

  /**
   * Journey type for journey-specific optimizations
   */
  journeyType?: JourneyType;

  /**
   * Database technology to use
   */
  databaseTechnology?: DatabaseTechnology;

  /**
   * Whether to enable connection tracking
   */
  enableConnectionTracking?: boolean;

  /**
   * Whether to enable health monitoring
   */
  enableHealthMonitoring?: boolean;

  /**
   * Whether to enable automatic connection cleanup
   */
  enableAutoCleanup?: boolean;

  /**
   * Interval in milliseconds for connection cleanup
   */
  cleanupIntervalMs?: number;

  /**
   * Maximum idle time in milliseconds before a connection is cleaned up
   */
  maxIdleTimeMs?: number;

  /**
   * Maximum lifetime in milliseconds for a connection
   */
  maxLifetimeMs?: number;

  /**
   * Whether to validate connections on acquisition
   */
  validateOnAcquire?: boolean;

  /**
   * Whether to validate connections on release
   */
  validateOnRelease?: boolean;

  /**
   * Whether to enable query logging
   */
  enableQueryLogging?: boolean;

  /**
   * Whether to enable performance tracking
   */
  enablePerformanceTracking?: boolean;

  /**
   * Whether to enable circuit breaker pattern
   */
  enableCircuitBreaker?: boolean;
}

/**
 * Default ConnectionManager configuration
 */
const DEFAULT_CONFIG: ConnectionManagerConfig = {
  databaseTechnology: DatabaseTechnology.POSTGRESQL,
  enableConnectionTracking: true,
  enableHealthMonitoring: true,
  enableAutoCleanup: true,
  cleanupIntervalMs: 60000, // 1 minute
  maxIdleTimeMs: 300000, // 5 minutes
  maxLifetimeMs: 3600000, // 1 hour
  validateOnAcquire: true,
  validateOnRelease: false,
  enableQueryLogging: process.env.NODE_ENV !== 'production',
  enablePerformanceTracking: true,
  enableCircuitBreaker: true,
};

/**
 * Interface for a tracked connection
 */
interface TrackedConnection {
  /** The connection object */
  connection: any;
  /** Unique identifier for this connection */
  id: string;
  /** When the connection was created */
  createdAt: Date;
  /** When the connection was last acquired */
  lastAcquiredAt: Date;
  /** When the connection was last released */
  lastReleasedAt?: Date;
  /** Number of times this connection has been acquired */
  acquisitionCount: number;
  /** Whether the connection is currently in use */
  inUse: boolean;
  /** Journey type this connection is optimized for */
  journeyType?: JourneyType;
  /** Query pattern this connection is optimized for */
  queryPattern?: string;
  /** Health monitor for this connection */
  health?: ConnectionHealth;
}

/**
 * Enum for different query patterns that can be optimized
 */
export enum QueryPattern {
  /** Read-only queries */
  READ_ONLY = 'READ_ONLY',
  /** Write-heavy operations */
  WRITE_HEAVY = 'WRITE_HEAVY',
  /** Mixed read/write operations */
  MIXED = 'MIXED',
  /** Analytical queries */
  ANALYTICAL = 'ANALYTICAL',
  /** Time-series data operations */
  TIME_SERIES = 'TIME_SERIES',
  /** Transactional operations */
  TRANSACTIONAL = 'TRANSACTIONAL',
}

/**
 * Interface for connection acquisition options
 */
export interface ConnectionOptions {
  /** Journey type for journey-specific optimizations */
  journeyType?: JourneyType;
  /** Query pattern for query-specific optimizations */
  queryPattern?: QueryPattern;
  /** Whether to force a new connection */
  forceNew?: boolean;
  /** Whether to validate the connection before returning it */
  validate?: boolean;
  /** Timeout in milliseconds for connection acquisition */
  timeout?: number;
  /** Priority level for this request (higher gets served first) */
  priority?: number;
  /** Additional metadata for this connection */
  metadata?: Record<string, any>;
}

/**
 * A central module responsible for creating, tracking, and reusing database connections
 * across the application. It provides methods for obtaining optimized connections based
 * on query patterns, managing connection lifecycle, and applying appropriate retry
 * strategies for different types of database operations.
 */
@Injectable()
export class ConnectionManager implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectionManager.name);
  private readonly config: ConnectionManagerConfig;
  private readonly connectionPools: Map<string, ConnectionPool> = new Map();
  private readonly trackedConnections: Map<string, TrackedConnection> = new Map();
  private readonly connectionRetry: ConnectionRetry;
  private readonly connectionConfig: ConnectionConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private isShuttingDown = false;

  /**
   * Creates a new ConnectionManager instance
   * 
   * @param config - ConnectionManager configuration
   * @param configService - NestJS config service for configuration
   * @param loggerService - Logger service for structured logging
   * @param tracingService - Tracing service for distributed tracing
   */
  constructor(
    config?: ConnectionManagerConfig,
    private readonly configService?: ConfigService,
    private readonly loggerService?: LoggerService,
    private readonly tracingService?: TracingService
  ) {
    // Merge default config with provided config
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Create connection configuration
    const journeyId = this.config.journeyType ? 
      this.getJourneyId(this.config.journeyType) : 
      'default';
    
    this.connectionConfig = createConnectionConfig(
      journeyId,
      this.config.databaseTechnology || DatabaseTechnology.POSTGRESQL
    );

    // Create connection retry handler
    this.connectionRetry = new ConnectionRetry(this.connectionConfig);

    this.logger.log('ConnectionManager created', {
      journeyType: this.config.journeyType,
      poolConfig: this.config.poolConfig,
      retryConfig: this.config.retryConfig,
    });
  }

  /**
   * Initialize the ConnectionManager when the module is initialized
   */
  async onModuleInit(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize default connection pool
      await this.initializeDefaultPool();

      // Start cleanup timer if auto cleanup is enabled
      if (this.config.enableAutoCleanup) {
        this.startCleanupTimer();
      }

      this.isInitialized = true;
      this.logger.log('ConnectionManager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize ConnectionManager', error);
      throw new DatabaseException(
        'Failed to initialize ConnectionManager',
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    }
  }

  /**
   * Clean up resources when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    await this.shutdown();
  }

  /**
   * Initialize the default connection pool
   */
  private async initializeDefaultPool(): Promise<void> {
    const poolId = this.getPoolId();
    
    if (this.connectionPools.has(poolId)) {
      return;
    }

    try {
      // Create connection pool
      const pool = new ConnectionPool(
        this.loggerService || new Logger('ConnectionPool'),
        this.tracingService || { startSpan: () => ({ setAttributes: () => {}, recordException: () => {}, end: () => {} }) },
        this.connectionConfig,
        this.createConnection.bind(this),
        this.closeConnection.bind(this),
        this.validateConnection.bind(this)
      );

      // Initialize the pool
      await pool.onModuleInit();

      // Store the pool
      this.connectionPools.set(poolId, pool);

      this.logger.log('Default connection pool initialized', {
        poolId,
        minConnections: this.connectionConfig.pool?.min || 2,
        maxConnections: this.connectionConfig.pool?.max || 10,
      });
    } catch (error) {
      this.logger.error('Failed to initialize default connection pool', error);
      throw new DatabaseException(
        'Failed to initialize default connection pool',
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    }
  }

  /**
   * Initialize a journey-specific connection pool
   * 
   * @param journeyType - The journey type to initialize a pool for
   * @returns Promise that resolves when the pool is initialized
   */
  private async initializeJourneyPool(journeyType: JourneyType): Promise<void> {
    const journeyId = this.getJourneyId(journeyType);
    const poolId = this.getPoolId(journeyType);
    
    if (this.connectionPools.has(poolId)) {
      return;
    }

    try {
      // Create journey-specific connection configuration
      const journeyConfig = createConnectionConfig(
        journeyId,
        this.config.databaseTechnology || DatabaseTechnology.POSTGRESQL
      );

      // Create connection pool
      const pool = new ConnectionPool(
        this.loggerService || new Logger(`ConnectionPool-${journeyId}`),
        this.tracingService || { startSpan: () => ({ setAttributes: () => {}, recordException: () => {}, end: () => {} }) },
        journeyConfig,
        this.createConnection.bind(this),
        this.closeConnection.bind(this),
        this.validateConnection.bind(this)
      );

      // Initialize the pool
      await pool.onModuleInit();

      // Store the pool
      this.connectionPools.set(poolId, pool);

      this.logger.log(`Connection pool initialized for ${journeyId} journey`, {
        poolId,
        journeyType,
        minConnections: journeyConfig.pool?.min || 2,
        maxConnections: journeyConfig.pool?.max || 10,
      });
    } catch (error) {
      this.logger.error(`Failed to initialize connection pool for ${journeyId} journey`, error);
      throw new DatabaseException(
        `Failed to initialize connection pool for ${journeyId} journey`,
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    }
  }

  /**
   * Start the connection cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(
      () => this.cleanupConnections(),
      this.config.cleanupIntervalMs
    );

    this.logger.log('Connection cleanup timer started', {
      interval: this.config.cleanupIntervalMs,
      maxIdleTime: this.config.maxIdleTimeMs,
      maxLifetime: this.config.maxLifetimeMs,
    });
  }

  /**
   * Clean up idle and expired connections
   */
  private async cleanupConnections(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    try {
      const now = Date.now();
      const connectionsToClose: string[] = [];

      // Find connections that need to be closed
      for (const [id, connection] of this.trackedConnections.entries()) {
        // Skip connections that are in use
        if (connection.inUse) {
          continue;
        }

        // Check if connection has been idle for too long
        if (connection.lastReleasedAt && 
            this.config.maxIdleTimeMs && 
            now - connection.lastReleasedAt.getTime() > this.config.maxIdleTimeMs) {
          connectionsToClose.push(id);
          continue;
        }

        // Check if connection has exceeded its maximum lifetime
        if (this.config.maxLifetimeMs && 
            now - connection.createdAt.getTime() > this.config.maxLifetimeMs) {
          connectionsToClose.push(id);
          continue;
        }

        // Check if connection is unhealthy
        if (connection.health && connection.health.isUnhealthy()) {
          connectionsToClose.push(id);
          continue;
        }
      }

      // Close the identified connections
      if (connectionsToClose.length > 0) {
        this.logger.log('Cleaning up connections', {
          count: connectionsToClose.length,
          totalConnections: this.trackedConnections.size,
        });

        for (const id of connectionsToClose) {
          await this.closeTrackedConnection(id);
        }
      }
    } catch (error) {
      this.logger.error('Error during connection cleanup', error);
    }
  }

  /**
   * Create a new database connection
   * 
   * @returns Promise that resolves to a new connection
   */
  private async createConnection(): Promise<any> {
    try {
      // This is a placeholder for actual connection creation logic
      // In a real implementation, this would create a connection to the database
      // using the appropriate driver (e.g., pg, mysql, etc.)
      // For example, with pg: new Pool(this.connectionConfig)
      
      // Execute the connection creation with retry logic
      const result = await this.connectionRetry.executeConnect(async () => {
        // Simulate creating a database connection
        // In a real implementation, this would be something like:
        // const client = new pg.Client(this.connectionConfig);
        // await client.connect();
        // return client;
        return {};
      });
      
      if (!result.success) {
        throw result.error || new Error('Failed to create database connection');
      }
      
      const connection = result.result;

      // Track the connection if tracking is enabled
      if (this.config.enableConnectionTracking) {
        const id = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        
        const trackedConnection: TrackedConnection = {
          connection,
          id,
          createdAt: new Date(),
          lastAcquiredAt: new Date(),
          acquisitionCount: 0,
          inUse: false,
          journeyType: this.config.journeyType,
        };

        // Create health monitor if enabled
        if (this.config.enableHealthMonitoring) {
          trackedConnection.health = new ConnectionHealth(
            this.loggerService || new Logger('ConnectionHealth'),
            this.tracingService || { startSpan: () => ({ setAttributes: () => {}, recordException: () => {}, end: () => {} }) },
            this.connectionConfig
          );
          trackedConnection.health.startMonitoring();
        }

        this.trackedConnections.set(id, trackedConnection);

        this.logger.debug('Created and tracked new database connection', {
          connectionId: id,
          journeyType: trackedConnection.journeyType,
        });
      }

      return connection;
    } catch (error) {
      this.logger.error('Failed to create database connection', error);
      throw new DatabaseException(
        'Failed to create database connection',
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    }
  }

  /**
   * Close a database connection
   * 
   * @param connection - The connection to close
   */
  private async closeConnection(connection: any): Promise<void> {
    try {
      // Find the tracked connection
      let connectionId: string | null = null;
      
      for (const [id, trackedConn] of this.trackedConnections.entries()) {
        if (trackedConn.connection === connection) {
          connectionId = id;
          break;
        }
      }

      // Close the tracked connection if found
      if (connectionId) {
        await this.closeTrackedConnection(connectionId);
      } else {
        // Execute connection closing with retry logic
        await this.connectionRetry.executeCommand(async () => {
          // This is a placeholder for actual connection closing logic
          // In a real implementation, this would close the connection to the database
          // using the appropriate driver method
          // For example, with pg: await connection.end();
          return true;
        });
        
        this.logger.debug('Closed untracked database connection');
      }
    } catch (error) {
      this.logger.error('Error closing database connection', error);
      throw new DatabaseException(
        'Error closing database connection',
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    }
  }

  /**
   * Close a tracked connection by ID
   * 
   * @param connectionId - ID of the connection to close
   */
  private async closeTrackedConnection(connectionId: string): Promise<void> {
    const trackedConnection = this.trackedConnections.get(connectionId);
    
    if (!trackedConnection) {
      return;
    }

    try {
      // Stop health monitoring if enabled
      if (trackedConnection.health) {
        trackedConnection.health.stopMonitoring();
      }

      // Execute connection closing with retry logic
      await this.connectionRetry.executeCommand(async () => {
        // This is a placeholder for actual connection closing logic
        // In a real implementation, this would close the connection to the database
        // using the appropriate driver method
        // For example, with pg: await trackedConnection.connection.end();
        return true;
      });

      // Remove from tracked connections
      this.trackedConnections.delete(connectionId);

      this.logger.debug('Closed tracked database connection', {
        connectionId,
        journeyType: trackedConnection.journeyType,
        acquisitionCount: trackedConnection.acquisitionCount,
        lifetime: Date.now() - trackedConnection.createdAt.getTime(),
      });
    } catch (error) {
      this.logger.error('Error closing tracked database connection', {
        error,
        connectionId,
      });
      throw new DatabaseException(
        'Error closing tracked database connection',
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    }
  }

  /**
   * Validate a database connection
   * 
   * @param connection - The connection to validate
   * @returns Promise that resolves to true if the connection is valid, false otherwise
   */
  private async validateConnection(connection: any): Promise<boolean> {
    try {
      // Execute validation with retry logic
      const result = await this.connectionRetry.executeValidation(async () => {
        // This is a placeholder for actual connection validation logic
        // In a real implementation, this would execute a simple query to verify
        // that the connection is still valid
        // For example, with pg: await connection.query('SELECT 1');
        return true;
      });
      
      return result.success;
    } catch (error) {
      this.logger.error('Connection validation failed', error);
      return false;
    }
  }

  /**
   * Get a connection from the appropriate pool based on options
   * 
   * @param options - Connection acquisition options
   * @returns Promise that resolves to a database connection
   */
  async getConnection(options: ConnectionOptions = {}): Promise<any> {
    if (this.isShuttingDown) {
      throw new DatabaseException(
        'Cannot get connection: ConnectionManager is shutting down',
        DatabaseErrorType.CONNECTION
      );
    }

    if (!this.isInitialized) {
      await this.onModuleInit();
    }

    const journeyType = options.journeyType || this.config.journeyType;
    const poolId = this.getPoolId(journeyType);

    // Initialize journey-specific pool if needed
    if (journeyType && !this.connectionPools.has(poolId)) {
      await this.initializeJourneyPool(journeyType);
    }

    // Get the appropriate connection pool
    const pool = this.connectionPools.get(poolId) || this.connectionPools.get(this.getPoolId());

    if (!pool) {
      throw new DatabaseException(
        'No connection pool available',
        DatabaseErrorType.CONNECTION
      );
    }
    
    // Apply journey-specific optimizations
    if (journeyType) {
      switch (journeyType) {
        case JourneyType.HEALTH:
          // Health journey has more time-series data, optimize for that
          options.metadata = {
            ...options.metadata,
            timeSeriesData: true,
            healthMetrics: true,
          };
          break;
          
        case JourneyType.CARE:
          // Care journey needs faster response times for appointments
          options.timeout = options.timeout || 3000; // 3 seconds for faster timeouts
          options.priority = options.priority || 1; // Higher priority
          break;
          
        case JourneyType.PLAN:
          // Plan journey has more complex transactions, optimize for that
          options.metadata = {
            ...options.metadata,
            transactional: true,
            financialData: true,
          };
          break;
      }
    }

    try {
      // Convert options to pool acquisition options
      const acquisitionOptions: ConnectionAcquisitionOptions = {
        timeout: options.timeout,
        preferIdle: true,
        validate: options.validate !== undefined ? options.validate : this.config.validateOnAcquire,
        forceNew: options.forceNew || false,
        priority: options.priority || 0,
      };

      // Get connection from pool with retry
      const result = await this.connectionRetry.executeConnect(
        () => pool.acquire(acquisitionOptions),
        {
          journeyType: options.journeyType,
          queryPattern: options.queryPattern,
          ...options.metadata,
        }
      );

      if (!result.success) {
        throw result.error || new DatabaseException(
          'Failed to acquire connection from pool',
          DatabaseErrorType.CONNECTION
        );
      }

      const connection = result.result;

      // Update tracked connection if tracking is enabled
      if (this.config.enableConnectionTracking) {
        for (const trackedConn of this.trackedConnections.values()) {
          if (trackedConn.connection === connection) {
            trackedConn.inUse = true;
            trackedConn.lastAcquiredAt = new Date();
            trackedConn.acquisitionCount++;
            trackedConn.journeyType = journeyType;
            trackedConn.queryPattern = options.queryPattern;
            break;
          }
        }
      }

      return connection;
    } catch (error) {
      this.logger.error('Failed to get connection', {
        error,
        journeyType,
        queryPattern: options.queryPattern,
      });
      throw new DatabaseException(
        `Failed to get connection: ${error.message}`,
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    }
  }

  /**
   * Release a connection back to the pool
   * 
   * @param connection - The connection to release
   * @param forceClose - Whether to force close the connection instead of returning it to the pool
   */
  async releaseConnection(connection: any, forceClose: boolean = false): Promise<void> {
    if (!connection) {
      return;
    }

    try {
      // Find the tracked connection
      let trackedConnection: TrackedConnection | undefined;
      
      for (const tracked of this.trackedConnections.values()) {
        if (tracked.connection === connection) {
          trackedConnection = tracked;
          break;
        }
      }

      // Update tracked connection if found
      if (trackedConnection) {
        trackedConnection.inUse = false;
        trackedConnection.lastReleasedAt = new Date();
      }

      // Validate connection if configured
      if (this.config.validateOnRelease && !forceClose) {
        const isValid = await this.validateConnection(connection);
        if (!isValid) {
          forceClose = true;
        }
      }

      // Find the appropriate pool
      const journeyType = trackedConnection?.journeyType || this.config.journeyType;
      const poolId = this.getPoolId(journeyType);
      const pool = this.connectionPools.get(poolId) || this.connectionPools.get(this.getPoolId());

      if (!pool) {
        this.logger.warn('No connection pool found for releasing connection', {
          journeyType,
          connectionId: trackedConnection?.id,
        });
        return;
      }

      // Release connection back to pool
      await pool.release(connection, forceClose);
    } catch (error) {
      this.logger.error('Error releasing connection', error);
    }
  }

  /**
   * Get a connection optimized for a specific journey
   * 
   * @param journeyType - The journey type to get a connection for
   * @param options - Additional connection options
   * @returns Promise that resolves to a database connection
   */
  async getJourneyConnection(journeyType: JourneyType, options: Omit<ConnectionOptions, 'journeyType'> = {}): Promise<any> {
    // Apply journey-specific default query patterns if not specified
    let queryPattern = options.queryPattern;
    
    if (!queryPattern) {
      // Set default query pattern based on journey type
      switch (journeyType) {
        case JourneyType.HEALTH:
          queryPattern = QueryPattern.TIME_SERIES;
          break;
        case JourneyType.CARE:
          queryPattern = QueryPattern.MIXED;
          break;
        case JourneyType.PLAN:
          queryPattern = QueryPattern.TRANSACTIONAL;
          break;
      }
    }
    
    return this.getConnection({
      ...options,
      journeyType,
      queryPattern,
    });
  }

  /**
   * Get a connection optimized for a specific query pattern
   * 
   * @param queryPattern - The query pattern to optimize for
   * @param options - Additional connection options
   * @returns Promise that resolves to a database connection
   */
  async getPatternConnection(queryPattern: QueryPattern, options: Omit<ConnectionOptions, 'queryPattern'> = {}): Promise<any> {
    // Apply query pattern-specific optimizations
    const optimizedOptions: ConnectionOptions = {
      ...options,
      queryPattern,
    };
    
    // Optimize based on query pattern
    switch (queryPattern) {
      case QueryPattern.READ_ONLY:
        // For read-only queries, we can use a connection with read-only optimizations
        optimizedOptions.metadata = {
          ...optimizedOptions.metadata,
          readOnly: true,
          preferSlave: true, // Prefer slave/replica databases for reads
        };
        break;
        
      case QueryPattern.WRITE_HEAVY:
        // For write-heavy operations, ensure we use a master/primary connection
        optimizedOptions.metadata = {
          ...optimizedOptions.metadata,
          readOnly: false,
          preferMaster: true, // Always use master/primary for writes
        };
        break;
        
      case QueryPattern.ANALYTICAL:
        // For analytical queries, use longer timeouts and optimize for large result sets
        optimizedOptions.timeout = options.timeout || 30000; // Longer timeout for analytical queries
        optimizedOptions.metadata = {
          ...optimizedOptions.metadata,
          analyticalQuery: true,
          largeResultSet: true,
        };
        break;
        
      case QueryPattern.TIME_SERIES:
        // For time-series data, use TimescaleDB if available
        if (this.config.databaseTechnology !== DatabaseTechnology.TIMESCALEDB) {
          this.logger.warn('Time-series query pattern requested but TimescaleDB not configured');
        }
        optimizedOptions.metadata = {
          ...optimizedOptions.metadata,
          timeSeriesData: true,
        };
        break;
        
      case QueryPattern.TRANSACTIONAL:
        // For transactional operations, ensure we have proper isolation and durability
        optimizedOptions.metadata = {
          ...optimizedOptions.metadata,
          transactional: true,
          durability: 'high',
        };
        break;
    }
    
    return this.getConnection(optimizedOptions);
  }

  /**
   * Execute a function with a connection, automatically releasing it when done
   * 
   * @param fn - Function to execute with the connection
   * @param options - Connection options
   * @returns Promise that resolves to the result of the function
   */
  async withConnection<T>(fn: (connection: any) => Promise<T>, options: ConnectionOptions = {}): Promise<T> {
    const connection = await this.getConnection(options);
    
    try {
      return await fn(connection);
    } finally {
      await this.releaseConnection(connection);
    }
  }

  /**
   * Execute a function with a journey-specific connection, automatically releasing it when done
   * 
   * @param journeyType - The journey type to get a connection for
   * @param fn - Function to execute with the connection
   * @param options - Additional connection options
   * @returns Promise that resolves to the result of the function
   */
  async withJourneyConnection<T>(
    journeyType: JourneyType,
    fn: (connection: any) => Promise<T>,
    options: Omit<ConnectionOptions, 'journeyType'> = {}
  ): Promise<T> {
    return this.withConnection(fn, {
      ...options,
      journeyType,
    });
  }

  /**
   * Execute a function with a pattern-optimized connection, automatically releasing it when done
   * 
   * @param queryPattern - The query pattern to optimize for
   * @param fn - Function to execute with the connection
   * @param options - Additional connection options
   * @returns Promise that resolves to the result of the function
   */
  async withPatternConnection<T>(
    queryPattern: QueryPattern,
    fn: (connection: any) => Promise<T>,
    options: Omit<ConnectionOptions, 'queryPattern'> = {}
  ): Promise<T> {
    return this.withConnection(fn, {
      ...options,
      queryPattern,
    });
  }

  /**
   * Execute a query with retry logic
   * 
   * @param queryFn - Function that executes the query
   * @param options - Connection options
   * @returns Promise that resolves to the query result
   */
  async executeQuery<T>(queryFn: (connection: any) => Promise<T>, options: ConnectionOptions = {}): Promise<T> {
    return this.withConnection(async (connection) => {
      const result = await this.connectionRetry.executeQuery(
        () => queryFn(connection),
        {
          journeyType: options.journeyType,
          queryPattern: options.queryPattern,
          ...options.metadata,
        }
      );

      if (!result.success) {
        throw result.error || new DatabaseException(
          'Query execution failed',
          DatabaseErrorType.QUERY
        );
      }

      return result.result;
    }, options);
  }

  /**
   * Execute a transaction with retry logic
   * 
   * @param transactionFn - Function that executes the transaction
   * @param options - Connection options
   * @returns Promise that resolves to the transaction result
   */
  async executeTransaction<T>(transactionFn: (connection: any) => Promise<T>, options: ConnectionOptions = {}): Promise<T> {
    return this.withConnection(async (connection) => {
      const result = await this.connectionRetry.executeTransaction(
        () => transactionFn(connection),
        {
          journeyType: options.journeyType,
          queryPattern: options.queryPattern,
          ...options.metadata,
        }
      );

      if (!result.success) {
        throw result.error || new DatabaseException(
          'Transaction execution failed',
          DatabaseErrorType.TRANSACTION
        );
      }

      return result.result;
    }, options);
  }

  /**
   * Shut down the ConnectionManager and release all resources
   * 
   * @param force - Whether to force immediate shutdown without waiting for active connections
   * @returns Promise that resolves when shutdown is complete
   */
  async shutdown(force: boolean = false): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    this.logger.log('Shutting down ConnectionManager...');

    try {
      // Stop cleanup timer
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }

      // Shut down all connection pools
      const shutdownPromises: Promise<void>[] = [];
      
      for (const [poolId, pool] of this.connectionPools.entries()) {
        this.logger.log(`Shutting down connection pool: ${poolId}`);
        shutdownPromises.push(pool.shutdown(force));
      }

      await Promise.all(shutdownPromises);

      // Clear all tracked connections
      this.trackedConnections.clear();
      this.connectionPools.clear();

      this.logger.log('ConnectionManager shutdown complete');
    } catch (error) {
      this.logger.error('Error during ConnectionManager shutdown', error);
      throw new DatabaseException(
        'Error during ConnectionManager shutdown',
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    }
  }

  /**
   * Get the connection pool for a specific journey type
   * 
   * @param journeyType - The journey type to get the pool for
   * @returns The connection pool or undefined if not found
   */
  getPool(journeyType?: JourneyType): ConnectionPool | undefined {
    const poolId = this.getPoolId(journeyType);
    return this.connectionPools.get(poolId);
  }

  /**
   * Get statistics for all connection pools
   * 
   * @returns Object containing statistics for each pool
   */
  getPoolStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [poolId, pool] of this.connectionPools.entries()) {
      stats[poolId] = pool.getStats();
    }
    
    return stats;
  }

  /**
   * Get statistics for tracked connections
   * 
   * @returns Object containing tracked connection statistics
   */
  getConnectionStats(): Record<string, any> {
    const totalConnections = this.trackedConnections.size;
    let activeConnections = 0;
    let idleConnections = 0;
    const journeyConnections: Record<string, number> = {};
    const patternConnections: Record<string, number> = {};
    
    for (const connection of this.trackedConnections.values()) {
      if (connection.inUse) {
        activeConnections++;
      } else {
        idleConnections++;
      }
      
      // Count connections by journey
      if (connection.journeyType) {
        const journeyId = this.getJourneyId(connection.journeyType);
        journeyConnections[journeyId] = (journeyConnections[journeyId] || 0) + 1;
      }
      
      // Count connections by pattern
      if (connection.queryPattern) {
        patternConnections[connection.queryPattern] = 
          (patternConnections[connection.queryPattern] || 0) + 1;
      }
    }
    
    return {
      totalConnections,
      activeConnections,
      idleConnections,
      utilizationPercentage: totalConnections > 0 ? 
        (activeConnections / totalConnections) * 100 : 0,
      journeyConnections,
      patternConnections,
    };
  }

  /**
   * Check the health of all connection pools
   * 
   * @returns Promise that resolves to a health check result
   */
  async checkHealth(): Promise<{ healthy: boolean; details: Record<string, any> }> {
    const details: Record<string, any> = {};
    let allHealthy = true;
    
    for (const [poolId, pool] of this.connectionPools.entries()) {
      try {
        // Get a connection from the pool
        const connection = await pool.acquire({
          timeout: 5000,
          validate: true,
        });
        
        // Validate the connection
        const isValid = await this.validateConnection(connection);
        
        // Release the connection
        await pool.release(connection, !isValid);
        
        details[poolId] = {
          healthy: isValid,
          timestamp: new Date().toISOString(),
          stats: pool.getStats(),
        };
        
        if (!isValid) {
          allHealthy = false;
        }
      } catch (error) {
        details[poolId] = {
          healthy: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        };
        
        allHealthy = false;
      }
    }
    
    return {
      healthy: allHealthy,
      details,
    };
  }

  /**
   * Get a unique ID for a connection pool based on journey type
   * 
   * @param journeyType - The journey type
   * @returns A unique ID for the pool
   */
  private getPoolId(journeyType?: JourneyType): string {
    if (!journeyType) {
      return `default_${this.connectionConfig.technology}`;
    }
    
    return `${this.getJourneyId(journeyType)}_${this.connectionConfig.technology}`;
  }

  /**
   * Get a journey ID from a journey type
   * 
   * @param journeyType - The journey type
   * @returns The journey ID
   */
  private getJourneyId(journeyType: JourneyType): string {
    switch (journeyType) {
      case JourneyType.HEALTH:
        return 'health';
      case JourneyType.CARE:
        return 'care';
      case JourneyType.PLAN:
        return 'plan';
      default:
        return 'default';
    }
  }

  /**
   * Initialize a connection for a specific journey type
   * 
   * @param journeyType - The journey type
   * @returns Promise that resolves to a connection
   */
  async initializeJourneyConnection(journeyType: JourneyType): Promise<void> {
    // Initialize the journey-specific pool
    await this.initializeJourneyPool(journeyType);
    
    // Get and immediately release a connection to ensure the pool is working
    const connection = await this.getJourneyConnection(journeyType);
    await this.releaseConnection(connection);
    
    this.logger.log(`Journey connection initialized for ${this.getJourneyId(journeyType)}`);
  }

  /**
   * Refresh all connections in all pools
   * 
   * @returns Promise that resolves when all connections have been refreshed
   */
  async refreshConnections(): Promise<void> {
    const refreshPromises: Promise<void>[] = [];
    
    for (const [poolId, pool] of this.connectionPools.entries()) {
      this.logger.log(`Refreshing connections in pool: ${poolId}`);
      refreshPromises.push(pool.refreshConnections());
    }
    
    await Promise.all(refreshPromises);
    this.logger.log('All connections refreshed');
  }
}