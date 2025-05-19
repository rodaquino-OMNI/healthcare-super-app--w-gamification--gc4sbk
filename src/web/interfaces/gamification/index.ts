/**
 * @file Gamification Interfaces
 * @description Central export file for all gamification-related TypeScript interfaces.
 * 
 * This barrel file provides a unified import surface for all gamification types
 * including achievements, quests, rewards, profiles, events, leaderboards, XP, and rules.
 * 
 * These interfaces are used by both web and mobile applications to ensure consistent
 * implementation of gamification features across all platforms.
 * 
 * @example
 * // Import all gamification interfaces
 * import * as Gamification from '@austa/interfaces/gamification';
 * 
 * // Use namespaced interfaces
 * const achievement: Gamification.Achievement = {...};
 * 
 * @example
 * // Import specific interfaces
 * import { Achievement, Quest, Reward } from '@austa/interfaces/gamification';
 * 
 * @example
 * // Import from specific namespace
 * import { Achievements } from '@austa/interfaces/gamification';
 * const achievement: Achievements.Achievement = {...};
 */

// Re-export all interfaces from their respective files

// Achievement interfaces
export * from './achievements';

// Quest interfaces
export * from './quests';

// Reward interfaces
export * from './rewards';

// Profile interfaces
export * from './profiles';

// Event interfaces
export * from './events';

// Leaderboard interfaces
export * from './leaderboard';

// XP interfaces
export * from './xp';

// Rule interfaces
export * from './rules';

// Namespaced exports for selective importing

/**
 * Achievement-related interfaces and types
 */
import * as AchievementsImport from './achievements';
export namespace Achievements {
  export type Achievement = AchievementsImport.Achievement;
  export type AchievementCategory = AchievementsImport.AchievementCategory;
  export type AchievementProgress = AchievementsImport.AchievementProgress;
  export type AchievementNotification = AchievementsImport.AchievementNotification;
}

/**
 * Quest-related interfaces and types
 */
import * as QuestsImport from './quests';
export namespace Quests {
  export type Quest = QuestsImport.Quest;
  export type QuestCategory = QuestsImport.QuestCategory;
  export type QuestStatus = QuestsImport.QuestStatus;
  export type DailyQuest = QuestsImport.DailyQuest;
  export type WeeklyQuest = QuestsImport.WeeklyQuest;
}

/**
 * Reward-related interfaces and types
 */
import * as RewardsImport from './rewards';
export namespace Rewards {
  export type Reward = RewardsImport.Reward;
  export type RewardCategory = RewardsImport.RewardCategory;
  export type RewardStatus = RewardsImport.RewardStatus;
  export type RewardRedemption = RewardsImport.RewardRedemption;
}

/**
 * Profile-related interfaces and types
 */
import * as ProfilesImport from './profiles';
export namespace Profiles {
  export type GameProfile = ProfilesImport.GameProfile;
  export type UserBadge = ProfilesImport.UserBadge;
  export type UserStreak = ProfilesImport.UserStreak;
  export type ProfileStatistics = ProfilesImport.ProfileStatistics;
}

/**
 * Event-related interfaces and types
 */
import * as EventsImport from './events';
export namespace Events {
  export type GamificationEventType = EventsImport.GamificationEventType;
  export type BaseGamificationEvent = EventsImport.BaseGamificationEvent;
  export type AchievementEvent = EventsImport.AchievementEvent;
  export type QuestEvent = EventsImport.QuestEvent;
  export type RewardEvent = EventsImport.RewardEvent;
  export type LevelUpEvent = EventsImport.LevelUpEvent;
}

/**
 * Leaderboard-related interfaces and types
 */
import * as LeaderboardImport from './leaderboard';
export namespace Leaderboard {
  export type LeaderboardEntry = LeaderboardImport.LeaderboardEntry;
  export type Leaderboard = LeaderboardImport.Leaderboard;
  export type LeaderboardTimeFrame = LeaderboardImport.LeaderboardTimeFrame;
  export type JourneyLeaderboard = LeaderboardImport.JourneyLeaderboard;
  export type LeaderboardFilter = LeaderboardImport.LeaderboardFilter;
}

/**
 * XP-related interfaces and types
 */
import * as XPImport from './xp';
export namespace XP {
  export type ExperienceLevel = XPImport.ExperienceLevel;
  export type XPSource = XPImport.XPSource;
  export type XPTransaction = XPImport.XPTransaction;
  export type XPMultiplier = XPImport.XPMultiplier;
  export type LevelUpRequirement = XPImport.LevelUpRequirement;
}

/**
 * Rule-related interfaces and types
 */
import * as RulesImport from './rules';
export namespace Rules {
  export type Rule = RulesImport.Rule;
  export type RuleCondition = RulesImport.RuleCondition;
  export type RuleAction = RulesImport.RuleAction;
  export type RuleContext = RulesImport.RuleContext;
}

// Common types used across multiple gamification features

/**
 * Represents the different journeys in the AUSTA SuperApp
 */
export enum Journey {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Represents the common properties shared by all gamification entities
 */
export interface GamificationEntity {
  /** Unique identifier for the entity */
  id: string;
  /** Display title of the entity */
  title: string;
  /** Detailed description of the entity */
  description: string;
  /** Which journey this entity belongs to */
  journey: Journey;
  /** Icon identifier for visual representation */
  icon: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}