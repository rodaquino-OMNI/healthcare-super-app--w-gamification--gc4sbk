/**
 * @file journey.types.ts
 * @description Type definitions for journey-related data structures used across the AUSTA SuperApp.
 * These types provide a standardized foundation for representing the three primary user journeys
 * ('Minha Saúde', 'Cuidar-me Agora', and 'Meu Plano & Benefícios') across both web and mobile platforms.
 */

/**
 * Represents the valid journey identifiers in the application.
 * This type ensures that only the three supported journeys can be referenced.
 */
export type JourneyId = 'health' | 'care' | 'plan';

/**
 * Strongly-typed constants for journey identifiers.
 * Using these constants instead of string literals helps prevent typos and provides better IDE support.
 */
export const JOURNEY_IDS = {
  /** Health journey identifier ('Minha Saúde') */
  HEALTH: 'health' as const,
  /** Care journey identifier ('Cuidar-me Agora') */
  CARE: 'care' as const,
  /** Plan journey identifier ('Meu Plano & Benefícios') */
  PLAN: 'plan' as const,
} as const;

/**
 * Represents a journey in the application with all its associated metadata.
 * This interface provides a comprehensive definition of what constitutes a journey,
 * including its visual representation and navigation properties.
 */
export interface Journey {
  /** Unique identifier for the journey */
  id: JourneyId;
  /** Display name for the journey in the user's language */
  name: string;
  /** Primary color associated with the journey for theming */
  color: string;
  /** Icon identifier for the journey */
  icon: string;
  /** Base route for the journey in the application */
  route: string;
  /** Optional description of the journey */
  description?: string;
}

/**
 * Configuration options for journeys in the application.
 * This interface allows for customizing which journeys are available and how they are presented.
 */
export interface JourneyConfig {
  /** List of available journeys in the application */
  availableJourneys: Journey[];
  /** Default journey to show when no specific journey is selected */
  defaultJourney: JourneyId;
  /** Preferred order for displaying journeys in navigation */
  displayOrder?: JourneyId[];
}