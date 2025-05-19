import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requestContextMiddleware } from '../../../src/middleware/request-context.middleware';
import { JOURNEY_IDS, JOURNEY_ROUTES, DEFAULT_JOURNEY } from '@austa/interfaces/common';
import { createMiddlewareMocks, createAuthenticatedRequest, createJourneyRequest } from './express-mocks';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('generated-request-id')
}));

describe('Request Context Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create middleware mocks
    const { req, res, next } = createMiddlewareMocks();
    mockRequest = req;
    mockResponse = res;
    nextFunction = next;
  });
  
  describe('Request ID handling', () => {
    it('should generate a new request ID if none is provided', () => {
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(uuidv4).toHaveBeenCalled();
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.requestId).toBe('generated-request-id');
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should use existing request ID from x-request-id header', () => {
      // Arrange
      mockRequest.headers = { 'x-request-id': 'existing-request-id' };
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(uuidv4).not.toHaveBeenCalled();
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.requestId).toBe('existing-request-id');
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should use existing request ID from correlation-id header', () => {
      // Arrange
      mockRequest.headers = { 'correlation-id': 'correlation-request-id' };
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(uuidv4).not.toHaveBeenCalled();
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.requestId).toBe('correlation-request-id');
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should prioritize x-request-id over correlation-id header', () => {
      // Arrange
      mockRequest.headers = {
        'x-request-id': 'primary-request-id',
        'correlation-id': 'secondary-correlation-id'
      };
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(uuidv4).not.toHaveBeenCalled();
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.requestId).toBe('primary-request-id');
      expect(nextFunction).toHaveBeenCalled();
    });
  });
  
  describe('User context extraction', () => {
    it('should extract user information from request.user', () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        user: { id: 'user-123', roles: ['user', 'admin'] }
      });
      mockRequest = req;
      mockResponse = res;
      nextFunction = next;
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.user).toBeDefined();
      expect(mockRequest.context?.user?.id).toBe('user-123');
      expect(mockRequest.context?.user?.roles).toEqual(['user', 'admin']);
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should handle requests without user information', () => {
      // Arrange - request without user object
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should extract user ID from authorization header if user object is not present', () => {
      // Arrange
      mockRequest.headers = { 'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWZyb20tdG9rZW4iLCJpYXQiOjE1MTYyMzkwMjJ9.fake-signature' };
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.user).toBeDefined();
      expect(mockRequest.context?.user?.id).toBe('user-from-token');
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should handle invalid JWT tokens gracefully', () => {
      // Arrange
      mockRequest.headers = { 'authorization': 'Bearer invalid-token' };
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });
  });
  
  describe('Journey context identification', () => {
    it('should identify journey from x-journey-id header', () => {
      // Arrange
      const { req, res, next } = createJourneyRequest(JOURNEY_IDS.CARE);
      mockRequest = req;
      mockResponse = res;
      nextFunction = next;
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.journey).toBe(JOURNEY_IDS.CARE);
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should identify journey from URL path', () => {
      // Arrange
      mockRequest.path = `${JOURNEY_ROUTES.HEALTH}/metrics`;
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.journey).toBe(JOURNEY_IDS.HEALTH);
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should identify journey from originalUrl if path is not available', () => {
      // Arrange
      mockRequest.path = undefined;
      mockRequest.originalUrl = `${JOURNEY_ROUTES.PLAN}/benefits`;
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.journey).toBe(JOURNEY_IDS.PLAN);
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should prioritize x-journey-id header over URL path', () => {
      // Arrange
      mockRequest.headers = { 'x-journey-id': JOURNEY_IDS.CARE };
      mockRequest.path = `${JOURNEY_ROUTES.HEALTH}/metrics`;
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.journey).toBe(JOURNEY_IDS.CARE);
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should use default journey when no journey context is found', () => {
      // Arrange
      mockRequest.path = '/api/unknown/endpoint';
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.journey).toBe(DEFAULT_JOURNEY);
      expect(nextFunction).toHaveBeenCalled();
    });
  });
  
  describe('Context object structure', () => {
    it('should create a complete context object with all properties', () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        headers: { 'x-request-id': 'test-request-id', 'x-journey-id': JOURNEY_IDS.HEALTH },
        user: { id: 'test-user-id', roles: ['user'] },
        method: 'GET',
        path: '/health/metrics'
      });
      mockRequest = req;
      mockResponse = res;
      nextFunction = next;
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context).toEqual({
        requestId: 'test-request-id',
        journey: JOURNEY_IDS.HEALTH,
        user: { id: 'test-user-id', roles: ['user'] },
        timestamp: expect.any(Date),
        request: {
          method: 'GET',
          path: '/health/metrics'
        }
      });
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should include timestamp in the context object', () => {
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.timestamp).toBeInstanceOf(Date);
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should include request method and path in the context object', () => {
      // Arrange
      mockRequest.method = 'POST';
      mockRequest.path = '/api/data';
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.request).toBeDefined();
      expect(mockRequest.context?.request?.method).toBe('POST');
      expect(mockRequest.context?.request?.path).toBe('/api/data');
      expect(nextFunction).toHaveBeenCalled();
    });
  });
  
  describe('Middleware behavior', () => {
    it('should call next function after setting context', () => {
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalledWith();
    });
    
    it('should not override existing context properties', () => {
      // Arrange
      mockRequest.context = {
        customProperty: 'custom-value',
        requestId: 'existing-id'
      };
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.context).toBeDefined();
      expect(mockRequest.context?.customProperty).toBe('custom-value');
      expect(mockRequest.context?.requestId).toBe('existing-id'); // Should not be overridden
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should handle errors gracefully and call next', () => {
      // Arrange - create a request that would cause an error
      mockRequest.headers = { 'authorization': {} as any }; // Invalid header type
      
      // Act
      requestContextMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockRequest.context).toBeDefined(); // Context should still be created
      expect(nextFunction).toHaveBeenCalled(); // Next should still be called
    });
  });
});