/**
 * Interfaces for leaderboard data structures used in the Redis Sorted Sets implementation.
 * These interfaces ensure consistent leaderboard functionality across the gamification engine
 * and standardize Redis integration for improved caching resilience.
 */

import { JourneyType } from './journey.interface';

/**
 * Represents a single entry in a leaderboard with user ranking information.
 * Used for displaying user position, score, and profile data in leaderboards.
 */
export interface ILeaderboardEntry {
  /** User's position in the leaderboard (1-based) */
  rank: number;
  
  /** Unique identifier for the user */
  userId: string;
  
  /** Display name of the user */
  username: string;
  
  /** Optional URL to user's avatar image */
  avatarUrl?: string;
  
  /** User's current level in the gamification system */
  level: number;
  
  /** User's experience points (score used for ranking) */
  xp: number;
  
  /** Optional additional achievements count */
  achievementsCount?: number;
  
  /** Optional metadata for journey-specific achievements */
  journeyAchievements?: Record<JourneyType, number>;
}

/**
 * Configuration options for leaderboard retrieval and display.
 * Allows customization of leaderboard size, pagination, and caching behavior.
 */
export interface ILeaderboardConfig {
  /** Maximum number of entries to include in the leaderboard */
  maxEntries?: number;
  
  /** Time-to-live in seconds for cached leaderboard data */
  ttl?: number;
  
  /** Number of entries to process in each batch operation */
  batchSize?: number;
  
  /** Journey-specific TTL values for optimized caching */
  journeyTTL?: Record<JourneyType, number>;
  
  /** Whether to include achievement counts in leaderboard entries */
  includeAchievements?: boolean;
  
  /** Whether to include journey-specific data in leaderboard entries */
  includeJourneyData?: boolean;
}

/**
 * Options for paginated leaderboard retrieval.
 * Supports flexible querying of leaderboard data with pagination controls.
 */
export interface ILeaderboardOptions {
  /** Maximum number of entries to return */
  limit?: number;
  
  /** Starting position (0-based) for pagination */
  startRank?: number;
  
  /** Whether to include the user's own rank even if outside the requested range */
  includeOwnRank?: boolean;
  
  /** Optional user ID to focus on in the results */
  focusUserId?: string;
  
  /** Number of entries to include before and after the focused user */
  focusRange?: number;
}

/**
 * Represents a complete leaderboard for a specific journey or global context.
 * Contains the list of ranked entries and metadata about the leaderboard.
 */
export interface ILeaderboard {
  /** Journey identifier or 'global' for cross-journey leaderboard */
  journey: string | 'global';
  
  /** Array of leaderboard entries in rank order */
  entries: ILeaderboardEntry[];
  
  /** Total number of users in the complete leaderboard */
  totalCount: number;
  
  /** Timestamp when the leaderboard was last updated */
  updatedAt: Date;
  
  /** Optional error message if leaderboard retrieval encountered issues */
  error?: string;
  
  /** Optional user ID that is the focus of this leaderboard view */
  focusedUserId?: string;
}

/**
 * Represents a journey-specific leaderboard with additional journey context.
 * Extends the base leaderboard interface with journey-specific metadata.
 */
export interface IJourneyLeaderboard extends ILeaderboard {
  /** Journey-specific metadata and statistics */
  journeyMetadata?: {
    /** Active users count in this journey */
    activeUsers: number;
    
    /** Average XP across all users in this journey */
    averageXp: number;
    
    /** Highest achievement completion rate */
    topAchievementRate: number;
  };
}

/**
 * Redis Sorted Set entry format for leaderboard storage.
 * Represents the data structure used for Redis ZADD operations.
 */
export interface ILeaderboardRedisEntry {
  /** User's score (XP) used for ranking */
  score: number;
  
  /** User ID stored as the value in Redis Sorted Set */
  value: string;
}

/**
 * Utility type for score normalization functions.
 * Used to transform raw scores into normalized values for consistent ranking.
 */
export type ScoreNormalizer = (rawScore: number, maxScore?: number) => number;

/**
 * Utility type for score calculation functions.
 * Used to compute composite scores from multiple metrics.
 */
export type ScoreCalculator = (metrics: Record<string, number>) => number;

/**
 * Represents a batch update operation for multiple user scores.
 * Used for efficient bulk updates to leaderboards.
 */
export interface ILeaderboardBatchUpdate {
  /** Array of user score updates to process in a single operation */
  updates: Array<{
    /** User ID to update */
    userId: string;
    
    /** Journey identifier */
    journey: string;
    
    /** New XP value */
    xp: number;
  }>;
}

/**
 * Configuration for leaderboard circuit breaker.
 * Controls fallback behavior when Redis operations fail.
 */
export interface ILeaderboardCircuitBreakerConfig {
  /** Name of the circuit breaker */
  name: string;
  
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  
  /** Time in milliseconds before attempting to close the circuit */
  resetTimeout: number;
  
  /** Fallback function to execute when the circuit is open */
  fallback: (journey: string, limit?: number, startRank?: number) => ILeaderboard;
}