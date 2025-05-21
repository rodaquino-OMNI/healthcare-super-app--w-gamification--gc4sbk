/**
 * @file Configuration type definitions for the Care Service
 * 
 * This file defines TypeScript interfaces for all Care Service configuration objects,
 * ensuring type safety and consistency throughout the service. It includes journey-specific
 * type definitions for appointment scheduling, medication tracking, telemedicine, treatments,
 * and external integrations.
 */

import { JourneyType } from '@austa/interfaces/common';
import { NotificationChannel, NotificationTemplate } from '@austa/interfaces/notification';
import { GamificationEvent } from '@austa/interfaces/gamification';

/**
 * Database configuration options for the Care Service
 */
export interface DatabaseConfig {
  /** Database connection URL */
  url: string;
  /** Maximum number of database connections in the pool */
  maxConnections: number;
  /** Timeout in milliseconds before idle connections are closed */
  idleTimeoutMillis: number;
  /** Whether to use SSL for database connections */
  ssl: boolean;
}

/**
 * Redis configuration options for caching and real-time features
 */
export interface RedisConfig {
  /** Redis connection URL */
  url: string;
  /** Default TTL (time to live) for cached items in seconds */
  ttl: number;
  /** Prefix for all Redis keys to avoid collisions with other services */
  prefix: string;
}

/**
 * OAuth configuration options for authentication
 */
export interface OAuthConfig {
  /** OAuth authority URL */
  authority: string;
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret */
  clientSecret: string;
  /** OAuth audience */
  audience: string;
}

/**
 * Authentication configuration options
 */
export interface AuthConfig {
  /** Secret key for JWT signing */
  jwtSecret: string;
  /** JWT expiration time */
  jwtExpiresIn: string;
  /** OAuth configuration */
  oauth: OAuthConfig;
}

/**
 * Provider systems integration configuration
 */
export interface ProvidersConfig {
  /** Provider API URL */
  apiUrl: string;
  /** API key for provider API */
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
export interface CancellationPolicyConfig {
  /** Whether the cancellation policy is enabled */
  enabled: boolean;
  /** Minimum notice hours required for cancellation without penalty */
  minimumNoticeHours: number;
  /** XP loss penalty for late cancellations */
  penaltyXpLoss: number;
}

/**
 * Appointment scheduling configuration
 */
export interface AppointmentsConfig {
  /** Maximum number of days in advance that appointments can be scheduled */
  maxAdvanceDays: number;
  /** Comma-separated list of reminder times before appointment (e.g., "24h,1h") */
  reminderSchedule: string;
  /** Default appointment duration in minutes */
  defaultDuration: number;
  /** Cancellation policy configuration */
  cancellationPolicy: CancellationPolicyConfig;
  /** Buffer time in minutes between appointments */
  availabilityBuffer: number;
}

/**
 * Agora video service configuration for telemedicine
 */
export interface AgoraConfig {
  /** Agora App ID */
  appId: string;
  /** Agora App Certificate */
  appCertificate: string;
  /** Token expiration time in seconds */
  tokenExpirationTimeInSeconds: number;
}

/**
 * Recording storage configuration for telemedicine sessions
 */
export interface RecordingStorageConfig {
  /** S3 bucket name for storing recordings */
  bucket: string;
  /** AWS region for the S3 bucket */
  region: string;
  /** Number of days to retain recordings before deletion */
  retentionDays: number;
}

/**
 * Quality thresholds configuration for telemedicine video
 */
export interface QualityThresholdsConfig {
  /** Minimum acceptable bitrate in bps */
  minimumBitrate: number;
  /** Minimum acceptable framerate */
  minimumFramerate: number;
  /** Connection timeout in milliseconds */
  connectionTimeout: number;
}

/**
 * Session duration configuration for telemedicine
 */
export interface SessionDurationConfig {
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
export interface TelemedicineConfig {
  /** Whether telemedicine is enabled */
  enabled: boolean;
  /** Telemedicine provider (e.g., "agora") */
  provider: string;
  /** Agora configuration */
  agora: AgoraConfig;
  /** Whether recording is enabled for telemedicine sessions */
  recordingEnabled: boolean;
  /** Recording storage configuration */
  recordingStorage: RecordingStorageConfig;
  /** Quality thresholds for video */
  qualityThresholds: QualityThresholdsConfig;
  /** Session duration configuration */
  sessionDuration: SessionDurationConfig;
}

/**
 * Medication tracking configuration
 */
export interface MedicationsConfig {
  /** Whether medication reminders are enabled */
  reminderEnabled: boolean;
  /** Default reminder times for medications (e.g., "1h,0h") */
  reminderDefaultTime: string;
  /** Threshold for medication adherence (0.0-1.0) */
  adherenceThreshold: number;
  /** Days before medication runs out to send refill reminder */
  refillReminderDays: number;
  /** Maximum number of missed doses before intervention */
  maxMissedDoses: number;
  /** Time window in minutes for taking medication */
  doseWindowMinutes: number;
}

/**
 * Progress thresholds configuration for treatment plans
 */
export interface ProgressThresholdsConfig {
  /** Threshold below which treatment is considered at risk (0.0-1.0) */
  atRisk: number;
  /** Threshold above which treatment is considered on track (0.0-1.0) */
  onTrack: number;
}

/**
 * Intervention triggers configuration for treatment plans
 */
export interface InterventionTriggersConfig {
  /** Number of missed activities that triggers intervention */
  missedActivities: number;
  /** Number of missed appointments that triggers intervention */
  missedAppointments: number;
}

/**
 * Treatment plans configuration
 */
export interface TreatmentPlansConfig {
  /** Whether treatment reminders are enabled */
  reminderEnabled: boolean;
  /** Frequency of progress updates (e.g., "daily", "weekly") */
  progressUpdateFrequency: string;
  /** Progress thresholds configuration */
  progressThresholds: ProgressThresholdsConfig;
  /** Intervention triggers configuration */
  interventionTriggers: InterventionTriggersConfig;
}

/**
 * External API configuration for symptom checker
 */
export interface ExternalApiConfig {
  /** External API URL */
  url: string;
  /** API key for external API */
  apiKey: string;
  /** Request timeout in milliseconds */
  timeout: number;
}

/**
 * Symptom checker configuration
 */
export interface SymptomsCheckerConfig {
  /** Whether symptom checker is enabled */
  enabled: boolean;
  /** Symptom checker provider (e.g., "internal", "external") */
  provider: string;
  /** External API configuration */
  externalApi: ExternalApiConfig;
  /** Comma-separated list of emergency symptoms */
  emergencySymptoms: string;
  /** Frequency of symptom database updates (e.g., "weekly") */
  updateFrequency: string;
}

/**
 * Notification throttling configuration
 */
export interface NotificationThrottlingConfig {
  /** Whether notification throttling is enabled */
  enabled: boolean;
  /** Maximum number of notifications per hour */
  maxPerHour: number;
  /** Maximum number of notifications per day */
  maxPerDay: number;
}

/**
 * Notification templates configuration
 */
export interface NotificationTemplatesConfig {
  /** Template ID for appointment reminders */
  appointmentReminder: NotificationTemplate;
  /** Template ID for appointment confirmations */
  appointmentConfirmation: NotificationTemplate;
  /** Template ID for medication reminders */
  medicationReminder: NotificationTemplate;
  /** Template ID for treatment updates */
  treatmentUpdate: NotificationTemplate;
}

/**
 * Notifications service integration configuration
 */
export interface NotificationsConfig {
  /** Notification service URL */
  serviceUrl: string;
  /** API key for notification service */
  apiKey: string;
  /** Default notification channels (comma-separated) */
  defaultChannel: string;
  /** Notification throttling configuration */
  throttling: NotificationThrottlingConfig;
  /** Notification templates configuration */
  templates: NotificationTemplatesConfig;
}

/**
 * Default gamification events configuration
 */
export interface DefaultEventsConfig {
  /** Event type for appointment booking */
  appointmentBooked: GamificationEvent;
  /** Event type for appointment attendance */
  appointmentAttended: GamificationEvent;
  /** Event type for appointment cancellation */
  appointmentCancelled: GamificationEvent;
  /** Event type for completed telemedicine session */
  telemedicineCompleted: GamificationEvent;
  /** Event type for medication adherence */
  medicationAdherence: GamificationEvent;
  /** Event type for treatment progress */
  treatmentProgress: GamificationEvent;
  /** Event type for completed symptom checker */
  symptomCheckerCompleted: GamificationEvent;
}

/**
 * Point values configuration for gamification events
 */
export interface PointValuesConfig {
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
export interface GamificationConfig {
  /** Whether gamification is enabled */
  enabled: boolean;
  /** Gamification service URL */
  serviceUrl: string;
  /** API key for gamification service */
  apiKey: string;
  /** Default gamification events configuration */
  defaultEvents: DefaultEventsConfig;
  /** Point values configuration */
  pointValues: PointValuesConfig;
}

/**
 * Pharmacy networks integration configuration
 */
export interface PharmacyNetworksConfig {
  /** Whether pharmacy integration is enabled */
  enabled: boolean;
  /** Pharmacy API URL */
  apiUrl: string;
  /** API key for pharmacy API */
  apiKey: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Whether to enable caching for pharmacy data */
  cacheEnabled: boolean;
  /** Cache TTL in seconds for pharmacy data */
  cacheTtl: number;
}

/**
 * Emergency services integration configuration
 */
export interface EmergencyServicesConfig {
  /** Whether emergency services integration is enabled */
  enabled: boolean;
  /** Emergency services API URL */
  apiUrl: string;
  /** API key for emergency services API */
  apiKey: string;
  /** Emergency phone number */
  emergencyNumber: string;
}

/**
 * External integrations configuration
 */
export interface IntegrationsConfig {
  /** Pharmacy networks integration configuration */
  pharmacyNetworks: PharmacyNetworksConfig;
  /** Emergency services integration configuration */
  emergencyServices: EmergencyServicesConfig;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level (e.g., "debug", "info", "warn", "error") */
  level: string;
  /** Log format (e.g., "json", "text") */
  format: string;
  /** Whether to log HTTP requests */
  requestLogging: boolean;
  /** Comma-separated list of sensitive data fields to redact */
  sensitiveDataFields: string;
  /** Journey context identifier */
  journeyContext: JourneyType;
}

/**
 * Feature flags configuration
 */
export interface FeaturesConfig {
  /** Whether to enable the symptoms checker feature */
  enableSymptomsChecker: boolean;
  /** Whether to enable the treatment tracking feature */
  enableTreatmentTracking: boolean;
  /** Whether to enable emergency access feature */
  enableEmergencyAccess: boolean;
  /** Whether to enable virtual waiting room feature */
  enableVirtualWaitingRoom: boolean;
  /** Whether to enable provider ratings feature */
  enableProviderRatings: boolean;
  /** Whether to enable document sharing feature */
  enableDocumentSharing: boolean;
  /** Whether to enable follow-up suggestions feature */
  enableFollowUpSuggestions: boolean;
}

/**
 * Complete Care Service configuration interface
 */
export interface CareServiceConfig {
  /** Environment (e.g., "development", "production") */
  env: string;
  /** Service port number */
  port: number;
  /** API prefix */
  apiPrefix: string;
  /** Database configuration */
  database: DatabaseConfig;
  /** Redis configuration */
  redis: RedisConfig;
  /** Authentication configuration */
  auth: AuthConfig;
  /** Provider systems integration configuration */
  providers: ProvidersConfig;
  /** Appointment scheduling configuration */
  appointments: AppointmentsConfig;
  /** Telemedicine configuration */
  telemedicine: TelemedicineConfig;
  /** Medication tracking configuration */
  medications: MedicationsConfig;
  /** Treatment plans configuration */
  treatmentPlans: TreatmentPlansConfig;
  /** Symptom checker configuration */
  symptomsChecker: SymptomsCheckerConfig;
  /** Notifications service integration configuration */
  notifications: NotificationsConfig;
  /** Gamification integration configuration */
  gamification: GamificationConfig;
  /** External integrations configuration */
  integrations: IntegrationsConfig;
  /** Logging configuration */
  logging: LoggingConfig;
  /** Feature flags configuration */
  features: FeaturesConfig;
}