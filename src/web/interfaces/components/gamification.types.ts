/**
 * Gamification Component Interfaces
 * 
 * This file defines TypeScript interfaces for gamification-related UI components
 * in the AUSTA SuperApp. These interfaces provide strongly-typed props for
 * gamification elements while ensuring tight integration with the gamification
 * domain models.
 */

import { Achievement, GameProfile, Quest, Reward } from '../gamification';

/**
 * Animation state for gamification components
 */
export type GamificationAnimationState = 'idle' | 'active' | 'completed';

/**
 * Size variants for gamification components
 */
export type GamificationComponentSize = 'sm' | 'md' | 'lg';

/**
 * Base props shared by all gamification components
 */
export interface GamificationComponentBaseProps {
  /** Optional custom class name */
  className?: string;
  /** Optional custom test ID for testing */
  testID?: string;
  /** Optional journey context to apply journey-specific styling */
  journey?: 'health' | 'care' | 'plan' | 'global';
  /** Optional animation state */
  animationState?: GamificationAnimationState;
  /** Optional size variant */
  size?: GamificationComponentSize;
}

/**
 * Props for the AchievementBadge component
 * 
 * AchievementBadge displays a visual representation of an achievement with
 * appropriate styling based on its locked/unlocked state.
 */
export interface AchievementBadgeProps extends GamificationComponentBaseProps {
  /** The achievement to display */
  achievement: Achievement;
  /** Whether to show the achievement description */
  showDescription?: boolean;
  /** Whether to show the achievement progress */
  showProgress?: boolean;
  /** Callback when the badge is pressed/clicked */
  onPress?: () => void;
  /** Whether the badge should pulse to draw attention */
  pulse?: boolean;
  /** Whether to show a notification indicator */
  showNotification?: boolean;
  /** Whether the badge should be interactive */
  interactive?: boolean;
}

/**
 * Props for the Leaderboard component
 * 
 * Leaderboard displays a ranking of users based on their gamification progress.
 */
export interface LeaderboardProps extends GamificationComponentBaseProps {
  /** Array of game profiles to display in the leaderboard */
  profiles: GameProfile[];
  /** The current user's profile ID to highlight in the leaderboard */
  currentUserId: string;
  /** Maximum number of profiles to display */
  limit?: number;
  /** Whether to show detailed user information */
  showDetails?: boolean;
  /** Callback when a user profile is selected */
  onSelectUser?: (userId: string) => void;
  /** The time period for the leaderboard data */
  timePeriod?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  /** Whether to show achievement badges with profiles */
  showAchievements?: boolean;
  /** Whether the leaderboard is loading data */
  isLoading?: boolean;
  /** Error message to display if loading failed */
  error?: string;
}

/**
 * Props for the LevelIndicator component
 * 
 * LevelIndicator visualizes a user's current level and progress toward the next level.
 */
export interface LevelIndicatorProps extends GamificationComponentBaseProps {
  /** Current user level */
  level: number;
  /** Current XP points */
  currentXP: number;
  /** XP required for the next level */
  nextLevelXP: number;
  /** Whether to show the XP values */
  showXPValues?: boolean;
  /** Whether to animate progress changes */
  animate?: boolean;
  /** Callback when the level indicator is pressed/clicked */
  onPress?: () => void;
  /** Whether to show a level up animation */
  showLevelUpAnimation?: boolean;
  /** Custom label for the level */
  levelLabel?: string;
}

/**
 * Props for the QuestCard component
 * 
 * QuestCard displays information about a quest/challenge with progress tracking.
 */
export interface QuestCardProps extends GamificationComponentBaseProps {
  /** The quest to display */
  quest: Quest;
  /** Whether to show detailed information */
  expanded?: boolean;
  /** Callback when the card is pressed/clicked */
  onPress?: () => void;
  /** Callback when the quest is accepted */
  onAccept?: (questId: string) => void;
  /** Callback when the quest is abandoned */
  onAbandon?: (questId: string) => void;
  /** Whether the quest card is disabled */
  disabled?: boolean;
  /** Whether to show the quest expiration time */
  showExpiration?: boolean;
  /** Whether to show the quest rewards */
  showRewards?: boolean;
  /** Whether the quest is newly available */
  isNew?: boolean;
}

/**
 * Props for the RewardCard component
 * 
 * RewardCard displays information about a reward that can be earned or redeemed.
 */
export interface RewardCardProps extends GamificationComponentBaseProps {
  /** The reward to display */
  reward: Reward;
  /** Whether the reward is available to be claimed */
  available?: boolean;
  /** Whether the reward has been claimed */
  claimed?: boolean;
  /** Callback when the card is pressed/clicked */
  onPress?: () => void;
  /** Callback when the reward is claimed */
  onClaim?: (rewardId: string) => void;
  /** Whether the reward card is disabled */
  disabled?: boolean;
  /** Whether to show a claim animation */
  showClaimAnimation?: boolean;
  /** Whether to show the reward details */
  showDetails?: boolean;
  /** Whether the reward is featured/highlighted */
  featured?: boolean;
}

/**
 * Props for the XPCounter component
 * 
 * XPCounter displays the current XP and visualizes progress toward the next level.
 */
export interface XPCounterProps extends GamificationComponentBaseProps {
  /** Current XP points */
  currentXP: number;
  /** XP required for the next level */
  nextLevelXP: number;
  /** Whether to show the progress bar */
  showProgressBar?: boolean;
  /** Whether to animate XP changes */
  animate?: boolean;
  /** Callback when the counter is pressed/clicked */
  onPress?: () => void;
  /** Recent XP gain to highlight */
  recentXPGain?: number;
  /** Whether to show the recent XP gain animation */
  showRecentGainAnimation?: boolean;
  /** Custom label for the XP counter */
  label?: string;
}