/**
 * @file nest-contexts.ts
 * @description Provides mock NestJS execution contexts, argument hosts, and handler references
 * for testing NestJS-specific error handling features. Contains fixtures for testing exception
 * filters, guards, interceptors, and custom decorators in isolation.
 */

import { ExecutionContext, ArgumentsHost, Type } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';

/**
 * Interface for RPC context data
 */
export interface RpcContext {
  data: any;
  context: Record<string, any>;
}

/**
 * Interface for WebSocket context data
 */
export interface WsContext {
  client: any;
  data: any;
}

/**
 * Mock HTTP context with request and response objects
 */
export interface HttpContext {
  request: Partial<Request>;
  response: Partial<Response>;
}

/**
 * Creates a mock HTTP request object with common properties
 * @param overrides - Custom properties to override defaults
 * @returns Partial Express Request object
 */
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    method: 'GET',
    url: '/api/test',
    headers: {
      'content-type': 'application/json',
      'x-journey-id': 'health',
      'x-request-id': '123e4567-e89b-12d3-a456-426614174000',
    },
    query: {},
    params: {},
    body: {},
    ...overrides,
  };
}

/**
 * Creates a mock HTTP response object with common properties
 * @param overrides - Custom properties to override defaults
 * @returns Partial Express Response object with chainable methods
 */
export function createMockResponse(overrides: Partial<Response> = {}): Partial<Response> {
  const res: Partial<Response> = {
    statusCode: 200,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
    ...overrides,
  };
  
  // Ensure status() returns the response for chaining
  (res.status as jest.Mock).mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  
  return res;
}

/**
 * Creates a mock RPC context with data and context objects
 * @param data - The RPC data payload
 * @param context - The RPC context metadata
 * @returns RPC context object
 */
export function createMockRpcContext(data: any = {}, context: Record<string, any> = {}): RpcContext {
  return {
    data,
    context: {
      service: 'test-service',
      method: 'test-method',
      journeyId: 'health',
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      ...context,
    },
  };
}

/**
 * Creates a mock WebSocket context with client and data objects
 * @param data - The WebSocket data payload
 * @param client - The WebSocket client object
 * @returns WebSocket context object
 */
export function createMockWsContext(data: any = {}, client: any = {}): WsContext {
  return {
    data,
    client: {
      id: 'client-123',
      rooms: new Set(['room1']),
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      ...client,
    },
  };
}

/**
 * Creates a mock ArgumentsHost that can switch between HTTP, RPC, and WebSocket contexts
 * @param httpContext - HTTP context with request and response
 * @param rpcContext - RPC context with data and context
 * @param wsContext - WebSocket context with client and data
 * @returns Mock ArgumentsHost object
 */
export function createMockArgumentsHost(
  httpContext: HttpContext = { 
    request: createMockRequest(), 
    response: createMockResponse() 
  },
  rpcContext: RpcContext = createMockRpcContext(),
  wsContext: WsContext = createMockWsContext(),
): ArgumentsHost {
  const host = {
    getType: jest.fn().mockReturnValue('http'),
    getArgs: jest.fn().mockReturnValue([httpContext.request, httpContext.response]),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(httpContext.request),
      getResponse: jest.fn().mockReturnValue(httpContext.response),
      getNext: jest.fn().mockReturnValue(jest.fn()),
    }),
    switchToRpc: jest.fn().mockReturnValue({
      getData: jest.fn().mockReturnValue(rpcContext.data),
      getContext: jest.fn().mockReturnValue(rpcContext.context),
    }),
    switchToWs: jest.fn().mockReturnValue({
      getClient: jest.fn().mockReturnValue(wsContext.client),
      getData: jest.fn().mockReturnValue(wsContext.data),
    }),
  };
  
  return host as unknown as ArgumentsHost;
}

/**
 * Creates a mock ExecutionContext that extends ArgumentsHost with additional methods
 * @param httpContext - HTTP context with request and response
 * @param rpcContext - RPC context with data and context
 * @param wsContext - WebSocket context with client and data
 * @param handler - Handler metadata for reflection
 * @returns Mock ExecutionContext object
 */
export function createMockExecutionContext(
  httpContext: HttpContext = { 
    request: createMockRequest(), 
    response: createMockResponse() 
  },
  rpcContext: RpcContext = createMockRpcContext(),
  wsContext: WsContext = createMockWsContext(),
  handler: any = createMockHandler(),
): ExecutionContext {
  const argumentsHost = createMockArgumentsHost(httpContext, rpcContext, wsContext);
  
  const executionContext = {
    ...argumentsHost,
    getClass: jest.fn().mockReturnValue(handler.class),
    getHandler: jest.fn().mockReturnValue(handler.method),
    getType: jest.fn().mockReturnValue('http'),
  };
  
  return executionContext as unknown as ExecutionContext;
}

/**
 * Interface for handler metadata used in reflection
 */
export interface HandlerMetadata {
  class: Type<any>;
  method: Function;
  methodName: string;
  metadata: Record<string, any>;
}

/**
 * Creates mock handler metadata for testing decorators and reflection
 * @param classMetadata - Class-level metadata
 * @param methodMetadata - Method-level metadata
 * @returns Handler metadata object
 */
export function createMockHandler(
  classMetadata: Record<string, any> = {},
  methodMetadata: Record<string, any> = {},
): HandlerMetadata {
  // Create a mock class with metadata
  class TestController {
    testMethod() {
      return 'test';
    }
    
    async testAsyncMethod() {
      return 'async test';
    }
    
    testObservableMethod(): Observable<string> {
      return new Observable(subscriber => {
        subscriber.next('observable test');
        subscriber.complete();
      });
    }
  }
  
  // Add metadata to the class and method
  Reflect.defineMetadata('class', classMetadata, TestController);
  Reflect.defineMetadata('method', methodMetadata, TestController.prototype.testMethod);
  
  return {
    class: TestController,
    method: TestController.prototype.testMethod,
    methodName: 'testMethod',
    metadata: {
      ...classMetadata,
      ...methodMetadata,
    },
  };
}

/**
 * Creates a mock HTTP context with authenticated user
 * @param userId - User ID for the authenticated user
 * @param roles - User roles
 * @returns HTTP context with authenticated user
 */
export function createAuthenticatedContext(userId: string = 'user-123', roles: string[] = ['user']): HttpContext {
  return {
    request: createMockRequest({
      user: {
        id: userId,
        roles,
        journeyPreferences: {
          health: true,
          care: true,
          plan: true,
        },
      },
      headers: {
        'authorization': 'Bearer mock-token',
        'x-journey-id': 'health',
      },
    }),
    response: createMockResponse(),
  };
}

/**
 * Creates a mock HTTP context for a specific journey
 * @param journeyId - Journey identifier (health, care, plan)
 * @returns HTTP context with journey-specific data
 */
export function createJourneyContext(journeyId: 'health' | 'care' | 'plan'): HttpContext {
  return {
    request: createMockRequest({
      headers: {
        'x-journey-id': journeyId,
      },
      user: {
        id: 'user-123',
        roles: ['user'],
        journeyPreferences: {
          [journeyId]: true,
        },
      },
    }),
    response: createMockResponse(),
  };
}

/**
 * Creates a mock HTTP context for testing validation errors
 * @param invalidData - The invalid data that should trigger validation errors
 * @returns HTTP context with invalid data
 */
export function createValidationErrorContext(invalidData: Record<string, any>): HttpContext {
  return {
    request: createMockRequest({
      method: 'POST',
      body: invalidData,
      headers: {
        'content-type': 'application/json',
      },
    }),
    response: createMockResponse(),
  };
}

/**
 * Creates a mock HTTP context for testing business logic errors
 * @param businessContext - Business context that would trigger a business rule violation
 * @returns HTTP context with business context
 */
export function createBusinessErrorContext(businessContext: Record<string, any>): HttpContext {
  return {
    request: createMockRequest({
      method: 'POST',
      body: { ...businessContext },
      headers: {
        'content-type': 'application/json',
      },
      user: {
        id: 'user-123',
        roles: ['user'],
      },
    }),
    response: createMockResponse(),
  };
}

/**
 * Creates a mock HTTP context for testing external system errors
 * @param externalSystem - Name of the external system
 * @returns HTTP context for external system interaction
 */
export function createExternalSystemContext(externalSystem: string): HttpContext {
  return {
    request: createMockRequest({
      headers: {
        'x-external-system': externalSystem,
        'x-request-id': '123e4567-e89b-12d3-a456-426614174000',
      },
    }),
    response: createMockResponse(),
  };
}

/**
 * Creates a mock HTTP context for testing technical errors
 * @param technicalContext - Technical context that would trigger a system error
 * @returns HTTP context with technical context
 */
export function createTechnicalErrorContext(technicalContext: Record<string, any>): HttpContext {
  return {
    request: createMockRequest({
      headers: {
        'x-debug-mode': 'true',
        ...technicalContext,
      },
    }),
    response: createMockResponse(),
  };
}

/**
 * Creates a mock HTTP context for testing timeout errors
 * @param timeoutMs - Timeout in milliseconds
 * @returns HTTP context with timeout configuration
 */
export function createTimeoutContext(timeoutMs: number = 5000): HttpContext {
  return {
    request: createMockRequest({
      headers: {
        'x-timeout-ms': timeoutMs.toString(),
      },
    }),
    response: createMockResponse(),
  };
}

/**
 * Creates a mock HTTP context for testing retry scenarios
 * @param maxRetries - Maximum number of retries
 * @param retryableErrors - Array of error codes that should trigger retries
 * @returns HTTP context with retry configuration
 */
export function createRetryContext(maxRetries: number = 3, retryableErrors: string[] = []): HttpContext {
  return {
    request: createMockRequest({
      headers: {
        'x-max-retries': maxRetries.toString(),
        'x-retryable-errors': retryableErrors.join(','),
      },
    }),
    response: createMockResponse(),
  };
}

/**
 * Creates a mock HTTP context for testing circuit breaker scenarios
 * @param failureThreshold - Number of failures before circuit opens
 * @param resetTimeout - Time in ms before attempting to close circuit
 * @returns HTTP context with circuit breaker configuration
 */
export function createCircuitBreakerContext(
  failureThreshold: number = 5,
  resetTimeout: number = 30000,
): HttpContext {
  return {
    request: createMockRequest({
      headers: {
        'x-circuit-failure-threshold': failureThreshold.toString(),
        'x-circuit-reset-timeout': resetTimeout.toString(),
      },
    }),
    response: createMockResponse(),
  };
}

/**
 * Creates a mock HTTP context for testing fallback scenarios
 * @param fallbackStrategy - Name of the fallback strategy to use
 * @returns HTTP context with fallback configuration
 */
export function createFallbackContext(fallbackStrategy: string = 'default'): HttpContext {
  return {
    request: createMockRequest({
      headers: {
        'x-fallback-strategy': fallbackStrategy,
      },
    }),
    response: createMockResponse(),
  };
}