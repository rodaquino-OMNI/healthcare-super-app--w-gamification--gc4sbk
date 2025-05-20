/**
 * @file Error code constants for tracing operations.
 * 
 * This file defines standardized error codes used throughout the tracing package
 * for consistent error reporting and logging. Each error code follows the format
 * 'TRACING_XXX' where XXX is a specific error identifier.
 */

/**
 * Error codes related to tracer initialization.
 */
export const TRACER_INIT_FAILED = 'TRACING_001';
export const TRACER_CONFIG_INVALID = 'TRACING_002';
export const TRACER_PROVIDER_NOT_FOUND = 'TRACING_003';

/**
 * Error codes related to span operations.
 */
export const SPAN_CREATION_FAILED = 'TRACING_101';
export const SPAN_RECORDING_FAILED = 'TRACING_102';
export const SPAN_ATTRIBUTE_INVALID = 'TRACING_103';
export const SPAN_CONTEXT_LOST = 'TRACING_104';

/**
 * Error codes related to context propagation.
 */
export const CONTEXT_PROPAGATION_FAILED = 'TRACING_201';
export const CONTEXT_EXTRACTION_FAILED = 'TRACING_202';
export const CONTEXT_INJECTION_FAILED = 'TRACING_203';

/**
 * Error codes related to exporter configuration.
 */
export const EXPORTER_INIT_FAILED = 'TRACING_301';
export const EXPORTER_CONNECTION_FAILED = 'TRACING_302';
export const EXPORTER_CONFIGURATION_INVALID = 'TRACING_303';

/**
 * Error codes related to resource detection and configuration.
 */
export const RESOURCE_DETECTION_FAILED = 'TRACING_401';
export const RESOURCE_ATTRIBUTE_INVALID = 'TRACING_402';

/**
 * Error codes related to sampling configuration.
 */
export const SAMPLER_CONFIGURATION_INVALID = 'TRACING_501';
export const SAMPLING_DECISION_FAILED = 'TRACING_502';

/**
 * Error codes related to instrumentation.
 */
export const INSTRUMENTATION_INIT_FAILED = 'TRACING_601';
export const INSTRUMENTATION_CONFLICT = 'TRACING_602';
export const INSTRUMENTATION_DISABLED = 'TRACING_603';

/**
 * Error codes related to batch processing.
 */
export const BATCH_PROCESSOR_INIT_FAILED = 'TRACING_701';
export const BATCH_PROCESSING_FAILED = 'TRACING_702';
export const BATCH_EXPORT_TIMEOUT = 'TRACING_703';

/**
 * Error codes related to shutdown operations.
 */
export const SHUTDOWN_TIMEOUT = 'TRACING_801';
export const FLUSH_FAILED = 'TRACING_802';

/**
 * Error codes related to general tracing operations.
 */
export const TRACING_DISABLED = 'TRACING_901';
export const TRACING_CONFIGURATION_INVALID = 'TRACING_902';
export const TRACING_OPERATION_FAILED = 'TRACING_999';