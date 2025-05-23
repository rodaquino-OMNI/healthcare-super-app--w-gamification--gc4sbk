/**
 * @file base-event.interface.ts
 * @description Defines the core event interface that all event types must implement across the AUSTA SuperApp.
 * This interface establishes the standardized structure for event-driven communication across all services
 * and journeys, ensuring consistent event structures for reliable processing within the gamification engine
 * and notification system.
 */

import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

/**
 * Base event interface that all events across the AUSTA SuperApp must implement.
 * Provides the standardized structure with required properties for consistent event processing.
 */
export interface BaseEvent<T = unknown> {
  /**
   * Unique identifier for the event
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  eventId: string;

  /**
   * The type of event that occurred
   * @example "APPOINTMENT_BOOKED", "HEALTH_GOAL_ACHIEVED", "CLAIM_SUBMITTED"
   */
  type: string;

  /**
   * ISO timestamp when the event occurred
   * @example "2023-04-15T14:32:17.000Z"
   */
  timestamp: string;

  /**
   * Version of the event schema, used for backward compatibility
   * Follows semantic versioning pattern (major.minor.patch)
   * @example "1.0.0", "2.3.1"
   */
  version: string;

  /**
   * The source service or component that generated this event
   * @example "health-service", "care-service", "plan-service", "auth-service"
   */
  source: string;

  /**
   * The journey context where the event originated (optional for system events)
   * @example "HEALTH", "CARE", "PLAN"
   */
  journey?: JourneyType;

  /**
   * The user ID associated with this event (optional for system events)
   * @example "user_123456"
   */
  userId?: string;

  /**
   * Event-specific payload data
   */
  payload: T;

  /**
   * Optional metadata for cross-cutting concerns
   * Used for tracing, correlation IDs, and other system-level information
   */
  metadata?: EventMetadata;
}

/**
 * Interface for event metadata that contains cross-cutting concerns
 * such as tracing, correlation IDs, and other system-level information.
 */
export interface EventMetadata {
  /**
   * Correlation ID for tracing requests across services
   * @example "corr-550e8400-e29b-41d4-a716-446655440000"
   */
  correlationId?: string;

  /**
   * Trace ID for distributed tracing
   * @example "trace-550e8400-e29b-41d4-a716-446655440000"
   */
  traceId?: string;

  /**
   * Span ID for distributed tracing
   * @example "span-550e8400-e29b-41d4-a716-446655440000"
   */
  spanId?: string;

  /**
   * Priority level for event processing
   * @example "high", "medium", "low"
   */
  priority?: 'high' | 'medium' | 'low';

  /**
   * Indicates if this is a retry of a previously failed event
   */
  isRetry?: boolean;

  /**
   * Number of retry attempts if this is a retry
   */
  retryCount?: number;

  /**
   * Original timestamp of the event if this is a retry
   */
  originalTimestamp?: string;

  /**
   * Additional custom metadata properties
   */
  [key: string]: any;
}

/**
 * Type guard to check if an object is a valid BaseEvent
 * @param obj The object to check
 * @returns True if the object is a valid BaseEvent, false otherwise
 */
export function isBaseEvent(obj: any): obj is BaseEvent {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.eventId === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.version === 'string' &&
    typeof obj.source === 'string' &&
    typeof obj.payload === 'object'
  );
}

/**
 * Creates a new event with the required properties
 * @param type The event type
 * @param source The source service or component
 * @param payload The event payload
 * @param options Additional options for the event
 * @returns A new BaseEvent instance
 */
export function createEvent<T>(
  type: string,
  source: string,
  payload: T,
  options?: {
    userId?: string;
    journey?: JourneyType;
    metadata?: EventMetadata;
    eventId?: string;
    timestamp?: string;
    version?: string;
  }
): BaseEvent<T> {
  return {
    eventId: options?.eventId || crypto.randomUUID(),
    timestamp: options?.timestamp || new Date().toISOString(),
    version: options?.version || '1.0.0',
    type,
    source,
    journey: options?.journey,
    userId: options?.userId,
    payload,
    metadata: options?.metadata,
  };
}

/**
 * Interface for event validation result
 */
export interface EventValidationResult {
  /**
   * Whether the event is valid
   */
  isValid: boolean;

  /**
   * Error messages if validation failed
   */
  errors?: string[];
}

/**
 * Validates a BaseEvent to ensure it has all required properties
 * @param event The event to validate
 * @returns Validation result with isValid flag and optional error messages
 */
export function validateEvent(event: any): EventValidationResult {
  const errors: string[] = [];

  if (!event) {
    return { isValid: false, errors: ['Event is null or undefined'] };
  }

  if (typeof event !== 'object') {
    return { isValid: false, errors: ['Event is not an object'] };
  }

  // Check required fields
  if (!event.eventId) errors.push('Missing required field: eventId');
  if (!event.type) errors.push('Missing required field: type');
  if (!event.timestamp) errors.push('Missing required field: timestamp');
  if (!event.version) errors.push('Missing required field: version');
  if (!event.source) errors.push('Missing required field: source');
  if (!event.payload) errors.push('Missing required field: payload');

  // Validate field types
  if (event.eventId && typeof event.eventId !== 'string') errors.push('eventId must be a string');
  if (event.type && typeof event.type !== 'string') errors.push('type must be a string');
  if (event.timestamp && typeof event.timestamp !== 'string') errors.push('timestamp must be a string');
  if (event.version && typeof event.version !== 'string') errors.push('version must be a string');
  if (event.source && typeof event.source !== 'string') errors.push('source must be a string');
  if (event.payload && typeof event.payload !== 'object') errors.push('payload must be an object');
  if (event.userId && typeof event.userId !== 'string') errors.push('userId must be a string');
  if (event.metadata && typeof event.metadata !== 'object') errors.push('metadata must be an object');

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}