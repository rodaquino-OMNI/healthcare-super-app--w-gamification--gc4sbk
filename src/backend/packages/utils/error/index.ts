/**
 * Error handling utilities for the AUSTA SuperApp.
 * 
 * This package provides a comprehensive set of utilities for handling errors
 * in a consistent and robust manner across all services and journeys.
 */

// Circuit Breaker exports
export {
  CircuitBreaker,
  CircuitState,
  CircuitOpenError,
  createCircuitBreaker,
  createJourneyCircuitBreaker,
  withCircuitBreaker,
  type CircuitBreakerOptions,
  type CircuitBreakerMetrics
} from './circuit-breaker';

// Async Error Handler exports
export {
  asyncTryCatch,
  AsyncErrorBoundary,
  withAsyncErrorHandling,
  safePromise,
  promiseWithTimeout
} from './async-error-handler';

// Error Formatter exports
export {
  formatError,
  formatJourneyError,
  getErrorMessage,
  getErrorSuggestion,
  translateError
} from './error-formatter';

// HTTP Error Handler exports
export {
  handleHttpError,
  parseHttpErrorResponse,
  retryableStatusCodes,
  withHttpErrorHandling,
  createSecureAxiosInstance
} from './http-error-handler';

// Fallback exports
export {
  withFallback,
  CacheableFallback,
  createFallbackChain,
  defaultValueFallback,
  journeyFallbackStrategy
} from './fallback';

// Retry exports
export {
  retry,
  retryAsync,
  Retryable,
  createRetryPolicy,
  exponentialBackoff,
  withJitter
} from './retry';