import { deepMerge } from '../../../src/object/merge';

describe('Object Merge Utilities', () => {
  describe('deepMerge', () => {
    // Basic merging tests
    describe('basic merging', () => {
      it('should merge two shallow objects correctly', () => {
        const obj1 = { a: 1, b: 2 };
        const obj2 = { b: 3, c: 4 };
        const result = deepMerge(obj1, obj2);

        expect(result).toEqual({ a: 1, b: 3, c: 4 });
        // Ensure original objects are not modified
        expect(obj1).toEqual({ a: 1, b: 2 });
        expect(obj2).toEqual({ b: 3, c: 4 });
      });

      it('should merge multiple objects from left to right', () => {
        const obj1 = { a: 1, b: 2 };
        const obj2 = { b: 3, c: 4 };
        const obj3 = { c: 5, d: 6 };
        const result = deepMerge(obj1, obj2, obj3);

        expect(result).toEqual({ a: 1, b: 3, c: 5, d: 6 });
      });

      it('should return a new object even when only one object is provided', () => {
        const obj = { a: 1, b: 2 };
        const result = deepMerge(obj);

        expect(result).toEqual(obj);
        expect(result).not.toBe(obj); // Should be a new reference
      });

      it('should handle primitive values in source objects', () => {
        const obj1 = { a: 1, b: 'string', c: true };
        const obj2 = { b: 'new string', d: false };
        const result = deepMerge(obj1, obj2);

        expect(result).toEqual({ a: 1, b: 'new string', c: true, d: false });
      });
    });

    // Deep merging tests
    describe('deep merging', () => {
      it('should merge nested objects recursively', () => {
        const obj1 = { a: { b: 1, c: 2 }, d: 3 };
        const obj2 = { a: { c: 4, e: 5 }, f: 6 };
        const result = deepMerge(obj1, obj2);

        expect(result).toEqual({ a: { b: 1, c: 4, e: 5 }, d: 3, f: 6 });
      });

      it('should handle deeply nested objects', () => {
        const obj1 = { a: { b: { c: { d: 1 } } } };
        const obj2 = { a: { b: { c: { e: 2 } } } };
        const obj3 = { a: { b: { f: 3 } } };
        const result = deepMerge(obj1, obj2, obj3);

        expect(result).toEqual({ a: { b: { c: { d: 1, e: 2 }, f: 3 } } });
      });

      it('should merge nested objects even when they only exist in one source', () => {
        const obj1 = { a: { b: 1 } };
        const obj2 = { c: { d: 2 } };
        const result = deepMerge(obj1, obj2);

        expect(result).toEqual({ a: { b: 1 }, c: { d: 2 } });
      });
    });

    // Array handling tests
    describe('array handling', () => {
      it('should replace arrays by default', () => {
        const obj1 = { a: [1, 2, 3] };
        const obj2 = { a: [4, 5] };
        const result = deepMerge(obj1, obj2);

        expect(result.a).toEqual([4, 5]);
      });

      it('should combine arrays when using combine option', () => {
        const obj1 = { a: [1, 2, 3] };
        const obj2 = { a: [4, 5] };
        const result = deepMerge(obj1, obj2, { arrays: 'combine' });

        // Should contain all unique elements from both arrays
        expect(result.a).toEqual(expect.arrayContaining([1, 2, 3, 4, 5]));
        expect(result.a.length).toBe(5);
      });

      it('should append arrays when using append option', () => {
        const obj1 = { a: [1, 2, 3] };
        const obj2 = { a: [4, 5] };
        const result = deepMerge(obj1, obj2, { arrays: 'append' });

        expect(result.a).toEqual([1, 2, 3, 4, 5]);
      });

      it('should handle arrays of objects with proper merging', () => {
        const obj1 = { a: [{ id: 1, value: 'a' }, { id: 2, value: 'b' }] };
        const obj2 = { a: [{ id: 2, name: 'B' }, { id: 3, value: 'c' }] };
        
        // With replace option (default)
        const resultReplace = deepMerge(obj1, obj2);
        expect(resultReplace.a).toEqual([{ id: 2, name: 'B' }, { id: 3, value: 'c' }]);
        
        // With append option
        const resultAppend = deepMerge(obj1, obj2, { arrays: 'append' });
        expect(resultAppend.a).toEqual([
          { id: 1, value: 'a' }, 
          { id: 2, value: 'b' },
          { id: 2, name: 'B' }, 
          { id: 3, value: 'c' }
        ]);
      });

      it('should handle nested arrays', () => {
        const obj1 = { a: { b: [1, 2, [3, 4]] } };
        const obj2 = { a: { b: [5, [6, 7]] } };
        
        // With replace option (default)
        const resultReplace = deepMerge(obj1, obj2);
        expect(resultReplace.a.b).toEqual([5, [6, 7]]);
        
        // With append option
        const resultAppend = deepMerge(obj1, obj2, { arrays: 'append' });
        expect(resultAppend.a.b).toEqual([1, 2, [3, 4], 5, [6, 7]]);
      });
    });

    // Conflicting property types tests
    describe('conflicting property types', () => {
      it('should handle conflicting property types by using the latter value', () => {
        const obj1 = { a: { b: 1 } };
        const obj2 = { a: 'string' };
        const result = deepMerge(obj1, obj2);

        expect(result.a).toBe('string');
      });

      it('should handle object replacing primitive and vice versa', () => {
        const obj1 = { a: 1, b: { c: 2 } };
        const obj2 = { a: { d: 3 }, b: 4 };
        const result = deepMerge(obj1, obj2);

        expect(result).toEqual({ a: { d: 3 }, b: 4 });
      });

      it('should handle array replacing object and vice versa', () => {
        const obj1 = { a: [1, 2], b: { c: 3 } };
        const obj2 = { a: { d: 4 }, b: [5, 6] };
        const result = deepMerge(obj1, obj2);

        expect(result).toEqual({ a: { d: 4 }, b: [5, 6] });
      });

      it('should handle null and undefined values correctly', () => {
        const obj1 = { a: null, b: undefined, c: 1 };
        const obj2 = { a: 2, b: 3, c: undefined };
        const result = deepMerge(obj1, obj2);

        expect(result).toEqual({ a: 2, b: 3, c: undefined });
      });
    });

    // Circular reference tests
    describe('circular reference handling', () => {
      it('should detect and handle circular references', () => {
        const obj1: any = { a: 1 };
        obj1.self = obj1; // Circular reference

        const obj2 = { b: 2 };
        const result = deepMerge(obj1, obj2);

        expect(result.a).toBe(1);
        expect(result.b).toBe(2);
        expect(result.self).toBe(result); // Circular reference should be preserved
      });

      it('should handle nested circular references', () => {
        const obj1: any = { a: { b: 1 } };
        obj1.a.parent = obj1; // Nested circular reference

        const obj2 = { c: 2 };
        const result = deepMerge(obj1, obj2);

        expect(result.a.b).toBe(1);
        expect(result.c).toBe(2);
        expect(result.a.parent).toBe(result); // Circular reference should be preserved
      });

      it('should handle circular references in arrays', () => {
        const obj1: any = { a: [1, 2] };
        obj1.a.push(obj1); // Circular reference in array

        const obj2 = { b: 3 };
        const result = deepMerge(obj1, obj2);

        expect(result.a[0]).toBe(1);
        expect(result.a[1]).toBe(2);
        expect(result.a[2]).toBe(result); // Circular reference should be preserved
        expect(result.b).toBe(3);
      });
    });

    // Edge cases tests
    describe('edge cases', () => {
      it('should handle empty objects', () => {
        const obj1 = {};
        const obj2 = {};
        const result = deepMerge(obj1, obj2);

        expect(result).toEqual({});
      });

      it('should handle null or undefined sources', () => {
        const obj = { a: 1 };
        const result1 = deepMerge(obj, null);
        const result2 = deepMerge(obj, undefined);

        expect(result1).toEqual(obj);
        expect(result2).toEqual(obj);
      });

      it('should handle all null or undefined sources', () => {
        const result = deepMerge(null, undefined);
        expect(result).toEqual({});
      });

      it('should handle non-object sources', () => {
        const obj = { a: 1 };
        // @ts-expect-error Testing with invalid input
        const result1 = deepMerge(obj, 'string');
        // @ts-expect-error Testing with invalid input
        const result2 = deepMerge(obj, 123);

        expect(result1).toEqual(obj);
        expect(result2).toEqual(obj);
      });

      it('should handle Date objects', () => {
        const date1 = new Date('2023-01-01');
        const date2 = new Date('2023-02-01');
        const obj1 = { date: date1 };
        const obj2 = { date: date2 };
        const result = deepMerge(obj1, obj2);

        expect(result.date).toEqual(date2);
        expect(result.date).not.toBe(date1);
        expect(result.date).toBe(date2);
      });

      it('should handle RegExp objects', () => {
        const regex1 = /test1/;
        const regex2 = /test2/g;
        const obj1 = { regex: regex1 };
        const obj2 = { regex: regex2 };
        const result = deepMerge(obj1, obj2);

        expect(result.regex).toEqual(regex2);
        expect(result.regex).not.toBe(regex1);
        expect(result.regex).toBe(regex2);
      });

      it('should handle functions', () => {
        const fn1 = () => 'test1';
        const fn2 = () => 'test2';
        const obj1 = { fn: fn1 };
        const obj2 = { fn: fn2 };
        const result = deepMerge(obj1, obj2);

        expect(result.fn).toBe(fn2);
        expect(result.fn()).toBe('test2');
      });

      it('should handle Map and Set objects', () => {
        const map1 = new Map([['a', 1]]);
        const map2 = new Map([['b', 2]]);
        const set1 = new Set([1, 2]);
        const set2 = new Set([3, 4]);
        
        const obj1 = { map: map1, set: set1 };
        const obj2 = { map: map2, set: set2 };
        const result = deepMerge(obj1, obj2);

        expect(result.map).toBe(map2);
        expect(result.set).toBe(set2);
      });

      it('should handle property overwrites with undefined', () => {
        const obj1 = { a: 1, b: 2 };
        const obj2 = { a: undefined };
        const result = deepMerge(obj1, obj2);

        expect(result).toEqual({ a: undefined, b: 2 });
        expect(result).toHaveProperty('a');
        expect(result.a).toBeUndefined();
      });
    });

    // Performance considerations
    describe('performance considerations', () => {
      it('should handle large objects efficiently', () => {
        // Create a large object with many nested properties
        const createLargeObject = (prefix: string, depth: number, breadth: number): Record<string, any> => {
          if (depth <= 0) return { [`${prefix}_value`]: Math.random() };
          
          const obj: Record<string, any> = {};
          for (let i = 0; i < breadth; i++) {
            obj[`${prefix}_${i}`] = createLargeObject(`${prefix}_${i}`, depth - 1, breadth);
          }
          return obj;
        };

        const largeObj1 = createLargeObject('obj1', 3, 5);
        const largeObj2 = createLargeObject('obj2', 3, 5);

        // This is more of a smoke test to ensure it doesn't crash or timeout
        const start = Date.now();
        const result = deepMerge(largeObj1, largeObj2);
        const end = Date.now();

        expect(result).toBeTruthy();
        expect(end - start).toBeLessThan(1000); // Should complete in less than 1 second
      });
    });

    // Custom merge options tests
    describe('custom merge options', () => {
      it('should respect custom merge options for arrays', () => {
        const obj1 = { a: [1, 2, 3] };
        const obj2 = { a: [4, 5] };
        
        // Test with replace option
        const resultReplace = deepMerge(obj1, obj2, { arrays: 'replace' });
        expect(resultReplace.a).toEqual([4, 5]);
        
        // Test with combine option
        const resultCombine = deepMerge(obj1, obj2, { arrays: 'combine' });
        expect(resultCombine.a.length).toBe(5);
        expect(resultCombine.a).toEqual(expect.arrayContaining([1, 2, 3, 4, 5]));
        
        // Test with append option
        const resultAppend = deepMerge(obj1, obj2, { arrays: 'append' });
        expect(resultAppend.a).toEqual([1, 2, 3, 4, 5]);
      });

      it('should handle custom merge depth option', () => {
        const obj1 = { a: { b: { c: 1, d: 2 }, e: 3 } };
        const obj2 = { a: { b: { c: 4, f: 5 }, g: 6 } };
        
        // With unlimited depth (default)
        const resultUnlimited = deepMerge(obj1, obj2);
        expect(resultUnlimited).toEqual({ a: { b: { c: 4, d: 2, f: 5 }, e: 3, g: 6 } });
        
        // With depth = 1 (only merge top level)
        const resultDepth1 = deepMerge(obj1, obj2, { depth: 1 });
        expect(resultDepth1).toEqual({ a: { b: { c: 4, f: 5 }, g: 6 } });
        
        // With depth = 2 (merge up to second level)
        const resultDepth2 = deepMerge(obj1, obj2, { depth: 2 });
        expect(resultDepth2).toEqual({ a: { b: { c: 4, f: 5 }, e: 3, g: 6 } });
      });
    });
  });
});