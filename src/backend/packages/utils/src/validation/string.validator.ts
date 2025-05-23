/**
 * @file String Validation Utilities
 * @description Provides string validation utilities that standardize string validation across all backend services.
 * Includes functions for validating Brazilian CPF numbers, email addresses, URLs, checking string length and pattern matching.
 * The validators are designed to be used independently or integrated with third-party validation libraries like Zod and class-validator.
 *
 * @module @austa/utils/validation/string
 */

import { ValidationOptions, ValidationResult, StringValidationOptions } from './index';

/**
 * Common regular expression patterns used for string validation.
 */
export const StringPatterns = {
  /** Brazilian CPF pattern with or without formatting */
  CPF: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
  
  /** Basic email pattern for initial validation */
  EMAIL_BASIC: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  /** Comprehensive email pattern for strict validation */
  EMAIL_STRICT: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  
  /** Brazilian email domains for additional validation */
  BRAZILIAN_EMAIL_DOMAINS: /\.(br|com\.br|org\.br|edu\.br|gov\.br)$/i,
  
  /** URL pattern for basic validation */
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  
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
 * Options for string pattern validation.
 */
export interface PatternValidationOptions extends StringValidationOptions {
  /** The pattern to match against */
  pattern?: RegExp;
  /** Whether to invert the match (valid if it does NOT match the pattern) */
  invertMatch?: boolean;
}

/**
 * Options for string length validation.
 */
export interface StringLengthOptions extends StringValidationOptions {
  /** Minimum length (inclusive) */
  min?: number;
  /** Maximum length (inclusive) */
  max?: number;
  /** Exact length required */
  exact?: number;
}

/**
 * Options for email validation.
 */
export interface EmailValidationOptions extends StringValidationOptions {
  /** Whether to use strict validation rules */
  strict?: boolean;
  /** Whether to check for valid domain */
  checkDomain?: boolean;
  /** Whether to specifically validate Brazilian email domains */
  validateBrazilianDomains?: boolean;
}

/**
 * Options for URL validation.
 */
export interface UrlValidationOptions extends StringValidationOptions {
  /** Whether to require HTTPS protocol */
  requireHttps?: boolean;
  /** Whether to check for SSRF vulnerabilities */
  checkSsrf?: boolean;
  /** List of allowed domains (if empty, all domains are allowed) */
  allowedDomains?: string[];
  /** List of blocked domains */
  blockedDomains?: string[];
}

/**
 * Options for CPF validation.
 */
export interface CpfValidationOptions extends StringValidationOptions {
  /** Whether to allow formatted CPF (with dots and dash) */
  allowFormatted?: boolean;
  /** Whether to validate the verification digits */
  validateDigits?: boolean;
}

/**
 * Validates a string against a regular expression pattern.
 * 
 * @param value - The string to validate
 * @param options - Validation options
 * @returns True if the string matches the pattern, false otherwise
 * 
 * @example
 * // Basic usage
 * const isValid = matchesPattern('abc123', { pattern: /^[a-z0-9]+$/ });
 * 
 * // With custom options
 * const isNotNumeric = matchesPattern('abc', {
 *   pattern: /^\d+$/,
 *   invertMatch: true,
 *   ignoreCase: true
 * });
 */
export function matchesPattern(value: string, options: PatternValidationOptions = {}): boolean {
  if (value === null && options.allowNull) return true;
  if (value === undefined && options.allowUndefined) return true;
  if (value === null || value === undefined) return false;
  
  const {
    pattern = /.*/,
    invertMatch = false,
    trim = true,
    ignoreCase = false,
    throwOnError = false,
    errorMessage = 'String does not match the required pattern',
  } = options;
  
  let stringToTest = String(value);
  if (trim) stringToTest = stringToTest.trim();
  
  const flags = pattern.flags + (ignoreCase && !pattern.flags.includes('i') ? 'i' : '');
  const regExp = new RegExp(pattern.source, flags);
  
  const isMatch = regExp.test(stringToTest);
  const isValid = invertMatch ? !isMatch : isMatch;
  
  if (!isValid && throwOnError) {
    throw new Error(errorMessage);
  }
  
  return isValid;
}

/**
 * Validates a string against a regular expression pattern with detailed results.
 * 
 * @param value - The string to validate
 * @param options - Validation options
 * @returns Validation result with details
 * 
 * @example
 * const result = validatePattern('abc123', { pattern: /^[a-z0-9]+$/ });
 * if (!result.valid) {
 *   console.error(result.message);
 * }
 */
export function validatePattern(value: string, options: PatternValidationOptions = {}): ValidationResult {
  if (value === null && options.allowNull) {
    return { valid: true, value };
  }
  if (value === undefined && options.allowUndefined) {
    return { valid: true, value };
  }
  if (value === null || value === undefined) {
    return {
      valid: false,
      message: 'Value is null or undefined',
      value
    };
  }
  
  const {
    pattern = /.*/,
    invertMatch = false,
    trim = true,
    ignoreCase = false,
    errorMessage,
  } = options;
  
  let stringToTest = String(value);
  if (trim) stringToTest = stringToTest.trim();
  
  const flags = pattern.flags + (ignoreCase && !pattern.flags.includes('i') ? 'i' : '');
  const regExp = new RegExp(pattern.source, flags);
  
  const isMatch = regExp.test(stringToTest);
  const isValid = invertMatch ? !isMatch : isMatch;
  
  if (!isValid) {
    return {
      valid: false,
      message: errorMessage || `String does not match the required pattern: ${pattern}`,
      details: { pattern: pattern.toString(), value: stringToTest, invertMatch },
      value
    };
  }
  
  return { valid: true, value };
}

/**
 * Validates the length of a string.
 * 
 * @param value - The string to validate
 * @param options - Validation options
 * @returns True if the string length is valid, false otherwise
 * 
 * @example
 * // Check if string length is between 5 and 10
 * const isValid = isValidLength('hello world', { min: 5, max: 20 });
 * 
 * // Check if string has exact length
 * const hasExactLength = isValidLength('12345', { exact: 5 });
 */
export function isValidLength(value: string, options: StringLengthOptions = {}): boolean {
  if (value === null && options.allowNull) return true;
  if (value === undefined && options.allowUndefined) return true;
  if (value === null || value === undefined) return false;
  
  const {
    min,
    max,
    exact,
    trim = true,
    throwOnError = false,
    errorMessage,
  } = options;
  
  let stringToCheck = String(value);
  if (trim) stringToCheck = stringToCheck.trim();
  
  const length = stringToCheck.length;
  let isValid = true;
  let errorMsg = errorMessage;
  
  if (exact !== undefined && length !== exact) {
    isValid = false;
    errorMsg = errorMsg || `String must be exactly ${exact} characters long`;
  } else {
    if (min !== undefined && length < min) {
      isValid = false;
      errorMsg = errorMsg || `String must be at least ${min} characters long`;
    }
    
    if (max !== undefined && length > max) {
      isValid = false;
      errorMsg = errorMsg || `String must be at most ${max} characters long`;
    }
  }
  
  if (!isValid && throwOnError) {
    throw new Error(errorMsg || 'Invalid string length');
  }
  
  return isValid;
}

/**
 * Validates the length of a string with detailed results.
 * 
 * @param value - The string to validate
 * @param options - Validation options
 * @returns Validation result with details
 * 
 * @example
 * const result = validateLength('hello', { min: 10 });
 * if (!result.valid) {
 *   console.error(result.message); // "String must be at least 10 characters long"
 * }
 */
export function validateLength(value: string, options: StringLengthOptions = {}): ValidationResult {
  if (value === null && options.allowNull) {
    return { valid: true, value };
  }
  if (value === undefined && options.allowUndefined) {
    return { valid: true, value };
  }
  if (value === null || value === undefined) {
    return {
      valid: false,
      message: 'Value is null or undefined',
      value
    };
  }
  
  const {
    min,
    max,
    exact,
    trim = true,
    errorMessage,
  } = options;
  
  let stringToCheck = String(value);
  if (trim) stringToCheck = stringToCheck.trim();
  
  const length = stringToCheck.length;
  let isValid = true;
  let message = errorMessage;
  
  if (exact !== undefined && length !== exact) {
    isValid = false;
    message = message || `String must be exactly ${exact} characters long`;
  } else {
    if (min !== undefined && length < min) {
      isValid = false;
      message = message || `String must be at least ${min} characters long`;
    }
    
    if (max !== undefined && length > max) {
      isValid = false;
      message = message || `String must be at most ${max} characters long`;
    }
  }
  
  if (!isValid) {
    return {
      valid: false,
      message: message || 'Invalid string length',
      details: { length, min, max, exact },
      value
    };
  }
  
  return { valid: true, value };
}

/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number.
 * This function implements the standard CPF validation algorithm used in Brazil.
 * 
 * @param cpf - The CPF string to validate
 * @param options - Validation options
 * @returns True if the CPF is valid, false otherwise
 * 
 * @example
 * // Basic usage
 * const isValid = isValidCPF('123.456.789-09');
 * 
 * // With options
 * const isValid = isValidCPF('12345678909', { allowFormatted: false });
 */
export function isValidCPF(cpf: string, options: CpfValidationOptions = {}): boolean {
  if (cpf === null && options.allowNull) return true;
  if (cpf === undefined && options.allowUndefined) return true;
  if (cpf === null || cpf === undefined) return false;
  
  const {
    allowFormatted = true,
    validateDigits = true,
    throwOnError = false,
    errorMessage = 'Invalid CPF number',
  } = options;
  
  // Initial format validation
  if (!allowFormatted && !/^\d{11}$/.test(cpf)) {
    if (throwOnError) throw new Error(errorMessage);
    return false;
  }
  
  if (allowFormatted && !StringPatterns.CPF.test(cpf)) {
    if (throwOnError) throw new Error(errorMessage);
    return false;
  }
  
  // Remove non-digit characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // CPF must have 11 digits
  if (cleanCPF.length !== 11) {
    if (throwOnError) throw new Error(errorMessage);
    return false;
  }
  
  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1+$/.test(cleanCPF)) {
    if (throwOnError) throw new Error(errorMessage);
    return false;
  }
  
  // If we don't need to validate the verification digits, return true at this point
  if (!validateDigits) {
    return true;
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
  
  if (!isValid && throwOnError) {
    throw new Error(errorMessage);
  }
  
  return isValid;
}

/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number with detailed results.
 * 
 * @param cpf - The CPF string to validate
 * @param options - Validation options
 * @returns Validation result with details
 * 
 * @example
 * const result = validateCPF('123.456.789-09');
 * if (!result.valid) {
 *   console.error(result.message);
 * }
 */
export function validateCPF(cpf: string, options: CpfValidationOptions = {}): ValidationResult {
  if (cpf === null && options.allowNull) {
    return { valid: true, value: cpf };
  }
  if (cpf === undefined && options.allowUndefined) {
    return { valid: true, value: cpf };
  }
  if (cpf === null || cpf === undefined) {
    return {
      valid: false,
      message: 'CPF is null or undefined',
      value: cpf
    };
  }
  
  const {
    allowFormatted = true,
    validateDigits = true,
    errorMessage,
  } = options;
  
  // Initial format validation
  if (!allowFormatted && !/^\d{11}$/.test(cpf)) {
    return {
      valid: false,
      message: errorMessage || 'CPF must contain exactly 11 digits without formatting',
      details: { format: 'invalid', expected: 'unformatted 11 digits' },
      value: cpf
    };
  }
  
  if (allowFormatted && !StringPatterns.CPF.test(cpf)) {
    return {
      valid: false,
      message: errorMessage || 'CPF format is invalid',
      details: { format: 'invalid', expected: 'XXX.XXX.XXX-XX or XXXXXXXXXXX' },
      value: cpf
    };
  }
  
  // Remove non-digit characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // CPF must have 11 digits
  if (cleanCPF.length !== 11) {
    return {
      valid: false,
      message: errorMessage || 'CPF must contain exactly 11 digits',
      details: { length: cleanCPF.length, expected: 11 },
      value: cpf
    };
  }
  
  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1+$/.test(cleanCPF)) {
    return {
      valid: false,
      message: errorMessage || 'CPF with repeated digits is invalid',
      details: { repeatedDigits: true },
      value: cpf
    };
  }
  
  // If we don't need to validate the verification digits, return true at this point
  if (!validateDigits) {
    return { valid: true, value: cpf };
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
  const actualDigit1 = parseInt(cleanCPF.charAt(9));
  const actualDigit2 = parseInt(cleanCPF.charAt(10));
  
  if (actualDigit1 !== digit1 || actualDigit2 !== digit2) {
    return {
      valid: false,
      message: errorMessage || 'CPF verification digits are invalid',
      details: {
        expectedDigit1: digit1,
        actualDigit1,
        expectedDigit2: digit2,
        actualDigit2
      },
      value: cpf
    };
  }
  
  return { valid: true, value: cpf };
}

/**
 * Validates an email address.
 * 
 * @param email - The email to validate
 * @param options - Validation options
 * @returns True if the email is valid, false otherwise
 * 
 * @example
 * // Basic usage
 * const isValid = isValidEmail('user@example.com');
 * 
 * // With options
 * const isValid = isValidEmail('user@empresa.com.br', {
 *   strict: true,
 *   validateBrazilianDomains: true
 * });
 */
export function isValidEmail(email: string, options: EmailValidationOptions = {}): boolean {
  if (email === null && options.allowNull) return true;
  if (email === undefined && options.allowUndefined) return true;
  if (email === null || email === undefined) return false;
  
  const {
    strict = false,
    checkDomain = false,
    validateBrazilianDomains = false,
    trim = true,
    throwOnError = false,
    errorMessage = 'Invalid email address',
  } = options;
  
  let emailToCheck = String(email);
  if (trim) emailToCheck = emailToCheck.trim();
  
  // Basic validation
  if (!StringPatterns.EMAIL_BASIC.test(emailToCheck)) {
    if (throwOnError) throw new Error(errorMessage);
    return false;
  }
  
  // Strict validation if required
  if (strict && !StringPatterns.EMAIL_STRICT.test(emailToCheck)) {
    if (throwOnError) throw new Error(errorMessage);
    return false;
  }
  
  // Check for maximum length (RFC 5321)
  if (emailToCheck.length > 254) {
    if (throwOnError) throw new Error(errorMessage);
    return false;
  }
  
  // Check local part length (RFC 5321)
  const localPart = emailToCheck.split('@')[0];
  if (localPart.length > 64) {
    if (throwOnError) throw new Error(errorMessage);
    return false;
  }
  
  // Brazilian domain validation if required
  if (validateBrazilianDomains) {
    const isDomainBrazilian = StringPatterns.BRAZILIAN_EMAIL_DOMAINS.test(emailToCheck);
    if (!isDomainBrazilian) {
      if (throwOnError) throw new Error('Email domain is not Brazilian');
      return false;
    }
  }
  
  // Domain validation is not implemented here as it requires DNS lookups
  // which should be done asynchronously. If checkDomain is true, this would
  // be a place to add a warning log that synchronous domain validation is skipped.
  if (checkDomain) {
    console.warn('Domain validation requires asynchronous DNS lookups and is not implemented in isValidEmail');
  }
  
  return true;
}

/**
 * Validates an email address with detailed results.
 * 
 * @param email - The email to validate
 * @param options - Validation options
 * @returns Validation result with details
 * 
 * @example
 * const result = validateEmail('user@example');
 * if (!result.valid) {
 *   console.error(result.message);
 * }
 */
export function validateEmail(email: string, options: EmailValidationOptions = {}): ValidationResult {
  if (email === null && options.allowNull) {
    return { valid: true, value: email };
  }
  if (email === undefined && options.allowUndefined) {
    return { valid: true, value: email };
  }
  if (email === null || email === undefined) {
    return {
      valid: false,
      message: 'Email is null or undefined',
      value: email
    };
  }
  
  const {
    strict = false,
    checkDomain = false,
    validateBrazilianDomains = false,
    trim = true,
    errorMessage,
  } = options;
  
  let emailToCheck = String(email);
  if (trim) emailToCheck = emailToCheck.trim();
  
  // Basic validation
  if (!StringPatterns.EMAIL_BASIC.test(emailToCheck)) {
    return {
      valid: false,
      message: errorMessage || 'Email format is invalid',
      details: { format: 'invalid', pattern: 'basic' },
      value: email
    };
  }
  
  // Strict validation if required
  if (strict && !StringPatterns.EMAIL_STRICT.test(emailToCheck)) {
    return {
      valid: false,
      message: errorMessage || 'Email does not meet strict format requirements',
      details: { format: 'invalid', pattern: 'strict' },
      value: email
    };
  }
  
  // Check for maximum length (RFC 5321)
  if (emailToCheck.length > 254) {
    return {
      valid: false,
      message: errorMessage || 'Email exceeds maximum length of 254 characters',
      details: { length: emailToCheck.length, maxAllowed: 254 },
      value: email
    };
  }
  
  // Check local part length (RFC 5321)
  const localPart = emailToCheck.split('@')[0];
  if (localPart.length > 64) {
    return {
      valid: false,
      message: errorMessage || 'Email local part exceeds maximum length of 64 characters',
      details: { localPartLength: localPart.length, maxAllowed: 64 },
      value: email
    };
  }
  
  // Brazilian domain validation if required
  if (validateBrazilianDomains) {
    const isDomainBrazilian = StringPatterns.BRAZILIAN_EMAIL_DOMAINS.test(emailToCheck);
    if (!isDomainBrazilian) {
      return {
        valid: false,
        message: errorMessage || 'Email domain is not Brazilian',
        details: { requiresBrazilianDomain: true },
        value: email
      };
    }
  }
  
  // Domain validation warning
  if (checkDomain) {
    return {
      valid: true,
      message: 'Domain validation requires asynchronous DNS lookups and is not implemented',
      details: { domainValidationSkipped: true },
      value: email
    };
  }
  
  return { valid: true, value: email };
}

/**
 * Validates a URL with optional SSRF protection.
 * 
 * @param url - The URL to validate
 * @param options - Validation options
 * @returns True if the URL is valid and safe, false otherwise
 * 
 * @example
 * // Basic usage
 * const isValid = isValidUrl('https://example.com');
 * 
 * // With SSRF protection
 * const isValid = isValidUrl('https://api.example.com', {
 *   checkSsrf: true,
 *   requireHttps: true
 * });
 */
export function isValidUrl(url: string, options: UrlValidationOptions = {}): boolean {
  if (url === null && options.allowNull) return true;
  if (url === undefined && options.allowUndefined) return true;
  if (url === null || url === undefined) return false;
  
  const {
    requireHttps = false,
    checkSsrf = false,
    allowedDomains = [],
    blockedDomains = [],
    trim = true,
    throwOnError = false,
    errorMessage = 'Invalid URL',
  } = options;
  
  let urlToCheck = String(url);
  if (trim) urlToCheck = urlToCheck.trim();
  
  // Basic URL validation
  if (!StringPatterns.URL.test(urlToCheck)) {
    if (throwOnError) throw new Error(errorMessage);
    return false;
  }
  
  try {
    const parsedUrl = new URL(urlToCheck.startsWith('http') ? urlToCheck : `http://${urlToCheck}`);
    
    // Check if HTTPS is required
    if (requireHttps && parsedUrl.protocol !== 'https:') {
      if (throwOnError) throw new Error('URL must use HTTPS protocol');
      return false;
    }
    
    // Check allowed domains if specified
    if (allowedDomains.length > 0) {
      const isAllowedDomain = allowedDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowedDomain) {
        if (throwOnError) throw new Error('URL domain is not in the allowed list');
        return false;
      }
    }
    
    // Check blocked domains
    if (blockedDomains.length > 0) {
      const isBlockedDomain = blockedDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      );
      
      if (isBlockedDomain) {
        if (throwOnError) throw new Error('URL domain is in the blocked list');
        return false;
      }
    }
    
    // SSRF protection
    if (checkSsrf) {
      const hostname = parsedUrl.hostname;
      
      // Block requests to private IP ranges
      if (StringPatterns.PRIVATE_IP.test(hostname)) {
        if (throwOnError) throw new Error('SSRF Protection: Blocked URL to private or local network');
        return false;
      }
      
      // Additional SSRF checks could be added here
    }
    
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('SSRF Protection')) {
      if (throwOnError) throw error;
      return false;
    }
    
    // If there's an error parsing the URL, it's invalid
    if (throwOnError) throw new Error(errorMessage);
    return false;
  }
}

/**
 * Validates a URL with optional SSRF protection with detailed results.
 * 
 * @param url - The URL to validate
 * @param options - Validation options
 * @returns Validation result with details
 * 
 * @example
 * const result = validateUrl('http://localhost:3000');
 * if (!result.valid) {
 *   console.error(result.message);
 * }
 */
export function validateUrl(url: string, options: UrlValidationOptions = {}): ValidationResult {
  if (url === null && options.allowNull) {
    return { valid: true, value: url };
  }
  if (url === undefined && options.allowUndefined) {
    return { valid: true, value: url };
  }
  if (url === null || url === undefined) {
    return {
      valid: false,
      message: 'URL is null or undefined',
      value: url
    };
  }
  
  const {
    requireHttps = false,
    checkSsrf = false,
    allowedDomains = [],
    blockedDomains = [],
    trim = true,
    errorMessage,
  } = options;
  
  let urlToCheck = String(url);
  if (trim) urlToCheck = urlToCheck.trim();
  
  // Basic URL validation
  if (!StringPatterns.URL.test(urlToCheck)) {
    return {
      valid: false,
      message: errorMessage || 'URL format is invalid',
      details: { format: 'invalid' },
      value: url
    };
  }
  
  try {
    const parsedUrl = new URL(urlToCheck.startsWith('http') ? urlToCheck : `http://${urlToCheck}`);
    
    // Check if HTTPS is required
    if (requireHttps && parsedUrl.protocol !== 'https:') {
      return {
        valid: false,
        message: errorMessage || 'URL must use HTTPS protocol',
        details: { protocol: parsedUrl.protocol, required: 'https:' },
        value: url
      };
    }
    
    // Check allowed domains if specified
    if (allowedDomains.length > 0) {
      const isAllowedDomain = allowedDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowedDomain) {
        return {
          valid: false,
          message: errorMessage || 'URL domain is not in the allowed list',
          details: { hostname: parsedUrl.hostname, allowedDomains },
          value: url
        };
      }
    }
    
    // Check blocked domains
    if (blockedDomains.length > 0) {
      const isBlockedDomain = blockedDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      );
      
      if (isBlockedDomain) {
        return {
          valid: false,
          message: errorMessage || 'URL domain is in the blocked list',
          details: { hostname: parsedUrl.hostname, blockedDomains },
          value: url
        };
      }
    }
    
    // SSRF protection
    if (checkSsrf) {
      const hostname = parsedUrl.hostname;
      
      // Block requests to private IP ranges
      if (StringPatterns.PRIVATE_IP.test(hostname)) {
        return {
          valid: false,
          message: errorMessage || 'SSRF Protection: Blocked URL to private or local network',
          details: { hostname, privateIpDetected: true },
          value: url
        };
      }
      
      // Additional SSRF checks could be added here
    }
    
    return {
      valid: true,
      details: {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        pathname: parsedUrl.pathname
      },
      value: url
    };
  } catch (error) {
    return {
      valid: false,
      message: errorMessage || (error instanceof Error ? error.message : 'Invalid URL'),
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      value: url
    };
  }
}

/**
 * Checks if a string contains only alphanumeric characters.
 * 
 * @param value - The string to check
 * @param options - Validation options
 * @returns True if the string contains only alphanumeric characters, false otherwise
 * 
 * @example
 * const isValid = isAlphanumeric('abc123');
 */
export function isAlphanumeric(value: string, options: StringValidationOptions = {}): boolean {
  return matchesPattern(value, {
    ...options,
    pattern: StringPatterns.ALPHANUMERIC,
    errorMessage: options.errorMessage || 'String must contain only alphanumeric characters'
  });
}

/**
 * Checks if a string contains only alphabetic characters.
 * 
 * @param value - The string to check
 * @param options - Validation options
 * @returns True if the string contains only alphabetic characters, false otherwise
 * 
 * @example
 * const isValid = isAlphabetic('abcDEF');
 */
export function isAlphabetic(value: string, options: StringValidationOptions = {}): boolean {
  return matchesPattern(value, {
    ...options,
    pattern: StringPatterns.ALPHABETIC,
    errorMessage: options.errorMessage || 'String must contain only alphabetic characters'
  });
}

/**
 * Checks if a string contains only numeric characters.
 * 
 * @param value - The string to check
 * @param options - Validation options
 * @returns True if the string contains only numeric characters, false otherwise
 * 
 * @example
 * const isValid = isNumeric('12345');
 */
export function isNumeric(value: string, options: StringValidationOptions = {}): boolean {
  return matchesPattern(value, {
    ...options,
    pattern: StringPatterns.NUMERIC,
    errorMessage: options.errorMessage || 'String must contain only numeric characters'
  });
}

/**
 * Checks if a string is a valid UUID v4.
 * 
 * @param value - The string to check
 * @param options - Validation options
 * @returns True if the string is a valid UUID v4, false otherwise
 * 
 * @example
 * const isValid = isUuid('123e4567-e89b-12d3-a456-426614174000');
 */
export function isUuid(value: string, options: StringValidationOptions = {}): boolean {
  return matchesPattern(value, {
    ...options,
    pattern: StringPatterns.UUID,
    errorMessage: options.errorMessage || 'String must be a valid UUID'
  });
}

/**
 * Checks if a string is a valid strong password.
 * 
 * @param value - The string to check
 * @param options - Validation options
 * @returns True if the string is a valid strong password, false otherwise
 * 
 * @example
 * const isValid = isStrongPassword('P@ssw0rd');
 */
export function isStrongPassword(value: string, options: StringValidationOptions = {}): boolean {
  return matchesPattern(value, {
    ...options,
    pattern: StringPatterns.STRONG_PASSWORD,
    errorMessage: options.errorMessage || 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
  });
}

/**
 * Checks if a string is empty (length === 0 after trimming).
 * 
 * @param value - The string to check
 * @param options - Validation options
 * @returns True if the string is empty, false otherwise
 * 
 * @example
 * const isEmpty = isEmptyString('   ');
 */
export function isEmptyString(value: string, options: StringValidationOptions = {}): boolean {
  if (value === null && options.allowNull) return true;
  if (value === undefined && options.allowUndefined) return true;
  if (value === null || value === undefined) return true;
  
  const {
    trim = true,
    throwOnError = false,
    errorMessage = 'String is empty',
  } = options;
  
  const isEmpty = trim ? value.trim().length === 0 : value.length === 0;
  
  if (isEmpty && throwOnError) {
    throw new Error(errorMessage);
  }
  
  return isEmpty;
}

/**
 * Checks if a string is not empty (length > 0 after trimming).
 * 
 * @param value - The string to check
 * @param options - Validation options
 * @returns True if the string is not empty, false otherwise
 * 
 * @example
 * const isNotEmpty = isNotEmptyString('hello');
 */
export function isNotEmptyString(value: string, options: StringValidationOptions = {}): boolean {
  return !isEmptyString(value, {
    ...options,
    errorMessage: options.errorMessage || 'String must not be empty',
  });
}

/**
 * Creates a custom string validator function.
 * 
 * @param validationFn - The validation function to use
 * @param defaultOptions - Default options for the validator
 * @returns A validator function that accepts a value and options
 * 
 * @example
 * const isValidUsername = createStringValidator(
 *   (value) => /^[a-z0-9_]{3,16}$/.test(value),
 *   { errorMessage: 'Username must be 3-16 characters and contain only lowercase letters, numbers, and underscores' }
 * );
 * 
 * const valid = isValidUsername('user_123');
 */
export function createStringValidator<T extends StringValidationOptions>(
  validationFn: (value: string, options: T) => boolean,
  defaultOptions: Partial<T> = {}
): (value: string, options?: Partial<T>) => boolean {
  return (value: string, options: Partial<T> = {}) => {
    const mergedOptions = { ...defaultOptions, ...options } as T;
    return validationFn(value, mergedOptions);
  };
}

/**
 * Creates a custom string validator function that returns detailed results.
 * 
 * @param validationFn - The validation function to use
 * @param defaultOptions - Default options for the validator
 * @returns A validator function that accepts a value and options and returns a ValidationResult
 * 
 * @example
 * const validateUsername = createDetailedStringValidator(
 *   (value, options) => ({
 *     valid: /^[a-z0-9_]{3,16}$/.test(value),
 *     message: options.errorMessage || 'Invalid username format',
 *     details: { pattern: '^[a-z0-9_]{3,16}$' },
 *     value
 *   }),
 *   { errorMessage: 'Username must be 3-16 characters and contain only lowercase letters, numbers, and underscores' }
 * );
 * 
 * const result = validateUsername('user_123');
 */
export function createDetailedStringValidator<T extends StringValidationOptions>(
  validationFn: (value: string, options: T) => ValidationResult,
  defaultOptions: Partial<T> = {}
): (value: string, options?: Partial<T>) => ValidationResult {
  return (value: string, options: Partial<T> = {}) => {
    const mergedOptions = { ...defaultOptions, ...options } as T;
    return validationFn(value, mergedOptions);
  };
}

// Export default for convenient importing
export default {
  isValidCPF,
  validateCPF,
  isValidEmail,
  validateEmail,
  isValidUrl,
  validateUrl,
  isValidLength,
  validateLength,
  matchesPattern,
  validatePattern,
  isAlphanumeric,
  isAlphabetic,
  isNumeric,
  isUuid,
  isStrongPassword,
  isEmptyString,
  isNotEmptyString,
  createStringValidator,
  createDetailedStringValidator,
  StringPatterns,
};