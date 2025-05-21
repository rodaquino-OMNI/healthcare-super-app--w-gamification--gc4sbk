/**
 * @file event-handler.decorator.ts
 * @description Class and method decorator that registers event handlers for specific gamification event types.
 * Creates a type-safe mapping between event types and their handlers, enabling automatic routing of events.
 */

import { SetMetadata } from '@nestjs/common';
import { GamificationEvent, EventType, JourneyType } from '@austa/interfaces/gamification/events';

/**
 * Metadata key used to store event handler information.
 * This is used by the EventsService to discover and route events to the appropriate handlers.
 */
export const EVENT_HANDLER_METADATA = 'event_handler_metadata';

/**
 * Interface defining the metadata structure for event handlers.
 * This metadata is attached to classes or methods using the EventHandler decorator.
 */
export interface EventHandlerMetadata<T extends GamificationEvent = GamificationEvent> {
  /**
   * The type of event this handler processes
   */
  eventType: EventType;

  /**
   * Optional journey filter - if specified, this handler will only process events from this journey
   */
  journey?: JourneyType;

  /**
   * Handler priority - higher priority handlers are executed first (default: 0)
   */
  priority?: number;

  /**
   * Whether this handler should prevent other handlers from processing the same event (default: false)
   */
  exclusive?: boolean;

  /**
   * Optional metadata for the handler
   */
  metadata?: Record<string, any>;
}

/**
 * Type for the EventHandler decorator function.
 * Supports both class and method decorators with proper typing.
 */
export type EventHandlerDecorator = (
  target: any,
  key?: string | symbol,
  descriptor?: TypedPropertyDescriptor<any>
) => any;

/**
 * Decorator that registers a class or method as an event handler for a specific event type.
 * This decorator is used to create a type-safe mapping between event types and their handlers,
 * enabling automatic routing of events to the appropriate handlers.
 * 
 * @param options Event handler metadata or event type string
 * @returns A class or method decorator that registers the handler
 * 
 * @example
 * // Class decorator for handling all HEALTH_METRIC_RECORDED events
 * @EventHandler({ eventType: 'HEALTH_METRIC_RECORDED' })
 * export class HealthMetricHandler implements IEventHandler { ... }
 * 
 * @example
 * // Method decorator with journey filter and priority
 * @EventHandler({ 
 *   eventType: 'APPOINTMENT_BOOKED', 
 *   journey: 'CARE',
 *   priority: 10
 * })
 * handleAppointmentBooked(event: GamificationEvent) { ... }
 * 
 * @example
 * // Shorthand for simple cases
 * @EventHandler('CLAIM_SUBMITTED')
 * handleClaimSubmitted(event: GamificationEvent) { ... }
 */
export function EventHandler(
  options: EventHandlerMetadata | EventType
): EventHandlerDecorator {
  // Normalize options to EventHandlerMetadata
  const metadata: EventHandlerMetadata = typeof options === 'string'
    ? { eventType: options }
    : options;

  // Set default values
  metadata.priority = metadata.priority ?? 0;
  metadata.exclusive = metadata.exclusive ?? false;

  return (target: any, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) => {
    // If key is provided, this is a method decorator
    if (key) {
      // Store metadata on the method
      SetMetadata(EVENT_HANDLER_METADATA, metadata)(target, key, descriptor);
      return descriptor;
    }

    // Otherwise, this is a class decorator
    SetMetadata(EVENT_HANDLER_METADATA, metadata)(target);
    return target;
  };
}

/**
 * Decorator that registers a class or method as a health journey event handler.
 * This is a convenience wrapper around EventHandler with the journey pre-set to 'HEALTH'.
 * 
 * @param options Event handler metadata (without journey) or event type string
 * @returns A class or method decorator that registers the handler
 * 
 * @example
 * @HealthEventHandler('HEALTH_METRIC_RECORDED')
 * handleHealthMetric(event: GamificationEvent) { ... }
 */
export function HealthEventHandler(
  options: Omit<EventHandlerMetadata, 'journey'> | EventType
): EventHandlerDecorator {
  const metadata: EventHandlerMetadata = typeof options === 'string'
    ? { eventType: options, journey: 'HEALTH' }
    : { ...options, journey: 'HEALTH' };

  return EventHandler(metadata);
}

/**
 * Decorator that registers a class or method as a care journey event handler.
 * This is a convenience wrapper around EventHandler with the journey pre-set to 'CARE'.
 * 
 * @param options Event handler metadata (without journey) or event type string
 * @returns A class or method decorator that registers the handler
 * 
 * @example
 * @CareEventHandler('APPOINTMENT_BOOKED')
 * handleAppointment(event: GamificationEvent) { ... }
 */
export function CareEventHandler(
  options: Omit<EventHandlerMetadata, 'journey'> | EventType
): EventHandlerDecorator {
  const metadata: EventHandlerMetadata = typeof options === 'string'
    ? { eventType: options, journey: 'CARE' }
    : { ...options, journey: 'CARE' };

  return EventHandler(metadata);
}

/**
 * Decorator that registers a class or method as a plan journey event handler.
 * This is a convenience wrapper around EventHandler with the journey pre-set to 'PLAN'.
 * 
 * @param options Event handler metadata (without journey) or event type string
 * @returns A class or method decorator that registers the handler
 * 
 * @example
 * @PlanEventHandler('CLAIM_SUBMITTED')
 * handleClaim(event: GamificationEvent) { ... }
 */
export function PlanEventHandler(
  options: Omit<EventHandlerMetadata, 'journey'> | EventType
): EventHandlerDecorator {
  const metadata: EventHandlerMetadata = typeof options === 'string'
    ? { eventType: options, journey: 'PLAN' }
    : { ...options, journey: 'PLAN' };

  return EventHandler(metadata);
}

/**
 * Decorator that registers a class or method as a system event handler.
 * This is a convenience wrapper around EventHandler with the journey pre-set to 'SYSTEM'.
 * 
 * @param options Event handler metadata (without journey) or event type string
 * @returns A class or method decorator that registers the handler
 * 
 * @example
 * @SystemEventHandler('USER_LOGIN')
 * handleUserLogin(event: GamificationEvent) { ... }
 */
export function SystemEventHandler(
  options: Omit<EventHandlerMetadata, 'journey'> | EventType
): EventHandlerDecorator {
  const metadata: EventHandlerMetadata = typeof options === 'string'
    ? { eventType: options, journey: 'SYSTEM' }
    : { ...options, journey: 'SYSTEM' };

  return EventHandler(metadata);
}

/**
 * Decorator that registers a class or method as a high-priority event handler.
 * This is a convenience wrapper around EventHandler with the priority pre-set to 100.
 * 
 * @param options Event handler metadata (without priority) or event type string
 * @returns A class or method decorator that registers the handler
 * 
 * @example
 * @HighPriorityEventHandler('ACHIEVEMENT_UNLOCKED')
 * handleAchievement(event: GamificationEvent) { ... }
 */
export function HighPriorityEventHandler(
  options: Omit<EventHandlerMetadata, 'priority'> | EventType
): EventHandlerDecorator {
  const metadata: EventHandlerMetadata = typeof options === 'string'
    ? { eventType: options, priority: 100 }
    : { ...options, priority: 100 };

  return EventHandler(metadata);
}

/**
 * Decorator that registers a class or method as an exclusive event handler.
 * Exclusive handlers prevent other handlers from processing the same event.
 * This is a convenience wrapper around EventHandler with the exclusive flag set to true.
 * 
 * @param options Event handler metadata (without exclusive) or event type string
 * @returns A class or method decorator that registers the handler
 * 
 * @example
 * @ExclusiveEventHandler('LEVEL_UP')
 * handleLevelUp(event: GamificationEvent) { ... }
 */
export function ExclusiveEventHandler(
  options: Omit<EventHandlerMetadata, 'exclusive'> | EventType
): EventHandlerDecorator {
  const metadata: EventHandlerMetadata = typeof options === 'string'
    ? { eventType: options, exclusive: true }
    : { ...options, exclusive: true };

  return EventHandler(metadata);
}