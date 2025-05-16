/**
 * Basic array test fixtures for testing array utility functions.
 * Provides standardized test fixtures for basic array operations, including empty arrays,
 * arrays of primitive types (strings, numbers, booleans), and arrays of objects with different structures.
 */

// ===== Type Definitions =====

/**
 * Interface for a simple user object used in array fixtures
 */
export interface SimpleUser {
  id: number;
  name: string;
  active: boolean;
}

/**
 * Interface for a detailed user object with nested properties
 */
export interface DetailedUser extends SimpleUser {
  email: string;
  age: number;
  roles: string[];
  metadata: {
    createdAt: string;
    lastLogin?: string;
  };
}

/**
 * Interface for a health metric object used in array fixtures
 */
export interface HealthMetric {
  id: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  userId: number;
}

/**
 * Interface for a product object used in array fixtures
 */
export interface Product {
  id: number;
  name: string;
  price: number;
  categories: string[];
  inStock: boolean;
}

// ===== Empty Arrays =====

/**
 * Empty array for testing edge cases
 */
export const emptyArray: any[] = [];

/**
 * Empty typed arrays for different primitive types
 */
export const emptyStringArray: string[] = [];
export const emptyNumberArray: number[] = [];
export const emptyBooleanArray: boolean[] = [];
export const emptyObjectArray: object[] = [];

// ===== Single Element Arrays =====

/**
 * Single element arrays for testing simple cases
 */
export const singleStringArray: string[] = ['test'];
export const singleNumberArray: number[] = [42];
export const singleBooleanArray: boolean[] = [true];
export const singleObjectArray: object[] = [{ key: 'value' }];

// ===== Primitive Type Arrays =====

/**
 * String arrays with various content
 */
export const basicStringArray: string[] = ['a', 'b', 'c', 'd', 'e'];
export const mixedCaseStringArray: string[] = ['Apple', 'banana', 'Cherry', 'date', 'ELDERBERRY'];
export const longStringArray: string[] = [
  'Lorem ipsum dolor sit amet',
  'consectetur adipiscing elit',
  'sed do eiusmod tempor incididunt',
  'ut labore et dolore magna aliqua',
  'Ut enim ad minim veniam',
];

/**
 * Number arrays with various content
 */
export const basicNumberArray: number[] = [1, 2, 3, 4, 5];
export const negativeNumberArray: number[] = [-5, -4, -3, -2, -1];
export const mixedNumberArray: number[] = [-2, -1, 0, 1, 2];
export const decimalNumberArray: number[] = [1.1, 2.2, 3.3, 4.4, 5.5];
export const largeNumberArray: number[] = [1000, 10000, 100000, 1000000, 10000000];

/**
 * Boolean arrays with various content
 */
export const basicBooleanArray: boolean[] = [true, false, true, false, true];
export const allTrueBooleanArray: boolean[] = [true, true, true, true, true];
export const allFalseBooleanArray: boolean[] = [false, false, false, false, false];

/**
 * Mixed primitive type array (not typed to allow mixed content)
 */
export const mixedPrimitiveArray = [1, 'string', true, 42, 'another string', false];

// ===== Arrays with Duplicates =====

/**
 * Arrays with duplicate elements for testing uniqueness operations
 */
export const duplicateStringArray: string[] = ['a', 'b', 'a', 'c', 'b', 'd', 'a'];
export const duplicateNumberArray: number[] = [1, 2, 2, 3, 1, 4, 3, 5, 5];
export const duplicateBooleanArray: boolean[] = [true, false, true, false, true, false];

// ===== Object Arrays =====

/**
 * Array of simple user objects
 */
export const simpleUserArray: SimpleUser[] = [
  { id: 1, name: 'Alice', active: true },
  { id: 2, name: 'Bob', active: false },
  { id: 3, name: 'Charlie', active: true },
  { id: 4, name: 'David', active: true },
  { id: 5, name: 'Eve', active: false },
];

/**
 * Array of simple user objects with duplicate IDs
 */
export const duplicateIdUserArray: SimpleUser[] = [
  { id: 1, name: 'Alice', active: true },
  { id: 2, name: 'Bob', active: false },
  { id: 1, name: 'Alice (duplicate)', active: true },
  { id: 3, name: 'Charlie', active: true },
  { id: 2, name: 'Bob (duplicate)', active: true },
];

/**
 * Array of simple user objects with duplicate names but different IDs
 */
export const duplicateNameUserArray: SimpleUser[] = [
  { id: 1, name: 'Alice', active: true },
  { id: 2, name: 'Bob', active: false },
  { id: 3, name: 'Alice', active: false },
  { id: 4, name: 'Charlie', active: true },
  { id: 5, name: 'Bob', active: true },
];

/**
 * Array of detailed user objects with nested properties
 */
export const detailedUserArray: DetailedUser[] = [
  {
    id: 1,
    name: 'Alice',
    active: true,
    email: 'alice@example.com',
    age: 28,
    roles: ['user', 'admin'],
    metadata: {
      createdAt: '2023-01-15T08:30:00Z',
      lastLogin: '2023-05-20T14:25:30Z',
    },
  },
  {
    id: 2,
    name: 'Bob',
    active: false,
    email: 'bob@example.com',
    age: 34,
    roles: ['user'],
    metadata: {
      createdAt: '2023-02-10T11:45:00Z',
    },
  },
  {
    id: 3,
    name: 'Charlie',
    active: true,
    email: 'charlie@example.com',
    age: 41,
    roles: ['user', 'editor'],
    metadata: {
      createdAt: '2023-01-05T09:15:00Z',
      lastLogin: '2023-05-18T16:40:15Z',
    },
  },
];

/**
 * Array of health metric objects
 */
export const healthMetricArray: HealthMetric[] = [
  {
    id: 'hr-001',
    type: 'heart_rate',
    value: 72,
    unit: 'bpm',
    timestamp: '2023-05-20T08:30:00Z',
    userId: 1,
  },
  {
    id: 'hr-002',
    type: 'heart_rate',
    value: 68,
    unit: 'bpm',
    timestamp: '2023-05-20T12:30:00Z',
    userId: 1,
  },
  {
    id: 'bp-001',
    type: 'blood_pressure',
    value: 120,
    unit: 'mmHg',
    timestamp: '2023-05-20T08:35:00Z',
    userId: 1,
  },
  {
    id: 'st-001',
    type: 'steps',
    value: 8500,
    unit: 'count',
    timestamp: '2023-05-20T20:00:00Z',
    userId: 2,
  },
  {
    id: 'wt-001',
    type: 'weight',
    value: 70.5,
    unit: 'kg',
    timestamp: '2023-05-20T07:00:00Z',
    userId: 3,
  },
];

/**
 * Array of product objects
 */
export const productArray: Product[] = [
  {
    id: 101,
    name: 'Smartphone',
    price: 699.99,
    categories: ['electronics', 'gadgets'],
    inStock: true,
  },
  {
    id: 102,
    name: 'Laptop',
    price: 1299.99,
    categories: ['electronics', 'computers'],
    inStock: true,
  },
  {
    id: 103,
    name: 'Headphones',
    price: 149.99,
    categories: ['electronics', 'audio'],
    inStock: false,
  },
  {
    id: 104,
    name: 'Smartwatch',
    price: 249.99,
    categories: ['electronics', 'gadgets', 'wearables'],
    inStock: true,
  },
  {
    id: 105,
    name: 'Tablet',
    price: 499.99,
    categories: ['electronics', 'gadgets'],
    inStock: false,
  },
];

// ===== Nested Arrays =====

/**
 * Nested array of numbers for testing flattening operations
 */
export const nestedNumberArray: (number | number[])[] = [1, [2, 3], 4, [5, [6, 7]], 8];

/**
 * Deeply nested array of numbers for testing deep flattening operations
 */
export const deeplyNestedNumberArray: any[] = [1, [2, [3, [4, [5]]]], 6, [7, 8]];

/**
 * Nested array of strings for testing flattening operations
 */
export const nestedStringArray: (string | string[])[] = ['a', ['b', 'c'], 'd', ['e', ['f', 'g']], 'h'];

/**
 * Array of objects with nested arrays
 */
export const objectsWithArraysArray = [
  { id: 1, name: 'Alice', tags: ['developer', 'designer'] },
  { id: 2, name: 'Bob', tags: ['manager', 'sales'] },
  { id: 3, name: 'Charlie', tags: ['developer', 'architect', 'lead'] },
];

/**
 * Array of arrays (matrix) for testing multi-dimensional array operations
 */
export const matrixArray: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

// ===== Special Case Arrays =====

/**
 * Array with null and undefined values for testing compact operations
 */
export const arrayWithNulls: (number | null | undefined)[] = [1, null, 2, undefined, 3, null, 4];

/**
 * Array with empty strings and zero values
 */
export const arrayWithEmpties: (string | number)[] = ['', 0, 'value', '', 42, 0, 'another value'];

/**
 * Array with various falsy values
 */
export const arrayWithFalsyValues: any[] = [0, '', false, null, undefined, NaN];

/**
 * Array with various truthy values
 */
export const arrayWithTruthyValues: any[] = [1, 'string', true, {}, [], 42, new Date()];