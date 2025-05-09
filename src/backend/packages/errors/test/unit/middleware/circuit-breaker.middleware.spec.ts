/**
 * @file circuit-breaker.middleware.spec.ts
 * @description Unit tests for the circuit breaker middleware that validate its ability to detect
 * and handle failures when interacting with external services.
 */

import { Request, Response, NextFunction } from 'express';
import {
  circuitBreakerMiddleware,
  circuitBreakerWithCache,
  circuitBreakerWithDegradation,
  getCircuitBreaker,
  getAllCircuitBreakers,
  CircuitBreakerOptions
} from '../../../src/middleware/circuit-breaker.middleware';
import { BaseError, ErrorType, JourneyContext } from '../../../src/base';
import { ErrorRecoveryStrategy } from '../../../src/types';
import {
  createMiddlewareMocks,
  createMockRequest,
  createMockResponse,
  createMockNext,
  ResponseTracking,
  assertErrorResponse
} from './express-mocks';

// Helper to create a test error
const createTestError = (type: ErrorType = ErrorType.EXTERNAL) => {
  return new BaseError(
    'Test error',
    type,
    'TEST_ERROR',
    { journey: JourneyContext.SYSTEM, timestamp: new Date() },
    { testData: 'test' },
    'Test user message'
  );
};

// Mock implementations
const mockLogger = jest.fn();
const mockMetricsRecorder = jest.fn();

// Default test options
const getTestOptions = (overrides: Partial<CircuitBreakerOptions> = {}): CircuitBreakerOptions => ({
  name: 'test-circuit',
  logger: mockLogger,
  metricsRecorder: mockMetricsRecorder,
  ...overrides
});

describe('Circuit Breaker Middleware', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all circuit breakers
    const allCircuits = getAllCircuitBreakers();
    Object.keys(allCircuits).forEach(name => {
      const circuit = getCircuitBreaker(name);
      if (circuit) {
        circuit.reset();
      }
    });
    
    // Reset Date.now mock if it exists
    if (jest.isMockFunction(Date.now)) {
      (Date.now as jest.Mock).mockRestore();
    }
  });
  
  describe('Basic Functionality', () => {
    test('should be in closed state initially', async () => {
      // Arrange
      const options = getTestOptions();
      const middleware = circuitBreakerMiddleware(options);
      const { req, res, next } = createMiddlewareMocks();
      
      // Act
      await middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit).toBeDefined();
      expect(circuit?.state).toBe('closed');
      expect(circuit?.failures).toBe(0);
    });
    
    test('should track successful requests', async () => {
      // Arrange
      const options = getTestOptions();
      const middleware = circuitBreakerMiddleware(options);
      const { req, res, next } = createMiddlewareMocks();
      
      // Act
      await middleware(req, res, next);
      res.status(200).json({ success: true });
      
      // Assert
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit).toBeDefined();
      expect(circuit?.state).toBe('closed');
      expect(mockMetricsRecorder).toHaveBeenCalledWith(
        'circuit_breaker_success',
        1,
        expect.objectContaining({ circuit_name: 'test-circuit' })
      );
    });
    
    test('should track failed requests', async () => {
      // Arrange
      const options = getTestOptions();
      const middleware = circuitBreakerMiddleware(options);
      const { req, res, next } = createMiddlewareMocks();
      const error = createTestError();
      
      // Act
      await middleware(req, res, next);
      next(error);
      
      // Assert
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit).toBeDefined();
      expect(circuit?.failures).toBe(1);
      expect(mockMetricsRecorder).toHaveBeenCalledWith(
        'circuit_breaker_failure',
        1,
        expect.objectContaining({ circuit_name: 'test-circuit' })
      );
    });
    
    test('should open circuit after exceeding failure threshold', async () => {
      // Arrange
      const options = getTestOptions({ failureThreshold: 3 });
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Act - Trigger 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Assert
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit).toBeDefined();
      expect(circuit?.state).toBe('open');
      expect(circuit?.failures).toBe(3);
      expect(mockLogger).toHaveBeenCalledWith(
        'State changed from closed to open',
        expect.objectContaining({ circuitName: 'test-circuit' })
      );
    });
    
    test('should use fallback when circuit is open', async () => {
      // Arrange
      const options = getTestOptions({ failureThreshold: 3 });
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Act - Try a new request when circuit is open
      const { req, res, tracking, next } = createMiddlewareMocks();
      await middleware(req, res, next);
      
      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(tracking.statusCode).toBe(503);
      expect(tracking.body).toHaveProperty('error');
      expect(tracking.body.error).toHaveProperty('code', 'CIRCUIT_BREAKER_OPEN');
    });
    
    test('should transition to half-open state after reset timeout', async () => {
      // Arrange
      const resetTimeout = 1000; // 1 second
      const options = getTestOptions({ failureThreshold: 3, resetTimeout });
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      const mockNow = jest.fn();
      Date.now = mockNow;
      
      // First return current time
      mockNow.mockReturnValueOnce(originalNow());
      // Then return a time after the reset timeout
      mockNow.mockReturnValueOnce(originalNow() + resetTimeout + 100);
      
      // Act - Try a new request after reset timeout
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit).toBeDefined();
      expect(circuit?.state).toBe('half-open');
      
      // Restore Date.now
      Date.now = originalNow;
    });
    
    test('should close circuit after successful test requests in half-open state', async () => {
      // Arrange
      const resetTimeout = 1000; // 1 second
      const successThreshold = 2; // 2 successful requests to close
      const options = getTestOptions({ 
        failureThreshold: 3, 
        resetTimeout,
        successThreshold
      });
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      const mockNow = jest.fn();
      Date.now = mockNow;
      mockNow.mockReturnValue(originalNow() + resetTimeout + 100);
      
      // Act - Send successful test requests in half-open state
      for (let i = 0; i < successThreshold; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        res.status(200).json({ success: true });
      }
      
      // Assert
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit).toBeDefined();
      expect(circuit?.state).toBe('closed');
      expect(mockLogger).toHaveBeenCalledWith(
        'State changed from half-open to closed',
        expect.objectContaining({ circuitName: 'test-circuit' })
      );
      
      // Restore Date.now
      Date.now = originalNow;
    });
    
    test('should reopen circuit on failure in half-open state', async () => {
      // Arrange
      const resetTimeout = 1000; // 1 second
      const options = getTestOptions({ failureThreshold: 3, resetTimeout });
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      const mockNow = jest.fn();
      Date.now = mockNow;
      mockNow.mockReturnValue(originalNow() + resetTimeout + 100);
      
      // Act - Send a failing test request in half-open state
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req, res, next);
      next(error);
      
      // Assert
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit).toBeDefined();
      expect(circuit?.state).toBe('open');
      expect(mockLogger).toHaveBeenCalledWith(
        'State changed from half-open to open',
        expect.objectContaining({ circuitName: 'test-circuit' })
      );
      
      // Restore Date.now
      Date.now = originalNow;
    });
  });
  
  describe('Configuration Options', () => {
    test('should use custom failure threshold', async () => {
      // Arrange
      const failureThreshold = 5;
      const options = getTestOptions({ failureThreshold });
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Act - Trigger failures up to threshold - 1
      for (let i = 0; i < failureThreshold - 1; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Assert - Circuit should still be closed
      let circuit = getCircuitBreaker('test-circuit');
      expect(circuit).toBeDefined();
      expect(circuit?.state).toBe('closed');
      
      // Act - Trigger one more failure to reach threshold
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req, res, next);
      next(error);
      
      // Assert - Circuit should now be open
      circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('open');
    });
    
    test('should use custom reset timeout', async () => {
      // Arrange
      const resetTimeout = 2000; // 2 seconds
      const options = getTestOptions({ failureThreshold: 3, resetTimeout });
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      const mockNow = jest.fn();
      Date.now = mockNow;
      
      // Act - Try a new request after half the reset timeout
      mockNow.mockReturnValue(originalNow() + resetTimeout / 2);
      let { req, res, tracking, next } = createMiddlewareMocks();
      await middleware(req, res, next);
      
      // Assert - Circuit should still be open
      expect(tracking.statusCode).toBe(503);
      
      // Act - Try a new request after the full reset timeout
      mockNow.mockReturnValue(originalNow() + resetTimeout + 100);
      ({ req, res, next } = createMiddlewareMocks());
      await middleware(req, res, next);
      
      // Assert - Circuit should now be half-open
      expect(next).toHaveBeenCalled();
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('half-open');
      
      // Restore Date.now
      Date.now = originalNow;
    });
    
    test('should use custom success threshold', async () => {
      // Arrange
      const resetTimeout = 1000; // 1 second
      const successThreshold = 4; // 4 successful requests to close
      const options = getTestOptions({ 
        failureThreshold: 3, 
        resetTimeout,
        successThreshold
      });
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      const mockNow = jest.fn();
      Date.now = mockNow;
      mockNow.mockReturnValue(originalNow() + resetTimeout + 100);
      
      // Act - Send successful test requests up to threshold - 1
      for (let i = 0; i < successThreshold - 1; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        res.status(200).json({ success: true });
      }
      
      // Assert - Circuit should still be half-open
      let circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('half-open');
      
      // Act - Send one more successful request to reach threshold
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req, res, next);
      res.status(200).json({ success: true });
      
      // Assert - Circuit should now be closed
      circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('closed');
      
      // Restore Date.now
      Date.now = originalNow;
    });
    
    test('should use custom isFailure function', async () => {
      // Arrange
      const isFailure = jest.fn((error: Error) => {
        // Only count errors with message containing 'count-me'
        return error.message.includes('count-me');
      });
      
      const options = getTestOptions({ 
        failureThreshold: 3,
        isFailure
      });
      const middleware = circuitBreakerMiddleware(options);
      
      // Act - Trigger errors that should NOT count as failures
      for (let i = 0; i < 5; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(new Error('ignore-me'));
      }
      
      // Assert - Circuit should still be closed
      let circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('closed');
      expect(isFailure).toHaveBeenCalledTimes(5);
      
      // Act - Trigger errors that SHOULD count as failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(new Error('count-me'));
      }
      
      // Assert - Circuit should now be open
      circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('open');
    });
    
    test('should use custom fallback function', async () => {
      // Arrange
      const customFallback = jest.fn((req: Request, res: Response, next: NextFunction) => {
        res.status(418).json({ message: 'I\'m a teapot' });
      });
      
      const options = getTestOptions({ 
        failureThreshold: 3,
        fallback: customFallback
      });
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Act - Try a new request when circuit is open
      const { req, res, tracking, next } = createMiddlewareMocks();
      await middleware(req, res, next);
      
      // Assert
      expect(customFallback).toHaveBeenCalledTimes(1);
      expect(tracking.statusCode).toBe(418);
      expect(tracking.body).toEqual({ message: 'I\'m a teapot' });
    });
    
    test('should detect timeouts based on requestTimeout option', async () => {
      // Arrange
      jest.useFakeTimers();
      const requestTimeout = 500; // 500ms timeout
      const options = getTestOptions({ requestTimeout });
      const middleware = circuitBreakerMiddleware(options);
      
      // Act - Start a request but don't complete it
      const { req, res, tracking, next } = createMiddlewareMocks();
      middleware(req, res, next); // Don't await to simulate hanging request
      
      // Fast-forward time past the timeout
      jest.advanceTimersByTime(requestTimeout + 100);
      
      // Assert
      expect(tracking.statusCode).toBe(504);
      expect(tracking.body).toHaveProperty('error');
      expect(tracking.body.error).toHaveProperty('code', 'REQUEST_TIMEOUT');
      
      // Cleanup
      jest.useRealTimers();
    });
  });
  
  describe('Fallback Mechanisms', () => {
    test('should use cached data fallback when available', async () => {
      // Arrange
      const cacheProvider = jest.fn(async (key: string) => {
        if (key === 'test-key') {
          return { cachedData: 'test-data' };
        }
        return null;
      });
      
      const cacheKeyGenerator = jest.fn((req: Request) => {
        return 'test-key';
      });
      
      const middleware = circuitBreakerWithCache(
        getTestOptions({ failureThreshold: 3 }),
        cacheProvider,
        cacheKeyGenerator
      );
      
      const error = createTestError();
      
      // Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Act - Try a new request when circuit is open
      const { req, res, tracking, next } = createMiddlewareMocks();
      await middleware(req, res, next);
      
      // Assert
      expect(cacheKeyGenerator).toHaveBeenCalledWith(req);
      expect(cacheProvider).toHaveBeenCalledWith('test-key');
      expect(tracking.headers['x-circuit-breaker-fallback']).toBe('cached');
      expect(tracking.body).toEqual({ cachedData: 'test-data' });
    });
    
    test('should handle missing cache data appropriately', async () => {
      // Arrange
      const cacheProvider = jest.fn(async () => null); // No cached data
      const cacheKeyGenerator = jest.fn(() => 'test-key');
      
      const middleware = circuitBreakerWithCache(
        getTestOptions({ failureThreshold: 3 }),
        cacheProvider,
        cacheKeyGenerator
      );
      
      const error = createTestError();
      
      // Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Act - Try a new request when circuit is open
      const { req, res, tracking, next } = createMiddlewareMocks();
      await middleware(req, res, next);
      
      // Assert
      expect(tracking.statusCode).toBe(503);
      expect(tracking.body).toHaveProperty('error');
      expect(tracking.body.error).toHaveProperty('code', 'CIRCUIT_BREAKER_NO_CACHE');
      expect(tracking.body.error.details).toHaveProperty(
        'recoveryStrategy', 
        ErrorRecoveryStrategy.CACHED_DATA
      );
    });
    
    test('should use graceful degradation fallback', async () => {
      // Arrange
      const degradedHandler = jest.fn((req: Request, res: Response, next: NextFunction) => {
        res.status(200).json({ degraded: true, limitedFunctionality: true });
      });
      
      const middleware = circuitBreakerWithDegradation(
        getTestOptions({ failureThreshold: 3 }),
        degradedHandler
      );
      
      const error = createTestError();
      
      // Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Act - Try a new request when circuit is open
      const { req, res, tracking, next } = createMiddlewareMocks();
      await middleware(req, res, next);
      
      // Assert
      expect(degradedHandler).toHaveBeenCalledWith(req, res, next);
      expect(tracking.headers['x-circuit-breaker-fallback']).toBe('degraded');
      expect(tracking.body).toEqual({ degraded: true, limitedFunctionality: true });
    });
  });
  
  describe('Metrics and Logging', () => {
    test('should record state change metrics', async () => {
      // Arrange
      const options = getTestOptions({ failureThreshold: 3 });
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Act - Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Assert
      expect(mockMetricsRecorder).toHaveBeenCalledWith(
        'circuit_breaker_state',
        0, // 0 = closed
        expect.objectContaining({ circuit_name: 'test-circuit', state: 'closed' })
      );
      
      expect(mockMetricsRecorder).toHaveBeenCalledWith(
        'circuit_breaker_state',
        2, // 2 = open
        expect.objectContaining({ circuit_name: 'test-circuit', state: 'open' })
      );
    });
    
    test('should record failure metrics', async () => {
      // Arrange
      const options = getTestOptions();
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Act - Trigger a failure
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req, res, next);
      next(error);
      
      // Assert
      expect(mockMetricsRecorder).toHaveBeenCalledWith(
        'circuit_breaker_failure',
        1,
        expect.objectContaining({ circuit_name: 'test-circuit' })
      );
      
      expect(mockMetricsRecorder).toHaveBeenCalledWith(
        'circuit_breaker_failure_count',
        1,
        expect.objectContaining({ circuit_name: 'test-circuit' })
      );
    });
    
    test('should record success metrics', async () => {
      // Arrange
      const options = getTestOptions();
      const middleware = circuitBreakerMiddleware(options);
      
      // Act - Trigger a success
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req, res, next);
      res.status(200).json({ success: true });
      
      // Assert
      expect(mockMetricsRecorder).toHaveBeenCalledWith(
        'circuit_breaker_success',
        1,
        expect.objectContaining({ circuit_name: 'test-circuit' })
      );
    });
    
    test('should log state changes', async () => {
      // Arrange
      const options = getTestOptions({ failureThreshold: 3 });
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Act - Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Assert
      expect(mockLogger).toHaveBeenCalledWith(
        'State changed from closed to open',
        expect.objectContaining({ 
          circuitName: 'test-circuit',
          oldState: 'closed',
          newState: 'open',
          failures: 3
        })
      );
    });
  });
  
  describe('Health Checks', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    test('should start health check timer when circuit opens', async () => {
      // Arrange
      const healthCheck = jest.fn().mockResolvedValue(false);
      const healthCheckInterval = 1000; // 1 second
      
      const options = getTestOptions({ 
        failureThreshold: 3,
        healthCheck,
        healthCheckInterval
      });
      
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Act - Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Fast-forward time past the health check interval
      jest.advanceTimersByTime(healthCheckInterval + 100);
      
      // Assert
      expect(healthCheck).toHaveBeenCalledTimes(1);
    });
    
    test('should transition to half-open when health check passes', async () => {
      // Arrange
      const healthCheck = jest.fn()
        .mockResolvedValueOnce(false) // First check fails
        .mockResolvedValueOnce(true);  // Second check passes
      
      const healthCheckInterval = 1000; // 1 second
      
      const options = getTestOptions({ 
        failureThreshold: 3,
        healthCheck,
        healthCheckInterval
      });
      
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Act - Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Fast-forward time past the first health check interval
      jest.advanceTimersByTime(healthCheckInterval + 100);
      
      // Fast-forward time past the second health check interval
      jest.advanceTimersByTime(healthCheckInterval + 100);
      
      // Assert
      expect(healthCheck).toHaveBeenCalledTimes(2);
      expect(mockLogger).toHaveBeenCalledWith('Health check passed, transitioning to half-open state');
      
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('half-open');
    });
    
    test('should stop health check timer when circuit closes', async () => {
      // Arrange
      const healthCheck = jest.fn().mockResolvedValue(true);
      const healthCheckInterval = 1000; // 1 second
      const resetTimeout = 500; // 0.5 seconds
      
      const options = getTestOptions({ 
        failureThreshold: 3,
        healthCheck,
        healthCheckInterval,
        resetTimeout
      });
      
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Act - Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Fast-forward time past the health check interval
      jest.advanceTimersByTime(healthCheckInterval + 100);
      
      // Assert - Health check should have been called once
      expect(healthCheck).toHaveBeenCalledTimes(1);
      
      // Act - Reset the circuit manually
      const circuit = getCircuitBreaker('test-circuit');
      circuit?.reset();
      
      // Clear the mock to start fresh
      healthCheck.mockClear();
      
      // Fast-forward time past another health check interval
      jest.advanceTimersByTime(healthCheckInterval + 100);
      
      // Assert - Health check should not have been called again
      expect(healthCheck).not.toHaveBeenCalled();
    });
  });
  
  describe('Utility Functions', () => {
    test('should get circuit breaker by name', async () => {
      // Arrange
      const options = getTestOptions();
      const middleware = circuitBreakerMiddleware(options);
      
      // Initialize the circuit breaker
      const { req, res, next } = createMiddlewareMocks();
      await middleware(req, res, next);
      
      // Act
      const circuit = getCircuitBreaker('test-circuit');
      
      // Assert
      expect(circuit).toBeDefined();
      expect(circuit?.state).toBe('closed');
      expect(circuit?.failures).toBe(0);
      expect(typeof circuit?.reset).toBe('function');
    });
    
    test('should return undefined for non-existent circuit breaker', () => {
      // Act
      const circuit = getCircuitBreaker('non-existent-circuit');
      
      // Assert
      expect(circuit).toBeUndefined();
    });
    
    test('should get all circuit breakers', async () => {
      // Arrange
      const middleware1 = circuitBreakerMiddleware(getTestOptions({ name: 'circuit-1' }));
      const middleware2 = circuitBreakerMiddleware(getTestOptions({ name: 'circuit-2' }));
      
      // Initialize the circuit breakers
      const mocks1 = createMiddlewareMocks();
      const mocks2 = createMiddlewareMocks();
      await middleware1(mocks1.req, mocks1.res, mocks1.next);
      await middleware2(mocks2.req, mocks2.res, mocks2.next);
      
      // Act
      const circuits = getAllCircuitBreakers();
      
      // Assert
      expect(Object.keys(circuits)).toContain('circuit-1');
      expect(Object.keys(circuits)).toContain('circuit-2');
      expect(circuits['circuit-1'].state).toBe('closed');
      expect(circuits['circuit-2'].state).toBe('closed');
    });
    
    test('should reset circuit breaker state', async () => {
      // Arrange
      const options = getTestOptions({ failureThreshold: 3 });
      const middleware = circuitBreakerMiddleware(options);
      const error = createTestError();
      
      // Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        next(error);
      }
      
      // Verify circuit is open
      let circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('open');
      
      // Act - Reset the circuit
      circuit?.reset();
      
      // Assert
      circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('closed');
      expect(circuit?.failures).toBe(0);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle HTTP 5xx responses as failures', async () => {
      // Arrange
      const options = getTestOptions({ failureThreshold: 3 });
      const middleware = circuitBreakerMiddleware(options);
      
      // Act - Send requests with 5xx responses
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        res.status(500).json({ error: 'Internal Server Error' });
      }
      
      // Assert
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('open');
      expect(circuit?.failures).toBe(3);
    });
    
    test('should not count HTTP 4xx responses as failures', async () => {
      // Arrange
      const options = getTestOptions({ failureThreshold: 3 });
      const middleware = circuitBreakerMiddleware(options);
      
      // Act - Send requests with 4xx responses
      for (let i = 0; i < 5; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        res.status(400).json({ error: 'Bad Request' });
      }
      
      // Assert
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('closed');
      expect(circuit?.failures).toBe(0);
    });
    
    test('should count network errors as failures by default', async () => {
      // Arrange
      const options = getTestOptions({ failureThreshold: 3 });
      const middleware = circuitBreakerMiddleware(options);
      
      // Act - Trigger network errors
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        const networkError = new Error('ECONNREFUSED');
        next(networkError);
      }
      
      // Assert
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('open');
      expect(circuit?.failures).toBe(3);
    });
    
    test('should count timeout errors as failures by default', async () => {
      // Arrange
      const options = getTestOptions({ failureThreshold: 3 });
      const middleware = circuitBreakerMiddleware(options);
      
      // Act - Trigger timeout errors
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        const timeoutError = new Error('ETIMEDOUT');
        next(timeoutError);
      }
      
      // Assert
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('open');
      expect(circuit?.failures).toBe(3);
    });
    
    test('should count BaseError with EXTERNAL type as failures', async () => {
      // Arrange
      const options = getTestOptions({ failureThreshold: 3 });
      const middleware = circuitBreakerMiddleware(options);
      
      // Act - Trigger external errors
      for (let i = 0; i < 3; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        const externalError = createTestError(ErrorType.EXTERNAL);
        next(externalError);
      }
      
      // Assert
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('open');
      expect(circuit?.failures).toBe(3);
    });
    
    test('should not count BaseError with BUSINESS type as failures', async () => {
      // Arrange
      const options = getTestOptions({ failureThreshold: 3 });
      const middleware = circuitBreakerMiddleware(options);
      
      // Act - Trigger business errors
      for (let i = 0; i < 5; i++) {
        const { req, res, next } = createMiddlewareMocks();
        await middleware(req, res, next);
        const businessError = createTestError(ErrorType.BUSINESS);
        next(businessError);
      }
      
      // Assert
      const circuit = getCircuitBreaker('test-circuit');
      expect(circuit?.state).toBe('closed');
      expect(circuit?.failures).toBe(0);
    });
  });
});