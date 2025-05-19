import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@austa/database';
import { LoggerService } from '@austa/logging';
import { AuthService } from '../../src/auth.service';
import { TokenService } from '../../src/token.service';
import { AuthModule } from '../../src/auth.module';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';
import { Roles } from '../../src/decorators/roles.decorator';
import { CurrentUser } from '../../src/decorators/current-user.decorator';
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { User } from '@austa/interfaces/auth';
import { AuthErrorCode } from '../../src/constants';
import { createTestUser, generateValidToken } from './test-helpers';

// Mock journey-specific controllers to test authentication across journeys
@Controller('health')
class HealthController {
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  @Roles('health:viewer')
  getProtectedHealth(@CurrentUser() user: User) {
    return { message: 'Health data accessed', user };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('health:admin')
  getAdminHealth(@CurrentUser() user: User) {
    return { message: 'Health admin data accessed', user };
  }
}

@Controller('care')
class CareController {
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  @Roles('care:viewer')
  getProtectedCare(@CurrentUser() user: User) {
    return { message: 'Care data accessed', user };
  }

  @Get('provider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('care:provider')
  getProviderCare(@CurrentUser() user: User) {
    return { message: 'Care provider data accessed', user };
  }
}

@Controller('plan')
class PlanController {
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  @Roles('plan:viewer')
  getProtectedPlan(@CurrentUser() user: User) {
    return { message: 'Plan data accessed', user };
  }

  @Get('manager')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('plan:manager')
  getManagerPlan(@CurrentUser() user: User) {
    return { message: 'Plan manager data accessed', user };
  }
}

// Mock auth controller for testing registration and login
@Controller('auth')
class AuthTestController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: any) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@CurrentUser() user: User, @Body() refreshDto: { refreshToken: string }) {
    return this.authService.refreshToken(user.id, refreshDto.refreshToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: User) {
    return user;
  }
}

describe('Authentication Flow Integration Tests', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let tokenService: TokenService;
  let authService: AuthService;
  let configService: ConfigService;

  beforeAll(async () => {
    // Create a test module with all required components
    moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
      controllers: [AuthTestController, HealthController, CareController, PlanController],
      providers: [
        {
          provide: PrismaService,
          useFactory: () => ({
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            userRole: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback()),
          }),
        },
        {
          provide: LoggerService,
          useFactory: () => ({
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          }),
        },
      ],
    }).compile();

    // Create a NestJS application instance
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Get service instances for test setup
    prismaService = moduleRef.get<PrismaService>(PrismaService);
    jwtService = moduleRef.get<JwtService>(JwtService);
    tokenService = moduleRef.get<TokenService>(TokenService);
    authService = moduleRef.get<AuthService>(AuthService);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Registration Flow', () => {
    it('should register a new user successfully', async () => {
      // Mock user creation
      const newUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the database operations
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prismaService.user.create as jest.Mock).mockResolvedValueOnce(newUser);
      (prismaService.userRole.create as jest.Mock).mockResolvedValueOnce({ userId: '1', role: 'user' });

      // Mock token generation
      jest.spyOn(tokenService, 'generateToken').mockResolvedValueOnce('mock-access-token');
      jest.spyOn(tokenService, 'generateRefreshToken').mockResolvedValueOnce('mock-refresh-token');

      // Test registration endpoint
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user).not.toHaveProperty('password');

      // Verify database operations were called correctly
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(prismaService.userRole.create).toHaveBeenCalled();
    });

    it('should reject registration with existing email', async () => {
      // Mock existing user
      const existingUser = {
        id: '1',
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database operation to return existing user
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(existingUser);

      // Test registration with existing email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(400);

      // Verify error response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe(AuthErrorCode.USER_ALREADY_EXISTS);
    });

    it('should reject registration with invalid data', async () => {
      // Test registration with invalid data (missing required fields)
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
        })
        .expect(400);

      // Verify validation error response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('validation');
    });
  });

  describe('Login Flow', () => {
    it('should login successfully with valid credentials', async () => {
      // Mock user for login
      const existingUser = {
        id: '1',
        email: 'login@example.com',
        name: 'Login User',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database and authentication operations
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(existingUser);
      (prismaService.userRole.findMany as jest.Mock).mockResolvedValueOnce([
        { role: 'user' },
        { role: 'health:viewer' },
      ]);

      // Mock password verification and token generation
      jest.spyOn(authService as any, 'verifyPassword').mockResolvedValueOnce(true);
      jest.spyOn(tokenService, 'generateToken').mockResolvedValueOnce('mock-access-token');
      jest.spyOn(tokenService, 'generateRefreshToken').mockResolvedValueOnce('mock-refresh-token');

      // Test login endpoint
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        })
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('login@example.com');
      expect(response.body.user.roles).toContain('user');
      expect(response.body.user.roles).toContain('health:viewer');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject login with invalid credentials', async () => {
      // Mock user for login attempt
      const existingUser = {
        id: '1',
        email: 'login@example.com',
        name: 'Login User',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database operation to return user
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(existingUser);

      // Mock password verification to fail
      jest.spyOn(authService as any, 'verifyPassword').mockResolvedValueOnce(false);

      // Test login with invalid password
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe(AuthErrorCode.INVALID_CREDENTIALS);
    });

    it('should reject login for non-existent user', async () => {
      // Mock database operation to return no user
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      // Test login with non-existent email
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe(AuthErrorCode.INVALID_CREDENTIALS);
    });
  });

  describe('Protected Resource Access', () => {
    it('should access protected resource with valid token', async () => {
      // Create a valid user with appropriate roles
      const user = createTestUser({
        id: '1',
        email: 'protected@example.com',
        roles: ['user', 'health:viewer'],
      });

      // Generate a valid token for this user
      const token = await generateValidToken(jwtService, user);

      // Mock token validation
      jest.spyOn(tokenService, 'validateToken').mockResolvedValueOnce(user);

      // Test accessing protected resource
      const response = await request(app.getHttpServer())
        .get('/health/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Health data accessed');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe('1');
    });

    it('should reject access without token', async () => {
      // Test accessing protected resource without token
      const response = await request(app.getHttpServer())
        .get('/health/protected')
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe(AuthErrorCode.UNAUTHORIZED);
    });

    it('should reject access with invalid token', async () => {
      // Test accessing protected resource with invalid token
      const response = await request(app.getHttpServer())
        .get('/health/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe(AuthErrorCode.INVALID_TOKEN);
    });

    it('should reject access with expired token', async () => {
      // Create a user
      const user = createTestUser({
        id: '1',
        email: 'expired@example.com',
        roles: ['user', 'health:viewer'],
      });

      // Generate an expired token
      const token = await generateValidToken(jwtService, user, { expiresIn: '0s' });

      // Mock token validation to throw expired token error
      jest.spyOn(tokenService, 'validateToken').mockRejectedValueOnce({
        code: AuthErrorCode.TOKEN_EXPIRED,
        message: 'Token has expired',
      });

      // Test accessing protected resource with expired token
      const response = await request(app.getHttpServer())
        .get('/health/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe(AuthErrorCode.TOKEN_EXPIRED);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow access to role-protected resource with correct role', async () => {
      // Create a user with admin role
      const adminUser = createTestUser({
        id: '1',
        email: 'admin@example.com',
        roles: ['user', 'health:admin'],
      });

      // Generate a valid token for this user
      const token = await generateValidToken(jwtService, adminUser);

      // Mock token validation and role checking
      jest.spyOn(tokenService, 'validateToken').mockResolvedValueOnce(adminUser);

      // Test accessing admin-protected resource
      const response = await request(app.getHttpServer())
        .get('/health/admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Health admin data accessed');
    });

    it('should deny access to role-protected resource without required role', async () => {
      // Create a user without admin role
      const regularUser = createTestUser({
        id: '2',
        email: 'regular@example.com',
        roles: ['user', 'health:viewer'],
      });

      // Generate a valid token for this user
      const token = await generateValidToken(jwtService, regularUser);

      // Mock token validation
      jest.spyOn(tokenService, 'validateToken').mockResolvedValueOnce(regularUser);

      // Test accessing admin-protected resource
      const response = await request(app.getHttpServer())
        .get('/health/admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Verify error response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe(AuthErrorCode.FORBIDDEN);
    });
  });

  describe('Journey-Specific Authentication', () => {
    it('should access health journey resources with health role', async () => {
      // Create a user with health role
      const healthUser = createTestUser({
        id: '1',
        email: 'health@example.com',
        roles: ['user', 'health:viewer'],
      });

      // Generate a valid token for this user
      const token = await generateValidToken(jwtService, healthUser);

      // Mock token validation
      jest.spyOn(tokenService, 'validateToken').mockResolvedValueOnce(healthUser);

      // Test accessing health resource
      const response = await request(app.getHttpServer())
        .get('/health/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Health data accessed');
    });

    it('should access care journey resources with care role', async () => {
      // Create a user with care role
      const careUser = createTestUser({
        id: '2',
        email: 'care@example.com',
        roles: ['user', 'care:viewer'],
      });

      // Generate a valid token for this user
      const token = await generateValidToken(jwtService, careUser);

      // Mock token validation
      jest.spyOn(tokenService, 'validateToken').mockResolvedValueOnce(careUser);

      // Test accessing care resource
      const response = await request(app.getHttpServer())
        .get('/care/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Care data accessed');
    });

    it('should access plan journey resources with plan role', async () => {
      // Create a user with plan role
      const planUser = createTestUser({
        id: '3',
        email: 'plan@example.com',
        roles: ['user', 'plan:viewer'],
      });

      // Generate a valid token for this user
      const token = await generateValidToken(jwtService, planUser);

      // Mock token validation
      jest.spyOn(tokenService, 'validateToken').mockResolvedValueOnce(planUser);

      // Test accessing plan resource
      const response = await request(app.getHttpServer())
        .get('/plan/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Plan data accessed');
    });

    it('should deny access to journey resources without specific journey role', async () => {
      // Create a user with only health role
      const healthOnlyUser = createTestUser({
        id: '4',
        email: 'healthonly@example.com',
        roles: ['user', 'health:viewer'],
      });

      // Generate a valid token for this user
      const token = await generateValidToken(jwtService, healthOnlyUser);

      // Mock token validation
      jest.spyOn(tokenService, 'validateToken').mockResolvedValueOnce(healthOnlyUser);

      // Test accessing care resource without care role
      const response = await request(app.getHttpServer())
        .get('/care/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Verify error response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe(AuthErrorCode.FORBIDDEN);
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh tokens successfully with valid refresh token', async () => {
      // Create a user
      const user = createTestUser({
        id: '1',
        email: 'refresh@example.com',
        roles: ['user'],
      });

      // Generate a valid token for this user
      const token = await generateValidToken(jwtService, user);
      const refreshToken = 'valid-refresh-token';

      // Mock token validation and refresh
      jest.spyOn(tokenService, 'validateToken').mockResolvedValueOnce(user);
      jest.spyOn(authService, 'refreshToken').mockResolvedValueOnce({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      // Test token refresh
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .send({ refreshToken })
        .expect(201);

      // Verify response
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).toBe('new-access-token');
      expect(response.body.refreshToken).toBe('new-refresh-token');
    });

    it('should reject refresh with invalid refresh token', async () => {
      // Create a user
      const user = createTestUser({
        id: '1',
        email: 'refresh@example.com',
        roles: ['user'],
      });

      // Generate a valid token for this user
      const token = await generateValidToken(jwtService, user);
      const invalidRefreshToken = 'invalid-refresh-token';

      // Mock token validation
      jest.spyOn(tokenService, 'validateToken').mockResolvedValueOnce(user);
      
      // Mock refresh token validation to fail
      jest.spyOn(authService, 'refreshToken').mockRejectedValueOnce({
        code: AuthErrorCode.INVALID_REFRESH_TOKEN,
        message: 'Invalid refresh token',
      });

      // Test token refresh with invalid refresh token
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .send({ refreshToken: invalidRefreshToken })
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe(AuthErrorCode.INVALID_REFRESH_TOKEN);
    });
  });

  describe('Concurrent Authentication Operations', () => {
    it('should handle multiple concurrent login attempts for different users', async () => {
      // Create mock users
      const user1 = {
        id: '1',
        email: 'user1@example.com',
        name: 'User One',
        password: 'hashedPassword1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user2 = {
        id: '2',
        email: 'user2@example.com',
        name: 'User Two',
        password: 'hashedPassword2',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database operations for first user
      (prismaService.user.findUnique as jest.Mock).mockImplementation((params) => {
        if (params.where.email === 'user1@example.com') {
          return Promise.resolve(user1);
        } else if (params.where.email === 'user2@example.com') {
          return Promise.resolve(user2);
        }
        return Promise.resolve(null);
      });

      // Mock roles for both users
      (prismaService.userRole.findMany as jest.Mock).mockImplementation((params) => {
        if (params.where.userId === '1') {
          return Promise.resolve([{ role: 'user' }, { role: 'health:viewer' }]);
        } else if (params.where.userId === '2') {
          return Promise.resolve([{ role: 'user' }, { role: 'care:viewer' }]);
        }
        return Promise.resolve([]);
      });

      // Mock password verification for both users
      jest.spyOn(authService as any, 'verifyPassword').mockResolvedValue(true);

      // Mock token generation with different tokens for each user
      jest.spyOn(tokenService, 'generateToken').mockImplementation((userId, payload) => {
        return Promise.resolve(`token-for-${userId}`);
      });

      jest.spyOn(tokenService, 'generateRefreshToken').mockImplementation((userId) => {
        return Promise.resolve(`refresh-token-for-${userId}`);
      });

      // Execute concurrent login requests
      const [response1, response2] = await Promise.all([
        request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'user1@example.com',
            password: 'Password123!',
          }),
        request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'user2@example.com',
            password: 'Password123!',
          }),
      ]);

      // Verify both responses are successful
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Verify user-specific tokens were generated
      expect(response1.body.accessToken).toBe('token-for-1');
      expect(response2.body.accessToken).toBe('token-for-2');

      // Verify user-specific refresh tokens
      expect(response1.body.refreshToken).toBe('refresh-token-for-1');
      expect(response2.body.refreshToken).toBe('refresh-token-for-2');

      // Verify correct user data in responses
      expect(response1.body.user.email).toBe('user1@example.com');
      expect(response2.body.user.email).toBe('user2@example.com');

      // Verify correct roles in responses
      expect(response1.body.user.roles).toContain('health:viewer');
      expect(response2.body.user.roles).toContain('care:viewer');
    });

    it('should maintain isolation between concurrent authentication operations', async () => {
      // Create mock users with different journey roles
      const healthUser = createTestUser({
        id: '1',
        email: 'health@example.com',
        roles: ['user', 'health:viewer'],
      });

      const careUser = createTestUser({
        id: '2',
        email: 'care@example.com',
        roles: ['user', 'care:viewer'],
      });

      const planUser = createTestUser({
        id: '3',
        email: 'plan@example.com',
        roles: ['user', 'plan:viewer'],
      });

      // Generate tokens for each user
      const healthToken = await generateValidToken(jwtService, healthUser);
      const careToken = await generateValidToken(jwtService, careUser);
      const planToken = await generateValidToken(jwtService, planUser);

      // Mock token validation to return the appropriate user based on the token
      jest.spyOn(tokenService, 'validateToken').mockImplementation((token) => {
        if (token === healthToken) return Promise.resolve(healthUser);
        if (token === careToken) return Promise.resolve(careUser);
        if (token === planToken) return Promise.resolve(planUser);
        return Promise.reject({ code: AuthErrorCode.INVALID_TOKEN });
      });

      // Execute concurrent requests to different journey endpoints
      const [healthResponse, careResponse, planResponse] = await Promise.all([
        request(app.getHttpServer())
          .get('/health/protected')
          .set('Authorization', `Bearer ${healthToken}`),
        request(app.getHttpServer())
          .get('/care/protected')
          .set('Authorization', `Bearer ${careToken}`),
        request(app.getHttpServer())
          .get('/plan/protected')
          .set('Authorization', `Bearer ${planToken}`),
      ]);

      // Verify all responses are successful
      expect(healthResponse.status).toBe(200);
      expect(careResponse.status).toBe(200);
      expect(planResponse.status).toBe(200);

      // Verify correct journey-specific responses
      expect(healthResponse.body.message).toBe('Health data accessed');
      expect(careResponse.body.message).toBe('Care data accessed');
      expect(planResponse.body.message).toBe('Plan data accessed');

      // Verify correct user data in responses
      expect(healthResponse.body.user.email).toBe('health@example.com');
      expect(careResponse.body.user.email).toBe('care@example.com');
      expect(planResponse.body.user.email).toBe('plan@example.com');
    });
  });

  describe('Cross-Journey Authentication', () => {
    it('should allow access to multiple journeys with multi-journey roles', async () => {
      // Create a user with roles for multiple journeys
      const multiJourneyUser = createTestUser({
        id: '1',
        email: 'multi@example.com',
        roles: ['user', 'health:viewer', 'care:viewer', 'plan:viewer'],
      });

      // Generate a valid token for this user
      const token = await generateValidToken(jwtService, multiJourneyUser);

      // Mock token validation to return the multi-journey user
      jest.spyOn(tokenService, 'validateToken').mockResolvedValue(multiJourneyUser);

      // Test accessing resources from all three journeys
      const [healthResponse, careResponse, planResponse] = await Promise.all([
        request(app.getHttpServer())
          .get('/health/protected')
          .set('Authorization', `Bearer ${token}`),
        request(app.getHttpServer())
          .get('/care/protected')
          .set('Authorization', `Bearer ${token}`),
        request(app.getHttpServer())
          .get('/plan/protected')
          .set('Authorization', `Bearer ${token}`),
      ]);

      // Verify all responses are successful
      expect(healthResponse.status).toBe(200);
      expect(careResponse.status).toBe(200);
      expect(planResponse.status).toBe(200);

      // Verify correct journey-specific responses
      expect(healthResponse.body.message).toBe('Health data accessed');
      expect(careResponse.body.message).toBe('Care data accessed');
      expect(planResponse.body.message).toBe('Plan data accessed');

      // Verify all responses contain the same user data
      expect(healthResponse.body.user.id).toBe('1');
      expect(careResponse.body.user.id).toBe('1');
      expect(planResponse.body.user.id).toBe('1');
      expect(healthResponse.body.user.email).toBe('multi@example.com');
    });

    it('should handle role elevation across journeys', async () => {
      // Create a user with different role levels across journeys
      const mixedRoleUser = createTestUser({
        id: '1',
        email: 'mixed@example.com',
        roles: ['user', 'health:admin', 'care:viewer', 'plan:manager'],
      });

      // Generate a valid token for this user
      const token = await generateValidToken(jwtService, mixedRoleUser);

      // Mock token validation
      jest.spyOn(tokenService, 'validateToken').mockResolvedValue(mixedRoleUser);

      // Test accessing elevated privilege resources across journeys
      const [healthAdminResponse, careViewerResponse, planManagerResponse] = await Promise.all([
        request(app.getHttpServer())
          .get('/health/admin')
          .set('Authorization', `Bearer ${token}`),
        request(app.getHttpServer())
          .get('/care/protected')
          .set('Authorization', `Bearer ${token}`),
        request(app.getHttpServer())
          .get('/plan/manager')
          .set('Authorization', `Bearer ${token}`),
      ]);

      // Verify all responses are successful
      expect(healthAdminResponse.status).toBe(200);
      expect(careViewerResponse.status).toBe(200);
      expect(planManagerResponse.status).toBe(200);

      // Verify correct journey-specific responses with appropriate privilege levels
      expect(healthAdminResponse.body.message).toBe('Health admin data accessed');
      expect(careViewerResponse.body.message).toBe('Care data accessed');
      expect(planManagerResponse.body.message).toBe('Plan manager data accessed');
    });
  });
});