/**
 * Environment configuration for the AUSTA SuperApp
 * 
 * This module provides a type-safe, centralized access point for environment variables
 * across both web and mobile platforms. It handles type conversion, default values,
 * and properly works in both server and browser contexts.
 */

import { EnvConfig } from '@austa/interfaces/common';

/**
 * Determines if the code is running in a browser environment
 * Enhanced to properly detect React Native environment
 */
const isBrowser = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    // Check for React Native environment
    typeof navigator !== 'undefined' &&
    navigator.product !== 'ReactNative'
  );
};

/**
 * Type-safe environment variable accessor
 * 
 * @param key - The environment variable key
 * @param defaultValue - Optional default value if the environment variable is not set
 * @param required - Whether the environment variable is required (throws error if missing)
 * @returns The environment variable value converted to the appropriate type
 */
export function getEnv<T extends string | boolean | number>(
  key: string,
  defaultValue?: T,
  required = false
): T {
  // In browser environments, use the window.__ENV object if available
  if (isBrowser()) {
    const windowEnv = (window as any).__ENV || {};
    const value = windowEnv[key] || defaultValue;
    
    if (required && value === undefined) {
      throw new Error(`Required environment variable ${key} is missing in browser context`);
    }
    
    return value as T;
  }

  // In Node.js or React Native environments
  const value = process.env[key];
  
  if (required && value === undefined && defaultValue === undefined) {
    throw new Error(`Required environment variable ${key} is missing`);
  }
  
  if (value === undefined) {
    return defaultValue as T;
  }
  
  // Type conversion based on the generic type parameter
  if (typeof defaultValue === 'boolean') {
    return (value === 'true') as unknown as T;
  }
  
  if (typeof defaultValue === 'number') {
    return Number(value) as unknown as T;
  }
  
  return value as unknown as T;
}

/**
 * Environment configuration for the AUSTA SuperApp
 */
export const env: EnvConfig = {
  // API Configuration
  API_URL: getEnv<string>('API_URL', 'http://localhost:3000', true),
  API_TIMEOUT: getEnv<number>('API_TIMEOUT', 30000),
  
  // Authentication
  AUTH_TOKEN_EXPIRY: getEnv<number>('AUTH_TOKEN_EXPIRY', 86400), // 24 hours in seconds
  AUTH_REFRESH_TOKEN_EXPIRY: getEnv<number>('AUTH_REFRESH_TOKEN_EXPIRY', 604800), // 7 days in seconds
  
  // Feature Flags
  FEATURE_GAMIFICATION: getEnv<boolean>('FEATURE_GAMIFICATION', true),
  FEATURE_TELEMEDICINE: getEnv<boolean>('FEATURE_TELEMEDICINE', true),
  FEATURE_WEARABLE_SYNC: getEnv<boolean>('FEATURE_WEARABLE_SYNC', true),
  
  // Journey-specific Configuration
  HEALTH_METRICS_SYNC_INTERVAL: getEnv<number>('HEALTH_METRICS_SYNC_INTERVAL', 3600), // 1 hour in seconds
  CARE_APPOINTMENT_REMINDER_THRESHOLD: getEnv<number>('CARE_APPOINTMENT_REMINDER_THRESHOLD', 1800), // 30 minutes in seconds
  PLAN_CLAIM_AUTO_SAVE_INTERVAL: getEnv<number>('PLAN_CLAIM_AUTO_SAVE_INTERVAL', 60), // 60 seconds
  
  // Third-party Service Integration
  ANALYTICS_API_KEY: getEnv<string>('ANALYTICS_API_KEY', ''),
  WEARABLE_API_KEY: getEnv<string>('WEARABLE_API_KEY', ''),
  TELEMEDICINE_SERVICE_URL: getEnv<string>('TELEMEDICINE_SERVICE_URL', 'https://telemedicine.austa.health'),
  
  // Package Integrations
  DESIGN_SYSTEM_THEME: getEnv<string>('DESIGN_SYSTEM_THEME', 'default'),
  JOURNEY_CONTEXT_STORAGE_KEY: getEnv<string>('JOURNEY_CONTEXT_STORAGE_KEY', 'austa_journey_context'),
  PRIMITIVES_SCALE_FACTOR: getEnv<number>('PRIMITIVES_SCALE_FACTOR', 1),
  
  // Development & Debugging
  NODE_ENV: getEnv<string>('NODE_ENV', 'development'),
  DEBUG: getEnv<boolean>('DEBUG', false),
  API_MOCK: getEnv<boolean>('API_MOCK', false),
};

/**
 * Type guard to check if a specific environment variable exists
 * 
 * @param key - The environment variable key to check
 * @returns True if the environment variable exists and is not undefined
 */
export function hasEnv(key: keyof EnvConfig): boolean {
  return env[key] !== undefined;
}

/**
 * Validates that all required environment variables are present
 * Throws an error if any required variables are missing
 * 
 * @param requiredKeys - Array of required environment variable keys
 */
export function validateRequiredEnv(requiredKeys: Array<keyof EnvConfig>): void {
  const missingKeys = requiredKeys.filter(key => !hasEnv(key));
  
  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }
}

export default env;