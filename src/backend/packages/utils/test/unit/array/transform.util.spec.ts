import { flattenDeep, mapByKey, indexBy, pluck, nestByKeys } from '../../../src/array/transform.util';

describe('Array Transformation Utilities', () => {
  describe('flattenDeep', () => {
    it('should flatten a nested array of any depth', () => {
      const input = [1, [2, [3, 4], 5], 6];
      const expected = [1, 2, 3, 4, 5, 6];
      expect(flattenDeep(input)).toEqual(expected);
    });

    it('should return the original array if it has no nested arrays', () => {
      const input = [1, 2, 3, 4];
      expect(flattenDeep(input)).toEqual(input);
    });

    it('should handle empty arrays', () => {
      expect(flattenDeep([])).toEqual([]);
    });

    it('should handle deeply nested arrays', () => {
      const input = [1, [2, [3, [4, [5, [6]]]]]]; 
      const expected = [1, 2, 3, 4, 5, 6];
      expect(flattenDeep(input)).toEqual(expected);
    });

    it('should handle arrays with null and undefined values', () => {
      const input = [1, [2, null, [3, undefined]], 4];
      const expected = [1, 2, null, 3, undefined, 4];
      expect(flattenDeep(input)).toEqual(expected);
    });

    it('should throw an error if input is not an array', () => {
      // @ts-ignore - Testing invalid input
      expect(() => flattenDeep('not an array')).toThrow('Input must be an array');
      // @ts-ignore - Testing invalid input
      expect(() => flattenDeep(null)).toThrow('Input must be an array');
      // @ts-ignore - Testing invalid input
      expect(() => flattenDeep(undefined)).toThrow('Input must be an array');
      // @ts-ignore - Testing invalid input
      expect(() => flattenDeep(123)).toThrow('Input must be an array');
    });
  });

  describe('mapByKey', () => {
    const users = [
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'user' },
      { id: 3, name: 'Charlie', role: 'user' }
    ];

    it('should map objects by key using the key function', () => {
      const result = mapByKey(users, user => user.id);
      expect(result).toEqual({
        '1': { id: 1, name: 'Alice', role: 'admin' },
        '2': { id: 2, name: 'Bob', role: 'user' },
        '3': { id: 3, name: 'Charlie', role: 'user' }
      });
    });

    it('should map objects by key using the key function and value function', () => {
      const result = mapByKey(users, user => user.id, user => user.name);
      expect(result).toEqual({
        '1': 'Alice',
        '2': 'Bob',
        '3': 'Charlie'
      });
    });

    it('should handle string keys', () => {
      const result = mapByKey(users, user => user.role);
      expect(result).toEqual({
        'admin': { id: 1, name: 'Alice', role: 'admin' },
        'user': { id: 3, name: 'Charlie', role: 'user' } // Note: Bob is overwritten by Charlie
      });
    });

    it('should handle empty arrays', () => {
      const result = mapByKey([], user => user.id);
      expect(result).toEqual({});
    });

    it('should throw an error if input is not an array', () => {
      // @ts-ignore - Testing invalid input
      expect(() => mapByKey('not an array', user => user.id)).toThrow('Input must be an array');
      // @ts-ignore - Testing invalid input
      expect(() => mapByKey(null, user => user.id)).toThrow('Input must be an array');
      // @ts-ignore - Testing invalid input
      expect(() => mapByKey(undefined, user => user.id)).toThrow('Input must be an array');
    });

    it('should throw an error if key function is not a function', () => {
      // @ts-ignore - Testing invalid input
      expect(() => mapByKey(users, 'id')).toThrow('Key function must be a function');
      // @ts-ignore - Testing invalid input
      expect(() => mapByKey(users, null)).toThrow('Key function must be a function');
      // @ts-ignore - Testing invalid input
      expect(() => mapByKey(users, undefined)).toThrow('Key function must be a function');
    });
  });

  describe('indexBy', () => {
    const users = [
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'user' },
      { id: 3, name: 'Charlie', role: 'user' }
    ];

    it('should index objects by property name', () => {
      const result = indexBy(users, 'id');
      expect(result).toEqual({
        '1': { id: 1, name: 'Alice', role: 'admin' },
        '2': { id: 2, name: 'Bob', role: 'user' },
        '3': { id: 3, name: 'Charlie', role: 'user' }
      });
    });

    it('should index objects by function', () => {
      const result = indexBy(users, user => user.name.toLowerCase());
      expect(result).toEqual({
        'alice': { id: 1, name: 'Alice', role: 'admin' },
        'bob': { id: 2, name: 'Bob', role: 'user' },
        'charlie': { id: 3, name: 'Charlie', role: 'user' }
      });
    });

    it('should handle string keys', () => {
      const result = indexBy(users, 'role');
      expect(result).toEqual({
        'admin': { id: 1, name: 'Alice', role: 'admin' },
        'user': { id: 3, name: 'Charlie', role: 'user' } // Note: Bob is overwritten by Charlie
      });
    });

    it('should handle empty arrays', () => {
      const result = indexBy([], 'id');
      expect(result).toEqual({});
    });

    it('should throw an error if input is not an array', () => {
      // @ts-ignore - Testing invalid input
      expect(() => indexBy('not an array', 'id')).toThrow('Input must be an array');
      // @ts-ignore - Testing invalid input
      expect(() => indexBy(null, 'id')).toThrow('Input must be an array');
      // @ts-ignore - Testing invalid input
      expect(() => indexBy(undefined, 'id')).toThrow('Input must be an array');
    });

    it('should throw an error if key selector is invalid', () => {
      // @ts-ignore - Testing invalid input
      expect(() => indexBy(users, null)).toThrow('Key selector must be a property name or a function');
      // @ts-ignore - Testing invalid input
      expect(() => indexBy(users, undefined)).toThrow('Key selector must be a property name or a function');
      // @ts-ignore - Testing invalid input
      expect(() => indexBy(users, {})).toThrow('Key selector must be a property name or a function');
    });

    it('should throw an error if key selector returns null or undefined', () => {
      const usersWithMissingKeys = [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: null, name: 'Bob', role: 'user' }
      ];
      expect(() => indexBy(usersWithMissingKeys, 'id')).toThrow('Key selector returned undefined or null');

      expect(() => indexBy(users, () => null)).toThrow('Key selector returned undefined or null');
      expect(() => indexBy(users, () => undefined)).toThrow('Key selector returned undefined or null');
    });
  });

  describe('pluck', () => {
    const users = [
      { id: 1, name: 'Alice', role: 'admin', contact: { email: 'alice@example.com' } },
      { id: 2, name: 'Bob', role: 'user', contact: { email: 'bob@example.com' } },
      { id: 3, name: 'Charlie', role: 'user', contact: { email: 'charlie@example.com' } }
    ];

    it('should extract the specified property from each object', () => {
      const result = pluck(users, 'name');
      expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should extract numeric properties', () => {
      const result = pluck(users, 'id');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should extract nested object properties', () => {
      const result = pluck(users, 'contact');
      expect(result).toEqual([
        { email: 'alice@example.com' },
        { email: 'bob@example.com' },
        { email: 'charlie@example.com' }
      ]);
    });

    it('should handle empty arrays', () => {
      const result = pluck([], 'name');
      expect(result).toEqual([]);
    });

    it('should throw an error if input is not an array', () => {
      // @ts-ignore - Testing invalid input
      expect(() => pluck('not an array', 'name')).toThrow('Input must be an array');
      // @ts-ignore - Testing invalid input
      expect(() => pluck(null, 'name')).toThrow('Input must be an array');
      // @ts-ignore - Testing invalid input
      expect(() => pluck(undefined, 'name')).toThrow('Input must be an array');
    });

    it('should throw an error if property is not specified', () => {
      // @ts-ignore - Testing invalid input
      expect(() => pluck(users, null)).toThrow('Property must be specified');
      // @ts-ignore - Testing invalid input
      expect(() => pluck(users, undefined)).toThrow('Property must be specified');
    });

    it('should throw an error if array contains non-object items', () => {
      // @ts-ignore - Testing invalid input
      const invalidArray = [{ id: 1 }, 'not an object', { id: 3 }];
      expect(() => pluck(invalidArray, 'id')).toThrow('Expected object but got string');
    });
  });

  describe('nestByKeys', () => {
    const data = [
      { journey: 'health', category: 'metrics', type: 'heart_rate', value: 75 },
      { journey: 'health', category: 'metrics', type: 'steps', value: 10000 },
      { journey: 'health', category: 'goals', type: 'weight', value: 70 },
      { journey: 'care', category: 'appointments', type: 'doctor', value: 'scheduled' }
    ];

    it('should create a nested object based on hierarchy of keys', () => {
      const result = nestByKeys(data, ['journey', 'category', 'type']);
      expect(result).toEqual({
        'health': {
          'metrics': {
            'heart_rate': { journey: 'health', category: 'metrics', type: 'heart_rate', value: 75 },
            'steps': { journey: 'health', category: 'metrics', type: 'steps', value: 10000 }
          },
          'goals': {
            'weight': { journey: 'health', category: 'goals', type: 'weight', value: 70 }
          }
        },
        'care': {
          'appointments': {
            'doctor': { journey: 'care', category: 'appointments', type: 'doctor', value: 'scheduled' }
          }
        }
      });
    });

    it('should handle function selectors for keys', () => {
      const result = nestByKeys(data, [
        item => item.journey.toUpperCase(),
        'category',
        item => `TYPE_${item.type.toUpperCase()}`
      ]);
      
      expect(result).toEqual({
        'HEALTH': {
          'metrics': {
            'TYPE_HEART_RATE': { journey: 'health', category: 'metrics', type: 'heart_rate', value: 75 },
            'TYPE_STEPS': { journey: 'health', category: 'metrics', type: 'steps', value: 10000 }
          },
          'goals': {
            'TYPE_WEIGHT': { journey: 'health', category: 'goals', type: 'weight', value: 70 }
          }
        },
        'CARE': {
          'appointments': {
            'TYPE_DOCTOR': { journey: 'care', category: 'appointments', type: 'doctor', value: 'scheduled' }
          }
        }
      });
    });

    it('should convert to array when multiple items have the same final key', () => {
      const dataWithDuplicates = [
        { journey: 'health', category: 'metrics', type: 'heart_rate', value: 75 },
        { journey: 'health', category: 'metrics', type: 'heart_rate', value: 80 } // Duplicate final key
      ];
      
      const result = nestByKeys(dataWithDuplicates, ['journey', 'category', 'type']);
      
      expect(result).toEqual({
        'health': {
          'metrics': {
            'heart_rate': [
              { journey: 'health', category: 'metrics', type: 'heart_rate', value: 75 },
              { journey: 'health', category: 'metrics', type: 'heart_rate', value: 80 }
            ]
          }
        }
      });
    });

    it('should handle empty arrays', () => {
      const result = nestByKeys([], ['journey', 'category', 'type']);
      expect(result).toEqual({});
    });

    it('should throw an error if input is not an array', () => {
      // @ts-ignore - Testing invalid input
      expect(() => nestByKeys('not an array', ['journey'])).toThrow('Input must be an array');
      // @ts-ignore - Testing invalid input
      expect(() => nestByKeys(null, ['journey'])).toThrow('Input must be an array');
      // @ts-ignore - Testing invalid input
      expect(() => nestByKeys(undefined, ['journey'])).toThrow('Input must be an array');
    });

    it('should throw an error if keys is not an array or is empty', () => {
      // @ts-ignore - Testing invalid input
      expect(() => nestByKeys(data, 'journey')).toThrow('Keys must be a non-empty array');
      // @ts-ignore - Testing invalid input
      expect(() => nestByKeys(data, null)).toThrow('Keys must be a non-empty array');
      // @ts-ignore - Testing invalid input
      expect(() => nestByKeys(data, undefined)).toThrow('Keys must be a non-empty array');
      expect(() => nestByKeys(data, [])).toThrow('Keys must be a non-empty array');
    });

    it('should throw an error if key selector returns null or undefined', () => {
      const dataWithMissingKeys = [
        { journey: 'health', category: null, type: 'heart_rate', value: 75 }
      ];
      
      expect(() => nestByKeys(dataWithMissingKeys, ['journey', 'category', 'type']))
        .toThrow('Key selector at index 1 returned undefined or null');

      expect(() => nestByKeys(data, ['journey', () => null, 'type']))
        .toThrow('Key selector at index 1 returned undefined or null');

      expect(() => nestByKeys(data, ['journey', 'category', () => undefined]))
        .toThrow('Last key selector returned undefined or null');
    });
  });
});