/**
 * Sort Array Test Fixtures
 * 
 * This module provides specialized test fixtures for testing array sorting operations,
 * including pre-sorted arrays, reverse-sorted arrays, arrays with duplicates, and arrays
 * with custom sort orders. These fixtures enable comprehensive testing of custom sorting
 * utilities with different data types and conditions.
 * 
 * @module test/fixtures/array/sort-arrays
 */

/**
 * Interface for objects used in sorting tests
 */
export interface SortableObject {
  id: number;
  name: string;
  value: number;
  priority?: number;
  date?: Date;
  isActive?: boolean;
}

/**
 * Interface for sort test fixtures with input and expected output
 */
export interface SortFixture<T> {
  input: T[];
  expected: T[];
  description: string;
}

// ===== NUMERIC ARRAYS =====

/**
 * Unsorted numeric array for basic sorting tests
 */
export const unsortedNumbers: number[] = [5, 3, 8, 1, 9, 4, 7, 2, 6];

/**
 * Already sorted numeric array (ascending)
 */
export const sortedNumbersAsc: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Already sorted numeric array (descending)
 */
export const sortedNumbersDesc: number[] = [9, 8, 7, 6, 5, 4, 3, 2, 1];

/**
 * Numeric array with duplicate values
 */
export const numbersWithDuplicates: number[] = [5, 3, 8, 1, 5, 3, 9, 1, 8];

/**
 * Expected result after sorting numbersWithDuplicates (ascending)
 */
export const sortedNumbersWithDuplicatesAsc: number[] = [1, 1, 3, 3, 5, 5, 8, 8, 9];

/**
 * Numeric array with negative values
 */
export const numbersWithNegatives: number[] = [5, -3, 8, -1, 0, 4, -7, 2, -6];

/**
 * Expected result after sorting numbersWithNegatives (ascending)
 */
export const sortedNumbersWithNegativesAsc: number[] = [-7, -6, -3, -1, 0, 2, 4, 5, 8];

/**
 * Numeric array with floating point values
 */
export const floatingPointNumbers: number[] = [5.7, 3.1, 8.5, 1.2, 9.9, 4.3, 7.0, 2.8, 6.4];

/**
 * Expected result after sorting floatingPointNumbers (ascending)
 */
export const sortedFloatingPointNumbersAsc: number[] = [1.2, 2.8, 3.1, 4.3, 5.7, 6.4, 7.0, 8.5, 9.9];

/**
 * Numeric array with very large values
 */
export const largeNumbers: number[] = [5000000, 3000000, 8000000, 1000000, 9000000, 4000000, 7000000, 2000000, 6000000];

/**
 * Numeric array with very small values
 */
export const smallNumbers: number[] = [0.0005, 0.0003, 0.0008, 0.0001, 0.0009, 0.0004, 0.0007, 0.0002, 0.0006];

/**
 * Numeric array with a single element
 */
export const singleElementArray: number[] = [42];

/**
 * Empty numeric array
 */
export const emptyNumericArray: number[] = [];

// ===== STRING ARRAYS =====

/**
 * Unsorted string array for basic sorting tests
 */
export const unsortedStrings: string[] = ['banana', 'apple', 'orange', 'grape', 'kiwi', 'pear', 'mango'];

/**
 * Already sorted string array (alphabetical)
 */
export const sortedStringsAsc: string[] = ['apple', 'banana', 'grape', 'kiwi', 'mango', 'orange', 'pear'];

/**
 * Already sorted string array (reverse alphabetical)
 */
export const sortedStringsDesc: string[] = ['pear', 'orange', 'mango', 'kiwi', 'grape', 'banana', 'apple'];

/**
 * String array with mixed case
 */
export const mixedCaseStrings: string[] = ['Banana', 'apple', 'Orange', 'grape', 'Kiwi', 'pear', 'Mango'];

/**
 * Expected result after case-insensitive sorting of mixedCaseStrings
 */
export const sortedMixedCaseStringsAsc: string[] = ['apple', 'Banana', 'grape', 'Kiwi', 'Mango', 'Orange', 'pear'];

/**
 * String array with duplicate values
 */
export const stringsWithDuplicates: string[] = ['banana', 'apple', 'orange', 'apple', 'kiwi', 'banana', 'mango'];

/**
 * Expected result after sorting stringsWithDuplicates
 */
export const sortedStringsWithDuplicatesAsc: string[] = ['apple', 'apple', 'banana', 'banana', 'kiwi', 'mango', 'orange'];

/**
 * String array with special characters
 */
export const stringsWithSpecialChars: string[] = ['café', 'résumé', 'naïve', 'über', 'piñata', 'jalapeño'];

/**
 * String array with varying lengths
 */
export const stringsWithVaryingLengths: string[] = ['a', 'ab', 'abc', 'abcd', 'abcde', 'abcdef'];

/**
 * String array with numeric strings
 */
export const numericStrings: string[] = ['10', '2', '300', '40', '5', '1000'];

/**
 * Expected result after natural sorting of numericStrings
 */
export const sortedNumericStringsNatural: string[] = ['2', '5', '10', '40', '300', '1000'];

/**
 * Expected result after lexicographical sorting of numericStrings
 */
export const sortedNumericStringsLexical: string[] = ['10', '1000', '2', '300', '40', '5'];

// ===== OBJECT ARRAYS =====

/**
 * Array of objects for testing sorting by a single property
 */
export const unsortedObjects: SortableObject[] = [
  { id: 5, name: 'Echo', value: 50 },
  { id: 3, name: 'Charlie', value: 30 },
  { id: 8, name: 'Hotel', value: 80 },
  { id: 1, name: 'Alpha', value: 10 },
  { id: 9, name: 'India', value: 90 },
  { id: 4, name: 'Delta', value: 40 },
  { id: 7, name: 'Golf', value: 70 },
  { id: 2, name: 'Bravo', value: 20 },
  { id: 6, name: 'Foxtrot', value: 60 }
];

/**
 * Expected result after sorting unsortedObjects by id (ascending)
 */
export const objectsSortedById: SortableObject[] = [
  { id: 1, name: 'Alpha', value: 10 },
  { id: 2, name: 'Bravo', value: 20 },
  { id: 3, name: 'Charlie', value: 30 },
  { id: 4, name: 'Delta', value: 40 },
  { id: 5, name: 'Echo', value: 50 },
  { id: 6, name: 'Foxtrot', value: 60 },
  { id: 7, name: 'Golf', value: 70 },
  { id: 8, name: 'Hotel', value: 80 },
  { id: 9, name: 'India', value: 90 }
];

/**
 * Expected result after sorting unsortedObjects by name (ascending)
 */
export const objectsSortedByName: SortableObject[] = [
  { id: 1, name: 'Alpha', value: 10 },
  { id: 2, name: 'Bravo', value: 20 },
  { id: 3, name: 'Charlie', value: 30 },
  { id: 4, name: 'Delta', value: 40 },
  { id: 5, name: 'Echo', value: 50 },
  { id: 6, name: 'Foxtrot', value: 60 },
  { id: 7, name: 'Golf', value: 70 },
  { id: 8, name: 'Hotel', value: 80 },
  { id: 9, name: 'India', value: 90 }
];

/**
 * Expected result after sorting unsortedObjects by value (descending)
 */
export const objectsSortedByValueDesc: SortableObject[] = [
  { id: 9, name: 'India', value: 90 },
  { id: 8, name: 'Hotel', value: 80 },
  { id: 7, name: 'Golf', value: 70 },
  { id: 6, name: 'Foxtrot', value: 60 },
  { id: 5, name: 'Echo', value: 50 },
  { id: 4, name: 'Delta', value: 40 },
  { id: 3, name: 'Charlie', value: 30 },
  { id: 2, name: 'Bravo', value: 20 },
  { id: 1, name: 'Alpha', value: 10 }
];

/**
 * Array of objects with multiple properties for complex sorting
 */
export const complexObjects: SortableObject[] = [
  { id: 5, name: 'Echo', value: 50, priority: 2, isActive: true, date: new Date('2023-05-15') },
  { id: 3, name: 'Charlie', value: 30, priority: 1, isActive: false, date: new Date('2023-03-10') },
  { id: 8, name: 'Hotel', value: 80, priority: 3, isActive: true, date: new Date('2023-08-22') },
  { id: 1, name: 'Alpha', value: 10, priority: 1, isActive: true, date: new Date('2023-01-05') },
  { id: 9, name: 'India', value: 90, priority: 3, isActive: false, date: new Date('2023-09-30') },
  { id: 4, name: 'Delta', value: 40, priority: 2, isActive: true, date: new Date('2023-04-12') },
  { id: 7, name: 'Golf', value: 70, priority: 2, isActive: false, date: new Date('2023-07-18') },
  { id: 2, name: 'Bravo', value: 20, priority: 1, isActive: true, date: new Date('2023-02-08') },
  { id: 6, name: 'Foxtrot', value: 60, priority: 3, isActive: false, date: new Date('2023-06-25') }
];

/**
 * Objects sorted first by priority (ascending) then by value (descending)
 */
export const objectsSortedByPriorityThenValueDesc: SortableObject[] = [
  { id: 1, name: 'Alpha', value: 10, priority: 1, isActive: true, date: new Date('2023-01-05') },
  { id: 3, name: 'Charlie', value: 30, priority: 1, isActive: false, date: new Date('2023-03-10') },
  { id: 2, name: 'Bravo', value: 20, priority: 1, isActive: true, date: new Date('2023-02-08') },
  { id: 7, name: 'Golf', value: 70, priority: 2, isActive: false, date: new Date('2023-07-18') },
  { id: 5, name: 'Echo', value: 50, priority: 2, isActive: true, date: new Date('2023-05-15') },
  { id: 4, name: 'Delta', value: 40, priority: 2, isActive: true, date: new Date('2023-04-12') },
  { id: 9, name: 'India', value: 90, priority: 3, isActive: false, date: new Date('2023-09-30') },
  { id: 8, name: 'Hotel', value: 80, priority: 3, isActive: true, date: new Date('2023-08-22') },
  { id: 6, name: 'Foxtrot', value: 60, priority: 3, isActive: false, date: new Date('2023-06-25') }
];

/**
 * Objects sorted by isActive (true first) then by name
 */
export const objectsSortedByActiveStatusThenName: SortableObject[] = [
  { id: 1, name: 'Alpha', value: 10, priority: 1, isActive: true, date: new Date('2023-01-05') },
  { id: 2, name: 'Bravo', value: 20, priority: 1, isActive: true, date: new Date('2023-02-08') },
  { id: 4, name: 'Delta', value: 40, priority: 2, isActive: true, date: new Date('2023-04-12') },
  { id: 5, name: 'Echo', value: 50, priority: 2, isActive: true, date: new Date('2023-05-15') },
  { id: 8, name: 'Hotel', value: 80, priority: 3, isActive: true, date: new Date('2023-08-22') },
  { id: 3, name: 'Charlie', value: 30, priority: 1, isActive: false, date: new Date('2023-03-10') },
  { id: 6, name: 'Foxtrot', value: 60, priority: 3, isActive: false, date: new Date('2023-06-25') },
  { id: 7, name: 'Golf', value: 70, priority: 2, isActive: false, date: new Date('2023-07-18') },
  { id: 9, name: 'India', value: 90, priority: 3, isActive: false, date: new Date('2023-09-30') }
];

/**
 * Objects sorted by date (ascending)
 */
export const objectsSortedByDate: SortableObject[] = [
  { id: 1, name: 'Alpha', value: 10, priority: 1, isActive: true, date: new Date('2023-01-05') },
  { id: 2, name: 'Bravo', value: 20, priority: 1, isActive: true, date: new Date('2023-02-08') },
  { id: 3, name: 'Charlie', value: 30, priority: 1, isActive: false, date: new Date('2023-03-10') },
  { id: 4, name: 'Delta', value: 40, priority: 2, isActive: true, date: new Date('2023-04-12') },
  { id: 5, name: 'Echo', value: 50, priority: 2, isActive: true, date: new Date('2023-05-15') },
  { id: 6, name: 'Foxtrot', value: 60, priority: 3, isActive: false, date: new Date('2023-06-25') },
  { id: 7, name: 'Golf', value: 70, priority: 2, isActive: false, date: new Date('2023-07-18') },
  { id: 8, name: 'Hotel', value: 80, priority: 3, isActive: true, date: new Date('2023-08-22') },
  { id: 9, name: 'India', value: 90, priority: 3, isActive: false, date: new Date('2023-09-30') }
];

/**
 * Array of objects with missing properties
 */
export const objectsWithMissingProperties: SortableObject[] = [
  { id: 5, name: 'Echo', value: 50, priority: 2 },
  { id: 3, name: 'Charlie', value: 30 },
  { id: 8, name: 'Hotel', value: 80, priority: 3, isActive: true },
  { id: 1, name: 'Alpha', value: 10, isActive: true },
  { id: 9, name: 'India', value: 90, priority: 3, date: new Date('2023-09-30') },
  { id: 4, name: 'Delta', value: 40, date: new Date('2023-04-12') },
  { id: 7, name: 'Golf', value: 70, priority: 2, isActive: false },
  { id: 2, name: 'Bravo', value: 20, priority: 1, date: new Date('2023-02-08') },
  { id: 6, name: 'Foxtrot', value: 60 }
];

// ===== SORT FIXTURES =====

/**
 * Collection of numeric array sort fixtures for testing sort functions
 */
export const numericSortFixtures: SortFixture<number>[] = [
  {
    input: unsortedNumbers,
    expected: sortedNumbersAsc,
    description: 'Basic numeric array sorting (ascending)'
  },
  {
    input: unsortedNumbers,
    expected: sortedNumbersDesc,
    description: 'Basic numeric array sorting (descending)'
  },
  {
    input: numbersWithDuplicates,
    expected: sortedNumbersWithDuplicatesAsc,
    description: 'Numeric array with duplicates (ascending)'
  },
  {
    input: numbersWithNegatives,
    expected: sortedNumbersWithNegativesAsc,
    description: 'Numeric array with negative values (ascending)'
  },
  {
    input: floatingPointNumbers,
    expected: sortedFloatingPointNumbersAsc,
    description: 'Floating point numbers (ascending)'
  },
  {
    input: singleElementArray,
    expected: singleElementArray,
    description: 'Single element array (should remain unchanged)'
  },
  {
    input: emptyNumericArray,
    expected: emptyNumericArray,
    description: 'Empty array (should remain empty)'
  }
];

/**
 * Collection of string array sort fixtures for testing sort functions
 */
export const stringSortFixtures: SortFixture<string>[] = [
  {
    input: unsortedStrings,
    expected: sortedStringsAsc,
    description: 'Basic string array sorting (ascending)'
  },
  {
    input: unsortedStrings,
    expected: sortedStringsDesc,
    description: 'Basic string array sorting (descending)'
  },
  {
    input: mixedCaseStrings,
    expected: sortedMixedCaseStringsAsc,
    description: 'Mixed case string array (case-insensitive, ascending)'
  },
  {
    input: stringsWithDuplicates,
    expected: sortedStringsWithDuplicatesAsc,
    description: 'String array with duplicates (ascending)'
  },
  {
    input: numericStrings,
    expected: sortedNumericStringsLexical,
    description: 'Numeric strings sorted lexicographically'
  },
  {
    input: numericStrings,
    expected: sortedNumericStringsNatural,
    description: 'Numeric strings sorted naturally'
  }
];

/**
 * Collection of object array sort fixtures for testing sort functions
 */
export const objectSortFixtures: SortFixture<SortableObject>[] = [
  {
    input: unsortedObjects,
    expected: objectsSortedById,
    description: 'Objects sorted by id (ascending)'
  },
  {
    input: unsortedObjects,
    expected: objectsSortedByName,
    description: 'Objects sorted by name (ascending)'
  },
  {
    input: unsortedObjects,
    expected: objectsSortedByValueDesc,
    description: 'Objects sorted by value (descending)'
  },
  {
    input: complexObjects,
    expected: objectsSortedByPriorityThenValueDesc,
    description: 'Objects sorted by priority (ascending) then by value (descending)'
  },
  {
    input: complexObjects,
    expected: objectsSortedByActiveStatusThenName,
    description: 'Objects sorted by active status (true first) then by name'
  },
  {
    input: complexObjects,
    expected: objectsSortedByDate,
    description: 'Objects sorted by date (ascending)'
  }
];

/**
 * Collection of all sort fixtures for comprehensive testing
 */
export const allSortFixtures = {
  numeric: numericSortFixtures,
  string: stringSortFixtures,
  object: objectSortFixtures
};