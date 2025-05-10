import { IHeaders } from 'kafkajs';

/**
 * Configuration options for Kafka client.
 */
export interface KafkaConfigOptions {
  /**
   * Service-specific namespace for configuration.
   */
  serviceNamespace?: string;
  
  /**
   * Kafka broker addresses.
   */
  brokers?: string | string[];
  
  /**
   * Client ID for Kafka connection.
   */
  clientId?: string;
  
  /**
   * Whether to use SSL for Kafka connection.
   */
  ssl?: boolean;
  
  /**
   * SASL authentication configuration.
   */
  sasl?: {
    enabled: boolean;
    mechanism: string;
    username: string;
    password: string;
  };
  
  /**
   * Retry configuration for Kafka operations.
   */
  retry?: RetryOptions;
  
  /**
   * Dead letter queue configuration.
   */
  dlq?: DeadLetterQueueOptions;
  
  /**
   * Schema validation configuration.
   */
  schema?: SchemaValidationOptions;
}

/**
 * Options for retry behavior.
 */
export interface RetryOptions {
  /**
   * Initial interval in milliseconds between retry attempts.
   */
  initialInterval: number;
  
  /**
   * Maximum interval in milliseconds between retry attempts.
   */
  maxInterval: number;
  
  /**
   * Maximum number of retry attempts.
   */
  maxAttempts: number;
  
  /**
   * Multiplier for exponential backoff.
   */
  multiplier: number;
  
  /**
   * Jitter factor to add randomness to backoff times (0-1).
   */
  jitter: number;
}

/**
 * Options for dead letter queue handling.
 */
export interface DeadLetterQueueOptions {
  /**
   * Whether dead letter queue is enabled.
   */
  enabled: boolean;
  
  /**
   * Suffix to append to original topic name for DLQ topics.
   */
  topicSuffix: string;
  
  /**
   * Whether to send producer errors to DLQ.
   */
  producerErrors: boolean;
  
  /**
   * Whether to send consumer errors to DLQ.
   */
  consumerErrors: boolean;
}

/**
 * Options for schema validation.
 */
export interface SchemaValidationOptions {
  /**
   * Whether schema validation is enabled.
   */
  enabled: boolean;
  
  /**
   * URL of the schema registry.
   */
  registryUrl: string;
  
  /**
   * Whether to validate messages during production.
   */
  validateProducer: boolean;
  
  /**
   * Whether to validate messages during consumption.
   */
  validateConsumer: boolean;
}

/**
 * Represents a Kafka message with its value.
 */
export type KafkaMessage = any;

/**
 * Metadata associated with a Kafka message.
 */
export interface KafkaMessageMetadata {
  /**
   * Topic the message was consumed from.
   */
  topic: string;
  
  /**
   * Partition the message was consumed from.
   */
  partition: number;
  
  /**
   * Offset of the message in the partition.
   */
  offset: string;
  
  /**
   * Timestamp of the message.
   */
  timestamp: string;
  
  /**
   * Headers associated with the message.
   */
  headers: Record<string, string>;
  
  /**
   * Key of the message, if any.
   */
  key?: string;
}

/**
 * Configuration for a Kafka consumer.
 */
export interface KafkaConsumerConfig {
  /**
   * Group ID for the consumer.
   */
  groupId: string;
  
  /**
   * Whether to start consuming from the beginning of the topic.
   */
  fromBeginning?: boolean;
  
  /**
   * Whether to auto-commit offsets.
   */
  autoCommit?: boolean;
  
  /**
   * Schema ID for validation, if applicable.
   */
  schemaId?: number;
  
  /**
   * Whether to validate messages against a schema.
   */
  validateSchema?: boolean;
}

/**
 * Configuration for a Kafka producer.
 */
export interface KafkaProducerConfig {
  /**
   * Schema ID for validation, if applicable.
   */
  schemaId?: number;
  
  /**
   * Whether to validate messages against a schema.
   */
  validateSchema?: boolean;
  
  /**
   * Whether to use transactions for guaranteed delivery.
   */
  transactional?: boolean;
  
  /**
   * Whether to enable idempotent production.
   */
  idempotent?: boolean;
}

/**
 * Represents a batch of messages to be produced to Kafka.
 */
export interface KafkaMessageBatch {
  /**
   * Topic to produce messages to.
   */
  topic: string;
  
  /**
   * Array of messages to produce.
   */
  messages: Array<{
    /**
     * Message value.
     */
    value: any;
    
    /**
     * Optional message key.
     */
    key?: string;
    
    /**
     * Optional message headers.
     */
    headers?: Record<string, string>;
  }>;
  
  /**
   * Optional producer configuration.
   */
  options?: KafkaProducerConfig;
}