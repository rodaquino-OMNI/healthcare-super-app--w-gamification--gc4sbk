/**
 * @austa/utils
 * 
 * Centralized utility package providing standardized utility functions for all AUSTA SuperApp services.
 * This package implements a modular architecture with specialized utility categories to enable
 * tree-shaking and optimize bundle size.
 *
 * @packageDocumentation
 */

/**
 * Array utilities for transforming, grouping, filtering, and chunking arrays.
 * @module array
 */
export * as array from './array';

/**
 * Date utilities for formatting, parsing, comparing, and manipulating dates.
 * @module date
 */
export * as date from './date';

/**
 * Environment variable utilities for accessing, validating, and transforming environment configuration.
 * @module env
 */
export * as env from './env';

/**
 * HTTP client utilities for making secure HTTP requests with SSRF protection.
 * @module http
 */
export * as http from './http';

/**
 * Object utilities for transforming, comparing, merging, and cloning objects.
 * @module object
 */
export * as object from './object';

/**
 * String utilities for formatting, validating, and manipulating strings.
 * @module string
 */
export * as string from './string';

/**
 * Type utilities for type checking, assertions, and conversions.
 * @module type
 */
export * as type from './type';

/**
 * Validation utilities for validating data structures and input values.
 * @module validation
 */
export * as validation from './validation';

// Direct exports of commonly used utilities for backward compatibility
// These exports maintain compatibility with existing code while encouraging
// migration to the new namespaced imports.

/**
 * @deprecated Use array.transform.flattenDeep instead
 */
export { flattenDeep } from './array/transform.util';

/**
 * @deprecated Use array.group.groupBy instead
 */
export { groupBy } from './array/group.util';

/**
 * @deprecated Use date.format.formatDate instead
 */
export { formatDate } from './date/format';

/**
 * @deprecated Use date.format.formatDateTime instead
 */
export { formatDateTime } from './date/format';

/**
 * @deprecated Use date.validation.isValidDate instead
 */
export { isValidDate } from './date/validation';

/**
 * @deprecated Use http.security.createSecureAxios instead
 */
export { createSecureAxios } from './http/security';

/**
 * @deprecated Use http.internal.createInternalApiClient instead
 */
export { createInternalApiClient } from './http/internal';

/**
 * @deprecated Use object.transform.pick instead
 */
export { pick } from './object/transform';

/**
 * @deprecated Use object.transform.omit instead
 */
export { omit } from './object/transform';

/**
 * @deprecated Use string.formatting.capitalizeFirstLetter instead
 */
export { capitalizeFirstLetter } from './string/formatting';

/**
 * @deprecated Use string.formatting.truncate instead
 */
export { truncate } from './string/formatting';

/**
 * @deprecated Use string.validation.isValidCPF instead
 */
export { isValidCPF } from './string/validation';

/**
 * @deprecated Use type.guard.isString instead
 */
export { isString } from './type/guard';

/**
 * @deprecated Use type.guard.isNumber instead
 */
export { isNumber } from './type/guard';

/**
 * @deprecated Use type.guard.isBoolean instead
 */
export { isBoolean } from './type/guard';

/**
 * @deprecated Use type.guard.isArray instead
 */
export { isArray } from './type/guard';

/**
 * @deprecated Use type.guard.isObject instead
 */
export { isObject } from './type/guard';

/**
 * @deprecated Use validation.string.isValidEmail instead
 */
export { isValidEmail } from './validation/string.validator';