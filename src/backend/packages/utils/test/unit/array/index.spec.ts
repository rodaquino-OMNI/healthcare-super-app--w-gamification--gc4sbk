/**
 * Unit tests for the array utilities index file.
 * These tests verify that all array utility functions are properly exported
 * through the index file, maintaining a clean and consistent public API.
 */

import * as arrayUtils from '../../../src/array';
import * as chunkUtils from '../../../src/array/chunk.util';
import * as filterUtils from '../../../src/array/filter.util';
import * as groupUtils from '../../../src/array/group.util';
import * as transformUtils from '../../../src/array/transform.util';

describe('Array Utilities Index', () => {
  describe('Exports from chunk.util.ts', () => {
    const chunkFunctions = [
      'chunk',
      'chunkBySize',
      'chunkByPredicate',
      'chunkByKey',
      'chunkForParallel'
    ];

    it.each(chunkFunctions)('should export %s function', (functionName) => {
      // Check that the function is exported
      expect(arrayUtils).toHaveProperty(functionName);
      
      // Check that the exported function is the same as the original
      expect(arrayUtils[functionName]).toBe(chunkUtils[functionName]);
      
      // Check that the function is actually a function
      expect(typeof arrayUtils[functionName]).toBe('function');
    });

    it('should export all functions from chunk.util.ts', () => {
      // Get all exported functions from chunk.util.ts
      const exportedFunctions = Object.keys(chunkUtils);
      
      // Check that all functions are exported
      expect(exportedFunctions.sort()).toEqual(chunkFunctions.sort());
    });
  });

  describe('Exports from filter.util.ts', () => {
    const filterFunctions = [
      'uniqueBy',
      'filterByProperties',
      'rejectByProperties',
      'differenceBy',
      'intersectionBy',
      'compact',
      'filterWithRejections'
    ];

    it.each(filterFunctions)('should export %s function', (functionName) => {
      // Check that the function is exported
      expect(arrayUtils).toHaveProperty(functionName);
      
      // Check that the exported function is the same as the original
      expect(arrayUtils[functionName]).toBe(filterUtils[functionName]);
      
      // Check that the function is actually a function
      expect(typeof arrayUtils[functionName]).toBe('function');
    });

    it('should export all functions from filter.util.ts', () => {
      // Get all exported functions from filter.util.ts (excluding types)
      const exportedFunctions = Object.keys(filterUtils);
      
      // Check that all functions are exported
      expect(exportedFunctions.sort()).toEqual(filterFunctions.sort());
    });

    it('should export PropertyMatcher and FilterProperties types', () => {
      // We can't directly test type exports in runtime JavaScript,
      // but we can verify the module structure includes type exports
      const moduleString = arrayUtils.toString();
      
      // Check for type export statements in the module string
      expect(moduleString).toContain('PropertyMatcher');
      expect(moduleString).toContain('FilterProperties');
    });
  });

  describe('Exports from group.util.ts', () => {
    const groupFunctions = [
      'groupBy',
      'partitionBy',
      'keyBy',
      'countBy'
    ];

    it.each(groupFunctions)('should export %s function', (functionName) => {
      // Check that the function is exported
      expect(arrayUtils).toHaveProperty(functionName);
      
      // Check that the exported function is the same as the original
      expect(arrayUtils[functionName]).toBe(groupUtils[functionName]);
      
      // Check that the function is actually a function
      expect(typeof arrayUtils[functionName]).toBe('function');
    });

    it('should export all functions from group.util.ts', () => {
      // Get all exported functions from group.util.ts
      const exportedFunctions = Object.keys(groupUtils);
      
      // Check that all functions are exported
      expect(exportedFunctions.sort()).toEqual(groupFunctions.sort());
    });
  });

  describe('Exports from transform.util.ts', () => {
    const transformFunctions = [
      'flattenDeep',
      'mapByKey',
      'indexBy',
      'pluck',
      'nestByKeys'
    ];

    it.each(transformFunctions)('should export %s function', (functionName) => {
      // Check that the function is exported
      expect(arrayUtils).toHaveProperty(functionName);
      
      // Check that the exported function is the same as the original
      expect(arrayUtils[functionName]).toBe(transformUtils[functionName]);
      
      // Check that the function is actually a function
      expect(typeof arrayUtils[functionName]).toBe('function');
    });

    it('should export all functions from transform.util.ts', () => {
      // Get all exported functions from transform.util.ts
      const exportedFunctions = Object.keys(transformUtils);
      
      // Check that all functions are exported
      expect(exportedFunctions.sort()).toEqual(transformFunctions.sort());
    });

    it('should correctly re-export indexBy from transform.util.ts', () => {
      // Check that indexBy is exported
      expect(arrayUtils).toHaveProperty('indexBy');
      
      // Check that the exported function is the same as the original
      expect(arrayUtils.indexBy).toBe(transformUtils.indexBy);
    });
  });

  describe('Integration tests', () => {
    it('should be able to use exported functions together', () => {
      // Create a test array
      const testArray = [
        { id: 1, category: 'health', value: 75 },
        { id: 2, category: 'health', value: 80 },
        { id: 3, category: 'care', value: 90 },
        { id: 4, category: 'care', value: 85 }
      ];
      
      // Group by category
      const grouped = arrayUtils.groupBy(testArray, 'category');
      
      // Chunk the health category items
      const chunkedHealth = arrayUtils.chunk(grouped['health'], 1);
      
      // Filter care items by value
      const filteredCare = arrayUtils.filterByProperties(grouped['care'], { value: { gt: 85 } });
      
      // Verify results
      expect(chunkedHealth).toHaveLength(2);
      expect(chunkedHealth[0]).toEqual([{ id: 1, category: 'health', value: 75 }]);
      expect(filteredCare).toHaveLength(1);
      expect(filteredCare[0]).toEqual({ id: 3, category: 'care', value: 90 });
    });

    it('should be able to use exported types for type safety', () => {
      // This is a compile-time test, but we can verify the structure
      // Define a filter properties object using the exported type
      const filterProps: arrayUtils.FilterProperties<{ id: number; value: number }> = {
        id: { gt: 5 },
        value: { between: [10, 20] }
      };
      
      // Verify the structure of the filter properties object
      expect(filterProps).toHaveProperty('id');
      expect(filterProps).toHaveProperty('value');
      expect(filterProps.id).toHaveProperty('gt', 5);
      expect(filterProps.value).toHaveProperty('between');
      expect(filterProps.value.between).toEqual([10, 20]);
    });
  });

  describe('Documentation', () => {
    it('should preserve JSDoc comments for exported functions', () => {
      // Convert the module to string to check for JSDoc comments
      const moduleString = arrayUtils.toString();
      
      // Check for JSDoc comment markers in the module string
      expect(moduleString).toContain('/**');
      expect(moduleString).toContain('*/');
      
      // Check for specific documentation sections
      expect(moduleString).toContain('@module array');
      expect(moduleString).toContain('Chunking utilities');
      expect(moduleString).toContain('Filtering utilities');
      expect(moduleString).toContain('Grouping utilities');
      expect(moduleString).toContain('Transformation utilities');
    });
  });

  describe('API Consistency', () => {
    it('should maintain consistent function signatures', () => {
      // Test a sample of functions to ensure they maintain their expected signatures
      
      // Test chunk function signature
      const chunkedArray = arrayUtils.chunk([1, 2, 3, 4, 5], 2);
      expect(chunkedArray).toEqual([[1, 2], [3, 4], [5]]);
      
      // Test uniqueBy function signature
      const uniqueArray = arrayUtils.uniqueBy([1, 2, 2, 3, 1, 4]);
      expect(uniqueArray).toEqual([1, 2, 3, 4]);
      
      // Test groupBy function signature
      const groupedArray = arrayUtils.groupBy([{ id: 1, type: 'A' }, { id: 2, type: 'B' }, { id: 3, type: 'A' }], 'type');
      expect(groupedArray).toEqual({
        'A': [{ id: 1, type: 'A' }, { id: 3, type: 'A' }],
        'B': [{ id: 2, type: 'B' }]
      });
      
      // Test flattenDeep function signature
      const flattenedArray = arrayUtils.flattenDeep([1, [2, [3, 4], 5], 6]);
      expect(flattenedArray).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should handle error cases consistently', () => {
      // Test error handling for a sample of functions
      
      // Test chunk function error handling
      expect(() => arrayUtils.chunk(null as any, 2)).toThrow();
      expect(() => arrayUtils.chunk([1, 2, 3], 0)).toThrow();
      
      // Test uniqueBy function error handling
      expect(() => arrayUtils.uniqueBy(null as any)).toThrow();
      
      // Test groupBy function error handling
      expect(() => arrayUtils.groupBy(null as any, 'type')).toThrow();
      
      // Test flattenDeep function error handling
      expect(() => arrayUtils.flattenDeep(null as any)).toThrow();
    });
  });
});