import { SetMetadata } from '@nestjs/common';
import 'reflect-metadata';

// Import JourneyType from @austa/interfaces package
import { JourneyType } from '@austa/interfaces/gamification/events';

/**
 * Special journey type for components that apply to all journeys
 * This is used only within the decorator and not exposed to the rest of the application
 */
enum InternalJourneyType {
  ALL = 'all'
}

/**
 * Interface for journey decorator options
 */
export interface JourneyDecoratorOptions {
  /**
   * Priority for cross-journey event handling (higher numbers = higher priority)
   * Default is 0
   */
  priority?: number;
  
  /**
   * Whether this handler should be applied if no journey is specified in the event
   * Default is false
   */
  applyToUnspecified?: boolean;
}

/**
 * Metadata key for journey information
 */
export const JOURNEY_METADATA_KEY = 'gamification:journey';

/**
 * Interface for journey metadata stored by the decorator
 */
export interface JourneyMetadata {
  /**
   * The journey types this handler or component applies to
   */
  journeys: JourneyType[];
  
  /**
   * Priority for cross-journey event handling (higher numbers = higher priority)
   */
  priority: number;
  
  /**
   * Whether this handler should be applied if no journey is specified in the event
   */
  applyToUnspecified: boolean;
}

/**
 * Decorator that associates a class or method with specific journeys.
 * This controls which journeys a particular handler or component applies to,
 * enabling journey-specific gamification rules.
 * 
 * The decorator adds metadata that can be used by event handlers, achievement processors,
 * and other gamification components to filter their execution based on the journey
 * context of the current operation.
 * 
 * @param journeys - One or more journey types this handler applies to
 * @param options - Optional configuration options
 * 
 * @example
 * // Class decorator for a handler that only processes Health journey events
 * @GamificationJourney(JourneyType.HEALTH)
 * export class HealthAchievementsHandler {}
 * 
 * @example
 * // Method decorator for a handler that processes both Care and Plan events with high priority
 * @GamificationJourney([JourneyType.CARE, JourneyType.PLAN], { priority: 10 })
 * handleCareAndPlanEvents() {}
 * 
 * @example
 * // Handler that applies to all journeys
 * @GamificationJourney([JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN])
 * export class GlobalAchievementsHandler {}
 * 
 * @example
 * // Handler that applies to unspecified journey events (where journey is undefined)
 * @GamificationJourney(JourneyType.HEALTH, { applyToUnspecified: true })
 * export class FallbackHealthHandler {}
 */
export function GamificationJourney(
  journeys: JourneyType | JourneyType[],
  options: JourneyDecoratorOptions = {}
) {
  // Normalize input to array
  const journeyArray = Array.isArray(journeys) ? journeys : [journeys];
  
  // Handle special case: if InternalJourneyType.ALL is included, use all journey types
  const normalizedJourneys = journeyArray.includes(InternalJourneyType.ALL as unknown as JourneyType)
    ? [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN]
    : journeyArray;
  
  // Create metadata
  const metadata: JourneyMetadata = {
    journeys: normalizedJourneys,
    priority: options.priority ?? 0,
    applyToUnspecified: options.applyToUnspecified ?? false
  };
  
  return SetMetadata(JOURNEY_METADATA_KEY, metadata);
}

/**
 * Utility function to check if a handler applies to a specific journey.
 * 
 * @param metadata - The journey metadata from the handler
 * @param journey - The journey type to check
 * @returns True if the handler applies to the specified journey
 */
export function handlerAppliesToJourney(
  metadata: JourneyMetadata | undefined,
  journey: JourneyType | undefined
): boolean {
  // If no metadata, handler applies to all journeys
  if (!metadata) {
    return true;
  }
  
  // If no journey specified in the event
  if (!journey) {
    return metadata.applyToUnspecified;
  }
  
  // Check if the handler's journeys include the specified journey
  return metadata.journeys.includes(journey);
}

/**
 * Utility function to sort handlers by priority.
 * Handlers with higher priority come first.
 * 
 * @param metadataA - Metadata for the first handler
 * @param metadataB - Metadata for the second handler
 * @returns Comparison result for sorting
 */
export function sortHandlersByPriority(
  metadataA: JourneyMetadata | undefined,
  metadataB: JourneyMetadata | undefined
): number {
  const priorityA = metadataA?.priority ?? 0;
  const priorityB = metadataB?.priority ?? 0;
  
  // Sort in descending order (higher priority first)
  return priorityB - priorityA;
}

/**
 * Utility function to filter handlers by journey type.
 * 
 * @param handlers - Array of handlers with their metadata
 * @param journey - The journey type to filter by
 * @returns Filtered and priority-sorted array of handlers
 */
export function filterHandlersByJourney<T>(
  handlers: Array<{ handler: T; metadata: JourneyMetadata | undefined }>,
  journey: JourneyType | undefined
): T[] {
  return handlers
    .filter(({ metadata }) => handlerAppliesToJourney(metadata, journey))
    .sort((a, b) => sortHandlersByPriority(a.metadata, b.metadata))
    .map(({ handler }) => handler);
}

/**
 * Utility function to get journey metadata from a class or method.
 * 
 * @param target - The class or method to get metadata from
 * @returns The journey metadata, or undefined if none exists
 */
export function getJourneyMetadata(target: any): JourneyMetadata | undefined {
  const metadata = Reflect.getMetadata(JOURNEY_METADATA_KEY, target);
  return metadata as JourneyMetadata | undefined;
}

/**
 * Utility function to check if a target has journey metadata.
 * 
 * @param target - The class or method to check
 * @returns True if the target has journey metadata
 */
export function hasJourneyMetadata(target: any): boolean {
  return Reflect.hasMetadata(JOURNEY_METADATA_KEY, target);
}