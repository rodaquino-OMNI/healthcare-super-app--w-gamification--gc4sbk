/**
 * @file String Validation Utilities
 * @description Specialized validation utilities for string formats, with a focus on Brazilian-specific formats.
 * These utilities ensure consistent validation behavior across all journey services and prevent invalid data entry.
 * 
 * @module @austa/utils/string/validation
 * @version 1.0.0
 */

/**
 * Error messages for validation functions
 * @internal
 */
const ERROR_MESSAGES = {
  INVALID_INPUT_TYPE: 'Input must be a string',
  EMPTY_STRING: 'Input cannot be empty',
  INVALID_CPF_FORMAT: 'CPF must contain 11 digits',
  INVALID_CPF: 'Invalid CPF number',
  INVALID_CNPJ_FORMAT: 'CNPJ must contain 14 digits',
  INVALID_CNPJ: 'Invalid CNPJ number',
  INVALID_CEP: 'Invalid CEP format',
  INVALID_PHONE: 'Invalid phone number format'
};

/**
 * Type guard to check if a value is a string
 * 
 * @param value - The value to check
 * @returns True if the value is a string, false otherwise
 */
const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number.
 * This function implements the official modulus-11 algorithm for validating CPF numbers.
 * 
 * @example
 * ```typescript
 * // Valid CPF (with formatting)
 * isValidCPF('123.456.789-09'); // Returns: true or { valid: true }
 * 
 * // Valid CPF (digits only)
 * isValidCPF('12345678909'); // Returns: true or { valid: true }
 * 
 * // Invalid CPF
 * isValidCPF('111.111.111-11'); // Returns: false or { valid: false, error: 'Invalid CPF number' }
 * 
 * // Invalid input type
 * isValidCPF(12345678909); // Returns: false or { valid: false, error: 'Input must be a string' }
 * ```
 * 
 * @param cpf - The CPF string to validate
 * @param detailed - If true, returns a detailed validation result object instead of a boolean
 * @returns Boolean indicating if the CPF is valid, or a detailed validation result if detailed=true
 * @throws {TypeError} If input is not a string and throwOnInvalid is true
 */
export const isValidCPF = (
  cpf: unknown, 
  detailed = false
): boolean | { valid: boolean; error?: string } => {
  // Type validation
  if (!isString(cpf)) {
    return detailed 
      ? { valid: false, error: ERROR_MESSAGES.INVALID_INPUT_TYPE } 
      : false;
  }

  // Remove non-digit characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // CPF must have 11 digits
  if (cleanCPF.length !== 11) {
    return detailed 
      ? { valid: false, error: ERROR_MESSAGES.INVALID_CPF_FORMAT } 
      : false;
  }
  
  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1+$/.test(cleanCPF)) {
    return detailed 
      ? { valid: false, error: ERROR_MESSAGES.INVALID_CPF } 
      : false;
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

  return detailed 
    ? { valid: isValid, ...(isValid ? {} : { error: ERROR_MESSAGES.INVALID_CPF }) }
    : isValid;
};

/**
 * Validates a Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica) number.
 * This function implements the official algorithm for validating CNPJ numbers.
 * 
 * @example
 * ```typescript
 * // Valid CNPJ (with formatting)
 * isValidCNPJ('12.345.678/0001-95'); // Returns: true or { valid: true }
 * 
 * // Valid CNPJ (digits only)
 * isValidCNPJ('12345678000195'); // Returns: true or { valid: true }
 * 
 * // Invalid CNPJ
 * isValidCNPJ('11.111.111/1111-11'); // Returns: false or { valid: false, error: 'Invalid CNPJ number' }
 * ```
 * 
 * @param cnpj - The CNPJ string to validate
 * @param detailed - If true, returns a detailed validation result object instead of a boolean
 * @returns Boolean indicating if the CNPJ is valid, or a detailed validation result if detailed=true
 */
export const isValidCNPJ = (
  cnpj: unknown, 
  detailed = false
): boolean | { valid: boolean; error?: string } => {
  // Type validation
  if (!isString(cnpj)) {
    return detailed 
      ? { valid: false, error: ERROR_MESSAGES.INVALID_INPUT_TYPE } 
      : false;
  }

  // Remove non-digit characters
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // CNPJ must have 14 digits
  if (cleanCNPJ.length !== 14) {
    return detailed 
      ? { valid: false, error: ERROR_MESSAGES.INVALID_CNPJ_FORMAT } 
      : false;
  }
  
  // Check if all digits are the same (invalid CNPJ)
  if (/^(\d)\1+$/.test(cleanCNPJ)) {
    return detailed 
      ? { valid: false, error: ERROR_MESSAGES.INVALID_CNPJ } 
      : false;
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
  const isValid = (
    parseInt(cleanCNPJ.charAt(12)) === digit1 &&
    parseInt(cleanCNPJ.charAt(13)) === digit2
  );

  return detailed 
    ? { valid: isValid, ...(isValid ? {} : { error: ERROR_MESSAGES.INVALID_CNPJ }) }
    : isValid;
};

/**
 * Validates a Brazilian CEP (Código de Endereçamento Postal) postal code.
 * 
 * @example
 * ```typescript
 * // Valid CEP (with formatting)
 * isValidCEP('12345-678'); // Returns: true or { valid: true }
 * 
 * // Valid CEP (digits only)
 * isValidCEP('12345678'); // Returns: true or { valid: true }
 * 
 * // Invalid CEP
 * isValidCEP('1234-567'); // Returns: false or { valid: false, error: 'Invalid CEP format' }
 * ```
 * 
 * @param cep - The CEP string to validate
 * @param detailed - If true, returns a detailed validation result object instead of a boolean
 * @returns Boolean indicating if the CEP is valid, or a detailed validation result if detailed=true
 */
export const isValidCEP = (
  cep: unknown, 
  detailed = false
): boolean | { valid: boolean; error?: string } => {
  // Type validation
  if (!isString(cep)) {
    return detailed 
      ? { valid: false, error: ERROR_MESSAGES.INVALID_INPUT_TYPE } 
      : false;
  }

  // Remove non-digit characters
  const cleanCEP = cep.replace(/\D/g, '');
  
  // CEP must have 8 digits
  const isValid = cleanCEP.length === 8 && /^\d{8}$/.test(cleanCEP);

  return detailed 
    ? { valid: isValid, ...(isValid ? {} : { error: ERROR_MESSAGES.INVALID_CEP }) }
    : isValid;
};

/**
 * Validates a Brazilian phone number.
 * Supports both mobile and landline numbers with or without country code.
 * 
 * @example
 * ```typescript
 * // Valid mobile number (with formatting)
 * isValidBrazilianPhone('(11) 98765-4321'); // Returns: true or { valid: true }
 * 
 * // Valid mobile number with country code
 * isValidBrazilianPhone('+55 11 98765-4321'); // Returns: true or { valid: true }
 * 
 * // Valid landline
 * isValidBrazilianPhone('1134567890'); // Returns: true or { valid: true }
 * 
 * // Invalid phone number
 * isValidBrazilianPhone('123-456'); // Returns: false or { valid: false, error: 'Invalid phone number format' }
 * ```
 * 
 * @param phone - The phone number string to validate
 * @param detailed - If true, returns a detailed validation result object instead of a boolean
 * @returns Boolean indicating if the phone number is valid, or a detailed validation result if detailed=true
 */
export const isValidBrazilianPhone = (
  phone: unknown, 
  detailed = false
): boolean | { valid: boolean; error?: string } => {
  // Type validation
  if (!isString(phone)) {
    return detailed 
      ? { valid: false, error: ERROR_MESSAGES.INVALID_INPUT_TYPE } 
      : false;
  }

  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid Brazilian phone number
  // - Must have 10 or 11 digits (without country code)
  // - Or 12 or 13 digits (with country code 55)
  const isValid = (
    // Without country code: 10 digits (landline) or 11 digits (mobile)
    (cleanPhone.length === 10 || cleanPhone.length === 11) ||
    // With country code: 12 digits (landline with 55) or 13 digits (mobile with 55)
    (cleanPhone.length === 12 && cleanPhone.startsWith('55')) ||
    (cleanPhone.length === 13 && cleanPhone.startsWith('55'))
  );

  return detailed 
    ? { valid: isValid, ...(isValid ? {} : { error: ERROR_MESSAGES.INVALID_PHONE }) }
    : isValid;
};

/**
 * Formats a CPF number with the standard Brazilian format (XXX.XXX.XXX-XX)
 * 
 * @example
 * ```typescript
 * // Format a CPF
 * formatCPF('12345678909'); // Returns: '123.456.789-09'
 * 
 * // Already formatted CPF remains unchanged
 * formatCPF('123.456.789-09'); // Returns: '123.456.789-09'
 * ```
 * 
 * @param cpf - The CPF string to format
 * @returns The formatted CPF string or the original string if invalid
 */
export const formatCPF = (cpf: string): string => {
  if (!isString(cpf)) {
    return '';
  }
  
  // Remove any non-digit characters
  const digits = cpf.replace(/\D/g, '');
  
  // Check if it has the correct length
  if (digits.length !== 11) {
    return cpf; // Return original if not valid
  }
  
  // Apply the format XXX.XXX.XXX-XX
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
};

/**
 * Formats a CNPJ number with the standard Brazilian format (XX.XXX.XXX/XXXX-XX)
 * 
 * @example
 * ```typescript
 * // Format a CNPJ
 * formatCNPJ('12345678000195'); // Returns: '12.345.678/0001-95'
 * 
 * // Already formatted CNPJ remains unchanged
 * formatCNPJ('12.345.678/0001-95'); // Returns: '12.345.678/0001-95'
 * ```
 * 
 * @param cnpj - The CNPJ string to format
 * @returns The formatted CNPJ string or the original string if invalid
 */
export const formatCNPJ = (cnpj: string): string => {
  if (!isString(cnpj)) {
    return '';
  }
  
  // Remove any non-digit characters
  const digits = cnpj.replace(/\D/g, '');
  
  // Check if it has the correct length
  if (digits.length !== 14) {
    return cnpj; // Return original if not valid
  }
  
  // Apply the format XX.XXX.XXX/XXXX-XX
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

/**
 * Formats a CEP postal code with the standard Brazilian format (XXXXX-XXX)
 * 
 * @example
 * ```typescript
 * // Format a CEP
 * formatCEP('12345678'); // Returns: '12345-678'
 * 
 * // Already formatted CEP remains unchanged
 * formatCEP('12345-678'); // Returns: '12345-678'
 * ```
 * 
 * @param cep - The CEP string to format
 * @returns The formatted CEP string or the original string if invalid
 */
export const formatCEP = (cep: string): string => {
  if (!isString(cep)) {
    return '';
  }
  
  // Remove any non-digit characters
  const digits = cep.replace(/\D/g, '');
  
  // Check if it has the correct length
  if (digits.length !== 8) {
    return cep; // Return original if not valid
  }
  
  // Apply the format XXXXX-XXX
  return digits.replace(/^(\d{5})(\d{3})$/, '$1-$2');
};