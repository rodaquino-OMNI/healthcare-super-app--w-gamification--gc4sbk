/**
 * Circuit Breaker Middleware for Database Operations
 * 
 * This middleware implements the circuit breaker pattern for database operations to prevent
 * cascading failures during database outages. It tracks operation failures and automatically
 * opens the circuit when failure thresholds are exceeded, preventing further operations until
 * the database recovers.
 * 
 * Features:
 * - Configurable failure thresholds for different operation types
 * - Automatic recovery testing with exponential backoff
 * - Half-open state management for graceful recovery
 * - Integration with application monitoring for circuit state alerting
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseMiddleware } from './middleware.interface';
import { DatabaseErrorType } from '../errors/database-error.types';
import { DatabaseException } from '../errors/database-error.exception';
import { MiddlewareContext } from './middleware.interface';

/**
 * Circuit breaker states
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is tripped, requests fail fast
 * - HALF_OPEN: Testing if the resource has recovered
 */
export enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation, requests pass through
  OPEN = 'OPEN',       // Circuit is tripped, requests fail fast
  HALF_OPEN = 'HALF_OPEN', // Testing if the resource has recovered
}

/**
 * Configuration options for the circuit breaker
 */
export interface CircuitBreakerOptions {
  /** Maximum number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in milliseconds to wait before transitioning from OPEN to HALF_OPEN */
  recoveryTimeoutMs: number;
  /** Number of successful operations in HALF_OPEN state before closing the circuit */
  successThreshold: number;
  /** Maximum number of consecutive recovery attempts */
  maxRecoveryAttempts: number;
  /** Base timeout for exponential backoff (in milliseconds) */
  baseRecoveryTimeoutMs: number;
  /** Operation types that should be monitored by this circuit breaker */
  monitoredOperationTypes: DatabaseErrorType[];
  /** Whether to enable monitoring integration */
  enableMonitoring: boolean;
}

/**
 * Default circuit breaker options
 */
const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  recoveryTimeoutMs: 30000, // 30 seconds
  successThreshold: 2,
  maxRecoveryAttempts: 5,
  baseRecoveryTimeoutMs: 1000, // 1 second
  monitoredOperationTypes: [
    DatabaseErrorType.CONNECTION,
    DatabaseErrorType.QUERY,
    DatabaseErrorType.TRANSACTION,
  ],
  enableMonitoring: true,
};

/**
 * Circuit breaker statistics for monitoring
 * These statistics are used for monitoring and alerting on circuit breaker state
 */
export interface CircuitBreakerStats {
  /** Current state of the circuit */
  state: CircuitState;
  /** Number of consecutive failures */
  failureCount: number;
  /** Number of consecutive successes in HALF_OPEN state */
  successCount: number;
  /** Timestamp of the last failure */
  lastFailureTime: number | null;
  /** Timestamp of the last state change */
  lastStateChangeTime: number;
  /** Number of recovery attempts made */
  recoveryAttempts: number;
  /** Total number of operations that have been blocked */
  totalBlocked: number;
  /** Total number of operations that have failed */
  totalFailures: number;
  /** Total number of operations that have succeeded */
  totalSuccesses: number;
  /** Current recovery timeout in milliseconds */
  currentRecoveryTimeoutMs: number;
}

/**
 * Implementation of the circuit breaker pattern for database operations
 * 
 * This middleware implements the DatabaseMiddleware interface to intercept database operations
 * and apply circuit breaker protection. It tracks operation failures and automatically opens
 * the circuit when failure thresholds are exceeded, preventing further operations until the
 * database recovers.
 */
@Injectable()
export class CircuitBreakerMiddleware implements DatabaseMiddleware {
  private readonly logger = new Logger(CircuitBreakerMiddleware.name);
  private readonly options: CircuitBreakerOptions;
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private lastStateChangeTime = Date.now();
  private recoveryAttempts = 0;
  private totalBlocked = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private currentRecoveryTimeoutMs: number;
  private recoveryTimer: NodeJS.Timeout | null = null;

  /**
   * Creates a new instance of the CircuitBreakerMiddleware
   * @param options Configuration options for the circuit breaker
   */
  constructor(options?: Partial<CircuitBreakerOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.currentRecoveryTimeoutMs = this.options.baseRecoveryTimeoutMs;
    this.logger.log(`Circuit breaker initialized with options: ${JSON.stringify(this.options)}`);
  }

  /**
   * Intercepts database operations before execution to apply circuit breaker protection
   * @param context The middleware context containing operation details
   * @param next The next middleware in the chain
   * @returns The result of the operation if successful
   * @throws DatabaseException if the circuit is open or the operation fails
   */
  async beforeExecute<T>(context: MiddlewareContext, next: () => Promise<T>): Promise<T> {
    // Skip circuit breaker if operation type is not monitored
    const operationType = context.operationType as DatabaseErrorType;
    if (!this.options.monitoredOperationTypes.includes(operationType)) {
      return next();
    }

    // Check circuit state
    await this.checkCircuitState();

    try {
      // Execute the operation through the next middleware
      const result = await next();
      
      // Record success
      this.recordSuccess();
      return result;
    } catch (error) {
      // Record failure
      this.recordFailure(error, operationType);
      throw error;
    }
  }

  /**
   * Handles the operation after execution (not used in circuit breaker)
   * @param context The middleware context containing operation details
   * @param result The result of the operation
   * @returns The result of the operation
   */
  async afterExecute<T>(context: MiddlewareContext, result: T): Promise<T> {
    // Circuit breaker doesn't need to do anything after execution
    return result;
  }
  
  /**
   * Executes the provided operation with circuit breaker protection
   * This is a convenience method for direct use without the middleware pipeline
   * @param operation The database operation to execute
   * @param operationType The type of database operation
   * @returns The result of the operation if successful
   * @throws DatabaseException if the circuit is open or the operation fails
   */
  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    operationType: DatabaseErrorType,
  ): Promise<T> {
    // Skip circuit breaker if operation type is not monitored
    if (!this.options.monitoredOperationTypes.includes(operationType)) {
      return operation();
    }

    // Check circuit state
    await this.checkCircuitState();

    try {
      // Execute the operation
      const result = await operation();
      
      // Record success
      this.recordSuccess();
      return result;
    } catch (error) {
      // Record failure
      this.recordFailure(error, operationType);
      throw error;
    }
  }

  /**
   * Checks the current circuit state and throws an exception if the circuit is open
   * @throws DatabaseException if the circuit is open
   */
  private async checkCircuitState(): Promise<void> {
    if (this.state === CircuitState.OPEN) {
      this.totalBlocked++;
      throw new DatabaseException(
        'Circuit breaker is open, database operations are temporarily disabled',
        {
          circuitBreakerState: this.state,
          recoveryTimeoutMs: this.currentRecoveryTimeoutMs,
          recoveryAttempts: this.recoveryAttempts,
          lastFailureTime: this.lastFailureTime,
        },
      );
    }
  }

  /**
   * Records a successful operation and updates the circuit state if necessary
   */
  private recordSuccess(): void {
    this.totalSuccesses++;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      // Check if we've reached the success threshold to close the circuit
      if (this.successCount >= this.options.successThreshold) {
        this.closeCircuit();
      }
    }
  }

  /**
   * Records a failed operation and updates the circuit state if necessary
   * @param error The error that occurred
   * @param operationType The type of database operation that failed
   */
  private recordFailure(error: any, operationType: DatabaseErrorType): void {
    this.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    // Log the failure
    this.logger.warn(
      `Database operation failed (${operationType}): ${error.message}. ` +
      `Failure count: ${this.failureCount}/${this.options.failureThreshold}`,
    );

    // Check if we need to open the circuit
    if (this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold) {
      this.openCircuit();
    } else if (this.state === CircuitState.HALF_OPEN) {
      // If we're testing the connection and it fails, go back to open state
      this.openCircuit();
    }
    
    // If we're already in OPEN state, update the recovery timeout
    // This ensures that repeated failures will extend the recovery timeout
    if (this.state === CircuitState.OPEN) {
      // Recalculate recovery timeout and reschedule recovery attempt
      this.calculateNextRecoveryTimeout();
      this.scheduleRecoveryAttempt();
    }
  }

  /**
   * Opens the circuit and schedules a recovery attempt
   */
  private openCircuit(): void {
    if (this.state !== CircuitState.OPEN) {
      this.state = CircuitState.OPEN;
      this.lastStateChangeTime = Date.now();
      this.successCount = 0;
      
      // Calculate recovery timeout with exponential backoff
      this.calculateNextRecoveryTimeout();
      
      // Schedule recovery attempt
      this.scheduleRecoveryAttempt();
      
      // Log circuit open event
      this.logger.error(
        `Circuit breaker opened. Too many database operation failures. ` +
        `Will attempt recovery in ${this.currentRecoveryTimeoutMs}ms.`,
      );
      
      // Report to monitoring if enabled
      if (this.options.enableMonitoring) {
        this.reportCircuitStateChange();
      }
    }
  }

  /**
   * Transitions the circuit to half-open state to test if the database has recovered
   */
  private halfOpenCircuit(): void {
    if (this.state === CircuitState.OPEN) {
      this.state = CircuitState.HALF_OPEN;
      this.lastStateChangeTime = Date.now();
      this.successCount = 0;
      
      // Log circuit half-open event
      this.logger.log(
        'Circuit breaker half-open. Testing database connection recovery...',
      );
      
      // Report to monitoring if enabled
      if (this.options.enableMonitoring) {
        this.reportCircuitStateChange();
      }
    }
  }

  /**
   * Closes the circuit and resets failure counters
   */
  private closeCircuit(): void {
    if (this.state !== CircuitState.CLOSED) {
      this.state = CircuitState.CLOSED;
      this.lastStateChangeTime = Date.now();
      this.failureCount = 0;
      this.successCount = 0;
      this.recoveryAttempts = 0;
      this.currentRecoveryTimeoutMs = this.options.baseRecoveryTimeoutMs;
      
      // Clear any pending recovery timer
      if (this.recoveryTimer) {
        clearTimeout(this.recoveryTimer);
        this.recoveryTimer = null;
      }
      
      // Log circuit closed event
      this.logger.log('Circuit breaker closed. Database operations resumed.');
      
      // Report to monitoring if enabled
      if (this.options.enableMonitoring) {
        this.reportCircuitStateChange();
      }
    }
  }

  /**
   * Calculates the next recovery timeout using exponential backoff
   */
  private calculateNextRecoveryTimeout(): void {
    // Apply exponential backoff with a maximum timeout
    if (this.recoveryAttempts < this.options.maxRecoveryAttempts) {
      // Calculate exponential backoff: baseTimeout * 2^attempts
      // Add some jitter to prevent all instances from recovering at the same time
      const jitter = Math.random() * 0.3 + 0.85; // Random value between 0.85 and 1.15
      this.currentRecoveryTimeoutMs = Math.min(
        this.options.baseRecoveryTimeoutMs * Math.pow(2, this.recoveryAttempts) * jitter,
        this.options.recoveryTimeoutMs, // Cap at maximum recovery timeout
      );
    } else {
      // After max attempts, use the maximum recovery timeout
      this.currentRecoveryTimeoutMs = this.options.recoveryTimeoutMs;
    }
  }

  /**
   * Schedules a recovery attempt after the current recovery timeout
   */
  private scheduleRecoveryAttempt(): void {
    // Clear any existing timer
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }

    // Increment recovery attempts counter
    this.recoveryAttempts++;

    // Schedule the recovery attempt
    this.recoveryTimer = setTimeout(() => {
      this.halfOpenCircuit();
    }, this.currentRecoveryTimeoutMs);
  }

  /**
   * Reports circuit state changes to the monitoring system
   */
  private reportCircuitStateChange(): void {
    // This would integrate with your application's monitoring system
    // For now, we'll just log the state change and statistics
    const stats = this.getStats();
    this.logger.log(`Circuit breaker state changed to ${this.state}. Stats: ${JSON.stringify(stats)}`);
    
    // In a real implementation, you would send these stats to your monitoring system
    // Example: metricsService.recordCircuitBreakerState(stats);
    
    // Emit events for monitoring systems to consume
    // This could be integrated with your application's event system
    // Example: eventEmitter.emit('circuit-breaker.state-change', { state: this.state, stats });
    
    // For health check systems
    // If the circuit is open, the database should be considered unhealthy
    // This could be integrated with your application's health check system
    // Example: healthCheckService.setDatabaseHealth(this.state !== CircuitState.OPEN);
  }

  /**
   * Gets the current circuit breaker statistics
   * @returns The current circuit breaker statistics
   */
  public getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChangeTime: this.lastStateChangeTime,
      recoveryAttempts: this.recoveryAttempts,
      totalBlocked: this.totalBlocked,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      currentRecoveryTimeoutMs: this.currentRecoveryTimeoutMs,
    };
  }

  /**
   * Resets the circuit breaker to its initial closed state
   * This can be used for manual intervention by administrators
   */
  public reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastStateChangeTime = Date.now();
    this.recoveryAttempts = 0;
    this.currentRecoveryTimeoutMs = this.options.baseRecoveryTimeoutMs;
    
    // Clear any pending recovery timer
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
    
    this.logger.log('Circuit breaker manually reset to CLOSED state.');
    
    // Report to monitoring if enabled
    if (this.options.enableMonitoring) {
      this.reportCircuitStateChange();
    }
  }

  /**
   * Manually opens the circuit breaker
   * This can be used for maintenance or emergency situations
   */
  public manualOpen(): void {
    this.openCircuit();
    this.logger.log('Circuit breaker manually opened.');
  }
}