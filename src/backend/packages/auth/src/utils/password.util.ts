/**
 * Password utility functions for authentication operations
 * 
 * Provides secure password management utilities including hashing, verification,
 * and strength validation using bcrypt with proper salt management.
 */

import * as bcrypt from 'bcrypt';
import { ValidationError } from '@austa/errors/categories';

/**
 * Default configuration for password operations
 */
export const PASSWORD_CONFIG = {
  /**
   * Default number of salt rounds for bcrypt
   * Higher values increase security but also increase computation time
   * Recommended value: 10-12 for production systems
   */
  SALT_ROUNDS: 10,
  
  /**
   * Minimum password length requirement
   */
  MIN_LENGTH: 8,
  
  /**
   * Maximum password length to prevent DoS attacks
   * Note: bcrypt has a hard limit of 72 bytes for passwords
   */
  MAX_LENGTH: 64,
  
  /**
   * Whether to require at least one uppercase letter
   */
  REQUIRE_UPPERCASE: true,
  
  /**
   * Whether to require at least one lowercase letter
   */
  REQUIRE_LOWERCASE: true,
  
  /**
   * Whether to require at least one number
   */
  REQUIRE_NUMBER: true,
  
  /**
   * Whether to require at least one special character
   */
  REQUIRE_SPECIAL: true,
};

/**
 * Password strength validation options
 */
export interface PasswordValidationOptions {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
}

/**
 * Validates password strength based on configurable requirements
 * 
 * @param password - The password to validate
 * @param options - Optional validation configuration
 * @returns True if the password meets all requirements
 * @throws ValidationError if the password fails any validation check
 */
export function validatePasswordStrength(
  password: string,
  options: PasswordValidationOptions = {}
): boolean {
  if (!password) {
    throw new ValidationError('Password is required', 'AUTH_101');
  }

  const config = {
    minLength: options.minLength ?? PASSWORD_CONFIG.MIN_LENGTH,
    maxLength: options.maxLength ?? PASSWORD_CONFIG.MAX_LENGTH,
    requireUppercase: options.requireUppercase ?? PASSWORD_CONFIG.REQUIRE_UPPERCASE,
    requireLowercase: options.requireLowercase ?? PASSWORD_CONFIG.REQUIRE_LOWERCASE,
    requireNumber: options.requireNumber ?? PASSWORD_CONFIG.REQUIRE_NUMBER,
    requireSpecial: options.requireSpecial ?? PASSWORD_CONFIG.REQUIRE_SPECIAL,
  };

  // Check for null characters which can cause issues with bcrypt
  if (password.includes('\0')) {
    throw new ValidationError('Password contains invalid characters', 'AUTH_102');
  }

  // Check password length
  if (password.length < config.minLength) {
    throw new ValidationError(
      `Password must be at least ${config.minLength} characters long`,
      'AUTH_103'
    );
  }

  if (password.length > config.maxLength) {
    throw new ValidationError(
      `Password cannot exceed ${config.maxLength} characters`,
      'AUTH_104'
    );
  }

  // Check for uppercase letters
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    throw new ValidationError(
      'Password must contain at least one uppercase letter',
      'AUTH_105'
    );
  }

  // Check for lowercase letters
  if (config.requireLowercase && !/[a-z]/.test(password)) {
    throw new ValidationError(
      'Password must contain at least one lowercase letter',
      'AUTH_106'
    );
  }

  // Check for numbers
  if (config.requireNumber && !/[0-9]/.test(password)) {
    throw new ValidationError(
      'Password must contain at least one number',
      'AUTH_107'
    );
  }

  // Check for special characters
  if (config.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
    throw new ValidationError(
      'Password must contain at least one special character',
      'AUTH_108'
    );
  }

  return true;
}

/**
 * Generates a secure salt for password hashing
 * 
 * @param rounds - Number of salt rounds (default: PASSWORD_CONFIG.SALT_ROUNDS)
 * @returns Promise resolving to the generated salt
 */
export async function generateSalt(rounds: number = PASSWORD_CONFIG.SALT_ROUNDS): Promise<string> {
  try {
    return await bcrypt.genSalt(rounds);
  } catch (error) {
    throw new ValidationError(
      'Failed to generate password salt',
      'AUTH_109',
      { cause: error }
    );
  }
}

/**
 * Synchronously generates a secure salt for password hashing
 * 
 * @param rounds - Number of salt rounds (default: PASSWORD_CONFIG.SALT_ROUNDS)
 * @returns The generated salt
 */
export function generateSaltSync(rounds: number = PASSWORD_CONFIG.SALT_ROUNDS): string {
  try {
    return bcrypt.genSaltSync(rounds);
  } catch (error) {
    throw new ValidationError(
      'Failed to generate password salt',
      'AUTH_109',
      { cause: error }
    );
  }
}

/**
 * Hashes a password using bcrypt with a secure salt
 * 
 * @param password - The plain text password to hash
 * @param saltRounds - Number of salt rounds (default: PASSWORD_CONFIG.SALT_ROUNDS)
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(password: string, saltRounds: number = PASSWORD_CONFIG.SALT_ROUNDS): Promise<string> {
  if (!password) {
    throw new ValidationError('Password is required for hashing', 'AUTH_110');
  }

  try {
    const salt = await generateSalt(saltRounds);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new ValidationError(
      'Failed to hash password',
      'AUTH_111',
      { cause: error }
    );
  }
}

/**
 * Synchronously hashes a password using bcrypt with a secure salt
 * 
 * @param password - The plain text password to hash
 * @param saltRounds - Number of salt rounds (default: PASSWORD_CONFIG.SALT_ROUNDS)
 * @returns The hashed password
 */
export function hashPasswordSync(password: string, saltRounds: number = PASSWORD_CONFIG.SALT_ROUNDS): string {
  if (!password) {
    throw new ValidationError('Password is required for hashing', 'AUTH_110');
  }

  try {
    const salt = generateSaltSync(saltRounds);
    return bcrypt.hashSync(password, salt);
  } catch (error) {
    throw new ValidationError(
      'Failed to hash password',
      'AUTH_111',
      { cause: error }
    );
  }
}

/**
 * Verifies a password against a hash with protection against timing attacks
 * 
 * @param password - The plain text password to verify
 * @param hash - The hashed password to compare against
 * @returns Promise resolving to true if the password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    throw new ValidationError('Password and hash are required for verification', 'AUTH_112');
  }

  try {
    // bcrypt.compare is already protected against timing attacks
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new ValidationError(
      'Failed to verify password',
      'AUTH_113',
      { cause: error }
    );
  }
}

/**
 * Synchronously verifies a password against a hash with protection against timing attacks
 * 
 * @param password - The plain text password to verify
 * @param hash - The hashed password to compare against
 * @returns True if the password matches, false otherwise
 */
export function verifyPasswordSync(password: string, hash: string): boolean {
  if (!password || !hash) {
    throw new ValidationError('Password and hash are required for verification', 'AUTH_112');
  }

  try {
    // bcrypt.compareSync is already protected against timing attacks
    return bcrypt.compareSync(password, hash);
  } catch (error) {
    throw new ValidationError(
      'Failed to verify password',
      'AUTH_113',
      { cause: error }
    );
  }
}