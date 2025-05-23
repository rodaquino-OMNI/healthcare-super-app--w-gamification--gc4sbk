/**
 * @file String validation utilities for verifying string formats and integrity
 * @module @austa/utils/string/validation
 * @description Provides robust string validation utilities for verifying string formats 
 * and integrity across all backend services.
 */

/**
 * Error messages for CPF validation
 * @internal
 */
enum CPFValidationErrorMessage {
  INVALID_TYPE = 'Input must be a string',
  EMPTY_STRING = 'CPF cannot be empty',
  INVALID_LENGTH = 'CPF must have 11 digits after removing non-numeric characters',
  REPEATED_DIGITS = 'CPF with all repeated digits is invalid',
  INVALID_CHECK_DIGITS = 'CPF has invalid check digits',
}

/**
 * Result of CPF validation containing validation status and error message if invalid
 */
export interface CPFValidationResult {
  /** Whether the CPF is valid */
  isValid: boolean;
  /** Error message if CPF is invalid, undefined if valid */
  errorMessage?: string;
}

/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number.
 * This function implements the standard CPF validation algorithm used in Brazil.
 * 
 * The CPF is a Brazilian tax identification number that follows specific validation rules:
 * 1. It must contain 11 digits (after removing any non-numeric characters)
 * 2. It cannot have all digits repeated (e.g., 111.111.111-11)
 * 3. The last two digits are check digits calculated using a specific algorithm
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const result = isValidCPF('123.456.789-09');
 * if (result.isValid) {
 *   // CPF is valid
 * } else {
 *   console.error(result.errorMessage); // Shows the specific validation error
 * }
 * 
 * // With detailed validation
 * const { isValid, errorMessage } = isValidCPF('11111111111', true);
 * console.log(isValid); // false
 * console.log(errorMessage); // 'CPF with all repeated digits is invalid'
 * ```
 * 
 * @param cpf - The CPF string to validate (can include formatting characters)
 * @returns A CPFValidationResult object with validation status and error message if invalid
 * @throws {TypeError} If the input is not a string
 */
export function isValidCPF(cpf: unknown): CPFValidationResult {
  // Type validation
  if (typeof cpf !== 'string') {
    return {
      isValid: false,
      errorMessage: CPFValidationErrorMessage.INVALID_TYPE,
    };
  }

  // Empty string validation
  if (!cpf.trim()) {
    return {
      isValid: false,
      errorMessage: CPFValidationErrorMessage.EMPTY_STRING,
    };
  }
  
  // Remove non-digit characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // CPF must have 11 digits
  if (cleanCPF.length !== 11) {
    return {
      isValid: false,
      errorMessage: CPFValidationErrorMessage.INVALID_LENGTH,
    };
  }
  
  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1+$/.test(cleanCPF)) {
    return {
      isValid: false,
      errorMessage: CPFValidationErrorMessage.REPEATED_DIGITS,
    };
  }
  
  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder > 9 ? 0 : remainder;
  
  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder > 9 ? 0 : remainder;
  
  // Verify if calculated digits match the CPF's verification digits
  const isValid = (
    parseInt(cleanCPF.charAt(9)) === digit1 &&
    parseInt(cleanCPF.charAt(10)) === digit2
  );

  return {
    isValid,
    errorMessage: isValid ? undefined : CPFValidationErrorMessage.INVALID_CHECK_DIGITS,
  };
}

/**
 * Simplified version of isValidCPF that returns just a boolean
 * This maintains backward compatibility with the original implementation
 * 
 * @example
 * ```typescript
 * // Simple boolean check
 * if (isValidCPFBoolean('123.456.789-09')) {
 *   // CPF is valid
 * } else {
 *   // CPF is invalid
 * }
 * ```
 * 
 * @param cpf - The CPF string to validate
 * @returns True if the CPF is valid, false otherwise
 */
export function isValidCPFBoolean(cpf: unknown): boolean {
  return isValidCPF(cpf).isValid;
}