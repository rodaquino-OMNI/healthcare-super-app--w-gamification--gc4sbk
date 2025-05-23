/**
 * Configuration key constants used by the tracing package.
 * These keys are used to retrieve values from environment variables or config files.
 * Centralizing these keys ensures consistent configuration access throughout the application.
 */

/**
 * Namespace for tracing configuration keys to avoid conflicts with other configuration keys.
 */
export const TRACING_CONFIG_NAMESPACE = 'tracing';

/**
 * Configuration key for the service name used in traces.
 * This is used to identify the service in distributed traces.
 */
export const SERVICE_NAME_KEY = 'service.name';

/**
 * Configuration key for the tracing enabled flag.
 * This determines whether tracing is enabled for the service.
 */
export const TRACING_ENABLED_KEY = `${TRACING_CONFIG_NAMESPACE}.enabled`;

/**
 * Configuration key for the sampling rate.
 * This determines what percentage of traces are sampled and exported.
 * Value should be between 0.0 and 1.0.
 */
export const SAMPLING_RATE_KEY = `${TRACING_CONFIG_NAMESPACE}.sampling.rate`;

/**
 * Configuration key for the exporter type.
 * Supported values: 'jaeger', 'zipkin', 'otlp', 'console'.
 */
export const EXPORTER_TYPE_KEY = `${TRACING_CONFIG_NAMESPACE}.exporter.type`;

/**
 * Configuration key for the exporter endpoint.
 * This is the URL where traces will be sent.
 */
export const EXPORTER_ENDPOINT_KEY = `${TRACING_CONFIG_NAMESPACE}.exporter.endpoint`;

/**
 * Configuration key for the maximum number of attributes per span.
 * This limits the number of attributes that can be added to a span.
 */
export const MAX_ATTRIBUTES_PER_SPAN_KEY = `${TRACING_CONFIG_NAMESPACE}.span.maxAttributes`;

/**
 * Configuration key for the maximum number of events per span.
 * This limits the number of events that can be added to a span.
 */
export const MAX_EVENTS_PER_SPAN_KEY = `${TRACING_CONFIG_NAMESPACE}.span.maxEvents`;

/**
 * Configuration key for the maximum number of links per span.
 * This limits the number of links that can be added to a span.
 */
export const MAX_LINKS_PER_SPAN_KEY = `${TRACING_CONFIG_NAMESPACE}.span.maxLinks`;

/**
 * Configuration key for the journey context propagation.
 * This determines whether journey context is propagated in traces.
 */
export const JOURNEY_CONTEXT_ENABLED_KEY = `${TRACING_CONFIG_NAMESPACE}.journeyContext.enabled`;

/**
 * Configuration keys for specific journey tracing settings.
 * These keys are used to configure tracing for specific journeys.
 */
export const JOURNEY_TRACING_KEYS = {
  HEALTH: `${TRACING_CONFIG_NAMESPACE}.journey.health`,
  CARE: `${TRACING_CONFIG_NAMESPACE}.journey.care`,
  PLAN: `${TRACING_CONFIG_NAMESPACE}.journey.plan`,
};

/**
 * Configuration key for the logger context used in trace logging.
 * This determines the logger context used when logging trace information.
 */
export const LOGGER_CONTEXT_KEY = `${TRACING_CONFIG_NAMESPACE}.logger.context`;