/**
 * Journey-specific environment variable utilities
 * 
 * This module provides utilities for managing environment variables in a journey-specific context,
 * enabling clean separation between journey services while ensuring consistent configuration patterns.
 */

/**
 * Supported journey types in the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  SHARED = 'shared' // For cross-journey configurations
}

/**
 * Configuration for a journey-specific environment variable
 */
export interface JourneyEnvConfig {
  /** The journey this configuration belongs to */
  journey: JourneyType;
  /** Default value if environment variable is not set */
  defaultValue?: string;
  /** Whether this configuration is required (throws error if missing) */
  required?: boolean;
  /** Whether this configuration is shared across journeys */
  shared?: boolean;
  /** Description of what this environment variable controls */
  description?: string;
}

/**
 * Feature flag configuration
 */
export interface FeatureFlagConfig extends JourneyEnvConfig {
  /** Default is false if not specified */
  defaultValue: string;
}

/**
 * Error thrown when a required journey environment variable is missing
 */
export class MissingJourneyEnvError extends Error {
  constructor(varName: string, journey: JourneyType) {
    super(`Required environment variable ${varName} for journey ${journey} is missing`);
    this.name = 'MissingJourneyEnvError';
  }
}

/**
 * Formats an environment variable name with journey-specific prefix
 * 
 * @param name - Base name of the environment variable
 * @param journey - Journey type to prefix with
 * @returns Journey-prefixed environment variable name
 */
export const formatJourneyEnvName = (name: string, journey: JourneyType): string => {
  // Shared variables don't get a journey prefix
  if (journey === JourneyType.SHARED) {
    return `AUSTA_${name}`;
  }
  
  return `AUSTA_${journey.toUpperCase()}_${name}`;
};

/**
 * Gets an environment variable with journey-specific context
 * 
 * @param name - Base name of the environment variable
 * @param config - Journey environment configuration
 * @returns The environment variable value or default
 * @throws MissingJourneyEnvError if required and not found
 */
export const getJourneyEnv = (name: string, config: JourneyEnvConfig): string => {
  const { journey, defaultValue, required = false, shared = false } = config;
  
  // Try journey-specific variable first
  const journeyVarName = formatJourneyEnvName(name, journey);
  let value = process.env[journeyVarName];
  
  // If not found and shared is true, try the shared variable
  if (!value && shared) {
    const sharedVarName = formatJourneyEnvName(name, JourneyType.SHARED);
    value = process.env[sharedVarName];
  }
  
  // If still not found, use default or throw error if required
  if (!value) {
    if (required && defaultValue === undefined) {
      throw new MissingJourneyEnvError(journeyVarName, journey);
    }
    return defaultValue !== undefined ? defaultValue : '';
  }
  
  return value;
};

/**
 * Gets a boolean environment variable with journey-specific context
 * 
 * @param name - Base name of the environment variable
 * @param config - Journey environment configuration
 * @returns The environment variable as a boolean
 */
export const getJourneyEnvBool = (name: string, config: JourneyEnvConfig): boolean => {
  const value = getJourneyEnv(name, config);
  
  if (!value) return false;
  
  return ['true', 'yes', '1', 'on'].includes(value.toLowerCase());
};

/**
 * Gets a numeric environment variable with journey-specific context
 * 
 * @param name - Base name of the environment variable
 * @param config - Journey environment configuration
 * @returns The environment variable as a number
 */
export const getJourneyEnvNumber = (name: string, config: JourneyEnvConfig): number => {
  const value = getJourneyEnv(name, config);
  
  if (!value) return 0;
  
  const parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Gets a JSON environment variable with journey-specific context
 * 
 * @param name - Base name of the environment variable
 * @param config - Journey environment configuration
 * @returns The environment variable parsed as JSON
 */
export const getJourneyEnvJson = <T>(name: string, config: JourneyEnvConfig): T | null => {
  const value = getJourneyEnv(name, config);
  
  if (!value) return null;
  
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to parse JSON from environment variable ${name}:`, error);
    return null;
  }
};

/**
 * Checks if a feature flag is enabled for a specific journey
 * 
 * @param featureName - Name of the feature flag
 * @param config - Feature flag configuration
 * @returns Whether the feature is enabled
 */
export const isFeatureEnabled = (featureName: string, config: FeatureFlagConfig): boolean => {
  // Default to false if not specified
  const featureConfig: FeatureFlagConfig = {
    defaultValue: 'false',
    ...config
  };
  
  return getJourneyEnvBool(`FEATURE_${featureName}`, featureConfig);
};

/**
 * Gets all environment variables for a specific journey
 * 
 * @param journey - Journey type to get variables for
 * @param includeShared - Whether to include shared variables
 * @returns Object containing all journey-specific environment variables
 */
export const getAllJourneyEnvs = (journey: JourneyType, includeShared = true): Record<string, string> => {
  const result: Record<string, string> = {};
  const prefix = `AUSTA_${journey.toUpperCase()}_`;
  const sharedPrefix = 'AUSTA_';
  
  // Get all environment variables
  const allEnvs = process.env;
  
  // Add journey-specific variables
  Object.keys(allEnvs).forEach(key => {
    if (key.startsWith(prefix)) {
      // Remove the prefix to get the base name
      const baseName = key.substring(prefix.length);
      result[baseName] = allEnvs[key] || '';
    }
  });
  
  // Add shared variables if requested
  if (includeShared) {
    Object.keys(allEnvs).forEach(key => {
      if (key.startsWith(sharedPrefix) && !key.includes('_HEALTH_') && 
          !key.includes('_CARE_') && !key.includes('_PLAN_')) {
        // Remove the prefix to get the base name
        const baseName = key.substring(sharedPrefix.length);
        // Don't override journey-specific variables
        if (!result[baseName]) {
          result[baseName] = allEnvs[key] || '';
        }
      }
    });
  }
  
  return result;
};

/**
 * Creates a journey-specific environment configuration object
 * 
 * @param journey - Journey type
 * @param defaultValues - Default values for environment variables
 * @returns Object with methods to access journey-specific environment variables
 */
export const createJourneyEnvConfig = (journey: JourneyType, defaultValues: Record<string, string> = {}) => {
  return {
    /**
     * Gets a string environment variable for this journey
     */
    getString: (name: string, options: Partial<JourneyEnvConfig> = {}): string => {
      return getJourneyEnv(name, {
        journey,
        defaultValue: defaultValues[name],
        ...options
      });
    },
    
    /**
     * Gets a boolean environment variable for this journey
     */
    getBoolean: (name: string, options: Partial<JourneyEnvConfig> = {}): boolean => {
      return getJourneyEnvBool(name, {
        journey,
        defaultValue: defaultValues[name],
        ...options
      });
    },
    
    /**
     * Gets a numeric environment variable for this journey
     */
    getNumber: (name: string, options: Partial<JourneyEnvConfig> = {}): number => {
      return getJourneyEnvNumber(name, {
        journey,
        defaultValue: defaultValues[name],
        ...options
      });
    },
    
    /**
     * Gets a JSON environment variable for this journey
     */
    getJson: <T>(name: string, options: Partial<JourneyEnvConfig> = {}): T | null => {
      return getJourneyEnvJson<T>(name, {
        journey,
        defaultValue: defaultValues[name],
        ...options
      });
    },
    
    /**
     * Checks if a feature is enabled for this journey
     */
    isFeatureEnabled: (featureName: string, options: Partial<FeatureFlagConfig> = {}): boolean => {
      return isFeatureEnabled(featureName, {
        journey,
        defaultValue: 'false',
        ...options
      });
    },
    
    /**
     * Gets all environment variables for this journey
     */
    getAll: (includeShared = true): Record<string, string> => {
      return getAllJourneyEnvs(journey, includeShared);
    }
  };
};

// Pre-configured journey environment helpers
export const healthEnv = createJourneyEnvConfig(JourneyType.HEALTH);
export const careEnv = createJourneyEnvConfig(JourneyType.CARE);
export const planEnv = createJourneyEnvConfig(JourneyType.PLAN);
export const sharedEnv = createJourneyEnvConfig(JourneyType.SHARED);