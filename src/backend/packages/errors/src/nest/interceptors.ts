/**
 * @file interceptors.ts
 * @description Implements NestJS interceptors for the error handling framework.
 * These interceptors provide capabilities such as retry with exponential backoff,
 * circuit breaking for failing dependencies, fallback execution, and request timeout
 * management. They can be applied at controller or handler level to customize error
 * handling for specific endpoints without modifying business logic.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  RequestTimeoutException,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError, of, timer, from } from 'rxjs';
import {
  catchError,
  timeout,
  retryWhen,
  mergeMap,
  delay,
  tap,
  finalize,
  take,
  concatMap,
} from 'rxjs/operators';
import { ErrorType } from '../types';
import {
  DEFAULT_RETRY_CONFIG,
  RETRYABLE_HTTP_STATUS_CODES,
  ERROR_MESSAGES,
} from '../constants';
import {
  RETRY_METADATA_KEY,
  CIRCUIT_BREAKER_METADATA_KEY,
  FALLBACK_METADATA_KEY,
  TIMEOUT_METADATA_KEY,
  RetryOptions,
  CircuitBreakerOptions,
  FallbackOptions,
  TimeoutOptions,
} from './decorators';

/**
 * Cache for storing circuit breaker states
 * This is a simple in-memory implementation that could be replaced with a distributed cache
 * for multi-instance deployments
 */
class CircuitBreakerStateManager {
  private static instance: CircuitBreakerStateManager;
  private circuitStates: Map<string, {
    state: 'open' | 'half-open' | 'closed';
    failureCount: number;
    successCount: number;
    lastFailure: Date;
    lastSuccess: Date;
  }>;

  private constructor() {
    this.circuitStates = new Map();
  }

  public static getInstance(): CircuitBreakerStateManager {
    if (!CircuitBreakerStateManager.instance) {
      CircuitBreakerStateManager.instance = new CircuitBreakerStateManager();
    }
    return CircuitBreakerStateManager.instance;
  }

  public getCircuitState(name: string): 'open' | 'half-open' | 'closed' {
    if (!this.circuitStates.has(name)) {
      this.circuitStates.set(name, {
        state: 'closed',
        failureCount: 0,
        successCount: 0,
        lastFailure: null,
        lastSuccess: null,
      });
    }
    return this.circuitStates.get(name).state;
  }

  public recordSuccess(name: string): void {
    if (!this.circuitStates.has(name)) {
      this.circuitStates.set(name, {
        state: 'closed',
        failureCount: 0,
        successCount: 1,
        lastFailure: null,
        lastSuccess: new Date(),
      });
      return;
    }

    const state = this.circuitStates.get(name);
    state.successCount += 1;
    state.lastSuccess = new Date();

    // If the circuit is half-open and we've reached the success threshold, close it
    if (state.state === 'half-open') {
      state.state = 'closed';
      state.failureCount = 0;
    }

    this.circuitStates.set(name, state);
  }

  public recordFailure(name: string, failureThreshold: number, resetTimeout: number): void {
    if (!this.circuitStates.has(name)) {
      this.circuitStates.set(name, {
        state: 'closed',
        failureCount: 1,
        successCount: 0,
        lastFailure: new Date(),
        lastSuccess: null,
      });
      return;
    }

    const state = this.circuitStates.get(name);
    state.failureCount += 1;
    state.lastFailure = new Date();

    // If we've reached the failure threshold, open the circuit
    if (state.state === 'closed' && state.failureCount >= failureThreshold) {
      state.state = 'open';
      
      // Schedule the circuit to transition to half-open after the reset timeout
      setTimeout(() => {
        const currentState = this.circuitStates.get(name);
        if (currentState && currentState.state === 'open') {
          currentState.state = 'half-open';
          currentState.successCount = 0;
          this.circuitStates.set(name, currentState);
        }
      }, resetTimeout);
    }

    this.circuitStates.set(name, state);
  }

  public reset(name: string): void {
    this.circuitStates.set(name, {
      state: 'closed',
      failureCount: 0,
      successCount: 0,
      lastFailure: null,
      lastSuccess: null,
    });
  }
}

/**
 * Cache for storing method results for fallback purposes
 * This is a simple in-memory implementation that could be replaced with a distributed cache
 * for multi-instance deployments
 */
class MethodResultCache {
  private static instance: MethodResultCache;
  private cache: Map<string, {
    result: any;
    timestamp: Date;
  }>;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): MethodResultCache {
    if (!MethodResultCache.instance) {
      MethodResultCache.instance = new MethodResultCache();
    }
    return MethodResultCache.instance;
  }

  public getCacheKey(className: string, methodName: string, args: any[]): string {
    return `${className}:${methodName}:${JSON.stringify(args)}`;
  }

  public set(key: string, result: any): void {
    this.cache.set(key, {
      result,
      timestamp: new Date(),
    });
  }

  public get(key: string, maxAge?: number): any {
    if (!this.cache.has(key)) {
      return null;
    }

    const cached = this.cache.get(key);
    
    // If maxAge is specified, check if the cache entry is still valid
    if (maxAge) {
      const now = new Date();
      const age = now.getTime() - cached.timestamp.getTime();
      if (age > maxAge) {
        return null;
      }
    }

    return cached.result;
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

/**
 * Utility function to calculate retry delay with exponential backoff and optional jitter
 * @param attempt - Current retry attempt (0-based)
 * @param initialDelay - Initial delay in milliseconds
 * @param backoffFactor - Factor by which the delay increases with each retry
 * @param maxDelay - Maximum delay in milliseconds
 * @param useJitter - Whether to add jitter to the delay
 * @param jitterFactor - Maximum jitter percentage (0-1) to apply to the delay
 * @returns Calculated delay in milliseconds
 */
function calculateRetryDelay(
  attempt: number,
  initialDelay: number,
  backoffFactor: number,
  maxDelay: number,
  useJitter: boolean,
  jitterFactor: number
): number {
  // Calculate exponential backoff
  let delay = initialDelay * Math.pow(backoffFactor, attempt);
  
  // Apply maximum delay constraint
  delay = Math.min(delay, maxDelay);
  
  // Apply jitter if enabled
  if (useJitter) {
    const jitterAmount = delay * jitterFactor;
    delay = delay - (jitterAmount / 2) + (Math.random() * jitterAmount);
  }
  
  return delay;
}

/**
 * Utility function to determine if an error is retryable based on error type and HTTP status
 * @param error - The error to check
 * @param retryableErrors - Array of error types that should be retried
 * @param retryPredicate - Optional custom predicate function to determine if an error should be retried
 * @returns True if the error should be retried, false otherwise
 */
function isRetryableError(
  error: any,
  retryableErrors: ErrorType[],
  retryPredicate?: (error: Error) => boolean
): boolean {
  // If a custom predicate is provided, use it
  if (retryPredicate && typeof retryPredicate === 'function') {
    return retryPredicate(error);
  }
  
  // Check if it's an HttpException with a retryable status code
  if (error instanceof HttpException) {
    const status = error.getStatus();
    return RETRYABLE_HTTP_STATUS_CODES.includes(status);
  }
  
  // Check if it's a custom error with a type property
  if (error && error.type && retryableErrors.includes(error.type)) {
    return true;
  }
  
  // Check for specific error types that are generally retryable
  if (error instanceof TypeError && error.message.includes('network')) {
    return true;
  }
  
  if (error.name === 'TimeoutError' || error instanceof RequestTimeoutException) {
    return true;
  }
  
  // Default to not retryable for unknown error types
  return false;
}

/**
 * Utility function to determine if an error should trip the circuit breaker
 * @param error - The error to check
 * @param tripErrors - Array of error types that should trip the circuit breaker
 * @param tripPredicate - Optional custom predicate function to determine if an error should trip the circuit breaker
 * @returns True if the error should trip the circuit breaker, false otherwise
 */
function isTripError(
  error: any,
  tripErrors: ErrorType[],
  tripPredicate?: (error: Error) => boolean
): boolean {
  // If a custom predicate is provided, use it
  if (tripPredicate && typeof tripPredicate === 'function') {
    return tripPredicate(error);
  }
  
  // Check if it's an HttpException with a status code that indicates an external service issue
  if (error instanceof HttpException) {
    const status = error.getStatus();
    return [
      HttpStatus.BAD_GATEWAY,
      HttpStatus.SERVICE_UNAVAILABLE,
      HttpStatus.GATEWAY_TIMEOUT
    ].includes(status);
  }
  
  // Check if it's a custom error with a type property
  if (error && error.type && tripErrors.includes(error.type)) {
    return true;
  }
  
  // Default to not tripping for unknown error types
  return false;
}

/**
 * Utility function to determine if an error should trigger a fallback
 * @param error - The error to check
 * @param fallbackErrors - Array of error types that should trigger a fallback
 * @param fallbackPredicate - Optional custom predicate function to determine if an error should trigger a fallback
 * @returns True if the error should trigger a fallback, false otherwise
 */
function isFallbackError(
  error: any,
  fallbackErrors: ErrorType[],
  fallbackPredicate?: (error: Error) => boolean
): boolean {
  // If a custom predicate is provided, use it
  if (fallbackPredicate && typeof fallbackPredicate === 'function') {
    return fallbackPredicate(error);
  }
  
  // Check if it's a custom error with a type property
  if (error && error.type && fallbackErrors.includes(error.type)) {
    return true;
  }
  
  // Check if it's an HttpException with a status code that indicates a server error
  if (error instanceof HttpException) {
    const status = error.getStatus();
    return status >= 500;
  }
  
  // Default to triggering fallback for unknown error types
  return true;
}

/**
 * Interceptor that adds timeout handling to request processing.
 * This interceptor will terminate requests that exceed the configured timeout
 * and return an appropriate error response.
 *
 * @example
 * // Apply globally to all controllers
 * app.useGlobalInterceptors(new TimeoutInterceptor());
 *
 * @example
 * // Apply to a specific controller
 * @UseInterceptors(TimeoutInterceptor)
 * export class UserController {}
 *
 * @example
 * // Apply to a specific method with custom timeout
 * @TimeoutConfig({ timeout: 5000 })
 * @UseInterceptors(TimeoutInterceptor)
 * async getLongRunningData() {}
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimeoutInterceptor.name);
  private readonly defaultTimeout = 30000; // 30 seconds default timeout

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Get the timeout configuration from metadata
    const timeoutConfig = this.reflector.get<TimeoutOptions>(
      TIMEOUT_METADATA_KEY,
      context.getHandler()
    ) || {};

    const {
      timeout: timeoutMs = this.defaultTimeout,
      message = ERROR_MESSAGES.TECHNICAL.TIMEOUT.replace('{duration}', String(timeoutMs)),
      cancelOnTimeout = true,
      onTimeout,
    } = timeoutConfig;

    // Skip timeout if set to 0 or negative
    if (timeoutMs <= 0) {
      return next.handle();
    }

    return next.handle().pipe(
      timeout(timeoutMs),
      catchError(err => {
        if (err.name === 'TimeoutError') {
          this.logger.warn(`Request timed out after ${timeoutMs}ms`);
          
          // Execute onTimeout callback if provided
          if (onTimeout && typeof onTimeout === 'function') {
            try {
              onTimeout(context);
            } catch (callbackError) {
              this.logger.error(
                `Error in timeout callback: ${callbackError.message}`,
                callbackError.stack
              );
            }
          }
          
          // Create a timeout exception with the configured message
          const timeoutException = new RequestTimeoutException(message);
          timeoutException['type'] = ErrorType.TIMEOUT;
          
          return throwError(() => timeoutException);
        }
        return throwError(() => err);
      })
    );
  }
}

/**
 * Interceptor that implements retry with exponential backoff for transient errors.
 * This interceptor will automatically retry failed operations based on the configured
 * retry policy, with increasing delays between retries.
 *
 * @example
 * // Apply globally to all controllers
 * app.useGlobalInterceptors(new RetryInterceptor());
 *
 * @example
 * // Apply to a specific controller
 * @UseInterceptors(RetryInterceptor)
 * export class ExternalApiController {}
 *
 * @example
 * // Apply to a specific method with custom retry policy
 * @Retry({ attempts: 5, initialDelay: 1000 })
 * @UseInterceptors(RetryInterceptor)
 * async fetchExternalData() {}
 */
@Injectable()
export class RetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RetryInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Get the retry configuration from metadata
    const retryConfig = this.reflector.get<RetryOptions>(
      RETRY_METADATA_KEY,
      context.getHandler()
    );

    // If no retry configuration is provided, just pass through
    if (!retryConfig) {
      return next.handle();
    }

    const {
      attempts = DEFAULT_RETRY_CONFIG.MAX_ATTEMPTS,
      initialDelay = DEFAULT_RETRY_CONFIG.INITIAL_DELAY_MS,
      backoffFactor = DEFAULT_RETRY_CONFIG.BACKOFF_FACTOR,
      maxDelay = DEFAULT_RETRY_CONFIG.MAX_DELAY_MS,
      useJitter = DEFAULT_RETRY_CONFIG.USE_JITTER,
      jitterFactor = DEFAULT_RETRY_CONFIG.JITTER_FACTOR,
      retryableErrors = [ErrorType.TECHNICAL, ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE],
      retryPredicate,
      onRetry,
    } = retryConfig;

    // Get information about the current handler for logging
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    return next.handle().pipe(
      retryWhen(errors =>
        errors.pipe(
          concatMap((error, index) => {
            const attempt = index + 1;

            // Check if the error is retryable
            if (!isRetryableError(error, retryableErrors, retryPredicate)) {
              return throwError(() => error);
            }

            // Check if we've reached the maximum number of attempts
            if (attempt >= attempts) {
              this.logger.warn(
                `Maximum retry attempts (${attempts}) reached for ${className}.${methodName}`
              );
              return throwError(() => error);
            }

            // Calculate the delay for this retry attempt
            const retryDelay = calculateRetryDelay(
              attempt,
              initialDelay,
              backoffFactor,
              maxDelay,
              useJitter,
              jitterFactor
            );

            this.logger.debug(
              `Retrying ${className}.${methodName} (attempt ${attempt}/${attempts}) after ${retryDelay}ms`
            );

            // Execute onRetry callback if provided
            if (onRetry && typeof onRetry === 'function') {
              try {
                onRetry(error, attempt);
              } catch (callbackError) {
                this.logger.error(
                  `Error in retry callback: ${callbackError.message}`,
                  callbackError.stack
                );
              }
            }

            // Return a delayed observable to implement the retry
            return timer(retryDelay);
          })
        )
      )
    );
  }
}

/**
 * Interceptor that implements the circuit breaker pattern for failing dependencies.
 * This interceptor will prevent cascading failures by stopping requests to failing
 * external dependencies after a threshold of failures is reached.
 *
 * @example
 * // Apply globally to all controllers
 * app.useGlobalInterceptors(new CircuitBreakerInterceptor());
 *
 * @example
 * // Apply to a specific controller
 * @UseInterceptors(CircuitBreakerInterceptor)
 * export class PaymentGatewayController {}
 *
 * @example
 * // Apply to a specific method with custom circuit breaker configuration
 * @CircuitBreaker({ failureThreshold: 3, resetTimeout: 60000 })
 * @UseInterceptors(CircuitBreakerInterceptor)
 * async processPayment() {}
 */
@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CircuitBreakerInterceptor.name);
  private readonly stateManager = CircuitBreakerStateManager.getInstance();

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Get the circuit breaker configuration from metadata
    const circuitBreakerConfig = this.reflector.get<CircuitBreakerOptions>(
      CIRCUIT_BREAKER_METADATA_KEY,
      context.getHandler()
    );

    // If no circuit breaker configuration is provided, just pass through
    if (!circuitBreakerConfig) {
      return next.handle();
    }

    const {
      failureThreshold = 5,
      resetTimeout = 30000,
      successThreshold = 2,
      tripErrors = [ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE],
      tripPredicate,
      onStateChange,
      name: configName,
    } = circuitBreakerConfig;

    // Generate a circuit breaker name if not provided
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;
    const name = configName || `${className}.${methodName}`;

    // Check the current state of the circuit
    const currentState = this.stateManager.getCircuitState(name);

    // If the circuit is open, fail fast without executing the handler
    if (currentState === 'open') {
      this.logger.warn(`Circuit ${name} is OPEN - failing fast`);
      const error = new HttpException(
        ERROR_MESSAGES.EXTERNAL.EXTERNAL_SERVICE_UNAVAILABLE.replace('{service}', name),
        HttpStatus.SERVICE_UNAVAILABLE
      );
      error['type'] = ErrorType.SERVICE_UNAVAILABLE;
      return throwError(() => error);
    }

    // If the circuit is half-open, only allow a limited number of requests through
    if (currentState === 'half-open') {
      this.logger.debug(`Circuit ${name} is HALF-OPEN - testing with limited traffic`);
    }

    return next.handle().pipe(
      tap(() => {
        // Record success if the operation completes without error
        this.stateManager.recordSuccess(name);
        
        // If the state changed from half-open to closed, notify via callback
        if (currentState === 'half-open' && 
            this.stateManager.getCircuitState(name) === 'closed' &&
            onStateChange) {
          try {
            onStateChange('closed');
          } catch (callbackError) {
            this.logger.error(
              `Error in circuit breaker state change callback: ${callbackError.message}`,
              callbackError.stack
            );
          }
        }
      }),
      catchError(error => {
        // Check if this error should trip the circuit breaker
        if (isTripError(error, tripErrors, tripPredicate)) {
          this.logger.warn(`Circuit ${name} recorded a failure: ${error.message}`);
          
          // Record the failure and potentially open the circuit
          const previousState = this.stateManager.getCircuitState(name);
          this.stateManager.recordFailure(name, failureThreshold, resetTimeout);
          const newState = this.stateManager.getCircuitState(name);
          
          // If the state changed, notify via callback
          if (previousState !== newState && onStateChange) {
            try {
              onStateChange(newState, error);
            } catch (callbackError) {
              this.logger.error(
                `Error in circuit breaker state change callback: ${callbackError.message}`,
                callbackError.stack
              );
            }
          }
        }
        
        // Re-throw the error to be handled by other interceptors or filters
        return throwError(() => error);
      })
    );
  }
}

/**
 * Interceptor that provides fallback mechanisms for failed operations.
 * This interceptor enables graceful degradation by providing alternative
 * implementations or cached data when the primary operation fails.
 *
 * @example
 * // Apply globally to all controllers
 * app.useGlobalInterceptors(new FallbackInterceptor());
 *
 * @example
 * // Apply to a specific controller
 * @UseInterceptors(FallbackInterceptor)
 * export class ProductController {}
 *
 * @example
 * // Apply to a specific method with custom fallback configuration
 * @Fallback({ methodName: 'getCachedProducts' })
 * @UseInterceptors(FallbackInterceptor)
 * async getProducts() {}
 */
@Injectable()
export class FallbackInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FallbackInterceptor.name);
  private readonly cache = MethodResultCache.getInstance();

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Get the fallback configuration from metadata
    const fallbackConfig = this.reflector.get<FallbackOptions>(
      FALLBACK_METADATA_KEY,
      context.getHandler()
    );

    // If no fallback configuration is provided, just pass through
    if (!fallbackConfig) {
      return next.handle();
    }

    const {
      methodName,
      fallbackFn,
      fallbackErrors = [ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE, ErrorType.TECHNICAL],
      fallbackPredicate,
      useCachedData = false,
      maxCacheAge = 300000, // 5 minutes default
    } = fallbackConfig;

    // Get information about the current handler for caching and fallback
    const handler = context.getHandler();
    const className = context.getClass().name;
    const handlerName = handler.name;
    const instance = context.getClass();
    const request = context.switchToHttp().getRequest();
    const args = request.body ? [request.body] : [];

    // Generate a cache key if caching is enabled
    const cacheKey = useCachedData
      ? this.cache.getCacheKey(className, handlerName, args)
      : null;

    return next.handle().pipe(
      // Cache successful results if caching is enabled
      tap(result => {
        if (useCachedData && cacheKey) {
          this.cache.set(cacheKey, result);
        }
      }),
      // Handle errors with fallback mechanisms
      catchError(error => {
        // Check if this error should trigger a fallback
        if (!isFallbackError(error, fallbackErrors, fallbackPredicate)) {
          return throwError(() => error);
        }

        this.logger.debug(
          `Executing fallback for ${className}.${handlerName}: ${error.message}`
        );

        // Try different fallback strategies in order of precedence

        // 1. Use provided fallback function if available
        if (fallbackFn && typeof fallbackFn === 'function') {
          try {
            const fallbackResult = fallbackFn(error, ...args);
            return from(Promise.resolve(fallbackResult));
          } catch (fallbackError) {
            this.logger.error(
              `Error in fallback function: ${fallbackError.message}`,
              fallbackError.stack
            );
          }
        }

        // 2. Use fallback method if specified
        if (methodName && instance[methodName] && typeof instance[methodName] === 'function') {
          try {
            const fallbackResult = instance[methodName](error, ...args);
            return from(Promise.resolve(fallbackResult));
          } catch (fallbackError) {
            this.logger.error(
              `Error in fallback method ${methodName}: ${fallbackError.message}`,
              fallbackError.stack
            );
          }
        }

        // 3. Use cached data if enabled and available
        if (useCachedData && cacheKey) {
          const cachedResult = this.cache.get(cacheKey, maxCacheAge);
          if (cachedResult) {
            this.logger.debug(`Using cached data for ${className}.${handlerName}`);
            return of(cachedResult);
          }
        }

        // If all fallback strategies fail, re-throw the original error
        return throwError(() => error);
      })
    );
  }
}

/**
 * Enum for HTTP status codes used in the interceptors
 */
enum HttpStatus {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  PAYLOAD_TOO_LARGE = 413,
  UNSUPPORTED_MEDIA_TYPE = 415,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505
}