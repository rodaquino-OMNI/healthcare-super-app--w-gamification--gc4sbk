/**
 * @file Defines TypeScript interfaces for the gamification leaderboard system.
 * These interfaces provide a standardized contract for leaderboard data structures
 * that display user rankings based on XP and achievements across all journeys.
 */

/**
 * Represents the available journey types in the AUSTA SuperApp.
 * Used to categorize leaderboards by journey context.
 */
export type JourneyType = 'health' | 'care' | 'plan';

/**
 * Represents a single entry in a leaderboard.
 * Contains user ranking information and achievement data.
 */
export interface LeaderboardEntry {
  /**
   * The user's position in the leaderboard (1-based).
   */
  rank: number;

  /**
   * Unique identifier for the user.
   */
  userId: string;

  /**
   * The user's current level in the gamification system.
   */
  level: number;

  /**
   * The user's experience points.
   */
  xp: number;

  /**
   * The total number of achievements unlocked by the user.
   */
  achievements: number;

  /**
   * The user's display name (optional, used for UI display).
   */
  username?: string;

  /**
   * Flag indicating if this entry represents the current user (optional, used for UI highlighting).
   */
  isCurrentUser?: boolean;

  /**
   * Featured achievement to display with the leaderboard entry (optional).
   */
  achievement?: {
    /**
     * Unique identifier for the achievement.
     */
    id: string;

    /**
     * Display title of the achievement.
     */
    title: string;

    /**
     * Detailed description of the achievement.
     */
    description: string;

    /**
     * Icon identifier for the achievement.
     */
    icon: string;

    /**
     * Current progress toward unlocking the achievement.
     */
    progress: number;

    /**
     * Total progress required to unlock the achievement.
     */
    total: number;

    /**
     * Whether the achievement has been unlocked.
     */
    unlocked: boolean;

    /**
     * The journey to which this achievement belongs.
     */
    journey: JourneyType;
  };
}

/**
 * Options for configuring leaderboard retrieval.
 */
export interface LeaderboardOptions {
  /**
   * Filter leaderboard by specific journey.
   */
  journey?: JourneyType;

  /**
   * Maximum number of entries to retrieve.
   * @default 100
   */
  limit?: number;

  /**
   * Number of entries to skip (for pagination).
   * @default 0
   */
  offset?: number;

  /**
   * Whether to include the current user in the results, even if they
   * wouldn't normally appear based on rank, limit, and offset.
   * @default true
   */
  includeCurrentUser?: boolean;

  /**
   * Time period for the leaderboard (e.g., 'daily', 'weekly', 'monthly', 'allTime').
   * @default 'allTime'
   */
  period?: 'daily' | 'weekly' | 'monthly' | 'allTime';
}

/**
 * Represents a journey-specific leaderboard with entries and metadata.
 */
export interface JourneyLeaderboard {
  /**
   * The journey to which this leaderboard belongs.
   */
  journey: JourneyType;

  /**
   * Array of leaderboard entries, sorted by rank.
   */
  entries: LeaderboardEntry[];

  /**
   * Total number of entries in the complete leaderboard (may be greater than entries.length).
   */
  totalEntries: number;

  /**
   * Timestamp when the leaderboard was last updated.
   */
  updatedAt: Date;

  /**
   * Optional metadata about the current user's position in the leaderboard.
   */
  currentUser?: {
    /**
     * The current user's entry in the leaderboard.
     */
    entry: LeaderboardEntry;
    
    /**
     * Distance (in ranks) from the next position.
     */
    distanceToNext?: number;
    
    /**
     * XP needed to reach the next position.
     */
    xpToNext?: number;
  };
}

/**
 * Response structure for leaderboard API endpoints.
 */
export interface LeaderboardResponse {
  /**
   * The requested leaderboard data.
   */
  leaderboard: JourneyLeaderboard;

  /**
   * Whether the data was retrieved from cache.
   */
  fromCache: boolean;

  /**
   * Cache TTL in seconds (if fromCache is true).
   */
  cacheTtl?: number;
}