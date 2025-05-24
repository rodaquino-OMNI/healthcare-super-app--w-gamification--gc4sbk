/**
 * @file Defines TypeScript interfaces for achievements in the gamification system.
 * These interfaces are used by both web and mobile platforms to render achievement-related
 * UI components and track user progress across all journeys.
 */

/**
 * Categories for grouping achievements by type across all journeys.
 * Used for filtering and displaying achievements in the UI.
 */
export enum AchievementCategory {
  /** Health journey related achievements */
  HEALTH = 'health',
  /** Care journey related achievements */
  CARE = 'care',
  /** Plan journey related achievements */
  PLAN = 'plan',
  /** General app engagement achievements */
  ENGAGEMENT = 'engagement',
  /** Significant milestone achievements */
  MILESTONE = 'milestone',
  /** Special or seasonal achievements */
  SPECIAL = 'special',
}

/**
 * Detailed progress tracking for achievements.
 * Provides comprehensive information about a user's progress toward unlocking an achievement.
 */
export interface AchievementProgress {
  /** Current progress value toward unlocking the achievement */
  current: number;
  /** Total progress value required to unlock the achievement */
  required: number;
  /** Calculated percentage of completion (0-100) */
  percentage: number;
  /** Timestamp when progress was last updated */
  lastUpdated: Date;
}

/**
 * Defines the structure for an achievement in the gamification system.
 * Achievements represent milestones that users can unlock by performing
 * specific actions or reaching certain thresholds across all journeys.
 */
export interface Achievement {
  /** Unique identifier for the achievement */
  id: string;
  /** Display title of the achievement */
  title: string;
  /** Detailed description of what the achievement represents */
  description: string;
  /** Category this achievement belongs to */
  category: AchievementCategory;
  /** Specific journey this achievement is associated with (health, care, plan) */
  journey: string;
  /** Icon identifier for visual representation */
  icon: string;
  /** Points awarded for unlocking this achievement */
  points: number;
  /** Rarity level of the achievement (common, uncommon, rare, epic, legendary) */
  rarity: string;
  /** URL to the achievement image for visual display */
  imageUrl: string;
  /** URL to the achievement badge for display in profiles and notifications */
  badgeUrl: string;
  /** Achievement tier level (for tiered achievements) */
  tier: number;
  /** Detailed progress information */
  progress: AchievementProgress;
  /** Whether the achievement has been unlocked */
  unlocked: boolean;
  /** Timestamp when the achievement was unlocked, null if not yet unlocked */
  unlockedAt: Date | null;
}

/**
 * Defines the structure for achievement notifications displayed to users.
 * Used for toast/popup displays when a user unlocks an achievement.
 */
export interface AchievementNotification {
  /** ID of the achievement that was unlocked */
  achievementId: string;
  /** Title to display in the notification */
  title: string;
  /** Congratulatory or descriptive message */
  message: string;
  /** URL to the achievement image */
  imageUrl: string;
  /** URL to the achievement badge */
  badgeUrl: string;
  /** Points awarded for this achievement */
  points: number;
  /** Timestamp when the achievement was unlocked */
  timestamp: Date;
}