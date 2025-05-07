/**
 * Interfaces for standardized event processing responses in the gamification engine.
 * 
 * This file defines the structure for event processing results, ensuring consistent
 * response formats throughout the gamification engine. It includes interfaces for
 * success responses, error details, and metadata for achievements, points, and quest progress.
 */

import { IEvent } from './event.interface';
import { JourneyEvent } from './journey-events.interface';

/**
 * Base interface for all event processing responses
 */
export interface IEventResponse {
  /**
   * Whether the event processing was successful
   */
  success: boolean;

  /**
   * The event that was processed
   */
  event: IEvent;

  /**
   * The timestamp when the event was processed
   */
  processedAt: Date;

  /**
   * The result of the event processing
   * Contains either success data or error details
   */
  result: IEventSuccess | IEventError;

  /**
   * The time taken to process the event in milliseconds
   */
  processingTimeMs: number;

  /**
   * Optional metadata for the response
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
   * The user's total points after processing this event
   */
  totalPoints: number;

  /**
   * The user's current level
   */
  currentLevel: number;

  /**
   * The points needed to reach the next level
   */
  pointsToNextLevel: number;

  /**
   * Achievements unlocked by this event, if any
   */
  achievementsUnlocked?: IAchievementUnlocked[];

  /**
   * Quests progressed by this event, if any
   */
  questsProgressed?: IQuestProgress[];

  /**
   * Rewards earned by this event, if any
   */
  rewardsEarned?: IRewardEarned[];

  /**
   * Whether the user leveled up as a result of this event
   */
  leveledUp: boolean;

  /**
   * Journey-specific response data
   */
  journeyData?: IHealthEventSuccess | ICareEventSuccess | IPlanEventSuccess;
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
  details?: string;

  /**
   * The stack trace, if available (only in development)
   */
  stack?: string;

  /**
   * Whether the error is retryable
   */
  retryable: boolean;

  /**
   * The number of retry attempts made, if applicable
   */
  retryAttempt?: number;

  /**
   * The suggested delay before retrying, in milliseconds
   */
  retryDelayMs?: number;

  /**
   * The source of the error
   */
  source?: 'validation' | 'processing' | 'database' | 'external' | 'unknown';

  /**
   * Additional error context
   */
  context?: Record<string, any>;
}

/**
 * Interface for unlocked achievements
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
   * The timestamp when the achievement was unlocked
   */
  unlockedAt: Date;

  /**
   * The points awarded for unlocking the achievement
   */
  pointsAwarded: number;

  /**
   * The badge image URL for the achievement
   */
  badgeImageUrl: string;

  /**
   * The journey associated with the achievement
   */
  journey?: 'health' | 'care' | 'plan' | 'cross-journey';

  /**
   * The rarity of the achievement
   */
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

  /**
   * The category of the achievement
   */
  category?: string;

  /**
   * Whether the achievement should be featured
   */
  featured?: boolean;
}

/**
 * Interface for quest progress
 */
export interface IQuestProgress {
  /**
   * The ID of the quest
   */
  questId: string;

  /**
   * The name of the quest
   */
  name: string;

  /**
   * The description of the quest
   */
  description: string;

  /**
   * The current progress towards completion (0-100)
   */
  progressPercentage: number;

  /**
   * The number of steps completed
   */
  stepsCompleted: number;

  /**
   * The total number of steps required
   */
  totalSteps: number;

  /**
   * Whether the quest is completed
   */
  completed: boolean;

  /**
   * The timestamp when the quest was completed, if applicable
   */
  completedAt?: Date;

  /**
   * The points awarded for completing the quest
   */
  pointsAwarded: number;

  /**
   * The journey associated with the quest
   */
  journey?: 'health' | 'care' | 'plan' | 'cross-journey';

  /**
   * The expiration date of the quest, if applicable
   */
  expiresAt?: Date;

  /**
   * The rewards for completing the quest
   */
  rewards?: IRewardEarned[];
}

/**
 * Interface for earned rewards
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
   * The timestamp when the reward was earned
   */
  earnedAt: Date;

  /**
   * The type of reward
   */
  type: 'discount' | 'cashback' | 'gift' | 'subscription' | 'access' | 'other';

  /**
   * The value of the reward, if applicable
   */
  value?: number;

  /**
   * The currency of the reward value, if applicable
   */
  currency?: string;

  /**
   * The image URL for the reward
   */
  imageUrl?: string;

  /**
   * The expiration date of the reward, if applicable
   */
  expiresAt?: Date;

  /**
   * The redemption code for the reward, if applicable
   */
  redemptionCode?: string;

  /**
   * Whether the reward has been redeemed
   */
  redeemed: boolean;

  /**
   * The timestamp when the reward was redeemed, if applicable
   */
  redeemedAt?: Date;

  /**
   * The journey associated with the reward
   */
  journey?: 'health' | 'care' | 'plan' | 'cross-journey';
}

/**
 * Interface for health journey event success data
 */
export interface IHealthEventSuccess {
  /**
   * Health-specific metrics updated by this event
   */
  metricsUpdated?: string[];

  /**
   * Health goals affected by this event
   */
  goalsAffected?: string[];

  /**
   * Health streak information
   */
  streakInfo?: {
    /**
     * The current streak count
     */
    currentStreak: number;

    /**
     * The best streak achieved
     */
    bestStreak: number;

    /**
     * The type of streak
     */
    streakType: string;
  };

  /**
   * Health insights generated from this event
   */
  insightsGenerated?: {
    /**
     * The ID of the insight
     */
    insightId: string;

    /**
     * The type of insight
     */
    type: string;

    /**
     * The message for the insight
     */
    message: string;
  }[];
}

/**
 * Interface for care journey event success data
 */
export interface ICareEventSuccess {
  /**
   * Care appointments affected by this event
   */
  appointmentsAffected?: string[];

  /**
   * Medication adherence information
   */
  medicationAdherence?: {
    /**
     * The medication ID
     */
    medicationId: string;

    /**
     * The adherence percentage
     */
    adherencePercentage: number;

    /**
     * The current streak
     */
    currentStreak: number;
  }[];

  /**
   * Telemedicine session information
   */
  telemedicineInfo?: {
    /**
     * The session ID
     */
    sessionId: string;

    /**
     * The duration of the session in minutes
     */
    durationMinutes: number;

    /**
     * The provider ID
     */
    providerId: string;
  };
}

/**
 * Interface for plan journey event success data
 */
export interface IPlanEventSuccess {
  /**
   * Claims affected by this event
   */
  claimsAffected?: string[];

  /**
   * Benefits utilized in this event
   */
  benefitsUtilized?: {
    /**
     * The benefit ID
     */
    benefitId: string;

    /**
     * The utilization percentage
     */
    utilizationPercentage: number;

    /**
     * The savings amount, if applicable
     */
    savingsAmount?: number;
  }[];

  /**
   * Plan selection information
   */
  planInfo?: {
    /**
     * The plan ID
     */
    planId: string;

    /**
     * The plan name
     */
    planName: string;

    /**
     * The coverage level
     */
    coverageLevel: string;
  };
}

/**
 * Type guard to check if a response result is a success result
 * @param result The result to check
 * @returns True if the result is a success result
 */
export function isEventSuccess(result: IEventSuccess | IEventError): result is IEventSuccess {
  return (result as IEventSuccess).pointsAwarded !== undefined;
}

/**
 * Type guard to check if a response result is an error result
 * @param result The result to check
 * @returns True if the result is an error result
 */
export function isEventError(result: IEventSuccess | IEventError): result is IEventError {
  return (result as IEventError).code !== undefined;
}

/**
 * Creates a successful event response
 * @param event The event that was processed
 * @param successResult The success result data
 * @param processingTimeMs The time taken to process the event
 * @returns A complete event response object
 */
export function createSuccessResponse(
  event: IEvent,
  successResult: IEventSuccess,
  processingTimeMs: number
): IEventResponse {
  return {
    success: true,
    event,
    processedAt: new Date(),
    result: successResult,
    processingTimeMs,
  };
}

/**
 * Creates an error event response
 * @param event The event that was processed
 * @param errorResult The error result data
 * @param processingTimeMs The time taken to process the event
 * @returns A complete event response object
 */
export function createErrorResponse(
  event: IEvent,
  errorResult: IEventError,
  processingTimeMs: number
): IEventResponse {
  return {
    success: false,
    event,
    processedAt: new Date(),
    result: errorResult,
    processingTimeMs,
  };
}