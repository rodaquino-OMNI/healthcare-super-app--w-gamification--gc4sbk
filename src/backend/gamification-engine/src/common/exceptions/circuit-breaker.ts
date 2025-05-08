import { Logger } from '@nestjs/common';
import { ExternalDependencyException } from './external-dependency.exception';

/**
 * @fileoverview
 * Implementation of the Circuit Breaker pattern for external service calls.
 * 
 * The Circuit Breaker pattern prevents cascading failures when external dependencies
 * experience issues. It works by monitoring for failures and, when a threshold is reached,
 * "trips" the circuit to prevent further calls to the failing service. After a timeout
 * period, it allows a test call to determine if the service has recovered.
 * 
 * This implementation provides:
 * - State management (CLOSED, OPEN, HALF_OPEN)
 * - Failure threshold counting
 * - Automatic recovery with configurable timeouts
 * - Decorator pattern for easy application to service methods
 * - Integration with the existing error handling framework
 * 
 * @example Basic usage
 * ```typescript
 * const breaker = new CircuitBreaker('payment-service', {
 *   failureThreshold: 5,
 *   resetTimeout: 30000
 * });
 * 
 * async function processPayment(paymentData) {
 *   return breaker.execute(async () => {
 *     return await paymentService.process(paymentData);
 *   });
 * }
 * ```
 * 
 * @example Using the decorator
 * ```typescript
 * class PaymentService {
 *   @CircuitBreaker.Protect('payment-api')
 *   async processPayment(data: PaymentData): Promise<PaymentResult> {
 *     return this.paymentApi.process(data);
 *   }
 * }
 * ```
 */

/**
 * Possible states of the circuit breaker
 */
export enum CircuitState {
  /** Circuit is closed and requests are allowed through */
  CLOSED = 'CLOSED',
  
  /** Circuit is open and requests are blocked */
  OPEN = 'OPEN',
  
  /** Circuit is allowing a test request to check if the service has recovered */
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Configuration options for the circuit breaker
 */
export interface CircuitBreakerOptions {
  /** Number of failures required to trip the circuit */
  failureThreshold: number;
  
  /** Time in milliseconds to wait before attempting to reset the circuit */
  resetTimeout: number;
  
  /** Time in milliseconds to wait for a response before considering the call a failure */
  requestTimeout?: number;
  
  /** Logger instance for circuit breaker events */
  logger?: Logger;
  
  /** Function to determine if an error should count as a failure */
  isFailure?: (error: Error) => boolean;
  
  /** Function to execute when the circuit trips from CLOSED to OPEN */
  onOpen?: (serviceName: string, failureCount: number) => void;
  
  /** Function to execute when the circuit resets from OPEN to CLOSED */
  onClose?: (serviceName: string) => void;
  
  /** Function to execute when the circuit transitions to HALF_OPEN */
  onHalfOpen?: (serviceName: string) => void;
}

/**
 * Default circuit breaker options
 */
const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  requestTimeout: 10000, // 10 seconds
};

/**
 * Registry of circuit breakers to ensure singletons per service
 */
const circuitRegistry = new Map<string, CircuitBreaker>();

/**
 * Implementation of the Circuit Breaker pattern for external service calls.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private resetTimer: NodeJS.Timeout | null = null;
  private readonly options: CircuitBreakerOptions;
  
  /**
   * Creates a new CircuitBreaker instance
   * 
   * @param serviceName - Name of the service being protected
   * @param options - Configuration options
   */
  constructor(
    private readonly serviceName: string,
    options: Partial<CircuitBreakerOptions> = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * Gets a circuit breaker instance for a service, creating it if it doesn't exist
   * 
   * @param serviceName - Name of the service
   * @param options - Configuration options
   * @returns CircuitBreaker instance
   */
  static getBreaker(serviceName: string, options: Partial<CircuitBreakerOptions> = {}): CircuitBreaker {
    if (!circuitRegistry.has(serviceName)) {
      circuitRegistry.set(serviceName, new CircuitBreaker(serviceName, options));
    }
    return circuitRegistry.get(serviceName)!;
  }
  
  /**
   * Gets the current state of the circuit
   * 
   * @returns Current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Gets the current failure count
   * 
   * @returns Current failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }
  
  /**
   * Executes a function with circuit breaker protection
   * 
   * @param fn - Function to execute
   * @returns Result of the function execution
   * @throws CircuitOpenException if the circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try a reset
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.transitionToHalfOpen();
      } else {
        throw new CircuitOpenException(this.serviceName, this.lastFailureTime, this.options.resetTimeout);
      }
    }
    
    try {
      // Execute the function with timeout if configured
      const result = await this.executeWithTimeout(fn);
      
      // If we're in half-open state and the call succeeded, close the circuit
      if (this.state === CircuitState.HALF_OPEN) {
        this.reset();
      }
      
      return result;
    } catch (error) {
      // Handle the failure
      this.handleFailure(error);
      throw error;
    }
  }
  
  /**
   * Executes a function with an optional timeout
   * 
   * @param fn - Function to execute
   * @returns Result of the function execution
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.options.requestTimeout) {
      return fn();
    }
    
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request to ${this.serviceName} timed out after ${this.options.requestTimeout}ms`));
      }, this.options.requestTimeout);
    });
    
    // Race the function execution against the timeout
    return Promise.race([fn(), timeoutPromise]);
  }
  
  /**
   * Handles a failure by incrementing the failure count and potentially tripping the circuit
   * 
   * @param error - The error that occurred
   */
  private handleFailure(error: Error): void {
    // Check if this error should count as a failure
    if (this.options.isFailure && !this.options.isFailure(error)) {
      return;
    }
    
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    this.options.logger?.warn(
      `Circuit breaker for ${this.serviceName} recorded failure ${this.failureCount}/${this.options.failureThreshold}`,
      { error: error.message, stack: error.stack }
    );
    
    // If we're in half-open state, any failure trips the circuit
    if (this.state === CircuitState.HALF_OPEN) {
      this.trip();
      return;
    }
    
    // If we've reached the failure threshold, trip the circuit
    if (this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold) {
      this.trip();
    }
  }
  
  /**
   * Trips the circuit from CLOSED to OPEN state
   */
  private trip(): void {
    if (this.state === CircuitState.OPEN) {
      return;
    }
    
    this.state = CircuitState.OPEN;
    this.options.logger?.error(
      `Circuit breaker for ${this.serviceName} tripped open after ${this.failureCount} failures`
    );
    
    // Schedule a reset attempt
    this.scheduleReset();
    
    // Call the onOpen callback if provided
    if (this.options.onOpen) {
      this.options.onOpen(this.serviceName, this.failureCount);
    }
  }
  
  /**
   * Schedules a reset attempt after the reset timeout
   */
  private scheduleReset(): void {
    // Clear any existing timer
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    
    // Schedule a transition to half-open state
    this.resetTimer = setTimeout(() => {
      this.transitionToHalfOpen();
    }, this.options.resetTimeout);
  }
  
  /**
   * Transitions the circuit to HALF_OPEN state to test if the service has recovered
   */
  private transitionToHalfOpen(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      return;
    }
    
    this.state = CircuitState.HALF_OPEN;
    this.options.logger?.info(
      `Circuit breaker for ${this.serviceName} transitioning to half-open state`
    );
    
    // Call the onHalfOpen callback if provided
    if (this.options.onHalfOpen) {
      this.options.onHalfOpen(this.serviceName);
    }
  }
  
  /**
   * Resets the circuit to CLOSED state
   */
  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    
    // Clear any existing timer
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    
    this.options.logger?.info(
      `Circuit breaker for ${this.serviceName} reset to closed state`
    );
    
    // Call the onClose callback if provided
    if (this.options.onClose) {
      this.options.onClose(this.serviceName);
    }
  }
  
  /**
   * Manually trips the circuit
   * Useful for testing or when external systems report failures
   */
  forceOpen(): void {
    this.failureCount = this.options.failureThreshold;
    this.lastFailureTime = Date.now();
    this.trip();
  }
  
  /**
   * Manually resets the circuit
   * Useful for testing or when external systems report recovery
   */
  forceReset(): void {
    this.reset();
  }
  
  /**
   * Creates a method decorator that applies circuit breaker protection
   * 
   * @param serviceName - Name of the service being protected
   * @param options - Configuration options
   * @returns Method decorator
   */
  static Protect(serviceName: string, options: Partial<CircuitBreakerOptions> = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        const breaker = CircuitBreaker.getBreaker(serviceName, options);
        return breaker.execute(() => originalMethod.apply(this, args));
      };
      
      return descriptor;
    };
  }
}

/**
 * Exception thrown when a circuit is open and a call is attempted
 */
export class CircuitOpenException extends ExternalDependencyException {
  /**
   * Time when the circuit might reset
   */
  readonly retryAfter: number;
  
  /**
   * Creates a new CircuitOpenException
   * 
   * @param serviceName - Name of the service that is unavailable
   * @param lastFailureTime - Timestamp of the last failure
   * @param resetTimeout - Time in milliseconds before the circuit might reset
   */
  constructor(serviceName: string, lastFailureTime: number, resetTimeout: number) {
    const retryAfter = Math.ceil((lastFailureTime + resetTimeout - Date.now()) / 1000);
    
    super(`Service ${serviceName} is unavailable (circuit open)`, {
      dependencyName: serviceName,
      dependencyType: 'external-service',
      code: 'CIRCUIT_OPEN',
      details: {
        retryAfter,
        lastFailureTime,
        resetTimeout,
      },
      fallbackOptions: {
        hasFallback: false,
      },
    });
    
    this.retryAfter = retryAfter;
  }
}

/**
 * Utility function to execute a function with circuit breaker protection
 * 
 * @param serviceName - Name of the service being protected
 * @param fn - Function to execute
 * @param options - Configuration options
 * @returns Result of the function execution
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  options: Partial<CircuitBreakerOptions> = {}
): Promise<T> {
  const breaker = CircuitBreaker.getBreaker(serviceName, options);
  return breaker.execute(fn);
}

/**
 * Utility function to execute a function with circuit breaker protection and fallback
 * 
 * @param serviceName - Name of the service being protected
 * @param fn - Function to execute
 * @param fallbackFn - Function to execute if the circuit is open or the call fails
 * @param options - Configuration options
 * @returns Result of the function execution or fallback
 */
export async function withCircuitBreakerAndFallback<T, F>(
  serviceName: string,
  fn: () => Promise<T>,
  fallbackFn: (error: Error) => Promise<F>,
  options: Partial<CircuitBreakerOptions> = {}
): Promise<T | F> {
  const breaker = CircuitBreaker.getBreaker(serviceName, options);
  
  try {
    return await breaker.execute(fn);
  } catch (error) {
    return fallbackFn(error);
  }
}

/**
 * Registry of all circuit breakers
 */
export const CircuitBreakerRegistry = {
  /**
   * Gets all registered circuit breakers
   * 
   * @returns Map of service names to circuit breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return new Map(circuitRegistry);
  },
  
  /**
   * Gets a circuit breaker by service name
   * 
   * @param serviceName - Name of the service
   * @returns CircuitBreaker instance or undefined if not found
   */
  get(serviceName: string): CircuitBreaker | undefined {
    return circuitRegistry.get(serviceName);
  },
  
  /**
   * Resets all circuit breakers
   */
  resetAll(): void {
    for (const breaker of circuitRegistry.values()) {
      breaker.forceReset();
    }
  },
};

// Export default for convenient imports
export default CircuitBreaker;