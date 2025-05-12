import { ArgumentsHost } from '@nestjs/common';
import { ErrorType } from '../../../src/categories/error-types';

/**
 * Mock HTTP request object with various authentication and context scenarios
 * for testing error handling middleware and filters.
 */
export interface MockHttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  user?: {
    id: string;
    email?: string;
    roles?: string[];
  };
  session?: {
    id: string;
    expires?: Date;
  };
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

/**
 * Mock HTTP response object for capturing serialized errors
 * and testing response formatting.
 */
export interface MockHttpResponse {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
  status: (code: number) => MockHttpResponse;
  json: (data: any) => MockHttpResponse;
  send: (data: any) => MockHttpResponse;
  setHeader: (name: string, value: string) => MockHttpResponse;
}

/**
 * Creates a mock HTTP request object with default values.
 * 
 * @param overrides - Optional properties to override default values
 * @returns A mock HTTP request object for testing
 */
export function createMockRequest(overrides: Partial<MockHttpRequest> = {}): MockHttpRequest {
  return {
    method: 'GET',
    url: '/api/test',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
      ...overrides.headers,
    },
    ...overrides,
  };
}

/**
 * Creates a mock HTTP response object that captures status code and response body.
 * 
 * @returns A mock HTTP response object for testing
 */
export function createMockResponse(): MockHttpResponse {
  const response: MockHttpResponse = {
    statusCode: 200,
    body: null,
    headers: {},
    status: function(code: number) {
      this.statusCode = code;
      return this;
    },
    json: function(data: any) {
      this.body = data;
      return this;
    },
    send: function(data: any) {
      this.body = data;
      return this;
    },
    setHeader: function(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
  };
  
  return response;
}

/**
 * Creates a mock ArgumentsHost for NestJS exception filters.
 * 
 * @param request - Mock HTTP request object
 * @param response - Mock HTTP response object
 * @returns A mock ArgumentsHost instance
 */
export function createMockArgumentsHost(request: MockHttpRequest, response: MockHttpResponse): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
    getArgByIndex: () => ({}),
    getArgs: () => [],
    getType: () => 'http',
  } as ArgumentsHost;
}

/**
 * Predefined HTTP request scenarios for testing error handling in different contexts.
 */
export const httpRequestScenarios = {
  /**
   * Authenticated user with standard permissions
   */
  authenticatedUser: createMockRequest({
    method: 'GET',
    url: '/api/health/metrics',
    headers: {
      'authorization': 'Bearer mock-token',
      'x-journey-id': 'health',
    },
    user: {
      id: 'user-123',
      email: 'user@example.com',
      roles: ['user'],
    },
  }),

  /**
   * Authenticated user with admin permissions
   */
  adminUser: createMockRequest({
    method: 'GET',
    url: '/api/admin/users',
    headers: {
      'authorization': 'Bearer mock-admin-token',
      'x-journey-id': 'admin',
    },
    user: {
      id: 'admin-456',
      email: 'admin@example.com',
      roles: ['admin', 'user'],
    },
  }),

  /**
   * Unauthenticated request (no user object)
   */
  unauthenticatedRequest: createMockRequest({
    method: 'GET',
    url: '/api/public/info',
    headers: {},
  }),

  /**
   * Request with expired session
   */
  expiredSession: createMockRequest({
    method: 'GET',
    url: '/api/health/metrics',
    headers: {
      'authorization': 'Bearer expired-token',
      'x-journey-id': 'health',
    },
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
    session: {
      id: 'session-789',
      expires: new Date(Date.now() - 3600000), // 1 hour in the past
    },
  }),

  /**
   * Request with invalid input data
   */
  invalidInputRequest: createMockRequest({
    method: 'POST',
    url: '/api/health/metrics',
    headers: {
      'authorization': 'Bearer mock-token',
      'content-type': 'application/json',
      'x-journey-id': 'health',
    },
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
    body: {
      // Invalid data - missing required fields
      timestamp: '2023-04-15T10:30:00Z',
      // value is missing
      // type is missing
    },
  }),

  /**
   * Request with business rule violation
   */
  businessRuleViolation: createMockRequest({
    method: 'POST',
    url: '/api/care/appointments',
    headers: {
      'authorization': 'Bearer mock-token',
      'content-type': 'application/json',
      'x-journey-id': 'care',
    },
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
    body: {
      // Valid data but violates business rule (appointment in the past)
      providerId: 'provider-456',
      date: '2023-01-15', // Date in the past
      time: '10:30',
      reason: 'Annual checkup',
    },
  }),

  /**
   * Request that would trigger an external system error
   */
  externalSystemRequest: createMockRequest({
    method: 'GET',
    url: '/api/health/devices/sync',
    headers: {
      'authorization': 'Bearer mock-token',
      'x-journey-id': 'health',
      'x-device-id': 'fitbit-123',
    },
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
  }),

  /**
   * Request that would trigger a technical/system error
   */
  technicalErrorRequest: createMockRequest({
    method: 'GET',
    url: '/api/plan/benefits/calculate',
    headers: {
      'authorization': 'Bearer mock-token',
      'x-journey-id': 'plan',
    },
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
    query: {
      planId: 'plan-789',
      year: '2023',
    },
  }),

  /**
   * Request with journey context for health journey
   */
  healthJourneyRequest: createMockRequest({
    method: 'GET',
    url: '/api/health/goals',
    headers: {
      'authorization': 'Bearer mock-token',
      'x-journey-id': 'health',
    },
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
  }),

  /**
   * Request with journey context for care journey
   */
  careJourneyRequest: createMockRequest({
    method: 'GET',
    url: '/api/care/providers',
    headers: {
      'authorization': 'Bearer mock-token',
      'x-journey-id': 'care',
    },
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
  }),

  /**
   * Request with journey context for plan journey
   */
  planJourneyRequest: createMockRequest({
    method: 'GET',
    url: '/api/plan/coverage',
    headers: {
      'authorization': 'Bearer mock-token',
      'x-journey-id': 'plan',
    },
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
  }),
};

/**
 * Expected error response templates for different error types.
 * These can be used to validate error responses in tests.
 */
export const expectedErrorResponses = {
  validation: {
    error: {
      type: ErrorType.VALIDATION,
      code: 'VALIDATION_ERROR',
      message: 'The provided data is invalid',
      details: {
        fields: {
          // Example validation errors
          value: ['Value is required'],
          type: ['Type is required'],
        },
      },
    },
  },

  business: {
    error: {
      type: ErrorType.BUSINESS,
      code: 'APPOINTMENT_DATE_PAST',
      message: 'Cannot schedule an appointment in the past',
      details: {
        providedDate: '2023-01-15',
        currentDate: expect.any(String),
      },
    },
  },

  technical: {
    error: {
      type: ErrorType.TECHNICAL,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      // Details may be included in non-production environments
    },
  },

  external: {
    error: {
      type: ErrorType.EXTERNAL,
      code: 'EXTERNAL_API_ERROR',
      message: 'Failed to communicate with external service',
      details: {
        service: 'FitbitAPI',
        status: 503,
      },
    },
  },

  unauthorized: {
    error: {
      type: ErrorType.VALIDATION,
      code: 'UNAUTHORIZED',
      message: 'Authentication required to access this resource',
    },
  },

  forbidden: {
    error: {
      type: ErrorType.VALIDATION,
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource',
    },
  },

  sessionExpired: {
    error: {
      type: ErrorType.VALIDATION,
      code: 'SESSION_EXPIRED',
      message: 'Your session has expired, please log in again',
    },
  },

  notFound: {
    error: {
      type: ErrorType.VALIDATION,
      code: 'RESOURCE_NOT_FOUND',
      message: 'The requested resource was not found',
    },
  },
};

/**
 * Creates a complete HTTP context for testing error handling.
 * 
 * @param scenario - Predefined request scenario or custom request object
 * @returns Object containing request, response, and ArgumentsHost objects
 */
export function createHttpTestContext(scenario: MockHttpRequest | keyof typeof httpRequestScenarios) {
  const request = typeof scenario === 'string' 
    ? httpRequestScenarios[scenario] 
    : scenario;
  const response = createMockResponse();
  const host = createMockArgumentsHost(request, response);

  return {
    request,
    response,
    host,
  };
}