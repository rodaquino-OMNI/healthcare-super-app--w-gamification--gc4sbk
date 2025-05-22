import { Logger } from '@nestjs/common';

/**
 * Environment types for database configuration
 */
export enum Environment {
  DEVELOPMENT = 'development',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Configuration for database retry strategies
 */
export interface RetryConfig {
  /**
   * Base delay in milliseconds between retry attempts
   * @default 100
   */
  baseDelayMs: number;

  /**
   * Maximum delay in milliseconds between retry attempts
   * @default 5000
   */
  maxDelayMs: number;

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts: number;

  /**
   * Jitter factor to add randomness to retry delays (0-1)
   * Helps prevent retry storms when multiple services retry simultaneously
   * @default 0.1
   */
  jitterFactor: number;
}

/**
 * Configuration for database connection health checks
 */
export interface HealthCheckConfig {
  /**
   * Interval in milliseconds between health checks
   * @default 60000 (1 minute)
   */
  intervalMs: number;

  /**
   * Timeout in milliseconds for health check queries
   * @default 5000 (5 seconds)
   */
  timeoutMs: number;

  /**
   * Whether to automatically recover unhealthy connections
   * @default true
   */
  autoRecover: boolean;

  /**
   * Maximum number of consecutive failed health checks before marking a connection as unhealthy
   * @default 3
   */
  failureThreshold: number;

  /**
   * Number of consecutive successful health checks required to mark a connection as healthy again
   * @default 2
   */
  successThreshold: number;
}

/**
 * Configuration for database connection pooling
 */
export interface ConnectionPoolConfig {
  /**
   * Minimum number of connections to keep in the pool
   * @default 2 (development), 5 (production)
   */
  poolMin: number;

  /**
   * Maximum number of connections allowed in the pool
   * @default 10 (development), 20 (production)
   */
  poolMax: number;

  /**
   * Time in milliseconds after which idle connections are removed from the pool
   * @default 5000 (development), 10000 (production)
   */
  poolIdle: number;

  /**
   * Whether to validate connections before serving them from the pool
   * @default true
   */
  validateConnection: boolean;

  /**
   * Timeout in milliseconds for acquiring a connection from the pool
   * @default 30000 (30 seconds)
   */
  acquireTimeoutMs: number;

  /**
   * Whether to create connections lazily (on demand) or eagerly (at startup)
   * @default true (development), false (production)
   */
  lazyConnect: boolean;
}

/**
 * Configuration for journey-specific database contexts
 */
export interface JourneyContextConfig {
  /**
   * Whether to enable journey-specific database contexts
   * @default true
   */
  enabled: boolean;

  /**
   * Whether to use separate connection pools for each journey
   * @default false
   */
  separateConnectionPools: boolean;

  /**
   * Maximum connections per journey when using separate connection pools
   * @default 5
   */
  maxConnectionsPerJourney: number;

  /**
   * Whether to enable query logging for journey-specific contexts
   * @default true (development), false (production)
   */
  enableQueryLogging: boolean;
}

/**
 * Complete database connection configuration
 */
export interface ConnectionConfig {
  /**
   * Minimum number of connections in the pool
   * @default 2 (development), 5 (production)
   */
  poolMin: number;

  /**
   * Maximum number of connections in the pool
   * @default 10 (development), 20 (production)
   */
  poolMax: number;

  /**
   * Time in milliseconds after which idle connections are removed from the pool
   * @default 5000 (development), 10000 (production)
   */
  poolIdle: number;

  /**
   * Maximum number of connection attempts before giving up
   * @default 5
   */
  maxConnectionAttempts: number;

  /**
   * Timeout in milliseconds for establishing a connection
   * @default 30000 (30 seconds)
   */
  connectionTimeout: number;

  /**
   * Timeout in milliseconds for query execution
   * @default 30000 (30 seconds)
   */
  queryTimeout: number;

  /**
   * Whether to enable query logging
   * @default true (development), false (production)
   */
  enableQueryLogging: boolean;

  /**
   * Whether to enable performance tracking for database operations
   * @default true
   */
  enablePerformanceTracking: boolean;

  /**
   * Whether to enable circuit breaker for database operations
   * @default false (development), true (production)
   */
  enableCircuitBreaker: boolean;

  /**
   * Configuration for retry strategies
   */
  retryConfig: RetryConfig;

  /**
   * Interval in milliseconds between health checks
   * @default 60000 (1 minute)
   */
  healthCheckInterval: number;

  /**
   * Journey-specific database context configuration
   */
  journeyContext?: JourneyContextConfig;

  /**
   * Health check configuration
   */
  healthCheck?: HealthCheckConfig;

  /**
   * Connection pool configuration
   */
  connectionPool?: ConnectionPoolConfig;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  baseDelayMs: 100,
  maxDelayMs: 5000,
  maxAttempts: 3,
  jitterFactor: 0.1,
};

/**
 * Default health check configuration
 */
export const DEFAULT_HEALTH_CHECK_CONFIG: HealthCheckConfig = {
  intervalMs: 60000, // 1 minute
  timeoutMs: 5000, // 5 seconds
  autoRecover: true,
  failureThreshold: 3,
  successThreshold: 2,
};

/**
 * Default connection configuration for development environment
 */
export const DEVELOPMENT_CONFIG: ConnectionConfig = {
  poolMin: 2,
  poolMax: 10,
  poolIdle: 5000,
  maxConnectionAttempts: 5,
  connectionTimeout: 30000,
  queryTimeout: 30000,
  enableQueryLogging: true,
  enablePerformanceTracking: true,
  enableCircuitBreaker: false,
  retryConfig: DEFAULT_RETRY_CONFIG,
  healthCheckInterval: 60000,
  journeyContext: {
    enabled: true,
    separateConnectionPools: false,
    maxConnectionsPerJourney: 5,
    enableQueryLogging: true,
  },
  healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
  connectionPool: {
    poolMin: 2,
    poolMax: 10,
    poolIdle: 5000,
    validateConnection: true,
    acquireTimeoutMs: 30000,
    lazyConnect: true,
  },
};

/**
 * Default connection configuration for test environment
 */
export const TEST_CONFIG: ConnectionConfig = {
  ...DEVELOPMENT_CONFIG,
  poolMin: 1,
  poolMax: 5,
  enableQueryLogging: false,
  enablePerformanceTracking: false,
  healthCheckInterval: 0, // Disable health checks in test environment
  connectionPool: {
    ...DEVELOPMENT_CONFIG.connectionPool,
    poolMin: 1,
    poolMax: 5,
    lazyConnect: true,
  },
};

/**
 * Default connection configuration for staging environment
 */
export const STAGING_CONFIG: ConnectionConfig = {
  poolMin: 3,
  poolMax: 15,
  poolIdle: 7500,
  maxConnectionAttempts: 5,
  connectionTimeout: 30000,
  queryTimeout: 30000,
  enableQueryLogging: false,
  enablePerformanceTracking: true,
  enableCircuitBreaker: true,
  retryConfig: {
    ...DEFAULT_RETRY_CONFIG,
    maxAttempts: 4,
  },
  healthCheckInterval: 30000, // More frequent health checks in staging
  journeyContext: {
    enabled: true,
    separateConnectionPools: true,
    maxConnectionsPerJourney: 5,
    enableQueryLogging: false,
  },
  healthCheck: {
    ...DEFAULT_HEALTH_CHECK_CONFIG,
    intervalMs: 30000, // More frequent health checks in staging
  },
  connectionPool: {
    poolMin: 3,
    poolMax: 15,
    poolIdle: 7500,
    validateConnection: true,
    acquireTimeoutMs: 30000,
    lazyConnect: false,
  },
};

/**
 * Default connection configuration for production environment
 */
export const PRODUCTION_CONFIG: ConnectionConfig = {
  poolMin: 5,
  poolMax: 20,
  poolIdle: 10000,
  maxConnectionAttempts: 5,
  connectionTimeout: 30000,
  queryTimeout: 30000,
  enableQueryLogging: false,
  enablePerformanceTracking: true,
  enableCircuitBreaker: true,
  retryConfig: {
    ...DEFAULT_RETRY_CONFIG,
    maxAttempts: 5,
    maxDelayMs: 10000,
  },
  healthCheckInterval: 60000,
  journeyContext: {
    enabled: true,
    separateConnectionPools: true,
    maxConnectionsPerJourney: 7,
    enableQueryLogging: false,
  },
  healthCheck: {
    ...DEFAULT_HEALTH_CHECK_CONFIG,
    failureThreshold: 2, // More sensitive in production
    successThreshold: 3, // More conservative recovery in production
  },
  connectionPool: {
    poolMin: 5,
    poolMax: 20,
    poolIdle: 10000,
    validateConnection: true,
    acquireTimeoutMs: 30000,
    lazyConnect: false,
  },
};

/**
 * Map of environment-specific configurations
 */
export const ENV_CONFIG_MAP: Record<Environment, ConnectionConfig> = {
  [Environment.DEVELOPMENT]: DEVELOPMENT_CONFIG,
  [Environment.TEST]: TEST_CONFIG,
  [Environment.STAGING]: STAGING_CONFIG,
  [Environment.PRODUCTION]: PRODUCTION_CONFIG,
};

/**
 * Configuration validation error
 */
export class ConfigValidationError extends Error {
  constructor(message: string, public readonly validationErrors: string[]) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validates a connection configuration object
 * @param config The configuration to validate
 * @returns An array of validation error messages, empty if valid
 */
export function validateConnectionConfig(config: Partial<ConnectionConfig>): string[] {
  const errors: string[] = [];

  // Validate pool settings
  if (config.poolMin !== undefined && config.poolMax !== undefined) {
    if (config.poolMin > config.poolMax) {
      errors.push(`poolMin (${config.poolMin}) cannot be greater than poolMax (${config.poolMax})`);
    }
  }

  // Validate timeout settings
  if (config.connectionTimeout !== undefined && config.connectionTimeout <= 0) {
    errors.push(`connectionTimeout (${config.connectionTimeout}) must be greater than 0`);
  }

  if (config.queryTimeout !== undefined && config.queryTimeout <= 0) {
    errors.push(`queryTimeout (${config.queryTimeout}) must be greater than 0`);
  }

  // Validate retry settings
  if (config.retryConfig) {
    if (config.retryConfig.baseDelayMs <= 0) {
      errors.push(`retryConfig.baseDelayMs (${config.retryConfig.baseDelayMs}) must be greater than 0`);
    }

    if (config.retryConfig.maxDelayMs <= config.retryConfig.baseDelayMs) {
      errors.push(`retryConfig.maxDelayMs (${config.retryConfig.maxDelayMs}) must be greater than baseDelayMs (${config.retryConfig.baseDelayMs})`);
    }

    if (config.retryConfig.maxAttempts <= 0) {
      errors.push(`retryConfig.maxAttempts (${config.retryConfig.maxAttempts}) must be greater than 0`);
    }

    if (config.retryConfig.jitterFactor < 0 || config.retryConfig.jitterFactor > 1) {
      errors.push(`retryConfig.jitterFactor (${config.retryConfig.jitterFactor}) must be between 0 and 1`);
    }
  }

  // Validate health check settings
  if (config.healthCheck) {
    if (config.healthCheck.intervalMs < 0) {
      errors.push(`healthCheck.intervalMs (${config.healthCheck.intervalMs}) must be greater than or equal to 0`);
    }

    if (config.healthCheck.timeoutMs <= 0) {
      errors.push(`healthCheck.timeoutMs (${config.healthCheck.timeoutMs}) must be greater than 0`);
    }

    if (config.healthCheck.failureThreshold <= 0) {
      errors.push(`healthCheck.failureThreshold (${config.healthCheck.failureThreshold}) must be greater than 0`);
    }

    if (config.healthCheck.successThreshold <= 0) {
      errors.push(`healthCheck.successThreshold (${config.healthCheck.successThreshold}) must be greater than 0`);
    }
  }

  // Validate connection pool settings
  if (config.connectionPool) {
    if (config.connectionPool.poolMin > config.connectionPool.poolMax) {
      errors.push(`connectionPool.poolMin (${config.connectionPool.poolMin}) cannot be greater than connectionPool.poolMax (${config.connectionPool.poolMax})`);
    }

    if (config.connectionPool.acquireTimeoutMs <= 0) {
      errors.push(`connectionPool.acquireTimeoutMs (${config.connectionPool.acquireTimeoutMs}) must be greater than 0`);
    }
  }

  // Validate journey context settings
  if (config.journeyContext && config.journeyContext.separateConnectionPools) {
    if (config.journeyContext.maxConnectionsPerJourney <= 0) {
      errors.push(`journeyContext.maxConnectionsPerJourney (${config.journeyContext.maxConnectionsPerJourney}) must be greater than 0`);
    }
  }

  return errors;
}

/**
 * Gets the appropriate configuration for the current environment
 * @param environment The current environment
 * @param overrides Optional configuration overrides
 * @returns The merged configuration
 * @throws {ConfigValidationError} If the resulting configuration is invalid
 */
export function getConfigForEnvironment(
  environment: Environment = Environment.DEVELOPMENT,
  overrides: Partial<ConnectionConfig> = {},
): ConnectionConfig {
  const baseConfig = ENV_CONFIG_MAP[environment] || DEVELOPMENT_CONFIG;
  const mergedConfig = mergeConfigs(baseConfig, overrides);
  
  // Validate the merged configuration
  const validationErrors = validateConnectionConfig(mergedConfig);
  if (validationErrors.length > 0) {
    throw new ConfigValidationError(
      `Invalid database connection configuration for environment ${environment}`,
      validationErrors,
    );
  }
  
  return mergedConfig;
}

/**
 * Merges multiple configuration objects, with later objects taking precedence
 * @param baseConfig The base configuration
 * @param overrides Configuration overrides
 * @returns The merged configuration
 */
export function mergeConfigs(
  baseConfig: ConnectionConfig,
  overrides: Partial<ConnectionConfig>,
): ConnectionConfig {
  // Deep merge for nested objects
  const merged: ConnectionConfig = {
    ...baseConfig,
    ...overrides,
    retryConfig: {
      ...baseConfig.retryConfig,
      ...(overrides.retryConfig || {}),
    },
    journeyContext: overrides.journeyContext
      ? {
          ...baseConfig.journeyContext,
          ...overrides.journeyContext,
        }
      : baseConfig.journeyContext,
    healthCheck: overrides.healthCheck
      ? {
          ...baseConfig.healthCheck,
          ...overrides.healthCheck,
        }
      : baseConfig.healthCheck,
    connectionPool: overrides.connectionPool
      ? {
          ...baseConfig.connectionPool,
          ...overrides.connectionPool,
        }
      : baseConfig.connectionPool,
  };

  return merged;
}

/**
 * Creates a configuration object from environment variables
 * @param prefix Optional prefix for environment variables (default: 'DATABASE_')
 * @param logger Optional logger for warnings about missing environment variables
 * @returns A partial configuration object with values from environment variables
 */
export function configFromEnvironment(
  prefix: string = 'DATABASE_',
  logger?: Logger,
): Partial<ConnectionConfig> {
  const config: Partial<ConnectionConfig> = {};
  const env = process.env;

  // Helper function to get a number from environment variable
  const getNumber = (key: string, defaultValue?: number): number | undefined => {
    const envKey = `${prefix}${key}`;
    const value = env[envKey];
    if (value === undefined) {
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      logger?.warn(`Invalid number value for ${envKey}: ${value}`);
      return defaultValue;
    }
    return parsed;
  };

  // Helper function to get a boolean from environment variable
  const getBoolean = (key: string, defaultValue?: boolean): boolean | undefined => {
    const envKey = `${prefix}${key}`;
    const value = env[envKey];
    if (value === undefined) {
      return defaultValue;
    }
    return value.toLowerCase() === 'true';
  };

  // Pool settings
  config.poolMin = getNumber('POOL_MIN');
  config.poolMax = getNumber('POOL_MAX');
  config.poolIdle = getNumber('POOL_IDLE');

  // Connection settings
  config.maxConnectionAttempts = getNumber('MAX_CONNECTION_ATTEMPTS');
  config.connectionTimeout = getNumber('CONNECTION_TIMEOUT');
  config.queryTimeout = getNumber('QUERY_TIMEOUT');

  // Feature flags
  config.enableQueryLogging = getBoolean('ENABLE_QUERY_LOGGING');
  config.enablePerformanceTracking = getBoolean('ENABLE_PERFORMANCE_TRACKING');
  config.enableCircuitBreaker = getBoolean('ENABLE_CIRCUIT_BREAKER');

  // Health check settings
  config.healthCheckInterval = getNumber('HEALTH_CHECK_INTERVAL');

  // Retry settings
  const retryConfig: Partial<RetryConfig> = {};
  retryConfig.baseDelayMs = getNumber('RETRY_BASE_DELAY');
  retryConfig.maxDelayMs = getNumber('RETRY_MAX_DELAY');
  retryConfig.maxAttempts = getNumber('RETRY_MAX_ATTEMPTS');
  retryConfig.jitterFactor = getNumber('RETRY_JITTER_FACTOR');

  // Only add retry config if any values were set
  if (Object.keys(retryConfig).length > 0) {
    config.retryConfig = retryConfig as RetryConfig;
  }

  // Journey context settings
  const journeyContext: Partial<JourneyContextConfig> = {};
  journeyContext.enabled = getBoolean('JOURNEY_CONTEXT_ENABLED');
  journeyContext.separateConnectionPools = getBoolean('JOURNEY_SEPARATE_POOLS');
  journeyContext.maxConnectionsPerJourney = getNumber('JOURNEY_MAX_CONNECTIONS');
  journeyContext.enableQueryLogging = getBoolean('JOURNEY_QUERY_LOGGING');

  // Only add journey context if any values were set
  if (Object.keys(journeyContext).length > 0) {
    config.journeyContext = journeyContext as JourneyContextConfig;
  }

  return config;
}

/**
 * Creates a configuration object for a specific journey
 * @param journeyType The type of journey (health, care, plan)
 * @param baseConfig The base configuration to extend
 * @returns A configuration object customized for the specified journey
 */
export function getJourneyConfig(
  journeyType: 'health' | 'care' | 'plan',
  baseConfig: ConnectionConfig,
): ConnectionConfig {
  // Journey-specific configuration adjustments
  const journeyConfigs: Record<string, Partial<ConnectionConfig>> = {
    health: {
      // Health journey handles time-series data, so optimize for that
      poolMax: Math.max(baseConfig.poolMax, 15), // Higher connection limit for time-series data
      queryTimeout: 45000, // Longer timeout for complex health analytics queries
      retryConfig: {
        ...baseConfig.retryConfig,
        maxAttempts: 4, // More retries for health data which is critical
      },
    },
    care: {
      // Care journey handles appointment scheduling, optimize for consistency
      poolMax: Math.max(baseConfig.poolMax, 12),
      enableCircuitBreaker: true, // Always enable circuit breaker for appointment scheduling
      retryConfig: {
        ...baseConfig.retryConfig,
        baseDelayMs: 200, // Slightly longer base delay for care operations
      },
    },
    plan: {
      // Plan journey handles financial transactions, optimize for reliability
      poolMax: Math.max(baseConfig.poolMax, 10),
      enableCircuitBreaker: true, // Always enable circuit breaker for financial operations
      queryTimeout: 40000, // Longer timeout for complex financial queries
      retryConfig: {
        ...baseConfig.retryConfig,
        jitterFactor: 0.2, // More jitter for plan service to prevent retry storms
      },
    },
  };

  const journeyConfig = journeyConfigs[journeyType] || {};
  return mergeConfigs(baseConfig, journeyConfig);
}

/**
 * Creates a dynamic configuration updater function
 * @param initialConfig The initial configuration
 * @returns A function that can update the configuration at runtime
 */
export function createConfigUpdater(initialConfig: ConnectionConfig): {
  getConfig: () => ConnectionConfig;
  updateConfig: (updates: Partial<ConnectionConfig>) => ConnectionConfig;
} {
  let currentConfig = { ...initialConfig };

  return {
    /**
     * Gets the current configuration
     * @returns The current configuration
     */
    getConfig: () => ({ ...currentConfig }),

    /**
     * Updates the configuration with new values
     * @param updates Partial configuration updates
     * @returns The updated configuration
     * @throws {ConfigValidationError} If the resulting configuration is invalid
     */
    updateConfig: (updates: Partial<ConnectionConfig>): ConnectionConfig => {
      const updatedConfig = mergeConfigs(currentConfig, updates);
      
      // Validate the updated configuration
      const validationErrors = validateConnectionConfig(updatedConfig);
      if (validationErrors.length > 0) {
        throw new ConfigValidationError(
          'Invalid database connection configuration update',
          validationErrors,
        );
      }
      
      currentConfig = updatedConfig;
      return { ...currentConfig };
    },
  };
}