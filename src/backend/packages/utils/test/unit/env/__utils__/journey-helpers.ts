/**
 * Journey-specific environment variable testing utilities.
 * 
 * These utilities help test environment variable handling across different journeys
 * (Health, Care, and Plan) by providing functions to simulate journey-specific
 * environment variables, test prefixing, namespace isolation, cross-journey
 * configuration sharing, and journey-specific defaults.
 */

import { JourneyType } from '../../../../src/env/journey';

/**
 * Creates a mock environment with journey-specific variables for testing.
 * 
 * @param overrides Custom environment variables to include in the mock
 * @returns A mock process.env object with journey-specific test variables
 */
export function createJourneyTestEnv(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    // Shared variables (no journey prefix)
    SHARED_API_KEY: 'shared-api-key-123',
    LOG_LEVEL: 'info',
    NODE_ENV: 'test',
    
    // Health journey variables
    HEALTH_API_URL: 'https://health-api.austa.com',
    HEALTH_API_KEY: 'health-api-key-456',
    HEALTH_FEATURE_METRICS_ENABLED: 'true',
    HEALTH_FEATURE_INSIGHTS_ENABLED: 'false',
    HEALTH_MAX_DEVICES: '5',
    
    // Care journey variables
    CARE_API_URL: 'https://care-api.austa.com',
    CARE_API_KEY: 'care-api-key-789',
    CARE_FEATURE_TELEMEDICINE_ENABLED: 'true',
    CARE_FEATURE_SCHEDULING_ENABLED: 'true',
    CARE_MAX_APPOINTMENTS: '10',
    
    // Plan journey variables
    PLAN_API_URL: 'https://plan-api.austa.com',
    PLAN_API_KEY: 'plan-api-key-012',
    PLAN_FEATURE_CLAIMS_ENABLED: 'true',
    PLAN_FEATURE_BENEFITS_ENABLED: 'true',
    PLAN_MAX_CLAIMS: '20',
    
    // Apply any overrides
    ...overrides
  };
}

/**
 * Creates a mock environment with missing journey variables for testing error cases.
 * 
 * @returns A mock process.env object with some journey variables missing
 */
export function createIncompleteJourneyTestEnv(): NodeJS.ProcessEnv {
  return {
    // Shared variables
    SHARED_API_KEY: 'shared-api-key-123',
    
    // Only some journey variables are defined
    HEALTH_API_URL: 'https://health-api.austa.com',
    // HEALTH_API_KEY is missing
    
    CARE_API_URL: 'https://care-api.austa.com',
    CARE_API_KEY: 'care-api-key-789',
    
    // PLAN_API_URL is missing
    PLAN_API_KEY: 'plan-api-key-012',
  };
}

/**
 * Creates a mock environment with feature flags for testing.
 * 
 * @returns A mock process.env object with journey-specific feature flags
 */
export function createFeatureFlagTestEnv(): NodeJS.ProcessEnv {
  return {
    // Health journey feature flags
    HEALTH_FEATURE_METRICS_ENABLED: 'true',
    HEALTH_FEATURE_INSIGHTS_ENABLED: 'false',
    HEALTH_FEATURE_GOALS_ENABLED: 'yes',
    HEALTH_FEATURE_SHARING_ENABLED: 'no',
    HEALTH_FEATURE_EXPORT_ENABLED: '1',
    HEALTH_FEATURE_IMPORT_ENABLED: '0',
    
    // Care journey feature flags
    CARE_FEATURE_TELEMEDICINE_ENABLED: 'true',
    CARE_FEATURE_SCHEDULING_ENABLED: 'false',
    CARE_FEATURE_REMINDERS_ENABLED: 'yes',
    CARE_FEATURE_NOTES_ENABLED: 'no',
    
    // Plan journey feature flags
    PLAN_FEATURE_CLAIMS_ENABLED: 'true',
    PLAN_FEATURE_BENEFITS_ENABLED: 'false',
    PLAN_FEATURE_DOCUMENTS_ENABLED: '1',
    PLAN_FEATURE_HISTORY_ENABLED: '0',
  };
}

/**
 * Creates journey-specific default values for testing.
 * 
 * @returns An object with default values for each journey
 */
export function createJourneyDefaults<T>(healthDefault: T, careDefault: T, planDefault: T): Record<JourneyType, T> {
  return {
    [JourneyType.HEALTH]: healthDefault,
    [JourneyType.CARE]: careDefault,
    [JourneyType.PLAN]: planDefault
  };
}

/**
 * Mocks the core environment utility functions for journey testing.
 * 
 * @param mockEnv The mock environment to use for testing
 * @returns Mocked versions of getEnv, getRequiredEnv, and getOptionalEnv
 */
export function mockEnvFunctions(mockEnv: NodeJS.ProcessEnv = {}) {
  const getEnvMock = jest.fn().mockImplementation((name: string) => mockEnv[name]);
  
  const getRequiredEnvMock = jest.fn().mockImplementation((name: string) => {
    const value = mockEnv[name];
    if (value === undefined) {
      throw new Error(`Environment variable ${name} is required but not set`);
    }
    return value;
  });
  
  const getOptionalEnvMock = jest.fn().mockImplementation((name: string, defaultValue: any) => {
    const value = mockEnv[name];
    return value !== undefined ? value : defaultValue;
  });
  
  return {
    getEnv: getEnvMock,
    getRequiredEnv: getRequiredEnvMock,
    getOptionalEnv: getOptionalEnvMock
  };
}

/**
 * Verifies that a variable name has the correct journey prefix.
 * 
 * @param variableName The environment variable name to check
 * @param journeyType The expected journey type prefix
 * @returns True if the variable has the correct journey prefix
 */
export function hasJourneyPrefix(variableName: string, journeyType: JourneyType): boolean {
  const prefix = `${journeyType}_`;
  return variableName.startsWith(prefix);
}

/**
 * Extracts the base name of a journey-prefixed environment variable.
 * 
 * @param variableName The journey-prefixed environment variable name
 * @returns The base name without the journey prefix, or null if not a journey variable
 */
export function extractBaseVariableName(variableName: string): string | null {
  const journeyPrefixes = Object.values(JourneyType).map(journey => `${journey}_`);
  
  for (const prefix of journeyPrefixes) {
    if (variableName.startsWith(prefix)) {
      return variableName.substring(prefix.length);
    }
  }
  
  return null;
}

/**
 * Extracts the journey type from a journey-prefixed environment variable.
 * 
 * @param variableName The journey-prefixed environment variable name
 * @returns The journey type, or null if not a journey variable
 */
export function extractJourneyType(variableName: string): JourneyType | null {
  for (const journey of Object.values(JourneyType)) {
    if (variableName.startsWith(`${journey}_`)) {
      return journey as JourneyType;
    }
  }
  
  return null;
}

/**
 * Converts a string value to a boolean for feature flag testing.
 * 
 * @param value The string value to convert
 * @returns The boolean representation of the string
 */
export function parseBoolean(value: string): boolean {
  return ['true', 'yes', '1'].includes(value.toLowerCase());
}

/**
 * Creates a set of environment variables for testing cross-journey configuration.
 * 
 * @returns A mock process.env object with variables that exist across journeys
 */
export function createCrossJourneyTestEnv(): NodeJS.ProcessEnv {
  return {
    // Same configuration key across all journeys
    HEALTH_API_TIMEOUT: '5000',
    CARE_API_TIMEOUT: '3000',
    PLAN_API_TIMEOUT: '4000',
    
    // Same configuration value across all journeys
    HEALTH_API_VERSION: 'v1',
    CARE_API_VERSION: 'v1',
    PLAN_API_VERSION: 'v1',
    
    // Different configuration values across journeys
    HEALTH_MAX_RETRIES: '3',
    CARE_MAX_RETRIES: '5',
    PLAN_MAX_RETRIES: '2',
  };
}

/**
 * Creates a set of environment variables for testing feature isolation.
 * 
 * @returns A mock process.env object with isolated journey features
 */
export function createFeatureIsolationTestEnv(): NodeJS.ProcessEnv {
  return {
    // Features that only exist in specific journeys
    HEALTH_FEATURE_WEARABLE_SYNC_ENABLED: 'true',  // Only in Health
    CARE_FEATURE_VIDEO_CALL_ENABLED: 'true',       // Only in Care
    PLAN_FEATURE_DOCUMENT_UPLOAD_ENABLED: 'true',  // Only in Plan
    
    // Features with different values across journeys
    HEALTH_FEATURE_NOTIFICATIONS_ENABLED: 'true',
    CARE_FEATURE_NOTIFICATIONS_ENABLED: 'false',
    PLAN_FEATURE_NOTIFICATIONS_ENABLED: 'true',
  };
}