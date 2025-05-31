/**
 * Authentication Test Application Utility
 * 
 * This utility module creates a configurable NestJS test application for authentication end-to-end tests.
 * It provides functions to initialize a test environment with mocked dependencies, configurable
 * authentication strategies, and predefined test users. Supports testing of registration, login,
 * JWT validation, and protected routes without requiring a real database connection.
 */

import { INestApplication, ModuleMetadata, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Import auth package components
import { AuthService } from '../../src/auth.service';
import { TokenService } from '../../src/token.service';
import { JwtStrategy } from '../../src/strategies/jwt.strategy';
import { LocalStrategy } from '../../src/strategies/local.strategy';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';
import { ROLES_KEY } from '../../src/decorators/roles.decorator';

// Import auth provider interfaces
import { AuthProvider } from '../../src/types';
import { ERROR_CODES, JWT_CLAIMS, TOKEN_TYPES } from '../../src/constants';

/**
 * Test user data for authentication tests
 */
export const TEST_USERS = {
  admin: {
    id: '1',
    email: 'admin@example.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    roles: ['admin'],
    permissions: {
      health: ['read', 'write', 'manage'],
      care: ['read', 'write', 'manage'],
      plan: ['read', 'write', 'manage']
    },
    emailVerified: true,
    provider: AuthProvider.LOCAL
  },
  user: {
    id: '2',
    email: 'user@example.com',
    password: 'User123!',
    firstName: 'Regular',
    lastName: 'User',
    roles: ['user'],
    permissions: {
      health: ['read'],
      care: ['read'],
      plan: ['read']
    },
    emailVerified: true,
    provider: AuthProvider.LOCAL
  },
  healthAdmin: {
    id: '3',
    email: 'health-admin@example.com',
    password: 'Health123!',
    firstName: 'Health',
    lastName: 'Admin',
    roles: ['health_admin'],
    permissions: {
      health: ['read', 'write', 'manage'],
      care: ['read'],
      plan: ['read']
    },
    emailVerified: true,
    provider: AuthProvider.LOCAL
  },
  unverified: {
    id: '4',
    email: 'unverified@example.com',
    password: 'Unverified123!',
    firstName: 'Unverified',
    lastName: 'User',
    roles: ['user'],
    permissions: {
      health: ['read'],
      care: ['read'],
      plan: ['read']
    },
    emailVerified: false,
    provider: AuthProvider.LOCAL
  },
  oauth: {
    id: '5',
    email: 'oauth@example.com',
    firstName: 'OAuth',
    lastName: 'User',
    roles: ['user'],
    permissions: {
      health: ['read'],
      care: ['read'],
      plan: ['read']
    },
    emailVerified: true,
    provider: AuthProvider.GOOGLE,
    externalId: 'google-123456'
  }
};

/**
 * Configuration options for the test application
 */
export interface AuthTestOptions {
  /**
   * Additional NestJS module imports to include in the test module
   */
  imports?: ModuleMetadata['imports'];
  
  /**
   * Additional providers to include in the test module
   */
  providers?: ModuleMetadata['providers'];
  
  /**
   * Controllers to include in the test module
   */
  controllers?: ModuleMetadata['controllers'];
  
  /**
   * JWT configuration options
   */
  jwt?: {
    /**
     * Secret key for signing tokens
     */
    secret?: string;
    
    /**
     * Access token expiration time in seconds
     */
    accessTokenExpiration?: number;
    
    /**
     * Refresh token expiration time in seconds
     */
    refreshTokenExpiration?: number;
  };
  
  /**
   * Database configuration options
   */
  database?: {
    /**
     * Mock database provider implementation
     */
    mockImplementation?: any;
    
    /**
     * Whether to use an in-memory database for testing
     */
    useInMemory?: boolean;
  };
  
  /**
   * Authentication strategies to enable
   */
  strategies?: {
    /**
     * Enable JWT authentication strategy
     */
    jwt?: boolean;
    
    /**
     * Enable local (username/password) authentication strategy
     */
    local?: boolean;
    
    /**
     * Enable OAuth authentication strategies
     */
    oauth?: {
      /**
       * Enable Google OAuth authentication
       */
      google?: boolean;
      
      /**
       * Enable Facebook OAuth authentication
       */
      facebook?: boolean;
      
      /**
       * Enable Apple OAuth authentication
       */
      apple?: boolean;
    };
  };
  
  /**
   * Error handling configuration
   */
  errors?: {
    /**
     * Mock error handler implementation
     */
    mockImplementation?: any;
  };
  
  /**
   * Logging configuration
   */
  logging?: {
    /**
     * Enable logging in tests
     */
    enabled?: boolean;
    
    /**
     * Mock logger implementation
     */
    mockImplementation?: any;
  };
}

/**
 * Default test options
 */
const defaultOptions: AuthTestOptions = {
  jwt: {
    secret: 'test-secret-key',
    accessTokenExpiration: 3600,
    refreshTokenExpiration: 86400
  },
  strategies: {
    jwt: true,
    local: true,
    oauth: {
      google: false,
      facebook: false,
      apple: false
    }
  },
  database: {
    useInMemory: true
  },
  logging: {
    enabled: false
  }
};

/**
 * Mock database provider for testing
 */
export class MockDatabaseProvider {
  private users = Object.values(TEST_USERS);

  async findUserById(id: string) {
    return this.users.find(user => user.id === id);
  }

  async findUserByEmail(email: string) {
    return this.users.find(user => user.email === email);
  }

  async validateCredentials(email: string, password: string) {
    const user = this.users.find(user => user.email === email);
    if (!user) return null;
    if (user.password !== password) return null;
    return user;
  }

  async createUser(userData: any) {
    const newUser = {
      id: String(this.users.length + 1),
      ...userData,
      emailVerified: false,
      provider: AuthProvider.LOCAL
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: string, userData: any) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData
    };
    
    return this.users[userIndex];
  }
}

/**
 * Mock token service for testing
 */
export class MockTokenService {
  constructor(private readonly options: AuthTestOptions) {}

  generateAccessToken(payload: any) {
    return `mock-access-token-${payload.sub}`;
  }

  generateRefreshToken(payload: any) {
    return `mock-refresh-token-${payload.sub}`;
  }

  verifyToken(token: string) {
    if (token.startsWith('mock-access-token-')) {
      const userId = token.replace('mock-access-token-', '');
      const user = Object.values(TEST_USERS).find(u => u.id === userId);
      
      if (!user) throw new Error(ERROR_CODES.INVALID_TOKEN);
      
      return {
        sub: user.id,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (this.options.jwt?.accessTokenExpiration || 3600)
      };
    }
    
    if (token.startsWith('mock-refresh-token-')) {
      const userId = token.replace('mock-refresh-token-', '');
      const user = Object.values(TEST_USERS).find(u => u.id === userId);
      
      if (!user) throw new Error(ERROR_CODES.INVALID_REFRESH_TOKEN);
      
      return {
        sub: user.id,
        type: TOKEN_TYPES.REFRESH,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (this.options.jwt?.refreshTokenExpiration || 86400)
      };
    }
    
    throw new Error(ERROR_CODES.INVALID_TOKEN);
  }

  decodeToken(token: string) {
    return this.verifyToken(token);
  }

  refreshToken(refreshToken: string) {
    if (!refreshToken.startsWith('mock-refresh-token-')) {
      throw new Error(ERROR_CODES.INVALID_REFRESH_TOKEN);
    }
    
    const userId = refreshToken.replace('mock-refresh-token-', '');
    const user = Object.values(TEST_USERS).find(u => u.id === userId);
    
    if (!user) throw new Error(ERROR_CODES.INVALID_REFRESH_TOKEN);
    
    return {
      accessToken: `mock-access-token-${user.id}`,
      refreshToken: `mock-refresh-token-${user.id}`,
      expiresIn: this.options.jwt?.accessTokenExpiration || 3600,
      tokenType: 'Bearer'
    };
  }
}

/**
 * Mock auth service for testing
 */
export class MockAuthService {
  constructor(
    private readonly databaseProvider: MockDatabaseProvider,
    private readonly tokenService: MockTokenService
  ) {}

  async validateUser(email: string, password: string) {
    return this.databaseProvider.validateCredentials(email, password);
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions
    };
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        permissions: user.permissions,
        emailVerified: user.emailVerified,
        provider: user.provider
      },
      tokens: {
        accessToken: this.tokenService.generateAccessToken(payload),
        refreshToken: this.tokenService.generateRefreshToken(payload),
        expiresIn: 3600,
        tokenType: 'Bearer'
      }
    };
  }

  async register(userData: any) {
    const existingUser = await this.databaseProvider.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error(ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }
    
    const newUser = await this.databaseProvider.createUser({
      ...userData,
      roles: ['user'],
      permissions: {
        health: ['read'],
        care: ['read'],
        plan: ['read']
      }
    });
    
    return this.login(newUser);
  }

  async refreshToken(refreshToken: string) {
    return this.tokenService.refreshToken(refreshToken);
  }

  async validateToken(token: string) {
    return this.tokenService.verifyToken(token);
  }
}

/**
 * Creates a test module for authentication testing
 * 
 * @param options Configuration options for the test module
 * @returns TestingModule instance
 */
export async function createAuthTestingModule(options: AuthTestOptions = {}): Promise<TestingModule> {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    jwt: { ...defaultOptions.jwt, ...options.jwt },
    strategies: { 
      ...defaultOptions.strategies, 
      ...options.strategies,
      oauth: { 
        ...defaultOptions.strategies?.oauth, 
        ...options.strategies?.oauth 
      }
    },
    database: { ...defaultOptions.database, ...options.database },
    logging: { ...defaultOptions.logging, ...options.logging }
  };

  // Create mock providers
  const mockDatabaseProvider = new MockDatabaseProvider();
  const mockTokenService = new MockTokenService(mergedOptions);
  const mockAuthService = new MockAuthService(mockDatabaseProvider, mockTokenService);

  // Base module configuration
  const moduleConfig: ModuleMetadata = {
    imports: [
      PassportModule,
      JwtModule.register({
        secret: mergedOptions.jwt?.secret,
        signOptions: {
          expiresIn: `${mergedOptions.jwt?.accessTokenExpiration}s`
        }
      }),
      ...(mergedOptions.imports || [])
    ],
    controllers: [...(mergedOptions.controllers || [])],
    providers: [
      {
        provide: AuthService,
        useValue: mockAuthService
      },
      {
        provide: TokenService,
        useValue: mockTokenService
      },
      JwtAuthGuard,
      RolesGuard,
      ...(mergedOptions.providers || [])
    ]
  };

  // Add authentication strategies based on configuration
  if (mergedOptions.strategies?.jwt) {
    moduleConfig.providers?.push({
      provide: JwtStrategy,
      useValue: {
        validate: async (payload: any) => {
          const user = await mockDatabaseProvider.findUserById(payload.sub);
          if (!user) return null;
          
          return {
            id: user.id,
            email: user.email,
            roles: user.roles,
            permissions: user.permissions
          };
        }
      }
    });
  }

  if (mergedOptions.strategies?.local) {
    moduleConfig.providers?.push({
      provide: LocalStrategy,
      useValue: {
        validate: async (email: string, password: string) => {
          const user = await mockAuthService.validateUser(email, password);
          if (!user) return null;
          
          return user;
        }
      }
    });
  }

  // Create and return the testing module
  return Test.createTestingModule(moduleConfig).compile();
}

/**
 * Creates a test application for authentication testing
 * 
 * @param options Configuration options for the test application
 * @returns NestJS application instance
 */
export async function createAuthTestingApp(options: AuthTestOptions = {}): Promise<INestApplication> {
  const moduleRef = await createAuthTestingModule(options);
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

/**
 * Creates a test token for a specific user
 * 
 * @param userId User ID to create token for
 * @param options Configuration options
 * @returns Access token string
 */
export function createTestToken(userId: string, options: AuthTestOptions = {}): string {
  const tokenService = new MockTokenService(options);
  const user = Object.values(TEST_USERS).find(u => u.id === userId);
  
  if (!user) {
    throw new Error(`Test user with ID ${userId} not found`);
  }
  
  return tokenService.generateAccessToken({
    sub: user.id,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions
  });
}

/**
 * Creates test headers with authentication token
 * 
 * @param userId User ID to create token for
 * @param options Configuration options
 * @returns Headers object with Authorization
 */
export function createAuthHeaders(userId: string, options: AuthTestOptions = {}): Record<string, string> {
  const token = createTestToken(userId, options);
  return {
    Authorization: `Bearer ${token}`
  };
}

/**
 * Helper function to create a controller with specific roles
 * 
 * @param roles Roles required for the controller
 * @returns Controller class with roles metadata
 */
export function createProtectedController(roles: string[]) {
  class TestController {
    getProtectedResource() {
      return { message: 'This is a protected resource' };
    }
  }
  
  Reflect.defineMetadata(ROLES_KEY, roles, TestController.prototype.getProtectedResource);
  
  return TestController;
}