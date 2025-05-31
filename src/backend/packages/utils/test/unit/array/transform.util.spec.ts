import { flattenDeep, mapByKey, indexBy, pluck } from '../../../src/array/transform.util';

describe('Array Transform Utilities', () => {
  describe('flattenDeep', () => {
    it('should flatten a nested array of any depth', () => {
      const input = [1, [2, [3, [4, 5]], 6], 7, [8, [9]]];
      const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      expect(flattenDeep(input)).toEqual(expected);
    });

    it('should return an empty array when given an empty array', () => {
      expect(flattenDeep([])).toEqual([]);
    });

    it('should return the same array when given a flat array', () => {
      const input = [1, 2, 3, 4, 5];
      expect(flattenDeep(input)).toEqual(input);
    });

    it('should handle arrays with null or undefined values', () => {
      const input = [1, null, [2, undefined, [3, null]]];
      const expected = [1, null, 2, undefined, 3, null];
      expect(flattenDeep(input)).toEqual(expected);
    });

    it('should handle deeply nested arrays', () => {
      const input = [[[[[1]]]]];
      const expected = [1];
      expect(flattenDeep(input)).toEqual(expected);
    });

    it('should handle mixed types in arrays', () => {
      const input = [1, 'a', [true, [{ key: 'value' }, [null, undefined]]], []];
      const expected = [1, 'a', true, { key: 'value' }, null, undefined];
      expect(flattenDeep(input)).toEqual(expected);
    });
  });

  describe('mapByKey', () => {
    const testData = [
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'user' },
      { id: 3, name: 'Charlie', role: 'user' }
    ];

    it('should map array items by a string key', () => {
      const result = mapByKey(testData, 'id');
      expect(result).toEqual({
        1: { id: 1, name: 'Alice', role: 'admin' },
        2: { id: 2, name: 'Bob', role: 'user' },
        3: { id: 3, name: 'Charlie', role: 'user' }
      });
    });

    it('should map array items by a nested key path', () => {
      const nestedData = [
        { user: { id: 1, profile: { name: 'Alice' } } },
        { user: { id: 2, profile: { name: 'Bob' } } },
        { user: { id: 3, profile: { name: 'Charlie' } } }
      ];
      const result = mapByKey(nestedData, 'user.id');
      expect(result).toEqual({
        1: { user: { id: 1, profile: { name: 'Alice' } } },
        2: { user: { id: 2, profile: { name: 'Bob' } } },
        3: { user: { id: 3, profile: { name: 'Charlie' } } }
      });
    });

    it('should map array items using a selector function', () => {
      const result = mapByKey(testData, item => `user_${item.id}`);
      expect(result).toEqual({
        user_1: { id: 1, name: 'Alice', role: 'admin' },
        user_2: { id: 2, name: 'Bob', role: 'user' },
        user_3: { id: 3, name: 'Charlie', role: 'user' }
      });
    });

    it('should map array items with a value selector function', () => {
      const result = mapByKey(
        testData, 
        'id', 
        item => ({ name: item.name, role: item.role })
      );
      expect(result).toEqual({
        1: { name: 'Alice', role: 'admin' },
        2: { name: 'Bob', role: 'user' },
        3: { name: 'Charlie', role: 'user' }
      });
    });

    it('should handle empty arrays', () => {
      expect(mapByKey([], 'id')).toEqual({});
    });

    it('should handle missing keys by using undefined as the key', () => {
      const data = [{ name: 'Alice' }, { id: 2, name: 'Bob' }];
      const result = mapByKey(data, 'id');
      expect(result).toEqual({
        undefined: { name: 'Alice' },
        2: { id: 2, name: 'Bob' }
      });
    });

    it('should overwrite entries with duplicate keys', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 1, name: 'Bob' }
      ];
      const result = mapByKey(data, 'id');
      expect(result).toEqual({
        1: { id: 1, name: 'Bob' }
      });
    });
  });

  describe('indexBy', () => {
    const testData = [
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'user' },
      { id: 3, name: 'Charlie', role: 'user' }
    ];

    it('should index array items by a string key', () => {
      const result = indexBy(testData, 'id');
      expect(result).toEqual({
        1: { id: 1, name: 'Alice', role: 'admin' },
        2: { id: 2, name: 'Bob', role: 'user' },
        3: { id: 3, name: 'Charlie', role: 'user' }
      });
    });

    it('should index array items by a nested key path', () => {
      const nestedData = [
        { user: { id: 1, profile: { name: 'Alice' } } },
        { user: { id: 2, profile: { name: 'Bob' } } },
        { user: { id: 3, profile: { name: 'Charlie' } } }
      ];
      const result = indexBy(nestedData, 'user.id');
      expect(result).toEqual({
        1: { user: { id: 1, profile: { name: 'Alice' } } },
        2: { user: { id: 2, profile: { name: 'Bob' } } },
        3: { user: { id: 3, profile: { name: 'Charlie' } } }
      });
    });

    it('should index array items using a selector function', () => {
      const result = indexBy(testData, item => item.name.toLowerCase());
      expect(result).toEqual({
        alice: { id: 1, name: 'Alice', role: 'admin' },
        bob: { id: 2, name: 'Bob', role: 'user' },
        charlie: { id: 3, name: 'Charlie', role: 'user' }
      });
    });

    it('should handle empty arrays', () => {
      expect(indexBy([], 'id')).toEqual({});
    });

    it('should handle missing keys by using undefined as the key', () => {
      const data = [{ name: 'Alice' }, { id: 2, name: 'Bob' }];
      const result = indexBy(data, 'id');
      expect(result).toEqual({
        undefined: { name: 'Alice' },
        2: { id: 2, name: 'Bob' }
      });
    });

    it('should overwrite entries with duplicate keys', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 1, name: 'Bob' }
      ];
      const result = indexBy(data, 'id');
      expect(result).toEqual({
        1: { id: 1, name: 'Bob' }
      });
    });

    it('should handle non-string keys by converting them to strings', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: true, name: 'Bob' },
        { id: null, name: 'Charlie' }
      ];
      const result = indexBy(data, 'id');
      expect(result).toEqual({
        1: { id: 1, name: 'Alice' },
        true: { id: true, name: 'Bob' },
        null: { id: null, name: 'Charlie' }
      });
    });
  });

  describe('pluck', () => {
    const testData = [
      { id: 1, name: 'Alice', role: 'admin', contact: { email: 'alice@example.com' } },
      { id: 2, name: 'Bob', role: 'user', contact: { email: 'bob@example.com' } },
      { id: 3, name: 'Charlie', role: 'user', contact: { email: 'charlie@example.com' } }
    ];

    it('should extract values for a simple property', () => {
      expect(pluck(testData, 'name')).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should extract values for a nested property path', () => {
      expect(pluck(testData, 'contact.email')).toEqual([
        'alice@example.com',
        'bob@example.com',
        'charlie@example.com'
      ]);
    });

    it('should handle missing properties by returning undefined', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2 },
        { id: 3, name: 'Charlie' }
      ];
      expect(pluck(data, 'name')).toEqual(['Alice', undefined, 'Charlie']);
    });

    it('should handle missing nested properties by returning undefined', () => {
      const data = [
        { id: 1, user: { name: 'Alice' } },
        { id: 2, user: {} },
        { id: 3 }
      ];
      expect(pluck(data, 'user.name')).toEqual(['Alice', undefined, undefined]);
    });

    it('should handle empty arrays', () => {
      expect(pluck([], 'name')).toEqual([]);
    });

    it('should handle non-object array items by returning undefined', () => {
      const data = [{ name: 'Alice' }, null, undefined, 'string', 123];
      expect(pluck(data, 'name')).toEqual(['Alice', undefined, undefined, undefined, undefined]);
    });

    it('should handle array indices in property paths', () => {
      const data = [
        { id: 1, tags: ['frontend', 'backend'] },
        { id: 2, tags: ['backend'] },
        { id: 3, tags: [] }
      ];
      expect(pluck(data, 'tags.0')).toEqual(['frontend', 'backend', undefined]);
    });

    it('should handle deeply nested property paths', () => {
      const data = [
        { user: { profile: { address: { city: 'New York' } } } },
        { user: { profile: { address: { city: 'London' } } } },
        { user: { profile: {} } }
      ];
      expect(pluck(data, 'user.profile.address.city')).toEqual(['New York', 'London', undefined]);
    });
  });
});