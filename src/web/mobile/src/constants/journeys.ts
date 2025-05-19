/**
 * Constants related to the different user journeys in the AUSTA SuperApp.
 * These constants support the Journey Navigation System and Journey Color Coding
 * for visual differentiation between the three core journeys.
 *
 * This file is aligned with the @austa/journey-context package to ensure
 * consistent journey identification across the application.
 */

import { JourneyId } from '@austa/journey-context';

/**
 * Type-safe journey ID constants
 * Used for routing, analytics tracking, and feature flagging
 */
export const JOURNEY_IDS = {
  HEALTH: 'health' as const,
  CARE: 'care' as const,
  PLAN: 'plan' as const
};

/**
 * Type definition for journey IDs
 */
export type JourneyIdType = typeof JOURNEY_IDS[keyof typeof JOURNEY_IDS];

/**
 * User-facing localized names for each journey
 */
export const JOURNEY_NAMES = {
  [JOURNEY_IDS.HEALTH]: 'Minha Saúde',
  [JOURNEY_IDS.CARE]: 'Cuidar-me Agora',
  [JOURNEY_IDS.PLAN]: 'Meu Plano & Benefícios'
};

/**
 * Type definition for journey names
 */
export type JourneyNameType = typeof JOURNEY_NAMES[JourneyId];

/**
 * Color hexcodes for each journey
 * Used for journey-specific theming and visual differentiation
 * - Health: Green (#0ACF83)
 * - Care: Orange (#FF8C42)
 * - Plan: Blue (#3A86FF)
 */
export const JOURNEY_COLORS = {
  [JOURNEY_IDS.HEALTH]: '#0ACF83',
  [JOURNEY_IDS.CARE]: '#FF8C42',
  [JOURNEY_IDS.PLAN]: '#3A86FF'
};

/**
 * Type definition for journey colors
 */
export type JourneyColorType = typeof JOURNEY_COLORS[JourneyId];

/**
 * Legacy journey ID mapping for backward compatibility
 * Maps the new standardized IDs to the previous format
 * @deprecated Use JOURNEY_IDS instead
 */
export const LEGACY_JOURNEY_IDS = {
  'my-health': JOURNEY_IDS.HEALTH,
  'care-now': JOURNEY_IDS.CARE,
  'my-plan': JOURNEY_IDS.PLAN
};

/**
 * Journey configuration object that combines ID, name, and color
 * for each journey in a single structure
 */
export interface JourneyConfig {
  id: JourneyId;
  name: string;
  color: string;
}

/**
 * Complete journey configurations for all available journeys
 */
export const JOURNEY_CONFIGS: Record<JourneyId, JourneyConfig> = {
  [JOURNEY_IDS.HEALTH]: {
    id: JOURNEY_IDS.HEALTH,
    name: JOURNEY_NAMES[JOURNEY_IDS.HEALTH],
    color: JOURNEY_COLORS[JOURNEY_IDS.HEALTH]
  },
  [JOURNEY_IDS.CARE]: {
    id: JOURNEY_IDS.CARE,
    name: JOURNEY_NAMES[JOURNEY_IDS.CARE],
    color: JOURNEY_COLORS[JOURNEY_IDS.CARE]
  },
  [JOURNEY_IDS.PLAN]: {
    id: JOURNEY_IDS.PLAN,
    name: JOURNEY_NAMES[JOURNEY_IDS.PLAN],
    color: JOURNEY_COLORS[JOURNEY_IDS.PLAN]
  }
};