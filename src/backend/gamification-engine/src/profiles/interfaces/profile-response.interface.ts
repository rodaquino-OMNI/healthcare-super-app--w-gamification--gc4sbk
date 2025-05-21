import { IGameProfile } from '@austa/interfaces/gamification/profiles';
import { IPaginationMeta, IErrorResponse } from '@austa/interfaces/common';

/**
 * Interface for a single profile response.
 * Used when returning a single game profile from API endpoints.
 */
export interface IProfileResponse {
  /**
   * The game profile data
   */
  profile: IGameProfile;
  
  /**
   * Metadata about the profile response
   */
  meta: IProfileResponseMeta;
}

/**
 * Interface for a paginated list of profiles response.
 * Used when returning multiple game profiles with pagination support.
 */
export interface IProfilesListResponse {
  /**
   * Array of game profiles
   */
  profiles: IGameProfile[];
  
  /**
   * Pagination metadata
   */
  pagination: IPaginationMeta;
  
  /**
   * Additional metadata about the profiles response
   */
  meta: IProfilesListMeta;
}

/**
 * Interface for profile response metadata.
 * Contains additional information about the profile response.
 */
export interface IProfileResponseMeta {
  /**
   * Timestamp when the response was generated
   */
  timestamp: string;
  
  /**
   * Version of the API that generated the response
   */
  apiVersion: string;
  
  /**
   * Indicates if the profile was created in this request
   */
  isNewProfile?: boolean;
  
  /**
   * Indicates if the profile was updated in this request
   */
  wasUpdated?: boolean;
  
  /**
   * Additional information about the profile's achievements
   */
  achievementStats?: {
    /**
     * Total number of achievements unlocked by the user
     */
    totalUnlocked: number;
    
    /**
     * Total number of achievements available
     */
    totalAvailable: number;
    
    /**
     * Percentage of achievements unlocked
     */
    completionPercentage: number;
  };
  
  /**
   * Additional information about the profile's quests
   */
  questStats?: {
    /**
     * Number of active quests
     */
    activeQuests: number;
    
    /**
     * Number of completed quests
     */
    completedQuests: number;
  };
}

/**
 * Interface for profiles list metadata.
 * Contains additional information about the profiles list response.
 */
export interface IProfilesListMeta {
  /**
   * Timestamp when the response was generated
   */
  timestamp: string;
  
  /**
   * Version of the API that generated the response
   */
  apiVersion: string;
  
  /**
   * Filters applied to the profiles list
   */
  filters?: Record<string, any>;
  
  /**
   * Sorting applied to the profiles list
   */
  sort?: {
    /**
     * Field used for sorting
     */
    field: string;
    
    /**
     * Sort direction (asc or desc)
     */
    direction: 'asc' | 'desc';
  };
}

/**
 * Interface for profile error response.
 * Used when returning errors from profile-related API endpoints.
 */
export interface IProfileErrorResponse extends IErrorResponse {
  /**
   * Profile-specific error details
   */
  profileError?: {
    /**
     * User ID that caused the error
     */
    userId?: string;
    
    /**
     * Profile ID that caused the error
     */
    profileId?: string;
    
    /**
     * Operation that failed
     */
    operation: 'create' | 'find' | 'update' | 'delete' | 'list';
    
    /**
     * Retry information if applicable
     */
    retry?: {
      /**
       * Whether the operation can be retried
       */
      canRetry: boolean;
      
      /**
       * Suggested delay before retrying (in milliseconds)
       */
      retryAfter?: number;
      
      /**
       * Maximum number of retries allowed
       */
      maxRetries?: number;
    };
  };
}