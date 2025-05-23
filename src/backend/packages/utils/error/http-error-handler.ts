/**
 * @file http-error-handler.ts
 * @description Provides specialized error handling utilities for HTTP requests,
 * building upon the secure-axios.ts implementation. Includes functions for parsing
 * HTTP error responses, automatic retries for specific HTTP status codes, and error
 * transformation to the application's standard format.
 *
 * @module @austa/utils/error/http-error-handler
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createSecureAxios } from '../../shared/utils/secure-axios';
import { ErrorType } from '../../shared/src/exceptions/exceptions.types';

/**
 * Configuration options for HTTP retry mechanism
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds between retries */
  retryDelay: number;
  /** Jitter factor to add randomness to retry delays (0-1) */
  jitter: number;
  /** HTTP methods that are safe to retry (idempotent methods) */
  retryableHttpMethods: string[];
  /** HTTP status codes that should trigger a retry */
  retryableStatusCodes: number[];
  /** Custom function to determine if a request should be retried */
  shouldRetry?: (error: AxiosError) => boolean;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 300,
  jitter: 0.2,
  retryableHttpMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Configuration options for circuit breaker integration
 */
export interface CircuitBreakerConfig {
  /** Whether to enable circuit breaker integration */
  enabled: boolean;
  /** Name of the circuit breaker (for logging and metrics) */
  name: string;
  /** Additional circuit breaker options to pass to the circuit breaker implementation */
  options?: Record<string, unknown>;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  enabled: false,
  name: 'default',
};

/**
 * Configuration for the HTTP error handler
 */
export interface HttpErrorHandlerConfig {
  /** Retry configuration */
  retry?: Partial<RetryConfig>;
  /** Circuit breaker configuration */
  circuitBreaker?: Partial<CircuitBreakerConfig>;
  /** Base URL for the HTTP client */
  baseURL?: string;
  /** Default headers to include with all requests */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Error class for HTTP-specific errors with enhanced details
 */
export class HttpError extends Error {
  /** Original Axios error */
  readonly originalError: AxiosError;
  /** HTTP status code */
  readonly status: number;
  /** Error type classification */
  readonly type: ErrorType;
  /** Error code for application-specific error handling */
  readonly code: string;
  /** Additional error details */
  readonly details?: Record<string, unknown>;
  /** Whether this error is retryable */
  readonly isRetryable: boolean;

  /**
   * Creates a new HttpError instance
   * 
   * @param message Error message
   * @param originalError Original Axios error
   * @param status HTTP status code
   * @param type Error type classification
   * @param code Error code
   * @param details Additional error details
   * @param isRetryable Whether this error is retryable
   */
  constructor(
    message: string,
    originalError: AxiosError,
    status: number,
    type: ErrorType,
    code: string,
    details?: Record<string, unknown>,
    isRetryable = false,
  ) {
    super(message);
    this.name = 'HttpError';
    this.originalError = originalError;
    this.status = status;
    this.type = type;
    this.code = code;
    this.details = details;
    this.isRetryable = isRetryable;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  /**
   * Converts the error to a JSON object for serialization
   * 
   * @returns JSON representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      error: {
        type: this.type,
        code: this.code,
        message: this.message,
        status: this.status,
        details: this.details,
      },
    };
  }
}

/**
 * Parses an Axios error and converts it to a standardized HttpError
 * 
 * @param error The Axios error to parse
 * @param retryConfig Retry configuration to determine if the error is retryable
 * @returns A standardized HttpError
 */
export function parseAxiosError(error: AxiosError, retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG): HttpError {
  // Default values
  let status = 500;
  let type = ErrorType.TECHNICAL;
  let code = 'UNKNOWN_ERROR';
  let message = 'An unknown error occurred';
  let details: Record<string, unknown> | undefined;
  
  // Determine if the error is retryable
  const isRetryable = isErrorRetryable(error, retryConfig);

  // Handle network errors (no response)
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    status = 408;
    type = ErrorType.EXTERNAL;
    code = 'REQUEST_TIMEOUT';
    message = 'The request timed out';
  } else if (error.code === 'ECONNREFUSED') {
    status = 503;
    type = ErrorType.EXTERNAL;
    code = 'SERVICE_UNAVAILABLE';
    message = 'The service is unavailable';
  } else if (error.code?.startsWith('E') && !error.response) {
    // Other network errors
    status = 0;
    type = ErrorType.EXTERNAL;
    code = 'NETWORK_ERROR';
    message = `Network error: ${error.code}`;
  }

  // If we have a response, use its status and data
  if (error.response) {
    status = error.response.status;
    
    // Extract message and details from response if available
    if (error.response.data) {
      if (typeof error.response.data === 'string') {
        message = error.response.data;
      } else if (typeof error.response.data === 'object') {
        const data = error.response.data as Record<string, unknown>;
        message = (data.message as string) || (data.error as string) || message;
        
        // Extract error details if available
        if (data.details) {
          details = data.details as Record<string, unknown>;
        } else {
          // Create details from the response data, excluding common fields
          const { message: _, error: __, details: ___, ...rest } = data;
          if (Object.keys(rest).length > 0) {
            details = rest;
          }
        }

        // Extract error code if available
        if (data.code && typeof data.code === 'string') {
          code = data.code;
        }
      }
    }

    // Map HTTP status codes to error types
    if (status >= 400 && status < 500) {
      if (status === 401) {
        type = ErrorType.VALIDATION;
        code = 'UNAUTHORIZED';
        message = message || 'Authentication required';
      } else if (status === 403) {
        type = ErrorType.VALIDATION;
        code = 'FORBIDDEN';
        message = message || 'Access forbidden';
      } else if (status === 404) {
        type = ErrorType.VALIDATION;
        code = 'NOT_FOUND';
        message = message || 'Resource not found';
      } else if (status === 422) {
        type = ErrorType.BUSINESS;
        code = 'UNPROCESSABLE_ENTITY';
        message = message || 'The request could not be processed';
      } else if (status === 429) {
        type = ErrorType.EXTERNAL;
        code = 'TOO_MANY_REQUESTS';
        message = message || 'Too many requests';
      } else {
        type = ErrorType.VALIDATION;
        code = `CLIENT_ERROR_${status}`;
        message = message || 'Client error';
      }
    } else if (status >= 500) {
      type = ErrorType.EXTERNAL;
      code = `SERVER_ERROR_${status}`;
      message = message || 'Server error';
    }
  }

  return new HttpError(message, error, status, type, code, details, isRetryable);
}

/**
 * Determines if an error should be retried based on the retry configuration
 * 
 * @param error The Axios error to check
 * @param config Retry configuration
 * @returns True if the error should be retried, false otherwise
 */
export function isErrorRetryable(error: AxiosError, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  // If a custom shouldRetry function is provided, use it
  if (config.shouldRetry) {
    return config.shouldRetry(error);
  }

  // Don't retry if the request method is not in the retryable methods list
  const method = error.config?.method?.toUpperCase() || 'GET';
  if (!config.retryableHttpMethods.includes(method)) {
    return false;
  }

  // Retry on network errors (no response)
  if (!error.response) {
    return true;
  }

  // Retry based on status code
  return config.retryableStatusCodes.includes(error.response.status);
}

/**
 * Calculates the delay for the next retry attempt using exponential backoff with jitter
 * 
 * @param retryCount Current retry attempt (0-based)
 * @param config Retry configuration
 * @returns Delay in milliseconds before the next retry
 */
export function calculateRetryDelay(retryCount: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  // Calculate exponential backoff: baseDelay * 2^retryCount
  const exponentialDelay = config.retryDelay * Math.pow(2, retryCount);
  
  // Add jitter to prevent thundering herd problem
  // Formula: delay = exponentialDelay * (1 ± jitter)
  const jitterFactor = 1 - config.jitter + (Math.random() * config.jitter * 2);
  
  return Math.floor(exponentialDelay * jitterFactor);
}

/**
 * Creates an Axios instance with enhanced error handling, retry capabilities,
 * and circuit breaker integration
 * 
 * @param config Configuration for the HTTP error handler
 * @returns An Axios instance with enhanced error handling
 */
export function createHttpClient(config: HttpErrorHandlerConfig = {}): AxiosInstance {
  // Create a secure Axios instance with SSRF protection
  const instance = createSecureAxios();

  // Apply base configuration
  if (config.baseURL) {
    instance.defaults.baseURL = config.baseURL;
  }

  if (config.headers) {
    instance.defaults.headers = {
      ...instance.defaults.headers,
      ...config.headers,
    };
  }

  if (config.timeout) {
    instance.defaults.timeout = config.timeout;
  }

  // Merge retry configuration with defaults
  const retryConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config.retry,
  };

  // Merge circuit breaker configuration with defaults
  const circuitBreakerConfig: CircuitBreakerConfig = {
    ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
    ...config.circuitBreaker,
  };

  // Add response interceptor for error handling and retries
  instance.interceptors.response.use(
    // Success handler - just pass through the response
    (response) => response,
    // Error handler - handle retries and error transformation
    async (error: AxiosError) => {
      // Get the original request config
      const originalConfig = error.config as AxiosRequestConfig & { _retryCount?: number };
      
      // Initialize retry count if not already set
      if (originalConfig._retryCount === undefined) {
        originalConfig._retryCount = 0;
      }

      // Check if we should retry the request
      if (
        originalConfig._retryCount < retryConfig.maxRetries &&
        isErrorRetryable(error, retryConfig)
      ) {
        originalConfig._retryCount += 1;

        // Calculate delay for exponential backoff
        const delay = calculateRetryDelay(originalConfig._retryCount - 1, retryConfig);

        // Wait for the calculated delay
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry the request
        return instance(originalConfig);
      }

      // If we've exhausted retries or the error is not retryable,
      // transform it to a standardized format and reject
      return Promise.reject(parseAxiosError(error, retryConfig));
    }
  );

  return instance;
}

/**
 * Creates an HTTP client with circuit breaker integration
 * This is a wrapper around createHttpClient that adds circuit breaker functionality
 * 
 * @param config Configuration for the HTTP error handler
 * @param circuitBreakerFactory Factory function to create a circuit breaker instance
 * @returns An Axios instance with circuit breaker integration
 */
export function createHttpClientWithCircuitBreaker(
  config: HttpErrorHandlerConfig = {},
  circuitBreakerFactory: (name: string, options?: Record<string, unknown>) => any
): AxiosInstance {
  // Create the HTTP client with retry capabilities
  const instance = createHttpClient(config);

  // Merge circuit breaker configuration with defaults
  const circuitBreakerConfig: CircuitBreakerConfig = {
    ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
    ...config.circuitBreaker,
  };

  // If circuit breaker is not enabled, return the instance as is
  if (!circuitBreakerConfig.enabled) {
    return instance;
  }

  // Create a circuit breaker instance
  const circuitBreaker = circuitBreakerFactory(
    circuitBreakerConfig.name,
    circuitBreakerConfig.options
  );

  // Create a wrapped instance that uses the circuit breaker
  const wrappedInstance = axios.create();

  // Copy all properties from the original instance
  Object.assign(wrappedInstance.defaults, instance.defaults);

  // Override the request method to use the circuit breaker
  const originalRequest = wrappedInstance.request.bind(wrappedInstance);
  wrappedInstance.request = async function(configOrUrl: any, config?: any) {
    // Normalize the config
    const requestConfig = typeof configOrUrl === 'string'
      ? { url: configOrUrl, ...config }
      : configOrUrl;

    // Execute the request through the circuit breaker
    return circuitBreaker.execute(() => originalRequest(requestConfig));
  };

  // Add convenience methods (get, post, etc.) that use the wrapped request method
  ['get', 'delete', 'head', 'options', 'post', 'put', 'patch'].forEach(method => {
    wrappedInstance[method] = function(url: string, config?: any) {
      return wrappedInstance.request({
        ...config,
        method,
        url,
      });
    };
  });

  return wrappedInstance;
}

/**
 * Extracts useful information from an HTTP response
 * 
 * @param response The Axios response object
 * @returns An object with extracted information
 */
export function extractResponseInfo(response: AxiosResponse): Record<string, unknown> {
  return {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    data: response.data,
    config: {
      url: response.config.url,
      method: response.config.method,
      baseURL: response.config.baseURL,
      headers: response.config.headers,
    },
  };
}

/**
 * Extracts useful information from an HTTP error
 * 
 * @param error The HTTP error object
 * @returns An object with extracted information
 */
export function extractErrorInfo(error: HttpError): Record<string, unknown> {
  return {
    name: error.name,
    message: error.message,
    status: error.status,
    type: error.type,
    code: error.code,
    details: error.details,
    isRetryable: error.isRetryable,
    config: error.originalError.config ? {
      url: error.originalError.config.url,
      method: error.originalError.config.method,
      baseURL: error.originalError.config.baseURL,
    } : undefined,
  };
}

export default {
  createHttpClient,
  createHttpClientWithCircuitBreaker,
  parseAxiosError,
  isErrorRetryable,
  calculateRetryDelay,
  extractResponseInfo,
  extractErrorInfo,
  HttpError,
};