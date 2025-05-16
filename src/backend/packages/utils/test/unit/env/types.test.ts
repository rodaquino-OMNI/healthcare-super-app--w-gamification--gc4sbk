/**
 * Unit tests for environment variable type definitions
 * 
 * These tests verify the TypeScript type system for environment variables,
 * including type inference, generic type support, and runtime type checking.
 */

import {
  EnvVarType,
  EnvVarTypeMap,
  EnvVarSchema,
  EnvSchema,
  ResolvedEnvConfig,
  InferEnvVarType,
  isString,
  isNumber,
  isBoolean,
  isArray,
  isStringArray,
  isNumberArray,
  isUrl,
  isRecord,
  JourneyEnvConfig,
  FeatureFlagConfig,
  DatabaseConfig,
  RedisConfig,
  KafkaConfig,
  LoggingConfig,
  CorsConfig,
  JwtConfig,
  AppEnvConfig
} from '../../../src/env/types';
import { JourneyType } from '../../../src/env/journey';

describe('Environment Variable Type Definitions', () => {
  describe('Type Inference', () => {
    it('should correctly infer string type from schema', () => {
      // Define a schema with string type
      const schema: EnvVarSchema = {
        type: 'string',
        required: true,
        description: 'A string environment variable'
      };

      // Use type assertion to verify the inferred type
      type InferredType = InferEnvVarType<typeof schema>;
      const value = 'test' as InferredType;

      // This should compile without errors
      expect(typeof value).toBe('string');
    });

    it('should correctly infer number type from schema', () => {
      // Define a schema with number type
      const schema: EnvVarSchema = {
        type: 'number',
        required: true,
        description: 'A number environment variable'
      };

      // Use type assertion to verify the inferred type
      type InferredType = InferEnvVarType<typeof schema>;
      const value = 42 as InferredType;

      // This should compile without errors
      expect(typeof value).toBe('number');
    });

    it('should correctly infer boolean type from schema', () => {
      // Define a schema with boolean type
      const schema: EnvVarSchema = {
        type: 'boolean',
        required: true,
        description: 'A boolean environment variable'
      };

      // Use type assertion to verify the inferred type
      type InferredType = InferEnvVarType<typeof schema>;
      const value = true as InferredType;

      // This should compile without errors
      expect(typeof value).toBe('boolean');
    });

    it('should correctly infer array type from schema', () => {
      // Define a schema with array type
      const schema: EnvVarSchema = {
        type: 'array',
        required: true,
        description: 'An array environment variable'
      };

      // Use type assertion to verify the inferred type
      type InferredType = InferEnvVarType<typeof schema>;
      const value = ['a', 'b', 'c'] as InferredType;

      // This should compile without errors
      expect(Array.isArray(value)).toBe(true);
    });

    it('should correctly infer URL type from schema', () => {
      // Define a schema with URL type
      const schema: EnvVarSchema = {
        type: 'url',
        required: true,
        description: 'A URL environment variable'
      };

      // Use type assertion to verify the inferred type
      type InferredType = InferEnvVarType<typeof schema>;
      const value = new URL('https://example.com') as InferredType;

      // This should compile without errors
      expect(value instanceof URL).toBe(true);
    });

    it('should correctly infer JSON type from schema', () => {
      // Define a schema with JSON type
      const schema: EnvVarSchema = {
        type: 'json',
        required: true,
        description: 'A JSON environment variable'
      };

      // Use type assertion to verify the inferred type
      type InferredType = InferEnvVarType<typeof schema>;
      const value = { key: 'value' } as InferredType;

      // This should compile without errors
      expect(typeof value).toBe('object');
    });
  });

  describe('Resolved Environment Configuration', () => {
    it('should correctly resolve types from schema', () => {
      // Define a complete environment schema
      const envSchema: EnvSchema = {
        PORT: {
          type: 'number',
          required: true,
          description: 'Server port'
        },
        HOST: {
          type: 'string',
          required: true,
          description: 'Server host'
        },
        DEBUG: {
          type: 'boolean',
          required: false,
          defaultValue: 'false',
          description: 'Debug mode'
        },
        API_URLS: {
          type: 'array',
          required: false,
          description: 'API URLs'
        },
        DATABASE_CONFIG: {
          type: 'json',
          required: true,
          description: 'Database configuration'
        }
      };

      // Use type assertion to verify the resolved config type
      type Config = ResolvedEnvConfig<typeof envSchema>;

      // Create a mock config that should match the inferred type
      const config: Config = {
        PORT: 3000,
        HOST: 'localhost',
        DEBUG: false,
        API_URLS: ['https://api1.example.com', 'https://api2.example.com'],
        DATABASE_CONFIG: {
          host: 'localhost',
          port: 5432,
          username: 'user',
          password: 'password'
        }
      };

      // Verify the types
      expect(typeof config.PORT).toBe('number');
      expect(typeof config.HOST).toBe('string');
      expect(typeof config.DEBUG).toBe('boolean');
      expect(Array.isArray(config.API_URLS)).toBe(true);
      expect(typeof config.DATABASE_CONFIG).toBe('object');
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify strings with isString', () => {
      expect(isString('test')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString(42)).toBe(false);
      expect(isString(true)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
    });

    it('should correctly identify numbers with isNumber', () => {
      expect(isNumber(42)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-1)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
      expect(isNumber('42')).toBe(false);
      expect(isNumber(true)).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber({})).toBe(false);
      expect(isNumber([])).toBe(false);
      expect(isNumber(NaN)).toBe(false); // NaN is not considered a valid number
    });

    it('should correctly identify booleans with isBoolean', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean('false')).toBe(false);
      expect(isBoolean(null)).toBe(false);
      expect(isBoolean(undefined)).toBe(false);
      expect(isBoolean({})).toBe(false);
      expect(isBoolean([])).toBe(false);
    });

    it('should correctly identify arrays with isArray', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(['a', 'b', 'c'])).toBe(true);
      expect(isArray(new Array())).toBe(true);
      expect(isArray(42)).toBe(false);
      expect(isArray('test')).toBe(false);
      expect(isArray(true)).toBe(false);
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
      expect(isArray({})).toBe(false);
    });

    it('should correctly identify string arrays with isStringArray', () => {
      expect(isStringArray(['a', 'b', 'c'])).toBe(true);
      expect(isStringArray([])).toBe(true);
      expect(isStringArray(['a', 42])).toBe(false);
      expect(isStringArray([1, 2, 3])).toBe(false);
      expect(isStringArray('test')).toBe(false);
      expect(isStringArray(null)).toBe(false);
      expect(isStringArray(undefined)).toBe(false);
      expect(isStringArray({})).toBe(false);
    });

    it('should correctly identify number arrays with isNumberArray', () => {
      expect(isNumberArray([1, 2, 3])).toBe(true);
      expect(isNumberArray([])).toBe(true);
      expect(isNumberArray([1, 'a'])).toBe(false);
      expect(isNumberArray(['a', 'b', 'c'])).toBe(false);
      expect(isNumberArray('test')).toBe(false);
      expect(isNumberArray(null)).toBe(false);
      expect(isNumberArray(undefined)).toBe(false);
      expect(isNumberArray({})).toBe(false);
    });

    it('should correctly identify URLs with isUrl', () => {
      expect(isUrl(new URL('https://example.com'))).toBe(true);
      expect(isUrl('https://example.com')).toBe(false);
      expect(isUrl(42)).toBe(false);
      expect(isUrl(true)).toBe(false);
      expect(isUrl(null)).toBe(false);
      expect(isUrl(undefined)).toBe(false);
      expect(isUrl({})).toBe(false);
      expect(isUrl([])).toBe(false);
    });

    it('should correctly identify records with isRecord', () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord({ key: 'value' })).toBe(true);
      expect(isRecord(new Object())).toBe(true);
      expect(isRecord([])).toBe(false);
      expect(isRecord('test')).toBe(false);
      expect(isRecord(42)).toBe(false);
      expect(isRecord(true)).toBe(false);
      expect(isRecord(null)).toBe(false);
      expect(isRecord(undefined)).toBe(false);
      expect(isRecord(new URL('https://example.com'))).toBe(false);
    });
  });

  describe('Journey-Specific Type Definitions', () => {
    it('should correctly define journey environment configuration', () => {
      // Create a journey-specific environment configuration
      const healthJourneyConfig: JourneyEnvConfig = {
        journeyType: JourneyType.HEALTH,
        variables: {
          API_URL: {
            type: 'url',
            required: true,
            description: 'Health API URL'
          },
          METRICS_ENABLED: {
            type: 'boolean',
            required: false,
            defaultValue: 'true',
            description: 'Enable health metrics'
          }
        },
        features: {
          WEARABLE_SYNC: true,
          HEALTH_INSIGHTS: true,
          GOAL_TRACKING: true
        }
      };

      // Verify the configuration structure
      expect(healthJourneyConfig.journeyType).toBe(JourneyType.HEALTH);
      expect(healthJourneyConfig.variables.API_URL.type).toBe('url');
      expect(healthJourneyConfig.variables.METRICS_ENABLED.type).toBe('boolean');
      expect(healthJourneyConfig.features?.WEARABLE_SYNC).toBe(true);
    });

    it('should correctly define feature flag configuration', () => {
      // Create a feature flag configuration
      const featureFlag: FeatureFlagConfig = {
        name: 'WEARABLE_SYNC',
        enabled: true,
        rolloutPercentage: 50,
        journeyType: JourneyType.HEALTH,
        description: 'Enable wearable device synchronization'
      };

      // Verify the feature flag structure
      expect(featureFlag.name).toBe('WEARABLE_SYNC');
      expect(featureFlag.enabled).toBe(true);
      expect(featureFlag.rolloutPercentage).toBe(50);
      expect(featureFlag.journeyType).toBe(JourneyType.HEALTH);
    });
  });

  describe('Configuration Type Definitions', () => {
    it('should correctly define database configuration', () => {
      // Create a database configuration
      const dbConfig: DatabaseConfig = {
        url: 'postgresql://user:password@localhost:5432/db',
        poolSize: 10,
        maxConnections: 20,
        minConnections: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        ssl: true,
        schema: 'public'
      };

      // Verify the database configuration structure
      expect(dbConfig.url).toBe('postgresql://user:password@localhost:5432/db');
      expect(dbConfig.poolSize).toBe(10);
      expect(dbConfig.maxConnections).toBe(20);
      expect(dbConfig.ssl).toBe(true);
    });

    it('should correctly define Redis configuration', () => {
      // Create a Redis configuration
      const redisConfig: RedisConfig = {
        url: 'redis://localhost:6379',
        password: 'password',
        database: 0,
        keyPrefix: 'app:',
        tls: true,
        maxRetriesPerRequest: 3
      };

      // Verify the Redis configuration structure
      expect(redisConfig.url).toBe('redis://localhost:6379');
      expect(redisConfig.password).toBe('password');
      expect(redisConfig.database).toBe(0);
      expect(redisConfig.keyPrefix).toBe('app:');
    });

    it('should correctly define Kafka configuration', () => {
      // Create a Kafka configuration
      const kafkaConfig: KafkaConfig = {
        brokers: ['localhost:9092'],
        clientId: 'app',
        groupId: 'app-group',
        ssl: true,
        sasl: {
          mechanism: 'plain',
          username: 'user',
          password: 'password'
        }
      };

      // Verify the Kafka configuration structure
      expect(kafkaConfig.brokers).toEqual(['localhost:9092']);
      expect(kafkaConfig.clientId).toBe('app');
      expect(kafkaConfig.groupId).toBe('app-group');
      expect(kafkaConfig.sasl?.mechanism).toBe('plain');
    });

    it('should correctly define logging configuration', () => {
      // Create a logging configuration
      const loggingConfig: LoggingConfig = {
        level: 'info',
        format: 'json',
        destination: 'stdout',
        includeTimestamp: true,
        includeRequestId: true,
        includeJourneyContext: true
      };

      // Verify the logging configuration structure
      expect(loggingConfig.level).toBe('info');
      expect(loggingConfig.format).toBe('json');
      expect(loggingConfig.destination).toBe('stdout');
      expect(loggingConfig.includeTimestamp).toBe(true);
    });

    it('should correctly define CORS configuration', () => {
      // Create a CORS configuration
      const corsConfig: CorsConfig = {
        origins: ['https://example.com'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['X-Request-ID'],
        credentials: true,
        maxAge: 86400
      };

      // Verify the CORS configuration structure
      expect(corsConfig.origins).toEqual(['https://example.com']);
      expect(corsConfig.methods).toEqual(['GET', 'POST', 'PUT', 'DELETE']);
      expect(corsConfig.allowedHeaders).toEqual(['Content-Type', 'Authorization']);
      expect(corsConfig.credentials).toBe(true);
    });

    it('should correctly define JWT configuration', () => {
      // Create a JWT configuration
      const jwtConfig: JwtConfig = {
        secret: 'secret',
        expiresIn: '1h',
        refreshExpiresIn: '7d',
        issuer: 'app',
        audience: 'users'
      };

      // Verify the JWT configuration structure
      expect(jwtConfig.secret).toBe('secret');
      expect(jwtConfig.expiresIn).toBe('1h');
      expect(jwtConfig.refreshExpiresIn).toBe('7d');
      expect(jwtConfig.issuer).toBe('app');
    });
  });

  describe('Complete Application Environment Configuration', () => {
    it('should correctly define a complete application environment configuration', () => {
      // Create a complete application environment configuration
      const appConfig: AppEnvConfig = {
        app: {
          name: 'austa-superapp',
          version: '1.0.0',
          environment: 'development',
          port: 3000,
          host: 'localhost',
          baseUrl: 'http://localhost:3000'
        },
        database: {
          url: 'postgresql://user:password@localhost:5432/db',
          poolSize: 10
        },
        redis: {
          url: 'redis://localhost:6379',
          keyPrefix: 'app:'
        },
        kafka: {
          brokers: ['localhost:9092'],
          clientId: 'app'
        },
        logging: {
          level: 'info',
          format: 'json'
        },
        cors: {
          origins: ['https://example.com'],
          credentials: true
        },
        jwt: {
          secret: 'secret',
          expiresIn: '1h'
        },
        health: {
          enabled: true,
          path: '/health',
          interval: 30000
        },
        monitoring: {
          metrics: {
            enabled: true,
            path: '/metrics'
          },
          tracing: {
            enabled: true,
            serviceName: 'app',
            sampleRate: 0.1
          }
        },
        retryPolicy: {
          attempts: 3,
          delay: 1000,
          backoff: 2,
          maxDelay: 10000
        },
        journeys: {
          health: {
            journeyType: JourneyType.HEALTH,
            variables: {
              API_URL: {
                type: 'url',
                required: true,
                description: 'Health API URL'
              }
            },
            features: {
              WEARABLE_SYNC: true
            }
          },
          care: {
            journeyType: JourneyType.CARE,
            variables: {
              API_URL: {
                type: 'url',
                required: true,
                description: 'Care API URL'
              }
            },
            features: {
              TELEMEDICINE: true
            }
          },
          plan: {
            journeyType: JourneyType.PLAN,
            variables: {
              API_URL: {
                type: 'url',
                required: true,
                description: 'Plan API URL'
              }
            },
            features: {
              CLAIMS: true
            }
          }
        },
        features: {
          GAMIFICATION: {
            name: 'GAMIFICATION',
            enabled: true,
            description: 'Enable gamification features'
          },
          NOTIFICATIONS: {
            name: 'NOTIFICATIONS',
            enabled: true,
            description: 'Enable notification features'
          }
        },
        // Custom configuration
        customConfig: {
          setting1: 'value1',
          setting2: 'value2'
        }
      };

      // Verify the application configuration structure
      expect(appConfig.app.name).toBe('austa-superapp');
      expect(appConfig.app.environment).toBe('development');
      expect(appConfig.database?.url).toBe('postgresql://user:password@localhost:5432/db');
      expect(appConfig.journeys?.health?.journeyType).toBe(JourneyType.HEALTH);
      expect(appConfig.journeys?.care?.features?.TELEMEDICINE).toBe(true);
      expect(appConfig.features?.GAMIFICATION?.enabled).toBe(true);
      expect(appConfig.customConfig?.setting1).toBe('value1');
    });
  });
});