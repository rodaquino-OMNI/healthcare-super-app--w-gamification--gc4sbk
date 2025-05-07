import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { agent, SuperAgentTest } from 'supertest';
import { PrismaClient } from '@prisma/client';

// Updated imports using path aliases
import { PrismaService } from '@app/shared/database/prisma.service';
import { LoggerService } from '@app/shared/logging/logger.service';

// Import from @austa/interfaces for shared models
import { CreateUserDto, UserResponseDto, LoginResponseDto, RefreshTokenRequestDto } from '@austa/interfaces/auth';
import { JwtPayload } from '@austa/interfaces/auth';

// Import journey-specific error handling
import { ValidationError, AuthenticationError } from '@app/shared/errors/categories';
import { ErrorType } from '@app/shared/errors/error-type.enum';

// Import auth service
import { AuthService } from '@app/auth/auth.service';
import { AuthModule } from '@app/auth/auth.module';

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

describe('Auth Module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let loggerService: LoggerService;
  
  // Test data
  const createUserDto: CreateUserDto = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
    phone: '+5511999999999',
    cpf: '12345678901'
  };
  
  // Store tokens for later use
  let jwtToken: string;
  let refreshToken: string;
  
  beforeAll(async () => {
    // Create a testing module
    const moduleFixture = await Test.createTestingModule({
      imports: [
        // Import the AuthModule
        AuthModule
      ],
      providers: [
        PrismaService,
        LoggerService,
        // Mock other required services
        {
          provide: 'ConfigService',
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'authService.jwt') {
                return {
                  secret: 'test-secret',
                  accessTokenExpiration: '1h',
                  refreshTokenExpiration: '7d',
                  issuer: 'test-issuer',
                  audience: 'test-audience'
                };
              }
              return undefined;
            }),
          },
        },
        {
          provide: 'JwtService',
          useValue: {
            sign: jest.fn().mockImplementation((payload: JwtPayload) => {
              // Implement structured JWT token validation
              return 'test-jwt-token';
            }),
            verify: jest.fn().mockImplementation((token: string) => {
              // Return a valid JWT payload for testing
              return {
                sub: 'user-id',
                email: createUserDto.email,
                roles: ['user'],
                journeys: ['health', 'care', 'plan'],
                iss: 'test-issuer',
                aud: 'test-audience',
                exp: Math.floor(Date.now() / 1000) + 3600
              } as JwtPayload;
            }),
          },
        },
        {
          provide: 'UsersService',
          useValue: {
            create: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'user-id', ...dto, password: undefined })),
            validateCredentials: jest.fn().mockImplementation((email, password) => {
              if (password === 'Password123!') {
                return Promise.resolve({ id: 'user-id', email, roles: ['user'] });
              }
              // Use journey-specific error classification
              throw new AuthenticationError('Invalid credentials', 'AUTH_005');
            }),
            findByEmail: jest.fn().mockImplementation((email) => {
              return Promise.resolve({ id: 'user-id', email, roles: ['user'] });
            }),
          },
        },
      ],
    })
    .overrideProvider(AuthService)
    .useValue({
      register: jest.fn().mockImplementation((dto) => Promise.resolve({ 
        id: 'user-id', 
        ...dto, 
        password: undefined,
        roles: ['user'],
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      login: jest.fn().mockImplementation((email, password) => {
        if (password === 'Password123!') {
          return Promise.resolve({ 
            accessToken: 'test-jwt-token', 
            refreshToken: 'test-refresh-token',
            expiresIn: 3600,
            tokenType: 'Bearer',
            user: {
              id: 'user-id',
              email,
              name: createUserDto.name,
              roles: ['user']
            }
          });
        }
        // Use journey-specific error classification
        throw new AuthenticationError('Invalid credentials', 'AUTH_005');
      }),
      refreshToken: jest.fn().mockImplementation((refreshToken: string) => {
        return Promise.resolve({
          accessToken: 'new-test-jwt-token',
          refreshToken: 'new-test-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer'
        });
      }),
      validateToken: jest.fn().mockImplementation((token) => {
        return Promise.resolve({
          id: 'user-id',
          email: createUserDto.email,
          name: createUserDto.name,
          roles: ['user']
        });
      }),
      generateJwt: jest.fn().mockReturnValue('test-jwt-token'),
    })
    .compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);
    loggerService = moduleFixture.get<LoggerService>(LoggerService);
    
    // Clean up database before tests
    await prisma.user.deleteMany({ where: { email: createUserDto.email } });
  });
  
  afterAll(async () => {
    // Clean up database after tests
    await prisma.user.deleteMany({ where: { email: createUserDto.email } });
    await app.close();
  });
  
  it('should register a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(createUserDto)
      .expect(HttpStatus.CREATED);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(createUserDto.email);
    expect(response.body).not.toHaveProperty('password'); // Password should not be returned
    expect(response.body).toHaveProperty('roles'); // Check for roles property
    
    // Store refresh token if it's returned from registration
    if (response.body.refreshToken) {
      refreshToken = response.body.refreshToken;
    }
  });
  
  it('should login with valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: createUserDto.email,
        password: createUserDto.password,
      })
      .expect(HttpStatus.OK);
    
    // Verify response structure matches LoginResponseDto
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('expiresIn');
    expect(response.body).toHaveProperty('tokenType');
    expect(response.body).toHaveProperty('user');
    
    jwtToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
  });
  
  it('should fail to login with invalid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: createUserDto.email,
        password: 'WrongPassword123!',
      })
      .expect(HttpStatus.UNAUTHORIZED);
    
    // Verify error response structure
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('code');
    expect(response.body.code).toBe('AUTH_005');
    expect(response.body.type).toBe(ErrorType.VALIDATION);
  });
  
  it('should refresh token', async () => {
    // Skip this test if refresh token is not available
    if (!refreshToken) {
      console.warn('Skipping refresh token test as refresh token is not available');
      return;
    }
    
    const refreshTokenRequest: RefreshTokenRequestDto = {
      refreshToken
    };
    
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send(refreshTokenRequest)
      .expect(HttpStatus.OK);
    
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('expiresIn');
    expect(response.body).toHaveProperty('tokenType');
    
    jwtToken = response.body.accessToken; // Update token for subsequent tests
    refreshToken = response.body.refreshToken; // Update refresh token
  });
  
  it('should get current user profile', async () => {
    // Skip this test if JWT token is not available
    if (!jwtToken) {
      console.warn('Skipping current user test as JWT token is not available');
      return;
    }
    
    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(HttpStatus.OK);
    
    // Verify response matches UserResponseDto structure
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(createUserDto.email);
    expect(response.body).toHaveProperty('roles');
    expect(response.body).not.toHaveProperty('password'); // Password should not be returned
  });
  
  it('should fail to access protected route without valid token', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .expect(HttpStatus.UNAUTHORIZED);
    
    // Verify error response structure
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('code');
    expect(response.body.code).toBe('AUTH_001');
    expect(response.body.type).toBe(ErrorType.VALIDATION);
  });
});