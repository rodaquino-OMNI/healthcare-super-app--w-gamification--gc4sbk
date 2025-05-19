/**
 * Configuration Module for Care Service
 * 
 * This module provides a clean public API for the Care Service configuration,
 * exporting configuration factory functions, types, constants, and utility methods.
 * It serves as the main entry point for importing configuration across the Care Service.
 */

import { ConfigType, ConfigModule, ConfigService } from '@nestjs/config';
import { configuration } from './configuration';
import { validationSchema } from './validation.schema';

/**
 * Type definition for the Care Service configuration
 * Provides type safety when accessing configuration values
 */
export type CareServiceConfig = ConfigType<typeof configuration>;

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  idleTimeoutMillis: number;
  ssl: boolean;
}

/**
 * Redis configuration interface
 */
export interface RedisConfig {
  url: string;
  ttl: number;
  prefix: string;
}

/**
 * Authentication configuration interface
 */
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  oauth: {
    authority: string;
    clientId: string;
    clientSecret: string;
    audience: string;
  };
}

/**
 * Provider systems integration configuration interface
 */
export interface ProvidersConfig {
  apiUrl: string;
  apiKey: string;
  timeout: number;
  cacheEnabled: boolean;
  cacheTtl: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Appointment scheduling configuration interface
 */
export interface AppointmentsConfig {
  maxAdvanceDays: number;
  reminderSchedule: string;
  defaultDuration: number;
  cancellationPolicy: {
    enabled: boolean;
    minimumNoticeHours: number;
    penaltyXpLoss: number;
  };
  availabilityBuffer: number;
}

/**
 * Telemedicine configuration interface
 */
export interface TelemedicineConfig {
  enabled: boolean;
  provider: string;
  agora: {
    appId: string;
    appCertificate: string;
    tokenExpirationTimeInSeconds: number;
  };
  recordingEnabled: boolean;
  recordingStorage: {
    bucket: string;
    region: string;
    retentionDays: number;
  };
  qualityThresholds: {
    minimumBitrate: number;
    minimumFramerate: number;
    connectionTimeout: number;
  };
  sessionDuration: {
    default: number;
    maximum: number;
    warningTime: number;
  };
}

/**
 * Medication tracking configuration interface
 */
export interface MedicationsConfig {
  reminderEnabled: boolean;
  reminderDefaultTime: string;
  adherenceThreshold: number;
  refillReminderDays: number;
  maxMissedDoses: number;
  doseWindowMinutes: number;
}

/**
 * Treatment plans configuration interface
 */
export interface TreatmentPlansConfig {
  reminderEnabled: boolean;
  progressUpdateFrequency: string;
  progressThresholds: {
    atRisk: number;
    onTrack: number;
  };
  interventionTriggers: {
    missedActivities: number;
    missedAppointments: number;
  };
}

/**
 * Symptom checker configuration interface
 */
export interface SymptomsCheckerConfig {
  enabled: boolean;
  provider: string;
  externalApi: {
    url: string;
    apiKey: string;
    timeout: number;
  };
  emergencySymptoms: string;
  updateFrequency: string;
}

/**
 * Notification service integration configuration interface
 */
export interface NotificationsConfig {
  serviceUrl: string;
  apiKey: string;
  defaultChannel: string;
  throttling: {
    enabled: boolean;
    maxPerHour: number;
    maxPerDay: number;
  };
  templates: {
    appointmentReminder: string;
    appointmentConfirmation: string;
    medicationReminder: string;
    treatmentUpdate: string;
  };
}

/**
 * Gamification integration configuration interface
 */
export interface GamificationConfig {
  enabled: boolean;
  serviceUrl: string;
  apiKey: string;
  defaultEvents: {
    appointmentBooked: string;
    appointmentAttended: string;
    appointmentCancelled: string;
    telemedicineCompleted: string;
    medicationAdherence: string;
    treatmentProgress: string;
    symptomCheckerCompleted: string;
  };
  pointValues: {
    appointmentBooked: number;
    appointmentAttended: number;
    telemedicineCompleted: number;
    medicationPerfectWeek: number;
    treatmentMilestone: number;
  };
}

/**
 * External integrations configuration interface
 */
export interface IntegrationsConfig {
  pharmacyNetworks: {
    enabled: boolean;
    apiUrl: string;
    apiKey: string;
    timeout: number;
    cacheEnabled: boolean;
    cacheTtl: number;
  };
  emergencyServices: {
    enabled: boolean;
    apiUrl: string;
    apiKey: string;
    emergencyNumber: string;
  };
}

/**
 * Logging and monitoring configuration interface
 */
export interface LoggingConfig {
  level: string;
  format: string;
  requestLogging: boolean;
  sensitiveDataFields: string;
  journeyContext: string;
}

/**
 * Feature flags configuration interface
 */
export interface FeaturesConfig {
  enableSymptomsChecker: boolean;
  enableTreatmentTracking: boolean;
  enableEmergencyAccess: boolean;
  enableVirtualWaitingRoom: boolean;
  enableProviderRatings: boolean;
  enableDocumentSharing: boolean;
  enableFollowUpSuggestions: boolean;
}

/**
 * Factory function to create a NestJS ConfigModule for the Care Service
 * @param envFilePath Path to the environment file
 * @returns A dynamically configured NestJS ConfigModule
 */
export const createCareConfigModule = (envFilePath?: string | string[]) => {
  return ConfigModule.forRoot({
    load: [configuration],
    validationSchema,
    envFilePath,
    isGlobal: true,
    cache: true,
    expandVariables: true,
  });
};

/**
 * Utility class for accessing Care Service configuration values
 * Provides type-safe access to configuration properties
 */
export class CareConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Get the complete Care Service configuration
   * @returns The complete typed configuration object
   */
  public getConfig(): CareServiceConfig {
    return this.configService.get<CareServiceConfig>('care');
  }

  /**
   * Get database configuration
   * @returns Database configuration object
   */
  public getDatabaseConfig(): DatabaseConfig {
    return this.configService.get<CareServiceConfig>('care').database;
  }

  /**
   * Get Redis configuration
   * @returns Redis configuration object
   */
  public getRedisConfig(): RedisConfig {
    return this.configService.get<CareServiceConfig>('care').redis;
  }

  /**
   * Get authentication configuration
   * @returns Authentication configuration object
   */
  public getAuthConfig(): AuthConfig {
    return this.configService.get<CareServiceConfig>('care').auth;
  }

  /**
   * Get providers configuration
   * @returns Providers configuration object
   */
  public getProvidersConfig(): ProvidersConfig {
    return this.configService.get<CareServiceConfig>('care').providers;
  }

  /**
   * Get appointments configuration
   * @returns Appointments configuration object
   */
  public getAppointmentsConfig(): AppointmentsConfig {
    return this.configService.get<CareServiceConfig>('care').appointments;
  }

  /**
   * Get telemedicine configuration
   * @returns Telemedicine configuration object
   */
  public getTelemedicineConfig(): TelemedicineConfig {
    return this.configService.get<CareServiceConfig>('care').telemedicine;
  }

  /**
   * Get medications configuration
   * @returns Medications configuration object
   */
  public getMedicationsConfig(): MedicationsConfig {
    return this.configService.get<CareServiceConfig>('care').medications;
  }

  /**
   * Get treatment plans configuration
   * @returns Treatment plans configuration object
   */
  public getTreatmentPlansConfig(): TreatmentPlansConfig {
    return this.configService.get<CareServiceConfig>('care').treatmentPlans;
  }

  /**
   * Get symptoms checker configuration
   * @returns Symptoms checker configuration object
   */
  public getSymptomsCheckerConfig(): SymptomsCheckerConfig {
    return this.configService.get<CareServiceConfig>('care').symptomsChecker;
  }

  /**
   * Get notifications configuration
   * @returns Notifications configuration object
   */
  public getNotificationsConfig(): NotificationsConfig {
    return this.configService.get<CareServiceConfig>('care').notifications;
  }

  /**
   * Get gamification configuration
   * @returns Gamification configuration object
   */
  public getGamificationConfig(): GamificationConfig {
    return this.configService.get<CareServiceConfig>('care').gamification;
  }

  /**
   * Get integrations configuration
   * @returns Integrations configuration object
   */
  public getIntegrationsConfig(): IntegrationsConfig {
    return this.configService.get<CareServiceConfig>('care').integrations;
  }

  /**
   * Get logging configuration
   * @returns Logging configuration object
   */
  public getLoggingConfig(): LoggingConfig {
    return this.configService.get<CareServiceConfig>('care').logging;
  }

  /**
   * Get features configuration
   * @returns Features configuration object
   */
  public getFeaturesConfig(): FeaturesConfig {
    return this.configService.get<CareServiceConfig>('care').features;
  }

  /**
   * Check if a feature is enabled
   * @param featureName Name of the feature to check
   * @returns Boolean indicating if the feature is enabled
   */
  public isFeatureEnabled(featureName: keyof FeaturesConfig): boolean {
    return this.getFeaturesConfig()[featureName];
  }
}

// Export configuration and validation schema
export { configuration, validationSchema };

// Export constants for configuration keys
export const CONFIG_NAMESPACE = 'care';

// Export provider token for dependency injection
export const CARE_CONFIG_SERVICE = 'CARE_CONFIG_SERVICE';

/**
 * Provider definition for CareConfigService
 * Use this to inject the CareConfigService into NestJS components
 */
export const CareConfigServiceProvider = {
  provide: CARE_CONFIG_SERVICE,
  useFactory: (configService: ConfigService) => {
    return new CareConfigService(configService);
  },
  inject: [ConfigService],
};