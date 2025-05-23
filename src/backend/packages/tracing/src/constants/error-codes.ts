/**
 * Error code constants for tracing operations.
 * These constants are used for consistent error reporting and logging
 * throughout the tracing implementation.
 */

/**
 * Tracer initialization error codes
 */
export const TRACER_INITIALIZATION_FAILED = 'TRACING-1000';
export const TRACER_PROVIDER_NOT_FOUND = 'TRACING-1001';
export const TRACER_CONFIGURATION_INVALID = 'TRACING-1002';
export const TRACER_SERVICE_NAME_MISSING = 'TRACING-1003';
export const TRACER_ALREADY_INITIALIZED = 'TRACING-1004';

/**
 * Span creation and management error codes
 */
export const SPAN_CREATION_FAILED = 'TRACING-2000';
export const SPAN_ALREADY_ENDED = 'TRACING-2001';
export const SPAN_CONTEXT_INVALID = 'TRACING-2002';
export const SPAN_ATTRIBUTE_INVALID = 'TRACING-2003';
export const SPAN_EVENT_CREATION_FAILED = 'TRACING-2004';
export const SPAN_LINK_INVALID = 'TRACING-2005';

/**
 * Context propagation error codes
 */
export const CONTEXT_EXTRACTION_FAILED = 'TRACING-3000';
export const CONTEXT_INJECTION_FAILED = 'TRACING-3001';
export const CONTEXT_INVALID = 'TRACING-3002';
export const CONTEXT_PROPAGATION_FAILED = 'TRACING-3003';

/**
 * Exporter error codes
 */
export const EXPORTER_INITIALIZATION_FAILED = 'TRACING-4000';
export const EXPORTER_CONFIGURATION_INVALID = 'TRACING-4001';
export const EXPORTER_EXPORT_FAILED = 'TRACING-4002';
export const EXPORTER_SHUTDOWN_FAILED = 'TRACING-4003';

/**
 * Resource error codes
 */
export const RESOURCE_CREATION_FAILED = 'TRACING-5000';
export const RESOURCE_ATTRIBUTE_INVALID = 'TRACING-5001';
export const RESOURCE_DETECTION_FAILED = 'TRACING-5002';

/**
 * Journey-specific error codes
 */
export const JOURNEY_CONTEXT_INVALID = 'TRACING-6000';
export const JOURNEY_ATTRIBUTE_INVALID = 'TRACING-6001';
export const JOURNEY_CORRELATION_FAILED = 'TRACING-6002';

/**
 * Sampling error codes
 */
export const SAMPLER_INITIALIZATION_FAILED = 'TRACING-7000';
export const SAMPLER_CONFIGURATION_INVALID = 'TRACING-7001';
export const SAMPLING_DECISION_FAILED = 'TRACING-7002';

/**
 * General error codes
 */
export const UNKNOWN_ERROR = 'TRACING-9000';
export const CONFIGURATION_ERROR = 'TRACING-9001';
export const DEPENDENCY_ERROR = 'TRACING-9002';
export const VALIDATION_ERROR = 'TRACING-9003';