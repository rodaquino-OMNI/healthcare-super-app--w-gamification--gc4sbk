/**
 * Validation helpers for testing environment variable validation logic.
 * 
 * This module provides utilities for testing schema-based validators, type conversion,
 * validation error patterns, and error aggregation in environment variable validation.
 */

import { z } from 'zod';
import { expect } from 'vitest';
import {
  MissingEnvironmentVariableError,
  InvalidEnvironmentVariableError,
  EnvironmentValidationError,
  EnvironmentVariableError
} from '../../../../src/env/error';
import { EnvValidator } from '../../../../src/env/types';

/**
 * Options for creating a test schema validator
 */
export interface SchemaValidatorOptions<T> {
  /** Custom error message for validation failures */
  errorMessage?: string;
  /** Default value for the schema */
  defaultValue?: T;
  /** Whether the schema should be required */
  required?: boolean;
}

/**
 * Creates a Zod schema for testing environment variable validation
 * 
 * @param baseSchema - The base Zod schema to use
 * @param options - Options for customizing the schema
 * @returns A Zod schema configured with the specified options
 * 
 * @example
 * // Create a required string schema
 * const stringSchema = createTestSchema(z.string());
 * 
 * @example
 * // Create an optional number schema with a default value
 * const numberSchema = createTestSchema(z.number(), { 
 *   required: false, 
 *   defaultValue: 3000 
 * });
 */
export function createTestSchema<T>(baseSchema: z.ZodType<T>, options?: SchemaValidatorOptions<T>): z.ZodType<T> {
  let schema = baseSchema;
  
  if (options?.required === false) {
    schema = schema.optional() as z.ZodType<T>;
    
    if (options?.defaultValue !== undefined) {
      schema = schema.default(options.defaultValue) as z.ZodType<T>;
    }
  }
  
  if (options?.errorMessage) {
    schema = schema.refine(
      () => true, // No additional validation, just for custom error message
      { message: options.errorMessage }
    );
  }
  
  return schema;
}

/**
 * Creates a mock environment variable validator function for testing
 * 
 * @param shouldPass - Whether the validator should pass or fail
 * @param errorMessage - Custom error message when validation fails
 * @returns A validator function that always returns the specified result
 * 
 * @example
 * // Create a validator that always passes
 * const alwaysValid = createMockValidator(true);
 * 
 * @example
 * // Create a validator that always fails with a custom message
 * const alwaysFails = createMockValidator(false, 'Custom validation error');
 */
export function createMockValidator<T>(shouldPass: boolean, errorMessage?: string): EnvValidator<T> {
  return (value: T): boolean => {
    if (!shouldPass) {
      throw new Error(errorMessage || 'Validation failed');
    }
    return true;
  };
}

/**
 * Creates a predicate-based validator for testing
 * 
 * @param predicate - Function that determines if a value is valid
 * @param errorMessage - Custom error message when validation fails
 * @returns A validator function that uses the predicate to determine validity
 * 
 * @example
 * // Create a validator that checks if a value is positive
 * const isPositive = createPredicateValidator(
 *   (value) => value > 0,
 *   'Value must be positive'
 * );
 */
export function createPredicateValidator<T>(
  predicate: (value: T) => boolean,
  errorMessage: string
): EnvValidator<T> {
  return (value: T): boolean => {
    if (!predicate(value)) {
      throw new Error(errorMessage);
    }
    return true;
  };
}

/**
 * Type conversion test helper that verifies a value is correctly converted
 * 
 * @param converter - Function that converts a string to the expected type
 * @param input - Input string to convert
 * @param expected - Expected output after conversion
 * 
 * @example
 * // Test that a string is correctly converted to a number
 * testTypeConversion(
 *   (value) => parseInt(value, 10),
 *   '42',
 *   42
 * );
 */
export function testTypeConversion<T>(
  converter: (value: string) => T,
  input: string,
  expected: T
): void {
  const result = converter(input);
  expect(result).toEqual(expected);
}

/**
 * Tests that a validator correctly identifies valid values
 * 
 * @param validator - Validator function to test
 * @param validValues - Array of values that should pass validation
 * 
 * @example
 * // Test that a validator accepts valid email addresses
 * testValidValues(
 *   validateEmail,
 *   ['user@example.com', 'admin@company.co.uk']
 * );
 */
export function testValidValues<T>(
  validator: (value: T) => boolean,
  validValues: T[]
): void {
  for (const value of validValues) {
    expect(() => validator(value)).not.toThrow();
    expect(validator(value)).toBe(true);
  }
}

/**
 * Tests that a validator correctly rejects invalid values
 * 
 * @param validator - Validator function to test
 * @param invalidValues - Array of values that should fail validation
 * @param errorType - Expected error type (default: Error)
 * 
 * @example
 * // Test that a validator rejects invalid email addresses
 * testInvalidValues(
 *   validateEmail,
 *   ['not-an-email', 'missing-domain@']
 * );
 */
export function testInvalidValues<T>(
  validator: (value: T) => boolean,
  invalidValues: T[],
  errorType: any = Error
): void {
  for (const value of invalidValues) {
    expect(() => validator(value)).toThrow(errorType);
  }
}

/**
 * Creates a test environment with the specified variables
 * 
 * @param variables - Object containing environment variables to set
 * @returns Function to restore the original environment
 * 
 * @example
 * // Set up test environment variables
 * const restore = setupTestEnv({
 *   API_URL: 'https://api.example.com',
 *   API_KEY: 'test-key',
 *   DEBUG: 'true'
 * });
 * 
 * // Run tests...
 * 
 * // Restore original environment
 * restore();
 */
export function setupTestEnv(variables: Record<string, string | undefined>): () => void {
  const originalEnv = { ...process.env };
  
  // Set the specified variables
  Object.entries(variables).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
  
  // Return a function to restore the original environment
  return () => {
    // Restore original environment
    process.env = originalEnv;
  };
}

/**
 * Custom Jest matchers for environment variable validation errors
 */
export const matchers = {
  /**
   * Expects a function to throw a MissingEnvironmentVariableError for the specified variable
   * 
   * @param received - Function that should throw an error
   * @param varName - Expected environment variable name
   * 
   * @example
   * // Test that a function throws a MissingEnvironmentVariableError for API_KEY
   * expect(() => validateRequiredEnv('API_KEY')).toThrowMissingEnvError('API_KEY');
   */
  toThrowMissingEnvError(received: () => any, varName: string) {
    try {
      received();
      return {
        pass: false,
        message: () => `Expected function to throw MissingEnvironmentVariableError for ${varName}, but it did not throw`
      };
    } catch (error) {
      const pass = (
        error instanceof MissingEnvironmentVariableError &&
        error.variableName === varName
      );
      
      return {
        pass,
        message: () => pass
          ? `Expected function not to throw MissingEnvironmentVariableError for ${varName}, but it did`
          : `Expected function to throw MissingEnvironmentVariableError for ${varName}, but it threw ${error}`
      };
    }
  },
  
  /**
   * Expects a function to throw an InvalidEnvironmentVariableError for the specified variable
   * 
   * @param received - Function that should throw an error
   * @param varName - Expected environment variable name
   * @param value - Expected invalid value
   * 
   * @example
   * // Test that a function throws an InvalidEnvironmentVariableError for PORT with value 'abc'
   * expect(() => validatePort('PORT')).toThrowInvalidEnvError('PORT', 'abc');
   */
  toThrowInvalidEnvError(received: () => any, varName: string, value?: string) {
    try {
      received();
      return {
        pass: false,
        message: () => `Expected function to throw InvalidEnvironmentVariableError for ${varName}, but it did not throw`
      };
    } catch (error) {
      const pass = (
        error instanceof InvalidEnvironmentVariableError &&
        error.variableName === varName &&
        (value === undefined || error.actualValue === value)
      );
      
      return {
        pass,
        message: () => pass
          ? `Expected function not to throw InvalidEnvironmentVariableError for ${varName}, but it did`
          : `Expected function to throw InvalidEnvironmentVariableError for ${varName}${value ? ` with value ${value}` : ''}, but it threw ${error}`
      };
    }
  },
  
  /**
   * Expects a function to throw an EnvironmentValidationError with the specified number of errors
   * 
   * @param received - Function that should throw an error
   * @param errorCount - Expected number of validation errors
   * 
   * @example
   * // Test that a function throws an EnvironmentValidationError with 3 errors
   * expect(() => validateBatchEnv(schema)).toThrowEnvValidationError(3);
   */
  toThrowEnvValidationError(received: () => any, errorCount?: number) {
    try {
      received();
      return {
        pass: false,
        message: () => `Expected function to throw EnvironmentValidationError, but it did not throw`
      };
    } catch (error) {
      const pass = (
        error instanceof EnvironmentValidationError &&
        (errorCount === undefined || error.errors.length === errorCount)
      );
      
      return {
        pass,
        message: () => pass
          ? `Expected function not to throw EnvironmentValidationError${errorCount ? ` with ${errorCount} errors` : ''}, but it did`
          : `Expected function to throw EnvironmentValidationError${errorCount ? ` with ${errorCount} errors` : ''}, but it threw ${error}`
      };
    }
  }
};

/**
 * Extends Jest's expect with custom environment validation matchers
 * 
 * @example
 * // In your test file:
 * import { extendExpect } from '../__utils__/validation-helpers';
 * 
 * // Extend Jest's expect
 * extendExpect();
 */
export function extendExpect(): void {
  expect.extend(matchers);
}

/**
 * Creates a mock environment validation error for testing error handling
 * 
 * @param varName - Environment variable name
 * @param message - Error message
 * @returns A new EnvironmentVariableError
 * 
 * @example
 * // Create a mock environment error
 * const error = createMockEnvError('API_KEY', 'API key is required');
 */
export function createMockEnvError(varName: string, message: string): EnvironmentVariableError {
  return new EnvironmentVariableError(varName, message);
}

/**
 * Creates a mock missing environment variable error for testing error handling
 * 
 * @param varName - Environment variable name
 * @param message - Optional custom error message
 * @returns A new MissingEnvironmentVariableError
 * 
 * @example
 * // Create a mock missing environment variable error
 * const error = createMockMissingEnvError('DATABASE_URL');
 */
export function createMockMissingEnvError(
  varName: string,
  message?: string
): MissingEnvironmentVariableError {
  return new MissingEnvironmentVariableError(varName, message);
}

/**
 * Creates a mock invalid environment variable error for testing error handling
 * 
 * @param varName - Environment variable name
 * @param reason - Reason for validation failure
 * @param value - Actual invalid value
 * @param message - Optional custom error message
 * @returns A new InvalidEnvironmentVariableError
 * 
 * @example
 * // Create a mock invalid environment variable error
 * const error = createMockInvalidEnvError(
 *   'PORT',
 *   'Expected number, got string',
 *   'abc'
 * );
 */
export function createMockInvalidEnvError(
  varName: string,
  reason: string,
  value: string | undefined,
  message?: string
): InvalidEnvironmentVariableError {
  return new InvalidEnvironmentVariableError(varName, reason, value, message);
}

/**
 * Creates a mock environment validation error with multiple nested errors
 * 
 * @param errors - Array of environment variable errors
 * @param message - Optional custom error message
 * @returns A new EnvironmentValidationError
 * 
 * @example
 * // Create a mock environment validation error with multiple errors
 * const error = createMockEnvValidationError([
 *   createMockMissingEnvError('API_KEY'),
 *   createMockInvalidEnvError('PORT', 'Expected number', 'abc')
 * ]);
 */
export function createMockEnvValidationError(
  errors: EnvironmentVariableError[],
  message?: string
): EnvironmentValidationError {
  return new EnvironmentValidationError(message, errors);
}

/**
 * Tests that an environment validator correctly handles both valid and invalid values
 * 
 * @param validator - Validator function to test
 * @param validCases - Test cases with valid values
 * @param invalidCases - Test cases with invalid values
 * 
 * @example
 * // Test a URL validator with valid and invalid cases
 * testEnvValidator(
 *   validateUrl,
 *   [
 *     { varName: 'API_URL', value: 'https://api.example.com' },
 *     { varName: 'WEB_URL', value: 'http://web.example.com' }
 *   ],
 *   [
 *     { varName: 'API_URL', value: 'not-a-url', errorType: InvalidEnvironmentVariableError },
 *     { varName: 'WEB_URL', value: undefined, errorType: MissingEnvironmentVariableError }
 *   ]
 * );
 */
export function testEnvValidator<T>(
  validator: (varName: string, ...args: any[]) => T,
  validCases: Array<{ varName: string, value: string, expected?: T, args?: any[] }>,
  invalidCases: Array<{ varName: string, value: string | undefined, errorType: any, args?: any[] }>
): void {
  // Test valid cases
  for (const { varName, value, expected, args = [] } of validCases) {
    const restore = setupTestEnv({ [varName]: value });
    try {
      const result = validator(varName, ...args);
      if (expected !== undefined) {
        expect(result).toEqual(expected);
      }
    } finally {
      restore();
    }
  }
  
  // Test invalid cases
  for (const { varName, value, errorType, args = [] } of invalidCases) {
    const restore = setupTestEnv({ [varName]: value });
    try {
      expect(() => validator(varName, ...args)).toThrow(errorType);
    } finally {
      restore();
    }
  }
}

/**
 * Tests that a batch environment validator correctly handles valid and invalid configurations
 * 
 * @param validator - Batch validator function to test
 * @param validConfigs - Test cases with valid configurations
 * @param invalidConfigs - Test cases with invalid configurations
 * 
 * @example
 * // Test a batch validator with valid and invalid configurations
 * testBatchEnvValidator(
 *   validateBatchEnv,
 *   [
 *     {
 *       env: { API_URL: 'https://api.example.com', API_KEY: 'test-key' },
 *       schema: { API_URL: z.string().url(), API_KEY: z.string() },
 *       expected: { API_URL: 'https://api.example.com', API_KEY: 'test-key' }
 *     }
 *   ],
 *   [
 *     {
 *       env: { API_URL: 'not-a-url', API_KEY: undefined },
 *       schema: { API_URL: z.string().url(), API_KEY: z.string() },
 *       errorType: EnvironmentValidationError,
 *       errorCount: 2
 *     }
 *   ]
 * );
 */
export function testBatchEnvValidator<T>(
  validator: (schema: any, ...args: any[]) => T,
  validConfigs: Array<{ env: Record<string, string | undefined>, schema: any, expected: T, args?: any[] }>,
  invalidConfigs: Array<{ env: Record<string, string | undefined>, schema: any, errorType: any, errorCount?: number, args?: any[] }>
): void {
  // Test valid configurations
  for (const { env, schema, expected, args = [] } of validConfigs) {
    const restore = setupTestEnv(env);
    try {
      const result = validator(schema, ...args);
      expect(result).toEqual(expected);
    } finally {
      restore();
    }
  }
  
  // Test invalid configurations
  for (const { env, schema, errorType, errorCount, args = [] } of invalidConfigs) {
    const restore = setupTestEnv(env);
    try {
      expect(() => validator(schema, ...args)).toThrow(errorType);
      
      if (errorCount !== undefined) {
        try {
          validator(schema, ...args);
        } catch (error) {
          if (error instanceof EnvironmentValidationError) {
            expect(error.errors).toHaveLength(errorCount);
          }
        }
      }
    } finally {
      restore();
    }
  }
}