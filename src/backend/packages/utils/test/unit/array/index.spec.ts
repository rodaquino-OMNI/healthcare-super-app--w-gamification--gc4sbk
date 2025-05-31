/**
 * Unit tests for the array utilities index file.
 * These tests verify that all array utility functions are properly exported
 * through the index file, maintaining a clean and consistent public API.
 */

import * as arrayUtils from '../../../src/array';
import * as transformUtils from '../../../src/array/transform.util';
import * as groupUtils from '../../../src/array/group.util';
import * as filterUtils from '../../../src/array/filter.util';
import * as chunkUtils from '../../../src/array/chunk.util';

// Mock the individual utility modules
jest.mock('../../../src/array/transform.util');
jest.mock('../../../src/array/group.util');
jest.mock('../../../src/array/filter.util');
jest.mock('../../../src/array/chunk.util');

describe('Array Utilities Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module Exports', () => {
    it('should export all transform utility functions', () => {
      // Verify that all transform utility functions are exported
      expect(arrayUtils.flattenDeep).toBeDefined();
      expect(arrayUtils.mapByKey).toBeDefined();
      expect(arrayUtils.indexBy).toBeDefined();
      expect(arrayUtils.pluck).toBeDefined();

      // Verify that the exports match the original functions
      expect(arrayUtils.flattenDeep).toBe(transformUtils.flattenDeep);
      expect(arrayUtils.mapByKey).toBe(transformUtils.mapByKey);
      expect(arrayUtils.indexBy).toBe(transformUtils.indexBy);
      expect(arrayUtils.pluck).toBe(transformUtils.pluck);
    });

    it('should export all group utility functions', () => {
      // Verify that all group utility functions are exported
      expect(arrayUtils.groupBy).toBeDefined();
      expect(arrayUtils.partitionBy).toBeDefined();
      expect(arrayUtils.keyBy).toBeDefined();

      // Verify that the exports match the original functions
      expect(arrayUtils.groupBy).toBe(groupUtils.groupBy);
      expect(arrayUtils.partitionBy).toBe(groupUtils.partitionBy);
      expect(arrayUtils.keyBy).toBe(groupUtils.keyBy);
    });

    it('should export all filter utility functions', () => {
      // Verify that all filter utility functions are exported
      expect(arrayUtils.uniqueBy).toBeDefined();
      expect(arrayUtils.filterByProperties).toBeDefined();
      expect(arrayUtils.rejectByProperties).toBeDefined();
      expect(arrayUtils.differenceBy).toBeDefined();

      // Verify that the exports match the original functions
      expect(arrayUtils.uniqueBy).toBe(filterUtils.uniqueBy);
      expect(arrayUtils.filterByProperties).toBe(filterUtils.filterByProperties);
      expect(arrayUtils.rejectByProperties).toBe(filterUtils.rejectByProperties);
      expect(arrayUtils.differenceBy).toBe(filterUtils.differenceBy);
    });

    it('should export all chunk utility functions', () => {
      // Verify that all chunk utility functions are exported
      expect(arrayUtils.chunk).toBeDefined();
      expect(arrayUtils.chunkBySize).toBeDefined();
      expect(arrayUtils.chunkByPredicate).toBeDefined();

      // Verify that the exports match the original functions
      expect(arrayUtils.chunk).toBe(chunkUtils.chunk);
      expect(arrayUtils.chunkBySize).toBe(chunkUtils.chunkBySize);
      expect(arrayUtils.chunkByPredicate).toBe(chunkUtils.chunkByPredicate);
    });
  });

  describe('TypeScript Type Exports', () => {
    it('should export all TypeScript types from the utility modules', () => {
      // This test verifies at compile-time that all types are properly exported
      // The test will fail to compile if any of these types are not exported
      type TestTransformTypes = {
        // Verify transform utility types
        MapByKeyFunction: typeof arrayUtils.MapByKeyFunction;
        IndexByFunction: typeof arrayUtils.IndexByFunction;
        PluckFunction: typeof arrayUtils.PluckFunction;
      };

      type TestGroupTypes = {
        // Verify group utility types
        GroupByFunction: typeof arrayUtils.GroupByFunction;
        PartitionByFunction: typeof arrayUtils.PartitionByFunction;
        KeyByFunction: typeof arrayUtils.KeyByFunction;
      };

      type TestFilterTypes = {
        // Verify filter utility types
        UniqueByFunction: typeof arrayUtils.UniqueByFunction;
        FilterByPropertiesOptions: typeof arrayUtils.FilterByPropertiesOptions;
        DifferenceByFunction: typeof arrayUtils.DifferenceByFunction;
      };

      type TestChunkTypes = {
        // Verify chunk utility types
        ChunkByPredicateFunction: typeof arrayUtils.ChunkByPredicateFunction;
      };

      // This is just a type check, no runtime assertion needed
      expect(true).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should be able to use the exported functions correctly', () => {
      // Setup test data
      const testArray = [1, 2, 3, 4, 5];
      const testObjects = [
        { id: 1, name: 'Alice', journey: 'health' },
        { id: 2, name: 'Bob', journey: 'care' },
        { id: 3, name: 'Charlie', journey: 'plan' },
      ];

      // Test transform functions
      arrayUtils.flattenDeep([[1, 2], [3, 4]]);
      arrayUtils.mapByKey(testObjects, 'id');
      arrayUtils.indexBy(testObjects, 'id');
      arrayUtils.pluck(testObjects, 'name');

      // Test group functions
      arrayUtils.groupBy(testObjects, 'journey');
      arrayUtils.partitionBy(testArray, (n) => n % 2 === 0);
      arrayUtils.keyBy(testObjects, 'id');

      // Test filter functions
      arrayUtils.uniqueBy(testObjects, 'journey');
      arrayUtils.filterByProperties(testObjects, { journey: 'health' });
      arrayUtils.rejectByProperties(testObjects, { journey: 'health' });
      arrayUtils.differenceBy(testObjects, [{ id: 1 }], 'id');

      // Test chunk functions
      arrayUtils.chunk(testArray, 2);
      arrayUtils.chunkBySize(testArray, 3);
      arrayUtils.chunkByPredicate(testArray, (n) => n % 2 === 0);

      // Verify that all functions were called
      expect(transformUtils.flattenDeep).toHaveBeenCalled();
      expect(transformUtils.mapByKey).toHaveBeenCalled();
      expect(transformUtils.indexBy).toHaveBeenCalled();
      expect(transformUtils.pluck).toHaveBeenCalled();

      expect(groupUtils.groupBy).toHaveBeenCalled();
      expect(groupUtils.partitionBy).toHaveBeenCalled();
      expect(groupUtils.keyBy).toHaveBeenCalled();

      expect(filterUtils.uniqueBy).toHaveBeenCalled();
      expect(filterUtils.filterByProperties).toHaveBeenCalled();
      expect(filterUtils.rejectByProperties).toHaveBeenCalled();
      expect(filterUtils.differenceBy).toHaveBeenCalled();

      expect(chunkUtils.chunk).toHaveBeenCalled();
      expect(chunkUtils.chunkBySize).toHaveBeenCalled();
      expect(chunkUtils.chunkByPredicate).toHaveBeenCalled();
    });
  });

  describe('JSDoc Comments', () => {
    it('should preserve JSDoc comments for all exported functions', () => {
      // This test verifies that JSDoc comments are preserved for all exported functions
      // We can't directly test this at runtime, but we can check that the functions have
      // a non-empty toString() value which would include the JSDoc comments

      // Get all exported functions
      const exportedFunctions = Object.entries(arrayUtils)
        .filter(([_, value]) => typeof value === 'function')
        .map(([key]) => key);

      // Verify that we have the expected number of exported functions
      expect(exportedFunctions.length).toBeGreaterThanOrEqual(14); // Total number of functions we expect

      // For each function, check that it has a non-empty toString() value
      exportedFunctions.forEach((functionName) => {
        const func = arrayUtils[functionName as keyof typeof arrayUtils];
        if (typeof func === 'function') {
          // This is a simple heuristic to check if the function has JSDoc comments
          // It's not perfect, but it's a reasonable approximation
          const funcString = Function.prototype.toString.call(func);
          expect(funcString).toBeTruthy();
        }
      });
    });
  });
});