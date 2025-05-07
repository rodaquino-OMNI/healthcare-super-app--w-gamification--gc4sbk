/**
 * @file test-utils.ts
 * @description Comprehensive test utilities for auth-service testing.
 * 
 * This module provides standardized test helpers, mock factories, and setup functions
 * for auth service testing. It centralizes common test operations like database
 * initialization, test user creation, JWT token generation, and service mocking
 * to ensure consistent test setup across all auth service tests.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { PrismaService } from '@austa/database';
import { LoggerService } from '@austa/logging';
import { AppException, ErrorType } from '@austa/errors';

// Import auth service interfaces
import { IUser, IRole, IPermission } from '@austa/interfaces/auth';
import { JwtPayload } from '../src/auth/interfaces/jwt.interfaces';
import { AuthenticatedUser } from '../src/auth/interfaces/user-auth.interfaces';

// Import auth service components
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { RolesService } from '../src/roles/roles.service';
import { PermissionsService } from '../src/permissions/permissions.service';

/**
 * Journey types supported by the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Standard test user roles with predefined permissions
 */
export enum TestRole {
  ADMIN = 'admin',
  USER = 'user',
  PROVIDER = 'provider',
  CAREGIVER = 'caregiver',
}

/**
 * Test user data interface for creating consistent test users
 */
export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  roles: TestRole[];
  journeys?: JourneyType[];
}

/**
 * Standard test users with predefined roles
 */
export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@austa.health',
    password: 'Admin123!',
    name: 'Admin User',
    roles: [TestRole.ADMIN],
    journeys: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
  },
  user: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'user@austa.health',
    password: 'User123!',
    name: 'Regular User',
    roles: [TestRole.USER],
    journeys: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
  },
  provider: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'provider@austa.health',
    password: 'Provider123!',
    name: 'Healthcare Provider',
    roles: [TestRole.PROVIDER],
    journeys: [JourneyType.CARE],
  },
  caregiver: {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'caregiver@austa.health',
    password: 'Caregiver123!',
    name: 'Caregiver User',
    roles: [TestRole.CAREGIVER],
    journeys: [JourneyType.HEALTH, JourneyType.CARE],
  },
};

/**
 * Standard test permissions by journey and role
 */
export const TEST_PERMISSIONS: Record<JourneyType, Record<string, string[]>> = {
  [JourneyType.HEALTH]: {
    [TestRole.ADMIN]: [
      'health:metrics:read',
      'health:metrics:write',
      'health:goals:read',
      'health:goals:write',
      'health:devices:read',
      'health:devices:write',
      'health:insights:read',
    ],
    [TestRole.USER]: [
      'health:metrics:read',
      'health:metrics:write',
      'health:goals:read',
      'health:goals:write',
      'health:devices:read',
      'health:devices:write',
      'health:insights:read',
    ],
    [TestRole.CAREGIVER]: [
      'health:metrics:read',
      'health:goals:read',
      'health:insights:read',
    ],
    [TestRole.PROVIDER]: [],
  },
  [JourneyType.CARE]: {
    [TestRole.ADMIN]: [
      'care:appointments:read',
      'care:appointments:write',
      'care:providers:read',
      'care:providers:write',
      'care:medications:read',
      'care:medications:write',
      'care:telemedicine:read',
      'care:telemedicine:write',
      'care:treatments:read',
      'care:treatments:write',
    ],
    [TestRole.USER]: [
      'care:appointments:read',
      'care:appointments:write',
      'care:providers:read',
      'care:medications:read',
      'care:medications:write',
      'care:telemedicine:read',
      'care:telemedicine:write',
      'care:treatments:read',
    ],
    [TestRole.PROVIDER]: [
      'care:appointments:read',
      'care:appointments:write',
      'care:providers:read',
      'care:medications:read',
      'care:medications:write',
      'care:telemedicine:read',
      'care:telemedicine:write',
      'care:treatments:read',
      'care:treatments:write',
    ],
    [TestRole.CAREGIVER]: [
      'care:appointments:read',
      'care:providers:read',
      'care:medications:read',
      'care:treatments:read',
    ],
  },
  [JourneyType.PLAN]: {
    [TestRole.ADMIN]: [
      'plan:plans:read',
      'plan:plans:write',
      'plan:benefits:read',
      'plan:benefits:write',
      'plan:coverage:read',
      'plan:coverage:write',
      'plan:claims:read',
      'plan:claims:write',
      'plan:documents:read',
      'plan:documents:write',
    ],
    [TestRole.USER]: [
      'plan:plans:read',
      'plan:benefits:read',
      'plan:coverage:read',
      'plan:claims:read',
      'plan:claims:write',
      'plan:documents:read',
      'plan:documents:write',
    ],
    [TestRole.PROVIDER]: [
      'plan:coverage:read',
      'plan:claims:read',
    ],
    [TestRole.CAREGIVER]: [],
  },
};

/**
 * Test JWT configuration
 */
export const TEST_JWT_CONFIG = {
  secret: 'test-jwt-secret-key-for-auth-service-testing',
  expiresIn: '1h',
  refreshExpiresIn: '7d',
  issuer: 'austa-auth-service-test',
  audience: 'austa-app-test',
};

/**
 * Creates a test JWT token for the specified user
 * @param user The user to create a token for
 * @param expiresIn Optional token expiration time
 * @returns JWT token string
 */
export function createTestToken(user: TestUser | IUser, expiresIn = '1h'): string {
  const jwtService = new JwtService();
  
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    roles: Array.isArray(user.roles) 
      ? user.roles.map(role => typeof role === 'string' ? role : role.name)
      : [],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (expiresIn === '1h' ? 3600 : 86400),
    iss: TEST_JWT_CONFIG.issuer,
    aud: TEST_JWT_CONFIG.audience,
  };

  return jwtService.sign(payload, { secret: TEST_JWT_CONFIG.secret });
}

/**
 * Creates an authenticated request object for testing
 * @param user The user to authenticate as
 * @returns Supertest request with authentication headers
 */
export function createAuthenticatedRequest(user: TestUser | IUser): request.SuperTest<request.Test> {
  const token = createTestToken(user);
  return request.agent('').set('Authorization', `Bearer ${token}`);
}

/**
 * Creates a mock authenticated user for testing
 * @param user The test user to create an authenticated user from
 * @returns AuthenticatedUser object for testing
 */
export function createMockAuthenticatedUser(user: TestUser): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles as string[],
  };
}

/**
 * Database initialization and cleanup utilities
 */
export class TestDatabase {
  private prismaService: PrismaService;

  constructor(prismaService: PrismaService) {
    this.prismaService = prismaService;
  }

  /**
   * Initializes the test database with required data
   */
  async initialize(): Promise<void> {
    await this.cleanup();
    await this.createTestPermissions();
    await this.createTestRoles();
    await this.createTestUsers();
  }

  /**
   * Cleans up test data from the database
   */
  async cleanup(): Promise<void> {
    // Delete in reverse order of dependencies
    await this.prismaService.userRoles.deleteMany({});
    await this.prismaService.rolePermissions.deleteMany({});
    await this.prismaService.user.deleteMany({});
    await this.prismaService.role.deleteMany({});
    await this.prismaService.permission.deleteMany({});
  }

  /**
   * Creates test permissions in the database
   */
  async createTestPermissions(): Promise<IPermission[]> {
    const permissions: IPermission[] = [];
    
    // Create permissions for each journey and role
    for (const journey of Object.values(JourneyType)) {
      for (const rolePermissions of Object.values(TEST_PERMISSIONS[journey])) {
        for (const permissionName of rolePermissions) {
          try {
            const permission = await this.prismaService.permission.upsert({
              where: { name: permissionName },
              update: {},
              create: {
                name: permissionName,
                description: `Test permission for ${permissionName}`,
              },
            });
            permissions.push(permission);
          } catch (error) {
            // Ignore duplicate permission errors
          }
        }
      }
    }
    
    return permissions;
  }

  /**
   * Creates test roles in the database
   */
  async createTestRoles(): Promise<IRole[]> {
    const roles: IRole[] = [];
    
    // Create roles for each test role type
    for (const roleName of Object.values(TestRole)) {
      const role = await this.prismaService.role.upsert({
        where: { name: roleName },
        update: {},
        create: {
          name: roleName,
          description: `Test role for ${roleName}`,
          isDefault: roleName === TestRole.USER,
        },
      });
      
      // Assign permissions to role
      for (const journey of Object.values(JourneyType)) {
        const permissions = TEST_PERMISSIONS[journey][roleName] || [];
        
        for (const permissionName of permissions) {
          const permission = await this.prismaService.permission.findUnique({
            where: { name: permissionName },
          });
          
          if (permission) {
            await this.prismaService.rolePermissions.create({
              data: {
                roleId: role.id,
                permissionId: permission.id,
              },
            });
          }
        }
      }
      
      roles.push(role);
    }
    
    return roles;
  }

  /**
   * Creates test users in the database
   */
  async createTestUsers(): Promise<IUser[]> {
    const users: IUser[] = [];
    
    // Create users for each test user type
    for (const testUser of Object.values(TEST_USERS)) {
      const user = await this.prismaService.user.upsert({
        where: { email: testUser.email },
        update: {},
        create: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          password: testUser.password, // In a real app, this would be hashed
        },
      });
      
      // Assign roles to user
      for (const roleName of testUser.roles) {
        const role = await this.prismaService.role.findUnique({
          where: { name: roleName },
        });
        
        if (role) {
          await this.prismaService.userRoles.create({
            data: {
              userId: user.id,
              roleId: role.id,
            },
          });
        }
      }
      
      users.push(user);
    }
    
    return users;
  }

  /**
   * Gets a test user by email
   * @param email The email of the test user to get
   * @returns The test user or null if not found
   */
  async getTestUser(email: string): Promise<IUser | null> {
    return this.prismaService.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}

/**
 * Creates a test module with mock services
 * @param overrides Optional service overrides
 * @returns TestingModule with configured services
 */
export async function createTestModule(overrides: Record<string, any> = {}): Promise<TestingModule> {
  // Create mock services
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'authService.jwt.secret') return TEST_JWT_CONFIG.secret;
      if (key === 'authService.jwt.accessTokenExpiration') return TEST_JWT_CONFIG.expiresIn;
      if (key === 'authService.jwt.refreshTokenExpiration') return TEST_JWT_CONFIG.refreshExpiresIn;
      if (key === 'authService.jwt.issuer') return TEST_JWT_CONFIG.issuer;
      if (key === 'authService.jwt.audience') return TEST_JWT_CONFIG.audience;
      return null;
    }),
  };

  const mockLoggerService = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  // Create the test module
  return Test.createTestingModule({
    providers: [
      {
        provide: ConfigService,
        useValue: overrides.configService || mockConfigService,
      },
      {
        provide: LoggerService,
        useValue: overrides.loggerService || mockLoggerService,
      },
      {
        provide: PrismaService,
        useValue: overrides.prismaService || {
          user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            upsert: jest.fn(),
          },
          role: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            upsert: jest.fn(),
          },
          permission: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            upsert: jest.fn(),
          },
          userRoles: {
            create: jest.fn(),
            deleteMany: jest.fn(),
          },
          rolePermissions: {
            create: jest.fn(),
            deleteMany: jest.fn(),
          },
          $transaction: jest.fn((fn) => fn()),
          $connect: jest.fn(),
          $disconnect: jest.fn(),
        },
      },
      {
        provide: JwtService,
        useValue: overrides.jwtService || {
          sign: jest.fn(() => 'test-jwt-token'),
          verify: jest.fn(() => ({
            sub: TEST_USERS.user.id,
            email: TEST_USERS.user.email,
            roles: TEST_USERS.user.roles,
          })),
          decode: jest.fn(() => ({
            sub: TEST_USERS.user.id,
            email: TEST_USERS.user.email,
            roles: TEST_USERS.user.roles,
          })),
        },
      },
      {
        provide: AuthService,
        useValue: overrides.authService || {
          login: jest.fn(),
          register: jest.fn(),
          validateToken: jest.fn(),
          refreshToken: jest.fn(),
        },
      },
      {
        provide: UsersService,
        useValue: overrides.usersService || {
          create: jest.fn(),
          findAll: jest.fn(),
          findOne: jest.fn(),
          update: jest.fn(),
          remove: jest.fn(),
          findByEmail: jest.fn(),
        },
      },
      {
        provide: RolesService,
        useValue: overrides.rolesService || {
          create: jest.fn(),
          findAll: jest.fn(),
          findOne: jest.fn(),
          update: jest.fn(),
          remove: jest.fn(),
        },
      },
      {
        provide: PermissionsService,
        useValue: overrides.permissionsService || {
          create: jest.fn(),
          findAll: jest.fn(),
          findOne: jest.fn(),
          update: jest.fn(),
          remove: jest.fn(),
        },
      },
      ...(overrides.additionalProviders || []),
    ],
  }).compile();
}

/**
 * Creates a test application with configured services
 * @param moduleRef TestingModule to create the application from
 * @returns Configured NestJS application
 */
export async function createTestApp(moduleRef: TestingModule): Promise<INestApplication> {
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

/**
 * Assertion utilities for auth service testing
 */
export class AuthAssertions {
  /**
   * Asserts that a response contains a valid authentication token
   * @param response The response to check
   * @returns The token from the response
   */
  static assertHasValidToken(response: any): string {
    expect(response.body).toHaveProperty('accessToken');
    expect(typeof response.body.accessToken).toBe('string');
    expect(response.body.accessToken.length).toBeGreaterThan(10);
    return response.body.accessToken;
  }

  /**
   * Asserts that a response contains user data
   * @param response The response to check
   * @param expectedUser The expected user data
   */
  static assertHasUserData(response: any, expectedUser: Partial<IUser>): void {
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('email');
    expect(response.body.user).toHaveProperty('name');
    
    if (expectedUser.id) {
      expect(response.body.user.id).toBe(expectedUser.id);
    }
    
    if (expectedUser.email) {
      expect(response.body.user.email).toBe(expectedUser.email);
    }
    
    if (expectedUser.name) {
      expect(response.body.user.name).toBe(expectedUser.name);
    }
  }

  /**
   * Asserts that a response contains the expected error
   * @param response The response to check
   * @param status The expected HTTP status code
   * @param errorType The expected error type
   */
  static assertHasError(response: any, status: number, errorType?: ErrorType): void {
    expect(response.status).toBe(status);
    expect(response.body).toHaveProperty('error');
    
    if (errorType) {
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toBe(errorType);
    }
  }

  /**
   * Asserts that a user has the expected roles
   * @param user The user to check
   * @param expectedRoles The expected roles
   */
  static assertHasRoles(user: any, expectedRoles: string[]): void {
    expect(user).toHaveProperty('userRoles');
    expect(Array.isArray(user.userRoles)).toBe(true);
    
    const roles = user.userRoles.map((ur: any) => ur.role.name);
    expectedRoles.forEach(role => {
      expect(roles).toContain(role);
    });
  }

  /**
   * Asserts that a user has the expected permissions
   * @param user The user to check
   * @param expectedPermissions The expected permissions
   */
  static assertHasPermissions(user: any, expectedPermissions: string[]): void {
    expect(user).toHaveProperty('userRoles');
    expect(Array.isArray(user.userRoles)).toBe(true);
    
    const permissions = user.userRoles.flatMap((ur: any) => 
      ur.role.rolePermissions.map((rp: any) => rp.permission.name)
    );
    
    expectedPermissions.forEach(permission => {
      expect(permissions).toContain(permission);
    });
  }
}

/**
 * Error factory for creating consistent AppExceptions in tests
 */
export class TestErrorFactory {
  /**
   * Creates an authentication error
   * @param message Optional error message
   * @returns AppException with AUTH error type
   */
  static createAuthError(message = 'Authentication failed'): AppException {
    return new AppException(ErrorType.AUTH_001, message);
  }

  /**
   * Creates a permission error
   * @param message Optional error message
   * @returns AppException with PERMISSION error type
   */
  static createPermissionError(message = 'Permission denied'): AppException {
    return new AppException(ErrorType.AUTH_004, message);
  }

  /**
   * Creates a not found error
   * @param entity The entity that was not found
   * @returns AppException with NOT_FOUND error type
   */
  static createNotFoundError(entity = 'Resource'): AppException {
    return new AppException(ErrorType.RESOURCE_001, `${entity} not found`);
  }

  /**
   * Creates a validation error
   * @param message Optional error message
   * @returns AppException with VALIDATION error type
   */
  static createValidationError(message = 'Validation failed'): AppException {
    return new AppException(ErrorType.VALIDATION_001, message);
  }
}

/**
 * Factory for creating test entities
 */
export class TestEntityFactory {
  /**
   * Creates a test user
   * @param overrides Optional property overrides
   * @returns Test user object
   */
  static createUser(overrides: Partial<IUser> = {}): IUser {
    return {
      id: overrides.id || '00000000-0000-0000-0000-000000000099',
      email: overrides.email || `test-${Date.now()}@austa.health`,
      name: overrides.name || 'Test User',
      password: overrides.password || 'Password123!',
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    } as IUser;
  }

  /**
   * Creates a test role
   * @param overrides Optional property overrides
   * @returns Test role object
   */
  static createRole(overrides: Partial<IRole> = {}): IRole {
    return {
      id: overrides.id || '00000000-0000-0000-0000-000000000098',
      name: overrides.name || `test-role-${Date.now()}`,
      description: overrides.description || 'Test role',
      isDefault: overrides.isDefault || false,
      journey: overrides.journey,
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    } as IRole;
  }

  /**
   * Creates a test permission
   * @param overrides Optional property overrides
   * @returns Test permission object
   */
  static createPermission(overrides: Partial<IPermission> = {}): IPermission {
    return {
      id: overrides.id || '00000000-0000-0000-0000-000000000097',
      name: overrides.name || `test:permission:${Date.now()}`,
      description: overrides.description || 'Test permission',
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    } as IPermission;
  }
}

/**
 * Utility for creating journey-specific test data
 */
export class JourneyTestFactory {
  /**
   * Creates test data for the Health journey
   * @param prismaService PrismaService instance
   * @param userId User ID to associate the data with
   */
  static async createHealthJourneyData(prismaService: PrismaService, userId: string): Promise<void> {
    // This would create health metrics, goals, and device connections
    // Implementation would depend on the health service schema
  }

  /**
   * Creates test data for the Care journey
   * @param prismaService PrismaService instance
   * @param userId User ID to associate the data with
   */
  static async createCareJourneyData(prismaService: PrismaService, userId: string): Promise<void> {
    // This would create appointments, medications, and provider relationships
    // Implementation would depend on the care service schema
  }

  /**
   * Creates test data for the Plan journey
   * @param prismaService PrismaService instance
   * @param userId User ID to associate the data with
   */
  static async createPlanJourneyData(prismaService: PrismaService, userId: string): Promise<void> {
    // This would create insurance plans, benefits, and claims
    // Implementation would depend on the plan service schema
  }
}

/**
 * Utility for mocking external services
 */
export class ServiceMockFactory {
  /**
   * Creates a mock Kafka producer for testing event emission
   * @returns Mock Kafka producer
   */
  static createMockKafkaProducer() {
    return {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue({
        topicName: 'test-topic',
        partition: 0,
        errorCode: 0,
      }),
    };
  }

  /**
   * Creates a mock Redis client for testing caching and token blacklisting
   * @returns Mock Redis client
   */
  static createMockRedisClient() {
    const store: Record<string, any> = {};
    
    return {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn((key: string) => Promise.resolve(store[key])),
      set: jest.fn((key: string, value: any, options?: any) => {
        store[key] = value;
        return Promise.resolve('OK');
      }),
      del: jest.fn((key: string) => {
        delete store[key];
        return Promise.resolve(1);
      }),
      exists: jest.fn((key: string) => Promise.resolve(store[key] ? 1 : 0)),
    };
  }

  /**
   * Creates a mock HTTP client for testing external API calls
   * @returns Mock HTTP client
   */
  static createMockHttpClient() {
    return {
      get: jest.fn().mockResolvedValue({ data: {} }),
      post: jest.fn().mockResolvedValue({ data: {} }),
      put: jest.fn().mockResolvedValue({ data: {} }),
      delete: jest.fn().mockResolvedValue({ data: {} }),
    };
  }
}