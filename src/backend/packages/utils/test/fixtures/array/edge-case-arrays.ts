/**
 * Edge Case Array Test Fixtures
 * 
 * This file contains test fixtures specifically for edge case scenarios when working with arrays.
 * These fixtures ensure robust testing of array utilities against problematic inputs and edge conditions.
 */

/**
 * Arrays with null and undefined values
 */
export const arrayWithNulls = [1, null, 2, null, 3];
export const arrayWithUndefined = [1, undefined, 2, undefined, 3];
export const arrayWithMixedNullUndefined = [null, undefined, null, undefined];
export const arrayWithNullsAndValues = [null, 'value', null, 42, null];

/**
 * Arrays with NaN and special numeric values
 */
export const arrayWithNaN = [1, NaN, 2, NaN, 3];
export const arrayWithSpecialNumbers = [0, Infinity, -Infinity, NaN, Number.MAX_VALUE, Number.MIN_VALUE];

/**
 * Arrays with empty strings and falsy values
 */
export const arrayWithEmptyStrings = ['value', '', 'another', '', 'third'];
export const arrayWithFalsyValues = [0, '', false, null, undefined, NaN];

/**
 * Mixed-type arrays
 */
export const mixedTypeArray = [1, 'string', true, {}, [], null, undefined, () => {}];
export const mixedObjectsArray = [
  { id: 1, name: 'Item 1' },
  { id: 2 }, // Missing name
  { name: 'Item 3' }, // Missing id
  {}, // Empty object
  null,
  { id: null, name: undefined },
];

/**
 * Empty and single-element arrays
 */
export const emptyArray: any[] = [];
export const singleElementArray = [42];
export const singleNullArray = [null];
export const singleUndefinedArray = [undefined];

/**
 * Arrays with duplicate values
 */
export const arrayWithDuplicates = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
export const arrayWithDuplicateObjects = [
  { id: 1, name: 'Item 1' },
  { id: 1, name: 'Item 1' }, // Duplicate
  { id: 2, name: 'Item 2' },
  { id: 2, name: 'Item 2' }, // Duplicate
];

/**
 * Deeply nested arrays (for testing flattenDeep)
 */
export const nestedArray = [1, [2, [3, [4, [5]]]], 6, [7, 8]];
export const nestedArrayWithNulls = [1, [2, null, [3, [null, [5]]]], 6, [null, 8]];
export const nestedEmptyArrays = [[], [[]], [[], [[]]], []];
export const nestedMixedTypesArray = [1, ['string', [true, [{ key: 'value' }, [null]]]], undefined];

/**
 * Arrays of objects with missing or problematic properties (for pluck, filterByProperties)
 */
export const objectsWithMissingProps = [
  { id: 1, name: 'Item 1', value: 100 },
  { id: 2, value: 200 }, // Missing name
  { id: 3, name: 'Item 3' }, // Missing value
  { name: 'Item 4', value: 400 }, // Missing id
  { id: 5, name: null, value: 500 }, // Null property
  { id: 6, name: 'Item 6', value: undefined }, // Undefined property
];

/**
 * Arrays with objects containing nested properties (for deep property access)
 */
export const objectsWithNestedProps = [
  { id: 1, user: { name: 'John', profile: { age: 30 } } },
  { id: 2, user: { name: 'Jane', profile: null } }, // Null nested object
  { id: 3, user: null }, // Null property that contains nested properties
  { id: 4, user: { name: 'Bob', profile: { age: undefined } } }, // Undefined nested property
  { id: 5, user: { profile: { age: 25 } } }, // Missing intermediate property
];

/**
 * Arrays for testing chunking functions
 */
export const arrayForChunking = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const unevenArrayForChunking = [1, 2, 3, 4, 5, 6, 7];
export const emptyArrayForChunking: number[] = [];
export const hugeArrayForChunking = Array.from({ length: 1000 }, (_, i) => i + 1);

/**
 * Arrays for testing grouping functions
 */
export const arrayForGrouping = [
  { category: 'A', value: 1 },
  { category: 'B', value: 2 },
  { category: 'A', value: 3 },
  { category: 'C', value: 4 },
  { category: 'B', value: 5 },
  { category: null, value: 6 }, // Null category
  { value: 7 }, // Missing category
  { category: undefined, value: 8 }, // Undefined category
];

/**
 * Arrays for testing filtering functions
 */
export const arrayForFiltering = [
  { id: 1, active: true, score: 85 },
  { id: 2, active: false, score: 90 },
  { id: 3, active: true, score: 75 },
  { id: 4, active: null, score: 80 }, // Null property
  { id: 5, score: 95 }, // Missing property
  { id: 6, active: undefined, score: 70 }, // Undefined property
];

/**
 * Arrays with special characters and internationalization concerns
 */
export const arrayWithSpecialChars = [
  { id: 1, name: 'Item with spaces' },
  { id: 2, name: 'Item-with-dashes' },
  { id: 3, name: 'Item_with_underscores' },
  { id: 4, name: 'Item.with.dots' },
  { id: 5, name: 'Item+with+plus' },
  { id: 6, name: 'Item/with/slashes' },
  { id: 7, name: 'Item\\with\\backslashes' },
];

export const arrayWithInternationalChars = [
  { id: 1, name: 'Café' }, // Accented characters
  { id: 2, name: '你好' }, // Chinese
  { id: 3, name: 'こんにちは' }, // Japanese
  { id: 4, name: 'Привет' }, // Cyrillic
  { id: 5, name: 'مرحبا' }, // Arabic
];

/**
 * Arrays with date objects (for testing date-related operations)
 */
export const arrayWithDates = [
  { id: 1, date: new Date('2023-01-01') },
  { id: 2, date: new Date('2023-01-02') },
  { id: 3, date: new Date('Invalid Date') }, // Invalid date
  { id: 4, date: null }, // Null date
  { id: 5, date: undefined }, // Undefined date
  { id: 6, date: '2023-01-06' }, // String date
];

/**
 * Arrays with very large values (for testing performance and memory issues)
 */
export const arrayWithLargeStrings = [
  { id: 1, value: 'A'.repeat(1000) },
  { id: 2, value: 'B'.repeat(10000) },
  { id: 3, value: 'C'.repeat(100) },
];

/**
 * Arrays with potential security concerns (for testing sanitization)
 */
export const arrayWithScriptTags = [
  { id: 1, content: 'Normal text' },
  { id: 2, content: '<script>alert("XSS");</script>' },
  { id: 3, content: 'Text with <img src="x" onerror="alert(1)">' },
  { id: 4, content: 'javascript:alert("XSS")' },
];

/**
 * Arrays with circular references (uncomment if needed, but be careful with serialization)
 */
/*
export const createCircularArray = () => {
  const circular: any[] = [1, 2, 3];
  circular.push(circular); // Creates a circular reference
  return circular;
};

export const createCircularObject = () => {
  const obj: any = { id: 1, name: 'Circular' };
  const arr = [obj];
  obj.self = obj; // Circular reference to itself
  obj.array = arr; // Circular reference to containing array
  return arr;
};
*/