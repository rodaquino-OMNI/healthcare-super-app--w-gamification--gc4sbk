/**
 * Filter Array Test Fixtures
 * 
 * This module provides test fixtures specifically designed for testing array filtering operations,
 * with arrays containing elements that match various filtering criteria (by value, type, property,
 * or condition). These fixtures ensure consistent testing of filter functions across the codebase.
 * 
 * @module test/fixtures/array/filter-arrays
 */

/**
 * Interface for objects used in filter operation tests
 */
export interface FilterTestObject {
  id: number;
  name: string;
  active: boolean;
  tags?: string[];
  value?: number | null;
  category?: string;
  priority?: number;
  createdAt?: Date;
}

/**
 * Interface for a filter fixture with expected results
 */
export interface FilterFixture<T> {
  /** Description of the test case */
  description: string;
  /** Array to filter */
  array: T[];
  /** Expected filtered result */
  expected: T[];
  /** Optional filter criteria description */
  filterCriteria?: string;
}

// ===== Primitive Value Arrays =====

/**
 * Empty array for testing filter operations on empty collections
 */
export const emptyFilterArray: any[] = [];

/**
 * Array of numbers for testing filter operations with numeric values
 */
export const numberFilterArray = [1, 2, 3, 4, 5, 10, 20, 30, 40, 50];

/**
 * Array of strings for testing filter operations with string values
 */
export const stringFilterArray = [
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
 * Array of booleans for testing filter operations with boolean values
 */
export const booleanFilterArray = [false, false, true, false, true];

/**
 * Array with duplicate values for testing uniqueness filters
 */
export const duplicateValueArray = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5];

/**
 * Array with duplicate strings for testing uniqueness filters
 */
export const duplicateStringArray = [
  'apple',
  'banana',
  'apple',
  'cherry',
  'banana',
  'date',
  'cherry',
  'apple'
];

/**
 * Array with null and undefined values for testing compact operations
 */
export const nullUndefinedArray = [1, null, 2, undefined, 3, null, 4, undefined, 5];

/**
 * Mixed type array for testing filter operations with different types
 */
export const mixedFilterArray = [1, 'two', true, null, undefined, { key: 'value' }, [1, 2, 3]];

// ===== Object Arrays =====

/**
 * Array of objects for testing filter operations with object properties
 */
export const objectFilterArray: FilterTestObject[] = [
  { id: 1, name: 'Item 1', active: true, value: 100, tags: ['important', 'new'], category: 'A', priority: 1 },
  { id: 2, name: 'Item 2', active: false, value: 200, tags: ['archived'], category: 'B', priority: 2 },
  { id: 3, name: 'Item 3', active: true, value: 300, tags: ['important'], category: 'A', priority: 3 },
  { id: 4, name: 'Item 4', active: false, value: null, tags: [], category: 'C', priority: 1 },
  { id: 5, name: 'Item 5', active: true, value: 500, tags: ['new'], category: 'B', priority: 2 },
  { id: 6, name: 'Item 6', active: true, value: 600, category: 'C', priority: 3 },
  { id: 7, name: 'Item 7', active: false, value: 700, category: 'A', priority: 1 },
  { id: 8, name: 'Special Item', active: true, value: 800, category: 'special', priority: 1 },
  { id: 9, name: 'Priority Item', active: true, value: 900, category: 'normal', priority: 2 },
  { id: 10, name: 'Regular Item', active: false, value: 1000, category: 'normal', priority: 3 }
];

/**
 * Array of objects with duplicate IDs for testing uniqueBy operations
 */
export const duplicateIdObjectArray: FilterTestObject[] = [
  { id: 1, name: 'First Item', active: true, value: 100 },
  { id: 2, name: 'Second Item', active: false, value: 200 },
  { id: 1, name: 'First Item (Duplicate ID)', active: true, value: 150 },
  { id: 3, name: 'Third Item', active: true, value: 300 },
  { id: 2, name: 'Second Item (Duplicate ID)', active: false, value: 250 },
  { id: 4, name: 'Fourth Item', active: false, value: 400 },
  { id: 3, name: 'Third Item (Duplicate ID)', active: true, value: 350 }
];

/**
 * Array of objects with duplicate names (case-insensitive) for testing uniqueBy with selector function
 */
export const duplicateNameObjectArray: FilterTestObject[] = [
  { id: 1, name: 'Alice', active: true, value: 100 },
  { id: 2, name: 'Bob', active: false, value: 200 },
  { id: 3, name: 'alice', active: true, value: 300 },  // Duplicate name (case-insensitive)
  { id: 4, name: 'Charlie', active: false, value: 400 },
  { id: 5, name: 'BOB', active: true, value: 500 },     // Duplicate name (case-insensitive)
  { id: 6, name: 'David', active: true, value: 600 },
  { id: 7, name: 'ALICE', active: false, value: 700 }   // Duplicate name (case-insensitive)
];

/**
 * Array of objects with dates for testing date-based filtering
 */
export const dateObjectArray: FilterTestObject[] = [
  { id: 1, name: 'Item 1', active: true, createdAt: new Date('2023-01-01') },
  { id: 2, name: 'Item 2', active: false, createdAt: new Date('2023-02-15') },
  { id: 3, name: 'Item 3', active: true, createdAt: new Date('2023-03-10') },
  { id: 4, name: 'Item 4', active: false, createdAt: new Date('2023-04-20') },
  { id: 5, name: 'Item 5', active: true, createdAt: new Date('2023-05-05') },
  { id: 6, name: 'Item 6', active: true, createdAt: new Date('2023-06-30') },
  { id: 7, name: 'Item 7', active: false, createdAt: new Date('2023-07-12') },
  { id: 8, name: 'Item 8', active: true, createdAt: new Date('2023-08-22') },
  { id: 9, name: 'Item 9', active: true, createdAt: new Date('2023-09-18') },
  { id: 10, name: 'Item 10', active: false, createdAt: new Date('2023-10-01') }
];

/**
 * Arrays for testing differenceBy and intersectionBy operations
 */
export const firstArray = [1, 2, 3, 4, 5];
export const secondArray = [3, 4, 5, 6, 7];
export const expectedDifference = [1, 2];
export const expectedIntersection = [3, 4, 5];

/**
 * Object arrays for testing differenceBy and intersectionBy operations
 */
export const firstObjectArray: FilterTestObject[] = [
  { id: 1, name: 'Item 1', active: true, value: 100 },
  { id: 2, name: 'Item 2', active: false, value: 200 },
  { id: 3, name: 'Item 3', active: true, value: 300 },
  { id: 4, name: 'Item 4', active: false, value: 400 },
  { id: 5, name: 'Item 5', active: true, value: 500 }
];

export const secondObjectArray: FilterTestObject[] = [
  { id: 3, name: 'Item 3 (Different)', active: false, value: 300 },
  { id: 4, name: 'Item 4 (Different)', active: true, value: 400 },
  { id: 5, name: 'Item 5 (Different)', active: false, value: 500 },
  { id: 6, name: 'Item 6', active: true, value: 600 },
  { id: 7, name: 'Item 7', active: false, value: 700 }
];

// ===== Filter Fixtures with Expected Results =====

/**
 * Fixtures for testing basic filter operations on number arrays
 */
export const numberFilterFixtures: FilterFixture<number>[] = [
  {
    description: 'Filter numbers greater than 10',
    array: numberFilterArray,
    expected: [20, 30, 40, 50],
    filterCriteria: 'value > 10'
  },
  {
    description: 'Filter even numbers',
    array: numberFilterArray,
    expected: [2, 4, 10, 20, 30, 40, 50],
    filterCriteria: 'value % 2 === 0'
  },
  {
    description: 'Filter numbers between 5 and 30 inclusive',
    array: numberFilterArray,
    expected: [5, 10, 20, 30],
    filterCriteria: 'value >= 5 && value <= 30'
  },
  {
    description: 'Filter numbers that are multiples of 10',
    array: numberFilterArray,
    expected: [10, 20, 30, 40, 50],
    filterCriteria: 'value % 10 === 0'
  },
  {
    description: 'Filter with no matches',
    array: numberFilterArray,
    expected: [],
    filterCriteria: 'value > 100'
  },
  {
    description: 'Filter on empty array',
    array: [],
    expected: [],
    filterCriteria: 'any condition'
  }
];

/**
 * Fixtures for testing string filter operations
 */
export const stringFilterFixtures: FilterFixture<string>[] = [
  {
    description: 'Filter strings containing "a"',
    array: stringFilterArray,
    expected: ['apple', 'banana', 'date', 'grape'],
    filterCriteria: 'value.includes("a")'
  },
  {
    description: 'Filter strings starting with "b"',
    array: stringFilterArray,
    expected: ['banana'],
    filterCriteria: 'value.startsWith("b")'
  },
  {
    description: 'Filter strings ending with "e"',
    array: stringFilterArray,
    expected: ['apple', 'date'],
    filterCriteria: 'value.endsWith("e")'
  },
  {
    description: 'Filter strings with length > 6',
    array: stringFilterArray,
    expected: ['banana', 'elderberry', 'honeydew'],
    filterCriteria: 'value.length > 6'
  },
  {
    description: 'Filter strings matching regex pattern',
    array: stringFilterArray,
    expected: ['apple', 'grape'],
    filterCriteria: 'value.match(/^[ag]/)'
  }
];

/**
 * Fixtures for testing uniqueBy operations
 */
export const uniqueByFixtures: FilterFixture<any>[] = [
  {
    description: 'Filter unique primitive values',
    array: duplicateValueArray,
    expected: [1, 2, 3, 4, 5],
    filterCriteria: 'uniqueBy()'
  },
  {
    description: 'Filter unique strings',
    array: duplicateStringArray,
    expected: ['apple', 'banana', 'cherry', 'date'],
    filterCriteria: 'uniqueBy()'
  },
  {
    description: 'Filter objects with unique IDs',
    array: duplicateIdObjectArray,
    expected: [
      { id: 1, name: 'First Item', active: true, value: 100 },
      { id: 2, name: 'Second Item', active: false, value: 200 },
      { id: 3, name: 'Third Item', active: true, value: 300 },
      { id: 4, name: 'Fourth Item', active: false, value: 400 }
    ],
    filterCriteria: 'uniqueBy(array, "id")'
  },
  {
    description: 'Filter objects with unique case-insensitive names',
    array: duplicateNameObjectArray,
    expected: [
      { id: 1, name: 'Alice', active: true, value: 100 },
      { id: 2, name: 'Bob', active: false, value: 200 },
      { id: 4, name: 'Charlie', active: false, value: 400 },
      { id: 6, name: 'David', active: true, value: 600 }
    ],
    filterCriteria: 'uniqueBy(array, item => item.name.toLowerCase())'
  }
];

/**
 * Fixtures for testing filterByProperties operations
 */
export const filterByPropertiesFixtures: FilterFixture<FilterTestObject>[] = [
  {
    description: 'Filter by exact property match',
    array: objectFilterArray,
    expected: [
      objectFilterArray[0],
      objectFilterArray[2],
      objectFilterArray[6]
    ],
    filterCriteria: 'filterByProperties(array, { category: "A" })'
  },
  {
    description: 'Filter by multiple exact property matches (AND logic)',
    array: objectFilterArray,
    expected: [
      objectFilterArray[0]
    ],
    filterCriteria: 'filterByProperties(array, { category: "A", priority: 1 })'
  },
  {
    description: 'Filter by property matcher - contains',
    array: objectFilterArray,
    expected: [
      objectFilterArray[7],
      objectFilterArray[8],
      objectFilterArray[9]
    ],
    filterCriteria: 'filterByProperties(array, { category: { contains: "al" } })'
  },
  {
    description: 'Filter by property matcher - startsWith',
    array: objectFilterArray,
    expected: [
      objectFilterArray[8],
      objectFilterArray[9]
    ],
    filterCriteria: 'filterByProperties(array, { category: { startsWith: "nor" } })'
  },
  {
    description: 'Filter by property matcher - in array',
    array: objectFilterArray,
    expected: [
      objectFilterArray[0],
      objectFilterArray[2],
      objectFilterArray[4],
      objectFilterArray[6]
    ],
    filterCriteria: 'filterByProperties(array, { priority: { in: [1, 2] } })'
  },
  {
    description: 'Filter by property matcher - numeric comparison',
    array: objectFilterArray,
    expected: [
      objectFilterArray[5],
      objectFilterArray[7],
      objectFilterArray[8],
      objectFilterArray[9]
    ],
    filterCriteria: 'filterByProperties(array, { value: { gte: 600 } })'
  },
  {
    description: 'Filter by property matcher - between range',
    array: objectFilterArray,
    expected: [
      objectFilterArray[1],
      objectFilterArray[2],
      objectFilterArray[4]
    ],
    filterCriteria: 'filterByProperties(array, { value: { between: [200, 500] } })'
  },
  {
    description: 'Filter by property matcher - exists',
    array: objectFilterArray,
    expected: [
      objectFilterArray[0],
      objectFilterArray[2],
      objectFilterArray[4]
    ],
    filterCriteria: 'filterByProperties(array, { tags: { exists: true } })'
  },
  {
    description: 'Filter by multiple property matchers (AND logic)',
    array: objectFilterArray,
    expected: [
      objectFilterArray[0],
      objectFilterArray[2]
    ],
    filterCriteria: 'filterByProperties(array, { active: true, value: { gt: 0 }, tags: { exists: true } })'
  },
  {
    description: 'Filter by multiple property matchers (OR logic)',
    array: objectFilterArray,
    expected: [
      objectFilterArray[0],
      objectFilterArray[2],
      objectFilterArray[3],
      objectFilterArray[4],
      objectFilterArray[5],
      objectFilterArray[7],
      objectFilterArray[8]
    ],
    filterCriteria: 'filterByProperties(array, { active: true, value: null }, false)'
  }
];

/**
 * Fixtures for testing rejectByProperties operations
 */
export const rejectByPropertiesFixtures: FilterFixture<FilterTestObject>[] = [
  {
    description: 'Reject by exact property match',
    array: objectFilterArray,
    expected: objectFilterArray.filter(item => item.category !== 'A'),
    filterCriteria: 'rejectByProperties(array, { category: "A" })'
  },
  {
    description: 'Reject inactive items',
    array: objectFilterArray,
    expected: objectFilterArray.filter(item => item.active),
    filterCriteria: 'rejectByProperties(array, { active: false })'
  },
  {
    description: 'Reject by property matcher - value range',
    array: objectFilterArray,
    expected: objectFilterArray.filter(item => !(item.value !== null && item.value >= 500)),
    filterCriteria: 'rejectByProperties(array, { value: { gte: 500 } })'
  },
  {
    description: 'Reject by multiple criteria (AND logic)',
    array: objectFilterArray,
    expected: objectFilterArray.filter(item => !(item.active && item.category === 'A')),
    filterCriteria: 'rejectByProperties(array, { active: true, category: "A" })'
  },
  {
    description: 'Reject by multiple criteria (OR logic)',
    array: objectFilterArray,
    expected: objectFilterArray.filter(item => !(item.active || item.category === 'A')),
    filterCriteria: 'rejectByProperties(array, { active: true, category: "A" }, false)'
  }
];

/**
 * Fixtures for testing differenceBy operations
 */
export const differenceByFixtures: FilterFixture<any>[] = [
  {
    description: 'Difference between two number arrays',
    array: firstArray,
    expected: expectedDifference,
    filterCriteria: 'differenceBy(firstArray, secondArray)'
  },
  {
    description: 'Difference between object arrays by ID',
    array: firstObjectArray,
    expected: [
      firstObjectArray[0],
      firstObjectArray[1]
    ],
    filterCriteria: 'differenceBy(firstObjectArray, secondObjectArray, "id")'
  },
  {
    description: 'Difference between object arrays by custom selector',
    array: firstObjectArray,
    expected: [],
    filterCriteria: 'differenceBy(firstObjectArray, secondObjectArray, item => item.value)'
  }
];

/**
 * Fixtures for testing intersectionBy operations
 */
export const intersectionByFixtures: FilterFixture<any>[] = [
  {
    description: 'Intersection between two number arrays',
    array: firstArray,
    expected: expectedIntersection,
    filterCriteria: 'intersectionBy(firstArray, secondArray)'
  },
  {
    description: 'Intersection between object arrays by ID',
    array: firstObjectArray,
    expected: [
      firstObjectArray[2],
      firstObjectArray[3],
      firstObjectArray[4]
    ],
    filterCriteria: 'intersectionBy(firstObjectArray, secondObjectArray, "id")'
  },
  {
    description: 'Intersection between object arrays by custom selector',
    array: firstObjectArray,
    expected: [
      firstObjectArray[2],
      firstObjectArray[3],
      firstObjectArray[4]
    ],
    filterCriteria: 'intersectionBy(firstObjectArray, secondObjectArray, item => item.value)'
  }
];

/**
 * Fixtures for testing compact operations
 */
export const compactFixtures: FilterFixture<any>[] = [
  {
    description: 'Remove null and undefined values',
    array: nullUndefinedArray,
    expected: [1, 2, 3, 4, 5],
    filterCriteria: 'compact(array)'
  },
  {
    description: 'Compact array with no null/undefined values',
    array: [1, 2, 3, 4, 5],
    expected: [1, 2, 3, 4, 5],
    filterCriteria: 'compact(array)'
  },
  {
    description: 'Compact array with only null/undefined values',
    array: [null, undefined, null, undefined],
    expected: [],
    filterCriteria: 'compact(array)'
  },
  {
    description: 'Compact mixed array',
    array: [0, '', false, null, undefined, NaN, 'text'],
    expected: [0, '', false, NaN, 'text'],
    filterCriteria: 'compact(array)'
  }
];

/**
 * Fixtures for testing filterWithRejections operations
 */
export const filterWithRejectionsFixtures: FilterFixture<any>[] = [
  {
    description: 'Filter even numbers with rejections',
    array: numberFilterArray,
    expected: {
      filtered: [2, 4, 10, 20, 30, 40, 50],
      rejected: [1, 3, 5]
    },
    filterCriteria: 'filterWithRejections(array, num => num % 2 === 0)'
  },
  {
    description: 'Filter active objects with rejections',
    array: objectFilterArray,
    expected: {
      filtered: objectFilterArray.filter(item => item.active),
      rejected: objectFilterArray.filter(item => !item.active)
    },
    filterCriteria: 'filterWithRejections(array, item => item.active)'
  },
  {
    description: 'Filter objects by value threshold with rejections',
    array: objectFilterArray,
    expected: {
      filtered: objectFilterArray.filter(item => item.value !== null && item.value > 500),
      rejected: objectFilterArray.filter(item => item.value === null || item.value <= 500)
    },
    filterCriteria: 'filterWithRejections(array, item => item.value !== null && item.value > 500)'
  }
];

/**
 * Combined collection of all filter fixtures for easy import
 */
export const allFilterFixtures = [
  ...numberFilterFixtures,
  ...stringFilterFixtures,
  ...uniqueByFixtures,
  ...filterByPropertiesFixtures,
  ...rejectByPropertiesFixtures,
  ...differenceByFixtures,
  ...intersectionByFixtures,
  ...compactFixtures
];