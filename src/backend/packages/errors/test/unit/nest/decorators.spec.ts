/**
 * @file decorators.spec.ts
 * @description Tests for NestJS-compatible decorators that enable declarative error handling
 * 
 * This file contains tests for the decorators that enable developers to define retry policies,
 * circuit breaker configurations, fallback strategies, and error boundaries directly on
 * controller methods or classes. These tests verify that the decorators correctly store
 * metadata and integrate with their corresponding interceptors.
 */

import { Controller, Get, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import {
  Retry,
  CircuitBreaker,
  Fallback,
  ErrorBoundary,
  TimeoutConfig,
  ErrorHandling,
  RETRY_METADATA_KEY,
  CIRCUIT_BREAKER_METADATA_KEY,
  FALLBACK_METADATA_KEY,
  ERROR_BOUNDARY_METADATA_KEY,
  TIMEOUT_METADATA_KEY,
  RetryConfig,
  CircuitBreakerConfig,
  FallbackConfig,
  ErrorBoundaryConfig,
  TimeoutConfig as TimeoutConfigType
} from '../../../src/nest/decorators';
import { ErrorType, ErrorCategory } from '../../../src/types';
import { RETRY_CONFIG, CIRCUIT_BREAKER_CONFIG, FALLBACK_STRATEGY } from '../../../src/constants';

describe('Error Handling Decorators', () => {
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Reflector]
    }).compile();

    reflector = module.get<Reflector>(Reflector);
  });

  describe('@Retry decorator', () => {
    // Test class with decorated methods
    @Controller('test')
    class TestController {
      @Retry({
        maxAttempts: 3,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffFactor: 2,
        jitterFactor: 0.1,
        retryableErrors: [ErrorType.EXTERNAL]
      })
      customRetry() {}

      @Retry('DATABASE')
      predefinedRetry() {}

      // Method without decorator for negative testing
      noRetry() {}
    }

    it('should store custom retry configuration as metadata', () => {
      const metadata = reflector.get(RETRY_METADATA_KEY, TestController.prototype.customRetry);
      
      expect(metadata).toBeDefined();
      expect(metadata.maxAttempts).toBe(3);
      expect(metadata.initialDelayMs).toBe(100);
      expect(metadata.maxDelayMs).toBe(1000);
      expect(metadata.backoffFactor).toBe(2);
      expect(metadata.jitterFactor).toBe(0.1);
      expect(metadata.retryableErrors).toContain(ErrorType.EXTERNAL);
    });

    it('should store predefined retry configuration as metadata', () => {
      const metadata = reflector.get(RETRY_METADATA_KEY, TestController.prototype.predefinedRetry);
      
      expect(metadata).toBeDefined();
      expect(metadata.maxAttempts).toBe(RETRY_CONFIG.DATABASE.MAX_ATTEMPTS);
      expect(metadata.initialDelayMs).toBe(RETRY_CONFIG.DATABASE.INITIAL_DELAY_MS);
      expect(metadata.maxDelayMs).toBe(RETRY_CONFIG.DATABASE.MAX_DELAY_MS);
      expect(metadata.backoffFactor).toBe(RETRY_CONFIG.DATABASE.BACKOFF_FACTOR);
      expect(metadata.jitterFactor).toBe(RETRY_CONFIG.DATABASE.JITTER_FACTOR);
    });

    it('should not store metadata on methods without the decorator', () => {
      const metadata = reflector.get(RETRY_METADATA_KEY, TestController.prototype.noRetry);
      expect(metadata).toBeUndefined();
    });

    it('should throw an error when an invalid predefined configuration is provided', () => {
      expect(() => {
        class InvalidController {
          @Retry('INVALID_CONFIG' as any)
          invalidMethod() {}
        }
      }).toThrow("Predefined retry configuration 'INVALID_CONFIG' not found");
    });
  });

  describe('@CircuitBreaker decorator', () => {
    // Test class with decorated methods
    @Controller('test')
    class TestController {
      @CircuitBreaker({
        failureThresholdPercentage: 50,
        requestVolumeThreshold: 20,
        rollingWindowMs: 10000,
        resetTimeoutMs: 30000,
        trippingErrors: [ErrorType.EXTERNAL]
      })
      customCircuitBreaker() {}

      @CircuitBreaker('CRITICAL')
      predefinedCircuitBreaker() {}

      // Method without decorator for negative testing
      noCircuitBreaker() {}
    }

    it('should store custom circuit breaker configuration as metadata', () => {
      const metadata = reflector.get(CIRCUIT_BREAKER_METADATA_KEY, TestController.prototype.customCircuitBreaker);
      
      expect(metadata).toBeDefined();
      expect(metadata.failureThresholdPercentage).toBe(50);
      expect(metadata.requestVolumeThreshold).toBe(20);
      expect(metadata.rollingWindowMs).toBe(10000);
      expect(metadata.resetTimeoutMs).toBe(30000);
      expect(metadata.trippingErrors).toContain(ErrorType.EXTERNAL);
    });

    it('should store predefined circuit breaker configuration as metadata', () => {
      const metadata = reflector.get(CIRCUIT_BREAKER_METADATA_KEY, TestController.prototype.predefinedCircuitBreaker);
      
      expect(metadata).toBeDefined();
      expect(metadata.failureThresholdPercentage).toBe(CIRCUIT_BREAKER_CONFIG.CRITICAL.FAILURE_THRESHOLD_PERCENTAGE);
      expect(metadata.requestVolumeThreshold).toBe(CIRCUIT_BREAKER_CONFIG.CRITICAL.REQUEST_VOLUME_THRESHOLD);
      expect(metadata.rollingWindowMs).toBe(CIRCUIT_BREAKER_CONFIG.CRITICAL.ROLLING_WINDOW_MS);
      expect(metadata.resetTimeoutMs).toBe(CIRCUIT_BREAKER_CONFIG.CRITICAL.RESET_TIMEOUT_MS);
    });

    it('should not store metadata on methods without the decorator', () => {
      const metadata = reflector.get(CIRCUIT_BREAKER_METADATA_KEY, TestController.prototype.noCircuitBreaker);
      expect(metadata).toBeUndefined();
    });

    it('should throw an error when an invalid predefined configuration is provided', () => {
      expect(() => {
        class InvalidController {
          @CircuitBreaker('INVALID_CONFIG' as any)
          invalidMethod() {}
        }
      }).toThrow("Predefined circuit breaker configuration 'INVALID_CONFIG' not found");
    });
  });

  describe('@Fallback decorator', () => {
    // Test class with decorated methods
    @Controller('test')
    class TestController {
      @Fallback({
        strategy: 'CUSTOM',
        fallbackFn: (error: any, context: any) => ({ name: 'Default User' }),
        fallbackErrors: [ErrorType.EXTERNAL],
        cacheTtlMs: 300000
      })
      customFallback() {}

      @Fallback('USE_CACHED_DATA')
      predefinedFallback() {}

      // Method without decorator for negative testing
      noFallback() {}
    }

    it('should store custom fallback configuration as metadata', () => {
      const metadata = reflector.get(FALLBACK_METADATA_KEY, TestController.prototype.customFallback);
      
      expect(metadata).toBeDefined();
      expect(metadata.strategy).toBe('CUSTOM');
      expect(metadata.fallbackFn).toBeDefined();
      expect(typeof metadata.fallbackFn).toBe('function');
      expect(metadata.fallbackErrors).toContain(ErrorType.EXTERNAL);
      expect(metadata.cacheTtlMs).toBe(300000);
    });

    it('should store predefined fallback configuration as metadata', () => {
      const metadata = reflector.get(FALLBACK_METADATA_KEY, TestController.prototype.predefinedFallback);
      
      expect(metadata).toBeDefined();
      expect(metadata.strategy).toBe(FALLBACK_STRATEGY.USE_CACHED_DATA);
    });

    it('should not store metadata on methods without the decorator', () => {
      const metadata = reflector.get(FALLBACK_METADATA_KEY, TestController.prototype.noFallback);
      expect(metadata).toBeUndefined();
    });

    it('should throw an error when an invalid predefined strategy is provided', () => {
      expect(() => {
        class InvalidController {
          @Fallback('INVALID_STRATEGY' as any)
          invalidMethod() {}
        }
      }).toThrow("Predefined fallback strategy 'INVALID_STRATEGY' not found");
    });
  });

  describe('@ErrorBoundary decorator', () => {
    // Test class with decorated methods
    @Controller('test')
    @ErrorBoundary({
      catchErrors: [ErrorCategory.BUSINESS, ErrorCategory.VALIDATION],
      rethrowErrors: [ErrorType.UNAUTHORIZED],
      logErrors: true,
      includeStackTrace: false
    })
    class TestController {
      // Method without decorator for negative testing
      noErrorBoundary() {}
    }

    it('should store error boundary configuration as metadata on the class', () => {
      const metadata = reflector.get(ERROR_BOUNDARY_METADATA_KEY, TestController);
      
      expect(metadata).toBeDefined();
      expect(metadata.catchErrors).toContain(ErrorCategory.BUSINESS);
      expect(metadata.catchErrors).toContain(ErrorCategory.VALIDATION);
      expect(metadata.rethrowErrors).toContain(ErrorType.UNAUTHORIZED);
      expect(metadata.logErrors).toBe(true);
      expect(metadata.includeStackTrace).toBe(false);
    });

    it('should not store metadata on methods without the decorator', () => {
      const metadata = reflector.get(ERROR_BOUNDARY_METADATA_KEY, TestController.prototype.noErrorBoundary);
      expect(metadata).toBeUndefined();
    });
  });

  describe('@TimeoutConfig decorator', () => {
    // Test class with decorated methods
    @Controller('test')
    class TestController {
      @TimeoutConfig({
        timeoutMs: 10000,
        cancelOnTimeout: true,
        errorMessage: 'Custom timeout message'
      })
      customTimeout() {}

      @TimeoutConfig(5000)
      simpleTimeout() {}

      // Method without decorator for negative testing
      noTimeout() {}
    }

    it('should store custom timeout configuration as metadata', () => {
      const metadata = reflector.get(TIMEOUT_METADATA_KEY, TestController.prototype.customTimeout);
      
      expect(metadata).toBeDefined();
      expect(metadata.timeoutMs).toBe(10000);
      expect(metadata.cancelOnTimeout).toBe(true);
      expect(metadata.errorMessage).toBe('Custom timeout message');
    });

    it('should store simple timeout configuration as metadata', () => {
      const metadata = reflector.get(TIMEOUT_METADATA_KEY, TestController.prototype.simpleTimeout);
      
      expect(metadata).toBeDefined();
      expect(metadata.timeoutMs).toBe(5000);
    });

    it('should not store metadata on methods without the decorator', () => {
      const metadata = reflector.get(TIMEOUT_METADATA_KEY, TestController.prototype.noTimeout);
      expect(metadata).toBeUndefined();
    });
  });

  describe('@ErrorHandling decorator composition', () => {
    // Test class with composed decorators
    @Controller('test')
    class TestController {
      @ErrorHandling([
        Retry('DATABASE'),
        CircuitBreaker('DEFAULT'),
        Fallback('USE_CACHED_DATA'),
        TimeoutConfig(5000)
      ])
      composedDecorators() {}
    }

    it('should apply all decorators when using ErrorHandling composition', () => {
      // Check that all metadata is correctly applied
      const retryMetadata = reflector.get(RETRY_METADATA_KEY, TestController.prototype.composedDecorators);
      const circuitBreakerMetadata = reflector.get(CIRCUIT_BREAKER_METADATA_KEY, TestController.prototype.composedDecorators);
      const fallbackMetadata = reflector.get(FALLBACK_METADATA_KEY, TestController.prototype.composedDecorators);
      const timeoutMetadata = reflector.get(TIMEOUT_METADATA_KEY, TestController.prototype.composedDecorators);
      
      expect(retryMetadata).toBeDefined();
      expect(circuitBreakerMetadata).toBeDefined();
      expect(fallbackMetadata).toBeDefined();
      expect(timeoutMetadata).toBeDefined();
      
      // Verify specific values to ensure correct application
      expect(retryMetadata.maxAttempts).toBe(RETRY_CONFIG.DATABASE.MAX_ATTEMPTS);
      expect(circuitBreakerMetadata.failureThresholdPercentage).toBe(CIRCUIT_BREAKER_CONFIG.DEFAULT.FAILURE_THRESHOLD_PERCENTAGE);
      expect(fallbackMetadata.strategy).toBe(FALLBACK_STRATEGY.USE_CACHED_DATA);
      expect(timeoutMetadata.timeoutMs).toBe(5000);
    });
  });

  describe('Decorator integration with interceptors', () => {
    // This section tests that the decorators correctly integrate with their corresponding interceptors
    // We'll mock the interceptors and verify they can correctly read the metadata

    // Mock interceptor factory that reads metadata
    const createMockInterceptor = (metadataKey: string) => {
      return {
        intercept: jest.fn((context, next) => {
          const handler = context.getHandler();
          const metadata = reflector.get(metadataKey, handler);
          return { metadata };
        })
      };
    };

    @Controller('test')
    class TestController {
      @Retry({
        maxAttempts: 3,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffFactor: 2,
        jitterFactor: 0.1
      })
      retryMethod() {}

      @CircuitBreaker({
        failureThresholdPercentage: 50,
        requestVolumeThreshold: 20,
        rollingWindowMs: 10000,
        resetTimeoutMs: 30000
      })
      circuitBreakerMethod() {}

      @Fallback({
        strategy: 'CUSTOM',
        fallbackFn: () => ({})
      })
      fallbackMethod() {}

      @TimeoutConfig(5000)
      timeoutMethod() {}
    }

    it('should allow RetryInterceptor to access retry metadata', () => {
      const mockInterceptor = createMockInterceptor(RETRY_METADATA_KEY);
      const mockContext = {
        getHandler: () => TestController.prototype.retryMethod,
        switchToHttp: () => ({ getRequest: () => ({}) })
      };
      const mockNext = { handle: () => ({}) };

      const result = mockInterceptor.intercept(mockContext as any, mockNext as any);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.maxAttempts).toBe(3);
      expect(result.metadata.initialDelayMs).toBe(100);
    });

    it('should allow CircuitBreakerInterceptor to access circuit breaker metadata', () => {
      const mockInterceptor = createMockInterceptor(CIRCUIT_BREAKER_METADATA_KEY);
      const mockContext = {
        getHandler: () => TestController.prototype.circuitBreakerMethod,
        switchToHttp: () => ({ getRequest: () => ({}) })
      };
      const mockNext = { handle: () => ({}) };

      const result = mockInterceptor.intercept(mockContext as any, mockNext as any);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.failureThresholdPercentage).toBe(50);
      expect(result.metadata.requestVolumeThreshold).toBe(20);
    });

    it('should allow FallbackInterceptor to access fallback metadata', () => {
      const mockInterceptor = createMockInterceptor(FALLBACK_METADATA_KEY);
      const mockContext = {
        getHandler: () => TestController.prototype.fallbackMethod,
        switchToHttp: () => ({ getRequest: () => ({}) })
      };
      const mockNext = { handle: () => ({}) };

      const result = mockInterceptor.intercept(mockContext as any, mockNext as any);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.strategy).toBe('CUSTOM');
      expect(typeof result.metadata.fallbackFn).toBe('function');
    });

    it('should allow TimeoutInterceptor to access timeout metadata', () => {
      const mockInterceptor = createMockInterceptor(TIMEOUT_METADATA_KEY);
      const mockContext = {
        getHandler: () => TestController.prototype.timeoutMethod,
        switchToHttp: () => ({ getRequest: () => ({}) })
      };
      const mockNext = { handle: () => ({}) };

      const result = mockInterceptor.intercept(mockContext as any, mockNext as any);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.timeoutMs).toBe(5000);
    });
  });
});