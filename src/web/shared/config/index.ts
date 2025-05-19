/**
 * Configuration Index Module
 * 
 * This module centralizes all configuration exports for the AUSTA SuperApp.
 * It re-exports individual configuration modules and provides a unified
 * configuration object for easier consumption throughout the application.
 * 
 * @module config
 */

// Import individual configurations
import { apiConfig } from './apiConfig';
import { supportedLocales, defaultLocale } from './i18nConfig';
import { env } from './env';

// Re-export individual configurations for direct access
export { apiConfig, supportedLocales, defaultLocale, env };

/**
 * Configuration module augmentation interface
 * Allows extending the configuration types in other modules
 */
export namespace ConfigTypes {
  export interface ApiConfig extends typeof apiConfig {}
  export interface I18nConfig {
    supportedLocales: typeof supportedLocales;
    defaultLocale: typeof defaultLocale;
  }
  export interface EnvConfig extends typeof env {}
}

/**
 * Unified configuration object that consolidates all application settings.
 * This allows importing all configuration with a single import statement.
 * 
 * Usage example:
 * ```typescript
 * import { config } from '@app/shared/config';
 * 
 * // Access API configuration
 * const baseUrl = config.api.baseURL;
 * 
 * // Access i18n configuration
 * const defaultLocale = config.i18n.defaultLocale;
 * 
 * // Access environment variables
 * const isGamificationEnabled = config.env.FEATURE_GAMIFICATION;
 * ```
 */
export const config: {
  api: ConfigTypes.ApiConfig;
  i18n: ConfigTypes.I18nConfig;
  env: ConfigTypes.EnvConfig;
} = {
  /**
   * API related configuration
   * Includes base URL and journey-specific endpoints
   */
  api: apiConfig,
  
  /**
   * Internationalization configuration
   * Includes supported locales and default locale
   */
  i18n: {
    supportedLocales,
    defaultLocale,
  },

  /**
   * Environment configuration
   * Includes environment variables and feature flags
   */
  env,
};