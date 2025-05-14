/**
 * Base interface for all logging context types.
 * Provides common context properties that are essential for proper log aggregation and analysis.
 */
export interface LoggingContext {
  /**
   * Unique identifier for distributed tracing
   */
  traceId?: string;

  /**
   * Identifier for a specific operation within a trace
   */
  spanId?: string;

  /**
   * Identifier of the parent span
   */
  parentSpanId?: string;

  /**
   * The service that generated the log
   */
  service?: string;

  /**
   * Timestamp when the context was created
   */
  timestamp?: Date;

  /**
   * Application or component name
   */
  application?: string;

  /**
   * Environment (development, staging, production)
   */
  environment?: string;

  /**
   * Version of the application
   */
  version?: string;

  /**
   * Identifier of the user associated with the context
   */
  userId?: string;

  /**
   * Additional context properties
   */
  [key: string]: any;
}