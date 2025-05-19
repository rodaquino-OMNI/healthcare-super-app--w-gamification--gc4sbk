import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../../src/auth.module';
import { IAuthResult, ILoginRequest, IRegisterRequest, ITokenRefreshRequest } from '../../src/interfaces/auth.interface';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ErrorsModule } from '@austa/errors';

/**
 * End-to-end tests for authentication flows in the AUSTA SuperApp.
 * Tests the complete authentication process from registration to accessing protected resources.
 */
describe('Authentication Flow (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;
  
  // Test user data
  const validUser: IRegisterRequest = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
    acceptedTerms: true
  };

  const invalidUser: IRegisterRequest = {
    name: 'Invalid User',
    email: 'invalid-email',
    password: 'short',
    acceptedTerms: false
  };

  // Login credentials
  const validCredentials: ILoginRequest = {
    email: validUser.email,
    password: validUser.password
  };

  const invalidCredentials: ILoginRequest = {
    email: 'nonexistent@example.com',
    password: 'WrongPassword123!'
  };

  // Store tokens for subsequent tests
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Create a testing module with all required dependencies
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Import the AuthModule with its dependencies
        AuthModule,
        // Import ConfigModule for environment variables
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test'
        }),
        // Import ErrorsModule for standardized error handling
        ErrorsModule.forRoot({
          journeyPrefix: 'AUTH',
          enableSensitiveDataFilter: true
        })
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Set up global validation pipe for DTO validation
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    }));
    
    // Get services for use in tests
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Registration Tests
   */
  describe('User Registration', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validUser)
        .expect(201);

      const result = response.body as IAuthResult;
      
      // Verify response structure
      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(validUser.email);
      expect(result.user.name).toBe(validUser.name);
      
      // Ensure password is not returned
      expect(result.user.password).toBeUndefined();
      
      // Store tokens for subsequent tests if available
      if (result.accessToken) {
        accessToken = result.accessToken;
      }
    });

    it('should reject registration with invalid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);

      const result = response.body;
      
      // Verify error response structure
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toMatch(/^AUTH_VALIDATION_/); // Journey-specific error code prefix
      expect(result.error.message).toBeDefined();
      expect(result.error.details).toBeDefined();
      
      // Check for specific validation errors
      const details = result.error.details;
      expect(details.some(error => error.property === 'email')).toBe(true);
      expect(details.some(error => error.property === 'password')).toBe(true);
      expect(details.some(error => error.property === 'acceptedTerms')).toBe(true);
    });

    it('should reject duplicate email registration', async () => {
      // Try to register the same user again
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validUser)
        .expect(409); // Conflict status code

      const result = response.body;
      
      // Verify error response structure
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('AUTH_USER_ALREADY_EXISTS');
      expect(result.error.message).toContain('already exists');
    });
  });

  /**
   * Login Tests
   */
  describe('User Login', () => {
    it('should authenticate user with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(validCredentials)
        .expect(200);

      const result = response.body as IAuthResult;
      
      // Verify response structure
      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(validCredentials.email);
      
      // Ensure password is not returned
      expect(result.user.password).toBeUndefined();
      
      // Store tokens for subsequent tests
      if (result.accessToken) {
        accessToken = result.accessToken;
      }
      if (result.refreshToken) {
        refreshToken = result.refreshToken;
      }
    });

    it('should reject authentication with invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidCredentials)
        .expect(401);

      const result = response.body;
      
      // Verify error response structure
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('AUTH_INVALID_CREDENTIALS');
      expect(result.error.message).toContain('Invalid credentials');
      
      // Ensure no tokens or user data is returned
      expect(result.accessToken).toBeUndefined();
      expect(result.user).toBeUndefined();
    });

    it('should reject login with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: validCredentials.email }) // Missing password
        .expect(400);

      const result = response.body;
      
      // Verify error response structure
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toMatch(/^AUTH_VALIDATION_/);
      expect(result.error.details).toBeDefined();
      
      // Check for specific validation errors
      const details = result.error.details;
      expect(details.some(error => error.property === 'password')).toBe(true);
    });
  });

  /**
   * Protected Resource Access Tests
   */
  describe('Protected Resource Access', () => {
    it('should access protected resource with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const user = response.body;
      
      // Verify user profile data
      expect(user).toBeDefined();
      expect(user.email).toBe(validUser.email);
      expect(user.name).toBe(validUser.name);
      
      // Ensure password is not returned
      expect(user.password).toBeUndefined();
    });

    it('should reject access without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);

      const result = response.body;
      
      // Verify error response structure
      expect(result.error).toBeDefined();
      expect(result.message).toContain('Unauthorized');
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      const result = response.body;
      
      // Verify error response structure
      expect(result.error).toBeDefined();
      expect(result.message).toContain('Unauthorized');
    });

    it('should reject access with expired token', async () => {
      // Create an expired token
      const payload = { sub: 'user-id', email: validUser.email };
      const expiredToken = jwtService.sign(payload, {
        expiresIn: '0s' // Expired immediately
      });

      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      const result = response.body;
      
      // Verify error response structure
      expect(result.error).toBeDefined();
      expect(result.message).toContain('Unauthorized');
    });
  });

  /**
   * Token Refresh Tests
   */
  describe('Token Refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Skip if refresh token is not available
      if (!refreshToken) {
        console.warn('Refresh token not available, skipping test');
        return;
      }

      const refreshRequest: ITokenRefreshRequest = {
        refreshToken: refreshToken
      };

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshRequest)
        .expect(200);

      const result = response.body as IAuthResult;
      
      // Verify response structure
      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.accessToken).not.toBe(accessToken); // Should be a new token
      
      // Update access token for subsequent tests
      accessToken = result.accessToken;
    });

    it('should reject refresh with invalid refresh token', async () => {
      const refreshRequest: ITokenRefreshRequest = {
        refreshToken: 'invalid-refresh-token'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshRequest)
        .expect(401);

      const result = response.body;
      
      // Verify error response structure
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('AUTH_INVALID_REFRESH_TOKEN');
    });
  });

  /**
   * Token Validation Tests
   */
  describe('Token Validation', () => {
    it('should validate a valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/validate')
        .send({ token: accessToken })
        .expect(200);

      const result = response.body;
      
      // Verify response structure
      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload.email).toBe(validUser.email);
    });

    it('should invalidate an expired token', async () => {
      // Create an expired token
      const payload = { sub: 'user-id', email: validUser.email };
      const expiredToken = jwtService.sign(payload, {
        expiresIn: '0s' // Expired immediately
      });

      const response = await request(app.getHttpServer())
        .post('/auth/validate')
        .send({ token: expiredToken })
        .expect(200);

      const result = response.body;
      
      // Verify response structure
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('AUTH_TOKEN_EXPIRED');
    });

    it('should invalidate a malformed token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/validate')
        .send({ token: 'malformed-token' })
        .expect(200);

      const result = response.body;
      
      // Verify response structure
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('AUTH_TOKEN_MALFORMED');
    });
  });

  /**
   * Logout Tests
   */
  describe('User Logout', () => {
    it('should successfully logout a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const result = response.body;
      
      // Verify response structure
      expect(result.success).toBe(true);
      expect(result.message).toContain('logged out');
    });

    it('should invalidate the token after logout', async () => {
      // Try to access protected resource with the token that should be invalidated
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      const result = response.body;
      
      // Verify error response structure
      expect(result.error).toBeDefined();
      expect(result.message).toContain('Unauthorized');
    });
  });
});