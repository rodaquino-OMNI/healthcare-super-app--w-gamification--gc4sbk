import { Request, Response, NextFunction } from 'express';
import { ErrorType, AppException } from '../../../shared/src/exceptions/exceptions.types';

/**
 * Enum representing the possible states of the circuit breaker.
 */
enum CircuitState {
  /** Normal operation, requests pass through to the service */
  CLOSED = 'CLOSED',
  /** Circuit is tripped, requests are blocked */
  OPEN = 'OPEN',
  /** Testing if the service has recovered */
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Interface for circuit breaker configuration options.
 */
interface CircuitBreakerOptions {
  /** Service name for identification in logs and metrics */
  serviceName: string;
  /** Number of consecutive failures before opening the circuit */
  failureThreshold: number;
  /** Time in milliseconds before attempting to half-open the circuit */
  resetTimeout: number;
  /** Maximum number of requests allowed during half-open state */
  halfOpenRequestLimit?: number;
  /** Optional function to check if service is healthy */
  healthCheck?: () => Promise<boolean>;
  /** Optional function to execute when circuit is open */
  fallback?: (req: Request, res: Response, next: NextFunction) => void;
  /** Optional timeout in milliseconds for requests */
  requestTimeout?: number;
  /** Maximum number of retry attempts for transient errors */
  maxRetries?: number;
  /** Base delay in milliseconds for exponential backoff */
  retryBaseDelay?: number;
  /** Optional function to determine if an error is retryable */
  isRetryable?: (error: Error) => boolean;
  /** Optional function to log state changes and errors */
  logger?: (message: string, data?: any) => void;
}

/**
 * Interface for circuit breaker metrics.
 */
interface CircuitBreakerMetrics {
  /** Current state of the circuit */
  state: CircuitState;
  /** Total number of successful requests */
  successCount: number;
  /** Total number of failed requests */
  failureCount: number;
  /** Number of consecutive failures */
  consecutiveFailures: number;
  /** Number of consecutive successes during half-open state */
  consecutiveSuccesses: number;
  /** Timestamp when the circuit was last opened */
  lastOpenTimestamp: number | null;
  /** Timestamp when the circuit was last closed */
  lastClosedTimestamp: number | null;
  /** Timestamp when the circuit last entered half-open state */
  lastHalfOpenTimestamp: number | null;
  /** Total number of rejected requests due to open circuit */
  rejectedCount: number;
  /** Total number of retry attempts */
  retryCount: number;
  /** Total number of timeout errors */
  timeoutCount: number;
  /** Failure rate as a percentage */
  failureRate: number;
}

/**
 * Class implementing the circuit breaker pattern.
 * Tracks failures to external dependencies and automatically opens the circuit
 * when failure thresholds are exceeded.
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private options: CircuitBreakerOptions;
  private metrics: CircuitBreakerMetrics;
  private resetTimer: NodeJS.Timeout | null = null;
  private halfOpenRequests: number = 0;

  /**
   * Creates a new CircuitBreaker instance.
   * 
   * @param options - Configuration options for the circuit breaker
   */
  constructor(options: CircuitBreakerOptions) {
    // Set default options
    this.options = {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      halfOpenRequestLimit: 1,
      requestTimeout: 10000, // 10 seconds
      maxRetries: 3,
      retryBaseDelay: 100, // 100ms
      isRetryable: () => true,
      logger: console.log,
      ...options
    };

    // Initialize metrics
    this.metrics = {
      state: CircuitState.CLOSED,
      successCount: 0,
      failureCount: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastOpenTimestamp: null,
      lastClosedTimestamp: Date.now(),
      lastHalfOpenTimestamp: null,
      rejectedCount: 0,
      retryCount: 0,
      timeoutCount: 0,
      failureRate: 0
    };

    this.log(`Circuit breaker initialized for service: ${options.serviceName}`);
  }

  /**
   * Executes a request through the circuit breaker.
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try half-open state
      if (this.shouldAttemptHalfOpen()) {
        this.transitionToHalfOpen();
      } else {
        this.metrics.rejectedCount++;
        this.log(`Circuit OPEN: Request rejected for ${this.options.serviceName}`);
        
        // Execute fallback if provided, otherwise return a service unavailable error
        if (this.options.fallback) {
          return this.options.fallback(req, res, next);
        } else {
          const error = new AppException(
            `Service ${this.options.serviceName} is unavailable`,
            ErrorType.EXTERNAL,
            'SERVICE_UNAVAILABLE',
            { serviceName: this.options.serviceName }
          );
          return next(error);
        }
      }
    }

    // Check if we've reached the half-open request limit
    if (this.state === CircuitState.HALF_OPEN && this.halfOpenRequests >= (this.options.halfOpenRequestLimit || 1)) {
      this.metrics.rejectedCount++;
      this.log(`Circuit HALF-OPEN: Request limit reached for ${this.options.serviceName}`);
      
      // Execute fallback if provided, otherwise return a service unavailable error
      if (this.options.fallback) {
        return this.options.fallback(req, res, next);
      } else {
        const error = new AppException(
          `Service ${this.options.serviceName} is recovering`,
          ErrorType.EXTERNAL,
          'SERVICE_RECOVERING',
          { serviceName: this.options.serviceName }
        );
        return next(error);
      }
    }

    // Increment half-open request counter
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenRequests++;
    }

    // Create a wrapper for the next function to track success/failure
    const nextWrapper = async (error?: any) => {
      if (error) {
        // Handle the error
        await this.handleFailure(error, req, res, next);
      } else {
        // Handle success
        this.handleSuccess();
        next();
      }
    };

    // Add timeout if configured
    if (this.options.requestTimeout) {
      const timeoutId = setTimeout(() => {
        this.metrics.timeoutCount++;
        const timeoutError = new AppException(
          `Request to ${this.options.serviceName} timed out after ${this.options.requestTimeout}ms`,
          ErrorType.EXTERNAL,
          'REQUEST_TIMEOUT',
          { 
            serviceName: this.options.serviceName,
            timeout: this.options.requestTimeout 
          }
        );
        nextWrapper(timeoutError);
      }, this.options.requestTimeout);

      // Store the original end method
      const originalEnd = res.end;
      
      // Override the end method to clear the timeout
      res.end = ((...args: any[]) => {
        clearTimeout(timeoutId);
        return originalEnd.apply(res, args);
      }) as any;
    }

    // Continue with the request
    try {
      next(nextWrapper);
    } catch (error) {
      await this.handleFailure(error, req, res, next);
    }
  }

  /**
   * Handles a successful request.
   */
  private handleSuccess(): void {
    this.metrics.successCount++;
    this.metrics.consecutiveFailures = 0;

    // Update failure rate
    const totalRequests = this.metrics.successCount + this.metrics.failureCount;
    this.metrics.failureRate = totalRequests > 0 ? (this.metrics.failureCount / totalRequests) * 100 : 0;

    // If in half-open state, check if we should close the circuit
    if (this.state === CircuitState.HALF_OPEN) {
      this.metrics.consecutiveSuccesses++;
      if (this.metrics.consecutiveSuccesses >= this.options.failureThreshold) {
        this.transitionToClosed();
      }
    }

    this.log(`Request to ${this.options.serviceName} succeeded`);
  }

  /**
   * Handles a failed request with retry logic.
   * 
   * @param error - The error that occurred
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async handleFailure(error: any, req: Request, res: Response, next: NextFunction): Promise<void> {
    this.metrics.failureCount++;
    this.metrics.consecutiveFailures++;
    this.metrics.consecutiveSuccesses = 0;

    // Update failure rate
    const totalRequests = this.metrics.successCount + this.metrics.failureCount;
    this.metrics.failureRate = totalRequests > 0 ? (this.metrics.failureCount / totalRequests) * 100 : 0;

    // Log the error
    this.log(`Request to ${this.options.serviceName} failed`, { error });

    // Check if the error is retryable
    if (this.options.isRetryable && this.options.isRetryable(error)) {
      // Get retry count from request or initialize it
      const retryCount = (req as any).__retryCount || 0;
      
      // Check if we've reached the maximum retry count
      if (retryCount < (this.options.maxRetries || 0)) {
        // Increment retry count
        (req as any).__retryCount = retryCount + 1;
        this.metrics.retryCount++;
        
        // Calculate delay with exponential backoff
        const delay = this.calculateBackoffDelay(retryCount);
        
        this.log(`Retrying request to ${this.options.serviceName} (attempt ${retryCount + 1}/${this.options.maxRetries}) after ${delay}ms`);
        
        // Wait for the backoff delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the request
        try {
          return this.execute(req, res, next);
        } catch (retryError) {
          // If retry fails, continue with normal failure handling
          this.log(`Retry attempt ${retryCount + 1} failed for ${this.options.serviceName}`, { error: retryError });
        }
      }
    }

    // Check if we should open the circuit
    if (this.state === CircuitState.CLOSED && this.metrics.consecutiveFailures >= this.options.failureThreshold) {
      this.transitionToOpen();
    }

    // If in half-open state, immediately open the circuit on failure
    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionToOpen();
    }

    // Pass the error to the next middleware
    next(error);
  }

  /**
   * Calculates the delay for exponential backoff.
   * 
   * @param retryCount - The current retry attempt number
   * @returns The delay in milliseconds
   */
  private calculateBackoffDelay(retryCount: number): number {
    const baseDelay = this.options.retryBaseDelay || 100;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 100; // Add some randomness to prevent thundering herd
    return exponentialDelay + jitter;
  }

  /**
   * Transitions the circuit to the open state.
   */
  private transitionToOpen(): void {
    if (this.state !== CircuitState.OPEN) {
      this.state = CircuitState.OPEN;
      this.metrics.state = CircuitState.OPEN;
      this.metrics.lastOpenTimestamp = Date.now();
      this.log(`Circuit OPENED for ${this.options.serviceName} due to ${this.metrics.consecutiveFailures} consecutive failures`);

      // Set a timer to transition to half-open state
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }

      this.resetTimer = setTimeout(() => {
        // Check service health if a health check function is provided
        if (this.options.healthCheck) {
          this.options.healthCheck()
            .then(isHealthy => {
              if (isHealthy) {
                this.transitionToHalfOpen();
              } else {
                this.log(`Health check failed for ${this.options.serviceName}, keeping circuit OPEN`);
                // Reset the timer to try again later
                this.resetTimer = setTimeout(() => this.shouldAttemptHalfOpen(), this.options.resetTimeout);
              }
            })
            .catch(error => {
              this.log(`Health check error for ${this.options.serviceName}, keeping circuit OPEN`, { error });
              // Reset the timer to try again later
              this.resetTimer = setTimeout(() => this.shouldAttemptHalfOpen(), this.options.resetTimeout);
            });
        } else {
          // No health check function, transition to half-open state
          this.transitionToHalfOpen();
        }
      }, this.options.resetTimeout);
    }
  }

  /**
   * Transitions the circuit to the half-open state.
   */
  private transitionToHalfOpen(): void {
    if (this.state !== CircuitState.HALF_OPEN) {
      this.state = CircuitState.HALF_OPEN;
      this.metrics.state = CircuitState.HALF_OPEN;
      this.metrics.lastHalfOpenTimestamp = Date.now();
      this.metrics.consecutiveSuccesses = 0;
      this.halfOpenRequests = 0;
      this.log(`Circuit HALF-OPENED for ${this.options.serviceName}`);
    }
  }

  /**
   * Transitions the circuit to the closed state.
   */
  private transitionToClosed(): void {
    if (this.state !== CircuitState.CLOSED) {
      this.state = CircuitState.CLOSED;
      this.metrics.state = CircuitState.CLOSED;
      this.metrics.lastClosedTimestamp = Date.now();
      this.metrics.consecutiveFailures = 0;
      this.metrics.consecutiveSuccesses = 0;
      this.halfOpenRequests = 0;
      this.log(`Circuit CLOSED for ${this.options.serviceName}`);
    }
  }

  /**
   * Checks if the circuit should attempt to transition to half-open state.
   * 
   * @returns True if the circuit should attempt to half-open, false otherwise
   */
  private shouldAttemptHalfOpen(): boolean {
    if (this.state !== CircuitState.OPEN || !this.metrics.lastOpenTimestamp) {
      return false;
    }

    const now = Date.now();
    const timeInOpenState = now - this.metrics.lastOpenTimestamp;
    return timeInOpenState >= this.options.resetTimeout;
  }

  /**
   * Gets the current metrics for the circuit breaker.
   * 
   * @returns The current metrics
   */
  public getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  /**
   * Logs a message with optional data.
   * 
   * @param message - The message to log
   * @param data - Optional data to include in the log
   */
  private log(message: string, data?: any): void {
    if (this.options.logger) {
      this.options.logger(`[CircuitBreaker:${this.options.serviceName}] ${message}`, data);
    }
  }
}

/**
 * Interface for circuit breaker middleware options.
 * Extends the base circuit breaker options with additional middleware-specific options.
 */
export interface CircuitBreakerMiddlewareOptions extends Omit<CircuitBreakerOptions, 'serviceName'> {
  /** Optional function to determine if the middleware should be applied to a request */
  shouldApply?: (req: Request) => boolean;
  /** Optional function to get a cache key from the request */
  getCacheKey?: (req: Request) => string;
  /** Optional cache storage for fallback responses */
  cache?: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any, ttl?: number) => Promise<void>;
  };
  /** Optional TTL for cached responses in milliseconds */
  cacheTtl?: number;
}

/**
 * Creates an Express middleware that implements the circuit breaker pattern.
 * 
 * This middleware protects applications from cascading failures when depending on external services by:
 * 1. Tracking failures to external dependencies
 * 2. Automatically opening the circuit (blocking further calls) when failure thresholds are exceeded
 * 3. Implementing a half-open state with testing requests after a cooling period
 * 4. Providing fallback mechanisms for handling requests when the circuit is open
 * 5. Supporting retry with exponential backoff for transient errors
 * 
 * @example
 * ```typescript
 * // Basic usage
 * app.use('/api/external-service', circuitBreakerMiddleware('external-api', {
 *   failureThreshold: 5,
 *   resetTimeout: 30000
 * }));
 * 
 * // With caching and fallback
 * app.use('/api/payment-service', circuitBreakerMiddleware('payment-api', {
 *   failureThreshold: 3,
 *   resetTimeout: 60000,
 *   getCacheKey: (req) => `payment-${req.params.id}`,
 *   cacheTtl: 300000 // 5 minutes
 * }));
 * ```
 * 
 * @param serviceName - Name of the service being protected
 * @param options - Configuration options for the circuit breaker
 * @returns Express middleware function
 */
export function circuitBreakerMiddleware(
  serviceName: string,
  options: CircuitBreakerMiddlewareOptions = {}
): (req: Request, res: Response, next: NextFunction) => void {
  // Create a new circuit breaker instance
  const circuitBreaker = new CircuitBreaker({
    serviceName,
    ...options
  });

  // Create a response cache for fallback responses
  const responseCache = new Map<string, { body: any; headers: any; status: number; timestamp: number }>();

  // Return the middleware function
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if the middleware should be applied to this request
    if (options.shouldApply && !options.shouldApply(req)) {
      return next();
    }

    // Create a fallback function that returns cached responses if available
    const fallback = async (req: Request, res: Response, next: NextFunction) => {
      // Try to get a cached response
      let cachedResponse = null;
      
      if (options.getCacheKey && (options.cache || responseCache)) {
        const cacheKey = options.getCacheKey(req);
        
        if (options.cache) {
          // Use the provided cache implementation
          try {
            cachedResponse = await options.cache.get(cacheKey);
          } catch (error) {
            console.error(`Error retrieving from cache for ${serviceName}:`, error);
          }
        } else {
          // Use the in-memory response cache
          const cached = responseCache.get(cacheKey);
          if (cached) {
            // Check if the cached response is still valid
            const now = Date.now();
            const maxAge = options.cacheTtl || 60000; // Default to 1 minute
            
            if (now - cached.timestamp <= maxAge) {
              cachedResponse = cached;
            } else {
              // Remove expired cache entry
              responseCache.delete(cacheKey);
            }
          }
        }
        
        if (cachedResponse) {
          // Return the cached response
          res.set(cachedResponse.headers || {});
          res.status(cachedResponse.status || 200).json(cachedResponse.body);
          return;
        }
      }

      // If no cached response is available, return a service unavailable error
      const error = new AppException(
        `Service ${serviceName} is temporarily unavailable`,
        ErrorType.EXTERNAL,
        'SERVICE_UNAVAILABLE',
        {
          circuitBreaker: true,
          serviceName
        }
      );
      res.status(503).json(error.toJSON());
    };

    // Override the original response methods to cache successful responses
    if (options.getCacheKey && (options.cache || responseCache)) {
      const cacheKey = options.getCacheKey(req);
      const originalJson = res.json;
      const originalSend = res.send;
      const originalEnd = res.end;

      // Override json method
      res.json = function(body: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseToCache = {
            body,
            headers: res.getHeaders(),
            status: res.statusCode,
            timestamp: Date.now()
          };

          // Store in the appropriate cache
          if (options.cache) {
            options.cache.set(cacheKey, responseToCache, options.cacheTtl).catch(error => {
              console.error(`Error storing in cache for ${serviceName}:`, error);
            });
          } else {
            responseCache.set(cacheKey, responseToCache);
          }
        }

        return originalJson.call(this, body);
      } as any;

      // Override send method to handle non-JSON responses
      res.send = function(body: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseToCache = {
            body,
            headers: res.getHeaders(),
            status: res.statusCode,
            timestamp: Date.now()
          };

          // Store in the appropriate cache
          if (options.cache) {
            options.cache.set(cacheKey, responseToCache, options.cacheTtl).catch(error => {
              console.error(`Error storing in cache for ${serviceName}:`, error);
            });
          } else {
            responseCache.set(cacheKey, responseToCache);
          }
        }

        return originalSend.call(this, body);
      } as any;

      // Ensure end method still works properly
      res.end = function(...args: any[]) {
        return originalEnd.apply(this, args);
      } as any;
    }

    // Execute the request through the circuit breaker
    circuitBreaker.execute(req, res, next);
  };
}

/**
 * Gets the metrics for a circuit breaker instance.
 * Useful for monitoring and observability of circuit breaker behavior.
 * 
 * @example
 * ```typescript
 * // Create a circuit breaker middleware
 * const middleware = circuitBreakerMiddleware('payment-api', options);
 * 
 * // Get metrics for the circuit breaker
 * app.get('/admin/circuit-breakers/payment-api', (req, res) => {
 *   const metrics = getCircuitBreakerMetrics(middleware);
 *   res.json(metrics);
 * });
 * ```
 * 
 * @param circuitBreaker - The circuit breaker instance
 * @returns The current metrics for the circuit breaker
 */
export function getCircuitBreakerMetrics(circuitBreaker: any): CircuitBreakerMetrics | null {
  if (circuitBreaker && typeof circuitBreaker.getMetrics === 'function') {
    return circuitBreaker.getMetrics();
  }
  return null;
}