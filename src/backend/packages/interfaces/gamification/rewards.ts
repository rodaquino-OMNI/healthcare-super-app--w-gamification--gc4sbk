/**
 * @file Defines TypeScript interfaces for rewards in the gamification engine.
 * These interfaces provide a standardized contract for rewards that users can earn
 * by unlocking achievements or completing quests, and for tracking which rewards
 * have been earned by users.
 */

/**
 * Represents the different journeys in the AUSTA SuperApp.
 * Each reward is associated with a specific journey or can be global.
 */
export type JourneyType = 'health' | 'care' | 'plan' | 'global';

/**
 * Base interface for reward metadata that applies to all reward types.
 */
export interface RewardBase {
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
   * @remarks
   * This property is named 'xpValue' to standardize between backend ('xpReward')
   * and frontend ('xp') implementations.
   */
  xpValue: number;

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
 * Represents a reward that a user can earn in the gamification system.
 * Part of the reward management feature (F-303) that handles distribution of 
 * digital and physical rewards based on user achievements and progress.
 */
export interface Reward extends RewardBase {
  /**
   * Optional additional metadata specific to this reward
   */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a health journey specific reward.
 * These rewards are earned through health-related activities like
 * completing fitness goals, tracking health metrics, or connecting devices.
 */
export interface HealthReward extends Reward {
  /**
   * The journey is always 'health' for health rewards
   */
  journey: 'health';
  
  /**
   * Health-specific metadata
   */
  metadata?: {
    /**
     * Category of health activity (e.g., 'fitness', 'nutrition', 'sleep')
     */
    category?: string;
    
    /**
     * Difficulty level of the associated health activity
     */
    difficulty?: 'easy' | 'medium' | 'hard';
  };
}

/**
 * Represents a care journey specific reward.
 * These rewards are earned through care-related activities like
 * attending appointments, following treatment plans, or completing telemedicine sessions.
 */
export interface CareReward extends Reward {
  /**
   * The journey is always 'care' for care rewards
   */
  journey: 'care';
  
  /**
   * Care-specific metadata
   */
  metadata?: {
    /**
     * Category of care activity (e.g., 'appointment', 'medication', 'treatment')
     */
    category?: string;
    
    /**
     * Provider associated with this reward, if applicable
     */
    providerId?: string;
  };
}

/**
 * Represents a plan journey specific reward.
 * These rewards are earned through plan-related activities like
 * submitting claims, utilizing benefits, or exploring coverage options.
 */
export interface PlanReward extends Reward {
  /**
   * The journey is always 'plan' for plan rewards
   */
  journey: 'plan';
  
  /**
   * Plan-specific metadata
   */
  metadata?: {
    /**
     * Category of plan activity (e.g., 'claim', 'benefit', 'coverage')
     */
    category?: string;
    
    /**
     * Plan ID associated with this reward, if applicable
     */
    planId?: string;
  };
}

/**
 * Represents a profile in the gamification system.
 * This is a simplified interface for use in cross-service communication.
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
 * Represents a reward earned by a user in the gamification system.
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
}

/**
 * Represents a user reward with expanded reward and profile information.
 * Used for displaying detailed information about earned rewards.
 */
export interface UserRewardWithDetails extends UserReward {
  /**
   * The full reward object with all details
   */
  reward: Reward;

  /**
   * The game profile reference that earned this reward
   */
  profile: GameProfileReference;
}

/**
 * Represents a request to create a new reward in the system.
 */
export interface CreateRewardRequest extends Omit<RewardBase, 'id'> {
  /**
   * Optional metadata specific to the reward type
   */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a request to update an existing reward in the system.
 */
export interface UpdateRewardRequest extends Partial<Omit<Reward, 'id'>> {
  /**
   * Optional metadata to update
   */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a request to assign a reward to a user.
 */
export interface AssignRewardRequest {
  /**
   * ID of the profile to assign the reward to
   */
  profileId: string;
  
  /**
   * ID of the reward to assign
   */
  rewardId: string;
  
  /**
   * Optional source that triggered the reward assignment
   * (e.g., 'achievement', 'quest', 'manual')
   */
  source?: string;
  
  /**
   * Optional reference ID to the entity that triggered the reward
   * (e.g., achievement ID, quest ID)
   */
  referenceId?: string;
}