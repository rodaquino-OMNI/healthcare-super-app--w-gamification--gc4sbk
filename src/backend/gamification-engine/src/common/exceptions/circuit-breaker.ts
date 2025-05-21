/**
 * Utility class that implements the circuit breaker pattern for external service calls.
 * Provides state management (closed, open, half-open), failure counting, and automatic
 * recovery to prevent cascading failures when external dependencies experience issues.
 */

import { Logger } from '@nestjs/common';

/**
 * Circuit breaker states.
 */
export enum CircuitState {
  /** Circuit is closed and requests are allowed through */
  CLOSED = 'closed',
  /** Circuit is open and requests are blocked */
  OPEN = 'open',
  /** Circuit is testing if the service has recovered */
  HALF_OPEN = 'half-open'
}

/**
 * Configuration options for the circuit breaker.
 */
export interface CircuitBreakerOptions {
  /** Name of the circuit breaker for logging and metrics */
  name: string;
  /** Number of failures required to trip the circuit */
  failureThreshold: number;
  /** Time in milliseconds to wait before attempting to close the circuit */
  resetTimeout: number;
  /** Number of successful calls required to close the circuit from half-open state */
  successThreshold: number;
  /** Time window in milliseconds to track failures */
  failureWindowMs: number;
  /** Maximum number of requests allowed in half-open state */
  halfOpenMaxRequests: number;
  /** Custom function to determine if an error should count as a failure */
  isFailure?: (error: Error) => boolean;
  /** Logger instance to use */
  logger?: Logger;
}

/**
 * Default circuit breaker options.
 */
export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: Omit<CircuitBreakerOptions, 'name'> = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
  failureWindowMs: 60000, // 1 minute
  halfOpenMaxRequests: 1,
  isFailure: (error: Error) => true, // By default, all errors count as failures
};

/**
 * Result of a circuit breaker execution.
 */
export interface CircuitBreakerResult<T> {
  /** The result of the operation if successful */
  result?: T;
  /** The error that caused the operation to fail */
  error?: Error;
  /** Whether the operation was successful */
  success: boolean;
  /** The state of the circuit after the operation */
  circuitState: CircuitState;
  /** Whether the circuit was short-circuited (request not attempted) */
  shortCircuited: boolean;
}

/**
 * Metadata about a circuit breaker failure.
 */
interface FailureRecord {
  /** Timestamp when the failure occurred */
  timestamp: number;
  /** The error that caused the failure */
  error: Error;
}

/**
 * Implements the circuit breaker pattern to prevent cascading failures
 * when external dependencies experience issues.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: FailureRecord[] = [];
  private successCount = 0;
  private halfOpenRequestCount = 0;
  private nextAttemptTime = 0;
  private readonly options: CircuitBreakerOptions;
  private readonly logger: Logger;

  /**
   * Creates a new circuit breaker instance.
   * 
   * @param options Configuration options for the circuit breaker
   */
  constructor(options: Partial<CircuitBreakerOptions> & { name: string }) {
    this.options = {
      ...DEFAULT_CIRCUIT_BREAKER_OPTIONS,
      ...options,
    };
    this.logger = options.logger || new Logger(`CircuitBreaker:${this.options.name}`);
  }

  /**
   * Executes an operation with circuit breaker protection.
   * 
   * @param operation The operation to execute
   * @returns A promise that resolves to the result of the operation
   */
  async execute<T>(operation: () => Promise<T>): Promise<CircuitBreakerResult<T>> {
    // Update circuit state based on time elapsed
    this.updateState();

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      const error = new Error(`Circuit ${this.options.name} is open`);
      (error as any).circuitBreaker = {
        name: this.options.name,
        state: this.state,
      };

      this.logger.warn(`Circuit ${this.options.name} is open, fast-failing request`, {
        circuitName: this.options.name,
        state: this.state,
        nextAttemptTime: new Date(this.nextAttemptTime).toISOString(),
      });

      return {
        error,
        success: false,
        circuitState: this.state,
        shortCircuited: true,
      };
    }

    // Check if we've reached the maximum number of half-open requests
    if (
      this.state === CircuitState.HALF_OPEN &&
      this.halfOpenRequestCount >= this.options.halfOpenMaxRequests
    ) {
      const error = new Error(
        `Circuit ${this.options.name} is half-open and at max requests`
      );
      (error as any).circuitBreaker = {
        name: this.options.name,
        state: this.state,
      };

      this.logger.warn(
        `Circuit ${this.options.name} is half-open and at max requests, fast-failing`,
        {
          circuitName: this.options.name,
          state: this.state,
          halfOpenRequestCount: this.halfOpenRequestCount,
          maxRequests: this.options.halfOpenMaxRequests,
        }
      );

      return {
        error,
        success: false,
        circuitState: this.state,
        shortCircuited: true,
      };
    }

    // Increment half-open request count if applicable
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenRequestCount++;
      this.logger.debug(
        `Circuit ${this.options.name} is half-open, allowing test request`,
        {
          circuitName: this.options.name,
          state: this.state,
          halfOpenRequestCount: this.halfOpenRequestCount,
          maxRequests: this.options.halfOpenMaxRequests,
        }
      );
    }

    try {
      // Execute the operation
      const result = await operation();

      // Handle success
      this.onSuccess();

      return {
        result,
        success: true,
        circuitState: this.state,
        shortCircuited: false,
      };
    } catch (error) {
      // Handle failure
      const isFailure = this.options.isFailure
        ? this.options.isFailure(error as Error)
        : true;

      if (isFailure) {
        this.onFailure(error as Error);
      }

      return {
        error: error as Error,
        success: false,
        circuitState: this.state,
        shortCircuited: false,
      };
    }
  }

  /**
   * Gets the current state of the circuit breaker.
   * 
   * @returns The current circuit state
   */
  getState(): CircuitState {
    this.updateState();
    return this.state;
  }

  /**
   * Gets statistics about the circuit breaker.
   * 
   * @returns Circuit breaker statistics
   */
  getStats() {
    this.updateState();
    return {
      name: this.options.name,
      state: this.state,
      failures: this.failures.length,
      failureThreshold: this.options.failureThreshold,
      successCount: this.successCount,
      successThreshold: this.options.successThreshold,
      halfOpenRequestCount: this.halfOpenRequestCount,
      halfOpenMaxRequests: this.options.halfOpenMaxRequests,
      nextAttemptTime: this.nextAttemptTime > 0 ? new Date(this.nextAttemptTime).toISOString() : null,
    };
  }

  /**
   * Manually resets the circuit breaker to the closed state.
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = [];
    this.successCount = 0;
    this.halfOpenRequestCount = 0;
    this.nextAttemptTime = 0;

    this.logger.log(`Circuit ${this.options.name} manually reset to closed state`, {
      circuitName: this.options.name,
      state: this.state,
    });
  }

  /**
   * Manually trips the circuit breaker to the open state.
   * 
   * @param reason Optional reason for tripping the circuit
   */
  trip(reason?: string): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.options.resetTimeout;
    this.halfOpenRequestCount = 0;

    this.logger.warn(
      `Circuit ${this.options.name} manually tripped to open state${reason ? `: ${reason}` : ''}`,
      {
        circuitName: this.options.name,
        state: this.state,
        reason,
        nextAttemptTime: new Date(this.nextAttemptTime).toISOString(),
      }
    );
  }

  /**
   * Updates the circuit state based on time elapsed.
   */
  private updateState(): void {
    const now = Date.now();

    // Remove old failures outside the failure window
    this.failures = this.failures.filter(
      (failure) => now - failure.timestamp <= this.options.failureWindowMs
    );

    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN && now >= this.nextAttemptTime) {
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
      this.halfOpenRequestCount = 0;

      this.logger.log(
        `Circuit ${this.options.name} transitioned from OPEN to HALF_OPEN`,
        {
          circuitName: this.options.name,
          state: this.state,
          resetTimeout: this.options.resetTimeout,
        }
      );
    }
  }

  /**
   * Handles a successful operation.
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failures = [];
        this.successCount = 0;
        this.halfOpenRequestCount = 0;
        this.nextAttemptTime = 0;

        this.logger.log(
          `Circuit ${this.options.name} transitioned from HALF_OPEN to CLOSED after ${this.options.successThreshold} successful requests`,
          {
            circuitName: this.options.name,
            state: this.state,
            successCount: this.successCount,
            successThreshold: this.options.successThreshold,
          }
        );
      } else {
        this.logger.debug(
          `Circuit ${this.options.name} successful request in HALF_OPEN state (${this.successCount}/${this.options.successThreshold})`,
          {
            circuitName: this.options.name,
            state: this.state,
            successCount: this.successCount,
            successThreshold: this.options.successThreshold,
          }
        );
      }
    }
  }

  /**
   * Handles a failed operation.
   * 
   * @param error The error that caused the failure
   */
  private onFailure(error: Error): void {
    const now = Date.now();

    // Record the failure
    this.failures.push({
      timestamp: now,
      error,
    });

    // Handle failure in HALF_OPEN state
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = now + this.options.resetTimeout;
      this.successCount = 0;
      this.halfOpenRequestCount = 0;

      this.logger.warn(
        `Circuit ${this.options.name} transitioned from HALF_OPEN to OPEN due to failure`,
        {
          circuitName: this.options.name,
          state: this.state,
          error: error.message,
          nextAttemptTime: new Date(this.nextAttemptTime).toISOString(),
        }
      );
    }
    // Handle failure in CLOSED state
    else if (this.state === CircuitState.CLOSED) {
      if (this.failures.length >= this.options.failureThreshold) {
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = now + this.options.resetTimeout;
        this.successCount = 0;

        this.logger.warn(
          `Circuit ${this.options.name} transitioned from CLOSED to OPEN after ${this.failures.length} failures`,
          {
            circuitName: this.options.name,
            state: this.state,
            failures: this.failures.length,
            failureThreshold: this.options.failureThreshold,
            nextAttemptTime: new Date(this.nextAttemptTime).toISOString(),
          }
        );
      } else {
        this.logger.debug(
          `Circuit ${this.options.name} failure in CLOSED state (${this.failures.length}/${this.options.failureThreshold})`,
          {
            circuitName: this.options.name,
            state: this.state,
            failures: this.failures.length,
            failureThreshold: this.options.failureThreshold,
            error: error.message,
          }
        );
      }
    }
  }
}

/**
 * Registry of circuit breakers for reuse across the application.
 */
export class CircuitBreakerRegistry {
  private static circuitBreakers = new Map<string, CircuitBreaker>();

  /**
   * Gets or creates a circuit breaker with the given name and options.
   * 
   * @param name Name of the circuit breaker
   * @param options Optional configuration options
   * @returns The circuit breaker instance
   */
  static getOrCreate(name: string, options: Partial<CircuitBreakerOptions> = {}): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(
        name,
        new CircuitBreaker({ name, ...options })
      );
    }

    return this.circuitBreakers.get(name)!;
  }

  /**
   * Gets all registered circuit breakers.
   * 
   * @returns Map of circuit breaker names to instances
   */
  static getAll(): Map<string, CircuitBreaker> {
    return new Map(this.circuitBreakers);
  }

  /**
   * Gets statistics for all registered circuit breakers.
   * 
   * @returns Array of circuit breaker statistics
   */
  static getAllStats(): Array<ReturnType<CircuitBreaker['getStats']>> {
    return Array.from(this.circuitBreakers.values()).map((cb) => cb.getStats());
  }

  /**
   * Resets all registered circuit breakers.
   */
  static resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
  }
}

/**
 * Options for the CircuitBreaker decorator.
 */
export interface CircuitBreakerDecoratorOptions extends Partial<CircuitBreakerOptions> {
  /** Name of the circuit breaker (defaults to ClassName.methodName) */
  name?: string;
  /** Function to execute when the circuit is open */
  fallback?: (error: Error, ...args: any[]) => any;
}

/**
 * Decorator for applying circuit breaker pattern to class methods.
 * 
 * @param options Circuit breaker options
 * @returns Method decorator
 */
export function WithCircuitBreaker(options: CircuitBreakerDecoratorOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey;
    const circuitName = options.name || `${className}.${methodName}`;
    
    descriptor.value = async function (...args: any[]) {
      const circuitBreaker = CircuitBreakerRegistry.getOrCreate(circuitName, options);
      
      const result = await circuitBreaker.execute(() => originalMethod.apply(this, args));
      
      if (!result.success) {
        if (result.shortCircuited && options.fallback) {
          return options.fallback.call(this, result.error!, ...args);
        }
        throw result.error;
      }
      
      return result.result;
    };
    
    return descriptor;
  };
}

/**
 * Creates a circuit breaker for a specific external dependency.
 * 
 * @param name Name of the external dependency
 * @param options Circuit breaker options
 * @returns Circuit breaker instance
 */
export function createCircuitBreaker(
  name: string,
  options: Partial<CircuitBreakerOptions> = {}
): CircuitBreaker {
  return CircuitBreakerRegistry.getOrCreate(name, options);
}