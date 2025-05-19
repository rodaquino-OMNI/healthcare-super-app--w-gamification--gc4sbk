/**
 * Test fixtures for type assertion utilities.
 * Contains valid and invalid values for each assertion type, along with expected error scenarios.
 * These fixtures are essential for testing assertion functions that detect type errors early
 * and throw appropriate errors, particularly important for defensive programming in API
 * boundaries and external integrations.
 */

/**
 * Error codes for type assertion failures.
 * These match the codes defined in the assertions.ts file.
 */
enum TypeAssertionErrorCode {
  INVALID_STRING = 'TYPE_001',
  INVALID_NUMBER = 'TYPE_002',
  INVALID_BOOLEAN = 'TYPE_003',
  INVALID_OBJECT = 'TYPE_004',
  INVALID_ARRAY = 'TYPE_005',
  INVALID_DATE = 'TYPE_006',
  INVALID_FUNCTION = 'TYPE_007',
  UNDEFINED_VALUE = 'TYPE_008',
  NULL_VALUE = 'TYPE_009',
  EXHAUSTIVE_CHECK_FAILED = 'TYPE_010',
  TYPE_MISMATCH = 'TYPE_011',
}

/**
 * Fixtures for string assertions
 */
export const stringFixtures = {
  valid: [
    'Hello world',
    '',
    '123',
    'true',
    'null',
    JSON.stringify({ key: 'value' }),
    '\n\t\r',
  ],
  invalid: [
    123,
    true,
    false,
    null,
    undefined,
    {},
    [],
    new Date(),
    () => {},
    Symbol('test'),
  ],
  errorMessages: {
    default: 'Expected string, but received',
    custom: 'Invalid string input for user name',
  },
  errorCode: TypeAssertionErrorCode.INVALID_STRING,
};

/**
 * Fixtures for number assertions
 */
export const numberFixtures = {
  valid: [
    0,
    1,
    -1,
    1.5,
    -1.5,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
    Number.EPSILON,
    Number.MAX_VALUE,
    Number.MIN_VALUE,
    Infinity,
    -Infinity,
  ],
  invalid: [
    NaN,
    '123',
    true,
    false,
    null,
    undefined,
    {},
    [],
    new Date(),
    () => {},
    Symbol('test'),
  ],
  errorMessages: {
    default: 'Expected number, but received',
    custom: 'Invalid numeric value for age',
    nan: 'Expected a valid number, but received NaN',
  },
  errorCode: TypeAssertionErrorCode.INVALID_NUMBER,
};

/**
 * Fixtures for boolean assertions
 */
export const booleanFixtures = {
  valid: [
    true,
    false,
  ],
  invalid: [
    0,
    1,
    'true',
    'false',
    null,
    undefined,
    {},
    [],
    new Date(),
    () => {},
    Symbol('test'),
  ],
  errorMessages: {
    default: 'Expected boolean, but received',
    custom: 'Invalid boolean value for isActive flag',
  },
  errorCode: TypeAssertionErrorCode.INVALID_BOOLEAN,
};

/**
 * Fixtures for object assertions
 */
export const objectFixtures = {
  valid: [
    {},
    { key: 'value' },
    { nested: { key: 'value' } },
    Object.create(null),
    new Object(),
    new Error('test error'),
  ],
  invalid: [
    null,
    [],
    [1, 2, 3],
    new Array(),
    'object',
    123,
    true,
    undefined,
    () => {},
    Symbol('test'),
  ],
  errorMessages: {
    default: 'Expected object, but received',
    custom: 'Invalid object structure for user profile',
  },
  errorCode: TypeAssertionErrorCode.INVALID_OBJECT,
};

/**
 * Fixtures for array assertions
 */
export const arrayFixtures = {
  valid: [
    [],
    [1, 2, 3],
    ['a', 'b', 'c'],
    [true, false],
    [null, undefined],
    [{}],
    new Array(),
    new Array(3),
    Array.from('abc'),
  ],
  invalid: [
    {},
    { length: 3 },
    'array',
    123,
    true,
    null,
    undefined,
    () => {},
    Symbol('test'),
  ],
  errorMessages: {
    default: 'Expected array, but received',
    custom: 'Invalid array input for medication list',
  },
  errorCode: TypeAssertionErrorCode.INVALID_ARRAY,
};

/**
 * Fixtures for date assertions
 */
export const dateFixtures = {
  valid: [
    new Date(),
    new Date('2023-01-01'),
    new Date(2023, 0, 1),
    new Date(0),
  ],
  invalid: [
    new Date('invalid date'), // Invalid date (NaN timestamp)
    'date',
    '2023-01-01',
    123,
    true,
    null,
    undefined,
    {},
    [],
    () => {},
    Symbol('test'),
  ],
  errorMessages: {
    default: 'Expected valid Date, but received',
    custom: 'Invalid date format for appointment date',
  },
  errorCode: TypeAssertionErrorCode.INVALID_DATE,
};

/**
 * Fixtures for function assertions
 */
export const functionFixtures = {
  valid: [
    () => {},
    function() {},
    async () => {},
    function* () {},
    class Test {},
    Date,
    Object,
    Array,
    String,
    Boolean,
    Number,
    Function,
    Math.random,
    console.log,
  ],
  invalid: [
    {},
    [],
    'function',
    123,
    true,
    null,
    undefined,
    Symbol('test'),
  ],
  errorMessages: {
    default: 'Expected function, but received',
    custom: 'Invalid callback function for event handler',
  },
  errorCode: TypeAssertionErrorCode.INVALID_FUNCTION,
};

/**
 * Fixtures for defined assertions
 */
export const definedFixtures = {
  valid: [
    '',
    0,
    false,
    null,
    {},
    [],
    () => {},
    Symbol('test'),
  ],
  invalid: [
    undefined,
  ],
  errorMessages: {
    default: 'Value is undefined',
    custom: 'Required parameter missing: userId',
  },
  errorCode: TypeAssertionErrorCode.UNDEFINED_VALUE,
};

/**
 * Fixtures for non-null assertions
 */
export const nonNullFixtures = {
  valid: [
    '',
    0,
    false,
    undefined,
    {},
    [],
    () => {},
    Symbol('test'),
  ],
  invalid: [
    null,
  ],
  errorMessages: {
    default: 'Value is null',
    custom: 'User profile cannot be null',
  },
  errorCode: TypeAssertionErrorCode.NULL_VALUE,
};

/**
 * Fixtures for non-nullable assertions
 */
export const nonNullableFixtures = {
  valid: [
    '',
    0,
    false,
    {},
    [],
    () => {},
    Symbol('test'),
  ],
  invalid: [
    null,
    undefined,
  ],
  errorMessages: {
    default: ['Value is null', 'Value is undefined'],
    custom: 'Required value missing for patient record',
  },
  errorCodes: [
    TypeAssertionErrorCode.NULL_VALUE,
    TypeAssertionErrorCode.UNDEFINED_VALUE,
  ],
};

/**
 * Fixtures for type assertions
 */
export const typeFixtures = {
  string: {
    valid: 'test string',
    invalid: [123, true, null, undefined, {}, [], () => {}, Symbol('test')],
    errorMessages: {
      default: 'Expected string, but received',
      custom: 'Invalid string type for username',
    },
  },
  number: {
    valid: 42,
    invalid: ['42', true, null, undefined, {}, [], () => {}, Symbol('test')],
    errorMessages: {
      default: 'Expected number, but received',
      custom: 'Invalid number type for age',
    },
  },
  boolean: {
    valid: true,
    invalid: [0, '0', null, undefined, {}, [], () => {}, Symbol('test')],
    errorMessages: {
      default: 'Expected boolean, but received',
      custom: 'Invalid boolean type for isActive',
    },
  },
  object: {
    valid: { test: 'value' },
    invalid: [123, 'object', true, null, undefined, [], () => {}, Symbol('test')],
    errorMessages: {
      default: 'Expected object, but received',
      custom: 'Invalid object type for user profile',
    },
  },
  function: {
    valid: () => {},
    invalid: [123, 'function', true, null, undefined, {}, [], Symbol('test')],
    errorMessages: {
      default: 'Expected function, but received',
      custom: 'Invalid function type for callback',
    },
  },
  errorCode: TypeAssertionErrorCode.TYPE_MISMATCH,
};

/**
 * Fixtures for instance assertions
 */
export const instanceFixtures = {
  Date: {
    class: Date,
    valid: new Date(),
    invalid: ['2023-01-01', 123, true, null, undefined, {}, [], () => {}, Symbol('test')],
    errorMessages: {
      default: 'Expected instance of Date, but received',
      custom: 'Invalid Date instance for birthdate',
    },
  },
  Array: {
    class: Array,
    valid: [],
    invalid: [{}, 'array', 123, true, null, undefined, () => {}, Symbol('test')],
    errorMessages: {
      default: 'Expected instance of Array, but received',
      custom: 'Invalid Array instance for medication list',
    },
  },
  Error: {
    class: Error,
    valid: new Error('test error'),
    invalid: [{}, 'error', 123, true, null, undefined, () => {}, Symbol('test')],
    errorMessages: {
      default: 'Expected instance of Error, but received',
      custom: 'Invalid Error instance for exception handling',
    },
  },
  errorCode: TypeAssertionErrorCode.TYPE_MISMATCH,
};

/**
 * Fixtures for never assertions (exhaustive checks)
 */
export const neverFixtures = {
  // Values that should never occur in properly typed code
  unexpectedValues: [
    'unexpected string',
    123,
    true,
    null,
    undefined,
    {},
    [],
    () => {},
    Symbol('test'),
  ],
  errorMessages: {
    default: 'Unexpected value:',
    custom: 'Unhandled case in switch statement',
  },
  errorCode: TypeAssertionErrorCode.EXHAUSTIVE_CHECK_FAILED,
};

/**
 * Fixtures for condition assertions
 */
export const assertFixtures = {
  valid: [
    true,
  ],
  invalid: [
    false,
  ],
  errorMessages: {
    custom: 'Condition failed: user must be at least 18 years old',
  },
  errorCode: TypeAssertionErrorCode.TYPE_MISMATCH,
};

/**
 * Fixtures for oneOf assertions
 */
export const oneOfFixtures = {
  allowedValues: {
    strings: ['health', 'care', 'plan'] as const,
    numbers: [1, 2, 3, 4, 5] as const,
    mixed: ['draft', 'pending', 'approved', 'rejected', 1, 2, 3] as const,
  },
  valid: {
    strings: 'health',
    numbers: 3,
    mixed: 'approved',
  },
  invalid: {
    strings: ['invalid', 123, true, null, undefined, {}, [], () => {}, Symbol('test')],
    numbers: [0, 6, '3', true, null, undefined, {}, [], () => {}, Symbol('test')],
    mixed: ['invalid', 0, true, null, undefined, {}, [], () => {}, Symbol('test')],
  },
  errorMessages: {
    default: 'Expected one of',
    custom: 'Invalid journey type selected',
  },
  errorCode: TypeAssertionErrorCode.TYPE_MISMATCH,
};

/**
 * Nested object fixtures for deep property assertions
 */
export const nestedObjectFixtures = {
  valid: {
    user: {
      id: 123,
      profile: {
        name: 'John Doe',
        age: 30,
        contact: {
          email: 'john@example.com',
          phone: '+1234567890',
          address: {
            street: '123 Main St',
            city: 'New York',
            country: 'USA',
          },
        },
        preferences: {
          theme: 'dark',
          notifications: true,
          language: 'en',
        },
      },
      journeyData: {
        health: {
          metrics: [
            { name: 'weight', value: 70, unit: 'kg' },
            { name: 'height', value: 175, unit: 'cm' },
          ],
          goals: [
            { type: 'weight', target: 65, deadline: new Date('2023-12-31') },
          ],
        },
        care: {
          appointments: [
            { id: 1, date: new Date('2023-06-15'), provider: 'Dr. Smith', status: 'confirmed' },
          ],
          medications: [
            { name: 'Aspirin', dosage: '100mg', frequency: 'daily' },
          ],
        },
        plan: {
          coverage: { type: 'premium', expiryDate: new Date('2023-12-31') },
          claims: [
            { id: 'CLM001', amount: 500, status: 'approved', date: new Date('2023-05-10') },
          ],
        },
      },
    },
  },
  invalid: {
    missingProperties: {
      user: {
        id: 123,
        // profile is missing
        journeyData: {
          health: {
            // metrics is missing
            goals: [],
          },
        },
      },
    },
    invalidTypes: {
      user: {
        id: '123', // should be number
        profile: {
          name: 123, // should be string
          age: '30', // should be number
          contact: null, // should be object
        },
        journeyData: {
          health: 'active', // should be object
          care: {
            appointments: 'none', // should be array
          },
          plan: {
            coverage: { type: 123 }, // should be string
          },
        },
      },
    },
    nullValues: {
      user: null,
      profile: null,
      journeyData: null,
      health: null,
      care: null,
      plan: null,
    },
  },
  errorMessages: {
    missingProperty: 'Required property missing:',
    invalidType: 'Invalid type for property:',
    nullValue: 'Property cannot be null:',
  },
};

/**
 * Fixtures for exhaustive switch statement checking
 */
export const exhaustiveSwitchFixtures = {
  // Define a union type for testing exhaustive switch statements
  journeyType: ['health', 'care', 'plan'] as const,
  // Define a union type with numeric values
  statusCode: [200, 400, 404, 500] as const,
  // Define a union type with mixed values
  appointmentStatus: ['scheduled', 'confirmed', 'cancelled', 'completed', 'no-show'] as const,
  // Define test cases that should be handled in switch statements
  testCases: {
    journeyType: ['health', 'care', 'plan'],
    statusCode: [200, 400, 404, 500],
    appointmentStatus: ['scheduled', 'confirmed', 'cancelled', 'completed', 'no-show'],
  },
  // Define invalid values that should trigger assertNever
  invalidValues: {
    journeyType: 'invalid' as any,
    statusCode: 300 as any,
    appointmentStatus: 'pending' as any,
  },
  errorMessages: {
    default: 'Unexpected value:',
    custom: {
      journeyType: 'Unhandled journey type:',
      statusCode: 'Unhandled status code:',
      appointmentStatus: 'Unhandled appointment status:',
    },
  },
  errorCode: TypeAssertionErrorCode.EXHAUSTIVE_CHECK_FAILED,
};

/**
 * Combined fixtures export for easier importing
 */
export const assertionFixtures = {
  string: stringFixtures,
  number: numberFixtures,
  boolean: booleanFixtures,
  object: objectFixtures,
  array: arrayFixtures,
  date: dateFixtures,
  function: functionFixtures,
  defined: definedFixtures,
  nonNull: nonNullFixtures,
  nonNullable: nonNullableFixtures,
  type: typeFixtures,
  instanceOf: instanceFixtures,
  never: neverFixtures,
  assert: assertFixtures,
  oneOf: oneOfFixtures,
  nestedObject: nestedObjectFixtures,
  exhaustiveSwitch: exhaustiveSwitchFixtures,
};