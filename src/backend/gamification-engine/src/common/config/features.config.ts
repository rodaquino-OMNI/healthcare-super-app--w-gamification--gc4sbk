import { registerAs } from '@nestjs/config';
import { FeaturesConfig } from '../interfaces/config.interfaces';

/**
 * Features configuration for the Gamification Engine.
 * 
 * This module provides feature flag settings including:
 * - Cache configuration
 * - Leaderboard settings
 * - Achievement settings
 * - Reward settings
 * 
 * @returns {FeaturesConfig} The features configuration object
 */
export const featuresConfig = registerAs<FeaturesConfig>('features', () => ({
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false', // Enabled by default
  },
  leaderboard: {
    updateInterval: parseInt(process.env.LEADERBOARD_UPDATE_INTERVAL, 10) || 900000, // 15 minutes
    maxEntries: parseInt(process.env.LEADERBOARD_MAX_ENTRIES, 10) || 100,
  },
  achievements: {
    notificationsEnabled: process.env.ACHIEVEMENTS_NOTIFICATIONS_ENABLED !== 'false', // Enabled by default
    progressTrackingEnabled: process.env.ACHIEVEMENTS_PROGRESS_TRACKING_ENABLED !== 'false', // Enabled by default
    maxConcurrentQuests: parseInt(process.env.ACHIEVEMENTS_MAX_CONCURRENT_QUESTS, 10) || 5,
  },
  rewards: {
    expirationDays: parseInt(process.env.REWARDS_EXPIRATION_DAYS, 10) || 30,
    redemptionEnabled: process.env.REWARDS_REDEMPTION_ENABLED !== 'false', // Enabled by default
  },
}));