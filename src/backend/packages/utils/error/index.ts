/**
 * Error Handling Utilities
 * 
 * This package provides a comprehensive set of error handling utilities for the AUSTA SuperApp,
 * including error formatting, async error handling, HTTP error handling, fallback strategies,
 * circuit breaker pattern, and retry mechanisms.
 * 
 * @module @austa/utils/error
 */

// -----------------------------------------------------------------------------
// Error Formatter Exports
// -----------------------------------------------------------------------------

/**
 * Error formatting utilities for creating user-friendly error messages with
 * journey-specific context, localization support, and action suggestions.
 */
export {
  /**
   * Interface for error context information that enhances error messages
   */
  ErrorContext,
  
  /**
   * Interface for user action suggestions based on error type
   */
  ErrorActionSuggestion,
  
  /**
   * Interface for a formatted error response
   */
  FormattedError,
  
  /**
   * Generates user action suggestions based on error type and context
   */
  generateErrorSuggestions,
  
  /**
   * Gets the appropriate error message for an error code, considering journey context
   */
  getErrorMessage,
  
  /**
   * Translates an error message to the specified locale
   */
  translateErrorMessage,
  
  /**
   * Enhances error details with context information
   */
  enhanceErrorWithContext,
  
  /**
   * Formats an error with user-friendly messages, localization, and context
   */
  formatError,
  
  /**
   * Creates a formatted validation error
   */
  createValidationError,
  
  /**
   * Creates a formatted business error
   */
  createBusinessError,
  
  /**
   * Creates a formatted technical error
   */
  createTechnicalError,
  
  /**
   * Creates a formatted external system error
   */
  createExternalError,
  
  /**
   * Creates a journey-specific error with appropriate context
   */
  createJourneyError,
} from './error-formatter';

// -----------------------------------------------------------------------------
// Async Error Handler Exports
// -----------------------------------------------------------------------------

/**
 * Utilities for handling asynchronous errors in promise chains and async/await functions,
 * providing standardized error handling patterns and proper error propagation.
 */
export {
  /**
   * Options for the asyncTryCatch function
   */
  AsyncTryCatchOptions,
  
  /**
   * Wraps an async function with standardized error handling
   */
  asyncTryCatch,
  
  /**
   * Options for the safePromise function
   */
  SafePromiseOptions,
  
  /**
   * Result of the safePromise function, containing either the result or an error
   */
  SafePromiseResult,
  
  /**
   * Wraps a promise to prevent unhandled rejections and provide a standardized result format
   */
  safePromise,
  
  /**
   * Type guard to check if an error is an instance of a specific error class
   */
  isErrorOfType,
  
  /**
   * Options for the AsyncErrorBoundary class
   */
  AsyncErrorBoundaryOptions,
  
  /**
   * Class that provides reactive error handling for async operations
   */
  AsyncErrorBoundary,
  
  /**
   * Creates a promise that rejects after the specified timeout
   */
  createTimeout,
  
  /**
   * Adds a timeout to a promise
   */
  withTimeout,
} from './async-error-handler';

// -----------------------------------------------------------------------------
// HTTP Error Handler Exports
// -----------------------------------------------------------------------------

/**
 * Specialized error handling utilities for HTTP requests, including parsing HTTP error responses,
 * automatic retries for specific HTTP status codes, and error transformation.
 */
export {
  /**
   * HTTP error response structure
   */
  HttpErrorResponse,
  
  /**
   * Retry configuration options
   */
  RetryConfig,
  
  /**
   * Default retry configuration
   */
  DEFAULT_RETRY_CONFIG,
  
  /**
   * Creates a secure HTTP client with enhanced error handling and retry capabilities
   */
  createHttpClient,
  
  /**
   * Parses an Axios error into a standardized HTTP error response
   */
  parseHttpError,
  
  /**
   * Circuit breaker state interface
   */
  CircuitBreakerState,
  
  /**
   * Circuit breaker configuration
   */
  CircuitBreakerConfig,
  
  /**
   * Default circuit breaker configuration
   */
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  
  /**
   * Creates an HTTP client with circuit breaker pattern implementation
   */
  createCircuitBreakerHttpClient,
  
  /**
   * Resets the circuit breaker state for a service
   */
  resetCircuitBreaker,
  
  /**
   * Gets the current circuit breaker state for a service
   */
  getCircuitBreakerState,
} from './http-error-handler';

// -----------------------------------------------------------------------------
// Fallback Strategy Exports
// -----------------------------------------------------------------------------

/**
 * Fallback strategies for graceful degradation when operations fail, allowing the application
 * to continue functioning with reduced capabilities by providing alternative data sources
 * or simplified functionality.
 */
export {
  /**
   * Options for configuring fallback behavior
   */
  FallbackOptions,
  
  /**
   * Executes an operation with fallback strategies if it fails
   */
  withFallback,
  
  /**
   * Class for implementing cacheable fallback strategies
   */
  CacheableFallback,
  
  /**
   * Creates a chain of fallback strategies to try in sequence
   */
  FallbackChain,
  
  /**
   * Creates a fallback function that returns a default value
   */
  createDefaultValueFallback,
} from './fallback';

// -----------------------------------------------------------------------------
// Circuit Breaker Exports
// -----------------------------------------------------------------------------

/**
 * Implementation of the circuit breaker pattern to prevent cascading failures when interacting
 * with failing services or dependencies, automatically tripping when thresholds are exceeded
 * and gradually testing recovery.
 */
export {
  /**
   * Enum representing the possible states of a circuit breaker
   */
  CircuitState,
  
  /**
   * Interface for circuit breaker options
   */
  CircuitBreakerOptions,
  
  /**
   * Interface for circuit breaker metrics
   */
  CircuitBreakerMetrics,
  
  /**
   * Error thrown when a circuit is open and a request is attempted
   */
  CircuitOpenError,
  
  /**
   * Implementation of the Circuit Breaker pattern
   */
  CircuitBreaker,
  
  /**
   * Creates a circuit breaker with the specified options
   */
  createCircuitBreaker,
  
  /**
   * Creates a circuit breaker with journey-specific configuration
   */
  createJourneyCircuitBreaker,
  
  /**
   * Wraps a function with circuit breaker protection
   */
  withCircuitBreaker,
} from './circuit-breaker';

// -----------------------------------------------------------------------------
// Retry Mechanism Exports
// -----------------------------------------------------------------------------

/**
 * Configurable retry mechanisms with exponential backoff for handling transient errors,
 * providing functions and decorators for retrying failed operations with customizable
 * retry counts, delays, and conditions.
 */
export {
  /**
   * Configuration options for retry operations
   */
  RetryOptions,
  
  /**
   * Default retry options
   */
  DEFAULT_RETRY_OPTIONS,
  
  /**
   * Journey-specific retry configurations
   */
  JOURNEY_RETRY_CONFIGS,
  
  /**
   * Calculates the delay for the next retry attempt with exponential backoff and jitter
   */
  calculateBackoffDelay,
  
  /**
   * Executes a function with retry capability using exponential backoff
   */
  retry,
  
  /**
   * Decorator for retrying class methods with exponential backoff
   */
  Retryable,
  
  /**
   * Creates a retry configuration for a specific journey
   */
  getJourneyRetryConfig,
  
  /**
   * Creates a retry function with pre-configured options
   */
  createRetryFunction,
} from './retry';