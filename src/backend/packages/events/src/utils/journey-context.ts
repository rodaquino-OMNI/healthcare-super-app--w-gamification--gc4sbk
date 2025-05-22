/**
 * @file Journey Context Utilities
 * @description Provides utilities for managing journey-specific context within events,
 * ensuring that events contain and preserve the necessary journey information throughout
 * the processing pipeline.
 */

import { z } from 'zod';

/**
 * Enum representing the available journey types in the AUSTA SuperApp.
 * These values are used to categorize events and provide proper routing
 * and processing based on the journey context.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan'
}

/**
 * Type guard to check if a string is a valid JourneyType
 * @param journey - The journey string to validate
 * @returns True if the journey is a valid JourneyType, false otherwise
 */
export function isValidJourney(journey: string): journey is JourneyType {
  return Object.values(JourneyType).includes(journey as JourneyType);
}

/**
 * Interface for journey context information that can be attached to events
 */
export interface IJourneyContext {
  /**
   * The journey type associated with this context
   */
  journey: JourneyType;
  
  /**
   * Optional journey-specific metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Zod schema for validating journey context
 */
export const journeyContextSchema = z.object({
  journey: z.nativeEnum(JourneyType),
  metadata: z.record(z.string(), z.unknown()).optional()
});

/**
 * Creates a journey context object for the specified journey type
 * @param journey - The journey type
 * @param metadata - Optional metadata specific to the journey
 * @returns A journey context object
 */
export function createJourneyContext(
  journey: JourneyType,
  metadata?: Record<string, unknown>
): IJourneyContext {
  return {
    journey,
    metadata
  };
}

/**
 * Creates a health journey context
 * @param metadata - Optional metadata specific to the health journey
 * @returns A journey context object for the health journey
 */
export function createHealthJourneyContext(
  metadata?: Record<string, unknown>
): IJourneyContext {
  return createJourneyContext(JourneyType.HEALTH, metadata);
}

/**
 * Creates a care journey context
 * @param metadata - Optional metadata specific to the care journey
 * @returns A journey context object for the care journey
 */
export function createCareJourneyContext(
  metadata?: Record<string, unknown>
): IJourneyContext {
  return createJourneyContext(JourneyType.CARE, metadata);
}

/**
 * Creates a plan journey context
 * @param metadata - Optional metadata specific to the plan journey
 * @returns A journey context object for the plan journey
 */
export function createPlanJourneyContext(
  metadata?: Record<string, unknown>
): IJourneyContext {
  return createJourneyContext(JourneyType.PLAN, metadata);
}

/**
 * Interface for objects that contain journey context
 */
export interface IHasJourneyContext {
  journey?: JourneyType | string;
  [key: string]: unknown;
}

/**
 * Extracts journey context from an event or other object that contains journey information
 * @param obj - The object to extract journey context from
 * @returns The journey context, or undefined if no valid journey context is found
 */
export function extractJourneyContext(obj: IHasJourneyContext): IJourneyContext | undefined {
  if (!obj.journey) {
    return undefined;
  }

  const journeyStr = obj.journey.toString().toLowerCase();
  
  if (!isValidJourney(journeyStr)) {
    return undefined;
  }

  return {
    journey: journeyStr as JourneyType,
    metadata: {}
  };
}

/**
 * Validates that an object contains valid journey context
 * @param obj - The object to validate
 * @returns True if the object contains valid journey context, false otherwise
 */
export function validateJourneyContext(obj: IHasJourneyContext): boolean {
  if (!obj.journey) {
    return false;
  }

  const journeyStr = obj.journey.toString().toLowerCase();
  return isValidJourney(journeyStr);
}

/**
 * Adds journey context to an event or other object
 * @param obj - The object to add journey context to
 * @param journeyContext - The journey context to add
 * @returns The object with journey context added
 */
export function addJourneyContext<T extends Record<string, unknown>>(
  obj: T,
  journeyContext: IJourneyContext
): T & IHasJourneyContext {
  return {
    ...obj,
    journey: journeyContext.journey,
    journeyMetadata: journeyContext.metadata || {}
  };
}

/**
 * Updates the journey context in an event or other object
 * @param obj - The object to update journey context in
 * @param journeyContext - The new journey context
 * @returns The object with updated journey context
 */
export function updateJourneyContext<T extends IHasJourneyContext>(
  obj: T,
  journeyContext: IJourneyContext
): T {
  return {
    ...obj,
    journey: journeyContext.journey,
    journeyMetadata: journeyContext.metadata || {}
  };
}

/**
 * Merges journey context from a source object into a target object
 * @param target - The target object to merge journey context into
 * @param source - The source object to extract journey context from
 * @returns The target object with merged journey context, or the original target if no valid journey context is found
 */
export function mergeJourneyContext<T extends Record<string, unknown>>(
  target: T,
  source: IHasJourneyContext
): T & IHasJourneyContext {
  const journeyContext = extractJourneyContext(source);
  if (!journeyContext) {
    return target as T & IHasJourneyContext;
  }

  return addJourneyContext(target, journeyContext);
}

/**
 * Determines if an event or object belongs to a specific journey
 * @param obj - The object to check
 * @param journeyType - The journey type to check for
 * @returns True if the object belongs to the specified journey, false otherwise
 */
export function isFromJourney(obj: IHasJourneyContext, journeyType: JourneyType): boolean {
  if (!obj.journey) {
    return false;
  }

  const journeyStr = obj.journey.toString().toLowerCase();
  return journeyStr === journeyType.toLowerCase();
}

/**
 * Determines if an event or object is from the health journey
 * @param obj - The object to check
 * @returns True if the object is from the health journey, false otherwise
 */
export function isFromHealthJourney(obj: IHasJourneyContext): boolean {
  return isFromJourney(obj, JourneyType.HEALTH);
}

/**
 * Determines if an event or object is from the care journey
 * @param obj - The object to check
 * @returns True if the object is from the care journey, false otherwise
 */
export function isFromCareJourney(obj: IHasJourneyContext): boolean {
  return isFromJourney(obj, JourneyType.CARE);
}

/**
 * Determines if an event or object is from the plan journey
 * @param obj - The object to check
 * @returns True if the object is from the plan journey, false otherwise
 */
export function isFromPlanJourney(obj: IHasJourneyContext): boolean {
  return isFromJourney(obj, JourneyType.PLAN);
}

/**
 * Routes an event or object to a handler based on its journey context
 * @param obj - The object to route
 * @param handlers - An object containing handlers for each journey type
 * @param defaultHandler - Optional default handler for objects without valid journey context
 * @returns The result of the appropriate handler
 */
export function routeByJourney<T extends IHasJourneyContext, R>(
  obj: T,
  handlers: {
    [JourneyType.HEALTH]?: (obj: T) => R;
    [JourneyType.CARE]?: (obj: T) => R;
    [JourneyType.PLAN]?: (obj: T) => R;
  },
  defaultHandler?: (obj: T) => R
): R | undefined {
  if (!obj.journey) {
    return defaultHandler ? defaultHandler(obj) : undefined;
  }

  const journeyStr = obj.journey.toString().toLowerCase();
  
  if (!isValidJourney(journeyStr)) {
    return defaultHandler ? defaultHandler(obj) : undefined;
  }

  const journey = journeyStr as JourneyType;
  const handler = handlers[journey];

  if (handler) {
    return handler(obj);
  }

  return defaultHandler ? defaultHandler(obj) : undefined;
}