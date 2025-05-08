/**
 * Core interfaces for database middleware components
 */

/**
 * Context information for database operations
 */
export interface MiddlewareContext {
  /**
   * Type of database operation being performed
   */
  operationType: string;
  
  /**
   * Name of the entity being operated on
   */
  entityName?: string;
  
  /**
   * Journey context for the operation
   */
  journeyContext?: string;
  
  /**
   * User ID performing the operation
   */
  userId?: string;
  
  /**
   * Request ID for tracing
   */
  requestId?: string;
  
  /**
   * Additional metadata for the operation
   */
  metadata?: Record<string, any>;
}

/**
 * Base interface for all database middleware
 */
export interface DatabaseMiddleware {
  /**
   * Hook executed before a database operation
   * 
   * @param params Operation parameters
   * @param context Operation context
   * @returns Modified parameters or original parameters
   */
  beforeExecute?<T>(params: T, context: MiddlewareContext): Promise<T> | T;
  
  /**
   * Hook executed after a database operation
   * 
   * @param result Operation result
   * @param context Operation context
   * @returns Modified result or original result
   */
  afterExecute?<T>(result: T, context: MiddlewareContext): Promise<T> | T;
  
  /**
   * Hook executed when a database operation fails
   * 
   * @param error Error that occurred
   * @param context Operation context
   * @returns Modified error or original error
   */
  onError?(error: Error, context: MiddlewareContext): Promise<Error> | Error;
}

/**
 * Interface for logging middleware
 */
export interface LoggingMiddleware extends DatabaseMiddleware {
  /**
   * Configure logging level
   */
  setLogLevel(level: string): void;
  
  /**
   * Configure sensitive fields to be redacted
   */
  setSensitiveFields(fields: string[]): void;
}

/**
 * Interface for performance monitoring middleware
 */
export interface PerformanceMiddleware extends DatabaseMiddleware {
  /**
   * Configure slow query threshold
   */
  setSlowQueryThreshold(thresholdMs: number): void;
  
  /**
   * Get performance metrics
   */
  getMetrics(): Record<string, any>;
}

/**
 * Interface for transformation middleware
 */
export interface TransformationMiddleware extends DatabaseMiddleware {
  /**
   * Add a transformation rule
   */
  addTransformation(rule: TransformationRule): void;
  
  /**
   * Remove a transformation rule
   */
  removeTransformation(ruleId: string): void;
}

/**
 * Interface for a transformation rule
 */
export interface TransformationRule {
  /**
   * Unique identifier for the rule
   */
  id: string;
  
  /**
   * Entity types this rule applies to
   */
  entityTypes: string[];
  
  /**
   * Operation types this rule applies to
   */
  operationTypes: string[];
  
  /**
   * Priority of the rule (higher numbers run first)
   */
  priority: number;
  
  /**
   * Journey contexts this rule applies to (optional)
   * Use 'health', 'care', or 'plan' to target specific journeys,
   * or '*' to apply to all journeys
   */
  journeyContexts?: string[];
  
  /**
   * Transformation function for parameters
   */
  transform<T>(params: T, context: MiddlewareContext): Promise<T> | T;
}

/**
 * Interface for circuit breaker middleware
 */
export interface CircuitBreakerMiddleware extends DatabaseMiddleware {
  /**
   * Execute an operation with circuit breaker protection
   */
  executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    operationType: string,
    journeyContext?: string,
  ): Promise<T>;
  
  /**
   * Get the current state of the circuit
   */
  getState(): string;
  
  /**
   * Reset the circuit breaker to closed state
   */
  reset(): void;
}