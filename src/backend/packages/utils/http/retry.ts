/**
 * @file HTTP retry utility with exponential backoff, jitter, and timeout handling
 * @description Provides a configurable retry mechanism for HTTP requests to enhance
 * reliability during transient network failures or service unavailability.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * Configuration options for retry mechanism
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds between retries */
  retryDelay: number;
  /** Maximum delay in milliseconds between retries */
  maxRetryDelay?: number;
  /** Whether to apply jitter to retry delays to prevent thundering herd problem */
  useJitter?: boolean;
  /** Timeout in milliseconds for each retry attempt */
  timeout?: number;
  /** 
   * Function to determine if a request should be retried based on the error
   * @param error The error that occurred during the request
   * @returns Whether the request should be retried
   */
  retryCondition?: (error: AxiosError) => boolean;
  /** 
   * Function to calculate delay between retries
   * @param retryCount Current retry attempt number (starting from 1)
   * @param error The error that occurred during the request
   * @returns Delay in milliseconds before the next retry
   */
  retryDelayCalculator?: (retryCount: number, error: AxiosError) => number;
  /**
   * Callback function that is called before each retry attempt
   * @param retryCount Current retry attempt number (starting from 1)
   * @param error The error that occurred during the request
   * @param config The request configuration
   */
  onRetry?: (retryCount: number, error: AxiosError, config: AxiosRequestConfig) => void;
}

/**
 * Default retry policy with moderate settings suitable for most scenarios
 */
export const DEFAULT_RETRY_POLICY: RetryConfig = {
  maxRetries: 3,
  retryDelay: 300,
  maxRetryDelay: 30000,
  useJitter: true,
  timeout: 10000,
  retryCondition: isRetryableError,
};

/**
 * Aggressive retry policy for critical operations
 * Uses more retry attempts and longer delays
 */
export const AGGRESSIVE_RETRY_POLICY: RetryConfig = {
  maxRetries: 5,
  retryDelay: 500,
  maxRetryDelay: 60000,
  useJitter: true,
  timeout: 15000,
  retryCondition: isRetryableError,
};

/**
 * Minimal retry policy for less critical operations
 * Uses fewer retry attempts and shorter delays
 */
export const MINIMAL_RETRY_POLICY: RetryConfig = {
  maxRetries: 2,
  retryDelay: 200,
  maxRetryDelay: 10000,
  useJitter: true,
  timeout: 5000,
  retryCondition: isRetryableError,
};

/**
 * Extended Axios request config with retry-specific properties
 */
export interface RetryableRequestConfig extends AxiosRequestConfig {
  /** Current retry attempt number (starting from 0) */
  _retryCount?: number;
  /** Original request timeout before applying retry-specific timeout */
  _originalRequestTimeout?: number;
  /** Retry configuration for this specific request */
  retryConfig?: Partial<RetryConfig>;
}

/**
 * Determines if an error is retryable based on its type and status code
 * @param error The error to check
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: AxiosError): boolean {
  // Don't retry if the request was cancelled
  if (axios.isCancel(error)) {
    return false;
  }

  // Retry network errors (no response received)
  if (!error.response) {
    return true;
  }

  // Retry server errors (5xx) and too many requests (429)
  const status = error.response.status;
  return (
    status >= 500 || // Server errors
    status === 429 || // Too many requests
    status === 408    // Request timeout
  );
}

/**
 * Calculates the delay before the next retry attempt using exponential backoff with optional jitter
 * @param retryCount Current retry attempt number (starting from 1)
 * @param config Retry configuration
 * @param error The error that occurred during the request
 * @returns Delay in milliseconds before the next retry
 */
export function calculateRetryDelay(
  retryCount: number,
  config: RetryConfig,
  error: AxiosError
): number {
  // Use custom calculator if provided
  if (config.retryDelayCalculator) {
    return config.retryDelayCalculator(retryCount, error);
  }

  // Check for Retry-After header in 429 or 503 responses
  if (error.response) {
    const retryAfterHeader = error.response.headers['retry-after'];
    if (retryAfterHeader) {
      // Retry-After can be a date string or seconds
      if (isNaN(Number(retryAfterHeader))) {
        // It's a date string
        const retryAfterDate = new Date(retryAfterHeader);
        const now = new Date();
        return Math.max(0, retryAfterDate.getTime() - now.getTime());
      } else {
        // It's seconds
        return parseInt(retryAfterHeader, 10) * 1000;
      }
    }
  }

  // Calculate exponential backoff: baseDelay * 2^retryCount
  let delay = config.retryDelay * Math.pow(2, retryCount - 1);

  // Apply maximum delay limit if specified
  if (config.maxRetryDelay) {
    delay = Math.min(delay, config.maxRetryDelay);
  }

  // Apply jitter to prevent thundering herd problem
  if (config.useJitter) {
    // Add random jitter between 0% and 25% of the delay
    const jitter = Math.random() * 0.25 * delay;
    delay = Math.floor(delay + jitter);
  }

  return delay;
}

/**
 * Creates a new Axios instance with retry capability
 * @param axiosInstance The Axios instance to wrap with retry capability
 * @param defaultConfig Default retry configuration to use for all requests
 * @returns Axios instance with retry capability
 */
export function createRetryableAxios(
  axiosInstance: AxiosInstance = axios.create(),
  defaultConfig: Partial<RetryConfig> = DEFAULT_RETRY_POLICY
): AxiosInstance {
  // Merge default config with provided config
  const retryConfig: RetryConfig = {
    ...DEFAULT_RETRY_POLICY,
    ...defaultConfig,
  };

  // Add response interceptor to handle retries
  axiosInstance.interceptors.response.use(
    // Success handler - just pass through the response
    (response) => response,
    // Error handler - handle retries
    async (error: AxiosError) => {
      const config = error.config as RetryableRequestConfig;
      
      // Initialize retry count if not already set
      if (config._retryCount === undefined) {
        config._retryCount = 0;
        config._originalRequestTimeout = config.timeout;
      }

      // Merge request-specific retry config with default config
      const requestRetryConfig: RetryConfig = {
        ...retryConfig,
        ...(config.retryConfig || {}),
      };

      // Check if we should retry the request
      const shouldRetry =
        config._retryCount < requestRetryConfig.maxRetries &&
        (requestRetryConfig.retryCondition ? requestRetryConfig.retryCondition(error) : isRetryableError(error));

      if (!shouldRetry) {
        return Promise.reject(error);
      }

      // Increment retry count
      config._retryCount++;

      // Calculate delay before next retry
      const delay = calculateRetryDelay(config._retryCount, requestRetryConfig, error);

      // Call onRetry callback if provided
      if (requestRetryConfig.onRetry) {
        requestRetryConfig.onRetry(config._retryCount, error, config);
      }

      // Apply timeout for this retry if specified
      if (requestRetryConfig.timeout) {
        config.timeout = requestRetryConfig.timeout;
      }

      // Wait for the calculated delay
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry the request
      return axiosInstance(config);
    }
  );

  return axiosInstance;
}

/**
 * Performs an HTTP request with retry capability
 * @param config The request configuration
 * @param retryConfig Retry configuration for this request
 * @returns Promise resolving to the response
 */
export async function retryRequest<T = any>(
  config: AxiosRequestConfig,
  retryConfig: Partial<RetryConfig> = {}
): Promise<AxiosResponse<T>> {
  // Create a new Axios instance with retry capability
  const client = createRetryableAxios(axios.create(), retryConfig);
  
  // Make the request
  return client.request<T>(config);
}

/**
 * Creates a retry function that can be used with any promise-based operation
 * @param operation The operation to retry
 * @param retryConfig Retry configuration
 * @returns Promise resolving to the operation result
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  retryConfig: Partial<RetryConfig> = {}
): Promise<T> {
  // Merge with default config
  const config: RetryConfig = {
    ...DEFAULT_RETRY_POLICY,
    ...retryConfig,
  };

  let retryCount = 0;
  let lastError: any;

  while (retryCount <= config.maxRetries) {
    try {
      // If not the first attempt, wait before retrying
      if (retryCount > 0) {
        const delay = calculateRetryDelay(
          retryCount,
          config,
          lastError
        );

        // Call onRetry callback if provided
        if (config.onRetry) {
          config.onRetry(retryCount, lastError, {} as AxiosRequestConfig);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Try the operation
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry =
        retryCount < config.maxRetries &&
        (config.retryCondition ? config.retryCondition(error as AxiosError) : isRetryableError(error as AxiosError));

      if (!shouldRetry) {
        throw error;
      }

      retryCount++;
    }
  }

  // This should never be reached due to the throw in the catch block
  throw lastError;
}

export default {
  createRetryableAxios,
  retryRequest,
  retryOperation,
  isRetryableError,
  calculateRetryDelay,
  DEFAULT_RETRY_POLICY,
  AGGRESSIVE_RETRY_POLICY,
  MINIMAL_RETRY_POLICY,
};