/**
 * @file Barrel file that exports all gamification scenario fixtures for easy importing in test files.
 * Provides a single entry point for accessing all complex end-to-end test scenarios across
 * Health, Care, and Plan journeys. This file simplifies test setup and promotes code reuse
 * across the gamification engine test suite.
 */

// Import all scenario modules
import questCompletionScenarios from './quest-completion-scenarios';
import achievementProgressionScenarios from './achievement-progression-scenarios';
import leaderboardScenarios from './leaderboard-scenarios';
import crossJourneyScenarios from './cross-journey-scenarios';
import healthJourneyScenarios from './health-journey-scenarios';
import careJourneyScenarios from './care-journey-scenarios';
import planJourneyScenarios from './plan-journey-scenarios';

// Export all scenarios
export {
  questCompletionScenarios,
  achievementProgressionScenarios,
  leaderboardScenarios,
  crossJourneyScenarios,
  healthJourneyScenarios,
  careJourneyScenarios,
  planJourneyScenarios
};

/**
 * Combined scenarios object that includes all scenario types
 * for easy access in tests.
 */
export const allScenarios = {
  quest: questCompletionScenarios,
  achievement: achievementProgressionScenarios,
  leaderboard: leaderboardScenarios,
  crossJourney: crossJourneyScenarios,
  health: healthJourneyScenarios,
  care: careJourneyScenarios,
  plan: planJourneyScenarios
};

/**
 * Helper function to get scenarios by journey type.
 * @param journey The journey type to filter by ('health', 'care', 'plan', 'cross-journey')
 * @returns All scenarios for the specified journey
 */
export function getScenariosByJourney(journey: 'health' | 'care' | 'plan' | 'cross-journey') {
  switch (journey) {
    case 'health':
      return {
        ...healthJourneyScenarios,
        quests: questCompletionScenarios.dailyStepGoalScenario,
        questCompletionScenarios.weeklyHealthMetricsScenario,
        questCompletionScenarios.deviceConnectionScenario
      };
    case 'care':
      return {
        ...careJourneyScenarios,
        quests: questCompletionScenarios.medicationAdherenceScenario,
        questCompletionScenarios.appointmentAttendanceScenario
      };
    case 'plan':
      return {
        ...planJourneyScenarios,
        quests: questCompletionScenarios.claimSubmissionScenario,
        questCompletionScenarios.benefitsExplorationScenario
      };
    case 'cross-journey':
      return {
        ...crossJourneyScenarios,
        quests: questCompletionScenarios.crossJourneyHealthScenario
      };
    default:
      return {};
  }
}

/**
 * Helper function to get scenarios by difficulty level.
 * @param difficulty The difficulty level to filter by ('easy', 'medium', 'hard')
 * @returns All scenarios matching the specified difficulty
 */
export function getScenariosByDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
  const allScenariosArray = [
    ...Object.values(questCompletionScenarios),
    ...Object.values(achievementProgressionScenarios),
    ...Object.values(leaderboardScenarios),
    ...Object.values(crossJourneyScenarios),
    ...Object.values(healthJourneyScenarios),
    ...Object.values(careJourneyScenarios),
    ...Object.values(planJourneyScenarios)
  ];
  
  return allScenariosArray.filter(scenario => 
    scenario.metadata && scenario.metadata.difficulty === difficulty
  );
}

export default allScenarios;