/**
 * @file HTTP Utilities
 * @description Centralized export point for all HTTP utility functions and types.
 * This module provides a comprehensive set of tools for making HTTP requests
 * with enhanced security, error handling, and configuration options.
 */

// Core HTTP Client
import {
  createHttpClient,
  createSecureHttpClient as createBaseSecureHttpClient,
  createInternalApiClient as createBaseInternalApiClient,
  HttpClientConfig,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_HTTP_CLIENT_CONFIG,
  HttpClientError,
  HttpErrorType
} from './client';

// Security Utilities
import {
  createSecureHttpClient,
  createEnvironmentAwareSecureHttpClient,
  SSRFProtectionOptions
} from './security';

// Internal API Client
import {
  createInternalApiClient,
  JourneyType,
  InternalApiClientOptions,
  InternalRequestConfig,
  RETRYABLE_METHODS,
  RETRYABLE_STATUS_CODES,
  isRetryableError,
  calculateBackoffDelay
} from './internal';

/**
 * @category Core HTTP Client
 * @description Base HTTP client functionality with enhanced error handling and configuration options
 */
export {
  /**
   * Creates an HTTP client with enhanced features including error handling, logging, and retry mechanisms
   * 
   * @param config - Configuration options for the HTTP client
   * @returns A configured Axios instance with additional features
   * 
   * @example
   * ```typescript
   * const client = createHttpClient({
   *   timeout: 5000,
   *   enableLogging: true,
   *   retry: { maxRetries: 3 }
   * });
   * 
   * const response = await client.get('/api/data');
   * ```
   */
  createHttpClient,
  
  /**
   * Configuration options for the HTTP client
   */
  HttpClientConfig,
  
  /**
   * Retry configuration options for failed requests
   */
  RetryConfig,
  
  /**
   * Default retry configuration
   */
  DEFAULT_RETRY_CONFIG,
  
  /**
   * Default HTTP client configuration
   */
  DEFAULT_HTTP_CLIENT_CONFIG,
  
  /**
   * Extended HTTP error with additional context for better debugging and handling
   */
  HttpClientError,
  
  /**
   * HTTP client error types for better error classification and handling
   */
  HttpErrorType
};

/**
 * @category Security
 * @description SSRF protection and secure HTTP client utilities
 */
export {
  /**
   * Creates a secure HTTP client with SSRF protection
   * 
   * @param options - SSRF protection options
   * @returns A configured Axios instance with SSRF protection
   * 
   * @example
   * ```typescript
   * const client = createSecureHttpClient({
   *   allowLocalhost: false,
   *   enableDetailedLogging: true
   * });
   * 
   * const response = await client.get('https://api.example.com/data');
   * ```
   */
  createSecureHttpClient,
  
  /**
   * Creates a secure HTTP client with environment-specific SSRF protection
   * 
   * @returns A configured Axios instance with environment-specific SSRF protection
   * 
   * @example
   * ```typescript
   * // In development: allows localhost
   * // In test: allows localhost and private networks
   * // In production: strict security settings
   * const client = createEnvironmentAwareSecureHttpClient();
   * ```
   */
  createEnvironmentAwareSecureHttpClient,
  
  /**
   * Configuration options for SSRF protection
   */
  SSRFProtectionOptions
};

/**
 * @category Internal API
 * @description Utilities for internal service-to-service communication
 */
export {
  /**
   * Creates a secure axios instance with predefined config for internal API calls
   * with journey-specific configuration, retry logic, and distributed tracing.
   * 
   * @param options - Configuration options for the internal API client
   * @returns A configured Axios instance with security measures and retry logic
   * 
   * @example
   * ```typescript
   * const healthServiceClient = createInternalApiClient({
   *   baseURL: 'http://health-service:3000',
   *   journey: 'health',
   *   maxRetries: 3
   * });
   * 
   * const response = await healthServiceClient.get('/metrics/user/123');
   * ```
   */
  createInternalApiClient,
  
  /**
   * Journey types supported by the AUSTA SuperApp
   */
  JourneyType,
  
  /**
   * Configuration options for internal API client
   */
  InternalApiClientOptions,
  
  /**
   * Extended Axios request config with retry information
   */
  InternalRequestConfig,
  
  /**
   * HTTP methods that are safe to retry
   */
  RETRYABLE_METHODS,
  
  /**
   * Status codes that should trigger a retry
   */
  RETRYABLE_STATUS_CODES,
  
  /**
   * Determines if an error is retryable based on its type and status code
   * 
   * @param error - The error to check
   * @param config - The request configuration
   * @returns Whether the request should be retried
   */
  isRetryableError,
  
  /**
   * Calculate exponential backoff delay with jitter
   * 
   * @param retryCount - Current retry attempt number
   * @param baseDelay - Base delay in milliseconds
   * @returns Delay in milliseconds before next retry
   */
  calculateBackoffDelay
};

/**
 * @category Legacy
 * @description Legacy functions maintained for backward compatibility
 * @deprecated Use the new categorized exports instead
 */
export {
  /**
   * @deprecated Use createSecureHttpClient from the security module instead
   */
  createBaseSecureHttpClient as createSecureAxios,
  
  /**
   * @deprecated Use createInternalApiClient with options instead
   */
  createBaseInternalApiClient as createInternalApiClient
};

// Default export for backward compatibility
export default createHttpClient;