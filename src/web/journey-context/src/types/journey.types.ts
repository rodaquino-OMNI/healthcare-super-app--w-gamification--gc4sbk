/**
 * @file journey.types.ts
 * @description Type definitions for journey-related data structures in the AUSTA SuperApp.
 * This file establishes the core type foundation for representing the three primary user journeys
 * ('Minha Saúde', 'Cuidar-me Agora', and 'Meu Plano & Benefícios') across both web and mobile platforms.
 */

/**
 * Represents the unique identifier for each journey in the application.
 * Using a literal type ensures type safety when referencing journeys.
 */
export type JourneyId = 'health' | 'care' | 'plan';

/**
 * Strongly-typed constants for journey identifiers to prevent string literal usage.
 * This provides a centralized source of truth for journey IDs across the application.
 */
export const JOURNEY_IDS = {
  /** Health journey ID - 'Minha Saúde' */
  HEALTH: 'health' as const,
  /** Care journey ID - 'Cuidar-me Agora' */
  CARE: 'care' as const,
  /** Plan journey ID - 'Meu Plano & Benefícios' */
  PLAN: 'plan' as const,
} as const;

/**
 * Object type derived from JOURNEY_IDS for type checking.
 */
export type JourneyIdsType = typeof JOURNEY_IDS;

/**
 * Represents a complete journey definition with all properties needed for UI rendering and navigation.
 * This interface provides a comprehensive structure for journey data across the application.
 */
export interface Journey {
  /** Unique identifier for the journey */
  id: JourneyId;
  /** Localized display name for the journey */
  name: string;
  /** Primary color associated with the journey for theming */
  color: string;
  /** Icon identifier for the journey */
  icon: string;
  /** Base route path for the journey */
  route: string;
  /** Optional description of the journey */
  description?: string;
  /** Whether the journey is currently enabled */
  enabled?: boolean;
}

/**
 * Configuration interface for journey settings across the application.
 * Allows for customization of journey behavior and presentation.
 */
export interface JourneyConfig {
  /** List of all available journeys in the application */
  availableJourneys: Journey[];
  /** Default journey to show when no specific journey is selected */
  defaultJourney: JourneyId;
  /** Preferred order for displaying journeys in navigation */
  displayOrder?: JourneyId[];
  /** Whether to allow journey switching */
  allowJourneySwitching?: boolean;
  /** Whether to persist journey selection between sessions */
  persistJourneySelection?: boolean;
}

/**
 * Type guard to check if a string is a valid JourneyId
 * @param id - The string to check
 * @returns True if the string is a valid JourneyId
 */
export function isValidJourneyId(id: string): id is JourneyId {
  return Object.values(JOURNEY_IDS).includes(id as JourneyId);
}

/**
 * Default journey configuration with all three journeys enabled
 */
export const DEFAULT_JOURNEY_CONFIG: JourneyConfig = {
  availableJourneys: [
    {
      id: JOURNEY_IDS.HEALTH,
      name: 'Minha Saúde',
      color: '#4CAF50', // Green
      icon: 'health',
      route: '/health',
      description: 'Monitor your health metrics and wellness goals',
      enabled: true,
    },
    {
      id: JOURNEY_IDS.CARE,
      name: 'Cuidar-me Agora',
      color: '#FF9800', // Orange
      icon: 'care',
      route: '/care',
      description: 'Schedule appointments and access healthcare services',
      enabled: true,
    },
    {
      id: JOURNEY_IDS.PLAN,
      name: 'Meu Plano & Benefícios',
      color: '#2196F3', // Blue
      icon: 'plan',
      route: '/plan',
      description: 'Manage your insurance plan and benefits',
      enabled: true,
    },
  ],
  defaultJourney: JOURNEY_IDS.HEALTH,
  displayOrder: [JOURNEY_IDS.HEALTH, JOURNEY_IDS.CARE, JOURNEY_IDS.PLAN],
  allowJourneySwitching: true,
  persistJourneySelection: true,
};