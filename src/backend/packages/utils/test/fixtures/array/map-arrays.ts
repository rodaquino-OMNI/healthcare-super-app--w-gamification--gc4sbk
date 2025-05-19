/**
 * Map Array Test Fixtures
 * 
 * This module provides test fixtures for array mapping operations, containing arrays
 * with elements that can be transformed in predictable ways, along with expected
 * transformation results. These fixtures support testing of mapping functions that
 * transform array elements from one form to another.
 * 
 * The fixtures include:
 * - Simple primitive transformations (numbers, strings, booleans)
 * - Object property transformations
 * - Complex transformations with multiple properties
 * - Edge cases for mapping operations
 * 
 * @module test/fixtures/array/map-arrays
 */

import { TestObject } from './basic-arrays';

/**
 * Interface representing a mapping fixture with source array and expected results
 * for different transformation operations.
 */
export interface MapFixture<T, R1, R2, R3> {
  /** Source array to be transformed */
  source: T[];
  /** Expected result after simple transformation */
  simpleResult: R1[];
  /** Expected result after complex transformation */
  complexResult: R2[];
  /** Expected result after conditional transformation */
  conditionalResult: R3[];
}

/**
 * Fixture for testing number array mapping operations.
 * Includes transformations like doubling, squaring, and conditional operations.
 */
export const numberMapFixture: MapFixture<number, number, number, number | null> = {
  source: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  // Simple transformation: double each number
  simpleResult: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
  // Complex transformation: square each number
  complexResult: [1, 4, 9, 16, 25, 36, 49, 64, 81, 100],
  // Conditional transformation: keep only even numbers, replace odd with null
  conditionalResult: [null, 2, null, 4, null, 6, null, 8, null, 10]
};

/**
 * Fixture for testing string array mapping operations.
 * Includes transformations like uppercase, concatenation, and conditional operations.
 */
export const stringMapFixture: MapFixture<string, string, string, string | null> = {
  source: ['apple', 'banana', 'cherry', 'date', 'elderberry'],
  // Simple transformation: uppercase each string
  simpleResult: ['APPLE', 'BANANA', 'CHERRY', 'DATE', 'ELDERBERRY'],
  // Complex transformation: add prefix and suffix
  complexResult: ['fruit-apple-fresh', 'fruit-banana-fresh', 'fruit-cherry-fresh', 'fruit-date-fresh', 'fruit-elderberry-fresh'],
  // Conditional transformation: keep strings longer than 5 characters, replace others with null
  conditionalResult: ['apple', 'banana', 'cherry', null, 'elderberry']
};

/**
 * Interface for user objects used in object mapping fixtures
 */
export interface UserObject {
  id: number;
  name: string;
  age: number;
  active: boolean;
  roles: string[];
}

/**
 * Simplified user representation for mapping results
 */
export interface SimpleUserDTO {
  id: number;
  name: string;
}

/**
 * Enhanced user representation with computed properties
 */
export interface EnhancedUserDTO {
  id: number;
  displayName: string;
  isAdult: boolean;
  roleCount: number;
}

/**
 * Fixture for testing object array mapping operations.
 * Includes transformations like property extraction, property combination, and conditional operations.
 */
export const objectMapFixture: MapFixture<UserObject, SimpleUserDTO, EnhancedUserDTO, UserObject | null> = {
  source: [
    { id: 1, name: 'Alice', age: 28, active: true, roles: ['user', 'admin'] },
    { id: 2, name: 'Bob', age: 17, active: true, roles: ['user'] },
    { id: 3, name: 'Charlie', age: 42, active: false, roles: ['user', 'editor', 'reviewer'] },
    { id: 4, name: 'Diana', age: 35, active: true, roles: [] },
    { id: 5, name: 'Evan', age: 24, active: false, roles: ['user', 'support'] }
  ],
  // Simple transformation: extract id and name only
  simpleResult: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
    { id: 4, name: 'Diana' },
    { id: 5, name: 'Evan' }
  ],
  // Complex transformation: create enhanced user DTOs with computed properties
  complexResult: [
    { id: 1, displayName: 'Alice (28)', isAdult: true, roleCount: 2 },
    { id: 2, displayName: 'Bob (17)', isAdult: false, roleCount: 1 },
    { id: 3, displayName: 'Charlie (42)', isAdult: true, roleCount: 3 },
    { id: 4, displayName: 'Diana (35)', isAdult: true, roleCount: 0 },
    { id: 5, displayName: 'Evan (24)', isAdult: true, roleCount: 2 }
  ],
  // Conditional transformation: keep only active users, replace inactive with null
  conditionalResult: [
    { id: 1, name: 'Alice', age: 28, active: true, roles: ['user', 'admin'] },
    { id: 2, name: 'Bob', age: 17, active: true, roles: ['user'] },
    null,
    { id: 4, name: 'Diana', age: 35, active: true, roles: [] },
    null
  ]
};

/**
 * Fixture for testing nested object array mapping operations.
 * Includes transformations that handle nested properties and arrays.
 */
export interface NestedObject {
  id: number;
  title: string;
  details: {
    created: string;
    updated: string;
    tags: string[];
  };
  items: Array<{
    itemId: number;
    name: string;
    quantity: number;
  }>;
}

/**
 * Flattened representation of nested objects
 */
export interface FlattenedObject {
  id: number;
  title: string;
  created: string;
  tagCount: number;
  itemCount: number;
}

/**
 * Detailed item representation extracted from nested objects
 */
export interface DetailedItemView {
  parentId: number;
  parentTitle: string;
  itemId: number;
  itemName: string;
  quantity: number;
  tags: string[];
}

/**
 * Fixture for testing nested object mapping operations
 */
export const nestedObjectMapFixture: MapFixture<NestedObject, FlattenedObject, DetailedItemView[], NestedObject | null> = {
  source: [
    {
      id: 101,
      title: 'Project Alpha',
      details: {
        created: '2023-01-15',
        updated: '2023-03-20',
        tags: ['urgent', 'development', 'frontend']
      },
      items: [
        { itemId: 1001, name: 'Task 1', quantity: 3 },
        { itemId: 1002, name: 'Task 2', quantity: 1 }
      ]
    },
    {
      id: 102,
      title: 'Project Beta',
      details: {
        created: '2023-02-10',
        updated: '2023-02-28',
        tags: ['backend', 'database']
      },
      items: [
        { itemId: 2001, name: 'Feature A', quantity: 2 }
      ]
    },
    {
      id: 103,
      title: 'Project Gamma',
      details: {
        created: '2023-03-05',
        updated: '2023-04-15',
        tags: []
      },
      items: []
    }
  ],
  // Simple transformation: flatten nested structure
  simpleResult: [
    { id: 101, title: 'Project Alpha', created: '2023-01-15', tagCount: 3, itemCount: 2 },
    { id: 102, title: 'Project Beta', created: '2023-02-10', tagCount: 2, itemCount: 1 },
    { id: 103, title: 'Project Gamma', created: '2023-03-05', tagCount: 0, itemCount: 0 }
  ],
  // Complex transformation: flatten and expand nested arrays into multiple result objects
  complexResult: [
    { parentId: 101, parentTitle: 'Project Alpha', itemId: 1001, itemName: 'Task 1', quantity: 3, tags: ['urgent', 'development', 'frontend'] },
    { parentId: 101, parentTitle: 'Project Alpha', itemId: 1002, itemName: 'Task 2', quantity: 1, tags: ['urgent', 'development', 'frontend'] },
    { parentId: 102, parentTitle: 'Project Beta', itemId: 2001, itemName: 'Feature A', quantity: 2, tags: ['backend', 'database'] }
    // Note: Project Gamma has no items, so it doesn't appear in the result
  ],
  // Conditional transformation: keep only objects with items, replace others with null
  conditionalResult: [
    {
      id: 101,
      title: 'Project Alpha',
      details: {
        created: '2023-01-15',
        updated: '2023-03-20',
        tags: ['urgent', 'development', 'frontend']
      },
      items: [
        { itemId: 1001, name: 'Task 1', quantity: 3 },
        { itemId: 1002, name: 'Task 2', quantity: 1 }
      ]
    },
    {
      id: 102,
      title: 'Project Beta',
      details: {
        created: '2023-02-10',
        updated: '2023-02-28',
        tags: ['backend', 'database']
      },
      items: [
        { itemId: 2001, name: 'Feature A', quantity: 2 }
      ]
    },
    null
  ]
};

/**
 * Fixture for testing edge cases in array mapping operations.
 * Includes empty arrays, arrays with null/undefined values, and mixed type arrays.
 */
export const edgeCaseMapFixture = {
  // Empty array
  emptyArray: {
    source: [],
    result: []
  },
  // Array with null values
  nullValueArray: {
    source: [1, null, 3, null, 5],
    // Expected result when mapping with a function that doubles numbers and keeps nulls
    result: [2, null, 6, null, 10]
  },
  // Array with undefined values
  undefinedValueArray: {
    source: ['a', undefined, 'c', undefined, 'e'],
    // Expected result when mapping with a function that uppercases strings and keeps undefined
    result: ['A', undefined, 'C', undefined, 'E']
  },
  // Mixed type array
  mixedTypeArray: {
    source: [1, 'two', 3, true, { id: 5 }],
    // Expected result when mapping with a function that converts everything to strings
    result: ['1', 'two', '3', 'true', '{"id":5}']
  }
};

/**
 * Fixture for testing async mapping operations.
 * Includes arrays that would typically be processed with async mapping functions.
 */
export const asyncMapFixture = {
  // Array of IDs that might be used to fetch data asynchronously
  userIds: {
    source: [101, 102, 103, 104, 105],
    // Expected result after async mapping (e.g., fetching user data by ID)
    result: [
      { id: 101, name: 'User 101', email: 'user101@example.com' },
      { id: 102, name: 'User 102', email: 'user102@example.com' },
      { id: 103, name: 'User 103', email: 'user103@example.com' },
      { id: 104, name: 'User 104', email: 'user104@example.com' },
      { id: 105, name: 'User 105', email: 'user105@example.com' }
    ]
  },
  // Array of URLs that might be used for async fetching
  urls: {
    source: [
      'https://api.example.com/data/1',
      'https://api.example.com/data/2',
      'https://api.example.com/data/3'
    ],
    // Expected result after async mapping (e.g., fetching data from URLs)
    result: [
      { id: 1, data: 'Data from source 1' },
      { id: 2, data: 'Data from source 2' },
      { id: 3, data: 'Data from source 3' }
    ]
  }
};

/**
 * Fixture for testing mapping with index parameter.
 * Includes arrays where the transformation depends on the element's index.
 */
export const indexedMapFixture = {
  // Array of numbers to be transformed with their indices
  numbers: {
    source: [10, 20, 30, 40, 50],
    // Expected result when mapping with a function that multiplies each number by its index
    result: [0, 20, 60, 120, 200]
  },
  // Array of strings to be transformed with their indices
  strings: {
    source: ['a', 'b', 'c', 'd', 'e'],
    // Expected result when mapping with a function that repeats each string by its index + 1 times
    result: ['a', 'bb', 'ccc', 'dddd', 'eeeee']
  }
};