import { FilterDto } from '@austa/interfaces/common/dto';
import { Reward } from '@austa/interfaces/gamification/rewards';

/**
 * @file reward-request.interface.ts
 * @description Defines request interfaces for all reward-related API endpoints.
 * These interfaces provide type validation and structure for incoming requests
 * to the rewards controller, ensuring data integrity and consistent error handling.
 * 
 * The interfaces defined here are implemented by DTOs in the rewards/dto directory,
 * which add class-validator decorators for runtime validation.
 */

/**
 * Interface for creating a new reward in the gamification system.
 * Used to validate incoming request data when creating rewards.
 * 
 * @see CreateRewardDto for the implementation with validation decorators
 */
export interface ICreateRewardRequest extends Omit<Reward, 'id'> {
  /**
   * Title of the reward displayed to users
   */
  title: string;

  /**
   * Detailed description of the reward
   */
  description: string;

  /**
   * Amount of XP awarded when earning this reward
   */
  xpReward: number;

  /**
   * Icon name/path used to visually represent the reward
   */
  icon: string;

  /**
   * The journey this reward is associated with
   * Can be 'health', 'care', 'plan', or 'global' for cross-journey rewards
   */
  journey: JourneyType;
}

/**
 * Interface for updating an existing reward
 * Makes all fields optional to support partial updates
 * 
 * @see UpdateRewardDto for the implementation with validation decorators
 */
export interface IUpdateRewardRequest extends Partial<Omit<Reward, 'id'>> {
  /**
   * Optional title update
   */
  title?: string;
  
  /**
   * Optional description update
   */
  description?: string;
  
  /**
   * Optional XP reward update
   */
  xpReward?: number;
  
  /**
   * Optional icon update
   */
  icon?: string;
  
  /**
   * Optional journey update
   */
  journey?: JourneyType;
}

/**
 * Enum for valid journey types in the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GLOBAL = 'global'
}

/**
 * Interface for filtering rewards in list operations.
 * Extends the standard FilterDto with reward-specific filtering options.
 * 
 * @see FilterRewardDto for the implementation with validation decorators
 */
export interface IFilterRewardsRequest extends FilterDto {
  /**
   * Filter rewards by specific journey
   */
  journeyFilter?: JourneyType;
  
  /**
   * Search for rewards by title (case-insensitive)
   */
  titleSearch?: string;
  
  /**
   * Filter rewards by XP range
   */
  xpRange?: {
    min?: number;
    max?: number;
  };
  
  /**
   * Pagination options
   */
  pagination?: {
    /**
     * Page number (1-based)
     */
    page: number;
    
    /**
     * Number of items per page
     */
    limit: number;
  };
}

/**
 * Interface for finding a specific reward by ID
 * 
 * @see FindOneRewardDto for the implementation with validation decorators
 */
export interface IFindOneRewardRequest {
  /**
   * Unique identifier of the reward to find
   */
  id: string;
  
  /**
   * Optional flag to include related entities
   */
  includeRelated?: boolean;
}

/**
 * Interface for granting a reward to a user
 * 
 * @see GrantRewardDto for the implementation with validation decorators
 */
export interface IGrantRewardRequest {
  /**
   * ID of the user to grant the reward to
   */
  userId: string;
  
  /**
   * ID of the reward to grant
   */
  rewardId: string;
  
  /**
   * Optional metadata about the reward grant
   * Can include information about how the reward was earned
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for batch granting rewards to users
 * Used for bulk operations when multiple users earn the same reward
 * or a single user earns multiple rewards
 * 
 * @see BatchGrantRewardsDto for the implementation with validation decorators
 */
export interface IBatchGrantRewardsRequest {
  /**
   * Array of grant reward requests
   */
  grants: IGrantRewardRequest[];
  
  /**
   * Optional flag to process grants in a transaction
   * If true, either all grants succeed or all fail
   */
  useTransaction?: boolean;
}

/**
 * Interface for reward redemption requests
 * Used when a user wants to redeem a reward they've earned
 * 
 * @see RedeemRewardDto for the implementation with validation decorators
 */
export interface IRedeemRewardRequest {
  /**
   * ID of the user redeeming the reward
   */
  userId: string;
  
  /**
   * ID of the user reward to redeem
   */
  userRewardId: string;
  
  /**
   * Optional redemption details (e.g., shipping address, preferences)
   */
  redemptionDetails?: Record<string, any>;
  
  /**
   * Timestamp of the redemption request
   * Defaults to current time if not provided
   */
  redeemedAt?: Date;
}