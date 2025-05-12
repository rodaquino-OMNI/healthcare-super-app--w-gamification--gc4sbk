import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Module, Controller, Get, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import * as request from 'supertest';
import { ErrorsModule } from '../../src/nest/module';
import { Retry, CircuitBreaker, Fallback } from '../../src/nest/decorators';
import { BaseError } from '../../src/base';
import { ErrorType } from '../../src/types';

/**
 * Custom error for testing transient failures
 */
class TransientError extends BaseError {
  constructor(message: string) {
    super({
      message,
      type: ErrorType.EXTERNAL,
      code: 'TRANSIENT_ERROR',
      isRetryable: true
    });
  }
}

/**
 * Custom error for testing permanent failures
 */
class PermanentError extends BaseError {
  constructor(message: string) {
    super({
      message,
      type: ErrorType.EXTERNAL,
      code: 'PERMANENT_ERROR',
      isRetryable: false
    });
  }
}

/**
 * Service with methods decorated with recovery strategies
 */
@Injectable()
class TestService {
  // Track call counts for verification
  public retryCallCount = 0;
  public circuitBreakerCallCount = 0;
  public fallbackCallCount = 0;
  
  // Track circuit breaker state
  public circuitOpen = false;
  
  // Reset all counters for clean test state
  resetCounters() {
    this.retryCallCount = 0;
    this.circuitBreakerCallCount = 0;
    this.fallbackCallCount = 0;
    this.circuitOpen = false;
  }

  /**
   * Method that fails with a transient error for the first N calls,
   * then succeeds. Used to test retry behavior.
   */
  @Retry({
    maxAttempts: 3,
    delay: 100,
    backoffFactor: 2,
    retryableErrors: [TransientError]
  })
  async retryableOperation(failCount: number): Promise<string> {
    this.retryCallCount++;
    
    if (this.retryCallCount <= failCount) {
      throw new TransientError(`Transient failure ${this.retryCallCount}`);
    }
    
    return 'Retry operation succeeded';
  }

  /**
   * Method that consistently fails with a permanent error.
   * Used to test that non-retryable errors are not retried.
   */
  @Retry({
    maxAttempts: 3,
    delay: 100,
    retryableErrors: [TransientError]
  })
  async nonRetryableOperation(): Promise<string> {
    this.retryCallCount++;
    throw new PermanentError('Permanent failure');
  }

  /**
   * Method protected by a circuit breaker that fails consistently.
   * Used to test circuit breaker state transitions.
   */
  @CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 1000,
    fallbackResponse: 'Circuit open response'
  })
  async circuitBreakerOperation(shouldFail: boolean): Promise<string> {
    this.circuitBreakerCallCount++;
    
    if (shouldFail) {
      throw new TransientError('Service temporarily unavailable');
    }
    
    return 'Circuit breaker operation succeeded';
  }

  /**
   * Method with a fallback strategy that returns a default value when the primary operation fails.
   */
  @Fallback({
    fallbackFn: async (error, context) => {
      // Increment fallback call count for verification
      (context.instance as TestService).fallbackCallCount++;
      return 'Fallback response';
    }
  })
  async operationWithFallback(shouldFail: boolean): Promise<string> {
    if (shouldFail) {
      throw new TransientError('Primary operation failed');
    }
    
    return 'Primary operation succeeded';
  }

  /**
   * Method that combines retry, circuit breaker, and fallback strategies.
   * Tests the interaction between different recovery mechanisms.
   */
  @Retry({
    maxAttempts: 2,
    delay: 100,
    retryableErrors: [TransientError]
  })
  @CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 1000
  })
  @Fallback({
    fallbackFn: async () => 'Combined fallback response'
  })
  async combinedRecoveryOperation(shouldFail: boolean): Promise<string> {
    this.retryCallCount++;
    this.circuitBreakerCallCount++;
    
    if (shouldFail) {
      throw new TransientError('Operation failed');
    }
    
    return 'Combined operation succeeded';
  }
}

/**
 * Controller exposing the test service methods as HTTP endpoints
 */
@Controller('test')
class TestController {
  constructor(private readonly testService: TestService) {}

  @Get('retry')
  async testRetry(): Promise<string> {
    return this.testService.retryableOperation(2);
  }

  @Get('retry-fail')
  async testRetryFail(): Promise<string> {
    return this.testService.retryableOperation(5); // Will fail even with retries
  }

  @Get('non-retryable')
  async testNonRetryable(): Promise<string> {
    return this.testService.nonRetryableOperation();
  }

  @Get('circuit-breaker')
  async testCircuitBreaker(): Promise<string> {
    return this.testService.circuitBreakerOperation(true); // Will fail
  }

  @Get('circuit-breaker-success')
  async testCircuitBreakerSuccess(): Promise<string> {
    return this.testService.circuitBreakerOperation(false); // Will succeed
  }

  @Get('fallback')
  async testFallback(): Promise<string> {
    return this.testService.operationWithFallback(true); // Will use fallback
  }

  @Get('fallback-success')
  async testFallbackSuccess(): Promise<string> {
    return this.testService.operationWithFallback(false); // Will succeed
  }

  @Get('combined')
  async testCombined(): Promise<string> {
    return this.testService.combinedRecoveryOperation(true); // Will use all recovery strategies
  }

  @Get('reset')
  async resetCounters(): Promise<string> {
    this.testService.resetCounters();
    return 'Counters reset';
  }
}

/**
 * Test module that provides the test service and controller
 */
@Module({
  imports: [ErrorsModule.forRoot()],
  controllers: [TestController],
  providers: [TestService]
})
class TestModule {}

describe('Recovery Strategies (e2e)', () => {
  let app;
  let moduleRef: TestingModule;
  let testService: TestService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleRef.createNestApplication();
    
    // Get the HttpAdapter to properly handle exceptions
    const httpAdapter = app.get(HttpAdapterHost);
    
    await app.init();
    
    testService = moduleRef.get<TestService>(TestService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Reset counters before each test
    await request(app.getHttpServer()).get('/test/reset');
  });

  describe('Retry with exponential backoff', () => {
    it('should retry transient failures and eventually succeed', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/retry')
        .expect(HttpStatus.OK);

      expect(response.text).toBe('Retry operation succeeded');
      expect(testService.retryCallCount).toBe(3); // Initial call + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      await request(app.getHttpServer())
        .get('/test/non-retryable')
        .expect(HttpStatus.BAD_GATEWAY); // External error type maps to 502

      expect(testService.retryCallCount).toBe(1); // Only the initial call, no retries
    });

    it('should fail after exhausting all retry attempts', async () => {
      await request(app.getHttpServer())
        .get('/test/retry-fail')
        .expect(HttpStatus.BAD_GATEWAY); // External error type maps to 502

      expect(testService.retryCallCount).toBe(4); // Initial call + 3 retries
    });
  });

  describe('Circuit Breaker pattern', () => {
    it('should open the circuit after reaching the failure threshold', async () => {
      // Make multiple failing requests to trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .get('/test/circuit-breaker')
          .expect(HttpStatus.BAD_GATEWAY);
      }

      // Circuit should be open now, request should fail fast without calling the service
      const beforeCount = testService.circuitBreakerCallCount;
      
      const response = await request(app.getHttpServer())
        .get('/test/circuit-breaker')
        .expect(HttpStatus.SERVICE_UNAVAILABLE); // Circuit open response

      expect(response.body.error.code).toBe('CIRCUIT_OPEN');
      expect(testService.circuitBreakerCallCount).toBe(beforeCount); // Count shouldn't increase when circuit is open
    });

    it('should transition to half-open state after reset timeout and test with a real request', async () => {
      // Make multiple failing requests to trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .get('/test/circuit-breaker')
          .expect(HttpStatus.BAD_GATEWAY);
      }

      // Circuit should be open now
      await request(app.getHttpServer())
        .get('/test/circuit-breaker')
        .expect(HttpStatus.SERVICE_UNAVAILABLE);

      // Wait for the circuit to transition to half-open state
      await new Promise(resolve => setTimeout(resolve, 1100));

      // The next request should be allowed through (half-open state)
      const beforeCount = testService.circuitBreakerCallCount;
      
      await request(app.getHttpServer())
        .get('/test/circuit-breaker-success')
        .expect(HttpStatus.OK);

      expect(testService.circuitBreakerCallCount).toBe(beforeCount + 1); // Count should increase for the test request
    });

    it('should close the circuit after a successful request in half-open state', async () => {
      // Make multiple failing requests to trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .get('/test/circuit-breaker')
          .expect(HttpStatus.BAD_GATEWAY);
      }

      // Circuit should be open now
      await request(app.getHttpServer())
        .get('/test/circuit-breaker')
        .expect(HttpStatus.SERVICE_UNAVAILABLE);

      // Wait for the circuit to transition to half-open state
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Send a successful request to close the circuit
      await request(app.getHttpServer())
        .get('/test/circuit-breaker-success')
        .expect(HttpStatus.OK);

      // Circuit should be closed now, multiple requests should be allowed
      const beforeCount = testService.circuitBreakerCallCount;
      
      await request(app.getHttpServer())
        .get('/test/circuit-breaker-success')
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .get('/test/circuit-breaker-success')
        .expect(HttpStatus.OK);

      expect(testService.circuitBreakerCallCount).toBe(beforeCount + 2); // Count should increase for both requests
    });
  });

  describe('Fallback mechanisms', () => {
    it('should execute fallback strategy when primary operation fails', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/fallback')
        .expect(HttpStatus.OK); // Fallback should return 200 OK

      expect(response.text).toBe('Fallback response');
      expect(testService.fallbackCallCount).toBe(1);
    });

    it('should not execute fallback when primary operation succeeds', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/fallback-success')
        .expect(HttpStatus.OK);

      expect(response.text).toBe('Primary operation succeeded');
      expect(testService.fallbackCallCount).toBe(0); // Fallback should not be called
    });
  });

  describe('Combined recovery strategies', () => {
    it('should apply retry, then circuit breaker, then fallback in sequence', async () => {
      // First request should retry, then use fallback
      const response1 = await request(app.getHttpServer())
        .get('/test/combined')
        .expect(HttpStatus.OK);

      expect(response1.text).toBe('Combined fallback response');
      expect(testService.retryCallCount).toBe(3); // Initial + 2 retries
      expect(testService.circuitBreakerCallCount).toBe(3); // Same count as retries

      // Reset counters
      await request(app.getHttpServer()).get('/test/reset');

      // Make multiple failing requests to trigger circuit breaker
      for (let i = 0; i < 2; i++) {
        await request(app.getHttpServer())
          .get('/test/combined')
          .expect(HttpStatus.OK); // Should still return OK because of fallback
      }

      // Circuit should be open now, fallback should be used without retrying
      const beforeRetryCount = testService.retryCallCount;
      const beforeCircuitCount = testService.circuitBreakerCallCount;
      
      const response2 = await request(app.getHttpServer())
        .get('/test/combined')
        .expect(HttpStatus.OK);

      expect(response2.text).toBe('Combined fallback response');
      expect(testService.retryCallCount).toBe(beforeRetryCount); // Shouldn't increase when circuit is open
      expect(testService.circuitBreakerCallCount).toBe(beforeCircuitCount); // Shouldn't increase when circuit is open
    });
  });
});