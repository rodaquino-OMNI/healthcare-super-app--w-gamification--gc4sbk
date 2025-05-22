/**
 * @file middleware/index.ts
 * @description Barrel export file that centralizes all database middleware exports in a single entry point.
 * This file provides a clean, organized interface for importing any middleware component across the application.
 * It simplifies dependency management by allowing developers to import multiple middleware components from a
 * single path rather than from individual files.
 */

// ========================================================================
// INTERFACES & TYPES
// Export these first to avoid circular dependencies
// ========================================================================

/**
 * Core middleware interfaces that define the middleware pipeline pattern
 */
export {
  // Core middleware interface
  DatabaseMiddleware,
  // Context and result interfaces
  MiddlewareContext,
  MiddlewareResult,
  // Function type for middleware chaining
  NextMiddlewareFunction,
  // Middleware chain interface
  MiddlewareChain,
  // Middleware options interface
  MiddlewareOptions,
  // Middleware factory type
  MiddlewareFactory,
  // Enums for operation context
  JourneyContext,
  DatabaseOperationType,
} from './middleware.interface';

/**
 * Specialized middleware interfaces for different middleware types
 */
export {
  // Logging middleware interface
  LoggingMiddleware,
  // Performance monitoring middleware interface
  PerformanceMiddleware,
  // Transformation middleware interface
  TransformationMiddleware,
  // Circuit breaker middleware interface
  CircuitBreakerMiddleware,
  // Error handling middleware interface
  ErrorHandlingMiddleware,
} from './middleware.interface';

// ========================================================================
// MIDDLEWARE IMPLEMENTATIONS
// ========================================================================

/**
 * Logging middleware for database operations
 * @description Implements query logging with configurable detail levels.
 * Integrates with the application's structured logging system to provide
 * consistent query logging across all journey services.
 */
export { 
  LoggingMiddleware,
  // Configuration options for logging middleware
  LoggingMiddlewareOptions,
} from './logging.middleware';

/**
 * Performance monitoring middleware for database operations
 * @description Tracks query execution times, identifies slow queries,
 * and collects metrics for observability dashboards. Automatically detects
 * performance degradation patterns and provides query optimization suggestions.
 */
export { 
  PerformanceMiddleware as PerformanceMonitoringMiddleware,
  // Configuration options for performance middleware
  PerformanceMiddlewareOptions,
} from './performance.middleware';

/**
 * Transformation middleware for database operations
 * @description Modifies database operations before execution to optimize
 * performance and implement cross-cutting concerns. Provides journey-specific
 * query transformations, multi-tenancy support, and automatic index utilization.
 */
export { 
  TransformationMiddleware as QueryTransformationMiddleware,
  // Configuration options for transformation middleware
  TransformationMiddlewareOptions,
} from './transformation.middleware';

/**
 * Circuit breaker middleware for database operations
 * @description Implements the circuit breaker pattern to prevent cascading
 * failures during database outages. Tracks operation failures and automatically
 * opens the circuit when failure thresholds are exceeded.
 */
export { 
  CircuitBreakerMiddleware,
  // Configuration options for circuit breaker middleware
  CircuitBreakerOptions,
  // Circuit breaker states
  CircuitState,
} from './circuit-breaker.middleware';

// ========================================================================
// MIDDLEWARE FACTORY & REGISTRY
// ========================================================================

/**
 * Middleware factory for creating middleware instances
 * @description Factory class that creates and configures middleware instances
 * for database operations. Provides methods for creating standard middleware
 * chains optimized for different journey services and operation types.
 */
export { 
  MiddlewareFactory as DatabaseMiddlewareFactory,
  // Factory creation options
  MiddlewareFactoryOptions,
  // Predefined middleware chains
  PredefinedMiddlewareChain,
} from './middleware.factory';

/**
 * Middleware registry for managing global middleware configuration
 * @description Registry for managing global middleware configuration across
 * the application. Maintains a registry of middleware instances and configurations,
 * allowing for centralized management and dynamic updates at runtime.
 */
export { 
  MiddlewareRegistry as DatabaseMiddlewareRegistry,
  // Registry configuration options
  MiddlewareRegistryOptions,
  // Middleware registration options
  MiddlewareRegistrationOptions,
} from './middleware.registry';

// ========================================================================
// CONVENIENCE EXPORTS
// ========================================================================

/**
 * Creates a default middleware chain with standard middleware
 * @description Convenience function for creating a middleware chain with
 * the standard middleware components (logging, performance, transformation,
 * circuit breaker) configured with default options.
 * 
 * @param options Configuration options for the middleware chain
 * @returns A configured middleware chain
 */
export { createDefaultMiddlewareChain } from './middleware.factory';

/**
 * Creates a journey-specific middleware chain
 * @description Convenience function for creating a middleware chain optimized
 * for a specific journey type with journey-specific configurations.
 * 
 * @param journeyContext The journey context to optimize for
 * @param options Additional configuration options
 * @returns A journey-optimized middleware chain
 */
export { createJourneyMiddlewareChain } from './middleware.factory';