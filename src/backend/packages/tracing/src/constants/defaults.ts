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
 * Following OpenTelemetry best practices, unnamed spans should have a descriptive default name.
 */
export const DEFAULT_SPAN_NAME = 'unnamed-span';

/**
 * Default logger context used for tracing-related log messages.
 * This standardizes the context for all tracing logs across the application.
 */
export const DEFAULT_LOGGER_CONTEXT = 'AustaTracing';

/**
 * Default sampling rate for traces when not explicitly configured.
 * 1.0 means 100% of traces are sampled.
 */
export const DEFAULT_SAMPLING_RATE = 1.0;

/**
 * Default maximum number of retry attempts for trace export operations.
 */
export const DEFAULT_EXPORT_RETRY_ATTEMPTS = 3;

/**
 * Default timeout in milliseconds for tracing operations.
 */
export const DEFAULT_TRACING_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Default batch size for span processor.
 * Controls how many spans are batched together before being exported.
 */
export const DEFAULT_BATCH_SIZE = 512;

/**
 * Default maximum queue size for the span processor.
 * If the queue is full, spans may be dropped.
 */
export const DEFAULT_QUEUE_SIZE = 2048;

/**
 * Default schedule delay in milliseconds for the batch span processor.
 * Controls how often the processor exports spans even if the batch size isn't reached.
 */
export const DEFAULT_SCHEDULE_DELAY_MS = 5000; // 5 seconds

/**
 * Default journey context attribute name.
 * Used to associate spans with specific user journeys in the AUSTA SuperApp.
 */
export const DEFAULT_JOURNEY_CONTEXT_ATTRIBUTE = 'austa.journey.context';