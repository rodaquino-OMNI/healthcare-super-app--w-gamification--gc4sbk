/**
 * Standard Kafka message header keys used for event metadata across the AUSTA SuperApp.
 * These headers provide critical context for event processing, including correlation IDs
 * for distributed tracing, version information for schema evolution, and origin service details.
 */

/**
 * Tracing headers for distributed tracing and request correlation.
 * Used to track events across multiple services and maintain context.
 */
export const TRACING_HEADERS = {
  /** Unique identifier for correlating events across services */
  CORRELATION_ID: 'x-correlation-id',
  /** Unique identifier for the trace this event belongs to */
  TRACE_ID: 'x-trace-id',
  /** Identifier for the span within the trace */
  SPAN_ID: 'x-span-id',
  /** Parent span identifier for nested spans */
  PARENT_SPAN_ID: 'x-parent-span-id',
  /** Sampling decision for tracing (1 = trace, 0 = don't trace) */
  SAMPLED: 'x-sampled',
};

/**
 * Versioning headers for schema evolution and backward compatibility.
 * Used to ensure proper message deserialization and handling across different versions.
 */
export const VERSION_HEADERS = {
  /** Schema version of the event payload */
  SCHEMA_VERSION: 'x-schema-version',
  /** API version used to generate the event */
  API_VERSION: 'x-api-version',
  /** Format of the message payload (e.g., 'json', 'avro') */
  CONTENT_TYPE: 'x-content-type',
  /** Encoding of the message payload (e.g., 'utf-8') */
  CONTENT_ENCODING: 'x-content-encoding',
};

/**
 * Source headers for event provenance and origin tracking.
 * Used to identify the source of events for routing and processing.
 */
export const SOURCE_HEADERS = {
  /** Name of the service that produced the event */
  SERVICE_NAME: 'x-source-service',
  /** Timestamp when the event was produced (ISO-8601 format) */
  TIMESTAMP: 'x-source-timestamp',
  /** Hostname or instance ID of the producer */
  HOST: 'x-source-host',
  /** Environment the event was produced in (e.g., 'production', 'staging') */
  ENVIRONMENT: 'x-source-environment',
  /** User or system that triggered the event */
  INITIATOR: 'x-source-initiator',
};

/**
 * Delivery headers for message routing and processing guarantees.
 * Used to control how events are processed and retried.
 */
export const DELIVERY_HEADERS = {
  /** Priority level for processing (higher values = higher priority) */
  PRIORITY: 'x-priority',
  /** Number of times this event has been retried */
  RETRY_COUNT: 'x-retry-count',
  /** Maximum number of retries allowed for this event */
  MAX_RETRIES: 'x-max-retries',
  /** Timestamp after which the event should be considered expired */
  EXPIRATION: 'x-expiration',
  /** Delay in milliseconds before processing this event */
  DELAY_MS: 'x-delay-ms',
  /** Whether the event is a retry of a previously failed event */
  IS_RETRY: 'x-is-retry',
  /** Reason for the last processing failure */
  FAILURE_REASON: 'x-failure-reason',
};

/**
 * Journey context headers for appropriate event routing and processing.
 * Used to associate events with specific user journeys and contexts.
 */
export const JOURNEY_HEADERS = {
  /** Type of journey (e.g., 'health', 'care', 'plan') */
  JOURNEY_TYPE: 'x-journey-type',
  /** Specific journey context or state */
  JOURNEY_CONTEXT: 'x-journey-context',
  /** User ID associated with the journey */
  USER_ID: 'x-user-id',
  /** Session ID for the user interaction */
  SESSION_ID: 'x-session-id',
  /** Device type that originated the journey event */
  DEVICE_TYPE: 'x-device-type',
};

/**
 * Aggregated export of all header constants for convenience.
 */
export const KAFKA_HEADERS = {
  ...TRACING_HEADERS,
  ...VERSION_HEADERS,
  ...SOURCE_HEADERS,
  ...DELIVERY_HEADERS,
  ...JOURNEY_HEADERS,
};