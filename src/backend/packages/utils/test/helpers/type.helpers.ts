/**
 * Type Test Helpers
 * 
 * Provides test helper functions for type utilities, including generators for various data types,
 * edge cases for type checking, and assertion utilities. These helpers facilitate testing of
 * type guards, predicates, conversion functions, and type assertions across all journey services.
 */

// ===== Type Generators =====

/**
 * Generates a collection of primitive values for testing type utilities
 * @returns An object containing various primitive values
 */
export const generatePrimitiveValues = () => ({
  // String values
  string: 'test string',
  emptyString: '',
  stringWithSpaces: '   ',
  
  // Number values
  number: 42,
  zero: 0,
  negativeNumber: -1,
  float: 3.14,
  maxNumber: Number.MAX_SAFE_INTEGER,
  minNumber: Number.MIN_SAFE_INTEGER,
  infinity: Infinity,
  negativeInfinity: -Infinity,
  nan: NaN,
  
  // Boolean values
  trueBoolean: true,
  falseBoolean: false,
  
  // Special values
  nullValue: null,
  undefinedValue: undefined,
});

/**
 * Generates a collection of compound values for testing type utilities
 * @returns An object containing various compound values
 */
export const generateCompoundValues = () => ({
  // Array values
  emptyArray: [],
  numberArray: [1, 2, 3],
  stringArray: ['a', 'b', 'c'],
  mixedArray: [1, 'a', true, null],
  nestedArray: [1, [2, 3], [4, [5, 6]]],
  
  // Object values
  emptyObject: {},
  simpleObject: { a: 1, b: 2 },
  nestedObject: { a: 1, b: { c: 2, d: { e: 3 } } },
  objectWithArray: { a: 1, b: [1, 2, 3] },
  objectWithNull: { a: 1, b: null },
  objectWithUndefined: { a: 1, b: undefined },
  
  // Function values
  arrowFunction: () => {},
  functionExpression: function() {},
  asyncFunction: async () => {},
  generatorFunction: function* () {},
  
  // Date values
  date: new Date(),
  invalidDate: new Date('invalid date'),
  
  // Promise values
  promise: Promise.resolve(1),
  rejectedPromise: Promise.reject(new Error('test error')).catch(() => {}),
});

/**
 * Generates a collection of edge case values for testing type utilities
 * @returns An object containing various edge case values
 */
export const generateEdgeCaseValues = () => ({
  // Empty values
  emptyString: '',
  emptyArray: [],
  emptyObject: {},
  
  // Falsy values
  zero: 0,
  falseBoolean: false,
  nullValue: null,
  undefinedValue: undefined,
  nan: NaN,
  
  // Special strings
  whitespaceString: '   ',
  zeroString: '0',
  numericString: '123',
  booleanString: 'true',
  jsonString: '{"a":1}',
  
  // Special numbers
  infinity: Infinity,
  negativeInfinity: -Infinity,
  minNumber: Number.MIN_SAFE_INTEGER,
  maxNumber: Number.MAX_SAFE_INTEGER,
  epsilon: Number.EPSILON,
  
  // Special objects
  objectWithToString: { toString: () => 'custom string' },
  objectWithValueOf: { valueOf: () => 42 },
  objectWithBoth: { toString: () => 'custom string', valueOf: () => 42 },
});

/**
 * Generates a random string of specified length
 * @param length The length of the string to generate
 * @returns A random string
 */
export const generateRandomString = (length = 10): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Generates a random number within the specified range
 * @param min The minimum value (inclusive)
 * @param max The maximum value (inclusive)
 * @returns A random number
 */
export const generateRandomNumber = (min = 0, max = 100): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generates a random boolean value
 * @returns A random boolean
 */
export const generateRandomBoolean = (): boolean => {
  return Math.random() >= 0.5;
};

/**
 * Generates a random array of specified length with elements of the specified type
 * @param generator A function that generates elements for the array
 * @param length The length of the array to generate
 * @returns A random array
 */
export const generateRandomArray = <T>(generator: () => T, length = 5): T[] => {
  return Array.from({ length }, () => generator());
};

/**
 * Generates a random object with specified keys and value generators
 * @param schema An object mapping keys to generator functions
 * @returns A random object
 */
export const generateRandomObject = <T extends Record<string, any>>(
  schema: { [K in keyof T]: () => T[K] }
): T => {
  const result: Record<string, any> = {};
  for (const key in schema) {
    result[key] = schema[key]();
  }
  return result as T;
};

/**
 * Generates a random date within the specified range
 * @param start The start date
 * @param end The end date
 * @returns A random date
 */
export const generateRandomDate = (start = new Date(2000, 0, 1), end = new Date()): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// ===== Type Guard Testing Utilities =====

/**
 * Tests a type guard function with various inputs and verifies the results
 * @param guard The type guard function to test
 * @param validValues Values that should pass the type guard
 * @param invalidValues Values that should fail the type guard
 * @returns An object with the test results
 */
export const testTypeGuard = <T>(
  guard: (value: any) => value is T,
  validValues: any[],
  invalidValues: any[]
): { passed: boolean; failures: { value: any; expected: boolean; actual: boolean }[] } => {
  const failures: { value: any; expected: boolean; actual: boolean }[] = [];
  
  // Test valid values
  for (const value of validValues) {
    const result = guard(value);
    if (!result) {
      failures.push({ value, expected: true, actual: result });
    }
  }
  
  // Test invalid values
  for (const value of invalidValues) {
    const result = guard(value);
    if (result) {
      failures.push({ value, expected: false, actual: result });
    }
  }
  
  return {
    passed: failures.length === 0,
    failures,
  };
};

/**
 * Creates a test suite for a type guard function
 * @param guard The type guard function to test
 * @param validValues Values that should pass the type guard
 * @param invalidValues Values that should fail the type guard
 * @returns A function that runs the tests using Jest
 */
export const createTypeGuardTestSuite = <T>(
  guard: (value: any) => value is T,
  validValues: any[],
  invalidValues: any[]
) => {
  return () => {
    describe('valid values', () => {
      validValues.forEach((value, index) => {
        it(`should return true for valid value #${index}`, () => {
          expect(guard(value)).toBe(true);
        });
      });
    });
    
    describe('invalid values', () => {
      invalidValues.forEach((value, index) => {
        it(`should return false for invalid value #${index}`, () => {
          expect(guard(value)).toBe(false);
        });
      });
    });
  };
};

// ===== Type Predicate Testing Utilities =====

/**
 * Tests a type predicate function and verifies that it correctly narrows types
 * @param predicate The type predicate function to test
 * @param value The value to test
 * @param callback A callback function that uses the narrowed type
 * @returns The result of the callback function
 */
export const testTypePredicate = <T, R>(
  predicate: (value: any) => value is T,
  value: any,
  callback: (narrowedValue: T) => R
): R | undefined => {
  if (predicate(value)) {
    // Type is narrowed to T here
    return callback(value);
  }
  return undefined;
};

/**
 * Tests a discriminated union type predicate
 * @param discriminator The property name used for discrimination
 * @param value The value to test
 * @param discriminatorValue The expected value of the discriminator property
 * @param callback A callback function that uses the narrowed type
 * @returns The result of the callback function
 */
export const testDiscriminatedUnion = <T extends { [K in D]: V }, D extends keyof T, V extends T[D], R>(
  discriminator: D,
  value: any,
  discriminatorValue: V,
  callback: (narrowedValue: T & { [K in D]: V }) => R
): R | undefined => {
  if (value && typeof value === 'object' && value[discriminator] === discriminatorValue) {
    // Type is narrowed to T & { [K in D]: V } here
    return callback(value as T & { [K in D]: V });
  }
  return undefined;
};

// ===== Type Conversion Testing Utilities =====

/**
 * Tests a type conversion function with various inputs and verifies the results
 * @param converter The conversion function to test
 * @param testCases An array of test cases with input, expected output, and optional description
 * @returns An object with the test results
 */
export const testTypeConversion = <T, U>(
  converter: (value: T, ...args: any[]) => U,
  testCases: Array<{ input: T; args?: any[]; expected: U; description?: string }>
): { passed: boolean; failures: { input: T; args?: any[]; expected: U; actual: U; description?: string }[] } => {
  const failures: { input: T; args?: any[]; expected: U; actual: U; description?: string }[] = [];
  
  for (const testCase of testCases) {
    const { input, args = [], expected, description } = testCase;
    const actual = converter(input, ...args);
    
    // Check if the result matches the expected value
    // Note: This uses a simple equality check, which may not work for all types
    // For complex objects or special values like NaN, custom comparison logic may be needed
    const isEqual = expected === actual || 
      (Number.isNaN(expected) && Number.isNaN(actual)) ||
      (expected instanceof Date && actual instanceof Date && expected.getTime() === actual.getTime());
    
    if (!isEqual) {
      failures.push({ input, args, expected, actual, description });
    }
  }
  
  return {
    passed: failures.length === 0,
    failures,
  };
};

/**
 * Creates a test suite for a type conversion function
 * @param converter The conversion function to test
 * @param testCases An array of test cases with input, expected output, and optional description
 * @returns A function that runs the tests using Jest
 */
export const createTypeConversionTestSuite = <T, U>(
  converter: (value: T, ...args: any[]) => U,
  testCases: Array<{ input: T; args?: any[]; expected: U; description?: string }>
) => {
  return () => {
    testCases.forEach((testCase, index) => {
      const { input, args = [], expected, description } = testCase;
      const testName = description || `should correctly convert test case #${index}`;
      
      it(testName, () => {
        const actual = converter(input, ...args);
        
        // Handle special cases for comparison
        if (Number.isNaN(expected)) {
          expect(Number.isNaN(actual)).toBe(true);
        } else if (expected instanceof Date && actual instanceof Date) {
          expect(actual.getTime()).toBe(expected.getTime());
        } else {
          expect(actual).toEqual(expected);
        }
      });
    });
  };
};

// ===== Type Assertion Testing Utilities =====

/**
 * Tests an assertion function and verifies that it throws the expected error for invalid inputs
 * @param assertion The assertion function to test
 * @param validValues Values that should pass the assertion
 * @param invalidValues Values that should fail the assertion
 * @param errorType The expected error type (optional)
 * @returns An object with the test results
 */
export const testTypeAssertion = (
  assertion: (value: any, ...args: any[]) => void,
  validValues: Array<{ value: any; args?: any[] }>,
  invalidValues: Array<{ value: any; args?: any[] }>,
  errorType?: new (...args: any[]) => Error
): { passed: boolean; failures: { value: any; args?: any[]; expected: string; actual: string }[] } => {
  const failures: { value: any; args?: any[]; expected: string; actual: string }[] = [];
  
  // Test valid values (should not throw)
  for (const { value, args = [] } of validValues) {
    try {
      assertion(value, ...args);
    } catch (error) {
      failures.push({ 
        value, 
        args, 
        expected: 'no error', 
        actual: error instanceof Error ? error.message : String(error) 
      });
    }
  }
  
  // Test invalid values (should throw)
  for (const { value, args = [] } of invalidValues) {
    try {
      assertion(value, ...args);
      // If we get here, the assertion didn't throw
      failures.push({ value, args, expected: 'error', actual: 'no error' });
    } catch (error) {
      // Check if the error is of the expected type
      if (errorType && !(error instanceof errorType)) {
        failures.push({ 
          value, 
          args, 
          expected: errorType.name, 
          actual: error instanceof Error ? error.constructor.name : typeof error 
        });
      }
    }
  }
  
  return {
    passed: failures.length === 0,
    failures,
  };
};

/**
 * Creates a test suite for an assertion function
 * @param assertion The assertion function to test
 * @param validValues Values that should pass the assertion
 * @param invalidValues Values that should fail the assertion
 * @param errorType The expected error type (optional)
 * @returns A function that runs the tests using Jest
 */
export const createTypeAssertionTestSuite = (
  assertion: (value: any, ...args: any[]) => void,
  validValues: Array<{ value: any; args?: any[]; description?: string }>,
  invalidValues: Array<{ value: any; args?: any[]; description?: string }>,
  errorType?: new (...args: any[]) => Error
) => {
  return () => {
    describe('valid values', () => {
      validValues.forEach((testCase, index) => {
        const { value, args = [], description } = testCase;
        const testName = description || `should not throw for valid value #${index}`;
        
        it(testName, () => {
          expect(() => assertion(value, ...args)).not.toThrow();
        });
      });
    });
    
    describe('invalid values', () => {
      invalidValues.forEach((testCase, index) => {
        const { value, args = [], description } = testCase;
        const testName = description || `should throw for invalid value #${index}`;
        
        it(testName, () => {
          if (errorType) {
            expect(() => assertion(value, ...args)).toThrow(errorType);
          } else {
            expect(() => assertion(value, ...args)).toThrow();
          }
        });
      });
    });
  };
};

/**
 * Tests the assertNever function for exhaustive switch statements
 * @param assertion The assertNever function to test
 * @param value The value to pass to assertNever
 * @param errorMessage The expected error message (optional)
 * @returns A function that runs the test
 */
export const testAssertNever = (
  assertion: (value: never, message?: string) => never,
  value: any,
  errorMessage?: string
) => {
  return () => {
    expect(() => assertion(value as never, errorMessage)).toThrow();
  };
};

// ===== Mock Class for Testing =====

/**
 * A mock class for testing instance type checking
 */
export class MockClass {
  constructor(public value: any) {}
}

/**
 * A mock subclass for testing inheritance type checking
 */
export class MockSubclass extends MockClass {
  constructor(value: any, public extra: any) {
    super(value);
  }
}

/**
 * A mock interface for testing structural typing
 */
export interface MockInterface {
  value: any;
}

/**
 * Creates a mock object that implements the MockInterface
 * @param value The value to assign to the object
 * @returns A mock object
 */
export const createMockObject = (value: any): MockInterface => {
  return { value };
};