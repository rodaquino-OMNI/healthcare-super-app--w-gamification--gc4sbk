import {
  uniqueBy,
  filterByProperties,
  rejectByProperties,
  differenceBy
} from '../../../src/array/filter.util';

describe('Array Filter Utilities', () => {
  // Test data for uniqueBy tests
  const users = [
    { id: 1, name: 'John', age: 30 },
    { id: 2, name: 'Jane', age: 25 },
    { id: 3, name: 'John', age: 40 },
    { id: 4, name: 'Bob', age: 35 },
    { id: 5, name: 'Jane', age: 28 }
  ];

  // Test data for filterByProperties and rejectByProperties tests
  const healthMetrics = [
    { type: 'bloodPressure', value: 120, unit: 'mmHg', journeyId: 'health' },
    { type: 'heartRate', value: 75, unit: 'bpm', journeyId: 'health' },
    { type: 'weight', value: 70, unit: 'kg', journeyId: 'health' },
    { type: 'bloodPressure', value: 130, unit: 'mmHg', journeyId: 'health' },
    { type: 'glucose', value: 100, unit: 'mg/dL', journeyId: 'health' }
  ];

  // Test data for differenceBy tests
  const array1 = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }, { id: 3, name: 'Bob' }];
  const array2 = [{ id: 2, name: 'Jane' }, { id: 3, name: 'Bob' }, { id: 4, name: 'Alice' }];

  describe('uniqueBy', () => {
    it('should filter array for unique elements by string key', () => {
      const result = uniqueBy(users, 'name');
      
      expect(result).toHaveLength(3); // John, Jane, Bob
      expect(result.map(user => user.name).sort()).toEqual(['Bob', 'Jane', 'John']);
    });

    it('should filter array for unique elements using selector function', () => {
      const result = uniqueBy(users, user => user.age > 30 ? 'senior' : 'junior');
      
      expect(result).toHaveLength(2); // One 'junior' and one 'senior'
      expect(result.some(user => user.age <= 30)).toBeTruthy(); // At least one junior
      expect(result.some(user => user.age > 30)).toBeTruthy(); // At least one senior
    });

    it('should return the first occurrence when duplicates are found', () => {
      const result = uniqueBy(users, 'name');
      
      // Check that the first John (age 30) is kept, not the second John (age 40)
      const johnUser = result.find(user => user.name === 'John');
      expect(johnUser).toBeDefined();
      expect(johnUser?.age).toBe(30);
      
      // Check that the first Jane (age 25) is kept, not the second Jane (age 28)
      const janeUser = result.find(user => user.name === 'Jane');
      expect(janeUser).toBeDefined();
      expect(janeUser?.age).toBe(25);
    });

    it('should handle empty arrays', () => {
      const result = uniqueBy([], 'name');
      expect(result).toEqual([]);
    });

    it('should handle arrays with undefined or null values', () => {
      const mixedArray = [
        { id: 1, name: 'John' },
        { id: 2, name: undefined },
        { id: 3, name: null },
        { id: 4, name: 'John' },
        { id: 5 } // Missing name property
      ];
      
      const result = uniqueBy(mixedArray, 'name');
      
      // Should have 3 unique values: 'John', undefined, and null
      expect(result).toHaveLength(3);
    });

    it('should throw an error when key is not a string or function', () => {
      // @ts-expect-error Testing invalid input
      expect(() => uniqueBy(users, 123)).toThrow();
    });
  });

  describe('filterByProperties', () => {
    it('should filter objects by exact property value match', () => {
      const result = filterByProperties(healthMetrics, { type: 'bloodPressure' });
      
      expect(result).toHaveLength(2);
      expect(result.every(metric => metric.type === 'bloodPressure')).toBeTruthy();
    });

    it('should filter objects by multiple property values', () => {
      const result = filterByProperties(healthMetrics, { 
        type: 'bloodPressure', 
        unit: 'mmHg' 
      });
      
      expect(result).toHaveLength(2);
      expect(result.every(metric => metric.type === 'bloodPressure' && metric.unit === 'mmHg')).toBeTruthy();
    });

    it('should support filtering with array of possible values', () => {
      const result = filterByProperties(healthMetrics, { 
        type: ['bloodPressure', 'heartRate'] 
      });
      
      expect(result).toHaveLength(3); // 2 bloodPressure + 1 heartRate
      expect(result.every(metric => 
        metric.type === 'bloodPressure' || metric.type === 'heartRate'
      )).toBeTruthy();
    });

    it('should support filtering with predicate functions', () => {
      const result = filterByProperties(healthMetrics, { 
        value: (val) => val > 100 
      });
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(metric => metric.value > 100)).toBeTruthy();
    });

    it('should return empty array when no matches are found', () => {
      const result = filterByProperties(healthMetrics, { type: 'nonexistent' });
      expect(result).toEqual([]);
    });

    it('should handle empty arrays', () => {
      const result = filterByProperties([], { type: 'bloodPressure' });
      expect(result).toEqual([]);
    });

    it('should handle empty filter criteria', () => {
      const result = filterByProperties(healthMetrics, {});
      expect(result).toEqual(healthMetrics); // Should return the original array
    });

    it('should throw an error when filter is not an object', () => {
      // @ts-expect-error Testing invalid input
      expect(() => filterByProperties(healthMetrics, 'invalid')).toThrow();
    });
  });

  describe('rejectByProperties', () => {
    it('should reject objects by exact property value match', () => {
      const result = rejectByProperties(healthMetrics, { type: 'bloodPressure' });
      
      expect(result).toHaveLength(healthMetrics.length - 2); // All except bloodPressure
      expect(result.every(metric => metric.type !== 'bloodPressure')).toBeTruthy();
    });

    it('should reject objects by multiple property values', () => {
      const result = rejectByProperties(healthMetrics, { 
        type: 'bloodPressure', 
        unit: 'mmHg' 
      });
      
      // Should exclude items that match BOTH criteria
      expect(result.length).toBe(healthMetrics.length - 2);
      expect(result.some(metric => 
        metric.type === 'bloodPressure' && metric.unit === 'mmHg'
      )).toBeFalsy();
    });

    it('should support rejecting with array of possible values', () => {
      const result = rejectByProperties(healthMetrics, { 
        type: ['bloodPressure', 'heartRate'] 
      });
      
      expect(result).toHaveLength(2); // Only weight and glucose metrics
      expect(result.every(metric => 
        metric.type !== 'bloodPressure' && metric.type !== 'heartRate'
      )).toBeTruthy();
    });

    it('should support rejecting with predicate functions', () => {
      const result = rejectByProperties(healthMetrics, { 
        value: (val) => val > 100 
      });
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(metric => !(metric.value > 100))).toBeTruthy();
    });

    it('should return the original array when no matches are found', () => {
      const result = rejectByProperties(healthMetrics, { type: 'nonexistent' });
      expect(result).toEqual(healthMetrics);
    });

    it('should handle empty arrays', () => {
      const result = rejectByProperties([], { type: 'bloodPressure' });
      expect(result).toEqual([]);
    });

    it('should handle empty filter criteria', () => {
      const result = rejectByProperties(healthMetrics, {});
      expect(result).toEqual(healthMetrics); // Should return the original array
    });

    it('should throw an error when filter is not an object', () => {
      // @ts-expect-error Testing invalid input
      expect(() => rejectByProperties(healthMetrics, 'invalid')).toThrow();
    });
  });

  describe('differenceBy', () => {
    it('should return elements from first array not in second array by key', () => {
      const result = differenceBy(array1, array2, 'id');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1); // Only id 1 is unique to array1
    });

    it('should return elements from first array not in second array by selector function', () => {
      const result = differenceBy(array1, array2, item => item.name);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John'); // Only 'John' is unique to array1
    });

    it('should handle empty first array', () => {
      const result = differenceBy([], array2, 'id');
      expect(result).toEqual([]);
    });

    it('should return all elements when second array is empty', () => {
      const result = differenceBy(array1, [], 'id');
      expect(result).toEqual(array1);
    });

    it('should handle complex objects with nested properties', () => {
      const complexArray1 = [
        { user: { id: 1, profile: { name: 'John' } } },
        { user: { id: 2, profile: { name: 'Jane' } } },
        { user: { id: 3, profile: { name: 'Bob' } } }
      ];
      
      const complexArray2 = [
        { user: { id: 2, profile: { name: 'Jane' } } },
        { user: { id: 4, profile: { name: 'Alice' } } }
      ];
      
      const result = differenceBy(complexArray1, complexArray2, item => item.user.id);
      
      expect(result).toHaveLength(2); // ids 1 and 3 are unique to complexArray1
      expect(result.map(item => item.user.id).sort()).toEqual([1, 3]);
    });

    it('should handle arrays with primitive values', () => {
      const numbers1 = [1, 2, 3, 4, 5];
      const numbers2 = [3, 4, 5, 6, 7];
      
      // With primitives, the identity function is used as selector
      const result = differenceBy(numbers1, numbers2, x => x);
      
      expect(result).toHaveLength(2);
      expect(result).toEqual([1, 2]);
    });

    it('should throw an error when key is not a string or function', () => {
      // @ts-expect-error Testing invalid input
      expect(() => differenceBy(array1, array2, 123)).toThrow();
    });
  });
});