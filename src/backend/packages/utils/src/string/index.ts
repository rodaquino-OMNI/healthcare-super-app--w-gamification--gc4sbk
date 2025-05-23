/**
 * @file String Utility Functions
 * @module @austa/utils/string
 * @description Exports all string utility functions from formatting and validation modules.
 * This central export point simplifies imports by allowing consumers to import from a single
 * location while maintaining an organized internal structure.
 */

/**
 * String formatting utilities for consistent text transformation across all journey services.
 * These utilities ensure consistent text presentation across all platform components.
 * 
 * @example
 * ```typescript
 * import { capitalizeFirstLetter, truncate } from '@austa/utils/string';
 * 
 * // Capitalize first letter
 * const capitalized = capitalizeFirstLetter('hello world'); // 'Hello world'
 * 
 * // Truncate long text
 * const truncated = truncate('This is a long text', 10); // 'This is a ...'
 * ```
 */
export * from './formatting';

/**
 * String validation utilities focused on business rules validation, particularly for
 * Brazilian-specific formats. These utilities ensure consistent validation behavior
 * across all journey services and prevent invalid data entry.
 * 
 * @example
 * ```typescript
 * import { validateCPF, validateEmail, isEmpty } from '@austa/utils/string';
 * 
 * // Validate Brazilian CPF
 * const isValidCpf = validateCPF('123.456.789-09'); // false (invalid CPF)
 * 
 * // Validate email
 * const isValidEmail = validateEmail('user@example.com'); // true
 * 
 * // Check if string is empty
 * const stringIsEmpty = isEmpty('   ', true); // true (after trimming)
 * ```
 */
export * from './validation';

/**
 * Convenience object containing all string validation functions.
 * This allows importing all validation functions as a single object.
 * 
 * @example
 * ```typescript
 * import { validation } from '@austa/utils/string';
 * 
 * // Use validation functions
 * const isValidCpf = validation.validateCPF('123.456.789-09');
 * const isValidEmail = validation.validateEmail('user@example.com');
 * ```
 */
export { default as validation } from './validation';

/**
 * Re-export the validation patterns for direct access.
 * These patterns can be used for custom validation logic.
 * 
 * @example
 * ```typescript
 * import { ValidationPatterns } from '@austa/utils/string';
 * 
 * // Use validation patterns
 * const isStrongPassword = ValidationPatterns.STRONG_PASSWORD.test('P@ssw0rd');
 * const isValidUuid = ValidationPatterns.UUID.test('123e4567-e89b-12d3-a456-426614174000');
 * ```
 */
export { ValidationPatterns } from './validation';

/**
 * @deprecated Use the named exports instead for better tree-shaking.
 * This default export is provided for backward compatibility.
 */
export default {
  // Formatting functions
  capitalizeFirstLetter: require('./formatting').capitalizeFirstLetter,
  truncate: require('./formatting').truncate,
  
  // Validation functions
  ...require('./validation').default,
  
  // Validation patterns
  ValidationPatterns: require('./validation').ValidationPatterns,
};