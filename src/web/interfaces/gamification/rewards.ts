/**
 * @file Defines TypeScript interfaces for rewards in the gamification system.
 * @module @austa/interfaces/gamification/rewards
 */

/**
 * Defines the categories of rewards available in the gamification system.
 * Different reward types may have different redemption processes and availability.
 */
export enum RewardCategory {
  /** Virtual rewards exist only within the application (badges, avatars, themes) */
  VIRTUAL = 'virtual',
  /** Physical rewards require shipping to the user (merchandise, products) */
  PHYSICAL = 'physical',
  /** Discount rewards provide financial benefits (coupons, plan discounts) */
  DISCOUNT = 'discount',
}

/**
 * Defines the possible states of a reward in relation to a specific user.
 * Tracks the lifecycle of a reward from availability through redemption.
 */
export enum RewardStatus {
  /** Reward is available for redemption */
  AVAILABLE = 'available',
  /** Reward has been claimed but not yet processed */
  CLAIMED = 'claimed',
  /** Reward is being processed (shipping, discount application, etc.) */
  PROCESSING = 'processing',
  /** Reward has been successfully delivered or applied */
  DELIVERED = 'delivered',
  /** Reward is no longer available (expired, out of stock, etc.) */
  UNAVAILABLE = 'unavailable',
}

/**
 * Defines the structure for a reward in the gamification system.
 * Rewards are granted to users for completing quests, unlocking
 * achievements, or reaching certain milestones.
 */
export interface Reward {
  /** Unique identifier for the reward */
  id: string;
  /** Display title of the reward */
  title: string;
  /** Detailed description of what the reward provides */
  description: string;
  /** Which journey this reward is associated with (health, care, plan) */
  journey: string;
  /** Icon identifier for visual representation */
  icon: string;
  /** Experience points value of the reward */
  xp: number;
  /** Category of the reward (virtual, physical, discount) */
  category: RewardCategory;
  /** Current status of the reward for the user */
  status: RewardStatus;
  /** Date when the reward becomes available */
  availableFrom: Date;
  /** Date when the reward expires and is no longer available */
  availableUntil: Date | null;
  /** Number of times this reward can be redeemed by a single user (null for unlimited) */
  redemptionLimit: number | null;
  /** Additional metadata specific to the reward category (JSON string) */
  metadata?: string;
}

/**
 * Defines the structure for tracking reward redemption history.
 * Records each instance of a user redeeming a reward.
 */
export interface RewardRedemption {
  /** Unique identifier for the redemption record */
  id: string;
  /** Reference to the redeemed reward */
  rewardId: string;
  /** User who redeemed the reward */
  userId: string;
  /** Timestamp when the redemption was initiated */
  redeemedAt: Date;
  /** Current status of the redemption */
  status: RewardStatus;
  /** Timestamp when the status was last updated */
  statusUpdatedAt: Date;
  /** Additional data required for processing the redemption (shipping address, etc.) */
  redemptionData?: string;
  /** Notes or messages related to the redemption (reason for failure, tracking info, etc.) */
  notes?: string;
}