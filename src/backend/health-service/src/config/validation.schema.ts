import * as Joi from 'joi';

/**
 * Validation schema for the Health Service environment variables.
 * This ensures all required configuration is present and correctly formatted.
 * 
 * All environment variables are validated during application bootstrap,
 * providing immediate feedback if configuration is missing or invalid.
 * 
 * The schema has been updated to support the refactored architecture with
 * enhanced error messages and validation for new feature flags.
 */
export const validationSchema = Joi.object({
  // Core service configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .description('Application environment (development, production, test)'),
  PORT: Joi.number()
    .default(3001)
    .description('Port on which the Health Service will listen'),
  API_PREFIX: Joi.string()
    .default('api/v1')
    .description('API route prefix for all endpoints'),
  
  // Database configuration
  DATABASE_URL: Joi.string()
    .required()
    .description('PostgreSQL connection string for the Health Service database'),
  DATABASE_SSL: Joi.string()
    .valid('true', 'false')
    .default('false')
    .description('Enable SSL for database connections'),
  DATABASE_CONNECTION_POOL_MIN: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .default(5)
    .description('Minimum number of connections in the database pool'),
  DATABASE_CONNECTION_POOL_MAX: Joi.number()
    .integer()
    .min(5)
    .max(50)
    .default(20)
    .description('Maximum number of connections in the database pool'),
  
  // TimescaleDB configuration for health metrics
  TIMESCALE_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable TimescaleDB for time-series health metrics'),
  METRICS_RETENTION_DAYS: Joi.number()
    .integer()
    .min(1)
    .max(3650)
    .default(730) // Default 2 years
    .description('Number of days to retain raw health metrics data'),
  METRICS_AGGREGATION_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable automatic aggregation of health metrics'),
  METRICS_AGGREGATION_INTERVALS: Joi.string()
    .default('hour,day,week,month')
    .description('Comma-separated list of aggregation intervals'),
  
  // FHIR API integration for medical records
  FHIR_API_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable FHIR API integration for medical records'),
  FHIR_API_URL: Joi.string()
    .uri()
    .when('FHIR_API_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('FHIR API base URL (required when FHIR_API_ENABLED is true)'),
      otherwise: Joi.description('FHIR API base URL (not required when FHIR_API_ENABLED is false)')
    }),
  FHIR_API_AUTH_TYPE: Joi.string()
    .valid('oauth2', 'basic', 'none')
    .default('oauth2')
    .description('Authentication type for FHIR API (oauth2, basic, none)'),
  FHIR_API_CLIENT_ID: Joi.string()
    .when('FHIR_API_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('OAuth2 client ID for FHIR API (required when FHIR_API_ENABLED is true)'),
      otherwise: Joi.description('OAuth2 client ID for FHIR API (not required when FHIR_API_ENABLED is false)')
    }),
  FHIR_API_CLIENT_SECRET: Joi.string()
    .when('FHIR_API_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('OAuth2 client secret for FHIR API (required when FHIR_API_ENABLED is true)'),
      otherwise: Joi.description('OAuth2 client secret for FHIR API (not required when FHIR_API_ENABLED is false)')
    }),
  FHIR_API_SCOPE: Joi.string()
    .when('FHIR_API_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('OAuth2 scope for FHIR API (required when FHIR_API_ENABLED is true)'),
      otherwise: Joi.description('OAuth2 scope for FHIR API (not required when FHIR_API_ENABLED is false)')
    }),
  FHIR_API_TOKEN_URL: Joi.string()
    .uri()
    .when('FHIR_API_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('OAuth2 token URL for FHIR API (required when FHIR_API_ENABLED is true)'),
      otherwise: Joi.description('OAuth2 token URL for FHIR API (not required when FHIR_API_ENABLED is false)')
    }),
  FHIR_API_USERNAME: Joi.string()
    .when('FHIR_API_AUTH_TYPE', { 
      is: 'basic', 
      then: Joi.required().description('Basic auth username for FHIR API (required when FHIR_API_AUTH_TYPE is basic)'),
      otherwise: Joi.description('Basic auth username for FHIR API (not required when FHIR_API_AUTH_TYPE is not basic)')
    }),
  FHIR_API_PASSWORD: Joi.string()
    .when('FHIR_API_AUTH_TYPE', { 
      is: 'basic', 
      then: Joi.required().description('Basic auth password for FHIR API (required when FHIR_API_AUTH_TYPE is basic)'),
      otherwise: Joi.description('Basic auth password for FHIR API (not required when FHIR_API_AUTH_TYPE is not basic)')
    }),
  FHIR_API_TIMEOUT: Joi.number()
    .integer()
    .default(10000) // 10 seconds default
    .description('Timeout in milliseconds for FHIR API requests'),
  FHIR_API_RETRY_ATTEMPTS: Joi.number()
    .integer()
    .min(0)
    .max(10)
    .default(3)
    .description('Number of retry attempts for failed FHIR API requests'),
  
  // Wearable device integration
  WEARABLES_SYNC_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable synchronization with wearable devices'),
  WEARABLES_SUPPORTED: Joi.string()
    .default('googlefit,healthkit,fitbit')
    .description('Comma-separated list of supported wearable platforms'),
  // Google Fit settings
  GOOGLEFIT_CLIENT_ID: Joi.string()
    .when('WEARABLES_SYNC_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Google Fit OAuth2 client ID (required when WEARABLES_SYNC_ENABLED is true)'),
      otherwise: Joi.description('Google Fit OAuth2 client ID (not required when WEARABLES_SYNC_ENABLED is false)')
    }),
  GOOGLEFIT_CLIENT_SECRET: Joi.string()
    .when('WEARABLES_SYNC_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Google Fit OAuth2 client secret (required when WEARABLES_SYNC_ENABLED is true)'),
      otherwise: Joi.description('Google Fit OAuth2 client secret (not required when WEARABLES_SYNC_ENABLED is false)')
    }),
  // Apple HealthKit settings
  HEALTHKIT_TEAM_ID: Joi.string()
    .when('WEARABLES_SYNC_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Apple Developer Team ID (required when WEARABLES_SYNC_ENABLED is true)'),
      otherwise: Joi.description('Apple Developer Team ID (not required when WEARABLES_SYNC_ENABLED is false)')
    }),
  HEALTHKIT_KEY_ID: Joi.string()
    .when('WEARABLES_SYNC_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Apple HealthKit Key ID (required when WEARABLES_SYNC_ENABLED is true)'),
      otherwise: Joi.description('Apple HealthKit Key ID (not required when WEARABLES_SYNC_ENABLED is false)')
    }),
  HEALTHKIT_PRIVATE_KEY: Joi.string()
    .when('WEARABLES_SYNC_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Apple HealthKit Private Key (required when WEARABLES_SYNC_ENABLED is true)'),
      otherwise: Joi.description('Apple HealthKit Private Key (not required when WEARABLES_SYNC_ENABLED is false)')
    }),
  // Fitbit settings
  FITBIT_CLIENT_ID: Joi.string()
    .when('WEARABLES_SYNC_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Fitbit OAuth2 client ID (required when WEARABLES_SYNC_ENABLED is true)'),
      otherwise: Joi.description('Fitbit OAuth2 client ID (not required when WEARABLES_SYNC_ENABLED is false)')
    }),
  FITBIT_CLIENT_SECRET: Joi.string()
    .when('WEARABLES_SYNC_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Fitbit OAuth2 client secret (required when WEARABLES_SYNC_ENABLED is true)'),
      otherwise: Joi.description('Fitbit OAuth2 client secret (not required when WEARABLES_SYNC_ENABLED is false)')
    }),
  // Sync settings
  WEARABLES_SYNC_INTERVAL: Joi.number()
    .integer()
    .default(15) // Minutes
    .description('Interval in minutes between wearable data synchronization'),
  WEARABLES_MAX_SYNC_DAYS: Joi.number()
    .integer()
    .default(30)
    .description('Maximum number of days to sync historical data from wearables'),
  
  // Health features configuration
  HEALTH_GOALS_MAX_ACTIVE: Joi.number()
    .integer()
    .default(10)
    .description('Maximum number of active health goals per user'),
  HEALTH_INSIGHTS_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable health insights generation'),
  HEALTH_INSIGHTS_GENERATION_INTERVAL: Joi.number()
    .integer()
    .default(24) // Hours
    .description('Interval in hours between health insights generation'),
  HEALTH_INSIGHTS_MODELS_PATH: Joi.string()
    .description('Path to health insights machine learning models'),
  
  // Event streaming configuration
  EVENTS_KAFKA_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable Kafka for event streaming'),
  EVENTS_KAFKA_BROKERS: Joi.string()
    .when('EVENTS_KAFKA_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Comma-separated list of Kafka brokers (required when EVENTS_KAFKA_ENABLED is true)'),
      otherwise: Joi.description('Comma-separated list of Kafka brokers (not required when EVENTS_KAFKA_ENABLED is false)')
    }),
  EVENTS_TOPIC_PREFIX: Joi.string()
    .default('austa.health')
    .description('Prefix for all Kafka topics created by this service'),
  EVENTS_SCHEMA_VALIDATION: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable schema validation for events'),
  EVENTS_SCHEMA_REGISTRY_URL: Joi.string()
    .uri()
    .when('EVENTS_SCHEMA_VALIDATION', { 
      is: 'true', 
      then: Joi.required().description('Schema Registry URL (required when EVENTS_SCHEMA_VALIDATION is true)'),
      otherwise: Joi.description('Schema Registry URL (not required when EVENTS_SCHEMA_VALIDATION is false)')
    }),
  
  // Caching configuration
  REDIS_URL: Joi.string()
    .required()
    .description('Redis connection string for caching'),
  REDIS_TTL: Joi.number()
    .integer()
    .default(3600) // 1 hour default
    .description('Default TTL (time to live) in seconds for cached items'),
  REDIS_CLUSTER_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('false')
    .description('Enable Redis cluster mode'),
  
  // Medical history settings
  MEDICAL_HISTORY_MAX_EVENTS: Joi.number()
    .integer()
    .default(1000)
    .description('Maximum number of medical history events to return in a single query'),
  
  // Storage configuration
  STORAGE_S3_BUCKET: Joi.string()
    .description('S3 bucket name for file storage'),
  STORAGE_S3_REGION: Joi.string()
    .description('AWS region for S3 bucket'),
  STORAGE_S3_PREFIX: Joi.string()
    .default('health')
    .description('Prefix for all files stored in S3 bucket'),
  
  // Tracing and observability configuration
  TRACING_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable distributed tracing'),
  TRACING_EXPORTER: Joi.string()
    .valid('jaeger', 'zipkin', 'otlp', 'console', 'none')
    .default('console')
    .description('Tracing exporter to use (jaeger, zipkin, otlp, console, none)'),
  TRACING_ENDPOINT: Joi.string()
    .uri()
    .when('TRACING_EXPORTER', { 
      is: Joi.valid('jaeger', 'zipkin', 'otlp'), 
      then: Joi.required().description('Tracing collector endpoint (required for jaeger, zipkin, otlp exporters)'),
      otherwise: Joi.description('Tracing collector endpoint (not required for console or none exporters)')
    }),
  METRICS_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable Prometheus metrics collection'),
  METRICS_ENDPOINT: Joi.string()
    .default('/metrics')
    .description('Endpoint for exposing Prometheus metrics'),
  
  // Error handling configuration
  ERROR_TRACKING_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable error tracking and reporting'),
  ERROR_TRACKING_DSN: Joi.string()
    .uri()
    .when('ERROR_TRACKING_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Error tracking service DSN (required when ERROR_TRACKING_ENABLED is true)'),
      otherwise: Joi.description('Error tracking service DSN (not required when ERROR_TRACKING_ENABLED is false)')
    }),
  ERROR_TRACKING_ENVIRONMENT: Joi.string()
    .default('${NODE_ENV}')
    .description('Environment name for error tracking'),
  ERROR_TRACKING_SAMPLE_RATE: Joi.number()
    .min(0)
    .max(1)
    .default(1.0)
    .description('Sampling rate for error tracking (0.0-1.0)'),
  
  // Journey integration configuration
  JOURNEY_CONTEXT_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable integration with journey context'),
  JOURNEY_CONTEXT_SYNC_INTERVAL: Joi.number()
    .integer()
    .default(60) // Seconds
    .description('Interval in seconds for synchronizing journey context'),
  
  // Feature flags
  FEATURE_ENHANCED_METRICS: Joi.string()
    .valid('true', 'false')
    .default('false')
    .description('Enable enhanced metrics collection'),
  FEATURE_CROSS_JOURNEY_EVENTS: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable cross-journey event processing'),
  FEATURE_GAMIFICATION_INTEGRATION: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable integration with gamification engine'),
  FEATURE_HEALTH_PREDICTIONS: Joi.string()
    .valid('true', 'false')
    .default('false')
    .description('Enable health prediction features'),
  FEATURE_DEVICE_AUTO_DISCOVERY: Joi.string()
    .valid('true', 'false')
    .default('false')
    .description('Enable automatic discovery of connected devices')
}).options({
  abortEarly: false,         // Return all errors instead of stopping at the first one
  allowUnknown: true,        // Allow unknown keys that will be ignored
  stripUnknown: false,       // Remove unknown elements from objects
  convert: true,             // Attempt type conversion where possible
  presence: 'optional',      // By default, all keys are optional unless required() is used
  messages: {
    'any.required': '{{#label}} is required for the Health Service to function properly',
    'string.base': '{{#label}} must be a string',
    'string.uri': '{{#label}} must be a valid URI',
    'number.base': '{{#label}} must be a number',
    'number.integer': '{{#label}} must be an integer',
    'number.min': '{{#label}} must be at least {{#limit}}',
    'number.max': '{{#label}} must be at most {{#limit}}',
    'string.valid': '{{#label}} must be one of: {{#valids}}'
  }
});