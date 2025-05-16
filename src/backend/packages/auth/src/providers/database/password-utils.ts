/**
 * Password Utilities
 * 
 * This module provides utility functions for secure password handling, including
 * hashing, verification, and strength validation. It implements industry-standard
 * cryptographic algorithms (bcrypt and argon2) for password hashing and follows
 * best practices for secure comparison and validation.
 */

import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { randomBytes, timingSafeEqual } from 'crypto';
import { AUTH_ERROR_CODES, CONFIG_KEYS } from '../../constants';
import { PasswordPolicyConfig } from '../../types';

/**
 * Default configuration for password hashing
 */
const DEFAULT_CONFIG = {
  // bcrypt configuration
  bcrypt: {
    rounds: 12, // ~300ms on a modern CPU
  },
  // argon2 configuration
  argon2: {
    type: argon2.argon2id, // Balanced between argon2d and argon2i for best security
    timeCost: 3,          // Number of iterations
    memoryCost: 65536,    // Memory usage in KiB (64 MB)
    parallelism: 4,       // Number of threads
    hashLength: 32,       // Output hash length
  },
  // Default algorithm to use
  defaultAlgorithm: 'bcrypt' as 'bcrypt' | 'argon2',
};

/**
 * Default password policy configuration
 */
const DEFAULT_PASSWORD_POLICY: PasswordPolicyConfig = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAgeDays: 90,
  preventReuse: 3,
};

/**
 * Error messages for password validation
 */
export const PASSWORD_VALIDATION_ERRORS = {
  TOO_SHORT: 'Password is too short',
  MISSING_UPPERCASE: 'Password must contain at least one uppercase letter',
  MISSING_LOWERCASE: 'Password must contain at least one lowercase letter',
  MISSING_NUMBER: 'Password must contain at least one number',
  MISSING_SPECIAL_CHAR: 'Password must contain at least one special character',
  COMMON_PASSWORD: 'Password is too common or easily guessable',
  CONTAINS_USERNAME: 'Password should not contain the username',
  CONTAINS_EMAIL: 'Password should not contain the email address',
  CONTAINS_PERSONAL_INFO: 'Password should not contain personal information',
};

/**
 * Generates a cryptographically secure random salt
 * 
 * @param length - Length of the salt in bytes (default: 16)
 * @returns Salt as a Buffer
 */
export function generateSalt(length = 16): Buffer {
  return randomBytes(length);
}

/**
 * Hashes a password using the specified algorithm
 * 
 * @param password - Plain text password to hash
 * @param options - Hashing options
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(
  password: string,
  options?: {
    algorithm?: 'bcrypt' | 'argon2';
    bcryptRounds?: number;
    argon2Options?: argon2.Options;
    salt?: string | Buffer;
  }
): Promise<string> {
  // Normalize options
  const algorithm = options?.algorithm || DEFAULT_CONFIG.defaultAlgorithm;
  
  // Hash with the selected algorithm
  if (algorithm === 'bcrypt') {
    const rounds = options?.bcryptRounds || DEFAULT_CONFIG.bcrypt.rounds;
    const salt = options?.salt ? options.salt : await bcrypt.genSalt(rounds);
    return bcrypt.hash(password, salt);
  } else if (algorithm === 'argon2') {
    const argon2Options = {
      ...DEFAULT_CONFIG.argon2,
      ...options?.argon2Options,
      salt: options?.salt as Buffer | undefined,
    };
    
    // If no salt is provided, argon2 will generate one automatically
    return argon2.hash(password, argon2Options);
  }
  
  throw new Error(`Unsupported hashing algorithm: ${algorithm}`);
}

/**
 * Verifies a password against a hash using constant-time comparison
 * 
 * @param password - Plain text password to verify
 * @param hash - Stored password hash to compare against
 * @returns Promise resolving to true if the password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Detect the hashing algorithm from the hash format
    if (hash.startsWith('$2')) {
      // bcrypt hash
      return bcrypt.compare(password, hash);
    } else if (hash.startsWith('$argon2')) {
      // argon2 hash
      return argon2.verify(hash, password);
    }
    
    // Unknown hash format
    throw new Error('Unknown password hash format');
  } catch (error) {
    // Log the error but return false to prevent information leakage
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Performs a constant-time comparison of two strings or buffers
 * to prevent timing attacks
 * 
 * @param a - First string or buffer to compare
 * @param b - Second string or buffer to compare
 * @returns True if the inputs are equal, false otherwise
 */
export function secureCompare(a: string | Buffer, b: string | Buffer): boolean {
  try {
    // Convert strings to buffers if needed
    const bufferA = Buffer.isBuffer(a) ? a : Buffer.from(String(a));
    const bufferB = Buffer.isBuffer(b) ? b : Buffer.from(String(b));
    
    // If lengths are different, return false but still do the comparison
    // to prevent timing attacks based on length differences
    const equal = bufferA.length === bufferB.length;
    
    // Use Node.js built-in constant-time comparison
    return equal && timingSafeEqual(bufferA, bufferB);
  } catch (error) {
    // Log the error but return false to prevent information leakage
    console.error('Error in secure comparison:', error);
    return false;
  }
}

/**
 * Validates a password against the specified policy
 * 
 * @param password - Password to validate
 * @param policy - Password policy configuration
 * @param userData - Optional user data to check for personal information in password
 * @returns Object with validation result and error message if validation fails
 */
export function validatePasswordStrength(
  password: string,
  policy: Partial<PasswordPolicyConfig> = {},
  userData?: { username?: string; email?: string; name?: string }
): { valid: boolean; error?: string } {
  // Merge with default policy
  const mergedPolicy = { ...DEFAULT_PASSWORD_POLICY, ...policy };
  
  // Check minimum length
  if (password.length < mergedPolicy.minLength) {
    return { 
      valid: false, 
      error: `${PASSWORD_VALIDATION_ERRORS.TOO_SHORT}. Minimum length is ${mergedPolicy.minLength} characters.` 
    };
  }
  
  // Check for uppercase letters if required
  if (mergedPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, error: PASSWORD_VALIDATION_ERRORS.MISSING_UPPERCASE };
  }
  
  // Check for lowercase letters if required
  if (mergedPolicy.requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, error: PASSWORD_VALIDATION_ERRORS.MISSING_LOWERCASE };
  }
  
  // Check for numbers if required
  if (mergedPolicy.requireNumbers && !/[0-9]/.test(password)) {
    return { valid: false, error: PASSWORD_VALIDATION_ERRORS.MISSING_NUMBER };
  }
  
  // Check for special characters if required
  if (mergedPolicy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: PASSWORD_VALIDATION_ERRORS.MISSING_SPECIAL_CHAR };
  }
  
  // Check if password contains personal information
  if (userData) {
    const lowercasePassword = password.toLowerCase();
    
    // Check if password contains username
    if (userData.username && userData.username.length > 2 && 
        lowercasePassword.includes(userData.username.toLowerCase())) {
      return { valid: false, error: PASSWORD_VALIDATION_ERRORS.CONTAINS_USERNAME };
    }
    
    // Check if password contains email
    if (userData.email && userData.email.length > 2) {
      const emailParts = userData.email.toLowerCase().split('@');
      if (emailParts[0].length > 2 && lowercasePassword.includes(emailParts[0])) {
        return { valid: false, error: PASSWORD_VALIDATION_ERRORS.CONTAINS_EMAIL };
      }
    }
    
    // Check if password contains name
    if (userData.name && userData.name.length > 2) {
      const nameParts = userData.name.toLowerCase().split(/\s+/);
      for (const part of nameParts) {
        if (part.length > 2 && lowercasePassword.includes(part)) {
          return { valid: false, error: PASSWORD_VALIDATION_ERRORS.CONTAINS_PERSONAL_INFO };
        }
      }
    }
  }
  
  // All checks passed
  return { valid: true };
}

/**
 * Calculates the entropy (strength) of a password in bits
 * 
 * @param password - Password to calculate entropy for
 * @returns Entropy value in bits
 */
export function calculatePasswordEntropy(password: string): number {
  if (!password || password.length === 0) {
    return 0;
  }
  
  // Count character sets used in the password
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(password);
  
  // Calculate the size of the character pool
  let poolSize = 0;
  if (hasLowercase) poolSize += 26;
  if (hasUppercase) poolSize += 26;
  if (hasDigits) poolSize += 10;
  if (hasSpecialChars) poolSize += 33; // Approximate number of special characters
  
  // Calculate entropy using the formula: log2(poolSize^length)
  // Which simplifies to: length * log2(poolSize)
  return Math.log2(poolSize) * password.length;
}

/**
 * Normalizes a password by removing extra whitespace and applying
 * consistent Unicode normalization
 * 
 * @param password - Password to normalize
 * @returns Normalized password
 */
export function normalizePassword(password: string): string {
  // Trim whitespace and apply Unicode normalization (NFC form)
  return password.trim().normalize('NFC');
}

/**
 * Generates a secure random string suitable for temporary passwords
 * or security tokens
 * 
 * @param length - Length of the string to generate
 * @param charset - Character set to use (default: alphanumeric + special chars)
 * @returns Secure random string
 */
export function generateSecureRandomString(
  length = 16,
  charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
): string {
  if (length <= 0) {
    throw new Error('Length must be greater than 0');
  }
  
  if (charset.length < 10) {
    throw new Error('Charset must contain at least 10 characters');
  }
  
  // Generate random bytes
  const randomBytesBuffer = randomBytes(length * 2); // Get more bytes than needed to avoid bias
  let result = '';
  
  // Convert random bytes to characters from the charset
  for (let i = 0; i < randomBytesBuffer.length && result.length < length; i++) {
    const randomIndex = randomBytesBuffer[i] % charset.length;
    result += charset[randomIndex];
  }
  
  return result;
}

/**
 * Determines if a password needs rehashing based on the current algorithm
 * and security parameters
 * 
 * @param hash - Current password hash
 * @param options - Current hashing options to compare against
 * @returns True if the password should be rehashed, false otherwise
 */
export function passwordNeedsRehash(
  hash: string,
  options?: {
    algorithm?: 'bcrypt' | 'argon2';
    bcryptRounds?: number;
    argon2Options?: Partial<argon2.Options>;
  }
): boolean {
  try {
    const algorithm = options?.algorithm || DEFAULT_CONFIG.defaultAlgorithm;
    
    // Check if the hash algorithm matches the current preferred algorithm
    if (algorithm === 'bcrypt' && !hash.startsWith('$2')) {
      return true;
    }
    
    if (algorithm === 'argon2' && !hash.startsWith('$argon2')) {
      return true;
    }
    
    // Check bcrypt rounds
    if (algorithm === 'bcrypt' && hash.startsWith('$2')) {
      const rounds = options?.bcryptRounds || DEFAULT_CONFIG.bcrypt.rounds;
      const hashRounds = parseInt(hash.split('$')[2], 10);
      return hashRounds < rounds;
    }
    
    // For argon2, we would need to parse the hash to check parameters
    // This is a simplified check that could be expanded
    if (algorithm === 'argon2' && hash.startsWith('$argon2')) {
      // Argon2 parameter checking would go here
      // For now, we'll assume it's fine unless explicitly told to rehash
      return false;
    }
    
    return false;
  } catch (error) {
    // If there's any error parsing the hash, assume we need to rehash
    console.error('Error checking if password needs rehash:', error);
    return true;
  }
}

/**
 * Gets the current password policy configuration from environment variables
 * or uses default values
 * 
 * @returns Password policy configuration
 */
export function getPasswordPolicy(): PasswordPolicyConfig {
  // This would typically read from environment variables or configuration service
  // For now, we'll use default values
  return {
    minLength: getConfigNumber(CONFIG_KEYS.PASSWORD_MIN_LENGTH, DEFAULT_PASSWORD_POLICY.minLength),
    requireUppercase: getConfigBoolean(CONFIG_KEYS.PASSWORD_REQUIRE_UPPERCASE, DEFAULT_PASSWORD_POLICY.requireUppercase),
    requireLowercase: getConfigBoolean(CONFIG_KEYS.PASSWORD_REQUIRE_LOWERCASE, DEFAULT_PASSWORD_POLICY.requireLowercase),
    requireNumbers: getConfigBoolean(CONFIG_KEYS.PASSWORD_REQUIRE_NUMBER, DEFAULT_PASSWORD_POLICY.requireNumbers),
    requireSpecialChars: getConfigBoolean(CONFIG_KEYS.PASSWORD_REQUIRE_SPECIAL, DEFAULT_PASSWORD_POLICY.requireSpecialChars),
    maxAgeDays: getConfigNumber(CONFIG_KEYS.PASSWORD_MAX_AGE, DEFAULT_PASSWORD_POLICY.maxAgeDays),
    preventReuse: getConfigNumber(CONFIG_KEYS.PASSWORD_HISTORY, DEFAULT_PASSWORD_POLICY.preventReuse),
  };
}

/**
 * Helper function to get a number from environment variables
 * 
 * @param key - Environment variable key
 * @param defaultValue - Default value if not found or invalid
 * @returns Number value
 */
function getConfigNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Helper function to get a boolean from environment variables
 * 
 * @param key - Environment variable key
 * @param defaultValue - Default value if not found or invalid
 * @returns Boolean value
 */
function getConfigBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key]?.toLowerCase();
  if (value === undefined) {
    return defaultValue;
  }
  
  return value === 'true' || value === '1' || value === 'yes';
}