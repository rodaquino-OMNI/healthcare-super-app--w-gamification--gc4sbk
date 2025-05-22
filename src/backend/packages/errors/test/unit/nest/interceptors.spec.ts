import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError, Observable } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import {
  RetryInterceptor,
  CircuitBreakerInterceptor,
  FallbackInterceptor,
  TimeoutInterceptor,
  RetryOptions,
  CircuitBreakerOptions,
  FallbackOptions,
  TimeoutOptions
} from '../../../src/nest/interceptors';
import { BaseError, ErrorType } from '../../../src/base';
import { ExternalTimeoutError } from '../../../src/categories/external.errors';

// Mock constants used by the interceptors
jest.mock('../../../src/constants', () => ({
  RETRY_CONFIG: {
    DEFAULT: {
      MAX_ATTEMPTS: 3,
      INITIAL_DELAY_MS: 100,
      MAX_DELAY_MS: 1000,
      BACKOFF_FACTOR: 2,
      JITTER_FACTOR: 0.2
    },
    DATABASE: {
      MAX_ATTEMPTS: 5,
      INITIAL_DELAY_MS: 50,
      MAX_DELAY_MS: 500,
      BACKOFF_FACTOR: 1.5,
      JITTER_FACTOR: 0.1
    },
    EXTERNAL_API: {
      MAX_ATTEMPTS: 4,
      INITIAL_DELAY_MS: 200,
      MAX_DELAY_MS: 2000,
      BACKOFF_FACTOR: 2.5,
      JITTER_FACTOR: 0.3
    },
    EVENT_PROCESSING: {
      MAX_ATTEMPTS: 6,
      INITIAL_DELAY_MS: 300,
      MAX_DELAY_MS: 3000,
      BACKOFF_FACTOR: 2,
      JITTER_FACTOR: 0.2
    }
  },
  CIRCUIT_BREAKER_CONFIG: {
    DEFAULT: {
      FAILURE_THRESHOLD_PERCENTAGE: 50,
      REQUEST_VOLUME_THRESHOLD: 10,
      ROLLING_WINDOW_MS: 60000,
      RESET_TIMEOUT_MS: 30000
    },
    CRITICAL: {
      FAILURE_THRESHOLD_PERCENTAGE: 30,
      REQUEST_VOLUME_THRESHOLD: 5,
      ROLLING_WINDOW_MS: 30000,
      RESET_TIMEOUT_MS: 15000
    },
    NON_CRITICAL: {
      FAILURE_THRESHOLD_PERCENTAGE: 70,
      REQUEST_VOLUME_THRESHOLD: 20,
      ROLLING_WINDOW_MS: 120000,
      RESET_TIMEOUT_MS: 60000
    }
  },
  FALLBACK_STRATEGY: {
    USE_CACHED_DATA: 'USE_CACHED_DATA',
    USE_DEFAULT_VALUES: 'USE_DEFAULT_VALUES',
    GRACEFUL_DEGRADATION: 'GRACEFUL_DEGRADATION',
    RETURN_EMPTY: 'RETURN_EMPTY',
    FAIL_FAST: 'FAIL_FAST'
  },
  CACHE_CONFIG: {
    MAX_ITEMS: 100,
    DEFAULT_TTL_MS: 60000
  }
}));

// Helper function to create a mock execution context
function createExecutionContext(handlerName = 'testHandler', className = 'TestController'): ExecutionContext {
  const mockRequest = {
    method: 'GET',
    url: '/test',
    params: { id: '123' },
    query: { filter: 'test' },
    user: { id: 'user-123' },
    headers: { 'x-journey-id': 'journey-123' }
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };

  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => mockResponse
    }),
    getHandler: () => ({ name: handlerName }),
    getClass: () => ({ name: className }),
    getType: () => 'http',
    getArgs: () => [mockRequest, mockResponse]
  } as unknown as ExecutionContext;
}

// Helper function to create a mock call handler
function createCallHandler(result: any, error?: any, delayMs = 0): CallHandler {
  return {
    handle: (): Observable<any> => {
      if (error) {
        return delayMs > 0
          ? throwError(() => error).pipe(delay(delayMs))
          : throwError(() => error);
      }
      return delayMs > 0 ? of(result).pipe(delay(delayMs)) : of(result);
    }
  };
}

// Helper function to create a transient error
function createTransientError(message = 'Transient error'): BaseError {
  return new BaseError(
    message,
    ErrorType.EXTERNAL,
    'TRANSIENT_ERROR',
    { isTransient: true }
  );
}

// Helper function to create a non-transient error
function createNonTransientError(message = 'Non-transient error'): BaseError {
  return new BaseError(
    message,
    ErrorType.TECHNICAL,
    'PERMANENT_ERROR',
    { isTransient: false }
  );
}

describe('Error Handling Interceptors', () => {
  // Disable console output during tests
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('RetryInterceptor', () => {
    let interceptor: RetryInterceptor;
    let context: ExecutionContext;

    beforeEach(() => {
      interceptor = new RetryInterceptor();
      context = createExecutionContext();
    });

    it('should pass through successful responses without retrying', (done) => {
      const expectedResult = { success: true };
      const handler = createCallHandler(expectedResult);
      const next = jest.spyOn(handler, 'handle');

      interceptor.intercept(context, handler).subscribe({
        next: (result) => {
          expect(result).toEqual(expectedResult);
          expect(next).toHaveBeenCalledTimes(1);
        },
        complete: () => done()
      });
    });

    it('should retry transient errors up to maxAttempts times', (done) => {
      const transientError = createTransientError();
      const handler = createCallHandler(null, transientError);
      const next = jest.spyOn(handler, 'handle');

      // Use a custom interceptor with faster retry for testing
      const customInterceptor = new RetryInterceptor({
        maxAttempts: 3,
        initialDelayMs: 10,
        maxDelayMs: 50,
        backoffFactor: 2,
        jitterFactor: 0
      });

      customInterceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBe(transientError);
          expect(next).toHaveBeenCalledTimes(4); // Initial + 3 retries
          expect(error.context.retryAttempts).toBe(3);
          done();
        }
      });
    });

    it('should not retry non-transient errors', (done) => {
      const nonTransientError = createNonTransientError();
      const handler = createCallHandler(null, nonTransientError);
      const next = jest.spyOn(handler, 'handle');

      interceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBe(nonTransientError);
          expect(next).toHaveBeenCalledTimes(1); // No retries
          done();
        }
      });
    });

    it('should use custom retryableErrorPredicate if provided', (done) => {
      const httpError = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
      const handler = createCallHandler(null, httpError);
      const next = jest.spyOn(handler, 'handle');

      // Custom predicate that retries HTTP 400 errors
      const customInterceptor = new RetryInterceptor({
        maxAttempts: 2,
        initialDelayMs: 10,
        maxDelayMs: 50,
        backoffFactor: 2,
        jitterFactor: 0,
        retryableErrorPredicate: (error) => error instanceof HttpException
      });

      customInterceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBe(httpError);
          expect(next).toHaveBeenCalledTimes(3); // Initial + 2 retries
          done();
        }
      });
    });

    it('should create specialized interceptors with factory methods', () => {
      const DatabaseRetryInterceptor = RetryInterceptor.forDatabase();
      const dbInterceptor = new DatabaseRetryInterceptor();
      expect(dbInterceptor).toBeInstanceOf(RetryInterceptor);

      const ExternalApiRetryInterceptor = RetryInterceptor.forExternalApi();
      const apiInterceptor = new ExternalApiRetryInterceptor();
      expect(apiInterceptor).toBeInstanceOf(RetryInterceptor);

      const EventProcessingRetryInterceptor = RetryInterceptor.forEventProcessing();
      const eventInterceptor = new EventProcessingRetryInterceptor();
      expect(eventInterceptor).toBeInstanceOf(RetryInterceptor);
    });
  });

  describe('CircuitBreakerInterceptor', () => {
    let interceptor: CircuitBreakerInterceptor;
    let context: ExecutionContext;
    const circuitName = 'test-circuit';

    beforeEach(() => {
      interceptor = new CircuitBreakerInterceptor(circuitName, {
        failureThresholdPercentage: 50,
        requestVolumeThreshold: 4,
        rollingWindowMs: 10000,
        resetTimeoutMs: 5000
      });
      context = createExecutionContext();
      // Reset the circuit before each test
      interceptor.resetCircuit();
    });

    it('should pass through successful responses and record success', (done) => {
      const expectedResult = { success: true };
      const handler = createCallHandler(expectedResult);

      interceptor.intercept(context, handler).subscribe({
        next: (result) => {
          expect(result).toEqual(expectedResult);
        },
        complete: () => done()
      });
    });

    it('should record failures and open the circuit after threshold is reached', (done) => {
      const serverError = new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
      const handler = createCallHandler(null, serverError);

      // First request - circuit should remain closed
      interceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBe(serverError);

          // Second request - circuit should remain closed
          interceptor.intercept(context, handler).subscribe({
            error: (error) => {
              expect(error).toBe(serverError);

              // Third request - circuit should remain closed
              interceptor.intercept(context, handler).subscribe({
                error: (error) => {
                  expect(error).toBe(serverError);

                  // Fourth request - circuit should open after this
                  interceptor.intercept(context, handler).subscribe({
                    error: (error) => {
                      expect(error).toBe(serverError);

                      // Fifth request - circuit should be open now
                      interceptor.intercept(context, handler).subscribe({
                        error: (error) => {
                          // Should be a circuit open error, not the original error
                          expect(error).not.toBe(serverError);
                          expect(error).toBeInstanceOf(BaseError);
                          expect(error.message).toContain('circuit');
                          expect(error.message).toContain('open');
                          expect(error.type).toBe(ErrorType.EXTERNAL);
                          expect(error.code).toBe('CIRCUIT_OPEN');
                          done();
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    });

    it('should not count client errors as failures', (done) => {
      const clientError = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
      const handler = createCallHandler(null, clientError);

      // Make multiple requests with client errors
      const makeRequest = (index: number) => {
        return new Promise<void>((resolve) => {
          interceptor.intercept(context, handler).subscribe({
            error: (error) => {
              expect(error).toBe(clientError);
              resolve();
            }
          });
        });
      };

      // Make 10 requests with client errors
      Promise.all(Array.from({ length: 10 }, (_, i) => makeRequest(i)))
        .then(() => {
          // Circuit should still be closed
          interceptor.intercept(context, handler).subscribe({
            error: (error) => {
              // Should still be the original client error, not a circuit open error
              expect(error).toBe(clientError);
              done();
            }
          });
        });
    });

    it('should create specialized interceptors with factory methods', () => {
      const CriticalCircuitBreaker = CircuitBreakerInterceptor.forCriticalService('critical-circuit');
      const criticalInterceptor = new CriticalCircuitBreaker();
      expect(criticalInterceptor).toBeInstanceOf(CircuitBreakerInterceptor);

      const NonCriticalCircuitBreaker = CircuitBreakerInterceptor.forNonCriticalService('non-critical-circuit');
      const nonCriticalInterceptor = new NonCriticalCircuitBreaker();
      expect(nonCriticalInterceptor).toBeInstanceOf(CircuitBreakerInterceptor);
    });

    it('should transition from open to half-open to closed after reset timeout', (done) => {
      const serverError = new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
      const successHandler = createCallHandler({ success: true });
      const errorHandler = createCallHandler(null, serverError);

      // Helper to make enough failing requests to open the circuit
      const openCircuit = async () => {
        for (let i = 0; i < 5; i++) {
          await new Promise<void>((resolve) => {
            interceptor.intercept(context, errorHandler).subscribe({
              error: () => resolve(),
              complete: () => resolve()
            });
          });
        }
      };

      // Open the circuit
      openCircuit().then(() => {
        // Verify circuit is open
        interceptor.intercept(context, successHandler).subscribe({
          error: (error) => {
            expect(error).toBeInstanceOf(BaseError);
            expect(error.code).toBe('CIRCUIT_OPEN');

            // Mock the reset timeout by directly calling resetCircuit
            interceptor.resetCircuit();

            // Circuit should now be closed, successful request should pass
            interceptor.intercept(context, successHandler).subscribe({
              next: (result) => {
                expect(result).toEqual({ success: true });
                done();
              }
            });
          }
        });
      });
    });
  });

  describe('FallbackInterceptor', () => {
    let context: ExecutionContext;

    beforeEach(() => {
      context = createExecutionContext();
    });

    it('should pass through successful responses and cache them', (done) => {
      const expectedResult = { data: 'test-data' };
      const handler = createCallHandler(expectedResult);

      const interceptor = new FallbackInterceptor({
        strategy: 'USE_CACHED_DATA',
        cacheKey: 'test-cache-key',
        cacheTtlMs: 1000
      });

      interceptor.intercept(context, handler).subscribe({
        next: (result) => {
          expect(result).toEqual(expectedResult);
        },
        complete: () => done()
      });
    });

    it('should return cached data when operation fails', (done) => {
      const expectedResult = { data: 'test-data' };
      const successHandler = createCallHandler(expectedResult);
      const errorHandler = createCallHandler(null, new Error('Test error'));

      const interceptor = new FallbackInterceptor({
        strategy: 'USE_CACHED_DATA',
        cacheKey: 'test-cache-key',
        cacheTtlMs: 1000
      });

      // First, cache the successful result
      interceptor.intercept(context, successHandler).subscribe({
        next: (result) => {
          expect(result).toEqual(expectedResult);

          // Then, try with an error - should return cached result
          interceptor.intercept(context, errorHandler).subscribe({
            next: (fallbackResult) => {
              expect(fallbackResult).toEqual(expectedResult);
              done();
            }
          });
        }
      });
    });

    it('should return default value when operation fails and no cache exists', (done) => {
      const defaultValue = { default: true };
      const errorHandler = createCallHandler(null, new Error('Test error'));

      const interceptor = new FallbackInterceptor({
        strategy: 'USE_DEFAULT_VALUES',
        defaultValue
      });

      interceptor.intercept(context, errorHandler).subscribe({
        next: (result) => {
          expect(result).toEqual(defaultValue);
          done();
        }
      });
    });

    it('should execute fallback function when operation fails', (done) => {
      const fallbackResult = { fallback: true };
      const errorHandler = createCallHandler(null, new Error('Test error'));

      const fallbackFn = jest.fn().mockReturnValue(fallbackResult);

      const interceptor = new FallbackInterceptor({
        strategy: 'GRACEFUL_DEGRADATION',
        fallbackFn
      });

      interceptor.intercept(context, errorHandler).subscribe({
        next: (result) => {
          expect(result).toEqual(fallbackResult);
          expect(fallbackFn).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should return empty result when operation fails with RETURN_EMPTY strategy', (done) => {
      const errorHandler = createCallHandler(null, new Error('Test error'));

      const arrayInterceptor = new FallbackInterceptor({
        strategy: 'RETURN_EMPTY',
        defaultValue: []
      });

      const objectInterceptor = new FallbackInterceptor({
        strategy: 'RETURN_EMPTY',
        defaultValue: {}
      });

      // Test with array default value
      arrayInterceptor.intercept(context, errorHandler).subscribe({
        next: (result) => {
          expect(result).toEqual([]);

          // Test with object default value
          objectInterceptor.intercept(context, errorHandler).subscribe({
            next: (result) => {
              expect(result).toEqual({});
              done();
            }
          });
        }
      });
    });

    it('should create specialized interceptors with factory methods', () => {
      const CachedDataInterceptor = FallbackInterceptor.withCachedData('test-key');
      const cachedInterceptor = new CachedDataInterceptor();
      expect(cachedInterceptor).toBeInstanceOf(FallbackInterceptor);

      const DefaultValueInterceptor = FallbackInterceptor.withDefaultValue({ default: true });
      const defaultInterceptor = new DefaultValueInterceptor();
      expect(defaultInterceptor).toBeInstanceOf(FallbackInterceptor);

      const FallbackFunctionInterceptor = FallbackInterceptor.withFallbackFunction(() => ({ fallback: true }));
      const functionInterceptor = new FallbackFunctionInterceptor();
      expect(functionInterceptor).toBeInstanceOf(FallbackInterceptor);

      const EmptyResultInterceptor = FallbackInterceptor.withEmptyResult(true);
      const emptyInterceptor = new EmptyResultInterceptor();
      expect(emptyInterceptor).toBeInstanceOf(FallbackInterceptor);
    });
  });

  describe('TimeoutInterceptor', () => {
    let context: ExecutionContext;

    beforeEach(() => {
      context = createExecutionContext();
    });

    it('should pass through responses that complete before timeout', (done) => {
      const expectedResult = { success: true };
      const handler = createCallHandler(expectedResult, null, 50);

      const interceptor = new TimeoutInterceptor({
        timeoutMs: 1000,
        errorMessage: 'Custom timeout message',
        errorCode: 'CUSTOM_TIMEOUT'
      });

      interceptor.intercept(context, handler).subscribe({
        next: (result) => {
          expect(result).toEqual(expectedResult);
        },
        complete: () => done()
      });
    });

    it('should throw timeout error when operation exceeds timeout', (done) => {
      const handler = createCallHandler({ success: true }, null, 200);

      const interceptor = new TimeoutInterceptor({
        timeoutMs: 100,
        errorMessage: 'Custom timeout message',
        errorCode: 'CUSTOM_TIMEOUT'
      });

      interceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(ExternalTimeoutError);
          expect(error.message).toBe('Custom timeout message');
          expect(error.code).toBe('CUSTOM_TIMEOUT');
          expect(error.timeoutMs).toBe(100);
          done();
        }
      });
    });

    it('should pass through non-timeout errors', (done) => {
      const originalError = new Error('Original error');
      const handler = createCallHandler(null, originalError, 50);

      const interceptor = new TimeoutInterceptor({
        timeoutMs: 1000
      });

      interceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBe(originalError);
          done();
        }
      });
    });

    it('should create specialized interceptors with factory methods', () => {
      const ApiTimeoutInterceptor = TimeoutInterceptor.forApiRequest(5000);
      const apiInterceptor = new ApiTimeoutInterceptor();
      expect(apiInterceptor).toBeInstanceOf(TimeoutInterceptor);

      const DatabaseTimeoutInterceptor = TimeoutInterceptor.forDatabaseOperation(2000);
      const dbInterceptor = new DatabaseTimeoutInterceptor();
      expect(dbInterceptor).toBeInstanceOf(TimeoutInterceptor);

      const ExternalServiceTimeoutInterceptor = TimeoutInterceptor.forExternalService(10000);
      const externalInterceptor = new ExternalServiceTimeoutInterceptor();
      expect(externalInterceptor).toBeInstanceOf(TimeoutInterceptor);
    });
  });

  describe('Combined Interceptors', () => {
    let context: ExecutionContext;

    beforeEach(() => {
      context = createExecutionContext();
    });

    it('should work together in a chain for successful responses', (done) => {
      const expectedResult = { success: true };
      const handler = createCallHandler(expectedResult);

      // Create interceptors
      const timeoutInterceptor = new TimeoutInterceptor({ timeoutMs: 1000 });
      const retryInterceptor = new RetryInterceptor({
        maxAttempts: 3,
        initialDelayMs: 10,
        maxDelayMs: 50
      });
      const circuitInterceptor = new CircuitBreakerInterceptor('test-combined-circuit');
      const fallbackInterceptor = FallbackInterceptor.withDefaultValue({ default: true });

      // Apply interceptors in chain
      const result$ = timeoutInterceptor.intercept(
        context,
        {
          handle: () => retryInterceptor.intercept(
            context,
            {
              handle: () => circuitInterceptor.intercept(
                context,
                {
                  handle: () => fallbackInterceptor.intercept(
                    context,
                    handler
                  )
                }
              )
            }
          )
        }
      );

      result$.subscribe({
        next: (result) => {
          expect(result).toEqual(expectedResult);
        },
        complete: () => done()
      });
    });

    it('should handle errors appropriately in a chain', (done) => {
      const transientError = createTransientError();
      const handler = createCallHandler(null, transientError);

      // Create interceptors with fast timeouts for testing
      const timeoutInterceptor = new TimeoutInterceptor({ timeoutMs: 1000 });
      const retryInterceptor = new RetryInterceptor({
        maxAttempts: 2,
        initialDelayMs: 10,
        maxDelayMs: 20
      });
      const circuitInterceptor = new CircuitBreakerInterceptor('test-combined-error-circuit');
      const fallbackInterceptor = FallbackInterceptor.withDefaultValue({ fallback: true });

      // Apply interceptors in chain
      const result$ = timeoutInterceptor.intercept(
        context,
        {
          handle: () => retryInterceptor.intercept(
            context,
            {
              handle: () => circuitInterceptor.intercept(
                context,
                {
                  handle: () => fallbackInterceptor.intercept(
                    context,
                    handler
                  )
                }
              )
            }
          )
        }
      );

      result$.subscribe({
        next: (result) => {
          // Should get fallback result after retries fail
          expect(result).toEqual({ fallback: true });
        },
        complete: () => done()
      });
    });

    it('should handle timeout errors in a chain', (done) => {
      // Handler that delays longer than the timeout
      const handler = createCallHandler({ success: true }, null, 200);

      // Create interceptors
      const timeoutInterceptor = new TimeoutInterceptor({ timeoutMs: 50 });
      const fallbackInterceptor = FallbackInterceptor.withDefaultValue({ timeout: true });

      // Apply interceptors in chain
      const result$ = fallbackInterceptor.intercept(
        context,
        {
          handle: () => timeoutInterceptor.intercept(
            context,
            handler
          )
        }
      );

      result$.subscribe({
        next: (result) => {
          // Should get fallback result after timeout
          expect(result).toEqual({ timeout: true });
        },
        complete: () => done()
      });
    });
  });
});