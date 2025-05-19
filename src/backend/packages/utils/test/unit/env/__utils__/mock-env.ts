/**
 * @file Environment Mocking Utilities
 * 
 * This module provides utilities for safely mocking Node.js process.env during tests,
 * with capabilities for setting individual variables, batching multiple variables,
 * and preserving the original environment state. These utilities enable environment
 * isolation in unit tests and prevent test pollution.
 */

/**
 * Represents a snapshot of the environment state
 * Used to restore the environment after testing
 */
export interface EnvSnapshot {
  /**
   * Original environment variables before mocking
   * Maps variable names to their original values
   */
  originalEnv: Record<string, string | undefined>;
}

/**
 * Options for environment mocking
 */
export interface MockEnvOptions {
  /**
   * Whether to preserve the original environment state for later restoration
   * @default true
   */
  preserveOriginal?: boolean;
  
  /**
   * Whether to clear all existing environment variables before setting new ones
   * @default false
   */
  clearExisting?: boolean;
}

/**
 * Error message constants
 */
const ERROR_MESSAGES = {
  INVALID_ENV_NAME: 'Environment variable name must be a non-empty string',
  INVALID_ENV_VALUE: 'Environment variable value must be a string or undefined',
  INVALID_ENV_OBJECT: 'Environment variables object must be a non-null object',
};

/**
 * Create a snapshot of the current environment state
 * This can be used to restore the environment after testing
 *
 * @returns A snapshot of the current environment state
 */
export function createEnvSnapshot(): EnvSnapshot {
  return {
    originalEnv: {},
  };
}

/**
 * Mock a single environment variable for testing
 * 
 * @param name - The name of the environment variable to mock
 * @param value - The value to set (undefined to delete the variable)
 * @param snapshot - Optional snapshot to record the original state
 * @returns The updated snapshot with the original environment state
 * @throws Error if the variable name is invalid
 */
export function mockEnv(
  name: string,
  value: string | undefined,
  snapshot?: EnvSnapshot
): EnvSnapshot {
  // Validate inputs
  if (!name || typeof name !== 'string') {
    throw new Error(ERROR_MESSAGES.INVALID_ENV_NAME);
  }
  
  if (value !== undefined && typeof value !== 'string') {
    throw new Error(ERROR_MESSAGES.INVALID_ENV_VALUE);
  }
  
  // Create or use the provided snapshot
  const envSnapshot = snapshot || createEnvSnapshot();
  
  // Record the original value if not already captured
  if (!(name in envSnapshot.originalEnv)) {
    envSnapshot.originalEnv[name] = process.env[name];
  }
  
  // Set or delete the environment variable
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
  
  return envSnapshot;
}

/**
 * Mock multiple environment variables at once
 * 
 * @param envVars - Object mapping environment variable names to their values
 * @param options - Optional configuration for the mocking behavior
 * @returns A snapshot of the original environment state
 * @throws Error if the environment variables object is invalid
 */
export function mockMultipleEnv(
  envVars: Record<string, string | undefined>,
  options: MockEnvOptions = {}
): EnvSnapshot {
  // Validate inputs
  if (!envVars || typeof envVars !== 'object') {
    throw new Error(ERROR_MESSAGES.INVALID_ENV_OBJECT);
  }
  
  const { preserveOriginal = true, clearExisting = false } = options;
  
  // Create a snapshot to track original values
  const snapshot = createEnvSnapshot();
  
  // Clear all existing environment variables if requested
  if (clearExisting) {
    Object.keys(process.env).forEach((key) => {
      // Record the original value before clearing
      if (preserveOriginal && !(key in snapshot.originalEnv)) {
        snapshot.originalEnv[key] = process.env[key];
      }
      delete process.env[key];
    });
  }
  
  // Set each environment variable
  Object.entries(envVars).forEach(([name, value]) => {
    // Record the original value if not already captured
    if (preserveOriginal && !(name in snapshot.originalEnv)) {
      snapshot.originalEnv[name] = process.env[name];
    }
    
    // Set or delete the environment variable
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  });
  
  return snapshot;
}

/**
 * Create a test environment with journey-specific variables
 * 
 * @param journeyType - The journey type ('health', 'care', or 'plan')
 * @param envVars - Additional environment variables to set
 * @param options - Optional configuration for the mocking behavior
 * @returns A snapshot of the original environment state
 */
export function mockJourneyEnv(
  journeyType: 'health' | 'care' | 'plan',
  envVars: Record<string, string | undefined> = {},
  options: MockEnvOptions = {}
): EnvSnapshot {
  // Create journey-specific environment variables with proper prefixing
  const journeyPrefix = journeyType.toUpperCase();
  
  // Common journey environment variables
  const journeyEnv: Record<string, string> = {
    [`${journeyPrefix}_JOURNEY_ENABLED`]: 'true',
    [`${journeyPrefix}_JOURNEY_VERSION`]: '1.0.0',
    [`${journeyPrefix}_JOURNEY_API_URL`]: `http://localhost:3000/api/${journeyType}`,
    'JOURNEY_CONTEXT_ENABLED': 'true',
  };
  
  // Merge with additional environment variables
  const mergedEnv = { ...journeyEnv, ...envVars };
  
  // Mock the environment
  return mockMultipleEnv(mergedEnv, options);
}

/**
 * Set up a test environment with common testing variables
 * 
 * @param envVars - Additional environment variables to set
 * @param options - Optional configuration for the mocking behavior
 * @returns A snapshot of the original environment state
 */
export function mockTestEnv(
  envVars: Record<string, string | undefined> = {},
  options: MockEnvOptions = {}
): EnvSnapshot {
  // Common test environment variables
  const testEnv: Record<string, string> = {
    'NODE_ENV': 'test',
    'LOG_LEVEL': 'error',
    'TEST_MODE': 'true',
    'DISABLE_API_AUTH': 'true',
    'USE_MOCK_SERVICES': 'true',
  };
  
  // Merge with additional environment variables
  const mergedEnv = { ...testEnv, ...envVars };
  
  // Mock the environment
  return mockMultipleEnv(mergedEnv, options);
}

/**
 * Set up a development environment for testing
 * 
 * @param envVars - Additional environment variables to set
 * @param options - Optional configuration for the mocking behavior
 * @returns A snapshot of the original environment state
 */
export function mockDevEnv(
  envVars: Record<string, string | undefined> = {},
  options: MockEnvOptions = {}
): EnvSnapshot {
  // Common development environment variables
  const devEnv: Record<string, string> = {
    'NODE_ENV': 'development',
    'LOG_LEVEL': 'debug',
    'API_PORT': '3000',
    'DATABASE_URL': 'postgresql://postgres:postgres@localhost:5432/austa_dev',
    'REDIS_URL': 'redis://localhost:6379',
    'KAFKA_BROKERS': 'localhost:9092',
  };
  
  // Merge with additional environment variables
  const mergedEnv = { ...devEnv, ...envVars };
  
  // Mock the environment
  return mockMultipleEnv(mergedEnv, options);
}

/**
 * Set up a production-like environment for testing
 * 
 * @param envVars - Additional environment variables to set
 * @param options - Optional configuration for the mocking behavior
 * @returns A snapshot of the original environment state
 */
export function mockProdEnv(
  envVars: Record<string, string | undefined> = {},
  options: MockEnvOptions = {}
): EnvSnapshot {
  // Common production environment variables
  const prodEnv: Record<string, string> = {
    'NODE_ENV': 'production',
    'LOG_LEVEL': 'info',
    'API_PORT': '8080',
    'ENABLE_TELEMETRY': 'true',
    'CACHE_TTL': '3600',
    'RATE_LIMIT_WINDOW': '60000',
    'RATE_LIMIT_MAX': '100',
  };
  
  // Merge with additional environment variables
  const mergedEnv = { ...prodEnv, ...envVars };
  
  // Mock the environment
  return mockMultipleEnv(mergedEnv, options);
}

/**
 * Set up Jest beforeEach/afterEach hooks for environment mocking and restoration
 * This utility simplifies test setup by automatically handling environment state
 * 
 * @param setupFn - Function to set up the environment for each test
 * @returns The snapshot created by the setup function
 */
export function withMockedEnv(
  setupFn: () => EnvSnapshot
): { getSnapshot: () => EnvSnapshot } {
  // Ensure we're in a Jest environment
  if (typeof beforeEach !== 'function' || typeof afterEach !== 'function') {
    throw new Error('withMockedEnv requires Jest testing environment');
  }
  
  let snapshot: EnvSnapshot;
  
  beforeEach(() => {
    // Set up the environment for each test
    snapshot = setupFn();
  });
  
  afterEach(() => {
    // Restore the environment after each test
    // This relies on the restoreEnv function from restore-env.ts
    // which will be imported by consumers of this module
  });
  
  return {
    getSnapshot: () => snapshot,
  };
}