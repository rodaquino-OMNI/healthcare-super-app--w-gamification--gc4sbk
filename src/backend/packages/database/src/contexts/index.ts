/**
 * @file index.ts
 * @description Barrel file that exports all journey-specific database contexts.
 * Provides a clean and organized API for other services to import journey contexts
 * without knowing the internal folder structure.
 */

// Base Journey Context
export { BaseJourneyContext } from './base-journey.context';

// Journey-Specific Contexts
export { HealthContext } from './health.context';
export { CareContext } from './care.context';
export { PlanContext } from './plan.context';

/**
 * Journey Context Map
 * 
 * Provides a mapping of journey IDs to their respective context classes.
 * This can be used for dynamic context resolution based on journey ID.
 */
export const JourneyContextMap = {
  health: 'HealthContext',
  care: 'CareContext',
  plan: 'PlanContext',
} as const;

/**
 * Journey Context Types
 * 
 * Type definitions for journey contexts to enable type-safe importing.
 */
export type JourneyContextType = 
  | typeof HealthContext
  | typeof CareContext
  | typeof PlanContext;

/**
 * Journey ID Type
 * 
 * Union type of valid journey IDs for type-safe journey identification.
 */
export type JourneyId = keyof typeof JourneyContextMap;

/**
 * Journey Context Factory
 * 
 * Helper function to create the appropriate journey context based on journey ID.
 * 
 * @param journeyId - The ID of the journey to create a context for
 * @param prismaClient - The PrismaClient instance to use for database access
 * @returns The appropriate journey context instance
 */
export function createJourneyContext(journeyId: JourneyId, prismaClient: any): BaseJourneyContext {
  switch (journeyId) {
    case 'health':
      return new HealthContext(prismaClient);
    case 'care':
      return new CareContext(prismaClient);
    case 'plan':
      return new PlanContext(prismaClient);
    default:
      throw new Error(`Unknown journey ID: ${journeyId}`);
  }
}