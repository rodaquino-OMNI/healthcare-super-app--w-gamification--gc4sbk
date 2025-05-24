import {
  assertString,
  assertNumber,
  assertBoolean,
  assertArray,
  assertObject,
  assertFunction,
  assertDate,
  assertDefined,
  assertNever
} from '../../../src/type/assertions';

describe('Type Assertions', () => {
  describe('assertString', () => {
    it('should not throw for string values', () => {
      expect(() => assertString('hello')).not.toThrow();
      expect(() => assertString('')).not.toThrow();
      expect(() => assertString(`template string`)).not.toThrow();
      expect(() => assertString(String('converted'))).not.toThrow();
    });

    it('should throw for non-string values', () => {
      expect(() => assertString(123)).toThrow();
      expect(() => assertString(true)).toThrow();
      expect(() => assertString({})).toThrow();
      expect(() => assertString([])).toThrow();
      expect(() => assertString(null)).toThrow();
      expect(() => assertString(undefined)).toThrow();
    });

    it('should include the expected and actual types in the error message', () => {
      try {
        assertString(123);
        fail('Expected assertString to throw');
      } catch (error) {
        expect(error.message).toContain('string');
        expect(error.message).toContain('number');
      }
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      try {
        assertString(123, customMessage);
        fail('Expected assertString to throw');
      } catch (error) {
        expect(error.message).toContain(customMessage);
      }
    });

    it('should return the input value when assertion passes', () => {
      const value = 'test';
      expect(assertString(value)).toBe(value);
    });
  });

  describe('assertNumber', () => {
    it('should not throw for number values', () => {
      expect(() => assertNumber(123)).not.toThrow();
      expect(() => assertNumber(0)).not.toThrow();
      expect(() => assertNumber(-456)).not.toThrow();
      expect(() => assertNumber(3.14)).not.toThrow();
      expect(() => assertNumber(Number('123'))).not.toThrow();
    });

    it('should throw for NaN', () => {
      expect(() => assertNumber(NaN)).toThrow();
    });

    it('should throw for non-number values', () => {
      expect(() => assertNumber('123')).toThrow();
      expect(() => assertNumber(true)).toThrow();
      expect(() => assertNumber({})).toThrow();
      expect(() => assertNumber([])).toThrow();
      expect(() => assertNumber(null)).toThrow();
      expect(() => assertNumber(undefined)).toThrow();
    });

    it('should include the expected and actual types in the error message', () => {
      try {
        assertNumber('123');
        fail('Expected assertNumber to throw');
      } catch (error) {
        expect(error.message).toContain('number');
        expect(error.message).toContain('string');
      }
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      try {
        assertNumber('123', customMessage);
        fail('Expected assertNumber to throw');
      } catch (error) {
        expect(error.message).toContain(customMessage);
      }
    });

    it('should return the input value when assertion passes', () => {
      const value = 123;
      expect(assertNumber(value)).toBe(value);
    });
  });

  describe('assertBoolean', () => {
    it('should not throw for boolean values', () => {
      expect(() => assertBoolean(true)).not.toThrow();
      expect(() => assertBoolean(false)).not.toThrow();
      expect(() => assertBoolean(Boolean(1))).not.toThrow();
    });

    it('should throw for non-boolean values', () => {
      expect(() => assertBoolean(0)).toThrow();
      expect(() => assertBoolean(1)).toThrow();
      expect(() => assertBoolean('true')).toThrow();
      expect(() => assertBoolean('false')).toThrow();
      expect(() => assertBoolean({})).toThrow();
      expect(() => assertBoolean([])).toThrow();
      expect(() => assertBoolean(null)).toThrow();
      expect(() => assertBoolean(undefined)).toThrow();
    });

    it('should include the expected and actual types in the error message', () => {
      try {
        assertBoolean('true');
        fail('Expected assertBoolean to throw');
      } catch (error) {
        expect(error.message).toContain('boolean');
        expect(error.message).toContain('string');
      }
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      try {
        assertBoolean('true', customMessage);
        fail('Expected assertBoolean to throw');
      } catch (error) {
        expect(error.message).toContain(customMessage);
      }
    });

    it('should return the input value when assertion passes', () => {
      const value = true;
      expect(assertBoolean(value)).toBe(value);
    });
  });

  describe('assertArray', () => {
    it('should not throw for array values', () => {
      expect(() => assertArray([])).not.toThrow();
      expect(() => assertArray([1, 2, 3])).not.toThrow();
      expect(() => assertArray(new Array())).not.toThrow();
      expect(() => assertArray(Array.from('abc'))).not.toThrow();
    });

    it('should throw for array-like objects', () => {
      expect(() => assertArray({ length: 0 })).toThrow();
    });

    it('should throw for non-array values', () => {
      expect(() => assertArray({})).toThrow();
      expect(() => assertArray('array')).toThrow();
      expect(() => assertArray(123)).toThrow();
      expect(() => assertArray(true)).toThrow();
      expect(() => assertArray(null)).toThrow();
      expect(() => assertArray(undefined)).toThrow();
    });

    it('should include the expected and actual types in the error message', () => {
      try {
        assertArray({});
        fail('Expected assertArray to throw');
      } catch (error) {
        expect(error.message).toContain('array');
        expect(error.message).toContain('object');
      }
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      try {
        assertArray({}, customMessage);
        fail('Expected assertArray to throw');
      } catch (error) {
        expect(error.message).toContain(customMessage);
      }
    });

    it('should return the input value when assertion passes', () => {
      const value = [1, 2, 3];
      expect(assertArray(value)).toBe(value);
    });
  });

  describe('assertObject', () => {
    it('should not throw for object values', () => {
      expect(() => assertObject({})).not.toThrow();
      expect(() => assertObject({ a: 1 })).not.toThrow();
      expect(() => assertObject(new Object())).not.toThrow();
      expect(() => assertObject(Object.create(null))).not.toThrow();
    });

    it('should throw for arrays', () => {
      expect(() => assertObject([])).toThrow();
      expect(() => assertObject([1, 2, 3])).toThrow();
    });

    it('should throw for null', () => {
      expect(() => assertObject(null)).toThrow();
    });

    it('should throw for non-object values', () => {
      expect(() => assertObject(123)).toThrow();
      expect(() => assertObject('string')).toThrow();
      expect(() => assertObject(true)).toThrow();
      expect(() => assertObject(undefined)).toThrow();
    });

    it('should throw for functions', () => {
      expect(() => assertObject(() => {})).toThrow();
      expect(() => assertObject(function() {})).toThrow();
    });

    it('should include the expected and actual types in the error message', () => {
      try {
        assertObject('object');
        fail('Expected assertObject to throw');
      } catch (error) {
        expect(error.message).toContain('object');
        expect(error.message).toContain('string');
      }
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      try {
        assertObject('object', customMessage);
        fail('Expected assertObject to throw');
      } catch (error) {
        expect(error.message).toContain(customMessage);
      }
    });

    it('should return the input value when assertion passes', () => {
      const value = { a: 1 };
      expect(assertObject(value)).toBe(value);
    });
  });

  describe('assertFunction', () => {
    it('should not throw for function values', () => {
      expect(() => assertFunction(() => {})).not.toThrow();
      expect(() => assertFunction(function() {})).not.toThrow();
      expect(() => assertFunction(assertFunction)).not.toThrow();
      expect(() => assertFunction(Function)).not.toThrow();
      expect(() => assertFunction(async () => {})).not.toThrow();
      expect(() => assertFunction(function* () {})).not.toThrow();
    });

    it('should throw for non-function values', () => {
      expect(() => assertFunction({})).toThrow();
      expect(() => assertFunction([])).toThrow();
      expect(() => assertFunction(123)).toThrow();
      expect(() => assertFunction('string')).toThrow();
      expect(() => assertFunction(true)).toThrow();
      expect(() => assertFunction(null)).toThrow();
      expect(() => assertFunction(undefined)).toThrow();
    });

    it('should include the expected and actual types in the error message', () => {
      try {
        assertFunction({});
        fail('Expected assertFunction to throw');
      } catch (error) {
        expect(error.message).toContain('function');
        expect(error.message).toContain('object');
      }
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      try {
        assertFunction({}, customMessage);
        fail('Expected assertFunction to throw');
      } catch (error) {
        expect(error.message).toContain(customMessage);
      }
    });

    it('should return the input value when assertion passes', () => {
      const value = () => {};
      expect(assertFunction(value)).toBe(value);
    });
  });

  describe('assertDate', () => {
    it('should not throw for Date objects', () => {
      expect(() => assertDate(new Date())).not.toThrow();
      expect(() => assertDate(new Date('2023-01-01'))).not.toThrow();
    });

    it('should throw for date strings', () => {
      expect(() => assertDate('2023-01-01')).toThrow();
      expect(() => assertDate('January 1, 2023')).toThrow();
    });

    it('should throw for timestamps', () => {
      expect(() => assertDate(Date.now())).toThrow();
      expect(() => assertDate(1672531200000)).toThrow();
    });

    it('should throw for non-date values', () => {
      expect(() => assertDate({})).toThrow();
      expect(() => assertDate([])).toThrow();
      expect(() => assertDate(123)).toThrow();
      expect(() => assertDate('string')).toThrow();
      expect(() => assertDate(true)).toThrow();
      expect(() => assertDate(null)).toThrow();
      expect(() => assertDate(undefined)).toThrow();
    });

    it('should throw for invalid dates', () => {
      expect(() => assertDate(new Date('invalid-date'))).toThrow();
    });

    it('should include the expected and actual types in the error message', () => {
      try {
        assertDate('2023-01-01');
        fail('Expected assertDate to throw');
      } catch (error) {
        expect(error.message).toContain('Date');
        expect(error.message).toContain('string');
      }
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      try {
        assertDate('2023-01-01', customMessage);
        fail('Expected assertDate to throw');
      } catch (error) {
        expect(error.message).toContain(customMessage);
      }
    });

    it('should return the input value when assertion passes', () => {
      const value = new Date();
      expect(assertDate(value)).toBe(value);
    });
  });

  describe('assertDefined', () => {
    it('should not throw for defined values', () => {
      expect(() => assertDefined('hello')).not.toThrow();
      expect(() => assertDefined(123)).not.toThrow();
      expect(() => assertDefined(true)).not.toThrow();
      expect(() => assertDefined({})).not.toThrow();
      expect(() => assertDefined([])).not.toThrow();
      expect(() => assertDefined(() => {})).not.toThrow();
      expect(() => assertDefined(0)).not.toThrow();
      expect(() => assertDefined('')).not.toThrow();
      expect(() => assertDefined(false)).not.toThrow();
    });

    it('should throw for null', () => {
      expect(() => assertDefined(null)).toThrow();
    });

    it('should throw for undefined', () => {
      expect(() => assertDefined(undefined)).toThrow();
      let undefinedVar;
      expect(() => assertDefined(undefinedVar)).toThrow();
    });

    it('should include descriptive information in the error message', () => {
      try {
        assertDefined(null);
        fail('Expected assertDefined to throw');
      } catch (error) {
        expect(error.message).toContain('defined');
        expect(error.message).toContain('null');
      }

      try {
        assertDefined(undefined);
        fail('Expected assertDefined to throw');
      } catch (error) {
        expect(error.message).toContain('defined');
        expect(error.message).toContain('undefined');
      }
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      try {
        assertDefined(null, customMessage);
        fail('Expected assertDefined to throw');
      } catch (error) {
        expect(error.message).toContain(customMessage);
      }
    });

    it('should return the input value when assertion passes', () => {
      const value = 'test';
      expect(assertDefined(value)).toBe(value);
    });
  });

  describe('assertNever', () => {
    it('should always throw an error', () => {
      // @ts-expect-error - We're intentionally passing a non-never value for testing
      expect(() => assertNever('value')).toThrow();
      // @ts-expect-error - We're intentionally passing a non-never value for testing
      expect(() => assertNever(123)).toThrow();
      // @ts-expect-error - We're intentionally passing a non-never value for testing
      expect(() => assertNever(true)).toThrow();
      // @ts-expect-error - We're intentionally passing a non-never value for testing
      expect(() => assertNever({})).toThrow();
      // @ts-expect-error - We're intentionally passing a non-never value for testing
      expect(() => assertNever([])).toThrow();
      // @ts-expect-error - We're intentionally passing a non-never value for testing
      expect(() => assertNever(null)).toThrow();
      // @ts-expect-error - We're intentionally passing a non-never value for testing
      expect(() => assertNever(undefined)).toThrow();
    });

    it('should include the unexpected value in the error message', () => {
      try {
        // @ts-expect-error - We're intentionally passing a non-never value for testing
        assertNever('unexpected value');
        fail('Expected assertNever to throw');
      } catch (error) {
        expect(error.message).toContain('unexpected value');
      }
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      try {
        // @ts-expect-error - We're intentionally passing a non-never value for testing
        assertNever('value', customMessage);
        fail('Expected assertNever to throw');
      } catch (error) {
        expect(error.message).toContain(customMessage);
      }
    });

    it('should work with exhaustive switch statements', () => {
      type Color = 'red' | 'green' | 'blue';

      function getColorName(color: Color): string {
        switch (color) {
          case 'red':
            return 'Red';
          case 'green':
            return 'Green';
          case 'blue':
            return 'Blue';
          default:
            return assertNever(color);
        }
      }

      expect(getColorName('red')).toBe('Red');
      expect(getColorName('green')).toBe('Green');
      expect(getColorName('blue')).toBe('Blue');

      // This test verifies that the function is exhaustive
      // If a new color is added to the Color type without updating getColorName,
      // TypeScript will generate a compile-time error
    });
  });

  describe('Edge cases', () => {
    it('should handle edge cases correctly', () => {
      // Empty string is still a string
      expect(() => assertString('')).not.toThrow();
      
      // Zero is still a number
      expect(() => assertNumber(0)).not.toThrow();
      
      // NaN is not considered a valid number
      expect(() => assertNumber(NaN)).toThrow();
      
      // Empty array is still an array
      expect(() => assertArray([])).not.toThrow();
      
      // Empty object is still an object
      expect(() => assertObject({})).not.toThrow();
      
      // Object.create(null) has no prototype but is still an object
      const noProtoObj = Object.create(null);
      expect(() => assertObject(noProtoObj)).not.toThrow();
    });

    it('should correctly distinguish between objects and arrays', () => {
      expect(() => assertObject([])).toThrow();
      expect(() => assertArray({})).toThrow();
    });

    it('should handle boxed primitives correctly', () => {
      // String object vs string primitive
      expect(() => assertString(new String('hello'))).not.toThrow();
      
      // Number object vs number primitive
      expect(() => assertNumber(new Number(123))).not.toThrow();
      
      // Boolean object vs boolean primitive
      expect(() => assertBoolean(new Boolean(true))).not.toThrow();
    });
  });
});