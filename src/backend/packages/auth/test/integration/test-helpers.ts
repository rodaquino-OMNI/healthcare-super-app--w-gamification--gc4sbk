import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as request from 'supertest';
import { AuthService } from '../../src/auth.service';
import { TokenService } from '../../src/token.service';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';
import { LocalAuthGuard } from '../../src/guards/local-auth.guard';
import { JwtStrategy } from '../../src/strategies/jwt.strategy';
import { LocalStrategy } from '../../src/strategies/local.strategy';
import { ROLES_KEY } from '../../src/decorators/roles.decorator';

/**
 * Interface for user data used in tests
 */
export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  journeyPermissions?: Record<string, string[]>;
  isActive?: boolean;
}

/**
 * Interface for token data used in tests
 */
export interface TestToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Interface for test module configuration
 */
export interface TestModuleConfig {
  imports?: ModuleMetadata['imports'];
  providers?: Provider[];
  controllers?: Type<any>[];
  mockJwtService?: boolean;
  mockTokenService?: boolean;
  mockAuthService?: boolean;
  mockConfigService?: boolean;
  mockStrategies?: boolean;
  mockGuards?: boolean;
}

/**
 * Default test user with admin role
 */
export const DEFAULT_ADMIN_USER: TestUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@austa.health',
  password: 'Admin123!',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['admin'],
  journeyPermissions: {
    health: ['admin', 'read', 'write'],
    care: ['admin', 'read', 'write'],
    plan: ['admin', 'read', 'write']
  },
  isActive: true
};

/**
 * Default test user with regular user role
 */
export const DEFAULT_USER: TestUser = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'user@austa.health',
  password: 'User123!',
  firstName: 'Regular',
  lastName: 'User',
  roles: ['user'],
  journeyPermissions: {
    health: ['read'],
    care: ['read'],
    plan: ['read']
  },
  isActive: true
};

/**
 * Default test user with health journey admin role
 */
export const HEALTH_ADMIN_USER: TestUser = {
  id: '00000000-0000-0000-0000-000000000003',
  email: 'health.admin@austa.health',
  password: 'Health123!',
  firstName: 'Health',
  lastName: 'Admin',
  roles: ['user'],
  journeyPermissions: {
    health: ['admin', 'read', 'write'],
    care: ['read'],
    plan: ['read']
  },
  isActive: true
};

/**
 * Default test user with care journey admin role
 */
export const CARE_ADMIN_USER: TestUser = {
  id: '00000000-0000-0000-0000-000000000004',
  email: 'care.admin@austa.health',
  password: 'Care123!',
  firstName: 'Care',
  lastName: 'Admin',
  roles: ['user'],
  journeyPermissions: {
    health: ['read'],
    care: ['admin', 'read', 'write'],
    plan: ['read']
  },
  isActive: true
};

/**
 * Default test user with plan journey admin role
 */
export const PLAN_ADMIN_USER: TestUser = {
  id: '00000000-0000-0000-0000-000000000005',
  email: 'plan.admin@austa.health',
  password: 'Plan123!',
  firstName: 'Plan',
  lastName: 'Admin',
  roles: ['user'],
  journeyPermissions: {
    health: ['read'],
    care: ['read'],
    plan: ['admin', 'read', 'write']
  },
  isActive: true
};

/**
 * Default test user with inactive status
 */
export const INACTIVE_USER: TestUser = {
  id: '00000000-0000-0000-0000-000000000006',
  email: 'inactive@austa.health',
  password: 'Inactive123!',
  firstName: 'Inactive',
  lastName: 'User',
  roles: ['user'],
  journeyPermissions: {
    health: ['read'],
    care: ['read'],
    plan: ['read']
  },
  isActive: false
};

/**
 * Mock JWT service for testing
 */
export const createMockJwtService = () => ({
  sign: jest.fn().mockImplementation((payload) => {
    return `mock_jwt_token_${payload.sub}`;
  }),
  verify: jest.fn().mockImplementation((token) => {
    if (token.startsWith('mock_jwt_token_')) {
      const sub = token.replace('mock_jwt_token_', '');
      return { sub };
    }
    throw new Error('Invalid token');
  }),
  decode: jest.fn().mockImplementation((token) => {
    if (token.startsWith('mock_jwt_token_')) {
      const sub = token.replace('mock_jwt_token_', '');
      return { sub };
    }
    return null;
  })
});

/**
 * Mock token service for testing
 */
export const createMockTokenService = () => ({
  generateTokens: jest.fn().mockImplementation((user) => {
    return {
      accessToken: `mock_access_token_${user.id}`,
      refreshToken: `mock_refresh_token_${user.id}`,
      expiresIn: 3600
    };
  }),
  validateToken: jest.fn().mockImplementation((token) => {
    if (token.startsWith('mock_access_token_')) {
      const userId = token.replace('mock_access_token_', '');
      return { sub: userId, roles: ['user'] };
    }
    throw new Error('Invalid token');
  }),
  refreshToken: jest.fn().mockImplementation((refreshToken) => {
    if (refreshToken.startsWith('mock_refresh_token_')) {
      const userId = refreshToken.replace('mock_refresh_token_', '');
      return {
        accessToken: `mock_access_token_${userId}`,
        refreshToken: `mock_refresh_token_${userId}`,
        expiresIn: 3600
      };
    }
    throw new Error('Invalid refresh token');
  }),
  decodeToken: jest.fn().mockImplementation((token) => {
    if (token.startsWith('mock_access_token_')) {
      const userId = token.replace('mock_access_token_', '');
      return { sub: userId, roles: ['user'] };
    }
    return null;
  })
});

/**
 * Mock auth service for testing
 */
export const createMockAuthService = () => ({
  validateUser: jest.fn().mockImplementation((email, password) => {
    if (email === DEFAULT_USER.email && password === DEFAULT_USER.password) {
      const { password, ...result } = DEFAULT_USER;
      return result;
    }
    if (email === DEFAULT_ADMIN_USER.email && password === DEFAULT_ADMIN_USER.password) {
      const { password, ...result } = DEFAULT_ADMIN_USER;
      return result;
    }
    return null;
  }),
  login: jest.fn().mockImplementation((user) => {
    return {
      accessToken: `mock_access_token_${user.id}`,
      refreshToken: `mock_refresh_token_${user.id}`,
      expiresIn: 3600
    };
  }),
  register: jest.fn().mockImplementation((dto) => {
    return {
      id: '00000000-0000-0000-0000-000000000007',
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      roles: ['user'],
      isActive: true
    };
  }),
  getUserProfile: jest.fn().mockImplementation((userId) => {
    if (userId === DEFAULT_USER.id) {
      const { password, ...result } = DEFAULT_USER;
      return result;
    }
    if (userId === DEFAULT_ADMIN_USER.id) {
      const { password, ...result } = DEFAULT_ADMIN_USER;
      return result;
    }
    return null;
  })
});

/**
 * Mock config service for testing
 */
export const createMockConfigService = () => ({
  get: jest.fn().mockImplementation((key) => {
    const config = {
      'jwt.secret': 'test-jwt-secret',
      'jwt.expiresIn': '1h',
      'jwt.refreshExpiresIn': '7d',
      'auth.passwordSaltRounds': 10
    };
    return config[key];
  })
});

/**
 * Creates a test module with auth components
 * @param config Test module configuration
 * @returns TestingModule instance
 */
export async function createAuthTestingModule(config: TestModuleConfig = {}): Promise<TestingModule> {
  const providers: Provider[] = [
    ...(config.providers || [])
  ];

  // Add mock services based on configuration
  if (config.mockJwtService !== false) {
    providers.push({
      provide: JwtService,
      useFactory: createMockJwtService
    });
  }

  if (config.mockTokenService !== false) {
    providers.push({
      provide: TokenService,
      useFactory: createMockTokenService
    });
  }

  if (config.mockAuthService !== false) {
    providers.push({
      provide: AuthService,
      useFactory: createMockAuthService
    });
  }

  if (config.mockConfigService !== false) {
    providers.push({
      provide: ConfigService,
      useFactory: createMockConfigService
    });
  }

  // Add strategies if not disabled
  if (config.mockStrategies !== false) {
    providers.push(
      JwtStrategy,
      LocalStrategy
    );
  }

  // Add guards if not disabled
  if (config.mockGuards !== false) {
    providers.push(
      JwtAuthGuard,
      LocalAuthGuard,
      RolesGuard
    );
  }

  return Test.createTestingModule({
    imports: config.imports || [],
    controllers: config.controllers || [],
    providers
  }).compile();
}

/**
 * Creates a test application with auth components
 * @param config Test module configuration
 * @returns INestApplication instance
 */
export async function createAuthTestingApp(config: TestModuleConfig = {}): Promise<INestApplication> {
  const moduleRef = await createAuthTestingModule(config);
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

/**
 * Creates a test user with custom properties
 * @param overrides Properties to override in the default user
 * @returns TestUser instance
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    ...DEFAULT_USER,
    id: `00000000-0000-0000-0000-${Math.floor(Math.random() * 1000000000).toString().padStart(12, '0')}`,
    ...overrides
  };
}

/**
 * Creates a test user with admin role
 * @param overrides Properties to override in the default admin user
 * @returns TestUser instance
 */
export function createTestAdminUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    ...DEFAULT_ADMIN_USER,
    id: `00000000-0000-0000-0000-${Math.floor(Math.random() * 1000000000).toString().padStart(12, '0')}`,
    ...overrides
  };
}

/**
 * Creates a test user with journey-specific admin role
 * @param journey The journey to grant admin access to
 * @param overrides Properties to override in the default user
 * @returns TestUser instance
 */
export function createJourneyAdminUser(journey: 'health' | 'care' | 'plan', overrides: Partial<TestUser> = {}): TestUser {
  const baseUser = createTestUser();
  const journeyPermissions = {
    health: ['read'],
    care: ['read'],
    plan: ['read']
  };
  
  // Add admin permissions for the specified journey
  journeyPermissions[journey] = ['admin', 'read', 'write'];
  
  return {
    ...baseUser,
    email: `${journey}.admin.${Math.floor(Math.random() * 10000)}@austa.health`,
    journeyPermissions,
    ...overrides
  };
}

/**
 * Generates a valid JWT token for a test user
 * @param user The test user to generate a token for
 * @param jwtService Optional JWT service to use
 * @returns JWT token string
 */
export function generateTestToken(user: TestUser, jwtService?: JwtService): string {
  const mockJwt = jwtService || createMockJwtService();
  
  return mockJwt.sign({
    sub: user.id,
    email: user.email,
    roles: user.roles,
    journeyPermissions: user.journeyPermissions
  });
}

/**
 * Generates a complete token response for a test user
 * @param user The test user to generate tokens for
 * @param tokenService Optional token service to use
 * @returns TestToken object with access and refresh tokens
 */
export function generateTestTokens(user: TestUser, tokenService?: TokenService): TestToken {
  const mockTokenService = tokenService || createMockTokenService();
  
  return mockTokenService.generateTokens(user);
}

/**
 * Creates a mock execution context for testing guards
 * @param user The test user to include in the request
 * @param roles Optional roles to attach as metadata
 * @returns ExecutionContext instance
 */
export function createMockExecutionContext(user: TestUser, roles?: string[]): ExecutionContext {
  const req = {
    user
  } as Request;
  
  const context = {
    switchToHttp: () => ({
      getRequest: () => req
    }),
    getHandler: () => ({}),
    getClass: () => ({})
  } as ExecutionContext;
  
  // Attach roles metadata if provided
  if (roles && roles.length > 0) {
    Reflect.defineMetadata(ROLES_KEY, roles, context.getHandler());
  }
  
  return context;
}

/**
 * Simulates an authenticated request for testing
 * @param app The NestJS application instance
 * @param method The HTTP method to use
 * @param url The URL to request
 * @param user The test user to authenticate as
 * @param body Optional request body
 * @returns Supertest request with authentication
 */
export function authRequest(
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  user: TestUser,
  body?: any
): request.Test {
  const token = generateTestToken(user);
  const req = request(app.getHttpServer())[method](url)
    .set('Authorization', `Bearer ${token}`);
  
  if (body && (method === 'post' || method === 'put' || method === 'patch')) {
    return req.send(body);
  }
  
  return req;
}

/**
 * Simulates a login request for testing
 * @param app The NestJS application instance
 * @param email User email
 * @param password User password
 * @returns Supertest request for login
 */
export function loginRequest(
  app: INestApplication,
  email: string,
  password: string
): request.Test {
  return request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });
}

/**
 * Simulates a registration request for testing
 * @param app The NestJS application instance
 * @param userData User registration data
 * @returns Supertest request for registration
 */
export function registerRequest(
  app: INestApplication,
  userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }
): request.Test {
  return request(app.getHttpServer())
    .post('/auth/register')
    .send(userData);
}

/**
 * Simulates a token refresh request for testing
 * @param app The NestJS application instance
 * @param refreshToken The refresh token to use
 * @returns Supertest request for token refresh
 */
export function refreshTokenRequest(
  app: INestApplication,
  refreshToken: string
): request.Test {
  return request(app.getHttpServer())
    .post('/auth/refresh')
    .send({ refreshToken });
}

/**
 * Cleans up resources after tests
 * @param app The NestJS application instance
 */
export async function cleanupAuthTestingApp(app: INestApplication): Promise<void> {
  if (app) {
    await app.close();
  }
}