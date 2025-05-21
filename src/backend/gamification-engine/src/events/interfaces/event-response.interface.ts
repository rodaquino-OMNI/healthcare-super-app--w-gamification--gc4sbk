/**
 * @file event-response.interface.ts
 * @description Defines interfaces for standardized event processing responses in the gamification engine.
 * These interfaces ensure consistent result structures throughout the event processing pipeline.
 */

import { AchievementType } from '../../achievements/interfaces/achievement-types.enum';
import { AchievementStatus } from '../../achievements/interfaces/achievement-status.enum';

/**
 * Interface for achievement progress information in event responses.
 * Tracks user progress toward unlocking achievements.
 */
export interface IAchievementProgress {
  /** Unique identifier of the achievement */
  achievementId: string;
  /** Current status of the achievement for the user */
  status: AchievementStatus;
  /** Type of achievement (JOURNEY, CROSS_JOURNEY, SPECIAL) */
  type: AchievementType;
  /** Current progress value (e.g., 3 of 5 steps completed) */
  currentValue: number;
  /** Target value required to complete the achievement */
  targetValue: number;
  /** Percentage of completion (0-100) */
  percentComplete: number;
  /** Whether this achievement was just unlocked by this event */
  newlyUnlocked: boolean;
  /** Optional journey identifier for journey-specific achievements */
  journeyId?: string;
}

/**
 * Interface for quest progress information in event responses.
 * Tracks user progress toward completing quests.
 */
export interface IQuestProgress {
  /** Unique identifier of the quest */
  questId: string;
  /** Current progress value */
  currentValue: number;
  /** Target value required to complete the quest */
  targetValue: number;
  /** Percentage of completion (0-100) */
  percentComplete: number;
  /** Whether this quest was just completed by this event */
  newlyCompleted: boolean;
  /** Optional journey identifier for journey-specific quests */
  journeyId?: string;
}

/**
 * Interface for points awarded information in event responses.
 * Tracks experience points (XP) awarded for various actions.
 */
export interface IPointsAwarded {
  /** Total XP awarded for this event */
  xp: number;
  /** Breakdown of points by category or source */
  breakdown: {
    /** Category or source of the points */
    category: string;
    /** Amount of points awarded for this category */
    amount: number;
    /** Optional description of why points were awarded */
    description?: string;
  }[];
  /** Whether this event triggered a level up */
  leveledUp: boolean;
  /** New level after points were awarded (if leveled up) */
  newLevel?: number;
}

/**
 * Interface for successful event processing results.
 * Contains detailed information about the outcome of event processing.
 */
export interface IEventSuccess {
  /** Unique identifier for tracking this event processing result */
  eventProcessingId: string;
  /** Type of event that was processed */
  eventType: string;
  /** User profile ID associated with this event */
  profileId: string;
  /** Points awarded as a result of this event */
  pointsAwarded?: IPointsAwarded;
  /** Achievement progress updates resulting from this event */
  achievementProgress?: IAchievementProgress[];
  /** Quest progress updates resulting from this event */
  questProgress?: IQuestProgress[];
  /** Journey identifier if this event is specific to a journey */
  journeyId?: string;
  /** Additional journey-specific data related to the event */
  journeyData?: Record<string, any>;
}

/**
 * Interface for error details in event processing responses.
 * Provides structured information about what went wrong during event processing.
 */
export interface IEventError {
  /** Error code for programmatic error handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Detailed error information for debugging */
  details?: {
    /** The specific field or component that caused the error */
    field?: string;
    /** Additional context about the error */
    context?: Record<string, any>;
    /** Stack trace for system errors (only included in development) */
    stack?: string;
  };
  /** Whether this error is retryable */
  retryable: boolean;
  /** Suggested retry delay in milliseconds (if retryable) */
  retryDelayMs?: number;
  /** The number of retry attempts already made */
  retryAttempt?: number;
}

/**
 * Base interface for all event processing responses.
 * Provides a standardized structure for success and error responses.
 */
export interface IEventResponse {
  /** Indicates whether the event processing was successful */
  success: boolean;
  /** The timestamp when the response was generated */
  timestamp: Date;
  /** The result of the event processing, either success data or error details */
  result: IEventSuccess | IEventError;
  /** Optional metadata for additional context */
  metadata?: Record<string, any>;
  /** Optional correlation ID for tracing requests across services */
  correlationId?: string;
  /** Optional source service that processed the event */
  source?: string;
}