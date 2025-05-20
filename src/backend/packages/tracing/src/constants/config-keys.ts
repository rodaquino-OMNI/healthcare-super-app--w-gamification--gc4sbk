/**
 * @file Configuration key constants for the tracing package.
 * 
 * This file defines standardized configuration keys used throughout the tracing package
 * to retrieve values from environment variables or configuration files. Centralizing these
 * keys ensures consistent configuration access throughout the application.
 */

/**
 * Base namespace for all tracing-related configuration keys.
 */
const TRACING_NAMESPACE = 'tracing';

/**
 * Service configuration keys.
 */
export const SERVICE = {
  /**
   * Key for the service name used in traces.
   * This is used to identify the service in distributed traces.
   */
  NAME: `${TRACING_NAMESPACE}.service.name`,
  
  /**
   * Key for the service version used in traces.
   * This is used to identify the version of the service in distributed traces.
   */
  VERSION: `${TRACING_NAMESPACE}.service.version`,
  
  /**
   * Key for the service environment used in traces.
   * This is used to identify the environment (e.g., production, staging) in distributed traces.
   */
  ENVIRONMENT: `${TRACING_NAMESPACE}.service.environment`,
};

/**
 * Exporter configuration keys.
 */
export const EXPORTER = {
  /**
   * Key for the exporter type configuration.
   * Supported values: 'jaeger', 'zipkin', 'otlp', 'console', 'none'
   */
  TYPE: `${TRACING_NAMESPACE}.exporter.type`,
  
  /**
   * Key for the exporter endpoint configuration.
   * This is the URL where traces will be sent.
   */
  ENDPOINT: `${TRACING_NAMESPACE}.exporter.endpoint`,
  
  /**
   * Key for the exporter headers configuration.
   * These are additional headers to include when sending traces to the endpoint.
   */
  HEADERS: `${TRACING_NAMESPACE}.exporter.headers`,
  
  /**
   * Key for the exporter timeout configuration in milliseconds.
   */
  TIMEOUT: `${TRACING_NAMESPACE}.exporter.timeout`,
};

/**
 * Sampling configuration keys.
 */
export const SAMPLING = {
  /**
   * Key for the sampling ratio configuration.
   * Value between 0.0 and 1.0 representing the percentage of traces to sample.
   */
  RATIO: `${TRACING_NAMESPACE}.sampling.ratio`,
  
  /**
   * Key for the sampling strategy configuration.
   * Supported values: 'always', 'never', 'probability', 'parentbased'
   */
  STRATEGY: `${TRACING_NAMESPACE}.sampling.strategy`,
};

/**
 * Resource attribute configuration keys.
 */
export const RESOURCE = {
  /**
   * Key for additional resource attributes to include in all spans.
   * This should be a JSON string of key-value pairs.
   */
  ATTRIBUTES: `${TRACING_NAMESPACE}.resource.attributes`,
  
  /**
   * Key for enabling or disabling automatic resource detection.
   */
  AUTO_DETECT: `${TRACING_NAMESPACE}.resource.autoDetect`,
};

/**
 * Batch processor configuration keys.
 */
export const BATCH_PROCESSOR = {
  /**
   * Key for the maximum batch size configuration.
   * This is the maximum number of spans to include in a batch.
   */
  MAX_BATCH_SIZE: `${TRACING_NAMESPACE}.batchProcessor.maxBatchSize`,
  
  /**
   * Key for the maximum export batch size configuration.
   * This is the maximum number of spans to export in a single batch.
   */
  MAX_EXPORT_BATCH_SIZE: `${TRACING_NAMESPACE}.batchProcessor.maxExportBatchSize`,
  
  /**
   * Key for the export timeout configuration in milliseconds.
   * This is the maximum time to wait for a batch to be exported.
   */
  EXPORT_TIMEOUT: `${TRACING_NAMESPACE}.batchProcessor.exportTimeout`,
  
  /**
   * Key for the schedule delay configuration in milliseconds.
   * This is the delay between two consecutive exports.
   */
  SCHEDULE_DELAY: `${TRACING_NAMESPACE}.batchProcessor.scheduleDelay`,
};

/**
 * Journey-specific configuration keys.
 */
export const JOURNEY = {
  /**
   * Key for enabling or disabling health journey tracing.
   */
  HEALTH_ENABLED: `${TRACING_NAMESPACE}.journey.health.enabled`,
  
  /**
   * Key for enabling or disabling care journey tracing.
   */
  CARE_ENABLED: `${TRACING_NAMESPACE}.journey.care.enabled`,
  
  /**
   * Key for enabling or disabling plan journey tracing.
   */
  PLAN_ENABLED: `${TRACING_NAMESPACE}.journey.plan.enabled`,
  
  /**
   * Key for health journey sampling ratio configuration.
   * Value between 0.0 and 1.0 representing the percentage of health journey traces to sample.
   */
  HEALTH_SAMPLING_RATIO: `${TRACING_NAMESPACE}.journey.health.samplingRatio`,
  
  /**
   * Key for care journey sampling ratio configuration.
   * Value between 0.0 and 1.0 representing the percentage of care journey traces to sample.
   */
  CARE_SAMPLING_RATIO: `${TRACING_NAMESPACE}.journey.care.samplingRatio`,
  
  /**
   * Key for plan journey sampling ratio configuration.
   * Value between 0.0 and 1.0 representing the percentage of plan journey traces to sample.
   */
  PLAN_SAMPLING_RATIO: `${TRACING_NAMESPACE}.journey.plan.samplingRatio`,
};

/**
 * General tracing configuration keys.
 */
export const GENERAL = {
  /**
   * Key for enabling or disabling tracing globally.
   */
  ENABLED: `${TRACING_NAMESPACE}.enabled`,
  
  /**
   * Key for the log level for tracing operations.
   * Supported values: 'debug', 'info', 'warn', 'error'
   */
  LOG_LEVEL: `${TRACING_NAMESPACE}.logLevel`,
  
  /**
   * Key for enabling or disabling trace context propagation.
   */
  CONTEXT_PROPAGATION_ENABLED: `${TRACING_NAMESPACE}.contextPropagation.enabled`,
};

/**
 * Aggregated configuration keys for the tracing package.
 * This is the main export that should be used by consumers of this file.
 */
export const CONFIG_KEYS = {
  /**
   * Key for the service name used in traces.
   * This is used to identify the service in distributed traces.
   * @deprecated Use SERVICE.NAME instead for better organization.
   */
  SERVICE_NAME: SERVICE.NAME,
  
  /**
   * All service-related configuration keys.
   */
  SERVICE,
  
  /**
   * All exporter-related configuration keys.
   */
  EXPORTER,
  
  /**
   * All sampling-related configuration keys.
   */
  SAMPLING,
  
  /**
   * All resource-related configuration keys.
   */
  RESOURCE,
  
  /**
   * All batch processor-related configuration keys.
   */
  BATCH_PROCESSOR,
  
  /**
   * All journey-specific configuration keys.
   */
  JOURNEY,
  
  /**
   * All general tracing configuration keys.
   */
  GENERAL,
};