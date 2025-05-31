import {
  toString,
  toNumber,
  toBoolean,
  toDate,
  toArray,
  toObject,
  toInteger
} from '../../../src/type/conversion';

describe('Type Conversion Utilities', () => {
  describe('toString', () => {
    it('should convert string values correctly', () => {
      expect(toString('hello')).toBe('hello');
      expect(toString('')).toBe('');
      expect(toString(`template string`)).toBe('template string');
    });

    it('should convert number values to strings', () => {
      expect(toString(123)).toBe('123');
      expect(toString(0)).toBe('0');
      expect(toString(-456)).toBe('-456');
      expect(toString(3.14)).toBe('3.14');
    });

    it('should convert boolean values to strings', () => {
      expect(toString(true)).toBe('true');
      expect(toString(false)).toBe('false');
    });

    it('should convert array values to strings', () => {
      expect(toString([1, 2, 3])).toBe('1,2,3');
      expect(toString([])).toBe('');
    });

    it('should convert object values to JSON strings', () => {
      expect(toString({ a: 1, b: 2 })).toBe('{"a":1,"b":2}');
      expect(toString({})).toBe('{}');
    });

    it('should handle null and undefined with default values', () => {
      expect(toString(null)).toBe('');
      expect(toString(undefined)).toBe('');
      expect(toString(null, 'default')).toBe('default');
      expect(toString(undefined, 'default')).toBe('default');
    });

    it('should handle Date objects correctly', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      expect(toString(date)).toBe(date.toString());
    });

    it('should handle special number values', () => {
      expect(toString(NaN)).toBe('');
      expect(toString(NaN, 'default')).toBe('default');
      expect(toString(Infinity)).toBe('Infinity');
      expect(toString(-Infinity)).toBe('-Infinity');
    });
  });

  describe('toNumber', () => {
    it('should convert numeric strings to numbers', () => {
      expect(toNumber('123')).toBe(123);
      expect(toNumber('0')).toBe(0);
      expect(toNumber('-456')).toBe(-456);
      expect(toNumber('3.14')).toBe(3.14);
    });

    it('should return number values unchanged', () => {
      expect(toNumber(123)).toBe(123);
      expect(toNumber(0)).toBe(0);
      expect(toNumber(-456)).toBe(-456);
      expect(toNumber(3.14)).toBe(3.14);
    });

    it('should convert boolean values to numbers', () => {
      expect(toNumber(true)).toBe(1);
      expect(toNumber(false)).toBe(0);
    });

    it('should handle non-numeric strings', () => {
      expect(toNumber('hello')).toBe(0);
      expect(toNumber('hello', 42)).toBe(42);
      expect(toNumber('', 42)).toBe(42);
    });

    it('should handle null and undefined with default values', () => {
      expect(toNumber(null)).toBe(0);
      expect(toNumber(undefined)).toBe(0);
      expect(toNumber(null, 42)).toBe(42);
      expect(toNumber(undefined, 42)).toBe(42);
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      expect(toNumber(date)).toBe(date.getTime());
    });

    it('should handle special cases', () => {
      expect(toNumber(NaN)).toBe(0);
      expect(toNumber(NaN, 42)).toBe(42);
      expect(toNumber(Infinity)).toBe(Infinity);
      expect(toNumber(-Infinity)).toBe(-Infinity);
    });

    it('should handle strings with whitespace', () => {
      expect(toNumber(' 123 ')).toBe(123);
      expect(toNumber('\t456\n')).toBe(456);
    });

    it('should handle numeric strings with currency symbols', () => {
      expect(toNumber('$123.45')).toBe(0);
      expect(toNumber('$123.45', 42)).toBe(42);
    });

    it('should handle arrays and objects', () => {
      expect(toNumber([1])).toBe(0);
      expect(toNumber([1], 42)).toBe(42);
      expect(toNumber({ value: 123 })).toBe(0);
      expect(toNumber({ value: 123 }, 42)).toBe(42);
    });
  });

  describe('toInteger', () => {
    it('should convert numeric strings to integers', () => {
      expect(toInteger('123')).toBe(123);
      expect(toInteger('0')).toBe(0);
      expect(toInteger('-456')).toBe(-456);
      expect(toInteger('3.14')).toBe(3);
      expect(toInteger('3.99')).toBe(3);
    });

    it('should convert numbers to integers', () => {
      expect(toInteger(123)).toBe(123);
      expect(toInteger(0)).toBe(0);
      expect(toInteger(-456)).toBe(-456);
      expect(toInteger(3.14)).toBe(3);
      expect(toInteger(3.99)).toBe(3);
    });

    it('should convert boolean values to integers', () => {
      expect(toInteger(true)).toBe(1);
      expect(toInteger(false)).toBe(0);
    });

    it('should handle non-numeric strings', () => {
      expect(toInteger('hello')).toBe(0);
      expect(toInteger('hello', 42)).toBe(42);
      expect(toInteger('', 42)).toBe(42);
    });

    it('should handle null and undefined with default values', () => {
      expect(toInteger(null)).toBe(0);
      expect(toInteger(undefined)).toBe(0);
      expect(toInteger(null, 42)).toBe(42);
      expect(toInteger(undefined, 42)).toBe(42);
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const timestamp = date.getTime();
      expect(toInteger(date)).toBe(timestamp);
    });

    it('should handle special cases', () => {
      expect(toInteger(NaN)).toBe(0);
      expect(toInteger(NaN, 42)).toBe(42);
      expect(toInteger(Infinity)).toBe(0);
      expect(toInteger(Infinity, 42)).toBe(42);
      expect(toInteger(-Infinity)).toBe(0);
      expect(toInteger(-Infinity, 42)).toBe(42);
    });

    it('should handle strings with whitespace', () => {
      expect(toInteger(' 123 ')).toBe(123);
      expect(toInteger('\t456\n')).toBe(456);
    });

    it('should handle numeric strings with decimal points', () => {
      expect(toInteger('123.45')).toBe(123);
      expect(toInteger('123.99')).toBe(123);
      expect(toInteger('-123.45')).toBe(-123);
    });
  });

  describe('toBoolean', () => {
    it('should convert boolean values correctly', () => {
      expect(toBoolean(true)).toBe(true);
      expect(toBoolean(false)).toBe(false);
    });

    it('should convert truthy string values to true', () => {
      expect(toBoolean('true')).toBe(true);
      expect(toBoolean('TRUE')).toBe(true);
      expect(toBoolean('True')).toBe(true);
      expect(toBoolean('yes')).toBe(true);
      expect(toBoolean('YES')).toBe(true);
      expect(toBoolean('Yes')).toBe(true);
      expect(toBoolean('1')).toBe(true);
      expect(toBoolean('on')).toBe(true);
      expect(toBoolean('ON')).toBe(true);
      expect(toBoolean('On')).toBe(true);
    });

    it('should convert falsy string values to false', () => {
      expect(toBoolean('false')).toBe(false);
      expect(toBoolean('FALSE')).toBe(false);
      expect(toBoolean('False')).toBe(false);
      expect(toBoolean('no')).toBe(false);
      expect(toBoolean('NO')).toBe(false);
      expect(toBoolean('No')).toBe(false);
      expect(toBoolean('0')).toBe(false);
      expect(toBoolean('off')).toBe(false);
      expect(toBoolean('OFF')).toBe(false);
      expect(toBoolean('Off')).toBe(false);
    });

    it('should convert number values to booleans', () => {
      expect(toBoolean(1)).toBe(true);
      expect(toBoolean(0)).toBe(false);
      expect(toBoolean(42)).toBe(true);
      expect(toBoolean(-1)).toBe(true);
    });

    it('should handle non-boolean strings', () => {
      expect(toBoolean('hello')).toBe(false);
      expect(toBoolean('hello', true)).toBe(true);
      expect(toBoolean('', true)).toBe(true);
    });

    it('should handle null and undefined with default values', () => {
      expect(toBoolean(null)).toBe(false);
      expect(toBoolean(undefined)).toBe(false);
      expect(toBoolean(null, true)).toBe(true);
      expect(toBoolean(undefined, true)).toBe(true);
    });

    it('should handle objects and arrays', () => {
      // Non-empty objects and arrays are truthy in JavaScript
      expect(toBoolean({})).toBe(true);
      expect(toBoolean([])).toBe(true);
      expect(toBoolean({ a: 1 })).toBe(true);
      expect(toBoolean([1, 2, 3])).toBe(true);
    });

    it('should handle special cases', () => {
      expect(toBoolean(NaN)).toBe(false);
      expect(toBoolean(NaN, true)).toBe(true);
    });
  });

  describe('toDate', () => {
    it('should convert valid date strings to Date objects', () => {
      const dateStr = '2023-01-01T00:00:00.000Z';
      const expected = new Date(dateStr);
      const result = toDate(dateStr);
      
      expect(result instanceof Date).toBe(true);
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should handle various date formats', () => {
      // ISO format
      expect(toDate('2023-01-01')?.getFullYear()).toBe(2023);
      expect(toDate('2023-01-01')?.getMonth()).toBe(0); // January is 0
      expect(toDate('2023-01-01')?.getDate()).toBe(1);
      
      // MM/DD/YYYY format
      const mmddyyyy = toDate('01/01/2023');
      expect(mmddyyyy?.getFullYear()).toBe(2023);
      expect(mmddyyyy?.getMonth()).toBe(0);
      expect(mmddyyyy?.getDate()).toBe(1);
      
      // Month name format
      const monthName = toDate('January 1, 2023');
      expect(monthName?.getFullYear()).toBe(2023);
      expect(monthName?.getMonth()).toBe(0);
      expect(monthName?.getDate()).toBe(1);
    });

    it('should return Date objects unchanged', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = toDate(date);
      
      expect(result).toBe(date); // Same reference
      expect(result?.getTime()).toBe(date.getTime());
    });

    it('should convert timestamps to Date objects', () => {
      const timestamp = 1672531200000; // 2023-01-01T00:00:00.000Z
      const expected = new Date(timestamp);
      const result = toDate(timestamp);
      
      expect(result instanceof Date).toBe(true);
      expect(result?.getTime()).toBe(expected.getTime());
    });

    it('should handle invalid date strings', () => {
      expect(toDate('not a date')).toBeNull();
      expect(toDate('not a date', new Date(0))).toEqual(new Date(0));
    });

    it('should handle null and undefined with default values', () => {
      expect(toDate(null)).toBeNull();
      expect(toDate(undefined)).toBeNull();
      
      const defaultDate = new Date(0);
      expect(toDate(null, defaultDate)).toBe(defaultDate);
      expect(toDate(undefined, defaultDate)).toBe(defaultDate);
    });

    it('should handle objects and arrays', () => {
      expect(toDate({})).toBeNull();
      expect(toDate([])).toBeNull();
      
      const defaultDate = new Date(0);
      expect(toDate({}, defaultDate)).toBe(defaultDate);
      expect(toDate([], defaultDate)).toBe(defaultDate);
    });

    it('should handle edge cases with dates', () => {
      // Invalid dates
      expect(toDate('2023-13-01')).toBeNull(); // Invalid month
      expect(toDate('2023-02-30')).toBeNull(); // Invalid day
      
      // Date with invalid format but valid when parsed
      const invalidFormat = toDate('2023/01/01');
      expect(invalidFormat instanceof Date).toBe(true);
      expect(invalidFormat?.getFullYear()).toBe(2023);
      
      // Very old and future dates
      expect(toDate('1800-01-01') instanceof Date).toBe(true);
      expect(toDate('2100-01-01') instanceof Date).toBe(true);
    });
  });

  describe('toArray', () => {
    it('should return arrays unchanged', () => {
      const arr = [1, 2, 3];
      expect(toArray(arr)).toBe(arr); // Same reference
      expect(toArray([])).toEqual([]);
    });

    it('should convert non-array values to single-item arrays', () => {
      expect(toArray('string')).toEqual(['string']);
      expect(toArray(123)).toEqual([123]);
      expect(toArray(true)).toEqual([true]);
      expect(toArray({ a: 1 })).toEqual([{ a: 1 }]);
    });

    it('should handle comma-separated strings', () => {
      expect(toArray('a,b,c', { split: true })).toEqual(['a', 'b', 'c']);
      expect(toArray('1,2,3', { split: true })).toEqual(['1', '2', '3']);
      expect(toArray('a, b, c', { split: true })).toEqual(['a', ' b', ' c']);
    });

    it('should handle custom separators', () => {
      expect(toArray('a|b|c', { split: true, separator: '|' })).toEqual(['a', 'b', 'c']);
      expect(toArray('a;b;c', { split: true, separator: ';' })).toEqual(['a', 'b', 'c']);
    });

    it('should handle null and undefined with default values', () => {
      expect(toArray(null)).toEqual([]);
      expect(toArray(undefined)).toEqual([]);
      
      const defaultArray = [1, 2, 3];
      expect(toArray(null, { defaultValue: defaultArray })).toBe(defaultArray);
      expect(toArray(undefined, { defaultValue: defaultArray })).toBe(defaultArray);
    });

    it('should handle empty strings', () => {
      expect(toArray('', { split: true })).toEqual(['']);
      expect(toArray('', { split: true, removeEmpty: true })).toEqual([]);
    });

    it('should handle options for removing empty items', () => {
      expect(toArray('a,,c', { split: true })).toEqual(['a', '', 'c']);
      expect(toArray('a,,c', { split: true, removeEmpty: true })).toEqual(['a', 'c']);
      expect(toArray('a, ,c', { split: true, removeEmpty: true })).toEqual(['a', 'c']);
    });

    it('should handle options for trimming items', () => {
      expect(toArray(' a , b , c ', { split: true })).toEqual([' a ', ' b ', ' c ']);
      expect(toArray(' a , b , c ', { split: true, trim: true })).toEqual(['a', 'b', 'c']);
    });

    it('should handle combination of options', () => {
      expect(toArray(' a , , c ', { 
        split: true, 
        trim: true, 
        removeEmpty: true 
      })).toEqual(['a', 'c']);
    });
  });

  describe('toObject', () => {
    it('should return objects unchanged', () => {
      const obj = { a: 1, b: 2 };
      expect(toObject(obj)).toBe(obj); // Same reference
      expect(toObject({})).toEqual({});
    });

    it('should convert JSON strings to objects', () => {
      expect(toObject('{"a":1,"b":2}')).toEqual({ a: 1, b: 2 });
      expect(toObject('[]')).toEqual([]);
      expect(toObject('"string"')).toBe('string');
      expect(toObject('123')).toBe(123);
      expect(toObject('true')).toBe(true);
    });

    it('should handle invalid JSON strings', () => {
      expect(toObject('{a:1}')).toEqual({});
      expect(toObject('{a:1}', { a: 2 })).toEqual({ a: 2 });
      expect(toObject('not json')).toEqual({});
    });

    it('should handle null and undefined with default values', () => {
      expect(toObject(null)).toEqual({});
      expect(toObject(undefined)).toEqual({});
      
      const defaultObj = { a: 1 };
      expect(toObject(null, defaultObj)).toBe(defaultObj);
      expect(toObject(undefined, defaultObj)).toBe(defaultObj);
    });

    it('should handle primitive values', () => {
      expect(toObject(123)).toEqual({});
      expect(toObject('string')).toEqual({});
      expect(toObject(true)).toEqual({});
    });

    it('should handle arrays', () => {
      // Arrays are objects in JavaScript, but this function might treat them differently
      expect(toObject([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should handle Date objects', () => {
      const date = new Date();
      expect(toObject(date)).toEqual({});
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle circular references gracefully', () => {
      const circular: any = { a: 1 };
      circular.self = circular;
      
      // These should not throw errors
      expect(() => toString(circular)).not.toThrow();
      expect(() => toObject(circular)).not.toThrow();
    });

    it('should handle very large numbers without precision loss', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER;
      expect(toNumber(largeNumber.toString())).toBe(largeNumber);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      expect(toString(longString)).toBe(longString);
    });

    it('should handle functions gracefully', () => {
      const fn = () => 'test';
      expect(toString(fn)).toBe('');
      expect(toNumber(fn)).toBe(0);
      expect(toBoolean(fn)).toBe(true); // Functions are truthy
      expect(toDate(fn)).toBeNull();
      expect(toArray(fn)).toEqual([fn]);
      expect(toObject(fn)).toEqual({});
    });

    it('should handle symbols gracefully', () => {
      const sym = Symbol('test');
      expect(toString(sym)).toBe('');
      expect(toNumber(sym)).toBe(0);
      expect(toBoolean(sym)).toBe(true); // Symbols are truthy
      expect(toDate(sym)).toBeNull();
      expect(toArray(sym)).toEqual([sym]);
      expect(toObject(sym)).toEqual({});
    });
  });
});