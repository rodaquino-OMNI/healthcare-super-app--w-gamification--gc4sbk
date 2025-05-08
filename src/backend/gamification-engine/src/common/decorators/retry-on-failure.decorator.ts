import { LoggerService } from 'src/backend/shared/src/logging/logger.service';

/**
 * Interface for retry policy configuration.
 */
export interface RetryPolicyOptions {
  /**
   * Maximum number of retry attempts before giving up.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds before the first retry.
   * @default 100
   */
  initialDelay?: number;

  /**
   * Factor by which the delay increases with each retry attempt.
   * delay = initialDelay * (backoffFactor ^ retryCount)
   * @default 2
   */
  backoffFactor?: number;

  /**
   * Maximum delay in milliseconds between retries.
   * @default 30000 (30 seconds)
   */
  maxDelay?: number;

  /**
   * Whether to add jitter to the delay to prevent thundering herd problems.
   * @default true
   */
  jitter?: boolean;

  /**
   * Array of error types or error constructor functions that should trigger a retry.
   * If not provided, all errors will trigger a retry.
   */
  retryableErrors?: Array<Function | string>;

  /**
   * Optional fallback function to execute when all retries are exhausted.
   * The function receives the last error and the original method arguments.
   */
  fallbackFn?: (...args: any[]) => any;

  /**
   * Circuit breaker configuration.
   */
  circuitBreaker?: {
    /**
     * Number of consecutive failures before opening the circuit.
     * @default 5
     */
    failureThreshold?: number;
    
    /**
     * Time in milliseconds that the circuit remains open before moving to half-open state.
     * @default 30000 (30 seconds)
     */
    resetTimeout?: number;
  };
}

/**
 * Circuit breaker states.
 */
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Circuit breaker implementation to prevent repeated calls to failing dependencies.
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly logger: LoggerService;

  constructor(
    options: RetryPolicyOptions['circuitBreaker'] = {},
    logger: LoggerService
  ) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.logger = logger;
  }

  /**
   * Checks if the circuit is closed and calls can be made.
   */
  canMakeCall(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.logger.log(`Circuit moved to HALF_OPEN state`, 'CircuitBreaker');
        return true;
      }
      return false;
    }

    // HALF_OPEN state allows a single call to test the dependency
    return true;
  }

  /**
   * Records a successful call and resets the circuit if in HALF_OPEN state.
   */
  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      this.logger.log(`Circuit moved to CLOSED state after successful test call`, 'CircuitBreaker');
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on successful calls in closed state
      if (this.failureCount > 0) {
        this.failureCount = 0;
        this.logger.debug(`Circuit failure count reset after successful call`, 'CircuitBreaker');
      }
    }
  }

  /**
   * Records a failed call and potentially opens the circuit.
   */
  recordFailure(): void {
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.logger.log(`Circuit moved back to OPEN state after test call failed`, 'CircuitBreaker');
      return;
    }

    if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = CircuitState.OPEN;
        this.logger.log(`Circuit OPENED after ${this.failureCount} consecutive failures`, 'CircuitBreaker');
      }
    }
  }

  /**
   * Gets the current state of the circuit.
   */
  getState(): CircuitState {
    return this.state;
  }
}

// Store for circuit breakers, keyed by method name
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Calculates the delay for the next retry attempt using exponential backoff.
 * @param attempt Current retry attempt number (0-based)
 * @param options Retry policy options
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, options: RetryPolicyOptions): number {
  const {
    initialDelay = 100,
    backoffFactor = 2,
    maxDelay = 30000,
    jitter = true
  } = options;

  // Calculate exponential backoff
  let delay = initialDelay * Math.pow(backoffFactor, attempt);
  
  // Apply maximum delay limit
  delay = Math.min(delay, maxDelay);
  
  // Add jitter to prevent thundering herd problem
  if (jitter) {
    // Add random jitter between 0% and 25% of the delay
    const jitterAmount = delay * 0.25 * Math.random();
    delay = delay + jitterAmount;
  }
  
  return delay;
}

/**
 * Checks if an error should trigger a retry based on the retryableErrors configuration.
 * @param error The error that occurred
 * @param retryableErrors Array of error types or constructor functions that should trigger a retry
 * @returns True if the error should trigger a retry, false otherwise
 */
function isRetryableError(error: any, retryableErrors?: Array<Function | string>): boolean {
  // If no specific errors are defined, all errors are retryable
  if (!retryableErrors || retryableErrors.length === 0) {
    return true;
  }
  
  return retryableErrors.some(errorType => {
    if (typeof errorType === 'string') {
      // Check if error has a name or type property matching the string
      return error.name === errorType || error.type === errorType;
    } else if (typeof errorType === 'function') {
      // Check if error is an instance of the constructor function
      return error instanceof errorType;
    }
    return false;
  });
}

/**
 * Creates a delay using setTimeout wrapped in a Promise.
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the specified delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Decorator that implements retry logic with exponential backoff for operations that may fail transiently.
 * Improves resilience for database operations, external service calls, and event processing.
 * 
 * @param options Retry policy configuration
 * @returns Method decorator
 * 
 * @example
 * // Basic usage with default options
 * @RetryOnFailure()
 * async findUserById(id: string): Promise<User> {
 *   // Method that might fail transiently
 * }
 * 
 * @example
 * // Advanced usage with custom configuration
 * @RetryOnFailure({
 *   maxRetries: 5,
 *   initialDelay: 200,
 *   backoffFactor: 3,
 *   retryableErrors: [DatabaseConnectionError, TimeoutError],
 *   fallbackFn: (error, id) => ({ id, name: 'Default User' })
 * })
 * async findUserById(id: string): Promise<User> {
 *   // Method that might fail transiently
 * }
 */
export function RetryOnFailure(options: RetryPolicyOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = `${target.constructor.name}.${propertyKey}`;
    
    // Set default options
    const retryOptions: RetryPolicyOptions = {
      maxRetries: 3,
      initialDelay: 100,
      backoffFactor: 2,
      maxDelay: 30000,
      jitter: true,
      ...options
    };

    descriptor.value = async function(...args: any[]) {
      // Get or create a circuit breaker for this method
      if (!circuitBreakers.has(methodName) && retryOptions.circuitBreaker) {
        // Get logger from the instance if available, or create a new one
        const logger = this.logger || new LoggerService();
        circuitBreakers.set(methodName, new CircuitBreaker(retryOptions.circuitBreaker, logger));
      }
      
      const circuitBreaker = circuitBreakers.get(methodName);
      
      // Check if circuit breaker is open
      if (circuitBreaker && !circuitBreaker.canMakeCall()) {
        const logger = this.logger || new LoggerService();
        logger.warn(`Circuit breaker open for ${methodName}, skipping call`, 'RetryOnFailure');
        
        // If a fallback function is provided, execute it
        if (retryOptions.fallbackFn) {
          return retryOptions.fallbackFn.apply(this, [new Error('Circuit breaker open'), ...args]);
        }
        
        throw new Error(`Service unavailable: Circuit breaker open for ${methodName}`);
      }
      
      let lastError: any;
      let attempt = 0;
      
      while (attempt <= retryOptions.maxRetries!) {
        try {
          const result = await originalMethod.apply(this, args);
          
          // Record successful call in circuit breaker
          if (circuitBreaker) {
            circuitBreaker.recordSuccess();
          }
          
          return result;
        } catch (error) {
          lastError = error;
          
          // Get logger from the instance if available, or create a new one
          const logger = this.logger || new LoggerService();
          
          // Check if we should retry this error
          if (!isRetryableError(error, retryOptions.retryableErrors)) {
            logger.error(
              `Non-retryable error in ${methodName}: ${error.message}`,
              error.stack,
              'RetryOnFailure'
            );
            
            // If a fallback function is provided for non-retryable errors, execute it
            if (retryOptions.fallbackFn) {
              logger.log(`Executing fallback function for non-retryable error in ${methodName}`, 'RetryOnFailure');
              return retryOptions.fallbackFn.apply(this, [error, ...args]);
            }
            
            throw error;
          }
          
          // Record failure in circuit breaker
          if (circuitBreaker) {
            circuitBreaker.recordFailure();
          }
          
          // If we've reached max retries, throw the last error or use fallback
          if (attempt >= retryOptions.maxRetries!) {
            logger.error(
              `Max retries (${retryOptions.maxRetries}) reached for ${methodName}: ${error.message}`,
              error.stack,
              'RetryOnFailure'
            );
            
            // If a fallback function is provided, execute it
            if (retryOptions.fallbackFn) {
              return retryOptions.fallbackFn.apply(this, [error, ...args]);
            }
            
            throw error;
          }
          
          // Calculate delay for next retry
          const retryDelay = calculateDelay(attempt, retryOptions);
          
          // Create a more detailed log message with context
          const errorContext = error.context || {};
          const errorCode = error.code || error.errorCode || 'UNKNOWN';
          
          logger.warn(
            `Retry attempt ${attempt + 1}/${retryOptions.maxRetries! + 1} for ${methodName} ` +
            `after ${Math.round(retryDelay)}ms: ${error.message} [${errorCode}]`,
            'RetryOnFailure'
          );
          
          // Log additional debug information if available
          if (Object.keys(errorContext).length > 0) {
            logger.debug(
              `Error context for retry in ${methodName}: ${JSON.stringify(errorContext)}`,
              'RetryOnFailure'
            );
          }
          
          // Wait before next retry
          await delay(retryDelay);
          
          attempt++;
        }
      }
      
      // This should never be reached due to the checks above, but TypeScript requires a return
      throw lastError;
    };
    
    return descriptor;
  };
}