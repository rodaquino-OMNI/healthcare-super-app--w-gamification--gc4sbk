/**
 * @file Central barrel file for the gamification interfaces package
 * @description Exports all TypeScript interfaces for the cross-journey gamification engine.
 * This file provides a single entry point for importing interfaces related to achievements,
 * events, leaderboards, profiles, quests, rewards, and rules used throughout the gamification system.
 */

/**
 * Achievement interfaces for tracking user milestones and accomplishments
 * @module Achievements
 */
export * from './achievements';

/**
 * Event interfaces for processing gamification events across all journeys
 * @module Events
 */
export * from './events';

/**
 * Leaderboard interfaces for displaying user rankings and competition
 * @module Leaderboards
 */
export * from './leaderboard';

/**
 * Profile interfaces for managing user game profiles and progression
 * @module Profiles
 */
export * from './profiles';

/**
 * Quest interfaces for time-limited challenges and missions
 * @module Quests
 */
export * from './quests';

/**
 * Reward interfaces for items and benefits earned through gamification
 * @module Rewards
 */
export * from './rewards';

/**
 * Rule interfaces for defining and evaluating gamification logic
 * @module Rules
 */
export * from './rules';

/**
 * Namespaced exports for selective importing
 * 
 * These namespaces allow consumers to import only the specific categories
 * of interfaces they need, rather than importing everything.
 * 
 * Example usage:
 * ```typescript
 * import { Achievements } from '@austa/interfaces/gamification';
 * 
 * const achievement: Achievements.Achievement = { ... };
 * ```
 */

/**
 * Achievement-related interfaces namespace
 */
import * as AchievementsImport from './achievements';
export namespace Achievements {
  export type Achievement = AchievementsImport.Achievement;
  export type UserAchievement = AchievementsImport.UserAchievement;
  export type HealthAchievement = AchievementsImport.HealthAchievement;
  export type CareAchievement = AchievementsImport.CareAchievement;
  export type PlanAchievement = AchievementsImport.PlanAchievement;
  export type AchievementDisplay = AchievementsImport.AchievementDisplay;
  export type JourneyType = AchievementsImport.JourneyType;
}

/**
 * Event-related interfaces namespace
 */
import * as EventsImport from './events';
export namespace Events {
  export type EventType = EventsImport.EventType;
  export type EventJourney = EventsImport.EventJourney;
  export type GamificationEvent = EventsImport.GamificationEvent;
  export type ProcessGamificationEventDto = EventsImport.ProcessGamificationEventDto;
  export type EventProcessingResult = EventsImport.EventProcessingResult;
  export type EventPayload = EventsImport.EventPayload;
  export type BaseEventPayload = EventsImport.BaseEventPayload;
  export type EventVersion = EventsImport.EventVersion;
}

/**
 * Leaderboard-related interfaces namespace
 */
import * as LeaderboardImport from './leaderboard';
export namespace Leaderboards {
  export type LeaderboardEntry = LeaderboardImport.LeaderboardEntry;
  export type LeaderboardOptions = LeaderboardImport.LeaderboardOptions;
  export type JourneyLeaderboard = LeaderboardImport.JourneyLeaderboard;
  export type LeaderboardResponse = LeaderboardImport.LeaderboardResponse;
  export type JourneyType = LeaderboardImport.JourneyType;
}

/**
 * Profile-related interfaces namespace
 */
import * as ProfilesImport from './profiles';
export namespace Profiles {
  export type IGameProfile = ProfilesImport.IGameProfile;
  export type IPublicGameProfile = ProfilesImport.IPublicGameProfile;
  export type IProfileStreak = ProfilesImport.IProfileStreak;
  export type IProfileBadge = ProfilesImport.IProfileBadge;
  export type IProfileSettings = ProfilesImport.IProfileSettings;
  export type IUserMetrics = ProfilesImport.IUserMetrics;
  export type IUpdateXpRequest = ProfilesImport.IUpdateXpRequest;
  export type IUpdateXpResponse = ProfilesImport.IUpdateXpResponse;
}

/**
 * Quest-related interfaces namespace
 */
import * as QuestsImport from './quests';
export namespace Quests {
  export type Quest = QuestsImport.Quest;
  export type UserQuest = QuestsImport.UserQuest;
  export type HealthQuest = QuestsImport.HealthQuest;
  export type CareQuest = QuestsImport.CareQuest;
  export type PlanQuest = QuestsImport.PlanQuest;
  export type CreateQuestDto = QuestsImport.CreateQuestDto;
  export type UpdateQuestDto = QuestsImport.UpdateQuestDto;
  export type UpdateQuestProgressDto = QuestsImport.UpdateQuestProgressDto;
  export type QuestFilterOptions = QuestsImport.QuestFilterOptions;
  export type JourneyType = QuestsImport.JourneyType;
}

/**
 * Reward-related interfaces namespace
 */
import * as RewardsImport from './rewards';
export namespace Rewards {
  export type Reward = RewardsImport.Reward;
  export type UserReward = RewardsImport.UserReward;
  export type HealthReward = RewardsImport.HealthReward;
  export type CareReward = RewardsImport.CareReward;
  export type PlanReward = RewardsImport.PlanReward;
  export type UserRewardWithDetails = RewardsImport.UserRewardWithDetails;
  export type CreateRewardRequest = RewardsImport.CreateRewardRequest;
  export type UpdateRewardRequest = RewardsImport.UpdateRewardRequest;
  export type AssignRewardRequest = RewardsImport.AssignRewardRequest;
  export type JourneyType = RewardsImport.JourneyType;
}

/**
 * Rule-related interfaces namespace
 */
import * as RulesImport from './rules';
export namespace Rules {
  export type Rule = RulesImport.Rule;
  export type RuleCondition = RulesImport.RuleCondition;
  export type RuleAction = RulesImport.RuleAction;
  export type RuleContext = RulesImport.RuleContext;
  export type HealthRule = RulesImport.HealthRule;
  export type CareRule = RulesImport.CareRule;
  export type PlanRule = RulesImport.PlanRule;
  export type RuleActionType = RulesImport.RuleActionType;
  
  // Export type guards as well
  export const isHealthRule = RulesImport.isHealthRule;
  export const isCareRule = RulesImport.isCareRule;
  export const isPlanRule = RulesImport.isPlanRule;
}