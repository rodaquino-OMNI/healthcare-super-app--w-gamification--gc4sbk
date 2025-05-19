/**
 * Journey constants for the AUSTA SuperApp
 * 
 * This file re-exports journey constants from @austa/journey-context to ensure
 * consistent journey identification, naming, styling, and navigation throughout
 * the application while maintaining backward compatibility with existing code.
 * 
 * The three core user journeys are:
 * - My Health ("Minha Saúde")
 * - Care Now ("Cuidar-me Agora")
 * - My Plan & Benefits ("Meu Plano & Benefícios")
 */

import {
  JourneyId as JourneyContextId,
  JourneyConfig as JourneyContextConfig,
  JOURNEY_IDS as CONTEXT_JOURNEY_IDS,
  JOURNEY_NAMES as CONTEXT_JOURNEY_NAMES,
  JOURNEY_COLORS as CONTEXT_JOURNEY_COLORS,
  JOURNEY_ICONS as CONTEXT_JOURNEY_ICONS,
  JOURNEY_ROUTES as CONTEXT_JOURNEY_ROUTES,
  DEFAULT_JOURNEY as CONTEXT_DEFAULT_JOURNEY,
  JOURNEY_ORDER as CONTEXT_JOURNEY_ORDER,
  ALL_JOURNEYS,
} from '@austa/journey-context/constants/journeys';

/**
 * Re-export journey IDs for backward compatibility
 * These unique identifiers are used for each journey
 */
export const JOURNEY_IDS = CONTEXT_JOURNEY_IDS;

/**
 * Type representing valid journey IDs
 * Re-exported from @austa/journey-context for backward compatibility
 */
export type JourneyId = JourneyContextId;

/**
 * Re-export journey names for backward compatibility
 * Display names for each journey in Brazilian Portuguese
 */
export const JOURNEY_NAMES = CONTEXT_JOURNEY_NAMES;

/**
 * Re-export journey colors for backward compatibility
 * Color schemes for each journey used for theming and visual differentiation
 * 
 * Note: These colors are now also available through the design system theming:
 * import { useTheme } from '@austa/design-system';
 * const { colors } = useTheme(journeyId);
 */
export const JOURNEY_COLORS = CONTEXT_JOURNEY_COLORS;

/**
 * Re-export journey icons for backward compatibility
 * Icon names for each journey used in navigation and UI elements
 */
export const JOURNEY_ICONS = CONTEXT_JOURNEY_ICONS;

/**
 * Re-export journey routes for backward compatibility
 * Base route paths for each journey used in navigation
 */
export const JOURNEY_ROUTES = CONTEXT_JOURNEY_ROUTES;

/**
 * Re-export default journey for backward compatibility
 * Default journey ID to use when no journey is specified
 */
export const DEFAULT_JOURNEY: JourneyId = CONTEXT_DEFAULT_JOURNEY;

/**
 * Re-export journey order for backward compatibility
 * Preferred display order of journeys in navigation and dashboard
 */
export const JOURNEY_ORDER: JourneyId[] = CONTEXT_JOURNEY_ORDER;

/**
 * Journey configuration interface
 * Re-exported from @austa/journey-context for backward compatibility
 */
export interface JourneyConfig extends JourneyContextConfig {}

/**
 * Re-export comprehensive configuration for each journey
 * This includes all properties (id, name, color, icon, route)
 */
export const JOURNEY_CONFIG: Record<keyof typeof JOURNEY_IDS, JourneyConfig> = {
  HEALTH: ALL_JOURNEYS.find(journey => journey.id === JOURNEY_IDS.HEALTH) as JourneyConfig,
  CARE: ALL_JOURNEYS.find(journey => journey.id === JOURNEY_IDS.CARE) as JourneyConfig,
  PLAN: ALL_JOURNEYS.find(journey => journey.id === JOURNEY_IDS.PLAN) as JourneyConfig,
};

/**
 * Export ALL_JOURNEYS array for new code that needs access to all journey configurations
 * This is the preferred way to access journey data in new code
 */
export { ALL_JOURNEYS };