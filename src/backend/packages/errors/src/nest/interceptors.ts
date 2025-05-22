/**
 * @file interceptors.ts
 * @description NestJS interceptors for the error handling framework.
 * 
 * This file implements a set of NestJS interceptors that provide advanced error handling
 * capabilities such as retry with exponential backoff, circuit breaking for failing
 * dependencies, fallback execution, and request timeout management.
 * 
 * These interceptors can be applied at controller or handler level to customize
 * error handling for specific endpoints without modifying business logic.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
  Type,
} from '@nestjs/common';
import { Observable, throwError, of, timer } from 'rxjs';
import { catchError, timeout, retryWhen, mergeMap, finalize, tap } from 'rxjs/operators';
import { BaseError, ErrorType } from '../base';
import { RETRY_CONFIG, CIRCUIT_BREAKER_CONFIG, FALLBACK_STRATEGY, CACHE_CONFIG } from '../constants';
import { ExternalTimeoutError } from '../categories/external.errors';

/**
 * Interface for retry configuration options.
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   */
  maxAttempts: number;

  /**
   * Initial delay in milliseconds
   */
  initialDelayMs: number;

  /**
   * Maximum delay in milliseconds
   */
  maxDelayMs: number;

  /**
   * Backoff factor for exponential backoff
   */
  backoffFactor: number;

  /**
   * Jitter factor to add randomness to retry delays (0-1)
   */
  jitterFactor: number;

  /**
   * Function to determine if an error is retryable
   */
  retryableErrorPredicate?: (error: any) => boolean;
}

/**
 * Interface for circuit breaker configuration options.
 */
export interface CircuitBreakerOptions {
  /**
   * Failure threshold percentage to trip the circuit (0-100)
   */
  failureThresholdPercentage: number;

  /**
   * Number of requests to sample for threshold calculation
   */
  requestVolumeThreshold: number;

  /**
   * Time window for request volume threshold in milliseconds
   */
  rollingWindowMs: number;

  /**
   * Time to wait before attempting to close the circuit in milliseconds
   */
  resetTimeoutMs: number;

  /**
   * Function to determine if an error should count as a failure
   */
  failureErrorPredicate?: (error: any) => boolean;
}

/**
 * Interface for fallback configuration options.
 */
export interface FallbackOptions {
  /**
   * Fallback strategy to use
   */
  strategy: string;

  /**
   * Fallback function to execute
   */
  fallbackFn?: (...args: any[]) => any;

  /**
   * Cache key to use for caching results
   */
  cacheKey?: string;

  /**
   * Time-to-live for cached results in milliseconds
   */
  cacheTtlMs?: number;

  /**
   * Default value to return if no fallback is available
   */
  defaultValue?: any;
}

/**
 * Interface for timeout configuration options.
 */
export interface TimeoutOptions {
  /**
   * Timeout duration in milliseconds
   */
  timeoutMs: number;

  /**
   * Custom error message for timeout errors
   */
  errorMessage?: string;

  /**
   * Custom error code for timeout errors
   */
  errorCode?: string;
}

/**
 * Simple in-memory cache for fallback values.
 * Used by the FallbackInterceptor to store and retrieve fallback data.
 */
class FallbackCache {
  private static instance: FallbackCache;
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private maxItems: number = CACHE_CONFIG.MAX_ITEMS;

  private constructor() {}

  /**
   * Gets the singleton instance of the cache.
   */
  public static getInstance(): FallbackCache {
    if (!FallbackCache.instance) {
      FallbackCache.instance = new FallbackCache();
    }
    return FallbackCache.instance;
  }

  /**
   * Sets a value in the cache with an expiration time.
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlMs - Time-to-live in milliseconds
   */
  public set(key: string, value: any, ttlMs: number = CACHE_CONFIG.DEFAULT_TTL_MS): void {
    // Clean expired entries before setting new ones
    this.cleanExpired();

    // If cache is at capacity, remove oldest entry
    if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  /**
   * Gets a value from the cache if it exists and hasn't expired.
   * 
   * @param key - Cache key
   * @returns The cached value or undefined if not found or expired
   */
  public get(key: string): any {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Removes expired entries from the cache.
   */
  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears all entries from the cache.
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Extends the TTL of an existing cache entry.
   * 
   * @param key - Cache key
   * @param ttlMs - Additional time-to-live in milliseconds
   * @returns True if the entry was found and extended, false otherwise
   */
  public extendTtl(key: string, ttlMs: number): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    // Extend the expiry time
    entry.expiry = entry.expiry + ttlMs;
    this.cache.set(key, entry);
    return true;
  }
}

/**
 * Circuit state for the CircuitBreakerInterceptor.
 */
enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation, requests pass through
  OPEN = 'OPEN',       // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN', // Testing if the circuit can be closed
}

/**
 * Circuit breaker state tracker for the CircuitBreakerInterceptor.
 * Tracks circuit state and failure statistics for each circuit breaker.
 */
class CircuitStateTracker {
  private static instance: CircuitStateTracker;
  private circuits: Map<string, {
    state: CircuitState;
    failures: number;
    successes: number;
    total: number;
    lastStateChange: number;
    options: CircuitBreakerOptions;
  }> = new Map();

  private constructor() {}

  /**
   * Gets the singleton instance of the circuit state tracker.
   */
  public static getInstance(): CircuitStateTracker {
    if (!CircuitStateTracker.instance) {
      CircuitStateTracker.instance = new CircuitStateTracker();
    }
    return CircuitStateTracker.instance;
  }

  /**
   * Initializes a circuit with the given name and options.
   * 
   * @param name - Circuit name
   * @param options - Circuit breaker options
   */
  public initCircuit(name: string, options: CircuitBreakerOptions): void {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, {
        state: CircuitState.CLOSED,
        failures: 0,
        successes: 0,
        total: 0,
        lastStateChange: Date.now(),
        options,
      });
    }
  }

  /**
   * Gets the current state of a circuit.
   * 
   * @param name - Circuit name
   * @returns The current circuit state
   */
  public getState(name: string): CircuitState {
    const circuit = this.circuits.get(name);
    if (!circuit) {
      return CircuitState.CLOSED;
    }

    // Check if we should transition from OPEN to HALF_OPEN
    if (circuit.state === CircuitState.OPEN) {
      const resetTimeout = circuit.options.resetTimeoutMs;
      const timeInOpen = Date.now() - circuit.lastStateChange;
      
      if (timeInOpen >= resetTimeout) {
        this.transitionState(name, CircuitState.HALF_OPEN);
      }
    }

    return circuit.state;
  }

  /**
   * Records a successful request for a circuit.
   * 
   * @param name - Circuit name
   */
  public recordSuccess(name: string): void {
    const circuit = this.circuits.get(name);
    if (!circuit) return;

    circuit.successes++;
    circuit.total++;

    // Reset counters if we've exceeded the rolling window
    this.resetCountersIfNeeded(name);

    // If we're in HALF_OPEN and have a success, close the circuit
    if (circuit.state === CircuitState.HALF_OPEN) {
      this.transitionState(name, CircuitState.CLOSED);
    }
  }

  /**
   * Records a failed request for a circuit.
   * 
   * @param name - Circuit name
   */
  public recordFailure(name: string): void {
    const circuit = this.circuits.get(name);
    if (!circuit) return;

    circuit.failures++;
    circuit.total++;

    // Reset counters if we've exceeded the rolling window
    this.resetCountersIfNeeded(name);

    // If we're in HALF_OPEN and have a failure, open the circuit
    if (circuit.state === CircuitState.HALF_OPEN) {
      this.transitionState(name, CircuitState.OPEN);
      return;
    }

    // If we're in CLOSED, check if we should open the circuit
    if (circuit.state === CircuitState.CLOSED) {
      const { failureThresholdPercentage, requestVolumeThreshold } = circuit.options;
      
      // Only trip the circuit if we have enough requests
      if (circuit.total >= requestVolumeThreshold) {
        const failurePercentage = (circuit.failures / circuit.total) * 100;
        
        if (failurePercentage >= failureThresholdPercentage) {
          this.transitionState(name, CircuitState.OPEN);
        }
      }
    }
  }

  /**
   * Transitions a circuit to a new state.
   * 
   * @param name - Circuit name
   * @param newState - New circuit state
   */
  private transitionState(name: string, newState: CircuitState): void {
    const circuit = this.circuits.get(name);
    if (!circuit) return;

    // Log state transition
    Logger.log(
      `Circuit '${name}' transitioning from ${circuit.state} to ${newState}`,
      'CircuitBreaker'
    );

    // Update state
    circuit.state = newState;
    circuit.lastStateChange = Date.now();

    // Reset counters on state change
    circuit.failures = 0;
    circuit.successes = 0;
    circuit.total = 0;
  }

  /**
   * Resets counters if we've exceeded the rolling window.
   * 
   * @param name - Circuit name
   */
  private resetCountersIfNeeded(name: string): void {
    const circuit = this.circuits.get(name);
    if (!circuit) return;

    const timeInCurrentState = Date.now() - circuit.lastStateChange;
    
    // If we've exceeded the rolling window, reset the counters
    if (timeInCurrentState >= circuit.options.rollingWindowMs) {
      circuit.failures = 0;
      circuit.successes = 0;
      circuit.total = 0;
      circuit.lastStateChange = Date.now();
    }
  }

  /**
   * Resets a circuit to its initial state.
   * 
   * @param name - Circuit name
   */
  public resetCircuit(name: string): void {
    const circuit = this.circuits.get(name);
    if (!circuit) return;

    circuit.state = CircuitState.CLOSED;
    circuit.failures = 0;
    circuit.successes = 0;
    circuit.total = 0;
    circuit.lastStateChange = Date.now();
  }
}

/**
 * Interceptor that adds retry capability with exponential backoff.
 * Automatically retries failed operations based on the provided configuration.
 */
@Injectable()
export class RetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RetryInterceptor.name);
  private readonly options: RetryOptions;

  /**
   * Creates a new RetryInterceptor instance.
   * 
   * @param options - Retry configuration options
   */
  constructor(options?: Partial<RetryOptions>) {
    // Default options based on the DEFAULT retry configuration
    this.options = {
      maxAttempts: RETRY_CONFIG.DEFAULT.MAX_ATTEMPTS,
      initialDelayMs: RETRY_CONFIG.DEFAULT.INITIAL_DELAY_MS,
      maxDelayMs: RETRY_CONFIG.DEFAULT.MAX_DELAY_MS,
      backoffFactor: RETRY_CONFIG.DEFAULT.BACKOFF_FACTOR,
      jitterFactor: RETRY_CONFIG.DEFAULT.JITTER_FACTOR,
      retryableErrorPredicate: (error: any) => {
        // By default, retry if the error is marked as transient
        if (error instanceof BaseError) {
          return !!error.context.isTransient;
        }
        return false;
      },
      ...options
    };
  }

  /**
   * Intercepts the request and adds retry capability.
   * 
   * @param context - Execution context
   * @param next - Call handler
   * @returns Observable with retry capability
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const methodName = context.getHandler().name;
    const className = context.getClass().name;
    const operationName = `${className}.${methodName}`;

    return next.handle().pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, attemptCount) => {
            // Check if we've exceeded the maximum number of attempts
            if (attemptCount >= this.options.maxAttempts) {
              this.logger.warn(
                `Retry failed after ${attemptCount} attempts for operation ${operationName}`,
                error
              );
              return throwError(() => error);
            }

            // Check if the error is retryable
            if (!this.options.retryableErrorPredicate(error)) {
              this.logger.debug(
                `Error not retryable for operation ${operationName}`,
                error
              );
              return throwError(() => error);
            }

            // Calculate delay with exponential backoff and jitter
            const delay = this.calculateDelay(attemptCount);
            
            this.logger.debug(
              `Retrying operation ${operationName} after ${delay}ms (attempt ${attemptCount + 1}/${this.options.maxAttempts})`,
              error
            );

            // Return timer observable to delay the retry
            return timer(delay);
          })
        )
      ),
      catchError(error => {
        // If we've exhausted all retries, enhance the error with retry information
        if (error instanceof BaseError) {
          error.context.retryAttempts = this.options.maxAttempts;
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Calculates the delay for a retry attempt with exponential backoff and jitter.
   * 
   * @param attemptCount - Current attempt count (0-based)
   * @returns Delay in milliseconds
   */
  private calculateDelay(attemptCount: number): number {
    // Calculate base delay with exponential backoff
    const exponentialDelay = this.options.initialDelayMs * 
      Math.pow(this.options.backoffFactor, attemptCount);
    
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, this.options.maxDelayMs);
    
    // Apply jitter to prevent thundering herd problem
    const jitter = cappedDelay * this.options.jitterFactor;
    const minDelay = Math.max(0, cappedDelay - jitter);
    const maxDelay = cappedDelay + jitter;
    
    return Math.floor(minDelay + Math.random() * (maxDelay - minDelay));
  }

  /**
   * Creates a RetryInterceptor with database-specific retry configuration.
   * @returns A new RetryInterceptor instance
   */
  static forDatabase(): Type<RetryInterceptor> {
    return class DatabaseRetryInterceptor extends RetryInterceptor {
      constructor() {
        super({
          maxAttempts: RETRY_CONFIG.DATABASE.MAX_ATTEMPTS,
          initialDelayMs: RETRY_CONFIG.DATABASE.INITIAL_DELAY_MS,
          maxDelayMs: RETRY_CONFIG.DATABASE.MAX_DELAY_MS,
          backoffFactor: RETRY_CONFIG.DATABASE.BACKOFF_FACTOR,
          jitterFactor: RETRY_CONFIG.DATABASE.JITTER_FACTOR,
        });
      }
    };
  }

  /**
   * Creates a RetryInterceptor with external API retry configuration.
   * @returns A new RetryInterceptor instance
   */
  static forExternalApi(): Type<RetryInterceptor> {
    return class ExternalApiRetryInterceptor extends RetryInterceptor {
      constructor() {
        super({
          maxAttempts: RETRY_CONFIG.EXTERNAL_API.MAX_ATTEMPTS,
          initialDelayMs: RETRY_CONFIG.EXTERNAL_API.INITIAL_DELAY_MS,
          maxDelayMs: RETRY_CONFIG.EXTERNAL_API.MAX_DELAY_MS,
          backoffFactor: RETRY_CONFIG.EXTERNAL_API.BACKOFF_FACTOR,
          jitterFactor: RETRY_CONFIG.EXTERNAL_API.JITTER_FACTOR,
        });
      }
    };
  }

  /**
   * Creates a RetryInterceptor with event processing retry configuration.
   * @returns A new RetryInterceptor instance
   */
  static forEventProcessing(): Type<RetryInterceptor> {
    return class EventProcessingRetryInterceptor extends RetryInterceptor {
      constructor() {
        super({
          maxAttempts: RETRY_CONFIG.EVENT_PROCESSING.MAX_ATTEMPTS,
          initialDelayMs: RETRY_CONFIG.EVENT_PROCESSING.INITIAL_DELAY_MS,
          maxDelayMs: RETRY_CONFIG.EVENT_PROCESSING.MAX_DELAY_MS,
          backoffFactor: RETRY_CONFIG.EVENT_PROCESSING.BACKOFF_FACTOR,
          jitterFactor: RETRY_CONFIG.EVENT_PROCESSING.JITTER_FACTOR,
        });
      }
    };
  }
}

/**
 * Interceptor that implements the circuit breaker pattern.
 * Prevents cascading failures by failing fast when a dependency is experiencing issues.
 */
@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CircuitBreakerInterceptor.name);
  private readonly circuitTracker = CircuitStateTracker.getInstance();
  private readonly circuitName: string;
  private readonly options: CircuitBreakerOptions;

  /**
   * Creates a new CircuitBreakerInterceptor instance.
   * 
   * @param circuitName - Name of the circuit (should be unique per dependency)
   * @param options - Circuit breaker configuration options
   */
  constructor(circuitName: string, options?: Partial<CircuitBreakerOptions>) {
    this.circuitName = circuitName;
    
    // Default options based on the DEFAULT circuit breaker configuration
    this.options = {
      failureThresholdPercentage: CIRCUIT_BREAKER_CONFIG.DEFAULT.FAILURE_THRESHOLD_PERCENTAGE,
      requestVolumeThreshold: CIRCUIT_BREAKER_CONFIG.DEFAULT.REQUEST_VOLUME_THRESHOLD,
      rollingWindowMs: CIRCUIT_BREAKER_CONFIG.DEFAULT.ROLLING_WINDOW_MS,
      resetTimeoutMs: CIRCUIT_BREAKER_CONFIG.DEFAULT.RESET_TIMEOUT_MS,
      failureErrorPredicate: (error: any) => {
        // By default, count all errors as failures except for 4xx client errors
        if (error instanceof HttpException) {
          const status = error.getStatus();
          return status >= 500; // Only server errors count as failures
        }
        return true; // All other errors count as failures
      },
      ...options
    };

    // Initialize the circuit
    this.circuitTracker.initCircuit(this.circuitName, this.options);
  }

  /**
   * Intercepts the request and applies circuit breaker logic.
   * 
   * @param context - Execution context
   * @param next - Call handler
   * @returns Observable with circuit breaker protection
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const currentState = this.circuitTracker.getState(this.circuitName);

    // If the circuit is open, fail fast
    if (currentState === CircuitState.OPEN) {
      this.logger.warn(`Circuit '${this.circuitName}' is OPEN, failing fast`);
      return throwError(() => new BaseError(
        `Service unavailable: circuit '${this.circuitName}' is open`,
        ErrorType.EXTERNAL,
        'CIRCUIT_OPEN',
        { isTransient: true }
      ));
    }

    return next.handle().pipe(
      tap(() => {
        // Record success
        this.circuitTracker.recordSuccess(this.circuitName);
      }),
      catchError(error => {
        // Check if this error counts as a failure
        if (this.options.failureErrorPredicate(error)) {
          this.circuitTracker.recordFailure(this.circuitName);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Creates a CircuitBreakerInterceptor with critical service configuration.
   * 
   * @param circuitName - Name of the circuit
   * @returns A new CircuitBreakerInterceptor instance
   */
  static forCriticalService(circuitName: string): Type<CircuitBreakerInterceptor> {
    return class CriticalServiceCircuitBreaker extends CircuitBreakerInterceptor {
      constructor() {
        super(circuitName, {
          failureThresholdPercentage: CIRCUIT_BREAKER_CONFIG.CRITICAL.FAILURE_THRESHOLD_PERCENTAGE,
          requestVolumeThreshold: CIRCUIT_BREAKER_CONFIG.CRITICAL.REQUEST_VOLUME_THRESHOLD,
          rollingWindowMs: CIRCUIT_BREAKER_CONFIG.CRITICAL.ROLLING_WINDOW_MS,
          resetTimeoutMs: CIRCUIT_BREAKER_CONFIG.CRITICAL.RESET_TIMEOUT_MS,
        });
      }
    };
  }

  /**
   * Creates a CircuitBreakerInterceptor with non-critical service configuration.
   * 
   * @param circuitName - Name of the circuit
   * @returns A new CircuitBreakerInterceptor instance
   */
  static forNonCriticalService(circuitName: string): Type<CircuitBreakerInterceptor> {
    return class NonCriticalServiceCircuitBreaker extends CircuitBreakerInterceptor {
      constructor() {
        super(circuitName, {
          failureThresholdPercentage: CIRCUIT_BREAKER_CONFIG.NON_CRITICAL.FAILURE_THRESHOLD_PERCENTAGE,
          requestVolumeThreshold: CIRCUIT_BREAKER_CONFIG.NON_CRITICAL.REQUEST_VOLUME_THRESHOLD,
          rollingWindowMs: CIRCUIT_BREAKER_CONFIG.NON_CRITICAL.ROLLING_WINDOW_MS,
          resetTimeoutMs: CIRCUIT_BREAKER_CONFIG.NON_CRITICAL.RESET_TIMEOUT_MS,
        });
      }
    };
  }

  /**
   * Manually resets the circuit to closed state.
   * Useful for testing or administrative operations.
   */
  public resetCircuit(): void {
    this.circuitTracker.resetCircuit(this.circuitName);
    this.logger.log(`Circuit '${this.circuitName}' manually reset to CLOSED state`);
  }
}

/**
 * Interceptor that provides fallback mechanisms for failed operations.
 * Enables graceful degradation by returning cached data or default values when operations fail.
 */
@Injectable()
export class FallbackInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FallbackInterceptor.name);
  private readonly cache = FallbackCache.getInstance();
  private readonly options: FallbackOptions;

  /**
   * Creates a new FallbackInterceptor instance.
   * 
   * @param options - Fallback configuration options
   */
  constructor(options: FallbackOptions) {
    this.options = {
      strategy: FALLBACK_STRATEGY.USE_CACHED_DATA,
      cacheTtlMs: CACHE_CONFIG.DEFAULT_TTL_MS,
      ...options
    };
  }

  /**
   * Intercepts the request and provides fallback mechanisms.
   * 
   * @param context - Execution context
   * @param next - Call handler
   * @returns Observable with fallback capability
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const methodName = context.getHandler().name;
    const className = context.getClass().name;
    const operationName = `${className}.${methodName}`;

    // Generate a cache key if not provided
    const cacheKey = this.options.cacheKey || 
      `${operationName}:${JSON.stringify(request.params)}:${JSON.stringify(request.query)}`;

    return next.handle().pipe(
      // Cache successful responses if using cached data strategy
      tap(response => {
        if (this.options.strategy === FALLBACK_STRATEGY.USE_CACHED_DATA && response) {
          this.cache.set(cacheKey, response, this.options.cacheTtlMs);
          this.logger.debug(`Cached response for ${cacheKey}`);
        }
      }),
      // Handle errors with appropriate fallback
      catchError(error => {
        this.logger.warn(
          `Operation ${operationName} failed, applying fallback strategy: ${this.options.strategy}`,
          error
        );

        switch (this.options.strategy) {
          case FALLBACK_STRATEGY.USE_CACHED_DATA:
            const cachedData = this.cache.get(cacheKey);
            if (cachedData) {
              this.logger.debug(`Using cached data for ${cacheKey}`);
              return of(cachedData);
            }
            break;

          case FALLBACK_STRATEGY.USE_DEFAULT_VALUES:
            if (this.options.defaultValue !== undefined) {
              this.logger.debug(`Using default value for ${operationName}`);
              return of(this.options.defaultValue);
            }
            break;

          case FALLBACK_STRATEGY.GRACEFUL_DEGRADATION:
            if (this.options.fallbackFn) {
              this.logger.debug(`Executing fallback function for ${operationName}`);
              try {
                const result = this.options.fallbackFn(context, error);
                return of(result);
              } catch (fallbackError) {
                this.logger.error(
                  `Fallback function failed for ${operationName}`,
                  fallbackError
                );
              }
            }
            break;

          case FALLBACK_STRATEGY.RETURN_EMPTY:
            this.logger.debug(`Returning empty result for ${operationName}`);
            return of(Array.isArray(this.options.defaultValue) ? [] : {});

          case FALLBACK_STRATEGY.FAIL_FAST:
          default:
            // Just rethrow the error
            break;
        }

        // If all fallback strategies fail, rethrow the original error
        return throwError(() => error);
      })
    );
  }

  /**
   * Creates a FallbackInterceptor that uses cached data.
   * 
   * @param cacheKey - Optional cache key
   * @param cacheTtlMs - Optional cache TTL in milliseconds
   * @returns A new FallbackInterceptor instance
   */
  static withCachedData(cacheKey?: string, cacheTtlMs?: number): Type<FallbackInterceptor> {
    return class CachedDataFallbackInterceptor extends FallbackInterceptor {
      constructor() {
        super({
          strategy: FALLBACK_STRATEGY.USE_CACHED_DATA,
          cacheKey,
          cacheTtlMs: cacheTtlMs || CACHE_CONFIG.DEFAULT_TTL_MS,
        });
      }
    };
  }

  /**
   * Creates a FallbackInterceptor that uses default values.
   * 
   * @param defaultValue - Default value to return
   * @returns A new FallbackInterceptor instance
   */
  static withDefaultValue(defaultValue: any): Type<FallbackInterceptor> {
    return class DefaultValueFallbackInterceptor extends FallbackInterceptor {
      constructor() {
        super({
          strategy: FALLBACK_STRATEGY.USE_DEFAULT_VALUES,
          defaultValue,
        });
      }
    };
  }

  /**
   * Creates a FallbackInterceptor that uses a custom fallback function.
   * 
   * @param fallbackFn - Fallback function to execute
   * @returns A new FallbackInterceptor instance
   */
  static withFallbackFunction(fallbackFn: (...args: any[]) => any): Type<FallbackInterceptor> {
    return class FunctionFallbackInterceptor extends FallbackInterceptor {
      constructor() {
        super({
          strategy: FALLBACK_STRATEGY.GRACEFUL_DEGRADATION,
          fallbackFn,
        });
      }
    };
  }

  /**
   * Creates a FallbackInterceptor that returns empty results.
   * 
   * @param isArray - Whether to return an empty array (true) or empty object (false)
   * @returns A new FallbackInterceptor instance
   */
  static withEmptyResult(isArray: boolean = false): Type<FallbackInterceptor> {
    return class EmptyResultFallbackInterceptor extends FallbackInterceptor {
      constructor() {
        super({
          strategy: FALLBACK_STRATEGY.RETURN_EMPTY,
          defaultValue: isArray ? [] : {},
        });
      }
    };
  }
}

/**
 * Interceptor that adds timeout handling to requests.
 * Automatically fails requests that take too long to complete.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimeoutInterceptor.name);
  private readonly options: TimeoutOptions;

  /**
   * Creates a new TimeoutInterceptor instance.
   * 
   * @param options - Timeout configuration options
   */
  constructor(options?: Partial<TimeoutOptions>) {
    // Default timeout of 30 seconds
    this.options = {
      timeoutMs: 30000,
      errorMessage: 'Request timed out',
      errorCode: 'REQUEST_TIMEOUT',
      ...options
    };
  }

  /**
   * Intercepts the request and adds timeout handling.
   * 
   * @param context - Execution context
   * @param next - Call handler
   * @returns Observable with timeout handling
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const methodName = context.getHandler().name;
    const className = context.getClass().name;
    const operationName = `${className}.${methodName}`;

    return next.handle().pipe(
      timeout(this.options.timeoutMs),
      catchError(error => {
        // Check if this is a timeout error
        if (error.name === 'TimeoutError') {
          this.logger.warn(
            `Operation ${operationName} timed out after ${this.options.timeoutMs}ms`
          );

          // Create a timeout error
          const timeoutError = new ExternalTimeoutError(
            this.options.errorMessage,
            this.options.timeoutMs,
            operationName,
            this.options.errorCode
          );

          return throwError(() => timeoutError);
        }

        // For other errors, just rethrow
        return throwError(() => error);
      })
    );
  }

  /**
   * Creates a TimeoutInterceptor for API requests.
   * 
   * @param timeoutMs - Timeout in milliseconds
   * @returns A new TimeoutInterceptor instance
   */
  static forApiRequest(timeoutMs: number = 10000): Type<TimeoutInterceptor> {
    return class ApiRequestTimeoutInterceptor extends TimeoutInterceptor {
      constructor() {
        super({
          timeoutMs,
          errorMessage: 'API request timed out',
          errorCode: 'API_REQUEST_TIMEOUT',
        });
      }
    };
  }

  /**
   * Creates a TimeoutInterceptor for database operations.
   * 
   * @param timeoutMs - Timeout in milliseconds
   * @returns A new TimeoutInterceptor instance
   */
  static forDatabaseOperation(timeoutMs: number = 5000): Type<TimeoutInterceptor> {
    return class DatabaseTimeoutInterceptor extends TimeoutInterceptor {
      constructor() {
        super({
          timeoutMs,
          errorMessage: 'Database operation timed out',
          errorCode: 'DATABASE_TIMEOUT',
        });
      }
    };
  }

  /**
   * Creates a TimeoutInterceptor for external service calls.
   * 
   * @param timeoutMs - Timeout in milliseconds
   * @returns A new TimeoutInterceptor instance
   */
  static forExternalService(timeoutMs: number = 15000): Type<TimeoutInterceptor> {
    return class ExternalServiceTimeoutInterceptor extends TimeoutInterceptor {
      constructor() {
        super({
          timeoutMs,
          errorMessage: 'External service call timed out',
          errorCode: 'EXTERNAL_SERVICE_TIMEOUT',
        });
      }
    };
  }
}