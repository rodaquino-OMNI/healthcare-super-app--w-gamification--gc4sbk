import {
  isArray,
  isBoolean,
  isDate,
  isFunction,
  isNil,
  isNull,
  isNumber,
  isObject,
  isPromise,
  isString,
  isUndefined
} from '../../../src/type/guard';

describe('Type Guards', () => {
  describe('isString', () => {
    it('should return true for string values', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString(`template string`)).toBe(true);
      expect(isString(String('converted'))).toBe(true);
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
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-456)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
      expect(isNumber(Number('123'))).toBe(true);
      expect(isNumber(Infinity)).toBe(true);
      expect(isNumber(-Infinity)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isNumber(NaN)).toBe(false);
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

  describe('isNull', () => {
    it('should return true for null', () => {
      expect(isNull(null)).toBe(true);
    });

    it('should return false for non-null values', () => {
      expect(isNull(undefined)).toBe(false);
      expect(isNull(0)).toBe(false);
      expect(isNull('')).toBe(false);
      expect(isNull(false)).toBe(false);
      expect(isNull({})).toBe(false);
      expect(isNull([])).toBe(false);
      expect(isNull(NaN)).toBe(false);
    });
  });

  describe('isUndefined', () => {
    it('should return true for undefined', () => {
      expect(isUndefined(undefined)).toBe(true);
      let undefinedVar;
      expect(isUndefined(undefinedVar)).toBe(true);
    });

    it('should return false for non-undefined values', () => {
      expect(isUndefined(null)).toBe(false);
      expect(isUndefined(0)).toBe(false);
      expect(isUndefined('')).toBe(false);
      expect(isUndefined(false)).toBe(false);
      expect(isUndefined({})).toBe(false);
      expect(isUndefined([])).toBe(false);
      expect(isUndefined(NaN)).toBe(false);
    });
  });

  describe('isNil', () => {
    it('should return true for null and undefined', () => {
      expect(isNil(null)).toBe(true);
      expect(isNil(undefined)).toBe(true);
      let undefinedVar;
      expect(isNil(undefinedVar)).toBe(true);
    });

    it('should return false for non-nil values', () => {
      expect(isNil(0)).toBe(false);
      expect(isNil('')).toBe(false);
      expect(isNil(false)).toBe(false);
      expect(isNil({})).toBe(false);
      expect(isNil([])).toBe(false);
      expect(isNil(NaN)).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(new Array())).toBe(true);
      expect(isArray(Array.from('abc'))).toBe(true);
    });

    it('should return false for array-like objects', () => {
      expect(isArray({ length: 0 })).toBe(false);
      expect(isArray('array')).toBe(false);
    });

    it('should return false for non-array values', () => {
      expect(isArray({})).toBe(false);
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
      expect(isArray(123)).toBe(false);
      expect(isArray(true)).toBe(false);
      expect(isArray(() => {})).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should return true for objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
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

    it('should return false for non-object values', () => {
      expect(isObject(123)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(true)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject(Symbol('symbol'))).toBe(false);
    });

    it('should return false for functions', () => {
      expect(isObject(() => {})).toBe(false);
      expect(isObject(function() {})).toBe(false);
      expect(isObject(isObject)).toBe(false);
    });
  });

  describe('isFunction', () => {
    it('should return true for functions', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function() {})).toBe(true);
      expect(isFunction(isFunction)).toBe(true);
      expect(isFunction(Function)).toBe(true);
      expect(isFunction(async () => {})).toBe(true);
      expect(isFunction(function* () {})).toBe(true);
    });

    it('should return false for non-function values', () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction([])).toBe(false);
      expect(isFunction(123)).toBe(false);
      expect(isFunction('string')).toBe(false);
      expect(isFunction(true)).toBe(false);
      expect(isFunction(null)).toBe(false);
      expect(isFunction(undefined)).toBe(false);
    });

    it('should return true for class constructors', () => {
      class TestClass {}
      expect(isFunction(TestClass)).toBe(true);
    });
  });

  describe('isDate', () => {
    it('should return true for Date objects', () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date('2023-01-01'))).toBe(true);
    });

    it('should return false for date strings', () => {
      expect(isDate('2023-01-01')).toBe(false);
      expect(isDate('January 1, 2023')).toBe(false);
    });

    it('should return false for timestamps', () => {
      expect(isDate(Date.now())).toBe(false);
      expect(isDate(1672531200000)).toBe(false);
    });

    it('should return false for non-date values', () => {
      expect(isDate({})).toBe(false);
      expect(isDate([])).toBe(false);
      expect(isDate(123)).toBe(false);
      expect(isDate('string')).toBe(false);
      expect(isDate(true)).toBe(false);
      expect(isDate(null)).toBe(false);
      expect(isDate(undefined)).toBe(false);
    });

    it('should return false for invalid dates', () => {
      expect(isDate(new Date('invalid-date'))).toBe(false);
    });
  });

  describe('isPromise', () => {
    it('should return true for Promise objects', () => {
      expect(isPromise(Promise.resolve())).toBe(true);
      expect(isPromise(new Promise(() => {}))).toBe(true);
      expect(isPromise(Promise.reject().catch(() => {}))).toBe(true);
    });

    it('should return true for objects with then and catch methods', () => {
      const thenable = {
        then: () => {},
        catch: () => {}
      };
      expect(isPromise(thenable)).toBe(true);
    });

    it('should return false for objects with only then method', () => {
      const thenable = {
        then: () => {}
      };
      expect(isPromise(thenable)).toBe(false);
    });

    it('should return false for async functions (not their return values)', () => {
      const asyncFn = async () => {};
      expect(isPromise(asyncFn)).toBe(false);
    });

    it('should return true for return values of async functions', () => {
      const asyncFn = async () => {};
      expect(isPromise(asyncFn())).toBe(true);
    });

    it('should return false for non-promise values', () => {
      expect(isPromise({})).toBe(false);
      expect(isPromise([])).toBe(false);
      expect(isPromise(123)).toBe(false);
      expect(isPromise('string')).toBe(false);
      expect(isPromise(true)).toBe(false);
      expect(isPromise(null)).toBe(false);
      expect(isPromise(undefined)).toBe(false);
      expect(isPromise(() => {})).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle edge cases correctly', () => {
      // Empty string is still a string
      expect(isString('')).toBe(true);
      
      // Zero is still a number
      expect(isNumber(0)).toBe(true);
      
      // NaN is not considered a valid number
      expect(isNumber(NaN)).toBe(false);
      
      // Empty array is still an array
      expect(isArray([])).toBe(true);
      
      // Empty object is still an object
      expect(isObject({})).toBe(true);
      
      // Object.create(null) has no prototype but is still an object
      const noProtoObj = Object.create(null);
      expect(isObject(noProtoObj)).toBe(true);
    });

    it('should correctly identify objects vs arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isArray({})).toBe(false);
    });

    it('should handle boxed primitives correctly', () => {
      // String object vs string primitive
      expect(isString(new String('hello'))).toBe(true);
      
      // Number object vs number primitive
      expect(isNumber(new Number(123))).toBe(true);
      
      // Boolean object vs boolean primitive
      expect(isBoolean(new Boolean(true))).toBe(true);
    });
  });
});