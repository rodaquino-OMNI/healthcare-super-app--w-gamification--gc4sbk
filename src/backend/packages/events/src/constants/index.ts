/**
 * Event Constants
 * 
 * This barrel file exports all event-related constants used throughout the AUSTA SuperApp.
 * It provides a unified interface for accessing event constants, ensuring consistent usage
 * patterns and reducing import statements in consumer code.
 *
 * @module @austa/events/constants
 *
 * @example
 * // Import all constants as namespaces to avoid naming collisions
 * import * as EventConstants from '@austa/events/constants';
 * 
 * // Use namespaced constants
 * const topicName = EventConstants.Topics.HEALTH_EVENTS;
 * const errorCode = EventConstants.Errors.SCHEMA_VALIDATION_FAILED;
 * 
 * @example
 * // Import specific constant groups
 * import { Topics, Types, Headers } from '@austa/events/constants';
 * 
 * // Use specific constants
 * const healthTopic = Topics.HEALTH_EVENTS;
 * const appointmentCreatedType = Types.CARE.APPOINTMENT_CREATED;
 * const correlationIdHeader = Headers.CORRELATION_ID;
 * 
 * @example
 * // Import everything directly (not recommended due to potential naming collisions)
 * import * as EventConstants from '@austa/events/constants';
 * 
 * // Destructure all constants (use with caution)
 * const { 
 *   Topics, 
 *   Types, 
 *   Headers, 
 *   Errors, 
 *   Config, 
 *   Serialization 
 * } = EventConstants;
 */

// Export all constant modules with namespace exports to avoid naming collisions
export * as Topics from './topics.constants';
export * as Types from './types.constants';
export * as Headers from './headers.constants';
export * as Errors from './errors.constants';
export * as Config from './config.constants';
export * as Serialization from './serialization.constants';

/**
 * Re-export specific constants that are commonly used together
 * This allows consumers to import these directly without namespace
 * when they need quick access to the most common constants.
 */

// Re-export the most commonly used topic constants for convenience
export { 
  HEALTH_EVENTS,
  CARE_EVENTS,
  PLAN_EVENTS,
  USER_EVENTS,
  GAMIFICATION_EVENTS,
} from './topics.constants';

// Re-export common error codes for convenience
export {
  EVENT_PROCESSING_ERROR,
  SCHEMA_VALIDATION_FAILED,
  EVENT_DELIVERY_TIMEOUT,
  RETRY_EXHAUSTED,
} from './errors.constants';

// Re-export common header keys for convenience
export {
  CORRELATION_ID,
  EVENT_TYPE,
  EVENT_VERSION,
  SOURCE_SERVICE,
  JOURNEY_CONTEXT,
} from './headers.constants';

/**
 * Type definitions for event constants
 * These types help ensure type safety when working with event constants
 */

/**
 * Union type of all event types across all journeys
 * This provides type safety when specifying event types
 */
export type EventType = 
  | Types.Health.HealthEventType
  | Types.Care.CareEventType
  | Types.Plan.PlanEventType
  | Types.User.UserEventType
  | Types.Gamification.GamificationEventType;

/**
 * Union type of all topic names
 * This provides type safety when specifying Kafka topics
 */
export type TopicName = 
  | typeof Topics.HEALTH_EVENTS
  | typeof Topics.CARE_EVENTS
  | typeof Topics.PLAN_EVENTS
  | typeof Topics.USER_EVENTS
  | typeof Topics.GAMIFICATION_EVENTS;

/**
 * Union type of all error codes
 * This provides type safety when handling event-related errors
 */
export type ErrorCode = 
  | typeof Errors.EVENT_PROCESSING_ERROR
  | typeof Errors.SCHEMA_VALIDATION_FAILED
  | typeof Errors.EVENT_DELIVERY_TIMEOUT
  | typeof Errors.RETRY_EXHAUSTED
  | string; // Allow for extensibility with custom error codes

/**
 * Union type of all header keys
 * This provides type safety when working with event headers
 */
export type HeaderKey = 
  | typeof Headers.CORRELATION_ID
  | typeof Headers.EVENT_TYPE
  | typeof Headers.EVENT_VERSION
  | typeof Headers.SOURCE_SERVICE
  | typeof Headers.JOURNEY_CONTEXT
  | string; // Allow for extensibility with custom headers