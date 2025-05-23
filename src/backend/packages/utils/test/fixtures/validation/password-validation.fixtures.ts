/**
 * Password Validation Test Fixtures
 * 
 * This file provides test fixtures for password strength and security policy validation.
 * It contains categorized examples of weak, medium, and strong passwords, as well as
 * various test cases for specific password policy requirements (length, uppercase,
 * lowercase, numbers, symbols).
 * 
 * These fixtures ensure consistent security validation across all authentication flows
 * and policy enforcement in the AUSTA SuperApp.
 */

/**
 * Interface representing a password test case with expected validation results
 */
export interface PasswordTestCase {
  /** The password string to test */
  password: string;
  /** Description of the password test case */
  description: string;
  /** Expected validation results for different criteria */
  expected: {
    /** Whether the password meets minimum length requirements */
    meetsLengthRequirement: boolean;
    /** Whether the password contains at least one uppercase letter */
    hasUppercase: boolean;
    /** Whether the password contains at least one lowercase letter */
    hasLowercase: boolean;
    /** Whether the password contains at least one number */
    hasNumber: boolean;
    /** Whether the password contains at least one special character */
    hasSymbol: boolean;
    /** Whether the password is considered strong overall */
    isStrong: boolean;
  };
}

/**
 * Interface for password policy test cases
 */
export interface PasswordPolicyTestCase {
  /** The password string to test */
  password: string;
  /** Description of what this test case is validating */
  description: string;
  /** The policy configuration to test against */
  policy: {
    /** Minimum required password length */
    minLength: number;
    /** Whether uppercase letters are required */
    requireUppercase: boolean;
    /** Whether lowercase letters are required */
    requireLowercase: boolean;
    /** Whether numbers are required */
    requireNumber: boolean;
    /** Whether special characters are required */
    requireSymbol: boolean;
  };
  /** Expected result of the validation */
  expectedResult: boolean;
}

/**
 * Collection of weak password examples that fail multiple security criteria
 */
export const weakPasswords: PasswordTestCase[] = [
  {
    password: 'password',
    description: 'Common dictionary word',
    expected: {
      meetsLengthRequirement: false, // Less than 10 characters
      hasUppercase: false,
      hasLowercase: true,
      hasNumber: false,
      hasSymbol: false,
      isStrong: false,
    },
  },
  {
    password: '12345678',
    description: 'Sequential numbers only',
    expected: {
      meetsLengthRequirement: false, // Less than 10 characters
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: true,
      hasSymbol: false,
      isStrong: false,
    },
  },
  {
    password: 'qwerty123',
    description: 'Keyboard pattern with numbers',
    expected: {
      meetsLengthRequirement: false, // Less than 10 characters
      hasUppercase: false,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: false,
      isStrong: false,
    },
  },
  {
    password: 'abcdef',
    description: 'Very short password',
    expected: {
      meetsLengthRequirement: false, // Less than 10 characters
      hasUppercase: false,
      hasLowercase: true,
      hasNumber: false,
      hasSymbol: false,
      isStrong: false,
    },
  },
  {
    password: 'letmein',
    description: 'Common weak password',
    expected: {
      meetsLengthRequirement: false, // Less than 10 characters
      hasUppercase: false,
      hasLowercase: true,
      hasNumber: false,
      hasSymbol: false,
      isStrong: false,
    },
  },
];

/**
 * Collection of medium-strength password examples that meet some but not all security criteria
 */
export const mediumPasswords: PasswordTestCase[] = [
  {
    password: 'Password123',
    description: 'Has uppercase, lowercase, and numbers but no symbols',
    expected: {
      meetsLengthRequirement: true, // 11 characters
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: false,
      isStrong: false,
    },
  },
  {
    password: 'securepassword',
    description: 'Long but only lowercase',
    expected: {
      meetsLengthRequirement: true, // 14 characters
      hasUppercase: false,
      hasLowercase: true,
      hasNumber: false,
      hasSymbol: false,
      isStrong: false,
    },
  },
  {
    password: 'UPPERCASE123',
    description: 'Has uppercase and numbers but no lowercase',
    expected: {
      meetsLengthRequirement: true, // 12 characters
      hasUppercase: true,
      hasLowercase: false,
      hasNumber: true,
      hasSymbol: false,
      isStrong: false,
    },
  },
  {
    password: 'password!@#',
    description: 'Has lowercase and symbols but no uppercase or numbers',
    expected: {
      meetsLengthRequirement: true, // 11 characters
      hasUppercase: false,
      hasLowercase: true,
      hasNumber: false,
      hasSymbol: true,
      isStrong: false,
    },
  },
  {
    password: 'Secure2023',
    description: 'Has uppercase, lowercase, and numbers but no symbols',
    expected: {
      meetsLengthRequirement: true, // 10 characters
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: false,
      isStrong: false,
    },
  },
];

/**
 * Collection of strong password examples that meet all security criteria
 */
export const strongPasswords: PasswordTestCase[] = [
  {
    password: 'P@ssw0rd123!',
    description: 'Has uppercase, lowercase, numbers, and symbols',
    expected: {
      meetsLengthRequirement: true, // 13 characters
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: true,
      isStrong: true,
    },
  },
  {
    password: 'Sup3r$ecure2023',
    description: 'Long with all required elements',
    expected: {
      meetsLengthRequirement: true, // 16 characters
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: true,
      isStrong: true,
    },
  },
  {
    password: 'C0mpl3x!P@ssw0rd',
    description: 'Complex with multiple special characters',
    expected: {
      meetsLengthRequirement: true, // 17 characters
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: true,
      isStrong: true,
    },
  },
  {
    password: 'aU5T@-2023-S3cur3',
    description: 'Contains hyphens and various character types',
    expected: {
      meetsLengthRequirement: true, // 18 characters
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: true,
      isStrong: true,
    },
  },
  {
    password: '!Aa1Bb2Cc3Dd4#',
    description: 'Alternating character types',
    expected: {
      meetsLengthRequirement: true, // 15 characters
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: true,
      isStrong: true,
    },
  },
];

/**
 * Test cases for specific password policy requirements
 */
export const passwordPolicyTestCases: PasswordPolicyTestCase[] = [
  // Length requirement tests
  {
    password: 'Short1!',
    description: 'Too short for default policy but meets all other criteria',
    policy: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSymbol: true,
    },
    expectedResult: false,
  },
  {
    password: 'JustEnough1!',
    description: 'Exactly meets minimum length requirement',
    policy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSymbol: true,
    },
    expectedResult: true,
  },
  
  // Uppercase requirement tests
  {
    password: 'nouppercase123!',
    description: 'Missing uppercase but meets all other criteria',
    policy: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSymbol: true,
    },
    expectedResult: false,
  },
  {
    password: 'nouppercase123!',
    description: 'Passes when uppercase not required',
    policy: {
      minLength: 10,
      requireUppercase: false,
      requireLowercase: true,
      requireNumber: true,
      requireSymbol: true,
    },
    expectedResult: true,
  },
  
  // Lowercase requirement tests
  {
    password: 'NOLOWERCASE123!',
    description: 'Missing lowercase but meets all other criteria',
    policy: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSymbol: true,
    },
    expectedResult: false,
  },
  {
    password: 'NOLOWERCASE123!',
    description: 'Passes when lowercase not required',
    policy: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: false,
      requireNumber: true,
      requireSymbol: true,
    },
    expectedResult: true,
  },
  
  // Number requirement tests
  {
    password: 'NoNumbersHere!',
    description: 'Missing numbers but meets all other criteria',
    policy: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSymbol: true,
    },
    expectedResult: false,
  },
  {
    password: 'NoNumbersHere!',
    description: 'Passes when numbers not required',
    policy: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: false,
      requireSymbol: true,
    },
    expectedResult: true,
  },
  
  // Symbol requirement tests
  {
    password: 'NoSymbols123ABC',
    description: 'Missing symbols but meets all other criteria',
    policy: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSymbol: true,
    },
    expectedResult: false,
  },
  {
    password: 'NoSymbols123ABC',
    description: 'Passes when symbols not required',
    policy: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSymbol: false,
    },
    expectedResult: true,
  },
  
  // Custom policy combinations
  {
    password: 'simple',
    description: 'Minimal policy with only length requirement',
    policy: {
      minLength: 6,
      requireUppercase: false,
      requireLowercase: false,
      requireNumber: false,
      requireSymbol: false,
    },
    expectedResult: true,
  },
  {
    password: 'SimplePassword',
    description: 'Only requires length and uppercase',
    policy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: false,
      requireNumber: false,
      requireSymbol: false,
    },
    expectedResult: true,
  },
];

/**
 * Common password security vulnerability examples for testing
 */
export const vulnerablePasswords: PasswordTestCase[] = [
  {
    password: 'password123',
    description: 'Common password with numbers appended',
    expected: {
      meetsLengthRequirement: true, // 11 characters
      hasUppercase: false,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: false,
      isStrong: false,
    },
  },
  {
    password: 'admin123!',
    description: 'Common admin credential pattern',
    expected: {
      meetsLengthRequirement: false, // 9 characters
      hasUppercase: false,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: true,
      isStrong: false,
    },
  },
  {
    password: 'January2023!',
    description: 'Month and year pattern with symbol',
    expected: {
      meetsLengthRequirement: true, // 12 characters
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: true,
      isStrong: true, // Technically strong but predictable
    },
  },
  {
    password: 'Qwerty123!',
    description: 'Keyboard pattern with required elements',
    expected: {
      meetsLengthRequirement: true, // 10 characters
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: true,
      isStrong: true, // Technically strong but based on pattern
    },
  },
  {
    password: 'P@ssw0rd',
    description: 'Common password with character substitution',
    expected: {
      meetsLengthRequirement: false, // 8 characters
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: true,
      isStrong: false, // Too short despite meeting other criteria
    },
  },
];

/**
 * All password test cases combined for comprehensive testing
 */
export const allPasswordTestCases: PasswordTestCase[] = [
  ...weakPasswords,
  ...mediumPasswords,
  ...strongPasswords,
  ...vulnerablePasswords,
];