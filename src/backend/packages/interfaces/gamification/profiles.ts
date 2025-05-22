/**
 * @file Defines TypeScript interfaces for game profiles in the gamification engine.
 * These interfaces provide a standardized contract for user game profiles across
 * all services, ensuring consistent data structure for storing and retrieving
 * user levels, XP, and associated achievements, quests, and rewards.
 */

import { IUserAchievement } from './achievements';
import { IUserQuest } from './quests';
import { IUserReward } from './rewards';

/**
 * Represents a user's streak of consecutive activities or logins.
 * Used for tracking daily engagement and providing streak-based rewards.
 */
export interface IProfileStreak {
  /**
   * The current number of consecutive days with activity
   */
  current: number;

  /**
   * The highest streak ever achieved by this user
   */
  highest: number;

  /**
   * The date of the last activity that counted towards the streak
   */
  lastActivityDate: string;

  /**
   * Whether the streak is currently active (not broken)
   */
  active: boolean;

  /**
   * Optional metadata for streak-specific information
   */
  metadata?: Record<string, any>;
}

/**
 * Represents a special badge or indicator displayed on a user's profile.
 * Badges can be earned through achievements, special events, or administrative actions.
 */
export interface IProfileBadge {
  /**
   * Unique identifier for the badge
   */
  id: string;

  /**
   * Display name of the badge
   */
  name: string;

  /**
   * Description of how the badge was earned or what it represents
   */
  description: string;

  /**
   * Path or identifier for the badge's icon
   */
  icon: string;

  /**
   * When the badge was awarded to the user
   */
  awardedAt: string;

  /**
   * Whether the badge should be prominently displayed
   */
  featured: boolean;

  /**
   * The journey associated with this badge (health, care, plan, or global)
   */
  journey: string;

  /**
   * Optional expiration date for temporary badges
   */
  expiresAt?: string;
}

/**
 * Represents user-configurable settings for their game profile.
 * Controls visibility, notification preferences, and other personalization options.
 */
export interface IProfileSettings {
  /**
   * Whether the user's profile is visible on leaderboards
   */
  leaderboardVisible: boolean;

  /**
   * Whether to show achievement notifications when unlocked
   */
  achievementNotifications: boolean;

  /**
   * Whether to show level-up notifications
   */
  levelUpNotifications: boolean;

  /**
   * Whether to show quest notifications
   */
  questNotifications: boolean;

  /**
   * Whether to show reward notifications
   */
  rewardNotifications: boolean;

  /**
   * The user's preferred journey theme (health, care, plan)
   */
  preferredTheme?: string;

  /**
   * Additional user-configurable settings stored as key-value pairs
   */
  preferences?: Record<string, any>;
}

/**
 * Represents aggregated metrics and statistics for a user's game profile.
 * Provides a summary of the user's activity and achievements across all journeys.
 */
export interface IUserMetrics {
  /**
   * Total number of achievements unlocked
   */
  totalAchievements: number;

  /**
   * Total number of quests completed
   */
  totalQuests: number;

  /**
   * Total number of rewards earned
   */
  totalRewards: number;

  /**
   * Total XP earned across all activities
   */
  totalXpEarned: number;

  /**
   * Number of consecutive days with activity
   */
  currentStreak: number;

  /**
   * Highest streak ever achieved
   */
  highestStreak: number;

  /**
   * Date of first activity in the system
   */
  firstActivityDate: string;

  /**
   * Date of most recent activity
   */
  lastActivityDate: string;

  /**
   * Journey-specific metrics
   */
  journeyMetrics?: {
    /**
     * Health journey metrics
     */
    health?: {
      /**
       * XP earned in the health journey
       */
      xpEarned: number;
      
      /**
       * Achievements unlocked in the health journey
       */
      achievements: number;
      
      /**
       * Quests completed in the health journey
       */
      quests: number;
    };
    
    /**
     * Care journey metrics
     */
    care?: {
      /**
       * XP earned in the care journey
       */
      xpEarned: number;
      
      /**
       * Achievements unlocked in the care journey
       */
      achievements: number;
      
      /**
       * Quests completed in the care journey
       */
      quests: number;
    };
    
    /**
     * Plan journey metrics
     */
    plan?: {
      /**
       * XP earned in the plan journey
       */
      xpEarned: number;
      
      /**
       * Achievements unlocked in the plan journey
       */
      achievements: number;
      
      /**
       * Quests completed in the plan journey
       */
      quests: number;
    };
  };
}

/**
 * Represents a user's game profile in the gamification system.
 * The game profile tracks the user's progress, level, and engagement
 * across the platform.
 */
export interface IGameProfile {
  /**
   * Unique identifier for the game profile
   */
  id: string;

  /**
   * ID of the user this profile belongs to
   * References the User entity from the auth service
   */
  userId: string;

  /**
   * Current level of the user
   * Starts at 1 and increases as the user gains XP
   */
  level: number;

  /**
   * Current experience points of the user
   * Accumulates as the user completes actions and unlocks achievements
   */
  xp: number;

  /**
   * Collection of achievements unlocked by the user
   * Managed through the UserAchievement entity
   */
  achievements?: IUserAchievement[];

  /**
   * Collection of quests the user is participating in or has completed
   * Managed through the UserQuest entity
   */
  quests?: IUserQuest[];

  /**
   * Collection of rewards earned by the user
   * Managed through the UserReward entity
   */
  rewards?: IUserReward[];

  /**
   * User's streak information for tracking consecutive activities
   */
  streak?: IProfileStreak;

  /**
   * Special badges or indicators displayed on the user's profile
   */
  badges?: IProfileBadge[];

  /**
   * User-configurable settings for their game profile
   */
  settings?: IProfileSettings;

  /**
   * Aggregated metrics and statistics for the user's game profile
   */
  metrics?: IUserMetrics;

  /**
   * Timestamp when the profile was created
   */
  createdAt: Date | string;

  /**
   * Timestamp when the profile was last updated
   */
  updatedAt: Date | string;
}

/**
 * Represents a simplified game profile for use in leaderboards and public displays.
 * Contains only the information that should be visible to other users.
 */
export interface IPublicGameProfile {
  /**
   * Unique identifier for the game profile
   */
  id: string;

  /**
   * ID of the user this profile belongs to
   */
  userId: string;

  /**
   * Display name of the user
   */
  displayName: string;

  /**
   * Current level of the user
   */
  level: number;

  /**
   * Current experience points of the user
   */
  xp: number;

  /**
   * Total number of achievements unlocked
   */
  achievementCount: number;

  /**
   * Featured badges to display on the profile
   */
  featuredBadges?: IProfileBadge[];

  /**
   * The user's current streak
   */
  currentStreak?: number;

  /**
   * Avatar or profile picture URL
   */
  avatarUrl?: string;
}

/**
 * Represents a request to update a user's XP.
 * Used when awarding XP for completing actions, quests, or unlocking achievements.
 */
export interface IUpdateXpRequest {
  /**
   * The amount of XP to add (positive) or subtract (negative)
   */
  amount: number;

  /**
   * The source of the XP change (achievement, quest, action, etc.)
   */
  source: string;

  /**
   * The journey associated with this XP change (health, care, plan)
   */
  journey: string;

  /**
   * Optional reference ID to the entity that triggered the XP change
   */
  referenceId?: string;

  /**
   * Optional metadata for additional context
   */
  metadata?: Record<string, any>;
}

/**
 * Represents the response after updating a user's XP.
 * Includes information about level changes and updated profile state.
 */
export interface IUpdateXpResponse {
  /**
   * The user's profile after the XP update
   */
  profile: IGameProfile;

  /**
   * Whether the user leveled up as a result of this XP change
   */
  leveledUp: boolean;

  /**
   * The user's previous level before the XP change
   */
  previousLevel?: number;

  /**
   * The user's new level after the XP change
   */
  newLevel?: number;

  /**
   * The amount of XP that was added or subtracted
   */
  xpChange: number;

  /**
   * The user's current XP after the change
   */
  currentXp: number;

  /**
   * The XP required to reach the next level
   */
  nextLevelXp: number;
}