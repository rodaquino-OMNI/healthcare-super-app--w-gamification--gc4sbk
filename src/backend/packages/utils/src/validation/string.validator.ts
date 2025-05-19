/**
 * String validation utilities for standardized validation across all backend services.
 * These validators can be used independently or integrated with validation libraries
 * like Zod and class-validator.
 */

/**
 * Error messages for string validation
 */
export const StringValidationErrors = {
  INVALID_CPF: 'Invalid CPF format or checksum',
  INVALID_EMAIL: 'Invalid email address format',
  INVALID_URL: 'Invalid URL format',
  STRING_TOO_SHORT: 'String is shorter than the minimum length',
  STRING_TOO_LONG: 'String is longer than the maximum length',
  PATTERN_MISMATCH: 'String does not match the required pattern',
  EMPTY_STRING: 'String cannot be empty',
  SSRF_PROTECTION: 'URL blocked due to SSRF protection',
};

/**
 * Common regex patterns for string validation
 */
export const StringValidationPatterns = {
  // Brazilian CPF with or without formatting
  CPF: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
  
  // International email format
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Brazilian email domains
  BRAZILIAN_EMAIL_DOMAIN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:com\.br|br|gov\.br|org\.br|edu\.br)$/,
  
  // URL pattern
  URL: /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/,
  
  // Private IP ranges for SSRF protection
  PRIVATE_IP: /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|0\.0\.0\.0|localhost)/,
  
  // Alphanumeric with spaces
  ALPHANUMERIC_WITH_SPACES: /^[a-zA-Z0-9\s]*$/,
  
  // Alphanumeric only
  ALPHANUMERIC: /^[a-zA-Z0-9]*$/,
  
  // Letters only
  LETTERS_ONLY: /^[a-zA-Z]*$/,
  
  // Numbers only
  NUMBERS_ONLY: /^[0-9]*$/,
};

/**
 * Interface for validation result with detailed error information
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Options for string length validation
 */
export interface StringLengthOptions {
  min?: number;
  max?: number;
  allowEmpty?: boolean;
}

/**
 * Options for pattern validation
 */
export interface PatternValidationOptions {
  pattern: RegExp;
  errorMessage?: string;
  allowEmpty?: boolean;
}

/**
 * Options for URL validation
 */
export interface UrlValidationOptions {
  allowPrivateIps?: boolean;
  requireHttps?: boolean;
  allowedProtocols?: string[];
}

/**
 * Options for email validation
 */
export interface EmailValidationOptions {
  allowBrazilianOnly?: boolean;
  allowInternational?: boolean;
}

/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number.
 * This function implements the standard CPF validation algorithm used in Brazil.
 * 
 * @param cpf - The CPF string to validate
 * @returns Validation result with detailed error information if invalid
 */
export function validateCPF(cpf: string): ValidationResult {
  // Handle null or undefined
  if (!cpf) {
    return {
      isValid: false,
      error: StringValidationErrors.EMPTY_STRING,
    };
  }

  // Check format first
  if (!StringValidationPatterns.CPF.test(cpf)) {
    return {
      isValid: false,
      error: StringValidationErrors.INVALID_CPF,
      details: { reason: 'format' },
    };
  }

  // Remove non-digit characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // CPF must have 11 digits
  if (cleanCPF.length !== 11) {
    return {
      isValid: false,
      error: StringValidationErrors.INVALID_CPF,
      details: { reason: 'length' },
    };
  }
  
  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1+$/.test(cleanCPF)) {
    return {
      isValid: false,
      error: StringValidationErrors.INVALID_CPF,
      details: { reason: 'repeated_digits' },
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

  if (!isValid) {
    return {
      isValid: false,
      error: StringValidationErrors.INVALID_CPF,
      details: { reason: 'checksum' },
    };
  }

  return { isValid: true };
}

/**
 * Validates an email address format.
 * Supports both international and Brazilian email formats.
 * 
 * @param email - The email string to validate
 * @param options - Options for email validation
 * @returns Validation result with detailed error information if invalid
 */
export function validateEmail(email: string, options: EmailValidationOptions = {}): ValidationResult {
  // Handle null or undefined
  if (!email) {
    return {
      isValid: false,
      error: StringValidationErrors.EMPTY_STRING,
    };
  }

  const { allowBrazilianOnly = false, allowInternational = true } = options;

  // Check if it's a Brazilian email when Brazilian-only is required
  if (allowBrazilianOnly && !allowInternational) {
    if (!StringValidationPatterns.BRAZILIAN_EMAIL_DOMAIN.test(email)) {
      return {
        isValid: false,
        error: StringValidationErrors.INVALID_EMAIL,
        details: { reason: 'not_brazilian_domain' },
      };
    }
    return { isValid: true };
  }

  // Check if it's a valid email format
  if (!StringValidationPatterns.EMAIL.test(email)) {
    return {
      isValid: false,
      error: StringValidationErrors.INVALID_EMAIL,
      details: { reason: 'format' },
    };
  }

  return { isValid: true };
}

/**
 * Validates a URL with optional SSRF protection.
 * 
 * @param url - The URL string to validate
 * @param options - Options for URL validation
 * @returns Validation result with detailed error information if invalid
 */
export function validateUrl(url: string, options: UrlValidationOptions = {}): ValidationResult {
  // Handle null or undefined
  if (!url) {
    return {
      isValid: false,
      error: StringValidationErrors.EMPTY_STRING,
    };
  }

  const { 
    allowPrivateIps = false, 
    requireHttps = false,
    allowedProtocols = ['http', 'https']
  } = options;

  // Check if it's a valid URL format
  if (!StringValidationPatterns.URL.test(url)) {
    return {
      isValid: false,
      error: StringValidationErrors.INVALID_URL,
      details: { reason: 'format' },
    };
  }

  try {
    const parsedUrl = new URL(url);
    
    // Check protocol
    const protocol = parsedUrl.protocol.replace(':', '');
    if (!allowedProtocols.includes(protocol)) {
      return {
        isValid: false,
        error: StringValidationErrors.INVALID_URL,
        details: { reason: 'protocol', protocol },
      };
    }

    // Check if HTTPS is required
    if (requireHttps && protocol !== 'https') {
      return {
        isValid: false,
        error: StringValidationErrors.INVALID_URL,
        details: { reason: 'https_required' },
      };
    }

    // Check for private IP ranges (SSRF protection)
    if (!allowPrivateIps) {
      const hostname = parsedUrl.hostname;
      
      if (
        StringValidationPatterns.PRIVATE_IP.test(hostname) ||
        hostname === '::1' ||
        hostname === 'fe80::' ||
        hostname.endsWith('.local')
      ) {
        return {
          isValid: false,
          error: StringValidationErrors.SSRF_PROTECTION,
          details: { reason: 'private_ip', hostname },
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: StringValidationErrors.INVALID_URL,
      details: { reason: 'parse_error', message: (error as Error).message },
    };
  }
}

/**
 * Validates string length based on minimum and maximum constraints.
 * 
 * @param str - The string to validate
 * @param options - Options for length validation
 * @returns Validation result with detailed error information if invalid
 */
export function validateStringLength(str: string, options: StringLengthOptions = {}): ValidationResult {
  const { min = 0, max = Infinity, allowEmpty = false } = options;

  // Handle null or undefined
  if (str === null || str === undefined) {
    return {
      isValid: false,
      error: StringValidationErrors.EMPTY_STRING,
    };
  }

  // Check for empty string
  if (str === '' && !allowEmpty) {
    return {
      isValid: false,
      error: StringValidationErrors.EMPTY_STRING,
    };
  }

  // Empty string is allowed and we're not checking min length
  if (str === '' && allowEmpty) {
    return { isValid: true };
  }

  // Check minimum length
  if (str.length < min) {
    return {
      isValid: false,
      error: StringValidationErrors.STRING_TOO_SHORT,
      details: { min, actual: str.length },
    };
  }

  // Check maximum length
  if (str.length > max) {
    return {
      isValid: false,
      error: StringValidationErrors.STRING_TOO_LONG,
      details: { max, actual: str.length },
    };
  }

  return { isValid: true };
}

/**
 * Validates a string against a regular expression pattern.
 * 
 * @param str - The string to validate
 * @param options - Options for pattern validation
 * @returns Validation result with detailed error information if invalid
 */
export function validatePattern(str: string, options: PatternValidationOptions): ValidationResult {
  const { pattern, errorMessage = StringValidationErrors.PATTERN_MISMATCH, allowEmpty = false } = options;

  // Handle null or undefined
  if (str === null || str === undefined) {
    return {
      isValid: false,
      error: StringValidationErrors.EMPTY_STRING,
    };
  }

  // Check for empty string
  if (str === '' && !allowEmpty) {
    return {
      isValid: false,
      error: StringValidationErrors.EMPTY_STRING,
    };
  }

  // Empty string is allowed
  if (str === '' && allowEmpty) {
    return { isValid: true };
  }

  // Test against pattern
  if (!pattern.test(str)) {
    return {
      isValid: false,
      error: errorMessage,
      details: { pattern: pattern.toString() },
    };
  }

  return { isValid: true };
}

/**
 * Convenience function that returns a boolean result for CPF validation.
 * Maintains backward compatibility with the original isValidCPF function.
 * 
 * @param cpf - The CPF string to validate
 * @returns True if the CPF is valid, false otherwise
 */
export function isValidCPF(cpf: string): boolean {
  return validateCPF(cpf).isValid;
}

/**
 * Convenience function that returns a boolean result for email validation.
 * 
 * @param email - The email string to validate
 * @param options - Options for email validation
 * @returns True if the email is valid, false otherwise
 */
export function isValidEmail(email: string, options?: EmailValidationOptions): boolean {
  return validateEmail(email, options).isValid;
}

/**
 * Convenience function that returns a boolean result for URL validation.
 * 
 * @param url - The URL string to validate
 * @param options - Options for URL validation
 * @returns True if the URL is valid, false otherwise
 */
export function isValidUrl(url: string, options?: UrlValidationOptions): boolean {
  return validateUrl(url, options).isValid;
}

/**
 * Convenience function that returns a boolean result for string length validation.
 * 
 * @param str - The string to validate
 * @param options - Options for length validation
 * @returns True if the string length is valid, false otherwise
 */
export function isValidStringLength(str: string, options?: StringLengthOptions): boolean {
  return validateStringLength(str, options).isValid;
}

/**
 * Convenience function that returns a boolean result for pattern validation.
 * 
 * @param str - The string to validate
 * @param options - Options for pattern validation
 * @returns True if the string matches the pattern, false otherwise
 */
export function isValidPattern(str: string, options: PatternValidationOptions): boolean {
  return validatePattern(str, options).isValid;
}