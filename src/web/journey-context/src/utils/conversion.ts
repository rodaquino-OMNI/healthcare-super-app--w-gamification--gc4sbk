/**
 * Utility functions for converting between different journey data formats
 * 
 * These utilities ensure consistent access to journey data across the application,
 * regardless of the format in which journey information is initially provided.
 */

import { Journey, JourneyId } from '../types/journey.types';
import { ALL_JOURNEYS } from '../constants/journeys';

/**
 * Converts a journey ID to a full Journey object
 * 
 * @param journeyId - The ID of the journey to convert
 * @returns The full Journey object or undefined if not found
 */
export function journeyIdToJourney(journeyId: JourneyId | string | null | undefined): Journey | undefined {
  if (!journeyId) return undefined;
  return ALL_JOURNEYS.find(journey => journey.id === journeyId);
}

/**
 * Converts a Journey object to its ID
 * 
 * @param journey - The Journey object to extract the ID from
 * @returns The journey ID or undefined if the journey is invalid
 */
export function journeyToJourneyId(journey: Journey | null | undefined): JourneyId | undefined {
  if (!journey || !journey.id) return undefined;
  return journey.id as JourneyId;
}

/**
 * Gets the color associated with a journey
 * 
 * @param journeyIdOrObject - Either a journey ID or a Journey object
 * @returns The color associated with the journey or undefined if not found
 */
export function getJourneyColor(journeyIdOrObject: JourneyId | Journey | string | null | undefined): string | undefined {
  if (!journeyIdOrObject) return undefined;
  
  // If it's a Journey object, extract the color directly
  if (typeof journeyIdOrObject === 'object' && journeyIdOrObject.color) {
    return journeyIdOrObject.color;
  }
  
  // Otherwise, treat it as an ID and look up the Journey
  const journey = journeyIdToJourney(journeyIdOrObject as string);
  return journey?.color;
}

/**
 * Gets the display name associated with a journey
 * 
 * @param journeyIdOrObject - Either a journey ID or a Journey object
 * @returns The display name associated with the journey or undefined if not found
 */
export function getJourneyName(journeyIdOrObject: JourneyId | Journey | string | null | undefined): string | undefined {
  if (!journeyIdOrObject) return undefined;
  
  // If it's a Journey object, extract the name directly
  if (typeof journeyIdOrObject === 'object' && journeyIdOrObject.name) {
    return journeyIdOrObject.name;
  }
  
  // Otherwise, treat it as an ID and look up the Journey
  const journey = journeyIdToJourney(journeyIdOrObject as string);
  return journey?.name;
}

/**
 * Gets the route path associated with a journey
 * 
 * @param journeyIdOrObject - Either a journey ID or a Journey object
 * @returns The route path associated with the journey or undefined if not found
 */
export function getJourneyRoute(journeyIdOrObject: JourneyId | Journey | string | null | undefined): string | undefined {
  if (!journeyIdOrObject) return undefined;
  
  // If it's a Journey object, extract the route directly
  if (typeof journeyIdOrObject === 'object' && journeyIdOrObject.route) {
    return journeyIdOrObject.route;
  }
  
  // Otherwise, treat it as an ID and look up the Journey
  const journey = journeyIdToJourney(journeyIdOrObject as string);
  return journey?.route;
}

/**
 * Gets the icon associated with a journey
 * 
 * @param journeyIdOrObject - Either a journey ID or a Journey object
 * @returns The icon associated with the journey or undefined if not found
 */
export function getJourneyIcon(journeyIdOrObject: JourneyId | Journey | string | null | undefined): string | undefined {
  if (!journeyIdOrObject) return undefined;
  
  // If it's a Journey object, extract the icon directly
  if (typeof journeyIdOrObject === 'object' && journeyIdOrObject.icon) {
    return journeyIdOrObject.icon;
  }
  
  // Otherwise, treat it as an ID and look up the Journey
  const journey = journeyIdToJourney(journeyIdOrObject as string);
  return journey?.icon;
}

/**
 * Converts a web journey context format to a mobile journey context format
 * 
 * @param currentJourney - The current journey ID from web context
 * @returns The journey ID in mobile format
 */
export function webToMobileJourneyFormat(currentJourney: string | null | undefined): JourneyId | undefined {
  if (!currentJourney) return undefined;
  const journey = journeyIdToJourney(currentJourney);
  return journey?.id as JourneyId | undefined;
}

/**
 * Converts a mobile journey context format to a web journey context format
 * 
 * @param journey - The journey ID from mobile context
 * @returns The journey ID in web format
 */
export function mobileToWebJourneyFormat(journey: JourneyId | null | undefined): string | undefined {
  if (!journey) return undefined;
  return journey;
}

/**
 * Extracts a journey ID from various possible journey representations
 * 
 * @param journeyInput - A journey ID, Journey object, or any object with an id property
 * @returns The extracted journey ID or undefined if not found
 */
export function extractJourneyId(journeyInput: JourneyId | Journey | { id: string } | string | null | undefined): JourneyId | undefined {
  if (!journeyInput) return undefined;
  
  // If it's a string, assume it's already a journey ID
  if (typeof journeyInput === 'string') {
    return journeyInput as JourneyId;
  }
  
  // If it's an object with an id property, extract the id
  if (typeof journeyInput === 'object' && 'id' in journeyInput) {
    return journeyInput.id as JourneyId;
  }
  
  return undefined;
}

/**
 * Checks if a journey has a specific attribute
 * 
 * @param journeyIdOrObject - Either a journey ID or a Journey object
 * @param attributeName - The name of the attribute to check
 * @returns True if the journey has the attribute, false otherwise
 */
export function hasJourneyAttribute(journeyIdOrObject: JourneyId | Journey | string | null | undefined, attributeName: keyof Journey): boolean {
  if (!journeyIdOrObject) return false;
  
  // If it's a Journey object, check the attribute directly
  if (typeof journeyIdOrObject === 'object') {
    return attributeName in journeyIdOrObject && journeyIdOrObject[attributeName] !== undefined;
  }
  
  // Otherwise, treat it as an ID and look up the Journey
  const journey = journeyIdToJourney(journeyIdOrObject as string);
  return journey !== undefined && attributeName in journey && journey[attributeName] !== undefined;
}

/**
 * Gets any attribute from a journey by name
 * 
 * @param journeyIdOrObject - Either a journey ID or a Journey object
 * @param attributeName - The name of the attribute to retrieve
 * @returns The value of the attribute or undefined if not found
 */
export function getJourneyAttribute<K extends keyof Journey>(journeyIdOrObject: JourneyId | Journey | string | null | undefined, attributeName: K): Journey[K] | undefined {
  if (!journeyIdOrObject) return undefined;
  
  // If it's a Journey object, extract the attribute directly
  if (typeof journeyIdOrObject === 'object' && attributeName in journeyIdOrObject) {
    return journeyIdOrObject[attributeName];
  }
  
  // Otherwise, treat it as an ID and look up the Journey
  const journey = journeyIdToJourney(journeyIdOrObject as string);
  return journey?.[attributeName];
}