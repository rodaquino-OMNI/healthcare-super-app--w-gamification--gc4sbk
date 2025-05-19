/**
 * Edge Case Array Test Fixtures
 * 
 * This module provides test fixtures specifically for edge case scenarios when working with arrays.
 * These fixtures ensure robust testing of array utilities against problematic inputs and edge conditions.
 * 
 * @module test/fixtures/array/edge-case-arrays
 */

/**
 * Array containing null values for testing null handling in array utilities.
 */
export const arrayWithNulls: (number | null)[] = [1, null, 3, null, 5];

/**
 * Array containing undefined elements for testing undefined handling in array utilities.
 */
export const arrayWithUndefined: (number | undefined)[] = [1, undefined, 3, undefined, 5];

/**
 * Array containing NaN values for testing NaN handling in array utilities.
 */
export const arrayWithNaN: number[] = [1, NaN, 3, NaN, 5];

/**
 * Array containing empty strings for testing empty string handling in array utilities.
 */
export const arrayWithEmptyStrings: string[] = ['value', '', 'another', '', 'last'];

/**
 * Array containing mixed types for testing type handling in array utilities.
 */
export const arrayWithMixedTypes: any[] = [1, 'string', true, {}, [], null, undefined, NaN];

/**
 * Array with a single element for testing edge cases in array operations.
 */
export const singleElementArray: number[] = [42];

/**
 * Array with duplicate values for testing uniqueness operations.
 */
export const arrayWithDuplicates: number[] = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];

/**
 * Array with very large numbers for testing numeric overflow handling.
 */
export const arrayWithLargeNumbers: number[] = [Number.MAX_SAFE_INTEGER, Number.MAX_VALUE, 1e20, 1e30];

/**
 * Array with very small numbers for testing numeric underflow handling.
 */
export const arrayWithSmallNumbers: number[] = [Number.MIN_SAFE_INTEGER, Number.MIN_VALUE, -1e20, -1e30];

/**
 * Array with special characters for testing string handling edge cases.
 */
export const arrayWithSpecialChars: string[] = ['\n', '\t', '\r', '\\', '"', "'", '`', '\u0000'];

/**
 * Array with objects containing null or undefined properties.
 */
export const objectsWithNullProps: Array<Record<string, any>> = [
  { id: 1, name: 'valid', value: 100 },
  { id: 2, name: null, value: 200 },
  { id: 3, name: 'valid', value: null },
  { id: 4, name: undefined, value: 400 },
  { id: 5, name: 'valid', value: undefined }
];

/**
 * Array with objects containing empty properties (empty strings, arrays, objects).
 */
export const objectsWithEmptyProps: Array<Record<string, any>> = [
  { id: 1, name: 'valid', tags: ['tag1', 'tag2'], metadata: { key: 'value' } },
  { id: 2, name: '', tags: [], metadata: {} },
  { id: 3, name: 'valid', tags: [''], metadata: { key: '' } },
  { id: 4, name: '', tags: ['', ''], metadata: { '': '' } }
];

/**
 * Array with circular references for testing serialization edge cases.
 */
export const createArrayWithCircularReferences = (): any[] => {
  const obj1: any = { name: 'circular1' };
  const obj2: any = { name: 'circular2' };
  obj1.ref = obj2;
  obj2.ref = obj1;
  return [obj1, obj2, { normal: 'value' }];
};

/**
 * Array with nested arrays of varying depths for testing deep operations.
 */
export const deeplyNestedArray: any[] = [
  1,
  [2, 3],
  [4, [5, 6]],
  [7, [8, [9, 10]]],
  [11, [12, [13, [14, 15]]]]
];

/**
 * Array with objects containing functions for testing function handling.
 */
export const arrayWithFunctions: Array<Record<string, any>> = [
  { id: 1, name: 'item1', process: () => 'processed1' },
  { id: 2, name: 'item2', process: function() { return 'processed2'; } },
  { id: 3, name: 'item3', process: null }
];

/**
 * Array with objects containing Symbol properties for testing Symbol handling.
 */
export const arrayWithSymbols: Array<Record<string, any>> = [
  { id: 1, name: 'item1', [Symbol('key1')]: 'value1' },
  { id: 2, name: 'item2', [Symbol('key2')]: 'value2' },
  { id: 3, name: 'item3', [Symbol.for('key3')]: 'value3' }
];

/**
 * Array with objects containing Date objects for testing date handling.
 */
export const arrayWithDates: Array<Record<string, any>> = [
  { id: 1, name: 'item1', created: new Date('2023-01-01') },
  { id: 2, name: 'item2', created: new Date('2023-01-02') },
  { id: 3, name: 'item3', created: new Date('Invalid Date') },
  { id: 4, name: 'item4', created: null }
];

/**
 * Array with objects containing RegExp objects for testing regex handling.
 */
export const arrayWithRegExps: Array<Record<string, any>> = [
  { id: 1, pattern: /^test$/ },
  { id: 2, pattern: /[a-z]+/i },
  { id: 3, pattern: new RegExp('\\d+') },
  { id: 4, pattern: null }
];

/**
 * Array with objects containing Error objects for testing error handling.
 */
export const arrayWithErrors: Array<Record<string, any>> = [
  { id: 1, error: new Error('Test error 1') },
  { id: 2, error: new TypeError('Type error') },
  { id: 3, error: new SyntaxError('Syntax error') },
  { id: 4, error: null }
];

/**
 * Array with objects containing Promise objects for testing promise handling.
 */
export const arrayWithPromises: Array<Record<string, any>> = [
  { id: 1, promise: Promise.resolve('resolved') },
  { id: 2, promise: Promise.reject('rejected').catch(() => {}) },
  { id: 3, promise: new Promise(resolve => setTimeout(() => resolve('delayed'), 100)) },
  { id: 4, promise: null }
];

/**
 * Array with objects containing Map objects for testing Map handling.
 */
export const arrayWithMaps: Array<Record<string, any>> = [
  { id: 1, map: new Map([['key1', 'value1'], ['key2', 'value2']]) },
  { id: 2, map: new Map() },
  { id: 3, map: null }
];

/**
 * Array with objects containing Set objects for testing Set handling.
 */
export const arrayWithSets: Array<Record<string, any>> = [
  { id: 1, set: new Set(['value1', 'value2']) },
  { id: 2, set: new Set() },
  { id: 3, set: null }
];