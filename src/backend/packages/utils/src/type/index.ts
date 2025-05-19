/**
 * Type utility package providing type guards, predicates, assertions, and conversion utilities.
 * 
 * This module centralizes all type-related utilities for consistent type checking and manipulation
 * across the AUSTA SuperApp. It enables consumers to import any type utility with a single import
 * statement, improving code organization and reducing import complexity.
 * 
 * @packageDocumentation
 */

/**
 * Type guard functions for runtime type checking.
 * 
 * These functions check if values match specific types (string, number, boolean, array, object, etc.)
 * at runtime, improving type safety especially for values from external sources.
 * 
 * @example
 * ```typescript
 * import { isString, isNumber, isObject } from '@austa/utils/type';
 * 
 * if (isString(value)) {
 *   // TypeScript knows value is a string here
 *   console.log(value.toUpperCase());
 * }
 * ```
 */
export * from './guard';

/**
 * Type assertion utilities that enforce type constraints at runtime.
 * 
 * These functions throw descriptive errors when values don't match expected types,
 * helping detect type errors early in the execution flow.
 * 
 * @example
 * ```typescript
 * import { assertString, assertNever } from '@austa/utils/type';
 * 
 * function processData(data: unknown) {
 *   assertString(data, 'Data must be a string');
 *   // TypeScript knows data is a string here
 *   return data.toUpperCase();
 * }
 * ```
 */
export * from './assertions';

/**
 * Type predicates for narrowing types in a type-safe way during runtime checks.
 * 
 * These predicates serve as type guards that inform the TypeScript compiler about
 * the resulting type when the function returns true.
 * 
 * @example
 * ```typescript
 * import { isNonEmptyArray, hasProperty } from '@austa/utils/type';
 * 
 * if (isNonEmptyArray(items)) {
 *   // TypeScript knows items is a non-empty array here
 *   const first = items[0]; // Safe access
 * }
 * ```
 */
export * from './predicate';

/**
 * Type conversion utilities for safely transforming values between different types.
 * 
 * Unlike native type casting, these functions handle edge cases like null values,
 * invalid inputs, and type mismatches, preventing runtime errors during data processing.
 * 
 * @example
 * ```typescript
 * import { toString, toNumber, toBoolean } from '@austa/utils/type';
 * 
 * const id = toNumber(req.params.id, 0); // Safely convert to number with default
 * const name = toString(data.name, ''); // Safely convert to string with default
 * const isActive = toBoolean(config.isActive, false); // Safely convert to boolean with default
 * ```
 */
export * from './conversion';