import { EventEmitter } from 'events';
import { AppException, ErrorType } from '../../../shared/src/exceptions/exceptions.types';

/**
 * Enum representing the possible states of a circuit breaker.
 */
export enum CircuitState {
  /** Normal operation, requests are allowed through */
  CLOSED = 'CLOSED',
  /** Circuit is open, requests fail fast without attempting execution */
  OPEN = 'OPEN',
  /** Testing if the system has recovered, allowing limited requests through */
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Interface for circuit breaker options.
 */
export interface CircuitBreakerOptions {
  /** Number of failures required to trip the circuit */
  failureThreshold: number;
  /** Time in milliseconds to wait before attempting recovery */
  resetTimeout: number;
  /** Maximum number of requests allowed in half-open state */
  halfOpenRequestLimit?: number;
  /** Function to determine if an error should count as a failure */
  isFailure?: (error: Error) => boolean;
  /** Optional name for the circuit breaker (useful for logging and metrics) */
  name?: string;
  /** Optional health check function to test if the service is available */
  healthCheck?: () => Promise<boolean>;
  /** Optional fallback function to provide alternative response when circuit is open */
  fallback?: <T>(error: Error) => Promise<T> | T;
}

/**
 * Interface for circuit breaker metrics.
 */
export interface CircuitBreakerMetrics {
  /** Current state of the circuit */
  state: CircuitState;
  /** Total number of successful requests */
  successCount: number;
  /** Total number of failed requests */
  failureCount: number;
  /** Number of consecutive failures in the current window */
  consecutiveFailures: number;
  /** Number of requests allowed in half-open state */
  halfOpenSuccesses: number;
  /** Timestamp when the circuit was last opened */
  lastOpenTimestamp: number | null;
  /** Timestamp when the circuit was last closed */
  lastClosedTimestamp: number | null;
  /** Timestamp when the circuit last entered half-open state */
  lastHalfOpenTimestamp: number | null;
  /** Name of the circuit breaker */
  name: string;
}

/**
 * Error thrown when a circuit is open and a request is attempted.
 */
export class CircuitOpenError extends AppException {
  constructor(circuitName: string) {
    super(
      `Circuit '${circuitName}' is open - request rejected`,
      ErrorType.EXTERNAL,
      'CIRCUIT_OPEN',
      { circuitName }
    );
    Object.setPrototypeOf(this, CircuitOpenError.prototype);
  }
}

/**
 * Implementation of the Circuit Breaker pattern to prevent cascading failures
 * when interacting with failing services or dependencies.
 * 
 * The circuit breaker has three states:
 * - CLOSED: Normal operation, requests are allowed through
 * - OPEN: Circuit is open, requests fail fast without attempting execution
 * - HALF_OPEN: Testing if the system has recovered, allowing limited requests through
 */
export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private consecutiveFailures: number = 0;
  private halfOpenSuccesses: number = 0;
  private lastOpenTimestamp: number | null = null;
  private lastClosedTimestamp: number | null = null;
  private lastHalfOpenTimestamp: number | null = null;
  private resetTimeoutId: NodeJS.Timeout | null = null;
  
  private readonly options: Required<CircuitBreakerOptions>;
  
  /**
   * Creates a new CircuitBreaker instance.
   * 
   * @param options Configuration options for the circuit breaker
   */
  constructor(options: CircuitBreakerOptions) {
    super();
    
    // Set default options
    this.options = {
      failureThreshold: options.failureThreshold,
      resetTimeout: options.resetTimeout,
      halfOpenRequestLimit: options.halfOpenRequestLimit || 1,
      isFailure: options.isFailure || ((error: Error) => true),
      name: options.name || 'unnamed-circuit',
      healthCheck: options.healthCheck || (async () => true),
      fallback: options.fallback
    };
    
    // Initialize timestamps
    this.lastClosedTimestamp = Date.now();
  }
  
  /**
   * Executes a function with circuit breaker protection.
   * 
   * @param fn The function to execute
   * @returns The result of the function execution
   * @throws CircuitOpenError if the circuit is open
   * @throws The original error if the function execution fails
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // If circuit is open, fail fast or use fallback if provided
      const error = new CircuitOpenError(this.options.name);
      if (this.options.fallback) {
        return this.options.fallback(error);
      }
      throw error;
    }
    
    if (this.state === CircuitState.HALF_OPEN && this.halfOpenSuccesses >= this.options.halfOpenRequestLimit) {
      // If we've reached the half-open request limit, reject additional requests or use fallback
      const error = new CircuitOpenError(this.options.name);
      if (this.options.fallback) {
        return this.options.fallback(error);
      }
      throw error;
    }
    
    try {
      // Execute the function
      const result = await fn();
      
      // Record success
      this.recordSuccess();
      
      return result;
    } catch (error) {
      // Record failure if the error matches our failure criteria
      if (error instanceof Error && this.options.isFailure(error)) {
        this.recordFailure();
        
        // Use fallback if provided
        if (this.options.fallback) {
          return this.options.fallback(error);
        }
      }
      
      // Re-throw the original error
      throw error;
    }
  }
  
  /**
   * Records a successful execution and updates the circuit state if necessary.
   */
  private recordSuccess(): void {
    this.successCount++;
    this.consecutiveFailures = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenSuccesses++;
      
      // If we've had enough successes in half-open state, close the circuit
      if (this.halfOpenSuccesses >= this.options.halfOpenRequestLimit) {
        this.close();
      }
    }
  }
  
  /**
   * Records a failure and updates the circuit state if necessary.
   */
  private recordFailure(): void {
    this.failureCount++;
    this.consecutiveFailures++;
    
    // If we're in half-open state, any failure should reopen the circuit
    if (this.state === CircuitState.HALF_OPEN) {
      this.open();
      return;
    }
    
    // If we've reached the failure threshold, open the circuit
    if (this.state === CircuitState.CLOSED && this.consecutiveFailures >= this.options.failureThreshold) {
      this.open();
    }
  }
  
  /**
   * Opens the circuit, preventing further requests until the reset timeout.
   */
  private open(): void {
    if (this.state !== CircuitState.OPEN) {
      this.state = CircuitState.OPEN;
      this.lastOpenTimestamp = Date.now();
      this.halfOpenSuccesses = 0;
      
      // Clear any existing timeout
      if (this.resetTimeoutId) {
        clearTimeout(this.resetTimeoutId);
      }
      
      // Schedule transition to half-open state after reset timeout
      this.resetTimeoutId = setTimeout(() => this.halfOpen(), this.options.resetTimeout);
      
      // Emit state change event
      this.emit('open', this.getMetrics());
    }
  }
  
  /**
   * Transitions the circuit to half-open state, allowing a limited number of requests through.
   */
  private halfOpen(): void {
    if (this.state === CircuitState.OPEN) {
      this.state = CircuitState.HALF_OPEN;
      this.lastHalfOpenTimestamp = Date.now();
      this.halfOpenSuccesses = 0;
      
      // Emit state change event
      this.emit('half-open', this.getMetrics());
      
      // Optionally perform a health check
      this.performHealthCheck();
    }
  }
  
  /**
   * Closes the circuit, allowing all requests through.
   */
  private close(): void {
    if (this.state !== CircuitState.CLOSED) {
      this.state = CircuitState.CLOSED;
      this.lastClosedTimestamp = Date.now();
      this.consecutiveFailures = 0;
      this.halfOpenSuccesses = 0;
      
      // Clear any existing timeout
      if (this.resetTimeoutId) {
        clearTimeout(this.resetTimeoutId);
        this.resetTimeoutId = null;
      }
      
      // Emit state change event
      this.emit('close', this.getMetrics());
    }
  }
  
  /**
   * Performs a health check to determine if the service is available.
   * If the health check passes, the circuit will be closed.
   * If the health check fails, the circuit will remain open.
   */
  private async performHealthCheck(): Promise<void> {
    if (this.state === CircuitState.HALF_OPEN) {
      try {
        const isHealthy = await this.options.healthCheck();
        
        if (isHealthy) {
          // If health check passes, close the circuit
          this.close();
        } else {
          // If health check fails, reopen the circuit
          this.open();
        }
      } catch (error) {
        // If health check throws an error, reopen the circuit
        this.open();
      }
    }
  }
  
  /**
   * Manually resets the circuit breaker to closed state.
   * Useful for testing or administrative interventions.
   */
  public reset(): void {
    this.close();
    this.failureCount = 0;
    this.successCount = 0;
    this.consecutiveFailures = 0;
    this.emit('reset', this.getMetrics());
  }
  
  /**
   * Manually forces the circuit breaker to open state.
   * Useful for testing or administrative interventions.
   */
  public forceOpen(): void {
    this.open();
  }
  
  /**
   * Returns the current state of the circuit breaker.
   */
  public getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Returns the current metrics of the circuit breaker.
   */
  public getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      successCount: this.successCount,
      failureCount: this.failureCount,
      consecutiveFailures: this.consecutiveFailures,
      halfOpenSuccesses: this.halfOpenSuccesses,
      lastOpenTimestamp: this.lastOpenTimestamp,
      lastClosedTimestamp: this.lastClosedTimestamp,
      lastHalfOpenTimestamp: this.lastHalfOpenTimestamp,
      name: this.options.name
    };
  }
}

/**
 * Creates a circuit breaker with the specified options.
 * 
 * @param options Configuration options for the circuit breaker
 * @returns A new CircuitBreaker instance
 */
export function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
  return new CircuitBreaker(options);
}

/**
 * Creates a circuit breaker with journey-specific configuration.
 * Provides sensible defaults for different journey services.
 * 
 * @param journeyType The type of journey (health, care, plan)
 * @param options Additional configuration options to override defaults
 * @returns A new CircuitBreaker instance configured for the specified journey
 */
export function createJourneyCircuitBreaker(
  journeyType: 'health' | 'care' | 'plan' | 'gamification',
  options: Partial<CircuitBreakerOptions> = {}
): CircuitBreaker {
  // Default configurations for different journey types
  const defaults: Record<string, Partial<CircuitBreakerOptions>> = {
    health: {
      failureThreshold: 3,
      resetTimeout: 10000, // 10 seconds
      halfOpenRequestLimit: 2,
      name: 'health-journey-circuit'
    },
    care: {
      failureThreshold: 5,
      resetTimeout: 15000, // 15 seconds
      halfOpenRequestLimit: 1,
      name: 'care-journey-circuit'
    },
    plan: {
      failureThreshold: 4,
      resetTimeout: 12000, // 12 seconds
      halfOpenRequestLimit: 2,
      name: 'plan-journey-circuit'
    },
    gamification: {
      failureThreshold: 3,
      resetTimeout: 8000, // 8 seconds
      halfOpenRequestLimit: 3,
      name: 'gamification-circuit'
    }
  };
  
  // Merge defaults with provided options
  const mergedOptions = {
    ...defaults[journeyType],
    ...options,
    // Ensure required properties are present
    failureThreshold: options.failureThreshold || defaults[journeyType].failureThreshold,
    resetTimeout: options.resetTimeout || defaults[journeyType].resetTimeout
  } as CircuitBreakerOptions;
  
  return new CircuitBreaker(mergedOptions);
}

/**
 * Wraps a function with circuit breaker protection.
 * 
 * @param fn The function to wrap
 * @param circuitBreaker The circuit breaker to use
 * @param fallback Optional fallback function to provide alternative response when circuit is open
 * @returns A wrapped function that will be executed with circuit breaker protection
 */
export function withCircuitBreaker<T>(
  fn: () => Promise<T>,
  circuitBreaker: CircuitBreaker,
  fallback?: (error: Error) => Promise<T> | T
): () => Promise<T> {
  return async () => {
    try {
      return await circuitBreaker.execute(fn);
    } catch (error) {
      if (error instanceof Error && fallback) {
        return fallback(error);
      }
      throw error;
    }
  };
}