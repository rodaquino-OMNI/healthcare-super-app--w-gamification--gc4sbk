/**
 * @file connection-health.ts
 * @description Implements ConnectionHealth class that monitors and reports on database connection health metrics.
 * It provides methods for checking connection liveness, measuring query response times, detecting slow connections,
 * and reporting connection statistics. The health monitoring integrates with the application's observability framework
 * to provide metrics for dashboards and alerting.
 */

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Span } from '@opentelemetry/api';
import { TracingService } from '@austa/tracing';
import {
  ConnectionConfig,
  HealthCheckConfig,
  DEFAULT_HEALTH_CHECK_CONFIG,
} from './connection-config';
import { ConnectionRetry, RetryContext } from './connection-retry';
import {
  ConnectionError,
  ConnectionErrorCategory,
  ConnectionEventEmitter,
  ConnectionEventType,
  DatabaseConnectionType,
  ConnectionStatus,
} from '../types/connection.types';

/**
 * Health status enum for database connections
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
  RECOVERING = 'recovering',
}

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  /** Connection identifier */
  connectionId: string;
  /** Health status */
  status: HealthStatus;
  /** Response time in milliseconds */
  responseTimeMs: number;
  /** Number of consecutive failures */
  consecutiveFailures: number;
  /** Number of consecutive successes */
  consecutiveSuccesses: number;
  /** Timestamp when the connection was last checked */
  lastCheckedAt?: Date;
  /** Error that occurred during the health check, if any */
  error?: ConnectionError;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  /** Average response time in milliseconds */
  averageResponseTimeMs: number;
  /** Minimum response time in milliseconds */
  minResponseTimeMs: number;
  /** Maximum response time in milliseconds */
  maxResponseTimeMs: number;
  /** Response time trend (improving, degrading, stable) */
  responseTimeTrend: 'improving' | 'degrading' | 'stable';
  /** Timestamp when metrics were last measured */
  lastMeasuredAt: Date;
}

/**
 * Connection statistics interface
 */
export interface ConnectionStatistics {
  /** Connection identifier */
  connectionId: string;
  /** Connection type */
  connectionType: DatabaseConnectionType;
  /** Current health status */
  status: HealthStatus;
  /** Timestamp when the connection was created */
  createdAt: Date;
  /** Timestamp when the connection was last used */
  lastUsedAt?: Date;
  /** Timestamp when the connection was last checked for health */
  lastCheckedAt?: Date;
  /** Uptime percentage (0-100) */
  uptimePercentage: number;
  /** Performance metrics */
  performanceMetrics: PerformanceMetrics;
  /** Response time trend as [timestamp, responseTimeMs] pairs */
  responseTimeTrend: [number, number][];
  /** Number of health checks performed */
  healthCheckCount: number;
  /** Number of failed health checks */
  failureCount: number;
  /** Whether the connection is in recovery mode */
  inRecovery: boolean;
  /** Timestamp when recovery mode was entered, if applicable */
  recoveryStartedAt?: Date;
  /** Journey ID associated with this connection, if any */
  journeyId?: string;
}

/**
 * Options for connection health monitoring
 */
export interface ConnectionHealthOptions {
  /** Maximum number of history entries to keep */
  maxHistorySize: number;
  /** Whether to perform an initial health check when registering a connection */
  performInitialHealthCheck: boolean;
  /** Maximum number of concurrent health checks */
  healthCheckConcurrency: number;
  /** Threshold in milliseconds for slow query detection */
  slowQueryThresholdMs: number;
  /** Interval in milliseconds for checking recovering connections */
  recoveryCheckIntervalMs: number;
  /** Whether to simulate occasional failures (for testing) */
  simulateFailures: boolean;
}

/**
 * Default connection health options
 */
export const DEFAULT_CONNECTION_HEALTH_OPTIONS: ConnectionHealthOptions = {
  maxHistorySize: 100,
  performInitialHealthCheck: true,
  healthCheckConcurrency: 5,
  slowQueryThresholdMs: 1000,
  recoveryCheckIntervalMs: 5000,
  simulateFailures: false,
};
import { DatabaseException } from '../errors/database-error.exception';

/**
 * Health check history entry for tracking health check results over time
 */
interface HealthCheckHistoryEntry {
  /** Timestamp when the health check was performed */
  timestamp: Date;
  /** Result of the health check */
  result: HealthCheckResult;
  /** Duration of the health check in milliseconds */
  durationMs: number;
  /** Error that occurred during the health check, if any */
  error?: ConnectionError;
}

/**
 * Performance history entry for tracking query performance over time
 */
interface PerformanceHistoryEntry {
  /** Timestamp when the performance measurement was taken */
  timestamp: Date;
  /** Response time in milliseconds */
  responseTimeMs: number;
  /** Type of operation that was measured */
  operationType: 'query' | 'transaction' | 'healthCheck';
  /** Query complexity estimate (higher values indicate more complex queries) */
  complexity?: number;
}

/**
 * Connection health state for a specific connection
 */
interface ConnectionHealthState {
  /** Unique identifier for the connection */
  connectionId: string;
  /** Type of database connection */
  connectionType: DatabaseConnectionType;
  /** Current health status of the connection */
  status: HealthStatus;
  /** Timestamp when the connection was created */
  createdAt: Date;
  /** Timestamp when the connection was last used */
  lastUsedAt?: Date;
  /** Timestamp when the connection was last checked for health */
  lastCheckedAt?: Date;
  /** Number of consecutive failed health checks */
  consecutiveFailures: number;
  /** Number of consecutive successful health checks */
  consecutiveSuccesses: number;
  /** Whether the connection is currently in recovery mode */
  inRecovery: boolean;
  /** Timestamp when recovery mode was entered, if applicable */
  recoveryStartedAt?: Date;
  /** Recent health check history (limited to a configurable size) */
  healthCheckHistory: HealthCheckHistoryEntry[];
  /** Recent performance history (limited to a configurable size) */
  performanceHistory: PerformanceHistoryEntry[];
  /** Current performance metrics */
  performanceMetrics: PerformanceMetrics;
  /** Journey ID associated with this connection, if any */
  journeyId?: string;
  /** Additional metadata for the connection */
  metadata?: Record<string, any>;
}

/**
 * Monitors and reports on database connection health metrics.
 * Provides methods for checking connection liveness, measuring query response times,
 * detecting slow connections, and reporting connection statistics.
 */
@Injectable()
export class ConnectionHealth implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectionHealth.name);
  private readonly healthStates = new Map<string, ConnectionHealthState>();
  private readonly config: HealthCheckConfig;
  private readonly options: ConnectionHealthOptions;
  private healthCheckInterval?: NodeJS.Timeout;
  private isShuttingDown = false;

  /**
   * Creates a new ConnectionHealth instance
   * @param connectionConfig Database connection configuration
   * @param connectionRetry Connection retry service for handling recovery
   * @param eventEmitter Optional event emitter for publishing health events
   * @param tracingService Optional tracing service for performance tracking
   * @param options Additional options for health monitoring
   */
  constructor(
    private readonly connectionConfig: ConnectionConfig,
    private readonly connectionRetry: ConnectionRetry,
    private readonly eventEmitter?: ConnectionEventEmitter,
    private readonly tracingService?: TracingService,
    options?: Partial<ConnectionHealthOptions>,
  ) {
    this.config = connectionConfig.healthCheck || DEFAULT_HEALTH_CHECK_CONFIG;
    this.options = { ...DEFAULT_CONNECTION_HEALTH_OPTIONS, ...options };
  }

  /**
   * Initializes the health monitoring system when the module is created
   */
  onModuleInit(): void {
    if (this.config.intervalMs > 0) {
      this.startHealthChecks();
      this.logger.log(
        `Started database connection health monitoring (interval: ${this.config.intervalMs}ms)`
      );
    } else {
      this.logger.log('Database connection health monitoring is disabled');
    }
  }

  /**
   * Cleans up resources when the module is destroyed
   */
  onModuleDestroy(): void {
    this.isShuttingDown = true;
    this.stopHealthChecks();
    this.logger.log('Stopped database connection health monitoring');
  }

  /**
   * Starts the periodic health check process
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(
      () => this.performScheduledHealthChecks(),
      this.config.intervalMs
    );
  }

  /**
   * Stops the periodic health check process
   */
  private stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Performs health checks on all registered connections
   */
  private async performScheduledHealthChecks(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    const connectionIds = Array.from(this.healthStates.keys());
    if (connectionIds.length === 0) {
      return;
    }

    this.logger.debug(`Performing scheduled health checks on ${connectionIds.length} connections`);

    // Create a span for the health check batch if tracing is available
    let batchSpan: Span | undefined;
    if (this.tracingService) {
      batchSpan = this.tracingService.startSpan('database.health.checkBatch', {
        attributes: {
          'db.connection_count': connectionIds.length,
        },
      });
    }

    try {
      // Perform health checks in parallel with a concurrency limit
      const concurrencyLimit = this.options.healthCheckConcurrency;
      const batches = this.chunkArray(connectionIds, concurrencyLimit);

      for (const batch of batches) {
        await Promise.all(
          batch.map(connectionId => this.checkConnectionHealth(connectionId))
        );
      }

      if (batchSpan) {
        batchSpan.end();
      }
    } catch (error) {
      this.logger.error('Error during scheduled health checks', error);
      if (batchSpan) {
        batchSpan.recordException(error instanceof Error ? error : new Error(String(error)));
        batchSpan.end();
      }
    }
  }

  /**
   * Splits an array into chunks of a specified size
   * @param array Array to split
   * @param chunkSize Maximum size of each chunk
   * @returns Array of chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Registers a new connection for health monitoring
   * @param connectionId Unique identifier for the connection
   * @param connectionType Type of database connection
   * @param journeyId Optional journey ID associated with this connection
   * @param metadata Additional metadata for the connection
   */
  public registerConnection(
    connectionId: string,
    connectionType: DatabaseConnectionType,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    if (this.healthStates.has(connectionId)) {
      this.logger.warn(`Connection ${connectionId} is already registered for health monitoring`);
      return;
    }

    const healthState: ConnectionHealthState = {
      connectionId,
      connectionType,
      status: HealthStatus.UNKNOWN,
      createdAt: new Date(),
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      inRecovery: false,
      healthCheckHistory: [],
      performanceHistory: [],
      performanceMetrics: {
        averageResponseTimeMs: 0,
        minResponseTimeMs: 0,
        maxResponseTimeMs: 0,
        responseTimeTrend: 'stable',
        lastMeasuredAt: new Date(),
      },
      journeyId,
      metadata,
    };

    this.healthStates.set(connectionId, healthState);
    this.logger.debug(`Registered connection ${connectionId} (${connectionType}) for health monitoring`);

    // Perform an initial health check
    if (this.options.performInitialHealthCheck) {
      // Use setTimeout to avoid blocking the registration process
      setTimeout(() => this.checkConnectionHealth(connectionId), 0);
    }
  }

  /**
   * Unregisters a connection from health monitoring
   * @param connectionId Unique identifier for the connection
   */
  public unregisterConnection(connectionId: string): void {
    if (!this.healthStates.has(connectionId)) {
      this.logger.warn(`Connection ${connectionId} is not registered for health monitoring`);
      return;
    }

    this.healthStates.delete(connectionId);
    this.logger.debug(`Unregistered connection ${connectionId} from health monitoring`);
  }

  /**
   * Checks the health of a specific connection
   * @param connectionId Unique identifier for the connection
   * @param healthCheckFn Optional custom health check function
   * @returns Health check result
   */
  public async checkConnectionHealth(
    connectionId: string,
    healthCheckFn?: () => Promise<boolean>,
  ): Promise<HealthCheckResult> {
    const state = this.healthStates.get(connectionId);
    if (!state) {
      throw new Error(`Connection ${connectionId} is not registered for health monitoring`);
    }

    // Create a span for the health check if tracing is available
    let span: Span | undefined;
    if (this.tracingService) {
      span = this.tracingService.startSpan('database.health.check', {
        attributes: {
          'db.connection_id': connectionId,
          'db.connection_type': state.connectionType,
          'db.journey_id': state.journeyId || 'none',
        },
      });
    }

    const startTime = Date.now();
    let isHealthy = false;
    let error: ConnectionError | undefined;

    try {
      // Use the provided health check function or the default one
      if (healthCheckFn) {
        isHealthy = await healthCheckFn();
      } else {
        isHealthy = await this.performDefaultHealthCheck(connectionId, state.connectionType);
      }
    } catch (err) {
      // Convert error to ConnectionError
      error = this.createConnectionError(err, state.connectionType);
      isHealthy = false;

      if (span) {
        span.recordException(error.originalError || new Error(error.message));
      }
    } finally {
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      // Update performance metrics
      this.recordPerformanceMetrics(connectionId, durationMs, 'healthCheck');

      // Update health state based on the result
      const result = this.updateHealthState(connectionId, isHealthy, durationMs, error);

      if (span) {
        span.setAttribute('db.health_status', result.status);
        span.setAttribute('db.health_check_duration_ms', durationMs);
        span.end();
      }

      return result;
    }
  }

  /**
   * Performs the default health check for a connection
   * @param connectionId Unique identifier for the connection
   * @param connectionType Type of database connection
   * @returns Whether the connection is healthy
   */
  private async performDefaultHealthCheck(
    connectionId: string,
    connectionType: DatabaseConnectionType,
  ): Promise<boolean> {
    // This is a placeholder for the actual health check implementation
    // In a real implementation, this would execute a simple query against the database
    // to verify that the connection is working properly

    // For PostgreSQL and TimescaleDB, a simple "SELECT 1" query would be appropriate
    // For Redis, a PING command would be used
    // For S3, a HEAD request to a known object or bucket would be used

    // Since we don't have direct access to the connection here, we'll simulate a health check
    // In a real implementation, this would be replaced with actual database queries

    // Check if the connection is in a failed state according to the retry service
    const isCircuitOpen = this.connectionRetry.isCircuitOpen(connectionId);
    if (isCircuitOpen) {
      throw new Error(`Circuit breaker is open for connection ${connectionId}`);
    }

    // Simulate a health check based on connection type
    switch (connectionType) {
      case DatabaseConnectionType.POSTGRES:
      case DatabaseConnectionType.TIMESCALE:
        // Simulate a PostgreSQL health check
        return this.simulatePostgresHealthCheck(connectionId);
      case DatabaseConnectionType.REDIS:
        // Simulate a Redis health check
        return this.simulateRedisHealthCheck(connectionId);
      case DatabaseConnectionType.S3:
        // Simulate an S3 health check
        return this.simulateS3HealthCheck(connectionId);
      default:
        // Default health check for unknown connection types
        return true;
    }
  }

  /**
   * Simulates a PostgreSQL health check
   * @param connectionId Unique identifier for the connection
   * @returns Whether the connection is healthy
   */
  private async simulatePostgresHealthCheck(connectionId: string): Promise<boolean> {
    // In a real implementation, this would execute a "SELECT 1" query
    // For simulation purposes, we'll use the connection's health state
    const state = this.healthStates.get(connectionId);
    if (!state) {
      return false;
    }

    // Simulate occasional failures for testing
    if (this.options.simulateFailures && Math.random() < 0.05) {
      throw new Error('Simulated PostgreSQL connection failure');
    }

    return true;
  }

  /**
   * Simulates a Redis health check
   * @param connectionId Unique identifier for the connection
   * @returns Whether the connection is healthy
   */
  private async simulateRedisHealthCheck(connectionId: string): Promise<boolean> {
    // In a real implementation, this would execute a PING command
    // For simulation purposes, we'll use the connection's health state
    const state = this.healthStates.get(connectionId);
    if (!state) {
      return false;
    }

    // Simulate occasional failures for testing
    if (this.options.simulateFailures && Math.random() < 0.05) {
      throw new Error('Simulated Redis connection failure');
    }

    return true;
  }

  /**
   * Simulates an S3 health check
   * @param connectionId Unique identifier for the connection
   * @returns Whether the connection is healthy
   */
  private async simulateS3HealthCheck(connectionId: string): Promise<boolean> {
    // In a real implementation, this would execute a HEAD request
    // For simulation purposes, we'll use the connection's health state
    const state = this.healthStates.get(connectionId);
    if (!state) {
      return false;
    }

    // Simulate occasional failures for testing
    if (this.options.simulateFailures && Math.random() < 0.05) {
      throw new Error('Simulated S3 connection failure');
    }

    return true;
  }

  /**
   * Updates the health state of a connection based on a health check result
   * @param connectionId Unique identifier for the connection
   * @param isHealthy Whether the connection is healthy
   * @param durationMs Duration of the health check in milliseconds
   * @param error Error that occurred during the health check, if any
   * @returns Updated health check result
   */
  private updateHealthState(
    connectionId: string,
    isHealthy: boolean,
    durationMs: number,
    error?: ConnectionError,
  ): HealthCheckResult {
    const state = this.healthStates.get(connectionId);
    if (!state) {
      throw new Error(`Connection ${connectionId} is not registered for health monitoring`);
    }

    // Update last checked timestamp
    state.lastCheckedAt = new Date();

    // Update consecutive success/failure counters
    if (isHealthy) {
      state.consecutiveSuccesses += 1;
      state.consecutiveFailures = 0;
    } else {
      state.consecutiveFailures += 1;
      state.consecutiveSuccesses = 0;
    }

    // Determine the new health status
    let newStatus: HealthStatus;
    if (isHealthy) {
      if (state.consecutiveSuccesses >= this.config.successThreshold) {
        newStatus = HealthStatus.HEALTHY;
      } else if (state.status === HealthStatus.UNHEALTHY) {
        newStatus = HealthStatus.RECOVERING;
      } else {
        newStatus = state.status;
      }
    } else {
      if (state.consecutiveFailures >= this.config.failureThreshold) {
        newStatus = HealthStatus.UNHEALTHY;
      } else if (state.status === HealthStatus.HEALTHY) {
        newStatus = HealthStatus.DEGRADED;
      } else {
        newStatus = state.status;
      }
    }

    // Check if we need to enter or exit recovery mode
    if (newStatus === HealthStatus.UNHEALTHY && !state.inRecovery && this.config.autoRecover) {
      state.inRecovery = true;
      state.recoveryStartedAt = new Date();
      this.logger.warn(
        `Connection ${connectionId} is unhealthy, entering recovery mode`
      );
      this.initiateRecovery(connectionId, error);
    } else if (newStatus === HealthStatus.HEALTHY && state.inRecovery) {
      state.inRecovery = false;
      state.recoveryStartedAt = undefined;
      this.logger.log(
        `Connection ${connectionId} has recovered and is now healthy`
      );
    }

    // Create health check history entry
    const historyEntry: HealthCheckHistoryEntry = {
      timestamp: new Date(),
      result: {
        connectionId,
        status: newStatus,
        responseTimeMs: durationMs,
        consecutiveFailures: state.consecutiveFailures,
        consecutiveSuccesses: state.consecutiveSuccesses,
        lastCheckedAt: state.lastCheckedAt,
        error,
      },
      durationMs,
      error,
    };

    // Add to history, limiting the size
    state.healthCheckHistory.unshift(historyEntry);
    if (state.healthCheckHistory.length > this.options.maxHistorySize) {
      state.healthCheckHistory.pop();
    }

    // Update the status
    const previousStatus = state.status;
    state.status = newStatus;

    // Emit health status change event if the status changed
    if (previousStatus !== newStatus && this.eventEmitter) {
      this.eventEmitter.emit({
        type: ConnectionEventType.HEALTH_STATUS_CHANGED,
        connectionId,
        journeyId: state.journeyId,
        timestamp: new Date(),
        data: {
          previousStatus,
          newStatus,
          consecutiveFailures: state.consecutiveFailures,
          consecutiveSuccesses: state.consecutiveSuccesses,
          responseTimeMs: durationMs,
        },
        error,
      });
    }

    // Return the health check result
    return historyEntry.result;
  }

  /**
   * Initiates recovery for an unhealthy connection
   * @param connectionId Unique identifier for the connection
   * @param error Error that caused the connection to become unhealthy
   */
  private initiateRecovery(connectionId: string, error?: ConnectionError): void {
    const state = this.healthStates.get(connectionId);
    if (!state) {
      return;
    }

    // Log the recovery attempt
    this.logger.warn(
      `Initiating recovery for connection ${connectionId} (${state.connectionType})`,
      error?.message
    );

    // Emit recovery event
    if (this.eventEmitter) {
      this.eventEmitter.emit({
        type: ConnectionEventType.RECOVERY_INITIATED,
        connectionId,
        journeyId: state.journeyId,
        timestamp: new Date(),
        data: {
          connectionType: state.connectionType,
          consecutiveFailures: state.consecutiveFailures,
        },
        error,
      });
    }

    // In a real implementation, this would attempt to recover the connection
    // by closing and reopening it, or by other means appropriate for the connection type

    // For now, we'll just close the circuit breaker to allow retry attempts
    this.connectionRetry.closeCircuit(connectionId);

    // Schedule a follow-up health check
    setTimeout(
      () => this.checkConnectionHealth(connectionId),
      this.options.recoveryCheckIntervalMs
    );
  }

  /**
   * Records performance metrics for a database operation
   * @param connectionId Unique identifier for the connection
   * @param responseTimeMs Response time in milliseconds
   * @param operationType Type of operation that was measured
   * @param complexity Optional query complexity estimate
   */
  public recordPerformanceMetrics(
    connectionId: string,
    responseTimeMs: number,
    operationType: 'query' | 'transaction' | 'healthCheck',
    complexity?: number,
  ): void {
    const state = this.healthStates.get(connectionId);
    if (!state) {
      return;
    }

    // Create performance history entry
    const historyEntry: PerformanceHistoryEntry = {
      timestamp: new Date(),
      responseTimeMs,
      operationType,
      complexity,
    };

    // Add to history, limiting the size
    state.performanceHistory.unshift(historyEntry);
    if (state.performanceHistory.length > this.options.maxHistorySize) {
      state.performanceHistory.pop();
    }

    // Update performance metrics
    this.updatePerformanceMetrics(connectionId);

    // Check for slow queries
    this.checkForSlowQueries(connectionId, responseTimeMs, operationType, complexity);
  }

  /**
   * Updates performance metrics based on recent history
   * @param connectionId Unique identifier for the connection
   */
  private updatePerformanceMetrics(connectionId: string): void {
    const state = this.healthStates.get(connectionId);
    if (!state || state.performanceHistory.length === 0) {
      return;
    }

    // Calculate average, min, and max response times
    const responseTimesMs = state.performanceHistory.map(entry => entry.responseTimeMs);
    const averageResponseTimeMs = responseTimesMs.reduce((sum, time) => sum + time, 0) / responseTimesMs.length;
    const minResponseTimeMs = Math.min(...responseTimesMs);
    const maxResponseTimeMs = Math.max(...responseTimesMs);

    // Determine response time trend
    let responseTimeTrend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (state.performanceHistory.length >= 5) {
      // Calculate average of first half vs second half of history
      const midpoint = Math.floor(state.performanceHistory.length / 2);
      const recentEntries = state.performanceHistory.slice(0, midpoint);
      const olderEntries = state.performanceHistory.slice(midpoint);

      const recentAvg = recentEntries.reduce((sum, entry) => sum + entry.responseTimeMs, 0) / recentEntries.length;
      const olderAvg = olderEntries.reduce((sum, entry) => sum + entry.responseTimeMs, 0) / olderEntries.length;

      // Determine trend based on percentage change
      const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;
      if (percentChange < -10) {
        responseTimeTrend = 'improving';
      } else if (percentChange > 10) {
        responseTimeTrend = 'degrading';
      }
    }

    // Update metrics
    state.performanceMetrics = {
      averageResponseTimeMs,
      minResponseTimeMs,
      maxResponseTimeMs,
      responseTimeTrend,
      lastMeasuredAt: new Date(),
    };
  }

  /**
   * Checks for slow queries and emits warnings if necessary
   * @param connectionId Unique identifier for the connection
   * @param responseTimeMs Response time in milliseconds
   * @param operationType Type of operation that was measured
   * @param complexity Optional query complexity estimate
   */
  private checkForSlowQueries(
    connectionId: string,
    responseTimeMs: number,
    operationType: 'query' | 'transaction' | 'healthCheck',
    complexity?: number,
  ): void {
    const state = this.healthStates.get(connectionId);
    if (!state) {
      return;
    }

    // Determine slow query threshold based on operation type and complexity
    let slowThresholdMs = this.options.slowQueryThresholdMs;

    // Adjust threshold based on operation type
    switch (operationType) {
      case 'transaction':
        // Transactions are expected to take longer
        slowThresholdMs *= 2;
        break;
      case 'healthCheck':
        // Health checks should be fast
        slowThresholdMs /= 2;
        break;
    }

    // Adjust threshold based on complexity if provided
    if (complexity !== undefined && complexity > 1) {
      // Allow more time for complex queries
      slowThresholdMs *= Math.min(complexity, 5);
    }

    // Check if this operation exceeds the threshold
    if (responseTimeMs > slowThresholdMs) {
      // Log warning about slow operation
      this.logger.warn(
        `Slow ${operationType} detected on connection ${connectionId}: ${responseTimeMs}ms ` +
        `(threshold: ${slowThresholdMs}ms, complexity: ${complexity || 'unknown'})`
      );

      // Emit slow query event
      if (this.eventEmitter) {
        this.eventEmitter.emit({
          type: ConnectionEventType.SLOW_OPERATION,
          connectionId,
          journeyId: state.journeyId,
          timestamp: new Date(),
          data: {
            operationType,
            responseTimeMs,
            thresholdMs: slowThresholdMs,
            complexity,
            connectionType: state.connectionType,
          },
        });
      }

      // If this is significantly slower than normal, consider it a performance degradation
      if (responseTimeMs > state.performanceMetrics.averageResponseTimeMs * 3) {
        // Update status to degraded if currently healthy
        if (state.status === HealthStatus.HEALTHY) {
          state.status = HealthStatus.DEGRADED;

          // Emit health status change event
          if (this.eventEmitter) {
            this.eventEmitter.emit({
              type: ConnectionEventType.HEALTH_STATUS_CHANGED,
              connectionId,
              journeyId: state.journeyId,
              timestamp: new Date(),
              data: {
                previousStatus: HealthStatus.HEALTHY,
                newStatus: HealthStatus.DEGRADED,
                reason: 'Performance degradation detected',
                responseTimeMs,
                averageResponseTimeMs: state.performanceMetrics.averageResponseTimeMs,
              },
            });
          }
        }
      }
    }
  }

  /**
   * Creates a ConnectionError from any error
   * @param error Error to convert
   * @param connectionType Type of database connection
   * @returns ConnectionError instance
   */
  private createConnectionError(error: any, connectionType: DatabaseConnectionType): ConnectionError {
    if (error && 'category' in error && 'isRetryable' in error) {
      return error as ConnectionError;
    }

    // Determine error category based on error message and type
    let category = ConnectionErrorCategory.UNKNOWN;
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

    // Create a connection error
    return {
      category,
      originalError: error instanceof Error ? error : new Error(errorMessage),
      message: errorMessage,
      isRetryable: category === ConnectionErrorCategory.NETWORK || 
                  category === ConnectionErrorCategory.TIMEOUT ||
                  category === ConnectionErrorCategory.RESOURCE_LIMIT ||
                  category === ConnectionErrorCategory.UNKNOWN,
      timestamp: new Date(),
      connectionType,
    };
  }

  /**
   * Gets the current health status of a connection
   * @param connectionId Unique identifier for the connection
   * @returns Current health status or undefined if not found
   */
  public getConnectionStatus(connectionId: string): HealthStatus | undefined {
    return this.healthStates.get(connectionId)?.status;
  }

  /**
   * Gets detailed health information for a connection
   * @param connectionId Unique identifier for the connection
   * @returns Detailed health information or undefined if not found
   */
  public getConnectionHealth(connectionId: string): HealthCheckResult | undefined {
    const state = this.healthStates.get(connectionId);
    if (!state) {
      return undefined;
    }

    return {
      connectionId,
      status: state.status,
      responseTimeMs: state.performanceMetrics.averageResponseTimeMs,
      consecutiveFailures: state.consecutiveFailures,
      consecutiveSuccesses: state.consecutiveSuccesses,
      lastCheckedAt: state.lastCheckedAt,
      error: state.healthCheckHistory[0]?.error,
    };
  }

  /**
   * Gets performance metrics for a connection
   * @param connectionId Unique identifier for the connection
   * @returns Performance metrics or undefined if not found
   */
  public getConnectionPerformance(connectionId: string): PerformanceMetrics | undefined {
    return this.healthStates.get(connectionId)?.performanceMetrics;
  }

  /**
   * Gets comprehensive statistics for a connection
   * @param connectionId Unique identifier for the connection
   * @returns Connection statistics or undefined if not found
   */
  public getConnectionStatistics(connectionId: string): ConnectionStatistics | undefined {
    const state = this.healthStates.get(connectionId);
    if (!state) {
      return undefined;
    }

    // Calculate uptime percentage based on health check history
    let uptimePercentage = 100;
    if (state.healthCheckHistory.length > 0) {
      const healthyChecks = state.healthCheckHistory.filter(
        entry => entry.result.status === HealthStatus.HEALTHY
      ).length;
      uptimePercentage = (healthyChecks / state.healthCheckHistory.length) * 100;
    }

    // Calculate average response time trend
    const responseTimeTrend = this.calculateResponseTimeTrend(state.performanceHistory);

    return {
      connectionId,
      connectionType: state.connectionType,
      status: state.status,
      createdAt: state.createdAt,
      lastUsedAt: state.lastUsedAt,
      lastCheckedAt: state.lastCheckedAt,
      uptimePercentage,
      performanceMetrics: state.performanceMetrics,
      responseTimeTrend,
      healthCheckCount: state.healthCheckHistory.length,
      failureCount: state.healthCheckHistory.filter(entry => !entry.result.status).length,
      inRecovery: state.inRecovery,
      recoveryStartedAt: state.recoveryStartedAt,
      journeyId: state.journeyId,
    };
  }

  /**
   * Calculates response time trend from performance history
   * @param history Performance history entries
   * @returns Array of [timestamp, responseTimeMs] pairs for trend analysis
   */
  private calculateResponseTimeTrend(history: PerformanceHistoryEntry[]): [number, number][] {
    // Sort history by timestamp
    const sortedHistory = [...history].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Convert to [timestamp, responseTimeMs] pairs
    return sortedHistory.map(entry => [entry.timestamp.getTime(), entry.responseTimeMs]);
  }

  /**
   * Gets health statistics for all connections
   * @returns Health statistics by connection ID
   */
  public getAllConnectionStatistics(): Record<string, ConnectionStatistics> {
    const statistics: Record<string, ConnectionStatistics> = {};

    for (const [connectionId, state] of this.healthStates.entries()) {
      const stats = this.getConnectionStatistics(connectionId);
      if (stats) {
        statistics[connectionId] = stats;
      }
    }

    return statistics;
  }

  /**
   * Gets a summary of connection health across all connections
   * @returns Summary of connection health
   */
  public getHealthSummary(): {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
    recovering: number;
    byConnectionType: Record<DatabaseConnectionType, number>;
    byJourney: Record<string, number>;
  } {
    const summary = {
      total: this.healthStates.size,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      unknown: 0,
      recovering: 0,
      byConnectionType: {} as Record<DatabaseConnectionType, number>,
      byJourney: {} as Record<string, number>,
    };

    // Initialize connection type counters
    Object.values(DatabaseConnectionType).forEach(type => {
      summary.byConnectionType[type] = 0;
    });

    // Count connections by status and type
    for (const state of this.healthStates.values()) {
      switch (state.status) {
        case HealthStatus.HEALTHY:
          summary.healthy++;
          break;
        case HealthStatus.DEGRADED:
          summary.degraded++;
          break;
        case HealthStatus.UNHEALTHY:
          summary.unhealthy++;
          break;
        case HealthStatus.UNKNOWN:
          summary.unknown++;
          break;
        case HealthStatus.RECOVERING:
          summary.recovering++;
          break;
      }

      // Count by connection type
      summary.byConnectionType[state.connectionType] = 
        (summary.byConnectionType[state.connectionType] || 0) + 1;

      // Count by journey
      if (state.journeyId) {
        summary.byJourney[state.journeyId] = 
          (summary.byJourney[state.journeyId] || 0) + 1;
      }
    }

    return summary;
  }

  /**
   * Updates the last used timestamp for a connection
   * @param connectionId Unique identifier for the connection
   */
  public markConnectionUsed(connectionId: string): void {
    const state = this.healthStates.get(connectionId);
    if (state) {
      state.lastUsedAt = new Date();
    }
  }

  /**
   * Manually sets the health status of a connection
   * @param connectionId Unique identifier for the connection
   * @param status New health status
   * @param reason Reason for the status change
   */
  public setConnectionStatus(
    connectionId: string,
    status: HealthStatus,
    reason: string,
  ): void {
    const state = this.healthStates.get(connectionId);
    if (!state) {
      throw new Error(`Connection ${connectionId} is not registered for health monitoring`);
    }

    const previousStatus = state.status;
    state.status = status;

    // Log the status change
    this.logger.log(
      `Manually set connection ${connectionId} status to ${status} (was ${previousStatus}): ${reason}`
    );

    // Emit health status change event
    if (this.eventEmitter) {
      this.eventEmitter.emit({
        type: ConnectionEventType.HEALTH_STATUS_CHANGED,
        connectionId,
        journeyId: state.journeyId,
        timestamp: new Date(),
        data: {
          previousStatus,
          newStatus: status,
          reason,
          isManual: true,
        },
      });
    }

    // If setting to unhealthy, initiate recovery if auto-recover is enabled
    if (status === HealthStatus.UNHEALTHY && this.config.autoRecover && !state.inRecovery) {
      state.inRecovery = true;
      state.recoveryStartedAt = new Date();
      this.initiateRecovery(connectionId);
    }
  }

  /**
   * Manually initiates recovery for a connection
   * @param connectionId Unique identifier for the connection
   * @param force Whether to force recovery even if the connection is not unhealthy
   */
  public initiateManualRecovery(connectionId: string, force: boolean = false): void {
    const state = this.healthStates.get(connectionId);
    if (!state) {
      throw new Error(`Connection ${connectionId} is not registered for health monitoring`);
    }

    if (state.status !== HealthStatus.UNHEALTHY && !force) {
      throw new Error(
        `Connection ${connectionId} is not unhealthy (status: ${state.status}). ` +
        `Use force=true to initiate recovery anyway.`
      );
    }

    state.inRecovery = true;
    state.recoveryStartedAt = new Date();
    state.status = HealthStatus.RECOVERING;

    this.logger.log(`Manually initiated recovery for connection ${connectionId}`);

    // Emit recovery event
    if (this.eventEmitter) {
      this.eventEmitter.emit({
        type: ConnectionEventType.RECOVERY_INITIATED,
        connectionId,
        journeyId: state.journeyId,
        timestamp: new Date(),
        data: {
          connectionType: state.connectionType,
          isManual: true,
          force,
        },
      });
    }

    this.initiateRecovery(connectionId);
  }

  /**
   * Clears all health state data
   */
  public clearAllHealthStates(): void {
    this.healthStates.clear();
    this.logger.debug('Cleared all connection health states');
  }

  /**
   * Throws a DatabaseException if a connection is unhealthy
   * @param connectionId Unique identifier for the connection
   * @throws DatabaseException if the connection is unhealthy
   */
  public throwIfUnhealthy(connectionId: string): void {
    const state = this.healthStates.get(connectionId);
    if (!state) {
      return; // No health data available, assume healthy
    }

    if (state.status === HealthStatus.UNHEALTHY) {
      const lastError = state.healthCheckHistory[0]?.error;
      throw new DatabaseException(
        `Database connection ${connectionId} is unhealthy`,
        {
          connectionId,
          status: state.status,
          lastCheckedAt: state.lastCheckedAt,
          consecutiveFailures: state.consecutiveFailures,
          originalError: lastError?.originalError,
        }
      );
    }
  }
}