/**
 * @file gamification.types.ts
 * @description TypeScript interfaces for gamification-related UI components in the AUSTA SuperApp.
 * These interfaces provide strongly-typed props for gamification elements while ensuring
 * tight integration with the gamification domain models.
 *
 * Part of the @austa/interfaces package that houses all shared TypeScript definitions
 * and type contracts used across the design system and applications.
 */

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

// Import domain models from the shared types
import type { Achievement, Quest, Reward, GameProfile } from '@austa/interfaces/gamification';

/**
 * Common props shared across all gamification components
 */
export interface GamificationComponentBaseProps {
  /** Optional style overrides for the component container */
  style?: StyleProp<ViewStyle>;
  /** Optional test ID for component testing */
  testID?: string;
  /** Journey context for theming (health, care, plan) */
  journey?: 'health' | 'care' | 'plan';
}

/**
 * Props for the AchievementBadge component that displays user achievements
 * with lock/unlock states and progress indicators.
 */
export interface AchievementBadgeProps extends GamificationComponentBaseProps {
  /** The achievement to display */
  achievement: Achievement;
  /** Size variant for the badge */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the progress indicator */
  showProgress?: boolean;
  /** Whether to show the achievement description */
  showDescription?: boolean;
  /** Animation state for newly unlocked achievements */
  animationState?: 'none' | 'unlocking' | 'celebrating';
  /** Callback when the badge is pressed */
  onPress?: (achievement: Achievement) => void;
  /** Optional style for the badge icon */
  iconStyle?: StyleProp<ViewStyle>;
  /** Optional style for the badge title */
  titleStyle?: StyleProp<TextStyle>;
  /** Optional style for the badge description */
  descriptionStyle?: StyleProp<TextStyle>;
}

/**
 * Props for the Leaderboard component that shows user rankings
 * with achievement indicators and points.
 */
export interface LeaderboardProps extends GamificationComponentBaseProps {
  /** List of user profiles to display in the leaderboard */
  profiles: LeaderboardEntry[];
  /** The current user's profile ID for highlighting */
  currentUserId: string;
  /** Number of top users to display */
  topCount?: number;
  /** Whether to show the user's position if not in top */
  showUserPosition?: boolean;
  /** Time period for the leaderboard data */
  timePeriod?: 'daily' | 'weekly' | 'monthly' | 'allTime';
  /** Callback when a user entry is pressed */
  onUserPress?: (userId: string) => void;
  /** Whether the leaderboard is loading */
  isLoading?: boolean;
  /** Error message if leaderboard failed to load */
  error?: string;
  /** Optional header component */
  header?: ReactNode;
  /** Optional footer component */
  footer?: ReactNode;
}

/**
 * Entry in the leaderboard representing a user's ranking
 */
export interface LeaderboardEntry {
  /** User ID */
  userId: string;
  /** Display name */
  displayName: string;
  /** User's avatar URL */
  avatarUrl?: string;
  /** User's current rank */
  rank: number;
  /** User's score/points */
  score: number;
  /** User's level */
  level: number;
  /** Recent achievements (optional) */
  recentAchievements?: Achievement[];
}

/**
 * Props for the LevelIndicator component that visualizes
 * user level and progress to the next level.
 */
export interface LevelIndicatorProps extends GamificationComponentBaseProps {
  /** Current user level */
  level: number;
  /** Current XP */
  currentXP: number;
  /** XP required for the next level */
  nextLevelXP: number;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the level number */
  showLevel?: boolean;
  /** Whether to show the XP progress text */
  showXPProgress?: boolean;
  /** Whether to animate level changes */
  animateChanges?: boolean;
  /** Optional style for the level text */
  levelTextStyle?: StyleProp<TextStyle>;
  /** Optional style for the progress indicator */
  progressStyle?: StyleProp<ViewStyle>;
  /** Optional custom label for the level */
  levelLabel?: string;
}

/**
 * Props for the QuestCard component that presents quests/challenges
 * with progress tracking and rewards.
 */
export interface QuestCardProps extends GamificationComponentBaseProps {
  /** The quest to display */
  quest: Quest;
  /** Whether the card is expanded to show details */
  expanded?: boolean;
  /** Whether to show the quest reward */
  showReward?: boolean;
  /** Whether to show the progress bar */
  showProgress?: boolean;
  /** Callback when the card is pressed */
  onPress?: (quest: Quest) => void;
  /** Callback when the quest is accepted */
  onAccept?: (quest: Quest) => void;
  /** Callback when the quest is abandoned */
  onAbandon?: (quest: Quest) => void;
  /** Whether the quest is currently active */
  isActive?: boolean;
  /** Time remaining for the quest (in seconds) */
  timeRemaining?: number;
  /** Optional style for the card container */
  cardStyle?: StyleProp<ViewStyle>;
  /** Optional style for the title text */
  titleStyle?: StyleProp<TextStyle>;
  /** Optional style for the description text */
  descriptionStyle?: StyleProp<TextStyle>;
}

/**
 * Props for the RewardCard component that displays available
 * rewards and XP values.
 */
export interface RewardCardProps extends GamificationComponentBaseProps {
  /** The reward to display */
  reward: Reward;
  /** Whether the reward is available to the user */
  isAvailable?: boolean;
  /** Whether the reward has been claimed */
  isClaimed?: boolean;
  /** Callback when the card is pressed */
  onPress?: (reward: Reward) => void;
  /** Callback when the reward is claimed */
  onClaim?: (reward: Reward) => void;
  /** Size variant for the card */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the XP value */
  showXP?: boolean;
  /** Whether to show the journey icon */
  showJourneyIcon?: boolean;
  /** Optional style for the card container */
  cardStyle?: StyleProp<ViewStyle>;
  /** Optional style for the title text */
  titleStyle?: StyleProp<TextStyle>;
  /** Optional style for the description text */
  descriptionStyle?: StyleProp<TextStyle>;
}

/**
 * Props for the XPCounter component that shows current XP
 * and remaining points to level up.
 */
export interface XPCounterProps extends GamificationComponentBaseProps {
  /** Current XP value */
  currentXP: number;
  /** XP required for the next level */
  nextLevelXP: number;
  /** Current user level */
  level: number;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the level indicator */
  showLevel?: boolean;
  /** Whether to show the progress bar */
  showProgress?: boolean;
  /** Whether to animate XP changes */
  animateChanges?: boolean;
  /** Optional style for the XP text */
  xpTextStyle?: StyleProp<TextStyle>;
  /** Optional style for the level text */
  levelTextStyle?: StyleProp<TextStyle>;
  /** Optional style for the progress bar */
  progressStyle?: StyleProp<ViewStyle>;
}

/**
 * Props for the AchievementNotification component that displays
 * a popup when a user unlocks a new achievement.
 */
export interface AchievementNotificationProps extends GamificationComponentBaseProps {
  /** The achievement that was unlocked */
  achievement: Achievement;
  /** Whether the notification is visible */
  visible: boolean;
  /** Callback when the notification is dismissed */
  onDismiss: () => void;
  /** Duration to show the notification (in ms) */
  duration?: number;
  /** Animation type for the notification */
  animationType?: 'fade' | 'slide' | 'bounce';
  /** Whether to play a sound when showing the notification */
  playSound?: boolean;
  /** Optional style for the notification container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional style for the title text */
  titleStyle?: StyleProp<TextStyle>;
  /** Optional style for the description text */
  descriptionStyle?: StyleProp<TextStyle>;
}