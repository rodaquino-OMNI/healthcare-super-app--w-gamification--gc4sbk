/**
 * @file Token Service Unit Tests
 * 
 * This file contains unit tests for the TokenService, which is responsible for JWT token operations
 * including generation, validation, decoding, and refresh logic. The tests verify proper signing of tokens,
 * verification of token validity, handling of expired tokens, and implementation of token refresh logic.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

import { TokenService } from '../../src/token.service';
import { TokenType, TokenUserInfo, TokenPayload } from '../../src/types';
import { ERROR_CODES } from '../../src/constants';

// Mock data for testing
const mockUserInfo: TokenUserInfo = {
  id: 'user-123',
  email: 'test@example.com',
  roles: ['user'],
  permissions: {
    'health': ['read', 'write'],
    'care': ['read']
  }
};

// Mock JWT configuration
const mockJwtConfig = {
  secret: 'test-secret',
  accessTokenExpiration: 3600, // 1 hour
  refreshTokenExpiration: 604800, // 7 days
  issuer: 'test-issuer',
  audience: 'test-audience',
  useRedisBlacklist: false
};

// Mock tokens
const mockAccessToken = 'mock.access.token';
const mockRefreshToken = 'mock.refresh.token';
const mockInvalidToken = 'invalid.token';
const mockExpiredToken = 'expired.token';
const mockRevokedToken = 'revoked.token';

// Mock token payloads
const mockAccessPayload: TokenPayload = {
  sub: mockUserInfo.id,
  email: mockUserInfo.email,
  roles: mockUserInfo.roles,
  permissions: mockUserInfo.permissions,
  type: TokenType.ACCESS,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + mockJwtConfig.accessTokenExpiration,
  iss: mockJwtConfig.issuer,
  aud: mockJwtConfig.audience
};

const mockRefreshPayload: TokenPayload = {
  sub: mockUserInfo.id,
  email: mockUserInfo.email,
  roles: mockUserInfo.roles,
  permissions: mockUserInfo.permissions,
  type: TokenType.REFRESH,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + mockJwtConfig.refreshTokenExpiration,
  iss: mockJwtConfig.issuer,
  aud: mockJwtConfig.audience,
  jti: 'mock-token-id'
};

const mockExpiredPayload: TokenPayload = {
  ...mockAccessPayload,
  exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
};

// Mock JwtService
const mockJwtService = {
  sign: jest.fn(),
  verifyAsync: jest.fn(),
  decode: jest.fn()
};

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    const config = {
      'JWT_SECRET': mockJwtConfig.secret,
      'JWT_ACCESS_EXPIRATION': mockJwtConfig.accessTokenExpiration,
      'JWT_REFRESH_EXPIRATION': mockJwtConfig.refreshTokenExpiration,
      'JWT_ISSUER': mockJwtConfig.issuer,
      'JWT_AUDIENCE': mockJwtConfig.audience,
      'JWT_USE_REDIS_BLACKLIST': mockJwtConfig.useRedisBlacklist
    };
    return config[key] !== undefined ? config[key] : defaultValue;
  })
};

// Silence the logger during tests
jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService }
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', async () => {
      // Setup
      mockJwtService.sign.mockReturnValue(mockAccessToken);

      // Execute
      const result = await service.generateAccessToken(mockUserInfo);

      // Verify
      expect(result).toBe(mockAccessToken);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUserInfo.id,
          email: mockUserInfo.email,
          roles: mockUserInfo.roles,
          permissions: mockUserInfo.permissions,
          type: TokenType.ACCESS,
          iss: mockJwtConfig.issuer,
          aud: mockJwtConfig.audience
        }),
        expect.objectContaining({
          secret: mockJwtConfig.secret,
          expiresIn: mockJwtConfig.accessTokenExpiration
        })
      );
    });

    it('should throw an error if token generation fails', async () => {
      // Setup
      const errorMessage = 'Failed to sign token';
      mockJwtService.sign.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute & Verify
      await expect(service.generateAccessToken(mockUserInfo)).rejects.toThrow(
        `Failed to generate access token: ${errorMessage}`
      );
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', async () => {
      // Setup
      mockJwtService.sign.mockReturnValue(mockRefreshToken);

      // Execute
      const result = await service.generateRefreshToken(mockUserInfo);

      // Verify
      expect(result).toBe(mockRefreshToken);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUserInfo.id,
          email: mockUserInfo.email,
          roles: mockUserInfo.roles,
          type: TokenType.REFRESH,
          iss: mockJwtConfig.issuer,
          aud: mockJwtConfig.audience,
          jti: expect.any(String) // Token ID should be generated
        }),
        expect.objectContaining({
          secret: mockJwtConfig.secret,
          expiresIn: mockJwtConfig.refreshTokenExpiration
        })
      );
    });

    it('should throw an error if token generation fails', async () => {
      // Setup
      const errorMessage = 'Failed to sign token';
      mockJwtService.sign.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute & Verify
      await expect(service.generateRefreshToken(mockUserInfo)).rejects.toThrow(
        `Failed to generate refresh token: ${errorMessage}`
      );
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', async () => {
      // Setup
      mockJwtService.sign.mockReturnValueOnce(mockAccessToken).mockReturnValueOnce(mockRefreshToken);

      // Execute
      const result = await service.generateTokens(mockUserInfo);

      // Verify
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiresIn: mockJwtConfig.accessTokenExpiration,
        tokenType: 'Bearer'
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if token generation fails', async () => {
      // Setup
      const errorMessage = 'Failed to sign token';
      mockJwtService.sign.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute & Verify
      await expect(service.generateTokens(mockUserInfo)).rejects.toThrow(
        `Failed to generate tokens: ${errorMessage}`
      );
    });
  });

  describe('validateToken', () => {
    it('should validate a valid access token', async () => {
      // Setup
      mockJwtService.verifyAsync.mockResolvedValue(mockAccessPayload);

      // Execute
      const result = await service.validateToken(mockAccessToken, TokenType.ACCESS);

      // Verify
      expect(result).toEqual(mockAccessPayload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        mockAccessToken,
        expect.objectContaining({
          secret: mockJwtConfig.secret
        })
      );
    });

    it('should validate a valid refresh token', async () => {
      // Setup
      mockJwtService.verifyAsync.mockResolvedValue(mockRefreshPayload);

      // Execute
      const result = await service.validateToken(mockRefreshToken, TokenType.REFRESH);

      // Verify
      expect(result).toEqual(mockRefreshPayload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if token type does not match', async () => {
      // Setup
      mockJwtService.verifyAsync.mockResolvedValue(mockAccessPayload);

      // Execute & Verify
      await expect(service.validateToken(mockAccessToken, TokenType.REFRESH)).rejects.toThrow(
        ERROR_CODES.INVALID_TOKEN
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if token is expired', async () => {
      // Setup
      mockJwtService.verifyAsync.mockImplementation(() => {
        const error: any = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      // Execute & Verify
      await expect(service.validateToken(mockExpiredToken, TokenType.ACCESS)).rejects.toThrow(
        ERROR_CODES.TOKEN_EXPIRED
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if token signature is invalid', async () => {
      // Setup
      mockJwtService.verifyAsync.mockImplementation(() => {
        const error: any = new Error('Invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      // Execute & Verify
      await expect(service.validateToken(mockInvalidToken, TokenType.ACCESS)).rejects.toThrow(
        ERROR_CODES.INVALID_TOKEN
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if token is revoked', async () => {
      // Setup
      mockJwtService.verifyAsync.mockImplementation(() => {
        throw new Error(ERROR_CODES.TOKEN_REVOKED);
      });

      // Execute & Verify
      await expect(service.validateToken(mockRevokedToken, TokenType.ACCESS)).rejects.toThrow(
        ERROR_CODES.TOKEN_REVOKED
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without validation', () => {
      // Setup
      mockJwtService.decode.mockReturnValue(mockAccessPayload);

      // Execute
      const result = service.decodeToken(mockAccessToken);

      // Verify
      expect(result).toEqual(mockAccessPayload);
      expect(mockJwtService.decode).toHaveBeenCalledTimes(1);
      expect(mockJwtService.decode).toHaveBeenCalledWith(mockAccessToken);
    });

    it('should throw an error if token decoding fails', () => {
      // Setup
      const errorMessage = 'Failed to decode token';
      mockJwtService.decode.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute & Verify
      expect(() => service.decodeToken(mockInvalidToken)).toThrow(
        `Failed to decode token: ${errorMessage}`
      );
      expect(mockJwtService.decode).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshToken', () => {
    it('should refresh a valid refresh token', async () => {
      // Setup
      mockJwtService.verifyAsync.mockResolvedValue(mockRefreshPayload);
      mockJwtService.sign.mockReturnValueOnce(mockAccessToken).mockReturnValueOnce(mockRefreshToken);

      // Execute
      const result = await service.refreshToken({ refreshToken: mockRefreshToken });

      // Verify
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiresIn: mockJwtConfig.accessTokenExpiration,
        tokenType: 'Bearer'
      });
      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if refresh token is expired', async () => {
      // Setup
      mockJwtService.verifyAsync.mockImplementation(() => {
        const error: any = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      // Execute & Verify
      await expect(service.refreshToken({ refreshToken: mockExpiredToken })).rejects.toThrow(
        ERROR_CODES.INVALID_REFRESH_TOKEN
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw an error if refresh token is invalid', async () => {
      // Setup
      mockJwtService.verifyAsync.mockImplementation(() => {
        const error: any = new Error('Invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      // Execute & Verify
      await expect(service.refreshToken({ refreshToken: mockInvalidToken })).rejects.toThrow(
        ERROR_CODES.INVALID_REFRESH_TOKEN
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw an error if refresh token is revoked', async () => {
      // Setup
      mockJwtService.verifyAsync.mockImplementation(() => {
        throw new Error(ERROR_CODES.TOKEN_REVOKED);
      });

      // Execute & Verify
      await expect(service.refreshToken({ refreshToken: mockRevokedToken })).rejects.toThrow(
        ERROR_CODES.INVALID_REFRESH_TOKEN
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('revokeToken', () => {
    it('should return false if token blacklisting is not enabled', async () => {
      // Setup
      mockJwtService.decode.mockReturnValue(mockAccessPayload);

      // Execute
      const result = await service.revokeToken(mockAccessToken);

      // Verify
      expect(result).toBe(false);
      expect(mockJwtService.decode).toHaveBeenCalledTimes(1);
    });

    it('should return true if token is already expired', async () => {
      // Setup
      mockJwtService.decode.mockReturnValue(mockExpiredPayload);

      // Execute
      const result = await service.revokeToken(mockExpiredToken);

      // Verify
      expect(result).toBe(true);
      expect(mockJwtService.decode).toHaveBeenCalledTimes(1);
    });

    it('should return false if token decoding fails', async () => {
      // Setup
      mockJwtService.decode.mockImplementation(() => {
        throw new Error('Failed to decode token');
      });

      // Execute
      const result = await service.revokeToken(mockInvalidToken);

      // Verify
      expect(result).toBe(false);
      expect(mockJwtService.decode).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateSpecialToken', () => {
    it('should generate a special-purpose token', async () => {
      // Setup
      const userId = 'user-123';
      const tokenType = TokenType.RESET_PASSWORD;
      const expiresIn = 3600; // 1 hour
      const additionalData = { email: 'test@example.com' };
      const specialToken = 'special.token';
      
      mockJwtService.sign.mockReturnValue(specialToken);

      // Execute
      const result = await service.generateSpecialToken(userId, tokenType, expiresIn, additionalData);

      // Verify
      expect(result).toBe(specialToken);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: userId,
          type: tokenType,
          iss: mockJwtConfig.issuer,
          jti: expect.any(String),
          email: additionalData.email
        }),
        expect.objectContaining({
          secret: mockJwtConfig.secret,
          expiresIn
        })
      );
    });

    it('should throw an error if special token generation fails', async () => {
      // Setup
      const errorMessage = 'Failed to sign token';
      mockJwtService.sign.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute & Verify
      await expect(
        service.generateSpecialToken('user-123', TokenType.RESET_PASSWORD, 3600)
      ).rejects.toThrow(`Failed to generate special token: ${errorMessage}`);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });
  });

  describe('performTokenOperation', () => {
    it('should create an access token', async () => {
      // Setup
      mockJwtService.sign.mockReturnValue(mockAccessToken);

      // Execute
      const result = await service.performTokenOperation({
        operation: 'create',
        tokenType: TokenType.ACCESS,
        payload: {
          sub: mockUserInfo.id,
          email: mockUserInfo.email,
          roles: mockUserInfo.roles,
          permissions: mockUserInfo.permissions
        }
      });

      // Verify
      expect(result).toBe(mockAccessToken);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });

    it('should create a refresh token', async () => {
      // Setup
      mockJwtService.sign.mockReturnValue(mockRefreshToken);

      // Execute
      const result = await service.performTokenOperation({
        operation: 'create',
        tokenType: TokenType.REFRESH,
        payload: {
          sub: mockUserInfo.id,
          email: mockUserInfo.email,
          roles: mockUserInfo.roles,
          permissions: mockUserInfo.permissions
        }
      });

      // Verify
      expect(result).toBe(mockRefreshToken);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });

    it('should verify a token', async () => {
      // Setup
      mockJwtService.verifyAsync.mockResolvedValue(mockAccessPayload);

      // Execute
      const result = await service.performTokenOperation({
        operation: 'verify',
        tokenType: TokenType.ACCESS,
        token: mockAccessToken
      });

      // Verify
      expect(result).toEqual(mockAccessPayload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
    });

    it('should refresh a token', async () => {
      // Setup
      mockJwtService.verifyAsync.mockResolvedValue(mockRefreshPayload);
      mockJwtService.sign.mockReturnValueOnce(mockAccessToken).mockReturnValueOnce(mockRefreshToken);

      // Execute
      const result = await service.performTokenOperation({
        operation: 'refresh',
        tokenType: TokenType.REFRESH,
        token: mockRefreshToken
      });

      // Verify
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiresIn: mockJwtConfig.accessTokenExpiration,
        tokenType: 'Bearer'
      });
      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should revoke a token', async () => {
      // Setup
      mockJwtService.decode.mockReturnValue(mockAccessPayload);

      // Execute
      const result = await service.performTokenOperation({
        operation: 'revoke',
        tokenType: TokenType.ACCESS,
        token: mockAccessToken
      });

      // Verify
      expect(result).toBe(false); // Since blacklisting is disabled in tests
      expect(mockJwtService.decode).toHaveBeenCalledTimes(1);
    });

    it('should throw an error for unsupported operations', async () => {
      // Execute & Verify
      await expect(
        service.performTokenOperation({
          // @ts-ignore - Testing invalid operation
          operation: 'invalid',
          tokenType: TokenType.ACCESS,
          token: mockAccessToken
        })
      ).rejects.toThrow('Unsupported token operation: invalid');
    });

    it('should throw an error if payload is missing for create operation', async () => {
      // Execute & Verify
      await expect(
        service.performTokenOperation({
          operation: 'create',
          tokenType: TokenType.ACCESS,
          // No payload
        })
      ).rejects.toThrow('Payload is required for token creation');
    });

    it('should throw an error if token is missing for verify operation', async () => {
      // Execute & Verify
      await expect(
        service.performTokenOperation({
          operation: 'verify',
          tokenType: TokenType.ACCESS,
          // No token
        })
      ).rejects.toThrow('Token is required for verification');
    });

    it('should throw an error if token is missing for refresh operation', async () => {
      // Execute & Verify
      await expect(
        service.performTokenOperation({
          operation: 'refresh',
          tokenType: TokenType.REFRESH,
          // No token
        })
      ).rejects.toThrow('Refresh token is required');
    });

    it('should throw an error if token is missing for revoke operation', async () => {
      // Execute & Verify
      await expect(
        service.performTokenOperation({
          operation: 'revoke',
          tokenType: TokenType.ACCESS,
          // No token
        })
      ).rejects.toThrow('Token is required for revocation');
    });
  });
});