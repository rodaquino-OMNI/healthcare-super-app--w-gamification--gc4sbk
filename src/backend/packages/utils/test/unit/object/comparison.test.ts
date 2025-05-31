/**
 * Unit tests for object comparison utilities
 * Tests the isEqual and getDifferences functions from src/object/comparison.ts
 */

import { isEqual, getDifferences } from '../../../src/object/comparison';

describe('Object Comparison Utilities', () => {
  describe('isEqual', () => {
    describe('primitive values', () => {
      it('should return true for identical primitive values', () => {
        expect(isEqual(1, 1)).toBe(true);
        expect(isEqual('test', 'test')).toBe(true);
        expect(isEqual(true, true)).toBe(true);
        expect(isEqual(null, null)).toBe(true);
        expect(isEqual(undefined, undefined)).toBe(true);
      });

      it('should return false for different primitive values', () => {
        expect(isEqual(1, 2)).toBe(false);
        expect(isEqual('test', 'test2')).toBe(false);
        expect(isEqual(true, false)).toBe(false);
        expect(isEqual(null, undefined)).toBe(false);
        expect(isEqual(0, null)).toBe(false);
        expect(isEqual('', null)).toBe(false);
      });
    });

    describe('simple objects', () => {
      it('should return true for identical simple objects', () => {
        const obj1 = { a: 1, b: 'test', c: true };
        const obj2 = { a: 1, b: 'test', c: true };
        expect(isEqual(obj1, obj2)).toBe(true);
      });

      it('should return true for identical objects with properties in different order', () => {
        const obj1 = { a: 1, b: 'test', c: true };
        const obj2 = { c: true, a: 1, b: 'test' };
        expect(isEqual(obj1, obj2)).toBe(true);
      });

      it('should return false for objects with different values', () => {
        const obj1 = { a: 1, b: 'test', c: true };
        const obj2 = { a: 1, b: 'test', c: false };
        expect(isEqual(obj1, obj2)).toBe(false);
      });

      it('should return false for objects with different properties', () => {
        const obj1 = { a: 1, b: 'test', c: true };
        const obj2 = { a: 1, b: 'test', d: true };
        expect(isEqual(obj1, obj2)).toBe(false);
      });

      it('should return false for objects with different number of properties', () => {
        const obj1 = { a: 1, b: 'test', c: true };
        const obj2 = { a: 1, b: 'test' };
        expect(isEqual(obj1, obj2)).toBe(false);
      });
    });

    describe('nested objects', () => {
      it('should return true for identical nested objects', () => {
        const obj1 = { a: 1, b: { c: 2, d: { e: 3 } } };
        const obj2 = { a: 1, b: { c: 2, d: { e: 3 } } };
        expect(isEqual(obj1, obj2)).toBe(true);
      });

      it('should return false for nested objects with different values', () => {
        const obj1 = { a: 1, b: { c: 2, d: { e: 3 } } };
        const obj2 = { a: 1, b: { c: 2, d: { e: 4 } } };
        expect(isEqual(obj1, obj2)).toBe(false);
      });

      it('should return false for nested objects with different structures', () => {
        const obj1 = { a: 1, b: { c: 2, d: { e: 3 } } };
        const obj2 = { a: 1, b: { c: 2, d: 3 } };
        expect(isEqual(obj1, obj2)).toBe(false);
      });
    });

    describe('arrays', () => {
      it('should return true for identical arrays', () => {
        const arr1 = [1, 2, 3];
        const arr2 = [1, 2, 3];
        expect(isEqual(arr1, arr2)).toBe(true);
      });

      it('should return false for arrays with different values', () => {
        const arr1 = [1, 2, 3];
        const arr2 = [1, 2, 4];
        expect(isEqual(arr1, arr2)).toBe(false);
      });

      it('should return false for arrays with different lengths', () => {
        const arr1 = [1, 2, 3];
        const arr2 = [1, 2];
        expect(isEqual(arr1, arr2)).toBe(false);
      });

      it('should handle sparse arrays correctly', () => {
        // eslint-disable-next-line no-sparse-arrays
        const arr1 = [1, , 3];
        // eslint-disable-next-line no-sparse-arrays
        const arr2 = [1, , 3];
        const arr3 = [1, undefined, 3];
        
        expect(isEqual(arr1, arr2)).toBe(true);
        expect(isEqual(arr1, arr3)).toBe(false);
      });

      it('should handle typed arrays correctly', () => {
        const arr1 = new Uint8Array([1, 2, 3]);
        const arr2 = new Uint8Array([1, 2, 3]);
        const arr3 = new Uint8Array([1, 2, 4]);
        const arr4 = new Int8Array([1, 2, 3]);
        
        expect(isEqual(arr1, arr2)).toBe(true);
        expect(isEqual(arr1, arr3)).toBe(false);
        expect(isEqual(arr1, arr4)).toBe(false); // Different types
      });
    });

    describe('arrays of objects', () => {
      it('should return true for identical arrays of objects', () => {
        const arr1 = [{ a: 1 }, { b: 2 }];
        const arr2 = [{ a: 1 }, { b: 2 }];
        expect(isEqual(arr1, arr2)).toBe(true);
      });

      it('should return false for arrays of objects with different values', () => {
        const arr1 = [{ a: 1 }, { b: 2 }];
        const arr2 = [{ a: 1 }, { b: 3 }];
        expect(isEqual(arr1, arr2)).toBe(false);
      });

      it('should return false for arrays of objects with different order', () => {
        const arr1 = [{ a: 1 }, { b: 2 }];
        const arr2 = [{ b: 2 }, { a: 1 }];
        expect(isEqual(arr1, arr2)).toBe(false);
      });
    });

    describe('special cases', () => {
      it('should handle Date objects correctly', () => {
        const date1 = new Date('2023-01-01');
        const date2 = new Date('2023-01-01');
        const date3 = new Date('2023-01-02');
        
        expect(isEqual(date1, date2)).toBe(true);
        expect(isEqual(date1, date3)).toBe(false);
      });

      it('should handle RegExp objects correctly', () => {
        const regex1 = /test/g;
        const regex2 = /test/g;
        const regex3 = /test/i;
        
        expect(isEqual(regex1, regex2)).toBe(true);
        expect(isEqual(regex1, regex3)).toBe(false);
      });

      it('should handle Map objects correctly', () => {
        const map1 = new Map([['a', 1], ['b', 2]]);
        const map2 = new Map([['a', 1], ['b', 2]]);
        const map3 = new Map([['a', 1], ['b', 3]]);
        
        expect(isEqual(map1, map2)).toBe(true);
        expect(isEqual(map1, map3)).toBe(false);
      });

      it('should handle Set objects correctly', () => {
        const set1 = new Set([1, 2, 3]);
        const set2 = new Set([1, 2, 3]);
        const set3 = new Set([1, 2, 4]);
        
        expect(isEqual(set1, set2)).toBe(true);
        expect(isEqual(set1, set3)).toBe(false);
      });
    });

    describe('circular references', () => {
      it('should handle circular references correctly', () => {
        const obj1: any = { a: 1 };
        const obj2: any = { a: 1 };
        obj1.self = obj1;
        obj2.self = obj2;

        expect(isEqual(obj1, obj2)).toBe(true);
      });

      it('should detect differences in objects with circular references', () => {
        const obj1: any = { a: 1 };
        const obj2: any = { a: 2 };
        obj1.self = obj1;
        obj2.self = obj2;

        expect(isEqual(obj1, obj2)).toBe(false);
      });

      it('should handle complex circular references correctly', () => {
        const obj1: any = { a: 1 };
        const obj2: any = { a: 1 };
        const child1: any = { parent: obj1, value: 'child' };
        const child2: any = { parent: obj2, value: 'child' };
        obj1.child = child1;
        obj2.child = child2;

        expect(isEqual(obj1, obj2)).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle null and undefined correctly', () => {
        expect(isEqual(null, null)).toBe(true);
        expect(isEqual(undefined, undefined)).toBe(true);
        expect(isEqual(null, undefined)).toBe(false);
      });

      it('should handle NaN correctly', () => {
        expect(isEqual(NaN, NaN)).toBe(true);
        expect(isEqual(NaN, 0)).toBe(false);
      });

      it('should handle +0 and -0 correctly', () => {
        expect(isEqual(0, 0)).toBe(true);
        expect(isEqual(0, -0)).toBe(true); // JavaScript considers +0 and -0 equal
      });

      it('should handle functions correctly', () => {
        const func1 = () => 1;
        const func2 = () => 1;
        const func3 = () => 2;
        
        // Functions are compared by reference, not by content
        expect(isEqual(func1, func1)).toBe(true);
        expect(isEqual(func1, func2)).toBe(false);
        expect(isEqual(func1, func3)).toBe(false);
      });
    });
  });

  describe('getDifferences', () => {
    it('should return null for identical objects', () => {
      const obj1 = { a: 1, b: 'test', c: true };
      const obj2 = { a: 1, b: 'test', c: true };
      expect(getDifferences(obj1, obj2)).toBeNull();
    });

    it('should identify different values in objects', () => {
      const obj1 = { a: 1, b: 'test', c: true };
      const obj2 = { a: 2, b: 'test', c: true };
      const expected = { a: { oldValue: 1, newValue: 2 } };
      expect(getDifferences(obj1, obj2)).toEqual(expected);
    });

    it('should identify missing properties in the second object', () => {
      const obj1 = { a: 1, b: 'test', c: true };
      const obj2 = { a: 1, b: 'test' };
      const expected = { c: { oldValue: true, newValue: undefined } };
      expect(getDifferences(obj1, obj2)).toEqual(expected);
    });

    it('should identify additional properties in the second object', () => {
      const obj1 = { a: 1, b: 'test' };
      const obj2 = { a: 1, b: 'test', c: true };
      const expected = { c: { oldValue: undefined, newValue: true } };
      expect(getDifferences(obj1, obj2)).toEqual(expected);
    });

    it('should identify differences in nested objects', () => {
      const obj1 = { a: 1, b: { c: 2, d: 3 } };
      const obj2 = { a: 1, b: { c: 2, d: 4 } };
      const expected = { 'b.d': { oldValue: 3, newValue: 4 } };
      expect(getDifferences(obj1, obj2)).toEqual(expected);
    });

    it('should identify differences in arrays', () => {
      const obj1 = { a: [1, 2, 3] };
      const obj2 = { a: [1, 2, 4] };
      const expected = { 'a[2]': { oldValue: 3, newValue: 4 } };
      expect(getDifferences(obj1, obj2)).toEqual(expected);
    });

    it('should identify differences in array length', () => {
      const obj1 = { a: [1, 2, 3] };
      const obj2 = { a: [1, 2] };
      const expected = { 'a.length': { oldValue: 3, newValue: 2 }, 'a[2]': { oldValue: 3, newValue: undefined } };
      expect(getDifferences(obj1, obj2)).toEqual(expected);
    });

    it('should handle Date objects correctly', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-02');
      const obj1 = { date: date1 };
      const obj2 = { date: date2 };
      
      const result = getDifferences(obj1, obj2);
      expect(result).not.toBeNull();
      expect(result?.date.oldValue).toEqual(date1);
      expect(result?.date.newValue).toEqual(date2);
    });

    it('should handle circular references correctly', () => {
      const obj1: any = { a: 1 };
      const obj2: any = { a: 2 };
      obj1.self = obj1;
      obj2.self = obj2;

      const expected = { a: { oldValue: 1, newValue: 2 } };
      expect(getDifferences(obj1, obj2)).toEqual(expected);
    });

    it('should handle complex nested structures', () => {
      const obj1 = {
        name: 'John',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'New York',
          zip: '10001'
        },
        hobbies: ['reading', 'swimming'],
        metadata: {
          created: new Date('2023-01-01'),
          updated: new Date('2023-01-01')
        }
      };

      const obj2 = {
        name: 'John',
        age: 31,
        address: {
          street: '123 Main St',
          city: 'Boston',
          zip: '02101'
        },
        hobbies: ['reading', 'running'],
        metadata: {
          created: new Date('2023-01-01'),
          updated: new Date('2023-01-02')
        }
      };

      const expected = {
        'age': { oldValue: 30, newValue: 31 },
        'address.city': { oldValue: 'New York', newValue: 'Boston' },
        'address.zip': { oldValue: '10001', newValue: '02101' },
        'hobbies[1]': { oldValue: 'swimming', newValue: 'running' },
        'metadata.updated': { oldValue: new Date('2023-01-01'), newValue: new Date('2023-01-02') }
      };

      expect(getDifferences(obj1, obj2)).toEqual(expected);
    });
  });
});