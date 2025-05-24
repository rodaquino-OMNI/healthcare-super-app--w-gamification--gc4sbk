/**
 * @file Gamification Interfaces Barrel File
 * 
 * This file serves as the central export point for all gamification-related TypeScript interfaces
 * used throughout the AUSTA SuperApp. It provides a unified import surface for gamification types
 * including achievements, quests, rewards, profiles, events, leaderboards, XP, and rules.
 * 
 * These interfaces ensure type safety and consistency across both web and mobile applications
 * that interact with the gamification system.
 * 
 * @example Import all gamification interfaces
 * ```typescript
 * import * as Gamification from '@austa/interfaces/gamification';
 * ```
 * 
 * @example Import specific namespaced interfaces
 * ```typescript
 * import { Achievements } from '@austa/interfaces/gamification';
 * ```
 * 
 * @example Import specific interfaces directly
 * ```typescript
 * import { Achievement, Quest, Reward } from '@austa/interfaces/gamification';
 * ```
 */

// Direct exports of all interfaces for convenient importing
export * from './achievements';
export * from './events';
export * from './leaderboard';
export * from './profiles';
export * from './quests';
export * from './rewards';
export * from './rules';
export * from './xp';

// Namespaced exports for selective importing
import * as Achievements from './achievements';
import * as Events from './events';
import * as Leaderboard from './leaderboard';
import * as Profiles from './profiles';
import * as Quests from './quests';
import * as Rewards from './rewards';
import * as Rules from './rules';
import * as XP from './xp';

/**
 * Namespaced exports for selective importing of related interfaces
 * This allows consumers to import only the interfaces they need
 * 
 * @example
 * ```typescript
 * import { Achievements } from '@austa/interfaces/gamification';
 * const achievement: Achievements.Achievement = { ... };
 * ```
 */
export {
  Achievements,
  Events,
  Leaderboard,
  Profiles,
  Quests,
  Rewards,
  Rules,
  XP
};

/**
 * Journey-specific gamification interfaces
 * These namespaces group interfaces by journey for more organized imports
 */
export namespace Health {
  export type { 
    Achievements.HealthAchievement,
    Events.HealthGamificationEvent,
    Quests.HealthQuest,
    Rewards.HealthReward
  };
}

export namespace Care {
  export type { 
    Achievements.CareAchievement,
    Events.CareGamificationEvent,
    Quests.CareQuest,
    Rewards.CareReward
  };
}

export namespace Plan {
  export type { 
    Achievements.PlanAchievement,
    Events.PlanGamificationEvent,
    Quests.PlanQuest,
    Rewards.PlanReward
  };
}

/**
 * Cross-journey gamification interfaces
 * These interfaces are used across multiple journeys
 */
export namespace CrossJourney {
  export type { 
    Achievements.CrossJourneyAchievement,
    Events.CrossJourneyGamificationEvent,
    Quests.CrossJourneyQuest,
    Rewards.CrossJourneyReward,
    Rules.CrossJourneyRule
  };
}