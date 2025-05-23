/**
 * Test fixtures for environment variable transformations
 * 
 * This module provides test cases for the environment variable transformation
 * functions in src/backend/packages/utils/src/env/transform.ts.
 */

import { z } from 'zod';

/**
 * Test cases for parseBoolean function
 */
export const booleanTransformationCases = [
  // True values
  { input: 'true', expected: true, description: 'String "true"' },
  { input: 'TRUE', expected: true, description: 'Uppercase "TRUE"' },
  { input: 'True', expected: true, description: 'Title case "True"' },
  { input: 'yes', expected: true, description: 'String "yes"' },
  { input: 'YES', expected: true, description: 'Uppercase "YES"' },
  { input: '1', expected: true, description: 'String "1"' },
  { input: 'on', expected: true, description: 'String "on"' },
  { input: 'ON', expected: true, description: 'Uppercase "ON"' },
  { input: ' true ', expected: true, description: 'String with whitespace' },
  
  // False values
  { input: 'false', expected: false, description: 'String "false"' },
  { input: 'FALSE', expected: false, description: 'Uppercase "FALSE"' },
  { input: 'False', expected: false, description: 'Title case "False"' },
  { input: 'no', expected: false, description: 'String "no"' },
  { input: 'NO', expected: false, description: 'Uppercase "NO"' },
  { input: '0', expected: false, description: 'String "0"' },
  { input: 'off', expected: false, description: 'String "off"' },
  { input: 'OFF', expected: false, description: 'Uppercase "OFF"' },
  { input: ' false ', expected: false, description: 'String with whitespace' },
  
  // Default value cases
  { input: undefined, defaultValue: true, expected: true, description: 'Undefined with default true' },
  { input: undefined, defaultValue: false, expected: false, description: 'Undefined with default false' },
  { input: '', defaultValue: true, expected: true, description: 'Empty string with default true' },
  { input: '', defaultValue: false, expected: false, description: 'Empty string with default false' },
  { input: 'invalid', defaultValue: true, expected: true, description: 'Invalid value with default true' },
  { input: 'invalid', defaultValue: false, expected: false, description: 'Invalid value with default false' },
  
  // Error cases (no default value)
  { input: undefined, expectedError: 'Cannot parse undefined or empty string to boolean', description: 'Undefined without default' },
  { input: '', expectedError: 'Cannot parse undefined or empty string to boolean', description: 'Empty string without default' },
  { input: 'invalid', expectedError: 'Cannot parse value "invalid" to boolean', description: 'Invalid value without default' },
  { input: 'truthy', expectedError: 'Cannot parse value "truthy" to boolean', description: 'Similar but invalid value' },
];

/**
 * Test cases for parseNumber function
 */
export const numberTransformationCases = [
  // Basic number parsing
  { input: '42', expected: 42, description: 'Integer string' },
  { input: '3.14', expected: 3.14, description: 'Float string' },
  { input: '-10', expected: -10, description: 'Negative integer' },
  { input: '-2.5', expected: -2.5, description: 'Negative float' },
  { input: '0', expected: 0, description: 'Zero' },
  { input: ' 100 ', expected: 100, description: 'Number with whitespace' },
  { input: '1e3', expected: 1000, description: 'Scientific notation' },
  { input: '0xFF', expected: 255, description: 'Hexadecimal notation' },
  
  // Range validation cases
  { 
    input: '5', 
    options: { min: 1, max: 10 }, 
    expected: 5, 
    description: 'Number within range' 
  },
  { 
    input: '1', 
    options: { min: 1, max: 10 }, 
    expected: 1, 
    description: 'Number at minimum of range' 
  },
  { 
    input: '10', 
    options: { min: 1, max: 10 }, 
    expected: 10, 
    description: 'Number at maximum of range' 
  },
  { 
    input: '0', 
    options: { min: 1, max: 10, defaultValue: 1 }, 
    expected: 1, 
    description: 'Number below range with default' 
  },
  { 
    input: '11', 
    options: { min: 1, max: 10, defaultValue: 10 }, 
    expected: 10, 
    description: 'Number above range with default' 
  },
  
  // Default value cases
  { input: undefined, options: { defaultValue: 42 }, expected: 42, description: 'Undefined with default' },
  { input: '', options: { defaultValue: 42 }, expected: 42, description: 'Empty string with default' },
  { input: 'not-a-number', options: { defaultValue: 42 }, expected: 42, description: 'Invalid number with default' },
  
  // Error cases (no default value)
  { input: undefined, expectedError: 'Cannot parse undefined or empty string to number', description: 'Undefined without default' },
  { input: '', expectedError: 'Cannot parse undefined or empty string to number', description: 'Empty string without default' },
  { input: 'not-a-number', expectedError: 'Cannot parse value "not-a-number" to number', description: 'Invalid number without default' },
  { 
    input: '0', 
    options: { min: 1 }, 
    expectedError: 'Value 0 is less than minimum allowed value 1', 
    description: 'Number below minimum without default' 
  },
  { 
    input: '11', 
    options: { max: 10 }, 
    expectedError: 'Value 11 is greater than maximum allowed value 10', 
    description: 'Number above maximum without default' 
  },
];

/**
 * Test cases for parseArray function
 */
export const arrayTransformationCases = [
  // CSV format
  { 
    input: 'apple,banana,cherry', 
    expected: ['apple', 'banana', 'cherry'], 
    description: 'Comma-separated values' 
  },
  { 
    input: 'apple, banana, cherry', 
    expected: ['apple', 'banana', 'cherry'], 
    description: 'Comma-separated values with spaces' 
  },
  
  // Semicolon format
  { 
    input: 'apple;banana;cherry', 
    expected: ['apple', 'banana', 'cherry'], 
    description: 'Semicolon-separated values' 
  },
  { 
    input: 'apple; banana; cherry', 
    expected: ['apple', 'banana', 'cherry'], 
    description: 'Semicolon-separated values with spaces' 
  },
  
  // Space format
  { 
    input: 'apple banana cherry', 
    expected: ['apple', 'banana', 'cherry'], 
    description: 'Space-separated values' 
  },
  { 
    input: '  apple   banana   cherry  ', 
    expected: ['apple', 'banana', 'cherry'], 
    description: 'Space-separated values with extra spaces' 
  },
  
  // JSON array format
  { 
    input: '["apple","banana","cherry"]', 
    expected: ['apple', 'banana', 'cherry'], 
    description: 'JSON array format' 
  },
  { 
    input: '[ "apple", "banana", "cherry" ]', 
    expected: ['apple', 'banana', 'cherry'], 
    description: 'JSON array format with spaces' 
  },
  
  // Custom delimiter
  { 
    input: 'apple|banana|cherry', 
    options: { delimiter: '|' }, 
    expected: ['apple', 'banana', 'cherry'], 
    description: 'Custom delimiter' 
  },
  
  // Transform function
  { 
    input: '1,2,3,4,5', 
    options: { transform: (item: string) => parseInt(item, 10) }, 
    expected: [1, 2, 3, 4, 5], 
    description: 'Transform string to number' 
  },
  { 
    input: 'true,false,true', 
    options: { transform: (item: string) => item === 'true' }, 
    expected: [true, false, true], 
    description: 'Transform string to boolean' 
  },
  
  // Empty values and filtering
  { 
    input: 'apple,,cherry', 
    expected: ['apple', 'cherry'], 
    description: 'Empty values are filtered out' 
  },
  { 
    input: 'apple, ,cherry', 
    expected: ['apple', 'cherry'], 
    description: 'Empty values with spaces are filtered out' 
  },
  
  // Default value cases
  { 
    input: undefined, 
    options: { defaultValue: ['default'] }, 
    expected: ['default'], 
    description: 'Undefined with default' 
  },
  { 
    input: '', 
    options: { defaultValue: ['default'] }, 
    expected: ['default'], 
    description: 'Empty string with default' 
  },
  
  // Error cases (no default value)
  { 
    input: undefined, 
    expectedError: 'Cannot parse undefined or empty string to array', 
    description: 'Undefined without default' 
  },
  { 
    input: '', 
    expectedError: 'Cannot parse undefined or empty string to array', 
    description: 'Empty string without default' 
  },
];

/**
 * Test cases for parseJson function
 */
export const jsonTransformationCases = [
  // Basic JSON objects
  { 
    input: '{"name":"John","age":30}', 
    expected: { name: 'John', age: 30 }, 
    description: 'Simple JSON object' 
  },
  { 
    input: '{"items":[1,2,3],"enabled":true}', 
    expected: { items: [1, 2, 3], enabled: true }, 
    description: 'JSON object with array and boolean' 
  },
  { 
    input: '{"nested":{"key":"value"}}', 
    expected: { nested: { key: 'value' } }, 
    description: 'Nested JSON object' 
  },
  
  // With schema validation
  { 
    input: '{"name":"John","age":30}', 
    schema: z.object({ name: z.string(), age: z.number() }), 
    expected: { name: 'John', age: 30 }, 
    description: 'JSON with valid schema' 
  },
  { 
    input: '{"name":"John","age":"30"}', 
    schema: z.object({ name: z.string(), age: z.number() }), 
    expectedError: 'JSON validation failed: age: Expected number, received string', 
    description: 'JSON with invalid schema (wrong type)' 
  },
  { 
    input: '{"name":"John"}', 
    schema: z.object({ name: z.string(), age: z.number() }), 
    expectedError: 'JSON validation failed: age: Required', 
    description: 'JSON with invalid schema (missing required field)' 
  },
  { 
    input: '{"name":"John","age":"30"}', 
    schema: z.object({ name: z.string(), age: z.number() }), 
    defaultValue: { name: 'Default', age: 25 }, 
    expected: { name: 'Default', age: 25 }, 
    description: 'JSON with invalid schema but with default value' 
  },
  
  // Default value cases
  { 
    input: undefined, 
    defaultValue: { name: 'Default' }, 
    expected: { name: 'Default' }, 
    description: 'Undefined with default' 
  },
  { 
    input: '', 
    defaultValue: { name: 'Default' }, 
    expected: { name: 'Default' }, 
    description: 'Empty string with default' 
  },
  { 
    input: 'not-json', 
    defaultValue: { name: 'Default' }, 
    expected: { name: 'Default' }, 
    description: 'Invalid JSON with default' 
  },
  
  // Error cases (no default value)
  { 
    input: undefined, 
    expectedError: 'Cannot parse undefined or empty string to JSON', 
    description: 'Undefined without default' 
  },
  { 
    input: '', 
    expectedError: 'Cannot parse undefined or empty string to JSON', 
    description: 'Empty string without default' 
  },
  { 
    input: 'not-json', 
    expectedError: 'Cannot parse value to JSON: Unexpected token o in JSON at position 1', 
    description: 'Invalid JSON without default' 
  },
];

/**
 * Test cases for parseUrl function
 */
export const urlTransformationCases = [
  // Basic URLs
  { 
    input: 'https://example.com', 
    expected: new URL('https://example.com'), 
    description: 'Simple HTTPS URL' 
  },
  { 
    input: 'http://example.com/path', 
    expected: new URL('http://example.com/path'), 
    description: 'HTTP URL with path' 
  },
  { 
    input: 'https://example.com/path?query=value', 
    expected: new URL('https://example.com/path?query=value'), 
    description: 'URL with query parameters' 
  },
  { 
    input: 'https://user:pass@example.com', 
    expected: new URL('https://user:pass@example.com'), 
    description: 'URL with authentication' 
  },
  
  // Protocol validation
  { 
    input: 'https://example.com', 
    options: { protocols: ['https'] }, 
    expected: new URL('https://example.com'), 
    description: 'URL with allowed protocol' 
  },
  { 
    input: 'http://example.com', 
    options: { protocols: ['https'] }, 
    expectedError: 'URL protocol "http" is not allowed. Allowed protocols: https', 
    description: 'URL with disallowed protocol' 
  },
  { 
    input: 'http://example.com', 
    options: { protocols: ['https'], defaultValue: new URL('https://default.com') }, 
    expected: new URL('https://default.com'), 
    description: 'URL with disallowed protocol but with default' 
  },
  
  // TLD validation
  { 
    input: 'http://example', 
    options: { requireTld: true }, 
    expectedError: 'URL must include a top-level domain', 
    description: 'URL without TLD when required' 
  },
  { 
    input: 'http://example', 
    options: { requireTld: false }, 
    expected: new URL('http://example'), 
    description: 'URL without TLD when not required' 
  },
  { 
    input: 'http://localhost:3000', 
    options: { requireTld: false }, 
    expected: new URL('http://localhost:3000'), 
    description: 'Localhost URL without TLD' 
  },
  
  // Default value cases
  { 
    input: undefined, 
    options: { defaultValue: new URL('https://default.com') }, 
    expected: new URL('https://default.com'), 
    description: 'Undefined with default' 
  },
  { 
    input: '', 
    options: { defaultValue: new URL('https://default.com') }, 
    expected: new URL('https://default.com'), 
    description: 'Empty string with default' 
  },
  { 
    input: 'not-a-url', 
    options: { defaultValue: new URL('https://default.com') }, 
    expected: new URL('https://default.com'), 
    description: 'Invalid URL with default' 
  },
  
  // Error cases (no default value)
  { 
    input: undefined, 
    expectedError: 'Cannot parse undefined or empty string to URL', 
    description: 'Undefined without default' 
  },
  { 
    input: '', 
    expectedError: 'Cannot parse undefined or empty string to URL', 
    description: 'Empty string without default' 
  },
  { 
    input: 'not-a-url', 
    expectedError: 'Invalid URL: not-a-url', 
    description: 'Invalid URL without default' 
  },
];

/**
 * Test cases for parseRange function
 */
export const rangeTransformationCases = [
  // Single number (becomes [n, n])
  { 
    input: '5', 
    expected: [5, 5], 
    description: 'Single number becomes [n, n]' 
  },
  { 
    input: '-10', 
    expected: [-10, -10], 
    description: 'Single negative number' 
  },
  { 
    input: '0', 
    expected: [0, 0], 
    description: 'Single zero' 
  },
  
  // Hyphen ranges
  { 
    input: '5-10', 
    expected: [5, 10], 
    description: 'Simple range with hyphen' 
  },
  { 
    input: '-10-5', 
    expected: [-10, 5], 
    description: 'Range with negative start' 
  },
  { 
    input: '-10--5', 
    expected: [-10, -5], 
    description: 'Range with negative start and end' 
  },
  { 
    input: '0-0', 
    expected: [0, 0], 
    description: 'Zero range' 
  },
  
  // Colon ranges
  { 
    input: '5:10', 
    expected: [5, 10], 
    description: 'Simple range with colon' 
  },
  { 
    input: '-10:5', 
    expected: [-10, 5], 
    description: 'Colon range with negative start' 
  },
  { 
    input: '-10:-5', 
    expected: [-10, -5], 
    description: 'Colon range with negative start and end' 
  },
  
  // Custom separator
  { 
    input: '5|10', 
    options: { separator: '|' }, 
    expected: [5, 10], 
    description: 'Range with custom separator' 
  },
  
  // Range validation
  { 
    input: '5-10', 
    options: { min: 0, max: 20 }, 
    expected: [5, 10], 
    description: 'Range within allowed bounds' 
  },
  { 
    input: '5-10', 
    options: { min: 10, max: 20 }, 
    expectedError: 'Minimum value 5 is less than allowed minimum 10', 
    description: 'Range with start below minimum' 
  },
  { 
    input: '5-10', 
    options: { min: 0, max: 8 }, 
    expectedError: 'Maximum value 10 is greater than allowed maximum 8', 
    description: 'Range with end above maximum' 
  },
  { 
    input: '10-5', 
    expectedError: 'Invalid range: minimum value 10 is greater than maximum value 5', 
    description: 'Invalid range (min > max)' 
  },
  
  // Default value cases
  { 
    input: undefined, 
    options: { defaultValue: [1, 10] }, 
    expected: [1, 10], 
    description: 'Undefined with default' 
  },
  { 
    input: '', 
    options: { defaultValue: [1, 10] }, 
    expected: [1, 10], 
    description: 'Empty string with default' 
  },
  { 
    input: 'not-a-range', 
    options: { defaultValue: [1, 10] }, 
    expected: [1, 10], 
    description: 'Invalid range with default' 
  },
  { 
    input: '10-5', 
    options: { defaultValue: [1, 10] }, 
    expected: [1, 10], 
    description: 'Invalid range (min > max) with default' 
  },
  
  // Error cases (no default value)
  { 
    input: undefined, 
    expectedError: 'Cannot parse undefined or empty string to range', 
    description: 'Undefined without default' 
  },
  { 
    input: '', 
    expectedError: 'Cannot parse undefined or empty string to range', 
    description: 'Empty string without default' 
  },
  { 
    input: 'not-a-range', 
    expectedError: 'Cannot parse value "not-a-range" to number', 
    description: 'Invalid range without default' 
  },
];

/**
 * Test cases for parseEnum function
 */
export const enumTransformationCases = [
  // Basic enum parsing
  { 
    input: 'apple', 
    enumValues: ['apple', 'banana', 'cherry'] as const, 
    expected: 'apple', 
    description: 'Valid enum value' 
  },
  { 
    input: 'banana', 
    enumValues: ['apple', 'banana', 'cherry'] as const, 
    expected: 'banana', 
    description: 'Valid enum value' 
  },
  { 
    input: 'cherry', 
    enumValues: ['apple', 'banana', 'cherry'] as const, 
    expected: 'cherry', 
    description: 'Valid enum value' 
  },
  
  // Case sensitivity
  { 
    input: 'APPLE', 
    enumValues: ['apple', 'banana', 'cherry'] as const, 
    expected: 'apple', 
    description: 'Case-insensitive match (default)' 
  },
  { 
    input: 'APPLE', 
    enumValues: ['apple', 'banana', 'cherry'] as const, 
    options: { caseSensitive: true }, 
    expectedError: 'Value "APPLE" is not in allowed enum values: apple, banana, cherry', 
    description: 'Case-sensitive match fails' 
  },
  { 
    input: 'Apple', 
    enumValues: ['Apple', 'Banana', 'Cherry'] as const, 
    options: { caseSensitive: true }, 
    expected: 'Apple', 
    description: 'Case-sensitive match succeeds' 
  },
  
  // Whitespace handling
  { 
    input: ' apple ', 
    enumValues: ['apple', 'banana', 'cherry'] as const, 
    expected: 'apple', 
    description: 'Value with whitespace' 
  },
  
  // Default value cases
  { 
    input: undefined, 
    enumValues: ['apple', 'banana', 'cherry'] as const, 
    options: { defaultValue: 'banana' }, 
    expected: 'banana', 
    description: 'Undefined with default' 
  },
  { 
    input: '', 
    enumValues: ['apple', 'banana', 'cherry'] as const, 
    options: { defaultValue: 'banana' }, 
    expected: 'banana', 
    description: 'Empty string with default' 
  },
  { 
    input: 'orange', 
    enumValues: ['apple', 'banana', 'cherry'] as const, 
    options: { defaultValue: 'banana' }, 
    expected: 'banana', 
    description: 'Invalid enum value with default' 
  },
  
  // Error cases (no default value)
  { 
    input: undefined, 
    enumValues: ['apple', 'banana', 'cherry'] as const, 
    expectedError: 'Cannot parse undefined or empty string to enum. Allowed values: apple, banana, cherry', 
    description: 'Undefined without default' 
  },
  { 
    input: '', 
    enumValues: ['apple', 'banana', 'cherry'] as const, 
    expectedError: 'Cannot parse undefined or empty string to enum. Allowed values: apple, banana, cherry', 
    description: 'Empty string without default' 
  },
  { 
    input: 'orange', 
    enumValues: ['apple', 'banana', 'cherry'] as const, 
    expectedError: 'Value "orange" is not in allowed enum values: apple, banana, cherry', 
    description: 'Invalid enum value without default' 
  },
];

/**
 * Combined test cases for all transformation functions
 */
export const transformationCases = {
  boolean: booleanTransformationCases,
  number: numberTransformationCases,
  array: arrayTransformationCases,
  json: jsonTransformationCases,
  url: urlTransformationCases,
  range: rangeTransformationCases,
  enum: enumTransformationCases,
};

export default transformationCases;