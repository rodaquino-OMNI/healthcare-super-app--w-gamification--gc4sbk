/**
 * Find Array Test Fixtures
 * 
 * This module provides test fixtures for array find and findIndex operations,
 * containing arrays with specific elements that can be found by value, condition,
 * or property. These fixtures ensure consistent testing of search utilities
 * across the codebase.
 * 
 * @module test/fixtures/array/find-arrays
 */

/**
 * Interface for objects used in find operation tests
 */
export interface FindTestObject {
  id: number;
  name: string;
  active: boolean;
  tags?: string[];
  value?: number | null;
  metadata?: {
    category?: string;
    priority?: number;
  };
}

/**
 * Interface for a find fixture with expected results
 */
export interface FindFixture<T> {
  /** Description of the test case */
  description: string;
  /** Array to search in */
  array: T[];
  /** Expected element to be found */
  expected: T | undefined;
  /** Index where the element should be found */
  expectedIndex: number;
  /** Optional search value or predicate description */
  searchCriteria?: string;
}

// ===== Primitive Value Arrays =====

/**
 * Empty array for testing find operations on empty collections
 */
export const emptyFindArray: any[] = [];

/**
 * Array of numbers for testing find operations with numeric values
 */
export const numberFindArray = [1, 2, 3, 4, 5, 10, 20, 30, 40, 50];

/**
 * Array of strings for testing find operations with string values
 */
export const stringFindArray = [
  'apple',
  'banana',
  'cherry',
  'date',
  'elderberry',
  'fig',
  'grape',
  'honeydew'
];

/**
 * Array of booleans for testing find operations with boolean values
 */
export const booleanFindArray = [false, false, true, false, true];

/**
 * Mixed type array for testing find operations with different types
 */
export const mixedFindArray = [1, 'two', true, null, undefined, { key: 'value' }, [1, 2, 3]];

// ===== Object Arrays =====

/**
 * Array of objects for testing find operations with object properties
 */
export const objectFindArray: FindTestObject[] = [
  { id: 1, name: 'Item 1', active: true, value: 100, tags: ['important', 'new'] },
  { id: 2, name: 'Item 2', active: false, value: 200, tags: ['archived'] },
  { id: 3, name: 'Item 3', active: true, value: 300, tags: ['important'] },
  { id: 4, name: 'Item 4', active: false, value: null, tags: [] },
  { id: 5, name: 'Item 5', active: true, value: 500, tags: ['new'] },
  { id: 6, name: 'Item 6', active: true, value: 600 },
  { id: 7, name: 'Item 7', active: false, value: 700 },
  { id: 8, name: 'Special Item', active: true, value: 800, metadata: { category: 'special', priority: 1 } },
  { id: 9, name: 'Priority Item', active: true, value: 900, metadata: { category: 'normal', priority: 2 } },
  { id: 10, name: 'Regular Item', active: false, value: 1000, metadata: { category: 'normal', priority: 3 } }
];

/**
 * Array of objects with nested properties for testing deep property access
 */
export const nestedObjectFindArray = [
  {
    id: 1,
    user: {
      name: 'John',
      profile: {
        age: 30,
        location: 'New York'
      }
    }
  },
  {
    id: 2,
    user: {
      name: 'Jane',
      profile: {
        age: 25,
        location: 'San Francisco'
      }
    }
  },
  {
    id: 3,
    user: {
      name: 'Bob',
      profile: {
        age: 40,
        location: 'Chicago'
      }
    }
  },
  {
    id: 4,
    user: {
      name: 'Alice',
      profile: {
        age: 35,
        location: 'New York'
      }
    }
  },
  {
    id: 5,
    user: {
      name: 'Charlie',
      profile: null
    }
  }
];

// ===== Find Fixtures with Expected Results =====

/**
 * Fixtures for testing find operations on number arrays
 */
export const numberFindFixtures: FindFixture<number>[] = [
  {
    description: 'Find the first number equal to 5',
    array: numberFindArray,
    expected: 5,
    expectedIndex: 4,
    searchCriteria: 'value === 5'
  },
  {
    description: 'Find the first number greater than 25',
    array: numberFindArray,
    expected: 30,
    expectedIndex: 7,
    searchCriteria: 'value > 25'
  },
  {
    description: 'Find the first even number',
    array: numberFindArray,
    expected: 2,
    expectedIndex: 1,
    searchCriteria: 'value % 2 === 0'
  },
  {
    description: 'Find a number that does not exist',
    array: numberFindArray,
    expected: undefined,
    expectedIndex: -1,
    searchCriteria: 'value === 15'
  },
  {
    description: 'Find in empty array',
    array: [],
    expected: undefined,
    expectedIndex: -1,
    searchCriteria: 'any condition'
  }
];

/**
 * Fixtures for testing find operations on string arrays
 */
export const stringFindFixtures: FindFixture<string>[] = [
  {
    description: 'Find exact string match',
    array: stringFindArray,
    expected: 'banana',
    expectedIndex: 1,
    searchCriteria: 'value === "banana"'
  },
  {
    description: 'Find string starting with "e"',
    array: stringFindArray,
    expected: 'elderberry',
    expectedIndex: 4,
    searchCriteria: 'value.startsWith("e")'
  },
  {
    description: 'Find string containing "a"',
    array: stringFindArray,
    expected: 'apple',
    expectedIndex: 0,
    searchCriteria: 'value.includes("a")'
  },
  {
    description: 'Find string with length > 6',
    array: stringFindArray,
    expected: 'banana',
    expectedIndex: 1,
    searchCriteria: 'value.length > 6'
  },
  {
    description: 'Find string that does not exist',
    array: stringFindArray,
    expected: undefined,
    expectedIndex: -1,
    searchCriteria: 'value === "kiwi"'
  }
];

/**
 * Fixtures for testing find operations on object arrays
 */
export const objectFindFixtures: FindFixture<FindTestObject>[] = [
  {
    description: 'Find object by id',
    array: objectFindArray,
    expected: objectFindArray[2],
    expectedIndex: 2,
    searchCriteria: 'obj.id === 3'
  },
  {
    description: 'Find first active object',
    array: objectFindArray,
    expected: objectFindArray[0],
    expectedIndex: 0,
    searchCriteria: 'obj.active === true'
  },
  {
    description: 'Find object with specific name',
    array: objectFindArray,
    expected: objectFindArray[7],
    expectedIndex: 7,
    searchCriteria: 'obj.name === "Special Item"'
  },
  {
    description: 'Find object with value greater than 700',
    array: objectFindArray,
    expected: objectFindArray[7],
    expectedIndex: 7,
    searchCriteria: 'obj.value > 700'
  },
  {
    description: 'Find object with specific tag',
    array: objectFindArray,
    expected: objectFindArray[0],
    expectedIndex: 0,
    searchCriteria: 'obj.tags?.includes("important")'
  },
  {
    description: 'Find object with nested property',
    array: objectFindArray,
    expected: objectFindArray[8],
    expectedIndex: 8,
    searchCriteria: 'obj.metadata?.category === "normal" && obj.metadata?.priority === 2'
  },
  {
    description: 'Find object with null value',
    array: objectFindArray,
    expected: objectFindArray[3],
    expectedIndex: 3,
    searchCriteria: 'obj.value === null'
  },
  {
    description: 'Find object with missing property',
    array: objectFindArray,
    expected: objectFindArray[5],
    expectedIndex: 5,
    searchCriteria: 'obj.tags === undefined'
  }
];

/**
 * Fixtures for testing find operations on nested object arrays
 */
export const nestedObjectFindFixtures = [
  {
    description: 'Find by nested property (location)',
    array: nestedObjectFindArray,
    expected: nestedObjectFindArray[0],
    expectedIndex: 0,
    searchCriteria: 'obj.user.profile?.location === "New York"'
  },
  {
    description: 'Find by nested property with range condition',
    array: nestedObjectFindArray,
    expected: nestedObjectFindArray[1],
    expectedIndex: 1,
    searchCriteria: 'obj.user.profile?.age < 30'
  },
  {
    description: 'Find object with null nested property',
    array: nestedObjectFindArray,
    expected: nestedObjectFindArray[4],
    expectedIndex: 4,
    searchCriteria: 'obj.user.profile === null'
  }
];

/**
 * Fixtures for testing edge cases in find operations
 */
export const edgeCaseFindFixtures = [
  {
    description: 'Find in array with undefined values',
    array: [undefined, 1, undefined, 2, undefined],
    expected: undefined,
    expectedIndex: 0,
    searchCriteria: 'value === undefined'
  },
  {
    description: 'Find in array with null values',
    array: [1, null, 2, null, 3],
    expected: null,
    expectedIndex: 1,
    searchCriteria: 'value === null'
  },
  {
    description: 'Find in array with NaN values',
    array: [1, NaN, 2, NaN, 3],
    expected: NaN,
    expectedIndex: 1,
    searchCriteria: 'Number.isNaN(value)'
  },
  {
    description: 'Find in mixed type array',
    array: mixedFindArray,
    expected: 'two',
    expectedIndex: 1,
    searchCriteria: 'typeof value === "string"'
  }
];

/**
 * Combined collection of all find fixtures for easy import
 */
export const allFindFixtures = [
  ...numberFindFixtures,
  ...stringFindFixtures,
  ...objectFindFixtures,
  ...nestedObjectFindFixtures,
  ...edgeCaseFindFixtures
];