/**
 * @file String Validation Core Utilities
 * @description Core validation logic for string validation, focused on business rules validation,
 * particularly for Brazilian-specific formats. These utilities ensure consistent validation behavior
 * across all journey services and prevent invalid data entry.
 *
 * This module provides the underlying implementation for the string validators exposed in
 * string.validator.ts, with a focus on performance and correctness.
 *
 * @module @austa/utils/string/validation
 */

/**
 * Regular expression patterns used for string validation.
 * These patterns are used internally by the validation functions.
 */
export const ValidationPatterns = {
  /** Brazilian CPF pattern with or without formatting */
  CPF: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
  
  /** Basic email pattern for initial validation */
  EMAIL_BASIC: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  /** Comprehensive email pattern for strict validation */
  EMAIL_STRICT: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  
  /** Brazilian email domains for additional validation */
  BRAZILIAN_EMAIL_DOMAINS: /\.(br|com\.br|org\.br|edu\.br|gov\.br)$/i,
  
  /** URL pattern for basic validation */
  URL: /^(https?:\/\/)?(([\da-z.-]+)\.([a-z.]{2,6})|(localhost))(:[0-9]{1,5})?([/\w .-]*)*\/?$/,
  
  /** Private IP address ranges for SSRF protection */
  PRIVATE_IP: /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|0\.0\.0\.0|localhost|::1|fe80::)/i,
  
  /** Alphanumeric characters only */
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  
  /** Alphabetic characters only */
  ALPHABETIC: /^[a-zA-Z]+$/,
  
  /** Numeric characters only */
  NUMERIC: /^\d+$/,
  
  /** Hexadecimal characters */
  HEXADECIMAL: /^[0-9a-fA-F]+$/,
  
  /** UUID v4 format */
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  /** Strong password pattern (min 8 chars, at least one uppercase, lowercase, number, and special char) */
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

/**
 * Type guard to check if a value is a string or can be safely converted to a string.
 * 
 * @param value - The value to check
 * @returns True if the value is a string or can be safely converted to a string
 */
export function isStringLike(value: unknown): value is string | number | boolean | bigint | null | undefined {
  const type = typeof value;
  return (
    type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    type === 'bigint' ||
    value === null ||
    value === undefined
  );
}

/**
 * Safely converts a value to a string if possible.
 * 
 * @param value - The value to convert
 * @returns The string representation of the value, or undefined if conversion is not possible
 */
export function toStringOrUndefined(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  
  if (isStringLike(value)) {
    return String(value);
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  if (typeof value === 'object') {
    try {
      // Try to convert objects to JSON strings
      return JSON.stringify(value);
    } catch {
      return undefined;
    }
  }
  
  return undefined;
}

/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number.
 * This function implements the standard CPF validation algorithm used in Brazil.
 * 
 * The algorithm works as follows:
 * 1. Remove all non-digit characters
 * 2. Check if the CPF has 11 digits
 * 3. Check if all digits are the same (invalid CPF)
 * 4. Calculate the first verification digit
 * 5. Calculate the second verification digit
 * 6. Verify if calculated digits match the CPF's verification digits
 * 
 * @param cpf - The CPF string to validate
 * @param allowFormatted - Whether to allow formatted CPF (with dots and dash)
 * @returns True if the CPF is valid, false otherwise
 * 
 * @example
 * // Basic usage with unformatted CPF
 * validateCPF('12345678909'); // returns false (invalid CPF)
 * 
 * // With formatted CPF
 * validateCPF('123.456.789-09', true); // returns false (invalid CPF)
 */
export function validateCPF(cpf: unknown, allowFormatted = true): boolean {
  // Handle null and undefined
  if (cpf === null || cpf === undefined) {
    return false;
  }
  
  // Convert to string if possible
  const cpfString = toStringOrUndefined(cpf);
  if (cpfString === undefined) {
    return false;
  }
  
  // Initial format validation
  if (!allowFormatted && !/^\d{11}$/.test(cpfString)) {
    return false;
  }
  
  if (allowFormatted && !ValidationPatterns.CPF.test(cpfString)) {
    return false;
  }
  
  // Remove non-digit characters
  const cleanCPF = cpfString.replace(/\D/g, '');
  
  // CPF must have 11 digits
  if (cleanCPF.length !== 11) {
    return false;
  }
  
  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1+$/.test(cleanCPF)) {
    return false;
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
  return (
    parseInt(cleanCPF.charAt(9)) === digit1 &&
    parseInt(cleanCPF.charAt(10)) === digit2
  );
}

/**
 * Validates an email address using a regular expression pattern.
 * 
 * @param email - The email to validate
 * @param strict - Whether to use strict validation rules
 * @returns True if the email is valid, false otherwise
 * 
 * @example
 * // Basic validation
 * validateEmail('user@example.com'); // returns true
 * 
 * // Strict validation
 * validateEmail('user@example', true); // returns false (missing TLD)
 */
export function validateEmail(email: unknown, strict = false): boolean {
  // Handle null and undefined
  if (email === null || email === undefined) {
    return false;
  }
  
  // Convert to string if possible
  const emailString = toStringOrUndefined(email);
  if (emailString === undefined) {
    return false;
  }
  
  // Trim the email
  const trimmedEmail = emailString.trim();
  
  // Basic validation
  if (!ValidationPatterns.EMAIL_BASIC.test(trimmedEmail)) {
    return false;
  }
  
  // Strict validation if required
  if (strict && !ValidationPatterns.EMAIL_STRICT.test(trimmedEmail)) {
    return false;
  }
  
  // Check for maximum length (RFC 5321)
  if (trimmedEmail.length > 254) {
    return false;
  }
  
  // Check local part length (RFC 5321)
  const localPart = trimmedEmail.split('@')[0];
  if (localPart.length > 64) {
    return false;
  }
  
  return true;
}

/**
 * Validates a URL with optional SSRF protection.
 * 
 * @param url - The URL to validate
 * @param requireHttps - Whether to require HTTPS protocol
 * @param checkSsrf - Whether to check for SSRF vulnerabilities
 * @returns True if the URL is valid and safe, false otherwise
 * 
 * @example
 * // Basic validation
 * validateUrl('https://example.com'); // returns true
 * 
 * // With HTTPS requirement
 * validateUrl('http://example.com', true); // returns false (not HTTPS)
 * 
 * // With SSRF protection
 * validateUrl('http://localhost:3000', false, true); // returns false (local address)
 */
export function validateUrl(url: unknown, requireHttps = false, checkSsrf = false): boolean {
  // Handle null and undefined
  if (url === null || url === undefined) {
    return false;
  }
  
  // Convert to string if possible
  const urlString = toStringOrUndefined(url);
  if (urlString === undefined) {
    return false;
  }
  
  // Trim the URL
  const trimmedUrl = urlString.trim();
  
  // Basic URL validation
  if (!ValidationPatterns.URL.test(trimmedUrl)) {
    return false;
  }
  
  try {
    const parsedUrl = new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `http://${trimmedUrl}`);
    
    // Check if HTTPS is required
    if (requireHttps && parsedUrl.protocol !== 'https:') {
      return false;
    }
    
    // SSRF protection
    if (checkSsrf) {
      const hostname = parsedUrl.hostname;
      
      // Block requests to private IP ranges
      if (ValidationPatterns.PRIVATE_IP.test(hostname)) {
        return false;
      }
    }
    
    return true;
  } catch {
    // If there's an error parsing the URL, it's invalid
    return false;
  }
}

/**
 * Validates if a string matches a regular expression pattern.
 * 
 * @param value - The string to validate
 * @param pattern - The pattern to match against
 * @param invertMatch - Whether to invert the match (valid if it does NOT match the pattern)
 * @returns True if the string matches the pattern, false otherwise
 * 
 * @example
 * // Basic pattern matching
 * validatePattern('abc123', /^[a-z0-9]+$/); // returns true
 * 
 * // Inverted pattern matching
 * validatePattern('abc', /^\d+$/, true); // returns true (not numeric)
 */
export function validatePattern(value: unknown, pattern: RegExp, invertMatch = false): boolean {
  // Handle null and undefined
  if (value === null || value === undefined) {
    return false;
  }
  
  // Convert to string if possible
  const stringValue = toStringOrUndefined(value);
  if (stringValue === undefined) {
    return false;
  }
  
  // Match the pattern
  const isMatch = pattern.test(stringValue);
  
  // Return the result based on invertMatch
  return invertMatch ? !isMatch : isMatch;
}

/**
 * Validates the length of a string.
 * 
 * @param value - The string to validate
 * @param min - Minimum length (inclusive)
 * @param max - Maximum length (inclusive)
 * @param exact - Exact length required (overrides min and max)
 * @returns True if the string length is valid, false otherwise
 * 
 * @example
 * // Check if string length is between 5 and 10
 * validateLength('hello world', 5, 20); // returns true
 * 
 * // Check if string has exact length
 * validateLength('12345', undefined, undefined, 5); // returns true
 */
export function validateLength(
  value: unknown,
  min?: number,
  max?: number,
  exact?: number
): boolean {
  // Handle null and undefined
  if (value === null || value === undefined) {
    return false;
  }
  
  // Convert to string if possible
  const stringValue = toStringOrUndefined(value);
  if (stringValue === undefined) {
    return false;
  }
  
  // Get the string length
  const length = stringValue.length;
  
  // Check exact length if specified
  if (exact !== undefined) {
    return length === exact;
  }
  
  // Check minimum length if specified
  if (min !== undefined && length < min) {
    return false;
  }
  
  // Check maximum length if specified
  if (max !== undefined && length > max) {
    return false;
  }
  
  return true;
}

/**
 * Checks if a string is empty (length === 0 after trimming).
 * 
 * @param value - The string to check
 * @param trim - Whether to trim the string before checking
 * @returns True if the string is empty, false otherwise
 * 
 * @example
 * // Check if string is empty
 * isEmpty(''); // returns true
 * 
 * // Check if string is empty after trimming
 * isEmpty('   ', true); // returns true
 */
export function isEmpty(value: unknown, trim = true): boolean {
  // Handle null and undefined
  if (value === null || value === undefined) {
    return true;
  }
  
  // Convert to string if possible
  const stringValue = toStringOrUndefined(value);
  if (stringValue === undefined) {
    return true;
  }
  
  // Check if empty
  return trim ? stringValue.trim().length === 0 : stringValue.length === 0;
}

/**
 * Checks if a string is not empty (length > 0 after trimming).
 * 
 * @param value - The string to check
 * @param trim - Whether to trim the string before checking
 * @returns True if the string is not empty, false otherwise
 * 
 * @example
 * // Check if string is not empty
 * isNotEmpty('hello'); // returns true
 * 
 * // Check if string is not empty after trimming
 * isNotEmpty('   hello   ', true); // returns true
 */
export function isNotEmpty(value: unknown, trim = true): boolean {
  return !isEmpty(value, trim);
}

/**
 * Checks if a string contains only alphanumeric characters.
 * 
 * @param value - The string to check
 * @returns True if the string contains only alphanumeric characters, false otherwise
 * 
 * @example
 * isAlphanumeric('abc123'); // returns true
 * isAlphanumeric('abc-123'); // returns false
 */
export function isAlphanumeric(value: unknown): boolean {
  return validatePattern(value, ValidationPatterns.ALPHANUMERIC);
}

/**
 * Checks if a string contains only alphabetic characters.
 * 
 * @param value - The string to check
 * @returns True if the string contains only alphabetic characters, false otherwise
 * 
 * @example
 * isAlphabetic('abcDEF'); // returns true
 * isAlphabetic('abc123'); // returns false
 */
export function isAlphabetic(value: unknown): boolean {
  return validatePattern(value, ValidationPatterns.ALPHABETIC);
}

/**
 * Checks if a string contains only numeric characters.
 * 
 * @param value - The string to check
 * @returns True if the string contains only numeric characters, false otherwise
 * 
 * @example
 * isNumeric('12345'); // returns true
 * isNumeric('123abc'); // returns false
 */
export function isNumeric(value: unknown): boolean {
  return validatePattern(value, ValidationPatterns.NUMERIC);
}

/**
 * Checks if a string is a valid UUID v4.
 * 
 * @param value - The string to check
 * @returns True if the string is a valid UUID v4, false otherwise
 * 
 * @example
 * isUuid('123e4567-e89b-12d3-a456-426614174000'); // returns true
 * isUuid('not-a-uuid'); // returns false
 */
export function isUuid(value: unknown): boolean {
  return validatePattern(value, ValidationPatterns.UUID);
}

/**
 * Checks if a string is a valid strong password.
 * 
 * @param value - The string to check
 * @returns True if the string is a valid strong password, false otherwise
 * 
 * @example
 * isStrongPassword('P@ssw0rd'); // returns true
 * isStrongPassword('password'); // returns false
 */
export function isStrongPassword(value: unknown): boolean {
  return validatePattern(value, ValidationPatterns.STRONG_PASSWORD);
}

/**
 * Validates a Brazilian email domain.
 * 
 * @param email - The email to validate
 * @returns True if the email has a Brazilian domain, false otherwise
 * 
 * @example
 * isBrazilianEmail('user@empresa.com.br'); // returns true
 * isBrazilianEmail('user@example.com'); // returns false
 */
export function isBrazilianEmail(email: unknown): boolean {
  // First validate that it's a valid email
  if (!validateEmail(email)) {
    return false;
  }
  
  // Convert to string (we know it's valid from the previous check)
  const emailString = String(email);
  
  // Check if the domain is Brazilian
  return validatePattern(emailString, ValidationPatterns.BRAZILIAN_EMAIL_DOMAINS);
}

/**
 * Normalizes a CPF by removing non-digit characters.
 * 
 * @param cpf - The CPF to normalize
 * @returns The normalized CPF, or undefined if the input is invalid
 * 
 * @example
 * normalizeCPF('123.456.789-09'); // returns '12345678909'
 * normalizeCPF('invalid'); // returns undefined
 */
export function normalizeCPF(cpf: unknown): string | undefined {
  // Handle null and undefined
  if (cpf === null || cpf === undefined) {
    return undefined;
  }
  
  // Convert to string if possible
  const cpfString = toStringOrUndefined(cpf);
  if (cpfString === undefined) {
    return undefined;
  }
  
  // Remove non-digit characters
  const cleanCPF = cpfString.replace(/\D/g, '');
  
  // Check if the result is a valid CPF format
  if (cleanCPF.length !== 11) {
    return undefined;
  }
  
  return cleanCPF;
}

/**
 * Formats a CPF with the standard Brazilian format (XXX.XXX.XXX-XX).
 * 
 * @param cpf - The CPF to format
 * @returns The formatted CPF, or undefined if the input is invalid
 * 
 * @example
 * formatCPF('12345678909'); // returns '123.456.789-09'
 * formatCPF('invalid'); // returns undefined
 */
export function formatCPF(cpf: unknown): string | undefined {
  const normalizedCPF = normalizeCPF(cpf);
  if (normalizedCPF === undefined) {
    return undefined;
  }
  
  return normalizedCPF.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * Validates a string against multiple patterns.
 * 
 * @param value - The string to validate
 * @param patterns - Array of patterns to match against
 * @param matchAll - Whether all patterns must match (AND) or at least one (OR)
 * @returns True if the string matches the patterns according to the matchAll parameter
 * 
 * @example
 * // Check if string matches all patterns
 * validateMultiplePatterns('abc123', [/[a-z]+/, /\d+/], true); // returns true
 * 
 * // Check if string matches at least one pattern
 * validateMultiplePatterns('abc', [/^\d+$/, /^[a-z]+$/], false); // returns true
 */
export function validateMultiplePatterns(
  value: unknown,
  patterns: RegExp[],
  matchAll = true
): boolean {
  // Handle null and undefined
  if (value === null || value === undefined) {
    return false;
  }
  
  // Convert to string if possible
  const stringValue = toStringOrUndefined(value);
  if (stringValue === undefined) {
    return false;
  }
  
  // If no patterns provided, return false
  if (!patterns || patterns.length === 0) {
    return false;
  }
  
  // Check against all patterns
  if (matchAll) {
    // All patterns must match (AND)
    return patterns.every(pattern => pattern.test(stringValue));
  } else {
    // At least one pattern must match (OR)
    return patterns.some(pattern => pattern.test(stringValue));
  }
}

/**
 * Validates if a string contains a substring.
 * 
 * @param value - The string to check
 * @param substring - The substring to look for
 * @param ignoreCase - Whether to ignore case when comparing
 * @returns True if the string contains the substring, false otherwise
 * 
 * @example
 * // Case-sensitive check
 * containsSubstring('Hello World', 'World'); // returns true
 * 
 * // Case-insensitive check
 * containsSubstring('Hello World', 'world', true); // returns true
 */
export function containsSubstring(
  value: unknown,
  substring: string,
  ignoreCase = false
): boolean {
  // Handle null and undefined
  if (value === null || value === undefined) {
    return false;
  }
  
  // Convert to string if possible
  const stringValue = toStringOrUndefined(value);
  if (stringValue === undefined) {
    return false;
  }
  
  // If substring is empty, always return true
  if (substring === '') {
    return true;
  }
  
  // Check if the string contains the substring
  if (ignoreCase) {
    return stringValue.toLowerCase().includes(substring.toLowerCase());
  } else {
    return stringValue.includes(substring);
  }
}

/**
 * Validates if a string starts with a prefix.
 * 
 * @param value - The string to check
 * @param prefix - The prefix to look for
 * @param ignoreCase - Whether to ignore case when comparing
 * @returns True if the string starts with the prefix, false otherwise
 * 
 * @example
 * // Case-sensitive check
 * startsWith('Hello World', 'Hello'); // returns true
 * 
 * // Case-insensitive check
 * startsWith('Hello World', 'hello', true); // returns true
 */
export function startsWith(
  value: unknown,
  prefix: string,
  ignoreCase = false
): boolean {
  // Handle null and undefined
  if (value === null || value === undefined) {
    return false;
  }
  
  // Convert to string if possible
  const stringValue = toStringOrUndefined(value);
  if (stringValue === undefined) {
    return false;
  }
  
  // If prefix is empty, always return true
  if (prefix === '') {
    return true;
  }
  
  // Check if the string starts with the prefix
  if (ignoreCase) {
    return stringValue.toLowerCase().startsWith(prefix.toLowerCase());
  } else {
    return stringValue.startsWith(prefix);
  }
}

/**
 * Validates if a string ends with a suffix.
 * 
 * @param value - The string to check
 * @param suffix - The suffix to look for
 * @param ignoreCase - Whether to ignore case when comparing
 * @returns True if the string ends with the suffix, false otherwise
 * 
 * @example
 * // Case-sensitive check
 * endsWith('Hello World', 'World'); // returns true
 * 
 * // Case-insensitive check
 * endsWith('Hello World', 'world', true); // returns true
 */
export function endsWith(
  value: unknown,
  suffix: string,
  ignoreCase = false
): boolean {
  // Handle null and undefined
  if (value === null || value === undefined) {
    return false;
  }
  
  // Convert to string if possible
  const stringValue = toStringOrUndefined(value);
  if (stringValue === undefined) {
    return false;
  }
  
  // If suffix is empty, always return true
  if (suffix === '') {
    return true;
  }
  
  // Check if the string ends with the suffix
  if (ignoreCase) {
    return stringValue.toLowerCase().endsWith(suffix.toLowerCase());
  } else {
    return stringValue.endsWith(suffix);
  }
}

// Export default for convenient importing
export default {
  validateCPF,
  validateEmail,
  validateUrl,
  validatePattern,
  validateLength,
  isEmpty,
  isNotEmpty,
  isAlphanumeric,
  isAlphabetic,
  isNumeric,
  isUuid,
  isStrongPassword,
  isBrazilianEmail,
  normalizeCPF,
  formatCPF,
  validateMultiplePatterns,
  containsSubstring,
  startsWith,
  endsWith,
  ValidationPatterns,
};