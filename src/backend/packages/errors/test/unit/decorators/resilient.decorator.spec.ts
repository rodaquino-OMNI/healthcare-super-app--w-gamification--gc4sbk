import { Test } from '@nestjs/testing';
import { jest } from '@jest/globals';

// Import the decorators to test
import { Resilient } from '../../../src/decorators/resilient.decorator';
import { AppException, ErrorType } from '../../../src/categories/app.exception';

/**
 * Mock service with methods that use the Resilient decorator
 * for comprehensive resilience testing
 */
class MockService {
  // Track method calls for verification
  public callCount = 0;
  public callTimestamps: number[] = [];
  public fallbackCalled = false;
  public circuitOpenRejections = 0;

  // Reset tracking data
  public reset(): void {
    this.callCount = 0;
    this.callTimestamps = [];
    this.fallbackCalled = false;
    this.circuitOpenRejections = 0;
  }

  /**
   * Method with full resilience configuration using fluent API
   * - Retries 3 times with exponential backoff
   * - Circuit breaker opens after 5 failures
   * - Falls back to a default value when all else fails
   */
  @Resilient()
    .withRetry({ attempts: 3, baseDelay: 50, maxDelay: 500 })
    .withCircuitBreaker({ failureThreshold: 5, resetTimeout: 1000 })
    .withFallback(() => 'fallback-value')
    .configure()
  public async resilientMethod(shouldFail: boolean, errorType: ErrorType = ErrorType.TECHNICAL): Promise<string> {
    this.callCount++;
    this.callTimestamps.push(Date.now());

    if (shouldFail) {
      throw new AppException(
        `Simulated failure ${this.callCount}`,
        errorType,
        'TEST_ERROR',
        { attempt: this.callCount }
      );
    }

    return 'success';
  }

  /**
   * Method with custom fallback that receives the error and context
   */
  @Resilient()
    .withRetry({ attempts: 2 })
    .withFallback((error, context) => {
      this.fallbackCalled = true;
      return `fallback-with-context: ${context.args[0]}, error: ${error.message}`;
    })
    .configure()
  public async methodWithContextAwareFallback(param: string): Promise<string> {
    this.callCount++;
    throw new AppException(
      `Failed with param ${param}`,
      ErrorType.TECHNICAL,
      'TEST_ERROR'
    );
  }

  /**
   * Method with circuit breaker only
   */
  @Resilient()
    .withCircuitBreaker({ 
      failureThreshold: 3, 
      resetTimeout: 500,
      onCircuitOpen: () => {
        this.circuitOpenRejections++;
      }
    })
    .configure()
  public async circuitBreakerOnlyMethod(shouldFail: boolean): Promise<string> {
    this.callCount++;
    
    if (shouldFail) {
      throw new AppException(
        'Circuit breaker test failure',
        ErrorType.EXTERNAL,
        'TEST_ERROR'
      );
    }
    
    return 'circuit success';
  }

  /**
   * Method with retry and error filter
   */
  @Resilient()
    .withRetry({ 
      attempts: 3,
      errorFilter: (error) => error instanceof AppException && error.type === ErrorType.EXTERNAL
    })
    .configure()
  public async retryWithFilterMethod(errorType: ErrorType): Promise<string> {
    this.callCount++;
    
    throw new AppException(
      `Error with type ${errorType}`,
      errorType,
      'TEST_ERROR'
    );
  }

  /**
   * Method with all resilience patterns and specific ordering
   */
  @Resilient()
    .withCircuitBreaker({ failureThreshold: 3, resetTimeout: 200 })
    .withRetry({ attempts: 2, baseDelay: 50 })
    .withFallback(() => {
      this.fallbackCalled = true;
      return 'comprehensive-fallback';
    })
    .configure()
  public async comprehensiveResilienceMethod(shouldFail: boolean): Promise<string> {
    this.callCount++;
    this.callTimestamps.push(Date.now());
    
    if (shouldFail) {
      throw new AppException(
        'Comprehensive test failure',
        ErrorType.TECHNICAL,
        'TEST_ERROR'
      );
    }
    
    return 'comprehensive success';
  }
}

describe('Resilient Decorator', () => {
  let mockService: MockService;

  beforeEach(async () => {
    // Create a NestJS testing module with our mock service
    const moduleRef = await Test.createTestingModule({
      providers: [MockService],
    }).compile();

    mockService = moduleRef.get<MockService>(MockService);
    mockService.reset();

    // Mock Date.now to control timing in tests
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should return successful result when method succeeds', async () => {
      const result = await mockService.resilientMethod(false);
      
      expect(result).toBe('success');
      expect(mockService.callCount).toBe(1); // Only called once, no retries
      expect(mockService.fallbackCalled).toBe(false); // Fallback not used
    });

    it('should retry and eventually return success', async () => {
      // Mock implementation to fail twice then succeed
      let attemptCount = 0;
      jest.spyOn(mockService, 'resilientMethod').mockImplementation(async () => {
        mockService.callCount++;
        mockService.callTimestamps.push(Date.now());
        
        attemptCount++;
        if (attemptCount <= 2) {
          throw new AppException(
            `Simulated failure ${attemptCount}`,
            ErrorType.TECHNICAL,
            'TEST_ERROR'
          );
        }
        
        return 'success after retry';
      });

      const result = await mockService.resilientMethod(true);
      
      expect(result).toBe('success after retry');
      expect(mockService.callCount).toBe(3); // Initial + 2 retries
    });

    it('should use fallback when retries are exhausted', async () => {
      // Always fail to trigger fallback
      const result = await mockService.resilientMethod(true);
      
      expect(result).toBe('fallback-value');
      expect(mockService.callCount).toBe(4); // Initial + 3 retries
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should open circuit after threshold failures', async () => {
      // Mock Date.now for timestamp control
      let currentTime = 1000;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

      // Fail 5 times to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        await expect(mockService.circuitBreakerOnlyMethod(true)).rejects.toThrow();
      }
      
      expect(mockService.callCount).toBe(5); // All calls executed
      
      // Next call should be rejected by circuit breaker without executing method
      await expect(mockService.circuitBreakerOnlyMethod(false)).rejects.toThrow(/circuit.*open/i);
      expect(mockService.callCount).toBe(5); // Count unchanged
      expect(mockService.circuitOpenRejections).toBe(1);
      
      // Advance time past reset timeout
      currentTime += 1000;
      
      // Circuit should be half-open, allowing one test call
      const result = await mockService.circuitBreakerOnlyMethod(false);
      expect(result).toBe('circuit success');
      expect(mockService.callCount).toBe(6);
    });

    it('should track failures across retries for circuit breaker threshold', async () => {
      // Mock Date.now for timestamp control
      let currentTime = 1000;
      jest.spyOn(Date, 'now').mockImplementation(() => {
        const time = currentTime;
        currentTime += 100; // Increment by 100ms each call
        return time;
      });

      // Fail 2 times with 2 retries each = 6 total failures (2 original + 4 retries)
      // This should trigger the circuit breaker which has threshold of 5
      await expect(mockService.comprehensiveResilienceMethod(true)).rejects.toThrow();
      await expect(mockService.comprehensiveResilienceMethod(true)).rejects.toThrow();
      
      // Verify circuit is now open
      await expect(mockService.comprehensiveResilienceMethod(false)).rejects.toThrow(/circuit.*open/i);
      
      // Verify method body wasn't called on the last attempt
      expect(mockService.callCount).toBe(6); // 2 calls with 2 retries each = 6 total
    });
  });

  describe('Fallback Functionality', () => {
    it('should provide error and context to fallback function', async () => {
      const result = await mockService.methodWithContextAwareFallback('test-param');
      
      expect(result).toContain('fallback-with-context: test-param');
      expect(result).toContain('Failed with param test-param');
      expect(mockService.fallbackCalled).toBe(true);
      expect(mockService.callCount).toBe(3); // Initial + 2 retries
    });

    it('should use fallback when circuit is open', async () => {
      // Mock implementation with circuit breaker and fallback
      class CircuitWithFallbackService {
        public callCount = 0;
        public fallbackCalled = false;
        
        @Resilient()
          .withCircuitBreaker({ failureThreshold: 3, resetTimeout: 1000 })
          .withFallback(() => {
            this.fallbackCalled = true;
            return 'circuit-open-fallback';
          })
          .configure()
        public async methodWithCircuitAndFallback(shouldFail: boolean): Promise<string> {
          this.callCount++;
          
          if (shouldFail) {
            throw new AppException(
              'Circuit test failure',
              ErrorType.TECHNICAL,
              'TEST_ERROR'
            );
          }
          
          return 'normal result';
        }
      }
      
      const service = new CircuitWithFallbackService();
      
      // Fail 3 times to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(service.methodWithCircuitAndFallback(true)).rejects.toThrow();
      }
      
      // Next call should use fallback because circuit is open
      const result = await service.methodWithCircuitAndFallback(false);
      
      expect(result).toBe('circuit-open-fallback');
      expect(service.fallbackCalled).toBe(true);
      expect(service.callCount).toBe(3); // Circuit prevented the 4th call
    });
  });

  describe('Error Filtering', () => {
    it('should only retry on errors that match the filter', async () => {
      // Should retry because EXTERNAL errors match the filter
      await expect(mockService.retryWithFilterMethod(ErrorType.EXTERNAL)).rejects.toThrow();
      expect(mockService.callCount).toBe(4); // Initial + 3 retries
      
      // Reset for next test
      mockService.reset();
      
      // Should not retry because VALIDATION errors don't match the filter
      await expect(mockService.retryWithFilterMethod(ErrorType.VALIDATION)).rejects.toThrow();
      expect(mockService.callCount).toBe(1); // Only initial call, no retries
    });
  });

  describe('Configuration API', () => {
    it('should allow fluent configuration with different ordering', async () => {
      // Define a test class with different decorator ordering
      class ConfigTestService {
        public callCount = 0;
        public fallbackCalled = false;
        
        // Order: fallback -> retry -> circuit breaker
        @Resilient()
          .withFallback(() => {
            this.fallbackCalled = true;
            return 'config-test-fallback';
          })
          .withRetry({ attempts: 2 })
          .withCircuitBreaker({ failureThreshold: 3 })
          .configure()
        public async testMethod(): Promise<string> {
          this.callCount++;
          throw new Error('Configuration test error');
        }
      }
      
      const service = new ConfigTestService();
      const result = await service.testMethod();
      
      expect(result).toBe('config-test-fallback');
      expect(service.callCount).toBe(3); // Initial + 2 retries
      expect(service.fallbackCalled).toBe(true);
    });

    it('should support direct configuration without fluent API', async () => {
      // Define a test class with direct configuration
      class DirectConfigService {
        public callCount = 0;
        
        // Direct configuration object
        @Resilient({
          retry: { attempts: 2 },
          circuitBreaker: { failureThreshold: 3 },
          fallback: () => 'direct-config-fallback'
        })
        public async directConfigMethod(): Promise<string> {
          this.callCount++;
          throw new Error('Direct configuration test error');
        }
      }
      
      const service = new DirectConfigService();
      const result = await service.directConfigMethod();
      
      expect(result).toBe('direct-config-fallback');
      expect(service.callCount).toBe(3); // Initial + 2 retries
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle errors in fallback function', async () => {
      // Define a test class with a failing fallback
      class FailingFallbackService {
        public callCount = 0;
        
        @Resilient()
          .withRetry({ attempts: 2 })
          .withFallback(() => {
            throw new Error('Fallback function error');
          })
          .configure()
        public async methodWithFailingFallback(): Promise<string> {
          this.callCount++;
          throw new Error('Original error');
        }
      }
      
      const service = new FailingFallbackService();
      
      // Should propagate the fallback error
      await expect(service.methodWithFailingFallback()).rejects.toThrow('Fallback function error');
      expect(service.callCount).toBe(3); // Initial + 2 retries
    });

    it('should handle non-AppException errors', async () => {
      // Define a test class that throws standard Error
      class StandardErrorService {
        public callCount = 0;
        
        @Resilient()
          .withRetry({ attempts: 2 })
          .withFallback(() => 'standard-error-fallback')
          .configure()
        public async methodWithStandardError(): Promise<string> {
          this.callCount++;
          throw new Error('Standard JS error');
        }
      }
      
      const service = new StandardErrorService();
      const result = await service.methodWithStandardError();
      
      expect(result).toBe('standard-error-fallback');
      expect(service.callCount).toBe(3); // Initial + 2 retries
    });
  });
});