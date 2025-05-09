import { CircuitBreaker, CircuitOpenError, resetCircuitBreaker, getCircuitBreakerState, openCircuitBreaker, getAllCircuitBreakerStates, ExternalServiceCircuitBreaker, DatabaseCircuitBreaker, WithCircuitBreaker } from '../../../src/decorators/circuit-breaker.decorator';
import { CircuitState } from '../../../src/decorators/types';
import { BaseError, ErrorType } from '../../../src/base';

/**
 * Custom error for testing circuit breaker behavior
 */
class TestServiceError extends BaseError {
  constructor(message: string, type: ErrorType = ErrorType.EXTERNAL) {
    super(message, type, 'TEST_SERVICE_ERROR', { service: 'TestService' });
  }
}

/**
 * Mock service class with circuit breaker decorated methods
 * Used to test different circuit breaker configurations and behaviors
 */
class TestService {
  public callCount = 0;
  public lastArgs: any[] = [];
  
  /**
   * Basic circuit breaker with default settings
   */
  @CircuitBreaker()
  async basicOperation(...args: any[]): Promise<string> {
    this.callCount++;
    this.lastArgs = args;
    return 'success';
  }
  
  /**
   * Circuit breaker with custom failure threshold
   */
  @CircuitBreaker({ failureThreshold: 2, windowSize: 5 })
  async customThresholdOperation(): Promise<string> {
    this.callCount++;
    return 'success';
  }
  
  /**
   * Circuit breaker with custom reset timeout
   */
  @CircuitBreaker({ resetTimeout: 500 })
  async customTimeoutOperation(): Promise<string> {
    this.callCount++;
    return 'success';
  }
  
  /**
   * Circuit breaker with state change callback for metrics
   */
  @CircuitBreaker({
    id: 'metrics-circuit',
    onStateChange: jest.fn()
  })
  async metricsOperation(): Promise<string> {
    this.callCount++;
    return 'success';
  }
  
  /**
   * Operation that always fails with an external error
   */
  @CircuitBreaker()
  async failingOperation(): Promise<string> {
    this.callCount++;
    throw new TestServiceError('Service unavailable');
  }
  
  /**
   * Operation that fails with a specific error type
   */
  @CircuitBreaker({
    failureErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT]
  })
  async specificErrorOperation(errorType: ErrorType): Promise<string> {
    this.callCount++;
    throw new TestServiceError('Operation failed', errorType);
  }
  
  /**
   * Operation with custom failure detection logic
   */
  @CircuitBreaker({
    isFailure: (error: Error) => error instanceof TestServiceError
  })
  async customFailureOperation(shouldFail: boolean): Promise<string> {
    this.callCount++;
    if (shouldFail) {
      throw new TestServiceError('Custom failure');
    }
    return 'success';
  }
  
  /**
   * Operation using the shorthand decorator
   */
  @WithCircuitBreaker
  async shorthandOperation(): Promise<string> {
    this.callCount++;
    return 'success';
  }
  
  /**
   * Operation using the external service preset
   */
  @ExternalServiceCircuitBreaker()
  async externalServiceOperation(shouldFail: boolean): Promise<string> {
    this.callCount++;
    if (shouldFail) {
      throw new TestServiceError('External service error');
    }
    return 'success';
  }
  
  /**
   * Operation using the database preset
   */
  @DatabaseCircuitBreaker()
  async databaseOperation(errorType: ErrorType = ErrorType.EXTERNAL): Promise<string> {
    this.callCount++;
    if (errorType) {
      throw new TestServiceError('Database error', errorType);
    }
    return 'success';
  }
  
  /**
   * Reset the call counter
   */
  resetCallCount(): void {
    this.callCount = 0;
    this.lastArgs = [];
  }
}

describe('CircuitBreaker Decorator', () => {
  let service: TestService;
  
  beforeEach(() => {
    service = new TestService();
    service.resetCallCount();
    
    // Reset all circuit breakers before each test
    const allCircuits = getAllCircuitBreakerStates();
    for (const circuitId of allCircuits.keys()) {
      resetCircuitBreaker(circuitId);
    }
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset timers
    jest.useRealTimers();
  });
  
  describe('Basic Functionality', () => {
    it('should allow successful method calls to pass through', async () => {
      const result = await service.basicOperation('test', 123);
      
      expect(result).toBe('success');
      expect(service.callCount).toBe(1);
      expect(service.lastArgs).toEqual(['test', 123]);
    });
    
    it('should track method arguments correctly', async () => {
      await service.basicOperation('first', 1);
      expect(service.lastArgs).toEqual(['first', 1]);
      
      await service.basicOperation('second', 2);
      expect(service.lastArgs).toEqual(['second', 2]);
    });
    
    it('should allow method calls to throw errors normally when circuit is closed', async () => {
      await expect(service.failingOperation()).rejects.toThrow(TestServiceError);
      expect(service.callCount).toBe(1);
    });
  });
  
  describe('Circuit States', () => {
    describe('Closed State', () => {
      it('should start in closed state', async () => {
        const circuitId = 'TestService.basicOperation';
        const state = getCircuitBreakerState(circuitId);
        
        expect(state?.state).toBe(CircuitState.CLOSED);
      });
      
      it('should remain closed after successful calls', async () => {
        const circuitId = 'TestService.basicOperation';
        
        // Make several successful calls
        for (let i = 0; i < 5; i++) {
          await service.basicOperation();
        }
        
        const state = getCircuitBreakerState(circuitId);
        expect(state?.state).toBe(CircuitState.CLOSED);
        expect(service.callCount).toBe(5);
      });
      
      it('should track failures in the sliding window', async () => {
        const circuitId = 'TestService.failingOperation';
        
        // Make several failing calls, but not enough to open the circuit
        for (let i = 0; i < 4; i++) {
          await expect(service.failingOperation()).rejects.toThrow(TestServiceError);
        }
        
        const state = getCircuitBreakerState(circuitId);
        expect(state?.state).toBe(CircuitState.CLOSED);
        expect(state?.results.filter(r => !r).length).toBe(4); // 4 failures
        expect(service.callCount).toBe(4);
      });
    });
    
    describe('Open State', () => {
      it('should transition to open state when failure threshold is reached', async () => {
        const circuitId = 'TestService.failingOperation';
        
        // Make enough failing calls to open the circuit (default threshold is 5)
        for (let i = 0; i < 5; i++) {
          await expect(service.failingOperation()).rejects.toThrow(TestServiceError);
        }
        
        const state = getCircuitBreakerState(circuitId);
        expect(state?.state).toBe(CircuitState.OPEN);
        expect(service.callCount).toBe(5);
      });
      
      it('should reject calls with CircuitOpenError when circuit is open', async () => {
        const circuitId = 'TestService.failingOperation';
        
        // Open the circuit
        for (let i = 0; i < 5; i++) {
          await expect(service.failingOperation()).rejects.toThrow(TestServiceError);
        }
        
        // Reset call count
        service.resetCallCount();
        
        // Try to call the method when circuit is open
        await expect(service.failingOperation()).rejects.toThrow(CircuitOpenError);
        
        // Verify the method was not actually called
        expect(service.callCount).toBe(0);
      });
      
      it('should include circuit details in the CircuitOpenError', async () => {
        const circuitId = 'TestService.failingOperation';
        
        // Open the circuit
        for (let i = 0; i < 5; i++) {
          await expect(service.failingOperation()).rejects.toThrow(TestServiceError);
        }
        
        // Try to call the method when circuit is open
        try {
          await service.failingOperation();
          fail('Expected CircuitOpenError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(CircuitOpenError);
          expect(error.message).toContain(circuitId);
          expect(error.message).toContain('open');
          expect(error.type).toBe(ErrorType.UNAVAILABLE);
          expect(error.code).toBe('CIRCUIT_OPEN');
          expect(error.context.circuitId).toBe(circuitId);
          expect(error.context.openedAt).toBeDefined();
        }
      });
    });
    
    describe('Half-Open State', () => {
      it('should transition to half-open state after reset timeout', async () => {
        jest.useFakeTimers();
        const circuitId = 'TestService.customTimeoutOperation';
        
        // First, open the circuit with failures
        openCircuitBreaker(circuitId);
        
        // Verify circuit is open
        let state = getCircuitBreakerState(circuitId);
        expect(state?.state).toBe(CircuitState.OPEN);
        
        // Fast-forward time past the reset timeout (500ms)
        jest.advanceTimersByTime(600);
        
        // Try a call - it should be in half-open state now
        await service.customTimeoutOperation();
        
        state = getCircuitBreakerState(circuitId);
        expect(state?.state).toBe(CircuitState.HALF_OPEN);
        expect(service.callCount).toBe(1);
      });
      
      it('should transition back to open state on failure in half-open state', async () => {
        jest.useFakeTimers();
        const circuitId = 'TestService.failingOperation';
        
        // First, open the circuit with failures
        openCircuitBreaker(circuitId);
        
        // Fast-forward time past the reset timeout (default 30s)
        jest.advanceTimersByTime(31000);
        
        // Verify circuit is in half-open state
        let state = getCircuitBreakerState(circuitId);
        expect(state?.state).toBe(CircuitState.HALF_OPEN);
        
        // Make a call that fails
        await expect(service.failingOperation()).rejects.toThrow(TestServiceError);
        
        // Verify circuit is back to open state
        state = getCircuitBreakerState(circuitId);
        expect(state?.state).toBe(CircuitState.OPEN);
        expect(service.callCount).toBe(1);
      });
      
      it('should transition to closed state after success threshold in half-open state', async () => {
        jest.useFakeTimers();
        const circuitId = 'TestService.basicOperation';
        
        // First, open the circuit
        openCircuitBreaker(circuitId);
        
        // Fast-forward time past the reset timeout
        jest.advanceTimersByTime(31000);
        
        // Make successful calls to meet the success threshold (default is 2)
        await service.basicOperation();
        
        // Verify still in half-open state
        let state = getCircuitBreakerState(circuitId);
        expect(state?.state).toBe(CircuitState.HALF_OPEN);
        expect(state?.consecutiveSuccesses).toBe(1);
        
        // Make one more successful call
        await service.basicOperation();
        
        // Verify circuit is now closed
        state = getCircuitBreakerState(circuitId);
        expect(state?.state).toBe(CircuitState.CLOSED);
        expect(service.callCount).toBe(2);
      });
    });
  });
  
  describe('Configuration Options', () => {
    it('should respect custom failure threshold', async () => {
      const circuitId = 'TestService.customThresholdOperation';
      
      // Mock the implementation to always fail
      jest.spyOn(service, 'customThresholdOperation').mockImplementation(async () => {
        service.callCount++;
        throw new TestServiceError('Service unavailable');
      });
      
      // Make 1 failing call - not enough to open circuit with threshold of 2
      await expect(service.customThresholdOperation()).rejects.toThrow(TestServiceError);
      
      let state = getCircuitBreakerState(circuitId);
      expect(state?.state).toBe(CircuitState.CLOSED);
      
      // Make another failing call - should open the circuit now
      await expect(service.customThresholdOperation()).rejects.toThrow(TestServiceError);
      
      state = getCircuitBreakerState(circuitId);
      expect(state?.state).toBe(CircuitState.OPEN);
      expect(service.callCount).toBe(2);
    });
    
    it('should respect custom reset timeout', async () => {
      jest.useFakeTimers();
      const circuitId = 'TestService.customTimeoutOperation';
      
      // Open the circuit
      openCircuitBreaker(circuitId);
      
      // Fast-forward time but not enough to reset (300ms of 500ms)
      jest.advanceTimersByTime(300);
      
      // Try a call - should still be rejected
      await expect(service.customTimeoutOperation()).rejects.toThrow(CircuitOpenError);
      expect(service.callCount).toBe(0);
      
      // Fast-forward time past the reset timeout (another 300ms, total 600ms)
      jest.advanceTimersByTime(300);
      
      // Try again - should be in half-open state now
      await service.customTimeoutOperation();
      expect(service.callCount).toBe(1);
      
      const state = getCircuitBreakerState(circuitId);
      expect(state?.state).toBe(CircuitState.HALF_OPEN);
    });
    
    it('should only count specified error types as failures', async () => {
      const circuitId = 'TestService.specificErrorOperation';
      
      // Make calls with EXTERNAL errors (should count as failures)
      for (let i = 0; i < 4; i++) {
        await expect(service.specificErrorOperation(ErrorType.EXTERNAL))
          .rejects.toThrow(TestServiceError);
      }
      
      // Make a call with BUSINESS error (should not count as failure)
      await expect(service.specificErrorOperation(ErrorType.BUSINESS))
        .rejects.toThrow(TestServiceError);
      
      // Circuit should still be closed because we only had 4 counted failures
      let state = getCircuitBreakerState(circuitId);
      expect(state?.state).toBe(CircuitState.CLOSED);
      
      // One more EXTERNAL error should open the circuit
      await expect(service.specificErrorOperation(ErrorType.EXTERNAL))
        .rejects.toThrow(TestServiceError);
      
      state = getCircuitBreakerState(circuitId);
      expect(state?.state).toBe(CircuitState.OPEN);
      expect(service.callCount).toBe(6); // 5 EXTERNAL + 1 BUSINESS
    });
    
    it('should use custom failure detection logic when provided', async () => {
      const circuitId = 'TestService.customFailureOperation';
      
      // Make failing calls
      for (let i = 0; i < 4; i++) {
        await expect(service.customFailureOperation(true))
          .rejects.toThrow(TestServiceError);
      }
      
      // Circuit should still be closed
      let state = getCircuitBreakerState(circuitId);
      expect(state?.state).toBe(CircuitState.CLOSED);
      
      // One more failure should open the circuit
      await expect(service.customFailureOperation(true))
        .rejects.toThrow(TestServiceError);
      
      state = getCircuitBreakerState(circuitId);
      expect(state?.state).toBe(CircuitState.OPEN);
      expect(service.callCount).toBe(5);
    });
  });
  
  describe('Shorthand and Preset Decorators', () => {
    it('should work with WithCircuitBreaker shorthand', async () => {
      const circuitId = 'TestService.shorthandOperation';
      
      // Mock to make it fail
      jest.spyOn(service, 'shorthandOperation').mockImplementation(async () => {
        service.callCount++;
        throw new TestServiceError('Service unavailable');
      });
      
      // Make enough failing calls to open the circuit
      for (let i = 0; i < 5; i++) {
        await expect(service.shorthandOperation()).rejects.toThrow(TestServiceError);
      }
      
      // Verify circuit is open
      const state = getCircuitBreakerState(circuitId);
      expect(state?.state).toBe(CircuitState.OPEN);
      
      // Reset call count
      service.resetCallCount();
      
      // Try again - should be rejected by circuit breaker
      await expect(service.shorthandOperation()).rejects.toThrow(CircuitOpenError);
      expect(service.callCount).toBe(0);
    });
    
    it('should work with ExternalServiceCircuitBreaker preset', async () => {
      const circuitId = 'TestService.externalServiceOperation';
      
      // Make failing calls - ExternalServiceCircuitBreaker has threshold of 3
      for (let i = 0; i < 2; i++) {
        await expect(service.externalServiceOperation(true)).rejects.toThrow(TestServiceError);
      }
      
      // Circuit should still be closed
      let state = getCircuitBreakerState(circuitId);
      expect(state?.state).toBe(CircuitState.CLOSED);
      
      // One more failure should open the circuit
      await expect(service.externalServiceOperation(true)).rejects.toThrow(TestServiceError);
      
      // Verify circuit is open
      state = getCircuitBreakerState(circuitId);
      expect(state?.state).toBe(CircuitState.OPEN);
      expect(service.callCount).toBe(3);
    });
    
    it('should work with DatabaseCircuitBreaker preset', async () => {
      const circuitId = 'TestService.databaseOperation';
      
      // NOT_FOUND errors should not count as failures in DatabaseCircuitBreaker
      await expect(service.databaseOperation(ErrorType.NOT_FOUND)).rejects.toThrow(TestServiceError);
      
      // Circuit should still be closed
      let state = getCircuitBreakerState(circuitId);
      expect(state?.state).toBe(CircuitState.CLOSED);
      expect(state?.results.filter(r => !r).length).toBe(0); // No counted failures
      
      // Make enough EXTERNAL errors to open the circuit (threshold is 5)
      for (let i = 0; i < 5; i++) {
        await expect(service.databaseOperation(ErrorType.EXTERNAL)).rejects.toThrow(TestServiceError);
      }
      
      // Verify circuit is open
      state = getCircuitBreakerState(circuitId);
      expect(state?.state).toBe(CircuitState.OPEN);
      expect(service.callCount).toBe(6); // 1 NOT_FOUND + 5 EXTERNAL
    });
  });
  
  describe('Metrics Integration', () => {
    it('should call onStateChange callback when circuit state changes', async () => {
      const circuitId = 'metrics-circuit';
      const onStateChange = jest.fn();
      
      // Create a new instance with a spy on the callback
      const metricsService = new TestService();
      jest.spyOn(metricsService, 'metricsOperation').mockImplementation(async () => {
        metricsService.callCount++;
        throw new TestServiceError('Service unavailable');
      });
      
      // Replace the onStateChange callback with our spy
      const descriptor = Object.getOwnPropertyDescriptor(
        TestService.prototype, 'metricsOperation'
      );
      const originalMethod = descriptor?.value;
      
      // @ts-ignore - Accessing private implementation details for testing
      const originalDecorator = originalMethod.__circuitBreakerOptions;
      originalDecorator.onStateChange = onStateChange;
      
      // Make enough failing calls to open the circuit
      for (let i = 0; i < 5; i++) {
        await expect(metricsService.metricsOperation()).rejects.toThrow(TestServiceError);
      }
      
      // Verify callback was called with state change to OPEN
      expect(onStateChange).toHaveBeenCalledWith(
        CircuitState.CLOSED,
        CircuitState.OPEN,
        expect.stringContaining('Failure threshold exceeded')
      );
      
      // Reset the callback
      onStateChange.mockClear();
      
      // Fast-forward time to transition to HALF-OPEN
      jest.useFakeTimers();
      jest.advanceTimersByTime(31000);
      
      // Make a call to trigger the state check
      jest.spyOn(metricsService, 'metricsOperation').mockImplementation(async () => {
        metricsService.callCount++;
        return 'success';
      });
      
      await metricsService.metricsOperation();
      
      // Verify callback was called with state change to HALF-OPEN
      expect(onStateChange).toHaveBeenCalledWith(
        CircuitState.OPEN,
        CircuitState.HALF_OPEN,
        expect.stringContaining('Reset timeout elapsed')
      );
      
      // Reset the callback
      onStateChange.mockClear();
      
      // Make another successful call to close the circuit
      await metricsService.metricsOperation();
      
      // Verify callback was called with state change to CLOSED
      expect(onStateChange).toHaveBeenCalledWith(
        CircuitState.HALF_OPEN,
        CircuitState.CLOSED,
        expect.stringContaining('Success threshold reached')
      );
    });
    
    it('should provide detailed information in state change callbacks', async () => {
      const circuitId = 'metrics-circuit';
      const onStateChange = jest.fn();
      
      // Create a new instance with a spy on the callback
      const metricsService = new TestService();
      jest.spyOn(metricsService, 'metricsOperation').mockImplementation(async () => {
        metricsService.callCount++;
        throw new TestServiceError('Service unavailable');
      });
      
      // Replace the onStateChange callback with our spy
      const descriptor = Object.getOwnPropertyDescriptor(
        TestService.prototype, 'metricsOperation'
      );
      const originalMethod = descriptor?.value;
      
      // @ts-ignore - Accessing private implementation details for testing
      const originalDecorator = originalMethod.__circuitBreakerOptions;
      originalDecorator.onStateChange = onStateChange;
      
      // Make enough failing calls to open the circuit
      for (let i = 0; i < 5; i++) {
        await expect(metricsService.metricsOperation()).rejects.toThrow(TestServiceError);
      }
      
      // Verify callback was called with detailed information
      expect(onStateChange).toHaveBeenCalledTimes(1);
      expect(onStateChange).toHaveBeenCalledWith(
        CircuitState.CLOSED,
        CircuitState.OPEN,
        expect.stringMatching(/Failure threshold exceeded: \d+ failures in last \d+ calls/)
      );
    });
  });
  
  describe('Circuit Breaker Registry', () => {
    it('should maintain separate circuit breakers for different methods', async () => {
      // Open the circuit for failingOperation
      for (let i = 0; i < 5; i++) {
        await expect(service.failingOperation()).rejects.toThrow(TestServiceError);
      }
      
      // Verify failingOperation circuit is open
      const failingCircuitId = 'TestService.failingOperation';
      const failingState = getCircuitBreakerState(failingCircuitId);
      expect(failingState?.state).toBe(CircuitState.OPEN);
      
      // But basicOperation should still work
      const result = await service.basicOperation();
      expect(result).toBe('success');
      
      // Verify basicOperation circuit is closed
      const basicCircuitId = 'TestService.basicOperation';
      const basicState = getCircuitBreakerState(basicCircuitId);
      expect(basicState?.state).toBe(CircuitState.CLOSED);
    });
    
    it('should allow manual control of circuit breakers for testing', async () => {
      const circuitId = 'TestService.basicOperation';
      
      // Manually open the circuit
      openCircuitBreaker(circuitId);
      
      // Verify circuit is open
      let state = getCircuitBreakerState(circuitId);
      expect(state?.state).toBe(CircuitState.OPEN);
      
      // Try to call the method - should be rejected
      await expect(service.basicOperation()).rejects.toThrow(CircuitOpenError);
      
      // Manually reset the circuit
      resetCircuitBreaker(circuitId);
      
      // Verify circuit is closed
      state = getCircuitBreakerState(circuitId);
      expect(state?.state).toBe(CircuitState.CLOSED);
      
      // Method should work now
      const result = await service.basicOperation();
      expect(result).toBe('success');
    });
    
    it('should provide access to all circuit breaker states', async () => {
      // Create some circuit breakers
      await service.basicOperation();
      await expect(service.failingOperation()).rejects.toThrow(TestServiceError);
      
      // Get all circuit states
      const allCircuits = getAllCircuitBreakerStates();
      
      // Verify we can see all circuits
      expect(allCircuits.size).toBeGreaterThanOrEqual(2);
      expect(allCircuits.has('TestService.basicOperation')).toBe(true);
      expect(allCircuits.has('TestService.failingOperation')).toBe(true);
    });
  });
});