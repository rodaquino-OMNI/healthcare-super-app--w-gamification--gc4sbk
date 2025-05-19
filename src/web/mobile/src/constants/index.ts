/**
 * Constants barrel file for the AUSTA SuperApp mobile application.
 * 
 * This file serves as a centralized export point for all constant values used throughout
 * the mobile application, supporting the Journey-Centered Architecture and Cross-Journey
 * Gamification features of the AUSTA SuperApp.
 * 
 * By using this barrel file, we ensure consistent imports across the application and
 * prevent circular dependencies. All constants are properly typed using interfaces from
 * the @austa/interfaces package.
 * 
 * @module Constants
 * @packageDocumentation
 */

// Re-export all configuration constants
// Contains environment detection, app metadata, API configuration, feature flags
export * from './config';

// Re-export all journey-related constants 
// Contains journey names, IDs, and color mappings for the three core journeys
export * from './journeys';

// Re-export all route-related constants
// Contains route names for navigation throughout the application
export * from './routes';