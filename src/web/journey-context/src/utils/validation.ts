/**
 * Validation utilities for journey data
 * 
 * This module provides utility functions for validating journey IDs and objects,
 * ensuring that only valid journey data is used throughout the application.
 * It includes type guards for JourneyId and Journey objects, along with functions
 * that return valid journey data or defaults when invalid data is encountered.
 */

import { ALL_JOURNEYS, JOURNEY_IDS } from '../constants/journeys';
import { Journey, JourneyId } from '../types/journey.types';

/**
 * Checks if a value is a valid JourneyId
 * 
 * @param value - The value to check
 * @returns True if the value is a valid JourneyId, false otherwise
 */
export function isValidJourneyId(value: unknown): value is JourneyId {
  if (typeof value !== 'string') {
    return false;
  }
  
  return Object.values(JOURNEY_IDS).includes(value as JourneyId);
}

/**
 * Checks if a value is a valid Journey object
 * 
 * @param value - The value to check
 * @returns True if the value is a valid Journey object, false otherwise
 */
export function isValidJourney(value: unknown): value is Journey {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  const journey = value as Partial<Journey>;
  
  // Check if the journey has all required properties
  if (!journey.id || typeof journey.id !== 'string') {
    return false;
  }
  
  if (!journey.name || typeof journey.name !== 'string') {
    return false;
  }
  
  // Verify that the journey ID is valid
  return isValidJourneyId(journey.id);
}

/**
 * Returns a valid journey ID or a default if the provided ID is invalid
 * 
 * @param journeyId - The journey ID to validate
 * @param defaultJourneyId - Optional default journey ID to use if the provided ID is invalid
 * @returns A valid journey ID
 */
export function getValidJourneyId(journeyId: unknown, defaultJourneyId: JourneyId = JOURNEY_IDS.HEALTH): JourneyId {
  if (isValidJourneyId(journeyId)) {
    return journeyId;
  }
  
  return defaultJourneyId;
}

/**
 * Returns a valid Journey object or a default if the provided journey is invalid
 * 
 * @param journey - The journey object to validate
 * @param defaultJourneyId - Optional default journey ID to use if the provided journey is invalid
 * @returns A valid Journey object
 */
export function getValidJourney(journey: unknown, defaultJourneyId: JourneyId = JOURNEY_IDS.HEALTH): Journey {
  if (isValidJourney(journey)) {
    return journey;
  }
  
  // Find the default journey in ALL_JOURNEYS
  const defaultJourney = ALL_JOURNEYS.find(j => j.id === defaultJourneyId) || ALL_JOURNEYS[0];
  return defaultJourney;
}

/**
 * Returns a Journey object for the given journey ID
 * 
 * @param journeyId - The journey ID to find
 * @param defaultJourneyId - Optional default journey ID to use if the provided ID is invalid
 * @returns The Journey object for the given ID, or a default Journey if not found
 */
export function getJourneyById(journeyId: unknown, defaultJourneyId: JourneyId = JOURNEY_IDS.HEALTH): Journey {
  const validJourneyId = getValidJourneyId(journeyId, defaultJourneyId);
  const journey = ALL_JOURNEYS.find(j => j.id === validJourneyId);
  
  if (journey) {
    return journey;
  }
  
  // This should never happen if ALL_JOURNEYS is properly configured,
  // but we provide a fallback just in case
  return ALL_JOURNEYS.find(j => j.id === defaultJourneyId) || ALL_JOURNEYS[0];
}

/**
 * Checks if a journey ID belongs to a specific journey
 * 
 * @param journeyId - The journey ID to check
 * @param targetJourneyId - The target journey ID to compare against
 * @returns True if the journey ID matches the target, false otherwise
 */
export function isJourney(journeyId: unknown, targetJourneyId: JourneyId): boolean {
  return getValidJourneyId(journeyId) === targetJourneyId;
}

/**
 * Checks if a journey ID is for the Health journey
 * 
 * @param journeyId - The journey ID to check
 * @returns True if the journey ID is for the Health journey, false otherwise
 */
export function isHealthJourney(journeyId: unknown): boolean {
  return isJourney(journeyId, JOURNEY_IDS.HEALTH);
}

/**
 * Checks if a journey ID is for the Care journey
 * 
 * @param journeyId - The journey ID to check
 * @returns True if the journey ID is for the Care journey, false otherwise
 */
export function isCareJourney(journeyId: unknown): boolean {
  return isJourney(journeyId, JOURNEY_IDS.CARE);
}

/**
 * Checks if a journey ID is for the Plan journey
 * 
 * @param journeyId - The journey ID to check
 * @returns True if the journey ID is for the Plan journey, false otherwise
 */
export function isPlanJourney(journeyId: unknown): boolean {
  return isJourney(journeyId, JOURNEY_IDS.PLAN);
}