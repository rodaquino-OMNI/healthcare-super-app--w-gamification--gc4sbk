import { Reward, UserReward, JourneyType } from '@austa/interfaces/gamification';
import { PaginatedResponse, ErrorResponse } from '@austa/interfaces/common/dto';

/**
 * Response interface for a single reward.
 * Used when returning a reward from the API.
 */
export interface RewardResponse extends Reward {
  /** Unique identifier for the reward */
  id: string;
  
  /** Title of the reward displayed to users */
  title: string;
  
  /** Detailed description of the reward */
  description: string;
  
  /** Amount of XP awarded when earning this reward */
  xpReward: number;
  
  /** Icon name/path used to visually represent the reward */
  icon: string;
  
  /** The journey this reward is associated with */
  journey: JourneyType;
  
  /** Creation date of the reward */
  createdAt: Date;
  
  /** Last update date of the reward */
  updatedAt: Date;
  
  /** 
   * Count of users who have earned this reward 
   * Only included when specifically requested
   */
  earnedCount?: number;
}

/**
 * Response interface for a paginated list of rewards.
 * Used when returning multiple rewards from the API with pagination.
 */
export interface PaginatedRewardResponse extends PaginatedResponse<RewardResponse> {
  /** Array of rewards in the current page */
  items: RewardResponse[];
  
  /** Total number of rewards matching the filter criteria */
  total: number;
  
  /** Current page number */
  page: number;
  
  /** Number of items per page */
  limit: number;
  
  /** Number of pages available */
  pages: number;
  
  /** 
   * Filter criteria that was applied to this response 
   * Useful for client-side caching and state management
   */
  filters?: {
    /** Journey filter if applied */
    journey?: JourneyType;
    
    /** Title search term if applied */
    titleSearch?: string;
    
    /** XP range filter if applied */
    xpRange?: {
      min?: number;
      max?: number;
    };
    
    /** Any additional filters that were applied */
    [key: string]: any;
  };
}

/**
 * Response interface for a user reward.
 * Used when returning a reward that has been granted to a user.
 */
export interface UserRewardResponse extends Omit<UserReward, 'profile' | 'reward'> {
  /** Unique identifier for the user reward */
  id: string;
  
  /** ID of the game profile associated with this reward */
  profileId: string;
  
  /** ID of the reward earned by the user */
  rewardId: string;
  
  /** The date and time when the reward was earned */
  earnedAt: Date;
  
  /** The journey this reward is associated with */
  journey: JourneyType;
  
  /** Version number for optimistic locking */
  version?: number;
  
  /** The reward details */
  reward?: RewardResponse;
  
  /** Basic profile information */
  profile?: {
    id: string;
    userId: string;
    level: number;
    xp: number;
  };
}

/**
 * Response interface for a paginated list of user rewards.
 * Used when returning multiple user rewards from the API with pagination.
 */
export interface PaginatedUserRewardResponse extends PaginatedResponse<UserRewardResponse> {
  /** Array of user rewards in the current page */
  items: UserRewardResponse[];
  
  /** Total number of user rewards matching the filter criteria */
  total: number;
  
  /** Current page number */
  page: number;
  
  /** Number of items per page */
  limit: number;
  
  /** Number of pages available */
  pages: number;
}

/**
 * Response interface for journey-specific rewards.
 * Used when filtering rewards by journey.
 */
export interface JourneyRewardResponse extends PaginatedRewardResponse {
  /** The journey these rewards belong to */
  journey: JourneyType;
}

/**
 * Response interface for journey-specific user rewards.
 * Used when filtering user rewards by journey.
 */
export interface JourneyUserRewardResponse extends PaginatedUserRewardResponse {
  /** The journey these user rewards belong to */
  journey: JourneyType;
}

/**
 * Response interface for granting a reward to a user.
 * Used when a reward is successfully granted to a user.
 */
export interface GrantRewardResponse extends UserRewardResponse {
  /** Whether the reward was successfully granted */
  success: boolean;
  
  /** Optional message providing additional context */
  message?: string;
  
  /** XP gained from this reward */
  xpGained: number;
  
  /** User's new total XP after receiving this reward */
  newTotalXp: number;
  
  /** Whether this reward triggered a level up */
  leveledUp: boolean;
  
  /** User's new level if leveled up */
  newLevel?: number;
}

/**
 * Error response interface for reward operations.
 * Used when a reward operation fails.
 * Extends the common ErrorResponse interface with reward-specific error details.
 */
export interface RewardErrorResponse extends ErrorResponse {
  /** Error code specific to reward operations */
  errorCode: string;
  
  /** Additional reward-specific error details */
  details?: {
    /** The reward ID if applicable */
    rewardId?: string;
    
    /** The profile ID if applicable */
    profileId?: string;
    
    /** The journey context if applicable */
    journey?: JourneyType;
    
    /** Any additional context-specific information */
    [key: string]: any;
  };
}