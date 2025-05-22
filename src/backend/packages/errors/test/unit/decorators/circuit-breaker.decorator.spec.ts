import { Test } from '@nestjs/testing';
import { CircuitBreaker, CircuitState, getCircuitBreakerState, resetCircuitBreaker } from '../../../src/decorators/circuit-breaker.decorator';
import { ErrorType } from '../../../src/categories/error-types';
import { BaseError } from '../../../src/base';

// Mock for the OpenTelemetry API
jest.mock('@opentelemetry/api', () => {
  const mockSpan = {
    setAttribute: jest.fn(),
    setStatus: jest.fn(),
    recordException: jest.fn(),
    end: jest.fn(),
  };
  
  const mockTracer = {
    startSpan: jest.fn().mockReturnValue(mockSpan),
  };
  
  return {
    context: {
      active: jest.fn(),
    },
    trace: {
      getSpan: jest.fn(),
      getTracer: jest.fn().mockReturnValue(mockTracer),
    },
    SpanStatusCode: {
      OK: 'OK',
      ERROR: 'ERROR',
    },
  };
});

// Constants for testing
const CIRCUIT_BREAKER_CONFIG = {
  DEFAULT: {
    REQUEST_VOLUME_THRESHOLD: 5,
    ROLLING_WINDOW_MS: 60000,
    RESET_TIMEOUT_MS: 30000,
  },
};

/**
 * Mock service class with methods decorated with CircuitBreaker
 * for testing different circuit breaker scenarios
 */
class MockService {
  public callCount = 0;
  public shouldFail = false;
  public failureType: 'error' | 'exception' = 'error';
  
  // Method with default circuit breaker settings
  @CircuitBreaker()
  async defaultMethod(): Promise<string> {
    this.callCount++;
    
    if (this.shouldFail) {
      if (this.failureType === 'exception') {
        throw new BaseError(
          'Test exception',
          ErrorType.EXTERNAL,
          'TEST_001',
          { test: true }
        );
      } else {
        throw new Error('Test error');
      }
    }
    
    return 'success';
  }
  
  // Method with custom failure threshold
  @CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 500, // Short timeout for testing
  })
  async customThresholdMethod(): Promise<string> {
    this.callCount++;
    
    if (this.shouldFail) {
      throw new Error('Test error');
    }
    
    return 'success';
  }
  
  // Method with custom failure detection
  @CircuitBreaker({
    isFailure: (error) => error instanceof BaseError,
  })
  async customFailureDetectionMethod(): Promise<string> {
    this.callCount++;
    
    if (this.shouldFail) {
      if (this.failureType === 'exception') {
        throw new BaseError(
          'Test exception',
          ErrorType.EXTERNAL,
          'TEST_001',
          { test: true }
        );
      } else {
        throw new Error('Test error');
      }
    }
    
    return 'success';
  }
  
  // Method with fallback
  @CircuitBreaker({
    fallback: (error, ...args) => 'fallback result',
  })
  async withFallbackMethod(): Promise<string> {
    this.callCount++;
    
    if (this.shouldFail) {
      throw new Error('Test error');
    }
    
    return 'success';
  }
  
  // Method with state change notification
  @CircuitBreaker({
    onStateChange: jest.fn(),
  })
  async withStateChangeMethod(): Promise<string> {
    this.callCount++;
    
    if (this.shouldFail) {
      throw new Error('Test error');
    }
    
    return 'success';
  }
  
  // Reset call count for testing
  resetCallCount(): void {
    this.callCount = 0;
  }
}

describe('CircuitBreaker Decorator', () => {
  let service: MockService;
  
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [MockService],
    }).compile();
    
    service = moduleRef.get<MockService>(MockService);
    service.resetCallCount();
    service.shouldFail = false;
    
    // Reset all circuit breakers before each test
    resetCircuitBreaker(MockService.prototype, 'defaultMethod');
    resetCircuitBreaker(MockService.prototype, 'customThresholdMethod');
    resetCircuitBreaker(MockService.prototype, 'customFailureDetectionMethod');
    resetCircuitBreaker(MockService.prototype, 'withFallbackMethod');
    resetCircuitBreaker(MockService.prototype, 'withStateChangeMethod');
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('Basic Functionality', () => {
    it('should allow successful method calls', async () => {
      const result = await service.defaultMethod();
      
      expect(result).toBe('success');
      expect(service.callCount).toBe(1);
    });
    
    it('should propagate errors when circuit is closed', async () => {
      service.shouldFail = true;
      
      await expect(service.defaultMethod()).rejects.toThrow('Test error');
      expect(service.callCount).toBe(1);
    });
    
    it('should track circuit state', async () => {
      const state = getCircuitBreakerState(MockService.prototype, 'defaultMethod');
      
      expect(state).not.toBeNull();
      expect(state?.state).toBe(CircuitState.CLOSED);
      expect(state?.metrics.failureCount).toBe(0);
      expect(state?.metrics.totalRequests).toBe(0);
    });
  });
  
  describe('State Transitions', () => {
    it('should transition from CLOSED to OPEN when failure threshold is reached', async () => {
      service.shouldFail = true;
      
      // Call the method multiple times to reach the failure threshold
      for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.DEFAULT.REQUEST_VOLUME_THRESHOLD; i++) {
        await expect(service.defaultMethod()).rejects.toThrow();
      }
      
      const state = getCircuitBreakerState(MockService.prototype, 'defaultMethod');
      expect(state?.state).toBe(CircuitState.OPEN);
    });
    
    it('should respect custom failure threshold', async () => {
      service.shouldFail = true;
      
      // Call the method multiple times to reach the custom failure threshold (3)
      for (let i = 0; i < 3; i++) {
        await expect(service.customThresholdMethod()).rejects.toThrow();
      }
      
      const state = getCircuitBreakerState(MockService.prototype, 'customThresholdMethod');
      expect(state?.state).toBe(CircuitState.OPEN);
    });
    
    it('should transition from OPEN to HALF_OPEN after reset timeout', async () => {
      service.shouldFail = true;
      
      // Reach failure threshold to open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(service.customThresholdMethod()).rejects.toThrow();
      }
      
      // Verify circuit is open
      let state = getCircuitBreakerState(MockService.prototype, 'customThresholdMethod');
      expect(state?.state).toBe(CircuitState.OPEN);
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Next call should transition to HALF_OPEN
      service.shouldFail = false; // Make the call succeed
      await service.customThresholdMethod();
      
      state = getCircuitBreakerState(MockService.prototype, 'customThresholdMethod');
      expect(state?.state).toBe(CircuitState.HALF_OPEN);
    });
    
    it('should transition from HALF_OPEN to CLOSED after success threshold', async () => {
      service.shouldFail = true;
      
      // Reach failure threshold to open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(service.customThresholdMethod()).rejects.toThrow();
      }
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Make calls succeed to close the circuit
      service.shouldFail = false;
      
      // First successful call transitions to HALF_OPEN
      await service.customThresholdMethod();
      let state = getCircuitBreakerState(MockService.prototype, 'customThresholdMethod');
      expect(state?.state).toBe(CircuitState.HALF_OPEN);
      
      // Second successful call should close the circuit (default successThreshold is 2)
      await service.customThresholdMethod();
      state = getCircuitBreakerState(MockService.prototype, 'customThresholdMethod');
      expect(state?.state).toBe(CircuitState.CLOSED);
    });
    
    it('should transition from HALF_OPEN back to OPEN on failure', async () => {
      service.shouldFail = true;
      
      // Reach failure threshold to open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(service.customThresholdMethod()).rejects.toThrow();
      }
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // First call transitions to HALF_OPEN but fails
      await expect(service.customThresholdMethod()).rejects.toThrow();
      
      const state = getCircuitBreakerState(MockService.prototype, 'customThresholdMethod');
      expect(state?.state).toBe(CircuitState.OPEN);
    });
  });
  
  describe('Call Prevention', () => {
    it('should prevent method execution when circuit is open', async () => {
      service.shouldFail = true;
      
      // Open the circuit
      for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.DEFAULT.REQUEST_VOLUME_THRESHOLD; i++) {
        await expect(service.defaultMethod()).rejects.toThrow();
      }
      
      // Reset call count to verify method is not called
      service.resetCallCount();
      
      // Attempt to call method when circuit is open
      await expect(service.defaultMethod()).rejects.toThrow('Circuit breaker is open');
      
      // Verify method was not executed
      expect(service.callCount).toBe(0);
    });
    
    it('should return fallback result when circuit is open and fallback is provided', async () => {
      service.shouldFail = true;
      
      // Open the circuit
      for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.DEFAULT.REQUEST_VOLUME_THRESHOLD; i++) {
        await expect(service.withFallbackMethod()).rejects.toThrow();
      }
      
      // Reset call count to verify method is not called
      service.resetCallCount();
      
      // Attempt to call method when circuit is open
      const result = await service.withFallbackMethod();
      
      // Verify fallback was used
      expect(result).toBe('fallback result');
      expect(service.callCount).toBe(0);
    });
  });
  
  describe('Custom Failure Detection', () => {
    it('should only count specific errors as failures based on isFailure function', async () => {
      service.shouldFail = true;
      service.failureType = 'error'; // Regular Error, not BaseError
      
      // Call method multiple times with regular Error (should not count as failures)
      for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.DEFAULT.REQUEST_VOLUME_THRESHOLD; i++) {
        await expect(service.customFailureDetectionMethod()).rejects.toThrow();
      }
      
      // Circuit should still be closed because regular errors don't count as failures
      let state = getCircuitBreakerState(MockService.prototype, 'customFailureDetectionMethod');
      expect(state?.state).toBe(CircuitState.CLOSED);
      
      // Switch to BaseError (should count as failures)
      service.failureType = 'exception';
      
      // Call method multiple times with BaseError
      for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.DEFAULT.REQUEST_VOLUME_THRESHOLD; i++) {
        await expect(service.customFailureDetectionMethod()).rejects.toThrow();
      }
      
      // Circuit should now be open
      state = getCircuitBreakerState(MockService.prototype, 'customFailureDetectionMethod');
      expect(state?.state).toBe(CircuitState.OPEN);
    });
  });
  
  describe('State Change Notification', () => {
    it('should call onStateChange when circuit state changes', async () => {
      // Get the mock function from the decorator config
      const mockOnStateChange = (service.withStateChangeMethod as any).__proto__.constructor.prototype.withStateChangeMethod.onStateChange;
      
      service.shouldFail = true;
      
      // Call the method multiple times to reach the failure threshold
      for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.DEFAULT.REQUEST_VOLUME_THRESHOLD; i++) {
        await expect(service.withStateChangeMethod()).rejects.toThrow();
      }
      
      // Verify onStateChange was called with correct states
      expect(mockOnStateChange).toHaveBeenCalledWith(CircuitState.CLOSED, CircuitState.OPEN);
    });
  });
  
  describe('Metrics and Monitoring', () => {
    it('should track total requests and failures', async () => {
      // Make some successful calls
      await service.defaultMethod();
      await service.defaultMethod();
      
      // Make some failed calls
      service.shouldFail = true;
      await expect(service.defaultMethod()).rejects.toThrow();
      await expect(service.defaultMethod()).rejects.toThrow();
      
      // Check metrics
      const state = getCircuitBreakerState(MockService.prototype, 'defaultMethod');
      expect(state?.metrics.totalRequests).toBe(4);
      expect(state?.metrics.totalFailures).toBe(2);
    });
    
    it('should reset failure count on successful calls in closed state', async () => {
      // Make some failed calls, but not enough to open the circuit
      service.shouldFail = true;
      await expect(service.defaultMethod()).rejects.toThrow();
      await expect(service.defaultMethod()).rejects.toThrow();
      
      let state = getCircuitBreakerState(MockService.prototype, 'defaultMethod');
      expect(state?.metrics.failureCount).toBe(2);
      
      // Make a successful call
      service.shouldFail = false;
      await service.defaultMethod();
      
      // Check that failure count was reset
      state = getCircuitBreakerState(MockService.prototype, 'defaultMethod');
      expect(state?.metrics.failureCount).toBe(0);
    });
  });
  
  describe('Circuit Breaker Reset', () => {
    it('should reset circuit breaker state', async () => {
      service.shouldFail = true;
      
      // Open the circuit
      for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.DEFAULT.REQUEST_VOLUME_THRESHOLD; i++) {
        await expect(service.defaultMethod()).rejects.toThrow();
      }
      
      // Verify circuit is open
      let state = getCircuitBreakerState(MockService.prototype, 'defaultMethod');
      expect(state?.state).toBe(CircuitState.OPEN);
      
      // Reset the circuit breaker
      const result = resetCircuitBreaker(MockService.prototype, 'defaultMethod');
      expect(result).toBe(true);
      
      // Verify circuit is closed
      state = getCircuitBreakerState(MockService.prototype, 'defaultMethod');
      expect(state?.state).toBe(CircuitState.CLOSED);
      expect(state?.metrics.failureCount).toBe(0);
      expect(state?.metrics.totalRequests).toBe(0);
    });
    
    it('should return false when resetting non-existent circuit breaker', () => {
      const result = resetCircuitBreaker(MockService.prototype, 'nonExistentMethod');
      expect(result).toBe(false);
    });
  });
});