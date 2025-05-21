import { IBaseEvent, IEventPayload } from '../../events/interfaces/event.interface';
import { IAchievement } from './i-achievement.interface';
import { IUserAchievement } from './i-user-achievement.interface';
import { AchievementStatus } from './achievement-status.enum';

/**
 * Enum defining the types of achievement-related events in the system.
 * Used to categorize and route achievement events to appropriate handlers.
 */
export enum AchievementEventType {
  /** Event emitted when an achievement is unlocked by a user */
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  
  /** Event emitted when progress is made toward an achievement */
  ACHIEVEMENT_PROGRESS = 'achievement.progress',
  
  /** Event emitted when an achievement is reset for a user */
  ACHIEVEMENT_RESET = 'achievement.reset',
  
  /** Event emitted when a new achievement is created in the system */
  ACHIEVEMENT_CREATED = 'achievement.created',
  
  /** Event emitted when an achievement is updated */
  ACHIEVEMENT_UPDATED = 'achievement.updated'
}

/**
 * Base interface for all achievement-related event payloads.
 * Provides common properties shared across all achievement events.
 */
export interface IAchievementEventPayload extends IEventPayload {
  /** The unique identifier of the achievement */
  achievementId: string;
  
  /** The unique identifier of the user */
  userId: string;
  
  /** The journey this achievement belongs to (health, care, plan) */
  journey: string;
  
  /** Timestamp when the event occurred */
  timestamp: string;
  
  /** Optional metadata for additional context */
  metadata?: Record<string, any>;
}

/**
 * Interface for achievement unlocked event payloads.
 * Contains data specific to when a user unlocks an achievement.
 */
export interface IAchievementUnlockedPayload extends IAchievementEventPayload {
  /** The achievement that was unlocked */
  achievement: Partial<IAchievement>;
  
  /** The XP reward granted for unlocking the achievement */
  xpAwarded: number;
  
  /** Any additional rewards granted */
  additionalRewards?: {
    /** Identifier of the reward */
    rewardId: string;
    /** Type of reward */
    rewardType: string;
    /** Value of the reward */
    value: any;
  }[];
}

/**
 * Interface for achievement progress event payloads.
 * Contains data about a user's progress toward unlocking an achievement.
 */
export interface IAchievementProgressPayload extends IAchievementEventPayload {
  /** Current progress value */
  currentValue: number;
  
  /** Target value needed to unlock the achievement */
  targetValue: number;
  
  /** Calculated percentage of completion (0-100) */
  percentComplete: number;
  
  /** Previous progress value before this update */
  previousValue?: number;
  
  /** The action that triggered this progress update */
  triggeringAction?: string;
}

/**
 * Interface for achievement reset event payloads.
 * Contains data about resetting a user's progress on an achievement.
 */
export interface IAchievementResetPayload extends IAchievementEventPayload {
  /** Reason for the reset */
  reason: string;
  
  /** Previous status before reset */
  previousStatus: AchievementStatus;
  
  /** Previous progress value before reset */
  previousProgress?: number;
  
  /** Whether XP should be deducted */
  deductXp: boolean;
  
  /** Amount of XP to deduct if applicable */
  xpToDeduct?: number;
}

/**
 * Interface for achievement created event payloads.
 * Contains data about a newly created achievement in the system.
 */
export interface IAchievementCreatedPayload extends IAchievementEventPayload {
  /** The newly created achievement */
  achievement: IAchievement;
}

/**
 * Interface for achievement updated event payloads.
 * Contains data about updates to an existing achievement.
 */
export interface IAchievementUpdatedPayload extends IAchievementEventPayload {
  /** The updated achievement */
  achievement: Partial<IAchievement>;
  
  /** Fields that were updated */
  updatedFields: string[];
}

/**
 * Type union of all achievement event payload types.
 * Useful for discriminated unions in event handlers.
 */
export type AchievementEventPayload =
  | IAchievementUnlockedPayload
  | IAchievementProgressPayload
  | IAchievementResetPayload
  | IAchievementCreatedPayload
  | IAchievementUpdatedPayload;

/**
 * Interface for achievement unlocked events.
 * Represents the complete event when a user unlocks an achievement.
 */
export interface IAchievementUnlockedEvent extends IBaseEvent {
  type: AchievementEventType.ACHIEVEMENT_UNLOCKED;
  payload: IAchievementUnlockedPayload;
}

/**
 * Interface for achievement progress events.
 * Represents the complete event when a user makes progress toward an achievement.
 */
export interface IAchievementProgressEvent extends IBaseEvent {
  type: AchievementEventType.ACHIEVEMENT_PROGRESS;
  payload: IAchievementProgressPayload;
}

/**
 * Interface for achievement reset events.
 * Represents the complete event when a user's achievement progress is reset.
 */
export interface IAchievementResetEvent extends IBaseEvent {
  type: AchievementEventType.ACHIEVEMENT_RESET;
  payload: IAchievementResetPayload;
}

/**
 * Interface for achievement created events.
 * Represents the complete event when a new achievement is created in the system.
 */
export interface IAchievementCreatedEvent extends IBaseEvent {
  type: AchievementEventType.ACHIEVEMENT_CREATED;
  payload: IAchievementCreatedPayload;
}

/**
 * Interface for achievement updated events.
 * Represents the complete event when an achievement is updated.
 */
export interface IAchievementUpdatedEvent extends IBaseEvent {
  type: AchievementEventType.ACHIEVEMENT_UPDATED;
  payload: IAchievementUpdatedPayload;
}

/**
 * Type union of all achievement event types.
 * Useful for discriminated unions in event handlers.
 */
export type AchievementEvent =
  | IAchievementUnlockedEvent
  | IAchievementProgressEvent
  | IAchievementResetEvent
  | IAchievementCreatedEvent
  | IAchievementUpdatedEvent;