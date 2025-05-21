/**
 * @file Base Event Interface
 * @description Defines the core event interface structure used across all event-related modules
 * within the gamification engine. Provides the foundation for all event types with essential
 * properties including event ID, type, timestamp, and payload.
 */

import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

/**
 * Base event interface that all gamification events must implement.
 * Provides essential properties required for event processing and tracking.
 */
export interface IBaseEvent {
  /**
   * Unique identifier for the event
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id?: string;

  /**
   * The type of event that occurred
   * @example "APPOINTMENT_BOOKED", "HEALTH_GOAL_ACHIEVED", "CLAIM_SUBMITTED"
   */
  type: string;

  /**
   * The user ID associated with this event
   * @example "user_123456"
   */
  userId: string;

  /**
   * ISO timestamp when the event occurred
   * @example "2023-04-15T14:32:17.000Z"
   */
  timestamp: string;

  /**
   * The journey context where the event originated
   * @example "HEALTH", "CARE", "PLAN"
   */
  journey?: JourneyType;

  /**
   * The source service that generated this event
   * @example "health-service", "care-service", "plan-service"
   */
  source?: string;

  /**
   * Version of the event schema, used for backward compatibility
   * @example "1.0", "2.3"
   */
  version?: string;

  /**
   * Event-specific payload data
   */
  data: IEventPayload;
}

/**
 * Interface for event payload data with generic typing support.
 * Allows for type-safe access to event-specific data structures.
 */
export interface IEventPayload {
  /**
   * Any valid event data properties
   * The structure varies based on the event type
   */
  [key: string]: any;
}

/**
 * Type guard to check if an object is a valid IBaseEvent
 * @param obj The object to check
 * @returns True if the object conforms to the IBaseEvent interface
 */
export function isBaseEvent(obj: any): obj is IBaseEvent {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.type === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.timestamp === 'string' &&
    obj.data !== undefined
  );
}

/**
 * Utility type to extract the payload type from an event type
 * @template T The event type extending IBaseEvent
 */
export type EventPayloadType<T extends IBaseEvent> = T['data'];

/**
 * Utility type to create a strongly typed event with a specific payload type
 * @template P The payload type extending IEventPayload
 */
export type TypedEvent<P extends IEventPayload> = Omit<IBaseEvent, 'data'> & { data: P };