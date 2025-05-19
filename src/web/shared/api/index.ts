/**
 * @file API Barrel File
 * @description Exports all API functions from the AUSTA SuperApp shared API modules.
 * This file provides a single, unified entry point for importing any API function,
 * simplifying imports across the application.
 *
 * @example
 * // Import specific functions
 * import { getGameProfile, submitGamificationEvent } from '@austa/web-shared/api';
 *
 * // Or import everything
 * import * as API from '@austa/web-shared/api';
 */

/**
 * Re-export all gamification API functions
 * These functions interact with the AUSTA SuperApp gamification engine
 */
export {
  getGameProfile,
  getUserAchievements,
  getUserQuests,
  getUserRewards,
  submitGamificationEvent
} from './gamification';