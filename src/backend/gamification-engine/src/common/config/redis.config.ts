import { registerAs } from '@nestjs/config';
import { RedisConfig } from '../interfaces/config.interfaces';

/**
 * Redis configuration for the Gamification Engine.
 * 
 * This module provides settings for Redis caching including:
 * - Connection details
 * - Key prefixes
 * - TTL (Time-to-live) settings for different cache types
 * 
 * @returns {RedisConfig} The Redis configuration object
 */
export const redisConfig = registerAs<RedisConfig>('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'game:',
  ttl: {
    achievements: parseInt(process.env.ACHIEVEMENTS_TTL, 10) || 3600, // 1 hour
    userProfile: parseInt(process.env.USER_PROFILE_TTL, 10) || 300, // 5 minutes
    leaderboard: parseInt(process.env.LEADERBOARD_TTL, 10) || 900, // 15 minutes
    rules: parseInt(process.env.RULES_TTL, 10) || 600, // 10 minutes
  },
}));