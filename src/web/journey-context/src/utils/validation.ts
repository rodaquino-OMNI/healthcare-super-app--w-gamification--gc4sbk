/**
 * Utility functions for validating journey IDs and objects
 * Ensures that only valid journey data is used throughout the application
 */

import { JourneyId, Journey } from '../types/journey.types';
import { ALL_JOURNEYS, JOURNEY_IDS } from '../constants/journeys';
import { DEFAULT_JOURNEY_ID } from '../constants/defaults';

/**
 * Type guard to check if a string is a valid JourneyId
 * @param id - The string to check
 * @returns True if the string is a valid JourneyId, false otherwise
 */
export function isValidJourneyId(id: string | null | undefined): id is JourneyId {
  if (!id) return false;
  
  // Check if the id exists in the JOURNEY_IDS object values
  return Object.values(JOURNEY_IDS).includes(id as JourneyId);
}

/**
 * Type guard to check if an object is a valid Journey
 * @param journey - The object to check
 * @returns True if the object is a valid Journey, false otherwise
 */
export function isJourney(journey: any): journey is Journey {
  if (!journey || typeof journey !== 'object') return false;
  
  // Check if the object has the required Journey properties
  return (
    typeof journey.id === 'string' &&
    isValidJourneyId(journey.id) &&
    typeof journey.name === 'string' &&
    typeof journey.color === 'string'
  );
}

/**
 * Returns a valid JourneyId or the default if invalid
 * @param id - The journey ID to validate
 * @param defaultId - Optional custom default ID to use if invalid (uses DEFAULT_JOURNEY_ID if not provided)
 * @returns A valid JourneyId
 */
export function getValidJourneyId(id: string | null | undefined, defaultId?: JourneyId): JourneyId {
  // If the provided ID is valid, return it
  if (isValidJourneyId(id)) {
    return id;
  }
  
  // Otherwise return the provided default or the system default
  return defaultId || DEFAULT_JOURNEY_ID;
}

/**
 * Returns a valid Journey object or the default if invalid
 * @param journey - The journey object to validate
 * @param defaultJourneyId - Optional custom default journey ID to use if invalid
 * @returns A valid Journey object
 */
export function getValidJourney(journey: any, defaultJourneyId?: JourneyId): Journey {
  // If the provided journey is valid, return it
  if (isJourney(journey)) {
    return journey;
  }
  
  // Get a valid journey ID (either from the journey object if it has an id property,
  // or use the provided default, or fall back to the system default)
  const journeyId = getValidJourneyId(
    journey && typeof journey === 'object' ? journey.id : undefined,
    defaultJourneyId
  );
  
  // Find the journey with the valid ID
  const validJourney = ALL_JOURNEYS.find(j => j.id === journeyId);
  
  // This should never happen if ALL_JOURNEYS is properly configured,
  // but as a safeguard, return the first journey if the ID isn't found
  return validJourney || ALL_JOURNEYS[0];
}

/**
 * Validates a journey selection and returns appropriate values
 * @param journeyId - The journey ID to validate
 * @param currentJourneyId - The current journey ID (used as fallback)
 * @returns An object containing the validated journey ID and journey object
 */
export function validateJourneySelection(
  journeyId: string | null | undefined,
  currentJourneyId?: JourneyId
): { journeyId: JourneyId; journey: Journey } {
  // Get a valid journey ID, using the current journey as fallback
  const validJourneyId = getValidJourneyId(journeyId, currentJourneyId);
  
  // Find the journey object for this ID
  const journey = ALL_JOURNEYS.find(j => j.id === validJourneyId) || ALL_JOURNEYS[0];
  
  return { journeyId: validJourneyId, journey };
}

/**
 * Checks if a journey ID matches the current journey
 * @param journeyId - The journey ID to check
 * @param currentJourneyId - The current journey ID
 * @returns True if the journey IDs match, false otherwise
 */
export function isCurrentJourney(journeyId: string | null | undefined, currentJourneyId: JourneyId): boolean {
  if (!journeyId) return false;
  return journeyId === currentJourneyId;
}

/**
 * Checks if a journey object matches the current journey
 * @param journey - The journey object to check
 * @param currentJourneyId - The current journey ID
 * @returns True if the journey matches the current journey, false otherwise
 */
export function isCurrentJourneyObject(journey: any, currentJourneyId: JourneyId): boolean {
  if (!isJourney(journey)) return false;
  return journey.id === currentJourneyId;
}