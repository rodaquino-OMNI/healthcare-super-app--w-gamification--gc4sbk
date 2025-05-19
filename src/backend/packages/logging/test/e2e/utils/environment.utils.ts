/**
 * Environment utilities for E2E testing of the logging package.
 * Provides functions to manipulate environment variables during tests,
 * simulate different deployment environments, and restore original settings.
 */

/**
 * Represents the possible deployment environments for the AUSTA SuperApp.
 */
export enum DeploymentEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Represents the possible journey types in the AUSTA SuperApp.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Interface for environment variable backup.
 */
interface EnvironmentBackup {
  [key: string]: string | undefined;
}

/**
 * Stores the original environment variables to restore after tests.
 */
let environmentBackup: EnvironmentBackup = {};

/**
 * Sets an environment variable for testing purposes.
 * @param key The environment variable name
 * @param value The value to set
 */
export function setEnvironmentVariable(key: string, value: string): void {
  // Backup the original value if not already backed up
  if (!(key in environmentBackup)) {
    environmentBackup[key] = process.env[key];
  }
  
  // Set the new value
  process.env[key] = value;
}

/**
 * Sets multiple environment variables at once.
 * @param variables Object containing environment variables to set
 */
export function setEnvironmentVariables(variables: Record<string, string>): void {
  Object.entries(variables).forEach(([key, value]) => {
    setEnvironmentVariable(key, value);
  });
}

/**
 * Simulates a specific deployment environment by setting relevant environment variables.
 * @param environment The deployment environment to simulate
 */
export function simulateEnvironment(environment: DeploymentEnvironment): void {
  // Set NODE_ENV appropriately
  setEnvironmentVariable('NODE_ENV', environment);
  
  // Set log level based on environment
  switch (environment) {
    case DeploymentEnvironment.DEVELOPMENT:
      setEnvironmentVariable('LOG_LEVEL', 'debug');
      setEnvironmentVariable('LOG_FORMAT', 'pretty');
      break;
    case DeploymentEnvironment.STAGING:
      setEnvironmentVariable('LOG_LEVEL', 'info');
      setEnvironmentVariable('LOG_FORMAT', 'json');
      break;
    case DeploymentEnvironment.PRODUCTION:
      setEnvironmentVariable('LOG_LEVEL', 'warn');
      setEnvironmentVariable('LOG_FORMAT', 'json');
      break;
  }
  
  // Set additional environment-specific variables
  setEnvironmentVariable('DEPLOYMENT_ENVIRONMENT', environment);
}

/**
 * Configures journey-specific environment variables for testing.
 * @param journey The journey type to configure
 */
export function configureJourneyEnvironment(journey: JourneyType): void {
  // Set journey-specific environment variables
  setEnvironmentVariable('JOURNEY_TYPE', journey);
  
  // Configure journey-specific log settings
  switch (journey) {
    case JourneyType.HEALTH:
      setEnvironmentVariable('HEALTH_SERVICE_LOG_CONTEXT', 'health-journey');
      break;
    case JourneyType.CARE:
      setEnvironmentVariable('CARE_SERVICE_LOG_CONTEXT', 'care-journey');
      break;
    case JourneyType.PLAN:
      setEnvironmentVariable('PLAN_SERVICE_LOG_CONTEXT', 'plan-journey');
      break;
  }
}

/**
 * Restores a specific environment variable to its original value.
 * @param key The environment variable to restore
 */
export function restoreEnvironmentVariable(key: string): void {
  if (key in environmentBackup) {
    const originalValue = environmentBackup[key];
    
    if (originalValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
    
    // Remove from backup after restoring
    delete environmentBackup[key];
  }
}

/**
 * Restores all modified environment variables to their original values.
 */
export function restoreEnvironment(): void {
  Object.keys(environmentBackup).forEach(key => {
    const originalValue = environmentBackup[key];
    
    if (originalValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
  });
  
  // Clear the backup after restoring all variables
  environmentBackup = {};
}

/**
 * Creates a test environment setup function that can be used in beforeEach/beforeAll hooks.
 * @param environment The deployment environment to simulate
 * @param journey Optional journey type to configure
 * @returns A function that sets up the test environment
 */
export function createTestEnvironment(
  environment: DeploymentEnvironment,
  journey?: JourneyType
): () => void {
  return () => {
    simulateEnvironment(environment);
    if (journey) {
      configureJourneyEnvironment(journey);
    }
  };
}

/**
 * Creates a test environment teardown function that can be used in afterEach/afterAll hooks.
 * @returns A function that restores the original environment
 */
export function createTestTeardown(): () => void {
  return () => {
    restoreEnvironment();
  };
}

/**
 * Utility to get the current deployment environment.
 * @returns The current deployment environment or DEVELOPMENT as default
 */
export function getCurrentEnvironment(): DeploymentEnvironment {
  const env = process.env.NODE_ENV as DeploymentEnvironment;
  
  if (Object.values(DeploymentEnvironment).includes(env)) {
    return env;
  }
  
  return DeploymentEnvironment.DEVELOPMENT;
}

/**
 * Utility to check if the current environment is a production environment.
 * @returns True if the current environment is production
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === DeploymentEnvironment.PRODUCTION;
}

/**
 * Utility to check if the current environment is a development environment.
 * @returns True if the current environment is development
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === DeploymentEnvironment.DEVELOPMENT;
}

/**
 * Utility to check if the current environment is a staging environment.
 * @returns True if the current environment is staging
 */
export function isStaging(): boolean {
  return getCurrentEnvironment() === DeploymentEnvironment.STAGING;
}