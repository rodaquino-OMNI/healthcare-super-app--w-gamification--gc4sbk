/**
 * Default values for the tracing package.
 * These defaults ensure consistent tracing behavior across the application
 * even with minimal configuration.
 */

/**
 * Default service name used when no service name is provided.
 * This ensures traces are properly attributed even without explicit configuration.
 */
export const DEFAULT_SERVICE_NAME = 'austa-service';

/**
 * Default span name used for unnamed spans.
 * This helps identify spans that were created without explicit names.
 */
export const DEFAULT_SPAN_NAME = 'unnamed-operation';

/**
 * Default logger context used for tracing-related log messages.
 * This ensures consistent log categorization for tracing operations.
 */
export const DEFAULT_LOGGER_CONTEXT = 'AustaTracing';

/**
 * Default sampling rate for traces (1.0 = 100% of traces are sampled).
 * Can be overridden through configuration.
 */
export const DEFAULT_SAMPLING_RATE = 1.0;

/**
 * Maximum number of attributes that can be added to a span.
 * This prevents excessive memory usage from spans with too many attributes.
 */
export const MAX_SPAN_ATTRIBUTES = 128;

/**
 * Default timeout in milliseconds for span operations.
 * Used to automatically time out spans that might be left open.
 */
export const DEFAULT_SPAN_TIMEOUT_MS = 30000; // 30 seconds