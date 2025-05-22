/**
 * @file Error Utilities
 * @description Centralized exports for all error handling utilities in the AUSTA SuperApp.
 * This module provides a clean API for importing error handling utilities across all services.
 * 
 * @module @austa/errors/utils
 */

// ===================================================================
// Retry Utilities
// ===================================================================

/**
 * Retry utilities provide mechanisms for handling transient errors through
 * configurable retry strategies with exponential backoff.
 */
export * from './retry';

// Named re-exports for backward compatibility
import { retryWithBackoff, RetryOptions, RetryableOperation } from './retry';
export { retryWithBackoff, RetryOptions, RetryableOperation };

// ===================================================================
// Circuit Breaker Utilities
// ===================================================================

/**
 * Circuit breaker utilities implement the Circuit Breaker pattern to prevent
 * cascading failures when external services are unavailable.
 */
export * from './circuit-breaker';

// Named re-exports for backward compatibility
import { CircuitBreaker, CircuitBreakerOptions, CircuitState } from './circuit-breaker';
export { CircuitBreaker, CircuitBreakerOptions, CircuitState };

// ===================================================================
// Error Formatting Utilities
// ===================================================================

/**
 * Error formatting utilities provide functions for creating standardized error
 * messages with journey context and user-friendly language.
 */
export * from './format';

// Named re-exports for backward compatibility
import { formatErrorMessage, createUserFriendlyMessage, formatErrorCode } from './format';
export { formatErrorMessage, createUserFriendlyMessage, formatErrorCode };

// ===================================================================
// Error Serialization Utilities
// ===================================================================

/**
 * Error serialization utilities provide functions for converting error objects
 * to standardized JSON formats for consistent error reporting.
 */
export * from './serialize';

// Named re-exports for backward compatibility
import { serializeError, deserializeError, redactSensitiveInfo } from './serialize';
export { serializeError, deserializeError, redactSensitiveInfo };

// ===================================================================
// Stack Trace Utilities
// ===================================================================

/**
 * Stack trace utilities provide functions for processing, cleaning, and analyzing
 * stack traces to extract useful diagnostic information.
 */
export * from './stack';

// Named re-exports for backward compatibility
import { cleanStack, extractOrigin, getRelevantFrames } from './stack';
export { cleanStack, extractOrigin, getRelevantFrames };

// ===================================================================
// Secure HTTP Utilities
// ===================================================================

/**
 * Secure HTTP utilities provide a secure HTTP client implementation with
 * protections against Server-Side Request Forgery (SSRF) attacks.
 */
export * from './secure-http';

// Named re-exports for backward compatibility
import { createSecureHttpClient, createInternalApiClient, SecureHttpClientOptions } from './secure-http';
export { createSecureHttpClient, createInternalApiClient, SecureHttpClientOptions };

// ===================================================================
// Convenience Exports
// ===================================================================

/**
 * Convenience function that creates a fully configured error handling setup
 * with retry, circuit breaker, and secure HTTP client.
 * 
 * @param options Configuration options for the error handling setup
 * @returns An object containing configured error handling utilities
 */
export function createErrorHandlingSetup(options?: {
  retry?: RetryOptions;
  circuitBreaker?: CircuitBreakerOptions;
  httpClient?: SecureHttpClientOptions;
}) {
  return {
    retry: new RetryableOperation(options?.retry),
    circuitBreaker: new CircuitBreaker(options?.circuitBreaker),
    httpClient: createSecureHttpClient(options?.httpClient),
  };
}

/**
 * Convenience function that wraps an async operation with retry and circuit breaker
 * protection in a single call.
 * 
 * @param operation The async operation to execute
 * @param options Configuration options for retry and circuit breaker
 * @returns The result of the operation
 * @throws Error if the operation fails after retries or if the circuit is open
 */
export async function executeWithResilience<T>(
  operation: () => Promise<T>,
  options?: {
    retry?: RetryOptions;
    circuitBreaker?: CircuitBreakerOptions;
  }
): Promise<T> {
  const cb = new CircuitBreaker(options?.circuitBreaker);
  return cb.execute(() => retryWithBackoff(operation, options?.retry));
}