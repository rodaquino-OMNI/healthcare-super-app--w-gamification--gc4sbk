/**
 * Test fixtures for type conversion utility functions.
 * 
 * These fixtures provide test cases for validating the behavior of type conversion
 * utilities that safely transform values between different types. Each fixture includes
 * input values, expected outputs, and edge cases to ensure robust error handling.
 */

/**
 * Enum used for testing toEnum conversion function
 */
export enum TestEnum {
  ONE = 'one',
  TWO = 'two',
  THREE = 'three',
  NUMERIC_ONE = 1,
  NUMERIC_TWO = 2
}

/**
 * Fixtures for testing toString conversion
 */
export const toStringFixtures = [
  // Valid inputs
  { input: 'hello', expected: 'hello', description: 'String input returns unchanged' },
  { input: 123, expected: '123', description: 'Number converts to string' },
  { input: true, expected: 'true', description: 'Boolean true converts to string' },
  { input: false, expected: 'false', description: 'Boolean false converts to string' },
  { input: new Date('2023-01-15T12:00:00Z'), expected: '2023-01-15T12:00:00.000Z', description: 'Date converts to ISO string' },
  { input: [1, 2, 3], expected: '1,2,3', description: 'Array joins with commas' },
  { input: { key: 'value' }, expected: '[object Object]', description: 'Object converts to string representation' },
  
  // Edge cases
  { input: '', expected: '', description: 'Empty string returns empty string' },
  { input: 0, expected: '0', description: 'Zero converts to string' },
  { input: NaN, expected: 'NaN', description: 'NaN converts to string "NaN"' },
  { input: Infinity, expected: 'Infinity', description: 'Infinity converts to string "Infinity"' },
  { input: -Infinity, expected: '-Infinity', description: 'Negative Infinity converts to string "-Infinity"' },
  
  // Null/undefined handling
  { input: null, expected: '', description: 'Null returns empty string (default)' },
  { input: undefined, expected: '', description: 'Undefined returns empty string (default)' },
  { input: null, expected: 'DEFAULT', defaultValue: 'DEFAULT', description: 'Null returns custom default value' },
  { input: undefined, expected: 'DEFAULT', defaultValue: 'DEFAULT', description: 'Undefined returns custom default value' },
  
  // Error cases
  { 
    input: { toString: () => { throw new Error('toString error'); } }, 
    expected: '', 
    description: 'Object with toString that throws returns empty string (default)' 
  },
  { 
    input: { toString: () => { throw new Error('toString error'); } }, 
    expected: 'ERROR', 
    defaultValue: 'ERROR',
    description: 'Object with toString that throws returns custom default value' 
  }
];

/**
 * Fixtures for testing toNumber conversion
 */
export const toNumberFixtures = [
  // Valid inputs
  { input: 123, expected: 123, description: 'Number input returns unchanged' },
  { input: '456', expected: 456, description: 'Numeric string converts to number' },
  { input: '1,000.50', expected: 1000.50, description: 'Numeric string with commas converts to number' },
  { input: true, expected: 1, description: 'Boolean true converts to 1' },
  { input: false, expected: 0, description: 'Boolean false converts to 0' },
  { input: new Date('2023-01-15T12:00:00Z'), expected: 1673784000000, description: 'Date converts to timestamp' },
  
  // Edge cases
  { input: 0, expected: 0, description: 'Zero returns zero' },
  { input: '0', expected: 0, description: 'String zero converts to number zero' },
  { input: '', expected: 0, description: 'Empty string returns default (0)' },
  { input: ' ', expected: 0, description: 'Whitespace string returns default (0)' },
  { input: '3.14', expected: 3.14, description: 'Decimal string converts to float' },
  { input: '-42', expected: -42, description: 'Negative string converts to negative number' },
  
  // Invalid inputs
  { input: 'abc', expected: 0, description: 'Non-numeric string returns default (0)' },
  { input: 'abc', expected: -1, defaultValue: -1, description: 'Non-numeric string returns custom default' },
  { input: '123abc', expected: 0, description: 'Mixed string returns default (0)' },
  { input: NaN, expected: 0, description: 'NaN returns default (0)' },
  { input: Infinity, expected: Infinity, description: 'Infinity returns Infinity' },
  { input: -Infinity, expected: -Infinity, description: 'Negative Infinity returns -Infinity' },
  { input: [1, 2, 3], expected: 0, description: 'Array returns default (0)' },
  { input: { key: 'value' }, expected: 0, description: 'Object returns default (0)' },
  
  // Null/undefined handling
  { input: null, expected: 0, description: 'Null returns default (0)' },
  { input: undefined, expected: 0, description: 'Undefined returns default (0)' },
  { input: null, expected: -1, defaultValue: -1, description: 'Null returns custom default value' },
  { input: undefined, expected: -1, defaultValue: -1, description: 'Undefined returns custom default value' }
];

/**
 * Fixtures for testing toBoolean conversion
 */
export const toBooleanFixtures = [
  // Valid inputs
  { input: true, expected: true, description: 'Boolean true returns true' },
  { input: false, expected: false, description: 'Boolean false returns false' },
  { input: 1, expected: true, description: 'Number 1 converts to true' },
  { input: 0, expected: false, description: 'Number 0 converts to false' },
  { input: 42, expected: true, description: 'Non-zero number converts to true' },
  { input: -42, expected: true, description: 'Negative number converts to true' },
  
  // String representations
  { input: 'true', expected: true, description: 'String "true" converts to true' },
  { input: 'false', expected: false, description: 'String "false" converts to false' },
  { input: 'yes', expected: true, description: 'String "yes" converts to true' },
  { input: 'no', expected: false, description: 'String "no" converts to false' },
  { input: 'y', expected: true, description: 'String "y" converts to true' },
  { input: 'n', expected: false, description: 'String "n" converts to false' },
  { input: '1', expected: true, description: 'String "1" converts to true' },
  { input: '0', expected: false, description: 'String "0" converts to false' },
  { input: 'on', expected: true, description: 'String "on" converts to true' },
  { input: 'off', expected: false, description: 'String "off" converts to false' },
  { input: 'TRUE', expected: true, description: 'Uppercase "TRUE" converts to true' },
  { input: 'FALSE', expected: false, description: 'Uppercase "FALSE" converts to false' },
  { input: ' true ', expected: true, description: 'String with whitespace converts to true' },
  
  // Invalid or ambiguous inputs
  { input: 'maybe', expected: false, description: 'Unrecognized string returns default (false)' },
  { input: 'maybe', expected: true, defaultValue: true, description: 'Unrecognized string returns custom default' },
  { input: '', expected: false, description: 'Empty string returns default (false)' },
  { input: ' ', expected: false, description: 'Whitespace string returns default (false)' },
  { input: [], expected: false, description: 'Empty array returns false' },
  { input: [1, 2, 3], expected: true, description: 'Non-empty array returns true' },
  { input: {}, expected: true, description: 'Empty object returns true' },
  { input: { key: 'value' }, expected: true, description: 'Non-empty object returns true' },
  { input: new Date(), expected: true, description: 'Date object returns true' },
  
  // Null/undefined handling
  { input: null, expected: false, description: 'Null returns default (false)' },
  { input: undefined, expected: false, description: 'Undefined returns default (false)' },
  { input: null, expected: true, defaultValue: true, description: 'Null returns custom default value' },
  { input: undefined, expected: true, defaultValue: true, description: 'Undefined returns custom default value' }
];

/**
 * Fixtures for testing toDate conversion
 */
export const toDateFixtures = [
  // Valid inputs
  { 
    input: new Date('2023-01-15T12:00:00Z'), 
    expected: new Date('2023-01-15T12:00:00Z'), 
    description: 'Date object returns unchanged' 
  },
  { 
    input: '2023-01-15T12:00:00Z', 
    expected: new Date('2023-01-15T12:00:00Z'), 
    description: 'ISO date string converts to Date' 
  },
  { 
    input: 1673784000000, 
    expected: new Date('2023-01-15T12:00:00Z'), 
    description: 'Timestamp converts to Date' 
  },
  
  // Different date formats
  { 
    input: '2023-01-15', 
    expected: new Date('2023-01-15T00:00:00Z'), 
    description: 'YYYY-MM-DD string converts to Date' 
  },
  { 
    input: 'Jan 15, 2023', 
    expected: new Date('2023-01-15T00:00:00Z'), 
    description: 'Human-readable date string converts to Date' 
  },
  
  // Edge cases
  { 
    input: '', 
    expected: null, 
    description: 'Empty string returns default (null)' 
  },
  { 
    input: ' ', 
    expected: null, 
    description: 'Whitespace string returns default (null)' 
  },
  
  // Invalid inputs
  { 
    input: 'not a date', 
    expected: null, 
    description: 'Invalid date string returns default (null)' 
  },
  { 
    input: 'not a date', 
    expected: new Date('2000-01-01T00:00:00Z'), 
    defaultValue: new Date('2000-01-01T00:00:00Z'), 
    description: 'Invalid date string returns custom default' 
  },
  { 
    input: NaN, 
    expected: null, 
    description: 'NaN returns default (null)' 
  },
  { 
    input: Infinity, 
    expected: null, 
    description: 'Infinity returns default (null)' 
  },
  { 
    input: true, 
    expected: null, 
    description: 'Boolean returns default (null)' 
  },
  { 
    input: [2023, 0, 15], 
    expected: null, 
    description: 'Array returns default (null)' 
  },
  { 
    input: { year: 2023, month: 0, day: 15 }, 
    expected: null, 
    description: 'Object returns default (null)' 
  },
  
  // Invalid Date object
  { 
    input: new Date('invalid date'), 
    expected: null, 
    description: 'Invalid Date object returns default (null)' 
  },
  
  // Null/undefined handling
  { 
    input: null, 
    expected: null, 
    description: 'Null returns default (null)' 
  },
  { 
    input: undefined, 
    expected: null, 
    description: 'Undefined returns default (null)' 
  },
  { 
    input: null, 
    expected: new Date('2000-01-01T00:00:00Z'), 
    defaultValue: new Date('2000-01-01T00:00:00Z'), 
    description: 'Null returns custom default value' 
  },
  { 
    input: undefined, 
    expected: new Date('2000-01-01T00:00:00Z'), 
    defaultValue: new Date('2000-01-01T00:00:00Z'), 
    description: 'Undefined returns custom default value' 
  }
];

/**
 * Fixtures for testing toArray conversion
 */
export const toArrayFixtures = [
  // Valid inputs
  { input: [1, 2, 3], expected: [1, 2, 3], description: 'Array returns unchanged' },
  { input: 'a,b,c', expected: ['a', 'b', 'c'], description: 'Comma-separated string converts to array' },
  { input: 'single', expected: ['single'], description: 'Single string without commas wraps in array' },
  
  // Edge cases
  { input: '', expected: [], description: 'Empty string returns empty array' },
  { input: ' ', expected: [], description: 'Whitespace string returns empty array' },
  { input: ',', expected: ['', ''], description: 'Comma only string splits into empty strings' },
  { input: 'a, b, c', expected: ['a', ' b', ' c'], description: 'Preserves whitespace after split' },
  
  // Non-array inputs
  { input: 123, expected: [123], description: 'Number wraps in array' },
  { input: true, expected: [true], description: 'Boolean wraps in array' },
  { input: { key: 'value' }, expected: [{ key: 'value' }], description: 'Object wraps in array' },
  { input: new Date('2023-01-15T12:00:00Z'), expected: [new Date('2023-01-15T12:00:00Z')], description: 'Date wraps in array' },
  
  // Null/undefined handling
  { input: null, expected: [], description: 'Null returns empty array (default)' },
  { input: undefined, expected: [], description: 'Undefined returns empty array (default)' },
  { input: null, expected: [1, 2, 3], defaultValue: [1, 2, 3], description: 'Null returns custom default value' },
  { input: undefined, expected: [1, 2, 3], defaultValue: [1, 2, 3], description: 'Undefined returns custom default value' }
];

/**
 * Fixtures for testing toInteger conversion
 */
export const toIntegerFixtures = [
  // Valid inputs
  { input: 123, expected: 123, description: 'Integer returns unchanged' },
  { input: 123.45, expected: 123, description: 'Float rounds down to integer' },
  { input: 123.99, expected: 123, description: 'Float rounds down to integer even when close to next integer' },
  { input: -123.45, expected: -124, description: 'Negative float rounds down (away from zero)' },
  { input: '456', expected: 456, description: 'Numeric string converts to integer' },
  { input: '456.78', expected: 456, description: 'Decimal string converts to integer (rounded down)' },
  { input: '1,000', expected: 1000, description: 'Formatted number string with commas converts to integer' },
  
  // Edge cases
  { input: 0, expected: 0, description: 'Zero returns zero' },
  { input: '0', expected: 0, description: 'String zero converts to integer zero' },
  { input: '', expected: 0, description: 'Empty string returns default (0)' },
  { input: ' ', expected: 0, description: 'Whitespace string returns default (0)' },
  
  // Invalid inputs
  { input: 'abc', expected: 0, description: 'Non-numeric string returns default (0)' },
  { input: 'abc', expected: -1, defaultValue: -1, description: 'Non-numeric string returns custom default' },
  { input: '123abc', expected: 0, description: 'Mixed string returns default (0)' },
  { input: NaN, expected: 0, description: 'NaN returns default (0)' },
  { input: Infinity, expected: 0, description: 'Infinity returns default (0)' },
  { input: -Infinity, expected: 0, description: 'Negative Infinity returns default (0)' },
  { input: [1, 2, 3], expected: 0, description: 'Array returns default (0)' },
  { input: { key: 'value' }, expected: 0, description: 'Object returns default (0)' },
  
  // Boolean inputs
  { input: true, expected: 1, description: 'Boolean true converts to 1' },
  { input: false, expected: 0, description: 'Boolean false converts to 0' },
  
  // Null/undefined handling
  { input: null, expected: 0, description: 'Null returns default (0)' },
  { input: undefined, expected: 0, description: 'Undefined returns default (0)' },
  { input: null, expected: -1, defaultValue: -1, description: 'Null returns custom default value' },
  { input: undefined, expected: -1, defaultValue: -1, description: 'Undefined returns custom default value' }
];

/**
 * Fixtures for testing toFloat conversion
 */
export const toFloatFixtures = [
  // Valid inputs with default precision (2)
  { input: 123.456, expected: 123.46, description: 'Float rounds to 2 decimal places' },
  { input: 123.454, expected: 123.45, description: 'Float rounds to 2 decimal places (down)' },
  { input: -123.456, expected: -123.46, description: 'Negative float rounds to 2 decimal places' },
  { input: '456.789', expected: 456.79, description: 'Decimal string converts to float (2 places)' },
  { input: '1,000.555', expected: 1000.56, description: 'Formatted number with commas converts to float' },
  
  // Custom precision
  { input: 123.456, expected: 123.5, precision: 1, description: 'Float rounds to 1 decimal place' },
  { input: 123.456, expected: 123.456, precision: 3, description: 'Float rounds to 3 decimal places' },
  { input: 123.4567, expected: 123.457, precision: 3, description: 'Float rounds to 3 decimal places (up)' },
  { input: 123.4, expected: 123, precision: 0, description: 'Float rounds to 0 decimal places (integer)' },
  
  // Edge cases
  { input: 0, expected: 0, description: 'Zero returns zero' },
  { input: '0', expected: 0, description: 'String zero converts to float zero' },
  { input: '', expected: 0, description: 'Empty string returns default (0)' },
  { input: ' ', expected: 0, description: 'Whitespace string returns default (0)' },
  
  // Invalid inputs
  { input: 'abc', expected: 0, description: 'Non-numeric string returns default (0)' },
  { input: 'abc', expected: -1.5, defaultValue: -1.5, description: 'Non-numeric string returns custom default' },
  { input: '123abc', expected: 0, description: 'Mixed string returns default (0)' },
  { input: NaN, expected: 0, description: 'NaN returns default (0)' },
  { input: Infinity, expected: 0, description: 'Infinity returns default (0)' },
  { input: -Infinity, expected: 0, description: 'Negative Infinity returns default (0)' },
  { input: [1, 2, 3], expected: 0, description: 'Array returns default (0)' },
  { input: { key: 'value' }, expected: 0, description: 'Object returns default (0)' },
  
  // Boolean inputs
  { input: true, expected: 1, description: 'Boolean true converts to 1.0' },
  { input: false, expected: 0, description: 'Boolean false converts to 0.0' },
  
  // Null/undefined handling
  { input: null, expected: 0, description: 'Null returns default (0)' },
  { input: undefined, expected: 0, description: 'Undefined returns default (0)' },
  { input: null, expected: -1.5, defaultValue: -1.5, description: 'Null returns custom default value' },
  { input: undefined, expected: -1.5, defaultValue: -1.5, description: 'Undefined returns custom default value' }
];

/**
 * Fixtures for testing toJson conversion
 */
export const toJsonFixtures = [
  // Valid inputs
  { input: { name: 'John', age: 30 }, expected: '{"name":"John","age":30}', description: 'Object converts to JSON string' },
  { input: [1, 2, 3], expected: '[1,2,3]', description: 'Array converts to JSON string' },
  { input: 'string', expected: '"string"', description: 'String converts to quoted JSON string' },
  { input: 123, expected: '123', description: 'Number converts to JSON string' },
  { input: true, expected: 'true', description: 'Boolean converts to JSON string' },
  { input: false, expected: 'false', description: 'Boolean false converts to JSON string' },
  
  // Edge cases
  { input: {}, expected: '{}', description: 'Empty object converts to empty JSON object' },
  { input: [], expected: '[]', description: 'Empty array converts to empty JSON array' },
  { input: '', expected: '""', description: 'Empty string converts to empty quoted JSON string' },
  { input: 0, expected: '0', description: 'Zero converts to JSON string' },
  
  // Special values
  { input: { date: new Date('2023-01-15T12:00:00Z') }, expected: '{"date":"2023-01-15T12:00:00.000Z"}', description: 'Date in object converts to ISO string in JSON' },
  
  // Circular references and non-serializable values
  { 
    input: { toJSON: () => { throw new Error('JSON error'); } }, 
    expected: '{}', 
    description: 'Object with toJSON that throws returns default ("{}")' 
  },
  { 
    input: { toJSON: () => { throw new Error('JSON error'); } }, 
    expected: '{"error":true}', 
    defaultValue: '{"error":true}',
    description: 'Object with toJSON that throws returns custom default' 
  },
  
  // Null/undefined handling
  { input: null, expected: '{}', description: 'Null returns default ("{}")' },
  { input: undefined, expected: '{}', description: 'Undefined returns default ("{}")' },
  { input: null, expected: 'null', defaultValue: 'null', description: 'Null returns custom default value' },
  { input: undefined, expected: 'null', defaultValue: 'null', description: 'Undefined returns custom default value' }
];

/**
 * Fixtures for testing fromJson conversion
 */
export const fromJsonFixtures = [
  // Valid inputs
  { input: '{"name":"John","age":30}', expected: { name: 'John', age: 30 }, description: 'JSON object string parses to object' },
  { input: '[1,2,3]', expected: [1, 2, 3], description: 'JSON array string parses to array' },
  { input: '"string"', expected: 'string', description: 'JSON quoted string parses to string' },
  { input: '123', expected: 123, description: 'JSON number string parses to number' },
  { input: 'true', expected: true, description: 'JSON boolean string parses to boolean' },
  { input: 'false', expected: false, description: 'JSON boolean false string parses to boolean' },
  { input: 'null', expected: null, description: 'JSON null string parses to null' },
  
  // Edge cases
  { input: '{}', expected: {}, description: 'Empty JSON object string parses to empty object' },
  { input: '[]', expected: [], description: 'Empty JSON array string parses to empty array' },
  { input: '', expected: null, description: 'Empty string returns default (null)' },
  { input: ' ', expected: null, description: 'Whitespace string returns default (null)' },
  
  // Invalid inputs
  { input: '{invalid json}', expected: null, description: 'Invalid JSON returns default (null)' },
  { input: '{invalid json}', expected: { error: true }, defaultValue: { error: true }, description: 'Invalid JSON returns custom default' },
  { input: '[1, 2,]', expected: null, description: 'Malformed JSON returns default (null)' },
  { input: '"unclosed string', expected: null, description: 'Unclosed string returns default (null)' },
  
  // Null/undefined handling
  { input: null, expected: null, description: 'Null returns default (null)' },
  { input: undefined, expected: null, description: 'Undefined returns default (null)' },
  { input: null, expected: { default: true }, defaultValue: { default: true }, description: 'Null returns custom default value' },
  { input: undefined, expected: { default: true }, defaultValue: { default: true }, description: 'Undefined returns custom default value' }
];

/**
 * Fixtures for testing toMap conversion
 */
export const toMapFixtures = [
  // Valid inputs
  { 
    input: { name: 'John', age: 30 }, 
    expected: new Map([['name', 'John'], ['age', 30]]), 
    description: 'Object converts to Map' 
  },
  { 
    input: [["key1", "value1"], ["key2", "value2"]], 
    expected: new Map([["key1", "value1"], ["key2", "value2"]]), 
    description: 'Array of key-value pairs converts to Map' 
  },
  { 
    input: new Map([["key1", "value1"], ["key2", "value2"]]), 
    expected: new Map([["key1", "value1"], ["key2", "value2"]]), 
    description: 'Map returns unchanged' 
  },
  
  // Edge cases
  { 
    input: {}, 
    expected: new Map(), 
    description: 'Empty object converts to empty Map' 
  },
  { 
    input: [], 
    expected: new Map(), 
    description: 'Empty array converts to empty Map' 
  },
  
  // Invalid inputs
  { 
    input: 'string', 
    expected: new Map(), 
    description: 'String returns default (empty Map)' 
  },
  { 
    input: 123, 
    expected: new Map(), 
    description: 'Number returns default (empty Map)' 
  },
  { 
    input: true, 
    expected: new Map(), 
    description: 'Boolean returns default (empty Map)' 
  },
  { 
    input: [["invalid"]], 
    expected: new Map(), 
    description: 'Invalid array structure returns default (empty Map)' 
  },
  { 
    input: 'string', 
    expected: new Map([["default", true]]), 
    defaultValue: new Map([["default", true]]), 
    description: 'String returns custom default Map' 
  },
  
  // Null/undefined handling
  { 
    input: null, 
    expected: new Map(), 
    description: 'Null returns default (empty Map)' 
  },
  { 
    input: undefined, 
    expected: new Map(), 
    description: 'Undefined returns default (empty Map)' 
  },
  { 
    input: null, 
    expected: new Map([["default", true]]), 
    defaultValue: new Map([["default", true]]), 
    description: 'Null returns custom default value' 
  },
  { 
    input: undefined, 
    expected: new Map([["default", true]]), 
    defaultValue: new Map([["default", true]]), 
    description: 'Undefined returns custom default value' 
  }
];

/**
 * Fixtures for testing toSet conversion
 */
export const toSetFixtures = [
  // Valid inputs
  { 
    input: [1, 2, 3, 3], 
    expected: new Set([1, 2, 3]), 
    description: 'Array converts to Set (duplicates removed)' 
  },
  { 
    input: 'a,b,c,c', 
    expected: new Set(['a', 'b', 'c']), 
    description: 'Comma-separated string converts to Set (duplicates removed)' 
  },
  { 
    input: new Set([1, 2, 3]), 
    expected: new Set([1, 2, 3]), 
    description: 'Set returns unchanged' 
  },
  
  // Edge cases
  { 
    input: [], 
    expected: new Set(), 
    description: 'Empty array converts to empty Set' 
  },
  { 
    input: '', 
    expected: new Set(), 
    description: 'Empty string returns default (empty Set)' 
  },
  { 
    input: ' ', 
    expected: new Set(), 
    description: 'Whitespace string returns default (empty Set)' 
  },
  { 
    input: ',', 
    expected: new Set(['', '']), 
    description: 'Comma only string splits into Set with empty strings' 
  },
  
  // Non-array/string inputs
  { 
    input: 123, 
    expected: new Set([123]), 
    description: 'Number wraps in Set' 
  },
  { 
    input: true, 
    expected: new Set([true]), 
    description: 'Boolean wraps in Set' 
  },
  { 
    input: { key: 'value' }, 
    expected: new Set([{ key: 'value' }]), 
    description: 'Object wraps in Set' 
  },
  
  // Null/undefined handling
  { 
    input: null, 
    expected: new Set(), 
    description: 'Null returns default (empty Set)' 
  },
  { 
    input: undefined, 
    expected: new Set(), 
    description: 'Undefined returns default (empty Set)' 
  },
  { 
    input: null, 
    expected: new Set([1, 2, 3]), 
    defaultValue: new Set([1, 2, 3]), 
    description: 'Null returns custom default value' 
  },
  { 
    input: undefined, 
    expected: new Set([1, 2, 3]), 
    defaultValue: new Set([1, 2, 3]), 
    description: 'Undefined returns custom default value' 
  }
];

/**
 * Fixtures for testing toEnum conversion
 */
export const toEnumFixtures = [
  // Valid inputs - direct enum values
  { 
    input: TestEnum.ONE, 
    enumType: TestEnum, 
    expected: TestEnum.ONE, 
    defaultValue: TestEnum.THREE, 
    description: 'Enum value returns unchanged' 
  },
  { 
    input: 'one', 
    enumType: TestEnum, 
    expected: TestEnum.ONE, 
    defaultValue: TestEnum.THREE, 
    description: 'String matching enum key converts to enum value' 
  },
  { 
    input: 'ONE', 
    enumType: TestEnum, 
    expected: TestEnum.ONE, 
    defaultValue: TestEnum.THREE, 
    description: 'Case-insensitive string matching enum key converts to enum value' 
  },
  { 
    input: 1, 
    enumType: TestEnum, 
    expected: TestEnum.NUMERIC_ONE, 
    defaultValue: TestEnum.THREE, 
    description: 'Number matching enum value converts to enum value' 
  },
  
  // Invalid inputs
  { 
    input: 'invalid', 
    enumType: TestEnum, 
    expected: TestEnum.THREE, 
    defaultValue: TestEnum.THREE, 
    description: 'Invalid string returns default enum value' 
  },
  { 
    input: 99, 
    enumType: TestEnum, 
    expected: TestEnum.THREE, 
    defaultValue: TestEnum.THREE, 
    description: 'Invalid number returns default enum value' 
  },
  { 
    input: true, 
    enumType: TestEnum, 
    expected: TestEnum.THREE, 
    defaultValue: TestEnum.THREE, 
    description: 'Boolean returns default enum value' 
  },
  { 
    input: [], 
    enumType: TestEnum, 
    expected: TestEnum.THREE, 
    defaultValue: TestEnum.THREE, 
    description: 'Array returns default enum value' 
  },
  { 
    input: {}, 
    enumType: TestEnum, 
    expected: TestEnum.THREE, 
    defaultValue: TestEnum.THREE, 
    description: 'Object returns default enum value' 
  },
  
  // Null/undefined handling
  { 
    input: null, 
    enumType: TestEnum, 
    expected: TestEnum.THREE, 
    defaultValue: TestEnum.THREE, 
    description: 'Null returns default enum value' 
  },
  { 
    input: undefined, 
    enumType: TestEnum, 
    expected: TestEnum.THREE, 
    defaultValue: TestEnum.THREE, 
    description: 'Undefined returns default enum value' 
  }
];

/**
 * Fixtures for testing toUrl conversion
 */
export const toUrlFixtures = [
  // Valid inputs
  { 
    input: 'https://example.com', 
    expected: new URL('https://example.com'), 
    description: 'Valid URL string converts to URL object' 
  },
  { 
    input: 'https://example.com/path?query=value#hash', 
    expected: new URL('https://example.com/path?query=value#hash'), 
    description: 'URL string with path, query and hash converts to URL object' 
  },
  { 
    input: new URL('https://example.com'), 
    expected: new URL('https://example.com'), 
    description: 'URL object returns unchanged' 
  },
  
  // Invalid inputs
  { 
    input: 'invalid-url', 
    expected: null, 
    description: 'Invalid URL string returns default (null)' 
  },
  { 
    input: 'example.com', 
    expected: null, 
    description: 'URL string without protocol returns default (null)' 
  },
  { 
    input: 123, 
    expected: null, 
    description: 'Number returns default (null)' 
  },
  { 
    input: true, 
    expected: null, 
    description: 'Boolean returns default (null)' 
  },
  { 
    input: [], 
    expected: null, 
    description: 'Array returns default (null)' 
  },
  { 
    input: {}, 
    expected: null, 
    description: 'Object returns default (null)' 
  },
  { 
    input: 'invalid-url', 
    expected: new URL('https://default.com'), 
    defaultValue: new URL('https://default.com'), 
    description: 'Invalid URL string returns custom default' 
  },
  
  // Null/undefined handling
  { 
    input: null, 
    expected: null, 
    description: 'Null returns default (null)' 
  },
  { 
    input: undefined, 
    expected: null, 
    description: 'Undefined returns default (null)' 
  },
  { 
    input: null, 
    expected: new URL('https://default.com'), 
    defaultValue: new URL('https://default.com'), 
    description: 'Null returns custom default value' 
  },
  { 
    input: undefined, 
    expected: new URL('https://default.com'), 
    defaultValue: new URL('https://default.com'), 
    description: 'Undefined returns custom default value' 
  }
];

/**
 * Fixtures for testing convertTo function
 */
export const convertToFixtures = [
  // String conversion
  { 
    input: 123, 
    targetType: 'string', 
    expected: '123', 
    description: 'Convert number to string' 
  },
  { 
    input: null, 
    targetType: 'string', 
    expected: '', 
    description: 'Convert null to string with default empty string' 
  },
  { 
    input: null, 
    targetType: 'string', 
    defaultValue: 'N/A', 
    expected: 'N/A', 
    description: 'Convert null to string with custom default' 
  },
  
  // Number conversion
  { 
    input: '456', 
    targetType: 'number', 
    expected: 456, 
    description: 'Convert string to number' 
  },
  { 
    input: 'invalid', 
    targetType: 'number', 
    expected: 0, 
    description: 'Convert invalid string to number with default 0' 
  },
  { 
    input: 'invalid', 
    targetType: 'number', 
    defaultValue: -1, 
    expected: -1, 
    description: 'Convert invalid string to number with custom default' 
  },
  
  // Boolean conversion
  { 
    input: 1, 
    targetType: 'boolean', 
    expected: true, 
    description: 'Convert number to boolean' 
  },
  { 
    input: 'yes', 
    targetType: 'boolean', 
    expected: true, 
    description: 'Convert string to boolean' 
  },
  { 
    input: 'invalid', 
    targetType: 'boolean', 
    expected: false, 
    description: 'Convert invalid string to boolean with default false' 
  },
  { 
    input: 'invalid', 
    targetType: 'boolean', 
    defaultValue: true, 
    expected: true, 
    description: 'Convert invalid string to boolean with custom default' 
  },
  
  // Date conversion
  { 
    input: '2023-01-15', 
    targetType: 'date', 
    expected: new Date('2023-01-15'), 
    description: 'Convert string to date' 
  },
  { 
    input: 'invalid', 
    targetType: 'date', 
    expected: null, 
    description: 'Convert invalid string to date with default null' 
  },
  { 
    input: 'invalid', 
    targetType: 'date', 
    defaultValue: new Date('2000-01-01'), 
    expected: new Date('2000-01-01'), 
    description: 'Convert invalid string to date with custom default' 
  },
  
  // Array conversion
  { 
    input: 'a,b,c', 
    targetType: 'array', 
    expected: ['a', 'b', 'c'], 
    description: 'Convert string to array' 
  },
  { 
    input: null, 
    targetType: 'array', 
    expected: [], 
    description: 'Convert null to array with default empty array' 
  },
  { 
    input: null, 
    targetType: 'array', 
    defaultValue: ['default'], 
    expected: ['default'], 
    description: 'Convert null to array with custom default' 
  },
  
  // Integer conversion
  { 
    input: 123.45, 
    targetType: 'integer', 
    expected: 123, 
    description: 'Convert float to integer' 
  },
  { 
    input: 'invalid', 
    targetType: 'integer', 
    expected: 0, 
    description: 'Convert invalid string to integer with default 0' 
  },
  { 
    input: 'invalid', 
    targetType: 'integer', 
    defaultValue: -1, 
    expected: -1, 
    description: 'Convert invalid string to integer with custom default' 
  },
  
  // Float conversion
  { 
    input: '123.456', 
    targetType: 'float', 
    expected: 123.46, 
    description: 'Convert string to float with default precision (2)' 
  },
  { 
    input: 'invalid', 
    targetType: 'float', 
    expected: 0, 
    description: 'Convert invalid string to float with default 0' 
  },
  { 
    input: 'invalid', 
    targetType: 'float', 
    defaultValue: -1.5, 
    expected: -1.5, 
    description: 'Convert invalid string to float with custom default' 
  },
  
  // JSON conversion
  { 
    input: { name: 'John' }, 
    targetType: 'json', 
    expected: '{"name":"John"}', 
    description: 'Convert object to JSON string' 
  },
  { 
    input: null, 
    targetType: 'json', 
    expected: '{}', 
    description: 'Convert null to JSON with default empty object' 
  },
  { 
    input: null, 
    targetType: 'json', 
    defaultValue: '{"default":true}', 
    expected: '{"default":true}', 
    description: 'Convert null to JSON with custom default' 
  },
  
  // Map conversion
  { 
    input: { key: 'value' }, 
    targetType: 'map', 
    expected: new Map([['key', 'value']]), 
    description: 'Convert object to Map' 
  },
  { 
    input: 'invalid', 
    targetType: 'map', 
    expected: new Map(), 
    description: 'Convert invalid input to Map with default empty Map' 
  },
  { 
    input: 'invalid', 
    targetType: 'map', 
    defaultValue: new Map([['default', true]]), 
    expected: new Map([['default', true]]), 
    description: 'Convert invalid input to Map with custom default' 
  },
  
  // Set conversion
  { 
    input: [1, 2, 3], 
    targetType: 'set', 
    expected: new Set([1, 2, 3]), 
    description: 'Convert array to Set' 
  },
  { 
    input: 'invalid', 
    targetType: 'set', 
    expected: new Set(['invalid']), 
    description: 'Convert string to Set with single value' 
  },
  { 
    input: null, 
    targetType: 'set', 
    expected: new Set(), 
    description: 'Convert null to Set with default empty Set' 
  },
  { 
    input: null, 
    targetType: 'set', 
    defaultValue: new Set([1, 2, 3]), 
    expected: new Set([1, 2, 3]), 
    description: 'Convert null to Set with custom default' 
  },
  
  // URL conversion
  { 
    input: 'https://example.com', 
    targetType: 'url', 
    expected: new URL('https://example.com'), 
    description: 'Convert string to URL' 
  },
  { 
    input: 'invalid', 
    targetType: 'url', 
    expected: null, 
    description: 'Convert invalid string to URL with default null' 
  },
  { 
    input: 'invalid', 
    targetType: 'url', 
    defaultValue: new URL('https://default.com'), 
    expected: new URL('https://default.com'), 
    description: 'Convert invalid string to URL with custom default' 
  },
  
  // Unknown type
  { 
    input: 'value', 
    targetType: 'unknown', 
    expected: 'value', 
    description: 'Unknown target type returns original value' 
  },
  { 
    input: null, 
    targetType: 'unknown', 
    defaultValue: 'default', 
    expected: 'default', 
    description: 'Unknown target type with null input returns default' 
  }
];