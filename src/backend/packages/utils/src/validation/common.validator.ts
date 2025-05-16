/**
 * Common validation utilities for data types used across the AUSTA SuperApp backend.
 * Provides validation for Brazilian-specific identifiers, contact information,
 * and general-purpose validation helpers.
 * 
 * This module centralizes validation logic for common data types used throughout
 * the AUSTA SuperApp, ensuring consistency across all services and reducing
 * duplicate validation code. It supports the cross-journey data validation patterns
 * required by the application architecture.
 * 
 * Key features:
 * - Brazilian-specific validators (CNPJ, RG, phone numbers, CEP)
 * - General-purpose validators (email, URL, date, string length)
 * - Composable validation with custom error messages
 * - Support for optional validation parameters
 * 
 * @example
 * import { isValidCNPJ, isValidEmail, combineValidators } from '@austa/utils/validation/common.validator';
 * 
 * // Single validation
 * if (isValidCNPJ('12.345.678/0001-90')) {
 *   // Process valid CNPJ
 * }
 * 
 * // Combined validation
 * const validateCompanyData = combineValidatorsWithErrors([
 *   { validator: (data) => isValidCNPJ(data.cnpj), errorMessage: 'Invalid CNPJ' },
 *   { validator: (data) => isValidEmail(data.email), errorMessage: 'Invalid email' },
 *   { validator: (data) => isValidCEP(data.postalCode), errorMessage: 'Invalid postal code' }
 * ]);
 * 
 * const result = validateCompanyData(companyData);
 * if (!result.isValid) {
 *   console.error(result.errorMessage);
 * }
 */

/**
 * Validates a Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica) number.
 * This function implements the standard CNPJ validation algorithm used in Brazil.
 * 
 * @param cnpj - The CNPJ string to validate
 * @param options - Optional validation options
 * @returns True if the CNPJ is valid, false otherwise
 * 
 * @example
 * // Basic validation
 * if (isValidCNPJ('12.345.678/0001-90')) {
 *   // Valid CNPJ
 * }
 * 
 * // With options
 * if (isValidCNPJ('', { allowEmpty: true })) {
 *   // Empty is considered valid when allowEmpty is true
 * }
 */
export const isValidCNPJ = (cnpj: string, options?: ValidationOptions): boolean => {
  // Check for empty value
  if (!cnpj) {
    return options?.allowEmpty === true;
  }
  
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
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Calculate second verification digit
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
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
 * Validates a Brazilian RG (Registro Geral) identification document number.
 * This is a basic validation that checks format and length, as RG validation
 * rules vary by state in Brazil.
 * 
 * @param rg - The RG string to validate
 * @param options - Optional validation options
 * @returns True if the RG format is valid, false otherwise
 * 
 * @example
 * // Basic validation
 * if (isValidRG('12.345.678-9')) {
 *   // Valid RG
 * }
 * 
 * // With options
 * if (isValidRG('', { allowEmpty: true })) {
 *   // Empty is considered valid when allowEmpty is true
 * }
 */
export const isValidRG = (rg: string, options?: ValidationOptions): boolean => {
  // Check for empty value
  if (!rg) {
    return options?.allowEmpty === true;
  }
  
  // Remove non-alphanumeric characters
  const cleanRG = rg.replace(/[^\dXx]/g, '');
  
  // RG typically has between 8 and 10 characters (varies by state)
  if (cleanRG.length < 8 || cleanRG.length > 10) {
    return false;
  }
  
  // Basic format validation - must be mostly digits with possible X at the end
  return /^\d+[Xx]?$/.test(cleanRG);
};

/**
 * Validates a Brazilian phone number.
 * Supports both mobile and landline formats with or without country code.
 * 
 * @param phone - The phone number string to validate
 * @param options - Optional validation options
 * @returns True if the phone number format is valid, false otherwise
 * 
 * @example
 * // Basic validation
 * if (isValidBrazilianPhone('(11) 98765-4321')) {
 *   // Valid mobile phone with area code
 * }
 * 
 * // With options
 * if (isValidBrazilianPhone('', { allowEmpty: true })) {
 *   // Empty is considered valid when allowEmpty is true
 * }
 */
export const isValidBrazilianPhone = (phone: string, options?: ValidationOptions): boolean => {
  // Check for empty value
  if (!phone) {
    return options?.allowEmpty === true;
  }
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check for valid lengths:
  // - 8 digits: old landline format
  // - 9 digits: mobile phones
  // - 10 digits: landline with area code (2+8)
  // - 11 digits: mobile with area code (2+9)
  // - 12 digits: country code + landline with area code (2+2+8)
  // - 13 digits: country code + mobile with area code (2+2+9)
  if (![8, 9, 10, 11, 12, 13].includes(cleanPhone.length)) {
    return false;
  }
  
  // For mobile numbers (9-digit format), the first digit should be 9
  if (cleanPhone.length === 9 && cleanPhone.charAt(0) !== '9') {
    return false;
  }
  
  // For numbers with area code, check if area code is valid (10-13 digits)
  if (cleanPhone.length >= 10) {
    const areaCodeStart = cleanPhone.length >= 12 ? 2 : 0;
    const areaCode = cleanPhone.substring(areaCodeStart, areaCodeStart + 2);
    // Area codes in Brazil are between 11 and 99
    if (parseInt(areaCode) < 11 || parseInt(areaCode) > 99) {
      return false;
    }
    
    // For mobile with area code, check if first digit after area code is 9
    if ((cleanPhone.length === 11 || cleanPhone.length === 13) && 
        cleanPhone.charAt(areaCodeStart + 2) !== '9') {
      return false;
    }
  }
  
  // If country code is present, it should be 55 for Brazil
  if (cleanPhone.length >= 12 && cleanPhone.substring(0, 2) !== '55') {
    return false;
  }
  
  return true;
};

/**
 * Validates a Brazilian postal code (CEP).
 * 
 * @param cep - The CEP string to validate
 * @param options - Optional validation options
 * @returns True if the CEP format is valid, false otherwise
 * 
 * @example
 * // Basic validation
 * if (isValidCEP('12345-678')) {
 *   // Valid CEP
 * }
 * 
 * // With options
 * if (isValidCEP('', { allowEmpty: true })) {
 *   // Empty is considered valid when allowEmpty is true
 * }
 */
export const isValidCEP = (cep: string, options?: ValidationOptions): boolean => {
  // Check for empty value
  if (!cep) {
    return options?.allowEmpty === true;
  }
  
  // Remove non-digit characters
  const cleanCEP = cep.replace(/\D/g, '');
  
  // CEP must have exactly 8 digits
  if (cleanCEP.length !== 8) {
    return false;
  }
  
  // Check if all digits are the same (likely invalid)
  if (/^(\d)\1+$/.test(cleanCEP)) {
    return false;
  }
  
  // CEP cannot be all zeros
  if (cleanCEP === '00000000') {
    return false;
  }
  
  return true;
};

/**
 * Validates an email address using a comprehensive regex pattern.
 * 
 * @param email - The email string to validate
 * @param options - Optional validation options
 * @returns True if the email format is valid, false otherwise
 * 
 * @example
 * // Basic validation
 * if (isValidEmail('user@example.com')) {
 *   // Valid email
 * }
 * 
 * // With options
 * if (isValidEmail('', { allowEmpty: true })) {
 *   // Empty is considered valid when allowEmpty is true
 * }
 */
export const isValidEmail = (email: string, options?: ValidationOptions): boolean => {
  // Check for empty value
  if (!email) {
    return options?.allowEmpty === true;
  }
  
  if (typeof email !== 'string') {
    return false;
  }
  
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * Validates a URL string.
 * 
 * @param url - The URL string to validate
 * @param options - Optional validation options
 * @returns True if the URL format is valid, false otherwise
 * 
 * @example
 * // Basic validation
 * if (isValidURL('https://example.com')) {
 *   // Valid URL
 * }
 * 
 * // With options
 * if (isValidURL('', { allowEmpty: true })) {
 *   // Empty is considered valid when allowEmpty is true
 * }
 */
export const isValidURL = (url: string, options?: ValidationOptions): boolean => {
  // Check for empty value
  if (!url) {
    return options?.allowEmpty === true;
  }
  
  if (typeof url !== 'string') {
    return false;
  }
  
  try {
    // Use URL constructor for validation
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validates a date string in ISO format or checks if a Date object is valid.
 * 
 * @param date - The date string or Date object to validate
 * @param options - Optional validation options
 * @returns True if the date is valid, false otherwise
 * 
 * @example
 * // Basic validation
 * if (isValidDate('2023-01-15')) {
 *   // Valid date
 * }
 * 
 * // With Date object
 * if (isValidDate(new Date())) {
 *   // Valid Date object
 * }
 * 
 * // With options
 * if (isValidDate('', { allowEmpty: true })) {
 *   // Empty is considered valid when allowEmpty is true
 * }
 */
export const isValidDate = (date: string | Date, options?: ValidationOptions): boolean => {
  // Check for empty value
  if (!date) {
    return options?.allowEmpty === true;
  }
  
  // If it's already a Date object
  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }
  
  // If it's a string, try to create a Date object
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

/**
 * Validates a string against a minimum and maximum length.
 * 
 * @param str - The string to validate
 * @param minLength - The minimum allowed length (inclusive)
 * @param maxLength - The maximum allowed length (inclusive)
 * @param options - Optional validation options
 * @returns True if the string length is within range, false otherwise
 * 
 * @example
 * // Basic validation
 * if (isValidLength('username', 3, 20)) {
 *   // Valid length
 * }
 * 
 * // With options
 * if (isValidLength('', 1, 10, { allowEmpty: true })) {
 *   // Empty is considered valid when allowEmpty is true
 * }
 */
export const isValidLength = (
  str: string, 
  minLength: number, 
  maxLength: number, 
  options?: ValidationOptions
): boolean => {
  // Check for empty value
  if (!str) {
    return options?.allowEmpty === true;
  }
  
  if (typeof str !== 'string') {
    return false;
  }
  
  return str.length >= minLength && str.length <= maxLength;
};

/**
 * Validates that a string contains only alphanumeric characters.
 * 
 * @param str - The string to validate
 * @param allowSpaces - Whether spaces are allowed (default: false)
 * @param options - Optional validation options
 * @returns True if the string contains only alphanumeric characters, false otherwise
 * 
 * @example
 * // Basic validation
 * if (isAlphanumeric('Username123')) {
 *   // Valid alphanumeric string
 * }
 * 
 * // With spaces allowed
 * if (isAlphanumeric('User Name 123', true)) {
 *   // Valid alphanumeric string with spaces
 * }
 * 
 * // With options
 * if (isAlphanumeric('', false, { allowEmpty: true })) {
 *   // Empty is considered valid when allowEmpty is true
 * }
 */
export const isAlphanumeric = (
  str: string, 
  allowSpaces = false, 
  options?: ValidationOptions
): boolean => {
  // Check for empty value
  if (!str) {
    return options?.allowEmpty === true;
  }
  
  if (typeof str !== 'string') {
    return false;
  }
  
  const pattern = allowSpaces ? /^[a-zA-Z0-9\s]*$/ : /^[a-zA-Z0-9]*$/;
  return pattern.test(str);
};

/**
 * Validates that a value is within a specified numeric range.
 * 
 * @param value - The numeric value to validate
 * @param min - The minimum allowed value (inclusive)
 * @param max - The maximum allowed value (inclusive)
 * @param options - Optional validation options
 * @returns True if the value is within range, false otherwise
 * 
 * @example
 * // Basic validation
 * if (isInRange(25, 0, 100)) {
 *   // Valid range
 * }
 * 
 * // With options for null/undefined values
 * if (isInRange(null, 0, 100, { allowEmpty: true })) {
 *   // Null is considered valid when allowEmpty is true
 * }
 */
export const isInRange = (
  value: number | null | undefined, 
  min: number, 
  max: number, 
  options?: ValidationOptions
): boolean => {
  // Check for empty value
  if (value === null || value === undefined) {
    return options?.allowEmpty === true;
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  
  return value >= min && value <= max;
};

/**
 * Type definition for a validator function that returns a boolean.
 * Used for simple validation scenarios where only the result is needed.
 */
export type Validator<T> = (value: T) => boolean;

/**
 * Type definition for a validator function that returns a validation result with an error message.
 * Used for validation scenarios where specific error messages are required.
 */
export type ValidatorWithError<T> = (value: T) => { isValid: boolean; errorMessage?: string };

/**
 * Type definition for validation options that can be passed to validators.
 * Allows for customization of validation behavior.
 */
export interface ValidationOptions {
  /** Whether to allow empty values (empty strings, null, undefined) */
  allowEmpty?: boolean;
  /** Custom error message to return when validation fails */
  errorMessage?: string;
  /** Additional context-specific options */
  [key: string]: any;
}

/**
 * Combines multiple validators into a single validator function.
 * Returns true only if all validators return true.
 * 
 * @param validators - Array of validator functions to combine
 * @returns A combined validator function
 * 
 * @example
 * const isValidUserInput = combineValidators([
 *   (value) => isValidLength(value, 3, 50),
 *   isAlphanumeric
 * ]);
 * 
 * if (isValidUserInput(userInput)) {
 *   // Process valid input
 * }
 */
export const combineValidators = <T>(
  validators: Validator<T>[]
): Validator<T> => {
  return (value: T): boolean => {
    return validators.every(validator => validator(value));
  };
};

/**
 * Combines multiple validators with custom error messages.
 * Returns the result of validation and the first error message encountered.
 * 
 * @param validators - Array of validator functions with error messages
 * @returns A combined validator function that returns validation result and error message
 * 
 * @example
 * const validateUsername = combineValidatorsWithErrors([
 *   { 
 *     validator: (value) => isValidLength(value, 3, 20), 
 *     errorMessage: 'Username must be between 3 and 20 characters' 
 *   },
 *   { 
 *     validator: isAlphanumeric, 
 *     errorMessage: 'Username must contain only letters and numbers' 
 *   }
 * ]);
 * 
 * const result = validateUsername(username);
 * if (!result.isValid) {
 *   console.error(result.errorMessage);
 * }
 */
export const combineValidatorsWithErrors = <T>(
  validators: Array<{ validator: Validator<T>; errorMessage: string }>
): ValidatorWithError<T> => {
  return (value: T): { isValid: boolean; errorMessage?: string } => {
    for (const { validator, errorMessage } of validators) {
      if (!validator(value)) {
        return { isValid: false, errorMessage };
      }
    }
    return { isValid: true };
  };
};