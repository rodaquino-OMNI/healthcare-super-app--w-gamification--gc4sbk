/**
 * @file Achievement interfaces for the gamification system
 * @description Defines TypeScript interfaces for achievements in the gamification engine,
 * including Achievement, UserAchievement, and related types. These interfaces provide a
 * standardized contract for achievements that users can unlock by completing specific actions,
 * along with tracking user progress for each achievement.
 * 
 * @packageDocumentation
 * @module @austa/interfaces/gamification
 */

/**
 * Represents the possible journey types in the application.
 * Each journey has its own set of achievements, quests, and rewards.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Type for journey-specific achievement types.
 * This allows for type-safe access to journey-specific achievement properties.
 */
export type JourneySpecificAchievement<T extends JourneyType> = Achievement & {
  journey: T;
  /**
   * Additional properties specific to each journey type can be added here.
   * For example, health achievements might have health-specific properties.
   */
};

/**
 * Type alias for Health journey achievements.
 */
export type HealthAchievement = JourneySpecificAchievement<JourneyType.HEALTH>;

/**
 * Type alias for Care journey achievements.
 */
export type CareAchievement = JourneySpecificAchievement<JourneyType.CARE>;

/**
 * Type alias for Plan journey achievements.
 */
export type PlanAchievement = JourneySpecificAchievement<JourneyType.PLAN>;

/**
 * Represents an achievement that a user can earn in the gamification system.
 * Achievements are unlocked by completing specific actions or reaching certain thresholds.
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
   * The journey to which the achievement belongs (health, care, plan).
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

  /**
   * The total progress needed to unlock the achievement.
   * This is used to calculate progress percentage.
   */
  total?: number;
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
   * The user's current progress towards unlocking the achievement.
   */
  progress: number;

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

  /**
   * Reference to the achievement object.
   * This is optional and may not be populated in all contexts.
   */
  achievement?: Achievement;
}

/**
 * Interface for achievement data as presented in the frontend.
 * This combines properties from both Achievement and UserAchievement.
 */
export interface AchievementPresentation {
  /**
   * Unique identifier for the achievement.
   */
  id: string;
  
  /**
   * Display title of the achievement.
   */
  title: string;
  
  /**
   * Detailed description of what the achievement represents.
   */
  description: string;
  
  /**
   * Which journey this achievement belongs to (health, care, plan).
   */
  journey: JourneyType | string;
  
  /**
   * Icon identifier for visual representation.
   */
  icon: string;
  
  /**
   * Current progress toward unlocking the achievement.
   */
  progress: number;
  
  /**
   * Total progress needed to unlock the achievement.
   */
  total: number;
  
  /**
   * Whether the achievement has been unlocked.
   */
  unlocked: boolean;
  
  /**
   * The amount of XP (experience points) awarded for unlocking the achievement.
   */
  xpReward: number;
  
  /**
   * The date when the achievement was unlocked, if applicable.
   */
  unlockedAt?: Date | null;
}