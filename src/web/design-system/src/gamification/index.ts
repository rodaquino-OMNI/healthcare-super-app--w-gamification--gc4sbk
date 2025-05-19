/**
 * Gamification Components Barrel File
 * 
 * This file serves as the central entry point for importing gamification UI elements
 * throughout the application. It exports all gamification-related components from
 * the design system, ensuring consistent implementation across all journeys
 * (Health, Care, Plan).
 * 
 * @packageDocumentation
 */

// Import component interfaces from @austa/interfaces/gamification package
import type {
  Achievement,
  AchievementCategory,
  AchievementProgress,
  AchievementNotification as AchievementNotificationType
} from '@austa/interfaces/gamification/achievements';

import type {
  Quest,
  QuestCategory,
  QuestStatus
} from '@austa/interfaces/gamification/quests';

import type {
  Reward,
  RewardCategory,
  RewardStatus
} from '@austa/interfaces/gamification/rewards';

import type {
  GameProfile,
  UserBadge,
  UserStreak
} from '@austa/interfaces/gamification/profiles';

import type {
  LeaderboardEntry,
  Leaderboard as LeaderboardType,
  LeaderboardTimeFrame,
  JourneyLeaderboard
} from '@austa/interfaces/gamification/leaderboard';

import type {
  ExperienceLevel,
  XPSource,
  XPTransaction
} from '@austa/interfaces/gamification/xp';

// Import components from their respective folders
import { AchievementBadge } from './AchievementBadge';
import { AchievementNotification } from './AchievementNotification';
import { Leaderboard } from './Leaderboard';
import { LevelIndicator } from './LevelIndicator';
import { QuestCard } from './QuestCard';
import { RewardCard } from './RewardCard';
import { XPCounter } from './XPCounter';

// Import component props from their respective folders
// These will be re-exported for backward compatibility
import type { AchievementBadgeProps } from './AchievementBadge';
import type { AchievementNotificationProps } from './AchievementNotification';
import type { LeaderboardProps } from './Leaderboard';
import type { LevelIndicatorProps } from './LevelIndicator';
import type { QuestCardProps } from './QuestCard';
import type { RewardCardProps } from './RewardCard';
import type { XPCounterProps } from './XPCounter';

/**
 * AchievementBadge Component
 * 
 * Displays an achievement badge with optional progress indicator.
 * Supports all journey types (Health, Care, Plan) through theming.
 * 
 * @example
 * ```tsx
 * <AchievementBadge 
 *   achievement={achievement}
 *   size="large"
 *   showProgress={true}
 *   onPress={() => console.log('Achievement pressed')}
 * />
 * ```
 */
export { AchievementBadge };
export type { AchievementBadgeProps };

/**
 * AchievementNotification Component
 * 
 * Displays a notification when a user unlocks an achievement.
 * Supports all journey types (Health, Care, Plan) through theming.
 * 
 * @example
 * ```tsx
 * <AchievementNotification
 *   achievement={achievement}
 *   onClose={() => setShowNotification(false)}
 * />
 * ```
 */
export { AchievementNotification };
export type { AchievementNotificationProps };

/**
 * Leaderboard Component
 * 
 * Displays a leaderboard of users ranked by XP or achievements.
 * Supports journey-specific filtering and theming.
 * 
 * @example
 * ```tsx
 * <Leaderboard
 *   users={leaderboardEntries}
 *   currentUserId="user-123"
 *   journey="health"
 *   title="Weekly Health Leaders"
 * />
 * ```
 */
export { Leaderboard };
export type { LeaderboardProps };

/**
 * LevelIndicator Component
 * 
 * Displays the user's current level and progress toward the next level.
 * Supports journey-specific theming and progress visualization.
 * 
 * @example
 * ```tsx
 * <LevelIndicator
 *   level={5}
 *   currentXp={350}
 *   nextLevelXp={500}
 *   journey="care"
 * />
 * ```
 */
export { LevelIndicator };
export type { LevelIndicatorProps };

/**
 * QuestCard Component
 * 
 * Displays a quest card with progress indicator and reward information.
 * Supports all journey types (Health, Care, Plan) through theming.
 * 
 * @example
 * ```tsx
 * <QuestCard
 *   quest={quest}
 *   progress={0.75}
 *   journey="plan"
 *   onPress={() => console.log('Quest pressed')}
 * />
 * ```
 */
export { QuestCard };
export type { QuestCardProps };

/**
 * RewardCard Component
 * 
 * Displays a reward card with claim button and status indicator.
 * Supports all journey types (Health, Care, Plan) through theming.
 * 
 * @example
 * ```tsx
 * <RewardCard
 *   reward={reward}
 *   isEarned={true}
 *   journey="health"
 *   onClaim={() => claimReward(reward.id)}
 * />
 * ```
 */
export { RewardCard };
export type { RewardCardProps };

/**
 * XPCounter Component
 * 
 * Displays the user's experience points with optional animation.
 * Supports journey-specific theming and size variants.
 * 
 * @example
 * ```tsx
 * <XPCounter
 *   value={1250}
 *   size="medium"
 *   journey="care"
 *   animated={true}
 * />
 * ```
 */
export { XPCounter };
export type { XPCounterProps };

// Re-export types from @austa/interfaces/gamification for convenience
export type {
  // Achievement types
  Achievement,
  AchievementCategory,
  AchievementProgress,
  AchievementNotificationType,
  
  // Quest types
  Quest,
  QuestCategory,
  QuestStatus,
  
  // Reward types
  Reward,
  RewardCategory,
  RewardStatus,
  
  // Profile types
  GameProfile,
  UserBadge,
  UserStreak,
  
  // Leaderboard types
  LeaderboardEntry,
  LeaderboardType,
  LeaderboardTimeFrame,
  JourneyLeaderboard,
  
  // XP types
  ExperienceLevel,
  XPSource,
  XPTransaction
};