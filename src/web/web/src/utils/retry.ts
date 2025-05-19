/**
 * Retry utility functions for handling transient errors with exponential backoff.
 * 
 * This module provides functions to retry operations that might fail due to
 * transient errors, such as network issues or temporary service unavailability.
 * It implements exponential backoff to reduce the load on services during retries.
 */

/**
 * Options for configuring the retry behavior
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Initial delay in milliseconds before the first retry
   * @default 200
   */
  initialDelayMs?: number;
  
  /**
   * Maximum delay in milliseconds between retries
   * @default 5000
   */
  maxDelayMs?: number;
  
  /**
   * Optional callback function that is called before each retry attempt
   * @param attempt - The current retry attempt number (1-based)
   */
  onRetry?: (attempt: number) => void;
  
  /**
   * Optional function to determine if an error should be retried
   * @param error - The error that occurred
   * @returns True if the error should be retried, false otherwise
   * @default () => true (retry all errors)
   */
  shouldRetry?: (error: unknown) => boolean;
  
  /**
   * Whether to add jitter to the delay to prevent thundering herd problem
   * @default true
   */
  addJitter?: boolean;
}

/**
 * Adds a random jitter to the delay to prevent multiple clients from retrying simultaneously
 * 
 * @param delay - The base delay in milliseconds
 * @returns The delay with added jitter
 */
const addJitter = (delay: number): number => {
  // Add a random jitter of up to 20% of the delay
  const jitterFactor = 0.2;
  const jitter = Math.random() * jitterFactor * delay;
  return delay + jitter;
};

/**
 * Retries a function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param options - Options for configuring the retry behavior
 * @returns A promise that resolves with the result of the function or rejects after all retries fail
 * 
 * @example
 * // Basic usage
 * try {
 *   const result = await retryWithExponentialBackoff(
 *     async () => await fetchData()
 *   );
 *   console.log('Success:', result);
 * } catch (error) {
 *   console.error('Failed after retries:', error);
 * }
 * 
 * @example
 * // With custom options
 * try {
 *   const result = await retryWithExponentialBackoff(
 *     async () => await fetchData(),
 *     {
 *       maxRetries: 5,
 *       initialDelayMs: 100,
 *       maxDelayMs: 3000,
 *       onRetry: (attempt) => console.log(`Retry attempt ${attempt}`),
 *       shouldRetry: (error) => {
 *         // Only retry network errors, not 4xx responses
 *         return error instanceof NetworkError || 
 *                (error instanceof HttpError && error.status >= 500);
 *       }
 *     }
 *   );
 *   console.log('Success:', result);
 * } catch (error) {
 *   console.error('Failed after retries:', error);
 * }
 */
export const retryWithExponentialBackoff = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelayMs = 200,
    maxDelayMs = 5000,
    onRetry = () => {},
    shouldRetry = () => true,
    addJitter: useJitter = true
  } = options;
  
  let attempt = 0;
  
  const execute = async (): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      // If we've reached the maximum number of retries or the error shouldn't be retried, throw the error
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Calculate the delay using exponential backoff: initialDelay * 2^attempt
      let delay = initialDelayMs * Math.pow(2, attempt);
      
      // Cap the delay at the maximum delay
      delay = Math.min(delay, maxDelayMs);
      
      // Add jitter if enabled
      if (useJitter) {
        delay = addJitter(delay);
      }
      
      // Call the onRetry callback
      onRetry(attempt + 1);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Try again
      return execute();
    }
  };
  
  return execute();
};

/**
 * Retries a function with a fixed delay between attempts
 * 
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param delayMs - Delay in milliseconds between retries
 * @returns A promise that resolves with the result of the function or rejects after all retries fail
 * 
 * @example
 * try {
 *   const result = await retryWithFixedDelay(
 *     async () => await fetchData(),
 *     3,
 *     1000
 *   );
 *   console.log('Success:', result);
 * } catch (error) {
 *   console.error('Failed after retries:', error);
 * }
 */
export const retryWithFixedDelay = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let attempt = 0;
  
  const execute = async (): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      return execute();
    }
  };
  
  return execute();
};