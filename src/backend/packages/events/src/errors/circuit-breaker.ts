/**
 * @fileoverview
 * Implementation of the Circuit Breaker pattern for preventing cascading failures
 * in event processing. This pattern temporarily stops operations that are likely to fail,
 * allowing the system to recover and preventing system overload.
 */

import { Logger } from '@nestjs/common';

/**
 * Configuration options for the CircuitBreaker
 */
export interface CircuitBreakerOptions {
  /**
   * Number of failures before opening the circuit
   */
  failureThreshold?: number;
  
  /**
   * Time in milliseconds to keep the circuit open before trying again
   */
  resetTimeout?: number;
  
  /**
   * Window size for tracking failures (number of most recent calls to consider)
   */
  windowSize?: number;
  
  /**
   * Failure rate threshold (0-1) that triggers the circuit to open
   */
  failureRateThreshold?: number;
  
  /**
   * Name of this circuit breaker for logging and metrics
   */
  name?: string;
}

/**
 * States of the circuit breaker
 */
enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation, requests pass through
  OPEN = 'OPEN',       // Circuit is open, requests are rejected
  HALF_OPEN = 'HALF_OPEN' // Testing if service is healthy again
}

/**
 * Implementation of the Circuit Breaker pattern
 * Tracks failures and temporarily prevents operations when failure threshold is exceeded
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastStateChange: number = Date.now();
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly windowSize: number;
  private readonly failureRateThreshold: number;
  private readonly name: string;
  private readonly logger: Logger;
  
  // Circular buffer to track recent call results
  private readonly callResults: boolean[] = [];
  
  /**
   * Creates a new CircuitBreaker instance
   * 
   * @param options Configuration options
   */
  constructor(options?: CircuitBreakerOptions) {
    this.failureThreshold = options?.failureThreshold ?? 5;
    this.resetTimeout = options?.resetTimeout ?? 30000; // 30 seconds
    this.windowSize = options?.windowSize ?? 10;
    this.failureRateThreshold = options?.failureRateThreshold ?? 0.5; // 50%
    this.name = options?.name ?? 'default';
    this.logger = new Logger(`CircuitBreaker:${this.name}`);
    
    this.logger.log(`Initialized circuit breaker with threshold ${this.failureThreshold}, ` +
      `reset timeout ${this.resetTimeout}ms, window size ${this.windowSize}, ` +
      `failure rate threshold ${this.failureRateThreshold * 100}%`);
  }
  
  /**
   * Checks if the circuit is currently open (rejecting requests)
   * 
   * @returns True if the circuit is open
   */
  isOpen(): boolean {
    this.updateState();
    return this.state === CircuitState.OPEN;
  }
  
  /**
   * Records a successful operation
   */
  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      // If we've seen enough successes in half-open state, close the circuit
      if (this.successCount >= this.failureThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
    
    // Add to the circular buffer of results
    this.recordResult(true);
  }
  
  /**
   * Records a failed operation
   */
  recordFailure(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      // If any failure in half-open state, reopen the circuit
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      
      // Check if we need to open the circuit based on absolute count
      if (this.failureCount >= this.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
    
    // Add to the circular buffer of results
    this.recordResult(false);
    
    // Check if we need to open the circuit based on failure rate
    this.checkFailureRate();
  }
  
  /**
   * Gets the current state of the circuit breaker
   * 
   * @returns The current state
   */
  getState(): CircuitState {
    this.updateState();
    return this.state;
  }
  
  /**
   * Gets the current failure count
   * 
   * @returns The number of consecutive failures
   */
  getFailureCount(): number {
    return this.failureCount;
  }
  
  /**
   * Gets the current success count in half-open state
   * 
   * @returns The number of consecutive successes in half-open state
   */
  getSuccessCount(): number {
    return this.successCount;
  }
  
  /**
   * Gets the time since the last state change in milliseconds
   * 
   * @returns Time in milliseconds since last state change
   */
  getTimeSinceLastStateChange(): number {
    return Date.now() - this.lastStateChange;
  }
  
  /**
   * Resets the circuit breaker to closed state
   */
  reset(): void {
    this.transitionTo(CircuitState.CLOSED);
  }
  
  /**
   * Manually opens the circuit
   */
  forceOpen(): void {
    this.transitionTo(CircuitState.OPEN);
  }
  
  /**
   * Updates the state based on timeouts
   */
  private updateState(): void {
    if (this.state === CircuitState.OPEN) {
      const timeInOpen = this.getTimeSinceLastStateChange();
      
      // Check if it's time to try again
      if (timeInOpen >= this.resetTimeout) {
        this.transitionTo(CircuitState.HALF_OPEN);
      }
    }
  }
  
  /**
   * Transitions to a new state
   * 
   * @param newState The state to transition to
   */
  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      this.logger.log(`State change: ${this.state} -> ${newState}`);
      
      this.state = newState;
      this.lastStateChange = Date.now();
      
      if (newState === CircuitState.CLOSED) {
        this.failureCount = 0;
        this.successCount = 0;
        this.callResults.length = 0; // Clear the buffer
      } else if (newState === CircuitState.HALF_OPEN) {
        this.successCount = 0;
      }
      
      // This would be a good place to emit metrics or events
      // this.emitStateChangeMetric(newState);
    }
  }
  
  /**
   * Records a result in the circular buffer
   * 
   * @param success Whether the operation was successful
   */
  private recordResult(success: boolean): void {
    // Add to the circular buffer, removing oldest if at capacity
    if (this.callResults.length >= this.windowSize) {
      this.callResults.shift();
    }
    
    this.callResults.push(success);
  }
  
  /**
   * Checks if the failure rate exceeds the threshold
   */
  private checkFailureRate(): void {
    // Only check if we have enough data and the circuit is closed
    if (this.callResults.length >= this.windowSize && this.state === CircuitState.CLOSED) {
      const failures = this.callResults.filter(result => !result).length;
      const failureRate = failures / this.callResults.length;
      
      if (failureRate >= this.failureRateThreshold) {
        this.logger.warn(
          `Failure rate ${(failureRate * 100).toFixed(2)}% exceeds threshold ` +
          `${(this.failureRateThreshold * 100).toFixed(2)}%, opening circuit`
        );
        
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }
}