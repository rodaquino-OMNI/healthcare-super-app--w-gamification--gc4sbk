/**
 * @file Main entry point for string utilities package
 * @module @austa/utils/string
 * @description Provides a unified API for string manipulation and validation functions
 * used across all journey services. This file centralizes all exports from format.ts and
 * validation.ts, ensuring backward compatibility with existing imports while organizing
 * the code into more specific modules.
 */

// Re-export all functions from format.ts
export { 
  capitalizeFirstLetter,
  truncate,
  formatString
} from './format';

// Import from validation.ts for backward compatibility
import { 
  isValidCPFBoolean
} from './validation';

// Re-export the detailed validation function and interface
export { 
  isValidCPF as isValidCPFDetailed,
  CPFValidationResult 
} from './validation';

/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number.
 * This function maintains backward compatibility with the original implementation
 * in string.util.ts by returning a boolean result.
 * 
 * For more detailed validation with error messages, use isValidCPFDetailed.
 * 
 * @param cpf - The CPF string to validate
 * @returns True if the CPF is valid, false otherwise
 */
export const isValidCPF = isValidCPFBoolean;