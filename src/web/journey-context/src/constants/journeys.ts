/**
 * Core journey constants for the AUSTA SuperApp.
 * Defines journey IDs, localized display names, and a comprehensive ALL_JOURNEYS array
 * that combines all journey metadata.
 */

import { Journey, JourneyId, JOURNEY_IDS } from '../types/journey.types';

/**
 * Health journey theme colors
 */
const HEALTH_THEME = {
  primary: '#2E7D32', // Green 800
  secondary: '#81C784', // Green 300
  accent: '#00C853', // Green A700
  background: '#E8F5E9', // Green 50
  text: '#1B5E20', // Green 900
};

/**
 * Care journey theme colors
 */
const CARE_THEME = {
  primary: '#EF6C00', // Orange 800
  secondary: '#FFB74D', // Orange 300
  accent: '#FF9100', // Orange A400
  background: '#FFF3E0', // Orange 50
  text: '#E65100', // Orange 900
};

/**
 * Plan journey theme colors
 */
const PLAN_THEME = {
  primary: '#1565C0', // Blue 800
  secondary: '#64B5F6', // Blue 300
  accent: '#2979FF', // Blue A400
  background: '#E3F2FD', // Blue 50
  text: '#0D47A1', // Blue 900
};

/**
 * Comprehensive array of all journeys in the AUSTA SuperApp
 */
export const ALL_JOURNEYS: Journey[] = [
  {
    id: JOURNEY_IDS.HEALTH,
    name: 'Minha Sau00fade',
    color: HEALTH_THEME.primary,
    icon: 'heart-pulse',
    route: '/health',
    theme: HEALTH_THEME,
  },
  {
    id: JOURNEY_IDS.CARE,
    name: 'Cuidar-me Agora',
    color: CARE_THEME.primary,
    icon: 'medical-bag',
    route: '/care',
    theme: CARE_THEME,
  },
  {
    id: JOURNEY_IDS.PLAN,
    name: 'Meu Plano & Benefu00edcios',
    color: PLAN_THEME.primary,
    icon: 'shield-check',
    route: '/plan',
    theme: PLAN_THEME,
  },
];

/**
 * Default journey to use when none is selected
 */
export const DEFAULT_JOURNEY = JOURNEY_IDS.HEALTH;

/**
 * Preferred order for displaying journeys
 */
export const JOURNEY_DISPLAY_ORDER: JourneyId[] = [
  JOURNEY_IDS.HEALTH,
  JOURNEY_IDS.CARE,
  JOURNEY_IDS.PLAN,
];