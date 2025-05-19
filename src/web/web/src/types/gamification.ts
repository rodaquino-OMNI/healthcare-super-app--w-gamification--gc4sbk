/**
 * @file gamification.ts
 * @description Re-exports TypeScript interfaces for the gamification subsystem from the
 * centralized @austa/interfaces package. This file maintains backward compatibility
 * while leveraging the standardized type definitions from the shared interfaces package.
 *
 * @important This file is a migration from direct type definitions to re-exports.
 * All components and services that previously imported from this file will continue
 * to work without changes, but now benefit from the centralized type definitions.
 */

/**
 * Re-export Achievement interface from the centralized interfaces package.
 * This interface defines the structure for achievements that users can unlock
 * by performing specific actions or reaching certain thresholds.
 */
export type { Achievement } from '@austa/interfaces/gamification';

/**
 * Re-export Quest interface from the centralized interfaces package.
 * This interface defines the structure for time-limited challenges that users
 * can complete to earn rewards and progress in the system.
 */
export type { Quest } from '@austa/interfaces/gamification';

/**
 * Re-export Reward interface from the centralized interfaces package.
 * This interface defines the structure for benefits that users can earn by
 * completing quests, unlocking achievements, or reaching certain milestones.
 */
export type { Reward } from '@austa/interfaces/gamification';

/**
 * Re-export GameProfile interface from the centralized interfaces package.
 * This interface defines the structure for a user's game profile that tracks
 * progress, level, and engagement across the platform.
 */
export type { GameProfile } from '@austa/interfaces/gamification';

/**
 * Re-export GamificationEvent interface from the centralized interfaces package.
 * This interface defines the structure for events that trigger gamification rules,
 * achievements, and rewards across all journeys.
 *
 * @note This interface was previously not exported from this file but is now
 * included to provide access to the standardized event schema.
 */
export type { GamificationEvent } from '@austa/interfaces/gamification';