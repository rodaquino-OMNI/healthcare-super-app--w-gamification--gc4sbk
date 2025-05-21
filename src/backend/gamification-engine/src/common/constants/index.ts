/**
 * @file Gamification Engine Constants
 * @description Central barrel file that re-exports all constants from the gamification engine constants directory.
 * This file provides a single import point for consumers, simplifying imports and ensuring all constants
 * are consistently available throughout the application.
 *
 * @example
 * // Import all constants
 * import * as Constants from '@app/gamification/common/constants';
 * 
 * // Import specific constant groups
 * import { JOURNEY, EVENT_TYPES } from '@app/gamification/common/constants';
 * 
 * // Import from specific constant files directly when needed
 * import { HEALTH_JOURNEY } from '@app/gamification/common/constants/journey';
 */

// Journey-related constants
export * from './journey';

// Event-related constants
export * from './event-types';
export * from './kafka-topics';

// Achievement and reward constants
export * from './achievement-types';
export * from './point-values';

// Infrastructure and technical constants
export * from './redis-keys';
export * from './retry-policies';
export * from './error-codes';

/**
 * Constants version information
 * @internal Used for tracking the version of constants being used
 */
export const CONSTANTS_VERSION = '1.0.0';

/**
 * Gamification engine feature flags
 * Controls which features are enabled in the current environment
 */
export const FEATURE_FLAGS = {
  ENABLE_LEADERBOARDS: true,
  ENABLE_ACHIEVEMENTS: true,
  ENABLE_QUESTS: true,
  ENABLE_REWARDS: true,
  ENABLE_REAL_TIME_UPDATES: true,
  ENABLE_CROSS_JOURNEY_ACHIEVEMENTS: true,
  ENABLE_POINT_DECAY: false,
  ENABLE_ACHIEVEMENT_EXPIRATION: false,
};

/**
 * Default configuration values for the gamification engine
 * These can be overridden by environment variables
 */
export const DEFAULT_CONFIG = {
  LEADERBOARD_UPDATE_INTERVAL_MS: 60000, // 1 minute
  ACHIEVEMENT_PROCESSING_BATCH_SIZE: 100,
  QUEST_PROCESSING_BATCH_SIZE: 50,
  REWARD_PROCESSING_BATCH_SIZE: 50,
  EVENT_PROCESSING_TIMEOUT_MS: 30000, // 30 seconds
  CACHE_TTL_MS: 3600000, // 1 hour
};