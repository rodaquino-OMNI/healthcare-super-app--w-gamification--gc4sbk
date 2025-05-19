/**
 * Common configuration interfaces for the AUSTA SuperApp
 * 
 * This module provides TypeScript interfaces for configuration objects used
 * throughout the application, ensuring type safety and consistency across
 * both web and mobile platforms.
 */

/**
 * Environment configuration interface for the AUSTA SuperApp
 * 
 * Defines all environment variables used across the application with their
 * appropriate types. This interface is used by the env.ts module to provide
 * type-safe access to environment variables.
 */
export interface EnvConfig {
  // API Configuration
  API_URL: string;
  API_TIMEOUT: number;
  
  // Authentication
  AUTH_TOKEN_EXPIRY: number; // in seconds
  AUTH_REFRESH_TOKEN_EXPIRY: number; // in seconds
  
  // Feature Flags
  FEATURE_GAMIFICATION: boolean;
  FEATURE_TELEMEDICINE: boolean;
  FEATURE_WEARABLE_SYNC: boolean;
  
  // Journey-specific Configuration
  HEALTH_METRICS_SYNC_INTERVAL: number; // in seconds
  CARE_APPOINTMENT_REMINDER_THRESHOLD: number; // in seconds
  PLAN_CLAIM_AUTO_SAVE_INTERVAL: number; // in seconds
  
  // Third-party Service Integration
  ANALYTICS_API_KEY: string;
  WEARABLE_API_KEY: string;
  TELEMEDICINE_SERVICE_URL: string;
  
  // Package Integrations
  DESIGN_SYSTEM_THEME: string;
  JOURNEY_CONTEXT_STORAGE_KEY: string;
  PRIMITIVES_SCALE_FACTOR: number;
  
  // Development & Debugging
  NODE_ENV: string;
  DEBUG: boolean;
  API_MOCK: boolean;
}

/**
 * API configuration interface for the AUSTA SuperApp
 * 
 * Defines the structure of API endpoint configurations used across the application.
 * This interface ensures consistent API endpoint definitions across all services.
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  endpoints: {
    health: {
      metrics: string;
      goals: string;
      devices: string;
      insights: string;
    };
    care: {
      appointments: string;
      providers: string;
      medications: string;
      telemedicine: string;
      treatments: string;
    };
    plan: {
      benefits: string;
      claims: string;
      coverage: string;
      documents: string;
    };
    auth: {
      login: string;
      register: string;
      refresh: string;
      logout: string;
    };
    gamification: {
      achievements: string;
      quests: string;
      rewards: string;
      leaderboard: string;
      profile: string;
    };
  };
}

/**
 * Internationalization configuration interface for the AUSTA SuperApp
 * 
 * Defines the structure of i18n configuration used across the application.
 * This interface ensures consistent language support for both web and mobile applications.
 */
export interface I18nConfig {
  defaultLocale: string;
  supportedLocales: string[];
  namespaces: string[];
  fallbackLocale: string;
}