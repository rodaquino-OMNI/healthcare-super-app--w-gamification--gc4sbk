/**
 * Error codes and messages for the event processing system
 * These constants provide consistent error reporting across all services
 * and enable proper error classification, logging, and handling.
 */

import { SYS_INTERNAL_SERVER_ERROR } from '@backend/shared/src/constants/error-codes.constants';

// -----------------------------------------------------------------------------
// Error Severity Levels
// -----------------------------------------------------------------------------

/**
 * Error severity levels for event processing errors
 * Used for logging and alerting prioritization
 */
export enum EventErrorSeverity {
  /** Critical errors that require immediate attention and likely cause system failure */
  CRITICAL = 'CRITICAL',
  /** Serious errors that significantly impact functionality but don't cause complete system failure */
  HIGH = 'HIGH',
  /** Moderate errors that impact some functionality but allow the system to continue operating */
  MEDIUM = 'MEDIUM',
  /** Minor errors that have minimal impact on functionality */
  LOW = 'LOW',
}

// -----------------------------------------------------------------------------
// Producer Error Codes
// -----------------------------------------------------------------------------

/**
 * Error code for event validation failures during production
 * Used when an event fails schema validation before being sent to Kafka
 */
export const EVENT_PRODUCER_VALIDATION_ERROR = 'EVENT_001';

/**
 * Error code for event serialization failures
 * Used when an event cannot be properly serialized to JSON
 */
export const EVENT_PRODUCER_SERIALIZATION_ERROR = 'EVENT_002';

/**
 * Error code for Kafka connection failures during event production
 * Used when the producer cannot connect to Kafka brokers
 */
export const EVENT_PRODUCER_CONNECTION_ERROR = 'EVENT_003';

/**
 * Error code for Kafka delivery failures
 * Used when an event is accepted by the producer but fails to be delivered to Kafka
 */
export const EVENT_PRODUCER_DELIVERY_ERROR = 'EVENT_004';

/**
 * Error code for event versioning conflicts
 * Used when an event has an incompatible version with the current schema
 */
export const EVENT_PRODUCER_VERSION_ERROR = 'EVENT_005';

// -----------------------------------------------------------------------------
// Consumer Error Codes
// -----------------------------------------------------------------------------

/**
 * Error code for event deserialization failures
 * Used when a consumed event cannot be properly deserialized from JSON
 */
export const EVENT_CONSUMER_DESERIALIZATION_ERROR = 'EVENT_101';

/**
 * Error code for event validation failures during consumption
 * Used when a consumed event fails schema validation
 */
export const EVENT_CONSUMER_VALIDATION_ERROR = 'EVENT_102';

/**
 * Error code for Kafka connection failures during event consumption
 * Used when the consumer cannot connect to Kafka brokers
 */
export const EVENT_CONSUMER_CONNECTION_ERROR = 'EVENT_103';

/**
 * Error code for event processing failures
 * Used when an event handler encounters an error during processing
 */
export const EVENT_CONSUMER_PROCESSING_ERROR = 'EVENT_104';

/**
 * Error code for event handler not found
 * Used when no handler is registered for a specific event type
 */
export const EVENT_CONSUMER_HANDLER_NOT_FOUND = 'EVENT_105';

/**
 * Error code for event consumer group rebalancing failures
 * Used when Kafka consumer group rebalancing fails
 */
export const EVENT_CONSUMER_GROUP_ERROR = 'EVENT_106';

// -----------------------------------------------------------------------------
// Schema Validation Error Codes
// -----------------------------------------------------------------------------

/**
 * Error code for missing required fields in an event
 * Used when an event is missing fields that are required by the schema
 */
export const EVENT_SCHEMA_MISSING_FIELD = 'EVENT_201';

/**
 * Error code for invalid field types in an event
 * Used when an event contains fields with incorrect types
 */
export const EVENT_SCHEMA_INVALID_TYPE = 'EVENT_202';

/**
 * Error code for invalid field values in an event
 * Used when an event contains fields with values that fail validation rules
 */
export const EVENT_SCHEMA_INVALID_VALUE = 'EVENT_203';

/**
 * Error code for unknown event types
 * Used when an event has a type that is not registered in the system
 */
export const EVENT_SCHEMA_UNKNOWN_TYPE = 'EVENT_204';

/**
 * Error code for invalid event format
 * Used when an event has a structure that doesn't match any known schema
 */
export const EVENT_SCHEMA_INVALID_FORMAT = 'EVENT_205';

// -----------------------------------------------------------------------------
// Delivery Error Codes
// -----------------------------------------------------------------------------

/**
 * Error code for event delivery timeout
 * Used when an event takes too long to be delivered
 */
export const EVENT_DELIVERY_TIMEOUT = 'EVENT_301';

/**
 * Error code for event delivery failure due to broker unavailability
 * Used when Kafka brokers are unavailable for delivery
 */
export const EVENT_DELIVERY_BROKER_UNAVAILABLE = 'EVENT_302';

/**
 * Error code for event delivery failure due to topic not found
 * Used when the target Kafka topic doesn't exist
 */
export const EVENT_DELIVERY_TOPIC_NOT_FOUND = 'EVENT_303';

/**
 * Error code for event delivery failure due to insufficient permissions
 * Used when the producer doesn't have permission to write to the topic
 */
export const EVENT_DELIVERY_PERMISSION_DENIED = 'EVENT_304';

/**
 * Error code for event delivery failure due to message size exceeding limits
 * Used when an event is too large to be delivered to Kafka
 */
export const EVENT_DELIVERY_SIZE_EXCEEDED = 'EVENT_305';

// -----------------------------------------------------------------------------
// Retry Error Codes
// -----------------------------------------------------------------------------

/**
 * Error code for retry attempts exhausted
 * Used when all retry attempts for an event have been exhausted
 */
export const EVENT_RETRY_EXHAUSTED = 'EVENT_401';

/**
 * Error code for retry backoff calculation failure
 * Used when there's an error calculating the retry backoff period
 */
export const EVENT_RETRY_BACKOFF_ERROR = 'EVENT_402';

/**
 * Error code for retry policy not found
 * Used when no retry policy is configured for an event type
 */
export const EVENT_RETRY_POLICY_NOT_FOUND = 'EVENT_403';

/**
 * Error code for retry state persistence failure
 * Used when retry state cannot be persisted
 */
export const EVENT_RETRY_STATE_PERSISTENCE_ERROR = 'EVENT_404';

/**
 * Error code for dead letter queue delivery failure
 * Used when an event cannot be delivered to the dead letter queue
 */
export const EVENT_RETRY_DLQ_DELIVERY_ERROR = 'EVENT_405';

// -----------------------------------------------------------------------------
// Error Messages
// -----------------------------------------------------------------------------

/**
 * Error messages for event processing errors
 * These provide detailed, user-friendly error messages with troubleshooting guidance
 */
export const EVENT_ERROR_MESSAGES: Record<string, string> = {
  // Producer error messages
  [EVENT_PRODUCER_VALIDATION_ERROR]: 'Event validation failed during production. Check the event structure against the schema.',
  [EVENT_PRODUCER_SERIALIZATION_ERROR]: 'Failed to serialize event to JSON. Ensure the event contains only serializable data.',
  [EVENT_PRODUCER_CONNECTION_ERROR]: 'Failed to connect to Kafka brokers. Check network connectivity and broker configuration.',
  [EVENT_PRODUCER_DELIVERY_ERROR]: 'Failed to deliver event to Kafka. The event was accepted but delivery confirmation was not received.',
  [EVENT_PRODUCER_VERSION_ERROR]: 'Event version is incompatible with the current schema. Update the event to match the current schema version.',
  
  // Consumer error messages
  [EVENT_CONSUMER_DESERIALIZATION_ERROR]: 'Failed to deserialize event from JSON. The event may be corrupted or have an invalid format.',
  [EVENT_CONSUMER_VALIDATION_ERROR]: 'Event validation failed during consumption. The event does not match the expected schema.',
  [EVENT_CONSUMER_CONNECTION_ERROR]: 'Failed to connect to Kafka brokers for consumption. Check network connectivity and broker configuration.',
  [EVENT_CONSUMER_PROCESSING_ERROR]: 'Error occurred during event processing. Check the event handler implementation.',
  [EVENT_CONSUMER_HANDLER_NOT_FOUND]: 'No handler found for the event type. Register a handler for this event type.',
  [EVENT_CONSUMER_GROUP_ERROR]: 'Kafka consumer group rebalancing failed. Check consumer group configuration and broker health.',
  
  // Schema validation error messages
  [EVENT_SCHEMA_MISSING_FIELD]: 'Event is missing required fields. Ensure all required fields are included in the event.',
  [EVENT_SCHEMA_INVALID_TYPE]: 'Event contains fields with invalid types. Check the field types against the schema.',
  [EVENT_SCHEMA_INVALID_VALUE]: 'Event contains fields with invalid values. Ensure field values meet validation requirements.',
  [EVENT_SCHEMA_UNKNOWN_TYPE]: 'Unknown event type. Register this event type or correct the type identifier.',
  [EVENT_SCHEMA_INVALID_FORMAT]: 'Invalid event format. The event structure does not match any known schema.',
  
  // Delivery error messages
  [EVENT_DELIVERY_TIMEOUT]: 'Event delivery timed out. The broker may be overloaded or network latency is high.',
  [EVENT_DELIVERY_BROKER_UNAVAILABLE]: 'Kafka brokers are unavailable for event delivery. Check broker health and network connectivity.',
  [EVENT_DELIVERY_TOPIC_NOT_FOUND]: 'Kafka topic not found for event delivery. Create the topic or correct the topic name.',
  [EVENT_DELIVERY_PERMISSION_DENIED]: 'Permission denied for event delivery. Check producer permissions for the topic.',
  [EVENT_DELIVERY_SIZE_EXCEEDED]: 'Event size exceeds the maximum allowed size. Reduce the event size or increase the broker limit.',
  
  // Retry error messages
  [EVENT_RETRY_EXHAUSTED]: 'All retry attempts for the event have been exhausted. The event has been sent to the dead letter queue.',
  [EVENT_RETRY_BACKOFF_ERROR]: 'Error calculating retry backoff period. Check the retry policy configuration.',
  [EVENT_RETRY_POLICY_NOT_FOUND]: 'No retry policy found for the event type. Configure a retry policy for this event type.',
  [EVENT_RETRY_STATE_PERSISTENCE_ERROR]: 'Failed to persist retry state. Retry information may be lost.',
  [EVENT_RETRY_DLQ_DELIVERY_ERROR]: 'Failed to deliver event to the dead letter queue. The event may be lost.',
  
  // Fallback for unknown error codes
  [SYS_INTERNAL_SERVER_ERROR]: 'An unexpected error occurred during event processing.',
};

// -----------------------------------------------------------------------------
// Error Severity Mappings
// -----------------------------------------------------------------------------

/**
 * Maps error codes to severity levels for logging and alerting
 */
export const EVENT_ERROR_SEVERITY: Record<string, EventErrorSeverity> = {
  // Producer error severities
  [EVENT_PRODUCER_VALIDATION_ERROR]: EventErrorSeverity.MEDIUM,
  [EVENT_PRODUCER_SERIALIZATION_ERROR]: EventErrorSeverity.MEDIUM,
  [EVENT_PRODUCER_CONNECTION_ERROR]: EventErrorSeverity.HIGH,
  [EVENT_PRODUCER_DELIVERY_ERROR]: EventErrorSeverity.HIGH,
  [EVENT_PRODUCER_VERSION_ERROR]: EventErrorSeverity.MEDIUM,
  
  // Consumer error severities
  [EVENT_CONSUMER_DESERIALIZATION_ERROR]: EventErrorSeverity.MEDIUM,
  [EVENT_CONSUMER_VALIDATION_ERROR]: EventErrorSeverity.MEDIUM,
  [EVENT_CONSUMER_CONNECTION_ERROR]: EventErrorSeverity.HIGH,
  [EVENT_CONSUMER_PROCESSING_ERROR]: EventErrorSeverity.HIGH,
  [EVENT_CONSUMER_HANDLER_NOT_FOUND]: EventErrorSeverity.MEDIUM,
  [EVENT_CONSUMER_GROUP_ERROR]: EventErrorSeverity.HIGH,
  
  // Schema validation error severities
  [EVENT_SCHEMA_MISSING_FIELD]: EventErrorSeverity.MEDIUM,
  [EVENT_SCHEMA_INVALID_TYPE]: EventErrorSeverity.MEDIUM,
  [EVENT_SCHEMA_INVALID_VALUE]: EventErrorSeverity.MEDIUM,
  [EVENT_SCHEMA_UNKNOWN_TYPE]: EventErrorSeverity.MEDIUM,
  [EVENT_SCHEMA_INVALID_FORMAT]: EventErrorSeverity.MEDIUM,
  
  // Delivery error severities
  [EVENT_DELIVERY_TIMEOUT]: EventErrorSeverity.HIGH,
  [EVENT_DELIVERY_BROKER_UNAVAILABLE]: EventErrorSeverity.CRITICAL,
  [EVENT_DELIVERY_TOPIC_NOT_FOUND]: EventErrorSeverity.HIGH,
  [EVENT_DELIVERY_PERMISSION_DENIED]: EventErrorSeverity.HIGH,
  [EVENT_DELIVERY_SIZE_EXCEEDED]: EventErrorSeverity.MEDIUM,
  
  // Retry error severities
  [EVENT_RETRY_EXHAUSTED]: EventErrorSeverity.HIGH,
  [EVENT_RETRY_BACKOFF_ERROR]: EventErrorSeverity.MEDIUM,
  [EVENT_RETRY_POLICY_NOT_FOUND]: EventErrorSeverity.MEDIUM,
  [EVENT_RETRY_STATE_PERSISTENCE_ERROR]: EventErrorSeverity.HIGH,
  [EVENT_RETRY_DLQ_DELIVERY_ERROR]: EventErrorSeverity.CRITICAL,
  
  // Fallback for unknown error codes
  [SYS_INTERNAL_SERVER_ERROR]: EventErrorSeverity.CRITICAL,
};

// -----------------------------------------------------------------------------
// HTTP Status Code Mappings
// -----------------------------------------------------------------------------

/**
 * Maps error codes to HTTP status codes for REST API error responses
 */
export const EVENT_ERROR_HTTP_STATUS: Record<string, number> = {
  // Producer error HTTP status codes
  [EVENT_PRODUCER_VALIDATION_ERROR]: 400, // Bad Request
  [EVENT_PRODUCER_SERIALIZATION_ERROR]: 400, // Bad Request
  [EVENT_PRODUCER_CONNECTION_ERROR]: 503, // Service Unavailable
  [EVENT_PRODUCER_DELIVERY_ERROR]: 503, // Service Unavailable
  [EVENT_PRODUCER_VERSION_ERROR]: 400, // Bad Request
  
  // Consumer error HTTP status codes
  [EVENT_CONSUMER_DESERIALIZATION_ERROR]: 400, // Bad Request
  [EVENT_CONSUMER_VALIDATION_ERROR]: 400, // Bad Request
  [EVENT_CONSUMER_CONNECTION_ERROR]: 503, // Service Unavailable
  [EVENT_CONSUMER_PROCESSING_ERROR]: 500, // Internal Server Error
  [EVENT_CONSUMER_HANDLER_NOT_FOUND]: 501, // Not Implemented
  [EVENT_CONSUMER_GROUP_ERROR]: 503, // Service Unavailable
  
  // Schema validation error HTTP status codes
  [EVENT_SCHEMA_MISSING_FIELD]: 400, // Bad Request
  [EVENT_SCHEMA_INVALID_TYPE]: 400, // Bad Request
  [EVENT_SCHEMA_INVALID_VALUE]: 400, // Bad Request
  [EVENT_SCHEMA_UNKNOWN_TYPE]: 400, // Bad Request
  [EVENT_SCHEMA_INVALID_FORMAT]: 400, // Bad Request
  
  // Delivery error HTTP status codes
  [EVENT_DELIVERY_TIMEOUT]: 504, // Gateway Timeout
  [EVENT_DELIVERY_BROKER_UNAVAILABLE]: 503, // Service Unavailable
  [EVENT_DELIVERY_TOPIC_NOT_FOUND]: 404, // Not Found
  [EVENT_DELIVERY_PERMISSION_DENIED]: 403, // Forbidden
  [EVENT_DELIVERY_SIZE_EXCEEDED]: 413, // Payload Too Large
  
  // Retry error HTTP status codes
  [EVENT_RETRY_EXHAUSTED]: 500, // Internal Server Error
  [EVENT_RETRY_BACKOFF_ERROR]: 500, // Internal Server Error
  [EVENT_RETRY_POLICY_NOT_FOUND]: 500, // Internal Server Error
  [EVENT_RETRY_STATE_PERSISTENCE_ERROR]: 500, // Internal Server Error
  [EVENT_RETRY_DLQ_DELIVERY_ERROR]: 500, // Internal Server Error
  
  // Fallback for unknown error codes
  [SYS_INTERNAL_SERVER_ERROR]: 500, // Internal Server Error
};

// -----------------------------------------------------------------------------
// Journey-Specific Error Codes
// -----------------------------------------------------------------------------

/**
 * Health journey event error codes
 */
export const EVENT_HEALTH_METRIC_VALIDATION_ERROR = 'EVENT_HEALTH_001';
export const EVENT_HEALTH_GOAL_VALIDATION_ERROR = 'EVENT_HEALTH_002';
export const EVENT_HEALTH_DEVICE_VALIDATION_ERROR = 'EVENT_HEALTH_003';

/**
 * Care journey event error codes
 */
export const EVENT_CARE_APPOINTMENT_VALIDATION_ERROR = 'EVENT_CARE_001';
export const EVENT_CARE_MEDICATION_VALIDATION_ERROR = 'EVENT_CARE_002';
export const EVENT_CARE_TELEMEDICINE_VALIDATION_ERROR = 'EVENT_CARE_003';

/**
 * Plan journey event error codes
 */
export const EVENT_PLAN_CLAIM_VALIDATION_ERROR = 'EVENT_PLAN_001';
export const EVENT_PLAN_BENEFIT_VALIDATION_ERROR = 'EVENT_PLAN_002';
export const EVENT_PLAN_COVERAGE_VALIDATION_ERROR = 'EVENT_PLAN_003';

/**
 * Journey-specific error messages
 */
export const JOURNEY_EVENT_ERROR_MESSAGES: Record<string, string> = {
  // Health journey error messages
  [EVENT_HEALTH_METRIC_VALIDATION_ERROR]: 'Health metric validation failed. Check the metric type, value, and units.',
  [EVENT_HEALTH_GOAL_VALIDATION_ERROR]: 'Health goal validation failed. Check the goal type, target value, and timeframe.',
  [EVENT_HEALTH_DEVICE_VALIDATION_ERROR]: 'Health device validation failed. Check the device type, connection status, and data format.',
  
  // Care journey error messages
  [EVENT_CARE_APPOINTMENT_VALIDATION_ERROR]: 'Appointment validation failed. Check the appointment time, provider, and status.',
  [EVENT_CARE_MEDICATION_VALIDATION_ERROR]: 'Medication validation failed. Check the medication name, dosage, and schedule.',
  [EVENT_CARE_TELEMEDICINE_VALIDATION_ERROR]: 'Telemedicine validation failed. Check the session details, provider, and connection status.',
  
  // Plan journey error messages
  [EVENT_PLAN_CLAIM_VALIDATION_ERROR]: 'Claim validation failed. Check the claim amount, service date, and documentation.',
  [EVENT_PLAN_BENEFIT_VALIDATION_ERROR]: 'Benefit validation failed. Check the benefit type, coverage details, and eligibility.',
  [EVENT_PLAN_COVERAGE_VALIDATION_ERROR]: 'Coverage validation failed. Check the coverage period, limits, and plan details.',
};

/**
 * Maps journey-specific error codes to HTTP status codes
 */
export const JOURNEY_EVENT_ERROR_HTTP_STATUS: Record<string, number> = {
  // Health journey error HTTP status codes
  [EVENT_HEALTH_METRIC_VALIDATION_ERROR]: 400, // Bad Request
  [EVENT_HEALTH_GOAL_VALIDATION_ERROR]: 400, // Bad Request
  [EVENT_HEALTH_DEVICE_VALIDATION_ERROR]: 400, // Bad Request
  
  // Care journey error HTTP status codes
  [EVENT_CARE_APPOINTMENT_VALIDATION_ERROR]: 400, // Bad Request
  [EVENT_CARE_MEDICATION_VALIDATION_ERROR]: 400, // Bad Request
  [EVENT_CARE_TELEMEDICINE_VALIDATION_ERROR]: 400, // Bad Request
  
  // Plan journey error HTTP status codes
  [EVENT_PLAN_CLAIM_VALIDATION_ERROR]: 400, // Bad Request
  [EVENT_PLAN_BENEFIT_VALIDATION_ERROR]: 400, // Bad Request
  [EVENT_PLAN_COVERAGE_VALIDATION_ERROR]: 400, // Bad Request
};

/**
 * Maps journey-specific error codes to severity levels
 */
export const JOURNEY_EVENT_ERROR_SEVERITY: Record<string, EventErrorSeverity> = {
  // Health journey error severities
  [EVENT_HEALTH_METRIC_VALIDATION_ERROR]: EventErrorSeverity.MEDIUM,
  [EVENT_HEALTH_GOAL_VALIDATION_ERROR]: EventErrorSeverity.MEDIUM,
  [EVENT_HEALTH_DEVICE_VALIDATION_ERROR]: EventErrorSeverity.MEDIUM,
  
  // Care journey error severities
  [EVENT_CARE_APPOINTMENT_VALIDATION_ERROR]: EventErrorSeverity.MEDIUM,
  [EVENT_CARE_MEDICATION_VALIDATION_ERROR]: EventErrorSeverity.MEDIUM,
  [EVENT_CARE_TELEMEDICINE_VALIDATION_ERROR]: EventErrorSeverity.MEDIUM,
  
  // Plan journey error severities
  [EVENT_PLAN_CLAIM_VALIDATION_ERROR]: EventErrorSeverity.MEDIUM,
  [EVENT_PLAN_BENEFIT_VALIDATION_ERROR]: EventErrorSeverity.MEDIUM,
  [EVENT_PLAN_COVERAGE_VALIDATION_ERROR]: EventErrorSeverity.MEDIUM,
};