import { JourneyType } from '../interfaces/log-entry.interface';

/**
 * Base interface for all logging context types in the AUSTA SuperApp.
 * Provides common context properties that are essential for proper log aggregation,
 * correlation, and analysis across all services and journeys.
 */
export interface LoggingContext {
  /**
   * Unique identifier for the request or transaction.
   * Used to correlate logs from the same request across different services.
   */
  requestId?: string;

  /**
   * Unique identifier for the user associated with the log.
   * Used for user-specific log filtering and analysis.
   */
  userId?: string;

  /**
   * Unique identifier for distributed tracing.
   * Connects logs with traces in the observability system.
   */
  traceId?: string;

  /**
   * Identifier for a specific operation within a trace.
   * Used to correlate logs with specific spans in the tracing system.
   */
  spanId?: string;

  /**
   * Identifier of the parent span.
   * Used to establish the hierarchy of operations in distributed tracing.
   */
  parentSpanId?: string;

  /**
   * Timestamp when the context was created.
   * Useful for timing analysis and log ordering.
   */
  timestamp?: Date;

  /**
   * The service that generated the log.
   * Identifies which microservice produced the log entry.
   */
  service?: string;

  /**
   * The environment in which the service is running (e.g., 'development', 'staging', 'production').
   * Used for environment-specific log filtering and analysis.
   */
  environment?: string;

  /**
   * The version of the service or application.
   * Useful for tracking issues across different versions.
   */
  version?: string;

  /**
   * The hostname of the server or container running the service.
   * Helps identify the specific instance that generated the log.
   */
  hostname?: string;

  /**
   * The journey associated with the log (health, care, plan, or cross-journey).
   * Essential for journey-specific log filtering and analysis.
   */
  journey?: JourneyType;

  /**
   * Additional context information as key-value pairs.
   * Allows for flexible extension with custom properties.
   */
  [key: string]: any;
}