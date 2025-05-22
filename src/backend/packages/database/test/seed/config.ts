/**
 * Configuration for database test seeding
 * 
 * This file provides a centralized configuration system for test database seeding,
 * allowing customization of test data volume, complexity, and specific journey scenarios.
 * It enables consistent test environments while supporting flexible testing needs
 * from unit tests to complex integration scenarios.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { z } from 'zod';

/**
 * Environment types supported by the configuration system
 */
export enum Environment {
  DEVELOPMENT = 'development',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Data volume options for controlling the amount of test data generated
 */
export enum DataVolume {
  MINIMAL = 'minimal',   // Minimal data for unit tests
  STANDARD = 'standard', // Standard data for integration tests
  LARGE = 'large',       // Large data set for performance testing
  MASSIVE = 'massive',   // Massive data set for stress testing
}

/**
 * Journey types available in the application
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GAMIFICATION = 'gamification',
}

/**
 * Base configuration interface for all journey configurations
 */
interface BaseJourneyConfig {
  enabled: boolean;
  dataVolume?: DataVolume;
  scenarioName?: string;
}

/**
 * Health journey specific configuration
 */
interface HealthJourneyConfig extends BaseJourneyConfig {
  includeMetrics: boolean;
  includeDevices: boolean;
  includeGoals: boolean;
  metricsPerUser?: number;
  devicesPerUser?: number;
  goalsPerUser?: number;
}

/**
 * Care journey specific configuration
 */
interface CareJourneyConfig extends BaseJourneyConfig {
  includeAppointments: boolean;
  includeMedications: boolean;
  includeProviders: boolean;
  includeTreatments: boolean;
  appointmentsPerUser?: number;
  medicationsPerUser?: number;
  providersCount?: number;
  treatmentsPerUser?: number;
}

/**
 * Plan journey specific configuration
 */
interface PlanJourneyConfig extends BaseJourneyConfig {
  includePlans: boolean;
  includeClaims: boolean;
  includeBenefits: boolean;
  includeDocuments: boolean;
  plansCount?: number;
  claimsPerUser?: number;
  benefitsPerPlan?: number;
  documentsPerUser?: number;
}

/**
 * Gamification journey specific configuration
 */
interface GamificationJourneyConfig extends BaseJourneyConfig {
  includeAchievements: boolean;
  includeRewards: boolean;
  includeQuests: boolean;
  includeLeaderboards: boolean;
  achievementsPerUser?: number;
  rewardsCount?: number;
  questsCount?: number;
  leaderboardsCount?: number;
}

/**
 * User configuration options
 */
interface UserConfig {
  count: number;
  includeRoles: boolean;
  includePermissions: boolean;
  adminCount?: number;
}

/**
 * Complete seed configuration interface
 */
export interface SeedConfig {
  environment: Environment;
  dataVolume: DataVolume;
  clearDatabase: boolean;
  users: UserConfig;
  journeys: {
    health: HealthJourneyConfig;
    care: CareJourneyConfig;
    plan: PlanJourneyConfig;
    gamification: GamificationJourneyConfig;
  };
  randomSeed?: number; // For deterministic random data generation
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  timeoutMs?: number; // Timeout for seeding operations
}

/**
 * Default minimal configuration for unit tests
 */
const minimalConfig: SeedConfig = {
  environment: Environment.TEST,
  dataVolume: DataVolume.MINIMAL,
  clearDatabase: true,
  users: {
    count: 2, // Just admin and one test user
    includeRoles: true,
    includePermissions: true,
    adminCount: 1,
  },
  journeys: {
    health: {
      enabled: true,
      includeMetrics: true,
      includeDevices: true,
      includeGoals: true,
      metricsPerUser: 1,
      devicesPerUser: 1,
      goalsPerUser: 1,
    },
    care: {
      enabled: true,
      includeAppointments: true,
      includeMedications: true,
      includeProviders: true,
      includeTreatments: true,
      appointmentsPerUser: 1,
      medicationsPerUser: 1,
      providersCount: 2,
      treatmentsPerUser: 1,
    },
    plan: {
      enabled: true,
      includePlans: true,
      includeClaims: true,
      includeBenefits: true,
      includeDocuments: true,
      plansCount: 2,
      claimsPerUser: 1,
      benefitsPerPlan: 2,
      documentsPerUser: 1,
    },
    gamification: {
      enabled: true,
      includeAchievements: true,
      includeRewards: true,
      includeQuests: true,
      includeLeaderboards: true,
      achievementsPerUser: 1,
      rewardsCount: 2,
      questsCount: 2,
      leaderboardsCount: 1,
    },
  },
  logLevel: 'error',
  timeoutMs: 30000,
};

/**
 * Default standard configuration for integration tests
 */
const standardConfig: SeedConfig = {
  ...minimalConfig,
  dataVolume: DataVolume.STANDARD,
  users: {
    count: 10,
    includeRoles: true,
    includePermissions: true,
    adminCount: 2,
  },
  journeys: {
    health: {
      enabled: true,
      includeMetrics: true,
      includeDevices: true,
      includeGoals: true,
      metricsPerUser: 5,
      devicesPerUser: 2,
      goalsPerUser: 3,
    },
    care: {
      enabled: true,
      includeAppointments: true,
      includeMedications: true,
      includeProviders: true,
      includeTreatments: true,
      appointmentsPerUser: 3,
      medicationsPerUser: 3,
      providersCount: 5,
      treatmentsPerUser: 2,
    },
    plan: {
      enabled: true,
      includePlans: true,
      includeClaims: true,
      includeBenefits: true,
      includeDocuments: true,
      plansCount: 3,
      claimsPerUser: 3,
      benefitsPerPlan: 5,
      documentsPerUser: 3,
    },
    gamification: {
      enabled: true,
      includeAchievements: true,
      includeRewards: true,
      includeQuests: true,
      includeLeaderboards: true,
      achievementsPerUser: 5,
      rewardsCount: 5,
      questsCount: 5,
      leaderboardsCount: 2,
    },
  },
  logLevel: 'info',
};

/**
 * Default large configuration for performance testing
 */
const largeConfig: SeedConfig = {
  ...standardConfig,
  dataVolume: DataVolume.LARGE,
  users: {
    count: 50,
    includeRoles: true,
    includePermissions: true,
    adminCount: 5,
  },
  journeys: {
    health: {
      enabled: true,
      includeMetrics: true,
      includeDevices: true,
      includeGoals: true,
      metricsPerUser: 20,
      devicesPerUser: 3,
      goalsPerUser: 5,
    },
    care: {
      enabled: true,
      includeAppointments: true,
      includeMedications: true,
      includeProviders: true,
      includeTreatments: true,
      appointmentsPerUser: 10,
      medicationsPerUser: 5,
      providersCount: 20,
      treatmentsPerUser: 3,
    },
    plan: {
      enabled: true,
      includePlans: true,
      includeClaims: true,
      includeBenefits: true,
      includeDocuments: true,
      plansCount: 5,
      claimsPerUser: 10,
      benefitsPerPlan: 10,
      documentsPerUser: 5,
    },
    gamification: {
      enabled: true,
      includeAchievements: true,
      includeRewards: true,
      includeQuests: true,
      includeLeaderboards: true,
      achievementsPerUser: 15,
      rewardsCount: 10,
      questsCount: 10,
      leaderboardsCount: 3,
    },
  },
};

/**
 * Default massive configuration for stress testing
 */
const massiveConfig: SeedConfig = {
  ...largeConfig,
  dataVolume: DataVolume.MASSIVE,
  users: {
    count: 200,
    includeRoles: true,
    includePermissions: true,
    adminCount: 10,
  },
  journeys: {
    health: {
      enabled: true,
      includeMetrics: true,
      includeDevices: true,
      includeGoals: true,
      metricsPerUser: 100,
      devicesPerUser: 5,
      goalsPerUser: 10,
    },
    care: {
      enabled: true,
      includeAppointments: true,
      includeMedications: true,
      includeProviders: true,
      includeTreatments: true,
      appointmentsPerUser: 30,
      medicationsPerUser: 10,
      providersCount: 50,
      treatmentsPerUser: 5,
    },
    plan: {
      enabled: true,
      includePlans: true,
      includeClaims: true,
      includeBenefits: true,
      includeDocuments: true,
      plansCount: 10,
      claimsPerUser: 30,
      benefitsPerPlan: 20,
      documentsPerUser: 10,
    },
    gamification: {
      enabled: true,
      includeAchievements: true,
      includeRewards: true,
      includeQuests: true,
      includeLeaderboards: true,
      achievementsPerUser: 30,
      rewardsCount: 20,
      questsCount: 20,
      leaderboardsCount: 5,
    },
  },
  timeoutMs: 120000, // Longer timeout for massive data sets
};

/**
 * Environment-specific default configurations
 */
const environmentDefaults: Record<Environment, SeedConfig> = {
  [Environment.DEVELOPMENT]: standardConfig,
  [Environment.TEST]: minimalConfig,
  [Environment.STAGING]: largeConfig,
  [Environment.PRODUCTION]: minimalConfig, // Minimal for production to avoid accidental data creation
};

/**
 * Volume-specific default configurations
 */
const volumeDefaults: Record<DataVolume, SeedConfig> = {
  [DataVolume.MINIMAL]: minimalConfig,
  [DataVolume.STANDARD]: standardConfig,
  [DataVolume.LARGE]: largeConfig,
  [DataVolume.MASSIVE]: massiveConfig,
};

/**
 * Zod schema for validating user configuration
 */
const userConfigSchema = z.object({
  count: z.number().int().positive(),
  includeRoles: z.boolean(),
  includePermissions: z.boolean(),
  adminCount: z.number().int().nonnegative().optional(),
});

/**
 * Zod schema for validating health journey configuration
 */
const healthJourneySchema = z.object({
  enabled: z.boolean(),
  dataVolume: z.nativeEnum(DataVolume).optional(),
  scenarioName: z.string().optional(),
  includeMetrics: z.boolean(),
  includeDevices: z.boolean(),
  includeGoals: z.boolean(),
  metricsPerUser: z.number().int().nonnegative().optional(),
  devicesPerUser: z.number().int().nonnegative().optional(),
  goalsPerUser: z.number().int().nonnegative().optional(),
});

/**
 * Zod schema for validating care journey configuration
 */
const careJourneySchema = z.object({
  enabled: z.boolean(),
  dataVolume: z.nativeEnum(DataVolume).optional(),
  scenarioName: z.string().optional(),
  includeAppointments: z.boolean(),
  includeMedications: z.boolean(),
  includeProviders: z.boolean(),
  includeTreatments: z.boolean(),
  appointmentsPerUser: z.number().int().nonnegative().optional(),
  medicationsPerUser: z.number().int().nonnegative().optional(),
  providersCount: z.number().int().nonnegative().optional(),
  treatmentsPerUser: z.number().int().nonnegative().optional(),
});

/**
 * Zod schema for validating plan journey configuration
 */
const planJourneySchema = z.object({
  enabled: z.boolean(),
  dataVolume: z.nativeEnum(DataVolume).optional(),
  scenarioName: z.string().optional(),
  includePlans: z.boolean(),
  includeClaims: z.boolean(),
  includeBenefits: z.boolean(),
  includeDocuments: z.boolean(),
  plansCount: z.number().int().nonnegative().optional(),
  claimsPerUser: z.number().int().nonnegative().optional(),
  benefitsPerPlan: z.number().int().nonnegative().optional(),
  documentsPerUser: z.number().int().nonnegative().optional(),
});

/**
 * Zod schema for validating gamification journey configuration
 */
const gamificationJourneySchema = z.object({
  enabled: z.boolean(),
  dataVolume: z.nativeEnum(DataVolume).optional(),
  scenarioName: z.string().optional(),
  includeAchievements: z.boolean(),
  includeRewards: z.boolean(),
  includeQuests: z.boolean(),
  includeLeaderboards: z.boolean(),
  achievementsPerUser: z.number().int().nonnegative().optional(),
  rewardsCount: z.number().int().nonnegative().optional(),
  questsCount: z.number().int().nonnegative().optional(),
  leaderboardsCount: z.number().int().nonnegative().optional(),
});

/**
 * Zod schema for validating the complete seed configuration
 */
const seedConfigSchema = z.object({
  environment: z.nativeEnum(Environment),
  dataVolume: z.nativeEnum(DataVolume),
  clearDatabase: z.boolean(),
  users: userConfigSchema,
  journeys: z.object({
    health: healthJourneySchema,
    care: careJourneySchema,
    plan: planJourneySchema,
    gamification: gamificationJourneySchema,
  }),
  randomSeed: z.number().int().optional(),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).optional(),
  timeoutMs: z.number().int().positive().optional(),
});

/**
 * Loads environment variables from .env file
 */
function loadEnvVariables(): void {
  const envPath = process.env.NODE_ENV === 'test' 
    ? '.env.test'
    : process.env.NODE_ENV === 'production'
      ? '.env.production'
      : '.env';

  dotenv.config({ path: path.resolve(process.cwd(), envPath) });
}

/**
 * Gets the current environment from environment variables
 */
function getEnvironment(): Environment {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'development':
      return Environment.DEVELOPMENT;
    case 'test':
      return Environment.TEST;
    case 'staging':
      return Environment.STAGING;
    case 'production':
      return Environment.PRODUCTION;
    default:
      return Environment.DEVELOPMENT;
  }
}

/**
 * Gets the data volume from environment variables
 */
function getDataVolume(): DataVolume {
  const volume = process.env.TEST_DATA_VOLUME || 'standard';
  
  switch (volume.toLowerCase()) {
    case 'minimal':
      return DataVolume.MINIMAL;
    case 'standard':
      return DataVolume.STANDARD;
    case 'large':
      return DataVolume.LARGE;
    case 'massive':
      return DataVolume.MASSIVE;
    default:
      return DataVolume.STANDARD;
  }
}

/**
 * Gets journey-specific configuration from environment variables
 */
function getJourneyConfig(journeyType: JourneyType): Record<string, any> {
  const prefix = `TEST_${journeyType.toUpperCase()}_`;
  const config: Record<string, any> = {};
  
  // Scan all environment variables for journey-specific settings
  Object.keys(process.env).forEach(key => {
    if (key.startsWith(prefix)) {
      const configKey = key.replace(prefix, '').toLowerCase();
      const value = process.env[key];
      
      // Convert value to appropriate type
      if (value === 'true' || value === 'false') {
        config[configKey] = value === 'true';
      } else if (!isNaN(Number(value))) {
        config[configKey] = Number(value);
      } else {
        config[configKey] = value;
      }
    }
  });
  
  return config;
}

/**
 * Merges configuration objects with proper type handling
 */
function mergeConfigs(base: SeedConfig, override: Partial<SeedConfig>): SeedConfig {
  // Deep merge the configurations
  const merged = {
    ...base,
    ...override,
    users: {
      ...base.users,
      ...(override.users || {}),
    },
    journeys: {
      health: {
        ...base.journeys.health,
        ...(override.journeys?.health || {}),
      },
      care: {
        ...base.journeys.care,
        ...(override.journeys?.care || {}),
      },
      plan: {
        ...base.journeys.plan,
        ...(override.journeys?.plan || {}),
      },
      gamification: {
        ...base.journeys.gamification,
        ...(override.journeys?.gamification || {}),
      },
    },
  };
  
  return merged;
}

/**
 * Loads configuration from environment variables and merges with defaults
 */
function loadConfigFromEnv(): Partial<SeedConfig> {
  loadEnvVariables();
  
  const environment = getEnvironment();
  const dataVolume = getDataVolume();
  
  const envConfig: Partial<SeedConfig> = {
    environment,
    dataVolume,
    clearDatabase: process.env.TEST_CLEAR_DATABASE !== 'false',
    users: {
      count: parseInt(process.env.TEST_USER_COUNT || '0', 10) || undefined,
      includeRoles: process.env.TEST_INCLUDE_ROLES !== 'false',
      includePermissions: process.env.TEST_INCLUDE_PERMISSIONS !== 'false',
      adminCount: parseInt(process.env.TEST_ADMIN_COUNT || '0', 10) || undefined,
    },
    journeys: {
      health: {
        ...getJourneyConfig(JourneyType.HEALTH),
        enabled: process.env.TEST_HEALTH_ENABLED !== 'false',
      },
      care: {
        ...getJourneyConfig(JourneyType.CARE),
        enabled: process.env.TEST_CARE_ENABLED !== 'false',
      },
      plan: {
        ...getJourneyConfig(JourneyType.PLAN),
        enabled: process.env.TEST_PLAN_ENABLED !== 'false',
      },
      gamification: {
        ...getJourneyConfig(JourneyType.GAMIFICATION),
        enabled: process.env.TEST_GAMIFICATION_ENABLED !== 'false',
      },
    },
    randomSeed: parseInt(process.env.TEST_RANDOM_SEED || '0', 10) || undefined,
    logLevel: (process.env.TEST_LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || undefined,
    timeoutMs: parseInt(process.env.TEST_TIMEOUT_MS || '0', 10) || undefined,
  };
  
  // Remove undefined values to avoid overriding defaults
  Object.keys(envConfig).forEach(key => {
    if (envConfig[key] === undefined) {
      delete envConfig[key];
    }
  });
  
  if (envConfig.users) {
    Object.keys(envConfig.users).forEach(key => {
      if (envConfig.users[key] === undefined) {
        delete envConfig.users[key];
      }
    });
  }
  
  return envConfig;
}

/**
 * Gets the configuration for a specific scenario
 */
function getScenarioConfig(scenarioName: string): Partial<SeedConfig> | null {
  // Predefined test scenarios
  const scenarios: Record<string, Partial<SeedConfig>> = {
    'empty': {
      users: { count: 0 },
      journeys: {
        health: { enabled: false },
        care: { enabled: false },
        plan: { enabled: false },
        gamification: { enabled: false },
      },
    },
    'health-only': {
      journeys: {
        health: { enabled: true },
        care: { enabled: false },
        plan: { enabled: false },
        gamification: { enabled: false },
      },
    },
    'care-only': {
      journeys: {
        health: { enabled: false },
        care: { enabled: true },
        plan: { enabled: false },
        gamification: { enabled: false },
      },
    },
    'plan-only': {
      journeys: {
        health: { enabled: false },
        care: { enabled: false },
        plan: { enabled: true },
        gamification: { enabled: false },
      },
    },
    'no-gamification': {
      journeys: {
        health: { enabled: true },
        care: { enabled: true },
        plan: { enabled: true },
        gamification: { enabled: false },
      },
    },
    'admin-only': {
      users: {
        count: 1,
        adminCount: 1,
      },
    },
  };
  
  return scenarios[scenarioName] || null;
}

/**
 * Validates the configuration using Zod schema
 */
function validateConfig(config: SeedConfig): SeedConfig {
  try {
    return seedConfigSchema.parse(config);
  } catch (error) {
    console.error('Invalid seed configuration:', error);
    throw new Error(`Invalid seed configuration: ${error.message}`);
  }
}

/**
 * Gets the seed configuration based on environment, volume, and overrides
 */
export function getSeedConfig(overrides: Partial<SeedConfig> = {}): SeedConfig {
  // Load environment variables
  const envConfig = loadConfigFromEnv();
  
  // Determine base configuration from environment
  const environment = envConfig.environment || getEnvironment();
  const dataVolume = envConfig.dataVolume || getDataVolume();
  
  // Get base configuration from environment and volume defaults
  let baseConfig = environmentDefaults[environment];
  
  // Override with volume-specific defaults if specified
  if (dataVolume && dataVolume !== baseConfig.dataVolume) {
    baseConfig = mergeConfigs(baseConfig, volumeDefaults[dataVolume]);
  }
  
  // Apply scenario configuration if specified
  const scenarioName = process.env.TEST_SCENARIO || overrides.journeys?.health?.scenarioName;
  if (scenarioName) {
    const scenarioConfig = getScenarioConfig(scenarioName);
    if (scenarioConfig) {
      baseConfig = mergeConfigs(baseConfig, scenarioConfig);
    }
  }
  
  // Apply environment variable overrides
  baseConfig = mergeConfigs(baseConfig, envConfig);
  
  // Apply explicit overrides
  baseConfig = mergeConfigs(baseConfig, overrides);
  
  // Validate the final configuration
  return validateConfig(baseConfig);
}

/**
 * Default export for easier importing
 */
export default {
  getSeedConfig,
  Environment,
  DataVolume,
  JourneyType,
};