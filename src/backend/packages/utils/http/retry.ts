/**
 * Retry mechanism for HTTP requests
 * 
 * This module provides a configurable retry mechanism for HTTP requests with
 * exponential backoff, jitter, and timeout handling. It enhances the reliability
 * of network operations by automatically retrying failed requests according to
 * configurable policies.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Initial delay in milliseconds before the first retry (default: 300) */
  initialDelayMs: number;
  /** Maximum delay in milliseconds between retries (default: 30000) */
  maxDelayMs: number;
  /** Backoff factor for exponential delay calculation (default: 2) */
  backoffFactor: number;
  /** Jitter factor to randomize delay (0-1, default: 0.25) */
  jitterFactor: number;
  /** Request timeout in milliseconds (default: 10000) */
  timeoutMs: number;
  /** Custom function to determine if a request should be retried */
  retryCondition?: (error: any) => boolean;
  /** Optional callback for retry attempts */
  onRetry?: (retryCount: number, error: any, delayMs: number) => void;
}

/**
 * Default retry policy suitable for most operations
 * Attempts 3 retries with exponential backoff starting at 300ms
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  initialDelayMs: 300,
  maxDelayMs: 30000,
  backoffFactor: 2,
  jitterFactor: 0.25,
  timeoutMs: 10000,
  retryCondition: isRetryableError
};

/**
 * Aggressive retry policy for critical operations
 * Attempts 5 retries with exponential backoff starting at 100ms
 */
export const AGGRESSIVE_RETRY_POLICY: RetryPolicy = {
  maxRetries: 5,
  initialDelayMs: 100,
  maxDelayMs: 20000,
  backoffFactor: 2,
  jitterFactor: 0.2,
  timeoutMs: 15000,
  retryCondition: isRetryableError
};

/**
 * Minimal retry policy for less critical operations
 * Attempts 2 retries with exponential backoff starting at 500ms
 */
export const MINIMAL_RETRY_POLICY: RetryPolicy = {
  maxRetries: 2,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffFactor: 2,
  jitterFactor: 0.1,
  timeoutMs: 5000,
  retryCondition: isRetryableError
};

/**
 * Retry statistics
 */
export interface RetryStats {
  /** Total number of requests attempted (including retries) */
  totalAttempts: number;
  /** Number of successful requests */
  successfulRequests: number;
  /** Number of failed requests */
  failedRequests: number;
  /** Number of retried requests */
  retriedRequests: number;
  /** Average retry count per request */
  averageRetries: number;
  /** Maximum retries for a single request */
  maxRetriesUsed: number;
  /** Timestamp of last retry */
  lastRetry: Date | null;
}

/**
 * Determines if an error is retryable based on its type and status code
 * 
 * @param error - The error to check
 * @returns True if the error is retryable, false otherwise
 */
export function isRetryableError(error: any): boolean {
  // Network errors are always retryable
  if (!error.response && error.code === 'ECONNABORTED') {
    return true;
  }
  
  // Timeout errors are retryable
  if (!error.response && error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // Connection refused errors are retryable
  if (!error.response && error.code === 'ECONNREFUSED') {
    return true;
  }
  
  // Socket hangup errors are retryable
  if (!error.response && error.code === 'ECONNRESET') {
    return true;
  }
  
  // DNS resolution errors are retryable
  if (!error.response && error.code === 'ENOTFOUND') {
    return true;
  }
  
  // Check for Axios error with response
  if (error.isAxiosError && error.response) {
    const status = error.response.status;
    
    // Server errors (5xx) are retryable
    if (status >= 500 && status < 600) {
      return true;
    }
    
    // Specific 4xx errors that may be retryable
    if (status === 408) { // Request Timeout
      return true;
    }
    
    if (status === 429) { // Too Many Requests
      return true;
    }
    
    if (status === 423) { // Locked
      return true;
    }
  }
  
  return false;
}

/**
 * Calculates the delay for a retry attempt with exponential backoff and jitter
 * 
 * @param retryCount - Current retry attempt number (0-based)
 * @param policy - Retry policy configuration
 * @returns Delay in milliseconds for the next retry
 */
export function calculateBackoffDelay(retryCount: number, policy: RetryPolicy): number {
  // Calculate exponential backoff: initialDelay * (backoffFactor ^ retryCount)
  const exponentialDelay = policy.initialDelayMs * Math.pow(policy.backoffFactor, retryCount);
  
  // Apply maximum delay cap
  const cappedDelay = Math.min(exponentialDelay, policy.maxDelayMs);
  
  // Apply jitter: delay * (1 - jitterFactor/2 + jitterFactor * random)
  // This creates a range of [delay * (1 - jitterFactor/2), delay * (1 + jitterFactor/2)]
  const jitterMultiplier = 1 - (policy.jitterFactor / 2) + (policy.jitterFactor * Math.random());
  
  // Calculate final delay with jitter
  const finalDelay = Math.floor(cappedDelay * jitterMultiplier);
  
  return finalDelay;
}

/**
 * Creates a promise that resolves after a specified delay
 * 
 * @param delayMs - Delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export function delay(delayMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

/**
 * Retries an async function according to the provided retry policy
 * 
 * @param fn - Async function to retry
 * @param policy - Retry policy configuration
 * @returns Promise resolving to the function result or rejecting with the last error
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    try {
      // First attempt (attempt = 0) or retry attempts
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we've used all retry attempts
      if (attempt >= policy.maxRetries) {
        break;
      }
      
      // Check if this error should be retried
      const shouldRetry = policy.retryCondition ? policy.retryCondition(error) : isRetryableError(error);
      if (!shouldRetry) {
        break;
      }
      
      // Calculate delay for this retry attempt
      const delayMs = calculateBackoffDelay(attempt, policy);
      
      // Call the onRetry callback if provided
      if (policy.onRetry) {
        policy.onRetry(attempt + 1, error, delayMs);
      }
      
      // Wait before the next retry attempt
      await delay(delayMs);
    }
  }
  
  // If we've exhausted all retries or encountered a non-retryable error, throw the last error
  throw lastError;
}

/**
 * Creates an Axios instance wrapped with retry functionality
 * 
 * @param axiosInstance - The Axios instance to wrap
 * @param policy - Retry policy configuration
 * @returns Axios instance with retry functionality
 */
export function createRetryableAxios(
  axiosInstance: AxiosInstance,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): AxiosInstance {
  // Retry statistics
  let stats: RetryStats = {
    totalAttempts: 0,
    successfulRequests: 0,
    failedRequests: 0,
    retriedRequests: 0,
    averageRetries: 0,
    maxRetriesUsed: 0,
    lastRetry: null
  };
  
  // Create a new Axios instance that wraps the provided instance
  const retryableInstance = axios.create();
  
  // Override the request method to implement retry logic
  retryableInstance.request = async function<T = any, R = AxiosResponse<T>>(
    config: AxiosRequestConfig
  ): Promise<R> {
    // Apply timeout from retry policy if not specified in the request config
    const requestConfig = {
      ...config,
      timeout: config.timeout || policy.timeoutMs
    };
    
    // Track total requests for statistics
    let requestRetries = 0;
    
    // Use the retryRequest function to handle retries
    try {
      const result = await retryRequest<R>(
        async () => {
          stats.totalAttempts++;
          
          try {
            // Forward the request to the wrapped Axios instance
            return await axiosInstance.request<T, R>(requestConfig);
          } catch (error) {
            // Update retry timestamp if this is a retry attempt
            if (requestRetries > 0) {
              stats.lastRetry = new Date();
            }
            
            // Rethrow the error to be handled by retryRequest
            throw error;
          }
        },
        {
          ...policy,
          onRetry: (retryCount, error, delayMs) => {
            // Track retry statistics
            if (retryCount === 1) {
              stats.retriedRequests++;
            }
            
            requestRetries = retryCount;
            stats.maxRetriesUsed = Math.max(stats.maxRetriesUsed, retryCount);
            
            // Call the original onRetry callback if provided
            if (policy.onRetry) {
              policy.onRetry(retryCount, error, delayMs);
            }
          }
        }
      );
      
      // Update success statistics
      stats.successfulRequests++;
      stats.averageRetries = stats.retriedRequests > 0 
        ? stats.totalAttempts / stats.retriedRequests 
        : 0;
      
      return result;
    } catch (error) {
      // Update failure statistics
      stats.failedRequests++;
      stats.averageRetries = stats.retriedRequests > 0 
        ? stats.totalAttempts / stats.retriedRequests 
        : 0;
      
      // Rethrow the error
      throw error;
    }
  };
  
  // Add retry-specific methods to the instance
  (retryableInstance as any).getRetryStats = () => ({ ...stats });
  (retryableInstance as any).resetRetryStats = () => {
    stats = {
      totalAttempts: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      averageRetries: 0,
      maxRetriesUsed: 0,
      lastRetry: null
    };
  };
  
  return retryableInstance;
}

/**
 * Creates an Axios instance with retry functionality
 * 
 * @param config - Axios configuration
 * @param policy - Retry policy configuration
 * @returns Axios instance with retry functionality
 */
export function createRetryableClient(
  config: AxiosRequestConfig = {},
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): AxiosInstance {
  const axiosInstance = axios.create(config);
  return createRetryableAxios(axiosInstance, policy);
}