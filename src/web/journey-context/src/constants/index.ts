/**
 * Journey Context Constants Barrel File
 * 
 * This file centralizes and re-exports all journey-related constants from the journey-context package,
 * providing a single entry point for importing journey IDs, names, colors, routes, and default configurations.
 * It simplifies imports across both web and mobile platforms, eliminating the need for multiple import
 * statements when working with journey constants.
 * 
 * Example usage:
 * import { JOURNEY_IDS, JOURNEY_NAMES, JOURNEY_COLORS, JOURNEY_ROUTES, DEFAULT_JOURNEY } from '@austa/journey-context/constants';
 * 
 * The constants support three core user journeys:
 * - My Health ("Minha Saúde")
 * - Care Now ("Cuidar-me Agora")
 * - My Plan & Benefits ("Meu Plano & Benefícios")
 */

// Re-export journey definitions (IDs, names, metadata)
export * from './journeys';

// Re-export journey color schemes and theming values
export * from './colors';

// Re-export journey-specific route constants and navigation paths
export * from './routes';

// Re-export default configurations and fallback values
export * from './defaults';