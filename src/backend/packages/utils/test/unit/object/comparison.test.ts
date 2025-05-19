/**
 * Unit tests for object comparison utilities
 * 
 * These tests verify that deep equality comparison works correctly for nested objects,
 * arrays, and primitive values, and that the difference detection accurately identifies
 * changed properties between objects.
 */

import {
  isEqual,
  getDifferences,
  hasDifferences,
  objectsAreEqual,
  ComparisonOptions,
  ObjectDifferences,
  isPlainObject
} from '../../../src/object/comparison';

describe('Object Comparison Utilities', () => {
  describe('isPlainObject', () => {
    it('should correctly identify plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(true);
      expect(isPlainObject(new Object())).toBe(true);
    });

    it('should correctly identify non-plain objects', () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
      expect(isPlainObject(42)).toBe(false);
      expect(isPlainObject('string')).toBe(false);
      expect(isPlainObject(true)).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject(new Map())).toBe(false);
      expect(isPlainObject(new Set())).toBe(false);
      expect(isPlainObject(() => {})).toBe(false);
    });

    it('should handle class instances correctly', () => {
      class TestClass {}
      expect(isPlainObject(new TestClass())).toBe(true); // In JavaScript, class instances are plain objects
    });
  });

  describe('isEqual', () => {
    it('should correctly compare primitive values', () => {
      expect(isEqual(42, 42)).toBe(true);
      expect(isEqual('test', 'test')).toBe(true);
      expect(isEqual(true, true)).toBe(true);
      expect(isEqual(null, null)).toBe(true);
      expect(isEqual(undefined, undefined)).toBe(true);
      const sym = Symbol('test');
      expect(isEqual(sym, sym)).toBe(true);

      expect(isEqual(42, 43)).toBe(false);
      expect(isEqual('test', 'other')).toBe(false);
      expect(isEqual(true, false)).toBe(false);
      expect(isEqual(null, undefined)).toBe(false);
      expect(isEqual(Symbol('test'), Symbol('test'))).toBe(false); // Different symbol instances
    });

    it('should correctly compare simple objects', () => {
      expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(isEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true); // Order doesn't matter
      expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      expect(isEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false); // Missing property
      expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false); // Extra property
    });

    it('should correctly compare nested objects', () => {
      const obj1 = {
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

      const obj2 = {
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

      const obj3 = {
        user: {
          name: 'John',
          profile: {
            age: 30,
            address: {
              city: 'Boston', // Different city
              zip: '10001'
            }
          }
        }
      };

      expect(isEqual(obj1, obj2)).toBe(true);
      expect(isEqual(obj1, obj3)).toBe(false);
    });

    it('should correctly compare arrays', () => {
      expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(isEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(isEqual([1, 2, 3], [1, 2])).toBe(false); // Different length
      expect(isEqual([1, 2], [1, 2, 3])).toBe(false); // Different length

      // Arrays of objects
      expect(isEqual(
        [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
        [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]
      )).toBe(true);

      expect(isEqual(
        [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
        [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Modified' }]
      )).toBe(false);
    });

    it('should correctly compare nested arrays', () => {
      expect(isEqual([1, [2, 3], 4], [1, [2, 3], 4])).toBe(true);
      expect(isEqual([1, [2, 3], 4], [1, [2, 4], 4])).toBe(false);
      expect(isEqual([1, [2, [3, 4]], 5], [1, [2, [3, 4]], 5])).toBe(true);
      expect(isEqual([1, [2, [3, 4]], 5], [1, [2, [3, 5]], 5])).toBe(false);
    });

    it('should correctly compare arrays of objects', () => {
      const arr1 = [
        { id: 1, metadata: { tags: ['a', 'b'] } },
        { id: 2, metadata: { tags: ['c', 'd'] } }
      ];

      const arr2 = [
        { id: 1, metadata: { tags: ['a', 'b'] } },
        { id: 2, metadata: { tags: ['c', 'd'] } }
      ];

      const arr3 = [
        { id: 1, metadata: { tags: ['a', 'b'] } },
        { id: 2, metadata: { tags: ['c', 'e'] } } // Different tag
      ];

      expect(isEqual(arr1, arr2)).toBe(true);
      expect(isEqual(arr1, arr3)).toBe(false);
    });

    it('should correctly compare Date objects', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-01');
      const date3 = new Date('2023-01-02');

      expect(isEqual(date1, date2)).toBe(true);
      expect(isEqual(date1, date3)).toBe(false);

      // Date in objects
      expect(isEqual({ date: date1 }, { date: date2 })).toBe(true);
      expect(isEqual({ date: date1 }, { date: date3 })).toBe(false);
    });

    it('should handle the ignoreUndefined option', () => {
      const obj1 = { a: 1, b: undefined, c: 3 };
      const obj2 = { a: 1, c: 3 };

      // By default, undefined properties are considered
      expect(isEqual(obj1, obj2)).toBe(false);

      // With ignoreUndefined: true
      expect(isEqual(obj1, obj2, { ignoreUndefined: true })).toBe(true);

      // Should work in both directions
      expect(isEqual(obj2, obj1, { ignoreUndefined: true })).toBe(true);
    });

    it('should handle the strict option', () => {
      // With strict: true (default)
      expect(isEqual(1, '1')).toBe(false);
      expect(isEqual(0, false)).toBe(false);
      expect(isEqual('', false)).toBe(false);

      // With strict: false
      expect(isEqual(1, '1', { strict: false })).toBe(true);
      expect(isEqual(0, false, { strict: false })).toBe(true);
      expect(isEqual('', false, { strict: false })).toBe(true);

      // Objects with different types of values
      expect(isEqual({ a: 1 }, { a: '1' })).toBe(false);
      expect(isEqual({ a: 1 }, { a: '1' }, { strict: false })).toBe(true);
    });

    it('should handle the excludePaths option', () => {
      const obj1 = {
        id: 1,
        user: {
          name: 'John',
          metadata: {
            created: new Date('2023-01-01'),
            updated: new Date('2023-01-02')
          }
        },
        items: [{ id: 1 }, { id: 2 }]
      };

      const obj2 = {
        id: 1,
        user: {
          name: 'Jane', // Different
          metadata: {
            created: new Date('2023-01-01'),
            updated: new Date('2023-01-03') // Different
          }
        },
        items: [{ id: 1 }, { id: 3 }] // Different
      };

      // Without exclusions
      expect(isEqual(obj1, obj2)).toBe(false);

      // Exclude specific paths
      expect(isEqual(obj1, obj2, {
        excludePaths: ['user.name', 'user.metadata.updated', 'items']
      })).toBe(true);

      // Exclude with wildcard
      expect(isEqual(obj1, obj2, {
        excludePaths: ['user.*', 'items']
      })).toBe(true);
    });

    it('should handle circular references', () => {
      // Create objects with circular references
      const obj1: any = { a: 1 };
      obj1.self = obj1;
      obj1.nested = { parent: obj1 };

      const obj2: any = { a: 1 };
      obj2.self = obj2;
      obj2.nested = { parent: obj2 };

      const obj3: any = { a: 2 }; // Different value
      obj3.self = obj3;
      obj3.nested = { parent: obj3 };

      expect(isEqual(obj1, obj2)).toBe(true);
      expect(isEqual(obj1, obj3)).toBe(false);
    });

    it('should handle sparse arrays', () => {
      // eslint-disable-next-line no-sparse-arrays
      const sparse1 = [1, , 3];
      // eslint-disable-next-line no-sparse-arrays
      const sparse2 = [1, , 3];
      // eslint-disable-next-line no-sparse-arrays
      const sparse3 = [1, , 4]; // Different value
      const normal = [1, undefined, 3]; // Explicit undefined

      expect(isEqual(sparse1, sparse2)).toBe(true);
      expect(isEqual(sparse1, sparse3)).toBe(false);
      expect(isEqual(sparse1, normal)).toBe(true); // Sparse holes are treated as undefined
    });

    it('should handle typed arrays', () => {
      const int8Array1 = new Int8Array([1, 2, 3]);
      const int8Array2 = new Int8Array([1, 2, 3]);
      const int8Array3 = new Int8Array([1, 2, 4]); // Different value

      // Typed arrays are not plain objects, so they're compared by reference
      expect(isEqual(int8Array1, int8Array1)).toBe(true); // Same reference
      expect(isEqual(int8Array1, int8Array2)).toBe(false); // Different reference
      expect(isEqual(int8Array1, int8Array3)).toBe(false); // Different reference and value
    });

    it('should handle array-like objects', () => {
      const arrayLike1 = { 0: 'a', 1: 'b', 2: 'c', length: 3 };
      const arrayLike2 = { 0: 'a', 1: 'b', 2: 'c', length: 3 };
      const arrayLike3 = { 0: 'a', 1: 'b', 2: 'd', length: 3 }; // Different value

      // Array-like objects are plain objects, so they're compared by value
      expect(isEqual(arrayLike1, arrayLike2)).toBe(true);
      expect(isEqual(arrayLike1, arrayLike3)).toBe(false);
    });
  });

  describe('getDifferences', () => {
    it('should detect differences in simple objects', () => {
      const oldObj = { a: 1, b: 2, c: 3 };
      const newObj = { a: 1, b: 3, d: 4 }; // b changed, c removed, d added

      const differences = getDifferences(oldObj, newObj);

      expect(differences).toEqual({
        'b': { oldValue: 2, newValue: 3 },
        'c': { oldValue: 3, newValue: undefined },
        'd': { oldValue: undefined, newValue: 4 }
      });
    });

    it('should detect differences in nested objects', () => {
      const oldObj = {
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

      const newObj = {
        user: {
          name: 'John',
          profile: {
            age: 31, // Changed
            address: {
              city: 'Boston', // Changed
              zip: '10001'
            }
          }
        }
      };

      const differences = getDifferences(oldObj, newObj);

      expect(differences).toEqual({
        'user.profile.age': { oldValue: 30, newValue: 31 },
        'user.profile.address.city': { oldValue: 'New York', newValue: 'Boston' }
      });
    });

    it('should detect differences in arrays', () => {
      const oldObj = { items: [1, 2, 3] };
      const newObj = { items: [1, 4, 3] }; // Second item changed

      const differences = getDifferences(oldObj, newObj);

      expect(differences).toEqual({
        'items[1]': { oldValue: 2, newValue: 4 }
      });
    });

    it('should detect differences in arrays of objects', () => {
      const oldObj = {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' }
        ]
      };

      const newObj = {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Janet' } // Name changed
        ]
      };

      const differences = getDifferences(oldObj, newObj);

      expect(differences).toEqual({
        'users[1].name': { oldValue: 'Jane', newValue: 'Janet' }
      });
    });

    it('should detect differences when array lengths change', () => {
      const oldObj = { items: [1, 2, 3] };
      const newObj = { items: [1, 2] }; // Last item removed

      const differences = getDifferences(oldObj, newObj);

      // When array lengths differ, the entire array is considered different
      expect(differences).toEqual({
        'items': { oldValue: [1, 2, 3], newValue: [1, 2] }
      });
    });

    it('should handle the ignoreUndefined option', () => {
      const oldObj = { a: 1, b: 2, c: undefined };
      const newObj = { a: 1, b: 2 }; // c is missing

      // By default, undefined properties are considered
      const differences1 = getDifferences(oldObj, newObj);
      expect(differences1).toEqual({
        'c': { oldValue: undefined, newValue: undefined }
      });

      // With ignoreUndefined: true
      const differences2 = getDifferences(oldObj, newObj, { ignoreUndefined: true });
      expect(differences2).toEqual({});
    });

    it('should handle the strict option', () => {
      const oldObj = { a: 1, b: 2 };
      const newObj = { a: '1', b: 2 }; // a is now a string

      // With strict: true (default)
      const differences1 = getDifferences(oldObj, newObj);
      expect(differences1).toEqual({
        'a': { oldValue: 1, newValue: '1' }
      });

      // With strict: false
      const differences2 = getDifferences(oldObj, newObj, { strict: false });
      expect(differences2).toEqual({});
    });

    it('should handle the excludePaths option', () => {
      const oldObj = {
        id: 1,
        user: {
          name: 'John',
          metadata: {
            created: new Date('2023-01-01'),
            updated: new Date('2023-01-02')
          }
        }
      };

      const newObj = {
        id: 2, // Changed
        user: {
          name: 'Jane', // Changed
          metadata: {
            created: new Date('2023-01-01'),
            updated: new Date('2023-01-03') // Changed
          }
        }
      };

      // Without exclusions
      const differences1 = getDifferences(oldObj, newObj);
      expect(Object.keys(differences1)).toEqual([
        'id',
        'user.name',
        'user.metadata.updated'
      ]);

      // With exclusions
      const differences2 = getDifferences(oldObj, newObj, {
        excludePaths: ['id', 'user.metadata']
      });
      expect(Object.keys(differences2)).toEqual(['user.name']);

      // With wildcard exclusions
      const differences3 = getDifferences(oldObj, newObj, {
        excludePaths: ['user.*']
      });
      expect(Object.keys(differences3)).toEqual(['id']);
    });

    it('should handle type changes correctly', () => {
      const oldObj = {
        prop: { nested: 'value' }
      };

      const newObj = {
        prop: 'string value' // Changed from object to string
      };

      const differences = getDifferences(oldObj, newObj);

      expect(differences).toEqual({
        'prop': {
          oldValue: { nested: 'value' },
          newValue: 'string value'
        }
      });
    });

    it('should handle array to object type changes', () => {
      const oldObj = {
        prop: [1, 2, 3]
      };

      const newObj = {
        prop: { a: 1, b: 2 } // Changed from array to object
      };

      const differences = getDifferences(oldObj, newObj);

      expect(differences).toEqual({
        'prop': {
          oldValue: [1, 2, 3],
          newValue: { a: 1, b: 2 }
        }
      });
    });
  });

  describe('hasDifferences', () => {
    it('should return true when objects have differences', () => {
      const oldObj = { a: 1, b: 2 };
      const newObj = { a: 1, b: 3 }; // b changed

      expect(hasDifferences(oldObj, newObj)).toBe(true);
    });

    it('should return false when objects are equal', () => {
      const oldObj = { a: 1, b: 2 };
      const newObj = { a: 1, b: 2 };

      expect(hasDifferences(oldObj, newObj)).toBe(false);
    });

    it('should respect comparison options', () => {
      const oldObj = { a: 1, b: undefined };
      const newObj = { a: 1 }; // b missing

      // By default, undefined properties are considered
      expect(hasDifferences(oldObj, newObj)).toBe(true);

      // With ignoreUndefined: true
      expect(hasDifferences(oldObj, newObj, { ignoreUndefined: true })).toBe(false);
    });
  });

  describe('objectsAreEqual', () => {
    it('should work as a type guard', () => {
      interface User {
        id: number;
        name: string;
      }

      interface ExtendedUser extends User {
        role: string;
      }

      const user: User = { id: 1, name: 'John' };
      const extendedUser: ExtendedUser = { id: 1, name: 'John', role: 'admin' };
      const differentUser: User = { id: 2, name: 'Jane' };

      // When objects are not equal
      if (!objectsAreEqual(user, differentUser)) {
        // TypeScript knows they're not equal here
        expect(user.id).not.toBe(differentUser.id);
      }

      // When objects have compatible properties but different shapes
      if (objectsAreEqual(user, extendedUser, { excludePaths: ['role'] })) {
        // TypeScript treats them as compatible here
        expect(user.id).toBe(extendedUser.id);
        expect(user.name).toBe(extendedUser.name);
      }
    });

    it('should return true for equal objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };

      expect(objectsAreEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for different objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };

      expect(objectsAreEqual(obj1, obj2)).toBe(false);
    });
  });
});