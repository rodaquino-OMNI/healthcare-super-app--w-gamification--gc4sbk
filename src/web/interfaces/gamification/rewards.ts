/**
 * @file Defines TypeScript interfaces for rewards in the gamification system.
 * These interfaces standardize the representation of benefits that users can earn
 * by completing quests or unlocking achievements.
 */

/**
 * Defines the categories of rewards available in the gamification system.
 * Different reward types may have different redemption processes and availability.
 */
export enum RewardCategory {
  /** Virtual rewards that exist only within the application (badges, avatars) */
  VIRTUAL = 'virtual',
  /** Physical rewards that require shipping (merchandise, products) */
  PHYSICAL = 'physical',
  /** Discount rewards that provide financial benefits (coupons, discounts) */
  DISCOUNT = 'discount',
  /** Experience rewards that provide access to events or services */
  EXPERIENCE = 'experience',
}

/**
 * Defines the possible states of a reward's redemption status.
 * Tracks the lifecycle of a reward from availability to redemption.
 */
export enum RewardStatus {
  /** Reward is available for redemption */
  AVAILABLE = 'available',
  /** Reward has been claimed but not yet processed */
  CLAIMED = 'claimed',
  /** Reward is being processed (shipping, verification) */
  PROCESSING = 'processing',
  /** Reward has been successfully delivered or applied */
  REDEEMED = 'redeemed',
  /** Reward is no longer available (expired, out of stock) */
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
  
  /** Category of the reward determining its type and redemption process */
  category: RewardCategory;
  
  /** Current status of the reward's availability or redemption */
  status: RewardStatus;
  
  /** Date when the reward becomes available */
  availableFrom: string;
  
  /** Date when the reward is no longer available */
  availableUntil: string | null;
  
  /** Number of rewards available (null for unlimited) */
  quantity: number | null;
  
  /** Additional metadata specific to the reward category */
  metadata?: Record<string, any>;
}

/**
 * Defines the structure for tracking a user's reward redemption.
 * Records the history and details of a reward redemption process.
 */
export interface RewardRedemption {
  /** Unique identifier for the redemption */
  id: string;
  
  /** Reference to the redeemed reward */
  rewardId: string;
  
  /** User who redeemed the reward */
  userId: string;
  
  /** When the redemption was initiated */
  redeemedAt: string;
  
  /** Current status of the redemption */
  status: RewardStatus;
  
  /** Shipping or delivery information for physical rewards */
  deliveryInfo?: {
    /** Recipient name */
    name: string;
    /** Delivery address */
    address: string;
    /** Tracking number if available */
    trackingNumber?: string;
    /** Estimated delivery date */
    estimatedDelivery?: string;
  };
  
  /** Discount code for discount rewards */
  discountCode?: string;
  
  /** Access code for experience rewards */
  accessCode?: string;
  
  /** History of status changes */
  statusHistory: {
    /** Status value */
    status: RewardStatus;
    /** When the status changed */
    timestamp: string;
    /** Optional note about the status change */
    note?: string;
  }[];
}