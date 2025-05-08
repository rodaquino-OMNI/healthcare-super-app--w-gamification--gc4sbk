/**
 * @file journey.ts
 * @description Defines constants for the three user journeys (Health, Care, Plan) throughout the gamification engine.
 * These journey identifiers are used to categorize events, achievements, and rules, ensuring consistent
 * journey reference across all modules.
 *
 * This file implements the following requirements from the technical specification:
 * - System must maintain the three distinct user journeys ('Minha Saúde', 'Cuidar-me Agora', and 'Meu Plano & Benefícios')
 * - Gamification engine must process events from all journeys to drive user engagement
 * - Journey identifiers must be consistent across the entire application
 */

import { JourneyType } from '@austa/interfaces/common';

/**
 * Enum representing the three user journeys in the AUSTA SuperApp.
 * Used for type-safe journey identification throughout the gamification engine.
 */
export enum Journey {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * String constants for journey identifiers.
 * These match the values in the Journey enum but are provided as constants
 * for use in non-TypeScript contexts (e.g., database queries, JSON).
 */
export const JOURNEY_HEALTH = Journey.HEALTH;
export const JOURNEY_CARE = Journey.CARE;
export const JOURNEY_PLAN = Journey.PLAN;

/**
 * Array of all journey identifiers.
 * Useful for iteration and validation.
 */
export const ALL_JOURNEYS = Object.values(Journey);

/**
 * Interface for journey display names in different languages.
 */
export interface JourneyDisplayNames {
  en: string;
  pt: string;
}

/**
 * Display names for each journey in English and Portuguese.
 * Used for UI presentation.
 */
export const JOURNEY_DISPLAY_NAMES: Record<Journey, JourneyDisplayNames> = {
  [Journey.HEALTH]: {
    en: 'My Health',
    pt: 'Minha Saúde',
  },
  [Journey.CARE]: {
    en: 'Care Now',
    pt: 'Cuidar-me Agora',
  },
  [Journey.PLAN]: {
    en: 'My Plan & Benefits',
    pt: 'Meu Plano & Benefícios',
  },
};

/**
 * Journey color codes for UI theming.
 * These colors match the journey-specific themes defined in the design system.
 */
export const JOURNEY_COLORS: Record<Journey, string> = {
  [Journey.HEALTH]: '#34C759', // Green
  [Journey.CARE]: '#FF9500',   // Orange
  [Journey.PLAN]: '#007AFF',   // Blue
};

/**
 * Type guard to check if a string is a valid journey identifier.
 * @param journey The string to check
 * @returns True if the string is a valid journey identifier
 */
export function isValidJourney(journey: string): journey is Journey {
  return Object.values(Journey).includes(journey as Journey);
}

/**
 * Gets the display name for a journey in the specified language.
 * @param journey The journey identifier
 * @param language The language code ('en' or 'pt')
 * @returns The display name in the specified language
 */
export function getJourneyDisplayName(journey: Journey, language: 'en' | 'pt' = 'en'): string {
  if (!isValidJourney(journey)) {
    throw new Error(`Invalid journey: ${journey}`);
  }
  return JOURNEY_DISPLAY_NAMES[journey][language];
}

/**
 * Gets the color code for a journey.
 * @param journey The journey identifier
 * @returns The color code for the journey
 */
export function getJourneyColor(journey: Journey): string {
  if (!isValidJourney(journey)) {
    throw new Error(`Invalid journey: ${journey}`);
  }
  return JOURNEY_COLORS[journey];
}

/**
 * Converts a JourneyType from @austa/interfaces to a Journey enum value.
 * This ensures compatibility between the shared interfaces package and the gamification engine.
 * @param journeyType The JourneyType from @austa/interfaces
 * @returns The corresponding Journey enum value
 */
export function fromJourneyType(journeyType: JourneyType): Journey {
  switch (journeyType) {
    case 'health':
      return Journey.HEALTH;
    case 'care':
      return Journey.CARE;
    case 'plan':
      return Journey.PLAN;
    default:
      throw new Error(`Invalid journey type: ${journeyType}`);
  }
}

/**
 * Converts a Journey enum value to a JourneyType from @austa/interfaces.
 * This ensures compatibility between the gamification engine and the shared interfaces package.
 * @param journey The Journey enum value
 * @returns The corresponding JourneyType
 */
export function toJourneyType(journey: Journey): JourneyType {
  return journey as unknown as JourneyType;
}