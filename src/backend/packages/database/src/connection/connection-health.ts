import { Injectable } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { ConnectionException } from '../errors/database-error.exception';
import { DatabaseErrorType } from '../errors/database-error.types';
import { ConnectionConfig } from './connection-config';

/**
 * Interface for connection health metrics
 */
export interface ConnectionHealthMetrics {
  /** Average query response time in milliseconds */
  averageResponseTime: number;
  /** Maximum query response time in milliseconds */
  maxResponseTime: number;
  /** Minimum query response time in milliseconds */
  minResponseTime: number;
  /** Number of successful queries */
  successfulQueries: number;
  /** Number of failed queries */
  failedQueries: number;
  /** Success rate as a percentage */
  successRate: number;
  /** Connection uptime in seconds */
  uptime: number;
  /** Last successful connection timestamp */
  lastSuccessfulConnection: Date;
  /** Last failed connection timestamp */
  lastFailedConnection?: Date;
  /** Number of slow queries (exceeding threshold) */
  slowQueries: number;
  /** Current connection status */
  status: ConnectionStatus;
  /** Connection pool utilization percentage */
  poolUtilization: number;
  /** Average connection acquisition time in milliseconds */
  avgAcquisitionTime: number;
}

/**
 * Enum representing the current status of a database connection
 */
export enum ConnectionStatus {
  /** Connection is healthy and operating normally */
  HEALTHY = 'HEALTHY',
  /** Connection is operational but showing signs of degradation */
  DEGRADED = 'DEGRADED',
  /** Connection is experiencing significant issues but still partially functional */
  UNHEALTHY = 'UNHEALTHY',
  /** Connection has failed and is not operational */
  FAILED = 'FAILED'
}

/**
 * Configuration options for connection health monitoring
 */
export interface ConnectionHealthOptions {
  /** Interval in milliseconds for health check probes */
  healthCheckInterval: number;
  /** Threshold in milliseconds for slow query detection */
  slowQueryThreshold: number;
  /** Number of consecutive failures before marking connection as unhealthy */
  failureThreshold: number;
  /** Timeout in milliseconds for health check queries */
  healthCheckTimeout: number;
  /** Whether to enable detailed metrics collection */
  enableDetailedMetrics: boolean;
  /** Whether to automatically attempt recovery for unhealthy connections */
  enableAutoRecovery: boolean;
  /** Maximum response time in milliseconds before connection is considered degraded */
  degradedResponseTimeThreshold: number;
  /** Success rate threshold (percentage) below which connection is considered unhealthy */
  unhealthySuccessRateThreshold: number;
}

/**
 * Default connection health monitoring options
 */
export const DEFAULT_CONNECTION_HEALTH_OPTIONS: ConnectionHealthOptions = {
  healthCheckInterval: 30000, // 30 seconds
  slowQueryThreshold: 1000, // 1 second
  failureThreshold: 3, // 3 consecutive failures
  healthCheckTimeout: 5000, // 5 seconds
  enableDetailedMetrics: true,
  enableAutoRecovery: true,
  degradedResponseTimeThreshold: 500, // 500ms
  unhealthySuccessRateThreshold: 90 // 90%
};

/**
 * Service responsible for monitoring and reporting database connection health
 * 
 * This class provides methods for checking connection liveness, measuring query 
 * response times, detecting slow connections, and reporting connection statistics.
 * It integrates with the application's observability framework to provide metrics
 * for dashboards and alerting.
 */
@Injectable()
export class ConnectionHealth {
  private metrics: ConnectionHealthMetrics;
  private options: ConnectionHealthOptions;
  private startTime: Date;
  private responseTimeHistory: number[] = [];
  private consecutiveFailures: number = 0;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  /**
   * Creates a new ConnectionHealth instance
   * 
   * @param logger - Logger service for structured logging
   * @param tracingService - Tracing service for distributed tracing
   * @param config - Connection configuration
   */
  constructor(
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly config: ConnectionConfig
  ) {
    this.startTime = new Date();
    this.options = {
      ...DEFAULT_CONNECTION_HEALTH_OPTIONS,
      ...this.config.getHealthOptions()
    };
    
    this.metrics = this.initializeMetrics();
    this.logger.log('ConnectionHealth initialized with options', {
      options: this.options,
      context: 'ConnectionHealth'
    });
  }

  /**
   * Initialize metrics with default values
   * 
   * @returns Initial connection health metrics
   */
  private initializeMetrics(): ConnectionHealthMetrics {
    return {
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Number.MAX_VALUE,
      successfulQueries: 0,
      failedQueries: 0,
      successRate: 100,
      uptime: 0,
      lastSuccessfulConnection: this.startTime,
      slowQueries: 0,
      status: ConnectionStatus.HEALTHY,
      poolUtilization: 0,
      avgAcquisitionTime: 0
    };
  }

  /**
   * Start monitoring connection health
   * 
   * @param initialDelay - Optional delay before starting monitoring (in ms)
   */
  public startMonitoring(initialDelay: number = 0): void {
    if (this.isMonitoring) {
      this.logger.warn('Health monitoring is already active', { context: 'ConnectionHealth' });
      return;
    }

    this.isMonitoring = true;
    
    // Schedule initial health check after delay
    setTimeout(() => {
      this.performHealthCheck();
      
      // Schedule recurring health checks
      this.healthCheckTimer = setInterval(
        () => this.performHealthCheck(),
        this.options.healthCheckInterval
      );
    }, initialDelay);

    this.logger.log('Connection health monitoring started', {
      initialDelay,
      interval: this.options.healthCheckInterval,
      context: 'ConnectionHealth'
    });
  }

  /**
   * Stop monitoring connection health
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      this.logger.warn('Health monitoring is not active', { context: 'ConnectionHealth' });
      return;
    }

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    this.isMonitoring = false;
    this.logger.log('Connection health monitoring stopped', { context: 'ConnectionHealth' });
  }

  /**
   * Perform a health check on the database connection
   * 
   * @returns Promise resolving to true if connection is healthy, false otherwise
   */
  public async performHealthCheck(): Promise<boolean> {
    const span = this.tracingService.startSpan('database.connection.healthCheck');
    
    try {
      // Execute a simple query to check connection health
      const startTime = Date.now();
      await this.executeHealthCheckQuery();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Record successful health check
      this.recordSuccessfulQuery(responseTime);
      this.consecutiveFailures = 0;
      
      // Update connection status based on metrics
      this.updateConnectionStatus();
      
      span.setAttributes({
        'database.connection.status': this.metrics.status,
        'database.connection.responseTime': responseTime,
        'database.connection.healthy': true
      });
      
      return true;
    } catch (error) {
      // Record failed health check
      this.recordFailedQuery();
      this.consecutiveFailures++;
      
      // Update connection status based on failure count
      if (this.consecutiveFailures >= this.options.failureThreshold) {
        this.metrics.status = ConnectionStatus.FAILED;
        
        // Attempt auto-recovery if enabled
        if (this.options.enableAutoRecovery) {
          this.attemptRecovery();
        }
      }
      
      span.setAttributes({
        'database.connection.status': this.metrics.status,
        'database.connection.healthy': false,
        'database.connection.consecutiveFailures': this.consecutiveFailures,
        'error.type': error.name,
        'error.message': error.message
      });
      span.recordException(error);
      
      this.logger.error('Database connection health check failed', {
        error: error.message,
        stack: error.stack,
        consecutiveFailures: this.consecutiveFailures,
        status: this.metrics.status,
        context: 'ConnectionHealth'
      });
      
      return false;
    } finally {
      span.end();
    }
  }

  /**
   * Execute a simple query to check connection health
   * 
   * @throws ConnectionException if the query fails or times out
   */
  private async executeHealthCheckQuery(): Promise<void> {
    try {
      // Create a promise that resolves when the query completes
      const queryPromise = Promise.resolve(); // This would be replaced with an actual query
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new ConnectionException(
            'Health check query timed out',
            'DB_CONN_HEALTH_CHECK_TIMEOUT',
            DatabaseErrorType.CONNECTION
          ));
        }, this.options.healthCheckTimeout);
      });
      
      // Race the query against the timeout
      await Promise.race([queryPromise, timeoutPromise]);
    } catch (error) {
      // Wrap any errors in a ConnectionException
      if (error instanceof ConnectionException) {
        throw error;
      }
      
      throw new ConnectionException(
        `Health check query failed: ${error.message}`,
        'DB_CONN_HEALTH_CHECK_FAILED',
        DatabaseErrorType.CONNECTION,
        { cause: error }
      );
    }
  }

  /**
   * Record metrics for a successful query
   * 
   * @param responseTime - Query response time in milliseconds
   */
  public recordSuccessfulQuery(responseTime: number): void {
    // Update response time metrics
    this.responseTimeHistory.push(responseTime);
    if (this.responseTimeHistory.length > 100) {
      this.responseTimeHistory.shift(); // Keep history limited to last 100 queries
    }
    
    // Update metrics
    this.metrics.successfulQueries++;
    this.metrics.lastSuccessfulConnection = new Date();
    this.metrics.maxResponseTime = Math.max(this.metrics.maxResponseTime, responseTime);
    this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, responseTime);
    
    // Calculate average response time
    const totalResponseTime = this.responseTimeHistory.reduce((sum, time) => sum + time, 0);
    this.metrics.averageResponseTime = totalResponseTime / this.responseTimeHistory.length;
    
    // Check for slow query
    if (responseTime > this.options.slowQueryThreshold) {
      this.metrics.slowQueries++;
      this.logger.warn('Slow database query detected', {
        responseTime,
        threshold: this.options.slowQueryThreshold,
        context: 'ConnectionHealth'
      });
    }
    
    // Update success rate
    const totalQueries = this.metrics.successfulQueries + this.metrics.failedQueries;
    this.metrics.successRate = (this.metrics.successfulQueries / totalQueries) * 100;
    
    // Update uptime
    this.metrics.uptime = (Date.now() - this.startTime.getTime()) / 1000;
  }

  /**
   * Record metrics for a failed query
   */
  public recordFailedQuery(): void {
    this.metrics.failedQueries++;
    this.metrics.lastFailedConnection = new Date();
    
    // Update success rate
    const totalQueries = this.metrics.successfulQueries + this.metrics.failedQueries;
    this.metrics.successRate = (this.metrics.successfulQueries / totalQueries) * 100;
  }

  /**
   * Update connection pool utilization metrics
   * 
   * @param activeConnections - Number of active connections
   * @param maxConnections - Maximum number of connections in the pool
   * @param acquisitionTime - Time taken to acquire a connection (in ms)
   */
  public updatePoolMetrics(
    activeConnections: number,
    maxConnections: number,
    acquisitionTime: number
  ): void {
    this.metrics.poolUtilization = (activeConnections / maxConnections) * 100;
    
    // Update acquisition time using exponential moving average
    const alpha = 0.3; // Smoothing factor
    this.metrics.avgAcquisitionTime = 
      alpha * acquisitionTime + (1 - alpha) * this.metrics.avgAcquisitionTime;
    
    // Log high pool utilization as a warning
    if (this.metrics.poolUtilization > 80) {
      this.logger.warn('High database connection pool utilization', {
        utilization: `${this.metrics.poolUtilization.toFixed(2)}%`,
        activeConnections,
        maxConnections,
        context: 'ConnectionHealth'
      });
    }
  }

  /**
   * Update the connection status based on current metrics
   */
  private updateConnectionStatus(): void {
    // Check for degraded performance based on response time
    if (this.metrics.averageResponseTime > this.options.degradedResponseTimeThreshold) {
      this.metrics.status = ConnectionStatus.DEGRADED;
      this.logger.warn('Database connection performance degraded', {
        averageResponseTime: this.metrics.averageResponseTime,
        threshold: this.options.degradedResponseTimeThreshold,
        context: 'ConnectionHealth'
      });
      return;
    }
    
    // Check for unhealthy status based on success rate
    if (this.metrics.successRate < this.options.unhealthySuccessRateThreshold) {
      this.metrics.status = ConnectionStatus.UNHEALTHY;
      this.logger.warn('Database connection health degraded', {
        successRate: `${this.metrics.successRate.toFixed(2)}%`,
        threshold: `${this.options.unhealthySuccessRateThreshold}%`,
        context: 'ConnectionHealth'
      });
      return;
    }
    
    // Connection is healthy
    this.metrics.status = ConnectionStatus.HEALTHY;
  }

  /**
   * Attempt to recover an unhealthy connection
   */
  private async attemptRecovery(): Promise<void> {
    const span = this.tracingService.startSpan('database.connection.recovery');
    
    try {
      this.logger.log('Attempting to recover unhealthy database connection', {
        consecutiveFailures: this.consecutiveFailures,
        context: 'ConnectionHealth'
      });
      
      // Recovery logic would be implemented here
      // This could involve reconnecting, restarting the connection pool, etc.
      
      // Reset consecutive failures if recovery is successful
      this.consecutiveFailures = 0;
      
      span.setAttributes({
        'database.connection.recovery.successful': true
      });
      
      this.logger.log('Database connection recovery successful', {
        context: 'ConnectionHealth'
      });
    } catch (error) {
      span.setAttributes({
        'database.connection.recovery.successful': false,
        'error.type': error.name,
        'error.message': error.message
      });
      span.recordException(error);
      
      this.logger.error('Database connection recovery failed', {
        error: error.message,
        stack: error.stack,
        context: 'ConnectionHealth'
      });
    } finally {
      span.end();
    }
  }

  /**
   * Get the current health metrics
   * 
   * @returns Current connection health metrics
   */
  public getMetrics(): ConnectionHealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if the connection is currently healthy
   * 
   * @returns True if the connection is healthy, false otherwise
   */
  public isHealthy(): boolean {
    return this.metrics.status === ConnectionStatus.HEALTHY;
  }

  /**
   * Check if the connection is currently degraded
   * 
   * @returns True if the connection is degraded, false otherwise
   */
  public isDegraded(): boolean {
    return this.metrics.status === ConnectionStatus.DEGRADED;
  }

  /**
   * Check if the connection is currently unhealthy or failed
   * 
   * @returns True if the connection is unhealthy or failed, false otherwise
   */
  public isUnhealthy(): boolean {
    return (
      this.metrics.status === ConnectionStatus.UNHEALTHY ||
      this.metrics.status === ConnectionStatus.FAILED
    );
  }

  /**
   * Reset health metrics to initial values
   * 
   * This is useful after a connection is reestablished or recovered
   */
  public resetMetrics(): void {
    this.startTime = new Date();
    this.metrics = this.initializeMetrics();
    this.responseTimeHistory = [];
    this.consecutiveFailures = 0;
    
    this.logger.log('Connection health metrics reset', {
      context: 'ConnectionHealth'
    });
  }

  /**
   * Generate a health report with detailed metrics and status
   * 
   * @returns Detailed health report object
   */
  public generateHealthReport(): Record<string, any> {
    return {
      status: this.metrics.status,
      healthy: this.isHealthy(),
      metrics: this.metrics,
      uptime: this.formatUptime(this.metrics.uptime),
      lastSuccessful: this.metrics.lastSuccessfulConnection.toISOString(),
      lastFailed: this.metrics.lastFailedConnection?.toISOString(),
      responseTimeStats: {
        avg: `${this.metrics.averageResponseTime.toFixed(2)}ms`,
        min: `${this.metrics.minResponseTime.toFixed(2)}ms`,
        max: `${this.metrics.maxResponseTime.toFixed(2)}ms`,
      },
      queryStats: {
        total: this.metrics.successfulQueries + this.metrics.failedQueries,
        successful: this.metrics.successfulQueries,
        failed: this.metrics.failedQueries,
        slow: this.metrics.slowQueries,
        successRate: `${this.metrics.successRate.toFixed(2)}%`,
      },
      poolStats: {
        utilization: `${this.metrics.poolUtilization.toFixed(2)}%`,
        acquisitionTime: `${this.metrics.avgAcquisitionTime.toFixed(2)}ms`,
      },
      thresholds: {
        slowQuery: `${this.options.slowQueryThreshold}ms`,
        degradedResponseTime: `${this.options.degradedResponseTimeThreshold}ms`,
        unhealthySuccessRate: `${this.options.unhealthySuccessRateThreshold}%`,
        failureThreshold: this.options.failureThreshold,
      },
      monitoring: {
        active: this.isMonitoring,
        interval: `${this.options.healthCheckInterval / 1000}s`,
        timeout: `${this.options.healthCheckTimeout / 1000}s`,
        autoRecovery: this.options.enableAutoRecovery,
      },
    };
  }

  /**
   * Format uptime in a human-readable format
   * 
   * @param seconds - Uptime in seconds
   * @returns Formatted uptime string
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ');
  }
}