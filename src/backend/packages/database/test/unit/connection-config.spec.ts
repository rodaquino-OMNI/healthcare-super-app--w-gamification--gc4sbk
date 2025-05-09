/**
 * @file connection-config.spec.ts
 * @description Unit tests for database connection configuration utilities
 */

import { ErrorType } from '@austa/errors';
import {
  Environment,
  getCurrentEnvironment,
  getEnvironmentConfig,
  getJourneyDatabaseConfig,
  createPostgresConfig,
  createTimescaleConfig,
  createRedisConfig,
  createS3Config,
  validateConnectionConfig,
  createConnectionConfig,
  mergeConnectionConfigs,
  updateConnectionConfig,
  createDynamicConfigProvider,
  getJourneyDatabaseName,
  getJourneySchemaName,
  getJourneyRedisDb,
  getJourneyS3Bucket,
} from '../../src/connection/connection-config';
import { DatabaseTechnology, SSLMode } from '../../src/types/connection.types';

// Mock the @austa/utils/env module
jest.mock('@austa/utils/env', () => ({
  getEnv: jest.fn(),
  getRequiredEnv: jest.fn(),
  getOptionalEnv: jest.fn(),
  parseBoolean: jest.fn((value) => value === 'true'),
  parseNumber: jest.fn((value) => Number(value)),
  parseJson: jest.fn((value) => JSON.parse(value)),
  validateUrl: jest.fn(),
  validateNumericRange: jest.fn(),
}));

// Import the mocked functions
import {
  getEnv,
  getRequiredEnv,
  getOptionalEnv,
  parseBoolean,
  parseNumber,
  parseJson,
} from '@austa/utils/env';

describe('Connection Configuration Utilities', () => {
  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    // Mock environment variables
    process.env = { ...originalEnv };
    
    // Default mock implementations
    (getOptionalEnv as jest.Mock).mockImplementation((key, defaultValue) => defaultValue);
    (getRequiredEnv as jest.Mock).mockImplementation((key) => {
      switch (key) {
        case 'POSTGRES_HOST': return 'localhost';
        case 'POSTGRES_PORT': return '5432';
        case 'POSTGRES_DATABASE': return 'austa';
        case 'POSTGRES_USERNAME': return 'postgres';
        case 'POSTGRES_PASSWORD': return 'password';
        case 'TIMESCALE_HOST': return 'localhost';
        case 'TIMESCALE_PORT': return '5432';
        case 'TIMESCALE_DATABASE': return 'austa_timescale';
        case 'TIMESCALE_USERNAME': return 'timescale';
        case 'TIMESCALE_PASSWORD': return 'password';
        case 'REDIS_HOST': return 'localhost';
        case 'REDIS_PORT': return '6379';
        case 'AWS_REGION': return 'us-east-1';
        case 'AWS_ACCESS_KEY_ID': return 'access_key';
        case 'AWS_SECRET_ACCESS_KEY': return 'secret_key';
        case 'S3_BUCKET': return 'austa-bucket';
        default: return '';
      }
    });
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('getCurrentEnvironment', () => {
    it('should return DEVELOPMENT by default', () => {
      (getOptionalEnv as jest.Mock).mockReturnValueOnce('development');
      expect(getCurrentEnvironment()).toBe(Environment.DEVELOPMENT);
    });

    it('should return TEST when NODE_ENV is test', () => {
      (getOptionalEnv as jest.Mock).mockReturnValueOnce('test');
      expect(getCurrentEnvironment()).toBe(Environment.TEST);
    });

    it('should return STAGING when NODE_ENV is staging', () => {
      (getOptionalEnv as jest.Mock).mockReturnValueOnce('staging');
      expect(getCurrentEnvironment()).toBe(Environment.STAGING);
    });

    it('should return PRODUCTION when NODE_ENV is production', () => {
      (getOptionalEnv as jest.Mock).mockReturnValueOnce('production');
      expect(getCurrentEnvironment()).toBe(Environment.PRODUCTION);
    });

    it('should handle case-insensitive environment names', () => {
      (getOptionalEnv as jest.Mock).mockReturnValueOnce('PRODUCTION');
      expect(getCurrentEnvironment()).toBe(Environment.PRODUCTION);
    });

    it('should default to DEVELOPMENT for unknown environment names', () => {
      (getOptionalEnv as jest.Mock).mockReturnValueOnce('unknown');
      expect(getCurrentEnvironment()).toBe(Environment.DEVELOPMENT);
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return development config when environment is DEVELOPMENT', () => {
      (getOptionalEnv as jest.Mock).mockReturnValueOnce('development');
      const config = getEnvironmentConfig();
      expect(config.environment).toBe(Environment.DEVELOPMENT);
      expect(config.debug).toBe(true);
      expect(config.defaultPoolConfig.min).toBe(2);
      expect(config.defaultPoolConfig.max).toBe(10);
      expect(config.defaultRetryConfig.maxRetries).toBe(3);
      expect(config.defaultSslConfig?.mode).toBe(SSLMode.PREFER);
    });

    it('should return test config when environment is TEST', () => {
      (getOptionalEnv as jest.Mock).mockReturnValueOnce('test');
      const config = getEnvironmentConfig();
      expect(config.environment).toBe(Environment.TEST);
      expect(config.debug).toBe(true);
      expect(config.defaultPoolConfig.min).toBe(1);
      expect(config.defaultPoolConfig.max).toBe(5);
      expect(config.defaultRetryConfig.maxRetries).toBe(2);
      expect(config.defaultSslConfig?.mode).toBe(SSLMode.PREFER);
    });

    it('should return staging config when environment is STAGING', () => {
      (getOptionalEnv as jest.Mock).mockReturnValueOnce('staging');
      const config = getEnvironmentConfig();
      expect(config.environment).toBe(Environment.STAGING);
      expect(config.debug).toBe(false);
      expect(config.defaultPoolConfig.min).toBe(5);
      expect(config.defaultPoolConfig.max).toBe(20);
      expect(config.defaultRetryConfig.maxRetries).toBe(5);
      expect(config.defaultSslConfig?.mode).toBe(SSLMode.REQUIRE);
    });

    it('should return production config when environment is PRODUCTION', () => {
      (getOptionalEnv as jest.Mock).mockReturnValueOnce('production');
      const config = getEnvironmentConfig();
      expect(config.environment).toBe(Environment.PRODUCTION);
      expect(config.debug).toBe(false);
      expect(config.defaultPoolConfig.min).toBe(10);
      expect(config.defaultPoolConfig.max).toBe(50);
      expect(config.defaultRetryConfig.maxRetries).toBe(7);
      expect(config.defaultSslConfig?.mode).toBe(SSLMode.VERIFY_FULL);
    });

    it('should override config values with environment variables', () => {
      (getOptionalEnv as jest.Mock).mockImplementation((key, defaultValue) => {
        switch (key) {
          case 'NODE_ENV': return 'development';
          case 'DB_DEBUG': return 'false';
          case 'DB_CONNECTION_TIMEOUT': return '10000';
          case 'DB_POOL_MIN': return '5';
          case 'DB_POOL_MAX': return '20';
          case 'DB_RETRY_MAX': return '10';
          default: return defaultValue;
        }
      });

      const config = getEnvironmentConfig();
      expect(config.environment).toBe(Environment.DEVELOPMENT);
      expect(config.debug).toBe(false); // Overridden
      expect(config.defaultConnectionTimeout).toBe(10000); // Overridden
      expect(config.defaultPoolConfig.min).toBe(5); // Overridden
      expect(config.defaultPoolConfig.max).toBe(20); // Overridden
      expect(config.defaultRetryConfig.maxRetries).toBe(10); // Overridden
    });
  });

  describe('getJourneyDatabaseConfig', () => {
    it('should return default config for known journey', () => {
      const config = getJourneyDatabaseConfig('health');
      expect(config.journeyId).toBe('health');
      expect(config.schema).toBe('health');
      expect(config.database).toBe('austa_health');
      expect(config.redisDb).toBe(1);
      expect(config.redisKeyPrefix).toBe('health:');
      expect(config.s3Bucket).toBe('austa-health');
    });

    it('should create default config for unknown journey', () => {
      const config = getJourneyDatabaseConfig('custom');
      expect(config.journeyId).toBe('custom');
      expect(config.schema).toBe('custom');
      expect(config.database).toBe('austa_custom');
      expect(config.redisDb).toBe(0);
      expect(config.redisKeyPrefix).toBe('custom:');
      expect(config.s3Bucket).toBe('austa-custom');
    });

    it('should override config values with journey-specific environment variables', () => {
      (getOptionalEnv as jest.Mock).mockImplementation((key, defaultValue) => {
        switch (key) {
          case 'DB_HEALTH_SCHEMA': return 'custom_health_schema';
          case 'DB_HEALTH_DATABASE': return 'custom_health_db';
          case 'DB_HEALTH_REDIS_DB': return '5';
          case 'DB_HEALTH_REDIS_KEY_PREFIX': return 'custom_health:';
          case 'DB_HEALTH_S3_BUCKET': return 'custom-health-bucket';
          case 'DB_HEALTH_CONNECTION_TIMEOUT': return '15000';
          case 'DB_HEALTH_POOL_MIN': return '10';
          default: return defaultValue;
        }
      });

      const config = getJourneyDatabaseConfig('health');
      expect(config.journeyId).toBe('health');
      expect(config.schema).toBe('custom_health_schema'); // Overridden
      expect(config.database).toBe('custom_health_db'); // Overridden
      expect(config.redisDb).toBe(5); // Overridden
      expect(config.redisKeyPrefix).toBe('custom_health:'); // Overridden
      expect(config.s3Bucket).toBe('custom-health-bucket'); // Overridden
      expect(config.connectionTimeout).toBe(15000); // Overridden
      expect(config.poolConfig?.min).toBe(10); // Overridden
    });

    it('should preserve journey-specific optimizations', () => {
      const healthConfig = getJourneyDatabaseConfig('health');
      expect(healthConfig.statementTimeout).toBe(180000); // Health journey has longer statement timeout

      const careConfig = getJourneyDatabaseConfig('care');
      expect(careConfig.connectionTimeout).toBe(3000); // Care journey has shorter connection timeout
      expect(careConfig.retryConfig?.maxRetries).toBe(3); // Care journey has fewer retries

      const planConfig = getJourneyDatabaseConfig('plan');
      expect(planConfig.poolConfig?.validateOnBorrow).toBe(true); // Plan journey always validates connections
      expect(planConfig.retryConfig?.maxRetries).toBe(5); // Plan journey has more retries
    });
  });

  describe('createPostgresConfig', () => {
    it('should create a valid PostgreSQL configuration', () => {
      // Mock environment-specific config
      (getOptionalEnv as jest.Mock).mockReturnValueOnce('development');

      const config = createPostgresConfig('health');
      expect(config.technology).toBe(DatabaseTechnology.POSTGRESQL);
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
      expect(config.database).toBe('austa_health');
      expect(config.username).toBe('postgres');
      expect(config.password).toBe('password');
      expect(config.schema).toBe('health');
      expect(config.journeyId).toBe('health');
      expect(config.debug).toBe(true);
      expect(config.connectionTimeout).toBe(5000);
      expect(config.statementTimeout).toBe(180000); // Health journey override
      expect(config.usePreparedStatements).toBe(true);
      expect(config.ssl?.mode).toBe(SSLMode.PREFER);
      expect(config.pool?.min).toBe(5); // Health journey override
      expect(config.pool?.max).toBe(10);
      expect(config.retry?.maxRetries).toBe(3);
    });

    it('should use environment variables for connection details', () => {
      // Mock required environment variables
      (getRequiredEnv as jest.Mock).mockImplementation((key) => {
        switch (key) {
          case 'POSTGRES_HOST': return 'custom-host';
          case 'POSTGRES_PORT': return '5433';
          case 'POSTGRES_DATABASE': return 'custom-db';
          case 'POSTGRES_USERNAME': return 'custom-user';
          case 'POSTGRES_PASSWORD': return 'custom-password';
          default: return '';
        }
      });

      const config = createPostgresConfig('custom');
      expect(config.host).toBe('custom-host');
      expect(config.port).toBe(5433);
      expect(config.database).toBe('austa_custom'); // Journey override takes precedence
      expect(config.username).toBe('custom-user');
      expect(config.password).toBe('custom-password');
    });
  });

  describe('createTimescaleConfig', () => {
    it('should create a valid TimescaleDB configuration', () => {
      // Mock environment-specific config
      (getOptionalEnv as jest.Mock).mockReturnValueOnce('development');

      const config = createTimescaleConfig('health');
      expect(config.technology).toBe(DatabaseTechnology.TIMESCALEDB);
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
      expect(config.database).toBe('austa_health');
      expect(config.username).toBe('timescale');
      expect(config.password).toBe('password');
      expect(config.schema).toBe('health');
      expect(config.journeyId).toBe('health');
      expect(config.debug).toBe(true);
      expect(config.connectionTimeout).toBe(5000);
      expect(config.statementTimeout).toBe(180000); // Health journey override
      expect(config.usePreparedStatements).toBe(true);
      expect(config.chunkTimeInterval).toBe(86400000); // 1 day default
      expect(config.useCompression).toBe(true);
      expect(config.compressionInterval).toBe(604800000); // 7 days default
      expect(config.ssl?.mode).toBe(SSLMode.PREFER);
      expect(config.pool?.min).toBe(5); // Health journey override
      expect(config.pool?.max).toBe(10);
      expect(config.retry?.maxRetries).toBe(3);
    });

    it('should use environment variables for TimescaleDB-specific settings', () => {
      // Mock optional environment variables
      (getOptionalEnv as jest.Mock).mockImplementation((key, defaultValue) => {
        switch (key) {
          case 'NODE_ENV': return 'development';
          case 'TIMESCALE_USE_PREPARED_STATEMENTS': return 'false';
          case 'TIMESCALE_CHUNK_TIME_INTERVAL': return '43200000'; // 12 hours
          case 'TIMESCALE_USE_COMPRESSION': return 'false';
          case 'TIMESCALE_COMPRESSION_INTERVAL': return '259200000'; // 3 days
          default: return defaultValue;
        }
      });

      const config = createTimescaleConfig('custom');
      expect(config.usePreparedStatements).toBe(false);
      expect(config.chunkTimeInterval).toBe(43200000);
      expect(config.useCompression).toBe(false);
      expect(config.compressionInterval).toBe(259200000);
    });
  });

  describe('createRedisConfig', () => {
    it('should create a valid Redis configuration', () => {
      // Mock environment-specific config
      (getOptionalEnv as jest.Mock).mockReturnValueOnce('development');

      const config = createRedisConfig('health');
      expect(config.technology).toBe(DatabaseTechnology.REDIS);
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(6379);
      expect(config.password).toBe('');
      expect(config.db).toBe(1); // Health journey override
      expect(config.journeyId).toBe('health');
      expect(config.debug).toBe(true);
      expect(config.connectionTimeout).toBe(5000);
      expect(config.commandTimeout).toBe(5000);
      expect(config.enableKeyPrefix).toBe(true);
      expect(config.keyPrefix).toBe('health:');
      expect(config.tls).toBe(false);
      expect(config.cluster).toBe(false);
      expect(config.clusterNodes).toEqual([]);
      expect(config.pool?.min).toBe(5); // Health journey override
      expect(config.pool?.max).toBe(10);
      expect(config.retry?.maxRetries).toBe(3);
    });

    it('should use environment variables for Redis-specific settings', () => {
      // Mock optional environment variables
      (getOptionalEnv as jest.Mock).mockImplementation((key, defaultValue) => {
        switch (key) {
          case 'NODE_ENV': return 'development';
          case 'REDIS_PASSWORD': return 'redis-password';
          case 'REDIS_DB': return '5';
          case 'REDIS_TLS': return 'true';
          case 'REDIS_CLUSTER': return 'true';
          case 'REDIS_CLUSTER_NODES': return JSON.stringify([{ host: 'redis-1', port: 6379 }, { host: 'redis-2', port: 6379 }]);
          default: return defaultValue;
        }
      });

      const config = createRedisConfig('custom');
      expect(config.password).toBe('redis-password');
      expect(config.db).toBe(0); // Journey override takes precedence
      expect(config.tls).toBe(true);
      expect(config.cluster).toBe(true);
      expect(config.clusterNodes).toEqual([{ host: 'redis-1', port: 6379 }, { host: 'redis-2', port: 6379 }]);
    });
  });

  describe('createS3Config', () => {
    it('should create a valid S3 configuration', () => {
      // Mock environment-specific config
      (getOptionalEnv as jest.Mock).mockReturnValueOnce('development');

      const config = createS3Config('health');
      expect(config.technology).toBe(DatabaseTechnology.S3);
      expect(config.host).toBe('s3.amazonaws.com');
      expect(config.port).toBe(443);
      expect(config.region).toBe('us-east-1');
      expect(config.accessKeyId).toBe('access_key');
      expect(config.secretAccessKey).toBe('secret_key');
      expect(config.bucket).toBe('austa-health'); // Health journey override
      expect(config.journeyId).toBe('health');
      expect(config.debug).toBe(true);
      expect(config.connectionTimeout).toBe(5000);
      expect(config.forcePathStyle).toBe(false);
      expect(config.useAccelerateEndpoint).toBe(false);
      expect(config.endpoint).toBe('');
      expect(config.acl).toBe('private');
      expect(config.sslEnabled).toBe(true);
      expect(config.retry?.maxRetries).toBe(3);
    });

    it('should use environment variables for S3-specific settings', () => {
      // Mock optional environment variables
      (getOptionalEnv as jest.Mock).mockImplementation((key, defaultValue) => {
        switch (key) {
          case 'NODE_ENV': return 'development';
          case 'S3_HOST': return 'custom-s3.example.com';
          case 'S3_PORT': return '8000';
          case 'S3_FORCE_PATH_STYLE': return 'true';
          case 'S3_USE_ACCELERATE_ENDPOINT': return 'true';
          case 'S3_ENDPOINT': return 'https://custom-s3.example.com';
          case 'S3_ACL': return 'public-read';
          case 'S3_SSL_ENABLED': return 'false';
          default: return defaultValue;
        }
      });

      const config = createS3Config('custom');
      expect(config.host).toBe('custom-s3.example.com');
      expect(config.port).toBe(8000);
      expect(config.forcePathStyle).toBe(true);
      expect(config.useAccelerateEndpoint).toBe(true);
      expect(config.endpoint).toBe('https://custom-s3.example.com');
      expect(config.acl).toBe('public-read');
      expect(config.sslEnabled).toBe(false);
    });
  });

  describe('validateConnectionConfig', () => {
    it('should validate a valid PostgreSQL configuration', () => {
      const config = {
        technology: DatabaseTechnology.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'austa',
        username: 'postgres',
        password: 'password',
      };

      expect(validateConnectionConfig(config)).toBe(true);
    });

    it('should validate a valid TimescaleDB configuration', () => {
      const config = {
        technology: DatabaseTechnology.TIMESCALEDB,
        host: 'localhost',
        port: 5432,
        database: 'austa',
        username: 'timescale',
        password: 'password',
      };

      expect(validateConnectionConfig(config)).toBe(true);
    });

    it('should validate a valid Redis configuration', () => {
      const config = {
        technology: DatabaseTechnology.REDIS,
        host: 'localhost',
        port: 6379,
      };

      expect(validateConnectionConfig(config)).toBe(true);
    });

    it('should validate a valid S3 configuration', () => {
      const config = {
        technology: DatabaseTechnology.S3,
        host: 's3.amazonaws.com',
        port: 443,
        region: 'us-east-1',
        accessKeyId: 'access_key',
        secretAccessKey: 'secret_key',
        bucket: 'austa-bucket',
      };

      expect(validateConnectionConfig(config)).toBe(true);
    });

    it('should invalidate a PostgreSQL configuration without required fields', () => {
      const config = {
        technology: DatabaseTechnology.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        // Missing database, username, password
      };

      expect(validateConnectionConfig(config)).toBe(false);
    });

    it('should invalidate an S3 configuration without required fields', () => {
      const config = {
        technology: DatabaseTechnology.S3,
        host: 's3.amazonaws.com',
        port: 443,
        // Missing region, accessKeyId, secretAccessKey, bucket
      };

      expect(validateConnectionConfig(config)).toBe(false);
    });

    it('should invalidate a configuration without host or port', () => {
      const config = {
        technology: DatabaseTechnology.POSTGRESQL,
        // Missing host and port
        database: 'austa',
        username: 'postgres',
        password: 'password',
      };

      expect(validateConnectionConfig(config)).toBe(false);
    });

    it('should invalidate a configuration with unsupported technology', () => {
      const config = {
        technology: 'unsupported' as DatabaseTechnology,
        host: 'localhost',
        port: 5432,
      };

      expect(validateConnectionConfig(config)).toBe(false);
    });
  });

  describe('createConnectionConfig', () => {
    it('should create a PostgreSQL configuration', () => {
      const config = createConnectionConfig('health', DatabaseTechnology.POSTGRESQL);
      expect(config.technology).toBe(DatabaseTechnology.POSTGRESQL);
    });

    it('should create a TimescaleDB configuration', () => {
      const config = createConnectionConfig('health', DatabaseTechnology.TIMESCALEDB);
      expect(config.technology).toBe(DatabaseTechnology.TIMESCALEDB);
    });

    it('should create a Redis configuration', () => {
      const config = createConnectionConfig('health', DatabaseTechnology.REDIS);
      expect(config.technology).toBe(DatabaseTechnology.REDIS);
    });

    it('should create an S3 configuration', () => {
      const config = createConnectionConfig('health', DatabaseTechnology.S3);
      expect(config.technology).toBe(DatabaseTechnology.S3);
    });

    it('should throw an error for unsupported technology', () => {
      expect(() => {
        createConnectionConfig('health', 'unsupported' as DatabaseTechnology);
      }).toThrow('Unsupported database technology: unsupported');
    });
  });

  describe('mergeConnectionConfigs', () => {
    it('should merge two configurations', () => {
      const baseConfig = {
        technology: DatabaseTechnology.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'austa',
        username: 'postgres',
        password: 'password',
        debug: false,
        pool: {
          min: 2,
          max: 10,
        },
        retry: {
          maxRetries: 3,
          initialDelayMs: 100,
          maxDelayMs: 5000,
          backoffFactor: 2,
          useJitter: true,
          retryableErrors: [ErrorType.TRANSIENT],
        },
      };

      const overrideConfig = {
        host: 'new-host',
        debug: true,
        pool: {
          min: 5,
        },
        retry: {
          maxRetries: 5,
          retryableErrors: [ErrorType.TRANSIENT, ErrorType.CONNECTION],
        },
      };

      const mergedConfig = mergeConnectionConfigs(baseConfig, overrideConfig);

      // Check that properties are correctly merged
      expect(mergedConfig.host).toBe('new-host'); // Overridden
      expect(mergedConfig.port).toBe(5432); // Preserved from base
      expect(mergedConfig.database).toBe('austa'); // Preserved from base
      expect(mergedConfig.username).toBe('postgres'); // Preserved from base
      expect(mergedConfig.password).toBe('password'); // Preserved from base
      expect(mergedConfig.debug).toBe(true); // Overridden

      // Check that nested objects are correctly merged
      expect(mergedConfig.pool?.min).toBe(5); // Overridden
      expect(mergedConfig.pool?.max).toBe(10); // Preserved from base

      expect(mergedConfig.retry?.maxRetries).toBe(5); // Overridden
      expect(mergedConfig.retry?.initialDelayMs).toBe(100); // Preserved from base
      expect(mergedConfig.retry?.maxDelayMs).toBe(5000); // Preserved from base
      expect(mergedConfig.retry?.backoffFactor).toBe(2); // Preserved from base
      expect(mergedConfig.retry?.useJitter).toBe(true); // Preserved from base
      expect(mergedConfig.retry?.retryableErrors).toEqual([ErrorType.TRANSIENT, ErrorType.CONNECTION]); // Overridden
    });

    it('should merge multiple configurations in order', () => {
      const baseConfig = {
        technology: DatabaseTechnology.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'austa',
        username: 'postgres',
        password: 'password',
        debug: false,
      };

      const override1 = {
        host: 'override1-host',
        debug: true,
      };

      const override2 = {
        host: 'override2-host',
        port: 5433,
      };

      const mergedConfig = mergeConnectionConfigs(baseConfig, override1, override2);

      // Later configs should take precedence
      expect(mergedConfig.host).toBe('override2-host');
      expect(mergedConfig.port).toBe(5433);
      expect(mergedConfig.debug).toBe(true);
      expect(mergedConfig.database).toBe('austa');
      expect(mergedConfig.username).toBe('postgres');
      expect(mergedConfig.password).toBe('password');
    });

    it('should throw an error when no configurations are provided', () => {
      expect(() => {
        mergeConnectionConfigs();
      }).toThrow('At least one configuration must be provided');
    });
  });

  describe('updateConnectionConfig', () => {
    it('should update a configuration with new values', () => {
      const baseConfig = {
        technology: DatabaseTechnology.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'austa',
        username: 'postgres',
        password: 'password',
        debug: false,
        pool: {
          min: 2,
          max: 10,
        },
      };

      const updates = {
        host: 'new-host',
        debug: true,
        pool: {
          min: 5,
        },
      };

      const updatedConfig = updateConnectionConfig(baseConfig, updates);

      // Check that properties are correctly updated
      expect(updatedConfig.host).toBe('new-host');
      expect(updatedConfig.debug).toBe(true);
      expect(updatedConfig.pool?.min).toBe(5);
      expect(updatedConfig.pool?.max).toBe(10); // Preserved from base

      // Check that other properties are preserved
      expect(updatedConfig.port).toBe(5432);
      expect(updatedConfig.database).toBe('austa');
      expect(updatedConfig.username).toBe('postgres');
      expect(updatedConfig.password).toBe('password');
    });
  });

  describe('createDynamicConfigProvider', () => {
    it('should create a provider with get, update, and reset methods', () => {
      const initialConfig = {
        technology: DatabaseTechnology.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'austa',
        username: 'postgres',
        password: 'password',
        debug: false,
      };

      const provider = createDynamicConfigProvider(initialConfig);

      // Check that the provider has the expected methods
      expect(provider).toHaveProperty('get');
      expect(provider).toHaveProperty('update');
      expect(provider).toHaveProperty('reset');

      // Check that get returns a copy of the initial config
      const config = provider.get();
      expect(config).toEqual(initialConfig);
      expect(config).not.toBe(initialConfig); // Should be a different object

      // Check that update returns an updated config
      const updatedConfig = provider.update({ host: 'new-host', debug: true });
      expect(updatedConfig.host).toBe('new-host');
      expect(updatedConfig.debug).toBe(true);

      // Check that get returns the updated config
      const newConfig = provider.get();
      expect(newConfig.host).toBe('new-host');
      expect(newConfig.debug).toBe(true);

      // Check that reset returns the initial config
      const resetConfig = provider.reset();
      expect(resetConfig).toEqual(initialConfig);

      // Check that get returns the reset config
      const finalConfig = provider.get();
      expect(finalConfig).toEqual(initialConfig);
    });

    it('should not modify the original config when updating', () => {
      const initialConfig = {
        technology: DatabaseTechnology.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'austa',
        username: 'postgres',
        password: 'password',
        debug: false,
      };

      const provider = createDynamicConfigProvider(initialConfig);

      // Update the config
      provider.update({ host: 'new-host', debug: true });

      // Check that the initial config is not modified
      expect(initialConfig.host).toBe('localhost');
      expect(initialConfig.debug).toBe(false);
    });
  });

  describe('Journey-specific utility functions', () => {
    describe('getJourneyDatabaseName', () => {
      it('should return the correct database name for known journeys', () => {
        expect(getJourneyDatabaseName('health')).toBe('austa_health');
        expect(getJourneyDatabaseName('care')).toBe('austa_care');
        expect(getJourneyDatabaseName('plan')).toBe('austa_plan');
      });

      it('should generate a database name for unknown journeys', () => {
        expect(getJourneyDatabaseName('custom')).toBe('austa_custom');
      });

      it('should use environment variables if provided', () => {
        (getOptionalEnv as jest.Mock).mockImplementation((key, defaultValue) => {
          if (key === 'DB_HEALTH_DATABASE') {
            return 'custom_health_db';
          }
          return defaultValue;
        });

        expect(getJourneyDatabaseName('health')).toBe('custom_health_db');
      });
    });

    describe('getJourneySchemaName', () => {
      it('should return the correct schema name for known journeys', () => {
        expect(getJourneySchemaName('health')).toBe('health');
        expect(getJourneySchemaName('care')).toBe('care');
        expect(getJourneySchemaName('plan')).toBe('plan');
      });

      it('should use the journey ID as the schema name for unknown journeys', () => {
        expect(getJourneySchemaName('custom')).toBe('custom');
      });

      it('should use environment variables if provided', () => {
        (getOptionalEnv as jest.Mock).mockImplementation((key, defaultValue) => {
          if (key === 'DB_HEALTH_SCHEMA') {
            return 'custom_health_schema';
          }
          return defaultValue;
        });

        expect(getJourneySchemaName('health')).toBe('custom_health_schema');
      });
    });

    describe('getJourneyRedisDb', () => {
      it('should return the correct Redis DB index for known journeys', () => {
        expect(getJourneyRedisDb('health')).toBe(1);
        expect(getJourneyRedisDb('care')).toBe(2);
        expect(getJourneyRedisDb('plan')).toBe(3);
      });

      it('should return 0 for unknown journeys', () => {
        expect(getJourneyRedisDb('custom')).toBe(0);
      });

      it('should use environment variables if provided', () => {
        (getOptionalEnv as jest.Mock).mockImplementation((key, defaultValue) => {
          if (key === 'DB_HEALTH_REDIS_DB') {
            return '5';
          }
          return defaultValue;
        });

        expect(getJourneyRedisDb('health')).toBe(5);
      });
    });

    describe('getJourneyS3Bucket', () => {
      it('should return the correct S3 bucket name for known journeys', () => {
        expect(getJourneyS3Bucket('health')).toBe('austa-health');
        expect(getJourneyS3Bucket('care')).toBe('austa-care');
        expect(getJourneyS3Bucket('plan')).toBe('austa-plan');
      });

      it('should generate a bucket name for unknown journeys', () => {
        expect(getJourneyS3Bucket('custom')).toBe('austa-custom');
      });

      it('should use environment variables if provided', () => {
        (getOptionalEnv as jest.Mock).mockImplementation((key, defaultValue) => {
          if (key === 'DB_HEALTH_S3_BUCKET') {
            return 'custom-health-bucket';
          }
          return defaultValue;
        });

        expect(getJourneyS3Bucket('health')).toBe('custom-health-bucket');
      });
    });
  });
});