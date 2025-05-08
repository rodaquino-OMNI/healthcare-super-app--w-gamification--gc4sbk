/**
 * Circuit Breaker Utility
 * 
 * Implements the circuit breaker pattern for managing failures in external dependencies and services.
 * Prevents cascading failures by automatically detecting repeated failures and temporarily
 * disabling problematic operations with fallback mechanisms.
 * 
 * The circuit breaker has three states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is broken, requests fail fast with fallback
 * - HALF-OPEN: Testing if the service has recovered
 */

import { Injectable, Logger } from '@nestjs/common';
import { ExternalDependencyUnavailableError } from '@austa/errors';

/**
 * Enum representing the possible states of a circuit breaker
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',   // Normal operation, requests pass through
  OPEN = 'OPEN',       // Circuit is broken, requests fail fast
  HALF_OPEN = 'HALF_OPEN', // Testing if the service has recovered
}

/**
 * Configuration options for the circuit breaker
 */
export interface CircuitBreakerOptions {
  /** The name of this circuit breaker instance for monitoring and logging */
  name: string;
  
  /** Maximum number of failures before opening the circuit */
  failureThreshold: number;
  
  /** Time window in milliseconds to track failures */
  failureWindowMs: number;
  
  /** Time in milliseconds to wait before attempting recovery (half-open state) */
  resetTimeoutMs: number;
  
  /** Maximum number of requests to allow in half-open state to test recovery */
  halfOpenSuccessThreshold: number;
}

/**
 * Default configuration for the circuit breaker
 */
export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: Omit<CircuitBreakerOptions, 'name'> = {
  failureThreshold: 5,
  failureWindowMs: 10000, // 10 seconds
  resetTimeoutMs: 30000,  // 30 seconds
  halfOpenSuccessThreshold: 3,
};

/**
 * Result of a circuit breaker execution
 */
export interface CircuitBreakerResult<T> {
  /** The result of the operation if successful */
  result?: T;
  
  /** Error that occurred during execution, if any */
  error?: Error;
  
  /** Whether the operation was successful */
  success: boolean;
  
  /** Whether a fallback was used */
  usedFallback: boolean;
  
  /** The current state of the circuit breaker */
  circuitState: CircuitBreakerState;
}

/**
 * Class implementing the circuit breaker pattern
 */
@Injectable()
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private resetTimeout: NodeJS.Timeout | null = null;
  private halfOpenSuccesses: number = 0;
  private readonly options: CircuitBreakerOptions;
  private readonly logger = new Logger(CircuitBreaker.name);

  /**
   * Creates a new CircuitBreaker instance
   * 
   * @param options Configuration options for the circuit breaker
   */
  constructor(options: Partial<CircuitBreakerOptions> & { name: string }) {
    this.options = {
      ...DEFAULT_CIRCUIT_BREAKER_OPTIONS,
      ...options,
    };
    this.logger.log(`Circuit breaker '${this.options.name}' initialized with options: ${JSON.stringify(this.options)}`);
  }

  /**
   * Executes a function with circuit breaker protection
   * 
   * @param fn The function to execute
   * @param fallback Optional fallback function to execute if the circuit is open
   * @returns The result of the function or fallback
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<CircuitBreakerResult<T>> {
    // Record metrics about the current state
    this.recordMetrics();

    // If circuit is open, fail fast
    if (this.state === CircuitBreakerState.OPEN) {
      this.logger.warn(`Circuit '${this.options.name}' is OPEN - failing fast`);
      
      // If fallback is provided, use it
      if (fallback) {
        try {
          const fallbackResult = await fallback();
          return {
            result: fallbackResult,
            success: true,
            usedFallback: true,
            circuitState: this.state,
          };
        } catch (fallbackError) {
          this.logger.error(
            `Fallback for circuit '${this.options.name}' failed: ${fallbackError.message}`,
            fallbackError.stack,
          );
          return {
            error: new ExternalDependencyUnavailableError(
              `Service unavailable (circuit open) and fallback failed: ${fallbackError.message}`,
              { cause: fallbackError },
            ),
            success: false,
            usedFallback: true,
            circuitState: this.state,
          };
        }
      }
      
      // No fallback, return error
      return {
        error: new ExternalDependencyUnavailableError(
          `Service unavailable (circuit open): ${this.options.name}`,
          { context: { circuitBreaker: this.options.name } },
        ),
        success: false,
        usedFallback: false,
        circuitState: this.state,
      };
    }

    // If circuit is half-open, only allow limited requests through
    if (
      this.state === CircuitBreakerState.HALF_OPEN &&
      this.halfOpenSuccesses >= this.options.halfOpenSuccessThreshold
    ) {
      // We've reached our test limit but haven't closed the circuit yet
      // This means we're still waiting for all test requests to complete
      if (fallback) {
        try {
          const fallbackResult = await fallback();
          return {
            result: fallbackResult,
            success: true,
            usedFallback: true,
            circuitState: this.state,
          };
        } catch (fallbackError) {
          return {
            error: new ExternalDependencyUnavailableError(
              `Service unavailable (circuit half-open, at test limit) and fallback failed`,
              { cause: fallbackError },
            ),
            success: false,
            usedFallback: true,
            circuitState: this.state,
          };
        }
      }
      
      return {
        error: new ExternalDependencyUnavailableError(
          `Service unavailable (circuit half-open, at test limit): ${this.options.name}`,
          { context: { circuitBreaker: this.options.name } },
        ),
        success: false,
        usedFallback: false,
        circuitState: this.state,
      };
    }

    // Execute the function
    try {
      const result = await fn();
      
      // Handle success based on current state
      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.halfOpenSuccesses++;
        
        // If we've reached the success threshold, close the circuit
        if (this.halfOpenSuccesses >= this.options.halfOpenSuccessThreshold) {
          this.closeCircuit();
        }
      }
      
      return {
        result,
        success: true,
        usedFallback: false,
        circuitState: this.state,
      };
    } catch (error) {
      // Handle failure
      this.recordFailure();
      
      // If fallback is provided, use it
      if (fallback) {
        try {
          const fallbackResult = await fallback();
          return {
            result: fallbackResult,
            success: true,
            usedFallback: true,
            circuitState: this.state,
          };
        } catch (fallbackError) {
          return {
            error: error,
            success: false,
            usedFallback: true,
            circuitState: this.state,
          };
        }
      }
      
      return {
        error,
        success: false,
        usedFallback: false,
        circuitState: this.state,
      };
    }
  }

  /**
   * Records a failure and potentially opens the circuit
   */
  private recordFailure(): void {
    const now = Date.now();
    
    // Reset failure count if outside the failure window
    if (now - this.lastFailureTime > this.options.failureWindowMs) {
      this.failures = 0;
    }
    
    this.failures++;
    this.lastFailureTime = now;
    
    this.logger.warn(
      `Circuit '${this.options.name}' recorded failure ${this.failures}/${this.options.failureThreshold}`,
    );
    
    // If we're in half-open state, any failure opens the circuit again
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.openCircuit();
      return;
    }
    
    // If we've reached the failure threshold, open the circuit
    if (
      this.state === CircuitBreakerState.CLOSED &&
      this.failures >= this.options.failureThreshold
    ) {
      this.openCircuit();
    }
  }

  /**
   * Opens the circuit and schedules a reset
   */
  private openCircuit(): void {
    if (this.state !== CircuitBreakerState.OPEN) {
      this.state = CircuitBreakerState.OPEN;
      this.logger.warn(`Circuit '${this.options.name}' OPENED due to failures`);
      
      // Clear any existing timeout
      if (this.resetTimeout) {
        clearTimeout(this.resetTimeout);
      }
      
      // Schedule reset to half-open state
      this.resetTimeout = setTimeout(() => {
        this.halfOpenCircuit();
      }, this.options.resetTimeoutMs);
    }
  }

  /**
   * Transitions the circuit to half-open state to test recovery
   */
  private halfOpenCircuit(): void {
    if (this.state === CircuitBreakerState.OPEN) {
      this.state = CircuitBreakerState.HALF_OPEN;
      this.halfOpenSuccesses = 0;
      this.logger.log(`Circuit '${this.options.name}' transitioned to HALF_OPEN state`);
    }
  }

  /**
   * Closes the circuit, returning to normal operation
   */
  private closeCircuit(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failures = 0;
    this.halfOpenSuccesses = 0;
    this.logger.log(`Circuit '${this.options.name}' CLOSED - returning to normal operation`);
    
    // Clear any existing timeout
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }
  }

  /**
   * Records metrics about the circuit breaker state for monitoring
   */
  private recordMetrics(): void {
    // This would integrate with the monitoring system
    // For now, we'll just log the state
    // In a real implementation, this would emit metrics to Prometheus/Datadog/etc.
    // Example: prometheus.gauge('circuit_breaker_state', {name: this.options.name}).set(stateValue);
  }

  /**
   * Gets the current state of the circuit breaker
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Gets the current failure count
   */
  getFailureCount(): number {
    return this.failures;
  }

  /**
   * Manually resets the circuit breaker to closed state
   * Useful for testing or administrative intervention
   */
  reset(): void {
    this.closeCircuit();
    this.logger.log(`Circuit '${this.options.name}' manually reset to CLOSED state`);
  }
}

/**
 * Factory function to create a circuit breaker with the given options
 * 
 * @param options Configuration options for the circuit breaker
 * @returns A new CircuitBreaker instance
 */
export function createCircuitBreaker(
  options: Partial<CircuitBreakerOptions> & { name: string },
): CircuitBreaker {
  return new CircuitBreaker(options);
}

/**
 * Type for a function that can be wrapped with circuit breaker protection
 */
type CircuitBreakerFunction<T, Args extends any[]> = (
  ...args: Args
) => Promise<T>;

/**
 * Type for a fallback function
 */
type FallbackFunction<T, Args extends any[]> = (
  error: Error,
  ...args: Args
) => Promise<T>;

/**
 * Wraps a function with circuit breaker protection
 * 
 * @param circuitBreaker The circuit breaker to use
 * @param fn The function to wrap
 * @param fallback Optional fallback function to use if the circuit is open
 * @returns A wrapped function with circuit breaker protection
 */
export function withCircuitBreaker<T, Args extends any[]>(
  circuitBreaker: CircuitBreaker,
  fn: CircuitBreakerFunction<T, Args>,
  fallback?: FallbackFunction<T, Args>,
): CircuitBreakerFunction<T, Args> {
  return async (...args: Args): Promise<T> => {
    const result = await circuitBreaker.execute<T>(
      () => fn(...args),
      fallback
        ? async () => {
            // If there's an error from the original function, it will be in the closure
            // We'll create a generic error if one doesn't exist
            const error = new ExternalDependencyUnavailableError(
              `Service unavailable: ${circuitBreaker.getState()}`,
            );
            return fallback(error, ...args);
          }
        : undefined,
    );

    if (!result.success) {
      throw result.error;
    }

    return result.result as T;
  };
}

/**
 * Decorator factory for applying circuit breaker pattern to class methods
 * 
 * @param circuitBreaker The circuit breaker to use
 * @param fallbackMethod Optional name of a method in the same class to use as fallback
 * @returns A method decorator
 */
export function UseCircuitBreaker(
  circuitBreaker: CircuitBreaker,
  fallbackMethod?: string,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const fallback = fallbackMethod
        ? async (error: Error) => {
            if (typeof this[fallbackMethod] !== 'function') {
              throw new Error(
                `Fallback method '${fallbackMethod}' is not a function`,
              );
            }
            return this[fallbackMethod](error, ...args);
          }
        : undefined;

      const result = await circuitBreaker.execute(
        () => originalMethod.apply(this, args),
        fallback,
      );

      if (!result.success) {
        throw result.error;
      }

      return result.result;
    };

    return descriptor;
  };
}

/**
 * Registry of circuit breakers for the application
 * Provides a centralized way to access and manage circuit breakers
 */
@Injectable()
export class CircuitBreakerRegistry {
  private readonly circuitBreakers = new Map<string, CircuitBreaker>();
  private readonly logger = new Logger(CircuitBreakerRegistry.name);

  /**
   * Gets or creates a circuit breaker with the given name and options
   * 
   * @param name The name of the circuit breaker
   * @param options Optional configuration options
   * @returns The circuit breaker instance
   */
  getOrCreate(name: string, options?: Partial<Omit<CircuitBreakerOptions, 'name'>>): CircuitBreaker {
    if (this.circuitBreakers.has(name)) {
      return this.circuitBreakers.get(name)!;
    }

    const circuitBreaker = new CircuitBreaker({
      name,
      ...options,
    });

    this.circuitBreakers.set(name, circuitBreaker);
    this.logger.log(`Created new circuit breaker: ${name}`);
    
    return circuitBreaker;
  }

  /**
   * Gets a circuit breaker by name
   * 
   * @param name The name of the circuit breaker
   * @returns The circuit breaker instance or undefined if not found
   */
  get(name: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(name);
  }

  /**
   * Gets all circuit breakers
   * 
   * @returns A map of all circuit breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.circuitBreakers);
  }

  /**
   * Resets all circuit breakers to closed state
   */
  resetAll(): void {
    for (const [name, circuitBreaker] of this.circuitBreakers.entries()) {
      circuitBreaker.reset();
      this.logger.log(`Reset circuit breaker: ${name}`);
    }
  }

  /**
   * Gets the status of all circuit breakers
   * 
   * @returns An object with the status of all circuit breakers
   */
  getStatus(): Record<string, { state: CircuitBreakerState; failures: number }> {
    const status: Record<string, { state: CircuitBreakerState; failures: number }> = {};
    
    for (const [name, circuitBreaker] of this.circuitBreakers.entries()) {
      status[name] = {
        state: circuitBreaker.getState(),
        failures: circuitBreaker.getFailureCount(),
      };
    }
    
    return status;
  }
}