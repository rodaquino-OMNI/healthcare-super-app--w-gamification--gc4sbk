/**
 * @file Token Utilities Unit Tests
 * 
 * Comprehensive test suite for JWT token utilities that handle encoding, decoding, and validation
 * of token payloads. These tests ensure that tokens are properly signed, can be correctly decoded,
 * contain valid payloads, and support refresh token functionality.
 */

import * as jwt from 'jsonwebtoken';
import {
  encodeToken,
  decodeToken,
  verifyToken,
  validateTokenPayload,
  isTokenExpired,
  isTokenInGracePeriod,
  generateTokenId,
  hashToken,
  extractTokenFromHeader,
  createTokenPair,
  rotateRefreshToken,
  TokenError
} from '../../../src/utils/token.util';
import { TokenPayload, TokenType } from '../../../src/types';
import { ERROR_CODES } from '../../../src/constants';

// Mock jwt library
jest.mock('jsonwebtoken');

describe('Token Utilities', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(global.Math, 'random').mockReturnValue(0.123456789);
    jest.spyOn(Date, 'now').mockReturnValue(1609459200000); // 2021-01-01T00:00:00.000Z
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('encodeToken', () => {
    it('should encode a token with default options', () => {
      // Arrange
      const payload: Partial<TokenPayload> = {
        sub: 'user123',
        email: 'user@example.com',
        type: TokenType.ACCESS
      };
      const options = { secret: 'test-secret' };
      const expectedToken = 'encoded.jwt.token';
      
      // Mock jwt.sign to return a fixed token
      (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

      // Act
      const token = encodeToken(payload, options);

      // Assert
      expect(token).toBe(expectedToken);
      expect(jwt.sign).toHaveBeenCalledWith(payload, options.secret, {
        algorithm: 'HS256',
        expiresIn: undefined,
        issuer: undefined,
        audience: undefined,
        notBefore: undefined,
        jwtid: undefined,
        subject: undefined,
        header: undefined
      });
    });

    it('should encode a token with custom options', () => {
      // Arrange
      const payload: Partial<TokenPayload> = {
        sub: 'user123',
        email: 'user@example.com',
        type: TokenType.ACCESS,
        roles: ['user']
      };
      const options = {
        secret: 'test-secret',
        expiresIn: 3600,
        issuer: 'austa-app',
        audience: 'mobile-app',
        algorithm: 'HS512' as jwt.Algorithm,
        notBefore: 0,
        jwtid: 'token-id-123',
        subject: 'user123',
        headers: { kid: 'key-1' }
      };
      const expectedToken = 'encoded.jwt.token';
      
      // Mock jwt.sign to return a fixed token
      (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

      // Act
      const token = encodeToken(payload, options);

      // Assert
      expect(token).toBe(expectedToken);
      expect(jwt.sign).toHaveBeenCalledWith(payload, options.secret, {
        algorithm: options.algorithm,
        expiresIn: options.expiresIn,
        issuer: options.issuer,
        audience: options.audience,
        notBefore: options.notBefore,
        jwtid: options.jwtid,
        subject: options.subject,
        header: options.headers
      });
    });

    it('should throw TokenError when encoding fails', () => {
      // Arrange
      const payload: Partial<TokenPayload> = {
        sub: 'user123',
        type: TokenType.ACCESS
      };
      const options = { secret: 'test-secret' };
      
      // Mock jwt.sign to throw an error
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw new Error('Encoding failed');
      });

      // Act & Assert
      expect(() => encodeToken(payload, options)).toThrow(TokenError);
      expect(() => encodeToken(payload, options)).toThrow('Failed to encode token: Encoding failed');
      const error = (() => {
        try {
          encodeToken(payload, options);
          return null;
        } catch (e) {
          return e;
        }
      })();
      expect(error).toBeInstanceOf(TokenError);
      expect(error.code).toBe(ERROR_CODES.INVALID_TOKEN);
    });
  });

  describe('decodeToken', () => {
    it('should decode a token with default options', () => {
      // Arrange
      const token = 'encoded.jwt.token';
      const decodedPayload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609462800,
        roles: ['user']
      };
      
      // Mock jwt.decode to return a fixed payload
      (jwt.decode as jest.Mock).mockReturnValue(decodedPayload);

      // Act
      const result = decodeToken(token);

      // Assert
      expect(result).toEqual(decodedPayload);
      expect(jwt.decode).toHaveBeenCalledWith(token, {
        complete: false,
        json: true
      });
    });

    it('should decode a token with custom options', () => {
      // Arrange
      const token = 'encoded.jwt.token';
      const decodedPayload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609462800,
        roles: ['user']
      };
      const options = { complete: true, json: false };
      
      // Mock jwt.decode to return a fixed payload
      (jwt.decode as jest.Mock).mockReturnValue(decodedPayload);

      // Act
      const result = decodeToken(token, options);

      // Assert
      expect(result).toEqual(decodedPayload);
      expect(jwt.decode).toHaveBeenCalledWith(token, {
        complete: options.complete,
        json: options.json
      });
    });

    it('should throw TokenError when decoding fails', () => {
      // Arrange
      const token = 'invalid.jwt.token';
      
      // Mock jwt.decode to throw an error
      (jwt.decode as jest.Mock).mockReturnValue(null);

      // Act & Assert
      expect(() => decodeToken(token)).toThrow(TokenError);
      expect(() => decodeToken(token)).toThrow('Failed to decode token: Invalid token');
      const error = (() => {
        try {
          decodeToken(token);
          return null;
        } catch (e) {
          return e;
        }
      })();
      expect(error).toBeInstanceOf(TokenError);
      expect(error.code).toBe(ERROR_CODES.INVALID_TOKEN);
    });

    it('should throw TokenError when jwt.decode throws an error', () => {
      // Arrange
      const token = 'invalid.jwt.token';
      
      // Mock jwt.decode to throw an error
      (jwt.decode as jest.Mock).mockImplementation(() => {
        throw new Error('Decoding failed');
      });

      // Act & Assert
      expect(() => decodeToken(token)).toThrow(TokenError);
      expect(() => decodeToken(token)).toThrow('Failed to decode token: Decoding failed');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      // Arrange
      const token = 'valid.jwt.token';
      const verifiedPayload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609462800,
        roles: ['user']
      };
      const options = { secret: 'test-secret' };
      
      // Mock jwt.verify to return a fixed payload
      (jwt.verify as jest.Mock).mockReturnValue(verifiedPayload);

      // Act
      const result = verifyToken(token, options);

      // Assert
      expect(result).toEqual(verifiedPayload);
      expect(jwt.verify).toHaveBeenCalledWith(token, options.secret, {
        algorithms: ['HS256'],
        issuer: undefined,
        audience: undefined,
        clockTolerance: undefined,
        maxAge: undefined,
        subject: undefined,
        jwtid: undefined,
        ignoreExpiration: false,
        ignoreNotBefore: false
      });
    });

    it('should verify a token with custom options', () => {
      // Arrange
      const token = 'valid.jwt.token';
      const verifiedPayload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609462800,
        roles: ['user']
      };
      const options = {
        secret: 'test-secret',
        issuer: 'austa-app',
        audience: 'mobile-app',
        algorithms: ['HS512'] as jwt.Algorithm[],
        clockTolerance: 30,
        maxAge: 3600,
        subject: 'user123',
        jwtid: 'token-id-123',
        ignoreExpiration: true,
        ignoreNotBefore: true
      };
      
      // Mock jwt.verify to return a fixed payload
      (jwt.verify as jest.Mock).mockReturnValue(verifiedPayload);

      // Act
      const result = verifyToken(token, options);

      // Assert
      expect(result).toEqual(verifiedPayload);
      expect(jwt.verify).toHaveBeenCalledWith(token, options.secret, {
        algorithms: options.algorithms,
        issuer: options.issuer,
        audience: options.audience,
        clockTolerance: options.clockTolerance,
        maxAge: options.maxAge,
        subject: options.subject,
        jwtid: options.jwtid,
        ignoreExpiration: options.ignoreExpiration,
        ignoreNotBefore: options.ignoreNotBefore
      });
    });

    it('should throw TokenError when token is expired', () => {
      // Arrange
      const token = 'expired.jwt.token';
      const options = { secret: 'test-secret' };
      const tokenExpiredError = new Error('Token expired');
      tokenExpiredError.name = 'TokenExpiredError';
      
      // Mock jwt.verify to throw a TokenExpiredError
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw tokenExpiredError;
      });

      // Act & Assert
      expect(() => verifyToken(token, options)).toThrow(TokenError);
      expect(() => verifyToken(token, options)).toThrow('Token expired: Token expired');
      const error = (() => {
        try {
          verifyToken(token, options);
          return null;
        } catch (e) {
          return e;
        }
      })();
      expect(error).toBeInstanceOf(TokenError);
      expect(error.code).toBe(ERROR_CODES.TOKEN_EXPIRED);
    });

    it('should throw TokenError when token is invalid', () => {
      // Arrange
      const token = 'invalid.jwt.token';
      const options = { secret: 'test-secret' };
      const jsonWebTokenError = new Error('Invalid signature');
      jsonWebTokenError.name = 'JsonWebTokenError';
      
      // Mock jwt.verify to throw a JsonWebTokenError
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw jsonWebTokenError;
      });

      // Act & Assert
      expect(() => verifyToken(token, options)).toThrow(TokenError);
      expect(() => verifyToken(token, options)).toThrow('Invalid token: Invalid signature');
      const error = (() => {
        try {
          verifyToken(token, options);
          return null;
        } catch (e) {
          return e;
        }
      })();
      expect(error).toBeInstanceOf(TokenError);
      expect(error.code).toBe(ERROR_CODES.INVALID_TOKEN);
    });

    it('should throw TokenError when token is not yet active', () => {
      // Arrange
      const token = 'not-active.jwt.token';
      const options = { secret: 'test-secret' };
      const notBeforeError = new Error('Token not active');
      notBeforeError.name = 'NotBeforeError';
      
      // Mock jwt.verify to throw a NotBeforeError
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw notBeforeError;
      });

      // Act & Assert
      expect(() => verifyToken(token, options)).toThrow(TokenError);
      expect(() => verifyToken(token, options)).toThrow('Token not active: Token not active');
      const error = (() => {
        try {
          verifyToken(token, options);
          return null;
        } catch (e) {
          return e;
        }
      })();
      expect(error).toBeInstanceOf(TokenError);
      expect(error.code).toBe(ERROR_CODES.INVALID_TOKEN);
    });

    it('should throw TokenError for other verification errors', () => {
      // Arrange
      const token = 'problematic.jwt.token';
      const options = { secret: 'test-secret' };
      
      // Mock jwt.verify to throw a generic error
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Verification failed');
      });

      // Act & Assert
      expect(() => verifyToken(token, options)).toThrow(TokenError);
      expect(() => verifyToken(token, options)).toThrow('Failed to verify token: Verification failed');
      const error = (() => {
        try {
          verifyToken(token, options);
          return null;
        } catch (e) {
          return e;
        }
      })();
      expect(error).toBeInstanceOf(TokenError);
      expect(error.code).toBe(ERROR_CODES.INVALID_TOKEN);
    });
  });

  describe('validateTokenPayload', () => {
    it('should validate a valid payload with minimal claims', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609462800,
        roles: []
      };
      const expectedClaims = {};

      // Act
      const result = validateTokenPayload(payload, expectedClaims);

      // Assert
      expect(result).toBe(true);
    });

    it('should validate a valid payload with all expected claims', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609462800,
        iss: 'austa-app',
        aud: 'mobile-app',
        jti: 'token-id-123',
        nbf: 1609459100,
        roles: ['user'],
        permissions: { 'health': ['read'] }
      };
      const expectedClaims = {
        type: TokenType.ACCESS,
        iss: 'austa-app',
        aud: 'mobile-app',
        sub: 'user123'
      };

      // Act
      const result = validateTokenPayload(payload, expectedClaims);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw TokenError when payload is not an object', () => {
      // Arrange
      const payload = null as unknown as TokenPayload;
      const expectedClaims = {};

      // Act & Assert
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow(TokenError);
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow('Payload validation failed: Invalid payload: not an object');
    });

    it('should throw TokenError when required subject claim is missing', () => {
      // Arrange
      const payload = {
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609462800,
        roles: []
      } as unknown as TokenPayload;
      const expectedClaims = {};

      // Act & Assert
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow(TokenError);
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow('Payload validation failed: Missing required claim: sub');
    });

    it('should throw TokenError when required type claim is missing', () => {
      // Arrange
      const payload = {
        sub: 'user123',
        iat: 1609459200,
        exp: 1609462800,
        roles: []
      } as unknown as TokenPayload;
      const expectedClaims = {};

      // Act & Assert
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow(TokenError);
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow('Payload validation failed: Missing required claim: type');
    });

    it('should throw TokenError when token type does not match expected type', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609462800,
        roles: []
      };
      const expectedClaims = { type: TokenType.REFRESH };

      // Act & Assert
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow(TokenError);
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow(`Payload validation failed: Invalid token type: expected ${TokenType.REFRESH}, got ${TokenType.ACCESS}`);
    });

    it('should throw TokenError when token is expired', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609459100, // Expired (before current time)
        roles: []
      };
      const expectedClaims = {};

      // Act & Assert
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow(TokenError);
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow('Payload validation failed: Token expired');
    });

    it('should throw TokenError when token is not yet active', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609462800,
        nbf: 1609459300, // Not yet active (after current time)
        roles: []
      };
      const expectedClaims = {};

      // Act & Assert
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow(TokenError);
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow('Payload validation failed: Token not active yet');
    });

    it('should throw TokenError when issuer does not match expected issuer', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609462800,
        iss: 'austa-app',
        roles: []
      };
      const expectedClaims = { iss: 'different-issuer' };

      // Act & Assert
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow(TokenError);
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow('Payload validation failed: Invalid issuer: expected different-issuer, got austa-app');
    });

    it('should throw TokenError when audience does not match expected audience', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609462800,
        aud: 'mobile-app',
        roles: []
      };
      const expectedClaims = { aud: 'web-app' };

      // Act & Assert
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow(TokenError);
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow('Payload validation failed: Invalid audience: expected one of [web-app], got [mobile-app]');
    });

    it('should validate when audience is in list of expected audiences', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609462800,
        aud: 'mobile-app',
        roles: []
      };
      const expectedClaims = { aud: ['web-app', 'mobile-app', 'api'] };

      // Act
      const result = validateTokenPayload(payload, expectedClaims);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw TokenError when subject does not match expected subject', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609462800,
        roles: []
      };
      const expectedClaims = { sub: 'different-user' };

      // Act & Assert
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow(TokenError);
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow('Payload validation failed: Invalid subject: expected different-user, got user123');
    });

    it('should throw TokenError when JWT ID does not match expected JWT ID', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459200,
        exp: 1609462800,
        jti: 'token-id-123',
        roles: []
      };
      const expectedClaims = { jti: 'different-token-id' };

      // Act & Assert
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow(TokenError);
      expect(() => validateTokenPayload(payload, expectedClaims)).toThrow('Payload validation failed: Invalid JWT ID: expected different-token-id, got token-id-123');
    });
  });

  describe('isTokenExpired', () => {
    it('should return true when token is expired', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459100,
        exp: 1609459150, // Expired (before current time)
        roles: []
      };

      // Act
      const result = isTokenExpired(payload);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when token is not expired', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459100,
        exp: 1609459250, // Not expired (after current time)
        roles: []
      };

      // Act
      const result = isTokenExpired(payload);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when token has no expiration', () => {
      // Arrange
      const payload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459100,
        roles: []
      } as TokenPayload;

      // Act
      const result = isTokenExpired(payload);

      // Assert
      expect(result).toBe(false);
    });

    it('should consider grace period when checking expiration', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459100,
        exp: 1609459150, // Expired (before current time)
        roles: []
      };
      const graceSeconds = 100; // Grace period longer than expiration

      // Act
      const result = isTokenExpired(payload, graceSeconds);

      // Assert
      expect(result).toBe(false); // Not expired with grace period
    });
  });

  describe('isTokenInGracePeriod', () => {
    it('should return true when token is in grace period', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459100,
        exp: 1609459150, // Expired (before current time)
        roles: []
      };
      const gracePeriodSeconds = 100; // Grace period covers current time

      // Act
      const result = isTokenInGracePeriod(payload, gracePeriodSeconds);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when token is not expired', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459100,
        exp: 1609459250, // Not expired (after current time)
        roles: []
      };
      const gracePeriodSeconds = 100;

      // Act
      const result = isTokenInGracePeriod(payload, gracePeriodSeconds);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when token is expired beyond grace period', () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459000,
        exp: 1609459100, // Expired long ago
        roles: []
      };
      const gracePeriodSeconds = 50; // Grace period doesn't cover current time

      // Act
      const result = isTokenInGracePeriod(payload, gracePeriodSeconds);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when token has no expiration', () => {
      // Arrange
      const payload = {
        sub: 'user123',
        type: TokenType.ACCESS,
        iat: 1609459100,
        roles: []
      } as TokenPayload;
      const gracePeriodSeconds = 100;

      // Act
      const result = isTokenInGracePeriod(payload, gracePeriodSeconds);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('generateTokenId', () => {
    it('should generate a unique token ID', () => {
      // Act
      const tokenId = generateTokenId();

      // Assert
      expect(tokenId).toBe('ixiyji-4fzzzz9yvi');
      expect(typeof tokenId).toBe('string');
      expect(tokenId.length).toBeGreaterThan(10);
      expect(tokenId).toContain('-'); // Should contain a separator
    });

    it('should generate different token IDs on subsequent calls', () => {
      // Arrange
      jest.spyOn(global.Math, 'random')
        .mockReturnValueOnce(0.123456789)
        .mockReturnValueOnce(0.987654321);
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1609459200000)
        .mockReturnValueOnce(1609459201000);

      // Act
      const tokenId1 = generateTokenId();
      const tokenId2 = generateTokenId();

      // Assert
      expect(tokenId1).not.toBe(tokenId2);
    });
  });

  describe('hashToken', () => {
    it('should hash a token', () => {
      // Arrange
      const token = 'my.jwt.token';

      // Act
      const hashedToken = hashToken(token);

      // Assert
      expect(hashedToken).toBe('hashed_my.jwt.tok');
      expect(hashedToken).toContain('hashed_');
      expect(hashedToken.length).toBeGreaterThan(token.length / 2);
    });

    it('should generate different hashes for different tokens', () => {
      // Arrange
      const token1 = 'first.jwt.token';
      const token2 = 'second.jwt.token';

      // Act
      const hashedToken1 = hashToken(token1);
      const hashedToken2 = hashToken(token2);

      // Assert
      expect(hashedToken1).not.toBe(hashedToken2);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid authorization header', () => {
      // Arrange
      const authHeader = 'Bearer my.jwt.token';

      // Act
      const token = extractTokenFromHeader(authHeader);

      // Assert
      expect(token).toBe('my.jwt.token');
    });

    it('should return null for missing authorization header', () => {
      // Act
      const token = extractTokenFromHeader(undefined);

      // Assert
      expect(token).toBeNull();
    });

    it('should return null for invalid authorization header format', () => {
      // Arrange
      const authHeader = 'InvalidFormat my.jwt.token';

      // Act
      const token = extractTokenFromHeader(authHeader);

      // Assert
      expect(token).toBeNull();
    });

    it('should return null for authorization header with wrong number of parts', () => {
      // Arrange
      const authHeader = 'Bearer my.jwt.token extra';

      // Act
      const token = extractTokenFromHeader(authHeader);

      // Assert
      expect(token).toBeNull();
    });
  });

  describe('createTokenPair', () => {
    it('should create access and refresh token pair', () => {
      // Arrange
      const payload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user']
      };
      const options = {
        secret: 'test-secret',
        expiresIn: 3600, // 1 hour for access token
        issuer: 'austa-app',
        audience: 'mobile-app'
      };
      const accessToken = 'access.jwt.token';
      const refreshToken = 'refresh.jwt.token';
      
      // Mock encodeToken to return fixed tokens
      jest.spyOn(global, 'encodeToken')
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);

      // Act
      const result = createTokenPair(payload, options);

      // Assert
      expect(result).toEqual({ accessToken, refreshToken });
      expect(encodeToken).toHaveBeenCalledTimes(2);
      
      // Check access token payload
      expect(encodeToken).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          type: TokenType.ACCESS,
          iat: Math.floor(Date.now() / 1000)
        }),
        options
      );
      
      // Check refresh token payload
      expect(encodeToken).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          type: TokenType.REFRESH,
          iat: Math.floor(Date.now() / 1000),
          jti: expect.any(String)
        }),
        expect.objectContaining({
          ...options,
          expiresIn: options.expiresIn * 7 // 7 times longer than access token
        })
      );
    });

    it('should use default refresh token expiration when not specified', () => {
      // Arrange
      const payload = {
        sub: 'user123',
        email: 'user@example.com',
        roles: ['user']
      };
      const options = {
        secret: 'test-secret',
        issuer: 'austa-app',
        audience: 'mobile-app'
      };
      const accessToken = 'access.jwt.token';
      const refreshToken = 'refresh.jwt.token';
      
      // Mock encodeToken to return fixed tokens
      jest.spyOn(global, 'encodeToken')
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);

      // Act
      const result = createTokenPair(payload, options);

      // Assert
      expect(result).toEqual({ accessToken, refreshToken });
      
      // Check refresh token options
      expect(encodeToken).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ...options,
          expiresIn: 604800 // 7 days default
        })
      );
    });
  });

  describe('rotateRefreshToken', () => {
    it('should rotate a valid refresh token', () => {
      // Arrange
      const oldRefreshToken = 'old.refresh.token';
      const verifiedPayload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        type: TokenType.REFRESH,
        iat: 1609459100,
        exp: 1609462800,
        jti: 'old-token-id',
        roles: ['user'],
        permissions: { 'health': ['read'] }
      };
      const options = {
        secret: 'test-secret',
        expiresIn: 3600,
        issuer: 'austa-app',
        audience: 'mobile-app'
      };
      const accessToken = 'new.access.token';
      const refreshToken = 'new.refresh.token';
      
      // Mock verifyToken to return a valid payload
      jest.spyOn(global, 'verifyToken').mockReturnValue(verifiedPayload);
      
      // Mock createTokenPair to return new tokens
      jest.spyOn(global, 'createTokenPair').mockReturnValue({ accessToken, refreshToken });

      // Act
      const result = rotateRefreshToken(oldRefreshToken, options);

      // Assert
      expect(result).toEqual({
        accessToken,
        refreshToken,
        oldTokenId: verifiedPayload.jti
      });
      expect(verifyToken).toHaveBeenCalledWith(oldRefreshToken, options);
      expect(createTokenPair).toHaveBeenCalledWith(
        {
          sub: verifiedPayload.sub,
          email: verifiedPayload.email,
          roles: verifiedPayload.roles,
          permissions: verifiedPayload.permissions,
          iss: verifiedPayload.iss,
          aud: verifiedPayload.aud
        },
        options
      );
    });

    it('should generate a token ID if not present in the payload', () => {
      // Arrange
      const oldRefreshToken = 'old.refresh.token';
      const verifiedPayload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        type: TokenType.REFRESH,
        iat: 1609459100,
        exp: 1609462800,
        roles: ['user']
      };
      const options = {
        secret: 'test-secret',
        expiresIn: 3600
      };
      const accessToken = 'new.access.token';
      const refreshToken = 'new.refresh.token';
      const generatedTokenId = 'generated-token-id';
      
      // Mock verifyToken to return a valid payload
      jest.spyOn(global, 'verifyToken').mockReturnValue(verifiedPayload);
      
      // Mock createTokenPair to return new tokens
      jest.spyOn(global, 'createTokenPair').mockReturnValue({ accessToken, refreshToken });
      
      // Mock generateTokenId to return a fixed ID
      jest.spyOn(global, 'generateTokenId').mockReturnValue(generatedTokenId);

      // Act
      const result = rotateRefreshToken(oldRefreshToken, options);

      // Assert
      expect(result).toEqual({
        accessToken,
        refreshToken,
        oldTokenId: generatedTokenId
      });
      expect(generateTokenId).toHaveBeenCalled();
    });

    it('should throw TokenError when token is not a refresh token', () => {
      // Arrange
      const oldRefreshToken = 'old.access.token';
      const verifiedPayload: TokenPayload = {
        sub: 'user123',
        email: 'user@example.com',
        type: TokenType.ACCESS, // Wrong token type
        iat: 1609459100,
        exp: 1609462800,
        roles: ['user']
      };
      const options = {
        secret: 'test-secret',
        expiresIn: 3600
      };
      
      // Mock verifyToken to return a valid payload with wrong type
      jest.spyOn(global, 'verifyToken').mockReturnValue(verifiedPayload);

      // Act & Assert
      expect(() => rotateRefreshToken(oldRefreshToken, options)).toThrow(TokenError);
      expect(() => rotateRefreshToken(oldRefreshToken, options)).toThrow('Failed to rotate refresh token: Invalid token type: not a refresh token');
    });

    it('should propagate TokenError from verifyToken', () => {
      // Arrange
      const oldRefreshToken = 'invalid.refresh.token';
      const options = {
        secret: 'test-secret',
        expiresIn: 3600
      };
      const tokenError = new TokenError('Token expired', ERROR_CODES.TOKEN_EXPIRED);
      
      // Mock verifyToken to throw a TokenError
      jest.spyOn(global, 'verifyToken').mockImplementation(() => {
        throw tokenError;
      });

      // Act & Assert
      expect(() => rotateRefreshToken(oldRefreshToken, options)).toThrow(tokenError);
    });

    it('should wrap other errors in TokenError', () => {
      // Arrange
      const oldRefreshToken = 'problematic.refresh.token';
      const options = {
        secret: 'test-secret',
        expiresIn: 3600
      };
      
      // Mock verifyToken to throw a generic error
      jest.spyOn(global, 'verifyToken').mockImplementation(() => {
        throw new Error('Something went wrong');
      });

      // Act & Assert
      expect(() => rotateRefreshToken(oldRefreshToken, options)).toThrow(TokenError);
      expect(() => rotateRefreshToken(oldRefreshToken, options)).toThrow('Failed to rotate refresh token: Something went wrong');
      const error = (() => {
        try {
          rotateRefreshToken(oldRefreshToken, options);
          return null;
        } catch (e) {
          return e;
        }
      })();
      expect(error).toBeInstanceOf(TokenError);
      expect(error.code).toBe(ERROR_CODES.INVALID_REFRESH_TOKEN);
    });
  });
});