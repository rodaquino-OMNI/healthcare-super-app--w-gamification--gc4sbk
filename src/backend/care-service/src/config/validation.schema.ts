import * as Joi from 'joi';
import { JoiValidationError } from '@austa/errors';
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
  CARE_JOURNEY,
} from '@app/care/config/constants';

/**
 * Validation schema for Care Service configuration
 * 
 * This schema ensures all required environment variables are present and correctly formatted.
 * It is used with NestJS ConfigModule for validating environment variables at application startup.
 * 
 * The schema includes validation for:
 * - Core application settings
 * - Database and Redis connections
 * - Authentication configuration
 * - Journey-specific settings for the Care journey
 * - Integration settings for external services
 * - Feature flags and operational parameters
 */
export const validationSchema = Joi.object({
  // Core application settings
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default(CORE.DEFAULT_ENV)
    .description('Application environment')
    .messages({
      'any.only': 'NODE_ENV must be one of: development, production, test',
    }),

  PORT: Joi.number()
    .default(CORE.DEFAULT_PORT)
    .description('Port on which the Care Service will run')
    .messages({
      'number.base': 'PORT must be a valid number',
    }),

  API_PREFIX: Joi.string()
    .default(CORE.DEFAULT_API_PREFIX)
    .description('API endpoint prefix')
    .messages({
      'string.base': 'API_PREFIX must be a string',
    }),

  JOURNEY_CONTEXT: Joi.string()
    .default(CORE.JOURNEY_CONTEXT)
    .valid(CORE.JOURNEY_CONTEXT)
    .description('Journey context identifier')
    .messages({
      'any.only': `JOURNEY_CONTEXT must be '${CORE.JOURNEY_CONTEXT}' for the Care Service`,
    }),

  // Database configuration
  DATABASE_URL: Joi.string()
    .required()
    .description('PostgreSQL connection string')
    .messages({
      'any.required': 'DATABASE_URL is required for database connection',
      'string.base': 'DATABASE_URL must be a valid connection string',
    }),

  DATABASE_MAX_CONNECTIONS: Joi.number()
    .default(DATABASE.DEFAULT_MAX_CONNECTIONS)
    .description('Maximum number of database connections')
    .messages({
      'number.base': 'DATABASE_MAX_CONNECTIONS must be a valid number',
    }),

  DATABASE_IDLE_TIMEOUT_MS: Joi.number()
    .default(DATABASE.DEFAULT_IDLE_TIMEOUT_MS)
    .description('Database connection idle timeout in milliseconds')
    .messages({
      'number.base': 'DATABASE_IDLE_TIMEOUT_MS must be a valid number',
    }),

  DATABASE_SSL_ENABLED: Joi.boolean()
    .default(DATABASE.DEFAULT_SSL_ENABLED)
    .description('Enable SSL for database connections')
    .messages({
      'boolean.base': 'DATABASE_SSL_ENABLED must be a boolean',
    }),

  // Redis configuration
  REDIS_URL: Joi.string()
    .default(REDIS.DEFAULT_URL)
    .description('Redis connection string')
    .messages({
      'string.base': 'REDIS_URL must be a valid connection string',
    }),

  REDIS_TTL: Joi.number()
    .default(REDIS.DEFAULT_TTL)
    .description('Redis cache TTL in seconds')
    .messages({
      'number.base': 'REDIS_TTL must be a valid number',
    }),

  REDIS_PREFIX: Joi.string()
    .default(REDIS.DEFAULT_PREFIX)
    .description('Redis key prefix for Care Service')
    .messages({
      'string.base': 'REDIS_PREFIX must be a string',
    }),

  // Authentication
  JWT_SECRET: Joi.string()
    .required()
    .description('Secret key for JWT token signing')
    .messages({
      'any.required': 'JWT_SECRET is required for secure authentication',
      'string.base': 'JWT_SECRET must be a string',
    }),

  JWT_EXPIRES_IN: Joi.string()
    .default(AUTH.DEFAULT_JWT_EXPIRES)
    .description('JWT token expiration time')
    .messages({
      'string.base': 'JWT_EXPIRES_IN must be a valid duration string (e.g., "1h", "7d")',
    }),

  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .default('7d')
    .description('JWT refresh token expiration time')
    .messages({
      'string.base': 'JWT_REFRESH_EXPIRES_IN must be a valid duration string (e.g., "7d", "30d")',
    }),

  OAUTH_AUTHORITY: Joi.string()
    .default(AUTH.OAUTH.DEFAULT_AUTHORITY)
    .uri()
    .description('OAuth authority URL')
    .messages({
      'string.uri': 'OAUTH_AUTHORITY must be a valid URI',
    }),

  OAUTH_CLIENT_ID: Joi.string()
    .default(AUTH.OAUTH.DEFAULT_CLIENT_ID)
    .description('OAuth client ID')
    .messages({
      'string.base': 'OAUTH_CLIENT_ID must be a string',
    }),

  OAUTH_CLIENT_SECRET: Joi.string()
    .default(AUTH.OAUTH.DEFAULT_CLIENT_SECRET)
    .description('OAuth client secret')
    .messages({
      'string.base': 'OAUTH_CLIENT_SECRET must be a string',
    }),

  OAUTH_AUDIENCE: Joi.string()
    .default(AUTH.OAUTH.DEFAULT_AUDIENCE)
    .description('OAuth audience')
    .messages({
      'string.base': 'OAUTH_AUDIENCE must be a string',
    }),

  // Provider Systems
  PROVIDERS_API_URL: Joi.string()
    .default(PROVIDERS.DEFAULT_API_URL)
    .uri()
    .description('Providers API URL')
    .messages({
      'string.uri': 'PROVIDERS_API_URL must be a valid URI',
    }),

  PROVIDERS_API_KEY: Joi.string()
    .default(PROVIDERS.DEFAULT_API_KEY)
    .description('Providers API key')
    .messages({
      'string.base': 'PROVIDERS_API_KEY must be a string',
    }),

  PROVIDERS_API_TIMEOUT_MS: Joi.number()
    .default(PROVIDERS.DEFAULT_TIMEOUT_MS)
    .description('Providers API timeout in milliseconds')
    .messages({
      'number.base': 'PROVIDERS_API_TIMEOUT_MS must be a valid number',
    }),

  PROVIDERS_CACHE_ENABLED: Joi.boolean()
    .default(PROVIDERS.DEFAULT_CACHE_ENABLED)
    .description('Enable caching for provider data')
    .messages({
      'boolean.base': 'PROVIDERS_CACHE_ENABLED must be a boolean',
    }),

  PROVIDERS_CACHE_TTL: Joi.number()
    .default(PROVIDERS.DEFAULT_CACHE_TTL)
    .description('Provider data cache TTL in seconds')
    .messages({
      'number.base': 'PROVIDERS_CACHE_TTL must be a valid number',
    }),

  PROVIDERS_RETRY_ATTEMPTS: Joi.number()
    .default(PROVIDERS.DEFAULT_RETRY_ATTEMPTS)
    .description('Number of retry attempts for provider API calls')
    .messages({
      'number.base': 'PROVIDERS_RETRY_ATTEMPTS must be a valid number',
    }),

  PROVIDERS_RETRY_DELAY_MS: Joi.number()
    .default(PROVIDERS.DEFAULT_RETRY_DELAY_MS)
    .description('Delay between retry attempts in milliseconds')
    .messages({
      'number.base': 'PROVIDERS_RETRY_DELAY_MS must be a valid number',
    }),

  // Appointment Settings
  APPOINTMENTS_MAX_ADVANCE_DAYS: Joi.number()
    .default(APPOINTMENTS.DEFAULT_MAX_ADVANCE_DAYS)
    .description('Maximum days in advance for appointment booking')
    .messages({
      'number.base': 'APPOINTMENTS_MAX_ADVANCE_DAYS must be a valid number',
    }),

  APPOINTMENTS_REMINDER_SCHEDULE: Joi.string()
    .default(APPOINTMENTS.DEFAULT_REMINDER_SCHEDULE)
    .description('Comma-separated reminder schedule (e.g., "24h,1h")')
    .messages({
      'string.base': 'APPOINTMENTS_REMINDER_SCHEDULE must be a comma-separated string',
    }),

  APPOINTMENTS_DEFAULT_DURATION_MINUTES: Joi.number()
    .default(APPOINTMENTS.DEFAULT_DURATION_MINUTES)
    .description('Default appointment duration in minutes')
    .messages({
      'number.base': 'APPOINTMENTS_DEFAULT_DURATION_MINUTES must be a valid number',
    }),

  APPOINTMENTS_CANCELLATION_POLICY_ENABLED: Joi.boolean()
    .default(APPOINTMENTS.CANCELLATION_POLICY.DEFAULT_ENABLED)
    .description('Enable appointment cancellation policy')
    .messages({
      'boolean.base': 'APPOINTMENTS_CANCELLATION_POLICY_ENABLED must be a boolean',
    }),

  APPOINTMENTS_CANCELLATION_MINIMUM_NOTICE_HOURS: Joi.number()
    .default(APPOINTMENTS.CANCELLATION_POLICY.DEFAULT_MINIMUM_NOTICE_HOURS)
    .description('Minimum notice hours for appointment cancellation')
    .messages({
      'number.base': 'APPOINTMENTS_CANCELLATION_MINIMUM_NOTICE_HOURS must be a valid number',
    }),

  APPOINTMENTS_CANCELLATION_PENALTY_XP_LOSS: Joi.number()
    .default(APPOINTMENTS.CANCELLATION_POLICY.DEFAULT_PENALTY_XP_LOSS)
    .description('XP loss penalty for late appointment cancellation')
    .messages({
      'number.base': 'APPOINTMENTS_CANCELLATION_PENALTY_XP_LOSS must be a valid number',
    }),

  APPOINTMENTS_AVAILABILITY_BUFFER_MINUTES: Joi.number()
    .default(APPOINTMENTS.DEFAULT_AVAILABILITY_BUFFER_MINUTES)
    .description('Buffer time between appointments in minutes')
    .messages({
      'number.base': 'APPOINTMENTS_AVAILABILITY_BUFFER_MINUTES must be a valid number',
    }),

  // Telemedicine Settings
  TELEMEDICINE_ENABLED: Joi.boolean()
    .default(TELEMEDICINE.DEFAULT_ENABLED)
    .description('Enable telemedicine functionality')
    .messages({
      'boolean.base': 'TELEMEDICINE_ENABLED must be a boolean',
    }),

  TELEMEDICINE_PROVIDER: Joi.string()
    .default(TELEMEDICINE.DEFAULT_PROVIDER)
    .description('Telemedicine provider (e.g., "agora")')
    .messages({
      'string.base': 'TELEMEDICINE_PROVIDER must be a string',
    }),

  TELEMEDICINE_API_KEY: Joi.string()
    .when('TELEMEDICINE_ENABLED', {
      is: true,
      then: Joi.string().required(),
      otherwise: Joi.string().optional(),
    })
    .description('Telemedicine API key')
    .messages({
      'any.required': 'TELEMEDICINE_API_KEY is required when telemedicine is enabled',
      'string.base': 'TELEMEDICINE_API_KEY must be a string',
    }),

  TELEMEDICINE_API_URL: Joi.string()
    .when('TELEMEDICINE_ENABLED', {
      is: true,
      then: Joi.string().uri().required(),
      otherwise: Joi.string().uri().optional(),
    })
    .description('Telemedicine API URL')
    .messages({
      'any.required': 'TELEMEDICINE_API_URL is required when telemedicine is enabled',
      'string.uri': 'TELEMEDICINE_API_URL must be a valid URI',
    }),

  TELEMEDICINE_AGORA_APP_ID: Joi.string()
    .default(TELEMEDICINE.AGORA.DEFAULT_APP_ID)
    .description('Agora App ID for telemedicine')
    .messages({
      'string.base': 'TELEMEDICINE_AGORA_APP_ID must be a string',
    }),

  TELEMEDICINE_AGORA_APP_CERTIFICATE: Joi.string()
    .default(TELEMEDICINE.AGORA.DEFAULT_APP_CERTIFICATE)
    .description('Agora App Certificate for telemedicine')
    .messages({
      'string.base': 'TELEMEDICINE_AGORA_APP_CERTIFICATE must be a string',
    }),

  TELEMEDICINE_AGORA_TOKEN_EXPIRATION_SECONDS: Joi.number()
    .default(TELEMEDICINE.AGORA.DEFAULT_TOKEN_EXPIRATION_SECONDS)
    .description('Agora token expiration time in seconds')
    .messages({
      'number.base': 'TELEMEDICINE_AGORA_TOKEN_EXPIRATION_SECONDS must be a valid number',
    }),

  TELEMEDICINE_RECORDING_ENABLED: Joi.boolean()
    .default(TELEMEDICINE.DEFAULT_RECORDING_ENABLED)
    .description('Enable recording for telemedicine sessions')
    .messages({
      'boolean.base': 'TELEMEDICINE_RECORDING_ENABLED must be a boolean',
    }),

  TELEMEDICINE_RECORDING_STORAGE_BUCKET: Joi.string()
    .default(TELEMEDICINE.RECORDING_STORAGE.DEFAULT_BUCKET)
    .description('Storage bucket for telemedicine recordings')
    .messages({
      'string.base': 'TELEMEDICINE_RECORDING_STORAGE_BUCKET must be a string',
    }),

  TELEMEDICINE_RECORDING_STORAGE_REGION: Joi.string()
    .default(TELEMEDICINE.RECORDING_STORAGE.DEFAULT_REGION)
    .description('Storage region for telemedicine recordings')
    .messages({
      'string.base': 'TELEMEDICINE_RECORDING_STORAGE_REGION must be a string',
    }),

  TELEMEDICINE_RECORDING_RETENTION_DAYS: Joi.number()
    .default(TELEMEDICINE.RECORDING_STORAGE.DEFAULT_RETENTION_DAYS)
    .description('Retention period for telemedicine recordings in days')
    .messages({
      'number.base': 'TELEMEDICINE_RECORDING_RETENTION_DAYS must be a valid number',
    }),

  TELEMEDICINE_QUALITY_MINIMUM_BITRATE: Joi.number()
    .default(TELEMEDICINE.QUALITY_THRESHOLDS.DEFAULT_MINIMUM_BITRATE)
    .description('Minimum bitrate for telemedicine quality in bps')
    .messages({
      'number.base': 'TELEMEDICINE_QUALITY_MINIMUM_BITRATE must be a valid number',
    }),

  TELEMEDICINE_QUALITY_MINIMUM_FRAMERATE: Joi.number()
    .default(TELEMEDICINE.QUALITY_THRESHOLDS.DEFAULT_MINIMUM_FRAMERATE)
    .description('Minimum framerate for telemedicine quality')
    .messages({
      'number.base': 'TELEMEDICINE_QUALITY_MINIMUM_FRAMERATE must be a valid number',
    }),

  TELEMEDICINE_QUALITY_CONNECTION_TIMEOUT_MS: Joi.number()
    .default(TELEMEDICINE.QUALITY_THRESHOLDS.DEFAULT_CONNECTION_TIMEOUT_MS)
    .description('Connection timeout for telemedicine in milliseconds')
    .messages({
      'number.base': 'TELEMEDICINE_QUALITY_CONNECTION_TIMEOUT_MS must be a valid number',
    }),

  TELEMEDICINE_SESSION_DURATION_MINUTES: Joi.number()
    .default(TELEMEDICINE.SESSION_DURATION.DEFAULT_MINUTES)
    .description('Default telemedicine session duration in minutes')
    .messages({
      'number.base': 'TELEMEDICINE_SESSION_DURATION_MINUTES must be a valid number',
    }),

  TELEMEDICINE_SESSION_MAXIMUM_MINUTES: Joi.number()
    .default(TELEMEDICINE.SESSION_DURATION.DEFAULT_MAXIMUM_MINUTES)
    .description('Maximum telemedicine session duration in minutes')
    .messages({
      'number.base': 'TELEMEDICINE_SESSION_MAXIMUM_MINUTES must be a valid number',
    }),

  TELEMEDICINE_SESSION_WARNING_TIME_MINUTES: Joi.number()
    .default(TELEMEDICINE.SESSION_DURATION.DEFAULT_WARNING_TIME_MINUTES)
    .description('Warning time before session end in minutes')
    .messages({
      'number.base': 'TELEMEDICINE_SESSION_WARNING_TIME_MINUTES must be a valid number',
    }),

  // Medication Settings
  MEDICATIONS_REMINDER_ENABLED: Joi.boolean()
    .default(MEDICATIONS.DEFAULT_REMINDER_ENABLED)
    .description('Enable medication reminders')
    .messages({
      'boolean.base': 'MEDICATIONS_REMINDER_ENABLED must be a boolean',
    }),

  MEDICATIONS_REMINDER_TIME: Joi.string()
    .default(MEDICATIONS.DEFAULT_REMINDER_TIME)
    .description('Comma-separated reminder times (e.g., "1h,0h")')
    .messages({
      'string.base': 'MEDICATIONS_REMINDER_TIME must be a comma-separated string',
    }),

  MEDICATIONS_ADHERENCE_THRESHOLD: Joi.number()
    .default(MEDICATIONS.DEFAULT_ADHERENCE_THRESHOLD)
    .min(0)
    .max(1)
    .description('Medication adherence threshold (0-1)')
    .messages({
      'number.base': 'MEDICATIONS_ADHERENCE_THRESHOLD must be a valid number',
      'number.min': 'MEDICATIONS_ADHERENCE_THRESHOLD must be at least 0',
      'number.max': 'MEDICATIONS_ADHERENCE_THRESHOLD must be at most 1',
    }),

  MEDICATIONS_REFILL_REMINDER_DAYS: Joi.number()
    .default(MEDICATIONS.DEFAULT_REFILL_REMINDER_DAYS)
    .description('Days before medication refill to send reminder')
    .messages({
      'number.base': 'MEDICATIONS_REFILL_REMINDER_DAYS must be a valid number',
    }),

  MEDICATIONS_MAX_MISSED_DOSES: Joi.number()
    .default(MEDICATIONS.DEFAULT_MAX_MISSED_DOSES)
    .description('Maximum number of missed doses before alert')
    .messages({
      'number.base': 'MEDICATIONS_MAX_MISSED_DOSES must be a valid number',
    }),

  MEDICATIONS_DOSE_WINDOW_MINUTES: Joi.number()
    .default(MEDICATIONS.DEFAULT_DOSE_WINDOW_MINUTES)
    .description('Time window for taking medication in minutes')
    .messages({
      'number.base': 'MEDICATIONS_DOSE_WINDOW_MINUTES must be a valid number',
    }),

  // Treatment Plan Settings
  TREATMENT_PLANS_REMINDER_ENABLED: Joi.boolean()
    .default(TREATMENT_PLANS.DEFAULT_REMINDER_ENABLED)
    .description('Enable treatment plan reminders')
    .messages({
      'boolean.base': 'TREATMENT_PLANS_REMINDER_ENABLED must be a boolean',
    }),

  TREATMENT_PLANS_PROGRESS_UPDATE_FREQUENCY: Joi.string()
    .default(TREATMENT_PLANS.DEFAULT_PROGRESS_UPDATE_FREQUENCY)
    .valid('daily', 'weekly', 'monthly')
    .description('Frequency of treatment plan progress updates')
    .messages({
      'any.only': 'TREATMENT_PLANS_PROGRESS_UPDATE_FREQUENCY must be one of: daily, weekly, monthly',
    }),

  TREATMENT_PLANS_PROGRESS_AT_RISK_THRESHOLD: Joi.number()
    .default(TREATMENT_PLANS.PROGRESS_THRESHOLDS.DEFAULT_AT_RISK)
    .min(0)
    .max(1)
    .description('Threshold for at-risk treatment progress (0-1)')
    .messages({
      'number.base': 'TREATMENT_PLANS_PROGRESS_AT_RISK_THRESHOLD must be a valid number',
      'number.min': 'TREATMENT_PLANS_PROGRESS_AT_RISK_THRESHOLD must be at least 0',
      'number.max': 'TREATMENT_PLANS_PROGRESS_AT_RISK_THRESHOLD must be at most 1',
    }),

  TREATMENT_PLANS_PROGRESS_ON_TRACK_THRESHOLD: Joi.number()
    .default(TREATMENT_PLANS.PROGRESS_THRESHOLDS.DEFAULT_ON_TRACK)
    .min(0)
    .max(1)
    .description('Threshold for on-track treatment progress (0-1)')
    .messages({
      'number.base': 'TREATMENT_PLANS_PROGRESS_ON_TRACK_THRESHOLD must be a valid number',
      'number.min': 'TREATMENT_PLANS_PROGRESS_ON_TRACK_THRESHOLD must be at least 0',
      'number.max': 'TREATMENT_PLANS_PROGRESS_ON_TRACK_THRESHOLD must be at most 1',
    }),

  TREATMENT_PLANS_INTERVENTION_MISSED_ACTIVITIES: Joi.number()
    .default(TREATMENT_PLANS.INTERVENTION_TRIGGERS.DEFAULT_MISSED_ACTIVITIES)
    .description('Number of missed activities before intervention')
    .messages({
      'number.base': 'TREATMENT_PLANS_INTERVENTION_MISSED_ACTIVITIES must be a valid number',
    }),

  TREATMENT_PLANS_INTERVENTION_MISSED_APPOINTMENTS: Joi.number()
    .default(TREATMENT_PLANS.INTERVENTION_TRIGGERS.DEFAULT_MISSED_APPOINTMENTS)
    .description('Number of missed appointments before intervention')
    .messages({
      'number.base': 'TREATMENT_PLANS_INTERVENTION_MISSED_APPOINTMENTS must be a valid number',
    }),

  // Symptom Checker Settings
  SYMPTOMS_CHECKER_ENABLED: Joi.boolean()
    .default(SYMPTOMS_CHECKER.DEFAULT_ENABLED)
    .description('Enable symptom checker functionality')
    .messages({
      'boolean.base': 'SYMPTOMS_CHECKER_ENABLED must be a boolean',
    }),

  SYMPTOMS_CHECKER_PROVIDER: Joi.string()
    .default(SYMPTOMS_CHECKER.DEFAULT_PROVIDER)
    .description('Symptom checker provider (e.g., "internal")')
    .messages({
      'string.base': 'SYMPTOMS_CHECKER_PROVIDER must be a string',
    }),

  SYMPTOMS_CHECKER_API_URL: Joi.string()
    .default(SYMPTOMS_CHECKER.EXTERNAL_API.DEFAULT_URL)
    .uri()
    .description('Symptom checker API URL')
    .messages({
      'string.uri': 'SYMPTOMS_CHECKER_API_URL must be a valid URI',
    }),

  SYMPTOMS_CHECKER_API_KEY: Joi.string()
    .default(SYMPTOMS_CHECKER.EXTERNAL_API.DEFAULT_API_KEY)
    .description('Symptom checker API key')
    .messages({
      'string.base': 'SYMPTOMS_CHECKER_API_KEY must be a string',
    }),

  SYMPTOMS_CHECKER_API_TIMEOUT_MS: Joi.number()
    .default(SYMPTOMS_CHECKER.EXTERNAL_API.DEFAULT_TIMEOUT_MS)
    .description('Symptom checker API timeout in milliseconds')
    .messages({
      'number.base': 'SYMPTOMS_CHECKER_API_TIMEOUT_MS must be a valid number',
    }),

  SYMPTOMS_CHECKER_EMERGENCY_SYMPTOMS: Joi.string()
    .default(SYMPTOMS_CHECKER.DEFAULT_EMERGENCY_SYMPTOMS)
    .description('Comma-separated list of emergency symptoms')
    .messages({
      'string.base': 'SYMPTOMS_CHECKER_EMERGENCY_SYMPTOMS must be a comma-separated string',
    }),

  SYMPTOMS_CHECKER_UPDATE_FREQUENCY: Joi.string()
    .default(SYMPTOMS_CHECKER.DEFAULT_UPDATE_FREQUENCY)
    .valid('daily', 'weekly', 'monthly')
    .description('Frequency of symptom checker updates')
    .messages({
      'any.only': 'SYMPTOMS_CHECKER_UPDATE_FREQUENCY must be one of: daily, weekly, monthly',
    }),

  // Notification Settings
  NOTIFICATIONS_SERVICE_URL: Joi.string()
    .default(NOTIFICATIONS.DEFAULT_SERVICE_URL)
    .uri()
    .description('Notification service URL')
    .messages({
      'string.uri': 'NOTIFICATIONS_SERVICE_URL must be a valid URI',
    }),

  NOTIFICATIONS_API_KEY: Joi.string()
    .default(NOTIFICATIONS.DEFAULT_API_KEY)
    .description('Notification service API key')
    .messages({
      'string.base': 'NOTIFICATIONS_API_KEY must be a string',
    }),

  NOTIFICATIONS_DEFAULT_CHANNEL: Joi.string()
    .default(NOTIFICATIONS.DEFAULT_CHANNEL)
    .description('Default notification channels (comma-separated)')
    .messages({
      'string.base': 'NOTIFICATIONS_DEFAULT_CHANNEL must be a comma-separated string',
    }),

  NOTIFICATIONS_THROTTLING_ENABLED: Joi.boolean()
    .default(NOTIFICATIONS.THROTTLING.DEFAULT_ENABLED)
    .description('Enable notification throttling')
    .messages({
      'boolean.base': 'NOTIFICATIONS_THROTTLING_ENABLED must be a boolean',
    }),

  NOTIFICATIONS_THROTTLING_MAX_PER_HOUR: Joi.number()
    .default(NOTIFICATIONS.THROTTLING.DEFAULT_MAX_PER_HOUR)
    .description('Maximum notifications per hour')
    .messages({
      'number.base': 'NOTIFICATIONS_THROTTLING_MAX_PER_HOUR must be a valid number',
    }),

  NOTIFICATIONS_THROTTLING_MAX_PER_DAY: Joi.number()
    .default(NOTIFICATIONS.THROTTLING.DEFAULT_MAX_PER_DAY)
    .description('Maximum notifications per day')
    .messages({
      'number.base': 'NOTIFICATIONS_THROTTLING_MAX_PER_DAY must be a valid number',
    }),

  NOTIFICATIONS_SERVICE_TIMEOUT: Joi.number()
    .default(5000)
    .description('Notification service timeout in milliseconds')
    .messages({
      'number.base': 'NOTIFICATIONS_SERVICE_TIMEOUT must be a valid number',
    }),

  // Gamification Settings
  GAMIFICATION_ENABLED: Joi.boolean()
    .default(GAMIFICATION.DEFAULT_ENABLED)
    .description('Enable gamification integration')
    .messages({
      'boolean.base': 'GAMIFICATION_ENABLED must be a boolean',
    }),

  GAMIFICATION_SERVICE_URL: Joi.string()
    .default(GAMIFICATION.DEFAULT_SERVICE_URL)
    .uri()
    .description('Gamification service URL')
    .messages({
      'string.uri': 'GAMIFICATION_SERVICE_URL must be a valid URI',
    }),

  GAMIFICATION_API_KEY: Joi.string()
    .default(GAMIFICATION.DEFAULT_API_KEY)
    .description('Gamification service API key')
    .messages({
      'string.base': 'GAMIFICATION_API_KEY must be a string',
    }),

  // Kafka Configuration
  KAFKA_BROKERS: Joi.string()
    .required()
    .description('Comma-separated list of Kafka brokers')
    .messages({
      'any.required': 'KAFKA_BROKERS is required for event messaging',
      'string.base': 'KAFKA_BROKERS must be a comma-separated string',
    }),

  KAFKA_CLIENT_ID: Joi.string()
    .default('care-service')
    .description('Kafka client ID')
    .messages({
      'string.base': 'KAFKA_CLIENT_ID must be a string',
    }),

  // External Integrations
  PHARMACY_NETWORKS_ENABLED: Joi.boolean()
    .default(INTEGRATIONS.PHARMACY_NETWORKS.DEFAULT_ENABLED)
    .description('Enable pharmacy network integration')
    .messages({
      'boolean.base': 'PHARMACY_NETWORKS_ENABLED must be a boolean',
    }),

  PHARMACY_NETWORKS_API_URL: Joi.string()
    .default(INTEGRATIONS.PHARMACY_NETWORKS.DEFAULT_API_URL)
    .uri()
    .description('Pharmacy networks API URL')
    .messages({
      'string.uri': 'PHARMACY_NETWORKS_API_URL must be a valid URI',
    }),

  PHARMACY_NETWORKS_API_KEY: Joi.string()
    .default(INTEGRATIONS.PHARMACY_NETWORKS.DEFAULT_API_KEY)
    .description('Pharmacy networks API key')
    .messages({
      'string.base': 'PHARMACY_NETWORKS_API_KEY must be a string',
    }),

  EMERGENCY_SERVICES_ENABLED: Joi.boolean()
    .default(INTEGRATIONS.EMERGENCY_SERVICES.DEFAULT_ENABLED)
    .description('Enable emergency services integration')
    .messages({
      'boolean.base': 'EMERGENCY_SERVICES_ENABLED must be a boolean',
    }),

  EMERGENCY_SERVICES_API_URL: Joi.string()
    .default(INTEGRATIONS.EMERGENCY_SERVICES.DEFAULT_API_URL)
    .uri()
    .description('Emergency services API URL')
    .messages({
      'string.uri': 'EMERGENCY_SERVICES_API_URL must be a valid URI',
    }),

  EMERGENCY_SERVICES_API_KEY: Joi.string()
    .default(INTEGRATIONS.EMERGENCY_SERVICES.DEFAULT_API_KEY)
    .description('Emergency services API key')
    .messages({
      'string.base': 'EMERGENCY_SERVICES_API_KEY must be a string',
    }),

  EMERGENCY_SERVICES_NUMBER: Joi.string()
    .default(INTEGRATIONS.EMERGENCY_SERVICES.DEFAULT_EMERGENCY_NUMBER)
    .description('Emergency services phone number')
    .messages({
      'string.base': 'EMERGENCY_SERVICES_NUMBER must be a string',
    }),

  // Logging Settings
  LOG_LEVEL: Joi.string()
    .default(LOGGING.DEFAULT_LEVEL)
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .description('Logging level')
    .messages({
      'any.only': 'LOG_LEVEL must be one of: error, warn, info, http, verbose, debug, silly',
    }),

  LOG_FORMAT: Joi.string()
    .default(LOGGING.DEFAULT_FORMAT)
    .valid('json', 'pretty')
    .description('Logging format')
    .messages({
      'any.only': 'LOG_FORMAT must be one of: json, pretty',
    }),

  LOG_REQUEST_LOGGING: Joi.boolean()
    .default(LOGGING.DEFAULT_REQUEST_LOGGING)
    .description('Enable request logging')
    .messages({
      'boolean.base': 'LOG_REQUEST_LOGGING must be a boolean',
    }),

  // Feature Flags
  FEATURE_SYMPTOMS_CHECKER: Joi.boolean()
    .default(FEATURES.DEFAULT_ENABLE_SYMPTOMS_CHECKER)
    .description('Enable symptoms checker feature')
    .messages({
      'boolean.base': 'FEATURE_SYMPTOMS_CHECKER must be a boolean',
    }),

  FEATURE_TREATMENT_TRACKING: Joi.boolean()
    .default(FEATURES.DEFAULT_ENABLE_TREATMENT_TRACKING)
    .description('Enable treatment tracking feature')
    .messages({
      'boolean.base': 'FEATURE_TREATMENT_TRACKING must be a boolean',
    }),

  FEATURE_EMERGENCY_ACCESS: Joi.boolean()
    .default(FEATURES.DEFAULT_ENABLE_EMERGENCY_ACCESS)
    .description('Enable emergency access feature')
    .messages({
      'boolean.base': 'FEATURE_EMERGENCY_ACCESS must be a boolean',
    }),

  FEATURE_VIRTUAL_WAITING_ROOM: Joi.boolean()
    .default(FEATURES.DEFAULT_ENABLE_VIRTUAL_WAITING_ROOM)
    .description('Enable virtual waiting room feature')
    .messages({
      'boolean.base': 'FEATURE_VIRTUAL_WAITING_ROOM must be a boolean',
    }),

  FEATURE_PROVIDER_RATINGS: Joi.boolean()
    .default(FEATURES.DEFAULT_ENABLE_PROVIDER_RATINGS)
    .description('Enable provider ratings feature')
    .messages({
      'boolean.base': 'FEATURE_PROVIDER_RATINGS must be a boolean',
    }),

  FEATURE_DOCUMENT_SHARING: Joi.boolean()
    .default(FEATURES.DEFAULT_ENABLE_DOCUMENT_SHARING)
    .description('Enable document sharing feature')
    .messages({
      'boolean.base': 'FEATURE_DOCUMENT_SHARING must be a boolean',
    }),

  FEATURE_FOLLOW_UP_SUGGESTIONS: Joi.boolean()
    .default(FEATURES.DEFAULT_ENABLE_FOLLOW_UP_SUGGESTIONS)
    .description('Enable follow-up suggestions feature')
    .messages({
      'boolean.base': 'FEATURE_FOLLOW_UP_SUGGESTIONS must be a boolean',
    }),

  // Journey-specific settings
  CARE_JOURNEY_ID: Joi.string()
    .default(CARE_JOURNEY.JOURNEY_ID)
    .valid(CARE_JOURNEY.JOURNEY_ID)
    .description('Care journey identifier')
    .messages({
      'any.only': `CARE_JOURNEY_ID must be '${CARE_JOURNEY.JOURNEY_ID}' for the Care Service`,
    }),

  CARE_JOURNEY_NAME: Joi.string()
    .default(CARE_JOURNEY.JOURNEY_NAME)
    .description('Care journey display name')
    .messages({
      'string.base': 'CARE_JOURNEY_NAME must be a string',
    }),

  CARE_JOURNEY_COLOR: Joi.string()
    .default(CARE_JOURNEY.JOURNEY_COLOR)
    .description('Care journey theme color')
    .messages({
      'string.base': 'CARE_JOURNEY_COLOR must be a string',
    }),

  CARE_JOURNEY_ICON: Joi.string()
    .default(CARE_JOURNEY.JOURNEY_ICON)
    .description('Care journey icon name')
    .messages({
      'string.base': 'CARE_JOURNEY_ICON must be a string',
    }),

  CARE_JOURNEY_PRIORITY: Joi.number()
    .default(CARE_JOURNEY.JOURNEY_PRIORITY)
    .description('Care journey priority (1-3)')
    .messages({
      'number.base': 'CARE_JOURNEY_PRIORITY must be a valid number',
    }),

  CARE_JOURNEY_FEATURES: Joi.string()
    .default(CARE_JOURNEY.JOURNEY_FEATURES.join(','))
    .description('Comma-separated list of enabled journey features')
    .messages({
      'string.base': 'CARE_JOURNEY_FEATURES must be a comma-separated string',
    }),
});