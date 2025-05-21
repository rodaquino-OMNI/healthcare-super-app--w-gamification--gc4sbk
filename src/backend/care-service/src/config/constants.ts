/**
 * @file constants.ts
 * @description Centralizes all configuration constants and default values used throughout the Care Service.
 * This file ensures consistency and reduces magic values in the codebase.
 * 
 * @version 1.0.0
 */

/**
 * Core application constants
 * @namespace CORE
 */
export const CORE = {
  /** Default environment */
  DEFAULT_ENV: 'development',
  /** Default port for the Care Service */
  DEFAULT_PORT: 3002,
  /** Default API prefix */
  DEFAULT_API_PREFIX: 'api/v1',
  /** Journey identifier for the Care Service */
  JOURNEY_ID: 'care',
  /** Current API version */
  API_VERSION: 'v1',
  /** Semantic version of the Care Service */
  SERVICE_VERSION: '1.0.0',
};

/**
 * Database configuration constants
 * @namespace DATABASE
 */
export const DATABASE = {
  /** Default database connection URL */
  DEFAULT_URL: 'postgresql://postgres:postgres@localhost:5432/austa_care',
  /** Default maximum database connections */
  DEFAULT_MAX_CONNECTIONS: 10,
  /** Default idle timeout in milliseconds */
  DEFAULT_IDLE_TIMEOUT_MS: 30000,
  /** Default SSL configuration */
  DEFAULT_SSL_ENABLED: false,
};

/**
 * Redis configuration constants
 * @namespace REDIS
 */
export const REDIS = {
  /** Default Redis connection URL */
  DEFAULT_URL: 'redis://localhost:6379',
  /** Default TTL in seconds */
  DEFAULT_TTL: 3600,
  /** Default key prefix for Care Service */
  DEFAULT_PREFIX: 'care:',
};

/**
 * Authentication configuration constants
 * @namespace AUTH
 */
export const AUTH = {
  /** Default JWT secret (for development only) */
  DEFAULT_JWT_SECRET: 'development-secret',
  /** Default JWT expiration time */
  DEFAULT_JWT_EXPIRES: '1h',
  /** OAuth configuration */
  OAUTH: {
    /** Default OAuth authority URL */
    DEFAULT_AUTHORITY: 'https://auth.austa.com.br',
    /** Default OAuth client ID */
    DEFAULT_CLIENT_ID: 'care-service',
    /** Default OAuth client secret (for development only) */
    DEFAULT_CLIENT_SECRET: 'development-secret',
    /** Default OAuth audience */
    DEFAULT_AUDIENCE: 'api://care-service',
  },
};

/**
 * Provider systems integration constants
 * @namespace PROVIDERS
 */
export const PROVIDERS = {
  /** Default provider API URL */
  DEFAULT_API_URL: 'https://providers-api.austa.com.br',
  /** Default provider API key (for development only) */
  DEFAULT_API_KEY: 'development-api-key',
  /** Default timeout in milliseconds */
  DEFAULT_TIMEOUT_MS: 5000,
  /** Default cache enabled flag */
  DEFAULT_CACHE_ENABLED: false,
  /** Default cache TTL in seconds */
  DEFAULT_CACHE_TTL: 300,
  /** Default retry attempts */
  DEFAULT_RETRY_ATTEMPTS: 3,
  /** Default retry delay in milliseconds */
  DEFAULT_RETRY_DELAY_MS: 1000,
};

/**
 * Appointment scheduling constants
 * @namespace APPOINTMENTS
 */
export const APPOINTMENTS = {
  /** Maximum days in advance for booking appointments */
  MAX_ADVANCE_DAYS: 90,
  /** Default reminder schedule (comma-separated values) */
  DEFAULT_REMINDER_SCHEDULE: '24h,1h',
  /** Default appointment duration in minutes */
  DEFAULT_DURATION_MINUTES: 30,
  /** Cancellation policy */
  CANCELLATION_POLICY: {
    /** Default cancellation policy enabled flag */
    DEFAULT_ENABLED: true,
    /** Minimum notice hours for cancellation without penalty */
    DEFAULT_MINIMUM_NOTICE_HOURS: 24,
    /** Default XP loss for late cancellation */
    DEFAULT_PENALTY_XP_LOSS: 50,
  },
  /** Default buffer time between appointments in minutes */
  DEFAULT_AVAILABILITY_BUFFER_MINUTES: 15,
};

/**
 * Telemedicine configuration constants
 * @namespace TELEMEDICINE
 */
export const TELEMEDICINE = {
  /** Default telemedicine enabled flag */
  DEFAULT_ENABLED: true,
  /** Default telemedicine provider */
  DEFAULT_PROVIDER: 'agora',
  /** Agora configuration */
  AGORA: {
    /** Default Agora app ID (for development only) */
    DEFAULT_APP_ID: 'development-app-id',
    /** Default Agora app certificate (for development only) */
    DEFAULT_APP_CERTIFICATE: 'development-certificate',
    /** Default token expiration time in seconds */
    DEFAULT_TOKEN_EXPIRATION_SECONDS: 3600,
  },
  /** Default recording enabled flag */
  DEFAULT_RECORDING_ENABLED: false,
  /** Recording storage configuration */
  RECORDING_STORAGE: {
    /** Default S3 bucket for recordings */
    DEFAULT_BUCKET: 'austa-telemedicine-recordings',
    /** Default AWS region for recordings */
    DEFAULT_REGION: 'sa-east-1',
    /** Default retention period in days */
    DEFAULT_RETENTION_DAYS: 90,
  },
  /** Quality thresholds */
  QUALITY_THRESHOLDS: {
    /** Minimum acceptable bitrate in bps */
    DEFAULT_MIN_BITRATE: 350000,
    /** Minimum acceptable framerate */
    DEFAULT_MIN_FRAMERATE: 15,
    /** Connection timeout in milliseconds */
    DEFAULT_CONNECTION_TIMEOUT_MS: 30000,
  },
  /** Session duration settings */
  SESSION_DURATION: {
    /** Default session duration in minutes */
    DEFAULT_DURATION_MINUTES: 20,
    /** Maximum session duration in minutes */
    MAX_DURATION_MINUTES: 60,
    /** Warning time before session end in minutes */
    DEFAULT_WARNING_TIME_MINUTES: 5,
  },
};

/**
 * Medication tracking constants
 * @namespace MEDICATIONS
 */
export const MEDICATIONS = {
  /** Default medication reminders enabled flag */
  DEFAULT_REMINDER_ENABLED: true,
  /** Default reminder times (comma-separated values) */
  DEFAULT_REMINDER_TIMES: '1h,0h',
  /** Threshold for good medication adherence (0.0-1.0) */
  DEFAULT_ADHERENCE_THRESHOLD: 0.8,
  /** Days before medication runs out to send refill reminder */
  DEFAULT_REFILL_REMINDER_DAYS: 7,
  /** Maximum consecutive missed doses before intervention */
  DEFAULT_MAX_MISSED_DOSES: 3,
  /** Window of time in minutes to take medication and still count as adherent */
  DEFAULT_DOSE_WINDOW_MINUTES: 60,
};

/**
 * Treatment plans constants
 * @namespace TREATMENT_PLANS
 */
export const TREATMENT_PLANS = {
  /** Default treatment reminders enabled flag */
  DEFAULT_REMINDER_ENABLED: true,
  /** Default frequency for progress updates */
  DEFAULT_PROGRESS_UPDATE_FREQUENCY: 'daily',
  /** Progress thresholds */
  PROGRESS_THRESHOLDS: {
    /** Threshold for at-risk treatment progress (0.0-1.0) */
    DEFAULT_AT_RISK: 0.6,
    /** Threshold for on-track treatment progress (0.0-1.0) */
    DEFAULT_ON_TRACK: 0.8,
  },
  /** Intervention triggers */
  INTERVENTION_TRIGGERS: {
    /** Number of missed activities before intervention */
    DEFAULT_MISSED_ACTIVITIES: 3,
    /** Number of missed appointments before intervention */
    DEFAULT_MISSED_APPOINTMENTS: 1,
  },
};

/**
 * Symptom checker constants
 * @namespace SYMPTOMS_CHECKER
 */
export const SYMPTOMS_CHECKER = {
  /** Default symptoms checker enabled flag */
  DEFAULT_ENABLED: true,
  /** Default symptoms checker provider */
  DEFAULT_PROVIDER: 'internal',
  /** External API configuration */
  EXTERNAL_API: {
    /** Default external API URL */
    DEFAULT_URL: 'https://symptoms-api.austa.com.br',
    /** Default external API key (for development only) */
    DEFAULT_API_KEY: 'development-api-key',
    /** Default timeout in milliseconds */
    DEFAULT_TIMEOUT_MS: 10000,
  },
  /** Default emergency symptoms (comma-separated values) */
  DEFAULT_EMERGENCY_SYMPTOMS: 'chest_pain,difficulty_breathing,severe_bleeding',
  /** Default frequency for symptoms database updates */
  DEFAULT_UPDATE_FREQUENCY: 'weekly',
};

/**
 * Notification service integration constants
 * @namespace NOTIFICATIONS
 */
export const NOTIFICATIONS = {
  /** Default notification service URL */
  DEFAULT_SERVICE_URL: 'http://notification-service:3006',
  /** Default notification service API key (for development only) */
  DEFAULT_API_KEY: 'development-api-key',
  /** Default notification channels (comma-separated values) */
  DEFAULT_CHANNELS: 'push,email',
  /** Throttling configuration */
  THROTTLING: {
    /** Default throttling enabled flag */
    DEFAULT_ENABLED: true,
    /** Maximum notifications per hour */
    DEFAULT_MAX_PER_HOUR: 5,
    /** Maximum notifications per day */
    DEFAULT_MAX_PER_DAY: 20,
  },
  /** Notification templates */
  TEMPLATES: {
    /** Template ID for appointment reminders */
    APPOINTMENT_REMINDER: 'care-appointment-reminder',
    /** Template ID for appointment confirmations */
    APPOINTMENT_CONFIRMATION: 'care-appointment-confirmation',
    /** Template ID for medication reminders */
    MEDICATION_REMINDER: 'care-medication-reminder',
    /** Template ID for treatment updates */
    TREATMENT_UPDATE: 'care-treatment-update',
  },
};

/**
 * Gamification integration constants
 * @namespace GAMIFICATION
 */
export const GAMIFICATION = {
  /** Default gamification enabled flag */
  DEFAULT_ENABLED: true,
  /** Default gamification service URL */
  DEFAULT_SERVICE_URL: 'http://gamification-service:3005',
  /** Default gamification service API key (for development only) */
  DEFAULT_API_KEY: 'development-api-key',
  /** Event types */
  EVENT_TYPES: {
    /** Event type for booking an appointment */
    APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED',
    /** Event type for attending an appointment */
    APPOINTMENT_ATTENDED: 'APPOINTMENT_ATTENDED',
    /** Event type for cancelling an appointment */
    APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
    /** Event type for completing a telemedicine session */
    TELEMEDICINE_COMPLETED: 'TELEMEDICINE_COMPLETED',
    /** Event type for medication adherence */
    MEDICATION_ADHERENCE: 'MEDICATION_ADHERENCE',
    /** Event type for treatment progress */
    TREATMENT_PROGRESS: 'TREATMENT_PROGRESS',
    /** Event type for completing the symptom checker */
    SYMPTOM_CHECKER_COMPLETED: 'SYMPTOM_CHECKER_COMPLETED',
  },
  /** Point values for different actions */
  POINT_VALUES: {
    /** Points for booking an appointment */
    DEFAULT_APPOINTMENT_BOOKED: 10,
    /** Points for attending an appointment */
    DEFAULT_APPOINTMENT_ATTENDED: 50,
    /** Points for completing a telemedicine session */
    DEFAULT_TELEMEDICINE_COMPLETED: 50,
    /** Points for perfect medication adherence for a week */
    DEFAULT_MEDICATION_PERFECT_WEEK: 100,
    /** Points for reaching a treatment milestone */
    DEFAULT_TREATMENT_MILESTONE: 75,
  },
};

/**
 * External integrations constants
 * @namespace INTEGRATIONS
 */
export const INTEGRATIONS = {
  /** Pharmacy networks integration */
  PHARMACY_NETWORKS: {
    /** Default pharmacy integration enabled flag */
    DEFAULT_ENABLED: false,
    /** Default pharmacy API URL */
    DEFAULT_API_URL: 'https://pharmacy-api.austa.com.br',
    /** Default pharmacy API key (for development only) */
    DEFAULT_API_KEY: 'development-api-key',
    /** Default timeout in milliseconds */
    DEFAULT_TIMEOUT_MS: 5000,
    /** Default cache enabled flag */
    DEFAULT_CACHE_ENABLED: true,
    /** Default cache TTL in seconds */
    DEFAULT_CACHE_TTL: 3600,
  },
  /** Emergency services integration */
  EMERGENCY_SERVICES: {
    /** Default emergency integration enabled flag */
    DEFAULT_ENABLED: false,
    /** Default emergency API URL */
    DEFAULT_API_URL: 'https://emergency-api.austa.com.br',
    /** Default emergency API key (for development only) */
    DEFAULT_API_KEY: 'development-api-key',
    /** Default emergency number */
    DEFAULT_EMERGENCY_NUMBER: '192',
  },
};

/**
 * Logging and monitoring constants
 * @namespace LOGGING
 */
export const LOGGING = {
  /** Default log level */
  DEFAULT_LEVEL: 'info',
  /** Default log format */
  DEFAULT_FORMAT: 'json',
  /** Default request logging enabled flag */
  DEFAULT_REQUEST_LOGGING_ENABLED: true,
  /** Default sensitive data fields (comma-separated values) */
  DEFAULT_SENSITIVE_DATA_FIELDS: 'password,token,healthData',
  /** Journey context identifier */
  JOURNEY_CONTEXT: 'care',
};

/**
 * Feature flags constants
 * @namespace FEATURES
 */
export const FEATURES = {
  /** Default symptoms checker feature enabled flag */
  DEFAULT_SYMPTOMS_CHECKER_ENABLED: true,
  /** Default treatment tracking feature enabled flag */
  DEFAULT_TREATMENT_TRACKING_ENABLED: true,
  /** Default emergency access feature enabled flag */
  DEFAULT_EMERGENCY_ACCESS_ENABLED: false,
  /** Default virtual waiting room feature enabled flag */
  DEFAULT_VIRTUAL_WAITING_ROOM_ENABLED: false,
  /** Default provider ratings feature enabled flag */
  DEFAULT_PROVIDER_RATINGS_ENABLED: true,
  /** Default document sharing feature enabled flag */
  DEFAULT_DOCUMENT_SHARING_ENABLED: true,
  /** Default follow-up suggestions feature enabled flag */
  DEFAULT_FOLLOW_UP_SUGGESTIONS_ENABLED: true,
};

/**
 * API versioning constants
 * @namespace API_VERSIONING
 */
export const API_VERSIONING = {
  /** Current API version */
  CURRENT_VERSION: 'v1',
  /** Supported API versions */
  SUPPORTED_VERSIONS: ['v1'],
  /** Deprecated API versions */
  DEPRECATED_VERSIONS: [],
  /** Version header name */
  VERSION_HEADER: 'X-API-Version',
  /** Default version if not specified */
  DEFAULT_VERSION: 'v1',
};

/**
 * Error handling constants
 * @namespace ERROR_HANDLING
 */
export const ERROR_HANDLING = {
  /** Default error codes by category */
  ERROR_CODES: {
    /** Appointment-related error codes */
    APPOINTMENTS: {
      /** Invalid appointment data */
      INVALID_DATA: 'CARE-APT-001',
      /** Appointment not found */
      NOT_FOUND: 'CARE-APT-002',
      /** Appointment scheduling conflict */
      SCHEDULING_CONFLICT: 'CARE-APT-003',
      /** Late cancellation */
      LATE_CANCELLATION: 'CARE-APT-004',
    },
    /** Medication-related error codes */
    MEDICATIONS: {
      /** Invalid medication data */
      INVALID_DATA: 'CARE-MED-001',
      /** Medication not found */
      NOT_FOUND: 'CARE-MED-002',
      /** Medication interaction detected */
      INTERACTION_DETECTED: 'CARE-MED-003',
    },
    /** Telemedicine-related error codes */
    TELEMEDICINE: {
      /** Invalid session data */
      INVALID_DATA: 'CARE-TLM-001',
      /** Session not found */
      NOT_FOUND: 'CARE-TLM-002',
      /** Connection error */
      CONNECTION_ERROR: 'CARE-TLM-003',
      /** Recording error */
      RECORDING_ERROR: 'CARE-TLM-004',
    },
    /** Provider-related error codes */
    PROVIDERS: {
      /** Invalid provider data */
      INVALID_DATA: 'CARE-PRV-001',
      /** Provider not found */
      NOT_FOUND: 'CARE-PRV-002',
      /** Provider unavailable */
      UNAVAILABLE: 'CARE-PRV-003',
    },
    /** Treatment-related error codes */
    TREATMENTS: {
      /** Invalid treatment data */
      INVALID_DATA: 'CARE-TRT-001',
      /** Treatment not found */
      NOT_FOUND: 'CARE-TRT-002',
      /** Treatment update error */
      UPDATE_ERROR: 'CARE-TRT-003',
    },
    /** Symptom checker-related error codes */
    SYMPTOMS: {
      /** Invalid symptom data */
      INVALID_DATA: 'CARE-SYM-001',
      /** External API error */
      EXTERNAL_API_ERROR: 'CARE-SYM-002',
      /** Emergency condition detected */
      EMERGENCY_DETECTED: 'CARE-SYM-003',
    },
  },
  /** Default retry policy */
  RETRY_POLICY: {
    /** Maximum retry attempts */
    MAX_RETRY_ATTEMPTS: 3,
    /** Base delay in milliseconds */
    BASE_DELAY_MS: 1000,
    /** Maximum delay in milliseconds */
    MAX_DELAY_MS: 10000,
    /** Jitter factor (0.0-1.0) */
    JITTER_FACTOR: 0.1,
  },
};