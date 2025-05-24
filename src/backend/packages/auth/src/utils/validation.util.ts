/**
 * Authentication Validation Utilities
 * 
 * This file provides specialized validation utilities for authentication-related inputs,
 * including token format validation, authorization header parsing, and OAuth state validation.
 * These pure functions centralize validation logic for authentication operations, ensuring
 * consistent verification of security-critical data.
 */

import { ERROR_CODES } from '../constants';

/**
 * Validation error interface for standardized error reporting
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

/**
 * Creates a standardized validation error object
 * 
 * @param code - Error code from ERROR_CODES
 * @param message - Human-readable error message
 * @param field - Optional field name that failed validation
 * @returns Validation error object
 */
export const createValidationError = (
  code: string,
  message: string,
  field?: string
): ValidationError => ({
  code,
  message,
  field,
});

/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number.
 * This function implements the standard CPF validation algorithm used in Brazil.
 * 
 * @param cpf - The CPF string to validate
 * @returns True if the CPF is valid, false otherwise
 */
export const isValidCPF = (cpf: string): boolean => {
  // Return false for null, undefined or empty strings
  if (!cpf) {
    return false;
  }
  
  // Remove non-digit characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
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
};

/**
 * Validates a Brazilian CPF and returns a validation error if invalid
 * 
 * @param cpf - The CPF string to validate
 * @returns ValidationError if invalid, null if valid
 */
export const validateCPF = (cpf: string): ValidationError | null => {
  if (!cpf) {
    return createValidationError(
      ERROR_CODES.INVALID_CREDENTIALS,
      'CPF is required',
      'cpf'
    );
  }
  
  // Remove non-digit characters for display in error message
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) {
    return createValidationError(
      ERROR_CODES.INVALID_CREDENTIALS,
      'CPF must have 11 digits',
      'cpf'
    );
  }
  
  if (!isValidCPF(cpf)) {
    return createValidationError(
      ERROR_CODES.INVALID_CREDENTIALS,
      'Invalid CPF',
      'cpf'
    );
  }
  
  return null;
};

/**
 * Validates if a string has the format of a JWT token.
 * This performs a basic structural validation without verifying the signature.
 * 
 * @param token - The string to validate as a JWT token
 * @returns True if the string has a valid JWT format, false otherwise
 */
export const isValidTokenFormat = (token: string): boolean => {
  if (!token) {
    return false;
  }
  
  // JWT tokens consist of three parts separated by dots: header.payload.signature
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Each part should be a non-empty base64url encoded string
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return parts.every(part => part.length > 0 && base64UrlRegex.test(part));
};

/**
 * Validates a token format and returns a validation error if invalid
 * 
 * @param token - The token to validate
 * @param tokenType - Type of token being validated (for error message)
 * @returns ValidationError if invalid, null if valid
 */
export const validateTokenFormat = (
  token: string,
  tokenType = 'token'
): ValidationError | null => {
  if (!token) {
    return createValidationError(
      ERROR_CODES.INVALID_TOKEN,
      `${tokenType.charAt(0).toUpperCase() + tokenType.slice(1)} is required`,
      tokenType
    );
  }
  
  if (!isValidTokenFormat(token)) {
    return createValidationError(
      ERROR_CODES.INVALID_TOKEN,
      `Invalid ${tokenType} format`,
      tokenType
    );
  }
  
  return null;
};

/**
 * Extracts a Bearer token from an Authorization header.
 * 
 * @param authorizationHeader - The Authorization header value
 * @returns The extracted token or null if no valid Bearer token is found
 */
export const extractBearerToken = (authorizationHeader: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }
  
  // Check if it's a Bearer token
  const parts = authorizationHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  
  const token = parts[1].trim();
  return token.length > 0 ? token : null;
};

/**
 * Validates an Authorization header and extracts the Bearer token
 * 
 * @param authorizationHeader - The Authorization header to validate
 * @returns Object containing the extracted token or validation error
 */
export const validateAuthorizationHeader = (
  authorizationHeader: string
): { token: string; error: null } | { token: null; error: ValidationError } => {
  if (!authorizationHeader) {
    return {
      token: null,
      error: createValidationError(
        ERROR_CODES.INVALID_TOKEN,
        'Authorization header is required',
        'authorization'
      )
    };
  }
  
  const token = extractBearerToken(authorizationHeader);
  if (!token) {
    return {
      token: null,
      error: createValidationError(
        ERROR_CODES.INVALID_TOKEN,
        'Invalid Authorization header format. Expected: Bearer <token>',
        'authorization'
      )
    };
  }
  
  if (!isValidTokenFormat(token)) {
    return {
      token: null,
      error: createValidationError(
        ERROR_CODES.INVALID_TOKEN,
        'Invalid token format in Authorization header',
        'authorization'
      )
    };
  }
  
  return { token, error: null };
};

/**
 * Validates an OAuth state parameter to prevent CSRF attacks.
 * The state parameter should be a non-empty string with sufficient entropy.
 * 
 * @param state - The OAuth state parameter to validate
 * @param minLength - Minimum required length (default: 32)
 * @returns True if the state parameter is valid, false otherwise
 */
export const isValidOAuthState = (state: string, minLength = 32): boolean => {
  if (!state || typeof state !== 'string') {
    return false;
  }
  
  // Check minimum length for sufficient entropy
  if (state.length < minLength) {
    return false;
  }
  
  // State should only contain URL-safe characters
  const urlSafeRegex = /^[A-Za-z0-9_-]+$/;
  return urlSafeRegex.test(state);
};

/**
 * Validates an OAuth state parameter and returns a validation error if invalid
 * 
 * @param state - The OAuth state parameter to validate
 * @param minLength - Minimum required length (default: 32)
 * @returns ValidationError if invalid, null if valid
 */
export const validateOAuthState = (
  state: string,
  minLength = 32
): ValidationError | null => {
  if (!state || typeof state !== 'string') {
    return createValidationError(
      ERROR_CODES.OAUTH_PROVIDER_ERROR,
      'OAuth state parameter is required',
      'state'
    );
  }
  
  if (state.length < minLength) {
    return createValidationError(
      ERROR_CODES.OAUTH_PROVIDER_ERROR,
      `OAuth state parameter must be at least ${minLength} characters long`,
      'state'
    );
  }
  
  const urlSafeRegex = /^[A-Za-z0-9_-]+$/;
  if (!urlSafeRegex.test(state)) {
    return createValidationError(
      ERROR_CODES.OAUTH_PROVIDER_ERROR,
      'OAuth state parameter contains invalid characters',
      'state'
    );
  }
  
  return null;
};

/**
 * Validates if a string is a valid JWT access token.
 * This combines format validation with additional checks specific to access tokens.
 * 
 * @param token - The token to validate
 * @returns True if the token is a valid access token format, false otherwise
 */
export const isValidAccessToken = (token: string): boolean => {
  // First check the basic JWT format
  if (!isValidTokenFormat(token)) {
    return false;
  }
  
  // Additional checks could be added here if needed
  // For example, checking token length or other characteristics
  // specific to access tokens in your system
  
  return true;
};

/**
 * Validates if a string is a valid JWT refresh token.
 * This combines format validation with additional checks specific to refresh tokens.
 * 
 * @param token - The token to validate
 * @returns True if the token is a valid refresh token format, false otherwise
 */
export const isValidRefreshToken = (token: string): boolean => {
  // First check the basic JWT format
  if (!isValidTokenFormat(token)) {
    return false;
  }
  
  // Additional checks could be added here if needed
  // For example, checking token length or other characteristics
  // specific to refresh tokens in your system
  
  return true;
};

/**
 * Validates an email address format.
 * 
 * @param email - The email address to validate
 * @returns True if the email format is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) {
    return false;
  }
  
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * Validates a password against basic security requirements.
 * 
 * @param password - The password to validate
 * @param minLength - Minimum required length (default: 8)
 * @param requireUppercase - Whether to require at least one uppercase letter (default: true)
 * @param requireLowercase - Whether to require at least one lowercase letter (default: true)
 * @param requireNumbers - Whether to require at least one number (default: true)
 * @param requireSpecialChars - Whether to require at least one special character (default: true)
 * @returns True if the password meets all requirements, false otherwise
 */
export const isValidPassword = (
  password: string,
  minLength = 8,
  requireUppercase = true,
  requireLowercase = true,
  requireNumbers = true,
  requireSpecialChars = true
): boolean => {
  if (!password || password.length < minLength) {
    return false;
  }
  
  // Check for required character types
  if (requireUppercase && !/[A-Z]/.test(password)) {
    return false;
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    return false;
  }
  
  if (requireNumbers && !/[0-9]/.test(password)) {
    return false;
  }
  
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return false;
  }
  
  return true;
};

/**
 * Validates a phone number format.
 * This is a basic validation that can be adjusted based on specific country requirements.
 * 
 * @param phoneNumber - The phone number to validate
 * @param allowInternational - Whether to allow international format (default: true)
 * @returns True if the phone number format is valid, false otherwise
 */
export const isValidPhoneNumber = (phoneNumber: string, allowInternational = true): boolean => {
  if (!phoneNumber) {
    return false;
  }
  
  // Remove common formatting characters
  const cleanPhone = phoneNumber.replace(/[\s()-]/g, '');
  
  // Basic validation for numeric content with optional + prefix
  if (allowInternational) {
    return /^\+?[0-9]{8,15}$/.test(cleanPhone);
  } else {
    return /^[0-9]{8,15}$/.test(cleanPhone);
  }
};

/**
 * Validates a Multi-Factor Authentication (MFA) code.
 * 
 * @param code - The MFA code to validate
 * @param length - Expected length of the code (default: 6)
 * @returns True if the MFA code format is valid, false otherwise
 */
export const isValidMfaCode = (code: string, length = 6): boolean => {
  if (!code) {
    return false;
  }
  
  // MFA codes are typically numeric and of fixed length
  return new RegExp(`^[0-9]{${length}}$`).test(code);
};