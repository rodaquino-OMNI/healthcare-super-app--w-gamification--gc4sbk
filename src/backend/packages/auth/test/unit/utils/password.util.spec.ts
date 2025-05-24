/**
 * Unit tests for password utility functions
 * 
 * Tests password management utilities including hashing, verification,
 * strength validation, and salt generation.
 */

import * as bcrypt from 'bcrypt';
import { ValidationError } from '@austa/errors/categories';
import {
  PASSWORD_CONFIG,
  validatePasswordStrength,
  generateSalt,
  generateSaltSync,
  hashPassword,
  hashPasswordSync,
  verifyPassword,
  verifyPasswordSync,
  PasswordValidationOptions
} from '../../../src/utils/password.util';

// Mock bcrypt to avoid actual cryptographic operations in tests
jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  genSaltSync: jest.fn(),
  hash: jest.fn(),
  hashSync: jest.fn(),
  compare: jest.fn(),
  compareSync: jest.fn(),
}));

describe('Password Utilities', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('PASSWORD_CONFIG', () => {
    it('should have the correct default values', () => {
      expect(PASSWORD_CONFIG).toEqual({
        SALT_ROUNDS: 10,
        MIN_LENGTH: 8,
        MAX_LENGTH: 64,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBER: true,
        REQUIRE_SPECIAL: true,
      });
    });
  });

  describe('validatePasswordStrength', () => {
    it('should return true for a valid password with default options', () => {
      const password = 'ValidPassword123!';
      expect(validatePasswordStrength(password)).toBe(true);
    });

    it('should throw ValidationError if password is empty', () => {
      expect(() => validatePasswordStrength('')).toThrow(ValidationError);
      expect(() => validatePasswordStrength('')).toThrow('Password is required');
    });

    it('should throw ValidationError if password is null or undefined', () => {
      expect(() => validatePasswordStrength(null as any)).toThrow(ValidationError);
      expect(() => validatePasswordStrength(undefined as any)).toThrow(ValidationError);
    });

    it('should throw ValidationError if password contains null characters', () => {
      const password = 'Password\0123!';
      expect(() => validatePasswordStrength(password)).toThrow(ValidationError);
      expect(() => validatePasswordStrength(password)).toThrow('Password contains invalid characters');
    });

    it('should throw ValidationError if password is too short', () => {
      const password = 'Short1!';
      expect(() => validatePasswordStrength(password, { minLength: 10 })).toThrow(ValidationError);
      expect(() => validatePasswordStrength(password, { minLength: 10 }))
        .toThrow('Password must be at least 10 characters long');
    });

    it('should throw ValidationError if password is too long', () => {
      const password = 'VeryLongPassword'.repeat(10) + '123!';
      expect(() => validatePasswordStrength(password, { maxLength: 20 })).toThrow(ValidationError);
      expect(() => validatePasswordStrength(password, { maxLength: 20 }))
        .toThrow('Password cannot exceed 20 characters');
    });

    it('should throw ValidationError if password has no uppercase letters when required', () => {
      const password = 'lowercase123!';
      expect(() => validatePasswordStrength(password)).toThrow(ValidationError);
      expect(() => validatePasswordStrength(password))
        .toThrow('Password must contain at least one uppercase letter');
    });

    it('should throw ValidationError if password has no lowercase letters when required', () => {
      const password = 'UPPERCASE123!';
      expect(() => validatePasswordStrength(password)).toThrow(ValidationError);
      expect(() => validatePasswordStrength(password))
        .toThrow('Password must contain at least one lowercase letter');
    });

    it('should throw ValidationError if password has no numbers when required', () => {
      const password = 'PasswordWithoutNumbers!';
      expect(() => validatePasswordStrength(password)).toThrow(ValidationError);
      expect(() => validatePasswordStrength(password))
        .toThrow('Password must contain at least one number');
    });

    it('should throw ValidationError if password has no special characters when required', () => {
      const password = 'PasswordWithoutSpecial123';
      expect(() => validatePasswordStrength(password)).toThrow(ValidationError);
      expect(() => validatePasswordStrength(password))
        .toThrow('Password must contain at least one special character');
    });

    it('should accept a password without uppercase when not required', () => {
      const password = 'lowercase123!';
      const options: PasswordValidationOptions = { requireUppercase: false };
      expect(validatePasswordStrength(password, options)).toBe(true);
    });

    it('should accept a password without lowercase when not required', () => {
      const password = 'UPPERCASE123!';
      const options: PasswordValidationOptions = { requireLowercase: false };
      expect(validatePasswordStrength(password, options)).toBe(true);
    });

    it('should accept a password without numbers when not required', () => {
      const password = 'PasswordWithoutNumbers!';
      const options: PasswordValidationOptions = { requireNumber: false };
      expect(validatePasswordStrength(password, options)).toBe(true);
    });

    it('should accept a password without special characters when not required', () => {
      const password = 'PasswordWithoutSpecial123';
      const options: PasswordValidationOptions = { requireSpecial: false };
      expect(validatePasswordStrength(password, options)).toBe(true);
    });

    it('should validate a password with custom options', () => {
      const password = 'simple';
      const options: PasswordValidationOptions = {
        minLength: 6,
        maxLength: 10,
        requireUppercase: false,
        requireLowercase: true,
        requireNumber: false,
        requireSpecial: false,
      };
      expect(validatePasswordStrength(password, options)).toBe(true);
    });
  });

  describe('generateSalt', () => {
    it('should call bcrypt.genSalt with default salt rounds', async () => {
      const mockSalt = '$2b$10$abcdefghijklmnopqrstuv';
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);

      const salt = await generateSalt();

      expect(bcrypt.genSalt).toHaveBeenCalledWith(PASSWORD_CONFIG.SALT_ROUNDS);
      expect(salt).toBe(mockSalt);
    });

    it('should call bcrypt.genSalt with custom salt rounds', async () => {
      const mockSalt = '$2b$12$abcdefghijklmnopqrstuv';
      const customRounds = 12;
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);

      const salt = await generateSalt(customRounds);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(customRounds);
      expect(salt).toBe(mockSalt);
    });

    it('should throw ValidationError if bcrypt.genSalt fails', async () => {
      const error = new Error('Bcrypt error');
      (bcrypt.genSalt as jest.Mock).mockRejectedValue(error);

      await expect(generateSalt()).rejects.toThrow(ValidationError);
      await expect(generateSalt()).rejects.toThrow('Failed to generate password salt');
    });
  });

  describe('generateSaltSync', () => {
    it('should call bcrypt.genSaltSync with default salt rounds', () => {
      const mockSalt = '$2b$10$abcdefghijklmnopqrstuv';
      (bcrypt.genSaltSync as jest.Mock).mockReturnValue(mockSalt);

      const salt = generateSaltSync();

      expect(bcrypt.genSaltSync).toHaveBeenCalledWith(PASSWORD_CONFIG.SALT_ROUNDS);
      expect(salt).toBe(mockSalt);
    });

    it('should call bcrypt.genSaltSync with custom salt rounds', () => {
      const mockSalt = '$2b$12$abcdefghijklmnopqrstuv';
      const customRounds = 12;
      (bcrypt.genSaltSync as jest.Mock).mockReturnValue(mockSalt);

      const salt = generateSaltSync(customRounds);

      expect(bcrypt.genSaltSync).toHaveBeenCalledWith(customRounds);
      expect(salt).toBe(mockSalt);
    });

    it('should throw ValidationError if bcrypt.genSaltSync fails', () => {
      const error = new Error('Bcrypt error');
      (bcrypt.genSaltSync as jest.Mock).mockImplementation(() => {
        throw error;
      });

      expect(() => generateSaltSync()).toThrow(ValidationError);
      expect(() => generateSaltSync()).toThrow('Failed to generate password salt');
    });
  });

  describe('hashPassword', () => {
    it('should throw ValidationError if password is empty', async () => {
      await expect(hashPassword('')).rejects.toThrow(ValidationError);
      await expect(hashPassword('')).rejects.toThrow('Password is required for hashing');
    });

    it('should throw ValidationError if password is null or undefined', async () => {
      await expect(hashPassword(null as any)).rejects.toThrow(ValidationError);
      await expect(hashPassword(undefined as any)).rejects.toThrow(ValidationError);
    });

    it('should generate salt and hash password with default salt rounds', async () => {
      const password = 'Password123!';
      const mockSalt = '$2b$10$abcdefghijklmnopqrstuv';
      const mockHash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789';

      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const hash = await hashPassword(password);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(PASSWORD_CONFIG.SALT_ROUNDS);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, mockSalt);
      expect(hash).toBe(mockHash);
    });

    it('should generate salt and hash password with custom salt rounds', async () => {
      const password = 'Password123!';
      const customRounds = 12;
      const mockSalt = '$2b$12$abcdefghijklmnopqrstuv';
      const mockHash = '$2b$12$abcdefghijklmnopqrstuvwxyz0123456789';

      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const hash = await hashPassword(password, customRounds);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(customRounds);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, mockSalt);
      expect(hash).toBe(mockHash);
    });

    it('should throw ValidationError if bcrypt.hash fails', async () => {
      const password = 'Password123!';
      const mockSalt = '$2b$10$abcdefghijklmnopqrstuv';
      const error = new Error('Bcrypt error');

      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockRejectedValue(error);

      await expect(hashPassword(password)).rejects.toThrow(ValidationError);
      await expect(hashPassword(password)).rejects.toThrow('Failed to hash password');
    });
  });

  describe('hashPasswordSync', () => {
    it('should throw ValidationError if password is empty', () => {
      expect(() => hashPasswordSync('')).toThrow(ValidationError);
      expect(() => hashPasswordSync('')).toThrow('Password is required for hashing');
    });

    it('should throw ValidationError if password is null or undefined', () => {
      expect(() => hashPasswordSync(null as any)).toThrow(ValidationError);
      expect(() => hashPasswordSync(undefined as any)).toThrow(ValidationError);
    });

    it('should generate salt and hash password with default salt rounds', () => {
      const password = 'Password123!';
      const mockSalt = '$2b$10$abcdefghijklmnopqrstuv';
      const mockHash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789';

      (bcrypt.genSaltSync as jest.Mock).mockReturnValue(mockSalt);
      (bcrypt.hashSync as jest.Mock).mockReturnValue(mockHash);

      const hash = hashPasswordSync(password);

      expect(bcrypt.genSaltSync).toHaveBeenCalledWith(PASSWORD_CONFIG.SALT_ROUNDS);
      expect(bcrypt.hashSync).toHaveBeenCalledWith(password, mockSalt);
      expect(hash).toBe(mockHash);
    });

    it('should generate salt and hash password with custom salt rounds', () => {
      const password = 'Password123!';
      const customRounds = 12;
      const mockSalt = '$2b$12$abcdefghijklmnopqrstuv';
      const mockHash = '$2b$12$abcdefghijklmnopqrstuvwxyz0123456789';

      (bcrypt.genSaltSync as jest.Mock).mockReturnValue(mockSalt);
      (bcrypt.hashSync as jest.Mock).mockReturnValue(mockHash);

      const hash = hashPasswordSync(password, customRounds);

      expect(bcrypt.genSaltSync).toHaveBeenCalledWith(customRounds);
      expect(bcrypt.hashSync).toHaveBeenCalledWith(password, mockSalt);
      expect(hash).toBe(mockHash);
    });

    it('should throw ValidationError if bcrypt.hashSync fails', () => {
      const password = 'Password123!';
      const mockSalt = '$2b$10$abcdefghijklmnopqrstuv';
      const error = new Error('Bcrypt error');

      (bcrypt.genSaltSync as jest.Mock).mockReturnValue(mockSalt);
      (bcrypt.hashSync as jest.Mock).mockImplementation(() => {
        throw error;
      });

      expect(() => hashPasswordSync(password)).toThrow(ValidationError);
      expect(() => hashPasswordSync(password)).toThrow('Failed to hash password');
    });
  });

  describe('verifyPassword', () => {
    it('should throw ValidationError if password is empty', async () => {
      const hash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789';

      await expect(verifyPassword('', hash)).rejects.toThrow(ValidationError);
      await expect(verifyPassword('', hash)).rejects.toThrow('Password and hash are required for verification');
    });

    it('should throw ValidationError if hash is empty', async () => {
      const password = 'Password123!';

      await expect(verifyPassword(password, '')).rejects.toThrow(ValidationError);
      await expect(verifyPassword(password, '')).rejects.toThrow('Password and hash are required for verification');
    });

    it('should throw ValidationError if password or hash is null or undefined', async () => {
      const password = 'Password123!';
      const hash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789';

      await expect(verifyPassword(null as any, hash)).rejects.toThrow(ValidationError);
      await expect(verifyPassword(password, null as any)).rejects.toThrow(ValidationError);
      await expect(verifyPassword(undefined as any, hash)).rejects.toThrow(ValidationError);
      await expect(verifyPassword(password, undefined as any)).rejects.toThrow(ValidationError);
    });

    it('should return true if password matches hash', async () => {
      const password = 'Password123!';
      const hash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await verifyPassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false if password does not match hash', async () => {
      const password = 'Password123!';
      const hash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await verifyPassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should throw ValidationError if bcrypt.compare fails', async () => {
      const password = 'Password123!';
      const hash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789';
      const error = new Error('Bcrypt error');

      (bcrypt.compare as jest.Mock).mockRejectedValue(error);

      await expect(verifyPassword(password, hash)).rejects.toThrow(ValidationError);
      await expect(verifyPassword(password, hash)).rejects.toThrow('Failed to verify password');
    });
  });

  describe('verifyPasswordSync', () => {
    it('should throw ValidationError if password is empty', () => {
      const hash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789';

      expect(() => verifyPasswordSync('', hash)).toThrow(ValidationError);
      expect(() => verifyPasswordSync('', hash)).toThrow('Password and hash are required for verification');
    });

    it('should throw ValidationError if hash is empty', () => {
      const password = 'Password123!';

      expect(() => verifyPasswordSync(password, '')).toThrow(ValidationError);
      expect(() => verifyPasswordSync(password, '')).toThrow('Password and hash are required for verification');
    });

    it('should throw ValidationError if password or hash is null or undefined', () => {
      const password = 'Password123!';
      const hash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789';

      expect(() => verifyPasswordSync(null as any, hash)).toThrow(ValidationError);
      expect(() => verifyPasswordSync(password, null as any)).toThrow(ValidationError);
      expect(() => verifyPasswordSync(undefined as any, hash)).toThrow(ValidationError);
      expect(() => verifyPasswordSync(password, undefined as any)).toThrow(ValidationError);
    });

    it('should return true if password matches hash', () => {
      const password = 'Password123!';
      const hash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789';

      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

      const result = verifyPasswordSync(password, hash);

      expect(bcrypt.compareSync).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false if password does not match hash', () => {
      const password = 'Password123!';
      const hash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789';

      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      const result = verifyPasswordSync(password, hash);

      expect(bcrypt.compareSync).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should throw ValidationError if bcrypt.compareSync fails', () => {
      const password = 'Password123!';
      const hash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789';
      const error = new Error('Bcrypt error');

      (bcrypt.compareSync as jest.Mock).mockImplementation(() => {
        throw error;
      });

      expect(() => verifyPasswordSync(password, hash)).toThrow(ValidationError);
      expect(() => verifyPasswordSync(password, hash)).toThrow('Failed to verify password');
    });
  });
});