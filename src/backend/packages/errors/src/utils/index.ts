/**
 * @file Error Utilities Index
 * 
 * This file serves as the entry point for the error utilities package, providing a clean API
 * for importing all error handling utilities. It exports functions and classes from the retry,
 * circuit-breaker, format, serialize, stack, and secure-http modules in a well-organized manner.
 * 
 * @module @austa/errors/utils
 */

/**
 * Retry Utilities
 * 
 * Functions and types for implementing retry logic with exponential backoff
 * to handle transient errors across the application.
 */
export {
  retryWithBackoff,
  retryWithBackoffSync,
  createRetryableFunction,
  createRetryableFunctionSync,
  retryDatabaseOperation,
  retryExternalApiCall,
  retryKafkaOperation,
  retryHealthIntegration,
  retryDeviceSync,
  retryNotificationDelivery,
  calculateBackoff,
  isRetryableError,
  delay,
  RetryConfig,
  RetryConfigs
} from './retry';

/**
 * Circuit Breaker Utilities
 * 
 * Implementation of the Circuit Breaker pattern to prevent cascading failures
 * when external services are unavailable.
 */
export {
  CircuitBreaker,
  CircuitBreakerOptions,
  CircuitBreakerState,
  createCircuitBreaker
} from './circuit-breaker';

/**
 * Error Formatting Utilities
 * 
 * Functions for formatting error messages with contextual information,
 * improving error clarity for both developers and end-users.
 */
export {
  formatErrorMessage,
  formatErrorWithContext,
  translateTechnicalError,
  formatErrorCode,
  createErrorMessageTemplate
} from './format';

/**
 * Error Serialization Utilities
 * 
 * Functions for serializing error objects to standardized JSON formats
 * for consistent error reporting across service boundaries.
 */
export {
  serializeError,
  deserializeError,
  redactSensitiveInfo,
  createErrorFromSerialized
} from './serialize';

/**
 * Stack Trace Utilities
 * 
 * Utilities for processing, cleaning, and analyzing stack traces
 * to extract useful diagnostic information.
 */
export {
  cleanStack,
  extractStackMetadata,
  highlightApplicationFrames,
  getErrorOrigin,
  parseStackTrace
} from './stack';

/**
 * Secure HTTP Utilities
 * 
 * Secure HTTP client implementation with protections against
 * Server-Side Request Forgery (SSRF) attacks and integration with
 * retry and circuit breaker patterns.
 */
export {
  createSecureHttpClient,
  SecureHttpOptions,
  createInternalApiClient,
  isRetryableHttpError
} from './secure-http';

/**
 * Backward Compatibility Aliases
 * 
 * Re-exports with renamed functions for backward compatibility
 * with existing code that may use different function names.
 */
export {
  serializeError as stringifyError,
  deserializeError as parseError,
  formatErrorMessage as formatError,
  createSecureHttpClient as createSecureAxios
};