import { EventEmitter } from 'events';
import { ErrorType } from '@austa/interfaces';

/**
 * Represents the possible states of a circuit breaker.
 */
export enum CircuitBreakerState {
  /**
   * Normal operation - requests are allowed to pass through
   */
  CLOSED = 'CLOSED',
  
  /**
   * Failing fast - requests are immediately rejected
   */
  OPEN = 'OPEN',
  
  /**
   * Testing recovery - limited requests are allowed through to test if the dependency has recovered
   */
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Configuration options for the CircuitBreaker.
 */
export interface CircuitBreakerOptions {
  /**
   * Name of the circuit breaker, used for identification in logs and metrics
   */
  name: string;
  
  /**
   * Number of failures required to trip the circuit
   * @default 5
   */
  failureThreshold?: number;
  
  /**
   * Time in milliseconds to wait before attempting to test if the dependency has recovered
   * @default 30000 (30 seconds)
   */
  resetTimeout?: number;
  
  /**
   * Number of successful test requests required to close the circuit
   * @default 3
   */
  successThreshold?: number;
  
  /**
   * Time window in milliseconds to track failures
   * @default 60000 (60 seconds)
   */
  failureWindowMs?: number;
  
  /**
   * Optional function to determine if an error should count as a failure
   * @param error - The error to evaluate
   * @returns true if the error should count as a failure, false otherwise
   */
  isFailure?: (error: Error) => boolean;
  
  /**
   * Optional function to check if the dependency is healthy
   * @returns Promise that resolves to true if healthy, false otherwise
   */
  healthCheck?: () => Promise<boolean>;
  
  /**
   * Time in milliseconds between health checks when in OPEN state
   * @default 60000 (60 seconds)
   */
  healthCheckInterval?: number;
}

/**
 * Error thrown when a circuit is open and a request is attempted.
 */
export class CircuitBreakerError extends Error {
  /**
   * Creates a new CircuitBreakerError.
   * 
   * @param message - Error message
   * @param circuitName - Name of the circuit that is open
   */
  constructor(
    message: string,
    public readonly circuitName: string
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, CircuitBreakerError.prototype);
  }
}

/**
 * Metrics collected by the circuit breaker for monitoring.
 */
export interface CircuitBreakerMetrics {
  /**
   * Current state of the circuit
   */
  state: CircuitBreakerState;
  
  /**
   * Total number of successful requests
   */
  successCount: number;
  
  /**
   * Total number of failed requests
   */
  failureCount: number;
  
  /**
   * Total number of rejected requests due to open circuit
   */
  rejectCount: number;
  
  /**
   * Number of consecutive successful requests in HALF_OPEN state
   */
  halfOpenSuccessCount: number;
  
  /**
   * Timestamp when the circuit last changed state
   */
  lastStateChange: Date;
  
  /**
   * Timestamp when the circuit will attempt to transition from OPEN to HALF_OPEN
   */
  nextAttempt: Date | null;
  
  /**
   * Recent failures within the failure window
   */
  recentFailures: Date[];
}

/**
 * Events emitted by the CircuitBreaker.
 */
export enum CircuitBreakerEvents {
  /**
   * Emitted when the circuit transitions from CLOSED to OPEN
   */
  OPEN = 'open',
  
  /**
   * Emitted when the circuit transitions from OPEN to HALF_OPEN
   */
  HALF_OPEN = 'half-open',
  
  /**
   * Emitted when the circuit transitions from HALF_OPEN to CLOSED
   */
  CLOSE = 'close',
  
  /**
   * Emitted when a request fails
   */
  FAILURE = 'failure',
  
  /**
   * Emitted when a request succeeds
   */
  SUCCESS = 'success',
  
  /**
   * Emitted when a request is rejected due to an open circuit
   */
  REJECTED = 'rejected',
  
  /**
   * Emitted when a health check is performed
   */
  HEALTH_CHECK_STATUS = 'health-check-status'
}

/**
 * Implements the circuit breaker pattern to prevent cascading failures when interacting with
 * failing services or dependencies.
 * 
 * The circuit breaker has three states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failing fast, requests are immediately rejected
 * - HALF_OPEN: Testing recovery, limited requests are allowed through
 * 
 * Usage example:
 * ```typescript
 * const circuitBreaker = new CircuitBreaker({
 *   name: 'payment-service',
 *   failureThreshold: 3,
 *   resetTimeout: 10000
 * });
 * 
 * // Wrap an async function with circuit breaker protection
 * try {
 *   const result = await circuitBreaker.execute(() => paymentService.processPayment(payment));
 *   // Handle successful result
 * } catch (error) {
 *   // Handle error or circuit open
 *   if (error instanceof CircuitBreakerError) {
 *     // Circuit is open, use fallback strategy
 *   } else {
 *     // Actual error from the service
 *   }
 * }
 * ```
 */
export class CircuitBreaker extends EventEmitter {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureThreshold: number;
  private resetTimeout: number;
  private successThreshold: number;
  private failureWindowMs: number;
  private isFailure: (error: Error) => boolean;
  private healthCheck?: () => Promise<boolean>;
  private healthCheckInterval: number;
  private healthCheckTimer?: NodeJS.Timeout;
  
  private successCount: number = 0;
  private failureCount: number = 0;
  private rejectCount: number = 0;
  private halfOpenSuccessCount: number = 0;
  private lastStateChange: Date = new Date();
  private nextAttempt: Date | null = null;
  private resetTimer?: NodeJS.Timeout;
  private recentFailures: Date[] = [];
  
  /**
   * Creates a new CircuitBreaker instance.
   * 
   * @param options - Configuration options for the circuit breaker
   */
  constructor(private readonly options: CircuitBreakerOptions) {
    super();
    
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30000; // 30 seconds
    this.successThreshold = options.successThreshold ?? 3;
    this.failureWindowMs = options.failureWindowMs ?? 60000; // 60 seconds
    this.healthCheckInterval = options.healthCheckInterval ?? 60000; // 60 seconds
    
    // Default failure check considers all errors as failures
    this.isFailure = options.isFailure ?? (() => true);
    
    // If a health check function is provided, start the health check timer
    if (options.healthCheck) {
      this.healthCheck = options.healthCheck;
      this.startHealthCheck();
    }
  }
  
  /**
   * Executes a function with circuit breaker protection.
   * 
   * @param fn - The function to execute
   * @returns A promise that resolves with the result of the function or rejects with an error
   * @throws CircuitBreakerError if the circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // If the circuit is open, reject immediately
    if (this.state === CircuitBreakerState.OPEN) {
      this.rejectCount++;
      this.emit(CircuitBreakerEvents.REJECTED, { name: this.options.name });
      throw new CircuitBreakerError(
        `Circuit breaker '${this.options.name}' is open - service unavailable`,
        this.options.name
      );
    }
    
    try {
      // Execute the function
      const result = await fn();
      
      // Handle success
      this.onSuccess();
      return result;
    } catch (error) {
      // Handle failure
      this.onFailure(error as Error);
      throw error;
    }
  }
  
  /**
   * Handles a successful request.
   */
  private onSuccess(): void {
    this.successCount++;
    this.emit(CircuitBreakerEvents.SUCCESS, { name: this.options.name });
    
    // If the circuit is half-open and we've reached the success threshold, close it
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.halfOpenSuccessCount++;
      
      if (this.halfOpenSuccessCount >= this.successThreshold) {
        this.close();
      }
    }
  }
  
  /**
   * Handles a failed request.
   * 
   * @param error - The error that occurred
   */
  private onFailure(error: Error): void {
    // Check if this error should count as a failure
    if (!this.isFailure(error)) {
      return;
    }
    
    this.failureCount++;
    this.emit(CircuitBreakerEvents.FAILURE, { 
      name: this.options.name, 
      error 
    });
    
    // Add to recent failures and remove old ones outside the window
    const now = new Date();
    this.recentFailures.push(now);
    this.recentFailures = this.recentFailures.filter(
      time => now.getTime() - time.getTime() < this.failureWindowMs
    );
    
    // If we're in half-open state, any failure should open the circuit again
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.open();
      return;
    }
    
    // If we've reached the failure threshold, open the circuit
    if (this.state === CircuitBreakerState.CLOSED && 
        this.recentFailures.length >= this.failureThreshold) {
      this.open();
    }
  }
  
  /**
   * Opens the circuit, preventing further requests.
   */
  private open(): void {
    if (this.state === CircuitBreakerState.OPEN) {
      return;
    }
    
    this.state = CircuitBreakerState.OPEN;
    this.lastStateChange = new Date();
    this.halfOpenSuccessCount = 0;
    
    // Set the next attempt time
    this.nextAttempt = new Date(this.lastStateChange.getTime() + this.resetTimeout);
    
    // Schedule the circuit to half-open after the reset timeout
    this.resetTimer = setTimeout(() => this.halfOpen(), this.resetTimeout);
    
    this.emit(CircuitBreakerEvents.OPEN, { 
      name: this.options.name,
      lastStateChange: this.lastStateChange,
      nextAttempt: this.nextAttempt
    });
  }
  
  /**
   * Transitions the circuit to half-open state to test if the dependency has recovered.
   */
  private halfOpen(): void {
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      return;
    }
    
    this.state = CircuitBreakerState.HALF_OPEN;
    this.lastStateChange = new Date();
    this.halfOpenSuccessCount = 0;
    this.nextAttempt = null;
    
    this.emit(CircuitBreakerEvents.HALF_OPEN, { 
      name: this.options.name,
      lastStateChange: this.lastStateChange
    });
  }
  
  /**
   * Closes the circuit, allowing requests to pass through normally.
   */
  private close(): void {
    if (this.state === CircuitBreakerState.CLOSED) {
      return;
    }
    
    this.state = CircuitBreakerState.CLOSED;
    this.lastStateChange = new Date();
    this.halfOpenSuccessCount = 0;
    this.recentFailures = [];
    this.nextAttempt = null;
    
    // Clear any pending reset timer
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
    
    this.emit(CircuitBreakerEvents.CLOSE, { 
      name: this.options.name,
      lastStateChange: this.lastStateChange
    });
  }
  
  /**
   * Manually resets the circuit breaker to closed state.
   * This can be used to force the circuit closed after fixing a known issue.
   */
  reset(): void {
    this.close();
  }
  
  /**
   * Starts the health check timer if a health check function is provided.
   */
  private startHealthCheck(): void {
    if (!this.healthCheck) {
      return;
    }
    
    // Clear any existing timer
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    // Start a new timer
    this.healthCheckTimer = setInterval(async () => {
      try {
        // Only perform health checks when the circuit is open
        if (this.state === CircuitBreakerState.OPEN) {
          const isHealthy = await this.healthCheck!();
          
          this.emit(CircuitBreakerEvents.HEALTH_CHECK_STATUS, { 
            name: this.options.name,
            isHealthy
          });
          
          // If the dependency is healthy, transition to half-open
          if (isHealthy) {
            this.halfOpen();
          }
        }
      } catch (error) {
        // Health check itself failed, consider the dependency still unhealthy
        this.emit(CircuitBreakerEvents.HEALTH_CHECK_STATUS, { 
          name: this.options.name,
          isHealthy: false,
          error
        });
      }
    }, this.healthCheckInterval);
  }
  
  /**
   * Stops the health check timer.
   */
  private stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }
  
  /**
   * Gets the current metrics for the circuit breaker.
   * 
   * @returns Current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      successCount: this.successCount,
      failureCount: this.failureCount,
      rejectCount: this.rejectCount,
      halfOpenSuccessCount: this.halfOpenSuccessCount,
      lastStateChange: this.lastStateChange,
      nextAttempt: this.nextAttempt,
      recentFailures: [...this.recentFailures]
    };
  }
  
  /**
   * Gets the current state of the circuit breaker.
   * 
   * @returns Current state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }
  
  /**
   * Cleans up resources when the circuit breaker is no longer needed.
   * This should be called when the circuit breaker is being disposed of.
   */
  dispose(): void {
    // Clear any pending timers
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
    
    this.stopHealthCheck();
    
    // Remove all listeners
    this.removeAllListeners();
  }
}