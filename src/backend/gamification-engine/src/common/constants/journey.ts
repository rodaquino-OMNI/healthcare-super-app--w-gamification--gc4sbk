/**
 * Journey constants for the gamification engine.
 * 
 * This file defines constants for the three user journeys (Health, Care, Plan)
 * throughout the gamification engine. These journey identifiers are used to
 * categorize events, achievements, and rules, ensuring consistent journey
 * reference across all modules.
 */

/**
 * Enum representing the three main journey types in the AUSTA SuperApp.
 */
export enum JourneyType {
  HEALTH = 'HEALTH',
  CARE = 'CARE',
  PLAN = 'PLAN',
}

/**
 * Journey type alias for compatibility with existing code.
 * This ensures that code importing the Journey type will continue to work.
 */
export type Journey = JourneyType;

/**
 * Re-export the Journey enum for backward compatibility.
 */
export const Journey = JourneyType;

/**
 * String constants for journey identifiers.
 * These are used for consistent journey identification across the application.
 */
export const JOURNEY_HEALTH = JourneyType.HEALTH;
export const JOURNEY_CARE = JourneyType.CARE;
export const JOURNEY_PLAN = JourneyType.PLAN;

/**
 * Array of all valid journey types.
 * Useful for validation and iteration over all journeys.
 */
export const ALL_JOURNEY_TYPES = Object.values(JourneyType);

/**
 * Interface for journey display names in different languages.
 */
export interface JourneyDisplayNames {
  pt: string; // Portuguese
  en: string; // English
}

/**
 * Interface for journey metadata.
 */
export interface JourneyMetadata {
  id: JourneyType;
  displayNames: JourneyDisplayNames;
  color: string; // Primary color for the journey
}

/**
 * Display names for the Health journey in different languages.
 */
export const HEALTH_DISPLAY_NAMES: JourneyDisplayNames = {
  pt: 'Minha Saúde',
  en: 'My Health',
};

/**
 * Display names for the Care journey in different languages.
 */
export const CARE_DISPLAY_NAMES: JourneyDisplayNames = {
  pt: 'Cuidar-me Agora',
  en: 'Care for Me Now',
};

/**
 * Display names for the Plan journey in different languages.
 */
export const PLAN_DISPLAY_NAMES: JourneyDisplayNames = {
  pt: 'Meu Plano & Benefícios',
  en: 'My Plan & Benefits',
};

/**
 * Mapping of journey types to their display names.
 */
export const JOURNEY_DISPLAY_NAMES: Record<JourneyType, JourneyDisplayNames> = {
  [JourneyType.HEALTH]: HEALTH_DISPLAY_NAMES,
  [JourneyType.CARE]: CARE_DISPLAY_NAMES,
  [JourneyType.PLAN]: PLAN_DISPLAY_NAMES,
};

/**
 * Primary colors for each journey.
 * These colors are used for journey-specific theming.
 */
export const JOURNEY_COLORS: Record<JourneyType, string> = {
  [JourneyType.HEALTH]: '#2E7D32', // Green
  [JourneyType.CARE]: '#E65100',   // Orange
  [JourneyType.PLAN]: '#1565C0',   // Blue
};

/**
 * Complete metadata for all journeys.
 */
export const JOURNEY_METADATA: Record<JourneyType, JourneyMetadata> = {
  [JourneyType.HEALTH]: {
    id: JourneyType.HEALTH,
    displayNames: HEALTH_DISPLAY_NAMES,
    color: JOURNEY_COLORS[JourneyType.HEALTH],
  },
  [JourneyType.CARE]: {
    id: JourneyType.CARE,
    displayNames: CARE_DISPLAY_NAMES,
    color: JOURNEY_COLORS[JourneyType.CARE],
  },
  [JourneyType.PLAN]: {
    id: JourneyType.PLAN,
    displayNames: PLAN_DISPLAY_NAMES,
    color: JOURNEY_COLORS[JourneyType.PLAN],
  },
};

/**
 * Array of all journey metadata objects.
 * Useful for iteration and mapping over all journeys.
 */
export const ALL_JOURNEYS = Object.values(JOURNEY_METADATA);

/**
 * Type guard to check if a string is a valid Journey type.
 * @param journey The journey string to validate
 * @returns True if the journey is a valid Journey type
 */
export const isValidJourney = (journey: string): journey is Journey => {
  return Object.values(JourneyType).includes(journey as Journey);
};

/**
 * Gets the display name for a journey in the specified language.
 * @param journey The journey type
 * @param language The language code ('pt' or 'en')
 * @returns The display name in the specified language
 */
export const getJourneyDisplayName = (
  journey: Journey,
  language: keyof JourneyDisplayNames = 'pt'
): string => {
  return JOURNEY_DISPLAY_NAMES[journey][language];
};

/**
 * Gets the primary color for a journey.
 * @param journey The journey type
 * @returns The primary color for the journey
 */
export const getJourneyColor = (journey: Journey): string => {
  return JOURNEY_COLORS[journey];
};

/**
 * Gets the complete metadata for a journey.
 * @param journey The journey type
 * @returns The journey metadata
 */
export const getJourneyMetadata = (journey: Journey): JourneyMetadata => {
  return JOURNEY_METADATA[journey];
};