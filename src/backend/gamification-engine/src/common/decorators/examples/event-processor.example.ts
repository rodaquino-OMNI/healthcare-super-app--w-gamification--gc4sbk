/**
 * @file event-processor.example.ts
 * @description Example of how to use the GamificationJourney decorator in an event processor
 * This is not part of the actual codebase, just an example for documentation purposes
 */

import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { filterAndSortHandlers, getJourneyMetadata } from '../gamification-journey.decorator';
import { GamificationEvent } from '../../../events/interfaces/event.interface';

/**
 * Interface for event handlers
 */
interface EventHandler {
  processEvent(event: GamificationEvent): Promise<void>;
}

/**
 * Example event processor that uses the GamificationJourney decorator
 * to route events to the appropriate handlers based on journey
 */
@Injectable()
export class EventProcessor {
  private handlers: EventHandler[] = [];

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Register all handlers from the provided handler classes
   * @param handlerClasses Array of handler class types
   */
  registerHandlers(handlerClasses: Type<EventHandler>[]) {
    for (const handlerClass of handlerClasses) {
      const handler = this.moduleRef.get(handlerClass, { strict: false });
      if (handler) {
        this.handlers.push(handler);
      }
    }
  }

  /**
   * Process an event by routing it to the appropriate handlers
   * based on the event's journey and handler metadata
   * @param event The event to process
   */
  async processEvent(event: GamificationEvent): Promise<void> {
    // Filter and sort handlers based on the event's journey
    const applicableHandlers = filterAndSortHandlers(this.handlers, event.journey);

    // Process the event with each applicable handler in priority order
    for (const handler of applicableHandlers) {
      try {
        await handler.processEvent(event);
      } catch (error) {
        console.error(`Error processing event with handler ${handler.constructor.name}:`, error);
        // In a real implementation, we would have proper error handling and retry logic
      }
    }
  }

  /**
   * Process an event by routing it to specific methods on handlers
   * based on the event's journey and method metadata
   * @param event The event to process
   */
  async processEventWithMethods(event: GamificationEvent): Promise<void> {
    for (const handler of this.handlers) {
      // Get all methods on the handler
      const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(handler))
        .filter(name => name !== 'constructor' && typeof handler[name] === 'function');

      // Filter and sort methods based on the event's journey
      const methods = methodNames.map(name => handler[name].bind(handler));
      const applicableMethods = filterAndSortHandlers(methods, event.journey);

      // Call each applicable method in priority order
      for (const method of applicableMethods) {
        try {
          await method(event);
        } catch (error) {
          console.error(`Error processing event with method ${method.name}:`, error);
          // In a real implementation, we would have proper error handling and retry logic
        }
      }
    }
  }
}