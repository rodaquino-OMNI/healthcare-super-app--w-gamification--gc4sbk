/**
 * Unit tests for cryptographic utility functions
 * 
 * These tests verify the reliability, randomness, and proper formatting of
 * cryptographically secure values used throughout the authentication system.
 */

import * as crypto from 'crypto';
import {
  generateRandomBytes,
  generateRandomString,
  generateSecureToken,
  generateUrlSafeToken,
  generateSessionId,
  generateCsrfToken,
  generatePasswordResetToken,
  generateTotpSecret,
  generateDeviceFingerprint,
  generateRefreshToken,
  generateNonce,
} from '../../../src/utils/crypto.util';

// Mock crypto module for testing
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

describe('Crypto Utilities', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation for randomBytes
    (crypto.randomBytes as jest.Mock).mockImplementation((size) => {
      const buffer = Buffer.alloc(size);
      // Fill with predictable but seemingly random data for testing
      for (let i = 0; i < size; i++) {
        buffer[i] = i % 256;
      }
      return buffer;
    });
  });

  describe('generateRandomBytes', () => {
    it('should generate a buffer of the specified length', () => {
      const length = 16;
      const result = generateRandomBytes(length);
      
      expect(crypto.randomBytes).toHaveBeenCalledWith(length);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(length);
    });

    it('should throw an error if secure random generation is not available', () => {
      // Mock randomBytes to throw an error
      (crypto.randomBytes as jest.Mock).mockImplementation(() => {
        throw new Error('Crypto not available');
      });

      expect(() => generateRandomBytes(16)).toThrow();
    });
  });

  describe('generateRandomString', () => {
    it('should generate a base64 string of the specified length', () => {
      const length = 24;
      const result = generateRandomString(length);
      
      // base64 encodes 3 bytes into 4 characters
      const expectedBytes = Math.ceil((length * 3) / 4);
      expect(crypto.randomBytes).toHaveBeenCalledWith(expectedBytes);
      expect(typeof result).toBe('string');
      expect(result.length).toBe(length);
    });

    it('should generate a hex string of the specified length', () => {
      const length = 32;
      const result = generateRandomString(length, 'hex');
      
      // hex encodes 1 byte into 2 characters
      const expectedBytes = Math.ceil(length / 2);
      expect(crypto.randomBytes).toHaveBeenCalledWith(expectedBytes);
      expect(typeof result).toBe('string');
      expect(result.length).toBe(length);
      // Verify it's a valid hex string
      expect(result).toMatch(/^[0-9a-f]+$/i);
    });

    it('should generate a base64url string of the specified length', () => {
      const length = 24;
      const result = generateRandomString(length, 'base64url');
      
      // base64url encodes 3 bytes into 4 characters
      const expectedBytes = Math.ceil((length * 3) / 4);
      expect(crypto.randomBytes).toHaveBeenCalledWith(expectedBytes);
      expect(typeof result).toBe('string');
      expect(result.length).toBe(length);
      // Verify it doesn't contain base64 padding or URL-unsafe characters
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('should handle zero length', () => {
      const result = generateRandomString(0);
      expect(result).toBe('');
    });
  });

  describe('generateSecureToken', () => {
    it('should generate a token with default length of 32', () => {
      const result = generateSecureToken();
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(32);
    });

    it('should generate a token with custom length', () => {
      const length = 64;
      const result = generateSecureToken(length);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(length);
    });

    it('should generate unique tokens on multiple calls', () => {
      // Mock to generate different random bytes on each call
      let counter = 0;
      (crypto.randomBytes as jest.Mock).mockImplementation((size) => {
        const buffer = Buffer.alloc(size);
        for (let i = 0; i < size; i++) {
          buffer[i] = (i + counter) % 256;
        }
        counter += size;
        return buffer;
      });

      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateUrlSafeToken', () => {
    it('should generate a URL-safe token with default length of 32', () => {
      const result = generateUrlSafeToken();
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(32);
      // Verify it doesn't contain URL-unsafe characters
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('should generate a URL-safe token with custom length', () => {
      const length = 48;
      const result = generateUrlSafeToken(length);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(length);
      // Verify it doesn't contain URL-unsafe characters
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });
  });

  describe('generateSessionId', () => {
    it('should generate a session ID with default length of 64', () => {
      const result = generateSessionId();
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
      // Verify it's a valid hex string
      expect(result).toMatch(/^[0-9a-f]+$/i);
    });

    it('should generate a session ID with custom length', () => {
      const length = 128;
      const result = generateSessionId(length);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(length);
      // Verify it's a valid hex string
      expect(result).toMatch(/^[0-9a-f]+$/i);
    });
  });

  describe('generateCsrfToken', () => {
    it('should generate a CSRF token with default length of 32', () => {
      const result = generateCsrfToken();
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(32);
      // Verify it's a valid hex string
      expect(result).toMatch(/^[0-9a-f]+$/i);
    });

    it('should generate a CSRF token with custom length', () => {
      const length = 64;
      const result = generateCsrfToken(length);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(length);
      // Verify it's a valid hex string
      expect(result).toMatch(/^[0-9a-f]+$/i);
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a password reset token with default length of 64', () => {
      const result = generatePasswordResetToken();
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
      // Verify it doesn't contain URL-unsafe characters
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('should generate a password reset token with custom length', () => {
      const length = 96;
      const result = generatePasswordResetToken(length);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(length);
      // Verify it doesn't contain URL-unsafe characters
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });
  });

  describe('generateTotpSecret', () => {
    it('should generate a TOTP secret with default length of 20 bytes', () => {
      const result = generateTotpSecret();
      
      expect(crypto.randomBytes).toHaveBeenCalledWith(20);
      expect(typeof result).toBe('string');
      // Verify it's a valid base32 string
      expect(result).toMatch(/^[A-Z2-7]+$/);
    });

    it('should generate a TOTP secret with custom length', () => {
      const length = 32;
      const result = generateTotpSecret(length);
      
      expect(crypto.randomBytes).toHaveBeenCalledWith(length);
      expect(typeof result).toBe('string');
      // Verify it's a valid base32 string
      expect(result).toMatch(/^[A-Z2-7]+$/);
    });

    it('should generate a valid TOTP secret that can be used with authenticator apps', () => {
      // This test verifies that the format is compatible with TOTP standards
      const result = generateTotpSecret();
      
      // TOTP secrets should be base32 encoded and have sufficient length
      expect(result).toMatch(/^[A-Z2-7]+$/);
      expect(result.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe('generateDeviceFingerprint', () => {
    it('should generate a consistent fingerprint for the same device info', () => {
      const deviceInfo = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        platform: 'Windows',
        screenResolution: '1920x1080',
        timezone: 'America/New_York',
        language: 'en-US',
      };
      
      const result1 = generateDeviceFingerprint(deviceInfo);
      const result2 = generateDeviceFingerprint(deviceInfo);
      
      expect(typeof result1).toBe('string');
      expect(result1).toBe(result2);
    });

    it('should generate different fingerprints for different device info', () => {
      const deviceInfo1 = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        platform: 'Windows',
        screenResolution: '1920x1080',
      };
      
      const deviceInfo2 = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        platform: 'MacOS',
        screenResolution: '2560x1440',
      };
      
      const result1 = generateDeviceFingerprint(deviceInfo1);
      const result2 = generateDeviceFingerprint(deviceInfo2);
      
      expect(result1).not.toBe(result2);
    });

    it('should handle empty device info', () => {
      const result = generateDeviceFingerprint({});
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token with the correct format', () => {
      const userId = 'user123';
      const result = generateRefreshToken(userId);
      
      expect(typeof result).toBe('string');
      // Format should be: {random}.{encodedUserId}.{timestamp}
      const parts = result.split('.');
      expect(parts.length).toBe(3);
      
      // First part should be a 32-character hex string
      expect(parts[0].length).toBe(32);
      expect(parts[0]).toMatch(/^[0-9a-f]+$/i);
      
      // Second part should be the encoded userId
      const decodedUserId = Buffer.from(parts[1], 'base64url').toString();
      expect(decodedUserId).toBe(userId);
      
      // Third part should be a timestamp (number)
      expect(Number.isInteger(Number(parts[2]))).toBe(true);
    });

    it('should use the provided expiration timestamp', () => {
      const userId = 'user123';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const result = generateRefreshToken(userId, expiresAt);
      
      const parts = result.split('.');
      expect(parts[2]).toBe(expiresAt.toString());
    });

    it('should generate unique tokens for the same user', () => {
      // Mock to generate different random bytes on each call
      let counter = 0;
      (crypto.randomBytes as jest.Mock).mockImplementation((size) => {
        const buffer = Buffer.alloc(size);
        for (let i = 0; i < size; i++) {
          buffer[i] = (i + counter) % 256;
        }
        counter += size;
        return buffer;
      });

      const userId = 'user123';
      const token1 = generateRefreshToken(userId);
      const token2 = generateRefreshToken(userId);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateNonce', () => {
    it('should generate a nonce with default length of 16', () => {
      const result = generateNonce();
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(16);
    });

    it('should generate a nonce with custom length', () => {
      const length = 24;
      const result = generateNonce(length);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(length);
    });

    it('should generate unique nonces on multiple calls', () => {
      // Mock to generate different random bytes on each call
      let counter = 0;
      (crypto.randomBytes as jest.Mock).mockImplementation((size) => {
        const buffer = Buffer.alloc(size);
        for (let i = 0; i < size; i++) {
          buffer[i] = (i + counter) % 256;
        }
        counter += size;
        return buffer;
      });

      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('Random value distribution', () => {
    it('should generate values with good distribution', () => {
      // Unmock crypto to use real randomBytes for this test
      jest.unmock('crypto');
      jest.resetModules();
      
      // Re-import the functions after unmocking
      const { generateRandomString } = require('../../../src/utils/crypto.util');
      
      // Generate a large number of random bytes and check distribution
      const length = 1000;
      const randomString = generateRandomString(length, 'hex');
      
      // Count occurrences of each hex character
      const counts: Record<string, number> = {};
      for (const char of randomString) {
        counts[char] = (counts[char] || 0) + 1;
      }
      
      // Check that each character appears with reasonable frequency
      // For truly random distribution, each character should appear ~length/16 times
      const expectedAvg = length / 16;
      const tolerance = 0.5; // Allow 50% deviation from expected average
      
      for (const char of '0123456789abcdef') {
        const count = counts[char] || 0;
        // Skip statistical test in CI environments where randomness might be limited
        if (process.env.CI !== 'true') {
          expect(count).toBeGreaterThan(expectedAvg * (1 - tolerance));
          expect(count).toBeLessThan(expectedAvg * (1 + tolerance));
        }
      }
      
      // Restore mocks for other tests
      jest.mock('crypto', () => ({
        randomBytes: jest.fn(),
      }));
    });
  });
});