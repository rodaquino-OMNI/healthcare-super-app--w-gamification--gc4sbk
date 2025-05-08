/**
 * @file event-handler.decorator.ts
 * @description Provides decorators for registering event handlers in the gamification engine.
 * Creates a type-safe mapping between event types and their handlers, enabling automatic
 * routing of events to the appropriate handler methods.
 *
 * This file implements the following requirements from the technical specification:
 * - Standardized event schemas between journey services and the gamification engine
 * - Type-safe event schema with consistent processing
 * - Support for journey-specific event handling
 * - Runtime configuration of event handler priorities
 */

import 'reflect-metadata';
import { SetMetadata } from '@nestjs/common';
import { EventTypeId, HealthEventType, CareEventType, PlanEventType, CommonEventType } from '../../events/interfaces/event-type.interface';
import { IEvent, IHealthEvent, ICareEvent, IPlanEvent, ISystemEvent } from '../../events/interfaces/event.interface';
import { ProcessEventDto } from '../../events/dto/process-event.dto';
import { JourneyType } from '@austa/interfaces/gamification';

/**
 * Metadata key for storing event handler information.
 * Used internally by the event dispatcher to find handlers for specific event types.
 */
export const EVENT_HANDLER_METADATA = 'event_handler_metadata';

/**
 * Interface defining the configuration options for an event handler.
 * Provides type-safe configuration for event handlers with support for
 * journey-specific handling and priority-based execution order.
 */
export interface EventHandlerOptions {
  /**
   * The event type(s) this handler can process.
   * Can be a single event type or an array of event types.
   */
  eventType: EventTypeId | EventTypeId[];
  
  /**
   * Optional journey filter to only handle events from specific journeys.
   * If not provided, the handler will process events from all journeys.
   */
  journey?: JourneyType | JourneyType[];
  
  /**
   * Optional priority for this handler (higher numbers execute first).
   * Used to determine the order of execution when multiple handlers exist for the same event type.
   * @default 0
   */
  priority?: number;
  
  /**
   * Whether this handler should prevent other handlers from executing if it succeeds.
   * If true, no other handlers for the same event type will be executed after this one.
   * @default false
   */
  exclusive?: boolean;
  
  /**
   * Optional description of what this handler does.
   * Useful for documentation and debugging purposes.
   */
  description?: string;
}

/**
 * Type for the event handler metadata stored by the decorator.
 * This is the internal representation used by the event dispatcher.
 */
export interface EventHandlerMetadata extends EventHandlerOptions {
  /**
   * The property key (method name) of the handler method.
   * Only present for method decorators.
   */
  propertyKey?: string | symbol;
  
  /**
   * Normalized array of event types this handler can process.
   * Always an array, even if a single event type was provided in the options.
   */
  eventTypes: EventTypeId[];
  
  /**
   * Normalized array of journeys this handler can process.
   * Always an array, even if a single journey was provided in the options.
   * If undefined, the handler processes events from all journeys.
   */
  journeys?: JourneyType[];
}

/**
 * Decorator factory that creates class or method decorators for registering event handlers.
 * 
 * @param options Configuration options for the event handler
 * @returns A class or method decorator that registers the handler for the specified event types
 * 
 * @example
 * // Class decorator for handling all health events
 * @EventHandler({
 *   eventType: Object.values(HealthEventType),
 *   journey: JourneyType.HEALTH,
 *   description: 'Handles all health journey events'
 * })
 * @Injectable()
 * export class HealthEventHandler {
 *   constructor(private readonly achievementsService: AchievementsService) {}
 *
 *   @EventHandler({
 *     eventType: HealthEventType.GOAL_ACHIEVED,
 *     priority: 10,
 *     description: 'Awards achievements for completed health goals'
 *   })
 *   async handleGoalAchieved(event: IHealthEvent) {
 *     // Implementation for handling goal achievements
 *     return this.achievementsService.processGoalAchievement(event);
 *   }
 * }
 * 
 * @example
 * // Method decorator for handling a specific event with high priority
 * @EventHandler({
 *   eventType: HealthEventType.GOAL_ACHIEVED,
 *   priority: 10,
 *   description: 'Awards achievements for completed health goals'
 * })
 * handleGoalAchieved(event: IEvent) {}
 */
export function EventHandler(options: EventHandlerOptions): ClassDecorator & MethodDecorator {
  // Normalize event types to always be an array
  const eventTypes = Array.isArray(options.eventType) 
    ? options.eventType 
    : [options.eventType];
  
  // Normalize journeys to always be an array if provided
  const journeys = options.journey 
    ? (Array.isArray(options.journey) ? options.journey : [options.journey]) 
    : undefined;
  
  // Create the metadata object
  const metadata: EventHandlerMetadata = {
    ...options,
    eventTypes,
    journeys,
    priority: options.priority ?? 0,
    exclusive: options.exclusive ?? false
  };
  
  // Return a decorator function that can be used as both a class and method decorator
  return (target: any, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) => {
    if (propertyKey && descriptor) {
      // Method decorator
      metadata.propertyKey = propertyKey;
      return SetMetadata(EVENT_HANDLER_METADATA, metadata)(target, propertyKey, descriptor);
    } else {
      // Class decorator
      return SetMetadata(EVENT_HANDLER_METADATA, metadata)(target);
    }
  };
}

/**
 * Convenience decorator for handling health journey events.
 * 
 * @param eventType The health event type(s) to handle
 * @param options Additional options for the handler
 * @returns A class or method decorator that registers the handler for the specified health event types
 * 
 * @example
 * @HealthEventHandler(HealthEventType.GOAL_ACHIEVED)
 * handleGoalAchieved(event: IHealthEvent) {
 *   // Type-safe access to health-specific event data
 *   const goalId = event.payload.data.goal?.id;
 *   const progress = event.payload.data.goal?.progress;
 *   // Process the goal achievement
 * }
 */
export function HealthEventHandler(
  eventType: HealthEventType | HealthEventType[],
  options: Omit<EventHandlerOptions, 'eventType' | 'journey'> = {}
): ClassDecorator & MethodDecorator {
  return EventHandler({
    eventType,
    journey: JourneyType.HEALTH,
    ...options
  });
}

/**
 * Convenience decorator for handling care journey events.
 * 
 * @param eventType The care event type(s) to handle
 * @param options Additional options for the handler
 * @returns A class or method decorator that registers the handler for the specified care event types
 * 
 * @example
 * @CareEventHandler(CareEventType.APPOINTMENT_ATTENDED)
 * handleAppointmentAttended(event: ICareEvent) {
 *   // Type-safe access to care-specific event data
 *   const appointmentId = event.payload.data.appointment?.id;
 *   const providerId = event.payload.data.appointment?.providerId;
 *   // Process the appointment attendance
 * }
 */
export function CareEventHandler(
  eventType: CareEventType | CareEventType[],
  options: Omit<EventHandlerOptions, 'eventType' | 'journey'> = {}
): ClassDecorator & MethodDecorator {
  return EventHandler({
    eventType,
    journey: JourneyType.CARE,
    ...options
  });
}

/**
 * Convenience decorator for handling plan journey events.
 * 
 * @param eventType The plan event type(s) to handle
 * @param options Additional options for the handler
 * @returns A class or method decorator that registers the handler for the specified plan event types
 * 
 * @example
 * @PlanEventHandler(PlanEventType.CLAIM_SUBMITTED)
 * handleClaimSubmitted(event: IPlanEvent) {
 *   // Type-safe access to plan-specific event data
 *   const claimId = event.payload.data.claim?.id;
 *   const amount = event.payload.data.claim?.amount;
 *   // Process the claim submission
 * }
 */
export function PlanEventHandler(
  eventType: PlanEventType | PlanEventType[],
  options: Omit<EventHandlerOptions, 'eventType' | 'journey'> = {}
): ClassDecorator & MethodDecorator {
  return EventHandler({
    eventType,
    journey: JourneyType.PLAN,
    ...options
  });
}

/**
 * Convenience decorator for handling common (non-journey-specific) events.
 * 
 * @param eventType The common event type(s) to handle
 * @param options Additional options for the handler
 * @returns A class or method decorator that registers the handler for the specified common event types
 * 
 * @example
 * @CommonEventHandler(CommonEventType.USER_REGISTERED)
 * handleUserRegistered(event: ISystemEvent) {
 *   // Process system-generated events
 *   const userId = event.userId;
 *   const timestamp = event.timestamp;
 *   // Initialize user's gamification profile
 * }
 */
export function CommonEventHandler(
  eventType: CommonEventType | CommonEventType[],
  options: Omit<EventHandlerOptions, 'eventType' | 'journey'> = {}
): ClassDecorator & MethodDecorator {
  return EventHandler({
    eventType,
    ...options
  });
}

/**
 * Decorator for marking a class as an event handler provider.
 * This is used to automatically discover and register event handlers during application bootstrap.
 * 
 * @returns A class decorator that marks the class as an event handler provider
 * 
 * @example
 * @EventHandlerProvider()
 * @Injectable()
 * export class HealthAchievementHandlers {
 *   constructor(
 *     private readonly profilesService: ProfilesService,
 *     private readonly achievementsService: AchievementsService
 *   ) {}
 *
 *   @HealthEventHandler(HealthEventType.GOAL_ACHIEVED, { priority: 10 })
 *   async handleGoalAchievement(event: IHealthEvent) {
 *     const userId = event.userId;
 *     const goalId = event.payload.data.goal?.id;
 *     
 *     // Update user's achievements
 *     await this.achievementsService.unlockAchievement(userId, 'HEALTH_MILESTONE');
 *     
 *     // Return true to indicate successful handling
 *     return true;
 *   }
 * }
 */
export function EventHandlerProvider(): ClassDecorator {
  return SetMetadata('isEventHandlerProvider', true);
}

/**
 * Utility function to extract event handler metadata from a class or method.
 * Used internally by the event dispatcher to find handlers for specific event types.
 * 
 * @param target The class or object instance to extract metadata from
 * @param propertyKey Optional property key (method name) to extract metadata from
 * @returns The event handler metadata, or undefined if none exists
 */
export function getEventHandlerMetadata(target: any, propertyKey?: string | symbol): EventHandlerMetadata | undefined {
  const metadata = Reflect.getMetadata(EVENT_HANDLER_METADATA, propertyKey ? target[propertyKey] : target);
  return metadata as EventHandlerMetadata | undefined;
}

/**
 * Utility function to check if a class is an event handler provider.
 * Used internally during application bootstrap to discover event handler providers.
 * 
 * @param target The class to check
 * @returns True if the class is an event handler provider, false otherwise
 */
export function isEventHandlerProvider(target: any): boolean {
  return Reflect.getMetadata('isEventHandlerProvider', target) === true;
}

/**
 * Utility function to find all event handlers for a specific event type.
 * Used by the event dispatcher to route events to the appropriate handlers.
 * 
 * @param providers Array of provider instances to search for handlers
 * @param eventType The event type to find handlers for
 * @param journey Optional journey to filter handlers by
 * @returns Array of handler metadata and their corresponding methods, sorted by priority
 */
export function findEventHandlers(
  providers: any[],
  eventType: EventTypeId,
  journey?: JourneyType
): Array<{ metadata: EventHandlerMetadata; provider: any; method: Function }> {
  const handlers: Array<{ metadata: EventHandlerMetadata; provider: any; method: Function }> = [];
  
  // Search all providers for handlers
  for (const provider of providers) {
    // Check if the provider itself has handler metadata
    const classMetadata = getEventHandlerMetadata(provider.constructor);
    if (classMetadata) {
      // Check if this class handles the event type
      if (classMetadata.eventTypes.includes(eventType)) {
        // Check journey filter if specified
        if (!journey || !classMetadata.journeys || classMetadata.journeys.includes(journey)) {
          // Get all methods of the provider
          const prototype = Object.getPrototypeOf(provider);
          const methodNames = Object.getOwnPropertyNames(prototype).filter(
            name => name !== 'constructor' && typeof prototype[name] === 'function'
          );
          
          // Check each method for handler metadata
          for (const methodName of methodNames) {
            const methodMetadata = getEventHandlerMetadata(prototype, methodName);
            if (
              methodMetadata &&
              methodMetadata.eventTypes.includes(eventType) &&
              (!journey || !methodMetadata.journeys || methodMetadata.journeys.includes(journey))
            ) {
              handlers.push({
                metadata: methodMetadata,
                provider,
                method: prototype[methodName]
              });
            }
          }
        }
      }
    } else {
      // Check methods directly if the class doesn't have handler metadata
      const prototype = Object.getPrototypeOf(provider);
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        name => name !== 'constructor' && typeof prototype[name] === 'function'
      );
      
      // Check each method for handler metadata
      for (const methodName of methodNames) {
        const methodMetadata = getEventHandlerMetadata(prototype, methodName);
        if (
          methodMetadata &&
          methodMetadata.eventTypes.includes(eventType) &&
          (!journey || !methodMetadata.journeys || methodMetadata.journeys.includes(journey))
        ) {
          handlers.push({
            metadata: methodMetadata,
            provider,
            method: prototype[methodName]
          });
        }
      }
    }
  }
  
  // Sort handlers by priority (higher numbers first)
  return handlers.sort((a, b) => b.metadata.priority - a.metadata.priority);
}