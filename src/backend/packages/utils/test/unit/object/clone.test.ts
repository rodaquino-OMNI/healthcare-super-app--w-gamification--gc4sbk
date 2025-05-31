import { deepClone, structuredClone } from '../../../src/object/clone';
import { createNestedObject, createCircularObject, createObjectWithSpecialTypes } from '../../helpers/object.helpers';

describe('Object Clone Utilities', () => {
  describe('deepClone', () => {
    describe('Basic Objects', () => {
      it('should clone a simple object', () => {
        const original = { a: 1, b: 'string', c: true };
        const cloned = deepClone(original);

        // Verify values are the same
        expect(cloned).toEqual(original);
        
        // Verify it's a different object instance
        expect(cloned).not.toBe(original);
      });

      it('should handle null and undefined values', () => {
        expect(deepClone(null)).toBeNull();
        expect(deepClone(undefined)).toBeUndefined();
      });

      it('should handle primitive values', () => {
        expect(deepClone(42)).toBe(42);
        expect(deepClone('test')).toBe('test');
        expect(deepClone(true)).toBe(true);
        expect(deepClone(Symbol('test'))).toBe(Symbol('test'));
      });
    });

    describe('Nested Objects', () => {
      it('should clone nested objects', () => {
        const original = {
          a: 1,
          b: {
            c: 2,
            d: {
              e: 3
            }
          }
        };
        const cloned = deepClone(original);

        // Verify values are the same
        expect(cloned).toEqual(original);
        
        // Verify nested objects are different instances
        expect(cloned.b).not.toBe(original.b);
        expect(cloned.b.d).not.toBe(original.b.d);
      });

      it('should handle deeply nested objects', () => {
        const original = createNestedObject(10); // Create object with 10 levels of nesting
        const cloned = deepClone(original);

        // Verify values are the same
        expect(cloned).toEqual(original);
        
        // Verify the deepest nested object is a different instance
        let originalNested = original;
        let clonedNested = cloned;
        
        for (let i = 0; i < 10; i++) {
          originalNested = originalNested.nested;
          clonedNested = clonedNested.nested;
          expect(clonedNested).not.toBe(originalNested);
        }
      });

      it('should handle modifications to the cloned object without affecting the original', () => {
        const original = { a: 1, b: { c: 2 } };
        const cloned = deepClone(original);

        // Modify the cloned object
        cloned.a = 99;
        cloned.b.c = 100;

        // Original should remain unchanged
        expect(original.a).toBe(1);
        expect(original.b.c).toBe(2);
      });
    });

    describe('Arrays', () => {
      it('should clone arrays', () => {
        const original = [1, 2, 3, 4, 5];
        const cloned = deepClone(original);

        // Verify values are the same
        expect(cloned).toEqual(original);
        
        // Verify it's a different array instance
        expect(cloned).not.toBe(original);
      });

      it('should clone arrays with objects', () => {
        const original = [{ a: 1 }, { b: 2 }];
        const cloned = deepClone(original);

        // Verify values are the same
        expect(cloned).toEqual(original);
        
        // Verify array objects are different instances
        expect(cloned[0]).not.toBe(original[0]);
        expect(cloned[1]).not.toBe(original[1]);
      });

      it('should handle nested arrays', () => {
        const original = [1, [2, [3, [4]]]];
        const cloned = deepClone(original);

        // Verify values are the same
        expect(cloned).toEqual(original);
        
        // Verify nested arrays are different instances
        expect(cloned[1]).not.toBe(original[1]);
        expect(cloned[1][1]).not.toBe(original[1][1]);
        expect(cloned[1][1][1]).not.toBe(original[1][1][1]);
      });

      it('should handle sparse arrays', () => {
        // eslint-disable-next-line no-sparse-arrays
        const original = [1, , 3];
        const cloned = deepClone(original);

        // Verify values are the same
        expect(cloned).toEqual(original);
        expect(Object.keys(cloned)).toEqual(Object.keys(original));
        expect(cloned.length).toBe(original.length);
      });
    });

    describe('Special Types', () => {
      it('should clone Date objects', () => {
        const original = new Date();
        const cloned = deepClone(original);

        // Verify values are the same
        expect(cloned).toEqual(original);
        
        // Verify it's a different Date instance
        expect(cloned).not.toBe(original);
        
        // Verify it's actually a Date object
        expect(cloned instanceof Date).toBe(true);
      });

      it('should clone RegExp objects', () => {
        const original = /test/gi;
        const cloned = deepClone(original);

        // Verify values are the same
        expect(cloned.source).toBe(original.source);
        expect(cloned.flags).toBe(original.flags);
        
        // Verify it's a different RegExp instance
        expect(cloned).not.toBe(original);
        
        // Verify it's actually a RegExp object
        expect(cloned instanceof RegExp).toBe(true);
      });

      it('should clone Map objects', () => {
        const original = new Map();
        original.set('key1', 'value1');
        original.set('key2', { nested: 'value2' });
        
        const cloned = deepClone(original);

        // Verify values are the same
        expect(Array.from(cloned.entries())).toEqual(Array.from(original.entries()));
        
        // Verify it's a different Map instance
        expect(cloned).not.toBe(original);
        
        // Verify it's actually a Map object
        expect(cloned instanceof Map).toBe(true);
        
        // Verify nested objects are cloned
        expect(cloned.get('key2')).not.toBe(original.get('key2'));
      });

      it('should clone Set objects', () => {
        const original = new Set();
        original.add('value1');
        original.add({ nested: 'value2' });
        
        const cloned = deepClone(original);

        // Verify values are the same
        expect(Array.from(cloned.values())).toEqual(Array.from(original.values()));
        
        // Verify it's a different Set instance
        expect(cloned).not.toBe(original);
        
        // Verify it's actually a Set object
        expect(cloned instanceof Set).toBe(true);
      });

      it('should handle objects with mixed special types', () => {
        const original = createObjectWithSpecialTypes();
        const cloned = deepClone(original);

        // Verify values are the same
        expect(cloned.date.getTime()).toBe(original.date.getTime());
        expect(cloned.regex.source).toBe(original.regex.source);
        expect(Array.from(cloned.map.entries())).toEqual(Array.from(original.map.entries()));
        expect(Array.from(cloned.set.values())).toEqual(Array.from(original.set.values()));
        
        // Verify instances are different
        expect(cloned.date).not.toBe(original.date);
        expect(cloned.regex).not.toBe(original.regex);
        expect(cloned.map).not.toBe(original.map);
        expect(cloned.set).not.toBe(original.set);
      });
    });

    describe('Functions', () => {
      it('should preserve functions without cloning them', () => {
        const testFn = () => 'test';
        const original = { fn: testFn };
        const cloned = deepClone(original);

        // Function references should be preserved (not cloned)
        expect(cloned.fn).toBe(original.fn);
        expect(cloned.fn()).toBe('test');
      });

      it('should handle objects with methods', () => {
        const original = {
          value: 42,
          getValue() { return this.value; }
        };
        const cloned = deepClone(original);

        // Method references should be preserved
        expect(cloned.getValue).toBe(original.getValue);
        
        // Methods should work on the cloned object
        expect(cloned.getValue()).toBe(42);
        
        // Modifying the cloned object should not affect the original
        cloned.value = 99;
        expect(cloned.getValue()).toBe(99);
        expect(original.getValue()).toBe(42);
      });
    });

    describe('Edge Cases', () => {
      it('should handle circular references', () => {
        const original = createCircularObject();
        const cloned = deepClone(original);

        // Verify the structure is maintained
        expect(cloned.child.parent).toBe(cloned);
        
        // Verify it's a different object instance
        expect(cloned).not.toBe(original);
        expect(cloned.child).not.toBe(original.child);
      });

      it('should handle maximum recursion depth', () => {
        const deeplyNested = createNestedObject(1000); // Very deep nesting
        
        // Should not throw a stack overflow error
        expect(() => deepClone(deeplyNested)).not.toThrow();
        
        const cloned = deepClone(deeplyNested);
        expect(cloned).toBeDefined();
      });

      it('should handle objects with no prototype', () => {
        const original = Object.create(null);
        original.a = 1;
        
        const cloned = deepClone(original);
        
        // Verify values are the same
        expect(cloned.a).toBe(1);
        
        // Verify it's a different object instance
        expect(cloned).not.toBe(original);
        
        // Verify it has no prototype
        expect(Object.getPrototypeOf(cloned)).toBeNull();
      });
    });
  });

  describe('structuredClone', () => {
    describe('Basic Objects', () => {
      it('should clone a simple object', () => {
        const original = { a: 1, b: 'string', c: true };
        const cloned = structuredClone(original);

        // Verify values are the same
        expect(cloned).toEqual(original);
        
        // Verify it's a different object instance
        expect(cloned).not.toBe(original);
      });

      it('should handle null and undefined values', () => {
        expect(structuredClone(null)).toBeNull();
        expect(structuredClone(undefined)).toBeUndefined();
      });
    });

    describe('Nested Objects', () => {
      it('should clone nested objects', () => {
        const original = {
          a: 1,
          b: {
            c: 2,
            d: {
              e: 3
            }
          }
        };
        const cloned = structuredClone(original);

        // Verify values are the same
        expect(cloned).toEqual(original);
        
        // Verify nested objects are different instances
        expect(cloned.b).not.toBe(original.b);
        expect(cloned.b.d).not.toBe(original.b.d);
      });
    });

    describe('Special Types', () => {
      it('should clone Date objects', () => {
        const original = new Date();
        const cloned = structuredClone(original);

        // Verify values are the same
        expect(cloned).toEqual(original);
        
        // Verify it's a different Date instance
        expect(cloned).not.toBe(original);
        
        // Verify it's actually a Date object
        expect(cloned instanceof Date).toBe(true);
      });

      it('should clone Map objects', () => {
        const original = new Map();
        original.set('key1', 'value1');
        original.set('key2', { nested: 'value2' });
        
        const cloned = structuredClone(original);

        // Verify values are the same
        expect(Array.from(cloned.entries())).toEqual(Array.from(original.entries()));
        
        // Verify it's a different Map instance
        expect(cloned).not.toBe(original);
        
        // Verify it's actually a Map object
        expect(cloned instanceof Map).toBe(true);
      });

      it('should clone Set objects', () => {
        const original = new Set();
        original.add('value1');
        original.add({ nested: 'value2' });
        
        const cloned = structuredClone(original);

        // Verify values are the same
        expect(Array.from(cloned.values())).toEqual(Array.from(original.values()));
        
        // Verify it's a different Set instance
        expect(cloned).not.toBe(original);
        
        // Verify it's actually a Set object
        expect(cloned instanceof Set).toBe(true);
      });

      it('should handle ArrayBuffer and TypedArrays', () => {
        const buffer = new ArrayBuffer(8);
        const view = new Uint8Array(buffer);
        view[0] = 1;
        view[1] = 2;
        
        const original = { buffer, view };
        const cloned = structuredClone(original);
        
        // Verify values are the same
        expect(new Uint8Array(cloned.buffer)[0]).toBe(1);
        expect(new Uint8Array(cloned.buffer)[1]).toBe(2);
        expect(cloned.view[0]).toBe(1);
        expect(cloned.view[1]).toBe(2);
        
        // Verify they are different instances
        expect(cloned.buffer).not.toBe(original.buffer);
        expect(cloned.view).not.toBe(original.view);
      });
    });

    describe('Edge Cases', () => {
      it('should handle circular references', () => {
        const original = createCircularObject();
        const cloned = structuredClone(original);

        // Verify the structure is maintained
        expect(cloned.child.parent).toBe(cloned);
        
        // Verify it's a different object instance
        expect(cloned).not.toBe(original);
        expect(cloned.child).not.toBe(original.child);
      });

      it('should throw for non-cloneable types', () => {
        const original = {
          fn: () => 'test',
          symbol: Symbol('test')
        };
        
        // Should throw for non-cloneable types
        expect(() => structuredClone(original)).toThrow();
      });
    });
  });

  describe('Performance Comparison', () => {
    it('should measure performance of different cloning methods', () => {
      // Create a large object for performance testing
      const largeObject = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`prop${i}`] = { value: i, nested: { data: `test${i}` } };
      }

      // Measure deepClone performance
      const startDeepClone = performance.now();
      const deepCloned = deepClone(largeObject);
      const endDeepClone = performance.now();
      const deepCloneTime = endDeepClone - startDeepClone;

      // Measure structuredClone performance
      const startStructuredClone = performance.now();
      const structuredCloned = structuredClone(largeObject);
      const endStructuredClone = performance.now();
      const structuredCloneTime = endStructuredClone - startStructuredClone;

      // Measure JSON.parse/stringify performance
      const startJsonClone = performance.now();
      const jsonCloned = JSON.parse(JSON.stringify(largeObject));
      const endJsonClone = performance.now();
      const jsonCloneTime = endJsonClone - startJsonClone;

      // Log performance results
      console.log(`Performance comparison for cloning large object:`);
      console.log(`- deepClone: ${deepCloneTime.toFixed(2)}ms`);
      console.log(`- structuredClone: ${structuredCloneTime.toFixed(2)}ms`);
      console.log(`- JSON.parse/stringify: ${jsonCloneTime.toFixed(2)}ms`);

      // Verify all methods produced correct results
      expect(deepCloned).toEqual(largeObject);
      expect(structuredCloned).toEqual(largeObject);
      expect(jsonCloned).toEqual(largeObject);

      // This test doesn't assert on performance times as they can vary,
      // but logs them for manual inspection
    });
  });
});