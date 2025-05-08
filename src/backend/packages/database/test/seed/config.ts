/**
 * Database Test Seed Configuration
 * 
 * This module provides a centralized configuration system for test database seeding.
 * It allows customization of test data volume, complexity, and specific journey scenarios
 * through environment variables or direct configuration.
 */

import { z } from 'zod';
import { JourneyType, SeedOptions, SeedDataValidationError, SeedDataValidationResult } from './types';
import { seedLogger } from './utils';

/**
 * Environment variable names used for configuration
 */
export enum EnvVar {
  // General configuration
  TEST_ENV = 'TEST_ENV',
  SEED_CLEAN_DB = 'SEED_CLEAN_DB',
  SEED_LOGGING = 'SEED_LOGGING',
  SEED_JOURNEYS = 'SEED_JOURNEYS',
  SEED_INCLUDE_TEST_DATA = 'SEED_INCLUDE_TEST_DATA',
  SEED_TEST_DATA_COUNT = 'SEED_TEST_DATA_COUNT',
  SEED_RANDOM_SEED = 'SEED_RANDOM_SEED',
  
  // Journey-specific configuration
  SEED_HEALTH_METRICS_COUNT = 'SEED_HEALTH_METRICS_COUNT',
  SEED_HEALTH_GOALS_COUNT = 'SEED_HEALTH_GOALS_COUNT',
  SEED_HEALTH_DEVICES_COUNT = 'SEED_HEALTH_DEVICES_COUNT',
  
  SEED_CARE_PROVIDERS_COUNT = 'SEED_CARE_PROVIDERS_COUNT',
  SEED_CARE_APPOINTMENTS_COUNT = 'SEED_CARE_APPOINTMENTS_COUNT',
  SEED_CARE_MEDICATIONS_COUNT = 'SEED_CARE_MEDICATIONS_COUNT',
  
  SEED_PLAN_INSURANCE_COUNT = 'SEED_PLAN_INSURANCE_COUNT',
  SEED_PLAN_CLAIMS_COUNT = 'SEED_PLAN_CLAIMS_COUNT',
  SEED_PLAN_BENEFITS_COUNT = 'SEED_PLAN_BENEFITS_COUNT',
  
  SEED_GAMIFICATION_ACHIEVEMENTS_COUNT = 'SEED_GAMIFICATION_ACHIEVEMENTS_COUNT',
  SEED_GAMIFICATION_REWARDS_COUNT = 'SEED_GAMIFICATION_REWARDS_COUNT',
  SEED_GAMIFICATION_QUESTS_COUNT = 'SEED_GAMIFICATION_QUESTS_COUNT',
  
  // Test environment configuration
  TEST_DATABASE_URL = 'TEST_DATABASE_URL',
  TEST_TRANSACTION_ENABLED = 'TEST_TRANSACTION_ENABLED',
  TEST_RETRY_ATTEMPTS = 'TEST_RETRY_ATTEMPTS',
}

/**
 * Supported test environments
 */
export enum TestEnvironment {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  PERFORMANCE = 'performance',
}

/**
 * Journey-specific seed configuration
 */
export interface JourneySeedConfig {
  enabled: boolean;
  testDataCount: number;
}

/**
 * Health journey seed configuration
 */
export interface HealthJourneySeedConfig extends JourneySeedConfig {
  metricsCount: number;
  goalsCount: number;
  devicesCount: number;
}

/**
 * Care journey seed configuration
 */
export interface CareJourneySeedConfig extends JourneySeedConfig {
  providersCount: number;
  appointmentsCount: number;
  medicationsCount: number;
}

/**
 * Plan journey seed configuration
 */
export interface PlanJourneySeedConfig extends JourneySeedConfig {
  insuranceCount: number;
  claimsCount: number;
  benefitsCount: number;
}

/**
 * Gamification journey seed configuration
 */
export interface GamificationJourneySeedConfig extends JourneySeedConfig {
  achievementsCount: number;
  rewardsCount: number;
  questsCount: number;
}

/**
 * Complete seed configuration
 */
export interface SeedConfig {
  // General configuration
  environment: TestEnvironment;
  cleanDatabase: boolean;
  logging: boolean;
  includeTestData: boolean;
  defaultTestDataCount: number;
  randomSeed: number;
  
  // Database configuration
  databaseUrl: string;
  transactionEnabled: boolean;
  retryAttempts: number;
  
  // Journey configuration
  journeys: {
    health: HealthJourneySeedConfig;
    care: CareJourneySeedConfig;
    plan: PlanJourneySeedConfig;
    gamification: GamificationJourneySeedConfig;
  };
}

/**
 * Default configuration values for each test environment
 */
const environmentDefaults: Record<TestEnvironment, Partial<SeedConfig>> = {
  [TestEnvironment.UNIT]: {
    cleanDatabase: true,
    logging: false,
    includeTestData: false,
    defaultTestDataCount: 1,
    transactionEnabled: false,
    retryAttempts: 0,
  },
  [TestEnvironment.INTEGRATION]: {
    cleanDatabase: true,
    logging: true,
    includeTestData: true,
    defaultTestDataCount: 3,
    transactionEnabled: true,
    retryAttempts: 2,
  },
  [TestEnvironment.E2E]: {
    cleanDatabase: true,
    logging: true,
    includeTestData: true,
    defaultTestDataCount: 5,
    transactionEnabled: true,
    retryAttempts: 3,
  },
  [TestEnvironment.PERFORMANCE]: {
    cleanDatabase: false,
    logging: true,
    includeTestData: true,
    defaultTestDataCount: 50,
    transactionEnabled: true,
    retryAttempts: 3,
  },
};

/**
 * Base default configuration
 */
const baseDefaults: SeedConfig = {
  environment: TestEnvironment.UNIT,
  cleanDatabase: true,
  logging: true,
  includeTestData: false,
  defaultTestDataCount: 5,
  randomSeed: 42,
  
  databaseUrl: 'postgresql://postgres:postgres@localhost:5432/austa_test',
  transactionEnabled: true,
  retryAttempts: 3,
  
  journeys: {
    health: {
      enabled: true,
      testDataCount: 5,
      metricsCount: 10,
      goalsCount: 3,
      devicesCount: 2,
    },
    care: {
      enabled: true,
      testDataCount: 5,
      providersCount: 5,
      appointmentsCount: 3,
      medicationsCount: 4,
    },
    plan: {
      enabled: true,
      testDataCount: 5,
      insuranceCount: 2,
      claimsCount: 3,
      benefitsCount: 5,
    },
    gamification: {
      enabled: true,
      testDataCount: 5,
      achievementsCount: 5,
      rewardsCount: 3,
      questsCount: 2,
    },
  },
};

/**
 * Zod schema for validating journey configuration
 */
const healthJourneySchema = z.object({
  enabled: z.boolean(),
  testDataCount: z.number().int().min(0),
  metricsCount: z.number().int().min(0),
  goalsCount: z.number().int().min(0),
  devicesCount: z.number().int().min(0),
});

const careJourneySchema = z.object({
  enabled: z.boolean(),
  testDataCount: z.number().int().min(0),
  providersCount: z.number().int().min(0),
  appointmentsCount: z.number().int().min(0),
  medicationsCount: z.number().int().min(0),
});

const planJourneySchema = z.object({
  enabled: z.boolean(),
  testDataCount: z.number().int().min(0),
  insuranceCount: z.number().int().min(0),
  claimsCount: z.number().int().min(0),
  benefitsCount: z.number().int().min(0),
});

const gamificationJourneySchema = z.object({
  enabled: z.boolean(),
  testDataCount: z.number().int().min(0),
  achievementsCount: z.number().int().min(0),
  rewardsCount: z.number().int().min(0),
  questsCount: z.number().int().min(0),
});

/**
 * Zod schema for validating the complete configuration
 */
const configSchema = z.object({
  environment: z.nativeEnum(TestEnvironment),
  cleanDatabase: z.boolean(),
  logging: z.boolean(),
  includeTestData: z.boolean(),
  defaultTestDataCount: z.number().int().min(0),
  randomSeed: z.number().int(),
  
  databaseUrl: z.string().url(),
  transactionEnabled: z.boolean(),
  retryAttempts: z.number().int().min(0).max(10),
  
  journeys: z.object({
    health: healthJourneySchema,
    care: careJourneySchema,
    plan: planJourneySchema,
    gamification: gamificationJourneySchema,
  }),
});

/**
 * Gets a boolean value from an environment variable
 * 
 * @param name Environment variable name
 * @param defaultValue Default value if not set
 * @returns Boolean value
 */
function getBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Gets a number value from an environment variable
 * 
 * @param name Environment variable name
 * @param defaultValue Default value if not set
 * @returns Number value
 */
function getNumberEnv(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Gets a string value from an environment variable
 * 
 * @param name Environment variable name
 * @param defaultValue Default value if not set
 * @returns String value
 */
function getStringEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Gets an array of journey types from an environment variable
 * 
 * @param name Environment variable name
 * @param defaultValue Default value if not set
 * @returns Array of journey types
 */
function getJourneysEnv(name: string, defaultValue: JourneyType[]): JourneyType[] {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  
  return value
    .split(',')
    .map(j => j.trim().toLowerCase())
    .filter(j => ['health', 'care', 'plan', 'gamification', null].includes(j as JourneyType)) as JourneyType[];
}

/**
 * Gets the test environment from environment variables
 * 
 * @returns Test environment
 */
function getTestEnvironment(): TestEnvironment {
  const env = getStringEnv(EnvVar.TEST_ENV, '').toLowerCase();
  
  switch (env) {
    case 'unit':
      return TestEnvironment.UNIT;
    case 'integration':
      return TestEnvironment.INTEGRATION;
    case 'e2e':
      return TestEnvironment.E2E;
    case 'performance':
      return TestEnvironment.PERFORMANCE;
    default:
      // Default to unit tests if not specified
      return TestEnvironment.UNIT;
  }
}

/**
 * Loads configuration from environment variables
 * 
 * @returns Configuration from environment variables
 */
function loadConfigFromEnv(): Partial<SeedConfig> {
  const environment = getTestEnvironment();
  
  // Start with environment-specific defaults
  const envDefaults = environmentDefaults[environment] || {};
  
  // Load general configuration from environment variables
  const config: Partial<SeedConfig> = {
    ...envDefaults,
    environment,
    cleanDatabase: getBooleanEnv(EnvVar.SEED_CLEAN_DB, envDefaults.cleanDatabase ?? baseDefaults.cleanDatabase),
    logging: getBooleanEnv(EnvVar.SEED_LOGGING, envDefaults.logging ?? baseDefaults.logging),
    includeTestData: getBooleanEnv(EnvVar.SEED_INCLUDE_TEST_DATA, envDefaults.includeTestData ?? baseDefaults.includeTestData),
    defaultTestDataCount: getNumberEnv(EnvVar.SEED_TEST_DATA_COUNT, envDefaults.defaultTestDataCount ?? baseDefaults.defaultTestDataCount),
    randomSeed: getNumberEnv(EnvVar.SEED_RANDOM_SEED, baseDefaults.randomSeed),
    
    databaseUrl: getStringEnv(EnvVar.TEST_DATABASE_URL, baseDefaults.databaseUrl),
    transactionEnabled: getBooleanEnv(EnvVar.TEST_TRANSACTION_ENABLED, envDefaults.transactionEnabled ?? baseDefaults.transactionEnabled),
    retryAttempts: getNumberEnv(EnvVar.TEST_RETRY_ATTEMPTS, envDefaults.retryAttempts ?? baseDefaults.retryAttempts),
  };
  
  // Get enabled journeys
  const journeys = getJourneysEnv(EnvVar.SEED_JOURNEYS, []);
  const journeyConfig: Partial<SeedConfig['journeys']> = {};
  
  // Only set journey configuration if explicitly specified
  if (journeys.length > 0) {
    // Health journey configuration
    if (journeys.includes('health')) {
      journeyConfig.health = {
        enabled: true,
        testDataCount: getNumberEnv(EnvVar.SEED_TEST_DATA_COUNT, baseDefaults.journeys.health.testDataCount),
        metricsCount: getNumberEnv(EnvVar.SEED_HEALTH_METRICS_COUNT, baseDefaults.journeys.health.metricsCount),
        goalsCount: getNumberEnv(EnvVar.SEED_HEALTH_GOALS_COUNT, baseDefaults.journeys.health.goalsCount),
        devicesCount: getNumberEnv(EnvVar.SEED_HEALTH_DEVICES_COUNT, baseDefaults.journeys.health.devicesCount),
      };
    } else {
      journeyConfig.health = { ...baseDefaults.journeys.health, enabled: false };
    }
    
    // Care journey configuration
    if (journeys.includes('care')) {
      journeyConfig.care = {
        enabled: true,
        testDataCount: getNumberEnv(EnvVar.SEED_TEST_DATA_COUNT, baseDefaults.journeys.care.testDataCount),
        providersCount: getNumberEnv(EnvVar.SEED_CARE_PROVIDERS_COUNT, baseDefaults.journeys.care.providersCount),
        appointmentsCount: getNumberEnv(EnvVar.SEED_CARE_APPOINTMENTS_COUNT, baseDefaults.journeys.care.appointmentsCount),
        medicationsCount: getNumberEnv(EnvVar.SEED_CARE_MEDICATIONS_COUNT, baseDefaults.journeys.care.medicationsCount),
      };
    } else {
      journeyConfig.care = { ...baseDefaults.journeys.care, enabled: false };
    }
    
    // Plan journey configuration
    if (journeys.includes('plan')) {
      journeyConfig.plan = {
        enabled: true,
        testDataCount: getNumberEnv(EnvVar.SEED_TEST_DATA_COUNT, baseDefaults.journeys.plan.testDataCount),
        insuranceCount: getNumberEnv(EnvVar.SEED_PLAN_INSURANCE_COUNT, baseDefaults.journeys.plan.insuranceCount),
        claimsCount: getNumberEnv(EnvVar.SEED_PLAN_CLAIMS_COUNT, baseDefaults.journeys.plan.claimsCount),
        benefitsCount: getNumberEnv(EnvVar.SEED_PLAN_BENEFITS_COUNT, baseDefaults.journeys.plan.benefitsCount),
      };
    } else {
      journeyConfig.plan = { ...baseDefaults.journeys.plan, enabled: false };
    }
    
    // Gamification journey configuration
    if (journeys.includes('gamification')) {
      journeyConfig.gamification = {
        enabled: true,
        testDataCount: getNumberEnv(EnvVar.SEED_TEST_DATA_COUNT, baseDefaults.journeys.gamification.testDataCount),
        achievementsCount: getNumberEnv(EnvVar.SEED_GAMIFICATION_ACHIEVEMENTS_COUNT, baseDefaults.journeys.gamification.achievementsCount),
        rewardsCount: getNumberEnv(EnvVar.SEED_GAMIFICATION_REWARDS_COUNT, baseDefaults.journeys.gamification.rewardsCount),
        questsCount: getNumberEnv(EnvVar.SEED_GAMIFICATION_QUESTS_COUNT, baseDefaults.journeys.gamification.questsCount),
      };
    } else {
      journeyConfig.gamification = { ...baseDefaults.journeys.gamification, enabled: false };
    }
    
    config.journeys = journeyConfig as SeedConfig['journeys'];
  }
  
  return config;
}

/**
 * Validates the configuration using Zod schema
 * 
 * @param config Configuration to validate
 * @returns Validation result
 */
export function validateConfig(config: SeedConfig): SeedDataValidationResult {
  try {
    configSchema.parse(config);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: SeedDataValidationError[] = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        value: err.code,
      }));
      
      return { valid: false, errors };
    }
    
    return {
      valid: false,
      errors: [{
        path: '',
        message: 'Unknown validation error',
        value: String(error),
      }],
    };
  }
}

/**
 * Creates a configuration object with defaults and environment overrides
 * 
 * @param overrides Configuration overrides
 * @returns Complete configuration
 */
export function createConfig(overrides: Partial<SeedConfig> = {}): SeedConfig {
  // Start with base defaults
  const config = { ...baseDefaults };
  
  // Apply environment-specific defaults
  const envConfig = loadConfigFromEnv();
  Object.assign(config, envConfig);
  
  // Apply explicit overrides
  Object.assign(config, overrides);
  
  // Apply journey-specific overrides
  if (overrides.journeys) {
    config.journeys = {
      health: { ...config.journeys.health, ...overrides.journeys.health },
      care: { ...config.journeys.care, ...overrides.journeys.care },
      plan: { ...config.journeys.plan, ...overrides.journeys.plan },
      gamification: { ...config.journeys.gamification, ...overrides.journeys.gamification },
    };
  }
  
  // Validate the configuration
  const validationResult = validateConfig(config);
  if (!validationResult.valid) {
    seedLogger.error('Invalid seed configuration', null, { errors: validationResult.errors });
    throw new Error(`Invalid seed configuration: ${validationResult.errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
  }
  
  return config;
}

/**
 * Converts a seed configuration to seed options
 * 
 * @param config Seed configuration
 * @returns Seed options
 */
export function configToSeedOptions(config: SeedConfig): SeedOptions {
  // Get enabled journeys
  const journeys: JourneyType[] = [];
  if (config.journeys.health.enabled) journeys.push('health');
  if (config.journeys.care.enabled) journeys.push('care');
  if (config.journeys.plan.enabled) journeys.push('plan');
  if (config.journeys.gamification.enabled) journeys.push('gamification');
  
  return {
    cleanDatabase: config.cleanDatabase,
    logging: config.logging,
    journeys,
    includeTestData: config.includeTestData,
    testDataCount: config.defaultTestDataCount,
    randomSeed: config.randomSeed,
  };
}

/**
 * Gets the default seed configuration
 * 
 * @returns Default seed configuration
 */
export function getDefaultConfig(): SeedConfig {
  return createConfig();
}

/**
 * Gets the seed configuration for a specific test environment
 * 
 * @param environment Test environment
 * @param overrides Configuration overrides
 * @returns Seed configuration for the environment
 */
export function getEnvironmentConfig(environment: TestEnvironment, overrides: Partial<SeedConfig> = {}): SeedConfig {
  return createConfig({
    environment,
    ...environmentDefaults[environment],
    ...overrides,
  });
}

/**
 * Gets the seed configuration for unit tests
 * 
 * @param overrides Configuration overrides
 * @returns Seed configuration for unit tests
 */
export function getUnitTestConfig(overrides: Partial<SeedConfig> = {}): SeedConfig {
  return getEnvironmentConfig(TestEnvironment.UNIT, overrides);
}

/**
 * Gets the seed configuration for integration tests
 * 
 * @param overrides Configuration overrides
 * @returns Seed configuration for integration tests
 */
export function getIntegrationTestConfig(overrides: Partial<SeedConfig> = {}): SeedConfig {
  return getEnvironmentConfig(TestEnvironment.INTEGRATION, overrides);
}

/**
 * Gets the seed configuration for end-to-end tests
 * 
 * @param overrides Configuration overrides
 * @returns Seed configuration for end-to-end tests
 */
export function getE2ETestConfig(overrides: Partial<SeedConfig> = {}): SeedConfig {
  return getEnvironmentConfig(TestEnvironment.E2E, overrides);
}

/**
 * Gets the seed configuration for performance tests
 * 
 * @param overrides Configuration overrides
 * @returns Seed configuration for performance tests
 */
export function getPerformanceTestConfig(overrides: Partial<SeedConfig> = {}): SeedConfig {
  return getEnvironmentConfig(TestEnvironment.PERFORMANCE, overrides);
}

/**
 * Gets journey-specific configuration
 * 
 * @param config Seed configuration
 * @param journey Journey type
 * @returns Journey-specific configuration or null if not enabled
 */
export function getJourneyConfig(config: SeedConfig, journey: JourneyType): JourneySeedConfig | null {
  if (!journey) return null;
  
  const journeyConfig = config.journeys[journey];
  if (!journeyConfig || !journeyConfig.enabled) return null;
  
  return journeyConfig;
}

/**
 * Default seed configuration instance
 */
export const defaultConfig = getDefaultConfig();

/**
 * Default seed options
 */
export const defaultSeedOptions = configToSeedOptions(defaultConfig);