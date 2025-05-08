/**
 * @file Shared Utilities Barrel File
 * @description Provides standardized exports for all utility modules in the shared/utils folder.
 * This file creates a consistent public API for importing utilities across the application,
 * reducing import complexity and preventing circular dependencies.
 * 
 * @module @app/shared/utils
 */

/**
 * Re-export all secure-axios utilities
 * @description Secured Axios HTTP clients with built-in SSRF protections to prevent server-side request forgery attacks.
 * Includes improved type safety using @austa/interfaces, better error classification, and standardized configuration options.
 */
export * from './secure-axios';

/**
 * Re-export all http-client utilities
 * @description Higher-level HTTP client that builds on top of secure-axios and implements advanced resilience patterns.
 * Provides circuit breaking, retry mechanisms with exponential backoff, request timeouts, and standardized error handling.
 * 
 * @example
 * // Create a basic HTTP client
 * const client = createHttpClient({
 *   baseURL: 'https://api.example.com',
 *   timeout: 5000
 * });
 * 
 * // Create a journey-specific HTTP client
 * const healthClient = createJourneyHttpClient('health', {
 *   baseURL: 'https://health-api.example.com'
 * });
 * 
 * // Make requests with automatic retry and circuit breaking
 * const data = await client.get('/users/123');
 */
export * from './http-client';

/**
 * Re-export all error-handling utilities
 * @description Utilities for consistent error handling across all backend services.
 * Implements the error classification system with utilities for categorizing errors, generating standardized error responses,
 * and implementing recovery strategies like retries and fallbacks.
 */
export * from './error-handling';

/**
 * Named exports for specific utilities
 * These exports provide direct access to commonly used functions without requiring knowledge of their source module
 */

// Secure Axios exports
export { createSecureAxiosInstance, validateUrl } from './secure-axios';

// HTTP Client exports
export { 
  createHttpClient,
  createJourneyHttpClient,
  HttpClient,
  HttpClientOptions,
  CircuitBreakerOptions,
  JourneyType
} from './http-client';

// Error Handling exports
export {
  classifyError,
  createErrorResponse,
  isTransientError,
  isClientError,
  isSystemError,
  isExternalError,
  withFallback
} from './error-handling';

/**
 * Default export for backward compatibility
 * @deprecated Use named exports instead for better tree-shaking
 */
export default {
  // Secure Axios
  createSecureAxiosInstance,
  validateUrl,
  
  // HTTP Client
  createHttpClient,
  createJourneyHttpClient,
  
  // Error Handling
  classifyError,
  createErrorResponse,
  isTransientError,
  isClientError,
  isSystemError,
  isExternalError,
  withFallback
};