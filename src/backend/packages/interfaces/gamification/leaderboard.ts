/**
 * @file Defines TypeScript interfaces for the gamification leaderboard system.
 * These interfaces provide a standardized contract for leaderboard data structures
 * that display user rankings based on XP and achievements across all journeys.
 */

/**
 * Represents the possible journey types in the AUSTA SuperApp.
 * Used to categorize leaderboards by journey context.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  ALL = 'all' // Cross-journey leaderboard
}

/**
 * Represents a single entry in a leaderboard.
 * Contains user ranking information and achievement statistics.
 */
export interface LeaderboardEntry {
  /**
   * The user's position in the leaderboard (1-based).
   */
  rank: number;

  /**
   * The unique identifier of the user.
   */
  userId: string;

  /**
   * Optional username for display purposes.
   */
  username?: string;

  /**
   * The user's current level in the gamification system.
   */
  level: number;

  /**
   * The user's experience points (XP).
   */
  xp: number;

  /**
   * The number of achievements the user has unlocked.
   */
  achievements: number;

  /**
   * Flag indicating if this entry represents the current user.
   * Used for highlighting in UI components.
   */
  isCurrentUser?: boolean;

  /**
   * Optional featured achievement to display with the leaderboard entry.
   */
  featuredAchievement?: {
    id: string;
    title: string;
    description: string;
    icon: string;
    journey: JourneyType;
    unlocked: boolean;
  };
}

/**
 * Configuration options for leaderboard retrieval.
 */
export interface LeaderboardOptions {
  /**
   * The journey context for the leaderboard.
   * Defaults to ALL if not specified.
   */
  journey?: JourneyType;

  /**
   * The maximum number of entries to retrieve.
   * Defaults to a system-defined value (typically 100).
   */
  limit?: number;

  /**
   * The number of entries to skip (for pagination).
   * Defaults to 0.
   */
  offset?: number;

  /**
   * Time period for the leaderboard (daily, weekly, monthly, all-time).
   * Defaults to all-time if not specified.
   */
  period?: 'daily' | 'weekly' | 'monthly' | 'all-time';

  /**
   * Whether to include the current user in the results even if they
   * don't make it into the top entries.
   * Defaults to true.
   */
  includeCurrentUser?: boolean;

  /**
   * Whether to include featured achievements with each entry.
   * Defaults to false.
   */
  includeFeaturedAchievements?: boolean;

  /**
   * Optional Redis cache TTL override in seconds.
   * If not provided, system defaults will be used.
   */
  cacheTTL?: number;
}

/**
 * Represents a complete leaderboard for a specific journey.
 */
export interface JourneyLeaderboard {
  /**
   * The journey this leaderboard belongs to.
   */
  journey: JourneyType;

  /**
   * The entries in the leaderboard, sorted by rank.
   */
  entries: LeaderboardEntry[];

  /**
   * The total number of users in the complete leaderboard.
   * This may be greater than the number of entries returned.
   */
  totalUsers: number;

  /**
   * The current user's entry, if requested and available.
   * This may be included even if the user doesn't appear in the entries array.
   */
  currentUser?: LeaderboardEntry;

  /**
   * Timestamp when the leaderboard was last updated.
   */
  updatedAt: Date;

  /**
   * The time period this leaderboard represents.
   */
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
}

/**
 * Response structure for leaderboard API endpoints.
 */
export interface LeaderboardResponse {
  /**
   * The leaderboard data.
   */
  data: JourneyLeaderboard;

  /**
   * Metadata about the leaderboard request.
   */
  meta: {
    /**
     * Whether the data was retrieved from cache.
     */
    cached: boolean;
    
    /**
     * When the data will expire from cache (if cached).
     */
    expiresAt?: Date;
    
    /**
     * Pagination information.
     */
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  };
}

/**
 * Redis sorted set configuration for leaderboard caching.
 * Used internally by the leaderboard service.
 */
export interface LeaderboardCacheConfig {
  /**
   * The Redis key for the sorted set.
   */
  key: string;
  
  /**
   * Time-to-live in seconds for the cache entry.
   */
  ttl: number;
  
  /**
   * The journey context for this leaderboard cache.
   */
  journey: JourneyType;
  
  /**
   * The time period for this leaderboard cache.
   */
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
}