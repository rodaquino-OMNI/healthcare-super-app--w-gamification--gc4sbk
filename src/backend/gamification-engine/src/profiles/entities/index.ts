/**
 * @file Barrel file for profile entities
 * @description Centralizes and exports all entity definitions from the profiles module.
 * This file provides a single import point for consumers, eliminating the need to import
 * from individual files. This improves code organization, reduces import statement clutter,
 * and establishes a clear public API for the profiles module.
 */

// Export the GameProfile entity for use in other modules
export { GameProfile } from './game-profile.entity';

/**
 * @example Import all profile entities
 * ```typescript
 * import { GameProfile } from '@app/gamification-engine/profiles/entities';
 * ```
 */