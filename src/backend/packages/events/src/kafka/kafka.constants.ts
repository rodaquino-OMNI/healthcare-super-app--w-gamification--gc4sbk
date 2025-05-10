/**
 * Default retry options for Kafka operations.
 */
export const KAFKA_DEFAULT_RETRY_OPTIONS = {
  /**
   * Initial interval in milliseconds between retry attempts.
   */
  initialInterval: 300,
  
  /**
   * Maximum interval in milliseconds between retry attempts.
   */
  maxInterval: 30000,
  
  /**
   * Maximum number of retry attempts.
   */
  maxAttempts: 10,
  
  /**
   * Multiplier for exponential backoff.
   */
  multiplier: 2,
  
  /**
   * Jitter factor to add randomness to backoff times (0-1).
   */
  jitter: 0.2
};

/**
 * Default dead letter queue options.
 */
export const KAFKA_DEFAULT_DLQ_OPTIONS = {
  /**
   * Whether dead letter queue is enabled by default.
   */
  enabled: true,
  
  /**
   * Default suffix to append to original topic name for DLQ topics.
   */
  topicSuffix: 'dlq',
  
  /**
   * Whether to send producer errors to DLQ by default.
   */
  producerErrors: true,
  
  /**
   * Whether to send consumer errors to DLQ by default.
   */
  consumerErrors: true
};

/**
 * Default schema validation options.
 */
export const KAFKA_DEFAULT_SCHEMA_OPTIONS = {
  /**
   * Whether schema validation is enabled by default.
   */
  enabled: false,
  
  /**
   * Default URL of the schema registry.
   */
  registryUrl: 'http://localhost:8081',
  
  /**
   * Whether to validate messages during production by default.
   */
  validateProducer: false,
  
  /**
   * Whether to validate messages during consumption by default.
   */
  validateConsumer: false
};

/**
 * Error codes for Kafka operations.
 */
export enum KAFKA_ERROR_CODES {
  /**
   * Error during Kafka service initialization.
   */
  INIT_ERROR = 'KAFKA_INIT_001',
  
  /**
   * Error during message production.
   */
  PRODUCE_ERROR = 'KAFKA_PRODUCE_001',
  
  /**
   * Error during batch message production.
   */
  PRODUCE_BATCH_ERROR = 'KAFKA_PRODUCE_BATCH_001',
  
  /**
   * Error during message consumption.
   */
  CONSUME_ERROR = 'KAFKA_CONSUME_001',
  
  /**
   * Error during consumer subscription.
   */
  SUBSCRIBE_ERROR = 'KAFKA_CONSUME_002',
  
  /**
   * Error during producer connection.
   */
  PRODUCER_CONNECTION_ERROR = 'KAFKA_PRODUCER_001',
  
  /**
   * Error during consumer connection.
   */
  CONSUMER_CONNECTION_ERROR = 'KAFKA_CONSUMER_001',
  
  /**
   * Error during message serialization.
   */
  SERIALIZE_ERROR = 'KAFKA_SERIALIZE_001',
  
  /**
   * Error during message deserialization.
   */
  DESERIALIZE_ERROR = 'KAFKA_DESERIALIZE_001',
  
  /**
   * Error during schema validation.
   */
  SCHEMA_VALIDATION_ERROR = 'KAFKA_SCHEMA_001'
}

/**
 * Default Kafka client ID prefix.
 */
export const KAFKA_DEFAULT_CLIENT_ID_PREFIX = 'austa';

/**
 * Default Kafka consumer group ID prefix.
 */
export const KAFKA_DEFAULT_GROUP_ID_PREFIX = 'austa-consumer';

/**
 * Default Kafka broker address.
 */
export const KAFKA_DEFAULT_BROKER = 'localhost:9092';

/**
 * Header names for Kafka messages.
 */
export enum KAFKA_HEADER_NAMES {
  /**
   * Trace ID header for distributed tracing.
   */
  TRACE_ID = 'trace-id',
  
  /**
   * Span ID header for distributed tracing.
   */
  SPAN_ID = 'span-id',
  
  /**
   * Message ID header for message identification.
   */
  MESSAGE_ID = 'message-id',
  
  /**
   * Timestamp header for message timing.
   */
  TIMESTAMP = 'timestamp',
  
  /**
   * Retry count header for tracking retry attempts.
   */
  RETRY_COUNT = 'retry-count',
  
  /**
   * Original topic header for DLQ messages.
   */
  ORIGINAL_TOPIC = 'original-topic',
  
  /**
   * Error message header for DLQ messages.
   */
  ERROR_MESSAGE = 'error-message',
  
  /**
   * Error time header for DLQ messages.
   */
  ERROR_TIME = 'error-time',
  
  /**
   * Service namespace header for message source identification.
   */
  SERVICE_NAMESPACE = 'service-namespace',
  
  /**
   * Original partition header for DLQ messages.
   */
  ORIGINAL_PARTITION = 'original-partition',
  
  /**
   * Original offset header for DLQ messages.
   */
  ORIGINAL_OFFSET = 'original-offset',
  
  /**
   * Schema ID header for schema validation.
   */
  SCHEMA_ID = 'schema-id'
}