/**
 * Error handling utilities for the AUSTA SuperApp.
 * 
 * This module provides utilities for handling errors, including:
 * - Circuit breaker pattern for preventing cascading failures
 * - Error classification and standardization
 * - Retry mechanisms with backoff
 * - Fallback strategies for graceful degradation
 */

// Export circuit breaker functionality
export {
  CircuitBreaker,
  CircuitBreakerState,
  CircuitBreakerError,
  CircuitBreakerEvents,
  type CircuitBreakerOptions,
  type CircuitBreakerMetrics
} from './circuit-breaker';