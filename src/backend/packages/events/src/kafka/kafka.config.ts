/**
 * @file kafka.config.ts
 * @description Provides configuration utilities for Kafka connections, including default settings,
 * configuration loading from environment variables, and validation. This file centralizes all Kafka
 * configuration logic across services, ensuring consistent settings and validation.
 * 
 * @module @austa/events/kafka
 */

import { Logger } from '@nestjs/common';
import * as Joi from 'joi';
import { KafkaOptions } from '@nestjs/microservices';
import { logLevel } from 'kafkajs';

import { KafkaConfigOptions, KafkaConsumerConfig, KafkaProducerConfig, KafkaSecurityConfig } from './kafka.interfaces';
import { DEFAULT_CONSUMER_GROUP_ID, DEFAULT_RETRY_ATTEMPTS, DEFAULT_RETRY_DELAY } from '../constants/config.constants';

const logger = new Logger('KafkaConfig');

/**
 * Default Kafka configuration values
 * These defaults are used when specific values are not provided in the environment
 * or through explicit configuration.
 */
export const DEFAULT_KAFKA_CONFIG: KafkaConfigOptions = {
  // Identifier for this client in logs and metrics
  clientId: 'austa-superapp',
  // List of Kafka brokers to connect to (default is local development)
  brokers: ['localhost:9092'],
  // Whether to use SSL for secure connections
  ssl: false,
  // SASL authentication configuration (undefined by default)
  sasl: undefined,
  // Connection timeout in milliseconds
  connectionTimeout: 3000,
  // Authentication timeout in milliseconds
  authenticationTimeout: 1000,
  // Time in milliseconds before reauthentication
  reauthenticationThreshold: 10000,
  // Request timeout in milliseconds
  requestTimeout: 30000,
  // Whether to enforce request timeouts
  enforceRequestTimeout: true,
  // Retry configuration for broker connections
  retry: {
    // Initial backoff time in milliseconds
    initialRetryTime: 100,
    // Maximum number of retries
    retries: 8,
    // Maximum retry time in milliseconds
    maxRetryTime: 30000,
    // Exponential backoff factor
    factor: 2,
    // Backoff multiplier for randomization
    multiplier: 1.5,
  },
  // Log level for Kafka client (ERROR by default to reduce noise)
  logLevel: logLevel.ERROR,
};

/**
 * Default Kafka consumer configuration values
 * These settings control how the consumer behaves when reading messages from Kafka topics.
 */
export const DEFAULT_CONSUMER_CONFIG: KafkaConsumerConfig = {
  // Consumer group ID for coordinating consumption across instances
  groupId: DEFAULT_CONSUMER_GROUP_ID,
  // Whether to automatically create topics if they don't exist (disabled for safety)
  allowAutoTopicCreation: false,
  // Maximum number of requests that may be in progress at any time
  maxInFlightRequests: 10,
  // The timeout used to detect consumer failures when using Kafka's group management
  sessionTimeout: 30000,
  // Heartbeat interval in ms used to maintain the consumer's session
  heartbeatInterval: 3000,
  // Maximum time in ms the broker may wait for sufficient data to satisfy fetch request
  maxWaitTimeInMs: 5000,
  // Maximum bytes to include in the message set for each partition
  maxBytesPerPartition: 1048576, // 1MB
  // Minimum bytes to accumulate in the response before returning
  minBytes: 1,
  // Maximum bytes to accumulate in the response (across all partitions)
  maxBytes: 10485760, // 10MB
  // Whether to automatically commit offsets periodically
  autoCommit: true,
  // The interval in ms at which to commit offsets (if autoCommit is enabled)
  autoCommitInterval: 5000,
  // Number of messages to process before committing offsets
  autoCommitThreshold: 100,
  // Partition assignment strategy (roundrobin is more balanced than range)
  partitionAssigners: ['roundrobin'],
  // Whether to include messages with aborted transactions
  readUncommitted: false,
  // Retry configuration for failed message processing
  retry: {
    // Number of retry attempts for failed messages
    attempts: DEFAULT_RETRY_ATTEMPTS,
    // Delay between retry attempts in milliseconds
    delay: DEFAULT_RETRY_DELAY,
  },
};

/**
 * Default Kafka producer configuration values
 * These settings control how the producer behaves when sending messages to Kafka topics.
 */
export const DEFAULT_PRODUCER_CONFIG: KafkaProducerConfig = {
  // Whether to automatically create topics if they don't exist (disabled for safety)
  allowAutoTopicCreation: false,
  // The maximum time in ms that the transaction coordinator will wait for a transaction status update
  transactionTimeout: 60000,
  // When set to true, the producer will ensure that messages are successfully produced exactly once
  idempotent: false,
  // Maximum number of unacknowledged requests the client will send before blocking
  maxInFlightRequests: 5,
  // Retry configuration for failed message production
  retry: {
    // Number of retry attempts for failed message production
    attempts: DEFAULT_RETRY_ATTEMPTS,
    // Delay between retry attempts in milliseconds
    delay: DEFAULT_RETRY_DELAY,
  },
};

/**
 * Environment variable prefix for Kafka configuration
 */
export const KAFKA_ENV_PREFIX = 'KAFKA';

/**
 * Journey-specific environment variable prefixes
 */
export const JOURNEY_ENV_PREFIXES = {
  HEALTH: 'HEALTH_JOURNEY',
  CARE: 'CARE_JOURNEY',
  PLAN: 'PLAN_JOURNEY',
  GAMIFICATION: 'GAMIFICATION',
  NOTIFICATION: 'NOTIFICATION',
  AUTH: 'AUTH',
  API_GATEWAY: 'API_GATEWAY',
};

/**
 * Validation schema for Kafka configuration
 */
export const kafkaConfigValidationSchema = Joi.object({
  clientId: Joi.string().required(),
  brokers: Joi.array().items(Joi.string()).min(1).required(),
  ssl: Joi.boolean().default(DEFAULT_KAFKA_CONFIG.ssl),
  sasl: Joi.object({
    mechanism: Joi.string().valid('plain', 'scram-sha-256', 'scram-sha-512').required(),
    username: Joi.string().required(),
    password: Joi.string().required(),
  }).optional(),
  connectionTimeout: Joi.number().positive().default(DEFAULT_KAFKA_CONFIG.connectionTimeout),
  authenticationTimeout: Joi.number().positive().default(DEFAULT_KAFKA_CONFIG.authenticationTimeout),
  reauthenticationThreshold: Joi.number().positive().default(DEFAULT_KAFKA_CONFIG.reauthenticationThreshold),
  requestTimeout: Joi.number().positive().default(DEFAULT_KAFKA_CONFIG.requestTimeout),
  enforceRequestTimeout: Joi.boolean().default(DEFAULT_KAFKA_CONFIG.enforceRequestTimeout),
  retry: Joi.object({
    initialRetryTime: Joi.number().positive().default(DEFAULT_KAFKA_CONFIG.retry.initialRetryTime),
    retries: Joi.number().min(0).default(DEFAULT_KAFKA_CONFIG.retry.retries),
    maxRetryTime: Joi.number().positive().default(DEFAULT_KAFKA_CONFIG.retry.maxRetryTime),
    factor: Joi.number().positive().default(DEFAULT_KAFKA_CONFIG.retry.factor),
    multiplier: Joi.number().positive().default(DEFAULT_KAFKA_CONFIG.retry.multiplier),
  }).default(DEFAULT_KAFKA_CONFIG.retry),
  logLevel: Joi.number().valid(0, 1, 2, 3, 4, 5).default(DEFAULT_KAFKA_CONFIG.logLevel),
});

/**
 * Validation schema for Kafka consumer configuration
 */
export const consumerConfigValidationSchema = Joi.object({
  groupId: Joi.string().required(),
  allowAutoTopicCreation: Joi.boolean().default(DEFAULT_CONSUMER_CONFIG.allowAutoTopicCreation),
  maxInFlightRequests: Joi.number().positive().default(DEFAULT_CONSUMER_CONFIG.maxInFlightRequests),
  sessionTimeout: Joi.number().positive().default(DEFAULT_CONSUMER_CONFIG.sessionTimeout),
  heartbeatInterval: Joi.number().positive().default(DEFAULT_CONSUMER_CONFIG.heartbeatInterval),
  maxWaitTimeInMs: Joi.number().positive().default(DEFAULT_CONSUMER_CONFIG.maxWaitTimeInMs),
  maxBytesPerPartition: Joi.number().positive().default(DEFAULT_CONSUMER_CONFIG.maxBytesPerPartition),
  minBytes: Joi.number().min(0).default(DEFAULT_CONSUMER_CONFIG.minBytes),
  maxBytes: Joi.number().positive().default(DEFAULT_CONSUMER_CONFIG.maxBytes),
  autoCommit: Joi.boolean().default(DEFAULT_CONSUMER_CONFIG.autoCommit),
  autoCommitInterval: Joi.number().positive().default(DEFAULT_CONSUMER_CONFIG.autoCommitInterval),
  autoCommitThreshold: Joi.number().positive().default(DEFAULT_CONSUMER_CONFIG.autoCommitThreshold),
  partitionAssigners: Joi.array().items(Joi.string()).default(DEFAULT_CONSUMER_CONFIG.partitionAssigners),
  readUncommitted: Joi.boolean().default(DEFAULT_CONSUMER_CONFIG.readUncommitted),
  retry: Joi.object({
    attempts: Joi.number().min(0).default(DEFAULT_CONSUMER_CONFIG.retry.attempts),
    delay: Joi.number().positive().default(DEFAULT_CONSUMER_CONFIG.retry.delay),
  }).default(DEFAULT_CONSUMER_CONFIG.retry),
});

/**
 * Validation schema for Kafka producer configuration
 */
export const producerConfigValidationSchema = Joi.object({
  allowAutoTopicCreation: Joi.boolean().default(DEFAULT_PRODUCER_CONFIG.allowAutoTopicCreation),
  transactionTimeout: Joi.number().positive().default(DEFAULT_PRODUCER_CONFIG.transactionTimeout),
  idempotent: Joi.boolean().default(DEFAULT_PRODUCER_CONFIG.idempotent),
  maxInFlightRequests: Joi.number().positive().default(DEFAULT_PRODUCER_CONFIG.maxInFlightRequests),
  retry: Joi.object({
    attempts: Joi.number().min(0).default(DEFAULT_PRODUCER_CONFIG.retry.attempts),
    delay: Joi.number().positive().default(DEFAULT_PRODUCER_CONFIG.retry.delay),
  }).default(DEFAULT_PRODUCER_CONFIG.retry),
});

/**
 * Loads Kafka configuration from environment variables
 * @param prefix - Environment variable prefix (default: KAFKA)
 * @returns Kafka configuration options
 */
export function loadKafkaConfigFromEnv(prefix: string = KAFKA_ENV_PREFIX): KafkaConfigOptions {
  const envPrefix = prefix.toUpperCase();
  
  // Extract broker list from environment variable
  const brokersEnv = process.env[`${envPrefix}_BROKERS`] || '';
  const brokers = brokersEnv.split(',').filter(broker => broker.trim().length > 0);
  
  // Build configuration object from environment variables
  const config: KafkaConfigOptions = {
    clientId: process.env[`${envPrefix}_CLIENT_ID`] || DEFAULT_KAFKA_CONFIG.clientId,
    brokers: brokers.length > 0 ? brokers : DEFAULT_KAFKA_CONFIG.brokers,
    ssl: process.env[`${envPrefix}_SSL`] === 'true' || DEFAULT_KAFKA_CONFIG.ssl,
    connectionTimeout: parseInt(process.env[`${envPrefix}_CONNECTION_TIMEOUT`] || '', 10) || DEFAULT_KAFKA_CONFIG.connectionTimeout,
    authenticationTimeout: parseInt(process.env[`${envPrefix}_AUTH_TIMEOUT`] || '', 10) || DEFAULT_KAFKA_CONFIG.authenticationTimeout,
    reauthenticationThreshold: parseInt(process.env[`${envPrefix}_REAUTH_THRESHOLD`] || '', 10) || DEFAULT_KAFKA_CONFIG.reauthenticationThreshold,
    requestTimeout: parseInt(process.env[`${envPrefix}_REQUEST_TIMEOUT`] || '', 10) || DEFAULT_KAFKA_CONFIG.requestTimeout,
    enforceRequestTimeout: process.env[`${envPrefix}_ENFORCE_REQUEST_TIMEOUT`] === 'true' || DEFAULT_KAFKA_CONFIG.enforceRequestTimeout,
    logLevel: parseInt(process.env[`${envPrefix}_LOG_LEVEL`] || '', 10) || DEFAULT_KAFKA_CONFIG.logLevel,
    retry: {
      initialRetryTime: parseInt(process.env[`${envPrefix}_RETRY_INITIAL_TIME`] || '', 10) || DEFAULT_KAFKA_CONFIG.retry.initialRetryTime,
      retries: parseInt(process.env[`${envPrefix}_RETRY_COUNT`] || '', 10) || DEFAULT_KAFKA_CONFIG.retry.retries,
      maxRetryTime: parseInt(process.env[`${envPrefix}_RETRY_MAX_TIME`] || '', 10) || DEFAULT_KAFKA_CONFIG.retry.maxRetryTime,
      factor: parseFloat(process.env[`${envPrefix}_RETRY_FACTOR`] || '') || DEFAULT_KAFKA_CONFIG.retry.factor,
      multiplier: parseFloat(process.env[`${envPrefix}_RETRY_MULTIPLIER`] || '') || DEFAULT_KAFKA_CONFIG.retry.multiplier,
    },
  };
  
  // Add SASL configuration if credentials are provided
  const username = process.env[`${envPrefix}_SASL_USERNAME`];
  const password = process.env[`${envPrefix}_SASL_PASSWORD`];
  const mechanism = process.env[`${envPrefix}_SASL_MECHANISM`];
  
  if (username && password && mechanism) {
    config.sasl = {
      mechanism: mechanism as 'plain' | 'scram-sha-256' | 'scram-sha-512',
      username,
      password,
    };
  }
  
  return config;
}

/**
 * Loads consumer configuration from environment variables
 * @param prefix - Environment variable prefix (default: KAFKA)
 * @param groupId - Consumer group ID (optional)
 * @returns Kafka consumer configuration
 */
export function loadConsumerConfigFromEnv(prefix: string = KAFKA_ENV_PREFIX, groupId?: string): KafkaConsumerConfig {
  const envPrefix = prefix.toUpperCase();
  
  return {
    groupId: groupId || process.env[`${envPrefix}_CONSUMER_GROUP_ID`] || DEFAULT_CONSUMER_CONFIG.groupId,
    allowAutoTopicCreation: process.env[`${envPrefix}_CONSUMER_AUTO_TOPIC_CREATION`] === 'true' || DEFAULT_CONSUMER_CONFIG.allowAutoTopicCreation,
    maxInFlightRequests: parseInt(process.env[`${envPrefix}_CONSUMER_MAX_IN_FLIGHT`] || '', 10) || DEFAULT_CONSUMER_CONFIG.maxInFlightRequests,
    sessionTimeout: parseInt(process.env[`${envPrefix}_CONSUMER_SESSION_TIMEOUT`] || '', 10) || DEFAULT_CONSUMER_CONFIG.sessionTimeout,
    heartbeatInterval: parseInt(process.env[`${envPrefix}_CONSUMER_HEARTBEAT_INTERVAL`] || '', 10) || DEFAULT_CONSUMER_CONFIG.heartbeatInterval,
    maxWaitTimeInMs: parseInt(process.env[`${envPrefix}_CONSUMER_MAX_WAIT_TIME`] || '', 10) || DEFAULT_CONSUMER_CONFIG.maxWaitTimeInMs,
    maxBytesPerPartition: parseInt(process.env[`${envPrefix}_CONSUMER_MAX_BYTES_PER_PARTITION`] || '', 10) || DEFAULT_CONSUMER_CONFIG.maxBytesPerPartition,
    minBytes: parseInt(process.env[`${envPrefix}_CONSUMER_MIN_BYTES`] || '', 10) || DEFAULT_CONSUMER_CONFIG.minBytes,
    maxBytes: parseInt(process.env[`${envPrefix}_CONSUMER_MAX_BYTES`] || '', 10) || DEFAULT_CONSUMER_CONFIG.maxBytes,
    autoCommit: process.env[`${envPrefix}_CONSUMER_AUTO_COMMIT`] !== 'false', // Default to true unless explicitly set to false
    autoCommitInterval: parseInt(process.env[`${envPrefix}_CONSUMER_AUTO_COMMIT_INTERVAL`] || '', 10) || DEFAULT_CONSUMER_CONFIG.autoCommitInterval,
    autoCommitThreshold: parseInt(process.env[`${envPrefix}_CONSUMER_AUTO_COMMIT_THRESHOLD`] || '', 10) || DEFAULT_CONSUMER_CONFIG.autoCommitThreshold,
    partitionAssigners: (process.env[`${envPrefix}_CONSUMER_PARTITION_ASSIGNERS`] || '').split(',').filter(Boolean) || DEFAULT_CONSUMER_CONFIG.partitionAssigners,
    readUncommitted: process.env[`${envPrefix}_CONSUMER_READ_UNCOMMITTED`] === 'true' || DEFAULT_CONSUMER_CONFIG.readUncommitted,
    retry: {
      attempts: parseInt(process.env[`${envPrefix}_CONSUMER_RETRY_ATTEMPTS`] || '', 10) || DEFAULT_CONSUMER_CONFIG.retry.attempts,
      delay: parseInt(process.env[`${envPrefix}_CONSUMER_RETRY_DELAY`] || '', 10) || DEFAULT_CONSUMER_CONFIG.retry.delay,
    },
  };
}

/**
 * Loads producer configuration from environment variables
 * @param prefix - Environment variable prefix (default: KAFKA)
 * @returns Kafka producer configuration
 */
export function loadProducerConfigFromEnv(prefix: string = KAFKA_ENV_PREFIX): KafkaProducerConfig {
  const envPrefix = prefix.toUpperCase();
  
  return {
    allowAutoTopicCreation: process.env[`${envPrefix}_PRODUCER_AUTO_TOPIC_CREATION`] === 'true' || DEFAULT_PRODUCER_CONFIG.allowAutoTopicCreation,
    transactionTimeout: parseInt(process.env[`${envPrefix}_PRODUCER_TRANSACTION_TIMEOUT`] || '', 10) || DEFAULT_PRODUCER_CONFIG.transactionTimeout,
    idempotent: process.env[`${envPrefix}_PRODUCER_IDEMPOTENT`] === 'true' || DEFAULT_PRODUCER_CONFIG.idempotent,
    maxInFlightRequests: parseInt(process.env[`${envPrefix}_PRODUCER_MAX_IN_FLIGHT`] || '', 10) || DEFAULT_PRODUCER_CONFIG.maxInFlightRequests,
    retry: {
      attempts: parseInt(process.env[`${envPrefix}_PRODUCER_RETRY_ATTEMPTS`] || '', 10) || DEFAULT_PRODUCER_CONFIG.retry.attempts,
      delay: parseInt(process.env[`${envPrefix}_PRODUCER_RETRY_DELAY`] || '', 10) || DEFAULT_PRODUCER_CONFIG.retry.delay,
    },
  };
}

/**
 * Creates a journey-specific Kafka configuration
 * 
 * This function loads configuration from environment variables with journey-specific prefixes
 * and applies sensible defaults for the specified journey. It allows for easy configuration
 * of Kafka clients for different journeys (Health, Care, Plan) while maintaining consistent
 * patterns and defaults.
 * 
 * Environment variables are looked up using the journey-specific prefix, for example:
 * - HEALTH_JOURNEY_BROKERS for the Health journey
 * - CARE_JOURNEY_CLIENT_ID for the Care journey
 * - PLAN_JOURNEY_SSL for the Plan journey
 * 
 * @param journey - Journey name (HEALTH, CARE, PLAN, etc.)
 * @param overrides - Optional configuration overrides that take precedence over environment variables
 * @returns Journey-specific Kafka configuration ready for use
 * 
 * @example
 * // Create Kafka config for Health journey
 * const healthKafkaConfig = createJourneyKafkaConfig('HEALTH');
 * 
 * // Create Kafka config for Care journey with overrides
 * const careKafkaConfig = createJourneyKafkaConfig('CARE', {
 *   requestTimeout: 60000,
 *   retry: { retries: 10 }
 * });
 */
export function createJourneyKafkaConfig(
  journey: keyof typeof JOURNEY_ENV_PREFIXES,
  overrides?: Partial<KafkaConfigOptions>,
): KafkaConfigOptions {
  const journeyPrefix = JOURNEY_ENV_PREFIXES[journey];
  const baseConfig = loadKafkaConfigFromEnv(journeyPrefix);
  
  // Set journey-specific client ID if not explicitly provided
  if (!overrides?.clientId && !process.env[`${journeyPrefix}_CLIENT_ID`]) {
    baseConfig.clientId = `austa-${journey.toLowerCase()}-journey`;
  }
  
  return {
    ...baseConfig,
    ...overrides,
  };
}

/**
 * Creates a journey-specific consumer configuration
 * @param journey - Journey name (HEALTH, CARE, PLAN, etc.)
 * @param groupId - Optional consumer group ID
 * @param overrides - Optional configuration overrides
 * @returns Journey-specific consumer configuration
 */
export function createJourneyConsumerConfig(
  journey: keyof typeof JOURNEY_ENV_PREFIXES,
  groupId?: string,
  overrides?: Partial<KafkaConsumerConfig>,
): KafkaConsumerConfig {
  const journeyPrefix = JOURNEY_ENV_PREFIXES[journey];
  const baseConfig = loadConsumerConfigFromEnv(journeyPrefix, groupId);
  
  // Set journey-specific group ID if not explicitly provided
  if (!groupId && !process.env[`${journeyPrefix}_CONSUMER_GROUP_ID`]) {
    baseConfig.groupId = `${journey.toLowerCase()}-consumer-group`;
  }
  
  return {
    ...baseConfig,
    ...overrides,
  };
}

/**
 * Creates a journey-specific producer configuration
 * @param journey - Journey name (HEALTH, CARE, PLAN, etc.)
 * @param overrides - Optional configuration overrides
 * @returns Journey-specific producer configuration
 */
export function createJourneyProducerConfig(
  journey: keyof typeof JOURNEY_ENV_PREFIXES,
  overrides?: Partial<KafkaProducerConfig>,
): KafkaProducerConfig {
  const journeyPrefix = JOURNEY_ENV_PREFIXES[journey];
  const baseConfig = loadProducerConfigFromEnv(journeyPrefix);
  
  return {
    ...baseConfig,
    ...overrides,
  };
}

/**
 * Validates Kafka configuration against schema
 * 
 * This function ensures that the provided Kafka configuration meets all requirements
 * and contains valid values. It uses Joi for validation and will throw detailed error
 * messages if validation fails. The validation ensures:
 * 
 * - Required fields are present (clientId, brokers)
 * - Values are of the correct type and within acceptable ranges
 * - Default values are applied for optional fields
 * - SASL configuration is valid if provided
 * 
 * @param config - Kafka configuration to validate
 * @returns Validated Kafka configuration with defaults applied
 * @throws Error if validation fails with detailed error message
 * 
 * @example
 * try {
 *   const validConfig = validateKafkaConfig(myConfig);
 *   // Use validated config
 * } catch (error) {
 *   console.error('Configuration error:', error.message);
 *   // Handle validation failure
 * }
 */
export function validateKafkaConfig(config: KafkaConfigOptions): KafkaConfigOptions {
  const { error, value } = kafkaConfigValidationSchema.validate(config, { abortEarly: false });
  
  if (error) {
    const errorMessage = `Kafka configuration validation failed: ${error.message}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  return value;
}

/**
 * Validates consumer configuration against schema
 * @param config - Consumer configuration to validate
 * @returns Validated consumer configuration
 * @throws Error if validation fails
 */
export function validateConsumerConfig(config: KafkaConsumerConfig): KafkaConsumerConfig {
  const { error, value } = consumerConfigValidationSchema.validate(config, { abortEarly: false });
  
  if (error) {
    const errorMessage = `Kafka consumer configuration validation failed: ${error.message}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  return value;
}

/**
 * Validates producer configuration against schema
 * @param config - Producer configuration to validate
 * @returns Validated producer configuration
 * @throws Error if validation fails
 */
export function validateProducerConfig(config: KafkaProducerConfig): KafkaProducerConfig {
  const { error, value } = producerConfigValidationSchema.validate(config, { abortEarly: false });
  
  if (error) {
    const errorMessage = `Kafka producer configuration validation failed: ${error.message}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  return value;
}

/**
 * Creates a complete NestJS Kafka options configuration
 * 
 * This function combines and validates Kafka client, consumer, and producer configurations
 * to create a complete options object for the NestJS KafkaModule. It ensures all configurations
 * are valid before creating the options object, throwing detailed error messages if validation fails.
 * 
 * The resulting options object can be directly used with KafkaModule.register() to configure
 * the Kafka integration in a NestJS application.
 * 
 * @param kafkaConfig - Kafka client configuration (brokers, client ID, etc.)
 * @param consumerConfig - Optional consumer configuration (group ID, auto-commit, etc.)
 * @param producerConfig - Optional producer configuration (idempotence, retries, etc.)
 * @returns NestJS Kafka options ready for use with KafkaModule.register()
 * @throws Error if any configuration validation fails
 * 
 * @example
 * // In a NestJS module
 * import { Module } from '@nestjs/common';
 * import { KafkaModule } from '@nestjs/microservices';
 * import { createKafkaOptions, loadKafkaConfigFromEnv } from '@austa/events/kafka';
 * 
 * @Module({
 *   imports: [
 *     KafkaModule.register(createKafkaOptions(
 *       loadKafkaConfigFromEnv(),
 *       { groupId: 'my-consumer-group' }
 *     )),
 *   ],
 * })
 * export class AppModule {}
 */
export function createKafkaOptions(
  kafkaConfig: KafkaConfigOptions,
  consumerConfig?: KafkaConsumerConfig,
  producerConfig?: KafkaProducerConfig,
): KafkaOptions {
  // Validate configurations
  const validatedKafkaConfig = validateKafkaConfig(kafkaConfig);
  const validatedConsumerConfig = consumerConfig ? validateConsumerConfig(consumerConfig) : undefined;
  const validatedProducerConfig = producerConfig ? validateProducerConfig(producerConfig) : undefined;
  
  // Create NestJS Kafka options
  const options: KafkaOptions = {
    transport: 1, // Transport.KAFKA
    options: {
      client: {
        ...validatedKafkaConfig,
      },
      consumer: validatedConsumerConfig,
      producer: validatedProducerConfig,
    },
  };
  
  return options;
}

/**
 * Creates a complete journey-specific NestJS Kafka options configuration
 * @param journey - Journey name (HEALTH, CARE, PLAN, etc.)
 * @param kafkaConfigOverrides - Optional Kafka configuration overrides
 * @param consumerConfigOverrides - Optional consumer configuration overrides
 * @param producerConfigOverrides - Optional producer configuration overrides
 * @returns Journey-specific NestJS Kafka options
 */
export function createJourneyKafkaOptions(
  journey: keyof typeof JOURNEY_ENV_PREFIXES,
  kafkaConfigOverrides?: Partial<KafkaConfigOptions>,
  consumerConfigOverrides?: Partial<KafkaConsumerConfig>,
  producerConfigOverrides?: Partial<KafkaProducerConfig>,
): KafkaOptions {
  const kafkaConfig = createJourneyKafkaConfig(journey, kafkaConfigOverrides);
  const consumerConfig = createJourneyConsumerConfig(journey, undefined, consumerConfigOverrides);
  const producerConfig = createJourneyProducerConfig(journey, producerConfigOverrides);
  
  return createKafkaOptions(kafkaConfig, consumerConfig, producerConfig);
}

/**
 * Usage Examples:
 * 
 * 1. Basic Kafka configuration with defaults:
 * ```typescript
 * // In a NestJS module
 * import { KafkaModule } from '@nestjs/microservices';
 * import { createKafkaOptions, loadKafkaConfigFromEnv } from '@austa/events/kafka';
 * 
 * @Module({
 *   imports: [
 *     KafkaModule.register(createKafkaOptions(loadKafkaConfigFromEnv())),
 *   ],
 * })
 * export class AppModule {}
 * ```
 * 
 * 2. Journey-specific configuration:
 * ```typescript
 * // In a Health Journey service
 * import { KafkaModule } from '@nestjs/microservices';
 * import { createJourneyKafkaOptions } from '@austa/events/kafka';
 * 
 * @Module({
 *   imports: [
 *     KafkaModule.register(createJourneyKafkaOptions('HEALTH')),
 *   ],
 * })
 * export class HealthJourneyModule {}
 * ```
 * 
 * 3. Custom configuration with overrides:
 * ```typescript
 * // In a service with specific requirements
 * import { KafkaModule } from '@nestjs/microservices';
 * import { createJourneyKafkaOptions } from '@austa/events/kafka';
 * 
 * @Module({
 *   imports: [
 *     KafkaModule.register(createJourneyKafkaOptions(
 *       'CARE',
 *       { requestTimeout: 60000 }, // Kafka config overrides
 *       { groupId: 'care-appointments-consumer' }, // Consumer config overrides
 *       { idempotent: true } // Producer config overrides
 *     )),
 *   ],
 * })
 * export class CareAppointmentsModule {}
 * ```
 */