/**
 * @austa/utils
 * 
 * A comprehensive utility library for the AUSTA SuperApp backend services.
 * This package provides standardized utility functions for common operations
 * across all journey services, ensuring consistent behavior and reducing code duplication.
 * 
 * @packageDocumentation
 */

/**
 * Array utilities for transforming, filtering, grouping, and chunking arrays.
 * @module array
 */
import * as arrayUtils from './src/array';

/**
 * Date utilities for formatting, parsing, comparing, and manipulating dates.
 * Includes journey-specific date formatting and timezone handling.
 * @module date
 */
import * as dateUtils from './src/date';

/**
 * Environment variable utilities for accessing, validating, and transforming
 * environment configuration with journey-specific context.
 * @module env
 */
import * as envUtils from './src/env';

/**
 * HTTP client utilities for making secure HTTP requests with SSRF protection,
 * retry logic, and journey-specific configuration.
 * @module http
 */
import * as httpUtils from './src/http';

/**
 * Object manipulation utilities for transforming, comparing, merging, and cloning
 * complex object structures.
 * @module object
 */
import * as objectUtils from './src/object';

/**
 * String utilities for formatting, validation, and transformation of text data.
 * Includes Brazilian-specific format validation (CPF, etc.).
 * @module string
 */
import * as stringUtils from './src/string';

/**
 * Type utilities for runtime type checking, type guards, type conversion,
 * and type assertions.
 * @module type
 */
import * as typeUtils from './src/type';

/**
 * Validation utilities for ensuring data integrity across all journey services.
 * Includes validators for common data types and integration with validation libraries.
 * @module validation
 */
import * as validationUtils from './src/validation';

// Namespaced exports for better organization
export const array = arrayUtils;
export const date = dateUtils;
export const env = envUtils;
export const http = httpUtils;
export const object = objectUtils;
export const string = stringUtils;
export const type = typeUtils;
export const validation = validationUtils;

// Re-export all utilities from each category for direct imports
export * from './src/array';
export * from './src/date';
export * from './src/env';
export * from './src/http';
export * from './src/object';
export * from './src/string';
export * from './src/type';
export * from './src/validation';

/**
 * @example
 * // Namespaced imports (recommended for clarity)
 * import { array, date, string } from '@austa/utils';
 * 
 * const uniqueItems = array.uniqueBy(items, 'id');
 * const formattedDate = date.formatDate(new Date());
 * const isValidCpf = string.validation.isValidCPF('12345678909');
 * 
 * @example
 * // Direct imports (for specific utilities)
 * import { uniqueBy, formatDate, isValidCPF } from '@austa/utils';
 * 
 * const uniqueItems = uniqueBy(items, 'id');
 * const formattedDate = formatDate(new Date());
 * const isValidCpf = isValidCPF('12345678909');
 */