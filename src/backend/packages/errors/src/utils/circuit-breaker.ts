/**
 * @file circuit-breaker.ts
 * @description Implements the Circuit Breaker pattern to prevent cascading failures
 * when external services are unavailable. This pattern helps build resilient systems
 * by failing fast and providing fallback mechanisms when dependencies are unreliable.
 */

import { ErrorType } from '../types';
import { CIRCUIT_BREAKER_CONFIG, FALLBACK_STRATEGY } from '../constants';

/**
 * Enum representing the possible states of a circuit breaker.
 */
export enum CircuitState {
  /** Circuit is closed and operations execute normally */
  CLOSED = 'CLOSED',
  /** Circuit is open and operations fail fast */
  OPEN = 'OPEN',
  /** Circuit is testing if the service has recovered */
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Interface for circuit breaker configuration options.
 */
export interface CircuitBreakerOptions {
  /**
   * Percentage of failures that will trip the circuit (0-100)
   * @default 50
   */
  failureThresholdPercentage?: number;

  /**
   * Minimum number of requests needed before the circuit can trip
   * @default 20
   */
  requestVolumeThreshold?: number;

  /**
   * Time window in milliseconds for the request volume threshold
   * @default 10000 (10 seconds)
   */
  rollingWindowMs?: number;

  /**
   * Time in milliseconds to wait before attempting to close the circuit
   * @default 30000 (30 seconds)
   */
  resetTimeoutMs?: number;

  /**
   * Optional name for the circuit breaker (useful for logging)
   */
  name?: string;

  /**
   * Optional callback function called when the circuit state changes
   */
  onStateChange?: (from: CircuitState, to: CircuitState, metrics: CircuitMetrics) => void;

  /**
   * Optional callback function called when an operation fails
   */
  onFailure?: (error: Error, operationKey?: string) => void;

  /**
   * Optional callback function called when an operation succeeds
   */
  onSuccess?: (operationKey?: string) => void;
}

/**
 * Interface for circuit breaker metrics.
 */
export interface CircuitMetrics {
  /**
   * Total number of successful operations
   */
  successCount: number;

  /**
   * Total number of failed operations
   */
  failureCount: number;

  /**
   * Total number of rejected operations (when circuit is open)
   */
  rejectCount: number;

  /**
   * Total number of operations
   */
  totalCount: number;

  /**
   * Failure rate as a percentage
   */
  failureRate: number;

  /**
   * Timestamp when the circuit last changed state
   */
  lastStateChange: Date;

  /**
   * Current state of the circuit
   */
  currentState: CircuitState;

  /**
   * Timestamp when the metrics were last reset
   */
  lastReset: Date;
}

/**
 * Type for a fallback function that is called when the circuit is open.
 */
export type FallbackFunction<T> = (error: Error, ...args: any[]) => Promise<T> | T;

/**
 * Class implementing the Circuit Breaker pattern.
 * 
 * The Circuit Breaker pattern prevents cascading failures in distributed systems
 * by monitoring for failures and preventing operations when a service is unreliable.
 * 
 * It has three states:
 * - CLOSED: Operations execute normally
 * - OPEN: Operations fail fast without executing
 * - HALF_OPEN: A limited number of operations are allowed through to test recovery
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureThresholdPercentage: number;
  private requestVolumeThreshold: number;
  private rollingWindowMs: number;
  private resetTimeoutMs: number;
  private name: string;
  private onStateChange?: (from: CircuitState, to: CircuitState, metrics: CircuitMetrics) => void;
  private onFailure?: (error: Error, operationKey?: string) => void;
  private onSuccess?: (operationKey?: string) => void;

  private successCount: number = 0;
  private failureCount: number = 0;
  private rejectCount: number = 0;
  private lastStateChange: Date = new Date();
  private lastReset: Date = new Date();
  private resetTimeout?: NodeJS.Timeout;
  private operationResults: Array<{ success: boolean; timestamp: number }> = [];

  /**
   * Creates a new CircuitBreaker instance.
   * 
   * @param options - Configuration options for the circuit breaker
   */
  constructor(options: CircuitBreakerOptions = {}) {
    const config = CIRCUIT_BREAKER_CONFIG.DEFAULT;
    
    this.failureThresholdPercentage = options.failureThresholdPercentage ?? config.FAILURE_THRESHOLD_PERCENTAGE;
    this.requestVolumeThreshold = options.requestVolumeThreshold ?? config.REQUEST_VOLUME_THRESHOLD;
    this.rollingWindowMs = options.rollingWindowMs ?? config.ROLLING_WINDOW_MS;
    this.resetTimeoutMs = options.resetTimeoutMs ?? config.RESET_TIMEOUT_MS;
    this.name = options.name ?? 'unnamed-circuit';
    this.onStateChange = options.onStateChange;
    this.onFailure = options.onFailure;
    this.onSuccess = options.onSuccess;
  }

  /**
   * Gets the current state of the circuit.
   */
  public get currentState(): CircuitState {
    return this.state;
  }

  /**
   * Gets the current metrics for the circuit.
   */
  public get metrics(): CircuitMetrics {
    this.removeStaleResults();
    
    const totalCount = this.successCount + this.failureCount;
    const failureRate = totalCount === 0 ? 0 : (this.failureCount / totalCount) * 100;

    return {
      successCount: this.successCount,
      failureCount: this.failureCount,
      rejectCount: this.rejectCount,
      totalCount,
      failureRate,
      lastStateChange: this.lastStateChange,
      currentState: this.state,
      lastReset: this.lastReset
    };
  }

  /**
   * Resets the circuit breaker metrics.
   */
  public reset(): void {
    this.successCount = 0;
    this.failureCount = 0;
    this.rejectCount = 0;
    this.operationResults = [];
    this.lastReset = new Date();
    this.changeState(CircuitState.CLOSED);
  }

  /**
   * Manually opens the circuit.
   */
  public open(): void {
    this.changeState(CircuitState.OPEN);
  }

  /**
   * Manually closes the circuit.
   */
  public close(): void {
    this.changeState(CircuitState.CLOSED);
  }

  /**
   * Executes an operation through the circuit breaker.
   * 
   * @param operation - The operation to execute
   * @param operationKey - Optional key to identify the operation (for logging)
   * @returns The result of the operation
   * @throws CircuitOpenError if the circuit is open
   */
  public async execute<T>(
    operation: (...args: any[]) => Promise<T> | T,
    operationKey?: string,
    ...args: any[]
  ): Promise<T> {
    if (this.isOpen()) {
      this.rejectCount++;
      const error = new CircuitOpenError(
        `Circuit ${this.name} is open`,
        this.metrics
      );
      throw error;
    }

    try {
      const result = await operation(...args);
      this.recordSuccess(operationKey);
      return result;
    } catch (error) {
      this.recordFailure(error as Error, operationKey);
      throw error;
    }
  }

  /**
   * Executes an operation with a fallback if the circuit is open or the operation fails.
   * 
   * @param operation - The operation to execute
   * @param fallback - The fallback function to call if the operation fails
   * @param operationKey - Optional key to identify the operation (for logging)
   * @returns The result of the operation or fallback
   */
  public async executeWithFallback<T>(
    operation: (...args: any[]) => Promise<T> | T,
    fallback: FallbackFunction<T>,
    operationKey?: string,
    ...args: any[]
  ): Promise<T> {
    try {
      return await this.execute(operation, operationKey, ...args);
    } catch (error) {
      return await fallback(error as Error, ...args);
    }
  }

  /**
   * Decorates a function with circuit breaker functionality.
   * 
   * @param operation - The operation to decorate
   * @param operationKey - Optional key to identify the operation (for logging)
   * @returns A decorated function that uses the circuit breaker
   */
  public decorate<T>(
    operation: (...args: any[]) => Promise<T> | T,
    operationKey?: string
  ): (...args: any[]) => Promise<T> {
    return async (...args: any[]): Promise<T> => {
      return this.execute(operation, operationKey, ...args);
    };
  }

  /**
   * Decorates a function with circuit breaker functionality and a fallback.
   * 
   * @param operation - The operation to decorate
   * @param fallback - The fallback function to call if the operation fails
   * @param operationKey - Optional key to identify the operation (for logging)
   * @returns A decorated function that uses the circuit breaker with fallback
   */
  public decorateWithFallback<T>(
    operation: (...args: any[]) => Promise<T> | T,
    fallback: FallbackFunction<T>,
    operationKey?: string
  ): (...args: any[]) => Promise<T> {
    return async (...args: any[]): Promise<T> => {
      return this.executeWithFallback(operation, fallback, operationKey, ...args);
    };
  }

  /**
   * Checks if the circuit is currently open.
   */
  private isOpen(): boolean {
    return this.state === CircuitState.OPEN || 
           (this.state === CircuitState.HALF_OPEN && this.failureCount > 0);
  }

  /**
   * Records a successful operation.
   */
  private recordSuccess(operationKey?: string): void {
    this.successCount++;
    this.operationResults.push({ success: true, timestamp: Date.now() });
    
    if (this.onSuccess) {
      this.onSuccess(operationKey);
    }

    if (this.state === CircuitState.HALF_OPEN) {
      this.changeState(CircuitState.CLOSED);
    }

    this.removeStaleResults();
  }

  /**
   * Records a failed operation.
   */
  private recordFailure(error: Error, operationKey?: string): void {
    this.failureCount++;
    this.operationResults.push({ success: false, timestamp: Date.now() });
    
    if (this.onFailure) {
      this.onFailure(error, operationKey);
    }

    this.removeStaleResults();
    this.checkThreshold();
  }

  /**
   * Removes operation results that are outside the rolling window.
   */
  private removeStaleResults(): void {
    const cutoff = Date.now() - this.rollingWindowMs;
    
    // Remove stale results and update counts
    const freshResults = this.operationResults.filter(result => result.timestamp >= cutoff);
    
    // Recalculate counts based on fresh results
    this.successCount = freshResults.filter(result => result.success).length;
    this.failureCount = freshResults.filter(result => !result.success).length;
    this.operationResults = freshResults;
  }

  /**
   * Checks if the failure threshold has been exceeded and trips the circuit if necessary.
   */
  private checkThreshold(): void {
    const totalCount = this.successCount + this.failureCount;
    
    if (totalCount < this.requestVolumeThreshold) {
      return; // Not enough requests to make a decision
    }

    const failureRate = (this.failureCount / totalCount) * 100;
    
    if (failureRate >= this.failureThresholdPercentage && this.state === CircuitState.CLOSED) {
      this.trip();
    }
  }

  /**
   * Trips the circuit open and schedules a reset.
   */
  private trip(): void {
    this.changeState(CircuitState.OPEN);
    
    // Clear any existing timeout
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
    
    // Schedule a transition to half-open state
    this.resetTimeout = setTimeout(() => {
      this.changeState(CircuitState.HALF_OPEN);
    }, this.resetTimeoutMs);
  }

  /**
   * Changes the circuit state and notifies listeners.
   */
  private changeState(newState: CircuitState): void {
    if (this.state === newState) {
      return; // No change
    }

    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = new Date();

    if (this.onStateChange) {
      this.onStateChange(oldState, newState, this.metrics);
    }
  }
}

/**
 * Error thrown when an operation is rejected because the circuit is open.
 */
export class CircuitOpenError extends Error {
  /**
   * The metrics at the time the circuit rejected the operation.
   */
  public readonly metrics: CircuitMetrics;

  /**
   * Creates a new CircuitOpenError.
   * 
   * @param message - Error message
   * @param metrics - Circuit metrics at the time of rejection
   */
  constructor(message: string, metrics: CircuitMetrics) {
    super(message);
    this.name = 'CircuitOpenError';
    this.metrics = metrics;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, CircuitOpenError.prototype);
  }
}

/**
 * Creates a circuit breaker with the default configuration.
 * 
 * @param options - Optional configuration options
 * @returns A new CircuitBreaker instance
 */
export function createCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreaker {
  return new CircuitBreaker(options);
}

/**
 * Creates a circuit breaker with configuration for critical services.
 * 
 * @param options - Optional additional configuration options
 * @returns A new CircuitBreaker instance with critical service configuration
 */
export function createCriticalCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreaker {
  const criticalConfig = CIRCUIT_BREAKER_CONFIG.CRITICAL;
  
  return new CircuitBreaker({
    failureThresholdPercentage: criticalConfig.FAILURE_THRESHOLD_PERCENTAGE,
    requestVolumeThreshold: criticalConfig.REQUEST_VOLUME_THRESHOLD,
    rollingWindowMs: criticalConfig.ROLLING_WINDOW_MS,
    resetTimeoutMs: criticalConfig.RESET_TIMEOUT_MS,
    ...options
  });
}

/**
 * Creates a circuit breaker with configuration for non-critical services.
 * 
 * @param options - Optional additional configuration options
 * @returns A new CircuitBreaker instance with non-critical service configuration
 */
export function createNonCriticalCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreaker {
  const nonCriticalConfig = CIRCUIT_BREAKER_CONFIG.NON_CRITICAL;
  
  return new CircuitBreaker({
    failureThresholdPercentage: nonCriticalConfig.FAILURE_THRESHOLD_PERCENTAGE,
    requestVolumeThreshold: nonCriticalConfig.REQUEST_VOLUME_THRESHOLD,
    rollingWindowMs: nonCriticalConfig.ROLLING_WINDOW_MS,
    resetTimeoutMs: nonCriticalConfig.RESET_TIMEOUT_MS,
    ...options
  });
}

/**
 * Creates a fallback function that returns cached data.
 * 
 * @param cache - The cache object or function to retrieve cached data
 * @param key - The cache key
 * @returns A fallback function that returns cached data
 */
export function cachedDataFallback<T>(
  cache: Record<string, T> | ((key: string) => T | undefined),
  key: string
): FallbackFunction<T> {
  return (_error: Error): T => {
    if (typeof cache === 'function') {
      const cachedValue = cache(key);
      if (cachedValue === undefined) {
        throw new Error(`No cached data available for key: ${key}`);
      }
      return cachedValue;
    } else {
      const cachedValue = cache[key];
      if (cachedValue === undefined) {
        throw new Error(`No cached data available for key: ${key}`);
      }
      return cachedValue;
    }
  };
}

/**
 * Creates a fallback function that returns default values.
 * 
 * @param defaultValue - The default value to return
 * @returns A fallback function that returns the default value
 */
export function defaultValueFallback<T>(defaultValue: T): FallbackFunction<T> {
  return (_error: Error): T => defaultValue;
}

/**
 * Creates a fallback function that returns an empty result.
 * 
 * @returns A fallback function that returns an empty result
 */
export function emptyResultFallback<T>(): FallbackFunction<T> {
  return (_error: Error): T => {
    // Return appropriate empty value based on expected return type
    return (Array.isArray({}as T) ? [] : {}) as T;
  };
}

/**
 * Creates a fallback function that rethrows the error with additional context.
 * 
 * @param context - Additional context to add to the error
 * @returns A fallback function that rethrows the error with context
 */
export function rethrowWithContextFallback<T>(context: Record<string, any>): FallbackFunction<T> {
  return (error: Error): never => {
    const enhancedError = new Error(`${error.message} (Context: ${JSON.stringify(context)})`);
    enhancedError.name = error.name;
    enhancedError.stack = error.stack;
    throw enhancedError;
  };
}