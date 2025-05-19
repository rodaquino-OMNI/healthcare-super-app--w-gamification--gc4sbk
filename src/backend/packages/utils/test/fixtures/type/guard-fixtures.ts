/**
 * Test fixtures for type guard utility functions.
 * 
 * This file provides comprehensive test fixtures for validating the behavior of type guard
 * utility functions across a variety of inputs, including standard values, edge cases,
 * and invalid inputs. These fixtures are critical for verifying the accuracy and robustness
 * of type detection across the application, particularly for dynamic data flowing between
 * journey services.
 */

/**
 * String test fixtures for isString, isNonEmptyString, etc.
 */
export const STRING_FIXTURES = {
  // Positive test cases
  valid: [
    'hello',                // Regular string
    '',                     // Empty string
    ' ',                    // Whitespace string
    '123',                  // Numeric string
    'null',                 // String that looks like null
    'undefined',            // String that looks like undefined
    String(123),            // String created with constructor
    `template literal`,     // Template literal
    '🚀',                   // Emoji string
    '\u0000',               // String with null character
  ],
  // Negative test cases
  invalid: [
    null,                   // Null
    undefined,              // Undefined
    123,                    // Number
    true,                   // Boolean
    false,                  // Boolean
    {},                     // Object
    [],                     // Array
    new Date(),             // Date
    /regex/,                // RegExp
    () => {},               // Function
    Symbol('symbol'),       // Symbol
    new Map(),              // Map
    new Set(),              // Set
  ],
  // Specific fixtures for isNonEmptyString
  nonEmpty: [
    'hello',               // Regular string
    '123',                  // Numeric string
    ' a ',                  // String with whitespace
    '🚀',                   // Emoji string
  ],
  empty: [
    '',                    // Empty string
    ' ',                    // Whitespace only
    '\t\n',                 // Tabs and newlines
  ],
  // Specific fixtures for isEmail
  validEmails: [
    'user@example.com',
    'first.last@example.co.uk',
    'user+tag@example.org',
    'user@subdomain.example.com',
  ],
  invalidEmails: [
    'user@',                // Missing domain
    '@example.com',         // Missing username
    'user@.com',            // Missing domain part
    'user@example',         // Missing TLD
    'user example.com',     // Missing @ symbol
    'user@@example.com',    // Double @ symbol
  ],
  // Specific fixtures for isUrl
  validUrls: [
    'https://example.com',
    'http://localhost:3000',
    'https://subdomain.example.co.uk/path?query=value#fragment',
    'ftp://files.example.org',
  ],
  invalidUrls: [
    'example.com',          // Missing protocol
    'https://',             // Missing domain
    'https://example',      // Incomplete URL
    'http:/example.com',    // Malformed URL
    'https:example.com',    // Malformed URL
  ],
};

/**
 * Number test fixtures for isNumber, isInteger, isPositive, isNegative, isNumeric, etc.
 */
export const NUMBER_FIXTURES = {
  // Positive test cases
  valid: [
    0,                      // Zero
    1,                      // Positive integer
    -1,                     // Negative integer
    0.5,                    // Decimal
    -0.5,                   // Negative decimal
    Number.MAX_SAFE_INTEGER, // Max safe integer
    Number.MIN_SAFE_INTEGER, // Min safe integer
    Number.MAX_VALUE,       // Max value
    Number.MIN_VALUE,       // Min value
    Number(123),            // Number created with constructor
    Infinity,               // Infinity
    -Infinity,              // Negative Infinity
  ],
  // Negative test cases
  invalid: [
    NaN,                    // Not a Number
    null,                   // Null
    undefined,              // Undefined
    '123',                  // String number
    '',                     // Empty string
    true,                   // Boolean
    false,                  // Boolean
    {},                     // Object
    [],                     // Array
    new Date(),             // Date
    () => {},               // Function
    Symbol('symbol'),       // Symbol
  ],
  // Specific fixtures for isInteger
  integers: [
    0,                      // Zero
    1,                      // Positive integer
    -1,                     // Negative integer
    Number.MAX_SAFE_INTEGER, // Max safe integer
    Number.MIN_SAFE_INTEGER, // Min safe integer
  ],
  nonIntegers: [
    0.5,                    // Decimal
    -0.5,                   // Negative decimal
    Math.PI,                // PI
    Number.EPSILON,         // Epsilon
  ],
  // Specific fixtures for isPositive
  positive: [
    1,                      // Positive integer
    0.5,                    // Positive decimal
    Number.MAX_VALUE,       // Max value
    Number.MIN_VALUE,       // Min positive value
    Infinity,               // Infinity
  ],
  // Specific fixtures for isNegative
  negative: [
    -1,                     // Negative integer
    -0.5,                   // Negative decimal
    -Number.MAX_VALUE,      // Negative max value
    -Infinity,              // Negative Infinity
  ],
  // Specific fixtures for isNumeric
  numeric: [
    // Numbers
    0,                      // Zero
    1,                      // Positive integer
    -1,                     // Negative integer
    0.5,                    // Decimal
    // Numeric strings
    '0',                    // Zero string
    '1',                    // Positive integer string
    '-1',                   // Negative integer string
    '0.5',                  // Decimal string
    '-0.5',                 // Negative decimal string
    '1e3',                  // Scientific notation string
    '0xFF',                 // Hex string
  ],
  nonNumeric: [
    '',                     // Empty string
    ' ',                    // Whitespace string
    'abc',                  // Alphabetic string
    '1a',                   // Alphanumeric string
    '1,000',                // Formatted number string
    '1.2.3',                // Invalid number format
    NaN,                    // Not a Number
    null,                   // Null
    undefined,              // Undefined
  ],
  // Edge cases for number testing
  edgeCases: [
    0,                      // Zero
    -0,                     // Negative zero
    Number.EPSILON,         // Smallest positive number greater than 0
    Number.MIN_VALUE,       // Smallest positive value
    Number.MAX_VALUE,       // Largest positive value
    Number.POSITIVE_INFINITY, // Positive infinity
    Number.NEGATIVE_INFINITY, // Negative infinity
  ],
};

/**
 * Boolean test fixtures for isBoolean
 */
export const BOOLEAN_FIXTURES = {
  // Positive test cases
  valid: [
    true,                   // True
    false,                  // False
    Boolean(1),             // True created with constructor
    Boolean(0),             // False created with constructor
    !0,                     // True created with logical NOT
    !1,                     // False created with logical NOT
  ],
  // Negative test cases
  invalid: [
    null,                   // Null
    undefined,              // Undefined
    0,                      // Zero
    1,                      // One
    '',                     // Empty string
    'true',                 // String 'true'
    'false',                // String 'false'
    {},                     // Object
    [],                     // Array
    NaN,                    // Not a Number
    new Date(),             // Date
    () => {},               // Function
    Symbol('symbol'),       // Symbol
  ],
};

/**
 * Array test fixtures for isArray, isNonEmptyArray, isArrayOf
 */
export const ARRAY_FIXTURES = {
  // Positive test cases
  valid: [
    [],                     // Empty array
    [1, 2, 3],              // Number array
    ['a', 'b', 'c'],        // String array
    [true, false],          // Boolean array
    [null, undefined],      // Null/undefined array
    [{}],                   // Object array
    [[]],                   // Nested array
    new Array(),            // Array created with constructor
    new Array(3),           // Pre-sized array
    Array.from('abc'),      // Array created with from
    Array.of(1, 2, 3),      // Array created with of
  ],
  // Negative test cases
  invalid: [
    null,                   // Null
    undefined,              // Undefined
    {},                     // Object
    '',                     // Empty string
    'abc',                  // String
    123,                    // Number
    true,                   // Boolean
    new Set([1, 2, 3]),     // Set
    new Map(),              // Map
    { length: 3 },          // Array-like object
    arguments,              // Arguments object (in function context)
  ],
  // Specific fixtures for isNonEmptyArray
  nonEmpty: [
    [1],                    // Single item array
    [1, 2, 3],              // Multiple item array
    [''],                   // Array with empty string
    [null],                 // Array with null
    [undefined],            // Array with undefined
  ],
  empty: [
    [],                     // Empty array
    new Array(),            // Empty array from constructor
    Array.from(''),         // Empty array from empty string
  ],
  // Specific fixtures for isArrayOf
  stringArrays: [
    ['a', 'b', 'c'],        // All strings
    [''],                   // Empty string array
  ],
  numberArrays: [
    [1, 2, 3],              // All numbers
    [0, -1, 0.5],           // Mixed numbers
  ],
  booleanArrays: [
    [true, false],          // All booleans
  ],
  mixedArrays: [
    [1, 'a', true],         // Mixed types
    [null, undefined, 0],   // Mixed with null/undefined
  ],
};

/**
 * Object test fixtures for isObject, isPlainObject, isRecordOf
 */
export const OBJECT_FIXTURES = {
  // Positive test cases
  valid: [
    {},                     // Empty object
    { a: 1 },               // Simple object
    { a: { b: 2 } },        // Nested object
    Object.create(null),    // Object with null prototype
    new Object(),           // Object created with constructor
    new Date(),             // Date object
    /regex/,                // RegExp object
    new Map(),              // Map object
    new Set(),              // Set object
    new Error(),            // Error object
    new Promise(() => {}),  // Promise object
  ],
  // Negative test cases
  invalid: [
    null,                   // Null
    undefined,              // Undefined
    [],                     // Array
    '',                     // Empty string
    'abc',                  // String
    123,                    // Number
    true,                   // Boolean
    Symbol('symbol'),       // Symbol
    () => {},               // Function
  ],
  // Specific fixtures for isPlainObject
  plainObjects: [
    {},                     // Empty object
    { a: 1 },               // Simple object
    { a: { b: 2 } },        // Nested object
    Object.create(null),    // Object with null prototype
    new Object(),           // Object created with constructor
  ],
  nonPlainObjects: [
    [],                     // Array
    new Date(),             // Date object
    /regex/,                // RegExp object
    new Map(),              // Map object
    new Set(),              // Set object
    new Error(),            // Error object
    new Promise(() => {}),  // Promise object
    Object.create({}),      // Object with custom prototype
  ],
  // Specific fixtures for isRecordOf
  stringRecords: [
    { a: 'a', b: 'b' },     // All string values
    { a: '' },              // Empty string value
  ],
  numberRecords: [
    { a: 1, b: 2 },          // All number values
    { a: 0, b: -1, c: 0.5 }, // Mixed number values
  ],
  booleanRecords: [
    { a: true, b: false },   // All boolean values
  ],
  mixedRecords: [
    { a: 1, b: 'a', c: true }, // Mixed type values
    { a: null, b: undefined }, // With null/undefined
  ],
};

/**
 * Function test fixtures for isFunction
 */
export const FUNCTION_FIXTURES = {
  // Positive test cases
  valid: [
    function() {},          // Function declaration
    () => {},               // Arrow function
    function* () {},        // Generator function
    async function() {},    // Async function
    async () => {},         // Async arrow function
    Function('return 0'),   // Function constructor
    class A {},             // Class (is a function)
    Object.prototype.toString, // Built-in method
    new Function(),         // Function created with constructor
  ],
  // Negative test cases
  invalid: [
    null,                   // Null
    undefined,              // Undefined
    {},                     // Object
    [],                     // Array
    '',                     // Empty string
    'function() {}',        // String that looks like a function
    123,                    // Number
    true,                   // Boolean
    Symbol('symbol'),       // Symbol
    new Date(),             // Date
  ],
};

/**
 * Date test fixtures for isDate
 */
export const DATE_FIXTURES = {
  // Positive test cases
  valid: [
    new Date(),             // Current date
    new Date('2023-01-01'), // Date from string
    new Date(2023, 0, 1),   // Date from year, month, day
    new Date(0),            // Epoch date
  ],
  // Negative test cases
  invalid: [
    null,                   // Null
    undefined,              // Undefined
    {},                     // Object
    [],                     // Array
    '',                     // Empty string
    '2023-01-01',           // Date string
    123,                    // Timestamp number
    true,                   // Boolean
    Symbol('symbol'),       // Symbol
    new Date('invalid'),    // Invalid date (returns NaN internally)
  ],
};

/**
 * Promise test fixtures for isPromise
 */
export const PROMISE_FIXTURES = {
  // Positive test cases
  valid: [
    Promise.resolve(),      // Resolved promise
    Promise.reject().catch(() => {}), // Rejected promise (with catch)
    new Promise(() => {}),  // New promise
    (async () => {})(),     // Promise from async function
  ],
  // Negative test cases
  invalid: [
    null,                   // Null
    undefined,              // Undefined
    {},                     // Object
    { then: 123 },          // Object with non-function then
    { then: () => {} },     // Thenable but not a real promise
    [],                     // Array
    '',                     // Empty string
    123,                    // Number
    true,                   // Boolean
    Symbol('symbol'),       // Symbol
    () => {},               // Function
    async () => {},         // Async function (not called)
  ],
};

/**
 * Null and undefined test fixtures for isNull, isUndefined, isNullOrUndefined
 */
export const NULL_UNDEFINED_FIXTURES = {
  // Null test cases
  null: [
    null,                   // Null
  ],
  notNull: [
    undefined,              // Undefined
    0,                      // Zero
    '',                     // Empty string
    false,                  // False
    NaN,                    // Not a Number
    {},                     // Empty object
    [],                     // Empty array
  ],
  // Undefined test cases
  undefined: [
    undefined,              // Undefined
    void 0,                 // Void operator
  ],
  notUndefined: [
    null,                   // Null
    0,                      // Zero
    '',                     // Empty string
    false,                  // False
    NaN,                    // Not a Number
    {},                     // Empty object
    [],                     // Empty array
  ],
  // Null or undefined test cases
  nullOrUndefined: [
    null,                   // Null
    undefined,              // Undefined
    void 0,                 // Void operator
  ],
  notNullOrUndefined: [
    0,                      // Zero
    '',                     // Empty string
    false,                  // False
    NaN,                    // Not a Number
    {},                     // Empty object
    [],                     // Empty array
  ],
};

/**
 * Empty value test fixtures for isEmpty, isNotEmpty
 */
export const EMPTY_FIXTURES = {
  // Empty values
  empty: [
    null,                   // Null
    undefined,              // Undefined
    '',                     // Empty string
    ' \t\n',                // Whitespace string
    [],                     // Empty array
    {},                     // Empty object
    new Map(),              // Empty Map
    new Set(),              // Empty Set
  ],
  // Non-empty values
  notEmpty: [
    'a',                    // Non-empty string
    0,                      // Zero (not empty)
    false,                  // False (not empty)
    [0],                    // Non-empty array
    { a: undefined },       // Object with properties
    new Map([['a', 1]]),    // Non-empty Map
    new Set([1]),           // Non-empty Set
  ],
};

/**
 * Primitive type test fixtures for isPrimitiveType
 */
export const PRIMITIVE_TYPE_FIXTURES = {
  string: [
    '',                     // Empty string
    'abc',                  // String
  ],
  number: [
    0,                      // Zero
    123,                    // Number
    NaN,                    // Not a Number (still a number type)
    Infinity,               // Infinity
  ],
  boolean: [
    true,                   // True
    false,                  // False
  ],
  undefined: [
    undefined,              // Undefined
  ],
  symbol: [
    Symbol(),               // Symbol
    Symbol('description'),  // Symbol with description
  ],
  bigint: [
    BigInt(0),              // BigInt zero
    BigInt(123),            // BigInt
    0n,                     // BigInt literal
  ],
  function: [
    () => {},               // Arrow function
    function() {},          // Function declaration
  ],
  object: [
    {},                     // Object
    [],                     // Array
    null,                   // Null (typeof null is 'object')
    new Date(),             // Date
  ],
};

/**
 * Comprehensive test fixtures combining all types for general testing
 */
export const MIXED_TYPE_FIXTURES = {
  allTypes: [
    // Primitives
    undefined,              // Undefined
    null,                   // Null
    '',                     // Empty string
    'abc',                  // String
    0,                      // Zero
    123,                    // Number
    true,                   // Boolean true
    false,                  // Boolean false
    Symbol('symbol'),       // Symbol
    BigInt(123),            // BigInt
    
    // Objects
    {},                     // Empty object
    { a: 1 },               // Object with properties
    [],                     // Empty array
    [1, 2, 3],              // Array with items
    new Date(),             // Date
    /regex/,                // RegExp
    new Map(),              // Map
    new Set(),              // Set
    new Error(),            // Error
    
    // Functions
    () => {},               // Arrow function
    function() {},          // Function declaration
    
    // Special values
    NaN,                    // Not a Number
    Infinity,               // Infinity
    -Infinity,              // Negative Infinity
    
    // Promises
    Promise.resolve(),      // Promise
  ],
};