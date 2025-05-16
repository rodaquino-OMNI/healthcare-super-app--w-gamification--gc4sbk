/**
 * @file jwt-strategy-guard.integration.spec.ts
 * @description Integration tests for JWT authentication strategy and guard
 *
 * These tests verify that the JwtAuthGuard correctly works with JwtStrategy to validate
 * tokens and protect routes. Tests validate the complete token verification workflow
 * including token extraction, validation, user payload extraction, and Redis-based
 * token blacklisting.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { Redis } from 'ioredis';
import * as request from 'supertest';

// Import from @austa/auth package using path aliases
import { JwtAuthGuard } from '@austa/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '@austa/auth/strategies/jwt.strategy';
import { JwtRedisProvider } from '@austa/auth/providers/jwt/jwt-redis.provider';

// Import from @austa/errors package using path aliases
import { InvalidCredentialsError } from '@austa/errors/categories';

// Import test helpers
import {
  generateTestToken,
  generateExpiredToken,
  generateInvalidSignatureToken,
  TEST_JWT_SECRET,
  TEST_JWT_ISSUER,
  TEST_JWT_AUDIENCE,
} from '../helpers/jwt-token.helper';

// Mock Redis client for testing
class MockRedis {
  private store: Record<string, string> = {};
  private expirations: Record<string, number> = {};

  async set(key: string, value: string): Promise<'OK'> {
    this.store[key] = value;
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    this.store[key] = value;
    this.expirations[key] = Date.now() + seconds * 1000;
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    if (this.expirations[key] && this.expirations[key] < Date.now()) {
      delete this.store[key];
      delete this.expirations[key];
      return null;
    }
    return this.store[key] || null;
  }

  async exists(key: string): Promise<number> {
    if (this.expirations[key] && this.expirations[key] < Date.now()) {
      delete this.store[key];
      delete this.expirations[key];
      return 0;
    }
    return this.store[key] ? 1 : 0;
  }

  async del(key: string): Promise<number> {
    const existed = !!this.store[key];
    delete this.store[key];
    delete this.expirations[key];
    return existed ? 1 : 0;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async quit(): Promise<'OK'> {
    return 'OK';
  }

  on(): void {
    // Mock implementation for event listeners
  }
}

// Mock logger service
class MockLoggerService {
  createLogger() {
    return this;
  }
  debug() {}
  log() {}
  warn() {}
  error() {}
}

// Test controller with protected routes
@Controller('test')
class TestController {
  @Get('public')
  public(): string {
    return 'public route';
  }

  @UseGuards(JwtAuthGuard)
  @Get('protected')
  protected(@Request() req: any): any {
    return { message: 'protected route', user: req.user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('health')
  health(@Request() req: any): any {
    return { message: 'health journey', user: req.user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('care')
  care(@Request() req: any): any {
    return { message: 'care journey', user: req.user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('plan')
  plan(@Request() req: any): any {
    return { message: 'plan journey', user: req.user };
  }
}

describe('JWT Strategy and Guard Integration', () => {
  let app: INestApplication;
  let mockRedis: MockRedis;
  let jwtRedisProvider: JwtRedisProvider<any>;

  beforeAll(async () => {
    // Create a mock Redis instance
    mockRedis = new MockRedis();

    // Create the test module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Configure Passport with JWT
        PassportModule.register({ defaultStrategy: 'jwt' }),
        
        // Configure JWT module
        JwtModule.register({
          secret: TEST_JWT_SECRET,
          signOptions: {
            expiresIn: '1h',
            issuer: TEST_JWT_ISSUER,
            audience: TEST_JWT_AUDIENCE,
          },
        }),
        
        // Configure environment variables
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            jwt: {
              secret: TEST_JWT_SECRET,
              issuer: TEST_JWT_ISSUER,
              audience: TEST_JWT_AUDIENCE,
              accessTokenExpiration: '1h',
            },
          })],
        }),
      ],
      controllers: [TestController],
      providers: [
        // Provide the JWT strategy
        JwtStrategy,
        
        // Provide the Redis JWT provider
        {
          provide: JwtRedisProvider,
          useFactory: (jwtService, configService) => {
            const provider = new JwtRedisProvider(
              jwtService,
              configService,
              {
                redisOptions: {},
                blacklistPrefix: 'blacklist:token:',
              }
            );
            
            // Replace the Redis client with our mock
            Object.defineProperty(provider, 'redisClient', {
              value: mockRedis,
              writable: true,
            });
            
            return provider;
          },
          inject: ['JwtService', ConfigService],
        },
        
        // Provide the JWT service
        {
          provide: 'JwtService',
          useFactory: (jwtModule) => jwtModule.service,
          inject: [JwtModule],
        },
        
        // Provide the logger service
        {
          provide: 'LoggerService',
          useClass: MockLoggerService,
        },
      ],
    })
      .overrideProvider('LoggerService')
      .useClass(MockLoggerService)
      .compile();

    // Create the application
    app = moduleFixture.createNestApplication();
    await app.init();

    // Get the JWT Redis provider for direct testing
    jwtRedisProvider = moduleFixture.get<JwtRedisProvider<any>>(JwtRedisProvider);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public Routes', () => {
    it('should allow access to public routes without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/public')
        .expect(200);

      expect(response.text).toBe('public route');
    });
  });

  describe('Protected Routes with Valid Token', () => {
    it('should allow access to protected routes with a valid token', async () => {
      // Generate a valid token
      const token = generateTestToken({
        userId: 'test-user-123',
        email: 'test@example.com',
        roles: ['user'],
      });

      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('protected route');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe('test-user-123');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should extract user information correctly from the token', async () => {
      // Generate a token with specific user data
      const token = generateTestToken({
        userId: 'user-with-data',
        email: 'data@example.com',
        roles: ['admin', 'user'],
        permissions: ['read:all', 'write:all'],
      });

      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe('user-with-data');
      expect(response.body.user.email).toBe('data@example.com');
      // The JwtStrategy implementation determines what fields are included
      // in the user object, so we may not see all fields from the token
    });

    it('should work with journey-specific routes', async () => {
      // Generate tokens for different journeys
      const healthToken = generateTestToken({
        userId: 'health-user',
        email: 'health@example.com',
        roles: ['user', 'health-journey'],
        additionalClaims: { journey: 'health' },
      });

      const careToken = generateTestToken({
        userId: 'care-user',
        email: 'care@example.com',
        roles: ['user', 'care-journey'],
        additionalClaims: { journey: 'care' },
      });

      const planToken = generateTestToken({
        userId: 'plan-user',
        email: 'plan@example.com',
        roles: ['user', 'plan-journey'],
        additionalClaims: { journey: 'plan' },
      });

      // Test health journey
      const healthResponse = await request(app.getHttpServer())
        .get('/test/health')
        .set('Authorization', `Bearer ${healthToken}`)
        .expect(200);

      expect(healthResponse.body.message).toBe('health journey');
      expect(healthResponse.body.user.id).toBe('health-user');

      // Test care journey
      const careResponse = await request(app.getHttpServer())
        .get('/test/care')
        .set('Authorization', `Bearer ${careToken}`)
        .expect(200);

      expect(careResponse.body.message).toBe('care journey');
      expect(careResponse.body.user.id).toBe('care-user');

      // Test plan journey
      const planResponse = await request(app.getHttpServer())
        .get('/test/plan')
        .set('Authorization', `Bearer ${planToken}`)
        .expect(200);

      expect(planResponse.body.message).toBe('plan journey');
      expect(planResponse.body.user.id).toBe('plan-user');
    });
  });

  describe('Protected Routes with Invalid Token', () => {
    it('should deny access with expired token', async () => {
      // Generate an expired token
      const expiredToken = generateExpiredToken({
        userId: 'expired-user',
        email: 'expired@example.com',
      });

      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toContain('Invalid token');
    });

    it('should deny access with invalid signature', async () => {
      // Generate a token with invalid signature
      const invalidToken = generateInvalidSignatureToken({
        userId: 'invalid-sig-user',
        email: 'invalid-sig@example.com',
      });

      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.message).toContain('Invalid token');
    });

    it('should deny access with malformed token', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', 'Bearer malformed.token.here')
        .expect(401);

      expect(response.body.message).toContain('Invalid token');
    });

    it('should deny access with missing token', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .expect(401);

      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('Token Blacklisting', () => {
    it('should deny access when token is blacklisted', async () => {
      // Generate a valid token
      const token = generateTestToken({
        userId: 'blacklist-test-user',
        email: 'blacklist@example.com',
        roles: ['user'],
      });

      // Verify the token works initially
      await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Blacklist the token
      await jwtRedisProvider.revokeToken(token);

      // Verify the token is now rejected
      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.message).toContain('Invalid token');
    });

    it('should allow access after blacklisted token expires', async () => {
      // Generate a token with very short expiration (2 seconds)
      const token = generateTestToken({
        userId: 'short-lived-user',
        email: 'short-lived@example.com',
        roles: ['user'],
        expiresIn: 2, // 2 seconds
      });

      // Verify the token works initially
      await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Blacklist the token
      await jwtRedisProvider.revokeToken(token);

      // Verify the token is now rejected
      await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      // Wait for the token to expire (3 seconds to be safe)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify the token is still rejected, but now because it's expired
      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('Error Handling', () => {
    it('should return standardized error responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .expect(401);

      // Check for standardized error structure
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body.statusCode).toBe(401);
    });

    it('should handle Redis connection failures gracefully', async () => {
      // Generate a valid token
      const token = generateTestToken({
        userId: 'redis-failure-user',
        email: 'redis-failure@example.com',
      });

      // Mock Redis failure
      const originalExists = mockRedis.exists;
      mockRedis.exists = async () => {
        throw new Error('Redis connection error');
      };

      try {
        // The guard should still allow the request even if Redis fails
        // since we don't want to block legitimate requests due to infrastructure issues
        const response = await request(app.getHttpServer())
          .get('/test/protected')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.message).toBe('protected route');
      } finally {
        // Restore the original method
        mockRedis.exists = originalExists;
      }
    });
  });

  describe('Direct Strategy and Guard Testing', () => {
    let jwtStrategy: JwtStrategy;
    let jwtAuthGuard: JwtAuthGuard;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          PassportModule.register({ defaultStrategy: 'jwt' }),
          JwtModule.register({
            secret: TEST_JWT_SECRET,
            signOptions: {
              expiresIn: '1h',
              issuer: TEST_JWT_ISSUER,
              audience: TEST_JWT_AUDIENCE,
            },
          }),
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({
              jwt: {
                secret: TEST_JWT_SECRET,
                issuer: TEST_JWT_ISSUER,
                audience: TEST_JWT_AUDIENCE,
                accessTokenExpiration: '1h',
              },
            })],
          }),
        ],
        providers: [
          JwtStrategy,
          JwtAuthGuard,
          {
            provide: JwtRedisProvider,
            useFactory: (jwtService, configService) => {
              const provider = new JwtRedisProvider(
                jwtService,
                configService,
                {
                  redisOptions: {},
                  blacklistPrefix: 'blacklist:token:',
                }
              );
              
              // Replace the Redis client with our mock
              Object.defineProperty(provider, 'redisClient', {
                value: mockRedis,
                writable: true,
              });
              
              return provider;
            },
            inject: ['JwtService', ConfigService],
          },
          {
            provide: 'JwtService',
            useFactory: (jwtModule) => jwtModule.service,
            inject: [JwtModule],
          },
          {
            provide: 'LoggerService',
            useClass: MockLoggerService,
          },
        ],
      }).compile();

      jwtStrategy = moduleRef.get<JwtStrategy>(JwtStrategy);
      jwtAuthGuard = moduleRef.get<JwtAuthGuard>(JwtAuthGuard);
    });

    it('should validate a token directly with JwtStrategy', async () => {
      // Generate a valid token
      const token = generateTestToken({
        userId: 'direct-test-user',
        email: 'direct-test@example.com',
      });

      // Create a mock request with the token
      const mockRequest = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      // Call the validate method directly
      const result = await jwtStrategy.validate(mockRequest, {
        sub: 'direct-test-user',
        email: 'direct-test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      // Verify the result
      expect(result).toBeDefined();
      expect(result.id).toBe('direct-test-user');
      expect(result.email).toBe('direct-test@example.com');
    });

    it('should reject an invalid token directly with JwtStrategy', async () => {
      // Generate an invalid token
      const invalidToken = generateInvalidSignatureToken();

      // Create a mock request with the invalid token
      const mockRequest = {
        headers: {
          authorization: `Bearer ${invalidToken}`,
        },
      };

      // Call the validate method directly and expect it to throw
      await expect(jwtStrategy.validate(mockRequest, {
        sub: 'invalid-user',
        email: 'invalid@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })).rejects.toThrow(UnauthorizedException);
    });

    it('should handle JwtAuthGuard.canActivate correctly', async () => {
      // Generate a valid token
      const token = generateTestToken({
        userId: 'guard-test-user',
        email: 'guard-test@example.com',
      });

      // Create a mock execution context
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: `Bearer ${token}`,
            },
          }),
        }),
      } as ExecutionContext;

      // Call canActivate directly
      const result = await jwtAuthGuard.canActivate(mockContext);

      // Verify the result
      expect(result).toBe(true);
    });

    it('should reject invalid tokens in JwtAuthGuard.canActivate', async () => {
      // Generate an invalid token
      const invalidToken = generateInvalidSignatureToken();

      // Create a mock execution context
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: `Bearer ${invalidToken}`,
            },
          }),
        }),
      } as ExecutionContext;

      // Call canActivate directly and expect it to throw
      await expect(jwtAuthGuard.canActivate(mockContext)).rejects.toThrow();
    });
  });
});