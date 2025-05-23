/**
 * @austa/utils/type
 * 
 * Type utility module providing standardized type checking, assertions, and conversion functions.
 * This module helps maintain type safety throughout the application, especially when working with
 * data from external sources, API responses, or user inputs.
 *
 * @packageDocumentation
 */

/**
 * Type guard functions for runtime type checking.
 * These functions return boolean values indicating whether a value matches a specific type.
 * 
 * @example
 * ```typescript
 * import { isString, isNumber, isArray } from '@austa/utils/type/guard';
 * 
 * if (isString(value)) {
 *   // TypeScript knows value is a string here
 *   console.log(value.toUpperCase());
 * }
 * ```
 */
export * from './guard';

/**
 * Type predicates for narrowing types in a type-safe way.
 * These functions serve as TypeScript type guards that inform the compiler about the resulting type.
 * 
 * @example
 * ```typescript
 * import { isNonEmptyArray, hasProperty } from '@austa/utils/type/predicate';
 * 
 * if (isNonEmptyArray(items)) {
 *   // TypeScript knows items is a non-empty array here
 *   const firstItem = items[0]; // Safe access
 * }
 * ```
 */
export * from './predicate';

/**
 * Type conversion utilities for safely transforming values between different types.
 * These functions handle edge cases like null values, invalid inputs, and type mismatches.
 * 
 * @example
 * ```typescript
 * import { toString, toNumber, toBoolean } from '@austa/utils/type/conversion';
 * 
 * const id = toString(userId, ''); // Safely convert to string with default
 * const age = toNumber(ageInput, 0); // Safely convert to number with default
 * ```
 */
export * from './conversion';

/**
 * Type assertion utilities for enforcing type constraints at runtime.
 * These functions throw descriptive errors when values don't match expected types.
 * 
 * @example
 * ```typescript
 * import { assertString, assertNumber, assertNever } from '@austa/utils/type/assertions';
 * 
 * function processUser(user: unknown) {
 *   assertObject(user, 'User must be an object');
 *   assertString(user.name, 'User name must be a string');
 *   assertNumber(user.age, 'User age must be a number');
 * }
 * ```
 */
export * from './assertions';

// Type namespace for backward compatibility
// This maintains compatibility with existing code while encouraging
// migration to the direct imports from specific modules

/**
 * @deprecated Import directly from '@austa/utils/type/guard' instead
 */
import * as guard from './guard';

/**
 * @deprecated Import directly from '@austa/utils/type/predicate' instead
 */
import * as predicate from './predicate';

/**
 * @deprecated Import directly from '@austa/utils/type/conversion' instead
 */
import * as conversion from './conversion';

/**
 * @deprecated Import directly from '@austa/utils/type/assertions' instead
 */
import * as assertions from './assertions';

// Export namespaces for backward compatibility
export { guard, predicate, conversion, assertions };

// Re-export commonly used type utilities for convenience
// These direct exports maintain backward compatibility while providing
// a simpler import path for frequently used utilities

/**
 * @deprecated Import from '@austa/utils/type/guard' instead
 */
export { isString, isNumber, isBoolean, isArray, isObject, isFunction, isNull, isUndefined, isNullOrUndefined, isDate, isRegExp, isPromise, isEmpty } from './guard';

/**
 * @deprecated Import from '@austa/utils/type/predicate' instead
 */
export { isNonEmptyArray, isNonEmptyString, isNonEmptyObject, hasProperty, isInstanceOf } from './predicate';

/**
 * @deprecated Import from '@austa/utils/type/conversion' instead
 */
export { toString, toNumber, toBoolean, toArray, toDate } from './conversion';

/**
 * @deprecated Import from '@austa/utils/type/assertions' instead
 */
export { assertString, assertNumber, assertBoolean, assertArray, assertObject, assertFunction, assertDate, assertNever } from './assertions';