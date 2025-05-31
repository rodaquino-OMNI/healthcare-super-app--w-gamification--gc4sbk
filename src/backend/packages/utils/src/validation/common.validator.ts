/**
 * Common validation utilities for the AUSTA SuperApp backend.
 * 
 * This module provides general-purpose validation utilities for common data types
 * used across the AUSTA SuperApp backend, with a focus on Brazilian-specific identifiers
 * and formats. It centralizes validation logic to ensure consistency across all services.
 */

/**
 * Interface for validation result with optional error message
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Type definition for a validator function that returns a ValidationResult
 */
export type Validator<T> = (value: T) => ValidationResult;

/**
 * Validates a Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica) number.
 * This function implements the standard CNPJ validation algorithm used in Brazil.
 * 
 * @param cnpj - The CNPJ string to validate
 * @returns True if the CNPJ is valid, false otherwise
 */
export const isValidCNPJ = (cnpj: string): boolean => {
  // Remove non-digit characters
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // CNPJ must have 14 digits
  if (cleanCNPJ.length !== 14) {
    return false;
  }
  
  // Check if all digits are the same (invalid CNPJ)
  if (/^(\d)\1+$/.test(cleanCNPJ)) {
    return false;
  }
  
  // Calculate first verification digit
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Calculate second verification digit
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  // Verify if calculated digits match the CNPJ's verification digits
  return (
    parseInt(cleanCNPJ.charAt(12)) === digit1 &&
    parseInt(cleanCNPJ.charAt(13)) === digit2
  );
};

/**
 * Validates a Brazilian RG (Registro Geral) document number.
 * This is a basic validation that checks format and length, as RG validation
 * rules vary by state in Brazil.
 * 
 * @param rg - The RG string to validate
 * @returns True if the RG format is valid, false otherwise
 */
export const isValidRG = (rg: string): boolean => {
  // Remove non-alphanumeric characters
  const cleanRG = rg.replace(/[^\dXx]/g, '');
  
  // RG typically has 9 characters (including verification digit)
  // But can vary by state, so we accept 7-10 characters
  if (cleanRG.length < 7 || cleanRG.length > 10) {
    return false;
  }
  
  // Basic format validation - should be mostly digits with possible X at the end
  return /^\d+[\dXx]?$/.test(cleanRG);
};

/**
 * Validates a Brazilian phone number.
 * Supports both mobile and landline formats with or without country code.
 * 
 * @param phone - The phone number string to validate
 * @returns True if the phone number format is valid, false otherwise
 */
export const isValidBrazilianPhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check for valid lengths:
  // - 8 digits: old landline format
  // - 9 digits: mobile phones
  // - 10 digits: landline with area code (2 + 8)
  // - 11 digits: mobile with area code (2 + 9)
  // - 12 digits: country code + landline with area code (2 + 2 + 8)
  // - 13 digits: country code + mobile with area code (2 + 2 + 9)
  const validLengths = [8, 9, 10, 11, 12, 13];
  if (!validLengths.includes(cleanPhone.length)) {
    return false;
  }
  
  // If it has country code, it should start with 55 (Brazil)
  if (cleanPhone.length >= 12 && !cleanPhone.startsWith('55')) {
    return false;
  }
  
  // Mobile phones in Brazil start with digit 9 (after area code if present)
  if (cleanPhone.length === 9 && !cleanPhone.startsWith('9')) {
    return false;
  }
  if (cleanPhone.length === 11 && cleanPhone.charAt(2) !== '9') {
    return false;
  }
  if (cleanPhone.length === 13 && cleanPhone.charAt(4) !== '9') {
    return false;
  }
  
  // Area codes in Brazil range from 11 to 99
  if (cleanPhone.length >= 10) {
    const areaCodeStartIndex = cleanPhone.length === 12 || cleanPhone.length === 13 ? 2 : 0;
    const areaCode = parseInt(cleanPhone.substring(areaCodeStartIndex, areaCodeStartIndex + 2));
    if (areaCode < 11 || areaCode > 99) {
      return false;
    }
  }
  
  return true;
};

/**
 * Validates a Brazilian postal code (CEP).
 * 
 * @param cep - The CEP string to validate
 * @returns True if the CEP format is valid, false otherwise
 */
export const isValidCEP = (cep: string): boolean => {
  // Remove non-digit characters
  const cleanCEP = cep.replace(/\D/g, '');
  
  // CEP must have 8 digits
  if (cleanCEP.length !== 8) {
    return false;
  }
  
  // CEP cannot be all zeros or all the same digit
  if (/^(\d)\1+$/.test(cleanCEP) || cleanCEP === '00000000') {
    return false;
  }
  
  // Valid CEP format
  return true;
};

/**
 * Validates an email address.
 * 
 * @param email - The email string to validate
 * @returns True if the email format is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * Validates a URL.
 * 
 * @param url - The URL string to validate
 * @returns True if the URL format is valid, false otherwise
 */
export const isValidURL = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (error) {
    return false;
  }
};

/**
 * Validates a date string in ISO format (YYYY-MM-DD).
 * 
 * @param dateString - The date string to validate
 * @returns True if the date format is valid and the date exists, false otherwise
 */
export const isValidISODate = (dateString: string): boolean => {
  // Check format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  
  // Check if it's a valid date
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Creates a validator function with a custom error message.
 * 
 * @param validationFn - The validation function that returns a boolean
 * @param errorMessage - The error message to return when validation fails
 * @returns A validator function that returns a ValidationResult
 */
export const createValidator = <T>(
  validationFn: (value: T) => boolean,
  errorMessage: string
): Validator<T> => {
  return (value: T): ValidationResult => {
    const isValid = validationFn(value);
    return {
      isValid,
      message: isValid ? undefined : errorMessage
    };
  };
};

/**
 * Combines multiple validators into a single validator.
 * Returns the first validation error encountered, or success if all pass.
 * 
 * @param validators - Array of validator functions to apply
 * @returns A combined validator function
 */
export const combineValidators = <T>(
  validators: Validator<T>[]
): Validator<T> => {
  return (value: T): ValidationResult => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };
};

/**
 * Validates that a string is not empty (after trimming).
 * 
 * @param value - The string to validate
 * @returns True if the string is not empty, false otherwise
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validates that a string has a minimum length.
 * 
 * @param value - The string to validate
 * @param minLength - The minimum required length
 * @returns True if the string meets the minimum length, false otherwise
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

/**
 * Validates that a string does not exceed a maximum length.
 * 
 * @param value - The string to validate
 * @param maxLength - The maximum allowed length
 * @returns True if the string does not exceed the maximum length, false otherwise
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

/**
 * Validates that a number is within a specified range.
 * 
 * @param value - The number to validate
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns True if the number is within the range, false otherwise
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Validates that a value matches a regular expression pattern.
 * 
 * @param value - The string to validate
 * @param pattern - The regular expression pattern to match
 * @returns True if the string matches the pattern, false otherwise
 */
export const matchesPattern = (value: string, pattern: RegExp): boolean => {
  return pattern.test(value);
};