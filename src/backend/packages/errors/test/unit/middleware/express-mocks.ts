/**
 * Express Middleware Test Mocks
 * 
 * This file provides mock implementations of Express Request, Response, and NextFunction objects
 * for use in middleware unit tests. These mocks include chainable methods, spy functions for tracking
 * calls, and helper methods for simulating various request and response scenarios.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Creates a mock Express Request object with configurable properties
 * @param overrides - Optional properties to override default values
 * @returns A mock Express Request object
 */
export function createMockRequest(overrides: Partial<Request> = {}): Request {
  const req: Partial<Request> = {
    method: 'GET',
    url: '/test',
    path: '/test',
    params: {},
    query: {},
    body: {},
    headers: {},
    cookies: {},
    ip: '127.0.0.1',
    // Add tracking for all properties that might be accessed
    get: jest.fn((name: string) => {
      const headerName = name.toLowerCase();
      const headers = (req.headers || {}) as Record<string, string>;
      return headers[headerName];
    }),
    ...overrides
  };

  return req as Request;
}

/**
 * Type for tracking response method calls
 */
export interface ResponseTracking {
  statusCode: number;
  statusMessage: string;
  body: any;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  ended: boolean;
  locals: Record<string, any>;
}

/**
 * Creates a mock Express Response object with chainable methods and tracking
 * @returns A mock Express Response object and tracking data
 */
export function createMockResponse(): { res: Response; tracking: ResponseTracking } {
  const tracking: ResponseTracking = {
    statusCode: 200,
    statusMessage: 'OK',
    body: null,
    headers: {},
    cookies: {},
    ended: false,
    locals: {}
  };

  const res: Partial<Response> = {
    statusCode: 200,
    headersSent: false,
    locals: {},
    
    // Chainable methods
    status: jest.fn(function(code: number) {
      tracking.statusCode = code;
      return this;
    }),
    
    sendStatus: jest.fn(function(code: number) {
      tracking.statusCode = code;
      tracking.ended = true;
      return this;
    }),
    
    json: jest.fn(function(body: any) {
      tracking.body = body;
      tracking.ended = true;
      return this;
    }),
    
    send: jest.fn(function(body: any) {
      tracking.body = body;
      tracking.ended = true;
      return this;
    }),
    
    end: jest.fn(function() {
      tracking.ended = true;
      return this;
    }),
    
    set: jest.fn(function(field: string | Record<string, string>, value?: string) {
      if (typeof field === 'string' && value !== undefined) {
        tracking.headers[field.toLowerCase()] = value;
      } else if (typeof field === 'object') {
        Object.entries(field).forEach(([key, val]) => {
          tracking.headers[key.toLowerCase()] = val;
        });
      }
      return this;
    }),
    
    get: jest.fn(function(field: string) {
      return tracking.headers[field.toLowerCase()];
    }),
    
    cookie: jest.fn(function(name: string, value: string, options?: any) {
      tracking.cookies[name] = value;
      return this;
    }),
    
    clearCookie: jest.fn(function(name: string) {
      delete tracking.cookies[name];
      return this;
    }),
    
    redirect: jest.fn(function(url: string): any;
    redirect: jest.fn(function(status: number, url: string): any;
    redirect: jest.fn(function(statusOrUrl: number | string, url?: string) {
      if (typeof statusOrUrl === 'string') {
        tracking.statusCode = 302;
        tracking.headers.location = statusOrUrl;
      } else {
        tracking.statusCode = statusOrUrl;
        if (url) tracking.headers.location = url;
      }
      tracking.ended = true;
      return this;
    }),
    
    render: jest.fn(function(view: string, locals?: any, callback?: (err: Error, html: string) => void) {
      tracking.body = { view, locals };
      tracking.ended = true;
      return this;
    }),
    
    format: jest.fn(function(obj: Record<string, () => void>) {
      // Default to json if available
      if (obj.json) {
        obj.json();
      } else if (obj.default) {
        obj.default();
      }
      return this;
    }),
    
    // Add getters that return tracking values
    get statusCode() {
      return tracking.statusCode;
    },
    
    set statusCode(code: number) {
      tracking.statusCode = code;
    },
    
    get headersSent() {
      return tracking.ended;
    }
  };

  return { res: res as Response, tracking };
}

/**
 * Creates a mock Express NextFunction
 * @returns A jest mock function that can be used as Express NextFunction
 */
export function createMockNext(): jest.MockedFunction<NextFunction> {
  return jest.fn();
}

/**
 * Helper to create a complete set of Express middleware mocks
 * @param requestOverrides - Optional properties to override in the request
 * @returns Object containing mock request, response, tracking, and next function
 */
export function createMiddlewareMocks(requestOverrides: Partial<Request> = {}) {
  const req = createMockRequest(requestOverrides);
  const { res, tracking } = createMockResponse();
  const next = createMockNext();
  
  return { req, res, tracking, next };
}

/**
 * Helper to create a mock request with authentication information
 * @param userId - User ID to include in the request
 * @param roles - Optional array of user roles
 * @param additionalOverrides - Additional request overrides
 * @returns A mock authenticated request
 */
export function createAuthenticatedRequest(
  userId: string,
  roles: string[] = [],
  additionalOverrides: Partial<Request> = {}
): Request {
  return createMockRequest({
    user: {
      id: userId,
      roles,
    },
    headers: {
      authorization: `Bearer mock-token-for-${userId}`,
    },
    ...additionalOverrides,
  });
}

/**
 * Helper to create a mock request with journey context
 * @param journeyId - Journey identifier (health, care, plan)
 * @param additionalOverrides - Additional request overrides
 * @returns A mock request with journey context
 */
export function createJourneyRequest(
  journeyId: 'health' | 'care' | 'plan',
  additionalOverrides: Partial<Request> = {}
): Request {
  return createMockRequest({
    headers: {
      'x-journey-id': journeyId,
    },
    ...additionalOverrides,
  });
}

/**
 * Helper to create a mock request with error simulation
 * @param errorType - Type of error to simulate
 * @param additionalOverrides - Additional request overrides
 * @returns A mock request configured to trigger specific error scenarios
 */
export function createErrorTriggeringRequest(
  errorType: 'validation' | 'business' | 'technical' | 'external',
  additionalOverrides: Partial<Request> = {}
): Request {
  return createMockRequest({
    headers: {
      'x-trigger-error': errorType,
    },
    ...additionalOverrides,
  });
}

/**
 * Helper to assert that a response contains an error with the expected structure
 * @param tracking - Response tracking object
 * @param expectedStatus - Expected HTTP status code
 * @param expectedErrorType - Expected error type
 * @param expectedErrorCode - Expected error code
 */
export function assertErrorResponse(
  tracking: ResponseTracking,
  expectedStatus: number,
  expectedErrorType: string,
  expectedErrorCode?: string
): void {
  expect(tracking.statusCode).toBe(expectedStatus);
  expect(tracking.body).toHaveProperty('error');
  expect(tracking.body.error).toHaveProperty('type', expectedErrorType);
  
  if (expectedErrorCode) {
    expect(tracking.body.error).toHaveProperty('code', expectedErrorCode);
  }
}