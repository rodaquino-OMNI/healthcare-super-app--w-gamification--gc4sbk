/**
 * @file nest-contexts.ts
 * @description Provides mock NestJS execution contexts, argument hosts, and handler references for testing
 * NestJS-specific error handling features. Contains fixtures for testing exception filters, guards,
 * interceptors, and custom decorators in isolation.
 */

import { 
  ArgumentsHost, 
  ExecutionContext, 
  HttpArgumentsHost, 
  RpcArgumentsHost, 
  WsArgumentsHost, 
  Type 
} from '@nestjs/common';

/**
 * Mock HTTP request object with common properties needed for testing
 */
export interface MockHttpRequest {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  params?: Record<string, any>;
  body?: any;
  user?: any;
  session?: Record<string, any>;
  ip?: string;
  [key: string]: any;
}

/**
 * Mock HTTP response object with common methods needed for testing
 */
export interface MockHttpResponse {
  statusCode?: number;
  status?: (code: number) => MockHttpResponse;
  json?: (data: any) => MockHttpResponse;
  send?: (data: any) => MockHttpResponse;
  end?: () => void;
  getHeader?: (name: string) => string;
  setHeader?: (name: string, value: string) => void;
  [key: string]: any;
}

/**
 * Mock RPC data object for testing microservice contexts
 */
export interface MockRpcData {
  data?: any;
  pattern?: any;
  [key: string]: any;
}

/**
 * Mock WebSocket client object for testing WebSocket contexts
 */
export interface MockWsClient {
  id?: string;
  rooms?: Set<string>;
  emit?: (event: string, data: any) => void;
  join?: (room: string) => void;
  leave?: (room: string) => void;
  [key: string]: any;
}

/**
 * Mock HTTP arguments host implementation
 */
class MockHttpArgumentsHost implements HttpArgumentsHost {
  constructor(
    private readonly request: MockHttpRequest,
    private readonly response: MockHttpResponse,
    private readonly next?: Function
  ) {}

  getRequest<T = any>(): T {
    return this.request as unknown as T;
  }

  getResponse<T = any>(): T {
    return this.response as unknown as T;
  }

  getNext<T = any>(): T {
    return this.next as unknown as T;
  }
}

/**
 * Mock RPC arguments host implementation
 */
class MockRpcArgumentsHost implements RpcArgumentsHost {
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
 * Mock WebSocket arguments host implementation
 */
class MockWsArgumentsHost implements WsArgumentsHost {
  constructor(
    private readonly client: MockWsClient,
    private readonly data: any,
    private readonly pattern?: any
  ) {}

  getClient<T = any>(): T {
    return this.client as unknown as T;
  }

  getData<T = any>(): T {
    return this.data as T;
  }

  getPattern<T = any>(): T {
    return this.pattern as T;
  }
}

/**
 * Type of context for the ArgumentsHost
 */
export type ContextType = 'http' | 'rpc' | 'ws' | 'graphql' | string;

/**
 * Mock implementation of NestJS ArgumentsHost for testing
 */
export class MockArgumentsHost implements ArgumentsHost {
  constructor(
    private readonly args: any[],
    private readonly contextType: ContextType = 'http',
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

  getType<T extends string = ContextType>(): T {
    return this.contextType as T;
  }

  switchToHttp(): HttpArgumentsHost {
    if (!this.httpHost) {
      throw new Error('HTTP context not available in this ArgumentsHost');
    }
    return this.httpHost;
  }

  switchToRpc(): RpcArgumentsHost {
    if (!this.rpcHost) {
      throw new Error('RPC context not available in this ArgumentsHost');
    }
    return this.rpcHost;
  }

  switchToWs(): WsArgumentsHost {
    if (!this.wsHost) {
      throw new Error('WebSocket context not available in this ArgumentsHost');
    }
    return this.wsHost;
  }
}

/**
 * Mock implementation of NestJS ExecutionContext for testing
 */
export class MockExecutionContext extends MockArgumentsHost implements ExecutionContext {
  constructor(
    args: any[],
    contextType: ContextType = 'http',
    private readonly handlerRef: Function = () => {},
    private readonly classRef: Type<any> = class {},
    httpHost?: MockHttpArgumentsHost,
    rpcHost?: MockRpcArgumentsHost,
    wsHost?: MockWsArgumentsHost
  ) {
    super(args, contextType, httpHost, rpcHost, wsHost);
  }

  getClass<T = any>(): Type<T> {
    return this.classRef as Type<T>;
  }

  getHandler(): Function {
    return this.handlerRef;
  }
}

/**
 * Creates a mock HTTP request object with default values
 */
export function createMockRequest(overrides: Partial<MockHttpRequest> = {}): MockHttpRequest {
  return {
    url: '/',
    method: 'GET',
    headers: {},
    query: {},
    params: {},
    body: {},
    user: null,
    session: {},
    ip: '127.0.0.1',
    ...overrides
  };
}

/**
 * Creates a mock HTTP response object with default implementations
 */
export function createMockResponse(overrides: Partial<MockHttpResponse> = {}): MockHttpResponse {
  const response: MockHttpResponse = {
    statusCode: 200,
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
    end() {
      return;
    },
    getHeader(name: string) {
      return this.headers?.[name];
    },
    setHeader(name: string, value: string) {
      if (!this.headers) this.headers = {};
      this.headers[name] = value;
    },
    ...overrides
  };
  
  return response;
}

/**
 * Creates a mock HTTP context for testing HTTP-specific error handling
 */
export function createHttpArgumentsHost(
  request: MockHttpRequest = createMockRequest(),
  response: MockHttpResponse = createMockResponse(),
  next: Function = () => {}
): MockHttpArgumentsHost {
  return new MockHttpArgumentsHost(request, response, next);
}

/**
 * Creates a mock RPC context for testing microservice-specific error handling
 */
export function createRpcArgumentsHost(
  data: any = {},
  context: any = {}
): MockRpcArgumentsHost {
  return new MockRpcArgumentsHost(data, context);
}

/**
 * Creates a mock WebSocket context for testing WebSocket-specific error handling
 */
export function createWsArgumentsHost(
  client: MockWsClient = {},
  data: any = {},
  pattern: any = null
): MockWsArgumentsHost {
  return new MockWsArgumentsHost(client, data, pattern);
}

/**
 * Creates a mock ArgumentsHost for HTTP context
 */
export function createHttpHost(
  request: MockHttpRequest = createMockRequest(),
  response: MockHttpResponse = createMockResponse(),
  next: Function = () => {}
): MockArgumentsHost {
  const httpHost = createHttpArgumentsHost(request, response, next);
  return new MockArgumentsHost([request, response, next], 'http', httpHost);
}

/**
 * Creates a mock ArgumentsHost for RPC context
 */
export function createRpcHost(
  data: any = {},
  context: any = {}
): MockArgumentsHost {
  const rpcHost = createRpcArgumentsHost(data, context);
  return new MockArgumentsHost([data, context], 'rpc', undefined, rpcHost);
}

/**
 * Creates a mock ArgumentsHost for WebSocket context
 */
export function createWsHost(
  client: MockWsClient = {},
  data: any = {},
  pattern: any = null
): MockArgumentsHost {
  const wsHost = createWsArgumentsHost(client, data, pattern);
  return new MockArgumentsHost([client, data, pattern], 'ws', undefined, undefined, wsHost);
}

/**
 * Creates a mock ExecutionContext for HTTP context
 */
export function createHttpExecutionContext(
  request: MockHttpRequest = createMockRequest(),
  response: MockHttpResponse = createMockResponse(),
  next: Function = () => {},
  handler: Function = () => {},
  controller: Type<any> = class {}
): MockExecutionContext {
  const httpHost = createHttpArgumentsHost(request, response, next);
  return new MockExecutionContext(
    [request, response, next],
    'http',
    handler,
    controller,
    httpHost
  );
}

/**
 * Creates a mock ExecutionContext for RPC context
 */
export function createRpcExecutionContext(
  data: any = {},
  context: any = {},
  handler: Function = () => {},
  controller: Type<any> = class {}
): MockExecutionContext {
  const rpcHost = createRpcArgumentsHost(data, context);
  return new MockExecutionContext(
    [data, context],
    'rpc',
    handler,
    controller,
    undefined,
    rpcHost
  );
}

/**
 * Creates a mock ExecutionContext for WebSocket context
 */
export function createWsExecutionContext(
  client: MockWsClient = {},
  data: any = {},
  pattern: any = null,
  handler: Function = () => {},
  controller: Type<any> = class {}
): MockExecutionContext {
  const wsHost = createWsArgumentsHost(client, data, pattern);
  return new MockExecutionContext(
    [client, data, pattern],
    'ws',
    handler,
    controller,
    undefined,
    undefined,
    wsHost
  );
}

/**
 * Sample handler metadata for testing decorators
 */
export const sampleHandlerMetadata = {
  roles: ['admin', 'user'],
  isPublic: false,
  rateLimit: { limit: 100, ttl: 60000 },
  cacheKey: 'test-cache-key',
  timeout: 5000,
  retryAttempts: 3,
  retryDelay: 1000,
  circuitBreaker: { threshold: 5, timeout: 30000 },
  fallbackMethod: 'getFallbackData'
};

/**
 * Creates a mock handler with metadata for testing decorators
 */
export function createHandlerWithMetadata(
  metadata: Record<string, any> = sampleHandlerMetadata
): Function {
  const handler = () => {};
  Object.defineProperty(handler, 'name', { value: 'testHandler' });
  
  // Simulate Reflect.getMetadata behavior
  for (const [key, value] of Object.entries(metadata)) {
    Reflect.defineMetadata(key, value, handler);
  }
  
  return handler;
}

/**
 * Creates a mock controller class with metadata for testing decorators
 */
export function createControllerWithMetadata(
  metadata: Record<string, any> = { roles: ['admin'] }
): Type<any> {
  class TestController {}
  
  // Simulate Reflect.getMetadata behavior
  for (const [key, value] of Object.entries(metadata)) {
    Reflect.defineMetadata(key, value, TestController);
  }
  
  return TestController;
}