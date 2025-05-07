import { Logger } from '@nestjs/common';

/**
 * Configuration options for the retry mechanism.
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts.
   */
  maxRetries: number;
  
  /**
   * Factor by which the delay increases with each retry.
   */
  backoffFactor: number;
  
  /**
   * Initial delay in milliseconds before the first retry.
   */
  initialDelay: number;
  
  /**
   * Maximum delay in milliseconds between retries.
   */
  maxDelay: number;
  
  /**
   * Array of error codes that should trigger a retry.
   */
  retryableErrors?: string[];
  
  /**
   * Custom function to determine if an error should be retried.
   */
  shouldRetry?: (error: Error) => boolean;
  
  /**
   * Logger instance for logging retry attempts.
   */
  logger?: Logger;
}

/**
 * Default retry options.
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  backoffFactor: 2,
  initialDelay: 1000,
  maxDelay: 10000
};

/**
 * Executes a function with retry capability using exponential backoff.
 * 
 * @param fn - The function to execute with retry capability
 * @param options - Configuration options for the retry mechanism
 * @returns A promise that resolves with the result of the function
 * @throws The last error encountered if all retries fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  // Merge provided options with defaults
  const retryOptions: RetryOptions = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options
  };
  
  const {
    maxRetries,
    backoffFactor,
    initialDelay,
    maxDelay,
    retryableErrors,
    shouldRetry,
    logger
  } = retryOptions;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // First attempt (attempt = 0) or retry attempts
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we've reached the maximum number of retries
      if (attempt >= maxRetries) {
        logger?.error(`All retry attempts failed: ${error.message}`, error.stack);
        throw error;
      }
      
      // Check if this error should be retried
      const isRetryable = shouldRetry
        ? shouldRetry(error)
        : !retryableErrors || retryableErrors.some(code => error.message.includes(code));
      
      if (!isRetryable) {
        logger?.warn(`Error not retryable: ${error.message}`);
        throw error;
      }
      
      // Calculate delay with exponential backoff, but cap at maxDelay
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );
      
      logger?.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms: ${error.message}`);
      
      // Wait before the next retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the throw in the loop,
  // but TypeScript requires a return statement
  throw lastError;
}

/**
 * Executes a function with retry capability and custom error handling.
 * 
 * @param fn - The function to execute with retry capability
 * @param options - Configuration options for the retry mechanism
 * @param errorHandler - Custom error handler function
 * @returns A promise that resolves with the result of the function or the error handler
 */
export async function retryWithFallback<T, F>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  errorHandler: (error: Error) => Promise<F> | F
): Promise<T | F> {
  try {
    return await retry(fn, options);
  } catch (error) {
    return await errorHandler(error);
  }
}