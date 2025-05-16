/**
 * @file Unit tests for the object utilities barrel file
 * 
 * These tests verify that all object utility functions are correctly exported
 * and accessible through the barrel import. This ensures the public API for
 * object utilities is complete and properly maintained, preventing accidental
 * breaking changes to import patterns used throughout the application.
 */

// Import all functions from the barrel file
import * as objectUtils from '../../../src/object';

// Import original functions from their source files for comparison
import * as transformUtils from '../../../src/object/transform';
import * as comparisonUtils from '../../../src/object/comparison';
import * as mergeUtils from '../../../src/object/merge';
import * as cloneUtils from '../../../src/object/clone';

// Import test helpers
import { 
  createObjectWithProperties,
  createMergeTestObjects,
  createCloneTestObject
} from '../../helpers/object.helpers';

describe('Object Utilities Barrel File', () => {
  describe('Exports all expected functions', () => {
    test('exports all transform utilities', () => {
      // Get all named exports from the transform module
      const transformExports = Object.keys(transformUtils);
      
      // Verify each export exists in the barrel file
      transformExports.forEach(exportName => {
        expect(objectUtils).toHaveProperty(exportName);
        expect(objectUtils[exportName]).toBe(transformUtils[exportName]);
      });
      
      // Verify specific transform functions that should be exported
      expect(objectUtils).toHaveProperty('pick');
      expect(objectUtils).toHaveProperty('omit');
      expect(objectUtils).toHaveProperty('mapValues');
      expect(objectUtils).toHaveProperty('filterKeys');
      expect(objectUtils).toHaveProperty('renameKeys');
      expect(objectUtils).toHaveProperty('flattenObject');
      expect(objectUtils).toHaveProperty('transformObject');
      expect(objectUtils).toHaveProperty('convertValues');
    });

    test('exports all comparison utilities', () => {
      // Get all named exports from the comparison module
      const comparisonExports = Object.keys(comparisonUtils);
      
      // Verify each export exists in the barrel file
      comparisonExports.forEach(exportName => {
        expect(objectUtils).toHaveProperty(exportName);
        expect(objectUtils[exportName]).toBe(comparisonUtils[exportName]);
      });
      
      // Verify specific comparison functions that should be exported
      expect(objectUtils).toHaveProperty('isEqual');
      expect(objectUtils).toHaveProperty('getDifferences');
      expect(objectUtils).toHaveProperty('hasDifferences');
      expect(objectUtils).toHaveProperty('objectsAreEqual');
      expect(objectUtils).toHaveProperty('isPlainObject');
    });

    test('exports all merge utilities', () => {
      // Get all named exports from the merge module
      const mergeExports = Object.keys(mergeUtils);
      
      // Verify each export exists in the barrel file
      mergeExports.forEach(exportName => {
        expect(objectUtils).toHaveProperty(exportName);
        expect(objectUtils[exportName]).toBe(mergeUtils[exportName]);
      });
      
      // Verify specific merge functions that should be exported
      expect(objectUtils).toHaveProperty('deepMerge');
      expect(objectUtils).toHaveProperty('deepMergeWithOptions');
      expect(objectUtils).toHaveProperty('mergeConfig');
      expect(objectUtils).toHaveProperty('mergeJourneyConfig');
      expect(objectUtils).toHaveProperty('MergeStrategy');
    });

    test('exports all clone utilities', () => {
      // Get all named exports from the clone module
      const cloneExports = Object.keys(cloneUtils);
      
      // Verify each export exists in the barrel file
      cloneExports.forEach(exportName => {
        expect(objectUtils).toHaveProperty(exportName);
        expect(objectUtils[exportName]).toBe(cloneUtils[exportName]);
      });
      
      // Verify specific clone functions that should be exported
      expect(objectUtils).toHaveProperty('deepClone');
      expect(objectUtils).toHaveProperty('safeStructuredClone');
      expect(objectUtils).toHaveProperty('shallowClone');
      expect(objectUtils).toHaveProperty('cloneWithDepth');
    });
  });

  describe('Exported functions match their original implementations', () => {
    test('transform functions work correctly', () => {
      // Create a test object
      const testObj = createObjectWithProperties(['id', 'name', 'email', 'address']);
      
      // Test pick function
      const pickedProps = ['id', 'name'];
      const pickedResult = objectUtils.pick(testObj, pickedProps);
      const expectedPickResult = transformUtils.pick(testObj, pickedProps);
      expect(pickedResult).toEqual(expectedPickResult);
      expect(Object.keys(pickedResult).length).toBe(pickedProps.length);
      
      // Test omit function
      const omittedProps = ['email', 'address'];
      const omitResult = objectUtils.omit(testObj, omittedProps);
      const expectedOmitResult = transformUtils.omit(testObj, omittedProps);
      expect(omitResult).toEqual(expectedOmitResult);
      expect(Object.keys(omitResult).length).toBe(Object.keys(testObj).length - omittedProps.length);
      
      // Test mapValues function
      const mapFn = (value: any) => typeof value === 'string' ? value.toUpperCase() : value;
      const mapResult = objectUtils.mapValues(testObj, mapFn);
      const expectedMapResult = transformUtils.mapValues(testObj, mapFn);
      expect(mapResult).toEqual(expectedMapResult);
    });

    test('comparison functions work correctly', () => {
      // Create test objects
      const objA = { a: 1, b: { c: 2 } };
      const objB = { a: 1, b: { c: 2 } };
      const objC = { a: 1, b: { c: 3 } };
      
      // Test isEqual function
      expect(objectUtils.isEqual(objA, objB)).toBe(true);
      expect(objectUtils.isEqual(objA, objC)).toBe(false);
      expect(comparisonUtils.isEqual(objA, objB)).toBe(true);
      expect(comparisonUtils.isEqual(objA, objC)).toBe(false);
      
      // Test getDifferences function
      const differences = objectUtils.getDifferences(objA, objC);
      const expectedDifferences = comparisonUtils.getDifferences(objA, objC);
      expect(differences).toEqual(expectedDifferences);
      expect(differences).toHaveProperty('b.c');
    });

    test('merge functions work correctly', () => {
      // Create test objects
      const [objA, objB] = createMergeTestObjects();
      
      // Test deepMerge function
      const mergeResult = objectUtils.deepMerge(objA, objB);
      const expectedMergeResult = mergeUtils.deepMerge(objA, objB);
      expect(mergeResult).toEqual(expectedMergeResult);
      
      // Test with MergeStrategy
      const mergeWithStrategy = objectUtils.deepMergeWithOptions(objA, [objB], {
        arrayStrategy: objectUtils.MergeStrategy.COMBINE
      });
      const expectedStrategyResult = mergeUtils.deepMergeWithOptions(objA, [objB], {
        arrayStrategy: mergeUtils.MergeStrategy.COMBINE
      });
      expect(mergeWithStrategy).toEqual(expectedStrategyResult);
    });

    test('clone functions work correctly', () => {
      // Create a test object
      const testObj = createCloneTestObject();
      
      // Test deepClone function
      const cloneResult = objectUtils.deepClone(testObj);
      const expectedCloneResult = cloneUtils.deepClone(testObj);
      expect(cloneResult).toEqual(expectedCloneResult);
      expect(cloneResult).not.toBe(testObj); // Verify it's a new object
      
      // Test shallowClone function
      const shallowResult = objectUtils.shallowClone(testObj);
      const expectedShallowResult = cloneUtils.shallowClone(testObj);
      expect(shallowResult).toEqual(expectedShallowResult);
      expect(shallowResult).not.toBe(testObj); // Verify it's a new object
    });
  });

  describe('Type definitions are correctly preserved', () => {
    test('transform function types are preserved', () => {
      // Verify function signatures match by checking parameter types
      type PickFn = typeof objectUtils.pick;
      type OriginalPickFn = typeof transformUtils.pick;
      const pickFnTypeCheck: PickFn = (obj, keys) => transformUtils.pick(obj, keys);
      expect(typeof pickFnTypeCheck).toBe('function');
      
      type OmitFn = typeof objectUtils.omit;
      type OriginalOmitFn = typeof transformUtils.omit;
      const omitFnTypeCheck: OmitFn = (obj, keys) => transformUtils.omit(obj, keys);
      expect(typeof omitFnTypeCheck).toBe('function');
    });

    test('comparison interface types are preserved', () => {
      // Create a variable of the exported interface type
      const differences: objectUtils.ObjectDifferences = {
        'test.path': {
          oldValue: 1,
          newValue: 2
        }
      };
      
      // Verify it matches the original interface
      const originalDifferences: comparisonUtils.ObjectDifferences = differences;
      expect(differences).toEqual(originalDifferences);
    });

    test('merge enum types are preserved', () => {
      // Verify enum values match
      expect(objectUtils.MergeStrategy.REPLACE).toBe(mergeUtils.MergeStrategy.REPLACE);
      expect(objectUtils.MergeStrategy.COMBINE).toBe(mergeUtils.MergeStrategy.COMBINE);
      expect(objectUtils.MergeStrategy.APPEND).toBe(mergeUtils.MergeStrategy.APPEND);
    });
  });

  describe('Supports different import patterns', () => {
    test('supports named imports', () => {
      // Import specific functions directly
      const { pick, omit, isEqual, deepMerge, deepClone } = objectUtils;
      
      // Verify they work correctly
      const testObj = { a: 1, b: 2, c: 3 };
      expect(pick(testObj, ['a', 'b'])).toEqual({ a: 1, b: 2 });
      expect(omit(testObj, ['c'])).toEqual({ a: 1, b: 2 });
      expect(isEqual({ x: 1 }, { x: 1 })).toBe(true);
      expect(deepMerge({ x: 1 }, { y: 2 })).toEqual({ x: 1, y: 2 });
      
      const cloned = deepClone(testObj);
      expect(cloned).toEqual(testObj);
      expect(cloned).not.toBe(testObj);
    });

    test('supports namespace imports', () => {
      // Use the namespace import directly
      const testObj = { a: 1, b: 2, c: 3 };
      expect(objectUtils.pick(testObj, ['a', 'b'])).toEqual({ a: 1, b: 2 });
      expect(objectUtils.omit(testObj, ['c'])).toEqual({ a: 1, b: 2 });
      expect(objectUtils.isEqual({ x: 1 }, { x: 1 })).toBe(true);
      expect(objectUtils.deepMerge({ x: 1 }, { y: 2 })).toEqual({ x: 1, y: 2 });
      
      const cloned = objectUtils.deepClone(testObj);
      expect(cloned).toEqual(testObj);
      expect(cloned).not.toBe(testObj);
    });
  });
});