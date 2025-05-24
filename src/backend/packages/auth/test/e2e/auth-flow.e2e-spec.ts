/**
 * End-to-end tests for authentication flows
 * 
 * Tests the complete authentication flow including registration, login, token validation,
 * token refresh, and accessing protected resources. Verifies both success and failure paths
 * with proper error handling and response structures.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../../src/auth.module';
import { createTestApp } from './test-app';
import {
  TEST_USERS,
  TEST_AUTH_SCENARIOS,
  JOURNEY_TEST_CONSTANTS,
} from '../helpers/test-constants.helper';
import {
  generateTestToken,
  generateExpiredToken,
  generateInvalidSignatureToken,
  TokenExpiration,
} from '../helpers/jwt-token.helper';
import { assertAuth } from '../helpers/auth-assertion.helper';
import { ErrorType } from '@austa/errors';
import { JOURNEY_IDS } from '@austa/interfaces';

describe('Authentication Flow (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let jwtService: JwtService;

  beforeAll(async () => {
    // Create a testing module with AuthModule and test controllers
    moduleFixture = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    // Create the test application
    app = await createTestApp(moduleFixture, {
      user: TEST_USERS.REGULAR_USER,
      controllers: true,
    });

    // Get the JWT service for token generation and validation
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Registration Flow', () => {
    const validRegistration = {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      firstName: 'New',
      lastName: 'User',
    };

    it('should register a new user with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegistration)
        .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', validRegistration.email);
      expect(response.body).toHaveProperty('firstName', validRegistration.firstName);
      expect(response.body).toHaveProperty('lastName', validRegistration.lastName);
      expect(response.body).toHaveProperty('isActive', true);
      expect(response.body).toHaveProperty('isVerified');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      
      // Ensure password is not returned
      expect(response.body).not.toHaveProperty('password');
      
      // Verify token is returned
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
      
      // Use auth assertions to verify user properties
      assertAuth(response.body)
        .isAuthenticated()
        .hasEmail(validRegistration.email)
        .hasValidToken();
    });

    it('should reject registration with missing required fields', async () => {
      const invalidRegistration = {
        email: 'incomplete@example.com',
        // Missing password
        firstName: 'Incomplete',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidRegistration)
        .expect(400);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
      
      // Use auth assertions to verify error properties
      assertAuth(response.body)
        .hasErrorType(ErrorType.VALIDATION)
        .hasErrorMessageContaining('password');
    });

    it('should reject registration with invalid email format', async () => {
      const invalidEmailRegistration = {
        ...validRegistration,
        email: 'not-an-email',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidEmailRegistration)
        .expect(400);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 400);
      
      // Use auth assertions to verify error properties
      assertAuth(response.body)
        .hasErrorType(ErrorType.VALIDATION)
        .hasErrorMessageContaining('email');
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordRegistration = {
        ...validRegistration,
        password: 'weak',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(weakPasswordRegistration)
        .expect(400);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 400);
      
      // Use auth assertions to verify error properties
      assertAuth(response.body)
        .hasErrorType(ErrorType.VALIDATION)
        .hasErrorMessageContaining('password');
    });

    it('should reject registration with duplicate email', async () => {
      // First registration should succeed
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'SecurePassword123!',
          firstName: 'Duplicate',
          lastName: 'User',
        })
        .expect(201);

      // Second registration with same email should fail
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'DifferentPassword456!',
          firstName: 'Another',
          lastName: 'User',
        })
        .expect(409);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 409);
      
      // Use auth assertions to verify error properties
      assertAuth(response.body)
        .hasErrorType(ErrorType.CONFLICT)
        .hasErrorCode('USER_ALREADY_EXISTS')
        .hasErrorMessageContaining('already exists');
    });
  });

  describe('Login Flow', () => {
    it('should authenticate user with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(TEST_AUTH_SCENARIOS.VALID_LOGIN)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      
      // Ensure password is not returned
      expect(response.body.user).not.toHaveProperty('password');
      
      // Verify tokens are valid JWT format
      expect(response.body.access_token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
      expect(response.body.refresh_token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
      
      // Use auth assertions to verify user properties
      assertAuth(response.body)
        .isAuthenticated()
        .hasEmail(TEST_AUTH_SCENARIOS.VALID_LOGIN.email);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(TEST_AUTH_SCENARIOS.INVALID_LOGIN)
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 401);
      
      // Use auth assertions to verify error properties
      assertAuth(response.body)
        .hasErrorType(ErrorType.UNAUTHORIZED)
        .hasErrorCode('INVALID_CREDENTIALS')
        .hasErrorMessageContaining('Invalid credentials');
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(TEST_AUTH_SCENARIOS.INVALID_PASSWORD)
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 401);
      
      // Use auth assertions to verify error properties
      assertAuth(response.body)
        .hasErrorType(ErrorType.UNAUTHORIZED)
        .hasErrorCode('INVALID_CREDENTIALS')
        .hasErrorMessageContaining('Invalid credentials');
    });

    it('should reject login for inactive account', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(TEST_AUTH_SCENARIOS.INACTIVE_ACCOUNT)
        .expect(403);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 403);
      
      // Use auth assertions to verify error properties
      assertAuth(response.body)
        .hasErrorType(ErrorType.FORBIDDEN)
        .hasErrorCode('ACCOUNT_INACTIVE')
        .hasErrorMessageContaining('inactive');
    });

    it('should reject login for unverified account', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(TEST_AUTH_SCENARIOS.UNVERIFIED_ACCOUNT)
        .expect(403);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 403);
      
      // Use auth assertions to verify error properties
      assertAuth(response.body)
        .hasErrorType(ErrorType.FORBIDDEN)
        .hasErrorCode('ACCOUNT_UNVERIFIED')
        .hasErrorMessageContaining('verified');
    });
  });

  describe('Token Validation and Protected Resources', () => {
    it('should allow access to protected route with valid token', async () => {
      // Generate a valid token
      const { token } = generateTestToken({
        userId: TEST_USERS.REGULAR_USER.id,
        email: TEST_USERS.REGULAR_USER.email,
        roles: TEST_USERS.REGULAR_USER.roles.map(r => r.id),
      });

      const response = await request(app.getHttpServer())
        .get('/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('userId', TEST_USERS.REGULAR_USER.id);
      expect(response.body).toHaveProperty('message', 'Protected route accessed successfully');
    });

    it('should reject access to protected route without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/protected')
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 401);
      
      // Use auth assertions to verify error properties
      assertAuth(response.body)
        .hasErrorType(ErrorType.UNAUTHORIZED)
        .hasErrorCode('MISSING_TOKEN')
        .hasErrorMessageContaining('authentication');
    });

    it('should reject access to protected route with expired token', async () => {
      // Generate an expired token
      const { token } = generateExpiredToken({
        userId: TEST_USERS.REGULAR_USER.id,
        email: TEST_USERS.REGULAR_USER.email,
      });

      const response = await request(app.getHttpServer())
        .get('/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 401);
      
      // Use auth assertions to verify error properties
      assertAuth(response.body)
        .hasErrorType(ErrorType.UNAUTHORIZED)
        .hasErrorCode('TOKEN_EXPIRED')
        .hasErrorMessageContaining('expired');
    });

    it('should reject access to protected route with invalid token signature', async () => {
      // Generate a token with invalid signature
      const { token } = generateInvalidSignatureToken({
        userId: TEST_USERS.REGULAR_USER.id,
        email: TEST_USERS.REGULAR_USER.email,
      });

      const response = await request(app.getHttpServer())
        .get('/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 401);
      
      // Use auth assertions to verify error properties
      assertAuth(response.body)
        .hasErrorType(ErrorType.UNAUTHORIZED)
        .hasErrorCode('INVALID_TOKEN')
        .hasErrorMessageContaining('invalid');
    });

    it('should reject access to protected route with malformed token', async () => {
      const response = await request(app.getHttpServer())
        .get('/protected')
        .set('Authorization', 'Bearer malformed.token.value')
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 401);
      
      // Use auth assertions to verify error properties
      assertAuth(response.body)
        .hasErrorType(ErrorType.UNAUTHORIZED)
        .hasErrorCode('INVALID_TOKEN')
        .hasErrorMessageContaining('invalid');
    });
  });

  describe('Token Refresh Flow', () => {
    it('should issue a new access token with valid refresh token', async () => {
      // First login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(TEST_AUTH_SCENARIOS.VALID_LOGIN)
        .expect(200);

      // Extract refresh token
      const refreshToken = loginResponse.body.refresh_token;

      // Use refresh token to get new access token
      const response = await request(app.getHttpServer())
        .post('/refresh-token')
        .send({ refresh_token: refreshToken })
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('access_token');
      expect(response.body.access_token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
      
      // Verify the new token works for protected routes
      await request(app.getHttpServer())
        .get('/protected')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(200);
    });

    it('should reject refresh with invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/refresh-token')
        .send({ refresh_token: 'invalid.refresh.token' })
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid refresh token');
    });

    it('should reject refresh with expired refresh token', async () => {
      // Generate an expired token with refresh type
      const { token } = generateExpiredToken({
        userId: TEST_USERS.REGULAR_USER.id,
        email: TEST_USERS.REGULAR_USER.email,
        customClaims: { type: 'refresh' },
      });

      const response = await request(app.getHttpServer())
        .post('/refresh-token')
        .send({ refresh_token: token })
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid refresh token');
    });

    it('should reject refresh with access token instead of refresh token', async () => {
      // Generate a valid access token (without refresh type)
      const { token } = generateTestToken({
        userId: TEST_USERS.REGULAR_USER.id,
        email: TEST_USERS.REGULAR_USER.email,
      });

      const response = await request(app.getHttpServer())
        .post('/refresh-token')
        .send({ refresh_token: token })
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid token type');
    });
  });

  describe('User Profile Access', () => {
    it('should return user profile with valid token', async () => {
      // Generate a valid token
      const { token } = generateTestToken({
        userId: TEST_USERS.REGULAR_USER.id,
        email: TEST_USERS.REGULAR_USER.email,
        roles: TEST_USERS.REGULAR_USER.roles.map(r => r.id),
      });

      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify response contains user data
      expect(response.body).toHaveProperty('id', TEST_USERS.REGULAR_USER.id);
      expect(response.body).toHaveProperty('email', TEST_USERS.REGULAR_USER.email);
      
      // Ensure password is not returned
      expect(response.body).not.toHaveProperty('password');
      
      // Use auth assertions to verify user properties
      assertAuth(response.body)
        .hasEmail(TEST_USERS.REGULAR_USER.email);
    });

    it('should reject profile access without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 401);
      
      // Use auth assertions to verify error properties
      assertAuth(response.body)
        .hasErrorType(ErrorType.UNAUTHORIZED)
        .hasErrorMessageContaining('authentication');
    });
  });

  describe('Journey-Specific Authentication', () => {
    it('should allow access to health journey with health role', async () => {
      // Generate a token with health journey access
      const { token } = generateTestToken({
        userId: TEST_USERS.HEALTH_USER.id,
        email: TEST_USERS.HEALTH_USER.email,
        roles: TEST_USERS.HEALTH_USER.roles.map(r => r.id),
        journey: JOURNEY_IDS.HEALTH,
      });

      const response = await request(app.getHttpServer())
        .get('/health-journey')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('message', 'Health journey accessed successfully');
    });

    it('should reject access to health journey without health role', async () => {
      // Generate a token with care journey access (not health)
      const { token } = generateTestToken({
        userId: TEST_USERS.CARE_USER.id,
        email: TEST_USERS.CARE_USER.email,
        roles: TEST_USERS.CARE_USER.roles.map(r => r.id),
        journey: JOURNEY_IDS.CARE,
      });

      const response = await request(app.getHttpServer())
        .get('/health-journey')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('does not have access to health journey');
    });

    it('should allow super admin access to all journeys', async () => {
      // Generate a token with super admin role
      const { token } = generateTestToken({
        userId: TEST_USERS.SUPER_ADMIN.id,
        email: TEST_USERS.SUPER_ADMIN.email,
        roles: TEST_USERS.SUPER_ADMIN.roles.map(r => r.id),
      });

      // Should have access to health journey
      await request(app.getHttpServer())
        .get('/health-journey')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should have access to admin routes
      await request(app.getHttpServer())
        .get('/admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should verify role-based access control', async () => {
      // Generate a token with regular user role (not admin)
      const { token } = generateTestToken({
        userId: TEST_USERS.REGULAR_USER.id,
        email: TEST_USERS.REGULAR_USER.email,
        roles: TEST_USERS.REGULAR_USER.roles.map(r => r.id),
      });

      const response = await request(app.getHttpServer())
        .get('/admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 403);
      
      // Use auth assertions to verify error properties
      assertAuth(response.body)
        .hasErrorType(ErrorType.FORBIDDEN)
        .hasErrorCode('INSUFFICIENT_PERMISSIONS')
        .hasErrorMessageContaining('permission');
    });
  });
});