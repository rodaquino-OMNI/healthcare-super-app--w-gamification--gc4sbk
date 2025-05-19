/**
 * Test helper functions for array utilities.
 * Provides mock data generators, comparison utilities, and specialized helpers
 * for testing array transformations, grouping, filtering, and chunking operations.
 */

// ===== MOCK DATA GENERATORS =====

/**
 * Generates an array of numbers with the specified size.
 * 
 * @param size - The size of the array to generate
 * @param start - The starting value (default: 1)
 * @param step - The increment between values (default: 1)
 * @returns An array of sequential numbers
 */
export const generateNumberArray = (size: number, start = 1, step = 1): number[] => {
  return Array.from({ length: size }, (_, i) => start + i * step);
};

/**
 * Generates an array of strings with the specified size.
 * 
 * @param size - The size of the array to generate
 * @param prefix - Prefix for each string (default: 'item')
 * @returns An array of strings
 */
export const generateStringArray = (size: number, prefix = 'item'): string[] => {
  return Array.from({ length: size }, (_, i) => `${prefix}_${i + 1}`);
};

/**
 * Generates an array of objects with the specified size and properties.
 * 
 * @param size - The size of the array to generate
 * @param keyPrefix - Prefix for the key property (default: 'key')
 * @param valuePrefix - Prefix for the value property (default: 'value')
 * @param includeProps - Additional properties to include in each object
 * @returns An array of objects with id, key, value, and optional additional properties
 */
export const generateObjectArray = <T extends Record<string, any> = Record<string, any>>(
  size: number,
  keyPrefix = 'key',
  valuePrefix = 'value',
  includeProps?: (index: number) => Partial<T>
): Array<{ id: number; key: string; value: string } & Partial<T>> => {
  return Array.from({ length: size }, (_, i) => ({
    id: i + 1,
    key: `${keyPrefix}_${i + 1}`,
    value: `${valuePrefix}_${i + 1}`,
    ...(includeProps ? includeProps(i) : {})
  }));
};

/**
 * Generates a nested array structure with configurable depth and branching.
 * 
 * @param depth - Maximum depth of nesting
 * @param branchingFactor - Number of sub-arrays at each level
 * @param leafValueFn - Function to generate leaf values
 * @returns A nested array structure
 */
export const generateNestedArray = (
  depth: number,
  branchingFactor = 2,
  leafValueFn: (path: number[]) => any = (path) => path.join('.')
): any[] => {
  const generateLevel = (currentDepth: number, path: number[] = []): any[] => {
    if (currentDepth >= depth) {
      return Array.from({ length: branchingFactor }, (_, i) => {
        const currentPath = [...path, i];
        return leafValueFn(currentPath);
      });
    }

    return Array.from({ length: branchingFactor }, (_, i) => {
      const currentPath = [...path, i];
      return generateLevel(currentDepth + 1, currentPath);
    });
  };

  return generateLevel(0);
};

/**
 * Generates an array of objects suitable for testing journey-specific entities.
 * 
 * @param size - The size of the array to generate
 * @param journeyType - The journey type ('health', 'care', 'plan', or 'gamification')
 * @returns An array of journey-specific objects
 */
export const generateJourneyEntities = (
  size: number,
  journeyType: 'health' | 'care' | 'plan' | 'gamification'
): any[] => {
  const baseProps = {
    id: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: '',
  };

  const journeyProps: Record<string, (i: number) => any> = {
    health: (i) => ({
      ...baseProps,
      id: i + 1,
      userId: `user_${Math.floor(i / 3) + 1}`,
      type: ['heart_rate', 'steps', 'weight', 'sleep'][i % 4],
      value: 50 + i * 2,
      unit: ['bpm', 'count', 'kg', 'hours'][i % 4],
      date: new Date(Date.now() - i * 86400000),
      source: ['manual', 'device', 'integration'][i % 3],
    }),
    care: (i) => ({
      ...baseProps,
      id: i + 1,
      userId: `user_${Math.floor(i / 2) + 1}`,
      providerId: `provider_${(i % 5) + 1}`,
      status: ['scheduled', 'completed', 'cancelled', 'pending'][i % 4],
      type: ['consultation', 'checkup', 'treatment', 'followup'][i % 4],
      date: new Date(Date.now() + (i % 2 === 0 ? -1 : 1) * i * 86400000),
      notes: i % 3 === 0 ? `Notes for appointment ${i + 1}` : undefined,
    }),
    plan: (i) => ({
      ...baseProps,
      id: i + 1,
      userId: `user_${Math.floor(i / 4) + 1}`,
      planId: `plan_${(i % 3) + 1}`,
      type: ['claim', 'benefit', 'coverage', 'document'][i % 4],
      status: ['active', 'pending', 'rejected', 'approved'][i % 4],
      amount: i % 2 === 0 ? i * 100 + 50 : undefined,
      submittedAt: i % 3 === 0 ? new Date(Date.now() - i * 43200000) : undefined,
    }),
    gamification: (i) => ({
      ...baseProps,
      id: i + 1,
      userId: `user_${Math.floor(i / 3) + 1}`,
      type: ['achievement', 'quest', 'reward', 'level'][i % 4],
      points: 10 * (i + 1),
      completedAt: i % 2 === 0 ? new Date(Date.now() - i * 3600000) : null,
      progress: i % 2 === 0 ? 100 : Math.min(100, i * 10),
      journeySource: ['health', 'care', 'plan'][i % 3],
    }),
  };

  return Array.from({ length: size }, (_, i) => journeyProps[journeyType](i));
};

// ===== ASSERTION UTILITIES =====

/**
 * Compares two arrays for deep equality, ignoring order.
 * 
 * @param actual - The actual array from the test
 * @param expected - The expected array
 * @param sortBy - Optional key or function to sort arrays before comparison
 * @returns Boolean indicating if arrays are equal
 */
export const areArraysEqualIgnoringOrder = <T>(
  actual: T[],
  expected: T[],
  sortBy?: keyof T | ((item: T) => any)
): boolean => {
  if (actual.length !== expected.length) {
    return false;
  }

  const sortFn = (a: T, b: T): number => {
    if (!sortBy) {
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      return aStr.localeCompare(bStr);
    }

    const aVal = typeof sortBy === 'function' ? sortBy(a) : a[sortBy];
    const bVal = typeof sortBy === 'function' ? sortBy(b) : b[sortBy];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal);
    }

    return (aVal as any) - (bVal as any);
  };

  const sortedActual = [...actual].sort(sortFn);
  const sortedExpected = [...expected].sort(sortFn);

  return JSON.stringify(sortedActual) === JSON.stringify(sortedExpected);
};

/**
 * Compares the structure of two arrays or objects for equality.
 * Only checks the shape and types, not the actual values.
 * 
 * @param actual - The actual value from the test
 * @param expected - The expected value
 * @returns Boolean indicating if structures are equal
 */
export const hasMatchingStructure = (actual: any, expected: any): boolean => {
  // Different types
  if (typeof actual !== typeof expected) {
    return false;
  }

  // Handle null
  if (actual === null && expected === null) {
    return true;
  }

  if (actual === null || expected === null) {
    return false;
  }

  // Handle arrays
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length === 0 && expected.length === 0) {
      return true;
    }

    if (actual.length === 0 || expected.length === 0) {
      return false;
    }

    // Check first item structure as sample
    return hasMatchingStructure(actual[0], expected[0]);
  }

  // Handle objects
  if (typeof actual === 'object' && typeof expected === 'object') {
    const actualKeys = Object.keys(actual).sort();
    const expectedKeys = Object.keys(expected).sort();

    if (actualKeys.length !== expectedKeys.length) {
      return false;
    }

    if (!actualKeys.every((key, i) => key === expectedKeys[i])) {
      return false;
    }

    // Check each property type
    return actualKeys.every(key => {
      const actualType = typeof actual[key];
      const expectedType = typeof expected[key];

      if (actualType !== expectedType) {
        return false;
      }

      if (actualType === 'object' && actual[key] !== null && expected[key] !== null) {
        return hasMatchingStructure(actual[key], expected[key]);
      }

      return true;
    });
  }

  // Primitive types
  return typeof actual === typeof expected;
};

/**
 * Verifies that an array contains elements matching the specified criteria.
 * 
 * @param array - The array to check
 * @param criteria - Object with property matchers
 * @returns Boolean indicating if the array contains matching elements
 */
export const arrayContainsMatching = <T extends Record<string, any>>(
  array: T[],
  criteria: Partial<T>
): boolean => {
  const criteriaEntries = Object.entries(criteria);
  
  return array.some(item => {
    return criteriaEntries.every(([key, value]) => {
      return item[key] === value;
    });
  });
};

// ===== TRANSFORM HELPERS =====

/**
 * Creates a test case for the flattenDeep function.
 * 
 * @param depth - Depth of nesting for the test array
 * @param branchingFactor - Number of elements at each level
 * @returns Object with input and expected output for testing flattenDeep
 */
export const createFlattenDeepTestCase = (depth: number, branchingFactor = 2): {
  input: any[];
  expected: any[];
} => {
  const input = generateNestedArray(depth, branchingFactor, path => path.join('.'));
  
  // Generate the expected flattened array
  const expected: string[] = [];
  const collectLeaves = (arr: any[], currentPath: number[] = []) => {
    arr.forEach((item, i) => {
      const path = [...currentPath, i];
      if (Array.isArray(item)) {
        collectLeaves(item, path);
      } else {
        expected.push(item);
      }
    });
  };
  
  collectLeaves(input);
  
  return { input, expected };
};

/**
 * Creates a test case for the mapByKey function.
 * 
 * @param size - Size of the test array
 * @param keyFn - Function to extract keys
 * @param valueFn - Optional function to transform values
 * @returns Object with input and expected output for testing mapByKey
 */
export const createMapByKeyTestCase = <T extends Record<string, any>, K extends string | number | symbol, V = T>(
  size: number,
  keyFn: (item: T) => K,
  valueFn?: (item: T) => V
): {
  input: T[];
  keyFn: (item: T) => K;
  valueFn?: (item: T) => V;
  expected: Record<string, any>;
} => {
  const input = generateObjectArray(size) as unknown as T[];
  
  const expected = input.reduce<Record<string, any>>((result, item) => {
    const key = keyFn(item);
    const value = valueFn ? valueFn(item) : item;
    result[key as string] = value;
    return result;
  }, {});
  
  return { input, keyFn, valueFn, expected };
};

/**
 * Creates a test case for the pluck function.
 * 
 * @param size - Size of the test array
 * @param property - Property to pluck
 * @returns Object with input and expected output for testing pluck
 */
export const createPluckTestCase = <T extends Record<string, any>, K extends keyof T>(
  size: number,
  property: K
): {
  input: T[];
  property: K;
  expected: Array<T[K]>;
} => {
  const input = generateObjectArray(size) as unknown as T[];
  const expected = input.map(item => item[property]);
  
  return { input, property, expected };
};

// ===== FILTER HELPERS =====

/**
 * Creates a test case for the uniqueBy function.
 * 
 * @param size - Base size of the test array
 * @param duplicateCount - Number of duplicate items to add
 * @param keyOrSelector - Key or function to determine uniqueness
 * @returns Object with input and expected output for testing uniqueBy
 */
export const createUniqueByTestCase = <T extends Record<string, any>, K = T>(
  size: number,
  duplicateCount: number,
  keyOrSelector?: keyof T | ((item: T) => K)
): {
  input: T[];
  keyOrSelector?: keyof T | ((item: T) => K);
  expected: T[];
} => {
  // Generate base array
  const baseArray = generateObjectArray(size) as unknown as T[];
  
  // Add duplicates
  const duplicates = baseArray
    .slice(0, Math.min(duplicateCount, size))
    .map(item => ({ ...item }));
  
  const input = [...baseArray, ...duplicates];
  
  // Generate expected result based on keyOrSelector
  let expected: T[];
  
  if (!keyOrSelector) {
    // When using direct comparison, all duplicated objects are considered unique
    // because they're different object references
    expected = input;
  } else if (typeof keyOrSelector === 'function') {
    // Use a Set to track seen keys
    const seen = new Set<string>();
    expected = input.filter(item => {
      const key = keyOrSelector(item);
      const keyString = typeof key === 'object' ? JSON.stringify(key) : String(key);
      if (seen.has(keyString)) {
        return false;
      }
      seen.add(keyString);
      return true;
    });
  } else {
    // Use a Set to track seen property values
    const seen = new Set<string>();
    expected = input.filter(item => {
      const value = item[keyOrSelector];
      const valueString = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (seen.has(valueString)) {
        return false;
      }
      seen.add(valueString);
      return true;
    });
  }
  
  return { input, keyOrSelector, expected };
};

/**
 * Creates a test case for the filterByProperties function.
 * 
 * @param size - Size of the test array
 * @param properties - Properties to filter by
 * @param matchAll - Whether all properties must match
 * @returns Object with input and expected output for testing filterByProperties
 */
export const createFilterByPropertiesTestCase = <T extends Record<string, any>>(
  size: number,
  properties: Record<string, any>,
  matchAll = true
): {
  input: T[];
  properties: Record<string, any>;
  matchAll: boolean;
  expected: T[];
} => {
  // Generate test array with varied properties
  const input = generateObjectArray(size, 'key', 'value', (i) => {
    const result: Record<string, any> = {
      type: ['type_A', 'type_B', 'type_C', 'type_D'][i % 4],
      status: ['active', 'inactive', 'pending', 'completed'][i % 4],
      priority: (i % 5) + 1,
      tags: [`tag_${i % 3}`, `tag_${(i + 1) % 3}`],
    };
    return result as any;
  }) as unknown as T[];
  
  // Filter manually to create expected result
  const expected = input.filter(item => {
    const propertyResults = Object.entries(properties).map(([key, matcher]) => {
      const value = item[key];
      
      // Handle property matcher objects
      if (matcher !== null && typeof matcher === 'object' && !Array.isArray(matcher)) {
        if (matcher.exact !== undefined) return value === matcher.exact;
        if (matcher.contains !== undefined && typeof value === 'string') return value.includes(matcher.contains);
        if (matcher.startsWith !== undefined && typeof value === 'string') return value.startsWith(matcher.startsWith);
        if (matcher.endsWith !== undefined && typeof value === 'string') return value.endsWith(matcher.endsWith);
        if (matcher.in !== undefined) return matcher.in.includes(value);
        if (matcher.notIn !== undefined) return !matcher.notIn.includes(value);
        if (matcher.gt !== undefined && typeof value === 'number') return value > matcher.gt;
        if (matcher.gte !== undefined && typeof value === 'number') return value >= matcher.gte;
        if (matcher.lt !== undefined && typeof value === 'number') return value < matcher.lt;
        if (matcher.lte !== undefined && typeof value === 'number') return value <= matcher.lte;
        if (matcher.between !== undefined && typeof value === 'number') {
          const [min, max] = matcher.between;
          return value >= min && value <= max;
        }
        if (matcher.exists !== undefined) {
          return matcher.exists ? value !== undefined && value !== null : value === undefined || value === null;
        }
        if (matcher.regex !== undefined && typeof value === 'string') {
          return matcher.regex.test(value);
        }
        return false;
      }
      
      // Simple equality check
      return value === matcher;
    });
    
    return matchAll 
      ? propertyResults.every(result => result) // AND logic
      : propertyResults.some(result => result); // OR logic
  });
  
  return { input, properties, matchAll, expected };
};

/**
 * Creates a test case for the differenceBy function.
 * 
 * @param firstSize - Size of the first array
 * @param secondSize - Size of the second array
 * @param overlapCount - Number of overlapping elements
 * @param keyOrSelector - Key or function for comparison
 * @returns Object with inputs and expected output for testing differenceBy
 */
export const createDifferenceByTestCase = <T extends Record<string, any>, K = T>(
  firstSize: number,
  secondSize: number,
  overlapCount: number,
  keyOrSelector?: keyof T | ((item: T) => K)
): {
  firstArray: T[];
  secondArray: T[];
  keyOrSelector?: keyof T | ((item: T) => K);
  expected: T[];
} => {
  // Generate first array
  const firstArray = generateObjectArray(firstSize) as unknown as T[];
  
  // Create second array with some overlap
  const overlapItems = firstArray.slice(0, Math.min(overlapCount, firstSize));
  const uniqueItems = generateObjectArray(
    Math.max(0, secondSize - overlapCount),
    'second_key',
    'second_value'
  ) as unknown as T[];
  
  const secondArray = [...overlapItems, ...uniqueItems];
  
  // Calculate expected difference
  let expected: T[];
  
  if (!keyOrSelector) {
    // Direct comparison
    expected = firstArray.filter(item => !secondArray.includes(item));
  } else if (typeof keyOrSelector === 'function') {
    // Function selector
    const secondKeys = new Set(
      secondArray.map(item => {
        const key = keyOrSelector(item);
        return typeof key === 'object' ? JSON.stringify(key) : String(key);
      })
    );
    
    expected = firstArray.filter(item => {
      const key = keyOrSelector(item);
      const keyString = typeof key === 'object' ? JSON.stringify(key) : String(key);
      return !secondKeys.has(keyString);
    });
  } else {
    // Property key
    const secondValues = new Set(
      secondArray.map(item => {
        const value = item[keyOrSelector];
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      })
    );
    
    expected = firstArray.filter(item => {
      const value = item[keyOrSelector];
      const valueString = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return !secondValues.has(valueString);
    });
  }
  
  return { firstArray, secondArray, keyOrSelector, expected };
};

// ===== GROUP HELPERS =====

/**
 * Creates a test case for the groupBy function.
 * 
 * @param size - Size of the test array
 * @param keyOrSelector - Key or function to group by
 * @returns Object with input and expected output for testing groupBy
 */
export const createGroupByTestCase = <T extends Record<string, any>, K extends PropertyKey>(
  size: number,
  keyOrSelector: keyof T | ((item: T) => K)
): {
  input: T[];
  keyOrSelector: keyof T | ((item: T) => K);
  expected: Record<string, T[]>;
} => {
  // Generate test array
  const input = generateObjectArray(size, 'key', 'value', (i) => {
    return {
      category: ['A', 'B', 'C'][i % 3],
      status: ['active', 'inactive'][i % 2],
      priority: (i % 3) + 1
    } as any;
  }) as unknown as T[];
  
  // Group manually to create expected result
  const expected: Record<string, T[]> = {};
  
  input.forEach(item => {
    const key = typeof keyOrSelector === 'function'
      ? keyOrSelector(item)
      : item[keyOrSelector];
    
    const keyString = String(key);
    
    if (!expected[keyString]) {
      expected[keyString] = [];
    }
    
    expected[keyString].push(item);
  });
  
  return { input, keyOrSelector, expected };
};

/**
 * Creates a test case for the partitionBy function.
 * 
 * @param size - Size of the test array
 * @param predicate - Function to test each element
 * @returns Object with input and expected output for testing partitionBy
 */
export const createPartitionByTestCase = <T extends Record<string, any>>(
  size: number,
  predicate: (item: T) => boolean
): {
  input: T[];
  predicate: (item: T) => boolean;
  expected: [T[], T[]];
} => {
  // Generate test array
  const input = generateObjectArray(size) as unknown as T[];
  
  // Partition manually
  const passing: T[] = [];
  const failing: T[] = [];
  
  input.forEach(item => {
    if (predicate(item)) {
      passing.push(item);
    } else {
      failing.push(item);
    }
  });
  
  return { input, predicate, expected: [passing, failing] };
};

/**
 * Creates a test case for the countBy function.
 * 
 * @param size - Size of the test array
 * @param keyOrSelector - Key or function to count by
 * @returns Object with input and expected output for testing countBy
 */
export const createCountByTestCase = <T extends Record<string, any>, K extends PropertyKey>(
  size: number,
  keyOrSelector: keyof T | ((item: T) => K)
): {
  input: T[];
  keyOrSelector: keyof T | ((item: T) => K);
  expected: Record<string, number>;
} => {
  // Generate test array with repeated values
  const input = generateObjectArray(size, 'key', 'value', (i) => {
    return {
      category: ['A', 'B', 'C'][i % 3],
      status: ['active', 'inactive'][i % 2],
      priority: (i % 3) + 1
    } as any;
  }) as unknown as T[];
  
  // Count manually
  const expected: Record<string, number> = {};
  
  input.forEach(item => {
    const key = typeof keyOrSelector === 'function'
      ? keyOrSelector(item)
      : item[keyOrSelector];
    
    const keyString = String(key);
    expected[keyString] = (expected[keyString] || 0) + 1;
  });
  
  return { input, keyOrSelector, expected };
};

// ===== CHUNK HELPERS =====

/**
 * Creates a test case for the chunk function.
 * 
 * @param size - Size of the test array
 * @param chunkSize - Size of each chunk
 * @returns Object with input and expected output for testing chunk
 */
export const createChunkTestCase = <T>(
  size: number,
  chunkSize: number
): {
  input: T[];
  size: number;
  expected: T[][];
} => {
  // Generate test array
  const input = generateNumberArray(size) as unknown as T[];
  
  // Create chunks manually
  const expected: T[][] = [];
  
  for (let i = 0; i < input.length; i += chunkSize) {
    expected.push(input.slice(i, i + chunkSize));
  }
  
  return { input, size: chunkSize, expected };
};

/**
 * Creates a test case for the chunkBySize function.
 * 
 * @param size - Size of the test array
 * @param numChunks - Number of chunks to create
 * @returns Object with input and expected output for testing chunkBySize
 */
export const createChunkBySizeTestCase = <T>(
  size: number,
  numChunks: number
): {
  input: T[];
  numChunks: number;
  expected: T[][];
} => {
  // Generate test array
  const input = generateNumberArray(size) as unknown as T[];
  
  // Calculate effective number of chunks
  const effectiveNumChunks = Math.min(numChunks, size);
  
  // Calculate chunk size
  const chunkSize = Math.ceil(size / effectiveNumChunks);
  
  // Create chunks manually
  const expected: T[][] = [];
  
  for (let i = 0; i < effectiveNumChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, size);
    expected.push(input.slice(start, end));
  }
  
  return { input, numChunks, expected };
};

/**
 * Creates a test case for the chunkByPredicate function.
 * 
 * @param size - Size of the test array
 * @param predicate - Function to determine grouping
 * @returns Object with input and expected output for testing chunkByPredicate
 */
export const createChunkByPredicateTestCase = <T>(
  size: number,
  predicate: (item: T) => boolean
): {
  input: T[];
  predicate: (item: T) => boolean;
  expected: T[][];
} => {
  // Generate test array
  const input = generateNumberArray(size) as unknown as T[];
  
  // Split into chunks based on predicate
  const trueChunk: T[] = [];
  const falseChunk: T[] = [];
  
  input.forEach(item => {
    if (predicate(item)) {
      trueChunk.push(item);
    } else {
      falseChunk.push(item);
    }
  });
  
  // Only include non-empty chunks in the expected result
  const expected: T[][] = [];
  if (falseChunk.length > 0) expected.push(falseChunk);
  if (trueChunk.length > 0) expected.push(trueChunk);
  
  return { input, predicate, expected };
};

/**
 * Creates a test case for the chunkByKey function.
 * 
 * @param size - Size of the test array
 * @param keySelector - Function to determine the grouping key
 * @returns Object with input and expected output for testing chunkByKey
 */
export const createChunkByKeyTestCase = <T extends Record<string, any>, K extends string | number | symbol>(
  size: number,
  keySelector: (item: T) => K
): {
  input: T[];
  keySelector: (item: T) => K;
  expected: T[][];
} => {
  // Generate test array
  const input = generateObjectArray(size, 'key', 'value', (i) => {
    return {
      category: ['A', 'B', 'C'][i % 3],
      status: ['active', 'inactive'][i % 2],
    } as any;
  }) as unknown as T[];
  
  // Group by key
  const groups = new Map<K, T[]>();
  
  input.forEach(item => {
    const key = keySelector(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  });
  
  const expected = Array.from(groups.values());
  
  return { input, keySelector, expected };
};

/**
 * Creates a test case for the chunkForParallel function.
 * 
 * @param size - Size of the test array
 * @param numChunks - Number of chunks to create
 * @param weightSelector - Function to determine item weight
 * @returns Object with input and expected output for testing chunkForParallel
 */
export const createChunkForParallelTestCase = <T extends Record<string, any>>(
  size: number,
  numChunks: number,
  weightSelector: (item: T) => number
): {
  input: T[];
  numChunks: number;
  weightSelector: (item: T) => number;
  expected: T[][];
} => {
  // Generate test array with weights
  const input = generateObjectArray(size, 'key', 'value', (i) => {
    return {
      weight: (i % 5) + 1, // Weights from 1 to 5
    } as any;
  }) as unknown as T[];
  
  // Calculate effective number of chunks
  const effectiveNumChunks = Math.min(numChunks, size);
  
  // Sort items by weight in descending order
  const weightedItems = [...input]
    .map((item, index) => ({ item, weight: weightSelector(item), index }))
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  
  // Initialize chunks
  const expected: T[][] = Array.from({ length: effectiveNumChunks }, () => []);
  const chunkWeights = Array(effectiveNumChunks).fill(0);
  
  // Distribute items using greedy approach
  for (const { item, weight } of weightedItems) {
    const minWeightIndex = chunkWeights.indexOf(Math.min(...chunkWeights));
    expected[minWeightIndex].push(item);
    chunkWeights[minWeightIndex] += weight;
  }
  
  return { input, numChunks, weightSelector, expected };
};