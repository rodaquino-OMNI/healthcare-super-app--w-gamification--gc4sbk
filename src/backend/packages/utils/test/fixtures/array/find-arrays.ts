/**
 * Test fixtures for array find and findIndex operations.
 * 
 * These fixtures provide consistent test data for array search utilities across the codebase.
 * They include arrays with elements that can be found by value, condition, or property,
 * ensuring reliable testing of find and findIndex operations.
 */

// Simple primitive arrays for exact value matching
export const numberArray = [1, 2, 3, 4, 5, 10, 20, 30, 40, 50];
export const stringArray = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape'];
export const booleanArray = [true, false, true, true, false];
export const mixedArray = [1, 'two', 3, 'four', true, false, null, undefined, {}, []];

// Arrays with duplicate values to test first-match behavior
export const duplicateNumberArray = [1, 2, 3, 3, 4, 5, 5, 5, 6, 7];
export const duplicateStringArray = ['a', 'b', 'c', 'a', 'd', 'e', 'b', 'f'];

// Empty array for edge case testing
export const emptyArray: any[] = [];

// Array with undefined and null values
export const sparseArray = [undefined, null, 1, undefined, 'test', null, true];

// Object arrays for testing property-based searches
export interface TestUser {
  id: number;
  name: string;
  age: number;
  active: boolean;
  tags?: string[];
}

export const userArray: TestUser[] = [
  { id: 1, name: 'Alice', age: 28, active: true, tags: ['admin', 'developer'] },
  { id: 2, name: 'Bob', age: 35, active: false, tags: ['user'] },
  { id: 3, name: 'Charlie', age: 42, active: true, tags: ['developer'] },
  { id: 4, name: 'Diana', age: 31, active: true, tags: ['tester', 'developer'] },
  { id: 5, name: 'Eve', age: 25, active: false },
];

// Array with nested objects for testing deep property access
export interface TestPost {
  id: number;
  title: string;
  author: {
    id: number;
    name: string;
    contact?: {
      email?: string;
      phone?: string;
    };
  };
  tags: string[];
  published: boolean;
}

export const postArray: TestPost[] = [
  {
    id: 101,
    title: 'Introduction to TypeScript',
    author: {
      id: 1,
      name: 'Alice',
      contact: {
        email: 'alice@example.com',
        phone: '123-456-7890'
      }
    },
    tags: ['typescript', 'programming', 'tutorial'],
    published: true
  },
  {
    id: 102,
    title: 'Advanced React Patterns',
    author: {
      id: 3,
      name: 'Charlie',
      contact: {
        email: 'charlie@example.com'
      }
    },
    tags: ['react', 'javascript', 'frontend'],
    published: true
  },
  {
    id: 103,
    title: 'Testing Best Practices',
    author: {
      id: 4,
      name: 'Diana',
      contact: {
        phone: '987-654-3210'
      }
    },
    tags: ['testing', 'quality', 'development'],
    published: false
  },
  {
    id: 104,
    title: 'Draft: Upcoming Features',
    author: {
      id: 2,
      name: 'Bob'
    },
    tags: ['draft', 'planning'],
    published: false
  }
];

// Arrays with known indices for specific elements (for findIndex testing)
export const indexTestArray = {
  array: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  firstIndex: 0,  // index of 10
  middleIndex: 4, // index of 50
  lastIndex: 9,   // index of 100
  notFoundValue: 55
};

export const objectIndexTestArray = {
  array: userArray,
  firstObject: userArray[0],
  middleObject: userArray[2],
  lastObject: userArray[4],
  firstObjectIndex: 0,
  middleObjectIndex: 2,
  lastObjectIndex: 4,
  activeUserIndices: [0, 2, 3],
  inactiveUserIndices: [1, 4],
  developerUserIndices: [0, 2, 3]
};

// Special case arrays for specific test scenarios
export const largeArray = Array.from({ length: 1000 }, (_, i) => i + 1);
export const negativeNumberArray = [-10, -5, 0, 5, 10];
export const floatNumberArray = [1.1, 2.2, 3.3, 4.4, 5.5];

// Arrays for testing predicates
export const evenNumbers = [2, 4, 6, 8, 10];
export const oddNumbers = [1, 3, 5, 7, 9];
export const mixedNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Common predicates for testing
export const predicates = {
  isEven: (n: number) => n % 2 === 0,
  isOdd: (n: number) => n % 2 !== 0,
  isGreaterThan5: (n: number) => n > 5,
  isLessThan5: (n: number) => n < 5,
  isActive: (user: TestUser) => user.active,
  isAdult: (user: TestUser) => user.age >= 18,
  isDeveloper: (user: TestUser) => user.tags?.includes('developer'),
  isPublished: (post: TestPost) => post.published,
  hasEmail: (post: TestPost) => !!post.author.contact?.email,
};