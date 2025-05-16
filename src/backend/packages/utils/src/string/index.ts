/**
 * @file String Utilities Index
 * @description Central export point for all string utility functions organized by category.
 * This barrel file simplifies imports while maintaining an organized internal structure.
 * 
 * @module @austa/utils/string
 * @version 1.0.0
 */

/**
 * String formatting utilities for text transformation operations.
 * @see {@link ./formatting.ts}
 */
export * from './formatting';

/**
 * String validation utilities for verifying string formats and patterns.
 * @see {@link ./validation.ts}
 */
export * from './validation';

/**
 * Convenience re-exports of commonly used functions with explicit types.
 * This allows for more precise imports when only specific functions are needed.
 */

// Formatting function re-exports with explicit types
import { capitalizeFirstLetter, truncate } from './formatting';
export { 
  capitalizeFirstLetter, 
  truncate 
};

// Validation function re-exports with explicit types
import { 
  isValidCPF, 
  isValidCNPJ, 
  isValidCEP, 
  isValidBrazilianPhone,
  formatCPF,
  formatCNPJ,
  formatCEP
} from './validation';
export {
  isValidCPF, 
  isValidCNPJ, 
  isValidCEP, 
  isValidBrazilianPhone,
  formatCPF,
  formatCNPJ,
  formatCEP
};

/**
 * Type definitions for validation function return types.
 * These types can be imported directly by consumers for type checking.
 */
export type ValidationResult = boolean | { valid: boolean; error?: string };

/**
 * @example
 * ```typescript
 * // Import all string utilities
 * import * as StringUtils from '@austa/utils/string';
 * 
 * // Import specific functions
 * import { capitalizeFirstLetter, isValidCPF } from '@austa/utils/string';
 * 
 * // Import from specific category
 * import { truncate } from '@austa/utils/string/formatting';
 * import { isValidCNPJ } from '@austa/utils/string/validation';
 * 
 * // Import types
 * import { ValidationResult } from '@austa/utils/string';
 * ```
 */