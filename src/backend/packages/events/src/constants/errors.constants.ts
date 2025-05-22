/**
 * Error codes and messages for the event processing system
 * These constants provide consistent error reporting across all services
 * and enable proper error classification, logging, and handling.
 */

import { 
  GAME_INVALID_EVENT_DATA, 
  GAME_ACHIEVEMENT_RULE_ERROR,
  SYS_INTERNAL_SERVER_ERROR
} from '@austa/interfaces/common';

// Error severity levels for appropriate logging and alerting
export enum EventErrorSeverity {
  INFO = 'INFO',         // Informational, no action needed
  WARNING = 'WARNING',   // Potential issue, monitor but no immediate action
  ERROR = 'ERROR',       // Requires attention, may impact functionality
  CRITICAL = 'CRITICAL', // Severe issue, immediate action required
  FATAL = 'FATAL'        // System cannot function, highest priority
}

// HTTP status code mappings for REST API error responses
export enum EventErrorHttpStatus {
  BAD_REQUEST = 400,     // Client error, invalid event data
  UNAUTHORIZED = 401,    // Authentication required
  FORBIDDEN = 403,       // Authorization failed
  NOT_FOUND = 404,       // Resource not found
  CONFLICT = 409,        // Conflict with current state
  UNPROCESSABLE = 422,   // Validation error
  TOO_MANY_REQUESTS = 429, // Rate limit exceeded
  INTERNAL_ERROR = 500,  // Server error
  BAD_GATEWAY = 502,     // Upstream service error
  SERVICE_UNAVAILABLE = 503, // Service temporarily unavailable
  GATEWAY_TIMEOUT = 504  // Upstream service timeout
}

// Producer error codes (EVENT_PROD_*)
export const EVENT_PROD_SERIALIZATION_FAILED = 'EVENT_PROD_001';
export const EVENT_PROD_SCHEMA_VALIDATION_FAILED = 'EVENT_PROD_002';
export const EVENT_PROD_DELIVERY_TIMEOUT = 'EVENT_PROD_003';
export const EVENT_PROD_BROKER_UNAVAILABLE = 'EVENT_PROD_004';
export const EVENT_PROD_TOPIC_NOT_FOUND = 'EVENT_PROD_005';
export const EVENT_PROD_AUTHORIZATION_FAILED = 'EVENT_PROD_006';
export const EVENT_PROD_RATE_LIMIT_EXCEEDED = 'EVENT_PROD_007';

// Consumer error codes (EVENT_CONS_*)
export const EVENT_CONS_DESERIALIZATION_FAILED = 'EVENT_CONS_001';
export const EVENT_CONS_SCHEMA_VALIDATION_FAILED = 'EVENT_CONS_002';
export const EVENT_CONS_PROCESSING_TIMEOUT = 'EVENT_CONS_003';
export const EVENT_CONS_HANDLER_NOT_FOUND = 'EVENT_CONS_004';
export const EVENT_CONS_RETRY_EXHAUSTED = 'EVENT_CONS_005';
export const EVENT_CONS_COMMIT_FAILED = 'EVENT_CONS_006';
export const EVENT_CONS_CONCURRENCY_LIMIT_EXCEEDED = 'EVENT_CONS_007';

// Schema validation error codes (EVENT_SCHEMA_*)
export const EVENT_SCHEMA_VERSION_MISMATCH = 'EVENT_SCHEMA_001';
export const EVENT_SCHEMA_REQUIRED_FIELD_MISSING = 'EVENT_SCHEMA_002';
export const EVENT_SCHEMA_INVALID_FIELD_TYPE = 'EVENT_SCHEMA_003';
export const EVENT_SCHEMA_REGISTRY_UNAVAILABLE = 'EVENT_SCHEMA_004';
export const EVENT_SCHEMA_EVOLUTION_INCOMPATIBLE = 'EVENT_SCHEMA_005';

// Delivery error codes (EVENT_DELIV_*)
export const EVENT_DELIV_TIMEOUT = 'EVENT_DELIV_001';
export const EVENT_DELIV_BROKER_UNAVAILABLE = 'EVENT_DELIV_002';
export const EVENT_DELIV_NETWORK_FAILURE = 'EVENT_DELIV_003';
export const EVENT_DELIV_PARTITION_ERROR = 'EVENT_DELIV_004';
export const EVENT_DELIV_REBALANCE_IN_PROGRESS = 'EVENT_DELIV_005';

// Dead Letter Queue error codes (EVENT_DLQ_*)
export const EVENT_DLQ_WRITE_FAILED = 'EVENT_DLQ_001';
export const EVENT_DLQ_READ_FAILED = 'EVENT_DLQ_002';
export const EVENT_DLQ_FULL = 'EVENT_DLQ_003';
export const EVENT_DLQ_REPROCESSING_FAILED = 'EVENT_DLQ_004';

// Error messages with troubleshooting guidance
export const ERROR_MESSAGES: Record<string, { message: string; severity: EventErrorSeverity; status?: number }> = {
  // Producer error messages
  [EVENT_PROD_SERIALIZATION_FAILED]: {
    message: 'Failed to serialize event data. Check event structure and serialization format compatibility.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.UNPROCESSABLE
  },
  [EVENT_PROD_SCHEMA_VALIDATION_FAILED]: {
    message: 'Event data failed schema validation. Verify event structure against the schema definition.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.UNPROCESSABLE
  },
  [EVENT_PROD_DELIVERY_TIMEOUT]: {
    message: 'Event delivery timed out. Check broker connectivity and consider increasing timeout settings.',
    severity: EventErrorSeverity.WARNING,
    status: EventErrorHttpStatus.GATEWAY_TIMEOUT
  },
  [EVENT_PROD_BROKER_UNAVAILABLE]: {
    message: 'Event broker is unavailable. Verify broker health and network connectivity.',
    severity: EventErrorSeverity.CRITICAL,
    status: EventErrorHttpStatus.SERVICE_UNAVAILABLE
  },
  [EVENT_PROD_TOPIC_NOT_FOUND]: {
    message: 'Event topic not found. Verify topic name and ensure it exists on the broker.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.NOT_FOUND
  },
  [EVENT_PROD_AUTHORIZATION_FAILED]: {
    message: 'Authorization failed when publishing event. Check producer credentials and access permissions.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.FORBIDDEN
  },
  [EVENT_PROD_RATE_LIMIT_EXCEEDED]: {
    message: 'Event production rate limit exceeded. Implement backpressure handling or reduce event frequency.',
    severity: EventErrorSeverity.WARNING,
    status: EventErrorHttpStatus.TOO_MANY_REQUESTS
  },
  
  // Consumer error messages
  [EVENT_CONS_DESERIALIZATION_FAILED]: {
    message: 'Failed to deserialize event data. Check event format and consumer deserialization configuration.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.UNPROCESSABLE
  },
  [EVENT_CONS_SCHEMA_VALIDATION_FAILED]: {
    message: 'Consumed event failed schema validation. Event may be from an incompatible producer version.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.UNPROCESSABLE
  },
  [EVENT_CONS_PROCESSING_TIMEOUT]: {
    message: 'Event processing timed out. Check handler performance and consider increasing timeout settings.',
    severity: EventErrorSeverity.WARNING,
    status: EventErrorHttpStatus.GATEWAY_TIMEOUT
  },
  [EVENT_CONS_HANDLER_NOT_FOUND]: {
    message: 'Event handler not found for event type. Register appropriate handler for this event type.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.NOT_FOUND
  },
  [EVENT_CONS_RETRY_EXHAUSTED]: {
    message: 'Maximum retry attempts exhausted for event processing. Event moved to dead letter queue.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.INTERNAL_ERROR
  },
  [EVENT_CONS_COMMIT_FAILED]: {
    message: 'Failed to commit consumer offset. Check broker connectivity and consumer group configuration.',
    severity: EventErrorSeverity.CRITICAL,
    status: EventErrorHttpStatus.INTERNAL_ERROR
  },
  [EVENT_CONS_CONCURRENCY_LIMIT_EXCEEDED]: {
    message: 'Consumer concurrency limit exceeded. Consider scaling consumers or adjusting concurrency settings.',
    severity: EventErrorSeverity.WARNING,
    status: EventErrorHttpStatus.TOO_MANY_REQUESTS
  },
  
  // Schema validation error messages
  [EVENT_SCHEMA_VERSION_MISMATCH]: {
    message: 'Event schema version mismatch. Consumer expects a different schema version than provided.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.UNPROCESSABLE
  },
  [EVENT_SCHEMA_REQUIRED_FIELD_MISSING]: {
    message: 'Required field missing in event data. Ensure all required fields are included in the event.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.BAD_REQUEST
  },
  [EVENT_SCHEMA_INVALID_FIELD_TYPE]: {
    message: 'Invalid field type in event data. Check field types against schema definition.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.BAD_REQUEST
  },
  [EVENT_SCHEMA_REGISTRY_UNAVAILABLE]: {
    message: 'Schema registry service unavailable. Check registry connectivity and health.',
    severity: EventErrorSeverity.CRITICAL,
    status: EventErrorHttpStatus.SERVICE_UNAVAILABLE
  },
  [EVENT_SCHEMA_EVOLUTION_INCOMPATIBLE]: {
    message: 'Incompatible schema evolution detected. Schema changes must maintain backward compatibility.',
    severity: EventErrorSeverity.CRITICAL,
    status: EventErrorHttpStatus.CONFLICT
  },
  
  // Delivery error messages
  [EVENT_DELIV_TIMEOUT]: {
    message: 'Event delivery timed out. Check network latency and broker performance.',
    severity: EventErrorSeverity.WARNING,
    status: EventErrorHttpStatus.GATEWAY_TIMEOUT
  },
  [EVENT_DELIV_BROKER_UNAVAILABLE]: {
    message: 'Event broker unavailable during delivery. Verify broker health and network connectivity.',
    severity: EventErrorSeverity.CRITICAL,
    status: EventErrorHttpStatus.SERVICE_UNAVAILABLE
  },
  [EVENT_DELIV_NETWORK_FAILURE]: {
    message: 'Network failure during event delivery. Check network connectivity and DNS resolution.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.BAD_GATEWAY
  },
  [EVENT_DELIV_PARTITION_ERROR]: {
    message: 'Partition error during event delivery. Check topic partitioning and broker configuration.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.INTERNAL_ERROR
  },
  [EVENT_DELIV_REBALANCE_IN_PROGRESS]: {
    message: 'Consumer group rebalance in progress. Delivery paused until rebalance completes.',
    severity: EventErrorSeverity.INFO,
    status: EventErrorHttpStatus.SERVICE_UNAVAILABLE
  },
  
  // Dead Letter Queue error messages
  [EVENT_DLQ_WRITE_FAILED]: {
    message: 'Failed to write event to dead letter queue. Check DLQ configuration and storage.',
    severity: EventErrorSeverity.CRITICAL,
    status: EventErrorHttpStatus.INTERNAL_ERROR
  },
  [EVENT_DLQ_READ_FAILED]: {
    message: 'Failed to read event from dead letter queue. Check DLQ access permissions and connectivity.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.INTERNAL_ERROR
  },
  [EVENT_DLQ_FULL]: {
    message: 'Dead letter queue capacity exceeded. Process or archive DLQ events to free up space.',
    severity: EventErrorSeverity.CRITICAL,
    status: EventErrorHttpStatus.INTERNAL_ERROR
  },
  [EVENT_DLQ_REPROCESSING_FAILED]: {
    message: 'Failed to reprocess event from dead letter queue. Check event data and processing logic.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.INTERNAL_ERROR
  },
  
  // Gamification error messages (imported from shared constants)
  [GAME_INVALID_EVENT_DATA]: {
    message: 'Invalid event data for gamification processing. Verify event structure and required fields.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.BAD_REQUEST
  },
  [GAME_ACHIEVEMENT_RULE_ERROR]: {
    message: 'Error in achievement rule processing. Check rule configuration and event data compatibility.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.INTERNAL_ERROR
  },
  
  // System error fallback
  [SYS_INTERNAL_SERVER_ERROR]: {
    message: 'Internal server error during event processing. Check server logs for detailed information.',
    severity: EventErrorSeverity.CRITICAL,
    status: EventErrorHttpStatus.INTERNAL_ERROR
  }
};

/**
 * Get error details for a specific error code
 * @param errorCode The error code to retrieve details for
 * @returns Error details including message, severity, and HTTP status code
 */
export const getErrorDetails = (errorCode: string) => {
  return ERROR_MESSAGES[errorCode] || {
    message: 'Unknown error occurred during event processing.',
    severity: EventErrorSeverity.ERROR,
    status: EventErrorHttpStatus.INTERNAL_ERROR
  };
};

/**
 * Check if an error is retryable based on its code
 * Used to determine if retry logic should be applied
 * @param errorCode The error code to check
 * @returns Boolean indicating if the error is retryable
 */
export const isRetryableError = (errorCode: string): boolean => {
  // These error types are considered transient and can be retried
  const retryableErrors = [
    EVENT_PROD_DELIVERY_TIMEOUT,
    EVENT_PROD_BROKER_UNAVAILABLE,
    EVENT_CONS_PROCESSING_TIMEOUT,
    EVENT_DELIV_TIMEOUT,
    EVENT_DELIV_BROKER_UNAVAILABLE,
    EVENT_DELIV_NETWORK_FAILURE,
    EVENT_DELIV_REBALANCE_IN_PROGRESS
  ];
  
  return retryableErrors.includes(errorCode);
};

/**
 * Check if an error should be sent to the dead letter queue
 * @param errorCode The error code to check
 * @param retryCount Current retry count for the event
 * @param maxRetries Maximum allowed retries
 * @returns Boolean indicating if the event should go to DLQ
 */
export const shouldSendToDLQ = (errorCode: string, retryCount: number, maxRetries: number): boolean => {
  // Non-retryable errors should go to DLQ immediately
  if (!isRetryableError(errorCode)) {
    return true;
  }
  
  // Retryable errors should go to DLQ if max retries exceeded
  return retryCount >= maxRetries;
};

/**
 * Get appropriate log level based on error severity
 * @param errorCode The error code to determine log level for
 * @returns Log level string (debug, info, warn, error, fatal)
 */
export const getErrorLogLevel = (errorCode: string): string => {
  const errorDetails = getErrorDetails(errorCode);
  
  switch (errorDetails.severity) {
    case EventErrorSeverity.INFO:
      return 'info';
    case EventErrorSeverity.WARNING:
      return 'warn';
    case EventErrorSeverity.ERROR:
      return 'error';
    case EventErrorSeverity.CRITICAL:
    case EventErrorSeverity.FATAL:
      return 'fatal';
    default:
      return 'error';
  }
};