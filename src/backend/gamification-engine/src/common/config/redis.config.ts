import { registerAs } from '@nestjs/config';
import { RedisOptions } from 'ioredis';
import { JourneyType } from '@austa/interfaces/journey';

/**
 * Redis configuration for the Gamification Engine.
 * This module provides Redis connection settings, key prefixes, TTL values,
 * and Sorted Sets configuration for leaderboards.
 * 
 * @module RedisConfig
 */
export const redisConfig = registerAs('redis', () => ({
  /**
   * Connection settings for Redis
   */
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    /**
     * Connection resilience settings
     */
    retryStrategy: (times: number): number | null => {
      // Maximum retry attempts
      const maxRetryAttempts = parseInt(process.env.REDIS_MAX_RETRY_ATTEMPTS, 10) || 10;
      
      if (times > maxRetryAttempts) {
        console.error(`[Redis] Maximum retry attempts (${maxRetryAttempts}) reached. Giving up.`);
        return null; // Stop retrying
      }
      
      // Exponential backoff with jitter: min(1000 * 2^times, 30000) + random(0-1000)
      const delay = Math.min(1000 * Math.pow(2, times), 30000) + Math.floor(Math.random() * 1000);
      console.warn(`[Redis] Connection attempt failed. Retrying in ${delay}ms...`);
      return delay;
    },
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT, 10) || 10000, // 10 seconds
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST, 10) || 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    /**
     * TLS configuration if Redis requires secure connection
     */
    tls: process.env.REDIS_USE_TLS === 'true' ? {
      rejectUnauthorized: process.env.REDIS_REJECT_UNAUTHORIZED !== 'false',
    } : undefined,
  } as RedisOptions,

  /**
   * Key prefix for all Redis keys to avoid collisions with other services
   */
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'game:',

  /**
   * TTL (Time-To-Live) values in seconds for different data types
   */
  ttl: {
    /**
     * Default TTL for cache entries if not specified
     */
    default: parseInt(process.env.REDIS_TTL_DEFAULT, 10) || 3600, // 1 hour
    // User-related caches
    userProfile: parseInt(process.env.REDIS_TTL_USER_PROFILE, 10) || 300, // 5 minutes
    userAchievements: parseInt(process.env.REDIS_TTL_USER_ACHIEVEMENTS, 10) || 3600, // 1 hour
    userQuests: parseInt(process.env.REDIS_TTL_USER_QUESTS, 10) || 1800, // 30 minutes
    userRewards: parseInt(process.env.REDIS_TTL_USER_REWARDS, 10) || 3600, // 1 hour
    
    // Game mechanics caches
    achievements: parseInt(process.env.REDIS_TTL_ACHIEVEMENTS, 10) || 3600, // 1 hour
    quests: parseInt(process.env.REDIS_TTL_QUESTS, 10) || 3600, // 1 hour
    rewards: parseInt(process.env.REDIS_TTL_REWARDS, 10) || 3600, // 1 hour
    rules: parseInt(process.env.REDIS_TTL_RULES, 10) || 600, // 10 minutes
    
    // Leaderboard caches
    leaderboard: parseInt(process.env.REDIS_TTL_LEADERBOARD, 10) || 900, // 15 minutes
    journeyLeaderboard: parseInt(process.env.REDIS_TTL_JOURNEY_LEADERBOARD, 10) || 900, // 15 minutes
    
    // Event processing caches
    eventProcessing: parseInt(process.env.REDIS_TTL_EVENT_PROCESSING, 10) || 86400, // 24 hours
    eventDeduplication: parseInt(process.env.REDIS_TTL_EVENT_DEDUPLICATION, 10) || 86400, // 24 hours
  },

  /**
   * Sorted Sets configuration for leaderboards
   * Implements enhanced Redis Sorted Sets integration for improved leaderboard functionality
   */
  sortedSets: {
    /**
     * Leaderboard implementation options
     */
    options: {
      // Whether to use lexicographical ordering for tie-breaking
      useLexicographicalOrder: process.env.REDIS_LEADERBOARD_USE_LEX_ORDER === 'true',
      // Whether to store additional metadata with each entry
      storeMetadata: process.env.REDIS_LEADERBOARD_STORE_METADATA !== 'false', // Enabled by default
      // Whether to use separate sets for different time periods
      useTimeBasedSets: process.env.REDIS_LEADERBOARD_USE_TIME_BASED_SETS !== 'false', // Enabled by default
      // Whether to cache leaderboard results
      cacheResults: process.env.REDIS_LEADERBOARD_CACHE_RESULTS !== 'false', // Enabled by default
      // Cache TTL for leaderboard results in seconds
      cacheResultsTtl: parseInt(process.env.REDIS_LEADERBOARD_CACHE_RESULTS_TTL, 10) || 60, // 1 minute
    },
    /**
     * Key patterns for different leaderboard types
     */
    keyPatterns: {
      globalLeaderboard: 'leaderboard:global',
      journeyLeaderboard: (journeyType: JourneyType) => `leaderboard:journey:${journeyType}`,
      weeklyLeaderboard: (weekNumber: number) => `leaderboard:weekly:${weekNumber}`,
      monthlyLeaderboard: (yearMonth: string) => `leaderboard:monthly:${yearMonth}`,
      questLeaderboard: (questId: string) => `leaderboard:quest:${questId}`,
    },
    
    /**
     * Maximum number of entries to keep in each leaderboard
     */
    maxEntries: {
      globalLeaderboard: parseInt(process.env.REDIS_LEADERBOARD_MAX_ENTRIES_GLOBAL, 10) || 1000,
      journeyLeaderboard: parseInt(process.env.REDIS_LEADERBOARD_MAX_ENTRIES_JOURNEY, 10) || 500,
      weeklyLeaderboard: parseInt(process.env.REDIS_LEADERBOARD_MAX_ENTRIES_WEEKLY, 10) || 100,
      monthlyLeaderboard: parseInt(process.env.REDIS_LEADERBOARD_MAX_ENTRIES_MONTHLY, 10) || 500,
      questLeaderboard: parseInt(process.env.REDIS_LEADERBOARD_MAX_ENTRIES_QUEST, 10) || 100,
    },
    
    /**
     * Update intervals in milliseconds for different leaderboard types
     */
    updateIntervals: {
      globalLeaderboard: parseInt(process.env.REDIS_LEADERBOARD_UPDATE_INTERVAL_GLOBAL, 10) || 900000, // 15 minutes
      journeyLeaderboard: parseInt(process.env.REDIS_LEADERBOARD_UPDATE_INTERVAL_JOURNEY, 10) || 600000, // 10 minutes
      weeklyLeaderboard: parseInt(process.env.REDIS_LEADERBOARD_UPDATE_INTERVAL_WEEKLY, 10) || 300000, // 5 minutes
      monthlyLeaderboard: parseInt(process.env.REDIS_LEADERBOARD_UPDATE_INTERVAL_MONTHLY, 10) || 1800000, // 30 minutes
      questLeaderboard: parseInt(process.env.REDIS_LEADERBOARD_UPDATE_INTERVAL_QUEST, 10) || 300000, // 5 minutes
    },
  },

  /**
   * Cache invalidation policies for different data types
   */
  invalidation: {
    /**
     * Invalidation strategies
     * - 'time': Based on TTL
     * - 'event': Based on specific events
     * - 'manual': Manual invalidation only
     * - 'hybrid': Combination of time and event-based invalidation
     */
    strategies: {
      userProfile: 'hybrid' as const,
      userAchievements: 'event' as const,
      userQuests: 'event' as const,
      userRewards: 'event' as const,
      achievements: 'time' as const,
      quests: 'time' as const,
      rewards: 'time' as const,
      rules: 'event' as const,
      leaderboard: 'hybrid' as const,
      journeyLeaderboard: 'hybrid' as const,
      eventProcessing: 'time' as const,
      eventDeduplication: 'time' as const,
    },
    
    /**
     * Cache key patterns for different data types
     * Used for targeted invalidation
     */
    keyPatterns: {
      userProfile: (userId: string) => `user:${userId}:profile`,
      userAchievements: (userId: string) => `user:${userId}:achievements`,
      userQuests: (userId: string) => `user:${userId}:quests`,
      userRewards: (userId: string) => `user:${userId}:rewards`,
      achievement: (achievementId: string) => `achievement:${achievementId}`,
      quest: (questId: string) => `quest:${questId}`,
      reward: (rewardId: string) => `reward:${rewardId}`,
      rule: (ruleId: string) => `rule:${ruleId}`,
      journeyUserData: (userId: string, journeyType: JourneyType) => `user:${userId}:journey:${journeyType}`,
    },
    
    /**
     * Events that trigger cache invalidation
     */
    events: {
      userProfile: ['user.updated', 'user.level.changed', 'user.xp.added'],
      userAchievements: ['achievement.unlocked', 'achievement.progress.updated'],
      userQuests: ['quest.started', 'quest.completed', 'quest.progress.updated'],
      userRewards: ['reward.earned', 'reward.redeemed', 'reward.expired'],
      rules: ['rule.created', 'rule.updated', 'rule.deleted'],
      leaderboard: ['user.level.changed', 'user.xp.added', 'leaderboard.recalculated'],
      journeyLeaderboard: ['journey.event.processed', 'journey.milestone.reached'],
    },
  },

  /**
   * Pub/Sub channels for real-time updates
   */
  pubSub: {
    channels: {
      achievementUnlocked: 'channel:achievement:unlocked',
      questCompleted: 'channel:quest:completed',
      rewardEarned: 'channel:reward:earned',
      leaderboardUpdated: 'channel:leaderboard:updated',
      levelUp: 'channel:user:levelup',
      journeyEvent: (journeyType: JourneyType) => `channel:journey:${journeyType}:event`,
    },
    
    /**
     * Pattern subscriptions for grouped events
     */
    patterns: {
      allAchievements: 'channel:achievement:*',
      allQuests: 'channel:quest:*',
      allRewards: 'channel:reward:*',
      allJourneyEvents: 'channel:journey:*:event',
      allUserEvents: 'channel:user:*',
    },
  },

  /**
   * Sentinel configuration for Redis high availability
   * Only used if REDIS_USE_SENTINEL is set to 'true'
   */
  sentinel: process.env.REDIS_USE_SENTINEL === 'true' ? {
    sentinels: (process.env.REDIS_SENTINEL_NODES || 'localhost:26379').split(',').map(node => {
      const [host, port] = node.split(':');
      return {
        host,
        port: parseInt(port, 10),
      };
    }),
    name: process.env.REDIS_SENTINEL_MASTER_NAME || 'mymaster',
    password: process.env.REDIS_SENTINEL_PASSWORD || '',
    retryStrategy: (times: number): number | null => {
      const maxRetryAttempts = parseInt(process.env.REDIS_SENTINEL_MAX_RETRY_ATTEMPTS, 10) || 10;
      if (times > maxRetryAttempts) {
        return null; // Stop retrying
      }
      return Math.min(1000 * Math.pow(2, times), 30000);
    },
  } : undefined,

  /**
   * Cluster configuration for Redis Cluster mode
   * Only used if REDIS_USE_CLUSTER is set to 'true'
   */
  cluster: process.env.REDIS_USE_CLUSTER === 'true' ? {
    nodes: (process.env.REDIS_CLUSTER_NODES || 'localhost:6379').split(',').map(node => {
      const [host, port] = node.split(':');
      return {
        host,
        port: parseInt(port, 10),
      };
    }),
    options: {
      redisOptions: {
        password: process.env.REDIS_PASSWORD || '',
        tls: process.env.REDIS_USE_TLS === 'true' ? {
          rejectUnauthorized: process.env.REDIS_REJECT_UNAUTHORIZED !== 'false',
        } : undefined,
      },
      maxRedirections: parseInt(process.env.REDIS_CLUSTER_MAX_REDIRECTIONS, 10) || 16,
      retryDelayOnFailover: parseInt(process.env.REDIS_CLUSTER_RETRY_DELAY_FAILOVER, 10) || 100,
      retryDelayOnClusterDown: parseInt(process.env.REDIS_CLUSTER_RETRY_DELAY_DOWN, 10) || 500,
      scaleReads: process.env.REDIS_CLUSTER_SCALE_READS || 'master',
    },
  } : undefined,
}));