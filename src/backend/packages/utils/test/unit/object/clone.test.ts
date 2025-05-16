import { deepClone, safeStructuredClone, shallowClone, cloneWithDepth } from '../../../src/object/clone';

describe('Object Clone Utilities', () => {
  describe('deepClone', () => {
    it('should correctly clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('test')).toBe('test');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
      const sym = Symbol('test');
      expect(deepClone(sym)).toBe(sym);
    });

    it('should create a deep copy of simple objects', () => {
      const original = { a: 1, b: 'string', c: true };
      const clone = deepClone(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original); // Different reference

      // Modifying the clone should not affect the original
      clone.a = 2;
      expect(original.a).toBe(1);
    });

    it('should create a deep copy of nested objects', () => {
      const original = {
        user: {
          name: 'John',
          profile: {
            age: 30,
            address: {
              city: 'New York',
              zip: '10001'
            }
          }
        }
      };
      const clone = deepClone(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone.user).not.toBe(original.user);
      expect(clone.user.profile).not.toBe(original.user.profile);
      expect(clone.user.profile.address).not.toBe(original.user.profile.address);

      // Modifying deeply nested properties should not affect the original
      clone.user.profile.address.city = 'Boston';
      expect(original.user.profile.address.city).toBe('New York');
    });

    it('should create a deep copy of arrays', () => {
      const original = [1, 2, [3, 4, [5, 6]]];
      const clone = deepClone(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone[2]).not.toBe(original[2]);
      expect(clone[2][2]).not.toBe(original[2][2]);

      // Modifying the clone should not affect the original
      clone[2][2][0] = 99;
      expect(original[2][2][0]).toBe(5);
    });

    it('should handle arrays of objects correctly', () => {
      const original = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2', tags: ['tag1', 'tag2'] }
      ];
      const clone = deepClone(original);

      expect(clone).toEqual(original);
      expect(clone[0]).not.toBe(original[0]);
      expect(clone[1]).not.toBe(original[1]);
      expect(clone[1].tags).not.toBe(original[1].tags);

      // Modifying the clone should not affect the original
      clone[1].name = 'Modified';
      clone[1].tags.push('tag3');
      expect(original[1].name).toBe('Item 2');
      expect(original[1].tags).toEqual(['tag1', 'tag2']);
    });

    it('should correctly clone Date objects', () => {
      const original = new Date('2023-01-01');
      const clone = deepClone(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone instanceof Date).toBe(true);
      expect(clone.getTime()).toBe(original.getTime());

      // Modifying the clone should not affect the original
      clone.setFullYear(2024);
      expect(original.getFullYear()).toBe(2023);
    });

    it('should correctly clone RegExp objects', () => {
      const original = /test/gi;
      const clone = deepClone(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone instanceof RegExp).toBe(true);
      expect(clone.source).toBe(original.source);
      expect(clone.flags).toBe(original.flags);
    });

    it('should correctly clone Map objects', () => {
      const original = new Map<string | object, any>();
      original.set('key1', 'value1');
      original.set('key2', { nested: 'value2' });
      const nestedObj = { id: 'nested-key' };
      original.set(nestedObj, 'value3');

      const clone = deepClone(original);

      expect(clone).not.toBe(original);
      expect(clone instanceof Map).toBe(true);
      expect(clone.size).toBe(original.size);
      expect(clone.get('key1')).toBe('value1');
      expect(clone.get('key2')).toEqual({ nested: 'value2' });
      expect(clone.get('key2')).not.toBe(original.get('key2'));

      // Map keys that are objects should be cloned too
      const clonedKeys = Array.from(clone.keys());
      const originalKeys = Array.from(original.keys());
      // The object key should be a different reference but equal in value
      expect(clonedKeys[2]).not.toBe(originalKeys[2]);
      expect(clonedKeys[2]).toEqual(originalKeys[2]);

      // Modifying the clone should not affect the original
      clone.get('key2').nested = 'modified';
      expect(original.get('key2').nested).toBe('value2');
    });

    it('should correctly clone Set objects', () => {
      const original = new Set<any>();
      original.add('value1');
      original.add({ nested: 'value2' });
      original.add([1, 2, 3]);

      const clone = deepClone(original);

      expect(clone).not.toBe(original);
      expect(clone instanceof Set).toBe(true);
      expect(clone.size).toBe(original.size);
      
      const originalValues = Array.from(original.values());
      const clonedValues = Array.from(clone.values());
      
      expect(clonedValues[0]).toBe(originalValues[0]); // Primitive values are the same
      expect(clonedValues[1]).toEqual(originalValues[1]); // Objects are equal
      expect(clonedValues[1]).not.toBe(originalValues[1]); // But different references
      expect(clonedValues[2]).toEqual(originalValues[2]); // Arrays are equal
      expect(clonedValues[2]).not.toBe(originalValues[2]); // But different references

      // Modifying the clone should not affect the original
      (clonedValues[1] as any).nested = 'modified';
      expect((originalValues[1] as any).nested).toBe('value2');
    });

    it('should handle circular references', () => {
      const original: any = { a: 1 };
      original.self = original;
      original.nested = { parent: original };

      const clone = deepClone(original);

      expect(clone).not.toBe(original);
      expect(clone.a).toBe(1);
      expect(clone.self).toBe(clone); // Should point to itself, not original
      expect(clone.nested.parent).toBe(clone); // Should point to clone, not original

      // Modifying the clone should not affect the original
      clone.a = 2;
      expect(original.a).toBe(1);
    });

    it('should handle complex circular references in arrays', () => {
      const original: any[] = [1, 2, 3];
      original.push(original); // Array contains itself
      original.push({ array: original }); // Object refers to the array

      const clone = deepClone(original);

      expect(clone).not.toBe(original);
      expect(clone[0]).toBe(1);
      expect(clone[1]).toBe(2);
      expect(clone[2]).toBe(3);
      expect(clone[3]).toBe(clone); // Should point to itself, not original
      expect(clone[4].array).toBe(clone); // Should point to clone, not original

      // Modifying the clone should not affect the original
      clone[0] = 99;
      expect(original[0]).toBe(1);
    });

    it('should handle functions by reference', () => {
      const func = () => 'test';
      const original = { func };
      const clone = deepClone(original);

      expect(clone.func).toBe(func); // Functions are copied by reference
    });

    it('should handle class instances with appropriate constructors', () => {
      class TestClass {
        value: string;
        constructor(value: string) {
          this.value = value;
        }
      }

      const original = new TestClass('test');
      const clone = deepClone(original);

      expect(clone).not.toBe(original);
      expect(clone instanceof TestClass).toBe(true);
      expect(clone.value).toBe('test');

      // Modifying the clone should not affect the original
      clone.value = 'modified';
      expect(original.value).toBe('test');
    });
  });

  describe('safeStructuredClone', () => {
    const originalStructuredClone = global.structuredClone;

    afterEach(() => {
      // Restore the original structuredClone after each test
      if (originalStructuredClone) {
        global.structuredClone = originalStructuredClone;
      } else {
        delete (global as any).structuredClone;
      }
    });

    it('should use native structuredClone when available', () => {
      // Mock the native structuredClone
      const mockStructuredClone = jest.fn((x) => ({ ...x }));
      global.structuredClone = mockStructuredClone;

      const original = { a: 1, b: 2 };
      safeStructuredClone(original);

      expect(mockStructuredClone).toHaveBeenCalledWith(original);
    });

    it('should fall back to deepClone when native structuredClone throws', () => {
      // Mock the native structuredClone to throw an error
      global.structuredClone = jest.fn(() => {
        throw new Error('Unsupported type');
      });

      // Spy on console.warn
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const original = { a: 1, b: 2, func: () => {} }; // Functions can't be cloned with structuredClone
      const clone = safeStructuredClone(original);

      expect(global.structuredClone).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);

      warnSpy.mockRestore();
    });

    it('should fall back to deepClone when native structuredClone is not available', () => {
      // Remove the native structuredClone
      delete (global as any).structuredClone;

      const original = { a: 1, b: 2 };
      const clone = safeStructuredClone(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
    });

    it('should handle complex objects with the appropriate method', () => {
      // Mock the native structuredClone
      const mockStructuredClone = jest.fn((x) => {
        // Simple implementation for testing
        if (typeof x === 'object' && x !== null) {
          if (Array.isArray(x)) {
            return [...x];
          }
          return { ...x };
        }
        return x;
      });
      global.structuredClone = mockStructuredClone;

      const original = {
        simple: { a: 1 },
        array: [1, 2, { b: 3 }],
        date: new Date()
      };
      const clone = safeStructuredClone(original);

      expect(mockStructuredClone).toHaveBeenCalledWith(original);
      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
    });
  });

  describe('shallowClone', () => {
    it('should create a shallow copy of an object', () => {
      const nested = { b: 2 };
      const original = { a: 1, nested };
      const clone = shallowClone(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone.nested).toBe(original.nested); // Shallow copy, same reference

      // Modifying top-level properties should not affect the original
      clone.a = 99;
      expect(original.a).toBe(1);

      // But modifying nested objects will affect the original
      clone.nested.b = 99;
      expect(original.nested.b).toBe(99);
    });

    it('should create a shallow copy of an array', () => {
      const nested = { b: 2 };
      const original = [1, nested, [3, 4]];
      const clone = shallowClone(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone[1]).toBe(original[1]); // Shallow copy, same reference
      expect(clone[2]).toBe(original[2]); // Shallow copy, same reference

      // Modifying the array elements should not affect the original
      clone[0] = 99;
      expect(original[0]).toBe(1);

      // But modifying nested objects will affect the original
      (clone[1] as any).b = 99;
      expect((original[1] as any).b).toBe(99);

      // And modifying nested arrays will affect the original
      (clone[2] as any)[0] = 99;
      expect((original[2] as any)[0]).toBe(99);
    });

    it('should correctly handle Date objects', () => {
      const original = new Date('2023-01-01');
      const clone = shallowClone(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone instanceof Date).toBe(true);

      // Modifying the clone should not affect the original
      clone.setFullYear(2024);
      expect(original.getFullYear()).toBe(2023);
    });

    it('should correctly handle RegExp objects', () => {
      const original = /test/gi;
      const clone = shallowClone(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone instanceof RegExp).toBe(true);
      expect(clone.source).toBe(original.source);
      expect(clone.flags).toBe(original.flags);
    });

    it('should correctly handle Map objects with shallow copies', () => {
      const nestedObj = { value: 'test' };
      const original = new Map<string, any>();
      original.set('key1', 'value1');
      original.set('key2', nestedObj);

      const clone = shallowClone(original);

      expect(clone).not.toBe(original);
      expect(clone instanceof Map).toBe(true);
      expect(clone.size).toBe(original.size);
      expect(clone.get('key1')).toBe('value1');
      expect(clone.get('key2')).toBe(nestedObj); // Shallow copy, same reference

      // Modifying nested objects will affect the original
      clone.get('key2').value = 'modified';
      expect(original.get('key2').value).toBe('modified');
    });

    it('should correctly handle Set objects with shallow copies', () => {
      const nestedObj = { value: 'test' };
      const original = new Set<any>();
      original.add('value1');
      original.add(nestedObj);

      const clone = shallowClone(original);

      expect(clone).not.toBe(original);
      expect(clone instanceof Set).toBe(true);
      expect(clone.size).toBe(original.size);
      expect(clone.has('value1')).toBe(true);
      expect(clone.has(nestedObj)).toBe(true);

      // The object in the set is the same reference
      const originalObj = Array.from(original).find(item => typeof item === 'object');
      const clonedObj = Array.from(clone).find(item => typeof item === 'object');
      expect(clonedObj).toBe(originalObj);

      // Modifying the object will affect both sets
      (clonedObj as any).value = 'modified';
      expect((originalObj as any).value).toBe('modified');
    });

    it('should throw an error for non-object inputs', () => {
      expect(() => shallowClone(null as any)).toThrow('Input must be an object');
      expect(() => shallowClone(42 as any)).toThrow('Input must be an object');
      expect(() => shallowClone('string' as any)).toThrow('Input must be an object');
      expect(() => shallowClone(true as any)).toThrow('Input must be an object');
      expect(() => shallowClone(undefined as any)).toThrow('Input must be an object');
    });
  });

  describe('cloneWithDepth', () => {
    it('should create a deep copy when depth is Infinity', () => {
      const original = {
        user: {
          name: 'John',
          profile: {
            age: 30,
            address: {
              city: 'New York',
              zip: '10001'
            }
          }
        }
      };
      const clone = cloneWithDepth(original, Infinity);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone.user).not.toBe(original.user);
      expect(clone.user.profile).not.toBe(original.user.profile);
      expect(clone.user.profile.address).not.toBe(original.user.profile.address);

      // Modifying deeply nested properties should not affect the original
      clone.user.profile.address.city = 'Boston';
      expect(original.user.profile.address.city).toBe('New York');
    });

    it('should create a shallow copy when depth is 0', () => {
      const original = {
        user: {
          name: 'John',
          profile: {
            age: 30
          }
        }
      };
      const clone = cloneWithDepth(original, 0);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone.user).toBe(original.user); // Shallow copy, same reference

      // Modifying nested objects will affect the original
      clone.user.name = 'Jane';
      expect(original.user.name).toBe('Jane');
    });

    it('should clone to the specified depth', () => {
      const original = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep'
              }
            }
          }
        }
      };

      // Clone with depth 2
      const clone = cloneWithDepth(original, 2);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone.level1).not.toBe(original.level1);
      expect(clone.level1.level2).not.toBe(original.level1.level2);
      expect(clone.level1.level2.level3).toBe(original.level1.level2.level3); // Same reference at depth > 2

      // Modifying at depth <= 2 should not affect the original
      clone.level1.level2 = { newValue: 'changed' };
      expect(original.level1.level2).toEqual({ level3: { level4: { value: 'deep' } } });

      // Modifying at depth > 2 should affect the original
      clone.level1.level2 = original.level1.level2; // Restore for next test
      clone.level1.level2.level3.level4.value = 'modified';
      expect(original.level1.level2.level3.level4.value).toBe('modified');
    });

    it('should handle arrays with the specified depth', () => {
      const original = [
        1,
        [2, 3],
        [4, [5, 6]],
        [7, [8, [9, 10]]]
      ];

      // Clone with depth 2
      const clone = cloneWithDepth(original, 2);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone[1]).not.toBe(original[1]); // Depth 1
      expect(clone[2]).not.toBe(original[2]); // Depth 1
      expect(clone[2][1]).not.toBe(original[2][1]); // Depth 2
      expect(clone[3][1][1]).toBe(original[3][1][1]); // Depth > 2, same reference

      // Modifying at depth <= 2 should not affect the original
      (clone[2][1] as any)[0] = 99;
      expect(original[2][1][0]).toBe(5);

      // Modifying at depth > 2 should affect the original
      (clone[3][1][1] as any)[0] = 99;
      expect(original[3][1][1][0]).toBe(99);
    });

    it('should handle circular references with depth control', () => {
      const original: any = { a: 1 };
      original.self = original;
      original.nested = { parent: original, value: 'test' };

      // Clone with depth 1
      const clone = cloneWithDepth(original, 1);

      expect(clone).not.toBe(original);
      expect(clone.a).toBe(1);
      expect(clone.self).toBe(clone); // Should point to itself, not original
      expect(clone.nested).not.toBe(original.nested); // Depth 1, different reference
      expect(clone.nested.parent).toBe(clone); // Should point to clone, not original

      // Modifying at depth <= 1 should not affect the original
      clone.nested.value = 'modified';
      expect(original.nested.value).toBe('test');
    });

    it('should handle special types with depth control', () => {
      const date = new Date();
      const map = new Map<string, any>([['key', { nested: 'value' }]]);
      const set = new Set<any>([{ nested: 'value' }]);

      const original = { date, map, set };

      // Clone with depth 1
      const clone = cloneWithDepth(original, 1);

      expect(clone).not.toBe(original);
      expect(clone.date).not.toBe(original.date);
      expect(clone.date instanceof Date).toBe(true);
      expect(clone.map).not.toBe(original.map);
      expect(clone.map instanceof Map).toBe(true);
      expect(clone.set).not.toBe(original.set);
      expect(clone.set instanceof Set).toBe(true);

      // Map values beyond depth 1 should be the same reference
      const originalMapValue = original.map.get('key');
      const cloneMapValue = clone.map.get('key');
      expect(cloneMapValue).toBe(originalMapValue); // Same reference at depth > 1

      // Set values beyond depth 1 should be the same reference
      const originalSetValue = Array.from(original.set)[0];
      const cloneSetValue = Array.from(clone.set)[0];
      expect(cloneSetValue).toBe(originalSetValue); // Same reference at depth > 1
    });
  });

  describe('Performance Tests', () => {
    // Helper function to measure execution time
    const measureTime = (fn: () => void): number => {
      const start = performance.now();
      fn();
      return performance.now() - start;
    };

    // Create a large test object
    const createLargeObject = (depth: number, breadth: number): any => {
      if (depth <= 0) return 'leaf';

      const obj: any = {};
      for (let i = 0; i < breadth; i++) {
        obj[`prop${i}`] = createLargeObject(depth - 1, breadth);
      }
      return obj;
    };

    it('should compare performance of different cloning methods', () => {
      // Skip this test in CI environments or when running all tests
      if (process.env.CI || process.env.JEST_WORKER_ID) {
        return;
      }

      // Create a moderately sized test object (adjust depth/breadth as needed)
      const testObject = createLargeObject(4, 5);

      // Measure time for each method
      const deepCloneTime = measureTime(() => deepClone(testObject));
      const structuredCloneTime = measureTime(() => {
        if (typeof structuredClone === 'function') {
          structuredClone(testObject);
        } else {
          // Fallback if structuredClone is not available
          JSON.parse(JSON.stringify(testObject));
        }
      });
      const safeStructuredCloneTime = measureTime(() => safeStructuredClone(testObject));
      const shallowCloneTime = measureTime(() => shallowClone(testObject));
      const cloneWithDepthTime = measureTime(() => cloneWithDepth(testObject, 2));
      const jsonCloneTime = measureTime(() => JSON.parse(JSON.stringify(testObject)));

      // Log results (for informational purposes)
      console.log('Performance comparison (ms):', {
        deepClone: deepCloneTime,
        structuredClone: structuredCloneTime,
        safeStructuredClone: safeStructuredCloneTime,
        shallowClone: shallowCloneTime,
        cloneWithDepth: cloneWithDepthTime,
        jsonClone: jsonCloneTime
      });

      // We don't make assertions about specific times, as they vary by environment
      // Just verify that all methods completed successfully
      expect(true).toBe(true);
    });

    it('should handle large arrays efficiently', () => {
      // Skip this test in CI environments or when running all tests
      if (process.env.CI || process.env.JEST_WORKER_ID) {
        return;
      }

      // Create a large array with nested objects
      const largeArray = Array(1000).fill(0).map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        metadata: {
          created: new Date(),
          tags: [`tag${i % 10}`, `category${i % 5}`]
        }
      }));

      // Measure time for each method
      const deepCloneTime = measureTime(() => deepClone(largeArray));
      const safeStructuredCloneTime = measureTime(() => safeStructuredClone(largeArray));
      const cloneWithDepthTime = measureTime(() => cloneWithDepth(largeArray, 1)); // Shallow clone of array items

      // Log results (for informational purposes)
      console.log('Large array cloning performance (ms):', {
        deepClone: deepCloneTime,
        safeStructuredClone: safeStructuredCloneTime,
        cloneWithDepth: cloneWithDepthTime
      });

      // We don't make assertions about specific times, as they vary by environment
      // Just verify that all methods completed successfully
      expect(true).toBe(true);
    });
  });
});