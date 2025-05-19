/**
 * @file Journey Constants
 * @description Defines the core journey constants for the AUSTA SuperApp.
 * 
 * This file provides the fundamental journey definitions used throughout the application
 * for navigation, state management, and UI rendering. It includes journey IDs, localized
 * display names, and a comprehensive ALL_JOURNEYS array that combines all journey metadata.
 * 
 * The constants defined here are used by both web and mobile platforms to ensure consistency
 * across the entire application.
 */

/**
 * Journey IDs
 * 
 * These constants define the unique identifiers for each journey in the application.
 * They are used for routing, state management, and identifying journey-specific components.
 */
export const JOURNEY_IDS = {
  /** Health journey ID - used for health monitoring and wellness tracking */
  HEALTH: 'health',
  /** Care journey ID - used for healthcare access and appointment management */
  CARE: 'care',
  /** Plan journey ID - used for insurance management and claims */
  PLAN: 'plan',
} as const;

/**
 * Journey ID Type
 * 
 * A type representing the valid journey IDs in the application.
 * This ensures type safety when referencing journey IDs.
 */
export type JourneyId = typeof JOURNEY_IDS[keyof typeof JOURNEY_IDS];

/**
 * Journey Display Names
 * 
 * Localized display names for each journey in Portuguese.
 * These are used for UI rendering and user-facing text.
 */
export const JOURNEY_DISPLAY_NAMES = {
  /** Health journey display name in Portuguese */
  [JOURNEY_IDS.HEALTH]: 'Minha Saúde',
  /** Care journey display name in Portuguese */
  [JOURNEY_IDS.CARE]: 'Cuidar-me Agora',
  /** Plan journey display name in Portuguese */
  [JOURNEY_IDS.PLAN]: 'Meu Plano & Benefícios',
} as const;

/**
 * Journey Interface
 * 
 * Defines the structure of a journey object with all its metadata.
 * This interface ensures consistency in journey definitions.
 */
export interface Journey {
  /** Unique identifier for the journey */
  id: JourneyId;
  /** Localized display name for the journey */
  displayName: string;
  /** Optional path for routing (used in web application) */
  path?: string;
  /** Optional icon name for the journey (used in navigation) */
  icon?: string;
  /** Optional color theme key for the journey */
  themeKey?: string;
}

/**
 * All Journeys
 * 
 * A comprehensive array of all journeys in the application with their metadata.
 * This is the primary export used by components to access journey information.
 */
export const ALL_JOURNEYS: Journey[] = [
  {
    id: JOURNEY_IDS.HEALTH,
    displayName: JOURNEY_DISPLAY_NAMES[JOURNEY_IDS.HEALTH],
    path: '/health',
    icon: 'health',
    themeKey: 'health',
  },
  {
    id: JOURNEY_IDS.CARE,
    displayName: JOURNEY_DISPLAY_NAMES[JOURNEY_IDS.CARE],
    path: '/care',
    icon: 'care',
    themeKey: 'care',
  },
  {
    id: JOURNEY_IDS.PLAN,
    displayName: JOURNEY_DISPLAY_NAMES[JOURNEY_IDS.PLAN],
    path: '/plan',
    icon: 'plan',
    themeKey: 'plan',
  },
];

/**
 * Get Journey By ID
 * 
 * Helper function to retrieve a journey object by its ID.
 * Returns undefined if the journey ID is not found.
 * 
 * @param id - The journey ID to look up
 * @returns The journey object or undefined if not found
 */
export function getJourneyById(id: JourneyId): Journey | undefined {
  return ALL_JOURNEYS.find(journey => journey.id === id);
}

/**
 * Default Journey
 * 
 * The default journey to use when no journey is specified.
 * This is used as a fallback in context providers and navigation.
 */
export const DEFAULT_JOURNEY = ALL_JOURNEYS[0];