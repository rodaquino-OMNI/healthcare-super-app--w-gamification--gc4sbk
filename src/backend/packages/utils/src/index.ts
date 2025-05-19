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
 * Array utilities for transforming, filtering, grouping, and chunking arrays.
 * @module array
 */
export * from './array';

/**
 * Date utilities for formatting, parsing, comparing, and manipulating dates.
 * @module date
 */
export * from './date';

/**
 * Environment variable utilities for accessing, validating, and transforming environment configuration.
 * @module env
 */
export * from './env';

/**
 * HTTP client utilities with security features and standardized configuration.
 * @module http
 */
export * from './http';

/**
 * Object utilities for transforming, comparing, merging, and cloning objects.
 * @module object
 */
export * from './object';

/**
 * String utilities for formatting, validating, and manipulating strings.
 * @module string
 */
export * from './string';

/**
 * Type utilities for type checking, conversion, and runtime type safety.
 * @module type
 */
export * from './type';

/**
 * Validation utilities for validating various data types and structures.
 * @module validation
 */
export * from './validation';