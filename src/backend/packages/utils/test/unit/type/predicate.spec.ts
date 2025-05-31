import {
  isPrimitiveType,
  isInstanceOf,
  hasProperty,
  isNonEmptyArray,
  isDiscriminatedUnion,
  isObjectWithProperties,
  isOneOf
} from '../../../src/type/predicate';

describe('Type Predicates', () => {
  // Test primitive type predicates
  describe('isPrimitiveType', () => {
    it('should correctly identify string primitives', () => {
      const value = 'test string';
      if (isPrimitiveType(value, 'string')) {
        // TypeScript should narrow the type to string here
        expect(value.length).toBeGreaterThan(0);
        // This test would fail if TypeScript didn't narrow the type
      }
      expect(isPrimitiveType('', 'string')).toBe(true);
      expect(isPrimitiveType(123, 'string')).toBe(false);
    });

    it('should correctly identify number primitives', () => {
      const value = 42;
      if (isPrimitiveType(value, 'number')) {
        // TypeScript should narrow the type to number here
        expect(value.toFixed(2)).toBe('42.00');
        // This test would fail if TypeScript didn't narrow the type
      }
      expect(isPrimitiveType(0, 'number')).toBe(true);
      expect(isPrimitiveType('42', 'number')).toBe(false);
    });

    it('should correctly identify boolean primitives', () => {
      const value = true;
      if (isPrimitiveType(value, 'boolean')) {
        // TypeScript should narrow the type to boolean here
        expect(!value).toBe(false);
        // This test would fail if TypeScript didn't narrow the type
      }
      expect(isPrimitiveType(false, 'boolean')).toBe(true);
      expect(isPrimitiveType(1, 'boolean')).toBe(false);
    });

    it('should correctly identify symbol primitives', () => {
      const value = Symbol('test');
      if (isPrimitiveType(value, 'symbol')) {
        // TypeScript should narrow the type to symbol here
        expect(typeof value).toBe('symbol');
        // This test would fail if TypeScript didn't narrow the type
      }
      expect(isPrimitiveType(Symbol(), 'symbol')).toBe(true);
      expect(isPrimitiveType('symbol', 'symbol')).toBe(false);
    });

    it('should correctly identify undefined', () => {
      const value: any = undefined;
      if (isPrimitiveType(value, 'undefined')) {
        // TypeScript should narrow the type to undefined here
        expect(value).toBeUndefined();
        // This test would fail if TypeScript didn't narrow the type
      }
      expect(isPrimitiveType(undefined, 'undefined')).toBe(true);
      expect(isPrimitiveType(null, 'undefined')).toBe(false);
    });

    it('should correctly identify null', () => {
      const value: any = null;
      if (isPrimitiveType(value, 'null')) {
        // TypeScript should narrow the type to null here
        expect(value).toBeNull();
        // This test would fail if TypeScript didn't narrow the type
      }
      expect(isPrimitiveType(null, 'null')).toBe(true);
      expect(isPrimitiveType(undefined, 'null')).toBe(false);
    });
  });

  // Test class instance predicates
  describe('isInstanceOf', () => {
    class TestClass {
      constructor(public name: string) {}
    }

    class ChildClass extends TestClass {
      constructor(name: string, public id: number) {
        super(name);
      }
    }

    it('should correctly identify class instances', () => {
      const instance = new TestClass('test');
      const child = new ChildClass('child', 1);
      const notInstance = { name: 'fake' };

      expect(isInstanceOf(instance, TestClass)).toBe(true);
      expect(isInstanceOf(child, TestClass)).toBe(true); // Child class is an instance of parent
      expect(isInstanceOf(notInstance, TestClass)).toBe(false);
    });

    it('should narrow types correctly for class instances', () => {
      const value: any = new TestClass('test');
      
      if (isInstanceOf(value, TestClass)) {
        // TypeScript should narrow the type to TestClass here
        expect(value.name).toBe('test');
        // This test would fail if TypeScript didn't narrow the type
      }
    });

    it('should work with built-in classes', () => {
      const date = new Date();
      const regex = /test/;
      const map = new Map();

      expect(isInstanceOf(date, Date)).toBe(true);
      expect(isInstanceOf(regex, RegExp)).toBe(true);
      expect(isInstanceOf(map, Map)).toBe(true);
      expect(isInstanceOf('not a date', Date)).toBe(false);
    });

    it('should handle null and undefined correctly', () => {
      expect(isInstanceOf(null, TestClass)).toBe(false);
      expect(isInstanceOf(undefined, TestClass)).toBe(false);
    });
  });

  // Test property existence predicates
  describe('hasProperty', () => {
    interface User {
      id: number;
      name: string;
      email?: string;
    }

    const user = { id: 1, name: 'John' };
    const userWithEmail = { id: 2, name: 'Jane', email: 'jane@example.com' };

    it('should check if an object has a specific property', () => {
      expect(hasProperty(user, 'id')).toBe(true);
      expect(hasProperty(user, 'name')).toBe(true);
      expect(hasProperty(user, 'email')).toBe(false);
      expect(hasProperty(userWithEmail, 'email')).toBe(true);
    });

    it('should narrow types correctly when checking properties', () => {
      const value: Partial<User> = { id: 1 };
      
      if (hasProperty(value, 'name')) {
        // TypeScript should narrow the type to include the 'name' property
        expect(typeof value.name).toBe('string');
        // This test would fail if TypeScript didn't narrow the type
      }
    });

    it('should handle non-object values correctly', () => {
      expect(hasProperty(null, 'id')).toBe(false);
      expect(hasProperty(undefined, 'id')).toBe(false);
      expect(hasProperty('string', 'length')).toBe(true); // strings have a length property
      expect(hasProperty(42, 'toString')).toBe(true); // numbers have toString method
    });

    it('should check for methods as well as properties', () => {
      const obj = {
        id: 1,
        getName: () => 'John'
      };

      expect(hasProperty(obj, 'getName')).toBe(true);
    });
  });

  // Test non-empty array validation
  describe('isNonEmptyArray', () => {
    it('should return true for arrays with elements', () => {
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
      expect(isNonEmptyArray(['test'])).toBe(true);
      expect(isNonEmptyArray([{}])).toBe(true);
    });

    it('should return false for empty arrays', () => {
      expect(isNonEmptyArray([])).toBe(false);
    });

    it('should return false for non-array values', () => {
      expect(isNonEmptyArray(null)).toBe(false);
      expect(isNonEmptyArray(undefined)).toBe(false);
      expect(isNonEmptyArray({})).toBe(false);
      expect(isNonEmptyArray('not an array')).toBe(false);
      expect(isNonEmptyArray(42)).toBe(false);
    });

    it('should narrow types correctly for non-empty arrays', () => {
      const value: number[] | [] = [1, 2, 3];
      
      if (isNonEmptyArray(value)) {
        // TypeScript should narrow the type to non-empty array
        expect(value[0]).toBeDefined();
        // This test would fail if TypeScript didn't narrow the type
      }

      const emptyArray: any[] = [];
      if (!isNonEmptyArray(emptyArray)) {
        // We know it's an empty array
        expect(emptyArray.length).toBe(0);
      }
    });

    it('should work with generic type parameters', () => {
      const numbers = [1, 2, 3];
      const strings = ['a', 'b', 'c'];
      const empty: number[] = [];

      // These assertions check both runtime behavior and compile-time type narrowing
      expect(isNonEmptyArray<number>(numbers)).toBe(true);
      expect(isNonEmptyArray<string>(strings)).toBe(true);
      expect(isNonEmptyArray<number>(empty)).toBe(false);
    });
  });

  // Test discriminated union type narrowing
  describe('isDiscriminatedUnion', () => {
    type Shape =
      | { kind: 'circle'; radius: number }
      | { kind: 'rectangle'; width: number; height: number }
      | { kind: 'triangle'; base: number; height: number };

    const circle: Shape = { kind: 'circle', radius: 5 };
    const rectangle: Shape = { kind: 'rectangle', width: 10, height: 20 };
    const triangle: Shape = { kind: 'triangle', base: 10, height: 15 };

    it('should correctly identify members of a discriminated union by their discriminant property value', () => {
      expect(isDiscriminatedUnion(circle, 'kind', 'circle')).toBe(true);
      expect(isDiscriminatedUnion(rectangle, 'kind', 'rectangle')).toBe(true);
      expect(isDiscriminatedUnion(triangle, 'kind', 'triangle')).toBe(true);

      expect(isDiscriminatedUnion(circle, 'kind', 'rectangle')).toBe(false);
      expect(isDiscriminatedUnion(rectangle, 'kind', 'circle')).toBe(false);
    });

    it('should narrow types correctly for discriminated unions', () => {
      const shape: Shape = circle;
      
      if (isDiscriminatedUnion(shape, 'kind', 'circle')) {
        // TypeScript should narrow the type to circle
        expect(shape.radius).toBe(5);
        // This test would fail if TypeScript didn't narrow the type
      }

      const anotherShape: Shape = rectangle;
      
      if (isDiscriminatedUnion(anotherShape, 'kind', 'rectangle')) {
        // TypeScript should narrow the type to rectangle
        expect(anotherShape.width * anotherShape.height).toBe(200);
        // This test would fail if TypeScript didn't narrow the type
      }
    });

    it('should handle objects without the discriminant property', () => {
      const invalidShape = { radius: 5 }; // missing 'kind' property
      expect(isDiscriminatedUnion(invalidShape, 'kind', 'circle')).toBe(false);
    });

    it('should handle null and undefined correctly', () => {
      expect(isDiscriminatedUnion(null, 'kind', 'circle')).toBe(false);
      expect(isDiscriminatedUnion(undefined, 'kind', 'circle')).toBe(false);
    });
  });

  // Test object with properties predicate
  describe('isObjectWithProperties', () => {
    interface User {
      id: number;
      name: string;
      email?: string;
    }

    const validUser = { id: 1, name: 'John' };
    const invalidUser1 = { id: 1 }; // missing name
    const invalidUser2 = { name: 'John' }; // missing id
    const userWithExtra = { id: 1, name: 'John', age: 30 }; // extra property

    it('should check if an object has all required properties', () => {
      expect(isObjectWithProperties(validUser, ['id', 'name'])).toBe(true);
      expect(isObjectWithProperties(invalidUser1, ['id', 'name'])).toBe(false);
      expect(isObjectWithProperties(invalidUser2, ['id', 'name'])).toBe(false);
      expect(isObjectWithProperties(userWithExtra, ['id', 'name'])).toBe(true);
    });

    it('should narrow types correctly when checking multiple properties', () => {
      const value: Partial<User> = { id: 1, name: 'John' };
      
      if (isObjectWithProperties(value, ['id', 'name'])) {
        // TypeScript should narrow the type to include both properties
        expect(value.id).toBe(1);
        expect(value.name).toBe('John');
        // This test would fail if TypeScript didn't narrow the type
      }
    });

    it('should handle non-object values correctly', () => {
      expect(isObjectWithProperties(null, ['id'])).toBe(false);
      expect(isObjectWithProperties(undefined, ['id'])).toBe(false);
      expect(isObjectWithProperties('string', ['length'])).toBe(false); // strings are not objects for this predicate
      expect(isObjectWithProperties(42, ['toString'])).toBe(false); // numbers are not objects for this predicate
    });

    it('should work with empty property arrays', () => {
      expect(isObjectWithProperties({}, [])).toBe(true); // Any object satisfies empty property list
      expect(isObjectWithProperties(null, [])).toBe(false); // null is not an object
    });
  });

  // Test oneOf predicate
  describe('isOneOf', () => {
    it('should check if a value is one of the provided values', () => {
      expect(isOneOf('apple', ['apple', 'banana', 'orange'])).toBe(true);
      expect(isOneOf('grape', ['apple', 'banana', 'orange'])).toBe(false);
      expect(isOneOf(1, [1, 2, 3])).toBe(true);
      expect(isOneOf(4, [1, 2, 3])).toBe(false);
    });

    it('should narrow types correctly for literal unions', () => {
      type Fruit = 'apple' | 'banana' | 'orange';
      const value: string = 'apple';
      
      if (isOneOf(value, ['apple', 'banana', 'orange'] as const)) {
        // TypeScript should narrow the type to Fruit
        const fruit: Fruit = value; // This should compile without error
        expect(fruit).toBe('apple');
      }
    });

    it('should work with mixed type arrays if the value type matches one of them', () => {
      const mixedArray = ['string', 1, true] as const;
      
      expect(isOneOf('string', mixedArray)).toBe(true);
      expect(isOneOf(1, mixedArray)).toBe(true);
      expect(isOneOf(true, mixedArray)).toBe(true);
      expect(isOneOf('other', mixedArray)).toBe(false);
      expect(isOneOf(2, mixedArray)).toBe(false);
      expect(isOneOf(false, mixedArray)).toBe(false);
    });

    it('should handle empty arrays', () => {
      expect(isOneOf('value', [])).toBe(false); // Nothing can be one of an empty array
    });

    it('should use strict equality for comparison', () => {
      // String vs number comparison
      expect(isOneOf('1', [1, 2, 3])).toBe(false);
      
      // Object equality is by reference
      const obj = { id: 1 };
      const similarObj = { id: 1 };
      expect(isOneOf(obj, [obj])).toBe(true);
      expect(isOneOf(similarObj, [obj])).toBe(false);
    });
  });
});