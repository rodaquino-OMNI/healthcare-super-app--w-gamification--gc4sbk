/**
 * @file profiles.ts
 * @description Defines TypeScript interfaces for user game profiles in the gamification system.
 * These interfaces provide a standardized way to represent user progress and engagement
 * across all journeys and are used by both web and mobile applications.
 */

import { Achievement } from './achievements';
import { Quest } from './quests';
import { Reward } from './rewards';

/**
 * Represents a visual badge that users can earn and display on their profile.
 * Badges are visual recognition elements that showcase user accomplishments.
 */
export interface UserBadge {
  /** Unique identifier for the badge */
  id: string;
  
  /** Display title of the badge */
  title: string;
  
  /** Detailed description of what the badge represents */
  description: string;
  
  /** Which journey this badge is associated with (health, care, plan, or global) */
  journey: string;
  
  /** Icon identifier for visual representation */
  icon: string;
  
  /** When the badge was earned by the user */
  earnedAt: Date;
  
  /** Whether the badge is currently selected for display on the user's profile */
  isDisplayed: boolean;
  
  /** Rarity level of the badge (common, uncommon, rare, epic, legendary) */
  rarity?: string;
}

/**
 * Represents a user's consecutive activity streak.
 * Streaks track consistent user engagement over time.
 */
export interface UserStreak {
  /** Type of streak (daily, weekly, journey-specific) */
  type: string;
  
  /** Current consecutive days/weeks of activity */
  current: number;
  
  /** Highest streak ever achieved by the user */
  best: number;
  
  /** Date when the streak was last updated */
  lastUpdated: Date;
  
  /** Whether the streak is currently active */
  isActive: boolean;
  
  /** Journey associated with this streak (if journey-specific) */
  journey?: string;
}

/**
 * Represents detailed statistics for a user's profile.
 * These statistics provide insights into user engagement and accomplishments.
 */
export interface ProfileStatistics {
  /** Total number of achievements unlocked */
  achievementsUnlocked: number;
  
  /** Total number of quests completed */
  questsCompleted: number;
  
  /** Total number of rewards earned */
  rewardsEarned: number;
  
  /** Total experience points earned across all activities */
  totalXpEarned: number;
  
  /** Number of consecutive days with activity */
  daysActive: number;
  
  /** Date when the user first started using the platform */
  memberSince: Date;
  
  /** Journey-specific statistics */
  journeyStats?: {
    /** Health journey statistics */
    health?: {
      /** Health metrics recorded */
      metricsRecorded: number;
      /** Health goals achieved */
      goalsAchieved: number;
    };
    /** Care journey statistics */
    care?: {
      /** Appointments attended */
      appointmentsAttended: number;
      /** Medication adherence percentage */
      medicationAdherence: number;
    };
    /** Plan journey statistics */
    plan?: {
      /** Claims submitted */
      claimsSubmitted: number;
      /** Benefits utilized */
      benefitsUtilized: number;
    };
  };
}

/**
 * Defines the structure for a user's game profile in the gamification system.
 * The game profile tracks the user's progress, level, and engagement
 * across the platform.
 */
export interface GameProfile {
  /** User's unique identifier */
  userId: string;
  
  /** User's current level in the gamification system */
  level: number;
  
  /** User's current experience points */
  xp: number;
  
  /** Experience points needed to reach the next level */
  xpToNextLevel: number;
  
  /** Collection of the user's achievements (both locked and unlocked) */
  achievements: Achievement[];
  
  /** Collection of the user's quests (both active and completed) */
  quests: Quest[];
  
  /** Collection of badges earned by the user */
  badges?: UserBadge[];
  
  /** User's activity streaks */
  streaks?: UserStreak[];
  
  /** Detailed statistics about the user's platform engagement */
  statistics?: ProfileStatistics;
  
  /** Collection of rewards earned by the user */
  rewards?: Reward[];
  
  /** User's rank on the global leaderboard */
  globalRank?: number;
  
  /** User's ranks on journey-specific leaderboards */
  journeyRanks?: {
    health?: number;
    care?: number;
    plan?: number;
  };
  
  /** When the profile was created */
  createdAt: Date;
  
  /** When the profile was last updated */
  updatedAt: Date;
}

/**
 * Represents a request to update a user's game profile.
 * Used when incrementing XP, changing level, or updating other profile attributes.
 */
export interface UpdateGameProfileRequest {
  /** New level to set (optional) */
  level?: number;
  
  /** XP to add to the current total (optional) */
  xpToAdd?: number;
  
  /** Absolute XP value to set (optional, overrides xpToAdd) */
  xp?: number;
  
  /** Badges to add to the profile (optional) */
  badgesToAdd?: UserBadge[];
  
  /** Streak updates to apply (optional) */
  streakUpdates?: Partial<UserStreak>[];
}

/**
 * Represents a summarized view of a game profile for display in leaderboards,
 * achievement notifications, and other contexts where the full profile is not needed.
 */
export interface GameProfileSummary {
  /** User's unique identifier */
  userId: string;
  
  /** User's display name */
  displayName: string;
  
  /** User's current level */
  level: number;
  
  /** User's current XP */
  xp: number;
  
  /** User's avatar URL */
  avatarUrl?: string;
  
  /** Count of achievements unlocked */
  achievementCount: number;
  
  /** Selected badges for display */
  displayedBadges: UserBadge[];
  
  /** User's current rank (if in a leaderboard context) */
  rank?: number;
}