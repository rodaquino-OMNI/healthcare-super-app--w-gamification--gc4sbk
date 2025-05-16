/**
 * @file Type Test Fixtures Barrel File
 * 
 * This file serves as the central export point for all type-related test fixtures,
 * providing a single import location for test data used across the test suite.
 * 
 * Usage examples:
 * 
 * ```typescript
 * // Import all fixtures
 * import * as typeFixtures from '@austa/utils/test/fixtures/type';
 * 
 * // Import specific fixture namespaces
 * import { guardFixtures, assertionFixtures } from '@austa/utils/test/fixtures/type';
 * 
 * // Import specific fixtures directly
 * import { validStrings, invalidNumbers } from '@austa/utils/test/fixtures/type';
 * ```
 */

// Re-export all fixtures from individual files
import * as guardFixturesInternal from './guard-fixtures';
import * as assertionFixturesInternal from './assertion-fixtures';
import * as conversionFixturesInternal from './conversion-fixtures';
import * as predicateFixturesInternal from './predicate-fixtures';

/**
 * Fixtures for testing type guard functions (isString, isNumber, isBoolean, etc.)
 * 
 * @example
 * ```typescript
 * import { guardFixtures } from '@austa/utils/test/fixtures/type';
 * 
 * describe('isString', () => {
 *   it('should return true for valid strings', () => {
 *     guardFixtures.validStrings.forEach(value => {
 *       expect(isString(value)).toBe(true);
 *     });
 *   });
 * });
 * ```
 */
export const guardFixtures = guardFixturesInternal;

/**
 * Fixtures for testing type assertion functions that enforce type constraints
 * 
 * @example
 * ```typescript
 * import { assertionFixtures } from '@austa/utils/test/fixtures/type';
 * 
 * describe('assertString', () => {
 *   it('should not throw for valid strings', () => {
 *     assertionFixtures.validStrings.forEach(value => {
 *       expect(() => assertString(value)).not.toThrow();
 *     });
 *   });
 * });
 * ```
 */
export const assertionFixtures = assertionFixturesInternal;

/**
 * Fixtures for testing type conversion functions that transform values between types
 * 
 * @example
 * ```typescript
 * import { conversionFixtures } from '@austa/utils/test/fixtures/type';
 * 
 * describe('toString', () => {
 *   it('should convert numbers to strings', () => {
 *     conversionFixtures.numberToStringCases.forEach(({ input, expected }) => {
 *       expect(toString(input)).toBe(expected);
 *     });
 *   });
 * });
 * ```
 */
export const conversionFixtures = conversionFixturesInternal;

/**
 * Fixtures for testing TypeScript type predicates that enable type narrowing
 * 
 * @example
 * ```typescript
 * import { predicateFixtures } from '@austa/utils/test/fixtures/type';
 * 
 * describe('isUserProfile', () => {
 *   it('should narrow type for user profiles', () => {
 *     predicateFixtures.userProfiles.forEach(profile => {
 *       if (isUserProfile(profile)) {
 *         // TypeScript knows profile is UserProfile here
 *         expect(profile.userId).toBeDefined();
 *       }
 *     });
 *   });
 * });
 * ```
 */
export const predicateFixtures = predicateFixturesInternal;

// Direct re-exports of commonly used fixtures for convenience

// Guard fixtures
export const {
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
  validDates,
  invalidDates,
  validFunctions,
  invalidFunctions,
  validPromises,
  invalidPromises,
  emptyValues,
  nonEmptyValues
} = guardFixturesInternal;

// Assertion fixtures
export const {
  assertionErrorCases,
  customErrorMessages,
  nestedObjectFixtures,
  exhaustiveCheckCases
} = assertionFixturesInternal;

// Conversion fixtures
export const {
  stringConversionCases,
  numberConversionCases,
  booleanConversionCases,
  arrayConversionCases,
  dateConversionCases,
  edgeCaseConversions,
  defaultValueCases
} = conversionFixturesInternal;

// Predicate fixtures
export const {
  discriminatedUnionFixtures,
  classInstanceFixtures,
  propertyCheckFixtures,
  nestedTypeFixtures
} = predicateFixturesInternal;