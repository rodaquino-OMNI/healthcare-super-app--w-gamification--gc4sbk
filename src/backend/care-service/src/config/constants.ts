/**
 * Constants for the Care Service
 * 
 * This file centralizes all configuration constants and default values used throughout
 * the Care Service, ensuring consistency and reducing magic values in the codebase.
 * 
 * It contains journey-specific constants for services like appointment scheduling,
 * medication tracking, telemedicine, symptom checker, and integrations with external systems.
 */

// API Version Constants
export const API_VERSIONS = {
  CURRENT: 'v1',
  SUPPORTED: ['v1'],
  DEPRECATED: [],
  SUNSET_DATE: {
    // No deprecated versions yet
  },
};

// Core Constants
export const CORE = {
  DEFAULT_ENV: 'development',
  DEFAULT_PORT: 3002,
  DEFAULT_API_PREFIX: 'api/v1',
  JOURNEY_CONTEXT: 'care',
};

// Database Constants
export const DATABASE = {
  DEFAULT_URL: 'postgresql://postgres:postgres@localhost:5432/austa_care',
  DEFAULT_MAX_CONNECTIONS: 10,
  DEFAULT_IDLE_TIMEOUT_MS: 30000,
  DEFAULT_SSL_ENABLED: false,
};

// Redis Constants
export const REDIS = {
  DEFAULT_URL: 'redis://localhost:6379',
  DEFAULT_TTL: 3600,
  DEFAULT_PREFIX: 'care:',
};

// Authentication Constants
export const AUTH = {
  DEFAULT_JWT_SECRET: 'development-secret',
  DEFAULT_JWT_EXPIRES: '1h',
  OAUTH: {
    DEFAULT_AUTHORITY: 'https://auth.austa.com.br',
    DEFAULT_CLIENT_ID: 'care-service',
    DEFAULT_CLIENT_SECRET: 'development-secret',
    DEFAULT_AUDIENCE: 'api://care-service',
  },
};

// Provider Systems Constants
export const PROVIDERS = {
  DEFAULT_API_URL: 'https://providers-api.austa.com.br',
  DEFAULT_API_KEY: 'development-api-key',
  DEFAULT_TIMEOUT_MS: 5000,
  DEFAULT_CACHE_ENABLED: false,
  DEFAULT_CACHE_TTL: 300, // 5 minutes
  DEFAULT_RETRY_ATTEMPTS: 3,
  DEFAULT_RETRY_DELAY_MS: 1000,
};

// Appointment Constants
export const APPOINTMENTS = {
  DEFAULT_MAX_ADVANCE_DAYS: 90,
  DEFAULT_REMINDER_SCHEDULE: '24h,1h',
  DEFAULT_DURATION_MINUTES: 30,
  CANCELLATION_POLICY: {
    DEFAULT_ENABLED: true,
    DEFAULT_MINIMUM_NOTICE_HOURS: 24,
    DEFAULT_PENALTY_XP_LOSS: 50,
  },
  DEFAULT_AVAILABILITY_BUFFER_MINUTES: 15,
};

// Telemedicine Constants
export const TELEMEDICINE = {
  DEFAULT_ENABLED: true,
  DEFAULT_PROVIDER: 'agora',
  AGORA: {
    DEFAULT_APP_ID: 'development-app-id',
    DEFAULT_APP_CERTIFICATE: 'development-certificate',
    DEFAULT_TOKEN_EXPIRATION_SECONDS: 3600,
  },
  DEFAULT_RECORDING_ENABLED: false,
  RECORDING_STORAGE: {
    DEFAULT_BUCKET: 'austa-telemedicine-recordings',
    DEFAULT_REGION: 'sa-east-1',
    DEFAULT_RETENTION_DAYS: 90,
  },
  QUALITY_THRESHOLDS: {
    DEFAULT_MINIMUM_BITRATE: 350000, // 350 kbps
    DEFAULT_MINIMUM_FRAMERATE: 15,
    DEFAULT_CONNECTION_TIMEOUT_MS: 30000,
  },
  SESSION_DURATION: {
    DEFAULT_MINUTES: 20,
    DEFAULT_MAXIMUM_MINUTES: 60,
    DEFAULT_WARNING_TIME_MINUTES: 5,
  },
};

// Medication Constants
export const MEDICATIONS = {
  DEFAULT_REMINDER_ENABLED: true,
  DEFAULT_REMINDER_TIME: '1h,0h',
  DEFAULT_ADHERENCE_THRESHOLD: 0.8,
  DEFAULT_REFILL_REMINDER_DAYS: 7,
  DEFAULT_MAX_MISSED_DOSES: 3,
  DEFAULT_DOSE_WINDOW_MINUTES: 60,
};

// Treatment Plan Constants
export const TREATMENT_PLANS = {
  DEFAULT_REMINDER_ENABLED: true,
  DEFAULT_PROGRESS_UPDATE_FREQUENCY: 'daily',
  PROGRESS_THRESHOLDS: {
    DEFAULT_AT_RISK: 0.6,
    DEFAULT_ON_TRACK: 0.8,
  },
  INTERVENTION_TRIGGERS: {
    DEFAULT_MISSED_ACTIVITIES: 3,
    DEFAULT_MISSED_APPOINTMENTS: 1,
  },
};

// Symptom Checker Constants
export const SYMPTOMS_CHECKER = {
  DEFAULT_ENABLED: true,
  DEFAULT_PROVIDER: 'internal',
  EXTERNAL_API: {
    DEFAULT_URL: 'https://symptoms-api.austa.com.br',
    DEFAULT_API_KEY: 'development-api-key',
    DEFAULT_TIMEOUT_MS: 10000,
  },
  DEFAULT_EMERGENCY_SYMPTOMS: 'chest_pain,difficulty_breathing,severe_bleeding',
  DEFAULT_UPDATE_FREQUENCY: 'weekly',
};

// Notification Constants
export const NOTIFICATIONS = {
  DEFAULT_SERVICE_URL: 'http://notification-service:3006',
  DEFAULT_API_KEY: 'development-api-key',
  DEFAULT_CHANNEL: 'push,email',
  THROTTLING: {
    DEFAULT_ENABLED: true,
    DEFAULT_MAX_PER_HOUR: 5,
    DEFAULT_MAX_PER_DAY: 20,
  },
  TEMPLATES: {
    DEFAULT_APPOINTMENT_REMINDER: 'care-appointment-reminder',
    DEFAULT_APPOINTMENT_CONFIRMATION: 'care-appointment-confirmation',
    DEFAULT_MEDICATION_REMINDER: 'care-medication-reminder',
    DEFAULT_TREATMENT_UPDATE: 'care-treatment-update',
  },
};

// Gamification Constants
export const GAMIFICATION = {
  DEFAULT_ENABLED: true,
  DEFAULT_SERVICE_URL: 'http://gamification-service:3005',
  DEFAULT_API_KEY: 'development-api-key',
  EVENT_TYPES: {
    APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED',
    APPOINTMENT_ATTENDED: 'APPOINTMENT_ATTENDED',
    APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
    TELEMEDICINE_COMPLETED: 'TELEMEDICINE_COMPLETED',
    MEDICATION_ADHERENCE: 'MEDICATION_ADHERENCE',
    TREATMENT_PROGRESS: 'TREATMENT_PROGRESS',
    SYMPTOM_CHECKER_COMPLETED: 'SYMPTOM_CHECKER_COMPLETED',
  },
  POINT_VALUES: {
    DEFAULT_APPOINTMENT_BOOKED: 10,
    DEFAULT_APPOINTMENT_ATTENDED: 50,
    DEFAULT_TELEMEDICINE_COMPLETED: 50,
    DEFAULT_MEDICATION_PERFECT_WEEK: 100,
    DEFAULT_TREATMENT_MILESTONE: 75,
  },
};

// External Integration Constants
export const INTEGRATIONS = {
  PHARMACY_NETWORKS: {
    DEFAULT_ENABLED: false,
    DEFAULT_API_URL: 'https://pharmacy-api.austa.com.br',
    DEFAULT_API_KEY: 'development-api-key',
    DEFAULT_TIMEOUT_MS: 5000,
    DEFAULT_CACHE_ENABLED: true,
    DEFAULT_CACHE_TTL: 3600, // 1 hour
  },
  EMERGENCY_SERVICES: {
    DEFAULT_ENABLED: false,
    DEFAULT_API_URL: 'https://emergency-api.austa.com.br',
    DEFAULT_API_KEY: 'development-api-key',
    DEFAULT_EMERGENCY_NUMBER: '192',
  },
};

// Logging Constants
export const LOGGING = {
  DEFAULT_LEVEL: 'info',
  DEFAULT_FORMAT: 'json',
  DEFAULT_REQUEST_LOGGING: true,
  DEFAULT_SENSITIVE_DATA_FIELDS: 'password,token,healthData',
};

// Feature Flag Constants
export const FEATURES = {
  DEFAULT_ENABLE_SYMPTOMS_CHECKER: true,
  DEFAULT_ENABLE_TREATMENT_TRACKING: true,
  DEFAULT_ENABLE_EMERGENCY_ACCESS: false,
  DEFAULT_ENABLE_VIRTUAL_WAITING_ROOM: false,
  DEFAULT_ENABLE_PROVIDER_RATINGS: true,
  DEFAULT_ENABLE_DOCUMENT_SHARING: true,
  DEFAULT_ENABLE_FOLLOW_UP_SUGGESTIONS: true,
};

// Journey-Specific Constants
export const CARE_JOURNEY = {
  JOURNEY_ID: 'care',
  JOURNEY_NAME: 'Cuidar-me Agora',
  JOURNEY_COLOR: '#4A90E2', // Blue
  JOURNEY_ICON: 'stethoscope',
  JOURNEY_PRIORITY: 2, // 1 = Health, 2 = Care, 3 = Plan
  JOURNEY_FEATURES: [
    'appointments',
    'telemedicine',
    'medications',
    'treatments',
    'symptom-checker',
    'providers',
  ],
  JOURNEY_EVENTS: [
    GAMIFICATION.EVENT_TYPES.APPOINTMENT_BOOKED,
    GAMIFICATION.EVENT_TYPES.APPOINTMENT_ATTENDED,
    GAMIFICATION.EVENT_TYPES.APPOINTMENT_CANCELLED,
    GAMIFICATION.EVENT_TYPES.TELEMEDICINE_COMPLETED,
    GAMIFICATION.EVENT_TYPES.MEDICATION_ADHERENCE,
    GAMIFICATION.EVENT_TYPES.TREATMENT_PROGRESS,
    GAMIFICATION.EVENT_TYPES.SYMPTOM_CHECKER_COMPLETED,
  ],
};

// API Compatibility Constants
export const API_COMPATIBILITY = {
  V1: {
    APPOINTMENT_STATUS_CODES: {
      SCHEDULED: 'SCHEDULED',
      CONFIRMED: 'CONFIRMED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      MISSED: 'MISSED',
    },
    MEDICATION_FREQUENCY: {
      ONCE: 'ONCE',
      DAILY: 'DAILY',
      TWICE_DAILY: 'TWICE_DAILY',
      THREE_TIMES_DAILY: 'THREE_TIMES_DAILY',
      FOUR_TIMES_DAILY: 'FOUR_TIMES_DAILY',
      WEEKLY: 'WEEKLY',
      MONTHLY: 'MONTHLY',
      AS_NEEDED: 'AS_NEEDED',
    },
    TREATMENT_STATUS: {
      NOT_STARTED: 'NOT_STARTED',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    },
    PROVIDER_TYPES: {
      DOCTOR: 'DOCTOR',
      NURSE: 'NURSE',
      THERAPIST: 'THERAPIST',
      SPECIALIST: 'SPECIALIST',
    },
    TELEMEDICINE_STATUS: {
      SCHEDULED: 'SCHEDULED',
      WAITING_ROOM: 'WAITING_ROOM',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      FAILED: 'FAILED',
    },
  },
};