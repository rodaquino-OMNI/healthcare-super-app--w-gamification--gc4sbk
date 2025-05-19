/**
 * Tests for type assertion utility functions
 * 
 * These tests validate that assertion functions correctly enforce type constraints
 * by throwing errors when values don't match expected types. The test suite verifies
 * that assertions throw appropriate errors with descriptive messages for invalid inputs
 * and pass through valid values without errors.
 */

import {
  assertString,
  assertNumber,
  assertBoolean,
  assertObject,
  assertArray,
  assertDate,
  assertFunction,
  assertDefined,
  assertNonNull,
  assertNonNullable,
  assertType,
  assertInstanceOf,
  assertNever,
  assert,
  assertOneOf
} from '../../../src/type/assertions';
import { ValidationError } from '@austa/errors';

describe('Type Assertion Functions', () => {
  // Primitive type assertions
  describe('Primitive Type Assertions', () => {
    describe('assertString', () => {
      it('should not throw for string values', () => {
        expect(() => assertString('')).not.toThrow();
        expect(() => assertString('hello')).not.toThrow();
        expect(() => assertString(String('test'))).not.toThrow();
        expect(() => assertString(`template literal`)).not.toThrow();
      });

      it('should throw ValidationError for non-string values', () => {
        expect(() => assertString(123)).toThrow(ValidationError);
        expect(() => assertString(true)).toThrow(ValidationError);
        expect(() => assertString({})).toThrow(ValidationError);
        expect(() => assertString([])).toThrow(ValidationError);
        expect(() => assertString(null)).toThrow(ValidationError);
        expect(() => assertString(undefined)).toThrow(ValidationError);
        expect(() => assertString(() => {})).toThrow(ValidationError);
      });

      it('should include descriptive error message', () => {
        try {
          assertString(123);
          fail('Expected assertString to throw');
        } catch (error) {
          expect(error.message).toContain('Expected string');
          expect(error.message).toContain('received number');
        }
      });

      it('should use custom error message when provided', () => {
        const customMessage = 'Custom error message for string assertion';
        try {
          assertString(123, { message: customMessage });
          fail('Expected assertString to throw');
        } catch (error) {
          expect(error.message).toContain(customMessage);
        }
      });

      it('should include journey context in error when provided', () => {
        try {
          assertString(123, { journeyId: 'health' });
          fail('Expected assertString to throw');
        } catch (error) {
          expect(error.journeyId).toBe('health');
        }
      });

      it('should include additional context in error when provided', () => {
        const context = { fieldName: 'username', entityId: '123' };
        try {
          assertString(123, { context });
          fail('Expected assertString to throw');
        } catch (error) {
          expect(error.details).toMatchObject(context);
        }
      });
    });

    describe('assertNumber', () => {
      it('should not throw for number values', () => {
        expect(() => assertNumber(0)).not.toThrow();
        expect(() => assertNumber(123)).not.toThrow();
        expect(() => assertNumber(-456)).not.toThrow();
        expect(() => assertNumber(3.14)).not.toThrow();
        expect(() => assertNumber(Number('789'))).not.toThrow();
        expect(() => assertNumber(Infinity)).not.toThrow();
        expect(() => assertNumber(-Infinity)).not.toThrow();
      });

      it('should throw ValidationError for NaN', () => {
        expect(() => assertNumber(NaN)).toThrow(ValidationError);
        expect(() => assertNumber(Number('not a number'))).toThrow(ValidationError);
      });

      it('should throw ValidationError for non-number values', () => {
        expect(() => assertNumber('123')).toThrow(ValidationError);
        expect(() => assertNumber(true)).toThrow(ValidationError);
        expect(() => assertNumber({})).toThrow(ValidationError);
        expect(() => assertNumber([])).toThrow(ValidationError);
        expect(() => assertNumber(null)).toThrow(ValidationError);
        expect(() => assertNumber(undefined)).toThrow(ValidationError);
        expect(() => assertNumber(() => {})).toThrow(ValidationError);
      });

      it('should include descriptive error message', () => {
        try {
          assertNumber('123');
          fail('Expected assertNumber to throw');
        } catch (error) {
          expect(error.message).toContain('Expected number');
          expect(error.message).toContain('received string');
        }
      });

      it('should use custom error message when provided', () => {
        const customMessage = 'Custom error message for number assertion';
        try {
          assertNumber('123', { message: customMessage });
          fail('Expected assertNumber to throw');
        } catch (error) {
          expect(error.message).toContain(customMessage);
        }
      });
    });

    describe('assertBoolean', () => {
      it('should not throw for boolean values', () => {
        expect(() => assertBoolean(true)).not.toThrow();
        expect(() => assertBoolean(false)).not.toThrow();
        expect(() => assertBoolean(Boolean(1))).not.toThrow();
        expect(() => assertBoolean(Boolean(0))).not.toThrow();
      });

      it('should throw ValidationError for non-boolean values', () => {
        expect(() => assertBoolean(0)).toThrow(ValidationError);
        expect(() => assertBoolean(1)).toThrow(ValidationError);
        expect(() => assertBoolean('true')).toThrow(ValidationError);
        expect(() => assertBoolean('false')).toThrow(ValidationError);
        expect(() => assertBoolean({})).toThrow(ValidationError);
        expect(() => assertBoolean([])).toThrow(ValidationError);
        expect(() => assertBoolean(null)).toThrow(ValidationError);
        expect(() => assertBoolean(undefined)).toThrow(ValidationError);
        expect(() => assertBoolean(() => {})).toThrow(ValidationError);
      });

      it('should include descriptive error message', () => {
        try {
          assertBoolean('true');
          fail('Expected assertBoolean to throw');
        } catch (error) {
          expect(error.message).toContain('Expected boolean');
          expect(error.message).toContain('received string');
        }
      });
    });
  });

  // Compound type assertions
  describe('Compound Type Assertions', () => {
    describe('assertObject', () => {
      it('should not throw for object values', () => {
        expect(() => assertObject({})).not.toThrow();
        expect(() => assertObject({ key: 'value' })).not.toThrow();
        expect(() => assertObject(new Object())).not.toThrow();
        expect(() => assertObject(Object.create(null))).not.toThrow();
      });

      it('should throw ValidationError for arrays', () => {
        expect(() => assertObject([])).toThrow(ValidationError);
        expect(() => assertObject([1, 2, 3])).toThrow(ValidationError);
      });

      it('should throw ValidationError for null', () => {
        expect(() => assertObject(null)).toThrow(ValidationError);
      });

      it('should throw ValidationError for other non-object values', () => {
        expect(() => assertObject('')).toThrow(ValidationError);
        expect(() => assertObject(123)).toThrow(ValidationError);
        expect(() => assertObject(true)).toThrow(ValidationError);
        expect(() => assertObject(undefined)).toThrow(ValidationError);
        expect(() => assertObject(() => {})).toThrow(ValidationError);
      });

      it('should include descriptive error message', () => {
        try {
          assertObject([]);
          fail('Expected assertObject to throw');
        } catch (error) {
          expect(error.message).toContain('Expected object');
          expect(error.message).toContain('received array');
        }
      });
    });

    describe('assertArray', () => {
      it('should not throw for array values', () => {
        expect(() => assertArray([])).not.toThrow();
        expect(() => assertArray([1, 2, 3])).not.toThrow();
        expect(() => assertArray(new Array())).not.toThrow();
        expect(() => assertArray(Array.from('abc'))).not.toThrow();
      });

      it('should throw ValidationError for non-array values', () => {
        expect(() => assertArray({})).toThrow(ValidationError);
        expect(() => assertArray('')).toThrow(ValidationError);
        expect(() => assertArray(123)).toThrow(ValidationError);
        expect(() => assertArray(true)).toThrow(ValidationError);
        expect(() => assertArray(null)).toThrow(ValidationError);
        expect(() => assertArray(undefined)).toThrow(ValidationError);
        expect(() => assertArray(() => {})).toThrow(ValidationError);
      });

      it('should include descriptive error message', () => {
        try {
          assertArray({});
          fail('Expected assertArray to throw');
        } catch (error) {
          expect(error.message).toContain('Expected array');
          expect(error.message).toContain('received object');
        }
      });
    });

    describe('assertDate', () => {
      it('should not throw for valid Date objects', () => {
        expect(() => assertDate(new Date())).not.toThrow();
        expect(() => assertDate(new Date('2023-01-01'))).not.toThrow();
      });

      it('should throw ValidationError for invalid Date objects', () => {
        expect(() => assertDate(new Date('invalid-date'))).toThrow(ValidationError);
      });

      it('should throw ValidationError for non-Date values', () => {
        expect(() => assertDate({})).toThrow(ValidationError);
        expect(() => assertDate([])).toThrow(ValidationError);
        expect(() => assertDate('')).toThrow(ValidationError);
        expect(() => assertDate('2023-01-01')).toThrow(ValidationError);
        expect(() => assertDate(123)).toThrow(ValidationError);
        expect(() => assertDate(true)).toThrow(ValidationError);
        expect(() => assertDate(null)).toThrow(ValidationError);
        expect(() => assertDate(undefined)).toThrow(ValidationError);
      });

      it('should include descriptive error message', () => {
        try {
          assertDate('2023-01-01');
          fail('Expected assertDate to throw');
        } catch (error) {
          expect(error.message).toContain('Expected valid Date');
          expect(error.message).toContain('received string');
        }
      });
    });

    describe('assertFunction', () => {
      it('should not throw for function values', () => {
        expect(() => assertFunction(() => {})).not.toThrow();
        expect(() => assertFunction(function() {})).not.toThrow();
        expect(() => assertFunction(Array.isArray)).not.toThrow();
        expect(() => assertFunction(Object)).not.toThrow();
      });

      it('should throw ValidationError for non-function values', () => {
        expect(() => assertFunction({})).toThrow(ValidationError);
        expect(() => assertFunction([])).toThrow(ValidationError);
        expect(() => assertFunction('')).toThrow(ValidationError);
        expect(() => assertFunction(123)).toThrow(ValidationError);
        expect(() => assertFunction(true)).toThrow(ValidationError);
        expect(() => assertFunction(null)).toThrow(ValidationError);
        expect(() => assertFunction(undefined)).toThrow(ValidationError);
      });

      it('should include descriptive error message', () => {
        try {
          assertFunction({});
          fail('Expected assertFunction to throw');
        } catch (error) {
          expect(error.message).toContain('Expected function');
          expect(error.message).toContain('received object');
        }
      });
    });
  });

  // Nullability assertions
  describe('Nullability Assertions', () => {
    describe('assertDefined', () => {
      it('should not throw for defined values', () => {
        expect(() => assertDefined('')).not.toThrow();
        expect(() => assertDefined(0)).not.toThrow();
        expect(() => assertDefined(false)).not.toThrow();
        expect(() => assertDefined({})).not.toThrow();
        expect(() => assertDefined([])).not.toThrow();
        expect(() => assertDefined(null)).not.toThrow(); // null is defined
        expect(() => assertDefined(() => {})).not.toThrow();
      });

      it('should throw ValidationError for undefined values', () => {
        expect(() => assertDefined(undefined)).toThrow(ValidationError);
        let undefinedVar;
        expect(() => assertDefined(undefinedVar)).toThrow(ValidationError);
      });

      it('should include descriptive error message', () => {
        try {
          assertDefined(undefined);
          fail('Expected assertDefined to throw');
        } catch (error) {
          expect(error.message).toContain('Value is undefined');
        }
      });

      it('should use custom error message when provided', () => {
        const customMessage = 'Custom error message for defined assertion';
        try {
          assertDefined(undefined, { message: customMessage });
          fail('Expected assertDefined to throw');
        } catch (error) {
          expect(error.message).toContain(customMessage);
        }
      });
    });

    describe('assertNonNull', () => {
      it('should not throw for non-null values', () => {
        expect(() => assertNonNull('')).not.toThrow();
        expect(() => assertNonNull(0)).not.toThrow();
        expect(() => assertNonNull(false)).not.toThrow();
        expect(() => assertNonNull({})).not.toThrow();
        expect(() => assertNonNull([])).not.toThrow();
        expect(() => assertNonNull(undefined)).not.toThrow(); // undefined is not null
        expect(() => assertNonNull(() => {})).not.toThrow();
      });

      it('should throw ValidationError for null values', () => {
        expect(() => assertNonNull(null)).toThrow(ValidationError);
      });

      it('should include descriptive error message', () => {
        try {
          assertNonNull(null);
          fail('Expected assertNonNull to throw');
        } catch (error) {
          expect(error.message).toContain('Value is null');
        }
      });
    });

    describe('assertNonNullable', () => {
      it('should not throw for non-null and non-undefined values', () => {
        expect(() => assertNonNullable('')).not.toThrow();
        expect(() => assertNonNullable(0)).not.toThrow();
        expect(() => assertNonNullable(false)).not.toThrow();
        expect(() => assertNonNullable({})).not.toThrow();
        expect(() => assertNonNullable([])).not.toThrow();
        expect(() => assertNonNullable(() => {})).not.toThrow();
      });

      it('should throw ValidationError for null values', () => {
        expect(() => assertNonNullable(null)).toThrow(ValidationError);
      });

      it('should throw ValidationError for undefined values', () => {
        expect(() => assertNonNullable(undefined)).toThrow(ValidationError);
        let undefinedVar;
        expect(() => assertNonNullable(undefinedVar)).toThrow(ValidationError);
      });

      it('should include descriptive error message for null', () => {
        try {
          assertNonNullable(null);
          fail('Expected assertNonNullable to throw');
        } catch (error) {
          expect(error.message).toContain('Value is null');
        }
      });

      it('should include descriptive error message for undefined', () => {
        try {
          assertNonNullable(undefined);
          fail('Expected assertNonNullable to throw');
        } catch (error) {
          expect(error.message).toContain('Value is undefined');
        }
      });
    });
  });

  // Generic type assertions
  describe('Generic Type Assertions', () => {
    describe('assertType', () => {
      it('should not throw when value matches expected type', () => {
        expect(() => assertType('hello', 'string')).not.toThrow();
        expect(() => assertType(123, 'number')).not.toThrow();
        expect(() => assertType(true, 'boolean')).not.toThrow();
        expect(() => assertType({}, 'object')).not.toThrow();
        expect(() => assertType(() => {}, 'function')).not.toThrow();
        expect(() => assertType(undefined, 'undefined')).not.toThrow();
        expect(() => assertType(Symbol('test'), 'symbol')).not.toThrow();
      });

      it('should throw ValidationError when value does not match expected type', () => {
        expect(() => assertType('hello', 'number')).toThrow(ValidationError);
        expect(() => assertType(123, 'string')).toThrow(ValidationError);
        expect(() => assertType(true, 'object')).toThrow(ValidationError);
        expect(() => assertType({}, 'function')).toThrow(ValidationError);
        expect(() => assertType(() => {}, 'object')).toThrow(ValidationError);
      });

      it('should throw ValidationError for NaN when expected type is number', () => {
        expect(() => assertType(NaN, 'number')).toThrow(ValidationError);
      });

      it('should include descriptive error message', () => {
        try {
          assertType('hello', 'number');
          fail('Expected assertType to throw');
        } catch (error) {
          expect(error.message).toContain('Expected number');
          expect(error.message).toContain('received string');
        }
      });
    });

    describe('assertInstanceOf', () => {
      class TestClass {}
      class AnotherClass {}

      it('should not throw when value is an instance of expected class', () => {
        expect(() => assertInstanceOf(new Date(), Date)).not.toThrow();
        expect(() => assertInstanceOf(new TestClass(), TestClass)).not.toThrow();
        expect(() => assertInstanceOf(new Error(), Error)).not.toThrow();
        expect(() => assertInstanceOf([], Array)).not.toThrow();
      });

      it('should throw ValidationError when value is not an instance of expected class', () => {
        expect(() => assertInstanceOf(new TestClass(), AnotherClass)).toThrow(ValidationError);
        expect(() => assertInstanceOf({}, TestClass)).toThrow(ValidationError);
        expect(() => assertInstanceOf('hello', String)).toThrow(ValidationError); // String primitive is not instance of String
        expect(() => assertInstanceOf(123, Number)).toThrow(ValidationError); // Number primitive is not instance of Number
        expect(() => assertInstanceOf(true, Boolean)).toThrow(ValidationError); // Boolean primitive is not instance of Boolean
      });

      it('should include descriptive error message with class name', () => {
        try {
          assertInstanceOf({}, TestClass);
          fail('Expected assertInstanceOf to throw');
        } catch (error) {
          expect(error.message).toContain('Expected instance of TestClass');
          expect(error.message).toContain('received object');
        }
      });
    });

    describe('assertOneOf', () => {
      const allowedStrings = ['apple', 'banana', 'cherry'] as const;
      const allowedNumbers = [1, 2, 3] as const;

      it('should not throw when value is one of the allowed values', () => {
        expect(() => assertOneOf('apple', allowedStrings)).not.toThrow();
        expect(() => assertOneOf('banana', allowedStrings)).not.toThrow();
        expect(() => assertOneOf('cherry', allowedStrings)).not.toThrow();
        expect(() => assertOneOf(1, allowedNumbers)).not.toThrow();
        expect(() => assertOneOf(2, allowedNumbers)).not.toThrow();
        expect(() => assertOneOf(3, allowedNumbers)).not.toThrow();
      });

      it('should throw ValidationError when value is not one of the allowed values', () => {
        expect(() => assertOneOf('orange', allowedStrings)).toThrow(ValidationError);
        expect(() => assertOneOf(4, allowedNumbers)).toThrow(ValidationError);
        expect(() => assertOneOf(null, allowedStrings)).toThrow(ValidationError);
        expect(() => assertOneOf(undefined, allowedNumbers)).toThrow(ValidationError);
      });

      it('should include descriptive error message with allowed values', () => {
        try {
          assertOneOf('orange', allowedStrings);
          fail('Expected assertOneOf to throw');
        } catch (error) {
          expect(error.message).toContain('Expected one of [apple, banana, cherry]');
          expect(error.message).toContain('received orange');
        }
      });

      it('should use custom error message when provided', () => {
        const customMessage = 'Custom error message for oneOf assertion';
        try {
          assertOneOf('orange', allowedStrings, { message: customMessage });
          fail('Expected assertOneOf to throw');
        } catch (error) {
          expect(error.message).toContain(customMessage);
        }
      });
    });
  });

  // Special assertions
  describe('Special Assertions', () => {
    describe('assert', () => {
      it('should not throw when condition is true', () => {
        expect(() => assert(true, { message: 'This should not throw' })).not.toThrow();
        expect(() => assert(1 === 1, { message: 'This should not throw' })).not.toThrow();
        expect(() => assert('a' === 'a', { message: 'This should not throw' })).not.toThrow();
      });

      it('should throw ValidationError when condition is false', () => {
        expect(() => assert(false, { message: 'Condition is false' })).toThrow(ValidationError);
        expect(() => assert(1 === 2, { message: 'Numbers are not equal' })).toThrow(ValidationError);
        expect(() => assert('a' === 'b', { message: 'Strings are not equal' })).toThrow(ValidationError);
      });

      it('should use the provided error message', () => {
        const errorMessage = 'Custom assertion failed';
        try {
          assert(false, { message: errorMessage });
          fail('Expected assert to throw');
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      it('should include journey context in error when provided', () => {
        try {
          assert(false, { message: 'Assertion failed', journeyId: 'care' });
          fail('Expected assert to throw');
        } catch (error) {
          expect(error.journeyId).toBe('care');
        }
      });
    });

    describe('assertNever', () => {
      it('should always throw ValidationError', () => {
        // TypeScript would normally prevent this at compile time,
        // but we can test the runtime behavior
        expect(() => assertNever('unexpected' as never)).toThrow(ValidationError);
        expect(() => assertNever(123 as never)).toThrow(ValidationError);
        expect(() => assertNever({} as never)).toThrow(ValidationError);
      });

      it('should include the unexpected value in the error message', () => {
        try {
          assertNever('unexpected' as never);
          fail('Expected assertNever to throw');
        } catch (error) {
          expect(error.message).toContain('Unexpected value: unexpected');
        }
      });

      it('should use custom error message when provided', () => {
        const customMessage = 'Custom error message for never assertion';
        try {
          assertNever('unexpected' as never, { message: customMessage });
          fail('Expected assertNever to throw');
        } catch (error) {
          expect(error.message).toBe(customMessage);
        }
      });

      // Test for exhaustive checking in switch statements
      it('should help with exhaustive checking in switch statements', () => {
        type Fruit = 'apple' | 'banana' | 'cherry';
        
        function describeFruit(fruit: Fruit): string {
          switch (fruit) {
            case 'apple':
              return 'Red and crunchy';
            case 'banana':
              return 'Yellow and soft';
            case 'cherry':
              return 'Small and sweet';
            default:
              // This should never be reached if all cases are handled
              return assertNever(fruit);
          }
        }
        
        // Test that the function works correctly for all valid cases
        expect(describeFruit('apple')).toBe('Red and crunchy');
        expect(describeFruit('banana')).toBe('Yellow and soft');
        expect(describeFruit('cherry')).toBe('Small and sweet');
        
        // If we were to add a new case to the Fruit type without updating the switch,
        // TypeScript would catch it at compile time, but this test ensures the runtime behavior
      });
    });
  });
});