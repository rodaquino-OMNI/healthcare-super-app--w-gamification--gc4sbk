/**
 * Error constants for the event processing system.
 * These constants provide consistent error codes, messages, and severity levels
 * for issues encountered during event production, consumption, validation, and delivery.
 */

// Import global error codes for integration
import {
  GAME_INVALID_EVENT_DATA,
  GAME_ACHIEVEMENT_RULE_ERROR,
  SYS_INTERNAL_SERVER_ERROR,
  API_INVALID_INPUT,
} from '@app/shared/constants/error-codes.constants';

/**
 * Error severity levels for appropriate logging and alerting
 */
export enum EventErrorSeverity {
  INFO = 'INFO',         // Informational, no action needed
  WARNING = 'WARNING',   // Potential issue, monitor but no immediate action
  ERROR = 'ERROR',       // Significant issue requiring attention
  CRITICAL = 'CRITICAL', // Severe issue requiring immediate action
}

/**
 * HTTP status codes for REST API error responses
 */
export enum EventErrorHttpStatus {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Producer error codes - Issues when publishing events
 */
export const EVENT_PRODUCER_CONNECTION_ERROR = 'EVENT_001';
export const EVENT_PRODUCER_SERIALIZATION_ERROR = 'EVENT_002';
export const EVENT_PRODUCER_TOPIC_NOT_FOUND = 'EVENT_003';
export const EVENT_PRODUCER_AUTHORIZATION_ERROR = 'EVENT_004';
export const EVENT_PRODUCER_RATE_LIMIT_EXCEEDED = 'EVENT_005';
export const EVENT_PRODUCER_TIMEOUT = 'EVENT_006';

/**
 * Consumer error codes - Issues when consuming events
 */
export const EVENT_CONSUMER_CONNECTION_ERROR = 'EVENT_101';
export const EVENT_CONSUMER_DESERIALIZATION_ERROR = 'EVENT_102';
export const EVENT_CONSUMER_GROUP_ERROR = 'EVENT_103';
export const EVENT_CONSUMER_AUTHORIZATION_ERROR = 'EVENT_104';
export const EVENT_CONSUMER_PROCESSING_ERROR = 'EVENT_105';
export const EVENT_CONSUMER_COMMIT_ERROR = 'EVENT_106';

/**
 * Schema validation error codes - Issues with event data format
 */
export const EVENT_SCHEMA_INVALID_FORMAT = 'EVENT_201';
export const EVENT_SCHEMA_MISSING_REQUIRED_FIELD = 'EVENT_202';
export const EVENT_SCHEMA_INVALID_FIELD_TYPE = 'EVENT_203';
export const EVENT_SCHEMA_VERSION_MISMATCH = 'EVENT_204';
export const EVENT_SCHEMA_UNKNOWN_EVENT_TYPE = 'EVENT_205';
export const EVENT_SCHEMA_JOURNEY_MISMATCH = 'EVENT_206';

/**
 * Delivery error codes - Issues with event delivery
 */
export const EVENT_DELIVERY_TIMEOUT = 'EVENT_301';
export const EVENT_DELIVERY_RETRY_EXHAUSTED = 'EVENT_302';
export const EVENT_DELIVERY_DEAD_LETTER = 'EVENT_303';
export const EVENT_DELIVERY_DUPLICATE = 'EVENT_304';
export const EVENT_DELIVERY_OUT_OF_ORDER = 'EVENT_305';
export const EVENT_DELIVERY_PARTITION_ERROR = 'EVENT_306';

/**
 * General event system error codes - General issues with the event system
 */
export const EVENT_SYSTEM_CONFIGURATION_ERROR = 'EVENT_401';
export const EVENT_SYSTEM_RESOURCE_EXHAUSTED = 'EVENT_402';
export const EVENT_SYSTEM_DEPENDENCY_ERROR = 'EVENT_403';
export const EVENT_SYSTEM_UNEXPECTED_ERROR = 'EVENT_404';
export const EVENT_SYSTEM_SHUTDOWN = 'EVENT_405';

/**
 * Error messages with troubleshooting guidance
 */
export const EVENT_ERROR_MESSAGES = {
  // Producer error messages
  [EVENT_PRODUCER_CONNECTION_ERROR]: 'Failed to connect to event broker. Check network connectivity and broker status.',
  [EVENT_PRODUCER_SERIALIZATION_ERROR]: 'Failed to serialize event data. Verify event structure matches schema definition.',
  [EVENT_PRODUCER_TOPIC_NOT_FOUND]: 'Event topic not found. Verify topic name and ensure it exists on the broker.',
  [EVENT_PRODUCER_AUTHORIZATION_ERROR]: 'Not authorized to publish to event topic. Check producer credentials and permissions.',
  [EVENT_PRODUCER_RATE_LIMIT_EXCEEDED]: 'Event production rate limit exceeded. Implement backoff strategy or increase limits.',
  [EVENT_PRODUCER_TIMEOUT]: 'Timeout while publishing event. Check broker performance and network latency.',
  
  // Consumer error messages
  [EVENT_CONSUMER_CONNECTION_ERROR]: 'Failed to connect to event broker for consumption. Check network connectivity and broker status.',
  [EVENT_CONSUMER_DESERIALIZATION_ERROR]: 'Failed to deserialize event data. Verify event format and schema compatibility.',
  [EVENT_CONSUMER_GROUP_ERROR]: 'Consumer group error. Check group ID configuration and broker consumer group settings.',
  [EVENT_CONSUMER_AUTHORIZATION_ERROR]: 'Not authorized to consume from event topic. Check consumer credentials and permissions.',
  [EVENT_CONSUMER_PROCESSING_ERROR]: 'Error processing consumed event. Check event handler implementation and dependencies.',
  [EVENT_CONSUMER_COMMIT_ERROR]: 'Failed to commit event offset. Verify broker status and consumer permissions.',
  
  // Schema validation error messages
  [EVENT_SCHEMA_INVALID_FORMAT]: 'Event has invalid format. Ensure event structure follows the defined schema.',
  [EVENT_SCHEMA_MISSING_REQUIRED_FIELD]: 'Event missing required field. Check event data includes all mandatory fields.',
  [EVENT_SCHEMA_INVALID_FIELD_TYPE]: 'Event field has invalid type. Verify field values match expected data types.',
  [EVENT_SCHEMA_VERSION_MISMATCH]: 'Event schema version mismatch. Update producer or implement version compatibility.',
  [EVENT_SCHEMA_UNKNOWN_EVENT_TYPE]: 'Unknown event type. Verify event type is registered in the system.',
  [EVENT_SCHEMA_JOURNEY_MISMATCH]: 'Event journey mismatch. Ensure event is published to the correct journey topic.',
  
  // Delivery error messages
  [EVENT_DELIVERY_TIMEOUT]: 'Event delivery timeout. Check broker performance and consider increasing timeout settings.',
  [EVENT_DELIVERY_RETRY_EXHAUSTED]: 'Event delivery retry attempts exhausted. Event sent to dead letter queue for manual resolution.',
  [EVENT_DELIVERY_DEAD_LETTER]: 'Event sent to dead letter queue. Investigate root cause before reprocessing.',
  [EVENT_DELIVERY_DUPLICATE]: 'Duplicate event detected. Implement idempotent processing or deduplication strategy.',
  [EVENT_DELIVERY_OUT_OF_ORDER]: 'Events processed out of order. Consider implementing event sequencing or timestamp validation.',
  [EVENT_DELIVERY_PARTITION_ERROR]: 'Event partition error. Check partition key strategy and broker partition configuration.',
  
  // General event system error messages
  [EVENT_SYSTEM_CONFIGURATION_ERROR]: 'Event system configuration error. Verify environment variables and configuration files.',
  [EVENT_SYSTEM_RESOURCE_EXHAUSTED]: 'Event system resources exhausted. Check memory, connections, and other resource limits.',
  [EVENT_SYSTEM_DEPENDENCY_ERROR]: 'Event system dependency error. Verify all required services are available and responsive.',
  [EVENT_SYSTEM_UNEXPECTED_ERROR]: 'Unexpected error in event system. Check logs for detailed stack trace and context.',
  [EVENT_SYSTEM_SHUTDOWN]: 'Event system shutting down. Graceful shutdown in progress, new events may be rejected.',
  
  // Global error code mappings
  [GAME_INVALID_EVENT_DATA]: 'Invalid event data for gamification processing. Verify event structure and required fields.',
  [GAME_ACHIEVEMENT_RULE_ERROR]: 'Error applying achievement rules to event. Check rule configuration and event data.',
  [SYS_INTERNAL_SERVER_ERROR]: 'Internal server error processing event. Check system logs for detailed error information.',
  [API_INVALID_INPUT]: 'Invalid input for event API. Verify request format and required parameters.',
};

/**
 * Error severity mappings for appropriate logging and alerting
 */
export const EVENT_ERROR_SEVERITY = {
  // Producer error severities
  [EVENT_PRODUCER_CONNECTION_ERROR]: EventErrorSeverity.CRITICAL,
  [EVENT_PRODUCER_SERIALIZATION_ERROR]: EventErrorSeverity.ERROR,
  [EVENT_PRODUCER_TOPIC_NOT_FOUND]: EventErrorSeverity.ERROR,
  [EVENT_PRODUCER_AUTHORIZATION_ERROR]: EventErrorSeverity.ERROR,
  [EVENT_PRODUCER_RATE_LIMIT_EXCEEDED]: EventErrorSeverity.WARNING,
  [EVENT_PRODUCER_TIMEOUT]: EventErrorSeverity.WARNING,
  
  // Consumer error severities
  [EVENT_CONSUMER_CONNECTION_ERROR]: EventErrorSeverity.CRITICAL,
  [EVENT_CONSUMER_DESERIALIZATION_ERROR]: EventErrorSeverity.ERROR,
  [EVENT_CONSUMER_GROUP_ERROR]: EventErrorSeverity.ERROR,
  [EVENT_CONSUMER_AUTHORIZATION_ERROR]: EventErrorSeverity.ERROR,
  [EVENT_CONSUMER_PROCESSING_ERROR]: EventErrorSeverity.ERROR,
  [EVENT_CONSUMER_COMMIT_ERROR]: EventErrorSeverity.ERROR,
  
  // Schema validation error severities
  [EVENT_SCHEMA_INVALID_FORMAT]: EventErrorSeverity.ERROR,
  [EVENT_SCHEMA_MISSING_REQUIRED_FIELD]: EventErrorSeverity.ERROR,
  [EVENT_SCHEMA_INVALID_FIELD_TYPE]: EventErrorSeverity.ERROR,
  [EVENT_SCHEMA_VERSION_MISMATCH]: EventErrorSeverity.WARNING,
  [EVENT_SCHEMA_UNKNOWN_EVENT_TYPE]: EventErrorSeverity.ERROR,
  [EVENT_SCHEMA_JOURNEY_MISMATCH]: EventErrorSeverity.WARNING,
  
  // Delivery error severities
  [EVENT_DELIVERY_TIMEOUT]: EventErrorSeverity.WARNING,
  [EVENT_DELIVERY_RETRY_EXHAUSTED]: EventErrorSeverity.ERROR,
  [EVENT_DELIVERY_DEAD_LETTER]: EventErrorSeverity.ERROR,
  [EVENT_DELIVERY_DUPLICATE]: EventErrorSeverity.INFO,
  [EVENT_DELIVERY_OUT_OF_ORDER]: EventErrorSeverity.WARNING,
  [EVENT_DELIVERY_PARTITION_ERROR]: EventErrorSeverity.ERROR,
  
  // General event system error severities
  [EVENT_SYSTEM_CONFIGURATION_ERROR]: EventErrorSeverity.CRITICAL,
  [EVENT_SYSTEM_RESOURCE_EXHAUSTED]: EventErrorSeverity.CRITICAL,
  [EVENT_SYSTEM_DEPENDENCY_ERROR]: EventErrorSeverity.ERROR,
  [EVENT_SYSTEM_UNEXPECTED_ERROR]: EventErrorSeverity.ERROR,
  [EVENT_SYSTEM_SHUTDOWN]: EventErrorSeverity.INFO,
  
  // Global error code severities
  [GAME_INVALID_EVENT_DATA]: EventErrorSeverity.ERROR,
  [GAME_ACHIEVEMENT_RULE_ERROR]: EventErrorSeverity.ERROR,
  [SYS_INTERNAL_SERVER_ERROR]: EventErrorSeverity.CRITICAL,
  [API_INVALID_INPUT]: EventErrorSeverity.ERROR,
};

/**
 * HTTP status code mappings for REST API error responses
 */
export const EVENT_ERROR_HTTP_STATUS = {
  // Producer error HTTP status codes
  [EVENT_PRODUCER_CONNECTION_ERROR]: EventErrorHttpStatus.SERVICE_UNAVAILABLE,
  [EVENT_PRODUCER_SERIALIZATION_ERROR]: EventErrorHttpStatus.BAD_REQUEST,
  [EVENT_PRODUCER_TOPIC_NOT_FOUND]: EventErrorHttpStatus.NOT_FOUND,
  [EVENT_PRODUCER_AUTHORIZATION_ERROR]: EventErrorHttpStatus.FORBIDDEN,
  [EVENT_PRODUCER_RATE_LIMIT_EXCEEDED]: EventErrorHttpStatus.TOO_MANY_REQUESTS,
  [EVENT_PRODUCER_TIMEOUT]: EventErrorHttpStatus.GATEWAY_TIMEOUT,
  
  // Consumer error HTTP status codes
  [EVENT_CONSUMER_CONNECTION_ERROR]: EventErrorHttpStatus.SERVICE_UNAVAILABLE,
  [EVENT_CONSUMER_DESERIALIZATION_ERROR]: EventErrorHttpStatus.UNPROCESSABLE_ENTITY,
  [EVENT_CONSUMER_GROUP_ERROR]: EventErrorHttpStatus.INTERNAL_SERVER_ERROR,
  [EVENT_CONSUMER_AUTHORIZATION_ERROR]: EventErrorHttpStatus.FORBIDDEN,
  [EVENT_CONSUMER_PROCESSING_ERROR]: EventErrorHttpStatus.INTERNAL_SERVER_ERROR,
  [EVENT_CONSUMER_COMMIT_ERROR]: EventErrorHttpStatus.INTERNAL_SERVER_ERROR,
  
  // Schema validation error HTTP status codes
  [EVENT_SCHEMA_INVALID_FORMAT]: EventErrorHttpStatus.BAD_REQUEST,
  [EVENT_SCHEMA_MISSING_REQUIRED_FIELD]: EventErrorHttpStatus.BAD_REQUEST,
  [EVENT_SCHEMA_INVALID_FIELD_TYPE]: EventErrorHttpStatus.BAD_REQUEST,
  [EVENT_SCHEMA_VERSION_MISMATCH]: EventErrorHttpStatus.UNPROCESSABLE_ENTITY,
  [EVENT_SCHEMA_UNKNOWN_EVENT_TYPE]: EventErrorHttpStatus.BAD_REQUEST,
  [EVENT_SCHEMA_JOURNEY_MISMATCH]: EventErrorHttpStatus.BAD_REQUEST,
  
  // Delivery error HTTP status codes
  [EVENT_DELIVERY_TIMEOUT]: EventErrorHttpStatus.GATEWAY_TIMEOUT,
  [EVENT_DELIVERY_RETRY_EXHAUSTED]: EventErrorHttpStatus.SERVICE_UNAVAILABLE,
  [EVENT_DELIVERY_DEAD_LETTER]: EventErrorHttpStatus.UNPROCESSABLE_ENTITY,
  [EVENT_DELIVERY_DUPLICATE]: EventErrorHttpStatus.CONFLICT,
  [EVENT_DELIVERY_OUT_OF_ORDER]: EventErrorHttpStatus.UNPROCESSABLE_ENTITY,
  [EVENT_DELIVERY_PARTITION_ERROR]: EventErrorHttpStatus.INTERNAL_SERVER_ERROR,
  
  // General event system error HTTP status codes
  [EVENT_SYSTEM_CONFIGURATION_ERROR]: EventErrorHttpStatus.INTERNAL_SERVER_ERROR,
  [EVENT_SYSTEM_RESOURCE_EXHAUSTED]: EventErrorHttpStatus.SERVICE_UNAVAILABLE,
  [EVENT_SYSTEM_DEPENDENCY_ERROR]: EventErrorHttpStatus.SERVICE_UNAVAILABLE,
  [EVENT_SYSTEM_UNEXPECTED_ERROR]: EventErrorHttpStatus.INTERNAL_SERVER_ERROR,
  [EVENT_SYSTEM_SHUTDOWN]: EventErrorHttpStatus.SERVICE_UNAVAILABLE,
  
  // Global error code HTTP status codes
  [GAME_INVALID_EVENT_DATA]: EventErrorHttpStatus.BAD_REQUEST,
  [GAME_ACHIEVEMENT_RULE_ERROR]: EventErrorHttpStatus.INTERNAL_SERVER_ERROR,
  [SYS_INTERNAL_SERVER_ERROR]: EventErrorHttpStatus.INTERNAL_SERVER_ERROR,
  [API_INVALID_INPUT]: EventErrorHttpStatus.BAD_REQUEST,
};

/**
 * Retry configuration constants for failed events
 */
export const EVENT_RETRY_CONFIG = {
  // Maximum number of retry attempts before sending to dead letter queue
  MAX_RETRY_ATTEMPTS: 3,
  
  // Base delay in milliseconds for exponential backoff
  BASE_RETRY_DELAY_MS: 1000,
  
  // Maximum delay in milliseconds for exponential backoff
  MAX_RETRY_DELAY_MS: 60000, // 1 minute
  
  // Jitter factor to add randomness to retry delays (0-1)
  RETRY_JITTER_FACTOR: 0.2,
};

/**
 * Dead letter queue configuration constants
 */
export const EVENT_DLQ_CONFIG = {
  // Topic suffix for dead letter queues
  TOPIC_SUFFIX: '.dlq',
  
  // Maximum retention period for dead letter messages (in milliseconds)
  RETENTION_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Whether to include the original message headers in the dead letter message
  INCLUDE_HEADERS: true,
  
  // Whether to include the stack trace in the dead letter message
  INCLUDE_STACK_TRACE: true,
};