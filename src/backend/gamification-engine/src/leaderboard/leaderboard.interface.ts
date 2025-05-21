/**
 * @file Leaderboard interfaces for the gamification engine
 * @description Defines TypeScript interfaces for leaderboard data structures, ensuring type safety throughout the module.
 */

import { JourneyType } from '@austa/interfaces/gamification';

/**
 * Represents a single entry in a leaderboard, containing user ranking information.
 * Used for displaying user position in journey-specific or global leaderboards.
 */
export interface LeaderboardEntry {
  /** User's position in the leaderboard (1-based) */
  rank: number;
  /** Unique identifier for the user */
  userId: string;
  /** User's current level in the gamification system */
  level: number;
  /** User's experience points */
  xp: number;
  /** Number of achievements the user has unlocked */
  achievements: number;
  /** Optional user display name */
  displayName?: string;
  /** Optional user avatar URL */
  avatarUrl?: string;
}

/**
 * Defines the time period for which a leaderboard is calculated.
 * Used to create daily, weekly, monthly, or all-time leaderboards.
 */
export interface LeaderboardTimePeriod {
  /** Type of time period for the leaderboard */
  type: 'daily' | 'weekly' | 'monthly' | 'all-time';
  /** Start date for the leaderboard period (ISO string) */
  startDate?: string;
  /** End date for the leaderboard period (ISO string) */
  endDate?: string;
}

/**
 * Configuration options for retrieving leaderboard data.
 * Allows customization of leaderboard queries with pagination, filtering, and time periods.
 */
export interface LeaderboardOptions {
  /** Journey type to filter leaderboard entries by */
  journey?: JourneyType;
  /** Maximum number of entries to return */
  limit?: number;
  /** Number of entries to skip (for pagination) */
  offset?: number;
  /** Time period for the leaderboard */
  timePeriod?: LeaderboardTimePeriod;
  /** Whether to include the user's own position in the results */
  includeUserPosition?: boolean;
  /** User ID to get position for when includeUserPosition is true */
  userId?: string;
}

/**
 * Complete leaderboard data structure with entries and metadata.
 * Returned by leaderboard service methods to provide comprehensive leaderboard information.
 */
export interface LeaderboardData {
  /** Array of leaderboard entries sorted by rank */
  entries: LeaderboardEntry[];
  /** Total number of users in the complete leaderboard */
  totalUsers: number;
  /** Journey type this leaderboard represents */
  journey: JourneyType;
  /** Time period this leaderboard represents */
  timePeriod: LeaderboardTimePeriod;
  /** Timestamp when this leaderboard was last calculated (ISO string) */
  lastUpdated: string;
  /** User's own position in the leaderboard (if requested and available) */
  userPosition?: LeaderboardEntry;
}

/**
 * Redis-specific interface for leaderboard operations using Sorted Sets.
 * Provides type safety for Redis leaderboard operations in the service implementation.
 */
export interface RedisLeaderboardOptions {
  /** Redis key for the leaderboard sorted set */
  key: string;
  /** Time-to-live in seconds for the cached leaderboard */
  ttl: number;
  /** Score field to use for ranking (defaults to 'xp') */
  scoreField?: 'xp' | 'level' | 'achievements';
  /** Whether to store additional fields beyond the score */
  withScores?: boolean;
}

/**
 * Journey-specific leaderboard configuration.
 * Allows different journeys to have customized leaderboard settings.
 */
export interface JourneyLeaderboardConfig {
  /** Journey type this configuration applies to */
  journey: JourneyType;
  /** Maximum number of entries to display */
  maxEntries: number;
  /** Cache TTL in seconds */
  cacheTtl: number;
  /** Whether this journey's leaderboard is enabled */
  enabled: boolean;
  /** Custom Redis key prefix for this journey */
  redisKeyPrefix?: string;
}

/**
 * Response structure for leaderboard API endpoints.
 * Ensures consistent response format for all leaderboard-related API calls.
 */
export interface LeaderboardResponse {
  /** Leaderboard data */
  data: LeaderboardData;
  /** Response metadata */
  meta: {
    /** Whether the data was retrieved from cache */
    fromCache: boolean;
    /** When the data will expire from cache (ISO string) */
    expiresAt?: string;
  };
}