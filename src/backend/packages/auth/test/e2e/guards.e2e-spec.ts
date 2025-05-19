/**
 * End-to-end tests for authentication guards
 * 
 * Tests the JwtAuthGuard, RolesGuard, and LocalAuthGuard in real HTTP request scenarios
 * to ensure they correctly protect routes based on authentication status and user roles.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, Post, UseGuards, HttpStatus, Body } from '@nestjs/common';
import * as request from 'supertest';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../../src/guards/local-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';
import { Roles } from '../../src/decorators/roles.decorator';
import { CurrentUser } from '../../src/decorators/current-user.decorator';
import { IUser } from '../../src/interfaces';
import { ErrorService } from '@austa/errors';
import { createTestApp, MockUser } from './test-app';
import {
  generateTestToken,
  generateExpiredToken,
  generateInvalidSignatureToken,
  generateHealthJourneyToken,
  generateCareJourneyToken,
  generatePlanJourneyToken,
  generateAdminToken
} from '../helpers/jwt-token.helper';

// DTO for login requests
class LoginDto {
  username: string;
  password: string;
}

// Test controller for JWT authentication guard
@Controller('test-jwt')
class JwtAuthTestController {
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  getProtectedResource(@CurrentUser() user: IUser) {
    return { message: 'Protected resource accessed successfully', user };
  }

  @Get('public')
  getPublicResource() {
    return { message: 'Public resource accessed successfully' };
  }

  @Get('user-info')
  @UseGuards(JwtAuthGuard)
  getUserInfo(@CurrentUser() user: IUser) {
    return { user };
  }
}

// Test controller for role-based authorization guard
@Controller('test-roles')
class RolesTestController {
  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminResource(@CurrentUser() user: IUser) {
    return { message: 'Admin resource accessed successfully', user };
  }

  @Get('user-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  getUserResource(@CurrentUser() user: IUser) {
    return { message: 'User resource accessed successfully', user };
  }

  @Get('multi-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  getMultiRoleResource(@CurrentUser() user: IUser) {
    return { message: 'Multi-role resource accessed successfully', user };
  }
}

// Test controller for journey-specific authorization
@Controller('test-journey')
class JourneyTestController {
  @Get('health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('health:viewer')
  getHealthResource(@CurrentUser() user: IUser) {
    return { message: 'Health journey resource accessed successfully', user };
  }

  @Get('care')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('care:user')
  getCareResource(@CurrentUser() user: IUser) {
    return { message: 'Care journey resource accessed successfully', user };
  }

  @Get('plan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('plan:user')
  getPlanResource(@CurrentUser() user: IUser) {
    return { message: 'Plan journey resource accessed successfully', user };
  }

  @Get('cross-journey')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('health:viewer', 'care:user', 'plan:user')
  getCrossJourneyResource(@CurrentUser() user: IUser) {
    return { message: 'Cross-journey resource accessed successfully', user };
  }
}

// Test controller for local authentication guard
@Controller('test-local')
class LocalAuthTestController {
  @Post('login')
  @UseGuards(LocalAuthGuard)
  login(@Body() loginDto: LoginDto, @CurrentUser() user: IUser) {
    return { message: 'Login successful', user };
  }
}

describe('Auth Guards (e2e)', () => {
  let app: INestApplication;
  let errorService: ErrorService;

  beforeAll(async () => {
    // Create test application with our test controllers
    app = await createTestApp({
      controllers: [
        JwtAuthTestController,
        RolesTestController,
        JourneyTestController,
        LocalAuthTestController
      ],
      // Define test users with different roles for testing
      mockUsers: [
        {
          id: '1',
          email: 'user@example.com',
          password: 'password123',
          roles: ['user'],
          journeyRoles: []
        },
        {
          id: '2',
          email: 'admin@example.com',
          password: 'admin123',
          roles: ['admin', 'user'],
          journeyRoles: ['health:admin', 'care:admin', 'plan:admin']
        },
        {
          id: '3',
          email: 'health@example.com',
          password: 'health123',
          roles: ['user'],
          journeyRoles: ['health:viewer']
        },
        {
          id: '4',
          email: 'care@example.com',
          password: 'care123',
          roles: ['user'],
          journeyRoles: ['care:user']
        },
        {
          id: '5',
          email: 'plan@example.com',
          password: 'plan123',
          roles: ['user'],
          journeyRoles: ['plan:user']
        },
        {
          id: '6',
          email: 'multi@example.com',
          password: 'multi123',
          roles: ['user', 'manager'],
          journeyRoles: ['health:viewer', 'care:user', 'plan:user']
        }
      ]
    });

    // Get the error service from the application
    errorService = app.get<ErrorService>(ErrorService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('JwtAuthGuard', () => {
    it('should allow access to public routes without authentication', async () => {
      // Test accessing a public route without authentication
      const response = await request(app.getHttpServer())
        .get('/test-jwt/public')
        .expect(HttpStatus.OK);

      // Verify the response
      expect(response.body).toEqual({ message: 'Public resource accessed successfully' });
    });

    it('should allow access to protected routes with valid JWT token', async () => {
      // Generate a valid token for user with ID 1
      const token = generateTestToken({ userId: '1' });

      // Test accessing a protected route with valid authentication
      const response = await request(app.getHttpServer())
        .get('/test-jwt/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      // Verify the response contains the success message and user data
      expect(response.body).toHaveProperty('message', 'Protected resource accessed successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', '1');
    });

    it('should deny access to protected routes without authentication', async () => {
      // Test accessing a protected route without authentication
      const response = await request(app.getHttpServer())
        .get('/test-jwt/protected')
        .expect(HttpStatus.UNAUTHORIZED);

      // Verify the error response structure
      expect(response.body).toHaveProperty('statusCode', HttpStatus.UNAUTHORIZED);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });

    it('should deny access with expired JWT token', async () => {
      // Generate an expired token
      const expiredToken = generateExpiredToken({ userId: '1' });

      // Test accessing a protected route with expired token
      const response = await request(app.getHttpServer())
        .get('/test-jwt/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(HttpStatus.UNAUTHORIZED);

      // Verify the error response structure
      expect(response.body).toHaveProperty('statusCode', HttpStatus.UNAUTHORIZED);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });

    it('should deny access with invalid JWT token signature', async () => {
      // Generate a token with invalid signature
      const invalidToken = generateInvalidSignatureToken({ userId: '1' });

      // Test accessing a protected route with invalid token
      const response = await request(app.getHttpServer())
        .get('/test-jwt/protected')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(HttpStatus.UNAUTHORIZED);

      // Verify the error response structure
      expect(response.body).toHaveProperty('statusCode', HttpStatus.UNAUTHORIZED);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });

    it('should deny access with malformed JWT token', async () => {
      // Test accessing a protected route with malformed token
      const response = await request(app.getHttpServer())
        .get('/test-jwt/protected')
        .set('Authorization', 'Bearer malformed.token.here')
        .expect(HttpStatus.UNAUTHORIZED);

      // Verify the error response structure
      expect(response.body).toHaveProperty('statusCode', HttpStatus.UNAUTHORIZED);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });

    it('should extract user information correctly from valid token', async () => {
      // Generate a valid token for user with ID 1
      const token = generateTestToken({
        userId: '1',
        email: 'user@example.com',
        roles: ['user']
      });

      // Test accessing user info endpoint
      const response = await request(app.getHttpServer())
        .get('/test-jwt/user-info')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      // Verify the user information is correctly extracted
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', '1');
      expect(response.body.user).toHaveProperty('email', 'user@example.com');
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user.roles).toContain('user');
    });
  });

  describe('RolesGuard', () => {
    it('should allow access to admin-only resource for admin users', async () => {
      // Generate a token for admin user
      const adminToken = generateAdminToken({ userId: '2' });

      // Test accessing admin-only resource with admin token
      const response = await request(app.getHttpServer())
        .get('/test-roles/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      // Verify the response
      expect(response.body).toHaveProperty('message', 'Admin resource accessed successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user.roles).toContain('admin');
    });

    it('should deny access to admin-only resource for non-admin users', async () => {
      // Generate a token for regular user
      const userToken = generateTestToken({ userId: '1', roles: ['user'] });

      // Test accessing admin-only resource with regular user token
      const response = await request(app.getHttpServer())
        .get('/test-roles/admin-only')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);

      // Verify the error response structure
      expect(response.body).toHaveProperty('statusCode', HttpStatus.FORBIDDEN);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });

    it('should allow access to user-only resource for users', async () => {
      // Generate a token for regular user
      const userToken = generateTestToken({ userId: '1', roles: ['user'] });

      // Test accessing user-only resource with user token
      const response = await request(app.getHttpServer())
        .get('/test-roles/user-only')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      // Verify the response
      expect(response.body).toHaveProperty('message', 'User resource accessed successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user.roles).toContain('user');
    });

    it('should allow access to multi-role resource for users with any required role', async () => {
      // Generate a token for manager user
      const managerToken = generateTestToken({ userId: '6', roles: ['user', 'manager'] });

      // Test accessing multi-role resource with manager token
      const response = await request(app.getHttpServer())
        .get('/test-roles/multi-role')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(HttpStatus.OK);

      // Verify the response
      expect(response.body).toHaveProperty('message', 'Multi-role resource accessed successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user.roles).toContain('manager');
    });

    it('should deny access to multi-role resource for users without any required role', async () => {
      // Generate a token for regular user without manager role
      const userToken = generateTestToken({ userId: '1', roles: ['user'] });

      // Test accessing multi-role resource with regular user token
      const response = await request(app.getHttpServer())
        .get('/test-roles/multi-role')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);

      // Verify the error response structure
      expect(response.body).toHaveProperty('statusCode', HttpStatus.FORBIDDEN);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Journey-Specific Authorization', () => {
    it('should allow access to health journey resource for health viewers', async () => {
      // Generate a token for health journey user
      const healthToken = generateHealthJourneyToken({ userId: '3', roles: ['user', 'health:viewer'] });

      // Test accessing health journey resource
      const response = await request(app.getHttpServer())
        .get('/test-journey/health')
        .set('Authorization', `Bearer ${healthToken}`)
        .expect(HttpStatus.OK);

      // Verify the response
      expect(response.body).toHaveProperty('message', 'Health journey resource accessed successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user.roles).toContain('health:viewer');
    });

    it('should allow access to care journey resource for care users', async () => {
      // Generate a token for care journey user
      const careToken = generateCareJourneyToken({ userId: '4', roles: ['user', 'care:user'] });

      // Test accessing care journey resource
      const response = await request(app.getHttpServer())
        .get('/test-journey/care')
        .set('Authorization', `Bearer ${careToken}`)
        .expect(HttpStatus.OK);

      // Verify the response
      expect(response.body).toHaveProperty('message', 'Care journey resource accessed successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user.roles).toContain('care:user');
    });

    it('should allow access to plan journey resource for plan users', async () => {
      // Generate a token for plan journey user
      const planToken = generatePlanJourneyToken({ userId: '5', roles: ['user', 'plan:user'] });

      // Test accessing plan journey resource
      const response = await request(app.getHttpServer())
        .get('/test-journey/plan')
        .set('Authorization', `Bearer ${planToken}`)
        .expect(HttpStatus.OK);

      // Verify the response
      expect(response.body).toHaveProperty('message', 'Plan journey resource accessed successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user.roles).toContain('plan:user');
    });

    it('should deny access to health journey resource for non-health users', async () => {
      // Generate a token for care journey user without health role
      const careToken = generateCareJourneyToken({ userId: '4', roles: ['user', 'care:user'] });

      // Test accessing health journey resource with care user token
      const response = await request(app.getHttpServer())
        .get('/test-journey/health')
        .set('Authorization', `Bearer ${careToken}`)
        .expect(HttpStatus.FORBIDDEN);

      // Verify the error response structure
      expect(response.body).toHaveProperty('statusCode', HttpStatus.FORBIDDEN);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });

    it('should allow access to cross-journey resource for users with any required journey role', async () => {
      // Generate a token for multi-journey user
      const multiToken = generateTestToken({
        userId: '6',
        roles: ['user', 'health:viewer', 'care:user', 'plan:user']
      });

      // Test accessing cross-journey resource
      const response = await request(app.getHttpServer())
        .get('/test-journey/cross-journey')
        .set('Authorization', `Bearer ${multiToken}`)
        .expect(HttpStatus.OK);

      // Verify the response
      expect(response.body).toHaveProperty('message', 'Cross-journey resource accessed successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('roles');
      // Check that the user has at least one of the required journey roles
      const hasJourneyRole = response.body.user.roles.some(role => [
        'health:viewer', 'care:user', 'plan:user'
      ].includes(role));
      expect(hasJourneyRole).toBe(true);
    });
  });

  describe('LocalAuthGuard', () => {
    it('should authenticate user with valid credentials', async () => {
      // Test login with valid credentials
      const response = await request(app.getHttpServer())
        .post('/test-local/login')
        .send({ username: 'user@example.com', password: 'password123' })
        .expect(HttpStatus.OK);

      // Verify the response
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', '1');
      expect(response.body.user).toHaveProperty('email', 'user@example.com');
    });

    it('should reject authentication with invalid credentials', async () => {
      // Test login with invalid credentials
      const response = await request(app.getHttpServer())
        .post('/test-local/login')
        .send({ username: 'user@example.com', password: 'wrong-password' })
        .expect(HttpStatus.UNAUTHORIZED);

      // Verify the error response structure
      expect(response.body).toHaveProperty('statusCode', HttpStatus.UNAUTHORIZED);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });

    it('should reject authentication with non-existent user', async () => {
      // Test login with non-existent user
      const response = await request(app.getHttpServer())
        .post('/test-local/login')
        .send({ username: 'nonexistent@example.com', password: 'password123' })
        .expect(HttpStatus.UNAUTHORIZED);

      // Verify the error response structure
      expect(response.body).toHaveProperty('statusCode', HttpStatus.UNAUTHORIZED);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Handling Integration', () => {
    it('should return standardized error response for unauthorized access', async () => {
      // Test accessing a protected route without authentication
      const response = await request(app.getHttpServer())
        .get('/test-jwt/protected')
        .expect(HttpStatus.UNAUTHORIZED);

      // Verify the error response structure follows the standardized format
      expect(response.body).toHaveProperty('statusCode', HttpStatus.UNAUTHORIZED);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path', '/test-jwt/protected');
    });

    it('should return standardized error response for insufficient permissions', async () => {
      // Generate a token for regular user
      const userToken = generateTestToken({ userId: '1', roles: ['user'] });

      // Test accessing admin-only resource with regular user token
      const response = await request(app.getHttpServer())
        .get('/test-roles/admin-only')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);

      // Verify the error response structure follows the standardized format
      expect(response.body).toHaveProperty('statusCode', HttpStatus.FORBIDDEN);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path', '/test-roles/admin-only');
    });

    it('should include journey-specific error codes for journey authorization failures', async () => {
      // Generate a token for care journey user without health role
      const careToken = generateCareJourneyToken({ userId: '4', roles: ['user', 'care:user'] });

      // Test accessing health journey resource with care user token
      const response = await request(app.getHttpServer())
        .get('/test-journey/health')
        .set('Authorization', `Bearer ${careToken}`)
        .expect(HttpStatus.FORBIDDEN);

      // Verify the error response includes journey-specific error code
      expect(response.body).toHaveProperty('statusCode', HttpStatus.FORBIDDEN);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('errorCode');
      expect(response.body.errorCode).toMatch(/^HEALTH_/); // Health journey error code prefix
    });
  });
});