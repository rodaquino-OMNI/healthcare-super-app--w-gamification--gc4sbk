/**
 * Test fixtures for array reduction utility functions.
 * These fixtures provide standardized test cases for array reduction operations
 * including sum, average, grouping, and other aggregation patterns.
 */

/**
 * Interface for numeric reduction test fixtures
 */
export interface NumericReductionFixture {
  /** Description of the test case */
  description: string;
  /** Input array to be reduced */
  input: number[];
  /** Expected output after reduction */
  expected: number;
  /** Initial value for the reduction (if applicable) */
  initialValue?: number;
  /** Whether this is an edge case */
  isEdgeCase?: boolean;
}

/**
 * Interface for object reduction test fixtures that produce a single value
 */
export interface ObjectReductionFixture<T, R> {
  /** Description of the test case */
  description: string;
  /** Input array of objects to be reduced */
  input: T[];
  /** Expected output after reduction */
  expected: R;
  /** Initial value for the reduction (if applicable) */
  initialValue?: R;
  /** Whether this is an edge case */
  isEdgeCase?: boolean;
}

/**
 * Interface for map reduction test fixtures
 */
export interface MapReductionFixture<T> {
  /** Description of the test case */
  description: string;
  /** Input array of objects to be reduced to a map */
  input: T[];
  /** Expected output map after reduction */
  expected: Record<string, any>;
  /** Initial value for the reduction (if applicable) */
  initialValue?: Record<string, any>;
  /** Whether this is an edge case */
  isEdgeCase?: boolean;
}

/**
 * Simple object interface for testing object array reductions
 */
export interface TestObject {
  id: number;
  name: string;
  value: number;
  category: string;
}

/**
 * Test fixtures for numeric sum reduction
 */
export const sumReductionFixtures: NumericReductionFixture[] = [
  // Normal cases
  {
    description: 'Sums an array of positive integers',
    input: [1, 2, 3, 4, 5],
    expected: 15,
  },
  {
    description: 'Sums an array with negative numbers',
    input: [1, -2, 3, -4, 5],
    expected: 3,
  },
  {
    description: 'Sums an array of decimals',
    input: [1.1, 2.2, 3.3, 4.4, 5.5],
    expected: 16.5,
  },
  {
    description: 'Sums with initial value',
    input: [1, 2, 3, 4, 5],
    initialValue: 10,
    expected: 25,
  },
  
  // Edge cases
  {
    description: 'Sums an empty array (should return 0 or initial value)',
    input: [],
    expected: 0,
    isEdgeCase: true,
  },
  {
    description: 'Sums an empty array with initial value',
    input: [],
    initialValue: 10,
    expected: 10,
    isEdgeCase: true,
  },
  {
    description: 'Sums an array with a single element',
    input: [42],
    expected: 42,
    isEdgeCase: true,
  },
  {
    description: 'Handles array with NaN values',
    input: [1, 2, NaN, 4, 5],
    expected: NaN,
    isEdgeCase: true,
  },
];

/**
 * Test fixtures for numeric average reduction
 */
export const averageReductionFixtures: NumericReductionFixture[] = [
  // Normal cases
  {
    description: 'Calculates average of positive integers',
    input: [10, 20, 30, 40, 50],
    expected: 30,
  },
  {
    description: 'Calculates average with negative numbers',
    input: [10, -10, 20, -20, 30],
    expected: 6,
  },
  {
    description: 'Calculates average of decimals',
    input: [1.5, 2.5, 3.5, 4.5, 5.5],
    expected: 3.5,
  },
  
  // Edge cases
  {
    description: 'Calculates average of empty array (should return 0 or handle specially)',
    input: [],
    expected: 0,
    isEdgeCase: true,
  },
  {
    description: 'Calculates average of single element array',
    input: [42],
    expected: 42,
    isEdgeCase: true,
  },
  {
    description: 'Handles array with NaN values in average calculation',
    input: [10, 20, NaN, 40, 50],
    expected: NaN,
    isEdgeCase: true,
  },
];

/**
 * Test fixtures for finding maximum value
 */
export const maxReductionFixtures: NumericReductionFixture[] = [
  // Normal cases
  {
    description: 'Finds maximum in array of positive integers',
    input: [1, 5, 3, 9, 2],
    expected: 9,
  },
  {
    description: 'Finds maximum in array with negative numbers',
    input: [-10, -5, -20, -1, -7],
    expected: -1,
  },
  {
    description: 'Finds maximum in mixed positive/negative array',
    input: [-10, 5, -20, 1, -7],
    expected: 5,
  },
  
  // Edge cases
  {
    description: 'Finds maximum in empty array with initial value',
    input: [],
    initialValue: -Infinity,
    expected: -Infinity,
    isEdgeCase: true,
  },
  {
    description: 'Finds maximum in single element array',
    input: [42],
    expected: 42,
    isEdgeCase: true,
  },
];

/**
 * Test fixtures for finding minimum value
 */
export const minReductionFixtures: NumericReductionFixture[] = [
  // Normal cases
  {
    description: 'Finds minimum in array of positive integers',
    input: [5, 3, 9, 1, 7],
    expected: 1,
  },
  {
    description: 'Finds minimum in array with negative numbers',
    input: [-10, -5, -20, -1, -7],
    expected: -20,
  },
  {
    description: 'Finds minimum in mixed positive/negative array',
    input: [-10, 5, -20, 1, -7],
    expected: -20,
  },
  
  // Edge cases
  {
    description: 'Finds minimum in empty array with initial value',
    input: [],
    initialValue: Infinity,
    expected: Infinity,
    isEdgeCase: true,
  },
  {
    description: 'Finds minimum in single element array',
    input: [42],
    expected: 42,
    isEdgeCase: true,
  },
];

/**
 * Test fixtures for object sum reduction
 */
export const objectSumReductionFixtures: ObjectReductionFixture<TestObject, number>[] = [
  // Normal cases
  {
    description: 'Sums the "value" property of objects',
    input: [
      { id: 1, name: 'Item 1', value: 10, category: 'A' },
      { id: 2, name: 'Item 2', value: 20, category: 'B' },
      { id: 3, name: 'Item 3', value: 30, category: 'A' },
      { id: 4, name: 'Item 4', value: 40, category: 'C' },
      { id: 5, name: 'Item 5', value: 50, category: 'B' },
    ],
    expected: 150,
  },
  {
    description: 'Sums the "value" property with initial value',
    input: [
      { id: 1, name: 'Item 1', value: 10, category: 'A' },
      { id: 2, name: 'Item 2', value: 20, category: 'B' },
      { id: 3, name: 'Item 3', value: 30, category: 'A' },
    ],
    initialValue: 100,
    expected: 160,
  },
  
  // Edge cases
  {
    description: 'Sums empty object array with initial value',
    input: [],
    initialValue: 50,
    expected: 50,
    isEdgeCase: true,
  },
  {
    description: 'Sums object array with a single element',
    input: [{ id: 1, name: 'Item 1', value: 42, category: 'A' }],
    expected: 42,
    isEdgeCase: true,
  },
];

/**
 * Test fixtures for object to map reduction (grouping by property)
 */
export const groupByReductionFixtures: MapReductionFixture<TestObject>[] = [
  // Normal cases
  {
    description: 'Groups objects by category',
    input: [
      { id: 1, name: 'Item 1', value: 10, category: 'A' },
      { id: 2, name: 'Item 2', value: 20, category: 'B' },
      { id: 3, name: 'Item 3', value: 30, category: 'A' },
      { id: 4, name: 'Item 4', value: 40, category: 'C' },
      { id: 5, name: 'Item 5', value: 50, category: 'B' },
    ],
    expected: {
      'A': [
        { id: 1, name: 'Item 1', value: 10, category: 'A' },
        { id: 3, name: 'Item 3', value: 30, category: 'A' },
      ],
      'B': [
        { id: 2, name: 'Item 2', value: 20, category: 'B' },
        { id: 5, name: 'Item 5', value: 50, category: 'B' },
      ],
      'C': [
        { id: 4, name: 'Item 4', value: 40, category: 'C' },
      ],
    },
  },
  {
    description: 'Groups objects by category with initial value',
    input: [
      { id: 1, name: 'Item 1', value: 10, category: 'A' },
      { id: 2, name: 'Item 2', value: 20, category: 'B' },
    ],
    initialValue: {
      'C': [{ id: 3, name: 'Initial Item', value: 30, category: 'C' }],
    },
    expected: {
      'A': [
        { id: 1, name: 'Item 1', value: 10, category: 'A' },
      ],
      'B': [
        { id: 2, name: 'Item 2', value: 20, category: 'B' },
      ],
      'C': [
        { id: 3, name: 'Initial Item', value: 30, category: 'C' },
      ],
    },
  },
  
  // Edge cases
  {
    description: 'Groups empty object array',
    input: [],
    expected: {},
    isEdgeCase: true,
  },
  {
    description: 'Groups empty object array with initial value',
    input: [],
    initialValue: { 'A': [{ id: 1, name: 'Initial', value: 10, category: 'A' }] },
    expected: { 'A': [{ id: 1, name: 'Initial', value: 10, category: 'A' }] },
    isEdgeCase: true,
  },
];

/**
 * Test fixtures for object to map reduction (aggregating by property)
 */
export const aggregateByReductionFixtures: MapReductionFixture<TestObject>[] = [
  // Normal cases
  {
    description: 'Aggregates sum of values by category',
    input: [
      { id: 1, name: 'Item 1', value: 10, category: 'A' },
      { id: 2, name: 'Item 2', value: 20, category: 'B' },
      { id: 3, name: 'Item 3', value: 30, category: 'A' },
      { id: 4, name: 'Item 4', value: 40, category: 'C' },
      { id: 5, name: 'Item 5', value: 50, category: 'B' },
    ],
    expected: {
      'A': 40,  // 10 + 30
      'B': 70,  // 20 + 50
      'C': 40,  // 40
    },
  },
  {
    description: 'Aggregates sum of values by category with initial value',
    input: [
      { id: 1, name: 'Item 1', value: 10, category: 'A' },
      { id: 2, name: 'Item 2', value: 20, category: 'B' },
    ],
    initialValue: {
      'A': 100,
      'C': 200,
    },
    expected: {
      'A': 110,  // 100 + 10
      'B': 20,   // 20
      'C': 200,  // 200 (unchanged)
    },
  },
  
  // Edge cases
  {
    description: 'Aggregates empty object array',
    input: [],
    expected: {},
    isEdgeCase: true,
  },
  {
    description: 'Aggregates empty object array with initial value',
    input: [],
    initialValue: { 'A': 100, 'B': 200 },
    expected: { 'A': 100, 'B': 200 },
    isEdgeCase: true,
  },
];

/**
 * Test fixtures for complex reduction with multiple operations
 */
export const complexReductionFixtures: ObjectReductionFixture<TestObject, any>[] = [
  // Normal cases
  {
    description: 'Calculates statistics (count, sum, avg, min, max) for each category',
    input: [
      { id: 1, name: 'Item 1', value: 10, category: 'A' },
      { id: 2, name: 'Item 2', value: 20, category: 'B' },
      { id: 3, name: 'Item 3', value: 30, category: 'A' },
      { id: 4, name: 'Item 4', value: 40, category: 'C' },
      { id: 5, name: 'Item 5', value: 50, category: 'B' },
      { id: 6, name: 'Item 6', value: 60, category: 'A' },
    ],
    expected: {
      'A': { count: 3, sum: 100, avg: 33.33, min: 10, max: 60 },
      'B': { count: 2, sum: 70, avg: 35, min: 20, max: 50 },
      'C': { count: 1, sum: 40, avg: 40, min: 40, max: 40 },
    },
  },
  {
    description: 'Builds a hierarchical structure from flat data',
    input: [
      { id: 1, name: 'Item 1', value: 10, category: 'A' },
      { id: 2, name: 'Item 2', value: 20, category: 'B' },
      { id: 3, name: 'Item 3', value: 30, category: 'A' },
    ],
    expected: {
      categories: ['A', 'B'],
      items: {
        'A': [
          { id: 1, name: 'Item 1', value: 10 },
          { id: 3, name: 'Item 3', value: 30 },
        ],
        'B': [
          { id: 2, name: 'Item 2', value: 20 },
        ],
      },
      totals: {
        'A': 40,
        'B': 20,
      },
    },
  },
  
  // Edge cases
  {
    description: 'Handles empty array for complex reduction',
    input: [],
    expected: { categories: [], items: {}, totals: {} },
    isEdgeCase: true,
  },
];

/**
 * Test fixtures for string concatenation reduction
 */
export const stringConcatReductionFixtures: ObjectReductionFixture<string, string>[] = [
  // Normal cases
  {
    description: 'Concatenates an array of strings',
    input: ['Hello', ' ', 'world', '!'],
    expected: 'Hello world!',
  },
  {
    description: 'Concatenates with initial value',
    input: ['world', '!'],
    initialValue: 'Hello ',
    expected: 'Hello world!',
  },
  
  // Edge cases
  {
    description: 'Concatenates empty array',
    input: [],
    expected: '',
    isEdgeCase: true,
  },
  {
    description: 'Concatenates empty array with initial value',
    input: [],
    initialValue: 'Initial ',
    expected: 'Initial ',
    isEdgeCase: true,
  },
  {
    description: 'Concatenates array with empty strings',
    input: ['', '', ''],
    expected: '',
    isEdgeCase: true,
  },
];