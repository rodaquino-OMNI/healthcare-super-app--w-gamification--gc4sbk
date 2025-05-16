/**
 * Tests for type conversion utility functions
 * 
 * These tests validate that conversions handle edge cases like null values, invalid inputs,
 * and type mismatches correctly, preventing runtime errors. They ensure that default values
 * are properly applied when conversions fail and that all primitive types are supported
 * correctly across journey services.
 */

import {
  isNullOrUndefined,
  toString,
  toNumber,
  toInteger,
  toFloat,
  toBoolean,
  toDate,
  toArray,
  toObject,
  toMap,
  toSet,
  toEnum,
  toURL,
  toJourneyFormat,
  withRetry,
  withOptimisticLock,
  withCircuitBreaker
} from '../../../src/type/conversion';

describe('Type Conversion Functions', () => {
  // Basic null/undefined check
  describe('isNullOrUndefined', () => {
    it('should return true for null values', () => {
      expect(isNullOrUndefined(null)).toBe(true);
    });

    it('should return true for undefined values', () => {
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

  // String conversion
  describe('toString', () => {
    it('should return the input string for string values', () => {
      expect(toString('hello')).toBe('hello');
      expect(toString('')).toBe('');
      expect(toString('   ')).toBe('   ');
    });

    it('should convert numbers to strings', () => {
      expect(toString(123)).toBe('123');
      expect(toString(0)).toBe('0');
      expect(toString(-456)).toBe('-456');
      expect(toString(3.14)).toBe('3.14');
    });

    it('should convert booleans to strings', () => {
      expect(toString(true)).toBe('true');
      expect(toString(false)).toBe('false');
    });

    it('should convert Date objects to ISO strings', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      expect(toString(date)).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should convert objects to JSON strings', () => {
      expect(toString({ a: 1, b: 'test' })).toBe('{"a":1,"b":"test"}');
      expect(toString([1, 2, 3])).toBe('[1,2,3]');
    });

    it('should return the default value for null and undefined', () => {
      expect(toString(null)).toBe('');
      expect(toString(undefined)).toBe('');
      expect(toString(null, 'default')).toBe('default');
      expect(toString(undefined, 'default')).toBe('default');
    });

    it('should handle custom default values', () => {
      expect(toString('hello', 'default')).toBe('hello');
      expect(toString(null, 'custom default')).toBe('custom default');
    });
  });

  // Number conversion
  describe('toNumber', () => {
    it('should return the input number for number values', () => {
      expect(toNumber(123)).toBe(123);
      expect(toNumber(0)).toBe(0);
      expect(toNumber(-456)).toBe(-456);
      expect(toNumber(3.14)).toBe(3.14);
    });

    it('should convert numeric strings to numbers', () => {
      expect(toNumber('123')).toBe(123);
      expect(toNumber('0')).toBe(0);
      expect(toNumber('-456')).toBe(-456);
      expect(toNumber('3.14')).toBe(3.14);
      expect(toNumber('  42  ')).toBe(42);
    });

    it('should convert booleans to numbers', () => {
      expect(toNumber(true)).toBe(1);
      expect(toNumber(false)).toBe(0);
    });

    it('should convert Date objects to timestamps', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      expect(toNumber(date)).toBe(date.getTime());
    });

    it('should return the default value for non-numeric strings', () => {
      expect(toNumber('')).toBe(0);
      expect(toNumber('abc')).toBe(0);
      expect(toNumber('123abc')).toBe(0);
      expect(toNumber('abc123')).toBe(0);
    });

    it('should return the default value for null and undefined', () => {
      expect(toNumber(null)).toBe(0);
      expect(toNumber(undefined)).toBe(0);
      expect(toNumber(null, 42)).toBe(42);
      expect(toNumber(undefined, 42)).toBe(42);
    });

    it('should handle custom default values', () => {
      expect(toNumber('hello', 42)).toBe(42);
      expect(toNumber(null, -1)).toBe(-1);
    });

    it('should handle NaN values', () => {
      expect(toNumber(NaN)).toBe(0);
      expect(toNumber(NaN, 42)).toBe(42);
    });
  });

  // Integer conversion
  describe('toInteger', () => {
    it('should return the input integer for integer values', () => {
      expect(toInteger(123)).toBe(123);
      expect(toInteger(0)).toBe(0);
      expect(toInteger(-456)).toBe(-456);
    });

    it('should convert floating-point numbers to integers by flooring', () => {
      expect(toInteger(3.14)).toBe(3);
      expect(toInteger(3.99)).toBe(3);
      expect(toInteger(-3.14)).toBe(-4);
      expect(toInteger(-3.99)).toBe(-4);
    });

    it('should convert numeric strings to integers', () => {
      expect(toInteger('123')).toBe(123);
      expect(toInteger('3.14')).toBe(3);
      expect(toInteger('-3.99')).toBe(-4);
    });

    it('should convert booleans to integers', () => {
      expect(toInteger(true)).toBe(1);
      expect(toInteger(false)).toBe(0);
    });

    it('should return the default value for non-numeric strings', () => {
      expect(toInteger('')).toBe(0);
      expect(toInteger('abc')).toBe(0);
      expect(toInteger('123abc')).toBe(0);
    });

    it('should return the default value for null and undefined', () => {
      expect(toInteger(null)).toBe(0);
      expect(toInteger(undefined)).toBe(0);
      expect(toInteger(null, 42)).toBe(42);
      expect(toInteger(undefined, 42)).toBe(42);
    });

    it('should handle custom default values', () => {
      expect(toInteger('hello', 42)).toBe(42);
      expect(toInteger(null, -1)).toBe(-1);
    });
  });

  // Float conversion
  describe('toFloat', () => {
    it('should return the input number for number values', () => {
      expect(toFloat(123)).toBe(123);
      expect(toFloat(0)).toBe(0);
      expect(toFloat(-456)).toBe(-456);
      expect(toFloat(3.14)).toBe(3.14);
    });

    it('should convert numeric strings to floats', () => {
      expect(toFloat('123')).toBe(123);
      expect(toFloat('0')).toBe(0);
      expect(toFloat('-456')).toBe(-456);
      expect(toFloat('3.14')).toBe(3.14);
    });

    it('should round to the specified precision', () => {
      expect(toFloat(3.14159, 0, 2)).toBe(3.14);
      expect(toFloat(3.14159, 0, 3)).toBe(3.142);
      expect(toFloat(3.14159, 0, 4)).toBe(3.1416);
      expect(toFloat(3.14159, 0, 0)).toBe(3);
    });

    it('should convert booleans to floats', () => {
      expect(toFloat(true)).toBe(1);
      expect(toFloat(false)).toBe(0);
    });

    it('should return the default value for non-numeric strings', () => {
      expect(toFloat('')).toBe(0);
      expect(toFloat('abc')).toBe(0);
      expect(toFloat('123abc')).toBe(0);
    });

    it('should return the default value for null and undefined', () => {
      expect(toFloat(null)).toBe(0);
      expect(toFloat(undefined)).toBe(0);
      expect(toFloat(null, 42.5)).toBe(42.5);
      expect(toFloat(undefined, 42.5)).toBe(42.5);
    });

    it('should handle custom default values with precision', () => {
      expect(toFloat('hello', 42.123, 2)).toBe(42.12);
      expect(toFloat(null, 42.123, 1)).toBe(42.1);
    });
  });

  // Boolean conversion
  describe('toBoolean', () => {
    it('should return the input boolean for boolean values', () => {
      expect(toBoolean(true)).toBe(true);
      expect(toBoolean(false)).toBe(false);
    });

    it('should convert truthy strings to true', () => {
      expect(toBoolean('true')).toBe(true);
      expect(toBoolean('t')).toBe(true);
      expect(toBoolean('yes')).toBe(true);
      expect(toBoolean('y')).toBe(true);
      expect(toBoolean('1')).toBe(true);
      expect(toBoolean('sim')).toBe(true);
      expect(toBoolean('s')).toBe(true);
      expect(toBoolean('TRUE')).toBe(true);
      expect(toBoolean('Yes')).toBe(true);
      expect(toBoolean('  yes  ')).toBe(true);
    });

    it('should convert falsy strings to false', () => {
      expect(toBoolean('false')).toBe(false);
      expect(toBoolean('f')).toBe(false);
      expect(toBoolean('no')).toBe(false);
      expect(toBoolean('n')).toBe(false);
      expect(toBoolean('0')).toBe(false);
      expect(toBoolean('não')).toBe(false);
      expect(toBoolean('nao')).toBe(false);
      expect(toBoolean('FALSE')).toBe(false);
      expect(toBoolean('No')).toBe(false);
      expect(toBoolean('  no  ')).toBe(false);
    });

    it('should convert numbers to booleans', () => {
      expect(toBoolean(1)).toBe(true);
      expect(toBoolean(42)).toBe(true);
      expect(toBoolean(0)).toBe(false);
    });

    it('should return the default value for ambiguous strings', () => {
      expect(toBoolean('hello')).toBe(false);
      expect(toBoolean('hello', true)).toBe(true);
    });

    it('should return the default value for null and undefined', () => {
      expect(toBoolean(null)).toBe(false);
      expect(toBoolean(undefined)).toBe(false);
      expect(toBoolean(null, true)).toBe(true);
      expect(toBoolean(undefined, true)).toBe(true);
    });

    it('should handle custom default values', () => {
      expect(toBoolean('hello', true)).toBe(true);
      expect(toBoolean(null, true)).toBe(true);
    });
  });

  // Date conversion
  describe('toDate', () => {
    it('should return the input Date for valid Date objects', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      expect(toDate(date)).toEqual(date);
    });

    it('should convert ISO date strings to Date objects', () => {
      const dateStr = '2023-01-01T12:00:00Z';
      const expected = new Date(dateStr);
      expect(toDate(dateStr)).toEqual(expected);
    });

    it('should convert timestamps to Date objects', () => {
      const timestamp = 1672574400000; // 2023-01-01T12:00:00Z
      const expected = new Date(timestamp);
      expect(toDate(timestamp)).toEqual(expected);
    });

    it('should convert DD/MM/YYYY format strings to Date objects', () => {
      const dateStr = '01/01/2023';
      const expected = new Date(2023, 0, 1); // Month is 0-indexed
      expect(toDate(dateStr)).toEqual(expected);
    });

    it('should return the default value for invalid Date objects', () => {
      const invalidDate = new Date('invalid date');
      expect(toDate(invalidDate)).toBeNull();
    });

    it('should return the default value for invalid date strings', () => {
      expect(toDate('not a date')).toBeNull();
      expect(toDate('32/01/2023')).toBeNull(); // Invalid day
      expect(toDate('01/13/2023')).toBeNull(); // Invalid month
    });

    it('should return the default value for null and undefined', () => {
      expect(toDate(null)).toBeNull();
      expect(toDate(undefined)).toBeNull();
      
      const defaultDate = new Date('2000-01-01');
      expect(toDate(null, defaultDate)).toEqual(defaultDate);
      expect(toDate(undefined, defaultDate)).toEqual(defaultDate);
    });

    it('should handle custom default values', () => {
      const defaultDate = new Date('2000-01-01');
      expect(toDate('invalid', defaultDate)).toEqual(defaultDate);
    });
  });

  // Array conversion
  describe('toArray', () => {
    it('should return the input array for array values', () => {
      const arr = [1, 2, 3];
      expect(toArray(arr)).toEqual(arr);
      expect(toArray([])).toEqual([]);
    });

    it('should convert JSON array strings to arrays', () => {
      expect(toArray('[1,2,3]')).toEqual([1, 2, 3]);
      expect(toArray('[]')).toEqual([]);
      expect(toArray('["a","b","c"]')).toEqual(['a', 'b', 'c']);
    });

    it('should wrap non-array values in an array', () => {
      expect(toArray(123)).toEqual([123]);
      expect(toArray('hello')).toEqual(['hello']);
      expect(toArray(true)).toEqual([true]);
      expect(toArray({ a: 1 })).toEqual([{ a: 1 }]);
    });

    it('should return the default value for null and undefined', () => {
      expect(toArray(null)).toEqual([]);
      expect(toArray(undefined)).toEqual([]);
      
      const defaultArr = [42];
      expect(toArray(null, defaultArr)).toEqual(defaultArr);
      expect(toArray(undefined, defaultArr)).toEqual(defaultArr);
    });

    it('should handle custom default values', () => {
      const defaultArr = ['default'];
      expect(toArray(null, defaultArr)).toEqual(defaultArr);
    });

    it('should handle invalid JSON strings', () => {
      expect(toArray('[1,2,')).toEqual(['[1,2,']);
      expect(toArray('not an array')).toEqual(['not an array']);
    });

    it('should work with generic type parameter', () => {
      const numberArray = [1, 2, 3];
      const result = toArray<number>(numberArray);
      expect(result).toEqual(numberArray);
      
      // This is a runtime test, TypeScript would catch this at compile time
      const mixedResult = toArray<string>([1, 2, 3]);
      expect(mixedResult).toEqual([1, 2, 3]);
    });
  });

  // Object conversion
  describe('toObject', () => {
    it('should return the input object for object values', () => {
      const obj = { a: 1, b: 'test' };
      expect(toObject(obj)).toEqual(obj);
      expect(toObject({})).toEqual({});
    });

    it('should convert JSON object strings to objects', () => {
      expect(toObject('{"a":1,"b":"test"}')).toEqual({ a: 1, b: 'test' });
      expect(toObject('{}')).toEqual({});
    });

    it('should return the default value for arrays', () => {
      expect(toObject([])).toEqual({});
      expect(toObject([1, 2, 3])).toEqual({});
    });

    it('should return the default value for non-object values', () => {
      expect(toObject(123)).toEqual({});
      expect(toObject('hello')).toEqual({});
      expect(toObject(true)).toEqual({});
    });

    it('should return the default value for null and undefined', () => {
      expect(toObject(null)).toEqual({});
      expect(toObject(undefined)).toEqual({});
      
      const defaultObj = { default: true };
      expect(toObject(null, defaultObj)).toEqual(defaultObj);
      expect(toObject(undefined, defaultObj)).toEqual(defaultObj);
    });

    it('should handle custom default values', () => {
      const defaultObj = { default: true };
      expect(toObject('not an object', defaultObj)).toEqual(defaultObj);
    });

    it('should handle invalid JSON strings', () => {
      expect(toObject('{a:1')).toEqual({});
      expect(toObject('not an object')).toEqual({});
    });

    it('should work with generic type parameter', () => {
      interface TestInterface {
        id: number;
        name: string;
      }
      
      const obj: TestInterface = { id: 1, name: 'Test' };
      const result = toObject<TestInterface>(obj);
      expect(result).toEqual(obj);
      
      // This is a runtime test, TypeScript would catch this at compile time
      const defaultObj: TestInterface = { id: 0, name: '' };
      const stringResult = toObject<TestInterface>('not an object', defaultObj);
      expect(stringResult).toEqual(defaultObj);
    });
  });

  // Map conversion
  describe('toMap', () => {
    it('should return the input Map for Map values', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      const result = toMap(map);
      expect(result).toEqual(map);
      expect(result instanceof Map).toBe(true);
    });

    it('should convert objects to Maps', () => {
      const obj = { a: 1, b: 2 };
      const result = toMap(obj);
      expect(result instanceof Map).toBe(true);
      expect(result.get('a')).toBe(1);
      expect(result.get('b')).toBe(2);
    });

    it('should convert JSON object strings to Maps', () => {
      const jsonStr = '{"a":1,"b":2}';
      const result = toMap(jsonStr);
      expect(result instanceof Map).toBe(true);
      expect(result.get('a')).toBe(1);
      expect(result.get('b')).toBe(2);
    });

    it('should return the default value for non-object values', () => {
      const defaultMap = new Map([['default', true]]);
      expect(toMap(123, defaultMap)).toEqual(defaultMap);
      expect(toMap(true, defaultMap)).toEqual(defaultMap);
      expect(toMap([], defaultMap)).toEqual(defaultMap);
    });

    it('should return the default value for null and undefined', () => {
      const emptyMap = toMap(null);
      expect(emptyMap instanceof Map).toBe(true);
      expect(emptyMap.size).toBe(0);
      
      const defaultMap = new Map([['default', true]]);
      expect(toMap(null, defaultMap)).toEqual(defaultMap);
      expect(toMap(undefined, defaultMap)).toEqual(defaultMap);
    });

    it('should handle invalid JSON strings', () => {
      const emptyMap = toMap('{a:1');
      expect(emptyMap instanceof Map).toBe(true);
      expect(emptyMap.size).toBe(0);
    });

    it('should work with generic type parameters', () => {
      const map = new Map<string, number>([['a', 1], ['b', 2]]);
      const result = toMap<string, number>(map);
      expect(result).toEqual(map);
      
      const obj = { a: 1, b: 2 };
      const objResult = toMap<string, number>(obj);
      expect(objResult.get('a')).toBe(1);
      expect(objResult.get('b')).toBe(2);
    });
  });

  // Set conversion
  describe('toSet', () => {
    it('should return the input Set for Set values', () => {
      const set = new Set([1, 2, 3]);
      const result = toSet(set);
      expect(result).toEqual(set);
      expect(result instanceof Set).toBe(true);
    });

    it('should convert arrays to Sets', () => {
      const arr = [1, 2, 3, 3]; // Note the duplicate
      const result = toSet(arr);
      expect(result instanceof Set).toBe(true);
      expect(result.size).toBe(3); // Duplicates are removed
      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);
      expect(result.has(3)).toBe(true);
    });

    it('should convert JSON array strings to Sets', () => {
      const jsonStr = '[1,2,3,3]';
      const result = toSet(jsonStr);
      expect(result instanceof Set).toBe(true);
      expect(result.size).toBe(3); // Duplicates are removed
      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);
      expect(result.has(3)).toBe(true);
    });

    it('should create a Set with a single item for non-array values', () => {
      const numResult = toSet(123);
      expect(numResult instanceof Set).toBe(true);
      expect(numResult.size).toBe(1);
      expect(numResult.has(123)).toBe(true);
      
      const strResult = toSet('hello');
      expect(strResult instanceof Set).toBe(true);
      expect(strResult.size).toBe(1);
      expect(strResult.has('hello')).toBe(true);
    });

    it('should return the default value for null and undefined', () => {
      const emptySet = toSet(null);
      expect(emptySet instanceof Set).toBe(true);
      expect(emptySet.size).toBe(0);
      
      const defaultSet = new Set([42]);
      expect(toSet(null, defaultSet)).toEqual(defaultSet);
      expect(toSet(undefined, defaultSet)).toEqual(defaultSet);
    });

    it('should handle invalid JSON strings', () => {
      const result = toSet('[1,2,');
      expect(result instanceof Set).toBe(true);
      expect(result.size).toBe(1);
      expect(result.has('[1,2,')).toBe(true);
    });

    it('should work with generic type parameter', () => {
      const set = new Set<number>([1, 2, 3]);
      const result = toSet<number>(set);
      expect(result).toEqual(set);
      
      const arr = [1, 2, 3];
      const arrResult = toSet<number>(arr);
      expect(arrResult.has(1)).toBe(true);
      expect(arrResult.has(2)).toBe(true);
      expect(arrResult.has(3)).toBe(true);
    });
  });

  // Enum conversion
  describe('toEnum', () => {
    enum TestEnum {
      A = 'a',
      B = 'b',
      C = 'c'
    }

    enum NumericEnum {
      One = 1,
      Two = 2,
      Three = 3
    }

    it('should return the enum value for valid enum values', () => {
      expect(toEnum(TestEnum.A, TestEnum, TestEnum.C)).toBe(TestEnum.A);
      expect(toEnum('a', TestEnum, TestEnum.C)).toBe(TestEnum.A);
      expect(toEnum(NumericEnum.One, NumericEnum, NumericEnum.Three)).toBe(NumericEnum.One);
      expect(toEnum(1, NumericEnum, NumericEnum.Three)).toBe(NumericEnum.One);
    });

    it('should return the enum value for valid enum keys (case insensitive)', () => {
      expect(toEnum('A', TestEnum, TestEnum.C)).toBe(TestEnum.A);
      expect(toEnum('a', TestEnum, TestEnum.C)).toBe(TestEnum.A);
      expect(toEnum('One', NumericEnum, NumericEnum.Three)).toBe(NumericEnum.One);
      expect(toEnum('ONE', NumericEnum, NumericEnum.Three)).toBe(NumericEnum.One);
    });

    it('should return the default value for invalid enum values', () => {
      expect(toEnum('d', TestEnum, TestEnum.C)).toBe(TestEnum.C);
      expect(toEnum(4, NumericEnum, NumericEnum.Three)).toBe(NumericEnum.Three);
      expect(toEnum('NotAnEnum', TestEnum, TestEnum.C)).toBe(TestEnum.C);
    });

    it('should return the default value for null and undefined', () => {
      expect(toEnum(null, TestEnum, TestEnum.C)).toBe(TestEnum.C);
      expect(toEnum(undefined, TestEnum, TestEnum.C)).toBe(TestEnum.C);
    });
  });

  // URL conversion
  describe('toURL', () => {
    it('should return the input URL for URL objects', () => {
      const url = new URL('https://example.com');
      expect(toURL(url)).toBe(url);
    });

    it('should convert valid URL strings to URL objects', () => {
      const urlStr = 'https://example.com/path?query=value#fragment';
      const result = toURL(urlStr);
      expect(result instanceof URL).toBe(true);
      expect(result?.href).toBe(urlStr);
      expect(result?.hostname).toBe('example.com');
      expect(result?.pathname).toBe('/path');
      expect(result?.search).toBe('?query=value');
      expect(result?.hash).toBe('#fragment');
    });

    it('should return the default value for invalid URL strings', () => {
      expect(toURL('not a url')).toBeNull();
      expect(toURL('http://')).toBeNull();
      expect(toURL('example.com')).toBeNull(); // Missing protocol
    });

    it('should return the default value for non-string values', () => {
      expect(toURL(123)).toBeNull();
      expect(toURL(true)).toBeNull();
      expect(toURL({})).toBeNull();
      expect(toURL([])).toBeNull();
    });

    it('should return the default value for null and undefined', () => {
      expect(toURL(null)).toBeNull();
      expect(toURL(undefined)).toBeNull();
      
      const defaultUrl = new URL('https://default.com');
      expect(toURL(null, defaultUrl)).toBe(defaultUrl);
      expect(toURL(undefined, defaultUrl)).toBe(defaultUrl);
    });

    it('should handle custom default values', () => {
      const defaultUrl = new URL('https://default.com');
      expect(toURL('not a url', defaultUrl)).toBe(defaultUrl);
    });
  });

  // Journey-specific format conversion
  describe('toJourneyFormat', () => {
    it('should convert values based on journey and type', () => {
      // Health journey date conversion (with time)
      const healthDate = new Date('2023-01-01T12:00:00Z');
      expect(toJourneyFormat(healthDate, 'health', 'date', null)).toBe(healthDate.toISOString());
      
      // Care journey date conversion (date only)
      const careDate = new Date('2023-01-01T12:00:00Z');
      expect(toJourneyFormat(careDate, 'care', 'date', null)).toBe('2023-01-01');
      
      // Plan journey currency conversion
      expect(toJourneyFormat(123.456, 'plan', 'currency', null)).toBe('123.46');
    });

    it('should use standard conversions for non-journey-specific types', () => {
      expect(toJourneyFormat('123', 'health', 'number', 0)).toBe(123);
      expect(toJourneyFormat(123, 'care', 'string', '')).toBe('123');
      expect(toJourneyFormat('true', 'plan', 'boolean', false)).toBe(true);
    });

    it('should return the default value for null and undefined', () => {
      expect(toJourneyFormat(null, 'health', 'string', 'default')).toBe('default');
      expect(toJourneyFormat(undefined, 'care', 'number', 42)).toBe(42);
    });

    it('should return the default value for invalid conversions', () => {
      expect(toJourneyFormat('not a date', 'health', 'date', 'default')).toBe('default');
      expect(toJourneyFormat('not a number', 'plan', 'currency', 'default')).toBe('default');
    });

    it('should handle unknown journey IDs gracefully', () => {
      expect(toJourneyFormat('test', 'unknown', 'string', 'default')).toBe('test');
      expect(toJourneyFormat('not a number', 'unknown', 'number', 42)).toBe(42);
    });

    it('should handle unknown type gracefully', () => {
      expect(toJourneyFormat('test', 'health', 'unknown', 'default')).toBe('default');
    });
  });

  // Async conversion with retry
  describe('withRetry', () => {
    it('should return the converted value on successful conversion', async () => {
      const conversionFn = jest.fn().mockResolvedValue(42);
      const result = await withRetry('test', conversionFn, 0);
      expect(result).toBe(42);
      expect(conversionFn).toHaveBeenCalledTimes(1);
      expect(conversionFn).toHaveBeenCalledWith('test');
    });

    it('should retry failed conversions up to maxRetries', async () => {
      const conversionFn = jest.fn()
        .mockRejectedValueOnce(new Error('Conversion failed'))
        .mockRejectedValueOnce(new Error('Conversion failed again'))
        .mockResolvedValue(42);
      
      const result = await withRetry('test', conversionFn, 0, 3, 10);
      expect(result).toBe(42);
      expect(conversionFn).toHaveBeenCalledTimes(3);
    });

    it('should return the default value if all retries fail', async () => {
      const conversionFn = jest.fn().mockRejectedValue(new Error('Conversion failed'));
      const result = await withRetry('test', conversionFn, 'default', 3, 10);
      expect(result).toBe('default');
      expect(conversionFn).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff between retries', async () => {
      jest.useFakeTimers();
      
      const conversionFn = jest.fn()
        .mockRejectedValueOnce(new Error('Conversion failed'))
        .mockRejectedValueOnce(new Error('Conversion failed again'))
        .mockResolvedValue(42);
      
      const promise = withRetry('test', conversionFn, 0, 3, 100);
      
      // First call happens immediately
      expect(conversionFn).toHaveBeenCalledTimes(1);
      
      // First retry after 100ms
      jest.advanceTimersByTime(100);
      await Promise.resolve(); // Let promises resolve
      expect(conversionFn).toHaveBeenCalledTimes(2);
      
      // Second retry after 200ms (exponential backoff)
      jest.advanceTimersByTime(200);
      await Promise.resolve(); // Let promises resolve
      expect(conversionFn).toHaveBeenCalledTimes(3);
      
      const result = await promise;
      expect(result).toBe(42);
      
      jest.useRealTimers();
    });
  });

  // Optimistic locking
  describe('withOptimisticLock', () => {
    it('should return the converted value on successful update', async () => {
      const conversionFn = jest.fn().mockResolvedValue(42);
      const versionFn = jest.fn().mockResolvedValue(1);
      const updateFn = jest.fn().mockResolvedValue(true);
      
      const result = await withOptimisticLock('test', conversionFn, versionFn, updateFn, 0);
      
      expect(result).toBe(42);
      expect(versionFn).toHaveBeenCalledTimes(1);
      expect(versionFn).toHaveBeenCalledWith('test');
      expect(conversionFn).toHaveBeenCalledTimes(1);
      expect(conversionFn).toHaveBeenCalledWith('test');
      expect(updateFn).toHaveBeenCalledTimes(1);
      expect(updateFn).toHaveBeenCalledWith(42, 1);
    });

    it('should retry on version mismatch', async () => {
      const conversionFn = jest.fn().mockResolvedValue(42);
      const versionFn = jest.fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2);
      const updateFn = jest.fn()
        .mockResolvedValueOnce(false) // Version mismatch
        .mockResolvedValueOnce(true);  // Success on retry
      
      const result = await withOptimisticLock('test', conversionFn, versionFn, updateFn, 0, 2);
      
      expect(result).toBe(42);
      expect(versionFn).toHaveBeenCalledTimes(2);
      expect(conversionFn).toHaveBeenCalledTimes(2);
      expect(updateFn).toHaveBeenCalledTimes(2);
      expect(updateFn).toHaveBeenNthCalledWith(1, 42, 1);
      expect(updateFn).toHaveBeenNthCalledWith(2, 42, 2);
    });

    it('should return the default value if all retries fail', async () => {
      const conversionFn = jest.fn().mockResolvedValue(42);
      const versionFn = jest.fn().mockResolvedValue(1);
      const updateFn = jest.fn().mockResolvedValue(false); // Always fail
      
      const result = await withOptimisticLock('test', conversionFn, versionFn, updateFn, 'default', 2);
      
      expect(result).toBe('default');
      expect(versionFn).toHaveBeenCalledTimes(2);
      expect(conversionFn).toHaveBeenCalledTimes(2);
      expect(updateFn).toHaveBeenCalledTimes(2);
    });

    it('should return the default value if any function throws', async () => {
      const conversionFn = jest.fn().mockRejectedValue(new Error('Conversion failed'));
      const versionFn = jest.fn().mockResolvedValue(1);
      const updateFn = jest.fn().mockResolvedValue(true);
      
      const result = await withOptimisticLock('test', conversionFn, versionFn, updateFn, 'default', 2);
      
      expect(result).toBe('default');
      expect(versionFn).toHaveBeenCalledTimes(1);
      expect(conversionFn).toHaveBeenCalledTimes(1);
      expect(updateFn).not.toHaveBeenCalled();
    });
  });

  // Circuit breaker pattern
  describe('withCircuitBreaker', () => {
    beforeEach(() => {
      // Reset circuit state between tests
      jest.resetModules();
      jest.doMock('../../../src/type/conversion', () => {
        const original = jest.requireActual('../../../src/type/conversion');
        return {
          ...original,
          // Reset the circuit state
          circuitState: {
            failures: 0,
            isOpen: false,
            lastFailureTime: 0
          }
        };
      });
    });

    it('should return the converted value on successful conversion', async () => {
      const conversionFn = jest.fn().mockResolvedValue(42);
      const result = await withCircuitBreaker('test', conversionFn, 0);
      
      expect(result).toBe(42);
      expect(conversionFn).toHaveBeenCalledTimes(1);
      expect(conversionFn).toHaveBeenCalledWith('test');
    });

    it('should open the circuit after reaching the failure threshold', async () => {
      const conversionFn = jest.fn().mockRejectedValue(new Error('Conversion failed'));
      const options = { failureThreshold: 2, resetTimeout: 30000 };
      
      // First call - failure count 1
      let result = await withCircuitBreaker('test', conversionFn, 'default', options);
      expect(result).toBe('default');
      expect(conversionFn).toHaveBeenCalledTimes(1);
      
      // Second call - failure count 2, circuit opens
      result = await withCircuitBreaker('test', conversionFn, 'default', options);
      expect(result).toBe('default');
      expect(conversionFn).toHaveBeenCalledTimes(2);
      
      // Third call - circuit is open, conversionFn not called
      conversionFn.mockClear();
      result = await withCircuitBreaker('test', conversionFn, 'default', options);
      expect(result).toBe('default');
      expect(conversionFn).not.toHaveBeenCalled();
    });

    it('should use the fallback function when circuit is open', async () => {
      const conversionFn = jest.fn().mockRejectedValue(new Error('Conversion failed'));
      const fallbackFn = jest.fn().mockResolvedValue('fallback');
      const options = { 
        failureThreshold: 2, 
        resetTimeout: 30000,
        fallbackFn
      };
      
      // First call - failure count 1
      await withCircuitBreaker('test', conversionFn, 'default', options);
      
      // Second call - failure count 2, circuit opens
      await withCircuitBreaker('test', conversionFn, 'default', options);
      
      // Third call - circuit is open, fallbackFn is called
      conversionFn.mockClear();
      const result = await withCircuitBreaker('test', conversionFn, 'default', options);
      
      expect(result).toBe('fallback');
      expect(conversionFn).not.toHaveBeenCalled();
      expect(fallbackFn).toHaveBeenCalledTimes(1);
      expect(fallbackFn).toHaveBeenCalledWith('test');
    });

    it('should reset the circuit after the timeout period', async () => {
      jest.useFakeTimers();
      
      const conversionFn = jest.fn().mockRejectedValue(new Error('Conversion failed'));
      const options = { failureThreshold: 2, resetTimeout: 1000 };
      
      // First call - failure count 1
      await withCircuitBreaker('test', conversionFn, 'default', options);
      
      // Second call - failure count 2, circuit opens
      await withCircuitBreaker('test', conversionFn, 'default', options);
      
      // Third call - circuit is open, conversionFn not called
      conversionFn.mockClear();
      await withCircuitBreaker('test', conversionFn, 'default', options);
      expect(conversionFn).not.toHaveBeenCalled();
      
      // Advance time past the reset timeout
      jest.advanceTimersByTime(1100);
      
      // Fourth call - circuit should be reset, conversionFn called again
      await withCircuitBreaker('test', conversionFn, 'default', options);
      expect(conversionFn).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });

    it('should reset failure count after successful call', async () => {
      const conversionFn = jest.fn()
        .mockRejectedValueOnce(new Error('Conversion failed'))
        .mockResolvedValueOnce(42)
        .mockRejectedValueOnce(new Error('Conversion failed again'));
      
      const options = { failureThreshold: 2, resetTimeout: 30000 };
      
      // First call - failure count 1
      await withCircuitBreaker('test', conversionFn, 'default', options);
      
      // Second call - success, failure count reset to 0
      const result = await withCircuitBreaker('test', conversionFn, 'default', options);
      expect(result).toBe(42);
      
      // Third call - failure count 1 again, circuit still closed
      conversionFn.mockClear();
      await withCircuitBreaker('test', conversionFn, 'default', options);
      expect(conversionFn).toHaveBeenCalledTimes(1); // Should be called because circuit is closed
    });
  });
});