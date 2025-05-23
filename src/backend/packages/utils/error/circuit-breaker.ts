import { EventEmitter } from 'events';
import { ErrorType, AppException } from '../../../shared/src/exceptions/exceptions.types';

/**
 * Enum representing the possible states of a circuit breaker.
 */
export enum CircuitState {
  /** Normal operation, requests pass through to the service */
  CLOSED = 'CLOSED',
  /** Circuit is tripped, requests fail fast without calling the service */
  OPEN = 'OPEN',
  /** Testing if the service has recovered by allowing limited requests */
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Interface for circuit breaker options.
 */
export interface CircuitBreakerOptions {
  /** Name of the circuit breaker for identification in logs and metrics */
  name: string;
  /** Number of consecutive failures required to trip the circuit */
  failureThreshold: number;
  /** Time in milliseconds that the circuit stays open before moving to half-open */
  resetTimeout: number;
  /** Maximum number of requests allowed in half-open state */
  halfOpenRequestLimit?: number;
  /** Timeout in milliseconds for the protected function call */
  requestTimeout?: number;
  /** Custom function to determine if an error should count as a failure */
  isFailure?: (error: Error) => boolean;
  /** Custom health check function to test if service is available */
  healthCheck?: () => Promise<boolean>;
}

/**
 * Interface for circuit breaker metrics.
 */
export interface CircuitBreakerMetrics {
  /** Current state of the circuit breaker */
  state: CircuitState;
  /** Total number of successful requests */
  successCount: number;
  /** Total number of failed requests */
  failureCount: number;
  /** Number of consecutive failures */
  consecutiveFailures: number;
  /** Total number of rejected requests (when circuit is open) */
  rejectCount: number;
  /** Timestamp of the last state change */
  lastStateChange: Date;
  /** Timestamp of the last failure */
  lastFailureTime: Date | null;
  /** Timestamp of the last success */
  lastSuccessTime: Date | null;
}

/**
 * Error thrown when the circuit breaker is open and rejects a request.
 */
export class CircuitBreakerOpenError extends AppException {
  constructor(circuitName: string) {
    super(
      `Circuit breaker '${circuitName}' is open - service unavailable`,
      ErrorType.EXTERNAL,
      'CIRCUIT_BREAKER_OPEN',
      { circuitName }
    );
  }
}

/**
 * Error thrown when a request times out.
 */
export class CircuitBreakerTimeoutError extends AppException {
  constructor(circuitName: string, timeoutMs: number) {
    super(
      `Request timed out after ${timeoutMs}ms in circuit '${circuitName}'`,
      ErrorType.EXTERNAL,
      'CIRCUIT_BREAKER_TIMEOUT',
      { circuitName, timeoutMs }
    );
  }
}

/**
 * Implementation of the Circuit Breaker pattern to prevent cascading failures
 * when interacting with failing services or dependencies.
 * 
 * The circuit breaker has three states:
 * - CLOSED: Normal operation, requests pass through to the service
 * - OPEN: Circuit is tripped, requests fail fast without calling the service
 * - HALF_OPEN: Testing if the service has recovered by allowing limited requests
 *
 * This implementation includes:
 * - Configurable failure thresholds and reset timeouts
 * - Support for custom health check functions
 * - Metrics tracking for monitoring circuit status
 * - Event emitters for circuit state changes
 * - Timeout handling for protected function calls
 *
 * @example
 * // Basic usage
 * const breaker = new CircuitBreaker({
 *   name: 'paymentService',
 *   failureThreshold: 3,
 *   resetTimeout: 10000 // 10 seconds
 * });
 * 
 * try {
 *   const result = await breaker.execute(() => paymentService.processPayment(payment));
 *   // Handle successful result
 * } catch (error) {
 *   if (error instanceof CircuitBreakerOpenError) {
 *     // Handle service unavailable
 *     return fallbackPaymentProcess(payment);
 *   }
 *   // Handle other errors
 * }
 *
 * @example
 * // Using the factory function
 * const processPayment = CircuitBreaker.createBreaker(
 *   {
 *     name: 'paymentService',
 *     failureThreshold: 3,
 *     resetTimeout: 10000,
 *     requestTimeout: 5000 // 5 seconds timeout for requests
 *   },
 *   (payment) => paymentService.processPayment(payment)
 * );
 * 
 * try {
 *   const result = await processPayment(payment);
 *   // Handle successful result
 * } catch (error) {
 *   // Handle errors
 * }
 *
 * @example
 * // Listening to events
 * breaker.on('open', (data) => {
 *   console.log(`Circuit ${data.circuitName} is now open after ${data.failureCount} failures`);
 *   metrics.recordCircuitOpen(data.circuitName);
 * });
 * 
 * breaker.on('close', (data) => {
 *   console.log(`Circuit ${data.circuitName} is now closed`);
 *   metrics.recordCircuitClose(data.circuitName);
 * });
 */
export class CircuitBreaker extends EventEmitter {
  private readonly options: Required<CircuitBreakerOptions>;
  private state: CircuitState = CircuitState.CLOSED;
  private consecutiveFailures: number = 0;
  private successCount: number = 0;
  private failureCount: number = 0;
  private rejectCount: number = 0;
  private lastFailureTime: Date | null = null;
  private lastSuccessTime: Date | null = null;
  private lastStateChange: Date = new Date();
  private halfOpenAllowedRequests: number = 0;
  private resetTimer: NodeJS.Timeout | null = null;

  /**
   * Creates a new CircuitBreaker instance.
   * 
   * @param options Configuration options for the circuit breaker
   */
  constructor(options: CircuitBreakerOptions) {
    super();
    this.options = {
      name: options.name,
      failureThreshold: options.failureThreshold,
      resetTimeout: options.resetTimeout,
      halfOpenRequestLimit: options.halfOpenRequestLimit || 1,
      requestTimeout: options.requestTimeout || 30000, // Default 30 seconds
      isFailure: options.isFailure || ((error: Error) => true),
      healthCheck: options.healthCheck || (() => Promise.resolve(true))
    };
  }

  /**
   * Executes the provided function with circuit breaker protection.
   * 
   * @param fn The function to execute with circuit breaker protection
   * @returns A promise that resolves with the result of the function or rejects with an error
   * @throws {CircuitBreakerOpenError} When the circuit is open
   * @throws {CircuitBreakerTimeoutError} When the request times out
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      this.rejectCount++;
      this.emit('rejected', { circuitName: this.options.name });
      throw new CircuitBreakerOpenError(this.options.name);
    }

    if (this.state === CircuitState.HALF_OPEN && this.halfOpenAllowedRequests <= 0) {
      this.rejectCount++;
      this.emit('rejected', { circuitName: this.options.name });
      throw new CircuitBreakerOpenError(this.options.name);
    }

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenAllowedRequests--;
    }

    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Executes a function with a timeout.
   * 
   * @param fn The function to execute
   * @returns A promise that resolves with the result of the function or rejects with a timeout error
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new CircuitBreakerTimeoutError(this.options.name, this.options.requestTimeout));
      }, this.options.requestTimeout);

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

  /**
   * Handles successful execution of the protected function.
   */
  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();
    this.consecutiveFailures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.reset();
    }

    this.emit('success', { circuitName: this.options.name });
  }

  /**
   * Handles failure of the protected function.
   * 
   * @param error The error that occurred
   */
  private onFailure(error: Error): void {
    if (!this.options.isFailure(error)) {
      return;
    }

    this.failureCount++;
    this.lastFailureTime = new Date();
    this.consecutiveFailures++;

    this.emit('failure', { 
      circuitName: this.options.name, 
      error, 
      consecutiveFailures: this.consecutiveFailures 
    });

    if (
      (this.state === CircuitState.CLOSED && this.consecutiveFailures >= this.options.failureThreshold) ||
      this.state === CircuitState.HALF_OPEN
    ) {
      this.trip();
    }
  }

  /**
   * Trips the circuit breaker, moving it to the OPEN state.
   */
  private trip(): void {
    if (this.state !== CircuitState.OPEN) {
      this.changeState(CircuitState.OPEN);
      this.emit('open', { 
        circuitName: this.options.name, 
        failureCount: this.consecutiveFailures 
      });

      this.scheduleReset();
    }
  }

  /**
   * Schedules a reset of the circuit breaker after the reset timeout.
   */
  private scheduleReset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      this.halfOpen();
    }, this.options.resetTimeout);
  }

  /**
   * Moves the circuit breaker to the HALF_OPEN state to test if the service has recovered.
   */
  private async halfOpen(): Promise<void> {
    try {
      const isHealthy = await this.options.healthCheck();
      if (isHealthy) {
        this.changeState(CircuitState.HALF_OPEN);
        this.halfOpenAllowedRequests = this.options.halfOpenRequestLimit;
        this.emit('half-open', { circuitName: this.options.name });
      } else {
        this.scheduleReset();
      }
    } catch (error) {
      this.scheduleReset();
    }
  }

  /**
   * Resets the circuit breaker to the CLOSED state.
   */
  private reset(): void {
    this.changeState(CircuitState.CLOSED);
    this.consecutiveFailures = 0;
    this.emit('close', { circuitName: this.options.name });
  }

  /**
   * Changes the state of the circuit breaker.
   * 
   * @param newState The new state to change to
   */
  private changeState(newState: CircuitState): void {
    this.state = newState;
    this.lastStateChange = new Date();
    this.emit('state-change', { 
      circuitName: this.options.name, 
      oldState: this.state, 
      newState 
    });
  }

  /**
   * Manually forces the circuit breaker to the OPEN state.
   */
  public forceOpen(): void {
    this.trip();
  }

  /**
   * Manually forces the circuit breaker to the CLOSED state.
   */
  public forceClose(): void {
    this.reset();
  }

  /**
   * Gets the current state of the circuit breaker.
   * 
   * @returns The current state
   */
  public getState(): CircuitState {
    return this.state;
  }

  /**
   * Gets the current metrics of the circuit breaker.
   * 
   * @returns The current metrics
   */
  public getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      successCount: this.successCount,
      failureCount: this.failureCount,
      consecutiveFailures: this.consecutiveFailures,
      rejectCount: this.rejectCount,
      lastStateChange: this.lastStateChange,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime
    };
  }

  /**
   * Creates a factory function that wraps a service call with the circuit breaker.
   * 
   * @param fn The function to wrap with circuit breaker protection
   * @returns A wrapped function that executes with circuit breaker protection
   */
  public static createBreaker<T, Args extends any[]>(
    options: CircuitBreakerOptions,
    fn: (...args: Args) => Promise<T>
  ): (...args: Args) => Promise<T> {
    const breaker = new CircuitBreaker(options);
    
    return async (...args: Args): Promise<T> => {
      return breaker.execute(() => fn(...args));
    };
  }
}