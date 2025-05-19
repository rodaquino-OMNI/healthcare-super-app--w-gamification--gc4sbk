import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorType } from '../../../src/decorators/types';
import {
  Retry,
  CircuitBreaker,
  Fallback,
  ErrorBoundary,
  TimeoutConfig,
} from '../../../src/nest/decorators';
import {
  RetryInterceptor,
  CircuitBreakerInterceptor,
  FallbackInterceptor,
  ErrorBoundaryInterceptor,
  TimeoutInterceptor,
} from '../../../src/nest/interceptors';

/**
 * Test suite for NestJS-compatible decorators that enable declarative error handling
 * throughout the AUSTA SuperApp. Validates that decorators correctly store metadata
 * on controller methods or classes and integrate properly with their corresponding interceptors.
 */
describe('Error Handling Decorators', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  /**
   * Tests for the @Retry decorator which configures method-specific retry policies
   */
  describe('@Retry Decorator', () => {
    // Test class with decorated methods
    @Controller('test')
    class TestController {
      @Retry({ maxAttempts: 3 })
      @Get('default-retry')
      defaultRetry() {
        return 'default retry';
      }

      @Retry({ maxAttempts: 5, delay: 1000, backoff: 2 })
      @Get('custom-retry')
      customRetry() {
        return 'custom retry';
      }

      @Retry({
        maxAttempts: 3,
        errorTypes: [ErrorType.EXTERNAL],
        excludeErrorTypes: [ErrorType.VALIDATION],
      })
      @Get('filtered-retry')
      filteredRetry() {
        return 'filtered retry';
      }

      @Get('no-retry')
      noRetry() {
        return 'no retry';
      }
    }

    it('should store retry metadata with default options', () => {
      const metadata = Reflect.getMetadata(
        'retry:options',
        TestController.prototype.defaultRetry,
      );
      
      expect(metadata).toBeDefined();
      expect(metadata.maxAttempts).toBe(3);
      expect(metadata.delay).toBeDefined();
      expect(metadata.backoff).toBeDefined();
      expect(metadata.errorTypes).toBeUndefined();
      expect(metadata.excludeErrorTypes).toBeUndefined();
    });

    it('should store retry metadata with custom options', () => {
      const metadata = Reflect.getMetadata(
        'retry:options',
        TestController.prototype.customRetry,
      );
      
      expect(metadata).toBeDefined();
      expect(metadata.maxAttempts).toBe(5);
      expect(metadata.delay).toBe(1000);
      expect(metadata.backoff).toBe(2);
    });

    it('should store retry metadata with error type filters', () => {
      const metadata = Reflect.getMetadata(
        'retry:options',
        TestController.prototype.filteredRetry,
      );
      
      expect(metadata).toBeDefined();
      expect(metadata.errorTypes).toEqual([ErrorType.EXTERNAL]);
      expect(metadata.excludeErrorTypes).toEqual([ErrorType.VALIDATION]);
    });

    it('should not store retry metadata on non-decorated methods', () => {
      const metadata = Reflect.getMetadata(
        'retry:options',
        TestController.prototype.noRetry,
      );
      
      expect(metadata).toBeUndefined();
    });

    it('should integrate with RetryInterceptor', async () => {
      // Create a test module with the controller and interceptor
      const moduleRef = await Test.createTestingModule({
        controllers: [TestController],
        providers: [RetryInterceptor],
      }).compile();

      const retryInterceptor = moduleRef.get<RetryInterceptor>(RetryInterceptor);
      const executionContext = createMockExecutionContext(TestController, 'defaultRetry');
      
      // Spy on the interceptor's getRetryOptions method
      const getRetryOptionsSpy = jest.spyOn(retryInterceptor as any, 'getRetryOptions');
      
      // Call the interceptor's intercept method
      await retryInterceptor.intercept(executionContext, {
        handle: () => Promise.resolve('success'),
      });
      
      // Verify the interceptor used the metadata from the decorator
      expect(getRetryOptionsSpy).toHaveBeenCalled();
      const options = getRetryOptionsSpy.mock.results[0].value;
      expect(options).toBeDefined();
      expect(options.maxAttempts).toBe(3);
    });
  });

  /**
   * Tests for the @CircuitBreaker decorator which configures external dependency failure handling
   */
  describe('@CircuitBreaker Decorator', () => {
    // Test class with decorated methods
    @Controller('test')
    class TestController {
      @CircuitBreaker({ failureThreshold: 5 })
      @Get('default-circuit')
      defaultCircuit() {
        return 'default circuit';
      }

      @CircuitBreaker({
        failureThreshold: 10,
        resetTimeout: 30000,
        halfOpenSuccessThreshold: 3,
      })
      @Get('custom-circuit')
      customCircuit() {
        return 'custom circuit';
      }

      @CircuitBreaker({
        failureThreshold: 5,
        errorTypes: [ErrorType.EXTERNAL],
      })
      @Get('filtered-circuit')
      filteredCircuit() {
        return 'filtered circuit';
      }

      @Get('no-circuit')
      noCircuit() {
        return 'no circuit';
      }
    }

    it('should store circuit breaker metadata with default options', () => {
      const metadata = Reflect.getMetadata(
        'circuit-breaker:options',
        TestController.prototype.defaultCircuit,
      );
      
      expect(metadata).toBeDefined();
      expect(metadata.failureThreshold).toBe(5);
      expect(metadata.resetTimeout).toBeDefined();
      expect(metadata.halfOpenSuccessThreshold).toBeDefined();
      expect(metadata.errorTypes).toBeUndefined();
    });

    it('should store circuit breaker metadata with custom options', () => {
      const metadata = Reflect.getMetadata(
        'circuit-breaker:options',
        TestController.prototype.customCircuit,
      );
      
      expect(metadata).toBeDefined();
      expect(metadata.failureThreshold).toBe(10);
      expect(metadata.resetTimeout).toBe(30000);
      expect(metadata.halfOpenSuccessThreshold).toBe(3);
    });

    it('should store circuit breaker metadata with error type filters', () => {
      const metadata = Reflect.getMetadata(
        'circuit-breaker:options',
        TestController.prototype.filteredCircuit,
      );
      
      expect(metadata).toBeDefined();
      expect(metadata.errorTypes).toEqual([ErrorType.EXTERNAL]);
    });

    it('should not store circuit breaker metadata on non-decorated methods', () => {
      const metadata = Reflect.getMetadata(
        'circuit-breaker:options',
        TestController.prototype.noCircuit,
      );
      
      expect(metadata).toBeUndefined();
    });

    it('should integrate with CircuitBreakerInterceptor', async () => {
      // Create a test module with the controller and interceptor
      const moduleRef = await Test.createTestingModule({
        controllers: [TestController],
        providers: [CircuitBreakerInterceptor],
      }).compile();

      const circuitBreakerInterceptor = moduleRef.get<CircuitBreakerInterceptor>(CircuitBreakerInterceptor);
      const executionContext = createMockExecutionContext(TestController, 'defaultCircuit');
      
      // Spy on the interceptor's getCircuitBreakerOptions method
      const getCircuitBreakerOptionsSpy = jest.spyOn(circuitBreakerInterceptor as any, 'getCircuitBreakerOptions');
      
      // Call the interceptor's intercept method
      await circuitBreakerInterceptor.intercept(executionContext, {
        handle: () => Promise.resolve('success'),
      });
      
      // Verify the interceptor used the metadata from the decorator
      expect(getCircuitBreakerOptionsSpy).toHaveBeenCalled();
      const options = getCircuitBreakerOptionsSpy.mock.results[0].value;
      expect(options).toBeDefined();
      expect(options.failureThreshold).toBe(5);
    });
  });

  /**
   * Tests for the @Fallback decorator which defines graceful degradation strategies
   */
  describe('@Fallback Decorator', () => {
    // Test class with decorated methods
    @Controller('test')
    class TestController {
      @Fallback({ fallbackMethod: 'defaultFallbackMethod' })
      @Get('default-fallback')
      defaultFallback() {
        return 'default fallback';
      }

      defaultFallbackMethod() {
        return 'fallback response';
      }

      @Fallback({
        fallbackMethod: 'customFallbackMethod',
        errorTypes: [ErrorType.EXTERNAL, ErrorType.TECHNICAL],
      })
      @Get('custom-fallback')
      customFallback() {
        return 'custom fallback';
      }

      customFallbackMethod() {
        return 'custom fallback response';
      }

      @Fallback({ defaultValue: { status: 'degraded', data: null } })
      @Get('value-fallback')
      valueFallback() {
        return 'value fallback';
      }

      @Get('no-fallback')
      noFallback() {
        return 'no fallback';
      }
    }

    it('should store fallback metadata with method reference', () => {
      const metadata = Reflect.getMetadata(
        'fallback:options',
        TestController.prototype.defaultFallback,
      );
      
      expect(metadata).toBeDefined();
      expect(metadata.fallbackMethod).toBe('defaultFallbackMethod');
      expect(metadata.defaultValue).toBeUndefined();
      expect(metadata.errorTypes).toBeUndefined();
    });

    it('should store fallback metadata with error type filters', () => {
      const metadata = Reflect.getMetadata(
        'fallback:options',
        TestController.prototype.customFallback,
      );
      
      expect(metadata).toBeDefined();
      expect(metadata.fallbackMethod).toBe('customFallbackMethod');
      expect(metadata.errorTypes).toEqual([ErrorType.EXTERNAL, ErrorType.TECHNICAL]);
    });

    it('should store fallback metadata with default value', () => {
      const metadata = Reflect.getMetadata(
        'fallback:options',
        TestController.prototype.valueFallback,
      );
      
      expect(metadata).toBeDefined();
      expect(metadata.defaultValue).toEqual({ status: 'degraded', data: null });
      expect(metadata.fallbackMethod).toBeUndefined();
    });

    it('should not store fallback metadata on non-decorated methods', () => {
      const metadata = Reflect.getMetadata(
        'fallback:options',
        TestController.prototype.noFallback,
      );
      
      expect(metadata).toBeUndefined();
    });

    it('should integrate with FallbackInterceptor', async () => {
      // Create a test module with the controller and interceptor
      const moduleRef = await Test.createTestingModule({
        controllers: [TestController],
        providers: [FallbackInterceptor],
      }).compile();

      const fallbackInterceptor = moduleRef.get<FallbackInterceptor>(FallbackInterceptor);
      const executionContext = createMockExecutionContext(TestController, 'defaultFallback');
      
      // Spy on the interceptor's getFallbackOptions method
      const getFallbackOptionsSpy = jest.spyOn(fallbackInterceptor as any, 'getFallbackOptions');
      
      // Call the interceptor's intercept method
      await fallbackInterceptor.intercept(executionContext, {
        handle: () => Promise.reject(new Error('Test error')),
      }).catch(() => {});
      
      // Verify the interceptor used the metadata from the decorator
      expect(getFallbackOptionsSpy).toHaveBeenCalled();
      const options = getFallbackOptionsSpy.mock.results[0].value;
      expect(options).toBeDefined();
      expect(options.fallbackMethod).toBe('defaultFallbackMethod');
    });
  });

  /**
   * Tests for the @ErrorBoundary decorator which provides controller-level error containment
   */
  describe('@ErrorBoundary Decorator', () => {
    // Test class with decorated controller
    @ErrorBoundary({
      errorTypes: [ErrorType.TECHNICAL, ErrorType.EXTERNAL],
      logErrors: true,
    })
    @Controller('test-boundary')
    class BoundaryController {
      @Get('test')
      test() {
        return 'test';
      }
    }

    // Test class without decorator
    @Controller('test-no-boundary')
    class NoBoundaryController {
      @Get('test')
      test() {
        return 'test';
      }
    }

    it('should store error boundary metadata on controller class', () => {
      const metadata = Reflect.getMetadata(
        'error-boundary:options',
        BoundaryController,
      );
      
      expect(metadata).toBeDefined();
      expect(metadata.errorTypes).toEqual([ErrorType.TECHNICAL, ErrorType.EXTERNAL]);
      expect(metadata.logErrors).toBe(true);
    });

    it('should not store error boundary metadata on non-decorated controller', () => {
      const metadata = Reflect.getMetadata(
        'error-boundary:options',
        NoBoundaryController,
      );
      
      expect(metadata).toBeUndefined();
    });

    it('should integrate with ErrorBoundaryInterceptor', async () => {
      // Create a test module with the controller and interceptor
      const moduleRef = await Test.createTestingModule({
        controllers: [BoundaryController],
        providers: [ErrorBoundaryInterceptor],
      }).compile();

      const errorBoundaryInterceptor = moduleRef.get<ErrorBoundaryInterceptor>(ErrorBoundaryInterceptor);
      const executionContext = createMockExecutionContext(BoundaryController, 'test');
      
      // Spy on the interceptor's getErrorBoundaryOptions method
      const getErrorBoundaryOptionsSpy = jest.spyOn(errorBoundaryInterceptor as any, 'getErrorBoundaryOptions');
      
      // Call the interceptor's intercept method
      await errorBoundaryInterceptor.intercept(executionContext, {
        handle: () => Promise.resolve('success'),
      });
      
      // Verify the interceptor used the metadata from the decorator
      expect(getErrorBoundaryOptionsSpy).toHaveBeenCalled();
      const options = getErrorBoundaryOptionsSpy.mock.results[0].value;
      expect(options).toBeDefined();
      expect(options.errorTypes).toEqual([ErrorType.TECHNICAL, ErrorType.EXTERNAL]);
      expect(options.logErrors).toBe(true);
    });
  });

  /**
   * Tests for the @TimeoutConfig decorator which handles request timeouts
   */
  describe('@TimeoutConfig Decorator', () => {
    // Test class with decorated methods
    @Controller('test')
    class TestController {
      @TimeoutConfig({ timeout: 5000 })
      @Get('default-timeout')
      defaultTimeout() {
        return 'default timeout';
      }

      @TimeoutConfig({ timeout: 10000, errorMessage: 'Custom timeout error' })
      @Get('custom-timeout')
      customTimeout() {
        return 'custom timeout';
      }

      @Get('no-timeout')
      noTimeout() {
        return 'no timeout';
      }
    }

    it('should store timeout metadata with default options', () => {
      const metadata = Reflect.getMetadata(
        'timeout:options',
        TestController.prototype.defaultTimeout,
      );
      
      expect(metadata).toBeDefined();
      expect(metadata.timeout).toBe(5000);
      expect(metadata.errorMessage).toBeDefined();
    });

    it('should store timeout metadata with custom options', () => {
      const metadata = Reflect.getMetadata(
        'timeout:options',
        TestController.prototype.customTimeout,
      );
      
      expect(metadata).toBeDefined();
      expect(metadata.timeout).toBe(10000);
      expect(metadata.errorMessage).toBe('Custom timeout error');
    });

    it('should not store timeout metadata on non-decorated methods', () => {
      const metadata = Reflect.getMetadata(
        'timeout:options',
        TestController.prototype.noTimeout,
      );
      
      expect(metadata).toBeUndefined();
    });

    it('should integrate with TimeoutInterceptor', async () => {
      // Create a test module with the controller and interceptor
      const moduleRef = await Test.createTestingModule({
        controllers: [TestController],
        providers: [TimeoutInterceptor],
      }).compile();

      const timeoutInterceptor = moduleRef.get<TimeoutInterceptor>(TimeoutInterceptor);
      const executionContext = createMockExecutionContext(TestController, 'defaultTimeout');
      
      // Spy on the interceptor's getTimeoutOptions method
      const getTimeoutOptionsSpy = jest.spyOn(timeoutInterceptor as any, 'getTimeoutOptions');
      
      // Call the interceptor's intercept method
      await timeoutInterceptor.intercept(executionContext, {
        handle: () => Promise.resolve('success'),
      });
      
      // Verify the interceptor used the metadata from the decorator
      expect(getTimeoutOptionsSpy).toHaveBeenCalled();
      const options = getTimeoutOptionsSpy.mock.results[0].value;
      expect(options).toBeDefined();
      expect(options.timeout).toBe(5000);
    });
  });

  /**
   * Tests for decorator composition and precedence
   */
  describe('Decorator Composition and Precedence', () => {
    // Test class with multiple decorators
    @ErrorBoundary({ logErrors: true })
    @Controller('test-composition')
    class CompositionController {
      @Retry({ maxAttempts: 3 })
      @CircuitBreaker({ failureThreshold: 5 })
      @Fallback({ fallbackMethod: 'fallbackMethod' })
      @TimeoutConfig({ timeout: 5000 })
      @Get('multi-decorated')
      multiDecorated() {
        return 'multi decorated';
      }

      fallbackMethod() {
        return 'fallback response';
      }
    }

    it('should apply all decorators correctly', () => {
      // Check that all metadata is present
      const retryMetadata = Reflect.getMetadata(
        'retry:options',
        CompositionController.prototype.multiDecorated,
      );
      const circuitBreakerMetadata = Reflect.getMetadata(
        'circuit-breaker:options',
        CompositionController.prototype.multiDecorated,
      );
      const fallbackMetadata = Reflect.getMetadata(
        'fallback:options',
        CompositionController.prototype.multiDecorated,
      );
      const timeoutMetadata = Reflect.getMetadata(
        'timeout:options',
        CompositionController.prototype.multiDecorated,
      );
      const errorBoundaryMetadata = Reflect.getMetadata(
        'error-boundary:options',
        CompositionController,
      );
      
      expect(retryMetadata).toBeDefined();
      expect(circuitBreakerMetadata).toBeDefined();
      expect(fallbackMetadata).toBeDefined();
      expect(timeoutMetadata).toBeDefined();
      expect(errorBoundaryMetadata).toBeDefined();
    });

    it('should maintain correct decorator values when composed', () => {
      // Verify each decorator's metadata is preserved correctly
      const retryMetadata = Reflect.getMetadata(
        'retry:options',
        CompositionController.prototype.multiDecorated,
      );
      const circuitBreakerMetadata = Reflect.getMetadata(
        'circuit-breaker:options',
        CompositionController.prototype.multiDecorated,
      );
      const fallbackMetadata = Reflect.getMetadata(
        'fallback:options',
        CompositionController.prototype.multiDecorated,
      );
      const timeoutMetadata = Reflect.getMetadata(
        'timeout:options',
        CompositionController.prototype.multiDecorated,
      );
      
      expect(retryMetadata.maxAttempts).toBe(3);
      expect(circuitBreakerMetadata.failureThreshold).toBe(5);
      expect(fallbackMetadata.fallbackMethod).toBe('fallbackMethod');
      expect(timeoutMetadata.timeout).toBe(5000);
    });
  });
});

/**
 * Helper function to create a mock ExecutionContext for testing interceptors
 */
function createMockExecutionContext(controller: any, methodName: string): ExecutionContext {
  return {
    getClass: () => controller,
    getHandler: () => controller.prototype[methodName],
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        url: `/test/${methodName}`,
      }),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as ExecutionContext;
}