/**
 * Test cases for environment variable type transformations
 * 
 * This module provides test fixtures for validating the transformation functions
 * in the env/transform.ts module. Each set of test cases includes valid inputs
 * with expected outputs and invalid inputs to test error handling.
 */

/**
 * Test cases for boolean transformation (parseBoolean)
 */
export const booleanTransformationCases = {
  valid: [
    { input: 'true', expected: true },
    { input: 'TRUE', expected: true },
    { input: 'True', expected: true },
    { input: '1', expected: true },
    { input: 'yes', expected: true },
    { input: 'YES', expected: true },
    { input: 'y', expected: true },
    { input: 'on', expected: true },
    { input: 'ON', expected: true },
    { input: 'false', expected: false },
    { input: 'FALSE', expected: false },
    { input: 'False', expected: false },
    { input: '0', expected: false },
    { input: 'no', expected: false },
    { input: 'NO', expected: false },
    { input: 'n', expected: false },
    { input: 'off', expected: false },
    { input: 'OFF', expected: false },
    { input: '', expected: false },
    { input: ' ', expected: false },
    // Edge cases
    { input: 'truthy', expected: false },
    { input: 'falsey', expected: false },
    { input: 'enabled', expected: false },
    { input: 'disabled', expected: false },
  ],
  // No invalid cases for parseBoolean as it always returns a boolean value
  // and never throws errors
};

/**
 * Test cases for number transformation (parseNumber)
 */
export const numberTransformationCases = {
  valid: [
    { input: '0', expected: 0 },
    { input: '1', expected: 1 },
    { input: '-1', expected: -1 },
    { input: '123', expected: 123 },
    { input: '-123', expected: -123 },
    { input: '0.5', expected: 0.5 },
    { input: '-0.5', expected: -0.5 },
    { input: '3.14159', expected: 3.14159 },
    { input: '1e3', expected: 1000 },
    { input: '1.5e2', expected: 150 },
    { input: '0xFF', expected: 255 },
    { input: ' 42 ', expected: 42 }, // Trimmed spaces
    // Edge cases
    { input: '9007199254740991', expected: 9007199254740991 }, // MAX_SAFE_INTEGER
    { input: '-9007199254740991', expected: -9007199254740991 }, // MIN_SAFE_INTEGER
    { input: '1.7976931348623157e+308', expected: 1.7976931348623157e+308 }, // MAX_VALUE
    { input: '5e-324', expected: 5e-324 }, // MIN_VALUE (positive)
  ],
  invalid: [
    { input: '', errorMessage: 'Cannot parse empty value to number' },
    { input: ' ', errorMessage: 'Cannot parse empty value to number' },
    { input: 'abc', errorMessage: 'Cannot parse value "abc" to number' },
    { input: '123abc', errorMessage: 'Cannot parse value "123abc" to number' },
    { input: 'true', errorMessage: 'Cannot parse value "true" to number' },
    { input: 'NaN', errorMessage: 'Cannot parse value "NaN" to number' },
    { input: 'Infinity', errorMessage: 'Cannot parse value "Infinity" to number' },
    { input: '-Infinity', errorMessage: 'Cannot parse value "-Infinity" to number' },
    { input: '1,000', errorMessage: 'Cannot parse value "1,000" to number' },
    { input: '1.2.3', errorMessage: 'Cannot parse value "1.2.3" to number' },
  ],
  withDefault: [
    { input: '', defaultValue: 42, expected: 42 },
    { input: 'abc', defaultValue: 42, expected: 42 },
    { input: '123abc', defaultValue: 42, expected: 42 },
    { input: 'NaN', defaultValue: 42, expected: 42 },
  ],
};

/**
 * Test cases for array transformation (parseArray)
 */
export const arrayTransformationCases = {
  valid: [
    { input: 'a,b,c', expected: ['a', 'b', 'c'] },
    { input: 'a, b, c', expected: ['a', 'b', 'c'] }, // With spaces
    { input: 'a,b,c,', expected: ['a', 'b', 'c'] }, // Trailing comma
    { input: ',a,b,c', expected: ['a', 'b', 'c'] }, // Leading comma
    { input: 'a,,c', expected: ['a', 'c'] }, // Empty item filtered
    { input: 'a', expected: ['a'] }, // Single item
    { input: '', expected: [] }, // Empty string
    { input: ' ', expected: [] }, // Just whitespace
    // Custom delimiter
    { input: 'a|b|c', delimiter: '|', expected: ['a', 'b', 'c'] },
    { input: 'a;b;c', delimiter: ';', expected: ['a', 'b', 'c'] },
    { input: 'a b c', delimiter: ' ', expected: ['a', 'b', 'c'] },
    // Edge cases
    { input: 'a\,b,c', expected: ['a\,b', 'c'] }, // Escaped comma in item
    { input: '"a,b",c', expected: ['"a,b"', 'c'] }, // Quoted item with comma
    { input: 'a\nb\nc', delimiter: '\n', expected: ['a', 'b', 'c'] }, // Newline delimiter
  ],
  // No invalid cases for parseArray as it always returns an array
  // and never throws errors
};

/**
 * Test cases for number array transformation (parseNumberArray)
 */
export const numberArrayTransformationCases = {
  valid: [
    { input: '1,2,3', expected: [1, 2, 3] },
    { input: '1, 2, 3', expected: [1, 2, 3] }, // With spaces
    { input: '1,2,3,', expected: [1, 2, 3] }, // Trailing comma
    { input: ',1,2,3', expected: [1, 2, 3] }, // Leading comma
    { input: '1,,3', expected: [1, 3] }, // Empty item filtered
    { input: '1', expected: [1] }, // Single item
    { input: '', expected: [] }, // Empty string
    { input: ' ', expected: [] }, // Just whitespace
    // Decimal numbers
    { input: '1.5,2.5,3.5', expected: [1.5, 2.5, 3.5] },
    // Negative numbers
    { input: '-1,-2,-3', expected: [-1, -2, -3] },
    // Scientific notation
    { input: '1e2,1e3,1e4', expected: [100, 1000, 10000] },
    // Custom delimiter
    { input: '1|2|3', delimiter: '|', expected: [1, 2, 3] },
    { input: '1;2;3', delimiter: ';', expected: [1, 2, 3] },
    { input: '1 2 3', delimiter: ' ', expected: [1, 2, 3] },
  ],
  invalid: [
    { input: '1,a,3', errorMessage: 'Cannot parse array item at index 1 ("a") to number' },
    { input: 'a,2,3', errorMessage: 'Cannot parse array item at index 0 ("a") to number' },
    { input: '1,2,a', errorMessage: 'Cannot parse array item at index 2 ("a") to number' },
    { input: '1,2,3a', errorMessage: 'Cannot parse array item at index 2 ("3a") to number' },
    { input: '1,NaN,3', errorMessage: 'Cannot parse array item at index 1 ("NaN") to number' },
    { input: '1,Infinity,3', errorMessage: 'Cannot parse array item at index 1 ("Infinity") to number' },
    { input: '1,true,3', errorMessage: 'Cannot parse array item at index 1 ("true") to number' },
  ],
};

/**
 * Test cases for JSON transformation (parseJson)
 */
export const jsonTransformationCases = {
  valid: [
    { input: '{"name":"test"}', expected: { name: 'test' } },
    { input: '{"count":42}', expected: { count: 42 } },
    { input: '{"active":true}', expected: { active: true } },
    { input: '{"items":[1,2,3]}', expected: { items: [1, 2, 3] } },
    { input: '{"nested":{"key":"value"}}', expected: { nested: { key: 'value' } } },
    { input: '[1,2,3]', expected: [1, 2, 3] },
    { input: '"string"', expected: 'string' },
    { input: 'true', expected: true },
    { input: 'false', expected: false },
    { input: 'null', expected: null },
    { input: '42', expected: 42 },
    // Complex objects
    {
      input: '{"user":{"name":"John","age":30,"active":true,"roles":["admin","user"]}}',
      expected: { user: { name: 'John', age: 30, active: true, roles: ['admin', 'user'] } }
    },
    // Arrays of objects
    {
      input: '[{"id":1,"name":"Item 1"},{"id":2,"name":"Item 2"}]',
      expected: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]
    },
  ],
  invalid: [
    { input: '', errorMessage: 'Cannot parse empty value to JSON' },
    { input: '{', errorMessage: 'Cannot parse value to JSON: Unexpected end of JSON input' },
    { input: '{"name":"test"', errorMessage: 'Cannot parse value to JSON: Unexpected end of JSON input' },
    { input: '{name:"test"}', errorMessage: 'Cannot parse value to JSON: Unexpected token n in JSON at position 1' },
    { input: 'undefined', errorMessage: 'Cannot parse value to JSON: Unexpected token u in JSON at position 0' },
    { input: 'function(){}', errorMessage: 'Cannot parse value to JSON: Unexpected token f in JSON at position 0' },
    { input: '{"date": new Date()}', errorMessage: 'Cannot parse value to JSON: Unexpected token e in JSON at position 10' },
  ],
  withDefault: [
    { input: '', defaultValue: { default: true }, expected: { default: true } },
    { input: '{', defaultValue: { default: true }, expected: { default: true } },
    { input: 'invalid', defaultValue: { default: true }, expected: { default: true } },
  ],
};

/**
 * Test cases for CSV transformation (parseCSV)
 */
export const csvTransformationCases = {
  valid: [
    {
      input: 'name,age\nJohn,30\nJane,25',
      expected: [
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' }
      ]
    },
    {
      input: 'name,age,active\nJohn,30,true\nJane,25,false',
      expected: [
        { name: 'John', age: '30', active: 'true' },
        { name: 'Jane', age: '25', active: 'false' }
      ]
    },
    // With custom delimiter
    {
      input: 'name;age\nJohn;30\nJane;25',
      options: { delimiter: ';' },
      expected: [
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' }
      ]
    },
    // Without header row
    {
      input: 'John,30\nJane,25',
      options: { headerRow: false },
      expected: [
        ['John', '30'],
        ['Jane', '25']
      ]
    },
    // Empty input
    {
      input: '',
      expected: []
    },
    // Single row
    {
      input: 'name,age\nJohn,30',
      expected: [
        { name: 'John', age: '30' }
      ]
    },
    // Missing values
    {
      input: 'name,age,active\nJohn,30,\nJane,,true',
      expected: [
        { name: 'John', age: '30', active: '' },
        { name: 'Jane', age: '', active: 'true' }
      ]
    },
  ],
  // No invalid cases for parseCSV as it handles most edge cases gracefully
};

/**
 * Test cases for range transformation (parseRange)
 */
export const rangeTransformationCases = {
  valid: [
    { input: '1-10', expected: { min: 1, max: 10 } },
    { input: '0-100', expected: { min: 0, max: 100 } },
    { input: '-10-10', expected: { min: -10, max: 10 } },
    { input: '-100--50', expected: { min: -100, max: -50 } },
    { input: '1.5-2.5', expected: { min: 1.5, max: 2.5 } },
    // Custom delimiter
    { input: '1:10', delimiter: ':', expected: { min: 1, max: 10 } },
    { input: '1..10', delimiter: '..', expected: { min: 1, max: 10 } },
    { input: '1,10', delimiter: ',', expected: { min: 1, max: 10 } },
  ],
  invalid: [
    { input: '', errorMessage: 'Invalid range format: . Expected format: min-max' },
    { input: '10', errorMessage: 'Invalid range format: 10. Expected format: min-max' },
    { input: '10-', errorMessage: 'Cannot parse empty value to number' },
    { input: '-10', errorMessage: 'Invalid range format: -10. Expected format: min-max' },
    { input: 'a-10', errorMessage: 'Cannot parse value "a" to number' },
    { input: '10-a', errorMessage: 'Cannot parse value "a" to number' },
    { input: '10-5', errorMessage: 'Invalid range: min (10) cannot be greater than max (5)' },
  ],
};

/**
 * Test cases for URL transformation (parseUrl)
 */
export const urlTransformationCases = {
  valid: [
    { input: 'https://example.com', expected: new URL('https://example.com') },
    { input: 'http://localhost:3000', expected: new URL('http://localhost:3000') },
    { input: 'https://example.com/path', expected: new URL('https://example.com/path') },
    { input: 'https://example.com/path?query=value', expected: new URL('https://example.com/path?query=value') },
    { input: 'https://user:pass@example.com', expected: new URL('https://user:pass@example.com') },
    { input: 'http://127.0.0.1:8080', expected: new URL('http://127.0.0.1:8080') },
    // With protocol validation
    {
      input: 'https://example.com',
      options: { protocols: ['https'] },
      expected: new URL('https://example.com')
    },
    // Without TLD validation
    {
      input: 'http://localhost',
      options: { requireTld: false },
      expected: new URL('http://localhost')
    },
  ],
  invalid: [
    { input: '', errorMessage: 'URL cannot be empty' },
    { input: 'example.com', errorMessage: 'Invalid URL: example.com' },
    { input: 'ftp://example.com', options: { protocols: ['http', 'https'] }, errorMessage: 'Invalid URL protocol: ftp. Expected one of: http, https' },
    { input: 'http://localhost', errorMessage: 'URL must have a valid top-level domain' },
    { input: 'not a url', errorMessage: 'Invalid URL: not a url' },
    { input: 'http:/example.com', errorMessage: 'Invalid URL: http:/example.com' },
  ],
};

/**
 * Test cases for enum transformation (parseEnum)
 */
export enum TestEnum {
  Red = 'red',
  Green = 'green',
  Blue = 'blue',
  Count = 42
}

export const enumTransformationCases = {
  valid: [
    { input: 'red', enumObject: TestEnum, expected: TestEnum.Red },
    { input: 'RED', enumObject: TestEnum, expected: TestEnum.Red },
    { input: 'Red', enumObject: TestEnum, expected: TestEnum.Red },
    { input: 'green', enumObject: TestEnum, expected: TestEnum.Green },
    { input: 'blue', enumObject: TestEnum, expected: TestEnum.Blue },
    { input: '42', enumObject: TestEnum, expected: TestEnum.Count },
    // Key matching
    { input: 'Red', enumObject: TestEnum, expected: TestEnum.Red },
    { input: 'Green', enumObject: TestEnum, expected: TestEnum.Green },
    { input: 'Blue', enumObject: TestEnum, expected: TestEnum.Blue },
    { input: 'Count', enumObject: TestEnum, expected: TestEnum.Count },
  ],
  invalid: [
    { input: '', enumObject: TestEnum, errorMessage: 'Cannot parse empty value to enum' },
    { input: 'yellow', enumObject: TestEnum, errorMessage: 'Invalid enum value: yellow. Expected one of: red, green, blue, 42' },
    { input: '43', enumObject: TestEnum, errorMessage: 'Invalid enum value: 43. Expected one of: red, green, blue, 42' },
  ],
  withDefault: [
    { input: '', enumObject: TestEnum, defaultValue: TestEnum.Red, expected: TestEnum.Red },
    { input: 'yellow', enumObject: TestEnum, defaultValue: TestEnum.Blue, expected: TestEnum.Blue },
  ],
};

/**
 * Test cases for duration transformation (parseDuration)
 */
export const durationTransformationCases = {
  valid: [
    { input: '1d', expected: 86400000 }, // 1 day in ms
    { input: '2h', expected: 7200000 }, // 2 hours in ms
    { input: '30m', expected: 1800000 }, // 30 minutes in ms
    { input: '45s', expected: 45000 }, // 45 seconds in ms
    { input: '500ms', expected: 500 }, // 500 milliseconds
    { input: '1D', expected: 86400000 }, // Case insensitive
    { input: '1H', expected: 3600000 },
    { input: '1M', expected: 60000 },
    { input: '1S', expected: 1000 },
    { input: '1MS', expected: 1 },
    // Plain milliseconds
    { input: '1000', expected: 1000 },
    // Combined units not supported in the current implementation
  ],
  invalid: [
    { input: '', errorMessage: 'Duration string cannot be empty' },
    { input: 'abc', errorMessage: 'Invalid duration format: abc. Expected format: <number><unit> (e.g., 1d, 2h, 30m, 45s, 500ms)' },
    { input: '1x', errorMessage: 'Invalid duration format: 1x. Expected format: <number><unit> (e.g., 1d, 2h, 30m, 45s, 500ms)' },
    { input: 'd', errorMessage: 'Invalid duration format: d. Expected format: <number><unit> (e.g., 1d, 2h, 30m, 45s, 500ms)' },
    { input: '1.5d', errorMessage: 'Invalid duration format: 1.5d. Expected format: <number><unit> (e.g., 1d, 2h, 30m, 45s, 500ms)' },
    { input: '-1d', errorMessage: 'Invalid duration format: -1d. Expected format: <number><unit> (e.g., 1d, 2h, 30m, 45s, 500ms)' },
  ],
};

/**
 * Test cases for memory size transformation (parseMemorySize)
 */
export const memorySizeTransformationCases = {
  valid: [
    { input: '1B', expected: 1 }, // 1 byte
    { input: '1KB', expected: 1024 }, // 1 kilobyte
    { input: '1MB', expected: 1048576 }, // 1 megabyte
    { input: '1GB', expected: 1073741824 }, // 1 gigabyte
    { input: '1TB', expected: 1099511627776 }, // 1 terabyte
    { input: '1K', expected: 1024 }, // Short form
    { input: '1M', expected: 1048576 },
    { input: '1G', expected: 1073741824 },
    { input: '1T', expected: 1099511627776 },
    { input: '1.5KB', expected: 1536 }, // Decimal values
    { input: '1.5MB', expected: 1572864 },
    { input: '1.5GB', expected: 1610612736 },
    { input: '1.5TB', expected: 1649267441664 },
    { input: '1kb', expected: 1024 }, // Case insensitive
    { input: '1mb', expected: 1048576 },
    { input: '1gb', expected: 1073741824 },
    { input: '1tb', expected: 1099511627776 },
    // Plain bytes
    { input: '1024', expected: 1024 },
    // With spaces
    { input: '1 KB', expected: 1024 },
    { input: '1 MB', expected: 1048576 },
  ],
  invalid: [
    { input: '', errorMessage: 'Memory size string cannot be empty' },
    { input: 'abc', errorMessage: 'Invalid memory size format: abc. Expected format: <number><unit> (e.g., 1B, 2KB, 5MB, 1GB)' },
    { input: '1XB', errorMessage: 'Invalid memory size format: 1XB. Expected format: <number><unit> (e.g., 1B, 2KB, 5MB, 1GB)' },
    { input: 'KB', errorMessage: 'Invalid memory size format: KB. Expected format: <number><unit> (e.g., 1B, 2KB, 5MB, 1GB)' },
    { input: '-1KB', errorMessage: 'Invalid memory size format: -1KB. Expected format: <number><unit> (e.g., 1B, 2KB, 5MB, 1GB)' },
  ],
};

/**
 * Test cases for generic transformation (transform)
 */
export const genericTransformationCases = {
  valid: [
    {
      input: 'test',
      transformFn: (val: string) => val.toUpperCase(),
      expected: 'TEST'
    },
    {
      input: '42',
      transformFn: (val: string) => parseInt(val, 10) * 2,
      expected: 84
    },
    {
      input: 'a,b,c',
      transformFn: (val: string) => val.split(','),
      expected: ['a', 'b', 'c']
    },
    {
      input: 'true',
      transformFn: (val: string) => val === 'true',
      expected: true
    },
  ],
  invalid: [
    {
      input: '',
      transformFn: (val: string) => { throw new Error('Test error'); },
      errorMessage: 'Transformation failed: Test error'
    },
    {
      input: null as any,
      transformFn: (val: string) => val.toUpperCase(),
      errorMessage: 'Cannot transform undefined or null value'
    },
    {
      input: undefined as any,
      transformFn: (val: string) => val.toUpperCase(),
      errorMessage: 'Cannot transform undefined or null value'
    },
  ],
  withDefault: [
    {
      input: '',
      transformFn: (val: string) => { throw new Error('Test error'); },
      defaultValue: 'default',
      expected: 'default'
    },
    {
      input: null as any,
      transformFn: (val: string) => val.toUpperCase(),
      defaultValue: 'default',
      expected: 'default'
    },
  ],
};

/**
 * Combined export of all transformation test cases
 */
export const transformationTestCases = {
  boolean: booleanTransformationCases,
  number: numberTransformationCases,
  array: arrayTransformationCases,
  numberArray: numberArrayTransformationCases,
  json: jsonTransformationCases,
  csv: csvTransformationCases,
  range: rangeTransformationCases,
  url: urlTransformationCases,
  enum: enumTransformationCases,
  duration: durationTransformationCases,
  memorySize: memorySizeTransformationCases,
  generic: genericTransformationCases,
};