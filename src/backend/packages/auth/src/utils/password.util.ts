/**
 * Authentication password utilities
 * 
 * This module provides secure password management utilities for authentication operations,
 * including password hashing with bcrypt, password verification, strength validation, and
 * salt generation. These pure utility functions standardize password security across the
 * auth service, ensuring consistent hashing algorithms and security levels throughout the
 * application.
 * 
 * @module password.util
 * @packageDocumentation
 * @preferred
 */

import * as bcrypt from 'bcrypt';
import { AUTH_ERROR_CODES, CONFIG_KEYS } from '../constants';
import { PasswordPolicyConfig } from '../types';

/**
 * Default configuration for password policy
 */
const DEFAULT_PASSWORD_POLICY: PasswordPolicyConfig = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAgeDays: 90,
  preventReuse: 3
};

/**
 * Default number of salt rounds for bcrypt
 * Higher values increase security but also increase hashing time
 * 12 is a good balance between security and performance
 */
const DEFAULT_SALT_ROUNDS = 12;

/**
 * Generates a salt for password hashing
 * 
 * @param rounds - Number of rounds to use for salt generation (default: 12)
 * @returns Promise resolving to the generated salt
 */
export const generateSalt = async (rounds: number = DEFAULT_SALT_ROUNDS): Promise<string> => {
  try {
    return await bcrypt.genSalt(rounds);
  } catch (error) {
    throw new Error(`Failed to generate salt: ${error.message}`);
  }
};

/**
 * Hashes a password using bcrypt with the specified salt rounds
 * 
 * @param password - The plain text password to hash
 * @param saltRounds - Number of rounds to use for salt generation (default: 12)
 * @returns Promise resolving to the hashed password
 * @throws Error if password hashing fails
 */
export const hashPassword = async (password: string, saltRounds: number = DEFAULT_SALT_ROUNDS): Promise<string> => {
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

/**
 * Verifies a password against a hash using a constant-time comparison
 * to prevent timing attacks
 * 
 * @param plainPassword - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise resolving to true if the password matches, false otherwise
 * @throws Error if password verification fails
 */
export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new Error(`Password verification failed: ${error.message}`);
  }
};

/**
 * Interface for password validation result
 */
export interface PasswordValidationResult {
  /** Whether the password is valid according to the policy */
  isValid: boolean;
  /** List of validation errors if the password is invalid */
  errors: string[];
  /** The error code if validation fails */
  errorCode?: string;
}

/**
 * Validates a password against the specified password policy
 * 
 * @param password - The password to validate
 * @param policy - The password policy to validate against (optional, uses default if not provided)
 * @returns Validation result with isValid flag and any validation errors
 */
export const validatePasswordStrength = (
  password: string,
  policy: Partial<PasswordPolicyConfig> = {}
): PasswordValidationResult => {
  // Merge provided policy with defaults
  const effectivePolicy: PasswordPolicyConfig = {
    ...DEFAULT_PASSWORD_POLICY,
    ...policy
  };
  
  const errors: string[] = [];
  
  // Check minimum length
  if (password.length < effectivePolicy.minLength) {
    errors.push(`Password must be at least ${effectivePolicy.minLength} characters long`);
  }
  
  // Check for uppercase letters if required
  if (effectivePolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for lowercase letters if required
  if (effectivePolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for numbers if required
  if (effectivePolicy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special characters if required
  if (effectivePolicy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    errorCode: errors.length > 0 ? AUTH_ERROR_CODES.PASSWORD_POLICY_VIOLATION : undefined
  };
};

/**
 * Loads password policy configuration from environment variables
 * 
 * @returns Password policy configuration based on environment variables
 */
export const loadPasswordPolicyFromEnv = (): PasswordPolicyConfig => {
  return {
    minLength: parseInt(process.env[CONFIG_KEYS.PASSWORD_MIN_LENGTH] || '8', 10),
    requireUppercase: process.env[CONFIG_KEYS.PASSWORD_REQUIRE_UPPERCASE] !== 'false',
    requireLowercase: process.env[CONFIG_KEYS.PASSWORD_REQUIRE_LOWERCASE] !== 'false',
    requireNumbers: process.env[CONFIG_KEYS.PASSWORD_REQUIRE_NUMBER] !== 'false',
    requireSpecialChars: process.env[CONFIG_KEYS.PASSWORD_REQUIRE_SPECIAL] !== 'false',
    maxAgeDays: parseInt(process.env[CONFIG_KEYS.PASSWORD_MAX_AGE] || '90', 10),
    preventReuse: parseInt(process.env[CONFIG_KEYS.PASSWORD_HISTORY] || '3', 10)
  };
};

/**
 * Checks if a password needs to be rehashed based on the current security settings
 * This is useful when security requirements change and existing passwords need to be upgraded
 * 
 * @param hashedPassword - The existing hashed password
 * @param saltRounds - The current required number of salt rounds
 * @returns True if the password should be rehashed, false otherwise
 */
export const passwordNeedsRehash = async (hashedPassword: string, saltRounds: number = DEFAULT_SALT_ROUNDS): Promise<boolean> => {
  try {
    // Extract the number of rounds from the hash
    const hashInfo = bcrypt.getRounds(hashedPassword);
    
    // If the current hash uses fewer rounds than required, it needs rehashing
    return hashInfo < saltRounds;
  } catch (error) {
    // If we can't determine the rounds, assume it needs rehashing for safety
    return true;
  }
};

/**
 * Generates a secure random password that meets the specified policy requirements
 * Useful for generating temporary passwords or initial credentials
 * 
 * @param length - The length of the password to generate (default: 12)
 * @param policy - The password policy to follow (optional, uses default if not provided)
 * @returns A randomly generated password that meets the policy requirements
 */
export const generateSecurePassword = (
  length: number = 12,
  policy: Partial<PasswordPolicyConfig> = {}
): string => {
  // Merge provided policy with defaults
  const effectivePolicy: PasswordPolicyConfig = {
    ...DEFAULT_PASSWORD_POLICY,
    ...policy,
    minLength: Math.max(length, DEFAULT_PASSWORD_POLICY.minLength)
  };
  
  // Character sets for different requirements
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{};\':"|,./<>?';
  
  // Build the character set based on policy requirements
  let chars = '';
  if (effectivePolicy.requireUppercase) chars += uppercaseChars;
  if (effectivePolicy.requireLowercase) chars += lowercaseChars;
  if (effectivePolicy.requireNumbers) chars += numberChars;
  if (effectivePolicy.requireSpecialChars) chars += specialChars;
  
  // If no requirements are enabled, use a default set
  if (chars.length === 0) {
    chars = lowercaseChars + numberChars;
  }
  
  // Generate a random password
  let password = '';
  const randomValues = new Uint8Array(length);
  
  // Use crypto.getRandomValues in browser or crypto.randomBytes in Node.js
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(randomValues);
  } else if (typeof require !== 'undefined') {
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(length);
    randomValues.set(new Uint8Array(randomBytes));
  } else {
    throw new Error('No secure random number generator available');
  }
  
  // Convert random bytes to characters from our set
  for (let i = 0; i < length; i++) {
    password += chars.charAt(randomValues[i] % chars.length);
  }
  
  // Ensure the password meets all requirements
  let attempts = 0;
  const maxAttempts = 10;
  let validationResult = validatePasswordStrength(password, effectivePolicy);
  
  while (!validationResult.isValid && attempts < maxAttempts) {
    // Regenerate the password
    password = '';
    
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(randomValues);
    } else if (typeof require !== 'undefined') {
      const crypto = require('crypto');
      const randomBytes = crypto.randomBytes(length);
      randomValues.set(new Uint8Array(randomBytes));
    }
    
    for (let i = 0; i < length; i++) {
      password += chars.charAt(randomValues[i] % chars.length);
    }
    
    validationResult = validatePasswordStrength(password, effectivePolicy);
    attempts++;
  }
  
  // If we couldn't generate a valid password after multiple attempts,
  // ensure it meets the requirements by adding specific characters
  if (!validationResult.isValid) {
    let modifiedPassword = password;
    
    // Ensure we have at least one character from each required set
    if (effectivePolicy.requireUppercase && !/[A-Z]/.test(modifiedPassword)) {
      modifiedPassword = uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length)) + 
        modifiedPassword.substring(1);
    }
    
    if (effectivePolicy.requireLowercase && !/[a-z]/.test(modifiedPassword)) {
      modifiedPassword = modifiedPassword.substring(0, 1) + 
        lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length)) + 
        modifiedPassword.substring(2);
    }
    
    if (effectivePolicy.requireNumbers && !/[0-9]/.test(modifiedPassword)) {
      modifiedPassword = modifiedPassword.substring(0, 2) + 
        numberChars.charAt(Math.floor(Math.random() * numberChars.length)) + 
        modifiedPassword.substring(3);
    }
    
    if (effectivePolicy.requireSpecialChars && 
        !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(modifiedPassword)) {
      modifiedPassword = modifiedPassword.substring(0, 3) + 
        specialChars.charAt(Math.floor(Math.random() * specialChars.length)) + 
        modifiedPassword.substring(4);
    }
    
    password = modifiedPassword;
  }
  
  return password;
};

/**
 * Checks if a password has been previously used by comparing against a list of previous hashes
 * 
 * @param plainPassword - The plain text password to check
 * @param previousPasswordHashes - Array of previously used password hashes
 * @returns Promise resolving to true if the password has been used before, false otherwise
 */
export const isPasswordPreviouslyUsed = async (
  plainPassword: string,
  previousPasswordHashes: string[]
): Promise<boolean> => {
  // If there are no previous passwords, the password hasn't been used before
  if (!previousPasswordHashes || previousPasswordHashes.length === 0) {
    return false;
  }
  
  // Check each previous password hash
  for (const hash of previousPasswordHashes) {
    try {
      const matches = await verifyPassword(plainPassword, hash);
      if (matches) {
        return true; // Password has been used before
      }
    } catch (error) {
      // If verification fails for a specific hash, continue checking others
      continue;
    }
  }
  
  return false; // Password hasn't been used before
};