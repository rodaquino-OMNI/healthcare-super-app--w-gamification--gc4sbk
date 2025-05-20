/**
 * Base interface for all logging contexts in the AUSTA SuperApp.
 * Provides common properties that are included in all log entries for proper
 * correlation, aggregation, and analysis.
 *
 * This interface serves as the foundation for more specific context types
 * like RequestContext, UserContext, and JourneyContext.
 */
export interface LoggingContext {
  /**
   * Unique identifier that correlates logs, traces, and metrics across service boundaries.
   * This ID is propagated through the entire request lifecycle and enables end-to-end
   * request tracking and visualization.
   */
  correlationId: string;

  /**
   * ISO 8601 timestamp when the log entry was created.
   * Format: YYYY-MM-DDTHH:mm:ss.sssZ
   */
  timestamp: string;

  /**
   * Name of the service generating the log entry.
   * Examples: 'api-gateway', 'auth-service', 'health-service'
   */
  serviceName: string;

  /**
   * Identifier for the specific service instance.
   * Useful in distributed environments with multiple instances of the same service.
   */
  serviceInstanceId?: string;

  /**
   * Name of the application or system component.
   * Examples: 'backend', 'mobile-app', 'web-app'
   */
  applicationName: string;

  /**
   * Current environment where the application is running.
   * Examples: 'development', 'staging', 'production'
   */
  environment: string;

  /**
   * Application version, typically following semantic versioning.
   * Format: MAJOR.MINOR.PATCH (e.g., '1.2.3')
   */
  version: string;

  /**
   * Optional trace ID from the distributed tracing system.
   * When present, allows direct correlation between logs and traces.
   */
  traceId?: string;

  /**
   * Optional span ID from the distributed tracing system.
   * When present, identifies the specific operation within a trace.
   */
  spanId?: string;

  /**
   * Optional parent span ID for nested operations.
   * Enables hierarchical visualization of operations.
   */
  parentSpanId?: string;

  /**
   * Optional journey identifier.
   * Indicates which journey (Health, Care, Plan) the log is associated with.
   */
  journeyType?: 'health' | 'care' | 'plan' | 'cross-journey';

  /**
   * Optional user identifier.
   * When present, allows filtering logs by specific user.
   */
  userId?: string;

  /**
   * Optional request identifier for HTTP requests.
   * Enables correlation of all logs related to a single HTTP request.
   */
  requestId?: string;

  /**
   * Optional session identifier.
   * Enables tracking of user sessions across multiple requests.
   */
  sessionId?: string;

  /**
   * Additional context properties that don't fit into the standard fields.
   * Allows for extensibility without modifying the interface.
   */
  [key: string]: any;
}