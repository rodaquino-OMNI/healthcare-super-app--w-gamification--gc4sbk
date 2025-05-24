/**
 * Cryptographic utilities for generating secure random values used in authentication processes.
 * 
 * This module provides a standardized approach to generating cryptographically secure random values
 * across the auth system, including secure tokens, session identifiers, CSRF protection tokens,
 * and password reset keys.
 * 
 * @module crypto.util
 */

import * as crypto from 'crypto';

/**
 * Options for generating random strings
 */
export interface RandomStringOptions {
  /** Length of the random string to generate */
  length: number;
  /** Character encoding to use (hex, base64, base64url) */
  encoding?: 'hex' | 'base64' | 'base64url';
  /** Whether to remove non-alphanumeric characters */
  alphanumericOnly?: boolean;
}

/**
 * Options for generating TOTP secrets
 */
export interface TOTPSecretOptions {
  /** Length of the secret in bytes (before encoding) */
  length?: number;
  /** Whether to include a checksum */
  checksum?: boolean;
  /** Whether to include padding characters */
  padding?: boolean;
}

/**
 * Generates cryptographically secure random bytes.
 * 
 * @param size - Number of bytes to generate
 * @returns Buffer containing random bytes
 * @throws Error if there is not enough entropy available
 */
export function generateRandomBytes(size: number): Buffer {
  try {
    return crypto.randomBytes(size);
  } catch (error) {
    throw new Error(`Failed to generate secure random bytes: ${error.message}`);
  }
}

/**
 * Generates a cryptographically secure random string with the specified options.
 * 
 * @param options - Options for generating the random string
 * @returns Random string with the specified encoding
 */
export function generateRandomString(options: RandomStringOptions): string {
  const { length, encoding = 'hex', alphanumericOnly = false } = options;
  
  // Calculate the number of bytes needed based on the encoding
  // hex encoding: each byte becomes 2 characters
  // base64 encoding: every 3 bytes become 4 characters
  const bytesNeeded = encoding === 'hex' 
    ? Math.ceil(length / 2)
    : Math.ceil(length * 0.75); // For base64 and base64url
  
  const randomBytes = generateRandomBytes(bytesNeeded);
  
  let result: string;
  switch (encoding) {
    case 'base64':
      result = randomBytes.toString('base64');
      break;
    case 'base64url':
      // Convert to base64 then make URL-safe
      result = randomBytes.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      break;
    case 'hex':
    default:
      result = randomBytes.toString('hex');
      break;
  }
  
  // Trim to the requested length
  result = result.slice(0, length);
  
  // Remove non-alphanumeric characters if requested
  if (alphanumericOnly) {
    result = result.replace(/[^a-zA-Z0-9]/g, '');
    
    // If we removed characters, we might need to generate more to reach the desired length
    if (result.length < length) {
      const additionalOptions = { ...options, length: length - result.length };
      result += generateRandomString(additionalOptions);
    }
  }
  
  return result;
}

/**
 * Generates a URL-safe token suitable for use in URLs or headers.
 * 
 * @param length - Length of the token to generate
 * @returns URL-safe token string
 */
export function generateUrlSafeToken(length: number = 32): string {
  return generateRandomString({
    length,
    encoding: 'base64url'
  });
}

/**
 * Generates a secure session identifier for authentication sessions.
 * 
 * @param length - Length of the session ID to generate
 * @returns Secure session identifier string
 */
export function generateSessionId(length: number = 64): string {
  return generateRandomString({
    length,
    encoding: 'base64url'
  });
}

/**
 * Generates a CSRF (Cross-Site Request Forgery) token for form protection.
 * 
 * @param length - Length of the CSRF token to generate
 * @returns CSRF token string
 */
export function generateCsrfToken(length: number = 32): string {
  return generateRandomString({
    length,
    encoding: 'hex'
  });
}

/**
 * Generates a password reset token for secure password reset flows.
 * 
 * @param length - Length of the password reset token to generate
 * @returns Password reset token string
 */
export function generatePasswordResetToken(length: number = 64): string {
  return generateRandomString({
    length,
    encoding: 'base64url'
  });
}

/**
 * Generates a device fingerprint token for device tracking and suspicious access detection.
 * 
 * @param length - Length of the device fingerprint token to generate
 * @returns Device fingerprint token string
 */
export function generateDeviceFingerprint(length: number = 32): string {
  return generateRandomString({
    length,
    encoding: 'hex'
  });
}

/**
 * Generates a refresh token for token rotation in authentication flows.
 * 
 * @param length - Length of the refresh token to generate
 * @returns Refresh token string
 */
export function generateRefreshToken(length: number = 64): string {
  return generateRandomString({
    length,
    encoding: 'base64url'
  });
}

/**
 * Generates a base32-encoded secret key suitable for TOTP (Time-based One-Time Password) applications.
 * 
 * This function creates a secret that can be used with Google Authenticator, Authy, and other
 * TOTP-compatible applications for multi-factor authentication.
 * 
 * @param options - Options for generating the TOTP secret
 * @returns Base32-encoded TOTP secret
 */
export function generateTOTPSecret(options: TOTPSecretOptions = {}): string {
  const { length = 20, padding = true } = options;
  
  // Generate random bytes for the secret
  const secretBytes = generateRandomBytes(length);
  
  // Convert to base32 encoding (RFC 4648)
  // Base32 alphabet: ABCDEFGHIJKLMNOPQRSTUVWXYZ234567
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let base32Secret = '';
  
  // Process 5 bits at a time (since base32 uses 5 bits per character)
  for (let i = 0; i < secretBytes.length; i += 5) {
    const chunk = secretBytes.slice(i, i + 5);
    let buffer = 0;
    let bitsLeft = 0;
    
    for (let j = 0; j < chunk.length; j++) {
      buffer = (buffer << 8) | chunk[j];
      bitsLeft += 8;
      
      while (bitsLeft >= 5) {
        bitsLeft -= 5;
        base32Secret += base32Chars[(buffer >> bitsLeft) & 0x1f];
      }
    }
    
    // Handle remaining bits if any
    if (bitsLeft > 0 && padding) {
      base32Secret += base32Chars[(buffer << (5 - bitsLeft)) & 0x1f];
    }
  }
  
  // Add padding if needed and requested
  if (padding) {
    while (base32Secret.length % 8 !== 0) {
      base32Secret += '=';
    }
  }
  
  return base32Secret;
}

/**
 * Generates a verification code for email or phone verification.
 * 
 * @param length - Length of the verification code to generate
 * @param numericOnly - Whether to generate a numeric-only code
 * @returns Verification code string
 */
export function generateVerificationCode(length: number = 6, numericOnly: boolean = true): string {
  if (numericOnly) {
    // Generate a numeric code by using random bytes and modulo 10
    const bytes = generateRandomBytes(length);
    let code = '';
    
    for (let i = 0; i < length; i++) {
      // Use modulo 10 to get a digit (0-9)
      code += bytes[i] % 10;
    }
    
    return code;
  } else {
    // Generate an alphanumeric code
    return generateRandomString({
      length,
      encoding: 'hex',
      alphanumericOnly: true
    });
  }
}

/**
 * Generates a nonce for use in security headers or cryptographic operations.
 * 
 * @param length - Length of the nonce to generate
 * @returns Nonce string
 */
export function generateNonce(length: number = 16): string {
  return generateRandomString({
    length,
    encoding: 'base64url'
  });
}

/**
 * Generates a secure API key for external API access.
 * 
 * @param length - Length of the API key to generate
 * @param prefix - Optional prefix to add to the API key
 * @returns API key string
 */
export function generateApiKey(length: number = 32, prefix?: string): string {
  const key = generateRandomString({
    length,
    encoding: 'base64url'
  });
  
  return prefix ? `${prefix}_${key}` : key;
}