/**
 * Test fixtures for type conversion utility functions.
 * Provides a comprehensive set of test cases for validating the behavior of
 * conversion utilities that transform values between different types.
 *
 * These fixtures include valid inputs, edge cases, and invalid inputs to ensure
 * robust error handling during type conversions across all journey services.
 */

/**
 * Interface for string conversion test cases
 */
export interface StringConversionFixture {
  input: any;
  expected: string;
  description: string;
  defaultValue?: string;
}

/**
 * Interface for number conversion test cases
 */
export interface NumberConversionFixture {
  input: any;
  expected: number;
  description: string;
  defaultValue?: number;
}

/**
 * Interface for boolean conversion test cases
 */
export interface BooleanConversionFixture {
  input: any;
  expected: boolean;
  description: string;
  defaultValue?: boolean;
}

/**
 * Interface for date conversion test cases
 */
export interface DateConversionFixture {
  input: any;
  expected: Date | null;
  description: string;
  defaultValue?: Date | null;
}

/**
 * Interface for array conversion test cases
 */
export interface ArrayConversionFixture<T> {
  input: any;
  expected: T[];
  description: string;
  defaultValue?: T[];
}

/**
 * Interface for object conversion test cases
 */
export interface ObjectConversionFixture<T extends object> {
  input: any;
  expected: T;
  description: string;
  defaultValue?: T;
}

/**
 * Interface for Map conversion test cases
 */
export interface MapConversionFixture<K, V> {
  input: any;
  expected: Map<K, V>;
  description: string;
  defaultValue?: Map<K, V>;
}

/**
 * Interface for Set conversion test cases
 */
export interface SetConversionFixture<T> {
  input: any;
  expected: Set<T>;
  description: string;
  defaultValue?: Set<T>;
}

/**
 * Interface for Enum conversion test cases
 */
export interface EnumConversionFixture<T> {
  input: any;
  enumObject: any;
  expected: T;
  description: string;
  defaultValue: T;
}

/**
 * Interface for URL conversion test cases
 */
export interface URLConversionFixture {
  input: any;
  expected: URL | null;
  description: string;
  defaultValue?: URL | null;
}

/**
 * Interface for journey-specific format conversion test cases
 */
export interface JourneyFormatConversionFixture<T> {
  input: any;
  journeyId: string;
  type: string;
  expected: T;
  description: string;
  defaultValue: T;
}

/**
 * Interface for retry conversion test cases
 */
export interface RetryConversionFixture<T, U> {
  input: T;
  conversionFn: (val: T) => Promise<U>;
  expected: U;
  description: string;
  defaultValue: U;
  maxRetries?: number;
  delayMs?: number;
}

/**
 * Interface for optimistic lock conversion test cases
 */
export interface OptimisticLockFixture<T, U> {
  input: T;
  conversionFn: (val: T) => Promise<U>;
  versionFn: (val: T) => Promise<number>;
  updateFn: (val: U, version: number) => Promise<boolean>;
  expected: U;
  description: string;
  defaultValue: U;
  maxRetries?: number;
}

/**
 * Interface for circuit breaker conversion test cases
 */
export interface CircuitBreakerFixture<T, U> {
  input: T;
  conversionFn: (val: T) => Promise<U>;
  expected: U;
  description: string;
  defaultValue: U;
  options?: {
    failureThreshold: number;
    resetTimeout: number;
    fallbackFn?: (val: T) => Promise<U>;
  };
}

/**
 * Test fixtures for string conversion
 */
export const STRING_CONVERSION_FIXTURES: StringConversionFixture[] = [
  // Valid inputs
  {
    input: 'hello world',
    expected: 'hello world',
    description: 'String input should return the same string'
  },
  {
    input: 123,
    expected: '123',
    description: 'Number input should be converted to string'
  },
  {
    input: true,
    expected: 'true',
    description: 'Boolean true should be converted to "true"'
  },
  {
    input: false,
    expected: 'false',
    description: 'Boolean false should be converted to "false"'
  },
  {
    input: new Date('2023-01-01T00:00:00.000Z'),
    expected: '2023-01-01T00:00:00.000Z',
    description: 'Date should be converted to ISO string'
  },
  {
    input: [1, 2, 3],
    expected: '[1,2,3]',
    description: 'Array should be converted to JSON string'
  },
  {
    input: { a: 1, b: 2 },
    expected: '{"a":1,"b":2}',
    description: 'Object should be converted to JSON string'
  },
  
  // Edge cases
  {
    input: '',
    expected: '',
    description: 'Empty string should remain empty string'
  },
  {
    input: 0,
    expected: '0',
    description: 'Zero should be converted to "0"'
  },
  {
    input: NaN,
    expected: 'NaN',
    description: 'NaN should be converted to "NaN"'
  },
  {
    input: Infinity,
    expected: 'Infinity',
    description: 'Infinity should be converted to "Infinity"'
  },
  {
    input: -Infinity,
    expected: '-Infinity',
    description: 'Negative Infinity should be converted to "-Infinity"'
  },
  
  // Null/undefined handling
  {
    input: null,
    expected: '',
    description: 'Null should return empty string by default'
  },
  {
    input: undefined,
    expected: '',
    description: 'Undefined should return empty string by default'
  },
  {
    input: null,
    expected: 'N/A',
    defaultValue: 'N/A',
    description: 'Null should return custom default value when provided'
  },
  
  // Complex objects
  {
    input: new Map([['a', 1], ['b', 2]]),
    expected: '{"a":1,"b":2}',
    description: 'Map should be converted to JSON string'
  },
  {
    input: new Set([1, 2, 3]),
    expected: '[1,2,3]',
    description: 'Set should be converted to JSON string'
  },
  
  // Error cases
  {
    input: Symbol('test'),
    expected: '',
    description: 'Symbol should return empty string as it cannot be converted'
  },
  {
    input: () => {},
    expected: '',
    description: 'Function should return empty string as it cannot be properly converted'
  },
  {
    input: { toJSON: () => { throw new Error('JSON error'); } },
    expected: '',
    description: 'Object with failing toJSON should return empty string'
  },
  {
    input: { toJSON: () => { throw new Error('JSON error'); } },
    expected: 'ERROR',
    defaultValue: 'ERROR',
    description: 'Object with failing toJSON should return custom default value when provided'
  }
];

/**
 * Test fixtures for number conversion
 */
export const NUMBER_CONVERSION_FIXTURES: NumberConversionFixture[] = [
  // Valid inputs
  {
    input: 123,
    expected: 123,
    description: 'Number input should return the same number'
  },
  {
    input: '456',
    expected: 456,
    description: 'Numeric string should be converted to number'
  },
  {
    input: '123.45',
    expected: 123.45,
    description: 'Decimal string should be converted to float'
  },
  {
    input: true,
    expected: 1,
    description: 'Boolean true should be converted to 1'
  },
  {
    input: false,
    expected: 0,
    description: 'Boolean false should be converted to 0'
  },
  {
    input: new Date('2023-01-01T00:00:00.000Z'),
    expected: 1672531200000,
    description: 'Date should be converted to timestamp'
  },
  
  // Edge cases
  {
    input: 0,
    expected: 0,
    description: 'Zero should remain zero'
  },
  {
    input: '',
    expected: 0,
    description: 'Empty string should return 0 by default'
  },
  {
    input: ' ',
    expected: 0,
    description: 'Whitespace string should return 0 by default'
  },
  {
    input: '0',
    expected: 0,
    description: 'String "0" should be converted to 0'
  },
  {
    input: '0.0',
    expected: 0,
    description: 'String "0.0" should be converted to 0'
  },
  {
    input: '-0',
    expected: 0,
    description: 'String "-0" should be converted to 0'
  },
  
  // Invalid inputs
  {
    input: 'abc',
    expected: 0,
    description: 'Non-numeric string should return 0 by default'
  },
  {
    input: 'abc',
    expected: -1,
    defaultValue: -1,
    description: 'Non-numeric string should return custom default value when provided'
  },
  {
    input: '123abc',
    expected: 0,
    description: 'Partially numeric string should return 0 by default'
  },
  {
    input: NaN,
    expected: 0,
    description: 'NaN should return 0 by default'
  },
  {
    input: Infinity,
    expected: Infinity,
    description: 'Infinity should remain Infinity'
  },
  {
    input: -Infinity,
    expected: -Infinity,
    description: 'Negative Infinity should remain -Infinity'
  },
  
  // Null/undefined handling
  {
    input: null,
    expected: 0,
    description: 'Null should return 0 by default'
  },
  {
    input: undefined,
    expected: 0,
    description: 'Undefined should return 0 by default'
  },
  {
    input: null,
    expected: -999,
    defaultValue: -999,
    description: 'Null should return custom default value when provided'
  },
  
  // Complex objects
  {
    input: [1, 2, 3],
    expected: 0,
    description: 'Array should return 0 by default'
  },
  {
    input: { a: 1 },
    expected: 0,
    description: 'Object should return 0 by default'
  },
  {
    input: { valueOf: () => 42 },
    expected: 42,
    description: 'Object with valueOf should use that value'
  },
  {
    input: { valueOf: () => 'invalid' },
    expected: 0,
    description: 'Object with invalid valueOf should return 0 by default'
  }
];

/**
 * Test fixtures for integer conversion
 */
export const INTEGER_CONVERSION_FIXTURES: NumberConversionFixture[] = [
  // Valid inputs
  {
    input: 123,
    expected: 123,
    description: 'Integer input should return the same integer'
  },
  {
    input: 123.45,
    expected: 123,
    description: 'Float input should be floored to integer'
  },
  {
    input: 123.99,
    expected: 123,
    description: 'Float input close to next integer should still be floored'
  },
  {
    input: '456',
    expected: 456,
    description: 'Numeric string should be converted to integer'
  },
  {
    input: '123.45',
    expected: 123,
    description: 'Decimal string should be floored to integer'
  },
  {
    input: '-123.45',
    expected: -124,
    description: 'Negative decimal should be floored (not truncated)'
  },
  
  // Edge cases
  {
    input: 0,
    expected: 0,
    description: 'Zero should remain zero'
  },
  {
    input: 0.1,
    expected: 0,
    description: 'Decimal less than 1 should be floored to 0'
  },
  {
    input: 0.9,
    expected: 0,
    description: 'Decimal less than 1 should be floored to 0 even if close to 1'
  },
  {
    input: -0.1,
    expected: -1,
    description: 'Negative decimal should be floored to -1'
  },
  
  // Invalid inputs
  {
    input: 'abc',
    expected: 0,
    description: 'Non-numeric string should return 0 by default'
  },
  {
    input: NaN,
    expected: 0,
    description: 'NaN should return 0 by default'
  },
  
  // Null/undefined handling
  {
    input: null,
    expected: 0,
    description: 'Null should return 0 by default'
  },
  {
    input: undefined,
    expected: 0,
    description: 'Undefined should return 0 by default'
  },
  {
    input: null,
    expected: -1,
    defaultValue: -1,
    description: 'Null should return custom default value when provided'
  }
];

/**
 * Test fixtures for float conversion
 */
export const FLOAT_CONVERSION_FIXTURES: NumberConversionFixture[] = [
  // Valid inputs
  {
    input: 123.45,
    expected: 123.45,
    description: 'Float input should return the same float'
  },
  {
    input: 123,
    expected: 123,
    description: 'Integer input should be converted to float'
  },
  {
    input: '456.78',
    expected: 456.78,
    description: 'Numeric string should be converted to float'
  },
  
  // With precision
  {
    input: 123.456,
    expected: 123.46,
    description: 'Float with precision 2 should round correctly',
    // Note: In actual test, precision would be passed as a separate parameter
  },
  {
    input: 123.454,
    expected: 123.45,
    description: 'Float with precision 2 should round down correctly',
    // Note: In actual test, precision would be passed as a separate parameter
  },
  
  // Edge cases
  {
    input: 0.1 + 0.2, // JavaScript floating point issue (equals 0.30000000000000004)
    expected: 0.3,
    description: 'Float with precision 1 should handle JS floating point issues',
    // Note: In actual test, precision would be passed as a separate parameter
  },
  
  // Invalid inputs
  {
    input: 'abc',
    expected: 0,
    description: 'Non-numeric string should return 0 by default'
  },
  {
    input: NaN,
    expected: 0,
    description: 'NaN should return 0 by default'
  },
  
  // Null/undefined handling
  {
    input: null,
    expected: 0,
    description: 'Null should return 0 by default'
  },
  {
    input: undefined,
    expected: 0,
    description: 'Undefined should return 0 by default'
  },
  {
    input: null,
    expected: -1.5,
    defaultValue: -1.5,
    description: 'Null should return custom default value when provided'
  }
];

/**
 * Test fixtures for boolean conversion
 */
export const BOOLEAN_CONVERSION_FIXTURES: BooleanConversionFixture[] = [
  // Valid inputs
  {
    input: true,
    expected: true,
    description: 'Boolean true should remain true'
  },
  {
    input: false,
    expected: false,
    description: 'Boolean false should remain false'
  },
  {
    input: 1,
    expected: true,
    description: 'Number 1 should convert to true'
  },
  {
    input: 0,
    expected: false,
    description: 'Number 0 should convert to false'
  },
  {
    input: -1,
    expected: true,
    description: 'Negative number should convert to true'
  },
  
  // String representations
  {
    input: 'true',
    expected: true,
    description: 'String "true" should convert to true'
  },
  {
    input: 'false',
    expected: false,
    description: 'String "false" should convert to false'
  },
  {
    input: 'yes',
    expected: true,
    description: 'String "yes" should convert to true'
  },
  {
    input: 'no',
    expected: false,
    description: 'String "no" should convert to false'
  },
  {
    input: 'y',
    expected: true,
    description: 'String "y" should convert to true'
  },
  {
    input: 'n',
    expected: false,
    description: 'String "n" should convert to false'
  },
  {
    input: '1',
    expected: true,
    description: 'String "1" should convert to true'
  },
  {
    input: '0',
    expected: false,
    description: 'String "0" should convert to false'
  },
  {
    input: 'sim',
    expected: true,
    description: 'Portuguese "sim" should convert to true'
  },
  {
    input: 'não',
    expected: false,
    description: 'Portuguese "não" should convert to false'
  },
  {
    input: 'nao',
    expected: false,
    description: 'Portuguese "nao" (without accent) should convert to false'
  },
  
  // Case insensitivity
  {
    input: 'TRUE',
    expected: true,
    description: 'Uppercase "TRUE" should convert to true'
  },
  {
    input: 'False',
    expected: false,
    description: 'Mixed case "False" should convert to false'
  },
  {
    input: ' yes ',
    expected: true,
    description: 'String with whitespace should be trimmed and convert to true'
  },
  
  // Invalid string values
  {
    input: 'maybe',
    expected: false,
    description: 'Invalid string should return false by default'
  },
  {
    input: 'maybe',
    expected: true,
    defaultValue: true,
    description: 'Invalid string should return custom default value when provided'
  },
  
  // Null/undefined handling
  {
    input: null,
    expected: false,
    description: 'Null should return false by default'
  },
  {
    input: undefined,
    expected: false,
    description: 'Undefined should return false by default'
  },
  {
    input: null,
    expected: true,
    defaultValue: true,
    description: 'Null should return custom default value when provided'
  },
  
  // Empty values
  {
    input: '',
    expected: false,
    description: 'Empty string should return false by default'
  },
  {
    input: ' ',
    expected: false,
    description: 'Whitespace string should return false by default'
  },
  
  // Object values
  {
    input: {},
    expected: true,
    description: 'Empty object should convert to true'
  },
  {
    input: { a: 1 },
    expected: true,
    description: 'Non-empty object should convert to true'
  },
  
  // Array values
  {
    input: [],
    expected: true,
    description: 'Empty array should convert to true'
  },
  {
    input: [0],
    expected: true,
    description: 'Non-empty array should convert to true'
  }
];

/**
 * Test fixtures for date conversion
 */
export const DATE_CONVERSION_FIXTURES: DateConversionFixture[] = [
  // Valid inputs
  {
    input: new Date('2023-01-01T00:00:00.000Z'),
    expected: new Date('2023-01-01T00:00:00.000Z'),
    description: 'Date object should remain the same Date'
  },
  {
    input: '2023-01-01T00:00:00.000Z',
    expected: new Date('2023-01-01T00:00:00.000Z'),
    description: 'ISO date string should convert to Date'
  },
  {
    input: '2023-01-01',
    expected: new Date('2023-01-01T00:00:00.000Z'),
    description: 'YYYY-MM-DD date string should convert to Date'
  },
  {
    input: '01/01/2023',
    expected: new Date(2023, 0, 1),
    description: 'DD/MM/YYYY date string should convert to Date'
  },
  {
    input: 1672531200000, // timestamp for 2023-01-01T00:00:00.000Z
    expected: new Date('2023-01-01T00:00:00.000Z'),
    description: 'Timestamp number should convert to Date'
  },
  
  // Invalid dates
  {
    input: 'not a date',
    expected: null,
    description: 'Invalid date string should return null by default'
  },
  {
    input: '13/13/2023', // Invalid month and day
    expected: null,
    description: 'Invalid DD/MM/YYYY format should return null by default'
  },
  {
    input: new Date('invalid date'),
    expected: null,
    description: 'Invalid Date object should return null by default'
  },
  {
    input: 'not a date',
    expected: new Date('2000-01-01T00:00:00.000Z'),
    defaultValue: new Date('2000-01-01T00:00:00.000Z'),
    description: 'Invalid date should return custom default value when provided'
  },
  
  // Null/undefined handling
  {
    input: null,
    expected: null,
    description: 'Null should return null by default'
  },
  {
    input: undefined,
    expected: null,
    description: 'Undefined should return null by default'
  },
  {
    input: null,
    expected: new Date('2000-01-01T00:00:00.000Z'),
    defaultValue: new Date('2000-01-01T00:00:00.000Z'),
    description: 'Null should return custom default value when provided'
  },
  
  // Edge cases
  {
    input: 0,
    expected: new Date(0), // 1970-01-01T00:00:00.000Z
    description: 'Timestamp 0 should convert to epoch start date'
  },
  {
    input: '0',
    expected: new Date(0), // 1970-01-01T00:00:00.000Z
    description: 'String "0" should convert to epoch start date'
  },
  {
    input: NaN,
    expected: null,
    description: 'NaN should return null by default'
  },
  {
    input: Infinity,
    expected: null,
    description: 'Infinity should return null by default'
  }
];

/**
 * Test fixtures for array conversion
 */
export const ARRAY_CONVERSION_FIXTURES: ArrayConversionFixture<any>[] = [
  // Valid inputs
  {
    input: [1, 2, 3],
    expected: [1, 2, 3],
    description: 'Array should remain the same array'
  },
  {
    input: '[]',
    expected: [],
    description: 'Empty array JSON string should convert to empty array'
  },
  {
    input: '[1,2,3]',
    expected: [1, 2, 3],
    description: 'Array JSON string should convert to array'
  },
  {
    input: '["a","b","c"]',
    expected: ['a', 'b', 'c'],
    description: 'String array JSON should convert to string array'
  },
  {
    input: '[{"a":1},{"b":2}]',
    expected: [{ a: 1 }, { b: 2 }],
    description: 'Object array JSON should convert to object array'
  },
  
  // Single values
  {
    input: 'test',
    expected: ['test'],
    description: 'String should be wrapped in array'
  },
  {
    input: 123,
    expected: [123],
    description: 'Number should be wrapped in array'
  },
  {
    input: true,
    expected: [true],
    description: 'Boolean should be wrapped in array'
  },
  {
    input: { a: 1 },
    expected: [{ a: 1 }],
    description: 'Object should be wrapped in array'
  },
  
  // Invalid JSON
  {
    input: '[1,2,3',
    expected: ['[1,2,3'],
    description: 'Invalid JSON array should be treated as string and wrapped in array'
  },
  {
    input: '{"a":1}',
    expected: ['{"a":1}'],
    description: 'Object JSON string should be treated as string and wrapped in array'
  },
  
  // Null/undefined handling
  {
    input: null,
    expected: [],
    description: 'Null should return empty array by default'
  },
  {
    input: undefined,
    expected: [],
    description: 'Undefined should return empty array by default'
  },
  {
    input: null,
    expected: [1, 2, 3],
    defaultValue: [1, 2, 3],
    description: 'Null should return custom default value when provided'
  },
  
  // Edge cases
  {
    input: '',
    expected: [''],
    description: 'Empty string should be wrapped in array'
  },
  {
    input: ' ',
    expected: [' '],
    description: 'Whitespace string should be wrapped in array'
  },
  {
    input: new Set([1, 2, 3]),
    expected: [new Set([1, 2, 3])],
    description: 'Set should be wrapped in array'
  },
  {
    input: new Map([['a', 1], ['b', 2]]),
    expected: [new Map([['a', 1], ['b', 2]])],
    description: 'Map should be wrapped in array'
  }
];

/**
 * Test fixtures for object conversion
 */
export const OBJECT_CONVERSION_FIXTURES: ObjectConversionFixture<any>[] = [
  // Valid inputs
  {
    input: { a: 1, b: 2 },
    expected: { a: 1, b: 2 },
    description: 'Object should remain the same object'
  },
  {
    input: '{}',
    expected: {},
    description: 'Empty object JSON string should convert to empty object'
  },
  {
    input: '{"a":1,"b":2}',
    expected: { a: 1, b: 2 },
    description: 'Object JSON string should convert to object'
  },
  {
    input: '{"nested":{"a":1}}',
    expected: { nested: { a: 1 } },
    description: 'Nested object JSON string should convert to nested object'
  },
  
  // Invalid inputs
  {
    input: '[1,2,3]',
    expected: {},
    description: 'Array JSON string should return empty object by default'
  },
  {
    input: 'not an object',
    expected: {},
    description: 'Invalid JSON should return empty object by default'
  },
  {
    input: '{a:1}', // Invalid JSON (missing quotes)
    expected: {},
    description: 'Invalid object JSON should return empty object by default'
  },
  {
    input: [1, 2, 3],
    expected: {},
    description: 'Array should return empty object by default'
  },
  {
    input: 123,
    expected: {},
    description: 'Number should return empty object by default'
  },
  {
    input: 'not an object',
    expected: { default: true },
    defaultValue: { default: true },
    description: 'Invalid input should return custom default value when provided'
  },
  
  // Null/undefined handling
  {
    input: null,
    expected: {},
    description: 'Null should return empty object by default'
  },
  {
    input: undefined,
    expected: {},
    description: 'Undefined should return empty object by default'
  },
  {
    input: null,
    expected: { isNull: true },
    defaultValue: { isNull: true },
    description: 'Null should return custom default value when provided'
  }
];

/**
 * Test fixtures for Map conversion
 */
export const MAP_CONVERSION_FIXTURES: MapConversionFixture<string, any>[] = [
  // Valid inputs
  {
    input: new Map([['a', 1], ['b', 2]]),
    expected: new Map([['a', 1], ['b', 2]]),
    description: 'Map should remain the same Map'
  },
  {
    input: { a: 1, b: 2 },
    expected: new Map([['a', 1], ['b', 2]]),
    description: 'Object should convert to equivalent Map'
  },
  {
    input: '{"a":1,"b":2}',
    expected: new Map([['a', 1], ['b', 2]]),
    description: 'Object JSON string should convert to Map'
  },
  
  // Invalid inputs
  {
    input: '[1,2,3]',
    expected: new Map(),
    description: 'Array JSON string should return empty Map by default'
  },
  {
    input: 'not a map',
    expected: new Map(),
    description: 'Invalid JSON should return empty Map by default'
  },
  {
    input: [1, 2, 3],
    expected: new Map(),
    description: 'Array should return empty Map by default'
  },
  {
    input: 123,
    expected: new Map(),
    description: 'Number should return empty Map by default'
  },
  {
    input: 'not a map',
    expected: new Map([['default', true]]),
    defaultValue: new Map([['default', true]]),
    description: 'Invalid input should return custom default value when provided'
  },
  
  // Null/undefined handling
  {
    input: null,
    expected: new Map(),
    description: 'Null should return empty Map by default'
  },
  {
    input: undefined,
    expected: new Map(),
    description: 'Undefined should return empty Map by default'
  },
  {
    input: null,
    expected: new Map([['isNull', true]]),
    defaultValue: new Map([['isNull', true]]),
    description: 'Null should return custom default value when provided'
  }
];

/**
 * Test fixtures for Set conversion
 */
export const SET_CONVERSION_FIXTURES: SetConversionFixture<any>[] = [
  // Valid inputs
  {
    input: new Set([1, 2, 3]),
    expected: new Set([1, 2, 3]),
    description: 'Set should remain the same Set'
  },
  {
    input: [1, 2, 3],
    expected: new Set([1, 2, 3]),
    description: 'Array should convert to equivalent Set'
  },
  {
    input: '[1,2,3]',
    expected: new Set([1, 2, 3]),
    description: 'Array JSON string should convert to Set'
  },
  {
    input: '[1,2,2,3]', // Duplicate values
    expected: new Set([1, 2, 3]),
    description: 'Array with duplicates should convert to Set with unique values'
  },
  
  // Single values
  {
    input: 'test',
    expected: new Set(['test']),
    description: 'String should be wrapped in Set'
  },
  {
    input: 123,
    expected: new Set([123]),
    description: 'Number should be wrapped in Set'
  },
  {
    input: true,
    expected: new Set([true]),
    description: 'Boolean should be wrapped in Set'
  },
  
  // Invalid inputs
  {
    input: '{"a":1}',
    expected: new Set(['{"a":1}']),
    description: 'Object JSON string should be treated as string and wrapped in Set'
  },
  {
    input: '[1,2,3', // Invalid JSON
    expected: new Set(['[1,2,3']),
    description: 'Invalid JSON should be treated as string and wrapped in Set'
  },
  
  // Null/undefined handling
  {
    input: null,
    expected: new Set(),
    description: 'Null should return empty Set by default'
  },
  {
    input: undefined,
    expected: new Set(),
    description: 'Undefined should return empty Set by default'
  },
  {
    input: null,
    expected: new Set([1, 2, 3]),
    defaultValue: new Set([1, 2, 3]),
    description: 'Null should return custom default value when provided'
  }
];

/**
 * Sample enum for testing enum conversion
 */
export enum TestEnum {
  ONE = 'one',
  TWO = 'two',
  THREE = 'three'
}

/**
 * Test fixtures for enum conversion
 */
export const ENUM_CONVERSION_FIXTURES: EnumConversionFixture<TestEnum>[] = [
  // Valid inputs - by value
  {
    input: 'one',
    enumObject: TestEnum,
    expected: TestEnum.ONE,
    defaultValue: TestEnum.THREE,
    description: 'Valid enum value should convert to enum value'
  },
  {
    input: TestEnum.TWO,
    enumObject: TestEnum,
    expected: TestEnum.TWO,
    defaultValue: TestEnum.THREE,
    description: 'Enum value should remain the same enum value'
  },
  
  // Valid inputs - by key (case insensitive)
  {
    input: 'ONE',
    enumObject: TestEnum,
    expected: TestEnum.ONE,
    defaultValue: TestEnum.THREE,
    description: 'Valid enum key should convert to enum value'
  },
  {
    input: 'two',
    enumObject: TestEnum,
    expected: TestEnum.TWO,
    defaultValue: TestEnum.THREE,
    description: 'Valid enum key (lowercase) should convert to enum value'
  },
  {
    input: 'ThReE', // Mixed case
    enumObject: TestEnum,
    expected: TestEnum.THREE,
    defaultValue: TestEnum.ONE,
    description: 'Valid enum key (mixed case) should convert to enum value'
  },
  
  // Invalid inputs
  {
    input: 'four',
    enumObject: TestEnum,
    expected: TestEnum.THREE,
    defaultValue: TestEnum.THREE,
    description: 'Invalid enum value should return default value'
  },
  {
    input: 4,
    enumObject: TestEnum,
    expected: TestEnum.THREE,
    defaultValue: TestEnum.THREE,
    description: 'Number input should return default value'
  },
  
  // Null/undefined handling
  {
    input: null,
    enumObject: TestEnum,
    expected: TestEnum.THREE,
    defaultValue: TestEnum.THREE,
    description: 'Null should return default value'
  },
  {
    input: undefined,
    enumObject: TestEnum,
    expected: TestEnum.THREE,
    defaultValue: TestEnum.THREE,
    description: 'Undefined should return default value'
  }
];

/**
 * Test fixtures for URL conversion
 */
export const URL_CONVERSION_FIXTURES: URLConversionFixture[] = [
  // Valid inputs
  {
    input: 'https://example.com',
    expected: new URL('https://example.com'),
    description: 'Valid URL string should convert to URL object'
  },
  {
    input: 'https://example.com/path?query=value#hash',
    expected: new URL('https://example.com/path?query=value#hash'),
    description: 'URL with path, query and hash should convert correctly'
  },
  {
    input: new URL('https://example.com'),
    expected: new URL('https://example.com'),
    description: 'URL object should remain the same URL object'
  },
  
  // Invalid inputs
  {
    input: 'not a url',
    expected: null,
    description: 'Invalid URL string should return null by default'
  },
  {
    input: 'example.com', // Missing protocol
    expected: null,
    description: 'URL without protocol should return null by default'
  },
  {
    input: 'http:/example.com', // Malformed URL
    expected: null,
    description: 'Malformed URL should return null by default'
  },
  {
    input: 123,
    expected: null,
    description: 'Number should return null by default'
  },
  {
    input: 'not a url',
    expected: new URL('https://default.com'),
    defaultValue: new URL('https://default.com'),
    description: 'Invalid URL should return custom default value when provided'
  },
  
  // Null/undefined handling
  {
    input: null,
    expected: null,
    description: 'Null should return null by default'
  },
  {
    input: undefined,
    expected: null,
    description: 'Undefined should return null by default'
  },
  {
    input: null,
    expected: new URL('https://default.com'),
    defaultValue: new URL('https://default.com'),
    description: 'Null should return custom default value when provided'
  }
];

/**
 * Test fixtures for journey-specific format conversion
 */
export const JOURNEY_FORMAT_CONVERSION_FIXTURES: JourneyFormatConversionFixture<any>[] = [
  // Health journey
  {
    input: new Date('2023-01-01T12:30:45.000Z'),
    journeyId: 'health',
    type: 'date',
    expected: '2023-01-01T12:30:45.000Z',
    defaultValue: '',
    description: 'Date in health journey should convert to ISO string with time'
  },
  {
    input: '2023-01-01T12:30:45.000Z',
    journeyId: 'health',
    type: 'date',
    expected: '2023-01-01T12:30:45.000Z',
    defaultValue: '',
    description: 'Date string in health journey should convert to ISO string with time'
  },
  
  // Care journey
  {
    input: new Date('2023-01-01T12:30:45.000Z'),
    journeyId: 'care',
    type: 'date',
    expected: '2023-01-01',
    defaultValue: '',
    description: 'Date in care journey should convert to ISO date string without time'
  },
  {
    input: '2023-01-01T12:30:45.000Z',
    journeyId: 'care',
    type: 'date',
    expected: '2023-01-01',
    defaultValue: '',
    description: 'Date string in care journey should convert to ISO date string without time'
  },
  
  // Plan journey
  {
    input: 123.45,
    journeyId: 'plan',
    type: 'currency',
    expected: '123.45',
    defaultValue: '0.00',
    description: 'Number in plan journey should convert to currency string with 2 decimal places'
  },
  {
    input: '123.45',
    journeyId: 'plan',
    type: 'currency',
    expected: '123.45',
    defaultValue: '0.00',
    description: 'Number string in plan journey should convert to currency string with 2 decimal places'
  },
  
  // Default type conversions
  {
    input: 123,
    journeyId: 'health',
    type: 'string',
    expected: '123',
    defaultValue: '',
    description: 'Number should convert to string regardless of journey'
  },
  {
    input: '123',
    journeyId: 'care',
    type: 'number',
    expected: 123,
    defaultValue: 0,
    description: 'String should convert to number regardless of journey'
  },
  {
    input: 1,
    journeyId: 'plan',
    type: 'boolean',
    expected: true,
    defaultValue: false,
    description: 'Number should convert to boolean regardless of journey'
  },
  
  // Invalid inputs
  {
    input: 'invalid',
    journeyId: 'health',
    type: 'date',
    expected: '',
    defaultValue: '',
    description: 'Invalid date in health journey should return default value'
  },
  {
    input: 'invalid',
    journeyId: 'plan',
    type: 'currency',
    expected: '0.00',
    defaultValue: '0.00',
    description: 'Invalid number in plan journey should return default value'
  },
  
  // Null/undefined handling
  {
    input: null,
    journeyId: 'health',
    type: 'date',
    expected: '',
    defaultValue: '',
    description: 'Null in health journey should return default value'
  },
  {
    input: undefined,
    journeyId: 'care',
    type: 'date',
    expected: '',
    defaultValue: '',
    description: 'Undefined in care journey should return default value'
  }
];

/**
 * Mock functions for async conversion tests
 */

// Mock successful conversion function
export const mockSuccessfulConversion = <T, U>(val: T): Promise<U> => {
  return Promise.resolve(val as unknown as U);
};

// Mock failing conversion function
export const mockFailingConversion = <T, U>(_val: T): Promise<U> => {
  return Promise.reject(new Error('Conversion failed'));
};

// Mock intermittent failing conversion function (fails first n times)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createMockIntermittentConversion = <T, U>(failCount: number) => {
  let attempts = 0;
  return (val: T): Promise<U> => {
    attempts++;
    if (attempts <= failCount) {
      return Promise.reject(new Error(`Conversion failed on attempt ${attempts}`));
    }
    return Promise.resolve(val as unknown as U);
  };
};

// Mock version function for optimistic locking
export const mockVersionFn = <T>(_val: T): Promise<number> => {
  return Promise.resolve(1);
};

// Mock update function for optimistic locking (success)
export const mockSuccessfulUpdateFn = <U>(_val: U, _version: number): Promise<boolean> => {
  return Promise.resolve(true);
};

// Mock update function for optimistic locking (version conflict)
export const mockVersionConflictUpdateFn = <U>(_val: U, _version: number): Promise<boolean> => {
  return Promise.resolve(false);
};

/**
 * Test fixtures for retry conversion
 */
export const RETRY_CONVERSION_FIXTURES: RetryConversionFixture<any, any>[] = [
  // Successful conversion
  {
    input: 'test',
    conversionFn: mockSuccessfulConversion,
    expected: 'test',
    defaultValue: 'default',
    description: 'Successful conversion should return the converted value'
  },
  
  // Failed conversion
  {
    input: 'test',
    conversionFn: mockFailingConversion,
    expected: 'default',
    defaultValue: 'default',
    description: 'Failed conversion should return the default value after all retries'
  },
  
  // Intermittent failure (succeeds after retries)
  {
    input: 'test',
    conversionFn: createMockIntermittentConversion(2), // Fails twice, succeeds on third try
    expected: 'test',
    defaultValue: 'default',
    maxRetries: 3,
    description: 'Intermittent failure should succeed after retries'
  },
  
  // Intermittent failure (fails all retries)
  {
    input: 'test',
    conversionFn: createMockIntermittentConversion(3), // Fails three times
    expected: 'default',
    defaultValue: 'default',
    maxRetries: 2, // Only retry twice
    description: 'Intermittent failure should return default value if all retries fail'
  }
];

/**
 * Test fixtures for optimistic lock conversion
 */
export const OPTIMISTIC_LOCK_FIXTURES: OptimisticLockFixture<any, any>[] = [
  // Successful update
  {
    input: 'test',
    conversionFn: mockSuccessfulConversion,
    versionFn: mockVersionFn,
    updateFn: mockSuccessfulUpdateFn,
    expected: 'test',
    defaultValue: 'default',
    description: 'Successful update should return the converted value'
  },
  
  // Version conflict (update fails)
  {
    input: 'test',
    conversionFn: mockSuccessfulConversion,
    versionFn: mockVersionFn,
    updateFn: mockVersionConflictUpdateFn,
    expected: 'default',
    defaultValue: 'default',
    maxRetries: 3,
    description: 'Version conflict should return default value after all retries'
  }
];

/**
 * Test fixtures for circuit breaker conversion
 */
export const CIRCUIT_BREAKER_FIXTURES: CircuitBreakerFixture<any, any>[] = [
  // Successful conversion
  {
    input: 'test',
    conversionFn: mockSuccessfulConversion,
    expected: 'test',
    defaultValue: 'default',
    description: 'Successful conversion should return the converted value'
  },
  
  // Failed conversion
  {
    input: 'test',
    conversionFn: mockFailingConversion,
    expected: 'default',
    defaultValue: 'default',
    options: {
      failureThreshold: 1,
      resetTimeout: 1000
    },
    description: 'Failed conversion should return the default value'
  },
  
  // With fallback function
  {
    input: 'test',
    conversionFn: mockFailingConversion,
    expected: 'fallback',
    defaultValue: 'default',
    options: {
      failureThreshold: 1,
      resetTimeout: 1000,
      fallbackFn: () => Promise.resolve('fallback')
    },
    description: 'Failed conversion with fallback should use the fallback function'
  }
];