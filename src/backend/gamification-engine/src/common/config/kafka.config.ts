import { registerAs } from '@nestjs/config';
import { ConsumerConfig, KafkaConfig, ProducerConfig, RetryOptions } from 'kafkajs';
import { EventSchemaVersion, EventSchema } from '@austa/interfaces/gamification';
import { EventValidationError } from '@austa/interfaces/common/errors';

/**
 * Interface for Dead Letter Queue (DLQ) configuration
 */
export interface DLQConfig {
  /** Whether the DLQ is enabled */
  enabled: boolean;
  /** The topic name for the DLQ */
  topic: string;
  /** Maximum number of retries before sending to DLQ */
  maxRetries: number;
  /** Whether to include the original message metadata in the DLQ message */
  includeMetadata: boolean;
}

/**
 * Interface for Kafka topic configuration
 */
export interface TopicConfig {
  /** The topic name */
  name: string;
  /** Number of partitions for the topic */
  partitions?: number;
  /** Replication factor for the topic */
  replicationFactor?: number;
  /** Dead letter queue configuration for this topic */
  dlq?: DLQConfig;
  /** Schema version to use for this topic */
  schemaVersion: EventSchemaVersion;
}

/**
 * Interface for retry strategy configuration
 */
export interface RetryStrategyConfig {
  /** Initial retry delay in milliseconds */
  initialRetryTime: number;
  /** Maximum retry time in milliseconds */
  maxRetryTime: number;
  /** Factor by which to increase retry time for exponential backoff */
  retryFactor: number;
  /** Maximum number of retries */
  maxRetries: number;
  /** Whether to retry indefinitely */
  retryForever?: boolean;
}

/**
 * Interface for Kafka configuration
 */
export interface KafkaConfiguration {
  /** Client ID for Kafka connection */
  clientId: string;
  /** List of Kafka brokers */
  brokers: string[];
  /** Consumer group ID */
  groupId: string;
  /** Topic configurations */
  topics: {
    /** Health journey events topic */
    healthEvents: TopicConfig;
    /** Care journey events topic */
    careEvents: TopicConfig;
    /** Plan journey events topic */
    planEvents: TopicConfig;
    /** User events topic */
    userEvents: TopicConfig;
    /** Game events topic */
    gameEvents: TopicConfig;
  };
  /** Producer configuration */
  producer: ProducerConfig;
  /** Consumer configuration */
  consumer: ConsumerConfig;
  /** Retry strategy configuration */
  retry: RetryStrategyConfig;
  /** Error handling configuration */
  errorHandling: {
    /** Whether to log errors */
    logErrors: boolean;
    /** Whether to rethrow errors after handling */
    rethrowErrors: boolean;
  };
}

/**
 * Creates a DLQ topic name for a given topic
 * @param topicName The original topic name
 * @returns The DLQ topic name
 */
const createDLQTopicName = (topicName: string): string => `${topicName}.dlq`;

/**
 * Calculates exponential backoff time based on retry count and configuration
 * @param retryCount Current retry count
 * @param config Retry strategy configuration
 * @returns Time to wait in milliseconds before next retry
 */
export const calculateBackoff = (retryCount: number, config: RetryStrategyConfig): number => {
  const backoff = Math.min(
    config.maxRetryTime,
    config.initialRetryTime * Math.pow(config.retryFactor, retryCount)
  );
  
  // Add some jitter to prevent thundering herd problem
  return backoff * (0.8 + Math.random() * 0.4);
};

/**
 * Kafka configuration factory
 */
/**
 * Factory function to create Kafka configuration
 * Extracts Kafka-specific configuration into a dedicated module with enhanced features:
 * - Dead-letter queue configuration for failed events
 * - Exponential backoff retry strategies for improved reliability
 * - Enhanced error handling for Kafka connection and consumer issues
 * - Integration with standardized, versioned event schemas from @austa/interfaces
 */
export const kafkaConfig = registerAs('kafka', (): KafkaConfiguration => {
  // Default retry strategy
  const defaultRetryStrategy: RetryStrategyConfig = {
    initialRetryTime: parseInt(process.env.KAFKA_INITIAL_RETRY_TIME, 10) || 1000,
    maxRetryTime: parseInt(process.env.KAFKA_MAX_RETRY_TIME, 10) || 30000,
    retryFactor: parseFloat(process.env.KAFKA_RETRY_FACTOR) || 2,
    maxRetries: parseInt(process.env.KAFKA_MAX_RETRIES, 10) || 5,
    retryForever: process.env.KAFKA_RETRY_FOREVER === 'true',
  };

  // Default DLQ configuration
  const createDefaultDLQConfig = (topicName: string): DLQConfig => ({
    enabled: process.env.KAFKA_DLQ_ENABLED !== 'false', // Enabled by default
    topic: createDLQTopicName(topicName),
    maxRetries: parseInt(process.env.KAFKA_DLQ_MAX_RETRIES, 10) || 3,
    includeMetadata: process.env.KAFKA_DLQ_INCLUDE_METADATA !== 'false', // Enabled by default
  });

  // Create topic configuration
  const createTopicConfig = (topicName: string, schemaVersion: EventSchemaVersion): TopicConfig => ({
    name: topicName,
    partitions: parseInt(process.env.KAFKA_TOPIC_PARTITIONS, 10) || 3,
    replicationFactor: parseInt(process.env.KAFKA_TOPIC_REPLICATION_FACTOR, 10) || 2,
    dlq: createDefaultDLQConfig(topicName),
    schemaVersion,
  });

  return {
    clientId: process.env.KAFKA_CLIENT_ID || 'gamification-engine',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    groupId: process.env.KAFKA_GROUP_ID || 'gamification-consumer-group',
    
    topics: {
      healthEvents: createTopicConfig(
        process.env.KAFKA_TOPIC_HEALTH_EVENTS || 'health.events',
        process.env.KAFKA_SCHEMA_VERSION_HEALTH as EventSchemaVersion || EventSchemaVersion.V1
      ),
      careEvents: createTopicConfig(
        process.env.KAFKA_TOPIC_CARE_EVENTS || 'care.events',
        process.env.KAFKA_SCHEMA_VERSION_CARE as EventSchemaVersion || EventSchemaVersion.V1
      ),
      planEvents: createTopicConfig(
        process.env.KAFKA_TOPIC_PLAN_EVENTS || 'plan.events',
        process.env.KAFKA_SCHEMA_VERSION_PLAN as EventSchemaVersion || EventSchemaVersion.V1
      ),
      userEvents: createTopicConfig(
        process.env.KAFKA_TOPIC_USER_EVENTS || 'user.events',
        process.env.KAFKA_SCHEMA_VERSION_USER as EventSchemaVersion || EventSchemaVersion.V1
      ),
      gameEvents: createTopicConfig(
        process.env.KAFKA_TOPIC_GAME_EVENTS || 'game.events',
        process.env.KAFKA_SCHEMA_VERSION_GAME as EventSchemaVersion || EventSchemaVersion.V1
      ),
    },
    
    producer: {
      allowAutoTopicCreation: process.env.KAFKA_ALLOW_AUTO_TOPIC_CREATION === 'true',
      idempotent: process.env.KAFKA_PRODUCER_IDEMPOTENT === 'true',
      transactionalId: process.env.KAFKA_TRANSACTIONAL_ID || undefined,
      // Producer retry configuration
      retry: {
        initialRetryTime: defaultRetryStrategy.initialRetryTime,
        maxRetryTime: defaultRetryStrategy.maxRetryTime,
        factor: defaultRetryStrategy.retryFactor,
        multiplier: 1.5,
        retries: defaultRetryStrategy.maxRetries,
        maxInFlightRequests: parseInt(process.env.KAFKA_MAX_IN_FLIGHT_REQUESTS, 10) || 3,
      } as RetryOptions,
    },
    
    consumer: {
      groupId: process.env.KAFKA_GROUP_ID || 'gamification-consumer-group',
      allowAutoTopicCreation: process.env.KAFKA_ALLOW_AUTO_TOPIC_CREATION === 'true',
      sessionTimeout: parseInt(process.env.KAFKA_SESSION_TIMEOUT, 10) || 30000,
      rebalanceTimeout: parseInt(process.env.KAFKA_REBALANCE_TIMEOUT, 10) || 60000,
      heartbeatInterval: parseInt(process.env.KAFKA_HEARTBEAT_INTERVAL, 10) || 3000,
      maxBytesPerPartition: parseInt(process.env.KAFKA_MAX_BYTES_PER_PARTITION, 10) || 1048576, // 1MB
      maxWaitTimeInMs: parseInt(process.env.KAFKA_MAX_WAIT_TIME, 10) || 5000,
      // Consumer retry configuration
      retry: {
        initialRetryTime: defaultRetryStrategy.initialRetryTime,
        maxRetryTime: defaultRetryStrategy.maxRetryTime,
        factor: defaultRetryStrategy.retryFactor,
        multiplier: 1.5,
        retries: defaultRetryStrategy.maxRetries,
        restartOnFailure: async (error) => {
          console.error('Kafka consumer error, attempting restart:', error.message);
          return true; // Always attempt to restart the consumer
        },
      } as RetryOptions,
    },
    
    retry: defaultRetryStrategy,
    
    errorHandling: {
      logErrors: process.env.KAFKA_LOG_ERRORS !== 'false', // Enabled by default
      rethrowErrors: process.env.KAFKA_RETHROW_ERRORS === 'true', // Disabled by default
    },
  };
});

/**
 * Helper function to create a Kafka retry policy based on the configuration
 * @param config Kafka configuration
 * @returns A function that determines whether to retry and how long to wait
 */
export const createRetryPolicy = (config: KafkaConfiguration) => {
  return (retryCount: number, error: Error): { retry: boolean; retryTime?: number } => {
    // Log the error if configured to do so
    if (config.errorHandling.logErrors) {
      console.error(`Kafka operation failed (attempt ${retryCount + 1}):`, error.message);
    }

    // Don't retry for validation errors (they won't succeed on retry)
    if (error instanceof EventValidationError) {
      console.warn('Not retrying due to validation error:', error.message);
      return { retry: false };
    }

    // Check if we've exceeded the maximum retry count
    if (!config.retry.retryForever && retryCount >= config.retry.maxRetries) {
      return { retry: false };
    }

    // Calculate backoff time using exponential backoff
    const retryTime = calculateBackoff(retryCount, config.retry);

    return { retry: true, retryTime };
  };
};

/**
 * Helper function to create a dead letter queue handler
 * @param config Kafka configuration
 * @param topicName The topic name for which to create a DLQ handler
 * @returns A function that handles failed messages by sending them to the DLQ
 */
/**
 * Helper function to validate an event against its schema
 * @param event The event to validate
 * @param schemaVersion The schema version to use for validation
 * @returns The validated event or throws an error if validation fails
 */
export const validateEvent = (event: any, schemaVersion: EventSchemaVersion): any => {
  try {
    // Get the appropriate schema based on the version
    const schema = EventSchema[schemaVersion];
    if (!schema) {
      throw new Error(`Schema version ${schemaVersion} not found`);
    }
    
    // Validate the event against the schema
    return schema.parse(event);
  } catch (error) {
    throw new EventValidationError(
      `Event validation failed: ${error.message}`,
      { event, schemaVersion, validationErrors: error.errors }
    );
  }
};


export const createDLQHandler = (config: KafkaConfiguration, topicName: string) => {
  const topicConfig = Object.values(config.topics).find(topic => topic.name === topicName);
  
  if (!topicConfig || !topicConfig.dlq || !topicConfig.dlq.enabled) {
    return null; // DLQ not configured for this topic
  }

  return async (message: any, error: Error, producer: any, retryCount: number): Promise<void> => {
    // Special handling for validation errors - always send to DLQ immediately
    const isValidationError = error instanceof EventValidationError;
    if (isValidationError && retryCount < topicConfig.dlq.maxRetries) {
      console.warn('Sending validation error to DLQ without further retries');
      retryCount = topicConfig.dlq.maxRetries; // Force DLQ handling
    }
    
    if (retryCount < topicConfig.dlq.maxRetries) {
      return; // Still within retry limits, don't send to DLQ yet
    }

    try {
      // Prepare the DLQ message with error information
      const dlqMessage = {
        value: JSON.stringify({
          originalMessage: message.value.toString(),
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
            // Include validation details if available
            ...(error instanceof EventValidationError ? { 
              validationErrors: error.context?.validationErrors,
              schemaVersion: error.context?.schemaVersion 
            } : {}),
          },
          timestamp: new Date().toISOString(),
          retryCount,
        }),
        headers: {
          'X-Original-Topic': topicName,
          'X-Error-Message': error.message,
          'X-Error-Type': error.constructor.name,
          'X-Retry-Count': `${retryCount}`,
          'X-Timestamp': new Date().toISOString(),
          ...(error instanceof EventValidationError ? { 'X-Validation-Error': 'true' } : {}),
        },
      };

      // Include original message metadata if configured
      if (topicConfig.dlq.includeMetadata && message.headers) {
        dlqMessage.headers = { ...dlqMessage.headers, ...message.headers };
      }

      // Send the message to the DLQ topic
      await producer.send({
        topic: topicConfig.dlq.topic,
        messages: [dlqMessage],
      });

      console.log(`Message sent to DLQ ${topicConfig.dlq.topic} after ${retryCount} failed attempts`);
    } catch (dlqError) {
      console.error('Failed to send message to DLQ:', dlqError);
      
      // Rethrow if configured to do so
      if (config.errorHandling.rethrowErrors) {
        throw dlqError;
      }
    }
  };
};