/**
 * @file Common Interfaces Index
 * @description Barrel file that exports all common interfaces from the interfaces folder,
 * providing a single entry point for importing interfaces throughout the gamification engine.
 * This file also re-exports relevant interfaces from the @austa/interfaces package.
 */

// Re-export interfaces from @austa/interfaces package
import * as AustaInterfaces from '@austa/interfaces';
import * as GamificationInterfaces from '@austa/interfaces/gamification';
import * as CommonInterfaces from '@austa/interfaces/common';

// Export local interfaces
export * from './base-event.interface';
export * from './error.interface';
export * from './event-metadata.interface';
export * from './filterable.interface';
export * from './journey.interface';
export * from './leaderboard-data.interface';
export * from './pagination.interface';
export * from './retry-policy.interface';
export * from './service.interface';
export * from './user-profile.interface';
export * from './versioning.interface';

// Re-export specific interfaces from @austa/interfaces
export {
  // Common interfaces
  CommonInterfaces.IPaginationRequest,
  CommonInterfaces.IPaginationResponse,
  CommonInterfaces.IErrorResponse,
  
  // Gamification interfaces
  GamificationInterfaces.Achievement,
  GamificationInterfaces.UserAchievement,
  GamificationInterfaces.AchievementCategory,
  GamificationInterfaces.AchievementProgress,
  
  GamificationInterfaces.Quest,
  GamificationInterfaces.UserQuest,
  GamificationInterfaces.QuestCategory,
  GamificationInterfaces.QuestStatus,
  
  GamificationInterfaces.Reward,
  GamificationInterfaces.UserReward,
  GamificationInterfaces.RewardCategory,
  GamificationInterfaces.RewardStatus,
  
  GamificationInterfaces.GameProfile,
  GamificationInterfaces.UserBadge,
  GamificationInterfaces.UserStreak,
  GamificationInterfaces.ProfileStatistics,
  
  GamificationInterfaces.GamificationEvent,
  GamificationInterfaces.EventType,
  
  GamificationInterfaces.LeaderboardEntry,
  GamificationInterfaces.Leaderboard,
  GamificationInterfaces.LeaderboardTimeFrame,
  GamificationInterfaces.JourneyLeaderboard,
  
  GamificationInterfaces.Rule,
  GamificationInterfaces.RuleCondition,
  GamificationInterfaces.RuleAction,
  
  GamificationInterfaces.ExperienceLevel,
  GamificationInterfaces.XPSource,
  GamificationInterfaces.XPTransaction,
};

// Export namespaces for grouped imports
export namespace Gamification {
  export import Achievements = GamificationInterfaces.Achievements;
  export import Quests = GamificationInterfaces.Quests;
  export import Rewards = GamificationInterfaces.Rewards;
  export import Profiles = GamificationInterfaces.Profiles;
  export import Events = GamificationInterfaces.Events;
  export import Leaderboards = GamificationInterfaces.Leaderboards;
  export import Rules = GamificationInterfaces.Rules;
  export import XP = GamificationInterfaces.XP;
}

/**
 * Type utilities for working with interfaces
 */

/**
 * Makes specified properties of an interface required
 * @example
 * type UserWithRequiredEmail = WithRequired<User, 'email'>;
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Makes specified properties of an interface optional
 * @example
 * type UserWithOptionalPassword = WithOptional<User, 'password'>;
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] };

/**
 * Picks properties from an interface and makes them all required
 * @example
 * type UserCredentials = RequiredPick<User, 'email' | 'password'>;
 */
export type RequiredPick<T, K extends keyof T> = { [P in K]-?: T[P] };

/**
 * Creates a type with all properties of T except those in K, which are made optional
 * @example
 * type UpdateUserDto = OptionalExcept<User, 'id'>;
 */
export type OptionalExcept<T, K extends keyof T> = { [P in K]-?: T[P] } & { [P in Exclude<keyof T, K>]?: T[P] };

/**
 * Usage examples:
 * 
 * Import all interfaces:
 * ```typescript
 * import * as Interfaces from '../common/interfaces';
 * ```
 * 
 * Import specific interfaces:
 * ```typescript
 * import { IRetryPolicy, IEventMetadata, GameProfile } from '../common/interfaces';
 * ```
 * 
 * Import namespaced interfaces:
 * ```typescript
 * import { Gamification } from '../common/interfaces';
 * // Use as Gamification.Achievements.Achievement
 * ```
 * 
 * Use type utilities:
 * ```typescript
 * import { WithRequired, GameProfile } from '../common/interfaces';
 * type GameProfileWithRequiredLevel = WithRequired<GameProfile, 'level'>;
 * ```
 */