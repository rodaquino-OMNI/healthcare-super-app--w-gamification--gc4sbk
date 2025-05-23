/**
 * @file assertion-fixtures.ts
 * @description Test fixtures for type assertion utilities
 * 
 * This file provides test fixtures for the type assertion utilities that enforce
 * type constraints at runtime. These fixtures include valid and invalid values
 * for each assertion type, along with expected error scenarios.
 */

import { JourneyType } from '@austa/errors/base';

/**
 * Enum used for testing enum assertions
 */
export enum TestEnum {
  Value1 = 'VALUE_1',
  Value2 = 'VALUE_2',
  Value3 = 'VALUE_3',
  NumericValue1 = 1,
  NumericValue2 = 2
}

/**
 * Test class for instance assertions
 */
export class TestClass {
  constructor(public name: string) {}
}

/**
 * Child class for testing inheritance with instance assertions
 */
export class ChildTestClass extends TestClass {
  constructor(name: string, public id: number) {
    super(name);
  }
}

/**
 * Discriminated union for testing exhaustive switch statements
 */
export type TestDiscriminatedUnion =
  | { type: 'type1'; value: string }
  | { type: 'type2'; count: number }
  | { type: 'type3'; flag: boolean };

/**
 * Fixtures for assertDefined tests
 */
export const definedFixtures = {
  valid: {
    string: 'test string',
    emptyString: '',
    number: 42,
    zero: 0,
    boolean: true,
    false: false,
    object: { key: 'value' },
    emptyObject: {},
    array: [1, 2, 3],
    emptyArray: [],
    date: new Date(),
    fn: () => {}
  },
  invalid: {
    null: null,
    undefined: undefined
  },
  paramNames: {
    simple: 'testParam',
    dotNotation: 'user.profile.email',
    withBrackets: 'items[0].name'
  },
  errorMessages: {
    custom: 'Custom error for missing parameter'
  },
  journeyContext: {
    health: JourneyType.HEALTH,
    care: JourneyType.CARE,
    plan: JourneyType.PLAN
  }
};

/**
 * Fixtures for assertType tests
 */
export const typeFixtures = {
  valid: {
    string: {
      value: 'test string',
      type: 'string' as const
    },
    number: {
      value: 42,
      type: 'number' as const
    },
    boolean: {
      value: true,
      type: 'boolean' as const
    },
    object: {
      value: { key: 'value' },
      type: 'object' as const
    },
    function: {
      value: () => {},
      type: 'function' as const
    },
    symbol: {
      value: Symbol('test'),
      type: 'symbol' as const
    },
    bigint: {
      value: BigInt(123),
      type: 'bigint' as const
    },
    undefined: {
      value: undefined,
      type: 'undefined' as const
    }
  },
  invalid: {
    stringAsNumber: {
      value: 'not a number',
      expectedType: 'number' as const
    },
    numberAsString: {
      value: 42,
      expectedType: 'string' as const
    },
    objectAsFunction: {
      value: { key: 'value' },
      expectedType: 'function' as const
    },
    arrayAsObject: {
      value: [1, 2, 3],
      expectedType: 'string' as const
    },
    nullAsObject: {
      value: null,
      expectedType: 'object' as const
    }
  },
  paramNames: {
    simple: 'testParam',
    complex: 'user.settings.theme'
  },
  errorMessages: {
    custom: 'Expected a different type'
  }
};

/**
 * Fixtures for string assertion tests
 */
export const stringFixtures = {
  valid: {
    normal: 'test string',
    empty: '',
    whitespace: '   ',
    numeric: '12345',
    special: '!@#$%^&*()'
  },
  invalid: {
    number: 42,
    boolean: true,
    object: { key: 'value' },
    array: [1, 2, 3],
    null: null,
    undefined: undefined,
    date: new Date()
  },
  nonEmpty: {
    valid: {
      normal: 'test string',
      numeric: '12345',
      special: '!@#$%^&*()'
    },
    invalid: {
      empty: '',
      whitespace: '   ',
      onlyNewline: '\n',
      onlyTab: '\t'
    }
  },
  paramNames: {
    simple: 'name',
    complex: 'user.profile.displayName'
  },
  errorMessages: {
    type: 'Value must be a string',
    empty: 'String cannot be empty or whitespace'
  }
};

/**
 * Fixtures for number assertion tests
 */
export const numberFixtures = {
  valid: {
    integer: 42,
    float: 3.14159,
    zero: 0,
    negative: -10,
    scientific: 1e6
  },
  invalid: {
    string: 'not a number',
    boolean: true,
    object: { key: 'value' },
    array: [1, 2, 3],
    null: null,
    undefined: undefined,
    nan: NaN
  },
  finite: {
    valid: {
      integer: 42,
      float: 3.14159,
      zero: 0,
      negative: -10
    },
    invalid: {
      infinity: Infinity,
      negativeInfinity: -Infinity,
      nan: NaN
    }
  },
  range: {
    valid: {
      inRange: {
        value: 5,
        min: 0,
        max: 10
      },
      atMin: {
        value: 0,
        min: 0,
        max: 10
      },
      atMax: {
        value: 10,
        min: 0,
        max: 10
      }
    },
    invalid: {
      belowMin: {
        value: -1,
        min: 0,
        max: 10
      },
      aboveMax: {
        value: 11,
        min: 0,
        max: 10
      }
    }
  },
  paramNames: {
    simple: 'age',
    complex: 'product.price.amount'
  },
  errorMessages: {
    type: 'Value must be a number',
    finite: 'Value must be a finite number',
    range: 'Value must be within the specified range'
  }
};

/**
 * Fixtures for boolean assertion tests
 */
export const booleanFixtures = {
  valid: {
    true: true,
    false: false
  },
  invalid: {
    string: 'true',
    number: 1,
    object: { key: 'value' },
    array: [1, 2, 3],
    null: null,
    undefined: undefined
  },
  paramNames: {
    simple: 'isActive',
    complex: 'user.settings.notifications.enabled'
  },
  errorMessages: {
    type: 'Value must be a boolean'
  }
};

/**
 * Fixtures for date assertion tests
 */
export const dateFixtures = {
  valid: {
    now: new Date(),
    past: new Date('2020-01-01'),
    future: new Date('2030-01-01'),
    withTime: new Date('2023-05-15T14:30:00Z')
  },
  invalid: {
    string: 'not a date',
    number: 1621234567890,
    boolean: true,
    object: { key: 'value' },
    array: [1, 2, 3],
    null: null,
    undefined: undefined,
    invalidDate: new Date('invalid date')
  },
  paramNames: {
    simple: 'birthDate',
    complex: 'appointment.scheduledTime'
  },
  errorMessages: {
    type: 'Value must be a Date object',
    invalid: 'Date is invalid'
  }
};

/**
 * Fixtures for array assertion tests
 */
export const arrayFixtures = {
  valid: {
    numbers: [1, 2, 3],
    strings: ['a', 'b', 'c'],
    mixed: [1, 'a', true, { key: 'value' }],
    empty: []
  },
  invalid: {
    string: 'not an array',
    number: 42,
    boolean: true,
    object: { key: 'value' },
    null: null,
    undefined: undefined
  },
  length: {
    valid: {
      exact: {
        array: [1, 2, 3],
        length: 3
      },
      empty: {
        array: [],
        length: 0
      }
    },
    invalid: {
      tooShort: {
        array: [1, 2],
        length: 3
      },
      tooLong: {
        array: [1, 2, 3, 4],
        length: 3
      }
    }
  },
  nonEmpty: {
    valid: {
      oneItem: [1],
      multipleItems: [1, 2, 3]
    },
    invalid: {
      empty: []
    }
  },
  paramNames: {
    simple: 'items',
    complex: 'user.permissions'
  },
  errorMessages: {
    type: 'Value must be an array',
    length: 'Array must have the specified length',
    empty: 'Array cannot be empty'
  }
};

/**
 * Fixtures for object assertion tests
 */
export const objectFixtures = {
  valid: {
    simple: { key: 'value' },
    nested: { user: { name: 'John', age: 30 } },
    empty: {}
  },
  invalid: {
    string: 'not an object',
    number: 42,
    boolean: true,
    array: [1, 2, 3],
    null: null,
    undefined: undefined
  },
  hasProperty: {
    valid: {
      direct: {
        object: { name: 'John', age: 30 },
        property: 'name'
      },
      withUndefined: {
        object: { name: 'John', age: undefined },
        property: 'age'
      },
      withNull: {
        object: { name: 'John', age: null },
        property: 'age'
      }
    },
    invalid: {
      missing: {
        object: { name: 'John' },
        property: 'age'
      },
      emptyObject: {
        object: {},
        property: 'name'
      }
    }
  },
  paramNames: {
    simple: 'config',
    complex: 'user.profile'
  },
  errorMessages: {
    type: 'Value must be an object',
    property: 'Object must have the specified property'
  }
};

/**
 * Fixtures for enum assertion tests
 */
export const enumFixtures = {
  valid: {
    string1: TestEnum.Value1,
    string2: TestEnum.Value2,
    string3: TestEnum.Value3,
    numeric1: TestEnum.NumericValue1,
    numeric2: TestEnum.NumericValue2
  },
  invalid: {
    invalidString: 'INVALID_VALUE',
    invalidNumber: 3,
    null: null,
    undefined: undefined
  },
  enumObject: TestEnum,
  paramNames: {
    simple: 'status',
    complex: 'order.status'
  },
  errorMessages: {
    invalid: 'Value must be a valid enum value'
  }
};

/**
 * Fixtures for pattern assertion tests
 */
export const patternFixtures = {
  valid: {
    alphanumeric: {
      value: 'abc123',
      pattern: /^[a-zA-Z0-9]+$/,
      formatName: 'alphanumeric'
    },
    zipCode: {
      value: '12345',
      pattern: /^\d{5}$/,
      formatName: 'zipCode'
    },
    phoneNumber: {
      value: '(123) 456-7890',
      pattern: /^\(\d{3}\)\s\d{3}-\d{4}$/,
      formatName: 'phoneNumber'
    }
  },
  invalid: {
    alphanumeric: {
      value: 'abc-123',
      pattern: /^[a-zA-Z0-9]+$/,
      formatName: 'alphanumeric'
    },
    zipCode: {
      value: '1234',
      pattern: /^\d{5}$/,
      formatName: 'zipCode'
    },
    phoneNumber: {
      value: '123-456-7890',
      pattern: /^\(\d{3}\)\s\d{3}-\d{4}$/,
      formatName: 'phoneNumber'
    }
  },
  paramNames: {
    simple: 'zipCode',
    complex: 'user.contact.phone'
  },
  errorMessages: {
    invalid: 'Value must match the specified pattern'
  }
};

/**
 * Fixtures for email assertion tests
 */
export const emailFixtures = {
  valid: {
    simple: 'user@example.com',
    withSubdomain: 'user@sub.example.com',
    withPlus: 'user+tag@example.com',
    withDot: 'user.name@example.com',
    withNumbers: 'user123@example.com',
    withDash: 'user-name@example.com',
    withUnderscores: 'user_name@example.com'
  },
  invalid: {
    noAt: 'userexample.com',
    noDomain: 'user@',
    noUsername: '@example.com',
    invalidChars: 'user!@example.com',
    multipleAt: 'user@domain@example.com',
    emptyString: '',
    notAString: 42
  },
  paramNames: {
    simple: 'email',
    complex: 'user.contact.email'
  },
  errorMessages: {
    invalid: 'Value must be a valid email address'
  }
};

/**
 * Fixtures for URL assertion tests
 */
export const urlFixtures = {
  valid: {
    http: 'http://example.com',
    https: 'https://example.com',
    withPath: 'https://example.com/path',
    withQuery: 'https://example.com/path?query=value',
    withFragment: 'https://example.com/path#section',
    withPort: 'https://example.com:8080/path',
    withSubdomain: 'https://sub.example.com',
    localhost: 'http://localhost:3000'
  },
  invalid: {
    noProtocol: 'example.com',
    invalidProtocol: 'invalid://example.com',
    emptyString: '',
    notAString: 42,
    malformed: 'http:/example.com',
    spacesInUrl: 'http://example. com'
  },
  paramNames: {
    simple: 'url',
    complex: 'website.homepageUrl'
  },
  errorMessages: {
    invalid: 'Value must be a valid URL'
  }
};

/**
 * Fixtures for condition assertion tests
 */
export const conditionFixtures = {
  valid: {
    trueCondition: true
  },
  invalid: {
    falseCondition: false
  },
  paramNames: {
    simple: 'condition',
    complex: 'validation.isValid'
  },
  errorMessages: {
    simple: 'Condition must be true',
    detailed: 'Value must meet the specified condition: greater than zero'
  }
};

/**
 * Fixtures for assertOneOf tests
 */
export const oneOfFixtures = {
  valid: {
    string: {
      value: 'apple',
      allowedValues: ['apple', 'banana', 'orange']
    },
    number: {
      value: 2,
      allowedValues: [1, 2, 3]
    },
    mixed: {
      value: 'banana',
      allowedValues: ['apple', 'banana', 3, true]
    }
  },
  invalid: {
    string: {
      value: 'grape',
      allowedValues: ['apple', 'banana', 'orange']
    },
    number: {
      value: 4,
      allowedValues: [1, 2, 3]
    },
    mixed: {
      value: false,
      allowedValues: ['apple', 'banana', 3, true]
    }
  },
  paramNames: {
    simple: 'fruit',
    complex: 'user.preferences.theme'
  },
  errorMessages: {
    invalid: 'Value must be one of the allowed values'
  }
};

/**
 * Fixtures for instance assertion tests
 */
export const instanceFixtures = {
  valid: {
    direct: {
      value: new TestClass('test'),
      constructor: TestClass
    },
    inherited: {
      value: new ChildTestClass('test', 1),
      constructor: TestClass
    },
    builtIn: {
      value: new Date(),
      constructor: Date
    }
  },
  invalid: {
    wrongClass: {
      value: new Date(),
      constructor: TestClass
    },
    primitive: {
      value: 'string',
      constructor: TestClass
    },
    plainObject: {
      value: { name: 'test' },
      constructor: TestClass
    },
    null: {
      value: null,
      constructor: TestClass
    },
    undefined: {
      value: undefined,
      constructor: TestClass
    }
  },
  paramNames: {
    simple: 'instance',
    complex: 'user.profile'
  },
  errorMessages: {
    invalid: 'Value must be an instance of the specified class'
  }
};

/**
 * Fixtures for exhaustive switch statement checking
 */
export const neverFixtures = {
  discriminatedUnion: {
    type1: { type: 'type1', value: 'test' } as TestDiscriminatedUnion,
    type2: { type: 'type2', count: 42 } as TestDiscriminatedUnion,
    type3: { type: 'type3', flag: true } as TestDiscriminatedUnion
  },
  // This would be a compile-time error if used with assertNever
  // invalidType: { type: 'type4', extra: 'invalid' } as any
};

/**
 * Combined fixtures for all assertion tests
 */
export const assertionFixtures = {
  defined: definedFixtures,
  type: typeFixtures,
  string: stringFixtures,
  number: numberFixtures,
  boolean: booleanFixtures,
  date: dateFixtures,
  array: arrayFixtures,
  object: objectFixtures,
  enum: enumFixtures,
  pattern: patternFixtures,
  email: emailFixtures,
  url: urlFixtures,
  condition: conditionFixtures,
  oneOf: oneOfFixtures,
  instance: instanceFixtures,
  never: neverFixtures,
  journeyTypes: {
    health: JourneyType.HEALTH,
    care: JourneyType.CARE,
    plan: JourneyType.PLAN
  }
};