/**
 * Basic array test fixtures for array utility unit tests.
 * Provides standardized test data for common array operations.
 * 
 * This file contains test fixtures for testing the following array utility categories:
 * - Transformation utilities (flattenDeep, mapByKey, indexBy, pluck)
 * - Grouping utilities (groupBy, partitionBy, keyBy)
 * - Filtering utilities (uniqueBy, filterByProperties, rejectByProperties, differenceBy)
 * - Chunking utilities (chunk, chunkBySize, chunkByPredicate)
 * 
 * @module test/fixtures/array/basic-arrays
 * @see src/backend/packages/utils/src/array
 */

/**
 * Type definitions for complex objects used in test arrays.
 * These interfaces define the structure of objects used in various test fixtures.
 */
export interface TestPerson {
  id: number;
  name: string;
  age: number;
  active: boolean;
}

export interface TestAddress {
  street: string;
  city: string;
  zipCode: string;
  primary: boolean;
}

export interface TestPersonWithAddress extends TestPerson {
  addresses: TestAddress[];
}

export interface TestNestedObject {
  id: string;
  data: {
    value: number;
    metadata: {
      tags: string[];
      created: Date;
    };
  };
}

/**
 * Empty arrays for edge case testing.
 * These fixtures help test how utilities handle empty arrays of different types.
 */
export const emptyArray: any[] = [];
export const emptyStringArray: string[] = [];
export const emptyNumberArray: number[] = [];
export const emptyObjectArray: object[] = [];

/**
 * Arrays of primitive types.
 * These fixtures provide basic arrays of strings, numbers, booleans, and mixed primitives
 * for testing simple array operations.
 */
export const stringArray: string[] = [
  'apple',
  'banana',
  'cherry',
  'date',
  'elderberry',
  'fig',
  'grape',
];

export const numberArray: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const booleanArray: boolean[] = [true, false, true, true, false];

export const mixedPrimitiveArray: (string | number | boolean)[] = [
  'one',
  2,
  true,
  'four',
  5,
  false,
];

/**
 * Arrays with duplicate values.
 * These fixtures are particularly useful for testing uniqueBy() and other
 * deduplication operations.
 */
export const duplicateStringArray: string[] = [
  'apple',
  'banana',
  'apple',
  'cherry',
  'banana',
  'date',
];

export const duplicateNumberArray: number[] = [1, 2, 2, 3, 3, 3, 4, 5, 5];

/**
 * Arrays of objects with different structures.
 * These fixtures provide common object structures for testing operations
 * that work with object properties.
 */
export const personArray: TestPerson[] = [
  { id: 1, name: 'Alice', age: 28, active: true },
  { id: 2, name: 'Bob', age: 35, active: false },
  { id: 3, name: 'Charlie', age: 42, active: true },
  { id: 4, name: 'Diana', age: 31, active: true },
  { id: 5, name: 'Edward', age: 25, active: false },
];

export const addressArray: TestAddress[] = [
  { street: '123 Main St', city: 'New York', zipCode: '10001', primary: true },
  { street: '456 Oak Ave', city: 'Los Angeles', zipCode: '90001', primary: false },
  { street: '789 Pine Rd', city: 'Chicago', zipCode: '60601', primary: true },
  { street: '321 Cedar Ln', city: 'Houston', zipCode: '77001', primary: false },
];

/**
 * Arrays with objects containing duplicate key values.
 * These fixtures are specifically designed for testing uniqueBy() with
 * different property selectors.
 */
export const duplicatePersonArray: TestPerson[] = [
  { id: 1, name: 'Alice', age: 28, active: true },
  { id: 2, name: 'Bob', age: 35, active: false },
  { id: 3, name: 'Alice', age: 42, active: true }, // Duplicate name
  { id: 4, name: 'Diana', age: 35, active: true }, // Duplicate age
  { id: 5, name: 'Bob', age: 25, active: false }, // Duplicate name
];

/**
 * Arrays with nested objects.
 * These fixtures are useful for testing deep operations like flattenDeep()
 * and operations that need to access nested properties.
 */
export const personWithAddressArray: TestPersonWithAddress[] = [
  {
    id: 1,
    name: 'Alice',
    age: 28,
    active: true,
    addresses: [
      { street: '123 Main St', city: 'New York', zipCode: '10001', primary: true },
      { street: '456 Park Ave', city: 'New York', zipCode: '10002', primary: false },
    ],
  },
  {
    id: 2,
    name: 'Bob',
    age: 35,
    active: false,
    addresses: [
      { street: '789 Oak St', city: 'Los Angeles', zipCode: '90001', primary: true },
    ],
  },
  {
    id: 3,
    name: 'Charlie',
    age: 42,
    active: true,
    addresses: [],
  },
];

export const nestedObjectArray: TestNestedObject[] = [
  {
    id: 'a1',
    data: {
      value: 100,
      metadata: {
        tags: ['important', 'urgent'],
        created: new Date('2023-01-01'),
      },
    },
  },
  {
    id: 'b2',
    data: {
      value: 200,
      metadata: {
        tags: ['normal'],
        created: new Date('2023-02-15'),
      },
    },
  },
  {
    id: 'c3',
    data: {
      value: 300,
      metadata: {
        tags: ['important', 'archived'],
        created: new Date('2023-03-30'),
      },
    },
  },
];

/**
 * Arrays for testing chunking operations.
 * These fixtures provide larger arrays that can be split into chunks
 * for testing chunk(), chunkBySize(), and chunkByPredicate().
 */
export const largeNumberArray: number[] = Array.from({ length: 100 }, (_, i) => i + 1);

/**
 * Arrays for testing filtering operations.
 * These fixtures contain mixed value types for testing filterByProperties(),
 * rejectByProperties(), and differenceBy().
 */
export const mixedValueArray: any[] = [
  'string',
  123,
  true,
  null,
  undefined,
  { key: 'value' },
  ['nested', 'array'],
  new Date(),
];

/**
 * Arrays for testing grouping operations.
 * These fixtures contain objects that can be grouped by common properties
 * for testing groupBy(), partitionBy(), and keyBy().
 */
export const groupablePersonArray: TestPerson[] = [
  { id: 1, name: 'Alice', age: 28, active: true },
  { id: 2, name: 'Bob', age: 35, active: false },
  { id: 3, name: 'Charlie', age: 28, active: true }, // Same age as Alice
  { id: 4, name: 'Diana', age: 35, active: true }, // Same age as Bob
  { id: 5, name: 'Edward', age: 42, active: false },
  { id: 6, name: 'Frank', age: 42, active: true }, // Same age as Edward
];

/**
 * Arrays for testing transformation operations.
 * These fixtures provide nested arrays and objects for testing flattenDeep(),
 * mapByKey(), indexBy(), and pluck().
 */
export const nestedArrays: any[] = [
  1,
  [2, 3],
  [4, [5, 6]],
  [7, [8, [9, 10]]],
  11,
];

export const objectsWithSameKeys: Record<string, unknown>[] = [
  { id: 1, name: 'Item 1', category: 'A' },
  { id: 2, name: 'Item 2', category: 'B' },
  { id: 3, name: 'Item 3', category: 'A' },
  { id: 4, name: 'Item 4', category: 'C' },
  { id: 5, name: 'Item 5', category: 'B' },
];

/**
 * Arrays with null and undefined values.
 * These fixtures help test error handling and edge cases in array utilities
 * when dealing with null or undefined values.
 */
export const arrayWithNulls: (string | null)[] = [
  'apple',
  null,
  'banana',
  null,
  'cherry',
];

export const arrayWithUndefined: (number | undefined)[] = [
  1,
  undefined,
  2,
  3,
  undefined,
  4,
];

export const arrayWithMixedNullUndefined: (string | number | null | undefined)[] = [
  'apple',
  1,
  null,
  'banana',
  undefined,
  2,
];

/**
 * Arrays for testing journey-specific scenarios.
 * These fixtures simulate data structures commonly found in the AUSTA SuperApp journeys.
 */

// Health journey metrics data
export interface HealthMetric {
  id: string;
  userId: string;
  metricType: string;
  value: number;
  unit: string;
  timestamp: Date;
  source: string;
}

export const healthMetricsArray: HealthMetric[] = [
  {
    id: 'hm1',
    userId: 'user1',
    metricType: 'steps',
    value: 8500,
    unit: 'count',
    timestamp: new Date('2023-05-01T10:30:00Z'),
    source: 'fitbit',
  },
  {
    id: 'hm2',
    userId: 'user1',
    metricType: 'heart_rate',
    value: 72,
    unit: 'bpm',
    timestamp: new Date('2023-05-01T10:35:00Z'),
    source: 'fitbit',
  },
  {
    id: 'hm3',
    userId: 'user1',
    metricType: 'steps',
    value: 9200,
    unit: 'count',
    timestamp: new Date('2023-05-02T10:30:00Z'),
    source: 'fitbit',
  },
  {
    id: 'hm4',
    userId: 'user2',
    metricType: 'steps',
    value: 10500,
    unit: 'count',
    timestamp: new Date('2023-05-01T14:30:00Z'),
    source: 'garmin',
  },
];

// Care journey appointment data
export interface CareAppointment {
  id: string;
  userId: string;
  providerId: string;
  specialtyType: string;
  appointmentType: 'in-person' | 'telemedicine';
  status: 'scheduled' | 'completed' | 'cancelled';
  scheduledTime: Date;
}

export const careAppointmentsArray: CareAppointment[] = [
  {
    id: 'ca1',
    userId: 'user1',
    providerId: 'provider1',
    specialtyType: 'cardiology',
    appointmentType: 'in-person',
    status: 'scheduled',
    scheduledTime: new Date('2023-06-15T09:00:00Z'),
  },
  {
    id: 'ca2',
    userId: 'user1',
    providerId: 'provider2',
    specialtyType: 'dermatology',
    appointmentType: 'telemedicine',
    status: 'completed',
    scheduledTime: new Date('2023-05-10T14:30:00Z'),
  },
  {
    id: 'ca3',
    userId: 'user2',
    providerId: 'provider1',
    specialtyType: 'cardiology',
    appointmentType: 'in-person',
    status: 'cancelled',
    scheduledTime: new Date('2023-06-01T11:15:00Z'),
  },
];

// Plan journey benefit data
export interface PlanBenefit {
  id: string;
  planId: string;
  benefitType: string;
  coverage: number; // percentage
  limit: number | null;
  requiresPreApproval: boolean;
  networkRestrictions: 'in-network' | 'out-of-network' | 'both';
}

export const planBenefitsArray: PlanBenefit[] = [
  {
    id: 'pb1',
    planId: 'plan1',
    benefitType: 'preventive_care',
    coverage: 100,
    limit: null,
    requiresPreApproval: false,
    networkRestrictions: 'both',
  },
  {
    id: 'pb2',
    planId: 'plan1',
    benefitType: 'specialist_visit',
    coverage: 80,
    limit: 20,
    requiresPreApproval: false,
    networkRestrictions: 'in-network',
  },
  {
    id: 'pb3',
    planId: 'plan2',
    benefitType: 'preventive_care',
    coverage: 100,
    limit: null,
    requiresPreApproval: false,
    networkRestrictions: 'both',
  },
  {
    id: 'pb4',
    planId: 'plan2',
    benefitType: 'hospital_stay',
    coverage: 70,
    limit: 30,
    requiresPreApproval: true,
    networkRestrictions: 'in-network',
  },
];

// Gamification achievement data
export interface GamificationAchievement {
  id: string;
  userId: string;
  achievementType: string;
  journeyType: 'health' | 'care' | 'plan' | 'cross-journey';
  points: number;
  earnedAt: Date;
  metadata: Record<string, unknown>;
}

export const gamificationAchievementsArray: GamificationAchievement[] = [
  {
    id: 'ga1',
    userId: 'user1',
    achievementType: 'steps_milestone',
    journeyType: 'health',
    points: 50,
    earnedAt: new Date('2023-05-05T18:30:00Z'),
    metadata: { milestone: '10000_steps', streak: 3 },
  },
  {
    id: 'ga2',
    userId: 'user1',
    achievementType: 'appointment_completed',
    journeyType: 'care',
    points: 30,
    earnedAt: new Date('2023-05-10T15:45:00Z'),
    metadata: { appointmentId: 'ca2', specialtyType: 'dermatology' },
  },
  {
    id: 'ga3',
    userId: 'user2',
    achievementType: 'plan_selected',
    journeyType: 'plan',
    points: 20,
    earnedAt: new Date('2023-04-15T10:20:00Z'),
    metadata: { planId: 'plan2' },
  },
  {
    id: 'ga4',
    userId: 'user1',
    achievementType: 'journey_master',
    journeyType: 'cross-journey',
    points: 100,
    earnedAt: new Date('2023-05-20T09:15:00Z'),
    metadata: { completedJourneys: ['health', 'care'] },
  },
];