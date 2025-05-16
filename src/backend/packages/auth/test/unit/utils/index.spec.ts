/**
 * @file Tests for the authentication utilities index barrel file
 * @description Verifies that all utility functions are properly exported and accessible
 */

import * as authUtils from '../../../src/utils';
import * as validationUtils from '../../../src/utils/validation.util';
import * as cryptoUtils from '../../../src/utils/crypto.util';
import * as tokenUtils from '../../../src/utils/token.util';
import * as passwordUtils from '../../../src/utils/password.util';

describe('Auth Utils Index Barrel', () => {
  describe('Validation Utilities', () => {
    it('should export all validation utilities', () => {
      // Check that all validation utilities are exported
      expect(authUtils.isValidCPF).toBeDefined();
      expect(authUtils.isValidTokenFormat).toBeDefined();
      expect(authUtils.extractTokenFromHeader).toBeDefined();
      expect(authUtils.isValidOAuthState).toBeDefined();
      expect(authUtils.generateOAuthState).toBeDefined();
      expect(authUtils.isTokenExpiredValidation).toBeDefined();
      expect(authUtils.isValidIssuer).toBeDefined();
      expect(authUtils.isValidAudience).toBeDefined();

      // Verify they are the same functions as in the original module
      expect(authUtils.isValidCPF).toBe(validationUtils.isValidCPF);
      expect(authUtils.isValidTokenFormat).toBe(validationUtils.isValidTokenFormat);
      expect(authUtils.extractTokenFromHeader).toBe(validationUtils.extractTokenFromHeader);
      expect(authUtils.isValidOAuthState).toBe(validationUtils.isValidOAuthState);
      expect(authUtils.generateOAuthState).toBe(validationUtils.generateOAuthState);
      expect(authUtils.isTokenExpiredValidation).toBe(validationUtils.isTokenExpired);
      expect(authUtils.isValidIssuer).toBe(validationUtils.isValidIssuer);
      expect(authUtils.isValidAudience).toBe(validationUtils.isValidAudience);
    });

    it('should correctly validate CPF numbers', () => {
      // Test that the exported function works correctly
      expect(authUtils.isValidCPF('529.982.247-25')).toBe(true);
      expect(authUtils.isValidCPF('111.111.111-11')).toBe(false);
    });

    it('should correctly validate token formats', () => {
      // Test that the exported function works correctly
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(authUtils.isValidTokenFormat(validToken)).toBe(true);
      expect(authUtils.isValidTokenFormat('invalid-token')).toBe(false);
    });
  });

  describe('Crypto Utilities', () => {
    it('should export all crypto utilities', () => {
      // Check that all crypto utilities are exported
      expect(authUtils.generateRandomBytes).toBeDefined();
      expect(authUtils.generateRandomString).toBeDefined();
      expect(authUtils.generateSecureToken).toBeDefined();
      expect(authUtils.generateUrlSafeToken).toBeDefined();
      expect(authUtils.generateSessionId).toBeDefined();
      expect(authUtils.generateCsrfToken).toBeDefined();
      expect(authUtils.generatePasswordResetToken).toBeDefined();
      expect(authUtils.generateTotpSecret).toBeDefined();
      expect(authUtils.generateDeviceFingerprint).toBeDefined();
      expect(authUtils.generateRefreshTokenCrypto).toBeDefined();
      expect(authUtils.generateNonce).toBeDefined();

      // Verify they are the same functions as in the original module
      expect(authUtils.generateRandomBytes).toBe(cryptoUtils.generateRandomBytes);
      expect(authUtils.generateRandomString).toBe(cryptoUtils.generateRandomString);
      expect(authUtils.generateSecureToken).toBe(cryptoUtils.generateSecureToken);
      expect(authUtils.generateUrlSafeToken).toBe(cryptoUtils.generateUrlSafeToken);
      expect(authUtils.generateSessionId).toBe(cryptoUtils.generateSessionId);
      expect(authUtils.generateCsrfToken).toBe(cryptoUtils.generateCsrfToken);
      expect(authUtils.generatePasswordResetToken).toBe(cryptoUtils.generatePasswordResetToken);
      expect(authUtils.generateTotpSecret).toBe(cryptoUtils.generateTotpSecret);
      expect(authUtils.generateDeviceFingerprint).toBe(cryptoUtils.generateDeviceFingerprint);
      expect(authUtils.generateRefreshTokenCrypto).toBe(cryptoUtils.generateRefreshToken);
      expect(authUtils.generateNonce).toBe(cryptoUtils.generateNonce);
    });

    it('should generate random strings of the correct length', () => {
      // Test that the exported function works correctly
      const randomString = authUtils.generateRandomString(16, 'hex');
      expect(randomString).toHaveLength(16);
      expect(typeof randomString).toBe('string');
    });
  });

  describe('Token Utilities', () => {
    it('should export all token utilities and types', () => {
      // Check that all token utilities are exported
      expect(authUtils.TokenErrorType).toBeDefined();
      expect(authUtils.encodeToken).toBeDefined();
      expect(authUtils.decodeToken).toBeDefined();
      expect(authUtils.validateToken).toBeDefined();
      expect(authUtils.generateRefreshToken).toBeDefined();
      expect(authUtils.hashRefreshToken).toBeDefined();
      expect(authUtils.isTokenExpired).toBeDefined();
      expect(authUtils.isTokenAboutToExpire).toBeDefined();
      expect(authUtils.extractUserFromPayload).toBeDefined();
      expect(authUtils.calculateExpirationTime).toBeDefined();
      expect(authUtils.createTokenPayload).toBeDefined();
      expect(authUtils.verifyRefreshToken).toBeDefined();
      expect(authUtils.extractTokenFromHeaderToken).toBeDefined();

      // Verify they are the same functions as in the original module
      expect(authUtils.TokenErrorType).toBe(tokenUtils.TokenErrorType);
      expect(authUtils.encodeToken).toBe(tokenUtils.encodeToken);
      expect(authUtils.decodeToken).toBe(tokenUtils.decodeToken);
      expect(authUtils.validateToken).toBe(tokenUtils.validateToken);
      expect(authUtils.generateRefreshToken).toBe(tokenUtils.generateRefreshToken);
      expect(authUtils.hashRefreshToken).toBe(tokenUtils.hashRefreshToken);
      expect(authUtils.isTokenExpired).toBe(tokenUtils.isTokenExpired);
      expect(authUtils.isTokenAboutToExpire).toBe(tokenUtils.isTokenAboutToExpire);
      expect(authUtils.extractUserFromPayload).toBe(tokenUtils.extractUserFromPayload);
      expect(authUtils.calculateExpirationTime).toBe(tokenUtils.calculateExpirationTime);
      expect(authUtils.createTokenPayload).toBe(tokenUtils.createTokenPayload);
      expect(authUtils.verifyRefreshToken).toBe(tokenUtils.verifyRefreshToken);
      expect(authUtils.extractTokenFromHeaderToken).toBe(tokenUtils.extractTokenFromHeader);
    });

    it('should correctly calculate expiration time', () => {
      // Test that the exported function works correctly
      const expiresIn = 3600; // 1 hour
      const expTime = authUtils.calculateExpirationTime(expiresIn);
      const now = Math.floor(Date.now() / 1000);
      
      // Expiration time should be approximately now + expiresIn
      expect(expTime).toBeGreaterThanOrEqual(now + expiresIn - 1); // Allow 1 second tolerance
      expect(expTime).toBeLessThanOrEqual(now + expiresIn + 1); // Allow 1 second tolerance
    });

    it('should handle token error types correctly', () => {
      // Test that the exported enum works correctly
      expect(authUtils.TokenErrorType.EXPIRED).toBe('TokenExpiredError');
      expect(authUtils.TokenErrorType.INVALID).toBe('JsonWebTokenError');
      expect(authUtils.TokenErrorType.NOT_BEFORE).toBe('NotBeforeError');
      expect(authUtils.TokenErrorType.MALFORMED).toBe('MalformedTokenError');
    });
  });

  describe('Password Utilities', () => {
    it('should export all password utilities', () => {
      // Check that all password utilities are exported
      expect(authUtils.generateSalt).toBeDefined();
      expect(authUtils.hashPassword).toBeDefined();
      expect(authUtils.verifyPassword).toBeDefined();
      expect(authUtils.validatePasswordStrength).toBeDefined();
      expect(authUtils.loadPasswordPolicyFromEnv).toBeDefined();
      expect(authUtils.passwordNeedsRehash).toBeDefined();
      expect(authUtils.generateSecurePassword).toBeDefined();
      expect(authUtils.isPasswordPreviouslyUsed).toBeDefined();

      // Verify they are the same functions as in the original module
      expect(authUtils.generateSalt).toBe(passwordUtils.generateSalt);
      expect(authUtils.hashPassword).toBe(passwordUtils.hashPassword);
      expect(authUtils.verifyPassword).toBe(passwordUtils.verifyPassword);
      expect(authUtils.validatePasswordStrength).toBe(passwordUtils.validatePasswordStrength);
      expect(authUtils.loadPasswordPolicyFromEnv).toBe(passwordUtils.loadPasswordPolicyFromEnv);
      expect(authUtils.passwordNeedsRehash).toBe(passwordUtils.passwordNeedsRehash);
      expect(authUtils.generateSecurePassword).toBe(passwordUtils.generateSecurePassword);
      expect(authUtils.isPasswordPreviouslyUsed).toBe(passwordUtils.isPasswordPreviouslyUsed);
    });

    it('should validate password strength correctly', () => {
      // Test that the exported function works correctly
      const strongPassword = 'StrongP@ssw0rd';
      const weakPassword = 'weak';
      
      const strongResult = authUtils.validatePasswordStrength(strongPassword);
      const weakResult = authUtils.validatePasswordStrength(weakPassword);
      
      expect(strongResult.isValid).toBe(true);
      expect(weakResult.isValid).toBe(false);
      expect(weakResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Named Exports', () => {
    it('should support selective imports', () => {
      // Test that named imports work correctly
      const { isValidCPF, generateSecureToken, hashPassword, extractToken } = authUtils;
      
      expect(isValidCPF).toBe(validationUtils.isValidCPF);
      expect(generateSecureToken).toBe(cryptoUtils.generateSecureToken);
      expect(hashPassword).toBe(passwordUtils.hashPassword);
      expect(extractToken).toBeDefined();
    });
    
    it('should provide convenience functions', () => {
      // Test the extractToken convenience function
      const validHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const invalidHeader = 'NotBearer token';
      
      expect(authUtils.extractToken(validHeader)).not.toBeNull();
      expect(authUtils.extractToken(invalidHeader)).toBeNull();
    });

    it('should maintain type information for interfaces', () => {
      // Test that type information is preserved
      type ValidationResult = authUtils.PasswordValidationResult;
      type TokenResult = authUtils.TokenValidationResult;
      
      // This is a compile-time check, so we just need to verify the type exists
      const validationResult: ValidationResult = {
        isValid: true,
        errors: []
      };
      
      const tokenResult: TokenResult = {
        isValid: true,
        payload: {
          sub: 'user123',
          email: 'user@example.com',
          roles: ['user'],
          iat: 1234567890
        }
      };
      
      expect(validationResult.isValid).toBe(true);
      expect(tokenResult.isValid).toBe(true);
    });
  });
});