import * as Joi from 'joi';
import { 
  CORE, 
  DATABASE, 
  REDIS, 
  AUTH, 
  PROVIDERS, 
  APPOINTMENTS, 
  TELEMEDICINE, 
  MEDICATIONS, 
  TREATMENT_PLANS, 
  SYMPTOMS_CHECKER, 
  NOTIFICATIONS, 
  GAMIFICATION, 
  INTEGRATIONS, 
  LOGGING, 
  FEATURES, 
  API_VERSIONING, 
  ERROR_HANDLING 
} from '@app/config/constants';

/**
 * Validation schema for Care Service configuration
 * 
 * This schema ensures all required environment variables are present and correctly formatted.
 * It is used with NestJS ConfigModule for validating environment variables during application bootstrap,
 * providing immediate feedback if configuration is missing or invalid.
 * 
 * The schema has been updated to support the refactored architecture with enhanced error messages
 * and validation for journey-specific configurations.
 */
export const validationSchema = Joi.object({
  // Core service configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default(CORE.DEFAULT_ENV)
    .description('Application environment (development, production, test)'),
  PORT: Joi.number()
    .default(CORE.DEFAULT_PORT)
    .description('Port on which the Care Service will listen'),
  API_PREFIX: Joi.string()
    .default(CORE.DEFAULT_API_PREFIX)
    .description('API route prefix for all endpoints'),
  SERVICE_VERSION: Joi.string()
    .default(CORE.SERVICE_VERSION)
    .description('Semantic version of the Care Service'),

  // Database configuration
  DATABASE_URL: Joi.string()
    .required()
    .description('PostgreSQL connection string for the Care Service database'),
  DATABASE_SSL: Joi.string()
    .valid('true', 'false')
    .default(DATABASE.DEFAULT_SSL_ENABLED ? 'true' : 'false')
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
    .default(DATABASE.DEFAULT_MAX_CONNECTIONS)
    .description('Maximum number of connections in the database pool'),
  DATABASE_IDLE_TIMEOUT: Joi.number()
    .integer()
    .min(1000)
    .default(DATABASE.DEFAULT_IDLE_TIMEOUT_MS)
    .description('Idle timeout in milliseconds for database connections'),

  // Redis configuration
  REDIS_URL: Joi.string()
    .required()
    .description('Redis connection string for caching'),
  REDIS_TTL: Joi.number()
    .integer()
    .default(REDIS.DEFAULT_TTL)
    .description('Default TTL (time to live) in seconds for cached items'),
  REDIS_PREFIX: Joi.string()
    .default(REDIS.DEFAULT_PREFIX)
    .description('Prefix for all Redis keys'),
  REDIS_CLUSTER_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('false')
    .description('Enable Redis cluster mode'),

  // Authentication
  JWT_SECRET: Joi.string()
    .required()
    .description('Secret key for JWT token signing'),
  JWT_EXPIRES_IN: Joi.string()
    .default(AUTH.DEFAULT_JWT_EXPIRES)
    .description('JWT token expiration time'),
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .default('7d')
    .description('JWT refresh token expiration time'),
  OAUTH_AUTHORITY: Joi.string()
    .uri()
    .default(AUTH.OAUTH.DEFAULT_AUTHORITY)
    .description('OAuth authority URL'),
  OAUTH_CLIENT_ID: Joi.string()
    .default(AUTH.OAUTH.DEFAULT_CLIENT_ID)
    .description('OAuth client ID'),
  OAUTH_CLIENT_SECRET: Joi.string()
    .default(AUTH.OAUTH.DEFAULT_CLIENT_SECRET)
    .description('OAuth client secret'),
  OAUTH_AUDIENCE: Joi.string()
    .default(AUTH.OAUTH.DEFAULT_AUDIENCE)
    .description('OAuth audience'),

  // Provider systems integration
  PROVIDERS_API_URL: Joi.string()
    .uri()
    .default(PROVIDERS.DEFAULT_API_URL)
    .description('Provider API base URL'),
  PROVIDERS_API_KEY: Joi.string()
    .default(PROVIDERS.DEFAULT_API_KEY)
    .description('Provider API key'),
  PROVIDERS_API_TIMEOUT: Joi.number()
    .integer()
    .default(PROVIDERS.DEFAULT_TIMEOUT_MS)
    .description('Timeout in milliseconds for provider API requests'),
  PROVIDERS_CACHE_ENABLED: Joi.string()
    .valid('true', 'false')
    .default(PROVIDERS.DEFAULT_CACHE_ENABLED ? 'true' : 'false')
    .description('Enable caching for provider API responses'),
  PROVIDERS_CACHE_TTL: Joi.number()
    .integer()
    .default(PROVIDERS.DEFAULT_CACHE_TTL)
    .description('TTL in seconds for provider API cache'),
  PROVIDERS_RETRY_ATTEMPTS: Joi.number()
    .integer()
    .min(0)
    .max(10)
    .default(PROVIDERS.DEFAULT_RETRY_ATTEMPTS)
    .description('Number of retry attempts for failed provider API requests'),
  PROVIDERS_RETRY_DELAY: Joi.number()
    .integer()
    .default(PROVIDERS.DEFAULT_RETRY_DELAY_MS)
    .description('Delay in milliseconds between retry attempts'),

  // Appointment scheduling
  APPOINTMENTS_MAX_ADVANCE_DAYS: Joi.number()
    .integer()
    .default(APPOINTMENTS.MAX_ADVANCE_DAYS)
    .description('Maximum days in advance for booking appointments'),
  APPOINTMENTS_REMINDER_SCHEDULE: Joi.string()
    .default(APPOINTMENTS.DEFAULT_REMINDER_SCHEDULE)
    .description('Comma-separated values for appointment reminder schedule'),
  APPOINTMENTS_DEFAULT_DURATION: Joi.number()
    .integer()
    .default(APPOINTMENTS.DEFAULT_DURATION_MINUTES)
    .description('Default appointment duration in minutes'),
  APPOINTMENTS_CANCELLATION_POLICY_ENABLED: Joi.string()
    .valid('true', 'false')
    .default(APPOINTMENTS.CANCELLATION_POLICY.DEFAULT_ENABLED ? 'true' : 'false')
    .description('Enable cancellation policy for appointments'),
  APPOINTMENTS_CANCELLATION_MINIMUM_NOTICE: Joi.number()
    .integer()
    .default(APPOINTMENTS.CANCELLATION_POLICY.DEFAULT_MINIMUM_NOTICE_HOURS)
    .description('Minimum notice hours for cancellation without penalty'),
  APPOINTMENTS_CANCELLATION_PENALTY_XP: Joi.number()
    .integer()
    .default(APPOINTMENTS.CANCELLATION_POLICY.DEFAULT_PENALTY_XP_LOSS)
    .description('XP loss for late cancellation'),
  APPOINTMENTS_AVAILABILITY_BUFFER: Joi.number()
    .integer()
    .default(APPOINTMENTS.DEFAULT_AVAILABILITY_BUFFER_MINUTES)
    .description('Buffer time between appointments in minutes'),
  APPOINTMENT_API_TIMEOUT: Joi.number()
    .integer()
    .default(PROVIDERS.DEFAULT_TIMEOUT_MS)
    .description('Timeout in milliseconds for appointment API requests'),

  // Telemedicine configuration
  TELEMEDICINE_ENABLED: Joi.string()
    .valid('true', 'false')
    .default(TELEMEDICINE.DEFAULT_ENABLED ? 'true' : 'false')
    .description('Enable telemedicine features'),
  TELEMEDICINE_PROVIDER: Joi.string()
    .default(TELEMEDICINE.DEFAULT_PROVIDER)
    .description('Telemedicine provider (agora, etc.)'),
  TELEMEDICINE_API_KEY: Joi.string()
    .when('TELEMEDICINE_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Telemedicine API key (required when TELEMEDICINE_ENABLED is true)'),
      otherwise: Joi.description('Telemedicine API key (not required when TELEMEDICINE_ENABLED is false)')
    }),
  TELEMEDICINE_API_URL: Joi.string()
    .uri()
    .when('TELEMEDICINE_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Telemedicine API URL (required when TELEMEDICINE_ENABLED is true)'),
      otherwise: Joi.description('Telemedicine API URL (not required when TELEMEDICINE_ENABLED is false)')
    }),
  TELEMEDICINE_API_TIMEOUT: Joi.number()
    .integer()
    .default(TELEMEDICINE.QUALITY_THRESHOLDS.DEFAULT_CONNECTION_TIMEOUT_MS)
    .description('Timeout in milliseconds for telemedicine API requests'),
  TELEMEDICINE_AGORA_APP_ID: Joi.string()
    .when('TELEMEDICINE_PROVIDER', { 
      is: 'agora', 
      then: Joi.required().description('Agora app ID (required when TELEMEDICINE_PROVIDER is agora)'),
      otherwise: Joi.description('Agora app ID (not required when TELEMEDICINE_PROVIDER is not agora)')
    }),
  TELEMEDICINE_AGORA_APP_CERTIFICATE: Joi.string()
    .when('TELEMEDICINE_PROVIDER', { 
      is: 'agora', 
      then: Joi.required().description('Agora app certificate (required when TELEMEDICINE_PROVIDER is agora)'),
      otherwise: Joi.description('Agora app certificate (not required when TELEMEDICINE_PROVIDER is not agora)')
    }),
  TELEMEDICINE_RECORDING_ENABLED: Joi.string()
    .valid('true', 'false')
    .default(TELEMEDICINE.DEFAULT_RECORDING_ENABLED ? 'true' : 'false')
    .description('Enable recording for telemedicine sessions'),
  TELEMEDICINE_RECORDING_BUCKET: Joi.string()
    .when('TELEMEDICINE_RECORDING_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('S3 bucket for telemedicine recordings (required when TELEMEDICINE_RECORDING_ENABLED is true)'),
      otherwise: Joi.description('S3 bucket for telemedicine recordings (not required when TELEMEDICINE_RECORDING_ENABLED is false)')
    }),
  TELEMEDICINE_SESSION_DURATION: Joi.number()
    .integer()
    .default(TELEMEDICINE.SESSION_DURATION.DEFAULT_DURATION_MINUTES)
    .description('Default telemedicine session duration in minutes'),
  TELEMEDICINE_SESSION_MAX_DURATION: Joi.number()
    .integer()
    .default(TELEMEDICINE.SESSION_DURATION.MAX_DURATION_MINUTES)
    .description('Maximum telemedicine session duration in minutes'),

  // Medication tracking
  MEDICATIONS_REMINDER_ENABLED: Joi.string()
    .valid('true', 'false')
    .default(MEDICATIONS.DEFAULT_REMINDER_ENABLED ? 'true' : 'false')
    .description('Enable medication reminders'),
  MEDICATIONS_REMINDER_TIMES: Joi.string()
    .default(MEDICATIONS.DEFAULT_REMINDER_TIMES)
    .description('Default reminder times (comma-separated values)'),
  MEDICATIONS_ADHERENCE_THRESHOLD: Joi.number()
    .min(0)
    .max(1)
    .default(MEDICATIONS.DEFAULT_ADHERENCE_THRESHOLD)
    .description('Threshold for good medication adherence (0.0-1.0)'),
  MEDICATIONS_REFILL_REMINDER_DAYS: Joi.number()
    .integer()
    .default(MEDICATIONS.DEFAULT_REFILL_REMINDER_DAYS)
    .description('Days before medication runs out to send refill reminder'),
  MEDICATIONS_MAX_MISSED_DOSES: Joi.number()
    .integer()
    .default(MEDICATIONS.DEFAULT_MAX_MISSED_DOSES)
    .description('Maximum consecutive missed doses before intervention'),
  MEDICATION_API_TIMEOUT: Joi.number()
    .integer()
    .default(PROVIDERS.DEFAULT_TIMEOUT_MS)
    .description('Timeout in milliseconds for medication API requests'),

  // Treatment plans
  TREATMENT_PLANS_REMINDER_ENABLED: Joi.string()
    .valid('true', 'false')
    .default(TREATMENT_PLANS.DEFAULT_REMINDER_ENABLED ? 'true' : 'false')
    .description('Enable treatment reminders'),
  TREATMENT_PLANS_PROGRESS_UPDATE_FREQUENCY: Joi.string()
    .valid('hourly', 'daily', 'weekly')
    .default(TREATMENT_PLANS.DEFAULT_PROGRESS_UPDATE_FREQUENCY)
    .description('Frequency for treatment progress updates'),
  TREATMENT_PLANS_AT_RISK_THRESHOLD: Joi.number()
    .min(0)
    .max(1)
    .default(TREATMENT_PLANS.PROGRESS_THRESHOLDS.DEFAULT_AT_RISK)
    .description('Threshold for at-risk treatment progress (0.0-1.0)'),
  TREATMENT_PLANS_ON_TRACK_THRESHOLD: Joi.number()
    .min(0)
    .max(1)
    .default(TREATMENT_PLANS.PROGRESS_THRESHOLDS.DEFAULT_ON_TRACK)
    .description('Threshold for on-track treatment progress (0.0-1.0)'),
  TREATMENT_API_TIMEOUT: Joi.number()
    .integer()
    .default(PROVIDERS.DEFAULT_TIMEOUT_MS)
    .description('Timeout in milliseconds for treatment API requests'),

  // Symptom checker
  SYMPTOMS_CHECKER_ENABLED: Joi.string()
    .valid('true', 'false')
    .default(SYMPTOMS_CHECKER.DEFAULT_ENABLED ? 'true' : 'false')
    .description('Enable symptoms checker'),
  SYMPTOMS_CHECKER_PROVIDER: Joi.string()
    .default(SYMPTOMS_CHECKER.DEFAULT_PROVIDER)
    .description('Symptoms checker provider (internal, external)'),
  SYMPTOMS_CHECKER_EXTERNAL_API_URL: Joi.string()
    .uri()
    .when('SYMPTOMS_CHECKER_PROVIDER', { 
      is: 'external', 
      then: Joi.required().description('External symptoms checker API URL (required when SYMPTOMS_CHECKER_PROVIDER is external)'),
      otherwise: Joi.description('External symptoms checker API URL (not required when SYMPTOMS_CHECKER_PROVIDER is not external)')
    }),
  SYMPTOMS_CHECKER_EXTERNAL_API_KEY: Joi.string()
    .when('SYMPTOMS_CHECKER_PROVIDER', { 
      is: 'external', 
      then: Joi.required().description('External symptoms checker API key (required when SYMPTOMS_CHECKER_PROVIDER is external)'),
      otherwise: Joi.description('External symptoms checker API key (not required when SYMPTOMS_CHECKER_PROVIDER is not external)')
    }),
  SYMPTOMS_CHECKER_EMERGENCY_SYMPTOMS: Joi.string()
    .default(SYMPTOMS_CHECKER.DEFAULT_EMERGENCY_SYMPTOMS)
    .description('Comma-separated list of emergency symptoms'),
  SYMPTOM_CHECKER_API_TIMEOUT: Joi.number()
    .integer()
    .default(SYMPTOMS_CHECKER.EXTERNAL_API.DEFAULT_TIMEOUT_MS)
    .description('Timeout in milliseconds for symptom checker API requests'),

  // Provider API
  PROVIDER_API_TIMEOUT: Joi.number()
    .integer()
    .default(PROVIDERS.DEFAULT_TIMEOUT_MS)
    .description('Timeout in milliseconds for provider API requests'),

  // Kafka Configuration
  EVENTS_KAFKA_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable Kafka for event streaming'),
  KAFKA_BROKERS: Joi.string()
    .when('EVENTS_KAFKA_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Comma-separated list of Kafka brokers (required when EVENTS_KAFKA_ENABLED is true)'),
      otherwise: Joi.description('Comma-separated list of Kafka brokers (not required when EVENTS_KAFKA_ENABLED is false)')
    }),
  KAFKA_CLIENT_ID: Joi.string()
    .default('care-service')
    .description('Kafka client ID'),
  EVENTS_TOPIC_PREFIX: Joi.string()
    .default('austa.care')
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

  // Notifications Service
  NOTIFICATIONS_SERVICE_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable integration with notification service'),
  NOTIFICATIONS_SERVICE_URL: Joi.string()
    .uri()
    .when('NOTIFICATIONS_SERVICE_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Notification service URL (required when NOTIFICATIONS_SERVICE_ENABLED is true)'),
      otherwise: Joi.description('Notification service URL (not required when NOTIFICATIONS_SERVICE_ENABLED is false)')
    }),
  NOTIFICATIONS_SERVICE_API_KEY: Joi.string()
    .when('NOTIFICATIONS_SERVICE_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Notification service API key (required when NOTIFICATIONS_SERVICE_ENABLED is true)'),
      otherwise: Joi.description('Notification service API key (not required when NOTIFICATIONS_SERVICE_ENABLED is false)')
    }),
  NOTIFICATIONS_SERVICE_TIMEOUT: Joi.number()
    .integer()
    .default(5000)
    .description('Timeout in milliseconds for notification service requests'),
  NOTIFICATIONS_DEFAULT_CHANNELS: Joi.string()
    .default(NOTIFICATIONS.DEFAULT_CHANNELS)
    .description('Default notification channels (comma-separated values)'),
  NOTIFICATIONS_THROTTLING_ENABLED: Joi.string()
    .valid('true', 'false')
    .default(NOTIFICATIONS.THROTTLING.DEFAULT_ENABLED ? 'true' : 'false')
    .description('Enable notification throttling'),
  NOTIFICATIONS_THROTTLING_MAX_PER_HOUR: Joi.number()
    .integer()
    .default(NOTIFICATIONS.THROTTLING.DEFAULT_MAX_PER_HOUR)
    .description('Maximum notifications per hour'),
  NOTIFICATIONS_THROTTLING_MAX_PER_DAY: Joi.number()
    .integer()
    .default(NOTIFICATIONS.THROTTLING.DEFAULT_MAX_PER_DAY)
    .description('Maximum notifications per day'),

  // Gamification integration
  GAMIFICATION_ENABLED: Joi.string()
    .valid('true', 'false')
    .default(GAMIFICATION.DEFAULT_ENABLED ? 'true' : 'false')
    .description('Enable integration with gamification engine'),
  GAMIFICATION_SERVICE_URL: Joi.string()
    .uri()
    .when('GAMIFICATION_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Gamification service URL (required when GAMIFICATION_ENABLED is true)'),
      otherwise: Joi.description('Gamification service URL (not required when GAMIFICATION_ENABLED is false)')
    }),
  GAMIFICATION_SERVICE_API_KEY: Joi.string()
    .when('GAMIFICATION_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Gamification service API key (required when GAMIFICATION_ENABLED is true)'),
      otherwise: Joi.description('Gamification service API key (not required when GAMIFICATION_ENABLED is false)')
    }),

  // External integrations
  PHARMACY_NETWORKS_ENABLED: Joi.string()
    .valid('true', 'false')
    .default(INTEGRATIONS.PHARMACY_NETWORKS.DEFAULT_ENABLED ? 'true' : 'false')
    .description('Enable integration with pharmacy networks'),
  PHARMACY_NETWORKS_API_URL: Joi.string()
    .uri()
    .when('PHARMACY_NETWORKS_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Pharmacy networks API URL (required when PHARMACY_NETWORKS_ENABLED is true)'),
      otherwise: Joi.description('Pharmacy networks API URL (not required when PHARMACY_NETWORKS_ENABLED is false)')
    }),
  PHARMACY_NETWORKS_API_KEY: Joi.string()
    .when('PHARMACY_NETWORKS_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Pharmacy networks API key (required when PHARMACY_NETWORKS_ENABLED is true)'),
      otherwise: Joi.description('Pharmacy networks API key (not required when PHARMACY_NETWORKS_ENABLED is false)')
    }),
  EMERGENCY_SERVICES_ENABLED: Joi.string()
    .valid('true', 'false')
    .default(INTEGRATIONS.EMERGENCY_SERVICES.DEFAULT_ENABLED ? 'true' : 'false')
    .description('Enable integration with emergency services'),
  EMERGENCY_SERVICES_API_URL: Joi.string()
    .uri()
    .when('EMERGENCY_SERVICES_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Emergency services API URL (required when EMERGENCY_SERVICES_ENABLED is true)'),
      otherwise: Joi.description('Emergency services API URL (not required when EMERGENCY_SERVICES_ENABLED is false)')
    }),
  EMERGENCY_SERVICES_API_KEY: Joi.string()
    .when('EMERGENCY_SERVICES_ENABLED', { 
      is: 'true', 
      then: Joi.required().description('Emergency services API key (required when EMERGENCY_SERVICES_ENABLED is true)'),
      otherwise: Joi.description('Emergency services API key (not required when EMERGENCY_SERVICES_ENABLED is false)')
    }),
  EMERGENCY_NUMBER: Joi.string()
    .default(INTEGRATIONS.EMERGENCY_SERVICES.DEFAULT_EMERGENCY_NUMBER)
    .description('Default emergency number'),

  // Logging and monitoring
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default(LOGGING.DEFAULT_LEVEL)
    .description('Log level'),
  LOG_FORMAT: Joi.string()
    .valid('json', 'text')
    .default(LOGGING.DEFAULT_FORMAT)
    .description('Log format'),
  REQUEST_LOGGING_ENABLED: Joi.string()
    .valid('true', 'false')
    .default(LOGGING.DEFAULT_REQUEST_LOGGING_ENABLED ? 'true' : 'false')
    .description('Enable request logging'),
  SENSITIVE_DATA_FIELDS: Joi.string()
    .default(LOGGING.DEFAULT_SENSITIVE_DATA_FIELDS)
    .description('Comma-separated list of sensitive data fields to mask in logs'),

  // Tracing and observability
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

  // Error handling
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

  // Journey integration
  JOURNEY_CONTEXT_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable integration with journey context'),
  JOURNEY_CONTEXT_SYNC_INTERVAL: Joi.number()
    .integer()
    .default(60) // Seconds
    .description('Interval in seconds for synchronizing journey context'),

  // Feature flags
  FEATURE_VIRTUAL_WAITING_ROOM: Joi.string()
    .valid('true', 'false')
    .default(FEATURES.DEFAULT_VIRTUAL_WAITING_ROOM_ENABLED ? 'true' : 'false')
    .description('Enable virtual waiting room feature'),
  FEATURE_PROVIDER_RATINGS: Joi.string()
    .valid('true', 'false')
    .default(FEATURES.DEFAULT_PROVIDER_RATINGS_ENABLED ? 'true' : 'false')
    .description('Enable provider ratings feature'),
  FEATURE_DOCUMENT_SHARING: Joi.string()
    .valid('true', 'false')
    .default(FEATURES.DEFAULT_DOCUMENT_SHARING_ENABLED ? 'true' : 'false')
    .description('Enable document sharing feature'),
  FEATURE_FOLLOW_UP_SUGGESTIONS: Joi.string()
    .valid('true', 'false')
    .default(FEATURES.DEFAULT_FOLLOW_UP_SUGGESTIONS_ENABLED ? 'true' : 'false')
    .description('Enable follow-up suggestions feature'),
  FEATURE_CROSS_JOURNEY_EVENTS: Joi.string()
    .valid('true', 'false')
    .default('true')
    .description('Enable cross-journey event processing'),
}).options({
  abortEarly: false,         // Return all errors instead of stopping at the first one
  allowUnknown: true,        // Allow unknown keys that will be ignored
  stripUnknown: false,       // Remove unknown elements from objects
  convert: true,             // Attempt type conversion where possible
  presence: 'optional',      // By default, all keys are optional unless required() is used
  messages: {
    'any.required': '{{#label}} is required for the Care Service to function properly',
    'string.base': '{{#label}} must be a string',
    'string.uri': '{{#label}} must be a valid URI',
    'number.base': '{{#label}} must be a number',
    'number.integer': '{{#label}} must be an integer',
    'number.min': '{{#label}} must be at least {{#limit}}',
    'number.max': '{{#label}} must be at most {{#limit}}',
    'string.valid': '{{#label}} must be one of: {{#valids}}'
  }
});