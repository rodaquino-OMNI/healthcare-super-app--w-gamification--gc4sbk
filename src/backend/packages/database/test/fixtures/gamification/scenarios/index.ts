/**
 * @file index.ts
 * @description Barrel file that exports all gamification scenario fixtures for easy importing in test files.
 * Provides a single entry point for accessing all complex end-to-end test scenarios across Health, Care, 
 * and Plan journeys. This file simplifies test setup and promotes code reuse across the gamification engine test suite.
 *
 * This file implements the following requirements from the technical specification:
 * - Create clear public API for each service
 * - Develop comprehensive testing strategy with journey-specific entities
 * - Set up comprehensive test suites for all services
 * - Create proper export patterns for components and utilities
 */

// Import all scenario fixtures
import * as healthScenarios from './health-journey-scenarios';
import * as careScenarios from './care-journey-scenarios';
import * as planScenarios from './plan-journey-scenarios';
import * as crossJourneyScenarios from './cross-journey-scenarios';
import * as achievementScenarios from './achievement-progression-scenarios';
import * as questScenarios from './quest-completion-scenarios';
import * as leaderboardScenarios from './leaderboard-scenarios';

// Re-export all scenario fixtures
export { 
  healthScenarios,
  careScenarios,
  planScenarios,
  crossJourneyScenarios,
  achievementScenarios,
  questScenarios,
  leaderboardScenarios
};

/**
 * Common types for scenario fixtures to improve developer experience
 */

/**
 * Interface for a test scenario that combines multiple gamification elements
 * for comprehensive end-to-end testing.
 */
export interface TestScenario {
  /** Unique identifier for the scenario */
  id: string;
  /** Human-readable name of the scenario */
  name: string;
  /** Detailed description of what the scenario tests */
  description: string;
  /** The journey(s) this scenario is testing */
  journeys: ('health' | 'care' | 'plan' | 'cross-journey')[];
  /** Test data and fixtures used in this scenario */
  fixtures: Record<string, any>;
  /** Expected outcomes when the scenario is executed */
  expectedOutcomes: Record<string, any>;
}

/**
 * Interface for a collection of related test scenarios
 */
export interface TestScenarioCollection {
  /** Collection name */
  name: string;
  /** Collection description */
  description: string;
  /** The scenarios in this collection */
  scenarios: TestScenario[];
}

/**
 * Convenience methods for common end-to-end test scenarios
 */

/**
 * Returns all scenarios for a specific journey
 * @param journey The journey to get scenarios for
 * @returns Array of test scenarios for the specified journey
 */
export function getJourneyScenarios(journey: 'health' | 'care' | 'plan' | 'cross-journey'): TestScenario[] {
  switch (journey) {
    case 'health':
      return Object.values(healthScenarios)
        .filter(scenario => typeof scenario === 'object' && 'id' in scenario) as TestScenario[];
    case 'care':
      return Object.values(careScenarios)
        .filter(scenario => typeof scenario === 'object' && 'id' in scenario) as TestScenario[];
    case 'plan':
      return Object.values(planScenarios)
        .filter(scenario => typeof scenario === 'object' && 'id' in scenario) as TestScenario[];
    case 'cross-journey':
      return Object.values(crossJourneyScenarios)
        .filter(scenario => typeof scenario === 'object' && 'id' in scenario) as TestScenario[];
    default:
      return [];
  }
}

/**
 * Returns all achievement progression scenarios
 * @returns Array of achievement progression test scenarios
 */
export function getAchievementProgressionScenarios(): TestScenario[] {
  return Object.values(achievementScenarios)
    .filter(scenario => typeof scenario === 'object' && 'id' in scenario) as TestScenario[];
}

/**
 * Returns all quest completion scenarios
 * @returns Array of quest completion test scenarios
 */
export function getQuestCompletionScenarios(): TestScenario[] {
  return Object.values(questScenarios)
    .filter(scenario => typeof scenario === 'object' && 'id' in scenario) as TestScenario[];
}

/**
 * Returns all leaderboard scenarios
 * @returns Array of leaderboard test scenarios
 */
export function getLeaderboardScenarios(): TestScenario[] {
  return Object.values(leaderboardScenarios)
    .filter(scenario => typeof scenario === 'object' && 'id' in scenario) as TestScenario[];
}

/**
 * Returns all available test scenarios across all journeys
 * @returns Array of all test scenarios
 */
export function getAllScenarios(): TestScenario[] {
  return [
    ...getJourneyScenarios('health'),
    ...getJourneyScenarios('care'),
    ...getJourneyScenarios('plan'),
    ...getJourneyScenarios('cross-journey'),
    ...getAchievementProgressionScenarios(),
    ...getQuestCompletionScenarios(),
    ...getLeaderboardScenarios()
  ];
}

/**
 * Finds a specific scenario by ID
 * @param id The scenario ID to find
 * @returns The found scenario or undefined if not found
 */
export function findScenarioById(id: string): TestScenario | undefined {
  return getAllScenarios().find(scenario => scenario.id === id);
}

/**
 * Returns scenarios that test a specific feature or component
 * @param featureName The name of the feature to find scenarios for
 * @returns Array of scenarios that test the specified feature
 */
export function getScenariosByFeature(featureName: string): TestScenario[] {
  return getAllScenarios().filter(scenario => 
    scenario.description.toLowerCase().includes(featureName.toLowerCase()) ||
    scenario.name.toLowerCase().includes(featureName.toLowerCase())
  );
}

/**
 * Combines multiple scenarios into a single test suite
 * @param scenarios The scenarios to combine
 * @param suiteName The name for the combined test suite
 * @returns A test scenario collection containing all specified scenarios
 */
export function combineScenarios(scenarios: TestScenario[], suiteName: string): TestScenarioCollection {
  return {
    name: suiteName,
    description: `Combined test suite: ${suiteName}`,
    scenarios
  };
}

/**
 * Creates a standard end-to-end test suite with scenarios from all journeys
 * @returns A comprehensive test scenario collection for end-to-end testing
 */
export function createEndToEndTestSuite(): TestScenarioCollection {
  return {
    name: 'End-to-End Gamification Test Suite',
    description: 'Comprehensive test suite covering all journeys and gamification features',
    scenarios: [
      // Include key scenarios from each journey
      ...getJourneyScenarios('health').slice(0, 2),
      ...getJourneyScenarios('care').slice(0, 2),
      ...getJourneyScenarios('plan').slice(0, 2),
      ...getJourneyScenarios('cross-journey'),
      // Include key feature scenarios
      ...getAchievementProgressionScenarios().slice(0, 2),
      ...getQuestCompletionScenarios().slice(0, 2),
      ...getLeaderboardScenarios().slice(0, 1)
    ]
  };
}