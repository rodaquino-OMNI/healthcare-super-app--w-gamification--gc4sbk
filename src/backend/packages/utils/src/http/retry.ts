import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Interface defining a retry policy with configurable parameters
 */
export interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds between retries */
  baseDelayMs: number;
  /** Maximum delay in milliseconds between retries */
  maxDelayMs: number;
  /** Jitter factor (0-1) to randomize delay and prevent thundering herd */
  jitterFactor: number;
  /** HTTP status codes that should trigger a retry */
  retryableStatusCodes: number[];
  /** Whether to retry on network errors */
  retryNetworkErrors: boolean;
  /** Whether to retry on timeout errors */
  retryTimeoutErrors: boolean;
  /** Timeout in milliseconds for each attempt */
  timeoutMs: number;
}

/**
 * Options for configuring retry behavior
 */
export interface RetryOptions<T = any> {
  /** Retry policy to use */
  policy?: Partial<RetryPolicy>;
  /** Function to determine if an error should trigger a retry */
  shouldRetry?: (error: any, attemptNumber: number) => boolean;
  /** Function called before each retry attempt */
  onRetry?: (error: any, attemptNumber: number, delayMs: number) => void;
  /** Function called when all retries are exhausted */
  onMaxRetriesExceeded?: (error: any, attemptNumber: number) => void;
  /** Function called on successful completion */
  onSuccess?: (result: T, attemptNumber: number) => void;
}

/**
 * Options for creating a retryable Axios instance
 */
export interface RetryableAxiosOptions extends RetryOptions {
  /** Axios request config */
  axiosConfig?: AxiosRequestConfig;
}

/**
 * Default retry policy with balanced settings suitable for most operations
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  baseDelayMs: 300,
  maxDelayMs: 3000,
  jitterFactor: 0.3,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryNetworkErrors: true,
  retryTimeoutErrors: true,
  timeoutMs: 10000,
};

/**
 * Aggressive retry policy for critical operations
 */
export const AGGRESSIVE_RETRY_POLICY: RetryPolicy = {
  maxRetries: 5,
  baseDelayMs: 200,
  maxDelayMs: 5000,
  jitterFactor: 0.25,
  retryableStatusCodes: [408, 425, 429, 500, 502, 503, 504],
  retryNetworkErrors: true,
  retryTimeoutErrors: true,
  timeoutMs: 15000,
};

/**
 * Minimal retry policy for less critical operations
 */
export const MINIMAL_RETRY_POLICY: RetryPolicy = {
  maxRetries: 1,
  baseDelayMs: 500,
  maxDelayMs: 1000,
  jitterFactor: 0.1,
  retryableStatusCodes: [429, 503],
  retryNetworkErrors: true,
  retryTimeoutErrors: false,
  timeoutMs: 5000,
};

/**
 * Calculates the delay for the next retry attempt using exponential backoff with jitter
 * 
 * @param attemptNumber - Current attempt number (starting from 1)
 * @param policy - Retry policy configuration
 * @returns Delay in milliseconds before the next retry
 */
export function calculateBackoffDelay(attemptNumber: number, policy: RetryPolicy): number {
  // Calculate exponential backoff: baseDelay * 2^(attemptNumber-1)
  const exponentialDelay = policy.baseDelayMs * Math.pow(2, attemptNumber - 1);
  
  // Apply maximum delay cap
  const cappedDelay = Math.min(exponentialDelay, policy.maxDelayMs);
  
  // Apply jitter to prevent thundering herd problem
  // Formula: delay = random value between (1-jitterFactor)*delay and delay
  const jitterMultiplier = 1 - policy.jitterFactor * Math.random();
  
  return Math.floor(cappedDelay * jitterMultiplier);
}

/**
 * Determines if an error should trigger a retry based on the retry policy
 * 
 * @param error - The error that occurred
 * @param policy - Retry policy configuration
 * @returns Whether the request should be retried
 */
export function isRetryableError(error: any, policy: RetryPolicy): boolean {
  // Handle Axios errors
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Check for network errors (ECONNRESET, ECONNREFUSED, etc.)
    if (axiosError.code && policy.retryNetworkErrors) {
      if (
        axiosError.code === 'ECONNABORTED' ||
        axiosError.code === 'ECONNRESET' ||
        axiosError.code === 'ECONNREFUSED' ||
        axiosError.code === 'ETIMEDOUT' ||
        axiosError.code === 'ENETUNREACH'
      ) {
        return true;
      }
      
      // Handle timeout errors separately
      if (axiosError.code === 'ECONNABORTED' && axiosError.message.includes('timeout')) {
        return policy.retryTimeoutErrors;
      }
    }
    
    // Check for retryable status codes
    if (axiosError.response?.status) {
      return policy.retryableStatusCodes.includes(axiosError.response.status);
    }
  }
  
  // Handle timeout errors that might not be properly categorized by Axios
  if (error instanceof Error && error.message.includes('timeout') && policy.retryTimeoutErrors) {
    return true;
  }
  
  // Default to not retrying for unknown error types
  return false;
}

/**
 * Retries a function with exponential backoff based on the provided retry policy
 * 
 * @param fn - The function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result or rejecting with the last error
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  options: RetryOptions<T> = {}
): Promise<T> {
  // Merge provided policy with default policy
  const policy: RetryPolicy = {
    ...DEFAULT_RETRY_POLICY,
    ...(options.policy || {}),
  };
  
  // Custom retry condition function or use the default
  const shouldRetry = options.shouldRetry || ((error, attemptNumber) => {
    return attemptNumber <= policy.maxRetries && isRetryableError(error, policy);
  });
  
  let attemptNumber = 0;
  let lastError: any;
  
  while (true) {
    attemptNumber++;
    
    try {
      // Execute the function with a timeout
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), policy.timeoutMs);
        }),
      ]);
      
      // Call success callback if provided
      if (options.onSuccess) {
        options.onSuccess(result, attemptNumber);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (shouldRetry(error, attemptNumber)) {
        // Calculate delay for next attempt
        const delayMs = calculateBackoffDelay(attemptNumber, policy);
        
        // Call retry callback if provided
        if (options.onRetry) {
          options.onRetry(error, attemptNumber, delayMs);
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      // Call max retries exceeded callback if provided
      if (options.onMaxRetriesExceeded) {
        options.onMaxRetriesExceeded(error, attemptNumber);
      }
      
      throw lastError;
    }
  }
}

/**
 * Creates an Axios instance with automatic retry capability
 * 
 * @param axiosInstance - Optional existing Axios instance to wrap with retry functionality
 * @param options - Configuration options for retry behavior
 * @returns Axios instance with retry capability
 */
export function createRetryableAxios(
  axiosInstance?: AxiosInstance,
  options: RetryableAxiosOptions = {}
): AxiosInstance {
  // Create or use provided Axios instance
  const instance = axiosInstance || axios.create(options.axiosConfig);
  
  // Store the original request method
  const originalRequest = instance.request.bind(instance);
  
  // Override the request method with retry capability
  instance.request = async function retryableRequest<T = any, R = AxiosResponse<T>>(
    config: AxiosRequestConfig
  ): Promise<R> {
    return retryRequest<R>(
      () => originalRequest(config),
      {
        policy: options.policy,
        shouldRetry: options.shouldRetry,
        onRetry: options.onRetry,
        onMaxRetriesExceeded: options.onMaxRetriesExceeded,
        onSuccess: options.onSuccess,
      }
    );
  };
  
  return instance;
}

/**
 * Creates a secure Axios instance with retry capability for internal API calls
 * 
 * @param baseURL - The base URL for the API
 * @param options - Configuration options for retry behavior
 * @returns Axios instance with security measures and retry capability
 */
export function createRetryableInternalApiClient(
  baseURL: string,
  options: RetryableAxiosOptions = {}
): AxiosInstance {
  // Create a basic Axios instance
  const instance = axios.create({
    baseURL,
    timeout: options.policy?.timeoutMs || DEFAULT_RETRY_POLICY.timeoutMs,
    headers: {
      'Content-Type': 'application/json',
      ...(options.axiosConfig?.headers || {}),
    },
    ...options.axiosConfig,
  });
  
  // Add SSRF protection (similar to createSecureAxios)
  instance.interceptors.request.use(config => {
    if (!config.url) return config;
    
    try {
      const url = new URL(config.url, config.baseURL);
      const hostname = url.hostname;
      
      // Block requests to private IP ranges
      if (
        /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|0\.0\.0\.0|localhost)/.test(hostname) ||
        hostname === '::1' ||
        hostname === 'fe80::' ||
        hostname.endsWith('.local')
      ) {
        throw new Error('SSRF Protection: Blocked request to private or local network');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('SSRF Protection')) {
        throw error;
      }
      // If there's an error parsing the URL, continue with the request
    }
    
    return config;
  });
  
  // Add retry capability
  return createRetryableAxios(instance, options);
}

export default createRetryableAxios;