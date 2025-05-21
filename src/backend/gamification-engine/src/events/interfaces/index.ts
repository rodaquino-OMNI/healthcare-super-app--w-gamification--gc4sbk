/**
 * @file Event Interfaces Barrel File
 * @description Exports all event interfaces from the gamification engine's event system.
 * This file serves as the central entry point for importing event-related interfaces,
 * providing a clean and consistent import pattern throughout the codebase.
 */

// Re-export interfaces from @austa/interfaces package
import * as AustaEvents from '@austa/interfaces/gamification/events';

// Export local event interfaces
export * from './event.interface';
export * from './event-type.interface';
export * from './event-handler.interface';
export * from './event-response.interface';
export * from './event-versioning.interface';
export * from './journey-events.interface';

// Re-export interfaces from @austa/interfaces
export { AustaEvents };

/**
 * Namespace for all event-related interfaces and types.
 * Provides a structured way to import specific event interfaces.
 */
export namespace Events {
  // Core event interfaces
  export * from './event.interface';
  export * from './event-type.interface';
  
  // Event handling and processing
  export * from './event-handler.interface';
  export * from './event-response.interface';
  
  // Event versioning and compatibility
  export * from './event-versioning.interface';
  
  // Journey-specific event interfaces
  export * from './journey-events.interface';
  
  // Re-export from @austa/interfaces with alias to avoid naming conflicts
  export import Shared = AustaEvents;
}

/**
 * Type utilities for working with event interfaces
 */

/**
 * Extracts the payload type from an event interface
 * @template T The event interface type
 */
export type EventPayload<T> = T extends { payload: infer P } ? P : never;

/**
 * Creates a type-safe event creator function type
 * @template T The event interface type
 */
export type EventCreator<T> = (payload: EventPayload<T>) => T;

/**
 * Utility type to extract event types from a union of event interfaces
 * @template T The union of event interfaces
 */
export type EventTypeFromUnion<T> = T extends { type: infer Type } ? Type : never;

/**
 * Utility type to filter events by type
 * @template AllEvents Union of all event types
 * @template EventType The specific event type to filter by
 */
export type FilterEventsByType<AllEvents, EventType> = 
  AllEvents extends { type: EventType } ? AllEvents : never;

/**
 * @example Usage examples
 * 
 * // Import all event interfaces
 * import * as EventInterfaces from './events/interfaces';
 * 
 * // Import specific interfaces
 * import { IBaseEvent, IEventHandler } from './events/interfaces';
 * 
 * // Import using namespace
 * import { Events } from './events/interfaces';
 * const handler: Events.IEventHandler = { ... };
 * 
 * // Import shared interfaces from @austa/interfaces
 * import { AustaEvents } from './events/interfaces';
 * const event: AustaEvents.GamificationEvent = { ... };
 * 
 * // Use type utilities
 * import { EventPayload, FilterEventsByType } from './events/interfaces';
 * type HealthEventPayload = EventPayload<Events.IHealthEvent>;
 */