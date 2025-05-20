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

/**
 * Error severity classifications for the events module.
 * 
 * These severity levels help determine the appropriate logging level and alerting
 * for different types of errors in the event processing system.
 * 
 * - CRITICAL: Severe errors that require immediate attention and likely indicate
 *             a system-wide failure or outage.
 * - ERROR: Significant errors that affect functionality but may be limited in scope
 *          to specific events or operations.
 * - WARNING: Issues that should be noted but don't necessarily indicate failure,
 *            such as expected retry scenarios or minor configuration issues.
 * - INFO: Informational messages about potential issues that don't affect functionality.
 */
export const ERROR_SEVERITY = {
  // Initialization errors - CRITICAL (system can't function)
  [ERROR_CODES.INITIALIZATION_FAILED]: 'CRITICAL',
  
  // Producer errors - Mix of CRITICAL and ERROR
  [ERROR_CODES.PRODUCER_CONNECTION_FAILED]: 'CRITICAL', // Can't produce any messages
  [ERROR_CODES.PRODUCER_SEND_FAILED]: 'ERROR', // Individual message failure
  [ERROR_CODES.PRODUCER_BATCH_FAILED]: 'ERROR', // Batch failure
  [ERROR_CODES.PRODUCER_TRANSACTION_FAILED]: 'ERROR', // Transaction failure
  
  // Consumer errors - Mix of CRITICAL and ERROR
  [ERROR_CODES.CONSUMER_CONNECTION_FAILED]: 'CRITICAL', // Can't consume any messages
  [ERROR_CODES.CONSUMER_SUBSCRIPTION_FAILED]: 'CRITICAL', // Can't subscribe to topics
  [ERROR_CODES.CONSUMER_GROUP_ERROR]: 'ERROR', // Group coordination issues
  [ERROR_CODES.CONSUMER_PROCESSING_FAILED]: 'ERROR', // Individual message processing failure
  
  // Message errors - ERROR (affects individual messages)
  [ERROR_CODES.MESSAGE_SERIALIZATION_FAILED]: 'ERROR',
  [ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED]: 'ERROR',
  
  // Schema errors - ERROR (validation failures)
  [ERROR_CODES.SCHEMA_VALIDATION_FAILED]: 'ERROR',
  [ERROR_CODES.SCHEMA_VALIDATION_ERROR]: 'ERROR',
  [ERROR_CODES.SCHEMA_NOT_FOUND]: 'ERROR',
  
  // Dead-letter queue errors - WARNING (message already failed, this is secondary)
  [ERROR_CODES.DLQ_SEND_FAILED]: 'WARNING',
  
  // Retry errors - WARNING (expected in some scenarios)
  [ERROR_CODES.RETRY_EXHAUSTED]: 'WARNING',
  [ERROR_CODES.RETRY_FAILED]: 'ERROR', // Unexpected retry failure
};

/**
 * HTTP status code mappings for the events module.
 * 
 * These mappings provide standardized HTTP status codes to return when
 * event-related errors occur in REST API endpoints.
 */
export const HTTP_STATUS_CODES = {
  // Initialization errors - 500 Internal Server Error
  [ERROR_CODES.INITIALIZATION_FAILED]: 500,
  
  // Producer errors
  [ERROR_CODES.PRODUCER_CONNECTION_FAILED]: 503, // Service Unavailable
  [ERROR_CODES.PRODUCER_SEND_FAILED]: 500, // Internal Server Error
  [ERROR_CODES.PRODUCER_BATCH_FAILED]: 500, // Internal Server Error
  [ERROR_CODES.PRODUCER_TRANSACTION_FAILED]: 500, // Internal Server Error
  
  // Consumer errors
  [ERROR_CODES.CONSUMER_CONNECTION_FAILED]: 503, // Service Unavailable
  [ERROR_CODES.CONSUMER_SUBSCRIPTION_FAILED]: 503, // Service Unavailable
  [ERROR_CODES.CONSUMER_GROUP_ERROR]: 500, // Internal Server Error
  [ERROR_CODES.CONSUMER_PROCESSING_FAILED]: 500, // Internal Server Error
  
  // Message errors
  [ERROR_CODES.MESSAGE_SERIALIZATION_FAILED]: 400, // Bad Request
  [ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED]: 400, // Bad Request
  
  // Schema errors
  [ERROR_CODES.SCHEMA_VALIDATION_FAILED]: 400, // Bad Request
  [ERROR_CODES.SCHEMA_VALIDATION_ERROR]: 400, // Bad Request
  [ERROR_CODES.SCHEMA_NOT_FOUND]: 500, // Internal Server Error
  
  // Dead-letter queue errors
  [ERROR_CODES.DLQ_SEND_FAILED]: 500, // Internal Server Error
  
  // Retry errors
  [ERROR_CODES.RETRY_EXHAUSTED]: 503, // Service Unavailable
  [ERROR_CODES.RETRY_FAILED]: 500, // Internal Server Error
};