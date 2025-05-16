import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';

import { TokenService, TokenOptions, TokenValidationResult } from '../../src/token.service';
import { ERROR_CODES, JWT_CLAIMS, TOKEN_TYPES, CONFIG_KEYS } from '../../src/constants';
import { JwtPayload, TokenPair, TokenResponse } from '../../src/types';
import { BaseError } from '@austa/errors';

// Mock crypto functions
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('hashed_token'),
  })),
}));

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let logger: Logger;

  // Default test configuration
  const defaultConfig = {
    secret: 'test_secret',
    accessTokenExpiration: 3600,
    refreshTokenExpiration: 2592000,
    issuer: 'test-issuer',
    audience: 'test-audience',
  };

  // Default token options
  const defaultTokenOptions: TokenOptions = {
    userId: 'user123',
    email: 'user@example.com',
    roles: ['user'],
    permissions: ['read:profile'],
    journeyClaims: { health: true, care: true },
    sessionId: 'session123',
    deviceId: 'device123',
    mfaVerified: true,
  };

  // Mock JWT payload
  const mockJwtPayload: JwtPayload = {
    [JWT_CLAIMS.USER_ID]: defaultTokenOptions.userId,
    [JWT_CLAIMS.EMAIL]: defaultTokenOptions.email,
    [JWT_CLAIMS.ROLES]: defaultTokenOptions.roles,
    [JWT_CLAIMS.PERMISSIONS]: defaultTokenOptions.permissions,
    [JWT_CLAIMS.JOURNEY_ACCESS]: defaultTokenOptions.journeyClaims,
    [JWT_CLAIMS.SESSION_ID]: defaultTokenOptions.sessionId,
    [JWT_CLAIMS.DEVICE_ID]: defaultTokenOptions.deviceId,
    [JWT_CLAIMS.MFA_VERIFIED]: defaultTokenOptions.mfaVerified,
    [JWT_CLAIMS.TOKEN_TYPE]: TOKEN_TYPES.ACCESS,
    [JWT_CLAIMS.ISSUED_AT]: Math.floor(Date.now() / 1000),
    [JWT_CLAIMS.EXPIRATION]: Math.floor(Date.now() / 1000) + 3600,
    [JWT_CLAIMS.ISSUER]: defaultConfig.issuer,
    [JWT_CLAIMS.AUDIENCE]: defaultConfig.audience,
  };

  // Mock JWT token
  const mockAccessToken = 'mock.access.token';
  const mockRefreshToken = 'mock_refresh_token';

  beforeEach(async () => {
    // Create mocks
    const jwtServiceMock = {
      signAsync: jest.fn().mockResolvedValue(mockAccessToken),
      verifyAsync: jest.fn().mockResolvedValue(mockJwtPayload),
      decode: jest.fn().mockReturnValue(mockJwtPayload),
    };

    const configServiceMock = {
      get: jest.fn((key, defaultValue) => {
        switch (key) {
          case CONFIG_KEYS.JWT_SECRET:
            return defaultConfig.secret;
          case CONFIG_KEYS.JWT_ACCESS_EXPIRATION:
            return defaultConfig.accessTokenExpiration;
          case CONFIG_KEYS.JWT_REFRESH_EXPIRATION:
            return defaultConfig.refreshTokenExpiration;
          case CONFIG_KEYS.JWT_ISSUER:
            return defaultConfig.issuer;
          case CONFIG_KEYS.JWT_AUDIENCE:
            return defaultConfig.audience;
          default:
            return defaultValue;
        }
      }),
    };

    const loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    // Mock randomBytes to return a predictable value
    (randomBytes as jest.Mock).mockReturnValue({
      toString: jest.fn().mockReturnValue(mockRefreshToken),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: Logger, useValue: loggerMock },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    logger = module.get<Logger>(Logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with default configuration', () => {
      expect(configService.get).toHaveBeenCalledWith(CONFIG_KEYS.JWT_SECRET);
      expect(configService.get).toHaveBeenCalledWith(CONFIG_KEYS.JWT_ACCESS_EXPIRATION, 3600);
      expect(configService.get).toHaveBeenCalledWith(CONFIG_KEYS.JWT_REFRESH_EXPIRATION, 2592000);
      expect(configService.get).toHaveBeenCalledWith(CONFIG_KEYS.JWT_ISSUER, 'austa-superapp');
      expect(configService.get).toHaveBeenCalledWith(CONFIG_KEYS.JWT_AUDIENCE, 'austa-users');
      expect(logger.log).toHaveBeenCalledWith('TokenService initialized with configuration', expect.any(Object));
    });
  });

  describe('generateAccessToken', () => {
    it('should generate an access token with default options', async () => {
      const token = await service.generateAccessToken(defaultTokenOptions);
      
      expect(token).toEqual(mockAccessToken);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          [JWT_CLAIMS.USER_ID]: defaultTokenOptions.userId,
          [JWT_CLAIMS.EMAIL]: defaultTokenOptions.email,
          [JWT_CLAIMS.ROLES]: defaultTokenOptions.roles,
          [JWT_CLAIMS.TOKEN_TYPE]: TOKEN_TYPES.ACCESS,
        }),
        expect.objectContaining({
          secret: defaultConfig.secret,
          expiresIn: defaultConfig.accessTokenExpiration,
        }),
      );
    });

    it('should include optional claims when provided', async () => {
      await service.generateAccessToken(defaultTokenOptions);
      
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          [JWT_CLAIMS.PERMISSIONS]: defaultTokenOptions.permissions,
          [JWT_CLAIMS.JOURNEY_ACCESS]: defaultTokenOptions.journeyClaims,
          [JWT_CLAIMS.SESSION_ID]: defaultTokenOptions.sessionId,
          [JWT_CLAIMS.DEVICE_ID]: defaultTokenOptions.deviceId,
          [JWT_CLAIMS.MFA_VERIFIED]: defaultTokenOptions.mfaVerified,
        }),
        expect.any(Object),
      );
    });

    it('should use custom configuration when provided', async () => {
      const customConfig = {
        secret: 'custom_secret',
        accessTokenExpiration: 7200,
        issuer: 'custom-issuer',
        audience: 'custom-audience',
      };

      await service.generateAccessToken(defaultTokenOptions, customConfig);
      
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          [JWT_CLAIMS.ISSUER]: customConfig.issuer,
          [JWT_CLAIMS.AUDIENCE]: customConfig.audience,
        }),
        expect.objectContaining({
          secret: customConfig.secret,
          expiresIn: customConfig.accessTokenExpiration,
        }),
      );
    });

    it('should handle errors during token generation', async () => {
      const error = new Error('JWT signing error');
      (jwtService.signAsync as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.generateAccessToken(defaultTokenOptions)).rejects.toThrow(BaseError);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to generate access token', 
        expect.objectContaining({ error, userId: defaultTokenOptions.userId }),
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a secure refresh token', () => {
      const token = service.generateRefreshToken();
      
      expect(token).toEqual(mockRefreshToken);
      expect(randomBytes).toHaveBeenCalledWith(48);
    });
  });

  describe('hashRefreshToken', () => {
    it('should hash a refresh token for secure storage', () => {
      const hashedToken = service.hashRefreshToken(mockRefreshToken);
      
      expect(hashedToken).toEqual('hashed_token');
      expect(createHash).toHaveBeenCalledWith('sha256');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate an access token and refresh token pair', async () => {
      const tokenPair = await service.generateTokenPair(defaultTokenOptions);
      
      expect(tokenPair).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiresAt: expect.any(Number),
      });
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(randomBytes).toHaveBeenCalled();
    });

    it('should calculate correct expiration timestamp', async () => {
      // Mock Date.now() to return a fixed timestamp
      const now = 1609459200000; // 2021-01-01T00:00:00.000Z
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const tokenPair = await service.generateTokenPair(defaultTokenOptions);
      
      expect(tokenPair.expiresAt).toEqual(Math.floor(now / 1000) + defaultConfig.accessTokenExpiration);

      // Restore Date.now()
      jest.spyOn(Date, 'now').mockRestore();
    });
  });

  describe('generateTokenResponse', () => {
    it('should generate a complete token response for client authentication', async () => {
      const tokenResponse = await service.generateTokenResponse(defaultTokenOptions);
      
      expect(tokenResponse).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiresAt: expect.any(Number),
        tokenType: 'Bearer',
      });
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      const result = await service.validateToken(mockAccessToken);
      
      expect(result).toEqual({
        isValid: true,
        payload: mockJwtPayload,
      });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        mockAccessToken,
        expect.objectContaining({
          secret: defaultConfig.secret,
          ignoreExpiration: false,
        }),
      );
    });

    it('should reject a token with invalid type', async () => {
      const invalidTypePayload = { ...mockJwtPayload, [JWT_CLAIMS.TOKEN_TYPE]: 'invalid_type' };
      (jwtService.verifyAsync as jest.Mock).mockResolvedValueOnce(invalidTypePayload);

      const result = await service.validateToken(mockAccessToken);
      
      expect(result).toEqual({
        isValid: false,
        error: 'Invalid token type',
        errorCode: ERROR_CODES.INVALID_TOKEN,
      });
    });

    it('should handle expired tokens', async () => {
      const expiredError = { name: 'TokenExpiredError' };
      (jwtService.verifyAsync as jest.Mock).mockRejectedValueOnce(expiredError);

      const result = await service.validateToken(mockAccessToken);
      
      expect(result).toEqual({
        isValid: false,
        error: 'Token has expired',
        errorCode: ERROR_CODES.TOKEN_EXPIRED,
      });
      expect(logger.debug).toHaveBeenCalledWith('Token validation failed', { error: expiredError });
    });

    it('should handle invalid token format', async () => {
      const invalidError = { name: 'JsonWebTokenError' };
      (jwtService.verifyAsync as jest.Mock).mockRejectedValueOnce(invalidError);

      const result = await service.validateToken(mockAccessToken);
      
      expect(result).toEqual({
        isValid: false,
        error: 'Invalid token format or signature',
        errorCode: ERROR_CODES.INVALID_TOKEN,
      });
    });

    it('should optionally ignore token expiration', async () => {
      await service.validateToken(mockAccessToken, true);
      
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        mockAccessToken,
        expect.objectContaining({
          ignoreExpiration: true,
        }),
      );
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without validation', () => {
      const payload = service.decodeToken(mockAccessToken);
      
      expect(payload).toEqual(mockJwtPayload);
      expect(jwtService.decode).toHaveBeenCalledWith(mockAccessToken);
    });

    it('should return null for invalid tokens', () => {
      (jwtService.decode as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const payload = service.decodeToken('invalid_token');
      
      expect(payload).toBeNull();
      expect(logger.debug).toHaveBeenCalledWith('Token decoding failed', expect.any(Object));
    });
  });

  describe('extractUserFromPayload', () => {
    it('should extract user information from a validated JWT payload', () => {
      const user = service.extractUserFromPayload(mockJwtPayload);
      
      expect(user).toEqual({
        id: mockJwtPayload[JWT_CLAIMS.USER_ID],
        email: mockJwtPayload[JWT_CLAIMS.EMAIL],
        roles: mockJwtPayload[JWT_CLAIMS.ROLES],
        permissions: mockJwtPayload[JWT_CLAIMS.PERMISSIONS],
        journeyAttributes: mockJwtPayload[JWT_CLAIMS.JOURNEY_ACCESS],
        lastAuthenticated: expect.any(Date),
      });
    });

    it('should handle missing optional fields', () => {
      const minimalPayload = {
        [JWT_CLAIMS.USER_ID]: 'user123',
        [JWT_CLAIMS.EMAIL]: 'user@example.com',
        [JWT_CLAIMS.TOKEN_TYPE]: TOKEN_TYPES.ACCESS,
      };

      const user = service.extractUserFromPayload(minimalPayload);
      
      expect(user).toEqual({
        id: 'user123',
        email: 'user@example.com',
        roles: [],
        permissions: undefined,
        journeyAttributes: undefined,
        lastAuthenticated: undefined,
      });
    });
  });

  describe('calculateExpirationTime', () => {
    it('should calculate token expiration time in seconds', () => {
      // Mock Date.now() to return a fixed timestamp
      const now = 1609459200000; // 2021-01-01T00:00:00.000Z
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const expirationTime = service.calculateExpirationTime(3600);
      
      expect(expirationTime).toEqual(Math.floor(now / 1000) + 3600);

      // Restore Date.now()
      jest.spyOn(Date, 'now').mockRestore();
    });
  });

  describe('isTokenAboutToExpire', () => {
    it('should return true for tokens about to expire', async () => {
      // Create a payload with expiration very close to current time
      const now = Math.floor(Date.now() / 1000);
      const almostExpiredPayload = {
        ...mockJwtPayload,
        [JWT_CLAIMS.EXPIRATION]: now + 100, // 100 seconds until expiration
      };
      
      (jwtService.decode as jest.Mock).mockReturnValueOnce(almostExpiredPayload);

      const result = await service.isTokenAboutToExpire(mockAccessToken, 300); // 300 second threshold
      
      expect(result).toBe(true);
    });

    it('should return false for tokens not about to expire', async () => {
      // Create a payload with expiration far from current time
      const now = Math.floor(Date.now() / 1000);
      const notExpiredPayload = {
        ...mockJwtPayload,
        [JWT_CLAIMS.EXPIRATION]: now + 1000, // 1000 seconds until expiration
      };
      
      (jwtService.decode as jest.Mock).mockReturnValueOnce(notExpiredPayload);

      const result = await service.isTokenAboutToExpire(mockAccessToken, 300); // 300 second threshold
      
      expect(result).toBe(false);
    });

    it('should return true for tokens without expiration claim', async () => {
      const noExpirationPayload = { ...mockJwtPayload };
      delete noExpirationPayload[JWT_CLAIMS.EXPIRATION];
      
      (jwtService.decode as jest.Mock).mockReturnValueOnce(noExpirationPayload);

      const result = await service.isTokenAboutToExpire(mockAccessToken);
      
      expect(result).toBe(true);
    });

    it('should return true when token decoding fails', async () => {
      (jwtService.decode as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const result = await service.isTokenAboutToExpire('invalid_token');
      
      expect(result).toBe(true);
      expect(logger.debug).toHaveBeenCalledWith('Error checking token expiration', expect.any(Object));
    });
  });
});