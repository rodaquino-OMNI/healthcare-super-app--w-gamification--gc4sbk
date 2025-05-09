import { NextFunction, Request, Response } from 'express';
import { JourneyContext } from '../../../src/base';
import {
  RequestContextMiddleware,
  RequestWithContext,
  REQUEST_HEADERS,
  createRequestContextMiddleware
} from '../../../src/middleware/request-context.middleware';

describe('RequestContextMiddleware', () => {
  let middleware: RequestContextMiddleware;
  let mockRequest: Partial<RequestWithContext>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    middleware = new RequestContextMiddleware();
    mockRequest = {
      headers: {},
      path: '/test',
      method: 'GET',
      socket: {
        remoteAddress: '127.0.0.1'
      },
      user: undefined
    };
    mockResponse = {
      setHeader: jest.fn()
    };
    nextFunction = jest.fn();
  });

  describe('Request ID generation and propagation', () => {
    it('should generate a new request ID if none is provided', () => {
      middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.requestId).toBeDefined();
      expect(typeof mockRequest.context?.requestId).toBe('string');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(REQUEST_HEADERS.REQUEST_ID, mockRequest.context?.requestId);
    });

    it('should use the existing request ID from headers if available', () => {
      const existingRequestId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.headers = {
        [REQUEST_HEADERS.REQUEST_ID]: existingRequestId
      };

      middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.requestId).toBe(existingRequestId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(REQUEST_HEADERS.REQUEST_ID, existingRequestId);
    });
  });

  describe('User context extraction', () => {
    it('should extract user information from request.user if available', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com'
      };

      middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.userId).toBe('user-123');
      expect(mockRequest.context?.userEmail).toBe('user@example.com');
    });

    it('should extract user information from JWT token if available', () => {
      // Create a mock JWT token with user information
      // This is a simplified JWT structure for testing purposes
      const payload = {
        sub: 'user-456',
        email: 'token-user@example.com'
      };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const mockToken = `header.${encodedPayload}.signature`;

      mockRequest.headers = {
        [REQUEST_HEADERS.AUTHORIZATION]: `Bearer ${mockToken}`
      };

      middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.userId).toBe('user-456');
      expect(mockRequest.context?.userEmail).toBe('token-user@example.com');
    });

    it('should handle invalid JWT tokens gracefully', () => {
      mockRequest.headers = {
        [REQUEST_HEADERS.AUTHORIZATION]: 'Bearer invalid-token'
      };

      middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.userId).toBeUndefined();
      expect(mockRequest.context?.userEmail).toBeUndefined();
    });

    it('should handle missing authorization header gracefully', () => {
      middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.userId).toBeUndefined();
      expect(mockRequest.context?.userEmail).toBeUndefined();
    });
  });

  describe('Journey context identification', () => {
    it('should identify journey context from headers', () => {
      mockRequest.headers = {
        [REQUEST_HEADERS.JOURNEY]: 'health'
      };

      middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.journey).toBe(JourneyContext.HEALTH);
    });

    it('should identify journey context from path if header is not available', () => {
      mockRequest.path = '/health/metrics';

      middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.journey).toBe(JourneyContext.HEALTH);
    });

    it('should identify different journey contexts correctly', () => {
      const testCases = [
        { path: '/care/appointments', expected: JourneyContext.CARE },
        { path: '/plan/benefits', expected: JourneyContext.PLAN },
        { path: '/gamification/achievements', expected: JourneyContext.GAMIFICATION },
        { path: '/auth/login', expected: JourneyContext.AUTH },
        { path: '/notification/preferences', expected: JourneyContext.NOTIFICATION },
        { path: '/unknown/path', expected: JourneyContext.SYSTEM }
      ];

      for (const testCase of testCases) {
        mockRequest.path = testCase.path;
        middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
        expect(mockRequest.context?.journey).toBe(testCase.expected);
      }
    });

    it('should prioritize journey header over path inference', () => {
      mockRequest.headers = {
        [REQUEST_HEADERS.JOURNEY]: 'plan'
      };
      mockRequest.path = '/health/metrics';

      middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.journey).toBe(JourneyContext.PLAN);
    });
  });

  describe('Client IP extraction', () => {
    it('should extract client IP from X-Forwarded-For header', () => {
      mockRequest.headers = {
        [REQUEST_HEADERS.FORWARDED_FOR]: '192.168.1.1, 10.0.0.1'
      };

      middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.clientIp).toBe('192.168.1.1');
    });

    it('should extract client IP from X-Real-IP header if X-Forwarded-For is not available', () => {
      mockRequest.headers = {
        [REQUEST_HEADERS.REAL_IP]: '192.168.1.2'
      };

      middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.clientIp).toBe('192.168.1.2');
    });

    it('should fall back to socket remote address if no headers are available', () => {
      middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.clientIp).toBe('127.0.0.1');
    });
  });

  describe('Distributed tracing integration', () => {
    it('should capture trace and span IDs from headers', () => {
      mockRequest.headers = {
        [REQUEST_HEADERS.TRACE_ID]: 'trace-123',
        [REQUEST_HEADERS.SPAN_ID]: 'span-456'
      };

      middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.traceId).toBe('trace-123');
      expect(mockRequest.context?.spanId).toBe('span-456');
    });
  });

  describe('Context object structure', () => {
    it('should create a complete context object with all expected properties', () => {
      const now = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => now as unknown as string);

      mockRequest.headers = {
        [REQUEST_HEADERS.REQUEST_ID]: 'req-123',
        [REQUEST_HEADERS.TRACE_ID]: 'trace-123',
        [REQUEST_HEADERS.SPAN_ID]: 'span-456',
        [REQUEST_HEADERS.JOURNEY]: 'health',
        [REQUEST_HEADERS.USER_AGENT]: 'test-agent',
        [REQUEST_HEADERS.FORWARDED_FOR]: '192.168.1.1'
      };
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com'
      };

      middleware.use(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toEqual({
        requestId: 'req-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        journey: JourneyContext.HEALTH,
        timestamp: now,
        clientIp: '192.168.1.1',
        userAgent: 'test-agent',
        traceId: 'trace-123',
        spanId: 'span-456',
        path: '/test',
        method: 'GET'
      });
    });
  });

  describe('Error handling', () => {
    it('should create a minimal context and continue if an error occurs', () => {
      // Create a request that will cause an error in the middleware
      const badRequest = {
        headers: {},
        // Missing required properties to trigger an error
      };

      middleware.use(badRequest as RequestWithContext, mockResponse as Response, nextFunction);

      // Should still create a minimal context
      expect(badRequest.context).toBeDefined();
      expect(badRequest.context?.requestId).toBeDefined();
      expect(badRequest.context?.timestamp).toBeDefined();
      
      // Should still set the header and call next
      expect(mockResponse.setHeader).toHaveBeenCalledWith(REQUEST_HEADERS.REQUEST_ID, badRequest.context?.requestId);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Factory function', () => {
    it('should create a middleware function that works the same as the class method', () => {
      const factoryMiddleware = createRequestContextMiddleware();
      
      factoryMiddleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);

      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.requestId).toBeDefined();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(REQUEST_HEADERS.REQUEST_ID, mockRequest.context?.requestId);
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});