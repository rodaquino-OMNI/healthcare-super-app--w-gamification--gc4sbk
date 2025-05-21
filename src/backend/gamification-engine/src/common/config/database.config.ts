import { registerAs } from '@nestjs/config';
import { LogLevel } from '@prisma/client/runtime/library';
import { IDatabaseConfig } from '@austa/interfaces/common/dto/database.interface';

/**
 * Database configuration for the Gamification Engine.
 * Centralizes all database-related configuration options.
 * 
 * @remarks
 * This configuration is used by PrismaService and other database-related services
 * to establish and maintain database connections with proper pooling, logging, and error handling.
 * 
 * Connection pooling is managed by Prisma's query engine. The default pool size is calculated as:
 * num_physical_cpus * 2 + 1, where num_physical_cpus is the number of physical CPUs on the machine.
 * This can be explicitly set using the connection_limit parameter in the database URL.
 */
export const databaseConfig = registerAs('database', (): IDatabaseConfig => {
  // Calculate default connection pool size based on CPU cores if not specified
  const cpuCount = typeof process !== 'undefined' && process.env.NODE_ENV !== 'test' ? 
    require('os').cpus().length : 2;
  const defaultPoolSize = cpuCount * 2 + 1;
  
  // Parse connection string to add connection_limit if not present
  let connectionUrl = process.env.DATABASE_URL || '';
  const hasConnectionLimit = connectionUrl.includes('connection_limit=');
  
  if (!hasConnectionLimit && connectionUrl && !connectionUrl.includes('?')) {
    connectionUrl = `${connectionUrl}?connection_limit=${parseInt(process.env.DATABASE_POOL_MAX, 10) || defaultPoolSize}`;
  } else if (!hasConnectionLimit && connectionUrl && connectionUrl.includes('?')) {
    connectionUrl = `${connectionUrl}&connection_limit=${parseInt(process.env.DATABASE_POOL_MAX, 10) || defaultPoolSize}`;
  }
  
  return {
    // Main connection configuration
    url: connectionUrl,
    ssl: process.env.DATABASE_SSL === 'true',
    
    // Connection pool configuration
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN, 10) || 2,
      max: parseInt(process.env.DATABASE_POOL_MAX, 10) || defaultPoolSize,
      idle: parseInt(process.env.DATABASE_POOL_IDLE, 10) || 10000, // 10 seconds
      acquire: parseInt(process.env.DATABASE_POOL_ACQUIRE, 10) || 60000, // 60 seconds
      connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT, 10) || 30000, // 30 seconds
      queueTimeout: parseInt(process.env.DATABASE_QUEUE_TIMEOUT, 10) || 5000, // 5 seconds - time before P2024 error
    },
    
    // Logging configuration
    logging: {
      enabled: process.env.DATABASE_LOGGING === 'true',
      level: (process.env.DATABASE_LOG_LEVEL as LogLevel) || 
        (process.env.NODE_ENV === 'production' ? 'error' : 'info'),
      emitDecoratorMetadata: process.env.DATABASE_LOG_EMIT_METADATA === 'true',
      queryThreshold: parseInt(process.env.DATABASE_LOG_QUERY_THRESHOLD, 10) || 500, // ms
      logConnectionEvents: process.env.DATABASE_LOG_CONNECTION_EVENTS !== 'false', // true by default
      logPoolStatistics: process.env.DATABASE_LOG_POOL_STATISTICS === 'true',
    },
    
    // Error handling configuration
    errorHandling: {
      retryAttempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS, 10) || 3,
      retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY, 10) || 1000, // 1 second
      useExponentialBackoff: process.env.DATABASE_USE_EXPONENTIAL_BACKOFF !== 'false', // true by default
      maxBackoffDelay: parseInt(process.env.DATABASE_MAX_BACKOFF_DELAY, 10) || 30000, // 30 seconds
      classifyErrors: process.env.DATABASE_CLASSIFY_ERRORS !== 'false', // true by default
      handleTransientErrors: process.env.DATABASE_HANDLE_TRANSIENT_ERRORS !== 'false', // true by default
    },
    
    // Transaction configuration
    transactions: {
      isolationLevel: process.env.DATABASE_TRANSACTION_ISOLATION_LEVEL || 'ReadCommitted',
      timeout: parseInt(process.env.DATABASE_TRANSACTION_TIMEOUT, 10) || 30000, // 30 seconds
      useNativeTransactions: process.env.DATABASE_USE_NATIVE_TRANSACTIONS !== 'false', // true by default
    },
    
    // Journey-specific configuration
    journeyContexts: {
      enabled: process.env.DATABASE_JOURNEY_CONTEXTS_ENABLED !== 'false', // true by default
      separateConnections: process.env.DATABASE_JOURNEY_SEPARATE_CONNECTIONS === 'true',
      contextSpecificPools: process.env.DATABASE_CONTEXT_SPECIFIC_POOLS === 'true',
    },
    
    // Health check configuration
    healthCheck: {
      enabled: process.env.DATABASE_HEALTH_CHECK_ENABLED !== 'false', // true by default
      interval: parseInt(process.env.DATABASE_HEALTH_CHECK_INTERVAL, 10) || 60000, // 1 minute
      timeout: parseInt(process.env.DATABASE_HEALTH_CHECK_TIMEOUT, 10) || 5000, // 5 seconds
      pingQuery: process.env.DATABASE_HEALTH_CHECK_QUERY || 'SELECT 1',
      failureThreshold: parseInt(process.env.DATABASE_HEALTH_FAILURE_THRESHOLD, 10) || 3,
    },
    
    // Metrics and monitoring
    metrics: {
      enabled: process.env.DATABASE_METRICS_ENABLED !== 'false', // true by default
      collectInterval: parseInt(process.env.DATABASE_METRICS_INTERVAL, 10) || 10000, // 10 seconds
      includeQueryStats: process.env.DATABASE_METRICS_QUERY_STATS !== 'false', // true by default
      includePoolStats: process.env.DATABASE_METRICS_POOL_STATS !== 'false', // true by default
      logMetricsInterval: parseInt(process.env.DATABASE_LOG_METRICS_INTERVAL, 10) || 60000, // 1 minute
    },
    
    // Prisma-specific configuration
    prisma: {
      logQueries: process.env.PRISMA_LOG_QUERIES === 'true',
      logQueryParameters: process.env.PRISMA_LOG_QUERY_PARAMS === 'true',
      softDeleteEnabled: process.env.PRISMA_SOFT_DELETE_ENABLED !== 'false', // true by default
      middlewareEnabled: process.env.PRISMA_MIDDLEWARE_ENABLED !== 'false', // true by default
      useQueryCache: process.env.PRISMA_USE_QUERY_CACHE !== 'false', // true by default
      queryEngineMemoryLimit: parseInt(process.env.PRISMA_QUERY_ENGINE_MEMORY_LIMIT, 10) || 2048, // 2GB
    },
  };
});

/**
 * Default database configuration used when environment variables are not set.
 * This provides a fallback for development and testing environments.
 * 
 * @remarks
 * These values are overridden by environment variables when available.
 * The connection pool size defaults to (CPU cores * 2 + 1) as per Prisma's default formula.
 */
export const defaultDatabaseConfig: IDatabaseConfig = {
  url: 'postgresql://postgres:postgres@localhost:5432/gamification?schema=public&connection_limit=10',
  ssl: false,
  
  pool: {
    min: 2,
    max: 10, // This should match the connection_limit in the URL
    idle: 10000,
    acquire: 60000,
    connectionTimeout: 30000,
    queueTimeout: 5000,
  },
  
  logging: {
    enabled: true,
    level: 'info',
    emitDecoratorMetadata: false,
    queryThreshold: 500,
    logConnectionEvents: true,
    logPoolStatistics: false,
  },
  
  errorHandling: {
    retryAttempts: 3,
    retryDelay: 1000,
    useExponentialBackoff: true,
    maxBackoffDelay: 30000,
    classifyErrors: true,
    handleTransientErrors: true,
  },
  
  transactions: {
    isolationLevel: 'ReadCommitted',
    timeout: 30000,
    useNativeTransactions: true,
  },
  
  journeyContexts: {
    enabled: true,
    separateConnections: false,
    contextSpecificPools: false,
  },
  
  healthCheck: {
    enabled: true,
    interval: 60000,
    timeout: 5000,
    pingQuery: 'SELECT 1',
    failureThreshold: 3,
  },
  
  metrics: {
    enabled: true,
    collectInterval: 10000,
    includeQueryStats: true,
    includePoolStats: true,
    logMetricsInterval: 60000,
  },
  
  prisma: {
    logQueries: false,
    logQueryParameters: false,
    softDeleteEnabled: true,
    middlewareEnabled: true,
    useQueryCache: true,
    queryEngineMemoryLimit: 2048,
  },
};

/**
 * Helper function to merge partial database configuration with default values.
 * This is useful for testing and development environments where only some
 * configuration values need to be overridden.
 * 
 * @param config - Partial database configuration to merge with defaults
 * @returns Complete database configuration with defaults applied for missing values
 */
export function mergeDatabaseConfig(config: Partial<IDatabaseConfig>): IDatabaseConfig {
  return {
    ...defaultDatabaseConfig,
    ...config,
    pool: {
      ...defaultDatabaseConfig.pool,
      ...config.pool,
    },
    logging: {
      ...defaultDatabaseConfig.logging,
      ...config.logging,
    },
    errorHandling: {
      ...defaultDatabaseConfig.errorHandling,
      ...config.errorHandling,
    },
    transactions: {
      ...defaultDatabaseConfig.transactions,
      ...config.transactions,
    },
    journeyContexts: {
      ...defaultDatabaseConfig.journeyContexts,
      ...config.journeyContexts,
    },
    healthCheck: {
      ...defaultDatabaseConfig.healthCheck,
      ...config.healthCheck,
    },
    metrics: {
      ...defaultDatabaseConfig.metrics,
      ...config.metrics,
    },
    prisma: {
      ...defaultDatabaseConfig.prisma,
      ...config.prisma,
    },
  };
}

/**
 * Creates a database configuration object for a specific journey.
 * This allows for journey-specific database configuration while inheriting
 * from the main database configuration.
 * 
 * @param journeyName - Name of the journey (health, care, plan)
 * @param baseConfig - Base database configuration to extend
 * @returns Journey-specific database configuration
 */
export function createJourneyDatabaseConfig(
  journeyName: 'health' | 'care' | 'plan',
  baseConfig: IDatabaseConfig = defaultDatabaseConfig,
): IDatabaseConfig {
  // Use journey-specific environment variables if available
  const journeyPrefix = journeyName.toUpperCase();
  
  // Parse connection string to add connection_limit if not present
  let connectionUrl = process.env[`${journeyPrefix}_DATABASE_URL`] || baseConfig.url;
  const hasConnectionLimit = connectionUrl.includes('connection_limit=');
  const journeyPoolMax = parseInt(process.env[`${journeyPrefix}_DATABASE_POOL_MAX`], 10) || baseConfig.pool.max;
  
  if (!hasConnectionLimit && connectionUrl && !connectionUrl.includes('?')) {
    connectionUrl = `${connectionUrl}?connection_limit=${journeyPoolMax}`;
  } else if (!hasConnectionLimit && connectionUrl && connectionUrl.includes('?')) {
    connectionUrl = `${connectionUrl}&connection_limit=${journeyPoolMax}`;
  }
  
  return mergeDatabaseConfig({
    ...baseConfig,
    url: connectionUrl,
    pool: {
      ...baseConfig.pool,
      max: journeyPoolMax,
    },
    logging: {
      ...baseConfig.logging,
      level: (process.env[`${journeyPrefix}_DATABASE_LOG_LEVEL`] as LogLevel) || baseConfig.logging.level,
    },
  });
}

/**
 * Helper function to extract connection pool metrics from Prisma Client metrics.
 * This is useful for monitoring connection pool usage and diagnosing connection issues.
 * 
 * @param metrics - Metrics object from prisma.$metrics.json()
 * @returns Object containing connection pool metrics
 */
export function extractConnectionPoolMetrics(metrics: any): {
  openConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  maxConnections: number;
} {
  const openConnections = metrics?.counters?.find(
    (counter: any) => counter.key === 'prisma_pool_connections_open'
  )?.value || 0;
  
  const activeConnections = metrics?.counters?.find(
    (counter: any) => counter.key === 'prisma_pool_connections_busy'
  )?.value || 0;
  
  const waitingRequests = metrics?.counters?.find(
    (counter: any) => counter.key === 'prisma_pool_connections_waiting'
  )?.value || 0;
  
  return {
    openConnections,
    activeConnections,
    idleConnections: openConnections - activeConnections,
    waitingRequests,
    maxConnections: parseInt(process.env.DATABASE_POOL_MAX, 10) || 
      (typeof process !== 'undefined' ? require('os').cpus().length * 2 + 1 : 10),
  };
}