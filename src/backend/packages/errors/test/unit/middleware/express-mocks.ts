/**
 * Express Middleware Test Mocks
 * 
 * This file provides mock implementations of Express Request, Response, and NextFunction objects
 * for use in middleware unit tests. These mocks include chainable methods, spy functions for
 * tracking calls, and helper methods for simulating various request and response scenarios.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Type for tracking function calls in mocks
 */
export interface SpyFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  calls: Array<{ args: Parameters<T>; result?: ReturnType<T> }>;
  calledWith: (...args: Parameters<T>) => boolean;
  calledTimes: () => number;
}

/**
 * Creates a spy function that tracks calls and arguments
 * @param implementation The actual function implementation
 * @returns A wrapped function that tracks calls
 */
export function createSpy<T extends (...args: any[]) => any>(implementation: T): SpyFunction<T> {
  const calls: Array<{ args: Parameters<T>; result?: ReturnType<T> }> = [];
  
  const spy = ((...args: Parameters<T>): ReturnType<T> => {
    const result = implementation(...args);
    calls.push({ args, result });
    return result;
  }) as SpyFunction<T>;
  
  spy.calls = calls;
  spy.calledWith = (...args: Parameters<T>): boolean => {
    return calls.some(call => {
      if (call.args.length !== args.length) return false;
      return call.args.every((arg, i) => arg === args[i]);
    });
  };
  spy.calledTimes = () => calls.length;
  
  return spy;
}

/**
 * Mock implementation of Express Request
 */
export class MockRequest implements Partial<Request> {
  public method: string;
  public url: string;
  public headers: Record<string, string>;
  public query: Record<string, any>;
  public params: Record<string, string>;
  public body: any;
  public user?: any;
  public ip: string;
  public path: string;
  public protocol: string;
  public secure: boolean;
  public cookies: Record<string, string>;
  public session?: Record<string, any>;
  public originalUrl: string;
  
  constructor(options: Partial<MockRequest> = {}) {
    this.method = options.method || 'GET';
    this.url = options.url || '/';
    this.headers = options.headers || {};
    this.query = options.query || {};
    this.params = options.params || {};
    this.body = options.body || {};
    this.user = options.user;
    this.ip = options.ip || '127.0.0.1';
    this.path = options.path || '/';
    this.protocol = options.protocol || 'http';
    this.secure = options.secure || false;
    this.cookies = options.cookies || {};
    this.session = options.session;
    this.originalUrl = options.originalUrl || this.url;
  }

  /**
   * Gets a header value (case-insensitive)
   */
  public get = createSpy((name: string): string | undefined => {
    const headerName = Object.keys(this.headers)
      .find(key => key.toLowerCase() === name.toLowerCase());
    return headerName ? this.headers[headerName] : undefined;
  });

  /**
   * Checks if the request accepts a specific content type
   */
  public accepts = createSpy((type: string | string[]): string | false => {
    const acceptHeader = this.get('accept');
    if (!acceptHeader) return false;
    
    const types = Array.isArray(type) ? type : [type];
    const acceptTypes = acceptHeader.split(',').map(t => t.trim());
    
    for (const t of types) {
      if (acceptTypes.includes(t) || acceptTypes.includes('*/*')) {
        return t;
      }
    }
    
    return false;
  });

  /**
   * Checks if the request is an XMLHttpRequest (AJAX)
   */
  public get xhr(): boolean {
    return this.get('X-Requested-With') === 'XMLHttpRequest';
  }
}

/**
 * Mock implementation of Express Response
 */
export class MockResponse implements Partial<Response> {
  public statusCode: number;
  public headersSent: boolean;
  public locals: Record<string, any>;
  
  private _headers: Record<string, string>;
  private _body: any;
  private _ended: boolean;
  
  constructor(options: Partial<MockResponse> = {}) {
    this.statusCode = options.statusCode || 200;
    this._headers = {};
    this._body = null;
    this._ended = false;
    this.headersSent = false;
    this.locals = options.locals || {};
  }

  /**
   * Sets the HTTP status code
   */
  public status = createSpy((code: number): this => {
    this.statusCode = code;
    return this;
  });

  /**
   * Sets a response header
   */
  public set = createSpy((field: string, value: string): this => {
    this._headers[field.toLowerCase()] = value;
    return this;
  });

  /**
   * Gets a response header
   */
  public get = createSpy((field: string): string => {
    return this._headers[field.toLowerCase()];
  });

  /**
   * Sends a JSON response
   */
  public json = createSpy((body: any): this => {
    this.set('Content-Type', 'application/json');
    this._body = body;
    this._ended = true;
    this.headersSent = true;
    return this;
  });

  /**
   * Sends a response
   */
  public send = createSpy((body: any): this => {
    this._body = body;
    this._ended = true;
    this.headersSent = true;
    return this;
  });

  /**
   * Ends the response
   */
  public end = createSpy((): this => {
    this._ended = true;
    this.headersSent = true;
    return this;
  });

  /**
   * Redirects to a URL
   */
  public redirect = createSpy((status: number | string, url?: string): this => {
    if (typeof status === 'string') {
      url = status;
      status = 302;
    }
    
    this.statusCode = status as number;
    this.set('Location', url as string);
    this._ended = true;
    this.headersSent = true;
    return this;
  });

  /**
   * Renders a view
   */
  public render = createSpy((view: string, locals?: Record<string, any>): this => {
    this._body = { view, locals };
    this._ended = true;
    this.headersSent = true;
    return this;
  });

  /**
   * Sends a file
   */
  public sendFile = createSpy((path: string): this => {
    this._body = { file: path };
    this._ended = true;
    this.headersSent = true;
    return this;
  });

  /**
   * Gets the response body (for testing)
   */
  public getBody(): any {
    return this._body;
  }

  /**
   * Checks if the response has ended
   */
  public isEnded(): boolean {
    return this._ended;
  }

  /**
   * Gets all headers (for testing)
   */
  public getHeaders(): Record<string, string> {
    return { ...this._headers };
  }
}

/**
 * Mock implementation of Express NextFunction
 */
export type MockNextFunction = SpyFunction<NextFunction>;

/**
 * Creates a mock NextFunction
 */
export function createMockNext(): MockNextFunction {
  return createSpy((err?: any) => {
    // NextFunction implementation is empty in mocks
    // The spy functionality tracks if it was called and with what arguments
  });
}

/**
 * Creates a complete set of Express middleware mocks
 * @param reqOptions Options for the request mock
 * @param resOptions Options for the response mock
 * @returns Object containing request, response and next function mocks
 */
export function createMiddlewareMocks(reqOptions?: Partial<MockRequest>, resOptions?: Partial<MockResponse>) {
  return {
    req: new MockRequest(reqOptions),
    res: new MockResponse(resOptions),
    next: createMockNext()
  };
}

/**
 * Creates a mock request with authentication
 * @param user The user object to include in the request
 * @param options Additional request options
 * @returns A mock request with the user property set
 */
export function createAuthenticatedRequest(user: any, options?: Partial<MockRequest>): MockRequest {
  return new MockRequest({
    ...options,
    user
  });
}

/**
 * Creates a mock request with specific journey context
 * @param journeyId The journey identifier
 * @param options Additional request options
 * @returns A mock request with journey headers set
 */
export function createJourneyRequest(journeyId: string, options?: Partial<MockRequest>): MockRequest {
  return new MockRequest({
    ...options,
    headers: {
      ...options?.headers,
      'x-journey-id': journeyId
    }
  });
}

/**
 * Creates a mock request for testing error scenarios
 * @param errorContext Additional context for the error scenario
 * @returns A set of mocks configured for error testing
 */
export function createErrorScenarioMocks(errorContext?: Record<string, any>) {
  const req = new MockRequest({
    method: 'POST',
    url: '/api/test',
    headers: {
      'content-type': 'application/json',
      ...errorContext?.headers
    },
    body: errorContext?.body || {}
  });
  
  const res = new MockResponse();
  const next = createMockNext();
  
  return { req, res, next };
}