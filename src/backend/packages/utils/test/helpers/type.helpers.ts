/**
 * Type Testing Helper Functions
 * 
 * This file provides helper functions for testing type utilities, including generators
 * for various data types, edge cases for type checking, and assertion utilities.
 * These helpers facilitate testing of type guards, predicates, conversion functions,
 * and type assertions across all journey services.
 */

import { AssertionError } from 'assert';

// ===== Type Guard Testing Helpers =====

/**
 * Tests a type guard function with a set of values that should pass the guard
 * @param guard The type guard function to test
 * @param validValues Array of values that should pass the guard
 */
export function testTypeGuardValid<T>(guard: (value: unknown) => value is T, validValues: unknown[]): void {
  validValues.forEach(value => {
    expect(guard(value)).toBe(true);
  });
}

/**
 * Tests a type guard function with a set of values that should fail the guard
 * @param guard The type guard function to test
 * @param invalidValues Array of values that should fail the guard
 */
export function testTypeGuardInvalid<T>(guard: (value: unknown) => value is T, invalidValues: unknown[]): void {
  invalidValues.forEach(value => {
    expect(guard(value)).toBe(false);
  });
}

/**
 * Runs comprehensive tests on a type guard function with both valid and invalid values
 * @param guard The type guard function to test
 * @param validValues Array of values that should pass the guard
 * @param invalidValues Array of values that should fail the guard
 */
export function testTypeGuard<T>(
  guard: (value: unknown) => value is T,
  validValues: unknown[],
  invalidValues: unknown[]
): void {
  testTypeGuardValid(guard, validValues);
  testTypeGuardInvalid(guard, invalidValues);
}

// ===== Type Predicate Testing Helpers =====

/**
 * Tests a type predicate function with a value and verifies both the return value and type narrowing
 * @param predicate The type predicate function to test
 * @param value The value to test with the predicate
 * @param expected The expected result of the predicate
 */
export function testTypePredicate<T>(
  predicate: (value: unknown) => value is T,
  value: unknown,
  expected: boolean
): void {
  const result = predicate(value);
  expect(result).toBe(expected);
  
  if (result) {
    // If predicate returns true, the value should be of type T
    // This is a runtime check that doesn't actually verify the TypeScript type narrowing,
    // but it's still useful for testing the predicate's runtime behavior
    const typedValue = value as T;
    expect(typedValue).toBe(value);
  }
}

/**
 * Tests a discriminated union type predicate
 * @param predicate The type predicate function to test
 * @param value The value to test with the predicate
 * @param discriminator The property name used for discrimination
 * @param expectedValue The expected value of the discriminator property
 */
export function testDiscriminatedUnionPredicate<T extends { [key: string]: unknown }>(
  predicate: (value: unknown) => value is T,
  value: unknown,
  discriminator: string,
  expectedValue: unknown
): void {
  const result = predicate(value);
  expect(result).toBe(true);
  
  if (result) {
    const typedValue = value as T;
    expect(typedValue[discriminator]).toBe(expectedValue);
  }
}

// ===== Type Conversion Testing Helpers =====

/**
 * Tests a type conversion function with a set of input/output pairs
 * @param converter The conversion function to test
 * @param testCases Array of test cases with input and expected output
 */
export function testTypeConversion<TInput, TOutput>(
  converter: (value: TInput) => TOutput,
  testCases: Array<{ input: TInput; expected: TOutput }>
): void {
  testCases.forEach(({ input, expected }) => {
    const result = converter(input);
    expect(result).toEqual(expected);
  });
}

/**
 * Tests a type conversion function with default value handling
 * @param converter The conversion function to test
 * @param invalidInputs Array of invalid inputs
 * @param defaultValue The default value that should be returned for invalid inputs
 */
export function testTypeConversionDefaults<TInput, TOutput>(
  converter: (value: TInput, defaultValue?: TOutput) => TOutput,
  invalidInputs: TInput[],
  defaultValue: TOutput
): void {
  invalidInputs.forEach(input => {
    const result = converter(input, defaultValue);
    expect(result).toEqual(defaultValue);
  });
}

/**
 * Tests that a conversion function throws an error for invalid inputs when no default is provided
 * @param converter The conversion function to test
 * @param invalidInputs Array of invalid inputs that should cause errors
 */
export function testTypeConversionErrors<TInput, TOutput>(
  converter: (value: TInput) => TOutput,
  invalidInputs: TInput[]
): void {
  invalidInputs.forEach(input => {
    expect(() => converter(input)).toThrow();
  });
}

// ===== Type Assertion Testing Helpers =====

/**
 * Tests that a type assertion function passes for valid values
 * @param assertion The assertion function to test
 * @param validValues Array of values that should pass the assertion
 */
export function testTypeAssertionValid<T>(
  assertion: (value: unknown) => asserts value is T,
  validValues: unknown[]
): void {
  validValues.forEach(value => {
    expect(() => assertion(value)).not.toThrow();
  });
}

/**
 * Tests that a type assertion function throws for invalid values
 * @param assertion The assertion function to test
 * @param invalidValues Array of values that should fail the assertion
 * @param errorType Optional expected error type
 */
export function testTypeAssertionInvalid<T>(
  assertion: (value: unknown) => asserts value is T,
  invalidValues: unknown[],
  errorType: any = Error
): void {
  invalidValues.forEach(value => {
    expect(() => assertion(value)).toThrow(errorType);
  });
}

/**
 * Tests that a type assertion function throws with specific error messages
 * @param assertion The assertion function to test
 * @param invalidValues Array of values that should fail the assertion
 * @param expectedMessages Array of expected error messages corresponding to each invalid value
 */
export function testTypeAssertionErrorMessages<T>(
  assertion: (value: unknown) => asserts value is T,
  invalidValues: unknown[],
  expectedMessages: string[]
): void {
  invalidValues.forEach((value, index) => {
    try {
      assertion(value);
      fail(`Expected assertion to throw for value: ${value}`);
    } catch (error) {
      expect(error.message).toContain(expectedMessages[index]);
    }
  });
}

/**
 * Tests the assertNever function used for exhaustive switch statements
 * @param assertNever The assertNever function to test
 * @param value A value that should trigger the assertNever function
 * @param expectedMessage The expected error message
 */
export function testAssertNever(
  assertNever: (value: never, message?: string) => never,
  value: any,
  expectedMessage?: string
): void {
  try {
    assertNever(value as never, expectedMessage);
    fail('Expected assertNever to throw');
  } catch (error) {
    if (expectedMessage) {
      expect(error.message).toContain(expectedMessage);
    }
  }
}

// ===== Data Type Generators =====

/**
 * Generates an array of primitive values for testing
 * @returns Array of primitive values (string, number, boolean, null, undefined)
 */
export function generatePrimitiveValues(): unknown[] {
  return [
    'string',
    '',
    0,
    1,
    -1,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
    true,
    false,
    null,
    undefined
  ];
}

/**
 * Generates an array of non-primitive values for testing
 * @returns Array of non-primitive values (object, array, function, date, etc.)
 */
export function generateNonPrimitiveValues(): unknown[] {
  return [
    {},
    { key: 'value' },
    [],
    [1, 2, 3],
    new Date(),
    () => {},
    function() {},
    new Map(),
    new Set(),
    new RegExp('.*'),
    Promise.resolve(),
    Symbol('symbol')
  ];
}

/**
 * Generates an array of edge case values for thorough testing
 * @returns Array of edge case values
 */
export function generateEdgeCaseValues(): unknown[] {
  return [
    NaN,
    Infinity,
    -Infinity,
    0n, // BigInt
    new Date('invalid date'),
    Object.create(null), // Object with no prototype
    /regex/,
    new Error('test error'),
    new ArrayBuffer(10),
    new Int32Array(2),
    document, // For browser environments
    global, // For Node.js environments
    class TestClass {},
    new (class {})() // Instance of anonymous class
  ];
}

/**
 * Generates a set of string values for testing string utilities
 * @returns Array of string values including edge cases
 */
export function generateStringValues(): string[] {
  return [
    '',
    'string',
    '0',
    'true',
    'false',
    'null',
    'undefined',
    '{}',
    '[]',
    ' ',
    '\n',
    '\t',
    String(Number.MAX_SAFE_INTEGER),
    String(Number.MIN_SAFE_INTEGER),
    'special chars: !@#$%^&*()'
  ];
}

/**
 * Generates a set of number values for testing number utilities
 * @returns Array of number values including edge cases
 */
export function generateNumberValues(): number[] {
  return [
    0,
    1,
    -1,
    0.5,
    -0.5,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
    Number.MAX_VALUE,
    Number.MIN_VALUE,
    Number.EPSILON,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    NaN
  ];
}

/**
 * Generates a set of boolean values for testing boolean utilities
 * @returns Array of boolean values
 */
export function generateBooleanValues(): boolean[] {
  return [true, false];
}

/**
 * Generates a set of array values for testing array utilities
 * @returns Array of arrays including edge cases
 */
export function generateArrayValues(): unknown[][] {
  return [
    [],
    [1, 2, 3],
    ['a', 'b', 'c'],
    [true, false],
    [null, undefined],
    [{}],
    [[]], // Nested array
    Array(10), // Sparse array
    new Array(5).fill(0), // Filled array
    [...generatePrimitiveValues()],
    [...generateNonPrimitiveValues()]
  ];
}

/**
 * Generates a set of object values for testing object utilities
 * @returns Array of objects including edge cases
 */
export function generateObjectValues(): object[] {
  return [
    {},
    { key: 'value' },
    { nested: { key: 'value' } },
    { array: [1, 2, 3] },
    { function: () => {} },
    { date: new Date() },
    Object.create(null), // Object with no prototype
    Object.create(Object.prototype), // Object with explicit prototype
    Object.freeze({}), // Frozen object
    Object.seal({ key: 'value' }), // Sealed object
    new (class TestClass {})(), // Class instance
    new Error('test'), // Error object
    new Map(), // Map object
    new Set() // Set object
  ];
}

/**
 * Generates a set of date values for testing date utilities
 * @returns Array of dates including edge cases
 */
export function generateDateValues(): (Date | string)[] {
  return [
    new Date(),
    new Date(0),
    new Date('2023-01-01'),
    new Date('2023-01-01T12:00:00Z'),
    new Date(Date.now()),
    new Date(8640000000000000), // Max date
    new Date(-8640000000000000), // Min date
    new Date('invalid'), // Invalid date
    '2023-01-01',
    '2023-01-01T12:00:00Z',
    'January 1, 2023',
    '01/01/2023',
    'invalid date string'
  ];
}

/**
 * Generates a set of function values for testing function utilities
 * @returns Array of functions including edge cases
 */
export function generateFunctionValues(): Function[] {
  return [
    () => {},
    function() {},
    function named() {},
    async () => {},
    async function() {},
    function* generator() {},
    class TestClass {},
    new Function('return true'),
    setTimeout,
    console.log
  ];
}

/**
 * Generates a set of promise values for testing promise utilities
 * @returns Array of promises including edge cases
 */
export function generatePromiseValues(): Promise<unknown>[] {
  return [
    Promise.resolve(),
    Promise.resolve(true),
    Promise.reject(new Error('test')).catch(() => {}),
    new Promise(resolve => setTimeout(resolve, 0)),
    new Promise((resolve, reject) => setTimeout(reject, 0)).catch(() => {}),
    (async () => true)(),
    (async () => { throw new Error('test') })().catch(() => {})
  ];
}

/**
 * Creates a mock class for testing instance type checking
 * @returns A class constructor and an instance of that class
 */
export function createMockClass(): { Class: new () => unknown; instance: unknown } {
  class MockClass {
    public property = 'value';
    public method(): void {}
  }
  
  return {
    Class: MockClass,
    instance: new MockClass()
  };
}

/**
 * Creates a mock class hierarchy for testing inheritance-based type checking
 * @returns An object containing parent and child classes and instances
 */
export function createMockClassHierarchy(): {
  Parent: new () => unknown;
  Child: new () => unknown;
  parentInstance: unknown;
  childInstance: unknown;
} {
  class Parent {
    public parentProperty = 'parent';
    public sharedMethod(): void {}
  }
  
  class Child extends Parent {
    public childProperty = 'child';
    public childMethod(): void {}
  }
  
  return {
    Parent,
    Child,
    parentInstance: new Parent(),
    childInstance: new Child()
  };
}

/**
 * Creates a discriminated union type for testing type narrowing
 * @param discriminator The property name to use for discrimination
 * @param values Array of values for the discriminator property
 * @returns An array of objects with the discriminated property
 */
export function createDiscriminatedUnion<T extends string>(
  discriminator: string,
  values: T[]
): Array<{ [key: string]: T }> {
  return values.map(value => ({ [discriminator]: value }));
}

/**
 * Creates a deep nested object for testing deep property access
 * @param depth The depth of nesting
 * @returns A deeply nested object
 */
export function createNestedObject(depth: number): object {
  let obj: any = { value: 'leaf' };
  
  for (let i = 0; i < depth; i++) {
    obj = { nested: obj };
  }
  
  return obj;
}

/**
 * Creates a circular reference object for testing circular reference handling
 * @returns An object with a circular reference
 */
export function createCircularObject(): object {
  const obj: any = { name: 'circular' };
  obj.self = obj;
  return obj;
}

/**
 * Creates a mock Error with a specific name and message
 * @param name The name of the error
 * @param message The error message
 * @returns A custom Error instance
 */
export function createCustomError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

/**
 * Creates a mock AssertionError for testing assertion failures
 * @param message The assertion error message
 * @param actual The actual value that failed the assertion
 * @param expected The expected value for the assertion
 * @returns An AssertionError instance
 */
export function createAssertionError(
  message: string,
  actual?: unknown,
  expected?: unknown
): AssertionError {
  return new AssertionError({
    message,
    actual,
    expected,
    operator: 'strictEqual'
  });
}