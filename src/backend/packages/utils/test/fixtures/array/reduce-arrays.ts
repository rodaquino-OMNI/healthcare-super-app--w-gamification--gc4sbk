/**
 * Test fixtures for array reduction operations.
 * These fixtures provide standardized test data for array utility functions
 * that perform reduction operations (sum, average, grouping, etc.).
 */

/**
 * Simple numeric arrays with known reduction values
 */
export const numericArrays = {
  /**
   * Empty array for edge case testing
   */
  empty: {
    input: [],
    sum: 0,
    average: 0,
    min: undefined,
    max: undefined,
    count: 0,
  },

  /**
   * Simple positive integers
   */
  simple: {
    input: [1, 2, 3, 4, 5],
    sum: 15,
    average: 3,
    min: 1,
    max: 5,
    count: 5,
  },

  /**
   * Array with negative numbers
   */
  withNegatives: {
    input: [-5, -2, 0, 3, 8],
    sum: 4,
    average: 0.8,
    min: -5,
    max: 8,
    count: 5,
  },

  /**
   * Array with decimal numbers
   */
  withDecimals: {
    input: [1.5, 2.25, 3.75, 4.5],
    sum: 12,
    average: 3,
    min: 1.5,
    max: 4.5,
    count: 4,
  },

  /**
   * Large array for performance testing
   */
  large: {
    input: Array.from({ length: 1000 }, (_, i) => i + 1),
    sum: 500500, // Sum of numbers 1 to 1000
    average: 500.5,
    min: 1,
    max: 1000,
    count: 1000,
  },
};

/**
 * Interface for user objects in test fixtures
 */
export interface TestUser {
  id: number;
  name: string;
  age: number;
  role: string;
  active: boolean;
}

/**
 * Object arrays that can be reduced to maps or aggregated values
 */
export const objectArrays = {
  /**
   * Empty array for edge case testing
   */
  empty: {
    input: [] as TestUser[],
    countByRole: {},
    sumAgeByRole: {},
    activeUserIds: [],
    inactiveUserIds: [],
  },

  /**
   * Array of user objects with various properties
   */
  users: {
    input: [
      { id: 1, name: 'Alice', age: 28, role: 'admin', active: true },
      { id: 2, name: 'Bob', age: 35, role: 'user', active: true },
      { id: 3, name: 'Charlie', age: 42, role: 'admin', active: false },
      { id: 4, name: 'Diana', age: 31, role: 'user', active: true },
      { id: 5, name: 'Eve', age: 25, role: 'user', active: false },
    ] as TestUser[],
    
    // Expected results for various reductions
    countByRole: { admin: 2, user: 3 },
    sumAgeByRole: { admin: 70, user: 91 },
    avgAgeByRole: { admin: 35, user: 30.33 },
    activeUserIds: [1, 2, 4],
    inactiveUserIds: [3, 5],
    userMap: {
      1: { id: 1, name: 'Alice', age: 28, role: 'admin', active: true },
      2: { id: 2, name: 'Bob', age: 35, role: 'user', active: true },
      3: { id: 3, name: 'Charlie', age: 42, role: 'admin', active: false },
      4: { id: 4, name: 'Diana', age: 31, role: 'user', active: true },
      5: { id: 5, name: 'Eve', age: 25, role: 'user', active: false },
    },
    oldestByRole: {
      admin: { id: 3, name: 'Charlie', age: 42, role: 'admin', active: false },
      user: { id: 2, name: 'Bob', age: 35, role: 'user', active: true },
    },
    youngestByRole: {
      admin: { id: 1, name: 'Alice', age: 28, role: 'admin', active: true },
      user: { id: 5, name: 'Eve', age: 25, role: 'user', active: false },
    },
  },
};

/**
 * Interface for product objects in test fixtures
 */
export interface TestProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

/**
 * Product data for testing category-based reductions
 */
export const productArrays = {
  /**
   * Array of product objects with various properties
   */
  products: {
    input: [
      { id: 'p1', name: 'Laptop', category: 'electronics', price: 1200, stock: 10 },
      { id: 'p2', name: 'Smartphone', category: 'electronics', price: 800, stock: 15 },
      { id: 'p3', name: 'Headphones', category: 'electronics', price: 200, stock: 30 },
      { id: 'p4', name: 'T-shirt', category: 'clothing', price: 25, stock: 100 },
      { id: 'p5', name: 'Jeans', category: 'clothing', price: 60, stock: 45 },
      { id: 'p6', name: 'Book', category: 'books', price: 15, stock: 50 },
      { id: 'p7', name: 'Magazine', category: 'books', price: 8, stock: 75 },
    ] as TestProduct[],
    
    // Expected results for various reductions
    countByCategory: { electronics: 3, clothing: 2, books: 2 },
    totalValueByCategory: { electronics: 2200, clothing: 85, books: 23 },
    avgPriceByCategory: { electronics: 733.33, clothing: 42.5, books: 11.5 },
    totalStockByCategory: { electronics: 55, clothing: 145, books: 125 },
    productMap: {
      p1: { id: 'p1', name: 'Laptop', category: 'electronics', price: 1200, stock: 10 },
      p2: { id: 'p2', name: 'Smartphone', category: 'electronics', price: 800, stock: 15 },
      p3: { id: 'p3', name: 'Headphones', category: 'electronics', price: 200, stock: 30 },
      p4: { id: 'p4', name: 'T-shirt', category: 'clothing', price: 25, stock: 100 },
      p5: { id: 'p5', name: 'Jeans', category: 'clothing', price: 60, stock: 45 },
      p6: { id: 'p6', name: 'Book', category: 'books', price: 15, stock: 50 },
      p7: { id: 'p7', name: 'Magazine', category: 'books', price: 8, stock: 75 },
    },
    mostExpensiveByCategory: {
      electronics: { id: 'p1', name: 'Laptop', category: 'electronics', price: 1200, stock: 10 },
      clothing: { id: 'p5', name: 'Jeans', category: 'clothing', price: 60, stock: 45 },
      books: { id: 'p6', name: 'Book', category: 'books', price: 15, stock: 50 },
    },
  },
};

/**
 * Fixtures with initial values for testing complex reduction operations
 */
export const complexReductions = {
  /**
   * Reduction with initial value (calculating factorial)
   */
  factorial: {
    input: [1, 2, 3, 4, 5],
    initialValue: 1,
    expected: 120, // 1 * 1 * 2 * 3 * 4 * 5
  },

  /**
   * Building a frequency map from an array of values
   */
  frequencyMap: {
    input: ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'],
    initialValue: {} as Record<string, number>,
    expected: { apple: 3, banana: 2, orange: 1 },
  },

  /**
   * Transforming an array of strings to a single concatenated string
   */
  stringConcat: {
    input: ['Hello', ' ', 'world', '!'],
    initialValue: '',
    expected: 'Hello world!',
  },

  /**
   * Filtering and mapping in a single reduce operation
   */
  filterAndMap: {
    input: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    initialValue: [] as number[],
    // Expected result: squares of even numbers
    expected: [4, 16, 36, 64, 100],
  },

  /**
   * Nested object reduction (building a nested structure)
   */
  nestedObjectReduction: {
    input: [
      { category: 'fruit', name: 'apple', count: 5 },
      { category: 'vegetable', name: 'carrot', count: 10 },
      { category: 'fruit', name: 'banana', count: 3 },
      { category: 'vegetable', name: 'potato', count: 7 },
      { category: 'fruit', name: 'orange', count: 4 },
    ],
    initialValue: {} as Record<string, { totalCount: number, items: string[] }>,
    expected: {
      fruit: { totalCount: 12, items: ['apple', 'banana', 'orange'] },
      vegetable: { totalCount: 17, items: ['carrot', 'potato'] },
    },
  },

  /**
   * Pagination reduction (chunking an array into pages)
   */
  pagination: {
    input: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    pageSize: 3,
    initialValue: [] as number[][],
    expected: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]],
  },
};

/**
 * Fixtures for testing array reduction with async operations
 */
export const asyncReductions = {
  /**
   * Simple array for testing async sum
   */
  asyncSum: {
    input: [1, 2, 3, 4, 5],
    expected: 15,
  },

  /**
   * Array for testing async sequential processing
   */
  asyncSequential: {
    input: ['a', 'b', 'c', 'd'],
    expected: 'a->b->c->d',
  },
};