/**
 * @file HTTP Utilities
 * @description Centralized exports for all HTTP utilities used across the AUSTA SuperApp backend services.
 * This module provides a unified interface for secure HTTP clients, resilience patterns,
 * and standardized request/response handling.
 */

/**
 * Secure HTTP Client Utilities
 * @module secure-axios
 */
export { 
  /**
   * Creates an Axios instance with SSRF protections to prevent server-side request forgery
   * by blocking requests to private networks, loopback addresses, and other restricted domains.
   * 
   * @param {AxiosRequestConfig} config - Axios configuration options
   * @returns {AxiosInstance} Secure Axios instance with SSRF protections
   */
  createSecureAxios,

  /**
   * Creates a pre-configured Axios instance for internal service-to-service communication
   * with standardized timeout, content type, and security settings.
   * 
   * @param {string} baseURL - Base URL for the internal service
   * @param {AxiosRequestConfig} config - Additional Axios configuration options
   * @returns {AxiosInstance} Configured Axios instance for internal API calls
   */
  createInternalApiClient
} from './secure-axios';

/**
 * Retry Mechanism Utilities
 * @module retry
 */
export {
  /**
   * Creates an Axios instance with automatic retry capability for failed requests
   * using configurable retry policies with exponential backoff and jitter.
   * 
   * @param {AxiosInstance} axiosInstance - Axios instance to enhance with retry capability
   * @param {RetryPolicy} retryPolicy - Configuration for retry behavior
   * @returns {AxiosInstance} Axios instance with retry capability
   */
  createRetryableAxios,

  /**
   * Retries a function with exponential backoff according to the provided retry policy.
   * Can be used for any async operation, not just HTTP requests.
   * 
   * @param {Function} fn - Async function to retry
   * @param {RetryPolicy} retryPolicy - Configuration for retry behavior
   * @returns {Promise<any>} Result of the successful function execution
   */
  retryRequest,

  /**
   * Default retry policy with moderate settings suitable for most operations.
   * Attempts 3 retries with exponential backoff starting at 300ms.
   */
  DEFAULT_RETRY_POLICY,

  /**
   * Aggressive retry policy for critical operations.
   * Attempts 5 retries with exponential backoff starting at 100ms.
   */
  AGGRESSIVE_RETRY_POLICY,

  /**
   * Minimal retry policy for less critical operations.
   * Attempts 2 retries with exponential backoff starting at 500ms.
   */
  MINIMAL_RETRY_POLICY
} from './retry';

/**
 * Circuit Breaker Pattern Utilities
 * @module circuit-breaker
 */
export {
  /**
   * Creates an Axios instance with circuit breaker capability to prevent cascading failures
   * by automatically stopping requests to failing services when thresholds are exceeded.
   * 
   * @param {AxiosInstance} axiosInstance - Axios instance to enhance with circuit breaker
   * @param {CircuitBreakerOptions} options - Configuration for circuit breaker behavior
   * @returns {AxiosInstance} Axios instance with circuit breaker capability
   */
  createCircuitBreakerAxios,

  /**
   * Circuit is closed and all requests are allowed through.
   * This is the normal operating state.
   */
  CLOSED,

  /**
   * Circuit is open and all requests are blocked without being attempted.
   * This state is entered when the failure threshold is exceeded.
   */
  OPEN,

  /**
   * Circuit is partially open, allowing a limited number of test requests through
   * to determine if the service has recovered.
   */
  HALF_OPEN
} from './circuit-breaker';

/**
 * Request Helper Utilities
 * @module request-helpers
 */
export {
  /**
   * Adds an authentication header with JWT token to an Axios request config.
   * 
   * @param {AxiosRequestConfig} config - Axios request configuration
   * @param {string} token - JWT token to add to the request
   * @returns {AxiosRequestConfig} Updated request configuration with auth header
   */
  addAuthHeader,

  /**
   * Adds journey context metadata to an Axios request config to enable
   * cross-journey request tracking and context propagation.
   * 
   * @param {AxiosRequestConfig} config - Axios request configuration
   * @param {JourneyContext} journeyContext - Journey context metadata
   * @returns {AxiosRequestConfig} Updated request configuration with journey context
   */
  addJourneyContext,

  /**
   * Sanitizes a request URL to prevent path traversal and other URL-based vulnerabilities.
   * 
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL safe for use in requests
   */
  sanitizeRequestUrl,

  /**
   * Validates request parameters against a schema to ensure they meet requirements.
   * 
   * @param {object} params - Request parameters to validate
   * @param {object} schema - Validation schema (e.g., Zod schema)
   * @returns {boolean} True if parameters are valid, throws error otherwise
   */
  validateRequestParams,

  /**
   * Logs request details in a standardized format for monitoring and debugging.
   * 
   * @param {AxiosRequestConfig} config - Axios request configuration to log
   * @param {object} options - Logging options (e.g., log level, sensitive field masking)
   */
  logRequest
} from './request-helpers';

/**
 * Response Helper Utilities
 * @module response-helpers
 */
export {
  /**
   * Parses error responses from various API formats into a standardized error object.
   * 
   * @param {AxiosError} error - Axios error object
   * @returns {StandardizedError} Standardized error object with consistent properties
   */
  parseErrorResponse,

  /**
   * Extracts pagination data from API responses with different pagination formats.
   * 
   * @param {AxiosResponse} response - Axios response object
   * @returns {PaginationData} Standardized pagination data
   */
  extractPaginationData,

  /**
   * Validates a response against a schema to ensure it matches expected format.
   * 
   * @param {AxiosResponse} response - Axios response object
   * @param {object} schema - Validation schema (e.g., Zod schema)
   * @returns {boolean} True if response is valid, throws error otherwise
   */
  validateResponseSchema,

  /**
   * Sanitizes response data to prevent XSS and other injection vulnerabilities.
   * 
   * @param {any} data - Response data to sanitize
   * @returns {any} Sanitized response data safe for use in the application
   */
  sanitizeResponseData,

  /**
   * Logs response details in a standardized format for monitoring and debugging.
   * 
   * @param {AxiosResponse} response - Axios response to log
   * @param {object} options - Logging options (e.g., log level, sensitive field masking)
   */
  logResponse
} from './response-helpers';