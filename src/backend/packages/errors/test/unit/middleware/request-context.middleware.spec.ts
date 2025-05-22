import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { JourneyType } from '../../../src/base';
import {
  RequestContextOptions,
  RequestWithContext,
  requestContextMiddleware
} from '../../../src/middleware/request-context.middleware';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('generated-uuid')
}));

describe('Request Context Middleware', () => {
  let mockRequest: Partial<RequestWithContext>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let headers: Record<string, string>;
  
  beforeEach(() => {
    // Reset headers for each test
    headers = {};
    
    // Setup mock request
    mockRequest = {
      headers,
      method: 'GET',
      originalUrl: '/test',
      path: '/test',
      query: {},
      params: {},
      body: {}
    };
    
    // Setup mock response
    mockResponse = {
      setHeader: jest.fn()
    };
    
    // Setup next function
    nextFunction = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Request ID handling', () => {
    it('should generate a new request ID if none exists', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.requestId).toBe('generated-uuid');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', 'generated-uuid');
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should use existing request ID from headers if available', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      mockRequest.headers['x-request-id'] = 'existing-request-id';
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.requestId).toBe('existing-request-id');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', 'existing-request-id');
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should use custom request ID header if configured', () => {
      // Arrange
      const options: RequestContextOptions = {
        requestIdHeader: 'custom-request-id'
      };
      const middleware = requestContextMiddleware(options);
      mockRequest.headers['custom-request-id'] = 'custom-id-value';
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.requestId).toBe('custom-id-value');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('custom-request-id', 'custom-id-value');
      expect(nextFunction).toHaveBeenCalled();
    });
  });
  
  describe('Correlation ID handling', () => {
    it('should extract correlation ID from headers if available', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      mockRequest.headers['x-correlation-id'] = 'test-correlation-id';
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.requestContext?.correlationId).toBe('test-correlation-id');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', 'test-correlation-id');
    });
    
    it('should not set correlation ID header if none exists', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.requestContext?.correlationId).toBeUndefined();
      expect(mockResponse.setHeader).not.toHaveBeenCalledWith('x-correlation-id', expect.anything());
    });
    
    it('should use custom correlation ID header if configured', () => {
      // Arrange
      const options: RequestContextOptions = {
        correlationIdHeader: 'custom-correlation-id'
      };
      const middleware = requestContextMiddleware(options);
      mockRequest.headers['custom-correlation-id'] = 'custom-correlation-value';
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.requestContext?.correlationId).toBe('custom-correlation-value');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('custom-correlation-id', 'custom-correlation-value');
    });
  });
  
  describe('User context extraction', () => {
    it('should extract user context from request.user if available', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      mockRequest.user = {
        id: 'user-123',
        roles: ['user', 'admin'],
        sessionId: 'session-456'
      };
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.userContext).toBeDefined();
      expect(mockRequest.userContext?.userId).toBe('user-123');
      expect(mockRequest.userContext?.roles).toEqual(['user', 'admin']);
      expect(mockRequest.userContext?.sessionId).toBe('session-456');
    });
    
    it('should extract user IP address and user agent', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      mockRequest.headers['user-agent'] = 'test-user-agent';
      mockRequest.socket = { remoteAddress: '127.0.0.1' } as any;
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.userContext).toBeDefined();
      expect(mockRequest.userContext?.ipAddress).toBe('127.0.0.1');
      expect(mockRequest.userContext?.userAgent).toBe('test-user-agent');
    });
    
    it('should extract user information from JWT token if enabled', () => {
      // Arrange
      const middleware = requestContextMiddleware({ extractUserFromToken: true });
      
      // Create a mock JWT token with base64 encoded payload
      // Payload: { "sub": "token-user-id", "roles": ["user"], "sessionId": "token-session" }
      const mockPayload = JSON.stringify({
        sub: 'token-user-id',
        roles: ['user'],
        sessionId: 'token-session'
      });
      const encodedPayload = Buffer.from(mockPayload).toString('base64');
      const mockToken = `header.${encodedPayload}.signature`;
      
      mockRequest.headers.authorization = `Bearer ${mockToken}`;
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.userContext).toBeDefined();
      expect(mockRequest.userContext?.userId).toBe('token-user-id');
      expect(mockRequest.userContext?.roles).toEqual(['user']);
      expect(mockRequest.userContext?.sessionId).toBe('token-session');
    });
    
    it('should not extract user information from JWT token if disabled', () => {
      // Arrange
      const middleware = requestContextMiddleware({ extractUserFromToken: false });
      
      // Create a mock JWT token with base64 encoded payload
      const mockPayload = JSON.stringify({
        sub: 'token-user-id',
        roles: ['user'],
        sessionId: 'token-session'
      });
      const encodedPayload = Buffer.from(mockPayload).toString('base64');
      const mockToken = `header.${encodedPayload}.signature`;
      
      mockRequest.headers.authorization = `Bearer ${mockToken}`;
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.userContext).toBeDefined();
      expect(mockRequest.userContext?.userId).toBeUndefined();
      expect(mockRequest.userContext?.roles).toBeUndefined();
      expect(mockRequest.userContext?.sessionId).toBeUndefined();
    });
    
    it('should handle invalid JWT token gracefully', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      mockRequest.headers.authorization = 'Bearer invalid-token';
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.userContext).toBeDefined();
      expect(mockRequest.userContext?.userId).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });
  });
  
  describe('Journey context extraction', () => {
    it('should extract journey type from headers if available', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      mockRequest.headers['x-journey-type'] = 'health';
      mockRequest.headers['x-journey-step'] = 'metrics';
      mockRequest.headers['x-previous-step'] = 'dashboard';
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.journeyContext).toBeDefined();
      expect(mockRequest.journeyContext?.journeyType).toBe('health');
      expect(mockRequest.journeyContext?.journeyStep).toBe('metrics');
      expect(mockRequest.journeyContext?.previousStep).toBe('dashboard');
    });
    
    it('should use custom journey header names if configured', () => {
      // Arrange
      const options: RequestContextOptions = {
        journeyTypeHeader: 'custom-journey-type',
        journeyStepHeader: 'custom-journey-step'
      };
      const middleware = requestContextMiddleware(options);
      mockRequest.headers['custom-journey-type'] = 'care';
      mockRequest.headers['custom-journey-step'] = 'appointments';
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.journeyContext).toBeDefined();
      expect(mockRequest.journeyContext?.journeyType).toBe('care');
      expect(mockRequest.journeyContext?.journeyStep).toBe('appointments');
    });
    
    it('should normalize journey type values', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      
      // Test different variations of journey types
      const testCases = [
        { input: 'minha-saude', expected: 'health' },
        { input: 'cuidar-me-agora', expected: 'care' },
        { input: 'meu-plano-e-beneficios', expected: 'plan' }
      ];
      
      for (const testCase of testCases) {
        // Reset for each test case
        mockRequest.journeyContext = undefined;
        mockRequest.headers['x-journey-type'] = testCase.input;
        
        // Act
        middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
        
        // Assert
        expect(mockRequest.journeyContext?.journeyType).toBe(testCase.expected);
      }
    });
    
    it('should infer journey type from path if not in headers', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      
      // Test different path patterns
      const testCases = [
        { path: '/health/metrics', expected: 'health' },
        { path: '/care/appointments', expected: 'care' },
        { path: '/plan/benefits', expected: 'plan' },
        { path: '/api/v1/health/goals', expected: 'health' },
        { path: '/api/v1/care/providers', expected: 'care' },
        { path: '/api/v1/plan/claims', expected: 'plan' }
      ];
      
      for (const testCase of testCases) {
        // Reset for each test case
        mockRequest.journeyContext = undefined;
        mockRequest.path = testCase.path;
        mockRequest.originalUrl = testCase.path;
        
        // Act
        middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
        
        // Assert
        expect(mockRequest.journeyContext?.journeyType).toBe(testCase.expected);
      }
    });
    
    it('should not set journey context if journey type cannot be determined', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      mockRequest.path = '/api/unknown';
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.journeyContext).toBeUndefined();
    });
  });
  
  describe('Request context creation', () => {
    it('should create request context with basic information', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      mockRequest.method = 'POST';
      mockRequest.originalUrl = '/api/test';
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.requestContext).toBeDefined();
      expect(mockRequest.requestContext?.method).toBe('POST');
      expect(mockRequest.requestContext?.url).toBe('/api/test');
    });
    
    it('should include specified headers in request context', () => {
      // Arrange
      const middleware = requestContextMiddleware({
        includeHeaders: ['user-agent', 'content-type']
      });
      mockRequest.headers['user-agent'] = 'test-agent';
      mockRequest.headers['content-type'] = 'application/json';
      mockRequest.headers['authorization'] = 'Bearer token'; // Should not be included
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.requestContext?.headers).toBeDefined();
      expect(mockRequest.requestContext?.headers?.['user-agent']).toBe('test-agent');
      expect(mockRequest.requestContext?.headers?.['content-type']).toBe('application/json');
      expect(mockRequest.requestContext?.headers?.['authorization']).toBeUndefined();
    });
    
    it('should include query parameters in request context', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      mockRequest.query = { page: '1', limit: '10' };
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.requestContext?.params).toBeDefined();
      expect(mockRequest.requestContext?.params).toEqual({ page: '1', limit: '10' });
    });
    
    it('should include route parameters in request context', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      mockRequest.params = { id: '123' };
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.requestContext?.params).toBeDefined();
      expect(mockRequest.requestContext?.params).toEqual({ id: '123' });
    });
    
    it('should include body in request context if configured', () => {
      // Arrange
      const middleware = requestContextMiddleware({ includeBody: true });
      mockRequest.body = { name: 'Test', email: 'test@example.com' };
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.requestContext?.body).toBeDefined();
      expect(mockRequest.requestContext?.body).toEqual({ name: 'Test', email: 'test@example.com' });
    });
    
    it('should not include body in request context if not configured', () => {
      // Arrange
      const middleware = requestContextMiddleware({ includeBody: false });
      mockRequest.body = { name: 'Test', email: 'test@example.com' };
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.requestContext?.body).toBeUndefined();
    });
    
    it('should sanitize sensitive information from body', () => {
      // Arrange
      const middleware = requestContextMiddleware({ includeBody: true });
      mockRequest.body = {
        username: 'testuser',
        password: 'secret123',
        creditCard: '4111111111111111',
        ssn: '123-45-6789'
      };
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.requestContext?.body).toBeDefined();
      expect(mockRequest.requestContext?.body?.username).toBe('testuser');
      expect(mockRequest.requestContext?.body?.password).toBe('[REDACTED]');
      expect(mockRequest.requestContext?.body?.creditCard).toBe('[REDACTED]');
      expect(mockRequest.requestContext?.body?.ssn).toBe('[REDACTED]');
    });
  });
  
  describe('Error handling', () => {
    it('should continue with next() even if an error occurs', () => {
      // Arrange
      const middleware = requestContextMiddleware();
      
      // Mock an error during processing
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockRequest.headers = null as any; // This will cause an error
      
      // Act
      middleware(mockRequest as RequestWithContext, mockResponse as Response, nextFunction);
      
      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });
});