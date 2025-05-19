/**
 * @file kafka.config.ts
 * @description Provides configuration utilities for Kafka connections, including default settings,
 * configuration loading from environment variables, and validation. This file centralizes all
 * Kafka configuration logic across services, ensuring consistent settings and validation.
 * 
 * @example
 * // Basic usage with environment variables
 * const kafkaOptions = createKafkaOptionsFromEnv();
 * 
 * // Journey-specific configuration
 * const healthKafkaOptions = createKafkaOptionsFromEnv('health');
 * 
 * // Manual configuration with validation
 * const config = {
 *   client: {
 *     clientId: 'my-app',
 *     brokers: ['kafka1:9092', 'kafka2:9092']
 *   }
 * };
 * const validatedConfig = validateKafkaConfig(config);
 * const kafkaOptions = createKafkaOptions(validatedConfig);
 * 
 * // Usage with NestJS ConfigModule
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({
 *       load: [() => ({ kafka: kafkaConfigFactory('health')() })]
 *     })
 *   ],
 *   providers: [registerKafkaConfig('health')]
 * })
 */

import { KafkaOptions, Transport } from '@nestjs/microservices';
import * as Joi from 'joi';

/**
 * Interface for Kafka client configuration
 */
export interface KafkaClientConfig {
  /**
   * Client identifier used by the broker to identify the client
   */
  clientId: string;
  
  /**
   * List of broker addresses in the format host:port
   */
  brokers: string[];
  
  /**
   * SSL configuration for secure connections
   */
  ssl?: boolean | KafkaSSLConfig;
  
  /**
   * SASL authentication configuration
   */
  sasl?: KafkaSASLConfig;
  
  /**
   * Connection timeout in milliseconds
   */
  connectionTimeout?: number;
  
  /**
   * Request timeout in milliseconds
   */
  requestTimeout?: number;
  
  /**
   * Retry configuration for failed requests
   */
  retry?: KafkaRetryConfig;
}

/**
 * Interface for Kafka SSL configuration
 */
export interface KafkaSSLConfig {
  /**
   * Path to CA certificate file
   */
  ca?: string;
  
  /**
   * Path to client certificate file
   */
  cert?: string;
  
  /**
   * Path to client key file
   */
  key?: string;
  
  /**
   * Passphrase for the client key
   */
  passphrase?: string;
  
  /**
   * Whether to reject unauthorized connections
   */
  rejectUnauthorized?: boolean;
}

/**
 * Interface for Kafka SASL authentication configuration
 */
export interface KafkaSASLConfig {
  /**
   * SASL mechanism (plain, scram-sha-256, scram-sha-512, aws)
   */
  mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512' | 'aws';
  
  /**
   * Username for PLAIN and SCRAM mechanisms
   */
  username?: string;
  
  /**
   * Password for PLAIN and SCRAM mechanisms
   */
  password?: string;
  
  /**
   * Authorization identity for AWS IAM authentication
   */
  authorizationIdentity?: string;
}

/**
 * Interface for Kafka retry configuration
 */
export interface KafkaRetryConfig {
  /**
   * Maximum number of retries
   */
  maxRetryTime?: number;
  
  /**
   * Initial retry delay in milliseconds
   */
  initialRetryTime?: number;
  
  /**
   * Factor by which the retry time increases
   */
  factor?: number;
  
  /**
   * Maximum delay between retries in milliseconds
   */
  multiplier?: number;
  
  /**
   * Whether to retry indefinitely
   */
  retries?: number;
}

/**
 * Interface for Kafka consumer configuration
 */
export interface KafkaConsumerConfig {
  /**
   * Consumer group ID
   */
  groupId: string;
  
  /**
   * Maximum number of bytes to fetch in a single batch
   */
  maxBytes?: number;
  
  /**
   * Minimum number of bytes required for a fetch to return
   */
  minBytes?: number;
  
  /**
   * Maximum wait time for a fetch to return
   */
  maxWaitTimeInMs?: number;
  
  /**
   * Whether to read messages from the beginning of the topic
   */
  readUncommitted?: boolean;
  
  /**
   * Whether to allow auto-commit of offsets
   */
  allowAutoTopicCreation?: boolean;
}

/**
 * Interface for Kafka producer configuration
 */
export interface KafkaProducerConfig {
  /**
   * Whether to wait for all replicas to acknowledge writes
   */
  allowAutoTopicCreation?: boolean;
  
  /**
   * Compression type for produced messages
   */
  compression?: 'none' | 'gzip' | 'snappy' | 'lz4';
  
  /**
   * Maximum time to buffer messages before sending
   */
  metadataMaxAge?: number;
  
  /**
   * Required acknowledgments for produced messages
   */
  acks?: number | 'all';
}

/**
 * Interface for Kafka run configuration
 */
export interface KafkaRunConfig {
  /**
   * Whether to automatically commit offsets
   */
  autoCommit?: boolean;
  
  /**
   * Auto-commit interval in milliseconds
   */
  autoCommitInterval?: number | null;
  
  /**
   * Maximum number of messages to process in a batch
   */
  batchSize?: number;
  
  /**
   * Maximum number of concurrent message processing
   */
  concurrency?: number;
  
  /**
   * Partition assignment strategy
   */
  partitionsConsumedConcurrently?: number;
}

/**
 * Interface for Kafka subscribe configuration
 */
export interface KafkaSubscribeConfig {
  /**
   * Topic to subscribe to
   */
  topic: string;
  
  /**
   * Consumer group ID
   */
  groupId?: string;
  
  /**
   * From which offset to start reading
   */
  fromBeginning?: boolean;
  
  /**
   * Journey associated with this topic
   */
  journey?: 'health' | 'care' | 'plan' | 'common';
}

/**
 * Interface for complete Kafka configuration
 */
export interface KafkaConfig {
  /**
   * Client configuration
   */
  client: KafkaClientConfig;
  
  /**
   * Consumer configuration
   */
  consumer?: KafkaConsumerConfig;
  
  /**
   * Producer configuration
   */
  producer?: KafkaProducerConfig;
  
  /**
   * Run configuration
   */
  run?: KafkaRunConfig;
  
  /**
   * Subscribe configuration
   */
  subscribe?: KafkaSubscribeConfig[];
}

/**
 * Default Kafka client configuration
 */
export const DEFAULT_CLIENT_CONFIG: Partial<KafkaClientConfig> = {
  clientId: 'austa-app',
  connectionTimeout: 3000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 100,
    maxRetryTime: 30000,
    factor: 0.2,
    multiplier: 2,
    retries: 5,
  },
};

/**
 * Default Kafka consumer configuration
 */
export const DEFAULT_CONSUMER_CONFIG: Partial<KafkaConsumerConfig> = {
  maxBytes: 1048576, // 1MB
  minBytes: 1,
  maxWaitTimeInMs: 5000,
  readUncommitted: false,
  allowAutoTopicCreation: false,
};

/**
 * Default Kafka producer configuration
 */
export const DEFAULT_PRODUCER_CONFIG: Partial<KafkaProducerConfig> = {
  allowAutoTopicCreation: false,
  compression: 'none',
  metadataMaxAge: 300000, // 5 minutes
  acks: 'all',
};

/**
 * Default Kafka run configuration
 */
export const DEFAULT_RUN_CONFIG: Partial<KafkaRunConfig> = {
  autoCommit: true,
  autoCommitInterval: 5000,
  batchSize: 100,
  concurrency: 10,
  partitionsConsumedConcurrently: 1,
};

/**
 * Environment variable names for Kafka configuration
 */
export const KAFKA_ENV_VARS = {
  // Client configuration
  CLIENT_ID: 'KAFKA_CLIENT_ID',
  BROKERS: 'KAFKA_BROKERS',
  CONNECTION_TIMEOUT: 'KAFKA_CONNECTION_TIMEOUT',
  REQUEST_TIMEOUT: 'KAFKA_REQUEST_TIMEOUT',
  
  // SSL configuration
  SSL_ENABLED: 'KAFKA_SSL_ENABLED',
  SSL_CA: 'KAFKA_SSL_CA',
  SSL_CERT: 'KAFKA_SSL_CERT',
  SSL_KEY: 'KAFKA_SSL_KEY',
  SSL_PASSPHRASE: 'KAFKA_SSL_PASSPHRASE',
  SSL_REJECT_UNAUTHORIZED: 'KAFKA_SSL_REJECT_UNAUTHORIZED',
  
  // SASL configuration
  SASL_MECHANISM: 'KAFKA_SASL_MECHANISM',
  SASL_USERNAME: 'KAFKA_SASL_USERNAME',
  SASL_PASSWORD: 'KAFKA_SASL_PASSWORD',
  SASL_AUTH_IDENTITY: 'KAFKA_SASL_AUTH_IDENTITY',
  
  // Retry configuration
  RETRY_MAX_TIME: 'KAFKA_RETRY_MAX_TIME',
  RETRY_INITIAL_TIME: 'KAFKA_RETRY_INITIAL_TIME',
  RETRY_FACTOR: 'KAFKA_RETRY_FACTOR',
  RETRY_MULTIPLIER: 'KAFKA_RETRY_MULTIPLIER',
  RETRY_RETRIES: 'KAFKA_RETRY_RETRIES',
  
  // Consumer configuration
  CONSUMER_GROUP_ID: 'KAFKA_CONSUMER_GROUP_ID',
  CONSUMER_MAX_BYTES: 'KAFKA_CONSUMER_MAX_BYTES',
  CONSUMER_MIN_BYTES: 'KAFKA_CONSUMER_MIN_BYTES',
  CONSUMER_MAX_WAIT_TIME: 'KAFKA_CONSUMER_MAX_WAIT_TIME',
  CONSUMER_READ_UNCOMMITTED: 'KAFKA_CONSUMER_READ_UNCOMMITTED',
  CONSUMER_ALLOW_AUTO_TOPIC_CREATION: 'KAFKA_CONSUMER_ALLOW_AUTO_TOPIC_CREATION',
  
  // Producer configuration
  PRODUCER_ALLOW_AUTO_TOPIC_CREATION: 'KAFKA_PRODUCER_ALLOW_AUTO_TOPIC_CREATION',
  PRODUCER_COMPRESSION: 'KAFKA_PRODUCER_COMPRESSION',
  PRODUCER_METADATA_MAX_AGE: 'KAFKA_PRODUCER_METADATA_MAX_AGE',
  PRODUCER_ACKS: 'KAFKA_PRODUCER_ACKS',
  
  // Run configuration
  RUN_AUTO_COMMIT: 'KAFKA_RUN_AUTO_COMMIT',
  RUN_AUTO_COMMIT_INTERVAL: 'KAFKA_RUN_AUTO_COMMIT_INTERVAL',
  RUN_BATCH_SIZE: 'KAFKA_RUN_BATCH_SIZE',
  RUN_CONCURRENCY: 'KAFKA_RUN_CONCURRENCY',
  RUN_PARTITIONS_CONSUMED_CONCURRENTLY: 'KAFKA_RUN_PARTITIONS_CONSUMED_CONCURRENTLY',
  
  // Journey-specific prefixes
  JOURNEY_PREFIX: 'JOURNEY_',
};

/**
 * Validation schema for Kafka client configuration
 */
export const kafkaClientConfigSchema = Joi.object({
  clientId: Joi.string().required(),
  brokers: Joi.array().items(Joi.string()).min(1).required(),
  connectionTimeout: Joi.number().positive().default(DEFAULT_CLIENT_CONFIG.connectionTimeout),
  requestTimeout: Joi.number().positive().default(DEFAULT_CLIENT_CONFIG.requestTimeout),
  ssl: Joi.alternatives().try(
    Joi.boolean(),
    Joi.object({
      ca: Joi.string().optional(),
      cert: Joi.string().optional(),
      key: Joi.string().optional(),
      passphrase: Joi.string().optional(),
      rejectUnauthorized: Joi.boolean().default(true),
    }),
  ).optional(),
  sasl: Joi.object({
    mechanism: Joi.string().valid('plain', 'scram-sha-256', 'scram-sha-512', 'aws').required(),
    username: Joi.string().when('mechanism', {
      is: Joi.string().valid('plain', 'scram-sha-256', 'scram-sha-512'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    password: Joi.string().when('mechanism', {
      is: Joi.string().valid('plain', 'scram-sha-256', 'scram-sha-512'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    authorizationIdentity: Joi.string().when('mechanism', {
      is: 'aws',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }).optional(),
  retry: Joi.object({
    maxRetryTime: Joi.number().positive().default(DEFAULT_CLIENT_CONFIG.retry?.maxRetryTime),
    initialRetryTime: Joi.number().positive().default(DEFAULT_CLIENT_CONFIG.retry?.initialRetryTime),
    factor: Joi.number().positive().default(DEFAULT_CLIENT_CONFIG.retry?.factor),
    multiplier: Joi.number().positive().default(DEFAULT_CLIENT_CONFIG.retry?.multiplier),
    retries: Joi.number().min(0).default(DEFAULT_CLIENT_CONFIG.retry?.retries),
  }).default(DEFAULT_CLIENT_CONFIG.retry),
});

/**
 * Validation schema for Kafka consumer configuration
 */
export const kafkaConsumerConfigSchema = Joi.object({
  groupId: Joi.string().required(),
  maxBytes: Joi.number().positive().default(DEFAULT_CONSUMER_CONFIG.maxBytes),
  minBytes: Joi.number().positive().default(DEFAULT_CONSUMER_CONFIG.minBytes),
  maxWaitTimeInMs: Joi.number().positive().default(DEFAULT_CONSUMER_CONFIG.maxWaitTimeInMs),
  readUncommitted: Joi.boolean().default(DEFAULT_CONSUMER_CONFIG.readUncommitted),
  allowAutoTopicCreation: Joi.boolean().default(DEFAULT_CONSUMER_CONFIG.allowAutoTopicCreation),
});

/**
 * Validation schema for Kafka producer configuration
 */
export const kafkaProducerConfigSchema = Joi.object({
  allowAutoTopicCreation: Joi.boolean().default(DEFAULT_PRODUCER_CONFIG.allowAutoTopicCreation),
  compression: Joi.string().valid('none', 'gzip', 'snappy', 'lz4').default(DEFAULT_PRODUCER_CONFIG.compression),
  metadataMaxAge: Joi.number().positive().default(DEFAULT_PRODUCER_CONFIG.metadataMaxAge),
  acks: Joi.alternatives().try(
    Joi.number().valid(0, 1, -1),
    Joi.string().valid('all')
  ).default(DEFAULT_PRODUCER_CONFIG.acks),
});

/**
 * Validation schema for Kafka run configuration
 */
export const kafkaRunConfigSchema = Joi.object({
  autoCommit: Joi.boolean().default(DEFAULT_RUN_CONFIG.autoCommit),
  autoCommitInterval: Joi.alternatives().try(
    Joi.number().positive(),
    Joi.valid(null)
  ).default(DEFAULT_RUN_CONFIG.autoCommitInterval),
  batchSize: Joi.number().positive().default(DEFAULT_RUN_CONFIG.batchSize),
  concurrency: Joi.number().positive().default(DEFAULT_RUN_CONFIG.concurrency),
  partitionsConsumedConcurrently: Joi.number().positive().default(DEFAULT_RUN_CONFIG.partitionsConsumedConcurrently),
});

/**
 * Validation schema for Kafka subscribe configuration
 */
export const kafkaSubscribeConfigSchema = Joi.object({
  topic: Joi.string().required(),
  groupId: Joi.string().optional(),
  fromBeginning: Joi.boolean().default(false),
  journey: Joi.string().valid('health', 'care', 'plan', 'common').optional(),
});

/**
 * Validation schema for complete Kafka configuration
 */
export const kafkaConfigSchema = Joi.object({
  client: kafkaClientConfigSchema.required(),
  consumer: kafkaConsumerConfigSchema.optional(),
  producer: kafkaProducerConfigSchema.optional(),
  run: kafkaRunConfigSchema.optional(),
  subscribe: Joi.array().items(kafkaSubscribeConfigSchema).optional(),
});

/**
 * Parses a comma-separated string into an array of strings
 * @param value The comma-separated string to parse
 * @returns An array of strings
 */
export function parseStringArray(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

/**
 * Loads Kafka client configuration from environment variables
 * @param prefix Optional prefix for environment variables (for journey-specific configuration)
 * @returns Kafka client configuration
 */
export function loadKafkaClientConfigFromEnv(prefix = ''): KafkaClientConfig {
  const envPrefix = prefix ? `${prefix}_` : '';
  
  const clientId = process.env[`${envPrefix}${KAFKA_ENV_VARS.CLIENT_ID}`] || DEFAULT_CLIENT_CONFIG.clientId;
  const brokers = parseStringArray(process.env[`${envPrefix}${KAFKA_ENV_VARS.BROKERS}`]);
  const connectionTimeout = process.env[`${envPrefix}${KAFKA_ENV_VARS.CONNECTION_TIMEOUT}`] ? 
    parseInt(process.env[`${envPrefix}${KAFKA_ENV_VARS.CONNECTION_TIMEOUT}`] as string, 10) : 
    DEFAULT_CLIENT_CONFIG.connectionTimeout;
  const requestTimeout = process.env[`${envPrefix}${KAFKA_ENV_VARS.REQUEST_TIMEOUT}`] ? 
    parseInt(process.env[`${envPrefix}${KAFKA_ENV_VARS.REQUEST_TIMEOUT}`] as string, 10) : 
    DEFAULT_CLIENT_CONFIG.requestTimeout;
  
  // SSL configuration
  let ssl: boolean | KafkaSSLConfig | undefined;
  const sslEnabled = process.env[`${envPrefix}${KAFKA_ENV_VARS.SSL_ENABLED}`];
  
  if (sslEnabled === 'true') {
    ssl = {
      ca: process.env[`${envPrefix}${KAFKA_ENV_VARS.SSL_CA}`],
      cert: process.env[`${envPrefix}${KAFKA_ENV_VARS.SSL_CERT}`],
      key: process.env[`${envPrefix}${KAFKA_ENV_VARS.SSL_KEY}`],
      passphrase: process.env[`${envPrefix}${KAFKA_ENV_VARS.SSL_PASSPHRASE}`],
      rejectUnauthorized: process.env[`${envPrefix}${KAFKA_ENV_VARS.SSL_REJECT_UNAUTHORIZED}`] !== 'false',
    };
  } else if (sslEnabled === 'false') {
    ssl = false;
  }
  
  // SASL configuration
  let sasl: KafkaSASLConfig | undefined;
  const saslMechanism = process.env[`${envPrefix}${KAFKA_ENV_VARS.SASL_MECHANISM}`] as 
    'plain' | 'scram-sha-256' | 'scram-sha-512' | 'aws' | undefined;
  
  if (saslMechanism) {
    sasl = {
      mechanism: saslMechanism,
      username: process.env[`${envPrefix}${KAFKA_ENV_VARS.SASL_USERNAME}`],
      password: process.env[`${envPrefix}${KAFKA_ENV_VARS.SASL_PASSWORD}`],
      authorizationIdentity: process.env[`${envPrefix}${KAFKA_ENV_VARS.SASL_AUTH_IDENTITY}`],
    };
  }
  
  // Retry configuration
  const retry: KafkaRetryConfig = {
    maxRetryTime: process.env[`${envPrefix}${KAFKA_ENV_VARS.RETRY_MAX_TIME}`] ? 
      parseInt(process.env[`${envPrefix}${KAFKA_ENV_VARS.RETRY_MAX_TIME}`] as string, 10) : 
      DEFAULT_CLIENT_CONFIG.retry?.maxRetryTime,
    initialRetryTime: process.env[`${envPrefix}${KAFKA_ENV_VARS.RETRY_INITIAL_TIME}`] ? 
      parseInt(process.env[`${envPrefix}${KAFKA_ENV_VARS.RETRY_INITIAL_TIME}`] as string, 10) : 
      DEFAULT_CLIENT_CONFIG.retry?.initialRetryTime,
    factor: process.env[`${envPrefix}${KAFKA_ENV_VARS.RETRY_FACTOR}`] ? 
      parseFloat(process.env[`${envPrefix}${KAFKA_ENV_VARS.RETRY_FACTOR}`] as string) : 
      DEFAULT_CLIENT_CONFIG.retry?.factor,
    multiplier: process.env[`${envPrefix}${KAFKA_ENV_VARS.RETRY_MULTIPLIER}`] ? 
      parseFloat(process.env[`${envPrefix}${KAFKA_ENV_VARS.RETRY_MULTIPLIER}`] as string) : 
      DEFAULT_CLIENT_CONFIG.retry?.multiplier,
    retries: process.env[`${envPrefix}${KAFKA_ENV_VARS.RETRY_RETRIES}`] ? 
      parseInt(process.env[`${envPrefix}${KAFKA_ENV_VARS.RETRY_RETRIES}`] as string, 10) : 
      DEFAULT_CLIENT_CONFIG.retry?.retries,
  };
  
  const config: KafkaClientConfig = {
    clientId: clientId as string,
    brokers,
    connectionTimeout,
    requestTimeout,
    retry,
  };
  
  if (ssl) {
    config.ssl = ssl;
  }
  
  if (sasl) {
    config.sasl = sasl;
  }
  
  return config;
}

/**
 * Loads Kafka consumer configuration from environment variables
 * @param prefix Optional prefix for environment variables (for journey-specific configuration)
 * @returns Kafka consumer configuration
 */
export function loadKafkaConsumerConfigFromEnv(prefix = ''): KafkaConsumerConfig | undefined {
  const envPrefix = prefix ? `${prefix}_` : '';
  
  const groupId = process.env[`${envPrefix}${KAFKA_ENV_VARS.CONSUMER_GROUP_ID}`];
  
  if (!groupId) {
    return undefined;
  }
  
  return {
    groupId,
    maxBytes: process.env[`${envPrefix}${KAFKA_ENV_VARS.CONSUMER_MAX_BYTES}`] ? 
      parseInt(process.env[`${envPrefix}${KAFKA_ENV_VARS.CONSUMER_MAX_BYTES}`] as string, 10) : 
      DEFAULT_CONSUMER_CONFIG.maxBytes,
    minBytes: process.env[`${envPrefix}${KAFKA_ENV_VARS.CONSUMER_MIN_BYTES}`] ? 
      parseInt(process.env[`${envPrefix}${KAFKA_ENV_VARS.CONSUMER_MIN_BYTES}`] as string, 10) : 
      DEFAULT_CONSUMER_CONFIG.minBytes,
    maxWaitTimeInMs: process.env[`${envPrefix}${KAFKA_ENV_VARS.CONSUMER_MAX_WAIT_TIME}`] ? 
      parseInt(process.env[`${envPrefix}${KAFKA_ENV_VARS.CONSUMER_MAX_WAIT_TIME}`] as string, 10) : 
      DEFAULT_CONSUMER_CONFIG.maxWaitTimeInMs,
    readUncommitted: process.env[`${envPrefix}${KAFKA_ENV_VARS.CONSUMER_READ_UNCOMMITTED}`] === 'true',
    allowAutoTopicCreation: process.env[`${envPrefix}${KAFKA_ENV_VARS.CONSUMER_ALLOW_AUTO_TOPIC_CREATION}`] === 'true',
  };
}

/**
 * Loads Kafka producer configuration from environment variables
 * @param prefix Optional prefix for environment variables (for journey-specific configuration)
 * @returns Kafka producer configuration
 */
export function loadKafkaProducerConfigFromEnv(prefix = ''): KafkaProducerConfig | undefined {
  const envPrefix = prefix ? `${prefix}_` : '';
  
  // Check if any producer-specific environment variables are set
  const hasProducerConfig = [
    KAFKA_ENV_VARS.PRODUCER_ALLOW_AUTO_TOPIC_CREATION,
    KAFKA_ENV_VARS.PRODUCER_COMPRESSION,
    KAFKA_ENV_VARS.PRODUCER_METADATA_MAX_AGE,
    KAFKA_ENV_VARS.PRODUCER_ACKS,
  ].some(key => process.env[`${envPrefix}${key}`] !== undefined);
  
  if (!hasProducerConfig) {
    return undefined;
  }
  
  return {
    allowAutoTopicCreation: process.env[`${envPrefix}${KAFKA_ENV_VARS.PRODUCER_ALLOW_AUTO_TOPIC_CREATION}`] === 'true',
    compression: (process.env[`${envPrefix}${KAFKA_ENV_VARS.PRODUCER_COMPRESSION}`] || DEFAULT_PRODUCER_CONFIG.compression) as 'none' | 'gzip' | 'snappy' | 'lz4',
    metadataMaxAge: process.env[`${envPrefix}${KAFKA_ENV_VARS.PRODUCER_METADATA_MAX_AGE}`] ? 
      parseInt(process.env[`${envPrefix}${KAFKA_ENV_VARS.PRODUCER_METADATA_MAX_AGE}`] as string, 10) : 
      DEFAULT_PRODUCER_CONFIG.metadataMaxAge,
    acks: process.env[`${envPrefix}${KAFKA_ENV_VARS.PRODUCER_ACKS}`] ? 
      (process.env[`${envPrefix}${KAFKA_ENV_VARS.PRODUCER_ACKS}`] === 'all' ? 'all' : parseInt(process.env[`${envPrefix}${KAFKA_ENV_VARS.PRODUCER_ACKS}`] as string, 10)) : 
      DEFAULT_PRODUCER_CONFIG.acks,
  };
}

/**
 * Loads Kafka run configuration from environment variables
 * @param prefix Optional prefix for environment variables (for journey-specific configuration)
 * @returns Kafka run configuration
 */
export function loadKafkaRunConfigFromEnv(prefix = ''): KafkaRunConfig | undefined {
  const envPrefix = prefix ? `${prefix}_` : '';
  
  // Check if any run-specific environment variables are set
  const hasRunConfig = [
    KAFKA_ENV_VARS.RUN_AUTO_COMMIT,
    KAFKA_ENV_VARS.RUN_AUTO_COMMIT_INTERVAL,
    KAFKA_ENV_VARS.RUN_BATCH_SIZE,
    KAFKA_ENV_VARS.RUN_CONCURRENCY,
    KAFKA_ENV_VARS.RUN_PARTITIONS_CONSUMED_CONCURRENTLY,
  ].some(key => process.env[`${envPrefix}${key}`] !== undefined);
  
  if (!hasRunConfig) {
    return undefined;
  }
  
  let autoCommitInterval: number | null | undefined = DEFAULT_RUN_CONFIG.autoCommitInterval;
  
  if (process.env[`${envPrefix}${KAFKA_ENV_VARS.RUN_AUTO_COMMIT_INTERVAL}`] === 'null') {
    autoCommitInterval = null;
  } else if (process.env[`${envPrefix}${KAFKA_ENV_VARS.RUN_AUTO_COMMIT_INTERVAL}`]) {
    autoCommitInterval = parseInt(process.env[`${envPrefix}${KAFKA_ENV_VARS.RUN_AUTO_COMMIT_INTERVAL}`] as string, 10);
  }
  
  return {
    autoCommit: process.env[`${envPrefix}${KAFKA_ENV_VARS.RUN_AUTO_COMMIT}`] === 'true',
    autoCommitInterval,
    batchSize: process.env[`${envPrefix}${KAFKA_ENV_VARS.RUN_BATCH_SIZE}`] ? 
      parseInt(process.env[`${envPrefix}${KAFKA_ENV_VARS.RUN_BATCH_SIZE}`] as string, 10) : 
      DEFAULT_RUN_CONFIG.batchSize,
    concurrency: process.env[`${envPrefix}${KAFKA_ENV_VARS.RUN_CONCURRENCY}`] ? 
      parseInt(process.env[`${envPrefix}${KAFKA_ENV_VARS.RUN_CONCURRENCY}`] as string, 10) : 
      DEFAULT_RUN_CONFIG.concurrency,
    partitionsConsumedConcurrently: process.env[`${envPrefix}${KAFKA_ENV_VARS.RUN_PARTITIONS_CONSUMED_CONCURRENTLY}`] ? 
      parseInt(process.env[`${envPrefix}${KAFKA_ENV_VARS.RUN_PARTITIONS_CONSUMED_CONCURRENTLY}`] as string, 10) : 
      DEFAULT_RUN_CONFIG.partitionsConsumedConcurrently,
  };
}

/**
 * Loads complete Kafka configuration from environment variables
 * @param journeyName Optional journey name for journey-specific configuration
 * @returns Complete Kafka configuration
 */
export function loadKafkaConfigFromEnv(journeyName?: 'health' | 'care' | 'plan'): KafkaConfig {
  const prefix = journeyName ? `${KAFKA_ENV_VARS.JOURNEY_PREFIX}${journeyName.toUpperCase()}` : '';
  
  const client = loadKafkaClientConfigFromEnv(prefix);
  const consumer = loadKafkaConsumerConfigFromEnv(prefix);
  const producer = loadKafkaProducerConfigFromEnv(prefix);
  const run = loadKafkaRunConfigFromEnv(prefix);
  
  const config: KafkaConfig = { client };
  
  if (consumer) {
    config.consumer = consumer;
  }
  
  if (producer) {
    config.producer = producer;
  }
  
  if (run) {
    config.run = run;
  }
  
  return config;
}

/**
 * Validates Kafka configuration against schema
 * @param config Kafka configuration to validate
 * @returns Validated Kafka configuration
 * @throws Error if validation fails
 */
export function validateKafkaConfig(config: KafkaConfig): KafkaConfig {
  // Ensure client configuration exists
  if (!config || !config.client) {
    throw new Error('Invalid Kafka configuration: client configuration is required');
  }
  
  // Ensure brokers are specified
  if (!config.client.brokers || config.client.brokers.length === 0) {
    throw new Error('Invalid Kafka configuration: at least one broker must be specified');
  }
  
  // Validate against schema
  const { error, value } = kafkaConfigSchema.validate(config, { 
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });
  
  if (error) {
    const details = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Invalid Kafka configuration: ${details}`);
  }
  
  // Additional validation for SASL configuration
  if (value.client.sasl) {
    const { mechanism, username, password, authorizationIdentity } = value.client.sasl;
    
    if ((mechanism === 'plain' || mechanism === 'scram-sha-256' || mechanism === 'scram-sha-512') && 
        (!username || !password)) {
      throw new Error(`Invalid Kafka configuration: username and password are required for ${mechanism} mechanism`);
    }
    
    if (mechanism === 'aws' && !authorizationIdentity) {
      throw new Error('Invalid Kafka configuration: authorizationIdentity is required for aws mechanism');
    }
  }
  
  return value;
}

/**
 * Creates Kafka options for NestJS microservices
 * @param config Kafka configuration
 * @returns Kafka options for NestJS microservices
 */
export function createKafkaOptions(config: KafkaConfig): KafkaOptions {
  return {
    transport: Transport.KAFKA,
    options: config,
  };
}

/**
 * Creates Kafka options for NestJS microservices from environment variables
 * @param journeyName Optional journey name for journey-specific configuration
 * @returns Kafka options for NestJS microservices
 */
export function createKafkaOptionsFromEnv(journeyName?: 'health' | 'care' | 'plan'): KafkaOptions {
  const config = loadKafkaConfigFromEnv(journeyName);
  const validatedConfig = validateKafkaConfig(config);
  
  return createKafkaOptions(validatedConfig);
}

/**
 * Factory function for creating Kafka options for NestJS ConfigModule
 * @param journeyName Optional journey name for journey-specific configuration
 * @returns Factory function for Kafka options
 */
export function kafkaConfigFactory(journeyName?: 'health' | 'care' | 'plan') {
  return () => {
    const config = loadKafkaConfigFromEnv(journeyName);
    return validateKafkaConfig(config);
  };
}

/**
 * Registers Kafka configuration with NestJS ConfigModule
 * @param journeyName Optional journey name for journey-specific configuration
 * @returns ConfigModule with Kafka configuration
 */
export function registerKafkaConfig(journeyName?: 'health' | 'care' | 'plan') {
  return {
    provide: 'KAFKA_CONFIG',
    useFactory: kafkaConfigFactory(journeyName),
  };
}

/**
 * Checks if Kafka configuration is valid and all required brokers are available
 * @param config Kafka configuration to check
 * @returns True if configuration is valid, false otherwise
 */
export function isKafkaConfigValid(config: KafkaConfig): boolean {
  try {
    validateKafkaConfig(config);
    
    // Check if brokers are specified
    if (!config.client.brokers || config.client.brokers.length === 0) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Standard topic naming convention for journey-specific topics
 * @param journey Journey name
 * @param eventType Event type
 * @returns Standardized topic name
 */
export function getJourneyTopic(journey: 'health' | 'care' | 'plan', eventType: string): string {
  return `austa.${journey}.${eventType}`;
}

/**
 * Gets all topics for a specific journey
 * @param journey Journey name
 * @param config Kafka configuration
 * @returns Array of topics for the specified journey
 */
export function getJourneyTopics(journey: 'health' | 'care' | 'plan', config?: KafkaConfig): string[] {
  if (!config || !config.subscribe) {
    return [];
  }
  
  return config.subscribe
    .filter(sub => sub.journey === journey || sub.journey === 'common')
    .map(sub => sub.topic);
}

/**
 * Standard journey-specific Kafka configuration
 * @param journey Journey name
 * @param additionalConfig Additional configuration to merge
 * @returns Journey-specific Kafka configuration
 */
export function createJourneyKafkaConfig(journey: 'health' | 'care' | 'plan', additionalConfig?: Partial<KafkaConfig>): KafkaConfig {
  // Load base configuration from environment
  const baseConfig = loadKafkaConfigFromEnv(journey);
  
  // Default journey-specific client ID if not provided
  if (!baseConfig.client.clientId.includes(journey)) {
    baseConfig.client.clientId = `austa-${journey}-${baseConfig.client.clientId}`;
  }
  
  // Default journey-specific consumer group if not provided
  if (baseConfig.consumer && !baseConfig.consumer.groupId.includes(journey)) {
    baseConfig.consumer.groupId = `austa-${journey}-${baseConfig.consumer.groupId}`;
  }
  
  // Merge with additional configuration if provided
  if (additionalConfig) {
    return mergeKafkaConfigs(baseConfig, additionalConfig);
  }
  
  return baseConfig;
}

/**
 * Creates Kafka configuration for the gamification engine
 * This configuration subscribes to all journey topics to process events for achievements
 * @param additionalConfig Additional configuration to merge
 * @returns Gamification engine Kafka configuration
 */
export function createGamificationKafkaConfig(additionalConfig?: Partial<KafkaConfig>): KafkaConfig {
  // Load base configuration from environment
  const baseConfig = loadKafkaConfigFromEnv();
  
  // Set gamification-specific client ID
  baseConfig.client.clientId = 'austa-gamification-engine';
  
  // Set gamification-specific consumer group
  if (baseConfig.consumer) {
    baseConfig.consumer.groupId = 'austa-gamification-consumers';
  } else {
    baseConfig.consumer = {
      groupId: 'austa-gamification-consumers',
      ...DEFAULT_CONSUMER_CONFIG,
    };
  }
  
  // Subscribe to all journey topics
  const defaultSubscriptions: KafkaSubscribeConfig[] = [
    { topic: 'austa.health.events', journey: 'health' },
    { topic: 'austa.care.events', journey: 'care' },
    { topic: 'austa.plan.events', journey: 'plan' },
    { topic: 'austa.user.events', journey: 'common' },
    { topic: 'austa.game.events', journey: 'common' },
  ];
  
  baseConfig.subscribe = baseConfig.subscribe || [];
  
  // Add default subscriptions if they don't already exist
  for (const sub of defaultSubscriptions) {
    if (!baseConfig.subscribe.some(existing => existing.topic === sub.topic)) {
      baseConfig.subscribe.push(sub);
    }
  }
  
  // Merge with additional configuration if provided
  if (additionalConfig) {
    return mergeKafkaConfigs(baseConfig, additionalConfig);
  }
  
  return baseConfig;
}

/**
 * Creates Kafka configuration for the notification service
 * This configuration subscribes to notification topics from all journeys
 * @param additionalConfig Additional configuration to merge
 * @returns Notification service Kafka configuration
 */
export function createNotificationKafkaConfig(additionalConfig?: Partial<KafkaConfig>): KafkaConfig {
  // Load base configuration from environment
  const baseConfig = loadKafkaConfigFromEnv();
  
  // Set notification-specific client ID
  baseConfig.client.clientId = 'austa-notification-service';
  
  // Set notification-specific consumer group
  if (baseConfig.consumer) {
    baseConfig.consumer.groupId = 'austa-notification-consumers';
  } else {
    baseConfig.consumer = {
      groupId: 'austa-notification-consumers',
      ...DEFAULT_CONSUMER_CONFIG,
    };
  }
  
  // Subscribe to notification topics from all journeys
  const defaultSubscriptions: KafkaSubscribeConfig[] = [
    { topic: 'austa.notifications.health', journey: 'health' },
    { topic: 'austa.notifications.care', journey: 'care' },
    { topic: 'austa.notifications.plan', journey: 'plan' },
    { topic: 'austa.notifications.user', journey: 'common' },
    { topic: 'austa.notifications.achievements', journey: 'common' },
    { topic: 'austa.notifications.dlq', journey: 'common' }, // Dead letter queue for failed notifications
  ];
  
  baseConfig.subscribe = baseConfig.subscribe || [];
  
  // Add default subscriptions if they don't already exist
  for (const sub of defaultSubscriptions) {
    if (!baseConfig.subscribe.some(existing => existing.topic === sub.topic)) {
      baseConfig.subscribe.push(sub);
    }
  }
  
  // Configure retry settings for notification service
  if (!baseConfig.client.retry) {
    baseConfig.client.retry = { ...DEFAULT_CLIENT_CONFIG.retry };
  }
  
  // Notifications need more aggressive retry settings
  baseConfig.client.retry.retries = 10;
  baseConfig.client.retry.maxRetryTime = 60000; // 1 minute
  
  // Merge with additional configuration if provided
  if (additionalConfig) {
    return mergeKafkaConfigs(baseConfig, additionalConfig);
  }
  
  return baseConfig;
}

/**
 * Creates Kafka configuration for the API gateway
 * This configuration is primarily for producing events, not consuming
 * @param additionalConfig Additional configuration to merge
 * @returns API gateway Kafka configuration
 */
export function createApiGatewayKafkaConfig(additionalConfig?: Partial<KafkaConfig>): KafkaConfig {
  // Load base configuration from environment
  const baseConfig = loadKafkaConfigFromEnv();
  
  // Set API gateway-specific client ID
  baseConfig.client.clientId = 'austa-api-gateway';
  
  // API Gateway primarily produces events, not consumes them
  // So we focus on producer configuration
  if (!baseConfig.producer) {
    baseConfig.producer = { ...DEFAULT_PRODUCER_CONFIG };
  }
  
  // Ensure we have acknowledgement from all replicas for reliability
  baseConfig.producer.acks = 'all';
  
  // Configure retry settings for API gateway
  if (!baseConfig.client.retry) {
    baseConfig.client.retry = { ...DEFAULT_CLIENT_CONFIG.retry };
  }
  
  // API Gateway needs reliable event production
  baseConfig.client.retry.retries = 5;
  baseConfig.client.retry.maxRetryTime = 30000; // 30 seconds
  
  // Merge with additional configuration if provided
  if (additionalConfig) {
    return mergeKafkaConfigs(baseConfig, additionalConfig);
  }
  
  return baseConfig;
}

/**
 * Merges two Kafka configurations
 * @param baseConfig Base Kafka configuration
 * @param overrideConfig Override Kafka configuration
 * @returns Merged Kafka configuration
 */
export function mergeKafkaConfigs(baseConfig: KafkaConfig, overrideConfig: Partial<KafkaConfig>): KafkaConfig {
  return {
    ...baseConfig,
    ...overrideConfig,
    client: {
      ...baseConfig.client,
      ...overrideConfig.client,
      retry: {
        ...baseConfig.client.retry,
        ...overrideConfig.client?.retry,
      },
    },
    consumer: overrideConfig.consumer || baseConfig.consumer ? {
      ...baseConfig.consumer,
      ...overrideConfig.consumer,
    } : undefined,
    producer: overrideConfig.producer || baseConfig.producer ? {
      ...baseConfig.producer,
      ...overrideConfig.producer,
    } : undefined,
    run: overrideConfig.run || baseConfig.run ? {
      ...baseConfig.run,
      ...overrideConfig.run,
    } : undefined,
    subscribe: [
      ...(baseConfig.subscribe || []),
      ...(overrideConfig.subscribe || []),
    ],
  };
}

/**
 * Creates Kafka configuration for testing purposes
 * This configuration uses in-memory Kafka for unit tests
 * @param serviceName Name of the service being tested
 * @returns Test Kafka configuration
 */
export function createTestKafkaConfig(serviceName: string): KafkaConfig {
  return {
    client: {
      clientId: `test-${serviceName}`,
      brokers: ['localhost:9092'], // This should be overridden by test setup
      connectionTimeout: 1000,
      requestTimeout: 5000,
      retry: {
        initialRetryTime: 100,
        maxRetryTime: 1000,
        factor: 0.1,
        multiplier: 1.5,
        retries: 3,
      },
    },
    consumer: {
      groupId: `test-${serviceName}-group`,
      maxBytes: 10485760, // 10MB
      minBytes: 1,
      maxWaitTimeInMs: 1000,
      readUncommitted: true,
      allowAutoTopicCreation: true,
    },
    producer: {
      allowAutoTopicCreation: true,
      compression: 'none',
      metadataMaxAge: 30000, // 30 seconds
      acks: 1, // Only wait for leader acknowledgement in tests
    },
    run: {
      autoCommit: true,
      autoCommitInterval: 1000,
      batchSize: 10,
      concurrency: 5,
      partitionsConsumedConcurrently: 1,
    },
  };
}