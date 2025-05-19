/**
 * Authentication-specific validation utilities
 * 
 * This module provides specialized validation functions for authentication-related inputs,
 * including token format validation, authorization header parsing, and OAuth state validation.
 * These pure functions centralize validation logic for authentication operations, ensuring
 * consistent verification of security-critical data.
 * 
 * @module validation.util
 * @packageDocumentation
 * @preferred
 */

/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number.
 * This function implements the standard CPF validation algorithm used in Brazil.
 * 
 * @param cpf - The CPF string to validate
 * @returns True if the CPF is valid, false otherwise
 */
export const isValidCPF = (cpf: string): boolean => {
  // Return false for empty or null inputs
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
 * Validates if a string is a properly formatted JWT token.
 * Checks for the correct structure (header.payload.signature) without verifying the signature.
 * 
 * @param token - The token string to validate
 * @returns True if the token has valid JWT format, false otherwise
 */
export const isValidTokenFormat = (token: string): boolean => {
  if (!token) {
    return false;
  }

  // JWT token should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Each part should be a valid base64url string
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return parts.every(part => base64UrlRegex.test(part));
};

/**
 * Extracts a JWT token from an Authorization header.
 * Validates the header format and extracts the Bearer token.
 * 
 * @param authHeader - The Authorization header string
 * @returns The extracted token or null if the header is invalid
 */
export const extractTokenFromHeader = (authHeader: string): string | null => {
  if (!authHeader) {
    return null;
  }

  // Check if the header starts with 'Bearer '
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  const token = parts[1];
  return isValidTokenFormat(token) ? token : null;
};

/**
 * Validates an OAuth state parameter to protect against CSRF attacks.
 * 
 * @param storedState - The state value that was originally generated and stored
 * @param receivedState - The state value received in the OAuth callback
 * @returns True if the state is valid, false otherwise
 */
export const isValidOAuthState = (storedState: string, receivedState: string): boolean => {
  if (!storedState || !receivedState) {
    return false;
  }

  // Simple string comparison to verify state hasn't been tampered with
  // This helps prevent CSRF attacks in OAuth flows
  return storedState === receivedState;
};

/**
 * Generates a secure random state parameter for OAuth flows.
 * 
 * @param length - The length of the state parameter (default: 32)
 * @returns A cryptographically secure random string
 */
export const generateOAuthState = (length: number = 32): string => {
  // In a browser environment, use Web Crypto API
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    return result;
  } 
  // In Node.js environment, use crypto module
  else if (typeof require !== 'undefined') {
    try {
      const crypto = require('crypto');
      return crypto.randomBytes(length).toString('base64url').slice(0, length);
    } catch (e) {
      throw new Error('Secure random number generation not supported');
    }
  }
  
  throw new Error('No secure random number generator available');
};

/**
 * Validates if a JWT token has expired based on its expiration claim.
 * 
 * @param token - The JWT token to check
 * @param allowedSkewSeconds - Allowed time skew in seconds to account for clock differences (default: 30)
 * @returns True if the token is still valid (not expired), false otherwise
 */
export const isTokenExpired = (token: string, allowedSkewSeconds: number = 30): boolean => {
  if (!token) {
    return true; // No token is treated as expired
  }

  try {
    // Split the token and get the payload part
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true; // Invalid token format is treated as expired
    }

    // Decode the payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // Check if the token has an expiration claim
    if (!payload.exp) {
      return false; // No expiration means token doesn't expire
    }

    // Get current time in seconds and add the allowed skew
    const currentTime = Math.floor(Date.now() / 1000) - allowedSkewSeconds;
    
    // Compare with the expiration time
    return payload.exp < currentTime;
  } catch (error) {
    // If there's any error parsing the token, treat it as expired
    return true;
  }
};

/**
 * Validates the issuer (iss) claim of a JWT token.
 * 
 * @param token - The JWT token to validate
 * @param expectedIssuer - The expected issuer value or array of allowed issuers
 * @returns True if the token's issuer matches the expected issuer, false otherwise
 */
export const isValidIssuer = (token: string, expectedIssuer: string | string[]): boolean => {
  if (!token) {
    return false;
  }

  try {
    // Split the token and get the payload part
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Decode the payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // Check if the token has an issuer claim
    if (!payload.iss) {
      return false;
    }

    // Check if the issuer matches the expected issuer
    if (Array.isArray(expectedIssuer)) {
      return expectedIssuer.includes(payload.iss);
    }
    
    return payload.iss === expectedIssuer;
  } catch (error) {
    return false;
  }
};

/**
 * Validates the audience (aud) claim of a JWT token.
 * 
 * @param token - The JWT token to validate
 * @param expectedAudience - The expected audience value or array of allowed audiences
 * @returns True if the token's audience matches the expected audience, false otherwise
 */
export const isValidAudience = (token: string, expectedAudience: string | string[]): boolean => {
  if (!token) {
    return false;
  }

  try {
    // Split the token and get the payload part
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Decode the payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // Check if the token has an audience claim
    if (!payload.aud) {
      return false;
    }

    // Handle case where token audience is an array
    if (Array.isArray(payload.aud)) {
      if (Array.isArray(expectedAudience)) {
        // Check if any of the expected audiences is in the token's audience array
        return expectedAudience.some(expected => payload.aud.includes(expected));
      }
      // Check if the single expected audience is in the token's audience array
      return payload.aud.includes(expectedAudience);
    }
    
    // Handle case where token audience is a string
    if (Array.isArray(expectedAudience)) {
      return expectedAudience.includes(payload.aud);
    }
    
    return payload.aud === expectedAudience;
  } catch (error) {
    return false;
  }
};