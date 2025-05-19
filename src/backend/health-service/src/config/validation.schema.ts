import * as Joi from 'joi';
import { ErrorType } from '@nestjs/common';
import { JoiValidationError } from '@backend/packages/errors/src/categories';

/**
 * Validation schema for the Health Service environment variables.
 * This ensures all required configuration is present and correctly formatted.
 * 
 * All environment variables are validated during application bootstrap,
 * providing immediate feedback if configuration is missing or invalid.
 * 
 * The schema has been updated to support the refactored architecture with:
 * - Enhanced database connection pooling settings
 * - Journey-specific database contexts
 * - Retry mechanisms and backoff strategies
 * - Error classification settings
 * - Feature flags for progressive rollout
 * - Integration with @austa/interfaces package
 */
/**
 * Custom error messages for validation failures.
 * Provides more context about the configuration issue and potential solutions.
 */
const errorMessages = {
  required: (label: string) => `${label} is required for the Health Service to function properly`,
  invalidFormat: (label: string, format: string) => `${label} must be in a valid ${format} format`,
  invalidValue: (label: string, allowed: string[]) => `${label} must be one of: ${allowed.join(', ')}`,
  invalidRange: (label: string, min: number, max: number) => `${label} must be between ${min} and ${max}`,
  conditionallyRequired: (label: string, condition: string) => `${label} is required when ${condition} is enabled`,
  invalidType: (label: string, type: string) => `${label} must be a valid ${type}`
};

/**
 * Validation schema for the Health Service environment variables.
 */
export const validationSchema = Joi.object({
  // Core service configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .messages({
      'any.only': errorMessages.invalidValue('NODE_ENV', ['development', 'production', 'test'])
    }),
  PORT: Joi.number()
    .default(3001)
    .messages({
      'number.base': errorMessages.invalidType('PORT', 'number')
    }),
  API_PREFIX: Joi.string()
    .default('api/v1')
    .messages({
      'string.base': errorMessages.invalidType('API_PREFIX', 'string')
    }),
  SERVICE_NAME: Joi.string()
    .default('health-service')
    .messages({
      'string.base': errorMessages.invalidType('SERVICE_NAME', 'string')
    }),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info')
    .messages({
      'any.only': errorMessages.invalidValue('LOG_LEVEL', ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    }),
  
  // Database configuration
  DATABASE_URL: Joi.string()
    .required()
    .messages({
      'any.required': errorMessages.required('DATABASE_URL'),
      'string.base': errorMessages.invalidType('DATABASE_URL', 'connection string')
    }),
  DATABASE_SSL: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': errorMessages.invalidValue('DATABASE_SSL', ['true', 'false'])
    }),
  DATABASE_POOL_MIN: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(2)
    .messages({
      'number.base': errorMessages.invalidType('DATABASE_POOL_MIN', 'number'),
      'number.min': errorMessages.invalidRange('DATABASE_POOL_MIN', 1, 10),
      'number.max': errorMessages.invalidRange('DATABASE_POOL_MIN', 1, 10)
    }),
  DATABASE_POOL_MAX: Joi.number()
    .integer()
    .min(5)
    .max(50)
    .default(10)
    .messages({
      'number.base': errorMessages.invalidType('DATABASE_POOL_MAX', 'number'),
      'number.min': errorMessages.invalidRange('DATABASE_POOL_MAX', 5, 50),
      'number.max': errorMessages.invalidRange('DATABASE_POOL_MAX', 5, 50)
    }),
  DATABASE_TIMEOUT: Joi.number()
    .integer()
    .min(5000)
    .max(60000)
    .default(30000)
    .messages({
      'number.base': errorMessages.invalidType('DATABASE_TIMEOUT', 'number'),
      'number.min': errorMessages.invalidRange('DATABASE_TIMEOUT', 5000, 60000),
      'number.max': errorMessages.invalidRange('DATABASE_TIMEOUT', 5000, 60000)
    }),
  DATABASE_CONTEXT_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('DATABASE_CONTEXT_ENABLED', ['true', 'false'])
    }),
  
  // TimescaleDB configuration for health metrics
  TIMESCALE_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('TIMESCALE_ENABLED', ['true', 'false'])
    }),
  METRICS_RETENTION_DAYS: Joi.number()
    .integer()
    .min(1)
    .max(3650)
    .default(730) // Default 2 years
    .messages({
      'number.base': errorMessages.invalidType('METRICS_RETENTION_DAYS', 'number'),
      'number.min': errorMessages.invalidRange('METRICS_RETENTION_DAYS', 1, 3650),
      'number.max': errorMessages.invalidRange('METRICS_RETENTION_DAYS', 1, 3650)
    }),
  METRICS_AGGREGATION_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('METRICS_AGGREGATION_ENABLED', ['true', 'false'])
    }),
  METRICS_AGGREGATION_INTERVALS: Joi.string()
    .default('hour,day,week,month')
    .messages({
      'string.base': errorMessages.invalidType('METRICS_AGGREGATION_INTERVALS', 'comma-separated string')
    }),
  METRICS_BATCH_SIZE: Joi.number()
    .integer()
    .min(10)
    .max(1000)
    .default(100)
    .messages({
      'number.base': errorMessages.invalidType('METRICS_BATCH_SIZE', 'number'),
      'number.min': errorMessages.invalidRange('METRICS_BATCH_SIZE', 10, 1000),
      'number.max': errorMessages.invalidRange('METRICS_BATCH_SIZE', 10, 1000)
    }),
  
  // FHIR API integration for medical records
  FHIR_API_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('FHIR_API_ENABLED', ['true', 'false'])
    }),
  FHIR_API_URL: Joi.string()
    .uri()
    .when('FHIR_API_ENABLED', { is: 'true', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('FHIR_API_URL', 'FHIR API'),
      'string.uri': errorMessages.invalidFormat('FHIR_API_URL', 'URI')
    }),
  FHIR_API_AUTH_TYPE: Joi.string()
    .valid('oauth2', 'basic', 'none')
    .default('oauth2')
    .messages({
      'any.only': errorMessages.invalidValue('FHIR_API_AUTH_TYPE', ['oauth2', 'basic', 'none'])
    }),
  FHIR_API_CLIENT_ID: Joi.string()
    .when('FHIR_API_ENABLED', { is: 'true', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('FHIR_API_CLIENT_ID', 'FHIR API')
    }),
  FHIR_API_CLIENT_SECRET: Joi.string()
    .when('FHIR_API_ENABLED', { is: 'true', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('FHIR_API_CLIENT_SECRET', 'FHIR API')
    }),
  FHIR_API_SCOPE: Joi.string()
    .when('FHIR_API_ENABLED', { is: 'true', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('FHIR_API_SCOPE', 'FHIR API')
    }),
  FHIR_API_TOKEN_URL: Joi.string()
    .uri()
    .when('FHIR_API_ENABLED', { is: 'true', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('FHIR_API_TOKEN_URL', 'FHIR API'),
      'string.uri': errorMessages.invalidFormat('FHIR_API_TOKEN_URL', 'URI')
    }),
  FHIR_API_USERNAME: Joi.string()
    .when('FHIR_API_AUTH_TYPE', { is: 'basic', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('FHIR_API_USERNAME', 'FHIR Basic Auth')
    }),
  FHIR_API_PASSWORD: Joi.string()
    .when('FHIR_API_AUTH_TYPE', { is: 'basic', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('FHIR_API_PASSWORD', 'FHIR Basic Auth')
    }),
  FHIR_API_TIMEOUT: Joi.number()
    .integer()
    .min(1000)
    .max(60000)
    .default(10000) // 10 seconds default
    .messages({
      'number.base': errorMessages.invalidType('FHIR_API_TIMEOUT', 'number'),
      'number.min': errorMessages.invalidRange('FHIR_API_TIMEOUT', 1000, 60000),
      'number.max': errorMessages.invalidRange('FHIR_API_TIMEOUT', 1000, 60000)
    }),
  FHIR_API_RETRY_ATTEMPTS: Joi.number()
    .integer()
    .min(0)
    .max(10)
    .default(3)
    .messages({
      'number.base': errorMessages.invalidType('FHIR_API_RETRY_ATTEMPTS', 'number'),
      'number.min': errorMessages.invalidRange('FHIR_API_RETRY_ATTEMPTS', 0, 10),
      'number.max': errorMessages.invalidRange('FHIR_API_RETRY_ATTEMPTS', 0, 10)
    }),
  FHIR_API_RETRY_DELAY: Joi.number()
    .integer()
    .min(100)
    .max(10000)
    .default(1000)
    .messages({
      'number.base': errorMessages.invalidType('FHIR_API_RETRY_DELAY', 'number'),
      'number.min': errorMessages.invalidRange('FHIR_API_RETRY_DELAY', 100, 10000),
      'number.max': errorMessages.invalidRange('FHIR_API_RETRY_DELAY', 100, 10000)
    }),
  FHIR_API_CIRCUIT_BREAKER_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('FHIR_API_CIRCUIT_BREAKER_ENABLED', ['true', 'false'])
    }),
  FHIR_API_CIRCUIT_BREAKER_THRESHOLD: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(5)
    .messages({
      'number.base': errorMessages.invalidType('FHIR_API_CIRCUIT_BREAKER_THRESHOLD', 'number'),
      'number.min': errorMessages.invalidRange('FHIR_API_CIRCUIT_BREAKER_THRESHOLD', 1, 100),
      'number.max': errorMessages.invalidRange('FHIR_API_CIRCUIT_BREAKER_THRESHOLD', 1, 100)
    }),
  FHIR_API_CIRCUIT_BREAKER_TIMEOUT: Joi.number()
    .integer()
    .min(1000)
    .max(300000)
    .default(30000)
    .messages({
      'number.base': errorMessages.invalidType('FHIR_API_CIRCUIT_BREAKER_TIMEOUT', 'number'),
      'number.min': errorMessages.invalidRange('FHIR_API_CIRCUIT_BREAKER_TIMEOUT', 1000, 300000),
      'number.max': errorMessages.invalidRange('FHIR_API_CIRCUIT_BREAKER_TIMEOUT', 1000, 300000)
    }),
  
  // Wearable device integration
  WEARABLES_SYNC_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('WEARABLES_SYNC_ENABLED', ['true', 'false'])
    }),
  WEARABLES_SUPPORTED: Joi.string()
    .default('googlefit,healthkit,fitbit')
    .messages({
      'string.base': errorMessages.invalidType('WEARABLES_SUPPORTED', 'comma-separated string')
    }),
  // Google Fit settings
  GOOGLEFIT_CLIENT_ID: Joi.string()
    .when('WEARABLES_SYNC_ENABLED', { is: 'true', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('GOOGLEFIT_CLIENT_ID', 'Wearables Sync')
    }),
  GOOGLEFIT_CLIENT_SECRET: Joi.string()
    .when('WEARABLES_SYNC_ENABLED', { is: 'true', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('GOOGLEFIT_CLIENT_SECRET', 'Wearables Sync')
    }),
  // Apple HealthKit settings
  HEALTHKIT_TEAM_ID: Joi.string()
    .when('WEARABLES_SYNC_ENABLED', { is: 'true', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('HEALTHKIT_TEAM_ID', 'Wearables Sync')
    }),
  HEALTHKIT_KEY_ID: Joi.string()
    .when('WEARABLES_SYNC_ENABLED', { is: 'true', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('HEALTHKIT_KEY_ID', 'Wearables Sync')
    }),
  HEALTHKIT_PRIVATE_KEY: Joi.string()
    .when('WEARABLES_SYNC_ENABLED', { is: 'true', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('HEALTHKIT_PRIVATE_KEY', 'Wearables Sync')
    }),
  // Fitbit settings
  FITBIT_CLIENT_ID: Joi.string()
    .when('WEARABLES_SYNC_ENABLED', { is: 'true', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('FITBIT_CLIENT_ID', 'Wearables Sync')
    }),
  FITBIT_CLIENT_SECRET: Joi.string()
    .when('WEARABLES_SYNC_ENABLED', { is: 'true', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('FITBIT_CLIENT_SECRET', 'Wearables Sync')
    }),
  // Sync settings
  WEARABLES_SYNC_INTERVAL: Joi.number()
    .integer()
    .min(5)
    .max(1440)
    .default(15) // Minutes
    .messages({
      'number.base': errorMessages.invalidType('WEARABLES_SYNC_INTERVAL', 'number'),
      'number.min': errorMessages.invalidRange('WEARABLES_SYNC_INTERVAL', 5, 1440),
      'number.max': errorMessages.invalidRange('WEARABLES_SYNC_INTERVAL', 5, 1440)
    }),
  WEARABLES_MAX_SYNC_DAYS: Joi.number()
    .integer()
    .min(1)
    .max(90)
    .default(30)
    .messages({
      'number.base': errorMessages.invalidType('WEARABLES_MAX_SYNC_DAYS', 'number'),
      'number.min': errorMessages.invalidRange('WEARABLES_MAX_SYNC_DAYS', 1, 90),
      'number.max': errorMessages.invalidRange('WEARABLES_MAX_SYNC_DAYS', 1, 90)
    }),
  WEARABLES_RETRY_ATTEMPTS: Joi.number()
    .integer()
    .min(0)
    .max(10)
    .default(3)
    .messages({
      'number.base': errorMessages.invalidType('WEARABLES_RETRY_ATTEMPTS', 'number'),
      'number.min': errorMessages.invalidRange('WEARABLES_RETRY_ATTEMPTS', 0, 10),
      'number.max': errorMessages.invalidRange('WEARABLES_RETRY_ATTEMPTS', 0, 10)
    }),
  WEARABLES_RETRY_DELAY: Joi.number()
    .integer()
    .min(1000)
    .max(60000)
    .default(5000)
    .messages({
      'number.base': errorMessages.invalidType('WEARABLES_RETRY_DELAY', 'number'),
      'number.min': errorMessages.invalidRange('WEARABLES_RETRY_DELAY', 1000, 60000),
      'number.max': errorMessages.invalidRange('WEARABLES_RETRY_DELAY', 1000, 60000)
    }),
  
  // Health features configuration
  HEALTH_GOALS_MAX_ACTIVE: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      'number.base': errorMessages.invalidType('HEALTH_GOALS_MAX_ACTIVE', 'number'),
      'number.min': errorMessages.invalidRange('HEALTH_GOALS_MAX_ACTIVE', 1, 50),
      'number.max': errorMessages.invalidRange('HEALTH_GOALS_MAX_ACTIVE', 1, 50)
    }),
  HEALTH_INSIGHTS_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('HEALTH_INSIGHTS_ENABLED', ['true', 'false'])
    }),
  HEALTH_INSIGHTS_GENERATION_INTERVAL: Joi.number()
    .integer()
    .min(1)
    .max(168)
    .default(24) // Hours
    .messages({
      'number.base': errorMessages.invalidType('HEALTH_INSIGHTS_GENERATION_INTERVAL', 'number'),
      'number.min': errorMessages.invalidRange('HEALTH_INSIGHTS_GENERATION_INTERVAL', 1, 168),
      'number.max': errorMessages.invalidRange('HEALTH_INSIGHTS_GENERATION_INTERVAL', 1, 168)
    }),
  HEALTH_INSIGHTS_MODELS_PATH: Joi.string()
    .messages({
      'string.base': errorMessages.invalidType('HEALTH_INSIGHTS_MODELS_PATH', 'string')
    }),
  HEALTH_JOURNEY_CONTEXT_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('HEALTH_JOURNEY_CONTEXT_ENABLED', ['true', 'false'])
    }),
  HEALTH_INTERFACES_PACKAGE_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('HEALTH_INTERFACES_PACKAGE_ENABLED', ['true', 'false'])
    }),
  HEALTH_FEATURE_FLAGS_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('HEALTH_FEATURE_FLAGS_ENABLED', ['true', 'false'])
    }),
  HEALTH_FEATURE_ADVANCED_METRICS: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': errorMessages.invalidValue('HEALTH_FEATURE_ADVANCED_METRICS', ['true', 'false'])
    }),
  HEALTH_FEATURE_PREDICTIVE_INSIGHTS: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': errorMessages.invalidValue('HEALTH_FEATURE_PREDICTIVE_INSIGHTS', ['true', 'false'])
    }),
  HEALTH_FEATURE_DEVICE_RECOMMENDATIONS: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': errorMessages.invalidValue('HEALTH_FEATURE_DEVICE_RECOMMENDATIONS', ['true', 'false'])
    }),
  
  // Event streaming configuration
  EVENTS_KAFKA_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('EVENTS_KAFKA_ENABLED', ['true', 'false'])
    }),
  EVENTS_KAFKA_BROKERS: Joi.string()
    .when('EVENTS_KAFKA_ENABLED', { is: 'true', then: Joi.required() })
    .messages({
      'any.required': errorMessages.conditionallyRequired('EVENTS_KAFKA_BROKERS', 'Kafka Events')
    }),
  EVENTS_TOPIC_PREFIX: Joi.string()
    .default('austa.health')
    .messages({
      'string.base': errorMessages.invalidType('EVENTS_TOPIC_PREFIX', 'string')
    }),
  EVENTS_SCHEMA_VALIDATION_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('EVENTS_SCHEMA_VALIDATION_ENABLED', ['true', 'false'])
    }),
  EVENTS_RETRY_ATTEMPTS: Joi.number()
    .integer()
    .min(0)
    .max(10)
    .default(3)
    .messages({
      'number.base': errorMessages.invalidType('EVENTS_RETRY_ATTEMPTS', 'number'),
      'number.min': errorMessages.invalidRange('EVENTS_RETRY_ATTEMPTS', 0, 10),
      'number.max': errorMessages.invalidRange('EVENTS_RETRY_ATTEMPTS', 0, 10)
    }),
  EVENTS_RETRY_DELAY: Joi.number()
    .integer()
    .min(100)
    .max(60000)
    .default(1000)
    .messages({
      'number.base': errorMessages.invalidType('EVENTS_RETRY_DELAY', 'number'),
      'number.min': errorMessages.invalidRange('EVENTS_RETRY_DELAY', 100, 60000),
      'number.max': errorMessages.invalidRange('EVENTS_RETRY_DELAY', 100, 60000)
    }),
  EVENTS_DLQ_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('EVENTS_DLQ_ENABLED', ['true', 'false'])
    }),
  EVENTS_DLQ_TOPIC_PREFIX: Joi.string()
    .default('austa.health.dlq')
    .messages({
      'string.base': errorMessages.invalidType('EVENTS_DLQ_TOPIC_PREFIX', 'string')
    }),
  
  // Caching configuration
  REDIS_URL: Joi.string()
    .required()
    .messages({
      'any.required': errorMessages.required('REDIS_URL'),
      'string.base': errorMessages.invalidType('REDIS_URL', 'connection string')
    }),
  REDIS_TTL: Joi.number()
    .integer()
    .min(60)
    .max(86400)
    .default(3600) // 1 hour default
    .messages({
      'number.base': errorMessages.invalidType('REDIS_TTL', 'number'),
      'number.min': errorMessages.invalidRange('REDIS_TTL', 60, 86400),
      'number.max': errorMessages.invalidRange('REDIS_TTL', 60, 86400)
    }),
  REDIS_CACHE_STRATEGY: Joi.string()
    .valid('lru', 'lfu', 'fifo')
    .default('lru')
    .messages({
      'any.only': errorMessages.invalidValue('REDIS_CACHE_STRATEGY', ['lru', 'lfu', 'fifo'])
    }),
  REDIS_MAX_ITEMS: Joi.number()
    .integer()
    .min(100)
    .max(100000)
    .default(10000)
    .messages({
      'number.base': errorMessages.invalidType('REDIS_MAX_ITEMS', 'number'),
      'number.min': errorMessages.invalidRange('REDIS_MAX_ITEMS', 100, 100000),
      'number.max': errorMessages.invalidRange('REDIS_MAX_ITEMS', 100, 100000)
    }),
  
  // Medical history settings
  MEDICAL_HISTORY_MAX_EVENTS: Joi.number()
    .integer()
    .min(100)
    .max(10000)
    .default(1000)
    .messages({
      'number.base': errorMessages.invalidType('MEDICAL_HISTORY_MAX_EVENTS', 'number'),
      'number.min': errorMessages.invalidRange('MEDICAL_HISTORY_MAX_EVENTS', 100, 10000),
      'number.max': errorMessages.invalidRange('MEDICAL_HISTORY_MAX_EVENTS', 100, 10000)
    }),
  MEDICAL_HISTORY_SYNC_INTERVAL: Joi.number()
    .integer()
    .min(1)
    .max(24)
    .default(6) // Hours
    .messages({
      'number.base': errorMessages.invalidType('MEDICAL_HISTORY_SYNC_INTERVAL', 'number'),
      'number.min': errorMessages.invalidRange('MEDICAL_HISTORY_SYNC_INTERVAL', 1, 24),
      'number.max': errorMessages.invalidRange('MEDICAL_HISTORY_SYNC_INTERVAL', 1, 24)
    }),
  MEDICAL_HISTORY_CACHE_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('MEDICAL_HISTORY_CACHE_ENABLED', ['true', 'false'])
    }),
  
  // Storage configuration
  STORAGE_S3_BUCKET: Joi.string()
    .messages({
      'string.base': errorMessages.invalidType('STORAGE_S3_BUCKET', 'string')
    }),
  STORAGE_S3_REGION: Joi.string()
    .messages({
      'string.base': errorMessages.invalidType('STORAGE_S3_REGION', 'string')
    }),
  STORAGE_S3_PREFIX: Joi.string()
    .default('health')
    .messages({
      'string.base': errorMessages.invalidType('STORAGE_S3_PREFIX', 'string')
    }),
  STORAGE_S3_RETRY_ATTEMPTS: Joi.number()
    .integer()
    .min(0)
    .max(10)
    .default(3)
    .messages({
      'number.base': errorMessages.invalidType('STORAGE_S3_RETRY_ATTEMPTS', 'number'),
      'number.min': errorMessages.invalidRange('STORAGE_S3_RETRY_ATTEMPTS', 0, 10),
      'number.max': errorMessages.invalidRange('STORAGE_S3_RETRY_ATTEMPTS', 0, 10)
    }),
  STORAGE_S3_RETRY_DELAY: Joi.number()
    .integer()
    .min(100)
    .max(10000)
    .default(1000)
    .messages({
      'number.base': errorMessages.invalidType('STORAGE_S3_RETRY_DELAY', 'number'),
      'number.min': errorMessages.invalidRange('STORAGE_S3_RETRY_DELAY', 100, 10000),
      'number.max': errorMessages.invalidRange('STORAGE_S3_RETRY_DELAY', 100, 10000)
    }),

  // Error handling configuration
  ERROR_CLASSIFICATION_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('ERROR_CLASSIFICATION_ENABLED', ['true', 'false'])
    }),
  ERROR_DETAILED_MESSAGES: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('ERROR_DETAILED_MESSAGES', ['true', 'false'])
    }),
  ERROR_LOGGING_LEVEL: Joi.string()
    .valid('none', 'error', 'warn', 'info', 'debug')
    .default('error')
    .messages({
      'any.only': errorMessages.invalidValue('ERROR_LOGGING_LEVEL', ['none', 'error', 'warn', 'info', 'debug'])
    }),

  // Integration with @austa/interfaces package
  INTERFACES_PACKAGE_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('INTERFACES_PACKAGE_ENABLED', ['true', 'false'])
    }),
  INTERFACES_VALIDATION_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': errorMessages.invalidValue('INTERFACES_VALIDATION_ENABLED', ['true', 'false'])
    })
});

/**
 * Exports the validation schema for use in the application bootstrap process.
 * 
 * @example
 * // In main.ts
 * import { validationSchema } from './config/validation.schema';
 * 
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule, {
 *     logger: ['error', 'warn', 'log'],
 *   });
 *   
 *   app.useGlobalPipes(new ValidationPipe());
 *   
 *   const configService = app.get(ConfigService);
 *   // Validate environment variables against the schema
 *   const config = await configService.validateAsync(validationSchema);
 *   
 *   await app.listen(config.PORT);
 * }
 * bootstrap();
 */