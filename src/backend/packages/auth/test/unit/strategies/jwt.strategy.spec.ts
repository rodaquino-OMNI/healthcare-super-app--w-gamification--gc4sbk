/**
 * @file JWT Strategy Unit Tests
 * 
 * This file contains unit tests for the JwtStrategy, which is responsible for JWT token validation
 * using Passport.js. The tests verify proper token extraction, JWT secret loading, payload validation,
 * and error handling for invalid or expired tokens.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

// Import the strategy to test
import { JwtStrategy } from '../../../src/strategies/jwt.strategy';

// Import from @austa/interfaces package for shared interfaces
import { JwtPayload, UserResponseDto } from '@austa/interfaces/auth';

// Import from @austa/errors for standardized error handling
import { AuthenticationError } from '@austa/errors/categories';

// Import from providers for JWT and Redis integration
import { JwtRedisProvider } from '../../../src/providers/jwt/jwt-redis.provider';

// Mock data for testing
const mockJwtConfig = {
  secret: 'test-secret',
  audience: 'test-audience',
  issuer: 'test-issuer'
};

const mockUser: UserResponseDto = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  roles: ['user'],
  permissions: {
    'health': ['read', 'write'],
    'care': ['read']
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockValidPayload: JwtPayload = {
  sub: mockUser.id,
  email: mockUser.email,
  roles: mockUser.roles,
  permissions: mockUser.permissions,
  jti: 'token-id-123',
  sid: 'session-id-123',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  iss: mockJwtConfig.issuer,
  aud: mockJwtConfig.audience
};

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    const config = {
      'JWT_SECRET': mockJwtConfig.secret,
      'JWT_AUDIENCE': mockJwtConfig.audience,
      'JWT_ISSUER': mockJwtConfig.issuer
    };
    return config[key];
  })
};

// Mock UserService
const mockUserService = {
  findById: jest.fn()
};

// Mock JwtRedisProvider
const mockJwtRedisProvider = {
  isTokenBlacklisted: jest.fn(),
  validateSession: jest.fn()
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: 'USER_SERVICE', useValue: mockUserService },
        { provide: JwtRedisProvider, useValue: mockJwtRedisProvider }
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should configure JWT strategy with correct options', () => {
      // Verify that ConfigService was called to get JWT configuration
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_AUDIENCE');
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_ISSUER');
    });
  });

  describe('validate', () => {
    it('should validate a valid JWT payload and return the user', async () => {
      // Setup
      mockJwtRedisProvider.isTokenBlacklisted.mockResolvedValue(false);
      mockUserService.findById.mockResolvedValue(mockUser);
      mockJwtRedisProvider.validateSession.mockResolvedValue(true);

      // Execute
      const result = await strategy.validate(mockValidPayload);

      // Verify
      expect(result).toEqual(mockUser);
      expect(mockJwtRedisProvider.isTokenBlacklisted).toHaveBeenCalledWith(mockValidPayload.jti);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockValidPayload.sub);
      expect(mockJwtRedisProvider.validateSession).toHaveBeenCalledWith(
        mockValidPayload.sid,
        mockValidPayload.sub
      );
    });

    it('should throw AuthenticationError if token is blacklisted', async () => {
      // Setup
      mockJwtRedisProvider.isTokenBlacklisted.mockResolvedValue(true);

      // Execute & Verify
      await expect(strategy.validate(mockValidPayload)).rejects.toThrow(AuthenticationError);
      await expect(strategy.validate(mockValidPayload)).rejects.toThrow('Token has been revoked');
      expect(mockJwtRedisProvider.isTokenBlacklisted).toHaveBeenCalledWith(mockValidPayload.jti);
      expect(mockUserService.findById).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError if user is not found', async () => {
      // Setup
      mockJwtRedisProvider.isTokenBlacklisted.mockResolvedValue(false);
      mockUserService.findById.mockResolvedValue(null);

      // Execute & Verify
      await expect(strategy.validate(mockValidPayload)).rejects.toThrow(AuthenticationError);
      await expect(strategy.validate(mockValidPayload)).rejects.toThrow('User not found');
      expect(mockJwtRedisProvider.isTokenBlacklisted).toHaveBeenCalledWith(mockValidPayload.jti);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockValidPayload.sub);
    });

    it('should throw AuthenticationError if session is invalid', async () => {
      // Setup
      mockJwtRedisProvider.isTokenBlacklisted.mockResolvedValue(false);
      mockUserService.findById.mockResolvedValue(mockUser);
      mockJwtRedisProvider.validateSession.mockResolvedValue(false);

      // Execute & Verify
      await expect(strategy.validate(mockValidPayload)).rejects.toThrow(AuthenticationError);
      await expect(strategy.validate(mockValidPayload)).rejects.toThrow('Invalid session');
      expect(mockJwtRedisProvider.isTokenBlacklisted).toHaveBeenCalledWith(mockValidPayload.jti);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockValidPayload.sub);
      expect(mockJwtRedisProvider.validateSession).toHaveBeenCalledWith(
        mockValidPayload.sid,
        mockValidPayload.sub
      );
    });

    it('should skip session validation if no session ID is provided', async () => {
      // Setup
      const payloadWithoutSession = { ...mockValidPayload, sid: undefined };
      mockJwtRedisProvider.isTokenBlacklisted.mockResolvedValue(false);
      mockUserService.findById.mockResolvedValue(mockUser);

      // Execute
      const result = await strategy.validate(payloadWithoutSession);

      // Verify
      expect(result).toEqual(mockUser);
      expect(mockJwtRedisProvider.isTokenBlacklisted).toHaveBeenCalledWith(mockValidPayload.jti);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockValidPayload.sub);
      expect(mockJwtRedisProvider.validateSession).not.toHaveBeenCalled();
    });

    it('should wrap non-AuthenticationError errors in a standardized AuthenticationError', async () => {
      // Setup
      const errorMessage = 'Database connection failed';
      mockJwtRedisProvider.isTokenBlacklisted.mockResolvedValue(false);
      mockUserService.findById.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute & Verify
      await expect(strategy.validate(mockValidPayload)).rejects.toThrow(AuthenticationError);
      await expect(strategy.validate(mockValidPayload)).rejects.toThrow('Failed to authenticate token');
      expect(mockJwtRedisProvider.isTokenBlacklisted).toHaveBeenCalledWith(mockValidPayload.jti);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockValidPayload.sub);
    });

    it('should rethrow AuthenticationError without wrapping', async () => {
      // Setup
      const authError = new AuthenticationError(
        'Custom auth error',
        'CUSTOM_ERROR',
        { userId: mockValidPayload.sub }
      );
      mockJwtRedisProvider.isTokenBlacklisted.mockResolvedValue(false);
      mockUserService.findById.mockImplementation(() => {
        throw authError;
      });

      // Execute & Verify
      await expect(strategy.validate(mockValidPayload)).rejects.toThrow(authError);
      expect(mockJwtRedisProvider.isTokenBlacklisted).toHaveBeenCalledWith(mockValidPayload.jti);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockValidPayload.sub);
    });
  });
});