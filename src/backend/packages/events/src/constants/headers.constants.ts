/**
 * Standard Kafka message header keys used for event metadata across the healthcare super app.
 * These headers provide critical context for event processing, including correlation IDs for
 * distributed tracing, version information for schema evolution, and origin service details.
 */

/**
 * Headers related to distributed tracing and request correlation.
 * These headers enable tracking events across services and correlating related operations.
 */
export const TRACING_HEADERS = {
  /** Unique identifier for correlating events across services */
  CORRELATION_ID: 'x-correlation-id',
  /** Trace ID for distributed tracing systems (OpenTelemetry, Jaeger, etc.) */
  TRACE_ID: 'x-trace-id',
  /** Span ID for the current operation in a distributed trace */
  SPAN_ID: 'x-span-id',
  /** Parent span ID for establishing trace hierarchy */
  PARENT_SPAN_ID: 'x-parent-span-id',
  /** Sampling decision for trace collection */
  TRACE_SAMPLED: 'x-trace-sampled',
  /** Trace flags for additional tracing metadata */
  TRACE_FLAGS: 'x-trace-flags',
};

/**
 * Headers related to event versioning and schema evolution.
 * These headers support backward compatibility and schema validation.
 */
export const VERSION_HEADERS = {
  /** Schema version of the event payload */
  SCHEMA_VERSION: 'x-schema-version',
  /** Event type version for handling different versions of the same event type */
  EVENT_VERSION: 'x-event-version',
  /** Content type of the event payload (e.g., application/json, avro/binary) */
  CONTENT_TYPE: 'content-type',
};

/**
 * Headers related to event source and provenance.
 * These headers provide information about the origin of events.
 */
export const SOURCE_HEADERS = {
  /** Service that produced the event */
  SOURCE_SERVICE: 'x-source-service',
  /** Timestamp when the event was produced */
  CREATED_AT: 'x-created-at',
  /** User or system that triggered the event */
  CREATED_BY: 'x-created-by',
  /** Environment where the event was produced (dev, staging, prod) */
  SOURCE_ENV: 'x-source-env',
};

/**
 * Headers related to event delivery and processing.
 * These headers control how events are processed and retried.
 */
export const DELIVERY_HEADERS = {
  /** Priority level for event processing (high, medium, low) */
  PRIORITY: 'x-priority',
  /** Number of retry attempts for this event */
  RETRY_COUNT: 'x-retry-count',
  /** Maximum number of retry attempts allowed */
  MAX_RETRIES: 'x-max-retries',
  /** Timestamp after which the event should be considered expired */
  EXPIRES_AT: 'x-expires-at',
  /** Backoff strategy for retries (fixed, exponential) */
  RETRY_BACKOFF: 'x-retry-backoff',
  /** Delay in milliseconds before the next retry attempt */
  RETRY_DELAY: 'x-retry-delay',
};

/**
 * Headers related to journey context for the healthcare super app.
 * These headers provide context for routing events to appropriate journey services.
 */
export const JOURNEY_HEADERS = {
  /** Journey type (health, care, plan) */
  JOURNEY_TYPE: 'x-journey-type',
  /** Journey context ID for correlating events within a journey */
  JOURNEY_CONTEXT_ID: 'x-journey-context-id',
  /** User ID associated with the journey */
  USER_ID: 'x-user-id',
  /** Session ID for the current user session */
  SESSION_ID: 'x-session-id',
};

/**
 * All standard Kafka header keys combined.
 * Use this object to access any standard header key.
 */
export const KAFKA_HEADERS = {
  ...TRACING_HEADERS,
  ...VERSION_HEADERS,
  ...SOURCE_HEADERS,
  ...DELIVERY_HEADERS,
  ...JOURNEY_HEADERS,
};

/**
 * Type definition for Kafka header values.
 * All header values are stored as strings in Kafka.
 */
export type KafkaHeaderValue = string;

/**
 * Interface for a complete set of Kafka headers.
 */
export interface KafkaHeaders {
  [key: string]: KafkaHeaderValue;
}