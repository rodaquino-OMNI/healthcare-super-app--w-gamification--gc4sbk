/**
 * Async Error Handler
 * 
 * Provides utilities for consistent handling of asynchronous errors in promise chains and async/await functions.
 * These utilities help prevent unhandled promise rejections, properly capture stack traces, and ensure
 * errors in async code are consistently handled across the application.
 */

import { AppException, ErrorType } from '@backend/shared/src/exceptions/exceptions.types';

/**
 * Type for any function that returns a Promise
 */
export type AsyncFunction<T = any, Args extends any[] = any[]> = (...args: Args) => Promise<T>;

/**
 * Type for error handler functions
 */
export type ErrorHandler<E = Error> = (error: E) => void;

/**
 * Type for error transformer functions that convert one error type to another
 */
export type ErrorTransformer<E = Error, R = Error> = (error: E) => R;

/**
 * Options for asyncTryCatch
 */
export interface AsyncTryCatchOptions<E = Error, R = Error> {
  /**
   * Error handler to execute when an error is caught
   */
  errorHandler?: ErrorHandler<E>;
  
  /**
   * Error transformer to convert caught errors to a different type
   */
  errorTransformer?: ErrorTransformer<E, R>;
  
  /**
   * Whether to rethrow the error after handling
   * @default true
   */
  rethrow?: boolean;
  
  /**
   * Specific error types to catch
   * If provided, only errors of these types will be caught
   */
  catchErrorTypes?: Array<new (...args: any[]) => E>;
}

/**
 * Options for createSafePromise
 */
export interface SafePromiseOptions<E = Error, R = Error> {
  /**
   * Error handler to execute when an error is caught
   */
  errorHandler?: ErrorHandler<E>;
  
  /**
   * Error transformer to convert caught errors to a different type
   */
  errorTransformer?: ErrorTransformer<E, R>;
  
  /**
   * Timeout in milliseconds after which the promise will be rejected
   */
  timeout?: number;
  
  /**
   * Custom error to throw when timeout occurs
   */
  timeoutError?: Error;
}

/**
 * Wraps an async function with standardized error handling.
 * 
 * @param fn - The async function to wrap
 * @param options - Options for error handling
 * @returns A wrapped function that handles errors consistently
 * 
 * @example
 * // Basic usage
 * const safeFunction = asyncTryCatch(async () => {
 *   // async operations that might throw
 * });
 * 
 * // With custom error handling
 * const safeFunction = asyncTryCatch(
 *   async () => { /* ... */ },
 *   {
 *     errorHandler: (err) => console.error('Caught error:', err),
 *     errorTransformer: (err) => new AppException(
 *       'Operation failed',
 *       ErrorType.TECHNICAL,
 *       'ASYNC_001',
 *       { originalError: err.message },
 *       err
 *     ),
 *     rethrow: true
 *   }
 * );
 */
export function asyncTryCatch<T, Args extends any[], E = Error, R = Error>(
  fn: AsyncFunction<T, Args>,
  options: AsyncTryCatchOptions<E, R> = {}
): AsyncFunction<T, Args> {
  const {
    errorHandler,
    errorTransformer,
    rethrow = true,
    catchErrorTypes
  } = options;

  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Only handle errors of specified types if catchErrorTypes is provided
      if (catchErrorTypes && catchErrorTypes.length > 0) {
        const shouldCatch = catchErrorTypes.some(errorType => error instanceof errorType);
        if (!shouldCatch) {
          throw error;
        }
      }

      // Cast error to expected type
      const typedError = error as E;

      // Execute error handler if provided
      if (errorHandler) {
        errorHandler(typedError);
      }

      // Transform error if transformer is provided
      const transformedError = errorTransformer ? errorTransformer(typedError) : error;

      // Rethrow the error (original or transformed) if rethrow is true
      if (rethrow) {
        throw transformedError;
      }

      // If we're not rethrowing and the function is expected to return a value,
      // we need to return something to satisfy TypeScript
      return undefined as unknown as T;
    }
  };
}

/**
 * Creates a safe promise that won't cause unhandled rejections and supports timeout.
 * 
 * @param promise - The promise to wrap
 * @param options - Options for error handling and timeout
 * @returns A new promise that safely handles errors
 * 
 * @example
 * // Basic usage
 * const result = await createSafePromise(fetchData());
 * 
 * // With timeout
 * const result = await createSafePromise(fetchData(), {
 *   timeout: 5000,
 *   timeoutError: new AppException(
 *     'Operation timed out',
 *     ErrorType.TECHNICAL,
 *     'TIMEOUT_001'
 *   )
 * });
 */
export function createSafePromise<T, E = Error, R = Error>(
  promise: Promise<T>,
  options: SafePromiseOptions<E, R> = {}
): Promise<T> {
  const {
    errorHandler,
    errorTransformer,
    timeout,
    timeoutError = new AppException(
      'Operation timed out',
      ErrorType.TECHNICAL,
      'TIMEOUT_001',
      { timeoutMs: timeout }
    )
  } = options;

  // Create a timeout promise if timeout is specified
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = timeout
    ? new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(timeoutError);
        }, timeout);
      })
    : null;

  // Wrap the original promise to handle errors
  const wrappedPromise = promise.catch((error: E) => {
    // Execute error handler if provided
    if (errorHandler) {
      errorHandler(error);
    }

    // Transform error if transformer is provided
    const transformedError = errorTransformer ? errorTransformer(error) : error;

    // Rethrow the transformed error
    throw transformedError;
  }).finally(() => {
    // Clear the timeout if it was set
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });

  // If timeout is specified, race the wrapped promise against the timeout promise
  return timeoutPromise
    ? Promise.race([wrappedPromise, timeoutPromise])
    : wrappedPromise;
}

/**
 * A class that provides reactive error handling for async operations.
 * Useful for implementing retry logic, circuit breaking, and other error recovery patterns.
 */
export class AsyncErrorBoundary<T = any, E = Error> {
  private errorHandlers: ErrorHandler<E>[] = [];
  private errorTransformers: ErrorTransformer<E, any>[] = [];
  private retryCount = 0;
  private maxRetries = 0;
  private retryDelay = 0;
  private exponentialBackoff = false;
  private circuitOpen = false;
  private circuitResetTimeout = 0;
  private circuitResetTimer: NodeJS.Timeout | null = null;
  private fallbackValue: T | null = null;
  private hasFallback = false;

  /**
   * Adds an error handler to the boundary.
   * 
   * @param handler - The error handler function
   * @returns This instance for chaining
   */
  public onError(handler: ErrorHandler<E>): AsyncErrorBoundary<T, E> {
    this.errorHandlers.push(handler);
    return this;
  }

  /**
   * Adds an error transformer to the boundary.
   * 
   * @param transformer - The error transformer function
   * @returns This instance for chaining
   */
  public transformError<R>(transformer: ErrorTransformer<E, R>): AsyncErrorBoundary<T, E> {
    this.errorTransformers.push(transformer);
    return this;
  }

  /**
   * Configures retry behavior for failed operations.
   * 
   * @param maxRetries - Maximum number of retry attempts
   * @param delay - Delay between retries in milliseconds
   * @param exponential - Whether to use exponential backoff for delays
   * @returns This instance for chaining
   */
  public withRetry(maxRetries: number, delay = 1000, exponential = false): AsyncErrorBoundary<T, E> {
    this.maxRetries = maxRetries;
    this.retryDelay = delay;
    this.exponentialBackoff = exponential;
    return this;
  }

  /**
   * Configures circuit breaker behavior to prevent repeated calls to failing operations.
   * 
   * @param resetTimeout - Time in milliseconds before the circuit is reset (closed)
   * @returns This instance for chaining
   */
  public withCircuitBreaker(resetTimeout: number): AsyncErrorBoundary<T, E> {
    this.circuitResetTimeout = resetTimeout;
    return this;
  }

  /**
   * Sets a fallback value to return if all recovery strategies fail.
   * 
   * @param value - The fallback value
   * @returns This instance for chaining
   */
  public withFallback(value: T): AsyncErrorBoundary<T, E> {
    this.fallbackValue = value;
    this.hasFallback = true;
    return this;
  }

  /**
   * Executes an async function with all configured error handling strategies.
   * 
   * @param fn - The async function to execute
   * @param args - Arguments to pass to the function
   * @returns A promise that resolves to the function result or fallback value
   * 
   * @throws Will throw an error if all recovery strategies fail and no fallback is configured
   */
  public async execute<Args extends any[]>(
    fn: AsyncFunction<T, Args>,
    ...args: Args
  ): Promise<T> {
    // Check if circuit is open
    if (this.circuitOpen) {
      if (this.hasFallback) {
        return this.fallbackValue as T;
      }
      throw new AppException(
        'Circuit is open, operation rejected',
        ErrorType.TECHNICAL,
        'CIRCUIT_OPEN',
        { resetTimeoutMs: this.circuitResetTimeout }
      );
    }

    // Reset retry count
    this.retryCount = 0;

    // Execute with retry
    return this.executeWithRetry(fn, args);
  }

  /**
   * Internal method to execute a function with retry logic.
   */
  private async executeWithRetry<Args extends any[]>(
    fn: AsyncFunction<T, Args>,
    args: Args
  ): Promise<T> {
    try {
      return await fn(...args);
    } catch (error) {
      // Handle the error
      this.handleError(error as E);

      // Transform the error through all transformers
      let transformedError = error;
      for (const transformer of this.errorTransformers) {
        transformedError = transformer(transformedError as E);
      }

      // Check if we should retry
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;

        // Calculate delay with exponential backoff if enabled
        const delay = this.exponentialBackoff
          ? this.retryDelay * Math.pow(2, this.retryCount - 1)
          : this.retryDelay;

        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry the operation
        return this.executeWithRetry(fn, args);
      }

      // Open the circuit if circuit breaker is configured
      if (this.circuitResetTimeout > 0) {
        this.openCircuit();
      }

      // Return fallback value if configured
      if (this.hasFallback) {
        return this.fallbackValue as T;
      }

      // Rethrow the transformed error
      throw transformedError;
    }
  }

  /**
   * Internal method to handle an error by calling all registered error handlers.
   */
  private handleError(error: E): void {
    for (const handler of this.errorHandlers) {
      handler(error);
    }
  }

  /**
   * Internal method to open the circuit and set a timer to reset it.
   */
  private openCircuit(): void {
    this.circuitOpen = true;

    // Clear any existing timer
    if (this.circuitResetTimer) {
      clearTimeout(this.circuitResetTimer);
    }

    // Set a timer to reset the circuit
    this.circuitResetTimer = setTimeout(() => {
      this.circuitOpen = false;
      this.circuitResetTimer = null;
    }, this.circuitResetTimeout);
  }
}

/**
 * Transforms any error to an AppException with the specified type and code.
 * 
 * @param type - The error type
 * @param code - The error code
 * @param message - Optional custom message (defaults to the original error message)
 * @returns An error transformer function
 * 
 * @example
 * const safeFunction = asyncTryCatch(
 *   async () => { /* ... */ },
 *   {
 *     errorTransformer: toAppException(ErrorType.TECHNICAL, 'ASYNC_001')
 *   }
 * );
 */
export function toAppException(
  type: ErrorType,
  code: string,
  message?: string
): ErrorTransformer<Error, AppException> {
  return (error: Error): AppException => {
    return new AppException(
      message || error.message,
      type,
      code,
      { originalError: error.message },
      error
    );
  };
}

/**
 * Creates a promise that rejects after the specified timeout.
 * 
 * @param ms - Timeout in milliseconds
 * @param errorMessage - Optional custom error message
 * @returns A promise that rejects after the timeout
 * 
 * @example
 * // Use with Promise.race to implement timeout
 * const result = await Promise.race([
 *   fetchData(),
 *   createTimeoutPromise(5000, 'Fetch operation timed out')
 * ]);
 */
export function createTimeoutPromise(ms: number, errorMessage = 'Operation timed out'): Promise<never> {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new AppException(
        errorMessage,
        ErrorType.TECHNICAL,
        'TIMEOUT_001',
        { timeoutMs: ms }
      ));
    }, ms);
  });
}

/**
 * Adds timeout capability to any promise.
 * 
 * @param promise - The promise to add timeout to
 * @param ms - Timeout in milliseconds
 * @param errorMessage - Optional custom error message
 * @returns A promise that rejects if the original promise doesn't resolve within the timeout
 * 
 * @example
 * const result = await withTimeout(fetchData(), 5000);
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = createTimeoutPromise(ms, errorMessage);
  return Promise.race([promise, timeoutPromise]);
}