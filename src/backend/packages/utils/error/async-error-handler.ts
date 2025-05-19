/**
 * Async Error Handler
 * 
 * Provides utilities for consistent handling of asynchronous errors in promise chains
 * and async/await functions. These utilities help standardize error handling patterns,
 * ensure proper error propagation, and support structured logging.
 * 
 * @module async-error-handler
 */

import { AppException, ErrorType } from '@austa/interfaces/common';

/**
 * Options for the asyncTryCatch function
 */
export interface AsyncTryCatchOptions<T, R> {
  /**
   * Function to execute when an error occurs
   */
  onError?: (error: Error) => R;
  
  /**
   * Function to transform a specific error type to another error or value
   */
  transformError?: (error: Error) => R | Promise<R>;
  
  /**
   * Function to execute after the operation completes (success or failure)
   */
  finally?: () => void;
  
  /**
   * Timeout in milliseconds after which the operation will be cancelled
   */
  timeout?: number;
}

/**
 * Wraps an async function with standardized error handling.
 * Provides a consistent way to handle errors in async operations.
 * 
 * @param fn - The async function to execute
 * @param options - Options for error handling
 * @returns A function that returns a promise resolving to the result or error handler result
 * 
 * @example
 * // Basic usage
 * const getUser = asyncTryCatch(async (id: string) => {
 *   return await userService.findById(id);
 * });
 * 
 * // With error transformation
 * const getUser = asyncTryCatch(async (id: string) => {
 *   return await userService.findById(id);
 * }, {
 *   transformError: (error) => {
 *     if (error.message.includes('not found')) {
 *       return new AppException('User not found', ErrorType.BUSINESS, 'USER_001');
 *     }
 *     return error;
 *   }
 * });
 */
export function asyncTryCatch<T extends (...args: any[]) => Promise<any>, R = ReturnType<T>>(  
  fn: T,
  options: AsyncTryCatchOptions<T, R> = {}
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | R> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | R> => {
    try {
      // If timeout is specified, create a race between the function and a timeout
      if (options.timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new AppException(
              `Operation timed out after ${options.timeout}ms`,
              ErrorType.TECHNICAL,
              'TIMEOUT_001'
            ));
          }, options.timeout);
        });
        
        return await Promise.race([fn(...args), timeoutPromise]);
      }
      
      return await fn(...args);
    } catch (error) {
      // Transform the error if a transform function is provided
      if (options.transformError) {
        return await options.transformError(error as Error);
      }
      
      // Execute the onError handler if provided
      if (options.onError) {
        return options.onError(error as Error);
      }
      
      // Re-throw the error if no handler is provided
      throw error;
    } finally {
      // Execute the finally function if provided
      if (options.finally) {
        options.finally();
      }
    }
  };
}

/**
 * Options for the safePromise function
 */
export interface SafePromiseOptions<T> {
  /**
   * Default value to return if the promise rejects
   */
  defaultValue?: T;
  
  /**
   * Function to execute when an error occurs
   */
  onError?: (error: Error) => void;
  
  /**
   * Timeout in milliseconds after which the operation will be cancelled
   */
  timeout?: number;
}

/**
 * Result of the safePromise function, containing either the result or an error
 */
export interface SafePromiseResult<T> {
  /**
   * The result of the promise if it resolved successfully
   */
  data: T | null;
  
  /**
   * The error if the promise rejected
   */
  error: Error | null;
  
  /**
   * Whether the promise resolved successfully
   */
  success: boolean;
}

/**
 * Wraps a promise to prevent unhandled rejections and provide a standardized result format.
 * 
 * @param promise - The promise to wrap
 * @param options - Options for handling the promise
 * @returns A promise that always resolves with a SafePromiseResult
 * 
 * @example
 * // Basic usage
 * const result = await safePromise(userService.findById(id));
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * 
 * // With default value
 * const result = await safePromise(userService.findById(id), {
 *   defaultValue: { id, name: 'Unknown' }
 * });
 * console.log(result.data); // Will be the user or the default value
 */
export async function safePromise<T>(
  promise: Promise<T>,
  options: SafePromiseOptions<T> = {}
): Promise<SafePromiseResult<T>> {
  try {
    // If timeout is specified, create a race between the promise and a timeout
    let result: T;
    if (options.timeout) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AppException(
            `Operation timed out after ${options.timeout}ms`,
            ErrorType.TECHNICAL,
            'TIMEOUT_001'
          ));
        }, options.timeout);
      });
      
      result = await Promise.race([promise, timeoutPromise]);
    } else {
      result = await promise;
    }
    
    return {
      data: result,
      error: null,
      success: true
    };
  } catch (error) {
    // Execute the onError handler if provided
    if (options.onError) {
      options.onError(error as Error);
    }
    
    return {
      data: options.defaultValue ?? null,
      error: error as Error,
      success: false
    };
  }
}

/**
 * Type guard to check if an error is an instance of a specific error class
 * 
 * @param error - The error to check
 * @param errorClass - The error class to check against
 * @returns True if the error is an instance of the specified class
 * 
 * @example
 * try {
 *   await someOperation();
 * } catch (error) {
 *   if (isErrorOfType(error, AppException)) {
 *     console.log(error.code); // TypeScript knows this is an AppException
 *   }
 * }
 */
export function isErrorOfType<T extends Error>(
  error: unknown,
  errorClass: new (...args: any[]) => T
): error is T {
  return error instanceof errorClass;
}

/**
 * Options for the AsyncErrorBoundary class
 */
export interface AsyncErrorBoundaryOptions<T> {
  /**
   * Function to execute when an error occurs
   */
  onError?: (error: Error) => void;
  
  /**
   * Default value to return if an error occurs
   */
  fallbackValue?: T;
  
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;
  
  /**
   * Base delay in milliseconds for exponential backoff
   */
  retryDelay?: number;
}

/**
 * Class that provides reactive error handling for async operations.
 * Useful for implementing retry logic, circuit breaking, and fallback strategies.
 */
export class AsyncErrorBoundary<T> {
  private onError?: (error: Error) => void;
  private fallbackValue?: T;
  private maxRetries: number;
  private retryDelay: number;
  
  /**
   * Creates a new AsyncErrorBoundary instance
   * 
   * @param options - Options for the error boundary
   */
  constructor(options: AsyncErrorBoundaryOptions<T> = {}) {
    this.onError = options.onError;
    this.fallbackValue = options.fallbackValue;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 300;
  }
  
  /**
   * Executes an async operation with retry logic and fallback
   * 
   * @param operation - The async operation to execute
   * @returns The result of the operation or the fallback value
   * 
   * @example
   * const boundary = new AsyncErrorBoundary<User>({
   *   fallbackValue: { id: '0', name: 'Unknown' },
   *   maxRetries: 3
   * });
   * 
   * const user = await boundary.execute(() => userService.findById(id));
   */
  async execute(operation: () => Promise<T>): Promise<T | undefined> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Execute the operation
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Call the error handler if provided
        if (this.onError) {
          this.onError(lastError);
        }
        
        // If this was the last retry, break out of the loop
        if (attempt === this.maxRetries) {
          break;
        }
        
        // Wait before the next retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Return the fallback value if provided, otherwise undefined
    return this.fallbackValue;
  }
  
  /**
   * Executes an async operation with a circuit breaker pattern
   * 
   * @param operation - The async operation to execute
   * @param options - Options for the circuit breaker
   * @returns The result of the operation or the fallback value
   * 
   * @example
   * const boundary = new AsyncErrorBoundary<User>();
   * 
   * // This will use a shared circuit breaker for all calls with the same breakerId
   * const user = await boundary.executeWithCircuitBreaker(
   *   () => userService.findById(id),
   *   { breakerId: 'user-service', fallbackValue: { id: '0', name: 'Unknown' } }
   * );
   */
  async executeWithCircuitBreaker(
    operation: () => Promise<T>,
    options: {
      breakerId: string;
      fallbackValue?: T;
      timeout?: number;
    }
  ): Promise<T | undefined> {
    // Simple implementation of circuit breaker pattern
    // In a real implementation, this would track failure rates and open/close the circuit
    try {
      // If timeout is specified, create a race between the operation and a timeout
      if (options.timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new AppException(
              `Operation timed out after ${options.timeout}ms`,
              ErrorType.TECHNICAL,
              'TIMEOUT_001'
            ));
          }, options.timeout);
        });
        
        return await Promise.race([operation(), timeoutPromise]);
      }
      
      return await operation();
    } catch (error) {
      // Call the error handler if provided
      if (this.onError) {
        this.onError(error as Error);
      }
      
      // Return the fallback value if provided
      return options.fallbackValue ?? this.fallbackValue;
    }
  }
}

/**
 * Creates a promise that rejects after the specified timeout
 * 
 * @param ms - Timeout in milliseconds
 * @param message - Optional error message
 * @returns A promise that rejects after the timeout
 * 
 * @example
 * // Use with Promise.race to implement a timeout
 * const result = await Promise.race([
 *   fetchData(),
 *   createTimeout(5000, 'Data fetch timed out')
 * ]);
 */
export function createTimeout(ms: number, message?: string): Promise<never> {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new AppException(
        message ?? `Operation timed out after ${ms}ms`,
        ErrorType.TECHNICAL,
        'TIMEOUT_001'
      ));
    }, ms);
  });
}

/**
 * Adds a timeout to a promise
 * 
 * @param promise - The promise to add a timeout to
 * @param ms - Timeout in milliseconds
 * @param message - Optional error message
 * @returns A promise that resolves to the result or rejects with a timeout error
 * 
 * @example
 * // Add a timeout to any promise
 * const user = await withTimeout(
 *   userService.findById(id),
 *   5000,
 *   'User fetch timed out'
 * );
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message?: string
): Promise<T> {
  return Promise.race([promise, createTimeout(ms, message)]);
}