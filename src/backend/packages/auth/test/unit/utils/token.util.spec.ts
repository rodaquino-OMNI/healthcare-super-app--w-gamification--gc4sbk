/**
 * @file Unit tests for JWT token utilities
 * @description Tests for encoding, decoding, and validating token payloads
 */

import { sign, verify, decode } from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';

import {
  encodeToken,
  decodeToken,
  validateToken,
  generateRefreshToken,
  hashRefreshToken,
  isTokenExpired,
  isTokenAboutToExpire,
  extractUserFromPayload,
  calculateExpirationTime,
  createTokenPayload,
  verifyRefreshToken,
  extractTokenFromHeader,
  TokenErrorType,
} from '../../../src/utils/token.util';
import { TokenPayload } from '../../../src/types';
import { JWT_CLAIMS, TOKEN_TYPES, AUTH_ERROR_CODES } from '../../../src/constants';

// Mock jsonwebtoken and crypto modules
jest.mock('jsonwebtoken');
jest.mock('crypto');

describe('Token Utilities', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('encodeToken', () => {
    it('should encode a payload into a JWT token with default options', () => {
      // Arrange
      const mockToken = 'mock.jwt.token';
      const payload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
      };
      const options = {
        secret: 'test-secret',
      };
      
      // Mock the sign function to return a predefined token
      (sign as jest.Mock).mockReturnValue(mockToken);
      
      // Act
      const result = encodeToken(payload, options);
      
      // Assert
      expect(result).toBe(mockToken);
      expect(sign).toHaveBeenCalledWith(payload, options.secret, {
        algorithm: 'HS256',
      });
    });

    it('should encode a payload with custom options', () => {
      // Arrange
      const mockToken = 'mock.jwt.token';
      const payload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
      };
      const options = {
        secret: 'test-secret',
        expiresIn: 3600,
        issuer: 'test-issuer',
        audience: 'test-audience',
        algorithm: 'HS512' as const,
      };
      
      // Mock the sign function
      (sign as jest.Mock).mockReturnValue(mockToken);
      
      // Act
      const result = encodeToken(payload, options);
      
      // Assert
      expect(result).toBe(mockToken);
      expect(sign).toHaveBeenCalledWith(payload, options.secret, {
        algorithm: options.algorithm,
        expiresIn: options.expiresIn,
        issuer: options.issuer,
        audience: options.audience,
      });
    });

    it('should throw an error when token encoding fails', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
      };
      const options = {
        secret: 'test-secret',
      };
      
      // Mock the sign function to throw an error
      const errorMessage = 'Invalid signing key';
      (sign as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      // Act & Assert
      expect(() => encodeToken(payload, options)).toThrow(`Failed to encode token: ${errorMessage}`);
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid JWT token', () => {
      // Arrange
      const token = 'valid.jwt.token';
      const decodedPayload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
        iat: 1617000000,
        exp: 1617003600,
      };
      
      // Mock the decode function
      (decode as jest.Mock).mockReturnValue(decodedPayload);
      
      // Act
      const result = decodeToken(token);
      
      // Assert
      expect(result).toEqual(decodedPayload);
      expect(decode).toHaveBeenCalledWith(token);
    });

    it('should return null for an invalid token', () => {
      // Arrange
      const token = 'invalid.token';
      
      // Mock the decode function to throw an error
      (decode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Act
      const result = decodeToken(token);
      
      // Assert
      expect(result).toBeNull();
      expect(decode).toHaveBeenCalledWith(token);
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token and return the payload', () => {
      // Arrange
      const token = 'valid.jwt.token';
      const secret = 'test-secret';
      const payload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
      };
      
      // Mock the verify function
      (verify as jest.Mock).mockReturnValue(payload);
      
      // Act
      const result = validateToken(token, secret);
      
      // Assert
      expect(result).toEqual({
        isValid: true,
        payload,
      });
      expect(verify).toHaveBeenCalledWith(token, secret, {
        ignoreExpiration: false,
      });
    });

    it('should validate a token with custom options', () => {
      // Arrange
      const token = 'valid.jwt.token';
      const secret = 'test-secret';
      const options = {
        ignoreExpiration: true,
        audience: 'test-audience',
        issuer: 'test-issuer',
      };
      const payload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
      };
      
      // Mock the verify function
      (verify as jest.Mock).mockReturnValue(payload);
      
      // Act
      const result = validateToken(token, secret, options);
      
      // Assert
      expect(result).toEqual({
        isValid: true,
        payload,
      });
      expect(verify).toHaveBeenCalledWith(token, secret, {
        ignoreExpiration: options.ignoreExpiration,
        audience: options.audience,
        issuer: options.issuer,
      });
    });

    it('should return invalid result for an expired token', () => {
      // Arrange
      const token = 'expired.jwt.token';
      const secret = 'test-secret';
      const error = new Error('Token expired') as any;
      error.name = 'TokenExpiredError';
      
      // Mock the verify function to throw an error
      (verify as jest.Mock).mockImplementation(() => {
        throw error;
      });
      
      // Act
      const result = validateToken(token, secret);
      
      // Assert
      expect(result).toEqual({
        isValid: false,
        error: 'Token has expired',
        errorCode: AUTH_ERROR_CODES.TOKEN_EXPIRED,
        errorType: TokenErrorType.EXPIRED,
      });
    });

    it('should return invalid result for a token with invalid signature', () => {
      // Arrange
      const token = 'invalid.signature.token';
      const secret = 'test-secret';
      const error = new Error('Invalid signature') as any;
      error.name = 'JsonWebTokenError';
      
      // Mock the verify function to throw an error
      (verify as jest.Mock).mockImplementation(() => {
        throw error;
      });
      
      // Act
      const result = validateToken(token, secret);
      
      // Assert
      expect(result).toEqual({
        isValid: false,
        error: 'Invalid token format or signature',
        errorCode: AUTH_ERROR_CODES.INVALID_TOKEN,
        errorType: TokenErrorType.INVALID,
      });
    });

    it('should return invalid result for a token that is not yet valid', () => {
      // Arrange
      const token = 'not.yet.valid.token';
      const secret = 'test-secret';
      const error = new Error('Token not active') as any;
      error.name = 'NotBeforeError';
      
      // Mock the verify function to throw an error
      (verify as jest.Mock).mockImplementation(() => {
        throw error;
      });
      
      // Act
      const result = validateToken(token, secret);
      
      // Assert
      expect(result).toEqual({
        isValid: false,
        error: 'Token not yet valid',
        errorCode: AUTH_ERROR_CODES.INVALID_TOKEN,
        errorType: TokenErrorType.NOT_BEFORE,
      });
    });

    it('should return invalid result for a token with invalid type', () => {
      // Arrange
      const token = 'invalid.type.token';
      const secret = 'test-secret';
      const payload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
        [JWT_CLAIMS.TOKEN_TYPE]: TOKEN_TYPES.REFRESH, // Invalid type for access token validation
      };
      
      // Mock the verify function
      (verify as jest.Mock).mockReturnValue(payload);
      
      // Act
      const result = validateToken(token, secret);
      
      // Assert
      expect(result).toEqual({
        isValid: false,
        error: 'Invalid token type',
        errorCode: AUTH_ERROR_CODES.INVALID_TOKEN,
        errorType: TokenErrorType.INVALID,
      });
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token with default length', () => {
      // Arrange
      const mockBytes = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
      const expectedToken = mockBytes.toString('hex');
      
      // Mock the randomBytes function
      (randomBytes as jest.Mock).mockReturnValue(mockBytes);
      
      // Act
      const result = generateRefreshToken();
      
      // Assert
      expect(result).toBe(expectedToken);
      expect(randomBytes).toHaveBeenCalledWith(48); // Default length
    });

    it('should generate a refresh token with custom length', () => {
      // Arrange
      const customLength = 32;
      const mockBytes = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
      const expectedToken = mockBytes.toString('hex');
      
      // Mock the randomBytes function
      (randomBytes as jest.Mock).mockReturnValue(mockBytes);
      
      // Act
      const result = generateRefreshToken(customLength);
      
      // Assert
      expect(result).toBe(expectedToken);
      expect(randomBytes).toHaveBeenCalledWith(customLength);
    });
  });

  describe('hashRefreshToken', () => {
    it('should hash a refresh token using SHA-256', () => {
      // Arrange
      const refreshToken = 'original-refresh-token';
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-token'),
      };
      
      // Mock the createHash function
      (createHash as jest.Mock).mockReturnValue(mockHash);
      
      // Act
      const result = hashRefreshToken(refreshToken);
      
      // Assert
      expect(result).toBe('hashed-token');
      expect(createHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith(refreshToken);
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
    });
  });

  describe('isTokenExpired', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed timestamp
      jest.spyOn(Date, 'now').mockReturnValue(1617000000 * 1000); // 1617000000 seconds since epoch
    });

    it('should return true for an expired token', () => {
      // Arrange
      const token = 'expired.token';
      const decodedPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
        exp: 1616999999, // Expired (before current time)
      };
      
      // Mock the decodeToken function
      jest.spyOn(global, 'decodeToken').mockReturnValue(decodedPayload as TokenPayload);
      
      // Act
      const result = isTokenExpired(token);
      
      // Assert
      expect(result).toBe(true);
    });

    it('should return false for a valid token', () => {
      // Arrange
      const token = 'valid.token';
      const decodedPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
        exp: 1617003600, // Not expired (after current time)
      };
      
      // Mock the decodeToken function
      jest.spyOn(global, 'decodeToken').mockReturnValue(decodedPayload as TokenPayload);
      
      // Act
      const result = isTokenExpired(token);
      
      // Assert
      expect(result).toBe(false);
    });

    it('should return true for a token without expiration', () => {
      // Arrange
      const token = 'no-expiration.token';
      const decodedPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
        // No exp field
      };
      
      // Mock the decodeToken function
      jest.spyOn(global, 'decodeToken').mockReturnValue(decodedPayload as TokenPayload);
      
      // Act
      const result = isTokenExpired(token);
      
      // Assert
      expect(result).toBe(true);
    });

    it('should return true for an invalid token', () => {
      // Arrange
      const token = 'invalid.token';
      
      // Mock the decodeToken function to return null
      jest.spyOn(global, 'decodeToken').mockReturnValue(null);
      
      // Act
      const result = isTokenExpired(token);
      
      // Assert
      expect(result).toBe(true);
    });
  });

  describe('isTokenAboutToExpire', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed timestamp
      jest.spyOn(Date, 'now').mockReturnValue(1617000000 * 1000); // 1617000000 seconds since epoch
    });

    it('should return true for a token about to expire', () => {
      // Arrange
      const token = 'about-to-expire.token';
      const decodedPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
        exp: 1617000200, // 200 seconds from now (within default threshold)
      };
      
      // Mock the decodeToken function
      jest.spyOn(global, 'decodeToken').mockReturnValue(decodedPayload as TokenPayload);
      
      // Act
      const result = isTokenAboutToExpire(token); // Default threshold is 300 seconds
      
      // Assert
      expect(result).toBe(true);
    });

    it('should return false for a token not about to expire', () => {
      // Arrange
      const token = 'not-about-to-expire.token';
      const decodedPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
        exp: 1617000600, // 600 seconds from now (outside default threshold)
      };
      
      // Mock the decodeToken function
      jest.spyOn(global, 'decodeToken').mockReturnValue(decodedPayload as TokenPayload);
      
      // Act
      const result = isTokenAboutToExpire(token); // Default threshold is 300 seconds
      
      // Assert
      expect(result).toBe(false);
    });

    it('should use custom threshold when provided', () => {
      // Arrange
      const token = 'custom-threshold.token';
      const customThreshold = 600; // 10 minutes
      const decodedPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
        exp: 1617000500, // 500 seconds from now (within custom threshold)
      };
      
      // Mock the decodeToken function
      jest.spyOn(global, 'decodeToken').mockReturnValue(decodedPayload as TokenPayload);
      
      // Act
      const result = isTokenAboutToExpire(token, customThreshold);
      
      // Assert
      expect(result).toBe(true);
    });

    it('should return true for a token without expiration', () => {
      // Arrange
      const token = 'no-expiration.token';
      const decodedPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
        // No exp field
      };
      
      // Mock the decodeToken function
      jest.spyOn(global, 'decodeToken').mockReturnValue(decodedPayload as TokenPayload);
      
      // Act
      const result = isTokenAboutToExpire(token);
      
      // Assert
      expect(result).toBe(true);
    });
  });

  describe('extractUserFromPayload', () => {
    it('should extract user information from a token payload', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user', 'admin'],
        permissions: ['read', 'write'],
        journeyClaims: { healthJourney: true },
        iat: 1617000000,
      };
      
      // Act
      const result = extractUserFromPayload(payload);
      
      // Assert
      expect(result).toEqual({
        id: 'user123',
        email: 'user@example.com',
        roles: ['user', 'admin'],
        permissions: ['read', 'write'],
        journeyAttributes: { healthJourney: true },
        lastAuthenticated: new Date(1617000000 * 1000),
      });
    });

    it('should handle missing optional fields', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user'],
        // No permissions, journeyClaims, or iat
      };
      
      // Act
      const result = extractUserFromPayload(payload);
      
      // Assert
      expect(result).toEqual({
        id: 'user123',
        email: 'user@example.com',
        roles: ['user'],
        // No permissions, journeyAttributes, or lastAuthenticated
      });
    });
  });

  describe('calculateExpirationTime', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed timestamp
      jest.spyOn(Date, 'now').mockReturnValue(1617000000 * 1000); // 1617000000 seconds since epoch
    });

    it('should calculate expiration time correctly', () => {
      // Arrange
      const expiresIn = 3600; // 1 hour
      
      // Act
      const result = calculateExpirationTime(expiresIn);
      
      // Assert
      expect(result).toBe(1617000000 + expiresIn);
    });
  });

  describe('createTokenPayload', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed timestamp
      jest.spyOn(Date, 'now').mockReturnValue(1617000000 * 1000); // 1617000000 seconds since epoch
    });

    it('should create a token payload with required fields', () => {
      // Arrange
      const userId = 'user123';
      const email = 'user@example.com';
      const roles = ['user'];
      
      // Act
      const result = createTokenPayload(userId, email, roles);
      
      // Assert
      expect(result).toEqual({
        sub: userId,
        email,
        roles,
        iat: 1617000000,
      });
    });

    it('should include optional fields when provided', () => {
      // Arrange
      const userId = 'user123';
      const email = 'user@example.com';
      const roles = ['user', 'admin'];
      const options = {
        permissions: ['read', 'write'],
        journeyClaims: { healthJourney: true },
        expiresIn: 3600,
        issuer: 'test-issuer',
        audience: 'test-audience',
      };
      
      // Act
      const result = createTokenPayload(userId, email, roles, options);
      
      // Assert
      expect(result).toEqual({
        sub: userId,
        email,
        roles,
        iat: 1617000000,
        permissions: options.permissions,
        journeyClaims: options.journeyClaims,
        exp: 1617000000 + options.expiresIn,
        iss: options.issuer,
        aud: options.audience,
      });
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return true when refresh token matches its hash', () => {
      // Arrange
      const refreshToken = 'original-refresh-token';
      const hashedToken = 'hashed-token';
      
      // Mock the hashRefreshToken function
      jest.spyOn(global, 'hashRefreshToken').mockReturnValue(hashedToken);
      
      // Act
      const result = verifyRefreshToken(refreshToken, hashedToken);
      
      // Assert
      expect(result).toBe(true);
      expect(hashRefreshToken).toHaveBeenCalledWith(refreshToken);
    });

    it('should return false when refresh token does not match its hash', () => {
      // Arrange
      const refreshToken = 'original-refresh-token';
      const hashedToken = 'stored-hashed-token';
      const computedHash = 'different-hashed-token';
      
      // Mock the hashRefreshToken function
      jest.spyOn(global, 'hashRefreshToken').mockReturnValue(computedHash);
      
      // Act
      const result = verifyRefreshToken(refreshToken, hashedToken);
      
      // Assert
      expect(result).toBe(false);
      expect(hashRefreshToken).toHaveBeenCalledWith(refreshToken);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from a valid Authorization header', () => {
      // Arrange
      const authHeader = 'Bearer valid-token';
      
      // Act
      const result = extractTokenFromHeader(authHeader);
      
      // Assert
      expect(result).toBe('valid-token');
    });

    it('should return null for a missing Authorization header', () => {
      // Arrange
      const authHeader = '';
      
      // Act
      const result = extractTokenFromHeader(authHeader);
      
      // Assert
      expect(result).toBeNull();
    });

    it('should return null for an invalid Authorization header format', () => {
      // Arrange
      const authHeader = 'InvalidFormat valid-token';
      
      // Act
      const result = extractTokenFromHeader(authHeader);
      
      // Assert
      expect(result).toBeNull();
    });

    it('should return null for an incomplete Authorization header', () => {
      // Arrange
      const authHeader = 'Bearer';
      
      // Act
      const result = extractTokenFromHeader(authHeader);
      
      // Assert
      expect(result).toBeNull();
    });
  });
});