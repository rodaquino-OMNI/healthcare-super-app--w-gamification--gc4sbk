/**
 * @austa/utils/test/fixtures/type
 * 
 * Test fixtures for type utility functions providing standardized test data for type checking,
 * assertions, conversions, and predicates. These fixtures ensure consistent and comprehensive
 * testing across all journey services.
 *
 * @packageDocumentation
 */

/**
 * Test fixtures for type guard functions (isString, isNumber, isBoolean, etc.).
 * Contains sample data for both positive and negative test cases, including edge cases.
 * 
 * @example
 * ```typescript
 * import { validStrings, invalidStrings, edgeCaseNumbers } from '@austa/utils/test/fixtures/type/guard';
 * 
 * describe('isString', () => {
 *   it.each(validStrings)('should return true for valid string %s', (value) => {
 *     expect(isString(value)).toBe(true);
 *   });
 * 
 *   it.each(invalidStrings)('should return false for invalid string %s', (value) => {
 *     expect(isString(value)).toBe(false);
 *   });
 * });
 * ```
 */
export * from './guard-fixtures';

/**
 * Test fixtures for type assertion functions (assertString, assertNumber, etc.).
 * Includes valid and invalid values for each assertion type, along with expected error scenarios.
 * 
 * @example
 * ```typescript
 * import { validObjects, invalidObjects, assertionErrorMessages } from '@austa/utils/test/fixtures/type/assertion';
 * 
 * describe('assertObject', () => {
 *   it.each(validObjects)('should not throw for valid object %s', (value) => {
 *     expect(() => assertObject(value)).not.toThrow();
 *   });
 * 
 *   it.each(invalidObjects)('should throw for invalid object %s', (value) => {
 *     expect(() => assertObject(value)).toThrow(TypeError);
 *   });
 * 
 *   it('should throw with custom error message', () => {
 *     const message = assertionErrorMessages.object;
 *     expect(() => assertObject(null, message)).toThrow(message);
 *   });
 * });
 * ```
 */
export * from './assertion-fixtures';

/**
 * Test fixtures for type conversion functions (toString, toNumber, toBoolean, etc.).
 * Provides diverse input values with expected conversion results, including edge cases.
 * 
 * @example
 * ```typescript
 * import { stringConversions, numberConversions } from '@austa/utils/test/fixtures/type/conversion';
 * 
 * describe('toString', () => {
 *   it.each(stringConversions)('should convert %s to expected string result', (input, expected) => {
 *     expect(toString(input)).toBe(expected);
 *   });
 * 
 *   it('should use default value for null or undefined', () => {
 *     const defaultValue = 'default';
 *     expect(toString(null, defaultValue)).toBe(defaultValue);
 *     expect(toString(undefined, defaultValue)).toBe(defaultValue);
 *   });
 * });
 * ```
 */
export * from './conversion-fixtures';

/**
 * Test fixtures for type predicate functions (isNonEmptyArray, hasProperty, etc.).
 * Contains union types, discriminated unions, and complex data structures for type narrowing tests.
 * 
 * @example
 * ```typescript
 * import { nonEmptyArrays, emptyArrays, objectsWithProperty } from '@austa/utils/test/fixtures/type/predicate';
 * 
 * describe('isNonEmptyArray', () => {
 *   it.each(nonEmptyArrays)('should return true for non-empty array %s', (value) => {
 *     expect(isNonEmptyArray(value)).toBe(true);
 *   });
 * 
 *   it.each(emptyArrays)('should return false for empty array %s', (value) => {
 *     expect(isNonEmptyArray(value)).toBe(false);
 *   });
 * });
 * 
 * describe('hasProperty', () => {
 *   it.each(objectsWithProperty)('should detect property %s in object', (obj, prop) => {
 *     expect(hasProperty(obj, prop)).toBe(true);
 *   });
 * });
 * ```
 */
export * from './predicate-fixtures';

// Namespace exports for organizing fixtures by their purpose
// This makes it easier to import related fixtures together

import * as guard from './guard-fixtures';
import * as assertion from './assertion-fixtures';
import * as conversion from './conversion-fixtures';
import * as predicate from './predicate-fixtures';

/**
 * Organized namespaces for type test fixtures.
 * These namespaces group related fixtures by their purpose, making it easier
 * to import and use them in tests.
 */
export { guard, assertion, conversion, predicate };

/**
 * Common test fixtures used across multiple test files.
 * These are the most frequently used fixtures, exported directly for convenience.
 */
export {
  // Guard fixtures
  validStrings,
  invalidStrings,
  validNumbers,
  invalidNumbers,
  validBooleans,
  invalidBooleans,
  validArrays,
  invalidArrays,
  validObjects,
  invalidObjects,
  validFunctions,
  invalidFunctions,
  validDates,
  invalidDates,
  emptyValues,
  nonEmptyValues
} from './guard-fixtures';

export {
  // Assertion fixtures
  assertionErrorMessages,
  validAssertionInputs,
  invalidAssertionInputs
} from './assertion-fixtures';

export {
  // Conversion fixtures
  stringConversions,
  numberConversions,
  booleanConversions,
  arrayConversions,
  dateConversions,
  conversionEdgeCases
} from './conversion-fixtures';

export {
  // Predicate fixtures
  nonEmptyArrays,
  emptyArrays,
  nonEmptyStrings,
  emptyStrings,
  nonEmptyObjects,
  emptyObjects,
  objectsWithProperty,
  objectsWithoutProperty,
  classInstances
} from './predicate-fixtures';