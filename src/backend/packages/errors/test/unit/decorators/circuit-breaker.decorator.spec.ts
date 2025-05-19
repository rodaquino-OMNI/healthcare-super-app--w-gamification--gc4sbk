import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreaker, CircuitBreakerOptions } from '../../../src/decorators/circuit-breaker.decorator';
import { CircuitBreakerState } from '../../../src/decorators/types';
import { MetricsService } from '@austa/metrics';
import { ErrorType, AppException } from '../../../src/categories/app.exception';

// Mock MetricsService for testing metrics integration
class MockMetricsService {
  recordCircuitBreakerState = jest.fn();
  incrementCounter = jest.fn();
  recordMethodDuration = jest.fn();
}

// Test class with circuit breaker decorated methods
class TestService {
  public callCount = 0;
  public shouldFail = false;
  public failureType: 'error' | 'exception' = 'error';
  
  // Method with default circuit breaker settings
  @CircuitBreaker()
  async defaultMethod(): Promise<string> {
    this.callCount++;
    if (this.shouldFail) {
      if (this.failureType === 'exception') {
        throw new AppException('Service failed', ErrorType.EXTERNAL, 'TEST_001');
      } else {
        throw new Error('Service failed');
      }
    }
    return 'success';
  }
  
  // Method with custom circuit breaker settings
  @CircuitBreaker({
    failureThreshold: 2,
    resetTimeout: 1000,
    halfOpenMaxCalls: 1,
    monitorWindow: 60000,
  })
  async customMethod(): Promise<string> {
    this.callCount++;
    if (this.shouldFail) {
      if (this.failureType === 'exception') {
        throw new AppException('Service failed', ErrorType.EXTERNAL, 'TEST_001');
      } else {
        throw new Error('Service failed');
      }
    }
    return 'success';
  }
  
  // Method with circuit breaker that only trips on specific errors
  @CircuitBreaker({
    failureThreshold: 2,
    failureFilter: (error) => error instanceof AppException && error.type === ErrorType.EXTERNAL
  })
  async filteredMethod(): Promise<string> {
    this.callCount++;
    if (this.shouldFail) {
      if (this.failureType === 'exception') {
        throw new AppException('Service failed', ErrorType.EXTERNAL, 'TEST_001');
      } else {
        throw new Error('Service failed');
      }
    }
    return 'success';
  }
  
  // Reset the call counter for testing
  resetCallCount(): void {
    this.callCount = 0;
  }
}

describe('CircuitBreaker Decorator', () => {
  let service: TestService;
  let metricsService: MockMetricsService;
  
  beforeEach(async () => {
    // Reset the circuit breaker state between tests
    // This is a workaround since we can't directly access the circuit breaker state
    jest.useFakeTimers();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestService,
        { provide: MetricsService, useClass: MockMetricsService }
      ],
    }).compile();
    
    service = module.get<TestService>(TestService);
    metricsService = module.get<MetricsService>(MetricsService) as unknown as MockMetricsService;
    
    // Reset service state before each test
    service.shouldFail = false;
    service.resetCallCount();
    service.failureType = 'error';
    
    // Clear mock metrics calls
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('Closed State (Normal Operation)', () => {
    it('should execute the method normally when circuit is closed', async () => {
      const result = await service.defaultMethod();
      
      expect(result).toBe('success');
      expect(service.callCount).toBe(1);
      expect(metricsService.recordCircuitBreakerState).toHaveBeenCalledWith(
        'TestService.defaultMethod',
        CircuitBreakerState.CLOSED
      );
    });
    
    it('should track failures but keep circuit closed when under threshold', async () => {
      // First call fails but not enough to trip circuit
      service.shouldFail = true;
      
      await expect(service.customMethod()).rejects.toThrow('Service failed');
      
      expect(service.callCount).toBe(1);
      expect(metricsService.recordCircuitBreakerState).toHaveBeenCalledWith(
        'TestService.customMethod',
        CircuitBreakerState.CLOSED
      );
      
      // Circuit should still be closed, allowing next call
      service.shouldFail = false;
      service.resetCallCount();
      
      const result = await service.customMethod();
      
      expect(result).toBe('success');
      expect(service.callCount).toBe(1);
    });
  });
  
  describe('Open State (Circuit Tripped)', () => {
    it('should open circuit after reaching failure threshold', async () => {
      // Configure service to fail
      service.shouldFail = true;
      
      // First failure
      await expect(service.customMethod()).rejects.toThrow('Service failed');
      expect(service.callCount).toBe(1);
      
      // Second failure - should trip the circuit
      await expect(service.customMethod()).rejects.toThrow('Service failed');
      expect(service.callCount).toBe(2);
      
      // Circuit should now be open
      expect(metricsService.recordCircuitBreakerState).toHaveBeenCalledWith(
        'TestService.customMethod',
        CircuitBreakerState.OPEN
      );
      
      // Reset call count to verify circuit is open
      service.resetCallCount();
      service.shouldFail = false; // Even if service works now, circuit is open
      
      // This call should fail fast without executing the method
      await expect(service.customMethod()).rejects.toThrow('Circuit breaker is open');
      expect(service.callCount).toBe(0); // Method was not called
    });
    
    it('should reject calls immediately when circuit is open', async () => {
      // Trip the circuit
      service.shouldFail = true;
      await expect(service.customMethod()).rejects.toThrow();
      await expect(service.customMethod()).rejects.toThrow();
      
      // Reset for next test
      service.resetCallCount();
      service.shouldFail = false;
      
      // Verify fast rejection
      const startTime = Date.now();
      await expect(service.customMethod()).rejects.toThrow('Circuit breaker is open');
      const endTime = Date.now();
      
      // Should reject very quickly (less than 10ms)
      expect(endTime - startTime).toBeLessThan(10);
      expect(service.callCount).toBe(0);
    });
    
    it('should only count specific errors towards failure threshold when filter is provided', async () => {
      // Configure service to fail with regular Error (not AppException)
      service.shouldFail = true;
      service.failureType = 'error';
      
      // These failures should not count towards threshold because they don't match filter
      await expect(service.filteredMethod()).rejects.toThrow('Service failed');
      await expect(service.filteredMethod()).rejects.toThrow('Service failed');
      await expect(service.filteredMethod()).rejects.toThrow('Service failed');
      
      // Reset and switch to AppException (which should count)
      service.resetCallCount();
      service.failureType = 'exception';
      
      // First filtered failure
      await expect(service.filteredMethod()).rejects.toThrow('Service failed');
      expect(service.callCount).toBe(1);
      
      // Second filtered failure - should trip the circuit
      await expect(service.filteredMethod()).rejects.toThrow('Service failed');
      expect(service.callCount).toBe(2);
      
      // Circuit should now be open
      service.resetCallCount();
      service.shouldFail = false;
      
      // This call should fail fast without executing the method
      await expect(service.filteredMethod()).rejects.toThrow('Circuit breaker is open');
      expect(service.callCount).toBe(0);
    });
  });
  
  describe('Half-Open State (Testing Recovery)', () => {
    it('should transition to half-open state after reset timeout', async () => {
      // Trip the circuit
      service.shouldFail = true;
      await expect(service.customMethod()).rejects.toThrow();
      await expect(service.customMethod()).rejects.toThrow();
      
      // Circuit is now open
      service.resetCallCount();
      
      // Advance time to trigger reset timeout
      jest.advanceTimersByTime(1100); // Just past the 1000ms reset timeout
      
      // Circuit should now be half-open
      expect(metricsService.recordCircuitBreakerState).toHaveBeenCalledWith(
        'TestService.customMethod',
        CircuitBreakerState.HALF_OPEN
      );
      
      // Allow service to succeed
      service.shouldFail = false;
      
      // Test call should go through in half-open state
      const result = await service.customMethod();
      expect(result).toBe('success');
      expect(service.callCount).toBe(1);
      
      // Circuit should transition back to closed
      expect(metricsService.recordCircuitBreakerState).toHaveBeenCalledWith(
        'TestService.customMethod',
        CircuitBreakerState.CLOSED
      );
    });
    
    it('should reopen circuit if test call fails in half-open state', async () => {
      // Trip the circuit
      service.shouldFail = true;
      await expect(service.customMethod()).rejects.toThrow();
      await expect(service.customMethod()).rejects.toThrow();
      
      // Circuit is now open
      service.resetCallCount();
      
      // Advance time to trigger reset timeout
      jest.advanceTimersByTime(1100);
      
      // Keep service failing for test call
      service.shouldFail = true;
      
      // Test call should go through but fail
      await expect(service.customMethod()).rejects.toThrow('Service failed');
      expect(service.callCount).toBe(1);
      
      // Circuit should transition back to open
      expect(metricsService.recordCircuitBreakerState).toHaveBeenCalledWith(
        'TestService.customMethod',
        CircuitBreakerState.OPEN
      );
      
      // Reset call count to verify circuit is open again
      service.resetCallCount();
      
      // This call should fail fast without executing the method
      await expect(service.customMethod()).rejects.toThrow('Circuit breaker is open');
      expect(service.callCount).toBe(0);
    });
    
    it('should limit concurrent calls in half-open state', async () => {
      // Trip the circuit
      service.shouldFail = true;
      await expect(service.customMethod()).rejects.toThrow();
      await expect(service.customMethod()).rejects.toThrow();
      
      // Circuit is now open
      service.resetCallCount();
      
      // Advance time to trigger reset timeout
      jest.advanceTimersByTime(1100);
      
      // Allow service to succeed
      service.shouldFail = false;
      
      // First call in half-open state should go through
      const firstCallPromise = service.customMethod();
      
      // Second call should be rejected because we're still in half-open with max 1 call
      await expect(service.customMethod()).rejects.toThrow('Circuit breaker is half-open');
      
      // Wait for first call to complete
      await firstCallPromise;
      
      // Verify only one call went through
      expect(service.callCount).toBe(1);
    });
  });
  
  describe('Metrics Integration', () => {
    it('should record state transitions in metrics service', async () => {
      // Initial state is closed
      await service.defaultMethod();
      expect(metricsService.recordCircuitBreakerState).toHaveBeenCalledWith(
        'TestService.defaultMethod',
        CircuitBreakerState.CLOSED
      );
      
      // Trip the circuit
      service.shouldFail = true;
      await expect(service.defaultMethod()).rejects.toThrow();
      await expect(service.defaultMethod()).rejects.toThrow();
      await expect(service.defaultMethod()).rejects.toThrow();
      await expect(service.defaultMethod()).rejects.toThrow();
      
      // Should record transition to open
      expect(metricsService.recordCircuitBreakerState).toHaveBeenCalledWith(
        'TestService.defaultMethod',
        CircuitBreakerState.OPEN
      );
      
      // Advance time to trigger reset timeout (default is 30000ms)
      jest.advanceTimersByTime(30100);
      
      // Should record transition to half-open
      expect(metricsService.recordCircuitBreakerState).toHaveBeenCalledWith(
        'TestService.defaultMethod',
        CircuitBreakerState.HALF_OPEN
      );
      
      // Allow service to succeed
      service.shouldFail = false;
      await service.defaultMethod();
      
      // Should record transition back to closed
      expect(metricsService.recordCircuitBreakerState).toHaveBeenCalledWith(
        'TestService.defaultMethod',
        CircuitBreakerState.CLOSED
      );
    });
    
    it('should increment failure counter when method fails', async () => {
      service.shouldFail = true;
      
      await expect(service.defaultMethod()).rejects.toThrow();
      
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'circuit_breaker_failure',
        { method: 'TestService.defaultMethod' }
      );
    });
    
    it('should record method duration for successful calls', async () => {
      await service.defaultMethod();
      
      expect(metricsService.recordMethodDuration).toHaveBeenCalledWith(
        'TestService.defaultMethod',
        expect.any(Number)
      );
    });
  });
  
  describe('Configuration Options', () => {
    it('should use default options when none provided', async () => {
      // Default threshold is typically higher, need multiple failures
      service.shouldFail = true;
      
      // Should take more failures to trip with default settings
      await expect(service.defaultMethod()).rejects.toThrow();
      await expect(service.defaultMethod()).rejects.toThrow();
      await expect(service.defaultMethod()).rejects.toThrow();
      
      // Circuit should still be closed after just 3 failures (default threshold is typically 5)
      service.resetCallCount();
      service.shouldFail = false;
      
      // Should still work
      const result = await service.defaultMethod();
      expect(result).toBe('success');
      
      // Now trip the circuit with more failures
      service.shouldFail = true;
      await expect(service.defaultMethod()).rejects.toThrow();
      await expect(service.defaultMethod()).rejects.toThrow();
      await expect(service.defaultMethod()).rejects.toThrow();
      await expect(service.defaultMethod()).rejects.toThrow();
      await expect(service.defaultMethod()).rejects.toThrow();
      
      // Now circuit should be open
      service.resetCallCount();
      service.shouldFail = false;
      
      await expect(service.defaultMethod()).rejects.toThrow('Circuit breaker is open');
      expect(service.callCount).toBe(0);
    });
    
    it('should respect custom failure threshold', async () => {
      // Custom method has threshold of 2
      service.shouldFail = true;
      
      await expect(service.customMethod()).rejects.toThrow();
      await expect(service.customMethod()).rejects.toThrow();
      
      // Circuit should be open after just 2 failures
      service.resetCallCount();
      service.shouldFail = false;
      
      await expect(service.customMethod()).rejects.toThrow('Circuit breaker is open');
      expect(service.callCount).toBe(0);
    });
    
    it('should respect custom reset timeout', async () => {
      // Trip the circuit
      service.shouldFail = true;
      await expect(service.customMethod()).rejects.toThrow();
      await expect(service.customMethod()).rejects.toThrow();
      
      // Circuit is now open
      service.resetCallCount();
      service.shouldFail = false;
      
      // Advance time but not enough to reset (custom timeout is 1000ms)
      jest.advanceTimersByTime(900);
      
      // Circuit should still be open
      await expect(service.customMethod()).rejects.toThrow('Circuit breaker is open');
      expect(service.callCount).toBe(0);
      
      // Advance time past reset timeout
      jest.advanceTimersByTime(200); // Total 1100ms
      
      // Circuit should now be half-open
      const result = await service.customMethod();
      expect(result).toBe('success');
      expect(service.callCount).toBe(1);
    });
  });
});