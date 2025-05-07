import { registerAs } from '@nestjs/config';
import * as Joi from 'joi'; // Joi 17.12.2 as specified in tech spec
import { DatabaseConnectionOptions } from '@austa/database/connection';
import { EventStreamingOptions } from '@austa/events/interfaces';

/**
 * Health service configuration interface
 * Provides type safety for all configuration values
 */
export interface HealthServiceConfig {
  // Core configuration
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  
  // Database configuration
  database: {
    url: string;
    ssl: boolean;
    connectionOptions: DatabaseConnectionOptions;
  };
  
  // TimescaleDB configuration
  timescale: {
    enabled: boolean;
    metricsRetentionDays: number;
    aggregation: {
      enabled: boolean;
      intervals: string[];
    };
  };
  
  // FHIR API configuration
  fhir: {
    enabled: boolean;
    url?: string;
    authType: 'oauth2' | 'basic' | 'none';
    clientId?: string;
    clientSecret?: string;
    scope?: string;
    tokenUrl?: string;
    username?: string;
    password?: string;
    timeout: number;
  };
  
  // Wearables configuration
  wearables: {
    syncEnabled: boolean;
    supported: string[];
    googlefit?: {
      clientId: string;
      clientSecret: string;
    };
    healthkit?: {
      teamId: string;
      keyId: string;
      privateKey: string;
    };
    fitbit?: {
      clientId: string;
      clientSecret: string;
    };
    syncInterval: number;
    maxSyncDays: number;
  };
  
  // Health Goals configuration
  healthGoals: {
    maxActive: number;
  };
  
  // Health Insights configuration
  healthInsights: {
    enabled: boolean;
    generationInterval: number;
    modelsPath?: string;
  };
  
  // Event streaming configuration
  events: EventStreamingOptions & {
    topicPrefix: string;
  };
  
  // Redis configuration
  redis: {
    url: string;
    ttl: number;
  };
  
  // Medical history configuration
  medicalHistory: {
    maxEvents: number;
  };
  
  // Storage configuration
  storage: {
    s3: {
      bucket: string;
      region: string;
      prefix: string;
    };
  };
}

/**
 * Health service configuration
 * Provides structured access to environment variables with sensible defaults
 * Registered with NestJS ConfigModule for centralized configuration management
 */
export const health = registerAs<HealthServiceConfig>('health', () => ({
  // Core configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  
  // Database configuration
  database: {
    url: process.env.HEALTH_DATABASE_URL || process.env.DATABASE_URL,
    ssl: process.env.HEALTH_DATABASE_SSL === 'true' || process.env.DATABASE_SSL === 'true',
    connectionOptions: {
      poolSize: parseInt(process.env.HEALTH_DATABASE_POOL_SIZE, 10) || 10,
      connectionTimeout: parseInt(process.env.HEALTH_DATABASE_CONNECTION_TIMEOUT, 10) || 30000,
      idleTimeout: parseInt(process.env.HEALTH_DATABASE_IDLE_TIMEOUT, 10) || 60000,
      maxRetries: parseInt(process.env.HEALTH_DATABASE_MAX_RETRIES, 10) || 3,
      retryDelay: parseInt(process.env.HEALTH_DATABASE_RETRY_DELAY, 10) || 1000,
    },
  },
  
  // TimescaleDB configuration
  timescale: {
    enabled: process.env.HEALTH_TIMESCALE_ENABLED === 'true',
    metricsRetentionDays: parseInt(process.env.HEALTH_METRICS_RETENTION_DAYS, 10) || 730,
    aggregation: {
      enabled: process.env.HEALTH_METRICS_AGGREGATION_ENABLED === 'true',
      intervals: (process.env.HEALTH_METRICS_AGGREGATION_INTERVALS || 'hour,day,week,month').split(','),
    },
  },
  
  // FHIR API configuration
  fhir: {
    enabled: process.env.HEALTH_FHIR_API_ENABLED === 'true',
    url: process.env.HEALTH_FHIR_API_URL,
    authType: (process.env.HEALTH_FHIR_API_AUTH_TYPE || 'oauth2') as 'oauth2' | 'basic' | 'none',
    clientId: process.env.HEALTH_FHIR_API_CLIENT_ID,
    clientSecret: process.env.HEALTH_FHIR_API_CLIENT_SECRET,
    scope: process.env.HEALTH_FHIR_API_SCOPE,
    tokenUrl: process.env.HEALTH_FHIR_API_TOKEN_URL,
    username: process.env.HEALTH_FHIR_API_USERNAME,
    password: process.env.HEALTH_FHIR_API_PASSWORD,
    timeout: parseInt(process.env.HEALTH_FHIR_API_TIMEOUT, 10) || 10000,
  },
  
  // Wearables configuration
  wearables: {
    syncEnabled: process.env.HEALTH_WEARABLES_SYNC_ENABLED === 'true',
    supported: (process.env.HEALTH_WEARABLES_SUPPORTED || 'googlefit,healthkit,fitbit').split(','),
    googlefit: {
      clientId: process.env.HEALTH_GOOGLEFIT_CLIENT_ID,
      clientSecret: process.env.HEALTH_GOOGLEFIT_CLIENT_SECRET,
    },
    healthkit: {
      teamId: process.env.HEALTH_HEALTHKIT_TEAM_ID,
      keyId: process.env.HEALTH_HEALTHKIT_KEY_ID,
      privateKey: process.env.HEALTH_HEALTHKIT_PRIVATE_KEY,
    },
    fitbit: {
      clientId: process.env.HEALTH_FITBIT_CLIENT_ID,
      clientSecret: process.env.HEALTH_FITBIT_CLIENT_SECRET,
    },
    syncInterval: parseInt(process.env.HEALTH_WEARABLES_SYNC_INTERVAL, 10) || 15,
    maxSyncDays: parseInt(process.env.HEALTH_WEARABLES_MAX_SYNC_DAYS, 10) || 30,
  },
  
  // Health Goals configuration
  healthGoals: {
    maxActive: parseInt(process.env.HEALTH_GOALS_MAX_ACTIVE, 10) || 10,
  },
  
  // Health Insights configuration
  healthInsights: {
    enabled: process.env.HEALTH_INSIGHTS_ENABLED === 'true',
    generationInterval: parseInt(process.env.HEALTH_INSIGHTS_GENERATION_INTERVAL, 10) || 24,
    modelsPath: process.env.HEALTH_INSIGHTS_MODELS_PATH,
  },
  
  // Event streaming configuration
  events: {
    kafkaEnabled: process.env.HEALTH_EVENTS_KAFKA_ENABLED === 'true' || process.env.EVENTS_KAFKA_ENABLED === 'true',
    kafkaBrokers: process.env.HEALTH_EVENTS_KAFKA_BROKERS || process.env.EVENTS_KAFKA_BROKERS,
    topicPrefix: process.env.HEALTH_EVENTS_TOPIC_PREFIX || process.env.EVENTS_TOPIC_PREFIX || 'austa.health',
    consumerGroupId: process.env.HEALTH_EVENTS_CONSUMER_GROUP_ID || 'health-service',
    retryEnabled: process.env.HEALTH_EVENTS_RETRY_ENABLED === 'true' || true,
    maxRetries: parseInt(process.env.HEALTH_EVENTS_MAX_RETRIES, 10) || 3,
    retryDelay: parseInt(process.env.HEALTH_EVENTS_RETRY_DELAY, 10) || 1000,
  },
  
  // Redis configuration
  redis: {
    url: process.env.HEALTH_REDIS_URL || process.env.REDIS_URL,
    ttl: parseInt(process.env.HEALTH_REDIS_TTL, 10) || 3600,
  },
  
  // Medical history configuration
  medicalHistory: {
    maxEvents: parseInt(process.env.HEALTH_MEDICAL_HISTORY_MAX_EVENTS, 10) || 1000,
  },
  
  // Storage configuration
  storage: {
    s3: {
      bucket: process.env.HEALTH_STORAGE_S3_BUCKET || process.env.STORAGE_S3_BUCKET,
      region: process.env.HEALTH_STORAGE_S3_REGION || process.env.STORAGE_S3_REGION,
      prefix: process.env.HEALTH_STORAGE_S3_PREFIX || process.env.STORAGE_S3_PREFIX || 'health',
    },
  },
}));

/**
 * Validation schema for Health service environment variables
 * Ensures that required variables are present and correctly formatted
 * Used by NestJS ConfigModule for validation during application startup
 */
export const validationSchema = Joi.object({
  // Core configuration
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  API_PREFIX: Joi.string().default('api/v1'),
  
  // Database configuration - support both service-specific and global variables
  HEALTH_DATABASE_URL: Joi.string().description('Health service PostgreSQL connection string'),
  DATABASE_URL: Joi.string().description('PostgreSQL connection string'),
  HEALTH_DATABASE_SSL: Joi.boolean().default(false),
  DATABASE_SSL: Joi.boolean().default(false),
  HEALTH_DATABASE_POOL_SIZE: Joi.number().default(10),
  HEALTH_DATABASE_CONNECTION_TIMEOUT: Joi.number().default(30000),
  HEALTH_DATABASE_IDLE_TIMEOUT: Joi.number().default(60000),
  HEALTH_DATABASE_MAX_RETRIES: Joi.number().default(3),
  HEALTH_DATABASE_RETRY_DELAY: Joi.number().default(1000),
  
  // TimescaleDB configuration
  HEALTH_TIMESCALE_ENABLED: Joi.boolean().default(false),
  HEALTH_METRICS_RETENTION_DAYS: Joi.number().default(730),
  HEALTH_METRICS_AGGREGATION_ENABLED: Joi.boolean().default(false),
  HEALTH_METRICS_AGGREGATION_INTERVALS: Joi.string().default('hour,day,week,month'),
  
  // FHIR API configuration
  HEALTH_FHIR_API_ENABLED: Joi.boolean().default(false),
  HEALTH_FHIR_API_URL: Joi.string().when('HEALTH_FHIR_API_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  HEALTH_FHIR_API_AUTH_TYPE: Joi.string().valid('oauth2', 'basic', 'none').default('oauth2'),
  HEALTH_FHIR_API_CLIENT_ID: Joi.string().when('HEALTH_FHIR_API_AUTH_TYPE', {
    is: 'oauth2',
    then: Joi.when('HEALTH_FHIR_API_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    otherwise: Joi.optional(),
  }),
  HEALTH_FHIR_API_CLIENT_SECRET: Joi.string().when('HEALTH_FHIR_API_AUTH_TYPE', {
    is: 'oauth2',
    then: Joi.when('HEALTH_FHIR_API_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    otherwise: Joi.optional(),
  }),
  HEALTH_FHIR_API_SCOPE: Joi.string().when('HEALTH_FHIR_API_AUTH_TYPE', {
    is: 'oauth2',
    then: Joi.optional(),
    otherwise: Joi.optional(),
  }),
  HEALTH_FHIR_API_TOKEN_URL: Joi.string().when('HEALTH_FHIR_API_AUTH_TYPE', {
    is: 'oauth2',
    then: Joi.when('HEALTH_FHIR_API_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    otherwise: Joi.optional(),
  }),
  HEALTH_FHIR_API_USERNAME: Joi.string().when('HEALTH_FHIR_API_AUTH_TYPE', {
    is: 'basic',
    then: Joi.when('HEALTH_FHIR_API_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    otherwise: Joi.optional(),
  }),
  HEALTH_FHIR_API_PASSWORD: Joi.string().when('HEALTH_FHIR_API_AUTH_TYPE', {
    is: 'basic',
    then: Joi.when('HEALTH_FHIR_API_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    otherwise: Joi.optional(),
  }),
  HEALTH_FHIR_API_TIMEOUT: Joi.number().default(10000),
  
  // Wearables configuration
  HEALTH_WEARABLES_SYNC_ENABLED: Joi.boolean().default(false),
  HEALTH_WEARABLES_SUPPORTED: Joi.string().default('googlefit,healthkit,fitbit'),
  HEALTH_GOOGLEFIT_CLIENT_ID: Joi.string().when('HEALTH_WEARABLES_SYNC_ENABLED', {
    is: true,
    then: Joi.when('HEALTH_WEARABLES_SUPPORTED', {
      is: Joi.string().pattern(/googlefit/),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    otherwise: Joi.optional(),
  }),
  HEALTH_GOOGLEFIT_CLIENT_SECRET: Joi.string().when('HEALTH_WEARABLES_SYNC_ENABLED', {
    is: true,
    then: Joi.when('HEALTH_WEARABLES_SUPPORTED', {
      is: Joi.string().pattern(/googlefit/),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    otherwise: Joi.optional(),
  }),
  HEALTH_HEALTHKIT_TEAM_ID: Joi.string().when('HEALTH_WEARABLES_SYNC_ENABLED', {
    is: true,
    then: Joi.when('HEALTH_WEARABLES_SUPPORTED', {
      is: Joi.string().pattern(/healthkit/),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    otherwise: Joi.optional(),
  }),
  HEALTH_HEALTHKIT_KEY_ID: Joi.string().when('HEALTH_WEARABLES_SYNC_ENABLED', {
    is: true,
    then: Joi.when('HEALTH_WEARABLES_SUPPORTED', {
      is: Joi.string().pattern(/healthkit/),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    otherwise: Joi.optional(),
  }),
  HEALTH_HEALTHKIT_PRIVATE_KEY: Joi.string().when('HEALTH_WEARABLES_SYNC_ENABLED', {
    is: true,
    then: Joi.when('HEALTH_WEARABLES_SUPPORTED', {
      is: Joi.string().pattern(/healthkit/),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    otherwise: Joi.optional(),
  }),
  HEALTH_FITBIT_CLIENT_ID: Joi.string().when('HEALTH_WEARABLES_SYNC_ENABLED', {
    is: true,
    then: Joi.when('HEALTH_WEARABLES_SUPPORTED', {
      is: Joi.string().pattern(/fitbit/),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    otherwise: Joi.optional(),
  }),
  HEALTH_FITBIT_CLIENT_SECRET: Joi.string().when('HEALTH_WEARABLES_SYNC_ENABLED', {
    is: true,
    then: Joi.when('HEALTH_WEARABLES_SUPPORTED', {
      is: Joi.string().pattern(/fitbit/),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    otherwise: Joi.optional(),
  }),
  HEALTH_WEARABLES_SYNC_INTERVAL: Joi.number().default(15),
  HEALTH_WEARABLES_MAX_SYNC_DAYS: Joi.number().default(30),
  
  // Health Goals configuration
  HEALTH_GOALS_MAX_ACTIVE: Joi.number().default(10),
  
  // Health Insights configuration
  HEALTH_INSIGHTS_ENABLED: Joi.boolean().default(false),
  HEALTH_INSIGHTS_GENERATION_INTERVAL: Joi.number().default(24),
  HEALTH_INSIGHTS_MODELS_PATH: Joi.string().when('HEALTH_INSIGHTS_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  
  // Event streaming configuration - support both service-specific and global variables
  HEALTH_EVENTS_KAFKA_ENABLED: Joi.boolean().default(false),
  EVENTS_KAFKA_ENABLED: Joi.boolean().default(false),
  HEALTH_EVENTS_KAFKA_BROKERS: Joi.string().when('HEALTH_EVENTS_KAFKA_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  EVENTS_KAFKA_BROKERS: Joi.string().when('EVENTS_KAFKA_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  HEALTH_EVENTS_TOPIC_PREFIX: Joi.string().default('austa.health'),
  EVENTS_TOPIC_PREFIX: Joi.string().default('austa.health'),
  HEALTH_EVENTS_CONSUMER_GROUP_ID: Joi.string().default('health-service'),
  HEALTH_EVENTS_RETRY_ENABLED: Joi.boolean().default(true),
  HEALTH_EVENTS_MAX_RETRIES: Joi.number().default(3),
  HEALTH_EVENTS_RETRY_DELAY: Joi.number().default(1000),
  
  // Redis configuration - support both service-specific and global variables
  HEALTH_REDIS_URL: Joi.string().description('Health service Redis connection string'),
  REDIS_URL: Joi.string().description('Redis connection string'),
  HEALTH_REDIS_TTL: Joi.number().default(3600),
  
  // Medical history configuration
  HEALTH_MEDICAL_HISTORY_MAX_EVENTS: Joi.number().default(1000),
  
  // Storage configuration - support both service-specific and global variables
  HEALTH_STORAGE_S3_BUCKET: Joi.string().description('Health service S3 bucket'),
  STORAGE_S3_BUCKET: Joi.string().description('S3 bucket'),
  HEALTH_STORAGE_S3_REGION: Joi.string().description('Health service S3 region'),
  STORAGE_S3_REGION: Joi.string().description('S3 region'),
  HEALTH_STORAGE_S3_PREFIX: Joi.string().default('health'),
  STORAGE_S3_PREFIX: Joi.string().default('health'),
});

/**
 * Custom validation function to ensure that either service-specific or global variables are provided
 * Used by NestJS ConfigModule for validation during application startup
 */
export const validateConfig = (config: Record<string, unknown>) => {
  // Database URL validation
  if (!config.HEALTH_DATABASE_URL && !config.DATABASE_URL) {
    throw new Error('Either HEALTH_DATABASE_URL or DATABASE_URL must be provided');
  }
  
  // Redis URL validation
  if (!config.HEALTH_REDIS_URL && !config.REDIS_URL) {
    throw new Error('Either HEALTH_REDIS_URL or REDIS_URL must be provided');
  }
  
  // S3 bucket validation
  if (!config.HEALTH_STORAGE_S3_BUCKET && !config.STORAGE_S3_BUCKET) {
    throw new Error('Either HEALTH_STORAGE_S3_BUCKET or STORAGE_S3_BUCKET must be provided');
  }
  
  // S3 region validation
  if (!config.HEALTH_STORAGE_S3_REGION && !config.STORAGE_S3_REGION) {
    throw new Error('Either HEALTH_STORAGE_S3_REGION or STORAGE_S3_REGION must be provided');
  }
  
  // Kafka brokers validation when Kafka is enabled
  if ((config.HEALTH_EVENTS_KAFKA_ENABLED === true || config.EVENTS_KAFKA_ENABLED === true) && 
      !config.HEALTH_EVENTS_KAFKA_BROKERS && !config.EVENTS_KAFKA_BROKERS) {
    throw new Error('Either HEALTH_EVENTS_KAFKA_BROKERS or EVENTS_KAFKA_BROKERS must be provided when Kafka is enabled');
  }
  
  return config;
};