/**
 * Test fixtures for type guard utility functions.
 * 
 * This module provides comprehensive test fixtures for validating the behavior of
 * type guard functions. It includes positive and negative test cases, edge cases,
 * and special values to ensure robust testing across all journey services.
 * 
 * @module
 */

/**
 * Common test values that can be reused across different test fixtures.
 */
export const commonTestValues = {
  // Primitive values
  nullValue: null,
  undefinedValue: undefined,
  emptyString: '',
  whitespaceString: '   ',
  nonEmptyString: 'test string',
  zeroNumber: 0,
  positiveNumber: 42,
  negativeNumber: -42,
  infinityValue: Infinity,
  negativeInfinityValue: -Infinity,
  nanValue: NaN,
  trueValue: true,
  falseValue: false,
  symbolValue: Symbol('test'),
  bigIntValue: BigInt(9007199254740991),

  // Object values
  emptyObject: {},
  nonEmptyObject: { key: 'value' },
  objectWithNullValue: { key: null },
  objectWithUndefinedValue: { key: undefined },
  objectWithNestedObject: { nested: { key: 'value' } },

  // Array values
  emptyArray: [],
  nonEmptyArray: [1, 2, 3],
  arrayWithNullValues: [null, null],
  arrayWithMixedValues: [1, 'string', true, null, undefined, {}, []],
  nestedArrays: [[1, 2], [3, 4]],

  // Date values
  validDate: new Date(),
  invalidDate: new Date('invalid date'),

  // Function values
  arrowFunction: () => {},
  functionDeclaration: function() {},
  asyncFunction: async () => {},
  generatorFunction: function* () { yield 1; },

  // Regular expression
  regExpValue: /test/,

  // Error values
  errorValue: new Error('test error'),
  typeErrorValue: new TypeError('type error'),

  // Collection values
  mapValue: new Map([['key', 'value']]),
  setValue: new Set([1, 2, 3]),
  weakMapValue: new WeakMap(),
  weakSetValue: new WeakSet(),

  // Buffer and typed arrays (Node.js and browser)
  arrayBufferValue: new ArrayBuffer(8),
  uint8ArrayValue: new Uint8Array(8),
  int32ArrayValue: new Int32Array(8),

  // Promise values
  promiseValue: Promise.resolve(),
  promiseLikeValue: { then: () => {}, catch: () => {} },

  // Special values for specific type guards
  validEmail: 'user@example.com',
  invalidEmail: 'invalid-email',
  validUrl: 'https://example.com',
  invalidUrl: 'invalid-url',
  validUuid: '123e4567-e89b-12d3-a456-426614174000',
  invalidUuid: 'invalid-uuid',
  validIsoDateString: '2023-01-01T12:00:00Z',
  invalidIsoDateString: '01/01/2023',
  validCpf: '529.982.247-25',  // Example valid CPF
  invalidCpf: '111.111.111-11',
  validJsonString: '{"key":"value"}',
  invalidJsonString: '{key:value}',
};

/**
 * Test fixtures for the isString function.
 * 
 * Includes various string values, empty strings, and non-string values to test
 * the function's ability to correctly identify strings.
 */
export const stringFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.emptyString,
    commonTestValues.whitespaceString,
    commonTestValues.nonEmptyString,
    String(123),
    'null',
    'undefined',
    JSON.stringify({ key: 'value' }),
    '\u0000', // Null character
    '🚀', // Emoji
    'áéíóú', // Accented characters
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.positiveNumber,
    commonTestValues.zeroNumber,
    commonTestValues.negativeNumber,
    commonTestValues.nanValue,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.regExpValue,
  ],
};

/**
 * Test fixtures for the isNumber function.
 * 
 * Includes various number values, edge cases like zero, NaN, and Infinity,
 * and non-number values to test the function's ability to correctly identify numbers.
 */
export const numberFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.positiveNumber,
    commonTestValues.zeroNumber,
    commonTestValues.negativeNumber,
    0.5,
    -0.5,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
    Number.EPSILON,
    Number(42),
    parseFloat('42.5'),
    parseInt('42', 10),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.nanValue, // NaN should return false
    commonTestValues.infinityValue, // Infinity should be handled by isFinite
    commonTestValues.negativeInfinityValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    '42', // String containing a number
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue, // BigInt is not a number
    commonTestValues.arrowFunction,
  ],
};

/**
 * Test fixtures for the isBoolean function.
 * 
 * Includes true, false, and non-boolean values to test the function's ability
 * to correctly identify booleans.
 */
export const booleanFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    Boolean(1),
    Boolean(0),
    !!'string', // Double negation
    !!'',
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.positiveNumber,
    commonTestValues.zeroNumber,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    'true', // String 'true' is not a boolean
    'false',
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    0, // Falsy but not boolean
    1, // Truthy but not boolean
  ],
};

/**
 * Test fixtures for the isFunction function.
 * 
 * Includes various function types and non-function values to test the function's
 * ability to correctly identify functions.
 */
export const functionFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.arrowFunction,
    commonTestValues.functionDeclaration,
    commonTestValues.asyncFunction,
    commonTestValues.generatorFunction,
    Function,
    class TestClass {},
    Object.prototype.toString,
    setTimeout,
    new Function('return true'),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.positiveNumber,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    { method: function() {} }, // Object with a method is not a function
    '() => {}', // String representation of a function is not a function
  ],
};

/**
 * Test fixtures for the isNull function.
 * 
 * Includes null and non-null values to test the function's ability to correctly
 * identify null values.
 */
export const nullFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.nullValue,
    null,
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.undefinedValue,
    commonTestValues.positiveNumber,
    commonTestValues.zeroNumber,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    'null', // String 'null' is not null
    0, // Falsy but not null
    false, // Falsy but not null
  ],
};

/**
 * Test fixtures for the isUndefined function.
 * 
 * Includes undefined and non-undefined values to test the function's ability to
 * correctly identify undefined values.
 */
export const undefinedFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.undefinedValue,
    undefined,
    void 0,
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.positiveNumber,
    commonTestValues.zeroNumber,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    'undefined', // String 'undefined' is not undefined
    0, // Falsy but not undefined
    false, // Falsy but not undefined
  ],
};

/**
 * Test fixtures for the isNullOrUndefined function.
 * 
 * Includes null, undefined, and non-null/undefined values to test the function's
 * ability to correctly identify null or undefined values.
 */
export const nullOrUndefinedFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    null,
    undefined,
    void 0,
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.positiveNumber,
    commonTestValues.zeroNumber,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    'null', // String 'null' is not null
    'undefined', // String 'undefined' is not undefined
    0, // Falsy but not null or undefined
    false, // Falsy but not null or undefined
  ],
};

/**
 * Test fixtures for the isArray function.
 * 
 * Includes various array types, empty arrays, and non-array values to test the
 * function's ability to correctly identify arrays.
 */
export const arrayFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.emptyArray,
    commonTestValues.nonEmptyArray,
    commonTestValues.arrayWithNullValues,
    commonTestValues.arrayWithMixedValues,
    commonTestValues.nestedArrays,
    Array.from('string'),
    new Array(5),
    [...'string'], // Spread operator
    Array.of(1, 2, 3),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.positiveNumber,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    { length: 0 }, // Array-like object is not an array
    { 0: 'value', length: 1 }, // Array-like object is not an array
    'array', // String 'array' is not an array
    { push: function() {} }, // Object with array methods is not an array
    arguments, // Arguments object is not an array
    commonTestValues.setValues, // Set is not an array
    commonTestValues.mapValue, // Map is not an array
  ],
};

/**
 * Test fixtures for the isObject function.
 * 
 * Includes various object types, empty objects, and non-object values to test the
 * function's ability to correctly identify objects (excluding null and arrays).
 */
export const objectFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.emptyObject,
    commonTestValues.nonEmptyObject,
    commonTestValues.objectWithNullValue,
    commonTestValues.objectWithUndefinedValue,
    commonTestValues.objectWithNestedObject,
    Object.create(null),
    Object.create({}),
    new Object(),
    { toString: () => 'custom' },
    Object.assign({}, { key: 'value' }),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue, // null is not an object for this guard
    commonTestValues.undefinedValue,
    commonTestValues.positiveNumber,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyArray, // Arrays are not objects for this guard
    commonTestValues.nonEmptyArray,
    commonTestValues.validDate, // Date is an object but should be handled separately
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.regExpValue, // RegExp is an object but should be handled separately
  ],
};

/**
 * Test fixtures for the isDate function.
 * 
 * Includes valid dates, invalid dates, and non-date values to test the function's
 * ability to correctly identify Date objects.
 */
export const dateFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.validDate,
    commonTestValues.invalidDate, // Even invalid dates are Date objects
    new Date(),
    new Date('2023-01-01'),
    new Date(2023, 0, 1),
    new Date(0),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.positiveNumber,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    '2023-01-01', // Date string is not a Date object
    1672531200000, // Timestamp is not a Date object
    { getTime: () => Date.now() }, // Object with Date methods is not a Date
  ],
};

/**
 * Test fixtures for the isRegExp function.
 * 
 * Includes regular expressions and non-RegExp values to test the function's
 * ability to correctly identify RegExp objects.
 */
export const regExpFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.regExpValue,
    /test/,
    /test/g,
    /test/i,
    /test/m,
    /test/u,
    /test/y,
    /test/s,
    new RegExp('test'),
    new RegExp('test', 'g'),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.positiveNumber,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    '/test/', // String representation of a RegExp is not a RegExp
    { test: () => true }, // Object with RegExp methods is not a RegExp
  ],
};

/**
 * Test fixtures for the isPromise function.
 * 
 * Includes promises, promise-like objects, and non-promise values to test the
 * function's ability to correctly identify Promise objects.
 */
export const promiseFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.promiseValue,
    Promise.resolve(),
    Promise.reject().catch(() => {}),
    new Promise(() => {}),
    commonTestValues.promiseLikeValue,
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.positiveNumber,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    { then: 'not a function' },
    { then: () => {} }, // Missing catch method
    { catch: () => {} }, // Missing then method
    async () => {}, // Async function is not a promise
  ],
};

/**
 * Test fixtures for the isSymbol function.
 * 
 * Includes symbols and non-symbol values to test the function's ability to
 * correctly identify Symbol values.
 */
export const symbolFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.symbolValue,
    Symbol('test'),
    Symbol.for('test'),
    Symbol.iterator,
    Symbol.asyncIterator,
    Symbol.toStringTag,
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.positiveNumber,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    'Symbol(test)', // String representation of a Symbol is not a Symbol
    { toString: () => 'Symbol(test)' }, // Object with Symbol-like toString is not a Symbol
  ],
};

/**
 * Test fixtures for the isBigInt function.
 * 
 * Includes BigInt values and non-BigInt values to test the function's ability to
 * correctly identify BigInt values.
 */
export const bigIntFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.bigIntValue,
    BigInt(123),
    BigInt('123'),
    0n,
    1n,
    -1n,
    9007199254740991n, // MAX_SAFE_INTEGER as BigInt
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.positiveNumber,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.arrowFunction,
    '123n', // String representation of a BigInt is not a BigInt
    123, // Number is not a BigInt
  ],
};

/**
 * Test fixtures for the isPrimitive function.
 * 
 * Includes primitive values (string, number, boolean, symbol, bigint, null, undefined)
 * and non-primitive values to test the function's ability to correctly identify primitives.
 */
export const primitiveFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.zeroNumber,
    commonTestValues.negativeNumber,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    'string',
    42,
    true,
    false,
    null,
    undefined,
    Symbol('test'),
    BigInt(123),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.emptyObject,
    commonTestValues.nonEmptyObject,
    commonTestValues.emptyArray,
    commonTestValues.nonEmptyArray,
    commonTestValues.validDate,
    commonTestValues.arrowFunction,
    commonTestValues.regExpValue,
    commonTestValues.promiseValue,
    commonTestValues.mapValue,
    commonTestValues.setValue,
    new Object(),
    new Array(),
    new Date(),
    new RegExp('test'),
    new Map(),
    new Set(),
  ],
};

/**
 * Test fixtures for the isEmpty function.
 * 
 * Includes empty values (null, undefined, empty string, empty array, empty object)
 * and non-empty values to test the function's ability to correctly identify empty values.
 */
export const emptyFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.whitespaceString, // Whitespace string is considered empty
    commonTestValues.emptyArray,
    commonTestValues.emptyObject,
    null,
    undefined,
    '',
    '   ',
    [],
    {},
    Object.create(null), // Empty object with no prototype
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.zeroNumber, // 0 is not empty
    commonTestValues.negativeNumber,
    commonTestValues.trueValue,
    commonTestValues.falseValue, // false is not empty
    commonTestValues.nonEmptyObject,
    commonTestValues.nonEmptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    'string',
    0, // 0 is not empty
    false, // false is not empty
    { key: 'value' },
    [1, 2, 3],
    new Date(),
  ],
};

/**
 * Test fixtures for the isPlainObject function.
 * 
 * Includes plain objects (created by object literals, Object.create(null), or new Object())
 * and non-plain objects to test the function's ability to correctly identify plain objects.
 */
export const plainObjectFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.emptyObject,
    commonTestValues.nonEmptyObject,
    commonTestValues.objectWithNullValue,
    commonTestValues.objectWithUndefinedValue,
    commonTestValues.objectWithNestedObject,
    Object.create(null),
    Object.create(Object.prototype),
    new Object(),
    {},
    { key: 'value' },
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.positiveNumber,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyArray,
    commonTestValues.nonEmptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.regExpValue,
    new Date(),
    new Array(),
    new Map(),
    new Set(),
    new RegExp('test'),
    new String('test'),
    new Number(42),
    new Boolean(true),
    document, // DOM node is not a plain object
    window, // Global object is not a plain object
    class Test {},
    new (class Test {}),
  ],
};

/**
 * Test fixtures for the isFinite function.
 * 
 * Includes finite numbers and non-finite values to test the function's ability to
 * correctly identify finite numbers.
 */
export const finiteFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.positiveNumber,
    commonTestValues.zeroNumber,
    commonTestValues.negativeNumber,
    0,
    1,
    -1,
    0.5,
    -0.5,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
    Number.EPSILON,
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.nanValue,
    commonTestValues.infinityValue,
    commonTestValues.negativeInfinityValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    NaN,
    Infinity,
    -Infinity,
    '42', // String containing a number is not a finite number
  ],
};

/**
 * Test fixtures for the isInteger function.
 * 
 * Includes integer numbers and non-integer values to test the function's ability to
 * correctly identify integers.
 */
export const integerFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.positiveNumber, // 42
    commonTestValues.zeroNumber, // 0
    commonTestValues.negativeNumber, // -42
    0,
    1,
    -1,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
    Math.pow(2, 32) - 1,
    -Math.pow(2, 32) + 1,
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.nanValue,
    commonTestValues.infinityValue,
    commonTestValues.negativeInfinityValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    0.5,
    -0.5,
    1.1,
    -1.1,
    Number.EPSILON,
    NaN,
    Infinity,
    -Infinity,
    '42', // String containing a number is not an integer
  ],
};

/**
 * Test fixtures for the isNumeric function.
 * 
 * Includes numeric values (numbers and numeric strings) and non-numeric values to test
 * the function's ability to correctly identify numeric values.
 */
export const numericFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.positiveNumber,
    commonTestValues.zeroNumber,
    commonTestValues.negativeNumber,
    0,
    1,
    -1,
    0.5,
    -0.5,
    '0',
    '1',
    '-1',
    '0.5',
    '-0.5',
    '1e3',
    '-1e3',
    '1,000', // Comma-separated number
    '1,000.50', // Comma-separated decimal
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER.toString(),
    Number.MIN_SAFE_INTEGER.toString(),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.nanValue,
    commonTestValues.infinityValue, // Infinity is not considered numeric
    commonTestValues.negativeInfinityValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    NaN,
    Infinity,
    -Infinity,
    '42px', // String with non-numeric characters
    'test',
    '',
    ' ',
    '0x1', // Hexadecimal is not considered numeric
    '0b1', // Binary is not considered numeric
    '0o1', // Octal is not considered numeric
    'NaN',
    'Infinity',
    '-Infinity',
  ],
};

/**
 * Test fixtures for the isNonEmptyString function.
 * 
 * Includes non-empty strings and empty or non-string values to test the function's
 * ability to correctly identify non-empty strings.
 */
export const nonEmptyStringFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.nonEmptyString,
    'a',
    '0',
    'false',
    'null',
    'undefined',
    ' a ', // String with whitespace but non-empty
    '\t\n', // String with whitespace characters but non-empty
    '🚀', // Emoji
    'áéíóú', // Accented characters
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.whitespaceString, // Whitespace string is considered empty
    commonTestValues.positiveNumber,
    commonTestValues.zeroNumber,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    '',
    '   ', // Only whitespace
    '\t\n\r', // Only whitespace characters
  ],
};

/**
 * Test fixtures for the isEmail function.
 * 
 * Includes valid email addresses and invalid or non-email values to test the
 * function's ability to correctly identify email addresses.
 */
export const emailFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.validEmail,
    'user@example.com',
    'user.name@example.com',
    'user+tag@example.com',
    'user@subdomain.example.com',
    'user@example.co.uk',
    'user123@example.com',
    'USER@EXAMPLE.COM', // Uppercase
    '123user@example.com',
    'user@123.com',
    'user@example.museum', // Long TLD
    'user@example.technology', // Long TLD
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.invalidEmail,
    'user@', // Missing domain
    '@example.com', // Missing username
    'user@.com', // Missing domain name
    'user@example', // Missing TLD
    'user@example.', // Incomplete TLD
    'user@exam_ple.com', // Invalid character in domain
    'us er@example.com', // Space in username
    'user@exam ple.com', // Space in domain
    'user@example..com', // Double dot
    '.user@example.com', // Leading dot in username
    'user.@example.com', // Trailing dot in username
    'user..name@example.com', // Double dot in username
    'user@example.com.', // Trailing dot in domain
    'user@-example.com', // Leading hyphen in domain
    'user@example-.com', // Trailing hyphen in domain
  ],
};

/**
 * Test fixtures for the isUrl function.
 * 
 * Includes valid URLs and invalid or non-URL values to test the function's
 * ability to correctly identify URLs.
 */
export const urlFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.validUrl,
    'https://example.com',
    'http://example.com',
    'https://www.example.com',
    'http://subdomain.example.com',
    'https://example.com/path',
    'https://example.com/path/to/resource',
    'https://example.com?query=value',
    'https://example.com#fragment',
    'https://example.com:8080',
    'https://example.com/path?query=value#fragment',
    'https://user:password@example.com',
    'https://example.com/',
    'http://localhost',
    'http://localhost:3000',
    'http://127.0.0.1',
    'http://127.0.0.1:8080',
    'ftp://example.com',
    'file:///path/to/file',
    'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==',
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.invalidUrl,
    'example.com', // Missing protocol
    'https://', // Missing domain
    'https://example', // Incomplete domain
    'https://.com', // Missing domain name
    'http:/example.com', // Missing slash
    'http:example.com', // Missing slashes
    'https://example.com:port', // Invalid port
    'http://user@:password@example.com', // Invalid credentials
    'http://<>', // Invalid characters
    'http://example.com\path', // Backslash in path
    'javascript:alert(1)', // JavaScript URL
  ],
};

/**
 * Test fixtures for the isUuid function.
 * 
 * Includes valid UUIDs (v1-v5) and invalid or non-UUID values to test the
 * function's ability to correctly identify UUIDs.
 */
export const uuidFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.validUuid,
    '123e4567-e89b-12d3-a456-426614174000', // v1
    '123e4567-e89b-22d3-a456-426614174000', // v2
    '123e4567-e89b-32d3-a456-426614174000', // v3
    '123e4567-e89b-42d3-a456-426614174000', // v4
    '123e4567-e89b-52d3-a456-426614174000', // v5
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }), // Random v4 UUID
    '00000000-0000-4000-8000-000000000000', // Nil UUID
    'FFFFFFFF-FFFF-4FFF-BFFF-FFFFFFFFFFFF', // Max UUID (uppercase)
    'ffffffff-ffff-4fff-bfff-ffffffffffff', // Max UUID (lowercase)
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.invalidUuid,
    '123e4567-e89b-12d3-a456', // Too short
    '123e4567-e89b-12d3-a456-4266141740001', // Too long
    '123e4567-e89b-12d3-a456-42661417400g', // Invalid character
    '123e4567-e89b-62d3-a456-426614174000', // Invalid version (6)
    '123e4567-e89b-12d3-g456-426614174000', // Invalid variant
    '123e4567e89b12d3a456426614174000', // Missing hyphens
    '123e4567-e89b12d3-a456-426614174000', // Incorrect hyphen placement
    '{123e4567-e89b-12d3-a456-426614174000}', // With braces
    'urn:uuid:123e4567-e89b-12d3-a456-426614174000', // With URN prefix
  ],
};

/**
 * Test fixtures for the isIsoDateString function.
 * 
 * Includes valid ISO date strings and invalid or non-ISO date string values to test
 * the function's ability to correctly identify ISO date strings.
 */
export const isoDateStringFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.validIsoDateString,
    '2023-01-01',
    '2023-01-01T12:00:00',
    '2023-01-01T12:00:00Z',
    '2023-01-01T12:00:00.000Z',
    '2023-01-01T12:00:00+00:00',
    '2023-01-01T12:00:00-05:00',
    '2023-01-01T12:00:00.123+00:00',
    '2023-01-01T12:00:00.123456Z',
    '2023-01-01T00:00:00Z',
    '2023-01-01T23:59:59Z',
    '2023-02-28T12:00:00Z', // Valid date
    '2024-02-29T12:00:00Z', // Leap year
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.invalidIsoDateString,
    '2023/01/01', // Wrong format
    '01/01/2023', // Wrong format
    '2023-13-01', // Invalid month
    '2023-01-32', // Invalid day
    '2023-02-30', // Invalid date (February 30)
    '2023-01-01 12:00:00', // Space instead of T
    '2023-01-01T25:00:00Z', // Invalid hour
    '2023-01-01T12:60:00Z', // Invalid minute
    '2023-01-01T12:00:60Z', // Invalid second
    '2023-01-01T12:00:00+25:00', // Invalid timezone
    '2023-01-01T', // Incomplete
    'T12:00:00Z', // Missing date part
    '2023-01-01Z', // Missing time part but has Z
    '2023-01-01T12:00:00ZZ', // Double Z
    'January 1, 2023', // Human-readable format
  ],
};

/**
 * Test fixtures for the isCpf function.
 * 
 * Includes valid CPF numbers and invalid or non-CPF values to test the function's
 * ability to correctly identify Brazilian CPF numbers.
 */
export const cpfFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.validCpf,
    '529.982.247-25', // Formatted
    '52998224725', // Unformatted
    '111.444.777-35', // Another valid CPF
    '11144477735', // Unformatted
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.invalidCpf,
    '111.111.111-11', // Same digits
    '222.222.222-22', // Same digits
    '333.333.333-33', // Same digits
    '444.444.444-44', // Same digits
    '555.555.555-55', // Same digits
    '666.666.666-66', // Same digits
    '777.777.777-77', // Same digits
    '888.888.888-88', // Same digits
    '999.999.999-99', // Same digits
    '000.000.000-00', // Same digits
    '123.456.789-00', // Invalid check digits
    '12345678900', // Invalid check digits
    '123.456.789', // Too short
    '123.456.789-0', // Too short
    '123.456.789-000', // Too long
    '1234567890123', // Too long
    'ABC.DEF.GHI-JK', // Non-numeric
    '123-456-789-00', // Wrong format
  ],
};

/**
 * Test fixtures for the isJsonString function.
 * 
 * Includes valid JSON strings and invalid or non-JSON string values to test the
 * function's ability to correctly identify JSON strings.
 */
export const jsonStringFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.validJsonString,
    '{}',
    '[]',
    'null',
    'true',
    'false',
    '123',
    '"string"',
    '{"key":"value"}',
    '{"key":123}',
    '{"key":true}',
    '{"key":null}',
    '{"key":[1,2,3]}',
    '{"key":{"nested":"value"}}',
    '[1,2,3]',
    '["string",123,true,null,{},[]]]',
    '{"key":"\\"escaped\\""}', // Escaped quotes
    '{"key":"\\\\escaped\\\\"}', // Escaped backslashes
    '{"key":"\\n\\t"}', // Escaped newline and tab
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.invalidJsonString,
    '{', // Incomplete
    '}', // Incomplete
    '[', // Incomplete
    ']', // Incomplete
    '{key:"value"}', // Missing quotes around key
    '{"key":value}', // Missing quotes around string value
    '{"key":"value",}', // Trailing comma
    '[1,2,3,]', // Trailing comma
    '{"key":undefined}', // undefined is not valid JSON
    '{"key":NaN}', // NaN is not valid JSON
    '{"key":Infinity}', // Infinity is not valid JSON
    '{"key":\'value\'}', // Single quotes are not valid JSON
    '// comment', // Comments are not valid JSON
    '{/* comment */}', // Comments are not valid JSON
  ],
};

/**
 * Test fixtures for the isMap function.
 * 
 * Includes Map objects and non-Map values to test the function's ability to
 * correctly identify Map objects.
 */
export const mapFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.mapValue,
    new Map(),
    new Map([['key', 'value']]),
    new Map([[1, 2]]),
    new Map([['key1', 'value1'], ['key2', 'value2']]),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.weakMapValue, // WeakMap is not a Map
    commonTestValues.setValues, // Set is not a Map
    { get: () => {}, set: () => {}, has: () => {}, delete: () => {} }, // Object with Map-like methods is not a Map
    { size: 0 }, // Object with size property is not a Map
  ],
};

/**
 * Test fixtures for the isSet function.
 * 
 * Includes Set objects and non-Set values to test the function's ability to
 * correctly identify Set objects.
 */
export const setFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.setValues,
    new Set(),
    new Set([1, 2, 3]),
    new Set(['string']),
    new Set([{}, []]),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.weakSetValue, // WeakSet is not a Set
    commonTestValues.mapValue, // Map is not a Set
    { add: () => {}, has: () => {}, delete: () => {} }, // Object with Set-like methods is not a Set
    { size: 0 }, // Object with size property is not a Set
  ],
};

/**
 * Test fixtures for the isWeakMap function.
 * 
 * Includes WeakMap objects and non-WeakMap values to test the function's ability to
 * correctly identify WeakMap objects.
 */
export const weakMapFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.weakMapValue,
    new WeakMap(),
    new WeakMap([[{}, 'value']]),
    new WeakMap([[{}, 1], [{}, 2]]),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.mapValue, // Map is not a WeakMap
    commonTestValues.setValues, // Set is not a WeakMap
    { get: () => {}, set: () => {}, has: () => {}, delete: () => {} }, // Object with WeakMap-like methods is not a WeakMap
  ],
};

/**
 * Test fixtures for the isWeakSet function.
 * 
 * Includes WeakSet objects and non-WeakSet values to test the function's ability to
 * correctly identify WeakSet objects.
 */
export const weakSetFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.weakSetValue,
    new WeakSet(),
    new WeakSet([{}]),
    new WeakSet([{}, {}]),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.setValues, // Set is not a WeakSet
    commonTestValues.mapValue, // Map is not a WeakSet
    { add: () => {}, has: () => {}, delete: () => {} }, // Object with WeakSet-like methods is not a WeakSet
  ],
};

/**
 * Test fixtures for the isError function.
 * 
 * Includes Error objects and non-Error values to test the function's ability to
 * correctly identify Error objects.
 */
export const errorFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.errorValue,
    commonTestValues.typeErrorValue,
    new Error(),
    new Error('message'),
    new TypeError(),
    new SyntaxError(),
    new ReferenceError(),
    new RangeError(),
    new URIError(),
    new EvalError(),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    { message: 'error' }, // Object with error-like properties is not an Error
    { name: 'Error', message: 'error' }, // Object with error-like properties is not an Error
    'Error: message', // String representation of an Error is not an Error
  ],
};

/**
 * Test fixtures for the isPositiveNumber function.
 * 
 * Includes positive numbers and non-positive or non-number values to test the
 * function's ability to correctly identify positive numbers.
 */
export const positiveNumberFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.positiveNumber, // 42
    1,
    0.1,
    Number.EPSILON,
    Number.MAX_SAFE_INTEGER,
    Number.MAX_VALUE,
    1e-10, // Small positive number
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.zeroNumber, // 0 is not positive
    commonTestValues.negativeNumber, // -42
    commonTestValues.nanValue,
    commonTestValues.infinityValue, // Infinity is not finite
    commonTestValues.negativeInfinityValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    0,
    -1,
    -0.1,
    -Number.EPSILON,
    -Number.MAX_SAFE_INTEGER,
    -Number.MAX_VALUE,
    NaN,
    Infinity,
    -Infinity,
    '42', // String containing a number is not a number
  ],
};

/**
 * Test fixtures for the isNegativeNumber function.
 * 
 * Includes negative numbers and non-negative or non-number values to test the
 * function's ability to correctly identify negative numbers.
 */
export const negativeNumberFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.negativeNumber, // -42
    -1,
    -0.1,
    -Number.EPSILON,
    -Number.MAX_SAFE_INTEGER,
    -Number.MAX_VALUE,
    -1e-10, // Small negative number
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.zeroNumber, // 0 is not negative
    commonTestValues.positiveNumber, // 42
    commonTestValues.nanValue,
    commonTestValues.infinityValue, // Infinity is not finite
    commonTestValues.negativeInfinityValue, // -Infinity is not finite
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    0,
    1,
    0.1,
    Number.EPSILON,
    Number.MAX_SAFE_INTEGER,
    Number.MAX_VALUE,
    NaN,
    Infinity,
    -Infinity,
    '-42', // String containing a number is not a number
  ],
};

/**
 * Test fixtures for the isNonNegativeNumber function.
 * 
 * Includes non-negative numbers (zero and positive) and negative or non-number values
 * to test the function's ability to correctly identify non-negative numbers.
 */
export const nonNegativeNumberFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.zeroNumber, // 0
    commonTestValues.positiveNumber, // 42
    0,
    1,
    0.1,
    Number.EPSILON,
    Number.MAX_SAFE_INTEGER,
    Number.MAX_VALUE,
    1e-10, // Small positive number
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.negativeNumber, // -42
    commonTestValues.nanValue,
    commonTestValues.infinityValue, // Infinity is not finite
    commonTestValues.negativeInfinityValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    -1,
    -0.1,
    -Number.EPSILON,
    -Number.MAX_SAFE_INTEGER,
    -Number.MAX_VALUE,
    NaN,
    Infinity,
    -Infinity,
    '0', // String containing a number is not a number
    '42', // String containing a number is not a number
  ],
};

/**
 * Test fixtures for the isNonPositiveNumber function.
 * 
 * Includes non-positive numbers (zero and negative) and positive or non-number values
 * to test the function's ability to correctly identify non-positive numbers.
 */
export const nonPositiveNumberFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.zeroNumber, // 0
    commonTestValues.negativeNumber, // -42
    0,
    -1,
    -0.1,
    -Number.EPSILON,
    -Number.MAX_SAFE_INTEGER,
    -Number.MAX_VALUE,
    -1e-10, // Small negative number
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.positiveNumber, // 42
    commonTestValues.nanValue,
    commonTestValues.infinityValue, // Infinity is not finite
    commonTestValues.negativeInfinityValue, // -Infinity is not finite
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    1,
    0.1,
    Number.EPSILON,
    Number.MAX_SAFE_INTEGER,
    Number.MAX_VALUE,
    NaN,
    Infinity,
    -Infinity,
    '0', // String containing a number is not a number
    '-42', // String containing a number is not a number
  ],
};

/**
 * Test fixtures for the isNumberInRange function.
 * 
 * Includes numbers within specified ranges and numbers outside ranges or non-number
 * values to test the function's ability to correctly identify numbers within ranges.
 */
export const numberInRangeFixtures = {
  // Test ranges
  ranges: [
    { min: 1, max: 10 },
    { min: -10, max: 10 },
    { min: 0, max: 1 },
    { min: -1, max: -0.5 },
    { min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER },
  ],

  // Values to test for each range
  testValues: {
    // For range [1, 10]
    range1: {
      // Positive cases (should return true)
      positive: [1, 5, 10, 1.5, 9.999],
      // Negative cases (should return false)
      negative: [0, 0.999, 10.001, 11, -1, 100],
    },
    // For range [-10, 10]
    range2: {
      // Positive cases (should return true)
      positive: [-10, -5, 0, 5, 10, -9.999, 9.999],
      // Negative cases (should return false)
      negative: [-10.001, -11, 10.001, 11, -100, 100],
    },
    // For range [0, 1]
    range3: {
      // Positive cases (should return true)
      positive: [0, 0.1, 0.5, 0.9, 1],
      // Negative cases (should return false)
      negative: [-0.001, -1, 1.001, 2],
    },
    // For range [-1, -0.5]
    range4: {
      // Positive cases (should return true)
      positive: [-1, -0.9, -0.75, -0.6, -0.5],
      // Negative cases (should return false)
      negative: [-1.001, -2, -0.499, -0.4, 0, 1],
    },
    // For range [MIN_SAFE_INTEGER, MAX_SAFE_INTEGER]
    range5: {
      // Positive cases (should return true)
      positive: [
        Number.MIN_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER + 1,
        -1,
        0,
        1,
        Number.MAX_SAFE_INTEGER - 1,
        Number.MAX_SAFE_INTEGER,
      ],
      // Negative cases (should return false)
      negative: [
        Number.MIN_SAFE_INTEGER - 1,
        Number.MAX_SAFE_INTEGER + 1,
        Number.MIN_VALUE - 1,
        Number.MAX_VALUE + 1,
      ],
    },
  },

  // Non-number values (should always return false regardless of range)
  nonNumbers: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.nanValue,
    commonTestValues.infinityValue,
    commonTestValues.negativeInfinityValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.trueValue,
    commonTestValues.falseValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    NaN,
    Infinity,
    -Infinity,
    '5', // String containing a number is not a number
  ],
};

/**
 * Test fixtures for the isOneOf function.
 * 
 * Includes values that are in allowed lists and values that are not in allowed lists
 * to test the function's ability to correctly identify values in allowed lists.
 */
export const oneOfFixtures = {
  // Test allowed lists
  allowedLists: {
    strings: ['apple', 'banana', 'orange'],
    numbers: [1, 2, 3, 4, 5],
    mixed: [1, 'string', true, null, undefined],
    empty: [],
  },

  // Values to test for each allowed list
  testValues: {
    // For strings list
    strings: {
      // Positive cases (should return true)
      positive: ['apple', 'banana', 'orange'],
      // Negative cases (should return false)
      negative: ['grape', 'Apple', 'BANANA', '', 'app', 'oranges'],
    },
    // For numbers list
    numbers: {
      // Positive cases (should return true)
      positive: [1, 2, 3, 4, 5],
      // Negative cases (should return false)
      negative: [0, 6, -1, 1.5, 10],
    },
    // For mixed list
    mixed: {
      // Positive cases (should return true)
      positive: [1, 'string', true, null, undefined],
      // Negative cases (should return false)
      negative: [2, 'String', false, {}, [], 0, NaN],
    },
    // For empty list
    empty: {
      // Positive cases (should return true)
      positive: [],
      // Negative cases (should return false)
      negative: [1, 'string', true, null, undefined, {}, []],
    },
  },

  // Non-primitive values (objects, arrays, etc.) for special testing
  nonPrimitives: {
    // Objects with same content but different references
    objects: {
      allowed: [{ id: 1 }, { id: 2 }],
      positive: [], // Empty because objects are compared by reference
      negative: [{ id: 1 }, { id: 2 }, { id: 3 }],
    },
    // Arrays with same content but different references
    arrays: {
      allowed: [[1, 2], [3, 4]],
      positive: [], // Empty because arrays are compared by reference
      negative: [[1, 2], [3, 4], [5, 6]],
    },
  },
};

/**
 * Test fixtures for the isValidDate function.
 * 
 * Includes valid Date objects and invalid Date objects or non-Date values to test
 * the function's ability to correctly identify valid Date objects.
 */
export const validDateFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.validDate,
    new Date(),
    new Date('2023-01-01'),
    new Date(2023, 0, 1),
    new Date(0),
    new Date(Date.now()),
    new Date(new Date().toISOString()),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.invalidDate, // Invalid Date object
    new Date('invalid'), // Invalid Date object
    new Date('2023-13-01'), // Invalid month
    new Date('2023-02-30'), // Invalid day
    '2023-01-01', // Date string is not a Date object
    1672531200000, // Timestamp is not a Date object
    { getTime: () => Date.now() }, // Object with Date methods is not a Date
  ],
};

/**
 * Test fixtures for the isArrayBuffer function.
 * 
 * Includes ArrayBuffer objects and non-ArrayBuffer values to test the function's
 * ability to correctly identify ArrayBuffer objects.
 */
export const arrayBufferFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.arrayBufferValue,
    new ArrayBuffer(0),
    new ArrayBuffer(8),
    new ArrayBuffer(1024),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.uint8ArrayValue, // TypedArray is not an ArrayBuffer
    commonTestValues.int32ArrayValue, // TypedArray is not an ArrayBuffer
    Buffer.from([1, 2, 3]), // Buffer is not an ArrayBuffer
    { byteLength: 8 }, // Object with ArrayBuffer-like properties is not an ArrayBuffer
  ],
};

/**
 * Test fixtures for the isTypedArray function.
 * 
 * Includes TypedArray objects and non-TypedArray values to test the function's
 * ability to correctly identify TypedArray objects.
 */
export const typedArrayFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.uint8ArrayValue,
    commonTestValues.int32ArrayValue,
    new Int8Array(8),
    new Uint8Array(8),
    new Uint8ClampedArray(8),
    new Int16Array(8),
    new Uint16Array(8),
    new Int32Array(8),
    new Uint32Array(8),
    new Float32Array(8),
    new Float64Array(8),
    new BigInt64Array(8),
    new BigUint64Array(8),
    new Uint8Array([1, 2, 3]),
    new Int32Array(new ArrayBuffer(16)),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.arrayBufferValue, // ArrayBuffer is not a TypedArray
    Buffer.from([1, 2, 3]), // Buffer is not a TypedArray (in browser context)
    [1, 2, 3], // Regular array is not a TypedArray
    { buffer: new ArrayBuffer(8), byteLength: 8, byteOffset: 0 }, // Object with TypedArray-like properties is not a TypedArray
  ],
};

/**
 * Test fixtures for the isFormData function.
 * 
 * Includes FormData objects and non-FormData values to test the function's
 * ability to correctly identify FormData objects.
 */
export const formDataFixtures = {
  // Positive cases (should return true)
  positive: [
    // FormData is only available in browser environment
    // These will be skipped in Node.js environment
    typeof FormData !== 'undefined' ? new FormData() : null,
  ].filter(Boolean),

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    { append: () => {}, get: () => {}, getAll: () => {}, has: () => {} }, // Object with FormData-like methods is not a FormData
  ],
};

/**
 * Test fixtures for the isBlob function.
 * 
 * Includes Blob objects and non-Blob values to test the function's
 * ability to correctly identify Blob objects.
 */
export const blobFixtures = {
  // Positive cases (should return true)
  positive: [
    // Blob is only available in browser environment
    // These will be skipped in Node.js environment
    typeof Blob !== 'undefined' ? new Blob(['content']) : null,
    typeof Blob !== 'undefined' ? new Blob(['content'], { type: 'text/plain' }) : null,
  ].filter(Boolean),

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.arrayBufferValue,
    commonTestValues.uint8ArrayValue,
    { size: 0, type: 'text/plain', slice: () => {} }, // Object with Blob-like methods is not a Blob
  ],
};

/**
 * Test fixtures for the isFile function.
 * 
 * Includes File objects and non-File values to test the function's
 * ability to correctly identify File objects.
 */
export const fileFixtures = {
  // Positive cases (should return true)
  positive: [
    // File is only available in browser environment
    // These will be skipped in Node.js environment
    typeof File !== 'undefined' ? new File(['content'], 'filename.txt') : null,
    typeof File !== 'undefined' ? new File(['content'], 'filename.txt', { type: 'text/plain' }) : null,
  ].filter(Boolean),

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.arrayBufferValue,
    commonTestValues.uint8ArrayValue,
    typeof Blob !== 'undefined' ? new Blob(['content']) : {}, // Blob is not a File
    { name: 'filename.txt', size: 0, type: 'text/plain', slice: () => {} }, // Object with File-like methods is not a File
  ],
};

/**
 * Test fixtures for the isStream function.
 * 
 * Includes Stream objects and non-Stream values to test the function's
 * ability to correctly identify Stream objects.
 */
export const streamFixtures = {
  // Positive cases (should return true)
  positive: [
    // These will be created dynamically in tests using Node.js streams
    // Example: fs.createReadStream('file.txt')
    { pipe: () => {} }, // Minimal stream-like object
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.arrayBufferValue,
    commonTestValues.uint8ArrayValue,
    { read: () => {} }, // Object with only read method is not a stream
    { write: () => {} }, // Object with only write method is not a stream
    { pipe: 'not a function' }, // Object with pipe property that is not a function
  ],
};

/**
 * Test fixtures for the isUrlObject function.
 * 
 * Includes URL objects and non-URL values to test the function's
 * ability to correctly identify URL objects.
 */
export const urlObjectFixtures = {
  // Positive cases (should return true)
  positive: [
    // URL is available in both browser and Node.js environments
    new URL('https://example.com'),
    new URL('http://localhost:3000'),
    new URL('file:///path/to/file'),
    new URL('https://user:password@example.com:8080/path?query=value#fragment'),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    'https://example.com', // String URL is not a URL object
    { href: 'https://example.com', protocol: 'https:', host: 'example.com' }, // Object with URL-like properties is not a URL
  ],
};

/**
 * Test fixtures for the isUrlSearchParams function.
 * 
 * Includes URLSearchParams objects and non-URLSearchParams values to test the function's
 * ability to correctly identify URLSearchParams objects.
 */
export const urlSearchParamsFixtures = {
  // Positive cases (should return true)
  positive: [
    // URLSearchParams is available in both browser and Node.js environments
    new URLSearchParams(),
    new URLSearchParams('key=value'),
    new URLSearchParams('?key=value'),
    new URLSearchParams({ key: 'value' }),
    new URLSearchParams([['key', 'value']]),
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    'key=value', // String query is not a URLSearchParams object
    { append: () => {}, get: () => {}, getAll: () => {}, has: () => {} }, // Object with URLSearchParams-like methods is not a URLSearchParams
  ],
};

/**
 * Test fixtures for the isDomElement function.
 * 
 * Includes DOM Element objects and non-Element values to test the function's
 * ability to correctly identify DOM Element objects.
 */
export const domElementFixtures = {
  // Positive cases (should return true)
  positive: [
    // These will be created dynamically in browser tests
    // Example: document.createElement('div')
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    { tagName: 'DIV', nodeType: 1, getAttribute: () => {}, setAttribute: () => {} }, // Object with Element-like properties is not an Element
  ],
};

/**
 * Test fixtures for the isBrowser and isNode functions.
 * 
 * These functions don't take arguments, so we don't need test values.
 * They will be tested based on the current environment.
 */
export const environmentFixtures = {
  // These functions will be tested based on the current environment
  // No test values needed
};

/**
 * Test fixtures for the isIterable function.
 * 
 * Includes iterable objects and non-iterable values to test the function's
 * ability to correctly identify iterable objects.
 */
export const iterableFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.emptyArray,
    commonTestValues.nonEmptyArray,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.mapValue,
    commonTestValues.setValues,
    [],
    [1, 2, 3],
    '',
    'string',
    new Map(),
    new Set(),
    (function* () { yield 1; })(), // Generator
    { *[Symbol.iterator]() { yield 1; } }, // Custom iterable
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.weakMapValue, // WeakMap is not iterable
    commonTestValues.weakSetValue, // WeakSet is not iterable
    {},
    { length: 0 }, // Array-like object is not iterable
    { 0: 'value', length: 1 }, // Array-like object is not iterable
    { [Symbol.iterator]: 'not a function' }, // Object with Symbol.iterator that is not a function
  ],
};

/**
 * Test fixtures for the isAsyncIterable function.
 * 
 * Includes async iterable objects and non-async-iterable values to test the function's
 * ability to correctly identify async iterable objects.
 */
export const asyncIterableFixtures = {
  // Positive cases (should return true)
  positive: [
    (async function* () { yield 1; })(), // Async generator
    { [Symbol.asyncIterator]() { return { async next() { return { value: 1, done: false }; } }; } }, // Custom async iterable
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.mapValue, // Map is not async iterable
    commonTestValues.setValues, // Set is not async iterable
    (function* () { yield 1; })(), // Generator is not async iterable
    { [Symbol.iterator]() { return { next() { return { value: 1, done: false }; } }; } }, // Regular iterable is not async iterable
    { [Symbol.asyncIterator]: 'not a function' }, // Object with Symbol.asyncIterator that is not a function
  ],
};

/**
 * Test fixtures for the isGenerator function.
 * 
 * Includes generator objects and non-generator values to test the function's
 * ability to correctly identify generator objects.
 */
export const generatorFixtures = {
  // Positive cases (should return true)
  positive: [
    (function* () { yield 1; })(), // Generator
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.mapValue,
    commonTestValues.setValues,
    function* () { yield 1; }, // Generator function is not a generator
    (async function* () { yield 1; })(), // Async generator is not a generator
    { next: () => {}, throw: () => {}, return: () => {} }, // Object with generator-like methods is not a generator
    { next: () => ({ value: 1, done: false }), throw: () => {}, return: () => {} }, // Object with generator-like methods is not a generator
  ],
};

/**
 * Test fixtures for the isAsyncGenerator function.
 * 
 * Includes async generator objects and non-async-generator values to test the function's
 * ability to correctly identify async generator objects.
 */
export const asyncGeneratorFixtures = {
  // Positive cases (should return true)
  positive: [
    (async function* () { yield 1; })(), // Async generator
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.mapValue,
    commonTestValues.setValues,
    async function* () { yield 1; }, // Async generator function is not an async generator
    (function* () { yield 1; })(), // Generator is not an async generator
    { next: () => Promise.resolve({ value: 1, done: false }), throw: () => {}, return: () => {} }, // Object with async generator-like methods is not an async generator
  ],
};

/**
 * Test fixtures for the isThenable function.
 * 
 * Includes thenable objects and non-thenable values to test the function's
 * ability to correctly identify thenable objects.
 */
export const thenableFixtures = {
  // Positive cases (should return true)
  positive: [
    commonTestValues.promiseValue,
    Promise.resolve(),
    Promise.reject().catch(() => {}),
    { then: () => {} },
    { then: (resolve) => resolve(42) },
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    { then: 'not a function' },
  ],
};

/**
 * Test fixtures for the isObservable function.
 * 
 * Includes observable objects and non-observable values to test the function's
 * ability to correctly identify observable objects.
 */
export const observableFixtures = {
  // Positive cases (should return true)
  positive: [
    { subscribe: () => {} },
    { subscribe: (observer) => ({ unsubscribe: () => {} }) },
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    commonTestValues.promiseValue,
    { subscribe: 'not a function' },
  ],
};

/**
 * Test fixtures for the isReadableStream function.
 * 
 * Includes readable stream objects and non-readable-stream values to test the function's
 * ability to correctly identify readable streams.
 */
export const readableStreamFixtures = {
  // Positive cases (should return true)
  positive: [
    { pipe: () => {} },
    { pipe: (destination) => destination },
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    { pipe: 'not a function' },
    { read: () => {} }, // Object with read method but no pipe method
  ],
};

/**
 * Test fixtures for the isWritableStream function.
 * 
 * Includes writable stream objects and non-writable-stream values to test the function's
 * ability to correctly identify writable streams.
 */
export const writableStreamFixtures = {
  // Positive cases (should return true)
  positive: [
    { write: () => {} },
    { write: (chunk, encoding, callback) => callback() },
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    { write: 'not a function' },
    { pipe: () => {} }, // Object with pipe method but no write method
  ],
};

/**
 * Test fixtures for the isDuplexStream function.
 * 
 * Includes duplex stream objects and non-duplex-stream values to test the function's
 * ability to correctly identify duplex streams.
 */
export const duplexStreamFixtures = {
  // Positive cases (should return true)
  positive: [
    { pipe: () => {}, write: () => {} },
    { pipe: (destination) => destination, write: (chunk, encoding, callback) => callback() },
  ],

  // Negative cases (should return false)
  negative: [
    commonTestValues.nullValue,
    commonTestValues.undefinedValue,
    commonTestValues.emptyString,
    commonTestValues.nonEmptyString,
    commonTestValues.positiveNumber,
    commonTestValues.trueValue,
    commonTestValues.emptyObject,
    commonTestValues.emptyArray,
    commonTestValues.validDate,
    commonTestValues.symbolValue,
    commonTestValues.bigIntValue,
    commonTestValues.arrowFunction,
    { pipe: () => {} }, // Readable stream but not duplex
    { write: () => {} }, // Writable stream but not duplex
    { pipe: 'not a function', write: () => {} }, // Invalid pipe method
    { pipe: () => {}, write: 'not a function' }, // Invalid write method
  ],
};