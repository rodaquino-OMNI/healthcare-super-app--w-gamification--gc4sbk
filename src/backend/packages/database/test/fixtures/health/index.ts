/**
 * @file Health Journey Test Fixtures Index
 * @description Centralizes exports of all health-related test fixtures used for testing the Health journey features.
 * This barrel file provides organized, named exports for health metrics, health goals, device connections, and medical events fixtures,
 * ensuring consistent test data access patterns across unit, integration, and e2e tests.
 */

// Health Metrics Fixtures
export {
  // Enums
  MetricType,
  MetricSource,
  
  // Interfaces
  HealthMetric,
  MetricRange,
  CreateHealthMetricOptions,
  BloodPressureOptions,
  
  // Constants
  METRIC_RANGES,
  
  // Factory Functions
  createHealthMetric,
  createHeartRateMetric,
  createBloodPressureMetric,
  createBloodGlucoseMetric,
  createStepsMetric,
  createWeightMetric,
  createSleepMetric,
  createUserHealthHistory,
  
  // Scenarios
  healthMetricScenarios
} from './health-metrics.fixtures';

// Health Goals Fixtures
export {
  // Interfaces
  HealthGoalFixtureOptions,
  
  // Factory Functions
  createHealthGoalFixture,
  createCompletedGoalFixture,
  createAbandonedGoalFixture,
  createNearlyCompletedGoalFixture,
  createRandomHealthGoals,
  
  // Scenarios
  healthGoalFixtures,
  goalCompletionScenarios
} from './health-goals.fixtures';

// Device Connections Fixtures
export {
  // Interfaces
  DeviceConnectionFixture,
  DeviceTypeFixture,
  
  // Constants
  deviceTypes,
  
  // Factory Functions
  createDeviceConnectionFixture,
  createSmartwatchFixture,
  createBloodPressureMonitorFixture,
  createGlucoseMonitorFixture,
  createSmartScaleFixture,
  
  // Scenarios
  deviceConnectionScenarios
} from './device-connections.fixtures';

// Medical Events Fixtures
export {
  // Interfaces
  MedicalEventFixture,
  
  // Enums
  MedicalEventType,
  
  // Factory Functions
  createMedicalEventFixture,
  createDiagnosisFixture,
  createProcedureFixture,
  createMedicationFixture,
  createAllergyFixture,
  createImmunizationFixture,
  createVisitFixture,
  createLabResultFixture,
  
  // Scenarios
  standardMedicalEvents,
  allStandardMedicalEvents,
  medicalHistoryScenarios,
  fhirMedicalEvents
} from './medical-events.fixtures';

/**
 * Convenience grouping of all health-related test fixtures by category
 * for easier imports in test files
 */
export const healthFixtures = {
  metrics: {
    createHealthMetric,
    createHeartRateMetric,
    createBloodPressureMetric,
    createBloodGlucoseMetric,
    createStepsMetric,
    createWeightMetric,
    createSleepMetric,
    createUserHealthHistory,
    scenarios: healthMetricScenarios
  },
  goals: {
    createHealthGoalFixture,
    createCompletedGoalFixture,
    createAbandonedGoalFixture,
    createNearlyCompletedGoalFixture,
    createRandomHealthGoals,
    fixtures: healthGoalFixtures,
    scenarios: goalCompletionScenarios
  },
  devices: {
    createDeviceConnectionFixture,
    createSmartwatchFixture,
    createBloodPressureMonitorFixture,
    createGlucoseMonitorFixture,
    createSmartScaleFixture,
    types: deviceTypes,
    scenarios: deviceConnectionScenarios
  },
  medicalEvents: {
    createMedicalEventFixture,
    createDiagnosisFixture,
    createProcedureFixture,
    createMedicationFixture,
    createAllergyFixture,
    createImmunizationFixture,
    createVisitFixture,
    createLabResultFixture,
    standard: standardMedicalEvents,
    all: allStandardMedicalEvents,
    scenarios: medicalHistoryScenarios,
    fhir: fhirMedicalEvents
  }
};