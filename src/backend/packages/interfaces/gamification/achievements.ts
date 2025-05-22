/**
 * @file Achievement interfaces for the gamification system
 * @description Defines TypeScript interfaces for achievements in the gamification engine,
 * including Achievement, UserAchievement, and related types. These interfaces provide a
 * standardized contract for achievements that users can unlock by completing specific actions,
 * along with tracking user progress for each achievement.
 */

/**
 * Enum representing the different journey types in the application.
 * Used to categorize achievements by their associated journey.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GLOBAL = 'global'
}

/**
 * Represents an achievement that a user can earn in the gamification system.
 * Achievements are milestones that users can unlock by performing specific actions
 * or reaching certain thresholds.
 */
export interface Achievement {
  /**
   * Unique identifier for the achievement.
   */
  id: string;

  /**
   * The title of the achievement.
   */
  title: string;

  /**
   * A description of the achievement.
   */
  description: string;

  /**
   * The journey to which the achievement belongs.
   */
  journey: JourneyType | string;

  /**
   * The name of the icon to display for the achievement.
   */
  icon: string;

  /**
   * The amount of XP (experience points) awarded for unlocking the achievement.
   */
  xpReward: number;
}

/**
 * Represents a user's progress and status for a specific achievement.
 * Tracks whether an achievement has been unlocked and the user's progress towards it.
 */
export interface UserAchievement {
  /**
   * The ID of the user's game profile.
   */
  profileId: string;

  /**
   * The ID of the achievement.
   */
  achievementId: string;

  /**
   * The achievement details.
   */
  achievement: Achievement;

  /**
   * The user's current progress towards unlocking the achievement.
   */
  progress: number;

  /**
   * The total progress needed to unlock the achievement.
   * This is used to calculate completion percentage.
   */
  total: number;

  /**
   * Indicates whether the achievement has been unlocked by the user.
   */
  unlocked: boolean;

  /**
   * The date and time when the achievement was unlocked.
   * Will be null if the achievement hasn't been unlocked yet.
   */
  unlockedAt: Date | null;

  /**
   * The date and time when the user achievement was created.
   */
  createdAt: Date;

  /**
   * The date and time when the user achievement was last updated.
   */
  updatedAt: Date;
}

/**
 * Represents an achievement specific to the Health journey.
 * These achievements are related to health metrics, goals, and activities.
 */
export interface HealthAchievement extends Achievement {
  /**
   * The journey is always set to health for this type of achievement.
   */
  journey: JourneyType.HEALTH;

  /**
   * The specific health metric category this achievement is related to.
   * Examples: 'steps', 'weight', 'sleep', 'heartRate', etc.
   */
  metricCategory?: string;
}

/**
 * Represents an achievement specific to the Care journey.
 * These achievements are related to appointments, medications, and care activities.
 */
export interface CareAchievement extends Achievement {
  /**
   * The journey is always set to care for this type of achievement.
   */
  journey: JourneyType.CARE;

  /**
   * The specific care activity category this achievement is related to.
   * Examples: 'appointments', 'medications', 'telemedicine', etc.
   */
  activityCategory?: string;
}

/**
 * Represents an achievement specific to the Plan journey.
 * These achievements are related to insurance plans, benefits, and claims.
 */
export interface PlanAchievement extends Achievement {
  /**
   * The journey is always set to plan for this type of achievement.
   */
  journey: JourneyType.PLAN;

  /**
   * The specific plan activity category this achievement is related to.
   * Examples: 'claims', 'benefits', 'coverage', etc.
   */
  activityCategory?: string;
}

/**
 * Represents a user achievement with combined details for frontend display.
 * This merges properties from both Achievement and UserAchievement for easier consumption
 * in UI components.
 */
export interface AchievementDisplay {
  /**
   * Unique identifier for the achievement.
   */
  id: string;

  /**
   * The title of the achievement.
   */
  title: string;

  /**
   * A description of the achievement.
   */
  description: string;

  /**
   * The journey to which the achievement belongs.
   */
  journey: JourneyType | string;

  /**
   * The name of the icon to display for the achievement.
   */
  icon: string;

  /**
   * The user's current progress towards unlocking the achievement.
   */
  progress: number;

  /**
   * The total progress needed to unlock the achievement.
   */
  total: number;

  /**
   * Indicates whether the achievement has been unlocked by the user.
   */
  unlocked: boolean;

  /**
   * The amount of XP (experience points) awarded for unlocking the achievement.
   */
  xpReward: number;

  /**
   * The date and time when the achievement was unlocked.
   * Will be null if the achievement hasn't been unlocked yet.
   */
  unlockedAt?: Date | null;
}