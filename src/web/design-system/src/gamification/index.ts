/**
 * @file Gamification Components Barrel File
 * 
 * This file serves as the central export point for all gamification-related UI components
 * from the design system. It provides a unified import surface for gamification components
 * including achievements, quests, rewards, leaderboards, and XP visualization.
 * 
 * These components ensure consistent UI representation across both web and mobile applications
 * that interact with the gamification system.
 * 
 * @example Import all gamification components
 * ```typescript
 * import * as GamificationComponents from '@austa/design-system/gamification';
 * ```
 * 
 * @example Import specific components directly
 * ```typescript
 * import { AchievementBadge, QuestCard, RewardCard } from '@austa/design-system/gamification';
 * ```
 */

// Import components from their respective folders
import { AchievementBadge } from './AchievementBadge';
import { AchievementNotification } from './AchievementNotification';
import { Leaderboard } from './Leaderboard';
import { LevelIndicator } from './LevelIndicator';
import { QuestCard } from './QuestCard';
import { RewardCard } from './RewardCard';
import { XPCounter } from './XPCounter';

// Import interfaces from @austa/interfaces/gamification
import type {
  Achievement,
  AchievementCategory,
  AchievementNotification as AchievementNotificationType,
  Leaderboard as LeaderboardType,
  LeaderboardEntry,
  Quest,
  QuestCategory,
  QuestStatus,
  Reward,
  RewardCategory,
  RewardStatus,
  ExperienceLevel,
  XPSource,
  XPTransaction
} from '@austa/interfaces/gamification';

// Define component prop interfaces using the imported types

/**
 * Props for the AchievementBadge component.
 * Displays a visual representation of an achievement with optional progress indicator.
 */
export interface AchievementBadgeProps {
  /** The achievement to display */
  achievement: Achievement;
  /** Size of the badge (small, medium, large) */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show progress indicator for incomplete achievements */
  showProgress?: boolean;
  /** Optional callback when the badge is pressed */
  onPress?: (achievement: Achievement) => void;
}

/**
 * Props for the AchievementNotification component.
 * Displays a toast/popup notification when an achievement is unlocked.
 */
export interface AchievementNotificationProps {
  /** The achievement notification data to display */
  achievement: AchievementNotificationType;
  /** Callback when the notification is closed */
  onClose?: () => void;
}

/**
 * Props for the Leaderboard component.
 * Displays a ranking of users based on XP and achievements.
 */
export interface LeaderboardProps {
  /** The leaderboard data to display */
  leaderboard: LeaderboardType;
  /** ID of the current user to highlight in the leaderboard */
  currentUserId?: string;
  /** Journey context for theming (health, care, plan) */
  journey?: 'health' | 'care' | 'plan';
  /** Optional title for the leaderboard */
  title?: string;
}

/**
 * Props for the LevelIndicator component.
 * Displays a user's current level and progress toward the next level.
 */
export interface LevelIndicatorProps {
  /** Current user level */
  level: number;
  /** Current XP amount */
  currentXp: number;
  /** XP required for next level */
  nextLevelXp: number;
  /** Journey context for theming (health, care, plan) */
  journey?: 'health' | 'care' | 'plan';
}

/**
 * Props for the QuestCard component.
 * Displays a quest with progress indicator and details.
 */
export interface QuestCardProps {
  /** The quest to display */
  quest: Quest;
  /** Journey context for theming (health, care, plan) */
  journey?: 'health' | 'care' | 'plan';
  /** Optional callback when the card is pressed */
  onPress?: (quest: Quest) => void;
}

/**
 * Props for the RewardCard component.
 * Displays a reward with details and claim button.
 */
export interface RewardCardProps {
  /** The reward to display */
  reward: Reward;
  /** Whether the reward has been earned by the user */
  isEarned: boolean;
  /** Journey context for theming (health, care, plan) */
  journey?: 'health' | 'care' | 'plan';
  /** Callback when the claim button is pressed */
  onClaim?: (reward: Reward) => void;
}

/**
 * Props for the XPCounter component.
 * Displays experience points with optional animation.
 */
export interface XPCounterProps {
  /** XP value to display */
  value: number;
  /** Size of the counter (small, medium, large) */
  size?: 'small' | 'medium' | 'large';
  /** Journey context for theming (health, care, plan) */
  journey?: 'health' | 'care' | 'plan';
  /** Whether to animate the counter when value changes */
  animated?: boolean;
}

// Export components

/**
 * Displays a visual representation of an achievement with optional progress indicator.
 * Supports all achievement types across health, care, and plan journeys.
 */
export { AchievementBadge };

/**
 * Displays a toast/popup notification when an achievement is unlocked.
 * Provides visual feedback to users for their accomplishments.
 */
export { AchievementNotification };

/**
 * Displays a ranking of users based on XP and achievements.
 * Supports filtering by journey and time period.
 */
export { Leaderboard };

/**
 * Displays a user's current level and progress toward the next level.
 * Visualizes progression in the gamification system.
 */
export { LevelIndicator };

/**
 * Displays a quest with progress indicator and details.
 * Shows time-limited challenges that users can complete.
 */
export { QuestCard };

/**
 * Displays a reward with details and claim button.
 * Shows benefits that users can earn through achievements and quests.
 */
export { RewardCard };

/**
 * Displays experience points with optional animation.
 * Visualizes XP gains and current totals.
 */
export { XPCounter };

// Export type interfaces
export type {
  AchievementBadgeProps,
  AchievementNotificationProps,
  LeaderboardProps,
  LevelIndicatorProps,
  QuestCardProps,
  RewardCardProps,
  XPCounterProps
};

// Re-export relevant types from @austa/interfaces/gamification for convenience
export type {
  Achievement,
  AchievementCategory,
  AchievementNotificationType as AchievementNotificationData,
  LeaderboardType,
  LeaderboardEntry,
  Quest,
  QuestCategory,
  QuestStatus,
  Reward,
  RewardCategory,
  RewardStatus,
  ExperienceLevel,
  XPSource,
  XPTransaction
};