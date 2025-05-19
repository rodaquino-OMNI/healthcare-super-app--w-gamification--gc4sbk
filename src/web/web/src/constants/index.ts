/**
 * Constants Barrel File
 * 
 * This file exports all constants from the constants directory, providing a single
 * import point for all web application constants. It simplifies imports by allowing
 * developers to import multiple constants from a single location rather than from
 * separate files.
 * 
 * Example usage:
 * import { JOURNEY_COLORS, ROUTES, webConfig } from '@app/constants';
 * 
 * The constants support three core user journeys:
 * - My Health ("Minha Sau00fade")
 * - Care Now ("Cuidar-me Agora")
 * - My Plan & Benefits ("Meu Plano & Benefu00edcios")
 */

// Re-export configuration constants with explicit named exports for better tree-shaking
export { webConfig } from './config';

// Re-export journey-related constants with explicit named exports
export {
  JOURNEY_IDS,
  JOURNEY_NAMES,
  JOURNEY_COLORS,
  JOURNEY_ICONS,
  JOURNEY_ROUTES,
  DEFAULT_JOURNEY,
  JOURNEY_ORDER,
  JOURNEY_CONFIG,
  ALL_JOURNEYS,
  // Types
  type JourneyId,
  type JourneyConfig
} from './journeys';

// Re-export route-related constants with explicit named exports
export {
  ROUTES,
  // Types
  type RouteParams,
  type JourneyRoutes,
  type AppRoutes
} from './routes';