import { ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Mock HTTP request objects for testing error handling in different scenarios.
 * These fixtures provide consistent test data for error middleware, filters, and serialization.
 */

// Base request object with common properties
const baseRequest: Partial<Request> = {
  method: 'GET',
  url: '/api/test',
  headers: {
    'content-type': 'application/json',
    'accept': 'application/json',
    'user-agent': 'Jest Test Runner',
  },
  ip: '127.0.0.1',
  query: {},
  params: {},
  body: {},
};

/**
 * Anonymous request with no authentication
 */
export const anonymousRequest: Partial<Request> = {
  ...baseRequest,
  user: undefined,
  headers: {
    ...baseRequest.headers,
  },
};

/**
 * Authenticated request with user information
 */
export const authenticatedRequest: Partial<Request> = {
  ...baseRequest,
  user: {
    id: 'user-123',
    email: 'test@example.com',
    roles: ['user'],
    permissions: ['read:profile', 'update:profile'],
  },
  headers: {
    ...baseRequest.headers,
    'authorization': 'Bearer mock-jwt-token',
  },
};

/**
 * Admin user request with elevated permissions
 */
export const adminRequest: Partial<Request> = {
  ...baseRequest,
  user: {
    id: 'admin-456',
    email: 'admin@example.com',
    roles: ['admin', 'user'],
    permissions: ['read:all', 'write:all', 'admin:all'],
  },
  headers: {
    ...baseRequest.headers,
    'authorization': 'Bearer mock-admin-jwt-token',
  },
};

/**
 * Request with expired authentication
 */
export const expiredSessionRequest: Partial<Request> = {
  ...baseRequest,
  user: undefined, // No user object since session is expired
  headers: {
    ...baseRequest.headers,
    'authorization': 'Bearer expired-jwt-token',
  },
};

/**
 * Request with invalid input data
 */
export const invalidInputRequest: Partial<Request> = {
  ...baseRequest,
  method: 'POST',
  url: '/api/users',
  body: {
    // Missing required fields, has invalid data
    email: 'not-an-email',
    age: 'should-be-number',
  },
  user: {
    id: 'user-123',
    email: 'test@example.com',
    roles: ['user'],
  },
  headers: {
    ...baseRequest.headers,
    'authorization': 'Bearer mock-jwt-token',
    'content-type': 'application/json',
  },
};

/**
 * Health journey request context
 */
export const healthJourneyRequest: Partial<Request> = {
  ...authenticatedRequest,
  url: '/api/health/metrics',
  headers: {
    ...authenticatedRequest.headers,
    'x-journey-id': 'health',
    'x-correlation-id': 'corr-789-health',
  },
};

/**
 * Care journey request context
 */
export const careJourneyRequest: Partial<Request> = {
  ...authenticatedRequest,
  url: '/api/care/appointments',
  headers: {
    ...authenticatedRequest.headers,
    'x-journey-id': 'care',
    'x-correlation-id': 'corr-789-care',
  },
};

/**
 * Plan journey request context
 */
export const planJourneyRequest: Partial<Request> = {
  ...authenticatedRequest,
  url: '/api/plan/benefits',
  headers: {
    ...authenticatedRequest.headers,
    'x-journey-id': 'plan',
    'x-correlation-id': 'corr-789-plan',
  },
};

/**
 * Request with a specific device and platform information
 */
export const mobileAppRequest: Partial<Request> = {
  ...authenticatedRequest,
  headers: {
    ...authenticatedRequest.headers,
    'user-agent': 'AUSTA-Mobile-App/1.0.0 (iPhone; iOS 15.0)',
    'x-device-id': 'device-abc-123',
    'x-app-version': '1.0.0',
    'x-platform': 'ios',
  },
};

/**
 * Request with a specific device and platform information for web
 */
export const webAppRequest: Partial<Request> = {
  ...authenticatedRequest,
  headers: {
    ...authenticatedRequest.headers,
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'x-app-version': '1.2.0',
    'x-platform': 'web',
  },
};

/**
 * Mock HTTP response object for capturing error responses
 */
export class MockResponse implements Partial<Response> {
  public statusCode: number = 200;
  public headers: Record<string, string> = {};
  public body: any = null;

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  json(data: any): this {
    this.body = data;
    return this;
  }

  send(data: any): this {
    this.body = data;
    return this;
  }

  setHeader(name: string, value: string): this {
    this.headers[name] = value;
    return this;
  }

  getHeader(name: string): string | undefined {
    return this.headers[name];
  }
}

/**
 * Creates a mock NestJS ArgumentsHost for HTTP context
 */
export function createMockArgumentsHost(request: Partial<Request>, response: Partial<Response>): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
    getType: () => 'http',
    getArgs: () => [request, response],
    switchToRpc: () => ({
      getContext: () => ({}),
      getData: () => ({}),
    }),
    switchToWs: () => ({
      getClient: () => ({}),
      getData: () => ({}),
    }),
  } as ArgumentsHost;
}

/**
 * Creates a mock Express request object with custom properties
 */
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    ...baseRequest,
    ...overrides,
    headers: {
      ...baseRequest.headers,
      ...(overrides.headers || {}),
    },
  };
}

/**
 * Creates a mock Express response object
 */
export function createMockResponse(): MockResponse {
  return new MockResponse();
}

/**
 * Expected error response formats for different error types
 */
export const expectedErrorResponses = {
  validation: {
    error: {
      type: 'VALIDATION',
      code: 'INVALID_INPUT',
      message: 'The provided data is invalid',
      details: {
        fields: {
          email: 'Must be a valid email address',
          age: 'Must be a number',
        },
      },
    },
  },
  business: {
    error: {
      type: 'BUSINESS',
      code: 'RESOURCE_NOT_FOUND',
      message: 'The requested resource was not found',
      details: {
        resourceType: 'User',
        resourceId: '123',
      },
    },
  },
  technical: {
    error: {
      type: 'TECHNICAL',
      code: 'DATABASE_ERROR',
      message: 'An unexpected error occurred while processing your request',
    },
  },
  external: {
    error: {
      type: 'EXTERNAL',
      code: 'EXTERNAL_API_ERROR',
      message: 'An error occurred while communicating with an external service',
      details: {
        service: 'PaymentGateway',
        status: 503,
      },
    },
  },
  authentication: {
    error: {
      type: 'VALIDATION',
      code: 'AUTHENTICATION_FAILED',
      message: 'Authentication failed',
    },
  },
  authorization: {
    error: {
      type: 'VALIDATION',
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'You do not have permission to access this resource',
    },
  },
  sessionExpired: {
    error: {
      type: 'VALIDATION',
      code: 'SESSION_EXPIRED',
      message: 'Your session has expired, please log in again',
    },
  },
};

/**
 * Expected HTTP status codes for different error types
 */
export const expectedStatusCodes = {
  validation: 400,
  business: 422,
  technical: 500,
  external: 502,
  authentication: 401,
  authorization: 403,
  sessionExpired: 401,
  notFound: 404,
  conflict: 409,
  tooManyRequests: 429,
};

/**
 * Complete HTTP context scenarios for testing
 */
export const httpTestScenarios = {
  validationError: {
    request: invalidInputRequest,
    response: createMockResponse(),
    expectedStatus: expectedStatusCodes.validation,
    expectedBody: expectedErrorResponses.validation,
  },
  authenticationError: {
    request: anonymousRequest,
    response: createMockResponse(),
    expectedStatus: expectedStatusCodes.authentication,
    expectedBody: expectedErrorResponses.authentication,
  },
  sessionExpiredError: {
    request: expiredSessionRequest,
    response: createMockResponse(),
    expectedStatus: expectedStatusCodes.sessionExpired,
    expectedBody: expectedErrorResponses.sessionExpired,
  },
  businessError: {
    request: authenticatedRequest,
    response: createMockResponse(),
    expectedStatus: expectedStatusCodes.business,
    expectedBody: expectedErrorResponses.business,
  },
  technicalError: {
    request: authenticatedRequest,
    response: createMockResponse(),
    expectedStatus: expectedStatusCodes.technical,
    expectedBody: expectedErrorResponses.technical,
  },
  externalError: {
    request: authenticatedRequest,
    response: createMockResponse(),
    expectedStatus: expectedStatusCodes.external,
    expectedBody: expectedErrorResponses.external,
  },
  healthJourneyError: {
    request: healthJourneyRequest,
    response: createMockResponse(),
    expectedStatus: expectedStatusCodes.business,
    expectedBody: {
      error: {
        type: 'BUSINESS',
        code: 'HEALTH_METRIC_INVALID',
        message: 'The health metric data is invalid',
        details: {
          journey: 'health',
          metricType: 'bloodPressure',
        },
      },
    },
  },
  careJourneyError: {
    request: careJourneyRequest,
    response: createMockResponse(),
    expectedStatus: expectedStatusCodes.business,
    expectedBody: {
      error: {
        type: 'BUSINESS',
        code: 'APPOINTMENT_UNAVAILABLE',
        message: 'The requested appointment slot is not available',
        details: {
          journey: 'care',
          providerId: 'provider-123',
          requestedTime: '2023-05-15T14:00:00Z',
        },
      },
    },
  },
  planJourneyError: {
    request: planJourneyRequest,
    response: createMockResponse(),
    expectedStatus: expectedStatusCodes.business,
    expectedBody: {
      error: {
        type: 'BUSINESS',
        code: 'BENEFIT_NOT_COVERED',
        message: 'The requested benefit is not covered by your plan',
        details: {
          journey: 'plan',
          benefitCode: 'DENTAL_ORTHO',
          planId: 'plan-456',
        },
      },
    },
  },
  mobileAppError: {
    request: mobileAppRequest,
    response: createMockResponse(),
    expectedStatus: expectedStatusCodes.technical,
    expectedBody: {
      error: {
        type: 'TECHNICAL',
        code: 'APP_VERSION_UNSUPPORTED',
        message: 'This app version is no longer supported. Please update to the latest version.',
        details: {
          currentVersion: '1.0.0',
          minimumVersion: '1.1.0',
          platform: 'ios',
        },
      },
    },
  },
};