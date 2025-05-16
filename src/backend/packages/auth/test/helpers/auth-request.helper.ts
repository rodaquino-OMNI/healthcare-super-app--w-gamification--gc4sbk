import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ITokenPayload, IUser } from '../../src/interfaces';
import { createSecureAxios } from 'src/backend/shared/src/utils/secure-axios';

/**
 * Default test user for authentication tests
 */
export const DEFAULT_TEST_USER: IUser = {
  id: 'test-user-id',
  email: 'test@austa.health',
  firstName: 'Test',
  lastName: 'User',
  roles: ['user'],
  permissions: ['read:profile', 'update:profile'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Journey-specific test users
 */
export const JOURNEY_TEST_USERS = {
  health: {
    ...DEFAULT_TEST_USER,
    id: 'health-user-id',
    email: 'health@austa.health',
    roles: ['user', 'health:viewer'],
    permissions: ['read:profile', 'update:profile', 'read:health', 'update:health'],
    journeyContext: { currentJourney: 'health' },
  },
  care: {
    ...DEFAULT_TEST_USER,
    id: 'care-user-id',
    email: 'care@austa.health',
    roles: ['user', 'care:viewer'],
    permissions: ['read:profile', 'update:profile', 'read:care', 'update:care'],
    journeyContext: { currentJourney: 'care' },
  },
  plan: {
    ...DEFAULT_TEST_USER,
    id: 'plan-user-id',
    email: 'plan@austa.health',
    roles: ['user', 'plan:viewer'],
    permissions: ['read:profile', 'update:profile', 'read:plan', 'update:plan'],
    journeyContext: { currentJourney: 'plan' },
  },
  admin: {
    ...DEFAULT_TEST_USER,
    id: 'admin-user-id',
    email: 'admin@austa.health',
    roles: ['admin'],
    permissions: ['*'],
    journeyContext: { currentJourney: 'admin' },
  },
};

/**
 * Permission sets for different user types
 */
export const PERMISSION_SETS = {
  readonly: ['read:profile', 'read:health', 'read:care', 'read:plan'],
  standard: ['read:profile', 'update:profile', 'read:health', 'update:health', 'read:care', 'update:care', 'read:plan'],
  premium: ['read:profile', 'update:profile', 'read:health', 'update:health', 'read:care', 'update:care', 'read:plan', 'update:plan'],
  admin: ['*'],
};

/**
 * Options for creating authenticated request objects
 */
export interface MockRequestOptions {
  /** User data to include in the request */
  user?: Partial<IUser>;
  /** Whether to include the user in the request body */
  includeUserInBody?: boolean;
  /** Whether to use cookie-based authentication instead of headers */
  useCookieAuth?: boolean;
  /** Additional headers to include in the request */
  headers?: Record<string, string>;
  /** Request body content */
  body?: Record<string, any>;
  /** Request query parameters */
  query?: Record<string, any>;
  /** Request parameters (route params) */
  params?: Record<string, any>;
  /** Journey context to include */
  journeyContext?: string;
  /** Custom token payload overrides */
  tokenPayload?: Partial<ITokenPayload>;
  /** Whether to include an invalid token */
  invalidToken?: boolean;
}

/**
 * Creates a Bearer token authorization header
 * 
 * @param token - JWT token string
 * @returns Authorization header with Bearer prefix
 */
export function createBearerAuthHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Creates a mock JWT token for testing
 * 
 * @param user - User data to include in the token
 * @param customPayload - Additional payload data to include
 * @param invalidSignature - Whether to create a token with invalid signature
 * @returns JWT token string
 */
export function createMockJwtToken(
  user: Partial<IUser> = DEFAULT_TEST_USER,
  customPayload: Partial<ITokenPayload> = {},
  invalidSignature = false
): string {
  const jwtService = new JwtService({
    secret: invalidSignature ? 'wrong-secret' : 'test-secret',
  });

  const payload: ITokenPayload = {
    sub: user.id || DEFAULT_TEST_USER.id,
    email: user.email || DEFAULT_TEST_USER.email,
    roles: user.roles || DEFAULT_TEST_USER.roles,
    permissions: user.permissions || DEFAULT_TEST_USER.permissions,
    journeyContext: user.journeyContext || { currentJourney: 'health' },
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    ...customPayload,
  };

  return jwtService.sign(payload);
}

/**
 * Creates a mock authenticated request object for testing
 * 
 * @param options - Configuration options for the mock request
 * @returns Express Request object with authentication data
 */
export function mockAuthenticatedRequest(options: MockRequestOptions = {}): Request {
  const {
    user = DEFAULT_TEST_USER,
    includeUserInBody = false,
    useCookieAuth = false,
    headers = {},
    body = {},
    query = {},
    params = {},
    journeyContext,
    tokenPayload = {},
    invalidToken = false,
  } = options;

  // Create user with journey context if specified
  const userWithContext = journeyContext
    ? { ...user, journeyContext: { currentJourney: journeyContext } }
    : user;

  // Create JWT token
  const token = createMockJwtToken(userWithContext, tokenPayload, invalidToken);

  // Create request object
  const request = {
    user: userWithContext,
    body: includeUserInBody ? { ...body, user: userWithContext } : { ...body },
    query: { ...query },
    params: { ...params },
    headers: { ...headers },
    cookies: {},
    get: (name: string) => request.headers[name.toLowerCase()],
  } as unknown as Request;

  // Add authentication data based on method
  if (useCookieAuth) {
    request.cookies['auth_token'] = token;
  } else {
    request.headers = {
      ...request.headers,
      ...createBearerAuthHeader(token),
    };
  }

  return request;
}

/**
 * Creates a mock authenticated request for the Health journey
 * 
 * @param options - Additional request options
 * @returns Express Request object with Health journey authentication
 */
export function mockHealthJourneyRequest(options: Omit<MockRequestOptions, 'user' | 'journeyContext'> = {}): Request {
  return mockAuthenticatedRequest({
    ...options,
    user: JOURNEY_TEST_USERS.health,
    journeyContext: 'health',
  });
}

/**
 * Creates a mock authenticated request for the Care journey
 * 
 * @param options - Additional request options
 * @returns Express Request object with Care journey authentication
 */
export function mockCareJourneyRequest(options: Omit<MockRequestOptions, 'user' | 'journeyContext'> = {}): Request {
  return mockAuthenticatedRequest({
    ...options,
    user: JOURNEY_TEST_USERS.care,
    journeyContext: 'care',
  });
}

/**
 * Creates a mock authenticated request for the Plan journey
 * 
 * @param options - Additional request options
 * @returns Express Request object with Plan journey authentication
 */
export function mockPlanJourneyRequest(options: Omit<MockRequestOptions, 'user' | 'journeyContext'> = {}): Request {
  return mockAuthenticatedRequest({
    ...options,
    user: JOURNEY_TEST_USERS.plan,
    journeyContext: 'plan',
  });
}

/**
 * Creates a mock authenticated request for an admin user
 * 
 * @param options - Additional request options
 * @returns Express Request object with admin authentication
 */
export function mockAdminRequest(options: Omit<MockRequestOptions, 'user'> = {}): Request {
  return mockAuthenticatedRequest({
    ...options,
    user: JOURNEY_TEST_USERS.admin,
  });
}

/**
 * Creates a mock authenticated request with specific permissions
 * 
 * @param permissions - Array of permission strings to include
 * @param options - Additional request options
 * @returns Express Request object with specified permissions
 */
export function mockRequestWithPermissions(
  permissions: string[],
  options: Omit<MockRequestOptions, 'user'> = {}
): Request {
  return mockAuthenticatedRequest({
    ...options,
    user: {
      ...DEFAULT_TEST_USER,
      permissions,
    },
  });
}

/**
 * Creates a mock authenticated request with a predefined permission set
 * 
 * @param permissionSetKey - Key of the permission set to use
 * @param options - Additional request options
 * @returns Express Request object with the specified permission set
 */
export function mockRequestWithPermissionSet(
  permissionSetKey: keyof typeof PERMISSION_SETS,
  options: Omit<MockRequestOptions, 'user'> = {}
): Request {
  return mockRequestWithPermissions(PERMISSION_SETS[permissionSetKey], options);
}

/**
 * Creates a mock authenticated request with an expired token
 * 
 * @param options - Additional request options
 * @returns Express Request object with expired authentication
 */
export function mockExpiredTokenRequest(options: Omit<MockRequestOptions, 'tokenPayload'> = {}): Request {
  return mockAuthenticatedRequest({
    ...options,
    tokenPayload: {
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    },
  });
}

/**
 * Creates a mock authenticated request with an invalid token signature
 * 
 * @param options - Additional request options
 * @returns Express Request object with invalid token authentication
 */
export function mockInvalidTokenRequest(options: Omit<MockRequestOptions, 'invalidToken'> = {}): Request {
  return mockAuthenticatedRequest({
    ...options,
    invalidToken: true,
  });
}

/**
 * Creates a mock unauthenticated request (no auth token)
 * 
 * @param options - Request options excluding authentication
 * @returns Express Request object without authentication
 */
export function mockUnauthenticatedRequest(
  options: Pick<MockRequestOptions, 'headers' | 'body' | 'query' | 'params'> = {}
): Request {
  const { headers = {}, body = {}, query = {}, params = {} } = options;
  
  return {
    body,
    query,
    params,
    headers,
    cookies: {},
    get: (name: string) => headers[name.toLowerCase()],
  } as unknown as Request;
}

/**
 * Creates a mock HTTP client with authentication headers
 * 
 * @param user - User to authenticate as
 * @param options - Additional options for token generation
 * @returns Axios instance with authentication headers
 */
export function createAuthenticatedHttpClient(
  user: Partial<IUser> = DEFAULT_TEST_USER,
  options: { tokenPayload?: Partial<ITokenPayload>; invalidToken?: boolean } = {}
) {
  const token = createMockJwtToken(user, options.tokenPayload, options.invalidToken);
  const axiosInstance = createSecureAxios();
  
  axiosInstance.defaults.headers.common = {
    ...axiosInstance.defaults.headers.common,
    ...createBearerAuthHeader(token),
  };
  
  return axiosInstance;
}