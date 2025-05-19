/**
 * Tests for the type utilities barrel file.
 * 
 * These tests verify that all expected exports are available and properly re-exported
 * to ensure the public API remains stable. This is critical for validating the module's
 * external interface and detecting breaking changes to export patterns.
 */

// Import all exports from the barrel file
import * as typeUtils from '../../../src/type';

// Import individual modules to compare exports
import * as guardUtils from '../../../src/type/guard';
import * as assertionUtils from '../../../src/type/assertions';
import * as predicateUtils from '../../../src/type/predicate';
import * as conversionUtils from '../../../src/type/conversion';

describe('Type Utilities Barrel File', () => {
  describe('Guard Utilities', () => {
    // List of all expected guard utility exports
    const expectedGuardExports = [
      'isString',
      'isNumber',
      'isBoolean',
      'isUndefined',
      'isNull',
      'isNullOrUndefined',
      'isArray',
      'isObject',
      'isFunction',
      'isDate',
      'isPromise',
      'isEmpty',
      'isNotEmpty',
      'isPlainObject',
      'isNumeric',
      'isInteger',
      'isPositive',
      'isNegative',
      'isNonEmptyArray',
      'isNonEmptyString',
      'isEmail',
      'isUrl',
      'isPrimitiveType',
      'isArrayOf',
      'isRecordOf'
    ];

    it('should export all guard utilities', () => {
      expectedGuardExports.forEach(exportName => {
        expect(typeUtils).toHaveProperty(exportName);
      });
    });

    it('should re-export the same functions as the guard module', () => {
      Object.keys(guardUtils).forEach(exportName => {
        expect(typeUtils).toHaveProperty(exportName);
        expect(typeUtils[exportName]).toBe(guardUtils[exportName]);
      });
    });

    it('should maintain function signatures for guard utilities', () => {
      // Test a few key functions to ensure they maintain their expected signatures
      const testValue = 'test';
      expect(typeUtils.isString(testValue)).toBe(true);
      expect(typeUtils.isNumber(123)).toBe(true);
      expect(typeUtils.isBoolean(false)).toBe(true);
      expect(typeUtils.isArray([])).toBe(true);
      expect(typeUtils.isObject({})).toBe(true);
    });
  });

  describe('Assertion Utilities', () => {
    // List of all expected assertion utility exports
    const expectedAssertionExports = [
      'assertString',
      'assertNumber',
      'assertBoolean',
      'assertObject',
      'assertArray',
      'assertDate',
      'assertFunction',
      'assertDefined',
      'assertNonNull',
      'assertNonNullable',
      'assertType',
      'assertInstanceOf',
      'assertNever',
      'assert',
      'assertOneOf'
    ];

    it('should export all assertion utilities', () => {
      expectedAssertionExports.forEach(exportName => {
        expect(typeUtils).toHaveProperty(exportName);
      });
    });

    it('should re-export the same functions as the assertions module', () => {
      Object.keys(assertionUtils).forEach(exportName => {
        expect(typeUtils).toHaveProperty(exportName);
        expect(typeUtils[exportName]).toBe(assertionUtils[exportName]);
      });
    });

    it('should maintain function signatures for assertion utilities', () => {
      // Test that assertion functions throw when expected
      expect(() => typeUtils.assertString(123)).toThrow();
      expect(() => typeUtils.assertNumber('test')).toThrow();
      expect(() => typeUtils.assertBoolean('true')).toThrow();
      expect(() => typeUtils.assertArray({})).toThrow();
      expect(() => typeUtils.assertObject([])).toThrow();
      
      // Test that assertion functions don't throw with valid inputs
      expect(() => typeUtils.assertString('test')).not.toThrow();
      expect(() => typeUtils.assertNumber(123)).not.toThrow();
      expect(() => typeUtils.assertBoolean(false)).not.toThrow();
      expect(() => typeUtils.assertArray([])).not.toThrow();
      expect(() => typeUtils.assertObject({})).not.toThrow();
    });
  });

  describe('Predicate Utilities', () => {
    // List of all expected predicate utility exports
    const expectedPredicateExports = [
      'isDefined',
      'isNotNull',
      'isNotUndefined',
      'isNonEmptyArray',
      'isArrayOfLength',
      'isArrayOf',
      'hasProperty',
      'hasPropertyOfType',
      'hasProperties',
      'isInstanceOf',
      'isInstanceOfAny',
      'isFilterDto',
      'isPaginationDto',
      'isSortDto',
      'isOneOf',
      'isOneOfType',
      'hasDiscriminator'
    ];

    it('should export all predicate utilities', () => {
      expectedPredicateExports.forEach(exportName => {
        expect(typeUtils).toHaveProperty(exportName);
      });
    });

    it('should re-export the same functions as the predicate module', () => {
      Object.keys(predicateUtils).forEach(exportName => {
        expect(typeUtils).toHaveProperty(exportName);
        expect(typeUtils[exportName]).toBe(predicateUtils[exportName]);
      });
    });

    it('should maintain function signatures for predicate utilities', () => {
      // Test a few key functions to ensure they maintain their expected signatures
      expect(typeUtils.isDefined('test')).toBe(true);
      expect(typeUtils.isDefined(null)).toBe(false);
      expect(typeUtils.isNotNull('test')).toBe(true);
      expect(typeUtils.isNotNull(null)).toBe(false);
      expect(typeUtils.hasProperty({ name: 'test' }, 'name')).toBe(true);
      expect(typeUtils.hasProperty({ age: 30 }, 'name')).toBe(false);
    });
  });

  describe('Conversion Utilities', () => {
    // List of all expected conversion utility exports
    const expectedConversionExports = [
      'toString',
      'toNumber',
      'toInteger',
      'toFloat',
      'toBoolean',
      'toDate',
      'toArray',
      'toObject',
      'toMap',
      'toSet',
      'toEnum',
      'toURL',
      'toJourneyFormat',
      'withRetry',
      'withOptimisticLock',
      'withCircuitBreaker'
    ];

    it('should export all conversion utilities', () => {
      expectedConversionExports.forEach(exportName => {
        expect(typeUtils).toHaveProperty(exportName);
      });
    });

    it('should re-export the same functions as the conversion module', () => {
      Object.keys(conversionUtils).forEach(exportName => {
        expect(typeUtils).toHaveProperty(exportName);
        expect(typeUtils[exportName]).toBe(conversionUtils[exportName]);
      });
    });

    it('should maintain function signatures for conversion utilities', () => {
      // Test a few key functions to ensure they maintain their expected signatures
      expect(typeUtils.toString(123)).toBe('123');
      expect(typeUtils.toNumber('123')).toBe(123);
      expect(typeUtils.toBoolean('true')).toBe(true);
      expect(typeUtils.toArray('test')).toEqual(['test']);
      expect(typeUtils.toObject('{"name":"test"}', {})).toEqual({ name: 'test' });
    });
  });

  describe('Import Patterns', () => {
    it('should support importing all utilities from the barrel file', () => {
      // This test verifies that the pattern used at the top of this file works
      expect(typeof typeUtils).toBe('object');
      expect(Object.keys(typeUtils).length).toBeGreaterThan(0);
    });

    it('should support named imports for specific utilities', () => {
      // This test simulates how consumers would import specific utilities
      const { isString, isNumber, toString, toNumber } = typeUtils;
      
      expect(typeof isString).toBe('function');
      expect(typeof isNumber).toBe('function');
      expect(typeof toString).toBe('function');
      expect(typeof toNumber).toBe('function');
      
      expect(isString('test')).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(toString(123)).toBe('123');
      expect(toNumber('123')).toBe(123);
    });
  });

  describe('API Completeness', () => {
    it('should export all functions from all submodules', () => {
      // Combine all exports from individual modules
      const allSubmoduleExports = [
        ...Object.keys(guardUtils),
        ...Object.keys(assertionUtils),
        ...Object.keys(predicateUtils),
        ...Object.keys(conversionUtils)
      ];
      
      // Check that each export is available in the barrel file
      allSubmoduleExports.forEach(exportName => {
        expect(typeUtils).toHaveProperty(exportName);
      });
      
      // Check that the barrel file doesn't export anything not in the submodules
      const barrelExports = Object.keys(typeUtils);
      barrelExports.forEach(exportName => {
        const isInSubmodules = allSubmoduleExports.includes(exportName);
        expect(isInSubmodules).toBe(true);
      });
    });
  });
});