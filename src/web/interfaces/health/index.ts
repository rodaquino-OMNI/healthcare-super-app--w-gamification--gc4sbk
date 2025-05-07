/**
 * @file Central barrel file that re-exports all Health journey interfaces and schemas.
 * Provides a unified entry point for importing health-related TypeScript types and validation schemas.
 */

// Re-export all types from the types file
export * from './types';

// Re-export all interfaces and schemas
export * from './device';
export * from './goal';
export * from './event';
export * from './metric';
export * from './wearable';

// For backward compatibility with existing code
import * as HealthTypes from './types';
export { HealthTypes };