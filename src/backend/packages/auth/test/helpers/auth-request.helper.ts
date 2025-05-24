/**
 * Authentication Request Helper
 * 
 * Provides utilities for creating and manipulating HTTP request objects with authentication data for testing.
 * This helper creates mock Request objects with configurable authentication headers, cookies, and body content
 * that mimic authenticated requests from different clients and journeys.
 */

import { Request } from 'express';
import { JourneyType } from '../../src/interfaces/role.interface';
import { ITokenPayload } from '../../src/interfaces/token.interface';

/**
 * Default test user data
 */
const DEFAULT_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
};

/**
 * Default token expiration (1 hour from now)
 */
const DEFAULT_EXPIRATION = Math.floor(Date.now() / 1000) + 3600;

/**
 * Options for creating an authenticated request
 */
export interface AuthRequestOptions {
  /**
   * User data to include in the token payload
   */
  user?: {
    id: string;
    email: string;
    name: string;
    [key: string]: any;
  };
  
  /**
   * Roles to assign to the user
   */
  roles?: string[];
  
  /**
   * Permissions to assign to the user
   */
  permissions?: string[];
  
  /**
   * Journey context for the request
   */
  journeyType?: JourneyType;
  
  /**
   * Journey-specific context data
   */
  journeyContext?: Record<string, any>;
  
  /**
   * Whether to use cookie-based authentication instead of header-based
   */
  useCookies?: boolean;
  
  /**
   * Request body content
   */
  body?: Record<string, any>;
  
  /**
   * Request query parameters
   */
  query?: Record<string, any>;
  
  /**
   * Request parameters (route params)
   */
  params?: Record<string, any>;
  
  /**
   * Custom headers to include
   */
  headers?: Record<string, any>;
  
  /**
   * Token expiration time (in seconds since epoch)
   */
  exp?: number;
}

/**
 * Creates a Bearer authentication header with the given token
 * 
 * @param token - JWT token string
 * @returns Formatted Bearer authentication header
 */
export function createBearerAuthHeader(token: string): string {
  return `Bearer ${token}`;
}

/**
 * Creates a mock JWT token with the given payload
 * This is a simplified version for testing that doesn't actually sign the token
 * 
 * @param payload - Token payload
 * @returns Mock JWT token string
 */
export function createMockJwtToken(payload: ITokenPayload): string {
  // In a real implementation, this would sign the token
  // For testing purposes, we just encode the payload as base64
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `header.${encodedPayload}.signature`;
}

/**
 * Creates a mock authenticated request object for testing
 * 
 * @param options - Configuration options for the request
 * @returns Mock Express Request object with authentication
 */
export function mockAuthenticatedRequest(options: AuthRequestOptions = {}): Request {
  const {
    user = DEFAULT_USER,
    roles = ['user'],
    permissions = [],
    journeyType = JourneyType.GLOBAL,
    journeyContext = {},
    useCookies = false,
    body = {},
    query = {},
    params = {},
    headers = {},
    exp = DEFAULT_EXPIRATION,
  } = options;

  // Create token payload
  const tokenPayload: ITokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    roles,
    permissions,
    exp,
    iat: Math.floor(Date.now() / 1000),
    journeyContext: {
      journeyType,
      ...journeyContext,
    },
  };

  // Create mock token
  const token = createMockJwtToken(tokenPayload);

  // Create request headers
  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  // Add authentication via header or cookie
  if (useCookies) {
    // For cookie-based authentication
    const cookies: Record<string, string> = {
      'access_token': token,
    };
    
    // Create mock request with cookies
    const request = {
      headers: requestHeaders,
      cookies,
      body,
      query,
      params,
      user: { ...user, roles, permissions },
    } as unknown as Request;
    
    // Add cookie getter method
    request.cookie = (name: string) => cookies[name];
    
    return request;
  } else {
    // For header-based authentication
    requestHeaders.authorization = createBearerAuthHeader(token);
    
    // Create mock request with authorization header
    return {
      headers: requestHeaders,
      cookies: {},
      body,
      query,
      params,
      user: { ...user, roles, permissions },
    } as unknown as Request;
  }
}

/**
 * Creates a mock authenticated request for the Health journey
 * 
 * @param options - Configuration options for the request
 * @returns Mock Express Request object with Health journey authentication
 */
export function mockHealthJourneyRequest(options: Omit<AuthRequestOptions, 'journeyType'> = {}): Request {
  const healthRoles = options.roles || ['health:user'];
  
  return mockAuthenticatedRequest({
    ...options,
    journeyType: JourneyType.HEALTH,
    roles: healthRoles,
    journeyContext: {
      ...options.journeyContext,
      activeJourney: 'health',
    },
  });
}

/**
 * Creates a mock authenticated request for the Care journey
 * 
 * @param options - Configuration options for the request
 * @returns Mock Express Request object with Care journey authentication
 */
export function mockCareJourneyRequest(options: Omit<AuthRequestOptions, 'journeyType'> = {}): Request {
  const careRoles = options.roles || ['care:user'];
  
  return mockAuthenticatedRequest({
    ...options,
    journeyType: JourneyType.CARE,
    roles: careRoles,
    journeyContext: {
      ...options.journeyContext,
      activeJourney: 'care',
    },
  });
}

/**
 * Creates a mock authenticated request for the Plan journey
 * 
 * @param options - Configuration options for the request
 * @returns Mock Express Request object with Plan journey authentication
 */
export function mockPlanJourneyRequest(options: Omit<AuthRequestOptions, 'journeyType'> = {}): Request {
  const planRoles = options.roles || ['plan:user'];
  
  return mockAuthenticatedRequest({
    ...options,
    journeyType: JourneyType.PLAN,
    roles: planRoles,
    journeyContext: {
      ...options.journeyContext,
      activeJourney: 'plan',
    },
  });
}

/**
 * Creates a mock authenticated request with admin permissions
 * 
 * @param options - Configuration options for the request
 * @returns Mock Express Request object with admin authentication
 */
export function mockAdminRequest(options: Omit<AuthRequestOptions, 'roles'> = {}): Request {
  return mockAuthenticatedRequest({
    ...options,
    roles: ['admin'],
    permissions: ['*:*'], // Admin has all permissions
  });
}

/**
 * Creates a mock authenticated request with specific permissions
 * 
 * @param permissions - Array of permission strings (e.g., ['health:read', 'care:write'])
 * @param options - Additional configuration options for the request
 * @returns Mock Express Request object with specified permissions
 */
export function mockRequestWithPermissions(
  permissions: string[],
  options: Omit<AuthRequestOptions, 'permissions'> = {}
): Request {
  return mockAuthenticatedRequest({
    ...options,
    permissions,
  });
}

/**
 * Creates a mock unauthenticated request object for testing
 * 
 * @param options - Configuration options for the request
 * @returns Mock Express Request object without authentication
 */
export function mockUnauthenticatedRequest(
  options: Pick<AuthRequestOptions, 'body' | 'query' | 'params' | 'headers'> = {}
): Request {
  const { body = {}, query = {}, params = {}, headers = {} } = options;
  
  return {
    headers,
    cookies: {},
    body,
    query,
    params,
  } as unknown as Request;
}