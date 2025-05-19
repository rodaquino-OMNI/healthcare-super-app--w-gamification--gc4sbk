/**
 * Test helpers for object utilities
 * 
 * This module provides test helper functions for object utilities, including deep object generators,
 * comparison utilities for test assertions, and specialized helpers for testing object transformations,
 * merging, and cloning operations.
 */

/**
 * Configuration options for generating test objects
 */
export interface GenerateObjectOptions {
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
  /** Include circular references in generated objects */
  includeCircular?: boolean;
  /** Custom property name prefix */
  propertyPrefix?: string;
}

/**
 * Default options for generating test objects
 */
const DEFAULT_GENERATE_OPTIONS: GenerateObjectOptions = {
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
 * Generates a deep test object with configurable structure
 * 
 * @param options Configuration options for the generated object
 * @returns A deeply nested object for testing
 * 
 * @example
 * // Generate a simple test object
 * const testObj = generateTestObject();
 * 
 * // Generate a complex object with specific options
 * const complexObj = generateTestObject({
 *   maxDepth: 5,
 *   maxProperties: 10,
 *   includeArrays: true,
 *   includeDates: true
 * });
 */
export function generateTestObject(options: GenerateObjectOptions = {}): Record<string, any> {
  const config = { ...DEFAULT_GENERATE_OPTIONS, ...options };
  const result: Record<string, any> = {};
  
  // For circular reference support
  if (config.includeCircular && !options.hasOwnProperty('_parent')) {
    (options as any)._parent = result;
  }
  
  return generateObjectLevel(result, config, 0, options as any);
}

/**
 * Internal helper to generate a level of the test object
 */
function generateObjectLevel(
  obj: Record<string, any>,
  config: GenerateObjectOptions,
  currentDepth: number,
  options: any
): Record<string, any> {
  const propertyCount = Math.floor(Math.random() * (config.maxProperties || 5)) + 1;
  
  for (let i = 0; i < propertyCount; i++) {
    const propName = `${config.propertyPrefix || 'prop'}${i}`;
    
    // Decide what type of value to generate
    const valueType = getRandomValueType(config, currentDepth);
    
    switch (valueType) {
      case 'object':
        if (currentDepth < (config.maxDepth || 3)) {
          obj[propName] = {};
          generateObjectLevel(obj[propName], config, currentDepth + 1, options);
        } else {
          obj[propName] = `leaf-value-${i}`;
        }
        break;
      case 'array':
        const arrayLength = Math.floor(Math.random() * 5) + 1;
        obj[propName] = [];
        for (let j = 0; j < arrayLength; j++) {
          if (currentDepth < (config.maxDepth || 3) - 1) {
            const arrayObj = {};
            generateObjectLevel(arrayObj, config, currentDepth + 1, options);
            obj[propName].push(arrayObj);
          } else {
            obj[propName].push(`array-item-${j}`);
          }
        }
        break;
      case 'string':
        obj[propName] = `value-${i}-depth-${currentDepth}`;
        break;
      case 'number':
        obj[propName] = i * 10 + currentDepth;
        break;
      case 'boolean':
        obj[propName] = i % 2 === 0;
        break;
      case 'date':
        obj[propName] = new Date(2023, i, i + 1);
        break;
      case 'null':
        obj[propName] = null;
        break;
      case 'undefined':
        obj[propName] = undefined;
        break;
      case 'circular':
        obj[propName] = options._parent;
        break;
    }
  }
  
  return obj;
}

/**
 * Helper to randomly select a value type based on configuration
 */
function getRandomValueType(config: GenerateObjectOptions, currentDepth: number): string {
  const types: string[] = ['string', 'number', 'boolean', 'object'];
  
  if (config.includeArrays) {
    types.push('array');
  }
  
  if (config.includeNulls) {
    types.push('null');
  }
  
  if (config.includeUndefined) {
    types.push('undefined');
  }
  
  if (config.includeDates) {
    types.push('date');
  }
  
  if (config.includeCircular && currentDepth > 0) {
    types.push('circular');
  }
  
  // Bias toward objects and arrays at lower depths to ensure nesting
  if (currentDepth < (config.maxDepth || 3) - 1) {
    types.push('object', 'object');
    if (config.includeArrays) {
      types.push('array');
    }
  }
  
  const randomIndex = Math.floor(Math.random() * types.length);
  return types[randomIndex];
}

/**
 * Generates a pair of objects with specific differences for testing comparison functions
 * 
 * @param numDifferences Number of differences to introduce
 * @param options Configuration options for the generated objects
 * @returns A tuple containing two objects and a map of their differences
 * 
 * @example
 * // Generate two objects with 3 differences
 * const [objA, objB, differences] = generateObjectsWithDifferences(3);
 * 
 * // Test comparison function
 * expect(getDifferences(objA, objB)).toEqual(differences);
 */
export function generateObjectsWithDifferences(
  numDifferences: number = 3,
  options: GenerateObjectOptions = {}
): [Record<string, any>, Record<string, any>, Record<string, [any, any]>] {
  const baseObject = generateTestObject(options);
  const modifiedObject = JSON.parse(JSON.stringify(baseObject)); // Deep clone
  const differences: Record<string, [any, any]> = {};
  
  // Helper to get all paths in an object
  const getAllPaths = (obj: any, currentPath: string = ''): string[] => {
    let paths: string[] = [];
    
    for (const key in obj) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      
      if (obj[key] !== null && typeof obj[key] === 'object' && !(obj[key] instanceof Date)) {
        paths = paths.concat(getAllPaths(obj[key], newPath));
      } else {
        paths.push(newPath);
      }
    }
    
    return paths;
  };
  
  // Helper to set a value at a path
  const setValueAtPath = (obj: any, path: string, value: any): void => {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
  };
  
  // Helper to get a value at a path
  const getValueAtPath = (obj: any, path: string): any => {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length; i++) {
      current = current[parts[i]];
    }
    
    return current;
  };
  
  // Get all possible paths
  const allPaths = getAllPaths(baseObject);
  
  // Randomly select paths to modify
  const pathsToModify = [];
  const actualDifferences = Math.min(numDifferences, allPaths.length);
  
  for (let i = 0; i < actualDifferences; i++) {
    const randomIndex = Math.floor(Math.random() * allPaths.length);
    pathsToModify.push(allPaths[randomIndex]);
    allPaths.splice(randomIndex, 1); // Remove to avoid duplicates
  }
  
  // Modify the selected paths
  for (const path of pathsToModify) {
    const originalValue = getValueAtPath(baseObject, path);
    let newValue: any;
    
    // Generate a different value based on the type
    if (originalValue === null) {
      newValue = 'modified-null';
    } else if (originalValue === undefined) {
      newValue = 'modified-undefined';
    } else if (originalValue instanceof Date) {
      newValue = new Date(originalValue.getTime() + 86400000); // Add a day
    } else {
      switch (typeof originalValue) {
        case 'string':
          newValue = `modified-${originalValue}`;
          break;
        case 'number':
          newValue = originalValue + 100;
          break;
        case 'boolean':
          newValue = !originalValue;
          break;
        default:
          newValue = 'modified-value';
      }
    }
    
    setValueAtPath(modifiedObject, path, newValue);
    differences[path] = [originalValue, newValue];
  }
  
  return [baseObject, modifiedObject, differences];
}

/**
 * Creates a test object with a circular reference
 * 
 * @returns An object with a circular reference
 * 
 * @example
 * const circularObj = createCircularObject();
 * // Test circular reference handling
 * expect(() => JSON.stringify(circularObj)).toThrow();
 */
export function createCircularObject(): Record<string, any> {
  const obj: Record<string, any> = {
    a: 1,
    b: 'test',
    c: { d: true }
  };
  
  obj.circular = obj;
  obj.c.parent = obj;
  
  return obj;
}

/**
 * Creates a test object with specific properties for transformation testing
 * 
 * @param properties Array of property names to include
 * @returns An object with the specified properties
 * 
 * @example
 * // Create an object with specific properties
 * const testObj = createObjectWithProperties(['id', 'name', 'email']);
 * 
 * // Test pick function
 * expect(pick(testObj, ['id', 'name'])).toEqual({ id: 1, name: 'Test' });
 */
export function createObjectWithProperties(properties: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  properties.forEach((prop, index) => {
    // Generate different value types based on property name patterns
    if (prop.includes('id')) {
      result[prop] = index + 1;
    } else if (prop.includes('name')) {
      result[prop] = `Test ${prop}`;
    } else if (prop.includes('email')) {
      result[prop] = `test${index}@example.com`;
    } else if (prop.includes('date')) {
      result[prop] = new Date(2023, index, index + 1);
    } else if (prop.includes('enabled') || prop.includes('active')) {
      result[prop] = index % 2 === 0;
    } else if (prop.includes('count') || prop.includes('amount')) {
      result[prop] = index * 10;
    } else if (prop.includes('items') || prop.includes('list')) {
      result[prop] = Array.from({ length: index + 1 }, (_, i) => `Item ${i}`);
    } else if (prop.includes('config') || prop.includes('settings')) {
      result[prop] = {
        enabled: true,
        value: index,
        name: `Config ${index}`
      };
    } else {
      result[prop] = `Value for ${prop}`;
    }
  });
  
  return result;
}

/**
 * Creates a pair of objects for testing merge operations
 * 
 * @returns A tuple with two objects that can be merged
 * 
 * @example
 * const [objA, objB] = createMergeTestObjects();
 * 
 * // Test merge function
 * const merged = deepMerge(objA, objB);
 * expect(merged.nested.value).toBe(objB.nested.value);
 */
export function createMergeTestObjects(): [Record<string, any>, Record<string, any>] {
  const objA = {
    id: 1,
    name: 'Original',
    tags: ['a', 'b', 'c'],
    active: true,
    nested: {
      id: 100,
      value: 'original value',
      items: [1, 2, 3]
    },
    nullValue: null,
    undefinedValue: undefined
  };
  
  const objB = {
    name: 'Updated',
    tags: ['d', 'e'],
    count: 42,
    nested: {
      value: 'updated value',
      extra: true,
      items: [4, 5]
    },
    nullValue: 'not null anymore',
    extraNested: {
      new: true
    }
  };
  
  return [objA, objB];
}

/**
 * Creates a complex object for testing deep cloning operations
 * 
 * @returns A complex object with various property types
 * 
 * @example
 * const original = createCloneTestObject();
 * const cloned = deepClone(original);
 * 
 * // Test that it's a deep clone
 * expect(cloned).toEqual(original);
 * expect(cloned.nested).not.toBe(original.nested);
 */
export function createCloneTestObject(): Record<string, any> {
  const obj = {
    id: 1,
    name: 'Clone Test',
    created: new Date(),
    tags: ['test', 'clone', 'deep'],
    active: true,
    counts: {
      views: 100,
      likes: 42
    },
    nested: {
      id: 2,
      data: {
        value: 'nested value',
        items: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]
      }
    },
    fn: function() { return 'test'; },
    nullValue: null,
    undefinedValue: undefined
  };
  
  return obj;
}

/**
 * Creates a test object with specific property paths for testing path-based operations
 * 
 * @returns An object with nested properties at specific paths
 * 
 * @example
 * const obj = createPathTestObject();
 * 
 * // Test path-based operations
 * expect(obj.user.profile.name).toBe('Test User');
 */
export function createPathTestObject(): Record<string, any> {
  return {
    user: {
      id: 1,
      profile: {
        name: 'Test User',
        email: 'test@example.com'
      },
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      }
    },
    posts: [
      {
        id: 1,
        title: 'First Post',
        comments: [
          { id: 1, text: 'Comment 1' },
          { id: 2, text: 'Comment 2' }
        ]
      },
      {
        id: 2,
        title: 'Second Post',
        comments: []
      }
    ],
    settings: {
      global: {
        enabled: true,
        timeout: 30
      },
      feature: {
        newUI: true,
        beta: {
          enabled: false
        }
      }
    }
  };
}

/**
 * Creates a test object with mixed property types for testing type-specific operations
 * 
 * @returns An object with various property types
 * 
 * @example
 * const obj = createMixedTypeObject();
 * 
 * // Test type-specific operations
 * expect(typeof obj.number).toBe('number');
 * expect(Array.isArray(obj.array)).toBe(true);
 */
export function createMixedTypeObject(): Record<string, any> {
  return {
    string: 'test string',
    number: 42,
    boolean: true,
    date: new Date(2023, 0, 1),
    array: [1, 'two', { three: 3 }],
    object: { a: 1, b: 2 },
    null: null,
    undefined: undefined,
    fn: function() { return 'function'; },
    regexp: /test/,
    symbol: Symbol('test'),
    map: new Map([['key', 'value']]),
    set: new Set([1, 2, 3])
  };
}

/**
 * Creates a test object with specific keys for testing key filtering operations
 * 
 * @param includePrivate Whether to include private keys (prefixed with _)
 * @returns An object with various key types
 * 
 * @example
 * const obj = createKeyFilterObject(true);
 * 
 * // Test key filtering
 * expect(Object.keys(filterKeys(obj, key => !key.startsWith('_')))).not.toContain('_private');
 */
export function createKeyFilterObject(includePrivate: boolean = true): Record<string, any> {
  const obj: Record<string, any> = {
    id: 1,
    name: 'Test Object',
    camelCase: 'camelCase',
    snake_case: 'snake_case',
    'kebab-case': 'kebab-case',
    'with space': 'with space',
    '123numeric': 'numeric',
    '$special': 'special'
  };
  
  if (includePrivate) {
    obj._private = 'private';
    obj._id = 'internal id';
    obj._meta = { internal: true };
  }
  
  return obj;
}

/**
 * Creates a test object with specific value types for testing value mapping operations
 * 
 * @returns An object with various value types
 * 
 * @example
 * const obj = createValueMapObject();
 * 
 * // Test value mapping
 * const uppercased = mapValues(obj, value => 
 *   typeof value === 'string' ? value.toUpperCase() : value
 * );
 * expect(uppercased.name).toBe('TEST');
 */
export function createValueMapObject(): Record<string, any> {
  return {
    id: 1,
    name: 'test',
    active: true,
    count: 42,
    created: new Date(2023, 0, 1),
    tags: ['a', 'b', 'c'],
    nested: {
      id: 2,
      value: 'nested'
    },
    nullValue: null,
    undefinedValue: undefined
  };
}

/**
 * Creates a test object with specific properties for testing pick/omit operations
 * 
 * @returns An object with various properties
 * 
 * @example
 * const obj = createPickOmitObject();
 * 
 * // Test pick operation
 * expect(Object.keys(pick(obj, ['id', 'name']))).toEqual(['id', 'name']);
 * 
 * // Test omit operation
 * expect(Object.keys(omit(obj, ['meta', 'internal']))).not.toContain('meta');
 */
export function createPickOmitObject(): Record<string, any> {
  return {
    id: 1,
    name: 'Test Object',
    description: 'A test object for pick/omit operations',
    created: new Date(),
    updated: new Date(),
    meta: {
      version: 1,
      author: 'Test User'
    },
    internal: {
      processed: true,
      hash: 'abc123'
    },
    tags: ['test', 'object', 'utils']
  };
}