/**
 * @file index.ts
 * @description Barrel file that exports all DTO classes from the rewards/dto directory.
 * This file provides a single import point for consuming code, enabling cleaner imports
 * like `import { CreateRewardDto } from './dto'` instead of specifying each file path.
 *
 * This file implements the following requirements from the technical specification:
 * - Standardized imports using TypeScript path aliases for consistent code organization
 * - Implementation of proper package exposure patterns with clear public APIs
 * - Creation of standardized module resolution across the monorepo
 * - Establish proper package exposure patterns with clear public APIs
 */

// Export all DTO classes from this directory
export { CreateRewardDto } from './create-reward.dto';
export { UpdateRewardDto } from './update-reward.dto';
export { FilterRewardDto } from './filter-reward.dto';
export { GrantRewardDto } from './grant-reward.dto';