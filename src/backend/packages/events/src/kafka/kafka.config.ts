import * as Joi from 'joi';
import { Logger } from '@nestjs/common';

/**
 * Kafka broker configuration options
 */
export interface KafkaBrokerConfig {
  /** List of Kafka broker addresses in the format host:port */
  brokers: string[];
  /** Client ID used to identify this application to the Kafka cluster */
  clientId: string;
  /** SSL configuration for secure connections */
  ssl?: boolean;
  /** SASL authentication configuration */
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
  /** Connection timeout in milliseconds */
  connectionTimeout?: number;
  /** Authentication timeout in milliseconds */
  authenticationTimeout?: number;
}

/**
 * Kafka consumer configuration options
 */
export interface KafkaConsumerConfig {
  /** Consumer group ID */
  groupId: string;
  /** Maximum number of messages to process in a batch */
  maxBatchSize?: number;
  /** Maximum number of bytes to fetch in a batch */
  maxBatchSizeInBytes?: number;
  /** Minimum number of bytes to fetch in a batch */
  minBatchSizeInBytes?: number;
  /** Maximum time to wait for a batch to fill up (in milliseconds) */
  maxWaitTimeInMs?: number;
  /** Whether to automatically commit offsets */
  autoCommit?: boolean;
  /** Interval for auto-committing offsets (in milliseconds) */
  autoCommitInterval?: number;
  /** Maximum number of retries for failed messages */
  maxRetries?: number;
  /** Initial retry delay in milliseconds */
  initialRetryTime?: number;
  /** Factor by which to multiply retry time on each retry */
  retryFactor?: number;
  /** Maximum retry time in milliseconds */
  maxRetryTime?: number;
  /** Whether to retry non-retriable errors */
  retryNonRetriableErrors?: boolean;
  /** Dead letter queue topic suffix */
  dlqSuffix?: string;
}

/**
 * Kafka producer configuration options
 */
export interface KafkaProducerConfig {
  /** Whether to wait for acknowledgment from all replicas */
  requireAllAcks?: boolean;
  /** Timeout for acknowledgments in milliseconds */
  ackTimeoutMs?: number;
  /** Maximum number of retries for failed messages */
  maxRetries?: number;
  /** Initial retry delay in milliseconds */
  initialRetryTime?: number;
  /** Factor by which to multiply retry time on each retry */
  retryFactor?: number;
  /** Maximum retry time in milliseconds */
  maxRetryTime?: number;
  /** Whether to retry non-retriable errors */
  retryNonRetriableErrors?: boolean;
  /** Compression type for messages */
  compression?: 'none' | 'gzip' | 'snappy' | 'lz4';
  /** Batch size in bytes */
  batchSize?: number;
  /** Batch linger time in milliseconds */
  lingerMs?: number;
  /** Whether to use idempotent production */
  idempotent?: boolean;
}

/**
 * Journey-specific Kafka configuration
 */
export interface JourneyKafkaConfig {
  /** Topics specific to this journey */
  topics: {
    /** Main event topic for this journey */
    events: string;
    /** Dead letter queue topic for this journey */
    dlq: string;
    /** Retry topic for this journey */
    retry?: string;
  };
  /** Consumer group ID prefix for this journey */
  consumerGroupPrefix: string;
  /** Journey-specific producer configuration overrides */
  producer?: Partial<KafkaProducerConfig>;
  /** Journey-specific consumer configuration overrides */
  consumer?: Partial<KafkaConsumerConfig>;
}

/**
 * Complete Kafka configuration for the application
 */
export interface KafkaConfig {
  /** Broker configuration */
  broker: KafkaBrokerConfig;
  /** Default consumer configuration */
  consumer: KafkaConsumerConfig;
  /** Default producer configuration */
  producer: KafkaProducerConfig;
  /** Health journey specific configuration */
  healthJourney: JourneyKafkaConfig;
  /** Care journey specific configuration */
  careJourney: JourneyKafkaConfig;
  /** Plan journey specific configuration */
  planJourney: JourneyKafkaConfig;
  /** Gamification specific configuration */
  gamification: JourneyKafkaConfig;
  /** Notification specific configuration */
  notification: JourneyKafkaConfig;
}

/**
 * Default Kafka configuration values
 */
export const DEFAULT_KAFKA_CONFIG: KafkaConfig = {
  broker: {
    brokers: ['localhost:9092'],
    clientId: 'austa-superapp',
    connectionTimeout: 3000,
    authenticationTimeout: 1000,
  },
  consumer: {
    groupId: 'austa-default-group',
    maxBatchSize: 100,
    maxBatchSizeInBytes: 10485760, // 10MB
    minBatchSizeInBytes: 1024, // 1KB
    maxWaitTimeInMs: 5000,
    autoCommit: true,
    autoCommitInterval: 5000,
    maxRetries: 5,
    initialRetryTime: 100,
    retryFactor: 2,
    maxRetryTime: 30000,
    retryNonRetriableErrors: false,
    dlqSuffix: '.dlq',
  },
  producer: {
    requireAllAcks: true,
    ackTimeoutMs: 5000,
    maxRetries: 5,
    initialRetryTime: 100,
    retryFactor: 2,
    maxRetryTime: 30000,
    retryNonRetriableErrors: false,
    compression: 'snappy',
    batchSize: 16384, // 16KB
    lingerMs: 5,
    idempotent: true,
  },
  healthJourney: {
    topics: {
      events: 'health.events',
      dlq: 'health.events.dlq',
      retry: 'health.events.retry',
    },
    consumerGroupPrefix: 'health-service',
    consumer: {
      // Health-specific consumer overrides
      maxRetries: 3,
    },
    producer: {
      // Health-specific producer overrides
    },
  },
  careJourney: {
    topics: {
      events: 'care.events',
      dlq: 'care.events.dlq',
      retry: 'care.events.retry',
    },
    consumerGroupPrefix: 'care-service',
    consumer: {
      // Care-specific consumer overrides
    },
    producer: {
      // Care-specific producer overrides
    },
  },
  planJourney: {
    topics: {
      events: 'plan.events',
      dlq: 'plan.events.dlq',
      retry: 'plan.events.retry',
    },
    consumerGroupPrefix: 'plan-service',
    consumer: {
      // Plan-specific consumer overrides
    },
    producer: {
      // Plan-specific producer overrides
    },
  },
  gamification: {
    topics: {
      events: 'gamification.events',
      dlq: 'gamification.events.dlq',
      retry: 'gamification.events.retry',
    },
    consumerGroupPrefix: 'gamification-engine',
    consumer: {
      // Gamification-specific consumer overrides
      maxRetries: 10, // More retries for gamification events to ensure they're processed
    },
    producer: {
      // Gamification-specific producer overrides
    },
  },
  notification: {
    topics: {
      events: 'notification.events',
      dlq: 'notification.events.dlq',
      retry: 'notification.events.retry',
    },
    consumerGroupPrefix: 'notification-service',
    consumer: {
      // Notification-specific consumer overrides
    },
    producer: {
      // Notification-specific producer overrides
    },
  },
};

/**
 * Environment variable names for Kafka configuration
 */
export const KAFKA_ENV_VARS = {
  BROKER_LIST: 'KAFKA_BROKERS',
  CLIENT_ID: 'KAFKA_CLIENT_ID',
  SSL_ENABLED: 'KAFKA_SSL_ENABLED',
  SASL_MECHANISM: 'KAFKA_SASL_MECHANISM',
  SASL_USERNAME: 'KAFKA_SASL_USERNAME',
  SASL_PASSWORD: 'KAFKA_SASL_PASSWORD',
  CONNECTION_TIMEOUT: 'KAFKA_CONNECTION_TIMEOUT',
  AUTHENTICATION_TIMEOUT: 'KAFKA_AUTHENTICATION_TIMEOUT',
  CONSUMER_GROUP_ID: 'KAFKA_CONSUMER_GROUP_ID',
  CONSUMER_MAX_BATCH_SIZE: 'KAFKA_CONSUMER_MAX_BATCH_SIZE',
  CONSUMER_MAX_RETRIES: 'KAFKA_CONSUMER_MAX_RETRIES',
  CONSUMER_INITIAL_RETRY_TIME: 'KAFKA_CONSUMER_INITIAL_RETRY_TIME',
  CONSUMER_RETRY_FACTOR: 'KAFKA_CONSUMER_RETRY_FACTOR',
  CONSUMER_MAX_RETRY_TIME: 'KAFKA_CONSUMER_MAX_RETRY_TIME',
  PRODUCER_ACKS: 'KAFKA_PRODUCER_ACKS',
  PRODUCER_MAX_RETRIES: 'KAFKA_PRODUCER_MAX_RETRIES',
  PRODUCER_COMPRESSION: 'KAFKA_PRODUCER_COMPRESSION',
  PRODUCER_BATCH_SIZE: 'KAFKA_PRODUCER_BATCH_SIZE',
  PRODUCER_LINGER_MS: 'KAFKA_PRODUCER_LINGER_MS',
  // Journey-specific environment variables
  HEALTH_EVENTS_TOPIC: 'KAFKA_HEALTH_EVENTS_TOPIC',
  HEALTH_DLQ_TOPIC: 'KAFKA_HEALTH_DLQ_TOPIC',
  HEALTH_RETRY_TOPIC: 'KAFKA_HEALTH_RETRY_TOPIC',
  HEALTH_CONSUMER_GROUP_PREFIX: 'KAFKA_HEALTH_CONSUMER_GROUP_PREFIX',
  CARE_EVENTS_TOPIC: 'KAFKA_CARE_EVENTS_TOPIC',
  CARE_DLQ_TOPIC: 'KAFKA_CARE_DLQ_TOPIC',
  CARE_RETRY_TOPIC: 'KAFKA_CARE_RETRY_TOPIC',
  CARE_CONSUMER_GROUP_PREFIX: 'KAFKA_CARE_CONSUMER_GROUP_PREFIX',
  PLAN_EVENTS_TOPIC: 'KAFKA_PLAN_EVENTS_TOPIC',
  PLAN_DLQ_TOPIC: 'KAFKA_PLAN_DLQ_TOPIC',
  PLAN_RETRY_TOPIC: 'KAFKA_PLAN_RETRY_TOPIC',
  PLAN_CONSUMER_GROUP_PREFIX: 'KAFKA_PLAN_CONSUMER_GROUP_PREFIX',
  GAMIFICATION_EVENTS_TOPIC: 'KAFKA_GAMIFICATION_EVENTS_TOPIC',
  GAMIFICATION_DLQ_TOPIC: 'KAFKA_GAMIFICATION_DLQ_TOPIC',
  GAMIFICATION_RETRY_TOPIC: 'KAFKA_GAMIFICATION_RETRY_TOPIC',
  GAMIFICATION_CONSUMER_GROUP_PREFIX: 'KAFKA_GAMIFICATION_CONSUMER_GROUP_PREFIX',
  NOTIFICATION_EVENTS_TOPIC: 'KAFKA_NOTIFICATION_EVENTS_TOPIC',
  NOTIFICATION_DLQ_TOPIC: 'KAFKA_NOTIFICATION_DLQ_TOPIC',
  NOTIFICATION_RETRY_TOPIC: 'KAFKA_NOTIFICATION_RETRY_TOPIC',
  NOTIFICATION_CONSUMER_GROUP_PREFIX: 'KAFKA_NOTIFICATION_CONSUMER_GROUP_PREFIX',
};

/**
 * Joi validation schema for Kafka broker configuration
 */
export const kafkaBrokerConfigSchema = Joi.object({
  brokers: Joi.array().items(Joi.string()).min(1).required()
    .description('List of Kafka broker addresses in the format host:port'),
  clientId: Joi.string().required()
    .description('Client ID used to identify this application to the Kafka cluster'),
  ssl: Joi.boolean().default(false)
    .description('Whether to use SSL for secure connections'),
  sasl: Joi.object({
    mechanism: Joi.string().valid('plain', 'scram-sha-256', 'scram-sha-512').required()
      .description('SASL authentication mechanism'),
    username: Joi.string().required()
      .description('SASL authentication username'),
    password: Joi.string().required()
      .description('SASL authentication password'),
  }).optional().description('SASL authentication configuration'),
  connectionTimeout: Joi.number().integer().min(1000).max(60000).default(3000)
    .description('Connection timeout in milliseconds'),
  authenticationTimeout: Joi.number().integer().min(100).max(10000).default(1000)
    .description('Authentication timeout in milliseconds'),
});

/**
 * Joi validation schema for Kafka consumer configuration
 */
export const kafkaConsumerConfigSchema = Joi.object({
  groupId: Joi.string().required()
    .description('Consumer group ID'),
  maxBatchSize: Joi.number().integer().min(1).max(1000).default(100)
    .description('Maximum number of messages to process in a batch'),
  maxBatchSizeInBytes: Joi.number().integer().min(1024).max(104857600).default(10485760)
    .description('Maximum number of bytes to fetch in a batch'),
  minBatchSizeInBytes: Joi.number().integer().min(1).max(104857600).default(1024)
    .description('Minimum number of bytes to fetch in a batch'),
  maxWaitTimeInMs: Joi.number().integer().min(100).max(30000).default(5000)
    .description('Maximum time to wait for a batch to fill up (in milliseconds)'),
  autoCommit: Joi.boolean().default(true)
    .description('Whether to automatically commit offsets'),
  autoCommitInterval: Joi.number().integer().min(100).max(60000).default(5000)
    .description('Interval for auto-committing offsets (in milliseconds)'),
  maxRetries: Joi.number().integer().min(0).max(100).default(5)
    .description('Maximum number of retries for failed messages'),
  initialRetryTime: Joi.number().integer().min(10).max(60000).default(100)
    .description('Initial retry delay in milliseconds'),
  retryFactor: Joi.number().min(1).max(10).default(2)
    .description('Factor by which to multiply retry time on each retry'),
  maxRetryTime: Joi.number().integer().min(1000).max(3600000).default(30000)
    .description('Maximum retry time in milliseconds'),
  retryNonRetriableErrors: Joi.boolean().default(false)
    .description('Whether to retry non-retriable errors'),
  dlqSuffix: Joi.string().default('.dlq')
    .description('Dead letter queue topic suffix'),
});

/**
 * Joi validation schema for Kafka producer configuration
 */
export const kafkaProducerConfigSchema = Joi.object({
  requireAllAcks: Joi.boolean().default(true)
    .description('Whether to wait for acknowledgment from all replicas'),
  ackTimeoutMs: Joi.number().integer().min(100).max(60000).default(5000)
    .description('Timeout for acknowledgments in milliseconds'),
  maxRetries: Joi.number().integer().min(0).max(100).default(5)
    .description('Maximum number of retries for failed messages'),
  initialRetryTime: Joi.number().integer().min(10).max(60000).default(100)
    .description('Initial retry delay in milliseconds'),
  retryFactor: Joi.number().min(1).max(10).default(2)
    .description('Factor by which to multiply retry time on each retry'),
  maxRetryTime: Joi.number().integer().min(1000).max(3600000).default(30000)
    .description('Maximum retry time in milliseconds'),
  retryNonRetriableErrors: Joi.boolean().default(false)
    .description('Whether to retry non-retriable errors'),
  compression: Joi.string().valid('none', 'gzip', 'snappy', 'lz4').default('snappy')
    .description('Compression type for messages'),
  batchSize: Joi.number().integer().min(1024).max(10485760).default(16384)
    .description('Batch size in bytes'),
  lingerMs: Joi.number().integer().min(0).max(1000).default(5)
    .description('Batch linger time in milliseconds'),
  idempotent: Joi.boolean().default(true)
    .description('Whether to use idempotent production'),
});

/**
 * Joi validation schema for journey-specific Kafka configuration
 */
export const journeyKafkaConfigSchema = Joi.object({
  topics: Joi.object({
    events: Joi.string().required()
      .description('Main event topic for this journey'),
    dlq: Joi.string().required()
      .description('Dead letter queue topic for this journey'),
    retry: Joi.string().optional()
      .description('Retry topic for this journey'),
  }).required().description('Topics specific to this journey'),
  consumerGroupPrefix: Joi.string().required()
    .description('Consumer group ID prefix for this journey'),
  producer: Joi.object().optional()
    .description('Journey-specific producer configuration overrides'),
  consumer: Joi.object().optional()
    .description('Journey-specific consumer configuration overrides'),
});

/**
 * Joi validation schema for complete Kafka configuration
 */
export const kafkaConfigSchema = Joi.object({
  broker: kafkaBrokerConfigSchema.required()
    .description('Broker configuration'),
  consumer: kafkaConsumerConfigSchema.required()
    .description('Default consumer configuration'),
  producer: kafkaProducerConfigSchema.required()
    .description('Default producer configuration'),
  healthJourney: journeyKafkaConfigSchema.required()
    .description('Health journey specific configuration'),
  careJourney: journeyKafkaConfigSchema.required()
    .description('Care journey specific configuration'),
  planJourney: journeyKafkaConfigSchema.required()
    .description('Plan journey specific configuration'),
  gamification: journeyKafkaConfigSchema.required()
    .description('Gamification specific configuration'),
  notification: journeyKafkaConfigSchema.required()
    .description('Notification specific configuration'),
});

/**
 * Logger instance for Kafka configuration
 */
const logger = new Logger('KafkaConfig');

/**
 * Loads Kafka configuration from environment variables
 * @param env The environment variables object (defaults to process.env)
 * @returns The loaded Kafka configuration
 */
export function loadKafkaConfigFromEnv(env: NodeJS.ProcessEnv = process.env): KafkaConfig {
  const config: KafkaConfig = { ...DEFAULT_KAFKA_CONFIG };

  try {
    // Load broker configuration
    if (env[KAFKA_ENV_VARS.BROKER_LIST]) {
      config.broker.brokers = env[KAFKA_ENV_VARS.BROKER_LIST].split(',');
    }

    if (env[KAFKA_ENV_VARS.CLIENT_ID]) {
      config.broker.clientId = env[KAFKA_ENV_VARS.CLIENT_ID];
    }

    if (env[KAFKA_ENV_VARS.SSL_ENABLED]) {
      config.broker.ssl = env[KAFKA_ENV_VARS.SSL_ENABLED] === 'true';
    }

    // Load SASL configuration if all required variables are present
    if (env[KAFKA_ENV_VARS.SASL_MECHANISM] && 
        env[KAFKA_ENV_VARS.SASL_USERNAME] && 
        env[KAFKA_ENV_VARS.SASL_PASSWORD]) {
      config.broker.sasl = {
        mechanism: env[KAFKA_ENV_VARS.SASL_MECHANISM] as 'plain' | 'scram-sha-256' | 'scram-sha-512',
        username: env[KAFKA_ENV_VARS.SASL_USERNAME],
        password: env[KAFKA_ENV_VARS.SASL_PASSWORD],
      };
    }

    if (env[KAFKA_ENV_VARS.CONNECTION_TIMEOUT]) {
      config.broker.connectionTimeout = parseInt(env[KAFKA_ENV_VARS.CONNECTION_TIMEOUT], 10);
    }

    if (env[KAFKA_ENV_VARS.AUTHENTICATION_TIMEOUT]) {
      config.broker.authenticationTimeout = parseInt(env[KAFKA_ENV_VARS.AUTHENTICATION_TIMEOUT], 10);
    }

    // Load consumer configuration
    if (env[KAFKA_ENV_VARS.CONSUMER_GROUP_ID]) {
      config.consumer.groupId = env[KAFKA_ENV_VARS.CONSUMER_GROUP_ID];
    }

    if (env[KAFKA_ENV_VARS.CONSUMER_MAX_BATCH_SIZE]) {
      config.consumer.maxBatchSize = parseInt(env[KAFKA_ENV_VARS.CONSUMER_MAX_BATCH_SIZE], 10);
    }

    if (env[KAFKA_ENV_VARS.CONSUMER_MAX_RETRIES]) {
      config.consumer.maxRetries = parseInt(env[KAFKA_ENV_VARS.CONSUMER_MAX_RETRIES], 10);
    }

    if (env[KAFKA_ENV_VARS.CONSUMER_INITIAL_RETRY_TIME]) {
      config.consumer.initialRetryTime = parseInt(env[KAFKA_ENV_VARS.CONSUMER_INITIAL_RETRY_TIME], 10);
    }

    if (env[KAFKA_ENV_VARS.CONSUMER_RETRY_FACTOR]) {
      config.consumer.retryFactor = parseFloat(env[KAFKA_ENV_VARS.CONSUMER_RETRY_FACTOR]);
    }

    if (env[KAFKA_ENV_VARS.CONSUMER_MAX_RETRY_TIME]) {
      config.consumer.maxRetryTime = parseInt(env[KAFKA_ENV_VARS.CONSUMER_MAX_RETRY_TIME], 10);
    }

    // Load producer configuration
    if (env[KAFKA_ENV_VARS.PRODUCER_ACKS]) {
      config.producer.requireAllAcks = env[KAFKA_ENV_VARS.PRODUCER_ACKS] === 'all';
    }

    if (env[KAFKA_ENV_VARS.PRODUCER_MAX_RETRIES]) {
      config.producer.maxRetries = parseInt(env[KAFKA_ENV_VARS.PRODUCER_MAX_RETRIES], 10);
    }

    if (env[KAFKA_ENV_VARS.PRODUCER_COMPRESSION]) {
      config.producer.compression = env[KAFKA_ENV_VARS.PRODUCER_COMPRESSION] as 'none' | 'gzip' | 'snappy' | 'lz4';
    }

    if (env[KAFKA_ENV_VARS.PRODUCER_BATCH_SIZE]) {
      config.producer.batchSize = parseInt(env[KAFKA_ENV_VARS.PRODUCER_BATCH_SIZE], 10);
    }

    if (env[KAFKA_ENV_VARS.PRODUCER_LINGER_MS]) {
      config.producer.lingerMs = parseInt(env[KAFKA_ENV_VARS.PRODUCER_LINGER_MS], 10);
    }

    // Load journey-specific configurations
    // Health Journey
    if (env[KAFKA_ENV_VARS.HEALTH_EVENTS_TOPIC]) {
      config.healthJourney.topics.events = env[KAFKA_ENV_VARS.HEALTH_EVENTS_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.HEALTH_DLQ_TOPIC]) {
      config.healthJourney.topics.dlq = env[KAFKA_ENV_VARS.HEALTH_DLQ_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.HEALTH_RETRY_TOPIC]) {
      config.healthJourney.topics.retry = env[KAFKA_ENV_VARS.HEALTH_RETRY_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.HEALTH_CONSUMER_GROUP_PREFIX]) {
      config.healthJourney.consumerGroupPrefix = env[KAFKA_ENV_VARS.HEALTH_CONSUMER_GROUP_PREFIX];
    }

    // Care Journey
    if (env[KAFKA_ENV_VARS.CARE_EVENTS_TOPIC]) {
      config.careJourney.topics.events = env[KAFKA_ENV_VARS.CARE_EVENTS_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.CARE_DLQ_TOPIC]) {
      config.careJourney.topics.dlq = env[KAFKA_ENV_VARS.CARE_DLQ_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.CARE_RETRY_TOPIC]) {
      config.careJourney.topics.retry = env[KAFKA_ENV_VARS.CARE_RETRY_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.CARE_CONSUMER_GROUP_PREFIX]) {
      config.careJourney.consumerGroupPrefix = env[KAFKA_ENV_VARS.CARE_CONSUMER_GROUP_PREFIX];
    }

    // Plan Journey
    if (env[KAFKA_ENV_VARS.PLAN_EVENTS_TOPIC]) {
      config.planJourney.topics.events = env[KAFKA_ENV_VARS.PLAN_EVENTS_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.PLAN_DLQ_TOPIC]) {
      config.planJourney.topics.dlq = env[KAFKA_ENV_VARS.PLAN_DLQ_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.PLAN_RETRY_TOPIC]) {
      config.planJourney.topics.retry = env[KAFKA_ENV_VARS.PLAN_RETRY_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.PLAN_CONSUMER_GROUP_PREFIX]) {
      config.planJourney.consumerGroupPrefix = env[KAFKA_ENV_VARS.PLAN_CONSUMER_GROUP_PREFIX];
    }

    // Gamification
    if (env[KAFKA_ENV_VARS.GAMIFICATION_EVENTS_TOPIC]) {
      config.gamification.topics.events = env[KAFKA_ENV_VARS.GAMIFICATION_EVENTS_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.GAMIFICATION_DLQ_TOPIC]) {
      config.gamification.topics.dlq = env[KAFKA_ENV_VARS.GAMIFICATION_DLQ_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.GAMIFICATION_RETRY_TOPIC]) {
      config.gamification.topics.retry = env[KAFKA_ENV_VARS.GAMIFICATION_RETRY_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.GAMIFICATION_CONSUMER_GROUP_PREFIX]) {
      config.gamification.consumerGroupPrefix = env[KAFKA_ENV_VARS.GAMIFICATION_CONSUMER_GROUP_PREFIX];
    }

    // Notification
    if (env[KAFKA_ENV_VARS.NOTIFICATION_EVENTS_TOPIC]) {
      config.notification.topics.events = env[KAFKA_ENV_VARS.NOTIFICATION_EVENTS_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.NOTIFICATION_DLQ_TOPIC]) {
      config.notification.topics.dlq = env[KAFKA_ENV_VARS.NOTIFICATION_DLQ_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.NOTIFICATION_RETRY_TOPIC]) {
      config.notification.topics.retry = env[KAFKA_ENV_VARS.NOTIFICATION_RETRY_TOPIC];
    }

    if (env[KAFKA_ENV_VARS.NOTIFICATION_CONSUMER_GROUP_PREFIX]) {
      config.notification.consumerGroupPrefix = env[KAFKA_ENV_VARS.NOTIFICATION_CONSUMER_GROUP_PREFIX];
    }

    logger.log('Kafka configuration loaded from environment variables');
  } catch (error) {
    logger.error(`Error loading Kafka configuration from environment: ${error.message}`, error.stack);
    throw new Error(`Failed to load Kafka configuration: ${error.message}`);
  }

  return config;
}

/**
 * Validates the Kafka configuration against the schema
 * @param config The Kafka configuration to validate
 * @returns The validated Kafka configuration
 * @throws Error if validation fails
 */
export function validateKafkaConfig(config: KafkaConfig): KafkaConfig {
  try {
    const { error, value } = kafkaConfigSchema.validate(config, {
      abortEarly: false,
      allowUnknown: false,
    });

    if (error) {
      const errorDetails = error.details.map(detail => detail.message).join(', ');
      logger.error(`Kafka configuration validation failed: ${errorDetails}`);
      throw new Error(`Kafka configuration validation failed: ${errorDetails}`);
    }

    logger.log('Kafka configuration validated successfully');
    return value;
  } catch (error) {
    logger.error(`Error validating Kafka configuration: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Gets the journey-specific Kafka configuration
 * @param config The complete Kafka configuration
 * @param journeyType The journey type ('health', 'care', 'plan', 'gamification', 'notification')
 * @returns The journey-specific Kafka configuration
 */
export function getJourneyKafkaConfig(
  config: KafkaConfig,
  journeyType: 'health' | 'care' | 'plan' | 'gamification' | 'notification',
): JourneyKafkaConfig {
  switch (journeyType) {
    case 'health':
      return config.healthJourney;
    case 'care':
      return config.careJourney;
    case 'plan':
      return config.planJourney;
    case 'gamification':
      return config.gamification;
    case 'notification':
      return config.notification;
    default:
      throw new Error(`Unknown journey type: ${journeyType}`);
  }
}

/**
 * Gets the consumer group ID for a specific journey and consumer name
 * @param config The Kafka configuration
 * @param journeyType The journey type
 * @param consumerName The consumer name
 * @returns The consumer group ID
 */
export function getConsumerGroupId(
  config: KafkaConfig,
  journeyType: 'health' | 'care' | 'plan' | 'gamification' | 'notification',
  consumerName: string,
): string {
  const journeyConfig = getJourneyKafkaConfig(config, journeyType);
  return `${journeyConfig.consumerGroupPrefix}-${consumerName}`;
}

/**
 * Creates a complete Kafka configuration with defaults and environment overrides
 * @param overrides Optional configuration overrides
 * @returns The complete validated Kafka configuration
 */
export function createKafkaConfig(overrides?: Partial<KafkaConfig>): KafkaConfig {
  try {
    // Start with default configuration
    let config = { ...DEFAULT_KAFKA_CONFIG };
    
    // Load environment variables
    config = loadKafkaConfigFromEnv();
    
    // Apply any overrides
    if (overrides) {
      config = {
        ...config,
        ...overrides,
        broker: { ...config.broker, ...overrides.broker },
        consumer: { ...config.consumer, ...overrides.consumer },
        producer: { ...config.producer, ...overrides.producer },
        healthJourney: { ...config.healthJourney, ...overrides.healthJourney },
        careJourney: { ...config.careJourney, ...overrides.careJourney },
        planJourney: { ...config.planJourney, ...overrides.planJourney },
        gamification: { ...config.gamification, ...overrides.gamification },
        notification: { ...config.notification, ...overrides.notification },
      };
    }
    
    // Validate the configuration
    return validateKafkaConfig(config);
  } catch (error) {
    logger.error(`Failed to create Kafka configuration: ${error.message}`, error.stack);
    throw error;
  }
}