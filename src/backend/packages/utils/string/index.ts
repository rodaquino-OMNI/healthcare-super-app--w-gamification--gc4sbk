/**
 * String utilities package entry point.
 * 
 * This file re-exports all string manipulation and validation functions from the package,
 * providing a unified API for consuming modules. It centralizes exports from format.ts
 * and validation.ts, ensuring backward compatibility with existing imports while
 * organizing the code into more specific modules.
 * 
 * @module @austa/utils/string
 */

// Re-export all functions from format module
export { capitalizeFirstLetter, truncate } from './format';

// Re-export all functions from validation module
export { isValidCPF } from './validation';