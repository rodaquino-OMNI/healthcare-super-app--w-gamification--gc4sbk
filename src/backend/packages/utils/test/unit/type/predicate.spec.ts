/**
 * Tests for type predicate utility functions
 * 
 * These tests validate that predicates correctly identify types at runtime and support
 * proper TypeScript type narrowing. The test suite covers predicates for primitive types,
 * complex objects, and class instances, ensuring they return the correct boolean result
 * while also providing proper type inference to the TypeScript compiler.
 */

import {
  isDefined,
  isNotNull,
  isNotUndefined,
  isNonEmptyArray,
  isArrayOfLength,
  isArrayOf,
  hasProperty,
  hasPropertyOfType,
  hasProperties,
  isInstanceOf,
  isInstanceOfAny,
  isFilterDto,
  isPaginationDto,
  isSortDto,
  isOneOf,
  isOneOfType,
  hasDiscriminator
} from '../../../src/type/predicate';

// Mock DTOs for testing
const mockFilterDto = { where: { id: 1 } };
const mockPaginationDto = { page: 1, limit: 10 };
const mockSortDto = { orderBy: { createdAt: 'desc' } };

describe('Type Predicate Functions', () => {
  // Basic Type Predicates
  describe('Basic Type Predicates', () => {
    describe('isDefined', () => {
      it('should return true for defined values', () => {
        expect(isDefined('')).toBe(true);
        expect(isDefined(0)).toBe(true);
        expect(isDefined(false)).toBe(true);
        expect(isDefined({})).toBe(true);
        expect(isDefined([])).toBe(true);
        expect(isDefined(() => {})).toBe(true);
      });

      it('should return false for null or undefined values', () => {
        expect(isDefined(null)).toBe(false);
        expect(isDefined(undefined)).toBe(false);
        let undefinedVar;
        expect(isDefined(undefinedVar)).toBe(false);
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const processValue = (value: string | null | undefined): string => {
          if (isDefined(value)) {
            // TypeScript should know that value is string here
            return value.toUpperCase();
          }
          return '';
        };

        expect(processValue('hello')).toBe('HELLO');
        expect(processValue(null)).toBe('');
        expect(processValue(undefined)).toBe('');
      });
    });

    describe('isNotNull', () => {
      it('should return true for non-null values', () => {
        expect(isNotNull('')).toBe(true);
        expect(isNotNull(0)).toBe(true);
        expect(isNotNull(false)).toBe(true);
        expect(isNotNull({})).toBe(true);
        expect(isNotNull([])).toBe(true);
        expect(isNotNull(() => {})).toBe(true);
        expect(isNotNull(undefined)).toBe(true);
      });

      it('should return false for null values', () => {
        expect(isNotNull(null)).toBe(false);
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const processValue = (value: string | null): string => {
          if (isNotNull(value)) {
            // TypeScript should know that value is string here
            return value.toUpperCase();
          }
          return '';
        };

        expect(processValue('hello')).toBe('HELLO');
        expect(processValue(null)).toBe('');
      });
    });

    describe('isNotUndefined', () => {
      it('should return true for non-undefined values', () => {
        expect(isNotUndefined('')).toBe(true);
        expect(isNotUndefined(0)).toBe(true);
        expect(isNotUndefined(false)).toBe(true);
        expect(isNotUndefined({})).toBe(true);
        expect(isNotUndefined([])).toBe(true);
        expect(isNotUndefined(() => {})).toBe(true);
        expect(isNotUndefined(null)).toBe(true);
      });

      it('should return false for undefined values', () => {
        expect(isNotUndefined(undefined)).toBe(false);
        let undefinedVar;
        expect(isNotUndefined(undefinedVar)).toBe(false);
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const processValue = (value: string | undefined): string => {
          if (isNotUndefined(value)) {
            // TypeScript should know that value is string here
            return value.toUpperCase();
          }
          return '';
        };

        expect(processValue('hello')).toBe('HELLO');
        expect(processValue(undefined)).toBe('');
      });
    });
  });

  // Array Type Predicates
  describe('Array Type Predicates', () => {
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

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const processItems = <T>(items: T[]): T | null => {
          if (isNonEmptyArray(items)) {
            // TypeScript should know that items is a non-empty array here
            // and items[0] is safe to access
            return items[0];
          }
          return null;
        };

        expect(processItems([1, 2, 3])).toBe(1);
        expect(processItems([])).toBe(null);
      });
    });

    describe('isArrayOfLength', () => {
      it('should return true for arrays with the specified length', () => {
        expect(isArrayOfLength([], 0)).toBe(true);
        expect(isArrayOfLength([1], 1)).toBe(true);
        expect(isArrayOfLength([1, 2], 2)).toBe(true);
        expect(isArrayOfLength([1, 2, 3], 3)).toBe(true);
      });

      it('should return false for arrays with different length', () => {
        expect(isArrayOfLength([], 1)).toBe(false);
        expect(isArrayOfLength([1], 0)).toBe(false);
        expect(isArrayOfLength([1, 2], 3)).toBe(false);
        expect(isArrayOfLength([1, 2, 3], 2)).toBe(false);
      });

      it('should return false for non-array values', () => {
        expect(isArrayOfLength({}, 0)).toBe(false);
        expect(isArrayOfLength('', 0)).toBe(false);
        expect(isArrayOfLength('abc', 3)).toBe(false);
        expect(isArrayOfLength(123, 0)).toBe(false);
        expect(isArrayOfLength(true, 0)).toBe(false);
        expect(isArrayOfLength(null, 0)).toBe(false);
        expect(isArrayOfLength(undefined, 0)).toBe(false);
        expect(isArrayOfLength(() => {}, 0)).toBe(false);
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const processCoordinates = (coords: number[]): { x: number, y: number } | null => {
          if (isArrayOfLength(coords, 2)) {
            // TypeScript should know that coords has exactly 2 elements
            const [x, y] = coords; // Safe destructuring
            return { x, y };
          }
          return null;
        };

        expect(processCoordinates([10, 20])).toEqual({ x: 10, y: 20 });
        expect(processCoordinates([10])).toBe(null);
        expect(processCoordinates([10, 20, 30])).toBe(null);
      });
    });

    describe('isArrayOf', () => {
      // Helper predicates for testing
      const isString = (value: unknown): value is string => typeof value === 'string';
      const isNumber = (value: unknown): value is number => typeof value === 'number' && !isNaN(value);

      it('should return true for arrays where all elements satisfy the predicate', () => {
        expect(isArrayOf([1, 2, 3], isNumber)).toBe(true);
        expect(isArrayOf(['a', 'b', 'c'], isString)).toBe(true);
        expect(isArrayOf([], isString)).toBe(true); // Empty arrays always return true
      });

      it('should return false for arrays where some elements do not satisfy the predicate', () => {
        expect(isArrayOf([1, '2', 3], isNumber)).toBe(false);
        expect(isArrayOf(['a', 2, 'c'], isString)).toBe(false);
      });

      it('should return false for non-array values', () => {
        expect(isArrayOf({}, isNumber)).toBe(false);
        expect(isArrayOf('abc', isString)).toBe(false);
        expect(isArrayOf(123, isNumber)).toBe(false);
        expect(isArrayOf(null, isString)).toBe(false);
        expect(isArrayOf(undefined, isString)).toBe(false);
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const processItems = (items: unknown[]): string[] => {
          if (isArrayOf(items, isString)) {
            // TypeScript should know that items is string[] here
            return items.map(item => item.toUpperCase());
          }
          return [];
        };

        expect(processItems(['a', 'b', 'c'])).toEqual(['A', 'B', 'C']);
        expect(processItems([1, 2, 3])).toEqual([]);
        expect(processItems(['a', 2, 'c'])).toEqual([]);
      });
    });
  });

  // Object Type Predicates
  describe('Object Type Predicates', () => {
    describe('hasProperty', () => {
      it('should return true for objects with the specified property', () => {
        expect(hasProperty({ name: 'John' }, 'name')).toBe(true);
        expect(hasProperty({ name: '' }, 'name')).toBe(true);
        expect(hasProperty({ name: null }, 'name')).toBe(true);
        expect(hasProperty({ name: undefined }, 'name')).toBe(true);
        expect(hasProperty({ 'complex-key': true }, 'complex-key')).toBe(true);
      });

      it('should return false for objects without the specified property', () => {
        expect(hasProperty({}, 'name')).toBe(false);
        expect(hasProperty({ age: 30 }, 'name')).toBe(false);
        expect(hasProperty(Object.create(null), 'name')).toBe(false);
      });

      it('should return false for non-object values', () => {
        expect(hasProperty([], 'length')).toBe(true); // Arrays are objects
        expect(hasProperty('abc', 'length')).toBe(false);
        expect(hasProperty(123, 'toString')).toBe(false);
        expect(hasProperty(true, 'valueOf')).toBe(false);
        expect(hasProperty(null, 'name')).toBe(false);
        expect(hasProperty(undefined, 'name')).toBe(false);
        expect(hasProperty(() => {}, 'name')).toBe(true); // Functions are objects
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const processUser = (user: unknown): string => {
          if (hasProperty(user, 'name')) {
            // TypeScript should know that user has a 'name' property here
            return `User: ${String(user.name)}`;
          }
          return 'Unknown user';
        };

        expect(processUser({ name: 'John' })).toBe('User: John');
        expect(processUser({ age: 30 })).toBe('Unknown user');
        expect(processUser(null)).toBe('Unknown user');
      });
    });

    describe('hasPropertyOfType', () => {
      // Helper predicates for testing
      const isString = (value: unknown): value is string => typeof value === 'string';
      const isNumber = (value: unknown): value is number => typeof value === 'number' && !isNaN(value);

      it('should return true for objects with the specified property of the correct type', () => {
        expect(hasPropertyOfType({ name: 'John' }, 'name', isString)).toBe(true);
        expect(hasPropertyOfType({ age: 30 }, 'age', isNumber)).toBe(true);
        expect(hasPropertyOfType({ active: true }, 'active', Boolean)).toBe(true);
      });

      it('should return false for objects with the specified property of the wrong type', () => {
        expect(hasPropertyOfType({ name: 123 }, 'name', isString)).toBe(false);
        expect(hasPropertyOfType({ age: '30' }, 'age', isNumber)).toBe(false);
        expect(hasPropertyOfType({ active: 1 }, 'active', Boolean)).toBe(false);
      });

      it('should return false for objects without the specified property', () => {
        expect(hasPropertyOfType({}, 'name', isString)).toBe(false);
        expect(hasPropertyOfType({ name: 'John' }, 'age', isNumber)).toBe(false);
      });

      it('should return false for non-object values', () => {
        expect(hasPropertyOfType('abc', 'length', isNumber)).toBe(false);
        expect(hasPropertyOfType(123, 'toString', Function)).toBe(false);
        expect(hasPropertyOfType(null, 'name', isString)).toBe(false);
        expect(hasPropertyOfType(undefined, 'name', isString)).toBe(false);
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const processUser = (user: unknown): string => {
          if (hasPropertyOfType(user, 'name', isString)) {
            // TypeScript should know that user has a 'name' property of type string here
            return `User: ${user.name.toUpperCase()}`;
          }
          return 'Unknown user';
        };

        expect(processUser({ name: 'John' })).toBe('User: JOHN');
        expect(processUser({ name: 123 })).toBe('Unknown user');
        expect(processUser({ age: 30 })).toBe('Unknown user');
        expect(processUser(null)).toBe('Unknown user');
      });
    });

    describe('hasProperties', () => {
      it('should return true for objects with all the specified properties', () => {
        expect(hasProperties({ name: 'John', age: 30 }, ['name', 'age'])).toBe(true);
        expect(hasProperties({ name: 'John', age: 30, email: 'john@example.com' }, ['name', 'age'])).toBe(true);
        expect(hasProperties({ name: '', age: 0 }, ['name', 'age'])).toBe(true);
        expect(hasProperties({ name: null, age: undefined }, ['name', 'age'])).toBe(true);
      });

      it('should return false for objects missing some of the specified properties', () => {
        expect(hasProperties({}, ['name'])).toBe(false);
        expect(hasProperties({ name: 'John' }, ['name', 'age'])).toBe(false);
        expect(hasProperties({ age: 30 }, ['name', 'age'])).toBe(false);
      });

      it('should return false for non-object values', () => {
        expect(hasProperties([], ['length'])).toBe(true); // Arrays are objects
        expect(hasProperties('abc', ['length'])).toBe(false);
        expect(hasProperties(123, ['toString'])).toBe(false);
        expect(hasProperties(null, ['name'])).toBe(false);
        expect(hasProperties(undefined, ['name'])).toBe(false);
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const processUser = (user: unknown): string => {
          if (hasProperties(user, ['name', 'age', 'email'])) {
            // TypeScript should know that user has 'name', 'age', and 'email' properties here
            return `${String(user.name)} (${String(user.age)}): ${String(user.email)}`;
          }
          return 'Incomplete user data';
        };

        expect(processUser({ name: 'John', age: 30, email: 'john@example.com' }))
          .toBe('John (30): john@example.com');
        expect(processUser({ name: 'John', age: 30 }))
          .toBe('Incomplete user data');
        expect(processUser(null))
          .toBe('Incomplete user data');
      });
    });
  });

  // Class Instance Type Predicates
  describe('Class Instance Type Predicates', () => {
    // Test classes
    class Person {
      constructor(public name: string) {}
    }

    class Employee extends Person {
      constructor(name: string, public department: string) {
        super(name);
      }
    }

    class Product {
      constructor(public id: string) {}
    }

    describe('isInstanceOf', () => {
      it('should return true for instances of the specified class', () => {
        expect(isInstanceOf(new Person('John'), Person)).toBe(true);
        expect(isInstanceOf(new Employee('John', 'IT'), Employee)).toBe(true);
        expect(isInstanceOf(new Employee('John', 'IT'), Person)).toBe(true); // Inheritance
        expect(isInstanceOf(new Product('P001'), Product)).toBe(true);
      });

      it('should return false for instances of different classes', () => {
        expect(isInstanceOf(new Person('John'), Product)).toBe(false);
        expect(isInstanceOf(new Product('P001'), Person)).toBe(false);
        expect(isInstanceOf(new Person('John'), Employee)).toBe(false); // Parent is not instance of child
      });

      it('should return false for non-class-instance values', () => {
        expect(isInstanceOf({}, Object)).toBe(true); // Plain objects are instances of Object
        expect(isInstanceOf([], Array)).toBe(true); // Arrays are instances of Array
        expect(isInstanceOf('abc', String)).toBe(false); // Primitive string is not instance of String
        expect(isInstanceOf(123, Number)).toBe(false); // Primitive number is not instance of Number
        expect(isInstanceOf(true, Boolean)).toBe(false); // Primitive boolean is not instance of Boolean
        expect(isInstanceOf(null, Object)).toBe(false);
        expect(isInstanceOf(undefined, Object)).toBe(false);
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const processEntity = (entity: unknown): string => {
          if (isInstanceOf(entity, Person)) {
            // TypeScript should know that entity is a Person instance here
            return `Person: ${entity.name}`;
          }
          if (isInstanceOf(entity, Product)) {
            // TypeScript should know that entity is a Product instance here
            return `Product: ${entity.id}`;
          }
          return 'Unknown entity';
        };

        expect(processEntity(new Person('John'))).toBe('Person: John');
        expect(processEntity(new Employee('John', 'IT'))).toBe('Person: John'); // Employee is a Person
        expect(processEntity(new Product('P001'))).toBe('Product: P001');
        expect(processEntity({})).toBe('Unknown entity');
        expect(processEntity(null)).toBe('Unknown entity');
      });
    });

    describe('isInstanceOfAny', () => {
      it('should return true for instances of any of the specified classes', () => {
        expect(isInstanceOfAny(new Person('John'), [Person, Product])).toBe(true);
        expect(isInstanceOfAny(new Product('P001'), [Person, Product])).toBe(true);
        expect(isInstanceOfAny(new Employee('John', 'IT'), [Person, Product])).toBe(true); // Inheritance
      });

      it('should return false for instances of none of the specified classes', () => {
        class OtherClass {}
        expect(isInstanceOfAny(new OtherClass(), [Person, Product])).toBe(false);
        expect(isInstanceOfAny({}, [Person, Product])).toBe(false);
        expect(isInstanceOfAny([], [Person, Product])).toBe(false);
      });

      it('should return false for non-class-instance values', () => {
        expect(isInstanceOfAny('abc', [String, Number])).toBe(false); // Primitive string is not instance of String
        expect(isInstanceOfAny(123, [String, Number])).toBe(false); // Primitive number is not instance of Number
        expect(isInstanceOfAny(null, [Person, Product])).toBe(false);
        expect(isInstanceOfAny(undefined, [Person, Product])).toBe(false);
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        type Entity = Person | Product;
        
        const processEntity = (entity: unknown): string => {
          if (isInstanceOfAny<Entity>(entity, [Person, Product])) {
            // TypeScript should know that entity is either Person or Product here
            if (entity instanceof Person) {
              return `Person: ${entity.name}`;
            } else {
              return `Product: ${entity.id}`;
            }
          }
          return 'Unknown entity';
        };

        expect(processEntity(new Person('John'))).toBe('Person: John');
        expect(processEntity(new Product('P001'))).toBe('Product: P001');
        expect(processEntity({})).toBe('Unknown entity');
        expect(processEntity(null)).toBe('Unknown entity');
      });
    });
  });

  // Journey-Specific Type Predicates
  describe('Journey-Specific Type Predicates', () => {
    describe('isFilterDto', () => {
      it('should return true for valid FilterDto objects', () => {
        expect(isFilterDto({ where: { id: 1 } })).toBe(true);
        expect(isFilterDto({ include: { user: true } })).toBe(true);
        expect(isFilterDto({ select: { name: true } })).toBe(true);
        expect(isFilterDto({ where: { id: 1 }, include: { user: true } })).toBe(true);
      });

      it('should return false for invalid FilterDto objects', () => {
        expect(isFilterDto({})).toBe(false);
        expect(isFilterDto({ other: 'property' })).toBe(false);
      });

      it('should return false for non-object values', () => {
        expect(isFilterDto([])).toBe(false);
        expect(isFilterDto('')).toBe(false);
        expect(isFilterDto(123)).toBe(false);
        expect(isFilterDto(null)).toBe(false);
        expect(isFilterDto(undefined)).toBe(false);
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const processQuery = (query: unknown): string => {
          if (isFilterDto(query)) {
            // TypeScript should know that query is a FilterDto here
            return 'Processing filter query';
          }
          return 'Invalid query';
        };

        expect(processQuery(mockFilterDto)).toBe('Processing filter query');
        expect(processQuery({})).toBe('Invalid query');
        expect(processQuery(null)).toBe('Invalid query');
      });
    });

    describe('isPaginationDto', () => {
      it('should return true for valid PaginationDto objects with page/limit', () => {
        expect(isPaginationDto({ page: 1, limit: 10 })).toBe(true);
        expect(isPaginationDto({ page: 0, limit: 5 })).toBe(true);
      });

      it('should return true for valid PaginationDto objects with cursor', () => {
        expect(isPaginationDto({ cursor: 'abc123' })).toBe(true);
        expect(isPaginationDto({ cursor: '' })).toBe(true);
      });

      it('should return false for invalid PaginationDto objects', () => {
        expect(isPaginationDto({})).toBe(false);
        expect(isPaginationDto({ page: 1 })).toBe(false); // Missing limit
        expect(isPaginationDto({ limit: 10 })).toBe(false); // Missing page
        expect(isPaginationDto({ other: 'property' })).toBe(false);
      });

      it('should return false for non-object values', () => {
        expect(isPaginationDto([])).toBe(false);
        expect(isPaginationDto('')).toBe(false);
        expect(isPaginationDto(123)).toBe(false);
        expect(isPaginationDto(null)).toBe(false);
        expect(isPaginationDto(undefined)).toBe(false);
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const processQuery = (query: unknown): string => {
          if (isPaginationDto(query)) {
            // TypeScript should know that query is a PaginationDto here
            return 'Processing pagination query';
          }
          return 'Invalid query';
        };

        expect(processQuery(mockPaginationDto)).toBe('Processing pagination query');
        expect(processQuery({})).toBe('Invalid query');
        expect(processQuery(null)).toBe('Invalid query');
      });
    });

    describe('isSortDto', () => {
      it('should return true for valid SortDto objects', () => {
        expect(isSortDto({ orderBy: { createdAt: 'desc' } })).toBe(true);
        expect(isSortDto({ orderBy: { name: 'asc', id: 'desc' } })).toBe(true);
      });

      it('should return false for invalid SortDto objects', () => {
        expect(isSortDto({})).toBe(false);
        expect(isSortDto({ orderBy: null })).toBe(false);
        expect(isSortDto({ orderBy: 'createdAt' })).toBe(false); // orderBy should be an object
        expect(isSortDto({ other: 'property' })).toBe(false);
      });

      it('should return false for non-object values', () => {
        expect(isSortDto([])).toBe(false);
        expect(isSortDto('')).toBe(false);
        expect(isSortDto(123)).toBe(false);
        expect(isSortDto(null)).toBe(false);
        expect(isSortDto(undefined)).toBe(false);
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const processQuery = (query: unknown): string => {
          if (isSortDto(query)) {
            // TypeScript should know that query is a SortDto here
            return 'Processing sort query';
          }
          return 'Invalid query';
        };

        expect(processQuery(mockSortDto)).toBe('Processing sort query');
        expect(processQuery({})).toBe('Invalid query');
        expect(processQuery(null)).toBe('Invalid query');
      });
    });
  });

  // Union Type Predicates
  describe('Union Type Predicates', () => {
    describe('isOneOf', () => {
      it('should return true for values that are one of the specified values', () => {
        expect(isOneOf('pending', ['pending', 'active', 'completed'] as const)).toBe(true);
        expect(isOneOf('active', ['pending', 'active', 'completed'] as const)).toBe(true);
        expect(isOneOf('completed', ['pending', 'active', 'completed'] as const)).toBe(true);
        expect(isOneOf(1, [1, 2, 3] as const)).toBe(true);
      });

      it('should return false for values that are not one of the specified values', () => {
        expect(isOneOf('cancelled', ['pending', 'active', 'completed'] as const)).toBe(false);
        expect(isOneOf('PENDING', ['pending', 'active', 'completed'] as const)).toBe(false); // Case sensitive
        expect(isOneOf(4, [1, 2, 3] as const)).toBe(false);
        expect(isOneOf('1', [1, 2, 3] as const)).toBe(false); // Type sensitive
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        type Status = 'pending' | 'active' | 'completed';
        
        const processStatus = (status: string): string => {
          if (isOneOf(status, ['pending', 'active', 'completed'] as const)) {
            // TypeScript should know that status is a Status here
            const statusMap: Record<Status, string> = {
              pending: 'Status is pending',
              active: 'Status is active',
              completed: 'Status is completed'
            };
            return statusMap[status];
          }
          return 'Invalid status';
        };

        expect(processStatus('pending')).toBe('Status is pending');
        expect(processStatus('active')).toBe('Status is active');
        expect(processStatus('completed')).toBe('Status is completed');
        expect(processStatus('cancelled')).toBe('Invalid status');
      });
    });

    describe('isOneOfType', () => {
      // Helper predicates for testing
      const isString = (value: unknown): value is string => typeof value === 'string';
      const isNumber = (value: unknown): value is number => typeof value === 'number' && !isNaN(value);

      it('should return true for values that match one of the specified predicates', () => {
        expect(isOneOfType('hello', [isString, isNumber])).toBe(true);
        expect(isOneOfType(123, [isString, isNumber])).toBe(true);
      });

      it('should return false for values that do not match any of the specified predicates', () => {
        expect(isOneOfType(true, [isString, isNumber])).toBe(false);
        expect(isOneOfType(null, [isString, isNumber])).toBe(false);
        expect(isOneOfType(undefined, [isString, isNumber])).toBe(false);
        expect(isOneOfType({}, [isString, isNumber])).toBe(false);
        expect(isOneOfType([], [isString, isNumber])).toBe(false);
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const processValue = (value: unknown): string => {
          if (isOneOfType(value, [isString, isNumber])) {
            // TypeScript should know that value is string | number here
            return value.toString();
          }
          return 'Invalid value';
        };

        expect(processValue('hello')).toBe('hello');
        expect(processValue(123)).toBe('123');
        expect(processValue(true)).toBe('Invalid value');
        expect(processValue(null)).toBe('Invalid value');
      });
    });
  });

  // Discriminated Union Type Predicates
  describe('Discriminated Union Type Predicates', () => {
    // Test discriminated union types
    type Circle = { kind: 'circle'; radius: number };
    type Rectangle = { kind: 'rectangle'; width: number; height: number };
    type Triangle = { kind: 'triangle'; base: number; height: number };
    type Shape = Circle | Rectangle | Triangle;

    const circle: Shape = { kind: 'circle', radius: 5 };
    const rectangle: Shape = { kind: 'rectangle', width: 10, height: 20 };
    const triangle: Shape = { kind: 'triangle', base: 10, height: 15 };

    describe('hasDiscriminator', () => {
      it('should return true for objects with the specified discriminator value', () => {
        expect(hasDiscriminator(circle, 'kind', 'circle')).toBe(true);
        expect(hasDiscriminator(rectangle, 'kind', 'rectangle')).toBe(true);
        expect(hasDiscriminator(triangle, 'kind', 'triangle')).toBe(true);
      });

      it('should return false for objects with a different discriminator value', () => {
        expect(hasDiscriminator(circle, 'kind', 'rectangle')).toBe(false);
        expect(hasDiscriminator(rectangle, 'kind', 'circle')).toBe(false);
        expect(hasDiscriminator(triangle, 'kind', 'circle')).toBe(false);
      });

      it('should properly narrow types in TypeScript', () => {
        // This test validates type narrowing at compile time
        const calculateArea = (shape: Shape): number => {
          if (hasDiscriminator(shape, 'kind', 'circle')) {
            // TypeScript should know that shape is Circle here
            return Math.PI * shape.radius * shape.radius;
          }
          if (hasDiscriminator(shape, 'kind', 'rectangle')) {
            // TypeScript should know that shape is Rectangle here
            return shape.width * shape.height;
          }
          if (hasDiscriminator(shape, 'kind', 'triangle')) {
            // TypeScript should know that shape is Triangle here
            return 0.5 * shape.base * shape.height;
          }
          return 0;
        };

        expect(calculateArea(circle)).toBeCloseTo(Math.PI * 25);
        expect(calculateArea(rectangle)).toBe(200);
        expect(calculateArea(triangle)).toBe(75);
      });

      it('should work with complex discriminated unions', () => {
        // More complex discriminated union with nested properties
        type UserEvent = 
          | { type: 'login'; userId: string; timestamp: number }
          | { type: 'logout'; userId: string; timestamp: number }
          | { type: 'purchase'; userId: string; productId: string; amount: number; timestamp: number };

        const loginEvent: UserEvent = { type: 'login', userId: 'user123', timestamp: Date.now() };
        const purchaseEvent: UserEvent = { 
          type: 'purchase', 
          userId: 'user123', 
          productId: 'prod456', 
          amount: 99.99, 
          timestamp: Date.now() 
        };

        expect(hasDiscriminator(loginEvent, 'type', 'login')).toBe(true);
        expect(hasDiscriminator(purchaseEvent, 'type', 'purchase')).toBe(true);
        expect(hasDiscriminator(loginEvent, 'type', 'purchase')).toBe(false);

        // Type narrowing test
        const processEvent = (event: UserEvent): string => {
          if (hasDiscriminator(event, 'type', 'purchase')) {
            // TypeScript should know that event is a purchase event here
            return `User ${event.userId} purchased product ${event.productId} for $${event.amount}`;
          }
          return `User ${event.userId} performed ${event.type}`;
        };

        expect(processEvent(loginEvent)).toBe('User user123 performed login');
        expect(processEvent(purchaseEvent)).toContain('purchased product prod456 for $99.99');
      });
    });
  });
});