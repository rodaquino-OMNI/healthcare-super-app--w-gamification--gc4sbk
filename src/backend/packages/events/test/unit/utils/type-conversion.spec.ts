import { describe, expect, it, jest } from '@jest/globals';

// Import the type conversion utilities
// Assuming these utilities are exported from a utils/type-conversion.ts file
import {
  stringToDate,
  dateToString,
  stringToNumber,
  numberToString,
  stringToBoolean,
  booleanToString,
  serializeObject,
  deserializeObject,
  safeConvert
} from '../../../src/utils/type-conversion';

describe('Type Conversion Utilities', () => {
  describe('Date Conversion', () => {
    it('should convert ISO string to Date object', () => {
      const isoString = '2023-05-15T10:30:45.123Z';
      const date = stringToDate(isoString);
      
      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString()).toBe(isoString);
    });

    it('should convert Date object to ISO string', () => {
      const date = new Date('2023-05-15T10:30:45.123Z');
      const isoString = dateToString(date);
      
      expect(typeof isoString).toBe('string');
      expect(isoString).toBe('2023-05-15T10:30:45.123Z');
    });

    it('should handle invalid date strings', () => {
      expect(() => stringToDate('invalid-date')).toThrow();
    });

    it('should return null for null input in stringToDate', () => {
      expect(stringToDate(null)).toBeNull();
    });

    it('should return empty string for null input in dateToString', () => {
      expect(dateToString(null)).toBe('');
    });

    it('should handle different date formats', () => {
      // Test with different formats if the utility supports them
      const dateFormats = [
        { input: '2023-05-15', expected: new Date('2023-05-15T00:00:00.000Z') },
        { input: '15/05/2023', expected: new Date('2023-05-15T00:00:00.000Z') },
        { input: 'May 15, 2023', expected: new Date('2023-05-15T00:00:00.000Z') }
      ];

      dateFormats.forEach(format => {
        const result = stringToDate(format.input);
        expect(result.getTime()).toBe(format.expected.getTime());
      });
    });
  });

  describe('Number Conversion', () => {
    it('should convert string to number', () => {
      expect(stringToNumber('123')).toBe(123);
      expect(stringToNumber('123.45')).toBe(123.45);
      expect(stringToNumber('-123')).toBe(-123);
      expect(stringToNumber('0')).toBe(0);
    });

    it('should handle precision in floating point numbers', () => {
      // Test precision handling for floating point numbers
      expect(stringToNumber('123.456789', 2)).toBe(123.46); // Rounded to 2 decimal places
      expect(stringToNumber('123.456789', 4)).toBe(123.4568); // Rounded to 4 decimal places
      expect(stringToNumber('0.1234567890', 6)).toBe(0.123457); // Rounded to 6 decimal places
    });

    it('should convert number to string with proper formatting', () => {
      expect(numberToString(123)).toBe('123');
      expect(numberToString(123.45)).toBe('123.45');
      expect(numberToString(-123)).toBe('-123');
      expect(numberToString(0)).toBe('0');
    });

    it('should handle precision in number to string conversion', () => {
      expect(numberToString(123.456789, 2)).toBe('123.46');
      expect(numberToString(123.456789, 4)).toBe('123.4568');
      expect(numberToString(0.1234567890, 6)).toBe('0.123457');
    });

    it('should handle invalid number strings', () => {
      expect(stringToNumber('not-a-number')).toBeNaN();
      expect(stringToNumber('')).toBeNaN();
    });

    it('should handle null and undefined inputs', () => {
      expect(stringToNumber(null)).toBeNull();
      expect(stringToNumber(undefined)).toBeUndefined();
      expect(numberToString(null)).toBe('');
      expect(numberToString(undefined)).toBe('');
    });
  });

  describe('Boolean Conversion', () => {
    it('should convert string to boolean - truthy values', () => {
      // Test various string representations of true
      const truthyValues = ['true', 'TRUE', 'True', 'yes', 'YES', 'Yes', '1', 'on', 'ON', 'On'];
      
      truthyValues.forEach(value => {
        expect(stringToBoolean(value)).toBe(true);
      });
    });

    it('should convert string to boolean - falsy values', () => {
      // Test various string representations of false
      const falsyValues = ['false', 'FALSE', 'False', 'no', 'NO', 'No', '0', 'off', 'OFF', 'Off', ''];
      
      falsyValues.forEach(value => {
        expect(stringToBoolean(value)).toBe(false);
      });
    });

    it('should convert boolean to string', () => {
      expect(booleanToString(true)).toBe('true');
      expect(booleanToString(false)).toBe('false');
    });

    it('should handle custom boolean string formats', () => {
      // Test with custom format options if supported
      expect(booleanToString(true, { format: 'yes/no' })).toBe('yes');
      expect(booleanToString(false, { format: 'yes/no' })).toBe('no');
      
      expect(booleanToString(true, { format: '1/0' })).toBe('1');
      expect(booleanToString(false, { format: '1/0' })).toBe('0');
    });

    it('should handle null and undefined inputs', () => {
      expect(stringToBoolean(null)).toBeNull();
      expect(stringToBoolean(undefined)).toBeUndefined();
      expect(booleanToString(null)).toBe('');
      expect(booleanToString(undefined)).toBe('');
    });

    it('should handle invalid boolean strings', () => {
      // Default to false for invalid inputs if that's the expected behavior
      expect(stringToBoolean('invalid-boolean')).toBe(false);
    });
  });

  describe('Object Serialization and Deserialization', () => {
    it('should serialize and deserialize simple objects', () => {
      const obj = { name: 'John', age: 30, active: true };
      const serialized = serializeObject(obj);
      const deserialized = deserializeObject(serialized);
      
      expect(typeof serialized).toBe('string');
      expect(deserialized).toEqual(obj);
    });

    it('should handle complex nested objects', () => {
      const complexObj = {
        user: {
          name: 'John',
          address: {
            street: '123 Main St',
            city: 'New York',
            zip: '10001'
          },
          hobbies: ['reading', 'swimming', 'coding']
        },
        metadata: {
          created: new Date('2023-05-15T10:30:45.123Z'),
          lastModified: new Date('2023-05-16T08:15:30.456Z')
        },
        stats: {
          visits: 42,
          conversions: 3.14159
        },
        settings: {
          notifications: true,
          darkMode: false
        }
      };
      
      const serialized = serializeObject(complexObj);
      const deserialized = deserializeObject(serialized);
      
      // Check that the structure is preserved
      expect(deserialized.user.name).toBe('John');
      expect(deserialized.user.address.city).toBe('New York');
      expect(deserialized.user.hobbies).toEqual(['reading', 'swimming', 'coding']);
      expect(deserialized.stats.visits).toBe(42);
      expect(deserialized.settings.darkMode).toBe(false);
      
      // Check that dates are properly converted back to Date objects
      expect(deserialized.metadata.created).toBeInstanceOf(Date);
      expect(deserialized.metadata.created.toISOString()).toBe('2023-05-15T10:30:45.123Z');
    });

    it('should handle arrays of objects', () => {
      const arrayOfObjects = [
        { id: 1, name: 'Item 1', value: 10.5 },
        { id: 2, name: 'Item 2', value: 20.75 },
        { id: 3, name: 'Item 3', value: 30.25 }
      ];
      
      const serialized = serializeObject(arrayOfObjects);
      const deserialized = deserializeObject(serialized);
      
      expect(Array.isArray(deserialized)).toBe(true);
      expect(deserialized.length).toBe(3);
      expect(deserialized[0].id).toBe(1);
      expect(deserialized[1].name).toBe('Item 2');
      expect(deserialized[2].value).toBe(30.25);
    });

    it('should handle circular references', () => {
      const circularObj: any = { name: 'Circular' };
      circularObj.self = circularObj; // Create circular reference
      
      // Should not throw and should handle circular references appropriately
      expect(() => serializeObject(circularObj)).not.toThrow();
      
      const serialized = serializeObject(circularObj);
      const deserialized = deserializeObject(serialized);
      
      expect(deserialized.name).toBe('Circular');
      // Depending on implementation, circular references might be preserved or replaced with a placeholder
    });

    it('should handle null and undefined values', () => {
      expect(serializeObject(null)).toBe('null');
      expect(serializeObject(undefined)).toBe('undefined');
      
      expect(deserializeObject('null')).toBeNull();
      expect(deserializeObject('undefined')).toBeUndefined();
    });
  });

  describe('Safe Conversion Utility', () => {
    it('should safely convert values with fallback for errors', () => {
      // Test with a conversion function that might throw
      const fallbackValue = 'fallback';
      
      // Successful conversion
      expect(safeConvert('123', stringToNumber, fallbackValue)).toBe(123);
      
      // Failed conversion with fallback
      const throwingFn = jest.fn().mockImplementation(() => {
        throw new Error('Conversion error');
      });
      
      expect(safeConvert('invalid', throwingFn, fallbackValue)).toBe(fallbackValue);
      expect(throwingFn).toHaveBeenCalledWith('invalid');
    });

    it('should handle null and undefined inputs with default values', () => {
      const defaultValue = 'default';
      
      // Test with null input
      expect(safeConvert(null, stringToNumber, defaultValue)).toBe(defaultValue);
      
      // Test with undefined input
      expect(safeConvert(undefined, stringToNumber, defaultValue)).toBe(defaultValue);
    });

    it('should pass through additional arguments to the converter function', () => {
      // Create a mock function that accepts multiple arguments
      const mockConverter = jest.fn().mockImplementation((value, precision) => {
        if (typeof value !== 'string') return NaN;
        return parseFloat(parseFloat(value).toFixed(precision));
      });
      
      // Test with additional arguments
      expect(safeConvert('123.456789', mockConverter, 0, 2)).toBe(123.46);
      expect(mockConverter).toHaveBeenCalledWith('123.456789', 2);
    });

    it('should handle different types of converter functions', () => {
      // Test with different converter functions
      expect(safeConvert('true', stringToBoolean, false)).toBe(true);
      expect(safeConvert('2023-05-15', stringToDate, null)).toBeInstanceOf(Date);
      
      // Test with a custom converter function
      const customConverter = (value: string): string[] => value.split(',');
      expect(safeConvert('a,b,c', customConverter, [])).toEqual(['a', 'b', 'c']);
    });
  });
});