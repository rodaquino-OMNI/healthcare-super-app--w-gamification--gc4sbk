import { ApiProperty } from '@nestjs/swagger';
import { GameProfile } from '@austa/interfaces/gamification';
import { PaginationMeta, ApiResponse, ErrorResponse } from '@austa/interfaces/common';
import { UserAchievement } from '@austa/interfaces/gamification';

/**
 * Base metadata interface for profile responses
 * Contains additional information about the profile that isn't part of the core profile data
 */
export interface ProfileResponseMetadata {
  /**
   * Indicates if the profile was recently created
   */
  isNewProfile?: boolean;

  /**
   * Timestamp of when the profile data was last refreshed
   */
  lastRefreshed?: string;

  /**
   * Additional context-specific information
   */
  context?: Record<string, any>;
}

/**
 * Base interface for all profile-related API responses
 * Extends the standard API response interface from @austa/interfaces
 */
export interface ProfileResponseBase<T, M = ProfileResponseMetadata> extends ApiResponse<T, M> {
  /**
   * Response status
   * @example "success"
   */
  status: 'success' | 'error';

  /**
   * Response data
   */
  data: T;

  /**
   * Response metadata
   */
  meta?: M;

  /**
   * Error information (only present when status is 'error')
   */
  error?: ErrorResponse;
}

/**
 * Response interface for retrieving a single game profile
 */
export interface GetProfileResponse extends ProfileResponseBase<GameProfile> {
  /**
   * The game profile data
   */
  data: GameProfile;

  /**
   * Profile-specific metadata
   */
  meta?: ProfileResponseMetadata & {
    /**
     * Count of unlocked achievements
     */
    achievementCount?: number;

    /**
     * Count of active quests
     */
    activeQuestCount?: number;

    /**
     * Progress towards next level as a percentage
     */
    levelProgress?: number;
  };
}

/**
 * Response interface for creating a new game profile
 */
export interface CreateProfileResponse extends ProfileResponseBase<GameProfile> {
  /**
   * The newly created game profile
   */
  data: GameProfile;

  /**
   * Creation-specific metadata
   */
  meta?: ProfileResponseMetadata & {
    /**
     * Indicates this is a new profile
     */
    isNewProfile: true;

    /**
     * Timestamp when the profile was created
     */
    createdAt: string;
  };
}

/**
 * Response interface for updating a game profile
 */
export interface UpdateProfileResponse extends ProfileResponseBase<GameProfile> {
  /**
   * The updated game profile
   */
  data: GameProfile;

  /**
   * Update-specific metadata
   */
  meta?: ProfileResponseMetadata & {
    /**
     * Fields that were updated
     */
    updatedFields: string[];

    /**
     * Timestamp when the profile was updated
     */
    updatedAt: string;

    /**
     * Previous version number (for optimistic concurrency control)
     */
    previousVersion?: number;
  };
}

/**
 * Interface for profile list item with summarized data
 * Used in paginated responses to reduce payload size
 */
export interface ProfileSummary {
  /**
   * Profile ID
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id: string;

  /**
   * User ID
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  userId: string;

  /**
   * Current level
   * @example 5
   */
  level: number;

  /**
   * Current XP
   * @example 750
   */
  xp: number;

  /**
   * Achievement count
   * @example 12
   */
  achievementCount: number;

  /**
   * Last updated timestamp
   * @example "2023-04-15T14:30:00Z"
   */
  updatedAt: string;
}

/**
 * Pagination metadata specific to profile listings
 */
export interface ProfilePaginationMeta extends PaginationMeta {
  /**
   * Total number of profiles
   * @example 150
   */
  total: number;

  /**
   * Current page number
   * @example 2
   */
  page: number;

  /**
   * Number of items per page
   * @example 20
   */
  limit: number;

  /**
   * Number of pages available
   * @example 8
   */
  pages: number;

  /**
   * Applied filters
   */
  filters?: {
    /**
     * Minimum level filter
     */
    minLevel?: number;

    /**
     * Maximum level filter
     */
    maxLevel?: number;

    /**
     * Achievement filter
     */
    hasAchievement?: string;

    /**
     * Other applied filters
     */
    [key: string]: any;
  };
}

/**
 * Response interface for retrieving a paginated list of profiles
 */
export interface GetProfilesResponse extends ProfileResponseBase<ProfileSummary[], ProfilePaginationMeta> {
  /**
   * Array of profile summaries
   */
  data: ProfileSummary[];

  /**
   * Pagination metadata
   */
  meta: ProfilePaginationMeta;
}

/**
 * Response interface for retrieving a profile's achievements
 */
export interface GetProfileAchievementsResponse extends ProfileResponseBase<UserAchievement[]> {
  /**
   * Array of user achievements
   */
  data: UserAchievement[];

  /**
   * Achievement-specific metadata
   */
  meta?: ProfileResponseMetadata & {
    /**
     * Total number of achievements available in the system
     */
    totalAvailableAchievements?: number;

    /**
     * Completion percentage across all achievements
     */
    completionPercentage?: number;

    /**
     * Timestamp of the most recently unlocked achievement
     */
    lastUnlocked?: string;
  };
}

/**
 * Response interface for profile statistics
 */
export interface GetProfileStatsResponse extends ProfileResponseBase<{
  /**
   * Total XP earned
   * @example 2500
   */
  totalXp: number;

  /**
   * Current level
   * @example 8
   */
  level: number;

  /**
   * Progress to next level (percentage)
   * @example 65
   */
  levelProgress: number;

  /**
   * Number of completed achievements
   * @example 15
   */
  achievementsCompleted: number;

  /**
   * Number of active quests
   * @example 3
   */
  activeQuests: number;

  /**
   * Journey-specific statistics
   */
  journeyStats: {
    /**
     * Health journey statistics
     */
    health?: {
      xp: number;
      achievements: number;
    };

    /**
     * Care journey statistics
     */
    care?: {
      xp: number;
      achievements: number;
    };

    /**
     * Plan journey statistics
     */
    plan?: {
      xp: number;
      achievements: number;
    };
  };
}> {
  /**
   * Statistics-specific metadata
   */
  meta?: ProfileResponseMetadata & {
    /**
     * Time period for the statistics
     */
    period?: 'all-time' | 'monthly' | 'weekly' | 'daily';

    /**
     * Timestamp when the statistics were calculated
     */
    calculatedAt: string;
  };
}

/**
 * Error response for profile-related endpoints
 */
export interface ProfileErrorResponse extends ErrorResponse {
  /**
   * Error code specific to profile operations
   * @example "PROFILE_NOT_FOUND"
   */
  code: string;

  /**
   * Human-readable error message
   * @example "Game profile not found for the specified user"
   */
  message: string;

  /**
   * HTTP status code
   * @example 404
   */
  statusCode: number;

  /**
   * Additional error details
   */
  details?: {
    /**
     * User ID that was requested
     */
    userId?: string;

    /**
     * Field that caused the error
     */
    field?: string;

    /**
     * Additional context about the error
     */
    context?: Record<string, any>;
  };

  /**
   * Timestamp when the error occurred
   * @example "2023-04-15T14:30:00Z"
   */
  timestamp: string;
}