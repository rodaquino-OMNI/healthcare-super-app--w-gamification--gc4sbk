/**
 * Validation Test Helpers
 * 
 * Provides utilities for testing validation functions and schemas across the AUSTA SuperApp.
 * These helpers facilitate testing of schema validation, object validation, and type-specific
 * validation functions across all journey services.
 */

import { z } from 'zod';
import { validate, validateSync, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// Import fixtures for test data generation
import {
  validEmails,
  invalidEmails,
} from '../fixtures/validation/email-validation.fixtures';

import {
  validCPFs,
  invalidCPFs,
} from '../fixtures/validation/cpf-validation.fixtures';

import {
  validDates,
  invalidDates,
} from '../fixtures/validation/date-validation.fixtures';

import {
  validPasswords,
  invalidPasswords,
} from '../fixtures/validation/password-validation.fixtures';

import {
  securityVectors,
} from '../fixtures/validation/input-sanitization.fixtures';

/**
 * Types for validation testing
 */
export type ValidationTestCase<T> = {
  value: T;
  description: string;
  shouldPass: boolean;
  expectedErrors?: string[];
};

export type SchemaValidationResult<T> = {
  success: boolean;
  value?: T;
  errors?: z.ZodError | ValidationError[];
};

/**
 * Data generators for validation testing
 */

/**
 * Generates a set of test cases for email validation
 * @param includeCustom - Whether to include custom test cases
 * @param customValid - Additional valid email test cases
 * @param customInvalid - Additional invalid email test cases
 * @returns Array of email validation test cases
 */
export function generateEmailTestCases(
  includeCustom = false,
  customValid: string[] = [],
  customInvalid: string[] = []
): ValidationTestCase<string>[] {
  const standardValid = validEmails.map(email => ({
    value: email,
    description: `Valid email: ${email}`,
    shouldPass: true
  }));

  const standardInvalid = invalidEmails.map(email => ({
    value: email,
    description: `Invalid email: ${email}`,
    shouldPass: false,
    expectedErrors: ['Invalid email format']
  }));

  const additionalValid = customValid.map(email => ({
    value: email,
    description: `Custom valid email: ${email}`,
    shouldPass: true
  }));

  const additionalInvalid = customInvalid.map(email => ({
    value: email,
    description: `Custom invalid email: ${email}`,
    shouldPass: false,
    expectedErrors: ['Invalid email format']
  }));

  return [
    ...standardValid,
    ...standardInvalid,
    ...(includeCustom ? additionalValid : []),
    ...(includeCustom ? additionalInvalid : [])
  ];
}

/**
 * Generates a set of test cases for CPF validation
 * @param includeCustom - Whether to include custom test cases
 * @param customValid - Additional valid CPF test cases
 * @param customInvalid - Additional invalid CPF test cases
 * @returns Array of CPF validation test cases
 */
export function generateCPFTestCases(
  includeCustom = false,
  customValid: string[] = [],
  customInvalid: string[] = []
): ValidationTestCase<string>[] {
  const standardValid = validCPFs.map(cpf => ({
    value: cpf,
    description: `Valid CPF: ${cpf}`,
    shouldPass: true
  }));

  const standardInvalid = invalidCPFs.map(cpf => ({
    value: cpf,
    description: `Invalid CPF: ${cpf}`,
    shouldPass: false,
    expectedErrors: ['Invalid CPF format']
  }));

  const additionalValid = customValid.map(cpf => ({
    value: cpf,
    description: `Custom valid CPF: ${cpf}`,
    shouldPass: true
  }));

  const additionalInvalid = customInvalid.map(cpf => ({
    value: cpf,
    description: `Custom invalid CPF: ${cpf}`,
    shouldPass: false,
    expectedErrors: ['Invalid CPF format']
  }));

  return [
    ...standardValid,
    ...standardInvalid,
    ...(includeCustom ? additionalValid : []),
    ...(includeCustom ? additionalInvalid : [])
  ];
}

/**
 * Generates a set of test cases for date validation
 * @param includeCustom - Whether to include custom test cases
 * @param customValid - Additional valid date test cases
 * @param customInvalid - Additional invalid date test cases
 * @returns Array of date validation test cases
 */
export function generateDateTestCases(
  includeCustom = false,
  customValid: string[] = [],
  customInvalid: string[] = []
): ValidationTestCase<string>[] {
  const standardValid = validDates.map(date => ({
    value: date,
    description: `Valid date: ${date}`,
    shouldPass: true
  }));

  const standardInvalid = invalidDates.map(date => ({
    value: date,
    description: `Invalid date: ${date}`,
    shouldPass: false,
    expectedErrors: ['Invalid date format']
  }));

  const additionalValid = customValid.map(date => ({
    value: date,
    description: `Custom valid date: ${date}`,
    shouldPass: true
  }));

  const additionalInvalid = customInvalid.map(date => ({
    value: date,
    description: `Custom invalid date: ${date}`,
    shouldPass: false,
    expectedErrors: ['Invalid date format']
  }));

  return [
    ...standardValid,
    ...standardInvalid,
    ...(includeCustom ? additionalValid : []),
    ...(includeCustom ? additionalInvalid : [])
  ];
}

/**
 * Generates a set of test cases for URL validation
 * @param includeCustom - Whether to include custom test cases
 * @param customValid - Additional valid URL test cases
 * @param customInvalid - Additional invalid URL test cases
 * @returns Array of URL validation test cases
 */
export function generateURLTestCases(
  includeCustom = false,
  customValid: string[] = [],
  customInvalid: string[] = []
): ValidationTestCase<string>[] {
  const standardValid = [
    'https://austa.com.br',
    'http://austa.com.br/path',
    'https://sub.austa.com.br/path?query=value',
    'https://austa.com.br:8080',
    'http://localhost:3000',
    'https://192.168.1.1',
  ].map(url => ({
    value: url,
    description: `Valid URL: ${url}`,
    shouldPass: true
  }));

  const standardInvalid = [
    'not-a-url',
    'ftp://austa.com.br', // Assuming we only want http/https
    'http:/austa.com.br', // Missing slash
    'https://', // Incomplete
    'www.austa.com.br', // Missing protocol
    'javascript:alert(1)', // Potential XSS
    'data:text/html,<script>alert(1)</script>', // Data URL
  ].map(url => ({
    value: url,
    description: `Invalid URL: ${url}`,
    shouldPass: false,
    expectedErrors: ['Invalid URL format']
  }));

  const additionalValid = customValid.map(url => ({
    value: url,
    description: `Custom valid URL: ${url}`,
    shouldPass: true
  }));

  const additionalInvalid = customInvalid.map(url => ({
    value: url,
    description: `Custom invalid URL: ${url}`,
    shouldPass: false,
    expectedErrors: ['Invalid URL format']
  }));

  return [
    ...standardValid,
    ...standardInvalid,
    ...(includeCustom ? additionalValid : []),
    ...(includeCustom ? additionalInvalid : [])
  ];
}

/**
 * Generates a set of test cases for phone number validation
 * @param includeCustom - Whether to include custom test cases
 * @param customValid - Additional valid phone number test cases
 * @param customInvalid - Additional invalid phone number test cases
 * @returns Array of phone number validation test cases
 */
export function generatePhoneNumberTestCases(
  includeCustom = false,
  customValid: string[] = [],
  customInvalid: string[] = []
): ValidationTestCase<string>[] {
  // Brazilian phone number formats
  const standardValid = [
    '+55 11 98765-4321',
    '+55 (11) 98765-4321',
    '+5511987654321',
    '11 98765-4321',
    '(11) 98765-4321',
    '11987654321',
    '11 9876-54321', // Landline
    '(11) 9876-5432', // Landline
  ].map(phone => ({
    value: phone,
    description: `Valid phone number: ${phone}`,
    shouldPass: true
  }));

  const standardInvalid = [
    '987654321', // Too short
    '+55 111 98765-4321', // Invalid area code
    '+55 11 9876-4321', // Too short
    '11 9876', // Too short
    'not-a-phone',
    '+55 11 abcde-fghi',
  ].map(phone => ({
    value: phone,
    description: `Invalid phone number: ${phone}`,
    shouldPass: false,
    expectedErrors: ['Invalid phone number format']
  }));

  const additionalValid = customValid.map(phone => ({
    value: phone,
    description: `Custom valid phone number: ${phone}`,
    shouldPass: true
  }));

  const additionalInvalid = customInvalid.map(phone => ({
    value: phone,
    description: `Custom invalid phone number: ${phone}`,
    shouldPass: false,
    expectedErrors: ['Invalid phone number format']
  }));

  return [
    ...standardValid,
    ...standardInvalid,
    ...(includeCustom ? additionalValid : []),
    ...(includeCustom ? additionalInvalid : [])
  ];
}

/**
 * Generates a set of test cases for password validation
 * @param includeCustom - Whether to include custom test cases
 * @param customValid - Additional valid password test cases
 * @param customInvalid - Additional invalid password test cases
 * @returns Array of password validation test cases
 */
export function generatePasswordTestCases(
  includeCustom = false,
  customValid: string[] = [],
  customInvalid: string[] = []
): ValidationTestCase<string>[] {
  const standardValid = validPasswords.map(password => ({
    value: password,
    description: `Valid password: ${password.substring(0, 3)}...`,
    shouldPass: true
  }));

  const standardInvalid = invalidPasswords.map(password => ({
    value: password,
    description: `Invalid password: ${password.substring(0, 3)}...`,
    shouldPass: false,
    expectedErrors: ['Invalid password format']
  }));

  const additionalValid = customValid.map(password => ({
    value: password,
    description: `Custom valid password: ${password.substring(0, 3)}...`,
    shouldPass: true
  }));

  const additionalInvalid = customInvalid.map(password => ({
    value: password,
    description: `Custom invalid password: ${password.substring(0, 3)}...`,
    shouldPass: false,
    expectedErrors: ['Invalid password format']
  }));

  return [
    ...standardValid,
    ...standardInvalid,
    ...(includeCustom ? additionalValid : []),
    ...(includeCustom ? additionalInvalid : [])
  ];
}

/**
 * Generates a set of test cases for security validation (XSS, SQL injection, etc.)
 * @returns Array of security validation test cases
 */
export function generateSecurityTestCases(): ValidationTestCase<string>[] {
  return securityVectors.map(vector => ({
    value: vector.input,
    description: `Security vector (${vector.type}): ${vector.description}`,
    shouldPass: false,
    expectedErrors: ['Potential security vulnerability detected']
  }));
}

/**
 * Generates a set of test cases for numeric range validation
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Array of numeric range validation test cases
 */
export function generateNumericRangeTestCases(
  min: number,
  max: number
): ValidationTestCase<number>[] {
  return [
    // Valid cases
    {
      value: min,
      description: `Minimum boundary value: ${min}`,
      shouldPass: true
    },
    {
      value: max,
      description: `Maximum boundary value: ${max}`,
      shouldPass: true
    },
    {
      value: Math.floor((min + max) / 2),
      description: `Middle value: ${Math.floor((min + max) / 2)}`,
      shouldPass: true
    },
    // Invalid cases
    {
      value: min - 1,
      description: `Below minimum: ${min - 1}`,
      shouldPass: false,
      expectedErrors: [`Value must be at least ${min}`]
    },
    {
      value: max + 1,
      description: `Above maximum: ${max + 1}`,
      shouldPass: false,
      expectedErrors: [`Value must be at most ${max}`]
    },
    {
      value: NaN,
      description: 'Not a number: NaN',
      shouldPass: false,
      expectedErrors: ['Value must be a number']
    }
  ];
}

/**
 * Generates a set of test cases for string length validation
 * @param minLength - Minimum length (inclusive)
 * @param maxLength - Maximum length (inclusive)
 * @returns Array of string length validation test cases
 */
export function generateStringLengthTestCases(
  minLength: number,
  maxLength: number
): ValidationTestCase<string>[] {
  const generateString = (length: number): string => 'a'.repeat(length);
  
  return [
    // Valid cases
    {
      value: generateString(minLength),
      description: `Minimum length string: ${minLength} chars`,
      shouldPass: true
    },
    {
      value: generateString(maxLength),
      description: `Maximum length string: ${maxLength} chars`,
      shouldPass: true
    },
    {
      value: generateString(Math.floor((minLength + maxLength) / 2)),
      description: `Middle length string: ${Math.floor((minLength + maxLength) / 2)} chars`,
      shouldPass: true
    },
    // Invalid cases
    {
      value: generateString(minLength - 1),
      description: `Too short string: ${minLength - 1} chars`,
      shouldPass: false,
      expectedErrors: [`String must be at least ${minLength} characters long`]
    },
    {
      value: generateString(maxLength + 1),
      description: `Too long string: ${maxLength + 1} chars`,
      shouldPass: false,
      expectedErrors: [`String must be at most ${maxLength} characters long`]
    },
    {
      value: '',
      description: 'Empty string',
      shouldPass: minLength === 0,
      expectedErrors: minLength === 0 ? undefined : [`String must be at least ${minLength} characters long`]
    }
  ];
}

/**
 * Utilities for testing Zod schemas
 */

/**
 * Tests a Zod schema with a set of test cases
 * @param schema - Zod schema to test
 * @param testCases - Array of test cases
 * @returns Array of validation results
 */
export function testZodSchema<T>(
  schema: z.ZodType<T>,
  testCases: ValidationTestCase<unknown>[]
): SchemaValidationResult<T>[] {
  return testCases.map(testCase => {
    const result = schema.safeParse(testCase.value);
    return {
      success: result.success,
      value: result.success ? result.data : undefined,
      errors: !result.success ? result.error : undefined
    };
  });
}

/**
 * Asserts that a Zod schema validation result matches the expected outcome
 * @param result - Schema validation result
 * @param testCase - Test case with expected outcome
 */
export function assertZodResult<T>(
  result: SchemaValidationResult<T>,
  testCase: ValidationTestCase<unknown>
): void {
  if (testCase.shouldPass) {
    expect(result.success).toBe(true);
    expect(result.value).toBeDefined();
    expect(result.errors).toBeUndefined();
  } else {
    expect(result.success).toBe(false);
    expect(result.value).toBeUndefined();
    expect(result.errors).toBeDefined();
    
    if (testCase.expectedErrors && testCase.expectedErrors.length > 0) {
      const errorMessages = result.errors instanceof z.ZodError
        ? result.errors.errors.map(err => err.message)
        : [];
      
      testCase.expectedErrors.forEach(expectedError => {
        expect(errorMessages.some(msg => msg.includes(expectedError))).toBe(true);
      });
    }
  }
}

/**
 * Utilities for testing class-validator validations
 */

/**
 * Tests class-validator validation with a set of test cases
 * @param classType - Class type with validation decorators
 * @param testCases - Array of test cases
 * @returns Promise resolving to array of validation results
 */
export async function testClassValidation<T extends object>(
  classType: new () => T,
  testCases: ValidationTestCase<Partial<T>>[]
): Promise<SchemaValidationResult<T>[]> {
  const results: SchemaValidationResult<T>[] = [];
  
  for (const testCase of testCases) {
    const instance = plainToInstance(classType, testCase.value);
    const errors = await validate(instance);
    
    results.push({
      success: errors.length === 0,
      value: errors.length === 0 ? instance : undefined,
      errors: errors.length > 0 ? errors : undefined
    });
  }
  
  return results;
}

/**
 * Tests class-validator validation synchronously with a set of test cases
 * @param classType - Class type with validation decorators
 * @param testCases - Array of test cases
 * @returns Array of validation results
 */
export function testClassValidationSync<T extends object>(
  classType: new () => T,
  testCases: ValidationTestCase<Partial<T>>[]
): SchemaValidationResult<T>[] {
  return testCases.map(testCase => {
    const instance = plainToInstance(classType, testCase.value);
    const errors = validateSync(instance);
    
    return {
      success: errors.length === 0,
      value: errors.length === 0 ? instance : undefined,
      errors: errors.length > 0 ? errors : undefined
    };
  });
}

/**
 * Asserts that a class-validator validation result matches the expected outcome
 * @param result - Validation result
 * @param testCase - Test case with expected outcome
 */
export function assertClassValidatorResult<T>(
  result: SchemaValidationResult<T>,
  testCase: ValidationTestCase<unknown>
): void {
  if (testCase.shouldPass) {
    expect(result.success).toBe(true);
    expect(result.value).toBeDefined();
    expect(result.errors).toBeUndefined();
  } else {
    expect(result.success).toBe(false);
    expect(result.value).toBeUndefined();
    expect(result.errors).toBeDefined();
    
    if (testCase.expectedErrors && testCase.expectedErrors.length > 0 && result.errors) {
      const errorMessages = Array.isArray(result.errors)
        ? result.errors.flatMap(err => Object.values(err.constraints || {}))
        : [];
      
      testCase.expectedErrors.forEach(expectedError => {
        expect(errorMessages.some(msg => msg.includes(expectedError))).toBe(true);
      });
    }
  }
}

/**
 * General validation testing utilities
 */

/**
 * Creates a test suite for a validation function
 * @param validationFn - Function that performs validation
 * @param testCases - Array of test cases
 * @param options - Test options
 */
export function createValidationTestSuite<T>(
  validationFn: (value: T) => boolean,
  testCases: ValidationTestCase<T>[],
  options: {
    suiteName?: string;
    testNamePrefix?: string;
  } = {}
): void {
  const {
    suiteName = 'Validation function',
    testNamePrefix = 'should validate'
  } = options;
  
  describe(suiteName, () => {
    testCases.forEach(testCase => {
      test(`${testNamePrefix} ${testCase.description}`, () => {
        const result = validationFn(testCase.value);
        expect(result).toBe(testCase.shouldPass);
      });
    });
  });
}

/**
 * Creates a test suite for a validation function that returns errors
 * @param validationFn - Function that performs validation and returns errors
 * @param testCases - Array of test cases
 * @param options - Test options
 */
export function createValidationWithErrorsTestSuite<T, E>(
  validationFn: (value: T) => { isValid: boolean; errors: E[] },
  testCases: ValidationTestCase<T>[],
  options: {
    suiteName?: string;
    testNamePrefix?: string;
    errorMessageExtractor?: (error: E) => string;
  } = {}
): void {
  const {
    suiteName = 'Validation function with errors',
    testNamePrefix = 'should validate',
    errorMessageExtractor = (error: E) => String(error)
  } = options;
  
  describe(suiteName, () => {
    testCases.forEach(testCase => {
      test(`${testNamePrefix} ${testCase.description}`, () => {
        const result = validationFn(testCase.value);
        expect(result.isValid).toBe(testCase.shouldPass);
        
        if (!testCase.shouldPass && testCase.expectedErrors && testCase.expectedErrors.length > 0) {
          const errorMessages = result.errors.map(errorMessageExtractor);
          
          testCase.expectedErrors.forEach(expectedError => {
            expect(errorMessages.some(msg => msg.includes(expectedError))).toBe(true);
          });
        }
      });
    });
  });
}

/**
 * Generates a random valid value based on the validation type
 * @param type - Type of validation
 * @returns A random valid value for the specified validation type
 */
export function generateRandomValidValue(
  type: 'email' | 'cpf' | 'date' | 'url' | 'phone' | 'password'
): string {
  const getRandomItem = <T>(items: T[]): T => {
    return items[Math.floor(Math.random() * items.length)];
  };
  
  switch (type) {
    case 'email':
      return getRandomItem(validEmails);
    case 'cpf':
      return getRandomItem(validCPFs);
    case 'date':
      return getRandomItem(validDates);
    case 'url':
      return getRandomItem([
        'https://austa.com.br',
        'http://austa.com.br/path',
        'https://sub.austa.com.br/path?query=value'
      ]);
    case 'phone':
      return getRandomItem([
        '+55 11 98765-4321',
        '(11) 98765-4321',
        '11987654321'
      ]);
    case 'password':
      return getRandomItem(validPasswords);
    default:
      throw new Error(`Unsupported validation type: ${type}`);
  }
}

/**
 * Generates a random invalid value based on the validation type
 * @param type - Type of validation
 * @returns A random invalid value for the specified validation type
 */
export function generateRandomInvalidValue(
  type: 'email' | 'cpf' | 'date' | 'url' | 'phone' | 'password'
): string {
  const getRandomItem = <T>(items: T[]): T => {
    return items[Math.floor(Math.random() * items.length)];
  };
  
  switch (type) {
    case 'email':
      return getRandomItem(invalidEmails);
    case 'cpf':
      return getRandomItem(invalidCPFs);
    case 'date':
      return getRandomItem(invalidDates);
    case 'url':
      return getRandomItem([
        'not-a-url',
        'ftp://austa.com.br',
        'http:/austa.com.br',
        'javascript:alert(1)'
      ]);
    case 'phone':
      return getRandomItem([
        '987654321',
        '+55 111 98765-4321',
        'not-a-phone'
      ]);
    case 'password':
      return getRandomItem(invalidPasswords);
    default:
      throw new Error(`Unsupported validation type: ${type}`);
  }
}

/**
 * Creates a mock object with valid values for testing
 * @param template - Template object with validation types as values
 * @returns An object with random valid values based on the template
 */
export function createValidMockObject<T extends Record<string, 'email' | 'cpf' | 'date' | 'url' | 'phone' | 'password' | string | number | boolean>>(
  template: T
): { [K in keyof T]: string | number | boolean } {
  const result: Record<string, string | number | boolean> = {};
  
  for (const [key, value] of Object.entries(template)) {
    if (typeof value === 'string' && ['email', 'cpf', 'date', 'url', 'phone', 'password'].includes(value)) {
      result[key] = generateRandomValidValue(value as 'email' | 'cpf' | 'date' | 'url' | 'phone' | 'password');
    } else {
      result[key] = value;
    }
  }
  
  return result as { [K in keyof T]: string | number | boolean };
}

/**
 * Creates a mock object with invalid values for testing
 * @param template - Template object with validation types as values and keys to invalidate
 * @param keysToInvalidate - Keys from the template to make invalid
 * @returns An object with random values based on the template, with specified keys having invalid values
 */
export function createInvalidMockObject<T extends Record<string, 'email' | 'cpf' | 'date' | 'url' | 'phone' | 'password' | string | number | boolean>>(
  template: T,
  keysToInvalidate: (keyof T)[]
): { [K in keyof T]: string | number | boolean } {
  const result = createValidMockObject(template);
  
  for (const key of keysToInvalidate) {
    const validationType = template[key];
    if (typeof validationType === 'string' && ['email', 'cpf', 'date', 'url', 'phone', 'password'].includes(validationType)) {
      result[key] = generateRandomInvalidValue(validationType as 'email' | 'cpf' | 'date' | 'url' | 'phone' | 'password');
    }
  }
  
  return result;
}