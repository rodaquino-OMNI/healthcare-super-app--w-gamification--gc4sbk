import { ArgumentsHost, ExecutionContext, HttpArgumentsHost, RpcArgumentsHost, WsArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Interface for tracking HTTP response data in tests
 */
export interface ResponseTracking {
  statusCode?: number;
  jsonData?: any;
  redirectUrl?: string;
  headers: Record<string, string>;
  ended: boolean;
}

/**
 * Creates a mock Express Request object for testing
 * @param overrides - Properties to override in the default request
 * @returns Mock Express Request object
 */
export function createMockRequest(overrides: Partial<Request> = {}): Request {
  const defaultRequest: Partial<Request> = {
    method: 'GET',
    url: '/test',
    path: '/test',
    params: {},
    query: {},
    body: {},
    headers: {
      'content-type': 'application/json',
    },
    cookies: {},
    ip: '127.0.0.1',
    protocol: 'http',
    secure: false,
    xhr: false,
    get: (name: string) => defaultRequest.headers?.[name.toLowerCase()],
  };

  return { ...defaultRequest, ...overrides } as Request;
}

/**
 * Creates a mock Express Response object for testing with tracking capabilities
 * @param tracking - Optional tracking object to record response operations
 * @returns Mock Express Response object and tracking data
 */
export function createMockResponse(tracking: ResponseTracking = { headers: {}, ended: false }): [Response, ResponseTracking] {
  const response = {
    statusCode: 200,
    headersSent: false,
    
    status: (code: number) => {
      response.statusCode = code;
      tracking.statusCode = code;
      return response;
    },
    
    json: (data: any) => {
      tracking.jsonData = data;
      tracking.ended = true;
      return response;
    },
    
    send: (data: any) => {
      tracking.jsonData = data;
      tracking.ended = true;
      return response;
    },
    
    end: () => {
      tracking.ended = true;
      return response;
    },
    
    redirect: (url: string) => {
      tracking.redirectUrl = url;
      tracking.ended = true;
      return response;
    },
    
    setHeader: (name: string, value: string) => {
      tracking.headers[name] = value;
      return response;
    },
    
    getHeader: (name: string) => {
      return tracking.headers[name];
    },
    
    removeHeader: (name: string) => {
      delete tracking.headers[name];
      return response;
    },
    
    // Additional Express Response properties
    locals: {},
    charset: 'utf-8',
    app: { locals: {} },
  } as unknown as Response;
  
  return [response, tracking];
}

/**
 * Mock implementation of NestJS HttpArgumentsHost
 */
export class MockHttpArgumentsHost implements HttpArgumentsHost {
  constructor(
    private readonly req: Request,
    private readonly res: Response,
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
 * Mock implementation of NestJS RpcArgumentsHost
 */
export class MockRpcArgumentsHost implements RpcArgumentsHost {
  constructor(
    private readonly data: any,
    private readonly context: any
  ) {}

  getData<T = any>(): T {
    return this.data as T;
  }

  getContext<T = any>(): T {
    return this.context as T;
  }
}

/**
 * Mock implementation of NestJS WsArgumentsHost
 */
export class MockWsArgumentsHost implements WsArgumentsHost {
  constructor(
    private readonly client: any,
    private readonly data: any
  ) {}

  getClient<T = any>(): T {
    return this.client as T;
  }

  getData<T = any>(): T {
    return this.data as T;
  }
}

/**
 * Mock implementation of NestJS ArgumentsHost
 */
export class MockArgumentsHost implements ArgumentsHost {
  constructor(
    private readonly args: any[],
    private readonly type: string = 'http',
    private readonly httpHost?: MockHttpArgumentsHost,
    private readonly rpcHost?: MockRpcArgumentsHost,
    private readonly wsHost?: MockWsArgumentsHost
  ) {}

  getArgs<T extends Array<any> = any[]>(): T {
    return this.args as T;
  }

  getArgByIndex<T = any>(index: number): T {
    return this.args[index] as T;
  }

  switchToRpc(): RpcArgumentsHost {
    if (!this.rpcHost) {
      throw new Error('RPC host not configured in this mock');
    }
    return this.rpcHost;
  }

  switchToHttp(): HttpArgumentsHost {
    if (!this.httpHost) {
      throw new Error('HTTP host not configured in this mock');
    }
    return this.httpHost;
  }

  switchToWs(): WsArgumentsHost {
    if (!this.wsHost) {
      throw new Error('WebSocket host not configured in this mock');
    }
    return this.wsHost;
  }

  getType<TContext extends string = string>(): TContext {
    return this.type as TContext;
  }
}

/**
 * Mock implementation of NestJS ExecutionContext
 */
export class MockExecutionContext extends MockArgumentsHost implements ExecutionContext {
  constructor(
    args: any[],
    type: string = 'http',
    private readonly handler: any = {},
    private readonly classRef: any = {},
    httpHost?: MockHttpArgumentsHost,
    rpcHost?: MockRpcArgumentsHost,
    wsHost?: MockWsArgumentsHost
  ) {
    super(args, type, httpHost, rpcHost, wsHost);
  }

  getClass<T = any>(): Type<T> {
    return this.classRef;
  }

  getHandler(): Function {
    return this.handler;
  }
}

// Type definition to match NestJS Type<T>
type Type<T = any> = new (...args: any[]) => T;

/**
 * Creates a mock HTTP context for testing exception filters and interceptors
 * @param request - Mock request or request overrides
 * @param journeyId - Optional journey ID to include in request headers
 * @param userId - Optional user ID to include in request user object
 * @returns Mock context objects and response tracking
 */
export function createMockHttpContext(request?: Partial<Request> | Request, journeyId?: string, userId?: string): {
  request: Request;
  response: Response;
  context: ExecutionContext;
  tracking: ResponseTracking;
} {
  // Create request with journey and user context if provided
  const mockRequest = request instanceof Object && 'method' in request
    ? request as Request
    : createMockRequest(request);
  
  // Add journey context if provided
  if (journeyId && mockRequest.headers) {
    mockRequest.headers['x-journey-id'] = journeyId;
  }
  
  // Add user context if provided
  if (userId) {
    (mockRequest as any).user = { id: userId, ...(mockRequest as any).user };
  }
  
  // Create response with tracking
  const [mockResponse, tracking] = createMockResponse();
  
  // Create HTTP arguments host
  const httpHost = new MockHttpArgumentsHost(mockRequest, mockResponse);
  
  // Create execution context
  const context = new MockExecutionContext(
    [mockRequest, mockResponse],
    'http',
    () => {}, // Mock handler
    {}, // Mock controller class
    httpHost
  );
  
  return {
    request: mockRequest,
    response: mockResponse,
    context,
    tracking,
  };
}

/**
 * Creates a mock HTTP context with a specific error scenario
 * @param error - The error to be handled
 * @param journeyContext - Optional journey context information
 * @returns Mock context objects and response tracking
 */
export function createMockErrorContext(error: Error, journeyContext?: {
  journeyId?: string;
  userId?: string;
  path?: string;
  method?: string;
}): {
  request: Request;
  response: Response;
  context: ExecutionContext;
  tracking: ResponseTracking;
  error: Error;
} {
  const { journeyId, userId, path = '/test', method = 'GET' } = journeyContext || {};
  
  const mockContext = createMockHttpContext(
    { path, url: path, method },
    journeyId,
    userId
  );
  
  return {
    ...mockContext,
    error,
  };
}

/**
 * Creates a mock context for testing journey-specific error handling
 * @param journeyType - The journey type (health, care, plan)
 * @param error - The error to be handled
 * @param userId - Optional user ID
 * @returns Mock context objects and response tracking
 */
export function createMockJourneyContext(journeyType: 'health' | 'care' | 'plan', error: Error, userId?: string): {
  request: Request;
  response: Response;
  context: ExecutionContext;
  tracking: ResponseTracking;
  error: Error;
} {
  return createMockErrorContext(error, {
    journeyId: journeyType,
    userId,
    path: `/${journeyType}/test`,
    method: 'GET',
  });
}