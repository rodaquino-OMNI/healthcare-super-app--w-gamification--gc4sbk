/**
 * @file Centralizes exports of all Care journey test fixtures for consistent and convenient access across test suites.
 * 
 * This barrel file provides organized, named exports for appointments, providers, medications, treatments,
 * telemedicine, and symptom checker fixtures, ensuring standardized test data access patterns across
 * unit, integration, and e2e tests.
 */

// Import all Care journey fixture modules
import * as appointmentsFixtures from './appointments.fixtures';
import * as providersFixtures from './providers.fixtures';
import * as medicationsFixtures from './medications.fixtures';
import * as treatmentsFixtures from './treatments.fixtures';
import * as telemedicineFixtures from './telemedicine.fixtures';
import * as symptomCheckerFixtures from './symptom-checker.fixtures';

/**
 * Appointment fixtures for testing appointment scheduling, management, and integration
 * with other Care journey components.
 */
export const appointments = appointmentsFixtures;

/**
 * Provider fixtures for testing healthcare provider search, filtering, availability,
 * and appointment scheduling functionality.
 */
export const providers = providersFixtures;

/**
 * Medication fixtures for testing medication management, reminder functionality,
 * adherence tracking, and refill notifications.
 */
export const medications = medicationsFixtures;

/**
 * Treatment plan fixtures for testing treatment creation, progress tracking,
 * milestone notifications, and integration with appointments and medications.
 */
export const treatments = treatmentsFixtures;

/**
 * Telemedicine session fixtures for testing session creation, connection management,
 * recording functionality, and integration with appointments.
 */
export const telemedicine = telemedicineFixtures;

/**
 * Symptom checker fixtures for testing symptom evaluation logic, emergency detection,
 * and recommendation generation.
 */
export const symptomChecker = symptomCheckerFixtures;

/**
 * All Care journey fixtures organized by entity type for comprehensive testing
 */
export const allCareFixtures = {
  appointments,
  providers,
  medications,
  treatments,
  telemedicine,
  symptomChecker,
};

/**
 * Default export providing all Care journey fixtures
 */
export default allCareFixtures;