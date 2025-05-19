/**
 * Test fixtures for TypeScript type predicates that enable type narrowing in conditional blocks.
 * 
 * Includes union types, discriminated unions, and generic data structures that require proper
 * type narrowing. These fixtures are essential for testing type predicate functions that improve
 * type safety throughout the codebase, especially when working with complex data structures
 * common in cross-journey operations.
 */

import { FilterDto, PaginationDto, SortDto } from '@austa/interfaces/common/dto';

// ===== Basic Type Predicate Fixtures =====

/**
 * Fixtures for testing isDefined predicate
 */
export const definedFixtures = {
  defined: [
    'string',
    0,
    false,
    {},
    [],
    null, // Note: null is defined (not undefined)
    () => {},
    new Date(),
  ],
  undefined: [
    undefined,
  ],
};

/**
 * Fixtures for testing isNotNull predicate
 */
export const notNullFixtures = {
  notNull: [
    'string',
    0,
    false,
    {},
    [],
    undefined, // Note: undefined is not null
    () => {},
    new Date(),
  ],
  null: [
    null,
  ],
};

/**
 * Fixtures for testing isNotUndefined predicate
 */
export const notUndefinedFixtures = {
  notUndefined: [
    'string',
    0,
    false,
    {},
    [],
    null, // Note: null is not undefined
    () => {},
    new Date(),
  ],
  undefined: [
    undefined,
  ],
};

// ===== Array Type Predicate Fixtures =====

/**
 * Fixtures for testing isNonEmptyArray predicate
 */
export const nonEmptyArrayFixtures = {
  nonEmpty: [
    [1, 2, 3],
    ['a', 'b', 'c'],
    [{}],
    [null],
    [undefined],
    [[]], // Array containing an empty array
    [0],
    [false],
    [new Date()],
  ],
  empty: [
    [],
  ],
  notArray: [
    null,
    undefined,
    'string',
    0,
    false,
    {},
    () => {},
    new Date(),
    { length: 1 }, // Object with length property
  ],
};

/**
 * Fixtures for testing isArrayOfLength predicate
 */
export const arrayOfLengthFixtures = {
  lengths: {
    0: [],
    1: [1],
    2: [1, 2],
    3: [1, 2, 3],
    5: [1, 2, 3, 4, 5],
  },
  notArray: [
    null,
    undefined,
    'string',
    0,
    false,
    {},
    () => {},
    new Date(),
    { length: 3 }, // Object with length property
  ],
};

/**
 * Fixtures for testing isArrayOf predicate
 */
export const arrayOfFixtures = {
  strings: {
    valid: [
      ['a', 'b', 'c'],
      [''],
      ['hello', 'world'],
    ],
    invalid: [
      [1, 2, 3],
      ['a', 1, 'b'],
      [null],
      [undefined],
      [{}],
      [() => {}],
      [new Date()],
    ],
  },
  numbers: {
    valid: [
      [1, 2, 3],
      [0],
      [-1, 0, 1],
      [3.14, 2.71],
    ],
    invalid: [
      ['1', '2', '3'],
      [1, '2', 3],
      [null],
      [undefined],
      [{}],
      [() => {}],
      [new Date()],
    ],
  },
  booleans: {
    valid: [
      [true, false],
      [true],
      [false],
      [true, true, false],
    ],
    invalid: [
      [1, 0],
      ['true', 'false'],
      [true, 1, false],
      [null],
      [undefined],
      [{}],
      [() => {}],
      [new Date()],
    ],
  },
  objects: {
    valid: [
      [{}, {}],
      [{ a: 1 }, { b: 2 }],
      [{ name: 'John' }],
    ],
    invalid: [
      [1, 2, 3],
      ['a', 'b', 'c'],
      [{}, 1, {}],
      [null],
      [undefined],
      [() => {}],
      [new Date()],
    ],
  },
  notArray: [
    null,
    undefined,
    'string',
    0,
    false,
    {},
    () => {},
    new Date(),
  ],
};

// ===== Object Type Predicate Fixtures =====

/**
 * Fixtures for testing hasProperty predicate
 */
export const hasPropertyFixtures = {
  objects: [
    { name: 'John', age: 30 },
    { id: 1, items: [1, 2, 3] },
    { visible: false, enabled: true },
    { nested: { key: 'value' } },
    { '': 'empty key' }, // Object with empty string key
    { [Symbol('key')]: 'symbol key' }, // Object with Symbol key
  ],
  properties: {
    existing: [
      'name',
      'age',
      'id',
      'items',
      'visible',
      'enabled',
      'nested',
      '',
    ],
    nonExisting: [
      'address',
      'email',
      'phone',
      'firstName',
      'lastName',
      'nonExistent',
      'undefined',
      'null',
    ],
  },
  notObjects: [
    null,
    undefined,
    'string',
    0,
    false,
    [],
    () => {},
    new Date(),
  ],
};

/**
 * Fixtures for testing hasPropertyOfType predicate
 */
export const hasPropertyOfTypeFixtures = {
  objects: {
    withStringProps: [
      { name: 'John', title: 'Developer' },
      { id: '123', code: 'ABC' },
      { message: 'Hello', error: '' },
    ],
    withNumberProps: [
      { age: 30, count: 5 },
      { id: 123, total: 99.99 },
      { index: 0, value: -1 },
    ],
    withBooleanProps: [
      { active: true, visible: false },
      { enabled: true, deleted: false },
      { isAdmin: true, isVerified: true },
    ],
    withObjectProps: [
      { user: { name: 'John' }, settings: { theme: 'dark' } },
      { metadata: {}, config: { timeout: 1000 } },
      { address: { city: 'New York' }, contact: { email: 'test@example.com' } },
    ],
    withArrayProps: [
      { items: [1, 2, 3], tags: ['a', 'b', 'c'] },
      { users: [], products: [{ id: 1 }] },
      { history: [new Date()], selection: [true, false] },
    ],
    withFunctionProps: [
      { onClick: () => {}, onChange: () => {} },
      { validate: () => true, format: (s: string) => s.toUpperCase() },
      { calculate: () => 0, transform: () => ({}) },
    ],
    withDateProps: [
      { created: new Date(), updated: new Date() },
      { birthdate: new Date('2000-01-01'), expiry: new Date('2025-12-31') },
      { start: new Date(), end: new Date() },
    ],
    withMixedProps: [
      { name: 'John', age: 30, active: true, tags: ['user'] },
      { id: 1, title: 'Post', published: false, author: { name: 'Jane' } },
      { count: 5, message: 'Hello', valid: true, data: null },
    ],
    withNullableProps: [
      { name: 'John', address: null },
      { id: 1, parent: null },
      { user: null, settings: { theme: 'dark' } },
    ],
    withUndefinedProps: [
      { name: 'John', address: undefined },
      { id: 1, parent: undefined },
      { user: undefined, settings: { theme: 'dark' } },
    ],
  },
  notObjects: [
    null,
    undefined,
    'string',
    0,
    false,
    [],
    () => {},
    new Date(),
  ],
};

/**
 * Fixtures for testing hasProperties predicate
 */
export const hasPropertiesFixtures = {
  objects: [
    { name: 'John', age: 30, email: 'john@example.com' },
    { id: 1, title: 'Post', content: 'Lorem ipsum', author: 'Jane' },
    { x: 10, y: 20, z: 30, type: 'point' },
    { firstName: 'John', lastName: 'Doe', fullName: 'John Doe' },
    { visible: true, enabled: false, active: true, deleted: false },
  ],
  propertyGroups: {
    user: ['name', 'age', 'email'],
    post: ['id', 'title', 'content', 'author'],
    point: ['x', 'y', 'z', 'type'],
    name: ['firstName', 'lastName', 'fullName'],
    flags: ['visible', 'enabled', 'active', 'deleted'],
    mixed: ['name', 'id', 'visible', 'x'],
    nonExistent: ['address', 'phone', 'city', 'country'],
    partiallyExistent: ['name', 'address', 'age', 'phone'],
  },
  notObjects: [
    null,
    undefined,
    'string',
    0,
    false,
    [],
    () => {},
    new Date(),
  ],
};

// ===== Class Instance Type Predicate Fixtures =====

/**
 * Sample classes for testing instance predicates
 */
class BaseClass {
  constructor(public id: number) {}
}

class ChildClass extends BaseClass {
  constructor(id: number, public name: string) {
    super(id);
  }
}

class SiblingClass extends BaseClass {
  constructor(id: number, public type: string) {
    super(id);
  }
}

class UnrelatedClass {
  constructor(public value: any) {}
}

/**
 * Fixtures for testing isInstanceOf predicate
 */
export const instanceOfFixtures = {
  instances: {
    date: new Date(),
    error: new Error('Test error'),
    map: new Map<string, any>(),
    set: new Set<any>(),
    regexp: new RegExp('.*'),
    promise: Promise.resolve(),
    baseClass: new BaseClass(1),
    childClass: new ChildClass(2, 'Child'),
    siblingClass: new SiblingClass(3, 'Sibling'),
    unrelatedClass: new UnrelatedClass('test'),
  },
  constructors: {
    Date,
    Error,
    Map,
    Set,
    RegExp,
    Promise,
    BaseClass,
    ChildClass,
    SiblingClass,
    UnrelatedClass,
  },
  primitives: [
    null,
    undefined,
    'string',
    0,
    false,
    [],
    {},
    () => {},
  ],
};

/**
 * Fixtures for testing isInstanceOfAny predicate
 */
export const instanceOfAnyFixtures = {
  instances: {
    date: new Date(),
    error: new Error('Test error'),
    map: new Map<string, any>(),
    set: new Set<any>(),
    regexp: new RegExp('.*'),
    promise: Promise.resolve(),
    baseClass: new BaseClass(1),
    childClass: new ChildClass(2, 'Child'),
    siblingClass: new SiblingClass(3, 'Sibling'),
    unrelatedClass: new UnrelatedClass('test'),
  },
  constructorGroups: {
    dateAndError: [Date, Error],
    collections: [Map, Set],
    baseAndChild: [BaseClass, ChildClass],
    allClasses: [BaseClass, ChildClass, SiblingClass, UnrelatedClass],
    unrelated: [UnrelatedClass],
    mixed: [Date, BaseClass, Promise],
  },
  primitives: [
    null,
    undefined,
    'string',
    0,
    false,
    [],
    {},
    () => {},
  ],
};

// ===== Journey-Specific Type Predicate Fixtures =====

/**
 * Fixtures for testing isFilterDto predicate
 */
export const filterDtoFixtures = {
  valid: [
    { where: { id: 1 } },
    { include: { user: true } },
    { select: { name: true, email: true } },
    { where: { name: 'John' }, include: { posts: true } },
    { where: { active: true }, select: { id: true, name: true } },
    { include: { profile: true }, select: { id: true } },
    { where: { id: { gt: 10 } }, include: { comments: { select: { text: true } } } },
  ] as FilterDto[],
  invalid: [
    {},
    { sort: { id: 'asc' } },
    { page: 1, limit: 10 },
    { filter: { name: 'John' } },
    { query: 'search term' },
    null,
    undefined,
    'string',
    0,
    false,
    [],
    () => {},
    new Date(),
  ],
};

/**
 * Fixtures for testing isPaginationDto predicate
 */
export const paginationDtoFixtures = {
  valid: [
    { page: 1, limit: 10 },
    { page: 0, limit: 50 },
    { page: 5, limit: 100 },
    { cursor: 'abc123' },
    { cursor: null },
    { page: 1, limit: 10, cursor: 'abc123' }, // Mixed (should still be valid)
  ] as PaginationDto[],
  invalid: [
    {},
    { page: 1 }, // Missing limit
    { limit: 10 }, // Missing page
    { offset: 10, limit: 10 }, // Wrong property name
    { page: 'a', limit: 10 }, // Invalid page type
    { page: 1, limit: 'a' }, // Invalid limit type
    { cursor: 123 }, // Invalid cursor type
    { where: { id: 1 } },
    { include: { user: true } },
    { select: { name: true } },
    null,
    undefined,
    'string',
    0,
    false,
    [],
    () => {},
    new Date(),
  ],
};

/**
 * Fixtures for testing isSortDto predicate
 */
export const sortDtoFixtures = {
  valid: [
    { orderBy: { id: 'asc' } },
    { orderBy: { name: 'desc' } },
    { orderBy: { createdAt: 'asc', id: 'desc' } },
    { orderBy: { score: { sort: 'desc', nulls: 'last' } } },
    { orderBy: { name: 'asc', age: { sort: 'desc', nulls: 'first' } } },
  ] as SortDto[],
  invalid: [
    {},
    { orderBy: null },
    { orderBy: undefined },
    { orderBy: 'asc' }, // String instead of object
    { orderBy: [] }, // Array instead of object
    { sort: { id: 'asc' } }, // Wrong property name
    { order: { id: 'asc' } }, // Wrong property name
    { where: { id: 1 } },
    { include: { user: true } },
    { select: { name: true } },
    { page: 1, limit: 10 },
    null,
    undefined,
    'string',
    0,
    false,
    [],
    () => {},
    new Date(),
  ],
};

// ===== Union Type Predicate Fixtures =====

/**
 * Fixtures for testing isOneOf predicate
 */
export const oneOfFixtures = {
  validValues: {
    strings: ['health', 'care', 'plan'] as const,
    numbers: [1, 2, 3, 4, 5] as const,
    mixed: ['draft', 'pending', 'approved', 'rejected', 1, 2, 3] as const,
    empty: [] as const,
  },
  testValues: {
    strings: {
      valid: ['health', 'care', 'plan'],
      invalid: ['invalid', 'unknown', 'other', '', 'HEALTH', 'Care'],
    },
    numbers: {
      valid: [1, 2, 3, 4, 5],
      invalid: [0, 6, -1, 1.5, NaN, Infinity],
    },
    mixed: {
      valid: ['draft', 'pending', 'approved', 'rejected', 1, 2, 3],
      invalid: ['invalid', 0, 4, 'DRAFT', 'Pending'],
    },
  },
  nonMatchingTypes: [
    null,
    undefined,
    {},
    [],
    () => {},
    new Date(),
  ],
};

/**
 * Fixtures for testing isOneOfType predicate
 */
export const oneOfTypeFixtures = {
  values: {
    stringOrNumber: [
      'string',
      123,
      '',
      0,
      -1,
      'hello',
    ],
    booleanOrDate: [
      true,
      false,
      new Date(),
      new Date(0),
    ],
    objectOrArray: [
      {},
      { a: 1 },
      [],
      [1, 2, 3],
    ],
  },
  nonMatchingTypes: [
    null,
    undefined,
    Symbol('test'),
    () => {},
  ],
};

// ===== Discriminated Union Type Predicate Fixtures =====

/**
 * Type definitions for discriminated union testing
 */
type Circle = { kind: 'circle'; radius: number };
type Rectangle = { kind: 'rectangle'; width: number; height: number };
type Triangle = { kind: 'triangle'; base: number; height: number };
type Shape = Circle | Rectangle | Triangle;

type HealthEvent = { type: 'health'; metricId: string; value: number };
type CareEvent = { type: 'care'; appointmentId: string; status: string };
type PlanEvent = { type: 'plan'; claimId: string; amount: number };
type JourneyEvent = HealthEvent | CareEvent | PlanEvent;

type SuccessResponse = { status: 'success'; data: any };
type ErrorResponse = { status: 'error'; message: string; code: number };
type LoadingResponse = { status: 'loading' };
type ApiResponse = SuccessResponse | ErrorResponse | LoadingResponse;

/**
 * Fixtures for testing hasDiscriminator predicate
 */
export const discriminatorFixtures = {
  shapes: {
    circle: { kind: 'circle', radius: 5 } as Circle,
    rectangle: { kind: 'rectangle', width: 10, height: 20 } as Rectangle,
    triangle: { kind: 'triangle', base: 10, height: 15 } as Triangle,
    invalidShape: { kind: 'oval', radius: 5, width: 10 } as any,
  },
  journeyEvents: {
    health: { type: 'health', metricId: 'weight', value: 70 } as HealthEvent,
    care: { type: 'care', appointmentId: 'apt123', status: 'confirmed' } as CareEvent,
    plan: { type: 'plan', claimId: 'clm456', amount: 100 } as PlanEvent,
    invalidEvent: { type: 'notification', message: 'New message' } as any,
  },
  apiResponses: {
    success: { status: 'success', data: { id: 1, name: 'John' } } as SuccessResponse,
    error: { status: 'error', message: 'Not found', code: 404 } as ErrorResponse,
    loading: { status: 'loading' } as LoadingResponse,
    invalidResponse: { status: 'pending' } as any,
  },
  discriminators: {
    shape: 'kind',
    journeyEvent: 'type',
    apiResponse: 'status',
  },
  discriminatorValues: {
    shape: ['circle', 'rectangle', 'triangle'],
    journeyEvent: ['health', 'care', 'plan'],
    apiResponse: ['success', 'error', 'loading'],
  },
  nonObjects: [
    null,
    undefined,
    'string',
    0,
    false,
    [],
    () => {},
    new Date(),
  ],
};

// ===== Complex Nested Object Structures =====

/**
 * Complex nested object structures for thorough type checking
 */
export const complexObjectFixtures = {
  userProfile: {
    id: 123,
    name: 'John Doe',
    email: 'john@example.com',
    active: true,
    roles: ['user', 'admin'],
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en',
    },
    address: {
      street: '123 Main St',
      city: 'New York',
      country: 'USA',
      coordinates: {
        lat: 40.7128,
        lng: -74.006,
      },
    },
    stats: {
      loginCount: 42,
      lastLogin: new Date(),
      devices: [
        { type: 'mobile', os: 'iOS', lastUsed: new Date() },
        { type: 'desktop', os: 'Windows', lastUsed: new Date() },
      ],
    },
  },
  journeyData: {
    userId: 123,
    journeys: {
      health: {
        active: true,
        metrics: [
          { id: 'weight', value: 70, unit: 'kg', timestamp: new Date() },
          { id: 'height', value: 175, unit: 'cm', timestamp: new Date() },
        ],
        goals: [
          { type: 'weight', target: 65, deadline: new Date(), progress: 0.7 },
          { type: 'steps', target: 10000, deadline: new Date(), progress: 0.5 },
        ],
        devices: [
          { id: 'dev1', type: 'smartwatch', connected: true, lastSync: new Date() },
        ],
      },
      care: {
        active: true,
        appointments: [
          { id: 'apt1', provider: 'Dr. Smith', date: new Date(), status: 'confirmed' },
          { id: 'apt2', provider: 'Dr. Jones', date: new Date(), status: 'pending' },
        ],
        medications: [
          { id: 'med1', name: 'Aspirin', dosage: '100mg', frequency: 'daily' },
        ],
        conditions: [
          { id: 'cond1', name: 'Hypertension', diagnosed: new Date(), severity: 'moderate' },
        ],
      },
      plan: {
        active: true,
        coverage: {
          id: 'cov1',
          type: 'premium',
          startDate: new Date(),
          endDate: new Date(),
          limits: {
            annual: 10000,
            dental: 2000,
            vision: 1000,
          },
        },
        claims: [
          { id: 'clm1', amount: 500, date: new Date(), status: 'approved', category: 'medical' },
          { id: 'clm2', amount: 200, date: new Date(), status: 'pending', category: 'dental' },
        ],
        beneficiaries: [
          { id: 'ben1', name: 'Jane Doe', relationship: 'spouse' },
        ],
      },
    },
    gamification: {
      level: 5,
      points: 1250,
      achievements: [
        { id: 'ach1', name: 'First Login', earned: new Date(), points: 50 },
        { id: 'ach2', name: 'Complete Profile', earned: new Date(), points: 100 },
      ],
      quests: [
        { id: 'q1', name: 'Daily Exercise', progress: 0.8, deadline: new Date(), reward: 200 },
      ],
      leaderboard: {
        position: 42,
        total: 1000,
        nearby: [
          { userId: 121, name: 'User A', points: 1300, position: 40 },
          { userId: 122, name: 'User B', points: 1275, position: 41 },
          { userId: 123, name: 'John Doe', points: 1250, position: 42 },
          { userId: 124, name: 'User C', points: 1225, position: 43 },
        ],
      },
    },
  },
  apiRequest: {
    endpoint: '/api/users',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token123',
    },
    body: {
      name: 'John Doe',
      email: 'john@example.com',
      journeyPreferences: {
        health: { enabled: true, shareData: false },
        care: { enabled: true, notifications: true },
        plan: { enabled: false },
      },
    },
    options: {
      timeout: 5000,
      retry: {
        count: 3,
        delay: 1000,
        backoff: 'exponential',
      },
      cache: {
        enabled: false,
      },
    },
  },
  eventData: {
    id: 'evt123',
    timestamp: new Date(),
    source: 'health-service',
    type: 'metric-recorded',
    version: '1.0',
    payload: {
      userId: 123,
      metricId: 'weight',
      value: 70,
      unit: 'kg',
      device: {
        id: 'dev1',
        type: 'smartwatch',
        manufacturer: 'FitCo',
      },
      metadata: {
        location: {
          lat: 40.7128,
          lng: -74.006,
        },
        app: {
          version: '2.1.0',
          platform: 'iOS',
        },
      },
    },
    context: {
      correlationId: 'corr456',
      sessionId: 'sess789',
      requestId: 'req101112',
    },
  },
};

/**
 * Combined fixtures export for easier importing
 */
export const predicateFixtures = {
  // Basic Type Predicates
  defined: definedFixtures,
  notNull: notNullFixtures,
  notUndefined: notUndefinedFixtures,
  
  // Array Type Predicates
  nonEmptyArray: nonEmptyArrayFixtures,
  arrayOfLength: arrayOfLengthFixtures,
  arrayOf: arrayOfFixtures,
  
  // Object Type Predicates
  hasProperty: hasPropertyFixtures,
  hasPropertyOfType: hasPropertyOfTypeFixtures,
  hasProperties: hasPropertiesFixtures,
  
  // Class Instance Type Predicates
  instanceOf: instanceOfFixtures,
  instanceOfAny: instanceOfAnyFixtures,
  
  // Journey-Specific Type Predicates
  filterDto: filterDtoFixtures,
  paginationDto: paginationDtoFixtures,
  sortDto: sortDtoFixtures,
  
  // Union Type Predicates
  oneOf: oneOfFixtures,
  oneOfType: oneOfTypeFixtures,
  
  // Discriminated Union Type Predicates
  discriminator: discriminatorFixtures,
  
  // Complex Objects
  complexObjects: complexObjectFixtures,
};