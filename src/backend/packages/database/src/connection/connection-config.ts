/**
 * @file connection-config.ts
 * @description Defines the configuration interface and default options for database connections.
 * Provides types and utilities for configuring connection parameters including timeouts,
 * pool sizes, retry policies, and health check intervals. The configuration is environment-aware,
 * allowing different settings for development, testing, staging, and production.
 */

import { ErrorType } from '@austa/errors';
import {
  getEnv,
  getRequiredEnv,
  getOptionalEnv,
  parseBoolean,
  parseNumber,
  parseJson,
  validateUrl,
  validateNumericRange,
} from '@austa/utils/env';
import {
  ConnectionConfig,
  DatabaseTechnology,
  IConnectionPoolConfig,
  IConnectionRetryConfig,
  IPostgresConnectionConfig,
  IRedisConnectionConfig,
  ISSLConfiguration,
  ITimescaleConnectionConfig,
  IS3ConnectionConfig,
  SSLMode,
} from '../types/connection.types';

/**
 * Environment types supported by the application
 */
export enum Environment {
  DEVELOPMENT = 'development',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Interface for environment-specific database configuration
 */
export interface IEnvironmentConfig {
  /**
   * Current environment (development, test, staging, production)
   */
  environment: Environment;

  /**
   * Debug mode flag
   */
  debug: boolean;

  /**
   * Default connection pool configuration for this environment
   */
  defaultPoolConfig: IConnectionPoolConfig;

  /**
   * Default retry configuration for this environment
   */
  defaultRetryConfig: IConnectionRetryConfig;

  /**
   * Default SSL configuration for this environment
   */
  defaultSslConfig?: ISSLConfiguration;

  /**
   * Default connection timeout in milliseconds
   */
  defaultConnectionTimeout: number;

  /**
   * Default statement timeout in milliseconds (for PostgreSQL/TimescaleDB)
   */
  defaultStatementTimeout: number;

  /**
   * Default command timeout in milliseconds (for Redis)
   */
  defaultCommandTimeout: number;

  /**
   * Health check interval in milliseconds
   */
  healthCheckIntervalMs: number;

  /**
   * Maximum health check failures before marking a connection as unhealthy
   */
  maxHealthCheckFailures: number;
}

/**
 * Interface for journey-specific database configuration overrides
 */
export interface IJourneyDatabaseConfig {
  /**
   * Journey ID (health, care, plan)
   */
  journeyId: string;

  /**
   * Connection pool configuration overrides for this journey
   */
  poolConfig?: Partial<IConnectionPoolConfig>;

  /**
   * Retry configuration overrides for this journey
   */
  retryConfig?: Partial<IConnectionRetryConfig>;

  /**
   * Connection timeout override for this journey
   */
  connectionTimeout?: number;

  /**
   * Statement timeout override for this journey (for PostgreSQL/TimescaleDB)
   */
  statementTimeout?: number;

  /**
   * Command timeout override for this journey (for Redis)
   */
  commandTimeout?: number;

  /**
   * Schema to use for this journey (for PostgreSQL/TimescaleDB)
   */
  schema?: string;

  /**
   * Database name to use for this journey (for PostgreSQL/TimescaleDB)
   */
  database?: string;

  /**
   * Redis database index to use for this journey
   */
  redisDb?: number;

  /**
   * Redis key prefix to use for this journey
   */
  redisKeyPrefix?: string;

  /**
   * S3 bucket to use for this journey
   */
  s3Bucket?: string;
}

/**
 * Default connection pool configuration for development environment
 */
const DEV_POOL_CONFIG: IConnectionPoolConfig = {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 5000, // 5 seconds
  retryIntervalMillis: 1000, // 1 second
  validateOnBorrow: true,
  validateOnIdle: true,
};

/**
 * Default connection pool configuration for test environment
 */
const TEST_POOL_CONFIG: IConnectionPoolConfig = {
  min: 1,
  max: 5,
  idleTimeoutMillis: 10000, // 10 seconds
  connectionTimeoutMillis: 3000, // 3 seconds
  retryIntervalMillis: 500, // 0.5 seconds
  validateOnBorrow: true,
  validateOnIdle: false, // Disable idle validation in test to reduce overhead
};

/**
 * Default connection pool configuration for staging environment
 */
const STAGING_POOL_CONFIG: IConnectionPoolConfig = {
  min: 5,
  max: 20,
  idleTimeoutMillis: 60000, // 1 minute
  connectionTimeoutMillis: 8000, // 8 seconds
  retryIntervalMillis: 2000, // 2 seconds
  validateOnBorrow: true,
  validateOnIdle: true,
};

/**
 * Default connection pool configuration for production environment
 */
const PRODUCTION_POOL_CONFIG: IConnectionPoolConfig = {
  min: 10,
  max: 50,
  idleTimeoutMillis: 120000, // 2 minutes
  connectionTimeoutMillis: 10000, // 10 seconds
  retryIntervalMillis: 3000, // 3 seconds
  validateOnBorrow: true,
  validateOnIdle: true,
};

/**
 * Default retry configuration for development environment
 */
const DEV_RETRY_CONFIG: IConnectionRetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000, // 5 seconds
  backoffFactor: 2,
  useJitter: true,
  retryableErrors: [ErrorType.TRANSIENT, ErrorType.CONNECTION, ErrorType.TIMEOUT],
};

/**
 * Default retry configuration for test environment
 */
const TEST_RETRY_CONFIG: IConnectionRetryConfig = {
  maxRetries: 2,
  initialDelayMs: 50,
  maxDelayMs: 1000, // 1 second
  backoffFactor: 2,
  useJitter: false, // Disable jitter in tests for predictability
  retryableErrors: [ErrorType.TRANSIENT, ErrorType.CONNECTION, ErrorType.TIMEOUT],
};

/**
 * Default retry configuration for staging environment
 */
const STAGING_RETRY_CONFIG: IConnectionRetryConfig = {
  maxRetries: 5,
  initialDelayMs: 200,
  maxDelayMs: 8000, // 8 seconds
  backoffFactor: 2,
  useJitter: true,
  retryableErrors: [ErrorType.TRANSIENT, ErrorType.CONNECTION, ErrorType.TIMEOUT],
};

/**
 * Default retry configuration for production environment
 */
const PRODUCTION_RETRY_CONFIG: IConnectionRetryConfig = {
  maxRetries: 7,
  initialDelayMs: 300,
  maxDelayMs: 15000, // 15 seconds
  backoffFactor: 2,
  useJitter: true,
  retryableErrors: [ErrorType.TRANSIENT, ErrorType.CONNECTION, ErrorType.TIMEOUT],
};

/**
 * Default SSL configuration for development environment
 */
const DEV_SSL_CONFIG: ISSLConfiguration = {
  mode: SSLMode.PREFER,
  rejectUnauthorized: false, // Allow self-signed certificates in development
};

/**
 * Default SSL configuration for test environment
 */
const TEST_SSL_CONFIG: ISSLConfiguration = {
  mode: SSLMode.PREFER,
  rejectUnauthorized: false, // Allow self-signed certificates in tests
};

/**
 * Default SSL configuration for staging environment
 */
const STAGING_SSL_CONFIG: ISSLConfiguration = {
  mode: SSLMode.REQUIRE,
  rejectUnauthorized: true,
};

/**
 * Default SSL configuration for production environment
 */
const PRODUCTION_SSL_CONFIG: ISSLConfiguration = {
  mode: SSLMode.VERIFY_FULL,
  rejectUnauthorized: true,
};

/**
 * Default environment configuration for development
 */
const DEV_ENV_CONFIG: IEnvironmentConfig = {
  environment: Environment.DEVELOPMENT,
  debug: true,
  defaultPoolConfig: DEV_POOL_CONFIG,
  defaultRetryConfig: DEV_RETRY_CONFIG,
  defaultSslConfig: DEV_SSL_CONFIG,
  defaultConnectionTimeout: 5000, // 5 seconds
  defaultStatementTimeout: 30000, // 30 seconds
  defaultCommandTimeout: 5000, // 5 seconds
  healthCheckIntervalMs: 60000, // 1 minute
  maxHealthCheckFailures: 3,
};

/**
 * Default environment configuration for test
 */
const TEST_ENV_CONFIG: IEnvironmentConfig = {
  environment: Environment.TEST,
  debug: true,
  defaultPoolConfig: TEST_POOL_CONFIG,
  defaultRetryConfig: TEST_RETRY_CONFIG,
  defaultSslConfig: TEST_SSL_CONFIG,
  defaultConnectionTimeout: 3000, // 3 seconds
  defaultStatementTimeout: 10000, // 10 seconds
  defaultCommandTimeout: 3000, // 3 seconds
  healthCheckIntervalMs: 30000, // 30 seconds
  maxHealthCheckFailures: 2,
};

/**
 * Default environment configuration for staging
 */
const STAGING_ENV_CONFIG: IEnvironmentConfig = {
  environment: Environment.STAGING,
  debug: false,
  defaultPoolConfig: STAGING_POOL_CONFIG,
  defaultRetryConfig: STAGING_RETRY_CONFIG,
  defaultSslConfig: STAGING_SSL_CONFIG,
  defaultConnectionTimeout: 8000, // 8 seconds
  defaultStatementTimeout: 60000, // 1 minute
  defaultCommandTimeout: 8000, // 8 seconds
  healthCheckIntervalMs: 120000, // 2 minutes
  maxHealthCheckFailures: 5,
};

/**
 * Default environment configuration for production
 */
const PRODUCTION_ENV_CONFIG: IEnvironmentConfig = {
  environment: Environment.PRODUCTION,
  debug: false,
  defaultPoolConfig: PRODUCTION_POOL_CONFIG,
  defaultRetryConfig: PRODUCTION_RETRY_CONFIG,
  defaultSslConfig: PRODUCTION_SSL_CONFIG,
  defaultConnectionTimeout: 10000, // 10 seconds
  defaultStatementTimeout: 120000, // 2 minutes
  defaultCommandTimeout: 10000, // 10 seconds
  healthCheckIntervalMs: 300000, // 5 minutes
  maxHealthCheckFailures: 7,
};

/**
 * Default journey-specific database configurations
 */
const DEFAULT_JOURNEY_CONFIGS: Record<string, IJourneyDatabaseConfig> = {
  health: {
    journeyId: 'health',
    schema: 'health',
    database: 'austa_health',
    redisDb: 1,
    redisKeyPrefix: 'health:',
    s3Bucket: 'austa-health',
    // Health journey has more time-series data, so we optimize for that
    poolConfig: {
      min: 5, // Higher minimum connections for time-series data
    },
    statementTimeout: 180000, // 3 minutes for potentially long-running health analytics
  },
  care: {
    journeyId: 'care',
    schema: 'care',
    database: 'austa_care',
    redisDb: 2,
    redisKeyPrefix: 'care:',
    s3Bucket: 'austa-care',
    // Care journey needs faster response times for appointments
    connectionTimeout: 3000, // 3 seconds for faster timeouts
    retryConfig: {
      maxRetries: 3, // Fewer retries for more responsive UX
      initialDelayMs: 50, // Faster initial retry
    },
  },
  plan: {
    journeyId: 'plan',
    schema: 'plan',
    database: 'austa_plan',
    redisDb: 3,
    redisKeyPrefix: 'plan:',
    s3Bucket: 'austa-plan',
    // Plan journey has more complex transactions, so we optimize for that
    poolConfig: {
      validateOnBorrow: true, // Always validate connections for financial data
    },
    retryConfig: {
      maxRetries: 5, // More retries for financial transactions
    },
  },
};

/**
 * Gets the current environment from environment variables
 * @returns The current environment
 */
export function getCurrentEnvironment(): Environment {
  const env = getOptionalEnv('NODE_ENV', 'development');
  
  switch (env.toLowerCase()) {
    case 'production':
      return Environment.PRODUCTION;
    case 'staging':
      return Environment.STAGING;
    case 'test':
      return Environment.TEST;
    case 'development':
    default:
      return Environment.DEVELOPMENT;
  }
}

/**
 * Gets the environment configuration for the current environment
 * @returns The environment configuration
 */
export function getEnvironmentConfig(): IEnvironmentConfig {
  const environment = getCurrentEnvironment();
  
  // Get the base configuration for the current environment
  let config: IEnvironmentConfig;
  switch (environment) {
    case Environment.PRODUCTION:
      config = { ...PRODUCTION_ENV_CONFIG };
      break;
    case Environment.STAGING:
      config = { ...STAGING_ENV_CONFIG };
      break;
    case Environment.TEST:
      config = { ...TEST_ENV_CONFIG };
      break;
    case Environment.DEVELOPMENT:
    default:
      config = { ...DEV_ENV_CONFIG };
      break;
  }
  
  // Override with environment variables if provided
  return {
    ...config,
    debug: parseBoolean(getOptionalEnv('DB_DEBUG', String(config.debug))),
    defaultConnectionTimeout: parseNumber(
      getOptionalEnv('DB_CONNECTION_TIMEOUT', String(config.defaultConnectionTimeout))
    ),
    defaultStatementTimeout: parseNumber(
      getOptionalEnv('DB_STATEMENT_TIMEOUT', String(config.defaultStatementTimeout))
    ),
    defaultCommandTimeout: parseNumber(
      getOptionalEnv('DB_COMMAND_TIMEOUT', String(config.defaultCommandTimeout))
    ),
    healthCheckIntervalMs: parseNumber(
      getOptionalEnv('DB_HEALTH_CHECK_INTERVAL', String(config.healthCheckIntervalMs))
    ),
    maxHealthCheckFailures: parseNumber(
      getOptionalEnv('DB_MAX_HEALTH_CHECK_FAILURES', String(config.maxHealthCheckFailures))
    ),
    defaultPoolConfig: {
      ...config.defaultPoolConfig,
      min: parseNumber(getOptionalEnv('DB_POOL_MIN', String(config.defaultPoolConfig.min))),
      max: parseNumber(getOptionalEnv('DB_POOL_MAX', String(config.defaultPoolConfig.max))),
      idleTimeoutMillis: parseNumber(
        getOptionalEnv('DB_POOL_IDLE_TIMEOUT', String(config.defaultPoolConfig.idleTimeoutMillis))
      ),
      connectionTimeoutMillis: parseNumber(
        getOptionalEnv('DB_POOL_CONNECTION_TIMEOUT', String(config.defaultPoolConfig.connectionTimeoutMillis))
      ),
      retryIntervalMillis: parseNumber(
        getOptionalEnv('DB_POOL_RETRY_INTERVAL', String(config.defaultPoolConfig.retryIntervalMillis))
      ),
      validateOnBorrow: parseBoolean(
        getOptionalEnv('DB_POOL_VALIDATE_BORROW', String(config.defaultPoolConfig.validateOnBorrow))
      ),
      validateOnIdle: parseBoolean(
        getOptionalEnv('DB_POOL_VALIDATE_IDLE', String(config.defaultPoolConfig.validateOnIdle))
      ),
    },
    defaultRetryConfig: {
      ...config.defaultRetryConfig,
      maxRetries: parseNumber(
        getOptionalEnv('DB_RETRY_MAX', String(config.defaultRetryConfig.maxRetries))
      ),
      initialDelayMs: parseNumber(
        getOptionalEnv('DB_RETRY_INITIAL_DELAY', String(config.defaultRetryConfig.initialDelayMs))
      ),
      maxDelayMs: parseNumber(
        getOptionalEnv('DB_RETRY_MAX_DELAY', String(config.defaultRetryConfig.maxDelayMs))
      ),
      backoffFactor: parseNumber(
        getOptionalEnv('DB_RETRY_BACKOFF_FACTOR', String(config.defaultRetryConfig.backoffFactor))
      ),
      useJitter: parseBoolean(
        getOptionalEnv('DB_RETRY_USE_JITTER', String(config.defaultRetryConfig.useJitter))
      ),
      // We don't override retryableErrors from environment variables as it's complex to parse
    },
  };
}

/**
 * Gets the journey-specific database configuration
 * @param journeyId The journey ID (health, care, plan)
 * @returns The journey-specific database configuration
 */
export function getJourneyDatabaseConfig(journeyId: string): IJourneyDatabaseConfig {
  // Get the default journey config or create a new one if not found
  const defaultConfig = DEFAULT_JOURNEY_CONFIGS[journeyId] || {
    journeyId,
    schema: journeyId,
    database: `austa_${journeyId}`,
    redisDb: 0,
    redisKeyPrefix: `${journeyId}:`,
    s3Bucket: `austa-${journeyId}`,
  };
  
  // Create the environment variable prefix for this journey
  const envPrefix = `DB_${journeyId.toUpperCase()}_`;
  
  // Override with journey-specific environment variables if provided
  return {
    ...defaultConfig,
    schema: getOptionalEnv(`${envPrefix}SCHEMA`, defaultConfig.schema),
    database: getOptionalEnv(`${envPrefix}DATABASE`, defaultConfig.database),
    redisDb: parseNumber(getOptionalEnv(`${envPrefix}REDIS_DB`, String(defaultConfig.redisDb))),
    redisKeyPrefix: getOptionalEnv(`${envPrefix}REDIS_KEY_PREFIX`, defaultConfig.redisKeyPrefix),
    s3Bucket: getOptionalEnv(`${envPrefix}S3_BUCKET`, defaultConfig.s3Bucket),
    connectionTimeout: parseNumber(
      getOptionalEnv(`${envPrefix}CONNECTION_TIMEOUT`, defaultConfig.connectionTimeout?.toString() || '')
    ) || undefined,
    statementTimeout: parseNumber(
      getOptionalEnv(`${envPrefix}STATEMENT_TIMEOUT`, defaultConfig.statementTimeout?.toString() || '')
    ) || undefined,
    commandTimeout: parseNumber(
      getOptionalEnv(`${envPrefix}COMMAND_TIMEOUT`, defaultConfig.commandTimeout?.toString() || '')
    ) || undefined,
    poolConfig: defaultConfig.poolConfig ? {
      ...defaultConfig.poolConfig,
      min: parseNumber(
        getOptionalEnv(`${envPrefix}POOL_MIN`, defaultConfig.poolConfig.min?.toString() || '')
      ) || defaultConfig.poolConfig.min,
      max: parseNumber(
        getOptionalEnv(`${envPrefix}POOL_MAX`, defaultConfig.poolConfig.max?.toString() || '')
      ) || defaultConfig.poolConfig.max,
      idleTimeoutMillis: parseNumber(
        getOptionalEnv(`${envPrefix}POOL_IDLE_TIMEOUT`, defaultConfig.poolConfig.idleTimeoutMillis?.toString() || '')
      ) || defaultConfig.poolConfig.idleTimeoutMillis,
      connectionTimeoutMillis: parseNumber(
        getOptionalEnv(`${envPrefix}POOL_CONNECTION_TIMEOUT`, defaultConfig.poolConfig.connectionTimeoutMillis?.toString() || '')
      ) || defaultConfig.poolConfig.connectionTimeoutMillis,
      retryIntervalMillis: parseNumber(
        getOptionalEnv(`${envPrefix}POOL_RETRY_INTERVAL`, defaultConfig.poolConfig.retryIntervalMillis?.toString() || '')
      ) || defaultConfig.poolConfig.retryIntervalMillis,
      validateOnBorrow: parseBoolean(
        getOptionalEnv(`${envPrefix}POOL_VALIDATE_BORROW`, defaultConfig.poolConfig.validateOnBorrow?.toString() || '')
      ) ?? defaultConfig.poolConfig.validateOnBorrow,
      validateOnIdle: parseBoolean(
        getOptionalEnv(`${envPrefix}POOL_VALIDATE_IDLE`, defaultConfig.poolConfig.validateOnIdle?.toString() || '')
      ) ?? defaultConfig.poolConfig.validateOnIdle,
    } : undefined,
    retryConfig: defaultConfig.retryConfig ? {
      ...defaultConfig.retryConfig,
      maxRetries: parseNumber(
        getOptionalEnv(`${envPrefix}RETRY_MAX`, defaultConfig.retryConfig.maxRetries?.toString() || '')
      ) || defaultConfig.retryConfig.maxRetries,
      initialDelayMs: parseNumber(
        getOptionalEnv(`${envPrefix}RETRY_INITIAL_DELAY`, defaultConfig.retryConfig.initialDelayMs?.toString() || '')
      ) || defaultConfig.retryConfig.initialDelayMs,
      maxDelayMs: parseNumber(
        getOptionalEnv(`${envPrefix}RETRY_MAX_DELAY`, defaultConfig.retryConfig.maxDelayMs?.toString() || '')
      ) || defaultConfig.retryConfig.maxDelayMs,
      backoffFactor: parseNumber(
        getOptionalEnv(`${envPrefix}RETRY_BACKOFF_FACTOR`, defaultConfig.retryConfig.backoffFactor?.toString() || '')
      ) || defaultConfig.retryConfig.backoffFactor,
      useJitter: parseBoolean(
        getOptionalEnv(`${envPrefix}RETRY_USE_JITTER`, defaultConfig.retryConfig.useJitter?.toString() || '')
      ) ?? defaultConfig.retryConfig.useJitter,
      // We don't override retryableErrors from environment variables as it's complex to parse
    } : undefined,
  };
}

/**
 * Creates a PostgreSQL connection configuration for a specific journey
 * @param journeyId The journey ID (health, care, plan)
 * @returns The PostgreSQL connection configuration
 */
export function createPostgresConfig(journeyId: string): IPostgresConnectionConfig {
  const envConfig = getEnvironmentConfig();
  const journeyConfig = getJourneyDatabaseConfig(journeyId);
  
  return {
    technology: DatabaseTechnology.POSTGRESQL,
    host: getRequiredEnv('POSTGRES_HOST'),
    port: parseNumber(getRequiredEnv('POSTGRES_PORT')),
    database: journeyConfig.database || getRequiredEnv('POSTGRES_DATABASE'),
    username: getRequiredEnv('POSTGRES_USERNAME'),
    password: getRequiredEnv('POSTGRES_PASSWORD'),
    schema: journeyConfig.schema || 'public',
    journeyId,
    debug: envConfig.debug,
    connectionTimeout: journeyConfig.connectionTimeout || envConfig.defaultConnectionTimeout,
    statementTimeout: journeyConfig.statementTimeout || envConfig.defaultStatementTimeout,
    usePreparedStatements: parseBoolean(getOptionalEnv('POSTGRES_USE_PREPARED_STATEMENTS', 'true')),
    ssl: envConfig.defaultSslConfig,
    pool: {
      ...envConfig.defaultPoolConfig,
      ...(journeyConfig.poolConfig || {}),
    },
    retry: {
      ...envConfig.defaultRetryConfig,
      ...(journeyConfig.retryConfig || {}),
    },
  };
}

/**
 * Creates a TimescaleDB connection configuration for a specific journey
 * @param journeyId The journey ID (health, care, plan)
 * @returns The TimescaleDB connection configuration
 */
export function createTimescaleConfig(journeyId: string): ITimescaleConnectionConfig {
  const envConfig = getEnvironmentConfig();
  const journeyConfig = getJourneyDatabaseConfig(journeyId);
  
  return {
    technology: DatabaseTechnology.TIMESCALEDB,
    host: getRequiredEnv('TIMESCALE_HOST'),
    port: parseNumber(getRequiredEnv('TIMESCALE_PORT')),
    database: journeyConfig.database || getRequiredEnv('TIMESCALE_DATABASE'),
    username: getRequiredEnv('TIMESCALE_USERNAME'),
    password: getRequiredEnv('TIMESCALE_PASSWORD'),
    schema: journeyConfig.schema || 'public',
    journeyId,
    debug: envConfig.debug,
    connectionTimeout: journeyConfig.connectionTimeout || envConfig.defaultConnectionTimeout,
    statementTimeout: journeyConfig.statementTimeout || envConfig.defaultStatementTimeout,
    usePreparedStatements: parseBoolean(getOptionalEnv('TIMESCALE_USE_PREPARED_STATEMENTS', 'true')),
    chunkTimeInterval: parseNumber(getOptionalEnv('TIMESCALE_CHUNK_TIME_INTERVAL', '86400000')), // 1 day default
    useCompression: parseBoolean(getOptionalEnv('TIMESCALE_USE_COMPRESSION', 'true')),
    compressionInterval: parseNumber(getOptionalEnv('TIMESCALE_COMPRESSION_INTERVAL', '604800000')), // 7 days default
    ssl: envConfig.defaultSslConfig,
    pool: {
      ...envConfig.defaultPoolConfig,
      ...(journeyConfig.poolConfig || {}),
    },
    retry: {
      ...envConfig.defaultRetryConfig,
      ...(journeyConfig.retryConfig || {}),
    },
  };
}

/**
 * Creates a Redis connection configuration for a specific journey
 * @param journeyId The journey ID (health, care, plan)
 * @returns The Redis connection configuration
 */
export function createRedisConfig(journeyId: string): IRedisConnectionConfig {
  const envConfig = getEnvironmentConfig();
  const journeyConfig = getJourneyDatabaseConfig(journeyId);
  
  return {
    technology: DatabaseTechnology.REDIS,
    host: getRequiredEnv('REDIS_HOST'),
    port: parseNumber(getRequiredEnv('REDIS_PORT')),
    password: getOptionalEnv('REDIS_PASSWORD', ''),
    db: journeyConfig.redisDb !== undefined ? journeyConfig.redisDb : parseNumber(getOptionalEnv('REDIS_DB', '0')),
    journeyId,
    debug: envConfig.debug,
    connectionTimeout: journeyConfig.connectionTimeout || envConfig.defaultConnectionTimeout,
    commandTimeout: journeyConfig.commandTimeout || envConfig.defaultCommandTimeout,
    enableKeyPrefix: true,
    keyPrefix: journeyConfig.redisKeyPrefix || `${journeyId}:`,
    tls: parseBoolean(getOptionalEnv('REDIS_TLS', 'false')),
    cluster: parseBoolean(getOptionalEnv('REDIS_CLUSTER', 'false')),
    clusterNodes: parseJson(getOptionalEnv('REDIS_CLUSTER_NODES', '[]')),
    pool: {
      ...envConfig.defaultPoolConfig,
      ...(journeyConfig.poolConfig || {}),
    },
    retry: {
      ...envConfig.defaultRetryConfig,
      ...(journeyConfig.retryConfig || {}),
    },
  };
}

/**
 * Creates an S3 connection configuration for a specific journey
 * @param journeyId The journey ID (health, care, plan)
 * @returns The S3 connection configuration
 */
export function createS3Config(journeyId: string): IS3ConnectionConfig {
  const envConfig = getEnvironmentConfig();
  const journeyConfig = getJourneyDatabaseConfig(journeyId);
  
  return {
    technology: DatabaseTechnology.S3,
    host: getOptionalEnv('S3_HOST', 's3.amazonaws.com'),
    port: parseNumber(getOptionalEnv('S3_PORT', '443')),
    region: getRequiredEnv('AWS_REGION'),
    accessKeyId: getRequiredEnv('AWS_ACCESS_KEY_ID'),
    secretAccessKey: getRequiredEnv('AWS_SECRET_ACCESS_KEY'),
    bucket: journeyConfig.s3Bucket || getRequiredEnv('S3_BUCKET'),
    journeyId,
    debug: envConfig.debug,
    connectionTimeout: journeyConfig.connectionTimeout || envConfig.defaultConnectionTimeout,
    forcePathStyle: parseBoolean(getOptionalEnv('S3_FORCE_PATH_STYLE', 'false')),
    useAccelerateEndpoint: parseBoolean(getOptionalEnv('S3_USE_ACCELERATE_ENDPOINT', 'false')),
    endpoint: getOptionalEnv('S3_ENDPOINT', ''),
    acl: getOptionalEnv('S3_ACL', 'private') as 'private' | 'public-read' | 'public-read-write' | 'authenticated-read',
    sslEnabled: parseBoolean(getOptionalEnv('S3_SSL_ENABLED', 'true')),
    retry: {
      ...envConfig.defaultRetryConfig,
      ...(journeyConfig.retryConfig || {}),
    },
  };
}

/**
 * Validates a database connection configuration
 * @param config The connection configuration to validate
 * @returns True if the configuration is valid, false otherwise
 */
export function validateConnectionConfig(config: ConnectionConfig): boolean {
  // Validate common properties
  if (!config.host || !config.port) {
    return false;
  }
  
  // Validate technology-specific properties
  switch (config.technology) {
    case DatabaseTechnology.POSTGRESQL:
    case DatabaseTechnology.TIMESCALEDB:
      return !!(
        (config as IPostgresConnectionConfig).database &&
        (config as IPostgresConnectionConfig).username &&
        (config as IPostgresConnectionConfig).password
      );
    case DatabaseTechnology.REDIS:
      return true; // Redis doesn't require additional validation
    case DatabaseTechnology.S3:
      return !!(
        (config as IS3ConnectionConfig).region &&
        (config as IS3ConnectionConfig).accessKeyId &&
        (config as IS3ConnectionConfig).secretAccessKey &&
        (config as IS3ConnectionConfig).bucket
      );
    default:
      return false;
  }
}

/**
 * Creates a connection configuration for a specific journey and database technology
 * @param journeyId The journey ID (health, care, plan)
 * @param technology The database technology
 * @returns The connection configuration
 */
export function createConnectionConfig(
  journeyId: string,
  technology: DatabaseTechnology
): ConnectionConfig {
  switch (technology) {
    case DatabaseTechnology.POSTGRESQL:
      return createPostgresConfig(journeyId);
    case DatabaseTechnology.TIMESCALEDB:
      return createTimescaleConfig(journeyId);
    case DatabaseTechnology.REDIS:
      return createRedisConfig(journeyId);
    case DatabaseTechnology.S3:
      return createS3Config(journeyId);
    default:
      throw new Error(`Unsupported database technology: ${technology}`);
  }
}

/**
 * Merges multiple connection configurations, with later configs taking precedence
 * @param configs The connection configurations to merge
 * @returns The merged connection configuration
 */
export function mergeConnectionConfigs<T extends ConnectionConfig>(
  ...configs: Partial<T>[]
): T {
  if (configs.length === 0) {
    throw new Error('At least one configuration must be provided');
  }
  
  // Start with the first config as the base
  const result = { ...configs[0] } as T;
  
  // Merge in subsequent configs
  for (let i = 1; i < configs.length; i++) {
    const config = configs[i];
    
    // Merge top-level properties
    Object.assign(result, config);
    
    // Merge nested objects
    if (config.pool && result.pool) {
      result.pool = { ...result.pool, ...config.pool };
    }
    
    if (config.retry && result.retry) {
      result.retry = { ...result.retry, ...config.retry };
    }
    
    if (config.ssl && result.ssl) {
      result.ssl = { ...result.ssl, ...config.ssl };
    }
  }
  
  return result;
}

/**
 * Updates a connection configuration with new values
 * @param config The connection configuration to update
 * @param updates The updates to apply
 * @returns The updated connection configuration
 */
export function updateConnectionConfig<T extends ConnectionConfig>(
  config: T,
  updates: Partial<T>
): T {
  return mergeConnectionConfigs(config, updates);
}

/**
 * Creates a dynamic configuration provider that can be updated at runtime
 * @param initialConfig The initial connection configuration
 * @returns An object with get and update methods
 */
export function createDynamicConfigProvider<T extends ConnectionConfig>(
  initialConfig: T
) {
  let currentConfig = { ...initialConfig };
  
  return {
    /**
     * Gets the current configuration
     * @returns The current configuration
     */
    get: (): T => ({ ...currentConfig }),
    
    /**
     * Updates the current configuration
     * @param updates The updates to apply
     * @returns The updated configuration
     */
    update: (updates: Partial<T>): T => {
      currentConfig = updateConnectionConfig(currentConfig, updates);
      return { ...currentConfig };
    },
    
    /**
     * Resets the configuration to the initial values
     * @returns The reset configuration
     */
    reset: (): T => {
      currentConfig = { ...initialConfig };
      return { ...currentConfig };
    },
  };
}

/**
 * Gets the appropriate database name for a journey
 * @param journeyId The journey ID (health, care, plan)
 * @returns The database name
 */
export function getJourneyDatabaseName(journeyId: string): string {
  const journeyConfig = getJourneyDatabaseConfig(journeyId);
  return journeyConfig.database || `austa_${journeyId}`;
}

/**
 * Gets the appropriate schema name for a journey
 * @param journeyId The journey ID (health, care, plan)
 * @returns The schema name
 */
export function getJourneySchemaName(journeyId: string): string {
  const journeyConfig = getJourneyDatabaseConfig(journeyId);
  return journeyConfig.schema || journeyId;
}

/**
 * Gets the appropriate Redis database index for a journey
 * @param journeyId The journey ID (health, care, plan)
 * @returns The Redis database index
 */
export function getJourneyRedisDb(journeyId: string): number {
  const journeyConfig = getJourneyDatabaseConfig(journeyId);
  return journeyConfig.redisDb !== undefined ? journeyConfig.redisDb : 0;
}

/**
 * Gets the appropriate S3 bucket name for a journey
 * @param journeyId The journey ID (health, care, plan)
 * @returns The S3 bucket name
 */
export function getJourneyS3Bucket(journeyId: string): string {
  const journeyConfig = getJourneyDatabaseConfig(journeyId);
  return journeyConfig.s3Bucket || `austa-${journeyId}`;
}