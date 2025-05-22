/**
 * @file Gamification Test Fixtures Barrel File
 * 
 * This barrel file exports all gamification test fixtures for easy importing in test files.
 * It provides centralized access to achievement, reward, event, quest, profile, and rule fixtures,
 * simplifying test setup and promoting code reuse across the gamification engine test suite.
 */

// Import all fixture modules
import * as achievementFixtures from './achievements.fixtures';
import * as eventFixtures from './events.fixtures';
import * as profileFixtures from './profiles.fixtures';
import * as questFixtures from './quests.fixtures';
import * as rewardFixtures from './rewards.fixtures';
import * as ruleFixtures from './rules.fixtures';

// Re-export all fixture modules
export { achievementFixtures, eventFixtures, profileFixtures, questFixtures, rewardFixtures, ruleFixtures };

// Import types from interfaces package for type safety
import { Journey } from '@austa/interfaces/common';
import { Achievement, UserAchievement } from '@austa/interfaces/gamification/achievements';
import { GamificationEvent } from '@austa/interfaces/gamification/events';
import { GameProfile } from '@austa/interfaces/gamification/profiles';
import { Quest, UserQuest } from '@austa/interfaces/gamification/quests';
import { Reward, UserReward } from '@austa/interfaces/gamification/rewards';
import { Rule } from '@austa/interfaces/gamification/rules';

/**
 * Complete test fixture set containing all gamification entities for comprehensive testing
 */
export interface GamificationTestFixtures {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  events: GamificationEvent[];
  profiles: GameProfile[];
  quests: Quest[];
  userQuests: UserQuest[];
  rewards: Reward[];
  userRewards: UserReward[];
  rules: Rule[];
}

/**
 * Creates a complete set of test fixtures for gamification testing
 * 
 * @returns A complete set of gamification test fixtures
 */
export function createTestFixtures(): GamificationTestFixtures {
  return {
    achievements: achievementFixtures.getAllAchievements(),
    userAchievements: achievementFixtures.getAllUserAchievements(),
    events: eventFixtures.getAllEvents(),
    profiles: profileFixtures.getAllProfiles(),
    quests: questFixtures.getAllQuests(),
    userQuests: questFixtures.getAllUserQuests(),
    rewards: rewardFixtures.getAllRewards(),
    userRewards: rewardFixtures.getAllUserRewards(),
    rules: ruleFixtures.getAllRules()
  };
}

/**
 * Creates a set of test fixtures filtered by journey
 * 
 * @param journey - The journey to filter fixtures by (health, care, plan)
 * @returns A set of gamification test fixtures for the specified journey
 */
export function createJourneyFixtures(journey: Journey): GamificationTestFixtures {
  return {
    achievements: achievementFixtures.getAchievementsByJourney(journey),
    userAchievements: achievementFixtures.getUserAchievementsByJourney(journey),
    events: eventFixtures.getEventsByJourney(journey),
    profiles: profileFixtures.getProfilesByJourney(journey),
    quests: questFixtures.getQuestsByJourney(journey),
    userQuests: questFixtures.getUserQuestsByJourney(journey),
    rewards: rewardFixtures.getRewardsByJourney(journey),
    userRewards: rewardFixtures.getUserRewardsByJourney(journey),
    rules: ruleFixtures.getRulesByJourney(journey)
  };
}

/**
 * Creates a minimal set of test fixtures for basic testing scenarios
 * 
 * @returns A minimal set of gamification test fixtures
 */
export function createMinimalFixtures(): Partial<GamificationTestFixtures> {
  return {
    achievements: achievementFixtures.getBasicAchievements(),
    events: eventFixtures.getBasicEvents(),
    profiles: [profileFixtures.getBasicProfile()],
    rules: ruleFixtures.getBasicRules()
  };
}

/**
 * Creates a set of test fixtures for achievement unlocking scenarios
 * 
 * @returns Test fixtures focused on achievement unlocking
 */
export function createAchievementUnlockFixtures(): Partial<GamificationTestFixtures> {
  return {
    achievements: achievementFixtures.getAllAchievements(),
    events: eventFixtures.getAchievementTriggeringEvents(),
    profiles: profileFixtures.getProfilesWithoutAchievements(),
    rules: ruleFixtures.getAchievementRules()
  };
}

/**
 * Creates a set of test fixtures for quest progression scenarios
 * 
 * @returns Test fixtures focused on quest progression
 */
export function createQuestProgressionFixtures(): Partial<GamificationTestFixtures> {
  return {
    quests: questFixtures.getAllQuests(),
    userQuests: questFixtures.getInProgressUserQuests(),
    events: eventFixtures.getQuestProgressionEvents(),
    profiles: profileFixtures.getBasicProfiles()
  };
}

/**
 * Creates a set of test fixtures for reward redemption scenarios
 * 
 * @returns Test fixtures focused on reward redemption
 */
export function createRewardRedemptionFixtures(): Partial<GamificationTestFixtures> {
  return {
    rewards: rewardFixtures.getRedeemableRewards(),
    userRewards: rewardFixtures.getUnredeemedUserRewards(),
    profiles: profileFixtures.getProfilesWithPoints(),
    events: eventFixtures.getRewardRedemptionEvents()
  };
}

/**
 * Creates a set of test fixtures for leaderboard testing
 * 
 * @param count - Number of profiles to include in the leaderboard
 * @returns Test fixtures focused on leaderboard functionality
 */
export function createLeaderboardFixtures(count: number = 10): Partial<GamificationTestFixtures> {
  return {
    profiles: profileFixtures.getLeaderboardProfiles(count),
    achievements: achievementFixtures.getBasicAchievements()
  };
}

/**
 * Creates a set of test fixtures for rule evaluation testing
 * 
 * @returns Test fixtures focused on rule evaluation
 */
export function createRuleEvaluationFixtures(): Partial<GamificationTestFixtures> {
  return {
    rules: ruleFixtures.getAllRules(),
    events: eventFixtures.getRuleEvaluationEvents(),
    profiles: [profileFixtures.getBasicProfile()]
  };
}

/**
 * Creates a set of test fixtures for cross-journey achievement testing
 * 
 * @returns Test fixtures focused on cross-journey achievements
 */
export function createCrossJourneyFixtures(): Partial<GamificationTestFixtures> {
  return {
    achievements: achievementFixtures.getCrossJourneyAchievements(),
    events: eventFixtures.getCrossJourneyEvents(),
    profiles: profileFixtures.getProfilesWithMultipleJourneys(),
    rules: ruleFixtures.getCrossJourneyRules()
  };
}

// Direct exports of commonly used individual fixtures for convenience
export const basicProfile = profileFixtures.getBasicProfile;
export const basicAchievement = achievementFixtures.getBasicAchievement;
export const basicEvent = eventFixtures.getBasicEvent;
export const basicQuest = questFixtures.getBasicQuest;
export const basicReward = rewardFixtures.getBasicReward;
export const basicRule = ruleFixtures.getBasicRule;

// Export default object for easier importing
export default {
  achievements: achievementFixtures,
  events: eventFixtures,
  profiles: profileFixtures,
  quests: questFixtures,
  rewards: rewardFixtures,
  rules: ruleFixtures,
  createTestFixtures,
  createJourneyFixtures,
  createMinimalFixtures,
  createAchievementUnlockFixtures,
  createQuestProgressionFixtures,
  createRewardRedemptionFixtures,
  createLeaderboardFixtures,
  createRuleEvaluationFixtures,
  createCrossJourneyFixtures,
  basicProfile,
  basicAchievement,
  basicEvent,
  basicQuest,
  basicReward,
  basicRule
};