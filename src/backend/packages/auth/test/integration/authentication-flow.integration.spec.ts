import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../src/auth.service';
import { TokenService } from '../../src/token.service';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';
import { Roles } from '../../src/decorators/roles.decorator';
import { CurrentUser } from '../../src/decorators/current-user.decorator';
import { ITokenPayload, IUser } from '../../src/interfaces';
import { LoginDto } from '../../src/dto/login.dto';
import { RefreshTokenDto } from '../../src/dto/refresh-token.dto';

// Mock services and modules
import { createMockAuthModule } from '../helpers/mock-auth-module';
import { createMockJourneyModule } from '../helpers/mock-journey-module';
import { mockUsers } from '../fixtures/users.fixture';
import { mockJourneyData } from '../fixtures/journey-data.fixture';

// Test utilities
import { delay, generateRandomEmail } from '../utils/test-utils';

/**
 * Comprehensive integration tests for the complete authentication flow
 * across different journeys in the AUSTA SuperApp.
 * 
 * These tests validate the entire authentication pipeline including:
 * - User registration
 * - Login and token generation
 * - Token validation and refresh
 * - Access to protected resources
 * - Journey-specific authentication scenarios
 * - Error handling for authentication failures
 * - Concurrent authentication operations
 */
describe('Authentication Flow Integration Tests', () => {
  let app: INestApplication;
  let authService: AuthService;
  let tokenService: TokenService;
  let jwtService: JwtService;
  let configService: ConfigService;
  
  // Test data
  const testUser = {
    email: generateRandomEmail(),
    password: 'Test@123456',
    firstName: 'Test',
    lastName: 'User',
  };
  
  let accessToken: string;
  let refreshToken: string;
  
  beforeAll(async () => {
    // Create a test module with mock implementations
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        createMockAuthModule(),
        createMockJourneyModule('health'),
        createMockJourneyModule('care'),
        createMockJourneyModule('plan'),
      ],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Get service instances
    authService = moduleFixture.get<AuthService>(AuthService);
    tokenService = moduleFixture.get<TokenService>(TokenService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('Registration Flow', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).not.toHaveProperty('password'); // Password should not be returned
    });
    
    it('should reject registration with existing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'AUTH_USER_EXISTS');
    });
    
    it('should reject registration with invalid data', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: '123', // Too short
      };
      
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveLength(3); // Missing firstName, lastName, invalid email, invalid password
    });
  });
  
  describe('Login Flow', () => {
    it('should authenticate user and return tokens', async () => {
      const loginDto: LoginDto = {
        email: testUser.email,
        password: testUser.password,
      };
      
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);
      
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      
      // Store tokens for subsequent tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
      
      // Verify token contains expected payload
      const decodedToken = jwtService.decode(accessToken) as ITokenPayload;
      expect(decodedToken).toHaveProperty('sub');
      expect(decodedToken).toHaveProperty('email', testUser.email);
    });
    
    it('should reject login with invalid credentials', async () => {
      const invalidLogin: LoginDto = {
        email: testUser.email,
        password: 'wrong-password',
      };
      
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidLogin)
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'AUTH_INVALID_CREDENTIALS');
    });
    
    it('should reject login with non-existent user', async () => {
      const nonExistentUser: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'Test@123456',
      };
      
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(nonExistentUser)
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'AUTH_INVALID_CREDENTIALS');
    });
  });
  
  describe('Token Validation and Refresh', () => {
    it('should access protected route with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('firstName', testUser.firstName);
      expect(response.body).toHaveProperty('lastName', testUser.lastName);
    });
    
    it('should reject access with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'AUTH_INVALID_TOKEN');
    });
    
    it('should reject access with expired token', async () => {
      // Create an expired token
      const expiredToken = await tokenService.generateToken(
        { sub: '123', email: testUser.email },
        '1ms' // Expire immediately
      );
      
      // Wait for token to expire
      await delay(10);
      
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'AUTH_EXPIRED_TOKEN');
    });
    
    it('should refresh token successfully', async () => {
      const refreshDto: RefreshTokenDto = {
        refreshToken,
      };
      
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshDto)
        .expect(200);
      
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      
      // Update tokens for subsequent tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });
    
    it('should reject refresh with invalid refresh token', async () => {
      const invalidRefreshDto: RefreshTokenDto = {
        refreshToken: 'invalid-refresh-token',
      };
      
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(invalidRefreshDto)
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'AUTH_INVALID_REFRESH_TOKEN');
    });
  });
  
  describe('Journey-Specific Authentication', () => {
    // Health Journey Authentication
    describe('Health Journey', () => {
      it('should access health journey resources with valid token', async () => {
        const response = await request(app.getHttpServer())
          .get('/health/metrics')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
        
        expect(response.body).toHaveProperty('metrics');
        expect(response.body).toHaveProperty('journeyType', 'health');
      });
      
      it('should validate health-specific roles', async () => {
        // Assuming the test user has health:viewer role
        const response = await request(app.getHttpServer())
          .get('/health/insights')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
        
        expect(response.body).toHaveProperty('insights');
        expect(response.body).toHaveProperty('journeyType', 'health');
      });
      
      it('should reject access to health admin resources without proper role', async () => {
        // Assuming the test user doesn't have health:admin role
        const response = await request(app.getHttpServer())
          .post('/health/admin/settings')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ setting: 'value' })
          .expect(403);
        
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'AUTH_INSUFFICIENT_PERMISSIONS');
      });
    });
    
    // Care Journey Authentication
    describe('Care Journey', () => {
      it('should access care journey resources with valid token', async () => {
        const response = await request(app.getHttpServer())
          .get('/care/appointments')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
        
        expect(response.body).toHaveProperty('appointments');
        expect(response.body).toHaveProperty('journeyType', 'care');
      });
      
      it('should validate care-specific roles', async () => {
        // Assuming the test user has care:patient role
        const response = await request(app.getHttpServer())
          .get('/care/medical-history')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
        
        expect(response.body).toHaveProperty('medicalHistory');
        expect(response.body).toHaveProperty('journeyType', 'care');
      });
      
      it('should reject access to provider resources without proper role', async () => {
        // Assuming the test user doesn't have care:provider role
        const response = await request(app.getHttpServer())
          .get('/care/provider/patients')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(403);
        
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'AUTH_INSUFFICIENT_PERMISSIONS');
      });
    });
    
    // Plan Journey Authentication
    describe('Plan Journey', () => {
      it('should access plan journey resources with valid token', async () => {
        const response = await request(app.getHttpServer())
          .get('/plan/benefits')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
        
        expect(response.body).toHaveProperty('benefits');
        expect(response.body).toHaveProperty('journeyType', 'plan');
      });
      
      it('should validate plan-specific roles', async () => {
        // Assuming the test user has plan:member role
        const response = await request(app.getHttpServer())
          .get('/plan/claims')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
        
        expect(response.body).toHaveProperty('claims');
        expect(response.body).toHaveProperty('journeyType', 'plan');
      });
      
      it('should reject access to insurance admin resources without proper role', async () => {
        // Assuming the test user doesn't have plan:admin role
        const response = await request(app.getHttpServer())
          .post('/plan/admin/approve-claim')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ claimId: '123' })
          .expect(403);
        
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'AUTH_INSUFFICIENT_PERMISSIONS');
      });
    });
  });
  
  describe('Cross-Service Token Validation', () => {
    it('should validate tokens across service boundaries', async () => {
      // Simulate token validation in different services
      const services = ['health', 'care', 'plan'];
      
      for (const service of services) {
        const response = await request(app.getHttpServer())
          .post(`/${service}/validate-token`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
        
        expect(response.body).toHaveProperty('valid', true);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('email', testUser.email);
      }
    });
    
    it('should maintain consistent user context across services', async () => {
      // Simulate retrieving user context in different services
      const services = ['health', 'care', 'plan'];
      const userContexts = [];
      
      for (const service of services) {
        const response = await request(app.getHttpServer())
          .get(`/${service}/user-context`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
        
        userContexts.push(response.body);
      }
      
      // Verify user context is consistent across services
      expect(userContexts[0].id).toEqual(userContexts[1].id);
      expect(userContexts[1].id).toEqual(userContexts[2].id);
      expect(userContexts[0].email).toEqual(testUser.email);
    });
  });
  
  describe('Concurrent Authentication Operations', () => {
    it('should handle multiple concurrent login attempts', async () => {
      const loginDto: LoginDto = {
        email: testUser.email,
        password: testUser.password,
      };
      
      // Make 5 concurrent login requests
      const requests = Array(5).fill(0).map(() => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto);
      });
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
      });
      
      // Tokens should be different for each request
      const tokens = responses.map(response => response.body.accessToken);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
    });
    
    it('should maintain isolation between concurrent operations', async () => {
      // Create multiple test users
      const testUsers = Array(3).fill(0).map((_, i) => ({
        email: generateRandomEmail(),
        password: `Test@${100000 + i}`,
        firstName: `Test${i}`,
        lastName: `User${i}`,
      }));
      
      // Register users concurrently
      const registerRequests = testUsers.map(user => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send(user);
      });
      
      const registerResponses = await Promise.all(registerRequests);
      
      // All registrations should succeed
      registerResponses.forEach((response, i) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('email', testUsers[i].email);
      });
      
      // Login with each user concurrently
      const loginRequests = testUsers.map(user => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: user.email,
            password: user.password,
          });
      });
      
      const loginResponses = await Promise.all(loginRequests);
      
      // All logins should succeed
      const userTokens = loginResponses.map(response => {
        expect(response.status).toBe(200);
        return response.body.accessToken;
      });
      
      // Access profile with each token concurrently
      const profileRequests = userTokens.map(token => {
        return request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${token}`);
      });
      
      const profileResponses = await Promise.all(profileRequests);
      
      // Each profile should match the corresponding user
      profileResponses.forEach((response, i) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('email', testUsers[i].email);
        expect(response.body).toHaveProperty('firstName', testUsers[i].firstName);
      });
    });
  });
  
  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed token gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer malformed.token.value')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'AUTH_INVALID_TOKEN');
    });
    
    it('should handle missing authorization header gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'AUTH_MISSING_TOKEN');
    });
    
    it('should handle token blacklisting after logout', async () => {
      // First, logout to blacklist the token
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      // Then try to use the same token
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'AUTH_TOKEN_REVOKED');
    });
    
    it('should handle rate limiting for failed login attempts', async () => {
      const invalidLogin = {
        email: generateRandomEmail(),
        password: 'wrong-password',
      };
      
      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send(invalidLogin)
          .expect(401);
      }
      
      // The next attempt should be rate limited
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidLogin)
        .expect(429);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'AUTH_RATE_LIMIT_EXCEEDED');
    });
  });
});