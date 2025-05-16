/**
 * @file Defines TypeScript interfaces for user game profiles in the gamification system.
 * These interfaces provide a standardized way to represent user progress and engagement
 * across all journeys and are used by both web and mobile applications.
 */

import { Achievement } from './achievements';
import { Quest } from './quests';

/**
 * Represents a badge earned by a user in the gamification system.
 * Badges are visual recognition elements that users can display on their profiles.
 */
export interface UserBadge {
  /** Unique identifier for the badge */
  id: string;
  /** Display name of the badge */
  name: string;
  /** Detailed description of what the badge represents */
  description: string;
  /** Which journey this badge is associated with (health, care, plan) */
  journey: string;
  /** Icon identifier for visual representation */
  icon: string;
  /** Date when the badge was earned */
  earnedAt: Date;
  /** Whether the badge is currently displayed on the user's profile */
  isDisplayed: boolean;
  /** Rarity level of the badge (common, uncommon, rare, epic, legendary) */
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

/**
 * Represents a streak of consecutive activity by a user.
 * Streaks track consistent engagement with the platform over time.
 */
export interface UserStreak {
  /** Type of streak (daily login, weekly activity, etc.) */
  type: string;
  /** Current number of consecutive days/weeks/etc. */
  current: number;
  /** Highest streak ever achieved by the user */
  best: number;
  /** Date when the streak was last updated */
  lastUpdated: Date;
  /** Date when the streak will be broken if no activity occurs */
  expiresAt: Date;
  /** Rewards earned at different streak milestones */
  milestones: {
    /** Number of consecutive days/weeks/etc. required to reach this milestone */
    count: number;
    /** Whether this milestone has been reached */
    reached: boolean;
    /** XP bonus awarded for reaching this milestone */
    xpBonus: number;
  }[];
}

/**
 * Represents detailed statistics about a user's engagement with the platform.
 * These statistics provide insights into user behavior and achievements.
 */
export interface ProfileStatistics {
  /** Total number of achievements unlocked */
  achievementsUnlocked: number;
  /** Total number of quests completed */
  questsCompleted: number;
  /** Total XP earned across all activities */
  totalXpEarned: number;
  /** Number of consecutive days with platform activity */
  loginStreak: number;
  /** Date when the user first joined the platform */
  memberSince: Date;
  /** Journey-specific engagement metrics */
  journeyStats: {
    /** Statistics for the health journey */
    health: {
      /** Number of health metrics recorded */
      metricsRecorded: number;
      /** Number of health goals achieved */
      goalsAchieved: number;
      /** Number of days with health activity */
      activeDays: number;
    };
    /** Statistics for the care journey */
    care: {
      /** Number of appointments scheduled */
      appointmentsScheduled: number;
      /** Number of telemedicine sessions completed */
      telemedicineSessions: number;
      /** Medication adherence percentage */
      medicationAdherence: number;
    };
    /** Statistics for the plan journey */
    plan: {
      /** Number of claims submitted */
      claimsSubmitted: number;
      /** Number of benefits utilized */
      benefitsUtilized: number;
      /** Number of plan comparisons made */
      planComparisons: number;
    };
  };
  /** Ranking information for the user */
  rankings: {
    /** Global rank among all users */
    global: number;
    /** Rank within the user's region */
    regional: number;
    /** Rank among the user's friends */
    friends: number;
  };
}

/**
 * Defines the structure for a user's game profile in the gamification system.
 * The game profile tracks the user's progress, level, and engagement
 * across the platform with enhanced tracking for badges, streaks, and statistics.
 */
export interface GameProfile {
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
  /** Badges earned by the user */
  badges: UserBadge[];
  /** Active streaks maintained by the user */
  streaks: UserStreak[];
  /** Detailed statistics about the user's platform engagement */
  statistics: ProfileStatistics;
  /** User's preferred journey (health, care, plan) */
  preferredJourney: string;
  /** Date when the profile was last updated */
  lastUpdated: Date;
  /** Whether the user has enabled gamification features */
  gamificationEnabled: boolean;
  /** User's custom title or status message */
  title?: string;
  /** User's avatar customization settings */
  avatar: {
    /** Avatar image identifier */
    imageId: string;
    /** Avatar frame identifier */
    frameId: string;
    /** Avatar background identifier */
    backgroundId: string;
    /** Whether the avatar uses animated elements */
    animated: boolean;
  };
}