/**
 * @file nest-contexts.ts
 * @description Test fixtures for NestJS execution contexts, argument hosts, and handler references.
 * 
 * This file provides mock implementations of NestJS execution contexts and related interfaces
 * for testing error handling features in isolation. It includes fixtures for testing exception
 * filters, guards, interceptors, and custom decorators across different transport contexts
 * (HTTP, RPC, WebSockets).
 */

import { 
  ArgumentsHost, 
  ExecutionContext, 
  HttpArgumentsHost, 
  RpcArgumentsHost, 
  WsArgumentsHost,
  Type
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Interface for mock HTTP context
 */
export interface MockHttpContext {
  request: Partial<Request>;
  response: Partial<Response>;
  next?: Function;
}

/**
 * Interface for mock RPC context
 */
export interface MockRpcContext {
  data: any;
  context: any;
}

/**
 * Interface for mock WebSocket context
 */
export interface MockWsContext {
  client: any;
  data: any;
  pattern?: any;
}

/**
 * Interface for handler metadata used in execution contexts
 */
export interface MockHandlerMetadata {
  methodName: string;
  className: string;
  handler: Function;
  module?: any;
  methodMetadata?: Record<string, any>;
  classMetadata?: Record<string, any>;
}

/**
 * Creates a mock ArgumentsHost that can switch between HTTP, RPC, and WebSocket contexts
 * 
 * @param httpContext - Optional HTTP context with request and response objects
 * @param rpcContext - Optional RPC context with data and context objects
 * @param wsContext - Optional WebSocket context with client and data objects
 * @returns A mock implementation of ArgumentsHost
 */
export function createMockArgumentsHost(
  httpContext?: MockHttpContext,
  rpcContext?: MockRpcContext,
  wsContext?: MockWsContext
): ArgumentsHost {
  // Default contexts if not provided
  const defaultHttpContext: MockHttpContext = {
    request: {
      method: 'GET',
      url: '/test',
      headers: {},
      query: {},
      params: {},
      body: {},
      user: { id: 'test-user-id' }
    },
    response: {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    },
    next: jest.fn()
  };

  const defaultRpcContext: MockRpcContext = {
    data: {},
    context: { type: 'rpc', pattern: 'test-pattern' }
  };

  const defaultWsContext: MockWsContext = {
    client: { id: 'test-client-id', emit: jest.fn() },
    data: {},
    pattern: 'test-pattern'
  };

  // Use provided contexts or defaults
  const http = httpContext || defaultHttpContext;
  const rpc = rpcContext || defaultRpcContext;
  const ws = wsContext || defaultWsContext;

  // Create the mock ArgumentsHost
  const host: ArgumentsHost = {
    getType: () => 'http',
    getArgs: () => [http.request, http.response, http.next],
    getArgByIndex: (index: number) => [http.request, http.response, http.next][index],
    switchToHttp: () => ({
      getRequest: () => http.request,
      getResponse: () => http.response,
      getNext: () => http.next,
    } as HttpArgumentsHost),
    switchToRpc: () => ({
      getData: () => rpc.data,
      getContext: () => rpc.context,
    } as RpcArgumentsHost),
    switchToWs: () => ({
      getClient: () => ws.client,
      getData: () => ws.data,
      getPattern: () => ws.pattern,
    } as WsArgumentsHost),
  };

  return host;
}

/**
 * Creates a mock ExecutionContext that extends ArgumentsHost with handler metadata
 * 
 * @param handlerMetadata - Metadata about the handler being executed
 * @param httpContext - Optional HTTP context with request and response objects
 * @param rpcContext - Optional RPC context with data and context objects
 * @param wsContext - Optional WebSocket context with client and data objects
 * @returns A mock implementation of ExecutionContext
 */
export function createMockExecutionContext(
  handlerMetadata: Partial<MockHandlerMetadata>,
  httpContext?: MockHttpContext,
  rpcContext?: MockRpcContext,
  wsContext?: MockWsContext
): ExecutionContext {
  // Default handler metadata if not provided
  const defaultHandlerMetadata: MockHandlerMetadata = {
    methodName: 'testMethod',
    className: 'TestController',
    handler: jest.fn(),
    methodMetadata: {},
    classMetadata: {},
  };

  // Merge provided metadata with defaults
  const metadata = { ...defaultHandlerMetadata, ...handlerMetadata };
  
  // Create ArgumentsHost
  const argumentsHost = createMockArgumentsHost(httpContext, rpcContext, wsContext);
  
  // Create the mock ExecutionContext
  const context: ExecutionContext = {
    ...argumentsHost,
    getClass: () => ({ name: metadata.className } as Type<any>),
    getHandler: () => metadata.handler,
    getType: () => argumentsHost.getType(),
    getArgs: () => argumentsHost.getArgs(),
    getArgByIndex: (index) => argumentsHost.getArgByIndex(index),
    switchToHttp: () => argumentsHost.switchToHttp(),
    switchToRpc: () => argumentsHost.switchToRpc(),
    switchToWs: () => argumentsHost.switchToWs(),
  };

  return context;
}

/**
 * Creates a mock HTTP-specific ArgumentsHost
 * 
 * @param httpContext - HTTP context with request and response objects
 * @returns A mock implementation of ArgumentsHost configured for HTTP
 */
export function createHttpArgumentsHost(httpContext?: MockHttpContext): ArgumentsHost {
  return createMockArgumentsHost(httpContext);
}

/**
 * Creates a mock RPC-specific ArgumentsHost
 * 
 * @param rpcContext - RPC context with data and context objects
 * @returns A mock implementation of ArgumentsHost configured for RPC
 */
export function createRpcArgumentsHost(rpcContext?: MockRpcContext): ArgumentsHost {
  const host = createMockArgumentsHost(undefined, rpcContext);
  // Override getType to return 'rpc'
  return {
    ...host,
    getType: () => 'rpc',
    getArgs: () => [rpcContext?.data, rpcContext?.context],
    getArgByIndex: (index: number) => [rpcContext?.data, rpcContext?.context][index],
  };
}

/**
 * Creates a mock WebSocket-specific ArgumentsHost
 * 
 * @param wsContext - WebSocket context with client and data objects
 * @returns A mock implementation of ArgumentsHost configured for WebSockets
 */
export function createWsArgumentsHost(wsContext?: MockWsContext): ArgumentsHost {
  const host = createMockArgumentsHost(undefined, undefined, wsContext);
  // Override getType to return 'ws'
  return {
    ...host,
    getType: () => 'ws',
    getArgs: () => [wsContext?.client, wsContext?.data, wsContext?.pattern],
    getArgByIndex: (index: number) => [wsContext?.client, wsContext?.data, wsContext?.pattern][index],
  };
}

/**
 * Creates a mock HTTP request object with common properties
 * 
 * @param overrides - Properties to override in the default request
 * @returns A mock HTTP request object
 */
export function createMockRequest(overrides?: Partial<Request>): Partial<Request> {
  return {
    method: 'GET',
    url: '/test',
    path: '/test',
    params: {},
    query: {},
    body: {},
    headers: {
      'content-type': 'application/json',
      'x-journey-id': 'health',
    },
    user: { id: 'test-user-id', roles: ['user'] },
    ...overrides,
  };
}

/**
 * Creates a mock HTTP response object with common methods
 * 
 * @returns A mock HTTP response object
 */
export function createMockResponse(): Partial<Response> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
    locals: {},
  };
}

/**
 * Creates a mock handler function with metadata for testing decorators
 * 
 * @param metadata - Metadata to attach to the handler
 * @returns A mock handler function with metadata
 */
export function createMockHandler(metadata?: Record<string, any>): Function & { metadata?: Record<string, any> } {
  const handler = jest.fn();
  if (metadata) {
    handler.metadata = metadata;
  }
  return handler;
}

/**
 * Sample handler metadata for common testing scenarios
 */
export const sampleHandlerMetadata = {
  /**
   * Sample metadata for a controller method with retry configuration
   */
  withRetry: {
    methodName: 'getExternalData',
    className: 'ExternalApiController',
    methodMetadata: {
      retry: { attempts: 3, delay: 1000 }
    }
  },
  
  /**
   * Sample metadata for a controller method with circuit breaker configuration
   */
  withCircuitBreaker: {
    methodName: 'processPayment',
    className: 'PaymentController',
    methodMetadata: {
      circuitBreaker: { failureThreshold: 5, resetTimeout: 30000 }
    }
  },
  
  /**
   * Sample metadata for a controller method with fallback configuration
   */
  withFallback: {
    methodName: 'getUserProfile',
    className: 'UserController',
    methodMetadata: {
      fallback: 'getDefaultUserProfile'
    }
  },
  
  /**
   * Sample metadata for a controller method with timeout configuration
   */
  withTimeout: {
    methodName: 'generateReport',
    className: 'ReportController',
    methodMetadata: {
      timeout: 5000
    }
  },
  
  /**
   * Sample metadata for a controller method with journey-specific error handling
   */
  withJourneyErrorHandling: {
    methodName: 'getHealthMetrics',
    className: 'HealthController',
    methodMetadata: {
      journeyErrorHandling: {
        journey: 'health',
        errorCodes: ['HEALTH_DATA_UNAVAILABLE', 'DEVICE_CONNECTION_ERROR']
      }
    }
  }
};

/**
 * Sample HTTP contexts for common testing scenarios
 */
export const sampleHttpContexts = {
  /**
   * Sample HTTP context for a successful request
   */
  success: {
    request: createMockRequest(),
    response: createMockResponse(),
  },
  
  /**
   * Sample HTTP context for an authenticated request in the health journey
   */
  healthJourney: {
    request: createMockRequest({
      headers: { 'x-journey-id': 'health' },
      user: { id: 'test-user-id', roles: ['user'] },
    }),
    response: createMockResponse(),
  },
  
  /**
   * Sample HTTP context for an authenticated request in the care journey
   */
  careJourney: {
    request: createMockRequest({
      headers: { 'x-journey-id': 'care' },
      user: { id: 'test-user-id', roles: ['user'] },
    }),
    response: createMockResponse(),
  },
  
  /**
   * Sample HTTP context for an authenticated request in the plan journey
   */
  planJourney: {
    request: createMockRequest({
      headers: { 'x-journey-id': 'plan' },
      user: { id: 'test-user-id', roles: ['user'] },
    }),
    response: createMockResponse(),
  },
  
  /**
   * Sample HTTP context for an unauthenticated request
   */
  unauthenticated: {
    request: createMockRequest({ user: undefined }),
    response: createMockResponse(),
  },
  
  /**
   * Sample HTTP context for a request with validation errors
   */
  validationError: {
    request: createMockRequest({
      body: { invalidField: 'invalid-value' },
    }),
    response: createMockResponse(),
  }
};

/**
 * Sample RPC contexts for common testing scenarios
 */
export const sampleRpcContexts = {
  /**
   * Sample RPC context for a successful request
   */
  success: {
    data: { id: 'test-id' },
    context: { type: 'rpc', pattern: 'get-user' }
  },
  
  /**
   * Sample RPC context for a request with validation errors
   */
  validationError: {
    data: { invalidField: 'invalid-value' },
    context: { type: 'rpc', pattern: 'create-user' }
  },
  
  /**
   * Sample RPC context for a request in the health journey
   */
  healthJourney: {
    data: { userId: 'test-user-id' },
    context: { type: 'rpc', pattern: 'get-health-metrics', journey: 'health' }
  },
  
  /**
   * Sample RPC context for a request in the care journey
   */
  careJourney: {
    data: { userId: 'test-user-id' },
    context: { type: 'rpc', pattern: 'get-appointments', journey: 'care' }
  },
  
  /**
   * Sample RPC context for a request in the plan journey
   */
  planJourney: {
    data: { userId: 'test-user-id' },
    context: { type: 'rpc', pattern: 'get-benefits', journey: 'plan' }
  }
};

/**
 * Sample WebSocket contexts for common testing scenarios
 */
export const sampleWsContexts = {
  /**
   * Sample WebSocket context for a successful message
   */
  success: {
    client: { id: 'test-client-id', emit: jest.fn() },
    data: { type: 'message', content: 'Hello' },
    pattern: 'send-message'
  },
  
  /**
   * Sample WebSocket context for a client in the health journey
   */
  healthJourney: {
    client: { 
      id: 'test-client-id', 
      emit: jest.fn(),
      user: { id: 'test-user-id', journey: 'health' }
    },
    data: { type: 'subscribe', topic: 'health-metrics' },
    pattern: 'subscribe'
  },
  
  /**
   * Sample WebSocket context for a client in the care journey
   */
  careJourney: {
    client: { 
      id: 'test-client-id', 
      emit: jest.fn(),
      user: { id: 'test-user-id', journey: 'care' }
    },
    data: { type: 'subscribe', topic: 'appointments' },
    pattern: 'subscribe'
  },
  
  /**
   * Sample WebSocket context for a client in the plan journey
   */
  planJourney: {
    client: { 
      id: 'test-client-id', 
      emit: jest.fn(),
      user: { id: 'test-user-id', journey: 'plan' }
    },
    data: { type: 'subscribe', topic: 'claims' },
    pattern: 'subscribe'
  },
  
  /**
   * Sample WebSocket context for an unauthenticated client
   */
  unauthenticated: {
    client: { id: 'test-client-id', emit: jest.fn() },
    data: { type: 'message' },
    pattern: 'send-message'
  }
};