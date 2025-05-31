/**
 * Password Utilities
 * 
 * This module provides utility functions for secure password handling, including
 * hashing, verification, and strength validation. It uses industry-standard
 * cryptographic algorithms (bcrypt and argon2) for password hashing and implements
 * best practices for secure comparison.
 * 
 * @module password-utils
 */

import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { timingSafeEqual } from 'crypto';

/**
 * Default configuration for password hashing algorithms
 */
export const DEFAULT_CONFIG = {
  // bcrypt configuration
  bcrypt: {
    // Work factor for bcrypt (cost)
    // Higher values increase security but also increase hashing time
    // Recommended minimum: 12
    rounds: 12,
  },
  // argon2 configuration
  argon2: {
    // Argon2 variant to use
    // id: Recommended for most use cases (combines d and i)
    // d: Maximizes resistance to GPU attacks but vulnerable to side-channel attacks
    // i: Maximizes resistance to side-channel attacks but less resistant to GPU attacks
    type: argon2.argon2id,
    // Memory usage in KiB
    // Higher values increase security but also increase memory usage
    // Recommended minimum: 32768 (32 MB)
    memoryCost: 32768,
    // Number of iterations
    // Higher values increase security but also increase hashing time
    // Recommended minimum: 3
    timeCost: 3,
    // Degree of parallelism
    // Higher values can increase performance on multi-core systems
    // Recommended minimum: 4
    parallelism: 4,
    // Length of the generated hash
    // Recommended minimum: 32
    hashLength: 32,
  },
  // Password strength requirements
  passwordStrength: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxConsecutiveChars: 3,
  },
};

/**
 * Configuration options for password hashing
 */
export interface PasswordHashOptions {
  /**
   * Algorithm to use for password hashing
   * @default 'argon2'
   */
  algorithm?: 'bcrypt' | 'argon2';
  /**
   * Configuration for bcrypt
   */
  bcrypt?: {
    /**
     * Work factor for bcrypt (cost)
     * @default 12
     */
    rounds?: number;
  };
  /**
   * Configuration for argon2
   */
  argon2?: {
    /**
     * Argon2 variant to use
     * @default argon2.argon2id
     */
    type?: 0 | 1 | 2; // argon2d, argon2i, argon2id
    /**
     * Memory usage in KiB
     * @default 32768 (32 MB)
     */
    memoryCost?: number;
    /**
     * Number of iterations
     * @default 3
     */
    timeCost?: number;
    /**
     * Degree of parallelism
     * @default 4
     */
    parallelism?: number;
    /**
     * Length of the generated hash
     * @default 32
     */
    hashLength?: number;
  };
}

/**
 * Configuration options for password strength validation
 */
export interface PasswordStrengthOptions {
  /**
   * Minimum password length
   * @default 8
   */
  minLength?: number;
  /**
   * Require at least one uppercase letter
   * @default true
   */
  requireUppercase?: boolean;
  /**
   * Require at least one lowercase letter
   * @default true
   */
  requireLowercase?: boolean;
  /**
   * Require at least one number
   * @default true
   */
  requireNumbers?: boolean;
  /**
   * Require at least one special character
   * @default true
   */
  requireSpecialChars?: boolean;
  /**
   * Maximum number of consecutive identical characters
   * @default 3
   */
  maxConsecutiveChars?: number;
}

/**
 * Result of password strength validation
 */
export interface PasswordStrengthResult {
  /**
   * Whether the password meets all requirements
   */
  isValid: boolean;
  /**
   * List of validation errors
   */
  errors: string[];
  /**
   * Estimated password strength score (0-100)
   */
  score: number;
}

/**
 * Error thrown when password hashing or verification fails
 */
export class PasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PasswordError';
    Object.setPrototypeOf(this, PasswordError.prototype);
  }
}

/**
 * Hashes a password using the specified algorithm
 * 
 * @param password - The plain text password to hash
 * @param options - Configuration options for password hashing
 * @returns A promise that resolves to the hashed password
 * @throws {PasswordError} If hashing fails
 * 
 * @example
 * // Hash a password with default options (argon2)
 * const hash = await hashPassword('mySecurePassword');
 * 
 * @example
 * // Hash a password with bcrypt
 * const hash = await hashPassword('mySecurePassword', { algorithm: 'bcrypt' });
 * 
 * @example
 * // Hash a password with custom argon2 options
 * const hash = await hashPassword('mySecurePassword', {
 *   algorithm: 'argon2',
 *   argon2: {
 *     memoryCost: 65536, // 64 MB
 *     timeCost: 4,
 *   }
 * });
 */
export async function hashPassword(
  password: string,
  options: PasswordHashOptions = {}
): Promise<string> {
  const algorithm = options.algorithm || 'argon2';

  try {
    if (algorithm === 'bcrypt') {
      const rounds = options.bcrypt?.rounds || DEFAULT_CONFIG.bcrypt.rounds;
      return await bcrypt.hash(password, rounds);
    } else {
      // Use argon2
      const argon2Options = {
        type: options.argon2?.type ?? DEFAULT_CONFIG.argon2.type,
        memoryCost: options.argon2?.memoryCost ?? DEFAULT_CONFIG.argon2.memoryCost,
        timeCost: options.argon2?.timeCost ?? DEFAULT_CONFIG.argon2.timeCost,
        parallelism: options.argon2?.parallelism ?? DEFAULT_CONFIG.argon2.parallelism,
        hashLength: options.argon2?.hashLength ?? DEFAULT_CONFIG.argon2.hashLength,
      };
      return await argon2.hash(password, argon2Options);
    }
  } catch (error) {
    throw new PasswordError(`Password hashing failed: ${(error as Error).message}`);
  }
}

/**
 * Verifies a password against a hash
 * 
 * @param hash - The hashed password to compare against
 * @param password - The plain text password to verify
 * @returns A promise that resolves to true if the password matches the hash, false otherwise
 * @throws {PasswordError} If verification fails due to an error
 * 
 * @example
 * // Verify a password against a hash
 * const isMatch = await verifyPassword(storedHash, 'mySecurePassword');
 * if (isMatch) {
 *   // Password is correct
 * } else {
 *   // Password is incorrect
 * }
 */
export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  try {
    // Detect hash algorithm
    if (hash.startsWith('$2')) {
      // bcrypt hash
      return await bcrypt.compare(password, hash);
    } else if (hash.startsWith('$argon2')) {
      // argon2 hash
      return await argon2.verify(hash, password);
    } else {
      throw new PasswordError('Unknown hash format');
    }
  } catch (error) {
    if (error instanceof PasswordError) {
      throw error;
    }
    throw new PasswordError(`Password verification failed: ${(error as Error).message}`);
  }
}

/**
 * Performs a constant-time comparison of two strings
 * This helps prevent timing attacks when comparing sensitive data
 * 
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns True if the strings are equal, false otherwise
 */
export function constantTimeEqual(a: string, b: string): boolean {
  // Convert strings to buffers for comparison
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  // If lengths are different, create a new buffer of the same length as bufferA
  // This ensures the comparison takes the same amount of time regardless of length
  if (bufferA.length !== bufferB.length) {
    // Create a new buffer with the same length as bufferA
    const newBufferB = Buffer.alloc(bufferA.length, 0);
    // Copy bufferB into newBufferB (up to the length of bufferB)
    bufferB.copy(newBufferB, 0, 0, Math.min(bufferB.length, bufferA.length));
    // Compare bufferA with newBufferB in constant time
    return timingSafeEqual(bufferA, newBufferB) && bufferA.length === bufferB.length;
  }

  // If lengths are the same, compare directly
  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Validates password strength against configurable requirements
 * 
 * @param password - The password to validate
 * @param options - Configuration options for password strength validation
 * @returns A result object with validation status, errors, and strength score
 * 
 * @example
 * // Validate password with default requirements
 * const result = validatePasswordStrength('myPassword123!');
 * if (result.isValid) {
 *   // Password meets all requirements
 * } else {
 *   // Password does not meet requirements
 *   console.log(result.errors);
 * }
 * 
 * @example
 * // Validate password with custom requirements
 * const result = validatePasswordStrength('myPassword', {
 *   minLength: 10,
 *   requireSpecialChars: false
 * });
 */
export function validatePasswordStrength(
  password: string,
  options: PasswordStrengthOptions = {}
): PasswordStrengthResult {
  const config = {
    minLength: options.minLength ?? DEFAULT_CONFIG.passwordStrength.minLength,
    requireUppercase: options.requireUppercase ?? DEFAULT_CONFIG.passwordStrength.requireUppercase,
    requireLowercase: options.requireLowercase ?? DEFAULT_CONFIG.passwordStrength.requireLowercase,
    requireNumbers: options.requireNumbers ?? DEFAULT_CONFIG.passwordStrength.requireNumbers,
    requireSpecialChars: options.requireSpecialChars ?? DEFAULT_CONFIG.passwordStrength.requireSpecialChars,
    maxConsecutiveChars: options.maxConsecutiveChars ?? DEFAULT_CONFIG.passwordStrength.maxConsecutiveChars,
  };

  const errors: string[] = [];

  // Check minimum length
  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }

  // Check for uppercase letters
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (config.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special characters
  if (config.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for consecutive identical characters
  if (config.maxConsecutiveChars) {
    const consecutiveRegex = new RegExp(`(.)\\1{${config.maxConsecutiveChars},}`);
    if (consecutiveRegex.test(password)) {
      errors.push(`Password must not contain more than ${config.maxConsecutiveChars} consecutive identical characters`);
    }
  }

  // Calculate password strength score (0-100)
  let score = 0;
  
  // Base score from length (up to 40 points)
  score += Math.min(40, password.length * 4);
  
  // Additional points for character variety (up to 60 points)
  if (/[A-Z]/.test(password)) score += 10; // Uppercase
  if (/[a-z]/.test(password)) score += 10; // Lowercase
  if (/[0-9]/.test(password)) score += 10; // Numbers
  if (/[^A-Za-z0-9]/.test(password)) score += 15; // Special chars
  
  // Additional points for mixed character types (up to 15 points)
  const charTypes = [
    /[A-Z]/.test(password), // Uppercase
    /[a-z]/.test(password), // Lowercase
    /[0-9]/.test(password), // Numbers
    /[^A-Za-z0-9]/.test(password), // Special chars
  ].filter(Boolean).length;
  score += (charTypes - 1) * 5;
  
  // Cap score at 100
  score = Math.min(100, score);
  
  // Reduce score for consecutive characters
  if (config.maxConsecutiveChars) {
    const consecutiveRegex = new RegExp(`(.)\\1{${config.maxConsecutiveChars - 1},}`);
    if (consecutiveRegex.test(password)) {
      score = Math.max(0, score - 20);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    score,
  };
}

/**
 * Generates a cryptographically secure random password
 * 
 * @param length - Length of the generated password
 * @param options - Configuration options for password generation
 * @returns A randomly generated password that meets the specified requirements
 * 
 * @example
 * // Generate a random password with default options
 * const password = generateSecurePassword();
 * 
 * @example
 * // Generate a longer password with custom requirements
 * const password = generateSecurePassword(16, {
 *   requireSpecialChars: true,
 *   requireNumbers: true
 * });
 */
export function generateSecurePassword(
  length: number = 16,
  options: PasswordStrengthOptions = {}
): string {
  const config = {
    requireUppercase: options.requireUppercase ?? DEFAULT_CONFIG.passwordStrength.requireUppercase,
    requireLowercase: options.requireLowercase ?? DEFAULT_CONFIG.passwordStrength.requireLowercase,
    requireNumbers: options.requireNumbers ?? DEFAULT_CONFIG.passwordStrength.requireNumbers,
    requireSpecialChars: options.requireSpecialChars ?? DEFAULT_CONFIG.passwordStrength.requireSpecialChars,
  };

  // Define character sets
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  // Create a pool of characters based on requirements
  let charPool = '';
  if (config.requireUppercase) charPool += uppercaseChars;
  if (config.requireLowercase) charPool += lowercaseChars;
  if (config.requireNumbers) charPool += numberChars;
  if (config.requireSpecialChars) charPool += specialChars;

  // If no requirements are specified, use all character sets
  if (charPool === '') {
    charPool = uppercaseChars + lowercaseChars + numberChars + specialChars;
  }

  // Generate a random password
  let password = '';
  const crypto = require('crypto');

  // Ensure at least one character from each required set
  if (config.requireUppercase) {
    password += uppercaseChars.charAt(crypto.randomInt(0, uppercaseChars.length));
  }
  if (config.requireLowercase) {
    password += lowercaseChars.charAt(crypto.randomInt(0, lowercaseChars.length));
  }
  if (config.requireNumbers) {
    password += numberChars.charAt(crypto.randomInt(0, numberChars.length));
  }
  if (config.requireSpecialChars) {
    password += specialChars.charAt(crypto.randomInt(0, specialChars.length));
  }

  // Fill the rest of the password with random characters
  while (password.length < length) {
    password += charPool.charAt(crypto.randomInt(0, charPool.length));
  }

  // Shuffle the password to avoid predictable patterns
  password = password.split('').sort(() => 0.5 - crypto.randomInt(0, 1000) / 1000).join('');

  return password;
}