import { Request, Response } from 'express';
import { ErrorType, AppException } from '../../../src/categories/app.exception';
import { circuitBreakerMiddleware } from '../../../src/middleware/circuit-breaker.middleware';
import { createMiddlewareMocks } from './express-mocks';
import { LoggerService } from '@austa/logging';
import { MetricsService } from '@austa/tracing';

// Mock the LoggerService
jest.mock('@austa/logging', () => {
  return {
    LoggerService: jest.fn().mockImplementation(() => {
      return {
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        log: jest.fn()
      };
    })
  };
});

// Mock the MetricsService
jest.mock('@austa/tracing', () => {
  return {
    MetricsService: jest.fn().mockImplementation(() => {
      return {
        incrementCounter: jest.fn(),
        recordResponseTime: jest.fn(),
        recordGauge: jest.fn()
      };
    })
  };
});

describe('Circuit Breaker Middleware', () => {
  let loggerService: LoggerService;
  let metricsService: MetricsService;
  let mockServiceCall: jest.Mock;
  let mockFallbackFn: jest.Mock;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create logger and metrics services
    loggerService = new LoggerService();
    metricsService = new MetricsService();
    
    // Create mock service call and fallback function
    mockServiceCall = jest.fn();
    mockFallbackFn = jest.fn().mockResolvedValue({ fallback: true });
  });
  
  describe('Basic Circuit Breaker Functionality', () => {
    it('should successfully pass through requests when circuit is closed', async () => {
      // Arrange
      const { req, res, next, resSpies } = createMiddlewareMocks();
      mockServiceCall.mockResolvedValue({ success: true });
      
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        fallback: mockFallbackFn,
        options: {
          failureThreshold: 3,
          resetTimeout: 10000,
          requestTimeout: 2000
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockServiceCall).toHaveBeenCalledTimes(1);
      expect(mockFallbackFn).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'circuit_breaker_request_total',
        { service: 'test-service', status: 'success' }
      );
      expect(metricsService.recordResponseTime).toHaveBeenCalled();
    });
    
    it('should open the circuit after reaching the failure threshold', async () => {
      // Arrange
      const failureThreshold = 3;
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        fallback: mockFallbackFn,
        options: {
          failureThreshold,
          resetTimeout: 10000,
          requestTimeout: 2000
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Mock service call to always fail
      mockServiceCall.mockRejectedValue(new Error('Service unavailable'));
      
      // Act - Call the middleware multiple times to exceed the failure threshold
      for (let i = 0; i < failureThreshold; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req as Request, res as Response, next);
      }
      
      // One more call should trigger the fallback
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockServiceCall).toHaveBeenCalledTimes(failureThreshold);
      expect(mockFallbackFn).toHaveBeenCalledTimes(1);
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'circuit_breaker_state_change',
        { service: 'test-service', from: 'closed', to: 'open' }
      );
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker opened for service'),
        expect.any(String)
      );
    });
    
    it('should use fallback when circuit is open', async () => {
      // Arrange
      const failureThreshold = 3;
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        fallback: mockFallbackFn,
        options: {
          failureThreshold,
          resetTimeout: 10000,
          requestTimeout: 2000
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Mock service call to always fail
      mockServiceCall.mockRejectedValue(new Error('Service unavailable'));
      
      // Act - Call the middleware multiple times to exceed the failure threshold
      for (let i = 0; i < failureThreshold; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req as Request, res as Response, next);
      }
      
      // Reset the service call mock to succeed (but it shouldn't be called)
      mockServiceCall.mockReset();
      mockServiceCall.mockResolvedValue({ success: true });
      
      // Call the middleware again when circuit is open
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockServiceCall).not.toHaveBeenCalled();
      expect(mockFallbackFn).toHaveBeenCalledTimes(1);
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'circuit_breaker_request_total',
        { service: 'test-service', status: 'short_circuited' }
      );
    });
    
    it('should transition to half-open state after reset timeout', async () => {
      // Arrange
      const failureThreshold = 3;
      const resetTimeout = 100; // Short timeout for testing
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        fallback: mockFallbackFn,
        options: {
          failureThreshold,
          resetTimeout,
          requestTimeout: 2000
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Mock service call to always fail
      mockServiceCall.mockRejectedValue(new Error('Service unavailable'));
      
      // Act - Call the middleware multiple times to exceed the failure threshold
      for (let i = 0; i < failureThreshold; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req as Request, res as Response, next);
      }
      
      // Wait for the reset timeout
      await new Promise(resolve => setTimeout(resolve, resetTimeout + 10));
      
      // Reset the service call mock to succeed
      mockServiceCall.mockReset();
      mockServiceCall.mockResolvedValue({ success: true });
      
      // Call the middleware again when circuit should be half-open
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockServiceCall).toHaveBeenCalledTimes(1);
      expect(mockFallbackFn).not.toHaveBeenCalled();
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'circuit_breaker_state_change',
        { service: 'test-service', from: 'open', to: 'half_open' }
      );
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'circuit_breaker_state_change',
        { service: 'test-service', from: 'half_open', to: 'closed' }
      );
      expect(loggerService.log).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker closed for service'),
        expect.any(String)
      );
    });
    
    it('should remain open if test request fails in half-open state', async () => {
      // Arrange
      const failureThreshold = 3;
      const resetTimeout = 100; // Short timeout for testing
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        fallback: mockFallbackFn,
        options: {
          failureThreshold,
          resetTimeout,
          requestTimeout: 2000
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Mock service call to always fail
      mockServiceCall.mockRejectedValue(new Error('Service unavailable'));
      
      // Act - Call the middleware multiple times to exceed the failure threshold
      for (let i = 0; i < failureThreshold; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req as Request, res as Response, next);
      }
      
      // Wait for the reset timeout
      await new Promise(resolve => setTimeout(resolve, resetTimeout + 10));
      
      // Service call still fails
      mockServiceCall.mockReset();
      mockServiceCall.mockRejectedValue(new Error('Service still unavailable'));
      
      // Call the middleware again when circuit should be half-open
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockServiceCall).toHaveBeenCalledTimes(1);
      expect(mockFallbackFn).toHaveBeenCalledTimes(1);
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'circuit_breaker_state_change',
        { service: 'test-service', from: 'open', to: 'half_open' }
      );
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'circuit_breaker_state_change',
        { service: 'test-service', from: 'half_open', to: 'open' }
      );
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker reopened for service'),
        expect.any(String)
      );
    });
  });
  
  describe('Configuration Options', () => {
    it('should respect custom failure threshold', async () => {
      // Arrange
      const failureThreshold = 5; // Higher threshold
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        fallback: mockFallbackFn,
        options: {
          failureThreshold,
          resetTimeout: 10000,
          requestTimeout: 2000
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Mock service call to always fail
      mockServiceCall.mockRejectedValue(new Error('Service unavailable'));
      
      // Act - Call the middleware multiple times but not enough to exceed threshold
      for (let i = 0; i < failureThreshold - 1; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req as Request, res as Response, next);
      }
      
      // Circuit should still be closed
      mockServiceCall.mockReset();
      mockServiceCall.mockResolvedValue({ success: true });
      
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockServiceCall).toHaveBeenCalledTimes(1);
      expect(mockFallbackFn).not.toHaveBeenCalled();
      expect(metricsService.incrementCounter).not.toHaveBeenCalledWith(
        'circuit_breaker_state_change',
        expect.any(Object)
      );
    });
    
    it('should handle request timeouts', async () => {
      // Arrange
      const requestTimeout = 100; // Short timeout for testing
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        fallback: mockFallbackFn,
        options: {
          failureThreshold: 3,
          resetTimeout: 10000,
          requestTimeout
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Mock service call to delay longer than timeout
      mockServiceCall.mockImplementation(() => {
        return new Promise(resolve => setTimeout(() => resolve({ success: true }), requestTimeout * 2));
      });
      
      // Act
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockFallbackFn).toHaveBeenCalledTimes(1);
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'circuit_breaker_request_total',
        { service: 'test-service', status: 'timeout' }
      );
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Request timed out'),
        expect.any(String)
      );
    });
  });
  
  describe('Fallback Mechanisms', () => {
    it('should use fallback function when provided', async () => {
      // Arrange
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        fallback: mockFallbackFn,
        options: {
          failureThreshold: 3,
          resetTimeout: 10000,
          requestTimeout: 2000
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Mock service call to fail
      mockServiceCall.mockRejectedValue(new Error('Service unavailable'));
      
      // Act
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockServiceCall).toHaveBeenCalledTimes(1);
      expect(mockFallbackFn).toHaveBeenCalledTimes(1);
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'circuit_breaker_request_total',
        { service: 'test-service', status: 'fallback' }
      );
    });
    
    it('should propagate error when no fallback is provided', async () => {
      // Arrange
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        // No fallback provided
        options: {
          failureThreshold: 3,
          resetTimeout: 10000,
          requestTimeout: 2000
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Mock service call to fail
      const serviceError = new Error('Service unavailable');
      mockServiceCall.mockRejectedValue(serviceError);
      
      // Act
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockServiceCall).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.cause).toBe(serviceError);
    });
    
    it('should handle fallback function errors', async () => {
      // Arrange
      const fallbackError = new Error('Fallback failed');
      mockFallbackFn.mockRejectedValue(fallbackError);
      
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        fallback: mockFallbackFn,
        options: {
          failureThreshold: 3,
          resetTimeout: 10000,
          requestTimeout: 2000
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Mock service call to fail
      mockServiceCall.mockRejectedValue(new Error('Service unavailable'));
      
      // Act
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockServiceCall).toHaveBeenCalledTimes(1);
      expect(mockFallbackFn).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe('FALLBACK_FAILED');
      expect(error.cause).toBe(fallbackError);
    });
  });
  
  describe('Metrics Collection', () => {
    it('should record request metrics', async () => {
      // Arrange
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        fallback: mockFallbackFn,
        options: {
          failureThreshold: 3,
          resetTimeout: 10000,
          requestTimeout: 2000
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Mock service call to succeed
      mockServiceCall.mockResolvedValue({ success: true });
      
      // Act
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'circuit_breaker_request_total',
        { service: 'test-service', status: 'success' }
      );
      expect(metricsService.recordResponseTime).toHaveBeenCalledWith(
        'circuit_breaker_request_duration_ms',
        expect.any(Number),
        { service: 'test-service' }
      );
    });
    
    it('should record failure metrics', async () => {
      // Arrange
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        fallback: mockFallbackFn,
        options: {
          failureThreshold: 3,
          resetTimeout: 10000,
          requestTimeout: 2000
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Mock service call to fail
      mockServiceCall.mockRejectedValue(new Error('Service unavailable'));
      
      // Act
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'circuit_breaker_request_total',
        { service: 'test-service', status: 'failure' }
      );
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'circuit_breaker_failure_total',
        { service: 'test-service' }
      );
    });
    
    it('should record circuit state metrics', async () => {
      // Arrange
      const failureThreshold = 3;
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        fallback: mockFallbackFn,
        options: {
          failureThreshold,
          resetTimeout: 10000,
          requestTimeout: 2000
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Mock service call to always fail
      mockServiceCall.mockRejectedValue(new Error('Service unavailable'));
      
      // Act - Call the middleware multiple times to exceed the failure threshold
      for (let i = 0; i < failureThreshold; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req as Request, res as Response, next);
      }
      
      // Assert
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'circuit_breaker_state_change',
        { service: 'test-service', from: 'closed', to: 'open' }
      );
      expect(metricsService.recordGauge).toHaveBeenCalledWith(
        'circuit_breaker_state',
        1, // 0 = closed, 1 = open, 0.5 = half-open
        { service: 'test-service' }
      );
    });
  });
  
  describe('Integration with External Services', () => {
    it('should handle external service errors with proper classification', async () => {
      // Arrange
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        fallback: mockFallbackFn,
        options: {
          failureThreshold: 3,
          resetTimeout: 10000,
          requestTimeout: 2000
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Mock different types of service errors
      const testCases = [
        { error: new Error('Connection refused'), expectedCode: 'CONNECTION_ERROR' },
        { error: new Error('Timeout'), expectedCode: 'TIMEOUT_ERROR' },
        { error: { status: 500, message: 'Internal Server Error' }, expectedCode: 'SERVER_ERROR' },
        { error: { status: 400, message: 'Bad Request' }, expectedCode: 'CLIENT_ERROR' }
      ];
      
      for (const testCase of testCases) {
        // Reset mocks
        jest.clearAllMocks();
        mockServiceCall.mockRejectedValue(testCase.error);
        
        // Act
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req as Request, res as Response, next);
        
        // Assert
        expect(mockFallbackFn).toHaveBeenCalledTimes(1);
        expect(metricsService.incrementCounter).toHaveBeenCalledWith(
          'circuit_breaker_request_total',
          { service: 'test-service', status: 'fallback' }
        );
        expect(loggerService.error).toHaveBeenCalledWith(
          expect.stringContaining(`External service error: ${testCase.expectedCode}`),
          expect.any(String),
          expect.any(String)
        );
      }
    });
    
    it('should handle successful responses with different formats', async () => {
      // Arrange
      const middleware = circuitBreakerMiddleware({
        serviceName: 'test-service',
        serviceCall: mockServiceCall,
        fallback: mockFallbackFn,
        options: {
          failureThreshold: 3,
          resetTimeout: 10000,
          requestTimeout: 2000
        },
        logger: loggerService,
        metrics: metricsService
      });
      
      // Test different response formats
      const testCases = [
        { response: { data: 'test data' } },
        { response: 'string response' },
        { response: [1, 2, 3] },
        { response: 42 }
      ];
      
      for (const testCase of testCases) {
        // Reset mocks
        jest.clearAllMocks();
        mockServiceCall.mockResolvedValue(testCase.response);
        
        // Act
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req as Request, res as Response, next);
        
        // Assert
        expect(mockServiceCall).toHaveBeenCalledTimes(1);
        expect(mockFallbackFn).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
        expect(metricsService.incrementCounter).toHaveBeenCalledWith(
          'circuit_breaker_request_total',
          { service: 'test-service', status: 'success' }
        );
      }
    });
  });
});