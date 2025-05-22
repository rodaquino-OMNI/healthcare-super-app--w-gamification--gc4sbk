/**
 * @file Centralizes exports of all health-related test fixtures used for testing the Health journey features.
 * 
 * This barrel file provides organized, named exports for health metrics, health goals, device connections, and medical events fixtures,
 * ensuring consistent test data access patterns across unit, integration, and e2e tests.
 */

// Import all health-related fixtures
import * as healthMetricsFixtures from './health-metrics.fixtures';
import * as healthGoalsFixtures from './health-goals.fixtures';
import * as deviceConnectionsFixtures from './device-connections.fixtures';
import * as medicalEventsFixtures from './medical-events.fixtures';

/**
 * Health metrics fixtures for testing health tracking features
 */
export const metrics = healthMetricsFixtures;

/**
 * Health goals fixtures for testing goal progress tracking
 */
export const goals = healthGoalsFixtures;

/**
 * Device connection fixtures for testing device pairing and synchronization
 */
export const devices = deviceConnectionsFixtures;

/**
 * Medical events fixtures for testing medical history tracking
 */
export const medicalEvents = medicalEventsFixtures;

/**
 * All health fixtures combined in a single object
 */
export const allHealthFixtures = {
  metrics: healthMetricsFixtures,
  goals: healthGoalsFixtures,
  devices: deviceConnectionsFixtures,
  medicalEvents: medicalEventsFixtures,
};

/**
 * Default export providing all health fixtures
 */
export default allHealthFixtures;