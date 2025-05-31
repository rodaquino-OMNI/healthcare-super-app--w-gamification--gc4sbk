/**
 * Constants Barrel File for Journey Context
 * 
 * This file centralizes and re-exports all journey-related constants from the journey-context package,
 * providing a single entry point for importing journey IDs, names, colors, routes, and default configurations.
 * 
 * It simplifies imports across both web and mobile platforms, eliminating the need for multiple
 * import statements when working with journey constants.
 * 
 * The constants support three core user journeys:
 * - My Health ("Minha Saúde")
 * - Care Now ("Cuidar-me Agora")
 * - My Plan & Benefits ("Meu Plano & Benefícios")
 */

// Re-export journey-related constants
export * from './journeys';

// Re-export color-related constants
export * from './colors';

// Re-export route-related constants
export * from './routes';

// Re-export default configuration constants
export * from './defaults';