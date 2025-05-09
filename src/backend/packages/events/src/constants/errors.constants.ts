/**
 * Error constants for the event processing system
 * These provide consistent error codes, messages, and severity levels for event-related errors
 * across all services in the AUSTA SuperApp.
 */

import { SYS_INTERNAL_SERVER_ERROR, GAME_INVALID_EVENT_DATA } from '@app/shared/constants/error-codes.constants';

/**
 * Error severity levels for appropriate logging and alerting
 */
export enum EventErrorSeverity {
  INFO = 'INFO',         // Informational, no action required
  WARNING = 'WARNING',   // Potential issue, monitor but no immediate action
  ERROR = 'ERROR',       // Requires attention, may impact functionality
  CRITICAL = 'CRITICAL', // Severe issue, immediate action required
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
 * Producer error codes and messages
 * These errors occur when producing/publishing events
 */

// Producer connection errors
export const EVENT_PRODUCER_CONNECTION_ERROR = 'EVENT_001';
export const EVENT_PRODUCER_CONNECTION_ERROR_MESSAGE = 
  'Failed to connect to event broker. Check network connectivity, broker status, and credentials.';
export const EVENT_PRODUCER_CONNECTION_ERROR_SEVERITY = EventErrorSeverity.CRITICAL;
export const EVENT_PRODUCER_CONNECTION_ERROR_STATUS = EventErrorHttpStatus.SERVICE_UNAVAILABLE;

// Producer authentication errors
export const EVENT_PRODUCER_AUTH_ERROR = 'EVENT_002';
export const EVENT_PRODUCER_AUTH_ERROR_MESSAGE = 
  'Authentication failed when connecting to event broker. Verify credentials and permissions.';
export const EVENT_PRODUCER_AUTH_ERROR_SEVERITY = EventErrorSeverity.CRITICAL;
export const EVENT_PRODUCER_AUTH_ERROR_STATUS = EventErrorHttpStatus.UNAUTHORIZED;

// Producer serialization errors
export const EVENT_PRODUCER_SERIALIZATION_ERROR = 'EVENT_003';
export const EVENT_PRODUCER_SERIALIZATION_ERROR_MESSAGE = 
  'Failed to serialize event data. Ensure event payload matches the expected schema.';
export const EVENT_PRODUCER_SERIALIZATION_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_PRODUCER_SERIALIZATION_ERROR_STATUS = EventErrorHttpStatus.UNPROCESSABLE_ENTITY;

// Producer topic errors
export const EVENT_PRODUCER_TOPIC_ERROR = 'EVENT_004';
export const EVENT_PRODUCER_TOPIC_ERROR_MESSAGE = 
  'Failed to publish to specified topic. Verify topic exists and producer has write permissions.';
export const EVENT_PRODUCER_TOPIC_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_PRODUCER_TOPIC_ERROR_STATUS = EventErrorHttpStatus.NOT_FOUND;

// Producer rate limit errors
export const EVENT_PRODUCER_RATE_LIMIT_ERROR = 'EVENT_005';
export const EVENT_PRODUCER_RATE_LIMIT_ERROR_MESSAGE = 
  'Event production rate limit exceeded. Implement backoff strategy or increase rate limits.';
export const EVENT_PRODUCER_RATE_LIMIT_ERROR_SEVERITY = EventErrorSeverity.WARNING;
export const EVENT_PRODUCER_RATE_LIMIT_ERROR_STATUS = EventErrorHttpStatus.TOO_MANY_REQUESTS;

/**
 * Consumer error codes and messages
 * These errors occur when consuming/processing events
 */

// Consumer connection errors
export const EVENT_CONSUMER_CONNECTION_ERROR = 'EVENT_101';
export const EVENT_CONSUMER_CONNECTION_ERROR_MESSAGE = 
  'Failed to connect to event broker for consumption. Check network connectivity, broker status, and credentials.';
export const EVENT_CONSUMER_CONNECTION_ERROR_SEVERITY = EventErrorSeverity.CRITICAL;
export const EVENT_CONSUMER_CONNECTION_ERROR_STATUS = EventErrorHttpStatus.SERVICE_UNAVAILABLE;

// Consumer authentication errors
export const EVENT_CONSUMER_AUTH_ERROR = 'EVENT_102';
export const EVENT_CONSUMER_AUTH_ERROR_MESSAGE = 
  'Authentication failed when connecting consumer to event broker. Verify credentials and permissions.';
export const EVENT_CONSUMER_AUTH_ERROR_SEVERITY = EventErrorSeverity.CRITICAL;
export const EVENT_CONSUMER_AUTH_ERROR_STATUS = EventErrorHttpStatus.UNAUTHORIZED;

// Consumer deserialization errors
export const EVENT_CONSUMER_DESERIALIZATION_ERROR = 'EVENT_103';
export const EVENT_CONSUMER_DESERIALIZATION_ERROR_MESSAGE = 
  'Failed to deserialize event data. Event may be corrupted or using an incompatible schema version.';
export const EVENT_CONSUMER_DESERIALIZATION_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_CONSUMER_DESERIALIZATION_ERROR_STATUS = EventErrorHttpStatus.UNPROCESSABLE_ENTITY;

// Consumer processing errors
export const EVENT_CONSUMER_PROCESSING_ERROR = 'EVENT_104';
export const EVENT_CONSUMER_PROCESSING_ERROR_MESSAGE = 
  'Error during event processing. Check event handler implementation and dependent services.';
export const EVENT_CONSUMER_PROCESSING_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_CONSUMER_PROCESSING_ERROR_STATUS = EventErrorHttpStatus.INTERNAL_SERVER_ERROR;

// Consumer group errors
export const EVENT_CONSUMER_GROUP_ERROR = 'EVENT_105';
export const EVENT_CONSUMER_GROUP_ERROR_MESSAGE = 
  'Consumer group error. Check group configuration, rebalancing issues, or broker connectivity.';
export const EVENT_CONSUMER_GROUP_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_CONSUMER_GROUP_ERROR_STATUS = EventErrorHttpStatus.INTERNAL_SERVER_ERROR;

// Consumer commit errors
export const EVENT_CONSUMER_COMMIT_ERROR = 'EVENT_106';
export const EVENT_CONSUMER_COMMIT_ERROR_MESSAGE = 
  'Failed to commit offset after processing. Event may be processed multiple times. Check broker connectivity.';
export const EVENT_CONSUMER_COMMIT_ERROR_SEVERITY = EventErrorSeverity.WARNING;
export const EVENT_CONSUMER_COMMIT_ERROR_STATUS = EventErrorHttpStatus.INTERNAL_SERVER_ERROR;

/**
 * Schema validation error codes and messages
 * These errors occur when validating event schemas
 */

// Schema version errors
export const EVENT_SCHEMA_VERSION_ERROR = 'EVENT_201';
export const EVENT_SCHEMA_VERSION_ERROR_MESSAGE = 
  'Event schema version mismatch. Producer and consumer may be using incompatible versions.';
export const EVENT_SCHEMA_VERSION_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_SCHEMA_VERSION_ERROR_STATUS = EventErrorHttpStatus.UNPROCESSABLE_ENTITY;

// Schema missing field errors
export const EVENT_SCHEMA_MISSING_FIELD_ERROR = 'EVENT_202';
export const EVENT_SCHEMA_MISSING_FIELD_ERROR_MESSAGE = 
  'Required field missing in event schema. Ensure all required fields are included in the event payload.';
export const EVENT_SCHEMA_MISSING_FIELD_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_SCHEMA_MISSING_FIELD_ERROR_STATUS = EventErrorHttpStatus.BAD_REQUEST;

// Schema type errors
export const EVENT_SCHEMA_TYPE_ERROR = 'EVENT_203';
export const EVENT_SCHEMA_TYPE_ERROR_MESSAGE = 
  'Field type mismatch in event schema. Ensure field types match the expected schema definition.';
export const EVENT_SCHEMA_TYPE_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_SCHEMA_TYPE_ERROR_STATUS = EventErrorHttpStatus.BAD_REQUEST;

// Schema registry errors
export const EVENT_SCHEMA_REGISTRY_ERROR = 'EVENT_204';
export const EVENT_SCHEMA_REGISTRY_ERROR_MESSAGE = 
  'Failed to interact with schema registry. Check registry connectivity and permissions.';
export const EVENT_SCHEMA_REGISTRY_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_SCHEMA_REGISTRY_ERROR_STATUS = EventErrorHttpStatus.SERVICE_UNAVAILABLE;

// Journey-specific schema errors
export const EVENT_SCHEMA_JOURNEY_ERROR = 'EVENT_205';
export const EVENT_SCHEMA_JOURNEY_ERROR_MESSAGE = 
  'Journey-specific schema validation failed. Check journey-specific fields and requirements.';
export const EVENT_SCHEMA_JOURNEY_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_SCHEMA_JOURNEY_ERROR_STATUS = EventErrorHttpStatus.BAD_REQUEST;

/**
 * Delivery error codes and messages
 * These errors occur during event delivery
 */

// Delivery timeout errors
export const EVENT_DELIVERY_TIMEOUT_ERROR = 'EVENT_301';
export const EVENT_DELIVERY_TIMEOUT_ERROR_MESSAGE = 
  'Event delivery timed out. Check broker performance, network latency, or increase timeout settings.';
export const EVENT_DELIVERY_TIMEOUT_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_DELIVERY_TIMEOUT_ERROR_STATUS = EventErrorHttpStatus.GATEWAY_TIMEOUT;

// Delivery acknowledgment errors
export const EVENT_DELIVERY_ACK_ERROR = 'EVENT_302';
export const EVENT_DELIVERY_ACK_ERROR_MESSAGE = 
  'Failed to receive delivery acknowledgment. Event may or may not have been delivered.';
export const EVENT_DELIVERY_ACK_ERROR_SEVERITY = EventErrorSeverity.WARNING;
export const EVENT_DELIVERY_ACK_ERROR_STATUS = EventErrorHttpStatus.INTERNAL_SERVER_ERROR;

// Delivery partition errors
export const EVENT_DELIVERY_PARTITION_ERROR = 'EVENT_303';
export const EVENT_DELIVERY_PARTITION_ERROR_MESSAGE = 
  'Failed to deliver to specific partition. Check partition availability and configuration.';
export const EVENT_DELIVERY_PARTITION_ERROR_SEVERITY = EventErrorSeverity.WARNING;
export const EVENT_DELIVERY_PARTITION_ERROR_STATUS = EventErrorHttpStatus.SERVICE_UNAVAILABLE;

// Delivery ordering errors
export const EVENT_DELIVERY_ORDERING_ERROR = 'EVENT_304';
export const EVENT_DELIVERY_ORDERING_ERROR_MESSAGE = 
  'Event ordering guarantee violated. Events may be processed out of order.';
export const EVENT_DELIVERY_ORDERING_ERROR_SEVERITY = EventErrorSeverity.WARNING;
export const EVENT_DELIVERY_ORDERING_ERROR_STATUS = EventErrorHttpStatus.INTERNAL_SERVER_ERROR;

/**
 * Retry error codes and messages
 * These errors occur during retry attempts
 */

// Retry exhaustion errors
export const EVENT_RETRY_EXHAUSTED_ERROR = 'EVENT_401';
export const EVENT_RETRY_EXHAUSTED_ERROR_MESSAGE = 
  'Maximum retry attempts exhausted. Event processing has failed permanently and requires manual intervention.';
export const EVENT_RETRY_EXHAUSTED_ERROR_SEVERITY = EventErrorSeverity.CRITICAL;
export const EVENT_RETRY_EXHAUSTED_ERROR_STATUS = EventErrorHttpStatus.INTERNAL_SERVER_ERROR;

// Retry backoff errors
export const EVENT_RETRY_BACKOFF_ERROR = 'EVENT_402';
export const EVENT_RETRY_BACKOFF_ERROR_MESSAGE = 
  'Error during retry backoff calculation. Using default backoff strategy.';
export const EVENT_RETRY_BACKOFF_ERROR_SEVERITY = EventErrorSeverity.WARNING;
export const EVENT_RETRY_BACKOFF_ERROR_STATUS = EventErrorHttpStatus.INTERNAL_SERVER_ERROR;

// Dead letter queue errors
export const EVENT_RETRY_DLQ_ERROR = 'EVENT_403';
export const EVENT_RETRY_DLQ_ERROR_MESSAGE = 
  'Failed to send event to dead letter queue. Event may be lost. Check DLQ configuration and connectivity.';
export const EVENT_RETRY_DLQ_ERROR_SEVERITY = EventErrorSeverity.CRITICAL;
export const EVENT_RETRY_DLQ_ERROR_STATUS = EventErrorHttpStatus.INTERNAL_SERVER_ERROR;

// Retry state persistence errors
export const EVENT_RETRY_STATE_ERROR = 'EVENT_404';
export const EVENT_RETRY_STATE_ERROR_MESSAGE = 
  'Failed to persist retry state. Retry count or history may be inaccurate.';
export const EVENT_RETRY_STATE_ERROR_SEVERITY = EventErrorSeverity.WARNING;
export const EVENT_RETRY_STATE_ERROR_STATUS = EventErrorHttpStatus.INTERNAL_SERVER_ERROR;

/**
 * Journey-specific event error codes
 * These map to the global error system for journey-specific events
 */

// Health journey event errors
export const EVENT_HEALTH_JOURNEY_ERROR = 'EVENT_501';
export const EVENT_HEALTH_JOURNEY_ERROR_MESSAGE = 
  'Error processing health journey event. Check health metric data and event handler implementation.';
export const EVENT_HEALTH_JOURNEY_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_HEALTH_JOURNEY_ERROR_STATUS = EventErrorHttpStatus.INTERNAL_SERVER_ERROR;

// Care journey event errors
export const EVENT_CARE_JOURNEY_ERROR = 'EVENT_502';
export const EVENT_CARE_JOURNEY_ERROR_MESSAGE = 
  'Error processing care journey event. Check appointment or telemedicine data and event handler implementation.';
export const EVENT_CARE_JOURNEY_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_CARE_JOURNEY_ERROR_STATUS = EventErrorHttpStatus.INTERNAL_SERVER_ERROR;

// Plan journey event errors
export const EVENT_PLAN_JOURNEY_ERROR = 'EVENT_503';
export const EVENT_PLAN_JOURNEY_ERROR_MESSAGE = 
  'Error processing plan journey event. Check claim or benefit data and event handler implementation.';
export const EVENT_PLAN_JOURNEY_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_PLAN_JOURNEY_ERROR_STATUS = EventErrorHttpStatus.INTERNAL_SERVER_ERROR;

// Gamification event errors (maps to GAME_INVALID_EVENT_DATA from global system)
export const EVENT_GAMIFICATION_ERROR = GAME_INVALID_EVENT_DATA;
export const EVENT_GAMIFICATION_ERROR_MESSAGE = 
  'Error processing gamification event. Check achievement, quest, or reward data and event handler implementation.';
export const EVENT_GAMIFICATION_ERROR_SEVERITY = EventErrorSeverity.ERROR;
export const EVENT_GAMIFICATION_ERROR_STATUS = EventErrorHttpStatus.INTERNAL_SERVER_ERROR;

/**
 * System-level event errors
 * These map to global system error codes
 */
export const EVENT_SYSTEM_ERROR = SYS_INTERNAL_SERVER_ERROR;
export const EVENT_SYSTEM_ERROR_MESSAGE = 
  'Unexpected system error during event processing. Check system logs for detailed error information.';
export const EVENT_SYSTEM_ERROR_SEVERITY = EventErrorSeverity.CRITICAL;
export const EVENT_SYSTEM_ERROR_STATUS = EventErrorHttpStatus.INTERNAL_SERVER_ERROR;