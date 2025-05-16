/**
 * @file Central export point for all validation test fixtures used in the utils package tests.
 * 
 * This barrel file provides a single import point for all validation-related test fixtures,
 * organized by validation category. It enables consistent and simplified importing of fixtures
 * across all test files while maintaining proper TypeScript typing for improved developer experience.
 * 
 * @example
 * // Import all fixtures from a specific validation category
 * import { emailValidationFixtures } from '@austa/utils/test/fixtures/validation';
 * 
 * // Import specific fixtures directly
 * import { validEmails, invalidEmails } from '@austa/utils/test/fixtures/validation';
 * 
 * // Import from a specific category with destructuring
 * import { passwordValidationFixtures } from '@austa/utils/test/fixtures/validation';
 * const { strongPasswords, weakPasswords } = passwordValidationFixtures;
 * 
 * // Import all validation fixtures as a namespace
 * import * as validationFixtures from '@austa/utils/test/fixtures/validation';
 * validationFixtures.cpfValidationFixtures.validCPFs;
 */

// Email validation fixtures
export * from './email-validation.fixtures';
export * as emailValidationFixtures from './email-validation.fixtures';

// Password validation fixtures
export * from './password-validation.fixtures';
export * as passwordValidationFixtures from './password-validation.fixtures';

// CPF validation fixtures (Brazilian tax ID)
export * from './cpf-validation.fixtures';
export * as cpfValidationFixtures from './cpf-validation.fixtures';

// Date validation fixtures
export * from './date-validation.fixtures';
export * as dateValidationFixtures from './date-validation.fixtures';

// Config validation fixtures
export * from './config-validation.fixtures';
export * as configValidationFixtures from './config-validation.fixtures';

// Input sanitization fixtures
export * from './input-sanitization.fixtures';
export * as inputSanitizationFixtures from './input-sanitization.fixtures';

// Journey-specific validation fixtures
export * from './journey-validation.fixtures';
export * as journeyValidationFixtures from './journey-validation.fixtures';

/**
 * Comprehensive collection of all validation test fixtures organized by validation category.
 * This object provides a structured way to access all validation fixtures when needed as a group.
 */
export const validationFixtures = {
  email: emailValidationFixtures,
  password: passwordValidationFixtures,
  cpf: cpfValidationFixtures,
  date: dateValidationFixtures,
  config: configValidationFixtures,
  inputSanitization: inputSanitizationFixtures,
  journey: journeyValidationFixtures
};

/**
 * @typedef {Object} ValidationFixtureCollection
 * @property {typeof emailValidationFixtures} email - Email validation test fixtures
 * @property {typeof passwordValidationFixtures} password - Password validation test fixtures
 * @property {typeof cpfValidationFixtures} cpf - Brazilian CPF validation test fixtures
 * @property {typeof dateValidationFixtures} date - Date validation test fixtures
 * @property {typeof configValidationFixtures} config - Configuration validation test fixtures
 * @property {typeof inputSanitizationFixtures} inputSanitization - Input sanitization test fixtures
 * @property {typeof journeyValidationFixtures} journey - Journey-specific validation test fixtures
 */

// Type declaration for the validationFixtures object to improve IDE support
export type ValidationFixtureCollection = typeof validationFixtures;

/**
 * Usage examples for validation fixtures in tests:
 * 
 * @example
 * // Testing email validation
 * import { validEmails, invalidEmails } from '@austa/utils/test/fixtures/validation';
 * 
 * describe('Email Validator', () => {
 *   it('should validate correct email formats', () => {
 *     validEmails.forEach(email => {
 *       expect(isValidEmail(email)).toBe(true);
 *     });
 *   });
 * 
 *   it('should reject invalid email formats', () => {
 *     invalidEmails.forEach(email => {
 *       expect(isValidEmail(email)).toBe(false);
 *     });
 *   });
 * });
 * 
 * @example
 * // Testing journey-specific validation
 * import { journeyValidationFixtures } from '@austa/utils/test/fixtures/validation';
 * 
 * describe('Health Metrics Validator', () => {
 *   it('should validate health metrics within normal ranges', () => {
 *     journeyValidationFixtures.health.validMetrics.forEach(metric => {
 *       expect(validateHealthMetric(metric)).toBe(true);
 *     });
 *   });
 * });
 */