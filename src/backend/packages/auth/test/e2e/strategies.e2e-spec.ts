import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createTestApp } from './test-app';
import { JwtStrategy } from '../../src/strategies/jwt.strategy';
import { LocalStrategy } from '../../src/strategies/local.strategy';
import { OAuthStrategy } from '../../src/strategies/oauth.strategy';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../../src/guards/local-auth.guard';
import { ITokenPayload, IUser } from '../../src/interfaces';

/**
 * End-to-end tests for authentication strategies.
 * Tests JWT, local, and OAuth authentication strategies to ensure they
 * correctly validate credentials, handle authentication failures, and
 * integrate with the NestJS Passport framework.
 */
describe('Authentication Strategies (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let configService: ConfigService;
  
  // Mock user for testing
  const testUser: IUser = {
    id: '1',
    email: 'test@austa.health',
    firstName: 'Test',
    lastName: 'User',
    roles: ['user'],
    journeyPreferences: {
      defaultJourney: 'health'
    }
  };

  // Mock credentials for local strategy testing
  const validCredentials = {
    email: 'test@austa.health',
    password: 'Password123!'
  };

  const invalidCredentials = {
    email: 'test@austa.health',
    password: 'WrongPassword'
  };

  beforeAll(async () => {
    // Create test application with authentication strategies
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Configure environment variables for testing
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            auth: {
              jwt: {
                secret: 'test-secret',
                expiresIn: '1h',
                audience: 'test-audience',
                issuer: 'test-issuer'
              },
              oauth: {
                google: {
                  clientId: 'test-client-id',
                  clientSecret: 'test-client-secret',
                  callbackUrl: 'http://localhost:3000/auth/google/callback'
                }
              }
            }
          })]
        }),
        // Configure JWT module for token generation and validation
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('auth.jwt.secret'),
            signOptions: {
              expiresIn: configService.get<string>('auth.jwt.expiresIn'),
              audience: configService.get<string>('auth.jwt.audience'),
              issuer: configService.get<string>('auth.jwt.issuer')
            }
          })
        }),
        PassportModule.register({ defaultStrategy: 'jwt' })
      ],
      providers: [
        JwtStrategy,
        LocalStrategy,
        // Mock OAuthStrategy for testing
        {
          provide: OAuthStrategy,
          useValue: {
            validate: jest.fn().mockImplementation((profile) => {
              return Promise.resolve(testUser);
            })
          }
        },
        // Mock services needed by strategies
        {
          provide: 'AuthService',
          useValue: {
            validateUser: jest.fn().mockImplementation((email, password) => {
              if (email === validCredentials.email && password === validCredentials.password) {
                return Promise.resolve(testUser);
              }
              return Promise.resolve(null);
            }),
            validateToken: jest.fn().mockImplementation((payload: ITokenPayload) => {
              if (payload.sub === testUser.id) {
                return Promise.resolve(testUser);
              }
              return Promise.resolve(null);
            }),
            findById: jest.fn().mockImplementation((id) => {
              if (id === testUser.id) {
                return Promise.resolve(testUser);
              }
              return Promise.resolve(null);
            })
          }
        }
      ],
      controllers: []
    }).compile();

    // Create test application with controllers for testing strategies
    app = await createTestApp(moduleFixture, {
      user: testUser,
      controllers: true
    });

    configService = moduleFixture.get<ConfigService>(ConfigService);

    // Generate a valid JWT token for testing
    const jwtService = moduleFixture.get<any>('JwtService');
    const payload: ITokenPayload = {
      sub: testUser.id,
      email: testUser.email,
      roles: testUser.roles,
      aud: configService.get<string>('auth.jwt.audience'),
      iss: configService.get<string>('auth.jwt.issuer')
    };
    jwtToken = jwtService.sign(payload);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('JWT Strategy', () => {
    it('should allow access to protected route with valid JWT token', async () => {
      return request(app.getHttpServer())
        .get('/protected')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId', testUser.id);
          expect(res.body).toHaveProperty('message', 'Protected route accessed successfully');
        });
    });

    it('should reject access to protected route with invalid JWT token', async () => {
      return request(app.getHttpServer())
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('statusCode', 401);
        });
    });

    it('should reject access to protected route with missing JWT token', async () => {
      return request(app.getHttpServer())
        .get('/protected')
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('statusCode', 401);
        });
    });

    it('should extract user information correctly from JWT token', async () => {
      return request(app.getHttpServer())
        .get('/user-info')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testUser.id);
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('roles');
          expect(res.body.roles).toEqual(expect.arrayContaining(testUser.roles));
        });
    });
  });

  describe('Local Strategy', () => {
    it('should authenticate user with valid credentials', async () => {
      return request(app.getHttpServer())
        .post('/login')
        .send(validCredentials)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id', testUser.id);
          expect(res.body.user).toHaveProperty('email', testUser.email);
        });
    });

    it('should reject authentication with invalid credentials', async () => {
      return request(app.getHttpServer())
        .post('/login')
        .send(invalidCredentials)
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('statusCode', 401);
          expect(res.body).toHaveProperty('error', 'Unauthorized');
        });
    });

    it('should reject authentication with missing credentials', async () => {
      return request(app.getHttpServer())
        .post('/login')
        .send({ email: validCredentials.email })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('statusCode', 400);
        });
    });
  });

  describe('OAuth Strategy', () => {
    it('should redirect to OAuth provider for authentication', async () => {
      return request(app.getHttpServer())
        .get('/auth/google')
        .expect(302)
        .expect((res) => {
          expect(res.headers.location).toBeDefined();
        });
    });

    it('should handle OAuth callback and create session', async () => {
      // Mock the OAuth callback - in a real test this would be more complex
      // Here we're just testing that the endpoint exists and returns expected data
      return request(app.getHttpServer())
        .get('/auth/google/callback')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('access_token');
        });
    });
  });

  describe('Cross-Strategy Integration', () => {
    it('should allow access to role-protected route with valid JWT token and correct role', async () => {
      return request(app.getHttpServer())
        .get('/admin')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Admin route accessed successfully');
        });
    });

    it('should reject access to journey-specific route with incorrect journey preference', async () => {
      // Generate a token for a user with different journey preferences
      const jwtService = app.get<any>('JwtService');
      const userWithDifferentJourney = { ...testUser, journeyPreferences: { defaultJourney: 'care' } };
      const payload: ITokenPayload = {
        sub: userWithDifferentJourney.id,
        email: userWithDifferentJourney.email,
        roles: userWithDifferentJourney.roles,
        aud: configService.get<string>('auth.jwt.audience'),
        iss: configService.get<string>('auth.jwt.issuer')
      };
      const differentJourneyToken = jwtService.sign(payload);

      return request(app.getHttpServer())
        .get('/health-journey')
        .set('Authorization', `Bearer ${differentJourneyToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('statusCode', 403);
        });
    });

    it('should handle token refresh correctly', async () => {
      // First login to get a refresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send(validCredentials)
        .expect(200);

      // Then use the refresh token to get a new access token
      return request(app.getHttpServer())
        .post('/refresh-token')
        .send({ refresh_token: loginResponse.body.refresh_token })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.access_token).not.toEqual(loginResponse.body.access_token);
        });
    });
  });
});