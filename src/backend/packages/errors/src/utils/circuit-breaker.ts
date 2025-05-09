/**
 * @file circuit-breaker.ts
 * @description Implements the Circuit Breaker pattern to prevent cascading failures
 * when external services are unavailable. Provides a configurable CircuitBreaker class
 * that monitors operation failures, trips open when failure thresholds are reached,
 * and automatically tests service recovery after a cooling period.
 */

import { Logger } from '@nestjs/common';
import { ExternalDependencyUnavailableError } from '../categories/external.errors';

/**
 * Represents the possible states of a circuit breaker.
 */
export enum CircuitBreakerState {
  /**
   * Normal operation, requests flow through
   */
  CLOSED = 'CLOSED',
  
  /**
   * Circuit is open, requests fail fast
   */
  OPEN = 'OPEN',
  
  /**
   * Testing if the service has recovered
   */
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Configuration options for the circuit breaker.
 */
export interface CircuitBreakerOptions {
  /**
   * Number of consecutive failures required to open the circuit.
   */
  failureThreshold: number;
  
  /**
   * Time in milliseconds that the circuit stays open before moving to half-open.
   */
  resetTimeoutMs: number;
  
  /**
   * Number of consecutive successful requests required to close the circuit when in half-open state.
   */
  successThreshold: number;
  
  /**
   * Maximum number of requests allowed when in half-open state.
   */
  halfOpenMaxRequests?: number;
  
  /**
   * Name of the service or operation being protected by the circuit breaker.
   * Used for error messages and logging.
   */
  name: string;
  
  /**
   * Custom function to determine if a failure should count towards the threshold.
   */
  failureCondition?: (error: Error) => boolean;
  
  /**
   * Logger instance for logging circuit state changes and failures.
   */
  logger?: Logger;
  
  /**
   * Optional callback function that is called when the circuit state changes.
   * Useful for monitoring and metrics.
   */
  onStateChange?: (from: CircuitBreakerState, to: CircuitBreakerState, metrics: CircuitBreakerMetrics) => void;
}

/**
 * Default circuit breaker options.
 */
export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: Partial<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeoutMs: 30000, // 30 seconds
  successThreshold: 2,
  halfOpenMaxRequests: 1
};

/**
 * Metrics collected by the circuit breaker for monitoring and diagnostics.
 */
export interface CircuitBreakerMetrics {
  /**
   * Current state of the circuit breaker
   */
  state: CircuitBreakerState;
  
  /**
   * Number of consecutive failures in the current window
   */
  failureCount: number;
  
  /**
   * Number of consecutive successes in half-open state
   */
  successCount: number;
  
  /**
   * Total number of successful operations since creation
   */
  totalSuccesses: number;
  
  /**
   * Total number of failed operations since creation
   */
  totalFailures: number;
  
  /**
   * Total number of rejected operations (when circuit was open)
   */
  totalRejections: number;
  
  /**
   * Timestamp of the last state change
   */
  lastStateChangeTimestamp: number;
  
  /**
   * Timestamp of the last failure
   */
  lastFailureTimestamp: number | null;
  
  /**
   * Timestamp of the last success
   */
  lastSuccessTimestamp: number | null;
}

/**
 * Implementation of the Circuit Breaker pattern to prevent cascading failures
 * when external services are unavailable.
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalSuccesses: number = 0;
  private totalFailures: number = 0;
  private totalRejections: number = 0;
  private lastStateChange: number = Date.now();
  private lastFailureTimestamp: number | null = null;
  private lastSuccessTimestamp: number | null = null;
  private halfOpenRequests: number = 0;
  private readonly options: CircuitBreakerOptions;

  /**
   * Creates a new CircuitBreaker instance.
   * 
   * @param options - Configuration options for the circuit breaker
   */
  constructor(options: CircuitBreakerOptions) {
    this.options = {
      ...DEFAULT_CIRCUIT_BREAKER_OPTIONS,
      ...options
    } as CircuitBreakerOptions;
    
    // Validate required options
    if (!this.options.name) {
      throw new Error('Circuit breaker name is required');
    }
  }

  /**
   * Executes a function with circuit breaker protection.
   * 
   * @param fn - The function to execute with circuit breaker protection
   * @returns A promise that resolves with the result of the function
   * @throws ExternalDependencyUnavailableError if the circuit is open
   * @throws The original error if the function fails and the circuit remains closed
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.updateState();
    
    // If circuit is open, fail fast
    if (this.state === CircuitBreakerState.OPEN) {
      this.totalRejections++;
      this.options.logger?.warn(
        `Circuit breaker '${this.options.name}' is open, rejecting request`
      );
      
      throw new ExternalDependencyUnavailableError(
        `Service unavailable: circuit breaker for '${this.options.name}' is open`,
        this.options.name,
        'circuit-breaker',
        { circuitBreakerState: this.state }
      );
    }
    
    // If circuit is half-open, only allow limited requests
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.halfOpenRequests >= (this.options.halfOpenMaxRequests || 1)) {
        this.totalRejections++;
        this.options.logger?.warn(
          `Circuit breaker '${this.options.name}' is half-open and at capacity, rejecting request`
        );
        
        throw new ExternalDependencyUnavailableError(
          `Service unavailable: circuit breaker for '${this.options.name}' is half-open and at capacity`,
          this.options.name,
          'circuit-breaker',
          { circuitBreakerState: this.state }
        );
      }
      
      this.halfOpenRequests++;
    }
    
    try {
      // Execute the function
      const result = await fn();
      
      // Record success
      this.recordSuccess();
      
      return result;
    } catch (error) {
      // Record failure
      this.recordFailure(error);
      
      // Rethrow the error
      throw error;
    }
  }

  /**
   * Executes a function with circuit breaker protection and fallback.
   * 
   * @param fn - The function to execute with circuit breaker protection
   * @param fallback - Fallback function to execute if the circuit is open or the primary function fails
   * @returns A promise that resolves with the result of the function or fallback
   */
  public async executeWithFallback<T, F>(
    fn: () => Promise<T>,
    fallback: (error: Error) => Promise<F> | F
  ): Promise<T | F> {
    try {
      return await this.execute(fn);
    } catch (error) {
      return await fallback(error);
    }
  }

  /**
   * Records a successful operation.
   * Updates internal state and potentially transitions the circuit state.
   */
  private recordSuccess(): void {
    this.totalSuccesses++;
    this.lastSuccessTimestamp = Date.now();
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      this.halfOpenRequests--;
      
      this.options.logger?.log(
        `Circuit breaker '${this.options.name}' half-open success: ${this.successCount}/${this.options.successThreshold}`
      );
      
      if (this.successCount >= this.options.successThreshold) {
        this.transitionTo(CircuitBreakerState.CLOSED);
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  /**
   * Records a failed operation.
   * Updates internal state and potentially transitions the circuit state.
   * 
   * @param error - The error that occurred
   */
  private recordFailure(error: Error): void {
    this.totalFailures++;
    this.lastFailureTimestamp = Date.now();
    
    // Check if this failure should count towards the threshold
    if (this.options.failureCondition && !this.options.failureCondition(error)) {
      this.options.logger?.debug(
        `Circuit breaker '${this.options.name}' failure did not meet condition, not counting towards threshold`,
        error.message
      );
      return;
    }
    
    if (this.state === CircuitBreakerState.CLOSED) {
      this.failureCount++;
      
      this.options.logger?.warn(
        `Circuit breaker '${this.options.name}' failure: ${this.failureCount}/${this.options.failureThreshold}`,
        error.message
      );
      
      if (this.failureCount >= this.options.failureThreshold) {
        this.transitionTo(CircuitBreakerState.OPEN);
      }
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.halfOpenRequests--;
      
      this.options.logger?.warn(
        `Circuit breaker '${this.options.name}' failed in half-open state, reopening circuit`,
        error.message
      );
      
      this.transitionTo(CircuitBreakerState.OPEN);
    }
  }

  /**
   * Updates the circuit state based on elapsed time.
   * Transitions from OPEN to HALF_OPEN after the reset timeout.
   */
  private updateState(): void {
    if (this.state === CircuitBreakerState.OPEN) {
      const elapsedMs = Date.now() - this.lastStateChange;
      
      if (elapsedMs >= this.options.resetTimeoutMs) {
        this.options.logger?.log(
          `Circuit breaker '${this.options.name}' reset timeout elapsed, transitioning to half-open`
        );
        
        this.transitionTo(CircuitBreakerState.HALF_OPEN);
      }
    }
  }

  /**
   * Transitions the circuit to a new state.
   * Resets appropriate counters and notifies listeners.
   * 
   * @param newState - The new circuit state
   */
  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    
    this.options.logger?.log(
      `Circuit breaker '${this.options.name}' state transition: ${oldState} -> ${newState}`
    );
    
    if (newState === CircuitBreakerState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
    } else if (newState === CircuitBreakerState.HALF_OPEN) {
      this.successCount = 0;
      this.halfOpenRequests = 0;
    }
    
    // Notify state change listeners
    if (this.options.onStateChange) {
      try {
        this.options.onStateChange(oldState, newState, this.getMetrics());
      } catch (error) {
        this.options.logger?.error(
          `Error in circuit breaker state change callback: ${error.message}`,
          error.stack
        );
      }
    }
  }

  /**
   * Gets the current state of the circuit breaker.
   * 
   * @returns The current circuit state
   */
  public getState(): CircuitBreakerState {
    this.updateState();
    return this.state;
  }

  /**
   * Gets the current metrics of the circuit breaker.
   * 
   * @returns The current circuit metrics
   */
  public getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalSuccesses: this.totalSuccesses,
      totalFailures: this.totalFailures,
      totalRejections: this.totalRejections,
      lastStateChangeTimestamp: this.lastStateChange,
      lastFailureTimestamp: this.lastFailureTimestamp,
      lastSuccessTimestamp: this.lastSuccessTimestamp
    };
  }

  /**
   * Manually resets the circuit breaker to the closed state.
   * Useful for testing or administrative interventions.
   */
  public reset(): void {
    this.transitionTo(CircuitBreakerState.CLOSED);
  }

  /**
   * Manually opens the circuit breaker.
   * Useful for testing or administrative interventions.
   */
  public trip(): void {
    this.transitionTo(CircuitBreakerState.OPEN);
  }
}

/**
 * Creates a circuit breaker with the specified options.
 * 
 * @param options - Configuration options for the circuit breaker
 * @returns A new CircuitBreaker instance
 */
export function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
  return new CircuitBreaker(options);
}

/**
 * Creates a circuit breaker for a specific service with default options.
 * 
 * @param serviceName - Name of the service being protected
 * @param options - Additional configuration options
 * @returns A new CircuitBreaker instance
 */
export function createServiceCircuitBreaker(
  serviceName: string,
  options: Partial<CircuitBreakerOptions> = {}
): CircuitBreaker {
  return new CircuitBreaker({
    ...DEFAULT_CIRCUIT_BREAKER_OPTIONS,
    name: serviceName,
    ...options
  });
}