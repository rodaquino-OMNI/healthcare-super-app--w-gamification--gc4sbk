/**
 * Unit tests for object transformation utilities
 * Tests the pick, omit, mapValues, and filterKeys functions from src/object/transform.ts
 */

import { pick, omit, mapValues, filterKeys } from '../../../src/object/transform';

describe('Object Transformation Utilities', () => {
  describe('pick', () => {
    describe('basic functionality', () => {
      it('should select specified properties from an object', () => {
        const obj = { a: 1, b: 2, c: 3, d: 4 };
        const result = pick(obj, ['a', 'c']);
        
        expect(result).toEqual({ a: 1, c: 3 });
      });

      it('should handle picking a single property', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = pick(obj, ['b']);
        
        expect(result).toEqual({ b: 2 });
      });

      it('should handle picking all properties', () => {
        const obj = { a: 1, b: 2 };
        const result = pick(obj, ['a', 'b']);
        
        expect(result).toEqual({ a: 1, b: 2 });
      });

      it('should maintain property order', () => {
        const obj = { d: 4, c: 3, b: 2, a: 1 };
        const result = pick(obj, ['a', 'b', 'c', 'd']);
        
        // Check that keys are in the same order as the pick array
        expect(Object.keys(result)).toEqual(['a', 'b', 'c', 'd']);
      });

      it('should not modify the original object', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const original = { ...obj };
        pick(obj, ['a', 'b']);
        
        expect(obj).toEqual(original);
      });
    });

    describe('edge cases', () => {
      it('should handle non-existent properties', () => {
        const obj = { a: 1, b: 2 };
        const result = pick(obj, ['a', 'c']);
        
        expect(result).toEqual({ a: 1 });
        expect(result).not.toHaveProperty('c');
      });

      it('should return an empty object when no properties are specified', () => {
        const obj = { a: 1, b: 2 };
        const result = pick(obj, []);
        
        expect(result).toEqual({});
      });

      it('should handle null and undefined values', () => {
        const obj = { a: null, b: undefined, c: 0 };
        const result = pick(obj, ['a', 'b', 'c']);
        
        expect(result).toEqual({ a: null, b: undefined, c: 0 });
      });

      it('should return an empty object for null or undefined input', () => {
        expect(pick(null, ['a', 'b'])).toEqual({});
        expect(pick(undefined, ['a', 'b'])).toEqual({});
      });

      it('should handle empty objects', () => {
        expect(pick({}, ['a', 'b'])).toEqual({});
      });
    });

    describe('nested objects', () => {
      it('should pick properties from objects with nested structures', () => {
        const obj = {
          a: 1,
          b: { c: 2, d: 3 },
          e: [4, 5, 6],
          f: { g: { h: 7 } }
        };
        const result = pick(obj, ['a', 'b', 'f']);
        
        expect(result).toEqual({
          a: 1,
          b: { c: 2, d: 3 },
          f: { g: { h: 7 } }
        });
      });

      it('should not deep pick nested properties', () => {
        const obj = {
          a: { b: 1, c: 2 },
          d: { e: 3, f: 4 }
        };
        const result = pick(obj, ['a']);
        
        expect(result).toEqual({ a: { b: 1, c: 2 } });
        // Should not be able to pick nested properties directly
        expect(pick(obj, ['a.b'])).toEqual({});
      });
    });

    describe('type safety', () => {
      it('should preserve the types of picked properties', () => {
        interface TestObject {
          a: number;
          b: string;
          c: boolean;
          d: object;
        }
        
        const obj: TestObject = {
          a: 1,
          b: 'test',
          c: true,
          d: { key: 'value' }
        };
        
        const result = pick(obj, ['a', 'c']);
        
        // TypeScript should infer the correct types
        const numValue: number = result.a;
        const boolValue: boolean = result.c;
        
        expect(typeof result.a).toBe('number');
        expect(typeof result.c).toBe('boolean');
      });
    });
  });

  describe('omit', () => {
    describe('basic functionality', () => {
      it('should exclude specified properties from an object', () => {
        const obj = { a: 1, b: 2, c: 3, d: 4 };
        const result = omit(obj, ['b', 'd']);
        
        expect(result).toEqual({ a: 1, c: 3 });
      });

      it('should handle omitting a single property', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = omit(obj, ['b']);
        
        expect(result).toEqual({ a: 1, c: 3 });
      });

      it('should handle omitting all properties', () => {
        const obj = { a: 1, b: 2 };
        const result = omit(obj, ['a', 'b']);
        
        expect(result).toEqual({});
      });

      it('should not modify the original object', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const original = { ...obj };
        omit(obj, ['a', 'b']);
        
        expect(obj).toEqual(original);
      });
    });

    describe('edge cases', () => {
      it('should handle non-existent properties', () => {
        const obj = { a: 1, b: 2 };
        const result = omit(obj, ['c', 'd']);
        
        expect(result).toEqual({ a: 1, b: 2 });
      });

      it('should return a copy of the object when no properties are specified', () => {
        const obj = { a: 1, b: 2 };
        const result = omit(obj, []);
        
        expect(result).toEqual({ a: 1, b: 2 });
        expect(result).not.toBe(obj); // Should be a new object
      });

      it('should handle null and undefined values', () => {
        const obj = { a: null, b: undefined, c: 0 };
        const result = omit(obj, ['a']);
        
        expect(result).toEqual({ b: undefined, c: 0 });
      });

      it('should return an empty object for null or undefined input', () => {
        expect(omit(null, ['a', 'b'])).toEqual({});
        expect(omit(undefined, ['a', 'b'])).toEqual({});
      });

      it('should handle empty objects', () => {
        expect(omit({}, ['a', 'b'])).toEqual({});
      });
    });

    describe('nested objects', () => {
      it('should omit properties from objects with nested structures', () => {
        const obj = {
          a: 1,
          b: { c: 2, d: 3 },
          e: [4, 5, 6],
          f: { g: { h: 7 } }
        };
        const result = omit(obj, ['b', 'e']);
        
        expect(result).toEqual({
          a: 1,
          f: { g: { h: 7 } }
        });
      });

      it('should not deep omit nested properties', () => {
        const obj = {
          a: { b: 1, c: 2 },
          d: { e: 3, f: 4 }
        };
        const result = omit(obj, ['d']);
        
        expect(result).toEqual({ a: { b: 1, c: 2 } });
        // Should not be able to omit nested properties directly
        expect(omit(obj, ['a.b'])).toEqual(obj);
      });
    });

    describe('type safety', () => {
      it('should preserve the types of remaining properties', () => {
        interface TestObject {
          a: number;
          b: string;
          c: boolean;
          d: object;
        }
        
        const obj: TestObject = {
          a: 1,
          b: 'test',
          c: true,
          d: { key: 'value' }
        };
        
        const result = omit(obj, ['b', 'd']);
        
        // TypeScript should infer the correct types
        const numValue: number = result.a;
        const boolValue: boolean = result.c;
        
        expect(typeof result.a).toBe('number');
        expect(typeof result.c).toBe('boolean');
      });
    });
  });

  describe('mapValues', () => {
    describe('basic functionality', () => {
      it('should transform values while preserving keys', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = mapValues(obj, (value) => value * 2);
        
        expect(result).toEqual({ a: 2, b: 4, c: 6 });
      });

      it('should provide key and object as additional arguments to the mapper function', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = mapValues(obj, (value, key, object) => {
          expect(object).toBe(obj);
          return `${key}:${value}`;
        });
        
        expect(result).toEqual({ a: 'a:1', b: 'b:2', c: 'c:3' });
      });

      it('should handle different return types', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = mapValues(obj, (value) => value > 1 ? true : 'false');
        
        expect(result).toEqual({ a: 'false', b: true, c: true });
      });

      it('should not modify the original object', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const original = { ...obj };
        mapValues(obj, (value) => value * 2);
        
        expect(obj).toEqual(original);
      });
    });

    describe('edge cases', () => {
      it('should handle null and undefined values', () => {
        const obj = { a: null, b: undefined, c: 0 };
        const result = mapValues(obj, (value) => value === null ? 'null' : value === undefined ? 'undefined' : 'value');
        
        expect(result).toEqual({ a: 'null', b: 'undefined', c: 'value' });
      });

      it('should return an empty object for null or undefined input', () => {
        expect(mapValues(null, (value) => value)).toEqual({});
        expect(mapValues(undefined, (value) => value)).toEqual({});
      });

      it('should handle empty objects', () => {
        expect(mapValues({}, (value) => value)).toEqual({});
      });

      it('should handle mapper functions that return undefined', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = mapValues(obj, () => undefined);
        
        expect(result).toEqual({ a: undefined, b: undefined, c: undefined });
      });
    });

    describe('nested objects', () => {
      it('should transform values in objects with nested structures', () => {
        const obj = {
          a: 1,
          b: { c: 2, d: 3 },
          e: [4, 5, 6]
        };
        const result = mapValues(obj, (value) => {
          if (typeof value === 'number') return value * 2;
          if (Array.isArray(value)) return value.map(v => v * 2);
          return value; // Return objects as is
        });
        
        expect(result).toEqual({
          a: 2,
          b: { c: 2, d: 3 }, // Object returned as is
          e: [8, 10, 12]
        });
      });

      it('should not deep transform nested objects by default', () => {
        const obj = {
          a: { b: 1, c: 2 },
          d: { e: 3, f: 4 }
        };
        const result = mapValues(obj, (value) => {
          // Only transform the top-level objects
          return 'transformed';
        });
        
        expect(result).toEqual({
          a: 'transformed',
          d: 'transformed'
        });
      });

      it('should allow recursive transformation of nested objects', () => {
        const obj = {
          a: { b: 1, c: 2 },
          d: { e: 3, f: 4 }
        };
        
        // Recursive transformation function
        const deepTransform = (obj) => {
          if (typeof obj !== 'object' || obj === null) return obj;
          return mapValues(obj, (value) => {
            if (typeof value === 'object' && value !== null) {
              return deepTransform(value);
            }
            return value * 2;
          });
        };
        
        const result = deepTransform(obj);
        
        expect(result).toEqual({
          a: { b: 2, c: 4 },
          d: { e: 6, f: 8 }
        });
      });
    });

    describe('type safety', () => {
      it('should preserve type information with the mapper function', () => {
        interface TestObject {
          a: number;
          b: string;
          c: boolean;
        }
        
        const obj: TestObject = {
          a: 1,
          b: 'test',
          c: true
        };
        
        // Transform numbers to strings, strings to numbers, and booleans to objects
        const result = mapValues(obj, (value, key) => {
          if (typeof value === 'number') return String(value);
          if (typeof value === 'string') return value.length;
          if (typeof value === 'boolean') return { value };
          return value;
        });
        
        expect(typeof result.a).toBe('string');
        expect(typeof result.b).toBe('number');
        expect(typeof result.c).toBe('object');
        expect(result).toEqual({
          a: '1',
          b: 4,
          c: { value: true }
        });
      });
    });
  });

  describe('filterKeys', () => {
    describe('basic functionality', () => {
      it('should filter object properties based on key predicate', () => {
        const obj = { a: 1, b: 2, c: 3, d: 4 };
        const result = filterKeys(obj, (key) => key === 'a' || key === 'c');
        
        expect(result).toEqual({ a: 1, c: 3 });
      });

      it('should provide value and object as additional arguments to the predicate function', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = filterKeys(obj, (key, value, object) => {
          expect(object).toBe(obj);
          return value > 1;
        });
        
        expect(result).toEqual({ b: 2, c: 3 });
      });

      it('should not modify the original object', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const original = { ...obj };
        filterKeys(obj, (key) => key !== 'b');
        
        expect(obj).toEqual(original);
      });
    });

    describe('edge cases', () => {
      it('should handle predicates that always return true', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = filterKeys(obj, () => true);
        
        expect(result).toEqual(obj);
        expect(result).not.toBe(obj); // Should be a new object
      });

      it('should handle predicates that always return false', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = filterKeys(obj, () => false);
        
        expect(result).toEqual({});
      });

      it('should handle null and undefined values', () => {
        const obj = { a: null, b: undefined, c: 0 };
        const result = filterKeys(obj, (key) => key !== 'a');
        
        expect(result).toEqual({ b: undefined, c: 0 });
      });

      it('should return an empty object for null or undefined input', () => {
        expect(filterKeys(null, (key) => true)).toEqual({});
        expect(filterKeys(undefined, (key) => true)).toEqual({});
      });

      it('should handle empty objects', () => {
        expect(filterKeys({}, (key) => true)).toEqual({});
      });
    });

    describe('nested objects', () => {
      it('should filter properties from objects with nested structures', () => {
        const obj = {
          a: 1,
          b: { c: 2, d: 3 },
          e: [4, 5, 6],
          f: { g: { h: 7 } }
        };
        const result = filterKeys(obj, (key) => key !== 'b' && key !== 'e');
        
        expect(result).toEqual({
          a: 1,
          f: { g: { h: 7 } }
        });
      });

      it('should not deep filter nested objects', () => {
        const obj = {
          a: { b: 1, c: 2 },
          d: { e: 3, f: 4 }
        };
        const result = filterKeys(obj, (key) => key !== 'd');
        
        expect(result).toEqual({ a: { b: 1, c: 2 } });
      });

      it('should allow recursive filtering of nested objects', () => {
        const obj = {
          a: { b: 1, c: 2 },
          d: { e: 3, f: 4, g: 5 }
        };
        
        // Recursive filtering function
        const deepFilter = (obj) => {
          if (typeof obj !== 'object' || obj === null) return obj;
          const filtered = filterKeys(obj, (key) => key !== 'c' && key !== 'g');
          return mapValues(filtered, (value) => {
            if (typeof value === 'object' && value !== null) {
              return deepFilter(value);
            }
            return value;
          });
        };
        
        const result = deepFilter(obj);
        
        expect(result).toEqual({
          a: { b: 1 },
          d: { e: 3, f: 4 }
        });
      });
    });

    describe('type safety', () => {
      it('should preserve the types of filtered properties', () => {
        interface TestObject {
          a: number;
          b: string;
          c: boolean;
          d: object;
        }
        
        const obj: TestObject = {
          a: 1,
          b: 'test',
          c: true,
          d: { key: 'value' }
        };
        
        const result = filterKeys(obj, (key) => key === 'a' || key === 'c');
        
        // TypeScript should infer the correct types
        const numValue: number = result.a;
        const boolValue: boolean = result.c;
        
        expect(typeof result.a).toBe('number');
        expect(typeof result.c).toBe('boolean');
      });
    });

    describe('comparison with pick and omit', () => {
      it('should be equivalent to pick when filtering by a list of keys', () => {
        const obj = { a: 1, b: 2, c: 3, d: 4 };
        const keysToKeep = ['a', 'c'];
        
        const pickResult = pick(obj, keysToKeep);
        const filterResult = filterKeys(obj, (key) => keysToKeep.includes(key));
        
        expect(filterResult).toEqual(pickResult);
      });

      it('should be equivalent to omit when filtering by excluded keys', () => {
        const obj = { a: 1, b: 2, c: 3, d: 4 };
        const keysToRemove = ['b', 'd'];
        
        const omitResult = omit(obj, keysToRemove);
        const filterResult = filterKeys(obj, (key) => !keysToRemove.includes(key));
        
        expect(filterResult).toEqual(omitResult);
      });
    });
  });

  describe('combined usage', () => {
    it('should allow chaining of transformation functions', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 };
      
      // Chain multiple transformations
      const result = mapValues(
        omit(
          pick(obj, ['a', 'b', 'c', 'd']),
          ['b']
        ),
        value => value * 2
      );
      
      expect(result).toEqual({ a: 2, c: 6, d: 8 });
    });

    it('should allow complex transformations with multiple functions', () => {
      const users = {
        user1: { name: 'John', age: 25, role: 'admin' },
        user2: { name: 'Jane', age: 30, role: 'user' },
        user3: { name: 'Bob', age: 22, role: 'user' },
        user4: { name: 'Alice', age: 35, role: 'admin' }
      };
      
      // Filter users by role, then pick only name and age, then transform ages
      const result = mapValues(
        filterKeys(users, (_, user) => user.role === 'admin'),
        user => pick(user, ['name', 'age'])
      );
      
      expect(result).toEqual({
        user1: { name: 'John', age: 25 },
        user4: { name: 'Alice', age: 35 }
      });
    });
  });
});