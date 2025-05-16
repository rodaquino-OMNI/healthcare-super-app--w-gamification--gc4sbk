/**
 * @file leaderboard.ts
 * @description TypeScript interfaces for the gamification leaderboard system.
 * These interfaces provide a standardized way to represent user rankings based on XP and achievements,
 * and are used by both web and mobile applications to display leaderboards with consistent data structures.
 */

/**
 * Defines the time periods for leaderboard filtering.
 * Used to display rankings for different time intervals.
 */
export enum LeaderboardTimeFrame {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time'
}

/**
 * Defines the structure for an individual entry in a leaderboard.
 * Represents a single user's ranking, XP, and achievements within a specific time frame.
 */
export interface LeaderboardEntry {
  /** Unique identifier for the user */
  userId: string;
  
  /** Display name of the user */
  username: string;
  
  /** Current position in the leaderboard */
  rank: number;
  
  /** Experience points earned in the timeframe */
  xp: number;
  
  /** User's current level in the gamification system */
  level: number;
  
  /** URL to the user's avatar image */
  avatarUrl?: string;
  
  /** List of achievement IDs earned in the timeframe */
  achievements?: string[];
  
  /** Optional journey identifier if this entry is journey-specific */
  journey?: string;
}

/**
 * Defines the structure for a complete leaderboard.
 * Contains metadata about the leaderboard and a collection of ranking entries.
 */
export interface Leaderboard {
  /** Unique identifier for the leaderboard */
  id: string;
  
  /** Display title of the leaderboard */
  title: string;
  
  /** Optional detailed description of the leaderboard */
  description?: string;
  
  /** Time period that this leaderboard represents */
  timeFrame: LeaderboardTimeFrame;
  
  /** List of ranking entries in the leaderboard */
  entries: LeaderboardEntry[];
  
  /** Total number of entries in the complete leaderboard (for pagination) */
  totalEntries: number;
  
  /** ISO timestamp of when the leaderboard was last updated */
  lastUpdated: string;
}

/**
 * Extends the base Leaderboard interface for journey-specific rankings.
 * Includes additional properties related to the specific journey context.
 */
export interface JourneyLeaderboard extends Leaderboard {
  /** Which journey this leaderboard is for (health, care, plan) */
  journey: string;
  
  /** Icon identifier for the journey */
  journeyIcon: string;
  
  /** Theme color for the journey */
  journeyColor: string;
}

/**
 * Defines parameters for filtering and customizing leaderboard views.
 * Used when requesting leaderboard data from the API.
 */
export interface LeaderboardFilter {
  /** Time period to filter the leaderboard by */
  timeFrame: LeaderboardTimeFrame;
  
  /** Optional journey to filter by (health, care, plan) */
  journey?: string;
  
  /** Maximum number of entries to return (for pagination) */
  limit: number;
  
  /** Starting position for pagination */
  offset: number;
  
  /** Optional filter to focus on a specific user and their nearby ranks */
  userId?: string;
}