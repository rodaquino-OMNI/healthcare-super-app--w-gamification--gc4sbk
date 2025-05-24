/**
 * @file Tests for the type utilities barrel file
 * @description Verifies that all expected exports are available and properly re-exported
 */

import * as typeUtils from '../../../src/type';

describe('Type Utilities Barrel File', () => {
  describe('Exports Availability', () => {
    it('should export all type guard functions', () => {
      // Type guard functions
      expect(typeUtils.isString).toBeDefined();
      expect(typeUtils.isNumber).toBeDefined();
      expect(typeUtils.isBoolean).toBeDefined();
      expect(typeUtils.isArray).toBeDefined();
      expect(typeUtils.isObject).toBeDefined();
      expect(typeUtils.isFunction).toBeDefined();
      expect(typeUtils.isDate).toBeDefined();
      expect(typeUtils.isPromise).toBeDefined();
      expect(typeUtils.isEmpty).toBeDefined();
      expect(typeUtils.isNil).toBeDefined();
      expect(typeUtils.isUndefined).toBeDefined();
      expect(typeUtils.isNull).toBeDefined();
    });

    it('should export all type predicate functions', () => {
      // Type predicate functions
      expect(typeUtils.isInstanceOf).toBeDefined();
      expect(typeUtils.hasProperty).toBeDefined();
      expect(typeUtils.hasProperties).toBeDefined();
      expect(typeUtils.isNonEmptyArray).toBeDefined();
      expect(typeUtils.isValidDate).toBeDefined();
    });

    it('should export all type conversion functions', () => {
      // Type conversion functions
      expect(typeUtils.toString).toBeDefined();
      expect(typeUtils.toNumber).toBeDefined();
      expect(typeUtils.toBoolean).toBeDefined();
      expect(typeUtils.toArray).toBeDefined();
      expect(typeUtils.toDate).toBeDefined();
    });

    it('should export all type assertion functions', () => {
      // Type assertion functions
      expect(typeUtils.assertString).toBeDefined();
      expect(typeUtils.assertNumber).toBeDefined();
      expect(typeUtils.assertBoolean).toBeDefined();
      expect(typeUtils.assertArray).toBeDefined();
      expect(typeUtils.assertObject).toBeDefined();
      expect(typeUtils.assertFunction).toBeDefined();
      expect(typeUtils.assertDate).toBeDefined();
      expect(typeUtils.assertNonEmptyArray).toBeDefined();
      expect(typeUtils.assertNever).toBeDefined();
    });
  });

  describe('Type Guard Functions', () => {
    it('should correctly identify types', () => {
      // Test isString
      expect(typeof typeUtils.isString).toBe('function');
      expect(typeUtils.isString('test')).toBe(true);
      expect(typeUtils.isString(123)).toBe(false);

      // Test isNumber
      expect(typeof typeUtils.isNumber).toBe('function');
      expect(typeUtils.isNumber(123)).toBe(true);
      expect(typeUtils.isNumber('123')).toBe(false);

      // Test isBoolean
      expect(typeof typeUtils.isBoolean).toBe('function');
      expect(typeUtils.isBoolean(true)).toBe(true);
      expect(typeUtils.isBoolean('true')).toBe(false);

      // Test isArray
      expect(typeof typeUtils.isArray).toBe('function');
      expect(typeUtils.isArray([])).toBe(true);
      expect(typeUtils.isArray({})).toBe(false);

      // Test isObject
      expect(typeof typeUtils.isObject).toBe('function');
      expect(typeUtils.isObject({})).toBe(true);
      expect(typeUtils.isObject([])).toBe(false); // Arrays should not be considered objects
      expect(typeUtils.isObject(null)).toBe(false); // Null should not be considered an object

      // Test isFunction
      expect(typeof typeUtils.isFunction).toBe('function');
      expect(typeUtils.isFunction(() => {})).toBe(true);
      expect(typeUtils.isFunction({})).toBe(false);

      // Test isNil
      expect(typeof typeUtils.isNil).toBe('function');
      expect(typeUtils.isNil(null)).toBe(true);
      expect(typeUtils.isNil(undefined)).toBe(true);
      expect(typeUtils.isNil('')).toBe(false);
    });
  });

  describe('Type Predicate Functions', () => {
    it('should correctly narrow types', () => {
      // Test isInstanceOf
      class TestClass {}
      const instance = new TestClass();
      expect(typeof typeUtils.isInstanceOf).toBe('function');
      expect(typeUtils.isInstanceOf(instance, TestClass)).toBe(true);
      expect(typeUtils.isInstanceOf({}, TestClass)).toBe(false);

      // Test hasProperty
      expect(typeof typeUtils.hasProperty).toBe('function');
      expect(typeUtils.hasProperty({ prop: 'value' }, 'prop')).toBe(true);
      expect(typeUtils.hasProperty({}, 'prop')).toBe(false);

      // Test isNonEmptyArray
      expect(typeof typeUtils.isNonEmptyArray).toBe('function');
      expect(typeUtils.isNonEmptyArray([1, 2, 3])).toBe(true);
      expect(typeUtils.isNonEmptyArray([])).toBe(false);
      expect(typeUtils.isNonEmptyArray(null as any)).toBe(false);
    });
  });

  describe('Type Conversion Functions', () => {
    it('should correctly convert between types', () => {
      // Test toString
      expect(typeof typeUtils.toString).toBe('function');
      expect(typeUtils.toString(123)).toBe('123');
      expect(typeUtils.toString(null, 'default')).toBe('default');

      // Test toNumber
      expect(typeof typeUtils.toNumber).toBe('function');
      expect(typeUtils.toNumber('123')).toBe(123);
      expect(typeUtils.toNumber('abc', 0)).toBe(0);

      // Test toBoolean
      expect(typeof typeUtils.toBoolean).toBe('function');
      expect(typeUtils.toBoolean('true')).toBe(true);
      expect(typeUtils.toBoolean('false')).toBe(false);
      expect(typeUtils.toBoolean('invalid', true)).toBe(true);

      // Test toArray
      expect(typeof typeUtils.toArray).toBe('function');
      expect(typeUtils.toArray('item')).toEqual(['item']);
      expect(typeUtils.toArray(['item'])).toEqual(['item']);
      expect(typeUtils.toArray(null, ['default'])).toEqual(['default']);
    });
  });

  describe('Type Assertion Functions', () => {
    it('should throw errors for invalid types', () => {
      // Test assertString
      expect(typeof typeUtils.assertString).toBe('function');
      expect(() => typeUtils.assertString('test')).not.toThrow();
      expect(() => typeUtils.assertString(123)).toThrow();

      // Test assertNumber
      expect(typeof typeUtils.assertNumber).toBe('function');
      expect(() => typeUtils.assertNumber(123)).not.toThrow();
      expect(() => typeUtils.assertNumber('123')).toThrow();

      // Test assertArray
      expect(typeof typeUtils.assertArray).toBe('function');
      expect(() => typeUtils.assertArray([])).not.toThrow();
      expect(() => typeUtils.assertArray({})).toThrow();

      // Test assertNonEmptyArray
      expect(typeof typeUtils.assertNonEmptyArray).toBe('function');
      expect(() => typeUtils.assertNonEmptyArray([1, 2, 3])).not.toThrow();
      expect(() => typeUtils.assertNonEmptyArray([])).toThrow();

      // Test assertNever
      expect(typeof typeUtils.assertNever).toBe('function');
      expect(() => typeUtils.assertNever('unexpected' as never)).toThrow();
    });
  });

  describe('Import Patterns', () => {
    it('should support named imports', () => {
      // Simulate named imports
      const { isString, isNumber, toBoolean, assertArray } = typeUtils;
      
      expect(isString('test')).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(toBoolean('true')).toBe(true);
      expect(() => assertArray([])).not.toThrow();
    });

    it('should support destructured imports with aliases', () => {
      // Simulate destructured imports with aliases
      const { isString: checkString, isNumber: checkNumber } = typeUtils;
      
      expect(checkString('test')).toBe(true);
      expect(checkNumber(123)).toBe(true);
    });
  });
});