/**
 * Unit tests for object transformation utilities
 * 
 * These tests verify that each transformation function correctly handles both normal inputs
 * and edge cases (null/undefined values, empty objects, nested properties), ensuring proper
 * immutability and accurate property selection/transformation.
 */

import {
  pick,
  omit,
  mapValues,
  filterKeys,
  renameKeys,
  flattenObject,
  transformObject,
  convertValues
} from '../../../src/object/transform';

describe('Object Transformation Utilities', () => {
  describe('pick', () => {
    it('should create a new object with only the specified properties', () => {
      const original = { name: 'John', age: 30, address: '123 Main St' };
      const result = pick(original, ['name', 'age']);

      expect(result).toEqual({ name: 'John', age: 30 });
      expect(result).not.toBe(original); // Different reference
      expect(Object.keys(result).length).toBe(2);
    });

    it('should handle picking a single property', () => {
      const original = { name: 'John', age: 30, address: '123 Main St' };
      const result = pick(original, ['name']);

      expect(result).toEqual({ name: 'John' });
      expect(Object.keys(result).length).toBe(1);
    });

    it('should handle picking all properties', () => {
      const original = { name: 'John', age: 30 };
      const result = pick(original, ['name', 'age']);

      expect(result).toEqual(original);
      expect(result).not.toBe(original); // Different reference
    });

    it('should handle picking non-existent properties', () => {
      const original = { name: 'John', age: 30 };
      // @ts-expect-error - Testing with invalid key
      const result = pick(original, ['name', 'nonExistent']);

      expect(result).toEqual({ name: 'John' });
      expect(Object.keys(result).length).toBe(1);
    });

    it('should handle empty objects', () => {
      const original = {};
      const result = pick(original, []);

      expect(result).toEqual({});
      expect(result).not.toBe(original); // Different reference
    });

    it('should handle empty keys array', () => {
      const original = { name: 'John', age: 30 };
      const result = pick(original, []);

      expect(result).toEqual({});
      expect(Object.keys(result).length).toBe(0);
    });

    it('should throw an error for non-object inputs', () => {
      expect(() => pick(null as any, ['name'])).toThrow('Input must be an object');
      expect(() => pick(undefined as any, ['name'])).toThrow('Input must be an object');
      expect(() => pick(42 as any, ['name'])).toThrow('Input must be an object');
      expect(() => pick('string' as any, ['name'])).toThrow('Input must be an object');
      expect(() => pick(true as any, ['name'])).toThrow('Input must be an object');
    });

    it('should throw an error for non-array keys', () => {
      expect(() => pick({ name: 'John' }, 'name' as any)).toThrow('Keys must be an array');
      expect(() => pick({ name: 'John' }, {} as any)).toThrow('Keys must be an array');
      expect(() => pick({ name: 'John' }, null as any)).toThrow('Keys must be an array');
      expect(() => pick({ name: 'John' }, undefined as any)).toThrow('Keys must be an array');
    });

    it('should preserve the original object', () => {
      const original = { name: 'John', age: 30, address: '123 Main St' };
      const result = pick(original, ['name', 'age']);

      // Modify the result
      result.name = 'Jane';
      result.age = 25;

      // Original should be unchanged
      expect(original.name).toBe('John');
      expect(original.age).toBe(30);
    });

    it('should work with nested objects', () => {
      const original = {
        name: 'John',
        profile: {
          age: 30,
          address: '123 Main St'
        }
      };
      const result = pick(original, ['name', 'profile']);

      expect(result).toEqual({
        name: 'John',
        profile: {
          age: 30,
          address: '123 Main St'
        }
      });
      expect(result.profile).toBe(original.profile); // Same reference for nested objects
    });
  });

  describe('omit', () => {
    it('should create a new object excluding the specified properties', () => {
      const original = { name: 'John', age: 30, address: '123 Main St' };
      const result = omit(original, ['address']);

      expect(result).toEqual({ name: 'John', age: 30 });
      expect(result).not.toBe(original); // Different reference
      expect(Object.keys(result).length).toBe(2);
    });

    it('should handle omitting multiple properties', () => {
      const original = { name: 'John', age: 30, address: '123 Main St', email: 'john@example.com' };
      const result = omit(original, ['name', 'email']);

      expect(result).toEqual({ age: 30, address: '123 Main St' });
      expect(Object.keys(result).length).toBe(2);
    });

    it('should handle omitting all properties', () => {
      const original = { name: 'John', age: 30 };
      const result = omit(original, ['name', 'age']);

      expect(result).toEqual({});
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle omitting non-existent properties', () => {
      const original = { name: 'John', age: 30 };
      // @ts-expect-error - Testing with invalid key
      const result = omit(original, ['nonExistent']);

      expect(result).toEqual(original);
      expect(result).not.toBe(original); // Different reference
    });

    it('should handle empty objects', () => {
      const original = {};
      const result = omit(original, []);

      expect(result).toEqual({});
      expect(result).not.toBe(original); // Different reference
    });

    it('should handle empty keys array', () => {
      const original = { name: 'John', age: 30 };
      const result = omit(original, []);

      expect(result).toEqual(original);
      expect(result).not.toBe(original); // Different reference
    });

    it('should throw an error for non-object inputs', () => {
      expect(() => omit(null as any, ['name'])).toThrow('Input must be an object');
      expect(() => omit(undefined as any, ['name'])).toThrow('Input must be an object');
      expect(() => omit(42 as any, ['name'])).toThrow('Input must be an object');
      expect(() => omit('string' as any, ['name'])).toThrow('Input must be an object');
      expect(() => omit(true as any, ['name'])).toThrow('Input must be an object');
    });

    it('should throw an error for non-array keys', () => {
      expect(() => omit({ name: 'John' }, 'name' as any)).toThrow('Keys must be an array');
      expect(() => omit({ name: 'John' }, {} as any)).toThrow('Keys must be an array');
      expect(() => omit({ name: 'John' }, null as any)).toThrow('Keys must be an array');
      expect(() => omit({ name: 'John' }, undefined as any)).toThrow('Keys must be an array');
    });

    it('should preserve the original object', () => {
      const original = { name: 'John', age: 30, address: '123 Main St' };
      const result = omit(original, ['address']);

      // Modify the result
      result.name = 'Jane';
      result.age = 25;

      // Original should be unchanged
      expect(original.name).toBe('John');
      expect(original.age).toBe(30);
    });

    it('should work with nested objects', () => {
      const original = {
        name: 'John',
        profile: {
          age: 30,
          address: '123 Main St'
        },
        contact: {
          email: 'john@example.com'
        }
      };
      const result = omit(original, ['contact']);

      expect(result).toEqual({
        name: 'John',
        profile: {
          age: 30,
          address: '123 Main St'
        }
      });
      expect(result.profile).toBe(original.profile); // Same reference for nested objects
    });
  });

  describe('mapValues', () => {
    it('should transform values while preserving keys', () => {
      const original = { a: 1, b: 2, c: 3 };
      const result = mapValues(original, value => value * 2);

      expect(result).toEqual({ a: 2, b: 4, c: 6 });
      expect(result).not.toBe(original); // Different reference
      expect(Object.keys(result)).toEqual(Object.keys(original));
    });

    it('should provide key and object to the mapping function', () => {
      const original = { a: 1, b: 2, c: 3 };
      const result = mapValues(original, (value, key, obj) => {
        return `${key}:${value}:${obj === original}`;
      });

      expect(result).toEqual({
        a: 'a:1:true',
        b: 'b:2:true',
        c: 'c:3:true'
      });
    });

    it('should handle different value types', () => {
      const original = {
        name: 'John',
        age: 30,
        active: true,
        tags: ['user', 'premium']
      };

      const result = mapValues(original, value => {
        if (typeof value === 'string') return value.toUpperCase();
        if (typeof value === 'number') return value + 10;
        if (typeof value === 'boolean') return !value;
        if (Array.isArray(value)) return value.length;
        return value;
      });

      expect(result).toEqual({
        name: 'JOHN',
        age: 40,
        active: false,
        tags: 2
      });
    });

    it('should handle empty objects', () => {
      const original = {};
      const result = mapValues(original, value => value);

      expect(result).toEqual({});
      expect(result).not.toBe(original); // Different reference
    });

    it('should throw an error for non-object inputs', () => {
      expect(() => mapValues(null as any, v => v)).toThrow('Input must be an object');
      expect(() => mapValues(undefined as any, v => v)).toThrow('Input must be an object');
      expect(() => mapValues(42 as any, v => v)).toThrow('Input must be an object');
      expect(() => mapValues('string' as any, v => v)).toThrow('Input must be an object');
      expect(() => mapValues(true as any, v => v)).toThrow('Input must be an object');
    });

    it('should throw an error for non-function mappers', () => {
      expect(() => mapValues({ a: 1 }, null as any)).toThrow('Mapping function must be provided');
      expect(() => mapValues({ a: 1 }, undefined as any)).toThrow('Mapping function must be provided');
      expect(() => mapValues({ a: 1 }, 'string' as any)).toThrow('Mapping function must be provided');
      expect(() => mapValues({ a: 1 }, 42 as any)).toThrow('Mapping function must be provided');
      expect(() => mapValues({ a: 1 }, {} as any)).toThrow('Mapping function must be provided');
    });

    it('should preserve the original object', () => {
      const original = { a: 1, b: 2, c: 3 };
      const result = mapValues(original, value => value * 2);

      // Modify the result
      result.a = 99;

      // Original should be unchanged
      expect(original.a).toBe(1);
    });

    it('should work with nested objects', () => {
      const original = {
        user: {
          name: 'John',
          age: 30
        },
        settings: {
          theme: 'dark',
          notifications: true
        }
      };

      const result = mapValues(original, value => {
        // Return a copy of each nested object
        return { ...value, modified: true };
      });

      expect(result).toEqual({
        user: {
          name: 'John',
          age: 30,
          modified: true
        },
        settings: {
          theme: 'dark',
          notifications: true,
          modified: true
        }
      });

      // The nested objects in the result should be different from the original
      expect(result.user).not.toBe(original.user);
      expect(result.settings).not.toBe(original.settings);
    });
  });

  describe('filterKeys', () => {
    it('should filter keys based on a predicate', () => {
      const original = { a: 1, b: 2, c: 3, d: 4 };
      const result = filterKeys(original, (key, value) => value % 2 === 0);

      expect(result).toEqual({ b: 2, d: 4 });
      expect(result).not.toBe(original); // Different reference
    });

    it('should provide key, value, and object to the predicate', () => {
      const original = { a: 1, b: 2, c: 3 };
      const result = filterKeys(original, (key, value, obj) => {
        return key === 'a' || (value > 1 && obj === original);
      });

      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should handle filtering all keys', () => {
      const original = { a: 1, b: 2, c: 3 };
      const result = filterKeys(original, () => false);

      expect(result).toEqual({});
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle keeping all keys', () => {
      const original = { a: 1, b: 2, c: 3 };
      const result = filterKeys(original, () => true);

      expect(result).toEqual(original);
      expect(result).not.toBe(original); // Different reference
    });

    it('should handle filtering based on key', () => {
      const original = { a: 1, b: 2, c: 3, d: 4 };
      const result = filterKeys(original, key => ['a', 'c'].includes(key));

      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should handle filtering null/undefined values', () => {
      const original = { a: 1, b: null, c: undefined, d: 0 };
      const result = filterKeys(original, (_, value) => value !== null && value !== undefined);

      expect(result).toEqual({ a: 1, d: 0 });
    });

    it('should handle empty objects', () => {
      const original = {};
      const result = filterKeys(original, () => true);

      expect(result).toEqual({});
      expect(result).not.toBe(original); // Different reference
    });

    it('should throw an error for non-object inputs', () => {
      expect(() => filterKeys(null as any, () => true)).toThrow('Input must be an object');
      expect(() => filterKeys(undefined as any, () => true)).toThrow('Input must be an object');
      expect(() => filterKeys(42 as any, () => true)).toThrow('Input must be an object');
      expect(() => filterKeys('string' as any, () => true)).toThrow('Input must be an object');
      expect(() => filterKeys(true as any, () => true)).toThrow('Input must be an object');
    });

    it('should throw an error for non-function predicates', () => {
      expect(() => filterKeys({ a: 1 }, null as any)).toThrow('Predicate must be a function');
      expect(() => filterKeys({ a: 1 }, undefined as any)).toThrow('Predicate must be a function');
      expect(() => filterKeys({ a: 1 }, 'string' as any)).toThrow('Predicate must be a function');
      expect(() => filterKeys({ a: 1 }, 42 as any)).toThrow('Predicate must be a function');
      expect(() => filterKeys({ a: 1 }, {} as any)).toThrow('Predicate must be a function');
    });

    it('should preserve the original object', () => {
      const original = { a: 1, b: 2, c: 3 };
      const result = filterKeys(original, (key) => key !== 'b');

      // Modify the result
      result.a = 99;

      // Original should be unchanged
      expect(original.a).toBe(1);
    });

    it('should work with nested objects', () => {
      const original = {
        user: {
          name: 'John',
          age: 30
        },
        settings: null,
        data: {
          values: [1, 2, 3]
        }
      };

      const result = filterKeys(original, (_, value) => value !== null);

      expect(result).toEqual({
        user: {
          name: 'John',
          age: 30
        },
        data: {
          values: [1, 2, 3]
        }
      });

      // The nested objects in the result should be the same as the original
      expect(result.user).toBe(original.user);
      expect(result.data).toBe(original.data);
    });
  });

  describe('renameKeys', () => {
    it('should rename keys based on a mapping object', () => {
      const original = { name: 'John', age: 30, address: '123 Main St' };
      const result = renameKeys(original, { name: 'firstName', age: 'userAge' });

      expect(result).toEqual({ firstName: 'John', userAge: 30, address: '123 Main St' });
      expect(result).not.toBe(original); // Different reference
    });

    it('should handle renaming all keys', () => {
      const original = { a: 1, b: 2, c: 3 };
      const result = renameKeys(original, { a: 'x', b: 'y', c: 'z' });

      expect(result).toEqual({ x: 1, y: 2, z: 3 });
      expect(Object.keys(result)).toEqual(['x', 'y', 'z']);
    });

    it('should handle renaming to the same key', () => {
      const original = { name: 'John', age: 30 };
      const result = renameKeys(original, { name: 'name', age: 'age' });

      expect(result).toEqual(original);
      expect(result).not.toBe(original); // Different reference
    });

    it('should handle empty mapping', () => {
      const original = { name: 'John', age: 30 };
      const result = renameKeys(original, {});

      expect(result).toEqual(original);
      expect(result).not.toBe(original); // Different reference
    });

    it('should handle empty objects', () => {
      const original = {};
      const result = renameKeys(original, { a: 'x' });

      expect(result).toEqual({});
      expect(result).not.toBe(original); // Different reference
    });

    it('should throw an error for non-object inputs', () => {
      expect(() => renameKeys(null as any, { a: 'x' })).toThrow('Input must be an object');
      expect(() => renameKeys(undefined as any, { a: 'x' })).toThrow('Input must be an object');
      expect(() => renameKeys(42 as any, { a: 'x' })).toThrow('Input must be an object');
      expect(() => renameKeys('string' as any, { a: 'x' })).toThrow('Input must be an object');
      expect(() => renameKeys(true as any, { a: 'x' })).toThrow('Input must be an object');
    });

    it('should throw an error for non-object key maps', () => {
      expect(() => renameKeys({ a: 1 }, null as any)).toThrow('Keys map must be an object');
      expect(() => renameKeys({ a: 1 }, undefined as any)).toThrow('Keys map must be an object');
      expect(() => renameKeys({ a: 1 }, 'string' as any)).toThrow('Keys map must be an object');
      expect(() => renameKeys({ a: 1 }, 42 as any)).toThrow('Keys map must be an object');
      expect(() => renameKeys({ a: 1 }, true as any)).toThrow('Keys map must be an object');
    });

    it('should preserve the original object', () => {
      const original = { name: 'John', age: 30 };
      const result = renameKeys(original, { name: 'firstName' });

      // Modify the result
      result.firstName = 'Jane';

      // Original should be unchanged
      expect(original.name).toBe('John');
    });

    it('should handle mapping to duplicate keys', () => {
      const original = { a: 1, b: 2, c: 3 };
      const result = renameKeys(original, { a: 'x', b: 'x' });

      // Last mapping wins
      expect(result).toEqual({ x: 2, c: 3 });
    });

    it('should handle non-string keys in the mapping', () => {
      const original = { a: 1, b: 2 };
      const result = renameKeys(original, { a: 42 as any, b: true as any });

      expect(result).toEqual({ '42': 1, 'true': 2 });
    });
  });

  describe('flattenObject', () => {
    it('should flatten a nested object structure', () => {
      const original = {
        user: {
          name: 'John',
          address: {
            city: 'New York',
            zip: '10001'
          }
        }
      };

      const result = flattenObject(original);

      expect(result).toEqual({
        'user.name': 'John',
        'user.address.city': 'New York',
        'user.address.zip': '10001'
      });
    });

    it('should handle arrays in objects', () => {
      const original = {
        user: {
          name: 'John',
          tags: ['developer', 'admin']
        }
      };

      const result = flattenObject(original);

      expect(result).toEqual({
        'user.name': 'John',
        'user.tags': ['developer', 'admin']
      });
    });

    it('should handle empty nested objects', () => {
      const original = {
        user: {
          name: 'John',
          address: {}
        }
      };

      const result = flattenObject(original);

      expect(result).toEqual({
        'user.name': 'John'
      });
    });

    it('should handle null and undefined values', () => {
      const original = {
        user: {
          name: 'John',
          address: null,
          phone: undefined
        }
      };

      const result = flattenObject(original);

      expect(result).toEqual({
        'user.name': 'John',
        'user.address': null,
        'user.phone': undefined
      });
    });

    it('should use the provided prefix', () => {
      const original = {
        name: 'John',
        age: 30
      };

      const result = flattenObject(original, 'user');

      expect(result).toEqual({
        'user.name': 'John',
        'user.age': 30
      });
    });

    it('should use the provided delimiter', () => {
      const original = {
        user: {
          name: 'John',
          address: {
            city: 'New York'
          }
        }
      };

      const result = flattenObject(original, '', '_');

      expect(result).toEqual({
        'user_name': 'John',
        'user_address_city': 'New York'
      });
    });

    it('should handle empty objects', () => {
      const original = {};
      const result = flattenObject(original);

      expect(result).toEqual({});
    });

    it('should throw an error for non-object inputs', () => {
      expect(() => flattenObject(null as any)).toThrow('Input must be an object');
      expect(() => flattenObject(undefined as any)).toThrow('Input must be an object');
      expect(() => flattenObject(42 as any)).toThrow('Input must be an object');
      expect(() => flattenObject('string' as any)).toThrow('Input must be an object');
      expect(() => flattenObject(true as any)).toThrow('Input must be an object');
    });

    it('should handle objects with circular references', () => {
      const original: any = {
        name: 'John',
        nested: {}
      };
      original.nested.circular = original;

      const result = flattenObject(original);

      expect(result).toEqual({
        'name': 'John',
        'nested.circular': original
      });
    });

    it('should preserve the original object', () => {
      const original = {
        user: {
          name: 'John'
        }
      };
      const result = flattenObject(original);

      // Modify the result
      result['user.name'] = 'Jane';

      // Original should be unchanged
      expect(original.user.name).toBe('John');
    });
  });

  describe('transformObject', () => {
    it('should transform keys and values based on a function', () => {
      const original = { name: 'John', age: 30 };
      const result = transformObject(original, (key, value) => [
        key.toUpperCase(),
        typeof value === 'string' ? value.toUpperCase() : value
      ]);

      expect(result).toEqual({ NAME: 'JOHN', AGE: 30 });
      expect(result).not.toBe(original); // Different reference
    });

    it('should provide the original object to the transform function', () => {
      const original = { a: 1, b: 2 };
      const result = transformObject(original, (key, value, obj) => [
        `${key}_${obj === original}`,
        value * 2
      ]);

      expect(result).toEqual({ 'a_true': 2, 'b_true': 4 });
    });

    it('should handle skipping keys when undefined is returned', () => {
      const original = { a: 1, b: 2, c: 3, d: 4 };
      const result = transformObject(original, (key, value) => {
        if (value % 2 === 0) {
          return [key, value * 10];
        }
        return [undefined as any, undefined]; // Skip odd values
      });

      expect(result).toEqual({ b: 20, d: 40 });
    });

    it('should handle empty objects', () => {
      const original = {};
      const result = transformObject(original, (key, value) => [key, value]);

      expect(result).toEqual({});
      expect(result).not.toBe(original); // Different reference
    });

    it('should throw an error for non-object inputs', () => {
      expect(() => transformObject(null as any, () => ['', ''])).toThrow('Input must be an object');
      expect(() => transformObject(undefined as any, () => ['', ''])).toThrow('Input must be an object');
      expect(() => transformObject(42 as any, () => ['', ''])).toThrow('Input must be an object');
      expect(() => transformObject('string' as any, () => ['', ''])).toThrow('Input must be an object');
      expect(() => transformObject(true as any, () => ['', ''])).toThrow('Input must be an object');
    });

    it('should throw an error for non-function transformers', () => {
      expect(() => transformObject({ a: 1 }, null as any)).toThrow('Transform function must be provided');
      expect(() => transformObject({ a: 1 }, undefined as any)).toThrow('Transform function must be provided');
      expect(() => transformObject({ a: 1 }, 'string' as any)).toThrow('Transform function must be provided');
      expect(() => transformObject({ a: 1 }, 42 as any)).toThrow('Transform function must be provided');
      expect(() => transformObject({ a: 1 }, {} as any)).toThrow('Transform function must be provided');
    });

    it('should preserve the original object', () => {
      const original = { name: 'John', age: 30 };
      const result = transformObject(original, (key, value) => [key.toUpperCase(), value]);

      // Modify the result
      (result as any).NAME = 'Jane';

      // Original should be unchanged
      expect(original.name).toBe('John');
    });

    it('should handle complex transformations', () => {
      const original = {
        user_name: 'john_doe',
        user_age: '30',
        user_active: 'true'
      };

      const result = transformObject(original, (key, value) => {
        // Remove the 'user_' prefix from keys
        const newKey = key.replace('user_', '');
        
        // Convert values to appropriate types
        let newValue = value;
        if (value === 'true' || value === 'false') {
          newValue = value === 'true';
        } else if (!isNaN(Number(value))) {
          newValue = Number(value);
        }
        
        return [newKey, newValue];
      });

      expect(result).toEqual({
        name: 'john_doe',
        age: 30,
        active: true
      });
    });
  });

  describe('convertValues', () => {
    it('should convert values to a specific type', () => {
      const original = { count: '5', total: '10', average: '2.5' };
      const result = convertValues(original, value => 
        typeof value === 'string' ? parseFloat(value) : value
      );

      expect(result).toEqual({ count: 5, total: 10, average: 2.5 });
      expect(result).not.toBe(original); // Different reference
    });

    it('should provide the key to the conversion function', () => {
      const original = { a: '1', b: '2', c: '3' };
      const result = convertValues(original, (value, key) => 
        key === 'b' ? parseInt(value as string) * 10 : parseInt(value as string)
      );

      expect(result).toEqual({ a: 1, b: 20, c: 3 });
    });

    it('should handle different value types', () => {
      const original = {
        name: 'John',
        age: '30',
        active: 'true',
        score: '9.5'
      };

      const result = convertValues(original, (value) => {
        if (value === 'true' || value === 'false') {
          return value === 'true';
        }
        if (typeof value === 'string' && !isNaN(parseFloat(value))) {
          return parseFloat(value);
        }
        return value;
      });

      expect(result).toEqual({
        name: 'John',
        age: 30,
        active: true,
        score: 9.5
      });
    });

    it('should handle empty objects', () => {
      const original = {};
      const result = convertValues(original, value => value);

      expect(result).toEqual({});
      expect(result).not.toBe(original); // Different reference
    });

    it('should throw an error for non-object inputs', () => {
      expect(() => convertValues(null as any, v => v)).toThrow('Input must be an object');
      expect(() => convertValues(undefined as any, v => v)).toThrow('Input must be an object');
      expect(() => convertValues(42 as any, v => v)).toThrow('Input must be an object');
      expect(() => convertValues('string' as any, v => v)).toThrow('Input must be an object');
      expect(() => convertValues(true as any, v => v)).toThrow('Input must be an object');
    });

    it('should throw an error for non-function converters', () => {
      expect(() => convertValues({ a: 1 }, null as any)).toThrow('Conversion function must be provided');
      expect(() => convertValues({ a: 1 }, undefined as any)).toThrow('Conversion function must be provided');
      expect(() => convertValues({ a: 1 }, 'string' as any)).toThrow('Conversion function must be provided');
      expect(() => convertValues({ a: 1 }, 42 as any)).toThrow('Conversion function must be provided');
      expect(() => convertValues({ a: 1 }, {} as any)).toThrow('Conversion function must be provided');
    });

    it('should preserve the original object', () => {
      const original = { count: '5', total: '10' };
      const result = convertValues(original, value => parseInt(value as string));

      // Modify the result
      result.count = 99;

      // Original should be unchanged
      expect(original.count).toBe('5');
    });

    it('should handle complex conversions', () => {
      const original = {
        user: {
          name: 'John',
          details: JSON.stringify({ age: 30, active: true })
        },
        settings: JSON.stringify({ theme: 'dark', notifications: true })
      };

      const result = convertValues(original, (value) => {
        if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
        return value;
      });

      expect(result).toEqual({
        user: {
          name: 'John',
          details: { age: 30, active: true }
        },
        settings: { theme: 'dark', notifications: true }
      });

      // The nested objects in the result should be different from the original
      expect(result.user).toBe(original.user);
      expect(typeof result.settings).toBe('object');
      expect(typeof original.settings).toBe('string');
    });
  });
});