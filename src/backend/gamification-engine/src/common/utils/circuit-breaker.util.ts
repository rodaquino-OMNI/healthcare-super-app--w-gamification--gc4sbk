/**
 * Circuit Breaker Pattern Implementation
 * 
 * This utility implements the circuit breaker pattern to prevent cascading failures
 * when external dependencies or services fail. It automatically detects repeated failures
 * and temporarily disables problematic operations with fallback mechanisms.
 * 
 * The circuit breaker has three states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is broken, requests fail fast
 * - HALF_OPEN: Testing if the service has recovered
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Enum representing the possible states of a circuit breaker
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',   // Normal operation, requests pass through
  OPEN = 'OPEN',       // Circuit is broken, requests fail fast
  HALF_OPEN = 'HALF_OPEN', // Testing if the service has recovered
}

/**
 * Interface for circuit breaker configuration options
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in milliseconds to keep the circuit open before moving to half-open */
  resetTimeout: number;
  /** Number of successful calls in half-open state to close the circuit */
  successThreshold: number;
  /** Optional name for the circuit breaker (used in logging) */
  name?: string;
  /** Optional timeout in milliseconds for the protected function call */
  callTimeout?: number;
}

/**
 * Error thrown when the circuit breaker is open
 */
export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Circuit Breaker implementation that protects against cascading failures
 * by automatically detecting repeated failures and temporarily disabling
 * problematic operations with fallback mechanisms.
 */
@Injectable()
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly logger = new Logger(CircuitBreaker.name);

  /**
   * Creates a new CircuitBreaker instance
   * 
   * @param options Configuration options for the circuit breaker
   */
  constructor(private readonly options: CircuitBreakerOptions) {
    this.logger.log(`Circuit breaker '${this.getName()}' initialized with failureThreshold=${options.failureThreshold}, resetTimeout=${options.resetTimeout}ms, successThreshold=${options.successThreshold}`);
  }

  /**
   * Gets the name of this circuit breaker
   */
  public getName(): string {
    return this.options.name || 'unnamed';
  }

  /**
   * Gets the current state of the circuit breaker
   */
  public getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Executes the provided function with circuit breaker protection
   * 
   * @param fn The function to execute
   * @returns The result of the function execution
   * @throws CircuitBreakerOpenError if the circuit is open
   * @throws Original error if the function fails and circuit is not yet open
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.checkState();

    if (this.state === CircuitBreakerState.OPEN) {
      this.logger.warn(`Circuit '${this.getName()}' is OPEN - fast failing request`);
      throw new CircuitBreakerOpenError(`Circuit breaker '${this.getName()}' is open`);
    }

    try {
      const result = await this.executeWithTimeout(fn);
      this.handleSuccess();
      return result;
    } catch (error) {
      this.handleFailure(error);
      throw error;
    }
  }

  /**
   * Executes the provided function with circuit breaker protection and a fallback
   * 
   * @param fn The function to execute
   * @param fallback The fallback function to execute if the circuit is open or the main function fails
   * @returns The result of the function execution or the fallback
   */
  public async executeWithFallback<T>(
    fn: () => Promise<T>,
    fallback: (error: Error) => Promise<T>
  ): Promise<T> {
    try {
      return await this.execute(fn);
    } catch (error) {
      this.logger.warn(
        `Circuit '${this.getName()}' executing fallback due to error: ${error instanceof Error ? error.message : String(error)}`
      );
      return fallback(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Manually resets the circuit breaker to the CLOSED state
   * This can be used for testing or administrative purposes
   */
  public reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.logger.log(`Circuit '${this.getName()}' manually reset to CLOSED state`);
  }

  /**
   * Manually opens the circuit breaker
   * This can be used for testing or administrative purposes
   */
  public trip(): void {
    this.state = CircuitBreakerState.OPEN;
    this.lastFailureTime = Date.now();
    this.logger.warn(`Circuit '${this.getName()}' manually tripped to OPEN state`);
  }

  /**
   * Checks and potentially updates the circuit state based on timing
   */
  private async checkState(): Promise<void> {
    if (
      this.state === CircuitBreakerState.OPEN &&
      Date.now() - this.lastFailureTime >= this.options.resetTimeout
    ) {
      this.state = CircuitBreakerState.HALF_OPEN;
      this.logger.log(`Circuit '${this.getName()}' moved from OPEN to HALF_OPEN state`);
    }
  }

  /**
   * Handles a successful execution
   */
  private handleSuccess(): void {
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      this.logger.debug(
        `Circuit '${this.getName()}' successful call in HALF_OPEN state (${this.successCount}/${this.options.successThreshold})`
      );

      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.logger.log(`Circuit '${this.getName()}' moved from HALF_OPEN to CLOSED state after ${this.options.successThreshold} successful calls`);
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  /**
   * Handles a failed execution
   */
  private handleFailure(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (this.state === CircuitBreakerState.CLOSED) {
      this.failureCount++;
      this.logger.warn(
        `Circuit '${this.getName()}' failure in CLOSED state (${this.failureCount}/${this.options.failureThreshold}): ${errorMessage}`
      );

      if (this.failureCount >= this.options.failureThreshold) {
        this.state = CircuitBreakerState.OPEN;
        this.lastFailureTime = Date.now();
        this.logger.error(
          `Circuit '${this.getName()}' moved from CLOSED to OPEN state after ${this.options.failureThreshold} failures`
        );
      }
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.OPEN;
      this.lastFailureTime = Date.now();
      this.successCount = 0;
      this.logger.warn(
        `Circuit '${this.getName()}' moved from HALF_OPEN to OPEN state after a failure: ${errorMessage}`
      );
    }
  }

  /**
   * Executes a function with an optional timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.options.callTimeout) {
      return fn();
    }

    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Circuit breaker '${this.getName()}' timeout after ${this.options.callTimeout}ms`));
      }, this.options.callTimeout);

      fn()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
}

/**
 * Creates a circuit breaker decorator that can be applied to class methods
 * 
 * @param options Circuit breaker configuration options
 * @returns Method decorator that applies circuit breaker protection
 */
export function WithCircuitBreaker(options: CircuitBreakerOptions) {
  const circuitBreakers = new Map<string, CircuitBreaker>();

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const circuitBreakerName = options.name || `${target.constructor.name}.${propertyKey}`;
    const circuitBreakerOptions = { ...options, name: circuitBreakerName };

    descriptor.value = async function (...args: any[]) {
      // Get or create circuit breaker for this method
      if (!circuitBreakers.has(circuitBreakerName)) {
        circuitBreakers.set(circuitBreakerName, new CircuitBreaker(circuitBreakerOptions));
      }
      const circuitBreaker = circuitBreakers.get(circuitBreakerName)!;

      return circuitBreaker.execute(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Creates a circuit breaker decorator with fallback that can be applied to class methods
 * 
 * @param options Circuit breaker configuration options
 * @param fallbackFn Function that returns a fallback value when the circuit is open or the method fails
 * @returns Method decorator that applies circuit breaker protection with fallback
 */
export function WithCircuitBreakerFallback<T>(
  options: CircuitBreakerOptions,
  fallbackFn: (error: Error, ...args: any[]) => Promise<T> | T
) {
  const circuitBreakers = new Map<string, CircuitBreaker>();

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const circuitBreakerName = options.name || `${target.constructor.name}.${propertyKey}`;
    const circuitBreakerOptions = { ...options, name: circuitBreakerName };

    descriptor.value = async function (...args: any[]) {
      // Get or create circuit breaker for this method
      if (!circuitBreakers.has(circuitBreakerName)) {
        circuitBreakers.set(circuitBreakerName, new CircuitBreaker(circuitBreakerOptions));
      }
      const circuitBreaker = circuitBreakers.get(circuitBreakerName)!;

      return circuitBreaker.executeWithFallback(
        () => originalMethod.apply(this, args),
        async (error) => {
          // Call the fallback function with the error and original arguments
          return fallbackFn.apply(this, [error, ...args]);
        }
      );
    };

    return descriptor;
  };
}

/**
 * Factory function to create a circuit breaker with default options
 * 
 * @param name Name of the circuit breaker
 * @param options Optional circuit breaker configuration options
 * @returns A new CircuitBreaker instance
 */
export function createCircuitBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
  return new CircuitBreaker({
    failureThreshold: options?.failureThreshold ?? 5,
    resetTimeout: options?.resetTimeout ?? 30000, // 30 seconds
    successThreshold: options?.successThreshold ?? 2,
    callTimeout: options?.callTimeout,
    name,
    ...options
  });
}