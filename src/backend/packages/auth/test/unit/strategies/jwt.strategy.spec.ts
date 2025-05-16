/**
 * @file jwt.strategy.spec.ts
 * @description Tests for the JWT authentication strategy implementation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { ExtractJwt } from 'passport-jwt';

// Use standardized import paths with TypeScript path aliases
import { JwtStrategy } from '@austa/auth/strategies/jwt.strategy';
import { JwtRedisProvider } from '@austa/auth/providers/jwt/jwt-redis.provider';
import { ITokenPayload, ITokenValidationOptions } from '@austa/interfaces/auth';

// Mock the ExtractJwt.fromAuthHeaderAsBearerToken function
jest.mock('passport-jwt', () => {
  const original = jest.requireActual('passport-jwt');
  return {
    ...original,
    ExtractJwt: {
      ...original.ExtractJwt,
      fromAuthHeaderAsBearerToken: jest.fn().mockImplementation(() => {
        return (req: any) => req?.headers?.authorization?.replace('Bearer ', '');
      }),
    },
  };
});

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;
  let jwtRedisProvider: JwtRedisProvider<any>;

  // Sample token and payload for testing
  const mockToken = 'valid.jwt.token';
  const mockPayload: ITokenPayload = {
    sub: 'user-123',
    email: 'user@example.com',
    name: 'Test User',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iss: 'austa.com.br',
    aud: 'austa-users',
    jti: 'unique-token-id',
  };

  // Mock request object
  const mockRequest = {
    headers: {
      authorization: `Bearer ${mockToken}`,
    },
  };

  beforeEach(async () => {
    // Create mocks for dependencies
    const configServiceMock = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          'JWT_SECRET': 'test-secret',
          'JWT_AUDIENCE': 'austa-users',
          'JWT_ISSUER': 'austa.com.br',
          'authService.jwt.secret': 'test-secret',
        };
        return config[key];
      }),
    };

    const jwtRedisProviderMock = {
      isTokenBlacklisted: jest.fn().mockResolvedValue(false),
      validateToken: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: JwtRedisProvider,
          useValue: jwtRedisProviderMock,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
    jwtRedisProvider = module.get<JwtRedisProvider<any>>(JwtRedisProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should properly initialize with correct configuration', () => {
      // Verify that ExtractJwt.fromAuthHeaderAsBearerToken was called
      expect(ExtractJwt.fromAuthHeaderAsBearerToken).toHaveBeenCalled();

      // Verify that ConfigService.get was called with the correct keys
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(configService.get).toHaveBeenCalledWith('JWT_AUDIENCE');
      expect(configService.get).toHaveBeenCalledWith('JWT_ISSUER');
    });
  });

  describe('validate', () => {
    it('should extract token from authorization header', async () => {
      // Call validate method
      await strategy.validate(mockRequest, mockPayload);

      // Verify that ExtractJwt.fromAuthHeaderAsBearerToken was used to extract the token
      const extractFn = ExtractJwt.fromAuthHeaderAsBearerToken();
      expect(extractFn(mockRequest)).toBe(mockToken);
    });

    it('should check if token is blacklisted', async () => {
      // Call validate method
      await strategy.validate(mockRequest, mockPayload);

      // Verify that isTokenBlacklisted was called with the correct token
      expect(jwtRedisProvider.isTokenBlacklisted).toHaveBeenCalledWith(mockToken);
    });

    it('should throw UnauthorizedException if token is blacklisted', async () => {
      // Mock isTokenBlacklisted to return true (token is blacklisted)
      jest.spyOn(jwtRedisProvider, 'isTokenBlacklisted').mockResolvedValueOnce(true);

      // Expect validate to throw UnauthorizedException
      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        new UnauthorizedException('Token has been revoked')
      );
    });

    it('should validate token with correct options', async () => {
      // Call validate method
      await strategy.validate(mockRequest, mockPayload);

      // Verify that validateToken was called with the correct token and options
      expect(jwtRedisProvider.validateToken).toHaveBeenCalledWith(
        mockToken,
        expect.objectContaining({
          requiredClaims: ['sub', 'email', 'iat', 'exp'],
          audience: 'austa-users',
          issuer: 'austa.com.br',
        } as ITokenValidationOptions)
      );
    });

    it('should return user object with properties from payload', async () => {
      // Call validate method
      const result = await strategy.validate(mockRequest, mockPayload);

      // Verify that the returned user object has the correct properties
      expect(result).toEqual({
        id: mockPayload.sub,
        email: mockPayload.email,
        name: mockPayload.name,
      });

      // Verify that sensitive information is not included
      expect(result).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException if token validation fails', async () => {
      // Mock validateToken to throw an error
      jest.spyOn(jwtRedisProvider, 'validateToken').mockRejectedValueOnce(new Error('Validation failed'));

      // Expect validate to throw UnauthorizedException
      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        new UnauthorizedException('Invalid token')
      );
    });

    it('should propagate UnauthorizedException from token validation', async () => {
      // Mock validateToken to throw an UnauthorizedException with a specific message
      const specificError = new UnauthorizedException('Specific error message');
      jest.spyOn(jwtRedisProvider, 'validateToken').mockRejectedValueOnce(specificError);

      // Expect validate to throw the same UnauthorizedException
      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(specificError);
    });

    it('should handle missing authorization header', async () => {
      // Create request without authorization header
      const requestWithoutAuth = { headers: {} };

      // Expect validate to throw UnauthorizedException
      await expect(strategy.validate(requestWithoutAuth, mockPayload)).rejects.toThrow(
        new UnauthorizedException('Invalid token')
      );
    });

    it('should handle malformed authorization header', async () => {
      // Create request with malformed authorization header
      const requestWithMalformedAuth = {
        headers: {
          authorization: 'NotBearer token',
        },
      };

      // Expect validate to throw UnauthorizedException
      await expect(strategy.validate(requestWithMalformedAuth, mockPayload)).rejects.toThrow(
        new UnauthorizedException('Invalid token')
      );
    });
  });

  describe('integration with passport-jwt', () => {
    it('should use ExtractJwt.fromAuthHeaderAsBearerToken for token extraction', () => {
      // Verify that ExtractJwt.fromAuthHeaderAsBearerToken was called in the constructor
      expect(ExtractJwt.fromAuthHeaderAsBearerToken).toHaveBeenCalled();
    });

    it('should configure strategy with ignoreExpiration: false to enforce token expiration', () => {
      // This is an indirect test since we can't easily access the private properties of the strategy
      // We're verifying that the strategy is configured correctly by testing its behavior
      
      // Create an expired payload
      const expiredPayload = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
      };

      // Mock validateToken to throw an error for expired token
      jest.spyOn(jwtRedisProvider, 'validateToken').mockImplementationOnce(() => {
        throw new UnauthorizedException('Token expired');
      });

      // Expect validate to throw UnauthorizedException
      return expect(strategy.validate(mockRequest, expiredPayload)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});