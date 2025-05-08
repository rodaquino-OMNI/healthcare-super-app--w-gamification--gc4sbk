/**
 * @file Database Middleware Barrel Export
 * @description Centralizes all database middleware exports in a single entry point.
 * This file provides a clean, organized interface for importing any middleware
 * component across the application.
 *
 * @module @austa/database/middleware
 * @preferred
 *
 * @example
 * // Import specific middleware components
 * import { LoggingMiddleware, PerformanceMiddleware } from '@austa/database/middleware';
 *
 * // Import pre-configured middleware chains
 * import { createHealthJourneyMiddlewareChain } from '@austa/database/middleware';
 */

// Core Interfaces
// These must be exported first to avoid circular dependencies
export * from './middleware.interface';

/**
 * Middleware Implementation Components
 * @description Concrete middleware implementations for various database concerns
 */

// Resilience Middleware
/**
 * Circuit Breaker Middleware
 * @description Prevents cascading failures during database outages by tracking
 * operation failures and automatically opening the circuit when failure thresholds
 * are exceeded.
 */
export * from './circuit-breaker.middleware';

// Data Transformation Middleware
/**
 * Transformation Middleware
 * @description Modifies database operations before execution to optimize performance
 * and implement cross-cutting concerns like soft deletion, multi-tenancy, and
 * automatic index utilization.
 */
export * from './transformation.middleware';

// Observability Middleware
/**
 * Performance Monitoring Middleware
 * @description Tracks query execution times, identifies slow queries, and collects
 * metrics for observability dashboards. Automatically detects performance degradation
 * patterns and provides query optimization suggestions.
 */
export * from './performance.middleware';

/**
 * Query Logging Middleware
 * @description Captures and logs database operations with configurable detail levels.
 * Integrates with the application's structured logging system and automatically
 * redacts sensitive information for data privacy compliance.
 */
export * from './logging.middleware';

/**
 * Middleware Infrastructure Components
 * @description Components for managing and creating middleware instances
 */

// Middleware Management
/**
 * Middleware Registry
 * @description Maintains a registry of middleware instances and configurations,
 * allowing for centralized management and dynamic updates at runtime.
 */
export * from './middleware.registry';

/**
 * Middleware Factory
 * @description Creates and configures middleware instances for database operations.
 * Provides methods for creating standard middleware chains optimized for different
 * journey services and operation types.
 */
export * from './middleware.factory';

/**
 * Default Middleware Configurations
 * @description Pre-configured middleware chains for common use cases across
 * different journey services. These chains are optimized for specific journey
 * requirements and operation patterns.
 */
export { 
  createDefaultMiddlewareChain,
  createHealthJourneyMiddlewareChain,
  createCareJourneyMiddlewareChain,
  createPlanJourneyMiddlewareChain,
  createGamificationMiddlewareChain,
} from './middleware.factory';

/**
 * Middleware Types
 * @description Enumeration of middleware types for consistent identification
 * and configuration across the application.
 */
export const MIDDLEWARE_TYPES = {
  CIRCUIT_BREAKER: 'circuit-breaker',
  TRANSFORMATION: 'transformation',
  PERFORMANCE: 'performance',
  LOGGING: 'logging',
  VALIDATION: 'validation',
  CACHING: 'caching',
  TRANSACTION: 'transaction',
  AUDIT: 'audit',
} as const;

/**
 * Middleware Type
 * @description Type definition for middleware type values
 */
export type MiddlewareType = typeof MIDDLEWARE_TYPES[keyof typeof MIDDLEWARE_TYPES];

/**
 * Middleware Priority Levels
 * @description Priority levels for middleware execution order.
 * Lower numbers execute earlier in the pipeline.
 */
export const MIDDLEWARE_PRIORITY = {
  HIGHEST: 0,   // First to execute (e.g., circuit breaker)
  HIGH: 25,     // Early execution (e.g., validation)
  NORMAL: 50,   // Standard execution (e.g., transformation)
  LOW: 75,      // Late execution (e.g., logging)
  LOWEST: 100,  // Last to execute (e.g., performance metrics)
} as const;

/**
 * Middleware Priority
 * @description Type definition for middleware priority values
 */
export type MiddlewarePriority = typeof MIDDLEWARE_PRIORITY[keyof typeof MIDDLEWARE_PRIORITY];

/**
 * Journey Types
 * @description Enumeration of journey types for journey-specific middleware configuration
 */
export const JOURNEY_TYPES = {
  HEALTH: 'health',
  CARE: 'care',
  PLAN: 'plan',
  GAMIFICATION: 'gamification',
} as const;

/**
 * Journey Type
 * @description Type definition for journey type values
 */
export type JourneyType = typeof JOURNEY_TYPES[keyof typeof JOURNEY_TYPES];

/**
 * Middleware Configuration
 * @description Configuration options for middleware components
 */
export interface MiddlewareConfig {
  enabled: boolean;
  priority: MiddlewarePriority;
  options?: Record<string, unknown>;
}

/**
 * Default export for convenient access to commonly used middleware components
 */
export default {
  types: MIDDLEWARE_TYPES,
  priorities: MIDDLEWARE_PRIORITY,
  journeys: JOURNEY_TYPES,
  createDefaultMiddlewareChain,
};