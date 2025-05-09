/**
 * Event Constants
 * 
 * This module serves as a central export point for all event-related constants used
 * throughout the AUSTA SuperApp. It provides namespaced exports to avoid naming collisions
 * and ensures consistent access patterns for event constants.
 *
 * @module @austa/events/constants
 *
 * @example
 * // Import all constants from a specific namespace
 * import { EventTypes, EventTopics } from '@austa/events/constants';
 * 
 * // Use constants with namespace to avoid collisions
 * const healthEvent = {
 *   type: EventTypes.HEALTH.METRIC_RECORDED,
 *   topic: EventTopics.HEALTH,
 * };
 *
 * @example
 * // Import specific namespaces to reduce bundle size
 * import { EventErrors } from '@austa/events/constants';
 * 
 * // Handle specific error scenarios
 * if (error.code === EventErrors.SCHEMA_VALIDATION.INVALID_FORMAT) {
 *   // Handle schema validation error
 * }
 */

// Re-export all constants from their respective files
import * as EventErrors from './errors.constants';
import * as EventSerialization from './serialization.constants';
import * as EventConfig from './config.constants';
import * as EventHeaders from './headers.constants';
import * as EventTypes from './types.constants';
import * as EventTopics from './topics.constants';

// Re-export specific types from types.constants for convenience
export {
  EventType,
  HealthEventType,
  CareEventType,
  PlanEventType,
  CommonEventType,
  AllEventTypes,
  isHealthEventType,
  isCareEventType,
  isPlanEventType,
  isCommonEventType,
  isGamificationEventType,
  isUserEventType,
  getJourneyForEventType,
  getEventCategory
} from './types.constants';

// Export all constants as namespaced objects to avoid naming collisions
export {
  EventErrors,
  EventSerialization,
  EventConfig,
  EventHeaders,
  EventTypes,
  EventTopics,
};

/**
 * Convenience export of all event constants as a single object.
 * This can be useful for debugging or when passing all constants to a configuration function.
 * 
 * @example
 * // Import all constants as a single object
 * import { EventConstants } from '@austa/events/constants';
 * 
 * // Access constants through the object
 * console.log(EventConstants.Types.HEALTH.METRIC_RECORDED);
 * console.log(EventConstants.Topics.HEALTH);
 */
export const EventConstants = {
  Errors: EventErrors,
  Serialization: EventSerialization,
  Config: EventConfig,
  Headers: EventHeaders,
  Types: EventTypes,
  Topics: EventTopics,
};

/**
 * Type-safe event constant accessor.
 * This function provides a type-safe way to access event constants by namespace and key.
 * 
 * @param namespace - The constant namespace (e.g., 'Types', 'Topics')
 * @param key - The constant key within the namespace
 * @returns The constant value
 * 
 * @example
 * // Get a constant in a type-safe way
 * const metricRecordedType = getEventConstant('Types', 'HEALTH.METRIC_RECORDED');
 * const healthTopic = getEventConstant('Topics', 'HEALTH');
 */
export function getEventConstant<
  N extends keyof typeof EventConstants,
  K extends string
>(namespace: N, key: K): any {
  const parts = key.split('.');
  let result: any = EventConstants[namespace];
  
  for (const part of parts) {
    if (result && typeof result === 'object' && part in result) {
      result = result[part];
    } else {
      return undefined;
    }
  }
  
  return result;
}

// Export individual constants for direct imports
// This allows consumers to import specific constants directly

/**
 * Default retry configuration for event processing.
 * Provides sensible defaults for retry attempts, backoff, and timeouts.
 */
export const { DEFAULT_RETRY_CONFIG } = EventConfig;

/**
 * Standard correlation ID header key for distributed tracing.
 * Used to track events across services and maintain request context.
 */
export const { CORRELATION_ID_HEADER } = EventHeaders;

/**
 * Common error codes for event processing failures.
 * Provides standardized error codes for common failure scenarios.
 */
export const { COMMON_ERROR_CODES } = EventErrors;

/**
 * Default serialization format for events.
 * Specifies the standard serialization format used across the platform.
 */
export const { DEFAULT_SERIALIZATION_FORMAT } = EventSerialization;