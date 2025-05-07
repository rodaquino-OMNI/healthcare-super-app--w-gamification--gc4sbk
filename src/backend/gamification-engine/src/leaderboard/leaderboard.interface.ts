/**
 * @file leaderboard.interface.ts
 * @description Defines TypeScript interfaces for leaderboard data structures in the gamification engine.
 * These interfaces ensure type safety throughout the module and provide a standardized contract
 * for leaderboard data across the application.
 * 
 * This file implements the following requirements from the technical specification:
 * - Integration with @austa/interfaces package for type-safe data models
 * - Standardized, versioned event schemas for consistent data handling
 * - Enhanced Redis Sorted Sets integration for improved leaderboard caching resilience
 * - Cross-journey data models for unified leaderboards
 */

// Import JourneyType from the centralized interfaces package as specified in the technical spec
import { JourneyType } from '@austa/interfaces/gamification';
import { GameProfile } from '../profiles/entities/game-profile.entity';

/**
 * Enum for leaderboard time period specifications.
 * Defines the different time periods for which leaderboard data can be retrieved.
 */
export enum LeaderboardTimeframe {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time',
}

/**
 * Interface for individual leaderboard entries.
 * Represents a single user's ranking data in the leaderboard.
 */
export interface LeaderboardEntry {
  /**
   * The user's rank position in the leaderboard (1-based)
   * @example 1
   */
  rank: number;

  /**
   * The unique identifier of the user
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  userId: string;

  /**
   * The user's display name
   * @example 'JohnDoe123'
   */
  username?: string;

  /**
   * The user's current level in the gamification system
   * @example 5
   */
  level: number;

  /**
   * The user's experience points
   * @example 1250
   */
  xp: number;

  /**
   * The number of achievements the user has earned
   * @example 8
   */
  achievements: number;

  /**
   * Flag indicating if this entry represents the current user
   * Used for highlighting in UI components
   */
  isCurrentUser?: boolean;

  /**
   * Optional metadata about the user's most recent achievement
   * Used for displaying achievement badges in the leaderboard UI
   */
  latestAchievement?: {
    id: string;
    title: string;
    description: string;
    icon: string;
    progress: number;
    total: number;
    unlocked: boolean;
    journey: string;
  };
}

/**
 * Interface for leaderboard pagination options.
 * Defines parameters for paginating leaderboard results.
 */
export interface LeaderboardPagination {
  /**
   * The page number to retrieve (1-based indexing)
   * @default 1
   */
  page?: number;

  /**
   * The number of items per page
   * @default 10
   */
  limit?: number;
}

/**
 * Interface for leaderboard filtering options.
 * Defines parameters for filtering leaderboard results.
 */
export interface LeaderboardFilter {
  /**
   * Filter by specific achievement ID
   */
  achievementId?: string;

  /**
   * Filter by specific quest ID
   */
  questId?: string;

  /**
   * Include only friends of the requesting user
   */
  friendsOnly?: boolean;
}

/**
 * Interface for leaderboard retrieval options.
 * Combines all parameters for retrieving and configuring leaderboard data.
 */
export interface LeaderboardOptions {
  /**
   * The journey to get leaderboard data for
   * @example 'health'
   */
  journey: JourneyType;

  /**
   * The timeframe for the leaderboard data
   * @default LeaderboardTimeframe.ALL_TIME
   */
  timeframe?: LeaderboardTimeframe;

  /**
   * Optional start date for custom timeframe
   */
  startDate?: Date;

  /**
   * Optional end date for custom timeframe
   */
  endDate?: Date;

  /**
   * Pagination options for the leaderboard
   */
  pagination?: LeaderboardPagination;

  /**
   * Filter options for the leaderboard
   */
  filters?: LeaderboardFilter;

  /**
   * The ID of the current user, used to mark their entry
   */
  currentUserId?: string;
}

/**
 * Interface for journey-specific leaderboard data.
 * Represents a complete leaderboard for a specific journey.
 * 
 * This interface implements the "cross-journey data models for unified leaderboards"
 * requirement from the technical specification. It provides a standardized structure
 * for leaderboard data across all journeys (health, care, plan) while allowing for
 * journey-specific customization.
 */
export interface JourneyLeaderboard {
  /**
   * The journey this leaderboard is for
   * @example 'health'
   */
  journey: JourneyType;

  /**
   * The timeframe this leaderboard represents
   * @example 'weekly'
   */
  timeframe: LeaderboardTimeframe;

  /**
   * The total number of users in the complete leaderboard
   * @example 150
   */
  total: number;

  /**
   * The current page number
   * @example 1
   */
  page: number;

  /**
   * The number of items per page
   * @example 10
   */
  limit: number;

  /**
   * The leaderboard entries for the current page
   */
  entries: LeaderboardEntry[];

  /**
   * The timestamp when this leaderboard was generated
   */
  generatedAt: Date;
}

/**
 * Interface for Redis Sorted Sets leaderboard options.
 * Defines configuration options for Redis Sorted Sets integration.
 * 
 * This interface supports the "Enhanced Redis Sorted Sets integration for improved
 * leaderboard caching resilience" requirement from the technical specification.
 * It provides type-safe configuration for Redis caching with journey-specific TTLs.
 */
export interface RedisLeaderboardOptions {
  /**
   * The Redis key for the leaderboard
   * @example 'leaderboard:health:weekly'
   */
  key: string;

  /**
   * Time-to-live in seconds for the cached leaderboard
   * @example 300 (5 minutes)
   */
  ttl: number;

  /**
   * Maximum number of entries to store in the leaderboard
   * @example 100
   */
  maxEntries: number;

  /**
   * Whether to use the journey-specific TTL from configuration
   * @default true
   */
  useJourneyTTL?: boolean;
}

/**
 * Interface for leaderboard cache operations.
 * Defines methods for caching and retrieving leaderboard data.
 */
export interface LeaderboardCache {
  /**
   * Get a leaderboard from cache
   * @param key The Redis key for the leaderboard
   * @returns A promise that resolves to the leaderboard data or null if not found
   */
  getLeaderboard(key: string): Promise<LeaderboardEntry[] | null>;

  /**
   * Set a leaderboard in cache
   * @param key The Redis key for the leaderboard
   * @param data The leaderboard data to cache
   * @param ttl Time-to-live in seconds
   * @returns A promise that resolves when the operation is complete
   */
  setLeaderboard(key: string, data: LeaderboardEntry[], ttl: number): Promise<void>;

  /**
   * Generate a cache key for a leaderboard
   * @param journey The journey for the leaderboard
   * @param timeframe The timeframe for the leaderboard
   * @returns The cache key
   */
  generateLeaderboardKey(journey: JourneyType, timeframe: LeaderboardTimeframe): string;
}

/**
 * Interface for leaderboard calculation parameters.
 * Defines parameters for calculating leaderboard rankings from user profiles.
 */
export interface LeaderboardCalculationParams {
  /**
   * The journey to calculate leaderboard for
   */
  journey: JourneyType;
  
  /**
   * The timeframe to calculate leaderboard for
   */
  timeframe: LeaderboardTimeframe;
  
  /**
   * Optional filter for specific achievement
   */
  achievementId?: string;
  
  /**
   * Optional filter for specific quest
   */
  questId?: string;
  
  /**
   * Optional array of user IDs to include (e.g., for friends-only leaderboard)
   */
  includeUserIds?: string[];
}

/**
 * Interface for leaderboard service operations.
 * Defines the contract for the LeaderboardService.
 */
export interface LeaderboardServiceInterface {
  /**
   * Retrieves the leaderboard data for a specific journey and timeframe.
   * @param options The options for retrieving the leaderboard
   * @returns A promise that resolves to the journey leaderboard
   */
  getLeaderboard(options: LeaderboardOptions): Promise<JourneyLeaderboard>;
  
  /**
   * Calculates the leaderboard data from user profiles.
   * @param params The parameters for calculating the leaderboard
   * @returns A promise that resolves to the sorted game profiles
   */
  calculateLeaderboard(params: LeaderboardCalculationParams): Promise<GameProfile[]>;
  
  /**
   * Invalidates the cache for a specific leaderboard.
   * @param journey The journey to invalidate cache for
   * @param timeframe The timeframe to invalidate cache for
   * @returns A promise that resolves when the operation is complete
   */
  invalidateLeaderboardCache(journey: JourneyType, timeframe: LeaderboardTimeframe): Promise<void>;
  
  /**
   * Gets the user's rank in a specific leaderboard.
   * @param userId The ID of the user
   * @param journey The journey to get rank for
   * @param timeframe The timeframe to get rank for
   * @returns A promise that resolves to the user's rank or null if not found
   */
  getUserRank(userId: string, journey: JourneyType, timeframe: LeaderboardTimeframe): Promise<number | null>;
}

/**
 * Interface for leaderboard controller operations.
 * Defines the contract for the LeaderboardController.
 */
export interface LeaderboardControllerInterface {
  /**
   * Gets the leaderboard for a specific journey.
   * @param journey The journey to get leaderboard for
   * @param timeframeDto Optional timeframe parameters
   * @param paginationDto Optional pagination parameters
   * @param filterDto Optional filter parameters
   * @returns A promise that resolves to the journey leaderboard
   */
  getJourneyLeaderboard(
    journey: JourneyType,
    timeframeDto?: { timeframe?: LeaderboardTimeframe; startDate?: Date; endDate?: Date },
    paginationDto?: { page?: number; limit?: number },
    filterDto?: { achievementId?: string; questId?: string; friendsOnly?: boolean }
  ): Promise<JourneyLeaderboard>;
  
  /**
   * Gets the user's rank in a specific leaderboard.
   * @param userId The ID of the user
   * @param journey The journey to get rank for
   * @param timeframe The timeframe to get rank for
   * @returns A promise that resolves to the user's rank
   */
  getUserRank(
    userId: string,
    journey: JourneyType,
    timeframe?: LeaderboardTimeframe
  ): Promise<{ userId: string; rank: number; journey: JourneyType; timeframe: LeaderboardTimeframe }>;
  
  /**
   * Refreshes the leaderboard cache for a specific journey and timeframe.
   * @param journey The journey to refresh cache for
   * @param timeframe The timeframe to refresh cache for
   * @returns A promise that resolves when the operation is complete
   */
  refreshLeaderboard(
    journey: JourneyType,
    timeframe: LeaderboardTimeframe
  ): Promise<{ success: boolean; message: string }>;
}