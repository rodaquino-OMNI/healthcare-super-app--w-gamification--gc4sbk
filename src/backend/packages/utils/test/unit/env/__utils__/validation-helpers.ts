/**
 * Validation helpers for testing environment variable validation logic
 * 
 * This file provides utilities for testing environment variable validation, including
 * schema-based validators, type conversion testers, and validation error matchers.
 */

import { z } from 'zod';
import {
  EnvironmentVariableError,
  MissingEnvironmentVariableError,
  InvalidEnvironmentVariableError,
  ValidationEnvironmentVariableError,
  TransformEnvironmentVariableError,
  BatchEnvironmentValidationError,
  EnvironmentErrorCategory
} from '../../../../src/env/error';

/**
 * Options for creating test environment variables
 */
export interface TestEnvOptions {
  /** Whether the variable should be missing */
  missing?: boolean;
  /** Whether the variable should be empty */
  empty?: boolean;
  /** Custom value for the variable */
  value?: string;
}

/**
 * Sets up a test environment variable with the given options
 * 
 * @param name - The name of the environment variable
 * @param options - Options for setting up the variable
 * @returns The current value of the variable (for assertions)
 */
export function setupTestEnv(name: string, options: TestEnvOptions = {}): string | undefined {
  if (options.missing) {
    delete process.env[name];
    return undefined;
  }
  
  if (options.empty) {
    process.env[name] = '';
    return '';
  }
  
  if (options.value !== undefined) {
    process.env[name] = options.value;
    return options.value;
  }
  
  // Default value if none specified
  process.env[name] = 'test-value';
  return 'test-value';
}

/**
 * Cleans up a test environment variable
 * 
 * @param name - The name of the environment variable to clean up
 */
export function cleanupTestEnv(name: string): void {
  delete process.env[name];
}

/**
 * Creates a test case for validating environment variables
 * 
 * @param validator - The validator function to test
 * @param validValues - Array of valid values that should pass validation
 * @param invalidValues - Array of invalid values that should fail validation
 * @param errorType - Expected error type for invalid values
 * @returns A function that runs the test cases
 */
export function createValidatorTest<T>(
  validator: (value: string) => T,
  validValues: string[],
  invalidValues: string[],
  errorType: new (...args: any[]) => Error = InvalidEnvironmentVariableError
): () => void {
  return () => {
    // Test valid values
    for (const value of validValues) {
      expect(() => validator(value)).not.toThrow();
    }
    
    // Test invalid values
    for (const value of invalidValues) {
      expect(() => validator(value)).toThrow(errorType);
    }
  };
}

/**
 * Creates a test case for validating environment variables with expected outputs
 * 
 * @param validator - The validator function to test
 * @param testCases - Array of test cases with input and expected output
 * @returns A function that runs the test cases
 */
export function createValidatorOutputTest<T>(
  validator: (value: string) => T,
  testCases: Array<{ input: string; expected: T }>
): () => void {
  return () => {
    for (const { input, expected } of testCases) {
      const result = validator(input);
      expect(result).toEqual(expected);
    }
  };
}

/**
 * Creates a mock Zod schema for testing
 * 
 * @param shouldPass - Whether validation should pass
 * @param errorMessage - Error message to return if validation fails
 * @returns A mock Zod schema
 */
export function createMockZodSchema<T>(shouldPass: boolean, errorMessage: string = 'Validation failed'): z.ZodType<T> {
  return {
    parse: jest.fn().mockImplementation((value: unknown) => {
      if (!shouldPass) {
        throw new z.ZodError([
          {
            code: 'custom',
            path: [],
            message: errorMessage
          }
        ]);
      }
      return value as T;
    }),
    safeParse: jest.fn().mockImplementation((value: unknown) => {
      if (!shouldPass) {
        return {
          success: false,
          error: new z.ZodError([
            {
              code: 'custom',
              path: [],
              message: errorMessage
            }
          ])
        };
      }
      return { success: true, data: value as T };
    })
  } as unknown as z.ZodType<T>;
}

/**
 * Creates a test case for schema-based validators
 * 
 * @param createValidator - Function that creates a validator with a schema
 * @param validSchema - Schema that should pass validation
 * @param invalidSchema - Schema that should fail validation
 * @param testValue - Value to test with the schemas
 * @returns A function that runs the test cases
 */
export function createSchemaValidatorTest<T>(
  createValidator: (schema: z.ZodType<T>) => (value: string) => T,
  validSchema: z.ZodType<T>,
  invalidSchema: z.ZodType<T>,
  testValue: string
): () => void {
  return () => {
    const validValidator = createValidator(validSchema);
    const invalidValidator = createValidator(invalidSchema);
    
    expect(() => validValidator(testValue)).not.toThrow();
    expect(() => invalidValidator(testValue)).toThrow(ValidationEnvironmentVariableError);
  };
}

/**
 * Creates a predicate-based validation test helper
 * 
 * @param predicate - The predicate function to test
 * @param validValues - Values that should satisfy the predicate
 * @param invalidValues - Values that should not satisfy the predicate
 * @returns A function that runs the test cases
 */
export function createPredicateTest(
  predicate: (value: string) => boolean,
  validValues: string[],
  invalidValues: string[]
): () => void {
  return () => {
    for (const value of validValues) {
      expect(predicate(value)).toBe(true);
    }
    
    for (const value of invalidValues) {
      expect(predicate(value)).toBe(false);
    }
  };
}

/**
 * Creates a test case for environment variable transformation
 * 
 * @param transformer - The transformation function to test
 * @param testCases - Array of test cases with input and expected output
 * @returns A function that runs the test cases
 */
export function createTransformerTest<T>(
  transformer: (value: string) => T,
  testCases: Array<{ input: string; expected: T }>
): () => void {
  return () => {
    for (const { input, expected } of testCases) {
      const result = transformer(input);
      expect(result).toEqual(expected);
    }
  };
}

/**
 * Creates a test case for environment variable transformation errors
 * 
 * @param transformer - The transformation function to test
 * @param invalidValues - Values that should cause transformation errors
 * @param errorType - Expected error type
 * @returns A function that runs the test cases
 */
export function createTransformerErrorTest<T>(
  transformer: (value: string) => T,
  invalidValues: string[],
  errorType: new (...args: any[]) => Error = TransformEnvironmentVariableError
): () => void {
  return () => {
    for (const value of invalidValues) {
      expect(() => transformer(value)).toThrow(errorType);
    }
  };
}

/**
 * Creates a test case for batch validation
 * 
 * @param batchValidator - The batch validation function to test
 * @param validConfigs - Configurations that should pass validation
 * @param invalidConfigs - Configurations that should fail validation
 * @returns A function that runs the test cases
 */
export function createBatchValidatorTest<T>(
  batchValidator: (config: Record<string, string>) => T,
  validConfigs: Record<string, string>[],
  invalidConfigs: Record<string, string>[]
): () => void {
  return () => {
    for (const config of validConfigs) {
      expect(() => batchValidator(config)).not.toThrow();
    }
    
    for (const config of invalidConfigs) {
      expect(() => batchValidator(config)).toThrow(BatchEnvironmentValidationError);
    }
  };
}

/**
 * Creates a test case for validation error messages
 * 
 * @param validator - The validator function to test
 * @param testCases - Array of test cases with input and expected error message pattern
 * @returns A function that runs the test cases
 */
export function createErrorMessageTest<T>(
  validator: (value: string) => T,
  testCases: Array<{ input: string; errorPattern: RegExp }>
): () => void {
  return () => {
    for (const { input, errorPattern } of testCases) {
      try {
        validator(input);
        fail(`Expected validator to throw for input: ${input}`);
      } catch (error) {
        expect(error.message).toMatch(errorPattern);
      }
    }
  };
}

/**
 * Creates a test case for validation error categories
 * 
 * @param validator - The validator function to test
 * @param testCases - Array of test cases with input and expected error category
 * @param categorizer - Function to categorize errors
 * @returns A function that runs the test cases
 */
export function createErrorCategoryTest<T>(
  validator: (value: string) => T,
  testCases: Array<{ input: string; category: EnvironmentErrorCategory }>,
  categorizer: (error: Error) => EnvironmentErrorCategory
): () => void {
  return () => {
    for (const { input, category } of testCases) {
      try {
        validator(input);
        fail(`Expected validator to throw for input: ${input}`);
      } catch (error) {
        const actualCategory = categorizer(error);
        expect(actualCategory).toBe(category);
      }
    }
  };
}

/**
 * Creates a mock validator function for testing
 * 
 * @param shouldPass - Whether validation should pass
 * @param returnValue - Value to return if validation passes
 * @param errorType - Type of error to throw if validation fails
 * @returns A mock validator function
 */
export function createMockValidator<T>(
  shouldPass: boolean,
  returnValue: T,
  errorType: new (name: string, message: string) => EnvironmentVariableError = InvalidEnvironmentVariableError
): (name: string) => T {
  return (name: string) => {
    if (!shouldPass) {
      throw new errorType(name, 'Validation failed');
    }
    return returnValue;
  };
}

/**
 * Creates a test case for environment variable existence
 * 
 * @param validator - The validator function to test
 * @param variableName - Name of the environment variable
 * @returns A function that runs the test cases
 */
export function createExistenceTest<T>(
  validator: () => T,
  variableName: string
): () => void {
  return () => {
    // Test with variable defined
    process.env[variableName] = 'test-value';
    expect(() => validator()).not.toThrow();
    
    // Test with variable undefined
    delete process.env[variableName];
    expect(() => validator()).toThrow(MissingEnvironmentVariableError);
    
    // Test with empty variable
    process.env[variableName] = '';
    expect(() => validator()).toThrow(MissingEnvironmentVariableError);
    
    // Clean up
    delete process.env[variableName];
  };
}

/**
 * Creates a test case for default values
 * 
 * @param validator - The validator function with default value to test
 * @param variableName - Name of the environment variable
 * @param defaultValue - Expected default value
 * @returns A function that runs the test cases
 */
export function createDefaultValueTest<T>(
  validator: () => T,
  variableName: string,
  defaultValue: T
): () => void {
  return () => {
    // Test with variable undefined
    delete process.env[variableName];
    expect(validator()).toEqual(defaultValue);
    
    // Test with variable defined
    process.env[variableName] = 'custom-value';
    expect(validator()).not.toEqual(defaultValue);
    
    // Clean up
    delete process.env[variableName];
  };
}

/**
 * Creates a Jest matcher for environment variable errors
 * 
 * @param error - The error to match against
 * @param variableName - Expected variable name in the error
 * @returns A matcher result
 */
export function toBeEnvironmentError(
  error: unknown,
  variableName: string
): jest.CustomMatcherResult {
  if (!(error instanceof EnvironmentVariableError)) {
    return {
      pass: false,
      message: () => `Expected error to be an EnvironmentVariableError, but got ${error?.constructor?.name || typeof error}`
    };
  }
  
  const hasCorrectVariable = error.variableName === variableName;
  
  return {
    pass: hasCorrectVariable,
    message: () => hasCorrectVariable
      ? `Expected error not to be for variable ${variableName}`
      : `Expected error to be for variable ${variableName}, but got ${error.variableName}`
  };
}

/**
 * Creates a Jest matcher for validation errors
 * 
 * @param error - The error to match against
 * @param errorMessages - Expected error messages in the validation error
 * @returns A matcher result
 */
export function toHaveValidationErrors(
  error: unknown,
  errorMessages: string[]
): jest.CustomMatcherResult {
  if (!(error instanceof ValidationEnvironmentVariableError)) {
    return {
      pass: false,
      message: () => `Expected error to be a ValidationEnvironmentVariableError, but got ${error?.constructor?.name || typeof error}`
    };
  }
  
  const hasAllErrors = errorMessages.every(msg => 
    error.validationErrors.some(errMsg => errMsg.includes(msg))
  );
  
  return {
    pass: hasAllErrors,
    message: () => hasAllErrors
      ? `Expected error not to have validation messages: ${errorMessages.join(', ')}`
      : `Expected error to have validation messages: ${errorMessages.join(', ')}, but got: ${error.validationErrors.join(', ')}`
  };
}

/**
 * Creates a Jest matcher for batch validation errors
 * 
 * @param error - The error to match against
 * @param errorCount - Expected number of errors in the batch
 * @returns A matcher result
 */
export function toHaveBatchErrorCount(
  error: unknown,
  errorCount: number
): jest.CustomMatcherResult {
  if (!(error instanceof BatchEnvironmentValidationError)) {
    return {
      pass: false,
      message: () => `Expected error to be a BatchEnvironmentValidationError, but got ${error?.constructor?.name || typeof error}`
    };
  }
  
  const hasCorrectCount = error.errors.length === errorCount;
  
  return {
    pass: hasCorrectCount,
    message: () => hasCorrectCount
      ? `Expected batch error not to have ${errorCount} errors`
      : `Expected batch error to have ${errorCount} errors, but got ${error.errors.length}`
  };
}

/**
 * Creates a Jest matcher for invalid value errors
 * 
 * @param error - The error to match against
 * @param invalidValue - Expected invalid value in the error
 * @returns A matcher result
 */
export function toHaveInvalidValue(
  error: unknown,
  invalidValue: string
): jest.CustomMatcherResult {
  if (!(error instanceof InvalidEnvironmentVariableError)) {
    return {
      pass: false,
      message: () => `Expected error to be an InvalidEnvironmentVariableError, but got ${error?.constructor?.name || typeof error}`
    };
  }
  
  const hasCorrectValue = error.providedValue === invalidValue;
  
  return {
    pass: hasCorrectValue,
    message: () => hasCorrectValue
      ? `Expected error not to have invalid value ${invalidValue}`
      : `Expected error to have invalid value ${invalidValue}, but got ${error.providedValue}`
  };
}

/**
 * Creates a Jest matcher for transform errors
 * 
 * @param error - The error to match against
 * @param targetType - Expected target type in the error
 * @returns A matcher result
 */
export function toHaveTransformTarget(
  error: unknown,
  targetType: string
): jest.CustomMatcherResult {
  if (!(error instanceof TransformEnvironmentVariableError)) {
    return {
      pass: false,
      message: () => `Expected error to be a TransformEnvironmentVariableError, but got ${error?.constructor?.name || typeof error}`
    };
  }
  
  const hasCorrectTarget = error.targetType === targetType;
  
  return {
    pass: hasCorrectTarget,
    message: () => hasCorrectTarget
      ? `Expected error not to have target type ${targetType}`
      : `Expected error to have target type ${targetType}, but got ${error.targetType}`
  };
}

/**
 * Extends Jest matchers with environment validation matchers
 */
export function extendJestMatchers(): void {
  expect.extend({
    toBeEnvironmentError,
    toHaveValidationErrors,
    toHaveBatchErrorCount,
    toHaveInvalidValue,
    toHaveTransformTarget
  });
}

/**
 * Type declaration for extended Jest matchers
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeEnvironmentError(variableName: string): R;
      toHaveValidationErrors(errorMessages: string[]): R;
      toHaveBatchErrorCount(errorCount: number): R;
      toHaveInvalidValue(invalidValue: string): R;
      toHaveTransformTarget(targetType: string): R;
    }
  }
}