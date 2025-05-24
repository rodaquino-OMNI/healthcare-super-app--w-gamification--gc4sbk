/**
 * Utilities for safely mocking Node.js process.env during tests.
 * 
 * These utilities enable environment isolation in unit tests, prevent test pollution,
 * and support testing environment-specific code paths without modifying the actual environment.
 */

/**
 * Type representing a snapshot of environment variables
 */
type EnvSnapshot = {
  [key: string]: string | undefined;
};

/**
 * Stores the original state of process.env before any mocking
 */
let originalEnv: EnvSnapshot | null = null;

/**
 * Takes a snapshot of the current environment state
 * @returns A snapshot of the current environment variables
 */
export const takeEnvSnapshot = (): EnvSnapshot => {
  const snapshot: EnvSnapshot = {};
  
  // Create a copy of all current environment variables
  Object.keys(process.env).forEach((key) => {
    snapshot[key] = process.env[key];
  });
  
  return snapshot;
};

/**
 * Saves the current environment state if not already saved
 */
const saveOriginalEnvIfNeeded = (): void => {
  if (originalEnv === null) {
    originalEnv = takeEnvSnapshot();
  }
};

/**
 * Mocks a single environment variable for testing
 * 
 * @param key - The environment variable name to mock
 * @param value - The value to set (use undefined to unset)
 * @returns The previous value of the environment variable
 * 
 * @example
 * // Mock DATABASE_URL for testing
 * mockEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/testdb');
 */
export const mockEnv = (key: string, value: string | undefined): string | undefined => {
  saveOriginalEnvIfNeeded();
  
  // Store the current value before changing
  const previousValue = process.env[key];
  
  if (value === undefined) {
    // Delete the key if value is undefined
    delete process.env[key];
  } else {
    // Set the new value
    process.env[key] = value;
  }
  
  return previousValue;
};

/**
 * Mocks multiple environment variables at once
 * 
 * @param envVars - Object containing environment variables to mock
 * @returns Object containing the previous values of the environment variables
 * 
 * @example
 * // Mock multiple environment variables for testing
 * mockMultipleEnv({
 *   NODE_ENV: 'test',
 *   LOG_LEVEL: 'error',
 *   API_URL: 'http://test-api.example.com'
 * });
 */
export const mockMultipleEnv = (envVars: Record<string, string | undefined>): Record<string, string | undefined> => {
  saveOriginalEnvIfNeeded();
  
  const previousValues: Record<string, string | undefined> = {};
  
  // Process each environment variable
  Object.entries(envVars).forEach(([key, value]) => {
    previousValues[key] = mockEnv(key, value);
  });
  
  return previousValues;
};

/**
 * Restores all mocked environment variables to their original values
 * 
 * @returns true if environment was restored, false if no restoration was needed
 * 
 * @example
 * // In Jest afterEach or afterAll
 * afterEach(() => {
 *   restoreEnv();
 * });
 */
export const restoreEnv = (): boolean => {
  if (originalEnv === null) {
    return false; // Nothing to restore
  }
  
  // Get current keys in process.env
  const currentKeys = new Set(Object.keys(process.env));
  // Get original keys
  const originalKeys = new Set(Object.keys(originalEnv));
  
  // Remove keys that didn't exist in the original environment
  currentKeys.forEach((key) => {
    if (!originalKeys.has(key)) {
      delete process.env[key];
    }
  });
  
  // Restore original values
  originalKeys.forEach((key) => {
    const originalValue = originalEnv![key];
    if (originalValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
  });
  
  // Clear the stored original environment
  originalEnv = null;
  
  return true;
};

/**
 * Utility for setting up environment mocks before tests and restoring after
 * 
 * @param setupFn - Function that sets up environment variables
 * @returns Object with setup and cleanup functions for Jest
 * 
 * @example
 * // In a Jest test file
 * const envSetup = withMockedEnv(() => {
 *   mockEnv('NODE_ENV', 'test');
 *   mockEnv('API_KEY', 'test-key');
 * });
 * 
 * beforeEach(envSetup.setup);
 * afterEach(envSetup.cleanup);
 */
export const withMockedEnv = (setupFn: () => void) => {
  return {
    /**
     * Setup function to use with Jest beforeEach
     */
    setup: () => {
      saveOriginalEnvIfNeeded();
      setupFn();
    },
    
    /**
     * Cleanup function to use with Jest afterEach
     */
    cleanup: () => {
      restoreEnv();
    }
  };
};

/**
 * Creates a Jest-compatible setup function for environment mocking
 * 
 * @param envVars - Object containing environment variables to mock
 * @returns Function that can be used with Jest beforeEach
 * 
 * @example
 * // In a Jest test file
 * beforeEach(setupTestEnv({
 *   NODE_ENV: 'test',
 *   LOG_LEVEL: 'error',
 *   JOURNEY_CONTEXT: 'health'
 * }));
 * afterEach(() => restoreEnv());
 */
export const setupTestEnv = (envVars: Record<string, string | undefined>) => {
  return () => {
    mockMultipleEnv(envVars);
  };
};

/**
 * Creates a Jest-compatible setup function for journey-specific environment mocking
 * 
 * @param journey - The journey name ('health', 'care', or 'plan')
 * @param envVars - Object containing environment variables to mock
 * @returns Function that can be used with Jest beforeEach
 * 
 * @example
 * // In a Jest test file for health journey
 * beforeEach(setupJourneyEnv('health', {
 *   API_URL: 'http://health-api.example.com',
 *   FEATURE_FLAGS: 'health-metrics,device-sync'
 * }));
 * afterEach(() => restoreEnv());
 */
export const setupJourneyEnv = (journey: 'health' | 'care' | 'plan', envVars: Record<string, string | undefined>) => {
  return () => {
    // Set journey context first
    mockEnv('JOURNEY_CONTEXT', journey);
    
    // Then set journey-specific variables
    mockMultipleEnv(envVars);
  };
};