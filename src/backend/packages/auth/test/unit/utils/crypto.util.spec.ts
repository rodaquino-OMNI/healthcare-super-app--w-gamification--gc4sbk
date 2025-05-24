import { describe, it, expect, jest } from '@jest/globals';
import * as crypto from 'crypto';
import {
  generateRandomBytes,
  generateRandomString,
  generateUrlSafeToken,
  generateSessionId,
  generateCsrfToken,
  generatePasswordResetToken,
  generateDeviceFingerprint,
  generateRefreshToken,
  generateTOTPSecret,
  generateVerificationCode,
  generateNonce,
  generateApiKey,
  RandomStringOptions,
  TOTPSecretOptions
} from '../../../src/utils/crypto.util';

// Mock crypto.randomBytes to ensure deterministic tests if needed
jest.mock('crypto', () => {
  const originalModule = jest.requireActual('crypto');
  return {
    ...originalModule,
    // We'll use the actual randomBytes for most tests but have the ability to mock it
    randomBytes: jest.fn().mockImplementation(originalModule.randomBytes),
  };
});

describe('Crypto Utilities', () => {
  describe('generateRandomBytes', () => {
    it('should generate a buffer of the specified size', () => {
      const size = 16;
      const result = generateRandomBytes(size);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(size);
    });

    it('should throw an error if crypto.randomBytes fails', () => {
      // Mock a failure in randomBytes
      const mockError = new Error('Not enough entropy');
      jest.spyOn(crypto, 'randomBytes').mockImplementationOnce(() => {
        throw mockError;
      });

      expect(() => generateRandomBytes(16)).toThrow('Failed to generate secure random bytes');
    });
  });

  describe('generateRandomString', () => {
    it('should generate a hex string of the specified length', () => {
      const options: RandomStringOptions = { length: 32 };
      const result = generateRandomString(options);
      
      expect(result).toMatch(/^[0-9a-f]{32}$/); // Hex string pattern
      expect(result.length).toBe(options.length);
    });

    it('should generate a base64 string of the specified length', () => {
      const options: RandomStringOptions = { length: 24, encoding: 'base64' };
      const result = generateRandomString(options);
      
      expect(result).toMatch(/^[A-Za-z0-9+/=]{1,24}$/); // Base64 pattern
      expect(result.length).toBe(options.length);
    });

    it('should generate a base64url string of the specified length', () => {
      const options: RandomStringOptions = { length: 24, encoding: 'base64url' };
      const result = generateRandomString(options);
      
      expect(result).toMatch(/^[A-Za-z0-9_-]{1,24}$/); // Base64url pattern
      expect(result.length).toBe(options.length);
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('should generate alphanumeric-only strings when requested', () => {
      const options: RandomStringOptions = { 
        length: 32, 
        encoding: 'base64', 
        alphanumericOnly: true 
      };
      const result = generateRandomString(options);
      
      expect(result).toMatch(/^[A-Za-z0-9]{32}$/); // Alphanumeric pattern
      expect(result.length).toBe(options.length);
    });

    it('should handle very short lengths correctly', () => {
      const options: RandomStringOptions = { length: 1 };
      const result = generateRandomString(options);
      
      expect(result.length).toBe(1);
    });

    it('should handle very long lengths correctly', () => {
      const options: RandomStringOptions = { length: 1024 };
      const result = generateRandomString(options);
      
      expect(result.length).toBe(1024);
    });
  });

  describe('generateUrlSafeToken', () => {
    it('should generate a URL-safe token of the default length', () => {
      const result = generateUrlSafeToken();
      
      expect(result).toMatch(/^[A-Za-z0-9_-]{32}$/); // URL-safe pattern
      expect(result.length).toBe(32); // Default length
    });

    it('should generate a URL-safe token of the specified length', () => {
      const length = 64;
      const result = generateUrlSafeToken(length);
      
      expect(result).toMatch(/^[A-Za-z0-9_-]{64}$/); // URL-safe pattern
      expect(result.length).toBe(length);
    });

    it('should not contain URL-unsafe characters', () => {
      const result = generateUrlSafeToken();
      
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });
  });

  describe('generateSessionId', () => {
    it('should generate a session ID of the default length', () => {
      const result = generateSessionId();
      
      expect(result).toMatch(/^[A-Za-z0-9_-]{64}$/); // URL-safe pattern
      expect(result.length).toBe(64); // Default length
    });

    it('should generate a session ID of the specified length', () => {
      const length = 128;
      const result = generateSessionId(length);
      
      expect(result.length).toBe(length);
    });
  });

  describe('generateCsrfToken', () => {
    it('should generate a CSRF token of the default length', () => {
      const result = generateCsrfToken();
      
      expect(result).toMatch(/^[0-9a-f]{32}$/); // Hex pattern
      expect(result.length).toBe(32); // Default length
    });

    it('should generate a CSRF token of the specified length', () => {
      const length = 48;
      const result = generateCsrfToken(length);
      
      expect(result).toMatch(/^[0-9a-f]{48}$/); // Hex pattern
      expect(result.length).toBe(length);
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a password reset token of the default length', () => {
      const result = generatePasswordResetToken();
      
      expect(result).toMatch(/^[A-Za-z0-9_-]{64}$/); // URL-safe pattern
      expect(result.length).toBe(64); // Default length
    });

    it('should generate a password reset token of the specified length', () => {
      const length = 96;
      const result = generatePasswordResetToken(length);
      
      expect(result.length).toBe(length);
    });
  });

  describe('generateDeviceFingerprint', () => {
    it('should generate a device fingerprint of the default length', () => {
      const result = generateDeviceFingerprint();
      
      expect(result).toMatch(/^[0-9a-f]{32}$/); // Hex pattern
      expect(result.length).toBe(32); // Default length
    });

    it('should generate a device fingerprint of the specified length', () => {
      const length = 48;
      const result = generateDeviceFingerprint(length);
      
      expect(result).toMatch(/^[0-9a-f]{48}$/); // Hex pattern
      expect(result.length).toBe(length);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token of the default length', () => {
      const result = generateRefreshToken();
      
      expect(result).toMatch(/^[A-Za-z0-9_-]{64}$/); // URL-safe pattern
      expect(result.length).toBe(64); // Default length
    });

    it('should generate a refresh token of the specified length', () => {
      const length = 96;
      const result = generateRefreshToken(length);
      
      expect(result.length).toBe(length);
    });
  });

  describe('generateTOTPSecret', () => {
    it('should generate a TOTP secret with default options', () => {
      const result = generateTOTPSecret();
      
      // Base32 pattern with padding
      expect(result).toMatch(/^[A-Z2-7]+=*$/); 
      
      // Default length is 20 bytes, which should result in 32 base32 chars plus padding
      expect(result.length).toBeGreaterThanOrEqual(32);
    });

    it('should generate a TOTP secret with specified length', () => {
      const options: TOTPSecretOptions = { length: 10 };
      const result = generateTOTPSecret(options);
      
      // 10 bytes should result in 16 base32 chars plus padding
      expect(result.length).toBeGreaterThanOrEqual(16);
    });

    it('should generate a TOTP secret without padding if specified', () => {
      const options: TOTPSecretOptions = { padding: false };
      const result = generateTOTPSecret(options);
      
      // Should not contain padding characters
      expect(result).not.toContain('=');
    });

    it('should generate valid base32 encoded strings', () => {
      const result = generateTOTPSecret();
      
      // Should only contain valid base32 characters
      expect(result.replace(/=/g, '')).toMatch(/^[A-Z2-7]+$/);
    });
  });

  describe('generateVerificationCode', () => {
    it('should generate a numeric verification code of the default length', () => {
      const result = generateVerificationCode();
      
      expect(result).toMatch(/^\d{6}$/); // Numeric pattern
      expect(result.length).toBe(6); // Default length
    });

    it('should generate a numeric verification code of the specified length', () => {
      const length = 8;
      const result = generateVerificationCode(length, true);
      
      expect(result).toMatch(/^\d{8}$/); // Numeric pattern
      expect(result.length).toBe(length);
    });

    it('should generate an alphanumeric verification code when specified', () => {
      const length = 8;
      const result = generateVerificationCode(length, false);
      
      expect(result).toMatch(/^[0-9a-f]{8}$/); // Alphanumeric pattern (hex)
      expect(result.length).toBe(length);
    });
  });

  describe('generateNonce', () => {
    it('should generate a nonce of the default length', () => {
      const result = generateNonce();
      
      expect(result).toMatch(/^[A-Za-z0-9_-]{16}$/); // URL-safe pattern
      expect(result.length).toBe(16); // Default length
    });

    it('should generate a nonce of the specified length', () => {
      const length = 24;
      const result = generateNonce(length);
      
      expect(result.length).toBe(length);
    });
  });

  describe('generateApiKey', () => {
    it('should generate an API key of the default length', () => {
      const result = generateApiKey();
      
      expect(result).toMatch(/^[A-Za-z0-9_-]{32}$/); // URL-safe pattern
      expect(result.length).toBe(32); // Default length
    });

    it('should generate an API key of the specified length', () => {
      const length = 48;
      const result = generateApiKey(length);
      
      expect(result.length).toBe(length);
    });

    it('should prepend the specified prefix to the API key', () => {
      const prefix = 'test';
      const length = 32;
      const result = generateApiKey(length, prefix);
      
      expect(result).toMatch(new RegExp(`^${prefix}_[A-Za-z0-9_-]{32}$`));
      expect(result.startsWith(`${prefix}_`)).toBe(true);
    });
  });

  describe('Randomness and Uniqueness Tests', () => {
    it('should generate unique values across multiple calls', () => {
      const count = 1000;
      const values = new Set<string>();
      
      for (let i = 0; i < count; i++) {
        values.add(generateRandomString({ length: 16 }));
      }
      
      // All values should be unique
      expect(values.size).toBe(count);
    });

    it('should have good distribution of characters', () => {
      // Generate a large sample of random bytes
      const sampleSize = 10000;
      const bytes = generateRandomBytes(sampleSize);
      
      // Count occurrences of each byte value
      const counts = new Array(256).fill(0);
      for (let i = 0; i < sampleSize; i++) {
        counts[bytes[i]]++;
      }
      
      // Calculate standard deviation
      const mean = sampleSize / 256;
      const squaredDiffs = counts.map(count => Math.pow(count - mean, 2));
      const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / 256;
      const stdDev = Math.sqrt(variance);
      
      // For truly random data, the standard deviation should be reasonable
      // relative to the mean (using 3-sigma rule for a 99.7% confidence interval)
      const expectedMaxStdDev = mean * 0.3; // 30% of mean as a reasonable threshold
      
      expect(stdDev).toBeLessThan(expectedMaxStdDev);
    });
  });
});