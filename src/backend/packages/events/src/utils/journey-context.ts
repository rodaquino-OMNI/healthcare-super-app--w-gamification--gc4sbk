/**
 * Journey Context Utilities
 * 
 * This module provides utilities for managing journey-specific context within events.
 * It ensures that events contain and preserve the necessary journey information for proper
 * routing and processing based on the journey (health, care, plan).
 * 
 * @packageDocumentation
 */

import { Events } from '@austa/interfaces/gamification';

/**
 * Enum representing the valid journey types in the AUSTA SuperApp.
 */
export enum JourneyType {
  /** Health journey ("Minha Saúde") */
  HEALTH = 'health',
  /** Care journey ("Cuidar-me Agora") */
  CARE = 'care',
  /** Plan journey ("Meu Plano & Benefícios") */
  PLAN = 'plan'
}

/**
 * Type guard to check if a string is a valid JourneyType.
 * 
 * @param journey - The journey string to validate
 * @returns True if the journey is a valid JourneyType, false otherwise
 */
export function isValidJourney(journey: string): journey is JourneyType {
  return Object.values(JourneyType).includes(journey as JourneyType);
}

/**
 * Interface for journey context information.
 */
export interface JourneyContext {
  /** The journey type (health, care, plan) */
  journey: JourneyType;
  /** Optional additional journey-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Error thrown when journey context validation fails.
 */
export class JourneyContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JourneyContextError';
  }
}

/**
 * Creates a journey context object for the specified journey type.
 * 
 * @param journey - The journey type
 * @param metadata - Optional additional journey-specific metadata
 * @returns A journey context object
 * @throws {JourneyContextError} If the journey type is invalid
 */
export function createJourneyContext(journey: string, metadata?: Record<string, unknown>): JourneyContext {
  if (!isValidJourney(journey)) {
    throw new JourneyContextError(`Invalid journey type: ${journey}. Expected one of: ${Object.values(JourneyType).join(', ')}`);
  }
  
  return {
    journey,
    metadata
  };
}

/**
 * Validates that an event contains valid journey context information.
 * 
 * @param event - The event to validate
 * @returns True if the event has valid journey context, false otherwise
 */
export function validateJourneyContext(event: Events.BaseEvent | Events.ProcessEventDto): boolean {
  if (!event.journey) {
    return false;
  }
  
  return isValidJourney(event.journey);
}

/**
 * Extracts journey context from an event.
 * 
 * @param event - The event to extract journey context from
 * @returns The journey context or null if not present/valid
 */
export function extractJourneyContext(event: Events.BaseEvent | Events.ProcessEventDto): JourneyContext | null {
  if (!validateJourneyContext(event)) {
    return null;
  }
  
  return {
    journey: event.journey as JourneyType,
    metadata: {}
  };
}

/**
 * Adds journey context to an event if not already present.
 * 
 * @param event - The event to add journey context to
 * @param journey - The journey type to add
 * @param metadata - Optional additional journey-specific metadata
 * @returns The event with journey context added
 * @throws {JourneyContextError} If the journey type is invalid
 */
export function addJourneyContext<T extends Events.BaseEvent | Events.ProcessEventDto>(
  event: T,
  journey: string,
  metadata?: Record<string, unknown>
): T {
  if (!isValidJourney(journey)) {
    throw new JourneyContextError(`Invalid journey type: ${journey}. Expected one of: ${Object.values(JourneyType).join(', ')}`);
  }
  
  return {
    ...event,
    journey
  };
}

/**
 * Checks if an event belongs to a specific journey.
 * 
 * @param event - The event to check
 * @param journey - The journey type to check against
 * @returns True if the event belongs to the specified journey, false otherwise
 */
export function isJourneyEvent(event: Events.BaseEvent | Events.ProcessEventDto, journey: JourneyType): boolean {
  return event.journey === journey;
}

/**
 * Checks if an event is a health journey event.
 * 
 * @param event - The event to check
 * @returns True if the event is a health journey event, false otherwise
 */
export function isHealthJourneyEvent(event: Events.BaseEvent | Events.ProcessEventDto): boolean {
  return isJourneyEvent(event, JourneyType.HEALTH);
}

/**
 * Checks if an event is a care journey event.
 * 
 * @param event - The event to check
 * @returns True if the event is a care journey event, false otherwise
 */
export function isCareJourneyEvent(event: Events.BaseEvent | Events.ProcessEventDto): boolean {
  return isJourneyEvent(event, JourneyType.CARE);
}

/**
 * Checks if an event is a plan journey event.
 * 
 * @param event - The event to check
 * @returns True if the event is a plan journey event, false otherwise
 */
export function isPlanJourneyEvent(event: Events.BaseEvent | Events.ProcessEventDto): boolean {
  return isJourneyEvent(event, JourneyType.PLAN);
}

/**
 * Creates a health journey event context.
 * 
 * @param metadata - Optional additional health journey-specific metadata
 * @returns A health journey context object
 */
export function createHealthJourneyContext(metadata?: Record<string, unknown>): JourneyContext {
  return createJourneyContext(JourneyType.HEALTH, metadata);
}

/**
 * Creates a care journey event context.
 * 
 * @param metadata - Optional additional care journey-specific metadata
 * @returns A care journey context object
 */
export function createCareJourneyContext(metadata?: Record<string, unknown>): JourneyContext {
  return createJourneyContext(JourneyType.CARE, metadata);
}

/**
 * Creates a plan journey event context.
 * 
 * @param metadata - Optional additional plan journey-specific metadata
 * @returns A plan journey context object
 */
export function createPlanJourneyContext(metadata?: Record<string, unknown>): JourneyContext {
  return createJourneyContext(JourneyType.PLAN, metadata);
}

/**
 * Ensures an event has journey context, adding a default if not present.
 * 
 * @param event - The event to ensure has journey context
 * @param defaultJourney - The default journey to use if none is present
 * @returns The event with journey context guaranteed
 * @throws {JourneyContextError} If the default journey type is invalid
 */
export function ensureJourneyContext<T extends Events.BaseEvent | Events.ProcessEventDto>(
  event: T,
  defaultJourney: JourneyType = JourneyType.HEALTH
): T {
  if (!event.journey) {
    return addJourneyContext(event, defaultJourney);
  }
  
  if (!isValidJourney(event.journey)) {
    return addJourneyContext(event, defaultJourney);
  }
  
  return event;
}

/**
 * Maps an event to a journey-specific handler based on its journey context.
 * 
 * @param event - The event to route
 * @param handlers - Object containing journey-specific handler functions
 * @param defaultHandler - Optional default handler for events without valid journey context
 * @returns The result of the appropriate handler function
 */
export function routeEventByJourney<T extends Events.BaseEvent | Events.ProcessEventDto, R>(
  event: T,
  handlers: {
    [JourneyType.HEALTH]?: (event: T) => R;
    [JourneyType.CARE]?: (event: T) => R;
    [JourneyType.PLAN]?: (event: T) => R;
  },
  defaultHandler?: (event: T) => R
): R | undefined {
  if (!event.journey || !isValidJourney(event.journey)) {
    return defaultHandler?.(event);
  }
  
  const journey = event.journey as JourneyType;
  const handler = handlers[journey];
  
  if (handler) {
    return handler(event);
  }
  
  return defaultHandler?.(event);
}

/**
 * Creates a cross-journey event by combining context from multiple journeys.
 * 
 * @param event - The base event to add cross-journey context to
 * @param journeys - Array of journey types to include in the context
 * @returns The event with cross-journey context metadata
 */
export function createCrossJourneyEvent<T extends Events.BaseEvent | Events.ProcessEventDto>(
  event: T,
  journeys: JourneyType[]
): T {
  // Validate all journeys
  for (const journey of journeys) {
    if (!isValidJourney(journey)) {
      throw new JourneyContextError(`Invalid journey type: ${journey}. Expected one of: ${Object.values(JourneyType).join(', ')}`);
    }
  }
  
  // Use the first journey as the primary journey context
  const primaryJourney = journeys[0] || JourneyType.HEALTH;
  
  // Add all journeys to the metadata
  return {
    ...event,
    journey: primaryJourney,
    data: {
      ...event.data,
      crossJourneyContext: {
        journeys,
        isPrimaryJourney: true
      }
    }
  };
}

/**
 * Checks if an event is a cross-journey event.
 * 
 * @param event - The event to check
 * @returns True if the event is a cross-journey event, false otherwise
 */
export function isCrossJourneyEvent(event: Events.BaseEvent | Events.ProcessEventDto): boolean {
  if (!event.data) {
    return false;
  }
  
  const data = event.data as Record<string, any>;
  return !!data.crossJourneyContext && Array.isArray(data.crossJourneyContext.journeys);
}

/**
 * Gets all journeys associated with a cross-journey event.
 * 
 * @param event - The event to extract journeys from
 * @returns Array of journey types or null if not a cross-journey event
 */
export function getCrossJourneyContexts(event: Events.BaseEvent | Events.ProcessEventDto): JourneyType[] | null {
  if (!isCrossJourneyEvent(event)) {
    return null;
  }
  
  const data = event.data as Record<string, any>;
  return data.crossJourneyContext.journeys.filter(isValidJourney);
}