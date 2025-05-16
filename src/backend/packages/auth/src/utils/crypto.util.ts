/**
 * Authentication cryptographic utilities
 * 
 * This module provides cryptographic utilities for generating secure random values
 * used in authentication processes, including secure tokens, session identifiers,
 * CSRF protection tokens, and password reset keys. These pure functions provide a
 * standardized approach to generating cryptographically secure random values across
 * the auth system.
 * 
 * @module crypto.util
 * @packageDocumentation
 * @preferred
 */

/**
 * Generates cryptographically secure random bytes.
 * This is the core function used by other utility functions to generate random values.
 * 
 * @param length - The number of bytes to generate
 * @returns A Buffer containing random bytes
 * @throws Error if secure random number generation is not available
 */
export const generateRandomBytes = (length: number): Buffer => {
  // In Node.js environment, use crypto module
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      // Use Node.js crypto module
      const crypto = require('crypto');
      return crypto.randomBytes(length);
    } catch (e) {
      throw new Error('Secure random number generation not supported in this Node.js environment');
    }
  }
  // In browser environment, use Web Crypto API
  else if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    
    // Convert Uint8Array to Buffer in browser environment
    return Buffer.from(bytes);
  }
  
  throw new Error('No secure random number generator available');
};

/**
 * Generates a cryptographically secure random string with the specified encoding.
 * 
 * @param length - The length of the string to generate
 * @param encoding - The encoding to use (default: 'base64')
 * @returns A random string with the specified encoding
 */
export const generateRandomString = (
  length: number,
  encoding: 'hex' | 'base64' | 'base64url' = 'base64'
): string => {
  // Calculate the number of bytes needed based on encoding
  // base64 encodes 3 bytes into 4 characters, so we need 3/4 of the requested length
  // hex encodes 1 byte into 2 characters, so we need 1/2 of the requested length
  const bytesNeeded = encoding === 'hex' 
    ? Math.ceil(length / 2)
    : Math.ceil((length * 3) / 4);
  
  const randomBytes = generateRandomBytes(bytesNeeded);
  const result = randomBytes.toString(encoding);
  
  // Trim to the exact requested length
  return result.slice(0, length);
};

/**
 * Generates a secure token for authentication purposes.
 * 
 * @param length - The length of the token (default: 32)
 * @returns A secure random token string
 */
export const generateSecureToken = (length: number = 32): string => {
  return generateRandomString(length, 'base64');
};

/**
 * Generates a URL-safe token that can be safely used in URLs without encoding issues.
 * Uses base64url encoding which replaces '+' with '-' and '/' with '_' and removes padding.
 * 
 * @param length - The length of the token (default: 32)
 * @returns A URL-safe token string
 */
export const generateUrlSafeToken = (length: number = 32): string => {
  return generateRandomString(length, 'base64url');
};

/**
 * Generates a secure session identifier for tracking user sessions.
 * 
 * @param length - The length of the session ID (default: 64)
 * @returns A secure session identifier string
 */
export const generateSessionId = (length: number = 64): string => {
  return generateRandomString(length, 'hex');
};

/**
 * Generates a CSRF (Cross-Site Request Forgery) protection token.
 * 
 * @param length - The length of the CSRF token (default: 32)
 * @returns A secure CSRF token string
 */
export const generateCsrfToken = (length: number = 32): string => {
  return generateRandomString(length, 'hex');
};

/**
 * Generates a password reset token for secure password reset flows.
 * 
 * @param length - The length of the password reset token (default: 64)
 * @returns A secure password reset token string
 */
export const generatePasswordResetToken = (length: number = 64): string => {
  return generateUrlSafeToken(length);
};

/**
 * Generates a secret key for Time-based One-Time Password (TOTP) authentication.
 * The secret is compatible with standard TOTP authenticator apps.
 * 
 * @param length - The length of the secret in bytes (default: 20, recommended by RFC 6238)
 * @returns A base32-encoded TOTP secret
 */
export const generateTotpSecret = (length: number = 20): string => {
  const bytes = generateRandomBytes(length);
  
  // Convert to base32 encoding (used by authenticator apps)
  // This is a simplified base32 implementation
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  
  // Process 5 bits at a time (base32 uses 5 bits per character)
  let bits = 0;
  let value = 0;
  
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    
    while (bits >= 5) {
      bits -= 5;
      result += base32Chars[(value >>> bits) & 31];
    }
  }
  
  // Handle remaining bits if any
  if (bits > 0) {
    result += base32Chars[(value << (5 - bits)) & 31];
  }
  
  return result;
};

/**
 * Generates a device fingerprint for device identification and suspicious access detection.
 * 
 * @param deviceInfo - Object containing device information
 * @returns A hash representing the device fingerprint
 */
export const generateDeviceFingerprint = (deviceInfo: {
  userAgent?: string;
  platform?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  [key: string]: string | undefined;
}): string => {
  // Create a string representation of the device info
  const infoString = Object.entries(deviceInfo)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  
  // In Node.js environment
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(infoString).digest('hex');
    } catch (e) {
      // Fallback to a simple hash if crypto is not available
      return simpleHash(infoString);
    }
  }
  // In browser environment
  else if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // Note: In a real implementation, you would use the Web Crypto API
    // with crypto.subtle.digest, but that's async and would change the function signature
    // For simplicity, we're using a synchronous fallback here
    return simpleHash(infoString);
  }
  
  return simpleHash(infoString);
};

/**
 * Simple hash function for fallback when crypto is not available.
 * This is NOT cryptographically secure and should only be used as a last resort.
 * 
 * @param input - The string to hash
 * @returns A simple hash of the input string
 */
const simpleHash = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex string and ensure it's positive
  return (hash >>> 0).toString(16).padStart(8, '0');
};

/**
 * Generates a refresh token with a unique identifier.
 * 
 * @param userId - The user ID to associate with the token
 * @param expiresAt - Optional expiration timestamp
 * @returns A secure refresh token string
 */
export const generateRefreshToken = (userId: string, expiresAt?: number): string => {
  // Create a token with format: {random}-{userId}-{timestamp}
  const randomPart = generateRandomString(32, 'hex');
  const timestamp = expiresAt || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // Default 30 days
  
  // Encode the parts
  const encodedUserId = Buffer.from(userId).toString('base64url');
  
  // Combine the parts with a separator
  return `${randomPart}.${encodedUserId}.${timestamp}`;
};

/**
 * Generates a nonce for use in security headers like Content-Security-Policy.
 * 
 * @param length - The length of the nonce (default: 16)
 * @returns A secure random nonce string
 */
export const generateNonce = (length: number = 16): string => {
  return generateRandomString(length, 'base64');
};