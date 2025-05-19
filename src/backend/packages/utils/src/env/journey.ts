/**
 * Journey-specific environment variable utilities
 * 
 * This module provides utilities for managing environment variables in a journey-specific context,
 * enabling separation and isolation of configuration between different journeys (Health, Care, Plan).
 * It includes functions for prefixing environment variables, managing journey-specific defaults,
 * and implementing feature flags for journey-specific features.
 */

import { MissingEnvironmentVariableError } from './error';
import { parseBoolean } from './transform';

/**
 * Supported journey types in the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  SHARED = 'shared' // For cross-journey shared configuration
}

/**
 * Journey-specific feature flag configuration
 */
export interface JourneyFeatureFlag {
  journeyType: JourneyType;
  featureName: string;
  enabled: boolean;
  rolloutPercentage?: number; // Optional percentage-based rollout (0-100)
}

/**
 * Configuration for cross-journey sharing
 */
export interface CrossJourneyConfig {
  shareAcross: JourneyType[];
  variableName: string;
  defaultValue?: string;
}

// Cache for environment variables to avoid repeated process.env access
const envCache: Record<string, string | undefined> = {};

/**
 * Clears the environment variable cache
 * Primarily used for testing purposes
 */
export const clearEnvCache = (): void => {
  Object.keys(envCache).forEach(key => {
    delete envCache[key];
  });
};

/**
 * Generates a journey-specific environment variable name by adding the journey prefix
 * 
 * @param journeyType - The journey type (health, care, plan, shared)
 * @param variableName - The base environment variable name
 * @returns The prefixed environment variable name
 */
export const getJourneyEnvName = (journeyType: JourneyType, variableName: string): string => {
  const prefix = journeyType.toUpperCase();
  return `${prefix}_${variableName}`;
};

/**
 * Retrieves a journey-specific environment variable
 * 
 * @param journeyType - The journey type (health, care, plan, shared)
 * @param variableName - The base environment variable name
 * @param defaultValue - Optional default value if the environment variable is not set
 * @returns The value of the environment variable or the default value
 */
export const getJourneyEnv = (
  journeyType: JourneyType,
  variableName: string,
  defaultValue?: string
): string | undefined => {
  const envName = getJourneyEnvName(journeyType, variableName);
  
  // Check cache first
  if (envCache[envName] !== undefined) {
    return envCache[envName];
  }
  
  // Get from process.env and cache the result
  const value = process.env[envName] || defaultValue;
  envCache[envName] = value;
  
  return value;
};

/**
 * Retrieves a required journey-specific environment variable
 * Throws an error if the variable is not set and no default is provided
 * 
 * @param journeyType - The journey type (health, care, plan, shared)
 * @param variableName - The base environment variable name
 * @param defaultValue - Optional default value if the environment variable is not set
 * @returns The value of the environment variable or the default value
 * @throws MissingEnvironmentVariableError if the variable is not set and no default is provided
 */
export const getRequiredJourneyEnv = (
  journeyType: JourneyType,
  variableName: string,
  defaultValue?: string
): string => {
  const value = getJourneyEnv(journeyType, variableName, defaultValue);
  
  if (value === undefined) {
    const envName = getJourneyEnvName(journeyType, variableName);
    throw new MissingEnvironmentVariableError(
      `Required journey-specific environment variable ${envName} is not set`,
      envName
    );
  }
  
  return value;
};

/**
 * Retrieves a journey-specific feature flag
 * Feature flags are boolean environment variables that control feature availability
 * 
 * @param journeyType - The journey type (health, care, plan, shared)
 * @param featureName - The name of the feature
 * @param defaultEnabled - Default enabled state if not specified in environment
 * @returns Feature flag configuration including enabled state and rollout percentage
 */
export const getJourneyFeatureFlag = (
  journeyType: JourneyType,
  featureName: string,
  defaultEnabled = false
): JourneyFeatureFlag => {
  const flagName = `FEATURE_${featureName.toUpperCase()}`;
  const enabledValue = getJourneyEnv(journeyType, flagName, String(defaultEnabled));
  const enabled = parseBoolean(enabledValue || String(defaultEnabled));
  
  // Check for percentage-based rollout
  const percentageName = `FEATURE_${featureName.toUpperCase()}_PERCENTAGE`;
  const percentageValue = getJourneyEnv(journeyType, percentageName);
  const rolloutPercentage = percentageValue ? parseInt(percentageValue, 10) : undefined;
  
  return {
    journeyType,
    featureName,
    enabled,
    rolloutPercentage: rolloutPercentage !== undefined && !isNaN(rolloutPercentage) ? 
      Math.min(Math.max(rolloutPercentage, 0), 100) : undefined
  };
};

/**
 * Checks if a feature is enabled for a specific journey
 * 
 * @param journeyType - The journey type (health, care, plan, shared)
 * @param featureName - The name of the feature
 * @param defaultEnabled - Default enabled state if not specified in environment
 * @returns True if the feature is enabled, false otherwise
 */
export const isFeatureEnabled = (
  journeyType: JourneyType,
  featureName: string,
  defaultEnabled = false
): boolean => {
  const featureFlag = getJourneyFeatureFlag(journeyType, featureName, defaultEnabled);
  return featureFlag.enabled;
};

/**
 * Checks if a feature is enabled for a specific user based on percentage rollout
 * 
 * @param journeyType - The journey type (health, care, plan, shared)
 * @param featureName - The name of the feature
 * @param userId - The user ID to check against percentage rollout
 * @param defaultEnabled - Default enabled state if not specified in environment
 * @returns True if the feature is enabled for this user, false otherwise
 */
export const isFeatureEnabledForUser = (
  journeyType: JourneyType,
  featureName: string,
  userId: string,
  defaultEnabled = false
): boolean => {
  const featureFlag = getJourneyFeatureFlag(journeyType, featureName, defaultEnabled);
  
  // If feature is disabled globally, return false
  if (!featureFlag.enabled) {
    return false;
  }
  
  // If no percentage rollout is defined, feature is enabled for all users
  if (featureFlag.rolloutPercentage === undefined) {
    return true;
  }
  
  // Determine if user is in the rollout percentage
  // Use a hash of the user ID to ensure consistent results
  const hash = hashString(userId + featureName);
  const userPercentile = hash % 100;
  
  return userPercentile < featureFlag.rolloutPercentage;
};

/**
 * Shares an environment variable across multiple journeys
 * 
 * @param config - Configuration for cross-journey sharing
 * @returns The shared environment variable value or undefined if not set
 */
export const getSharedJourneyEnv = (config: CrossJourneyConfig): string | undefined => {
  // First try to get from shared namespace
  const sharedValue = getJourneyEnv(JourneyType.SHARED, config.variableName, config.defaultValue);
  if (sharedValue !== undefined) {
    return sharedValue;
  }
  
  // Then try each journey in the specified order
  for (const journeyType of config.shareAcross) {
    const journeyValue = getJourneyEnv(journeyType, config.variableName);
    if (journeyValue !== undefined) {
      return journeyValue;
    }
  }
  
  // Return default if provided
  return config.defaultValue;
};

/**
 * Retrieves a required shared environment variable across multiple journeys
 * Throws an error if the variable is not set in any of the specified journeys and no default is provided
 * 
 * @param config - Configuration for cross-journey sharing
 * @returns The shared environment variable value
 * @throws MissingEnvironmentVariableError if the variable is not set in any journey and no default is provided
 */
export const getRequiredSharedJourneyEnv = (config: CrossJourneyConfig): string => {
  const value = getSharedJourneyEnv(config);
  
  if (value === undefined) {
    throw new MissingEnvironmentVariableError(
      `Required shared environment variable ${config.variableName} is not set in any journey: ${config.shareAcross.join(', ')}`,
      config.variableName
    );
  }
  
  return value;
};

/**
 * Gets all environment variables for a specific journey
 * 
 * @param journeyType - The journey type (health, care, plan, shared)
 * @returns Object containing all environment variables for the specified journey
 */
export const getAllJourneyEnvs = (journeyType: JourneyType): Record<string, string> => {
  const prefix = journeyType.toUpperCase() + '_';
  const result: Record<string, string> = {};
  
  // Iterate through all environment variables
  Object.keys(process.env).forEach(key => {
    if (key.startsWith(prefix)) {
      const value = process.env[key];
      if (value !== undefined) {
        // Remove the prefix to get the base variable name
        const baseKey = key.substring(prefix.length);
        result[baseKey] = value;
      }
    }
  });
  
  return result;
};

/**
 * Simple string hash function for consistent percentage-based feature flag rollouts
 * 
 * @param str - The string to hash
 * @returns A number between 0 and 99
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 100;
}