import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Resilient, ResilientBuilder, ResilientPatterns, createResilientBuilder } from '../../../src/decorators/resilient.decorator';
import { BackoffStrategy, CircuitState } from '../../../src/decorators/types';
import { BaseError, ErrorType } from '../../../src/base';

// Mock the Logger to avoid console output during tests
jest.mock('@nestjs/common', () => {
  const original = jest.requireActual('@nestjs/common');
  return {
    ...original,
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn()
    }))
  };
});

/**
 * Enum for error recovery strategies
 * This would normally be imported from the errors package
 */
enum ErrorRecoveryStrategy {
  RETRY = 'retry',
  CIRCUIT_BREAKER = 'circuit_breaker',
  CACHED_DATA = 'cached_data',
  DEFAULT_BEHAVIOR = 'default_behavior',
  GRACEFUL_DEGRADATION = 'graceful_degradation',
  FAIL = 'fail'
}

/**
 * Extended error types for testing
 */
enum ExtendedErrorType {
  TIMEOUT = 'timeout',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  NETWORK = 'network',
  DATABASE = 'database'
}

/**
 * Custom error class for testing error type filtering
 */
class TestTransientError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.TECHNICAL, 'TEST_001', {});
  }
}

/**
 * Custom error class for testing error type filtering
 */
class TestPermanentError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.BUSINESS, 'TEST_002', {});
  }
}

/**
 * Custom error class for testing external service errors
 */
class TestExternalError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.EXTERNAL, 'TEST_003', {});
  }
}

/**
 * Custom error class for testing timeout errors
 */
class TestTimeoutError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.TECHNICAL, 'TEST_004', { errorType: ExtendedErrorType.TIMEOUT });
  }
}

/**
 * Custom error class for testing service unavailable errors
 */
class TestServiceUnavailableError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.EXTERNAL, 'TEST_005', { errorType: ExtendedErrorType.SERVICE_UNAVAILABLE });
  }
}

/**
 * Mock service with resilient-decorated methods for testing
 */
class MockService {
  public attemptCount = 0;
  public fallbackCount = 0;
  public circuitOpenCount = 0;
  public lastError: Error | null = null;
  public lastDelay = 0;
  public delayTimestamps: number[] = [];
  public circuitState: CircuitState = CircuitState.CLOSED;

  /**
   * Resets the service state for a new test
   */
  reset() {
    this.attemptCount = 0;
    this.fallbackCount = 0;
    this.circuitOpenCount = 0;
    this.lastError = null;
    this.lastDelay = 0;
    this.delayTimestamps = [];
    this.circuitState = CircuitState.CLOSED;
  }

  /**
   * Basic resilient method with default settings
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message
   */
  @Resilient()
  async basicResilient(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Attempt ${this.attemptCount} failed`);
    }
    
    return 'Success';
  }

  /**
   * Method with retry configuration
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message
   */
  @Resilient()
    .withRetry({
      maxAttempts: 3,
      baseDelay: 100,
      onRetry: function(this: MockService, error: Error, attempt: number, delay: number) {
        this.delayTimestamps.push(delay);
      }
    })
  async resilientWithRetry(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Attempt ${this.attemptCount} failed`);
    }
    
    return 'Success';
  }

  /**
   * Method with circuit breaker configuration
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message
   */
  @Resilient()
    .withCircuitBreaker({
      id: 'test-circuit',
      failureThreshold: 3,
      resetTimeout: 1000,
      onStateChange: function(this: MockService, oldState: CircuitState, newState: CircuitState) {
        this.circuitState = newState;
        if (newState === CircuitState.OPEN) {
          this.circuitOpenCount++;
        }
      }
    })
  async resilientWithCircuitBreaker(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Attempt ${this.attemptCount} failed`);
    }
    
    return 'Success';
  }

  /**
   * Method with fallback configuration
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message or fallback message
   */
  @Resilient()
    .withFallback(function(this: MockService, error: Error) {
      this.fallbackCount++;
      this.lastError = error;
      return 'Fallback result';
    })
  async resilientWithFallback(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Attempt ${this.attemptCount} failed`);
    }
    
    return 'Success';
  }

  /**
   * Method with combined retry and fallback
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message or fallback message
   */
  @Resilient()
    .withRetry({
      maxAttempts: 3,
      baseDelay: 100,
      onRetry: function(this: MockService, error: Error, attempt: number, delay: number) {
        this.delayTimestamps.push(delay);
      }
    })
    .withFallback(function(this: MockService, error: Error) {
      this.fallbackCount++;
      this.lastError = error;
      return 'Fallback after retry';
    })
  async resilientWithRetryAndFallback(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Attempt ${this.attemptCount} failed`);
    }
    
    return 'Success';
  }

  /**
   * Method with combined retry, circuit breaker, and fallback
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message or fallback message
   */
  @Resilient()
    .withRetry({
      maxAttempts: 3,
      baseDelay: 100,
      onRetry: function(this: MockService, error: Error, attempt: number, delay: number) {
        this.delayTimestamps.push(delay);
      }
    })
    .withCircuitBreaker({
      id: 'test-combined-circuit',
      failureThreshold: 3,
      resetTimeout: 1000,
      onStateChange: function(this: MockService, oldState: CircuitState, newState: CircuitState) {
        this.circuitState = newState;
        if (newState === CircuitState.OPEN) {
          this.circuitOpenCount++;
        }
      }
    })
    .withFallback(function(this: MockService, error: Error) {
      this.fallbackCount++;
      this.lastError = error;
      return 'Fallback after all';
    })
  async resilientCombined(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Attempt ${this.attemptCount} failed`);
    }
    
    return 'Success';
  }

  /**
   * Method with error context configuration
   * @param failCount - Number of times to fail before succeeding
   * @param userId - User ID for context
   * @returns A success message
   */
  @Resilient()
    .withErrorContext({
      journey: 'health',
      operation: 'getUserProfile',
      resource: 'user-profile',
      getUserId: (failCount: number, userId: string) => userId
    })
    .withRetry({ maxAttempts: 2, baseDelay: 100 })
  async resilientWithContext(failCount: number, userId: string): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Attempt ${this.attemptCount} failed for user ${userId}`);
    }
    
    return `Success for ${userId}`;
  }

  /**
   * Method with error classification configuration
   * @param failCount - Number of times to fail before succeeding
   * @param errorType - Type of error to throw
   * @returns A success message
   */
  @Resilient()
    .withErrorClassification({
      defaultType: ErrorType.TECHNICAL,
      recoveryStrategy: ErrorRecoveryStrategy.RETRY,
      errorTypeMappings: {
        'TestTransientError': ErrorType.TECHNICAL,
        'TestPermanentError': ErrorType.BUSINESS,
        'TestExternalError': ErrorType.EXTERNAL
      }
    })
    .withRetry({
      maxAttempts: 3,
      baseDelay: 100,
      retryableErrors: [ErrorType.TECHNICAL, ErrorType.EXTERNAL]
    })
  async resilientWithErrorClassification(failCount: number, errorType: 'transient' | 'permanent' | 'external'): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      if (errorType === 'transient') {
        throw new TestTransientError(`Transient error on attempt ${this.attemptCount}`);
      } else if (errorType === 'permanent') {
        throw new TestPermanentError(`Permanent error on attempt ${this.attemptCount}`);
      } else {
        throw new TestExternalError(`External error on attempt ${this.attemptCount}`);
      }
    }
    
    return 'Success';
  }

  /**
   * Method using a pre-configured resilience pattern for health journey
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message
   */
  @Resilient(ResilientPatterns.healthJourney())
    .withFallback(function(this: MockService, error: Error) {
      this.fallbackCount++;
      return 'Health journey fallback';
    })
  async resilientWithHealthPattern(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Health error on attempt ${this.attemptCount}`);
    }
    
    return 'Success';
  }

  /**
   * Method using a pre-configured resilience pattern for external services
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message
   */
  @Resilient(ResilientPatterns.externalService('test-api'))
    .withFallback(function(this: MockService, error: Error) {
      this.fallbackCount++;
      return 'External service fallback';
    })
  async resilientWithExternalServicePattern(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestExternalError(`API error on attempt ${this.attemptCount}`);
    }
    
    return 'Success';
  }

  /**
   * Method using the convenience methods for journey and operation
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message
   */
  @Resilient()
    .forJourney('care')
    .forOperation('getAppointment')
    .withTransientRetry(2)
    .withFallback('Default appointment')
  async resilientWithConvenienceMethods(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Care error on attempt ${this.attemptCount}`);
    }
    
    return 'Appointment details';
  }

  /**
   * Method using a builder created outside the decorator
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message
   */
  @Resilient(
    createResilientBuilder()
      .withRetry({ maxAttempts: 2, baseDelay: 100 })
      .withFallback('Builder fallback')
  )
  async resilientWithExternalBuilder(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Builder error on attempt ${this.attemptCount}`);
    }
    
    return 'Success';
  }

  /**
   * Method using recovery strategy configuration
   * @param failCount - Number of times to fail before succeeding
   * @returns A success message
   */
  @Resilient()
    .withRecoveryStrategy(ErrorRecoveryStrategy.RETRY)
    .withFallback(function(this: MockService, error: Error) {
      this.fallbackCount++;
      return 'Recovery strategy fallback';
    })
  async resilientWithRecoveryStrategy(failCount: number): Promise<string> {
    this.attemptCount++;
    
    if (this.attemptCount <= failCount) {
      throw new TestTransientError(`Strategy error on attempt ${this.attemptCount}`);
    }
    
    return 'Success';
  }
}

describe('Resilient Decorator', () => {
  let mockService: MockService;

  beforeEach(() => {
    // Reset the mock timer before each test
    jest.useFakeTimers();
    
    // Create a new instance of the service
    mockService = new MockService();
    
    // Bind the service instance to the callback methods
    const methodsToBind = [
      'resilientWithRetry',
      'resilientWithCircuitBreaker',
      'resilientWithFallback',
      'resilientWithRetryAndFallback',
      'resilientCombined',
      'resilientWithContext',
      'resilientWithErrorClassification',
      'resilientWithHealthPattern',
      'resilientWithExternalServicePattern',
      'resilientWithConvenienceMethods',
      'resilientWithExternalBuilder',
      'resilientWithRecoveryStrategy'
    ];
    
    for (const method of methodsToBind) {
      const original = mockService[method];
      mockService[method] = function(this: MockService, ...args: any[]) {
        return original.apply(this, args);
      };
    }
  });

  afterEach(() => {
    // Restore the real timer after each test
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should work with default settings', async () => {
      // Arrange
      const failCount = 0; // Success on first attempt
      
      // Act
      const result = await mockService.basicResilient(failCount);
      
      // Assert
      expect(result).toBe('Success');
      expect(mockService.attemptCount).toBe(1);
    });

    it('should handle errors with default settings', async () => {
      // Arrange
      const failCount = 1; // Fail once
      
      // Act & Assert
      await expect(mockService.basicResilient(failCount)).rejects.toThrow('Attempt 1 failed');
      expect(mockService.attemptCount).toBe(1); // No retry with default settings
    });
  });

  describe('Retry Configuration', () => {
    it('should retry until success with configured attempts', async () => {
      // Arrange
      const failCount = 2; // Fail twice, succeed on third attempt
      
      // Act
      const promise = mockService.resilientWithRetry(failCount);
      
      // Advance timers to handle retries
      await jest.advanceTimersByTimeAsync(100); // First retry
      await jest.advanceTimersByTimeAsync(100); // Second retry
      
      const result = await promise;
      
      // Assert
      expect(result).toBe('Success');
      expect(mockService.attemptCount).toBe(3); // Initial + 2 retries
      expect(mockService.delayTimestamps.length).toBe(2); // 2 retries
    });

    it('should stop retrying after maxAttempts and throw the last error', async () => {
      // Arrange
      const failCount = 5; // More than maxAttempts (3)
      
      // Act & Assert
      const promise = mockService.resilientWithRetry(failCount);
      
      // Advance timers to handle retries
      await jest.advanceTimersByTimeAsync(100); // First retry
      await jest.advanceTimersByTimeAsync(100); // Second retry
      
      await expect(promise).rejects.toThrow('Attempt 3 failed');
      expect(mockService.attemptCount).toBe(3); // Initial + 2 retries = maxAttempts
      expect(mockService.delayTimestamps.length).toBe(2); // 2 retries
    });
  });

  describe('Circuit Breaker Configuration', () => {
    it('should open circuit after failure threshold is reached', async () => {
      // Arrange
      const failCount = 5; // More than failureThreshold (3)
      
      // Act & Assert - First call should fail but not open circuit yet
      await expect(mockService.resilientWithCircuitBreaker(failCount)).rejects.toThrow();
      expect(mockService.circuitState).toBe(CircuitState.CLOSED);
      
      // Second call
      mockService.reset();
      await expect(mockService.resilientWithCircuitBreaker(failCount)).rejects.toThrow();
      expect(mockService.circuitState).toBe(CircuitState.CLOSED);
      
      // Third call should open the circuit
      mockService.reset();
      await expect(mockService.resilientWithCircuitBreaker(failCount)).rejects.toThrow();
      expect(mockService.circuitState).toBe(CircuitState.OPEN);
      expect(mockService.circuitOpenCount).toBe(1);
      
      // Fourth call should fail fast with circuit open
      mockService.reset();
      await expect(mockService.resilientWithCircuitBreaker(failCount)).rejects.toThrow();
      expect(mockService.attemptCount).toBe(0); // No attempt made with open circuit
    });

    it('should transition to half-open state after reset timeout', async () => {
      // Arrange
      const failCount = 5; // More than failureThreshold (3)
      
      // Act & Assert - Open the circuit with 3 failures
      await expect(mockService.resilientWithCircuitBreaker(failCount)).rejects.toThrow();
      mockService.reset();
      await expect(mockService.resilientWithCircuitBreaker(failCount)).rejects.toThrow();
      mockService.reset();
      await expect(mockService.resilientWithCircuitBreaker(failCount)).rejects.toThrow();
      expect(mockService.circuitState).toBe(CircuitState.OPEN);
      
      // Advance time to trigger reset timeout
      await jest.advanceTimersByTimeAsync(1000); // resetTimeout is 1000ms
      
      // Next call should be allowed (half-open state)
      mockService.reset();
      await expect(mockService.resilientWithCircuitBreaker(failCount)).rejects.toThrow();
      expect(mockService.attemptCount).toBe(1); // Attempt made in half-open state
      expect(mockService.circuitState).toBe(CircuitState.OPEN); // Back to open after failure
    });

    it('should close circuit after successful test request in half-open state', async () => {
      // Arrange
      const failCount = 5; // More than failureThreshold (3)
      
      // Act & Assert - Open the circuit with 3 failures
      await expect(mockService.resilientWithCircuitBreaker(failCount)).rejects.toThrow();
      mockService.reset();
      await expect(mockService.resilientWithCircuitBreaker(failCount)).rejects.toThrow();
      mockService.reset();
      await expect(mockService.resilientWithCircuitBreaker(failCount)).rejects.toThrow();
      expect(mockService.circuitState).toBe(CircuitState.OPEN);
      
      // Advance time to trigger reset timeout
      await jest.advanceTimersByTimeAsync(1000); // resetTimeout is 1000ms
      
      // Next call should succeed (half-open state with failCount = 0)
      mockService.reset();
      const result = await mockService.resilientWithCircuitBreaker(0); // Success on first attempt
      expect(result).toBe('Success');
      expect(mockService.attemptCount).toBe(1);
      expect(mockService.circuitState).toBe(CircuitState.CLOSED); // Circuit closed after success
    });
  });

  describe('Fallback Configuration', () => {
    it('should execute fallback function when method fails', async () => {
      // Arrange
      const failCount = 1; // Fail once
      
      // Act
      const result = await mockService.resilientWithFallback(failCount);
      
      // Assert
      expect(result).toBe('Fallback result');
      expect(mockService.attemptCount).toBe(1);
      expect(mockService.fallbackCount).toBe(1);
      expect(mockService.lastError).toBeInstanceOf(TestTransientError);
    });

    it('should return original result when method succeeds', async () => {
      // Arrange
      const failCount = 0; // Success on first attempt
      
      // Act
      const result = await mockService.resilientWithFallback(failCount);
      
      // Assert
      expect(result).toBe('Success');
      expect(mockService.attemptCount).toBe(1);
      expect(mockService.fallbackCount).toBe(0); // Fallback not executed
    });

    it('should support string fallback values', async () => {
      // Arrange
      const failCount = 2; // More than maxAttempts (1 for convenience methods)
      
      // Act
      const result = await mockService.resilientWithConvenienceMethods(failCount);
      
      // Assert
      expect(result).toBe('Default appointment');
    });
  });

  describe('Resilient Patterns Interaction', () => {
    it('should handle interaction between retry and circuit breaker correctly', async () => {
      // Create a test service with retry-aware circuit breaker
      class InteractionTestService {
        public attemptCount = 0;
        public circuitState = CircuitState.CLOSED;
        
        @Resilient()
          .withRetry({
            maxAttempts: 3,
            baseDelay: 100
          })
          .withCircuitBreaker({
            failureThreshold: 2, // Two logical operations, not individual attempts
            resetTimeout: 1000,
            onStateChange: function(this: InteractionTestService, oldState: CircuitState, newState: CircuitState) {
              this.circuitState = newState;
            }
          })
        async operationWithRetryAndCircuitBreaker(): Promise<string> {
          this.attemptCount++;
          throw new TestTransientError(`Attempt ${this.attemptCount} failed`);
        }
      }
      
      const interactionService = new InteractionTestService();
      
      // Act & Assert - First operation with retries
      const promise1 = interactionService.operationWithRetryAndCircuitBreaker();
      await jest.advanceTimersByTimeAsync(100); // First retry
      await jest.advanceTimersByTimeAsync(100); // Second retry
      await expect(promise1).rejects.toThrow();
      expect(interactionService.attemptCount).toBe(3); // Initial + 2 retries
      expect(interactionService.circuitState).toBe(CircuitState.CLOSED); // Still closed after one logical operation
      
      // Reset for second operation
      interactionService.attemptCount = 0;
      
      // Second operation with retries should open the circuit
      const promise2 = interactionService.operationWithRetryAndCircuitBreaker();
      await jest.advanceTimersByTimeAsync(100); // First retry
      await jest.advanceTimersByTimeAsync(100); // Second retry
      await expect(promise2).rejects.toThrow();
      expect(interactionService.attemptCount).toBe(3); // Initial + 2 retries
      expect(interactionService.circuitState).toBe(CircuitState.OPEN); // Open after two logical operations
      
      // Third operation should fail fast with circuit open
      interactionService.attemptCount = 0;
      await expect(interactionService.operationWithRetryAndCircuitBreaker()).rejects.toThrow();
      expect(interactionService.attemptCount).toBe(0); // No attempts with open circuit
    });
  });

  describe('Combined Patterns', () => {
    it('should retry before executing fallback', async () => {
      // Arrange
      const failCount = 5; // More than maxAttempts (3)
      
      // Act
      const promise = mockService.resilientWithRetryAndFallback(failCount);
      
      // Advance timers to handle retries
      await jest.advanceTimersByTimeAsync(100); // First retry
      await jest.advanceTimersByTimeAsync(100); // Second retry
      
      const result = await promise;
      
      // Assert
      expect(result).toBe('Fallback after retry');
      expect(mockService.attemptCount).toBe(3); // Initial + 2 retries = maxAttempts
      expect(mockService.delayTimestamps.length).toBe(2); // 2 retries
      expect(mockService.fallbackCount).toBe(1); // Fallback executed once
    });

    it('should execute fallback when circuit is open', async () => {
      // Arrange
      const failCount = 5; // More than failureThreshold (3)
      
      // Act & Assert - Open the circuit with 3 failures
      await expect(mockService.resilientCombined(failCount)).rejects.toThrow();
      mockService.reset();
      await expect(mockService.resilientCombined(failCount)).rejects.toThrow();
      mockService.reset();
      await expect(mockService.resilientCombined(failCount)).rejects.toThrow();
      expect(mockService.circuitState).toBe(CircuitState.OPEN);
      
      // Next call should use fallback with circuit open
      mockService.reset();
      const result = await mockService.resilientCombined(failCount);
      expect(result).toBe('Fallback after all');
      expect(mockService.attemptCount).toBe(0); // No attempt made with open circuit
      expect(mockService.fallbackCount).toBe(1); // Fallback executed
    });

    it('should retry, then use fallback when circuit is half-open and fails', async () => {
      // Arrange
      const failCount = 5; // More than failureThreshold (3)
      
      // Act & Assert - Open the circuit with 3 failures
      await expect(mockService.resilientCombined(failCount)).rejects.toThrow();
      mockService.reset();
      await expect(mockService.resilientCombined(failCount)).rejects.toThrow();
      mockService.reset();
      await expect(mockService.resilientCombined(failCount)).rejects.toThrow();
      expect(mockService.circuitState).toBe(CircuitState.OPEN);
      
      // Advance time to trigger reset timeout
      await jest.advanceTimersByTimeAsync(1000); // resetTimeout is 1000ms
      
      // Next call should retry in half-open state, then use fallback
      mockService.reset();
      const promise = mockService.resilientCombined(failCount);
      
      // Advance timers to handle retries
      await jest.advanceTimersByTimeAsync(100); // First retry
      await jest.advanceTimersByTimeAsync(100); // Second retry
      
      const result = await promise;
      expect(result).toBe('Fallback after all');
      expect(mockService.attemptCount).toBe(3); // Initial + 2 retries = maxAttempts
      expect(mockService.fallbackCount).toBe(1); // Fallback executed
      expect(mockService.circuitState).toBe(CircuitState.OPEN); // Back to open after failure
    });
  });

  describe('Error Context and Classification', () => {
    it('should add context to errors', async () => {
      // Arrange
      const failCount = 3; // More than maxAttempts (2)
      const userId = 'user-123';
      
      // Act & Assert
      const promise = mockService.resilientWithContext(failCount, userId);
      
      // Advance timers to handle retries
      await jest.advanceTimersByTimeAsync(100); // First retry
      
      await expect(promise).rejects.toThrow(`Attempt 2 failed for user ${userId}`);
      expect(mockService.attemptCount).toBe(2); // Initial + 1 retry = maxAttempts
    });

    it('should classify errors and retry only retryable types', async () => {
      // Arrange
      const failCount = 2;
      
      // Act & Assert - Should retry transient errors
      mockService.reset();
      const promise1 = mockService.resilientWithErrorClassification(failCount, 'transient');
      
      // Advance timers to handle retries
      await jest.advanceTimersByTimeAsync(100); // First retry
      await jest.advanceTimersByTimeAsync(100); // Second retry
      
      const result1 = await promise1;
      expect(result1).toBe('Success');
      expect(mockService.attemptCount).toBe(3); // Initial + 2 retries
      
      // Act & Assert - Should not retry permanent errors
      mockService.reset();
      await expect(mockService.resilientWithErrorClassification(failCount, 'permanent')).rejects.toThrow();
      expect(mockService.attemptCount).toBe(1); // Only initial attempt, no retries
      
      // Act & Assert - Should retry external errors
      mockService.reset();
      const promise3 = mockService.resilientWithErrorClassification(failCount, 'external');
      
      // Advance timers to handle retries
      await jest.advanceTimersByTimeAsync(100); // First retry
      await jest.advanceTimersByTimeAsync(100); // Second retry
      
      const result3 = await promise3;
      expect(result3).toBe('Success');
      expect(mockService.attemptCount).toBe(3); // Initial + 2 retries
    });
  });

  describe('Error Transformation', () => {
    it('should transform errors when configured', async () => {
      // Create a test service with error transformation
      class TransformTestService {
        public attemptCount = 0;
        
        @Resilient()
          .withErrorTransformation({
            transformFn: (error: Error) => {
              if (error instanceof TestTransientError) {
                return new TestServiceUnavailableError('Transformed to service unavailable');
              }
              return error;
            }
          })
          .withRetry({
            maxAttempts: 2,
            baseDelay: 100,
            retryableErrors: [ErrorType.EXTERNAL]
          })
        async operationWithTransform(): Promise<string> {
          this.attemptCount++;
          throw new TestTransientError('Original error');
        }
      }
      
      const transformService = new TransformTestService();
      
      // Act & Assert
      const promise = transformService.operationWithTransform();
      
      // Advance timers to handle retries
      await jest.advanceTimersByTimeAsync(100); // First retry
      
      await expect(promise).rejects.toThrow('Transformed to service unavailable');
      expect(transformService.attemptCount).toBe(2); // Initial + 1 retry
    });
  });

  describe('Pre-configured Patterns', () => {
    it('should use health journey pattern correctly', async () => {
      // Arrange
      const failCount = 5; // More than maxAttempts
      
      // Act
      const promise = mockService.resilientWithHealthPattern(failCount);
      
      // Advance timers to handle retries (transient retry is configured in health pattern)
      await jest.advanceTimersByTimeAsync(1000); // First retry
      await jest.advanceTimersByTimeAsync(2000); // Second retry
      await jest.advanceTimersByTimeAsync(4000); // Third retry
      
      const result = await promise;
      
      // Assert
      expect(result).toBe('Health journey fallback');
      expect(mockService.fallbackCount).toBe(1); // Fallback executed
    });

    it('should use external service pattern correctly', async () => {
      // Arrange
      const failCount = 5; // More than maxAttempts
      
      // Act
      const promise = mockService.resilientWithExternalServicePattern(failCount);
      
      // Advance timers to handle retries (transient retry is configured in external service pattern)
      await jest.advanceTimersByTimeAsync(1000); // First retry
      await jest.advanceTimersByTimeAsync(2000); // Second retry
      await jest.advanceTimersByTimeAsync(4000); // Third retry
      
      const result = await promise;
      
      // Assert
      expect(result).toBe('External service fallback');
      expect(mockService.fallbackCount).toBe(1); // Fallback executed
    });
  });

  describe('Parameter Validation', () => {
    it('should validate retry options', async () => {
      // Create a test service with invalid retry options
      class ValidationTestService {
        // @ts-expect-error - Testing runtime validation
        @Resilient()
          .withRetry({ maxAttempts: -1, baseDelay: -100 }) // Invalid values
        async operationWithInvalidRetry(): Promise<string> {
          return 'Success';
        }
      }
      
      const validationService = new ValidationTestService();
      
      // Act & Assert - Should throw during initialization
      expect(() => validationService.operationWithInvalidRetry()).toThrow();
    });
    
    it('should validate circuit breaker options', async () => {
      // Create a test service with invalid circuit breaker options
      class ValidationTestService {
        // @ts-expect-error - Testing runtime validation
        @Resilient()
          .withCircuitBreaker({ failureThreshold: 0, resetTimeout: -1000 }) // Invalid values
        async operationWithInvalidCircuitBreaker(): Promise<string> {
          return 'Success';
        }
      }
      
      const validationService = new ValidationTestService();
      
      // Act & Assert - Should throw during initialization
      expect(() => validationService.operationWithInvalidCircuitBreaker()).toThrow();
    });
  });

  describe('Builder API', () => {
    it('should support builder cloning and reuse', async () => {
      // Create a base builder
      const baseBuilder = createResilientBuilder()
        .withRetry({ maxAttempts: 2, baseDelay: 100 });
      
      // Clone and extend the builder
      const extendedBuilder = baseBuilder.clone()
        .withFallback('Extended fallback');
      
      // Create a test service with both builders
      class BuilderTestService {
        public attemptCount = 0;
        
        @Resilient(baseBuilder)
        async baseOperation(): Promise<string> {
          this.attemptCount++;
          throw new TestTransientError('Base operation failed');
        }
        
        @Resilient(extendedBuilder)
        async extendedOperation(): Promise<string> {
          this.attemptCount++;
          throw new TestTransientError('Extended operation failed');
        }
      }
      
      const builderService = new BuilderTestService();
      
      // Act & Assert - Base operation should retry but then throw
      const basePromise = builderService.baseOperation();
      await jest.advanceTimersByTimeAsync(100); // First retry
      await expect(basePromise).rejects.toThrow('Base operation failed');
      
      // Reset for extended operation
      builderService.attemptCount = 0;
      
      // Extended operation should retry and then use fallback
      const extendedPromise = builderService.extendedOperation();
      await jest.advanceTimersByTimeAsync(100); // First retry
      const result = await extendedPromise;
      expect(result).toBe('Extended fallback');
    });
    
    it('should support external builder configuration', async () => {
      // Arrange
      const failCount = 3; // More than maxAttempts (2)
      
      // Act
      const promise = mockService.resilientWithExternalBuilder(failCount);
      
      // Advance timers to handle retries
      await jest.advanceTimersByTimeAsync(100); // First retry
      
      const result = await promise;
      
      // Assert
      expect(result).toBe('Builder fallback');
      expect(mockService.attemptCount).toBe(2); // Initial + 1 retry = maxAttempts
    });

    it('should configure recovery strategy correctly', async () => {
      // Arrange
      const failCount = 5; // More than default maxAttempts
      
      // Act
      const promise = mockService.resilientWithRecoveryStrategy(failCount);
      
      // Advance timers to handle retries (recovery strategy configures retry)
      await jest.advanceTimersByTimeAsync(1000); // First retry
      await jest.advanceTimersByTimeAsync(2000); // Second retry
      await jest.advanceTimersByTimeAsync(4000); // Third retry
      
      const result = await promise;
      
      // Assert
      expect(result).toBe('Recovery strategy fallback');
      expect(mockService.fallbackCount).toBe(1); // Fallback executed
    });

    it('should support convenience methods for journey and operation', async () => {
      // Arrange
      const failCount = 1; // Less than maxAttempts (2)
      
      // Act
      const promise = mockService.resilientWithConvenienceMethods(failCount);
      
      // Advance timers to handle retries
      await jest.advanceTimersByTimeAsync(1000); // First retry
      
      const result = await promise;
      
      // Assert
      expect(result).toBe('Appointment details');
      expect(mockService.attemptCount).toBe(2); // Initial + 1 retry
    });
  });
});