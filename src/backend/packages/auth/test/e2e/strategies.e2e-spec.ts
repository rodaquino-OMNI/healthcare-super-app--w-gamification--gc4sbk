import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Import from the auth package
import { OAuthStrategy } from '../../src/strategies/oauth.strategy';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../../src/guards/local-auth.guard';
import { CurrentUser } from '../../src/decorators/current-user.decorator';
import { Roles } from '../../src/decorators/roles.decorator';
import { RolesGuard } from '../../src/guards/roles.guard';
import { AuthService } from '../../src/auth.service';
import { TokenService } from '../../src/token.service';

// Import test utilities
import { createTestApp, generateTestToken, generateInvalidToken, generateExpiredToken } from './test-app';

// Test controllers
@Controller('auth')
class AuthTestController {
  constructor(private authService: AuthService, private tokenService: TokenService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@CurrentUser() user: any) {
    const token = await this.tokenService.generateToken(user);
    return { user, token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin')
  getAdminData() {
    return { message: 'Admin data' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('health:viewer')
  @Get('health')
  getHealthData() {
    return { message: 'Health journey data' };
  }

  // Mock endpoint for OAuth callback
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@CurrentUser() user: any) {
    return { user };
  }
}

// Mock Google Strategy for testing
class MockGoogleStrategy extends OAuthStrategy {
  constructor(private authService: AuthService) {
    super('google', async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await authService.validateOAuthUser({
          provider: 'google',
          providerId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName
        });
        done(null, user);
      } catch (error) {
        done(error, false);
      }
    });
  }

  // Mock authenticate method for testing
  authenticate(req: any) {
    // For testing, we'll simulate a successful authentication
    // with a mock profile when the request contains a valid mock token
    if (req.query.code === 'valid-auth-code') {
      const profile = {
        id: '12345',
        displayName: 'OAuth Test User',
        emails: [{ value: 'oauth@example.com' }]
      };
      
      this.success({
        id: '3',
        email: 'oauth@example.com',
        roles: ['user'],
        journeyRoles: ['health:viewer', 'care:user', 'plan:user']
      });
    } else {
      this.fail('Invalid authentication code');
    }
  }
}

describe('Authentication Strategies (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Create a test application with our test controller and OAuth strategy
    app = await createTestApp({
      controllers: [AuthTestController],
      providers: [
        { provide: 'GoogleStrategy', useClass: MockGoogleStrategy },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('LocalStrategy', () => {
    it('should authenticate user with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'test@example.com', password: 'password123' })
        .expect(201)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.token).toBeDefined();
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should reject authentication with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'test@example.com', password: 'wrongpassword' })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
          expect(res.body.statusCode).toBe(401);
        });
    });

    it('should reject authentication with missing credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
          expect(res.body.statusCode).toBe(401);
        });
    });
  });

  describe('JwtStrategy', () => {
    it('should allow access to protected route with valid JWT', () => {
      const token = generateTestToken('1');
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe('1');
          expect(res.body.email).toBe('test@example.com');
        });
    });

    it('should reject access to protected route with invalid JWT', () => {
      const invalidToken = generateInvalidToken();
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
          expect(res.body.statusCode).toBe(401);
        });
    });

    it('should reject access to protected route with missing JWT', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
          expect(res.body.statusCode).toBe(401);
        });
    });

    it('should reject access to admin route for non-admin user', () => {
      const token = generateTestToken('1'); // Regular user token
      return request(app.getHttpServer())
        .get('/auth/admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
          expect(res.body.statusCode).toBe(403);
        });
    });

    it('should allow access to journey-specific route with appropriate role', () => {
      const token = generateTestToken('1'); // User with health:viewer role
      return request(app.getHttpServer())
        .get('/auth/health')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Health journey data');
        });
    });

    it('should allow access to admin route for admin user', () => {
      const adminToken = generateTestToken('2'); // Admin user token
      return request(app.getHttpServer())
        .get('/auth/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Admin data');
        });
    });
  });

  describe('OAuthStrategy', () => {
    it('should authenticate user with valid OAuth code', () => {
      return request(app.getHttpServer())
        .get('/auth/google/callback?code=valid-auth-code')
        .expect(200)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe('oauth@example.com');
        });
    });

    it('should reject authentication with invalid OAuth code', () => {
      return request(app.getHttpServer())
        .get('/auth/google/callback?code=invalid-auth-code')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
          expect(res.body.statusCode).toBe(401);
        });
    });
  });

  describe('Cross-Strategy Integration', () => {
    it('should maintain user context across authentication methods', async () => {
      // First authenticate with local strategy
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'test@example.com', password: 'password123' })
        .expect(201);
      
      const token = loginResponse.body.token;
      
      // Then use the token with JWT strategy
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('test@example.com');
          // Verify that user roles are preserved
          expect(res.body.roles).toContain('user');
          expect(res.body.journeyRoles).toContain('health:viewer');
        });
    });

    it('should handle token expiration and validation correctly', () => {
      // Using an expired token
      const expiredToken = generateExpiredToken('1');
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
          expect(res.body.statusCode).toBe(401);
        });
    });
  });

  describe('Error Handling', () => {
    it('should return standardized error responses for authentication failures', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'test@example.com', password: 'wrongpassword' })
        .expect(401)
        .expect((res) => {
          // Verify the error structure follows the standardized format
          expect(res.body).toHaveProperty('statusCode');
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('error');
          expect(res.body.statusCode).toBe(401);
        });
    });

    it('should return standardized error responses for authorization failures', () => {
      const token = generateTestToken('1'); // Regular user token
      return request(app.getHttpServer())
        .get('/auth/admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
        .expect((res) => {
          // Verify the error structure follows the standardized format
          expect(res.body).toHaveProperty('statusCode');
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('error');
          expect(res.body.statusCode).toBe(403);
        });
    });
  });
  
  describe('Journey-Specific Authorization', () => {
    it('should enforce journey-specific role requirements', () => {
      // Create a test controller with journey-specific roles
      const token = generateTestToken('1'); // User with health:viewer role
      return request(app.getHttpServer())
        .get('/auth/health')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Health journey data');
        });
    });
    
    it('should allow admin users to access all journey-specific routes', () => {
      const adminToken = generateTestToken('2'); // Admin user token
      return request(app.getHttpServer())
        .get('/auth/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Health journey data');
        });
    });
  });
});