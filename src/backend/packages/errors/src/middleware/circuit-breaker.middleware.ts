/**
 * @file circuit-breaker.middleware.ts
 * @description Express middleware that implements the circuit breaker pattern to protect
 * applications from cascading failures when depending on external services.
 * 
 * This middleware tracks failures to external dependencies, automatically opens the circuit
 * (blocking further calls) when failure thresholds are exceeded, implements a half-open state
 * with testing requests after a cooling period, and provides fallback mechanisms for handling
 * requests when the circuit is open.
 */

import { Request, Response, NextFunction } from 'express';
import { BaseError, ErrorType, JourneyContext, ErrorContext } from '../base';
import { ErrorRecoveryStrategy } from '../types';

/**
 * Enum representing the possible states of a circuit breaker.
 */
enum CircuitState {
  /**
   * Circuit is closed, requests are allowed to pass through
   */
  CLOSED = 'closed',
  
  /**
   * Circuit is open, requests are blocked and fallback is used
   */
  OPEN = 'open',
  
  /**
   * Circuit is half-open, allowing test requests to check if the service has recovered
   */
  HALF_OPEN = 'half-open'
}

/**
 * Interface for circuit breaker configuration options.
 */
export interface CircuitBreakerOptions {
  /**
   * Name of the circuit breaker, used for identification and metrics
   */
  name: string;
  
  /**
   * Number of failures required to open the circuit
   * @default 5
   */
  failureThreshold?: number;
  
  /**
   * Time in milliseconds to keep the circuit open before transitioning to half-open
   * @default 30000 (30 seconds)
   */
  resetTimeout?: number;
  
  /**
   * Number of successful test requests required to close the circuit when in half-open state
   * @default 3
   */
  successThreshold?: number;
  
  /**
   * Time in milliseconds after which a request is considered timed out
   * @default 10000 (10 seconds)
   */
  requestTimeout?: number;
  
  /**
   * Function to determine if an error should be counted as a failure
   * @default Counts ErrorType.EXTERNAL, ErrorType.TIMEOUT, and ErrorType.SERVICE_UNAVAILABLE as failures
   */
  isFailure?: (error: Error) => boolean;
  
  /**
   * Function to handle requests when the circuit is open
   * @default Returns a 503 Service Unavailable response
   */
  fallback?: (req: Request, res: Response, next: NextFunction) => void;
  
  /**
   * Function to log circuit state changes and failures
   * @default Logs to console
   */
  logger?: (message: string, data?: any) => void;
  
  /**
   * Function to record metrics about circuit state and failures
   * @default No-op function
   */
  metricsRecorder?: (name: string, value: any, tags?: Record<string, string>) => void;
  
  /**
   * Journey context for error handling
   * @default JourneyContext.SYSTEM
   */
  journeyContext?: JourneyContext;
  
  /**
   * Function to check if the external service is healthy
   * @default No health check
   */
  healthCheck?: () => Promise<boolean>;
  
  /**
   * Interval in milliseconds to perform health checks when the circuit is open
   * @default 60000 (60 seconds)
   */
  healthCheckInterval?: number;
}

/**
 * Class representing the state and behavior of a circuit breaker.
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successfulTests: number = 0;
  private lastFailureTime: number = 0;
  private lastStateChangeTime: number = Date.now();
  private healthCheckTimer: NodeJS.Timeout | null = null;
  
  private readonly options: Required<CircuitBreakerOptions>;
  
  /**
   * Creates a new CircuitBreaker instance.
   * 
   * @param options - Configuration options for the circuit breaker
   */
  constructor(options: CircuitBreakerOptions) {
    // Set default options
    this.options = {
      name: options.name,
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeout: options.resetTimeout ?? 30000,
      successThreshold: options.successThreshold ?? 3,
      requestTimeout: options.requestTimeout ?? 10000,
      isFailure: options.isFailure ?? this.defaultIsFailure,
      fallback: options.fallback ?? this.defaultFallback,
      logger: options.logger ?? this.defaultLogger,
      metricsRecorder: options.metricsRecorder ?? this.defaultMetricsRecorder,
      journeyContext: options.journeyContext ?? JourneyContext.SYSTEM,
      healthCheck: options.healthCheck ?? (async () => true),
      healthCheckInterval: options.healthCheckInterval ?? 60000
    };
    
    // Log initial state
    this.logStateChange(CircuitState.CLOSED);
    
    // Record initial metrics
    this.recordStateMetric(CircuitState.CLOSED);
  }
  
  /**
   * Default function to determine if an error should be counted as a failure.
   * 
   * @param error - The error to check
   * @returns True if the error should be counted as a failure, false otherwise
   */
  private defaultIsFailure(error: Error): boolean {
    if (error instanceof BaseError) {
      return [
        ErrorType.EXTERNAL,
        ErrorType.TIMEOUT,
        ErrorType.SERVICE_UNAVAILABLE
      ].includes(error.type);
    }
    
    // For non-BaseError instances, count as failure if it's a network or timeout error
    return error.message.includes('ECONNREFUSED') ||
           error.message.includes('ETIMEDOUT') ||
           error.message.includes('ECONNRESET') ||
           error.message.includes('socket hang up');
  }
  
  /**
   * Default fallback function to handle requests when the circuit is open.
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private defaultFallback(req: Request, res: Response, next: NextFunction): void {
    const errorContext: ErrorContext = {
      journey: this.options.journeyContext,
      requestId: req.headers['x-request-id'] as string,
      traceId: req.headers['x-trace-id'] as string,
      timestamp: new Date()
    };
    
    const error = new BaseError(
      `Service unavailable: circuit breaker ${this.options.name} is open`,
      ErrorType.SERVICE_UNAVAILABLE,
      'CIRCUIT_BREAKER_OPEN',
      errorContext,
      { circuitName: this.options.name },
      'Please try again later when the service has recovered'
    );
    
    res.status(503).json(error.toJSON());
  }
  
  /**
   * Default logger function.
   * 
   * @param message - Message to log
   * @param data - Additional data to log
   */
  private defaultLogger(message: string, data?: any): void {
    console.log(`[CircuitBreaker:${this.options.name}] ${message}`, data);
  }
  
  /**
   * Default metrics recorder function (no-op).
   * 
   * @param name - Metric name
   * @param value - Metric value
   * @param tags - Metric tags
   */
  private defaultMetricsRecorder(name: string, value: any, tags?: Record<string, string>): void {
    // No-op by default
  }
  
  /**
   * Logs a state change event.
   * 
   * @param newState - The new state of the circuit breaker
   */
  private logStateChange(newState: CircuitState): void {
    const oldState = this.state;
    this.options.logger(
      `State changed from ${oldState} to ${newState}`,
      {
        circuitName: this.options.name,
        oldState,
        newState,
        failures: this.failures,
        timestamp: new Date().toISOString()
      }
    );
  }
  
  /**
   * Records a metric for the current state of the circuit breaker.
   * 
   * @param state - The state to record
   */
  private recordStateMetric(state: CircuitState): void {
    this.options.metricsRecorder(
      'circuit_breaker_state',
      state === CircuitState.CLOSED ? 0 : state === CircuitState.HALF_OPEN ? 1 : 2,
      {
        circuit_name: this.options.name,
        state
      }
    );
  }
  
  /**
   * Records a metric for a failure.
   */
  private recordFailureMetric(): void {
    this.options.metricsRecorder(
      'circuit_breaker_failure',
      1,
      { circuit_name: this.options.name }
    );
    
    this.options.metricsRecorder(
      'circuit_breaker_failure_count',
      this.failures,
      { circuit_name: this.options.name }
    );
  }
  
  /**
   * Records a metric for a success.
   */
  private recordSuccessMetric(): void {
    this.options.metricsRecorder(
      'circuit_breaker_success',
      1,
      { circuit_name: this.options.name }
    );
  }
  
  /**
   * Transitions the circuit breaker to the open state.
   */
  private transitionToOpen(): void {
    if (this.state !== CircuitState.OPEN) {
      this.state = CircuitState.OPEN;
      this.lastStateChangeTime = Date.now();
      this.logStateChange(CircuitState.OPEN);
      this.recordStateMetric(CircuitState.OPEN);
      
      // Start health check timer if a health check function is provided
      if (this.options.healthCheck && !this.healthCheckTimer) {
        this.startHealthCheckTimer();
      }
    }
  }
  
  /**
   * Transitions the circuit breaker to the half-open state.
   */
  private transitionToHalfOpen(): void {
    if (this.state !== CircuitState.HALF_OPEN) {
      this.state = CircuitState.HALF_OPEN;
      this.successfulTests = 0;
      this.lastStateChangeTime = Date.now();
      this.logStateChange(CircuitState.HALF_OPEN);
      this.recordStateMetric(CircuitState.HALF_OPEN);
    }
  }
  
  /**
   * Transitions the circuit breaker to the closed state.
   */
  private transitionToClosed(): void {
    if (this.state !== CircuitState.CLOSED) {
      this.state = CircuitState.CLOSED;
      this.failures = 0;
      this.lastStateChangeTime = Date.now();
      this.logStateChange(CircuitState.CLOSED);
      this.recordStateMetric(CircuitState.CLOSED);
      
      // Stop health check timer if it's running
      this.stopHealthCheckTimer();
    }
  }
  
  /**
   * Starts the health check timer to periodically check if the service has recovered.
   */
  private startHealthCheckTimer(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(async () => {
      try {
        const isHealthy = await this.options.healthCheck();
        
        if (isHealthy) {
          this.options.logger('Health check passed, transitioning to half-open state');
          this.transitionToHalfOpen();
          this.stopHealthCheckTimer();
        }
      } catch (error) {
        this.options.logger('Health check failed', { error });
      }
    }, this.options.healthCheckInterval);
  }
  
  /**
   * Stops the health check timer.
   */
  private stopHealthCheckTimer(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }
  
  /**
   * Records a successful request.
   */
  public recordSuccess(): void {
    this.recordSuccessMetric();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successfulTests++;
      
      if (this.successfulTests >= this.options.successThreshold) {
        this.transitionToClosed();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failures counter on success in closed state
      this.failures = 0;
    }
  }
  
  /**
   * Records a failed request.
   * 
   * @param error - The error that occurred
   * @returns True if the error was counted as a failure, false otherwise
   */
  public recordFailure(error: Error): boolean {
    if (!this.options.isFailure(error)) {
      return false;
    }
    
    this.lastFailureTime = Date.now();
    this.recordFailureMetric();
    
    if (this.state === CircuitState.CLOSED) {
      this.failures++;
      
      if (this.failures >= this.options.failureThreshold) {
        this.transitionToOpen();
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.transitionToOpen();
    }
    
    return true;
  }
  
  /**
   * Checks if the circuit is open and should block requests.
   * 
   * @returns True if the circuit is open, false otherwise
   */
  public isOpen(): boolean {
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      if (now - this.lastStateChangeTime >= this.options.resetTimeout) {
        this.transitionToHalfOpen();
        return false;
      }
      return true;
    }
    
    return false;
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
   * Gets the number of consecutive failures.
   * 
   * @returns The number of failures
   */
  public getFailureCount(): number {
    return this.failures;
  }
  
  /**
   * Gets the time since the last failure in milliseconds.
   * 
   * @returns Time since last failure in milliseconds, or -1 if no failures have occurred
   */
  public getTimeSinceLastFailure(): number {
    if (this.lastFailureTime === 0) {
      return -1;
    }
    
    return Date.now() - this.lastFailureTime;
  }
  
  /**
   * Gets the time since the last state change in milliseconds.
   * 
   * @returns Time since last state change in milliseconds
   */
  public getTimeSinceLastStateChange(): number {
    return Date.now() - this.lastStateChangeTime;
  }
  
  /**
   * Manually resets the circuit breaker to the closed state.
   * Useful for testing or administrative operations.
   */
  public reset(): void {
    this.transitionToClosed();
  }
}

/**
 * Map of circuit breakers by name.
 * Used to share circuit breakers across multiple middleware instances.
 */
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Creates a circuit breaker middleware for Express applications.
 * 
 * @param options - Configuration options for the circuit breaker
 * @returns Express middleware function
 */
export function circuitBreakerMiddleware(options: CircuitBreakerOptions) {
  // Get or create a circuit breaker instance
  let circuitBreaker = circuitBreakers.get(options.name);
  
  if (!circuitBreaker) {
    circuitBreaker = new CircuitBreaker(options);
    circuitBreakers.set(options.name, circuitBreaker);
  }
  
  // Return the middleware function
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if the circuit is open
    if (circuitBreaker.isOpen()) {
      // Execute fallback if circuit is open
      return options.fallback ? 
        options.fallback(req, res, next) : 
        circuitBreaker['defaultFallback'](req, res, next);
    }
    
    // Create a response interceptor to track success/failure
    const originalSend = res.send;
    let responseSent = false;
    
    res.send = function(body?: any): Response {
      responseSent = true;
      
      // Check if response is an error (status code >= 500)
      if (res.statusCode >= 500) {
        const error = new Error(`HTTP ${res.statusCode} response`);
        circuitBreaker.recordFailure(error);
      } else {
        circuitBreaker.recordSuccess();
      }
      
      return originalSend.call(this, body);
    };
    
    // Set a timeout to detect long-running requests
    const timeoutId = setTimeout(() => {
      if (!responseSent) {
        const errorContext: ErrorContext = {
          journey: options.journeyContext,
          requestId: req.headers['x-request-id'] as string,
          traceId: req.headers['x-trace-id'] as string,
          timestamp: new Date()
        };
        
        const timeoutError = new BaseError(
          `Request timed out after ${options.requestTimeout}ms`,
          ErrorType.TIMEOUT,
          'REQUEST_TIMEOUT',
          errorContext,
          { circuitName: options.name },
          'The request took too long to complete'
        );
        
        circuitBreaker.recordFailure(timeoutError);
        
        // Only send response if one hasn't been sent yet
        if (!responseSent && !res.headersSent) {
          res.status(504).json(timeoutError.toJSON());
        }
      }
    }, options.requestTimeout || 10000);
    
    // Call the next middleware and handle errors
    try {
      await new Promise<void>((resolve, reject) => {
        // Listen for response finish event to clear timeout
        res.on('finish', () => {
          clearTimeout(timeoutId);
          resolve();
        });
        
        // Call next middleware
        next((err?: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (error: any) {
      // Clear timeout to prevent double-handling
      clearTimeout(timeoutId);
      
      // Record failure if it's a relevant error type
      const isRelevantFailure = circuitBreaker.recordFailure(error);
      
      // If the error was recorded as a failure and we're now open, use fallback
      if (isRelevantFailure && circuitBreaker.isOpen()) {
        return options.fallback ? 
          options.fallback(req, res, next) : 
          circuitBreaker['defaultFallback'](req, res, next);
      }
      
      // Otherwise, pass the error to the next error handler
      next(error);
    }
  };
}

/**
 * Creates a circuit breaker middleware with a cached data fallback strategy.
 * 
 * @param options - Circuit breaker options
 * @param cacheProvider - Function that returns cached data for the request
 * @param cacheKeyGenerator - Function that generates a cache key from the request
 * @returns Express middleware function
 */
export function circuitBreakerWithCache<T>(
  options: CircuitBreakerOptions,
  cacheProvider: (key: string) => Promise<T | null>,
  cacheKeyGenerator: (req: Request) => string
) {
  // Create a fallback function that uses cached data
  const cacheFallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cacheKey = cacheKeyGenerator(req);
      const cachedData = await cacheProvider(cacheKey);
      
      if (cachedData) {
        // Add header to indicate cached response
        res.setHeader('X-Circuit-Breaker-Fallback', 'cached');
        res.json(cachedData);
      } else {
        // No cached data available, use default fallback
        const errorContext: ErrorContext = {
          journey: options.journeyContext || JourneyContext.SYSTEM,
          requestId: req.headers['x-request-id'] as string,
          traceId: req.headers['x-trace-id'] as string,
          timestamp: new Date()
        };
        
        const error = new BaseError(
          `Service unavailable and no cached data available`,
          ErrorType.SERVICE_UNAVAILABLE,
          'CIRCUIT_BREAKER_NO_CACHE',
          errorContext,
          { 
            circuitName: options.name,
            recoveryStrategy: ErrorRecoveryStrategy.CACHED_DATA
          },
          'Please try again later when the service has recovered'
        );
        
        res.status(503).json(error.toJSON());
      }
    } catch (error) {
      // If cache access fails, use default fallback
      const errorContext: ErrorContext = {
        journey: options.journeyContext || JourneyContext.SYSTEM,
        requestId: req.headers['x-request-id'] as string,
        traceId: req.headers['x-trace-id'] as string,
        timestamp: new Date()
      };
      
      const fallbackError = new BaseError(
        `Service unavailable and cache access failed`,
        ErrorType.SERVICE_UNAVAILABLE,
        'CIRCUIT_BREAKER_CACHE_ERROR',
        errorContext,
        { 
          circuitName: options.name,
          recoveryStrategy: ErrorRecoveryStrategy.CACHED_DATA,
          originalError: error
        },
        'Please try again later when the service has recovered'
      );
      
      res.status(503).json(fallbackError.toJSON());
    }
  };
  
  // Create and return the circuit breaker middleware with the cache fallback
  return circuitBreakerMiddleware({
    ...options,
    fallback: cacheFallback
  });
}

/**
 * Creates a circuit breaker middleware with a graceful degradation fallback strategy.
 * 
 * @param options - Circuit breaker options
 * @param degradedHandler - Function that provides a degraded version of the functionality
 * @returns Express middleware function
 */
export function circuitBreakerWithDegradation(
  options: CircuitBreakerOptions,
  degradedHandler: (req: Request, res: Response, next: NextFunction) => void
) {
  // Create a fallback function that uses degraded functionality
  const degradationFallback = (req: Request, res: Response, next: NextFunction) => {
    // Add header to indicate degraded response
    res.setHeader('X-Circuit-Breaker-Fallback', 'degraded');
    
    // Call the degraded handler
    degradedHandler(req, res, next);
  };
  
  // Create and return the circuit breaker middleware with the degradation fallback
  return circuitBreakerMiddleware({
    ...options,
    fallback: degradationFallback
  });
}

/**
 * Gets a circuit breaker instance by name.
 * Useful for monitoring and administrative operations.
 * 
 * @param name - Name of the circuit breaker
 * @returns Circuit breaker instance or undefined if not found
 */
export function getCircuitBreaker(name: string): {
  state: string;
  failures: number;
  timeSinceLastFailure: number;
  timeSinceLastStateChange: number;
  reset: () => void;
} | undefined {
  const circuitBreaker = circuitBreakers.get(name);
  
  if (!circuitBreaker) {
    return undefined;
  }
  
  return {
    state: circuitBreaker.getState(),
    failures: circuitBreaker.getFailureCount(),
    timeSinceLastFailure: circuitBreaker.getTimeSinceLastFailure(),
    timeSinceLastStateChange: circuitBreaker.getTimeSinceLastStateChange(),
    reset: () => circuitBreaker.reset()
  };
}

/**
 * Gets the status of all circuit breakers.
 * Useful for health checks and monitoring.
 * 
 * @returns Object with circuit breaker statuses
 */
export function getAllCircuitBreakers(): Record<string, {
  state: string;
  failures: number;
  timeSinceLastFailure: number;
  timeSinceLastStateChange: number;
}> {
  const result: Record<string, any> = {};
  
  for (const [name, circuitBreaker] of circuitBreakers.entries()) {
    result[name] = {
      state: circuitBreaker.getState(),
      failures: circuitBreaker.getFailureCount(),
      timeSinceLastFailure: circuitBreaker.getTimeSinceLastFailure(),
      timeSinceLastStateChange: circuitBreaker.getTimeSinceLastStateChange()
    };
  }
  
  return result;
}