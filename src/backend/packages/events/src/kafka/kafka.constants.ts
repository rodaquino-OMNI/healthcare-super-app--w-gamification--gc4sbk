/**
 * Constants used in Kafka integration.
 */

/**
 * Error codes for Kafka operations.
 */
export enum KafkaErrorCode {
  // Connection errors
  CONNECTION_ERROR = 'KAFKA_001',
  PRODUCER_CONNECTION_ERROR = 'KAFKA_002',
  CONSUMER_CONNECTION_ERROR = 'KAFKA_003',
  INITIALIZATION_ERROR = 'KAFKA_004',
  
  // Producer errors
  PRODUCER_ERROR = 'KAFKA_101',
  TOPIC_CREATION_ERROR = 'KAFKA_102',
  MESSAGE_DELIVERY_ERROR = 'KAFKA_103',
  BATCH_OPERATION_ERROR = 'KAFKA_104',
  
  // Consumer errors
  CONSUMER_ERROR = 'KAFKA_201',
  SUBSCRIPTION_ERROR = 'KAFKA_202',
  OFFSET_COMMIT_ERROR = 'KAFKA_203',
  GROUP_JOIN_ERROR = 'KAFKA_204',
  
  // Serialization errors
  SERIALIZATION_ERROR = 'KAFKA_301',
  DESERIALIZATION_ERROR = 'KAFKA_302',
  
  // Validation errors
  VALIDATION_ERROR = 'KAFKA_401',
  SCHEMA_VALIDATION_ERROR = 'KAFKA_402',
  
  // Dead letter queue errors
  DLQ_ERROR = 'KAFKA_501',
  RETRY_ERROR = 'KAFKA_502',
  
  // Other errors
  UNKNOWN_ERROR = 'KAFKA_999'
}

/**
 * Default topic names for system topics.
 */
export enum KafkaDefaultTopics {
  DEAD_LETTER_QUEUE_SUFFIX = '.dlq',
  RETRY_TOPIC_SUFFIX = '.retry',
  ERROR_TOPIC_SUFFIX = '.error'
}

/**
 * Default consumer group names.
 */
export enum KafkaDefaultConsumerGroups {
  RETRY_SUFFIX = '-retry',
  DLQ_SUFFIX = '-dlq',
  ERROR_SUFFIX = '-error'
}

/**
 * Default header names for Kafka messages.
 */
export enum KafkaHeaderNames {
  RETRY_COUNT = 'x-retry-count',
  ORIGINAL_TOPIC = 'x-original-topic',
  ERROR_TYPE = 'x-error-type',
  TIMESTAMP = 'x-timestamp',
  SERVICE_NAME = 'x-service-name',
  CORRELATION_ID = 'x-correlation-id',
  TRACE_ID = 'x-trace-id',
  SPAN_ID = 'x-span-id'
}

/**
 * Default retry configuration.
 */
export const DEFAULT_RETRY_CONFIG = {
  initialRetryTime: 300, // ms
  retries: 10,
  factor: 2, // Exponential backoff factor
  maxRetryTime: 30000, // 30 seconds
  multiplier: 1.5
};

/**
 * Default dead letter queue configuration.
 */
export const DEFAULT_DLQ_CONFIG = {
  enabled: true,
  retryEnabled: true,
  maxRetries: 3,
  baseBackoffMs: 1000, // 1 second
  maxBackoffMs: 30000, // 30 seconds
};

/**
 * Default consumer configuration.
 */
export const DEFAULT_CONSUMER_CONFIG = {
  sessionTimeout: 30000, // 30 seconds
  heartbeatInterval: 3000, // 3 seconds
  maxWaitTimeInMs: 1000, // 1 second
  maxBytes: 1048576, // 1MB
  fromBeginning: false
};

/**
 * Default producer configuration.
 */
export const DEFAULT_PRODUCER_CONFIG = {
  allowAutoTopicCreation: true,
  idempotent: true,
  maxInFlightRequests: 5,
  acks: -1 // Wait for all replicas to acknowledge
};