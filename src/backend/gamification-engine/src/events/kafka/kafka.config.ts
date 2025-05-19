/**
 * Kafka Configuration for the Gamification Engine
 * 
 * This module centralizes all Kafka configuration for the gamification engine,
 * including broker connection settings, consumer group IDs, topic definitions,
 * security options, and performance tuning parameters.
 * 
 * It provides a typed interface for better maintainability and implements
 * environment-variable based configuration with validation. The configuration
 * is environment-specific, with different settings for development, staging,
 * and production environments.
 * 
 * Usage:
 * 1. Import the kafkaConfig in your module:
 *    ```typescript
 *    import { kafkaConfig } from './events/kafka/kafka.config';
 *    ```
 * 
 * 2. Add it to the ConfigModule:
 *    ```typescript
 *    ConfigModule.forRoot({
 *      load: [kafkaConfig],
 *      // ...
 *    })
 *    ```
 * 
 * 3. Inject and use the configuration:
 *    ```typescript
 *    constructor(private configService: ConfigService) {
 *      const config = this.configService.get<KafkaConfiguration>('kafka');
 *      // Use config...
 *    }
 *    ```
 * 
 * @module kafka.config
 */

import { registerAs } from '@nestjs/config';
import { KafkaConfig, logLevel } from 'kafkajs';

/**
 * Interface for Kafka broker configuration
 * 
 * Represents a single Kafka broker with host, port, and SSL settings.
 * This is used to parse the broker strings from the environment variables.
 */
export interface KafkaBrokerConfig {
  /** Broker hostname */
  host: string;
  /** Broker port */
  port: number;
  /** Whether to use SSL for this broker */
  ssl: boolean;
}

/**
 * Interface for Kafka SASL authentication configuration
 * 
 * Represents the SASL authentication settings for Kafka.
 * Supports PLAIN, SCRAM-SHA-256, and SCRAM-SHA-512 mechanisms.
 */
export interface KafkaSaslConfig {
  /** SASL mechanism (PLAIN, SCRAM-SHA-256, SCRAM-SHA-512) */
  mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
  /** SASL username */
  username: string;
  /** SASL password */
  password: string;
}

/**
 * Interface for Kafka SSL configuration
 * 
 * Represents the SSL settings for Kafka connections.
 * Includes options for certificate validation and custom certificates.
 */
export interface KafkaSslConfig {
  /** Whether to enable SSL */
  enabled: boolean;
  /** Whether to reject unauthorized certificates */
  rejectUnauthorized: boolean;
  /** CA certificate (optional) */
  ca?: string[];
  /** Client key (optional) */
  key?: string;
  /** Client certificate (optional) */
  cert?: string;
}

/**
 * Interface for Kafka topic configuration
 * 
 * Defines the topic names for different event types in the system.
 * Includes topics for each journey (health, care, plan) as well as
 * user events, game events, and dead letter queue prefix.
 */
export interface KafkaTopicConfig {
  /** Health journey events topic */
  healthEvents: string;
  /** Care journey events topic */
  careEvents: string;
  /** Plan journey events topic */
  planEvents: string;
  /** User events topic */
  userEvents: string;
  /** Game events topic */
  gameEvents: string;
  /** Dead letter queue topic prefix */
  dlqPrefix: string;
}

/**
 * Interface for Kafka retry configuration
 * 
 * Defines the retry strategy for Kafka operations.
 * Implements exponential backoff with configurable parameters.
 */
export interface KafkaRetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial retry interval in milliseconds */
  initialRetryTime: number;
  /** Factor by which to increase retry time for exponential backoff */
  factor: number;
  /** Maximum retry time in milliseconds */
  maxRetryTime: number;
  /** Whether to retry indefinitely */
  retryForever: boolean;
}

/**
 * Interface for Kafka consumer configuration
 * 
 * Defines the settings for Kafka consumers, including group ID,
 * fetch behavior, session management, and retry configuration.
 * These settings are critical for reliable message consumption.
 */
export interface KafkaConsumerConfig {
  /** Consumer group ID */
  groupId: string;
  /** Whether to allow auto-creation of topics */
  allowAutoTopicCreation: boolean;
  /** Minimum number of bytes to fetch in a request */
  minBytes: number;
  /** Maximum number of bytes to fetch in a request */
  maxBytes: number;
  /** Maximum wait time in milliseconds for new messages */
  maxWaitTimeInMs: number;
  /** Session timeout in milliseconds */
  sessionTimeout: number;
  /** Heartbeat interval in milliseconds */
  heartbeatInterval: number;
  /** Maximum number of bytes per partition */
  maxBytesPerPartition: number;
  /** Retry configuration */
  retry: KafkaRetryConfig;
  /** Read messages from the beginning of the topic */
  readUncommitted: boolean;
}

/**
 * Interface for Kafka producer configuration
 * 
 * Defines the settings for Kafka producers, including transaction behavior,
 * idempotence, compression, batching, and retry configuration.
 * These settings are critical for reliable message production.
 */
export interface KafkaProducerConfig {
  /** Whether to allow auto-creation of topics */
  allowAutoTopicCreation: boolean;
  /** Transaction timeout in milliseconds */
  transactionTimeout: number;
  /** Maximum in-flight requests */
  maxInFlightRequests: number;
  /** Idempotence enabled */
  idempotent: boolean;
  /** Compression type */
  compression: 'none' | 'gzip' | 'snappy' | 'lz4';
  /** Batch size in bytes */
  batchSize: number;
  /** Batch linger time in milliseconds */
  lingerMs: number;
  /** Retry configuration */
  retry: KafkaRetryConfig;
}

/**
 * Interface for Kafka dead letter queue configuration
 * 
 * Defines the settings for dead letter queues (DLQs), which are used
 * to store messages that could not be processed after multiple attempts.
 * This is critical for reliable event processing and error handling.
 */
export interface KafkaDlqConfig {
  /** Whether to enable dead letter queue */
  enabled: boolean;
  /** Maximum number of attempts before sending to DLQ */
  maxAttempts: number;
  /** Topic suffix for dead letter queue */
  topicSuffix: string;
}

/**
 * Interface for Kafka monitoring configuration
 * 
 * Defines the settings for Kafka monitoring, including whether monitoring
 * is enabled and the interval for metrics collection. This is important
 * for observability and performance tracking in production environments.
 */
export interface KafkaMonitoringConfig {
  /** Whether to enable monitoring */
  enabled: boolean;
  /** Metrics collection interval in milliseconds */
  metricsInterval: number;
}

/**
 * Interface for complete Kafka configuration
 * 
 * This is the main configuration interface that brings together all aspects
 * of Kafka configuration, including client settings, broker information,
 * security, topics, consumer and producer settings, DLQ configuration,
 * monitoring, and logging.
 * 
 * This interface is used throughout the application to ensure type safety
 * and consistent configuration access.
 */
export interface KafkaConfiguration {
  /** Client ID for Kafka connection */
  clientId: string;
  /** Broker addresses */
  brokers: string[];
  /** Parsed broker configurations */
  brokerConfigs: KafkaBrokerConfig[];
  /** SASL authentication configuration */
  sasl: KafkaSaslConfig | null;
  /** SSL configuration */
  ssl: KafkaSslConfig;
  /** Topic configurations */
  topics: KafkaTopicConfig;
  /** Consumer configuration */
  consumer: KafkaConsumerConfig;
  /** Producer configuration */
  producer: KafkaProducerConfig;
  /** Dead letter queue configuration */
  dlq: KafkaDlqConfig;
  /** Monitoring configuration */
  monitoring: KafkaMonitoringConfig;
  /** Log level */
  logLevel: keyof typeof logLevel;
}

/**
 * Parse broker string into host and port
 * 
 * Takes a broker string in the format "host:port" and parses it into
 * a structured KafkaBrokerConfig object with host, port, and SSL settings.
 * 
 * @param broker Broker string in format host:port
 * @param ssl Whether SSL is enabled for this broker
 * @returns Parsed broker config
 * @example
 * // Returns { host: 'localhost', port: 9092, ssl: false }
 * parseBroker('localhost:9092', false);
 */
const parseBroker = (broker: string, ssl: boolean): KafkaBrokerConfig => {
  const [host, portStr] = broker.split(':');
  const port = parseInt(portStr, 10) || 9092;
  return { host, port, ssl };
};

/**
 * Parse broker strings into broker configs
 * 
 * Takes an array of broker strings and parses each one into a
 * KafkaBrokerConfig object. This is useful for processing the
 * KAFKA_BROKERS environment variable.
 * 
 * @param brokers Array of broker strings
 * @param ssl Whether SSL is enabled for these brokers
 * @returns Array of broker configs
 * @example
 * // Returns [{ host: 'localhost', port: 9092, ssl: false }]
 * parseBrokers(['localhost:9092'], false);
 */
const parseBrokers = (brokers: string[], ssl: boolean): KafkaBrokerConfig[] => {
  return brokers.map(broker => parseBroker(broker, ssl));
};

/**
 * Get environment-specific Kafka configuration
 * 
 * Returns a partial Kafka configuration with settings optimized for
 * the specified environment (production, staging, or development).
 * This includes different settings for SSL, consumer and producer
 * behavior, monitoring, and logging.
 * 
 * @param env Environment name ('production', 'staging', 'development')
 * @returns Environment-specific configuration
 * @example
 * // Returns production-optimized configuration
 * getEnvConfig('production');
 */
const getEnvConfig = (env: string): Partial<KafkaConfiguration> => {
  switch (env) {
    case 'production':
      return {
        ssl: {
          enabled: true,
          rejectUnauthorized: true,
        },
        consumer: {
          minBytes: 10000,
          maxBytes: 10485760, // 10MB
          maxBytesPerPartition: 1048576, // 1MB
          sessionTimeout: 30000,
          heartbeatInterval: 3000,
          retry: {
            maxRetries: 10,
            initialRetryTime: 1000,
            factor: 1.5,
            maxRetryTime: 30000,
            retryForever: false,
          },
        },
        producer: {
          idempotent: true,
          compression: 'snappy',
          maxInFlightRequests: 5,
          retry: {
            maxRetries: 5,
            initialRetryTime: 500,
            factor: 2,
            maxRetryTime: 30000,
            retryForever: false,
          },
        },
        monitoring: {
          enabled: true,
          metricsInterval: 30000,
        },
        logLevel: 'error',
      };
    case 'staging':
      return {
        ssl: {
          enabled: true,
          rejectUnauthorized: false,
        },
        consumer: {
          minBytes: 5000,
          maxBytes: 5242880, // 5MB
          maxBytesPerPartition: 524288, // 512KB
          sessionTimeout: 45000,
          heartbeatInterval: 5000,
          retry: {
            maxRetries: 8,
            initialRetryTime: 1000,
            factor: 1.5,
            maxRetryTime: 30000,
            retryForever: false,
          },
        },
        producer: {
          idempotent: true,
          compression: 'gzip',
          maxInFlightRequests: 3,
          retry: {
            maxRetries: 5,
            initialRetryTime: 500,
            factor: 1.5,
            maxRetryTime: 20000,
            retryForever: false,
          },
        },
        monitoring: {
          enabled: true,
          metricsInterval: 60000,
        },
        logLevel: 'warn',
      };
    case 'development':
    default:
      return {
        ssl: {
          enabled: false,
          rejectUnauthorized: false,
        },
        consumer: {
          minBytes: 1,
          maxBytes: 1048576, // 1MB
          maxBytesPerPartition: 131072, // 128KB
          sessionTimeout: 60000,
          heartbeatInterval: 6000,
          retry: {
            maxRetries: 5,
            initialRetryTime: 1000,
            factor: 1.5,
            maxRetryTime: 10000,
            retryForever: false,
          },
        },
        producer: {
          idempotent: false,
          compression: 'none',
          maxInFlightRequests: 1,
          retry: {
            maxRetries: 3,
            initialRetryTime: 300,
            factor: 1.5,
            maxRetryTime: 5000,
            retryForever: false,
          },
        },
        monitoring: {
          enabled: false,
          metricsInterval: 0,
        },
        logLevel: 'info',
      };
  }
};

/**
 * Kafka configuration for the gamification engine
 * 
 * This configuration centralizes all Kafka-related settings, including:
 * - Broker connection settings
 * - Consumer group IDs
 * - Topic definitions
 * - Security options (SASL, SSL)
 * - Performance tuning parameters
 * - Dead letter queue configuration
 * - Retry strategies
 * - Monitoring settings
 * 
 * The configuration is environment-specific, with different settings for
 * development, staging, and production environments.
 */
/**
 * Kafka configuration for the gamification engine
 * 
 * This configuration centralizes all Kafka-related settings, including:
 * - Broker connection settings
 * - Consumer group IDs
 * - Topic definitions
 * - Security options (SASL, SSL)
 * - Performance tuning parameters
 * - Dead letter queue configuration
 * - Retry strategies
 * - Monitoring settings
 * 
 * The configuration is environment-specific, with different settings for
 * development, staging, and production environments.
 */
export const kafkaConfig = registerAs('kafka', (): KafkaConfiguration => {
  // Get environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Get environment-specific configuration
  const envConfig = getEnvConfig(nodeEnv);
  
  // Get broker configuration
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
  const sslEnabled = process.env.KAFKA_SSL === 'true' || envConfig.ssl?.enabled || false;
  
  // Parse SASL configuration if provided
  let sasl: KafkaSaslConfig | null = null;
  if (process.env.KAFKA_SASL_USERNAME && process.env.KAFKA_SASL_PASSWORD) {
    sasl = {
      mechanism: (process.env.KAFKA_SASL_MECHANISM as 'plain' | 'scram-sha-256' | 'scram-sha-512') || 'plain',
      username: process.env.KAFKA_SASL_USERNAME,
      password: process.env.KAFKA_SASL_PASSWORD,
    };
  }
  
  // Build the configuration object
  return {
    clientId: process.env.KAFKA_CLIENT_ID || 'gamification-engine',
    brokers,
    brokerConfigs: parseBrokers(brokers, sslEnabled),
    sasl,
    ssl: {
      enabled: sslEnabled,
      rejectUnauthorized: process.env.KAFKA_SSL_REJECT_UNAUTHORIZED === 'true' || 
                          (envConfig.ssl?.rejectUnauthorized ?? false),
      ca: process.env.KAFKA_SSL_CA ? [process.env.KAFKA_SSL_CA] : undefined,
      key: process.env.KAFKA_SSL_KEY,
      cert: process.env.KAFKA_SSL_CERT,
    },
    topics: {
      healthEvents: process.env.KAFKA_TOPIC_HEALTH_EVENTS || 'health.events',
      careEvents: process.env.KAFKA_TOPIC_CARE_EVENTS || 'care.events',
      planEvents: process.env.KAFKA_TOPIC_PLAN_EVENTS || 'plan.events',
      userEvents: process.env.KAFKA_TOPIC_USER_EVENTS || 'user.events',
      gameEvents: process.env.KAFKA_TOPIC_GAME_EVENTS || 'game.events',
      dlqPrefix: process.env.KAFKA_DLQ_PREFIX || 'dlq.',
    },
    consumer: {
      groupId: process.env.KAFKA_GROUP_ID || 'gamification-consumer-group',
      allowAutoTopicCreation: process.env.KAFKA_ALLOW_AUTO_TOPIC_CREATION !== 'false',
      minBytes: parseInt(process.env.KAFKA_CONSUMER_MIN_BYTES, 10) || 
                envConfig.consumer?.minBytes || 1,
      maxBytes: parseInt(process.env.KAFKA_CONSUMER_MAX_BYTES, 10) || 
                envConfig.consumer?.maxBytes || 1048576, // 1MB
      maxWaitTimeInMs: parseInt(process.env.KAFKA_CONSUMER_MAX_WAIT_TIME, 10) || 5000,
      sessionTimeout: parseInt(process.env.KAFKA_CONSUMER_SESSION_TIMEOUT, 10) || 
                      envConfig.consumer?.sessionTimeout || 30000,
      heartbeatInterval: parseInt(process.env.KAFKA_CONSUMER_HEARTBEAT_INTERVAL, 10) || 
                         envConfig.consumer?.heartbeatInterval || 3000,
      maxBytesPerPartition: parseInt(process.env.KAFKA_CONSUMER_MAX_BYTES_PER_PARTITION, 10) || 
                            envConfig.consumer?.maxBytesPerPartition || 1048576, // 1MB
      readUncommitted: process.env.KAFKA_CONSUMER_READ_UNCOMMITTED === 'true',
      retry: {
        maxRetries: parseInt(process.env.KAFKA_CONSUMER_MAX_RETRIES, 10) || 
                   envConfig.consumer?.retry?.maxRetries || 5,
        initialRetryTime: parseInt(process.env.KAFKA_CONSUMER_INITIAL_RETRY_TIME, 10) || 
                          envConfig.consumer?.retry?.initialRetryTime || 300,
        factor: parseFloat(process.env.KAFKA_CONSUMER_RETRY_FACTOR) || 
                envConfig.consumer?.retry?.factor || 1.5,
        maxRetryTime: parseInt(process.env.KAFKA_CONSUMER_MAX_RETRY_TIME, 10) || 
                      envConfig.consumer?.retry?.maxRetryTime || 30000,
        retryForever: process.env.KAFKA_CONSUMER_RETRY_FOREVER === 'true' || 
                      envConfig.consumer?.retry?.retryForever || false,
      },
    },
    producer: {
      allowAutoTopicCreation: process.env.KAFKA_ALLOW_AUTO_TOPIC_CREATION !== 'false',
      transactionTimeout: parseInt(process.env.KAFKA_PRODUCER_TRANSACTION_TIMEOUT, 10) || 60000,
      maxInFlightRequests: parseInt(process.env.KAFKA_PRODUCER_MAX_IN_FLIGHT_REQUESTS, 10) || 
                           envConfig.producer?.maxInFlightRequests || 3,
      idempotent: process.env.KAFKA_PRODUCER_IDEMPOTENT === 'true' || 
                  envConfig.producer?.idempotent || false,
      compression: (process.env.KAFKA_PRODUCER_COMPRESSION as 'none' | 'gzip' | 'snappy' | 'lz4') || 
                   envConfig.producer?.compression || 'none',
      batchSize: parseInt(process.env.KAFKA_PRODUCER_BATCH_SIZE, 10) || 16384, // 16KB
      lingerMs: parseInt(process.env.KAFKA_PRODUCER_LINGER_MS, 10) || 5,
      retry: {
        maxRetries: parseInt(process.env.KAFKA_PRODUCER_MAX_RETRIES, 10) || 
                   envConfig.producer?.retry?.maxRetries || 5,
        initialRetryTime: parseInt(process.env.KAFKA_PRODUCER_INITIAL_RETRY_TIME, 10) || 
                          envConfig.producer?.retry?.initialRetryTime || 100,
        factor: parseFloat(process.env.KAFKA_PRODUCER_RETRY_FACTOR) || 
                envConfig.producer?.retry?.factor || 2,
        maxRetryTime: parseInt(process.env.KAFKA_PRODUCER_MAX_RETRY_TIME, 10) || 
                      envConfig.producer?.retry?.maxRetryTime || 30000,
        retryForever: process.env.KAFKA_PRODUCER_RETRY_FOREVER === 'true' || 
                      envConfig.producer?.retry?.retryForever || false,
      },
    },
    dlq: {
      enabled: process.env.KAFKA_DLQ_ENABLED !== 'false',
      maxAttempts: parseInt(process.env.KAFKA_DLQ_MAX_ATTEMPTS, 10) || 3,
      topicSuffix: process.env.KAFKA_DLQ_TOPIC_SUFFIX || '.dlq',
    },
    monitoring: {
      enabled: process.env.KAFKA_MONITORING_ENABLED !== 'false' || 
               envConfig.monitoring?.enabled || false,
      metricsInterval: parseInt(process.env.KAFKA_MONITORING_METRICS_INTERVAL, 10) || 
                       envConfig.monitoring?.metricsInterval || 30000,
    },
    logLevel: (process.env.KAFKA_LOG_LEVEL as keyof typeof logLevel) || 
              envConfig.logLevel || 'info',
  };
});

/**
 * Get KafkaJS configuration from our application configuration
 * 
 * Converts our application's KafkaConfiguration object into the format
 * expected by the KafkaJS library. This includes setting up the client ID,
 * brokers, log level, SSL configuration, and SASL authentication.
 * 
 * @param config Application Kafka configuration
 * @returns KafkaJS configuration object
 * @example
 * const kafkaJsConfig = getKafkaJsConfig(kafkaConfig);
 * const kafka = new Kafka(kafkaJsConfig);
 */
export const getKafkaJsConfig = (config: KafkaConfiguration): KafkaConfig => {
  const kafkaConfig: KafkaConfig = {
    clientId: config.clientId,
    brokers: config.brokers,
    logLevel: logLevel[config.logLevel],
  };

  // Add SSL configuration if enabled
  if (config.ssl.enabled) {
    kafkaConfig.ssl = true;
    
    // Add additional SSL options if provided
    if (config.ssl.rejectUnauthorized !== undefined || 
        config.ssl.ca || 
        config.ssl.key || 
        config.ssl.cert) {
      kafkaConfig.ssl = {
        rejectUnauthorized: config.ssl.rejectUnauthorized,
        ca: config.ssl.ca,
        key: config.ssl.key,
        cert: config.ssl.cert,
      };
    }
  }

  // Add SASL configuration if provided
  if (config.sasl) {
    kafkaConfig.sasl = {
      mechanism: config.sasl.mechanism,
      username: config.sasl.username,
      password: config.sasl.password,
    };
  }

  return kafkaConfig;
};

/**
 * Get the dead letter queue topic name for a given topic
 * 
 * Constructs the name of the dead letter queue topic for a given source topic
 * by prefixing it with the configured DLQ prefix. This is used when messages
 * fail to be processed after multiple attempts.
 * 
 * @param config Kafka configuration
 * @param topic Original topic name
 * @returns Dead letter queue topic name
 * @example
 * // Returns 'dlq.health.events'
 * getDlqTopicName(config, 'health.events');
 */
export const getDlqTopicName = (config: KafkaConfiguration, topic: string): string => {
  return `${config.topics.dlqPrefix}${topic}`;
};

/**
 * Get consumer configuration for a specific journey
 * 
 * Returns consumer configuration specific to a journey, including
 * the appropriate consumer group ID and topic name. This allows for
 * journey-specific event processing with dedicated consumer groups.
 * 
 * @param config Kafka configuration
 * @param journey Journey name (health, care, plan)
 * @returns Consumer configuration with journey-specific settings
 * @example
 * // Returns { groupId: 'gamification-consumer-group-health', topic: 'health.events' }
 * getJourneyConsumerConfig(config, 'health');
 */
export const getJourneyConsumerConfig = (
  config: KafkaConfiguration,
  journey: 'health' | 'care' | 'plan'
): { groupId: string; topic: string } => {
  const baseGroupId = config.consumer.groupId;
  const journeyGroupId = `${baseGroupId}-${journey}`;
  
  let topic: string;
  switch (journey) {
    case 'health':
      topic = config.topics.healthEvents;
      break;
    case 'care':
      topic = config.topics.careEvents;
      break;
    case 'plan':
      topic = config.topics.planEvents;
      break;
    default:
      throw new Error(`Unknown journey: ${journey}`);
  }
  
  return {
    groupId: journeyGroupId,
    topic,
  };
};

/**
 * Create a Kafka configuration object for NestJS KafkaModule
 * 
 * Converts our application's KafkaConfiguration object into the format
 * expected by the NestJS KafkaModule. This includes setting up the client ID,
 * brokers, consumer group ID, SSL configuration, SASL authentication,
 * topics, retry settings, and feature flags.
 * 
 * @param config Kafka configuration
 * @returns KafkaModule options
 * @example
 * const moduleOptions = createKafkaModuleOptions(config);
 * KafkaModule.registerAsync(moduleOptions);
 */
export const createKafkaModuleOptions = (config: KafkaConfiguration) => {
  return {
    clientId: config.clientId,
    brokers: config.brokers,
    groupId: config.consumer.groupId,
    ssl: config.ssl.enabled,
    sasl: config.sasl,
    topics: {
      healthEvents: config.topics.healthEvents,
      careEvents: config.topics.careEvents,
      planEvents: config.topics.planEvents,
      userEvents: config.topics.userEvents,
      gameEvents: config.topics.gameEvents,
    },
    maxRetries: config.consumer.retry.maxRetries,
    retryInterval: config.consumer.retry.initialRetryTime,
    enableDlq: config.dlq.enabled,
    enableMonitoring: config.monitoring.enabled,
  };
};