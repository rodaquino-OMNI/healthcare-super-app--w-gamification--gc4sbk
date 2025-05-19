import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, delay, timeout, take, toArray } from 'rxjs/operators';
import { RetryInterceptor, CircuitBreakerInterceptor, FallbackInterceptor, TimeoutInterceptor } from '../../../src/nest/interceptors';

/**
 * Test suite for NestJS interceptors that implement advanced error recovery mechanisms
 * including retry with exponential backoff, circuit breaking, fallback execution,
 * and request timeout handling.
 */
describe('Error Handling Interceptors', () => {
  let executionContext: ExecutionContext;

  beforeEach(() => {
    executionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          url: '/test',
          method: 'GET',
          headers: {
            'x-journey-id': 'test-journey'
          }
        }),
        getResponse: jest.fn().mockReturnValue({})
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getType: jest.fn(),
      getArgs: jest.fn(),
    } as any;
  });

  /**
   * RetryInterceptor tests
   * Tests the retry with exponential backoff functionality for transient errors
   */
  describe('RetryInterceptor', () => {
    let retryInterceptor: RetryInterceptor;
    
    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [RetryInterceptor],
      }).compile();
      
      retryInterceptor = moduleRef.get<RetryInterceptor>(RetryInterceptor);
    });

    it('should successfully pass through when no error occurs', async () => {
      // Arrange
      const callHandler: CallHandler = {
        handle: () => of('success')
      };
      
      // Act
      const result = await retryInterceptor.intercept(executionContext, callHandler).toPromise();
      
      // Assert
      expect(result).toBe('success');
    });

    it('should retry the specified number of times before failing', async () => {
      // Arrange
      const maxRetries = 3;
      const error = new Error('Transient error');
      let attemptCount = 0;
      
      const callHandler: CallHandler = {
        handle: () => {
          attemptCount++;
          return throwError(error);
        }
      };
      
      // Configure the interceptor with custom retry options
      jest.spyOn(retryInterceptor as any, 'getRetryOptions').mockReturnValue({
        maxRetries,
        delayType: 'exponential',
        initialDelayMs: 10
      });
      
      // Act & Assert
      await expect(retryInterceptor.intercept(executionContext, callHandler).toPromise())
        .rejects.toThrow(error);
      
      // Should have attempted 1 original + 3 retries = 4 total attempts
      expect(attemptCount).toBe(maxRetries + 1);
    });

    it('should implement exponential backoff between retries', async () => {
      // Arrange
      const maxRetries = 3;
      const initialDelayMs = 10;
      const error = new Error('Transient error');
      const retryDelays: number[] = [];
      let lastAttemptTime = Date.now();
      
      const callHandler: CallHandler = {
        handle: () => {
          const now = Date.now();
          if (retryDelays.length > 0) {
            retryDelays.push(now - lastAttemptTime);
          }
          lastAttemptTime = now;
          return throwError(error);
        }
      };
      
      // Configure the interceptor with custom retry options
      jest.spyOn(retryInterceptor as any, 'getRetryOptions').mockReturnValue({
        maxRetries,
        delayType: 'exponential',
        initialDelayMs
      });
      
      // Act
      try {
        await retryInterceptor.intercept(executionContext, callHandler).toPromise();
      } catch (e) {
        // Expected to throw, we're just measuring the delays
      }
      
      // Assert - each delay should be approximately double the previous one
      // We allow some margin of error due to timing inconsistencies
      for (let i = 1; i < retryDelays.length; i++) {
        const expectedRatio = 2;
        const actualRatio = retryDelays[i] / retryDelays[i-1];
        expect(actualRatio).toBeGreaterThanOrEqual(expectedRatio * 0.8);
        expect(actualRatio).toBeLessThanOrEqual(expectedRatio * 1.2);
      }
    });

    it('should succeed if an attempt succeeds after retries', async () => {
      // Arrange
      let attemptCount = 0;
      const successAfterAttempts = 2;
      
      const callHandler: CallHandler = {
        handle: () => {
          attemptCount++;
          if (attemptCount <= successAfterAttempts) {
            return throwError(new Error('Transient error'));
          }
          return of('success after retry');
        }
      };
      
      // Configure the interceptor with custom retry options
      jest.spyOn(retryInterceptor as any, 'getRetryOptions').mockReturnValue({
        maxRetries: 3,
        delayType: 'exponential',
        initialDelayMs: 10
      });
      
      // Act
      const result = await retryInterceptor.intercept(executionContext, callHandler).toPromise();
      
      // Assert
      expect(result).toBe('success after retry');
      expect(attemptCount).toBe(successAfterAttempts + 1);
    });

    it('should not retry on non-retryable errors', async () => {
      // Arrange
      const nonRetryableError = new Error('Non-retryable error');
      let attemptCount = 0;
      
      const callHandler: CallHandler = {
        handle: () => {
          attemptCount++;
          return throwError(nonRetryableError);
        }
      };
      
      // Configure the interceptor with custom retry options and error filter
      jest.spyOn(retryInterceptor as any, 'getRetryOptions').mockReturnValue({
        maxRetries: 3,
        delayType: 'exponential',
        initialDelayMs: 10,
        retryableErrorFilter: (error: Error) => error.message.includes('Transient')
      });
      
      // Act & Assert
      await expect(retryInterceptor.intercept(executionContext, callHandler).toPromise())
        .rejects.toThrow(nonRetryableError);
      
      // Should have attempted only once, no retries
      expect(attemptCount).toBe(1);
    });
  });

  /**
   * CircuitBreakerInterceptor tests
   * Tests the circuit breaker pattern for failing dependencies
   */
  describe('CircuitBreakerInterceptor', () => {
    let circuitBreakerInterceptor: CircuitBreakerInterceptor;
    
    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [CircuitBreakerInterceptor],
      }).compile();
      
      circuitBreakerInterceptor = moduleRef.get<CircuitBreakerInterceptor>(CircuitBreakerInterceptor);
      
      // Reset circuit breaker state before each test
      (circuitBreakerInterceptor as any).resetCircuitState();
    });

    it('should successfully pass through when no error occurs', async () => {
      // Arrange
      const callHandler: CallHandler = {
        handle: () => of('success')
      };
      
      // Act
      const result = await circuitBreakerInterceptor.intercept(executionContext, callHandler).toPromise();
      
      // Assert
      expect(result).toBe('success');
      expect((circuitBreakerInterceptor as any).getCircuitState()).toBe('CLOSED');
    });

    it('should open the circuit after reaching the error threshold', async () => {
      // Arrange
      const error = new Error('Dependency failure');
      const failureThreshold = 3;
      let attemptCount = 0;
      
      const callHandler: CallHandler = {
        handle: () => {
          attemptCount++;
          return throwError(error);
        }
      };
      
      // Configure the circuit breaker options
      jest.spyOn(circuitBreakerInterceptor as any, 'getCircuitBreakerOptions').mockReturnValue({
        failureThreshold,
        resetTimeoutMs: 1000,
        requestVolumeThreshold: 1
      });
      
      // Act - Make multiple failing requests to trip the circuit
      for (let i = 0; i < failureThreshold; i++) {
        try {
          await circuitBreakerInterceptor.intercept(executionContext, callHandler).toPromise();
        } catch (e) {
          // Expected to throw
        }
      }
      
      // Assert - Circuit should be open after threshold failures
      expect((circuitBreakerInterceptor as any).getCircuitState()).toBe('OPEN');
      expect(attemptCount).toBe(failureThreshold);
      
      // Act - Make another request, which should fail fast without calling the handler
      const previousAttemptCount = attemptCount;
      try {
        await circuitBreakerInterceptor.intercept(executionContext, callHandler).toPromise();
      } catch (e) {
        // Expected to throw a CircuitBreakerOpenException
        expect(e.message).toContain('Circuit breaker is open');
      }
      
      // Assert - Handler should not have been called again
      expect(attemptCount).toBe(previousAttemptCount);
    });

    it('should transition to half-open state after reset timeout', async () => {
      // Arrange
      const error = new Error('Dependency failure');
      const failureThreshold = 2;
      const resetTimeoutMs = 100; // Short timeout for testing
      let attemptCount = 0;
      
      const callHandler: CallHandler = {
        handle: () => {
          attemptCount++;
          return throwError(error);
        }
      };
      
      // Configure the circuit breaker options
      jest.spyOn(circuitBreakerInterceptor as any, 'getCircuitBreakerOptions').mockReturnValue({
        failureThreshold,
        resetTimeoutMs,
        requestVolumeThreshold: 1
      });
      
      // Act - Trip the circuit
      for (let i = 0; i < failureThreshold; i++) {
        try {
          await circuitBreakerInterceptor.intercept(executionContext, callHandler).toPromise();
        } catch (e) {
          // Expected to throw
        }
      }
      
      // Assert - Circuit should be open
      expect((circuitBreakerInterceptor as any).getCircuitState()).toBe('OPEN');
      
      // Act - Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, resetTimeoutMs + 10));
      
      // Assert - Circuit should now be half-open
      expect((circuitBreakerInterceptor as any).getCircuitState()).toBe('HALF_OPEN');
    });

    it('should close the circuit after a successful request in half-open state', async () => {
      // Arrange
      const failureThreshold = 2;
      const resetTimeoutMs = 100; // Short timeout for testing
      let shouldFail = true;
      
      const callHandler: CallHandler = {
        handle: () => {
          if (shouldFail) {
            return throwError(new Error('Dependency failure'));
          }
          return of('success');
        }
      };
      
      // Configure the circuit breaker options
      jest.spyOn(circuitBreakerInterceptor as any, 'getCircuitBreakerOptions').mockReturnValue({
        failureThreshold,
        resetTimeoutMs,
        requestVolumeThreshold: 1
      });
      
      // Act - Trip the circuit
      for (let i = 0; i < failureThreshold; i++) {
        try {
          await circuitBreakerInterceptor.intercept(executionContext, callHandler).toPromise();
        } catch (e) {
          // Expected to throw
        }
      }
      
      // Assert - Circuit should be open
      expect((circuitBreakerInterceptor as any).getCircuitState()).toBe('OPEN');
      
      // Act - Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, resetTimeoutMs + 10));
      
      // Assert - Circuit should now be half-open
      expect((circuitBreakerInterceptor as any).getCircuitState()).toBe('HALF_OPEN');
      
      // Act - Make a successful request in half-open state
      shouldFail = false;
      const result = await circuitBreakerInterceptor.intercept(executionContext, callHandler).toPromise();
      
      // Assert - Circuit should be closed and request should succeed
      expect(result).toBe('success');
      expect((circuitBreakerInterceptor as any).getCircuitState()).toBe('CLOSED');
    });

    it('should reopen the circuit after a failed request in half-open state', async () => {
      // Arrange
      const failureThreshold = 2;
      const resetTimeoutMs = 100; // Short timeout for testing
      
      const callHandler: CallHandler = {
        handle: () => throwError(new Error('Dependency failure'))
      };
      
      // Configure the circuit breaker options
      jest.spyOn(circuitBreakerInterceptor as any, 'getCircuitBreakerOptions').mockReturnValue({
        failureThreshold,
        resetTimeoutMs,
        requestVolumeThreshold: 1
      });
      
      // Act - Trip the circuit
      for (let i = 0; i < failureThreshold; i++) {
        try {
          await circuitBreakerInterceptor.intercept(executionContext, callHandler).toPromise();
        } catch (e) {
          // Expected to throw
        }
      }
      
      // Assert - Circuit should be open
      expect((circuitBreakerInterceptor as any).getCircuitState()).toBe('OPEN');
      
      // Act - Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, resetTimeoutMs + 10));
      
      // Assert - Circuit should now be half-open
      expect((circuitBreakerInterceptor as any).getCircuitState()).toBe('HALF_OPEN');
      
      // Act - Make a failed request in half-open state
      try {
        await circuitBreakerInterceptor.intercept(executionContext, callHandler).toPromise();
      } catch (e) {
        // Expected to throw
      }
      
      // Assert - Circuit should be open again
      expect((circuitBreakerInterceptor as any).getCircuitState()).toBe('OPEN');
    });

    it('should track failure rates based on the request volume threshold', async () => {
      // Arrange
      const failureThreshold = 50; // 50% failure rate
      const requestVolumeThreshold = 4; // Need at least 4 requests to calculate failure rate
      let failureCount = 0;
      
      const callHandler: CallHandler = {
        handle: () => {
          failureCount++;
          if (failureCount % 2 === 0) { // 50% failure rate
            return throwError(new Error('Dependency failure'));
          }
          return of('success');
        }
      };
      
      // Configure the circuit breaker options
      jest.spyOn(circuitBreakerInterceptor as any, 'getCircuitBreakerOptions').mockReturnValue({
        failureThreshold, // 50%
        resetTimeoutMs: 1000,
        requestVolumeThreshold
      });
      
      // Act - Make requests with 50% failure rate
      for (let i = 0; i < requestVolumeThreshold - 1; i++) {
        try {
          await circuitBreakerInterceptor.intercept(executionContext, callHandler).toPromise();
        } catch (e) {
          // Some requests will throw, which is expected
        }
      }
      
      // Assert - Circuit should still be closed (not enough volume yet)
      expect((circuitBreakerInterceptor as any).getCircuitState()).toBe('CLOSED');
      
      // Act - Make one more request to reach the volume threshold
      try {
        await circuitBreakerInterceptor.intercept(executionContext, callHandler).toPromise();
      } catch (e) {
        // May throw depending on the failure pattern
      }
      
      // Assert - Circuit should now be open due to 50% failure rate
      expect((circuitBreakerInterceptor as any).getCircuitState()).toBe('OPEN');
    });
  });

  /**
   * FallbackInterceptor tests
   * Tests the fallback functionality for graceful degradation
   */
  describe('FallbackInterceptor', () => {
    let fallbackInterceptor: FallbackInterceptor;
    
    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [FallbackInterceptor],
      }).compile();
      
      fallbackInterceptor = moduleRef.get<FallbackInterceptor>(FallbackInterceptor);
    });

    it('should successfully pass through when no error occurs', async () => {
      // Arrange
      const callHandler: CallHandler = {
        handle: () => of('success')
      };
      
      // Act
      const result = await fallbackInterceptor.intercept(executionContext, callHandler).toPromise();
      
      // Assert
      expect(result).toBe('success');
    });

    it('should return fallback value when the primary operation fails', async () => {
      // Arrange
      const error = new Error('Primary operation failed');
      const fallbackValue = 'fallback data';
      const fallbackFn = jest.fn().mockReturnValue(fallbackValue);
      
      const callHandler: CallHandler = {
        handle: () => throwError(error)
      };
      
      // Configure the fallback options
      jest.spyOn(fallbackInterceptor as any, 'getFallbackOptions').mockReturnValue({
        fallbackFn
      });
      
      // Act
      const result = await fallbackInterceptor.intercept(executionContext, callHandler).toPromise();
      
      // Assert
      expect(result).toBe(fallbackValue);
      expect(fallbackFn).toHaveBeenCalledWith(error, executionContext);
    });

    it('should pass the original error to the fallback function', async () => {
      // Arrange
      const error = new Error('Primary operation failed');
      let capturedError: Error | null = null;
      
      const fallbackFn = jest.fn().mockImplementation((err) => {
        capturedError = err;
        return 'fallback data';
      });
      
      const callHandler: CallHandler = {
        handle: () => throwError(error)
      };
      
      // Configure the fallback options
      jest.spyOn(fallbackInterceptor as any, 'getFallbackOptions').mockReturnValue({
        fallbackFn
      });
      
      // Act
      await fallbackInterceptor.intercept(executionContext, callHandler).toPromise();
      
      // Assert
      expect(capturedError).toBe(error);
    });

    it('should support async fallback functions', async () => {
      // Arrange
      const error = new Error('Primary operation failed');
      const fallbackValue = 'async fallback data';
      
      const fallbackFn = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return fallbackValue;
      });
      
      const callHandler: CallHandler = {
        handle: () => throwError(error)
      };
      
      // Configure the fallback options
      jest.spyOn(fallbackInterceptor as any, 'getFallbackOptions').mockReturnValue({
        fallbackFn
      });
      
      // Act
      const result = await fallbackInterceptor.intercept(executionContext, callHandler).toPromise();
      
      // Assert
      expect(result).toBe(fallbackValue);
    });

    it('should support fallback functions that return observables', async () => {
      // Arrange
      const error = new Error('Primary operation failed');
      const fallbackValue = 'observable fallback data';
      
      const fallbackFn = jest.fn().mockImplementation(() => {
        return of(fallbackValue).pipe(delay(10));
      });
      
      const callHandler: CallHandler = {
        handle: () => throwError(error)
      };
      
      // Configure the fallback options
      jest.spyOn(fallbackInterceptor as any, 'getFallbackOptions').mockReturnValue({
        fallbackFn
      });
      
      // Act
      const result = await fallbackInterceptor.intercept(executionContext, callHandler).toPromise();
      
      // Assert
      expect(result).toBe(fallbackValue);
    });

    it('should propagate errors from the fallback function', async () => {
      // Arrange
      const primaryError = new Error('Primary operation failed');
      const fallbackError = new Error('Fallback also failed');
      
      const fallbackFn = jest.fn().mockImplementation(() => {
        throw fallbackError;
      });
      
      const callHandler: CallHandler = {
        handle: () => throwError(primaryError)
      };
      
      // Configure the fallback options
      jest.spyOn(fallbackInterceptor as any, 'getFallbackOptions').mockReturnValue({
        fallbackFn
      });
      
      // Act & Assert
      await expect(fallbackInterceptor.intercept(executionContext, callHandler).toPromise())
        .rejects.toThrow(fallbackError);
    });

    it('should support conditional fallback based on error type', async () => {
      // Arrange
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      const validationError = new Error('Validation error');
      validationError.name = 'ValidationError';
      
      const networkFallbackValue = 'network fallback';
      const fallbackFn = jest.fn().mockReturnValue(networkFallbackValue);
      
      let currentError = networkError;
      const callHandler: CallHandler = {
        handle: () => throwError(currentError)
      };
      
      // Configure the fallback options with error filter
      jest.spyOn(fallbackInterceptor as any, 'getFallbackOptions').mockReturnValue({
        fallbackFn,
        errorFilter: (err: Error) => err.name === 'NetworkError'
      });
      
      // Act - With network error (should use fallback)
      const result1 = await fallbackInterceptor.intercept(executionContext, callHandler).toPromise();
      
      // Assert
      expect(result1).toBe(networkFallbackValue);
      
      // Act - With validation error (should not use fallback)
      currentError = validationError;
      try {
        await fallbackInterceptor.intercept(executionContext, callHandler).toPromise();
        fail('Should have thrown an error');
      } catch (e) {
        // Assert
        expect(e).toBe(validationError);
      }
    });
  });

  /**
   * TimeoutInterceptor tests
   * Tests the timeout detection and response functionality
   */
  describe('TimeoutInterceptor', () => {
    let timeoutInterceptor: TimeoutInterceptor;
    
    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [TimeoutInterceptor],
      }).compile();
      
      timeoutInterceptor = moduleRef.get<TimeoutInterceptor>(TimeoutInterceptor);
    });

    it('should successfully pass through when response is faster than timeout', async () => {
      // Arrange
      const callHandler: CallHandler = {
        handle: () => of('success').pipe(delay(10))
      };
      
      // Configure the timeout options
      jest.spyOn(timeoutInterceptor as any, 'getTimeoutOptions').mockReturnValue({
        timeoutMs: 100
      });
      
      // Act
      const result = await timeoutInterceptor.intercept(executionContext, callHandler).toPromise();
      
      // Assert
      expect(result).toBe('success');
    });

    it('should throw a timeout error when response exceeds timeout', async () => {
      // Arrange
      const timeoutMs = 50;
      const responseDelayMs = timeoutMs * 2;
      
      const callHandler: CallHandler = {
        handle: () => of('delayed response').pipe(delay(responseDelayMs))
      };
      
      // Configure the timeout options
      jest.spyOn(timeoutInterceptor as any, 'getTimeoutOptions').mockReturnValue({
        timeoutMs
      });
      
      // Act & Assert
      try {
        await timeoutInterceptor.intercept(executionContext, callHandler).toPromise();
        fail('Should have thrown a timeout error');
      } catch (e) {
        expect(e.name).toBe('TimeoutError');
        expect(e.message).toContain(`Timeout of ${timeoutMs}ms exceeded`);
      }
    });

    it('should include request details in timeout error message', async () => {
      // Arrange
      const timeoutMs = 50;
      const responseDelayMs = timeoutMs * 2;
      const requestUrl = '/test-endpoint';
      const requestMethod = 'GET';
      
      // Update the mock execution context with specific request details
      (executionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
        url: requestUrl,
        method: requestMethod,
        headers: {
          'x-journey-id': 'test-journey'
        }
      });
      
      const callHandler: CallHandler = {
        handle: () => of('delayed response').pipe(delay(responseDelayMs))
      };
      
      // Configure the timeout options
      jest.spyOn(timeoutInterceptor as any, 'getTimeoutOptions').mockReturnValue({
        timeoutMs
      });
      
      // Act & Assert
      try {
        await timeoutInterceptor.intercept(executionContext, callHandler).toPromise();
        fail('Should have thrown a timeout error');
      } catch (e) {
        expect(e.message).toContain(requestMethod);
        expect(e.message).toContain(requestUrl);
      }
    });

    it('should use different timeout values for different routes', async () => {
      // Arrange
      const defaultTimeoutMs = 100;
      const longOperationTimeoutMs = 500;
      const responseDelayMs = 200; // Between default and long operation timeout
      
      const callHandler: CallHandler = {
        handle: () => of('delayed response').pipe(delay(responseDelayMs))
      };
      
      // Test with default timeout (should timeout)
      jest.spyOn(timeoutInterceptor as any, 'getTimeoutOptions').mockReturnValue({
        timeoutMs: defaultTimeoutMs
      });
      
      // Act & Assert for default timeout
      try {
        await timeoutInterceptor.intercept(executionContext, callHandler).toPromise();
        fail('Should have thrown a timeout error with default timeout');
      } catch (e) {
        expect(e.name).toBe('TimeoutError');
      }
      
      // Test with long operation timeout (should not timeout)
      jest.spyOn(timeoutInterceptor as any, 'getTimeoutOptions').mockReturnValue({
        timeoutMs: longOperationTimeoutMs
      });
      
      // Act & Assert for long operation timeout
      const result = await timeoutInterceptor.intercept(executionContext, callHandler).toPromise();
      expect(result).toBe('delayed response');
    });

    it('should handle errors that occur before timeout', async () => {
      // Arrange
      const error = new Error('Operation failed');
      
      const callHandler: CallHandler = {
        handle: () => throwError(error)
      };
      
      // Configure the timeout options
      jest.spyOn(timeoutInterceptor as any, 'getTimeoutOptions').mockReturnValue({
        timeoutMs: 100
      });
      
      // Act & Assert
      await expect(timeoutInterceptor.intercept(executionContext, callHandler).toPromise())
        .rejects.toThrow(error);
    });

    it('should cancel the original operation when timeout occurs', async () => {
      // Arrange
      const timeoutMs = 50;
      let operationCancelled = false;
      
      // Create an observable that can detect cancellation
      const observable = new Observable(subscriber => {
        const timer = setTimeout(() => {
          subscriber.next('delayed response');
          subscriber.complete();
        }, timeoutMs * 2);
        
        // Return teardown logic that will be called on unsubscribe
        return () => {
          clearTimeout(timer);
          operationCancelled = true;
        };
      });
      
      const callHandler: CallHandler = {
        handle: () => observable
      };
      
      // Configure the timeout options
      jest.spyOn(timeoutInterceptor as any, 'getTimeoutOptions').mockReturnValue({
        timeoutMs
      });
      
      // Act
      try {
        await timeoutInterceptor.intercept(executionContext, callHandler).toPromise();
      } catch (e) {
        // Expected to throw timeout error
      }
      
      // Assert - Verify that the operation was cancelled
      expect(operationCancelled).toBe(true);
    });
  });

  /**
   * Combined Interceptors tests
   * Tests the integration of multiple interceptors working together
   */
  describe('Combined Interceptors', () => {
    let retryInterceptor: RetryInterceptor;
    let circuitBreakerInterceptor: CircuitBreakerInterceptor;
    let fallbackInterceptor: FallbackInterceptor;
    let timeoutInterceptor: TimeoutInterceptor;
    
    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          RetryInterceptor,
          CircuitBreakerInterceptor,
          FallbackInterceptor,
          TimeoutInterceptor
        ],
      }).compile();
      
      retryInterceptor = moduleRef.get<RetryInterceptor>(RetryInterceptor);
      circuitBreakerInterceptor = moduleRef.get<CircuitBreakerInterceptor>(CircuitBreakerInterceptor);
      fallbackInterceptor = moduleRef.get<FallbackInterceptor>(FallbackInterceptor);
      timeoutInterceptor = moduleRef.get<TimeoutInterceptor>(TimeoutInterceptor);
      
      // Reset circuit breaker state before each test
      (circuitBreakerInterceptor as any).resetCircuitState();
      
      // Configure default options for each interceptor
      jest.spyOn(retryInterceptor as any, 'getRetryOptions').mockReturnValue({
        maxRetries: 2,
        delayType: 'exponential',
        initialDelayMs: 10
      });
      
      jest.spyOn(circuitBreakerInterceptor as any, 'getCircuitBreakerOptions').mockReturnValue({
        failureThreshold: 50,
        resetTimeoutMs: 1000,
        requestVolumeThreshold: 4
      });
      
      jest.spyOn(timeoutInterceptor as any, 'getTimeoutOptions').mockReturnValue({
        timeoutMs: 100
      });
    });

    it('should handle timeout with fallback', async () => {
      // Arrange
      const fallbackValue = 'fallback for timeout';
      const fallbackFn = jest.fn().mockReturnValue(fallbackValue);
      
      jest.spyOn(fallbackInterceptor as any, 'getFallbackOptions').mockReturnValue({
        fallbackFn
      });
      
      const callHandler: CallHandler = {
        handle: () => of('delayed response').pipe(delay(200)) // Will timeout
      };
      
      // Act - Apply timeout interceptor first, then fallback
      const timeoutHandler = {
        handle: () => timeoutInterceptor.intercept(executionContext, callHandler)
      };
      
      const result = await fallbackInterceptor.intercept(executionContext, timeoutHandler).toPromise();
      
      // Assert
      expect(result).toBe(fallbackValue);
      expect(fallbackFn).toHaveBeenCalled();
    });

    it('should retry transient errors before circuit breaker trips', async () => {
      // Arrange
      const error = new Error('Transient error');
      let attemptCount = 0;
      
      const callHandler: CallHandler = {
        handle: () => {
          attemptCount++;
          return throwError(error);
        }
      };
      
      // Configure retry to make 2 retries
      jest.spyOn(retryInterceptor as any, 'getRetryOptions').mockReturnValue({
        maxRetries: 2,
        delayType: 'exponential',
        initialDelayMs: 10
      });
      
      // Configure circuit breaker to trip after 3 failures
      jest.spyOn(circuitBreakerInterceptor as any, 'getCircuitBreakerOptions').mockReturnValue({
        failureThreshold: 3,
        resetTimeoutMs: 1000,
        requestVolumeThreshold: 1
      });
      
      // Act - Apply retry interceptor first, then circuit breaker
      const retryHandler = {
        handle: () => retryInterceptor.intercept(executionContext, callHandler)
      };
      
      // First request - should retry but eventually fail
      try {
        await circuitBreakerInterceptor.intercept(executionContext, retryHandler).toPromise();
      } catch (e) {
        // Expected to throw after retries
      }
      
      // Assert - Should have attempted 1 original + 2 retries = 3 total attempts
      expect(attemptCount).toBe(3);
      
      // Reset attempt count for next request
      attemptCount = 0;
      
      // Second request - should retry but eventually fail
      try {
        await circuitBreakerInterceptor.intercept(executionContext, retryHandler).toPromise();
      } catch (e) {
        // Expected to throw after retries
      }
      
      // Assert - Should have attempted 1 original + 2 retries = 3 total attempts
      expect(attemptCount).toBe(3);
      
      // Reset attempt count for next request
      attemptCount = 0;
      
      // Third request - circuit should be open now, so no retries should happen
      try {
        await circuitBreakerInterceptor.intercept(executionContext, retryHandler).toPromise();
      } catch (e) {
        // Expected to throw circuit open error
        expect(e.message).toContain('Circuit breaker is open');
      }
      
      // Assert - Should not have attempted any calls because circuit is open
      expect(attemptCount).toBe(0);
    });

    it('should apply fallback when circuit breaker is open', async () => {
      // Arrange
      const error = new Error('Dependency failure');
      const fallbackValue = 'circuit breaker fallback';
      const fallbackFn = jest.fn().mockReturnValue(fallbackValue);
      
      jest.spyOn(fallbackInterceptor as any, 'getFallbackOptions').mockReturnValue({
        fallbackFn
      });
      
      // Configure circuit breaker to trip after 2 failures
      jest.spyOn(circuitBreakerInterceptor as any, 'getCircuitBreakerOptions').mockReturnValue({
        failureThreshold: 2,
        resetTimeoutMs: 1000,
        requestVolumeThreshold: 1
      });
      
      const callHandler: CallHandler = {
        handle: () => throwError(error)
      };
      
      // Act - Apply circuit breaker first, then fallback
      const circuitBreakerHandler = {
        handle: () => circuitBreakerInterceptor.intercept(executionContext, callHandler)
      };
      
      // Trip the circuit with two failing requests
      try {
        await circuitBreakerInterceptor.intercept(executionContext, callHandler).toPromise();
      } catch (e) {
        // Expected to throw
      }
      
      try {
        await circuitBreakerInterceptor.intercept(executionContext, callHandler).toPromise();
      } catch (e) {
        // Expected to throw
      }
      
      // Assert - Circuit should be open
      expect((circuitBreakerInterceptor as any).getCircuitState()).toBe('OPEN');
      
      // Act - Now try with fallback
      const result = await fallbackInterceptor.intercept(executionContext, circuitBreakerHandler).toPromise();
      
      // Assert - Should have used fallback
      expect(result).toBe(fallbackValue);
      expect(fallbackFn).toHaveBeenCalled();
    });

    it('should apply all interceptors in the correct order', async () => {
      // Arrange
      const fallbackValue = 'complete fallback chain';
      const fallbackFn = jest.fn().mockReturnValue(fallbackValue);
      
      jest.spyOn(fallbackInterceptor as any, 'getFallbackOptions').mockReturnValue({
        fallbackFn
      });
      
      // Configure a short timeout
      jest.spyOn(timeoutInterceptor as any, 'getTimeoutOptions').mockReturnValue({
        timeoutMs: 50
      });
      
      // This handler will timeout
      const callHandler: CallHandler = {
        handle: () => of('delayed response').pipe(delay(100))
      };
      
      // Create the interceptor chain: Fallback -> Retry -> CircuitBreaker -> Timeout -> Handler
      // The timeout will trigger, retry will attempt to retry the timeout,
      // circuit breaker will eventually open, and fallback will provide the final response
      
      // Apply timeout first
      const timeoutHandler = {
        handle: () => timeoutInterceptor.intercept(executionContext, callHandler)
      };
      
      // Then circuit breaker
      const circuitBreakerHandler = {
        handle: () => circuitBreakerInterceptor.intercept(executionContext, timeoutHandler)
      };
      
      // Then retry
      const retryHandler = {
        handle: () => retryInterceptor.intercept(executionContext, circuitBreakerHandler)
      };
      
      // Finally fallback
      
      // Act - Make multiple requests to trigger the full chain
      let result;
      
      // First few requests will timeout, be retried, and eventually trip the circuit breaker
      for (let i = 0; i < 3; i++) {
        result = await fallbackInterceptor.intercept(executionContext, retryHandler).toPromise();
        // Even the first requests should use fallback because of timeout
        expect(result).toBe(fallbackValue);
      }
      
      // Assert - Circuit should be open after multiple failures
      expect((circuitBreakerInterceptor as any).getCircuitState()).toBe('OPEN');
      
      // One more request should use fallback immediately due to open circuit
      fallbackFn.mockClear(); // Reset the mock to verify it's called again
      result = await fallbackInterceptor.intercept(executionContext, retryHandler).toPromise();
      
      // Assert
      expect(result).toBe(fallbackValue);
      expect(fallbackFn).toHaveBeenCalled();
    });
  });
});