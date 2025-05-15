/**
 * Error code constants for tracing operations.
 * 
 * These constants provide standardized error codes for consistent error reporting
 * and logging throughout the tracing implementation. Each error code follows the
 * format TRACING_[CATEGORY]_[DESCRIPTION] for easy identification and categorization.
 */

/**
 * Error codes related to tracer initialization and configuration.
 */
export const TRACER_INITIALIZATION_ERROR = 'TRACING_INIT_FAILED';
export const TRACER_CONFIGURATION_ERROR = 'TRACING_CONFIG_INVALID';
export const TRACER_PROVIDER_NOT_FOUND = 'TRACING_PROVIDER_NOT_FOUND';
export const TRACER_SERVICE_NAME_MISSING = 'TRACING_SERVICE_NAME_MISSING';
export const TRACER_EXPORTER_ERROR = 'TRACING_EXPORTER_FAILED';

/**
 * Error codes related to span operations.
 */
export const SPAN_CREATION_ERROR = 'TRACING_SPAN_CREATION_FAILED';
export const SPAN_RECORDING_ERROR = 'TRACING_SPAN_RECORDING_FAILED';
export const SPAN_ENDING_ERROR = 'TRACING_SPAN_ENDING_FAILED';
export const SPAN_ATTRIBUTE_ERROR = 'TRACING_SPAN_ATTRIBUTE_INVALID';
export const SPAN_EVENT_ERROR = 'TRACING_SPAN_EVENT_FAILED';

/**
 * Error codes related to context propagation.
 */
export const CONTEXT_EXTRACTION_ERROR = 'TRACING_CONTEXT_EXTRACTION_FAILED';
export const CONTEXT_INJECTION_ERROR = 'TRACING_CONTEXT_INJECTION_FAILED';
export const CONTEXT_INVALID_ERROR = 'TRACING_CONTEXT_INVALID';
export const CONTEXT_MISSING_ERROR = 'TRACING_CONTEXT_MISSING';

/**
 * Error codes related to journey-specific tracing.
 */
export const JOURNEY_CONTEXT_ERROR = 'TRACING_JOURNEY_CONTEXT_INVALID';
export const JOURNEY_ATTRIBUTE_ERROR = 'TRACING_JOURNEY_ATTRIBUTE_INVALID';
export const JOURNEY_CORRELATION_ERROR = 'TRACING_JOURNEY_CORRELATION_FAILED';

/**
 * Error codes related to general tracing operations.
 */
export const TRACING_DISABLED_ERROR = 'TRACING_DISABLED';
export const TRACING_SAMPLING_ERROR = 'TRACING_SAMPLING_FAILED';
export const TRACING_RESOURCE_ERROR = 'TRACING_RESOURCE_INVALID';
export const TRACING_PROPAGATOR_ERROR = 'TRACING_PROPAGATOR_FAILED';

/**
 * Error codes related to external system integration.
 */
export const EXTERNAL_SYSTEM_TRACING_ERROR = 'TRACING_EXTERNAL_SYSTEM_FAILED';
export const EXTERNAL_CONTEXT_PROPAGATION_ERROR = 'TRACING_EXTERNAL_CONTEXT_FAILED';

/**
 * Error codes related to performance and resource constraints.
 */
export const TRACING_RATE_LIMIT_EXCEEDED = 'TRACING_RATE_LIMIT_EXCEEDED';
export const TRACING_RESOURCE_EXHAUSTED = 'TRACING_RESOURCE_EXHAUSTED';

/**
 * Error codes related to OpenTelemetry status codes.
 * These map to the standard OpenTelemetry status codes for spans.
 */
export const OTEL_STATUS_UNSET = 'TRACING_STATUS_UNSET';
export const OTEL_STATUS_OK = 'TRACING_STATUS_OK';
export const OTEL_STATUS_ERROR = 'TRACING_STATUS_ERROR';