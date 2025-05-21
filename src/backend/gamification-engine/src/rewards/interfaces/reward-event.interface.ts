/**
 * @file Reward Event Interfaces
 * @description Defines TypeScript interfaces for reward-related event payloads transmitted through Kafka.
 * These interfaces establish the contract for REWARD_GRANTED events and other reward lifecycle events,
 * ensuring consistent event structure across producers and consumers.
 */

import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

/**
 * Enum defining all possible reward event types.
 * Used for type safety when specifying event types.
 */
export enum RewardEventType {
  /**
   * Event emitted when a reward is granted to a user
   */
  REWARD_GRANTED = 'REWARD_GRANTED',
  
  /**
   * Event emitted when a user claims a reward
   */
  REWARD_CLAIMED = 'REWARD_CLAIMED',
  
  /**
   * Event emitted when a reward expires
   */
  REWARD_EXPIRED = 'REWARD_EXPIRED',
  
  /**
   * Event emitted when a reward is revoked from a user
   */
  REWARD_REVOKED = 'REWARD_REVOKED'
}

/**
 * Enum defining the supported versions of the reward event schema.
 * Used for backward compatibility during schema evolution.
 */
export enum RewardEventVersion {
  /**
   * Initial version of the reward event schema
   */
  V1_0 = '1.0',
  
  /**
   * Future version with extended fields (placeholder)
   */
  V1_1 = '1.1'
}

/**
 * Base interface for all reward-related events.
 * Provides the common structure that all reward events must follow.
 */
export interface IRewardEvent {
  /**
   * The type of reward event
   * @example RewardEventType.REWARD_GRANTED
   */
  type: RewardEventType;
  
  /**
   * The user ID who received or interacted with the reward
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  userId: string;
  
  /**
   * The unique identifier of the reward
   * @example "reward-123"
   */
  rewardId: string;
  
  /**
   * ISO timestamp when the event occurred
   * @example "2023-04-15T14:32:17.000Z"
   */
  timestamp: string;
  
  /**
   * The journey context where the reward was earned
   * @example "HEALTH", "CARE", "PLAN"
   */
  journey?: JourneyType;
  
  /**
   * Version of the event schema, used for backward compatibility
   * @default RewardEventVersion.V1_0
   */
  version?: RewardEventVersion;
}

/**
 * Interface for REWARD_GRANTED events.
 * These events are emitted when a user earns a reward through the gamification system.
 */
export interface IRewardGrantedEvent extends IRewardEvent {
  /**
   * The type of reward event, always REWARD_GRANTED for this interface
   */
  type: RewardEventType.REWARD_GRANTED;
  
  /**
   * The title or name of the reward that was granted
   * @example "Health Champion Badge"
   */
  rewardTitle: string;
  
  /**
   * The amount of XP awarded with this reward
   * @example 100
   */
  xpReward: number;
  
  /**
   * Optional metadata about how the reward was earned
   */
  earnedFrom?: {
    /**
     * The source that triggered the reward (achievement, quest, etc.)
     * @example "achievement", "quest", "direct"
     */
    source?: string;
    
    /**
     * The ID of the source that triggered the reward
     * @example "achievement-123", "quest-456"
     */
    sourceId?: string;
  };
}

/**
 * Interface for REWARD_CLAIMED events.
 * These events are emitted when a user claims a previously granted reward.
 */
export interface IRewardClaimedEvent extends IRewardEvent {
  /**
   * The type of reward event, always REWARD_CLAIMED for this interface
   */
  type: RewardEventType.REWARD_CLAIMED;
  
  /**
   * The title or name of the reward that was claimed
   * @example "Health Champion Badge"
   */
  rewardTitle: string;
  
  /**
   * Optional redemption details for the claimed reward
   */
  redemption?: {
    /**
     * The method used to redeem the reward
     * @example "in-app", "external"
     */
    method?: string;
    
    /**
     * Any additional data related to the redemption
     */
    data?: Record<string, any>;
  };
}

/**
 * Interface for REWARD_EXPIRED events.
 * These events are emitted when a reward expires before being claimed.
 */
export interface IRewardExpiredEvent extends IRewardEvent {
  /**
   * The type of reward event, always REWARD_EXPIRED for this interface
   */
  type: RewardEventType.REWARD_EXPIRED;
  
  /**
   * The title or name of the reward that expired
   * @example "Limited Time Offer"
   */
  rewardTitle: string;
  
  /**
   * The date when the reward was originally granted
   * @example "2023-04-01T00:00:00.000Z"
   */
  grantedAt: string;
  
  /**
   * The date when the reward was set to expire
   * @example "2023-04-15T23:59:59.999Z"
   */
  expirationDate: string;
}

/**
 * Interface for REWARD_REVOKED events.
 * These events are emitted when a reward is revoked from a user (e.g., due to policy violation).
 */
export interface IRewardRevokedEvent extends IRewardEvent {
  /**
   * The type of reward event, always REWARD_REVOKED for this interface
   */
  type: RewardEventType.REWARD_REVOKED;
  
  /**
   * The title or name of the reward that was revoked
   * @example "Health Champion Badge"
   */
  rewardTitle: string;
  
  /**
   * The reason for revoking the reward
   * @example "policy_violation", "system_error", "administrative_action"
   */
  reason: string;
  
  /**
   * Optional administrator ID who performed the revocation
   * @example "admin-123"
   */
  revokedBy?: string;
}

/**
 * Type representing all possible reward event interfaces.
 * Used for type-safe handling of reward events.
 */
export type RewardEvent = 
  | IRewardGrantedEvent 
  | IRewardClaimedEvent 
  | IRewardExpiredEvent 
  | IRewardRevokedEvent;