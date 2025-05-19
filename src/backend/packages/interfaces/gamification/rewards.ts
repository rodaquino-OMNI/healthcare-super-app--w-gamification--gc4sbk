/**
 * @file Defines TypeScript interfaces for rewards in the gamification engine.
 * Part of the @austa/interfaces package that provides standardized type definitions
 * across the AUSTA SuperApp platform.
 *
 * These interfaces provide a standardized contract for rewards that users can earn
 * by unlocking achievements or completing quests, and for tracking which rewards
 * have been earned by users. Without these interfaces, reward-related functionality
 * would be inconsistent across services, leading to type errors and potential runtime issues.
 *
 * @packageDocumentation
 */

// Import shared interfaces if needed
// import { GameProfileInterface } from '../profiles';

/**
 * Represents the possible journey types in the application.
 * Used to categorize rewards by their associated journey.
 */
export type JourneyType = 'health' | 'care' | 'plan' | 'global';

/**
 * Represents a reward that a user can earn in the gamification system.
 * Part of the reward management feature (F-303) that handles distribution of 
 * digital and physical rewards based on user achievements and progress.
 */
export interface Reward {
  /**
   * Unique identifier for the reward
   */
  id: string;

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
   * @remarks Renamed from xpReward in the entity to xp for consistency with frontend
   */
  xp: number;

  /**
   * Icon name/path used to visually represent the reward
   */
  icon: string;

  /**
   * The journey this reward is associated with
   */
  journey: JourneyType;
}

/**
 * Represents a reward specific to the Health journey.
 * Extends the base Reward interface with health-specific properties.
 */
export interface HealthReward extends Reward {
  /**
   * The journey is always 'health' for this reward type
   */
  journey: 'health';
  
  /**
   * Optional health-specific metadata for the reward
   */
  healthMetadata?: {
    /**
     * Associated health goal category if applicable
     */
    goalCategory?: string;
    
    /**
     * Minimum health metric threshold required to earn this reward
     */
    metricThreshold?: number;
  };
}

/**
 * Represents a reward specific to the Care journey.
 * Extends the base Reward interface with care-specific properties.
 */
export interface CareReward extends Reward {
  /**
   * The journey is always 'care' for this reward type
   */
  journey: 'care';
  
  /**
   * Optional care-specific metadata for the reward
   */
  careMetadata?: {
    /**
     * Associated provider type if applicable
     */
    providerType?: string;
    
    /**
     * Associated appointment type if applicable
     */
    appointmentType?: string;
  };
}

/**
 * Represents a reward specific to the Plan journey.
 * Extends the base Reward interface with plan-specific properties.
 */
export interface PlanReward extends Reward {
  /**
   * The journey is always 'plan' for this reward type
   */
  journey: 'plan';
  
  /**
   * Optional plan-specific metadata for the reward
   */
  planMetadata?: {
    /**
     * Associated benefit category if applicable
     */
    benefitCategory?: string;
    
    /**
     * Associated insurance plan type if applicable
     */
    planType?: string;
  };
}

/**
 * Represents a global reward that applies across all journeys.
 * Extends the base Reward interface with cross-journey properties.
 */
export interface GlobalReward extends Reward {
  /**
   * The journey is always 'global' for this reward type
   */
  journey: 'global';
  
  /**
   * Optional global reward metadata
   */
  globalMetadata?: {
    /**
     * Minimum user level required to earn this reward
     */
    minimumLevel?: number;
    
    /**
     * Whether this is a premium reward
     */
    isPremium?: boolean;
  };
}

/**
 * Represents a game profile in the gamification system.
 * This is a simplified interface for use with UserReward.
 */
export interface GameProfileReference {
  /**
   * Unique identifier for the game profile
   */
  id: string;
  
  /**
   * User ID associated with this profile
   */
  userId: string;
}

/**
 * Represents a reward earned by a user.
 * Part of the reward management feature (F-303) that handles distribution of 
 * digital and physical rewards based on user achievements and progress.
 */
export interface UserReward {
  /**
   * Unique identifier for the user reward
   */
  id: string;
  
  /**
   * Reference to the game profile that earned this reward
   */
  profileId: string;
  
  /**
   * Reference to the reward that was earned
   */
  rewardId: string;
  
  /**
   * The date and time when the reward was earned
   */
  earnedAt: Date;
  
  /**
   * Optional reference to the full game profile object
   * This would be populated when retrieving user rewards with profile data
   */
  profile?: GameProfileReference;
  
  /**
   * Optional reference to the full reward object
   * This would be populated when retrieving user rewards with reward data
   */
  reward?: Reward;
}

/**
 * Represents a request to create a new reward in the system.
 */
export interface CreateRewardDto {
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
  xp: number;
  
  /**
   * Icon name/path used to visually represent the reward
   */
  icon: string;
  
  /**
   * The journey this reward is associated with
   */
  journey: JourneyType;
  
  /**
   * Optional journey-specific metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Represents a request to update an existing reward in the system.
 */
export interface UpdateRewardDto {
  /**
   * Title of the reward displayed to users
   */
  title?: string;
  
  /**
   * Detailed description of the reward
   */
  description?: string;
  
  /**
   * Amount of XP awarded when earning this reward
   */
  xp?: number;
  
  /**
   * Icon name/path used to visually represent the reward
   */
  icon?: string;
  
  /**
   * Optional journey-specific metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Represents a request to grant a reward to a user.
 */
export interface GrantRewardDto {
  /**
   * ID of the profile to grant the reward to
   */
  profileId: string;
  
  /**
   * ID of the reward to grant
   */
  rewardId: string;
  
  /**
   * Optional source that triggered the reward grant
   */
  source?: string;
  
  /**
   * Optional context data related to the reward grant
   */
  context?: Record<string, any>;
}

/**
 * Represents a response when a user earns a reward.
 */
export interface RewardEarnedResponse {
  /**
   * The user reward that was created
   */
  userReward: UserReward;
  
  /**
   * The reward that was earned
   */
  reward: Reward;
  
  /**
   * The amount of XP awarded
   */
  xpAwarded: number;
  
  /**
   * Whether this reward caused a level up
   */
  causedLevelUp: boolean;
  
  /**
   * The user's new level if they leveled up
   */
  newLevel?: number;
}