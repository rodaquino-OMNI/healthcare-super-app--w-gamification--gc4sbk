/**
 * Base interface for all logging context types in the AUSTA SuperApp.
 * Defines common properties that are shared across all context types.
 */

/**
 * Base interface for all logging context types.
 * This interface establishes the foundation for structured, context-enriched
 * logging throughout the application.
 */
export interface LoggingContext {
  /**
   * Unique identifier for the request
   * Used to correlate logs from the same request
   */
  requestId?: string;

  /**
   * Unique identifier for correlation across services
   * Used to track a request as it flows through multiple services
   */
  correlationId?: string;

  /**
   * Unique identifier for the user
   * Used to associate logs with a specific user
   */
  userId?: string;

  /**
   * Unique identifier for the user session
   * Used to group logs from the same user session
   */
  sessionId?: string;

  /**
   * The name of the service generating the log
   * Identifies which service is the source of the log
   */
  serviceName?: string;

  /**
   * The specific component within the service
   * Provides more granular context about the log source
   */
  component?: string;

  /**
   * The environment where the log was generated
   * (e.g., development, staging, production)
   */
  environment?: string;

  /**
   * Timestamp when the context was created
   * Useful for measuring duration of operations
   */
  timestamp?: Date;

  /**
   * Unique identifier for the trace (for distributed tracing)
   * Used to correlate logs with traces in observability systems
   */
  traceId?: string;

  /**
   * Unique identifier for the span within a trace
   * Provides more granular context within a trace
   */
  spanId?: string;

  /**
   * Identifier of the parent span
   * Establishes the hierarchy of spans within a trace
   */
  parentSpanId?: string;

  /**
   * Additional metadata as key-value pairs
   * Can contain any context-specific data that doesn't fit in other properties
   */
  metadata?: Record<string, any>;
}