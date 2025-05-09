/**
 * @file decorators.spec.ts
 * @description Tests for the NestJS-compatible decorators that enable declarative error handling
 * throughout the AUSTA SuperApp.
 */

import { Controller, Get, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import {
  Retry,
  CircuitBreaker,
  Fallback,
  ErrorBoundary,
  TimeoutConfig,
  ResilientOperation,
  RetryConfigs,
  ResilientConfigs,
  RETRY_METADATA_KEY,
  CIRCUIT_BREAKER_METADATA_KEY,
  FALLBACK_METADATA_KEY,
  ERROR_BOUNDARY_METADATA_KEY,
  TIMEOUT_METADATA_KEY
} from '../../../src/nest/decorators';
import { ErrorType } from '../../../src/types';
import { DEFAULT_RETRY_CONFIG } from '../../../src/constants';

describe('Error Handling Decorators', () => {
  let reflector: Reflector;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [Reflector]
    }).compile();

    reflector = moduleRef.get<Reflector>(Reflector);
  });

  describe('@Retry', () => {
    @Controller('test')
    class TestController {
      @Retry()
      @Get('default')
      defaultRetry() {
        return 'default';
      }

      @Retry({
        attempts: 5,
        initialDelay: 2000,
        backoffFactor: 1.5,
        maxDelay: 15000,
        useJitter: false,
        retryableErrors: [ErrorType.EXTERNAL]
      })
      @Get('custom')
      customRetry() {
        return 'custom';
      }

      @Retry(RetryConfigs.DATABASE)
      @Get('predefined')
      predefinedRetry() {
        return 'predefined';
      }
    }

    it('should apply default retry configuration when no options are provided', () => {
      const metadata = Reflect.getMetadata(RETRY_METADATA_KEY, TestController.prototype.defaultRetry);
      
      expect(metadata).toBeDefined();
      expect(metadata.attempts).toBe(DEFAULT_RETRY_CONFIG.MAX_ATTEMPTS);
      expect(metadata.initialDelay).toBe(DEFAULT_RETRY_CONFIG.INITIAL_DELAY_MS);
      expect(metadata.backoffFactor).toBe(DEFAULT_RETRY_CONFIG.BACKOFF_FACTOR);
      expect(metadata.maxDelay).toBe(DEFAULT_RETRY_CONFIG.MAX_DELAY_MS);
      expect(metadata.useJitter).toBe(DEFAULT_RETRY_CONFIG.USE_JITTER);
      expect(metadata.jitterFactor).toBe(DEFAULT_RETRY_CONFIG.JITTER_FACTOR);
      expect(metadata.retryableErrors).toContain(ErrorType.TECHNICAL);
      expect(metadata.retryableErrors).toContain(ErrorType.EXTERNAL);
    });

    it('should apply custom retry configuration when options are provided', () => {
      const metadata = Reflect.getMetadata(RETRY_METADATA_KEY, TestController.prototype.customRetry);
      
      expect(metadata).toBeDefined();
      expect(metadata.attempts).toBe(5);
      expect(metadata.initialDelay).toBe(2000);
      expect(metadata.backoffFactor).toBe(1.5);
      expect(metadata.maxDelay).toBe(15000);
      expect(metadata.useJitter).toBe(false);
      expect(metadata.retryableErrors).toEqual([ErrorType.EXTERNAL]);
    });

    it('should apply predefined retry configuration when using RetryConfigs', () => {
      const metadata = Reflect.getMetadata(RETRY_METADATA_KEY, TestController.prototype.predefinedRetry);
      
      expect(metadata).toBeDefined();
      expect(metadata.attempts).toBe(5); // DATABASE config
      expect(metadata.initialDelay).toBe(500); // DATABASE config
      expect(metadata.backoffFactor).toBe(1.5); // DATABASE config
    });
  });

  describe('@CircuitBreaker', () => {
    @Controller('test')
    class TestController {
      @CircuitBreaker()
      @Get('default')
      defaultCircuitBreaker() {
        return 'default';
      }

      @CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 60000,
        successThreshold: 2,
        tripErrors: [ErrorType.EXTERNAL, ErrorType.TECHNICAL],
        name: 'test-circuit'
      })
      @Get('custom')
      customCircuitBreaker() {
        return 'custom';
      }
    }

    it('should apply default circuit breaker configuration when no options are provided', () => {
      const metadata = Reflect.getMetadata(CIRCUIT_BREAKER_METADATA_KEY, TestController.prototype.defaultCircuitBreaker);
      
      expect(metadata).toBeDefined();
      expect(metadata.failureThreshold).toBe(5);
      expect(metadata.resetTimeout).toBe(30000);
      expect(metadata.successThreshold).toBe(2);
      expect(metadata.tripErrors).toContain(ErrorType.EXTERNAL);
      expect(metadata.tripErrors).toContain(ErrorType.TIMEOUT);
      expect(metadata.tripErrors).toContain(ErrorType.SERVICE_UNAVAILABLE);
    });

    it('should apply custom circuit breaker configuration when options are provided', () => {
      const metadata = Reflect.getMetadata(CIRCUIT_BREAKER_METADATA_KEY, TestController.prototype.customCircuitBreaker);
      
      expect(metadata).toBeDefined();
      expect(metadata.failureThreshold).toBe(3);
      expect(metadata.resetTimeout).toBe(60000);
      expect(metadata.successThreshold).toBe(2);
      expect(metadata.tripErrors).toEqual([ErrorType.EXTERNAL, ErrorType.TECHNICAL]);
      expect(metadata.name).toBe('test-circuit');
    });
  });

  describe('@Fallback', () => {
    @Controller('test')
    class TestController {
      @Fallback({ methodName: 'fallbackMethod' })
      @Get('method')
      methodWithFallback() {
        return 'primary';
      }

      fallbackMethod(error: Error, ...args: any[]) {
        return 'fallback';
      }

      @Fallback({
        fallbackFn: (error: Error) => 'function fallback',
        fallbackErrors: [ErrorType.EXTERNAL],
        useCachedData: true,
        maxCacheAge: 600000
      })
      @Get('function')
      functionWithFallback() {
        return 'primary';
      }
    }

    it('should apply fallback configuration with method name', () => {
      const metadata = Reflect.getMetadata(FALLBACK_METADATA_KEY, TestController.prototype.methodWithFallback);
      
      expect(metadata).toBeDefined();
      expect(metadata.methodName).toBe('fallbackMethod');
      expect(metadata.fallbackErrors).toContain(ErrorType.EXTERNAL);
      expect(metadata.fallbackErrors).toContain(ErrorType.TIMEOUT);
      expect(metadata.fallbackErrors).toContain(ErrorType.SERVICE_UNAVAILABLE);
      expect(metadata.fallbackErrors).toContain(ErrorType.TECHNICAL);
      expect(metadata.useCachedData).toBe(false);
      expect(metadata.maxCacheAge).toBe(300000); // 5 minutes default
    });

    it('should apply fallback configuration with function', () => {
      const metadata = Reflect.getMetadata(FALLBACK_METADATA_KEY, TestController.prototype.functionWithFallback);
      
      expect(metadata).toBeDefined();
      expect(metadata.fallbackFn).toBeDefined();
      expect(typeof metadata.fallbackFn).toBe('function');
      expect(metadata.fallbackErrors).toEqual([ErrorType.EXTERNAL]);
      expect(metadata.useCachedData).toBe(true);
      expect(metadata.maxCacheAge).toBe(600000);
    });
  });

  describe('@ErrorBoundary', () => {
    @ErrorBoundary()
    @Controller('test-class')
    class ClassLevelController {
      @Get('method')
      testMethod() {
        return 'test';
      }
    }

    @Controller('test-method')
    class MethodLevelController {
      @ErrorBoundary({
        catchErrors: [ErrorType.VALIDATION, ErrorType.BUSINESS],
        rethrow: true,
        handleError: (error: Error) => ({ error: error.message })
      })
      @Get('method')
      testMethod() {
        return 'test';
      }
    }

    it('should apply default error boundary configuration at class level', () => {
      const metadata = Reflect.getMetadata(ERROR_BOUNDARY_METADATA_KEY, ClassLevelController);
      
      expect(metadata).toBeDefined();
      expect(metadata.catchAll).toBe(true);
      expect(metadata.catchErrors).toContain(ErrorType.TECHNICAL);
      expect(metadata.catchErrors).toContain(ErrorType.EXTERNAL);
      expect(metadata.rethrow).toBe(false);
    });

    it('should apply custom error boundary configuration at method level', () => {
      const metadata = Reflect.getMetadata(ERROR_BOUNDARY_METADATA_KEY, MethodLevelController.prototype.testMethod);
      
      expect(metadata).toBeDefined();
      expect(metadata.catchErrors).toEqual([ErrorType.VALIDATION, ErrorType.BUSINESS]);
      expect(metadata.rethrow).toBe(true);
      expect(metadata.handleError).toBeDefined();
      expect(typeof metadata.handleError).toBe('function');
    });
  });

  describe('@TimeoutConfig', () => {
    @Controller('test')
    class TestController {
      @TimeoutConfig()
      @Get('default')
      defaultTimeout() {
        return 'default';
      }

      @TimeoutConfig({
        timeout: 5000,
        message: 'Custom timeout message',
        cancelOnTimeout: false
      })
      @Get('custom')
      customTimeout() {
        return 'custom';
      }
    }

    it('should apply default timeout configuration when no options are provided', () => {
      const metadata = Reflect.getMetadata(TIMEOUT_METADATA_KEY, TestController.prototype.defaultTimeout);
      
      expect(metadata).toBeDefined();
      expect(metadata.timeout).toBe(30000); // 30 seconds default
      expect(metadata.message).toBe('Request timed out');
      expect(metadata.cancelOnTimeout).toBe(true);
    });

    it('should apply custom timeout configuration when options are provided', () => {
      const metadata = Reflect.getMetadata(TIMEOUT_METADATA_KEY, TestController.prototype.customTimeout);
      
      expect(metadata).toBeDefined();
      expect(metadata.timeout).toBe(5000);
      expect(metadata.message).toBe('Custom timeout message');
      expect(metadata.cancelOnTimeout).toBe(false);
    });
  });

  describe('@ResilientOperation', () => {
    @Controller('test')
    class TestController {
      @ResilientOperation(
        { attempts: 3 },
        { failureThreshold: 3 },
        { methodName: 'fallbackMethod' },
        { timeout: 5000 }
      )
      @Get('combined')
      combinedOperation() {
        return 'combined';
      }

      fallbackMethod(error: Error) {
        return 'fallback';
      }

      @ResilientOperation(
        ResilientConfigs.EXTERNAL_API.retry,
        ResilientConfigs.EXTERNAL_API.circuitBreaker,
        undefined,
        ResilientConfigs.EXTERNAL_API.timeout
      )
      @Get('predefined')
      predefinedOperation() {
        return 'predefined';
      }
    }

    it('should apply multiple decorators when using ResilientOperation', () => {
      // Check retry metadata
      const retryMetadata = Reflect.getMetadata(RETRY_METADATA_KEY, TestController.prototype.combinedOperation);
      expect(retryMetadata).toBeDefined();
      expect(retryMetadata.attempts).toBe(3);

      // Check circuit breaker metadata
      const circuitBreakerMetadata = Reflect.getMetadata(CIRCUIT_BREAKER_METADATA_KEY, TestController.prototype.combinedOperation);
      expect(circuitBreakerMetadata).toBeDefined();
      expect(circuitBreakerMetadata.failureThreshold).toBe(3);

      // Check fallback metadata
      const fallbackMetadata = Reflect.getMetadata(FALLBACK_METADATA_KEY, TestController.prototype.combinedOperation);
      expect(fallbackMetadata).toBeDefined();
      expect(fallbackMetadata.methodName).toBe('fallbackMethod');

      // Check timeout metadata
      const timeoutMetadata = Reflect.getMetadata(TIMEOUT_METADATA_KEY, TestController.prototype.combinedOperation);
      expect(timeoutMetadata).toBeDefined();
      expect(timeoutMetadata.timeout).toBe(5000);
    });

    it('should apply predefined configurations when using ResilientConfigs', () => {
      // Check retry metadata
      const retryMetadata = Reflect.getMetadata(RETRY_METADATA_KEY, TestController.prototype.predefinedOperation);
      expect(retryMetadata).toBeDefined();
      expect(retryMetadata.attempts).toBe(ResilientConfigs.EXTERNAL_API.retry.attempts);

      // Check circuit breaker metadata
      const circuitBreakerMetadata = Reflect.getMetadata(CIRCUIT_BREAKER_METADATA_KEY, TestController.prototype.predefinedOperation);
      expect(circuitBreakerMetadata).toBeDefined();
      expect(circuitBreakerMetadata.failureThreshold).toBe(ResilientConfigs.EXTERNAL_API.circuitBreaker.failureThreshold);

      // Check timeout metadata
      const timeoutMetadata = Reflect.getMetadata(TIMEOUT_METADATA_KEY, TestController.prototype.predefinedOperation);
      expect(timeoutMetadata).toBeDefined();
      expect(timeoutMetadata.timeout).toBe(ResilientConfigs.EXTERNAL_API.timeout.timeout);
    });
  });

  describe('Decorator Composition', () => {
    @Controller('test')
    class TestController {
      @TimeoutConfig({ timeout: 5000 })
      @Retry({ attempts: 3 })
      @CircuitBreaker({ failureThreshold: 3 })
      @Fallback({ methodName: 'fallbackMethod' })
      @Get('composed')
      composedMethod() {
        return 'composed';
      }

      fallbackMethod(error: Error) {
        return 'fallback';
      }
    }

    it('should support composition of multiple decorators', () => {
      // Check retry metadata
      const retryMetadata = Reflect.getMetadata(RETRY_METADATA_KEY, TestController.prototype.composedMethod);
      expect(retryMetadata).toBeDefined();
      expect(retryMetadata.attempts).toBe(3);

      // Check circuit breaker metadata
      const circuitBreakerMetadata = Reflect.getMetadata(CIRCUIT_BREAKER_METADATA_KEY, TestController.prototype.composedMethod);
      expect(circuitBreakerMetadata).toBeDefined();
      expect(circuitBreakerMetadata.failureThreshold).toBe(3);

      // Check fallback metadata
      const fallbackMetadata = Reflect.getMetadata(FALLBACK_METADATA_KEY, TestController.prototype.composedMethod);
      expect(fallbackMetadata).toBeDefined();
      expect(fallbackMetadata.methodName).toBe('fallbackMethod');

      // Check timeout metadata
      const timeoutMetadata = Reflect.getMetadata(TIMEOUT_METADATA_KEY, TestController.prototype.composedMethod);
      expect(timeoutMetadata).toBeDefined();
      expect(timeoutMetadata.timeout).toBe(5000);
    });
  });

  describe('Integration with NestJS', () => {
    @ErrorBoundary()
    @Controller('test')
    class TestController {
      @Retry({ attempts: 3 })
      @CircuitBreaker({ failureThreshold: 3 })
      @Fallback({ methodName: 'fallbackMethod' })
      @TimeoutConfig({ timeout: 5000 })
      @Get('method')
      testMethod() {
        return 'test';
      }

      fallbackMethod(error: Error) {
        return 'fallback';
      }
    }

    @Module({
      controllers: [TestController]
    })
    class TestModule {}

    it('should work with NestJS testing module', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [TestModule]
      }).compile();

      const controller = moduleRef.get<TestController>(TestController);
      expect(controller).toBeDefined();

      // Use reflector to get metadata
      const retryMetadata = reflector.get(RETRY_METADATA_KEY, TestController.prototype.testMethod);
      expect(retryMetadata).toBeDefined();
      expect(retryMetadata.attempts).toBe(3);

      const circuitBreakerMetadata = reflector.get(CIRCUIT_BREAKER_METADATA_KEY, TestController.prototype.testMethod);
      expect(circuitBreakerMetadata).toBeDefined();
      expect(circuitBreakerMetadata.failureThreshold).toBe(3);

      const fallbackMetadata = reflector.get(FALLBACK_METADATA_KEY, TestController.prototype.testMethod);
      expect(fallbackMetadata).toBeDefined();
      expect(fallbackMetadata.methodName).toBe('fallbackMethod');

      const timeoutMetadata = reflector.get(TIMEOUT_METADATA_KEY, TestController.prototype.testMethod);
      expect(timeoutMetadata).toBeDefined();
      expect(timeoutMetadata.timeout).toBe(5000);

      const errorBoundaryMetadata = reflector.get(ERROR_BOUNDARY_METADATA_KEY, TestController);
      expect(errorBoundaryMetadata).toBeDefined();
      expect(errorBoundaryMetadata.catchAll).toBe(true);
    });
  });
});