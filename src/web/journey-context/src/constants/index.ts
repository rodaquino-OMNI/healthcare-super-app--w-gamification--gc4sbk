/**
 * @file index.ts
 * @description Centralizes and re-exports all journey-related constants from the journey-context package,
 * providing a single entry point for importing journey IDs, names, colors, routes, and default configurations.
 * This barrel file simplifies imports across both web and mobile platforms, eliminating the need for
 * multiple import statements when working with journey constants.
 */

// Re-export all constants from colors.ts
export * from './colors';

// Re-export all constants from defaults.ts
export * from './defaults';

// Re-export all constants from journeys.ts
export * from './journeys';

// Re-export all constants from routes.ts
export * from './routes';