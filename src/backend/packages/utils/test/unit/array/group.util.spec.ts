import { groupBy, partitionBy, keyBy } from '../../../src/array/group.util';

describe('Array Group Utilities', () => {
  describe('groupBy', () => {
    // Test grouping by string key
    it('should group array elements by string key', () => {
      const users = [
        { id: 1, role: 'admin', name: 'Alice' },
        { id: 2, role: 'user', name: 'Bob' },
        { id: 3, role: 'admin', name: 'Charlie' },
        { id: 4, role: 'user', name: 'Dave' },
      ];

      const result = groupBy(users, 'role');

      expect(result).toEqual({
        admin: [
          { id: 1, role: 'admin', name: 'Alice' },
          { id: 3, role: 'admin', name: 'Charlie' },
        ],
        user: [
          { id: 2, role: 'user', name: 'Bob' },
          { id: 4, role: 'user', name: 'Dave' },
        ],
      });
    });

    // Test grouping by selector function
    it('should group array elements by selector function', () => {
      const numbers = [1, 2, 3, 4, 5, 6];

      const result = groupBy(numbers, (num) => (num % 2 === 0 ? 'even' : 'odd'));

      expect(result).toEqual({
        even: [2, 4, 6],
        odd: [1, 3, 5],
      });
    });

    // Test grouping with nested properties
    it('should group array elements by nested property path', () => {
      const users = [
        { id: 1, profile: { department: 'engineering', level: 'senior' } },
        { id: 2, profile: { department: 'marketing', level: 'junior' } },
        { id: 3, profile: { department: 'engineering', level: 'mid' } },
        { id: 4, profile: { department: 'marketing', level: 'senior' } },
      ];

      const result = groupBy(users, 'profile.department');

      expect(result).toEqual({
        engineering: [
          { id: 1, profile: { department: 'engineering', level: 'senior' } },
          { id: 3, profile: { department: 'engineering', level: 'mid' } },
        ],
        marketing: [
          { id: 2, profile: { department: 'marketing', level: 'junior' } },
          { id: 4, profile: { department: 'marketing', level: 'senior' } },
        ],
      });
    });

    // Test grouping with complex selector function
    it('should group array elements by complex selector function', () => {
      const dates = [
        new Date('2023-01-15'),
        new Date('2023-02-20'),
        new Date('2023-01-25'),
        new Date('2023-03-10'),
        new Date('2023-02-05'),
      ];

      const result = groupBy(dates, (date) => date.getMonth() + 1); // Month is 0-indexed

      expect(result).toEqual({
        1: [new Date('2023-01-15'), new Date('2023-01-25')],
        2: [new Date('2023-02-20'), new Date('2023-02-05')],
        3: [new Date('2023-03-10')],
      });
    });

    // Test with empty array
    it('should return empty object when given an empty array', () => {
      const result = groupBy([], 'key');
      expect(result).toEqual({});
    });

    // Test with undefined/null values
    it('should handle undefined and null values gracefully', () => {
      const items = [
        { id: 1, category: 'A' },
        { id: 2, category: undefined },
        { id: 3, category: null },
        { id: 4, category: 'B' },
      ];

      const result = groupBy(items, 'category');

      expect(result).toEqual({
        A: [{ id: 1, category: 'A' }],
        B: [{ id: 4, category: 'B' }],
        undefined: [{ id: 2, category: undefined }, { id: 3, category: null }],
      });
    });

    // Test with non-existent key
    it('should handle non-existent keys by grouping under undefined', () => {
      const items = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      const result = groupBy(items, 'nonExistentKey');

      expect(result).toEqual({
        undefined: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      });
    });

    // Test with mixed data types
    it('should handle mixed data types as keys', () => {
      const items = [
        { id: 1, value: true },
        { id: 2, value: 42 },
        { id: 3, value: 'string' },
        { id: 4, value: false },
      ];

      const result = groupBy(items, 'value');

      expect(result).toEqual({
        true: [{ id: 1, value: true }],
        42: [{ id: 2, value: 42 }],
        string: [{ id: 3, value: 'string' }],
        false: [{ id: 4, value: false }],
      });
    });

    // Test with invalid inputs
    it('should throw error when input is not an array', () => {
      // @ts-expect-error Testing invalid input
      expect(() => groupBy('not an array', 'key')).toThrow();
      // @ts-expect-error Testing invalid input
      expect(() => groupBy(null, 'key')).toThrow();
      // @ts-expect-error Testing invalid input
      expect(() => groupBy(undefined, 'key')).toThrow();
    });

    it('should throw error when key is not a string or function', () => {
      // @ts-expect-error Testing invalid input
      expect(() => groupBy([1, 2, 3], 123)).toThrow();
      // @ts-expect-error Testing invalid input
      expect(() => groupBy([1, 2, 3], null)).toThrow();
      // @ts-expect-error Testing invalid input
      expect(() => groupBy([1, 2, 3], undefined)).toThrow();
    });
  });

  describe('partitionBy', () => {
    // Test basic partitioning
    it('should partition array into two groups based on predicate', () => {
      const numbers = [1, 2, 3, 4, 5, 6];

      const [evens, odds] = partitionBy(numbers, (num) => num % 2 === 0);

      expect(evens).toEqual([2, 4, 6]);
      expect(odds).toEqual([1, 3, 5]);
    });

    // Test with objects
    it('should partition array of objects based on property condition', () => {
      const users = [
        { id: 1, active: true, name: 'Alice' },
        { id: 2, active: false, name: 'Bob' },
        { id: 3, active: true, name: 'Charlie' },
        { id: 4, active: false, name: 'Dave' },
      ];

      const [activeUsers, inactiveUsers] = partitionBy(users, (user) => user.active);

      expect(activeUsers).toEqual([
        { id: 1, active: true, name: 'Alice' },
        { id: 3, active: true, name: 'Charlie' },
      ]);

      expect(inactiveUsers).toEqual([
        { id: 2, active: false, name: 'Bob' },
        { id: 4, active: false, name: 'Dave' },
      ]);
    });

    // Test with complex predicate
    it('should partition array based on complex predicate', () => {
      const items = [
        { id: 1, value: 10, category: 'A' },
        { id: 2, value: 20, category: 'B' },
        { id: 3, value: 15, category: 'A' },
        { id: 4, value: 25, category: 'C' },
        { id: 5, value: 5, category: 'B' },
      ];

      const [highValueItems, lowValueItems] = partitionBy(
        items,
        (item) => item.value > 15 && item.category !== 'C'
      );

      expect(highValueItems).toEqual([{ id: 2, value: 20, category: 'B' }]);

      expect(lowValueItems).toEqual([
        { id: 1, value: 10, category: 'A' },
        { id: 3, value: 15, category: 'A' },
        { id: 4, value: 25, category: 'C' },
        { id: 5, value: 5, category: 'B' },
      ]);
    });

    // Test with empty array
    it('should return two empty arrays when given an empty array', () => {
      const [passing, failing] = partitionBy([], () => true);

      expect(passing).toEqual([]);
      expect(failing).toEqual([]);
    });

    // Test with all elements passing
    it('should handle case where all elements pass the predicate', () => {
      const numbers = [2, 4, 6, 8, 10];

      const [evens, odds] = partitionBy(numbers, (num) => num % 2 === 0);

      expect(evens).toEqual([2, 4, 6, 8, 10]);
      expect(odds).toEqual([]);
    });

    // Test with all elements failing
    it('should handle case where all elements fail the predicate', () => {
      const numbers = [1, 3, 5, 7, 9];

      const [evens, odds] = partitionBy(numbers, (num) => num % 2 === 0);

      expect(evens).toEqual([]);
      expect(odds).toEqual([1, 3, 5, 7, 9]);
    });

    // Test with undefined/null values
    it('should handle undefined and null values in the array', () => {
      const items = [1, undefined, 3, null, 5];

      const [defined, undefined_or_null] = partitionBy(items, (item) => item !== undefined && item !== null);

      expect(defined).toEqual([1, 3, 5]);
      expect(undefined_or_null).toEqual([undefined, null]);
    });

    // Test with invalid inputs
    it('should throw error when input is not an array', () => {
      // @ts-expect-error Testing invalid input
      expect(() => partitionBy('not an array', () => true)).toThrow();
      // @ts-expect-error Testing invalid input
      expect(() => partitionBy(null, () => true)).toThrow();
      // @ts-expect-error Testing invalid input
      expect(() => partitionBy(undefined, () => true)).toThrow();
    });

    it('should throw error when predicate is not a function', () => {
      // @ts-expect-error Testing invalid input
      expect(() => partitionBy([1, 2, 3], 'not a function')).toThrow();
      // @ts-expect-error Testing invalid input
      expect(() => partitionBy([1, 2, 3], null)).toThrow();
      // @ts-expect-error Testing invalid input
      expect(() => partitionBy([1, 2, 3], undefined)).toThrow();
    });
  });

  describe('keyBy', () => {
    // Test with string key
    it('should create lookup object with string key', () => {
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ];

      const result = keyBy(users, 'id');

      expect(result).toEqual({
        1: { id: 1, name: 'Alice' },
        2: { id: 2, name: 'Bob' },
        3: { id: 3, name: 'Charlie' },
      });
    });

    // Test with selector function
    it('should create lookup object with selector function', () => {
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ];

      const result = keyBy(users, (user) => user.name.toLowerCase());

      expect(result).toEqual({
        alice: { id: 1, name: 'Alice' },
        bob: { id: 2, name: 'Bob' },
        charlie: { id: 3, name: 'Charlie' },
      });
    });

    // Test with nested property path
    it('should create lookup object with nested property path', () => {
      const users = [
        { id: 1, profile: { username: 'alice123' } },
        { id: 2, profile: { username: 'bob456' } },
        { id: 3, profile: { username: 'charlie789' } },
      ];

      const result = keyBy(users, 'profile.username');

      expect(result).toEqual({
        alice123: { id: 1, profile: { username: 'alice123' } },
        bob456: { id: 2, profile: { username: 'bob456' } },
        charlie789: { id: 3, profile: { username: 'charlie789' } },
      });
    });

    // Test with duplicate keys
    it('should handle duplicate keys by using the last occurrence', () => {
      const users = [
        { id: 1, role: 'admin' },
        { id: 2, role: 'user' },
        { id: 3, role: 'admin' }, // Duplicate role
      ];

      const result = keyBy(users, 'role');

      expect(result).toEqual({
        admin: { id: 3, role: 'admin' }, // Last occurrence wins
        user: { id: 2, role: 'user' },
      });
    });

    // Test with empty array
    it('should return empty object when given an empty array', () => {
      const result = keyBy([], 'id');
      expect(result).toEqual({});
    });

    // Test with undefined/null values as keys
    it('should handle undefined and null values as keys', () => {
      const items = [
        { id: 1, category: 'A' },
        { id: 2, category: undefined },
        { id: 3, category: null },
      ];

      const result = keyBy(items, 'category');

      expect(result).toEqual({
        A: { id: 1, category: 'A' },
        undefined: { id: 3, category: null }, // Last occurrence wins
      });
    });

    // Test with non-existent key
    it('should handle non-existent keys by using undefined', () => {
      const items = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      const result = keyBy(items, 'nonExistentKey');

      expect(result).toEqual({
        undefined: { id: 2, name: 'Bob' }, // Last occurrence wins
      });
    });

    // Test with mixed data types as keys
    it('should handle mixed data types as keys', () => {
      const items = [
        { id: 1, value: true },
        { id: 2, value: 42 },
        { id: 3, value: 'string' },
      ];

      const result = keyBy(items, 'value');

      expect(result).toEqual({
        true: { id: 1, value: true },
        42: { id: 2, value: 42 },
        string: { id: 3, value: 'string' },
      });
    });

    // Test with invalid inputs
    it('should throw error when input is not an array', () => {
      // @ts-expect-error Testing invalid input
      expect(() => keyBy('not an array', 'key')).toThrow();
      // @ts-expect-error Testing invalid input
      expect(() => keyBy(null, 'key')).toThrow();
      // @ts-expect-error Testing invalid input
      expect(() => keyBy(undefined, 'key')).toThrow();
    });

    it('should throw error when key is not a string or function', () => {
      // @ts-expect-error Testing invalid input
      expect(() => keyBy([1, 2, 3], 123)).toThrow();
      // @ts-expect-error Testing invalid input
      expect(() => keyBy([1, 2, 3], null)).toThrow();
      // @ts-expect-error Testing invalid input
      expect(() => keyBy([1, 2, 3], undefined)).toThrow();
    });

    // Test type safety with TypeScript generics
    it('should maintain type safety with TypeScript generics', () => {
      interface User {
        id: number;
        name: string;
        role: string;
      }

      const users: User[] = [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'user' },
      ];

      const result = keyBy(users, 'id');

      // TypeScript should infer this as Record<string, User>
      const user = result['1'];
      expect(user.name).toBe('Alice');
      expect(user.role).toBe('admin');
    });
  });
});