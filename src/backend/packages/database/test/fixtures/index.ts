/**
 * @file Main barrel file that exports all database test fixtures from across the testing infrastructure.
 * 
 * This file provides a centralized, organized way to import specific fixture sets for different testing scenarios,
 * while ensuring proper typing for all imported fixtures. It organizes fixtures by journey and entity type,
 * making it easy to locate and use the appropriate test data for any testing need.
 */

// Import all journey-specific fixture barrels
import * as CommonFixtures from './common';
import * as HealthFixtures from './health';
import * as CareFixtures from './care';
import * as PlanFixtures from './plan';
import * as GamificationFixtures from './gamification';

// Import scenarios
import * as GamificationScenarios from './gamification/scenarios';
import * as DatabaseScenarios from './scenarios';

/**
 * Common fixtures used across all journeys
 * 
 * Includes users, roles, and permissions fixtures that are shared across all services
 */
export const common = CommonFixtures;

/**
 * Health journey fixtures
 * 
 * Includes health metrics, health goals, device connections, and medical events fixtures
 * for testing the Health journey features
 */
export const health = HealthFixtures;

/**
 * Care journey fixtures
 * 
 * Includes appointments, providers, medications, treatments, telemedicine, and symptom checker fixtures
 * for testing the Care journey features
 */
export const care = CareFixtures;

/**
 * Plan journey fixtures
 * 
 * Includes insurance plans, benefits, coverage, claims, and documents fixtures
 * for testing the Plan journey features
 */
export const plan = PlanFixtures;

/**
 * Gamification fixtures
 * 
 * Includes achievements, rewards, events, quests, profiles, and rules fixtures
 * for testing the gamification engine
 */
export const gamification = GamificationFixtures;

/**
 * Complex end-to-end test scenarios for the gamification system
 * 
 * Includes scenarios that span multiple journeys, test achievement progression,
 * quest completion, leaderboard functionality, and journey-specific gamification flows
 */
export const gamificationScenarios = GamificationScenarios;

/**
 * Database test scenarios for transaction management, error handling, and connection pooling
 * 
 * Includes scenarios for testing transaction commits, rollbacks, nested transactions,
 * cross-journey transactions, error handling, connection pooling, and data validation
 */
export const databaseScenarios = DatabaseScenarios;

/**
 * All test scenarios grouped by category
 */
export const scenarios = {
  gamification: gamificationScenarios,
  database: databaseScenarios
};

/**
 * Namespace for all fixture types
 * 
 * Provides type definitions for all fixture collections to ensure type safety in tests
 */
export namespace FixtureTypes {
  // Common fixture types
  export type User = CommonFixtures.UserFixture;
  export type Role = CommonFixtures.RoleFixture;
  export type Permission = CommonFixtures.PermissionFixture;
  
  // Health journey fixture types
  export type HealthMetric = HealthFixtures.HealthMetricFixture;
  export type HealthGoal = HealthFixtures.HealthGoalFixture;
  export type DeviceConnection = HealthFixtures.DeviceConnectionFixture;
  export type MedicalEvent = HealthFixtures.MedicalEventFixture;
  
  // Care journey fixture types
  export type Appointment = CareFixtures.AppointmentFixture;
  export type Provider = CareFixtures.ProviderFixture;
  export type Medication = CareFixtures.MedicationFixture;
  export type Treatment = CareFixtures.TreatmentFixture;
  export type TelemedicineSession = CareFixtures.TelemedicineSessionFixture;
  export type SymptomCheckerQuery = CareFixtures.SymptomCheckerQueryFixture;
  
  // Plan journey fixture types
  export type InsurancePlan = PlanFixtures.IPlanFixture;
  export type Benefit = PlanFixtures.BenefitFixture;
  export type Coverage = PlanFixtures.CoverageFixture;
  export type Claim = PlanFixtures.ClaimFixture;
  export type Document = PlanFixtures.DocumentFixture;
  
  // Gamification fixture types
  export type Achievement = GamificationFixtures.AchievementFixture;
  export type Reward = GamificationFixtures.RewardFixture;
  export type GamificationEvent = GamificationFixtures.EventFixture;
  export type Quest = GamificationFixtures.QuestFixture;
  export type Profile = GamificationFixtures.ProfileFixture;
  export type Rule = GamificationFixtures.RuleFixture;
  
  // Gamification scenario fixture types
  export type CrossJourneyScenario = GamificationScenarios.CrossJourneyScenario;
  export type HealthJourneyScenario = GamificationScenarios.HealthJourneyScenario;
  export type CareJourneyScenario = GamificationScenarios.CareJourneyScenario;
  export type PlanJourneyScenario = GamificationScenarios.PlanJourneyScenario;
  export type AchievementProgressionScenario = GamificationScenarios.AchievementProgressionScenario;
  export type QuestCompletionScenario = GamificationScenarios.QuestCompletionScenario;
  export type LeaderboardScenario = GamificationScenarios.LeaderboardScenario;
  
  // Database scenario fixture types
  export type TransactionScenario = DatabaseScenarios.TransactionScenario;
  export type ErrorHandlingScenario = DatabaseScenarios.ErrorHandlingScenario;
  export type ConnectionPoolScenario = DatabaseScenarios.ConnectionPoolScenario;
  export type JourneyContextScenario = DatabaseScenarios.JourneyContextScenario;
  export type DataValidationScenario = DatabaseScenarios.DataValidationScenario;
}

/**
 * Convenience function to get a complete set of fixtures for cross-journey testing
 * 
 * @returns An object containing fixtures from all journeys for comprehensive testing
 */
export function getAllFixtures() {
  return {
    common,
    health,
    care,
    plan,
    gamification,
    scenarios,
  };
}

/**
 * Convenience function to get database test scenarios
 * 
 * @param category Optional category of database scenarios to retrieve
 * @returns Database scenarios, optionally filtered by category
 */
export function getDatabaseScenarios(category?: 'transactions' | 'errors' | 'connections' | 'journeys' | 'validation') {
  if (category) {
    return databaseScenarios[category];
  }
  return databaseScenarios;
}

/**
 * Convenience function to get fixtures for a specific journey
 * 
 * @param journey The journey to get fixtures for ('health', 'care', 'plan', or 'gamification')
 * @returns An object containing fixtures for the specified journey
 */
export function getJourneyFixtures(journey: 'health' | 'care' | 'plan' | 'gamification') {
  const journeyFixtures = {
    health,
    care,
    plan,
    gamification,
  };
  
  return {
    ...journeyFixtures[journey],
    common, // Always include common fixtures
  };
}

// Default export for easier importing
export default {
  common,
  health,
  care,
  plan,
  gamification,
  scenarios,
  databaseScenarios,
  getAllFixtures,
  getJourneyFixtures,
  getDatabaseScenarios,
};