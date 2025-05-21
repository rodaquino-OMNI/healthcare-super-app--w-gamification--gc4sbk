import { registerAs } from '@nestjs/config';
import { ConsumerConfig, KafkaConfig, ProducerConfig } from 'kafkajs';

/**
 * Interface for Dead Letter Queue configuration
 */
export interface DeadLetterQueueConfig {
  /** Topic name for the dead letter queue */
  topic: string;
  /** Maximum number of retries before sending to DLQ */
  maxRetries: number;
  /** Whether to include the original message headers in the DLQ message */
  includeHeaders: boolean;
  /** Whether to include the exception details in the DLQ message */
  includeException: boolean;
}

/**
 * Interface for Retry Strategy configuration
 */
export interface RetryStrategyConfig {
  /** Initial retry delay in milliseconds */
  initialRetryTime: number;
  /** Maximum retry time in milliseconds */
  maxRetryTime: number;
  /** Factor by which retry time increases with each attempt */
  retryFactor: number;
  /** Maximum number of retries before giving up */
  maxRetries: number;
}

/**
 * Interface for Kafka Topic configuration
 */
export interface KafkaTopicConfig {
  /** Topic name */
  name: string;
  /** Number of partitions for the topic */
  partitions?: number;
  /** Replication factor for the topic */
  replicationFactor?: number;
  /** Dead letter queue configuration for this topic */
  deadLetterQueue?: DeadLetterQueueConfig;
}

/**
 * Interface for Kafka Topics configuration
 */
export interface KafkaTopicsConfig {
  /** Health journey events topic */
  healthEvents: KafkaTopicConfig;
  /** Care journey events topic */
  careEvents: KafkaTopicConfig;
  /** Plan journey events topic */
  planEvents: KafkaTopicConfig;
  /** User events topic */
  userEvents: KafkaTopicConfig;
  /** Game events topic */
  gameEvents: KafkaTopicConfig;
  /** Dead letter queue topics */
  deadLetterQueues: {
    /** Health journey DLQ topic */
    health: KafkaTopicConfig;
    /** Care journey DLQ topic */
    care: KafkaTopicConfig;
    /** Plan journey DLQ topic */
    plan: KafkaTopicConfig;
    /** User DLQ topic */
    user: KafkaTopicConfig;
    /** Game DLQ topic */
    game: KafkaTopicConfig;
  };
}

/**
 * Interface for Kafka Error Handling configuration
 */
export interface KafkaErrorHandlingConfig {
  /** Retry strategy configuration */
  retryStrategy: RetryStrategyConfig;
  /** Whether to use circuit breaker pattern */
  useCircuitBreaker: boolean;
  /** Circuit breaker failure threshold */
  circuitBreakerFailureThreshold?: number;
  /** Circuit breaker reset timeout in milliseconds */
  circuitBreakerResetTimeout?: number;
  /** Whether to log errors */
  logErrors: boolean;
}

/**
 * Interface for Kafka Configuration
 */
export interface KafkaConfiguration {
  /** Kafka client ID */
  clientId: string;
  /** Kafka brokers */
  brokers: string[];
  /** Consumer group ID */
  groupId: string;
  /** Topics configuration */
  topics: KafkaTopicsConfig;
  /** Error handling configuration */
  errorHandling: KafkaErrorHandlingConfig;
  /** KafkaJS consumer configuration */
  consumer?: Partial<ConsumerConfig>;
  /** KafkaJS producer configuration */
  producer?: Partial<ProducerConfig>;
  /** KafkaJS client configuration */
  client?: Partial<KafkaConfig>;
}

/**
 * Kafka configuration for the Gamification Engine.
 * Includes broker connection, consumer groups, topic definitions, and retry strategies.
 * 
 * @returns Kafka configuration object
 */
export const kafkaConfig = registerAs('kafka', (): KafkaConfiguration => {
  // Default DLQ configuration
  const defaultDLQConfig: DeadLetterQueueConfig = {
    maxRetries: parseInt(process.env.KAFKA_DLQ_MAX_RETRIES || '3', 10),
    includeHeaders: true,
    includeException: true,
  };

  // Default retry strategy with exponential backoff
  const defaultRetryStrategy: RetryStrategyConfig = {
    initialRetryTime: parseInt(process.env.KAFKA_INITIAL_RETRY_TIME || '100', 10),
    maxRetryTime: parseInt(process.env.KAFKA_MAX_RETRY_TIME || '30000', 10),
    retryFactor: parseFloat(process.env.KAFKA_RETRY_FACTOR || '2'),
    maxRetries: parseInt(process.env.KAFKA_MAX_RETRIES || '5', 10),
  };

  return {
    clientId: process.env.KAFKA_CLIENT_ID || 'gamification-engine',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    groupId: process.env.KAFKA_GROUP_ID || 'gamification-consumer-group',
    
    // Topic configuration
    topics: {
      healthEvents: {
        name: process.env.KAFKA_TOPIC_HEALTH_EVENTS || 'health.events',
        partitions: parseInt(process.env.KAFKA_TOPIC_HEALTH_EVENTS_PARTITIONS || '3', 10),
        replicationFactor: parseInt(process.env.KAFKA_TOPIC_HEALTH_EVENTS_REPLICATION_FACTOR || '3', 10),
        deadLetterQueue: {
          ...defaultDLQConfig,
          topic: process.env.KAFKA_TOPIC_HEALTH_EVENTS_DLQ || 'health.events.dlq',
        },
      },
      careEvents: {
        name: process.env.KAFKA_TOPIC_CARE_EVENTS || 'care.events',
        partitions: parseInt(process.env.KAFKA_TOPIC_CARE_EVENTS_PARTITIONS || '3', 10),
        replicationFactor: parseInt(process.env.KAFKA_TOPIC_CARE_EVENTS_REPLICATION_FACTOR || '3', 10),
        deadLetterQueue: {
          ...defaultDLQConfig,
          topic: process.env.KAFKA_TOPIC_CARE_EVENTS_DLQ || 'care.events.dlq',
        },
      },
      planEvents: {
        name: process.env.KAFKA_TOPIC_PLAN_EVENTS || 'plan.events',
        partitions: parseInt(process.env.KAFKA_TOPIC_PLAN_EVENTS_PARTITIONS || '3', 10),
        replicationFactor: parseInt(process.env.KAFKA_TOPIC_PLAN_EVENTS_REPLICATION_FACTOR || '3', 10),
        deadLetterQueue: {
          ...defaultDLQConfig,
          topic: process.env.KAFKA_TOPIC_PLAN_EVENTS_DLQ || 'plan.events.dlq',
        },
      },
      userEvents: {
        name: process.env.KAFKA_TOPIC_USER_EVENTS || 'user.events',
        partitions: parseInt(process.env.KAFKA_TOPIC_USER_EVENTS_PARTITIONS || '3', 10),
        replicationFactor: parseInt(process.env.KAFKA_TOPIC_USER_EVENTS_REPLICATION_FACTOR || '3', 10),
        deadLetterQueue: {
          ...defaultDLQConfig,
          topic: process.env.KAFKA_TOPIC_USER_EVENTS_DLQ || 'user.events.dlq',
        },
      },
      gameEvents: {
        name: process.env.KAFKA_TOPIC_GAME_EVENTS || 'game.events',
        partitions: parseInt(process.env.KAFKA_TOPIC_GAME_EVENTS_PARTITIONS || '3', 10),
        replicationFactor: parseInt(process.env.KAFKA_TOPIC_GAME_EVENTS_REPLICATION_FACTOR || '3', 10),
        deadLetterQueue: {
          ...defaultDLQConfig,
          topic: process.env.KAFKA_TOPIC_GAME_EVENTS_DLQ || 'game.events.dlq',
        },
      },
      // Dead letter queue topics configuration
      deadLetterQueues: {
        health: {
          name: process.env.KAFKA_TOPIC_HEALTH_EVENTS_DLQ || 'health.events.dlq',
          partitions: parseInt(process.env.KAFKA_TOPIC_HEALTH_EVENTS_DLQ_PARTITIONS || '3', 10),
          replicationFactor: parseInt(process.env.KAFKA_TOPIC_HEALTH_EVENTS_DLQ_REPLICATION_FACTOR || '3', 10),
        },
        care: {
          name: process.env.KAFKA_TOPIC_CARE_EVENTS_DLQ || 'care.events.dlq',
          partitions: parseInt(process.env.KAFKA_TOPIC_CARE_EVENTS_DLQ_PARTITIONS || '3', 10),
          replicationFactor: parseInt(process.env.KAFKA_TOPIC_CARE_EVENTS_DLQ_REPLICATION_FACTOR || '3', 10),
        },
        plan: {
          name: process.env.KAFKA_TOPIC_PLAN_EVENTS_DLQ || 'plan.events.dlq',
          partitions: parseInt(process.env.KAFKA_TOPIC_PLAN_EVENTS_DLQ_PARTITIONS || '3', 10),
          replicationFactor: parseInt(process.env.KAFKA_TOPIC_PLAN_EVENTS_DLQ_REPLICATION_FACTOR || '3', 10),
        },
        user: {
          name: process.env.KAFKA_TOPIC_USER_EVENTS_DLQ || 'user.events.dlq',
          partitions: parseInt(process.env.KAFKA_TOPIC_USER_EVENTS_DLQ_PARTITIONS || '3', 10),
          replicationFactor: parseInt(process.env.KAFKA_TOPIC_USER_EVENTS_DLQ_REPLICATION_FACTOR || '3', 10),
        },
        game: {
          name: process.env.KAFKA_TOPIC_GAME_EVENTS_DLQ || 'game.events.dlq',
          partitions: parseInt(process.env.KAFKA_TOPIC_GAME_EVENTS_DLQ_PARTITIONS || '3', 10),
          replicationFactor: parseInt(process.env.KAFKA_TOPIC_GAME_EVENTS_DLQ_REPLICATION_FACTOR || '3', 10),
        },
      },
    },
    
    // Error handling configuration with exponential backoff retry strategy
    errorHandling: {
      retryStrategy: defaultRetryStrategy,
      useCircuitBreaker: process.env.KAFKA_USE_CIRCUIT_BREAKER === 'true',
      circuitBreakerFailureThreshold: parseInt(process.env.KAFKA_CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5', 10),
      circuitBreakerResetTimeout: parseInt(process.env.KAFKA_CIRCUIT_BREAKER_RESET_TIMEOUT || '30000', 10),
      logErrors: process.env.KAFKA_LOG_ERRORS !== 'false',
    },
    
    // KafkaJS consumer configuration
    consumer: {
      allowAutoTopicCreation: process.env.KAFKA_ALLOW_AUTO_TOPIC_CREATION === 'true',
      sessionTimeout: parseInt(process.env.KAFKA_SESSION_TIMEOUT || '30000', 10),
      rebalanceTimeout: parseInt(process.env.KAFKA_REBALANCE_TIMEOUT || '60000', 10),
      heartbeatInterval: parseInt(process.env.KAFKA_HEARTBEAT_INTERVAL || '3000', 10),
      maxBytesPerPartition: parseInt(process.env.KAFKA_MAX_BYTES_PER_PARTITION || '1048576', 10), // 1MB
      maxWaitTimeInMs: parseInt(process.env.KAFKA_MAX_WAIT_TIME_IN_MS || '5000', 10),
    },
    
    // KafkaJS producer configuration
    producer: {
      allowAutoTopicCreation: process.env.KAFKA_ALLOW_AUTO_TOPIC_CREATION === 'true',
      transactionTimeout: parseInt(process.env.KAFKA_TRANSACTION_TIMEOUT || '60000', 10),
      idempotent: process.env.KAFKA_IDEMPOTENT === 'true',
      maxInFlightRequests: parseInt(process.env.KAFKA_MAX_IN_FLIGHT_REQUESTS || '5', 10),
    },
    
    // KafkaJS client configuration
    client: {
      connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || '3000', 10),
      requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT || '30000', 10),
    },
  };
});

/**
 * Helper function to create a dead letter topic name from a source topic
 * 
 * @param sourceTopic The source topic name
 * @returns The dead letter topic name
 */
export const createDeadLetterTopicName = (sourceTopic: string): string => {
  return `${sourceTopic}.dlq`;
};

/**
 * Helper function to calculate exponential backoff delay
 * 
 * @param attempt The current retry attempt (1-based)
 * @param config The retry strategy configuration
 * @returns The delay in milliseconds for the next retry
 */
export const calculateBackoffDelay = (
  attempt: number,
  config: RetryStrategyConfig = kafkaConfig().errorHandling.retryStrategy,
): number => {
  if (attempt <= 0) {
    return 0;
  }

  // Calculate exponential backoff: initialRetryTime * (retryFactor ^ (attempt - 1))
  const delay = config.initialRetryTime * Math.pow(config.retryFactor, attempt - 1);
  
  // Cap at maxRetryTime
  return Math.min(delay, config.maxRetryTime);
};

/**
 * Helper function to determine if a message should be retried or sent to DLQ
 * 
 * @param attempt The current retry attempt (1-based)
 * @param error The error that occurred
 * @param config The retry strategy configuration
 * @returns True if the message should be retried, false if it should be sent to DLQ
 */
export const shouldRetryMessage = (
  attempt: number,
  error: Error,
  config: RetryStrategyConfig = kafkaConfig().errorHandling.retryStrategy,
): boolean => {
  // Don't retry if we've exceeded max retries
  if (attempt >= config.maxRetries) {
    return false;
  }

  // Don't retry certain types of errors (e.g., validation errors)
  if (error.name === 'ValidationError' || error.name === 'SchemaValidationError') {
    return false;
  }

  // Retry for transient errors
  if (
    error.name === 'ConnectionError' ||
    error.name === 'RequestTimeoutError' ||
    error.name === 'BrokerNotAvailableError'
  ) {
    return true;
  }

  // Default to retry for other errors
  return true;
};