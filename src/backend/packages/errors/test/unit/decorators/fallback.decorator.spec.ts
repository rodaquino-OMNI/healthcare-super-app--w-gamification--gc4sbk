import { Test } from '@nestjs/testing';
import { jest } from '@jest/globals';

// Import the decorators to test
import { WithFallback, CachedFallback, DefaultFallback } from '../../../src/decorators/fallback.decorator';
import { AppException, ErrorType } from '../../../src/categories/app.exception';
import { LoggerService } from '@austa/logging';

/**
 * Mock logger service for testing
 */
class MockLoggerService implements Partial<LoggerService> {
  public logs: Array<{ level: string; message: string; context?: string; trace?: string }> = [];

  debug(message: string, context?: string): void {
    this.logs.push({ level: 'debug', message, context });
  }

  log(message: string, context?: string): void {
    this.logs.push({ level: 'log', message, context });
  }

  warn(message: string, context?: string): void {
    this.logs.push({ level: 'warn', message, context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logs.push({ level: 'error', message, context, trace });
  }

  reset(): void {
    this.logs = [];
  }
}

/**
 * Mock service with methods that use fallback decorators
 */
class MockService {
  // For tracking method calls
  public methodCallCount = 0;
  public fallbackCallCount = 0;
  public cachedResults: Map<string, any> = new Map();

  constructor(private readonly logger: LoggerService) {}

  // Reset tracking data
  public reset(): void {
    this.methodCallCount = 0;
    this.fallbackCallCount = 0;
    this.cachedResults.clear();
  }

  /**
   * Method with a function fallback that returns a different value
   */
  @WithFallback({
    fallbackFn: function(error, methodName, args) {
      // 'this' should be bound to the service instance
      this.fallbackCallCount++;
      this.logger.warn(`Executing fallback for ${methodName} with args: ${JSON.stringify(args)}`);
      return `Fallback result for ${args[0]}`;
    }
  })
  public async methodWithFunctionFallback(param: string, shouldFail = false): Promise<string> {
    this.methodCallCount++;
    
    if (shouldFail) {
      throw new AppException(
        'Simulated failure in methodWithFunctionFallback',
        ErrorType.TECHNICAL,
        'TEST_ERROR'
      );
    }
    
    return `Original result for ${param}`;
  }

  /**
   * Method with a cached fallback that stores previous successful results
   */
  @CachedFallback({
    ttlMs: 5000, // Cache results for 5 seconds
    cacheKeyFn: (args) => args[0] // Use first argument as cache key
  })
  public async methodWithCachedFallback(param: string, shouldFail = false): Promise<string> {
    this.methodCallCount++;
    
    if (shouldFail) {
      throw new AppException(
        'Simulated failure in methodWithCachedFallback',
        ErrorType.TECHNICAL,
        'TEST_ERROR'
      );
    }
    
    const result = `Original result for ${param}`;
    // Store in our test cache to verify later
    this.cachedResults.set(param, result);
    return result;
  }

  /**
   * Method with a short TTL cached fallback
   */
  @CachedFallback({
    ttlMs: 100, // Very short TTL for testing expiration
    cacheKeyFn: (args) => args[0]
  })
  public async methodWithShortTtlCache(param: string, shouldFail = false): Promise<string> {
    this.methodCallCount++;
    
    if (shouldFail) {
      throw new AppException(
        'Simulated failure in methodWithShortTtlCache',
        ErrorType.TECHNICAL,
        'TEST_ERROR'
      );
    }
    
    const result = `Original result for ${param}`;
    this.cachedResults.set(param, result);
    return result;
  }

  /**
   * Method with a default value fallback
   */
  @DefaultFallback({
    defaultValue: { status: 'degraded', data: [] }
  })
  public async methodWithDefaultFallback(shouldFail = false): Promise<any> {
    this.methodCallCount++;
    
    if (shouldFail) {
      throw new AppException(
        'Simulated failure in methodWithDefaultFallback',
        ErrorType.TECHNICAL,
        'TEST_ERROR'
      );
    }
    
    return { status: 'success', data: [1, 2, 3] };
  }

  /**
   * Method with no fallback for testing error propagation
   */
  public async methodWithNoFallback(shouldFail = false): Promise<string> {
    this.methodCallCount++;
    
    if (shouldFail) {
      throw new AppException(
        'Simulated failure in methodWithNoFallback',
        ErrorType.TECHNICAL,
        'TEST_ERROR'
      );
    }
    
    return 'Original result';
  }

  /**
   * Method with fallback that filters errors
   */
  @WithFallback({
    fallbackFn: function() {
      this.fallbackCallCount++;
      return 'Fallback for external error';
    },
    errorFilter: (error) => error instanceof AppException && error.type === ErrorType.EXTERNAL
  })
  public async methodWithErrorFilter(errorType: ErrorType): Promise<string> {
    this.methodCallCount++;
    
    throw new AppException(
      `Simulated failure with type ${errorType}`,
      errorType,
      'TEST_ERROR'
    );
  }
}

describe('Fallback Decorators', () => {
  let mockService: MockService;
  let mockLogger: MockLoggerService;

  beforeEach(async () => {
    mockLogger = new MockLoggerService();
    
    // Create a NestJS testing module with our mock service
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LoggerService,
          useValue: mockLogger
        },
        MockService
      ],
    }).compile();

    mockService = moduleRef.get<MockService>(MockService);
    mockService.reset();
    mockLogger.reset();
  });

  describe('WithFallback Decorator', () => {
    it('should execute the original method when it succeeds', async () => {
      const result = await mockService.methodWithFunctionFallback('test', false);
      
      expect(result).toBe('Original result for test');
      expect(mockService.methodCallCount).toBe(1);
      expect(mockService.fallbackCallCount).toBe(0);
    });

    it('should execute the fallback function when the original method fails', async () => {
      const result = await mockService.methodWithFunctionFallback('test', true);
      
      expect(result).toBe('Fallback result for test');
      expect(mockService.methodCallCount).toBe(1);
      expect(mockService.fallbackCallCount).toBe(1);
    });

    it('should log when fallback is executed', async () => {
      await mockService.methodWithFunctionFallback('test', true);
      
      const warnLogs = mockLogger.logs.filter(log => log.level === 'warn');
      expect(warnLogs.length).toBeGreaterThan(0);
      expect(warnLogs[0].message).toContain('Executing fallback for methodWithFunctionFallback');
    });

    it('should only execute fallback for errors that match the filter', async () => {
      // Should execute fallback for EXTERNAL errors
      const externalResult = await mockService.methodWithErrorFilter(ErrorType.EXTERNAL);
      expect(externalResult).toBe('Fallback for external error');
      expect(mockService.fallbackCallCount).toBe(1);

      // Reset counters
      mockService.reset();

      // Should not execute fallback for VALIDATION errors
      await expect(mockService.methodWithErrorFilter(ErrorType.VALIDATION)).rejects.toThrow();
      expect(mockService.fallbackCallCount).toBe(0);
    });
  });

  describe('CachedFallback Decorator', () => {
    it('should execute the original method when it succeeds', async () => {
      const result = await mockService.methodWithCachedFallback('test', false);
      
      expect(result).toBe('Original result for test');
      expect(mockService.methodCallCount).toBe(1);
      expect(mockService.cachedResults.get('test')).toBe('Original result for test');
    });

    it('should return cached result when the original method fails', async () => {
      // First call succeeds and caches the result
      await mockService.methodWithCachedFallback('test', false);
      expect(mockService.methodCallCount).toBe(1);
      
      // Reset call count
      mockService.methodCallCount = 0;
      
      // Second call fails but uses cached result
      const result = await mockService.methodWithCachedFallback('test', true);
      
      expect(result).toBe('Original result for test');
      expect(mockService.methodCallCount).toBe(1); // Method was called but failed
    });

    it('should propagate error when no cached result is available', async () => {
      // First call fails, no cache available
      await expect(mockService.methodWithCachedFallback('test', true)).rejects.toThrow(
        'Simulated failure in methodWithCachedFallback'
      );
      expect(mockService.methodCallCount).toBe(1);
    });

    it('should respect TTL and expire cached results', async () => {
      // First call succeeds and caches the result
      await mockService.methodWithShortTtlCache('test', false);
      expect(mockService.methodCallCount).toBe(1);
      
      // Reset call count
      mockService.methodCallCount = 0;
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Call fails and cache is expired, should throw
      await expect(mockService.methodWithShortTtlCache('test', true)).rejects.toThrow(
        'Simulated failure in methodWithShortTtlCache'
      );
      expect(mockService.methodCallCount).toBe(1);
    });

    it('should use the cacheKeyFn to determine cache keys', async () => {
      // Cache results for two different parameters
      await mockService.methodWithCachedFallback('key1', false);
      await mockService.methodWithCachedFallback('key2', false);
      
      // Reset call count
      mockService.methodCallCount = 0;
      
      // Both should have separate cache entries
      const result1 = await mockService.methodWithCachedFallback('key1', true);
      const result2 = await mockService.methodWithCachedFallback('key2', true);
      
      expect(result1).toBe('Original result for key1');
      expect(result2).toBe('Original result for key2');
      expect(mockService.methodCallCount).toBe(2); // Both methods called but used cache
    });
  });

  describe('DefaultFallback Decorator', () => {
    it('should execute the original method when it succeeds', async () => {
      const result = await mockService.methodWithDefaultFallback(false);
      
      expect(result).toEqual({ status: 'success', data: [1, 2, 3] });
      expect(mockService.methodCallCount).toBe(1);
    });

    it('should return the default value when the original method fails', async () => {
      const result = await mockService.methodWithDefaultFallback(true);
      
      expect(result).toEqual({ status: 'degraded', data: [] });
      expect(mockService.methodCallCount).toBe(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should propagate errors when no fallback is configured', async () => {
      await expect(mockService.methodWithNoFallback(true)).rejects.toThrow(
        'Simulated failure in methodWithNoFallback'
      );
      expect(mockService.methodCallCount).toBe(1);
    });

    it('should preserve the original error context in logs', async () => {
      // Attempt to call method with fallback
      await mockService.methodWithFunctionFallback('test', true);
      
      // Check that error logs contain the original error information
      const errorLogs = mockLogger.logs.filter(log => log.level === 'error');
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].message).toContain('Simulated failure');
    });

    it('should handle errors thrown by the fallback function itself', async () => {
      // Create a service with a fallback that throws an error
      class BrokenFallbackService {
        @WithFallback({
          fallbackFn: () => {
            throw new Error('Fallback function failed');
          }
        })
        public async methodWithBrokenFallback(): Promise<string> {
          throw new Error('Original method failed');
        }
      }

      const brokenService = new BrokenFallbackService();

      // Should propagate the fallback error
      await expect(brokenService.methodWithBrokenFallback()).rejects.toThrow('Fallback function failed');
    });
  });
});