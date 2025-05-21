import { registerAs } from '@nestjs/config'; // ConfigModule v2.0+, registerAs v2.0+
import { 
  getEnv, 
  getRequiredEnv, 
  parseBoolean, 
  parseNumber, 
  parseArray 
} from '@app/utils/env';
import { JourneyType } from '@austa/interfaces/common';
import { NotificationChannel, NotificationTemplate } from '@austa/interfaces/notification';
import { GamificationEvent } from '@austa/interfaces/gamification';
import { 
  CareServiceConfig,
  DatabaseConfig,
  RedisConfig,
  AuthConfig,
  ProvidersConfig,
  AppointmentsConfig,
  TelemedicineConfig,
  MedicationsConfig,
  TreatmentPlansConfig,
  SymptomsCheckerConfig,
  NotificationsConfig,
  GamificationConfig,
  IntegrationsConfig,
  LoggingConfig,
  FeaturesConfig
} from './types';

/**
 * Defines the configuration function for the Care Service.
 * This configuration provides all environment-specific settings and parameters
 * needed for the Care Journey components.
 * 
 * Uses standardized environment variable utilities for improved error handling,
 * type safety, and validation.
 * 
 * @returns A configuration object containing various settings for the Care Service.
 */
export const configuration = registerAs<CareServiceConfig>('care', () => {
  // Journey context for prefixing and validation
  const journeyContext: JourneyType = 'care';
  
  return {
    // Core application settings
    env: getEnv('NODE_ENV', 'development'),
    port: parseNumber(getEnv('CARE_SERVICE_PORT', '3002')),
    apiPrefix: getEnv('CARE_SERVICE_API_PREFIX', 'api/v1'),
    
    // Database configuration
    database: {
      url: getRequiredEnv('CARE_SERVICE_DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/austa_care'),
      maxConnections: parseNumber(getEnv('CARE_SERVICE_DB_MAX_CONNECTIONS', '10')),
      idleTimeoutMillis: parseNumber(getEnv('CARE_SERVICE_DB_IDLE_TIMEOUT', '30000')),
      ssl: parseBoolean(getEnv('CARE_SERVICE_DB_SSL', 'false')),
    } as DatabaseConfig,

    // Redis configuration (for caching and real-time features)
    redis: {
      url: getRequiredEnv('CARE_SERVICE_REDIS_URL', 'redis://localhost:6379'),
      ttl: parseNumber(getEnv('CARE_SERVICE_REDIS_TTL', '3600')),
      prefix: getEnv('CARE_SERVICE_REDIS_PREFIX', `${journeyContext}:`),
    } as RedisConfig,

    // Authentication configuration
    auth: {
      jwtSecret: getRequiredEnv('CARE_SERVICE_JWT_SECRET', 'development-secret'),
      jwtExpiresIn: getEnv('CARE_SERVICE_JWT_EXPIRES', '1h'),
      oauth: {
        authority: getRequiredEnv('CARE_SERVICE_OAUTH_AUTHORITY', 'https://auth.austa.com.br'),
        clientId: getRequiredEnv('CARE_SERVICE_OAUTH_CLIENT_ID', 'care-service'),
        clientSecret: getRequiredEnv('CARE_SERVICE_OAUTH_CLIENT_SECRET', 'development-secret'),
        audience: getEnv('CARE_SERVICE_OAUTH_AUDIENCE', 'api://care-service'),
      },
    } as AuthConfig,

    // Provider systems integration
    providers: {
      apiUrl: getRequiredEnv('CARE_SERVICE_PROVIDERS_API_URL', 'https://providers-api.austa.com.br'),
      apiKey: getRequiredEnv('CARE_SERVICE_PROVIDERS_API_KEY', 'development-api-key'),
      timeout: parseNumber(getEnv('CARE_SERVICE_PROVIDERS_TIMEOUT', '5000')),
      cacheEnabled: parseBoolean(getEnv('CARE_SERVICE_PROVIDERS_CACHE_ENABLED', 'false')),
      cacheTtl: parseNumber(getEnv('CARE_SERVICE_PROVIDERS_CACHE_TTL', '300')), // 5 minutes default
      retryAttempts: parseNumber(getEnv('CARE_SERVICE_PROVIDERS_RETRY_ATTEMPTS', '3')),
      retryDelay: parseNumber(getEnv('CARE_SERVICE_PROVIDERS_RETRY_DELAY', '1000')),
    } as ProvidersConfig,

    // Appointment scheduling
    appointments: {
      maxAdvanceDays: parseNumber(getEnv('CARE_SERVICE_MAX_ADVANCE_DAYS', '90')),
      reminderSchedule: getEnv('CARE_SERVICE_APPOINTMENT_REMINDER_SCHEDULE', '24h,1h'),
      defaultDuration: parseNumber(getEnv('CARE_SERVICE_DEFAULT_APPOINTMENT_DURATION', '30')), // minutes
      cancellationPolicy: {
        enabled: parseBoolean(getEnv('CARE_SERVICE_CANCELLATION_POLICY_ENABLED', 'true')),
        minimumNoticeHours: parseNumber(getEnv('CARE_SERVICE_MIN_CANCELLATION_HOURS', '24')),
        penaltyXpLoss: parseNumber(getEnv('CARE_SERVICE_CANCELLATION_XP_LOSS', '50')),
      },
      availabilityBuffer: parseNumber(getEnv('CARE_SERVICE_AVAILABILITY_BUFFER', '15')), // minutes between appointments
    } as AppointmentsConfig,

    // Telemedicine configuration
    telemedicine: {
      enabled: parseBoolean(getEnv('CARE_SERVICE_TELEMEDICINE_ENABLED', 'true')),
      provider: getEnv('CARE_SERVICE_TELEMEDICINE_PROVIDER', 'agora'),
      agora: {
        appId: getRequiredEnv('CARE_SERVICE_AGORA_APP_ID', 'development-app-id'),
        appCertificate: getRequiredEnv('CARE_SERVICE_AGORA_APP_CERTIFICATE', 'development-certificate'),
        tokenExpirationTimeInSeconds: parseNumber(getEnv('CARE_SERVICE_AGORA_TOKEN_EXPIRATION', '3600')),
      },
      recordingEnabled: parseBoolean(getEnv('CARE_SERVICE_TELEMEDICINE_RECORDING', 'false')),
      recordingStorage: {
        bucket: getEnv('CARE_SERVICE_TELEMEDICINE_RECORDING_BUCKET', 'austa-telemedicine-recordings'),
        region: getEnv('CARE_SERVICE_TELEMEDICINE_RECORDING_REGION', 'sa-east-1'),
        retentionDays: parseNumber(getEnv('CARE_SERVICE_RECORDING_RETENTION_DAYS', '90')),
      },
      qualityThresholds: {
        minimumBitrate: parseNumber(getEnv('CARE_SERVICE_TELEMEDICINE_MIN_BITRATE', '350000')), // 350 kbps
        minimumFramerate: parseNumber(getEnv('CARE_SERVICE_TELEMEDICINE_MIN_FRAMERATE', '15')),
        connectionTimeout: parseNumber(getEnv('CARE_SERVICE_TELEMEDICINE_CONNECTION_TIMEOUT', '30000')),
      },
      sessionDuration: {
        default: parseNumber(getEnv('CARE_SERVICE_TELEMEDICINE_DEFAULT_DURATION', '20')), // minutes
        maximum: parseNumber(getEnv('CARE_SERVICE_TELEMEDICINE_MAX_DURATION', '60')), // minutes
        warningTime: parseNumber(getEnv('CARE_SERVICE_TELEMEDICINE_WARNING_TIME', '5')), // minutes before end
      },
    } as TelemedicineConfig,

    // Medication tracking
    medications: {
      reminderEnabled: parseBoolean(getEnv('CARE_SERVICE_MEDICATION_REMINDERS', 'true')),
      reminderDefaultTime: getEnv('CARE_SERVICE_MEDICATION_DEFAULT_REMINDER_TIME', '1h,0h'),
      adherenceThreshold: parseNumber(getEnv('CARE_SERVICE_MEDICATION_ADHERENCE_THRESHOLD', '0.8')),
      refillReminderDays: parseNumber(getEnv('CARE_SERVICE_REFILL_REMINDER_DAYS', '7')),
      maxMissedDoses: parseNumber(getEnv('CARE_SERVICE_MAX_MISSED_DOSES', '3')),
      doseWindowMinutes: parseNumber(getEnv('CARE_SERVICE_DOSE_WINDOW_MINUTES', '60')),
    } as MedicationsConfig,

    // Treatment plans
    treatmentPlans: {
      reminderEnabled: parseBoolean(getEnv('CARE_SERVICE_TREATMENT_REMINDERS', 'true')),
      progressUpdateFrequency: getEnv('CARE_SERVICE_TREATMENT_PROGRESS_FREQUENCY', 'daily'),
      progressThresholds: {
        atRisk: parseNumber(getEnv('CARE_SERVICE_TREATMENT_AT_RISK_THRESHOLD', '0.6')),
        onTrack: parseNumber(getEnv('CARE_SERVICE_TREATMENT_ON_TRACK_THRESHOLD', '0.8')),
      },
      interventionTriggers: {
        missedActivities: parseNumber(getEnv('CARE_SERVICE_TREATMENT_MISSED_ACTIVITIES', '3')),
        missedAppointments: parseNumber(getEnv('CARE_SERVICE_TREATMENT_MISSED_APPOINTMENTS', '1')),
      },
    } as TreatmentPlansConfig,

    // Symptom checker
    symptomsChecker: {
      enabled: parseBoolean(getEnv('CARE_SERVICE_SYMPTOMS_CHECKER_ENABLED', 'true')),
      provider: getEnv('CARE_SERVICE_SYMPTOMS_CHECKER_PROVIDER', 'internal'),
      externalApi: {
        url: getRequiredEnv('CARE_SERVICE_SYMPTOMS_CHECKER_API_URL', 'https://symptoms-api.austa.com.br'),
        apiKey: getRequiredEnv('CARE_SERVICE_SYMPTOMS_CHECKER_API_KEY', 'development-api-key'),
        timeout: parseNumber(getEnv('CARE_SERVICE_SYMPTOMS_CHECKER_TIMEOUT', '10000')),
      },
      emergencySymptoms: parseArray(getEnv('CARE_SERVICE_EMERGENCY_SYMPTOMS', 'chest_pain,difficulty_breathing,severe_bleeding')),
      updateFrequency: getEnv('CARE_SERVICE_SYMPTOMS_UPDATE_FREQUENCY', 'weekly'),
    } as SymptomsCheckerConfig,

    // Notification service integration
    notifications: {
      serviceUrl: getRequiredEnv('CARE_SERVICE_NOTIFICATIONS_URL', 'http://notification-service:3006'),
      apiKey: getRequiredEnv('CARE_SERVICE_NOTIFICATIONS_API_KEY', 'development-api-key'),
      defaultChannel: parseArray<NotificationChannel>(getEnv('CARE_SERVICE_DEFAULT_NOTIFICATION_CHANNEL', 'push,email')),
      throttling: {
        enabled: parseBoolean(getEnv('CARE_SERVICE_NOTIFICATION_THROTTLING', 'true')),
        maxPerHour: parseNumber(getEnv('CARE_SERVICE_MAX_NOTIFICATIONS_HOUR', '5')),
        maxPerDay: parseNumber(getEnv('CARE_SERVICE_MAX_NOTIFICATIONS_DAY', '20')),
      },
      templates: {
        appointmentReminder: getEnv('CARE_SERVICE_APPOINTMENT_REMINDER_TEMPLATE', 'care-appointment-reminder') as NotificationTemplate,
        appointmentConfirmation: getEnv('CARE_SERVICE_APPOINTMENT_CONFIRMATION_TEMPLATE', 'care-appointment-confirmation') as NotificationTemplate,
        medicationReminder: getEnv('CARE_SERVICE_MEDICATION_REMINDER_TEMPLATE', 'care-medication-reminder') as NotificationTemplate,
        treatmentUpdate: getEnv('CARE_SERVICE_TREATMENT_UPDATE_TEMPLATE', 'care-treatment-update') as NotificationTemplate,
      },
    } as NotificationsConfig,

    // Gamification integration
    gamification: {
      enabled: parseBoolean(getEnv('CARE_SERVICE_GAMIFICATION_ENABLED', 'true')),
      serviceUrl: getRequiredEnv('CARE_SERVICE_GAMIFICATION_URL', 'http://gamification-service:3005'),
      apiKey: getRequiredEnv('CARE_SERVICE_GAMIFICATION_API_KEY', 'development-api-key'),
      defaultEvents: {
        appointmentBooked: 'APPOINTMENT_BOOKED' as GamificationEvent,
        appointmentAttended: 'APPOINTMENT_ATTENDED' as GamificationEvent,
        appointmentCancelled: 'APPOINTMENT_CANCELLED' as GamificationEvent,
        telemedicineCompleted: 'TELEMEDICINE_COMPLETED' as GamificationEvent,
        medicationAdherence: 'MEDICATION_ADHERENCE' as GamificationEvent,
        treatmentProgress: 'TREATMENT_PROGRESS' as GamificationEvent,
        symptomCheckerCompleted: 'SYMPTOM_CHECKER_COMPLETED' as GamificationEvent,
      },
      pointValues: {
        appointmentBooked: parseNumber(getEnv('CARE_SERVICE_POINTS_APPOINTMENT_BOOKED', '10')),
        appointmentAttended: parseNumber(getEnv('CARE_SERVICE_POINTS_APPOINTMENT_ATTENDED', '50')),
        telemedicineCompleted: parseNumber(getEnv('CARE_SERVICE_POINTS_TELEMEDICINE_COMPLETED', '50')),
        medicationPerfectWeek: parseNumber(getEnv('CARE_SERVICE_POINTS_MEDICATION_PERFECT_WEEK', '100')),
        treatmentMilestone: parseNumber(getEnv('CARE_SERVICE_POINTS_TREATMENT_MILESTONE', '75')),
      },
    } as GamificationConfig,

    // External integrations
    integrations: {
      pharmacyNetworks: {
        enabled: parseBoolean(getEnv('CARE_SERVICE_PHARMACY_INTEGRATION', 'false')),
        apiUrl: getRequiredEnv('CARE_SERVICE_PHARMACY_API_URL', 'https://pharmacy-api.austa.com.br'),
        apiKey: getRequiredEnv('CARE_SERVICE_PHARMACY_API_KEY', 'development-api-key'),
        timeout: parseNumber(getEnv('CARE_SERVICE_PHARMACY_TIMEOUT', '5000')),
        cacheEnabled: parseBoolean(getEnv('CARE_SERVICE_PHARMACY_CACHE_ENABLED', 'true')),
        cacheTtl: parseNumber(getEnv('CARE_SERVICE_PHARMACY_CACHE_TTL', '3600')), // 1 hour
      },
      emergencyServices: {
        enabled: parseBoolean(getEnv('CARE_SERVICE_EMERGENCY_INTEGRATION', 'false')),
        apiUrl: getRequiredEnv('CARE_SERVICE_EMERGENCY_API_URL', 'https://emergency-api.austa.com.br'),
        apiKey: getRequiredEnv('CARE_SERVICE_EMERGENCY_API_KEY', 'development-api-key'),
        emergencyNumber: getEnv('CARE_SERVICE_EMERGENCY_NUMBER', '192'),
      },
    } as IntegrationsConfig,

    // Logging and monitoring
    logging: {
      level: getEnv('CARE_SERVICE_LOG_LEVEL', 'info'),
      format: getEnv('CARE_SERVICE_LOG_FORMAT', 'json'),
      requestLogging: parseBoolean(getEnv('CARE_SERVICE_REQUEST_LOGGING', 'true')),
      sensitiveDataFields: parseArray(getEnv('CARE_SERVICE_SENSITIVE_DATA_FIELDS', 'password,token,healthData')),
      journeyContext,
    } as LoggingConfig,

    // Feature flags
    features: {
      enableSymptomsChecker: parseBoolean(getEnv('CARE_SERVICE_ENABLE_SYMPTOMS_CHECKER', 'true')),
      enableTreatmentTracking: parseBoolean(getEnv('CARE_SERVICE_ENABLE_TREATMENT_TRACKING', 'true')),
      enableEmergencyAccess: parseBoolean(getEnv('CARE_SERVICE_ENABLE_EMERGENCY_ACCESS', 'false')),
      enableVirtualWaitingRoom: parseBoolean(getEnv('CARE_SERVICE_ENABLE_VIRTUAL_WAITING_ROOM', 'false')),
      enableProviderRatings: parseBoolean(getEnv('CARE_SERVICE_ENABLE_PROVIDER_RATINGS', 'true')),
      enableDocumentSharing: parseBoolean(getEnv('CARE_SERVICE_ENABLE_DOCUMENT_SHARING', 'true')),
      enableFollowUpSuggestions: parseBoolean(getEnv('CARE_SERVICE_ENABLE_FOLLOW_UP_SUGGESTIONS', 'true')),
    } as FeaturesConfig,
  };
});