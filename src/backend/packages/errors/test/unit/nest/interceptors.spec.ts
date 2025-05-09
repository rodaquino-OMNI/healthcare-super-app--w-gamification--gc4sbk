/**
 * @file interceptors.spec.ts
 * @description Tests for NestJS interceptors that implement advanced error recovery mechanisms
 * like retry with exponential backoff, circuit breaking, fallback execution, and request timeout handling.
 */

import { 
  Controller, 
  Get, 
  HttpException, 
  HttpStatus, 
  Injectable, 
  Module, 
  RequestTimeoutException, 
  UseInterceptors 
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { 
  TimeoutInterceptor, 
  RetryInterceptor, 
  CircuitBreakerInterceptor, 
  FallbackInterceptor 
} from '../../../src/nest/interceptors';
import { 
  Retry, 
  CircuitBreaker, 
  Fallback, 
  TimeoutConfig, 
  RetryOptions, 
  CircuitBreakerOptions, 
  FallbackOptions, 
  TimeoutOptions 
} from '../../../src/nest/decorators';
import { ErrorType } from '../../../src/types';

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
 * Mock service that can be configured to succeed or fail
 */
@Injectable()
class TestService {
  private shouldFail = false;
  private failureCount = 0;
  private delay = 0;
  private error: Error | HttpException = new HttpException('Test error', HttpStatus.INTERNAL_SERVER_ERROR);
  private cachedResult: any = { data: 'cached data' };

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setFailureCount(count: number): void {
    this.failureCount = count;
  }

  setDelay(delay: number): void {
    this.delay = delay;
  }

  setError(error: Error | HttpException): void {
    this.error = error;
  }

  setCachedResult(result: any): void {
    this.cachedResult = result;
  }

  reset(): void {
    this.shouldFail = false;
    this.failureCount = 0;
    this.delay = 0;
    this.error = new HttpException('Test error', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  // Method that will succeed or fail based on configuration
  async execute(): Promise<any> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      if (this.failureCount > 0) {
        this.failureCount--;
        if (this.failureCount === 0) {
          this.shouldFail = false;
          return { data: 'success after failures' };
        }
      }
      throw this.error;
    }

    return { data: 'success' };
  }

  // Fallback method for testing
  fallbackMethod(error: Error): any {
    return { data: 'fallback', error: error.message };
  }

  // Method that returns cached data
  getCachedData(): any {
    return this.cachedResult;
  }
}

/**
 * Test controller for TimeoutInterceptor
 */
@Controller('timeout')
class TimeoutController {
  constructor(private readonly service: TestService) {}

  @TimeoutConfig({ timeout: 1000 })
  @UseInterceptors(TimeoutInterceptor)
  @Get('default')
  async defaultTimeout(): Promise<any> {
    return this.service.execute();
  }

  @TimeoutConfig({ 
    timeout: 500, 
    message: 'Custom timeout message', 
    cancelOnTimeout: false,
    onTimeout: jest.fn()
  })
  @UseInterceptors(TimeoutInterceptor)
  @Get('custom')
  async customTimeout(): Promise<any> {
    return this.service.execute();
  }
}

/**
 * Test controller for RetryInterceptor
 */
@Controller('retry')
class RetryController {
  constructor(private readonly service: TestService) {}

  @Retry({ attempts: 3, initialDelay: 100, backoffFactor: 2 })
  @UseInterceptors(RetryInterceptor)
  @Get('default')
  async defaultRetry(): Promise<any> {
    return this.service.execute();
  }

  @Retry({
    attempts: 5,
    initialDelay: 50,
    backoffFactor: 1.5,
    maxDelay: 500,
    useJitter: false,
    retryableErrors: [ErrorType.EXTERNAL],
    onRetry: jest.fn()
  })
  @UseInterceptors(RetryInterceptor)
  @Get('custom')
  async customRetry(): Promise<any> {
    return this.service.execute();
  }

  @Retry({
    attempts: 3,
    retryPredicate: (error) => error instanceof HttpException && error.getStatus() === HttpStatus.BAD_GATEWAY
  })
  @UseInterceptors(RetryInterceptor)
  @Get('predicate')
  async predicateRetry(): Promise<any> {
    return this.service.execute();
  }
}

/**
 * Test controller for CircuitBreakerInterceptor
 */
@Controller('circuit-breaker')
class CircuitBreakerController {
  constructor(private readonly service: TestService) {}

  @CircuitBreaker({ failureThreshold: 3, resetTimeout: 1000 })
  @UseInterceptors(CircuitBreakerInterceptor)
  @Get('default')
  async defaultCircuitBreaker(): Promise<any> {
    return this.service.execute();
  }

  @CircuitBreaker({
    failureThreshold: 2,
    resetTimeout: 500,
    successThreshold: 1,
    tripErrors: [ErrorType.EXTERNAL],
    name: 'custom-circuit',
    onStateChange: jest.fn()
  })
  @UseInterceptors(CircuitBreakerInterceptor)
  @Get('custom')
  async customCircuitBreaker(): Promise<any> {
    return this.service.execute();
  }

  @CircuitBreaker({
    failureThreshold: 2,
    tripPredicate: (error) => error instanceof HttpException && error.getStatus() === HttpStatus.BAD_GATEWAY
  })
  @UseInterceptors(CircuitBreakerInterceptor)
  @Get('predicate')
  async predicateCircuitBreaker(): Promise<any> {
    return this.service.execute();
  }
}

/**
 * Test controller for FallbackInterceptor
 */
@Controller('fallback')
class FallbackController {
  constructor(private readonly service: TestService) {}

  @Fallback({ methodName: 'fallbackMethod' })
  @UseInterceptors(FallbackInterceptor)
  @Get('method')
  async methodFallback(): Promise<any> {
    return this.service.execute();
  }

  fallbackMethod(error: Error): any {
    return this.service.fallbackMethod(error);
  }

  @Fallback({
    fallbackFn: (error) => ({ data: 'function fallback', error: error.message }),
    fallbackErrors: [ErrorType.EXTERNAL],
    fallbackPredicate: (error) => error instanceof HttpException && error.getStatus() === HttpStatus.BAD_GATEWAY
  })
  @UseInterceptors(FallbackInterceptor)
  @Get('function')
  async functionFallback(): Promise<any> {
    return this.service.execute();
  }

  @Fallback({
    useCachedData: true,
    maxCacheAge: 60000
  })
  @UseInterceptors(FallbackInterceptor)
  @Get('cached')
  async cachedFallback(): Promise<any> {
    return this.service.execute();
  }
}

/**
 * Test controller for combined interceptors
 */
@Controller('combined')
class CombinedController {
  constructor(private readonly service: TestService) {}

  @TimeoutConfig({ timeout: 2000 })
  @Retry({ attempts: 3, initialDelay: 100 })
  @CircuitBreaker({ failureThreshold: 3, resetTimeout: 1000 })
  @Fallback({ methodName: 'fallbackMethod' })
  @UseInterceptors(TimeoutInterceptor, RetryInterceptor, CircuitBreakerInterceptor, FallbackInterceptor)
  @Get('all')
  async allInterceptors(): Promise<any> {
    return this.service.execute();
  }

  fallbackMethod(error: Error): any {
    return this.service.fallbackMethod(error);
  }
}

/**
 * Test module that provides all controllers and services
 */
@Module({
  controllers: [
    TimeoutController,
    RetryController,
    CircuitBreakerController,
    FallbackController,
    CombinedController
  ],
  providers: [TestService, Reflector]
})
class TestModule {}

describe('Error Handling Interceptors', () => {
  let moduleRef: TestingModule;
  let testService: TestService;
  let timeoutController: TimeoutController;
  let retryController: RetryController;
  let circuitBreakerController: CircuitBreakerController;
  let fallbackController: FallbackController;
  let combinedController: CombinedController;

  beforeEach(async () => {
    // Reset any mocks
    jest.clearAllMocks();

    // Create the testing module
    moduleRef = await Test.createTestingModule({
      imports: [TestModule]
    }).compile();

    // Get the service and controllers
    testService = moduleRef.get<TestService>(TestService);
    timeoutController = moduleRef.get<TimeoutController>(TimeoutController);
    retryController = moduleRef.get<RetryController>(RetryController);
    circuitBreakerController = moduleRef.get<CircuitBreakerController>(CircuitBreakerController);
    fallbackController = moduleRef.get<FallbackController>(FallbackController);
    combinedController = moduleRef.get<CombinedController>(CombinedController);

    // Reset the service before each test
    testService.reset();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  describe('TimeoutInterceptor', () => {
    it('should allow requests that complete within the timeout', async () => {
      testService.setDelay(500);
      const result = await timeoutController.defaultTimeout();
      expect(result).toEqual({ data: 'success' });
    });

    it('should throw a timeout exception when requests exceed the timeout', async () => {
      testService.setDelay(2000);
      await expect(timeoutController.defaultTimeout()).rejects.toThrow(RequestTimeoutException);
    });

    it('should use custom timeout message when provided', async () => {
      testService.setDelay(1000);
      try {
        await timeoutController.customTimeout();
        fail('Expected timeout exception');
      } catch (error) {
        expect(error).toBeInstanceOf(RequestTimeoutException);
        expect(error.message).toBe('Custom timeout message');
      }
    });

    it('should set the error type to TIMEOUT', async () => {
      testService.setDelay(2000);
      try {
        await timeoutController.defaultTimeout();
        fail('Expected timeout exception');
      } catch (error) {
        expect(error['type']).toBe(ErrorType.TIMEOUT);
      }
    });
  });

  describe('RetryInterceptor', () => {
    it('should retry failed operations and eventually succeed', async () => {
      // Configure service to fail twice then succeed
      testService.setShouldFail(true);
      testService.setFailureCount(2);

      const result = await retryController.defaultRetry();
      expect(result).toEqual({ data: 'success after failures' });
    });

    it('should respect the maximum number of retry attempts', async () => {
      // Configure service to always fail
      testService.setShouldFail(true);
      testService.setFailureCount(10); // More than the retry attempts

      await expect(retryController.defaultRetry()).rejects.toThrow('Test error');
    });

    it('should only retry errors that match the retryable errors', async () => {
      // Configure service to fail with an error that doesn't match the retryable errors
      testService.setShouldFail(true);
      testService.setError(new HttpException('Not retryable', HttpStatus.BAD_REQUEST));

      await expect(retryController.customRetry()).rejects.toThrow('Not retryable');
    });

    it('should use the retry predicate when provided', async () => {
      // Configure service to fail with an error that matches the retry predicate
      testService.setShouldFail(true);
      testService.setError(new HttpException('Retryable', HttpStatus.BAD_GATEWAY));
      testService.setFailureCount(2);

      const result = await retryController.predicateRetry();
      expect(result).toEqual({ data: 'success after failures' });

      // Configure service to fail with an error that doesn't match the retry predicate
      testService.setShouldFail(true);
      testService.setError(new HttpException('Not retryable', HttpStatus.BAD_REQUEST));

      await expect(retryController.predicateRetry()).rejects.toThrow('Not retryable');
    });
  });

  describe('CircuitBreakerInterceptor', () => {
    it('should allow requests when the circuit is closed', async () => {
      const result = await circuitBreakerController.defaultCircuitBreaker();
      expect(result).toEqual({ data: 'success' });
    });

    it('should open the circuit after reaching the failure threshold', async () => {
      // Configure service to always fail
      testService.setShouldFail(true);

      // First failure
      await expect(circuitBreakerController.defaultCircuitBreaker()).rejects.toThrow('Test error');
      // Second failure
      await expect(circuitBreakerController.defaultCircuitBreaker()).rejects.toThrow('Test error');
      // Third failure - should open the circuit
      await expect(circuitBreakerController.defaultCircuitBreaker()).rejects.toThrow('Test error');

      // Now the circuit should be open, and requests should fail fast
      try {
        await circuitBreakerController.defaultCircuitBreaker();
        fail('Expected circuit to be open');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        expect(error['type']).toBe(ErrorType.SERVICE_UNAVAILABLE);
      }
    });

    it('should transition to half-open state after the reset timeout', async () => {
      // Configure service to always fail
      testService.setShouldFail(true);

      // Fail enough times to open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(circuitBreakerController.customCircuitBreaker()).rejects.toThrow('Test error');
      }

      // Circuit should be open now, wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 600));

      // Configure service to succeed now
      testService.setShouldFail(false);

      // Circuit should be half-open, allowing one test request
      const result = await circuitBreakerController.customCircuitBreaker();
      expect(result).toEqual({ data: 'success' });

      // Circuit should be closed now, allowing multiple requests
      const result2 = await circuitBreakerController.customCircuitBreaker();
      expect(result2).toEqual({ data: 'success' });
    });

    it('should use the trip predicate when provided', async () => {
      // Configure service to fail with an error that matches the trip predicate
      testService.setShouldFail(true);
      testService.setError(new HttpException('Trip error', HttpStatus.BAD_GATEWAY));

      // Fail enough times to open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(circuitBreakerController.predicateCircuitBreaker()).rejects.toThrow('Trip error');
      }

      // Circuit should be open now
      try {
        await circuitBreakerController.predicateCircuitBreaker();
        fail('Expected circuit to be open');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      }

      // Configure service to fail with an error that doesn't match the trip predicate
      testService.setError(new HttpException('Non-trip error', HttpStatus.BAD_REQUEST));

      // Reset the circuit breaker state for this test
      // In a real application, each circuit breaker would have its own state
      jest.resetModules();
      await moduleRef.close();
      moduleRef = await Test.createTestingModule({
        imports: [TestModule]
      }).compile();
      testService = moduleRef.get<TestService>(TestService);
      circuitBreakerController = moduleRef.get<CircuitBreakerController>(CircuitBreakerController);
      testService.setShouldFail(true);
      testService.setError(new HttpException('Non-trip error', HttpStatus.BAD_REQUEST));

      // This should not open the circuit even after multiple failures
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreakerController.predicateCircuitBreaker()).rejects.toThrow('Non-trip error');
      }

      // Circuit should still be closed
      testService.setShouldFail(false);
      const result = await circuitBreakerController.predicateCircuitBreaker();
      expect(result).toEqual({ data: 'success' });
    });
  });

  describe('FallbackInterceptor', () => {
    it('should use the fallback method when the primary method fails', async () => {
      // Configure service to fail
      testService.setShouldFail(true);

      const result = await fallbackController.methodFallback();
      expect(result).toEqual({ data: 'fallback', error: 'Test error' });
    });

    it('should use the fallback function when provided', async () => {
      // Configure service to fail with an error that matches the fallback predicate
      testService.setShouldFail(true);
      testService.setError(new HttpException('Fallback error', HttpStatus.BAD_GATEWAY));

      const result = await fallbackController.functionFallback();
      expect(result).toEqual({ data: 'function fallback', error: 'Fallback error' });
    });

    it('should not use fallback for errors that don\'t match the fallback predicate', async () => {
      // Configure service to fail with an error that doesn't match the fallback predicate
      testService.setShouldFail(true);
      testService.setError(new HttpException('Non-fallback error', HttpStatus.BAD_REQUEST));

      await expect(fallbackController.functionFallback()).rejects.toThrow('Non-fallback error');
    });

    it('should use cached data when configured', async () => {
      // First make a successful call to cache the result
      const initialResult = await fallbackController.cachedFallback();
      expect(initialResult).toEqual({ data: 'success' });

      // Configure service to fail
      testService.setShouldFail(true);

      // Now the fallback should use the cached result
      const fallbackResult = await fallbackController.cachedFallback();
      expect(fallbackResult).toEqual({ data: 'success' });

      // Change the cached result
      testService.setCachedResult({ data: 'new cached data' });

      // The fallback should still use the previously cached result, not the new one
      const secondFallbackResult = await fallbackController.cachedFallback();
      expect(secondFallbackResult).toEqual({ data: 'success' });
    });
  });

  describe('Combined Interceptors', () => {
    it('should work together in the correct order', async () => {
      // Configure service to fail twice then succeed
      testService.setShouldFail(true);
      testService.setFailureCount(2);

      // RetryInterceptor should retry and eventually succeed
      const result = await combinedController.allInterceptors();
      expect(result).toEqual({ data: 'success after failures' });

      // Reset and configure service to always fail
      testService.reset();
      testService.setShouldFail(true);
      testService.setFailureCount(10); // More than the retry attempts

      // RetryInterceptor should exhaust retries, then FallbackInterceptor should provide fallback
      const fallbackResult = await combinedController.allInterceptors();
      expect(fallbackResult).toEqual({ data: 'fallback', error: 'Test error' });

      // Reset and configure service to timeout
      testService.reset();
      testService.setDelay(3000); // More than the timeout

      // TimeoutInterceptor should timeout, then FallbackInterceptor should provide fallback
      const timeoutResult = await combinedController.allInterceptors();
      expect(timeoutResult).toEqual({ data: 'fallback', error: 'Request timed out' });

      // Reset and configure service to fail enough to open the circuit
      testService.reset();
      testService.setShouldFail(true);

      // Fail enough times to open the circuit
      for (let i = 0; i < 3; i++) {
        await combinedController.allInterceptors(); // These will use fallback after retries
      }

      // Circuit should be open now, but FallbackInterceptor should still provide fallback
      const circuitOpenResult = await combinedController.allInterceptors();
      expect(circuitOpenResult).toEqual({ data: 'fallback', error: expect.stringContaining('unavailable') });
    });
  });
});