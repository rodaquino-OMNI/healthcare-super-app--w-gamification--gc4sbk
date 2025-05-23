/**
 * Base interface for logging context in the AUSTA SuperApp.
 * Defines the common properties that all logging contexts should have,
 * establishing the foundation for structured, context-enriched logging
 * throughout the application.
 */

/**
 * Interface representing the base logging context that all other context types extend.
 * This interface specifies common context properties like correlation IDs, timestamps,
 * and service information that are essential for proper log aggregation and analysis.
 */
export interface LoggingContext {
  /**
   * Unique identifier for correlating logs, traces, and metrics across services.
   * This ID is propagated across service boundaries to enable end-to-end tracing
   * and is essential for distributed systems observability.
   */
  correlationId?: string;

  /**
   * Unique identifier for the request that generated this log.
   * Used to group logs from the same request together.
   */
  requestId?: string;

  /**
   * Unique identifier for the user associated with this log.
   * Used to track user activity and troubleshoot user-specific issues.
   */
  userId?: string;

  /**
   * Unique identifier for tracking business transactions across services.
   * A transaction may span multiple requests and services but represents
   * a single logical operation from a business perspective.
   */
  transactionId?: string;

  /**
   * Unique identifier for the user's session.
   * Used to group logs from the same user session together.
   */
  sessionId?: string;

  /**
   * Name of the service generating the log.
   * Examples: 'auth-service', 'health-service', 'care-service', 'plan-service'
   */
  serviceName?: string;

  /**
   * Name of the specific component within the service generating the log.
   * Examples: 'AuthController', 'HealthMetricsRepository', 'AppointmentService'
   */
  component?: string;

  /**
   * Deployment environment where the log was generated.
   * Examples: 'development', 'staging', 'production'
   */
  environment?: string;

  /**
   * Version of the service generating the log.
   * Useful for tracking which version of the code produced a particular log.
   */
  serviceVersion?: string;

  /**
   * Hostname of the server generating the log.
   * Useful for identifying specific instances in a distributed system.
   */
  hostname?: string;

  /**
   * Timestamp when the log was created.
   * Stored as ISO 8601 string or Date object depending on the formatter.
   */
  timestamp?: Date | string;

  /**
   * Trace ID for distributed tracing systems (like OpenTelemetry).
   * Used to correlate logs with distributed traces for detailed request flow analysis.
   */
  traceId?: string;

  /**
   * Span ID for the current operation in distributed tracing systems.
   * Represents a single operation within a trace.
   */
  spanId?: string;

  /**
   * Indicates if this is a sampled trace in distributed tracing systems.
   * Affects whether detailed trace information is collected.
   */
  traceSampled?: boolean;

  /**
   * Additional tags or labels for the log.
   * Used for filtering and categorizing logs beyond the standard fields.
   */
  tags?: string[];

  /**
   * Additional metadata as key-value pairs.
   * Can contain any context-specific information that doesn't fit in other properties.
   */
  metadata?: Record<string, any>;

  /**
   * Extensibility point for additional context properties.
   * Allows adding custom properties without modifying the interface.
   */
  [key: string]: any;
}