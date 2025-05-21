import { Logger } from '@nestjs/common';

/**
 * Enum representing the possible states of a circuit breaker.
 */
enum CircuitBreakerState {
  /** Circuit is closed and operations are executed normally */
  CLOSED = 'CLOSED',
  /** Circuit is open and operations are rejected immediately */
  OPEN = 'OPEN',
  /** Circuit is testing if the system has recovered */
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Configuration options for the RetryOnFailure decorator.
 */
/**
 * Interface defining the configuration options for the RetryOnFailure decorator.
 */
export interface RetryOnFailureOptions {
  /**
   * Maximum number of retry attempts before giving up.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds between retry attempts.
   * This will be used as the base for exponential backoff calculation.
   * @default 300
   */
  baseDelay?: number;

  /**
   * Maximum delay in milliseconds between retry attempts.
   * @default 3000
   */
  maxDelay?: number;

  /**
   * Jitter factor (0-1) to add randomness to retry delays to prevent thundering herd problem.
   * @default 0.3
   */
  jitterFactor?: number;

  /**
   * Array of error types or error predicates to retry on.
   * If not provided, all errors will trigger a retry.
   * @default undefined (retry on all errors)
   */
  retryableErrors?: (new (...args: any[]) => Error)[] | ((error: Error) => boolean);

  /**
   * Circuit breaker configuration for preventing cascading failures.
   * If provided, the circuit breaker pattern will be applied.
   */
  circuitBreaker?: {
    /**
     * Number of failures before opening the circuit.
     * @default 5
     */
    failureThreshold?: number;

    /**
     * Time in milliseconds to keep the circuit open before moving to half-open state.
     * @default 30000 (30 seconds)
     */
    resetTimeout?: number;

    /**
     * Number of successful operations required in half-open state to close the circuit.
     * @default 2
     */
    successThreshold?: number;
  };

  /**
   * Fallback function to execute when all retries are exhausted.
   * If provided, this function will be called instead of throwing the last error.
   */
  fallbackFn?: (...args: any[]) => any;

  /**
   * Whether to log retry attempts.
   * @default true
   */
  logRetryAttempts?: boolean;
}

/**
 * Circuit breaker state storage (shared across all instances).
 * This map stores the state of each circuit breaker, keyed by method ID.
 */
const circuitBreakerStates = new Map<string, {
  state: CircuitBreakerState;
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
}>();

/**
 * Decorator that implements retry logic with exponential backoff for operations that may fail transiently.
 * Improves resilience for database operations, external service calls, and event processing.
 * 
 * This decorator is part of the enhanced error handling framework for the AUSTA SuperApp,
 * implementing the retry with exponential backoff strategy as specified in the technical
 * specification section 5.4.3 (Error Handling Patterns).
 * 
 * Features:
 * - Exponential backoff with configurable parameters
 * - Circuit breaker pattern for failing dependencies
 * - Detailed retry logs for debugging and monitoring
 * - Custom fallback function execution after retry exhaustion
 * 
 * @param options Configuration options for the retry behavior
 * @returns Method decorator
 * 
 * @example
 * // Basic usage with default settings
 * @RetryOnFailure()
 * async fetchData() { ... }
 * 
 * @example
 * // Advanced usage with custom configuration
 * @RetryOnFailure({
 *   maxRetries: 5,
 *   baseDelay: 500,
 *   jitterFactor: 0.2,
 *   retryableErrors: [DatabaseConnectionError, TimeoutError],
 *   circuitBreaker: {
 *     failureThreshold: 3,
 *     resetTimeout: 60000
 *   },
 *   fallbackFn: (id) => ({ id, fallback: true, data: cachedData[id] })
 * })
 * async getUserProfile(id: string) { ... }
 */
export function RetryOnFailure(options: RetryOnFailureOptions = {}) {
  // Validate options
  if (options.maxRetries !== undefined && options.maxRetries < 0) {
    throw new Error('maxRetries must be a non-negative number');
  }
  if (options.baseDelay !== undefined && options.baseDelay <= 0) {
    throw new Error('baseDelay must be a positive number');
  }
  if (options.maxDelay !== undefined && options.maxDelay <= 0) {
    throw new Error('maxDelay must be a positive number');
  }
  if (options.jitterFactor !== undefined && (options.jitterFactor < 0 || options.jitterFactor > 1)) {
    throw new Error('jitterFactor must be between 0 and 1');
  }
  if (options.circuitBreaker) {
    if (options.circuitBreaker.failureThreshold !== undefined && options.circuitBreaker.failureThreshold <= 0) {
      throw new Error('circuitBreaker.failureThreshold must be a positive number');
    }
    if (options.circuitBreaker.resetTimeout !== undefined && options.circuitBreaker.resetTimeout <= 0) {
      throw new Error('circuitBreaker.resetTimeout must be a positive number');
    }
    if (options.circuitBreaker.successThreshold !== undefined && options.circuitBreaker.successThreshold <= 0) {
      throw new Error('circuitBreaker.successThreshold must be a positive number');
    }
  }
  const {
    maxRetries = 3,
    baseDelay = 300,
    maxDelay = 3000,
    jitterFactor = 0.3,
    retryableErrors,
    circuitBreaker,
    fallbackFn,
    logRetryAttempts = true
  } = options;

  const logger = new Logger('RetryOnFailure');

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodId = `${target.constructor.name}.${propertyKey}`;

    // Initialize circuit breaker state if configured
    if (circuitBreaker && !circuitBreakerStates.has(methodId)) {
      circuitBreakerStates.set(methodId, {
        state: CircuitBreakerState.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0
      });
    }

    descriptor.value = async function (...args: any[]) {
      // Check circuit breaker state if configured
      if (circuitBreaker) {
        const cbState = circuitBreakerStates.get(methodId)!;
        
        // If circuit is open, check if reset timeout has elapsed
        if (cbState.state === CircuitBreakerState.OPEN) {
          const now = Date.now();
          const resetTimeout = circuitBreaker.resetTimeout || 30000;
          
          if (now - cbState.lastFailureTime >= resetTimeout) {
            // Move to half-open state
            cbState.state = CircuitBreakerState.HALF_OPEN;
            cbState.successCount = 0;
            logger.log(`Circuit for ${methodId} moved to HALF_OPEN state`);
          } else {
            // Circuit is still open, execute fallback or throw error
            logger.warn(`Circuit for ${methodId} is OPEN, skipping execution`);
            if (fallbackFn) {
              return fallbackFn.apply(this, args);
            }
            throw new Error(`Circuit for ${methodId} is open`);
          }
        }
      }

      let lastError: Error;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          const result = await originalMethod.apply(this, args);
          
          // Update circuit breaker on success if configured
          if (circuitBreaker) {
            const cbState = circuitBreakerStates.get(methodId)!;
            
            if (cbState.state === CircuitBreakerState.HALF_OPEN) {
              cbState.successCount++;
              const successThreshold = circuitBreaker.successThreshold || 2;
              
              if (cbState.successCount >= successThreshold) {
                cbState.state = CircuitBreakerState.CLOSED;
                cbState.failureCount = 0;
                logger.log(`Circuit for ${methodId} moved to CLOSED state after ${successThreshold} successful operations`);
              }
            } else if (cbState.state === CircuitBreakerState.CLOSED) {
              // Reset failure count on success in closed state
              cbState.failureCount = 0;
            }
          }
          
          return result;
        } catch (error) {
          lastError = error as Error;
          
          // Check if we should retry this error
          const shouldRetry = isRetryableError(error as Error, retryableErrors);
          
          // Update circuit breaker on failure if configured
          if (circuitBreaker) {
            const cbState = circuitBreakerStates.get(methodId)!;
            cbState.failureCount++;
            cbState.lastFailureTime = Date.now();
            
            const failureThreshold = circuitBreaker.failureThreshold || 5;
            
            if (cbState.failureCount >= failureThreshold) {
              cbState.state = CircuitBreakerState.OPEN;
              logger.warn(`Circuit for ${methodId} moved to OPEN state after ${failureThreshold} failures`);
              
              // If circuit just opened and we have a fallback, use it
              if (fallbackFn) {
                return fallbackFn.apply(this, args);
              }
              throw new Error(`Circuit for ${methodId} opened after ${failureThreshold} failures: ${lastError.message}`);
            }
          }
          
          // If we've reached max retries or error is not retryable, throw the error
          if (attempt >= maxRetries || !shouldRetry) {
            break;
          }
          
          // Calculate delay with exponential backoff and jitter
          const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay, jitterFactor);
          
          if (logRetryAttempts) {
            logger.warn(
              `Retry attempt ${attempt + 1}/${maxRetries} for ${methodId} after ${delay}ms delay. ` +
              `Error: ${lastError.message}`
            );
          }
          
          // Wait before next retry
          await sleep(delay);
          attempt++;
        }
      }
      
      // All retries exhausted or error not retryable
      if (fallbackFn) {
        return fallbackFn.apply(this, args);
      }
      
      throw lastError;
    };

    return descriptor;
  };
}

/**
 * Determines if an error should be retried based on the retryableErrors configuration.
 * 
 * This function supports three modes of operation:
 * 1. If no retryableErrors is specified, all errors are retried
 * 2. If retryableErrors is a function, it's used as a predicate to determine if an error should be retried
 * 3. If retryableErrors is an array of error classes, errors that are instances of any of those classes are retried
 * 
 * @param error The error to check
 * @param retryableErrors Configuration specifying which errors to retry
 * @returns True if the error should be retried, false otherwise
 */
function isRetryableError(
  error: Error,
  retryableErrors?: (new (...args: any[]) => Error)[] | ((error: Error) => boolean)
): boolean {
  // If no retryableErrors specified, retry all errors
  if (!retryableErrors) {
    return true;
  }
  
  // If retryableErrors is a function, use it as a predicate
  if (typeof retryableErrors === 'function') {
    return retryableErrors(error);
  }
  
  // If retryableErrors is an array of error classes, check if error is an instance of any
  return retryableErrors.some(errorType => error instanceof errorType);
}

/**
 * Calculates the delay for the next retry attempt using exponential backoff with jitter.
 * 
 * The formula used is:
 * delay = min(baseDelay * 2^attempt * jitter, maxDelay)
 * 
 * Where jitter is a random value between (1-jitterFactor) and (1+jitterFactor).
 * This adds randomness to prevent the "thundering herd" problem where many
 * retries happen simultaneously after a failure.
 * 
 * @param attempt Current attempt number (0-based)
 * @param baseDelay Base delay in milliseconds
 * @param maxDelay Maximum delay in milliseconds
 * @param jitterFactor Jitter factor (0-1) to add randomness to retry delays
 * @returns Delay in milliseconds for the next retry attempt
 */
function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  jitterFactor: number
): number {
  // Calculate exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  
  // Apply jitter: random value between (1-jitterFactor) and (1+jitterFactor) of the delay
  const jitter = 1 + jitterFactor * (Math.random() * 2 - 1);
  
  // Apply jitter and cap at maxDelay
  return Math.min(exponentialDelay * jitter, maxDelay);
}

/**
 * Utility function to sleep for a specified duration.
 * Used to implement the delay between retry attempts.
 * 
 * @param ms Time to sleep in milliseconds
 * @returns Promise that resolves after the specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}