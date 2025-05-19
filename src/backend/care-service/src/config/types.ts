/**
 * @file Configuration type definitions for the Care Service
 * @description Defines TypeScript interfaces for all Care Service configuration objects,
 * ensuring type safety and consistency throughout the service.
 * 
 * @requires @austa/interfaces - Shared TypeScript interfaces for data models
 * @version 1.0.0
 * @compatibility Requires TypeScript 5.3.3+
 * @compatibility Requires @austa/interfaces 1.0.0+
 * @compatibility Requires NestJS 10.3.0+
 */

/**
 * Version Compatibility:
 * - TypeScript: 5.3.3 or higher
 * - @austa/interfaces: 1.0.0 or higher
 * - NestJS: 10.3.0 or higher
 * 
 * This file defines the type structure for the Care Service configuration.
 * It provides type safety and IntelliSense support for the configuration object
 * defined in configuration.ts.
 */

import { JourneyConfig } from '@austa/interfaces/journey/care';
import { GamificationEventTypes } from '@austa/interfaces/gamification';
import { LogLevel, LogFormat } from '@austa/interfaces/common';

/**
 * This file provides TypeScript interfaces for the configuration object defined in
 * the `configuration.ts` file. These interfaces ensure type safety when accessing
 * configuration properties throughout the Care Service.
 * 
 * Related files:
 * - configuration.ts: Defines the actual configuration values
 * - config.module.ts: Registers the configuration with NestJS
 * 
 * @see configuration.ts for the implementation of these configuration values
 */

/**
 * Core database configuration for the Care Service
 */
export interface CareServiceDatabaseConfig {
  /** Database connection URL */
  url: string;
  /** Maximum number of database connections in the pool */
  maxConnections: number;
  /** Timeout in milliseconds for idle connections */
  idleTimeoutMillis: number;
  /** Whether to use SSL for database connections */
  ssl: boolean;
}

/**
 * Redis configuration for caching and real-time features
 */
export interface CareServiceRedisConfig {
  /** Redis connection URL */
  url: string;
  /** Time-to-live in seconds for cached items */
  ttl: number;
  /** Prefix for Redis keys to avoid collisions */
  prefix: string;
}

/**
 * OAuth configuration for authentication
 */
export interface CareServiceOAuthConfig {
  /** OAuth authority URL */
  authority: string;
  /** Client ID for OAuth authentication */
  clientId: string;
  /** Client secret for OAuth authentication */
  clientSecret: string;
  /** OAuth audience for token validation */
  audience: string;
}

/**
 * Authentication configuration for the Care Service
 */
export interface CareServiceAuthConfig {
  /** Secret key for JWT signing */
  jwtSecret: string;
  /** JWT token expiration time */
  jwtExpiresIn: string;
  /** OAuth configuration */
  oauth: CareServiceOAuthConfig;
}

/**
 * Provider systems integration configuration
 */
export interface CareServiceProvidersConfig {
  /** Provider API URL */
  apiUrl: string;
  /** API key for provider system */
  apiKey: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Whether to enable caching for provider data */
  cacheEnabled: boolean;
  /** Cache TTL in seconds for provider data */
  cacheTtl: number;
  /** Number of retry attempts for failed requests */
  retryAttempts: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay: number;
}

/**
 * Cancellation policy configuration for appointments
 */
export interface CareServiceCancellationPolicyConfig {
  /** Whether the cancellation policy is enabled */
  enabled: boolean;
  /** Minimum notice hours required for cancellation without penalty */
  minimumNoticeHours: number;
  /** XP points lost for late cancellations */
  penaltyXpLoss: number;
}

/**
 * Appointment scheduling configuration
 */
export interface CareServiceAppointmentsConfig {
  /** Maximum number of days in advance for booking appointments */
  maxAdvanceDays: number;
  /** Comma-separated schedule for appointment reminders (e.g., "24h,1h") */
  reminderSchedule: string;
  /** Default appointment duration in minutes */
  defaultDuration: number;
  /** Cancellation policy configuration */
  cancellationPolicy: CareServiceCancellationPolicyConfig;
  /** Buffer time in minutes between appointments */
  availabilityBuffer: number;
}

/**
 * Agora configuration for telemedicine
 */
export interface CareServiceAgoraConfig {
  /** Agora App ID */
  appId: string;
  /** Agora App Certificate */
  appCertificate: string;
  /** Token expiration time in seconds */
  tokenExpirationTimeInSeconds: number;
}

/**
 * Recording storage configuration for telemedicine
 */
export interface CareServiceRecordingStorageConfig {
  /** S3 bucket for storing recordings */
  bucket: string;
  /** AWS region for the S3 bucket */
  region: string;
  /** Number of days to retain recordings */
  retentionDays: number;
}

/**
 * Quality thresholds for telemedicine sessions
 */
export interface CareServiceQualityThresholdsConfig {
  /** Minimum bitrate in bps for acceptable video quality */
  minimumBitrate: number;
  /** Minimum framerate for acceptable video quality */
  minimumFramerate: number;
  /** Connection timeout in milliseconds */
  connectionTimeout: number;
}

/**
 * Session duration configuration for telemedicine
 */
export interface CareServiceSessionDurationConfig {
  /** Default session duration in minutes */
  default: number;
  /** Maximum session duration in minutes */
  maximum: number;
  /** Warning time in minutes before session end */
  warningTime: number;
}

/**
 * Telemedicine configuration
 */
export interface CareServiceTelemedicineConfig {
  /** Whether telemedicine is enabled */
  enabled: boolean;
  /** Telemedicine provider (e.g., "agora") */
  provider: string;
  /** Agora configuration */
  agora: CareServiceAgoraConfig;
  /** Whether recording is enabled for telemedicine sessions */
  recordingEnabled: boolean;
  /** Recording storage configuration */
  recordingStorage: CareServiceRecordingStorageConfig;
  /** Quality thresholds for telemedicine sessions */
  qualityThresholds: CareServiceQualityThresholdsConfig;
  /** Session duration configuration */
  sessionDuration: CareServiceSessionDurationConfig;
}

/**
 * Medication tracking configuration
 */
export interface CareServiceMedicationsConfig {
  /** Whether medication reminders are enabled */
  reminderEnabled: boolean;
  /** Default reminder times (e.g., "1h,0h") */
  reminderDefaultTime: string;
  /** Threshold for medication adherence (0.0-1.0) */
  adherenceThreshold: number;
  /** Days before medication refill to send reminder */
  refillReminderDays: number;
  /** Maximum number of missed doses before alert */
  maxMissedDoses: number;
  /** Time window in minutes for taking medication */
  doseWindowMinutes: number;
}

/**
 * Progress thresholds for treatment plans
 */
export interface CareServiceProgressThresholdsConfig {
  /** Threshold for at-risk treatment progress (0.0-1.0) */
  atRisk: number;
  /** Threshold for on-track treatment progress (0.0-1.0) */
  onTrack: number;
}

/**
 * Intervention triggers for treatment plans
 */
export interface CareServiceInterventionTriggersConfig {
  /** Number of missed activities before intervention */
  missedActivities: number;
  /** Number of missed appointments before intervention */
  missedAppointments: number;
}

/**
 * Treatment plans configuration
 */
export interface CareServiceTreatmentPlansConfig {
  /** Whether treatment reminders are enabled */
  reminderEnabled: boolean;
  /** Frequency of progress updates (e.g., "daily") */
  progressUpdateFrequency: string;
  /** Progress thresholds configuration */
  progressThresholds: CareServiceProgressThresholdsConfig;
  /** Intervention triggers configuration */
  interventionTriggers: CareServiceInterventionTriggersConfig;
}

/**
 * External API configuration for symptom checker
 */
export interface CareServiceSymptomsCheckerExternalApiConfig {
  /** External API URL */
  url: string;
  /** API key for external service */
  apiKey: string;
  /** Request timeout in milliseconds */
  timeout: number;
}

/**
 * Symptom checker configuration
 */
export interface CareServiceSymptomsCheckerConfig {
  /** Whether symptom checker is enabled */
  enabled: boolean;
  /** Symptom checker provider (e.g., "internal") */
  provider: string;
  /** External API configuration */
  externalApi: CareServiceSymptomsCheckerExternalApiConfig;
  /** Comma-separated list of emergency symptoms */
  emergencySymptoms: string;
  /** Frequency of symptom database updates */
  updateFrequency: string;
}

/**
 * Notification throttling configuration
 */
export interface CareServiceNotificationThrottlingConfig {
  /** Whether throttling is enabled */
  enabled: boolean;
  /** Maximum notifications per hour */
  maxPerHour: number;
  /** Maximum notifications per day */
  maxPerDay: number;
}

/**
 * Notification templates configuration
 */
export interface CareServiceNotificationTemplatesConfig {
  /** Template ID for appointment reminders */
  appointmentReminder: string;
  /** Template ID for appointment confirmations */
  appointmentConfirmation: string;
  /** Template ID for medication reminders */
  medicationReminder: string;
  /** Template ID for treatment updates */
  treatmentUpdate: string;
}

/**
 * Notification service integration configuration
 */
export interface CareServiceNotificationsConfig {
  /** Notification service URL */
  serviceUrl: string;
  /** API key for notification service */
  apiKey: string;
  /** Default notification channels (e.g., "push,email") */
  defaultChannel: string;
  /** Notification throttling configuration */
  throttling: CareServiceNotificationThrottlingConfig;
  /** Notification templates configuration */
  templates: CareServiceNotificationTemplatesConfig;
}

/**
 * Default gamification events configuration
 */
export interface CareServiceGamificationDefaultEventsConfig {
  /** Event type for appointment booking */
  appointmentBooked: GamificationEventTypes;
  /** Event type for appointment attendance */
  appointmentAttended: GamificationEventTypes;
  /** Event type for appointment cancellation */
  appointmentCancelled: GamificationEventTypes;
  /** Event type for telemedicine completion */
  telemedicineCompleted: GamificationEventTypes;
  /** Event type for medication adherence */
  medicationAdherence: GamificationEventTypes;
  /** Event type for treatment progress */
  treatmentProgress: GamificationEventTypes;
  /** Event type for symptom checker completion */
  symptomCheckerCompleted: GamificationEventTypes;
}

/**
 * Gamification point values configuration
 */
export interface CareServiceGamificationPointValuesConfig {
  /** Points for booking an appointment */
  appointmentBooked: number;
  /** Points for attending an appointment */
  appointmentAttended: number;
  /** Points for completing a telemedicine session */
  telemedicineCompleted: number;
  /** Points for perfect medication adherence for a week */
  medicationPerfectWeek: number;
  /** Points for reaching a treatment milestone */
  treatmentMilestone: number;
}

/**
 * Gamification integration configuration
 */
export interface CareServiceGamificationConfig {
  /** Whether gamification is enabled */
  enabled: boolean;
  /** Gamification service URL */
  serviceUrl: string;
  /** API key for gamification service */
  apiKey: string;
  /** Default event types configuration */
  defaultEvents: CareServiceGamificationDefaultEventsConfig;
  /** Point values configuration */
  pointValues: CareServiceGamificationPointValuesConfig;
}

/**
 * Pharmacy networks integration configuration
 */
export interface CareServicePharmacyNetworksConfig {
  /** Whether pharmacy integration is enabled */
  enabled: boolean;
  /** Pharmacy API URL */
  apiUrl: string;
  /** API key for pharmacy service */
  apiKey: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Whether caching is enabled for pharmacy data */
  cacheEnabled: boolean;
  /** Cache TTL in seconds for pharmacy data */
  cacheTtl: number;
}

/**
 * Emergency services integration configuration
 */
export interface CareServiceEmergencyServicesConfig {
  /** Whether emergency services integration is enabled */
  enabled: boolean;
  /** Emergency services API URL */
  apiUrl: string;
  /** API key for emergency services */
  apiKey: string;
  /** Emergency phone number */
  emergencyNumber: string;
}

/**
 * External integrations configuration
 */
export interface CareServiceIntegrationsConfig {
  /** Pharmacy networks integration configuration */
  pharmacyNetworks: CareServicePharmacyNetworksConfig;
  /** Emergency services integration configuration */
  emergencyServices: CareServiceEmergencyServicesConfig;
}

/**
 * Logging configuration
 */
export interface CareServiceLoggingConfig {
  /** Log level (debug, info, warn, error) */
  level: LogLevel;
  /** Log format (json, text) */
  format: LogFormat;
  /** Whether request logging is enabled */
  requestLogging: boolean;
  /** Comma-separated list of sensitive data fields to mask */
  sensitiveDataFields: string;
  /** Journey context identifier */
  journeyContext: string;
}

/**
 * Feature flags configuration
 */
export interface CareServiceFeaturesConfig {
  /** Whether symptoms checker is enabled */
  enableSymptomsChecker: boolean;
  /** Whether treatment tracking is enabled */
  enableTreatmentTracking: boolean;
  /** Whether emergency access is enabled */
  enableEmergencyAccess: boolean;
  /** Whether virtual waiting room is enabled */
  enableVirtualWaitingRoom: boolean;
  /** Whether provider ratings are enabled */
  enableProviderRatings: boolean;
  /** Whether document sharing is enabled */
  enableDocumentSharing: boolean;
  /** Whether follow-up suggestions are enabled */
  enableFollowUpSuggestions: boolean;
}

/**
 * Complete Care Service configuration interface
 * @implements {JourneyConfig} from @austa/interfaces/journey/care
 * 
 * Usage example:
 * ```typescript
 * import { CareServiceConfig } from './config/types';
 * import { configuration } from './config/configuration';
 * 
 * // Type-safe configuration access
 * const config = configuration() as CareServiceConfig;
 * 
 * // Access configuration properties with full type safety
 * const appointmentDuration = config.appointments.defaultDuration;
 * const isTelemedicineEnabled = config.telemedicine.enabled;
 * ```
 */
export interface CareServiceConfig extends JourneyConfig {
  /** Environment (development, staging, production) */
  env: string;
  /** Service port number */
  port: number;
  /** API prefix for all endpoints */
  apiPrefix: string;
  /** Database configuration */
  database: CareServiceDatabaseConfig;
  /** Redis configuration */
  redis: CareServiceRedisConfig;
  /** Authentication configuration */
  auth: CareServiceAuthConfig;
  /** Provider systems integration configuration */
  providers: CareServiceProvidersConfig;
  /** Appointment scheduling configuration */
  appointments: CareServiceAppointmentsConfig;
  /** Telemedicine configuration */
  telemedicine: CareServiceTelemedicineConfig;
  /** Medication tracking configuration */
  medications: CareServiceMedicationsConfig;
  /** Treatment plans configuration */
  treatmentPlans: CareServiceTreatmentPlansConfig;
  /** Symptom checker configuration */
  symptomsChecker: CareServiceSymptomsCheckerConfig;
  /** Notification service integration configuration */
  notifications: CareServiceNotificationsConfig;
  /** Gamification integration configuration */
  gamification: CareServiceGamificationConfig;
  /** External integrations configuration */
  integrations: CareServiceIntegrationsConfig;
  /** Logging configuration */
  logging: CareServiceLoggingConfig;
  /** Feature flags configuration */
  features: CareServiceFeaturesConfig;
}