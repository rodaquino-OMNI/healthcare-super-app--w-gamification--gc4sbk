/**
 * Interfaces for leaderboard data structures used in the Redis Sorted Sets implementation.
 * These interfaces provide a standardized contract for leaderboard functionality across
 * the gamification engine and ensure consistent Redis integration.
 */

import { JourneyType } from './journey.interface';

/**
 * Represents a single entry in a leaderboard, containing user information and their score/rank.
 */
export interface ILeaderboardEntry {
  /** Unique identifier for the user */
  userId: string;
  
  /** User's display name shown on the leaderboard */
  displayName: string;
  
  /** User's current score/points in this leaderboard */
  score: number;
  
  /** User's current rank in the leaderboard (1-based) */
  rank: number;
  
  /** Optional avatar URL for the user */
  avatarUrl?: string;
  
  /** Optional level information for the user */
  level?: number;
  
  /** Optional metadata for additional user information */
  metadata?: Record<string, any>;
}

/**
 * Configuration options for a leaderboard.
 */
export interface ILeaderboardConfig {
  /** Unique identifier for the leaderboard */
  id: string;
  
  /** Human-readable name of the leaderboard */
  name: string;
  
  /** Description of what this leaderboard represents */
  description?: string;
  
  /** The journey this leaderboard is associated with, if any */
  journeyType?: JourneyType;
  
  /** Time period this leaderboard covers (daily, weekly, monthly, all-time) */
  timeFrame: LeaderboardTimeFrame;
  
  /** Maximum number of entries to store in this leaderboard */
  maxEntries?: number;
  
  /** Whether scores should be normalized before storing */
  normalizeScores?: boolean;
  
  /** Redis key used to store this leaderboard */
  redisKey: string;
  
  /** TTL (Time-To-Live) in seconds for this leaderboard in Redis */
  ttlSeconds?: number;
  
  /** Whether this leaderboard is currently active */
  isActive: boolean;
}

/**
 * Time frames for leaderboards.
 */
export enum LeaderboardTimeFrame {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all-time',
}

/**
 * Function type for score calculation strategies.
 * Takes a raw score and returns a calculated score for leaderboard ranking.
 */
export type ScoreCalculator = (rawScore: number) => number;

/**
 * Function type for score normalization strategies.
 * Takes a raw score and normalizes it to a standard range.
 */
export type ScoreNormalizer = (rawScore: number, maxScore?: number) => number;

/**
 * Options for retrieving leaderboard data.
 */
export interface ILeaderboardQueryOptions {
  /** Number of entries to retrieve (default: 10) */
  limit?: number;
  
  /** Starting position for pagination (0-based, default: 0) */
  offset?: number;
  
  /** Whether to include the user in results even if they're outside the requested range */
  includeCurrentUser?: boolean;
  
  /** User ID to focus on when retrieving leaderboard data */
  focusUserId?: string;
  
  /** Number of entries to include before and after the focused user */
  focusWindow?: number;
}

/**
 * Response containing leaderboard data.
 */
export interface ILeaderboardResponse {
  /** Configuration of the leaderboard */
  config: ILeaderboardConfig;
  
  /** Array of leaderboard entries */
  entries: ILeaderboardEntry[];
  
  /** Total number of entries in the leaderboard */
  totalEntries: number;
  
  /** Current user's entry, if requested and available */
  currentUserEntry?: ILeaderboardEntry;
  
  /** Timestamp when this data was retrieved */
  timestamp: Date;
}

/**
 * Interface for journey-specific leaderboard with additional journey context.
 */
export interface IJourneyLeaderboard extends ILeaderboardConfig {
  /** The specific journey this leaderboard belongs to */
  journeyType: JourneyType;
  
  /** Journey-specific metadata for this leaderboard */
  journeyMetadata?: Record<string, any>;
  
  /** Journey-specific score calculator */
  journeyScoreCalculator?: ScoreCalculator;
}

/**
 * Interface for cross-journey leaderboard that aggregates scores from multiple journeys.
 */
export interface ICrossJourneyLeaderboard extends ILeaderboardConfig {
  /** List of journey types included in this cross-journey leaderboard */
  includedJourneys: JourneyType[];
  
  /** Weight factors for each journey's contribution to the overall score */
  journeyWeights?: Record<JourneyType, number>;
  
  /** Whether to use the sum of journey scores or a custom aggregation */
  useCustomAggregation?: boolean;
  
  /** Custom function to aggregate scores from multiple journeys */
  scoreAggregator?: (journeyScores: Record<JourneyType, number>) => number;
}

/**
 * Interface for leaderboard update operations.
 */
export interface ILeaderboardUpdate {
  /** ID of the leaderboard to update */
  leaderboardId: string;
  
  /** User ID whose score is being updated */
  userId: string;
  
  /** New score value */
  score: number;
  
  /** Whether to increment the existing score or replace it */
  increment?: boolean;
  
  /** Additional user data to store with the leaderboard entry */
  userData?: Partial<Omit<ILeaderboardEntry, 'userId' | 'score' | 'rank'>>;
}

/**
 * Interface for leaderboard batch update operations.
 */
export interface ILeaderboardBatchUpdate {
  /** ID of the leaderboard to update */
  leaderboardId: string;
  
  /** Array of user updates to apply in a single operation */
  updates: Array<{
    userId: string;
    score: number;
    increment?: boolean;
    userData?: Partial<Omit<ILeaderboardEntry, 'userId' | 'score' | 'rank'>>;
  }>;
}

/**
 * Interface for leaderboard cache management operations.
 */
export interface ILeaderboardCacheOptions {
  /** Whether to bypass the cache and force a refresh from the database */
  forceRefresh?: boolean;
  
  /** Custom TTL override for this specific operation */
  customTtl?: number;
  
  /** Whether to use a stale-while-revalidate caching strategy */
  staleWhileRevalidate?: boolean;
  
  /** Maximum age of cached data in seconds before triggering background refresh */
  maxStaleAgeSeconds?: number;
}