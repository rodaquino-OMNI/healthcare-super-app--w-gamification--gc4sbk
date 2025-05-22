/**
 * @file Main barrel file that exports all database test fixtures from across the testing infrastructure.
 * 
 * This file provides a centralized, organized way to import specific fixture sets for different testing scenarios,
 * while ensuring proper typing for all imported fixtures. It follows standardized export patterns for better
 * developer experience and supports cross-journey testing.
 */

// Import journey-specific fixtures
import * as healthFixtures from './health';
import * as careFixtures from './care';
import * as planFixtures from './plan';
import * as gamificationFixtures from './gamification';

// Import common fixtures
import * as commonFixtures from './common';

// Import scenario fixtures
import * as scenarioFixtures from './scenarios';

/**
 * Journey-specific fixtures organized by domain
 */
export const journeyFixtures = {
  health: healthFixtures,
  care: careFixtures,
  plan: planFixtures,
  gamification: gamificationFixtures,
};

/**
 * Common fixtures shared across all journeys
 */
export const common = commonFixtures;

/**
 * Specialized test scenarios for database features
 */
export const scenarios = scenarioFixtures;

/**
 * Direct exports for each journey for convenience
 */
export const health = healthFixtures;
export const care = careFixtures;
export const plan = planFixtures;
export const gamification = gamificationFixtures;

/**
 * All fixtures combined in a single object for comprehensive testing
 */
export const allFixtures = {
  ...journeyFixtures,
  common: commonFixtures,
  scenarios: scenarioFixtures,
};

/**
 * Default export providing all fixtures
 */
export default allFixtures;