/**
 * @file Health Journey Test Fixtures Index
 * @description Centralizes exports of all health-related test fixtures used for testing the Health journey features.
 * This barrel file provides organized, named exports for health metrics, health goals, device connections, and medical events fixtures,
 * ensuring consistent test data access patterns across unit, integration, and e2e tests.
 */

// Import all health-related fixtures
import healthGoalFixtures, { 
  HealthGoalFixture,
  GoalCompletionScenario,
  GoalType,
  GoalStatus,
  GoalPeriod
} from './health-goals.fixtures';

import healthMetricFixtures, { HealthMetricFixture } from './health-metrics.fixtures';
import deviceConnectionFixtures, { DeviceConnectionFixture } from './device-connections.fixtures';
import medicalEventFixtures, { MedicalEventFixture } from './medical-events.fixtures';

// Re-export all health goal fixtures
export * from './health-goals.fixtures';

// Re-export all health metric fixtures
export * from './health-metrics.fixtures';

// Re-export all device connection fixtures
export * from './device-connections.fixtures';

// Re-export all medical event fixtures
export * from './medical-events.fixtures';

// Export type definitions
export {
  HealthGoalFixture,
  GoalCompletionScenario,
  GoalType,
  GoalStatus,
  GoalPeriod,
  HealthMetricFixture,
  DeviceConnectionFixture,
  MedicalEventFixture
};

/**
 * Combined health fixtures object for easier importing
 */
export const healthFixtures = {
  goals: healthGoalFixtures,
  metrics: healthMetricFixtures,
  devices: deviceConnectionFixtures,
  medicalEvents: medicalEventFixtures
};

/**
 * Convenience function to get all health fixtures
 * @returns All health fixtures
 */
export function getAllHealthFixtures() {
  return healthFixtures;
}

/**
 * Convenience function to get fixtures for a specific health entity type
 * @param entityType The type of health entity to get fixtures for
 * @returns Fixtures for the specified entity type
 */
export function getHealthFixturesByType(entityType: 'goals' | 'metrics' | 'devices' | 'medicalEvents') {
  return healthFixtures[entityType];
}

/**
 * Default export for easier importing
 */
export default healthFixtures;