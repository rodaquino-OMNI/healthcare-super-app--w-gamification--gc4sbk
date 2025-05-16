import {
  uniqueBy,
  filterByProperties,
  rejectByProperties,
  differenceBy,
  intersectionBy,
  compact,
  filterWithRejections,
  PropertyMatcher,
  FilterProperties
} from '../../../src/array/filter.util';

describe('Array Filter Utilities', () => {
  // Test data for reuse across tests
  const users = [
    { id: 1, name: 'Alice', age: 30, active: true, tags: ['admin', 'user'] },
    { id: 2, name: 'Bob', age: 25, active: true, tags: ['user'] },
    { id: 3, name: 'Charlie', age: 35, active: false, tags: ['user'] },
    { id: 4, name: 'alice', age: 28, active: true, tags: ['user', 'support'] },
    { id: 5, name: 'David', age: 40, active: true, tags: ['user', 'manager'] }
  ];

  const numbers = [1, 2, 2, 3, 4, 4, 5];
  const strings = ['a', 'b', 'b', 'c', 'A', 'a'];
  const mixed = [1, 'a', true, 1, 'a', true, { id: 1 }, { id: 1 }, { id: 2 }];

  describe('uniqueBy', () => {
    it('should filter unique primitive values', () => {
      expect(uniqueBy(numbers)).toEqual([1, 2, 3, 4, 5]);
      expect(uniqueBy(strings)).toEqual(['a', 'b', 'c', 'A']);
    });

    it('should filter unique objects by key', () => {
      const result = uniqueBy(users, 'id');
      expect(result).toHaveLength(5);
      expect(result.map(u => u.id)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should filter unique objects by selector function', () => {
      // Case-insensitive name uniqueness
      const result = uniqueBy(users, user => user.name.toLowerCase());
      expect(result).toHaveLength(4); // 'Alice' and 'alice' should be considered the same
      
      // Verify 'Alice' was kept and 'alice' was filtered out (or vice versa)
      const names = result.map(u => u.name.toLowerCase());
      expect(names).toContain('alice');
      expect(names.filter(name => name === 'alice')).toHaveLength(1);
    });

    it('should handle empty arrays', () => {
      expect(uniqueBy([])).toEqual([]);
      expect(uniqueBy([], 'id')).toEqual([]);
      expect(uniqueBy([], item => item)).toEqual([]);
    });

    it('should handle arrays with objects that have missing properties', () => {
      const items = [
        { id: 1, name: 'Item 1' },
        { id: 2 }, // missing name
        { name: 'Item 3' }, // missing id
        { id: 1, name: 'Item 1 Duplicate' }
      ];

      const resultById = uniqueBy(items, 'id');
      expect(resultById).toHaveLength(3); // 3 unique IDs (including undefined)

      const resultByName = uniqueBy(items, 'name');
      expect(resultByName).toHaveLength(3); // 3 unique names (including undefined)
    });

    it('should handle complex objects with nested properties', () => {
      const complexItems = [
        { id: 1, meta: { category: 'A', tags: ['x', 'y'] } },
        { id: 2, meta: { category: 'B', tags: ['z'] } },
        { id: 3, meta: { category: 'A', tags: ['x'] } },
        { id: 4, meta: { category: 'C' } } // missing tags
      ];

      // Unique by category
      const result = uniqueBy(complexItems, item => item.meta.category);
      expect(result).toHaveLength(3); // 3 unique categories: A, B, C
    });

    it('should throw error for null or undefined arrays', () => {
      expect(() => uniqueBy(null as any)).toThrow();
      expect(() => uniqueBy(undefined as any)).toThrow();
    });
  });

  describe('filterByProperties', () => {
    it('should filter objects by exact property match', () => {
      const result = filterByProperties(users, { name: 'Alice' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should filter objects by multiple properties with AND logic', () => {
      const result = filterByProperties(users, { age: 30, active: true });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });

    it('should filter objects by multiple properties with OR logic', () => {
      const result = filterByProperties(users, { name: 'Alice', age: 25 }, false);
      expect(result).toHaveLength(2);
      expect(result.map(u => u.name)).toContain('Alice');
      expect(result.map(u => u.name)).toContain('Bob');
    });

    it('should filter objects using contains matcher', () => {
      const result = filterByProperties(users, { name: { contains: 'li' } });
      expect(result).toHaveLength(3);
      expect(result.map(u => u.name)).toEqual(['Alice', 'Charlie', 'alice']);
    });

    it('should filter objects using startsWith and endsWith matchers', () => {
      const startsWithA = filterByProperties(users, { name: { startsWith: 'A' } });
      expect(startsWithA).toHaveLength(1);
      expect(startsWithA[0].name).toBe('Alice');

      const endsWithE = filterByProperties(users, { name: { endsWith: 'e' } });
      expect(endsWithE).toHaveLength(2);
      expect(endsWithE.map(u => u.name)).toEqual(['Alice', 'Charlie']);
    });

    it('should filter objects using in and notIn matchers', () => {
      const inResult = filterByProperties(users, { age: { in: [25, 30, 40] } });
      expect(inResult).toHaveLength(3);
      expect(inResult.map(u => u.age)).toEqual([30, 25, 40]);

      const notInResult = filterByProperties(users, { age: { notIn: [25, 30, 40] } });
      expect(notInResult).toHaveLength(2);
      expect(notInResult.map(u => u.age)).toEqual([35, 28]);
    });

    it('should filter objects using numeric comparison matchers', () => {
      const gtResult = filterByProperties(users, { age: { gt: 30 } });
      expect(gtResult).toHaveLength(2);
      expect(gtResult.map(u => u.age)).toEqual([35, 40]);

      const lteResult = filterByProperties(users, { age: { lte: 30 } });
      expect(lteResult).toHaveLength(3);
      expect(lteResult.map(u => u.age)).toEqual([30, 25, 28]);

      const betweenResult = filterByProperties(users, { age: { between: [25, 35] } });
      expect(betweenResult).toHaveLength(4);
      expect(betweenResult.map(u => u.age)).toEqual([30, 25, 35, 28]);
    });

    it('should filter objects using exists matcher', () => {
      const items = [
        { id: 1, name: 'Item 1', description: 'Desc 1' },
        { id: 2, name: 'Item 2' }, // missing description
        { id: 3, name: 'Item 3', description: null },
        { id: 4, name: 'Item 4', description: undefined }
      ];

      const existsResult = filterByProperties(items, { description: { exists: true } });
      expect(existsResult).toHaveLength(1);
      expect(existsResult[0].id).toBe(1);

      const notExistsResult = filterByProperties(items, { description: { exists: false } });
      expect(notExistsResult).toHaveLength(3);
      expect(notExistsResult.map(item => item.id)).toEqual([2, 3, 4]);
    });

    it('should filter objects using regex matcher', () => {
      const result = filterByProperties(users, { name: { regex: /^[A-C]/ } });
      expect(result).toHaveLength(3);
      expect(result.map(u => u.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should return a copy of the original array if no properties specified', () => {
      const result = filterByProperties(users, {});
      expect(result).toEqual(users);
      expect(result).not.toBe(users); // Should be a new array instance
    });

    it('should handle empty arrays', () => {
      expect(filterByProperties([], { name: 'Alice' })).toEqual([]);
    });

    it('should throw error for null or undefined arrays', () => {
      expect(() => filterByProperties(null as any, { name: 'Alice' })).toThrow();
      expect(() => filterByProperties(undefined as any, { name: 'Alice' })).toThrow();
    });
  });

  describe('rejectByProperties', () => {
    it('should reject objects by exact property match', () => {
      const result = rejectByProperties(users, { name: 'Alice' });
      expect(result).toHaveLength(4);
      expect(result.map(u => u.name)).not.toContain('Alice');
    });

    it('should reject objects by multiple properties with AND logic', () => {
      const result = rejectByProperties(users, { age: 30, active: true });
      expect(result).toHaveLength(4);
      expect(result.map(u => u.name)).not.toContain('Alice');
    });

    it('should reject objects by multiple properties with OR logic', () => {
      const result = rejectByProperties(users, { name: 'Alice', age: 25 }, false);
      expect(result).toHaveLength(3);
      expect(result.map(u => u.name)).not.toContain('Alice');
      expect(result.map(u => u.name)).not.toContain('Bob');
    });

    it('should be the inverse of filterByProperties', () => {
      const properties = { age: { gt: 30 } };
      
      const filtered = filterByProperties(users, properties);
      const rejected = rejectByProperties(users, properties);
      
      // The union of filtered and rejected should equal the original array
      expect([...filtered, ...rejected]).toHaveLength(users.length);
      
      // No item should be in both filtered and rejected
      const filteredIds = filtered.map(u => u.id);
      const rejectedIds = rejected.map(u => u.id);
      const intersection = filteredIds.filter(id => rejectedIds.includes(id));
      expect(intersection).toHaveLength(0);
    });

    it('should handle empty arrays', () => {
      expect(rejectByProperties([], { name: 'Alice' })).toEqual([]);
    });

    it('should throw error for null or undefined arrays', () => {
      expect(() => rejectByProperties(null as any, { name: 'Alice' })).toThrow();
      expect(() => rejectByProperties(undefined as any, { name: 'Alice' })).toThrow();
    });
  });

  describe('differenceBy', () => {
    it('should return elements from first array not in second array', () => {
      expect(differenceBy([1, 2, 3, 4], [2, 4, 5])).toEqual([1, 3]);
      expect(differenceBy(['a', 'b', 'c'], ['b', 'd'])).toEqual(['a', 'c']);
    });

    it('should compare objects by key', () => {
      const firstArray = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ];
      
      const secondArray = [
        { id: 1, name: 'Alice Smith' }, // Different name, same id
        { id: 4, name: 'David' }
      ];
      
      const result = differenceBy(firstArray, secondArray, 'id');
      expect(result).toHaveLength(2);
      expect(result.map(item => item.id)).toEqual([2, 3]);
    });

    it('should compare objects by selector function', () => {
      const firstArray = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ];
      
      const secondArray = [
        { id: 4, name: 'alice' }, // Different id, same name (case-insensitive)
        { id: 5, name: 'David' }
      ];
      
      const result = differenceBy(
        firstArray,
        secondArray,
        item => item.name.toLowerCase()
      );
      
      expect(result).toHaveLength(2);
      expect(result.map(item => item.name)).toEqual(['Bob', 'Charlie']);
    });

    it('should handle empty arrays', () => {
      expect(differenceBy([], [1, 2, 3])).toEqual([]);
      expect(differenceBy([1, 2, 3], [])).toEqual([1, 2, 3]);
      expect(differenceBy([], [])).toEqual([]);
    });

    it('should handle arrays with mixed data types', () => {
      const firstArray = [1, 'a', true, { id: 1 }];
      const secondArray = [1, 'b', { id: 1 }];
      
      // Without key or selector, objects are compared by reference
      const result = differenceBy(firstArray, secondArray);
      expect(result).toContain('a');
      expect(result).toContain(true);
      expect(result).toContain(firstArray[3]); // The object reference is different
    });

    it('should throw error for null or undefined arrays', () => {
      expect(() => differenceBy(null as any, [1, 2])).toThrow();
      expect(() => differenceBy([1, 2], null as any)).toThrow();
      expect(() => differenceBy(undefined as any, [1, 2])).toThrow();
      expect(() => differenceBy([1, 2], undefined as any)).toThrow();
    });
  });

  // Additional tests for other functions
  describe('intersectionBy', () => {
    it('should return elements that exist in both arrays', () => {
      expect(intersectionBy([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
    });

    it('should compare objects by key', () => {
      const firstArray = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ];
      
      const secondArray = [
        { id: 1, name: 'Alice Smith' }, // Different name, same id
        { id: 3, name: 'Charles' }, // Different name, same id
        { id: 4, name: 'David' }
      ];
      
      const result = intersectionBy(firstArray, secondArray, 'id');
      expect(result).toHaveLength(2);
      expect(result.map(item => item.id)).toEqual([1, 3]);
      // Should return objects from the first array
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Charlie');
    });
  });

  describe('compact', () => {
    it('should remove null and undefined values', () => {
      const array = [1, null, 2, undefined, 3];
      expect(compact(array)).toEqual([1, 2, 3]);
    });

    it('should keep falsy values that are not null or undefined', () => {
      const array = [0, '', false, NaN, 1];
      expect(compact(array)).toEqual([0, '', false, NaN, 1]);
    });
  });

  describe('filterWithRejections', () => {
    it('should separate array into filtered and rejected elements', () => {
      const { filtered, rejected } = filterWithRejections(numbers, num => num % 2 === 0);
      expect(filtered).toEqual([2, 2, 4, 4]);
      expect(rejected).toEqual([1, 3, 5]);
    });

    it('should work with complex predicates', () => {
      const { filtered, rejected } = filterWithRejections(users, user => {
        return user.age > 30 && user.active;
      });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('David');
      expect(rejected).toHaveLength(4);
    });
  });
});