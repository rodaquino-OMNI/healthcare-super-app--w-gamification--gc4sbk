/**
 * @file Test fixtures for TypeScript type predicates that enable type narrowing in conditional blocks.
 * 
 * This file provides a comprehensive set of test fixtures for validating type predicate functions
 * that improve type safety throughout the codebase. These fixtures include discriminated unions,
 * generic class instances, property-based type narrowing scenarios, and complex nested object
 * structures that are common in cross-journey operations.
 */

import { EventJourney, EventType } from '@austa/interfaces/gamification';

// ===== Basic Type Fixtures =====

/**
 * Collection of primitive values for basic type predicate testing.
 */
export const primitiveFixtures = {
  string: 'test string',
  emptyString: '',
  number: 42,
  zero: 0,
  negativeNumber: -10,
  boolean: true,
  falsyBoolean: false,
  nullValue: null,
  undefinedValue: undefined,
  date: new Date(),
  invalidDate: new Date('invalid date'),
  symbol: Symbol('test'),
  bigint: BigInt(9007199254740991),
  array: [1, 2, 3],
  emptyArray: [],
  object: { key: 'value' },
  emptyObject: {},
  function: () => {},
  asyncFunction: async () => {},
  promise: Promise.resolve(),
  nan: NaN,
  infinity: Infinity,
  regExp: /test/,
};

// ===== Discriminated Union Fixtures =====

/**
 * Base interface for message types with a discriminator.
 */
export interface BaseMessage {
  id: string;
  timestamp: string;
  type: string; // Discriminator field
}

/**
 * Text message type for discriminated union testing.
 */
export interface TextMessage extends BaseMessage {
  type: 'text';
  content: string;
  sender: string;
}

/**
 * Image message type for discriminated union testing.
 */
export interface ImageMessage extends BaseMessage {
  type: 'image';
  imageUrl: string;
  dimensions: { width: number; height: number };
  caption?: string;
}

/**
 * Video message type for discriminated union testing.
 */
export interface VideoMessage extends BaseMessage {
  type: 'video';
  videoUrl: string;
  duration: number;
  thumbnail?: string;
}

/**
 * Union type of all message types.
 */
export type Message = TextMessage | ImageMessage | VideoMessage;

/**
 * Collection of message fixtures for discriminated union testing.
 */
export const messageFixtures: Record<string, Message> = {
  textMessage: {
    id: '1',
    timestamp: '2023-01-01T12:00:00Z',
    type: 'text',
    content: 'Hello, world!',
    sender: 'user1',
  },
  imageMessage: {
    id: '2',
    timestamp: '2023-01-01T12:05:00Z',
    type: 'image',
    imageUrl: 'https://example.com/image.jpg',
    dimensions: { width: 800, height: 600 },
    caption: 'Beautiful landscape',
  },
  videoMessage: {
    id: '3',
    timestamp: '2023-01-01T12:10:00Z',
    type: 'video',
    videoUrl: 'https://example.com/video.mp4',
    duration: 120,
    thumbnail: 'https://example.com/thumbnail.jpg',
  },
};

// ===== Gamification Event Fixtures =====

/**
 * Base interface for gamification events with a discriminator.
 */
export interface BaseEvent {
  eventId: string;
  userId: string;
  journey: EventJourney;
  type: EventType; // Discriminator field
  createdAt: string;
}

/**
 * Health metric event for discriminated union testing.
 */
export interface HealthMetricEvent extends BaseEvent {
  type: EventType.HEALTH_METRIC_RECORDED;
  payload: {
    metricType: string;
    value: number;
    unit: string;
    source: string;
    isWithinHealthyRange?: boolean;
  };
}

/**
 * Appointment event for discriminated union testing.
 */
export interface AppointmentEvent extends BaseEvent {
  type: EventType.APPOINTMENT_BOOKED;
  payload: {
    appointmentId: string;
    appointmentType: string;
    providerId: string;
    isFirstAppointment?: boolean;
  };
}

/**
 * Achievement event for discriminated union testing.
 */
export interface AchievementEvent extends BaseEvent {
  type: EventType.ACHIEVEMENT_UNLOCKED;
  payload: {
    achievementId: string;
    achievementTitle: string;
    achievementDescription: string;
    xpEarned: number;
    relatedJourney?: EventJourney;
  };
}

/**
 * Union type of all event types.
 */
export type GameEvent = HealthMetricEvent | AppointmentEvent | AchievementEvent;

/**
 * Collection of event fixtures for discriminated union testing.
 */
export const eventFixtures: Record<string, GameEvent> = {
  healthMetricEvent: {
    eventId: '1',
    userId: 'user1',
    journey: EventJourney.HEALTH,
    type: EventType.HEALTH_METRIC_RECORDED,
    createdAt: '2023-01-01T12:00:00Z',
    payload: {
      metricType: 'blood_pressure',
      value: 120,
      unit: 'mmHg',
      source: 'manual',
      isWithinHealthyRange: true,
    },
  },
  appointmentEvent: {
    eventId: '2',
    userId: 'user1',
    journey: EventJourney.CARE,
    type: EventType.APPOINTMENT_BOOKED,
    createdAt: '2023-01-01T12:05:00Z',
    payload: {
      appointmentId: 'appt1',
      appointmentType: 'checkup',
      providerId: 'provider1',
      isFirstAppointment: true,
    },
  },
  achievementEvent: {
    eventId: '3',
    userId: 'user1',
    journey: EventJourney.CROSS_JOURNEY,
    type: EventType.ACHIEVEMENT_UNLOCKED,
    createdAt: '2023-01-01T12:10:00Z',
    payload: {
      achievementId: 'achievement1',
      achievementTitle: 'First Steps',
      achievementDescription: 'Complete your first health assessment',
      xpEarned: 100,
      relatedJourney: EventJourney.HEALTH,
    },
  },
};

// ===== Class Hierarchy Fixtures =====

/**
 * Base class for testing class hierarchy type predicates.
 */
export class BaseEntity {
  constructor(public id: string, public createdAt: Date) {}
}

/**
 * User entity class for testing class hierarchy type predicates.
 */
export class UserEntity extends BaseEntity {
  constructor(
    id: string,
    createdAt: Date,
    public name: string,
    public email: string,
    public roles: string[]
  ) {
    super(id, createdAt);
  }
}

/**
 * Product entity class for testing class hierarchy type predicates.
 */
export class ProductEntity extends BaseEntity {
  constructor(
    id: string,
    createdAt: Date,
    public name: string,
    public price: number,
    public category: string
  ) {
    super(id, createdAt);
  }
}

/**
 * Order entity class for testing class hierarchy type predicates.
 */
export class OrderEntity extends BaseEntity {
  constructor(
    id: string,
    createdAt: Date,
    public userId: string,
    public items: Array<{ productId: string; quantity: number }>,
    public total: number
  ) {
    super(id, createdAt);
  }
}

/**
 * Collection of entity instances for class hierarchy type predicate testing.
 */
export const entityFixtures = {
  user: new UserEntity(
    'user1',
    new Date(),
    'John Doe',
    'john@example.com',
    ['user']
  ),
  admin: new UserEntity(
    'admin1',
    new Date(),
    'Admin User',
    'admin@example.com',
    ['user', 'admin']
  ),
  product: new ProductEntity(
    'product1',
    new Date(),
    'Test Product',
    99.99,
    'electronics'
  ),
  order: new OrderEntity(
    'order1',
    new Date(),
    'user1',
    [{ productId: 'product1', quantity: 2 }],
    199.98
  ),
  baseEntity: new BaseEntity('base1', new Date()),
};

// ===== Property-Based Type Narrowing Fixtures =====

/**
 * Interface for objects with optional properties for property-based type narrowing testing.
 */
export interface ConfigObject {
  name: string;
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  options?: {
    debug?: boolean;
    logLevel?: string;
    maxItems?: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Collection of config objects for property-based type narrowing testing.
 */
export const configFixtures: Record<string, ConfigObject> = {
  minimal: {
    name: 'minimal-config',
  },
  basic: {
    name: 'basic-config',
    enabled: true,
    timeout: 5000,
  },
  withRetries: {
    name: 'retry-config',
    enabled: true,
    timeout: 3000,
    retries: 3,
  },
  withOptions: {
    name: 'options-config',
    enabled: true,
    timeout: 5000,
    options: {
      debug: true,
      logLevel: 'info',
      maxItems: 100,
    },
  },
  complete: {
    name: 'complete-config',
    enabled: true,
    timeout: 5000,
    retries: 3,
    options: {
      debug: true,
      logLevel: 'debug',
      maxItems: 100,
    },
    metadata: {
      createdBy: 'test',
      version: '1.0.0',
      tags: ['test', 'config'],
    },
  },
};

// ===== Nested Object Structure Fixtures =====

/**
 * Interface for user profile with nested structures for thorough type checking.
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      sms?: boolean;
      frequency?: 'immediate' | 'daily' | 'weekly';
    };
    language?: string;
  };
  healthData?: {
    metrics?: Array<{
      type: string;
      value: number;
      unit: string;
      recordedAt: string;
    }>;
    goals?: Array<{
      id: string;
      type: string;
      target: number;
      unit: string;
      progress: number;
      completed: boolean;
    }>;
  };
  careData?: {
    appointments?: Array<{
      id: string;
      providerId: string;
      date: string;
      status: 'scheduled' | 'completed' | 'cancelled';
      notes?: string;
    }>;
    medications?: Array<{
      id: string;
      name: string;
      dosage: string;
      frequency: string;
      startDate: string;
      endDate?: string;
    }>;
  };
  planData?: {
    planId?: string;
    coverage?: {
      type: string;
      startDate: string;
      endDate: string;
      benefits: Array<{
        id: string;
        name: string;
        description: string;
        limit?: number;
        used?: number;
      }>;
    };
    claims?: Array<{
      id: string;
      amount: number;
      date: string;
      status: 'submitted' | 'processing' | 'approved' | 'rejected';
      documents?: string[];
    }>;
  };
  gamification?: {
    level: number;
    xp: number;
    achievements?: string[];
    quests?: Array<{
      id: string;
      progress: number;
      completed: boolean;
    }>;
  };
}

/**
 * Collection of user profile fixtures with varying levels of completeness.
 */
export const userProfileFixtures: Record<string, UserProfile> = {
  minimal: {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
  },
  withPreferences: {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    preferences: {
      theme: 'dark',
      notifications: {
        email: true,
        push: false,
      },
      language: 'en-US',
    },
  },
  withHealthData: {
    id: 'user3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    healthData: {
      metrics: [
        {
          type: 'weight',
          value: 75.5,
          unit: 'kg',
          recordedAt: '2023-01-01T12:00:00Z',
        },
        {
          type: 'blood_pressure',
          value: 120,
          unit: 'mmHg',
          recordedAt: '2023-01-01T12:00:00Z',
        },
      ],
      goals: [
        {
          id: 'goal1',
          type: 'steps',
          target: 10000,
          unit: 'steps',
          progress: 7500,
          completed: false,
        },
      ],
    },
  },
  withCareData: {
    id: 'user4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    careData: {
      appointments: [
        {
          id: 'appt1',
          providerId: 'provider1',
          date: '2023-02-15T14:30:00Z',
          status: 'scheduled',
        },
      ],
      medications: [
        {
          id: 'med1',
          name: 'Medication A',
          dosage: '10mg',
          frequency: 'daily',
          startDate: '2023-01-01',
          endDate: '2023-03-01',
        },
      ],
    },
  },
  withPlanData: {
    id: 'user5',
    name: 'Charlie Davis',
    email: 'charlie@example.com',
    planData: {
      planId: 'plan1',
      coverage: {
        type: 'premium',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        benefits: [
          {
            id: 'benefit1',
            name: 'Annual Checkup',
            description: 'Free annual checkup',
            limit: 1,
            used: 0,
          },
          {
            id: 'benefit2',
            name: 'Prescription Coverage',
            description: '80% coverage for prescriptions',
            limit: 5000,
            used: 1200,
          },
        ],
      },
      claims: [
        {
          id: 'claim1',
          amount: 500,
          date: '2023-02-10',
          status: 'approved',
          documents: ['doc1.pdf', 'doc2.pdf'],
        },
      ],
    },
  },
  withGamification: {
    id: 'user6',
    name: 'Eva Green',
    email: 'eva@example.com',
    gamification: {
      level: 5,
      xp: 2500,
      achievements: ['achievement1', 'achievement2', 'achievement3'],
      quests: [
        {
          id: 'quest1',
          progress: 0.75,
          completed: false,
        },
        {
          id: 'quest2',
          progress: 1,
          completed: true,
        },
      ],
    },
  },
  complete: {
    id: 'user7',
    name: 'Frank White',
    email: 'frank@example.com',
    preferences: {
      theme: 'system',
      notifications: {
        email: true,
        push: true,
        sms: true,
        frequency: 'daily',
      },
      language: 'en-US',
    },
    healthData: {
      metrics: [
        {
          type: 'weight',
          value: 80,
          unit: 'kg',
          recordedAt: '2023-01-01T12:00:00Z',
        },
      ],
      goals: [
        {
          id: 'goal1',
          type: 'steps',
          target: 10000,
          unit: 'steps',
          progress: 10000,
          completed: true,
        },
      ],
    },
    careData: {
      appointments: [
        {
          id: 'appt1',
          providerId: 'provider1',
          date: '2023-02-15T14:30:00Z',
          status: 'completed',
          notes: 'Regular checkup, everything looks good.',
        },
      ],
      medications: [
        {
          id: 'med1',
          name: 'Medication A',
          dosage: '10mg',
          frequency: 'daily',
          startDate: '2023-01-01',
        },
      ],
    },
    planData: {
      planId: 'plan1',
      coverage: {
        type: 'premium',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        benefits: [
          {
            id: 'benefit1',
            name: 'Annual Checkup',
            description: 'Free annual checkup',
            limit: 1,
            used: 1,
          },
        ],
      },
      claims: [
        {
          id: 'claim1',
          amount: 500,
          date: '2023-02-10',
          status: 'approved',
          documents: ['doc1.pdf'],
        },
      ],
    },
    gamification: {
      level: 10,
      xp: 5000,
      achievements: ['achievement1', 'achievement2', 'achievement3'],
      quests: [
        {
          id: 'quest1',
          progress: 1,
          completed: true,
        },
      ],
    },
  },
};

// ===== Tuple Type Fixtures =====

/**
 * Type for coordinate tuples.
 */
export type Coordinate = [number, number];

/**
 * Type for RGB color tuples.
 */
export type RgbColor = [number, number, number];

/**
 * Type for RGBA color tuples.
 */
export type RgbaColor = [number, number, number, number];

/**
 * Type for key-value pair tuples.
 */
export type KeyValuePair<K, V> = [K, V];

/**
 * Collection of tuple fixtures for tuple type predicate testing.
 */
export const tupleFixtures = {
  coordinate: [10, 20] as Coordinate,
  invalidCoordinate: [10, 20, 30],
  rgbColor: [255, 128, 0] as RgbColor,
  rgbaColor: [255, 128, 0, 0.5] as RgbaColor,
  stringNumberPair: ['key', 42] as KeyValuePair<string, number>,
  numberBooleanPair: [42, true] as KeyValuePair<number, boolean>,
  nestedTuple: [[1, 2], [3, 4]] as [Coordinate, Coordinate],
  mixedTuple: ['user', 42, true] as [string, number, boolean],
};

// ===== Record Type Fixtures =====

/**
 * Type for string-to-string record.
 */
export type StringRecord = Record<string, string>;

/**
 * Type for string-to-number record.
 */
export type NumberRecord = Record<string, number>;

/**
 * Type for string-to-boolean record.
 */
export type BooleanRecord = Record<string, boolean>;

/**
 * Type for string-to-any record.
 */
export type MixedRecord = Record<string, any>;

/**
 * Collection of record fixtures for record type predicate testing.
 */
export const recordFixtures = {
  stringRecord: {
    name: 'John',
    email: 'john@example.com',
    address: '123 Main St',
  } as StringRecord,
  numberRecord: {
    age: 30,
    height: 180,
    weight: 75,
  } as NumberRecord,
  booleanRecord: {
    isActive: true,
    isAdmin: false,
    hasSubscription: true,
  } as BooleanRecord,
  mixedRecord: {
    name: 'John',
    age: 30,
    isActive: true,
    metadata: { key: 'value' },
  } as MixedRecord,
  emptyRecord: {} as Record<string, unknown>,
  invalidStringRecord: {
    name: 'John',
    age: 30, // Not a string
  },
};

// ===== Function Type Fixtures =====

/**
 * Type for a function that takes a string and returns a string.
 */
export type StringTransformer = (input: string) => string;

/**
 * Type for a function that takes a number and returns a boolean.
 */
export type NumberValidator = (input: number) => boolean;

/**
 * Type for an async function that takes a string and returns a Promise<boolean>.
 */
export type AsyncValidator = (input: string) => Promise<boolean>;

/**
 * Type for an event handler function.
 */
export type EventHandler = (event: string, data: unknown) => void;

/**
 * Collection of function fixtures for function type predicate testing.
 */
export const functionFixtures = {
  stringTransformer: ((input: string) => input.toUpperCase()) as StringTransformer,
  numberValidator: ((input: number) => input > 0) as NumberValidator,
  asyncValidator: ((input: string) => Promise.resolve(input.length > 0)) as AsyncValidator,
  eventHandler: ((event: string, data: unknown) => console.log(event, data)) as EventHandler,
  arrowFunction: () => true,
  functionDeclaration: function() { return true; },
  asyncArrowFunction: async () => true,
  asyncFunctionDeclaration: async function() { return true; },
  generatorFunction: function* () { yield 1; },
  invalidFunction: 'not a function',
};

// ===== Promise Type Fixtures =====

/**
 * Collection of promise fixtures for promise type predicate testing.
 */
export const promiseFixtures = {
  resolvedPromise: Promise.resolve('success'),
  rejectedPromise: Promise.reject(new Error('failure')),
  pendingPromise: new Promise(() => {}),
  promiseWithThen: { then: () => {} },
  promiseWithThenAndCatch: { then: () => {}, catch: () => {} },
  notAPromise: { then: 'not a function' },
};

// ===== Array Type Fixtures =====

/**
 * Collection of array fixtures for array type predicate testing.
 */
export const arrayFixtures = {
  stringArray: ['a', 'b', 'c'],
  numberArray: [1, 2, 3],
  booleanArray: [true, false, true],
  mixedArray: ['a', 1, true],
  objectArray: [{ id: 1 }, { id: 2 }],
  nestedArray: [[1, 2], [3, 4]],
  emptyArray: [],
  arrayLike: { 0: 'a', 1: 'b', length: 2 },
  invalidStringArray: ['a', 'b', 1], // Not all strings
};