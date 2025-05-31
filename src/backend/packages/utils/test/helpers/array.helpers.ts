/**
 * Test helpers for array utilities
 * 
 * This module provides helper functions for testing array manipulation utilities,
 * including generators for test arrays, comparison utilities, and specialized helpers
 * for testing array transformations, grouping, filtering, and chunking operations.
 */

import { randomUtils } from './common.helpers';

/**
 * Configuration options for generating test arrays
 */
export interface ArrayGeneratorOptions {
  /** Minimum length of the array */
  minLength?: number;
  /** Maximum length of the array */
  maxLength?: number;
  /** Include null values in the array */
  includeNulls?: boolean;
  /** Include undefined values in the array */
  includeUndefined?: boolean;
  /** Maximum depth for nested arrays */
  maxDepth?: number;
  /** Type of array to generate */
  arrayType?: 'primitive' | 'object' | 'mixed' | 'nested';
  /** Custom value generator function */
  valueGenerator?: (index: number) => any;
}

/**
 * Default options for generating test arrays
 */
const DEFAULT_GENERATOR_OPTIONS: ArrayGeneratorOptions = {
  minLength: 5,
  maxLength: 10,
  includeNulls: false,
  includeUndefined: false,
  maxDepth: 2,
  arrayType: 'primitive',
};

/**
 * Generates a test array with configurable properties
 * 
 * @param options Configuration options for the generated array
 * @param currentDepth Current depth in the recursion (used internally)
 * @returns A test array with the specified properties
 */
export function generateTestArray(
  options: ArrayGeneratorOptions = {},
  currentDepth = 0
): any[] {
  const config = { ...DEFAULT_GENERATOR_OPTIONS, ...options };
  
  // Determine array length
  const length = randomUtils.integer(
    config.minLength || 5,
    config.maxLength || 10
  );
  
  // Create array with specified length
  return Array.from({ length }, (_, index) => {
    // Use custom value generator if provided
    if (config.valueGenerator) {
      return config.valueGenerator(index);
    }
    
    // Determine value type based on array type and options
    const valueType = getRandomValueType(config);
    
    switch (valueType) {
      case 'null':
        return null;
      case 'undefined':
        return undefined;
      case 'nested':
        // Only create nested arrays if not at max depth
        if (currentDepth < (config.maxDepth || 2)) {
          return generateTestArray(
            { ...config, maxLength: 3 }, // Smaller length for nested arrays
            currentDepth + 1
          );
        }
        // Fall through to primitive if at max depth
      case 'object':
        return generateTestObject(index);
      case 'primitive':
      default:
        return generatePrimitiveValue(index);
    }
  });
}

/**
 * Determines a random value type based on configuration options
 */
function getRandomValueType(config: ArrayGeneratorOptions): string {
  const types: string[] = ['primitive'];
  
  if (config.arrayType === 'object' || config.arrayType === 'mixed') {
    types.push('object');
  }
  
  if (config.arrayType === 'nested' || config.arrayType === 'mixed') {
    types.push('nested');
  }
  
  if (config.includeNulls) {
    types.push('null');
  }
  
  if (config.includeUndefined) {
    types.push('undefined');
  }
  
  return randomUtils.element(types);
}

/**
 * Generates a primitive value (string, number, boolean) for test arrays
 */
function generatePrimitiveValue(index: number): string | number | boolean {
  const type = randomUtils.integer(0, 2);
  
  switch (type) {
    case 0: // String
      return `value-${index}-${randomUtils.string(5)}`;
    case 1: // Number
      return randomUtils.integer(1, 1000);
    case 2: // Boolean
      return randomUtils.boolean();
    default:
      return `value-${index}`;
  }
}

/**
 * Generates a test object for object arrays
 */
function generateTestObject(index: number): Record<string, any> {
  return {
    id: index,
    name: `Item ${index}`,
    value: randomUtils.integer(1, 1000),
    isActive: randomUtils.boolean(),
    tags: Array.from(
      { length: randomUtils.integer(1, 3) },
      (_, i) => `tag-${i}-${randomUtils.string(3)}`
    ),
    createdAt: new Date(Date.now() - randomUtils.integer(0, 10000000)),
  };
}

/**
 * Generates a deeply nested array for testing flattening operations
 * 
 * @param depth Maximum depth of nesting
 * @param breadth Maximum number of elements at each level
 * @returns A deeply nested array
 */
export function generateNestedArray(depth = 3, breadth = 3): any[] {
  if (depth <= 0) {
    return Array.from(
      { length: randomUtils.integer(1, breadth) },
      (_, i) => `value-${i}-${randomUtils.string(3)}`
    );
  }
  
  return Array.from({ length: randomUtils.integer(1, breadth) }, (_, i) => {
    // Randomly decide whether to nest or use a value
    if (randomUtils.boolean() && depth > 1) {
      return generateNestedArray(depth - 1, breadth);
    } else {
      return `value-${i}-${randomUtils.string(3)}`;
    }
  });
}

/**
 * Generates an array of objects with specified properties for testing
 * 
 * @param length Length of the array to generate
 * @param properties Properties to include in each object
 * @returns An array of objects with the specified properties
 */
export function generateObjectArray(
  length = 10,
  properties: string[] = ['id', 'name', 'value', 'isActive']
): Record<string, any>[] {
  return Array.from({ length }, (_, index) => {
    const obj: Record<string, any> = {};
    
    properties.forEach(prop => {
      switch (prop) {
        case 'id':
          obj.id = index;
          break;
        case 'name':
          obj.name = `Item ${index}`;
          break;
        case 'value':
          obj.value = randomUtils.integer(1, 1000);
          break;
        case 'isActive':
          obj.isActive = randomUtils.boolean();
          break;
        case 'tags':
          obj.tags = Array.from(
            { length: randomUtils.integer(1, 3) },
            (_, i) => `tag-${i}-${randomUtils.string(3)}`
          );
          break;
        case 'createdAt':
          obj.createdAt = new Date(Date.now() - randomUtils.integer(0, 10000000));
          break;
        case 'category':
          obj.category = randomUtils.element(['A', 'B', 'C', 'D']);
          break;
        case 'score':
          obj.score = randomUtils.integer(0, 100);
          break;
        default:
          obj[prop] = `${prop}-${index}-${randomUtils.string(3)}`;
      }
    });
    
    return obj;
  });
}

/**
 * Generates an array of objects with controlled duplicates for testing uniqueness functions
 * 
 * @param baseLength Base length of the array before adding duplicates
 * @param duplicateCount Number of duplicates to add
 * @param duplicateKey Key to use for creating duplicates
 * @returns An array with controlled duplicates
 */
export function generateArrayWithDuplicates(
  baseLength = 8,
  duplicateCount = 3,
  duplicateKey = 'id'
): Record<string, any>[] {
  // Generate base array
  const baseArray = generateObjectArray(baseLength);
  
  // Create duplicates by copying and modifying existing items
  const duplicates = Array.from({ length: duplicateCount }, (_, i) => {
    const sourceIndex = randomUtils.integer(0, baseLength - 1);
    const source = baseArray[sourceIndex];
    
    // Create a copy with the same key value but different in other properties
    const duplicate = { ...source };
    duplicate.name = `Duplicate ${i} of ${source.name}`;
    duplicate.value = source.value + 1000;
    
    return duplicate;
  });
  
  // Combine and shuffle
  return shuffleArray([...baseArray, ...duplicates]);
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * 
 * @param array The array to shuffle
 * @returns A shuffled copy of the array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

/**
 * Creates a test array with specific properties for testing transform operations
 * 
 * @returns An array suitable for testing transform utilities
 */
export function createTransformTestArray(): any[] {
  return [
    { id: 1, name: 'Item 1', category: 'A', value: 100, tags: ['tag1', 'tag2'] },
    { id: 2, name: 'Item 2', category: 'B', value: 200, tags: ['tag2', 'tag3'] },
    { id: 3, name: 'Item 3', category: 'A', value: 300, tags: ['tag1', 'tag3'] },
    { id: 4, name: 'Item 4', category: 'C', value: 400, tags: ['tag4'] },
    { id: 5, name: 'Item 5', category: 'B', value: 500, tags: ['tag2', 'tag5'] },
  ];
}

/**
 * Expected results for transform operations on the test array
 */
export const transformExpectedResults = {
  flattenDeep: {
    input: [1, [2, [3, 4], 5]],
    output: [1, 2, 3, 4, 5],
  },
  mapByKey: {
    input: createTransformTestArray(),
    output: {
      '1': { id: 1, name: 'Item 1', category: 'A', value: 100, tags: ['tag1', 'tag2'] },
      '2': { id: 2, name: 'Item 2', category: 'B', value: 200, tags: ['tag2', 'tag3'] },
      '3': { id: 3, name: 'Item 3', category: 'A', value: 300, tags: ['tag1', 'tag3'] },
      '4': { id: 4, name: 'Item 4', category: 'C', value: 400, tags: ['tag4'] },
      '5': { id: 5, name: 'Item 5', category: 'B', value: 500, tags: ['tag2', 'tag5'] },
    },
    outputWithMapper: {
      '1': 'Item 1',
      '2': 'Item 2',
      '3': 'Item 3',
      '4': 'Item 4',
      '5': 'Item 5',
    },
  },
  indexBy: {
    input: createTransformTestArray(),
    output: {
      '1': { id: 1, name: 'Item 1', category: 'A', value: 100, tags: ['tag1', 'tag2'] },
      '2': { id: 2, name: 'Item 2', category: 'B', value: 200, tags: ['tag2', 'tag3'] },
      '3': { id: 3, name: 'Item 3', category: 'A', value: 300, tags: ['tag1', 'tag3'] },
      '4': { id: 4, name: 'Item 4', category: 'C', value: 400, tags: ['tag4'] },
      '5': { id: 5, name: 'Item 5', category: 'B', value: 500, tags: ['tag2', 'tag5'] },
    },
  },
  pluck: {
    input: createTransformTestArray(),
    output: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'],
  },
  unique: {
    input: [1, 2, 2, 3, 1, 4, 5, 4],
    output: [1, 2, 3, 4, 5],
  },
};

/**
 * Creates a test array with specific properties for testing filter operations
 * 
 * @returns An array suitable for testing filter utilities
 */
export function createFilterTestArray(): any[] {
  return [
    { id: 1, name: 'Item 1', category: 'A', value: 100, isActive: true, tags: ['tag1', 'tag2'] },
    { id: 2, name: 'Item 2', category: 'B', value: 200, isActive: false, tags: ['tag2', 'tag3'] },
    { id: 3, name: 'Item 3', category: 'A', value: 300, isActive: true, tags: ['tag1', 'tag3'] },
    { id: 4, name: 'Item 4', category: 'C', value: 400, isActive: true, tags: ['tag4'] },
    { id: 5, name: 'Item 5', category: 'B', value: 500, isActive: false, tags: ['tag2', 'tag5'] },
    { id: 6, name: 'Item 1', category: 'D', value: 600, isActive: true, tags: ['tag6'] }, // Duplicate name
  ];
}

/**
 * Expected results for filter operations on the test array
 */
export const filterExpectedResults = {
  uniqueBy: {
    byId: [
      { id: 1, name: 'Item 1', category: 'A', value: 100, isActive: true, tags: ['tag1', 'tag2'] },
      { id: 2, name: 'Item 2', category: 'B', value: 200, isActive: false, tags: ['tag2', 'tag3'] },
      { id: 3, name: 'Item 3', category: 'A', value: 300, isActive: true, tags: ['tag1', 'tag3'] },
      { id: 4, name: 'Item 4', category: 'C', value: 400, isActive: true, tags: ['tag4'] },
      { id: 5, name: 'Item 5', category: 'B', value: 500, isActive: false, tags: ['tag2', 'tag5'] },
      { id: 6, name: 'Item 1', category: 'D', value: 600, isActive: true, tags: ['tag6'] },
    ],
    byName: [
      { id: 1, name: 'Item 1', category: 'A', value: 100, isActive: true, tags: ['tag1', 'tag2'] },
      { id: 2, name: 'Item 2', category: 'B', value: 200, isActive: false, tags: ['tag2', 'tag3'] },
      { id: 3, name: 'Item 3', category: 'A', value: 300, isActive: true, tags: ['tag1', 'tag3'] },
      { id: 4, name: 'Item 4', category: 'C', value: 400, isActive: true, tags: ['tag4'] },
      { id: 5, name: 'Item 5', category: 'B', value: 500, isActive: false, tags: ['tag2', 'tag5'] },
    ],
    byCategory: [
      { id: 1, name: 'Item 1', category: 'A', value: 100, isActive: true, tags: ['tag1', 'tag2'] },
      { id: 2, name: 'Item 2', category: 'B', value: 200, isActive: false, tags: ['tag2', 'tag3'] },
      { id: 4, name: 'Item 4', category: 'C', value: 400, isActive: true, tags: ['tag4'] },
      { id: 6, name: 'Item 1', category: 'D', value: 600, isActive: true, tags: ['tag6'] },
    ],
  },
  filterByProperties: {
    category: [
      { id: 1, name: 'Item 1', category: 'A', value: 100, isActive: true, tags: ['tag1', 'tag2'] },
      { id: 3, name: 'Item 3', category: 'A', value: 300, isActive: true, tags: ['tag1', 'tag3'] },
    ],
    isActive: [
      { id: 1, name: 'Item 1', category: 'A', value: 100, isActive: true, tags: ['tag1', 'tag2'] },
      { id: 3, name: 'Item 3', category: 'A', value: 300, isActive: true, tags: ['tag1', 'tag3'] },
      { id: 4, name: 'Item 4', category: 'C', value: 400, isActive: true, tags: ['tag4'] },
      { id: 6, name: 'Item 1', category: 'D', value: 600, isActive: true, tags: ['tag6'] },
    ],
    multiple: [
      { id: 1, name: 'Item 1', category: 'A', value: 100, isActive: true, tags: ['tag1', 'tag2'] },
    ],
    partialMatch: [
      { id: 1, name: 'Item 1', category: 'A', value: 100, isActive: true, tags: ['tag1', 'tag2'] },
      { id: 6, name: 'Item 1', category: 'D', value: 600, isActive: true, tags: ['tag6'] },
    ],
  },
  rejectByProperties: {
    category: [
      { id: 2, name: 'Item 2', category: 'B', value: 200, isActive: false, tags: ['tag2', 'tag3'] },
      { id: 4, name: 'Item 4', category: 'C', value: 400, isActive: true, tags: ['tag4'] },
      { id: 5, name: 'Item 5', category: 'B', value: 500, isActive: false, tags: ['tag2', 'tag5'] },
      { id: 6, name: 'Item 1', category: 'D', value: 600, isActive: true, tags: ['tag6'] },
    ],
    isActive: [
      { id: 2, name: 'Item 2', category: 'B', value: 200, isActive: false, tags: ['tag2', 'tag3'] },
      { id: 5, name: 'Item 5', category: 'B', value: 500, isActive: false, tags: ['tag2', 'tag5'] },
    ],
  },
  differenceBy: {
    input: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
      { id: 4, name: 'Item 4' },
      { id: 5, name: 'Item 5' },
    ],
    exclude: [
      { id: 2, name: 'Different Name' },
      { id: 4, name: 'Also Different' },
    ],
    output: [
      { id: 1, name: 'Item 1' },
      { id: 3, name: 'Item 3' },
      { id: 5, name: 'Item 5' },
    ],
  },
};

/**
 * Creates a test array with specific properties for testing group operations
 * 
 * @returns An array suitable for testing group utilities
 */
export function createGroupTestArray(): any[] {
  return [
    { id: 1, name: 'Item 1', category: 'A', value: 100, date: '2023-01-01' },
    { id: 2, name: 'Item 2', category: 'B', value: 200, date: '2023-01-15' },
    { id: 3, name: 'Item 3', category: 'A', value: 300, date: '2023-01-20' },
    { id: 4, name: 'Item 4', category: 'C', value: 400, date: '2023-02-01' },
    { id: 5, name: 'Item 5', category: 'B', value: 500, date: '2023-02-15' },
    { id: 6, name: 'Item 6', category: 'A', value: 600, date: '2023-03-01' },
  ];
}

/**
 * Expected results for group operations on the test array
 */
export const groupExpectedResults = {
  groupBy: {
    byCategory: {
      'A': [
        { id: 1, name: 'Item 1', category: 'A', value: 100, date: '2023-01-01' },
        { id: 3, name: 'Item 3', category: 'A', value: 300, date: '2023-01-20' },
        { id: 6, name: 'Item 6', category: 'A', value: 600, date: '2023-03-01' },
      ],
      'B': [
        { id: 2, name: 'Item 2', category: 'B', value: 200, date: '2023-01-15' },
        { id: 5, name: 'Item 5', category: 'B', value: 500, date: '2023-02-15' },
      ],
      'C': [
        { id: 4, name: 'Item 4', category: 'C', value: 400, date: '2023-02-01' },
      ],
    },
    byMonth: {
      '2023-01': [
        { id: 1, name: 'Item 1', category: 'A', value: 100, date: '2023-01-01' },
        { id: 2, name: 'Item 2', category: 'B', value: 200, date: '2023-01-15' },
        { id: 3, name: 'Item 3', category: 'A', value: 300, date: '2023-01-20' },
      ],
      '2023-02': [
        { id: 4, name: 'Item 4', category: 'C', value: 400, date: '2023-02-01' },
        { id: 5, name: 'Item 5', category: 'B', value: 500, date: '2023-02-15' },
      ],
      '2023-03': [
        { id: 6, name: 'Item 6', category: 'A', value: 600, date: '2023-03-01' },
      ],
    },
  },
  partitionBy: {
    byValue: [
      [ // Items with value > 300
        { id: 4, name: 'Item 4', category: 'C', value: 400, date: '2023-02-01' },
        { id: 5, name: 'Item 5', category: 'B', value: 500, date: '2023-02-15' },
        { id: 6, name: 'Item 6', category: 'A', value: 600, date: '2023-03-01' },
      ],
      [ // Items with value <= 300
        { id: 1, name: 'Item 1', category: 'A', value: 100, date: '2023-01-01' },
        { id: 2, name: 'Item 2', category: 'B', value: 200, date: '2023-01-15' },
        { id: 3, name: 'Item 3', category: 'A', value: 300, date: '2023-01-20' },
      ],
    ],
    byCategory: [
      [ // Items with category 'A'
        { id: 1, name: 'Item 1', category: 'A', value: 100, date: '2023-01-01' },
        { id: 3, name: 'Item 3', category: 'A', value: 300, date: '2023-01-20' },
        { id: 6, name: 'Item 6', category: 'A', value: 600, date: '2023-03-01' },
      ],
      [ // Items with category not 'A'
        { id: 2, name: 'Item 2', category: 'B', value: 200, date: '2023-01-15' },
        { id: 4, name: 'Item 4', category: 'C', value: 400, date: '2023-02-01' },
        { id: 5, name: 'Item 5', category: 'B', value: 500, date: '2023-02-15' },
      ],
    ],
  },
  keyBy: {
    byId: {
      '1': { id: 1, name: 'Item 1', category: 'A', value: 100, date: '2023-01-01' },
      '2': { id: 2, name: 'Item 2', category: 'B', value: 200, date: '2023-01-15' },
      '3': { id: 3, name: 'Item 3', category: 'A', value: 300, date: '2023-01-20' },
      '4': { id: 4, name: 'Item 4', category: 'C', value: 400, date: '2023-02-01' },
      '5': { id: 5, name: 'Item 5', category: 'B', value: 500, date: '2023-02-15' },
      '6': { id: 6, name: 'Item 6', category: 'A', value: 600, date: '2023-03-01' },
    },
    byName: {
      'Item 1': { id: 1, name: 'Item 1', category: 'A', value: 100, date: '2023-01-01' },
      'Item 2': { id: 2, name: 'Item 2', category: 'B', value: 200, date: '2023-01-15' },
      'Item 3': { id: 3, name: 'Item 3', category: 'A', value: 300, date: '2023-01-20' },
      'Item 4': { id: 4, name: 'Item 4', category: 'C', value: 400, date: '2023-02-01' },
      'Item 5': { id: 5, name: 'Item 5', category: 'B', value: 500, date: '2023-02-15' },
      'Item 6': { id: 6, name: 'Item 6', category: 'A', value: 600, date: '2023-03-01' },
    },
  },
  groupByMultiple: {
    byCategoryAndMonth: {
      'A': {
        '2023-01': [
          { id: 1, name: 'Item 1', category: 'A', value: 100, date: '2023-01-01' },
          { id: 3, name: 'Item 3', category: 'A', value: 300, date: '2023-01-20' },
        ],
        '2023-03': [
          { id: 6, name: 'Item 6', category: 'A', value: 600, date: '2023-03-01' },
        ],
      },
      'B': {
        '2023-01': [
          { id: 2, name: 'Item 2', category: 'B', value: 200, date: '2023-01-15' },
        ],
        '2023-02': [
          { id: 5, name: 'Item 5', category: 'B', value: 500, date: '2023-02-15' },
        ],
      },
      'C': {
        '2023-02': [
          { id: 4, name: 'Item 4', category: 'C', value: 400, date: '2023-02-01' },
        ],
      },
    },
  },
  countBy: {
    byCategory: {
      'A': 3,
      'B': 2,
      'C': 1,
    },
    byMonth: {
      '2023-01': 3,
      '2023-02': 2,
      '2023-03': 1,
    },
  },
};

/**
 * Creates a test array with specific properties for testing chunk operations
 * 
 * @returns An array suitable for testing chunk utilities
 */
export function createChunkTestArray(): number[] {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
}

/**
 * Expected results for chunk operations on the test array
 */
export const chunkExpectedResults = {
  chunk: {
    size2: [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]],
    size3: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]],
    size5: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]],
  },
  chunkBySize: {
    chunks2: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]],
    chunks3: [[1, 2, 3, 4], [5, 6, 7], [8, 9, 10]],
    chunks5: [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]],
  },
  chunkByPredicate: {
    byEvenOdd: [[2, 4, 6, 8, 10], [1, 3, 5, 7, 9]],
    byLessThan5: [[1, 2, 3, 4], [5, 6, 7, 8, 9, 10]],
  },
  chunkByMaxSize: {
    input: [
      { id: 1, size: 300 },
      { id: 2, size: 200 },
      { id: 3, size: 400 },
      { id: 4, size: 100 },
      { id: 5, size: 500 },
      { id: 6, size: 250 },
    ],
    maxSize500: [
      [{ id: 1, size: 300 }, { id: 2, size: 200 }],
      [{ id: 3, size: 400 }],
      [{ id: 4, size: 100 }, { id: 6, size: 250 }],
      [{ id: 5, size: 500 }],
    ],
  },
  chunkByBoundary: {
    input: [1, 2, 5, 6, 7, 10, 11, 15],
    byGap: [[1, 2], [5, 6, 7], [10, 11], [15]],
  },
};

/**
 * Verifies that an array utility function correctly handles edge cases
 * 
 * @param utilityFn The array utility function to test
 * @param edgeCases Array of edge cases to test
 * @returns A result object with success flag and details
 */
export function verifyEdgeCaseHandling(
  utilityFn: (...args: any[]) => any,
  edgeCases: Array<{ args: any[], shouldThrow: boolean, expectedResult?: any }>
): Array<{ success: boolean, args: any[], error?: Error, result?: any }> {
  return edgeCases.map(({ args, shouldThrow, expectedResult }) => {
    try {
      const result = utilityFn(...args);
      
      if (shouldThrow) {
        return {
          success: false,
          args,
          result,
          error: new Error('Expected function to throw but it did not'),
        };
      }
      
      if (expectedResult !== undefined) {
        const isEqual = JSON.stringify(result) === JSON.stringify(expectedResult);
        return {
          success: isEqual,
          args,
          result,
          error: isEqual ? undefined : new Error('Result does not match expected result'),
        };
      }
      
      return { success: true, args, result };
    } catch (error) {
      if (shouldThrow) {
        return { success: true, args, error: error as Error };
      }
      
      return {
        success: false,
        args,
        error: error as Error,
      };
    }
  });
}

/**
 * Common edge cases for array utility functions
 */
export const commonEdgeCases = {
  emptyArray: { args: [[]], shouldThrow: false },
  nullInput: { args: [null], shouldThrow: true },
  undefinedInput: { args: [undefined], shouldThrow: true },
  nonArrayInput: { args: [{}], shouldThrow: true },
  arrayWithNulls: { args: [[1, null, 3]], shouldThrow: false },
  arrayWithUndefined: { args: [[1, undefined, 3]], shouldThrow: false },
};

/**
 * Creates a performance test for an array utility function
 * 
 * @param utilityFn The array utility function to test
 * @param generateArgs Function to generate arguments for the utility function
 * @param iterations Number of iterations to run
 * @returns Performance metrics for the function
 */
export function measurePerformance(
  utilityFn: (...args: any[]) => any,
  generateArgs: () => any[],
  iterations = 100
): { avgTime: number, minTime: number, maxTime: number } {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const args = generateArgs();
    
    const start = performance.now();
    utilityFn(...args);
    const end = performance.now();
    
    times.push(end - start);
  }
  
  return {
    avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
  };
}

/**
 * Creates a test for comparing the performance of two implementations
 * 
 * @param name Name of the test
 * @param impl1 First implementation to test
 * @param impl2 Second implementation to test
 * @param generateArgs Function to generate arguments for both implementations
 * @param iterations Number of iterations to run
 * @returns Comparison of performance metrics
 */
export function compareImplementations(
  name: string,
  impl1: (...args: any[]) => any,
  impl2: (...args: any[]) => any,
  generateArgs: () => any[],
  iterations = 100
): { name: string, impl1Metrics: ReturnType<typeof measurePerformance>, impl2Metrics: ReturnType<typeof measurePerformance>, diff: number } {
  const impl1Metrics = measurePerformance(impl1, generateArgs, iterations);
  const impl2Metrics = measurePerformance(impl2, generateArgs, iterations);
  
  return {
    name,
    impl1Metrics,
    impl2Metrics,
    diff: impl1Metrics.avgTime - impl2Metrics.avgTime,
  };
}

/**
 * Journey-specific array test utilities
 */
export const journeyArrayUtils = {
  /**
   * Health journey test utilities
   */
  health: {
    /**
     * Creates test health metrics array
     * 
     * @param count Number of metrics to generate
     * @returns Array of test health metrics
     */
    createHealthMetricsArray(count = 10): Record<string, any>[] {
      const metricTypes = ['HEART_RATE', 'STEPS', 'WEIGHT', 'BLOOD_PRESSURE', 'SLEEP'];
      const sources = ['MANUAL', 'DEVICE', 'INTEGRATION'];
      
      return Array.from({ length: count }, (_, index) => ({
        id: `metric-${index}`,
        userId: 'test-user-id',
        type: randomUtils.element(metricTypes),
        value: randomUtils.integer(50, 200),
        unit: getUnitForMetricType(randomUtils.element(metricTypes)),
        timestamp: new Date(Date.now() - randomUtils.integer(0, 30 * 24 * 60 * 60 * 1000)),
        source: randomUtils.element(sources),
        notes: randomUtils.boolean() ? `Test note ${index}` : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    },
    
    /**
     * Creates test health goals array
     * 
     * @param count Number of goals to generate
     * @returns Array of test health goals
     */
    createHealthGoalsArray(count = 5): Record<string, any>[] {
      const goalTypes = ['STEPS', 'WEIGHT', 'SLEEP', 'WATER', 'EXERCISE'];
      const frequencies = ['DAILY', 'WEEKLY', 'MONTHLY'];
      const statuses = ['ACTIVE', 'COMPLETED', 'ABANDONED'];
      
      return Array.from({ length: count }, (_, index) => {
        const type = randomUtils.element(goalTypes);
        return {
          id: `goal-${index}`,
          userId: 'test-user-id',
          type,
          target: getTargetForGoalType(type),
          unit: getUnitForGoalType(type),
          frequency: randomUtils.element(frequencies),
          startDate: new Date(Date.now() - randomUtils.integer(0, 30 * 24 * 60 * 60 * 1000)),
          endDate: new Date(Date.now() + randomUtils.integer(0, 60 * 24 * 60 * 60 * 1000)),
          progress: randomUtils.integer(0, 100),
          status: randomUtils.element(statuses),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });
    },
  },
  
  /**
   * Care journey test utilities
   */
  care: {
    /**
     * Creates test appointments array
     * 
     * @param count Number of appointments to generate
     * @returns Array of test appointments
     */
    createAppointmentsArray(count = 8): Record<string, any>[] {
      const appointmentTypes = ['CONSULTATION', 'FOLLOW_UP', 'EXAMINATION', 'PROCEDURE'];
      const statuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'];
      const locations = ['VIRTUAL', 'CLINIC', 'HOSPITAL', 'HOME'];
      
      return Array.from({ length: count }, (_, index) => {
        const startTime = new Date(Date.now() + randomUtils.integer(-30, 30) * 24 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes later
        
        return {
          id: `appointment-${index}`,
          userId: 'test-user-id',
          providerId: `provider-${randomUtils.integer(1, 5)}`,
          type: randomUtils.element(appointmentTypes),
          status: randomUtils.element(statuses),
          startTime,
          endTime,
          notes: randomUtils.boolean() ? `Appointment notes ${index}` : undefined,
          location: randomUtils.element(locations),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });
    },
    
    /**
     * Creates test providers array
     * 
     * @param count Number of providers to generate
     * @returns Array of test providers
     */
    createProvidersArray(count = 5): Record<string, any>[] {
      const specialties = ['GENERAL', 'CARDIOLOGY', 'DERMATOLOGY', 'ORTHOPEDICS', 'PEDIATRICS'];
      
      return Array.from({ length: count }, (_, index) => ({
        id: `provider-${index + 1}`,
        name: `Dr. ${randomUtils.string(8)}`,
        specialty: randomUtils.element(specialties),
        rating: randomUtils.integer(1, 5),
        available: randomUtils.boolean(),
        location: `Location ${index + 1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    },
  },
  
  /**
   * Plan journey test utilities
   */
  plan: {
    /**
     * Creates test insurance claims array
     * 
     * @param count Number of claims to generate
     * @returns Array of test insurance claims
     */
    createInsuranceClaimsArray(count = 7): Record<string, any>[] {
      const claimTypes = ['MEDICAL', 'DENTAL', 'VISION', 'PHARMACY', 'EMERGENCY'];
      const statuses = ['SUBMITTED', 'PROCESSING', 'APPROVED', 'REJECTED', 'PENDING_INFO'];
      
      return Array.from({ length: count }, (_, index) => ({
        id: `claim-${index}`,
        userId: 'test-user-id',
        planId: `plan-${randomUtils.integer(1, 3)}`,
        type: randomUtils.element(claimTypes),
        status: randomUtils.element(statuses),
        amount: randomUtils.integer(100, 5000),
        serviceDate: new Date(Date.now() - randomUtils.integer(0, 90) * 24 * 60 * 60 * 1000),
        submissionDate: new Date(Date.now() - randomUtils.integer(0, 30) * 24 * 60 * 60 * 1000),
        description: `Claim description ${index}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    },
    
    /**
     * Creates test benefits array
     * 
     * @param count Number of benefits to generate
     * @returns Array of test benefits
     */
    createBenefitsArray(count = 6): Record<string, any>[] {
      const benefitTypes = ['MEDICAL', 'DENTAL', 'VISION', 'WELLNESS', 'PHARMACY'];
      
      return Array.from({ length: count }, (_, index) => ({
        id: `benefit-${index}`,
        planId: `plan-${randomUtils.integer(1, 3)}`,
        name: `Benefit ${index}`,
        type: randomUtils.element(benefitTypes),
        description: `Description for benefit ${index}`,
        coverage: randomUtils.integer(50, 100),
        limit: randomUtils.integer(1000, 10000),
        used: randomUtils.integer(0, 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    },
  },
  
  /**
   * Gamification journey test utilities
   */
  gamification: {
    /**
     * Creates test achievements array
     * 
     * @param count Number of achievements to generate
     * @returns Array of test achievements
     */
    createAchievementsArray(count = 10): Record<string, any>[] {
      const categories = ['HEALTH', 'CARE', 'PLAN', 'ENGAGEMENT'];
      const difficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
      
      return Array.from({ length: count }, (_, index) => ({
        id: `achievement-${index}`,
        name: `Achievement ${index}`,
        description: `Description for achievement ${index}`,
        category: randomUtils.element(categories),
        difficulty: randomUtils.element(difficulties),
        points: randomUtils.integer(10, 100),
        icon: `icon-${index}`,
        unlockedAt: randomUtils.boolean() ? new Date(Date.now() - randomUtils.integer(0, 60) * 24 * 60 * 60 * 1000) : null,
        progress: randomUtils.integer(0, 100),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    },
    
    /**
     * Creates test events array for gamification
     * 
     * @param count Number of events to generate
     * @returns Array of test events
     */
    createEventsArray(count = 15): Record<string, any>[] {
      const eventTypes = [
        'HEALTH_METRIC_RECORDED',
        'HEALTH_GOAL_COMPLETED',
        'APPOINTMENT_SCHEDULED',
        'APPOINTMENT_COMPLETED',
        'CLAIM_SUBMITTED',
        'BENEFIT_USED',
        'PROFILE_UPDATED',
        'APP_OPENED',
      ];
      
      return Array.from({ length: count }, (_, index) => ({
        id: `event-${index}`,
        userId: 'test-user-id',
        type: randomUtils.element(eventTypes),
        timestamp: new Date(Date.now() - randomUtils.integer(0, 30) * 24 * 60 * 60 * 1000),
        payload: {
          data: `Event data ${index}`,
          value: randomUtils.integer(1, 100),
        },
        processed: randomUtils.boolean(),
        createdAt: new Date(),
      }));
    },
  },
};

/**
 * Helper function to get unit for a metric type
 */
function getUnitForMetricType(type: string): string {
  switch (type) {
    case 'HEART_RATE':
      return 'bpm';
    case 'STEPS':
      return 'steps';
    case 'WEIGHT':
      return 'kg';
    case 'BLOOD_PRESSURE':
      return 'mmHg';
    case 'SLEEP':
      return 'hours';
    default:
      return 'units';
  }
}

/**
 * Helper function to get unit for a goal type
 */
function getUnitForGoalType(type: string): string {
  switch (type) {
    case 'STEPS':
      return 'steps';
    case 'WEIGHT':
      return 'kg';
    case 'SLEEP':
      return 'hours';
    case 'WATER':
      return 'ml';
    case 'EXERCISE':
      return 'minutes';
    default:
      return 'units';
  }
}

/**
 * Helper function to get target for a goal type
 */
function getTargetForGoalType(type: string): number {
  switch (type) {
    case 'STEPS':
      return 10000;
    case 'WEIGHT':
      return 70;
    case 'SLEEP':
      return 8;
    case 'WATER':
      return 2000;
    case 'EXERCISE':
      return 30;
    default:
      return 100;
  }
}

// Export all utilities
export default {
  generateTestArray,
  generateNestedArray,
  generateObjectArray,
  generateArrayWithDuplicates,
  shuffleArray,
  createTransformTestArray,
  transformExpectedResults,
  createFilterTestArray,
  filterExpectedResults,
  createGroupTestArray,
  groupExpectedResults,
  createChunkTestArray,
  chunkExpectedResults,
  verifyEdgeCaseHandling,
  commonEdgeCases,
  measurePerformance,
  compareImplementations,
  journeyArrayUtils,
};