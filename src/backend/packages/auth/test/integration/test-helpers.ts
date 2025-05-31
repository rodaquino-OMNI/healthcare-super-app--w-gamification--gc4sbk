import { DynamicModule, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

// Import from the new package structure using path aliases
import { IRole, ITokenPayload, IUser, IUserWithRoles } from '@austa/interfaces';

/**
 * Configuration options for creating a test module
 */
export interface TestModuleOptions {
  /**
   * Additional providers to include in the test module
   */
  providers?: Provider[];
  
  /**
   * Additional imports to include in the test module
   */
  imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule>>;
  
  /**
   * Whether to include the JwtModule in the test module
   * @default true
   */
  includeJwtModule?: boolean;
  
  /**
   * Whether to include the ConfigModule in the test module
   * @default true
   */
  includeConfigModule?: boolean;
  
  /**
   * JWT secret to use for token signing
   * @default 'test-secret-key'
   */
  jwtSecret?: string;
  
  /**
   * JWT expiration time
   * @default '1h'
   */
  jwtExpiresIn?: string;
}

/**
 * Default test user roles for different journeys
 */
export const TEST_ROLES = {
  ADMIN: { id: '1', name: 'admin', description: 'Administrator' },
  USER: { id: '2', name: 'user', description: 'Regular User' },
  HEALTH_ADMIN: { id: '3', name: 'health:admin', description: 'Health Journey Administrator' },
  HEALTH_USER: { id: '4', name: 'health:user', description: 'Health Journey User' },
  CARE_ADMIN: { id: '5', name: 'care:admin', description: 'Care Journey Administrator' },
  CARE_PROVIDER: { id: '6', name: 'care:provider', description: 'Care Journey Provider' },
  CARE_USER: { id: '7', name: 'care:user', description: 'Care Journey User' },
  PLAN_ADMIN: { id: '8', name: 'plan:admin', description: 'Plan Journey Administrator' },
  PLAN_MANAGER: { id: '9', name: 'plan:manager', description: 'Plan Journey Manager' },
  PLAN_USER: { id: '10', name: 'plan:user', description: 'Plan Journey User' },
};

/**
 * Default test JWT secret key
 */
export const TEST_JWT_SECRET = 'test-secret-key';

/**
 * Default test JWT expiration time
 */
export const TEST_JWT_EXPIRES_IN = '1h';

/**
 * Creates a test module with configurable providers and imports
 * 
 * @param options - Configuration options for the test module
 * @returns A promise that resolves to a TestingModule
 * 
 * @example
 * // Create a basic test module with default configuration
 * const module = await createTestModule();
 * 
 * @example
 * // Create a test module with custom providers
 * const module = await createTestModule({
 *   providers: [
 *     {
 *       provide: AuthService,
 *       useValue: mockAuthService,
 *     },
 *   ],
 * });
 */
export async function createTestModule(options: TestModuleOptions = {}): Promise<TestingModule> {
  const {
    providers = [],
    imports = [],
    includeJwtModule = true,
    includeConfigModule = true,
    jwtSecret = TEST_JWT_SECRET,
    jwtExpiresIn = TEST_JWT_EXPIRES_IN,
  } = options;

  const moduleImports = [...imports];
  
  // Add ConfigModule if requested
  if (includeConfigModule) {
    moduleImports.push(
      ConfigModule.forRoot({
        isGlobal: true,
        load: [() => ({
          jwt: {
            secret: jwtSecret,
            expiresIn: jwtExpiresIn,
          },
        })],
      }),
    );
  }
  
  // Add JwtModule if requested
  if (includeJwtModule) {
    moduleImports.push(
      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          secret: configService.get<string>('jwt.secret', jwtSecret),
          signOptions: {
            expiresIn: configService.get<string>('jwt.expiresIn', jwtExpiresIn),
          },
        }),
      }),
    );
  }

  // Create the test module
  return Test.createTestingModule({
    imports: moduleImports,
    providers: [...providers],
  }).compile();
}

/**
 * Creates a test user with configurable roles
 * 
 * @param overrides - Properties to override in the default test user
 * @param roles - Roles to assign to the test user
 * @returns A test user with the specified roles
 * 
 * @example
 * // Create a test user with default values
 * const user = createTestUser();
 * 
 * @example
 * // Create a test user with custom values and roles
 * const user = createTestUser(
 *   { email: 'custom@example.com' },
 *   [TEST_ROLES.ADMIN, TEST_ROLES.HEALTH_ADMIN]
 * );
 */
export function createTestUser(
  overrides: Partial<IUser> = {},
  roles: IRole[] = [TEST_ROLES.USER],
): IUserWithRoles {
  const defaultUser: IUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    ...defaultUser,
    ...overrides,
    roles,
  };
}

/**
 * Creates a test admin user
 * 
 * @param overrides - Properties to override in the default admin user
 * @returns A test admin user
 * 
 * @example
 * // Create a test admin user
 * const adminUser = createTestAdminUser();
 */
export function createTestAdminUser(overrides: Partial<IUser> = {}): IUserWithRoles {
  return createTestUser(
    {
      id: '2',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      ...overrides,
    },
    [TEST_ROLES.ADMIN],
  );
}

/**
 * Creates a test health journey user
 * 
 * @param overrides - Properties to override in the default health user
 * @param isAdmin - Whether the user should have health admin role
 * @returns A test health journey user
 * 
 * @example
 * // Create a regular health journey user
 * const healthUser = createTestHealthUser();
 * 
 * @example
 * // Create a health journey admin user
 * const healthAdminUser = createTestHealthUser({}, true);
 */
export function createTestHealthUser(
  overrides: Partial<IUser> = {},
  isAdmin = false,
): IUserWithRoles {
  return createTestUser(
    {
      id: '3',
      email: 'health@example.com',
      firstName: 'Health',
      lastName: 'User',
      ...overrides,
    },
    isAdmin ? [TEST_ROLES.HEALTH_ADMIN, TEST_ROLES.HEALTH_USER] : [TEST_ROLES.HEALTH_USER],
  );
}

/**
 * Creates a test care journey user
 * 
 * @param overrides - Properties to override in the default care user
 * @param role - The role to assign to the user (admin, provider, or user)
 * @returns A test care journey user
 * 
 * @example
 * // Create a regular care journey user
 * const careUser = createTestCareUser();
 * 
 * @example
 * // Create a care journey provider
 * const careProviderUser = createTestCareUser({}, 'provider');
 * 
 * @example
 * // Create a care journey admin
 * const careAdminUser = createTestCareUser({}, 'admin');
 */
export function createTestCareUser(
  overrides: Partial<IUser> = {},
  role: 'admin' | 'provider' | 'user' = 'user',
): IUserWithRoles {
  const roles = {
    admin: [TEST_ROLES.CARE_ADMIN, TEST_ROLES.CARE_USER],
    provider: [TEST_ROLES.CARE_PROVIDER, TEST_ROLES.CARE_USER],
    user: [TEST_ROLES.CARE_USER],
  };

  return createTestUser(
    {
      id: '4',
      email: `care-${role}@example.com`,
      firstName: 'Care',
      lastName: role === 'user' ? 'User' : role === 'admin' ? 'Admin' : 'Provider',
      ...overrides,
    },
    roles[role],
  );
}

/**
 * Creates a test plan journey user
 * 
 * @param overrides - Properties to override in the default plan user
 * @param role - The role to assign to the user (admin, manager, or user)
 * @returns A test plan journey user
 * 
 * @example
 * // Create a regular plan journey user
 * const planUser = createTestPlanUser();
 * 
 * @example
 * // Create a plan journey manager
 * const planManagerUser = createTestPlanUser({}, 'manager');
 * 
 * @example
 * // Create a plan journey admin
 * const planAdminUser = createTestPlanUser({}, 'admin');
 */
export function createTestPlanUser(
  overrides: Partial<IUser> = {},
  role: 'admin' | 'manager' | 'user' = 'user',
): IUserWithRoles {
  const roles = {
    admin: [TEST_ROLES.PLAN_ADMIN, TEST_ROLES.PLAN_USER],
    manager: [TEST_ROLES.PLAN_MANAGER, TEST_ROLES.PLAN_USER],
    user: [TEST_ROLES.PLAN_USER],
  };

  return createTestUser(
    {
      id: '5',
      email: `plan-${role}@example.com`,
      firstName: 'Plan',
      lastName: role === 'user' ? 'User' : role === 'admin' ? 'Admin' : 'Manager',
      ...overrides,
    },
    roles[role],
  );
}

/**
 * Generates a valid JWT token for testing
 * 
 * @param user - The user to generate a token for
 * @param secret - The secret to use for signing the token
 * @param expiresIn - The expiration time for the token
 * @returns A signed JWT token
 * 
 * @example
 * // Generate a token for a test user with default settings
 * const token = generateTestToken(createTestUser());
 * 
 * @example
 * // Generate a token for an admin user with custom expiration
 * const token = generateTestToken(createTestAdminUser(), 'custom-secret', '15m');
 */
export function generateTestToken(
  user: IUserWithRoles,
  secret: string = TEST_JWT_SECRET,
  expiresIn: string = TEST_JWT_EXPIRES_IN,
): string {
  const payload: ITokenPayload = {
    sub: user.id,
    email: user.email,
    roles: user.roles.map(role => role.name),
    firstName: user.firstName,
    lastName: user.lastName,
  };

  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Creates a mock authenticated request object for testing
 * 
 * @param user - The user to authenticate the request with
 * @param token - The token to use for authentication (generated if not provided)
 * @param requestOverrides - Additional properties to add to the request object
 * @returns A mock Express Request object with authentication
 * 
 * @example
 * // Create a request authenticated with a test user
 * const req = createAuthenticatedRequest(createTestUser());
 * 
 * @example
 * // Create a request with custom token and additional properties
 * const req = createAuthenticatedRequest(
 *   createTestAdminUser(),
 *   'custom-token',
 *   { body: { data: 'test' } }
 * );
 */
export function createAuthenticatedRequest(
  user: IUserWithRoles,
  token?: string,
  requestOverrides: Partial<Request> = {},
): Request {
  const authToken = token || generateTestToken(user);
  
  // Create a partial request object with authentication headers
  const req: Partial<Request> = {
    headers: {
      authorization: `Bearer ${authToken}`,
    },
    user,
    ...requestOverrides,
  };

  return req as Request;
}

/**
 * Creates a mock JWT service for testing
 * 
 * @param options - Configuration options for the mock JWT service
 * @returns A mock JwtService
 * 
 * @example
 * // Create a mock JWT service with default behavior
 * const jwtService = createMockJwtService();
 * 
 * @example
 * // Create a mock JWT service with custom verify behavior
 * const jwtService = createMockJwtService({
 *   verifyCallback: () => ({ sub: 'custom-id', email: 'custom@example.com' }),
 * });
 */
export function createMockJwtService(options: {
  signCallback?: (payload: any, options?: any) => string;
  verifyCallback?: (token: string) => any;
} = {}): Partial<JwtService> {
  const {
    signCallback = (payload) => JSON.stringify(payload),
    verifyCallback = (token) => JSON.parse(token),
  } = options;

  return {
    sign: jest.fn().mockImplementation(signCallback),
    verify: jest.fn().mockImplementation(verifyCallback),
    decode: jest.fn().mockImplementation((token) => JSON.parse(token)),
  };
}

/**
 * Creates a test module with a mock JWT service
 * 
 * @param options - Configuration options for the test module
 * @param jwtServiceOptions - Configuration options for the mock JWT service
 * @returns A promise that resolves to a TestingModule
 * 
 * @example
 * // Create a test module with a mock JWT service
 * const module = await createTestModuleWithMockJwtService();
 * 
 * @example
 * // Create a test module with custom providers and JWT service behavior
 * const module = await createTestModuleWithMockJwtService(
 *   { providers: [mockAuthService] },
 *   { verifyCallback: () => ({ sub: 'custom-id' }) }
 * );
 */
export async function createTestModuleWithMockJwtService(
  options: TestModuleOptions = {},
  jwtServiceOptions = {},
): Promise<TestingModule> {
  const mockJwtService = createMockJwtService(jwtServiceOptions);
  
  return createTestModule({
    ...options,
    includeJwtModule: false,
    providers: [
      ...(options.providers || []),
      {
        provide: JwtService,
        useValue: mockJwtService,
      },
    ],
  });
}

/**
 * Validates a JWT token and returns the decoded payload
 * 
 * @param token - The token to validate
 * @param secret - The secret to use for validation
 * @returns The decoded token payload
 * @throws Error if the token is invalid
 * 
 * @example
 * // Validate a token with the default secret
 * const payload = validateTestToken(token);
 * 
 * @example
 * // Validate a token with a custom secret
 * const payload = validateTestToken(token, 'custom-secret');
 */
export function validateTestToken(
  token: string,
  secret: string = TEST_JWT_SECRET,
): ITokenPayload {
  try {
    // We use the jsonwebtoken library directly to avoid dependencies on JwtService
    const decoded = jwt.verify(token, secret) as ITokenPayload;
    return decoded;
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
}

/**
 * Creates a bearer token header for testing
 * 
 * @param token - The token to use in the header
 * @returns An authorization header with the bearer token
 * 
 * @example
 * // Create a bearer token header
 * const headers = createBearerTokenHeader(token);
 */
export function createBearerTokenHeader(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}

/**
 * Creates a test module with a real JWT service
 * 
 * @param options - Configuration options for the test module
 * @returns A promise that resolves to a TestingModule with a real JwtService
 * 
 * @example
 * // Create a test module with a real JWT service
 * const module = await createTestModuleWithRealJwtService();
 * const jwtService = module.get(JwtService);
 * const token = jwtService.sign({ sub: 'user-id' });
 */
export async function createTestModuleWithRealJwtService(
  options: TestModuleOptions = {},
): Promise<TestingModule> {
  return createTestModule({
    ...options,
    includeJwtModule: true,
  });
}