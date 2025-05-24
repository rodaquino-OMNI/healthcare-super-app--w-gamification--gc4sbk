import * as objectUtils from '../../../src/object';
import * as transformUtils from '../../../src/object/transform';
import * as comparisonUtils from '../../../src/object/comparison';
import * as mergeUtils from '../../../src/object/merge';
import * as cloneUtils from '../../../src/object/clone';

describe('Object Utils Barrel File', () => {
  describe('Transform Utilities', () => {
    it('should export all transform utilities', () => {
      // Get all named exports from transform module
      const transformExports = Object.keys(transformUtils);
      
      // Verify each export is available in the barrel file
      transformExports.forEach(exportName => {
        expect(objectUtils).toHaveProperty(exportName);
        expect(objectUtils[exportName]).toBe(transformUtils[exportName]);
      });
    });

    it('should maintain function implementations', () => {
      // Verify specific transform functions (assuming these exist based on the summary)
      const testObj = { a: 1, b: 2, c: 3 };
      
      // Test pick function if it exists
      if ('pick' in transformUtils) {
        const directResult = transformUtils.pick(testObj, ['a', 'b']);
        const barrelResult = objectUtils.pick(testObj, ['a', 'b']);
        expect(barrelResult).toEqual(directResult);
        expect(barrelResult).toEqual({ a: 1, b: 2 });
      }
      
      // Test omit function if it exists
      if ('omit' in transformUtils) {
        const directResult = transformUtils.omit(testObj, ['c']);
        const barrelResult = objectUtils.omit(testObj, ['c']);
        expect(barrelResult).toEqual(directResult);
        expect(barrelResult).toEqual({ a: 1, b: 2 });
      }
    });
  });

  describe('Comparison Utilities', () => {
    it('should export all comparison utilities', () => {
      // Get all named exports from comparison module
      const comparisonExports = Object.keys(comparisonUtils);
      
      // Verify each export is available in the barrel file
      comparisonExports.forEach(exportName => {
        expect(objectUtils).toHaveProperty(exportName);
        expect(objectUtils[exportName]).toBe(comparisonUtils[exportName]);
      });
    });

    it('should maintain function implementations', () => {
      // Verify specific comparison functions (assuming these exist based on the summary)
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      const obj3 = { a: 1, b: { c: 3 } };
      
      // Test isEqual function if it exists
      if ('isEqual' in comparisonUtils) {
        expect(objectUtils.isEqual(obj1, obj2)).toBe(comparisonUtils.isEqual(obj1, obj2));
        expect(objectUtils.isEqual(obj1, obj3)).toBe(comparisonUtils.isEqual(obj1, obj3));
      }
      
      // Test getDifferences function if it exists
      if ('getDifferences' in comparisonUtils) {
        const directResult = comparisonUtils.getDifferences(obj1, obj3);
        const barrelResult = objectUtils.getDifferences(obj1, obj3);
        expect(barrelResult).toEqual(directResult);
      }
    });
  });

  describe('Merge Utilities', () => {
    it('should export all merge utilities', () => {
      // Get all named exports from merge module
      const mergeExports = Object.keys(mergeUtils);
      
      // Verify each export is available in the barrel file
      mergeExports.forEach(exportName => {
        expect(objectUtils).toHaveProperty(exportName);
        expect(objectUtils[exportName]).toBe(mergeUtils[exportName]);
      });
    });

    it('should maintain function implementations', () => {
      // Verify specific merge functions (assuming these exist based on the summary)
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { b: { d: 3 }, e: 4 };
      
      // Test deepMerge function if it exists
      if ('deepMerge' in mergeUtils) {
        const directResult = mergeUtils.deepMerge(obj1, obj2);
        const barrelResult = objectUtils.deepMerge(obj1, obj2);
        expect(barrelResult).toEqual(directResult);
        expect(barrelResult).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
      }
    });
  });

  describe('Clone Utilities', () => {
    it('should export all clone utilities', () => {
      // Get all named exports from clone module
      const cloneExports = Object.keys(cloneUtils);
      
      // Verify each export is available in the barrel file
      cloneExports.forEach(exportName => {
        expect(objectUtils).toHaveProperty(exportName);
        expect(objectUtils[exportName]).toBe(cloneUtils[exportName]);
      });
    });

    it('should maintain function implementations', () => {
      // Verify specific clone functions (assuming these exist based on the summary)
      const original = { a: 1, b: { c: 2 }, d: [1, 2, 3] };
      
      // Test deepClone function if it exists
      if ('deepClone' in cloneUtils) {
        const directResult = cloneUtils.deepClone(original);
        const barrelResult = objectUtils.deepClone(original);
        
        expect(barrelResult).toEqual(directResult);
        expect(barrelResult).toEqual(original);
        expect(barrelResult).not.toBe(original); // Should be a new object reference
        
        // Modify the clone and verify original is unchanged
        barrelResult.b.c = 99;
        expect(original.b.c).toBe(2);
      }
      
      // Test structuredClone function if it exists
      if ('structuredClone' in cloneUtils) {
        const directResult = cloneUtils.structuredClone(original);
        const barrelResult = objectUtils.structuredClone(original);
        
        expect(barrelResult).toEqual(directResult);
        expect(barrelResult).toEqual(original);
        expect(barrelResult).not.toBe(original); // Should be a new object reference
      }
    });
  });

  describe('Type Definitions', () => {
    it('should preserve type definitions from individual modules', () => {
      // This test is a compile-time check, not a runtime check
      // TypeScript will fail to compile if the types are not correctly exported
      
      // We can do a simple runtime check to ensure the functions exist
      // but the real test is that this file compiles successfully
      expect(typeof objectUtils).toBe('object');
      
      // Check for common utility functions
      ['pick', 'omit', 'isEqual', 'deepMerge', 'deepClone'].forEach(fnName => {
        if (fnName in objectUtils) {
          expect(typeof objectUtils[fnName]).toBe('function');
        }
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should support existing import patterns', () => {
      // Verify that the barrel file exports match the direct imports
      // This ensures backward compatibility with existing code
      
      const barrelExports = Object.keys(objectUtils);
      const directExports = [
        ...Object.keys(transformUtils),
        ...Object.keys(comparisonUtils),
        ...Object.keys(mergeUtils),
        ...Object.keys(cloneUtils)
      ];
      
      // Check that all direct exports are available in the barrel
      directExports.forEach(exportName => {
        expect(barrelExports).toContain(exportName);
      });
      
      // Check that the barrel doesn't have extra exports not in the direct modules
      barrelExports.forEach(exportName => {
        expect(directExports).toContain(exportName);
      });
    });
  });

  describe('Named Exports', () => {
    it('should provide named exports for tree-shaking support', () => {
      // Verify that all exports are named exports (not default exports)
      // This ensures proper tree-shaking support
      
      expect(objectUtils).not.toHaveProperty('default');
      
      // Check that all exports from individual modules are available
      const allDirectExports = [
        ...Object.keys(transformUtils),
        ...Object.keys(comparisonUtils),
        ...Object.keys(mergeUtils),
        ...Object.keys(cloneUtils)
      ];
      
      // Remove duplicates (in case multiple modules export the same name)
      const uniqueDirectExports = [...new Set(allDirectExports)];
      
      uniqueDirectExports.forEach(exportName => {
        expect(objectUtils).toHaveProperty(exportName);
      });
    });
  });
});