/**
 * Test helpers for object utilities
 * 
 * This module provides helper functions for testing object manipulation utilities,
 * including generators for test objects, comparison utilities, and specialized helpers
 * for testing transformations, merging, and cloning operations.
 */

/**
 * Configuration options for generating test objects
 */
export interface ObjectGeneratorOptions {
  /** Maximum depth of nested objects */
  maxDepth?: number;
  /** Maximum number of properties at each level */
  maxProperties?: number;
  /** Include arrays in generated objects */
  includeArrays?: boolean;
  /** Include null values in generated objects */
  includeNulls?: boolean;
  /** Include undefined values in generated objects */
  includeUndefined?: boolean;
  /** Include date objects in generated objects */
  includeDates?: boolean;
  /** Include circular references (careful with this!) */
  includeCircular?: boolean;
  /** Custom property name prefix */
  propertyPrefix?: string;
}

/**
 * Default options for generating test objects
 */
const DEFAULT_GENERATOR_OPTIONS: ObjectGeneratorOptions = {
  maxDepth: 3,
  maxProperties: 5,
  includeArrays: true,
  includeNulls: true,
  includeUndefined: true,
  includeDates: true,
  includeCircular: false,
  propertyPrefix: 'prop',
};

/**
 * Generates a test object with configurable complexity
 * 
 * @param options Configuration options for the generated object
 * @param currentDepth Current depth in the recursion (used internally)
 * @param objectsCreated Map of created objects for circular reference handling (used internally)
 * @returns A test object with the specified complexity
 */
export function generateTestObject(
  options: ObjectGeneratorOptions = {},
  currentDepth = 0,
  objectsCreated: Map<string, any> = new Map()
): Record<string, any> {
  const config = { ...DEFAULT_GENERATOR_OPTIONS, ...options };
  const result: Record<string, any> = {};
  
  // Generate a random number of properties (1 to maxProperties)
  const propertyCount = Math.floor(Math.random() * config.maxProperties!) + 1;
  
  for (let i = 0; i < propertyCount; i++) {
    const propertyName = `${config.propertyPrefix}${i}`;
    
    // Decide what type of value to generate
    const valueType = Math.floor(Math.random() * 6);
    
    switch (valueType) {
      case 0: // String
        result[propertyName] = `value-${i}-${Math.random().toString(36).substring(2, 7)}`;
        break;
      case 1: // Number
        result[propertyName] = Math.random() * 1000;
        break;
      case 2: // Boolean
        result[propertyName] = Math.random() > 0.5;
        break;
      case 3: // Nested object (if not at max depth)
        if (currentDepth < config.maxDepth!) {
          result[propertyName] = generateTestObject(
            options,
            currentDepth + 1,
            objectsCreated
          );
          
          // Store for potential circular reference
          if (config.includeCircular) {
            objectsCreated.set(propertyName, result[propertyName]);
          }
        } else {
          result[propertyName] = `leaf-value-${i}`;
        }
        break;
      case 4: // Array (if enabled)
        if (config.includeArrays) {
          const arrayLength = Math.floor(Math.random() * 5) + 1;
          result[propertyName] = Array.from({ length: arrayLength }, (_, index) => {
            if (currentDepth < config.maxDepth! && Math.random() > 0.7) {
              return generateTestObject(options, currentDepth + 1, objectsCreated);
            }
            return `array-item-${index}-${Math.random().toString(36).substring(2, 5)}`;
          });
        } else {
          result[propertyName] = `value-${i}-${Math.random().toString(36).substring(2, 7)}`;
        }
        break;
      case 5: // Special values (null, undefined, Date)
        const specialType = Math.floor(Math.random() * 3);
        if (specialType === 0 && config.includeNulls) {
          result[propertyName] = null;
        } else if (specialType === 1 && config.includeUndefined) {
          result[propertyName] = undefined;
        } else if (specialType === 2 && config.includeDates) {
          result[propertyName] = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
        } else {
          result[propertyName] = `value-${i}-${Math.random().toString(36).substring(2, 7)}`;
        }
        break;
    }
  }
  
  // Add circular reference if enabled and at the top level
  if (config.includeCircular && currentDepth === 0 && objectsCreated.size > 0) {
    const randomKey = Array.from(objectsCreated.keys())[0];
    result.circular = objectsCreated.get(randomKey);
  }
  
  return result;
}

/**
 * Generates a pair of objects with controlled differences for testing comparison utilities
 * 
 * @param differenceCount Number of differences to introduce
 * @param options Configuration options for the generated objects
 * @returns A tuple of [original, modified] objects with controlled differences
 */
export function generateObjectPairWithDifferences(
  differenceCount = 3,
  options: ObjectGeneratorOptions = {}
): [Record<string, any>, Record<string, any>] {
  const original = generateTestObject(options);
  const modified = JSON.parse(JSON.stringify(original)); // Deep clone
  
  // Get all paths in the object for potential modification
  const paths = getAllPaths(original);
  
  // Select random paths to modify
  const pathsToModify = selectRandomItems(paths, Math.min(differenceCount, paths.length));
  
  // Apply modifications
  for (const path of pathsToModify) {
    applyModificationAtPath(modified, path);
  }
  
  return [original, modified];
}

/**
 * Gets all possible paths in an object for testing
 * 
 * @param obj The object to analyze
 * @param currentPath Current path in the recursion (used internally)
 * @param result Array to collect paths (used internally)
 * @returns Array of all paths in dot notation
 */
export function getAllPaths(
  obj: Record<string, any>,
  currentPath = '',
  result: string[] = []
): string[] {
  if (!obj || typeof obj !== 'object') {
    return result;
  }
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      result.push(newPath);
      
      if (obj[key] && typeof obj[key] === 'object' && !(obj[key] instanceof Date)) {
        getAllPaths(obj[key], newPath, result);
      }
    }
  }
  
  return result;
}

/**
 * Selects random items from an array
 * 
 * @param items Array of items to select from
 * @param count Number of items to select
 * @returns Array of randomly selected items
 */
function selectRandomItems<T>(items: T[], count: number): T[] {
  const result: T[] = [];
  const itemsCopy = [...items];
  
  for (let i = 0; i < count; i++) {
    if (itemsCopy.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * itemsCopy.length);
    result.push(itemsCopy[randomIndex]);
    itemsCopy.splice(randomIndex, 1);
  }
  
  return result;
}

/**
 * Applies a modification at the specified path in an object
 * 
 * @param obj Object to modify
 * @param path Path to the property to modify (dot notation)
 */
function applyModificationAtPath(obj: Record<string, any>, path: string): void {
  const parts = path.split('.');
  let current = obj;
  
  // Navigate to the parent of the property to modify
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined) return;
    current = current[parts[i]];
  }
  
  const lastPart = parts[parts.length - 1];
  const currentValue = current[lastPart];
  
  // Apply a type-appropriate modification
  if (typeof currentValue === 'string') {
    current[lastPart] = currentValue + '-modified';
  } else if (typeof currentValue === 'number') {
    current[lastPart] = currentValue + 100;
  } else if (typeof currentValue === 'boolean') {
    current[lastPart] = !currentValue;
  } else if (currentValue instanceof Date) {
    current[lastPart] = new Date(currentValue.getTime() + 86400000); // Add a day
  } else if (currentValue === null) {
    current[lastPart] = 'was-null';
  } else if (currentValue === undefined) {
    current[lastPart] = 'was-undefined';
  } else if (Array.isArray(currentValue)) {
    if (currentValue.length > 0) {
      current[lastPart] = [...currentValue, 'new-item'];
    } else {
      current[lastPart] = ['added-to-empty'];
    }
  } else if (typeof currentValue === 'object') {
    current[lastPart] = { ...currentValue, newProperty: 'added' };
  }
}

/**
 * Creates a test object with a specific structure for transformation testing
 * 
 * @param propertyCount Number of properties to include
 * @returns A test object with numbered properties
 */
export function createStructuredTestObject(propertyCount = 10): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (let i = 0; i < propertyCount; i++) {
    result[`property${i}`] = `value${i}`;
  }
  
  return result;
}

/**
 * Creates a test object with nested properties for deep operations testing
 * 
 * @returns A test object with predefined nested structure
 */
export function createNestedTestObject(): Record<string, any> {
  return {
    level1: {
      a: 1,
      b: 'string',
      level2: {
        c: true,
        d: [1, 2, 3],
        level3: {
          e: new Date('2023-01-01'),
          f: null,
          g: undefined,
        }
      }
    },
    simpleArray: [1, 2, 3],
    objectArray: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ],
    nullValue: null,
    undefinedValue: undefined,
    dateValue: new Date('2023-06-15'),
  };
}

/**
 * Creates a test object with circular references for testing circular handling
 * 
 * @returns A test object with circular references
 */
export function createCircularTestObject(): Record<string, any> {
  const obj: Record<string, any> = {
    a: 1,
    b: 'string',
    c: true,
    nested: {
      d: 42,
      e: 'nested string',
    }
  };
  
  // Create circular reference
  obj.circular = obj;
  obj.nested.parent = obj;
  
  return obj;
}

/**
 * Verifies that a transformation function correctly handles all property types
 * 
 * @param transformFn The transformation function to test
 * @param options Configuration options for test objects
 * @returns A result object with success flag and details
 */
export function verifyTransformationHandling(
  transformFn: (obj: Record<string, any>) => Record<string, any>,
  options: ObjectGeneratorOptions = {}
): { success: boolean; original: Record<string, any>; transformed: Record<string, any>; error?: Error } {
  try {
    const testObject = generateTestObject(options);
    const transformed = transformFn(testObject);
    
    return {
      success: true,
      original: testObject,
      transformed,
    };
  } catch (error) {
    return {
      success: false,
      original: {},
      transformed: {},
      error: error as Error,
    };
  }
}

/**
 * Creates a pair of objects for testing merge operations
 * 
 * @returns A tuple of [target, source] objects for merge testing
 */
export function createMergeTestPair(): [Record<string, any>, Record<string, any>] {
  const target = {
    a: 1,
    b: 'string',
    nested: {
      c: true,
      d: [1, 2, 3],
    },
    array: [4, 5, 6],
    untouched: 'should remain',
  };
  
  const source = {
    a: 100, // Will override
    newProp: 'added',
    nested: {
      c: false, // Will override
      e: 'new nested prop', // Will add
    },
    array: [7, 8, 9], // Will replace or merge depending on merge strategy
  };
  
  return [target, source];
}

/**
 * Expected results for different merge strategies
 */
export const mergeExpectedResults = {
  replace: {
    a: 100,
    b: 'string',
    nested: {
      c: false,
      d: [1, 2, 3],
      e: 'new nested prop',
    },
    array: [7, 8, 9], // Replaced
    untouched: 'should remain',
    newProp: 'added',
  },
  combine: {
    a: 100,
    b: 'string',
    nested: {
      c: false,
      d: [1, 2, 3],
      e: 'new nested prop',
    },
    array: [4, 5, 6, 7, 8, 9], // Combined
    untouched: 'should remain',
    newProp: 'added',
  },
};

/**
 * Creates test objects with specific properties for testing pick/omit operations
 * 
 * @returns An object with properties for testing selection operations
 */
export function createSelectionTestObject(): Record<string, any> {
  return {
    id: 1,
    name: 'Test Object',
    description: 'For testing pick/omit operations',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    metadata: {
      version: '1.0.0',
      author: 'Test Author',
      tags: ['test', 'object', 'utils'],
    },
    status: 'active',
    isDeleted: false,
    score: 85,
    category: 'testing',
  };
}

/**
 * Expected results for different property selection operations
 */
export const selectionExpectedResults = {
  pick: {
    basic: {
      keys: ['id', 'name', 'status'],
      result: {
        id: 1,
        name: 'Test Object',
        status: 'active',
      },
    },
    withNested: {
      keys: ['id', 'metadata'],
      result: {
        id: 1,
        metadata: {
          version: '1.0.0',
          author: 'Test Author',
          tags: ['test', 'object', 'utils'],
        },
      },
    },
  },
  omit: {
    basic: {
      keys: ['description', 'metadata', 'isDeleted', 'score', 'category'],
      result: {
        id: 1,
        name: 'Test Object',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        status: 'active',
      },
    },
    withDates: {
      keys: ['createdAt', 'updatedAt'],
      result: {
        id: 1,
        name: 'Test Object',
        description: 'For testing pick/omit operations',
        metadata: {
          version: '1.0.0',
          author: 'Test Author',
          tags: ['test', 'object', 'utils'],
        },
        status: 'active',
        isDeleted: false,
        score: 85,
        category: 'testing',
      },
    },
  },
};

/**
 * Creates test objects for testing map operations
 * 
 * @returns An object for testing mapping operations
 */
export function createMapTestObject(): Record<string, any> {
  return {
    user: {
      firstName: 'john',
      lastName: 'doe',
      email: 'john.doe@example.com',
    },
    settings: {
      theme: 'dark',
      notifications: true,
      language: 'en',
    },
    stats: {
      visits: 42,
      lastLogin: '2023-06-15T10:30:00Z',
      accountAge: 365,
    },
  };
}

/**
 * Expected results for different mapping operations
 */
export const mappingExpectedResults = {
  capitalize: {
    user: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
    settings: {
      theme: 'Dark',
      notifications: true,
      language: 'En',
    },
    stats: {
      visits: 42,
      lastLogin: '2023-06-15T10:30:00Z',
      accountAge: 365,
    },
  },
  doubleNumbers: {
    user: {
      firstName: 'john',
      lastName: 'doe',
      email: 'john.doe@example.com',
    },
    settings: {
      theme: 'dark',
      notifications: true,
      language: 'en',
    },
    stats: {
      visits: 84,
      lastLogin: '2023-06-15T10:30:00Z',
      accountAge: 730,
    },
  },
};

/**
 * Creates a test object with specific properties for testing filtering operations
 * 
 * @returns An object for testing filtering operations
 */
export function createFilterTestObject(): Record<string, any> {
  return {
    id: 1,
    name: 'Test Object',
    description: '',
    tags: ['test', 'object', 'utils'],
    metadata: {
      version: '1.0.0',
      author: '',
      created: new Date('2023-01-01'),
      updated: null,
      isPublic: true,
      views: 0,
      rating: undefined,
    },
    status: 'active',
    price: 0,
    discount: null,
    notes: undefined,
  };
}

/**
 * Expected results for different filtering operations
 */
export const filteringExpectedResults = {
  removeEmpty: {
    id: 1,
    name: 'Test Object',
    tags: ['test', 'object', 'utils'],
    metadata: {
      version: '1.0.0',
      created: new Date('2023-01-01'),
      isPublic: true,
    },
    status: 'active',
  },
  keepNonZero: {
    id: 1,
    name: 'Test Object',
    description: '',
    tags: ['test', 'object', 'utils'],
    metadata: {
      version: '1.0.0',
      author: '',
      created: new Date('2023-01-01'),
      updated: null,
      isPublic: true,
      rating: undefined,
    },
    status: 'active',
    discount: null,
    notes: undefined,
  },
};