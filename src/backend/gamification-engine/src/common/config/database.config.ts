import { registerAs } from '@nestjs/config';
import { LogLevel } from '@nestjs/common';
import { DatabaseConnectionConfig, DatabaseLogLevel } from '@austa/interfaces/common/database';

/**
 * Database configuration for the Gamification Engine.
 * Provides comprehensive configuration for database connections,
 * including connection pooling, logging, SSL, and error handling.
 * 
 * This configuration is used by the PrismaService and other database-related
 * services to establish and maintain database connections with optimal performance
 * and reliability characteristics.
 * 
 * @example
 * // In your module
 * @Module({
 *   imports: [ConfigModule.forFeature(databaseConfig)],
 *   providers: [PrismaService],
 * })
 * export class DatabaseModule {}
 */
export const databaseConfig = registerAs('database', (): DatabaseConnectionConfig => ({
  // Core connection configuration
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true',
  schema: process.env.DATABASE_SCHEMA || 'public',
  directUrl: process.env.DATABASE_DIRECT_URL, // Direct connection URL for shadow database operations
  
  // Connection pooling configuration
  pool: {
    min: parseInt(process.env.DATABASE_POOL_MIN || '5', 10),
    max: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
    idle: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '10000', 10), // 10 seconds
    acquire: parseInt(process.env.DATABASE_POOL_ACQUIRE_TIMEOUT || '60000', 10), // 60 seconds
    connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000', 10), // 30 seconds
  },
  
  // Logging configuration
  logging: {
    enabled: process.env.DATABASE_LOGGING === 'true',
    level: (process.env.DATABASE_LOG_LEVEL || 'error') as DatabaseLogLevel,
    queryThreshold: parseInt(process.env.DATABASE_QUERY_THRESHOLD_MS || '1000', 10), // Log slow queries (>1s)
    queryParameters: process.env.DATABASE_LOG_QUERY_PARAMS === 'true',
    errorVerbosity: process.env.DATABASE_ERROR_VERBOSITY || 'verbose',
    logPerformance: process.env.DATABASE_LOG_PERFORMANCE === 'true',
    logQueries: process.env.DATABASE_LOG_QUERIES === 'true', // Log all queries (use with caution in production)
    logMigrations: process.env.DATABASE_LOG_MIGRATIONS !== 'false', // Log migrations by default
  },
  
  // Prisma-specific configuration
  prisma: {
    engineLogLevel: process.env.PRISMA_ENGINE_LOG_LEVEL as LogLevel || 'error',
    binaryTargets: (process.env.PRISMA_BINARY_TARGETS || 'native').split(','),
    clientVersion: process.env.PRISMA_CLIENT_VERSION,
    datasourceProvider: process.env.PRISMA_DATASOURCE_PROVIDER || 'postgresql',
  },
  
  // Retry configuration for transient errors
  retry: {
    enabled: process.env.DATABASE_RETRY_ENABLED !== 'false', // Enabled by default
    maxAttempts: parseInt(process.env.DATABASE_RETRY_MAX_ATTEMPTS || '3', 10),
    initialDelay: parseInt(process.env.DATABASE_RETRY_INITIAL_DELAY || '100', 10), // 100ms
    maxDelay: parseInt(process.env.DATABASE_RETRY_MAX_DELAY || '3000', 10), // 3 seconds
    factor: parseFloat(process.env.DATABASE_RETRY_FACTOR || '2'), // Exponential backoff factor
    jitter: process.env.DATABASE_RETRY_JITTER !== 'false', // Add jitter to prevent retry storms
  },
  
  // Transaction configuration
  transaction: {
    timeout: parseInt(process.env.DATABASE_TRANSACTION_TIMEOUT || '30000', 10), // 30 seconds
    isolationLevel: process.env.DATABASE_TRANSACTION_ISOLATION || 'ReadCommitted',
    maxNestingLevel: parseInt(process.env.DATABASE_TRANSACTION_MAX_NESTING || '3', 10),
  },
  
  // Health check configuration
  healthCheck: {
    enabled: process.env.DATABASE_HEALTH_CHECK_ENABLED !== 'false', // Enabled by default
    interval: parseInt(process.env.DATABASE_HEALTH_CHECK_INTERVAL || '30000', 10), // 30 seconds
    timeout: parseInt(process.env.DATABASE_HEALTH_CHECK_TIMEOUT || '5000', 10), // 5 seconds
    query: process.env.DATABASE_HEALTH_CHECK_QUERY || 'SELECT 1',
  },
  
  // Journey-specific configuration
  journeyContext: {
    enabled: process.env.DATABASE_JOURNEY_CONTEXT_ENABLED !== 'false', // Enabled by default
    defaultJourney: process.env.DATABASE_DEFAULT_JOURNEY || 'gamification',
    separateConnections: process.env.DATABASE_SEPARATE_JOURNEY_CONNECTIONS === 'true',
    journeys: {
      health: {
        schema: process.env.DATABASE_HEALTH_SCHEMA || 'health',
        enabled: process.env.DATABASE_HEALTH_ENABLED !== 'false',
      },
      care: {
        schema: process.env.DATABASE_CARE_SCHEMA || 'care',
        enabled: process.env.DATABASE_CARE_ENABLED !== 'false',
      },
      plan: {
        schema: process.env.DATABASE_PLAN_SCHEMA || 'plan',
        enabled: process.env.DATABASE_PLAN_ENABLED !== 'false',
      },
      gamification: {
        schema: process.env.DATABASE_GAMIFICATION_SCHEMA || 'gamification',
        enabled: true, // Always enabled for gamification engine
      },
    },
  },
  
  // Error handling configuration
  errorHandling: {
    transformErrors: process.env.DATABASE_TRANSFORM_ERRORS !== 'false', // Enabled by default
    detailedErrors: process.env.NODE_ENV !== 'production', // Detailed in non-production
    trackErrorFrequency: process.env.DATABASE_TRACK_ERROR_FREQUENCY === 'true',
    errorThreshold: parseInt(process.env.DATABASE_ERROR_THRESHOLD || '10', 10), // Circuit breaker threshold
    circuitBreakerTimeout: parseInt(process.env.DATABASE_CIRCUIT_BREAKER_TIMEOUT || '60000', 10), // 1 minute
  },
}));

/**
 * Type definition for database environment variables to ensure type safety
 * when accessing environment variables related to database configuration.
 * 
 * This interface is used for validation and documentation purposes to ensure
 * that all required environment variables are properly defined and typed.
 */
export interface DatabaseEnvVariables {
  // Core connection
  DATABASE_URL: string;
  DATABASE_DIRECT_URL?: string;
  DATABASE_SSL?: string;
  DATABASE_SCHEMA?: string;
  
  // Connection pool
  DATABASE_POOL_MIN?: string;
  DATABASE_POOL_MAX?: string;
  DATABASE_POOL_IDLE_TIMEOUT?: string;
  DATABASE_POOL_ACQUIRE_TIMEOUT?: string;
  DATABASE_CONNECTION_TIMEOUT?: string;
  
  // Logging
  DATABASE_LOGGING?: string;
  DATABASE_LOG_LEVEL?: string;
  DATABASE_QUERY_THRESHOLD_MS?: string;
  DATABASE_LOG_QUERY_PARAMS?: string;
  DATABASE_ERROR_VERBOSITY?: string;
  DATABASE_LOG_PERFORMANCE?: string;
  DATABASE_LOG_QUERIES?: string;
  DATABASE_LOG_MIGRATIONS?: string;
  
  // Prisma specific
  PRISMA_ENGINE_LOG_LEVEL?: string;
  PRISMA_BINARY_TARGETS?: string;
  PRISMA_CLIENT_VERSION?: string;
  PRISMA_DATASOURCE_PROVIDER?: string;
  
  // Retry
  DATABASE_RETRY_ENABLED?: string;
  DATABASE_RETRY_MAX_ATTEMPTS?: string;
  DATABASE_RETRY_INITIAL_DELAY?: string;
  DATABASE_RETRY_MAX_DELAY?: string;
  DATABASE_RETRY_FACTOR?: string;
  DATABASE_RETRY_JITTER?: string;
  
  // Transaction
  DATABASE_TRANSACTION_TIMEOUT?: string;
  DATABASE_TRANSACTION_ISOLATION?: string;
  DATABASE_TRANSACTION_MAX_NESTING?: string;
  
  // Health check
  DATABASE_HEALTH_CHECK_ENABLED?: string;
  DATABASE_HEALTH_CHECK_INTERVAL?: string;
  DATABASE_HEALTH_CHECK_TIMEOUT?: string;
  DATABASE_HEALTH_CHECK_QUERY?: string;
  
  // Journey context
  DATABASE_JOURNEY_CONTEXT_ENABLED?: string;
  DATABASE_DEFAULT_JOURNEY?: string;
  DATABASE_SEPARATE_JOURNEY_CONNECTIONS?: string;
  DATABASE_HEALTH_SCHEMA?: string;
  DATABASE_HEALTH_ENABLED?: string;
  DATABASE_CARE_SCHEMA?: string;
  DATABASE_CARE_ENABLED?: string;
  DATABASE_PLAN_SCHEMA?: string;
  DATABASE_PLAN_ENABLED?: string;
  DATABASE_GAMIFICATION_SCHEMA?: string;
  
  // Error handling
  DATABASE_TRANSFORM_ERRORS?: string;
  DATABASE_TRACK_ERROR_FREQUENCY?: string;
  DATABASE_ERROR_THRESHOLD?: string;
  DATABASE_CIRCUIT_BREAKER_TIMEOUT?: string;
  
  // Node environment
  NODE_ENV?: string;
}

/**
 * Default database configuration values used when environment variables are not provided.
 * This ensures consistent behavior across different environments.
 * 
 * These defaults are designed to work in a local development environment and
 * should be overridden in production using environment variables.
 */
export const defaultDatabaseConfig: DatabaseConnectionConfig = {
  url: 'postgresql://postgres:postgres@localhost:5432/gamification',
  directUrl: undefined,
  ssl: false,
  schema: 'public',
  
  pool: {
    min: 5,
    max: 20,
    idle: 10000,
    acquire: 60000,
    connectionTimeout: 30000,
  },
  
  logging: {
    enabled: false,
    level: 'error',
    queryThreshold: 1000,
    queryParameters: false,
    errorVerbosity: 'verbose',
    logPerformance: false,
    logQueries: false,
    logMigrations: true,
  },
  
  prisma: {
    engineLogLevel: 'error',
    binaryTargets: ['native'],
    clientVersion: undefined,
    datasourceProvider: 'postgresql',
  },
  
  retry: {
    enabled: true,
    maxAttempts: 3,
    initialDelay: 100,
    maxDelay: 3000,
    factor: 2,
    jitter: true,
  },
  
  transaction: {
    timeout: 30000,
    isolationLevel: 'ReadCommitted',
    maxNestingLevel: 3,
  },
  
  healthCheck: {
    enabled: true,
    interval: 30000,
    timeout: 5000,
    query: 'SELECT 1',
  },
  
  journeyContext: {
    enabled: true,
    defaultJourney: 'gamification',
    separateConnections: false,
    journeys: {
      health: {
        schema: 'health',
        enabled: true,
      },
      care: {
        schema: 'care',
        enabled: true,
      },
      plan: {
        schema: 'plan',
        enabled: true,
      },
      gamification: {
        schema: 'gamification',
        enabled: true,
      },
    },
  },
  
  errorHandling: {
    transformErrors: true,
    detailedErrors: true,
    trackErrorFrequency: false,
    errorThreshold: 10,
    circuitBreakerTimeout: 60000,
  },
};

/**
 * Utility function to validate database configuration.
 * Checks for required values and ensures that configuration is valid.
 * 
 * @param config The database configuration to validate
 * @returns The validated configuration or throws an error if invalid
 */
export function validateDatabaseConfig(config: Partial<DatabaseConnectionConfig>): DatabaseConnectionConfig {
  // Ensure required fields are present
  if (!config.url) {
    throw new Error('Database URL is required');
  }
  
  // Merge with default configuration
  const validatedConfig = {
    ...defaultDatabaseConfig,
    ...config,
    // Merge nested objects
    pool: { ...defaultDatabaseConfig.pool, ...config.pool },
    logging: { ...defaultDatabaseConfig.logging, ...config.logging },
    retry: { ...defaultDatabaseConfig.retry, ...config.retry },
    transaction: { ...defaultDatabaseConfig.transaction, ...config.transaction },
    healthCheck: { ...defaultDatabaseConfig.healthCheck, ...config.healthCheck },
    journeyContext: { 
      ...defaultDatabaseConfig.journeyContext, 
      ...config.journeyContext,
      // Merge journey configurations
      journeys: { 
        ...defaultDatabaseConfig.journeyContext.journeys,
        ...config.journeyContext?.journeys,
      },
    },
    errorHandling: { ...defaultDatabaseConfig.errorHandling, ...config.errorHandling },
    prisma: { ...defaultDatabaseConfig.prisma, ...config.prisma },
  };
  
  return validatedConfig as DatabaseConnectionConfig;
}

/**
 * Creates a database configuration for a specific environment.
 * This is useful for creating configurations for different environments
 * (development, testing, staging, production).
 * 
 * @param env The environment to create the configuration for
 * @param overrides Optional configuration overrides
 * @returns A database configuration for the specified environment
 */
export function createEnvironmentDatabaseConfig(
  env: 'development' | 'test' | 'staging' | 'production',
  overrides?: Partial<DatabaseConnectionConfig>
): DatabaseConnectionConfig {
  // Base configuration for the environment
  const envConfig: Partial<DatabaseConnectionConfig> = {
    // Common settings for all environments
    ...defaultDatabaseConfig,
    
    // Environment-specific settings
    ...(env === 'development' && {
      logging: {
        ...defaultDatabaseConfig.logging,
        enabled: true,
        level: 'debug',
        queryParameters: true,
        logPerformance: true,
      },
      errorHandling: {
        ...defaultDatabaseConfig.errorHandling,
        detailedErrors: true,
      },
    }),
    
    ...(env === 'test' && {
      pool: {
        ...defaultDatabaseConfig.pool,
        min: 1,
        max: 5,
      },
      logging: {
        ...defaultDatabaseConfig.logging,
        enabled: false,
      },
      retry: {
        ...defaultDatabaseConfig.retry,
        enabled: false,
      },
      healthCheck: {
        ...defaultDatabaseConfig.healthCheck,
        enabled: false,
      },
    }),
    
    ...(env === 'staging' && {
      logging: {
        ...defaultDatabaseConfig.logging,
        enabled: true,
        level: 'warn',
        queryThreshold: 500, // More aggressive slow query logging
      },
      errorHandling: {
        ...defaultDatabaseConfig.errorHandling,
        detailedErrors: true,
        trackErrorFrequency: true,
      },
    }),
    
    ...(env === 'production' && {
      pool: {
        ...defaultDatabaseConfig.pool,
        min: 10,
        max: 50,
      },
      logging: {
        ...defaultDatabaseConfig.logging,
        enabled: true,
        level: 'error',
        queryParameters: false, // Don't log sensitive data
        logQueries: false,
      },
      retry: {
        ...defaultDatabaseConfig.retry,
        maxAttempts: 5, // More retries in production
      },
      errorHandling: {
        ...defaultDatabaseConfig.errorHandling,
        detailedErrors: false,
        trackErrorFrequency: true,
      },
    }),
  };
  
  // Apply any overrides
  return validateDatabaseConfig({
    ...envConfig,
    ...overrides,
  });
}