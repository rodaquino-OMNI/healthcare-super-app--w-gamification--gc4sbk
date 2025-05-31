/**
 * Defines the structure for a single entry in a leaderboard.
 * Each entry represents a user's ranking based on their XP and achievements.
 */
export interface LeaderboardEntry {
  /** The user's rank position in the leaderboard */
  rank: number;
  /** Unique identifier for the user */
  userId: string;
  /** User's display name */
  displayName: string;
  /** User's avatar URL */
  avatarUrl?: string;
  /** User's current level in the gamification system */
  level: number;
  /** User's current experience points */
  xp: number;
  /** Number of achievements the user has unlocked */
  achievementsCount: number;
  /** Optional journey-specific data */
  journeyData?: Record<string, any>;
}

/**
 * Defines the time frame for leaderboard data.
 * Used to filter leaderboard entries based on different time periods.
 */
export enum LeaderboardTimeFrame {
  /** Leaderboard data for the current day */
  DAILY = 'daily',
  /** Leaderboard data for the current week */
  WEEKLY = 'weekly',
  /** Leaderboard data for the current month */
  MONTHLY = 'monthly',
  /** Leaderboard data for all time */
  ALL_TIME = 'all_time'
}

/**
 * Defines the structure for a journey-specific leaderboard.
 * Each journey (Health, Care, Plan) can have its own leaderboard.
 */
export interface JourneyLeaderboard {
  /** The journey identifier (health, care, plan) */
  journeyId: string;
  /** The journey display name */
  journeyName: string;
  /** The time frame for this leaderboard data */
  timeFrame: LeaderboardTimeFrame;
  /** Last updated timestamp (ISO string) */
  updatedAt: string;
  /** List of leaderboard entries */
  entries: LeaderboardEntry[];
  /** Total number of users in this journey */
  totalParticipants: number;
}

/**
 * Defines the filter options for customizing leaderboard views.
 */
export interface LeaderboardFilter {
  /** The journey to filter by (health, care, plan, or null for all) */
  journeyId?: string;
  /** The time frame to filter by */
  timeFrame: LeaderboardTimeFrame;
  /** Maximum number of entries to return */
  limit?: number;
  /** Whether to include the current user in results regardless of rank */
  includeCurrentUser?: boolean;
  /** Filter by user level range */
  levelRange?: {
    min?: number;
    max?: number;
  };
}

/**
 * Defines the structure for the overall leaderboard.
 * Contains entries from all journeys or filtered by specific criteria.
 */
export interface Leaderboard {
  /** The time frame for this leaderboard data */
  timeFrame: LeaderboardTimeFrame;
  /** Last updated timestamp (ISO string) */
  updatedAt: string;
  /** List of leaderboard entries */
  entries: LeaderboardEntry[];
  /** Total number of users in the leaderboard */
  totalParticipants: number;
  /** Current user's position in the leaderboard (if available) */
  currentUserRank?: number;
  /** Applied filters */
  filters?: LeaderboardFilter;
  /** Journey-specific leaderboards */
  journeyLeaderboards?: JourneyLeaderboard[];
}