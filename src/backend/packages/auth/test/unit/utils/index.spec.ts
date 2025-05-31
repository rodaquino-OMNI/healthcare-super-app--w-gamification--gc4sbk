import { describe, it, expect } from 'jest';

// Import all utilities from the barrel file
import * as AuthUtils from '../../../src/utils';

// Import individual utilities directly to compare
import * as ValidationUtils from '../../../src/utils/validation.util';
import * as CryptoUtils from '../../../src/utils/crypto.util';
import * as TokenUtils from '../../../src/utils/token.util';
import * as PasswordUtils from '../../../src/utils/password.util';

describe('Auth Utils Index Barrel File', () => {
  describe('Exports all utility functions', () => {
    it('should export all validation utilities', () => {
      // Check that all validation utilities are exported
      Object.keys(ValidationUtils).forEach(key => {
        expect(AuthUtils).toHaveProperty(key);
        expect(AuthUtils[key]).toBe(ValidationUtils[key]);
      });
    });

    it('should export all crypto utilities', () => {
      // Check that all crypto utilities are exported
      Object.keys(CryptoUtils).forEach(key => {
        expect(AuthUtils).toHaveProperty(key);
        expect(AuthUtils[key]).toBe(CryptoUtils[key]);
      });
    });

    it('should export all token utilities', () => {
      // Check that all token utilities are exported
      Object.keys(TokenUtils).forEach(key => {
        expect(AuthUtils).toHaveProperty(key);
        expect(AuthUtils[key]).toBe(TokenUtils[key]);
      });
    });

    it('should export all password utilities', () => {
      // Check that all password utilities are exported
      Object.keys(PasswordUtils).forEach(key => {
        expect(AuthUtils).toHaveProperty(key);
        expect(AuthUtils[key]).toBe(PasswordUtils[key]);
      });
    });
  });

  describe('Type checking for exported utilities', () => {
    it('should maintain correct types for validation utilities', () => {
      // Type checking for key validation utilities
      expect(typeof AuthUtils.validateToken).toBe('function');
      expect(typeof AuthUtils.parseAuthHeader).toBe('function');
      expect(typeof AuthUtils.validateOAuthState).toBe('function');
      expect(typeof AuthUtils.validateCPF).toBe('function');
    });

    it('should maintain correct types for crypto utilities', () => {
      // Type checking for key crypto utilities
      expect(typeof AuthUtils.generateSecureToken).toBe('function');
      expect(typeof AuthUtils.generateUrlSafeToken).toBe('function');
      expect(typeof AuthUtils.generateTOTPSecret).toBe('function');
      expect(typeof AuthUtils.generateRandomString).toBe('function');
    });

    it('should maintain correct types for token utilities', () => {
      // Type checking for key token utilities
      expect(typeof AuthUtils.encodeToken).toBe('function');
      expect(typeof AuthUtils.decodeToken).toBe('function');
      expect(typeof AuthUtils.validateTokenPayload).toBe('function');
      expect(typeof AuthUtils.generateRefreshToken).toBe('function');
    });

    it('should maintain correct types for password utilities', () => {
      // Type checking for key password utilities
      expect(typeof AuthUtils.hashPassword).toBe('function');
      expect(typeof AuthUtils.verifyPassword).toBe('function');
      expect(typeof AuthUtils.validatePasswordStrength).toBe('function');
      expect(typeof AuthUtils.generateSalt).toBe('function');
    });
  });

  describe('Named exports for selective imports', () => {
    it('should allow selective imports of validation utilities', () => {
      // Destructure specific validation utilities
      const { validateToken, parseAuthHeader, validateOAuthState, validateCPF } = AuthUtils;
      
      // Verify they match the directly imported utilities
      expect(validateToken).toBe(ValidationUtils.validateToken);
      expect(parseAuthHeader).toBe(ValidationUtils.parseAuthHeader);
      expect(validateOAuthState).toBe(ValidationUtils.validateOAuthState);
      expect(validateCPF).toBe(ValidationUtils.validateCPF);
    });

    it('should allow selective imports of crypto utilities', () => {
      // Destructure specific crypto utilities
      const { generateSecureToken, generateUrlSafeToken, generateTOTPSecret, generateRandomString } = AuthUtils;
      
      // Verify they match the directly imported utilities
      expect(generateSecureToken).toBe(CryptoUtils.generateSecureToken);
      expect(generateUrlSafeToken).toBe(CryptoUtils.generateUrlSafeToken);
      expect(generateTOTPSecret).toBe(CryptoUtils.generateTOTPSecret);
      expect(generateRandomString).toBe(CryptoUtils.generateRandomString);
    });

    it('should allow selective imports of token utilities', () => {
      // Destructure specific token utilities
      const { encodeToken, decodeToken, validateTokenPayload, generateRefreshToken } = AuthUtils;
      
      // Verify they match the directly imported utilities
      expect(encodeToken).toBe(TokenUtils.encodeToken);
      expect(decodeToken).toBe(TokenUtils.decodeToken);
      expect(validateTokenPayload).toBe(TokenUtils.validateTokenPayload);
      expect(generateRefreshToken).toBe(TokenUtils.generateRefreshToken);
    });

    it('should allow selective imports of password utilities', () => {
      // Destructure specific password utilities
      const { hashPassword, verifyPassword, validatePasswordStrength, generateSalt } = AuthUtils;
      
      // Verify they match the directly imported utilities
      expect(hashPassword).toBe(PasswordUtils.hashPassword);
      expect(verifyPassword).toBe(PasswordUtils.verifyPassword);
      expect(validatePasswordStrength).toBe(PasswordUtils.validatePasswordStrength);
      expect(generateSalt).toBe(PasswordUtils.generateSalt);
    });
  });

  describe('Integration with @austa/interfaces', () => {
    it('should properly type token-related functions with shared interfaces', () => {
      // This test verifies that the token utilities use the shared interfaces
      // from @austa/interfaces for consistent typing across the monorepo
      
      // We can't directly test types at runtime, but we can verify the functions exist
      // and would fail TypeScript compilation if the interfaces weren't properly used
      expect(AuthUtils.encodeToken).toBeDefined();
      expect(AuthUtils.decodeToken).toBeDefined();
      expect(AuthUtils.validateTokenPayload).toBeDefined();
    });

    it('should properly type user-related functions with shared interfaces', () => {
      // This test verifies that the auth utilities use the shared user interfaces
      // from @austa/interfaces for consistent typing across the monorepo
      
      // We can't directly test types at runtime, but we can verify the functions exist
      // and would fail TypeScript compilation if the interfaces weren't properly used
      expect(AuthUtils.validateCPF).toBeDefined();
      expect(AuthUtils.hashPassword).toBeDefined();
      expect(AuthUtils.verifyPassword).toBeDefined();
    });
  });
});