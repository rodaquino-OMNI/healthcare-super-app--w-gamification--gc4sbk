/**
 * @file http-contexts.ts
 * @description Provides mock HTTP request and response objects for testing error middleware, filters, and serialization.
 * 
 * This file contains fixtures that simulate various HTTP contexts with different authentication states,
 * request properties, and response capturing capabilities. These fixtures enable consistent and repeatable
 * testing of how errors are transformed into HTTP responses with correct status codes, headers, and body formats.
 */

import { HttpStatus } from '@nestjs/common';
import { JourneyType, ErrorType } from '../../src/base';
import { AUTH_ERROR_CODES, COMMON_ERROR_CODES } from '../../src/constants';

/**
 * Interface for mock HTTP request objects
 */
export interface MockHttpRequest {
  /** HTTP method */
  method: string;
  /** Request URL */
  url: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request query parameters */
  query: Record<string, any>;
  /** Request body */
  body: any;
  /** Authenticated user (if any) */
  user?: {
    id: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
  };
  /** Request IP address */
  ip?: string;
  /** Original request URL (for proxied requests) */
  originalUrl?: string;
  /** Request parameters (from URL path) */
  params?: Record<string, string>;
}

/**
 * Interface for mock HTTP response objects
 */
export interface MockHttpResponse {
  /** Response status code */
  statusCode: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body */
  body: any;
  /** Function to set response status */
  status: (code: number) => MockHttpResponse;
  /** Function to send JSON response */
  json: (data: any) => MockHttpResponse;
  /** Function to send text response */
  send: (data: any) => MockHttpResponse;
  /** Function to set response header */
  setHeader: (name: string, value: string) => MockHttpResponse;
}

/**
 * Creates a mock HTTP request object with default values
 * 
 * @param overrides - Properties to override in the default request
 * @returns A mock HTTP request object
 */
export function createMockRequest(overrides: Partial<MockHttpRequest> = {}): MockHttpRequest {
  return {
    method: 'GET',
    url: '/api/test',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
      'x-request-id': '12345678-1234-1234-1234-123456789012',
      'user-agent': 'Jest Test Runner',
    },
    query: {},
    body: {},
    ip: '127.0.0.1',
    originalUrl: '/api/test',
    params: {},
    ...overrides
  };
}

/**
 * Creates a mock HTTP response object that captures response data
 * 
 * @returns A mock HTTP response object
 */
export function createMockResponse(): MockHttpResponse {
  const response: MockHttpResponse = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
    send(data: any) {
      this.body = data;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    }
  };
  
  return response;
}

/**
 * Creates a mock HTTP request with an authenticated user
 * 
 * @param userId - User ID for the authenticated user
 * @param roles - Optional roles for the authenticated user
 * @param journeyType - Optional journey context
 * @param overrides - Additional request properties to override
 * @returns A mock HTTP request with authentication
 */
export function createAuthenticatedRequest(
  userId: string = 'user-123',
  roles: string[] = ['user'],
  journeyType?: JourneyType,
  overrides: Partial<MockHttpRequest> = {}
): MockHttpRequest {
  const headers: Record<string, string> = {
    'authorization': 'Bearer mock-jwt-token',
  };
  
  if (journeyType) {
    headers['x-journey-id'] = journeyType;
  }
  
  return createMockRequest({
    user: {
      id: userId,
      email: `${userId}@example.com`,
      roles,
      permissions: []
    },
    headers: {
      ...headers,
      ...(overrides.headers || {})
    },
    ...overrides
  });
}

/**
 * Creates a mock HTTP request with an admin user
 * 
 * @param userId - User ID for the admin user
 * @param journeyType - Optional journey context
 * @param overrides - Additional request properties to override
 * @returns A mock HTTP request with admin authentication
 */
export function createAdminRequest(
  userId: string = 'admin-123',
  journeyType?: JourneyType,
  overrides: Partial<MockHttpRequest> = {}
): MockHttpRequest {
  return createAuthenticatedRequest(
    userId,
    ['admin', 'user'],
    journeyType,
    overrides
  );
}

/**
 * Creates a mock HTTP request with an expired session
 * 
 * @param userId - User ID for the user with expired session
 * @param journeyType - Optional journey context
 * @param overrides - Additional request properties to override
 * @returns A mock HTTP request with expired session
 */
export function createExpiredSessionRequest(
  userId: string = 'user-123',
  journeyType?: JourneyType,
  overrides: Partial<MockHttpRequest> = {}
): MockHttpRequest {
  return createMockRequest({
    headers: {
      'authorization': 'Bearer expired-jwt-token',
      ...(journeyType ? { 'x-journey-id': journeyType } : {}),
      ...(overrides.headers || {})
    },
    ...overrides
  });
}

/**
 * Creates a mock HTTP request with invalid authentication
 * 
 * @param journeyType - Optional journey context
 * @param overrides - Additional request properties to override
 * @returns A mock HTTP request with invalid authentication
 */
export function createInvalidAuthRequest(
  journeyType?: JourneyType,
  overrides: Partial<MockHttpRequest> = {}
): MockHttpRequest {
  return createMockRequest({
    headers: {
      'authorization': 'Bearer invalid-jwt-token',
      ...(journeyType ? { 'x-journey-id': journeyType } : {}),
      ...(overrides.headers || {})
    },
    ...overrides
  });
}

/**
 * Creates a mock HTTP request with no authentication
 * 
 * @param journeyType - Optional journey context
 * @param overrides - Additional request properties to override
 * @returns A mock HTTP request without authentication
 */
export function createUnauthenticatedRequest(
  journeyType?: JourneyType,
  overrides: Partial<MockHttpRequest> = {}
): MockHttpRequest {
  return createMockRequest({
    headers: {
      ...(journeyType ? { 'x-journey-id': journeyType } : {}),
      ...(overrides.headers || {})
    },
    ...overrides
  });
}

/**
 * Creates a mock HTTP request with invalid input data
 * 
 * @param invalidData - The invalid data to include in the request body
 * @param journeyType - Optional journey context
 * @param overrides - Additional request properties to override
 * @returns A mock HTTP request with invalid input
 */
export function createInvalidInputRequest(
  invalidData: any,
  journeyType?: JourneyType,
  overrides: Partial<MockHttpRequest> = {}
): MockHttpRequest {
  return createMockRequest({
    method: 'POST',
    body: invalidData,
    headers: {
      'content-type': 'application/json',
      ...(journeyType ? { 'x-journey-id': journeyType } : {}),
      ...(overrides.headers || {})
    },
    ...overrides
  });
}

/**
 * Creates a mock HTTP request for a specific journey
 * 
 * @param journeyType - The journey context
 * @param authenticated - Whether the request should be authenticated
 * @param overrides - Additional request properties to override
 * @returns A mock HTTP request for the specified journey
 */
export function createJourneyRequest(
  journeyType: JourneyType,
  authenticated: boolean = true,
  overrides: Partial<MockHttpRequest> = {}
): MockHttpRequest {
  if (authenticated) {
    return createAuthenticatedRequest('user-123', ['user'], journeyType, overrides);
  } else {
    return createUnauthenticatedRequest(journeyType, overrides);
  }
}

/**
 * Interface for expected error response in tests
 */
export interface ExpectedErrorResponse {
  /** Expected HTTP status code */
  statusCode: HttpStatus;
  /** Expected error type */
  errorType: ErrorType;
  /** Expected error code */
  errorCode: string;
  /** Expected error message pattern (string or RegExp) */
  messagePattern: string | RegExp;
  /** Expected journey context (if any) */
  journey?: JourneyType;
}

/**
 * Predefined expected error responses for common scenarios
 */
export const EXPECTED_ERROR_RESPONSES = {
  /** Validation error response */
  VALIDATION_ERROR: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorType: ErrorType.VALIDATION,
    errorCode: COMMON_ERROR_CODES.VALIDATION_ERROR,
    messagePattern: /invalid/i
  },
  
  /** Authentication error response */
  UNAUTHORIZED_ERROR: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorType: ErrorType.AUTHENTICATION,
    errorCode: COMMON_ERROR_CODES.UNAUTHORIZED,
    messagePattern: /authentication|unauthorized/i
  },
  
  /** Authorization error response */
  FORBIDDEN_ERROR: {
    statusCode: HttpStatus.FORBIDDEN,
    errorType: ErrorType.AUTHORIZATION,
    errorCode: COMMON_ERROR_CODES.FORBIDDEN,
    messagePattern: /permission|forbidden/i
  },
  
  /** Not found error response */
  NOT_FOUND_ERROR: {
    statusCode: HttpStatus.NOT_FOUND,
    errorType: ErrorType.NOT_FOUND,
    errorCode: COMMON_ERROR_CODES.NOT_FOUND,
    messagePattern: /not found/i
  },
  
  /** Internal server error response */
  INTERNAL_ERROR: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errorType: ErrorType.TECHNICAL,
    errorCode: COMMON_ERROR_CODES.INTERNAL_ERROR,
    messagePattern: /unexpected|internal/i
  },
  
  /** External service error response */
  EXTERNAL_ERROR: {
    statusCode: HttpStatus.BAD_GATEWAY,
    errorType: ErrorType.EXTERNAL,
    errorCode: COMMON_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    messagePattern: /external|unavailable/i
  },
  
  /** Session expired error response */
  SESSION_EXPIRED_ERROR: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorType: ErrorType.AUTHENTICATION,
    errorCode: AUTH_ERROR_CODES.SESSION_EXPIRED,
    messagePattern: /session expired/i
  },
  
  /** Invalid token error response */
  INVALID_TOKEN_ERROR: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorType: ErrorType.AUTHENTICATION,
    errorCode: AUTH_ERROR_CODES.INVALID_TOKEN,
    messagePattern: /invalid token/i
  },
  
  /** Rate limit exceeded error response */
  RATE_LIMIT_ERROR: {
    statusCode: HttpStatus.TOO_MANY_REQUESTS,
    errorType: ErrorType.RATE_LIMIT,
    errorCode: COMMON_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    messagePattern: /too many requests/i
  },
  
  /** Conflict error response */
  CONFLICT_ERROR: {
    statusCode: HttpStatus.CONFLICT,
    errorType: ErrorType.CONFLICT,
    errorCode: COMMON_ERROR_CODES.CONFLICT,
    messagePattern: /conflict/i
  }
};

/**
 * Creates journey-specific expected error responses
 * 
 * @param baseResponse - Base expected error response
 * @param journeyType - Journey context to add
 * @returns Expected error response with journey context
 */
export function createJourneyErrorResponse(
  baseResponse: ExpectedErrorResponse,
  journeyType: JourneyType
): ExpectedErrorResponse {
  return {
    ...baseResponse,
    journey: journeyType
  };
}

/**
 * Validates that an actual error response matches the expected error response
 * 
 * @param actual - Actual error response from the test
 * @param expected - Expected error response
 * @returns void
 * @throws Error if the actual response doesn't match the expected response
 */
export function validateErrorResponse(
  actual: any,
  expected: ExpectedErrorResponse
): void {
  // Check status code
  if (actual.statusCode !== expected.statusCode) {
    throw new Error(`Expected status code ${expected.statusCode}, but got ${actual.statusCode}`);
  }
  
  // Check error type
  if (actual.body?.error?.type !== expected.errorType) {
    throw new Error(`Expected error type ${expected.errorType}, but got ${actual.body?.error?.type}`);
  }
  
  // Check error code
  if (actual.body?.error?.code !== expected.errorCode) {
    throw new Error(`Expected error code ${expected.errorCode}, but got ${actual.body?.error?.code}`);
  }
  
  // Check error message pattern
  const message = actual.body?.error?.message;
  if (typeof expected.messagePattern === 'string') {
    if (message !== expected.messagePattern) {
      throw new Error(`Expected error message "${expected.messagePattern}", but got "${message}"`);
    }
  } else if (expected.messagePattern instanceof RegExp) {
    if (!expected.messagePattern.test(message)) {
      throw new Error(`Expected error message to match ${expected.messagePattern}, but got "${message}"`);
    }
  }
  
  // Check journey context if specified
  if (expected.journey && actual.body?.error?.journey !== expected.journey) {
    throw new Error(`Expected journey ${expected.journey}, but got ${actual.body?.error?.journey}`);
  }
}

/**
 * Creates a mock HTTP context with request and response objects
 * 
 * @param request - Mock HTTP request or request overrides
 * @param response - Mock HTTP response (optional)
 * @returns Object with request, response, and helper methods
 */
export function createMockHttpContext(
  request: MockHttpRequest | Partial<MockHttpRequest> = {},
  response: MockHttpResponse = createMockResponse()
) {
  const req = request instanceof Object && 'method' in request
    ? request as MockHttpRequest
    : createMockRequest(request as Partial<MockHttpRequest>);
  
  return {
    request: req,
    response,
    getRequest: () => req,
    getResponse: () => response,
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => response
    })
  };
}

/**
 * Creates a mock HTTP context for a specific error scenario
 * 
 * @param scenario - Name of the error scenario
 * @param journeyType - Optional journey context
 * @param requestOverrides - Additional request properties to override
 * @returns Mock HTTP context for the specified scenario
 */
export function createErrorScenarioContext(
  scenario: keyof typeof EXPECTED_ERROR_RESPONSES,
  journeyType?: JourneyType,
  requestOverrides: Partial<MockHttpRequest> = {}
) {
  let request: MockHttpRequest;
  
  switch (scenario) {
    case 'UNAUTHORIZED_ERROR':
      request = createUnauthenticatedRequest(journeyType, requestOverrides);
      break;
    case 'FORBIDDEN_ERROR':
      request = createAuthenticatedRequest('user-123', ['user'], journeyType, requestOverrides);
      break;
    case 'SESSION_EXPIRED_ERROR':
      request = createExpiredSessionRequest('user-123', journeyType, requestOverrides);
      break;
    case 'INVALID_TOKEN_ERROR':
      request = createInvalidAuthRequest(journeyType, requestOverrides);
      break;
    case 'VALIDATION_ERROR':
      request = createInvalidInputRequest({ invalidField: 'invalid-value' }, journeyType, requestOverrides);
      break;
    case 'NOT_FOUND_ERROR':
      request = createMockRequest({
        method: 'GET',
        url: '/api/non-existent-resource',
        ...(journeyType ? { headers: { 'x-journey-id': journeyType } } : {}),
        ...requestOverrides
      });
      break;
    case 'RATE_LIMIT_ERROR':
      request = createMockRequest({
        headers: {
          'x-ratelimit-remaining': '0',
          ...(journeyType ? { 'x-journey-id': journeyType } : {}),
          ...(requestOverrides.headers || {})
        },
        ...requestOverrides
      });
      break;
    case 'CONFLICT_ERROR':
      request = createMockRequest({
        method: 'POST',
        url: '/api/resource-with-conflict',
        ...(journeyType ? { headers: { 'x-journey-id': journeyType } } : {}),
        ...requestOverrides
      });
      break;
    case 'EXTERNAL_ERROR':
      request = createMockRequest({
        method: 'GET',
        url: '/api/external-service-resource',
        ...(journeyType ? { headers: { 'x-journey-id': journeyType } } : {}),
        ...requestOverrides
      });
      break;
    case 'INTERNAL_ERROR':
    default:
      request = createMockRequest({
        ...(journeyType ? { headers: { 'x-journey-id': journeyType } } : {}),
        ...requestOverrides
      });
      break;
  }
  
  return createMockHttpContext(request);
}