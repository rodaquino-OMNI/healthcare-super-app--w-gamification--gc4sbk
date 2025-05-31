/**
 * Integration tests for AuthService and TokenService
 * 
 * These tests verify that AuthService and TokenService work together correctly
 * for complete authentication flows, including login, token generation, token
 * validation, and refresh operations.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

// Import from @austa/errors package for error handling
import { AuthError } from '@austa/errors/categories';

// Import from @austa/database package for database access
import { PrismaService } from '@austa/database';

// Import from @austa/logging package for structured logging
import { LoggerService } from '@austa/logging';

// Local imports
import { AuthService } from '../../src/auth.service';
import { TokenService } from '../../src/token.service';
import { ERROR_CODES, JWT_CLAIMS } from '../../src/constants';
import {
  TokenType,
  AuthProvider,
  TokenPayload,
  TokenUserInfo,
  LoginRequest,
  RefreshTokenRequest,
} from '../../src/types';

// Mock implementations
jest.mock('@austa/database');
jest.mock('@austa/logging');

describe('AuthService and TokenService Integration', () => {
  let authService: AuthService;
  let tokenService: TokenService;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let configService: ConfigService;
  let loggerService: LoggerService;

  // Test user data
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: '$2b$10$abcdefghijklmnopqrstuvwxyz', // Hashed password
    firstName: 'Test',
    lastName: 'User',
    emailVerified: true,
    mfaEnabled: false,
    provider: AuthProvider.LOCAL,
    createdAt: new Date(),
    updatedAt: new Date(),
    failedLoginAttempts: 0,
    lockedUntil: null,
  };

  // Test user roles
  const testUserRoles = [
    {
      role: {
        name: 'user',
        rolePermissions: [
          {
            permission: {
              resource: 'profile',
              action: 'read',
              journey: 'common',
            },
          },
          {
            permission: {
              resource: 'profile',
              action: 'update',
              journey: 'common',
            },
          },
        ],
      },
    },
  ];

  // Test user info for token generation
  const testUserInfo: TokenUserInfo = {
    id: testUser.id,
    email: testUser.email,
    roles: ['user'],
    permissions: {
      common: ['profile:read', 'profile:update'],
    },
  };

  // JWT configuration
  const jwtConfig = {
    secret: 'test-jwt-secret',
    accessTokenExpiration: 3600, // 1 hour
    refreshTokenExpiration: 604800, // 7 days
    issuer: 'austa-test',
    audience: 'austa-test-users',
  };

  beforeEach(async () => {
    // Create testing module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        TokenService,
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => {
              switch (key) {
                case 'JWT_SECRET':
                  return jwtConfig.secret;
                case 'JWT_ACCESS_EXPIRATION':
                  return jwtConfig.accessTokenExpiration;
                case 'JWT_REFRESH_EXPIRATION':
                  return jwtConfig.refreshTokenExpiration;
                case 'JWT_ISSUER':
                  return jwtConfig.issuer;
                case 'JWT_AUDIENCE':
                  return jwtConfig.audience;
                case 'JWT_USE_REDIS_BLACKLIST':
                  return false;
                case 'PASSWORD_MIN_LENGTH':
                  return 8;
                case 'PASSWORD_REQUIRE_UPPERCASE':
                  return true;
                case 'PASSWORD_REQUIRE_LOWERCASE':
                  return true;
                case 'PASSWORD_REQUIRE_NUMBER':
                  return true;
                case 'PASSWORD_REQUIRE_SPECIAL':
                  return true;
                case 'PASSWORD_LOCKOUT_THRESHOLD':
                  return 5;
                case 'PASSWORD_LOCKOUT_DURATION':
                  return 15;
                case 'AUTH_REQUIRE_EMAIL_VERIFICATION':
                  return true;
                case 'DEFAULT_ROLE':
                  return 'user';
                default:
                  return defaultValue;
              }
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            userRole: {
              create: jest.fn(),
            },
            role: {
              findFirst: jest.fn(),
            },
            mfaChallenge: {
              create: jest.fn(),
              findFirst: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prismaService)),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
          },
        },
      ],
    }).compile();

    // Get service instances
    authService = module.get<AuthService>(AuthService);
    tokenService = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get<LoggerService>(LoggerService);

    // Setup spies on tokenService methods
    jest.spyOn(tokenService, 'generateAccessToken');
    jest.spyOn(tokenService, 'generateRefreshToken');
    jest.spyOn(tokenService, 'generateTokens');
    jest.spyOn(tokenService, 'validateToken');
    jest.spyOn(tokenService, 'refreshToken');
    jest.spyOn(tokenService, 'revokeToken');

    // Setup bcrypt mock
    jest.mock('bcrypt', () => ({
      compare: jest.fn().mockImplementation((plaintext, hash) => {
        // For testing, consider any password valid if it matches 'valid-password'
        return Promise.resolve(plaintext === 'valid-password');
      }),
      hash: jest.fn().mockImplementation((plaintext, saltRounds) => {
        return Promise.resolve(`hashed-${plaintext}`);
      }),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Login and Token Generation', () => {
    it('should successfully login and generate tokens', async () => {
      // Mock user lookup
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(testUser);

      // Mock user roles lookup
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce({
        ...testUser,
        userRoles: testUserRoles,
      });

      // Mock token generation
      (tokenService.generateTokens as jest.Mock).mockResolvedValueOnce({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: jwtConfig.accessTokenExpiration,
        tokenType: 'Bearer',
      });

      // Create login request
      const loginRequest: LoginRequest = {
        email: testUser.email,
        password: 'valid-password',
      };

      // Perform login
      const result = await authService.login(loginRequest);

      // Verify user lookup was called
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: testUser.email },
      });

      // Verify token generation was called with correct user info
      expect(tokenService.generateTokens).toHaveBeenCalledWith(
        expect.objectContaining({
          id: testUser.id,
          email: testUser.email,
          roles: expect.any(Array),
          permissions: expect.any(Object),
        }),
        undefined
      );

      // Verify result structure
      expect(result).toEqual({
        user: expect.objectContaining({
          id: testUser.id,
          email: testUser.email,
        }),
        tokens: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          expiresIn: jwtConfig.accessTokenExpiration,
          tokenType: 'Bearer',
        },
      });
    });

    it('should throw AuthError with INVALID_CREDENTIALS code when login fails', async () => {
      // Mock user lookup
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(testUser);

      // Create login request with invalid password
      const loginRequest: LoginRequest = {
        email: testUser.email,
        password: 'invalid-password',
      };

      // Expect login to throw AuthError
      await expect(authService.login(loginRequest)).rejects.toThrow(AuthError);
      await expect(authService.login(loginRequest)).rejects.toMatchObject({
        code: ERROR_CODES.INVALID_CREDENTIALS,
      });

      // Verify token generation was not called
      expect(tokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('should generate tokens with extended expiration when rememberMe is true', async () => {
      // Mock user lookup
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(testUser);

      // Mock user roles lookup
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce({
        ...testUser,
        userRoles: testUserRoles,
      });

      // Mock token generation
      (tokenService.generateTokens as jest.Mock).mockResolvedValueOnce({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: jwtConfig.accessTokenExpiration,
        tokenType: 'Bearer',
      });

      // Create login request with rememberMe
      const loginRequest: LoginRequest = {
        email: testUser.email,
        password: 'valid-password',
        rememberMe: true,
      };

      // Perform login
      await authService.login(loginRequest);

      // Verify token generation was called with rememberMe expiration
      expect(tokenService.generateTokens).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Number)
      );
    });
  });

  describe('Token Validation', () => {
    it('should successfully validate a token', async () => {
      // Mock token validation
      const mockPayload: TokenPayload = {
        sub: testUser.id,
        email: testUser.email,
        roles: ['user'],
        permissions: {
          common: ['profile:read', 'profile:update'],
        },
        type: TokenType.ACCESS,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: jwtConfig.issuer,
        aud: jwtConfig.audience,
      };

      (tokenService.validateToken as jest.Mock).mockResolvedValueOnce(mockPayload);

      // Validate token
      const result = await authService.validateToken('test-access-token');

      // Verify token validation was called
      expect(tokenService.validateToken).toHaveBeenCalledWith(
        'test-access-token',
        TokenType.ACCESS
      );

      // Verify result structure
      expect(result).toEqual({
        id: testUser.id,
        email: testUser.email,
        roles: ['user'],
        permissions: {
          common: ['profile:read', 'profile:update'],
        },
      });
    });

    it('should throw AuthError with TOKEN_EXPIRED code when token is expired', async () => {
      // Mock token validation to throw expired token error
      (tokenService.validateToken as jest.Mock).mockRejectedValueOnce(
        new Error(ERROR_CODES.TOKEN_EXPIRED)
      );

      // Expect validation to throw AuthError
      await expect(authService.validateToken('expired-token')).rejects.toThrow(AuthError);
      await expect(authService.validateToken('expired-token')).rejects.toMatchObject({
        code: ERROR_CODES.TOKEN_EXPIRED,
      });
    });

    it('should throw AuthError with INVALID_TOKEN code when token is invalid', async () => {
      // Mock token validation to throw invalid token error
      (tokenService.validateToken as jest.Mock).mockRejectedValueOnce(
        new Error(ERROR_CODES.INVALID_TOKEN)
      );

      // Expect validation to throw AuthError
      await expect(authService.validateToken('invalid-token')).rejects.toThrow(AuthError);
      await expect(authService.validateToken('invalid-token')).rejects.toMatchObject({
        code: ERROR_CODES.INVALID_TOKEN,
      });
    });

    it('should throw AuthError with TOKEN_REVOKED code when token is revoked', async () => {
      // Mock token validation to throw revoked token error
      (tokenService.validateToken as jest.Mock).mockRejectedValueOnce(
        new Error(ERROR_CODES.TOKEN_REVOKED)
      );

      // Expect validation to throw AuthError
      await expect(authService.validateToken('revoked-token')).rejects.toThrow(AuthError);
      await expect(authService.validateToken('revoked-token')).rejects.toMatchObject({
        code: ERROR_CODES.TOKEN_REVOKED,
      });
    });
  });

  describe('Token Refresh', () => {
    it('should successfully refresh tokens', async () => {
      // Mock token refresh
      const mockTokenResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: jwtConfig.accessTokenExpiration,
        tokenType: 'Bearer',
      };

      (tokenService.refreshToken as jest.Mock).mockResolvedValueOnce(mockTokenResponse);

      // Create refresh token request
      const refreshTokenRequest: RefreshTokenRequest = {
        refreshToken: 'old-refresh-token',
      };

      // Refresh token
      const result = await authService.refreshToken(refreshTokenRequest);

      // Verify token refresh was called
      expect(tokenService.refreshToken).toHaveBeenCalledWith(refreshTokenRequest);

      // Verify result structure
      expect(result).toEqual(mockTokenResponse);
    });

    it('should throw AuthError with INVALID_REFRESH_TOKEN code when refresh fails', async () => {
      // Mock token refresh to throw error
      (tokenService.refreshToken as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to refresh token')
      );

      // Create refresh token request
      const refreshTokenRequest: RefreshTokenRequest = {
        refreshToken: 'invalid-refresh-token',
      };

      // Expect refresh to throw AuthError
      await expect(authService.refreshToken(refreshTokenRequest)).rejects.toThrow(AuthError);
      await expect(authService.refreshToken(refreshTokenRequest)).rejects.toMatchObject({
        code: ERROR_CODES.INVALID_REFRESH_TOKEN,
      });
    });

    it('should blacklist old refresh token when refreshing tokens', async () => {
      // Mock token validation for the refresh token
      const mockPayload: TokenPayload = {
        sub: testUser.id,
        email: testUser.email,
        roles: ['user'],
        type: TokenType.REFRESH,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 604800,
        iss: jwtConfig.issuer,
        aud: jwtConfig.audience,
        jti: 'old-token-id',
      };

      // Setup direct test of TokenService refresh flow
      (jwtService.verifyAsync as jest.Mock) = jest.fn().mockResolvedValueOnce(mockPayload);
      (jwtService.sign as jest.Mock) = jest.fn()
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      // Create spy for blacklistToken method (private method)
      const blacklistSpy = jest.spyOn(tokenService as any, 'blacklistToken');

      // Create refresh token request
      const refreshTokenRequest: RefreshTokenRequest = {
        refreshToken: 'old-refresh-token',
      };

      // Refresh token directly with TokenService
      await tokenService.refreshToken(refreshTokenRequest);

      // Verify blacklistToken was called with the old token
      expect(blacklistSpy).toHaveBeenCalledWith(
        'old-refresh-token',
        'old-token-id',
        expect.any(Number)
      );
    });
  });

  describe('Logout and Token Revocation', () => {
    it('should successfully logout and revoke token', async () => {
      // Mock token revocation
      (tokenService.revokeToken as jest.Mock).mockResolvedValueOnce(true);

      // Logout
      const result = await authService.logout(testUser.id, 'test-access-token');

      // Verify token revocation was called
      expect(tokenService.revokeToken).toHaveBeenCalledWith('test-access-token');

      // Verify result
      expect(result).toBe(true);
    });

    it('should handle errors during logout gracefully', async () => {
      // Mock token revocation to throw error
      (tokenService.revokeToken as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to revoke token')
      );

      // Logout
      const result = await authService.logout(testUser.id, 'test-access-token');

      // Verify token revocation was called
      expect(tokenService.revokeToken).toHaveBeenCalledWith('test-access-token');

      // Verify result (should still return false, not throw)
      expect(result).toBe(false);

      // Verify error was logged
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('JWT Payload Structure and Claims', () => {
    it('should generate access token with correct payload structure', async () => {
      // Setup spy on JwtService.sign
      (jwtService.sign as jest.Mock) = jest.fn().mockReturnValueOnce('test-access-token');

      // Generate access token
      await tokenService.generateAccessToken(testUserInfo);

      // Verify JwtService.sign was called with correct payload structure
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: testUser.id,
          email: testUser.email,
          roles: ['user'],
          permissions: {
            common: ['profile:read', 'profile:update'],
          },
          type: TokenType.ACCESS,
          iat: expect.any(Number),
          exp: expect.any(Number),
          iss: jwtConfig.issuer,
          aud: jwtConfig.audience,
        }),
        expect.any(Object)
      );
    });

    it('should generate refresh token with correct payload structure including jti claim', async () => {
      // Setup spy on JwtService.sign
      (jwtService.sign as jest.Mock) = jest.fn().mockReturnValueOnce('test-refresh-token');

      // Generate refresh token
      await tokenService.generateRefreshToken(testUserInfo);

      // Verify JwtService.sign was called with correct payload structure
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: testUser.id,
          email: testUser.email,
          roles: ['user'],
          type: TokenType.REFRESH,
          iat: expect.any(Number),
          exp: expect.any(Number),
          iss: jwtConfig.issuer,
          aud: jwtConfig.audience,
          jti: expect.any(String), // Unique token ID for refresh tokens
        }),
        expect.any(Object)
      );
    });

    it('should validate token type during token validation', async () => {
      // Setup direct test of TokenService validation
      const mockPayload: TokenPayload = {
        sub: testUser.id,
        email: testUser.email,
        roles: ['user'],
        type: TokenType.REFRESH, // Wrong token type for access token validation
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: jwtConfig.issuer,
        aud: jwtConfig.audience,
      };

      // Mock JwtService.verifyAsync
      (jwtService.verifyAsync as jest.Mock) = jest.fn().mockResolvedValueOnce(mockPayload);

      // Expect validation to throw error for wrong token type
      await expect(
        tokenService.validateToken('test-token', TokenType.ACCESS)
      ).rejects.toThrow();
    });
  });

  describe('Multi-Service Token Validation', () => {
    it('should validate tokens across service boundaries', async () => {
      // Mock token validation
      const mockPayload: TokenPayload = {
        sub: testUser.id,
        email: testUser.email,
        roles: ['user'],
        permissions: {
          common: ['profile:read', 'profile:update'],
        },
        type: TokenType.ACCESS,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: jwtConfig.issuer,
        aud: jwtConfig.audience,
      };

      // Mock JwtService.verifyAsync
      (jwtService.verifyAsync as jest.Mock) = jest.fn().mockResolvedValueOnce(mockPayload);

      // Validate token directly with TokenService
      const result = await tokenService.validateToken('test-token', TokenType.ACCESS);

      // Verify result structure
      expect(result).toEqual(mockPayload);

      // Now validate the same token through AuthService
      (tokenService.validateToken as jest.Mock).mockResolvedValueOnce(mockPayload);
      const authResult = await authService.validateToken('test-token');

      // Verify AuthService extracted the correct user info
      expect(authResult).toEqual({
        id: testUser.id,
        email: testUser.email,
        roles: ['user'],
        permissions: {
          common: ['profile:read', 'profile:update'],
        },
      });
    });

    it('should propagate token validation errors between services', async () => {
      // Mock TokenService to throw error
      (tokenService.validateToken as jest.Mock).mockRejectedValueOnce(
        new Error(ERROR_CODES.TOKEN_EXPIRED)
      );

      // Expect AuthService to propagate the error with proper wrapping
      await expect(authService.validateToken('expired-token')).rejects.toThrow(AuthError);
      await expect(authService.validateToken('expired-token')).rejects.toMatchObject({
        code: ERROR_CODES.TOKEN_EXPIRED,
      });

      // Mock different error
      (tokenService.validateToken as jest.Mock).mockRejectedValueOnce(
        new Error(ERROR_CODES.INVALID_TOKEN)
      );

      // Expect AuthService to propagate the error with proper wrapping
      await expect(authService.validateToken('invalid-token')).rejects.toThrow(AuthError);
      await expect(authService.validateToken('invalid-token')).rejects.toMatchObject({
        code: ERROR_CODES.INVALID_TOKEN,
      });
    });
  });

  describe('Token Refresh with Secure Rotation', () => {
    it('should generate new tokens with different JTI claims during refresh', async () => {
      // Mock token validation for the refresh token
      const mockPayload: TokenPayload = {
        sub: testUser.id,
        email: testUser.email,
        roles: ['user'],
        permissions: {
          common: ['profile:read', 'profile:update'],
        },
        type: TokenType.REFRESH,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 604800,
        iss: jwtConfig.issuer,
        aud: jwtConfig.audience,
        jti: 'old-token-id',
      };

      // Setup direct test of TokenService refresh flow
      (jwtService.verifyAsync as jest.Mock) = jest.fn().mockResolvedValueOnce(mockPayload);
      
      // Capture the payloads passed to sign
      let accessTokenPayload: any;
      let refreshTokenPayload: any;
      
      (jwtService.sign as jest.Mock) = jest.fn((payload) => {
        if (payload.type === TokenType.ACCESS) {
          accessTokenPayload = payload;
          return 'new-access-token';
        } else {
          refreshTokenPayload = payload;
          return 'new-refresh-token';
        }
      });

      // Create refresh token request
      const refreshTokenRequest: RefreshTokenRequest = {
        refreshToken: 'old-refresh-token',
      };

      // Refresh token directly with TokenService
      const result = await tokenService.refreshToken(refreshTokenRequest);

      // Verify new tokens were generated
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: jwtConfig.accessTokenExpiration,
        tokenType: 'Bearer',
      });

      // Verify the new refresh token has a different JTI
      expect(refreshTokenPayload.jti).toBeDefined();
      expect(refreshTokenPayload.jti).not.toEqual('old-token-id');

      // Verify the access token has the correct claims
      expect(accessTokenPayload).toEqual(
        expect.objectContaining({
          sub: testUser.id,
          email: testUser.email,
          roles: ['user'],
          permissions: {
            common: ['profile:read', 'profile:update'],
          },
          type: TokenType.ACCESS,
          iat: expect.any(Number),
          exp: expect.any(Number),
          iss: jwtConfig.issuer,
          aud: jwtConfig.audience,
        })
      );
    });

    it('should handle token refresh with invalid refresh token', async () => {
      // Mock JwtService.verifyAsync to throw error
      (jwtService.verifyAsync as jest.Mock) = jest.fn().mockRejectedValueOnce(
        new Error('Invalid token')
      );

      // Create refresh token request
      const refreshTokenRequest: RefreshTokenRequest = {
        refreshToken: 'invalid-refresh-token',
      };

      // Expect refresh to throw error
      await expect(
        tokenService.refreshToken(refreshTokenRequest)
      ).rejects.toThrow();

      // Verify JwtService.sign was not called
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });
});