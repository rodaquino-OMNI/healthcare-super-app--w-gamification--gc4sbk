/**
 * Error codes for the events module.
 * 
 * These codes provide a standardized way to identify and categorize errors
 * across the AUSTA SuperApp event processing system.
 */
export const ERROR_CODES = {
  // Initialization errors
  INITIALIZATION_FAILED: 'KAFKA_001',
  
  // Producer errors
  PRODUCER_CONNECTION_FAILED: 'KAFKA_101',
  PRODUCER_SEND_FAILED: 'KAFKA_102',
  PRODUCER_BATCH_FAILED: 'KAFKA_103',
  PRODUCER_TRANSACTION_FAILED: 'KAFKA_104',
  
  // Consumer errors
  CONSUMER_CONNECTION_FAILED: 'KAFKA_201',
  CONSUMER_SUBSCRIPTION_FAILED: 'KAFKA_202',
  CONSUMER_GROUP_ERROR: 'KAFKA_203',
  CONSUMER_PROCESSING_FAILED: 'KAFKA_204',
  
  // Message errors
  MESSAGE_SERIALIZATION_FAILED: 'KAFKA_301',
  MESSAGE_DESERIALIZATION_FAILED: 'KAFKA_302',
  
  // Schema errors
  SCHEMA_VALIDATION_FAILED: 'KAFKA_401',
  SCHEMA_VALIDATION_ERROR: 'KAFKA_402',
  SCHEMA_NOT_FOUND: 'KAFKA_403',
  
  // Dead-letter queue errors
  DLQ_SEND_FAILED: 'KAFKA_501',
  
  // Retry errors
  RETRY_EXHAUSTED: 'KAFKA_601',
  RETRY_FAILED: 'KAFKA_602',
};

/**
 * Error messages for the events module.
 * 
 * These messages provide standardized, human-readable descriptions for error codes.
 */
export const ERROR_MESSAGES = {
  [ERROR_CODES.INITIALIZATION_FAILED]: 'Failed to initialize Kafka service',
  
  [ERROR_CODES.PRODUCER_CONNECTION_FAILED]: 'Failed to connect Kafka producer',
  [ERROR_CODES.PRODUCER_SEND_FAILED]: 'Failed to produce message to topic',
  [ERROR_CODES.PRODUCER_BATCH_FAILED]: 'Failed to produce batch of messages to topic',
  [ERROR_CODES.PRODUCER_TRANSACTION_FAILED]: 'Failed to commit Kafka transaction',
  
  [ERROR_CODES.CONSUMER_CONNECTION_FAILED]: 'Failed to connect Kafka consumer',
  [ERROR_CODES.CONSUMER_SUBSCRIPTION_FAILED]: 'Failed to subscribe to Kafka topic',
  [ERROR_CODES.CONSUMER_GROUP_ERROR]: 'Error in Kafka consumer group',
  [ERROR_CODES.CONSUMER_PROCESSING_FAILED]: 'Failed to process message from topic',
  
  [ERROR_CODES.MESSAGE_SERIALIZATION_FAILED]: 'Failed to serialize message',
  [ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED]: 'Failed to deserialize message',
  
  [ERROR_CODES.SCHEMA_VALIDATION_FAILED]: 'Message failed schema validation',
  [ERROR_CODES.SCHEMA_VALIDATION_ERROR]: 'Error during schema validation',
  [ERROR_CODES.SCHEMA_NOT_FOUND]: 'Schema not found for topic or event type',
  
  [ERROR_CODES.DLQ_SEND_FAILED]: 'Failed to send message to dead-letter queue',
  
  [ERROR_CODES.RETRY_EXHAUSTED]: 'Maximum retry attempts exceeded',
  [ERROR_CODES.RETRY_FAILED]: 'Failed to retry message processing',
};