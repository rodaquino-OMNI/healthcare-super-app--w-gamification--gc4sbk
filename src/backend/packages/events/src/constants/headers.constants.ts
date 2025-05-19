/**
 * Standard Kafka message header keys used for event metadata across the AUSTA SuperApp.
 * These headers provide critical context for event processing, including correlation IDs
 * for distributed tracing, version information for schema evolution, and origin service details.
 */

/**
 * Headers related to distributed tracing and correlation
 * Used to track events across services and connect related operations
 */
export const TRACE_HEADERS = {
  /** Unique identifier for the entire trace across services */
  TRACE_ID: 'x-trace-id',
  /** Identifier for the specific operation that produced this event */
  SPAN_ID: 'x-span-id',
  /** Reference to the parent span for hierarchical trace relationships */
  PARENT_SPAN_ID: 'x-parent-span-id',
  /** Correlation ID for linking related events that aren't part of the same trace */
  CORRELATION_ID: 'x-correlation-id',
  /** Session identifier for grouping events from the same user session */
  SESSION_ID: 'x-session-id'
} as const;

/**
 * Headers related to event schema versioning and format
 * Used to support backward compatibility and schema evolution
 */
export const VERSION_HEADERS = {
  /** Semantic version of the event schema (major.minor.patch) */
  SCHEMA_VERSION: 'x-schema-version',
  /** Format of the event payload (json, avro, protobuf) */
  CONTENT_TYPE: 'content-type',
  /** Minimum compatible consumer version that can process this event */
  MIN_COMPATIBLE_VERSION: 'x-min-compatible-version',
  /** Flag indicating if this event uses a deprecated schema version */
  DEPRECATED: 'x-deprecated'
} as const;

/**
 * Headers related to event source and origin
 * Used to identify where and when the event was created
 */
export const SOURCE_HEADERS = {
  /** Name of the service that produced the event */
  SERVICE_NAME: 'x-source-service',
  /** Type of journey that produced the event (health, care, plan) */
  JOURNEY_TYPE: 'x-journey-type',
  /** ISO timestamp when the event was created */
  TIMESTAMP: 'x-created-at',
  /** Environment where the event was produced (dev, staging, prod) */
  ENVIRONMENT: 'x-environment',
  /** Version of the service that produced the event */
  SERVICE_VERSION: 'x-service-version'
} as const;

/**
 * Headers related to event context and routing
 * Used to provide business context and determine appropriate handlers
 */
export const CONTEXT_HEADERS = {
  /** User ID associated with this event */
  USER_ID: 'x-user-id',
  /** Type of event (e.g., health.metric.recorded, care.appointment.booked) */
  EVENT_TYPE: 'x-event-type',
  /** Specific journey instance ID if applicable */
  JOURNEY_CONTEXT_ID: 'x-journey-context-id',
  /** Tenant ID for multi-tenant deployments */
  TENANT_ID: 'x-tenant-id',
  /** Locale for internationalization context */
  LOCALE: 'x-locale'
} as const;

/**
 * Headers related to message delivery and processing
 * Used for retry logic, prioritization, and error handling
 */
export const DELIVERY_HEADERS = {
  /** Priority level for processing (high, medium, low) */
  PRIORITY: 'x-priority',
  /** Number of times this event has been retried */
  RETRY_COUNT: 'x-retry-count',
  /** Maximum number of retry attempts allowed */
  MAX_RETRIES: 'x-max-retries',
  /** Retry strategy to use (linear, exponential, custom) */
  RETRY_STRATEGY: 'x-retry-strategy',
  /** Reason for delivery to dead letter queue if applicable */
  DLQ_REASON: 'x-dlq-reason',
  /** Timestamp when the event should be processed (for delayed processing) */
  PROCESS_AT: 'x-process-at',
  /** Time-to-live in milliseconds before the event expires */
  TTL: 'x-ttl'
} as const;

/**
 * All header constants combined for convenience
 */
export const HEADERS = {
  ...TRACE_HEADERS,
  ...VERSION_HEADERS,
  ...SOURCE_HEADERS,
  ...CONTEXT_HEADERS,
  ...DELIVERY_HEADERS
} as const;

/**
 * Type representing all possible header keys
 */
export type HeaderKey = typeof HEADERS[keyof typeof HEADERS];

/**
 * Required headers that must be present on all events
 */
export const REQUIRED_HEADERS = [
  TRACE_HEADERS.TRACE_ID,
  SOURCE_HEADERS.SERVICE_NAME,
  SOURCE_HEADERS.TIMESTAMP,
  CONTEXT_HEADERS.EVENT_TYPE,
  VERSION_HEADERS.SCHEMA_VERSION
] as const;

/**
 * Headers that should be propagated when an event is processed and produces new events
 */
export const PROPAGATED_HEADERS = [
  TRACE_HEADERS.TRACE_ID,
  TRACE_HEADERS.CORRELATION_ID,
  CONTEXT_HEADERS.USER_ID,
  CONTEXT_HEADERS.TENANT_ID,
  CONTEXT_HEADERS.LOCALE,
  SOURCE_HEADERS.ENVIRONMENT
] as const;