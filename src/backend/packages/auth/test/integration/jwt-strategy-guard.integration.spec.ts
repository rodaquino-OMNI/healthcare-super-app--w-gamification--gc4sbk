import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, UnauthorizedException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Request } from 'express';
import * as Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

// Import from @austa/auth package
import { JwtStrategy } from '@austa/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '@austa/auth/guards/jwt-auth.guard';
import { JwtRedisProvider } from '@austa/auth/providers/jwt/jwt-redis.provider';
import { JwtProvider } from '@austa/auth/providers/jwt/jwt.provider';
import { jwtConfig } from '@austa/auth/providers/jwt/jwt.config';

// Import from @austa/errors package
import { AuthenticationError } from '@austa/errors/categories';
import { ValidationError } from '@austa/errors';

// Import from @austa/interfaces package
import { JwtPayload, UserResponseDto } from '@austa/interfaces/auth';

// Import from @austa/logging package
import { LoggerService } from '@austa/logging';

describe('JWT Strategy and Guard Integration', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let jwtRedisProvider: JwtRedisProvider;
  let jwtStrategy: JwtStrategy;
  let jwtAuthGuard: JwtAuthGuard;
  let redisClient: Redis.Redis;
  let configService: ConfigService;
  
  // Mock user data
  const mockUser: UserResponseDto = {
    id: '123456',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['user'],
    permissions: ['read:profile'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock user service
  const mockUserService = {
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === mockUser.id) {
        return Promise.resolve(mockUser);
      }
      return Promise.resolve(null);
    }),
  };

  // Mock logger service
  const mockLoggerService = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeAll(async () => {
    // Create a Redis client for testing
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      db: 1, // Use a different DB for testing
      keyPrefix: 'test:jwt:blacklist:',
    });

    // Clear any existing test data
    await redisClient.flushdb();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        // Configure JWT module for testing
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET') || 'test-secret',
            signOptions: {
              expiresIn: '1h',
              audience: 'test-audience',
              issuer: 'test-issuer',
            },
          }),
          inject: [ConfigService],
        }),
        // Configure Passport module
        PassportModule.register({ defaultStrategy: 'jwt' }),
        // Configure Config module
        ConfigModule.forRoot({
          isGlobal: true,
          load: [jwtConfig],
        }),
      ],
      providers: [
        JwtStrategy,
        JwtProvider,
        JwtRedisProvider,
        {
          provide: 'USER_SERVICE',
          useValue: mockUserService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);
    jwtRedisProvider = moduleRef.get<JwtRedisProvider>(JwtRedisProvider);
    jwtStrategy = moduleRef.get<JwtStrategy>(JwtStrategy);
    configService = moduleRef.get<ConfigService>(ConfigService);
    
    // Create JwtAuthGuard instance with the logger service
    jwtAuthGuard = new JwtAuthGuard(mockLoggerService as LoggerService);
  });

  afterAll(async () => {
    // Clean up Redis test data
    await redisClient.flushdb();
    await redisClient.quit();
    await app.close();
  });

  describe('JwtStrategy', () => {
    it('should validate a valid token and return the user', async () => {
      // Create a valid token payload
      const payload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'test-issuer',
        aud: 'test-audience',
        jti: uuidv4(),
      };

      // Call the validate method directly
      const result = await jwtStrategy.validate(payload);

      // Verify the result
      expect(result).toEqual(mockUser);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw AuthenticationError when user is not found', async () => {
      // Create a token payload with non-existent user
      const payload: JwtPayload = {
        sub: 'non-existent-user',
        email: 'nonexistent@example.com',
        roles: ['user'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'test-issuer',
        aud: 'test-audience',
        jti: uuidv4(),
      };

      // Expect the validate method to throw an error
      await expect(jwtStrategy.validate(payload)).rejects.toThrow(AuthenticationError);
      expect(mockUserService.findById).toHaveBeenCalledWith('non-existent-user');
    });

    it('should throw AuthenticationError when token is blacklisted', async () => {
      // Create a token payload
      const tokenId = uuidv4();
      const payload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'test-issuer',
        aud: 'test-audience',
        jti: tokenId,
      };

      // Blacklist the token
      await jwtRedisProvider.invalidateToken(jwtService.sign(payload));

      // Expect the validate method to throw an error
      await expect(jwtStrategy.validate(payload)).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError when session is invalid', async () => {
      // Create a token payload with session ID
      const sessionId = uuidv4();
      const payload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'test-issuer',
        aud: 'test-audience',
        jti: uuidv4(),
        sid: sessionId,
      };

      // Mock the validateSession method to return false
      jest.spyOn(jwtRedisProvider, 'validateSession').mockResolvedValueOnce(false);

      // Expect the validate method to throw an error
      await expect(jwtStrategy.validate(payload)).rejects.toThrow(AuthenticationError);
      expect(jwtRedisProvider.validateSession).toHaveBeenCalledWith(sessionId, mockUser.id);
    });
  });

  describe('JwtAuthGuard', () => {
    it('should allow access with a valid token', async () => {
      // Create a valid token
      const payload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'test-issuer',
        aud: 'test-audience',
        jti: uuidv4(),
      };
      const token = jwtService.sign(payload);

      // Create a mock execution context
      const mockExecutionContext = createMockExecutionContext(token);

      // Mock the super.canActivate method
      const canActivateSpy = jest.spyOn(JwtAuthGuard.prototype as any, 'canActivate');
      canActivateSpy.mockImplementation(() => true);

      // Call the canActivate method
      const result = await jwtAuthGuard.canActivate(mockExecutionContext);

      // Verify the result
      expect(result).toBe(true);
    });

    it('should throw ValidationError when token is invalid', async () => {
      // Create a mock execution context with an invalid token
      const mockExecutionContext = createMockExecutionContext('invalid-token');

      // Mock the super.canActivate method to throw an error
      const canActivateSpy = jest.spyOn(JwtAuthGuard.prototype as any, 'canActivate');
      canActivateSpy.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Expect the canActivate method to throw a ValidationError
      await expect(jwtAuthGuard.canActivate(mockExecutionContext)).rejects.toThrow(ValidationError);
      expect(mockLoggerService.warn).toHaveBeenCalled();
    });

    it('should throw original error when it is an instance of BaseError', async () => {
      // Create a mock execution context
      const mockExecutionContext = createMockExecutionContext('token');

      // Create a custom error
      const customError = new AuthenticationError(
        'Custom error message',
        'CUSTOM_ERROR_CODE',
        { detail: 'Some detail' }
      );

      // Mock the super.canActivate method to throw the custom error
      const canActivateSpy = jest.spyOn(JwtAuthGuard.prototype as any, 'canActivate');
      canActivateSpy.mockImplementation(() => {
        throw customError;
      });

      // Expect the canActivate method to throw the original error
      await expect(jwtAuthGuard.canActivate(mockExecutionContext)).rejects.toThrow(AuthenticationError);
      expect(mockLoggerService.warn).toHaveBeenCalled();
    });

    it('should handle request properly when user is authenticated', () => {
      // Call the handleRequest method with valid user
      const result = jwtAuthGuard.handleRequest(null, mockUser, null);

      // Verify the result
      expect(result).toEqual(mockUser);
    });

    it('should throw ValidationError when authentication fails', () => {
      // Expect the handleRequest method to throw a ValidationError when user is null
      expect(() => jwtAuthGuard.handleRequest(null, null, null)).toThrow(ValidationError);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should throw ValidationError with error details when authentication error occurs', () => {
      // Create a custom error
      const error = new Error('Authentication failed');

      // Expect the handleRequest method to throw a ValidationError with error details
      expect(() => jwtAuthGuard.handleRequest(error, null, { message: 'Invalid token' })).toThrow(ValidationError);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('End-to-end token flow', () => {
    it('should validate the complete token flow', async () => {
      // 1. Generate a token for the user
      const payload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'test-issuer',
        aud: 'test-audience',
        jti: uuidv4(),
      };
      const token = jwtService.sign(payload);

      // 2. Create a mock execution context with the token
      const mockExecutionContext = createMockExecutionContext(token);

      // 3. Mock the super.canActivate method to simulate successful authentication
      const canActivateSpy = jest.spyOn(JwtAuthGuard.prototype as any, 'canActivate');
      canActivateSpy.mockImplementation(() => true);

      // 4. Call the canActivate method
      const guardResult = await jwtAuthGuard.canActivate(mockExecutionContext);

      // 5. Verify the guard result
      expect(guardResult).toBe(true);

      // 6. Validate the token payload directly with the strategy
      const strategyResult = await jwtStrategy.validate(payload);

      // 7. Verify the strategy result
      expect(strategyResult).toEqual(mockUser);
    });

    it('should handle token revocation properly', async () => {
      // 1. Generate a token for the user
      const tokenId = uuidv4();
      const payload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'test-issuer',
        aud: 'test-audience',
        jti: tokenId,
      };
      const token = jwtService.sign(payload);

      // 2. Revoke the token
      const revocationResult = await jwtRedisProvider.invalidateToken(token);
      expect(revocationResult).toBe(true);

      // 3. Attempt to validate the token with the strategy
      await expect(jwtStrategy.validate(payload)).rejects.toThrow(AuthenticationError);
    });
  });
});

/**
 * Helper function to create a mock execution context for testing
 * @param token JWT token to include in the request
 * @returns Mock execution context
 */
function createMockExecutionContext(token: string): ExecutionContext {
  const mockRequest = {
    headers: {
      authorization: `Bearer ${token}`,
    },
    path: '/test',
    method: 'GET',
    ip: '127.0.0.1',
  } as Request;

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  return mockExecutionContext;
}