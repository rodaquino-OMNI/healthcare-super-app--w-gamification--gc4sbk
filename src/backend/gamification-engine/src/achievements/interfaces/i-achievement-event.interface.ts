import { BaseEvent, EventMetadata } from '@austa/interfaces/common';
import { JourneyType } from '@austa/interfaces/common';

/**
 * Base interface for all achievement-related events in the gamification system.
 */
export interface IAchievementEvent extends BaseEvent {
  /**
   * The type of achievement event.
   */
  eventType: AchievementEventType;
  
  /**
   * Metadata for event tracking and processing.
   */
  metadata: EventMetadata;
}

/**
 * Enum defining all possible achievement event types.
 */
export enum AchievementEventType {
  PROGRESS_UPDATED = 'ACHIEVEMENT.PROGRESS_UPDATED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT.UNLOCKED',
  ACHIEVEMENT_RESET = 'ACHIEVEMENT.RESET'
}

/**
 * Interface for events indicating that a user's progress towards an achievement has been updated.
 */
export interface IAchievementProgressEvent extends IAchievementEvent {
  eventType: AchievementEventType.PROGRESS_UPDATED;
  payload: {
    /**
     * The ID of the user's game profile.
     */
    profileId: string;
    
    /**
     * The ID of the achievement.
     */
    achievementId: string;
    
    /**
     * The new progress value.
     */
    progress: number;
    
    /**
     * The journey that generated this progress update.
     */
    sourceJourney: JourneyType;
    
    /**
     * Optional context about what action triggered this progress update.
     */
    context?: Record<string, any>;
  };
}

/**
 * Interface for events indicating that a user has unlocked an achievement.
 */
export interface IAchievementUnlockedEvent extends IAchievementEvent {
  eventType: AchievementEventType.ACHIEVEMENT_UNLOCKED;
  payload: {
    /**
     * The ID of the user's game profile.
     */
    profileId: string;
    
    /**
     * The ID of the achievement.
     */
    achievementId: string;
    
    /**
     * The title of the unlocked achievement.
     */
    achievementTitle: string;
    
    /**
     * The XP reward granted for unlocking this achievement.
     */
    xpReward: number;
    
    /**
     * The journey that triggered the achievement unlock.
     */
    sourceJourney: JourneyType;
    
    /**
     * The timestamp when the achievement was unlocked.
     */
    unlockedAt: string;
  };
}

/**
 * Interface for events indicating that a user's achievement progress has been reset.
 */
export interface IAchievementResetEvent extends IAchievementEvent {
  eventType: AchievementEventType.ACHIEVEMENT_RESET;
  payload: {
    /**
     * The ID of the user's game profile.
     */
    profileId: string;
    
    /**
     * The ID of the achievement.
     */
    achievementId: string;
    
    /**
     * The reason for resetting the achievement progress.
     */
    reason: string;
    
    /**
     * The journey that triggered the achievement reset.
     */
    sourceJourney: JourneyType;
    
    /**
     * The timestamp when the achievement was reset.
     */
    resetAt: string;
  };
}