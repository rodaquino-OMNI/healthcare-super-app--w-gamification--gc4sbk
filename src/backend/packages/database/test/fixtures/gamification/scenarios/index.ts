/**
 * @file Gamification Scenario Fixtures Barrel File
 * @description Exports all gamification scenario fixtures for easy importing in test files.
 * Provides a single entry point for accessing all complex end-to-end test scenarios across
 * Health, Care, and Plan journeys. This file simplifies test setup and promotes code reuse
 * across the gamification engine test suite.
 */

// Import all scenario modules
import healthJourneyScenarios, { 
  HealthJourneyScenario,
  healthJourneyScenarios as healthScenarios
} from './health-journey-scenarios';

import { 
  careJourneyScenarios,
  ICareJourneyScenario
} from './care-journey-scenarios';

import planJourneyScenarios from './plan-journey-scenarios';

import {
  crossJourneyScenarios,
  CrossJourneyScenario,
  getScenarioByName as getCrossJourneyScenarioByName,
  getAllCrossJourneyEvents,
  getAllCrossJourneyRules,
  getAllCrossJourneyAchievements
} from './cross-journey-scenarios';

import {
  achievementProgressionScenarios,
  healthAchievementScenarios,
  careAchievementScenarios,
  planAchievementScenarios,
  getAchievementScenarioById,
  getAchievementScenariosByJourney,
  getAchievementScenariosByUser,
  AchievementProgressionScenario,
  AchievementLevel,
  MultiLevelAchievement,
  AchievementProgressStep,
  AchievementNotification,
  AchievementReward
} from './achievement-progression-scenarios';

import {
  allQuestCompletionScenarios,
  healthQuestCompletionScenarios,
  careQuestCompletionScenarios,
  planQuestCompletionScenarios,
  crossJourneyQuestCompletionScenarios,
  getQuestCompletionScenarioById,
  getQuestCompletionScenariosByJourney,
  getQuestCompletionScenariosByTag,
  getQuestCompletionScenariosByQuestType,
  getQuestCompletionScenariosByEventType,
  createQuestScenarioEvent,
  createQuestExpectedState,
  createQuestCompletionScenarioTemplate,
  QuestCompletionScenario,
  QuestScenarioEvent,
  QuestEventType,
  QuestExpectedState
} from './quest-completion-scenarios';

import leaderboardScenarios, {
  createLeaderboardEntry,
  createLeaderboardTimePeriod,
  createLeaderboardData,
  createLeaderboardProfiles,
  profilesToLeaderboardEntries,
  createGlobalLeaderboardScenario,
  createJourneyLeaderboardScenario,
  createUserFocusedLeaderboardScenario,
  createTimePeriodLeaderboardScenario,
  createRedisLeaderboardScenario,
  createMultiJourneyLeaderboardScenario,
  createLeaderboardUpdateScenario
} from './leaderboard-scenarios';

// Export all scenario types
export {
  // Health journey types
  HealthJourneyScenario,
  
  // Care journey types
  ICareJourneyScenario,
  
  // Cross-journey types
  CrossJourneyScenario,
  
  // Achievement progression types
  AchievementProgressionScenario,
  AchievementLevel,
  MultiLevelAchievement,
  AchievementProgressStep,
  AchievementNotification,
  AchievementReward,
  
  // Quest completion types
  QuestCompletionScenario,
  QuestScenarioEvent,
  QuestEventType,
  QuestExpectedState
};

// Export all journey-specific scenarios
export {
  // Health journey scenarios
  healthJourneyScenarios,
  healthScenarios,
  
  // Care journey scenarios
  careJourneyScenarios,
  
  // Plan journey scenarios
  planJourneyScenarios,
  
  // Cross-journey scenarios
  crossJourneyScenarios,
  
  // Achievement progression scenarios
  achievementProgressionScenarios,
  healthAchievementScenarios,
  careAchievementScenarios,
  planAchievementScenarios,
  
  // Quest completion scenarios
  allQuestCompletionScenarios,
  healthQuestCompletionScenarios,
  careQuestCompletionScenarios,
  planQuestCompletionScenarios,
  crossJourneyQuestCompletionScenarios,
  
  // Leaderboard scenarios
  leaderboardScenarios
};

// Export all helper functions
export {
  // Cross-journey helpers
  getCrossJourneyScenarioByName,
  getAllCrossJourneyEvents,
  getAllCrossJourneyRules,
  getAllCrossJourneyAchievements,
  
  // Achievement progression helpers
  getAchievementScenarioById,
  getAchievementScenariosByJourney,
  getAchievementScenariosByUser,
  
  // Quest completion helpers
  getQuestCompletionScenarioById,
  getQuestCompletionScenariosByJourney,
  getQuestCompletionScenariosByTag,
  getQuestCompletionScenariosByQuestType,
  getQuestCompletionScenariosByEventType,
  createQuestScenarioEvent,
  createQuestExpectedState,
  createQuestCompletionScenarioTemplate,
  
  // Leaderboard helpers
  createLeaderboardEntry,
  createLeaderboardTimePeriod,
  createLeaderboardData,
  createLeaderboardProfiles,
  profilesToLeaderboardEntries,
  createGlobalLeaderboardScenario,
  createJourneyLeaderboardScenario,
  createUserFocusedLeaderboardScenario,
  createTimePeriodLeaderboardScenario,
  createRedisLeaderboardScenario,
  createMultiJourneyLeaderboardScenario,
  createLeaderboardUpdateScenario
};

/**
 * Convenience method to get all journey-specific scenarios
 * @returns Object containing all journey-specific scenarios
 */
export const getAllJourneyScenarios = () => ({
  health: healthJourneyScenarios,
  care: careJourneyScenarios,
  plan: planJourneyScenarios,
  cross: crossJourneyScenarios
});

/**
 * Convenience method to get all achievement progression scenarios
 * @returns Object containing all achievement progression scenarios
 */
export const getAllAchievementScenarios = () => ({
  health: healthAchievementScenarios,
  care: careAchievementScenarios,
  plan: planAchievementScenarios,
  all: achievementProgressionScenarios
});

/**
 * Convenience method to get all quest completion scenarios
 * @returns Object containing all quest completion scenarios
 */
export const getAllQuestScenarios = () => ({
  health: healthQuestCompletionScenarios,
  care: careQuestCompletionScenarios,
  plan: planQuestCompletionScenarios,
  cross: crossJourneyQuestCompletionScenarios,
  all: allQuestCompletionScenarios
});

/**
 * Convenience method to get all leaderboard scenarios
 * @returns Object containing all leaderboard scenario creation functions
 */
export const getAllLeaderboardScenarios = () => leaderboardScenarios;

/**
 * Convenience method to get a specific scenario by ID across all scenario types
 * @param scenarioId The ID of the scenario to retrieve
 * @returns The scenario with the specified ID or undefined if not found
 */
export const getScenarioById = (scenarioId: string): any => {
  // Try to find in achievement scenarios
  const achievementScenario = getAchievementScenarioById(scenarioId);
  if (achievementScenario) return achievementScenario;
  
  // Try to find in quest scenarios
  const questScenario = getQuestCompletionScenarioById(scenarioId);
  if (questScenario) return questScenario;
  
  // Try to find in cross-journey scenarios
  const crossJourneyScenario = getCrossJourneyScenarioByName(scenarioId);
  if (crossJourneyScenario) return crossJourneyScenario;
  
  // Not found
  return undefined;
};

// Default export for convenience
export default {
  health: healthJourneyScenarios,
  care: careJourneyScenarios,
  plan: planJourneyScenarios,
  cross: crossJourneyScenarios,
  achievement: achievementProgressionScenarios,
  quest: allQuestCompletionScenarios,
  leaderboard: leaderboardScenarios,
  getAllJourneyScenarios,
  getAllAchievementScenarios,
  getAllQuestScenarios,
  getAllLeaderboardScenarios,
  getScenarioById
};