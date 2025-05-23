/**
 * @file index.ts
 * @description Main entry point for the error handling utilities package that exports all functions, classes, and types
 * from the other files. Serves as a barrel file to simplify imports for consumers, allowing them to import from a
 * single path rather than multiple individual files.
 *
 * @module @austa/utils/error
 */

/**
 * Error Formatter
 * Utilities for formatting error messages in a user-friendly, consistent manner across the application.
 */
export {
  ErrorFormatter,
  formatTemplate,
  formatJourneyMessage,
  getLocalizedErrorMessage,
  type ErrorFormattingOptions,
  type FormattedErrorMessage,
  type ErrorCodeMapping
} from './error-formatter';

/**
 * Async Error Handler
 * Utilities for consistent handling of asynchronous errors in promise chains and async/await functions.
 */
export {
  asyncTryCatch,
  createSafePromise,
  AsyncErrorBoundary,
  toAppException,
  createTimeoutPromise,
  withTimeout,
  type AsyncFunction,
  type ErrorHandler,
  type ErrorTransformer,
  type AsyncTryCatchOptions,
  type SafePromiseOptions
} from './async-error-handler';

/**
 * HTTP Error Handler
 * Specialized error handling utilities for HTTP requests.
 */
export {
  HttpError,
  parseAxiosError,
  isErrorRetryable,
  calculateRetryDelay as calculateHttpRetryDelay,
  createHttpClient,
  createHttpClientWithCircuitBreaker,
  extractResponseInfo,
  extractErrorInfo,
  type RetryConfig as HttpRetryConfig,
  type CircuitBreakerConfig as HttpCircuitBreakerConfig,
  type HttpErrorHandlerConfig,
  DEFAULT_RETRY_CONFIG as DEFAULT_HTTP_RETRY_CONFIG,
  DEFAULT_CIRCUIT_BREAKER_CONFIG as DEFAULT_HTTP_CIRCUIT_BREAKER_CONFIG
} from './http-error-handler';

/**
 * Fallback Strategies
 * Utilities for implementing fallback strategies for graceful degradation when operations fail.
 */
export {
  withFallback,
  CacheableFallback,
  DefaultValueFallback,
  FallbackChain,
  HealthJourneyFallbacks,
  CareJourneyFallbacks,
  PlanJourneyFallbacks,
  type FallbackStrategy,
  type WithFallbackOptions,
  type CacheableFallbackOptions,
  type DefaultValueFallbackOptions,
  type FallbackChainOptions
} from './fallback';

/**
 * Circuit Breaker
 * Implementation of the circuit breaker pattern to prevent cascading failures.
 */
export {
  CircuitBreaker,
  CircuitState,
  CircuitBreakerOpenError,
  CircuitBreakerTimeoutError,
  type CircuitBreakerOptions,
  type CircuitBreakerMetrics
} from './circuit-breaker';

/**
 * Retry Mechanisms
 * Utilities for implementing retry mechanisms with exponential backoff.
 */
export {
  retry,
  calculateBackoffDelay,
  createJourneyRetryConfig,
  createApiRetryConfig,
  Retry,
  withRetry,
  DEFAULT_RETRY_OPTIONS,
  JOURNEY_RETRY_CONFIGS,
  type RetryOptions
} from './retry';

/**
 * Re-export error types from shared package for convenience
 * This allows consumers to import all error-related types from a single location
 */
export { ErrorType, AppException } from '../../../shared/src/exceptions/exceptions.types';

/**
 * Default export that includes the most commonly used utilities
 * for easier consumption in non-tree-shaking environments
 */
export default {
  // Error Formatter
  ErrorFormatter,
  formatTemplate,
  formatJourneyMessage,
  getLocalizedErrorMessage,
  
  // Async Error Handler
  asyncTryCatch,
  createSafePromise,
  AsyncErrorBoundary,
  toAppException,
  withTimeout,
  
  // HTTP Error Handler
  HttpError,
  createHttpClient,
  parseAxiosError,
  
  // Fallback Strategies
  withFallback,
  CacheableFallback,
  DefaultValueFallback,
  FallbackChain,
  
  // Circuit Breaker
  CircuitBreaker,
  CircuitState,
  
  // Retry Mechanisms
  retry,
  Retry,
  withRetry,
  createJourneyRetryConfig,
  createApiRetryConfig,
  
  // Error Types
  ErrorType,
  AppException
};