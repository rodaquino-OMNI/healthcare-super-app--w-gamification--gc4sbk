/**
 * Redis key constants for the gamification engine.
 * 
 * This file defines all Redis key patterns used throughout the gamification engine
 * for caching, leaderboards, and temporary data storage. These constants ensure
 * consistent key formatting and prevent key collisions across the application.
 */

/**
 * Base namespace for all gamification engine Redis keys
 * Ensures no collisions with other services using the same Redis instance
 */
export const REDIS_NAMESPACE = 'gamification';

/**
 * Separator used in Redis key construction
 */
export const KEY_SEPARATOR = ':';

/**
 * Default expiration times (in seconds) for different cache categories
 */
export const EXPIRATION_TIMES = {
  // Short-lived cache (1 minute)
  SHORT: 60,
  
  // Medium-lived cache (10 minutes)
  MEDIUM: 600,
  
  // Long-lived cache (1 hour)
  LONG: 3600,
  
  // Extended cache (6 hours)
  EXTENDED: 21600,
  
  // Daily cache (24 hours)
  DAILY: 86400,
  
  // Weekly cache (7 days)
  WEEKLY: 604800,
  
  // Leaderboard-specific cache times
  LEADERBOARD: {
    // Global leaderboard (1 hour)
    GLOBAL: 3600,
    
    // Health journey leaderboard (30 minutes)
    HEALTH: 1800,
    
    // Care journey leaderboard (30 minutes)
    CARE: 1800,
    
    // Plan journey leaderboard (30 minutes)
    PLAN: 1800,
    
    // Daily leaderboard (15 minutes)
    DAILY: 900,
    
    // Weekly leaderboard (1 hour)
    WEEKLY: 3600,
    
    // Monthly leaderboard (2 hours)
    MONTHLY: 7200,
  },
  
  // Achievement-specific cache times
  ACHIEVEMENT: {
    // User achievements (15 minutes)
    USER: 900,
    
    // Achievement definitions (1 hour)
    DEFINITIONS: 3600,
    
    // Recent achievements (5 minutes)
    RECENT: 300,
  },
  
  // Profile-specific cache times
  PROFILE: {
    // User profile (10 minutes)
    USER: 600,
    
    // User stats (5 minutes)
    STATS: 300,
  },
  
  // Quest-specific cache times
  QUEST: {
    // Available quests (15 minutes)
    AVAILABLE: 900,
    
    // User quests (5 minutes)
    USER: 300,
  },
  
  // Reward-specific cache times
  REWARD: {
    // Available rewards (30 minutes)
    AVAILABLE: 1800,
    
    // User rewards (10 minutes)
    USER: 600,
  },
};

/**
 * Redis key prefixes for different data types
 */
export const KEY_PREFIXES = {
  // Leaderboard keys
  LEADERBOARD: `${REDIS_NAMESPACE}${KEY_SEPARATOR}leaderboard`,
  
  // Achievement keys
  ACHIEVEMENT: `${REDIS_NAMESPACE}${KEY_SEPARATOR}achievement`,
  
  // Profile keys
  PROFILE: `${REDIS_NAMESPACE}${KEY_SEPARATOR}profile`,
  
  // Quest keys
  QUEST: `${REDIS_NAMESPACE}${KEY_SEPARATOR}quest`,
  
  // Reward keys
  REWARD: `${REDIS_NAMESPACE}${KEY_SEPARATOR}reward`,
  
  // Event processing keys
  EVENT: `${REDIS_NAMESPACE}${KEY_SEPARATOR}event`,
  
  // Lock keys for distributed operations
  LOCK: `${REDIS_NAMESPACE}${KEY_SEPARATOR}lock`,
  
  // Cache keys for general purpose caching
  CACHE: `${REDIS_NAMESPACE}${KEY_SEPARATOR}cache`,
};

/**
 * Redis keys for leaderboards
 */
export const LEADERBOARD_KEYS = {
  // Prefix for all leaderboard keys
  PREFIX: KEY_PREFIXES.LEADERBOARD,
  
  // Global leaderboard (across all journeys)
  GLOBAL: `${KEY_PREFIXES.LEADERBOARD}${KEY_SEPARATOR}global`,
  
  // Journey-specific leaderboards
  JOURNEY: {
    // Health journey leaderboard
    HEALTH: `${KEY_PREFIXES.LEADERBOARD}${KEY_SEPARATOR}health`,
    
    // Care journey leaderboard
    CARE: `${KEY_PREFIXES.LEADERBOARD}${KEY_SEPARATOR}care`,
    
    // Plan journey leaderboard
    PLAN: `${KEY_PREFIXES.LEADERBOARD}${KEY_SEPARATOR}plan`,
  },
  
  // Time-based leaderboards
  TIME_BASED: {
    // Daily leaderboard prefix
    DAILY_PREFIX: `${KEY_PREFIXES.LEADERBOARD}${KEY_SEPARATOR}daily`,
    
    // Weekly leaderboard prefix
    WEEKLY_PREFIX: `${KEY_PREFIXES.LEADERBOARD}${KEY_SEPARATOR}weekly`,
    
    // Monthly leaderboard prefix
    MONTHLY_PREFIX: `${KEY_PREFIXES.LEADERBOARD}${KEY_SEPARATOR}monthly`,
  },
};

/**
 * Redis keys for achievements
 */
export const ACHIEVEMENT_KEYS = {
  // Prefix for all achievement keys
  PREFIX: KEY_PREFIXES.ACHIEVEMENT,
  
  // User achievements
  USER_PREFIX: `${KEY_PREFIXES.ACHIEVEMENT}${KEY_SEPARATOR}user`,
  
  // Achievement definitions
  DEFINITIONS: `${KEY_PREFIXES.ACHIEVEMENT}${KEY_SEPARATOR}definitions`,
  
  // Recent achievements (for notifications)
  RECENT: `${KEY_PREFIXES.ACHIEVEMENT}${KEY_SEPARATOR}recent`,
  
  // Journey-specific achievement counts
  JOURNEY_COUNTS: {
    // Health journey achievement count
    HEALTH: `${KEY_PREFIXES.ACHIEVEMENT}${KEY_SEPARATOR}count${KEY_SEPARATOR}health`,
    
    // Care journey achievement count
    CARE: `${KEY_PREFIXES.ACHIEVEMENT}${KEY_SEPARATOR}count${KEY_SEPARATOR}care`,
    
    // Plan journey achievement count
    PLAN: `${KEY_PREFIXES.ACHIEVEMENT}${KEY_SEPARATOR}count${KEY_SEPARATOR}plan`,
  },
};

/**
 * Redis keys for profiles
 */
export const PROFILE_KEYS = {
  // Prefix for all profile keys
  PREFIX: KEY_PREFIXES.PROFILE,
  
  // User profile
  USER_PREFIX: `${KEY_PREFIXES.PROFILE}${KEY_SEPARATOR}user`,
  
  // User stats
  STATS_PREFIX: `${KEY_PREFIXES.PROFILE}${KEY_SEPARATOR}stats`,
  
  // User journey progress
  JOURNEY_PROGRESS_PREFIX: `${KEY_PREFIXES.PROFILE}${KEY_SEPARATOR}journey`,
};

/**
 * Redis keys for quests
 */
export const QUEST_KEYS = {
  // Prefix for all quest keys
  PREFIX: KEY_PREFIXES.QUEST,
  
  // Available quests
  AVAILABLE: `${KEY_PREFIXES.QUEST}${KEY_SEPARATOR}available`,
  
  // User quests
  USER_PREFIX: `${KEY_PREFIXES.QUEST}${KEY_SEPARATOR}user`,
  
  // Journey-specific quests
  JOURNEY: {
    // Health journey quests
    HEALTH: `${KEY_PREFIXES.QUEST}${KEY_SEPARATOR}journey${KEY_SEPARATOR}health`,
    
    // Care journey quests
    CARE: `${KEY_PREFIXES.QUEST}${KEY_SEPARATOR}journey${KEY_SEPARATOR}care`,
    
    // Plan journey quests
    PLAN: `${KEY_PREFIXES.QUEST}${KEY_SEPARATOR}journey${KEY_SEPARATOR}plan`,
  },
};

/**
 * Redis keys for rewards
 */
export const REWARD_KEYS = {
  // Prefix for all reward keys
  PREFIX: KEY_PREFIXES.REWARD,
  
  // Available rewards
  AVAILABLE: `${KEY_PREFIXES.REWARD}${KEY_SEPARATOR}available`,
  
  // User rewards
  USER_PREFIX: `${KEY_PREFIXES.REWARD}${KEY_SEPARATOR}user`,
  
  // Journey-specific rewards
  JOURNEY: {
    // Health journey rewards
    HEALTH: `${KEY_PREFIXES.REWARD}${KEY_SEPARATOR}journey${KEY_SEPARATOR}health`,
    
    // Care journey rewards
    CARE: `${KEY_PREFIXES.REWARD}${KEY_SEPARATOR}journey${KEY_SEPARATOR}care`,
    
    // Plan journey rewards
    PLAN: `${KEY_PREFIXES.REWARD}${KEY_SEPARATOR}journey${KEY_SEPARATOR}plan`,
  },
};

/**
 * Redis keys for event processing
 */
export const EVENT_KEYS = {
  // Prefix for all event keys
  PREFIX: KEY_PREFIXES.EVENT,
  
  // Event processing locks
  LOCK_PREFIX: `${KEY_PREFIXES.EVENT}${KEY_SEPARATOR}lock`,
  
  // Event processing status
  STATUS_PREFIX: `${KEY_PREFIXES.EVENT}${KEY_SEPARATOR}status`,
  
  // Event batch processing
  BATCH_PREFIX: `${KEY_PREFIXES.EVENT}${KEY_SEPARATOR}batch`,
};

/**
 * Redis keys for distributed locks
 */
export const LOCK_KEYS = {
  // Prefix for all lock keys
  PREFIX: KEY_PREFIXES.LOCK,
  
  // Leaderboard refresh lock
  LEADERBOARD_REFRESH: `${KEY_PREFIXES.LOCK}${KEY_SEPARATOR}leaderboard_refresh`,
  
  // Achievement processing lock
  ACHIEVEMENT_PROCESSING: `${KEY_PREFIXES.LOCK}${KEY_SEPARATOR}achievement_processing`,
  
  // Quest update lock
  QUEST_UPDATE: `${KEY_PREFIXES.LOCK}${KEY_SEPARATOR}quest_update`,
  
  // Reward distribution lock
  REWARD_DISTRIBUTION: `${KEY_PREFIXES.LOCK}${KEY_SEPARATOR}reward_distribution`,
};

/**
 * Redis keys for general purpose caching
 */
export const CACHE_KEYS = {
  // Prefix for all cache keys
  PREFIX: KEY_PREFIXES.CACHE,
  
  // API response cache
  API_RESPONSE_PREFIX: `${KEY_PREFIXES.CACHE}${KEY_SEPARATOR}api`,
  
  // Computed data cache
  COMPUTED_DATA_PREFIX: `${KEY_PREFIXES.CACHE}${KEY_SEPARATOR}computed`,
};

/**
 * Consolidated export of all Redis keys
 */
export const REDIS_KEYS = {
  // Namespace and separator
  NAMESPACE: REDIS_NAMESPACE,
  SEPARATOR: KEY_SEPARATOR,
  
  // Expiration times
  EXPIRATION: EXPIRATION_TIMES,
  
  // Key prefixes
  ...KEY_PREFIXES,
  
  // Leaderboard keys
  LEADERBOARD_PREFIX: LEADERBOARD_KEYS.PREFIX,
  GLOBAL_LEADERBOARD: LEADERBOARD_KEYS.GLOBAL,
  JOURNEY_LEADERBOARD: LEADERBOARD_KEYS.JOURNEY,
  TIME_BASED_LEADERBOARD: LEADERBOARD_KEYS.TIME_BASED,
  
  // Achievement keys
  ACHIEVEMENT_PREFIX: ACHIEVEMENT_KEYS.PREFIX,
  USER_ACHIEVEMENTS_PREFIX: ACHIEVEMENT_KEYS.USER_PREFIX,
  ACHIEVEMENT_DEFINITIONS: ACHIEVEMENT_KEYS.DEFINITIONS,
  RECENT_ACHIEVEMENTS: ACHIEVEMENT_KEYS.RECENT,
  JOURNEY_ACHIEVEMENT_COUNTS: ACHIEVEMENT_KEYS.JOURNEY_COUNTS,
  
  // Profile keys
  PROFILE_PREFIX: PROFILE_KEYS.PREFIX,
  USER_PROFILE_PREFIX: PROFILE_KEYS.USER_PREFIX,
  USER_STATS_PREFIX: PROFILE_KEYS.STATS_PREFIX,
  JOURNEY_PROGRESS_PREFIX: PROFILE_KEYS.JOURNEY_PROGRESS_PREFIX,
  
  // Quest keys
  QUEST_PREFIX: QUEST_KEYS.PREFIX,
  AVAILABLE_QUESTS: QUEST_KEYS.AVAILABLE,
  USER_QUESTS_PREFIX: QUEST_KEYS.USER_PREFIX,
  JOURNEY_QUESTS: QUEST_KEYS.JOURNEY,
  
  // Reward keys
  REWARD_PREFIX: REWARD_KEYS.PREFIX,
  AVAILABLE_REWARDS: REWARD_KEYS.AVAILABLE,
  USER_REWARDS_PREFIX: REWARD_KEYS.USER_PREFIX,
  JOURNEY_REWARDS: REWARD_KEYS.JOURNEY,
  
  // Event keys
  EVENT_PREFIX: EVENT_KEYS.PREFIX,
  EVENT_LOCK_PREFIX: EVENT_KEYS.LOCK_PREFIX,
  EVENT_STATUS_PREFIX: EVENT_KEYS.STATUS_PREFIX,
  EVENT_BATCH_PREFIX: EVENT_KEYS.BATCH_PREFIX,
  
  // Lock keys
  LOCK_PREFIX: LOCK_KEYS.PREFIX,
  LEADERBOARD_REFRESH_LOCK: LOCK_KEYS.LEADERBOARD_REFRESH,
  ACHIEVEMENT_PROCESSING_LOCK: LOCK_KEYS.ACHIEVEMENT_PROCESSING,
  QUEST_UPDATE_LOCK: LOCK_KEYS.QUEST_UPDATE,
  REWARD_DISTRIBUTION_LOCK: LOCK_KEYS.REWARD_DISTRIBUTION,
  
  // Cache keys
  CACHE_PREFIX: CACHE_KEYS.PREFIX,
  API_RESPONSE_CACHE_PREFIX: CACHE_KEYS.API_RESPONSE_PREFIX,
  COMPUTED_DATA_CACHE_PREFIX: CACHE_KEYS.COMPUTED_DATA_PREFIX,
};

/**
 * Key builder functions for constructing Redis keys with proper namespacing
 */
export const RedisKeyBuilder = {
  /**
   * Build a user-specific key
   * @param prefix - Key prefix
   * @param userId - User ID
   * @returns Formatted Redis key
   */
  forUser: (prefix: string, userId: string): string => {
    return `${prefix}${KEY_SEPARATOR}${userId}`;
  },
  
  /**
   * Build a journey-specific key
   * @param prefix - Key prefix
   * @param journey - Journey identifier
   * @returns Formatted Redis key
   */
  forJourney: (prefix: string, journey: string): string => {
    return `${prefix}${KEY_SEPARATOR}${journey}`;
  },
  
  /**
   * Build a user and journey-specific key
   * @param prefix - Key prefix
   * @param userId - User ID
   * @param journey - Journey identifier
   * @returns Formatted Redis key
   */
  forUserJourney: (prefix: string, userId: string, journey: string): string => {
    return `${prefix}${KEY_SEPARATOR}${userId}${KEY_SEPARATOR}${journey}`;
  },
  
  /**
   * Build a time-based key with date
   * @param prefix - Key prefix
   * @param date - Date object or ISO string
   * @returns Formatted Redis key
   */
  forDate: (prefix: string, date: Date | string): string => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return `${prefix}${KEY_SEPARATOR}${dateStr}`;
  },
  
  /**
   * Build a time-based key with date for a specific journey
   * @param prefix - Key prefix
   * @param journey - Journey identifier
   * @param date - Date object or ISO string
   * @returns Formatted Redis key
   */
  forJourneyDate: (prefix: string, journey: string, date: Date | string): string => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return `${prefix}${KEY_SEPARATOR}${journey}${KEY_SEPARATOR}${dateStr}`;
  },
  
  /**
   * Build a time-based key with date for a specific user
   * @param prefix - Key prefix
   * @param userId - User ID
   * @param date - Date object or ISO string
   * @returns Formatted Redis key
   */
  forUserDate: (prefix: string, userId: string, date: Date | string): string => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return `${prefix}${KEY_SEPARATOR}${userId}${KEY_SEPARATOR}${dateStr}`;
  },
  
  /**
   * Build a lock key with optional owner identifier
   * @param lockName - Lock name
   * @param ownerId - Optional owner identifier
   * @returns Formatted Redis key
   */
  forLock: (lockName: string, ownerId?: string): string => {
    return ownerId
      ? `${LOCK_KEYS.PREFIX}${KEY_SEPARATOR}${lockName}${KEY_SEPARATOR}${ownerId}`
      : `${LOCK_KEYS.PREFIX}${KEY_SEPARATOR}${lockName}`;
  },
  
  /**
   * Build a cache key with optional parameters
   * @param cacheType - Cache type
   * @param params - Additional parameters to include in the key
   * @returns Formatted Redis key
   */
  forCache: (cacheType: string, ...params: string[]): string => {
    return [CACHE_KEYS.PREFIX, cacheType, ...params].join(KEY_SEPARATOR);
  },
  
  /**
   * Build a daily leaderboard key
   * @param journey - Journey identifier (or 'global')
   * @param date - Date object or ISO string
   * @returns Formatted Redis key
   */
  forDailyLeaderboard: (journey: string, date: Date | string): string => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return `${LEADERBOARD_KEYS.TIME_BASED.DAILY_PREFIX}${KEY_SEPARATOR}${journey}${KEY_SEPARATOR}${dateStr}`;
  },
  
  /**
   * Build a weekly leaderboard key
   * @param journey - Journey identifier (or 'global')
   * @param weekNumber - Week number (1-53)
   * @param year - Year (e.g., 2023)
   * @returns Formatted Redis key
   */
  forWeeklyLeaderboard: (journey: string, weekNumber: number, year: number): string => {
    return `${LEADERBOARD_KEYS.TIME_BASED.WEEKLY_PREFIX}${KEY_SEPARATOR}${journey}${KEY_SEPARATOR}${year}${KEY_SEPARATOR}${weekNumber}`;
  },
  
  /**
   * Build a monthly leaderboard key
   * @param journey - Journey identifier (or 'global')
   * @param month - Month number (1-12)
   * @param year - Year (e.g., 2023)
   * @returns Formatted Redis key
   */
  forMonthlyLeaderboard: (journey: string, month: number, year: number): string => {
    return `${LEADERBOARD_KEYS.TIME_BASED.MONTHLY_PREFIX}${KEY_SEPARATOR}${journey}${KEY_SEPARATOR}${year}${KEY_SEPARATOR}${month}`;
  },
};