/**
 * @file base-event.interface.ts
 * @description Defines the core event interface structure used across all event-related modules
 * within the gamification engine. Provides the foundation for all event types with essential
 * properties including event ID, type, timestamp, and payload. This file enables consistent
 * event handling and type safety throughout the event processing pipeline.
 *
 * This file implements the following requirements from the technical specification:
 * - Standardized, versioned event schemas defined in @austa/interfaces package
 * - Implement type-safe event schema with comprehensive event type definitions
 * - Integration with @austa/interfaces for shared TypeScript models and type safety
 * - Document event schema for all journeys
 */

import { JourneyType } from './journey.interface';
import { IEventMetadata, IEventProcessingMetadata } from './event-metadata.interface';
import { IVersion } from './versioning.interface';
import { EventTypeId } from '../../events/interfaces/event-type.interface';

/**
 * Base interface for all events in the gamification system.
 * This interface provides the essential structure that all event types must implement.
 * It ensures consistent event handling and type safety throughout the event processing pipeline.
 *
 * @interface IBaseEvent
 */
export interface IBaseEvent {
  /**
   * Unique identifier for the event
   * Used for deduplication and tracking
   */
  id: string;

  /**
   * Type of the event, used for rule matching and processing
   * @example 'HEALTH_METRIC_RECORDED', 'APPOINTMENT_COMPLETED', 'CLAIM_SUBMITTED'
   */
  type: EventTypeId;

  /**
   * User ID associated with the event
   * Must be a valid UUID of a registered user
   */
  userId: string;

  /**
   * Source journey that generated the event
   * Optional for system-generated events
   */
  journey?: JourneyType;

  /**
   * Timestamp when the event occurred
   * ISO 8601 format
   */
  timestamp: string;

  /**
   * Event-specific data that varies based on event type
   * This is a generic payload that can contain any journey-specific data
   */
  payload: Record<string, any>;

  /**
   * Event schema version for backward compatibility
   * Follows semantic versioning (major.minor.patch)
   */
  version: string | IVersion;

  /**
   * Optional metadata for the event
   * Contains information about the event source, tracking, and version
   */
  metadata?: IEventMetadata;

  /**
   * Optional processing metadata for the event
   * Contains information about the event processing status and history
   */
  processingMetadata?: IEventProcessingMetadata;

  /**
   * Optional correlation ID for tracking event processing across services
   */
  correlationId?: string;
}

/**
 * Interface for typed event payloads with generic type parameter.
 * Allows for journey-specific event data with proper type checking.
 * 
 * @interface ITypedEventPayload
 * @template T Type of the event data
 */
export interface ITypedEventPayload<T = any> {
  /**
   * Event-specific data that varies based on event type
   */
  data: T;

  /**
   * Optional metadata for additional context
   */
  metadata?: Record<string, any>;
}

/**
 * Enhanced base event interface with typed payload.
 * Extends the basic IBaseEvent interface with a generic type parameter for the payload.
 * 
 * @interface ITypedBaseEvent
 * @template T Type of the event payload
 * @extends IBaseEvent
 */
export interface ITypedBaseEvent<T = any> extends Omit<IBaseEvent, 'payload'> {
  /**
   * Typed payload for the event
   */
  payload: ITypedEventPayload<T>;
}

/**
 * Interface for health journey events
 * @interface IHealthEvent
 * @extends ITypedBaseEvent
 */
export interface IHealthEvent<T = any> extends ITypedBaseEvent<T> {
  journey: JourneyType.HEALTH;
}

/**
 * Interface for care journey events
 * @interface ICareEvent
 * @extends ITypedBaseEvent
 */
export interface ICareEvent<T = any> extends ITypedBaseEvent<T> {
  journey: JourneyType.CARE;
}

/**
 * Interface for plan journey events
 * @interface IPlanEvent
 * @extends ITypedBaseEvent
 */
export interface IPlanEvent<T = any> extends ITypedBaseEvent<T> {
  journey: JourneyType.PLAN;
}

/**
 * Union type of all possible journey-specific event types
 * @type JourneyEvent
 */
export type JourneyEvent<T = any> = IHealthEvent<T> | ICareEvent<T> | IPlanEvent<T>;

/**
 * Type guard to check if an event is a health event
 * @param event The event to check
 * @returns True if the event is a health event
 */
export function isHealthEvent(event: IBaseEvent): event is IHealthEvent {
  return event.journey === JourneyType.HEALTH;
}

/**
 * Type guard to check if an event is a care event
 * @param event The event to check
 * @returns True if the event is a care event
 */
export function isCareEvent(event: IBaseEvent): event is ICareEvent {
  return event.journey === JourneyType.CARE;
}

/**
 * Type guard to check if an event is a plan event
 * @param event The event to check
 * @returns True if the event is a plan event
 */
export function isPlanEvent(event: IBaseEvent): event is IPlanEvent {
  return event.journey === JourneyType.PLAN;
}

/**
 * Creates a new base event with the specified properties
 * @param type The event type
 * @param userId The user ID
 * @param payload The event payload
 * @param journey The optional journey
 * @returns A new IBaseEvent object
 */
export function createBaseEvent(
  type: EventTypeId,
  userId: string,
  payload: Record<string, any>,
  journey?: JourneyType
): IBaseEvent {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type,
    userId,
    payload,
    journey,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    correlationId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  };
}

/**
 * Creates a new typed base event with the specified properties
 * @param type The event type
 * @param userId The user ID
 * @param data The event data
 * @param journey The optional journey
 * @returns A new ITypedBaseEvent object
 */
export function createTypedBaseEvent<T>(
  type: EventTypeId,
  userId: string,
  data: T,
  journey?: JourneyType
): ITypedBaseEvent<T> {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type,
    userId,
    payload: {
      data
    },
    journey,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    correlationId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  };
}

/**
 * Creates a new health journey event with the specified properties
 * @param type The event type
 * @param userId The user ID
 * @param data The event data
 * @returns A new IHealthEvent object
 */
export function createHealthEvent<T>(
  type: EventTypeId,
  userId: string,
  data: T
): IHealthEvent<T> {
  return {
    ...createTypedBaseEvent(type, userId, data),
    journey: JourneyType.HEALTH
  };
}

/**
 * Creates a new care journey event with the specified properties
 * @param type The event type
 * @param userId The user ID
 * @param data The event data
 * @returns A new ICareEvent object
 */
export function createCareEvent<T>(
  type: EventTypeId,
  userId: string,
  data: T
): ICareEvent<T> {
  return {
    ...createTypedBaseEvent(type, userId, data),
    journey: JourneyType.CARE
  };
}

/**
 * Creates a new plan journey event with the specified properties
 * @param type The event type
 * @param userId The user ID
 * @param data The event data
 * @returns A new IPlanEvent object
 */
export function createPlanEvent<T>(
  type: EventTypeId,
  userId: string,
  data: T
): IPlanEvent<T> {
  return {
    ...createTypedBaseEvent(type, userId, data),
    journey: JourneyType.PLAN
  };
}

/**
 * Converts a ProcessEventDto to an IBaseEvent
 * @param dto The ProcessEventDto to convert
 * @returns An IBaseEvent object
 */
export function fromProcessEventDto(dto: {
  type: string;
  userId: string;
  data: object;
  journey?: string;
  version?: number;
}): IBaseEvent {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: dto.type as EventTypeId,
    userId: dto.userId,
    payload: {
      data: dto.data
    },
    journey: dto.journey as JourneyType,
    timestamp: new Date().toISOString(),
    version: dto.version ? `1.${dto.version}.0` : '1.0.0',
    correlationId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  };
}

/**
 * Extracts the payload data from an event
 * @param event The event to extract data from
 * @returns The payload data
 */
export function getEventData<T>(event: IBaseEvent): T {
  if (typeof event.payload === 'object' && event.payload !== null) {
    if ('data' in event.payload) {
      return event.payload.data as T;
    }
    return event.payload as T;
  }
  return {} as T;
}

/**
 * Type for extracting the payload type from an event type
 * @template E The event type
 */
export type ExtractEventPayload<E> = E extends ITypedBaseEvent<infer P> ? P : never;

/**
 * Type for creating a mapped type of journey events
 * @template T The payload type
 */
export type JourneyEventMap<T> = {
  [JourneyType.HEALTH]: IHealthEvent<T>;
  [JourneyType.CARE]: ICareEvent<T>;
  [JourneyType.PLAN]: IPlanEvent<T>;
};

/**
 * Type for extracting a journey-specific event type based on journey type
 * @template T The payload type
 * @template J The journey type
 */
export type JourneyEventType<T, J extends JourneyType> = JourneyEventMap<T>[J];