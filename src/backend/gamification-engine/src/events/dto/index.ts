/**
 * @file Event DTOs Barrel File
 * @description Exports all event DTOs for clean imports throughout the application.
 * This file serves as the central entry point for all event-related data structures
 * used in the gamification engine.
 */

// Re-export from @austa/interfaces for consistency across the platform
import * as GamificationEventInterfaces from '@austa/interfaces/gamification/events';

// Export all event DTOs
export * from './base-event.dto';
export * from './care-event.dto';
export * from './event-response.dto';
export * from './event-type.enum';
export * from './event-versioning.dto';
export * from './health-event.dto';
export * from './plan-event.dto';
export * from './process-event.dto';

// Re-export interfaces from @austa/interfaces for consistency
export { GamificationEventInterfaces };

/**
 * Type utility for extracting payload type from an event
 * @template T The event type
 */
export type EventPayload<T extends { payload: any }> = T['payload'];

/**
 * Type utility for creating a union of all journey-specific events
 */
export type JourneyEvent = 
  | GamificationEventInterfaces.HealthJourneyEvent
  | GamificationEventInterfaces.CareJourneyEvent
  | GamificationEventInterfaces.PlanJourneyEvent;

/**
 * Type utility for narrowing event types based on journey
 * @param event The event to check
 * @param journey The journey to check against
 * @returns Boolean indicating if the event belongs to the specified journey
 */
export const isJourneyEvent = (
  event: GamificationEventInterfaces.BaseGamificationEvent,
  journey: 'health' | 'care' | 'plan'
): boolean => {
  return event.journey === journey;
};

/**
 * Type guard for health journey events
 * @param event The event to check
 * @returns Boolean indicating if the event is a health journey event
 */
export const isHealthEvent = (
  event: GamificationEventInterfaces.BaseGamificationEvent
): event is GamificationEventInterfaces.HealthJourneyEvent => {
  return isJourneyEvent(event, 'health');
};

/**
 * Type guard for care journey events
 * @param event The event to check
 * @returns Boolean indicating if the event is a care journey event
 */
export const isCareEvent = (
  event: GamificationEventInterfaces.BaseGamificationEvent
): event is GamificationEventInterfaces.CareJourneyEvent => {
  return isJourneyEvent(event, 'care');
};

/**
 * Type guard for plan journey events
 * @param event The event to check
 * @returns Boolean indicating if the event is a plan journey event
 */
export const isPlanEvent = (
  event: GamificationEventInterfaces.BaseGamificationEvent
): event is GamificationEventInterfaces.PlanJourneyEvent => {
  return isJourneyEvent(event, 'plan');
};

/**
 * @example
 * // Import all event DTOs
 * import * as EventDTOs from '../events/dto';
 * 
 * // Use specific DTOs
 * const processEventDto = new EventDTOs.ProcessEventDto();
 * 
 * // Use type utilities
 * function handleHealthEvent(event: EventDTOs.GamificationEventInterfaces.HealthJourneyEvent) {
 *   // Type-safe access to health-specific payload
 *   const payload = event.payload;
 *   // ...
 * }
 * 
 * // Use type guards for runtime type checking
 * function processEvent(event: EventDTOs.GamificationEventInterfaces.BaseGamificationEvent) {
 *   if (EventDTOs.isHealthEvent(event)) {
 *     // TypeScript knows this is a HealthJourneyEvent
 *     handleHealthEvent(event);
 *   } else if (EventDTOs.isCareEvent(event)) {
 *     // TypeScript knows this is a CareJourneyEvent
 *     // ...
 *   }
 * }
 */