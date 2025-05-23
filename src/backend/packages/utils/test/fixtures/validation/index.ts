/**
 * @file Validation Test Fixtures
 * @description Centralized export point for all validation test fixtures used across the AUSTA SuperApp testing infrastructure.
 * These fixtures provide standardized test data for validating inputs, configurations, and domain-specific data
 * across all journey services.
 */

// Journey-specific validation fixtures
import * as journeyValidation from './journey-validation.fixtures';

// Security validation fixtures
import * as inputSanitization from './input-sanitization.fixtures';

// Configuration validation fixtures
import * as configValidation from './config-validation.fixtures';

// Date validation fixtures
import * as dateValidation from './date-validation.fixtures';

// Authentication validation fixtures
import * as passwordValidation from './password-validation.fixtures';
import * as emailValidation from './email-validation.fixtures';

// Brazilian-specific validation fixtures
import * as cpfValidation from './cpf-validation.fixtures';

/**
 * Journey-specific validation test fixtures organized by health, care, and plan journeys.
 * Contains domain-specific validation scenarios for each journey context.
 * 
 * @example
 * // Import health journey validation fixtures
 * import { journeyValidation } from '@austa/utils/test/fixtures/validation';
 * 
 * // Use health metrics validation fixtures in tests
 * test('validates health metrics correctly', () => {
 *   const { validHealthMetrics, invalidHealthMetrics } = journeyValidation.health;
 *   expect(validateHealthMetric(validHealthMetrics.bloodPressure)).toBe(true);
 *   expect(validateHealthMetric(invalidHealthMetrics.bloodPressure)).toBe(false);
 * });
 */
export { journeyValidation };

/**
 * Security validation test fixtures for testing input sanitization and protection against
 * common web vulnerabilities like XSS, SQL injection, and other attack vectors.
 * 
 * @example
 * // Import security validation fixtures
 * import { inputSanitization } from '@austa/utils/test/fixtures/validation';
 * 
 * // Test XSS protection
 * test('sanitizes XSS attack vectors', () => {
 *   const { xssAttackVectors } = inputSanitization;
 *   xssAttackVectors.forEach(vector => {
 *     expect(sanitizeInput(vector.input)).toBe(vector.expected);
 *   });
 * });
 */
export { inputSanitization };

/**
 * Configuration validation test fixtures for testing environment configuration validation
 * across microservices, including valid and invalid configuration objects.
 * 
 * @example
 * // Import configuration validation fixtures
 * import { configValidation } from '@austa/utils/test/fixtures/validation';
 * 
 * // Test database configuration validation
 * test('validates database configuration', () => {
 *   const { validDatabaseConfigs, invalidDatabaseConfigs } = configValidation;
 *   expect(validateDatabaseConfig(validDatabaseConfigs.postgres)).toBe(true);
 *   expect(validateDatabaseConfig(invalidDatabaseConfigs.missingHost)).toBe(false);
 * });
 */
export { configValidation };

/**
 * Date validation test fixtures for testing date validation and formatting in Brazilian
 * and international formats, covering valid dates, invalid dates, and edge cases.
 * 
 * @example
 * // Import date validation fixtures
 * import { dateValidation } from '@austa/utils/test/fixtures/validation';
 * 
 * // Test Brazilian date format validation
 * test('validates Brazilian date format', () => {
 *   const { validBrazilianDates, invalidBrazilianDates } = dateValidation;
 *   validBrazilianDates.forEach(date => {
 *     expect(isValidBrazilianDate(date)).toBe(true);
 *   });
 *   invalidBrazilianDates.forEach(date => {
 *     expect(isValidBrazilianDate(date)).toBe(false);
 *   });
 * });
 */
export { dateValidation };

/**
 * Password validation test fixtures for testing password strength and security policy validation,
 * containing weak, medium, and strong password examples, and various policy test cases.
 * 
 * @example
 * // Import password validation fixtures
 * import { passwordValidation } from '@austa/utils/test/fixtures/validation';
 * 
 * // Test password strength validation
 * test('validates password strength', () => {
 *   const { weakPasswords, mediumPasswords, strongPasswords } = passwordValidation;
 *   weakPasswords.forEach(password => {
 *     expect(getPasswordStrength(password)).toBe('weak');
 *   });
 *   strongPasswords.forEach(password => {
 *     expect(getPasswordStrength(password)).toBe('strong');
 *   });
 * });
 */
export { passwordValidation };

/**
 * Email validation test fixtures for testing email address validation, providing sample
 * valid emails, invalid emails, and edge cases for comprehensive testing.
 * 
 * @example
 * // Import email validation fixtures
 * import { emailValidation } from '@austa/utils/test/fixtures/validation';
 * 
 * // Test email validation
 * test('validates email addresses', () => {
 *   const { validEmails, invalidEmails } = emailValidation;
 *   validEmails.forEach(email => {
 *     expect(isValidEmail(email)).toBe(true);
 *   });
 *   invalidEmails.forEach(email => {
 *     expect(isValidEmail(email)).toBe(false);
 *   });
 * });
 */
export { emailValidation };

/**
 * CPF validation test fixtures for testing Brazilian CPF number validation, including
 * valid CPFs with different formatting, invalid CPFs, and edge cases.
 * 
 * @example
 * // Import CPF validation fixtures
 * import { cpfValidation } from '@austa/utils/test/fixtures/validation';
 * 
 * // Test CPF validation
 * test('validates CPF numbers', () => {
 *   const { validCPFs, invalidCPFs } = cpfValidation;
 *   validCPFs.forEach(cpf => {
 *     expect(isValidCPF(cpf)).toBe(true);
 *   });
 *   invalidCPFs.forEach(cpf => {
 *     expect(isValidCPF(cpf)).toBe(false);
 *   });
 * });
 */
export { cpfValidation };

/**
 * Convenience export of all validation fixtures grouped by category.
 * This allows importing all fixtures at once when needed.
 * 
 * @example
 * // Import all validation fixtures
 * import { validationFixtures } from '@austa/utils/test/fixtures/validation';
 * 
 * // Access specific fixture categories
 * const { journeyValidation, emailValidation } = validationFixtures;
 * 
 * // Use in tests
 * test('validates user data', () => {
 *   expect(isValidEmail(emailValidation.validEmails[0])).toBe(true);
 *   expect(validateHealthData(journeyValidation.health.validHealthMetrics.steps)).toBe(true);
 * });
 */
export const validationFixtures = {
  journeyValidation,
  inputSanitization,
  configValidation,
  dateValidation,
  passwordValidation,
  emailValidation,
  cpfValidation,
};

// Default export for convenient importing
export default validationFixtures;