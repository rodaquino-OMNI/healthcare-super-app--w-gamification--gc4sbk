/**
 * @file Centralized exports for all health-related test fixtures
 * 
 * This barrel file provides organized, named exports for health metrics, health goals,
 * device connections, and medical events fixtures, ensuring consistent test data access
 * patterns across unit, integration, and e2e tests.
 * 
 * @example
 * // Import specific fixtures
 * import { activeStepGoal, createHeartRateMetric } from '@austa/database/test/fixtures/health';
 * 
 * // Import all fixtures of a specific type
 * import { healthMetrics } from '@austa/database/test/fixtures/health';
 * 
 * // Import everything
 * import healthFixtures from '@austa/database/test/fixtures/health';
 * 
 * // Use in tests
 * describe('Health Metrics Service', () => {
 *   it('should process heart rate data correctly', () => {
 *     const heartRateData = createHeartRateMetric({ value: 75 });
 *     const result = healthMetricsService.processMetric(heartRateData);
 *     expect(result.isAbnormal).toBe(false);
 *   });
 * 
 *   it('should track goal progress', () => {
 *     const goal = activeStepGoal;
 *     const result = healthGoalsService.updateProgress(goal.id, 5000);
 *     expect(result.currentValue).toBe(5000);
 *     expect(result.status).toBe('active');
 *   });
 * });
 */

// Import all health-related fixture modules
import * as HealthMetricsFixtures from './health-metrics.fixtures';
import * as HealthGoalsFixtures from './health-goals.fixtures';
import * as DeviceConnectionsFixtures from './device-connections.fixtures';
import * as MedicalEventsFixtures from './medical-events.fixtures';

// Re-export all types, interfaces, enums, and functions from health metrics fixtures
export {
  MetricType,
  MetricSource,
  NORMAL_RANGES,
  createHealthMetricFixture,
  createHeartRateMetric,
  createBloodPressureMetric,
  createBloodGlucoseMetric,
  createStepsMetric,
  createWeightMetric,
  createSleepMetric,
  createMetricTrendSeries,
  createBloodPressureTrendSeries,
  healthMetricScenarios,
} from './health-metrics.fixtures';

// Re-export all types, interfaces, enums, and functions from health goals fixtures
export {
  GoalType,
  GoalStatus,
  GoalPeriod,
  createHealthGoalFixture,
  createGoalCompletionScenario,
  createDate,
  activeStepGoal,
  partialStepGoal,
  completedStepGoal,
  abandonedStepGoal,
  weeklyStepGoal,
  activeSleepGoal,
  completedSleepGoal,
  weeklySleepGoal,
  activeWeightLossGoal,
  completedWeightGoal,
  activeWaterGoal,
  completedWaterGoal,
  activeExerciseGoal,
  completedExerciseGoal,
  activeHeartRateGoal,
  activeBloodPressureGoal,
  activeBloodGlucoseGoal,
  customMeditationGoal,
  customNutritionGoal,
  activeGoals,
  completedGoals,
  goalsByPeriod,
  goalsByType,
  goalCompletionScenarios,
  healthGoalFixtures,
} from './health-goals.fixtures';

// Re-export all types, interfaces, enums, and functions from device connections fixtures
export {
  DeviceConnectionStatus,
  DeviceType,
  createDeviceConnection,
  createConnectedDevice,
  createDisconnectedDevice,
  createPairingDevice,
  createPairingFailedDevice,
  createSyncingDevice,
  createSyncFailedDevice,
  createUnauthorizedDevice,
  createMultiDeviceScenario,
  createTroubleshootingScenario,
  createSyncTestScenario,
} from './device-connections.fixtures';

// Re-export all types, interfaces, enums, and functions from medical events fixtures
export {
  MedicalEventType,
  MedicalEventSource,
  createMedicalEventFixture,
  createMedicalEventBatch,
  createDiagnosisFixture,
  createProcedureFixture,
  createMedicationFixture,
  createAllergyFixture,
  createVisitFixture,
  createImmunizationFixture,
  createLabResultFixture,
  generateCompleteMedicalHistory,
  diagnosisFixtures,
  procedureFixtures,
  medicationFixtures,
  allergyFixtures,
  visitFixtures,
  immunizationFixtures,
  labResultFixtures,
  chronicConditionsHistory,
  respiratoryConditionsHistory,
  acuteConditionsHistory,
  allMedicalEventFixtures,
  medicalHistoryScenarios,
} from './medical-events.fixtures';

/**
 * Namespace for all health fixture types
 * 
 * Provides type definitions for all health fixture collections to ensure type safety in tests
 */
export namespace HealthFixtureTypes {
  /**
   * Health metric fixture interface for type safety in tests
   */
  export type HealthMetric = HealthMetricsFixtures.HealthMetricFixture;

  /**
   * Blood pressure metric fixture interface for type safety in tests
   */
  export type BloodPressureMetric = HealthMetricsFixtures.BloodPressureMetricFixture;

  /**
   * Health goal fixture interface for type safety in tests
   */
  export type HealthGoal = HealthGoalsFixtures.HealthGoalFixture;

  /**
   * Goal completion scenario interface for type safety in tests
   */
  export type GoalCompletionScenario = HealthGoalsFixtures.GoalCompletionScenario;

  /**
   * Device connection fixture interface for type safety in tests
   */
  export type DeviceConnection = DeviceConnectionsFixtures.DeviceConnectionFixture;

  /**
   * Medical event fixture interface for type safety in tests
   */
  export type MedicalEvent = MedicalEventsFixtures.IMedicalEventFixture;
}

/**
 * Health metric fixture interface for type safety in tests
 */
export type HealthMetricFixture = HealthMetricsFixtures.HealthMetricFixture;

/**
 * Blood pressure metric fixture interface for type safety in tests
 */
export type BloodPressureMetricFixture = HealthMetricsFixtures.BloodPressureMetricFixture;

/**
 * Health goal fixture interface for type safety in tests
 */
export type HealthGoalFixture = HealthGoalsFixtures.HealthGoalFixture;

/**
 * Goal completion scenario interface for type safety in tests
 */
export type GoalCompletionScenario = HealthGoalsFixtures.GoalCompletionScenario;

/**
 * Device connection fixture interface for type safety in tests
 */
export type DeviceConnectionFixture = DeviceConnectionsFixtures.DeviceConnectionFixture;

/**
 * Medical event fixture interface for type safety in tests
 */
export type MedicalEventFixture = MedicalEventsFixtures.IMedicalEventFixture;

/**
 * All health metrics fixtures and factory functions
 */
export const healthMetrics = {
  ...HealthMetricsFixtures,
  scenarios: HealthMetricsFixtures.healthMetricScenarios,
};

/**
 * All health goals fixtures and factory functions
 */
export const healthGoals = {
  ...HealthGoalsFixtures,
  active: HealthGoalsFixtures.activeGoals,
  completed: HealthGoalsFixtures.completedGoals,
  byPeriod: HealthGoalsFixtures.goalsByPeriod,
  byType: HealthGoalsFixtures.goalsByType,
  scenarios: HealthGoalsFixtures.goalCompletionScenarios,
};

/**
 * All device connection fixtures and factory functions
 */
export const deviceConnections = {
  ...DeviceConnectionsFixtures,
  createMultiDeviceScenario: DeviceConnectionsFixtures.createMultiDeviceScenario,
  createTroubleshootingScenario: DeviceConnectionsFixtures.createTroubleshootingScenario,
  createSyncTestScenario: DeviceConnectionsFixtures.createSyncTestScenario,
};

/**
 * All medical event fixtures and factory functions
 */
export const medicalEvents = {
  ...MedicalEventsFixtures,
  diagnoses: MedicalEventsFixtures.diagnosisFixtures,
  procedures: MedicalEventsFixtures.procedureFixtures,
  medications: MedicalEventsFixtures.medicationFixtures,
  allergies: MedicalEventsFixtures.allergyFixtures,
  visits: MedicalEventsFixtures.visitFixtures,
  immunizations: MedicalEventsFixtures.immunizationFixtures,
  labResults: MedicalEventsFixtures.labResultFixtures,
  scenarios: MedicalEventsFixtures.medicalHistoryScenarios,
};

/**
 * Convenience function to get all health-related fixtures
 * 
 * @returns An object containing all health fixtures organized by category
 * 
 * @example
 * // Get all health fixtures for comprehensive testing
 * const fixtures = getAllHealthFixtures();
 * 
 * // Use specific categories
 * const { metrics, goals } = getAllHealthFixtures();
 * 
 * // Test with specific scenarios
 * const abnormalReadings = fixtures.metrics.scenarios.abnormalReadings;
 * const goalCompletions = fixtures.goals.scenarios.stepGoalCompletion;
 */
export function getAllHealthFixtures() {
  return {
    metrics: healthMetrics,
    goals: healthGoals,
    deviceConnections,
    medicalEvents,
  };
}

/**
 * Convenience function to get fixtures for a specific health entity type
 * 
 * @param entityType The type of health entity to get fixtures for ('metrics', 'goals', 'deviceConnections', or 'medicalEvents')
 * @returns An object containing fixtures for the specified entity type
 * 
 * @example
 * // Get fixtures for a specific entity type
 * const metricFixtures = getHealthFixturesByType('metrics');
 * const goalFixtures = getHealthFixturesByType('goals');
 */
export function getHealthFixturesByType(
  entityType: 'metrics' | 'goals' | 'deviceConnections' | 'medicalEvents'
) {
  const fixtureMap = {
    metrics: healthMetrics,
    goals: healthGoals,
    deviceConnections,
    medicalEvents,
  };
  
  return fixtureMap[entityType];
}

/**
 * Default export for easier importing
 */
export default {
  metrics: healthMetrics,
  goals: healthGoals,
  deviceConnections,
  medicalEvents,
  getAllHealthFixtures,
  getHealthFixturesByType,
  types: HealthFixtureTypes,
};