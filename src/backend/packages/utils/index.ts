/**
 * @austa/utils
 * 
 * A comprehensive utility library for the AUSTA SuperApp, providing standardized
 * utility functions across all journey services. This package centralizes common
 * operations to ensure consistent behavior, reduce code duplication, and improve
 * maintainability.
 * 
 * The utilities are organized into logical categories (array, date, env, http, object,
 * string, type, validation) to improve discoverability and enable tree-shaking.
 * 
 * @packageDocumentation
 */

/**
 * Array utilities for transforming, filtering, grouping, and chunking arrays.
 * @module array
 */
export * as array from './src/array';

/**
 * Date utilities for parsing, formatting, comparing, and manipulating dates.
 * Includes journey-specific date formatting and localization support.
 * @module date
 */
export * as date from './src/date';

/**
 * Environment utilities for accessing, validating, and transforming environment variables.
 * Includes journey-specific configuration and type-safe environment access.
 * @module env
 */
export * as env from './src/env';

/**
 * HTTP utilities for making secure HTTP requests, including SSRF protection
 * and standardized service-to-service communication.
 * @module http
 */
export * as http from './src/http';

/**
 * Object utilities for transforming, comparing, merging, and cloning objects.
 * @module object
 */
export * as object from './src/object';

/**
 * String utilities for formatting, validating, and manipulating strings.
 * Includes Brazilian-specific validation for CPF and other formats.
 * @module string
 */
export * as string from './src/string';

/**
 * Type utilities for runtime type checking, type guards, assertions, and conversions.
 * @module type
 */
export * as type from './src/type';

/**
 * Validation utilities for validating data structures, including schema-based validation
 * and specialized validators for common data types.
 * @module validation
 */
export * as validation from './src/validation';

// Direct exports for backward compatibility and convenience

/**
 * Re-export array utilities for direct import
 * @example import { chunk, groupBy } from '@austa/utils';
 */
export * from './src/array';

/**
 * Re-export date utilities for direct import
 * @example import { formatDate, parseDate } from '@austa/utils';
 */
export * from './src/date';

/**
 * Re-export environment utilities for direct import
 * @example import { getEnv, getRequiredEnv } from '@austa/utils';
 */
export * from './src/env';

/**
 * Re-export HTTP utilities for direct import
 * @example import { createHttpClient, createSecureHttpClient } from '@austa/utils';
 */
export * from './src/http';

/**
 * Re-export object utilities for direct import
 * @example import { deepMerge, deepClone } from '@austa/utils';
 */
export * from './src/object';

/**
 * Re-export string utilities for direct import
 * @example import { capitalizeFirstLetter, isValidCPF } from '@austa/utils';
 */
export * from './src/string';

/**
 * Re-export type utilities for direct import
 * @example import { isString, isNumber } from '@austa/utils';
 */
export * from './src/type';

/**
 * Re-export validation utilities for direct import
 * @example import { validateEmail, validateDate } from '@austa/utils';
 */
export * from './src/validation';