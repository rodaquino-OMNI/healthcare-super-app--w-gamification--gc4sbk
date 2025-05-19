/**
 * Tests for type guard utility functions
 * 
 * These tests validate the accuracy of type guard functions that check if values
 * match specific types at runtime. The test suite covers primitive type detection,
 * compound type guards, and special case handling to ensure consistent type checking
 * across all journey services.
 */

import {
  isString,
  isNumber,
  isBoolean,
  isUndefined,
  isNull,
  isNullOrUndefined,
  isArray,
  isObject,
  isFunction,
  isDate,
  isPromise,
  isEmpty,
  isNotEmpty,
  isPlainObject,
  isNumeric,
  isInteger,
  isPositive,
  isNegative,
  isNonEmptyArray,
  isNonEmptyString,
  isEmail,
  isUrl,
  isPrimitiveType,
  isArrayOf,
  isRecordOf
} from '../../../src/type/guard';

describe('Type Guard Functions', () => {
  // Primitive type guards
  describe('Primitive Type Guards', () => {
    describe('isString', () => {
      it('should return true for string values', () => {
        expect(isString('')).toBe(true);
        expect(isString('hello')).toBe(true);
        expect(isString(String('test'))).toBe(true);
        expect(isString(`template literal`)).toBe(true);
      });

      it('should return false for non-string values', () => {
        expect(isString(123)).toBe(false);
        expect(isString(true)).toBe(false);
        expect(isString({})).toBe(false);
        expect(isString([])).toBe(false);
        expect(isString(null)).toBe(false);
        expect(isString(undefined)).toBe(false);
        expect(isString(() => {})).toBe(false);
      });
    });

    describe('isNumber', () => {
      it('should return true for number values', () => {
        expect(isNumber(0)).toBe(true);
        expect(isNumber(123)).toBe(true);
        expect(isNumber(-456)).toBe(true);
        expect(isNumber(3.14)).toBe(true);
        expect(isNumber(Number('789'))).toBe(true);
        expect(isNumber(Infinity)).toBe(true);
        expect(isNumber(-Infinity)).toBe(true);
      });

      it('should return false for NaN', () => {
        expect(isNumber(NaN)).toBe(false);
        expect(isNumber(Number('not a number'))).toBe(false);
      });

      it('should return false for non-number values', () => {
        expect(isNumber('123')).toBe(false);
        expect(isNumber(true)).toBe(false);
        expect(isNumber({})).toBe(false);
        expect(isNumber([])).toBe(false);
        expect(isNumber(null)).toBe(false);
        expect(isNumber(undefined)).toBe(false);
        expect(isNumber(() => {})).toBe(false);
      });
    });

    describe('isBoolean', () => {
      it('should return true for boolean values', () => {
        expect(isBoolean(true)).toBe(true);
        expect(isBoolean(false)).toBe(true);
        expect(isBoolean(Boolean(1))).toBe(true);
        expect(isBoolean(Boolean(0))).toBe(true);
      });

      it('should return false for non-boolean values', () => {
        expect(isBoolean(0)).toBe(false);
        expect(isBoolean(1)).toBe(false);
        expect(isBoolean('true')).toBe(false);
        expect(isBoolean('false')).toBe(false);
        expect(isBoolean({})).toBe(false);
        expect(isBoolean([])).toBe(false);
        expect(isBoolean(null)).toBe(false);
        expect(isBoolean(undefined)).toBe(false);
        expect(isBoolean(() => {})).toBe(false);
      });
    });

    describe('isUndefined', () => {
      it('should return true for undefined values', () => {
        expect(isUndefined(undefined)).toBe(true);
        let undefinedVar;
        expect(isUndefined(undefinedVar)).toBe(true);
      });

      it('should return false for non-undefined values', () => {
        expect(isUndefined(null)).toBe(false);
        expect(isUndefined('')).toBe(false);
        expect(isUndefined(0)).toBe(false);
        expect(isUndefined(false)).toBe(false);
        expect(isUndefined({})).toBe(false);
        expect(isUndefined([])).toBe(false);
        expect(isUndefined(() => {})).toBe(false);
      });
    });

    describe('isNull', () => {
      it('should return true for null values', () => {
        expect(isNull(null)).toBe(true);
      });

      it('should return false for non-null values', () => {
        expect(isNull(undefined)).toBe(false);
        expect(isNull('')).toBe(false);
        expect(isNull(0)).toBe(false);
        expect(isNull(false)).toBe(false);
        expect(isNull({})).toBe(false);
        expect(isNull([])).toBe(false);
        expect(isNull(() => {})).toBe(false);
      });
    });

    describe('isNullOrUndefined', () => {
      it('should return true for null or undefined values', () => {
        expect(isNullOrUndefined(null)).toBe(true);
        expect(isNullOrUndefined(undefined)).toBe(true);
        let undefinedVar;
        expect(isNullOrUndefined(undefinedVar)).toBe(true);
      });

      it('should return false for non-null and non-undefined values', () => {
        expect(isNullOrUndefined('')).toBe(false);
        expect(isNullOrUndefined(0)).toBe(false);
        expect(isNullOrUndefined(false)).toBe(false);
        expect(isNullOrUndefined({})).toBe(false);
        expect(isNullOrUndefined([])).toBe(false);
        expect(isNullOrUndefined(() => {})).toBe(false);
      });
    });
  });

  // Compound type guards
  describe('Compound Type Guards', () => {
    describe('isArray', () => {
      it('should return true for array values', () => {
        expect(isArray([])).toBe(true);
        expect(isArray([1, 2, 3])).toBe(true);
        expect(isArray(new Array())).toBe(true);
        expect(isArray(Array.from('abc'))).toBe(true);
      });

      it('should return false for non-array values', () => {
        expect(isArray({})).toBe(false);
        expect(isArray('')).toBe(false);
        expect(isArray(123)).toBe(false);
        expect(isArray(true)).toBe(false);
        expect(isArray(null)).toBe(false);
        expect(isArray(undefined)).toBe(false);
        expect(isArray(() => {})).toBe(false);
      });

      it('should work with generic type parameter', () => {
        const numberArray = [1, 2, 3];
        const stringArray = ['a', 'b', 'c'];
        
        expect(isArray<number>(numberArray)).toBe(true);
        expect(isArray<string>(stringArray)).toBe(true);
        
        // Type checking only happens at compile time, runtime behavior is the same
        expect(isArray<string>(numberArray)).toBe(true);
      });
    });

    describe('isObject', () => {
      it('should return true for object values', () => {
        expect(isObject({})).toBe(true);
        expect(isObject({ key: 'value' })).toBe(true);
        expect(isObject(new Object())).toBe(true);
        expect(isObject(Object.create(null))).toBe(true);
      });

      it('should return false for arrays', () => {
        expect(isObject([])).toBe(false);
        expect(isObject([1, 2, 3])).toBe(false);
      });

      it('should return false for null', () => {
        expect(isObject(null)).toBe(false);
      });

      it('should return false for other non-object values', () => {
        expect(isObject('')).toBe(false);
        expect(isObject(123)).toBe(false);
        expect(isObject(true)).toBe(false);
        expect(isObject(undefined)).toBe(false);
        expect(isObject(() => {})).toBe(false);
      });

      it('should work with generic type parameter', () => {
        interface TestInterface {
          id: number;
          name: string;
        }
        
        const obj = { id: 1, name: 'Test' };
        
        expect(isObject<TestInterface>(obj)).toBe(true);
        
        // Type checking only happens at compile time, runtime behavior is the same
        expect(isObject<{ different: boolean }>(obj)).toBe(true);
      });
    });

    describe('isFunction', () => {
      it('should return true for function values', () => {
        expect(isFunction(() => {})).toBe(true);
        expect(isFunction(function() {})).toBe(true);
        expect(isFunction(Array.isArray)).toBe(true);
        expect(isFunction(Object)).toBe(true);
        expect(isFunction(Function)).toBe(true);
      });

      it('should return false for non-function values', () => {
        expect(isFunction({})).toBe(false);
        expect(isFunction([])).toBe(false);
        expect(isFunction('')).toBe(false);
        expect(isFunction(123)).toBe(false);
        expect(isFunction(true)).toBe(false);
        expect(isFunction(null)).toBe(false);
        expect(isFunction(undefined)).toBe(false);
      });
    });

    describe('isDate', () => {
      it('should return true for valid Date objects', () => {
        expect(isDate(new Date())).toBe(true);
        expect(isDate(new Date('2023-01-01'))).toBe(true);
        expect(isDate(global.__TEST_DATA__.dates.validDate)).toBe(true);
      });

      it('should return false for invalid Date objects', () => {
        expect(isDate(new Date('invalid-date'))).toBe(false);
        expect(isDate(global.__TEST_DATA__.dates.invalidDate)).toBe(false);
      });

      it('should return false for non-Date values', () => {
        expect(isDate({})).toBe(false);
        expect(isDate([])).toBe(false);
        expect(isDate('')).toBe(false);
        expect(isDate('2023-01-01')).toBe(false);
        expect(isDate(123)).toBe(false);
        expect(isDate(true)).toBe(false);
        expect(isDate(null)).toBe(false);
        expect(isDate(undefined)).toBe(false);
      });
    });

    describe('isPromise', () => {
      it('should return true for Promise objects', () => {
        expect(isPromise(Promise.resolve())).toBe(true);
        expect(isPromise(Promise.reject().catch(() => {}))).toBe(true);
        expect(isPromise(new Promise(() => {}))).toBe(true);
      });

      it('should return true for objects with a then method', () => {
        expect(isPromise({ then: () => {} })).toBe(true);
      });

      it('should return false for objects with a non-function then property', () => {
        expect(isPromise({ then: 'not a function' })).toBe(false);
      });

      it('should return false for non-Promise values', () => {
        expect(isPromise({})).toBe(false);
        expect(isPromise([])).toBe(false);
        expect(isPromise('')).toBe(false);
        expect(isPromise(123)).toBe(false);
        expect(isPromise(true)).toBe(false);
        expect(isPromise(null)).toBe(false);
        expect(isPromise(undefined)).toBe(false);
        expect(isPromise(() => {})).toBe(false);
      });

      it('should work with generic type parameter', () => {
        const numberPromise = Promise.resolve(42);
        const stringPromise = Promise.resolve('hello');
        
        expect(isPromise<number>(numberPromise)).toBe(true);
        expect(isPromise<string>(stringPromise)).toBe(true);
        
        // Type checking only happens at compile time, runtime behavior is the same
        expect(isPromise<boolean>(numberPromise)).toBe(true);
      });
    });
  });

  // Empty value checks
  describe('Empty Value Checks', () => {
    describe('isEmpty', () => {
      it('should return true for null and undefined', () => {
        expect(isEmpty(null)).toBe(true);
        expect(isEmpty(undefined)).toBe(true);
      });

      it('should return true for empty strings', () => {
        expect(isEmpty('')).toBe(true);
        expect(isEmpty('   ')).toBe(true);
      });

      it('should return true for empty arrays', () => {
        expect(isEmpty([])).toBe(true);
      });

      it('should return true for empty objects', () => {
        expect(isEmpty({})).toBe(true);
      });

      it('should return false for non-empty strings', () => {
        expect(isEmpty('hello')).toBe(false);
        expect(isEmpty('   hello   ')).toBe(false);
      });

      it('should return false for non-empty arrays', () => {
        expect(isEmpty([1, 2, 3])).toBe(false);
        expect(isEmpty([''])).toBe(false);
      });

      it('should return false for non-empty objects', () => {
        expect(isEmpty({ key: 'value' })).toBe(false);
        expect(isEmpty({ key: null })).toBe(false);
      });

      it('should return false for other non-empty values', () => {
        expect(isEmpty(0)).toBe(false);
        expect(isEmpty(false)).toBe(false);
        expect(isEmpty(() => {})).toBe(false);
        expect(isEmpty(new Date())).toBe(false);
      });
    });

    describe('isNotEmpty', () => {
      it('should return false for null and undefined', () => {
        expect(isNotEmpty(null)).toBe(false);
        expect(isNotEmpty(undefined)).toBe(false);
      });

      it('should return false for empty strings', () => {
        expect(isNotEmpty('')).toBe(false);
        expect(isNotEmpty('   ')).toBe(false);
      });

      it('should return false for empty arrays', () => {
        expect(isNotEmpty([])).toBe(false);
      });

      it('should return false for empty objects', () => {
        expect(isNotEmpty({})).toBe(false);
      });

      it('should return true for non-empty strings', () => {
        expect(isNotEmpty('hello')).toBe(true);
        expect(isNotEmpty('   hello   ')).toBe(true);
      });

      it('should return true for non-empty arrays', () => {
        expect(isNotEmpty([1, 2, 3])).toBe(true);
        expect(isNotEmpty([''])).toBe(true);
      });

      it('should return true for non-empty objects', () => {
        expect(isNotEmpty({ key: 'value' })).toBe(true);
        expect(isNotEmpty({ key: null })).toBe(true);
      });

      it('should return true for other non-empty values', () => {
        expect(isNotEmpty(0)).toBe(true);
        expect(isNotEmpty(false)).toBe(true);
        expect(isNotEmpty(() => {})).toBe(true);
        expect(isNotEmpty(new Date())).toBe(true);
      });
    });
  });

  // Object type checks
  describe('Object Type Checks', () => {
    describe('isPlainObject', () => {
      it('should return true for plain objects', () => {
        expect(isPlainObject({})).toBe(true);
        expect(isPlainObject({ key: 'value' })).toBe(true);
        expect(isPlainObject(Object.create(null))).toBe(true);
      });

      it('should return false for objects with custom prototypes', () => {
        class CustomClass {}
        expect(isPlainObject(new CustomClass())).toBe(false);
        expect(isPlainObject(new Date())).toBe(false);
        expect(isPlainObject(new RegExp(''))).toBe(false);
      });

      it('should return false for arrays', () => {
        expect(isPlainObject([])).toBe(false);
        expect(isPlainObject([1, 2, 3])).toBe(false);
      });

      it('should return false for other non-plain-object values', () => {
        expect(isPlainObject('')).toBe(false);
        expect(isPlainObject(123)).toBe(false);
        expect(isPlainObject(true)).toBe(false);
        expect(isPlainObject(null)).toBe(false);
        expect(isPlainObject(undefined)).toBe(false);
        expect(isPlainObject(() => {})).toBe(false);
      });
    });
  });

  // Number type checks
  describe('Number Type Checks', () => {
    describe('isNumeric', () => {
      it('should return true for number values', () => {
        expect(isNumeric(0)).toBe(true);
        expect(isNumeric(123)).toBe(true);
        expect(isNumeric(-456)).toBe(true);
        expect(isNumeric(3.14)).toBe(true);
      });

      it('should return true for numeric strings', () => {
        expect(isNumeric('0')).toBe(true);
        expect(isNumeric('123')).toBe(true);
        expect(isNumeric('-456')).toBe(true);
        expect(isNumeric('3.14')).toBe(true);
        expect(isNumeric('  42  ')).toBe(true);
      });

      it('should return false for non-numeric strings', () => {
        expect(isNumeric('')).toBe(false);
        expect(isNumeric('abc')).toBe(false);
        expect(isNumeric('123abc')).toBe(false);
        expect(isNumeric('abc123')).toBe(false);
      });

      it('should return false for other non-numeric values', () => {
        expect(isNumeric(NaN)).toBe(false);
        expect(isNumeric(true)).toBe(false);
        expect(isNumeric({})).toBe(false);
        expect(isNumeric([])).toBe(false);
        expect(isNumeric(null)).toBe(false);
        expect(isNumeric(undefined)).toBe(false);
        expect(isNumeric(() => {})).toBe(false);
      });
    });

    describe('isInteger', () => {
      it('should return true for integer values', () => {
        expect(isInteger(0)).toBe(true);
        expect(isInteger(123)).toBe(true);
        expect(isInteger(-456)).toBe(true);
      });

      it('should return false for non-integer number values', () => {
        expect(isInteger(3.14)).toBe(false);
        expect(isInteger(0.1)).toBe(false);
        expect(isInteger(NaN)).toBe(false);
        expect(isInteger(Infinity)).toBe(false);
        expect(isInteger(-Infinity)).toBe(false);
      });

      it('should return false for non-number values', () => {
        expect(isInteger('123')).toBe(false);
        expect(isInteger(true)).toBe(false);
        expect(isInteger({})).toBe(false);
        expect(isInteger([])).toBe(false);
        expect(isInteger(null)).toBe(false);
        expect(isInteger(undefined)).toBe(false);
        expect(isInteger(() => {})).toBe(false);
      });
    });

    describe('isPositive', () => {
      it('should return true for positive number values', () => {
        expect(isPositive(1)).toBe(true);
        expect(isPositive(123)).toBe(true);
        expect(isPositive(0.1)).toBe(true);
        expect(isPositive(Infinity)).toBe(true);
      });

      it('should return false for zero', () => {
        expect(isPositive(0)).toBe(false);
      });

      it('should return false for negative number values', () => {
        expect(isPositive(-1)).toBe(false);
        expect(isPositive(-123)).toBe(false);
        expect(isPositive(-0.1)).toBe(false);
        expect(isPositive(-Infinity)).toBe(false);
      });

      it('should return false for NaN', () => {
        expect(isPositive(NaN)).toBe(false);
      });

      it('should return false for non-number values', () => {
        expect(isPositive('123')).toBe(false);
        expect(isPositive(true)).toBe(false);
        expect(isPositive({})).toBe(false);
        expect(isPositive([])).toBe(false);
        expect(isPositive(null)).toBe(false);
        expect(isPositive(undefined)).toBe(false);
        expect(isPositive(() => {})).toBe(false);
      });
    });

    describe('isNegative', () => {
      it('should return true for negative number values', () => {
        expect(isNegative(-1)).toBe(true);
        expect(isNegative(-123)).toBe(true);
        expect(isNegative(-0.1)).toBe(true);
        expect(isNegative(-Infinity)).toBe(true);
      });

      it('should return false for zero', () => {
        expect(isNegative(0)).toBe(false);
      });

      it('should return false for positive number values', () => {
        expect(isNegative(1)).toBe(false);
        expect(isNegative(123)).toBe(false);
        expect(isNegative(0.1)).toBe(false);
        expect(isNegative(Infinity)).toBe(false);
      });

      it('should return false for NaN', () => {
        expect(isNegative(NaN)).toBe(false);
      });

      it('should return false for non-number values', () => {
        expect(isNegative('-123')).toBe(false);
        expect(isNegative(true)).toBe(false);
        expect(isNegative({})).toBe(false);
        expect(isNegative([])).toBe(false);
        expect(isNegative(null)).toBe(false);
        expect(isNegative(undefined)).toBe(false);
        expect(isNegative(() => {})).toBe(false);
      });
    });
  });

  // Non-empty collection checks
  describe('Non-Empty Collection Checks', () => {
    describe('isNonEmptyArray', () => {
      it('should return true for non-empty arrays', () => {
        expect(isNonEmptyArray([1])).toBe(true);
        expect(isNonEmptyArray([1, 2, 3])).toBe(true);
        expect(isNonEmptyArray([''])).toBe(true);
        expect(isNonEmptyArray([null])).toBe(true);
      });

      it('should return false for empty arrays', () => {
        expect(isNonEmptyArray([])).toBe(false);
      });

      it('should return false for non-array values', () => {
        expect(isNonEmptyArray({})).toBe(false);
        expect(isNonEmptyArray('')).toBe(false);
        expect(isNonEmptyArray('abc')).toBe(false);
        expect(isNonEmptyArray(123)).toBe(false);
        expect(isNonEmptyArray(true)).toBe(false);
        expect(isNonEmptyArray(null)).toBe(false);
        expect(isNonEmptyArray(undefined)).toBe(false);
        expect(isNonEmptyArray(() => {})).toBe(false);
      });

      it('should work with generic type parameter', () => {
        const numberArray = [1, 2, 3];
        const stringArray = ['a', 'b', 'c'];
        
        expect(isNonEmptyArray<number>(numberArray)).toBe(true);
        expect(isNonEmptyArray<string>(stringArray)).toBe(true);
        
        // Type checking only happens at compile time, runtime behavior is the same
        expect(isNonEmptyArray<string>(numberArray)).toBe(true);
      });
    });

    describe('isNonEmptyString', () => {
      it('should return true for non-empty strings', () => {
        expect(isNonEmptyString('a')).toBe(true);
        expect(isNonEmptyString('hello')).toBe(true);
        expect(isNonEmptyString('   hello   ')).toBe(true);
      });

      it('should return false for empty strings', () => {
        expect(isNonEmptyString('')).toBe(false);
        expect(isNonEmptyString('   ')).toBe(false);
      });

      it('should return false for non-string values', () => {
        expect(isNonEmptyString(123)).toBe(false);
        expect(isNonEmptyString(true)).toBe(false);
        expect(isNonEmptyString({})).toBe(false);
        expect(isNonEmptyString([])).toBe(false);
        expect(isNonEmptyString(null)).toBe(false);
        expect(isNonEmptyString(undefined)).toBe(false);
        expect(isNonEmptyString(() => {})).toBe(false);
      });
    });
  });

  // Format validation
  describe('Format Validation', () => {
    describe('isEmail', () => {
      it('should return true for valid email addresses', () => {
        expect(isEmail('user@example.com')).toBe(true);
        expect(isEmail('user.name@example.co.uk')).toBe(true);
        expect(isEmail('user+tag@example.org')).toBe(true);
        expect(isEmail('123@example.com')).toBe(true);
      });

      it('should return false for invalid email addresses', () => {
        expect(isEmail('')).toBe(false);
        expect(isEmail('user')).toBe(false);
        expect(isEmail('user@')).toBe(false);
        expect(isEmail('@example.com')).toBe(false);
        expect(isEmail('user@example')).toBe(false);
        expect(isEmail('user@.com')).toBe(false);
        expect(isEmail('user@example.')).toBe(false);
        expect(isEmail('user@exam ple.com')).toBe(false);
      });

      it('should return false for non-string values', () => {
        expect(isEmail(123)).toBe(false);
        expect(isEmail(true)).toBe(false);
        expect(isEmail({})).toBe(false);
        expect(isEmail([])).toBe(false);
        expect(isEmail(null)).toBe(false);
        expect(isEmail(undefined)).toBe(false);
        expect(isEmail(() => {})).toBe(false);
      });
    });

    describe('isUrl', () => {
      it('should return true for valid URLs', () => {
        expect(isUrl('https://example.com')).toBe(true);
        expect(isUrl('http://example.com')).toBe(true);
        expect(isUrl('https://www.example.co.uk/path')).toBe(true);
        expect(isUrl('http://example.com:8080')).toBe(true);
        expect(isUrl('http://example.com/path?query=value')).toBe(true);
        expect(isUrl('http://example.com#fragment')).toBe(true);
        expect(isUrl('ftp://example.com')).toBe(true);
      });

      it('should return false for invalid URLs', () => {
        expect(isUrl('')).toBe(false);
        expect(isUrl('example.com')).toBe(false);
        expect(isUrl('www.example.com')).toBe(false);
        expect(isUrl('http:/example.com')).toBe(false);
        expect(isUrl('http://exam ple.com')).toBe(false);
        expect(isUrl('htp://example.com')).toBe(false);
      });

      it('should return false for non-string values', () => {
        expect(isUrl(123)).toBe(false);
        expect(isUrl(true)).toBe(false);
        expect(isUrl({})).toBe(false);
        expect(isUrl([])).toBe(false);
        expect(isUrl(null)).toBe(false);
        expect(isUrl(undefined)).toBe(false);
        expect(isUrl(() => {})).toBe(false);
      });
    });
  });

  // Generic type checks
  describe('Generic Type Checks', () => {
    describe('isPrimitiveType', () => {
      it('should return true for values matching the specified primitive type', () => {
        expect(isPrimitiveType('hello', 'string')).toBe(true);
        expect(isPrimitiveType(123, 'number')).toBe(true);
        expect(isPrimitiveType(true, 'boolean')).toBe(true);
        expect(isPrimitiveType(undefined, 'undefined')).toBe(true);
        expect(isPrimitiveType(Symbol('test'), 'symbol')).toBe(true);
        expect(isPrimitiveType(() => {}, 'function')).toBe(true);
        expect(isPrimitiveType({}, 'object')).toBe(true);
        expect(isPrimitiveType([], 'object')).toBe(true);
        expect(isPrimitiveType(null, 'object')).toBe(true);
      });

      it('should return false for values not matching the specified primitive type', () => {
        expect(isPrimitiveType('hello', 'number')).toBe(false);
        expect(isPrimitiveType(123, 'string')).toBe(false);
        expect(isPrimitiveType(true, 'object')).toBe(false);
        expect(isPrimitiveType(undefined, 'boolean')).toBe(false);
        expect(isPrimitiveType(Symbol('test'), 'function')).toBe(false);
        expect(isPrimitiveType(() => {}, 'object')).toBe(false);
        expect(isPrimitiveType({}, 'function')).toBe(false);
      });
    });

    describe('isArrayOf', () => {
      it('should return true for arrays where all elements satisfy the predicate', () => {
        expect(isArrayOf([1, 2, 3], isNumber)).toBe(true);
        expect(isArrayOf(['a', 'b', 'c'], isString)).toBe(true);
        expect(isArrayOf([true, false], isBoolean)).toBe(true);
        expect(isArrayOf([], isString)).toBe(true); // Empty arrays always return true
      });

      it('should return false for arrays where some elements do not satisfy the predicate', () => {
        expect(isArrayOf([1, '2', 3], isNumber)).toBe(false);
        expect(isArrayOf(['a', 2, 'c'], isString)).toBe(false);
        expect(isArrayOf([true, 0, false], isBoolean)).toBe(false);
      });

      it('should return false for non-array values', () => {
        expect(isArrayOf({}, isNumber)).toBe(false);
        expect(isArrayOf('abc', isString)).toBe(false);
        expect(isArrayOf(123, isNumber)).toBe(false);
        expect(isArrayOf(true, isBoolean)).toBe(false);
        expect(isArrayOf(null, isNull)).toBe(false);
        expect(isArrayOf(undefined, isUndefined)).toBe(false);
        expect(isArrayOf(() => {}, isFunction)).toBe(false);
      });

      it('should work with custom predicates', () => {
        interface Person {
          name: string;
          age: number;
        }
        
        const isPerson = (value: unknown): value is Person => {
          return isObject<Person>(value) && 
                 isString(value.name) && 
                 isNumber(value.age);
        };
        
        const validPeople: Person[] = [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 }
        ];
        
        const invalidPeople = [
          { name: 'Charlie', age: '35' },
          { name: 42, age: 40 }
        ];
        
        expect(isArrayOf(validPeople, isPerson)).toBe(true);
        expect(isArrayOf(invalidPeople, isPerson)).toBe(false);
      });
    });

    describe('isRecordOf', () => {
      it('should return true for objects where all values satisfy the predicate', () => {
        expect(isRecordOf({ a: 1, b: 2, c: 3 }, isNumber)).toBe(true);
        expect(isRecordOf({ a: 'x', b: 'y', c: 'z' }, isString)).toBe(true);
        expect(isRecordOf({ a: true, b: false }, isBoolean)).toBe(true);
        expect(isRecordOf({}, isString)).toBe(true); // Empty objects always return true
      });

      it('should return false for objects where some values do not satisfy the predicate', () => {
        expect(isRecordOf({ a: 1, b: '2', c: 3 }, isNumber)).toBe(false);
        expect(isRecordOf({ a: 'x', b: 2, c: 'z' }, isString)).toBe(false);
        expect(isRecordOf({ a: true, b: 0, c: false }, isBoolean)).toBe(false);
      });

      it('should return false for non-object values', () => {
        expect(isRecordOf([], isNumber)).toBe(false);
        expect(isRecordOf('abc', isString)).toBe(false);
        expect(isRecordOf(123, isNumber)).toBe(false);
        expect(isRecordOf(true, isBoolean)).toBe(false);
        expect(isRecordOf(null, isNull)).toBe(false);
        expect(isRecordOf(undefined, isUndefined)).toBe(false);
        expect(isRecordOf(() => {}, isFunction)).toBe(false);
      });

      it('should work with custom predicates', () => {
        interface Person {
          name: string;
          age: number;
        }
        
        const isPerson = (value: unknown): value is Person => {
          return isObject<Person>(value) && 
                 isString(value.name) && 
                 isNumber(value.age);
        };
        
        const validPeopleRecord = {
          person1: { name: 'Alice', age: 30 },
          person2: { name: 'Bob', age: 25 }
        };
        
        const invalidPeopleRecord = {
          person1: { name: 'Charlie', age: '35' },
          person2: { name: 42, age: 40 }
        };
        
        expect(isRecordOf(validPeopleRecord, isPerson)).toBe(true);
        expect(isRecordOf(invalidPeopleRecord, isPerson)).toBe(false);
      });
    });
  });
});