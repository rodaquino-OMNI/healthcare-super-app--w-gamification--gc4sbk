/**
 * @file journey.ts
 * @description Defines constants for the three user journeys (Health, Care, Plan) throughout the gamification engine.
 * These journey identifiers are used to categorize events, achievements, and rules, ensuring consistent journey
 * reference across all modules.
 */

/**
 * Enum representing the three distinct user journeys in the AUSTA SuperApp
 */
export enum Journey {
  /**
   * Health Journey - "Minha Saúde"
   * Focused on health metrics, goals, and device connections
   */
  HEALTH = 'health',
  
  /**
   * Care Journey - "Cuidar-me Agora"
   * Focused on appointments, medications, telemedicine, and providers
   */
  CARE = 'care',
  
  /**
   * Plan Journey - "Meu Plano & Benefícios"
   * Focused on insurance plans, benefits, claims, and coverage
   */
  PLAN = 'plan',
}

/**
 * Display names for journeys in Portuguese
 */
export const JOURNEY_DISPLAY_NAMES_PT = {
  [Journey.HEALTH]: 'Minha Saúde',
  [Journey.CARE]: 'Cuidar-me Agora',
  [Journey.PLAN]: 'Meu Plano & Benefícios',
};

/**
 * Display names for journeys in English
 */
export const JOURNEY_DISPLAY_NAMES_EN = {
  [Journey.HEALTH]: 'My Health',
  [Journey.CARE]: 'Care Now',
  [Journey.PLAN]: 'My Plan & Benefits',
};

/**
 * Journey color codes for UI theming
 */
export const JOURNEY_COLORS = {
  [Journey.HEALTH]: '#4CAF50', // Green
  [Journey.CARE]: '#FF9800',   // Orange
  [Journey.PLAN]: '#2196F3',   // Blue
};

/**
 * Array of all journey values
 */
export const ALL_JOURNEYS = Object.values(Journey);

/**
 * Type guard to check if a string is a valid Journey
 * @param value The value to check
 * @returns True if the value is a valid Journey
 */
export function isJourney(value: string): value is Journey {
  return Object.values(Journey).includes(value as Journey);
}

/**
 * Get the display name for a journey in the specified language
 * @param journey The journey to get the display name for
 * @param language The language to get the display name in ('pt' or 'en')
 * @returns The display name for the journey
 */
export function getJourneyDisplayName(journey: Journey, language: 'pt' | 'en' = 'pt'): string {
  return language === 'pt' 
    ? JOURNEY_DISPLAY_NAMES_PT[journey] 
    : JOURNEY_DISPLAY_NAMES_EN[journey];
}

/**
 * Get the color code for a journey
 * @param journey The journey to get the color for
 * @returns The color code for the journey
 */
export function getJourneyColor(journey: Journey): string {
  return JOURNEY_COLORS[journey];
}