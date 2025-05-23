/**
 * Default values used throughout the tracing package.
 * These defaults ensure tracing works correctly even with minimal configuration.
 */

/**
 * Default service name used when no service name is provided in configuration.
 * This ensures traces are properly attributed even without explicit configuration.
 */
export const DEFAULT_SERVICE_NAME = 'austa-service';

/**
 * Default span name used for unnamed spans.
 * Following OpenTelemetry conventions, unnamed spans should have a descriptive default.
 */
export const DEFAULT_SPAN_NAME = 'unnamed_span';

/**
 * Default logger context used for tracing-related log messages.
 * This provides consistent logging context across the tracing implementation.
 */
export const DEFAULT_LOGGER_CONTEXT = 'AustaTracing';

/**
 * Default sampling rate when not specified in configuration.
 * 1.0 means 100% of traces are sampled.
 */
export const DEFAULT_SAMPLING_RATE = 1.0;

/**
 * Default maximum number of attributes per span.
 * This prevents spans from growing too large with excessive attributes.
 */
export const DEFAULT_MAX_ATTRIBUTES_PER_SPAN = 128;

/**
 * Default maximum number of events per span.
 * This prevents spans from growing too large with excessive events.
 */
export const DEFAULT_MAX_EVENTS_PER_SPAN = 128;

/**
 * Default maximum number of links per span.
 * This prevents spans from growing too large with excessive links.
 */
export const DEFAULT_MAX_LINKS_PER_SPAN = 128;

/**
 * Default retry attempts for tracing operations that may fail.
 * This ensures resilience in tracing operations.
 */
export const DEFAULT_RETRY_ATTEMPTS = 3;

/**
 * Default retry delay in milliseconds between retry attempts.
 * Uses exponential backoff strategy with this base value.
 */
export const DEFAULT_RETRY_DELAY_MS = 100;

/**
 * Default timeout in milliseconds for tracing operations.
 * This prevents tracing operations from blocking indefinitely.
 */
export const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Default batch size for span export operations.
 * This optimizes the export process by batching spans together.
 */
export const DEFAULT_EXPORT_BATCH_SIZE = 512;

/**
 * Default export interval in milliseconds.
 * This determines how frequently batched spans are exported.
 */
export const DEFAULT_EXPORT_INTERVAL_MS = 5000;

/**
 * Default journey context propagation setting.
 * When true, journey context is propagated in trace context.
 */
export const DEFAULT_JOURNEY_CONTEXT_ENABLED = true;

/**
 * Default journey types recognized by the tracing system.
 * These correspond to the main journeys in the AUSTA SuperApp.
 */
export const DEFAULT_JOURNEY_TYPES = {
  HEALTH: 'health',
  CARE: 'care',
  PLAN: 'plan',
};

/**
 * Default exporter type when not specified in configuration.
 * 'console' is a safe default that works in all environments.
 */
export const DEFAULT_EXPORTER_TYPE = 'console';

/**
 * Default attribute value when an attribute is required but the value is undefined.
 * This ensures consistent attribute values in traces.
 */
export const DEFAULT_ATTRIBUTE_VALUE = 'unknown';