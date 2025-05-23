/**
 * Environment Variable Test Helpers
 * 
 * Provides utilities for testing environment variable related functionality including:
 * - Environment variable mocking with automatic cleanup
 * - Validation testing utilities
 * - Journey-specific configuration testing
 * - Transformation testing utilities
 */

import { afterEach, beforeEach, jest } from '@jest/globals';

// Types for environment variable mocking
type EnvBackup = Record<string, string | undefined>;
type EnvVars = Record<string, string | null>;
type JourneyType = 'health' | 'care' | 'plan' | 'gamification';

/**
 * Creates a test environment with mocked environment variables that are automatically
 * restored after each test.
 * 
 * @example
 * ```typescript
 * describe('Environment tests', () => {
 *   const { setEnvVars, getEnvVar } = createTestEnv();
 *   
 *   it('should use mocked environment', () => {
 *     setEnvVars({ 'API_KEY': 'test-key' });
 *     expect(process.env.API_KEY).toBe('test-key');
 *     expect(getEnvVar('API_KEY')).toBe('test-key');
 *   });
 * });
 * ```
 */
export function createTestEnv() {
  const envBackup: EnvBackup = {};
  
  // Backup current environment before tests
  beforeEach(() => {
    // Backup all existing environment variables
    Object.keys(process.env).forEach(key => {
      envBackup[key] = process.env[key];
    });
  });
  
  // Restore environment after tests
  afterEach(() => {
    // Restore all environment variables to their original state
    Object.keys(process.env).forEach(key => {
      if (key in envBackup) {
        process.env[key] = envBackup[key];
      } else {
        delete process.env[key];
      }
    });
  });
  
  /**
   * Sets environment variables for testing
   * @param vars Object with environment variables to set
   */
  const setEnvVars = (vars: EnvVars): void => {
    Object.entries(vars).forEach(([key, value]) => {
      if (value === null) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  };
  
  /**
   * Gets a single environment variable
   * @param key Environment variable name
   * @returns The environment variable value or undefined
   */
  const getEnvVar = (key: string): string | undefined => {
    return process.env[key];
  };
  
  /**
   * Clears specific environment variables
   * @param keys Array of environment variable names to clear
   */
  const clearEnvVars = (keys: string[]): void => {
    keys.forEach(key => {
      delete process.env[key];
    });
  };
  
  /**
   * Clears all environment variables (use with caution)
   */
  const clearAllEnvVars = (): void => {
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });
  };
  
  return {
    setEnvVars,
    getEnvVar,
    clearEnvVars,
    clearAllEnvVars,
  };
}

/**
 * Creates a mock environment for testing validation functions
 * 
 * @example
 * ```typescript
 * describe('Validation tests', () => {
 *   const { createValidEnv, createInvalidEnv } = createValidationTestEnv();
 *   
 *   it('should validate URL correctly', () => {
 *     const validEnv = createValidEnv('URL');
 *     expect(validateUrl(validEnv.TEST_URL)).toBe(true);
 *     
 *     const invalidEnv = createInvalidEnv('URL');
 *     expect(() => validateUrl(invalidEnv.TEST_URL)).toThrow();
 *   });
 * });
 * ```
 */
export function createValidationTestEnv() {
  const { setEnvVars } = createTestEnv();
  
  // Valid test values by type
  const validValues = {
    URL: 'https://austa.com.br/api',
    EMAIL: 'test@austa.com.br',
    NUMBER: '42',
    INTEGER: '100',
    FLOAT: '3.14',
    BOOLEAN: 'true',
    STRING: 'test-string',
    JSON: '{"key":"value"}',
    ARRAY: 'item1,item2,item3',
    DATE: '2023-05-23',
    PORT: '3000',
    PATH: '/var/log/app',
    HOSTNAME: 'api.austa.com.br',
    UUID: '123e4567-e89b-12d3-a456-426614174000',
    RANGE: '10-20',
  };
  
  // Invalid test values by type
  const invalidValues = {
    URL: 'not-a-url',
    EMAIL: 'invalid-email',
    NUMBER: 'not-a-number',
    INTEGER: '3.14',
    FLOAT: 'not-a-float',
    BOOLEAN: 'not-a-boolean',
    STRING: '',
    JSON: '{invalid-json}',
    ARRAY: '',
    DATE: 'not-a-date',
    PORT: '999999',
    PATH: '',
    HOSTNAME: 'invalid..hostname',
    UUID: 'not-a-uuid',
    RANGE: '20-10',
  };
  
  /**
   * Creates environment variables with valid values for testing
   * @param type The type of validation to test
   * @param prefix Optional prefix for the environment variable
   * @returns Object with the set environment variables
   */
  const createValidEnv = (type: keyof typeof validValues, prefix = 'TEST'): Record<string, string> => {
    const key = `${prefix}_${type}`;
    const value = validValues[type];
    setEnvVars({ [key]: value });
    return { [key]: value };
  };
  
  /**
   * Creates environment variables with invalid values for testing
   * @param type The type of validation to test
   * @param prefix Optional prefix for the environment variable
   * @returns Object with the set environment variables
   */
  const createInvalidEnv = (type: keyof typeof invalidValues, prefix = 'TEST'): Record<string, string> => {
    const key = `${prefix}_${type}`;
    const value = invalidValues[type];
    setEnvVars({ [key]: value });
    return { [key]: value };
  };
  
  /**
   * Creates a set of environment variables for testing batch validation
   * @param types Array of validation types to include
   * @param valid Whether to use valid or invalid values
   * @param prefix Optional prefix for the environment variables
   * @returns Object with the set environment variables
   */
  const createBatchEnv = (
    types: Array<keyof typeof validValues>,
    valid = true,
    prefix = 'TEST'
  ): Record<string, string> => {
    const values = valid ? validValues : invalidValues;
    const envVars: Record<string, string> = {};
    
    types.forEach(type => {
      const key = `${prefix}_${type}`;
      envVars[key] = values[type];
    });
    
    setEnvVars(envVars);
    return envVars;
  };
  
  return {
    createValidEnv,
    createInvalidEnv,
    createBatchEnv,
    validValues,
    invalidValues,
  };
}

/**
 * Creates a test environment for journey-specific configuration testing
 * 
 * @example
 * ```typescript
 * describe('Journey config tests', () => {
 *   const { createJourneyEnv, getJourneyVar } = createJourneyTestEnv();
 *   
 *   it('should handle journey-specific variables', () => {
 *     createJourneyEnv('health', { 'API_KEY': 'health-key' });
 *     expect(getJourneyVar('health', 'API_KEY')).toBe('health-key');
 *   });
 * });
 * ```
 */
export function createJourneyTestEnv() {
  const { setEnvVars, getEnvVar } = createTestEnv();
  
  /**
   * Creates journey-specific environment variables
   * @param journey The journey type
   * @param vars Object with environment variables to set
   * @returns Object with the prefixed environment variables
   */
  const createJourneyEnv = (journey: JourneyType, vars: EnvVars): Record<string, string> => {
    const journeyPrefix = journey.toUpperCase();
    const prefixedVars: Record<string, string | null> = {};
    
    // Create prefixed variables
    Object.entries(vars).forEach(([key, value]) => {
      prefixedVars[`${journeyPrefix}_${key}`] = value;
    });
    
    setEnvVars(prefixedVars);
    
    // Return only the non-null values
    return Object.entries(prefixedVars)
      .filter(([_, value]) => value !== null)
      .reduce((acc, [key, value]) => {
        acc[key] = value as string;
        return acc;
      }, {} as Record<string, string>);
  };
  
  /**
   * Gets a journey-specific environment variable
   * @param journey The journey type
   * @param key Environment variable name (without prefix)
   * @returns The environment variable value or undefined
   */
  const getJourneyVar = (journey: JourneyType, key: string): string | undefined => {
    const journeyPrefix = journey.toUpperCase();
    return getEnvVar(`${journeyPrefix}_${key}`);
  };
  
  /**
   * Creates environment variables for multiple journeys
   * @param journeyVars Object with journey-specific variables
   * @returns Object with all set environment variables
   */
  const createMultiJourneyEnv = (journeyVars: Record<JourneyType, EnvVars>): Record<string, string> => {
    const allVars: Record<string, string> = {};
    
    Object.entries(journeyVars).forEach(([journey, vars]) => {
      const journeyVars = createJourneyEnv(journey as JourneyType, vars);
      Object.assign(allVars, journeyVars);
    });
    
    return allVars;
  };
  
  /**
   * Creates shared environment variables across all journeys
   * @param key The base environment variable name
   * @param values Journey-specific values
   * @returns Object with all set environment variables
   */
  const createSharedJourneyVar = (
    key: string,
    values: Partial<Record<JourneyType, string>>
  ): Record<string, string> => {
    const journeys: JourneyType[] = ['health', 'care', 'plan', 'gamification'];
    const envVars: Record<string, string> = {};
    
    journeys.forEach(journey => {
      if (journey in values) {
        const journeyKey = `${journey.toUpperCase()}_${key}`;
        envVars[journeyKey] = values[journey] as string;
      }
    });
    
    setEnvVars(envVars);
    return envVars;
  };
  
  return {
    createJourneyEnv,
    getJourneyVar,
    createMultiJourneyEnv,
    createSharedJourneyVar,
  };
}

/**
 * Creates a test environment for transformation function testing
 * 
 * @example
 * ```typescript
 * describe('Transform tests', () => {
 *   const { mockTransform, expectTransformed } = createTransformTestEnv();
 *   
 *   it('should transform boolean values', () => {
 *     mockTransform('FEATURE_FLAG', 'true');
 *     expectTransformed('FEATURE_FLAG', parseBoolean, true);
 *   });
 * });
 * ```
 */
export function createTransformTestEnv() {
  const { setEnvVars, getEnvVar } = createTestEnv();
  
  /**
   * Mocks an environment variable for transformation testing
   * @param key Environment variable name
   * @param value String value to set
   */
  const mockTransform = (key: string, value: string): void => {
    setEnvVars({ [key]: value });
  };
  
  /**
   * Mocks multiple environment variables for transformation testing
   * @param vars Object with environment variables to set
   */
  const mockTransforms = (vars: Record<string, string>): void => {
    setEnvVars(vars);
  };
  
  /**
   * Tests a transformation function with the given environment variable
   * @param key Environment variable name
   * @param transformFn The transformation function to test
   * @param expected The expected transformed value
   */
  const expectTransformed = <T>(
    key: string,
    transformFn: (value: string) => T,
    expected: T
  ): void => {
    const value = getEnvVar(key);
    if (value === undefined) {
      throw new Error(`Environment variable ${key} is not set`);
    }
    expect(transformFn(value)).toEqual(expected);
  };
  
  /**
   * Tests that a transformation function throws an error for invalid input
   * @param key Environment variable name
   * @param transformFn The transformation function to test
   * @param errorType Optional expected error type
   */
  const expectTransformError = <T>(
    key: string,
    transformFn: (value: string) => T,
    errorType?: any
  ): void => {
    const value = getEnvVar(key);
    if (value === undefined) {
      throw new Error(`Environment variable ${key} is not set`);
    }
    
    if (errorType) {
      expect(() => transformFn(value)).toThrow(errorType);
    } else {
      expect(() => transformFn(value)).toThrow();
    }
  };
  
  /**
   * Creates a spy for a transformation function
   * @param transformFn The transformation function to spy on
   * @returns Jest spy for the transformation function
   */
  const spyOnTransform = <T>(transformFn: (value: string) => T) => {
    return jest.fn(transformFn);
  };
  
  return {
    mockTransform,
    mockTransforms,
    expectTransformed,
    expectTransformError,
    spyOnTransform,
  };
}

/**
 * Creates a test environment for error handling testing
 * 
 * @example
 * ```typescript
 * describe('Error handling tests', () => {
 *   const { expectMissingEnvError } = createErrorTestEnv();
 *   
 *   it('should throw for missing required variables', () => {
 *     expectMissingEnvError(() => getRequiredEnv('MISSING_VAR'));
 *   });
 * });
 * ```
 */
export function createErrorTestEnv() {
  const { setEnvVars } = createTestEnv();
  
  /**
   * Expects a function to throw a MissingEnvironmentVariableError
   * @param fn Function that should throw the error
   * @param variableName Optional expected variable name in the error
   */
  const expectMissingEnvError = (fn: () => any, variableName?: string): void => {
    try {
      fn();
      fail('Expected function to throw MissingEnvironmentVariableError');
    } catch (error: any) {
      expect(error.name).toBe('MissingEnvironmentVariableError');
      if (variableName) {
        expect(error.message).toContain(variableName);
      }
    }
  };
  
  /**
   * Expects a function to throw an InvalidEnvironmentVariableError
   * @param fn Function that should throw the error
   * @param variableName Optional expected variable name in the error
   */
  const expectInvalidEnvError = (fn: () => any, variableName?: string): void => {
    try {
      fn();
      fail('Expected function to throw InvalidEnvironmentVariableError');
    } catch (error: any) {
      expect(error.name).toBe('InvalidEnvironmentVariableError');
      if (variableName) {
        expect(error.message).toContain(variableName);
      }
    }
  };
  
  /**
   * Creates an environment that will cause validation errors
   * @param vars Object with invalid environment variables to set
   */
  const createErrorEnv = (vars: Record<string, string>): void => {
    setEnvVars(vars);
  };
  
  return {
    expectMissingEnvError,
    expectInvalidEnvError,
    createErrorEnv,
  };
}

/**
 * Creates a test environment for feature flag testing
 * 
 * @example
 * ```typescript
 * describe('Feature flag tests', () => {
 *   const { enableFeature, disableFeature } = createFeatureFlagTestEnv();
 *   
 *   it('should enable features', () => {
 *     enableFeature('NEW_UI');
 *     expect(isFeatureEnabled('NEW_UI')).toBe(true);
 *   });
 * });
 * ```
 */
export function createFeatureFlagTestEnv() {
  const { setEnvVars } = createTestEnv();
  
  /**
   * Enables a feature flag for testing
   * @param feature Feature flag name
   * @param journey Optional journey to scope the feature flag
   */
  const enableFeature = (feature: string, journey?: JourneyType): void => {
    const key = journey 
      ? `${journey.toUpperCase()}_FEATURE_${feature}` 
      : `FEATURE_${feature}`;
    
    setEnvVars({ [key]: 'true' });
  };
  
  /**
   * Disables a feature flag for testing
   * @param feature Feature flag name
   * @param journey Optional journey to scope the feature flag
   */
  const disableFeature = (feature: string, journey?: JourneyType): void => {
    const key = journey 
      ? `${journey.toUpperCase()}_FEATURE_${feature}` 
      : `FEATURE_${feature}`;
    
    setEnvVars({ [key]: 'false' });
  };
  
  /**
   * Sets multiple feature flags at once
   * @param features Object with feature flags and their values
   * @param journey Optional journey to scope the feature flags
   */
  const setFeatures = (features: Record<string, boolean>, journey?: JourneyType): void => {
    const envVars: Record<string, string> = {};
    
    Object.entries(features).forEach(([feature, enabled]) => {
      const key = journey 
        ? `${journey.toUpperCase()}_FEATURE_${feature}` 
        : `FEATURE_${feature}`;
      
      envVars[key] = enabled ? 'true' : 'false';
    });
    
    setEnvVars(envVars);
  };
  
  return {
    enableFeature,
    disableFeature,
    setFeatures,
  };
}