/**
 * Care Service Configuration Module
 * 
 * This module provides a clean public API for the Care Service configuration,
 * exporting configuration factory functions, types, constants, and utility methods.
 * It serves as the main entry point for importing configuration across the Care Service,
 * enabling standardized imports and hiding implementation details.
 */

// Export the main configuration object
export { configuration } from './configuration';

// Export the validation schema
export { validationSchema } from './validation.schema';

// Import types from NestJS for type definitions
import { ConfigType } from '@nestjs/config';
import { configuration } from './configuration';

/**
 * Type definition for the Care Service configuration object.
 * This provides type safety when accessing configuration values.
 */
export type CareServiceConfig = ConfigType<typeof configuration>;

/**
 * Type definition for the database configuration section.
 */
export type DatabaseConfig = CareServiceConfig['database'];

/**
 * Type definition for the Redis configuration section.
 */
export type RedisConfig = CareServiceConfig['redis'];

/**
 * Type definition for the authentication configuration section.
 */
export type AuthConfig = CareServiceConfig['auth'];

/**
 * Type definition for the provider systems integration configuration section.
 */
export type ProvidersConfig = CareServiceConfig['providers'];

/**
 * Type definition for the appointment scheduling configuration section.
 */
export type AppointmentsConfig = CareServiceConfig['appointments'];

/**
 * Type definition for the telemedicine configuration section.
 */
export type TelemedicineConfig = CareServiceConfig['telemedicine'];

/**
 * Type definition for the medication tracking configuration section.
 */
export type MedicationsConfig = CareServiceConfig['medications'];

/**
 * Type definition for the treatment plans configuration section.
 */
export type TreatmentPlansConfig = CareServiceConfig['treatmentPlans'];

/**
 * Type definition for the symptom checker configuration section.
 */
export type SymptomsCheckerConfig = CareServiceConfig['symptomsChecker'];

/**
 * Type definition for the notification service integration configuration section.
 */
export type NotificationsConfig = CareServiceConfig['notifications'];

/**
 * Type definition for the gamification integration configuration section.
 */
export type GamificationConfig = CareServiceConfig['gamification'];

/**
 * Type definition for the external integrations configuration section.
 */
export type IntegrationsConfig = CareServiceConfig['integrations'];

/**
 * Type definition for the logging and monitoring configuration section.
 */
export type LoggingConfig = CareServiceConfig['logging'];

/**
 * Type definition for the feature flags configuration section.
 */
export type FeaturesConfig = CareServiceConfig['features'];

/**
 * Configuration module for the Care Service.
 * 
 * This module provides factory functions and utilities for accessing configuration values.
 */
export const CareServiceConfigModule = {
  /**
   * Creates a NestJS ConfigModule for the Care Service.
   * 
   * @returns A configured NestJS ConfigModule for the Care Service.
   */
  forRoot() {
    const { ConfigModule } = require('@nestjs/config');
    return ConfigModule.forRoot({
      load: [configuration],
      validationSchema,
      validationOptions: {
        abortEarly: false,
      },
      isGlobal: true,
    });
  },

  /**
   * Creates a NestJS ConfigModule for the Care Service with custom options.
   * 
   * @param options Custom options for the ConfigModule.
   * @returns A configured NestJS ConfigModule for the Care Service.
   */
  forRootAsync(options: any) {
    const { ConfigModule } = require('@nestjs/config');
    return ConfigModule.forRootAsync({
      ...options,
      load: [configuration],
    });
  },
};

/**
 * Utility functions for accessing configuration values.
 */
export const ConfigUtils = {
  /**
   * Gets a configuration value from the Care Service configuration.
   * 
   * @param config The Care Service configuration object.
   * @param path The path to the configuration value, using dot notation.
   * @param defaultValue The default value to return if the configuration value is not found.
   * @returns The configuration value, or the default value if not found.
   */
  get<T>(config: CareServiceConfig, path: string, defaultValue?: T): T {
    const parts = path.split('.');
    let current: any = config;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return defaultValue as T;
      }
      current = current[part];
    }

    return current !== undefined ? current : defaultValue as T;
  },

  /**
   * Gets a database configuration value.
   * 
   * @param config The Care Service configuration object.
   * @param key The database configuration key.
   * @param defaultValue The default value to return if the configuration value is not found.
   * @returns The database configuration value, or the default value if not found.
   */
  getDatabase<K extends keyof DatabaseConfig, T extends DatabaseConfig[K]>(
    config: CareServiceConfig,
    key: K,
    defaultValue?: T
  ): T {
    return config.database?.[key] !== undefined 
      ? (config.database[key] as T) 
      : defaultValue as T;
  },

  /**
   * Gets a feature flag value.
   * 
   * @param config The Care Service configuration object.
   * @param featureKey The feature flag key.
   * @param defaultValue The default value to return if the feature flag is not found.
   * @returns The feature flag value, or the default value if not found.
   */
  isFeatureEnabled(
    config: CareServiceConfig,
    featureKey: keyof FeaturesConfig,
    defaultValue = false
  ): boolean {
    return config.features?.[featureKey] !== undefined 
      ? Boolean(config.features[featureKey]) 
      : defaultValue;
  },

  /**
   * Gets a gamification event type.
   * 
   * @param config The Care Service configuration object.
   * @param eventKey The gamification event key.
   * @returns The gamification event type, or undefined if not found.
   */
  getGamificationEvent(
    config: CareServiceConfig,
    eventKey: keyof GamificationConfig['defaultEvents']
  ): string | undefined {
    return config.gamification?.defaultEvents?.[eventKey];
  },

  /**
   * Gets a notification template ID.
   * 
   * @param config The Care Service configuration object.
   * @param templateKey The notification template key.
   * @returns The notification template ID, or undefined if not found.
   */
  getNotificationTemplate(
    config: CareServiceConfig,
    templateKey: keyof NotificationsConfig['templates']
  ): string | undefined {
    return config.notifications?.templates?.[templateKey];
  },
};

/**
 * Constants for the Care Service configuration.
 */
export const ConfigConstants = {
  /**
   * The default journey context for the Care Service.
   */
  JOURNEY_CONTEXT: 'care',

  /**
   * The default API prefix for the Care Service.
   */
  DEFAULT_API_PREFIX: 'api/v1',

  /**
   * The default port for the Care Service.
   */
  DEFAULT_PORT: 3002,

  /**
   * The environment variable prefix for the Care Service.
   */
  ENV_PREFIX: 'CARE_SERVICE_',
};