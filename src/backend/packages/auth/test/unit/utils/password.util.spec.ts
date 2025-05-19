/**
 * Unit tests for password utility functions
 * 
 * These tests verify the functionality of password management utilities including
 * hashing, verification, strength validation, and salt generation. The tests ensure
 * that passwords are securely hashed using bcrypt, properly verified with timing-attack
 * protection, and validated against strength requirements.
 */

import * as bcrypt from 'bcrypt';
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  passwordNeedsRehash,
  generateSecurePassword,
  isPasswordPreviouslyUsed,
  loadPasswordPolicyFromEnv
} from '../../../src/utils/password.util';
import { PasswordPolicyConfig } from '../../../src/types';
import { AUTH_ERROR_CODES } from '../../../src/constants';

// Mock bcrypt to avoid actual hashing in tests
jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
  getRounds: jest.fn()
}));

// Mock crypto for secure password generation
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('0123456789abcdef0123456789abcdef'))
}));

// Mock process.env for loadPasswordPolicyFromEnv tests
const originalEnv = process.env;

describe('Password Utilities', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore process.env to its original state
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore process.env after all tests
    process.env = originalEnv;
  });

  describe('generateSalt', () => {
    it('should generate a salt with default rounds', async () => {
      // Mock bcrypt.genSalt to return a fixed salt
      const mockSalt = '$2b$12$mockSaltValue';
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);

      const salt = await generateSalt();

      expect(bcrypt.genSalt).toHaveBeenCalledWith(12); // Default is 12 rounds
      expect(salt).toBe(mockSalt);
    });

    it('should generate a salt with custom rounds', async () => {
      // Mock bcrypt.genSalt to return a fixed salt
      const mockSalt = '$2b$16$mockSaltValue';
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);

      const salt = await generateSalt(16);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(16);
      expect(salt).toBe(mockSalt);
    });

    it('should throw an error if salt generation fails', async () => {
      // Mock bcrypt.genSalt to throw an error
      (bcrypt.genSalt as jest.Mock).mockRejectedValue(new Error('Salt generation failed'));

      await expect(generateSalt()).rejects.toThrow('Failed to generate salt: Salt generation failed');
    });
  });

  describe('hashPassword', () => {
    it('should hash a password with default salt rounds', async () => {
      // Mock bcrypt.hash to return a fixed hash
      const mockHash = '$2b$12$mockSaltValue.hashedPasswordValue';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const password = 'securePassword123!';
      const hash = await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12); // Default is 12 rounds
      expect(hash).toBe(mockHash);
    });

    it('should hash a password with custom salt rounds', async () => {
      // Mock bcrypt.hash to return a fixed hash
      const mockHash = '$2b$16$mockSaltValue.hashedPasswordValue';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const password = 'securePassword123!';
      const hash = await hashPassword(password, 16);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 16);
      expect(hash).toBe(mockHash);
    });

    it('should throw an error if password hashing fails', async () => {
      // Mock bcrypt.hash to throw an error
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      const password = 'securePassword123!';
      await expect(hashPassword(password)).rejects.toThrow('Password hashing failed: Hashing failed');
    });
  });

  describe('verifyPassword', () => {
    it('should return true for matching password and hash', async () => {
      // Mock bcrypt.compare to return true
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const plainPassword = 'securePassword123!';
      const hashedPassword = '$2b$12$mockSaltValue.hashedPasswordValue';

      const result = await verifyPassword(plainPassword, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      // Mock bcrypt.compare to return false
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const plainPassword = 'wrongPassword123!';
      const hashedPassword = '$2b$12$mockSaltValue.hashedPasswordValue';

      const result = await verifyPassword(plainPassword, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(false);
    });

    it('should throw an error if password verification fails', async () => {
      // Mock bcrypt.compare to throw an error
      (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Verification failed'));

      const plainPassword = 'securePassword123!';
      const hashedPassword = '$2b$12$mockSaltValue.hashedPasswordValue';

      await expect(verifyPassword(plainPassword, hashedPassword)).rejects.toThrow(
        'Password verification failed: Verification failed'
      );
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate a strong password that meets all requirements', () => {
      const password = 'StrongP@ssw0rd';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.errorCode).toBeUndefined();
    });

    it('should reject a password that is too short', () => {
      const password = 'Short1!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errorCode).toBe(AUTH_ERROR_CODES.PASSWORD_POLICY_VIOLATION);
    });

    it('should reject a password without uppercase letters when required', () => {
      const password = 'nouppercase123!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errorCode).toBe(AUTH_ERROR_CODES.PASSWORD_POLICY_VIOLATION);
    });

    it('should reject a password without lowercase letters when required', () => {
      const password = 'NOLOWERCASE123!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
      expect(result.errorCode).toBe(AUTH_ERROR_CODES.PASSWORD_POLICY_VIOLATION);
    });

    it('should reject a password without numbers when required', () => {
      const password = 'NoNumbersHere!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errorCode).toBe(AUTH_ERROR_CODES.PASSWORD_POLICY_VIOLATION);
    });

    it('should reject a password without special characters when required', () => {
      const password = 'NoSpecialChars123';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
      expect(result.errorCode).toBe(AUTH_ERROR_CODES.PASSWORD_POLICY_VIOLATION);
    });

    it('should validate a password against a custom policy', () => {
      const password = 'simple123';
      const customPolicy: Partial<PasswordPolicyConfig> = {
        minLength: 6,
        requireUppercase: false,
        requireSpecialChars: false
      };

      const result = validatePasswordStrength(password, customPolicy);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.errorCode).toBeUndefined();
    });

    it('should report multiple validation errors when a password fails multiple criteria', () => {
      const password = 'weak';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
      expect(result.errors).toHaveLength(4);
      expect(result.errorCode).toBe(AUTH_ERROR_CODES.PASSWORD_POLICY_VIOLATION);
    });
  });

  describe('passwordNeedsRehash', () => {
    it('should return true if the hash uses fewer rounds than required', async () => {
      // Mock bcrypt.getRounds to return a lower number of rounds
      (bcrypt.getRounds as jest.Mock).mockReturnValue(10);

      const hashedPassword = '$2b$10$mockSaltValue.hashedPasswordValue';
      const result = await passwordNeedsRehash(hashedPassword, 12);

      expect(bcrypt.getRounds).toHaveBeenCalledWith(hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false if the hash uses the required number of rounds', async () => {
      // Mock bcrypt.getRounds to return the same number of rounds
      (bcrypt.getRounds as jest.Mock).mockReturnValue(12);

      const hashedPassword = '$2b$12$mockSaltValue.hashedPasswordValue';
      const result = await passwordNeedsRehash(hashedPassword, 12);

      expect(bcrypt.getRounds).toHaveBeenCalledWith(hashedPassword);
      expect(result).toBe(false);
    });

    it('should return false if the hash uses more rounds than required', async () => {
      // Mock bcrypt.getRounds to return a higher number of rounds
      (bcrypt.getRounds as jest.Mock).mockReturnValue(14);

      const hashedPassword = '$2b$14$mockSaltValue.hashedPasswordValue';
      const result = await passwordNeedsRehash(hashedPassword, 12);

      expect(bcrypt.getRounds).toHaveBeenCalledWith(hashedPassword);
      expect(result).toBe(false);
    });

    it('should return true if an error occurs while checking the hash', async () => {
      // Mock bcrypt.getRounds to throw an error
      (bcrypt.getRounds as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid hash format');
      });

      const hashedPassword = 'invalidHashFormat';
      const result = await passwordNeedsRehash(hashedPassword, 12);

      expect(bcrypt.getRounds).toHaveBeenCalledWith(hashedPassword);
      expect(result).toBe(true);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate a password with the default length', () => {
      const password = generateSecurePassword();

      // Default length is 12
      expect(password.length).toBe(12);
      // Should meet all default requirements
      const validationResult = validatePasswordStrength(password);
      expect(validationResult.isValid).toBe(true);
    });

    it('should generate a password with a custom length', () => {
      const customLength = 16;
      const password = generateSecurePassword(customLength);

      expect(password.length).toBe(customLength);
      // Should meet all default requirements
      const validationResult = validatePasswordStrength(password);
      expect(validationResult.isValid).toBe(true);
    });

    it('should generate a password that meets custom policy requirements', () => {
      const customPolicy: Partial<PasswordPolicyConfig> = {
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false // Don't require special characters
      };

      const password = generateSecurePassword(12, customPolicy);

      // Should meet the custom requirements
      expect(password.length).toBe(12);
      expect(/[A-Z]/.test(password)).toBe(true); // Has uppercase
      expect(/[a-z]/.test(password)).toBe(true); // Has lowercase
      expect(/[0-9]/.test(password)).toBe(true); // Has numbers
      // We don't check for special chars as they're not required in our custom policy
    });

    it('should enforce minimum length even if a shorter length is requested', () => {
      // Try to generate a password shorter than the minimum length (8)
      const password = generateSecurePassword(6);

      // Should still be at least the minimum length
      expect(password.length).toBeGreaterThanOrEqual(8);
      const validationResult = validatePasswordStrength(password);
      expect(validationResult.isValid).toBe(true);
    });
  });

  describe('isPasswordPreviouslyUsed', () => {
    it('should return false if there are no previous passwords', async () => {
      const plainPassword = 'newPassword123!';
      const result = await isPasswordPreviouslyUsed(plainPassword, []);

      expect(result).toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return false if the password is not in the history', async () => {
      // Mock bcrypt.compare to return false for all comparisons
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const plainPassword = 'newPassword123!';
      const previousHashes = [
        '$2b$12$hash1.value',
        '$2b$12$hash2.value',
        '$2b$12$hash3.value'
      ];

      const result = await isPasswordPreviouslyUsed(plainPassword, previousHashes);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledTimes(3);
    });

    it('should return true if the password is found in the history', async () => {
      // Mock bcrypt.compare to return false for the first two comparisons and true for the third
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const plainPassword = 'oldPassword123!';
      const previousHashes = [
        '$2b$12$hash1.value',
        '$2b$12$hash2.value',
        '$2b$12$hash3.value'
      ];

      const result = await isPasswordPreviouslyUsed(plainPassword, previousHashes);

      expect(result).toBe(true);
      // Should stop checking after finding a match
      expect(bcrypt.compare).toHaveBeenCalledTimes(3);
    });

    it('should continue checking if verification fails for a specific hash', async () => {
      // Mock bcrypt.compare to throw an error for the first comparison and return true for the second
      (bcrypt.compare as jest.Mock)
        .mockRejectedValueOnce(new Error('Verification failed'))
        .mockResolvedValueOnce(true);

      const plainPassword = 'oldPassword123!';
      const previousHashes = [
        'invalidHash',
        '$2b$12$validHash.value'
      ];

      const result = await isPasswordPreviouslyUsed(plainPassword, previousHashes);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledTimes(2);
    });
  });

  describe('loadPasswordPolicyFromEnv', () => {
    it('should load default values when environment variables are not set', () => {
      const policy = loadPasswordPolicyFromEnv();

      expect(policy).toEqual({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAgeDays: 90,
        preventReuse: 3
      });
    });

    it('should load values from environment variables when set', () => {
      // Set environment variables
      process.env.PASSWORD_MIN_LENGTH = '10';
      process.env.PASSWORD_REQUIRE_UPPERCASE = 'false';
      process.env.PASSWORD_REQUIRE_LOWERCASE = 'true';
      process.env.PASSWORD_REQUIRE_NUMBER = 'true';
      process.env.PASSWORD_REQUIRE_SPECIAL = 'false';
      process.env.PASSWORD_MAX_AGE = '60';
      process.env.PASSWORD_HISTORY = '5';

      const policy = loadPasswordPolicyFromEnv();

      expect(policy).toEqual({
        minLength: 10,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        maxAgeDays: 60,
        preventReuse: 5
      });
    });

    it('should handle invalid numeric values in environment variables', () => {
      // Set invalid environment variables
      process.env.PASSWORD_MIN_LENGTH = 'not-a-number';
      process.env.PASSWORD_MAX_AGE = 'invalid';
      process.env.PASSWORD_HISTORY = 'five';

      const policy = loadPasswordPolicyFromEnv();

      // Should use default values for invalid numeric inputs
      expect(policy.minLength).toBe(8); // Default
      expect(policy.maxAgeDays).toBe(90); // Default
      expect(policy.preventReuse).toBe(3); // Default
    });
  });
});