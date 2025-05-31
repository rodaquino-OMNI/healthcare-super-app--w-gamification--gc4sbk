/**
 * Journey Constants
 * 
 * This file defines the core journey constants for the AUSTA SuperApp, including
 * journey IDs, localized display names, and journey configuration interfaces.
 * 
 * The three distinct user journeys are:
 * - Health Journey ("Minha Saúde")
 * - Care Journey ("Cuidar-me Agora")
 * - Plan Journey ("Meu Plano & Benefícios")
 */

/**
 * Journey ID constants
 * Used for identifying journeys throughout the application
 */
export const JOURNEY_IDS = {
  /** Health journey ID */
  HEALTH: 'health',
  /** Care journey ID */
  CARE: 'care',
  /** Plan journey ID */
  PLAN: 'plan',
} as const;

/**
 * Journey ID type
 * Union type of all possible journey IDs
 */
export type JourneyId = typeof JOURNEY_IDS[keyof typeof JOURNEY_IDS];

/**
 * Journey interface
 * Defines the structure of a journey object
 */
export interface Journey {
  /** Unique identifier for the journey */
  id: JourneyId;
  /** Localized display name in Portuguese */
  displayName: string;
  /** Route path for the journey in the application */
  routePath: string;
  /** Icon name for the journey */
  icon: string;
  /** Primary color for the journey (used for theming) */
  primaryColor: string;
  /** Whether the journey requires authentication */
  requiresAuth: boolean;
}

/**
 * All journeys array
 * Comprehensive list of all journeys with their metadata
 */
export const ALL_JOURNEYS: Journey[] = [
  {
    id: JOURNEY_IDS.HEALTH,
    displayName: 'Minha Saúde',
    routePath: '/health',
    icon: 'health',
    primaryColor: '#2E7D32', // Green
    requiresAuth: true,
  },
  {
    id: JOURNEY_IDS.CARE,
    displayName: 'Cuidar-me Agora',
    routePath: '/care',
    icon: 'care',
    primaryColor: '#ED6C02', // Orange
    requiresAuth: true,
  },
  {
    id: JOURNEY_IDS.PLAN,
    displayName: 'Meu Plano & Benefícios',
    routePath: '/plan',
    icon: 'plan',
    primaryColor: '#0288D1', // Blue
    requiresAuth: true,
  },
];

/**
 * Get journey by ID
 * Helper function to retrieve a journey by its ID
 * 
 * @param id The journey ID to look up
 * @returns The journey object or undefined if not found
 */
export const getJourneyById = (id: JourneyId): Journey | undefined => {
  return ALL_JOURNEYS.find(journey => journey.id === id);
};

/**
 * Default journey
 * The default journey to use when no journey is specified
 */
export const DEFAULT_JOURNEY = ALL_JOURNEYS[0];