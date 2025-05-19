/**
 * Environment initialization for browser
 * 
 * This module initializes environment variables for the browser by creating a global
 * window.__ENV__ namespace populated with public environment variables. It prevents
 * "process is not defined" errors in the browser by handling the ambient Node.js
 * process.env object and stripping the NEXT_PUBLIC_ prefix from environment variables.
 */

import { Optional } from '@austa/interfaces/common/types';

/**
 * Environment variable interface for the AUSTA SuperApp
 */
export interface AppEnvironment {
  /**
   * Base URL for API requests
   */
  API_URL: string;
  
  /**
   * Current environment (development, staging, production)
   */
  ENVIRONMENT: 'development' | 'staging' | 'production';
  
  /**
   * Feature flag for gamification
   */
  FEATURE_GAMIFICATION: boolean;
  
  /**
   * Additional environment variables
   */
  [key: string]: string | boolean | number | undefined;
}

/**
 * Default environment values
 */
const DEFAULT_ENV: AppEnvironment = {
  API_URL: 'http://localhost:3000/api',
  ENVIRONMENT: 'development',
  FEATURE_GAMIFICATION: true,
};

/**
 * Extend the Window interface to include our environment variables
 */
declare global {
  interface Window {
    __ENV__: AppEnvironment;
  }
}

/**
 * Initialize environment variables for browser use
 * 
 * This function creates a global window.__ENV__ object with all NEXT_PUBLIC_
 * environment variables, stripping the prefix for easier access.
 */
export function initializeEnvironment(): void {
  // Skip if not in browser environment
  if (typeof window === 'undefined') return;
  
  // Initialize with default values
  const env: AppEnvironment = { ...DEFAULT_ENV };
  
  // Only run in browser environment
  if (typeof process !== 'undefined' && process.env) {
    // Get all environment variables with NEXT_PUBLIC_ prefix
    Object.entries(process.env).forEach(([key, value]) => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        // Strip the prefix and add to environment
        const envKey = key.replace('NEXT_PUBLIC_', '');
        
        // Convert string 'true'/'false' to boolean for known boolean fields
        if (envKey === 'FEATURE_GAMIFICATION' && typeof value === 'string') {
          env[envKey] = value.toLowerCase() === 'true';
        } else {
          env[envKey] = value as string;
        }
      }
    });
  }
  
  // Assign to window object
  window.__ENV__ = env;
}

/**
 * Get environment variable with type safety
 * 
 * @param key - The environment variable key to retrieve
 * @param defaultValue - Optional default value if the environment variable is not set
 * @returns The environment variable value or the default value
 */
export function getEnv<T extends keyof AppEnvironment>(
  key: T,
  defaultValue?: Optional<AppEnvironment[T]>
): AppEnvironment[T] {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && window.__ENV__) {
    return (window.__ENV__[key] !== undefined ? window.__ENV__[key] : defaultValue) as AppEnvironment[T];
  }
  
  // Server-side: use process.env with NEXT_PUBLIC_ prefix
  if (typeof process !== 'undefined' && process.env) {
    const prefixedKey = `NEXT_PUBLIC_${key}`;
    const value = process.env[prefixedKey];
    
    // Convert string 'true'/'false' to boolean for known boolean fields
    if (key === 'FEATURE_GAMIFICATION' && typeof value === 'string') {
      return (value.toLowerCase() === 'true') as unknown as AppEnvironment[T];
    }
    
    return (value !== undefined ? value : defaultValue) as AppEnvironment[T];
  }
  
  // Fallback to default value
  return defaultValue as AppEnvironment[T];
}

/**
 * Check if the current environment is production
 * 
 * @returns true if the current environment is production
 */
export function isProduction(): boolean {
  return getEnv('ENVIRONMENT') === 'production';
}

/**
 * Check if the current environment is development
 * 
 * @returns true if the current environment is development
 */
export function isDevelopment(): boolean {
  return getEnv('ENVIRONMENT') === 'development';
}

/**
 * Check if the current environment is staging
 * 
 * @returns true if the current environment is staging
 */
export function isStaging(): boolean {
  return getEnv('ENVIRONMENT') === 'staging';
}

// Initialize environment variables on module load
initializeEnvironment();