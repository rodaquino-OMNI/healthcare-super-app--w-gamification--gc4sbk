import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { JourneyType } from '../../../src/context/context.constants';
import {
  createBaseContext,
  createRequestContext,
  createUserContext,
  createJourneyContext,
  createHealthJourneyContext,
  createCareJourneyContext,
  createPlanJourneyContext,
  mergeContexts,
  extractContextFromHeaders,
  createContextPropagationHeaders,
  extractContextFromRequest,
} from '../../../src/utils/context.utils';

// Mock uuid to ensure predictable IDs in tests
jest.mock('uuid');

describe('Context Utilities', () => {
  // Setup mocks
  beforeEach(() => {
    // Mock uuid v4 to return a predictable value
    (uuidv4 as jest.Mock).mockReturnValue('test-uuid-123');
    
    // Mock environment variables
    process.env.SERVICE_NAME = 'test-service';
    process.env.SERVICE_VERSION = '1.0.0';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.resetAllMocks();
    // Reset environment variables
    delete process.env.SERVICE_NAME;
    delete process.env.SERVICE_VERSION;
    delete process.env.NODE_ENV;
  });

  describe('createBaseContext', () => {
    it('should create a base context with default values', () => {
      const context = createBaseContext();
      
      expect(context).toHaveProperty('correlationId', 'test-uuid-123');
      expect(context).toHaveProperty('timestamp');
      expect(context).toHaveProperty('serviceName', 'test-service');
      expect(context).toHaveProperty('serviceVersion', '1.0.0');
      expect(context).toHaveProperty('environment', 'test');
      
      // Verify timestamp is a valid ISO string
      expect(new Date(context.timestamp as string).toISOString()).toBe(context.timestamp);
    });

    it('should use default values when environment variables are not set', () => {
      // Clear environment variables
      delete process.env.SERVICE_NAME;
      delete process.env.SERVICE_VERSION;
      delete process.env.NODE_ENV;
      
      const context = createBaseContext();
      
      expect(context).toHaveProperty('serviceName', 'unknown-service');
      expect(context).toHaveProperty('serviceVersion', 'unknown-version');
      expect(context).toHaveProperty('environment', 'development');
    });
  });

  describe('createRequestContext', () => {
    it('should create a request context from an Express request', () => {
      const mockRequest = {
        headers: {
          'x-request-id': 'req-123',
          'x-trace-id': 'trace-123',
          'x-span-id': 'span-123',
          'user-agent': 'test-agent',
        },
        method: 'GET',
        url: '/test-url',
        path: '/test-path',
        query: { param1: 'value1' },
        body: { data: 'test-data' },
        connection: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;
      
      const context = createRequestContext(mockRequest);
      
      expect(context).toHaveProperty('correlationId', 'test-uuid-123');
      expect(context).toHaveProperty('requestId', 'req-123');
      expect(context).toHaveProperty('traceId', 'trace-123');
      expect(context).toHaveProperty('spanId', 'span-123');
      expect(context).toHaveProperty('method', 'GET');
      expect(context).toHaveProperty('url', '/test-url');
      expect(context).toHaveProperty('path', '/test-path');
      expect(context).toHaveProperty('ip', '127.0.0.1');
      expect(context).toHaveProperty('userAgent', 'test-agent');
      expect(context.query).toEqual({ param1: 'value1' });
      expect(context.body).toEqual({ data: 'test-data' });
    });

    it('should generate a request ID if not provided in headers', () => {
      const mockRequest = {
        headers: {},
        method: 'GET',
        url: '/test-url',
        path: '/test-path',
        connection: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;
      
      const context = createRequestContext(mockRequest);
      
      expect(context).toHaveProperty('requestId', 'test-uuid-123');
    });

    it('should sanitize sensitive information in query and body', () => {
      const mockRequest = {
        headers: {},
        method: 'POST',
        url: '/login',
        path: '/login',
        query: { returnUrl: '/dashboard' },
        body: { 
          username: 'testuser', 
          password: 'secret123',
          token: 'sensitive-token',
          creditCard: { number: '4111111111111111', cvv: '123' }
        },
        connection: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;
      
      const context = createRequestContext(mockRequest);
      
      expect(context.body).toHaveProperty('username', 'testuser');
      expect(context.body).toHaveProperty('password', '[REDACTED]');
      expect(context.body).toHaveProperty('token', '[REDACTED]');
      expect(context.body.creditCard).toHaveProperty('number', '[REDACTED]');
      expect(context.body.creditCard).toHaveProperty('cvv', '[REDACTED]');
    });
  });

  describe('createUserContext', () => {
    it('should create a user context with required fields', () => {
      const userId = 'user-123';
      const context = createUserContext(userId);
      
      expect(context).toHaveProperty('correlationId', 'test-uuid-123');
      expect(context).toHaveProperty('userId', userId);
      expect(context).toHaveProperty('isAuthenticated', true);
      expect(context).toHaveProperty('roles');
      expect(context.roles).toEqual([]);
    });

    it('should include roles and additional info when provided', () => {
      const userId = 'user-123';
      const roles = ['admin', 'user'];
      const additionalInfo = { email: 'test@example.com', plan: 'premium' };
      
      const context = createUserContext(userId, roles, additionalInfo);
      
      expect(context).toHaveProperty('userId', userId);
      expect(context).toHaveProperty('roles', roles);
      expect(context).toHaveProperty('email', 'test@example.com');
      expect(context).toHaveProperty('plan', 'premium');
    });
  });

  describe('createJourneyContext', () => {
    it('should create a journey context with the specified journey type', () => {
      const journeyType = JourneyType.HEALTH;
      const context = createJourneyContext(journeyType);
      
      expect(context).toHaveProperty('correlationId', 'test-uuid-123');
      expect(context).toHaveProperty('journeyType', JourneyType.HEALTH);
      expect(context).toHaveProperty('journeyState');
      expect(context.journeyState).toEqual({});
    });

    it('should include journey state when provided', () => {
      const journeyType = JourneyType.CARE;
      const journeyState = { 
        appointmentId: 'appt-123',
        providerId: 'provider-456'
      };
      
      const context = createJourneyContext(journeyType, journeyState);
      
      expect(context).toHaveProperty('journeyType', JourneyType.CARE);
      expect(context).toHaveProperty('journeyState', journeyState);
    });
  });

  describe('Journey-specific context creators', () => {
    it('should create a Health journey context with health-specific information', () => {
      const healthMetrics = { steps: 10000, heartRate: 72 };
      const deviceInfo = { deviceId: 'device-123', type: 'smartwatch' };
      
      const context = createHealthJourneyContext(healthMetrics, deviceInfo);
      
      expect(context).toHaveProperty('journeyType', JourneyType.HEALTH);
      expect(context.journeyState).toHaveProperty('healthMetrics', healthMetrics);
      expect(context.journeyState).toHaveProperty('deviceInfo', deviceInfo);
    });

    it('should create a Care journey context with care-specific information', () => {
      const appointmentInfo = { id: 'appt-123', date: '2023-05-15T10:00:00Z' };
      const providerInfo = { id: 'provider-456', name: 'Dr. Smith' };
      
      const context = createCareJourneyContext(appointmentInfo, providerInfo);
      
      expect(context).toHaveProperty('journeyType', JourneyType.CARE);
      expect(context.journeyState).toHaveProperty('appointmentInfo', appointmentInfo);
      expect(context.journeyState).toHaveProperty('providerInfo', providerInfo);
    });

    it('should create a Plan journey context with plan-specific information', () => {
      const planInfo = { id: 'plan-123', name: 'Premium Health Plan' };
      const claimInfo = { id: 'claim-456', status: 'pending' };
      
      const context = createPlanJourneyContext(planInfo, claimInfo);
      
      expect(context).toHaveProperty('journeyType', JourneyType.PLAN);
      expect(context.journeyState).toHaveProperty('planInfo', planInfo);
      expect(context.journeyState).toHaveProperty('claimInfo', claimInfo);
    });
  });

  describe('mergeContexts', () => {
    it('should merge multiple contexts with later contexts overriding earlier ones', () => {
      const baseContext = { correlationId: 'corr-123', serviceName: 'service-1' };
      const userContext = { userId: 'user-123', correlationId: 'corr-456' };
      const requestContext = { requestId: 'req-123', method: 'GET' };
      
      const mergedContext = mergeContexts(baseContext, userContext, requestContext);
      
      // Should take correlationId from userContext (overriding baseContext)
      expect(mergedContext).toHaveProperty('correlationId', 'corr-456');
      expect(mergedContext).toHaveProperty('serviceName', 'service-1');
      expect(mergedContext).toHaveProperty('userId', 'user-123');
      expect(mergedContext).toHaveProperty('requestId', 'req-123');
      expect(mergedContext).toHaveProperty('method', 'GET');
    });

    it('should handle empty or undefined contexts gracefully', () => {
      const context1 = { prop1: 'value1' };
      const context2 = undefined;
      const context3 = {};
      
      const mergedContext = mergeContexts(context1, context2 as any, context3);
      
      expect(mergedContext).toHaveProperty('prop1', 'value1');
      expect(Object.keys(mergedContext).length).toBe(1);
    });

    it('should preserve nested objects when merging', () => {
      const context1 = { 
        metadata: { source: 'system1', timestamp: '2023-01-01T00:00:00Z' }
      };
      const context2 = { 
        metadata: { priority: 'high', category: 'auth' }
      };
      
      const mergedContext = mergeContexts(context1, context2);
      
      expect(mergedContext).toHaveProperty('metadata');
      expect(mergedContext.metadata).toHaveProperty('source', 'system1');
      expect(mergedContext.metadata).toHaveProperty('timestamp', '2023-01-01T00:00:00Z');
      expect(mergedContext.metadata).toHaveProperty('priority', 'high');
      expect(mergedContext.metadata).toHaveProperty('category', 'auth');
    });
  });

  describe('extractContextFromHeaders', () => {
    it('should extract context information from request headers', () => {
      const headers = {
        'x-correlation-id': 'corr-123',
        'x-trace-id': 'trace-123',
        'x-span-id': 'span-123',
        'x-journey-type': JourneyType.HEALTH,
        'x-user-id': 'user-123',
        'other-header': 'some-value'
      };
      
      const context = extractContextFromHeaders(headers);
      
      expect(context).toHaveProperty('correlationId', 'corr-123');
      expect(context).toHaveProperty('traceId', 'trace-123');
      expect(context).toHaveProperty('spanId', 'span-123');
      expect(context).toHaveProperty('journeyType', JourneyType.HEALTH);
      expect(context).toHaveProperty('userId', 'user-123');
      expect(context).not.toHaveProperty('other-header');
    });

    it('should return an empty object when no relevant headers are present', () => {
      const headers = {
        'content-type': 'application/json',
        'accept': '*/*'
      };
      
      const context = extractContextFromHeaders(headers);
      
      expect(Object.keys(context).length).toBe(0);
    });
  });

  describe('createContextPropagationHeaders', () => {
    it('should create headers for context propagation', () => {
      const context = {
        correlationId: 'corr-123',
        traceId: 'trace-123',
        spanId: 'span-123',
        journeyType: JourneyType.CARE,
        userId: 'user-123',
        requestId: 'req-123',
        otherProp: 'value'
      };
      
      const headers = createContextPropagationHeaders(context);
      
      expect(headers).toHaveProperty('x-correlation-id', 'corr-123');
      expect(headers).toHaveProperty('x-trace-id', 'trace-123');
      expect(headers).toHaveProperty('x-span-id', 'span-123');
      expect(headers).toHaveProperty('x-journey-type', JourneyType.CARE);
      expect(headers).toHaveProperty('x-user-id', 'user-123');
      expect(headers).toHaveProperty('x-request-id', 'req-123');
      expect(headers).not.toHaveProperty('x-otherProp');
    });

    it('should only include headers for properties that exist in the context', () => {
      const context = {
        correlationId: 'corr-123',
        // Missing other properties
      };
      
      const headers = createContextPropagationHeaders(context);
      
      expect(headers).toHaveProperty('x-correlation-id', 'corr-123');
      expect(Object.keys(headers).length).toBe(1);
    });
  });

  describe('extractContextFromRequest', () => {
    it('should extract and merge request, user, and journey contexts from a request', () => {
      const mockRequest = {
        headers: {
          'x-request-id': 'req-123',
          'x-trace-id': 'trace-123',
          'x-journey-type': JourneyType.HEALTH,
          'user-agent': 'test-agent'
        },
        method: 'GET',
        url: '/test-url',
        path: '/test-path',
        query: { param1: 'value1' },
        body: { data: 'test-data' },
        connection: { remoteAddress: '127.0.0.1' },
        user: {
          id: 'user-123',
          roles: ['admin'],
          email: 'test@example.com'
        }
      } as unknown as Request;
      
      const context = extractContextFromRequest(mockRequest);
      
      // Request context properties
      expect(context).toHaveProperty('requestId', 'req-123');
      expect(context).toHaveProperty('traceId', 'trace-123');
      expect(context).toHaveProperty('method', 'GET');
      expect(context).toHaveProperty('url', '/test-url');
      expect(context).toHaveProperty('path', '/test-path');
      
      // User context properties
      expect(context).toHaveProperty('userId', 'user-123');
      expect(context).toHaveProperty('isAuthenticated', true);
      expect(context).toHaveProperty('roles');
      expect(context.roles).toEqual(['admin']);
      expect(context).toHaveProperty('email', 'test@example.com');
      
      // Journey context properties
      expect(context).toHaveProperty('journeyType', JourneyType.HEALTH);
    });

    it('should handle requests without user or journey information', () => {
      const mockRequest = {
        headers: {
          'x-request-id': 'req-123'
        },
        method: 'GET',
        url: '/test-url',
        path: '/test-path',
        connection: { remoteAddress: '127.0.0.1' }
      } as unknown as Request;
      
      const context = extractContextFromRequest(mockRequest);
      
      // Should have request context properties
      expect(context).toHaveProperty('requestId', 'req-123');
      expect(context).toHaveProperty('method', 'GET');
      
      // Should not have user or journey properties
      expect(context).not.toHaveProperty('userId');
      expect(context).not.toHaveProperty('journeyType');
    });
  });

  // Test cross-cutting concerns
  describe('Context propagation across service boundaries', () => {
    it('should maintain correlation IDs when extracting and propagating context', () => {
      // Create an initial context
      const initialContext = createBaseContext();
      expect(initialContext).toHaveProperty('correlationId', 'test-uuid-123');
      
      // Convert to headers for propagation
      const headers = createContextPropagationHeaders(initialContext);
      expect(headers).toHaveProperty('x-correlation-id', 'test-uuid-123');
      
      // Extract context from headers (simulating receiving a request in another service)
      const extractedContext = extractContextFromHeaders(headers);
      expect(extractedContext).toHaveProperty('correlationId', 'test-uuid-123');
    });

    it('should preserve trace context across service boundaries', () => {
      // Create a request with trace information
      const mockRequest = {
        headers: {
          'x-trace-id': 'trace-123',
          'x-span-id': 'span-123'
        },
        method: 'GET',
        url: '/test',
        connection: { remoteAddress: '127.0.0.1' }
      } as unknown as Request;
      
      // Extract context from the request
      const requestContext = createRequestContext(mockRequest);
      expect(requestContext).toHaveProperty('traceId', 'trace-123');
      expect(requestContext).toHaveProperty('spanId', 'span-123');
      
      // Convert to headers for propagation
      const headers = createContextPropagationHeaders(requestContext);
      expect(headers).toHaveProperty('x-trace-id', 'trace-123');
      expect(headers).toHaveProperty('x-span-id', 'span-123');
      
      // Extract context from headers (simulating receiving a request in another service)
      const extractedContext = extractContextFromHeaders(headers);
      expect(extractedContext).toHaveProperty('traceId', 'trace-123');
      expect(extractedContext).toHaveProperty('spanId', 'span-123');
    });
  });
});