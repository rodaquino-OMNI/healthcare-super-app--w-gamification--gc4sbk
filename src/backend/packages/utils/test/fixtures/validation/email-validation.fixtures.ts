/**
 * @file Email validation test fixtures for the AUSTA SuperApp
 * 
 * This file provides comprehensive test fixtures for email address validation,
 * including valid emails with various formats, invalid emails with syntax errors,
 * and edge cases. These fixtures are essential for testing email validation functions
 * across all user registration, profile management, and communication workflows.
 * 
 * The fixtures are organized into categories to support different testing scenarios
 * and are exported both individually and as grouped collections.
 */

/**
 * Interface for email validation test case with optional description
 */
export interface EmailTestCase {
  /** The email address to test */
  email: string;
  /** Optional description explaining the test case */
  description?: string;
}

/**
 * Simple valid email addresses with standard formats
 */
export const simpleValidEmails: EmailTestCase[] = [
  { email: 'user@example.com', description: 'Basic email format' },
  { email: 'firstname.lastname@example.com', description: 'Email with dot in local part' },
  { email: 'user123@example.com', description: 'Email with numbers in local part' },
  { email: 'user-name@example.com', description: 'Email with hyphen in local part' },
  { email: 'user_name@example.com', description: 'Email with underscore in local part' },
  { email: 'firstname.lastname@example.co.uk', description: 'Email with multi-part TLD' },
  { email: 'info@company-name.com', description: 'Email with hyphen in domain' },
  { email: 'user@example.technology', description: 'Email with long TLD' },
  { email: 'user@example.app', description: 'Email with modern TLD' },
  { email: 'user.name+tag@example.com', description: 'Email with plus addressing' },
];

/**
 * Complex valid email addresses with advanced formats
 */
export const complexValidEmails: EmailTestCase[] = [
  { email: 'very.unusual.@.unusual.com@example.com', description: 'Email with dots in unusual places' },
  { email: 'user@subdomain.example.com', description: 'Email with subdomain' },
  { email: 'user@123.example.com', description: 'Email with numeric subdomain' },
  { email: '"much.more unusual"@example.com', description: 'Email with quoted local part containing spaces' },
  { email: '"very.(),:;<>[]\".VERY.\"very@\\ \"very\".unusual"@strange.example.com', description: 'Email with special characters in quoted local part' },
  { email: 'user+tag+sorting@example.com', description: 'Email with multiple plus tags' },
  { email: 'user@[192.168.2.1]', description: 'Email with IP address as domain' },
  { email: '"joe"@example.org', description: 'Email with quoted local part' },
  { email: '#!$%&\'*+-/=?^_`{}|~@example.org', description: 'Email with special characters in local part' },
  { email: 'user@localhost', description: 'Email with localhost domain' },
];

/**
 * Valid email addresses with international domain names
 */
export const internationalValidEmails: EmailTestCase[] = [
  { email: 'user@例子.世界', description: 'Email with Chinese IDN' },
  { email: 'user@例子.测试', description: 'Email with Chinese IDN (test)' },
  { email: 'user@xn--fsqu00a.xn--0zwm56d', description: 'Email with Punycode IDN (例子.测试)' },
  { email: 'user@üñîçøðé.com', description: 'Email with Unicode characters in domain' },
  { email: 'user@mañana.com', description: 'Email with Spanish character in domain' },
  { email: 'user@españa.com', description: 'Email with Spanish domain' },
  { email: 'user@рф.ru', description: 'Email with Cyrillic domain' },
  { email: 'user@مثال.إختبار', description: 'Email with Arabic IDN' },
  { email: 'user@例え.テスト', description: 'Email with Japanese IDN' },
  { email: 'user@उदाहरण.परीक्षा', description: 'Email with Hindi IDN' },
];

/**
 * Edge case valid email addresses that test boundary conditions
 */
export const edgeCaseValidEmails: EmailTestCase[] = [
  { 
    email: 'a@b.c', 
    description: 'Minimal valid email (shortest possible)' 
  },
  { 
    email: `${'a'.repeat(64)}@${'b'.repeat(63)}.com`, 
    description: 'Email with maximum length local part (64 characters) and domain label (63 characters)' 
  },
  { 
    email: `user@${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(63)}.com`, 
    description: 'Email with multiple maximum length domain labels' 
  },
  { 
    email: '0@0.0', 
    description: 'Email with only numeric characters' 
  },
  { 
    email: 'user@domain.museum', 
    description: 'Email with less common TLD' 
  },
  { 
    email: 'user@domain.co.jp', 
    description: 'Email with country-specific multi-part TLD' 
  },
  { 
    email: 'user@domain.travel', 
    description: 'Email with sponsored TLD' 
  },
  { 
    email: 'user@domain.xn--fiqs8s', 
    description: 'Email with Punycode TLD (中国)' 
  },
  { 
    email: 'user@xn--80akhbyknj4f.xn--p1ai', 
    description: 'Email with full Punycode domain' 
  },
  { 
    email: 'user@[IPv6:2001:db8:85a3:8d3:1319:8a2e:370:7348]', 
    description: 'Email with IPv6 address as domain' 
  },
];

/**
 * Invalid email addresses with syntax errors
 */
export const invalidEmails: EmailTestCase[] = [
  { email: 'plainaddress', description: 'Missing @ symbol' },
  { email: '@example.com', description: 'Missing local part' },
  { email: 'user@', description: 'Missing domain' },
  { email: 'user@.com', description: 'Missing domain part before dot' },
  { email: 'user@example', description: 'Missing TLD' },
  { email: 'user@example.', description: 'Domain ends with dot' },
  { email: 'user@example..com', description: 'Consecutive dots in domain' },
  { email: 'user@example.c', description: 'TLD too short (single character)' },
  { email: 'user@example.toolongtld', description: 'TLD too long (more than 63 characters is invalid)' },
  { email: 'user@-example.com', description: 'Domain starts with hyphen' },
];

/**
 * More invalid email addresses with format errors
 */
export const moreInvalidEmails: EmailTestCase[] = [
  { email: 'user@example@example.com', description: 'Multiple @ symbols' },
  { email: 'user name@example.com', description: 'Space in local part (without quotes)' },
  { email: 'user\name@example.com', description: 'Backslash in local part (without quotes)' },
  { email: '.user@example.com', description: 'Local part starts with dot' },
  { email: 'user.@example.com', description: 'Local part ends with dot' },
  { email: 'user..name@example.com', description: 'Consecutive dots in local part' },
  { email: 'user@example-.com', description: 'Domain part with trailing hyphen' },
  { email: `${'a'.repeat(65)}@example.com`, description: 'Local part too long (>64 characters)' },
  { email: `user@${'a'.repeat(64)}.com`, description: 'Domain label too long (>63 characters)' },
  { email: 'user@[192.168.1.1', description: 'Unclosed bracket in domain' },
];

/**
 * Invalid email addresses that are commonly mistyped
 */
export const commonlyMistypedEmails: EmailTestCase[] = [
  { email: 'user@example,com', description: 'Comma instead of dot' },
  { email: 'user@example;com', description: 'Semicolon instead of dot' },
  { email: 'user@example:com', description: 'Colon instead of dot' },
  { email: 'user@example com', description: 'Space instead of dot' },
  { email: 'user@examplecom', description: 'Missing dot before TLD' },
  { email: 'user@.example.com', description: 'Domain starts with dot' },
  { email: 'user@example_com', description: 'Underscore instead of dot' },
  { email: 'user@example.com.', description: 'Trailing dot' },
  { email: 'user@example.co,m', description: 'Comma in TLD' },
  { email: 'user@example.co m', description: 'Space in TLD' },
];

/**
 * All valid email test cases combined
 */
export const validEmails: EmailTestCase[] = [
  ...simpleValidEmails,
  ...complexValidEmails,
  ...internationalValidEmails,
  ...edgeCaseValidEmails,
];

/**
 * All invalid email test cases combined
 */
export const invalidEmailsAll: EmailTestCase[] = [
  ...invalidEmails,
  ...moreInvalidEmails,
  ...commonlyMistypedEmails,
];

/**
 * Just the email strings from valid test cases (for simpler testing)
 */
export const validEmailStrings: string[] = validEmails.map(testCase => testCase.email);

/**
 * Just the email strings from invalid test cases (for simpler testing)
 */
export const invalidEmailStrings: string[] = invalidEmailsAll.map(testCase => testCase.email);

/**
 * Complete collection of email validation test fixtures
 */
export const emailValidationFixtures = {
  // Valid email collections
  simpleValidEmails,
  complexValidEmails,
  internationalValidEmails,
  edgeCaseValidEmails,
  validEmails,
  validEmailStrings,
  
  // Invalid email collections
  invalidEmails,
  moreInvalidEmails,
  commonlyMistypedEmails,
  invalidEmailsAll,
  invalidEmailStrings,
};

/**
 * Type definition for the email validation fixtures collection
 */
export type EmailValidationFixtures = typeof emailValidationFixtures;

/**
 * Usage examples:
 * 
 * @example
 * // Import all email validation fixtures
 * import { emailValidationFixtures } from '@austa/utils/test/fixtures/validation';
 * 
 * // Test with all valid emails
 * emailValidationFixtures.validEmailStrings.forEach(email => {
 *   expect(isValidEmail(email)).toBe(true);
 * });
 * 
 * // Test with specific categories
 * emailValidationFixtures.internationalValidEmails.forEach(({ email }) => {
 *   expect(isValidEmail(email)).toBe(true);
 * });
 * 
 * @example
 * // Import specific collections directly
 * import { validEmailStrings, invalidEmailStrings } from '@austa/utils/test/fixtures/validation';
 * 
 * describe('Email Validator', () => {
 *   it('should validate correct email formats', () => {
 *     validEmailStrings.forEach(email => {
 *       expect(isValidEmail(email)).toBe(true);
 *     });
 *   });
 * 
 *   it('should reject invalid email formats', () => {
 *     invalidEmailStrings.forEach(email => {
 *       expect(isValidEmail(email)).toBe(false);
 *     });
 *   });
 * });
 */