import {
  toString,
  toNumber,
  toInteger,
  toBoolean,
  toDate,
  toArray,
  toObject,
  convertTo,
  toNullable,
  toDefault,
  isNil,
  isString,
  isNumber,
  isBoolean,
  isDate,
  isObject,
} from '../../../src/utils/type-converters';
import { ValidationError } from '../../../src/errors/validation.error';

describe('Type Conversion Utilities', () => {
  describe('toString', () => {
    it('should convert string values correctly', () => {
      expect(toString('test')).toBe('test');
      expect(toString('')).toBe('');
      expect(toString('  ')).toBe('  ');
    });

    it('should convert number values to strings', () => {
      expect(toString(123)).toBe('123');
      expect(toString(0)).toBe('0');
      expect(toString(-45.67)).toBe('-45.67');
      expect(toString(1e6)).toBe('1000000');
    });

    it('should convert boolean values to strings', () => {
      expect(toString(true)).toBe('true');
      expect(toString(false)).toBe('false');
    });

    it('should convert Date objects to ISO strings', () => {
      const date = new Date('2023-05-15T10:30:00Z');
      expect(toString(date)).toBe('2023-05-15T10:30:00.000Z');
    });

    it('should convert objects to JSON strings', () => {
      const obj = { name: 'Test', value: 123 };
      expect(toString(obj)).toBe('{"name":"Test","value":123}');
    });

    it('should convert arrays to JSON strings', () => {
      const arr = [1, 2, 'three'];
      expect(toString(arr)).toBe('[1,2,"three"]');
    });

    it('should throw ValidationError for null/undefined with default options', () => {
      expect(() => toString(null)).toThrow(ValidationError);
      expect(() => toString(undefined)).toThrow(ValidationError);
    });

    it('should allow null/undefined with allowNil option', () => {
      expect(toString(null, { allowNil: true })).toBeNull();
      expect(toString(undefined, { allowNil: true })).toBeUndefined();
    });

    it('should return defaultValue when conversion fails and throwOnError is false', () => {
      expect(toString(null, { throwOnError: false, defaultValue: 'default' })).toBe('default');
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      try {
        toString(null, { errorMessage: customMessage });
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe(customMessage);
      }
    });
  });

  describe('toNumber', () => {
    it('should convert number values correctly', () => {
      expect(toNumber(123)).toBe(123);
      expect(toNumber(0)).toBe(0);
      expect(toNumber(-45.67)).toBe(-45.67);
      expect(toNumber(1e6)).toBe(1000000);
    });

    it('should convert string numbers correctly', () => {
      expect(toNumber('123')).toBe(123);
      expect(toNumber('0')).toBe(0);
      expect(toNumber('-45.67')).toBe(-45.67);
      expect(toNumber('1e6')).toBe(1000000);
    });

    it('should convert Brazilian currency strings correctly', () => {
      expect(toNumber('R$ 1.234,56')).toBe(1234.56);
      expect(toNumber('R$ 0,99')).toBe(0.99);
      expect(toNumber('R$-10,50')).toBe(-10.5);
    });

    it('should convert boolean values to numbers', () => {
      expect(toNumber(true)).toBe(1);
      expect(toNumber(false)).toBe(0);
    });

    it('should convert Date objects to timestamps', () => {
      const date = new Date('2023-05-15T10:30:00Z');
      expect(toNumber(date)).toBe(date.getTime());
    });

    it('should throw ValidationError for invalid string numbers', () => {
      expect(() => toNumber('not a number')).toThrow(ValidationError);
      expect(() => toNumber('123abc')).toThrow(ValidationError);
    });

    it('should throw ValidationError for null/undefined with default options', () => {
      expect(() => toNumber(null)).toThrow(ValidationError);
      expect(() => toNumber(undefined)).toThrow(ValidationError);
    });

    it('should allow null/undefined with allowNil option', () => {
      expect(toNumber(null, { allowNil: true })).toBeNull();
      expect(toNumber(undefined, { allowNil: true })).toBeUndefined();
    });

    it('should return defaultValue when conversion fails and throwOnError is false', () => {
      expect(toNumber('not a number', { throwOnError: false, defaultValue: 999 })).toBe(999);
      expect(toNumber(null, { throwOnError: false, defaultValue: 999 })).toBe(999);
    });

    it('should handle complex objects appropriately', () => {
      expect(() => toNumber({})).toThrow(ValidationError);
      expect(() => toNumber([1, 2, 3])).toThrow(ValidationError);
    });
  });

  describe('toInteger', () => {
    it('should convert numbers to integers by flooring', () => {
      expect(toInteger(123.45)).toBe(123);
      expect(toInteger(0.99)).toBe(0);
      expect(toInteger(-45.67)).toBe(-46); // Note: Math.floor(-45.67) = -46
    });

    it('should convert string numbers to integers', () => {
      expect(toInteger('123.45')).toBe(123);
      expect(toInteger('0.99')).toBe(0);
      expect(toInteger('-45.67')).toBe(-46);
    });

    it('should handle already integer values', () => {
      expect(toInteger(123)).toBe(123);
      expect(toInteger(-45)).toBe(-45);
      expect(toInteger(0)).toBe(0);
    });

    it('should throw ValidationError for invalid inputs', () => {
      expect(() => toInteger('not a number')).toThrow(ValidationError);
      expect(() => toInteger(null)).toThrow(ValidationError);
    });

    it('should return defaultValue when conversion fails and throwOnError is false', () => {
      expect(toInteger('not a number', { throwOnError: false, defaultValue: 999 })).toBe(999);
    });
  });

  describe('toBoolean', () => {
    it('should handle boolean values correctly', () => {
      expect(toBoolean(true)).toBe(true);
      expect(toBoolean(false)).toBe(false);
    });

    it('should convert truthy string values to true', () => {
      expect(toBoolean('true')).toBe(true);
      expect(toBoolean('yes')).toBe(true);
      expect(toBoolean('y')).toBe(true);
      expect(toBoolean('1')).toBe(true);
      expect(toBoolean('sim')).toBe(true);
      expect(toBoolean('s')).toBe(true);
      expect(toBoolean('TRUE')).toBe(true);
      expect(toBoolean('Yes')).toBe(true);
      expect(toBoolean('Y')).toBe(true);
      expect(toBoolean('SIM')).toBe(true);
      expect(toBoolean(' true ')).toBe(true); // Test with whitespace
    });

    it('should convert falsy string values to false', () => {
      expect(toBoolean('false')).toBe(false);
      expect(toBoolean('no')).toBe(false);
      expect(toBoolean('n')).toBe(false);
      expect(toBoolean('0')).toBe(false);
      expect(toBoolean('não')).toBe(false);
      expect(toBoolean('nao')).toBe(false);
      expect(toBoolean('FALSE')).toBe(false);
      expect(toBoolean('No')).toBe(false);
      expect(toBoolean('N')).toBe(false);
      expect(toBoolean('NÃO')).toBe(false);
      expect(toBoolean(' false ')).toBe(false); // Test with whitespace
    });

    it('should convert 0 and 1 to boolean values', () => {
      expect(toBoolean(0)).toBe(false);
      expect(toBoolean(1)).toBe(true);
    });

    it('should throw ValidationError for other number values', () => {
      expect(() => toBoolean(2)).toThrow(ValidationError);
      expect(() => toBoolean(-1)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid string values', () => {
      expect(() => toBoolean('maybe')).toThrow(ValidationError);
      expect(() => toBoolean('2')).toThrow(ValidationError);
    });

    it('should throw ValidationError for null/undefined with default options', () => {
      expect(() => toBoolean(null)).toThrow(ValidationError);
      expect(() => toBoolean(undefined)).toThrow(ValidationError);
    });

    it('should allow null/undefined with allowNil option', () => {
      expect(toBoolean(null, { allowNil: true })).toBeNull();
      expect(toBoolean(undefined, { allowNil: true })).toBeUndefined();
    });

    it('should return defaultValue when conversion fails and throwOnError is false', () => {
      expect(toBoolean('maybe', { throwOnError: false, defaultValue: true })).toBe(true);
      expect(toBoolean(null, { throwOnError: false, defaultValue: false })).toBe(false);
    });
  });

  describe('toDate', () => {
    it('should handle Date objects correctly', () => {
      const date = new Date('2023-05-15T10:30:00Z');
      expect(toDate(date)).toBe(date);
    });

    it('should convert ISO date strings to Date objects', () => {
      const isoString = '2023-05-15T10:30:00Z';
      const date = toDate(isoString);
      expect(date).toBeInstanceOf(Date);
      expect(date?.toISOString()).toBe(isoString);
    });

    it('should convert Brazilian date format (DD/MM/YYYY) to Date objects', () => {
      const brDate = '15/05/2023';
      const date = toDate(brDate);
      expect(date).toBeInstanceOf(Date);
      expect(date?.getDate()).toBe(15);
      expect(date?.getMonth()).toBe(4); // May is month 4 (zero-based)
      expect(date?.getFullYear()).toBe(2023);
    });

    it('should convert timestamps (numbers) to Date objects', () => {
      const timestamp = 1684146600000; // 2023-05-15T10:30:00Z
      const date = toDate(timestamp);
      expect(date).toBeInstanceOf(Date);
      expect(date?.getTime()).toBe(timestamp);
    });

    it('should throw ValidationError for invalid date strings', () => {
      expect(() => toDate('not a date')).toThrow(ValidationError);
      expect(() => toDate('32/05/2023')).toThrow(ValidationError); // Invalid day
      expect(() => toDate('15/13/2023')).toThrow(ValidationError); // Invalid month
    });

    it('should throw ValidationError for null/undefined with default options', () => {
      expect(() => toDate(null)).toThrow(ValidationError);
      expect(() => toDate(undefined)).toThrow(ValidationError);
    });

    it('should allow null/undefined with allowNil option', () => {
      expect(toDate(null, { allowNil: true })).toBeNull();
      expect(toDate(undefined, { allowNil: true })).toBeUndefined();
    });

    it('should return defaultValue when conversion fails and throwOnError is false', () => {
      const defaultDate = new Date('2000-01-01T00:00:00Z');
      expect(toDate('not a date', { throwOnError: false, defaultValue: defaultDate })).toBe(defaultDate);
      expect(toDate(null, { throwOnError: false, defaultValue: defaultDate })).toBe(defaultDate);
    });
  });

  describe('toArray', () => {
    it('should handle arrays correctly', () => {
      const arr = [1, 2, 3];
      expect(toArray(arr)).toBe(arr);
    });

    it('should convert non-array values to single-item arrays', () => {
      expect(toArray('test')).toEqual(['test']);
      expect(toArray(123)).toEqual([123]);
      expect(toArray(true)).toEqual([true]);
    });

    it('should convert JSON array strings to arrays', () => {
      expect(toArray('[1,2,3]')).toEqual([1, 2, 3]);
      expect(toArray('["a","b","c"]')).toEqual(['a', 'b', 'c']);
      expect(toArray('[]')).toEqual([]);
    });

    it('should apply item converter function when provided', () => {
      const arr = ['1', '2', '3'];
      const result = toArray(arr, (item) => parseInt(item, 10));
      expect(result).toEqual([1, 2, 3]);
    });

    it('should apply item converter to JSON array strings', () => {
      const result = toArray('["1","2","3"]', (item) => parseInt(item, 10));
      expect(result).toEqual([1, 2, 3]);
    });

    it('should apply item converter to single values', () => {
      const result = toArray('123', (item) => parseInt(item, 10));
      expect(result).toEqual([123]);
    });

    it('should throw ValidationError for null/undefined with default options', () => {
      expect(() => toArray(null)).toThrow(ValidationError);
      expect(() => toArray(undefined)).toThrow(ValidationError);
    });

    it('should allow null/undefined with allowNil option', () => {
      expect(toArray(null, undefined, { allowNil: true })).toBeNull();
      expect(toArray(undefined, undefined, { allowNil: true })).toBeUndefined();
    });

    it('should return defaultValue when conversion fails and throwOnError is false', () => {
      const defaultArray = [4, 5, 6];
      expect(toArray(null, undefined, { throwOnError: false, defaultValue: defaultArray })).toBe(defaultArray);
    });
  });

  describe('toObject', () => {
    it('should handle objects correctly', () => {
      const obj = { name: 'Test', value: 123 };
      expect(toObject(obj)).toBe(obj);
    });

    it('should convert JSON object strings to objects', () => {
      const jsonString = '{"name":"Test","value":123}';
      expect(toObject(jsonString)).toEqual({ name: 'Test', value: 123 });
    });

    it('should throw ValidationError for non-object values', () => {
      expect(() => toObject('not an object')).toThrow(ValidationError);
      expect(() => toObject(123)).toThrow(ValidationError);
      expect(() => toObject(true)).toThrow(ValidationError);
      expect(() => toObject([1, 2, 3])).toThrow(ValidationError); // Arrays are not considered objects
    });

    it('should throw ValidationError for invalid JSON strings', () => {
      expect(() => toObject('{invalid json}')).toThrow(ValidationError);
      expect(() => toObject('[1,2,3]')).toThrow(ValidationError); // Array JSON is not an object
    });

    it('should throw ValidationError for null/undefined with default options', () => {
      expect(() => toObject(null)).toThrow(ValidationError);
      expect(() => toObject(undefined)).toThrow(ValidationError);
    });

    it('should allow null/undefined with allowNil option', () => {
      expect(toObject(null, { allowNil: true })).toBeNull();
      expect(toObject(undefined, { allowNil: true })).toBeUndefined();
    });

    it('should return defaultValue when conversion fails and throwOnError is false', () => {
      const defaultObj = { default: true };
      expect(toObject('not an object', { throwOnError: false, defaultValue: defaultObj })).toBe(defaultObj);
      expect(toObject(null, { throwOnError: false, defaultValue: defaultObj })).toBe(defaultObj);
    });
  });

  describe('convertTo', () => {
    it('should convert to string using toString', () => {
      expect(convertTo(123, 'string')).toBe('123');
    });

    it('should convert to number using toNumber', () => {
      expect(convertTo('123', 'number')).toBe(123);
    });

    it('should convert to boolean using toBoolean', () => {
      expect(convertTo('true', 'boolean')).toBe(true);
    });

    it('should convert to date using toDate', () => {
      const date = convertTo('2023-05-15T10:30:00Z', 'date');
      expect(date).toBeInstanceOf(Date);
      expect((date as Date).toISOString()).toBe('2023-05-15T10:30:00.000Z');
    });

    it('should convert to object using toObject', () => {
      expect(convertTo('{"name":"Test"}', 'object')).toEqual({ name: 'Test' });
    });

    it('should convert to array using toArray', () => {
      expect(convertTo('[1,2,3]', 'array')).toEqual([1, 2, 3]);
    });

    it('should throw ValidationError for unsupported target types', () => {
      expect(() => convertTo('test', 'unsupported' as any)).toThrow(ValidationError);
    });

    it('should return defaultValue for unsupported target types when throwOnError is false', () => {
      const defaultValue = 'default';
      expect(convertTo('test', 'unsupported' as any, { throwOnError: false, defaultValue })).toBe(defaultValue);
    });
  });

  describe('toNullable', () => {
    it('should allow null values', () => {
      expect(toNullable(null, toString)).toBeNull();
    });

    it('should allow undefined values', () => {
      expect(toNullable(undefined, toString)).toBeUndefined();
    });

    it('should convert non-null values using the provided converter', () => {
      expect(toNullable(123, toString)).toBe('123');
      expect(toNullable('true', toBoolean)).toBe(true);
    });

    it('should respect other options passed to the converter', () => {
      const defaultValue = 'default';
      expect(toNullable('not a number', toNumber, { throwOnError: false, defaultValue })).toBe(defaultValue);
    });
  });

  describe('toDefault', () => {
    it('should use the provided default value when conversion fails', () => {
      expect(toDefault('not a number', toNumber, 999)).toBe(999);
      expect(toDefault(null, toString, 'default')).toBe('default');
    });

    it('should return the converted value when conversion succeeds', () => {
      expect(toDefault('123', toNumber, 999)).toBe(123);
      expect(toDefault(true, toString, 'default')).toBe('true');
    });

    it('should respect other options passed to the converter', () => {
      const customMessage = 'Custom error message';
      const spy = jest.fn();
      
      try {
        // This should not throw because throwOnError is set to false by toDefault
        toDefault('not a number', toNumber, 999, { errorMessage: customMessage });
      } catch (error) {
        spy();
      }
      
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('Type guard functions', () => {
    describe('isNil', () => {
      it('should return true for null and undefined', () => {
        expect(isNil(null)).toBe(true);
        expect(isNil(undefined)).toBe(true);
      });

      it('should return false for non-nil values', () => {
        expect(isNil('')).toBe(false);
        expect(isNil(0)).toBe(false);
        expect(isNil(false)).toBe(false);
        expect(isNil({})).toBe(false);
      });
    });

    describe('isString', () => {
      it('should return true for string values', () => {
        expect(isString('')).toBe(true);
        expect(isString('test')).toBe(true);
      });

      it('should return false for non-string values', () => {
        expect(isString(123)).toBe(false);
        expect(isString(true)).toBe(false);
        expect(isString(null)).toBe(false);
        expect(isString(undefined)).toBe(false);
        expect(isString({})).toBe(false);
      });
    });

    describe('isNumber', () => {
      it('should return true for number values', () => {
        expect(isNumber(0)).toBe(true);
        expect(isNumber(123)).toBe(true);
        expect(isNumber(-45.67)).toBe(true);
      });

      it('should return false for NaN', () => {
        expect(isNumber(NaN)).toBe(false);
      });

      it('should return false for non-number values', () => {
        expect(isNumber('123')).toBe(false);
        expect(isNumber(true)).toBe(false);
        expect(isNumber(null)).toBe(false);
        expect(isNumber(undefined)).toBe(false);
        expect(isNumber({})).toBe(false);
      });
    });

    describe('isBoolean', () => {
      it('should return true for boolean values', () => {
        expect(isBoolean(true)).toBe(true);
        expect(isBoolean(false)).toBe(true);
      });

      it('should return false for non-boolean values', () => {
        expect(isBoolean(0)).toBe(false);
        expect(isBoolean(1)).toBe(false);
        expect(isBoolean('true')).toBe(false);
        expect(isBoolean(null)).toBe(false);
        expect(isBoolean(undefined)).toBe(false);
        expect(isBoolean({})).toBe(false);
      });
    });

    describe('isDate', () => {
      it('should return true for valid Date objects', () => {
        expect(isDate(new Date())).toBe(true);
        expect(isDate(new Date('2023-05-15'))).toBe(true);
      });

      it('should return false for invalid Date objects', () => {
        expect(isDate(new Date('invalid'))).toBe(false);
      });

      it('should return false for non-Date values', () => {
        expect(isDate('2023-05-15')).toBe(false);
        expect(isDate(1684146600000)).toBe(false);
        expect(isDate(null)).toBe(false);
        expect(isDate(undefined)).toBe(false);
        expect(isDate({})).toBe(false);
      });
    });

    describe('isObject', () => {
      it('should return true for object values', () => {
        expect(isObject({})).toBe(true);
        expect(isObject({ name: 'Test' })).toBe(true);
        expect(isObject(new Date())).toBe(true);
        expect(isObject([])).toBe(true);
      });

      it('should return false for null', () => {
        expect(isObject(null)).toBe(false);
      });

      it('should return false for non-object values', () => {
        expect(isObject('test')).toBe(false);
        expect(isObject(123)).toBe(false);
        expect(isObject(true)).toBe(false);
        expect(isObject(undefined)).toBe(false);
      });
    });
  });

  describe('Complex nested object serialization and deserialization', () => {
    it('should correctly serialize and deserialize complex nested objects', () => {
      const complexObject = {
        id: 123,
        name: 'Test Object',
        active: true,
        createdAt: new Date('2023-05-15T10:30:00Z'),
        metadata: {
          tags: ['tag1', 'tag2'],
          properties: {
            color: 'blue',
            size: 'medium',
            features: [true, false, true]
          }
        },
        items: [
          { id: 1, value: 'Item 1' },
          { id: 2, value: 'Item 2' }
        ]
      };

      // Serialize to string
      const serialized = toString(complexObject);
      expect(typeof serialized).toBe('string');

      // Deserialize back to object
      const deserialized = toObject(serialized);
      
      // Verify structure is preserved
      expect(deserialized).toHaveProperty('id', 123);
      expect(deserialized).toHaveProperty('name', 'Test Object');
      expect(deserialized).toHaveProperty('active', true);
      expect(deserialized).toHaveProperty('createdAt');
      expect(deserialized).toHaveProperty('metadata.tags');
      expect(deserialized).toHaveProperty('metadata.properties.color', 'blue');
      expect(deserialized).toHaveProperty('metadata.properties.features');
      expect(deserialized).toHaveProperty('items');
      
      // Note: Date objects become strings during JSON serialization
      expect(deserialized.createdAt).toBe('2023-05-15T10:30:00.000Z');
      
      // Convert back to Date
      const reconvertedDate = toDate(deserialized.createdAt);
      expect(reconvertedDate).toBeInstanceOf(Date);
      expect(reconvertedDate?.toISOString()).toBe('2023-05-15T10:30:00.000Z');
    });

    it('should handle arrays of complex objects', () => {
      const complexArray = [
        {
          id: 1,
          name: 'Item 1',
          timestamp: new Date('2023-05-15T10:30:00Z'),
          values: [10, 20, 30]
        },
        {
          id: 2,
          name: 'Item 2',
          timestamp: new Date('2023-05-16T10:30:00Z'),
          values: [40, 50, 60]
        }
      ];

      // Serialize to string
      const serialized = toString(complexArray);
      expect(typeof serialized).toBe('string');

      // Deserialize back to array
      const deserialized = toArray(serialized);
      expect(Array.isArray(deserialized)).toBe(true);
      expect(deserialized?.length).toBe(2);
      
      // Verify structure is preserved
      expect(deserialized?.[0]).toHaveProperty('id', 1);
      expect(deserialized?.[0]).toHaveProperty('name', 'Item 1');
      expect(deserialized?.[0]).toHaveProperty('timestamp', '2023-05-15T10:30:00.000Z');
      expect(deserialized?.[0]).toHaveProperty('values');
      expect(deserialized?.[0].values).toEqual([10, 20, 30]);
      
      expect(deserialized?.[1]).toHaveProperty('id', 2);
      expect(deserialized?.[1]).toHaveProperty('name', 'Item 2');
      expect(deserialized?.[1]).toHaveProperty('timestamp', '2023-05-16T10:30:00.000Z');
      expect(deserialized?.[1]).toHaveProperty('values');
      expect(deserialized?.[1].values).toEqual([40, 50, 60]);
    });
  });

  describe('Handling null, undefined and empty values', () => {
    it('should handle empty strings appropriately', () => {
      expect(toString('')).toBe('');
      expect(toNumber('', { throwOnError: false, defaultValue: 0 })).toBe(0);
      expect(toBoolean('', { throwOnError: false, defaultValue: false })).toBe(false);
    });

    it('should handle whitespace strings appropriately', () => {
      expect(toString('   ')).toBe('   ');
      expect(toNumber('   ', { throwOnError: false, defaultValue: 0 })).toBe(0);
      expect(toBoolean('   ', { throwOnError: false, defaultValue: false })).toBe(false);
    });

    it('should handle null values with allowNil option', () => {
      expect(toString(null, { allowNil: true })).toBeNull();
      expect(toNumber(null, { allowNil: true })).toBeNull();
      expect(toBoolean(null, { allowNil: true })).toBeNull();
      expect(toDate(null, { allowNil: true })).toBeNull();
      expect(toArray(null, undefined, { allowNil: true })).toBeNull();
      expect(toObject(null, { allowNil: true })).toBeNull();
    });

    it('should handle undefined values with allowNil option', () => {
      expect(toString(undefined, { allowNil: true })).toBeUndefined();
      expect(toNumber(undefined, { allowNil: true })).toBeUndefined();
      expect(toBoolean(undefined, { allowNil: true })).toBeUndefined();
      expect(toDate(undefined, { allowNil: true })).toBeUndefined();
      expect(toArray(undefined, undefined, { allowNil: true })).toBeUndefined();
      expect(toObject(undefined, { allowNil: true })).toBeUndefined();
    });

    it('should use defaultValue for null/undefined when throwOnError is false', () => {
      expect(toString(null, { throwOnError: false, defaultValue: 'default' })).toBe('default');
      expect(toNumber(null, { throwOnError: false, defaultValue: 0 })).toBe(0);
      expect(toBoolean(null, { throwOnError: false, defaultValue: false })).toBe(false);
      expect(toDate(null, { throwOnError: false, defaultValue: new Date(0) })).toEqual(new Date(0));
      expect(toArray(null, undefined, { throwOnError: false, defaultValue: [] })).toEqual([]);
      expect(toObject(null, { throwOnError: false, defaultValue: {} })).toEqual({});
    });
  });
});