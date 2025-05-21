/**
 * @file schema-config.ts
 * @description Environment-specific configuration for Prisma schema that provides dynamic connection settings,
 * pool sizes, and log levels based on deployment environment. It centralizes database configuration to ensure
 * consistent behavior across development, testing, staging, and production environments.
 */

import { Prisma } from '@prisma/client';

/**
 * Supported environment types for database configuration
 */
export type Environment = 'development' | 'test' | 'staging' | 'production';

/**
 * Journey types for journey-specific database contexts
 */
export type JourneyType = 'health' | 'care' | 'plan' | 'auth' | 'gamification' | 'notification' | 'shared';

/**
 * Database connection configuration interface
 */
export interface DatabaseConnectionConfig {
  /**
   * URL for the database connection
   * @example postgresql://user:password@localhost:5432/db_name
   */
  url: string;
  
  /**
   * Maximum number of connections in the pool
   * @default 10 in production, 5 in staging, 2 in development/test
   */
  poolSize: number;
  
  /**
   * Minimum number of connections to keep idle in the pool
   * @default 2 in production, 1 in other environments
   */
  minConnections: number;
  
  /**
   * Connection timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  connectionTimeout: number;
  
  /**
   * Maximum query execution time in milliseconds
   * @default 60000 (60 seconds)
   */
  queryTimeout: number;
  
  /**
   * Log levels for Prisma client
   */
  logLevels: Prisma.LogLevel[];
  
  /**
   * Whether to enable query events
   * @default true in development, false in other environments
   */
  enableQueryEvents: boolean;
  
  /**
   * Whether to enable transaction events
   * @default true in development, false in other environments
   */
  enableTransactionEvents: boolean;
  
  /**
   * Maximum number of retries for failed queries
   * @default 3
   */
  maxRetries: number;
  
  /**
   * Retry delay in milliseconds
   * @default 1000 (1 second)
   */
  retryDelay: number;
  
  /**
   * Whether to use exponential backoff for retries
   * @default true
   */
  useExponentialBackoff: boolean;
  
  /**
   * Health check interval in milliseconds
   * @default 60000 (60 seconds)
   */
  healthCheckInterval: number;
}

/**
 * Journey-specific database configuration interface
 */
export interface JourneyDatabaseConfig extends DatabaseConnectionConfig {
  /**
   * Journey type
   */
  journey: JourneyType;
  
  /**
   * Schema name for the journey
   * @default journey name
   */
  schema?: string;
  
  /**
   * Whether to use a dedicated connection pool for this journey
   * @default true in production, false in other environments
   */
  useDedicatedPool: boolean;
  
  /**
   * Maximum number of connections for this journey's pool
   * @default same as poolSize in DatabaseConnectionConfig
   */
  journeyPoolSize?: number;
}

/**
 * Default database configuration for different environments
 */
export const defaultDatabaseConfig: Record<Environment, DatabaseConnectionConfig> = {
  development: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/austa_dev',
    poolSize: 2,
    minConnections: 1,
    connectionTimeout: 30000,
    queryTimeout: 60000,
    logLevels: ['query', 'info', 'warn', 'error'],
    enableQueryEvents: true,
    enableTransactionEvents: true,
    maxRetries: 3,
    retryDelay: 1000,
    useExponentialBackoff: true,
    healthCheckInterval: 60000,
  },
  test: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/austa_test',
    poolSize: 2,
    minConnections: 1,
    connectionTimeout: 10000,
    queryTimeout: 30000,
    logLevels: ['error'],
    enableQueryEvents: false,
    enableTransactionEvents: false,
    maxRetries: 1,
    retryDelay: 500,
    useExponentialBackoff: false,
    healthCheckInterval: 0, // Disable health checks in test environment
  },
  staging: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/austa_staging',
    poolSize: 5,
    minConnections: 1,
    connectionTimeout: 30000,
    queryTimeout: 60000,
    logLevels: ['warn', 'error'],
    enableQueryEvents: false,
    enableTransactionEvents: false,
    maxRetries: 3,
    retryDelay: 1000,
    useExponentialBackoff: true,
    healthCheckInterval: 60000,
  },
  production: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/austa_prod',
    poolSize: 10,
    minConnections: 2,
    connectionTimeout: 30000,
    queryTimeout: 60000,
    logLevels: ['error'],
    enableQueryEvents: false,
    enableTransactionEvents: false,
    maxRetries: 3,
    retryDelay: 1000,
    useExponentialBackoff: true,
    healthCheckInterval: 60000,
  },
};

/**
 * Journey-specific database configurations
 */
export const journeyDatabaseConfigs: Record<JourneyType, Partial<JourneyDatabaseConfig>> = {
  health: {
    journey: 'health',
    schema: 'health',
    useDedicatedPool: process.env.NODE_ENV === 'production',
    journeyPoolSize: process.env.NODE_ENV === 'production' ? 5 : undefined,
  },
  care: {
    journey: 'care',
    schema: 'care',
    useDedicatedPool: process.env.NODE_ENV === 'production',
    journeyPoolSize: process.env.NODE_ENV === 'production' ? 5 : undefined,
  },
  plan: {
    journey: 'plan',
    schema: 'plan',
    useDedicatedPool: process.env.NODE_ENV === 'production',
    journeyPoolSize: process.env.NODE_ENV === 'production' ? 5 : undefined,
  },
  auth: {
    journey: 'auth',
    schema: 'auth',
    useDedicatedPool: process.env.NODE_ENV === 'production',
    journeyPoolSize: process.env.NODE_ENV === 'production' ? 3 : undefined,
  },
  gamification: {
    journey: 'gamification',
    schema: 'gamification',
    useDedicatedPool: process.env.NODE_ENV === 'production',
    journeyPoolSize: process.env.NODE_ENV === 'production' ? 4 : undefined,
  },
  notification: {
    journey: 'notification',
    schema: 'notification',
    useDedicatedPool: process.env.NODE_ENV === 'production',
    journeyPoolSize: process.env.NODE_ENV === 'production' ? 3 : undefined,
  },
  shared: {
    journey: 'shared',
    schema: 'public',
    useDedicatedPool: false,
  },
};

/**
 * Get the current environment based on NODE_ENV
 * @returns The current environment
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return 'production';
    case 'staging':
      return 'staging';
    case 'test':
      return 'test';
    default:
      return 'development';
  }
}

/**
 * Get database configuration for the current environment
 * @returns Database configuration for the current environment
 */
export function getDatabaseConfig(): DatabaseConnectionConfig {
  const env = getCurrentEnvironment();
  return defaultDatabaseConfig[env];
}

/**
 * Get journey-specific database configuration
 * @param journey Journey type
 * @returns Journey-specific database configuration
 */
export function getJourneyDatabaseConfig(journey: JourneyType): JourneyDatabaseConfig {
  const baseConfig = getDatabaseConfig();
  const journeyConfig = journeyDatabaseConfigs[journey];
  
  return {
    ...baseConfig,
    ...journeyConfig,
    journeyPoolSize: journeyConfig.journeyPoolSize || baseConfig.poolSize,
  } as JourneyDatabaseConfig;
}

/**
 * Get Prisma client options for the specified journey
 * @param journey Journey type
 * @returns Prisma client options
 */
export function getPrismaClientOptions(journey: JourneyType): Prisma.PrismaClientOptions {
  const config = getJourneyDatabaseConfig(journey);
  
  return {
    datasources: {
      db: {
        url: config.url,
      },
    },
    log: config.logLevels,
  };
}

/**
 * Get connection pool configuration for the specified journey
 * @param journey Journey type
 * @returns Connection pool configuration
 */
export function getConnectionPoolConfig(journey: JourneyType): {
  max: number;
  min: number;
  idleTimeoutMillis: number;
} {
  const config = getJourneyDatabaseConfig(journey);
  
  return {
    max: config.useDedicatedPool ? config.journeyPoolSize! : config.poolSize,
    min: config.minConnections,
    idleTimeoutMillis: 30000, // 30 seconds
  };
}

/**
 * Get retry configuration for the specified journey
 * @param journey Journey type
 * @returns Retry configuration
 */
export function getRetryConfig(journey: JourneyType): {
  maxRetries: number;
  retryDelay: number;
  useExponentialBackoff: boolean;
} {
  const config = getJourneyDatabaseConfig(journey);
  
  return {
    maxRetries: config.maxRetries,
    retryDelay: config.retryDelay,
    useExponentialBackoff: config.useExponentialBackoff,
  };
}

/**
 * Get health check configuration for the specified journey
 * @param journey Journey type
 * @returns Health check configuration
 */
export function getHealthCheckConfig(journey: JourneyType): {
  interval: number;
  enabled: boolean;
} {
  const config = getJourneyDatabaseConfig(journey);
  
  return {
    interval: config.healthCheckInterval,
    enabled: config.healthCheckInterval > 0,
  };
}