/**
 * @file Redis key constants for the gamification engine
 * @description Defines constants for Redis key patterns used by the gamification engine for caching,
 * leaderboards, and temporary data storage. These constants ensure consistent key formatting
 * and prevent key collisions across the application.
 */

import { JourneyType } from '@austa/interfaces/gamification';

/**
 * Base namespace for all gamification engine Redis keys
 * Ensures no collision with other services using the same Redis instance
 */
export const REDIS_NAMESPACE = 'gamification';

/**
 * Prefix for all leaderboard-related Redis keys
 */
export const LEADERBOARD_PREFIX = `${REDIS_NAMESPACE}:leaderboard`;

/**
 * Prefix for all achievement-related Redis keys
 */
export const ACHIEVEMENT_PREFIX = `${REDIS_NAMESPACE}:achievement`;

/**
 * Prefix for all quest-related Redis keys
 */
export const QUEST_PREFIX = `${REDIS_NAMESPACE}:quest`;

/**
 * Prefix for all reward-related Redis keys
 */
export const REWARD_PREFIX = `${REDIS_NAMESPACE}:reward`;

/**
 * Prefix for all user profile-related Redis keys
 */
export const PROFILE_PREFIX = `${REDIS_NAMESPACE}:profile`;

/**
 * Prefix for all event-related Redis keys
 */
export const EVENT_PREFIX = `${REDIS_NAMESPACE}:event`;

/**
 * Prefix for all rule-related Redis keys
 */
export const RULE_PREFIX = `${REDIS_NAMESPACE}:rule`;

/**
 * Prefix for all cache-related Redis keys
 */
export const CACHE_PREFIX = `${REDIS_NAMESPACE}:cache`;

/**
 * Prefix for all lock-related Redis keys
 */
export const LOCK_PREFIX = `${REDIS_NAMESPACE}:lock`;

/**
 * Prefix for all rate-limiting-related Redis keys
 */
export const RATE_LIMIT_PREFIX = `${REDIS_NAMESPACE}:rate-limit`;

/**
 * Prefix for all session-related Redis keys
 */
export const SESSION_PREFIX = `${REDIS_NAMESPACE}:session`;

/**
 * Prefix for all temporary data-related Redis keys
 */
export const TEMP_PREFIX = `${REDIS_NAMESPACE}:temp`;

/**
 * Expiration times for different cache categories (in seconds)
 */
export const EXPIRATION_TIMES = {
  /**
   * Default expiration time for cached data (1 hour)
   */
  DEFAULT: 3600,
  
  /**
   * Short-lived cache for frequently changing data (5 minutes)
   */
  SHORT: 300,
  
  /**
   * Medium-lived cache for moderately changing data (30 minutes)
   */
  MEDIUM: 1800,
  
  /**
   * Long-lived cache for rarely changing data (24 hours)
   */
  LONG: 86400,
  
  /**
   * Very long-lived cache for static data (7 days)
   */
  VERY_LONG: 604800,
  
  /**
   * Expiration time for leaderboard data (1 hour)
   */
  LEADERBOARD: 3600,
  
  /**
   * Expiration time for daily leaderboards (24 hours)
   */
  DAILY_LEADERBOARD: 86400,
  
  /**
   * Expiration time for weekly leaderboards (7 days)
   */
  WEEKLY_LEADERBOARD: 604800,
  
  /**
   * Expiration time for monthly leaderboards (30 days)
   */
  MONTHLY_LEADERBOARD: 2592000,
  
  /**
   * Expiration time for user profile data (15 minutes)
   */
  USER_PROFILE: 900,
  
  /**
   * Expiration time for achievement data (30 minutes)
   */
  ACHIEVEMENT: 1800,
  
  /**
   * Expiration time for quest data (15 minutes)
   */
  QUEST: 900,
  
  /**
   * Expiration time for reward data (30 minutes)
   */
  REWARD: 1800,
  
  /**
   * Expiration time for event processing locks (5 minutes)
   */
  EVENT_LOCK: 300,
  
  /**
   * Expiration time for rate limiting (1 minute)
   */
  RATE_LIMIT: 60,
  
  /**
   * Expiration time for user sessions (24 hours)
   */
  SESSION: 86400,
  
  /**
   * Expiration time for temporary data (10 minutes)
   */
  TEMP: 600
};

/**
 * Journey-specific Redis key prefixes
 */
export const JOURNEY_PREFIXES = {
  /**
   * Prefix for health journey-related Redis keys
   */
  [JourneyType.HEALTH]: 'health',
  
  /**
   * Prefix for care journey-related Redis keys
   */
  [JourneyType.CARE]: 'care',
  
  /**
   * Prefix for plan journey-related Redis keys
   */
  [JourneyType.PLAN]: 'plan'
};

/**
 * Timeframe-specific Redis key suffixes
 */
export const TIMEFRAME_SUFFIXES = {
  /**
   * Suffix for daily timeframe Redis keys
   */
  DAILY: 'daily',
  
  /**
   * Suffix for weekly timeframe Redis keys
   */
  WEEKLY: 'weekly',
  
  /**
   * Suffix for monthly timeframe Redis keys
   */
  MONTHLY: 'monthly',
  
  /**
   * Suffix for all-time timeframe Redis keys
   */
  ALL_TIME: 'all-time'
};

/**
 * Leaderboard-specific Redis key patterns
 */
export const LEADERBOARD_KEYS = {
  /**
   * Global leaderboard key
   */
  GLOBAL: `${LEADERBOARD_PREFIX}:global`,
  
  /**
   * Journey-specific leaderboard key pattern
   * Usage: formatKey(LEADERBOARD_KEYS.JOURNEY, journeyType)
   */
  JOURNEY: `${LEADERBOARD_PREFIX}:journey:%s`,
  
  /**
   * Timeframe-specific leaderboard key pattern
   * Usage: formatKey(LEADERBOARD_KEYS.TIMEFRAME, timeframeSuffix)
   */
  TIMEFRAME: `${LEADERBOARD_PREFIX}:timeframe:%s`,
  
  /**
   * Journey and timeframe-specific leaderboard key pattern
   * Usage: formatKey(LEADERBOARD_KEYS.JOURNEY_TIMEFRAME, journeyType, timeframeSuffix)
   */
  JOURNEY_TIMEFRAME: `${LEADERBOARD_PREFIX}:journey:%s:timeframe:%s`,
  
  /**
   * User score key pattern
   * Usage: formatKey(LEADERBOARD_KEYS.USER_SCORE, userId)
   */
  USER_SCORE: `${LEADERBOARD_PREFIX}:user:%s:score`,
  
  /**
   * User journey score key pattern
   * Usage: formatKey(LEADERBOARD_KEYS.USER_JOURNEY_SCORE, userId, journeyType)
   */
  USER_JOURNEY_SCORE: `${LEADERBOARD_PREFIX}:user:%s:journey:%s:score`
};

/**
 * Achievement-specific Redis key patterns
 */
export const ACHIEVEMENT_KEYS = {
  /**
   * User achievements key pattern
   * Usage: formatKey(ACHIEVEMENT_KEYS.USER_ACHIEVEMENTS, userId)
   */
  USER_ACHIEVEMENTS: `${ACHIEVEMENT_PREFIX}:user:%s`,
  
  /**
   * User journey achievements key pattern
   * Usage: formatKey(ACHIEVEMENT_KEYS.USER_JOURNEY_ACHIEVEMENTS, userId, journeyType)
   */
  USER_JOURNEY_ACHIEVEMENTS: `${ACHIEVEMENT_PREFIX}:user:%s:journey:%s`,
  
  /**
   * Achievement details key pattern
   * Usage: formatKey(ACHIEVEMENT_KEYS.ACHIEVEMENT_DETAILS, achievementId)
   */
  ACHIEVEMENT_DETAILS: `${ACHIEVEMENT_PREFIX}:details:%s`,
  
  /**
   * Achievement progress key pattern
   * Usage: formatKey(ACHIEVEMENT_KEYS.ACHIEVEMENT_PROGRESS, userId, achievementId)
   */
  ACHIEVEMENT_PROGRESS: `${ACHIEVEMENT_PREFIX}:progress:%s:%s`
};

/**
 * Quest-specific Redis key patterns
 */
export const QUEST_KEYS = {
  /**
   * Active quests key pattern
   * Usage: formatKey(QUEST_KEYS.ACTIVE_QUESTS, userId)
   */
  ACTIVE_QUESTS: `${QUEST_PREFIX}:active:%s`,
  
  /**
   * Journey active quests key pattern
   * Usage: formatKey(QUEST_KEYS.JOURNEY_ACTIVE_QUESTS, userId, journeyType)
   */
  JOURNEY_ACTIVE_QUESTS: `${QUEST_PREFIX}:active:%s:journey:%s`,
  
  /**
   * Quest details key pattern
   * Usage: formatKey(QUEST_KEYS.QUEST_DETAILS, questId)
   */
  QUEST_DETAILS: `${QUEST_PREFIX}:details:%s`,
  
  /**
   * Quest progress key pattern
   * Usage: formatKey(QUEST_KEYS.QUEST_PROGRESS, userId, questId)
   */
  QUEST_PROGRESS: `${QUEST_PREFIX}:progress:%s:%s`
};

/**
 * Reward-specific Redis key patterns
 */
export const REWARD_KEYS = {
  /**
   * User rewards key pattern
   * Usage: formatKey(REWARD_KEYS.USER_REWARDS, userId)
   */
  USER_REWARDS: `${REWARD_PREFIX}:user:%s`,
  
  /**
   * User journey rewards key pattern
   * Usage: formatKey(REWARD_KEYS.USER_JOURNEY_REWARDS, userId, journeyType)
   */
  USER_JOURNEY_REWARDS: `${REWARD_PREFIX}:user:%s:journey:%s`,
  
  /**
   * Reward details key pattern
   * Usage: formatKey(REWARD_KEYS.REWARD_DETAILS, rewardId)
   */
  REWARD_DETAILS: `${REWARD_PREFIX}:details:%s`,
  
  /**
   * Available rewards key pattern
   * Usage: formatKey(REWARD_KEYS.AVAILABLE_REWARDS, journeyType)
   */
  AVAILABLE_REWARDS: `${REWARD_PREFIX}:available:%s`
};

/**
 * Profile-specific Redis key patterns
 */
export const PROFILE_KEYS = {
  /**
   * User profile key pattern
   * Usage: formatKey(PROFILE_KEYS.USER_PROFILE, userId)
   */
  USER_PROFILE: `${PROFILE_PREFIX}:user:%s`,
  
  /**
   * User journey profile key pattern
   * Usage: formatKey(PROFILE_KEYS.USER_JOURNEY_PROFILE, userId, journeyType)
   */
  USER_JOURNEY_PROFILE: `${PROFILE_PREFIX}:user:%s:journey:%s`,
  
  /**
   * User level key pattern
   * Usage: formatKey(PROFILE_KEYS.USER_LEVEL, userId)
   */
  USER_LEVEL: `${PROFILE_PREFIX}:user:%s:level`,
  
  /**
   * User XP key pattern
   * Usage: formatKey(PROFILE_KEYS.USER_XP, userId)
   */
  USER_XP: `${PROFILE_PREFIX}:user:%s:xp`
};

/**
 * Event-specific Redis key patterns
 */
export const EVENT_KEYS = {
  /**
   * Event processing lock key pattern
   * Usage: formatKey(EVENT_KEYS.PROCESSING_LOCK, eventId)
   */
  PROCESSING_LOCK: `${LOCK_PREFIX}:event:%s`,
  
  /**
   * Event processing status key pattern
   * Usage: formatKey(EVENT_KEYS.PROCESSING_STATUS, eventId)
   */
  PROCESSING_STATUS: `${EVENT_PREFIX}:status:%s`,
  
  /**
   * User recent events key pattern
   * Usage: formatKey(EVENT_KEYS.USER_RECENT_EVENTS, userId)
   */
  USER_RECENT_EVENTS: `${EVENT_PREFIX}:user:%s:recent`,
  
  /**
   * User journey recent events key pattern
   * Usage: formatKey(EVENT_KEYS.USER_JOURNEY_RECENT_EVENTS, userId, journeyType)
   */
  USER_JOURNEY_RECENT_EVENTS: `${EVENT_PREFIX}:user:%s:journey:%s:recent`
};

/**
 * Cache-specific Redis key patterns
 */
export const CACHE_KEYS = {
  /**
   * Generic cache key pattern
   * Usage: formatKey(CACHE_KEYS.GENERIC, cacheKey)
   */
  GENERIC: `${CACHE_PREFIX}:%s`,
  
  /**
   * Journey-specific cache key pattern
   * Usage: formatKey(CACHE_KEYS.JOURNEY, journeyType, cacheKey)
   */
  JOURNEY: `${CACHE_PREFIX}:journey:%s:%s`
};

/**
 * Rate limit-specific Redis key patterns
 */
export const RATE_LIMIT_KEYS = {
  /**
   * API rate limit key pattern
   * Usage: formatKey(RATE_LIMIT_KEYS.API, userId)
   */
  API: `${RATE_LIMIT_PREFIX}:api:%s`,
  
  /**
   * Event submission rate limit key pattern
   * Usage: formatKey(RATE_LIMIT_KEYS.EVENT_SUBMISSION, userId, eventType)
   */
  EVENT_SUBMISSION: `${RATE_LIMIT_PREFIX}:event:%s:%s`
};

/**
 * Lock-specific Redis key patterns
 */
export const LOCK_KEYS = {
  /**
   * Generic resource lock key pattern
   * Usage: formatKey(LOCK_KEYS.RESOURCE, resourceType, resourceId)
   */
  RESOURCE: `${LOCK_PREFIX}:%s:%s`,
  
  /**
   * User update lock key pattern
   * Usage: formatKey(LOCK_KEYS.USER_UPDATE, userId)
   */
  USER_UPDATE: `${LOCK_PREFIX}:user:%s`
};

/**
 * Formats a Redis key pattern with provided values
 * @param pattern Key pattern with %s placeholders
 * @param values Values to insert into the pattern
 * @returns Formatted key string
 */
export function formatKey(pattern: string, ...values: any[]): string {
  let result = pattern;
  for (const value of values) {
    result = result.replace('%s', value);
  }
  return result;
}

/**
 * Gets the appropriate expiration time for a journey-specific key
 * @param journey Journey type
 * @param defaultExpiration Default expiration time if no journey-specific time is defined
 * @returns Expiration time in seconds
 */
export function getJourneyExpiration(journey: JourneyType, defaultExpiration = EXPIRATION_TIMES.DEFAULT): number {
  switch (journey) {
    case JourneyType.HEALTH:
      return EXPIRATION_TIMES.MEDIUM;
    case JourneyType.CARE:
      return EXPIRATION_TIMES.SHORT;
    case JourneyType.PLAN:
      return EXPIRATION_TIMES.LONG;
    default:
      return defaultExpiration;
  }
}

/**
 * Gets the appropriate expiration time for a timeframe-specific leaderboard
 * @param timeframe Timeframe type (daily, weekly, monthly, all-time)
 * @returns Expiration time in seconds
 */
export function getTimeframeExpiration(timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time'): number {
  switch (timeframe) {
    case 'daily':
      return EXPIRATION_TIMES.DAILY_LEADERBOARD;
    case 'weekly':
      return EXPIRATION_TIMES.WEEKLY_LEADERBOARD;
    case 'monthly':
      return EXPIRATION_TIMES.MONTHLY_LEADERBOARD;
    case 'all-time':
    default:
      return EXPIRATION_TIMES.LEADERBOARD;
  }
}

/**
 * Builds a cache key with proper namespacing
 * @param key Base key name
 * @param journey Optional journey type for journey-specific keys
 * @returns Properly formatted cache key
 */
export function buildCacheKey(key: string, journey?: JourneyType): string {
  if (journey) {
    return formatKey(CACHE_KEYS.JOURNEY, journey, key);
  }
  return formatKey(CACHE_KEYS.GENERIC, key);
}

/**
 * Builds a leaderboard key with proper namespacing
 * @param journey Journey type or null for global leaderboard
 * @param timeframe Optional timeframe for time-specific leaderboards
 * @returns Properly formatted leaderboard key
 */
export function buildLeaderboardKey(
  journey: JourneyType | null,
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time'
): string {
  if (!journey && !timeframe) {
    return LEADERBOARD_KEYS.GLOBAL;
  }
  
  if (journey && !timeframe) {
    return formatKey(LEADERBOARD_KEYS.JOURNEY, journey);
  }
  
  if (!journey && timeframe) {
    return formatKey(LEADERBOARD_KEYS.TIMEFRAME, timeframe);
  }
  
  return formatKey(LEADERBOARD_KEYS.JOURNEY_TIMEFRAME, journey, timeframe);
}

/**
 * Builds a user profile key with proper namespacing
 * @param userId User ID
 * @param journey Optional journey type for journey-specific profile
 * @returns Properly formatted user profile key
 */
export function buildUserProfileKey(userId: string, journey?: JourneyType): string {
  if (journey) {
    return formatKey(PROFILE_KEYS.USER_JOURNEY_PROFILE, userId, journey);
  }
  return formatKey(PROFILE_KEYS.USER_PROFILE, userId);
}

/**
 * Builds a lock key with proper namespacing and expiration
 * @param resourceType Type of resource to lock
 * @param resourceId ID of the resource to lock
 * @returns Properly formatted lock key
 */
export function buildLockKey(resourceType: string, resourceId: string): string {
  return formatKey(LOCK_KEYS.RESOURCE, resourceType, resourceId);
}