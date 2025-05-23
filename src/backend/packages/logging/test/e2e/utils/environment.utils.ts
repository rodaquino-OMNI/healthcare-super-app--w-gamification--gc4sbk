/**
 * Environment utilities for E2E testing of the logging package.
 * Provides functions to manipulate environment variables and simulate different
 * deployment environments during tests.
 */

import { LogLevel } from '../../../src/interfaces/log-level.enum';

/**
 * Represents a backup of the original environment variables
 */
interface EnvironmentBackup {
  variables: Record<string, string | undefined>;
  nodeEnv: string | undefined;
}

/**
 * Environment configuration options for testing
 */
export interface EnvironmentOptions {
  /**
   * The NODE_ENV value to set
   */
  nodeEnv?: 'development' | 'staging' | 'production' | 'test';
  
  /**
   * The log level to set
   */
  logLevel?: LogLevel | string;
  
  /**
   * The service name to set
   */
  serviceName?: string;
  
  /**
   * Journey-specific log levels
   */
  journeyLogLevels?: {
    health?: LogLevel | string;
    care?: LogLevel | string;
    plan?: LogLevel | string;
  };
  
  /**
   * Transport configuration
   */
  transports?: {
    console?: boolean;
    file?: boolean;
    cloudwatch?: boolean;
  };
  
  /**
   * Additional environment variables to set
   */
  variables?: Record<string, string>;
}

// Store the original environment variables
let originalEnv: EnvironmentBackup | null = null;

/**
 * Backs up the current environment variables
 * @returns A backup of the current environment
 */
export function backupEnvironment(): EnvironmentBackup {
  const variablesToBackup = [
    'NODE_ENV',
    'LOG_LEVEL',
    'SERVICE_NAME',
    'APP_NAME',
    'HEALTH_LOG_LEVEL',
    'CARE_LOG_LEVEL',
    'PLAN_LOG_LEVEL',
    'ENABLE_CONSOLE_TRANSPORT',
    'ENABLE_FILE_TRANSPORT',
    'ENABLE_CLOUDWATCH_TRANSPORT',
    'LOG_FORMATTER',
    'TRACE_CORRELATION_ENABLED',
    'SANITIZATION_ENABLED',
    'AWS_REGION',
    'CLOUDWATCH_LOG_GROUP',
    'CLOUDWATCH_LOG_STREAM',
  ];

  const backup: EnvironmentBackup = {
    variables: {},
    nodeEnv: process.env.NODE_ENV,
  };

  // Backup all relevant environment variables
  for (const key of variablesToBackup) {
    backup.variables[key] = process.env[key];
  }

  return backup;
}

/**
 * Restores environment variables from a backup
 * @param backup The environment backup to restore from
 */
export function restoreEnvironment(backup: EnvironmentBackup): void {
  if (!backup) return;

  // Restore all backed up variables
  for (const [key, value] of Object.entries(backup.variables)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  // Restore NODE_ENV specifically
  if (backup.nodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = backup.nodeEnv;
  }
}

/**
 * Sets up the environment for testing with the specified options
 * @param options The environment options to set
 * @returns A function to restore the original environment
 */
export function setupTestEnvironment(options: EnvironmentOptions = {}): () => void {
  // Backup the current environment if not already backed up
  if (!originalEnv) {
    originalEnv = backupEnvironment();
  }

  // Set NODE_ENV
  if (options.nodeEnv) {
    process.env.NODE_ENV = options.nodeEnv;
  }

  // Set log level
  if (options.logLevel !== undefined) {
    process.env.LOG_LEVEL = options.logLevel.toString();
  }

  // Set service name
  if (options.serviceName) {
    process.env.SERVICE_NAME = options.serviceName;
  }

  // Set journey-specific log levels
  if (options.journeyLogLevels) {
    if (options.journeyLogLevels.health !== undefined) {
      process.env.HEALTH_LOG_LEVEL = options.journeyLogLevels.health.toString();
    }
    if (options.journeyLogLevels.care !== undefined) {
      process.env.CARE_LOG_LEVEL = options.journeyLogLevels.care.toString();
    }
    if (options.journeyLogLevels.plan !== undefined) {
      process.env.PLAN_LOG_LEVEL = options.journeyLogLevels.plan.toString();
    }
  }

  // Set transport configuration
  if (options.transports) {
    if (options.transports.console !== undefined) {
      process.env.ENABLE_CONSOLE_TRANSPORT = options.transports.console.toString();
    }
    if (options.transports.file !== undefined) {
      process.env.ENABLE_FILE_TRANSPORT = options.transports.file.toString();
    }
    if (options.transports.cloudwatch !== undefined) {
      process.env.ENABLE_CLOUDWATCH_TRANSPORT = options.transports.cloudwatch.toString();
    }
  }

  // Set additional environment variables
  if (options.variables) {
    for (const [key, value] of Object.entries(options.variables)) {
      process.env[key] = value;
    }
  }

  // Return a function to restore the original environment
  return () => {
    if (originalEnv) {
      restoreEnvironment(originalEnv);
      originalEnv = null;
    }
  };
}

/**
 * Simulates a development environment
 * @param additionalOptions Additional environment options to set
 * @returns A function to restore the original environment
 */
export function simulateDevelopmentEnvironment(additionalOptions: Partial<EnvironmentOptions> = {}): () => void {
  return setupTestEnvironment({
    nodeEnv: 'development',
    logLevel: LogLevel.DEBUG,
    transports: {
      console: true,
      file: false,
      cloudwatch: false,
    },
    variables: {
      LOG_FORMATTER: 'text',
      TRACE_CORRELATION_ENABLED: 'true',
      SANITIZATION_ENABLED: 'true',
    },
    ...additionalOptions,
  });
}

/**
 * Simulates a staging environment
 * @param additionalOptions Additional environment options to set
 * @returns A function to restore the original environment
 */
export function simulateStagingEnvironment(additionalOptions: Partial<EnvironmentOptions> = {}): () => void {
  return setupTestEnvironment({
    nodeEnv: 'staging',
    logLevel: LogLevel.INFO,
    transports: {
      console: true,
      file: true,
      cloudwatch: true,
    },
    variables: {
      LOG_FORMATTER: 'json',
      TRACE_CORRELATION_ENABLED: 'true',
      SANITIZATION_ENABLED: 'true',
      AWS_REGION: 'us-east-1',
      CLOUDWATCH_LOG_GROUP: 'austa-superapp-staging',
    },
    ...additionalOptions,
  });
}

/**
 * Simulates a production environment
 * @param additionalOptions Additional environment options to set
 * @returns A function to restore the original environment
 */
export function simulateProductionEnvironment(additionalOptions: Partial<EnvironmentOptions> = {}): () => void {
  return setupTestEnvironment({
    nodeEnv: 'production',
    logLevel: LogLevel.INFO,
    transports: {
      console: true,
      file: false,
      cloudwatch: true,
    },
    variables: {
      LOG_FORMATTER: 'json',
      TRACE_CORRELATION_ENABLED: 'true',
      SANITIZATION_ENABLED: 'true',
      AWS_REGION: 'us-east-1',
      CLOUDWATCH_LOG_GROUP: 'austa-superapp-production',
    },
    ...additionalOptions,
  });
}

/**
 * Simulates a test environment
 * @param additionalOptions Additional environment options to set
 * @returns A function to restore the original environment
 */
export function simulateTestEnvironment(additionalOptions: Partial<EnvironmentOptions> = {}): () => void {
  return setupTestEnvironment({
    nodeEnv: 'test',
    logLevel: LogLevel.DEBUG,
    transports: {
      console: false,
      file: false,
      cloudwatch: false,
    },
    variables: {
      LOG_FORMATTER: 'text',
      TRACE_CORRELATION_ENABLED: 'false',
      SANITIZATION_ENABLED: 'false',
    },
    ...additionalOptions,
  });
}

/**
 * Simulates a journey-specific environment configuration
 * @param journey The journey to configure ('health', 'care', or 'plan')
 * @param logLevel The log level for the journey
 * @param additionalOptions Additional environment options to set
 * @returns A function to restore the original environment
 */
export function simulateJourneyEnvironment(
  journey: 'health' | 'care' | 'plan',
  logLevel: LogLevel | string,
  additionalOptions: Partial<EnvironmentOptions> = {}
): () => void {
  const journeyLogLevels: EnvironmentOptions['journeyLogLevels'] = {};
  journeyLogLevels[journey] = logLevel;

  return setupTestEnvironment({
    journeyLogLevels,
    ...additionalOptions,
  });
}

/**
 * Temporarily sets environment variables for the duration of a test function
 * @param variables The environment variables to set
 * @param testFn The test function to run with the modified environment
 * @returns The result of the test function
 */
export async function withEnvironmentVariables<T>(
  variables: Record<string, string>,
  testFn: () => Promise<T> | T
): Promise<T> {
  const backup = backupEnvironment();
  
  try {
    // Set the environment variables
    for (const [key, value] of Object.entries(variables)) {
      process.env[key] = value;
    }
    
    // Run the test function
    return await testFn();
  } finally {
    // Restore the original environment
    restoreEnvironment(backup);
  }
}

/**
 * Temporarily unsets environment variables for the duration of a test function
 * @param variableNames The names of environment variables to unset
 * @param testFn The test function to run with the modified environment
 * @returns The result of the test function
 */
export async function withoutEnvironmentVariables<T>(
  variableNames: string[],
  testFn: () => Promise<T> | T
): Promise<T> {
  const backup = backupEnvironment();
  
  try {
    // Unset the environment variables
    for (const name of variableNames) {
      delete process.env[name];
    }
    
    // Run the test function
    return await testFn();
  } finally {
    // Restore the original environment
    restoreEnvironment(backup);
  }
}