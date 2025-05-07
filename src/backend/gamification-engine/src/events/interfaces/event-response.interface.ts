/**
 * Interfaces for standardized event processing responses.
 * 
 * This file defines interfaces for success responses, error details, and metadata
 * for achievements, points, and quest progress to ensure consistent result structures
 * throughout the gamification engine.
 */

import { IQuestProgress } from './event-handler.interface';

/**
 * Base interface for event processing responses
 */
export interface IEventResponse {
  /**
   * Whether the event processing was successful
   */
  success: boolean;

  /**
   * The user ID associated with the event
   */
  userId: string;

  /**
   * The event type that was processed
   */
  eventType: string;

  /**
   * The timestamp when the event was processed
   */
  processedAt: Date;

  /**
   * Error details if processing failed
   */
  error?: IEventError;

  /**
   * Success details if processing succeeded
   */
  result?: IEventSuccess;

  /**
   * Additional metadata about the event processing
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for successful event processing results
 */
export interface IEventSuccess {
  /**
   * The points awarded for the event
   */
  pointsAwarded: number;

  /**
   * The total points the user now has
   */
  totalPoints: number;

  /**
   * The achievements unlocked by the event
   */
  achievementsUnlocked: IAchievementUnlocked[];

  /**
   * The quests progressed by the event
   */
  questsProgressed: IQuestProgress[];

  /**
   * The rewards earned by the event
   */
  rewardsEarned: IRewardEarned[];

  /**
   * The user's current level
   */
  currentLevel: number;

  /**
   * Whether the user leveled up from this event
   */
  leveledUp: boolean;

  /**
   * The points needed for the next level
   */
  pointsToNextLevel: number;
}

/**
 * Interface for achievement unlock information
 */
export interface IAchievementUnlocked {
  /**
   * The ID of the achievement
   */
  achievementId: string;

  /**
   * The name of the achievement
   */
  name: string;

  /**
   * The description of the achievement
   */
  description: string;

  /**
   * The points awarded for the achievement
   */
  pointsAwarded: number;

  /**
   * The badge image URL for the achievement
   */
  badgeImageUrl: string;

  /**
   * The timestamp when the achievement was unlocked
   */
  unlockedAt: Date;

  /**
   * The journey associated with the achievement
   */
  journey?: string;
}

/**
 * Interface for reward earned information
 */
export interface IRewardEarned {
  /**
   * The ID of the reward
   */
  rewardId: string;

  /**
   * The name of the reward
   */
  name: string;

  /**
   * The description of the reward
   */
  description: string;

  /**
   * The type of the reward
   */
  type: string;

  /**
   * The value of the reward
   */
  value: string;

  /**
   * The timestamp when the reward was earned
   */
  earnedAt: Date;

  /**
   * The expiration date of the reward, if applicable
   */
  expiresAt?: Date;
}

/**
 * Interface for error details in event processing
 */
export interface IEventError {
  /**
   * The error code
   */
  code: string;

  /**
   * The error message
   */
  message: string;

  /**
   * The error details
   */
  details?: Record<string, any>;

  /**
   * The stack trace, if available
   */
  stack?: string;

  /**
   * Whether the error is retryable
   */
  retryable: boolean;
}