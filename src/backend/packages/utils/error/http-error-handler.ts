import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createSecureAxios } from '../../../shared/utils/secure-axios';
import { ErrorType } from '../../../shared/src/exceptions/exceptions.types';

/**
 * HTTP error response structure
 */
export interface HttpErrorResponse {
  type: ErrorType;
  code: string;
  message: string;
  details?: Record<string, any>;
  originalError?: Error;
  statusCode?: number;
  retryable?: boolean;
}

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds between retries (will be used with exponential backoff) */
  baseDelayMs: number;
  /** HTTP status codes that should trigger a retry */
  retryableStatusCodes: number[];
  /** HTTP methods that are safe to retry */
  retryableMethods: string[];
  /** Whether to retry network errors */
  retryNetworkErrors: boolean;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 300,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
  retryNetworkErrors: true,
};

/**
 * Creates a secure HTTP client with enhanced error handling and retry capabilities
 * 
 * @param baseURL - Base URL for the client
 * @param config - Additional axios configuration
 * @param retryConfig - Configuration for retry behavior
 * @returns Configured axios instance with error handling
 */
export function createHttpClient(
  baseURL?: string,
  config: AxiosRequestConfig = {},
  retryConfig: Partial<RetryConfig> = {}
): AxiosInstance {
  // Create secure axios instance with SSRF protection
  const instance = createSecureAxios();
  
  // Apply base configuration
  if (baseURL) {
    instance.defaults.baseURL = baseURL;
  }
  
  // Apply additional configuration
  Object.assign(instance.defaults, config);
  
  // Merge retry configuration with defaults
  const finalRetryConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...retryConfig,
  };
  
  // Add response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      return handleHttpError(error, instance, finalRetryConfig);
    }
  );
  
  return instance;
}

/**
 * Handles HTTP errors with retry logic and standardized error formatting
 * 
 * @param error - The axios error
 * @param instance - The axios instance
 * @param retryConfig - Retry configuration
 * @returns Promise that either resolves with a retry or rejects with formatted error
 */
async function handleHttpError(
  error: AxiosError,
  instance: AxiosInstance,
  retryConfig: RetryConfig
): Promise<AxiosResponse> {
  const { config, response, request } = error;
  
  // Store retry attempt count in config
  const retryCount = config?.['retryCount'] || 0;
  
  // Check if we should retry the request
  if (config && shouldRetry(error, retryCount, retryConfig)) {
    // Increment retry count
    config['retryCount'] = retryCount + 1;
    
    // Calculate delay with exponential backoff and jitter
    const delay = calculateRetryDelay(retryCount, retryConfig.baseDelayMs);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry the request
    return instance(config);
  }
  
  // If we shouldn't retry or have exhausted retries, format and throw the error
  throw parseHttpError(error);
}

/**
 * Determines if a request should be retried based on error type, HTTP method, and status code
 * 
 * @param error - The axios error
 * @param retryCount - Current retry attempt count
 * @param retryConfig - Retry configuration
 * @returns Boolean indicating if request should be retried
 */
function shouldRetry(
  error: AxiosError,
  retryCount: number,
  retryConfig: RetryConfig
): boolean {
  const { maxRetries, retryableStatusCodes, retryableMethods, retryNetworkErrors } = retryConfig;
  
  // Don't retry if we've reached the maximum retry count
  if (retryCount >= maxRetries) {
    return false;
  }
  
  // Don't retry if the request method is not considered idempotent/safe
  const method = error.config?.method?.toUpperCase() || '';
  if (!retryableMethods.includes(method)) {
    return false;
  }
  
  // Handle network errors (ECONNRESET, ETIMEDOUT, etc.)
  if (!error.response && retryNetworkErrors) {
    return true;
  }
  
  // Check if status code is in the list of retryable status codes
  const statusCode = error.response?.status;
  return statusCode !== undefined && retryableStatusCodes.includes(statusCode);
}

/**
 * Calculates retry delay using exponential backoff with jitter
 * 
 * @param retryCount - Current retry attempt count
 * @param baseDelayMs - Base delay in milliseconds
 * @returns Delay in milliseconds before next retry
 */
function calculateRetryDelay(retryCount: number, baseDelayMs: number): number {
  // Exponential backoff: baseDelay * 2^retryCount
  const exponentialDelay = baseDelayMs * Math.pow(2, retryCount);
  
  // Add jitter to prevent thundering herd problem (±20%)
  const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
  
  return exponentialDelay + jitter;
}

/**
 * Parses an Axios error into a standardized HTTP error response
 * 
 * @param error - The axios error
 * @returns Standardized HTTP error response
 */
export function parseHttpError(error: AxiosError): HttpErrorResponse {
  // Default error structure
  const httpError: HttpErrorResponse = {
    type: ErrorType.EXTERNAL,
    code: 'HTTP_ERROR',
    message: 'An error occurred while communicating with an external service',
    originalError: error,
    retryable: false,
  };
  
  // Add status code if available
  if (error.response) {
    httpError.statusCode = error.response.status;
    
    // Classify error based on status code
    if (error.response.status >= 400 && error.response.status < 500) {
      // Client errors (4xx)
      httpError.type = ErrorType.VALIDATION;
      httpError.code = `HTTP_CLIENT_ERROR_${error.response.status}`;
      httpError.message = error.response.statusText || 'Client error';
      httpError.retryable = error.response.status === 429; // Rate limiting is retryable
    } else if (error.response.status >= 500) {
      // Server errors (5xx)
      httpError.type = ErrorType.EXTERNAL;
      httpError.code = `HTTP_SERVER_ERROR_${error.response.status}`;
      httpError.message = error.response.statusText || 'Server error';
      httpError.retryable = true; // Server errors are generally retryable
    }
    
    // Extract error details from response body if available
    try {
      const responseData = error.response.data;
      if (responseData && typeof responseData === 'object') {
        // Handle standard error responses
        if (responseData.error) {
          if (typeof responseData.error === 'string') {
            httpError.message = responseData.error;
          } else if (typeof responseData.error === 'object') {
            if (responseData.error.message) {
              httpError.message = responseData.error.message;
            }
            if (responseData.error.code) {
              httpError.code = responseData.error.code;
            }
            if (responseData.error.details) {
              httpError.details = responseData.error.details;
            }
          }
        } else if (responseData.message) {
          // Some APIs just return a message field
          httpError.message = responseData.message;
        }
      }
    } catch (parseError) {
      // If we can't parse the response, just use the original error
      httpError.details = { parseError: 'Failed to parse error response' };
    }
  } else if (error.request) {
    // Request was made but no response received (network error)
    httpError.type = ErrorType.EXTERNAL;
    httpError.code = 'HTTP_NO_RESPONSE';
    httpError.message = 'No response received from server';
    httpError.retryable = true;
  } else {
    // Error in setting up the request
    httpError.type = ErrorType.TECHNICAL;
    httpError.code = 'HTTP_REQUEST_SETUP_ERROR';
    httpError.message = error.message || 'Error setting up the request';
    httpError.retryable = false;
  }
  
  return httpError;
}

/**
 * Circuit breaker state interface
 */
export interface CircuitBreakerState {
  /** Whether the circuit is open (failing) */
  isOpen: boolean;
  /** Timestamp when the circuit should be reset to half-open */
  resetTimeout: number;
  /** Failure count in the current window */
  failureCount: number;
  /** Success count in half-open state */
  successCount: number;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in milliseconds to keep the circuit open */
  resetTimeoutMs: number;
  /** Number of successful requests needed to close the circuit */
  successThreshold: number;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000, // 30 seconds
  successThreshold: 2,
};

/**
 * Circuit breaker registry to track circuit state for different services
 */
const circuitRegistry: Record<string, CircuitBreakerState> = {};

/**
 * Creates an HTTP client with circuit breaker pattern implementation
 * 
 * @param serviceKey - Unique identifier for the service
 * @param baseURL - Base URL for the client
 * @param config - Additional axios configuration
 * @param retryConfig - Configuration for retry behavior
 * @param circuitConfig - Configuration for circuit breaker
 * @returns Configured axios instance with circuit breaker
 */
export function createCircuitBreakerHttpClient(
  serviceKey: string,
  baseURL?: string,
  config: AxiosRequestConfig = {},
  retryConfig: Partial<RetryConfig> = {},
  circuitConfig: Partial<CircuitBreakerConfig> = {}
): AxiosInstance {
  // Create HTTP client with retry capabilities
  const instance = createHttpClient(baseURL, config, retryConfig);
  
  // Merge circuit breaker configuration with defaults
  const finalCircuitConfig: CircuitBreakerConfig = {
    ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
    ...circuitConfig,
  };
  
  // Initialize circuit state if not exists
  if (!circuitRegistry[serviceKey]) {
    circuitRegistry[serviceKey] = {
      isOpen: false,
      resetTimeout: 0,
      failureCount: 0,
      successCount: 0,
    };
  }
  
  // Add request interceptor to check circuit state
  instance.interceptors.request.use(async (config) => {
    const circuitState = circuitRegistry[serviceKey];
    const now = Date.now();
    
    // If circuit is open, check if reset timeout has passed
    if (circuitState.isOpen) {
      if (now >= circuitState.resetTimeout) {
        // Transition to half-open state
        circuitState.isOpen = false;
        circuitState.successCount = 0;
      } else {
        // Circuit is still open, reject the request
        throw {
          type: ErrorType.EXTERNAL,
          code: 'CIRCUIT_OPEN',
          message: `Service ${serviceKey} is unavailable (circuit open)`,
          details: { serviceKey, resetAfter: circuitState.resetTimeout - now },
        } as HttpErrorResponse;
      }
    }
    
    return config;
  });
  
  // Add response interceptor to track circuit state
  instance.interceptors.response.use(
    (response) => {
      // Successful response
      const circuitState = circuitRegistry[serviceKey];
      
      // If in half-open state, increment success count
      if (circuitState.failureCount > 0) {
        circuitState.successCount++;
        
        // If success threshold reached, reset circuit
        if (circuitState.successCount >= finalCircuitConfig.successThreshold) {
          circuitState.failureCount = 0;
          circuitState.successCount = 0;
        }
      }
      
      return response;
    },
    (error) => {
      // Error response
      const circuitState = circuitRegistry[serviceKey];
      
      // Only count certain errors for circuit breaker
      if (shouldCountForCircuitBreaker(error)) {
        circuitState.failureCount++;
        
        // If failure threshold reached, open the circuit
        if (circuitState.failureCount >= finalCircuitConfig.failureThreshold) {
          circuitState.isOpen = true;
          circuitState.resetTimeout = Date.now() + finalCircuitConfig.resetTimeoutMs;
        }
      }
      
      // Propagate the error
      return Promise.reject(error);
    }
  );
  
  return instance;
}

/**
 * Determines if an error should count towards the circuit breaker failure threshold
 * 
 * @param error - The axios error
 * @returns Boolean indicating if error should count for circuit breaker
 */
function shouldCountForCircuitBreaker(error: AxiosError): boolean {
  // Network errors should count
  if (!error.response) {
    return true;
  }
  
  // Only count 5xx errors and specific 4xx errors
  const statusCode = error.response.status;
  return (
    statusCode >= 500 || // Server errors
    statusCode === 429 || // Rate limiting
    statusCode === 408    // Request timeout
  );
}

/**
 * Resets the circuit breaker state for a service
 * 
 * @param serviceKey - Unique identifier for the service
 */
export function resetCircuitBreaker(serviceKey: string): void {
  if (circuitRegistry[serviceKey]) {
    circuitRegistry[serviceKey] = {
      isOpen: false,
      resetTimeout: 0,
      failureCount: 0,
      successCount: 0,
    };
  }
}

/**
 * Gets the current circuit breaker state for a service
 * 
 * @param serviceKey - Unique identifier for the service
 * @returns Current circuit breaker state or null if not found
 */
export function getCircuitBreakerState(serviceKey: string): CircuitBreakerState | null {
  return circuitRegistry[serviceKey] || null;
}