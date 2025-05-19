/**
 * Configuration keys used by the tracing package to retrieve values from environment variables or config files.
 * Centralizing these keys ensures consistent configuration access throughout the application.
 */

/**
 * Base namespace for all tracing-related configuration keys
 */
export const TRACING_CONFIG_NAMESPACE = 'tracing';

/**
 * Configuration key for the service name used in traces
 * This is used to identify the service in distributed traces
 */
export const SERVICE_NAME_CONFIG_KEY = 'service.name';

/**
 * Configuration key for enabling/disabling tracing
 */
export const TRACING_ENABLED_CONFIG_KEY = `${TRACING_CONFIG_NAMESPACE}.enabled`;

/**
 * Configuration key for the tracing sampling rate
 * Value should be between 0.0 and 1.0, where:
 * - 0.0 means no traces are sampled
 * - 1.0 means all traces are sampled
 */
export const TRACING_SAMPLING_RATE_CONFIG_KEY = `${TRACING_CONFIG_NAMESPACE}.sampling.rate`;

/**
 * Configuration key for the OpenTelemetry exporter type
 * Supported values: 'jaeger', 'zipkin', 'otlp', 'console'
 */
export const TRACING_EXPORTER_TYPE_CONFIG_KEY = `${TRACING_CONFIG_NAMESPACE}.exporter.type`;

/**
 * Configuration key for the OpenTelemetry exporter endpoint
 * This is the URL where traces will be sent
 */
export const TRACING_EXPORTER_ENDPOINT_CONFIG_KEY = `${TRACING_CONFIG_NAMESPACE}.exporter.endpoint`;

/**
 * Configuration key for the maximum number of attributes per span
 */
export const TRACING_MAX_ATTRIBUTES_CONFIG_KEY = `${TRACING_CONFIG_NAMESPACE}.span.maxAttributes`;

/**
 * Configuration key for the maximum number of events per span
 */
export const TRACING_MAX_EVENTS_CONFIG_KEY = `${TRACING_CONFIG_NAMESPACE}.span.maxEvents`;

/**
 * Configuration key for the maximum number of links per span
 */
export const TRACING_MAX_LINKS_CONFIG_KEY = `${TRACING_CONFIG_NAMESPACE}.span.maxLinks`;

/**
 * Configuration key for the journey context propagation
 * When enabled, journey-specific context will be included in traces
 */
export const TRACING_JOURNEY_CONTEXT_ENABLED_CONFIG_KEY = `${TRACING_CONFIG_NAMESPACE}.journeyContext.enabled`;

/**
 * Configuration key for the log correlation
 * When enabled, trace IDs will be included in logs for correlation
 */
export const TRACING_LOG_CORRELATION_ENABLED_CONFIG_KEY = `${TRACING_CONFIG_NAMESPACE}.logCorrelation.enabled`;