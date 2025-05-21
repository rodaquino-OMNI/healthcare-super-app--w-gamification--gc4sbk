/**
 * @file achievement-types.ts
 * @description Defines constants for different achievement categories and types used throughout the gamification engine.
 * These constants are used to categorize achievements, define their behavior, and establish consistent achievement types
 * across the application.
 */

import { AchievementType } from '../../achievements/interfaces/achievement-types.enum';

/**
 * Enum representing the journey categories for achievements.
 * 
 * Each achievement is associated with a specific journey or can be cross-journey.
 */
export enum AchievementJourney {
  /**
   * Health journey achievements related to tracking health metrics, connecting devices,
   * setting health goals, and maintaining healthy habits.
   */
  HEALTH = 'HEALTH',

  /**
   * Care journey achievements related to appointments, telemedicine, 
   * provider interactions, and treatment plans.
   */
  CARE = 'CARE',

  /**
   * Plan journey achievements related to insurance plans, claims, 
   * benefits utilization, and coverage understanding.
   */
  PLAN = 'PLAN',

  /**
   * Cross-journey achievements that span multiple journeys and require
   * actions across different parts of the application.
   */
  CROSS_JOURNEY = 'CROSS_JOURNEY'
}

/**
 * Type representing the string literal values of the AchievementJourney enum.
 */
export type AchievementJourneyValue = `${AchievementJourney}`;

/**
 * Enum representing the difficulty levels for achievements.
 * 
 * The difficulty level affects the XP reward and visibility of achievements.
 */
export enum AchievementDifficulty {
  /**
   * Easy achievements that require minimal effort to complete.
   * Typically awarded for basic onboarding actions or simple tasks.
   */
  EASY = 'EASY',

  /**
   * Medium difficulty achievements that require moderate effort or consistency.
   * Typically awarded for regular engagement or completing common tasks.
   */
  MEDIUM = 'MEDIUM',

  /**
   * Hard achievements that require significant effort or dedication.
   * Typically awarded for sustained engagement or completing complex tasks.
   */
  HARD = 'HARD',

  /**
   * Expert achievements that require exceptional effort or mastery.
   * Typically awarded for exceptional performance or completing challenging tasks.
   */
  EXPERT = 'EXPERT'
}

/**
 * Type representing the string literal values of the AchievementDifficulty enum.
 */
export type AchievementDifficultyValue = `${AchievementDifficulty}`;

/**
 * Enum representing the trigger types for achievements.
 * 
 * The trigger type determines how an achievement is unlocked based on user actions.
 */
export enum AchievementTrigger {
  /**
   * One-time achievements that are unlocked after a single action or event.
   * Example: "Complete your profile" or "Book your first appointment"
   */
  ONE_TIME = 'ONE_TIME',

  /**
   * Cumulative achievements that track progress over time and unlock when a threshold is reached.
   * Example: "Track 100 health metrics" or "Submit 10 claims"
   */
  CUMULATIVE = 'CUMULATIVE',

  /**
   * Streak achievements that require consecutive actions over a period of time.
   * Example: "Log in for 7 consecutive days" or "Track steps for 30 days in a row"
   */
  STREAK = 'STREAK',

  /**
   * Milestone achievements that unlock at specific thresholds within a progression.
   * Example: "Reach level 10" or "Earn 5000 XP in the Health journey"
   */
  MILESTONE = 'MILESTONE',

  /**
   * Collection achievements that require completing a set of related achievements.
   * Example: "Unlock all Health journey achievements" or "Complete all appointment-related achievements"
   */
  COLLECTION = 'COLLECTION'
}

/**
 * Type representing the string literal values of the AchievementTrigger enum.
 */
export type AchievementTriggerValue = `${AchievementTrigger}`;

/**
 * Interface for achievement journey metadata.
 */
export interface AchievementJourneyMetadata {
  /**
   * The journey identifier.
   */
  journey: AchievementJourney;

  /**
   * The display name of the journey.
   */
  displayName: string;

  /**
   * The description of the journey.
   */
  description: string;

  /**
   * The icon name to use for representing this journey.
   */
  icon: string;

  /**
   * The primary color associated with this journey.
   */
  primaryColor: string;

  /**
   * The secondary color associated with this journey.
   */
  secondaryColor: string;
}

/**
 * Metadata for all achievement journeys.
 */
export const ACHIEVEMENT_JOURNEY_METADATA: Record<AchievementJourney, AchievementJourneyMetadata> = {
  [AchievementJourney.HEALTH]: {
    journey: AchievementJourney.HEALTH,
    displayName: 'Minha Saúde',
    description: 'Achievements related to health tracking and wellness',
    icon: 'health-journey',
    primaryColor: '#4CAF50',
    secondaryColor: '#E8F5E9'
  },
  [AchievementJourney.CARE]: {
    journey: AchievementJourney.CARE,
    displayName: 'Cuidar-me Agora',
    description: 'Achievements related to medical care and appointments',
    icon: 'care-journey',
    primaryColor: '#2196F3',
    secondaryColor: '#E3F2FD'
  },
  [AchievementJourney.PLAN]: {
    journey: AchievementJourney.PLAN,
    displayName: 'Meu Plano & Benefícios',
    description: 'Achievements related to insurance plans and benefits',
    icon: 'plan-journey',
    primaryColor: '#9C27B0',
    secondaryColor: '#F3E5F5'
  },
  [AchievementJourney.CROSS_JOURNEY]: {
    journey: AchievementJourney.CROSS_JOURNEY,
    displayName: 'Cross-Journey',
    description: 'Achievements that span multiple journeys',
    icon: 'cross-journey',
    primaryColor: '#FF9800',
    secondaryColor: '#FFF3E0'
  }
};

/**
 * Interface for achievement difficulty metadata.
 */
export interface AchievementDifficultyMetadata {
  /**
   * The difficulty level.
   */
  difficulty: AchievementDifficulty;

  /**
   * The display name of the difficulty level.
   */
  displayName: string;

  /**
   * The description of the difficulty level.
   */
  description: string;

  /**
   * The icon name to use for representing this difficulty level.
   */
  icon: string;

  /**
   * The base XP reward for achievements of this difficulty level.
   */
  baseXpReward: number;

  /**
   * The color associated with this difficulty level.
   */
  color: string;
}

/**
 * Metadata for all achievement difficulty levels.
 */
export const ACHIEVEMENT_DIFFICULTY_METADATA: Record<AchievementDifficulty, AchievementDifficultyMetadata> = {
  [AchievementDifficulty.EASY]: {
    difficulty: AchievementDifficulty.EASY,
    displayName: 'Easy',
    description: 'Simple achievements that require minimal effort',
    icon: 'difficulty-easy',
    baseXpReward: 50,
    color: '#4CAF50' // Green
  },
  [AchievementDifficulty.MEDIUM]: {
    difficulty: AchievementDifficulty.MEDIUM,
    displayName: 'Medium',
    description: 'Achievements that require moderate effort',
    icon: 'difficulty-medium',
    baseXpReward: 100,
    color: '#2196F3' // Blue
  },
  [AchievementDifficulty.HARD]: {
    difficulty: AchievementDifficulty.HARD,
    displayName: 'Hard',
    description: 'Challenging achievements that require significant effort',
    icon: 'difficulty-hard',
    baseXpReward: 250,
    color: '#FF9800' // Orange
  },
  [AchievementDifficulty.EXPERT]: {
    difficulty: AchievementDifficulty.EXPERT,
    displayName: 'Expert',
    description: 'Exceptional achievements that require mastery',
    icon: 'difficulty-expert',
    baseXpReward: 500,
    color: '#F44336' // Red
  }
};

/**
 * Interface for achievement trigger metadata.
 */
export interface AchievementTriggerMetadata {
  /**
   * The trigger type.
   */
  trigger: AchievementTrigger;

  /**
   * The display name of the trigger type.
   */
  displayName: string;

  /**
   * The description of the trigger type.
   */
  description: string;

  /**
   * The icon name to use for representing this trigger type.
   */
  icon: string;

  /**
   * Whether this trigger type requires tracking progress.
   */
  requiresProgress: boolean;

  /**
   * Whether this trigger type supports partial completion.
   */
  supportsPartialCompletion: boolean;
}

/**
 * Metadata for all achievement trigger types.
 */
export const ACHIEVEMENT_TRIGGER_METADATA: Record<AchievementTrigger, AchievementTriggerMetadata> = {
  [AchievementTrigger.ONE_TIME]: {
    trigger: AchievementTrigger.ONE_TIME,
    displayName: 'One-Time',
    description: 'Unlocked after a single action or event',
    icon: 'trigger-one-time',
    requiresProgress: false,
    supportsPartialCompletion: false
  },
  [AchievementTrigger.CUMULATIVE]: {
    trigger: AchievementTrigger.CUMULATIVE,
    displayName: 'Cumulative',
    description: 'Tracks progress over time and unlocks at a threshold',
    icon: 'trigger-cumulative',
    requiresProgress: true,
    supportsPartialCompletion: true
  },
  [AchievementTrigger.STREAK]: {
    trigger: AchievementTrigger.STREAK,
    displayName: 'Streak',
    description: 'Requires consecutive actions over time',
    icon: 'trigger-streak',
    requiresProgress: true,
    supportsPartialCompletion: true
  },
  [AchievementTrigger.MILESTONE]: {
    trigger: AchievementTrigger.MILESTONE,
    displayName: 'Milestone',
    description: 'Unlocks at specific thresholds within a progression',
    icon: 'trigger-milestone',
    requiresProgress: true,
    supportsPartialCompletion: true
  },
  [AchievementTrigger.COLLECTION]: {
    trigger: AchievementTrigger.COLLECTION,
    displayName: 'Collection',
    description: 'Requires completing a set of related achievements',
    icon: 'trigger-collection',
    requiresProgress: true,
    supportsPartialCompletion: true
  }
};

/**
 * Interface for achievement display metadata.
 * 
 * This interface provides additional information for rendering achievements in the UI.
 */
export interface AchievementDisplayMetadata {
  /**
   * The achievement type.
   */
  type: AchievementType;

  /**
   * The journey associated with the achievement.
   */
  journey: AchievementJourney;

  /**
   * The difficulty level of the achievement.
   */
  difficulty: AchievementDifficulty;

  /**
   * The trigger type for the achievement.
   */
  trigger: AchievementTrigger;

  /**
   * The target value for cumulative or streak achievements.
   * For example, the number of days for a streak or the count for a cumulative achievement.
   */
  targetValue?: number;

  /**
   * Whether the achievement should be visible before it's unlocked.
   */
  visibleBeforeUnlock: boolean;

  /**
   * Whether the achievement should show progress.
   */
  showProgress: boolean;

  /**
   * The badge image to display for the achievement.
   */
  badgeImage: string;

  /**
   * The animation to play when the achievement is unlocked.
   */
  unlockAnimation?: string;
}

/**
 * Returns the metadata for a specific achievement journey.
 * 
 * @param journey - The achievement journey to get metadata for
 * @returns The metadata for the specified achievement journey
 */
export function getAchievementJourneyMetadata(journey: AchievementJourney): AchievementJourneyMetadata {
  return ACHIEVEMENT_JOURNEY_METADATA[journey];
}

/**
 * Returns the metadata for a specific achievement difficulty level.
 * 
 * @param difficulty - The achievement difficulty to get metadata for
 * @returns The metadata for the specified achievement difficulty
 */
export function getAchievementDifficultyMetadata(difficulty: AchievementDifficulty): AchievementDifficultyMetadata {
  return ACHIEVEMENT_DIFFICULTY_METADATA[difficulty];
}

/**
 * Returns the metadata for a specific achievement trigger type.
 * 
 * @param trigger - The achievement trigger to get metadata for
 * @returns The metadata for the specified achievement trigger
 */
export function getAchievementTriggerMetadata(trigger: AchievementTrigger): AchievementTriggerMetadata {
  return ACHIEVEMENT_TRIGGER_METADATA[trigger];
}

/**
 * Calculates the XP reward for an achievement based on its difficulty and trigger type.
 * 
 * @param difficulty - The difficulty level of the achievement
 * @param trigger - The trigger type of the achievement
 * @param targetValue - The target value for cumulative or streak achievements
 * @returns The calculated XP reward
 */
export function calculateAchievementXpReward(
  difficulty: AchievementDifficulty,
  trigger: AchievementTrigger,
  targetValue?: number
): number {
  const baseReward = ACHIEVEMENT_DIFFICULTY_METADATA[difficulty].baseXpReward;
  
  // Apply multipliers based on trigger type
  switch (trigger) {
    case AchievementTrigger.ONE_TIME:
      return baseReward;
    
    case AchievementTrigger.CUMULATIVE:
      // Scale reward based on target value, with diminishing returns
      return targetValue ? baseReward * Math.sqrt(targetValue / 10) : baseReward;
    
    case AchievementTrigger.STREAK:
      // Streaks are more valuable, so apply a higher multiplier
      return targetValue ? baseReward * Math.sqrt(targetValue / 5) : baseReward;
    
    case AchievementTrigger.MILESTONE:
      // Milestones are significant achievements
      return baseReward * 1.5;
    
    case AchievementTrigger.COLLECTION:
      // Collections are the most valuable achievements
      return baseReward * 2;
    
    default:
      return baseReward;
  }
}

/**
 * Creates a standardized achievement display metadata object.
 * 
 * @param type - The achievement type
 * @param journey - The journey associated with the achievement
 * @param difficulty - The difficulty level of the achievement
 * @param trigger - The trigger type for the achievement
 * @param options - Additional options for the achievement display
 * @returns The achievement display metadata
 */
export function createAchievementDisplayMetadata(
  type: AchievementType,
  journey: AchievementJourney,
  difficulty: AchievementDifficulty,
  trigger: AchievementTrigger,
  options?: {
    targetValue?: number;
    visibleBeforeUnlock?: boolean;
    showProgress?: boolean;
    badgeImage?: string;
    unlockAnimation?: string;
  }
): AchievementDisplayMetadata {
  // Determine if the achievement should be visible before unlock based on type
  const defaultVisibleBeforeUnlock = type !== AchievementType.HIDDEN;
  
  // Determine if progress should be shown based on trigger type
  const defaultShowProgress = ACHIEVEMENT_TRIGGER_METADATA[trigger].requiresProgress;
  
  // Generate a default badge image path based on journey and difficulty
  const journeyCode = journey.toLowerCase();
  const difficultyCode = difficulty.toLowerCase();
  const defaultBadgeImage = `achievements/${journeyCode}_${difficultyCode}.png`;
  
  return {
    type,
    journey,
    difficulty,
    trigger,
    targetValue: options?.targetValue,
    visibleBeforeUnlock: options?.visibleBeforeUnlock ?? defaultVisibleBeforeUnlock,
    showProgress: options?.showProgress ?? defaultShowProgress,
    badgeImage: options?.badgeImage ?? defaultBadgeImage,
    unlockAnimation: options?.unlockAnimation
  };
}

/**
 * Maps a journey value to the corresponding achievement type.
 * 
 * @param journey - The achievement journey
 * @returns The corresponding achievement type
 */
export function mapJourneyToAchievementType(journey: AchievementJourney): AchievementType {
  if (journey === AchievementJourney.CROSS_JOURNEY) {
    return AchievementType.CROSS_JOURNEY;
  }
  return AchievementType.JOURNEY;
}

/**
 * Determines if an achievement requires progress tracking based on its trigger type.
 * 
 * @param trigger - The achievement trigger type
 * @returns Whether the achievement requires progress tracking
 */
export function requiresProgressTracking(trigger: AchievementTrigger): boolean {
  return ACHIEVEMENT_TRIGGER_METADATA[trigger].requiresProgress;
}

/**
 * Determines if an achievement supports partial completion based on its trigger type.
 * 
 * @param trigger - The achievement trigger type
 * @returns Whether the achievement supports partial completion
 */
export function supportsPartialCompletion(trigger: AchievementTrigger): boolean {
  return ACHIEVEMENT_TRIGGER_METADATA[trigger].supportsPartialCompletion;
}