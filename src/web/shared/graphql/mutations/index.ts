/**
 * @file index.ts
 * @description A centralized export point for all GraphQL mutations used in the AUSTA SuperApp.
 * This index file aggregates mutations from different journey modules (Health, Care, Plan,
 * Gamification, and Auth) to provide a consistent import path for UI components.
 *
 * @module GraphQLMutations
 * @category Shared
 * @subcategory GraphQL
 *
 * @example
 * // Import all mutations from a specific journey
 * import { HealthMutations } from '@app/shared/graphql/mutations';
 * 
 * // Or import specific mutation groups as needed
 * import { AuthMutations, CareMutations } from '@app/shared/graphql/mutations';
 */

// Authentication mutations
import * as AuthMutations from './auth.mutations';

// Health journey mutations
import * as HealthMutations from './health.mutations';

// Care journey mutations
import * as CareMutations from './care.mutations';

// Plan journey mutations
import * as PlanMutations from './plan.mutations';

// Gamification mutations
import * as GamificationMutations from './gamification.mutations';

/**
 * Export all mutation groups organized by journey context.
 * This structure allows consumers to import only the mutations they need
 * while maintaining a clear separation between different journey domains.
 */
export {
  AuthMutations,
  HealthMutations,
  CareMutations,
  PlanMutations,
  GamificationMutations
};