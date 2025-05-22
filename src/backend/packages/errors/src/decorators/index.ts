/**
 * @file Error Handling Decorators
 * 
 * This module provides a comprehensive set of decorators for implementing
 * resilience patterns in TypeScript applications. These decorators can be
 * applied to methods to add retry logic, circuit breaking, fallback strategies,
 * and error context enrichment.
 * 
 * The decorators are organized by resilience pattern categories and can be
 * used individually or combined using the composite Resilient decorator.
 */

// Re-export all types for decorator configurations
export * from './types';

/**
 * Retry Pattern Decorators
 * 
 * These decorators implement automatic retry logic for method calls that fail
 * with transient errors. They support various retry strategies including
 * fixed delay and exponential backoff with jitter.
 */
export { Retry, RetryWithBackoff } from './retry.decorator';

/**
 * Circuit Breaker Pattern Decorators
 * 
 * These decorators implement the circuit breaker pattern to prevent repeated
 * calls to failing dependencies. They track failure rates and automatically
 * transition between closed, open, and half-open states.
 */
export { CircuitBreaker } from './circuit-breaker.decorator';

/**
 * Fallback Strategy Decorators
 * 
 * These decorators implement fallback strategies for when method calls fail.
 * They allow specifying alternative behavior to execute instead of propagating
 * errors to callers.
 */
export { 
  WithFallback, 
  CachedFallback, 
  DefaultFallback 
} from './fallback.decorator';

/**
 * Error Context Decorators
 * 
 * These decorators enhance errors with contextual information, classify
 * uncaught errors into appropriate categories, and transform between
 * error types.
 */
export { 
  WithErrorContext, 
  ClassifyError, 
  TransformError 
} from './error-context.decorator';

/**
 * Composite Resilience Decorator
 * 
 * This high-level decorator combines multiple resilience patterns (retry,
 * circuit breaker, fallback) into a single decorator with a fluent
 * configuration API.
 */
export { Resilient } from './resilient.decorator';