import {
  toString,
  toNumber,
  toBoolean,
  toDate,
  toArray,
  toObject,
  toNullable,
  toOptional,
  toDefault,
  toEnum,
  convertTo,
  TypeConversionError,
} from '../../../src/utils/type-converters';

describe('Type Conversion Utilities', () => {
  describe('toString', () => {
    it('should convert basic values to strings', () => {
      expect(toString(123)).toBe('123');
      expect(toString(true)).toBe('true');
      expect(toString(false)).toBe('false');
      expect(toString('hello')).toBe('hello');
      expect(toString(0)).toBe('0');
    });

    it('should trim strings when trim option is true', () => {
      expect(toString('  hello  ', { trim: true })).toBe('hello');
      expect(toString('\n\t hello world \r\n', { trim: true })).toBe('hello world');
    });

    it('should validate string length', () => {
      expect(toString('hello', { minLength: 5 })).toBe('hello');
      expect(toString('hello', { maxLength: 5 })).toBe('hello');
      expect(toString('hello', { minLength: 1, maxLength: 10 })).toBe('hello');

      expect(() => toString('hello', { minLength: 6 }))
        .toThrow(TypeConversionError);
      expect(() => toString('hello', { maxLength: 4 }))
        .toThrow(TypeConversionError);
    });

    it('should throw error for null or undefined', () => {
      expect(() => toString(null))
        .toThrow(TypeConversionError);
      expect(() => toString(undefined))
        .toThrow(TypeConversionError);
    });

    it('should throw error for empty strings when emptyAsNull is true', () => {
      expect(() => toString('', { emptyAsNull: true }))
        .toThrow(TypeConversionError);
      expect(() => toString('  ', { trim: true, emptyAsNull: true }))
        .toThrow(TypeConversionError);
    });
  });

  describe('toNumber', () => {
    it('should convert basic values to numbers', () => {
      expect(toNumber(123)).toBe(123);
      expect(toNumber('456')).toBe(456);
      expect(toNumber(true)).toBe(1);
      expect(toNumber(false)).toBe(0);
      expect(toNumber('0')).toBe(0);
      expect(toNumber('-10.5')).toBe(-10.5);
    });

    it('should handle whitespace in string numbers', () => {
      expect(toNumber(' 123 ')).toBe(123);
      expect(toNumber('\n456\t')).toBe(456);
    });

    it('should validate integer constraint', () => {
      expect(toNumber(123, { integer: true })).toBe(123);
      expect(() => toNumber(123.45, { integer: true }))
        .toThrow(TypeConversionError);
      expect(() => toNumber('123.45', { integer: true }))
        .toThrow(TypeConversionError);
    });

    it('should validate range constraints', () => {
      expect(toNumber(50, { min: 0, max: 100 })).toBe(50);
      expect(() => toNumber(-10, { min: 0 }))
        .toThrow(TypeConversionError);
      expect(() => toNumber(200, { max: 100 }))
        .toThrow(TypeConversionError);
    });

    it('should validate sign constraints', () => {
      expect(toNumber(10, { positive: true })).toBe(10);
      expect(toNumber(-10, { negative: true })).toBe(-10);
      expect(() => toNumber(0, { positive: true }))
        .toThrow(TypeConversionError);
      expect(() => toNumber(0, { negative: true }))
        .toThrow(TypeConversionError);
      expect(() => toNumber(-10, { positive: true }))
        .toThrow(TypeConversionError);
      expect(() => toNumber(10, { negative: true }))
        .toThrow(TypeConversionError);
    });

    it('should handle precision correctly', () => {
      expect(toNumber('123.456')).toBeCloseTo(123.456, 3);
      expect(toNumber('0.1')).toBeCloseTo(0.1, 1);
      expect(toNumber('0.12345678901234567890')).toBeCloseTo(0.12345678901234567890, 15);
    });

    it('should throw error for invalid number formats', () => {
      expect(() => toNumber('abc'))
        .toThrow(TypeConversionError);
      expect(() => toNumber('123abc'))
        .toThrow(TypeConversionError);
      expect(() => toNumber(''))
        .toThrow(TypeConversionError);
      expect(() => toNumber('  '))
        .toThrow(TypeConversionError);
    });

    it('should throw error for null or undefined', () => {
      expect(() => toNumber(null))
        .toThrow(TypeConversionError);
      expect(() => toNumber(undefined))
        .toThrow(TypeConversionError);
    });

    it('should throw error for non-convertible types', () => {
      expect(() => toNumber({}))
        .toThrow(TypeConversionError);
      expect(() => toNumber([]))
        .toThrow(TypeConversionError);
    });
  });

  describe('toBoolean', () => {
    it('should convert standard boolean values', () => {
      expect(toBoolean(true)).toBe(true);
      expect(toBoolean(false)).toBe(false);
    });

    it('should convert string representations to booleans', () => {
      expect(toBoolean('true')).toBe(true);
      expect(toBoolean('false')).toBe(false);
      expect(toBoolean('yes')).toBe(true);
      expect(toBoolean('no')).toBe(false);
      expect(toBoolean('y')).toBe(true);
      expect(toBoolean('n')).toBe(false);
    });

    it('should convert numeric representations to booleans', () => {
      expect(toBoolean(1)).toBe(true);
      expect(toBoolean(0)).toBe(false);
      expect(toBoolean('1')).toBe(true);
      expect(toBoolean('0')).toBe(false);
    });

    it('should support custom truthy/falsy values', () => {
      expect(toBoolean('on', { truthyValues: ['on'] })).toBe(true);
      expect(toBoolean('off', { falsyValues: ['off'] })).toBe(false);
      expect(toBoolean('enabled', { truthyValues: ['enabled', 'active'] })).toBe(true);
      expect(toBoolean('disabled', { falsyValues: ['disabled', 'inactive'] })).toBe(false);
    });

    it('should throw error for invalid boolean values', () => {
      expect(() => toBoolean('maybe'))
        .toThrow(TypeConversionError);
      expect(() => toBoolean(2))
        .toThrow(TypeConversionError);
      expect(() => toBoolean('truthy'))
        .toThrow(TypeConversionError);
    });

    it('should throw error for null or undefined', () => {
      expect(() => toBoolean(null))
        .toThrow(TypeConversionError);
      expect(() => toBoolean(undefined))
        .toThrow(TypeConversionError);
    });
  });

  describe('toDate', () => {
    it('should convert Date objects', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const result = toDate(date);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(date.getTime());
      // Ensure it's a new instance, not the same reference
      expect(result).not.toBe(date);
    });

    it('should convert ISO 8601 date strings', () => {
      const isoString = '2023-01-01T12:00:00Z';
      const expected = new Date(isoString);
      const result = toDate(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should convert timestamps', () => {
      const timestamp = 1672574400000; // 2023-01-01T12:00:00Z
      const expected = new Date(timestamp);
      const result = toDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should validate date range constraints', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const minDate = new Date('2022-01-01T00:00:00Z');
      const maxDate = new Date('2024-01-01T00:00:00Z');

      expect(toDate(date, { min: minDate, max: maxDate })).toBeInstanceOf(Date);
      expect(() => toDate(date, { min: new Date('2023-02-01T00:00:00Z') }))
        .toThrow(TypeConversionError);
      expect(() => toDate(date, { max: new Date('2022-12-01T00:00:00Z') }))
        .toThrow(TypeConversionError);
    });

    it('should validate future/past constraints', () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow

      expect(toDate(pastDate, { past: true })).toBeInstanceOf(Date);
      expect(toDate(futureDate, { future: true })).toBeInstanceOf(Date);
      expect(() => toDate(pastDate, { future: true }))
        .toThrow(TypeConversionError);
      expect(() => toDate(futureDate, { past: true }))
        .toThrow(TypeConversionError);
    });

    it('should throw error for invalid date formats', () => {
      expect(() => toDate('not a date'))
        .toThrow(TypeConversionError);
      expect(() => toDate('2023/13/45'))
        .toThrow(TypeConversionError);
      expect(() => toDate('January 32, 2023'))
        .toThrow(TypeConversionError);
    });

    it('should throw error for null or undefined', () => {
      expect(() => toDate(null))
        .toThrow(TypeConversionError);
      expect(() => toDate(undefined))
        .toThrow(TypeConversionError);
    });

    it('should throw error for non-convertible types', () => {
      expect(() => toDate({}))
        .toThrow(TypeConversionError);
      expect(() => toDate([]))
        .toThrow(TypeConversionError);
    });
  });

  describe('toArray', () => {
    it('should convert arrays', () => {
      const array = [1, 2, 3];
      const result = toArray(array, item => item);
      expect(result).toEqual(array);
    });

    it('should convert JSON string arrays', () => {
      const jsonString = '[1, 2, 3]';
      const result = toArray(jsonString, item => item);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should convert single values to arrays', () => {
      const value = 42;
      const result = toArray(value, item => item);
      expect(result).toEqual([42]);
    });

    it('should apply item converter to each element', () => {
      const array = ['1', '2', '3'];
      const result = toArray(array, item => toNumber(item));
      expect(result).toEqual([1, 2, 3]);
    });

    it('should throw error for invalid JSON strings', () => {
      expect(() => toArray('{"key": "value"}', item => item))
        .toThrow(TypeConversionError);
      expect(() => toArray('not an array', item => item))
        .toThrow(TypeConversionError);
    });

    it('should throw error when item conversion fails', () => {
      expect(() => toArray(['1', 'two', '3'], item => toNumber(item)))
        .toThrow(TypeConversionError);
    });

    it('should throw error for null or undefined', () => {
      expect(() => toArray(null, item => item))
        .toThrow(TypeConversionError);
      expect(() => toArray(undefined, item => item))
        .toThrow(TypeConversionError);
    });
  });

  describe('toObject', () => {
    it('should convert objects', () => {
      const obj = { key: 'value', num: 42 };
      const result = toObject(obj);
      expect(result).toEqual(obj);
    });

    it('should convert JSON string objects', () => {
      const jsonString = '{"key": "value", "num": 42}';
      const result = toObject(jsonString);
      expect(result).toEqual({ key: 'value', num: 42 });
    });

    it('should throw error for arrays', () => {
      expect(() => toObject([1, 2, 3]))
        .toThrow(TypeConversionError);
    });

    it('should throw error for invalid JSON strings', () => {
      expect(() => toObject('[1, 2, 3]'))
        .toThrow(TypeConversionError);
      expect(() => toObject('not an object'))
        .toThrow(TypeConversionError);
    });

    it('should throw error for primitive types', () => {
      expect(() => toObject(42))
        .toThrow(TypeConversionError);
      expect(() => toObject('string'))
        .toThrow(TypeConversionError);
      expect(() => toObject(true))
        .toThrow(TypeConversionError);
    });

    it('should throw error for null or undefined', () => {
      expect(() => toObject(null))
        .toThrow(TypeConversionError);
      expect(() => toObject(undefined))
        .toThrow(TypeConversionError);
    });
  });

  describe('toNullable', () => {
    it('should return null for null or undefined', () => {
      expect(toNullable(null, value => toString(value))).toBeNull();
      expect(toNullable(undefined, value => toString(value))).toBeNull();
    });

    it('should apply converter for non-null values', () => {
      expect(toNullable('hello', value => toString(value))).toBe('hello');
      expect(toNullable(42, value => toNumber(value))).toBe(42);
      expect(toNullable('true', value => toBoolean(value))).toBe(true);
    });
  });

  describe('toOptional', () => {
    it('should return undefined for undefined', () => {
      expect(toOptional(undefined, value => toString(value))).toBeUndefined();
    });

    it('should apply converter for defined values', () => {
      expect(toOptional('hello', value => toString(value))).toBe('hello');
      expect(toOptional(null, value => toString(value))).toBe(null);
      expect(toOptional(42, value => toNumber(value))).toBe(42);
    });
  });

  describe('toDefault', () => {
    it('should return default value for null or undefined', () => {
      expect(toDefault(null, value => toString(value), 'default')).toBe('default');
      expect(toDefault(undefined, value => toString(value), 'default')).toBe('default');
    });

    it('should return default value when conversion fails', () => {
      expect(toDefault('not a number', value => toNumber(value), 0)).toBe(0);
    });

    it('should apply converter for valid values', () => {
      expect(toDefault('hello', value => toString(value), 'default')).toBe('hello');
      expect(toDefault(42, value => toNumber(value), 0)).toBe(42);
      expect(toDefault('true', value => toBoolean(value), false)).toBe(true);
    });
  });

  describe('toEnum', () => {
    enum TestEnum {
      A = 'a',
      B = 'b',
      C = 'c',
    }

    enum NumericEnum {
      One = 1,
      Two = 2,
      Three = 3,
    }

    it('should convert exact enum values', () => {
      expect(toEnum('a', TestEnum)).toBe(TestEnum.A);
      expect(toEnum('b', TestEnum)).toBe(TestEnum.B);
      expect(toEnum('c', TestEnum)).toBe(TestEnum.C);
      expect(toEnum(1, NumericEnum)).toBe(NumericEnum.One);
      expect(toEnum(2, NumericEnum)).toBe(NumericEnum.Two);
      expect(toEnum(3, NumericEnum)).toBe(NumericEnum.Three);
    });

    it('should convert case-insensitive string enum values', () => {
      expect(toEnum('A', TestEnum)).toBe(TestEnum.A);
      expect(toEnum('B', TestEnum)).toBe(TestEnum.B);
      expect(toEnum('C', TestEnum)).toBe(TestEnum.C);
    });

    it('should convert string numeric values to numeric enums', () => {
      expect(toEnum('1', NumericEnum)).toBe(NumericEnum.One);
      expect(toEnum('2', NumericEnum)).toBe(NumericEnum.Two);
      expect(toEnum('3', NumericEnum)).toBe(NumericEnum.Three);
    });

    it('should throw error for invalid enum values', () => {
      expect(() => toEnum('d', TestEnum))
        .toThrow(TypeConversionError);
      expect(() => toEnum(4, NumericEnum))
        .toThrow(TypeConversionError);
      expect(() => toEnum('not an enum', TestEnum))
        .toThrow(TypeConversionError);
    });

    it('should throw error for null or undefined', () => {
      expect(() => toEnum(null, TestEnum))
        .toThrow(TypeConversionError);
      expect(() => toEnum(undefined, TestEnum))
        .toThrow(TypeConversionError);
    });
  });

  describe('convertTo', () => {
    it('should convert to string', () => {
      expect(convertTo(42, 'string')).toBe('42');
    });

    it('should convert to number', () => {
      expect(convertTo('42', 'number')).toBe(42);
    });

    it('should convert to boolean', () => {
      expect(convertTo('true', 'boolean')).toBe(true);
    });

    it('should convert to date', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const result = convertTo(date.toISOString(), 'date');
      expect(result).toBeInstanceOf(Date);
      expect((result as Date).getTime()).toBe(date.getTime());
    });

    it('should convert to object', () => {
      expect(convertTo('{"key": "value"}', 'object')).toEqual({ key: 'value' });
    });

    it('should convert to array', () => {
      expect(convertTo('[1, 2, 3]', 'array')).toEqual([1, 2, 3]);
    });

    it('should pass options to the appropriate converter', () => {
      expect(convertTo(' hello ', 'string', { trim: true })).toBe('hello');
      expect(convertTo('42', 'number', { min: 0, max: 100 })).toBe(42);
      expect(() => convertTo('42', 'number', { min: 50 }))
        .toThrow(TypeConversionError);
    });

    it('should throw error for unsupported target types', () => {
      expect(() => convertTo('value', 'unsupported' as any))
        .toThrow(TypeConversionError);
    });
  });

  describe('Complex nested object conversion', () => {
    it('should handle complex nested objects with mixed types', () => {
      const jsonString = `{
        "id": "123",
        "name": "Test Event",
        "timestamp": "2023-01-01T12:00:00Z",
        "active": true,
        "count": 42,
        "tags": ["tag1", "tag2"],
        "metadata": {
          "source": "test",
          "priority": 1
        }
      }`;

      const result = toObject(jsonString);
      expect(result).toEqual({
        id: '123',
        name: 'Test Event',
        timestamp: '2023-01-01T12:00:00Z',
        active: true,
        count: 42,
        tags: ['tag1', 'tag2'],
        metadata: {
          source: 'test',
          priority: 1
        }
      });

      // Convert specific fields to appropriate types
      const convertedResult = {
        id: toString(result.id),
        name: toString(result.name),
        timestamp: toDate(result.timestamp),
        active: toBoolean(result.active),
        count: toNumber(result.count),
        tags: toArray(result.tags, item => toString(item)),
        metadata: toObject(result.metadata)
      };

      expect(convertedResult.id).toBe('123');
      expect(convertedResult.name).toBe('Test Event');
      expect(convertedResult.timestamp).toBeInstanceOf(Date);
      expect(convertedResult.active).toBe(true);
      expect(convertedResult.count).toBe(42);
      expect(convertedResult.tags).toEqual(['tag1', 'tag2']);
      expect(convertedResult.metadata).toEqual({
        source: 'test',
        priority: 1
      });
    });
  });

  describe('Error handling and edge cases', () => {
    it('should include the original value in error messages', () => {
      try {
        toNumber('not a number');
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TypeConversionError);
        expect((error as TypeConversionError).value).toBe('not a number');
        expect((error as TypeConversionError).targetType).toBe('number');
        expect((error as TypeConversionError).message).toContain('not a number');
      }
    });

    it('should handle empty arrays', () => {
      const result = toArray([], item => item);
      expect(result).toEqual([]);
    });

    it('should handle empty objects', () => {
      const result = toObject({});
      expect(result).toEqual({});
    });

    it('should handle special numeric values', () => {
      expect(() => toNumber(NaN))
        .not.toThrow();
      expect(toNumber(NaN)).toBeNaN();

      expect(() => toNumber(Infinity))
        .not.toThrow();
      expect(toNumber(Infinity)).toBe(Infinity);

      expect(() => toNumber(-Infinity))
        .not.toThrow();
      expect(toNumber(-Infinity)).toBe(-Infinity);
    });
  });
});