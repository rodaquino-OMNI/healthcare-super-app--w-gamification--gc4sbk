import { Request, Response, NextFunction } from 'express';
import { circuitBreakerMiddleware, getCircuitBreakerMetrics } from '../../../src/middleware/circuit-breaker.middleware';
import { AppException, ErrorType } from '../../../shared/src/exceptions/exceptions.types';

/**
 * Mock implementation of Express Request
 */
class MockRequest {
  public headers: Record<string, string> = {};
  public params: Record<string, string> = {};
  public query: Record<string, string> = {};
  public body: any = {};
  public method: string = 'GET';
  public url: string = '/';
  public __retryCount?: number;

  constructor(options: Partial<MockRequest> = {}) {
    Object.assign(this, options);
  }
}

/**
 * Mock implementation of Express Response
 */
class MockResponse {
  public statusCode: number = 200;
  public headers: Record<string, string> = {};
  public body: any = null;
  public ended: boolean = false;

  public status(code: number): MockResponse {
    this.statusCode = code;
    return this;
  }

  public json(body: any): MockResponse {
    this.body = body;
    this.ended = true;
    return this;
  }

  public send(body: any): MockResponse {
    this.body = body;
    this.ended = true;
    return this;
  }

  public end(...args: any[]): MockResponse {
    this.ended = true;
    return this;
  }

  public set(header: string | Record<string, string>, value?: string): MockResponse {
    if (typeof header === 'string' && value !== undefined) {
      this.headers[header] = value;
    } else if (typeof header === 'object') {
      Object.assign(this.headers, header);
    }
    return this;
  }

  public getHeaders(): Record<string, string> {
    return { ...this.headers };
  }
}

/**
 * Mock implementation of Express NextFunction
 */
type MockNextFunction = jest.Mock<void, [error?: any]>;

/**
 * Mock implementation of a cache
 */
class MockCache {
  private cache: Map<string, any> = new Map();

  public async get(key: string): Promise<any> {
    return this.cache.get(key);
  }

  public async set(key: string, value: any, ttl?: number): Promise<void> {
    this.cache.set(key, value);
    if (ttl) {
      setTimeout(() => this.cache.delete(key), ttl);
    }
  }

  public clear(): void {
    this.cache.clear();
  }
}

describe('CircuitBreakerMiddleware', () => {
  let req: MockRequest;
  let res: MockResponse;
  let next: MockNextFunction;
  let mockCache: MockCache;
  let mockLogger: jest.Mock;

  beforeEach(() => {
    req = new MockRequest();
    res = new MockResponse();
    next = jest.fn();
    mockCache = new MockCache();
    mockLogger = jest.fn();

    // Reset Jest timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should pass through requests when circuit is closed', () => {
      // Arrange
      const middleware = circuitBreakerMiddleware('test-service');

      // Act
      middleware(req as unknown as Request, res as unknown as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.ended).toBe(false);
    });

    it('should call the next function with a wrapper function', () => {
      // Arrange
      const middleware = circuitBreakerMiddleware('test-service');

      // Act
      middleware(req as unknown as Request, res as unknown as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      const nextArg = next.mock.calls[0][0];
      expect(typeof nextArg).toBe('function');
    });

    it('should handle successful requests correctly', async () => {
      // Arrange
      const middleware = circuitBreakerMiddleware('test-service');

      // Act
      middleware(req as unknown as Request, res as unknown as Response, next);
      
      // Get the next wrapper function
      const nextWrapper = next.mock.calls[0][0];
      
      // Simulate successful request
      await nextWrapper();

      // Assert
      const metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics).not.toBeNull();
      expect(metrics?.successCount).toBe(1);
      expect(metrics?.failureCount).toBe(0);
      expect(metrics?.state).toBe('CLOSED');
    });

    it('should handle failed requests correctly', async () => {
      // Arrange
      const middleware = circuitBreakerMiddleware('test-service', {
        failureThreshold: 3,
        isRetryable: () => false, // Disable retry for this test
      });

      // Act
      middleware(req as unknown as Request, res as unknown as Response, next);
      
      // Get the next wrapper function
      const nextWrapper = next.mock.calls[0][0];
      
      // Simulate failed request
      const error = new Error('Test error');
      await nextWrapper(error);

      // Assert
      const metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics).not.toBeNull();
      expect(metrics?.successCount).toBe(0);
      expect(metrics?.failureCount).toBe(1);
      expect(metrics?.consecutiveFailures).toBe(1);
      expect(metrics?.state).toBe('CLOSED'); // Still closed because we're below threshold
      expect(next).toHaveBeenCalledWith(error); // Error passed to next middleware
    });
  });

  describe('Circuit State Transitions', () => {
    it('should open the circuit after reaching the failure threshold', async () => {
      // Arrange
      const failureThreshold = 3;
      const middleware = circuitBreakerMiddleware('test-service', {
        failureThreshold,
        isRetryable: () => false, // Disable retry for this test
        logger: mockLogger,
      });

      // Act - Simulate multiple failed requests
      for (let i = 0; i < failureThreshold; i++) {
        middleware(req as unknown as Request, res as unknown as Response, next);
        const nextWrapper = next.mock.calls[i][0];
        await nextWrapper(new Error(`Test error ${i}`));
      }

      // Assert
      const metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics).not.toBeNull();
      expect(metrics?.state).toBe('OPEN');
      expect(metrics?.consecutiveFailures).toBe(failureThreshold);
      expect(metrics?.lastOpenTimestamp).not.toBeNull();
      
      // Verify logger was called with circuit open message
      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('Circuit OPENED'),
        expect.anything()
      );
    });

    it('should reject requests when circuit is open', async () => {
      // Arrange
      const failureThreshold = 3;
      const middleware = circuitBreakerMiddleware('test-service', {
        failureThreshold,
        isRetryable: () => false, // Disable retry for this test
      });

      // Open the circuit
      for (let i = 0; i < failureThreshold; i++) {
        middleware(req as unknown as Request, res as unknown as Response, next);
        const nextWrapper = next.mock.calls[i][0];
        await nextWrapper(new Error(`Test error ${i}`));
      }

      // Reset mocks
      next.mockClear();
      res = new MockResponse();

      // Act - Try another request when circuit is open
      middleware(req as unknown as Request, res as unknown as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0];
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      
      // Check metrics
      const metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics?.rejectedCount).toBe(1);
    });

    it('should transition to half-open state after reset timeout', async () => {
      // Arrange
      const failureThreshold = 3;
      const resetTimeout = 5000; // 5 seconds
      const middleware = circuitBreakerMiddleware('test-service', {
        failureThreshold,
        resetTimeout,
        isRetryable: () => false, // Disable retry for this test
        logger: mockLogger,
      });

      // Open the circuit
      for (let i = 0; i < failureThreshold; i++) {
        middleware(req as unknown as Request, res as unknown as Response, next);
        const nextWrapper = next.mock.calls[i][0];
        await nextWrapper(new Error(`Test error ${i}`));
      }

      // Reset mocks
      next.mockClear();
      mockLogger.mockClear();
      res = new MockResponse();

      // Act - Advance time past the reset timeout
      jest.advanceTimersByTime(resetTimeout + 100);

      // Make another request
      middleware(req as unknown as Request, res as unknown as Response, next);

      // Assert
      const metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics?.state).toBe('HALF_OPEN');
      expect(metrics?.lastHalfOpenTimestamp).not.toBeNull();
      
      // Verify logger was called with half-open message
      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('Circuit HALF-OPENED'),
        undefined
      );
    });

    it('should close the circuit after successful requests in half-open state', async () => {
      // Arrange
      const failureThreshold = 3;
      const resetTimeout = 5000; // 5 seconds
      const middleware = circuitBreakerMiddleware('test-service', {
        failureThreshold,
        resetTimeout,
        isRetryable: () => false, // Disable retry for this test
        logger: mockLogger,
      });

      // Open the circuit
      for (let i = 0; i < failureThreshold; i++) {
        middleware(req as unknown as Request, res as unknown as Response, next);
        const nextWrapper = next.mock.calls[i][0];
        await nextWrapper(new Error(`Test error ${i}`));
      }

      // Advance time to transition to half-open
      jest.advanceTimersByTime(resetTimeout + 100);

      // Reset mocks
      next.mockClear();
      mockLogger.mockClear();
      res = new MockResponse();

      // Make successful requests in half-open state
      for (let i = 0; i < failureThreshold; i++) {
        middleware(req as unknown as Request, res as unknown as Response, next);
        const nextWrapper = next.mock.calls[i][0];
        await nextWrapper(); // Successful request
      }

      // Assert
      const metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics?.state).toBe('CLOSED');
      expect(metrics?.lastClosedTimestamp).not.toBeNull();
      expect(metrics?.consecutiveSuccesses).toBe(0); // Reset after closing
      
      // Verify logger was called with circuit closed message
      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('Circuit CLOSED'),
        undefined
      );
    });

    it('should immediately open the circuit if a request fails in half-open state', async () => {
      // Arrange
      const failureThreshold = 3;
      const resetTimeout = 5000; // 5 seconds
      const middleware = circuitBreakerMiddleware('test-service', {
        failureThreshold,
        resetTimeout,
        isRetryable: () => false, // Disable retry for this test
        logger: mockLogger,
      });

      // Open the circuit
      for (let i = 0; i < failureThreshold; i++) {
        middleware(req as unknown as Request, res as unknown as Response, next);
        const nextWrapper = next.mock.calls[i][0];
        await nextWrapper(new Error(`Test error ${i}`));
      }

      // Advance time to transition to half-open
      jest.advanceTimersByTime(resetTimeout + 100);

      // Reset mocks
      next.mockClear();
      mockLogger.mockClear();
      res = new MockResponse();

      // Make a failed request in half-open state
      middleware(req as unknown as Request, res as unknown as Response, next);
      const nextWrapper = next.mock.calls[0][0];
      await nextWrapper(new Error('Failed in half-open state'));

      // Assert
      const metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics?.state).toBe('OPEN');
      expect(metrics?.lastOpenTimestamp).not.toBeNull();
      
      // Verify logger was called with circuit open message
      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('Circuit OPENED'),
        expect.anything()
      );
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry failed requests up to the configured limit', async () => {
      // Arrange
      const maxRetries = 3;
      const middleware = circuitBreakerMiddleware('test-service', {
        maxRetries,
        retryBaseDelay: 100,
        isRetryable: () => true,
        logger: mockLogger,
      });

      // Act
      middleware(req as unknown as Request, res as unknown as Response, next);
      const nextWrapper = next.mock.calls[0][0];
      await nextWrapper(new Error('Retryable error'));

      // Fast-forward through all retry delays
      for (let i = 0; i < maxRetries; i++) {
        jest.runAllTimers();
      }

      // Assert
      const metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics?.retryCount).toBe(maxRetries);
      
      // Verify logger was called with retry messages
      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('Retrying request'),
        expect.anything()
      );
    });

    it('should use exponential backoff for retries', async () => {
      // Arrange
      const middleware = circuitBreakerMiddleware('test-service', {
        maxRetries: 3,
        retryBaseDelay: 100,
        isRetryable: () => true,
        logger: mockLogger,
      });

      // Act
      middleware(req as unknown as Request, res as unknown as Response, next);
      const nextWrapper = next.mock.calls[0][0];
      await nextWrapper(new Error('Retryable error'));

      // Assert - Check that the retry delay increases exponentially
      // We can't directly test the exact delay values due to the random jitter,
      // but we can verify the log messages contain increasing delay values
      const logCalls = mockLogger.mock.calls.filter(call => 
        call[0].includes('Retrying request')
      );
      
      // Extract delay values from log messages
      const delayValues = logCalls.map(call => {
        const match = call[0].match(/after (\d+)ms/);
        return match ? parseInt(match[1], 10) : 0;
      });
      
      // Verify delays increase (allowing for jitter)
      for (let i = 1; i < delayValues.length; i++) {
        expect(delayValues[i]).toBeGreaterThan(delayValues[i-1]);
      }
    });

    it('should only retry errors that match the isRetryable predicate', async () => {
      // Arrange
      const isRetryable = jest.fn(error => error.message.includes('retryable'));
      const middleware = circuitBreakerMiddleware('test-service', {
        maxRetries: 3,
        retryBaseDelay: 100,
        isRetryable,
        logger: mockLogger,
      });

      // Act - Non-retryable error
      middleware(req as unknown as Request, res as unknown as Response, next);
      const nextWrapper1 = next.mock.calls[0][0];
      await nextWrapper1(new Error('Non-retryable error'));

      // Reset mocks
      next.mockClear();
      mockLogger.mockClear();
      res = new MockResponse();

      // Act - Retryable error
      middleware(req as unknown as Request, res as unknown as Response, next);
      const nextWrapper2 = next.mock.calls[0][0];
      await nextWrapper2(new Error('This is retryable'));

      // Assert
      expect(isRetryable).toHaveBeenCalledTimes(2);
      const metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics?.retryCount).toBe(1); // Only the retryable error was retried
    });
  });

  describe('Fallback Mechanism', () => {
    it('should use the provided fallback function when circuit is open', async () => {
      // Arrange
      const fallback = jest.fn((req, res, next) => {
        res.status(503).json({ message: 'Fallback response' });
      });

      const middleware = circuitBreakerMiddleware('test-service', {
        failureThreshold: 3,
        isRetryable: () => false,
        fallback,
      });

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        middleware(req as unknown as Request, res as unknown as Response, next);
        const nextWrapper = next.mock.calls[i][0];
        await nextWrapper(new Error(`Test error ${i}`));
      }

      // Reset mocks
      next.mockClear();
      res = new MockResponse();

      // Act - Try another request when circuit is open
      middleware(req as unknown as Request, res as unknown as Response, next);

      // Assert
      expect(fallback).toHaveBeenCalled();
      expect(res.statusCode).toBe(503);
      expect(res.body).toEqual({ message: 'Fallback response' });
      expect(next).not.toHaveBeenCalled(); // Next should not be called when fallback is used
    });

    it('should use cached responses for fallback when available', async () => {
      // Arrange
      const getCacheKey = jest.fn(req => `test-${req.params.id}`);
      const middleware = circuitBreakerMiddleware('test-service', {
        failureThreshold: 3,
        isRetryable: () => false,
        getCacheKey,
        cache: mockCache,
        cacheTtl: 60000,
      });

      // Set up request with params
      req.params = { id: '123' };

      // Store a response in the cache
      const cachedResponse = {
        body: { data: 'Cached response' },
        headers: { 'content-type': 'application/json' },
        status: 200,
        timestamp: Date.now(),
      };
      await mockCache.set('test-123', cachedResponse);

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        middleware(req as unknown as Request, res as unknown as Response, next);
        const nextWrapper = next.mock.calls[i][0];
        await nextWrapper(new Error(`Test error ${i}`));
      }

      // Reset mocks
      next.mockClear();
      res = new MockResponse();

      // Act - Try another request when circuit is open
      middleware(req as unknown as Request, res as unknown as Response, next);

      // Assert
      expect(getCacheKey).toHaveBeenCalledWith(req);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ data: 'Cached response' });
      expect(next).not.toHaveBeenCalled(); // Next should not be called when fallback is used
    });

    it('should cache successful responses for future fallback', async () => {
      // Arrange
      const getCacheKey = jest.fn(req => `test-${req.params.id}`);
      const middleware = circuitBreakerMiddleware('test-service', {
        failureThreshold: 3,
        isRetryable: () => false,
        getCacheKey,
        cacheTtl: 60000,
      });

      // Set up request with params
      req.params = { id: '123' };

      // Act - Make a successful request
      middleware(req as unknown as Request, res as unknown as Response, next);
      const nextWrapper = next.mock.calls[0][0];
      
      // Simulate successful response
      res.status(200).json({ data: 'Success response' });
      await nextWrapper();

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        middleware(req as unknown as Request, res as unknown as Response, next);
        const nextWrapper = next.mock.calls[i+1][0];
        await nextWrapper(new Error(`Test error ${i}`));
      }

      // Reset mocks
      next.mockClear();
      res = new MockResponse();

      // Act - Try another request when circuit is open
      middleware(req as unknown as Request, res as unknown as Response, next);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ data: 'Success response' });
    });
  });

  describe('Metrics Collection', () => {
    it('should track success and failure counts', async () => {
      // Arrange
      const middleware = circuitBreakerMiddleware('test-service', {
        isRetryable: () => false,
      });

      // Act - Make some successful and failed requests
      for (let i = 0; i < 5; i++) {
        middleware(req as unknown as Request, res as unknown as Response, next);
        const nextWrapper = next.mock.calls[i][0];
        
        if (i % 2 === 0) {
          // Successful request
          await nextWrapper();
        } else {
          // Failed request
          await nextWrapper(new Error(`Test error ${i}`));
        }
      }

      // Assert
      const metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics?.successCount).toBe(3); // 0, 2, 4
      expect(metrics?.failureCount).toBe(2); // 1, 3
      expect(metrics?.failureRate).toBeCloseTo(40); // 40%
    });

    it('should track state transition timestamps', async () => {
      // Arrange
      const failureThreshold = 3;
      const resetTimeout = 5000;
      const middleware = circuitBreakerMiddleware('test-service', {
        failureThreshold,
        resetTimeout,
        isRetryable: () => false,
      });

      // Initial state
      let metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics?.lastClosedTimestamp).not.toBeNull();
      expect(metrics?.lastOpenTimestamp).toBeNull();
      expect(metrics?.lastHalfOpenTimestamp).toBeNull();

      // Open the circuit
      for (let i = 0; i < failureThreshold; i++) {
        middleware(req as unknown as Request, res as unknown as Response, next);
        const nextWrapper = next.mock.calls[i][0];
        await nextWrapper(new Error(`Test error ${i}`));
      }

      // Check open state timestamp
      metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics?.lastOpenTimestamp).not.toBeNull();
      const openTimestamp = metrics?.lastOpenTimestamp;

      // Advance time to transition to half-open
      jest.advanceTimersByTime(resetTimeout + 100);

      // Make a request to trigger half-open state
      middleware(req as unknown as Request, res as unknown as Response, next);

      // Check half-open state timestamp
      metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics?.lastHalfOpenTimestamp).not.toBeNull();
      expect(metrics?.lastHalfOpenTimestamp).toBeGreaterThan(openTimestamp!);

      // Make successful requests to close the circuit
      for (let i = 0; i < failureThreshold; i++) {
        const nextIndex = failureThreshold + 1 + i;
        const nextWrapper = next.mock.calls[nextIndex][0];
        await nextWrapper(); // Successful request
      }

      // Check closed state timestamp
      metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics?.lastClosedTimestamp).not.toBeNull();
      expect(metrics?.lastClosedTimestamp).toBeGreaterThan(metrics?.lastHalfOpenTimestamp!);
    });

    it('should track rejected requests when circuit is open', async () => {
      // Arrange
      const middleware = circuitBreakerMiddleware('test-service', {
        failureThreshold: 3,
        isRetryable: () => false,
      });

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        middleware(req as unknown as Request, res as unknown as Response, next);
        const nextWrapper = next.mock.calls[i][0];
        await nextWrapper(new Error(`Test error ${i}`));
      }

      // Reset mocks
      next.mockClear();

      // Make multiple requests when circuit is open
      for (let i = 0; i < 5; i++) {
        res = new MockResponse();
        middleware(req as unknown as Request, res as unknown as Response, next);
      }

      // Assert
      const metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics?.rejectedCount).toBe(5);
    });
  });

  describe('Configuration Options', () => {
    it('should respect the shouldApply option', async () => {
      // Arrange
      const shouldApply = jest.fn(req => req.url.includes('/api/'));
      const middleware = circuitBreakerMiddleware('test-service', {
        shouldApply,
      });

      // Act - Request that should be processed by circuit breaker
      req.url = '/api/test';
      middleware(req as unknown as Request, res as unknown as Response, next);

      // Assert
      expect(shouldApply).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalled();

      // Reset mocks
      next.mockClear();
      shouldApply.mockClear();

      // Act - Request that should bypass circuit breaker
      req.url = '/public/test';
      middleware(req as unknown as Request, res as unknown as Response, next);

      // Assert
      expect(shouldApply).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeUndefined(); // No wrapper function
    });

    it('should use the provided health check function', async () => {
      // Arrange
      const healthCheck = jest.fn().mockResolvedValue(true);
      const middleware = circuitBreakerMiddleware('test-service', {
        failureThreshold: 3,
        resetTimeout: 5000,
        healthCheck,
        isRetryable: () => false,
      });

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        middleware(req as unknown as Request, res as unknown as Response, next);
        const nextWrapper = next.mock.calls[i][0];
        await nextWrapper(new Error(`Test error ${i}`));
      }

      // Advance time to trigger health check
      jest.advanceTimersByTime(5000 + 100);

      // Assert
      expect(healthCheck).toHaveBeenCalled();
      const metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics?.state).toBe('HALF_OPEN'); // Should transition to half-open because health check passed

      // Reset mocks and change health check to fail
      healthCheck.mockReset().mockResolvedValue(false);
      next.mockClear();

      // Open the circuit again
      for (let i = 0; i < 3; i++) {
        middleware(req as unknown as Request, res as unknown as Response, next);
        const nextWrapper = next.mock.calls[i][0];
        await nextWrapper(new Error(`Test error ${i}`));
      }

      // Advance time to trigger health check
      jest.advanceTimersByTime(5000 + 100);

      // Assert
      expect(healthCheck).toHaveBeenCalled();
      const updatedMetrics = getCircuitBreakerMetrics(middleware);
      expect(updatedMetrics?.state).toBe('OPEN'); // Should remain open because health check failed
    });

    it('should handle request timeouts', async () => {
      // Arrange
      const requestTimeout = 1000; // 1 second
      const middleware = circuitBreakerMiddleware('test-service', {
        requestTimeout,
        isRetryable: () => false,
      });

      // Act
      middleware(req as unknown as Request, res as unknown as Response, next);
      
      // Simulate timeout by advancing time
      jest.advanceTimersByTime(requestTimeout + 100);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Function)); // First call with wrapper
      
      // Get the next wrapper function
      const nextWrapper = next.mock.calls[0][0];
      
      // The timeout should have called the wrapper with an error
      expect(nextWrapper).toHaveBeenCalledWith(expect.any(AppException));
      
      const error = nextWrapper.mock.calls[0][0];
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe('REQUEST_TIMEOUT');
      
      // Check metrics
      const metrics = getCircuitBreakerMetrics(middleware);
      expect(metrics?.timeoutCount).toBe(1);
    });
  });
});