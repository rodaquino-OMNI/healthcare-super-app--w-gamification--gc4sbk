/**
 * @file Achievement interfaces for the gamification system
 * @description Defines TypeScript interfaces for achievements in the gamification system,
 * including AchievementCategory, AchievementProgress, and enhanced Achievement interfaces.
 * These types provide a standardized way to represent milestones that users can unlock
 * across all journeys (Health, Care, Plan) and are used by both web and mobile platforms
 * to render achievement-related UI components and track user progress.
 */

/**
 * Defines the categories for achievements in the gamification system.
 * Each category represents a different type of achievement that can be unlocked.
 */
export enum AchievementCategory {
  /** Achievements related to completing health-related activities */
  HEALTH = 'health',
  /** Achievements related to care activities like appointments and treatments */
  CARE = 'care',
  /** Achievements related to insurance plan activities */
  PLAN = 'plan',
  /** Achievements related to general platform engagement */
  ENGAGEMENT = 'engagement',
  /** Achievements related to completing quests */
  QUEST = 'quest',
  /** Special or limited-time achievements */
  SPECIAL = 'special',
  /** Achievements related to social interactions */
  SOCIAL = 'social',
}

/**
 * Defines the structure for tracking detailed progress of an achievement.
 * This provides more granular information about achievement completion status.
 */
export interface AchievementProgress {
  /** Current progress value toward unlocking the achievement */
  current: number;
  /** Total progress value needed to unlock the achievement */
  target: number;
  /** Percentage of completion from 0 to 100 */
  percentage: number;
  /** Timestamp when progress was last updated */
  lastUpdated: string;
  /** Array of milestone values that trigger notifications */
  milestones?: number[];
  /** Whether the achievement is currently in progress */
  inProgress: boolean;
}

/**
 * Defines the structure for an achievement notification in the gamification system.
 * Used for displaying toast/popup notifications when achievements are unlocked or progress is made.
 */
export interface AchievementNotification {
  /** Unique identifier for the notification */
  id: string;
  /** Reference to the achievement ID */
  achievementId: string;
  /** Title to display in the notification */
  title: string;
  /** Message to display in the notification */
  message: string;
  /** Type of notification (unlocked, progress, milestone) */
  type: 'unlocked' | 'progress' | 'milestone';
  /** Icon to display in the notification */
  icon: string;
  /** Journey associated with the achievement */
  journey: string;
  /** Category of the achievement */
  category: AchievementCategory;
  /** XP earned (if any) */
  xpEarned?: number;
  /** Timestamp when the notification was created */
  timestamp: string;
  /** Whether the notification has been read */
  read: boolean;
}

/**
 * Defines the structure for an achievement in the gamification system.
 * Achievements represent milestones that users can unlock by performing
 * specific actions or reaching certain thresholds.
 */
export interface Achievement {
  /** Unique identifier for the achievement */
  id: string;
  /** Display title of the achievement */
  title: string;
  /** Detailed description of what the achievement represents */
  description: string;
  /** Which journey this achievement belongs to (health, care, plan) */
  journey: string;
  /** Category of the achievement */
  category: AchievementCategory;
  /** Icon identifier for visual representation */
  icon: string;
  /** Badge image URL for unlocked achievement */
  badgeImageUrl?: string;
  /** Locked badge image URL for locked achievement */
  lockedBadgeImageUrl?: string;
  /** Detailed progress information */
  progress: AchievementProgress;
  /** Whether the achievement has been unlocked */
  unlocked: boolean;
  /** Timestamp when the achievement was unlocked (if applicable) */
  unlockedAt?: string;
  /** Experience points awarded when unlocked */
  xpReward: number;
  /** Display order for sorting achievements */
  displayOrder?: number;
  /** Whether the achievement is secret (description hidden until unlocked) */
  isSecret?: boolean;
  /** Prerequisites - IDs of achievements that must be unlocked first */
  prerequisites?: string[];
  /** Tags for filtering and grouping */
  tags?: string[];
  /** Whether the achievement is featured/highlighted */
  isFeatured?: boolean;
}