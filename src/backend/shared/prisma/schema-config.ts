/**
 * @file schema-config.ts
 * @description Environment-specific configuration for Prisma schema that provides dynamic connection settings,
 * pool sizes, and log levels based on deployment environment. This file centralizes database configuration
 * to ensure consistent behavior across development, testing, staging, and production environments.
 */

import { Prisma } from '@prisma/client';

/**
 * Supported deployment environments
 */
export enum Environment {
  DEVELOPMENT = 'development',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Database log levels configuration
 */
export interface LogLevelConfig {
  query: boolean;
  info: boolean;
  warn: boolean;
  error: boolean;
}

/**
 * Connection pool configuration
 */
export interface ConnectionPoolConfig {
  min: number;
  max: number;
  idle: number; // in milliseconds
  timeout: number; // in milliseconds
}

/**
 * Journey-specific database context configuration
 */
export interface JourneyDatabaseConfig {
  health: {
    connectionLimit: number;
    queryTimeout: number; // in milliseconds
  };
  care: {
    connectionLimit: number;
    queryTimeout: number; // in milliseconds
  };
  plan: {
    connectionLimit: number;
    queryTimeout: number; // in milliseconds
  };
  gamification: {
    connectionLimit: number;
    queryTimeout: number; // in milliseconds
  };
}

/**
 * Retry policy configuration
 */
export interface RetryConfig {
  attempts: number;
  backoff: {
    type: 'exponential' | 'fixed';
    initialDelay: number; // in milliseconds
    maxDelay: number; // in milliseconds
    jitter: boolean;
  };
  errorCodes: string[]; // Prisma error codes that should trigger retry
}

/**
 * Complete database configuration
 */
export interface DatabaseConfig {
  url: string;
  logLevels: LogLevelConfig;
  connectionPool: ConnectionPoolConfig;
  journeys: JourneyDatabaseConfig;
  retry: RetryConfig;
  enableSsl: boolean;
  enableDebug: boolean;
}

/**
 * Get the current environment
 * @returns The current environment based on NODE_ENV
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV?.toLowerCase() || 'development';
  
  switch (env) {
    case 'production':
      return Environment.PRODUCTION;
    case 'staging':
      return Environment.STAGING;
    case 'test':
      return Environment.TEST;
    default:
      return Environment.DEVELOPMENT;
  }
}

/**
 * Get log level configuration based on environment
 * @param env The current environment
 * @returns Log level configuration for the specified environment
 */
export function getLogLevelConfig(env: Environment): LogLevelConfig {
  switch (env) {
    case Environment.PRODUCTION:
      return {
        query: false,
        info: false,
        warn: true,
        error: true,
      };
    case Environment.STAGING:
      return {
        query: false,
        info: true,
        warn: true,
        error: true,
      };
    case Environment.TEST:
      return {
        query: false,
        info: false,
        warn: false,
        error: true,
      };
    case Environment.DEVELOPMENT:
    default:
      return {
        query: true,
        info: true,
        warn: true,
        error: true,
      };
  }
}

/**
 * Get connection pool configuration based on environment
 * @param env The current environment
 * @returns Connection pool configuration for the specified environment
 */
export function getConnectionPoolConfig(env: Environment): ConnectionPoolConfig {
  switch (env) {
    case Environment.PRODUCTION:
      return {
        min: 5,
        max: 25,
        idle: 60000, // 1 minute
        timeout: 30000, // 30 seconds
      };
    case Environment.STAGING:
      return {
        min: 3,
        max: 15,
        idle: 60000, // 1 minute
        timeout: 30000, // 30 seconds
      };
    case Environment.TEST:
      return {
        min: 1,
        max: 5,
        idle: 10000, // 10 seconds
        timeout: 5000, // 5 seconds
      };
    case Environment.DEVELOPMENT:
    default:
      return {
        min: 1,
        max: 10,
        idle: 30000, // 30 seconds
        timeout: 15000, // 15 seconds
      };
  }
}

/**
 * Get journey-specific database configuration based on environment
 * @param env The current environment
 * @returns Journey-specific database configuration for the specified environment
 */
export function getJourneyDatabaseConfig(env: Environment): JourneyDatabaseConfig {
  switch (env) {
    case Environment.PRODUCTION:
      return {
        health: {
          connectionLimit: 10,
          queryTimeout: 10000, // 10 seconds
        },
        care: {
          connectionLimit: 10,
          queryTimeout: 15000, // 15 seconds
        },
        plan: {
          connectionLimit: 8,
          queryTimeout: 20000, // 20 seconds
        },
        gamification: {
          connectionLimit: 12,
          queryTimeout: 5000, // 5 seconds
        },
      };
    case Environment.STAGING:
      return {
        health: {
          connectionLimit: 5,
          queryTimeout: 10000, // 10 seconds
        },
        care: {
          connectionLimit: 5,
          queryTimeout: 15000, // 15 seconds
        },
        plan: {
          connectionLimit: 5,
          queryTimeout: 20000, // 20 seconds
        },
        gamification: {
          connectionLimit: 8,
          queryTimeout: 5000, // 5 seconds
        },
      };
    case Environment.TEST:
      return {
        health: {
          connectionLimit: 2,
          queryTimeout: 5000, // 5 seconds
        },
        care: {
          connectionLimit: 2,
          queryTimeout: 5000, // 5 seconds
        },
        plan: {
          connectionLimit: 2,
          queryTimeout: 5000, // 5 seconds
        },
        gamification: {
          connectionLimit: 2,
          queryTimeout: 5000, // 5 seconds
        },
      };
    case Environment.DEVELOPMENT:
    default:
      return {
        health: {
          connectionLimit: 3,
          queryTimeout: 10000, // 10 seconds
        },
        care: {
          connectionLimit: 3,
          queryTimeout: 15000, // 15 seconds
        },
        plan: {
          connectionLimit: 3,
          queryTimeout: 20000, // 20 seconds
        },
        gamification: {
          connectionLimit: 5,
          queryTimeout: 5000, // 5 seconds
        },
      };
  }
}

/**
 * Get retry configuration based on environment
 * @param env The current environment
 * @returns Retry configuration for the specified environment
 */
export function getRetryConfig(env: Environment): RetryConfig {
  switch (env) {
    case Environment.PRODUCTION:
      return {
        attempts: 5,
        backoff: {
          type: 'exponential',
          initialDelay: 100, // 100ms
          maxDelay: 10000, // 10 seconds
          jitter: true,
        },
        errorCodes: [
          'P1001', // Can't reach database server
          'P1002', // Database connection timed out
          'P1008', // Operations timed out
          'P1017', // Server closed the connection
          'P2024', // Timed out fetching a connection from the connection pool
          'P2028', // Transaction API error
        ],
      };
    case Environment.STAGING:
      return {
        attempts: 4,
        backoff: {
          type: 'exponential',
          initialDelay: 100, // 100ms
          maxDelay: 5000, // 5 seconds
          jitter: true,
        },
        errorCodes: [
          'P1001', // Can't reach database server
          'P1002', // Database connection timed out
          'P1008', // Operations timed out
          'P1017', // Server closed the connection
          'P2024', // Timed out fetching a connection from the connection pool
          'P2028', // Transaction API error
        ],
      };
    case Environment.TEST:
      return {
        attempts: 2,
        backoff: {
          type: 'fixed',
          initialDelay: 50, // 50ms
          maxDelay: 100, // 100ms
          jitter: false,
        },
        errorCodes: [
          'P1001', // Can't reach database server
          'P1002', // Database connection timed out
        ],
      };
    case Environment.DEVELOPMENT:
    default:
      return {
        attempts: 3,
        backoff: {
          type: 'exponential',
          initialDelay: 100, // 100ms
          maxDelay: 2000, // 2 seconds
          jitter: true,
        },
        errorCodes: [
          'P1001', // Can't reach database server
          'P1002', // Database connection timed out
          'P1008', // Operations timed out
          'P1017', // Server closed the connection
          'P2024', // Timed out fetching a connection from the connection pool
        ],
      };
  }
}

/**
 * Get the complete database configuration for the current environment
 * @returns Database configuration for the current environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const env = getCurrentEnvironment();
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/austa';
  
  return {
    url: databaseUrl,
    logLevels: getLogLevelConfig(env),
    connectionPool: getConnectionPoolConfig(env),
    journeys: getJourneyDatabaseConfig(env),
    retry: getRetryConfig(env),
    enableSsl: env === Environment.PRODUCTION || env === Environment.STAGING,
    enableDebug: env === Environment.DEVELOPMENT,
  };
}

/**
 * Get Prisma log level configuration based on the current environment
 * @returns Prisma log level configuration for the current environment
 */
export function getPrismaLogLevels(): Prisma.LogLevel[] {
  const env = getCurrentEnvironment();
  const logLevels = getLogLevelConfig(env);
  const prismaLogLevels: Prisma.LogLevel[] = [];
  
  if (logLevels.query) prismaLogLevels.push('query');
  if (logLevels.info) prismaLogLevels.push('info');
  if (logLevels.warn) prismaLogLevels.push('warn');
  if (logLevels.error) prismaLogLevels.push('error');
  
  return prismaLogLevels;
}

/**
 * Get Prisma datasource URL with SSL configuration if needed
 * @returns Properly configured database URL for Prisma
 */
export function getPrismaDatasourceUrl(): string {
  const config = getDatabaseConfig();
  let url = config.url;
  
  // Add SSL configuration if needed
  if (config.enableSsl && !url.includes('sslmode=')) {
    url += url.includes('?') ? '&sslmode=require' : '?sslmode=require';
  }
  
  return url;
}

/**
 * Get journey-specific connection configuration
 * @param journeyName The name of the journey (health, care, plan, gamification)
 * @returns Connection configuration for the specified journey
 */
export function getJourneyConnectionConfig(journeyName: keyof JourneyDatabaseConfig): {
  connectionLimit: number;
  queryTimeout: number;
} {
  const config = getDatabaseConfig();
  return config.journeys[journeyName];
}

/**
 * Default export for the complete database configuration
 */
export default getDatabaseConfig();