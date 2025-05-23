/**
 * @file Main entry point for the error handling utilities package.
 * Exports all functions, classes, and types from the other files.
 */

// Circuit Breaker exports
export {
  CircuitBreaker,
  CircuitState,
  CircuitBreakerOptions,
  CircuitBreakerMetrics,
  CircuitBreakerOpenError,
  CircuitBreakerTimeoutError
} from './circuit-breaker';

// Re-export other error utilities as they are implemented
// This will be expanded as other error handling utilities are added