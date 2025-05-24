/**
 * Type definitions for journey-related data structures.
 * These types establish the core foundation for representing the three primary user journeys
 * ('Minha Saúde', 'Cuidar-me Agora', and 'Meu Plano & Benefícios') across both web and mobile platforms.
 */

/**
 * Valid journey IDs in the system
 */
export type JourneyId = 'health' | 'care' | 'plan';

/**
 * Constants for journey IDs to prevent string literal usage
 */
export const JOURNEY_IDS = {
  HEALTH: 'health' as JourneyId,
  CARE: 'care' as JourneyId,
  PLAN: 'plan' as JourneyId
};

/**
 * Theme colors for a journey
 */
export interface JourneyTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  // Additional theme properties as needed
}

/**
 * Comprehensive journey interface with all properties
 */
export interface Journey {
  /**
   * Unique identifier for the journey
   */
  id: JourneyId;
  
  /**
   * Localized display name for the journey
   */
  name: string;
  
  /**
   * Primary color associated with the journey
   */
  color: string;
  
  /**
   * Icon identifier for the journey
   */
  icon: string;
  
  /**
   * Base route path for the journey
   */
  route: string;
  
  /**
   * Theme colors for the journey
   */
  theme: JourneyTheme;
}

/**
 * Configuration interface for journey settings
 */
export interface JourneyConfig {
  /**
   * List of available journeys in the application
   */
  availableJourneys: Journey[];
  
  /**
   * Default journey to use when none is selected
   */
  defaultJourney: JourneyId;
  
  /**
   * Preferred order for displaying journeys
   */
  displayOrder?: JourneyId[];
}