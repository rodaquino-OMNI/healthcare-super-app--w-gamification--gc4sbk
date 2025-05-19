/**
 * @file index.ts
 * @description Central barrel file that exports all event test fixtures for unit testing.
 * This file provides a single import point for accessing mock events, validation test cases,
 * Kafka message fixtures, and versioning test data.
 */

// Base event fixtures and utilities
import * as baseEvents from './base-events.fixtures';

// Journey-specific event fixtures
import * as healthEvents from './health-events.fixtures';
import * as careEvents from './care-events.fixtures';
import * as planEvents from './plan-events.fixtures';

// Kafka integration fixtures
import * as kafkaEvents from './kafka-events.fixtures';

// Validation and versioning fixtures
import * as validationFixtures from './validation.fixtures';
import * as versionFixtures from './version.fixtures';

/**
 * Base event fixtures and utilities
 * 
 * Provides foundational event fixtures that serve as the base for all event types
 * across journeys. Contains mock events with minimal valid properties, edge cases,
 * and common patterns used throughout event testing.
 */
export const baseEventFixtures = {
  ...baseEvents,
};

/**
 * Health journey event fixtures
 * 
 * Contains specialized test fixtures for Health journey events, including health metrics
 * recording, goal achievements, health insights, and device synchronization.
 */
export const healthEventFixtures = {
  ...healthEvents,
};

/**
 * Care journey event fixtures
 * 
 * Provides test fixtures for Care journey events, including appointment booking,
 * medication adherence, telemedicine sessions, and care plan progress updates.
 */
export const careEventFixtures = {
  ...careEvents,
};

/**
 * Plan journey event fixtures
 * 
 * Contains test fixtures for Plan journey events, including claim submission,
 * benefit utilization, plan selection/comparison, and reward redemption.
 */
export const planEventFixtures = {
  ...planEvents,
};

/**
 * Kafka integration fixtures
 * 
 * Provides specialized fixtures for testing Kafka integration in the events package.
 * Includes mock Kafka messages, consumer records, and producer payloads that simulate
 * the Kafka message structure for different event types.
 */
export const kafkaEventFixtures = {
  ...kafkaEvents,
};

/**
 * Validation test fixtures
 * 
 * Contains fixtures for testing event validation logic, including edge cases,
 * boundary values, and invalid data patterns.
 */
export const eventValidationFixtures = {
  ...validationFixtures,
};

/**
 * Event versioning fixtures
 * 
 * Provides test fixtures for event schema versioning, including events with different
 * schema versions, compatibility test cases, and version migration scenarios.
 */
export const eventVersionFixtures = {
  ...versionFixtures,
};

/**
 * Organized fixtures by journey
 */
export const journeyFixtures = {
  health: healthEventFixtures,
  care: careEventFixtures,
  plan: planEventFixtures,
};

/**
 * Organized fixtures by category
 */
export const categoryFixtures = {
  base: baseEventFixtures,
  kafka: kafkaEventFixtures,
  validation: eventValidationFixtures,
  versioning: eventVersionFixtures,
};

/**
 * All fixtures combined
 */
export const allFixtures = {
  base: baseEventFixtures,
  health: healthEventFixtures,
  care: careEventFixtures,
  plan: planEventFixtures,
  kafka: kafkaEventFixtures,
  validation: eventValidationFixtures,
  versioning: eventVersionFixtures,
};

// Re-export all fixtures directly
export {
  baseEvents,
  healthEvents,
  careEvents,
  planEvents,
  kafkaEvents,
  validationFixtures,
  versionFixtures,
};

// Default export for convenience
export default allFixtures;