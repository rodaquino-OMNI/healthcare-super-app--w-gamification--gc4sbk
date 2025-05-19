/**
 * String validation utilities for verifying string formats and integrity across all backend services.
 * This module provides robust validation functions to ensure data consistency and integrity.
 * 
 * @module string/validation
 */

/**
 * Error messages for CPF validation failures
 */
export enum CPFValidationError {
  INVALID_INPUT = 'Input must be a non-empty string',
  INVALID_LENGTH = 'CPF must contain exactly 11 digits',
  INVALID_FORMAT = 'CPF must contain only digits after cleaning',
  REPEATED_DIGITS = 'CPF with all repeated digits is invalid',
  INVALID_CHECKSUM = 'CPF checksum validation failed',
}

/**
 * Result of CPF validation containing success status and error message if applicable
 */
export interface CPFValidationResult {
  isValid: boolean;
  error?: CPFValidationError;
}

/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number.
 * This function implements the standard CPF validation algorithm used in Brazil.
 * 
 * The validation includes:
 * 1. Checking if the input is a valid string
 * 2. Removing non-digit characters (spaces, dots, hyphens)
 * 3. Verifying the CPF has exactly 11 digits
 * 4. Checking that the CPF is not all repeated digits (which would pass the algorithm but are invalid)
 * 5. Calculating and verifying both check digits using the modulus-11 algorithm
 * 
 * @example
 * ```typescript
 * // Simple validation check
 * if (isValidCPF('123.456.789-09').isValid) {
 *   // CPF is valid
 * }
 * 
 * // Detailed error handling
 * const result = isValidCPF('123.456.789-09');
 * if (!result.isValid) {
 *   console.error(`CPF validation failed: ${result.error}`);
 * }
 * ```
 * 
 * @param cpf - The CPF string to validate (can include formatting characters)
 * @returns A validation result object with isValid status and optional error message
 */
export function isValidCPF(cpf: unknown): CPFValidationResult {
  // Validate input is a string
  if (typeof cpf !== 'string' || cpf.trim() === '') {
    return { isValid: false, error: CPFValidationError.INVALID_INPUT };
  }
  
  // Remove non-digit characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // CPF must have 11 digits
  if (cleanCPF.length !== 11) {
    return { isValid: false, error: CPFValidationError.INVALID_LENGTH };
  }
  
  // Ensure all characters are digits after cleaning
  if (!/^\d+$/.test(cleanCPF)) {
    return { isValid: false, error: CPFValidationError.INVALID_FORMAT };
  }
  
  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1+$/.test(cleanCPF)) {
    return { isValid: false, error: CPFValidationError.REPEATED_DIGITS };
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
  
  return isValid 
    ? { isValid: true } 
    : { isValid: false, error: CPFValidationError.INVALID_CHECKSUM };
}

/**
 * Simplified version of CPF validation that returns a boolean result.
 * This is a convenience wrapper around the main isValidCPF function.
 * 
 * @example
 * ```typescript
 * if (isValidCPFBoolean('123.456.789-09')) {
 *   // CPF is valid
 * }
 * ```
 * 
 * @param cpf - The CPF string to validate
 * @returns True if the CPF is valid, false otherwise
 */
export function isValidCPFBoolean(cpf: unknown): boolean {
  return isValidCPF(cpf).isValid;
}