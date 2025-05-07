/**
 * Circuit Breaker Utility for API Gateway
 * 
 * This utility implements the circuit breaker pattern to prevent cascading failures
 * when downstream services experience issues. It provides failure detection,
 * temporary service isolation, and automatic recovery mechanisms.
 * 
 * Key features:
 * - Configurable thresholds for failure detection
 * - Automatic recovery with exponential backoff
 * - Integration with existing error handling
 * - Support for metrics collection
 * - Cached fallback strategies
 * - Health check reporting
 * 
 * @module circuit-breaker
 */

import { HttpStatus, Logger } from '@nestjs/common';
import { transformErrorResponse } from './utils/response-transform.util';
import * as ErrorCodes from 'src/backend/shared/src/constants/error-codes.constants';

/**
 * Enum representing the possible states of a circuit breaker.
 */
export enum CircuitState {
  /** Normal operation, requests pass through to the service */
  CLOSED = 'CLOSED',
  /** Circuit is tripped, requests are immediately rejected */
  OPEN = 'OPEN',
  /** Testing if the service has recovered */
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Error class for circuit breaker failures.
 */
export class CircuitBreakerError extends Error {
  public readonly serviceName: string;
  public readonly state: CircuitState;
  public readonly statusCode: number;
  public readonly errorCode: string;
  
  constructor(serviceName: string, state: CircuitState, message?: string) {
    super(message || `Service ${serviceName} is unavailable (Circuit: ${state})`);
    this.name = 'CircuitBreakerError';
    this.serviceName = serviceName;
    this.state = state;
    this.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
    this.errorCode = ErrorCodes.SYS_SERVICE_UNAVAILABLE;
  }
}

/**
 * Configuration options for the CircuitBreaker.
 */
export interface CircuitBreakerOptions {
  /** The name of the circuit breaker, used for logging and metrics */
  name: string;
  /** The number of failures required to trip the circuit */
  failureThreshold: number;
  /** The time window in milliseconds to track failures */
  failureWindowMs: number;
  /** The time in milliseconds to wait before attempting recovery */
  resetTimeoutMs: number;
  /** The number of successful requests required in half-open state to close the circuit */
  successThreshold: number;
  /** The timeout in milliseconds for requests */
  requestTimeoutMs?: number;
  /** Custom function to determine if an error should count as a failure */
  isFailure?: (error: any) => boolean;
  /** Custom fallback function to execute when the circuit is open */
  fallback?: (error: any) => Promise<any>;
}

/**
 * Default configuration for the CircuitBreaker.
 */
const DEFAULT_OPTIONS: Partial<CircuitBreakerOptions> = {
  failureThreshold: 5,
  failureWindowMs: 10000, // 10 seconds
  resetTimeoutMs: 30000, // 30 seconds
  successThreshold: 2,
  requestTimeoutMs: 5000, // 5 seconds
  isFailure: (error: any) => true, // By default, all errors count as failures
};

/**
 * Implements the circuit breaker pattern to prevent cascading failures when
 * downstream services experience issues.
 * 
 * The circuit breaker has three states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is tripped, requests are immediately rejected
 * - HALF_OPEN: Testing if the service has recovered
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;
  private readonly options: CircuitBreakerOptions;
  private readonly logger: Logger;

  /**
   * Creates a new CircuitBreaker instance.
   * 
   * @param options - Configuration options for the circuit breaker
   */
  constructor(options: Partial<CircuitBreakerOptions> & { name: string }) {
    this.options = { ...DEFAULT_OPTIONS, ...options } as CircuitBreakerOptions;
    this.logger = new Logger(`CircuitBreaker:${this.options.name}`);
    this.logger.log(`Initialized with options: ${JSON.stringify(this.options)}`);
  }

  /**
   * Executes a function through the circuit breaker.
   * 
   * @param fn - The function to execute
   * @returns The result of the function or a rejection if the circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if the circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try recovery
      if (Date.now() >= this.nextAttemptTime) {
        this.logger.log(`Transitioning from OPEN to HALF_OPEN state`);
        this.transitionToHalfOpen();
      } else {
        this.logger.debug(`Circuit is OPEN, fast-failing request`);
        const error = new Error(`Service ${this.options.name} is unavailable`);
        return this.handleRejection(error);
      }
    }

    try {
      // Execute the function with a timeout if configured
      const result = await this.executeWithTimeout(fn);

      // Handle success
      this.handleSuccess();
      return result;
    } catch (error) {
      // Handle failure
      return this.handleFailure(error);
    }
  }

  /**
   * Executes a function with a timeout.
   * 
   * @param fn - The function to execute
   * @returns The result of the function
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.options.requestTimeoutMs) {
      return fn();
    }

    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request to ${this.options.name} timed out after ${this.options.requestTimeoutMs}ms`));
        }, this.options.requestTimeoutMs);
      })
    ]);
  }

  /**
   * Handles a successful request.
   */
  private handleSuccess(): void {
    const now = Date.now();

    // Reset failure count if outside the failure window
    if (now - this.lastFailureTime > this.options.failureWindowMs) {
      this.failures = 0;
    }

    // If in half-open state, increment success counter
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      this.logger.debug(`Success in HALF_OPEN state, success count: ${this.successes}/${this.options.successThreshold}`);

      // If we've reached the success threshold, close the circuit
      if (this.successes >= this.options.successThreshold) {
        this.logger.log(`Success threshold reached, transitioning from HALF_OPEN to CLOSED state`);
        this.transitionToClosed();
      }
    }
  }

  /**
   * Handles a failed request.
   * 
   * @param error - The error that occurred
   * @returns A rejected promise with the error
   */
  private async handleFailure(error: any): Promise<never> {
    const now = Date.now();
    const isFailure = this.options.isFailure ? this.options.isFailure(error) : true;

    // If this error doesn't count as a failure, just propagate it
    if (!isFailure) {
      throw error;
    }

    // Reset failure count if outside the failure window
    if (now - this.lastFailureTime > this.options.failureWindowMs) {
      this.failures = 0;
    }

    // Update failure tracking
    this.failures++;
    this.lastFailureTime = now;
    this.logger.debug(`Failure detected, count: ${this.failures}/${this.options.failureThreshold}`);

    // If in half-open state, any failure trips the circuit
    if (this.state === CircuitState.HALF_OPEN) {
      this.logger.log(`Failure in HALF_OPEN state, transitioning back to OPEN state`);
      this.transitionToOpen();
    }
    // If closed but we've hit the threshold, trip the circuit
    else if (this.state === CircuitState.CLOSED && this.failures >= this.options.failureThreshold) {
      this.logger.log(`Failure threshold reached, transitioning from CLOSED to OPEN state`);
      this.transitionToOpen();
    }

    return this.handleRejection(error);
  }

  /**
   * Handles a rejection when the circuit is open or a request fails.
   * 
   * @param error - The error that occurred
   * @returns The result of the fallback function or a rejected promise
   */
  private async handleRejection(error: any): Promise<never> {
    // If a fallback is provided, use it
    if (this.options.fallback) {
      try {
        return await this.options.fallback(error);
      } catch (fallbackError) {
        this.logger.error(`Fallback function failed: ${fallbackError.message}`, fallbackError.stack);
        throw fallbackError;
      }
    }

    // If the circuit is open, create a specific circuit breaker error
    if (this.state === CircuitState.OPEN) {
      const circuitError = new CircuitBreakerError(
        this.options.name,
        this.state,
        `Service ${this.options.name} is unavailable (Circuit: ${this.state})`
      );
      
      // Add original error as cause if available
      if (error instanceof Error) {
        circuitError.cause = error;
      }
      
      throw circuitError;
    }

    // Enhance the error with circuit breaker information
    if (error instanceof Error) {
      error.message = `[CircuitBreaker:${this.options.name}] ${error.message}`;
    }

    throw error;
  }

  /**
   * Transitions the circuit to the OPEN state.
   */
  private transitionToOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.options.resetTimeoutMs;
    this.logger.log(`Circuit OPEN until ${new Date(this.nextAttemptTime).toISOString()}`);
    
    // Record state change in metrics
    getCircuitBreakerMetricsCollector().recordStateChange(
      this.options.name,
      previousState,
      CircuitState.OPEN
    );
  }

  /**
   * Transitions the circuit to the HALF_OPEN state.
   */
  private transitionToHalfOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.HALF_OPEN;
    this.successes = 0;
    
    // Record state change in metrics
    getCircuitBreakerMetricsCollector().recordStateChange(
      this.options.name,
      previousState,
      CircuitState.HALF_OPEN
    );
  }

  /**
   * Transitions the circuit to the CLOSED state.
   */
  private transitionToClosed(): void {
    const previousState = this.state;
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    
    // Record state change in metrics
    getCircuitBreakerMetricsCollector().recordStateChange(
      this.options.name,
      previousState,
      CircuitState.CLOSED
    );
  }

  /**
   * Gets the current state of the circuit breaker.
   * 
   * @returns The current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Resets the circuit breaker to the CLOSED state.
   */
  reset(): void {
    this.logger.log(`Manually resetting circuit to CLOSED state`);
    this.transitionToClosed();
  }

  /**
   * Gets health check information for the circuit breaker.
   * 
   * @returns Health check information
   */
  getHealth(): {
    name: string;
    state: CircuitState;
    failures: number;
    failureThreshold: number;
    lastFailureTime: string | null;
    nextAttemptTime: string | null;
    healthy: boolean;
  } {
    return {
      name: this.options.name,
      state: this.state,
      failures: this.failures,
      failureThreshold: this.options.failureThreshold,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      nextAttemptTime: this.nextAttemptTime ? new Date(this.nextAttemptTime).toISOString() : null,
      healthy: this.state === CircuitState.CLOSED,
    };
  }
}

/**
 * A registry of circuit breakers to ensure we reuse instances for the same service.
 */
const circuitBreakerRegistry = new Map<string, CircuitBreaker>();

/**
 * Gets health information for all registered circuit breakers.
 * 
 * @returns An array of health check information for all circuit breakers
 */
export function getAllCircuitBreakersHealth(): Array<{
  name: string;
  state: CircuitState;
  failures: number;
  failureThreshold: number;
  lastFailureTime: string | null;
  nextAttemptTime: string | null;
  healthy: boolean;
}> {
  const health: ReturnType<typeof getAllCircuitBreakersHealth> = [];
  
  circuitBreakerRegistry.forEach(circuitBreaker => {
    health.push(circuitBreaker.getHealth());
  });
  
  return health;
}

/**
 * Gets or creates a circuit breaker for a service.
 * 
 * @param options - Configuration options for the circuit breaker
 * @returns A circuit breaker instance
 */
export function getCircuitBreaker(options: Partial<CircuitBreakerOptions> & { name: string }): CircuitBreaker {
  if (!circuitBreakerRegistry.has(options.name)) {
    circuitBreakerRegistry.set(options.name, new CircuitBreaker(options));
  }
  return circuitBreakerRegistry.get(options.name)!;
}

/**
 * Executes a function through a circuit breaker.
 * 
 * @param fn - The function to execute
 * @param options - Configuration options for the circuit breaker
 * @returns The result of the function
 */
export async function executeWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  options: Partial<CircuitBreakerOptions> & { name: string }
): Promise<T> {
  const circuitBreaker = getCircuitBreaker(options);
  return circuitBreaker.execute(fn);
}

/**
 * Creates a wrapper function that executes a service call through a circuit breaker.
 * 
 * @param serviceFn - The service function to wrap
 * @param options - Configuration options for the circuit breaker
 * @returns A wrapped function that uses the circuit breaker
 */
export function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  serviceFn: T,
  options: Partial<CircuitBreakerOptions> & { name: string }
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return executeWithCircuitBreaker(() => serviceFn(...args), options);
  };
}

/**
 * Default circuit breaker options for different types of services.
 */
export const CircuitBreakerDefaults = {
  /**
   * Default options for API services.
   */
  API: {
    failureThreshold: 5,
    failureWindowMs: 10000, // 10 seconds
    resetTimeoutMs: 30000, // 30 seconds
    successThreshold: 2,
    requestTimeoutMs: 5000, // 5 seconds
    isFailure: (error: any) => {
      // Don't count 4xx errors (except 429) as circuit breaker failures
      if (error.response && error.response.status) {
        const status = error.response.status;
        return status >= 500 || status === 429;
      }
      return true;
    },
  },

  /**
   * Default options for database services.
   */
  DATABASE: {
    failureThreshold: 3,
    failureWindowMs: 5000, // 5 seconds
    resetTimeoutMs: 15000, // 15 seconds
    successThreshold: 3,
    requestTimeoutMs: 3000, // 3 seconds
  },

  /**
   * Default options for authentication services.
   */
  AUTH: {
    failureThreshold: 10,
    failureWindowMs: 60000, // 1 minute
    resetTimeoutMs: 120000, // 2 minutes
    successThreshold: 5,
    requestTimeoutMs: 10000, // 10 seconds
    isFailure: (error: any) => {
      // Don't count authentication failures as circuit breaker failures
      if (error.response && error.response.status) {
        const status = error.response.status;
        return status !== 401 && status !== 403;
      }
      return true;
    },
  },

  /**
   * Default options for journey services.
   */
  JOURNEY: {
    failureThreshold: 5,
    failureWindowMs: 30000, // 30 seconds
    resetTimeoutMs: 60000, // 1 minute
    successThreshold: 3,
    requestTimeoutMs: 8000, // 8 seconds
  },
};

/**
 * Creates a circuit breaker with default options for a specific service type.
 * 
 * @param name - The name of the service
 * @param type - The type of service (API, DATABASE, AUTH, JOURNEY)
 * @param overrides - Optional overrides for the default options
 * @returns A circuit breaker instance
 */
export function createServiceCircuitBreaker(
  name: string,
  type: keyof typeof CircuitBreakerDefaults,
  overrides: Partial<CircuitBreakerOptions> = {}
): CircuitBreaker {
  const defaultOptions = CircuitBreakerDefaults[type];
  return getCircuitBreaker({
    name,
    ...defaultOptions,
    ...overrides,
  });
}

/**
 * Cache for storing fallback data.
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const fallbackCache = new Map<string, CacheEntry<any>>();

/**
 * Creates a fallback function that returns cached data.
 * 
 * @param key - The cache key
 * @param defaultValue - The default value to return if no cached data is available
 * @param ttlMs - The time-to-live for the cached data in milliseconds
 * @returns A fallback function
 */
export function createCachedFallback<T>(
  key: string,
  defaultValue: T,
  ttlMs: number = 60000 // 1 minute default
): (error: any) => Promise<T> {
  return async (error: any): Promise<T> => {
    const logger = new Logger('CachedFallback');
    const now = Date.now();
    
    // Check if we have a valid cache entry
    if (fallbackCache.has(key)) {
      const entry = fallbackCache.get(key)!;
      
      // If the entry is still valid, return it
      if (now - entry.timestamp < entry.ttl) {
        logger.debug(`Using cached fallback data for ${key} (age: ${now - entry.timestamp}ms)`);
        return entry.data;
      }
      
      // Entry expired, remove it
      logger.debug(`Cached fallback data for ${key} expired`);
      fallbackCache.delete(key);
    }
    
    // No valid cache entry, return the default value
    logger.debug(`No cached fallback data for ${key}, using default value`);
    return defaultValue;
  };
}

/**
 * Updates the fallback cache with new data.
 * 
 * @param key - The cache key
 * @param data - The data to cache
 * @param ttlMs - The time-to-live for the cached data in milliseconds
 */
export function updateFallbackCache<T>(
  key: string,
  data: T,
  ttlMs: number = 60000 // 1 minute default
): void {
  fallbackCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

/**
 * Creates a circuit breaker with a cached fallback strategy.
 * 
 * @param name - The name of the service
 * @param type - The type of service (API, DATABASE, AUTH, JOURNEY)
 * @param cacheKey - The cache key for the fallback data
 * @param defaultValue - The default value to return if no cached data is available
 * @param ttlMs - The time-to-live for the cached data in milliseconds
 * @param overrides - Optional overrides for the default options
 * @returns A circuit breaker instance
 */
export function createCircuitBreakerWithCachedFallback<T>(
  name: string,
  type: keyof typeof CircuitBreakerDefaults,
  cacheKey: string,
  defaultValue: T,
  ttlMs: number = 60000, // 1 minute default
  overrides: Partial<CircuitBreakerOptions> = {}
): CircuitBreaker {
  const fallbackFn = createCachedFallback(cacheKey, defaultValue, ttlMs);
  
  return createServiceCircuitBreaker(name, type, {
    ...overrides,
    fallback: fallbackFn,
  });
}

/**
 * Retry configuration for circuit breakers.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds between retries */
  baseDelayMs: number;
  /** Maximum delay in milliseconds between retries */
  maxDelayMs: number;
  /** Jitter factor to add randomness to retry delays (0-1) */
  jitter: number;
  /** Function to determine if an error is retryable */
  isRetryable?: (error: any) => boolean;
}

/**
 * Default retry configurations for different types of errors.
 */
export const RetryDefaults: Record<string, RetryConfig> = {
  NETWORK: {
    maxRetries: 3,
    baseDelayMs: 100,
    maxDelayMs: 1000,
    jitter: 0.2,
    isRetryable: (error: any) => {
      // Network errors are typically connection refused, timeout, etc.
      return (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('timeout') ||
        error.message?.includes('network')
      );
    },
  },
  RATE_LIMIT: {
    maxRetries: 5,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    jitter: 0.1,
    isRetryable: (error: any) => {
      // Rate limit errors typically have 429 status code
      return (
        error.response?.status === 429 ||
        error.statusCode === 429 ||
        error.message?.includes('rate limit') ||
        error.message?.includes('too many requests')
      );
    },
  },
  SERVER_ERROR: {
    maxRetries: 2,
    baseDelayMs: 500,
    maxDelayMs: 2000,
    jitter: 0.3,
    isRetryable: (error: any) => {
      // Server errors typically have 5xx status codes
      const status = error.response?.status || error.statusCode;
      return status >= 500 && status < 600;
    },
  },
};

/**
 * Executes a function with retry logic using exponential backoff.
 * 
 * @param fn - The function to execute
 * @param config - Retry configuration
 * @returns The result of the function
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  const logger = new Logger('RetryUtil');
  let lastError: any;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // First attempt or retry
      if (attempt > 0) {
        // Calculate delay with exponential backoff and jitter
        const exponentialDelay = Math.min(
          config.baseDelayMs * Math.pow(2, attempt - 1),
          config.maxDelayMs
        );
        const jitterFactor = 1 + (Math.random() * config.jitter * 2 - config.jitter);
        const delay = Math.floor(exponentialDelay * jitterFactor);
        
        logger.debug(`Retry attempt ${attempt}/${config.maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if the error is retryable
      const isRetryable = config.isRetryable ? config.isRetryable(error) : true;
      
      // If not retryable or we've exhausted retries, throw the error
      if (!isRetryable || attempt >= config.maxRetries) {
        logger.debug(
          `Giving up after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}: ${error.message}`
        );
        throw error;
      }
      
      logger.debug(`Attempt ${attempt + 1} failed: ${error.message}`);
    }
  }
  
  // This should never happen due to the throw in the loop, but TypeScript needs it
  throw lastError;
}

/**
 * Creates a wrapper function that executes a service call with retry logic.
 * 
 * @param serviceFn - The service function to wrap
 * @param config - Retry configuration
 * @returns A wrapped function that uses retry logic
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  serviceFn: T,
  config: RetryConfig
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return executeWithRetry(() => serviceFn(...args), config);
  };
}

/**
 * Creates a wrapper function that executes a service call with retry logic and
 * circuit breaker protection.
 * 
 * @param serviceFn - The service function to wrap
 * @param circuitBreakerOptions - Circuit breaker configuration
 * @param retryConfig - Retry configuration
 * @returns A wrapped function that uses retry logic and circuit breaker protection
 */
export function withRetryAndCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  serviceFn: T,
  circuitBreakerOptions: Partial<CircuitBreakerOptions> & { name: string },
  retryConfig: RetryConfig
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const retryFn = withRetry(serviceFn, retryConfig);
  return withCircuitBreaker(retryFn, circuitBreakerOptions);
}

/**
 * Executes a function through a circuit breaker and transforms the response or error.
 * 
 * @param fn - The function to execute
 * @param options - Configuration options for the circuit breaker
 * @returns The transformed result of the function
 */
export async function executeWithCircuitBreakerAndTransform<T>(
  fn: () => Promise<T>,
  options: Partial<CircuitBreakerOptions> & { name: string }
): Promise<T> {
  try {
    const result = await executeWithCircuitBreaker(fn, options);
    return transformResponse(result);
  } catch (error) {
    // Transform the error to a standardized format
    const transformedError = transformErrorResponse(error);
    
    // For circuit breaker errors, add additional context
    if (error instanceof CircuitBreakerError) {
      transformedError.circuitBreaker = {
        service: error.serviceName,
        state: error.state,
      };
    }
    
    throw transformedError;
  }
}

/**
 * Creates a wrapper function that executes a service call through a circuit breaker
 * and transforms the response or error.
 * 
 * @param serviceFn - The service function to wrap
 * @param options - Configuration options for the circuit breaker
 * @returns A wrapped function that uses the circuit breaker and transforms the response
 */
export function withCircuitBreakerAndTransform<T extends (...args: any[]) => Promise<any>>(
  serviceFn: T,
  options: Partial<CircuitBreakerOptions> & { name: string }
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return executeWithCircuitBreakerAndTransform(() => serviceFn(...args), options);
  };
}

/**
 * Metrics collector interface for circuit breaker monitoring.
 */
export interface CircuitBreakerMetricsCollector {
  /**
   * Records a successful request.
   * 
   * @param serviceName - The name of the service
   * @param durationMs - The duration of the request in milliseconds
   */
  recordSuccess(serviceName: string, durationMs: number): void;
  
  /**
   * Records a failed request.
   * 
   * @param serviceName - The name of the service
   * @param error - The error that occurred
   * @param durationMs - The duration of the request in milliseconds
   */
  recordFailure(serviceName: string, error: any, durationMs: number): void;
  
  /**
   * Records a rejected request due to an open circuit.
   * 
   * @param serviceName - The name of the service
   */
  recordRejected(serviceName: string): void;
  
  /**
   * Records a state change in the circuit breaker.
   * 
   * @param serviceName - The name of the service
   * @param fromState - The previous state
   * @param toState - The new state
   */
  recordStateChange(serviceName: string, fromState: CircuitState, toState: CircuitState): void;
}

/**
 * Default metrics collector that logs metrics but doesn't send them anywhere.
 */
class DefaultMetricsCollector implements CircuitBreakerMetricsCollector {
  private readonly logger = new Logger('CircuitBreakerMetrics');
  
  recordSuccess(serviceName: string, durationMs: number): void {
    this.logger.debug(`Success: ${serviceName} (${durationMs}ms)`);
  }
  
  recordFailure(serviceName: string, error: any, durationMs: number): void {
    this.logger.debug(`Failure: ${serviceName} (${durationMs}ms) - ${error.message}`);
  }
  
  recordRejected(serviceName: string): void {
    this.logger.debug(`Rejected: ${serviceName}`);
  }
  
  recordStateChange(serviceName: string, fromState: CircuitState, toState: CircuitState): void {
    this.logger.log(`State change: ${serviceName} ${fromState} -> ${toState}`);
  }
}

/**
 * The global metrics collector instance.
 */
let metricsCollector: CircuitBreakerMetricsCollector = new DefaultMetricsCollector();

/**
 * Sets the global metrics collector.
 * 
 * @param collector - The metrics collector to use
 */
export function setCircuitBreakerMetricsCollector(collector: CircuitBreakerMetricsCollector): void {
  metricsCollector = collector;
}

/**
 * Gets the global metrics collector.
 * 
 * @returns The current metrics collector
 */
export function getCircuitBreakerMetricsCollector(): CircuitBreakerMetricsCollector {
  return metricsCollector;
}

/**
 * Creates a wrapper function that executes a service call through a circuit breaker
 * with metrics collection.
 * 
 * @param serviceFn - The service function to wrap
 * @param options - Configuration options for the circuit breaker
 * @returns A wrapped function that uses the circuit breaker and collects metrics
 */
export function withCircuitBreakerAndMetrics<T extends (...args: any[]) => Promise<any>>(
  serviceFn: T,
  options: Partial<CircuitBreakerOptions> & { name: string }
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const circuitBreaker = getCircuitBreaker(options);
  const collector = getCircuitBreakerMetricsCollector();
  
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const startTime = Date.now();
    
    try {
      // If circuit is open, record rejection and throw
      if (circuitBreaker.getState() === CircuitState.OPEN) {
        collector.recordRejected(options.name);
        throw new CircuitBreakerError(options.name, CircuitState.OPEN);
      }
      
      // Execute the function
      const result = await circuitBreaker.execute(() => serviceFn(...args));
      
      // Record success
      collector.recordSuccess(options.name, Date.now() - startTime);
      
      return result;
    } catch (error) {
      // Record failure
      collector.recordFailure(options.name, error, Date.now() - startTime);
      
      throw error;
    }
  };
}

/**
 * Example usage:
 * 
 * ```typescript
 * // Basic usage with a circuit breaker
 * const userServiceCircuitBreaker = createServiceCircuitBreaker('userService', 'API');
 * 
 * try {
 *   const result = await userServiceCircuitBreaker.execute(() => userService.getUser(userId));
 *   return result;
 * } catch (error) {
 *   // Handle error or fallback
 *   return { id: userId, name: 'Unknown User', isPlaceholder: true };
 * }
 * 
 * // Using the wrapper function
 * const getUserWithCircuitBreaker = withCircuitBreaker(
 *   userService.getUser.bind(userService),
 *   { name: 'userService', ...CircuitBreakerDefaults.API }
 * );
 * 
 * try {
 *   const user = await getUserWithCircuitBreaker(userId);
 *   return user;
 * } catch (error) {
 *   // Handle error or fallback
 *   return { id: userId, name: 'Unknown User', isPlaceholder: true };
 * }
 * 
 * // Using the wrapper function with response transformation
 * const getUserWithTransform = withCircuitBreakerAndTransform(
 *   userService.getUser.bind(userService),
 *   { name: 'userService', ...CircuitBreakerDefaults.API }
 * );
 * 
 * try {
 *   const user = await getUserWithTransform(userId);
 *   return user;
 * } catch (error) {
 *   // Error is already transformed to a standardized format
 *   console.error('Error fetching user:', error);
 *   return { id: userId, name: 'Unknown User', isPlaceholder: true };
 * }
 * 
 * // Using cached fallback
 * // First, set up a circuit breaker with cached fallback
 * const userServiceWithFallback = createCircuitBreakerWithCachedFallback(
 *   'userService',
 *   'API',
 *   `user:${userId}`,
 *   { id: userId, name: 'Unknown User', isPlaceholder: true },
 *   300000 // 5 minutes TTL
 * );
 * 
 * // When you successfully get data, update the cache
 * try {
 *   const user = await userServiceWithFallback.execute(() => userService.getUser(userId));
 *   // Update the cache with the latest data
 *   updateFallbackCache(`user:${userId}`, user, 300000);
 *   return user;
 * } catch (error) {
 *   // The circuit breaker will automatically use the cached fallback
 *   // or the default value if no cache is available
 *   console.error('Error fetching user with fallback:', error);
 *   throw error; // The error is already handled by the fallback
 * }
 * 
 * // Using retry with circuit breaker
 * const getUserWithRetry = withRetryAndCircuitBreaker(
 *   userService.getUser.bind(userService),
 *   { name: 'userService', ...CircuitBreakerDefaults.API },
 *   RetryDefaults.NETWORK
 * );
 * 
 * try {
 *   const user = await getUserWithRetry(userId);
 *   return user;
 * } catch (error) {
 *   // This error means all retries failed and the circuit might be open
 *   console.error('Error fetching user after retries:', error);
 *   return { id: userId, name: 'Unknown User', isPlaceholder: true };
 * }
 * 
 * // Using metrics with circuit breaker
 * // First, set up a custom metrics collector if needed
 * class PrometheusMetricsCollector implements CircuitBreakerMetricsCollector {
 *   // Implementation that sends metrics to Prometheus
 *   // ...
 * }
 * 
 * // Set the global metrics collector
 * setCircuitBreakerMetricsCollector(new PrometheusMetricsCollector());
 * 
 * // Then use the circuit breaker with metrics
 * const getUserWithMetrics = withCircuitBreakerAndMetrics(
 *   userService.getUser.bind(userService),
 *   { name: 'userService', ...CircuitBreakerDefaults.API }
 * );
 * 
 * try {
 *   const user = await getUserWithMetrics(userId);
 *   return user;
 * } catch (error) {
 *   // Metrics are automatically collected
 *   console.error('Error fetching user with metrics:', error);
 *   return { id: userId, name: 'Unknown User', isPlaceholder: true };
 * }
 * 
 * // Getting health status of all circuit breakers
 * app.get('/health/circuit-breakers', (req, res) => {
 *   const health = getAllCircuitBreakersHealth();
 *   const isHealthy = health.every(cb => cb.healthy);
 *   
 *   res.status(isHealthy ? 200 : 503).json({
 *     status: isHealthy ? 'UP' : 'DOWN',
 *     circuitBreakers: health
 *   });
 * });
 * ```
 */