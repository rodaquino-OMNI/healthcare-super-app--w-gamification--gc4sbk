/**
 * @file Barrel file for exporting all profile entities
 * 
 * This file serves as a centralized export point for all entity definitions
 * in the profiles module. It simplifies imports for consumers by providing
 * a single entry point, eliminating the need to import from individual files.
 * 
 * @example
 * // Import the GameProfile entity
 * import { GameProfile } from '@app/gamification-engine/profiles/entities';
 */

// Export the GameProfile entity
export * from './game-profile.entity';