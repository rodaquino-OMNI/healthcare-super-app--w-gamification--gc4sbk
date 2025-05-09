/**
 * Mock implementations of NestJS components used for error handling tests.
 * 
 * This file provides mock implementations of ArgumentsHost, ExecutionContext,
 * HttpArgumentsHost, and other NestJS interfaces necessary for testing exception
 * filters and interceptors in isolation from the NestJS framework.
 */

import { ArgumentsHost, ExecutionContext, HttpArgumentsHost, Type } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';

/**
 * Interface for a mock HTTP response object used in tests
 */
export interface MockResponse {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
  status: (code: number) => MockResponse;
  json: (data: any) => MockResponse;
  send: (data: any) => MockResponse;
  getHeader: (name: string) => string | undefined;
  setHeader: (name: string, value: string) => MockResponse;
}

/**
 * Interface for a mock HTTP request object used in tests
 */
export interface MockRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  query: Record<string, any>;
  params: Record<string, any>;
  body: any;
  user?: any;
  journeyContext?: {
    journeyId: string;
    journeyType: 'HEALTH' | 'CARE' | 'PLAN';
    [key: string]: any;
  };
}

/**
 * Creates a mock HTTP response object for testing
 */
export function createMockResponse(): MockResponse {
  const mockResponse: MockResponse = {
    statusCode: HttpStatus.OK,
    body: undefined,
    headers: {},
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
    getHeader(name: string) {
      return this.headers[name.toLowerCase()];
    },
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
      return this;
    }
  };
  return mockResponse;
}

/**
 * Creates a mock HTTP request object for testing
 */
export function createMockRequest(options: Partial<MockRequest> = {}): MockRequest {
  return {
    method: 'GET',
    url: '/',
    headers: {},
    query: {},
    params: {},
    body: {},
    ...options
  };
}

/**
 * Mock implementation of HttpArgumentsHost
 */
export class MockHttpArgumentsHost implements HttpArgumentsHost {
  constructor(
    private readonly req: MockRequest,
    private readonly res: MockResponse,
    private readonly next?: Function
  ) {}

  getRequest<T = any>(): T {
    return this.req as unknown as T;
  }

  getResponse<T = any>(): T {
    return this.res as unknown as T;
  }

  getNext<T = any>(): T {
    return (this.next || (() => {})) as unknown as T;
  }
}

/**
 * Mock implementation of ArgumentsHost
 */
export class MockArgumentsHost implements ArgumentsHost {
  constructor(
    private readonly args: any[],
    private readonly httpHost?: MockHttpArgumentsHost
  ) {}

  getArgs<T extends any[] = any[]>(): T {
    return this.args as unknown as T;
  }

  getArgByIndex<T = any>(index: number): T {
    return this.args[index] as T;
  }

  switchToRpc(): any {
    throw new Error('Method not implemented in mock: switchToRpc');
  }

  switchToWs(): any {
    throw new Error('Method not implemented in mock: switchToWs');
  }

  switchToHttp(): HttpArgumentsHost {
    if (!this.httpHost) {
      throw new Error('HTTP host not configured for this ArgumentsHost mock');
    }
    return this.httpHost;
  }

  getType<T extends string = any>(): T {
    return 'http' as T;
  }
}

/**
 * Mock implementation of ExecutionContext
 */
export class MockExecutionContext extends MockArgumentsHost implements ExecutionContext {
  constructor(
    args: any[],
    httpHost?: MockHttpArgumentsHost,
    private readonly handler?: Function,
    private readonly classRef?: Type<any>
  ) {
    super(args, httpHost);
  }

  getClass<T = any>(): Type<T> {
    return (this.classRef || Object) as Type<T>;
  }

  getHandler(): Function {
    return this.handler || (() => {});
  }
}

/**
 * Creates a mock ArgumentsHost for HTTP context
 */
export function createHttpArgumentsHost(
  request: Partial<MockRequest> = {},
  response: MockResponse = createMockResponse(),
  next: Function = () => {}
): ArgumentsHost {
  const mockRequest = createMockRequest(request);
  const httpHost = new MockHttpArgumentsHost(mockRequest, response, next);
  return new MockArgumentsHost([mockRequest, response, next], httpHost);
}

/**
 * Creates a mock ExecutionContext for HTTP context
 */
export function createHttpExecutionContext(
  request: Partial<MockRequest> = {},
  response: MockResponse = createMockResponse(),
  handler: Function = () => {},
  classRef: Type<any> = Object,
  next: Function = () => {}
): ExecutionContext {
  const mockRequest = createMockRequest(request);
  const httpHost = new MockHttpArgumentsHost(mockRequest, response, next);
  return new MockExecutionContext([mockRequest, response, next], httpHost, handler, classRef);
}

/**
 * Creates a mock ArgumentsHost for a specific journey context
 */
export function createJourneyArgumentsHost(
  journeyType: 'HEALTH' | 'CARE' | 'PLAN',
  journeyId: string = 'test-journey-id',
  request: Partial<MockRequest> = {},
  response: MockResponse = createMockResponse()
): ArgumentsHost {
  // Add journey-specific context to the request
  const journeyRequest = {
    ...request,
    headers: {
      ...request.headers,
      'x-journey-id': journeyId,
      'x-journey-type': journeyType
    },
    journeyContext: {
      journeyId,
      journeyType,
      ...(request.journeyContext || {})
    }
  };
  
  return createHttpArgumentsHost(journeyRequest, response);
}

/**
 * Creates a mock ExecutionContext for a specific journey context
 */
export function createJourneyExecutionContext(
  journeyType: 'HEALTH' | 'CARE' | 'PLAN',
  journeyId: string = 'test-journey-id',
  request: Partial<MockRequest> = {},
  response: MockResponse = createMockResponse(),
  handler: Function = () => {},
  classRef: Type<any> = Object
): ExecutionContext {
  // Add journey-specific context to the request
  const journeyRequest = {
    ...request,
    headers: {
      ...request.headers,
      'x-journey-id': journeyId,
      'x-journey-type': journeyType
    },
    journeyContext: {
      journeyId,
      journeyType,
      ...(request.journeyContext || {})
    }
  };
  
  return createHttpExecutionContext(journeyRequest, response, handler, classRef);
}

/**
 * Creates a mock ArgumentsHost for an authenticated user context
 */
export function createAuthenticatedArgumentsHost(
  userId: string = 'test-user-id',
  roles: string[] = ['user'],
  request: Partial<MockRequest> = {},
  response: MockResponse = createMockResponse()
): ArgumentsHost {
  // Add authentication context to the request
  const authRequest = {
    ...request,
    user: {
      id: userId,
      roles,
      ...(request.user || {})
    }
  };
  
  return createHttpArgumentsHost(authRequest, response);
}

/**
 * Creates a mock ExecutionContext for an authenticated user context
 */
export function createAuthenticatedExecutionContext(
  userId: string = 'test-user-id',
  roles: string[] = ['user'],
  request: Partial<MockRequest> = {},
  response: MockResponse = createMockResponse(),
  handler: Function = () => {},
  classRef: Type<any> = Object
): ExecutionContext {
  // Add authentication context to the request
  const authRequest = {
    ...request,
    user: {
      id: userId,
      roles,
      ...(request.user || {})
    }
  };
  
  return createHttpExecutionContext(authRequest, response, handler, classRef);
}

/**
 * Creates a mock ArgumentsHost for a specific journey with an authenticated user
 */
export function createAuthenticatedJourneyArgumentsHost(
  journeyType: 'HEALTH' | 'CARE' | 'PLAN',
  journeyId: string = 'test-journey-id',
  userId: string = 'test-user-id',
  roles: string[] = ['user'],
  request: Partial<MockRequest> = {},
  response: MockResponse = createMockResponse()
): ArgumentsHost {
  // Combine journey and authentication context
  const combinedRequest = {
    ...request,
    headers: {
      ...request.headers,
      'x-journey-id': journeyId,
      'x-journey-type': journeyType
    },
    journeyContext: {
      journeyId,
      journeyType,
      ...(request.journeyContext || {})
    },
    user: {
      id: userId,
      roles,
      ...(request.user || {})
    }
  };
  
  return createHttpArgumentsHost(combinedRequest, response);
}

/**
 * Creates a mock ExecutionContext for a specific journey with an authenticated user
 */
export function createAuthenticatedJourneyExecutionContext(
  journeyType: 'HEALTH' | 'CARE' | 'PLAN',
  journeyId: string = 'test-journey-id',
  userId: string = 'test-user-id',
  roles: string[] = ['user'],
  request: Partial<MockRequest> = {},
  response: MockResponse = createMockResponse(),
  handler: Function = () => {},
  classRef: Type<any> = Object
): ExecutionContext {
  // Combine journey and authentication context
  const combinedRequest = {
    ...request,
    headers: {
      ...request.headers,
      'x-journey-id': journeyId,
      'x-journey-type': journeyType
    },
    journeyContext: {
      journeyId,
      journeyType,
      ...(request.journeyContext || {})
    },
    user: {
      id: userId,
      roles,
      ...(request.user || {})
    }
  };
  
  return createHttpExecutionContext(combinedRequest, response, handler, classRef);
}