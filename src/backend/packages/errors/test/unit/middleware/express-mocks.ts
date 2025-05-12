/**
 * Express Middleware Test Mocks
 * 
 * This file provides standardized mock implementations of Express Request, Response, and NextFunction
 * objects for use in middleware unit tests. It creates mocks with chainable methods, spy functions for
 * tracking calls, and helper methods for simulating various request and response scenarios.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Creates a mock Express Request object with customizable properties
 * 
 * @param requestProps - Optional properties to add to the request object
 * @returns A partial mock of the Express Request object
 */
export function createMockRequest(requestProps: Partial<Request> = {}): Partial<Request> {
  // Create a base request object with common properties
  const req: Partial<Request> = {
    headers: {},
    query: {},
    params: {},
    body: {},
    session: {},
    cookies: {},
    ...requestProps
  };

  return req;
}

/**
 * Type for tracking response method calls
 */
export interface ResponseSpies {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
  end: jest.Mock;
  setHeader: jest.Mock;
  redirect: jest.Mock;
  render: jest.Mock;
  cookie: jest.Mock;
  clearCookie: jest.Mock;
}

/**
 * Creates a mock Express Response object with chainable methods and spy functions
 * 
 * @param responseProps - Optional properties to add to the response object
 * @returns A tuple containing the mock Response object and spies for tracking method calls
 */
export function createMockResponse(responseProps: Partial<Response> = {}): [Partial<Response>, ResponseSpies] {
  // Create spy functions for tracking method calls
  const spies: ResponseSpies = {
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
    end: jest.fn(),
    setHeader: jest.fn(),
    redirect: jest.fn(),
    render: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn()
  };

  // Create a base response object with chainable methods
  const res: Partial<Response> = {
    statusCode: 200,
    locals: {},
    ...responseProps,
    
    // Chainable methods that return the response object
    status(code: number) {
      spies.status(code);
      (this as Partial<Response>).statusCode = code;
      return this;
    },
    
    json(body: any) {
      spies.json(body);
      return this;
    },
    
    send(body: any) {
      spies.send(body);
      return this;
    },
    
    end() {
      spies.end();
      return this;
    },
    
    setHeader(name: string, value: string) {
      spies.setHeader(name, value);
      return this;
    },
    
    redirect(url: string) {
      spies.redirect(url);
      return this;
    },
    
    render(view: string, options?: object) {
      spies.render(view, options);
      return this;
    },
    
    cookie(name: string, value: string, options?: any) {
      spies.cookie(name, value, options);
      return this;
    },
    
    clearCookie(name: string, options?: any) {
      spies.clearCookie(name, options);
      return this;
    }
  };

  return [res, spies];
}

/**
 * Creates a mock Express NextFunction
 * 
 * @returns A jest mock function that can be used as the next function in middleware
 */
export function createMockNext(): jest.Mock<NextFunction> {
  return jest.fn();
}

/**
 * Creates a complete set of Express middleware mocks (request, response, next)
 * 
 * @param requestProps - Optional properties to add to the request object
 * @param responseProps - Optional properties to add to the response object
 * @returns An object containing all three middleware parameters and response spies
 */
export function createMiddlewareMocks(requestProps: Partial<Request> = {}, responseProps: Partial<Response> = {}) {
  const req = createMockRequest(requestProps);
  const [res, resSpies] = createMockResponse(responseProps);
  const next = createMockNext();

  return { req, res, next, resSpies };
}

/**
 * Helper function to create a mock request with authentication data
 * 
 * @param userId - The user ID to include in the authentication data
 * @param roles - Optional array of user roles
 * @param additionalProps - Additional request properties
 * @returns A mock request with authentication data
 */
export function createAuthenticatedRequest(
  userId: string,
  roles: string[] = [],
  additionalProps: Partial<Request> = {}
): Partial<Request> {
  return createMockRequest({
    user: { id: userId, roles },
    headers: { 'authorization': `Bearer mock-token-for-${userId}` },
    ...additionalProps
  });
}

/**
 * Helper function to create a mock request with journey context
 * 
 * @param journeyId - The journey ID to include in the request
 * @param additionalProps - Additional request properties
 * @returns A mock request with journey context
 */
export function createJourneyRequest(
  journeyId: string,
  additionalProps: Partial<Request> = {}
): Partial<Request> {
  return createMockRequest({
    headers: { 'x-journey-id': journeyId },
    ...additionalProps
  });
}

/**
 * Helper function to create a mock request with error simulation
 * 
 * @param errorType - The type of error to simulate
 * @param additionalProps - Additional request properties
 * @returns A mock request that will trigger an error condition
 */
export function createErrorRequest(
  errorType: 'validation' | 'authentication' | 'authorization' | 'notFound' | 'timeout',
  additionalProps: Partial<Request> = {}
): Partial<Request> {
  const errorProps: Record<string, any> = {
    validation: { body: { _invalidField: 'invalid-value' } },
    authentication: { headers: { 'authorization': 'Bearer invalid-token' } },
    authorization: { user: { id: 'unauthorized-user', roles: [] } },
    notFound: { params: { id: 'non-existent-id' } },
    timeout: { _simulateTimeout: true }
  };

  return createMockRequest({
    ...errorProps[errorType],
    ...additionalProps
  });
}