/**
 * @file index.ts
 * @description Barrel file that exports all journey-specific database contexts, providing a clean and organized API
 * for other services to import journey contexts without knowing the internal folder structure.
 */

// Export base journey context
export { BaseJourneyContext } from './base-journey.context';

// Export journey-specific contexts
export { HealthDatabaseContext } from './health.context';
export { CareContext } from './care.context';
export { PlanContext } from './plan.context';

// Export journey types
export { JourneyType } from '../types/journey.types';

// Export context interfaces
export type { 
  JourneyDatabaseOptions,
  JourneyContextFactoryOptions,
  JourneyDatabaseResult,
  JourneyQueryParams,
  HealthJourneyQueryParams,
  CareJourneyQueryParams,
  PlanJourneyQueryParams,
  CrossJourneyRelationship,
  JourneyDatabaseError
} from '../types/journey.types';

/**
 * Convenience object that maps journey types to their respective database context classes.
 * This allows for dynamic context selection based on journey type.
 */
export const JourneyContextMap = {
  [JourneyType.HEALTH]: HealthDatabaseContext,
  [JourneyType.CARE]: CareContext,
  [JourneyType.PLAN]: PlanContext
};

/**
 * Default export that includes all journey contexts and related types.
 * This provides a convenient way to import everything related to journey contexts.
 */
export default {
  BaseJourneyContext,
  HealthDatabaseContext,
  CareContext,
  PlanContext,
  JourneyType,
  JourneyContextMap
};